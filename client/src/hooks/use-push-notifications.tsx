import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<PushSubscriptionStatus>(
    PushSubscriptionStatus.NOT_SUPPORTED
  );

  // Verificar o status inicial
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Função para verificar o status atual da inscrição
  const checkSubscriptionStatus = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
      return;
    }

    try {
      const permission = Notification.permission;
      if (permission === "denied") {
        setSubscriptionStatus(PushSubscriptionStatus.DENIED);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setSubscriptionStatus(PushSubscriptionStatus.SUBSCRIBED);
      } else {
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
      }
    } catch (error) {
      console.error("Erro ao verificar status da inscrição:", error);
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
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