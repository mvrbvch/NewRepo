import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Heart, Clock, Home } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface JourneyTimelineProps {
  onComplete: () => void;
}

// Para mockup, caso não tenha dados reais ainda
interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  icon: React.ReactNode;
  description: string;
}

// Eventos estáticos predefinidos
const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: "1",
    title: "Início do relacionamento",
    date: new Date(2023, 4, 15),
    icon: <Heart className="h-6 w-6 text-rose-500" />,
    description: "O início de uma história incrível juntos."
  },
  {
    id: "2",
    title: "Primeiro encontro",
    date: new Date(2023, 4, 22),
    icon: <Calendar className="h-6 w-6 text-blue-500" />,
    description: "Um jantar inesquecível com muitas risadas e boas conversas."
  },
  {
    id: "3",
    title: "Aniversário de namoro",
    date: new Date(2024, 4, 15),
    icon: <Calendar className="h-6 w-6 text-green-500" />,
    description: "Um ano cheio de momentos especiais e crescimento juntos."
  },
  {
    id: "4",
    title: "Mudança para casa nova",
    date: new Date(2025, 2, 10),
    icon: <Home className="h-6 w-6 text-amber-500" />,
    description: "Começando a construir um lar juntos, com planos e sonhos compartilhados."
  }
];

const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ onComplete }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Carregamento simulado de eventos
  useEffect(() => {
    const timer = setTimeout(() => {
      setEvents(DEFAULT_EVENTS);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
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
    }
  };

  // Avançar para o próximo evento
  const nextEvent = () => {
    if (activeIndex < events.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      onComplete();
    }
  };

  // Formatador de data em português
  const formatDate = (date: Date) => {
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Se ainda estiver carregando, mostre um estado de carregamento
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-lg text-muted-foreground">Carregando sua jornada...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center px-6 py-8 pb-24 max-w-4xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 className="text-3xl font-bold mb-3 text-center" variants={itemVariants}>
        Sua Jornada Juntos
      </motion.h1>
      
      <motion.p className="text-muted-foreground text-center mb-10 max-w-md" variants={itemVariants}>
        Relembre os momentos especiais que construíram sua história de amor
      </motion.p>

      {/* Timeline responsiva - vertical para todos os dispositivos e otimizada para mobile */}
      <div className="relative w-full max-w-2xl">
        {/* Linha vertical - à esquerda em mobile, centralizada em desktop */}
        <div className="absolute md:left-1/2 left-6 md:transform md:-translate-x-1/2 h-full w-1 bg-primary/20 rounded-full z-0"></div>
        
        {/* Eventos da timeline */}
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            className="relative mb-10 flex flex-row"
            initial={{ opacity: 0, y: 40 }}
            animate={{ 
              opacity: index <= activeIndex ? 1 : 0.4,
              y: 0,
              transition: { 
                delay: index * 0.1,
                duration: 0.5
              }
            }}
          >
            {/* Conector para a linha */}
            <div className="absolute md:left-1/2 left-6 md:transform md:-translate-x-1/2 top-2">
              <div 
                className={`w-6 h-6 rounded-full ${
                  index <= activeIndex ? "bg-primary" : "bg-gray-200"
                } flex items-center justify-center z-10`}
              >
                {index < activeIndex && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                )}
              </div>
            </div>

            {/* Conteúdo do evento - sempre à direita no mobile */}
            <div className="md:w-5/12 w-full pl-16 md:pl-4 md:pr-4 md:odd:text-right md:even:ml-auto">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: index === activeIndex ? 1 : (index < activeIndex ? 0.8 : 0.4),
                  x: 0,
                  transition: { delay: 0.2 + index * 0.1 }
                }}
                className={`p-4 bg-white/80 rounded-lg border transition-all duration-300
                  ${index === activeIndex 
                    ? "border-primary shadow-md scale-105 transform ring-2 ring-primary/20" 
                    : "border-primary/10 shadow-sm"}`}
              >
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {event.icon}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(event.date)}
                  </span>
                </div>
                <h3 className="text-lg font-medium mb-1">{event.title}</h3>
                <p className="text-muted-foreground text-sm">{event.description}</p>
              </motion.div>
            </div>
          </motion.div>
        ))}

        {/* Botão de ação - fixo na parte inferior */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 p-4 flex justify-center bg-gradient-to-t from-white via-white/95 to-transparent pt-16 pb-8 z-10"
          variants={itemVariants}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Button onClick={nextEvent} size="lg" className="group shadow-md hover:shadow-lg transition-all duration-300">
            {activeIndex < events.length - 1 ? "Próximo momento" : "Continuar"}
            <motion.span
              className="ml-2 inline-block"
              initial={{ x: 0 }}
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.5 }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default JourneyTimeline;