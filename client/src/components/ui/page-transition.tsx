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
  
  // Configura as animações baseadas no efeito escolhido
  let initialAnimation = {};
  let animateAnimation = {};
  let exitAnimation = {};

  switch (effect) {
    case "fade":
      initialAnimation = { opacity: 0 };
      animateAnimation = { opacity: 1 };
      exitAnimation = { opacity: 0 };
      break;
      
    case "slide":
      initialAnimation = { x: 100, opacity: 0 };
      animateAnimation = { x: 0, opacity: 1 };
      exitAnimation = { x: -100, opacity: 0 };
      break;
      
    case "scale":
      initialAnimation = { scale: 0.8, opacity: 0 };
      animateAnimation = { scale: 1, opacity: 1 };
      exitAnimation = { scale: 0.8, opacity: 0 };
      break;
      
    case "slide-up":
      initialAnimation = { y: 30, opacity: 0 };
      animateAnimation = { y: 0, opacity: 1 };
      exitAnimation = { y: -30, opacity: 0 };
      break;
      
    case "slide-down":
      initialAnimation = { y: -30, opacity: 0 };
      animateAnimation = { y: 0, opacity: 1 };
      exitAnimation = { y: 30, opacity: 0 };
      break;
      
    case "push-left":
      initialAnimation = { x: 100, opacity: 0 };
      animateAnimation = { x: 0, opacity: 1 };
      exitAnimation = { x: -100, opacity: 0 };
      break;
      
    case "push-right":
      initialAnimation = { x: -100, opacity: 0 };
      animateAnimation = { x: 0, opacity: 1 };
      exitAnimation = { x: 100, opacity: 0 };
      break;
      
    case "flip":
      initialAnimation = { rotateY: 90, opacity: 0 };
      animateAnimation = { rotateY: 0, opacity: 1 };
      exitAnimation = { rotateY: -90, opacity: 0 };
      break;
      
    case "none":
    default:
      initialAnimation = { opacity: 1 };
      animateAnimation = { opacity: 1 };
      exitAnimation = { opacity: 1 };
      break;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={initialAnimation}
          animate={animateAnimation}
          exit={exitAnimation}
          transition={{ 
            duration: duration,
            delay: enterDelay,
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