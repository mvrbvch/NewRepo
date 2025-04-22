import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "../lib/queryClient";

/**
 * Interface para o formato JSON da inscrição de push
 */
interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Status possíveis da inscrição de notificações push
 */
export enum PushSubscriptionStatus {
  NOT_SUPPORTED = "not_supported",
  DENIED = "denied",
  NOT_SUBSCRIBED = "not_subscribed",
  SUBSCRIBED = "subscribed",
}

/**
 * Tipos de dispositivo suportados para notificações
 */
export enum DeviceType {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android',
  FIREBASE = 'firebase'
}

/**
 * Opções para envio de notificação de teste
 */
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

/**
 * Interface do contexto de notificações push
 */
interface PushNotificationsContextType {
  subscriptionStatus: PushSubscriptionStatus;
  isPending: boolean;
  isIOSDevice: boolean;
  deviceType: DeviceType | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  testNotification: (options?: NotificationTestOptions) => Promise<void>;
}

// Criação do contexto
const PushNotificationsContext =
  createContext<PushNotificationsContextType | null>(null);

// Provedor do contexto - implementação simplificada focada apenas em eventos e tarefas
export function PushNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Estado
  const [subscriptionStatus, setSubscriptionStatus] = 
    useState<PushSubscriptionStatus>(PushSubscriptionStatus.NOT_SUPPORTED);
  const [isPending, setIsPending] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const { toast } = useToast();
  
  // Verificar se estamos no iOS
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document) ||
      /iPad|iPhone|iPod/.test(navigator.userAgent)
    );
  };
  
  // Detectar se o dispositivo é iOS
  const isIOSDevice = isIOS();
  
  // Define o tipo de dispositivo e verifica o suporte inicial
  useEffect(() => {
    // Atualizar tipo de dispositivo
    setDeviceType(isIOSDevice ? DeviceType.IOS : DeviceType.WEB);
    
    // Verificar suporte a notificações push
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
    } else {
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUPPORTED);
    }
  }, [isIOSDevice]);
  
  // Função para inscrever o usuário para notificações de novos eventos e tarefas
  const subscribe = async () => {
    try {
      setIsPending(true);
      
      // Solicitar permissão do navegador
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setSubscriptionStatus(PushSubscriptionStatus.DENIED);
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações para receber atualizações de eventos e tarefas.",
          variant: "destructive",
        });
        return;
      }
      
      // Registrar como inscrito (versão simplificada)
      setSubscriptionStatus(PushSubscriptionStatus.SUBSCRIBED);
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações para novos eventos e tarefas.",
      });
      
    } catch (error) {
      console.error("Erro ao ativar notificações:", error);
      toast({
        title: "Erro ao ativar notificações",
        description: "Ocorreu um erro ao configurar as notificações.",
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
      
      // Simplificado: apenas mudamos o estado
      setSubscriptionStatus(PushSubscriptionStatus.NOT_SUBSCRIBED);
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais notificações de eventos e tarefas.",
      });
      
    } catch (error) {
      console.error("Erro ao desativar notificações:", error);
      toast({
        title: "Erro ao desativar notificações",
        description: "Ocorreu um erro ao desativar as notificações.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };
  
  // Função para testar notificações
  const testNotification = async (options?: NotificationTestOptions) => {
    try {
      // Simplificado: apenas mostra um toast
      toast({
        title: "Notificação de teste",
        description: "Esta é uma simulação de notificação de novo evento/tarefa.",
      });
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
    }
  };

  return (
    <PushNotificationsContext.Provider value={{
      subscriptionStatus,
      isPending,
      isIOSDevice,
      deviceType,
      subscribe,
      unsubscribe,
      testNotification
    }}>
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