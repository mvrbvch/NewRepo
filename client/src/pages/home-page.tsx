import { useState, useEffect, useRef } from "react";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import DateNavigation from "@/components/shared/date-navigation";
import ViewToggle from "@/components/shared/view-toggle";
import DayView from "@/components/calendar/day-view";
import WeekView from "@/components/calendar/week-view";
import MonthView from "@/components/calendar/month-view";
import TimelineView from "@/components/calendar/timeline-view";
import CreateEventModal from "@/components/calendar/create-event-modal";
import EventDetailsModal from "@/components/calendar/event-details-modal";
import { EventType } from "@/lib/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDateSafely } from "@/lib/utils";
import { useMobile } from "../hooks/use-mobile";
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
import { Bell, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  usePushNotifications,
  PushSubscriptionStatus,
} from "@/hooks/use-push-notifications";
import { motion, AnimatePresence } from "framer-motion";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { RippleButton } from "@/components/ui/ripple-button";
import { TransitionComponent } from "@/components/ui/transition-component";
import { useAuth } from "@/hooks/use-auth";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useSearchParam } from "react-use";

export default function HomePage() {
  const [view, setView] = useState<"day" | "week" | "month" | "timeline">(
    "day"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [biometricDialogOpen, setBiometricDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  const { toast } = useToast();
  const { pushStatus } = usePushNotifications();
  const { user } = useAuth();
  const { isSupported, registerBiometric, isPending } = useBiometricAuth();
  const eventId = useSearchParam("eventId");

  // Fetch events
  const { data: events = [], isLoading } = useQuery<EventType[]>({
    queryKey: ["/api/events"],
  });

  const { data: event = {}, isLoading: eventIsLoading } = useQuery<EventType[]>(
    {
      queryKey: ["event", eventId],
      queryFn: async () => {
        const response = await fetch(`/api/events/${eventId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar evento ${eventId}`);
        }

        return response.json();
      },
      enabled: !!eventId, // Só executa se tiver um ID válido
    }
  );

  useEffect(() => {
    if (!eventIsLoading && event && eventId) {
      setSelectedEvent(event.event);
    }
  }, [eventId, event]);

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
    }
  }, [view, selectedDate]);

  // Calcular eventos com base na visualização atual
  const getEventsForCurrentView = () => {
    if (view === "day" || view === "timeline") {
      // Para visualização diária e timeline, apenas eventos do dia selecionado
      return events.filter((event) => {
        const eventDate = new Date(event.date);
        const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
        const formattedSelectedDate =
          formatDateSafely(selectedDate)?.split("T")[0];

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
    const formattedSelectedDate = formatDateSafely(selectedDate)?.split("T")[0];

    if (!formattedEventDate || !formattedSelectedDate) {
      return false;
    }

    console.log(formattedEventDate, formattedSelectedDate);
    return isSameDay(formattedEventDate, formattedSelectedDate);
  });
  // Group events by period for day view
  const morningEvents = dailyEvents.filter(
    (event) => event.period === "morning"
  );
  const afternoonEvents = dailyEvents.filter(
    (event) => event.period === "afternoon"
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

  // Funções para lidar com biometria
  const handleOpenBiometricDialog = () => {
    setBiometricDialogOpen(true);
  };

  const handleCloseBiometricDialog = () => {
    setBiometricDialogOpen(false);
    setDeviceName("");
  };

  const handleRegisterBiometric = async () => {
    if (!deviceName.trim()) {
      toast({
        title: "Nome do dispositivo necessário",
        description:
          "Por favor, forneça um nome para identificar este dispositivo",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerBiometric(deviceName);

      if (result.success) {
        toast({
          title: "Biometria registrada",
          description:
            "Sua biometria foi registrada com sucesso para login futuro",
        });
        handleCloseBiometricDialog();
      }
    } catch (error) {
      console.error("Erro ao registrar biometria:", error);
    }
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
    if (view === "day" || view === "timeline") handlePrevDay();
    else if (view === "week") handlePrevWeek();
    else if (view === "month") handlePrevMonth();
  };

  const handleNext = () => {
    if (view === "day" || view === "timeline") handleNextDay();
    else if (view === "week") handleNextWeek();
    else if (view === "month") handleNextMonth();
  };

  // Calcular quantos eventos são compartilhados no período atual
  const sharedEventsCount = filteredEvents.filter(
    (event) => event.isShared
  ).length;

  return (
    <motion.div
      className="flex flex-col h-screen scroll-id"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />

      <motion.div
        style={{ marginTop: 98 }}
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
              user={user}
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

        {view === "timeline" && (
          <motion.div
            key="timeline-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <TimelineView
              date={selectedDate}
              events={events}
              isLoading={isLoading}
              onEventClick={handleOpenEventDetails}
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

      {/* Botão de registro biométrico (se suportado) */}

      {/* Diálogo para registrar biometria */}
      <Dialog open={biometricDialogOpen} onOpenChange={setBiometricDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Registrar Biometria
            </DialogTitle>
            <DialogDescription>
              Registre sua impressão digital ou reconhecimento facial para
              acessar o app mais rapidamente nas próximas vezes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Nome do Dispositivo
              </label>
              <Input
                placeholder="Ex: Meu Celular, Notebook Pessoal"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Este nome será usado para identificar este dispositivo nas suas
                configurações
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseBiometricDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterBiometric}
              disabled={isPending || !deviceName.trim()}
              className="flex items-center gap-2"
            >
              {isPending ? (
                "Registrando..."
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  Registrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div style={{ marginBottom: 90 }}></div>
    </motion.div>
  );
}
