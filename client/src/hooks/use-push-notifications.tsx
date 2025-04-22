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
import { useAuth } from "@/hooks/use-auth";
import { 
  requestNotificationPermission, 
  initializeFirebase, 
  getFirebaseToken 
} from "@/lib/firebase";

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

// Tipos de dispositivos suportados
export enum DeviceType {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android',
  FIREBASE = 'firebase'
}

// Interface para o contexto de notificações push
interface PushNotificationsContextType {
  subscriptionStatus: PushSubscriptionStatus;
  isPending: boolean;
  isIOSDevice: boolean;
  deviceType: DeviceType | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  testNotification: (options?: NotificationTestOptions) => Promise<void>;
}

// Opções para teste de notificação personalizado
interface NotificationTestOptions {
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
  const { user, refreshAuth, isAuthenticated } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<PushSubscriptionStatus>(PushSubscriptionStatus.NOT_SUPPORTED);
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);

  // Verificar o status inicial e monitorar alterações no estado de autenticação
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    } else {
      // Se não estiver autenticado, definir como não inscrito
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
    }
  }, [user]);

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
    subscription: PushSubscriptionJSON | string;
    deviceType?: DeviceType;
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
      
      // Verificar se o usuário está autenticado e atualizar estado de autenticação
      if (!isAuthenticated) {
        console.log("Tentando atualizar estado de autenticação antes de ativar notificações...");
        const refreshedUser = await refreshAuth();
        
        if (!refreshedUser) {
          console.error("Falha ao atualizar autenticação - usuário continua não autenticado");
          toast({
            title: "Erro de autenticação",
            description: "Você precisa estar logado para ativar notificações. Por favor, faça login novamente.",
            variant: "destructive",
          });
          return;
        } else {
          console.log("Autenticação atualizada com sucesso:", refreshedUser.username);
        }
      }
      
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
            deviceType: DeviceType.IOS
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

      // Tentar obter token Firebase primeiro
      console.log("Tentando obter token Firebase...");
      let firebaseToken = null;
      let subscriptionType = DeviceType.WEB;
      let subscriptionData: any = null;

      try {
        // Inicializar Firebase se necessário
        initializeFirebase();
        
        // Tentar obter token FCM
        firebaseToken = await getFirebaseToken();
        
        if (firebaseToken) {
          console.log("Token Firebase obtido com sucesso!");
          subscriptionType = DeviceType.FIREBASE;
          subscriptionData = firebaseToken;
        } else {
          console.log("Nenhum token Firebase obtido, tentando Web Push padrão...");
        }
      } catch (firebaseError) {
        console.error("Erro ao obter token Firebase:", firebaseError);
        console.log("Continuando com Web Push padrão...");
      }

      // Se não foi possível obter token Firebase, tenta o método padrão com Web Push
      if (!firebaseToken) {
        try {
          // Registrar o service worker, se ainda não estiver registrado
          const registration = await navigator.serviceWorker.ready;

          // Gerar as chaves de inscrição com VAPID
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // A chave pública VAPID deve ser configurada no backend
            applicationServerKey: urlBase64ToUint8Array(
              "BJG84i2kxDGApxEJgtbafkOOTGRuy0TivsOVzKtO6_IFpqZ0SgE1cwDTYgFeiHgKP30YJFB9YM01ZugJWusIt_Q",
            ),
          });

          // Determinar o tipo de dispositivo para Web Push padrão
          subscriptionType = isIOS() ? DeviceType.IOS : DeviceType.WEB;
          subscriptionData = subscription.toJSON();
        } catch (webPushError) {
          console.error("Erro ao obter inscrição Web Push:", webPushError);
          throw new Error("Não foi possível obter inscrição para notificações push através de nenhum método disponível");
        }
      }

      console.log(`Registrando dispositivo como tipo: ${subscriptionType}`);

      // Registrar a inscrição no servidor
      await registerDeviceMutation.mutateAsync({
        subscription: subscriptionData,
        deviceType: subscriptionType
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
      
      // Verificar se o usuário está autenticado e atualizar estado se necessário
      if (!isAuthenticated) {
        console.log("Tentando atualizar estado de autenticação antes de cancelar notificações...");
        const refreshedUser = await refreshAuth();
        
        if (!refreshedUser) {
          console.error("Falha ao atualizar autenticação para cancelamento de notificações");
          toast({
            title: "Erro de autenticação",
            description: "Você precisa estar logado para gerenciar notificações. Por favor, faça login novamente.",
            variant: "destructive",
          });
          return;
        } else {
          console.log("Autenticação atualizada com sucesso para cancelamento:", refreshedUser.username);
        }
      }
      
      try {
        // Buscar todos os dispositivos do usuário atual
        console.log("Buscando todos os dispositivos registrados para o usuário atual...");
        const devicesResponse = await apiRequest("GET", "/api/devices");
        const devices = await devicesResponse.json();
        
        // Se não encontrou dispositivos, não há o que cancelar
        if (!devices || devices.length === 0) {
          console.log("Nenhum dispositivo encontrado para cancelar");
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
          toast({
            title: "Notificações já estão desativadas",
            description: "Não foi encontrada nenhuma inscrição ativa para cancelar.",
          });
          return;
        }
        
        let devicesCanceled = 0;
        
        // Verificar se temos dispositivos Firebase ou iOS
        const specialDevices = devices.filter((d: any) => 
          d.deviceType === DeviceType.FIREBASE || 
          d.deviceType === DeviceType.IOS || 
          d.deviceType === 'firebase' || 
          d.deviceType === 'ios'
        );
        
        // Se temos dispositivos especiais, cancelamos todos
        if (specialDevices.length > 0) {
          for (const device of specialDevices) {
            await apiRequest("DELETE", `/api/devices/${device.id}`);
            console.log(`Dispositivo ${device.deviceType} (ID: ${device.id}) excluído`);
            devicesCanceled++;
          }
        }
        
        // Caso especial para iOS (compatibilidade com registros antigos)
        if (isIOS()) {
          console.log("Verificando dispositivos iOS adicionais...");
          
          // Buscar dispositivos iOS que não tenham sido filtrados acima (formato antigo)
          const iosDevices = devices.filter((d: any) => 
            d.deviceType === "ios" && 
            !specialDevices.some((sd: any) => sd.id === d.id)
          );
          
          if (iosDevices.length > 0) {
            // Excluir todos os dispositivos iOS
            for (const device of iosDevices) {
              await apiRequest("DELETE", `/api/devices/${device.id}`);
              console.log(`Dispositivo iOS ${device.id} excluído`);
              devicesCanceled++;
            }
          }
        }
        
        // Fluxo padrão para Web Push
        if (("serviceWorker" in navigator) && ("PushManager" in window)) {
          console.log("Tentando cancelar inscrição de Web Push padrão...");
          
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
              // Verificar se este subscription já não foi cancelado acima
              const deviceTokenStr = JSON.stringify(subscription.toJSON());
              const webDevice = devices.find((d: any) => 
                d.deviceToken === deviceTokenStr && 
                !specialDevices.some((sd: any) => sd.id === d.id)
              );
              
              if (webDevice) {
                // Se ainda existe um dispositivo com este token, cancelamos
                await apiRequest("DELETE", `/api/devices/${webDevice.id}`);
                console.log(`Dispositivo Web Push ${webDevice.id} excluído`);
                devicesCanceled++;
              }
              
              // Cancelar a inscrição no navegador de qualquer forma
              await subscription.unsubscribe();
              console.log("Inscrição Web Push cancelada no navegador");
            }
          } catch (webPushError) {
            console.error("Erro ao cancelar inscrição de Web Push:", webPushError);
          }
        }
        
        // Atualizar o estado
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        
        if (devicesCanceled > 0) {
          toast({
            title: "Notificações desativadas",
            description: `${devicesCanceled} ${devicesCanceled === 1 ? 'dispositivo foi cancelado' : 'dispositivos foram cancelados'} com sucesso.`,
          });
        } else {
          toast({
            title: "Notificações já estão desativadas",
            description: "Não foi encontrada nenhuma inscrição ativa para cancelar.",
          });
        }
      } catch (deviceError) {
        console.error("Erro ao buscar ou cancelar dispositivos:", deviceError);
        
        // Tentar o caminho tradicional como fallback
        if (("serviceWorker" in navigator) && ("PushManager" in window)) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
              // Tentar cancelar no navegador de qualquer forma
              await subscription.unsubscribe();
              console.log("Inscrição Web Push cancelada no navegador como fallback");
              
              // Atualizar o estado
              setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
              toast({
                title: "Notificações parcialmente desativadas",
                description: "Notificações foram desativadas no navegador, mas houve um erro ao comunicar com o servidor.",
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
            console.error("Erro no fallback para cancelar inscrição:", error);
            toast({
              title: "Erro ao desativar notificações",
              description: "Ocorreu um erro ao tentar desativar as notificações. Tente novamente mais tarde.",
              variant: "destructive",
            });
          }
        }
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
      // Verificar se o usuário está autenticado e atualizar estado de autenticação se necessário
      if (!isAuthenticated) {
        console.log("Tentando atualizar estado de autenticação antes de testar notificações...");
        const refreshedUser = await refreshAuth();
        
        if (!refreshedUser) {
          console.error("Falha ao atualizar autenticação para teste de notificação");
          toast({
            title: "Erro de autenticação",
            description: "Você precisa estar logado para testar notificações. Por favor, faça login novamente.",
            variant: "destructive",
          });
          return;
        } else {
          console.log("Autenticação atualizada com sucesso para teste:", refreshedUser.username);
        }
      }
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
      if (payload.platform === undefined) {
        if (isIOSDevice) {
          payload.platform = DeviceType.IOS;
        } else {
          // Verificar se temos Firebase
          try {
            const hasFirebase = await getFirebaseToken() !== null;
            if (hasFirebase) {
              payload.platform = DeviceType.FIREBASE;
            } else {
              payload.platform = DeviceType.WEB;
            }
          } catch (e) {
            payload.platform = DeviceType.WEB;
          }
        }
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
    setDeviceType(isIOSDevice ? DeviceType.IOS : DeviceType.WEB);
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
