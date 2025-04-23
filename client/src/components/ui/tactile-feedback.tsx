import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TactileFeedbackProps {
  x: number;
  y: number;
  color?: string;
  isActive: boolean;
  onComplete: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function TactileFeedback({
  x,
  y,
  color = '#4E77E5',
  isActive,
  onComplete,
  size = 'md',
}: TactileFeedbackProps) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Tamanhos baseados no valor de size
  const getSizeValue = () => {
    switch (size) {
      case 'sm': return { ripple: 30, outer: 10 };
      case 'lg': return { ripple: 70, outer: 20 };
      default: return { ripple: 50, outer: 15 };
    }
  };
  
  const sizeValue = getSizeValue();
  
  useEffect(() => {
    if (isActive) {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      // Auto-dismiss after animation completes
      timeoutRef.current = setTimeout(() => {
        onComplete();
      }, 700); // Slight delay to ensure animation completes
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, onComplete]);
  
  if (!isActive) return null;
  
  return (
    <AnimatePresence>
      {isActive && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            top: y - sizeValue.outer / 2,
            left: x - sizeValue.outer / 2,
          }}
        >
          {/* Outer dot */}
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              width: sizeValue.outer,
              height: sizeValue.outer,
              borderRadius: '50%',
              backgroundColor: color,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          
          {/* Ripple effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              width: sizeValue.ripple,
              height: sizeValue.ripple,
              borderRadius: '50%',
              border: `2px solid ${color}`,
              position: 'absolute',
              top: -sizeValue.ripple / 2 + sizeValue.outer / 2,
              left: -sizeValue.ripple / 2 + sizeValue.outer / 2,
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

interface UseTactileFeedbackResult {
  feedbackProps: {
    x: number;
    y: number;
    isActive: boolean;
    onComplete: () => void;
  };
  triggerFeedback: (x: number, y: number) => void;
}

export function useTactileFeedback(): UseTactileFeedbackResult {
  const [isActive, setIsActive] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  
  const triggerFeedback = (x: number, y: number) => {
    setPosition({ x, y });
    setIsActive(true);
  };
  
  const handleComplete = () => {
    setIsActive(false);
  };
  
  return {
    feedbackProps: {
      x: position.x,
      y: position.y,
      isActive,
      onComplete: handleComplete,
    },
    triggerFeedback,
  };
}