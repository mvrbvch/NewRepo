import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCompletionConfetti, CompletionMessage } from '@/components/ui/confetti-animation';
import { Heart, Award, Star, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types of celebrations
type CelebrationType = 'confetti' | 'sticker' | 'message' | 'full';

interface TaskCompletionCelebrationProps {
  isActive: boolean;
  taskTitle?: string;
  type?: CelebrationType;
  className?: string;
  onComplete?: () => void;
  streakCount?: number;
}

export function TaskCompletionCelebration({
  isActive,
  taskTitle,
  type = 'full',
  className,
  onComplete,
  streakCount = 0
}: TaskCompletionCelebrationProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showSticker, setShowSticker] = useState(false);
  const [celebrationText, setCelebrationText] = useState('Tarefa concluída!');
  const [celebrationPhase, setCelebrationPhase] = useState(0);
  
  useEffect(() => {
    if (isActive) {
      // Reset states
      setShowAnimation(false);
      setShowMessage(false);
      setShowSticker(false);
      setCelebrationPhase(0);
      
      // Set celebration text based on streak
      if (streakCount >= 10) {
        setCelebrationText(`Incrível! ${streakCount} tarefas completadas!`);
      } else if (streakCount >= 5) {
        setCelebrationText(`Impressionante! ${streakCount} tarefas completadas!`);
      } else if (streakCount >= 3) {
        setCelebrationText(`Você está em uma sequência de ${streakCount}!`);
      } else if (taskTitle) {
        setCelebrationText(`"${taskTitle}" concluída!`);
      } else {
        setCelebrationText('Tarefa concluída!');
      }
      
      // Trigger animations in sequence with smooth timing
      const animationSequence = async () => {
        // Phase 1: Start confetti
        setCelebrationPhase(1);
        setTimeout(() => setShowAnimation(true), 50);
        
        // Phase 2: Show message after a short delay
        if (type === 'full' || type === 'message') {
          setTimeout(() => {
            setCelebrationPhase(2);
            setShowMessage(true);
          }, 300);
        }
        
        // Phase 3: Show sticker/badge for achievements
        if (type === 'full' || type === 'sticker') {
          setTimeout(() => {
            setCelebrationPhase(3);
            setShowSticker(true);
          }, 800);
        }
      };
      
      animationSequence();
      
      // Handle completion callback
      const completeTimer = setTimeout(() => {
        // Fade out everything smoothly
        setShowMessage(false);
        setShowSticker(false);
        
        setTimeout(() => {
          setShowAnimation(false);
          if (onComplete) onComplete();
        }, 500);
      }, 3000); // Total animation duration
      
      return () => clearTimeout(completeTimer);
    }
  }, [isActive, type, taskTitle, streakCount, onComplete]);
  
  // If not active, render nothing
  if (!isActive) return null;
  
  return (
    <div className={cn(
      "fixed inset-0 z-50 pointer-events-none flex items-center justify-center",
      className
    )}>
      {/* Semi-transparent overlay */}
      <motion.div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Confetti animation */}
      {(type === 'full' || type === 'confetti') && (
        <TaskCompletionConfetti 
          isActive={showAnimation} 
          onComplete={() => {}}
        />
      )}
      
      {/* Celebration message */}
      {(type === 'full' || type === 'message') && (
        <AnimatePresence>
          {showMessage && (
            <motion.div
              className="absolute z-50 bg-white px-6 py-3 rounded-full shadow-lg text-xl font-bold text-primary"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {celebrationText}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Animated sticker/badge */}
      {(type === 'full' || type === 'sticker') && (
        <AnimatePresence>
          {showSticker && (
            <motion.div
              className="absolute z-50"
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ 
                opacity: 1, 
                scale: [0.5, 1.2, 1],
                rotate: [-10, 5, 0],
              }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ 
                duration: 0.6,
                scale: { times: [0, 0.5, 1], ease: "easeOut" },
                rotate: { times: [0, 0.5, 1], ease: "easeOut" }
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl transform scale-110" />
                
                {streakCount >= 5 ? (
                  <div className="bg-gradient-to-br from-amber-500 to-yellow-600 w-24 h-24 rounded-full flex items-center justify-center p-5 shadow-xl">
                    <Award className="w-14 h-14 text-white drop-shadow-md" />
                  </div>
                ) : streakCount >= 3 ? (
                  <div className="bg-gradient-to-br from-primary to-red-600 w-24 h-24 rounded-full flex items-center justify-center p-5 shadow-xl">
                    <Star className="w-14 h-14 text-white drop-shadow-md" />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-primary-light to-primary w-24 h-24 rounded-full flex items-center justify-center p-5 shadow-xl">
                    <Heart className="w-14 h-14 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// Smaller component for just a quick celebration effect
export function QuickTaskCelebration({
  isActive,
  onComplete,
  taskTitle
}: {
  isActive: boolean;
  onComplete?: () => void;
  taskTitle?: string;
}) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      // Reset state
      setShowCelebration(true);
      
      // Add a slight delay before showing the particles for better visual effect
      setTimeout(() => {
        setShowParticles(true);
      }, 50);
      
      // Auto-hide after the animation completes
      const timer = setTimeout(() => {
        setShowParticles(false);
        
        // Fade out the main element after particles disappear
        setTimeout(() => {
          setShowCelebration(false);
          if (onComplete) onComplete();
        }, 300);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);
  
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Mini confetti particles */}
          {showParticles && (
            <motion.div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => {
                const size = 4 + Math.random() * 6;
                const color = ['#f15a59', '#FF9F9F', '#FFB9B9', '#ff6b6b', '#FFCD91'][
                  Math.floor(Math.random() * 5)
                ];
                const angle = Math.random() * Math.PI * 2;
                const distance = 40 + Math.random() * 60;
                const delay = Math.random() * 0.2;
                
                return (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 rounded-full"
                    style={{ 
                      width: size, 
                      height: size, 
                      backgroundColor: color 
                    }}
                    initial={{ 
                      x: -size/2, 
                      y: -size/2,
                      scale: 0.5,
                      opacity: 1
                    }}
                    animate={{ 
                      x: -size/2 + Math.cos(angle) * distance, 
                      y: -size/2 + Math.sin(angle) * distance,
                      scale: 0,
                      opacity: 0
                    }}
                    transition={{ 
                      duration: 0.8 + Math.random() * 0.4,
                      delay,
                      ease: "easeOut"
                    }}
                  />
                );
              })}
            </motion.div>
          )}
          
          {/* Central icon */}
          {showCelebration && (
            <motion.div
              className="bg-gradient-to-br from-primary-light to-primary shadow-lg rounded-full p-5 relative"
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: [0.5, 1.2, 1],
                rotate: [-5, 5, 0]
              }}
              exit={{ 
                opacity: 0, 
                y: -20, 
                transition: { duration: 0.3 } 
              }}
              transition={{ 
                duration: 0.4,
                scale: { times: [0, 0.6, 1], ease: "easeOut" }
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-md transform scale-110" />
              
              {/* Success icon */}
              <motion.div 
                className="relative z-10"
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <ThumbsUp className="w-16 h-16 text-white drop-shadow-md" />
              </motion.div>
              
              {/* Optional mini text label */}
              {taskTitle && (
                <motion.div
                  className="absolute bottom-[-25px] left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full text-sm font-medium text-primary-dark shadow-md"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Concluída!
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}