import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RippleButtonProps extends ButtonProps {
  rippleColor?: string;
  rippleSize?: number;
  rippleDuration?: number;
  children: ReactNode;
}

export function RippleButton({
  rippleColor = "rgba(255, 255, 255, 0.7)",
  rippleSize = 100,
  rippleDuration = 0.5,
  className,
  children,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{
    id: number;
    x: number;
    y: number;
  }>>([]);

  const addRipple = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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
      onClick={addRipple}
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