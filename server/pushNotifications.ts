import { storage } from "./storage";
import { UserDevice } from "@shared/schema";
import webpush from "web-push";
import { sendFirebaseMessage } from "./firebaseConfig";

// Configurar as chaves VAPID para Web Push a partir das variáveis de ambiente
// Fallback para chaves geradas se as variáveis de ambiente não estiverem disponíveis
const vapidPublicKey =
  process.env.VAPID_PUBLIC_KEY ||
  "BJerKNPhdEJZ_Jvp9AJ_u-sI_fwcl6T-nnzqeX5pzyk7i-RKsQhOE0rQxSHVgop2881Coo3PEtRKy6idJFx9VqM";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY ||
  "eAsJm5sIpxIuS-XUwt16xHyhGdp1n3KnoJbnIPnbA3s";
const webPushContact =
  process.env.WEB_PUSH_CONTACT || "mailto:support@couplesapp.com";

// Verificar e registrar a configuração VAPID
console.log("Configurando chaves VAPID:");
console.log(`- Chave pública disponível: ${vapidPublicKey ? "Sim" : "Não"}`);
console.log(
  `- Comprimento da chave pública: ${vapidPublicKey?.length || 0} caracteres`
);
console.log(`- Chave privada disponível: ${vapidPrivateKey ? "Sim" : "Não"}`);
console.log(`- Contato de email: ${webPushContact}`);

// Verificar se as chaves VAPID têm o formato correto
if (!vapidPublicKey || vapidPublicKey.length < 20) {
  console.error("ERRO: Chave pública VAPID inválida ou muito curta");
  throw new Error(
    "Configuração VAPID inválida: chave pública ausente ou inválida"
  );
}

if (!vapidPrivateKey || vapidPrivateKey.length < 20) {
  console.error("ERRO: Chave privada VAPID inválida ou muito curta");
  throw new Error(
    "Configuração VAPID inválida: chave privada ausente ou inválida"
  );
}

// Configurar Web Push (com verificação adicional de erro)
try {
  webpush.setVapidDetails(webPushContact, vapidPublicKey, vapidPrivateKey);
  console.log("Configuração VAPID inicializada com sucesso");
} catch (error) {
  console.error("Erro ao configurar VAPID:", error);
  throw new Error(
    `Falha na configuração VAPID: ${error instanceof Error ? error.message : String(error)}`
  );
}

// Adicionar função para obter a chave pública VAPID
export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

// Possíveis plataformas de destino para notificações push
export enum PushTargetPlatform {
  WEB = "web",
  IOS = "ios",
  ANDROID = "android",
  FIREBASE = "firebase", // Novo tipo para Firebase Cloud Messaging
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
  // Imagem para notificações ricas
  imageUrl?: string;
}

/**
 * Envia uma notificação push para um dispositivo específico
 *
 * @param device Dispositivo para o qual enviar a notificação
 * @param payload Carga útil da notificação
 * @returns Promise que resolve para true se a notificação foi enviada com sucesso
 */
export async function sendPushToDevice(
  device: UserDevice,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!device.pushEnabled) {
    console.log(
      `Notificação não enviada: Push desabilitado para o dispositivo ${device.id}`
    );
    return false;
  }

  try {
    // Determinar o tipo de dispositivo e enviar a notificação apropriadamente
    if (device.deviceType === PushTargetPlatform.WEB) {
      return await sendWebPushNotification(device, payload);
    } else if (device.deviceType === PushTargetPlatform.FIREBASE) {
      return await sendFirebasePushNotification(device, payload);
    } else if (
      device.deviceType === PushTargetPlatform.IOS ||
      device.deviceType === PushTargetPlatform.ANDROID
    ) {
      // Para iOS e Android, usar o Firebase Cloud Messaging
      return await sendFirebasePushNotification(device, payload);
    } else {
      console.log(
        `Tipo de dispositivo desconhecido: ${device.deviceType}, tentando via Firebase...`
      );
      return await sendFirebasePushNotification(device, payload);
    }
  } catch (error) {
    console.error("Erro ao enviar notificação push:", error);
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
export async function sendPushToUser(
  userId: number,
  payload: PushNotificationPayload
): Promise<number> {
  try {
    // Obter todos os dispositivos do usuário
    const devices = await storage.getUserDevices(userId);

    if (!devices || devices.length === 0) {
      console.log(`Nenhum dispositivo encontrado para o usuário ${userId}`);
      return 0;
    }

    console.log(
      `Enviando push para ${devices.length} dispositivo(s) do usuário ${userId}`
    );

    // Separar dispositivos por tipo para otimizar o envio
    const webDevices = devices.filter(
      (d) => d.deviceType === PushTargetPlatform.WEB
    );
    const firebaseDevices = devices.filter(
      (d) =>
        d.deviceType === PushTargetPlatform.FIREBASE ||
        d.deviceType === PushTargetPlatform.IOS ||
        d.deviceType === PushTargetPlatform.ANDROID
    );
    const otherDevices = devices.filter(
      (d) =>
        d.deviceType !== PushTargetPlatform.WEB &&
        d.deviceType !== PushTargetPlatform.FIREBASE &&
        d.deviceType !== PushTargetPlatform.IOS &&
        d.deviceType !== PushTargetPlatform.ANDROID
    );

    const results: boolean[] = [];

    // 1. Enviar para dispositivos web individualmente (Web Push API)
    if (webDevices.length > 0) {
      console.log(
        `Enviando para ${webDevices.length} dispositivos Web Push...`
      );
      const webResults = await Promise.all(
        webDevices.map((device) => sendWebPushNotification(device, payload))
      );
      results.push(...webResults);
    }

    // 2. Enviar para dispositivos Firebase (pode ser otimizado para múltiplos dispositivos)
    if (firebaseDevices.length > 0) {
      console.log(
        `Enviando para ${firebaseDevices.length} dispositivos Firebase...`
      );

      if (firebaseDevices.length === 1) {
        // Para um único dispositivo
        const success = await sendFirebasePushNotification(
          firebaseDevices[0],
          payload
        );
        results.push(success);
      } else {
        // Para múltiplos dispositivos, agrupar tokens e enviar em lote
        try {
          // Extrair tokens
          const firebaseTokens = firebaseDevices
            .filter((d) => d.deviceToken && d.pushEnabled)
            .map((d) => d.deviceToken);

          if (firebaseTokens.length > 0) {
            // Preparar notificação para Firebase
            const firebaseNotification = {
              title: payload.title,
              body: payload.body,
              imageUrl: payload.imageUrl,
            };

            // Dados adicionais para enviar com a notificação
            const firebaseData: Record<string, string> = {
              referenceType: payload.referenceType || "",
              referenceId: payload.referenceId?.toString() || "",
              timestamp: new Date().toISOString(),
            };

            // Converter dados personalizados para strings (FCM requer valores string)
            if (payload.data) {
              Object.entries(payload.data).forEach(([key, value]) => {
                firebaseData[key] =
                  typeof value === "string" ? value : JSON.stringify(value);
              });
            }

            // Importar função para envio em lote
            const { sendFirebaseMessageToMultipleDevices } = await import(
              "./firebaseConfig"
            );

            // Enviar mensagem em lote
            const batchResult = await sendFirebaseMessageToMultipleDevices(
              firebaseTokens,
              firebaseNotification,
              firebaseData
            );

            console.log(
              `Resultado do envio em lote: ${batchResult.success ? "Sucesso" : "Falha"}`
            );
            console.log(
              `Enviado para ${batchResult.successCount || 0} dispositivos`
            );

            // Registrar notificação no banco de dados
            try {
              await storage.createNotification({
                userId: userId,
                title: payload.title,
                message: payload.body,
                type: "push_batch",
                referenceType: payload.referenceType || null,
                referenceId: payload.referenceId || null,
                isRead: false,
                metadata: JSON.stringify({
                  firebase: true,
                  batch: true,
                  devices: firebaseTokens.length,
                  success: batchResult.successCount,
                  ...firebaseData,
                }),
              });
            } catch (dbError) {
              console.error(
                "Erro ao salvar notificação em lote no banco de dados:",
                dbError
              );
            }

            // Adicionar resultados baseado no sucesso/falha do lote
            if (batchResult.success) {
              // Se bem-sucedido, conte quantos dispositivos receberam
              const successCount = batchResult.successCount || 0;
              results.push(...Array(successCount).fill(true));
              if (successCount < firebaseTokens.length) {
                results.push(
                  ...Array(firebaseTokens.length - successCount).fill(false)
                );
              }
            } else {
              // Se falhou completamente, marque todos como falha
              results.push(...Array(firebaseTokens.length).fill(false));
            }
          }
        } catch (batchError) {
          console.error(
            "Erro ao enviar notificações Firebase em lote:",
            batchError
          );

          // Em caso de erro no lote, tentar individual para cada um
          console.log("Alternando para envio individual após falha no lote...");
          const individualResults = await Promise.all(
            firebaseDevices.map((device) =>
              sendFirebasePushNotification(device, payload)
            )
          );
          results.push(...individualResults);
        }
      }
    }

    // 3. Enviar para outros tipos de dispositivos individualmente
    if (otherDevices.length > 0) {
      console.log(
        `Enviando para ${otherDevices.length} outros dispositivos...`
      );
      const otherResults = await Promise.all(
        otherDevices.map((device) => sendPushToDevice(device, payload))
      );
      results.push(...otherResults);
    }

    // Contar quantas notificações foram enviadas com sucesso
    const successCount = results.filter((result) => result).length;
    console.log(
      `${successCount} de ${devices.length} notificações enviadas com sucesso`
    );

    return successCount;
  } catch (error) {
    console.error(
      `Erro ao enviar notificações para o usuário ${userId}:`,
      error
    );
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
async function sendWebPushNotification(
  device: UserDevice,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    if (!device.deviceToken) {
      console.error("Token de dispositivo não encontrado");
      return false;
    }

    // Parse o token do dispositivo (PushSubscription serializado)
    let subscription: webpush.PushSubscription;
    try {
      subscription = JSON.parse(device.deviceToken);

      // Verificar se o token é válido
      if (
        !subscription.endpoint ||
        !subscription.keys ||
        !subscription.keys.p256dh ||
        !subscription.keys.auth
      ) {
        console.error("Token de push inválido:", subscription);
        return false;
      }
    } catch (parseError) {
      console.error("Erro ao analisar token de dispositivo:", parseError);
      return false;
    }

    // Preparar payload para Web Push - IMPORTANTE: o Service Worker espera este formato
    const webPushPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/icon-192x192.png",
      tag: payload.tag || "default",
      data: {
        ...(payload.data || {}),
        referenceType: payload.referenceType,
        referenceId: payload.referenceId,
      },
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
      renotify: payload.renotify || false,
      silent: payload.silent || false,
    };

    console.log(
      `[PUSH DEBUG] Payload formatado para Web Push:`,
      JSON.stringify(webPushPayload)
    );

    // Configurar opções para Web Push
    const options: webpush.RequestOptions = {
      TTL: 60 * 60, // Time to live: 1 hora
      vapidDetails: {
        subject: "mailto:contato@pornos.app",
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey,
      },
      // Usar a codificação aesgcm padrão que tem melhor compatibilidade
      // do que aes128gcm, especialmente com service workers mais antigos
      contentEncoding: "aesgcm",
    };

    console.log(
      `[PUSH DEBUG] Enviando push para ${device.id} com encoding: ${options.contentEncoding}`
    );

    console.log(
      `Enviando notificação web push para o dispositivo ${device.id}`
    );
    console.log(`Título: ${payload.title}`);
    console.log(`Corpo: ${payload.body}`);

    // Enviar a notificação
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(webPushPayload),
      options
    );

    console.log("Notificação web push enviada com sucesso:", result.statusCode);
    return result.statusCode >= 200 && result.statusCode < 300;
  } catch (error) {
    console.error("Erro ao enviar notificação web push:", error);

    // Se o erro for 404 ou 410, a inscrição está inválida e deve ser removida
    if (error instanceof webpush.WebPushError) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log(
          `Assinatura expirada para o dispositivo ${device.id}, marcando para remoção`
        );
        try {
          // Atualizar o dispositivo para desativar push
          await storage.updateUserDevice(device.id, { pushEnabled: false });
        } catch (updateError) {
          console.error(
            "Erro ao desativar push para dispositivo expirado:",
            updateError
          );
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
async function sendApplePushNotification(
  device: UserDevice,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Verificar se o dispositivo é válido para receber notificações
    if (!device.deviceToken) {
      console.error("Token de dispositivo não encontrado para iOS");
      return false;
    }

    // Extrair informações do token iOS
    // Nota: No iOS, usamos um token simulado até que implementemos a integração com APNs
    // Exemplo: https://apple-push-service/timestamp
    const deviceInfo = device.deviceName || "Dispositivo iOS";

    // Formatação da carga útil para o iOS
    const iosPayload = {
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: payload.sound || "default",
        badge: 1, // Incrementar o contador de notificações
        "content-available": 1, // Permitir processamento em segundo plano
        "mutable-content": 1, // Permitir modificação do conteúdo pela extensão
        category: payload.category || "DEFAULT_CATEGORY", // Categoria de ação
      },
      // Metadados adicionais
      metadata: {
        referenceType: payload.referenceType,
        referenceId: payload.referenceId,
        timestamp: new Date().toISOString(),
      },
    };

    // Exibir informações da notificação no log
    console.log(
      `[iOS] Enviando notificação para o dispositivo ${device.id} (${deviceInfo})`
    );
    console.log(`[iOS] Título: ${payload.title}, Corpo: ${payload.body}`);

    // Simulação de envio bem-sucedido
    // (Aqui seria o ponto de integração com o serviço APNs real)

    // Criar uma entrada de notificação no banco de dados para este usuário
    try {
      await storage.createNotification({
        userId: device.userId,
        title: payload.title,
        message: payload.body,
        type: "push",
        referenceType: payload.referenceType || null,
        referenceId: payload.referenceId || null,
        isRead: false,
        metadata: JSON.stringify(iosPayload),
      });
    } catch (dbError) {
      console.error("Erro ao salvar notificação no banco de dados:", dbError);
      // Continuamos mesmo se não conseguirmos salvar no banco
    }

    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação APNs:", error);
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
async function sendFirebasePushNotification(
  device: UserDevice,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Verificar se tem token FCM
    if (!device.deviceToken) {
      console.error("Token FCM não encontrado para o dispositivo");
      return false;
    }

    console.log(
      `Enviando notificação Firebase para dispositivo: ${device.deviceName || "Dispositivo"} (ID: ${device.id})`
    );
    console.log(`Token: ${device.deviceToken.substring(0, 20)}...`);

    // Preparar notificação para Firebase
    const firebaseNotification = {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
    };

    // Dados adicionais para enviar com a notificação
    const firebaseData: Record<string, string> = {
      referenceType: payload.referenceType || "",
      referenceId: payload.referenceId?.toString() || "",
      timestamp: new Date().toISOString(),
    };

    // Converter dados personalizados para strings (FCM requer valores string)
    if (payload.data) {
      Object.entries(payload.data).forEach(([key, value]) => {
        firebaseData[key] =
          typeof value === "string" ? value : JSON.stringify(value);
      });
    }

    // Enviar a mensagem via Firebase
    console.log(`Enviando notificação via Firebase Cloud Messaging...`);
    const result = await sendFirebaseMessage(
      device.deviceToken,
      firebaseNotification,
      firebaseData
    );

    if (result.success) {
      console.log(
        `Notificação Firebase enviada com sucesso para dispositivo ${device.id}`
      );

      // Registrar a notificação no banco de dados também
      try {
        await storage.createNotification({
          userId: device.userId,
          title: payload.title,
          message: payload.body,
          type: "push",
          referenceType: payload.referenceType || null,
          referenceId: payload.referenceId || null,
          isRead: false,
          metadata: JSON.stringify({ firebase: true, ...firebaseData }),
        });
      } catch (dbError) {
        console.error("Erro ao salvar notificação no banco de dados:", dbError);
        // Não falhar apenas por causa do erro no banco de dados
      }

      return true;
    } else {
      console.error("Falha ao enviar notificação Firebase:", result.error);
      return false;
    }
  } catch (error) {
    console.error("Erro ao enviar notificação Firebase:", error);
    return false;
  }
}
