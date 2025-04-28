import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatedList } from "@/components/ui/animated-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Home,
  MessageSquare,
  MoreVertical,
  RefreshCw,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

// Interface para notificações
interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
  metadata?: string | null;
}

export function NotificationCenter() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Buscar notificações
  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    staleTime: 60000, // 1 minuto
  });

  // Mutação para marcar notificação como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "PUT",
        `/api/notifications/${id}/read`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/notifications-readAll`, {
        userId: id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications"],
      });
    },
  });

  // Mutação para excluir notificação
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificação excluída",
        description: "A notificação foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a notificação.",
        variant: "destructive",
      });
    },
  });

  // Atualizar notificações manualmente
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "Notificações atualizadas",
      description: "Suas notificações foram atualizadas.",
      duration: 2000,
    });
  };

  // Marcar notificação como lida
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  useEffect(() => {
    const userId = user?.id;
    setTimeout(() => {
      markAllAsRead.mutate(userId);
    }, 0); // 1 minuto
  }, []);

  // Excluir notificação
  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  // Obter ícone com base no tipo de notificação
  const getNotificationIcon = (notification: Notification) => {
    const { type, referenceType } = notification;

    switch (referenceType) {
      case "task":
        return <Home className="h-5 w-5 text-blue-500" />;
      case "event":
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "partner":
        return <User className="h-5 w-5 text-pink-500" />;
      case "test":
        return <Bell className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Formatar data relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  // Renderizar lista de notificações
  const renderNotifications = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-2">
            <X className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium">Erro ao carregar notificações</h3>
          <p className="text-gray-600 mt-1 mb-4">
            Não foi possível carregar suas notificações.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-gray-400 mb-2">
            <Bell className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium">Nenhuma notificação</h3>
          <p className="text-gray-600 mt-1">
            Você não tem notificações no momento.
          </p>
        </div>
      );
    }

    return (
      <AnimatedList
        items={notifications}
        keyExtractor={(item) => item.id}
        className="p-4 space-y-3"
        renderItem={(notification) => (
          <TactileFeedback
            onClick={() => {
              if (!notification.isRead) {
                handleMarkAsRead(notification.id);
              }
            }}
          >
            <Card
              className={`p-4 ${
                notification.isRead
                  ? "bg-gray-50"
                  : "bg-white border-l-4 border-l-primary"
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`font-semibold text-base ${
                        notification.isRead ? "text-gray-700" : "text-gray-900"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.isRead && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como lida
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      notification.isRead ? "text-gray-600" : "text-gray-800"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(
                      new Date(notification.createdAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: ptBR,
                      }
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TactileFeedback>
        )}
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Suas Notificações</h2>
          <p className="text-sm text-gray-600">
            {notifications.length} notificações
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">{renderNotifications()}</div>
    </div>
  );
}
