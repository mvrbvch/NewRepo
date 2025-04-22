import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Definição da interface PushSubscriptionJSON que está faltando
interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export enum PushSubscriptionStatus {
  NOT_SUPPORTED = "not_supported",
  DENIED = "denied",
  NOT_SUBSCRIBED = "not_subscribed",
  SUBSCRIBED = "subscribed",
}

// Interface para o contexto de notificações push
interface PushNotificationsContextType {
  subscriptionStatus: PushSubscriptionStatus;
  isPending: boolean;
  isIOSDevice: boolean;
  deviceType: 'web' | 'ios' | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  testNotification: (options?: NotificationTestOptions) => Promise<void>;
}

// Opções para teste de notificação personalizado
interface NotificationTestOptions {
  title?: string;
  message?: string;
  platform?: 'web' | 'ios' | null; // null = todos os dispositivos
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

// Criação do contexto
const PushNotificationsContext =
  createContext<PushNotificationsContextType | null>(null);

// Provedor do contexto
export function PushNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const hookValue = usePushNotificationsHook();

  return (
    <PushNotificationsContext.Provider value={hookValue}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

// Hook para usar o contexto
export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);
  if (!context) {
    throw new Error(
      "usePushNotifications deve ser usado dentro de um PushNotificationsProvider",
    );
  }
  return context;
}

// Implementação real do hook, usado pelo provedor
function usePushNotificationsHook(): PushNotificationsContextType {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<PushSubscriptionStatus>(PushSubscriptionStatus.NOT_SUPPORTED);
  const [deviceType, setDeviceType] = useState<'web' | 'ios' | null>(null);

  // Verificar o status inicial
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Verifica se estamos no iOS - detecta dispositivos iOS independente da versão
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document) ||
      /iPad|iPhone|iPod/.test(navigator.userAgent)
    );
  };

  // Verifica se estamos no Safari no iOS
  const isIOSSafari = () => {
    const ua = navigator.userAgent;
    return isIOS() && ua.includes("Safari") && !ua.includes("Chrome");
  };

  // Verifica se o iOS suporta notificações push
  // - iOS 16.4+ em Safari: Suporta WebPush nativo
  // - iOS PWA (standalone): Suporta push através de outro mecanismo
  const isIOSPushSupported = () => {
    // Se não for iOS, não é suportado
    if (!isIOS()) return false;
    
    // PWA no iOS (modo standalone) - sempre consideramos suportado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    if (isStandalone) {
      console.log("Dispositivo iOS em modo standalone (PWA) - suportado para notificações");
      return true;
    }
    
    // Safari no iOS 16.4+ também suporta
    try {
      // Extrai a versão do iOS do user-agent
      const match = navigator.userAgent.match(/OS\s+(\d+)_(\d+)/);
      if (match && isIOSSafari()) {
        const majorVersion = parseInt(match[1], 10);
        const minorVersion = parseInt(match[2], 10);
        
        // iOS 16.4+ suporta notificações push no Safari
        return majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4);
      }
    } catch (e) {
      console.error("Erro ao detectar versão do iOS:", e);
    }
    
    return false;
  };

  // Função para verificar o status atual da inscrição
  const checkSubscriptionStatus = async () => {
    // Primeiro, verifica se estamos no iOS
    if (isIOS()) {
      // Caso especial para Safari no iOS 16.4+
      if (isIOSSafari() && isIOSPushSupported()) {
        // Continua com a verificação normal, pois o push é suportado
        console.log("Safari no iOS 16.4+ detectado - Push é suportado");
      }
      // iOS mais antigo ou outro navegador no iOS que não suporta push
      else if (!isIOSPushSupported()) {
        console.log(
          "Navegador iOS detectado mas Push não é suportado nesta versão",
        );
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
        return;
      }
    }

    // Verificação padrão para navegadores não-iOS ou Safari no iOS 16.4+
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log(
        "ServiceWorker ou PushManager não suportados neste navegador",
      );
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
      return;
    }

    try {
      const permission = Notification.permission;
      if (permission === "denied") {
        setSubscriptionStatus(PushSubscriptionStatus.DENIED);
        return;
      }

      // No iOS, o registro do service worker pode falhar silenciosamente
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          console.log("Inscrição de push existente encontrada");
          setSubscriptionStatus(PushSubscriptionStatus.SUBSCRIBED);
        } else {
          console.log("Navegador suporta push, mas usuário não está inscrito");
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        }
      } catch (swError) {
        console.error("Erro ao acessar service worker:", swError);

        // Se estamos no iOS e ocorreu um erro, pode ser uma limitação da plataforma
        if (isIOS()) {
          console.log("Erro de service worker no iOS - limitação conhecida");
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
        } else {
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status da inscrição:", error);
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
    }
  };

  // Interface para o payload de registro de dispositivo
  interface RegisterDevicePayload {
    subscription: PushSubscriptionJSON;
    deviceType?: 'web' | 'ios' | 'android';
  }

  // Registrar um novo dispositivo no backend
  const registerDeviceMutation = useMutation({
    mutationFn: async (payload: RegisterDevicePayload) => {
      const { subscription, deviceType = 'web' } = payload;
      
      // O servidor pegará o userId da sessão, não precisamos enviar
      const response = await apiRequest("POST", "/api/devices", {
        deviceToken: JSON.stringify(subscription),
        deviceType: deviceType,
        deviceName: navigator.userAgent,
        pushEnabled: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
    },
  });

  // Remover um dispositivo no backend
  const unregisterDeviceMutation = useMutation({
    mutationFn: async (subscription: PushSubscriptionJSON) => {
      try {
        // Primeiro precisamos encontrar o ID do dispositivo com base no token
        const deviceTokenStr = JSON.stringify(subscription);
        const devicesResponse = await apiRequest("GET", "/api/devices");
        const devices = await devicesResponse.json();
        const device = devices.find((d: any) => d.deviceToken === deviceTokenStr);

        if (!device) {
          console.log("Dispositivo não encontrado para cancelamento de inscrição");
          return { success: false, message: "Dispositivo não encontrado" };
        }

        // Agora podemos excluir o dispositivo pelo ID
        const response = await apiRequest("DELETE", `/api/devices/${device.id}`);
        return response.json();
      } catch (error) {
        console.error("Erro ao cancelar inscrição do dispositivo:", error);
        return { success: false, message: "Erro ao cancelar inscrição" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
    },
  });

  // Função para inscrever o usuário para notificações push
  const subscribe = async () => {
    try {
      setIsPending(true);
      
      // Caso especial para iOS
      if (isIOS()) {
        console.log("Tentando registrar notificações em dispositivo iOS");
        
        // Verificar se estamos no modo standalone (PWA instalado)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
        
        // Solicitar permissão para notificações no iOS
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setSubscriptionStatus(PushSubscriptionStatus.DENIED);
          toast({
            title: "Permissão negada",
            description: "Você não concedeu permissão para notificações.",
            variant: "destructive",
          });
          return;
        }
        
        // Se estamos em um PWA no iOS, podemos usar um token simulado para iOS
        if (isStandalone) {
          console.log("Registrando dispositivo iOS em modo PWA");
          
          // Criar uma "subscription" fictícia para o iOS
          const iosSubscription: PushSubscriptionJSON = {
            endpoint: `https://apple-push-service/${Date.now()}`,
            expirationTime: null,
            keys: {
              p256dh: `ios-p256dh-${navigator.userAgent.replace(/\W/g, "-")}`,
              auth: `ios-auth-${Date.now()}`
            }
          };
          
          // Registrar no backend com tipo específico para iOS
          await registerDeviceMutation.mutateAsync({
            subscription: iosSubscription,
            deviceType: "ios"
          });
          
          // Atualizar o estado
          setSubscriptionStatus(PushSubscriptionStatus.SUBSCRIBED);
          toast({
            title: "Notificações ativadas no iOS",
            description: "Você receberá notificações importantes.",
          });
          return;
        }
        
        // Para Safari no iOS 16.4+, tentamos o método padrão
        if (isIOSSafari() && isIOSPushSupported()) {
          console.log("Tentando registrar push no Safari iOS 16.4+");
        } else {
          // iOS mas sem suporte a push
          toast({
            title: "Dispositivo não suportado",
            description: "Seu dispositivo iOS não suporta notificações push. Tente adicionar o aplicativo à tela inicial.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Verificação padrão para navegadores não-iOS ou Safari no iOS 16.4+
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast({
          title: "Erro",
          description: "Seu navegador não suporta notificações push.",
          variant: "destructive",
        });
        return;
      }

      // Solicitar permissão do usuário (redundante para iOS, mas necessário para outros)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setSubscriptionStatus(PushSubscriptionStatus.DENIED);
        toast({
          title: "Permissão negada",
          description: "Você não concedeu permissão para notificações.",
          variant: "destructive",
        });
        return;
      }

      // Registrar o service worker, se ainda não estiver registrado
      const registration = await navigator.serviceWorker.ready;

      // Gerar as chaves de inscrição com VAPID
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // A chave pública VAPID deve ser configurada no backend
        applicationServerKey: urlBase64ToUint8Array(
          "BDd3_hVL9bzn8xbpNV-0JecHiVhvQqMMn6SrTHce-cW6ogFLkP_rF9FKPkEVX-O-0FM-sgGh5cqEHVKgE3Ury_A",
        ),
      });

      // Determinar o tipo de dispositivo
      const deviceType = isIOS() ? "ios" : "web";
      console.log(`Registrando dispositivo como tipo: ${deviceType}`);

      // Registrar a inscrição no servidor
      await registerDeviceMutation.mutateAsync({
        subscription: subscription.toJSON(),
        deviceType
      });

      // Atualizar o estado
      setSubscriptionStatus(PushSubscriptionStatus.SUBSCRIBED);
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações importantes.",
      });
    } catch (error) {
      console.error("Erro ao se inscrever para notificações push:", error);
      toast({
        title: "Erro ao ativar notificações",
        description: "Ocorreu um erro ao ativar as notificações.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Função para cancelar a inscrição
  const unsubscribe = async () => {
    try {
      setIsPending(true);
      
      // Caso especial para iOS
      if (isIOS()) {
        console.log("Desativando notificações em dispositivo iOS");
        
        try {
          // Buscar todos os dispositivos do usuário
          const devicesResponse = await apiRequest("GET", "/api/devices");
          const devices = await devicesResponse.json();
          
          // Encontrar dispositivos iOS
          const iosDevices = devices.filter((d: any) => d.deviceType === "ios");
          
          if (iosDevices.length > 0) {
            // Excluir todos os dispositivos iOS
            for (const device of iosDevices) {
              await apiRequest("DELETE", `/api/devices/${device.id}`);
              console.log(`Dispositivo iOS ${device.id} excluído`);
            }
            
            // Atualizar o estado
            setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
            toast({
              title: "Notificações desativadas",
              description: "Você não receberá mais notificações no iOS.",
            });
            return;
          }
        } catch (iosError) {
          console.error("Erro ao excluir dispositivos iOS:", iosError);
        }
      }
      
      // Fluxo padrão para outros navegadores
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Cancelar a inscrição no servidor
        await unregisterDeviceMutation.mutateAsync(subscription.toJSON());

        // Cancelar a inscrição no navegador
        await subscription.unsubscribe();

        // Atualizar o estado
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações.",
        });
      } else {
        // Não há inscrição para cancelar
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        toast({
          title: "Notificações já estão desativadas",
          description: "Não foi encontrada nenhuma inscrição ativa para cancelar.",
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar inscrição de notificações:", error);
      toast({
        title: "Erro ao desativar notificações",
        description: "Ocorreu um erro ao desativar as notificações.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Testar envio de notificação com opções personalizadas
  const testNotification = async (options?: NotificationTestOptions) => {
    try {
      const payload: any = {};
      
      // Usar opções personalizadas ou valores padrão
      if (options) {
        if (options.title) payload.title = options.title;
        if (options.message) payload.message = options.message;
        if (options.platform !== undefined) payload.platform = options.platform;
        if (options.icon !== undefined) payload.icon = options.icon;
        if (options.sound) payload.sound = options.sound;
        if (options.badge !== undefined) payload.badge = options.badge;
        if (options.requireInteraction !== undefined) payload.requireInteraction = options.requireInteraction;
        if (options.actions) payload.actions = options.actions;
      }
      
      // Adicionar informações da plataforma se não especificado
      if (payload.platform === undefined && isIOSDevice) {
        payload.platform = 'ios';
      }
      
      console.log('Enviando notificação de teste com payload:', payload);
      
      const response = await apiRequest("POST", "/api/notifications/test", payload);
      const result = await response.json();

      if (result.pushSent) {
        toast({
          title: "Notificação de teste enviada",
          description: `Notificação enviada para ${result.targetPlatform === 'all' ? 'todos os dispositivos' : `dispositivos ${result.targetPlatform}`}.`,
        });
      } else {
        toast({
          title: "Notificação não enviada",
          description: result.message || "Não foi possível enviar a notificação push de teste.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a notificação de teste.",
        variant: "destructive",
      });
    }
  };

  // Detectar se o dispositivo é iOS
  const isIOSDevice = isIOS();
  
  // Define o tipo de dispositivo
  useEffect(() => {
    // Atualizar tipo de dispositivo com base na detecção
    setDeviceType(isIOSDevice ? 'ios' : 'web');
  }, [isIOSDevice]);

  return {
    subscriptionStatus,
    isPending,
    isIOSDevice,
    deviceType,
    subscribe,
    unsubscribe,
    testNotification,
  };
}

// Função auxiliar para converter chave VAPID para o formato correto
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
