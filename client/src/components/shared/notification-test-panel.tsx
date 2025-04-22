import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { motion } from "framer-motion";

// Componente para testar notificações push com opções avançadas
export function NotificationTestPanel() {
  const { testNotification, isIOSDevice, deviceType, subscriptionStatus } = usePushNotifications();
  const [expanded, setExpanded] = useState(false);
  
  // Estado para as opções de notificação
  const [title, setTitle] = useState("Notificação de teste");
  const [message, setMessage] = useState("Esta é uma notificação de teste personalizada!");
  const [platform, setPlatform] = useState<'ios' | 'web' | null>(isIOSDevice ? 'ios' : 'web');
  const [sound, setSound] = useState(isIOSDevice ? "default" : "");
  const [badge, setBadge] = useState<number>(1);
  const [requireInteraction, setRequireInteraction] = useState(true);
  
  // Manipuladores de eventos
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value);
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value);
  const handleSoundChange = (value: string) => setSound(value);
  const handleBadgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setBadge(isNaN(val) ? 0 : val);
  };
  
  // Enviar notificação de teste com as opções configuradas
  const handleSendTestNotification = async () => {
    await testNotification({
      title,
      message,
      platform,
      sound: sound || undefined,
      badge,
      requireInteraction,
    });
  };

  // Enviar notificação rápida (sem configurações avançadas)
  const handleQuickTest = async () => {
    await testNotification();
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Teste de Notificações Push</CardTitle>
        <CardDescription>
          Configure e teste notificações push para diferentes plataformas
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Tabs defaultValue={isIOSDevice ? "ios" : "web"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="web" 
                  onClick={() => setPlatform('web')}
                  disabled={subscriptionStatus !== 'subscribed'}
                >
                  Web
                </TabsTrigger>
                <TabsTrigger 
                  value="ios" 
                  onClick={() => setPlatform('ios')}
                  disabled={subscriptionStatus !== 'subscribed'}
                >
                  iOS
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="web" className="space-y-4">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" value={title} onChange={handleTitleChange} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Input id="message" value={message} onChange={handleMessageChange} />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="requireInteraction" 
                        checked={requireInteraction}
                        onCheckedChange={setRequireInteraction}
                      />
                      <Label htmlFor="requireInteraction">Requer interação</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ios" className="space-y-4">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ios-title">Título</Label>
                      <Input id="ios-title" value={title} onChange={handleTitleChange} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ios-message">Mensagem</Label>
                      <Input id="ios-message" value={message} onChange={handleMessageChange} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ios-sound">Som</Label>
                      <Select value={sound} onValueChange={handleSoundChange}>
                        <SelectTrigger id="ios-sound">
                          <SelectValue placeholder="Selecione um som" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Padrão</SelectItem>
                          <SelectItem value="alert.caf">Alerta</SelectItem>
                          <SelectItem value="bell.caf">Sino</SelectItem>
                          <SelectItem value="none">Sem som</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ios-badge">Contador do Badge</Label>
                      <Input 
                        id="ios-badge" 
                        type="number" 
                        min="0" 
                        max="99"
                        value={badge.toString()} 
                        onChange={handleBadgeChange} 
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4"
            >
              <Button 
                className="w-full" 
                onClick={handleSendTestNotification}
                disabled={subscriptionStatus !== 'subscribed'}
              >
                Enviar Notificação de Teste
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-4">
              {subscriptionStatus === 'subscribed' 
                ? `Dispositivo atual detectado como: ${deviceType === 'ios' ? 'iOS' : 'Web'}`
                : 'Você precisa ativar as notificações primeiro'}
            </p>
            <Button 
              onClick={handleQuickTest}
              disabled={subscriptionStatus !== 'subscribed'}
              className="w-full mb-2"
            >
              Enviar Notificação Rápida
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? "Ocultar Opções Avançadas" : "Mostrar Opções Avançadas"}
        </Button>
      </CardFooter>
    </Card>
  );
}