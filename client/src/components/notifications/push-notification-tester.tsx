import { useState } from "react";
import {
  usePushNotifications,
  DeviceType,
  TestNotificationOptions,
} from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Bell } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PushNotificationTester() {
  const { toast } = useToast();
  const { sendTestNotification } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<TestNotificationOptions>({
    title: "Notificação de teste",
    message:
      "Esta é uma notificação de teste para verificar se tudo está funcionando corretamente!",
    platform: null,
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "Ver detalhes",
      },
      {
        action: "dismiss",
        title: "Dispensar",
      },
    ],
  });

  const handleSendTest = async () => {
    try {
      setIsLoading(true);
      const result = await sendTestNotification(options);

      toast({
        title: "Notificação enviada",
        description: "Verifique se você recebeu a notificação push.",
      });

      console.log("Resultado do teste:", result);
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOption = (key: keyof TestNotificationOptions, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Bell className="h-5 w-5 mr-2 text-primary" />
        Testar Notificações Push
      </h3>

      <div className="space-y-4">
        <div>
          <Label htmlFor="notification-title">Título</Label>
          <Input
            id="notification-title"
            value={options.title || ""}
            onChange={(e) => updateOption("title", e.target.value)}
            placeholder="Título da notificação"
          />
        </div>

        <div>
          <Label htmlFor="notification-message">Mensagem</Label>
          <Textarea
            id="notification-message"
            value={options.message || ""}
            onChange={(e) => updateOption("message", e.target.value)}
            placeholder="Conteúdo da notificação"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="notification-platform">Plataforma</Label>
          <Select
            value={options.platform || "all"}
            onValueChange={(value) =>
              updateOption("platform", value === "all" ? null : value)
            }
          >
            <SelectTrigger id="notification-platform">
              <SelectValue placeholder="Selecione a plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as plataformas</SelectItem>
              <SelectItem value={DeviceType.WEB}>Web</SelectItem>
              <SelectItem value={DeviceType.IOS}>iOS</SelectItem>
              <SelectItem value={DeviceType.ANDROID}>Android</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="require-interaction">Exigir interação</Label>
            <p className="text-xs text-gray-600">
              A notificação permanecerá visível até que o usuário interaja com
              ela
            </p>
          </div>
          <Switch
            id="require-interaction"
            checked={options.requireInteraction || false}
            onCheckedChange={(checked) =>
              updateOption("requireInteraction", checked)
            }
          />
        </div>

        <Button
          onClick={handleSendTest}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar notificação de teste
            </>
          )}
        </Button>

        <p className="text-xs text-gray-600 mt-2">
          Esta ferramenta envia uma notificação de teste para seus dispositivos
          registrados. Útil para verificar se as notificações push estão
          funcionando corretamente.
        </p>
      </div>
    </Card>
  );
}
