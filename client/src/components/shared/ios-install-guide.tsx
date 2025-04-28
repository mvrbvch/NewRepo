import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ArrowDownToLine, Share2, PlusCircle } from "lucide-react";

export default function IOSInstallGuide() {
  const [isOpen, setIsOpen] = useState(false);

  // Detecta se estamos em um dispositivo iOS
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
  };

  // Detecta se o app já está instalado como PWA
  const isInStandaloneMode = () => {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window as any).navigator.standalone ||
      document.referrer.includes("android-app://")
    );
  };

  // Não mostrar o guia se não estamos no iOS ou se o app já está instalado
  if (!isIOS() || isInStandaloneMode()) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1 md:flex text-white hover:text-white/90 bg-primary hover:bg-primary/80 border-white/20"
        onClick={() => setIsOpen(true)}
      >
        <ArrowDownToLine className="h-4 w-4 animate-pulse" />
        <span>Instalar no iOS</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar Nós Juntos no seu iPhone/iPad</DialogTitle>
            <DialogDescription>
              Siga estes passos para adicionar o aplicativo à sua tela inicial:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium">Toque no botão de compartilhar</h3>
                <p className="text-sm text-muted-foreground">
                  Encontre o botão <Share2 className="inline h-4 w-4" /> na
                  barra de navegação do Safari (geralmente na parte inferior em
                  iPhones ou no topo em iPads).
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium">
                  Selecione "Adicionar à Tela de Início"
                </h3>
                <p className="text-sm text-muted-foreground">
                  Deslize para cima no menu de compartilhamento até encontrar a
                  opção
                  <PlusCircle className="inline h-4 w-4 mx-1" />
                  "Adicionar à Tela de Início".
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium">Confirme a instalação</h3>
                <p className="text-sm text-muted-foreground">
                  Verifique o nome e URL e toque em "Adicionar" no canto
                  superior direito.
                </p>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium">Benefícios da instalação:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Funciona offline</li>
                <li>Ocupa toda a tela (sem barra de navegação)</li>
                <li>Ícone na sua tela inicial</li>
                <li>Melhor desempenho</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="default">Entendi</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
