// Firebase Cloud Messaging Service Worker

// Versão do service worker para cache e atualizações
const FCM_SW_VERSION = '1.0.0';

// Nome do cache usado por este service worker
const CACHE_NAME = `fcm-sw-cache-${FCM_SW_VERSION}`;

// Scripts do Firebase necessários para o service worker
importScripts('https://www.gstatic.com/firebasejs/9.19.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.19.1/firebase-messaging-compat.js');

// Inicialização do Firebase com as credenciais do projeto
firebase.initializeApp({
  apiKey: 'AIzaSyDoWoGJDLmf04-NVTbcpxZ5bhVl1PVp0OU',
  authDomain: 'nosso-calendario-4b5a6.firebaseapp.com',
  projectId: 'nosso-calendario-4b5a6',
  storageBucket: 'nosso-calendario-4b5a6.appspot.com',
  messagingSenderId: '975343937532',
  appId: '1:975343937532:web:9c2f4db5e6d5c32ef0f8f8'
});

// Obter uma instância do Firebase Messaging
const messaging = firebase.messaging();

// Manipulador para mensagens em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano:', payload);
  
  // Personalizar a notificação
  const notificationTitle = payload.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova atualização',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {},
    // Adicionando timestamp e ID para debug
    timestamp: new Date().toISOString(),
    tag: payload.notification?.tag || `notification-${Date.now()}`,
    requireInteraction: payload.notification?.requireInteraction || true
  };
  
  // Exibir a notificação
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Evento de instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker instalado');
  // Ativar imediatamente sem esperar pela atualização da página
  self.skipWaiting();
});

// Evento de ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker ativado');
  // Reivindicar o controle imediatamente
  event.waitUntil(clients.claim());
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[firebase-messaging-sw.js] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manipular cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Clique em notificação', event);
  
  event.notification.close();
  
  // Extrair dados da notificação
  const notificationData = event.notification.data || {};
  const referenceType = notificationData.referenceType || 'default';
  
  // Determinar para qual URL navegar com base no tipo de notificação
  let url = '/';
  
  if (referenceType === 'task') {
    url = '/tasks';
  } else if (referenceType === 'event') {
    url = '/';
  }
  
  // Verificar se já existe uma janela aberta e focar nela
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      
      // Se não houver janela aberta, abrir uma nova
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Evento para sincronização em segundo plano (opcional, para futuros recursos)
self.addEventListener('sync', (event) => {
  console.log('[firebase-messaging-sw.js] Sincronização em segundo plano:', event.tag);
});

console.log('[firebase-messaging-sw.js] Firebase Messaging Service Worker inicializado');