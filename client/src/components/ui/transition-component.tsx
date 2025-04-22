import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TransitionComponentProps = {
  show: boolean;
  children: ReactNode;
  duration?: number;
  delay?: number;
  type?: "fade" | "scale" | "slide" | "slideUp";
  className?: string;
};

export function TransitionComponent({
  show,
  children,
  duration = 0.3,
  delay = 0,
  type = "fade",
  className = "",
}: TransitionComponentProps) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
    
    // Se o componente estiver saindo, aguarde a animação terminar antes de não renderizá-lo
    let timeout: NodeJS.Timeout;
    if (!show && shouldRender) {
      timeout = setTimeout(() => setShouldRender(false), duration * 1000);
    }
    
    return () => clearTimeout(timeout);
  }, [show, duration]);

  if (!shouldRender) return null;

  // Configurar variantes de animação com base no tipo selecionado
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 }
    },
    slide: {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    }
  };

  const selectedVariant = variants[type];

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={selectedVariant}
          transition={{ duration, delay, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}