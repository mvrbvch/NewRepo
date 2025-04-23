import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

type TransitionEffect = 
  | "fade"             // Simples fade in/out
  | "slide"            // Deslizar para dentro/fora
  | "scale"            // Escala crescendo/diminuindo
  | "slide-up"         // Deslizar de baixo para cima
  | "slide-down"       // Deslizar de cima para baixo
  | "push-left"        // Empurrar para a esquerda
  | "push-right"       // Empurrar para a direita
  | "flip"             // Efeito de virar página
  | "none";            // Sem animação

interface PageTransitionProps {
  children: ReactNode;
  effect?: TransitionEffect;
  duration?: number;
  enterDelay?: number;
  exitDelay?: number;
  locations?: string[]; // Lista de rotas para observar (opcional)
}

export function PageTransition({
  children,
  effect = "fade",
  duration = 0.3,
  enterDelay = 0,
  exitDelay = 0,
  locations = []
}: PageTransitionProps) {
  const [location] = useLocation();
  const [key, setKey] = useState(location);
  
  // Quando a localização muda, atualizamos a chave para acionar a transição
  useEffect(() => {
    // Se a lista de locations estiver vazia ou se a localização atual estiver na lista
    if (locations.length === 0 || locations.includes(location)) {
      setKey(location);
    }
  }, [location, locations]);
  
  // Definindo as variantes de animação baseadas no efeito escolhido
  const getVariants = () => {
    switch (effect) {
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
        
      case "slide":
        return {
          initial: { x: "100%", opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: "-100%", opacity: 0 }
        };
        
      case "scale":
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        };
        
      case "slide-up":
        return {
          initial: { y: "30%", opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: "-30%", opacity: 0 }
        };
        
      case "slide-down":
        return {
          initial: { y: "-30%", opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: "30%", opacity: 0 }
        };
        
      case "push-left":
        return {
          initial: { x: "100%", opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: "-100%", opacity: 0, position: "absolute", width: "100%" }
        };
        
      case "push-right":
        return {
          initial: { x: "-100%", opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: "100%", opacity: 0, position: "absolute", width: "100%" }
        };
        
      case "flip":
        return {
          initial: { rotateY: 90, opacity: 0 },
          animate: { rotateY: 0, opacity: 1 },
          exit: { rotateY: -90, opacity: 0 }
        };
        
      case "none":
      default:
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 1 }
        };
    }
  };
  
  const variants = getVariants();
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{ 
            duration: duration,
            delay: variants.initial === "animate" ? enterDelay : exitDelay,
            ease: "easeInOut"
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}