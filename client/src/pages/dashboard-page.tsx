import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
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
import { Calendar, Clock, Book, CheckCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
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


export default function DashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const { useAllInsights } = useRelationshipInsights();
  const insightsQuery = useAllInsights();
  const today = new Date();

  // Fetch events data
  const { data: events = [], isLoading: isLoadingEvents } = useQuery<EventType[]>({
    queryKey: ["/api/events"],
  });

  // Fetch household tasks
  const { data: householdTasks = [], isLoading: isLoadingTasks } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/household/tasks"],
  });

  // Calculate week days on component mount or when selected date changes
  useEffect(() => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    setWeekDays(days);
  }, [selectedDate]);

  // Filter events for the selected date
  const todayEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return isSameDay(eventDate, selectedDate);
  }).sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  // Filter events for tomorrow
  const tomorrow = addDays(new Date(), 1);
  const tomorrowEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return isSameDay(eventDate, tomorrow);
  }).sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  // Filter upcoming tasks
  const upcomingTasks = householdTasks
    .filter(task => !task.isCompleted)
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
    navigate(`/calendar?date=${formatDateSafely(new Date(event.date))}`);
  };

  // Navigate to task details
  const handleTaskClick = () => {
    navigate("/household");
  };

  //Loading
  const isLoading = isLoadingEvents || isLoadingTasks || insightsQuery.isLoading;


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-20 pt-2 mt-16">
        {/* Greeting & User Info */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Olá, {user?.name?.split(" ")[0] || ""}
            </h1>
            <p className="text-gray-500 text-sm">
              {format(new Date(), "'Hoje é' EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Weekly Calendar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Minha Agenda</h2>
            <Badge 
              variant="outline" 
              className="hover:bg-primary/5 cursor-pointer"
              onClick={() => navigate("/calendar")}
            >
              Ver tudo
            </Badge>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              // Count events for this day
              const dayEvents = events.filter(event => {
                const eventDate = new Date(event.date);
                return isSameDay(eventDate, day);
              });

              return (
                <div 
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center py-2 cursor-pointer rounded-lg transition-colors
                    ${isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary/10' : 'hover:bg-gray-100'}
                  `}
                >
                  <span className="text-xs font-medium mb-1">
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className={`text-lg font-bold ${isSelected ? 'text-white' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-primary'}`} />
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

            {todayEvents.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                Nenhum evento para este dia
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todayEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg cursor-pointer 
                      ${event.period === 'morning' ? 'bg-orange-50 border-l-2 border-orange-400' : 
                        event.period === 'afternoon' ? 'bg-blue-50 border-l-2 border-blue-400' : 
                        'bg-purple-50 border-l-2 border-purple-400'}`
                    }
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="mr-2 text-xl">{event.emoji || '📅'}</span>
                          <h4 className="font-medium">{event.title}</h4>
                        </div>
                        {event.location && (
                          <p className="text-xs text-gray-500 mb-1">{event.location}</p>
                        )}
                      </div>
                      <div className="text-xs font-medium text-gray-600 bg-white/80 px-2 py-1 rounded">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/20 to-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Tarefas pendentes</h2>
            <Badge 
              variant="outline" 
              className="bg-white hover:bg-white cursor-pointer"
              onClick={handleTaskClick}
            >
              Ver tudo
            </Badge>
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
                  onClick={handleTaskClick}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{task.name}</h4>
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
        </Card>

        {/* Tomorrow's Lessons */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Amanhã</h2>
            <Badge 
              variant="outline" 
              className="hover:bg-primary/5 cursor-pointer"
              onClick={() => navigate("/calendar")}
            >
              Ver agenda
            </Badge>
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
                    <span className="text-xs font-medium block">{formatTime(event.startTime)}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center">
                      <span className="mr-2">{event.emoji || '📅'}</span>
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