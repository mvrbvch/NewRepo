// Nome do cache para armazenar arquivos offline
const CACHE_NAME = 'por-nos-v1';

// Lista de URLs para pré-cachear (recursos estáticos principais)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Instalar o Service Worker e pré-cachear os recursos estáticos
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalação');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pré-cacheando recursos');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Force o service worker a ativar imediatamente
        return self.skipWaiting();
      })
  );
});

// Limpar caches antigos quando o service worker for ativado
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativação');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('[Service Worker] Removendo cache antigo:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Tome controle de todas as páginas imediatamente
      return self.clients.claim();
    })
  );
});

// Estratégia de cache e rede para requisições
self.addEventListener('fetch', event => {
  // Ignora requisições de API, análise, WebSockets, e outras conexões especiais
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('analytics') ||
      event.request.url.includes('socket.io') ||
      event.request.url.includes('ws:') ||
      event.request.url.includes('wss:') ||
      event.request.url.includes('replit.com')) {
    return;
  }
  
  // Log para ajudar na depuração
  console.log('[Service Worker] Processando fetch para:', event.request.url);
  
  // Para requisições de navegação (HTML), sempre vá para a rede primeiro
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Se não conseguir acessar a rede, tente o cache
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Para outras requisições, tente o cache primeiro, com fallback para a rede
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retorne do cache se existir, caso contrário busque da rede
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            // Não cache se não for uma resposta válida ou não for GET
            if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
              return response;
            }

            // Não tente armazenar em cache URLs de chrome-extension
            if (event.request.url.startsWith('chrome-extension://')) {
              return response;
            }

            // Clone a resposta porque o body só pode ser consumido uma vez
            let responseToCache = response.clone();

            // Armazene em cache para uso futuro offline
            caches.open(CACHE_NAME)
              .then(cache => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.error('[Service Worker] Erro ao armazenar em cache:', error);
                }
              });

            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Erro de rede:', error);
            
            // Para imagens, podemos fornecer uma imagem de fallback
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('/icons/icon-192x192.png');
            }
            
            // Para outros recursos, retornamos uma resposta de erro
            return new Response('Offline - Conteúdo não disponível', {
              status: 503,
              statusText: 'Serviço indisponível'
            });
          });
      })
  );
});

// Lidar com notificações push
self.addEventListener('push', event => {
  console.log('[Service Worker] Notificação push recebida', event);

  let payload;
  try {
    payload = event.data.json();
    console.log('[Service Worker] Payload da notificação:', payload);
  } catch (e) {
    console.error('[Service Worker] Erro ao analisar payload:', e);
    payload = {
      title: 'Por Nós',
      body: event.data ? event.data.text() : 'Notificação sem detalhes',
      icon: '/icons/icon-192x192.png'
    };
  }

  const options = {
    body: payload.body || 'Notificação do Por Nós',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {},
    actions: payload.actions || [],
    vibrate: [100, 50, 100],
    tag: payload.tag || 'default',
    requireInteraction: payload.requireInteraction || false,
    renotify: payload.renotify || false,
    silent: payload.silent || false
  };

  // Log detalhado para depuração
  console.log('[Service Worker] Mostrando notificação:', {
    title: payload.title || 'Por Nós',
    options
  });

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Por Nós', options)
      .then(() => {
        console.log('[Service Worker] Notificação exibida com sucesso');
      })
      .catch(err => {
        console.error('[Service Worker] Erro ao exibir notificação:', err);
      })
  );
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Clique em notificação', event);
  
  event.notification.close();

  const payload = event.notification.data;
  const action = event.action;
  
  let url = '/';
  
  // Se for uma notificação de tarefa, redirecionar para a página de tarefas
  if (payload && payload.referenceType === 'task') {
    url = '/tasks';
  }
  // Se for uma notificação de evento, redirecionar para a página do calendário
  else if (payload && payload.referenceType === 'event') {
    url = '/';
  }
  
  // Verificar se já temos uma janela aberta e navegar para a URL
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
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