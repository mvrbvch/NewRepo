import { useState, useEffect } from "react";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import DateNavigation from "@/components/shared/date-navigation";
import ViewToggle from "@/components/shared/view-toggle";
import DayView from "@/components/calendar/day-view";
import WeekView from "@/components/calendar/week-view";
import MonthView from "@/components/calendar/month-view";
import CreateEventModal from "@/components/calendar/create-event-modal";
import EventDetailsModal from "@/components/calendar/event-details-modal";
import { EventType } from "@/lib/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications, PushSubscriptionStatus } from "@/hooks/use-push-notifications";

export default function HomePage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const { toast } = useToast();
  const { subscriptionStatus } = usePushNotifications();
  
  // Fetch events
  const { data: events = [], isLoading } = useQuery<EventType[]>({
    queryKey: ['/api/events'],
  });
  
  // Mutação para enviar notificação de teste
  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/test');
      if (!res.ok) {
        throw new Error('Falha ao enviar notificação de teste');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Notificação de teste enviada',
        description: 'Uma notificação de teste foi enviada para este dispositivo.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Falha ao enviar notificação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Calcular eventos baseados na visualização atual
  useEffect(() => {
    // Este efeito assegura que a consulta de eventos seja recarregada
    // quando o usuário mudar entre visualizações de dia/semana/mês
    if (events.length > 0) {
      // Podemos adicionar lógica aqui se precisarmos recarregar eventos 
      // baseados na visualização ou intervalo de datas
    }
  }, [view, selectedDate]);
  
  // Filter events for the selected date (usado na visualização diária)
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  // Group events by period for day view
  const morningEvents = filteredEvents.filter(event => event.period === 'morning');
  const afternoonEvents = filteredEvents.filter(event => event.period === 'afternoon');
  const nightEvents = filteredEvents.filter(event => event.period === 'night');
  
  const handleOpenCreateModal = () => {
    setCreateModalOpen(true);
  };
  
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
  };
  
  const handleOpenEventDetails = (event: EventType) => {
    setSelectedEvent(event);
  };
  
  const handleCloseEventDetails = () => {
    setSelectedEvent(null);
  };
  
  // Navegação otimizada usando date-fns
  const handlePrevDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };
  
  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };
  
  const handlePrevWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };
  
  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };
  
  const handlePrevMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };
  
  const handleNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Determinar qual função de navegação usar baseado na visualização atual
  const handlePrev = () => {
    if (view === 'day') handlePrevDay();
    else if (view === 'week') handlePrevWeek();
    else if (view === 'month') handlePrevMonth();
  };
  
  const handleNext = () => {
    if (view === 'day') handleNextDay();
    else if (view === 'week') handleNextWeek();
    else if (view === 'month') handleNextMonth();
  };
  
  const sharedEventsCount = filteredEvents.filter(event => event.isShared).length;
  
  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <DateNavigation 
        date={selectedDate} 
        eventCount={filteredEvents.length}
        sharedCount={sharedEventsCount}
        onPrev={handlePrev}
        onNext={handleNext}
        calendarView={view}
      />
      
      <ViewToggle 
        view={view} 
        onChange={setView} 
        onToday={goToToday}
      />
      
      {view === 'day' && (
        <DayView 
          date={selectedDate}
          morningEvents={morningEvents}
          afternoonEvents={afternoonEvents}
          nightEvents={nightEvents}
          isLoading={isLoading}
          onEventClick={handleOpenEventDetails}
        />
      )}
      
      {view === 'week' && (
        <WeekView 
          date={selectedDate}
          events={events}
          isLoading={isLoading}
          onEventClick={handleOpenEventDetails}
          onDayChange={setSelectedDate}
          onWeekChange={setSelectedDate}
        />
      )}
      
      {view === 'month' && (
        <MonthView 
          date={selectedDate}
          events={events}
          isLoading={isLoading}
          onEventClick={handleOpenEventDetails}
          onDayChange={setSelectedDate}
          onMonthChange={setSelectedDate}
        />
      )}
      
      <BottomNavigation 
        onCreateEvent={handleOpenCreateModal} 
      />
      
      <CreateEventModal 
        isOpen={createModalOpen}
        onClose={handleCloseCreateModal}
        defaultDate={selectedDate}
      />
      
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={handleCloseEventDetails}
        />
      )}
      
      {/* Botão de teste de notificação - apenas em desenvolvimento */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-2 bg-white shadow-md"
          onClick={() => {
            if (subscriptionStatus !== PushSubscriptionStatus.SUBSCRIBED) {
              toast({
                title: 'Notificações não ativadas',
                description: 'Você precisa ativar as notificações primeiro',
                variant: 'destructive',
              });
            } else {
              testNotificationMutation.mutate();
            }
          }}
          disabled={testNotificationMutation.isPending}
        >
          <Bell className="h-4 w-4" />
          {testNotificationMutation.isPending ? 'Enviando...' : 'Testar Notificação'}
        </Button>
      </div>
    </div>
  );
}
