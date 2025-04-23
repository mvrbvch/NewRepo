import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface TransitionComponentProps {
  children: ReactNode;
  show: boolean;
  type?:
    | "fade"
    | "slide-up"
    | "slide-down"
    | "slide-right"
    | "slide-left"
    | "scale"
    | "expand";
  duration?: number;
  delay?: number;
  className?: string;
  onExitComplete?: () => void;
  ease?: string;
}

export function TransitionComponent({
  children,
  show,
  type = "fade",
  duration = 0.3,
  delay = 0,
  className = "",
  onExitComplete,
  ease = "easeInOut",
}: TransitionComponentProps) {
  // Configurações das variantes de animação
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    "slide-up": {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    "slide-down": {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    "slide-right": {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    "slide-left": {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    expand: {
      initial: { opacity: 0, height: 0, scale: 0.95 },
      animate: { opacity: 1, height: "auto", scale: 1 },
      exit: { opacity: 0, height: 0, scale: 0.95 },
    },
  };

  const selectedVariant = variants[type];

  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {show && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={selectedVariant}
          transition={{ duration, delay, ease }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Componente de transição sequencial para exibir múltiplos elementos com animação em cascata.
 */
export function SequentialTransition({
  children,
  show,
  staggerDelay = 0.1,
  duration = 0.3,
  type = "fade",
  className = "",
}: {
  children: ReactNode[];
  show: boolean;
  staggerDelay?: number;
  duration?: number;
  type?: TransitionComponentProps["type"];
  className?: string;
}) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    "slide-up": {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    "slide-down": {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    "slide-right": {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    "slide-left": {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    expand: {
      initial: { opacity: 0, height: 0, scale: 0.95 },
      animate: { opacity: 1, height: "auto", scale: 1 },
      exit: { opacity: 0, height: 0, scale: 0.95 },
    },
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1,
      },
    },
  };

  const selectedVariant = variants[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={className}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={containerVariants}
        >
          {children.map((child, index) => (
            <motion.div
              key={index}
              variants={selectedVariant}
              transition={{ duration }}
            >
              {child}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}