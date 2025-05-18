import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { EventType, HouseholdTaskType } from "@/lib/types";
import { formatDateSafely, formatTime } from "@/lib/utils";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Book,
  CheckCircle,
  ArrowRight,
  BookHeart,
  HeartPulse,
  Heart,
  SendIcon,
  CheckCheck,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useRelationshipInsights } from "@/hooks/use-relationship-insights";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { CoupleLoadingAnimation } from "@/components/shared/couple-loading-animation";
import { Avatar } from "@/components/ui/avatar";
import { Trophy, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedList } from "@/components/ui/animated-list";
import { AlertCircle, Timer, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { IconButton } from "@mui/material";
import { UpcomingEventBanner } from "@/components/new-ui/UpcomingEventBanner";
import Greeting from "@/components/shared/Greeting";
import RelationshipTip from "@/components/shared/RelationshipTip";
import { useBiometricAuth } from "@/hooks/use-biometric-auth__";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const { useAllInsights } = useRelationshipInsights();
  const insightsQuery = useAllInsights();
  const today = new Date();
  const { loginWithBiometric, registerBiometric } = useBiometricAuth();
  const [username, setUsername] = useState("");
  const [partnerName, setPartnerName] = useState<string | null>("");

  // Fetch events data
  const { data: events = [], isLoading: isLoadingEvents } = useQuery<
    EventType[]
  >({
    queryKey: ["/api/events"],
  });

  // Fetch household tasks
  const { data: householdTasks = [], isLoading: isLoadingTasks } = useQuery<
    HouseholdTaskType[]
  >({
    queryKey: ["/api/tasks"],
  });

  // Calculate week days on component mount or when selected date changes
  useEffect(() => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    setWeekDays(days);
  }, [selectedDate]);

  // Filter events for selected date
  const selectedDayEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
    const formattedSelectedDate = formatDateSafely(selectedDate)?.split("T")[0];

    return isSameDay(formattedEventDate, formattedSelectedDate);
  });

  // Filter tasks for selected date
  const selectedDayTasks = householdTasks
    .filter((task) => {
      if (task.frequency !== "daily" && !task.dueDate && !task.completed)
        return false;
      if (task.frequency === "daily" && !task.dueDate) return true;
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), selectedDate);
    })
    .sort((a, b) => {
      return a.assignedTo !== null && b.assignedTo === null
        ? -1
        : a.assignedTo === null && b.assignedTo !== null
          ? 1
          : 0;
    });

  // Filter events for tomorrow
  const tomorrow = addDays(today, 1);
  const tomorrowEvents = events
    .filter((event) => isSameDay(new Date(event.date), tomorrow))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Filter upcoming tasks

  // Handle previous and next week
  const handlePrevDay = () => {
    setSelectedDate(subDays(selectedDate, 7));
  };
  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };

  // Navigation
  const handleEventClick = (event: EventType) => {
    if (event.id) {
      navigate(`/calendar?eventId=${event.id}`);
    } else {
      navigate(`/calendar`);
    }
  };
  const handleTaskClick = (taskId?: number) => {
    if (taskId) {
      navigate(`/tasks?taskId=${taskId}`);
    } else {
      navigate(`/tasks`);
    }
  };

  // Get partner name
  const getUserById = async (id: number) => {
    const response = await apiRequest("GET", `/api/user/byId/${id}`);
    if (!response.ok) throw new Error("Failed to fetch user data");
    return response.json();
  };

  useEffect(() => {
    if (user && user.partnerId) {
      getUserById(user.partnerId).then((data) => {
        setPartnerName(data.user);
      });
    }
  }, [user]);

  useEffect(() => {
    setTimeout(() => {
      if (user) setSelectedDate(new Date());
    }, 1000);
  }, [user]);

  const isLoading =
    isLoadingEvents || isLoadingTasks || insightsQuery.isLoading;

  return !isLoading ? (
    <div className="flex flex-col min-h-screen bg-gray-50 mb-10 scroll-id">
      <main
        className="flex-1 max-w-lg mx-auto w-full px-4 pt-2"
        style={{ marginTop: 120 }}
      >
        <Greeting
          user={user?.name?.split(" ")[0] || ""}
          partnerName={partnerName?.split(" ")[0] || ""}
        />
        <RelationshipTip
          title="Construindo juntos"
          description="Pequenos ajustes diários fortalecem nossa parceria. Da rotina à comunicação, cultivamos amor com atenção aos detalhes."
        />
      </main>
      <UpcomingEventBanner events={events} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-20 pt-2">
        {/* Weekly Calendar */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-love" />
                <CardTitle className="text-lg">Nossa Agenda</CardTitle>
              </div>
              <Button
                onClick={() => navigate("/calendar")}
                variant="secondary"
                size="sm"
              >
                Ver tudo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day, index) => {
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDate);

                // Eventos do dia
                const dayEvents = events.filter((event) => {
                  const eventDate = new Date(event.date);
                  const formattedEventDate =
                    formatDateSafely(eventDate)?.split("T")[0];
                  const formattedSelectedDate =
                    formatDateSafely(day)?.split("T")[0];

                  return isSameDay(formattedEventDate, formattedSelectedDate);
                });
                // Tarefas do dia
                const dayTasks = householdTasks.filter((task) => {
                  if (
                    task.frequency !== "daily" &&
                    !task.dueDate &&
                    !task.completed
                  )
                    return false;
                  if (task.frequency === "daily" && !task.dueDate) return true;
                  if (!task.dueDate) return false;
                  return isSameDay(new Date(task.dueDate), day);
                });

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedDate(day);
                      window.document
                        .getElementsByClassName("scroll-top")[0]
                        .scroll({ top: 0, behavior: "smooth" });
                    }}
                    className={`flex flex-col items-center py-2 cursor-pointer rounded-lg transition-colors border border-primary/20 
                  ${isSelected ? "bg-primary text-white" : isToday ? "bg-primary/10" : "hover:bg-gray-100"}
                `}
                  >
                    <span className="text-xs font-medium mb-1">
                      {format(new Date(day), "eee", { locale: ptBR })
                        .trim()
                        .substring(0, 3)}
                    </span>
                    <span
                      className={`text-lg font-bold ${isSelected ? "text-white" : ""}`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <div
                        className={`w-1 h-1 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-primary"}`}
                      />
                    )}
                    {dayTasks.length > 0 && (
                      <div
                        className={`w-1 h-1 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-purple-400"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h3>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handlePrevDay}
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleNextDay}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {selectedDayEvents.length === 0 &&
              selectedDayTasks.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                  Nenhum evento ou tarefa para este dia
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scroll-top">
                  {selectedDayEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg cursor-pointer 
                      ${
                        event.period === "morning"
                          ? "bg-orange-50 border-l-2 border-orange-400"
                          : event.period === "afternoon"
                            ? "bg-blue-50 border-l-2 border-blue-400"
                            : "bg-purple-50 border-l-2 border-purple-400"
                      }
                    `}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="mr-2 text-xl">
                              {event.emoji || "📅"}
                            </span>
                            <h4 className="font-medium">{event.title}</h4>
                          </div>
                          {event.location && (
                            <p className="text-xs text-gray-500 mb-1">
                              Onde? {event.location}
                            </p>
                          )}
                        </div>
                        <div className="text-xs font-medium text-gray-600 bg-white/80 px-2 py-1 rounded">
                          {formatTime(event.startTime)} -{" "}
                          {formatTime(event.endTime)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {selectedDayTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={"p-3 rounded-lg cursor-pointer bg-primary/5"}
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.dueDate && (
                            <p className="text-xs text-gray-500">
                              Prazo:{" "}
                              {format(new Date(task.dueDate), "dd/MM/yyyy")}
                            </p>
                          )}
                          {task.frequency === "daily" && (
                            <p className="text-xs/3 text-gray-500">
                              Tarefa diária
                            </p>
                          )}
                          {task.assignedTo === null ? (
                            <span className="text-xs text-gray-600">
                              Em conjunto{" "}
                              {partnerName?.split(" ")[0] || "parceiro"} e{" "}
                              {user?.name?.split(" ")[0] || "você"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">
                              {task.assignedTo === user?.id
                                ? `Atribuida para você`
                                : `Atribuida para ${partnerName?.split(" ")[0] || "parceiro"}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNavigation />
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <CoupleLoadingAnimation />
      <h2 className="text-lg font-semibold text-gray-700 mt-4">
        Carregando informações...
      </h2>
    </div>
  );
}
