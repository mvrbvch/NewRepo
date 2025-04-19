import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Interface segura para a assinatura push
interface SafePushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Estados possíveis da assinatura de notificações
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
  // Estado para controlar o status da assinatura
  const [subscriptionStatus, setSubscriptionStatus] = useState<PushSubscriptionStatus>(
    PushSubscriptionStatus.NOT_SUBSCRIBED
  );
  const [isPending, setIsPending] = useState(false);
  
  // Verificar o status inicial
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);
  
  // Verificar se estamos no iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };
  
  // Verificar se estamos no Safari no iOS
  const isIOSSafari = () => {
    const ua = navigator.userAgent;
    return isIOS() && ua.includes('Safari') && !ua.includes('Chrome');
  };
  
  // Verificar se o iOS suporta notificações push (iOS 16.4+)
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
    console.log("[Push] Iniciando verificação de status de notificações push");
    
    // Verificação para iOS
    if (isIOS()) {
      if (isIOSSafari() && isIOSPushSupported()) {
        console.log("[Push] Safari no iOS 16.4+ detectado - Push é suportado");
      } else if (!isIOSPushSupported()) {
        console.log("[Push] Navegador iOS detectado mas Push não é suportado nesta versão");
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
        return;
      }
    }
    
    // Verificação padrão
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("[Push] ServiceWorker ou PushManager não suportados neste navegador");
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
      return;
    }
    
    try {
      // Verificar permissões
      const permission = Notification.permission;
      if (permission === "denied") {
        console.log("[Push] Permissões de notificação negadas pelo usuário");
        setSubscriptionStatus(PushSubscriptionStatus.DENIED);
        return;
      }
      
      // Verificar registros de service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        console.log("[Push] Nenhum Service Worker registrado. Tentando registrar...");
        try {
          await navigator.serviceWorker.register('/service-worker.js');
          console.log("[Push] Service Worker registrado com sucesso");
        } catch (error) {
          console.error("[Push] Erro ao registrar Service Worker:", error);
        }
      } else {
        console.log("[Push] Service Workers já registrados:", registrations.length);
      }
      
      try {
        // Aguardar o service worker estar pronto
        const registration = await navigator.serviceWorker.ready;
        
        // Verificar se há uma assinatura existente
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          console.log("[Push] Inscrição de push existente encontrada");
          setSubscriptionStatus(PushSubscriptionStatus.SUBSCRIBED);
        } else {
          console.log("[Push] Navegador suporta push, mas usuário não está inscrito");
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        }
      } catch (error) {
        console.error("[Push] Erro ao acessar service worker:", error);
        
        if (isIOS()) {
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
        } else {
          setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        }
      }
    } catch (error) {
      console.error("[Push] Erro ao verificar status da inscrição:", error);
      
      if (!isIOS()) {
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
      } else {
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
      }
    }
  };
  
  // Mutation para registrar dispositivo
  const registerDeviceMutation = useMutation({
    mutationFn: async (subscription: SafePushSubscriptionJSON) => {
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
  
  // Mutation para remover dispositivo
  const unregisterDeviceMutation = useMutation({
    mutationFn: async (subscription: SafePushSubscriptionJSON) => {
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
      
      // Solicitar permissão
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
      
      // Registrar service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Gerar assinatura VAPID
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BDd3_hVL9bzn8xbpNV-0JecHiVhvQqMMn6SrTHce-cW6ogFLkP_rF9FKPkEVX-O-0FM-sgGh5cqEHVKgE3Ury_A"
        ),
      });
      
      // Criar versão segura do objeto de assinatura
      const subJSON = subscription.toJSON();
      const safeSubscription: SafePushSubscriptionJSON = {
        endpoint: subJSON.endpoint || "",
        expirationTime: subJSON.expirationTime,
        keys: {
          p256dh: subJSON.keys?.p256dh || "",
          auth: subJSON.keys?.auth || ""
        }
      };
      
      // Registrar no servidor
      await registerDeviceMutation.mutateAsync(safeSubscription);
      
      setSubscriptionStatus(PushSubscriptionStatus.SUBSCRIBED);
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações importantes.",
      });
    } catch (error) {
      console.error("[Push] Erro ao se inscrever:", error);
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
        // Criar versão segura do objeto de assinatura
        const subJSON = subscription.toJSON();
        const safeSubscription: SafePushSubscriptionJSON = {
          endpoint: subJSON.endpoint || "",
          expirationTime: subJSON.expirationTime,
          keys: {
            p256dh: subJSON.keys?.p256dh || "",
            auth: subJSON.keys?.auth || ""
          }
        };
        
        // Remover do servidor
        await unregisterDeviceMutation.mutateAsync(safeSubscription);
        
        // Cancelar localmente
        await subscription.unsubscribe();
        
        setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações.",
        });
      }
    } catch (error) {
      console.error("[Push] Erro ao cancelar inscrição:", error);
      toast({
        title: "Erro ao desativar notificações",
        description: "Ocorreu um erro ao desativar as notificações.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };
  
  // Função para testar notificação
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
      console.error("[Push] Erro ao enviar notificação de teste:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a notificação de teste.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <PushNotificationsContext.Provider
      value={{
        subscriptionStatus,
        isPending,
        subscribe,
        unsubscribe,
        testNotification,
      }}
    >
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

// Função auxiliar para converter chave VAPID
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