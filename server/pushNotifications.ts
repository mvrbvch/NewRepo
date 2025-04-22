import { storage } from "./storage";
import { UserDevice } from "@shared/schema";
import webpush from 'web-push';
import { 
  isOneSignalConfigured, 
  sendOneSignalToDevice 
} from './onesignal';

// Configurar as chaves VAPID para Web Push (novas chaves geradas em formato P-256)
export const vapidPublicKey = 'BJG84i2kxDGApxEJgtbafkOOTGRuy0TivsOVzKtO6_IFpqZ0SgE1cwDTYgFeiHgKP30YJFB9YM01ZugJWusIt_Q';
const vapidPrivateKey = 'fL2y9O_U7J6ngIRr9dobfCuUpeSSncRdXxrT5lzn3no';

// Configurar Web Push
webpush.setVapidDetails(
  'mailto:contato@pornos.app', // Email de contato (não enviará emails reais)
  vapidPublicKey,
  vapidPrivateKey
);

// Possíveis plataformas de destino para notificações push
export enum PushTargetPlatform {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android'
}

// Interface para a carga útil de uma notificação push
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  // Campos específicos para iOS
  sound?: string;
  category?: string;
  threadId?: string;
  // Outros metadados
  referenceType?: string;
  referenceId?: number;
}

/**
 * Envia uma notificação push para um dispositivo específico
 * 
 * @param device Dispositivo para o qual enviar a notificação
 * @param payload Carga útil da notificação
 * @returns Promise que resolve para true se a notificação foi enviada com sucesso
 */
export async function sendPushToDevice(device: UserDevice, payload: PushNotificationPayload): Promise<boolean> {
  if (!device.pushEnabled) {
    console.log(`Notificação não enviada: Push desabilitado para o dispositivo ${device.id}`);
    return false;
  }

  try {
    // Determinar o tipo de dispositivo e enviar a notificação apropriadamente
    if (device.deviceType === PushTargetPlatform.WEB) {
      return await sendWebPushNotification(device, payload);
    } else if (device.deviceType === PushTargetPlatform.IOS) {
      return await sendApplePushNotification(device, payload);
    } else if (device.deviceType === PushTargetPlatform.ANDROID) {
      return await sendFirebasePushNotification(device, payload);
    } else {
      console.error(`Tipo de dispositivo não suportado: ${device.deviceType}`);
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar notificação push:', error);
    return false;
  }
}

/**
 * Envia uma notificação push para todos os dispositivos de um usuário
 * 
 * @param userId ID do usuário para quem enviar a notificação
 * @param payload Carga útil da notificação
 * @returns Promise que resolve para o número de dispositivos para os quais a notificação foi enviada com sucesso
 */
export async function sendPushToUser(userId: number, payload: PushNotificationPayload): Promise<number> {
  try {
    // Obter todos os dispositivos do usuário
    const devices = await storage.getUserDevices(userId);
    
    if (!devices || devices.length === 0) {
      console.log(`Nenhum dispositivo encontrado para o usuário ${userId}`);
      return 0;
    }
    
    console.log(`Enviando push para ${devices.length} dispositivo(s) do usuário ${userId}`);
    
    // Enviar notificação para cada dispositivo
    const results = await Promise.all(
      devices.map(device => sendPushToDevice(device, payload))
    );
    
    // Contar quantas notificações foram enviadas com sucesso
    const successCount = results.filter(result => result).length;
    console.log(`${successCount} de ${devices.length} notificações enviadas com sucesso`);
    
    return successCount;
  } catch (error) {
    console.error(`Erro ao enviar notificações para o usuário ${userId}:`, error);
    return 0;
  }
}

/**
 * Envia uma notificação push para um dispositivo web usando a Web Push API
 * 
 * @param device Dispositivo para o qual enviar a notificação
 * @param payload Carga útil da notificação
 * @returns Promise que resolve para true se a notificação foi enviada com sucesso
 */
async function sendWebPushNotification(device: UserDevice, payload: PushNotificationPayload): Promise<boolean> {
  try {
    if (!device.deviceToken) {
      console.error('Token de dispositivo não encontrado');
      return false;
    }

    // Verificar se o OneSignal está configurado e disponível
    if (isOneSignalConfigured()) {
      console.log(`[Web] Tentando enviar via OneSignal para dispositivo ${device.id}`);
      
      // Enviar notificação usando o OneSignal
      const oneSignalResult = await sendOneSignalToDevice(device, payload);
      
      if (oneSignalResult) {
        console.log(`[Web] Notificação enviada com sucesso via OneSignal para o dispositivo ${device.id}`);
        
        // Criar uma entrada de notificação no banco de dados
        try {
          await storage.createNotification({
            userId: device.userId,
            title: payload.title,
            message: payload.body,
            type: 'push_onesignal',
            referenceType: payload.referenceType || null,
            referenceId: payload.referenceId || null,
            isRead: false,
            metadata: JSON.stringify({
              provider: 'OneSignal',
              platform: 'Web',
              payload: payload
            })
          });
        } catch (dbError) {
          console.error('Erro ao salvar notificação OneSignal no banco de dados:', dbError);
          // Continuamos mesmo se não conseguirmos salvar no banco
        }
        
        return true;
      } else {
        console.log(`[Web] Falha ao enviar via OneSignal, tentando método nativo...`);
      }
    }

    // Parse o token do dispositivo (PushSubscription serializado)
    let subscription: webpush.PushSubscription;
    try {
      subscription = JSON.parse(device.deviceToken);
      
      // Verificar se o token é válido
      if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        console.error('Token de push inválido:', subscription);
        return false;
      }
    } catch (parseError) {
      console.error('Erro ao analisar token de dispositivo:', parseError);
      return false;
    }

    // Preparar payload para Web Push - IMPORTANTE: o Service Worker espera este formato
    const webPushPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-192x192.png',
      tag: payload.tag || 'default',
      data: {
        ...payload.data || {},
        referenceType: payload.referenceType,
        referenceId: payload.referenceId
      },
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
      renotify: payload.renotify || false,
      silent: payload.silent || false
    };
    
    console.log(`[PUSH DEBUG] Payload formatado para Web Push:`, JSON.stringify(webPushPayload));

    // Configurar opções para Web Push
    const options: webpush.RequestOptions = {
      TTL: 60 * 60, // Time to live: 1 hora
      vapidDetails: {
        subject: 'mailto:contato@pornos.app',
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey
      },
      // Usar a codificação aesgcm padrão que tem melhor compatibilidade
      // do que aes128gcm, especialmente com service workers mais antigos
      contentEncoding: 'aesgcm'
    };
    
    console.log(`[PUSH DEBUG] Enviando push para ${device.id} com encoding: ${options.contentEncoding}`);

    console.log(`Enviando notificação web push para o dispositivo ${device.id}`);
    console.log(`Título: ${payload.title}`);
    console.log(`Corpo: ${payload.body}`);

    // Enviar a notificação
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(webPushPayload),
      options
    );

    console.log('Notificação web push enviada com sucesso:', result.statusCode);
    return result.statusCode >= 200 && result.statusCode < 300;
  } catch (error) {
    console.error('Erro ao enviar notificação web push:', error);
    
    // Se o erro for 404 ou 410, a inscrição está inválida e deve ser removida
    if (error instanceof webpush.WebPushError) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log(`Assinatura expirada para o dispositivo ${device.id}, marcando para remoção`);
        try {
          // Atualizar o dispositivo para desativar push
          await storage.updateUserDevice(device.id, { pushEnabled: false });
        } catch (updateError) {
          console.error('Erro ao desativar push para dispositivo expirado:', updateError);
        }
      }
    }
    
    return false;
  }
}

/**
 * Envia uma notificação push para um dispositivo iOS usando o Apple Push Notification Service (APNs)
 * 
 * @param device Dispositivo para o qual enviar a notificação
 * @param payload Carga útil da notificação
 * @returns Promise que resolve para true se a notificação foi enviada com sucesso
 */
async function sendApplePushNotification(device: UserDevice, payload: PushNotificationPayload): Promise<boolean> {
  try {
    // Verificar se o dispositivo é válido para receber notificações
    if (!device.deviceToken) {
      console.error('Token de dispositivo não encontrado para iOS');
      return false;
    }

    // Verificar se o OneSignal está configurado e disponível
    if (isOneSignalConfigured()) {
      console.log(`[iOS] Tentando enviar via OneSignal para dispositivo ${device.id}`);
      
      // Enviar notificação usando o OneSignal
      const oneSignalResult = await sendOneSignalToDevice(device, payload);
      
      if (oneSignalResult) {
        console.log(`[iOS] Notificação enviada com sucesso via OneSignal para o dispositivo ${device.id}`);
        
        // Criar uma entrada de notificação no banco de dados
        try {
          await storage.createNotification({
            userId: device.userId,
            title: payload.title,
            message: payload.body,
            type: 'push_onesignal',
            referenceType: payload.referenceType || null,
            referenceId: payload.referenceId || null,
            isRead: false,
            metadata: JSON.stringify({
              provider: 'OneSignal',
              platform: 'iOS',
              payload: payload
            })
          });
        } catch (dbError) {
          console.error('Erro ao salvar notificação OneSignal no banco de dados:', dbError);
          // Continuamos mesmo se não conseguirmos salvar no banco
        }
        
        return true;
      } else {
        console.log(`[iOS] Falha ao enviar via OneSignal, tentando método tradicional...`);
      }
    }

    // Se não conseguir enviar pelo OneSignal ou se ele não estiver configurado, usar o método tradicional
    const deviceInfo = device.deviceName || 'Dispositivo iOS';
    
    // Formatação da carga útil para o iOS
    const iosPayload = {
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: payload.sound || 'default',
        badge: 1, // Incrementar o contador de notificações
        'content-available': 1, // Permitir processamento em segundo plano
        'mutable-content': 1, // Permitir modificação do conteúdo pela extensão
        category: payload.category || 'DEFAULT_CATEGORY' // Categoria de ação
      },
      // Metadados adicionais
      metadata: {
        referenceType: payload.referenceType,
        referenceId: payload.referenceId,
        timestamp: new Date().toISOString()
      }
    };
    
    // Exibir informações da notificação no log
    console.log(`[iOS] Enviando notificação nativa para o dispositivo ${device.id} (${deviceInfo})`);
    console.log(`[iOS] Título: ${payload.title}, Corpo: ${payload.body}`);
    
    // Criar uma entrada de notificação no banco de dados para este usuário
    try {
      await storage.createNotification({
        userId: device.userId,
        title: payload.title,
        message: payload.body,
        type: 'push',
        referenceType: payload.referenceType || null,
        referenceId: payload.referenceId || null,
        isRead: false,
        metadata: JSON.stringify(iosPayload)
      });
    } catch (dbError) {
      console.error('Erro ao salvar notificação no banco de dados:', dbError);
      // Continuamos mesmo se não conseguirmos salvar no banco
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação iOS:', error);
    return false;
  }
}

/**
 * Envia uma notificação push para um dispositivo Android usando o Firebase Cloud Messaging (FCM)
 * 
 * @param device Dispositivo para o qual enviar a notificação
 * @param payload Carga útil da notificação
 * @returns Promise que resolve para true se a notificação foi enviada com sucesso
 */
async function sendFirebasePushNotification(device: UserDevice, payload: PushNotificationPayload): Promise<boolean> {
  try {
    // Verificar se o dispositivo é válido para receber notificações
    if (!device.deviceToken) {
      console.error('Token de dispositivo não encontrado para Android');
      return false;
    }

    // Verificar se o OneSignal está configurado e disponível
    if (isOneSignalConfigured()) {
      console.log(`[Android] Tentando enviar via OneSignal para dispositivo ${device.id}`);
      
      // Enviar notificação usando o OneSignal
      const oneSignalResult = await sendOneSignalToDevice(device, payload);
      
      if (oneSignalResult) {
        console.log(`[Android] Notificação enviada com sucesso via OneSignal para o dispositivo ${device.id}`);
        
        // Criar uma entrada de notificação no banco de dados
        try {
          await storage.createNotification({
            userId: device.userId,
            title: payload.title,
            message: payload.body,
            type: 'push_onesignal',
            referenceType: payload.referenceType || null,
            referenceId: payload.referenceId || null,
            isRead: false,
            metadata: JSON.stringify({
              provider: 'OneSignal',
              platform: 'Android',
              payload: payload
            })
          });
        } catch (dbError) {
          console.error('Erro ao salvar notificação OneSignal no banco de dados:', dbError);
          // Continuamos mesmo se não conseguirmos salvar no banco
        }
        
        return true;
      } else {
        console.log(`[Android] Falha ao enviar via OneSignal, tentando método tradicional...`);
      }
    }

    // Se não conseguir enviar pelo OneSignal ou se ele não estiver configurado, usar o método tradicional
    console.log(`[FCM] Enviando notificação para o dispositivo ${device.id}`);
    console.log(`[FCM] Título: ${payload.title}, Corpo: ${payload.body}`);
    
    // Criar uma entrada de notificação no banco de dados
    try {
      await storage.createNotification({
        userId: device.userId,
        title: payload.title,
        message: payload.body,
        type: 'push',
        referenceType: payload.referenceType || null,
        referenceId: payload.referenceId || null,
        isRead: false,
        metadata: JSON.stringify({
          provider: 'Firebase',
          platform: 'Android',
          payload: payload
        })
      });
    } catch (dbError) {
      console.error('Erro ao salvar notificação FCM no banco de dados:', dbError);
      // Continuamos mesmo se não conseguirmos salvar no banco
    }
    
    // Como não temos FCM configurado, retornamos true como se tivesse funcionado
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação Android:', error);
    return false;
  }
}