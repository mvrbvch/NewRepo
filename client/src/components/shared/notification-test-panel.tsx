import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { BellIcon, InfoIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";

/**
 * Painel de teste de notificações que permite ao usuário enviar notificações
 * de teste para seu próprio dispositivo e verificar a configuração do sistema
 * de notificações.
 */
export function NotificationTestPanel() {
  const [title, setTitle] = useState("Notificação de Teste");
  const [body, setBody] = useState("Esta é uma notificação de teste enviada pelo aplicativo!");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useOneSignal, setUseOneSignal] = useState(true);
  
  const {
    subscribe,
    unsubscribe,
    subscription,
    isPushSupported,
    isSubscribed,
    pushError,
    permissionState,
    registerServiceWorker,
  } = usePushNotifications();

  async function handleTestWebPush() {
    if (!isSubscribed) {
      setError("Você precisa ativar as notificações primeiro!");
      return;
    }

    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/push/test-web-push", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          useOneSignal
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar notificação: ${response.statusText}`);
      }

      setSuccess("Notificação enviada com sucesso!");
    } catch (err) {
      setError(`Falha ao enviar notificação: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestOneSignal() {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/push/test-onesignal", {
        method: "POST",
        body: JSON.stringify({
          title,
          body
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar notificação: ${response.statusText}`);
      }

      if (response.oneSignalSent || response.regularSent) {
        setSuccess(`Notificação enviada com sucesso! ${response.oneSignalSent ? 'OneSignal: Sim' : ''} ${response.regularSent ? 'WebPush: Sim' : ''}`);
      } else {
        setSuccess("Solicitação enviada, mas nenhuma notificação foi entregue. Verifique se o dispositivo está registrado.");
      }
    } catch (err) {
      setError(`Falha ao enviar notificação: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function checkOneSignalConfig() {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/push/onesignal-info", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar configuração: ${response.statusText}`);
      }

      if (response.isConfigured) {
        setSuccess("OneSignal está configurado corretamente!");
      } else {
        setError("OneSignal não está configurado. Verifique se as chaves de API estão presentes.");
      }
    } catch (err) {
      setError(`Falha ao verificar configuração: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BellIcon className="w-5 h-5 mr-2" />
          Teste de Notificações
        </CardTitle>
        <CardDescription>
          Configure e envie notificações de teste para seu dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="advanced">Configurações Avançadas</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4 mt-4">
              {!isPushSupported && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Notificações não suportadas</AlertTitle>
                  <AlertDescription>
                    Seu navegador não suporta notificações push. Tente utilizar um navegador moderno como Chrome, Firefox ou Edge.
                  </AlertDescription>
                </Alert>
              )}

              {pushError && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Erro no sistema de notificações</AlertTitle>
                  <AlertDescription>{pushError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notification-status" className="flex items-center">
                    Notificações Web
                    <Badge variant={isSubscribed ? "success" : "outline"} className="ml-2">
                      {isSubscribed ? "Ativadas" : "Desativadas"}
                    </Badge>
                  </Label>
                  <Switch
                    id="notification-status"
                    checked={isSubscribed}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        subscribe();
                      } else {
                        unsubscribe();
                      }
                    }}
                    disabled={!isPushSupported || loading}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {permissionState === "granted"
                    ? "Você já concedeu permissão para receber notificações."
                    : permissionState === "denied"
                    ? "Você bloqueou as notificações. Altere as permissões nas configurações do navegador."
                    : "Ative para receber notificações push neste dispositivo."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-title">Título da Notificação</Label>
                <Input
                  id="notification-title"
                  placeholder="Digite o título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-body">Conteúdo da Notificação</Label>
                <Textarea
                  id="notification-body"
                  placeholder="Digite o conteúdo da mensagem"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                />
              </div>

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Sucesso</AlertTitle>
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4 mt-4">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Informação</AlertTitle>
                <AlertDescription>
                  Estas configurações são para desenvolvedores e testes avançados do sistema de notificações.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Label htmlFor="use-onesignal">Usar OneSignal</Label>
                <Switch
                  id="use-onesignal"
                  checked={useOneSignal}
                  onCheckedChange={setUseOneSignal}
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Diagnóstico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => registerServiceWorker()}
                    disabled={loading}
                  >
                    Registrar Service Worker
                  </Button>
                  <Button
                    variant="outline"
                    onClick={checkOneSignalConfig}
                    disabled={loading}
                  >
                    Verificar Config. OneSignal
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Voltar
        </Button>
        <Button onClick={handleTestWebPush} disabled={loading || !title || !body}>
          {loading ? "Enviando..." : "Enviar Notificação de Teste"}
        </Button>
      </CardFooter>
    </Card>
  );
}