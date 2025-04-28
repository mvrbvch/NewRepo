import { useState, useEffect } from "react";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { useNativeBiometricAuth } from "@/hooks/use-native-biometric-auth";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Fingerprint,
  Trash2,
  Plus,
  ArrowLeft,
  ShieldCheck,
  Info,
  AlertCircle,
  Smartphone,
  Monitor,
  TabletSmartphone,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function BiometricSettingsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  // Hook para autenticação biométrica via WebAuthn (navegadores)
  const {
    isSupported: isWebAuthnSupported,
    registerBiometric: registerWebAuthn,
    getCredentials: getWebAuthnCredentials,
    removeCredential: removeWebAuthnCredential,
    isPending: isWebAuthnPending,
  } = useBiometricAuth();
  
  // Hook para autenticação biométrica nativa (iOS/Android)
  const {
    isSupported: isNativeSupported,
    platform: nativePlatform,
    registerBiometric: registerNativeBiometric,
    getCredentials: getNativeBiometricCredentials,
    removeCredential: removeNativeBiometricCredential,
    isPending: isNativePending,
  } = useNativeBiometricAuth();
  
  // Estado compartilhado
  const [webAuthnCredentials, setWebAuthnCredentials] = useState<any[]>([]);
  const [nativeBiometricCredentials, setNativeBiometricCredentials] = useState<any[]>([]);
  const [isWebAuthnLoading, setIsWebAuthnLoading] = useState(true);
  const [isNativeLoading, setIsNativeLoading] = useState(true);
  const [deviceName, setDeviceName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [biometricType, setBiometricType] = useState<'webauthn' | 'native'>('webauthn');
  const [removeDialogData, setRemoveDialogData] = useState<{
    open: boolean;
    id: string | null;
    name: string;
    type: 'webauthn' | 'native';
  }>({
    open: false,
    id: null,
    name: "",
    type: 'webauthn'
  });

  // Verificar autenticação
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Carregar credenciais do usuário
  useEffect(() => {
    // Importante: evitar loops infinitos removendo as dependências problemáticas
    let isMounted = true;
    
    const loadWebAuthnCredentials = async () => {
      try {
        if (!isMounted) return;
        setIsWebAuthnLoading(true);
        const result = await getWebAuthnCredentials();
        if (result.success && isMounted) {
          setWebAuthnCredentials(result.credentials);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Erro ao carregar credenciais WebAuthn:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas credenciais do navegador",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsWebAuthnLoading(false);
        }
      }
    };
    
    const loadNativeCredentials = async () => {
      try {
        if (!isMounted) return;
        setIsNativeLoading(true);
        const result = await getNativeBiometricCredentials();
        if (result.success && isMounted) {
          setNativeBiometricCredentials(result.credentials);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Erro ao carregar credenciais nativas:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas credenciais de dispositivo móvel",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsNativeLoading(false);
        }
      }
    };
    
    if (user) {
      // Carregar ambos os tipos de credenciais
      loadWebAuthnCredentials();
      loadNativeCredentials();
    }
    
    // Função de limpeza para evitar atualizações em componentes desmontados
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Registrar nova credencial biométrica WebAuthn
  const handleRegisterWebAuthn = async () => {
    try {
      if (!deviceName.trim()) {
        toast({
          title: "Nome do dispositivo necessário",
          description: "Por favor, forneça um nome para identificar este dispositivo",
          variant: "destructive",
        });
        return;
      }

      const result = await registerWebAuthn(deviceName);

      if (result.success) {
        toast({
          title: "Dispositivo registrado",
          description: "Seu dispositivo foi registrado com sucesso para autenticação biométrica",
        });
        
        // Recarregar a lista de credenciais
        const credResult = await getWebAuthnCredentials();
        if (credResult.success) {
          setWebAuthnCredentials(credResult.credentials);
        }
        
        // Fechar o diálogo
        setIsAddDialogOpen(false);
        setDeviceName("");
      }
    } catch (error) {
      console.error("Erro ao registrar biometria WebAuthn:", error);
    }
  };
  
  // Registrar nova credencial biométrica Nativa
  const handleRegisterNative = async () => {
    try {
      if (!deviceName.trim()) {
        toast({
          title: "Nome do dispositivo necessário",
          description: "Por favor, forneça um nome para identificar este dispositivo",
          variant: "destructive",
        });
        return;
      }

      const result = await registerNativeBiometric(deviceName);

      if (result.success) {
        toast({
          title: "Dispositivo registrado",
          description: "Seu dispositivo foi registrado com sucesso para autenticação biométrica",
        });
        
        // Recarregar a lista de credenciais
        const credResult = await getNativeBiometricCredentials();
        if (credResult.success) {
          setNativeBiometricCredentials(credResult.credentials);
        }
        
        // Fechar o diálogo
        setIsAddDialogOpen(false);
        setDeviceName("");
      }
    } catch (error) {
      console.error("Erro ao registrar biometria nativa:", error);
    }
  };
  
  // Função unificada para registrar credencial dependendo do tipo selecionado
  const handleRegister = async () => {
    if (biometricType === 'webauthn') {
      await handleRegisterWebAuthn();
    } else {
      await handleRegisterNative();
    }
  };

  // Remover credencial
  const handleRemove = async () => {
    try {
      if (!removeDialogData.id) return;
      
      let result;
      
      // Remover com base no tipo de credencial
      if (removeDialogData.type === 'webauthn') {
        result = await removeWebAuthnCredential(removeDialogData.id);
        if (result.success) {
          setWebAuthnCredentials(webAuthnCredentials.filter(cred => cred.id !== removeDialogData.id));
        }
      } else {
        result = await removeNativeBiometricCredential(removeDialogData.id);
        if (result.success) {
          setNativeBiometricCredentials(nativeBiometricCredentials.filter(cred => cred.id !== removeDialogData.id));
        }
      }

      if (result && result.success) {
        toast({
          title: "Dispositivo removido",
          description: "O dispositivo foi removido com sucesso",
        });
        
        // Fechar o diálogo
        setRemoveDialogData({ open: false, id: null, name: "", type: 'webauthn' });
      }
    } catch (error) {
      console.error("Erro ao remover credencial:", error);
    }
  };

  const openRemoveDialog = (id: string, name: string, type: 'webauthn' | 'native') => {
    setRemoveDialogData({
      open: true,
      id,
      name,
      type
    });
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return "Nunca utilizado";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Função para verificar se há algum dispositivo biométrico disponível
  const isAnyBiometricSupported = isWebAuthnSupported || isNativeSupported;
  
  // Função para verificar se há credenciais registradas
  const hasWebAuthnCredentials = webAuthnCredentials.length > 0;
  const hasNativeCredentials = nativeBiometricCredentials.length > 0;
  
  // Calcular se está carregando qualquer tipo de credencial
  const isLoading = isWebAuthnLoading || isNativeLoading;
  
  // Calcular se qualquer operação está pendente
  const isPending = isWebAuthnPending || isNativePending;
  
  // Verificar se há credenciais de qualquer tipo
  const hasCredentials = hasWebAuthnCredentials || hasNativeCredentials;
  
  // Função para renderizar o tipo de dispositivo de acordo com a plataforma
  const getDeviceTypeLabel = (credential: any, type: 'webauthn' | 'native') => {
    if (type === 'webauthn') {
      return credential.credentialDeviceType === "platform"
        ? "Dispositivo integrado (Touch ID, Face ID)"
        : "Dispositivo externo (Chave de segurança)";
    } else {
      // Para dispositivos nativos
      return credential.platform === "ios"
        ? "Dispositivo iOS (Touch ID/Face ID)"
        : credential.platform === "android"
          ? "Dispositivo Android (Biometria)"
          : "Dispositivo móvel";
    }
  };
  
  // Função para renderizar o ícone de acordo com o tipo de credencial
  const getCredentialIcon = (type: 'webauthn' | 'native', platform?: string) => {
    if (type === 'webauthn') {
      return <Monitor className="h-5 w-5 text-muted-foreground" />;
    } else {
      // Para dispositivos nativos
      return platform === "ios" || platform === "android"
        ? <TabletSmartphone className="h-5 w-5 text-muted-foreground" />
        : <Smartphone className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold">Configurações de Biometria</h1>
        </div>
      </div>

      {!isAnyBiometricSupported && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dispositivo não compatível</AlertTitle>
          <AlertDescription>
            Seu dispositivo ou navegador não suporta qualquer tipo de autenticação biométrica.
            A autenticação biométrica pode não estar disponível em navegadores mais antigos ou dispositivos sem suporte a hardware seguro.
          </AlertDescription>
        </Alert>
      )}

      {isAnyBiometricSupported && (
        <Alert variant="default" className="mb-6 bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertTitle>Informação</AlertTitle>
          <AlertDescription>
            A autenticação biométrica permite que você use seu reconhecimento facial,
            impressão digital ou outro método biométrico para fazer login no aplicativo
            de forma segura.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="browser" className="space-y-4">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="browser" onClick={() => setBiometricType('webauthn')}>
            <div className="flex items-center gap-2">
              <Monitor size={16} />
              <span>Navegador</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="mobile" onClick={() => setBiometricType('native')}>
            <div className="flex items-center gap-2">
              <TabletSmartphone size={16} />
              <span>Dispositivos Móveis</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Aba para autenticação biométrica em navegadores (WebAuthn) */}
        <TabsContent value="browser">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                <span>WebAuthn / FIDO2</span>
              </CardTitle>
              <CardDescription>
                Dispositivos cadastrados para autenticação biométrica no navegador
                (Touch ID, Face ID, Windows Hello)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWebAuthnLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Carregando dispositivos...
                </div>
              ) : !hasWebAuthnCredentials ? (
                <div className="py-8 text-center text-muted-foreground">
                  Você não possui dispositivos de navegador registrados para biometria.
                </div>
              ) : (
                <div className="space-y-4">
                  {webAuthnCredentials.map((credential) => (
                    <div key={credential.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getCredentialIcon('webauthn')}
                          </div>
                          <div>
                            <h3 className="font-medium">{credential.deviceName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {getDeviceTypeLabel(credential, 'webauthn')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Último uso: {formatDate(credential.lastUsed)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRemoveDialog(credential.id, credential.deviceName, 'webauthn')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              {isWebAuthnSupported && (
                <Button
                  className="w-full flex items-center gap-2"
                  onClick={() => {
                    setBiometricType('webauthn');
                    setIsAddDialogOpen(true);
                  }}
                  disabled={isWebAuthnPending}
                >
                  <Plus size={16} />
                  Registrar Dispositivo de Navegador
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Aba para autenticação biométrica em dispositivos móveis (Nativa) */}
        <TabsContent value="mobile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                <span>Biometria Nativa (iOS/Android)</span>
              </CardTitle>
              <CardDescription>
                Dispositivos móveis cadastrados para autenticação biométrica nativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isNativeLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Carregando dispositivos...
                </div>
              ) : !hasNativeCredentials ? (
                <div className="py-8 text-center text-muted-foreground">
                  Você não possui dispositivos móveis registrados para biometria.
                </div>
              ) : (
                <div className="space-y-4">
                  {nativeBiometricCredentials.map((credential) => (
                    <div key={credential.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getCredentialIcon('native', credential.platform)}
                          </div>
                          <div>
                            <h3 className="font-medium">{credential.deviceName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {getDeviceTypeLabel(credential, 'native')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Último uso: {formatDate(credential.lastUsed)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRemoveDialog(credential.id, credential.deviceName, 'native')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              {isNativeSupported && (
                <Button
                  className="w-full flex items-center gap-2"
                  onClick={() => {
                    setBiometricType('native');
                    setIsAddDialogOpen(true);
                  }}
                  disabled={isNativePending}
                >
                  <Plus size={16} />
                  Registrar Dispositivo Móvel
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para adicionar novo dispositivo */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              {biometricType === 'webauthn' ? 
                'Registrar Biometria do Navegador' : 
                'Registrar Biometria do Dispositivo Móvel'}
            </DialogTitle>
            <DialogDescription>
              Dê um nome para identificar este dispositivo e em seguida
              confirme com sua biometria
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Dispositivo</label>
              <Input
                placeholder={biometricType === 'webauthn' ? 
                  "Ex: MacBook Pessoal, PC do Trabalho" : 
                  "Ex: iPhone 13, Galaxy S22"}
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Dispositivo seguro</AlertTitle>
              <AlertDescription>
                {biometricType === 'webauthn' ?
                  "Você será solicitado a usar a biometria do seu navegador (Touch ID, Face ID ou Windows Hello)." :
                  "Você será solicitado a usar a biometria do seu dispositivo móvel (Touch ID, Face ID ou impressão digital)."}
                <br/>
                Nenhuma informação biométrica é armazenada em nossos servidores.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegister}
              disabled={(biometricType === 'webauthn' ? isWebAuthnPending : isNativePending) || !deviceName.trim()}
              className="flex items-center gap-2"
            >
              {biometricType === 'webauthn' ? 
                (isWebAuthnPending ? "Registrando..." : "Registrar Dispositivo") : 
                (isNativePending ? "Registrando..." : "Registrar Dispositivo Móvel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para remover dispositivo */}
      <Dialog
        open={removeDialogData.open}
        onOpenChange={(open) => setRemoveDialogData({ ...removeDialogData, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Remover Dispositivo
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o dispositivo "{removeDialogData.name}"?
              Você não poderá mais fazer login usando a biometria deste dispositivo.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogData({ 
                open: false, 
                id: null, 
                name: "", 
                type: removeDialogData.type 
              })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeDialogData.type === 'webauthn' ? isWebAuthnPending : isNativePending}
            >
              {removeDialogData.type === 'webauthn' ? 
                (isWebAuthnPending ? "Removendo..." : "Remover Dispositivo") : 
                (isNativePending ? "Removendo..." : "Remover Dispositivo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}