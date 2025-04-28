import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Home, 
  Bell, 
  Heart, 
  ArrowRight, 
  Check,
  Sparkles,
  Zap,
  MessageSquare,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import "@/styles/confetti.css";

// Definição dos tipos para os passos do tutorial
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  animation: "slideIn" | "fadeIn" | "bounce" | "pulse" | "pop";
  highlight?: string; // ID ou classe CSS do elemento para destacar
  position?: "top" | "bottom" | "left" | "right" | "center";
  confetti?: boolean;
}

interface InteractiveTutorialProps {
  onComplete: () => void;
  onSkip?: () => void;
  className?: string;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  onComplete,
  onSkip,
  className
}) => {
  // Estado para acompanhar o passo atual do tutorial
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Definição dos passos do tutorial
  const tutorialSteps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Bem-vindo ao Nós Juntos!",
      description: "Vamos fazer um tour rápido para você conhecer as principais funcionalidades do aplicativo.",
      icon: <Heart className="h-8 w-8 text-red-500" />,
      animation: "pop",
      confetti: true
    },
    {
      id: "calendar",
      title: "Calendário Compartilhado",
      description: "Visualize e gerencie eventos, compromissos e datas especiais em um único lugar, com seu parceiro(a).",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      animation: "slideIn",
      position: "bottom"
    },
    {
      id: "tasks",
      title: "Tarefas Domésticas",
      description: "Organize as responsabilidades da casa de forma equilibrada e nunca mais esqueça quem deve fazer o quê.",
      icon: <Home className="h-8 w-8 text-green-600" />,
      animation: "fadeIn",
      position: "right"
    },
    {
      id: "notifications",
      title: "Notificações Inteligentes",
      description: "Receba lembretes personalizados sobre eventos, tarefas e momentos especiais no seu relacionamento.",
      icon: <Bell className="h-8 w-8 text-amber-500" />,
      animation: "pulse",
      position: "left"
    },
    {
      id: "connection",
      title: "Fortaleça a Conexão",
      description: "Comunique-se melhor, celebre conquistas juntos e construa memórias especiais.",
      icon: <Sparkles className="h-8 w-8 text-indigo-500" />,
      animation: "bounce",
      position: "top"
    },
    {
      id: "complete",
      title: "Tudo Pronto!",
      description: "Agora você já conhece as principais funcionalidades. Vamos começar a jornada juntos?",
      icon: <Trophy className="h-8 w-8 text-amber-500" />,
      animation: "pop",
      confetti: true
    }
  ];

  // Pegar o passo atual
  const currentStep = tutorialSteps[currentStepIndex];

  // Avançar para o próximo passo
  const nextStep = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      setShowAnimation(false);
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1);
        setShowAnimation(true);
      }, 300);
    } else {
      onComplete();
    }
  };

  // Pular o tutorial
  const skipTutorial = () => {
    if (onSkip) onSkip();
    else onComplete();
  };

  // Lançar confetti para celebrações
  const triggerConfetti = () => {
    try {
      // Simulação de confetti usando animações CSS
      const container = containerRef.current;
      if (container) {
        for (let i = 0; i < 30; i++) {
          const confetti = document.createElement('div');
          confetti.className = 'confetti-piece';
          confetti.style.setProperty('--confetti-x', `${Math.random() * 100}%`);
          confetti.style.setProperty('--confetti-y', `${Math.random() * 100}%`);
          confetti.style.setProperty('--confetti-size', `${Math.random() * 10 + 5}px`);
          confetti.style.setProperty('--confetti-rotation', `${Math.random() * 360}deg`);
          confetti.style.setProperty('--confetti-color', 
            `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`);
          
          confetti.style.position = 'absolute';
          confetti.style.top = '50%';
          confetti.style.left = '50%';
          confetti.style.width = 'var(--confetti-size)';
          confetti.style.height = 'var(--confetti-size)';
          confetti.style.backgroundColor = 'var(--confetti-color)';
          confetti.style.borderRadius = '50%';
          confetti.style.transform = 'translateX(var(--confetti-x)) translateY(var(--confetti-y)) rotate(var(--confetti-rotation))';
          confetti.style.opacity = '0';
          confetti.style.animation = `confetti-fall 1s ease-out forwards`;
          
          container.appendChild(confetti);
          
          // Limpar os confettis após algum tempo
          setTimeout(() => {
            if (container.contains(confetti)) {
              container.removeChild(confetti);
            }
          }, 3000);
        }
      }
    } catch (e) {
      console.error("Erro ao criar confetti:", e);
      // Falha silenciosa, a feature de confetti não é crítica
    }
  };

  // Efeito para mostrar animação quando o passo muda
  useEffect(() => {
    setShowAnimation(true);
    
    // Disparar confetti se especificado para o passo atual
    if (currentStep.confetti) {
      setTimeout(triggerConfetti, 500);
    }
  }, [currentStepIndex, currentStep]);

  // Variantes de animação para os cards
  const cardVariants = {
    hidden: (step: TutorialStep) => {
      switch (step.animation) {
        case "slideIn":
          return { 
            y: 50, 
            opacity: 0 
          };
        case "fadeIn":
          return { 
            opacity: 0 
          };
        case "bounce":
          return { 
            y: -20, 
            opacity: 0 
          };
        case "pulse":
          return { 
            scale: 0.8, 
            opacity: 0 
          };
        case "pop":
          return { 
            scale: 0.5, 
            opacity: 0 
          };
        default:
          return { 
            opacity: 0 
          };
      }
    },
    visible: (step: TutorialStep) => {
      switch (step.animation) {
        case "slideIn":
          return { 
            y: 0, 
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 500,
              damping: 30
            }
          };
        case "fadeIn":
          return { 
            opacity: 1,
            transition: {
              duration: 0.5
            }
          };
        case "bounce":
          return { 
            y: 0, 
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 10
            }
          };
        case "pulse":
          return { 
            scale: [0.8, 1.05, 1],
            opacity: 1,
            transition: {
              duration: 0.6,
              times: [0, 0.7, 1],
              ease: "easeInOut"
            }
          };
        case "pop":
          return { 
            scale: [0.5, 1.1, 1],
            opacity: 1,
            transition: {
              duration: 0.5,
              times: [0, 0.7, 1],
              ease: "easeOut"
            }
          };
        default:
          return { 
            opacity: 1 
          };
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.3
      }
    }
  };

  // Variantes para os ícones
  const iconVariants = {
    hidden: { scale: 0.5, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.2,
        duration: 0.5,
        type: "spring",
        stiffness: 500
      }
    }
  };

  // Variantes para o indicador de progresso
  const progressVariants = {
    inactive: { width: "10px", backgroundColor: "#E5E7EB" },
    active: { width: "30px", backgroundColor: "var(--primary)" },
    completed: { width: "10px", backgroundColor: "var(--primary)" }
  };

  // Função para posicionar o card base no position
  const getPositionStyles = () => {
    switch (currentStep.position) {
      case "top":
        return "items-start";
      case "bottom":
        return "items-end";
      case "left":
        return "items-start justify-start";
      case "right":
        return "items-end justify-end";
      default:
        return "items-center justify-center";
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex transition-all duration-300 bg-black/30 backdrop-blur-sm",
        getPositionStyles(),
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`tutorial-step-${currentStepIndex}`}
          custom={currentStep}
          initial="hidden"
          animate={showAnimation ? "visible" : "hidden"}
          exit="exit"
          variants={cardVariants}
          className="w-full max-w-md m-6"
        >
          <Card className="w-full border-primary/20 relative overflow-hidden">
            {/* Decoração de fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.2, 0.3],
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              />
              <motion.div 
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-primary/5 blur-xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 1
                }}
              />
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <motion.div
                  variants={iconVariants}
                  className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10"
                >
                  {currentStep.icon}
                </motion.div>
                
                <div className="flex-1">
                  <CardTitle>{currentStep.title}</CardTitle>
                  <CardDescription>{currentStep.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="relative h-48 flex items-center justify-center">
                {currentStepIndex === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: {
                        delay: 0.3,
                        duration: 0.5
                      }
                    }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <motion.div 
                        className="absolute inset-0 bg-primary/10 rounded-full"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.7, 0.5, 0.7]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      />
                      <Heart className="h-16 w-16 text-red-500 relative z-10" />
                    </div>
                    <motion.p 
                      className="text-center mt-4 text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        transition: { delay: 0.5 }
                      }}
                    >
                      Descubra como transformar a rotina a dois em uma jornada de crescimento e amor.
                    </motion.p>
                  </motion.div>
                )}
                
                {currentStepIndex === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        delay: 0.3,
                        duration: 0.5
                      }
                    }}
                    className="w-full"
                  >
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {Array.from({ length: 7 }).map((_, index) => (
                        <motion.div 
                          key={index}
                          className="text-center text-xs text-muted-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ 
                            opacity: 1,
                            transition: { delay: 0.3 + index * 0.05 }
                          }}
                        >
                          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][index]}
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 35 }).map((_, index) => {
                        const isEvent = [3, 10, 15, 22, 28].includes(index);
                        const isShared = [10, 28].includes(index);
                        return (
                          <motion.div 
                            key={index}
                            className={`h-8 rounded-md flex items-center justify-center text-xs
                              ${isEvent 
                                ? isShared 
                                  ? 'bg-primary/20 text-primary font-medium' 
                                  : 'bg-blue-100 text-blue-700 font-medium' 
                                : index % 7 === 0 || index % 7 === 6 
                                  ? 'text-gray-400' 
                                  : 'text-gray-700'
                              }
                            `}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                              opacity: 1,
                              scale: 1,
                              transition: { delay: 0.2 + index * 0.01 }
                            }}
                          >
                            {index + 1}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
                
                {currentStepIndex === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      transition: { delay: 0.3 }
                    }}
                    className="w-full"
                  >
                    {[
                      { text: "Lavar a louça", checked: true },
                      { text: "Aspirar a sala", checked: false },
                      { text: "Regar as plantas", checked: false },
                      { text: "Trocar as roupas de cama", checked: true }
                    ].map((task, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: 1,
                          x: 0,
                          transition: { delay: 0.3 + index * 0.1 }
                        }}
                        className="flex items-center p-3 mb-2 rounded-lg border border-gray-200"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3
                          ${task.checked 
                            ? 'bg-green-500 text-white' 
                            : 'border-2 border-gray-300'
                          }`}
                        >
                          {task.checked && <Check className="h-4 w-4" />}
                        </div>
                        <span className={task.checked ? 'line-through text-gray-500' : ''}>
                          {task.text}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                
                {currentStepIndex === 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      transition: { delay: 0.3 }
                    }}
                    className="w-full"
                  >
                    {[
                      { title: "Reunião de trabalho", time: "Hoje, 14:00", type: "calendar" },
                      { title: "Lavar a louça", time: "Tarefa pendente", type: "task" },
                      { title: "Aniversário do relacionamento", time: "Em 3 dias", type: "special" }
                    ].map((notification, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: 1,
                          y: 0,
                          transition: { delay: 0.3 + index * 0.1 }
                        }}
                        className="flex p-3 mb-2 rounded-lg bg-white shadow-sm"
                      >
                        <div className="mr-3">
                          {notification.type === 'calendar' && (
                            <Calendar className="h-5 w-5 text-blue-500" />
                          )}
                          {notification.type === 'task' && (
                            <Home className="h-5 w-5 text-green-500" />
                          )}
                          {notification.type === 'special' && (
                            <Heart className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{notification.title}</div>
                          <div className="text-xs text-gray-500">{notification.time}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                
                {currentStepIndex === 4 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      transition: { delay: 0.3 }
                    }}
                    className="w-full flex flex-col items-center"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: 1,
                        transition: {
                          delay: 0.3,
                          type: "spring",
                          stiffness: 500,
                          damping: 15
                        }
                      }}
                      className="relative mb-4"
                    >
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-md" />
                      <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-pink-500 to-primary rounded-full flex items-center justify-center">
                        <Heart className="h-12 w-12 text-white" />
                      </div>
                    </motion.div>
                    
                    <div className="text-center space-y-2">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: 1,
                          y: 0,
                          transition: { delay: 0.5 }
                        }}
                        className="flex justify-center space-x-3"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-amber-600" />
                        </div>
                      </motion.div>
                      
                      <motion.p 
                        className="text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: 1,
                          transition: { delay: 0.7 }
                        }}
                      >
                        Cultivem memórias especiais e fortaleçam o relacionamento com pequenos gestos diários.
                      </motion.p>
                    </div>
                  </motion.div>
                )}
                
                {currentStepIndex === 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: {
                        delay: 0.3,
                        duration: 0.5
                      }
                    }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 2
                      }}
                      className="mb-4 inline-block"
                    >
                      <div className="w-24 h-24 bg-gradient-to-r from-primary/80 to-primary rounded-full flex items-center justify-center mx-auto">
                        <Zap className="h-12 w-12 text-white" />
                      </div>
                    </motion.div>
                    
                    <motion.p 
                      className="text-lg font-medium text-primary"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        transition: { delay: 0.5 }
                      }}
                    >
                      Vocês estão prontos para começar!
                    </motion.p>
                    
                    <motion.p 
                      className="text-muted-foreground mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        transition: { delay: 0.7 }
                      }}
                    >
                      Mergulhem nessa nova jornada de organização e conexão.
                    </motion.p>
                  </motion.div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex justify-center space-x-2 w-full">
                {tutorialSteps.map((step, index) => (
                  <motion.div
                    key={`indicator-${index}`}
                    initial="inactive"
                    animate={
                      index === currentStepIndex
                        ? "active"
                        : index < currentStepIndex
                        ? "completed"
                        : "inactive"
                    }
                    variants={progressVariants}
                    className="h-2 rounded-full transition-all"
                  />
                ))}
              </div>
              
              <div className="flex w-full justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={skipTutorial}
                  className="text-muted-foreground"
                >
                  Pular tutorial
                </Button>
                
                <Button onClick={nextStep} className="group">
                  {currentStepIndex === tutorialSteps.length - 1 ? "Começar" : "Próximo"}
                  <motion.span
                    className="ml-2 inline-block"
                    initial={{ x: 0 }}
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.5 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Os estilos estão definidos no arquivo confetti.css */}
    </div>
  );
};

export default InteractiveTutorial;