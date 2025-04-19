import { useSimpleToast } from "@/components/simple-toast";

// Interface simplificada compatível com o formato antigo
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

// Hook para usar o toast - agora é a principal exportação
export function useToast() {
  const { showToast } = useSimpleToast();
  
  const toast = (options: ToastOptions) => {
    showToast({
      message: options.title + (options.description ? `: ${options.description}` : ""),
      type: options.variant === "destructive" ? "error" : "info",
      duration: 3000
    });
  };
  
  return { toast };
}

// Interface para o showToast global - aceita ambas interfaces para compatibilidade
interface ShowToastOptions {
  message?: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Função alternativa (vai usar um toast global)
let globalShowToast: ((options: ShowToastOptions) => void) | null = null;

// Função para definir o showToast global
export function setGlobalShowToast(fn: (options: ShowToastOptions) => void) {
  globalShowToast = fn;
}

// Função compatível com a anterior
export function toast(options: ToastOptions) {
  if (globalShowToast) {
    globalShowToast({
      message: options.title + (options.description ? `: ${options.description}` : ""),
      type: options.variant === "destructive" ? "error" : "info",
    });
  } else {
    console.warn("Toast foi chamado antes de ser inicializado");
  }
}