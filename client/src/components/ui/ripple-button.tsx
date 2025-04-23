import { ReactNode, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RippleButtonProps extends ButtonProps {
  rippleColor?: string;
  rippleSize?: number;
  rippleDuration?: number;
  children: ReactNode;
  hapticFeedback?: boolean;
}

export function RippleButton({
  rippleColor = "rgba(255, 255, 255, 0.7)",
  rippleSize = 100,
  rippleDuration = 0.5,
  className,
  children,
  hapticFeedback = true,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{
    id: number;
    x: number;
    y: number;
  }>>([]);
  
  // Usar useRef para rastrear se o evento de toque aconteceu
  const touchOccurred = useRef(false);

  const triggerHapticFeedback = () => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(15); // Vibração curta para feedback tátil
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    touchOccurred.current = true;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Obter a posição do toque relativa ao botão
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    // Feedback tátil
    triggerHapticFeedback();
    
    // Criar uma nova ondulação com ID único
    const newRipple = {
      id: Date.now(),
      x,
      y,
    };
    
    // Adicionar ao estado
    setRipples([...ripples, newRipple]);
    
    // Remover a ondulação depois que a animação terminar
    setTimeout(() => {
      setRipples((prevRipples) =>
        prevRipples.filter((ripple) => ripple.id !== newRipple.id)
      );
    }, rippleDuration * 1000);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    // Se já ocorreu um evento de toque, ignore o clique
    // Isso evita "duplo disparo" em dispositivos touch
    if (touchOccurred.current) {
      touchOccurred.current = false;
      return;
    }
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Obter a posição do clique relativa ao botão
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Criar uma nova ondulação com ID único
    const newRipple = {
      id: Date.now(),
      x,
      y,
    };
    
    // Adicionar ao estado
    setRipples([...ripples, newRipple]);
    
    // Remover a ondulação depois que a animação terminar
    setTimeout(() => {
      setRipples((prevRipples) =>
        prevRipples.filter((ripple) => ripple.id !== newRipple.id)
      );
    }, rippleDuration * 1000);
  };

  return (
    <Button
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {children}
      
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ 
              width: 0, 
              height: 0, 
              opacity: 0.7,
              x: ripple.x, 
              y: ripple.y,
              borderRadius: "100%",
              position: "absolute",
              transform: "translate(-50%, -50%)" 
            }}
            animate={{ 
              width: rippleSize * 2, 
              height: rippleSize * 2, 
              opacity: 0 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: rippleDuration, ease: "easeOut" }}
            style={{ 
              backgroundColor: rippleColor,
              pointerEvents: "none"
            }}
          />
        ))}
      </AnimatePresence>
    </Button>
  );
}