import { useSimpleToast } from "@/components/simple-toast";

// Interface simplificada compatível com o formato antigo
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  duration?: number;
}

// Hook para usar o toast - agora é a principal exportação
export function useToast() {
  const { showToast } = useSimpleToast();
  
  const toast = (options: ToastOptions) => {
    showToast({
      title: options.title || "Notificação",
      description: options.description,
      variant: options.variant || "default",
      duration: options.duration || 3000
    });
  };
  
  return { toast };
}

// Função alternativa (vai usar um toast global)
let globalShowToast: ((options: ToastOptions) => void) | null = null;

// Função para definir o showToast global
export function setGlobalShowToast(fn: (options: ToastOptions) => void) {
  globalShowToast = fn;
}

// Função compatível com a anterior
export function toast(options: ToastOptions) {
  if (globalShowToast) {
    globalShowToast({
      title: options.title || "Notificação",
      description: options.description,
      variant: options.variant || "default",
      duration: options.duration || 3000
    });
  } else {
    console.warn("Toast foi chamado antes de ser inicializado");
  }
}