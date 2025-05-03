// Nome do cache para armazenar arquivos offline
const CACHE_NAME = "por-nos-v2";

// Lista de URLs para pré-cachear (recursos estáticos principais)
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

// Instalar o Service Worker e pré-cachear os recursos estáticos
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalação");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Pré-cacheando recursos");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Force o service worker a ativar imediatamente
        return self.skipWaiting();
      })
  );
});

// Limpar caches antigos quando o service worker for ativado
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Ativação");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log(
                "[Service Worker] Removendo cache antigo:",
                cacheName
              );
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Tome controle de todas as páginas imediatamente
        return self.clients.claim();
      })
  );
});

// Estratégia de cache e rede para requisições
self.addEventListener("fetch", (event) => {
  // Ignora requisições de API, análise, WebSockets, e outras conexões especiais
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("analytics") ||
    event.request.url.includes("socket.io") ||
    event.request.url.includes("ws:") ||
    event.request.url.includes("wss:") ||
    event.request.url.includes("replit.com")
  ) {
    return;
  }

  // Log para ajudar na depuração
  console.log("[Service Worker] Processando fetch para:", event.request.url);

  // Para requisições de navegação (HTML), sempre vá para a rede primeiro
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Se não conseguir acessar a rede, tente o cache
        return caches.match("/index.html");
      })
    );
    return;
  }

  // Para outras requisições, tente o cache primeiro, com fallback para a rede
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retorne do cache se existir, caso contrário busque da rede
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Não cache se não for uma resposta válida ou não for GET
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic" ||
            event.request.method !== "GET"
          ) {
            return response;
          }

          // Não tente armazenar em cache URLs de chrome-extension
          if (event.request.url.startsWith("chrome-extension://")) {
            return response;
          }

          // Clone a resposta porque o body só pode ser consumido uma vez
          let responseToCache = response.clone();

          // Armazene em cache para uso futuro offline
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, responseToCache);
            } catch (error) {
              console.error(
                "[Service Worker] Erro ao armazenar em cache:",
                error
              );
            }
          });

          return response;
        })
        .catch((error) => {
          console.error("[Service Worker] Erro de rede:", error);

          // Para imagens, podemos fornecer uma imagem de fallback
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
            return caches.match("/icons/icon-192x192.png");
          }

          // Para outros recursos, retornamos uma resposta de erro
          return new Response("Offline - Conteúdo não disponível", {
            status: 503,
            statusText: "Serviço indisponível",
          });
        });
    })
  );
});

// Lidar com notificações push
self.addEventListener("push", (event) => {
  console.log(
    "[Service Worker] Notificação push recebida",
    new Date().toISOString()
  );

  // Logs detalhados do evento
  try {
    console.log(
      "[Service Worker] Dados brutos:",
      event.data ? event.data.text() : "Sem dados"
    );

    if (event.data) {
      const rawText = event.data.text();
      console.log("[Service Worker] Comprimento dos dados:", rawText.length);
      console.log(
        "[Service Worker] Primeiros 100 caracteres:",
        rawText.substring(0, 100)
      );
    }
  } catch (logError) {
    console.error("[Service Worker] Erro ao registrar dados brutos:", logError);
  }

  let payload;
  try {
    // Tentar extrair o payload como JSON
    payload = event.data ? event.data.json() : null;
    console.log(
      "[Service Worker] Payload JSON extraído com sucesso:",
      JSON.stringify(payload)
    );
  } catch (jsonError) {
    console.error("[Service Worker] Erro ao extrair payload JSON:", jsonError);

    // Fallback para texto
    try {
      const textData = event.data
        ? event.data.text()
        : "Notificação sem detalhes";
      console.log("[Service Worker] Dados de texto:", textData);

      // Tentar analisar manualmente como JSON
      try {
        payload = JSON.parse(textData);
        console.log(
          "[Service Worker] Payload convertido de texto para JSON:",
          payload
        );
      } catch (parseError) {
        console.error(
          "[Service Worker] Não foi possível converter texto para JSON:",
          parseError
        );
        // Usar o texto como corpo da notificação
        payload = {
          title: "Nós Juntos",
          body: textData,
          icon: "/icons/icon-192x192.png",
        };
      }
    } catch (textError) {
      console.error("[Service Worker] Erro ao extrair texto:", textError);
      // Fallback completo
      payload = {
        title: "Nós Juntos",
        body: "Nova notificação recebida",
        icon: "/icons/icon-192x192.png",
      };
    }
  }

  // Se não recebemos um payload válido, use valores padrão
  if (!payload) {
    console.warn("[Service Worker] Payload indefinido, usando valores padrão");
    payload = {
      title: "Nós Juntos",
      body: "Nova notificação recebida",
      icon: "/icons/icon-192x192.png",
    };
  }

  // Adicionando timestamp único para debug
  const timestamp = new Date().toISOString();
  const debugId = Math.random().toString(36).substring(2, 8);

  console.log(
    `[Service Worker] [${debugId}] Processando notificação às ${timestamp}`
  );
  console.log(`[Service Worker] [${debugId}] Título: ${payload.title}`);
  console.log(`[Service Worker] [${debugId}] Corpo: ${payload.body}`);

  if (payload.data) {
    console.log(
      `[Service Worker] [${debugId}] Dados adicionais:`,
      JSON.stringify(payload.data)
    );
  }

  if (payload.actions && payload.actions.length > 0) {
    console.log(
      `[Service Worker] [${debugId}] Ações:`,
      JSON.stringify(payload.actions)
    );
  }

  const options = {
    body: payload.body || "Notificação do Nós Juntos",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: {
      ...(payload.data || {}),
      debugId,
      timestamp,
    },
    actions: payload.actions || [],
    vibrate: [100, 50, 100],
    tag: payload.tag || "default",
    requireInteraction: payload.requireInteraction || false,
  };

  console.log("[Service Worker] Opções de notificação configuradas:", options);

  event.waitUntil(
    self.registration.showNotification(payload.title || "Nós Juntos", options)
  );
});

// Lidar com cliques em notificações
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Clique em notificação", event);

  event.notification.close();

  const payload = event.notification.data;
  const action = event.action;

  let url = "/dashboard";

  // Se for uma notificação de tarefa, redirecionar para a página de tarefas
  if (payload && payload.referenceType === "task") {
    url = `/tasks?${payload.referenceId ? `taskId=${payload.referenceId}` : ""}`;
  }
  // Se for uma notificação de evento, redirecionar para a página do calendário
  else if (payload && payload.referenceType === "event") {
    url = `/calendar?${payload.referenceId ? `eventId=${payload.referenceId}` : ""}`;
  }

  // Verificar se já temos uma janela aberta e navegar para a URL
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Se não tiver uma janela aberta, abra uma nova
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
