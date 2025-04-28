import { useState, useEffect } from "react";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
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

export default function BiometricSettingsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const {
    isSupported,
    registerBiometric,
    getCredentials,
    removeCredential,
    isPending,
  } = useBiometricAuth();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceName, setDeviceName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [removeDialogData, setRemoveDialogData] = useState<{
    open: boolean;
    id: string | null;
    name: string;
  }>({
    open: false,
    id: null,
    name: "",
  });

  // Verificar autenticação
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Carregar credenciais do usuário
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        setIsLoading(true);
        const result = await getCredentials();
        if (result.success) {
          setCredentials(result.credentials);
        }
      } catch (error) {
        console.error("Erro ao carregar credenciais:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas credenciais",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadCredentials();
    }
  }, [user, getCredentials]);

  // Registrar nova credencial biométrica
  const handleRegister = async () => {
    try {
      if (!deviceName.trim()) {
        toast({
          title: "Nome do dispositivo necessário",
          description: "Por favor, forneça um nome para identificar este dispositivo",
          variant: "destructive",
        });
        return;
      }

      const result = await registerBiometric(deviceName);

      if (result.success) {
        toast({
          title: "Dispositivo registrado",
          description: "Seu dispositivo foi registrado com sucesso para autenticação biométrica",
        });
        
        // Recarregar a lista de credenciais
        const credResult = await getCredentials();
        if (credResult.success) {
          setCredentials(credResult.credentials);
        }
        
        // Fechar o diálogo
        setIsAddDialogOpen(false);
        setDeviceName("");
      }
    } catch (error) {
      console.error("Erro ao registrar biometria:", error);
    }
  };

  // Remover credencial
  const handleRemove = async () => {
    try {
      if (!removeDialogData.id) return;

      const result = await removeCredential(removeDialogData.id);

      if (result.success) {
        toast({
          title: "Dispositivo removido",
          description: "O dispositivo foi removido com sucesso",
        });
        
        // Atualizar a lista de credenciais
        setCredentials(credentials.filter(cred => cred.id !== removeDialogData.id));
        
        // Fechar o diálogo
        setRemoveDialogData({ open: false, id: null, name: "" });
      }
    } catch (error) {
      console.error("Erro ao remover credencial:", error);
    }
  };

  const openRemoveDialog = (id: string, name: string) => {
    setRemoveDialogData({
      open: true,
      id,
      name,
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

      {!isSupported && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dispositivo não compatível</AlertTitle>
          <AlertDescription>
            Seu dispositivo ou navegador não suporta autenticação biométrica.
            Por favor, utilize um dispositivo compatível com WebAuthn.
          </AlertDescription>
        </Alert>
      )}

      {isSupported && (
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Dispositivos Registrados
          </CardTitle>
          <CardDescription>
            Dispositivos cadastrados para autenticação biométrica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando dispositivos...
            </div>
          ) : credentials.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Você não possui dispositivos registrados para biometria.
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((credential) => (
                <div key={credential.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{credential.deviceName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {credential.credentialDeviceType === "platform"
                            ? "Dispositivo integrado (Touch ID, Face ID)"
                            : "Dispositivo externo (Chave de segurança)"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Último uso: {formatDate(credential.lastUsed)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openRemoveDialog(credential.id, credential.deviceName)}
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
          {isSupported && (
            <Button
              className="w-full flex items-center gap-2"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={isPending}
            >
              <Plus size={16} />
              Registrar Novo Dispositivo
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Diálogo para adicionar novo dispositivo */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Registrar Novo Dispositivo
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
                placeholder="Ex: Meu Celular, Notebook Pessoal"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Dispositivo seguro</AlertTitle>
              <AlertDescription>
                Você será solicitado a usar sua biometria para registrar este dispositivo.
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
              disabled={isPending || !deviceName.trim()}
              className="flex items-center gap-2"
            >
              {isPending ? "Registrando..." : "Registrar Dispositivo"}
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
              onClick={() => setRemoveDialogData({ open: false, id: null, name: "" })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? "Removendo..." : "Remover Dispositivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}