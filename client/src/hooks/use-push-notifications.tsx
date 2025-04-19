import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceType: string | null;
  referenceId: number | null;
  metadata: any | null;
  isRead: boolean;
  createdAt: string | Date | null;
}

export interface UserDevice {
  id: number;
  userId: number;
  deviceToken: string;
  deviceType: string;
  deviceName: string | null;
  pushEnabled: boolean;
  lastUsed: string | Date | null;
  createdAt: string | Date | null;
}

// Status da permissão de notificação
export enum PermissionStatus {
  DEFAULT = 'default',
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
  UNSUPPORTED = 'unsupported'
}

interface PushNotificationsContextType {
  // Status
  isRegistered: boolean;
  isRegistering: boolean;
  permissionStatus: PermissionStatus;
  
  // Dados
  deviceId: number | null;
  notifications: Notification[];
  unreadCount: number;
  
  // Funções
  registerDevice: () => Promise<boolean>;
  unregisterDevice: () => Promise<boolean>;
  markAsRead: (notificationId: number) => Promise<boolean>;
  deleteNotification: (notificationId: number) => Promise<boolean>;
  refreshNotifications: () => void;
}

const PushNotificationsContext = createContext<PushNotificationsContextType | null>(null);

// Função para gerar um token de dispositivo único
function generateDeviceToken(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Função para obter informações do dispositivo atual
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  return {
    type: isIOS ? 'ios' : (isMobile ? 'android' : 'web'),
    name: navigator.platform
  };
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estado local
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(
    'Notification' in window ? PermissionStatus.DEFAULT : PermissionStatus.UNSUPPORTED
  );
  
  // Verificar o estado da permissão atual
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission as PermissionStatus);
    }
  }, []);
  
  // Carregar token do dispositivo do localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('deviceToken');
    if (savedToken) {
      setDeviceToken(savedToken);
    } else {
      const newToken = generateDeviceToken();
      localStorage.setItem('deviceToken', newToken);
      setDeviceToken(newToken);
    }
  }, []);
  
  // Buscar notificações do usuário
  const { 
    data: notifications = [], 
    refetch: refreshNotifications
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', '/api/notifications');
      return await res.json();
    },
    enabled: !!user
  });
  
  // Contar notificações não lidas
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Buscar dispositivos registrados para verificar se este dispositivo já está registrado
  const { data: devices = [] } = useQuery<UserDevice[]>({
    queryKey: ['/api/devices'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', '/api/devices');
      return await res.json();
    },
    enabled: !!user && !!deviceToken
  });
  
  // Efeito para verificar se o dispositivo atual já está registrado
  useEffect(() => {
    if (devices.length > 0 && deviceToken) {
      const thisDevice = devices.find(device => device.deviceToken === deviceToken);
      if (thisDevice) {
        setDeviceId(thisDevice.id);
      }
    }
  }, [devices, deviceToken]);
  
  // Mutação para registrar o dispositivo
  const registerDeviceMutation = useMutation({
    mutationFn: async () => {
      if (!user || !deviceToken) throw new Error('Usuário não autenticado ou token de dispositivo não disponível');
      
      // Se o dispositivo já estiver registrado, atualizar
      if (deviceId) {
        const res = await apiRequest('PUT', `/api/devices/${deviceId}`, {
          deviceToken,
          deviceType: getDeviceInfo().type,
          deviceName: getDeviceInfo().name,
          pushEnabled: true,
          lastUsed: new Date().toISOString()
        });
        return await res.json();
      }
      
      // Caso contrário, registrar novo dispositivo
      const res = await apiRequest('POST', '/api/devices', {
        deviceToken,
        deviceType: getDeviceInfo().type,
        deviceName: getDeviceInfo().name,
        pushEnabled: true
      });
      
      const device = await res.json();
      return device;
    },
    onSuccess: (device) => {
      setDeviceId(device.id);
      toast({
        title: 'Dispositivo registrado',
        description: 'Este dispositivo agora pode receber notificações',
      });
      
      // Atualizar lista de dispositivos
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Falha ao registrar dispositivo',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para desregistrar o dispositivo
  const unregisterDeviceMutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) throw new Error('Dispositivo não registrado');
      
      const res = await apiRequest('DELETE', `/api/devices/${deviceId}`);
      
      if (res.ok) {
        return true;
      }
      
      throw new Error('Falha ao desregistrar dispositivo');
    },
    onSuccess: () => {
      setDeviceId(null);
      toast({
        title: 'Dispositivo desregistrado',
        description: 'Este dispositivo não receberá mais notificações',
      });
      
      // Atualizar lista de dispositivos
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Falha ao desregistrar dispositivo',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para marcar notificação como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      
      if (res.ok) {
        return await res.json();
      }
      
      throw new Error('Falha ao marcar notificação como lida');
    },
    onSuccess: () => {
      // Atualizar lista de notificações
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Falha ao marcar notificação',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para excluir notificação
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('DELETE', `/api/notifications/${notificationId}`);
      
      if (res.ok) {
        return true;
      }
      
      throw new Error('Falha ao excluir notificação');
    },
    onSuccess: () => {
      // Atualizar lista de notificações
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Falha ao excluir notificação',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Função para solicitar permissão e registrar o dispositivo
  const registerDevice = async (): Promise<boolean> => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission as PermissionStatus);
        
        if (permission === 'granted') {
          await registerDeviceMutation.mutateAsync();
          return true;
        } else {
          toast({
            title: 'Permissão negada',
            description: 'Você precisa permitir notificações para receber alertas',
            variant: 'destructive',
          });
          return false;
        }
      } else {
        toast({
          title: 'Notificações não suportadas',
          description: 'Seu navegador não suporta notificações push',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao registrar dispositivo:', error);
      return false;
    }
  };
  
  // Função para desregistrar o dispositivo
  const unregisterDevice = async (): Promise<boolean> => {
    try {
      if (deviceId) {
        await unregisterDeviceMutation.mutateAsync();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao desregistrar dispositivo:', error);
      return false;
    }
  };
  
  // Função para marcar notificação como lida
  const markAsRead = async (notificationId: number): Promise<boolean> => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  };
  
  // Função para excluir notificação
  const deleteNotification = async (notificationId: number): Promise<boolean> => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      return false;
    }
  };
  
  return (
    <PushNotificationsContext.Provider
      value={{
        // Status
        isRegistered: deviceId !== null,
        isRegistering: registerDeviceMutation.isPending,
        permissionStatus,
        
        // Dados
        deviceId,
        notifications,
        unreadCount,
        
        // Funções
        registerDevice,
        unregisterDevice,
        markAsRead,
        deleteNotification,
        refreshNotifications
      }}
    >
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);
  if (!context) {
    throw new Error('usePushNotifications deve ser usado dentro de PushNotificationsProvider');
  }
  return context;
}