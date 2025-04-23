import React, { useState, useRef, useEffect } from "react";
import { motion, PanInfo } from "framer-motion";
import { Check, Trash2, RotateCcw, ArrowLeft } from "lucide-react";

interface SwipeActionProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftActionColor?: string;
  rightActionColor?: string;
  leftActionIcon?: "complete" | "delete" | "revert"; 
  rightActionIcon?: "complete" | "delete" | "revert";
  disabled?: boolean;
  threshold?: number;
  className?: string;
  swipeLeftLabel?: string;
  swipeRightLabel?: string;
  hapticFeedback?: boolean;
}

export function SwipeAction({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActionColor = "bg-emerald-500",
  rightActionColor = "bg-red-500",
  leftActionIcon = "complete",
  rightActionIcon = "delete",
  disabled = false,
  threshold = 0.4,
  className = "",
  swipeLeftLabel,
  swipeRightLabel,
  hapticFeedback = true,
}: SwipeActionProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useRef(0);
  const startX = useRef(0);
  
  // Definir ícones baseados nos tipos de ação
  const getIcon = (iconType: "complete" | "delete" | "revert") => {
    switch (iconType) {
      case "complete":
        return <Check className="h-5 w-5 text-white" />;
      case "delete":
        return <Trash2 className="h-5 w-5 text-white" />;
      case "revert":
        return <RotateCcw className="h-5 w-5 text-white" />;
      default:
        return <Check className="h-5 w-5 text-white" />;
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerWidth.current = containerRef.current.offsetWidth;
    }
    
    const updateWidth = () => {
      if (containerRef.current) {
        containerWidth.current = containerRef.current.offsetWidth;
      }
    };
    
    window.addEventListener("resize", updateWidth);
    
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const triggerHapticFeedback = () => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10); // Vibração curta para feedback tátil
    }
  };

  const handleDragStart = (_: any, info: PanInfo) => {
    if (disabled) return;
    
    setIsDragging(true);
    startX.current = info.point.x;
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (disabled) return;
    
    setIsDragging(false);
    
    // Calcular a porcentagem de arrasto em relação à largura
    const dragPercentage = Math.abs(offset) / containerWidth.current;
    
    if (dragPercentage > threshold) {
      // Ação atingiu o limite, executar o callback associado
      if (offset > 0 && onSwipeRight) {
        triggerHapticFeedback();
        onSwipeRight();
      } else if (offset < 0 && onSwipeLeft) {
        triggerHapticFeedback();
        onSwipeLeft();
      }
    }
    
    // Resetar a posição
    setOffset(0);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (disabled) return;
    
    const newOffset = info.point.x - startX.current;
    
    // Limitar o deslocamento máximo
    const maxOffset = containerWidth.current * 0.6;
    const constrainedOffset = Math.min(Math.max(newOffset, -maxOffset), maxOffset);
    
    // Verificar se temos callback para o lado arrastado
    if ((constrainedOffset > 0 && !onSwipeRight) || (constrainedOffset < 0 && !onSwipeLeft)) {
      setOffset(0);
      return;
    }
    
    setOffset(constrainedOffset);
  };

  // Calcular opacidade das ações baseada no offset
  const rightActionOpacity = Math.min(offset / (containerWidth.current * threshold), 1);
  const leftActionOpacity = Math.min(-offset / (containerWidth.current * threshold), 1);

  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${className}`}
      ref={containerRef}
    >
      {/* Ação à esquerda (aparece quando arrasta para a direita) */}
      {onSwipeRight && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center justify-start z-0 px-4"
          style={{ opacity: rightActionOpacity }}
        >
          <div 
            className={`flex items-center gap-2 ${rightActionColor} p-2 rounded-md`}
          >
            {getIcon(rightActionIcon)}
            {swipeRightLabel && (
              <span className="text-xs font-medium text-white">{swipeRightLabel}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Ação à direita (aparece quando arrasta para a esquerda) */}
      {onSwipeLeft && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end z-0 px-4"
          style={{ opacity: leftActionOpacity }}
        >
          <div 
            className={`flex items-center gap-2 ${leftActionColor} p-2 rounded-md`}
          >
            {swipeLeftLabel && (
              <span className="text-xs font-medium text-white">{swipeLeftLabel}</span>
            )}
            {getIcon(leftActionIcon)}
          </div>
        </div>
      )}
      
      {/* Conteúdo principal */}
      <motion.div
        drag={!disabled ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: offset }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 40,
          mass: 1
        }}
        className={`relative z-10 touch-pan-y cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
      >
        {children}
      </motion.div>
    </div>
  );
}