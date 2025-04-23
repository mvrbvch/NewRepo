import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

// Tipos para notificações push
export enum DeviceType {
  WEB = "web",
  IOS = "ios",
  ANDROID = "android",
  FIREBASE = "firebase",
}

/**
 * Opções para envio de notificação de teste
 */
export interface TestNotificationOptions {
  title?: string;
  message?: string;
  platform?: DeviceType | null; // null = todos os dispositivos
  icon?: string | null;
  sound?: string;
  badge?: number;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Status possíveis da inscrição de notificações push
 */
export enum PushSubscriptionStatus {
  UNSUPPORTED = "unsupported",
  DENIED = "denied",
  LOADING = "loading",
  ENABLED = "enabled",
  DISABLED = "disabled",
}

// Interface para o contexto de notificações push
interface PushNotificationsContextType {
  isPushSupported: boolean;
  isPushEnabled: boolean;
  pushStatus: PushSubscriptionStatus;
  subscription: PushSubscription | null;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
  sendTestNotification: (options?: TestNotificationOptions) => Promise<any>;
}

// Criar o contexto
const PushNotificationsContext = createContext<
  PushNotificationsContextType | undefined
>(undefined);

// Props para o provider
interface PushNotificationsProviderProps {
  children: ReactNode;
}

// Provider de notificações push
export function PushNotificationsProvider({
  children,
}: PushNotificationsProviderProps) {
  const { toast } = useToast();
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushSubscriptionStatus>(
    PushSubscriptionStatus.LOADING
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  // Verificar se o navegador suporta notificações push
  const checkPushSupport = useCallback(async () => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsPushSupported(supported);

    if (!supported) {
      setPushStatus(PushSubscriptionStatus.UNSUPPORTED);
      return false;
    }

    // Verificar permissão de notificação
    const permission = Notification.permission;

    if (permission === "denied") {
      setPushStatus(PushSubscriptionStatus.DENIED);
      return false;
    }

    return true;
  }, []);

  // Obter a chave VAPID pública do servidor
  const getVapidPublicKey = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/api/push/vapid-info");
      const data = await response.json();

      if (data.status === "ok" && data.publicKey) {
        setVapidPublicKey(data.publicKey);
        return data.publicKey;
      } else {
        console.error("Erro ao obter chave VAPID:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Erro ao obter chave VAPID:", error);
      return null;
    }
  }, []);

  // Converter chave base64 para Uint8Array (necessário para a API de Push)
  const urlBase64ToUint8Array = useCallback((base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  // Registrar o service worker
  const registerServiceWorker = useCallback(async () => {
    try {
      const registration =
        await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registrado com sucesso:", registration);
      return registration;
    } catch (error) {
      console.error("Erro ao registrar Service Worker:", error);
      throw error;
    }
  }, []);

  // Obter a inscrição de push atual
  const getSubscription = useCallback(async () => {
    try {
      // Garantir que o service worker está ativo
      const registration = await navigator.serviceWorker.ready;

      // Obter a inscrição atual
      const subscription = await registration.pushManager.getSubscription();
      setSubscription(subscription);

      if (subscription) {
        // Converter para string para armazenar no banco de dados
        setDeviceToken(JSON.stringify(subscription));
        setIsPushEnabled(true);
        setPushStatus(PushSubscriptionStatus.ENABLED);
      } else {
        setIsPushEnabled(false);
        setPushStatus(PushSubscriptionStatus.DISABLED);
      }

      return subscription;
    } catch (error) {
      console.error("Erro ao obter inscrição push:", error);
      setPushStatus(PushSubscriptionStatus.DISABLED);
      return null;
    }
  }, []);

  // Registrar o dispositivo no servidor
  const registerDeviceOnServer = useCallback(async (token: string) => {
    try {
      const response = await apiRequest("POST", "/api/push/register-device", {
        deviceToken: token,
        deviceType: DeviceType.WEB,
        deviceName: `${navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"} Browser`,
      });

      if (!response.ok) {
        throw new Error("Falha ao registrar dispositivo no servidor");
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao registrar dispositivo:", error);
      throw error;
    }
  }, []);

  // Cancelar registro do dispositivo no servidor
  const unregisterDeviceOnServer = useCallback(async (token: string) => {
    try {
      const response = await apiRequest("POST", "/api/push/unregister-device", {
        deviceToken: token,
      });

      if (!response.ok) {
        throw new Error(
          "Falha ao cancelar registro do dispositivo no servidor"
        );
      }

      return true;
    } catch (error) {
      console.error("Erro ao cancelar registro do dispositivo:", error);
      return false;
    }
  }, []);

  // Inscrever para receber notificações push
  const subscribeToPush = useCallback(async () => {
    try {
      // Verificar se o navegador suporta notificações
      if (!(await checkPushSupport())) {
        return null;
      }

      // Solicitar permissão se ainda não foi concedida
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setPushStatus(PushSubscriptionStatus.DENIED);
          return null;
        }
      }

      // Obter a chave VAPID se ainda não temos
      let publicKey = vapidPublicKey;
      if (!publicKey) {
        publicKey = await getVapidPublicKey();
        if (!publicKey) {
          throw new Error("Não foi possível obter a chave VAPID");
        }
      }

      // Registrar o service worker
      const registration = await registerServiceWorker();

      // Verificar se já existe uma inscrição
      const existingSubscription =
        await registration.pushManager.getSubscription();
      if (existingSubscription) {
        // Se já existe, usar a existente
        setSubscription(existingSubscription);
        setDeviceToken(JSON.stringify(existingSubscription));
        setIsPushEnabled(true);
        setPushStatus(PushSubscriptionStatus.ENABLED);
        return existingSubscription;
      }

      // Criar nova inscrição
      const convertedKey = urlBase64ToUint8Array(publicKey);
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      setSubscription(newSubscription);
      setDeviceToken(JSON.stringify(newSubscription));
      setIsPushEnabled(true);
      setPushStatus(PushSubscriptionStatus.ENABLED);

      // Registrar o dispositivo no servidor
      await registerDeviceOnServer(JSON.stringify(newSubscription));

      return newSubscription;
    } catch (error) {
      console.error("Erro ao inscrever para notificações push:", error);
      setPushStatus(PushSubscriptionStatus.DISABLED);
      return null;
    }
  }, [
    checkPushSupport,
    getVapidPublicKey,
    registerServiceWorker,
    vapidPublicKey,
    urlBase64ToUint8Array,
    registerDeviceOnServer,
  ]);

  // Cancelar inscrição de notificações push
  const unsubscribeFromPush = useCallback(async () => {
    try {
      // Verificar se existe uma inscrição
      if (!subscription) {
        const currentSubscription = await getSubscription();
        if (!currentSubscription) {
          return true; // Já não está inscrito
        }
      }

      // Cancelar a inscrição
      await subscription?.unsubscribe();

      // Atualizar estado
      setSubscription(null);
      setDeviceToken(null);
      setIsPushEnabled(false);
      setPushStatus(PushSubscriptionStatus.DISABLED);

      // Informar o servidor
      if (deviceToken) {
        await unregisterDeviceOnServer(deviceToken);
      }

      return true;
    } catch (error) {
      console.error("Erro ao cancelar inscrição push:", error);
      return false;
    }
  }, [subscription, getSubscription, deviceToken, unregisterDeviceOnServer]);

  // Ativar notificações push
  const enablePushNotifications = useCallback(async () => {
    setPushStatus(PushSubscriptionStatus.LOADING);
    try {
      const subscription = await subscribeToPush();
      return !!subscription;
    } catch (error) {
      setPushStatus(PushSubscriptionStatus.DISABLED);
      throw error;
    }
  }, [subscribeToPush]);

  // Desativar notificações push
  const disablePushNotifications = useCallback(async () => {
    setPushStatus(PushSubscriptionStatus.LOADING);
    try {
      return await unsubscribeFromPush();
    } catch (error) {
      setPushStatus(PushSubscriptionStatus.ENABLED);
      throw error;
    }
  }, [unsubscribeFromPush]);

  // Enviar notificação de teste
  const sendTestNotification = useCallback(
    async (options: TestNotificationOptions = {}) => {
      try {
        const response = await apiRequest("POST", "/api/notifications/test", {
          title: options.title || "Notificação de teste",
          message: options.message || "Esta é uma notificação de teste!",
          platform: options.platform || null,
          icon: options.icon || null,
          sound: options.sound || "default",
          badge: options.badge || 1,
          requireInteraction:
            options.requireInteraction !== undefined
              ? options.requireInteraction
              : true,
          actions: options.actions || [],
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.message || "Falha ao enviar notificação de teste"
          );
        }

        return await response.json();
      } catch (error) {
        console.error("Erro ao enviar notificação de teste:", error);
        throw error;
      }
    },
    []
  );

  // Inicializar o hook
  useEffect(() => {
    const initialize = async () => {
      setPushStatus(PushSubscriptionStatus.LOADING);

      // Verificar suporte a notificações push
      const supported = await checkPushSupport();
      if (!supported) return;

      // Obter a chave VAPID
      await getVapidPublicKey();

      // Verificar se já existe uma inscrição
      await getSubscription();
    };

    initialize();
  }, [checkPushSupport, getVapidPublicKey, getSubscription]);

  // Valor do contexto
  const contextValue: PushNotificationsContextType = {
    isPushSupported,
    isPushEnabled,
    pushStatus,
    subscription,
    enablePushNotifications,
    disablePushNotifications,
    sendTestNotification,
  };

  return (
    <PushNotificationsContext.Provider value={contextValue}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

// Hook para usar o contexto de notificações push
export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);

  if (context === undefined) {
    throw new Error(
      "usePushNotifications deve ser usado dentro de um PushNotificationsProvider"
    );
  }

  return context;
}
