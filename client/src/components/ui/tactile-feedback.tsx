import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMobile } from "../../hooks/use-mobile";

interface TactileFeedbackProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
}

export function TactileFeedback({
  children,
  className,
  style,
  onClick,
  disabled = false,
}: TactileFeedbackProps) {
  const { isMobile } = useMobile();

  // Se não estiver em um dispositivo móvel, apenas renderiza o conteúdo normalmente
  if (!isMobile) {
    return (
      <div
        className={className}
        style={style}
        onClick={disabled ? undefined : onClick}
      >
        {children}
      </div>
    );
  }

  // Em dispositivos móveis, adicionamos feedback tátil através de animações
  return (
    <motion.div
      className={className}
      style={style}
      whileTap={{ scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </motion.div>
  );
}