import { useState } from "react";
import { Bell, BellRing, BellOff, Loader2 } from "lucide-react";
import { 
  Button,
  ButtonProps 
} from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePushNotifications, PermissionStatus } from "@/hooks/use-push-notifications";
import { Badge } from "@/components/ui/badge";

interface NotificationButtonProps extends ButtonProps {
  showUnreadCount?: boolean;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function NotificationButton({
  showUnreadCount = true,
  variant = "ghost",
  size = "icon",
  ...props
}: NotificationButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { 
    isRegistered, 
    isRegistering, 
    registerDevice, 
    unregisterDevice, 
    permissionStatus,
    unreadCount,
  } = usePushNotifications();

  const handleEnableNotifications = async () => {
    await registerDevice();
    setDialogOpen(false);
  };

  const handleDisableNotifications = async () => {
    await unregisterDevice();
    setDialogOpen(false);
  };

  const getIcon = () => {
    if (isRegistering) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }

    if (isRegistered) {
      return <BellRing className="h-5 w-5" />;
    }

    if (permissionStatus === PermissionStatus.DENIED) {
      return <BellOff className="h-5 w-5" />;
    }

    return <Bell className="h-5 w-5" />;
  };

  const getTooltipText = () => {
    if (isRegistering) {
      return "Registrando dispositivo...";
    }

    if (isRegistered) {
      return "Notificações ativadas";
    }

    if (permissionStatus === PermissionStatus.DENIED) {
      return "Notificações bloqueadas pelo navegador";
    }

    return "Ativar notificações";
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant={variant} size={size} {...props} className="relative">
                  {getIcon()}
                  {showUnreadCount && unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Notificações</DialogTitle>
                  <DialogDescription>
                    {permissionStatus === PermissionStatus.DENIED ? (
                      "Você bloqueou as notificações neste site. Para receber notificações, você precisa alterar as configurações de permissão no seu navegador."
                    ) : (
                      "Receba notificações importantes sobre suas tarefas e eventos compartilhados com seu parceiro."
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">Status atual</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRegistered 
                        ? "Você está recebendo notificações neste dispositivo."
                        : permissionStatus === PermissionStatus.DENIED
                          ? "Notificações bloqueadas pelo navegador."
                          : permissionStatus === PermissionStatus.UNSUPPORTED
                            ? "Seu navegador não suporta notificações."
                            : "Você não está recebendo notificações neste dispositivo."}
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  
                  {isRegistered ? (
                    <Button variant="destructive" onClick={handleDisableNotifications} disabled={isRegistering}>
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Aguarde
                        </>
                      ) : (
                        "Desativar notificações"
                      )}
                    </Button>
                  ) : permissionStatus !== PermissionStatus.DENIED && permissionStatus !== PermissionStatus.UNSUPPORTED && (
                    <Button onClick={handleEnableNotifications} disabled={isRegistering}>
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Ativando
                        </>
                      ) : (
                        "Ativar notificações"
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}