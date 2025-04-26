import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Heart,
  Calendar,
  Home,
  Gift,
  Star,
  Coffee,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Constantes para os tipos de eventos na jornada
export enum JourneyEventType {
  JOIN = "join",           // Entrada no app
  PARTNER = "partner",     // Conexão com parceiro
  TASK = "task",           // Primeira tarefa doméstica
  EVENT = "event",         // Primeiro evento adicionado
  MILESTONE = "milestone", // Marco personalizado  
}

// Interface para eventos da jornada
interface JourneyEvent {
  id: string;
  type: JourneyEventType;
  title: string;
  description: string;
  date: Date;
  icon: React.ReactNode;
  color: string;
  completed: boolean;
}

// Componente de visualização da jornada do casal
const JourneyTimeline: React.FC<{onComplete: () => void}> = ({ onComplete }) => {
  const { user, partner } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Efeito para inicializar a jornada baseada nos dados do usuário
  useEffect(() => {
    // Simulando um pequeno delay para carregar os dados
    const loadJourneyData = async () => {
      try {
        setIsLoading(true);
        
        // Eventos base da jornada
        const baseEvents: JourneyEvent[] = [
          {
            id: "join",
            type: JourneyEventType.JOIN,
            title: "Jornada iniciada",
            description: `Bem-vindo(a) ao Nós Juntos! Você começou sua jornada ${formatDistanceToNow(new Date(user?.createdAt || new Date()), {
              locale: ptBR,
              addSuffix: true,
            })}`,
            date: new Date(user?.createdAt || new Date()),
            icon: <Heart className="h-5 w-5" />,
            color: "text-rose-500",
            completed: true,
          },
          {
            id: "partner",
            type: JourneyEventType.PARTNER,
            title: partner ? "Parceiro conectado" : "Conecte seu parceiro",
            description: partner
              ? `Você e ${partner.name} estão conectados para organizar a vida juntos!`
              : "Convide seu parceiro para compartilhar essa jornada",
            date: partner?.createdAt ? new Date(partner.createdAt) : new Date(),
            icon: <Coffee className="h-5 w-5" />,
            color: "text-amber-500",
            completed: !!partner,
          },
          {
            id: "task",
            type: JourneyEventType.TASK,
            title: "Organização doméstica",
            description: "Comece a dividir as tarefas domésticas de forma equilibrada",
            date: new Date(),
            icon: <Home className="h-5 w-5" />,
            color: "text-emerald-500",
            completed: false, // Deveria ser baseado em dados reais
          },
          {
            id: "event",
            type: JourneyEventType.EVENT,
            title: "Planos juntos",
            description: "Adicionem eventos especiais no calendário compartilhado",
            date: new Date(),
            icon: <Calendar className="h-5 w-5" />,
            color: "text-blue-500",
            completed: false, // Deveria ser baseado em dados reais
          },
          {
            id: "milestone",
            type: JourneyEventType.MILESTONE,
            title: "Marco especial",
            description: "Celebre momentos únicos da sua relação no app",
            date: new Date(),
            icon: <Star className="h-5 w-5" />,
            color: "text-violet-500",
            completed: false,
          },
        ];

        // Calcular progresso baseado nos eventos completos
        const completedEvents = baseEvents.filter(event => event.completed).length;
        const progress = Math.round((completedEvents / baseEvents.length) * 100);
        
        setJourneyEvents(baseEvents);
        setJourneyProgress(progress);
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados da jornada:", error);
        setIsLoading(false);
      }
    };

    loadJourneyData();
  }, [user, partner]);

  // Avançar para o próximo passo da animação
  const nextStep = () => {
    if (currentStep < journeyEvents.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  // Animação automática com avanço de passos
  useEffect(() => {
    if (isLoading) return;
    
    const timer = setTimeout(() => {
      if (currentStep < journeyEvents.length) {
        setCurrentStep(currentStep + 1);
      }
    }, 1000); // Avança automaticamente a cada 2s
    
    return () => clearTimeout(timer);
  }, [currentStep, journeyEvents.length, isLoading]);

  // Variantes para animação do framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.3,
        delay: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: { when: "afterChildren" }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: {
      y: -20,
      opacity: 0
    }
  };

  // Animação do progresso da jornada
  const progressVariants = {
    initial: { width: "0%" },
    animate: { 
      width: `${journeyProgress}%`,
      transition: { 
        duration: 1.5,
        ease: "easeOut"
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <Sparkles className="h-12 w-12 text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground">Carregando sua jornada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Sua Jornada no <span className="text-primary">Nós Juntos</span>
        </h1>
        <p className="text-muted-foreground">
          Veja os momentos importantes da sua história juntos
        </p>
      </motion.div>

      <div className="relative mb-8">
        <div className="h-2 w-full bg-muted rounded-full">
          <motion.div
            initial="initial"
            animate="animate"
            variants={progressVariants}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">Início</span>
          <span className="text-xs font-medium">{journeyProgress}% completo</span>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex-1 relative"
      >
        {/* Linha do tempo vertical */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-muted"></div>

        {/* Eventos da jornada */}
        <div className="space-y-8">
          <AnimatePresence>
            {journeyEvents.slice(0, currentStep).map((event, index) => (
              <motion.div
                key={event.id}
                variants={itemVariants}
                custom={index}
                className="ml-12 relative"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Indicador na linha do tempo */}
                <div 
                  className={cn(
                    "absolute left-[-27px] w-6 h-6 rounded-full flex items-center justify-center",
                    event.completed ? "bg-primary/20" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute w-4 h-4 rounded-full flex items-center justify-center", 
                    event.completed ? "bg-primary" : "bg-muted"
                  )}>
                    {event.completed && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>

                {/* Card do evento */}
                <Card className={cn(
                  "p-4 border",
                  event.completed ? "border-primary/30" : "border-muted",
                  "transition-all duration-300 hover:shadow-md"
                )}>
                  <div className="flex items-start">
                    <div className={cn(
                      "mr-4 p-2 rounded-full",
                      event.completed ? "bg-primary/10" : "bg-muted/50"
                    )}>
                      <div className={event.color}>{event.icon}</div>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{event.title}</h3>
                      <p className="text-muted-foreground text-sm">{event.description}</p>
                      
                      {event.completed && (
                        <div className="mt-2 flex items-center text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-primary" />
                          <span>Concluído {formatDistanceToNow(event.date, { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Botão de continuar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: currentStep >= journeyEvents.length ? 1 : 0,
          y: currentStep >= journeyEvents.length ? 0 : 20
        }}
        transition={{ duration: 0.5 }}
        className="mt-8 flex justify-center"
      >
        {currentStep >= journeyEvents.length && (
          <Button onClick={onComplete} size="lg" className="group">
            Continuar para o app
            <motion.span
              className="ml-2 inline-block"
              initial={{ x: 0 }}
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.5 }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default JourneyTimeline;