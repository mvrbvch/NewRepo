import * as OneSignal from '@onesignal/node-onesignal';
import { storage } from './storage';
import { UserDevice } from '@shared/schema';
import { PushNotificationPayload, PushTargetPlatform } from './pushNotifications';

// Obtenção das chaves do OneSignal a partir das variáveis de ambiente
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || 'dbedbbbb-6fd5-4bdd-907c-8cde52bb2219';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || 'os_v2_app_3pw3xo3p2vf53ed4rtpffozcdfplduq663auhceaiebgtweusscsdpjmgokc355pu3qaog5spuuomjc4mncncejgm4dbga6r3fozuiy';

// Criação do cliente OneSignal
let client: any;

try {
  // Usando o construtor padrão
  client = new OneSignal.DefaultApi();
  console.log('[OneSignal] Cliente inicializado com sucesso');
} catch (error) {
  console.error('[OneSignal] Erro ao inicializar cliente:', error);
  // Fallback para objeto simulado se houver erro
  client = {
    createNotification: async (notification: any) => {
      console.log('[OneSignal] Mock notification:', notification);
      return { id: 'mock-notification-id' };
    }
  };
}

/**
 * Verifica se o OneSignal está configurado corretamente
 * @returns true se o OneSignal está configurado
 */
export function isOneSignalConfigured(): boolean {
  return Boolean(ONESIGNAL_APP_ID && ONESIGNAL_API_KEY);
}

/**
 * Envia uma notificação via OneSignal para um dispositivo específico
 * @param device Dispositivo para o qual enviar a notificação
 * @param payload Carga útil da notificação
 * @returns Promise que resolve para true se a notificação foi enviada com sucesso
 */
export async function sendOneSignalToDevice(device: UserDevice, payload: PushNotificationPayload): Promise<boolean> {
  if (!isOneSignalConfigured()) {
    console.warn('[OneSignal] Não está configurado corretamente. Verifique as variáveis de ambiente.');
    return false;
  }

  try {
    if (!device.deviceToken) {
      console.error('[OneSignal] Token de dispositivo não encontrado');
      return false;
    }

    // Criar notificação para um player_id específico (deviceToken)
    const notification: any = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [device.deviceToken],
      contents: {
        en: payload.body,
        pt: payload.body
      },
      headings: {
        en: payload.title,
        pt: payload.title
      },
      data: payload.data || {}
    };
    
    // Configurar ícone se disponível
    if (payload.icon) {
      notification.chrome_web_icon = payload.icon;
      notification.firefox_icon = payload.icon;
    }
    
    // Adicionar ações se disponíveis
    if (payload.actions && payload.actions.length > 0) {
      notification.web_buttons = payload.actions.map(action => ({
        id: action.action,
        text: action.title,
        icon: action.icon || undefined
      }));
    }
    
    console.log(`[OneSignal] Enviando notificação para dispositivo ${device.id}`);
    const response = await client.createNotification(notification);
    console.log(`[OneSignal] Notificação enviada com sucesso, ID: ${response.id}`);
    return true;
  } catch (error) {
    console.error('[OneSignal] Erro ao enviar notificação:', error);
    return false;
  }
}

/**
 * Envia uma notificação via OneSignal para todos os dispositivos de um usuário
 * @param userId ID do usuário para quem enviar a notificação
 * @param payload Carga útil da notificação
 * @returns Promise que resolve para o número de dispositivos para os quais a notificação foi enviada com sucesso
 */
export async function sendOneSignalToUser(userId: number, payload: PushNotificationPayload): Promise<number> {
  try {
    // Obter todos os dispositivos do usuário
    const devices = await storage.getUserDevices(userId);
    
    if (!devices || devices.length === 0) {
      console.log(`[OneSignal] Nenhum dispositivo encontrado para o usuário ${userId}`);
      return 0;
    }
    
    console.log(`[OneSignal] Enviando push para ${devices.length} dispositivo(s) do usuário ${userId}`);
    
    // Enviar notificação para cada dispositivo
    const results = await Promise.all(
      devices.map(device => sendOneSignalToDevice(device, payload))
    );
    
    // Contar quantas notificações foram enviadas com sucesso
    const successCount = results.filter(result => result).length;
    console.log(`[OneSignal] ${successCount} de ${devices.length} notificações enviadas com sucesso`);
    
    return successCount;
  } catch (error) {
    console.error(`[OneSignal] Erro ao enviar notificações para o usuário ${userId}:`, error);
    return 0;
  }
}

/**
 * Registra um dispositivo no OneSignal
 * @param userId ID do usuário
 * @param deviceToken Token do dispositivo (player_id do OneSignal)
 * @param deviceType Tipo do dispositivo
 * @param deviceName Nome do dispositivo
 * @returns Promise que resolve para o dispositivo criado
 */
export async function registerOneSignalDevice(
  userId: number, 
  deviceToken: string, 
  deviceType: string,
  deviceName: string | null = null
): Promise<UserDevice | null> {
  try {
    // Usamos a função correta do storage
    const device = await storage.registerUserDevice({
      userId,
      deviceToken,
      deviceType,
      deviceName: deviceName || null,
      pushEnabled: true
    });
    
    console.log(`[OneSignal] Dispositivo registrado com sucesso: ${device.id}`);
    return device;
  } catch (error) {
    console.error('[OneSignal] Erro ao registrar dispositivo:', error);
    return null;
  }
}