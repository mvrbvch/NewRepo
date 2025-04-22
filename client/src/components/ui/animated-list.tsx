import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedListProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  keyExtractor: (item: any) => string | number;
  direction?: "vertical" | "horizontal";
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
  initialDelay?: number;
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
}: AnimatedListProps) {
  // Configurar a direção da animação
  const isVertical = direction === "vertical";
  
  // Animações para entrada e saída
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: isVertical ? 20 : 0,
      x: isVertical ? 0 : 20 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300,
      }
    },
    exit: { 
      opacity: 0, 
      y: isVertical ? -20 : 0, 
      x: isVertical ? 0 : -20,
      transition: {
        duration: 0.2
      }
    },
  };

  return (
    <motion.div
      className={cn(
        direction === "vertical" ? "flex flex-col space-y-2" : "flex space-x-2",
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="sync">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={itemClassName}
            layout
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}