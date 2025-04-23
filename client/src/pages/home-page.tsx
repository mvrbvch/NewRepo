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
import { formatDateSafely } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isSameDay,
} from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  usePushNotifications,
  PushSubscriptionStatus,
} from "@/hooks/use-push-notifications";
import { motion, AnimatePresence } from "framer-motion";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { RippleButton } from "@/components/ui/ripple-button";
import { TransitionComponent } from "@/components/ui/transition-component";

export default function HomePage() {
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const { toast } = useToast();
  const { subscriptionStatus } = usePushNotifications();

  // Fetch events
  const { data: events = [], isLoading } = useQuery<EventType[]>({
    queryKey: ["/api/events"],
  });

  // Mutação para enviar notificação de teste
  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/test");
      if (!res.ok) {
        throw new Error("Falha ao enviar notificação de teste");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notificação de teste enviada",
        description:
          "Uma notificação de teste foi enviada para este dispositivo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao enviar notificação",
        description: error.message,
        variant: "destructive",
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

  // Calcular eventos com base na visualização atual
  const getEventsForCurrentView = () => {
    if (view === "day") {
      // Para visualização diária, apenas eventos do dia selecionado
      return events.filter((event) => {
        const eventDate = new Date(event.date);
        const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
        const formattedSelectedDate = formatDateSafely(
          new Date(selectedDate),
        )?.split("T")[0];

        if (!formattedEventDate || !formattedSelectedDate) {
          return false;
        }

        return isSameDay(formattedEventDate, formattedSelectedDate);
      });
    } else if (view === "week") {
      // Para visualização semanal, eventos da semana selecionada
      const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 0 });

      return events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= start && eventDate <= end;
      });
    } else if (view === "month") {
      // Para visualização mensal, eventos do mês selecionado
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);

      return events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= start && eventDate <= end;
      });
    }

    return [];
  };

  // Obter eventos filtrados com base na visualização atual
  const filteredEvents = getEventsForCurrentView();

  // Filtrar eventos apenas para o dia atual (usado na visualização diária)

  const dailyEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
    const formattedSelectedDate = formatDateSafely(
      new Date(selectedDate),
    )?.split("T")[0];

    if (!formattedEventDate || !formattedSelectedDate) {
      return false;
    }

    console.log(formattedEventDate, formattedSelectedDate);
    return isSameDay(formattedEventDate, formattedSelectedDate);
  });
  // Group events by period for day view
  const morningEvents = dailyEvents.filter(
    (event) => event.period === "morning",
  );
  const afternoonEvents = dailyEvents.filter(
    (event) => event.period === "afternoon",
  );
  const nightEvents = dailyEvents.filter((event) => event.period === "night");

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
    if (view === "day") handlePrevDay();
    else if (view === "week") handlePrevWeek();
    else if (view === "month") handlePrevMonth();
  };

  const handleNext = () => {
    if (view === "day") handleNextDay();
    else if (view === "week") handleNextWeek();
    else if (view === "month") handleNextMonth();
  };

  // Calcular quantos eventos são compartilhados no período atual
  const sharedEventsCount = filteredEvents.filter(
    (event) => event.isShared,
  ).length;

  return (
    <motion.div
      className="flex flex-col"
      style={{ marginBottom: 90 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />

      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <DateNavigation
          date={selectedDate}
          eventCount={filteredEvents.length}
          sharedCount={sharedEventsCount}
          onPrev={handlePrev}
          onNext={handleNext}
          calendarView={view}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <ViewToggle view={view} onChange={setView} onToday={goToToday} />
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "day" && (
          <motion.div
            key="day-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <DayView
              date={selectedDate}
              morningEvents={morningEvents}
              afternoonEvents={afternoonEvents}
              nightEvents={nightEvents}
              isLoading={isLoading}
              onEventClick={handleOpenEventDetails}
            />
          </motion.div>
        )}

        {view === "week" && (
          <motion.div
            key="week-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <WeekView
              date={selectedDate}
              events={events}
              isLoading={isLoading}
              onEventClick={handleOpenEventDetails}
              onDayChange={setSelectedDate}
              onWeekChange={setSelectedDate}
            />
          </motion.div>
        )}

        {view === "month" && (
          <motion.div
            key="month-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <MonthView
              date={selectedDate}
              events={events}
              isLoading={isLoading}
              onEventClick={handleOpenEventDetails}
              onDayChange={setSelectedDate}
              onMonthChange={setSelectedDate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigation onCreateEvent={handleOpenCreateModal} />

      <CreateEventModal
        isOpen={createModalOpen}
        onClose={handleCloseCreateModal}
        defaultDate={selectedDate}
      />

      <AnimatePresence>
        {selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            isOpen={!!selectedEvent}
            onClose={handleCloseEventDetails}
          />
        )}
      </AnimatePresence>

      {/* Botão de teste de notificação */}
    </motion.div>
  );
}
