import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { usePushNotifications, PushSubscriptionStatus } from "@/hooks/use-push-notifications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationButton({ className, ...props }: ButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    subscriptionStatus,
    subscribe,
    unsubscribe,
    isPending,
  } = usePushNotifications();

  // Função para exibir o status em português
  const getStatusText = () => {
    switch (subscriptionStatus) {
      case PushSubscriptionStatus.SUBSCRIBED:
        return "Ativo";
      case PushSubscriptionStatus.DENIED:
        return "Bloqueado";
      case PushSubscriptionStatus.NOT_SUPPORTED:
        return "Não suportado";
      default:
        return "Desativado";
    }
  };

  // Badge indicadora de status
  const getStatusBadge = () => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    
    switch (subscriptionStatus) {
      case PushSubscriptionStatus.SUBSCRIBED:
        variant = "default";
        break;
      case PushSubscriptionStatus.DENIED:
        variant = "destructive";
        break;
      case PushSubscriptionStatus.NOT_SUPPORTED:
        variant = "secondary";
        break;
      default:
        variant = "outline";
    }
    
    return (
      <Badge variant={variant} className="ml-2">
        {getStatusText()}
      </Badge>
    );
  };

  // Função chamada quando o usuário decide alterar o status
  const handleToggleSubscription = async () => {
    if (subscriptionStatus === PushSubscriptionStatus.SUBSCRIBED) {
      await unsubscribe();
    } else if (
      subscriptionStatus === PushSubscriptionStatus.NOT_SUBSCRIBED
    ) {
      await subscribe();
    }
  };

  // Texto do botão de ação
  const getActionButtonText = () => {
    if (isPending) return "Processando...";
    
    if (subscriptionStatus === PushSubscriptionStatus.SUBSCRIBED) {
      return "Desativar Notificações";
    } else if (subscriptionStatus === PushSubscriptionStatus.NOT_SUBSCRIBED) {
      return "Ativar Notificações";
    } else if (subscriptionStatus === PushSubscriptionStatus.DENIED) {
      return "Notificações Bloqueadas";
    } else {
      return "Notificações Não Suportadas";
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        className={cn("relative", className)}
        onClick={() => setIsDialogOpen(true)}
        {...props}
      >
        <Bell className="h-5 w-5" />
        {subscriptionStatus === PushSubscriptionStatus.SUBSCRIBED && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              Notificações Push {getStatusBadge()}
            </DialogTitle>
            <DialogDescription>
              Receba alertas sobre tarefas domésticas e eventos importantes do seu relacionamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-sm space-y-4">
              <p>
                As notificações permitem que você e seu parceiro comuniquem-se sobre:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Lembretes de tarefas domésticas</li>
                <li>Eventos importantes no calendário</li>
                <li>Mensagens diretas do seu parceiro</li>
              </ul>
              
              {subscriptionStatus === PushSubscriptionStatus.DENIED && (
                <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
                  <p className="font-medium">Notificações bloqueadas pelo navegador</p>
                  <p className="text-xs mt-1">
                    Para ativar: acesse as configurações do seu navegador, 
                    encontre as permissões deste site e permita notificações.
                  </p>
                </div>
              )}
              
              {subscriptionStatus === PushSubscriptionStatus.NOT_SUPPORTED && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                  <p className="font-medium">Notificações push indisponíveis</p>
                  <p className="text-xs mt-1">
                    As notificações push podem não estar disponíveis neste ambiente devido a restrições do navegador ou limitações do servidor. No modo PWA instalado em um dispositivo móvel, elas funcionarão normalmente.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Fechar
              </Button>
            </DialogClose>
            
            {(subscriptionStatus === PushSubscriptionStatus.SUBSCRIBED || 
              subscriptionStatus === PushSubscriptionStatus.NOT_SUBSCRIBED) && (
              <Button 
                onClick={handleToggleSubscription}
                disabled={isPending || 
                  (subscriptionStatus !== PushSubscriptionStatus.SUBSCRIBED && 
                   subscriptionStatus !== PushSubscriptionStatus.NOT_SUBSCRIBED)}
                variant={subscriptionStatus === PushSubscriptionStatus.SUBSCRIBED ? "outline" : "default"}
                size="sm"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {getActionButtonText()}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}