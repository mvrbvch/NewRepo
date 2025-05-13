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

export default function DashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const { useAllInsights } = useRelationshipInsights();
  const insightsQuery = useAllInsights();
  const today = new Date();
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

  // Filter events for the selected date
  const todayEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date);
      const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
      const formattedSelectedDate =
        formatDateSafely(selectedDate)?.split("T")[0];

      if (!formattedEventDate || !formattedSelectedDate) {
        return false;
      }

      return isSameDay(formattedEventDate, formattedSelectedDate);
    })
    .sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });

  const todayTasks = householdTasks.filter((task) => {
    if (task.frequency !== "daily" && !task.dueDate && !task.completed)
      return false;
    const eventDate = new Date(task.dueDate);
    const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
    const formattedSelectedDate = formatDateSafely(selectedDate)?.split("T")[0];

    if (!formattedEventDate || !formattedSelectedDate) {
      return false;
    } else if (task.frequency === "daily" && !task.dueDate) {
      return task;
    }
    return isSameDay(formattedEventDate, formattedSelectedDate);
  });
  // Filter events for tomorrow
  const tomorrow = addDays(new Date(), 1);
  const tomorrowEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, tomorrow);
    })
    .sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });

  // Filter upcoming tasks
  const upcomingTasks = householdTasks
    .filter((task) => !task.completed)
    .sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date(9999, 11, 31);
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date(9999, 11, 31);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3);

  // Handle previous and next day
  const handlePrevDay = () => {
    setSelectedDate(subDays(selectedDate, 7));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };

  // Navigate to event details
  const handleEventClick = (event: EventType) => {
    if (event.id) {
      navigate(`/calendar?eventId=${event.id}`);
    } else {
      navigate(`/calendar`);
    }
  };

  // Navigate to task details
  const handleTaskClick = (taskId?: number) => {
    if (taskId) {
      navigate(`/tasks?taskId=${taskId}`);
    } else {
      navigate(`/tasks`);
    }
  };

  const getUserById = async (id: number) => {
    const response = await apiRequest("GET", `/api/user/byId/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }
    return response.json();
  };

  useEffect(() => {
    if (user && user.partnerId) {
      getUserById(user.partnerId).then((data) => {
        setPartnerName(data.user);
      });
    }
  }, [user]);

  //Loading
  const isLoading =
    isLoadingEvents || isLoadingTasks || insightsQuery.isLoading;

  return (
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
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                // Count events for this day
                const dayEvents = events.filter((event) => {
                  const eventDate = new Date(event.date);
                  const formattedEventDate =
                    formatDateSafely(eventDate)?.split("T")[0];
                  const formattedSelectedDate =
                    formatDateSafely(day)?.split("T")[0];

                  if (!formattedEventDate || !formattedSelectedDate) {
                    return false;
                  }

                  return isSameDay(formattedEventDate, formattedSelectedDate);
                });

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day)}
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

              {todayEvents.length === 0 || todayTasks.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                  Nenhum evento ou tarefa para este dia
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {todayEvents.map((event) => (
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
                      }`}
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

                  {todayTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={"p-3 rounded-lg cursor-pointer"}
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
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 to-primary/10">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="font-bold text-lg flex">
              <CheckCheck className="mr-2" />
              Tarefas pendentes
            </CardTitle>
            <Button
              variant="secondary"
              className="bg-white hover:bg-white cursor-pointer"
              onClick={() => handleTaskClick()}
            >
              Ver tudo
            </Button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="bg-white/80 rounded-lg p-4 text-center text-gray-500 text-sm">
              Nenhuma tarefa pendente
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/80 p-3 rounded-lg flex items-center cursor-pointer"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.dueDate && (
                      <p className="text-xs text-gray-500">
                        Prazo: {format(new Date(task.dueDate), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              ))}
            </div>
          )}
        </Card> */}

        {/* Tomorrow's Lessons */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Amanhã</h2>
            <Button
              variant="secondary"
              className="bg-white hover:bg-white cursor-pointer"
              onClick={() => navigate("/calendar")}
            >
              Ver tudo
            </Button>
          </div>

          {tomorrowEvents.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
              Nenhum evento programado para amanhã
            </div>
          ) : (
            <div className="space-y-2">
              {tomorrowEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-50 p-3 rounded-lg flex cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="w-10 text-center mr-3">
                    <span className="text-xs font-medium block">
                      {formatTime(event.startTime)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center">
                      <span className="mr-2">{event.emoji || "📅"}</span>
                      {event.title}
                    </h4>
                    {event.location && (
                      <p className="text-xs text-gray-500">{event.location}</p>
                    )}
                  </div>
                </div>
              ))}

              {tomorrowEvents.length > 2 && (
                <div className="text-center text-sm text-primary font-medium">
                  +{tomorrowEvents.length - 2} eventos amanhã
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
      <BottomNavigation />
    </div>
  );
}
