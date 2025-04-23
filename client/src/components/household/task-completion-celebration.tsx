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
  onComplete
}: {
  isActive: boolean;
  onComplete?: () => void;
}) {
  const [showThumbsUp, setShowThumbsUp] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      setShowThumbsUp(true);
      
      const timer = setTimeout(() => {
        setShowThumbsUp(false);
        if (onComplete) onComplete();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);
  
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
        >
          {showThumbsUp && (
            <motion.div
              className="bg-primary-light/90 shadow-lg rounded-full p-5"
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
              <ThumbsUp className="w-16 h-16 text-white" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}