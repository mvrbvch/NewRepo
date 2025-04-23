import { ReactNode } from "react";
import { motion } from "framer-motion";

type TactileFeedbackProps = {
  children: ReactNode;
  className?: string;
  scale?: number;
  onClick?: () => void;
};

/**
 * Componente que adiciona feedback tátil (efeito de pressionar) aos elementos
 */
export function TactileFeedback({
  children,
  className = "",
  scale = 0.95,
  onClick,
}: TactileFeedbackProps) {
  return (
    <motion.div
      className={className}
      whileTap={{ scale }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}