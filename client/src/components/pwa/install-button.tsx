import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface para o evento BeforeInstallPrompt (não existe no TypeScript padrão)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
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
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detecta dispositivos iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(isIOS);

    // Verifica se o app já está instalado usando a media query do display-mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Previne o comportamento padrão do navegador
      e.preventDefault();
      // Armazena o evento para uso posterior
      setDeferredPrompt(e);
      // Mostra o botão de instalação
      setIsInstallable(true);

      console.log("BeforeInstallPrompt capturado", e);
    };

    // Quando o app é instalado
    const handleAppInstalled = () => {
      // Oculta o botão de instalação
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);

      console.log("Aplicativo instalado");

      // Mostra um toast de sucesso
      toast({
        title: "Aplicativo instalado",
        description: "Nós Juntos foi instalado com sucesso!",
      });
    };

    // Adiciona os event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Log para debug
    console.log("Estado atual do app:", {
      isIOS,
      isStandalone,
      promptSupported: "BeforeInstallPromptEvent" in window,
    });

    // Remove os event listeners quando o componente é desmontado
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [toast]);

  // Função para disparar a instalação do PWA
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log("Evento deferredPrompt não disponível");

      toast({
        title: "Instalação não disponível",
        description:
          "Seu navegador não suporta instalação direta do aplicativo no momento.",
        variant: "destructive",
      });

      return;
    }

    console.log("Mostrando prompt de instalação");

    try {
      // Mostra o prompt de instalação
      deferredPrompt.prompt();

      // Espera pela escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;
      console.log("Resultado da instalação:", outcome);

      // O prompt só pode ser usado uma vez, então limpa a referência
      setDeferredPrompt(null);

      if (outcome === "accepted") {
        toast({
          title: "Instalando...",
          description: "O aplicativo está sendo instalado.",
        });
      } else {
        // O usuário recusou a instalação
        toast({
          title: "Instalação cancelada",
          description: "Você pode instalar o aplicativo mais tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro durante instalação:", error);
      toast({
        title: "Erro na instalação",
        description: "Ocorreu um erro ao tentar instalar o aplicativo.",
        variant: "destructive",
      });
    }
  };

  // Se o aplicativo já está instalado ou não pode ser instalado em navegadores não-iOS, não exibe o botão
  if (isInstalled || (!isInstallable && !isIOSDevice)) {
    return null;
  }

  // Em dispositivos iOS, delegamos a exibição para o componente IOSInstallGuide
  if (isIOSDevice) {
    return null; // Não mostra este botão em iOS, usamos o IOSInstallGuide em vez disso
  }

  // Botão de instalação para outros navegadores
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1 md:flex"
      onClick={handleInstallClick}
    >
      <Download className="h-4 w-4" />
      <span>Instalar App</span>
    </Button>
  );
}
