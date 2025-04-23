import { ReactNode, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimationStyle = 
  | "fade"             // Simples fade in/out
  | "slide"            // Deslizar para dentro/fora
  | "scale"            // Escala crescendo/diminuindo
  | "cascade"          // Combinação de fade com movimento
  | "elastic"          // Animação com efeito elástico
  | "pulse"            // Pulse ao aparecer
  | "flip"             // Giro 3D
  | "staggered";       // Surgimento em cascata com timing personalizado

interface AnimatedListProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  keyExtractor: (item: any) => string | number;
  direction?: "vertical" | "horizontal";
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
  initialDelay?: number;
  animationStyle?: AnimationStyle;
  maintainLayout?: boolean;
  hoverEffect?: boolean;
  speedFactor?: number;
}

export function AnimatedList({
  items,
  renderItem,
  keyExtractor,
  direction = "vertical",
  staggerDelay = 0.05,
  className,
  itemClassName,
  initialDelay = 0,
  animationStyle = "cascade",
  maintainLayout = true,
  hoverEffect = false,
  speedFactor = 1,
}: AnimatedListProps) {
  // Configurar a direção da animação
  const isVertical = direction === "vertical";
  
  // Ajustar timing baseado no speedFactor
  const adjustedStaggerDelay = staggerDelay / speedFactor;
  const adjustedInitialDelay = initialDelay / speedFactor;
  
  // Definir animações com base no estilo escolhido
  const animations = useMemo<{
    container: Variants;
    item: Variants;
  }>(() => {
    const containerBase = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: adjustedStaggerDelay,
          delayChildren: adjustedInitialDelay,
        },
      },
    };
    
    // Definir animações de item baseadas no estilo escolhido
    let itemVariants: Variants;
    
    switch (animationStyle) {
      case "fade":
        itemVariants = {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: {
              duration: 0.5 / speedFactor
            }
          },
          exit: { 
            opacity: 0,
            transition: { duration: 0.2 / speedFactor }
          },
          hover: hoverEffect ? { 
            scale: 1.02,
            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
            transition: { duration: 0.2 }
          } : {}
        };
        break;
        
      case "scale":
        itemVariants = {
          hidden: { 
            opacity: 0,
            scale: 0.8
          },
          visible: { 
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              damping: 12,
              stiffness: 200,
              duration: 0.5 / speedFactor
            }
          },
          exit: { 
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.25 / speedFactor }
          },
          hover: hoverEffect ? { 
            scale: 1.03,
            transition: { duration: 0.2 }
          } : {}
        };
        break;
        
      case "elastic":
        itemVariants = {
          hidden: { 
            opacity: 0,
            y: isVertical ? 50 : 0,
            x: isVertical ? 0 : 50,
            scale: 0.9
          },
          visible: { 
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
              type: "spring",
              damping: 8,
              stiffness: 100,
              duration: 0.7 / speedFactor
            }
          },
          exit: { 
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.3 / speedFactor }
          },
          hover: hoverEffect ? { 
            scale: 1.05,
            rotate: 1,
            transition: { duration: 0.3 }
          } : {}
        };
        break;
        
      case "pulse":
        itemVariants = {
          hidden: { 
            opacity: 0,
            scale: 0.8
          },
          visible: { 
            opacity: 1,
            scale: [0.9, 1.05, 1],
            transition: {
              duration: 0.6 / speedFactor,
              times: [0, 0.7, 1]
            }
          },
          exit: { 
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.2 / speedFactor }
          },
          hover: hoverEffect ? { 
            scale: 1.03,
            transition: { duration: 0.2 }
          } : {}
        };
        break;
        
      case "flip":
        itemVariants = {
          hidden: { 
            opacity: 0,
            rotateX: 90,
            y: isVertical ? 20 : 0
          },
          visible: { 
            opacity: 1,
            rotateX: 0,
            y: 0,
            transition: {
              type: "spring",
              damping: 15,
              stiffness: 150,
              duration: 0.7 / speedFactor
            }
          },
          exit: { 
            opacity: 0,
            rotateX: -90,
            transition: { duration: 0.3 / speedFactor }
          },
          hover: hoverEffect ? { 
            rotateX: 5,
            scale: 1.02,
            transition: { duration: 0.3 }
          } : {}
        };
        break;
        
      case "slide":
        itemVariants = {
          hidden: { 
            opacity: 0,
            x: isVertical ? (index % 2 === 0 ? -50 : 50) : 100,
            y: isVertical ? 100 : 0
          },
          visible: { 
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
              type: "spring",
              damping: 20,
              stiffness: 150,
              duration: 0.5 / speedFactor
            }
          },
          exit: { 
            opacity: 0,
            x: isVertical ? (index % 2 === 0 ? -20 : 20) : -50,
            y: isVertical ? -50 : 0,
            transition: { duration: 0.3 / speedFactor }
          },
          hover: hoverEffect ? { 
            x: isVertical ? 10 : 0,
            y: isVertical ? 0 : -10,
            transition: { duration: 0.2 }
          } : {}
        };
        break;
        
      case "staggered":
        itemVariants = {
          hidden: { 
            opacity: 0,
            y: isVertical ? 30 : 0,
            x: isVertical ? 0 : 30,
            scale: 0.9
          },
          visible: (index) => ({ 
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
              delay: index * (adjustedStaggerDelay * 3), // Stagger individual mais acentuado
              type: "spring",
              damping: 12,
              stiffness: 200,
              duration: 0.6 / speedFactor
            }
          }),
          exit: (index) => ({ 
            opacity: 0,
            y: isVertical ? -20 : 0,
            x: isVertical ? 0 : -20,
            transition: { 
              delay: index * 0.05 / speedFactor,
              duration: 0.2 / speedFactor 
            }
          }),
          hover: hoverEffect ? { 
            scale: 1.03,
            y: -5,
            transition: { duration: 0.2 }
          } : {}
        };
        break;
        
      // Cascade é o default
      case "cascade":
      default:
        itemVariants = {
          hidden: { 
            opacity: 0, 
            y: isVertical ? 30 : 0,
            x: isVertical ? 0 : 30,
            scale: 0.95
          },
          visible: { 
            opacity: 1, 
            y: 0, 
            x: 0,
            scale: 1,
            transition: {
              type: "spring",
              damping: 15,
              stiffness: 300,
              duration: 0.5 / speedFactor
            }
          },
          exit: { 
            opacity: 0, 
            y: isVertical ? -15 : 0, 
            x: isVertical ? 0 : -15,
            scale: 0.98,
            transition: {
              duration: 0.25 / speedFactor
            }
          },
          hover: hoverEffect ? { 
            y: -7,
            scale: 1.02,
            transition: { duration: 0.2 }
          } : {}
        };
    }
    
    return {
      container: containerBase,
      item: itemVariants
    };
  }, [
    animationStyle, 
    isVertical, 
    adjustedStaggerDelay, 
    adjustedInitialDelay, 
    hoverEffect,
    speedFactor
  ]);

  return (
    <motion.div
      className={cn(
        direction === "vertical" ? "flex flex-col space-y-2" : "flex space-x-2",
        className
      )}
      variants={animations.container}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="sync">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            custom={index} // Passa o índice para as variantes
            variants={animations.item}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={hoverEffect ? "hover" : undefined}
            className={cn(
              "transition-colors duration-300",
              itemClassName
            )}
            layout={maintainLayout}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}