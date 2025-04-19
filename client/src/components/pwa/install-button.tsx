import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface para o evento BeforeInstallPrompt (não existe no TypeScript padrão)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extensão da interface WindowEventMap para incluir o evento beforeinstallprompt
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detecta dispositivos iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(isIOS);

    // Verifica se o app já está instalado usando a media query do display-mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Previne o comportamento padrão do navegador
      e.preventDefault();
      // Armazena o evento para uso posterior
      setDeferredPrompt(e);
      // Mostra o botão de instalação
      setIsInstallable(true);
    };

    // Quando o app é instalado
    const handleAppInstalled = () => {
      // Oculta o botão de instalação
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      
      // Mostra um toast de sucesso
      toast({
        title: "Aplicativo instalado",
        description: "Por Nós foi instalado com sucesso!",
      });
    };

    // Adiciona os event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Remove os event listeners quando o componente é desmontado
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  // Função para disparar a instalação do PWA
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Mostra o prompt de instalação
    deferredPrompt.prompt();

    // Espera pela escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    // O prompt só pode ser usado uma vez, então limpa a referência
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      toast({
        title: "Instalando...",
        description: "O aplicativo está sendo instalado."
      });
    } else {
      // O usuário recusou a instalação
      toast({
        title: "Instalação cancelada",
        description: "Você pode instalar o aplicativo mais tarde.",
        variant: "destructive"
      });
    }
  };

  // Mostra as instruções de instalação para iOS
  const showIOSInstructions = () => {
    toast({
      title: "Instalação no iOS",
      description: "Toque no ícone 'Compartilhar' e depois em 'Adicionar à Tela de Início'",
      duration: 8000,
    });
  };

  // Se o aplicativo já está instalado ou não pode ser instalado, não exibe o botão
  if (isInstalled || (!isInstallable && !isIOSDevice)) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1 hidden md:flex"
      onClick={isIOSDevice ? showIOSInstructions : handleInstallClick}
    >
      <Download className="h-4 w-4" />
      <span>{isIOSDevice ? "Adicionar à Tela" : "Instalar App"}</span>
    </Button>
  );
}