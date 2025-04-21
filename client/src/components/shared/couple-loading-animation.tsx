import React from 'react';
import { cn } from '@/lib/utils';

// Tipos de animação disponíveis
export type AnimationType = 'hearts' | 'calendar' | 'messages' | 'tasks';

interface CoupleLoadingAnimationProps {
  type?: AnimationType;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CoupleLoadingAnimation({
  type = 'hearts',
  text = 'Carregando...',
  size = 'md',
  className,
}: CoupleLoadingAnimationProps) {
  // Dimensões da animação baseadas no tamanho
  const dimensions = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  // Tamanho do texto baseado no tamanho da animação
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Renderiza animação baseada no tipo
  const renderAnimation = () => {
    switch (type) {
      case 'hearts':
        return (
          <div className={cn("relative", dimensions[size])}>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Coração 1 - pulsando */}
              <svg 
                className="absolute w-2/3 h-2/3 text-pink-400 animate-pulse" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              
              {/* Coração 2 - girando */}
              <svg 
                className="absolute w-1/2 h-1/2 text-red-500 animate-spin" 
                style={{ animationDuration: '3s' }}
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              
              {/* Pequenos corações flutuando */}
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-pink-300 rounded-full animate-float" style={{ animationDelay: '0s' }} />
              <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-red-300 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-float" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        );
      
      case 'calendar':
        return (
          <div className={cn("relative", dimensions[size])}>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Calendário base */}
              <svg 
                className="absolute w-3/4 h-3/4 text-blue-500" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              
              {/* Números do calendário animados */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 flex">
                <div className="w-3 h-3 bg-red-500 rounded-sm animate-bounce mr-1" style={{ animationDelay: '0s' }} />
                <div className="w-3 h-3 bg-blue-500 rounded-sm animate-bounce mr-1" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 bg-green-500 rounded-sm animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              
              {/* Silhuetas de casal */}
              <div className="absolute bottom-1 left-1/3 w-2 h-4 bg-indigo-600 rounded-full animate-pulse" />
              <div className="absolute bottom-1 right-1/3 w-2 h-4 bg-pink-500 rounded-full animate-pulse" />
            </div>
          </div>
        );
      
      case 'messages':
        return (
          <div className={cn("relative", dimensions[size])}>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Mensagem 1 - pulsando */}
              <div className="absolute left-1/4 transform -translate-x-1/2 w-1/2 h-1/3 bg-blue-100 rounded-lg flex items-center justify-center p-1 animate-pulse">
                <div className="w-3/4 h-1/2 bg-blue-300 rounded-sm" />
              </div>
              
              {/* Mensagem 2 - pulsando com delay */}
              <div 
                className="absolute right-1/4 transform translate-x-1/2 w-1/2 h-1/3 bg-pink-100 rounded-lg flex items-center justify-center p-1 animate-pulse"
                style={{ animationDelay: '1s' }}
              >
                <div className="w-3/4 h-1/2 bg-pink-300 rounded-sm" />
              </div>
              
              {/* Coração animado entre as mensagens */}
              <svg 
                className="absolute w-1/6 h-1/6 text-red-500 animate-bounce"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        );
      
      case 'tasks':
        return (
          <div className={cn("relative", dimensions[size])}>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Lista de tarefas */}
              <div className="absolute w-3/4 h-3/4 bg-white border-2 border-gray-300 rounded-md flex flex-col items-center justify-start pt-2 overflow-hidden">
                {/* Itens da lista animados */}
                <div className="w-4/5 h-2 bg-gray-300 rounded-full mb-2 animate-pulse" />
                <div className="w-4/5 h-2 bg-gray-200 rounded-full mb-2 animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="w-4/5 h-2 bg-gray-300 rounded-full mb-2 animate-pulse" style={{ animationDelay: '0.6s' }} />
                
                {/* Checkbox animado */}
                <div className="absolute top-1/3 right-1/4 w-3 h-3 border-2 border-green-500 rounded-sm">
                  <div className="absolute inset-0 bg-green-500 scale-0 animate-check" />
                </div>
                
                {/* Casal fazendo a lista juntos */}
                <div className="absolute bottom-1 left-1/3 w-2 h-4 bg-blue-600 rounded-t-full" />
                <div className="absolute bottom-1 right-1/3 w-2 h-4 bg-pink-500 rounded-t-full" />
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className={cn("relative", dimensions[size])}>
            <div className="animate-spin rounded-full border-t-2 border-primary h-full w-full" />
          </div>
        );
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {renderAnimation()}
      {text && <p className={cn("mt-2 text-gray-600 animate-pulse", textSize[size])}>{text}</p>}
    </div>
  );
}