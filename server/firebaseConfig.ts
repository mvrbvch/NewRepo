import admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

// Verificar se já inicializamos o Firebase para evitar múltiplas inicializações
let firebaseInitialized = false;

// Inicializar Firebase Admin SDK com as credenciais
export function initializeFirebase() {
  if (firebaseInitialized) {
    console.log('Firebase já inicializado, ignorando');
    return;
  }

  try {
    // Verificar se as credenciais existem
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_STORAGE_BUCKET) {
      throw new Error('Credenciais do Firebase não definidas corretamente');
    }

    // Em vez de usar a string JSON completa, usamos os valores individuais
    // das variáveis de ambiente para inicializar o Firebase

    // Inicializar o app do Firebase Admin usando configuração simples
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    console.log('Firebase Admin SDK inicializado com sucesso');
    firebaseInitialized = true;
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
    throw error;
  }
}

// Função para enviar notificação via Firebase Cloud Messaging
export async function sendFirebaseMessage(
  token: string, 
  notification: { title: string; body: string; imageUrl?: string },
  data: Record<string, string> = {}
) {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  try {
    const messaging = getMessaging();
    
    // Preparar a mensagem
    const message = {
      token,
      notification,
      data,
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          click_action: process.env.NODE_ENV === 'production' 
            ? 'https://por-nos.replit.app/' 
            : 'http://localhost:5000/',
          ...notification
        },
        fcmOptions: {
          link: '/'
        }
      },
      // Configuração para iOS
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          }
        },
        fcmOptions: {
          imageUrl: notification.imageUrl
        }
      }
    };

    // Enviar a mensagem
    const response = await messaging.send(message);
    console.log('Mensagem Firebase enviada com sucesso:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Erro ao enviar mensagem Firebase:', error);
    return { success: false, error };
  }
}

// Função para enviar mensagem para múltiplos dispositivos
export async function sendFirebaseMessageToMultipleDevices(
  tokens: string[],
  notification: { title: string; body: string; imageUrl?: string },
  data: Record<string, string> = {}
) {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!tokens || tokens.length === 0) {
    console.warn('Nenhum token fornecido para envio de notificação');
    return { success: false, error: 'Nenhum token fornecido' };
  }

  try {
    const messaging = getMessaging();
    
    // Preparar a mensagem
    const message = {
      tokens,
      notification,
      data,
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          click_action: process.env.NODE_ENV === 'production' 
            ? 'https://por-nos.replit.app/' 
            : 'http://localhost:5000/',
          ...notification
        },
        fcmOptions: {
          link: '/'
        }
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          }
        },
        fcmOptions: {
          imageUrl: notification.imageUrl
        }
      }
    };

    // Enviar a mensagem para cada dispositivo individualmente
    const responses = await Promise.all(
      tokens.map(token => messaging.send({ ...message, token }))
    );
    
    console.log(`Mensagem Firebase enviada para ${responses.length} dispositivos`);
    
    // Retornar detalhes de sucesso/falha
    return { 
      success: responses.length > 0,
      successCount: responses.length,
      responses
    };
  } catch (error) {
    console.error('Erro ao enviar mensagem Firebase para múltiplos dispositivos:', error);
    return { success: false, error };
  }
}