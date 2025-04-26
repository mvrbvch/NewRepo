import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EventType } from "@/lib/types";
import { format, parse, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDateSafely } from "@/lib/utils";
import { motion } from "framer-motion";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { CalendarClock, MapPin, Clock } from "lucide-react";

// Define um intervalo de horas para o dia (geralmente das 7h às 22h)
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

interface TimelineViewProps {
  date: Date;
  events: EventType[];
  isLoading: boolean;
  onEventClick: (event: EventType) => void;
}

export default function TimelineView({
  date,
  events,
  isLoading,
  onEventClick,
}: TimelineViewProps) {
  // Filtrar eventos para a data selecionada
  // Filtrar eventos do dia selecionado usando a mesma lógica do home-page
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
    const formattedSelectedDate = formatDateSafely(date)?.split("T")[0];

    if (!formattedEventDate || !formattedSelectedDate) {
      return false;
    }

    // Verificar se são o mesmo dia com comparação consistente
    return formattedEventDate === formattedSelectedDate;
  });

  // Ordenar eventos por hora de início
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (a.period !== b.period) {
      // Ordenar por período (manhã, tarde, noite)
      const periodOrder = { morning: 1, afternoon: 2, night: 3, allday: 0 };
      return periodOrder[a.period] - periodOrder[b.period];
    }
    
    // Ordenar por hora de início
    return a.startTime.localeCompare(b.startTime);
  });

  // Agrupar eventos por hora
  const eventsByHour: Record<number, EventType[]> = {};
  
  // Inicializar todas as horas com arrays vazios
  HOURS.forEach(hour => {
    eventsByHour[hour] = [];
  });
  
  // Adicionar eventos às suas horas correspondentes
  sortedEvents.forEach(event => {
    if (event.period === 'allday') {
      // Eventos do dia todo vão para uma seção especial
      if (!eventsByHour[0]) {
        eventsByHour[0] = [];
      }
      eventsByHour[0].push(event);
    } else {
      // Converter a hora de string (HH:MM) para número de hora
      const hour = parseInt(event.startTime.split(':')[0], 10);
      if (hour >= HOURS[0] && hour <= HOURS[HOURS.length - 1]) {
        eventsByHour[hour].push(event);
      }
    }
  });

  // Estado para controlar quais marcadores de hora estão expandidos
  const [expandedHours, setExpandedHours] = useState<Record<number, boolean>>({});
  
  // Alternar expansão de uma hora
  const toggleHourExpansion = (hour: number) => {
    setExpandedHours(prev => ({
      ...prev,
      [hour]: !prev[hour]
    }));
  };

  // Expandir automaticamente horas que têm eventos
  useEffect(() => {
    const autoExpand: Record<number, boolean> = {};
    Object.keys(eventsByHour).forEach(hourStr => {
      const hour = parseInt(hourStr, 10);
      if (eventsByHour[hour] && eventsByHour[hour].length > 0) {
        autoExpand[hour] = true;
      }
    });
    setExpandedHours(autoExpand);
  }, [JSON.stringify(eventsByHour)]);

  // Renderizar um evento na timeline
  const renderEvent = (event: EventType) => {
    return (
      <TactileFeedback key={event.id}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => onEventClick(event)}
          className={`
            p-3 rounded-lg mb-2 cursor-pointer 
            ${event.color ? '' : 'bg-primary/10 hover:bg-primary/20'}
          `}
          style={{
            backgroundColor: event.color ? `${event.color}20` : '',
            borderLeft: event.color ? `4px solid ${event.color}` : '4px solid var(--primary)',
          }}
        >
          <div className="flex items-start gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: event.color || 'var(--primary)',
                color: 'white'
              }}
            >
              {event.emoji || event.title[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{event.title}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {event.startTime} - {event.endTime}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{event.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </TactileFeedback>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-pulse space-y-4 w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-view p-2 md:p-4 overflow-y-auto">
      {/* Cabeçalho da data */}
      <div className="mb-4 sticky top-0 bg-background z-10 p-2 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          {isToday(date) ? 'Hoje' : format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h2>
      </div>

      {/* Eventos do dia todo */}
      {eventsByHour[0] && eventsByHour[0].length > 0 && (
        <Card className="mb-4 p-3 bg-primary/5 border-primary/20">
          <h3 className="font-medium text-sm mb-2 text-muted-foreground flex items-center gap-1">
            <Badge variant="outline" className="bg-primary/20 text-primary font-normal">Dia Todo</Badge>
          </h3>
          <div className="space-y-1">
            {eventsByHour[0].map(renderEvent)}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative pl-10 border-l border-gray-200 dark:border-gray-800">
        {HOURS.map((hour) => {
          const hasEvents = eventsByHour[hour] && eventsByHour[hour].length > 0;
          const isExpanded = expandedHours[hour] || false;
          
          return (
            <div key={hour} className="mb-6 relative">
              {/* Marcador de hora */}
              <div 
                className={`
                  absolute -left-[40px] w-6 h-6 rounded-full flex items-center justify-center
                  ${hasEvents ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                `}
                onClick={() => hasEvents && toggleHourExpansion(hour)}
              >
                {hour}
              </div>
              
              {/* Linha do tempo */}
              <div className="absolute -left-[28px] top-3 h-full border-l border-dashed border-gray-200 dark:border-gray-800" />
              
              {/* Conteúdo da hora */}
              <div 
                className={`
                  ml-2 transition-all duration-300
                  ${hasEvents ? 'cursor-pointer' : ''}
                  ${hasEvents && !isExpanded ? 'opacity-70 hover:opacity-100' : ''}
                `}
                onClick={() => hasEvents && toggleHourExpansion(hour)}
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {hour}:00
                </div>
                
                {/* Eventos desta hora */}
                {hasEvents && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 mb-2"
                  >
                    {eventsByHour[hour].map(renderEvent)}
                  </motion.div>
                )}
                
                {/* Quando está colapsado, mostrar apenas contador */}
                {hasEvents && !isExpanded && (
                  <div className="text-xs text-primary font-medium mb-1">
                    {eventsByHour[hour].length} evento{eventsByHour[hour].length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensagem se não houver eventos */}
      {sortedEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <CalendarClock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum evento para hoje</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Você não tem eventos agendados para este dia. Adicione um novo evento para começar.
          </p>
          <Button 
            className="mt-4"
            onClick={() => {
              // Aqui você pode acionar a abertura do modal de novo evento
              // ou redirecionar para a página correspondente
            }}
          >
            Adicionar Evento
          </Button>
        </div>
      )}
    </div>
  );
}