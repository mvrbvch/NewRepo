import { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { setGlobalShowToast, type ToastOptions } from '@/hooks/use-toast';

// Estado do toast
interface ToastState {
  visible: boolean;
  title: string;
  description?: string;
  variant: 'default' | 'destructive';
  duration: number;
}

// Interface para o contexto
interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

// Criação do contexto
const ToastContext = createContext<ToastContextType | null>(null);

// Componente de Toast
function Toast({ state }: { state: ToastState }) {
  if (!state.visible) return null;

  const bgColor = 
    state.variant === 'destructive' ? 'bg-red-500' : 'bg-blue-500';

  return createPortal(
    <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg text-white ${bgColor} transition-all transform max-w-xs`}>
      <div className="font-medium">{state.title}</div>
      {state.description && <div className="text-sm mt-1">{state.description}</div>}
    </div>,
    document.body
  );
}

// Provider do Toast
export function SimpleToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ToastState>({
    visible: false,
    title: '',
    description: '',
    variant: 'default',
    duration: 3000
  });

  // Efeito para esconder o toast após a duração
  useEffect(() => {
    if (state.visible) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, visible: false }));
      }, state.duration);

      return () => clearTimeout(timer);
    }
  }, [state.visible, state.duration]);

  // Função para mostrar um toast
  const showToast = (options: ToastOptions) => {
    setState({
      visible: true,
      title: options.title || 'Notificação',
      description: options.description || '',
      variant: options.variant || 'default',
      duration: options.duration || 3000
    });
  };

  // Registrar o showToast global quando o componente for montado
  useEffect(() => {
    // Adaptador para compatibilidade com a interface antiga
    const adaptedShowToast = (options: ToastOptions) => {
      showToast(options);
    };
    setGlobalShowToast(adaptedShowToast);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast state={state} />
    </ToastContext.Provider>
  );
}

// Hook para usar o toast
export function useSimpleToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useSimpleToast deve ser usado dentro de um SimpleToastProvider');
  }
  return context;
}