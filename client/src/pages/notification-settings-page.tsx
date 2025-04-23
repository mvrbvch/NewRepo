import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { PushNotificationTester } from "@/components/notifications/push-notification-tester";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usePushNotifications,
  PushSubscriptionStatus,
} from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  BellOff,
  Settings,
  Info,
  AlertTriangle,
  Smartphone,
} from "lucide-react";

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("notifications");
  const {
    isPushSupported,
    isPushEnabled,
    pushStatus,
    enablePushNotifications,
    disablePushNotifications,
  } = usePushNotifications();

  // Buscar dispositivos registrados
  const { data: devices = [] } = useQuery({
    queryKey: ["/api/devices"],
    enabled: isPushEnabled,
  });

  // Manipular alteração do status de notificações push
  const handlePushToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await enablePushNotifications();
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações push neste dispositivo.",
        });
      } else {
        await disablePushNotifications();
        toast({
          title: "Notificações desativadas",
          description:
            "Você não receberá mais notificações push neste dispositivo.",
        });
      }
    } catch (error) {
      console.error("Erro ao alterar configuração de notificações:", error);
      toast({
        title: "Erro na configuração",
        description:
          "Não foi possível alterar as configurações de notificação.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header title="Notificações" />

      <Tabs
        defaultValue="notifications"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1"
      >
        <div className="px-4 pt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notifications" className="flex-1 overflow-hidden">
          <NotificationCenter />
        </TabsContent>

        <TabsContent
          value="settings"
          className="p-4 space-y-4 overflow-y-auto pb-20"
        >
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              Configurações de Notificações
            </h3>

            <div className="space-y-6">
              {/* Configuração de notificações push */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-base">Notificações Push</h4>
                    <p className="text-sm text-gray-600">
                      Receba notificações mesmo quando o app estiver fechado
                    </p>
                  </div>
                  <Switch
                    checked={isPushEnabled}
                    onCheckedChange={handlePushToggle}
                    disabled={
                      !isPushSupported ||
                      pushStatus === PushSubscriptionStatus.LOADING
                    }
                  />
                </div>

                {!isPushSupported && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Seu navegador não suporta notificações push. Tente usar um
                      navegador moderno como Chrome, Firefox ou Edge.
                    </p>
                  </div>
                )}

                {pushStatus === PushSubscriptionStatus.DENIED && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 text-red-800 rounded-md">
                    <BellOff className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Permissão negada</p>
                      <p className="text-sm">
                        Você negou a permissão para notificações. Para ativar,
                        você precisa alterar as configurações do navegador.
                      </p>
                    </div>
                  </div>
                )}

                {isPushEnabled && devices.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2 flex items-center">
                      <Smartphone className="h-4 w-4 mr-1" />
                      Dispositivos registrados
                    </h5>
                    <div className="space-y-2">
                      {devices.map((device: any) => (
                        <div
                          key={device.id}
                          className="text-sm p-2 bg-gray-50 rounded-md flex justify-between items-center"
                        >
                          <span>{device.deviceName || "Dispositivo"}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(device.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Componente de teste de notificações */}
              {isPushEnabled && <PushNotificationTester />}

              <hr />

              {/* Tipos de notificações */}
              <div>
                <h4 className="font-medium text-base mb-3">
                  Tipos de Notificações
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tarefas domésticas</p>
                      <p className="text-sm text-gray-600">
                        Lembretes e atualizações de tarefas
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Eventos do calendário</p>
                      <p className="text-sm text-gray-600">
                        Lembretes de eventos próximos
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mensagens do parceiro</p>
                      <p className="text-sm text-gray-600">
                        Notificações de novas mensagens
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <hr />

              {/* Horários silenciosos */}
              <div>
                <h4 className="font-medium text-base mb-3">
                  Horários Silenciosos
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Defina períodos em que você não deseja receber notificações
                </p>

                <Button variant="outline" className="w-full">
                  Configurar horários silenciosos
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                As notificações push permitem que você receba atualizações
                importantes mesmo quando não estiver usando o aplicativo. Você
                pode alterar essas configurações a qualquer momento.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}
