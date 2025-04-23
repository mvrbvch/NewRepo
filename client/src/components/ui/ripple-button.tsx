import { ReactNode, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RippleButtonProps extends ButtonProps {
  rippleColor?: string;
  rippleSize?: number;
  rippleDuration?: number;
  children: ReactNode;
  hapticFeedback?: boolean;
  glow?: boolean;
  rippleOpacity?: number;
  colorShift?: boolean;
}

export function RippleButton({
  rippleColor = "rgba(255, 255, 255, 0.7)",
  rippleSize = 100,
  rippleDuration = 0.65,
  className,
  children,
  hapticFeedback = false,
  glow = true,
  rippleOpacity = 0.7,
  colorShift = false,
  variant,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color?: string;
  }>>([]);
  
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const touchOccurred = useRef(false);

  // Controlador para efeitos quando o botão está pressionado
  useEffect(() => {
    if (!buttonRef.current) return;
    
    if (isPressed) {
      buttonRef.current.style.transform = "scale(0.97)";
      
      if (glow) {
        buttonRef.current.style.boxShadow = variant === "link" ? "none" : 
          "0 0 8px rgba(var(--primary-rgb), 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)";
      }
    } else {
      buttonRef.current.style.transform = "scale(1)";
      
      if (glow) {
        buttonRef.current.style.boxShadow = "none";
      }
    }
  }, [isPressed, glow, variant]);

  const triggerHapticFeedback = () => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(15); // Vibração curta para feedback tátil
    }
  };

  // Gera uma cor de ondulação levemente diferente para efeito visual interessante
  const getColorVariation = () => {
    if (!colorShift) return rippleColor;
    
    // Se for um botão primário, vamos fazer variações de cores
    if (variant === "default") {
      const hue = Math.floor(Math.random() * 20) - 10; // Varia a matiz em +/- 10
      return `hsla(var(--primary-hue, 220) + ${hue}, var(--primary-saturation, 90%), var(--primary-lightness, 65%), ${rippleOpacity})`;
    }
    
    // Para outros tipos, apenas varia a opacidade
    const opacityVar = Math.random() * 0.2 + (rippleOpacity - 0.1);
    return rippleColor.replace(/[\d.]+\)$/, `${opacityVar})`);
  };

  const handlePress = (x: number, y: number) => {
    setIsPressed(true);
    triggerHapticFeedback();
    
    // Criar uma nova ondulação com ID único
    const newRipple = {
      id: Date.now(),
      x,
      y,
      color: getColorVariation()
    };
    
    // Adicionar ao estado
    setRipples((prevRipples) => [...prevRipples, newRipple]);
    
    // Remover a ondulação depois que a animação terminar
    setTimeout(() => {
      setRipples((prevRipples) =>
        prevRipples.filter((ripple) => ripple.id !== newRipple.id)
      );
    }, rippleDuration * 1000 + 100);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    touchOccurred.current = true;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Obter a posição do toque relativa ao botão
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    handlePress(x, y);
  };
  
  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    // Evitar duplicação em dispositivos touch
    if (touchOccurred.current) {
      touchOccurred.current = false;
      return;
    }
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Obter a posição do clique relativa ao botão
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handlePress(x, y);
  };
  
  const handleMouseUp = () => {
    setIsPressed(false);
  };
  
  const handleMouseLeave = () => {
    if (isPressed) {
      setIsPressed(false);
    }
  };

  return (
    <Button
      ref={buttonRef}
      className={cn(
        "relative overflow-hidden transition-all duration-150", 
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      variant={variant}
      {...props}
    >
      {/* Conteúdo do botão com efeito sutil ao ser pressionado */}
      <motion.div
        animate={{ 
          scale: isPressed ? 0.97 : 1,
          opacity: isPressed ? 0.9 : 1
        }}
        transition={{ duration: 0.1 }}
      >
        {children}
      </motion.div>
      
      {/* Efeito de ondulação (ripple) */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ 
              width: 0, 
              height: 0, 
              opacity: rippleOpacity,
              x: ripple.x, 
              y: ripple.y,
              borderRadius: "100%",
              position: "absolute",
              transform: "translate(-50%, -50%)"
            }}
            animate={{ 
              width: rippleSize * 2.5, 
              height: rippleSize * 2.5, 
              opacity: 0 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: rippleDuration, 
              ease: "easeOut"
            }}
            style={{ 
              backgroundColor: ripple.color || rippleColor,
              pointerEvents: "none",
              zIndex: 0
            }}
          />
        ))}
      </AnimatePresence>
    </Button>
  );
}