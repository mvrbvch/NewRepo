import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast"; // Importar apenas a função toast, não o hook
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
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  testNotification: () => Promise<void>;
}

// Criação do contexto
const PushNotificationsContext = createContext<PushNotificationsContextType | null>(null);

// Provedor do contexto
export function PushNotificationsProvider({ children }: { children: ReactNode }) {
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
    throw new Error("usePushNotifications deve ser usado dentro de um PushNotificationsProvider");
  }
  return context;
}

// Implementação real do hook, usado pelo provedor
function usePushNotificationsHook(): PushNotificationsContextType {
  // Não usamos useToast() para evitar dependência circular
  const [isPending, setIsPending] = useState(false);
  // Inicializa com NOT_SUBSCRIBED em vez de NOT_SUPPORTED para dar uma melhor experiência inicial
  const [subscriptionStatus, setSubscriptionStatus] = useState<PushSubscriptionStatus>(
    PushSubscriptionStatus.NOT_SUBSCRIBED
  );

  // Verificar o status inicial
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Verifica se estamos no iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };

  // Verifica se estamos no Safari no iOS
  const isIOSSafari = () => {
    const ua = navigator.userAgent;
    return isIOS() && ua.includes('Safari') && !ua.includes('Chrome');
  };

  // Verifica se o iOS suporta notificações push (iOS 16.4+)
  const isIOSPushSupported = () => {
    if (!isIOS()) return false;
    
    // Extrai a versão do iOS do user-agent
    const match = navigator.userAgent.match(/OS\s+(\d+)_(\d+)/);
    if (!match) return false;
    
    const majorVersion = parseInt(match[1], 10);
    const minorVersion = parseInt(match[2], 10);
    
    // iOS 16.4+ suporta notificações push no Safari
    return (majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4));
  };

  // Função para verificar o status atual da inscrição
  const checkSubscriptionStatus = async () => {
    // Verifica logs para depuração
    console.log("[Push] Iniciando verificação de status de notificações push");
    
    // Primeiro, verifica se estamos no iOS
    if (isIOS()) {
      // Caso especial para Safari no iOS 16.4+
      if (isIOSSafari() && isIOSPushSupported()) {
        // Continua com a verificação normal, pois o push é suportado
        console.log("[Push] Safari no iOS 16.4+ detectado - Push é suportado");
      } 
      // iOS mais antigo ou outro navegador no iOS que não suporta push
      else if (!isIOSPushSupported()) {
        console.log("[Push] Navegador iOS detectado mas Push não é suportado nesta versão");
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
        return;
      }
    }

    // Verificação padrão para navegadores não-iOS ou Safari no iOS 16.4+
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("[Push] ServiceWorker ou PushManager não suportados neste navegador");
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
      return;
    }

    try {
      // Verificar permissões do Notification API
      const permission = Notification.permission;
      if (permission === "denied") {
        console.log("[Push] Permissões de notificação negadas pelo usuário");
        setSubscriptionStatus(PushSubscriptionStatus.DENIED);
        return;
      }

      // Verificar se há algum service worker registrado
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        console.log("[Push] Nenhum Service Worker registrado. Tentando registrar...");
        try {
          // Tenta registrar o service worker explicitamente
          await navigator.serviceWorker.register('/service-worker.js');
          console.log("[Push] Service Worker registrado com sucesso");
        } catch (regError) {
          console.error("[Push] Erro ao registrar Service Worker:", regError);
          // Não define NOT_SUPPORTED para dar uma chance de funcionar depois
        }
      } else {
        console.log("[Push] Service Workers já registrados:", registrations.length);
      }

      try {
        // Aguarda o service worker estar pronto
        console.log("[Push] Aguardando Service Worker ficar pronto...");
        const registration = await navigator.serviceWorker.ready;
        console.log("[Push] Service Worker está pronto");
        
        // Verifica se há uma inscrição existente
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          console.log("[Push] Inscrição de push existente encontrada");
          setSubscriptionStatus(PushSubscriptionStatus.SUBSCRIBED);
        } else {
          console.log("[Push] Navegador suporta push, mas usuário não está inscrito");
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        }
      } catch (swError) {
        console.error("[Push] Erro ao acessar service worker:", swError);
        
        // Se estamos no iOS e ocorreu um erro, pode ser uma limitação da plataforma
        if (isIOS()) {
          console.log("[Push] Erro de service worker no iOS - limitação conhecida");
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
        } else {
          console.log("[Push] Erro não relacionado ao iOS - considerando como NÃO_INSCRITO");
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        }
      }
    } catch (error) {
      console.error("[Push] Erro ao verificar status da inscrição:", error);
      // Mesmo com erro, vamos tentar oferecer a possibilidade de inscrição
      if (!isIOS()) {
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
      } else {
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
      }
    }
  };

  // Registrar um novo dispositivo no backend
  const registerDeviceMutation = useMutation({
    mutationFn: async (subscription: PushSubscriptionJSON) => {
      const response = await apiRequest("POST", "/api/devices/register", {
        deviceToken: JSON.stringify(subscription),
        deviceType: "web",
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
      const response = await apiRequest("POST", "/api/devices/unregister", {
        deviceToken: JSON.stringify(subscription),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
    },
  });

  // Função para inscrever o usuário para notificações push
  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast({
        title: "Erro",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPending(true);

      // Solicitar permissão do usuário
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
          "BDd3_hVL9bzn8xbpNV-0JecHiVhvQqMMn6SrTHce-cW6ogFLkP_rF9FKPkEVX-O-0FM-sgGh5cqEHVKgE3Ury_A"
        ),
      });

      // Registrar a inscrição no servidor
      await registerDeviceMutation.mutateAsync(subscription.toJSON());

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
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      setIsPending(true);
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

  // Testar envio de notificação
  const testNotification = async () => {
    try {
      const response = await apiRequest("POST", "/api/notifications/test");
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Notificação de teste enviada",
          description: "Verifique se você recebeu a notificação.",
        });
      } else {
        toast({
          title: "Erro",
          description: result.message || "Não foi possível enviar a notificação de teste.",
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

  return {
    subscriptionStatus,
    isPending,
    subscribe,
    unsubscribe,
    testNotification,
  };
}

// Função auxiliar para converter chave VAPID para o formato correto
function urlBase64ToUint8Array(base64String: string) {
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
}