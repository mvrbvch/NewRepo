import { useState, useEffect, useRef, CSSProperties } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

// Types for confetti particle
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  type: 'circle' | 'rectangle' | 'heart';
  duration: number;
  delay: number;
}

interface ConfettiAnimationProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  className?: string;
  onComplete?: () => void;
  position?: 'fixed' | 'absolute';
  zIndex?: number;
  spread?: number;
}

export function ConfettiAnimation({
  isActive,
  duration = 2000,
  particleCount = 80,
  colors = ['#f15a59', '#f47373', '#e35252', '#ff8c8c', '#ffb1b1', '#ffcd91', '#ffd4a9', '#ffe6c7'],
  className,
  onComplete,
  position = 'absolute',
  zIndex = 50,
  spread = 100,
}: ConfettiAnimationProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(isActive);

  const generateRandomParticles = () => {
    if (!containerRef.current) return [];

    const container = containerRef.current;
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 3; // Start from upper area
    
    // Create two burst origin points for more natural celebration
    const leftOriginX = centerX - 50;
    const rightOriginX = centerX + 50;

    const newParticles = Array.from({ length: particleCount }, (_, i) => {
      const type = ['circle', 'rectangle', 'heart'][Math.floor(Math.random() * 3)] as 'circle' | 'rectangle' | 'heart';
      // Alternate between left and right origin for better spread
      const originX = i % 2 === 0 ? leftOriginX : rightOriginX;
      
      // Add some randomness to each particle
      const uniqueScale = Math.random() * 0.6 + 0.4; // 0.4 to 1
      const uniqueSpeed = 1.5 + Math.random() * 1; // 1.5 to 2.5 seconds
      const uniqueDelay = Math.random() * 0.4; // 0 to 0.4 seconds
      
      return {
        id: i,
        x: originX + (Math.random() - 0.5) * 40, // More variation in start position
        y: centerY + (Math.random() - 0.5) * 20,
        rotation: Math.random() * 360,
        scale: uniqueScale,
        color: colors[Math.floor(Math.random() * colors.length)],
        type,
        duration: uniqueSpeed,
        delay: uniqueDelay,
      };
    });

    return newParticles;
  };

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      const newParticles = generateRandomParticles();
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onComplete) onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, onComplete]);

  // Particle shape renderer
  const renderParticleShape = (type: 'circle' | 'rectangle' | 'heart', color: string) => {
    switch (type) {
      case 'circle':
        return (
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        );
      case 'rectangle':
        return (
          <motion.div
            className="w-4 h-2 rounded-sm"
            style={{ backgroundColor: color }}
          />
        );
      case 'heart':
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={color}
            className="w-4 h-4"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
    }
  };

  return (
    <AnimatePresence>
      {shouldRender && (
        <div
          ref={containerRef}
          className={cn(
            "overflow-hidden pointer-events-none w-full h-full",
            position === 'fixed' ? 'fixed inset-0' : 'absolute inset-0',
            className
          )}
          style={{ zIndex }}
        >
          {particles.map((particle) => {
            // Calculate final position (spreading out)
            const finalX = particle.x + (Math.random() - 0.5) * spread * 2;
            const finalY = particle.y + spread * 1.5 + Math.random() * spread * 0.5;

            return (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: particle.x, 
                  y: particle.y, 
                  rotate: 0,
                  opacity: 1
                }}
                animate={{ 
                  x: finalX, 
                  y: finalY, 
                  rotate: particle.rotation,
                  opacity: 0
                }}
                transition={{ 
                  duration: particle.duration, 
                  delay: particle.delay,
                  ease: [0.1, 0.25, 0.3, 1] // custom ease to simulate gravity
                }}
                className="absolute origin-center"
                style={{ 
                  transform: `scale(${particle.scale})` 
                }}
              >
                {renderParticleShape(particle.type, particle.color)}
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

// Presets for different celebrations
export function TaskCompletionConfetti({ 
  isActive, 
  onComplete,
  className
}: {
  isActive: boolean;
  onComplete?: () => void;
  className?: string;
}) {
  return (
    <ConfettiAnimation
      isActive={isActive}
      particleCount={60}
      duration={2500}
      colors={['#f15a59', '#FF9F9F', '#FFB9B9', '#FFCECE', '#ff8c8c', '#ff6b6b', '#e35252', '#FFCD91', '#FFE6C7']}
      onComplete={onComplete}
      className={className}
      spread={120}
      zIndex={100}
    />
  );
}

// Component for a floating success message with animation
export function CompletionMessage({
  isActive,
  message = "Tarefa concluída!",
  duration = 2000,
  onComplete
}: {
  isActive: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}) {
  const controls = useAnimation();
  
  useEffect(() => {
    if (isActive) {
      controls.start({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.3, ease: "easeOut" }
      });
      
      const timer = setTimeout(() => {
        controls.start({
          opacity: 0,
          y: -20,
          transition: { duration: 0.3, ease: "easeIn" }
        }).then(() => {
          if (onComplete) onComplete();
        });
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, controls, duration, onComplete]);
  
  if (!isActive) return null;
  
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-green-50 text-green-700 px-4 py-2 rounded-full text-lg font-bold shadow-md"
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={controls}
    >
      {message}
    </motion.div>
  );
}