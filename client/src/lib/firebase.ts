import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Configuração do Firebase com variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let firebaseApp: any = null;
let messaging: any = null;

// Inicializar o Firebase
export const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      console.log('Inicializando Firebase...');
      firebaseApp = initializeApp(firebaseConfig);
      
      // Verificar se a API de mensagens é suportada
      if ('serviceWorker' in navigator) {
        messaging = getMessaging(firebaseApp);
        console.log('Firebase Messaging inicializado');
      } else {
        console.warn('Este navegador não suporta service workers ou Firebase Messaging');
      }
    } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
    }
  }
  
  return { app: firebaseApp, messaging };
};

// Solicitar permissão e obter token FCM para notificações push
export const requestNotificationPermission = async () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  
  if (!messaging) {
    console.error('Firebase Messaging não inicializado');
    return null;
  }
  
  try {
    // Verificar se o navegador suporta notificações
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações desktop');
      return null;
    }
    
    // Solicitar permissão
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permissão para notificações foi negada');
      return null;
    }
    
    console.log('Permissão para notificações concedida');
    
    // Obter o service worker de registro
    const registration = await navigator.serviceWorker.ready;
    
    // Obter token FCM
    const fcmToken = await getToken(messaging, {
      vapidKey: 'BJG84i2kxDGApxEJgtbafkOOTGRuy0TivsOVzKtO6_IFpqZ0SgE1cwDTYgFeiHgKP30YJFB9YM01ZugJWusIt_Q', // Usando chave VAPID existente
      serviceWorkerRegistration: registration
    });
    
    if (fcmToken) {
      console.log('Token FCM obtido:', fcmToken);
      return fcmToken;
    } else {
      console.warn('Não foi possível obter o token FCM');
      return null;
    }
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return null;
  }
};

// Configurar manipulador para mensagens recebidas em primeiro plano
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) {
    console.error('Firebase Messaging não inicializado');
    return () => {};
  }
  
  console.log('Configurando manipulador de mensagens em primeiro plano');
  return onMessage(messaging, (payload) => {
    console.log('Mensagem recebida em primeiro plano:', payload);
    callback(payload);
  });
};

// Função simplificada para obter o token FCM do Firebase
export const getFirebaseToken = async (): Promise<string | null> => {
  try {
    // Inicializar Firebase se necessário
    if (!firebaseApp) {
      initializeFirebase();
    }
    
    // Verificar se o Firebase Messaging é suportado neste navegador
    const isMessagingSupported = await isSupported();
    if (!isMessagingSupported) {
      console.log('Firebase Cloud Messaging não é suportado neste navegador');
      return null;
    }
    
    // Verificar se o messaging foi inicializado
    if (!messaging) {
      console.error('Firebase Messaging não foi inicializado');
      return null;
    }
    
    // Verificar permissão para notificações
    if (Notification.permission !== 'granted') {
      console.log('Permissão para notificações não concedida. Solicitando permissão...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permissão de notificação negada pelo usuário');
        return null;
      }
    }
    
    console.log('Obtendo service worker...');
    const registration = await navigator.serviceWorker.ready;
    
    console.log('Obtendo token FCM...');
    const fcmToken = await getToken(messaging, {
      vapidKey: 'BJG84i2kxDGApxEJgtbafkOOTGRuy0TivsOVzKtO6_IFpqZ0SgE1cwDTYgFeiHgKP30YJFB9YM01ZugJWusIt_Q',
      serviceWorkerRegistration: registration
    });
    
    if (fcmToken) {
      console.log('Token FCM obtido com sucesso');
      return fcmToken;
    } else {
      console.warn('Falha ao obter token FCM');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter token Firebase:', error);
    return null;
  }
};