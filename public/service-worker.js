// Service Worker para gerenciar notificações push e cache offline

// Nome do cache para armazenamento offline
const CACHE_NAME = "nossa-rotina-cache-v1";

// Arquivos para armazenar em cache para funcionamento offline
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Evento de instalação - armazena arquivos em cache
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Cache aberto");
      return cache.addAll(urlsToCache);
    })
  );
});

// Evento de ativação - limpa caches antigos
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Ativando...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removendo cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Evento de fetch - responde com recursos em cache quando offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - retorna a resposta do cache
      if (response) {
        return response;
      }

      // Caso contrário, busca na rede
      return fetch(event.request).then((response) => {
        // Verifica se recebemos uma resposta válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone a resposta para armazenar no cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Evento de push - recebe notificações push
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push recebido");

  let notificationData = {};

  try {
    // Tentar extrair os dados da notificação
    if (event.data) {
      notificationData = event.data.json();
      console.log("[Service Worker] Dados da notificação:", notificationData);
    }
  } catch (error) {
    console.error(
      "[Service Worker] Erro ao processar dados da notificação:",
      error
    );
  }

  // Valores padrão caso não receba dados completos
  const title = notificationData.title || "Notificação";
  const options = {
    body: notificationData.body || "Você tem uma nova notificação",
    icon: notificationData.icon || "/icons/icon-192x192.png",
    badge: notificationData.badge || "/icons/icon-192x192.png",
    tag: notificationData.tag || "default-notification",
    data: notificationData.data || {},
    requireInteraction: notificationData.requireInteraction || false,
    renotify: notificationData.renotify || false,
    silent: notificationData.silent || false,
    actions: notificationData.actions || [],
  };

  // Garantir que o evento não termine antes da notificação ser exibida
  event.waitUntil(
    // Exibir a notificação
    self.registration
      .showNotification(title, options)
      .then(() => {
        console.log("[Service Worker] Notificação exibida com sucesso");
      })
      .catch((error) => {
        console.error("[Service Worker] Erro ao exibir notificação:", error);
      })
  );
});

// Evento de notificationclick - lidar com cliques nas notificações
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notificação clicada", event.notification.tag);

  // Fechar a notificação
  event.notification.close();

  // Extrair dados da notificação
  const notificationData = event.notification.data || {};
  const referenceType = notificationData.referenceType;
  const referenceId = notificationData.referenceId;

  // Determinar para qual URL redirecionar com base no tipo de notificação
  let url = "/";

  if (referenceType === "task" && referenceId) {
    url = `/tasks?id=${referenceId}`;
  } else if (referenceType === "event" && referenceId) {
    url = `/events?id=${referenceId}`;
  } else if (referenceType === "message") {
    url = "/messages";
  } else if (referenceType === "partner") {
    url = "/partner";
  } else if (referenceType === "test") {
    url = "/notifications";
  }

  // Verificar se foi clicado em uma ação específica
  if (event.action) {
    console.log("[Service Worker] Ação clicada:", event.action);

    // Personalizar comportamento com base na ação
    switch (event.action) {
      case "view":
        // Já estamos redirecionando para a visualização padrão
        break;
      case "dismiss":
        // Apenas fechar a notificação sem abrir a aplicação
        return;
      case "respond":
        // Redirecionar para uma página de resposta
        url = `/respond?type=${referenceType}&id=${referenceId}`;
        break;
      default:
        // Para ações personalizadas, podemos adicionar parâmetros à URL
        url = `${url}&action=${event.action}`;
    }
  }

  // Abrir ou focar na janela existente e navegar para a URL apropriada
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Verificar se já existe uma janela aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Focar na janela existente e navegar para a URL
            return client.focus().then((focusedClient) => {
              if (focusedClient && "navigate" in focusedClient) {
                return focusedClient.navigate(url);
              }
            });
          }
        }

        // Se não houver janela aberta, abrir uma nova
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error(
          "[Service Worker] Erro ao processar clique na notificação:",
          error
        );
      })
  );
});

// Evento de notificationclose - registrar quando uma notificação é fechada sem interação
self.addEventListener("notificationclose", (event) => {
  console.log(
    "[Service Worker] Notificação fechada sem interação",
    event.notification.tag
  );

  // Aqui poderíamos enviar uma métrica para o servidor para análise de engajamento
  const notificationData = event.notification.data || {};

  // Exemplo de como poderíamos registrar este evento (não implementado)
  // fetch('/api/notification-metrics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     action: 'closed',
  //     notificationId: notificationData.notificationId,
  //     timestamp: Date.now()
  //   })
  // }).catch(err => console.error('Erro ao registrar métrica:', err));
});

// Evento de sync - para sincronização em segundo plano
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Evento de sincronização recebido", event.tag);

  if (event.tag === "sync-notifications") {
    event.waitUntil(
      // Aqui poderíamos implementar uma sincronização de notificações em segundo plano
      fetch("/api/notifications")
        .then((response) => response.json())
        .then((data) => {
          console.log("[Service Worker] Notificações sincronizadas:", data);
          // Processar notificações não lidas, etc.
        })
        .catch((error) => {
          console.error("[Service Worker] Erro na sincronização:", error);
        })
    );
  }
});

// Evento de pushsubscriptionchange - quando a assinatura push é alterada pelo navegador
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("[Service Worker] Assinatura push alterada");

  // Obter a nova assinatura e atualizar no servidor
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        // Precisamos da applicationServerKey aqui, mas não temos acesso direto
        // Uma solução seria armazenar a chave no IndexedDB quando o usuário se inscreve
      })
      .then((newSubscription) => {
        // Enviar a nova assinatura para o servidor
        return fetch("/api/push/update-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription
              ? event.oldSubscription.endpoint
              : null,
            newSubscription: newSubscription,
          }),
        });
      })
      .catch((error) => {
        console.error(
          "[Service Worker] Erro ao atualizar assinatura push:",
          error
        );
      })
  );
});

console.log("Service Worker carregado com sucesso!");
