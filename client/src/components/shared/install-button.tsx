import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Capturar o evento beforeinstallprompt para exibir o botão
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Impedir o comportamento padrão do navegador
      e.preventDefault();
      // Armazenar o evento para uso posterior
      setDeferredPrompt(e);
    };

    // Tratar o evento appinstalled quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({
        title: "Aplicativo instalado",
        description: "Por Nós foi instalado com sucesso no seu dispositivo.",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []); // Removemos o toast das dependências

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      // Mostrar o prompt de instalação
      await deferredPrompt.prompt();
      
      // Esperar pela escolha do usuário
      const choiceResult = await deferredPrompt.userChoice;
      
      // Resetar o deferredPrompt - só pode ser usado uma vez
      setDeferredPrompt(null);
      
      if (choiceResult.outcome === "accepted") {
        toast({
          title: "Instalando...",
          description: "Por Nós está sendo instalado no seu dispositivo.",
        });
      } else {
        toast({
          title: "Instalação cancelada",
          description: "Você pode instalar o app mais tarde se desejar.",
        });
      }
    } catch (error) {
      console.error("Erro ao instalar o aplicativo:", error);
      toast({
        title: "Erro na instalação",
        description: "Ocorreu um erro ao tentar instalar o aplicativo.",
        variant: "destructive",
      });
    }
  };

  // Não mostrar nada se já estiver instalado ou não estiver disponível
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <Button 
      onClick={handleInstallClick} 
      variant="default" 
      className="flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      <span>Instalar</span>
    </Button>
  );
}