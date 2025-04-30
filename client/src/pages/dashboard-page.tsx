import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDateSafely, formatTime } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { EventType, HouseholdTaskType } from "@/lib/types";
import { isSameDay, format, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import { motion } from "framer-motion";
import { useRelationshipInsights } from "@/hooks/use-relationship-insights";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedList } from "@/components/ui/animated-list";
import { CoupleLoadingAnimation } from "@/components/shared/couple-loading-animation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Heart,
  Search,
  Plus,
  CheckCircle2,
  Trophy,
  Crown,
  Play,
  Circle,
  Timer,
  Star,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const today = new Date();
  const { toast } = useToast();
  const { user } = useAuth();
  const { useAllInsights } = useRelationshipInsights();

  // Dias da semana para exibição no calendário horizontal
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Queries
  const { data: events = [], isLoading: isLoadingEvents } = useQuery<EventType[]>({
    queryKey: ["/api/events"],
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/household/tasks"],
  });

  const { data: partnerData, isLoading: isLoadingPartner } = useQuery({
    queryKey: ["/api/partner"],
    enabled: !!user?.id,
  });

  const insightsQuery = useAllInsights();

  // Formatar a data atual
  const formattedMonth = format(today, "MMMM", { locale: ptBR });
  const formattedMonthCapitalized = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  // Filtra eventos apenas para o dia atual
  const todaysEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return isSameDay(eventDate, today);
  });

  // Ordena eventos por hora de início
  const sortedEvents = [...todaysEvents].sort((a, b) => {
    return (
      new Date(`1970-01-01T${a.startTime}`).getTime() -
      new Date(`1970-01-01T${b.startTime}`).getTime()
    );
  });

  // Filtra tarefas
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  const urgentTasks = pendingTasks.filter((task) => {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return isSameDay(dueDate, today) || isBefore(dueDate, today);
    }
    return false;
  });

  // Cálculo de progresso para gamificação
  const userCompletionRate = user && tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed && t.assignedTo === user.id).length / 
       tasks.filter(t => t.assignedTo === user.id).length) * 100) 
    : 0;

  const partnerCompletionRate = partnerData && tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed && t.assignedTo === partnerData.id).length / 
       tasks.filter(t => t.assignedTo === partnerData.id).length) * 100) 
    : 0;

  // Total de pontos (baseado em tarefas concluídas, cada tarefa vale pontos baseados na prioridade)
  const calculateScore = (userId) => {
    return tasks
      .filter(t => t.completed && t.assignedTo === userId)
      .reduce((total, task) => {
        // Base de 100 pontos por tarefa + bônus por prioridade
        const priorityBonus = task.priority === 2 ? 200 : (task.priority === 1 ? 100 : 0);
        return total + 100 + priorityBonus;
      }, 0);
  };

  const userScore = calculateScore(user?.id);
  const partnerScore = calculateScore(partnerData?.id);

  // Carregando status
  const isLoading = isLoadingEvents || isLoadingTasks || insightsQuery.isLoading || isLoadingPartner;

  // Formata hora do evento
  const formatEventTime = (event) => {
    return `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
  };

  // Formata a data
  const formatDueDate = (date) => {
    if (!date) return "";
    const dueDate = new Date(date);

    if (isSameDay(dueDate, today)) {
      return "Hoje";
    }

    if (isBefore(dueDate, today)) {
      return `Atrasada (${format(dueDate, "dd/MM")})`;
    }

    return format(dueDate, "dd/MM");
  };

  // Determina quem está na liderança para mostrar a coroa
  const userIsLeading = userScore >= partnerScore;

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-slate-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />

      <main className="flex-1 container max-w-md mx-auto px-4 pb-24" style={{ paddingTop: 88 }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <CoupleLoadingAnimation
              text="Carregando seu dashboard..."
              size="md"
              type="dashboard"
            />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Search Bar */}
            <div className="relative mb-2">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input 
                type="text" 
                placeholder="Buscar tarefas, eventos..." 
                className="pl-10 bg-white border-none shadow-sm"
              />
            </div>

            {/* Calendário Horizontal */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-0 pt-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">
                    {formattedMonthCapitalized}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-2">
                <div className="flex space-x-3 overflow-x-auto py-2 scrollbar-hide">
                  {nextDays.map((date, index) => {
                    const isToday = isSameDay(date, today);
                    const hasEvent = events.some(event => 
                      isSameDay(new Date(event.date), date)
                    );

                    return (
                      <TactileFeedback key={index}>
                        <div 
                          className={`flex flex-col items-center justify-center min-w-[60px] rounded-xl p-3 
                            ${isToday ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'}`}
                        >
                          <span className="text-xs font-medium">
                            {format(date, 'EEE', { locale: ptBR }).toUpperCase()}
                          </span>
                          <span className="text-lg font-bold mt-1">
                            {format(date, 'd')}
                          </span>
                          {hasEvent && (
                            <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-white' : 'bg-primary'}`} />
                          )}
                        </div>
                      </TactileFeedback>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Próximo evento compartilhado */}
            {sortedEvents.find(e => e.isShared) && (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-rose-50 to-primary/5 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-3 bg-rose-100 rounded-xl">
                      <Heart className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{sortedEvents.find(e => e.isShared).title}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatEventTime(sortedEvents.find(e => e.isShared))}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 ml-2 bg-white"
                          onClick={() => setLocation(`/calendar?event=${sortedEvents.find(e => e.isShared).id}`)}
                        >
                          <Play className="h-4 w-4 text-primary" />
                        </Button>
                      </div>

                      {sortedEvents.find(e => e.isShared).location && (
                        <div className="mt-2 text-xs flex items-center text-gray-600">
                          <Circle className="h-3 w-3 mr-1 fill-gray-400 stroke-0" />
                          {sortedEvents.find(e => e.isShared).location}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nosso Placar */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center text-lg">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                  Nosso Placar
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-2">
                <div className="space-y-4">
                  {/* Primeiro lugar */}
                  <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl">
                    <div className="flex items-center">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-yellow-400">
                          <div className="bg-primary rounded-full h-full w-full flex items-center justify-center text-white font-bold">
                            {userIsLeading ? user?.name?.charAt(0) : partnerData?.name?.charAt(0)}
                          </div>
                        </Avatar>
                        <div className="absolute -top-1 -right-1">
                          <Crown className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold">
                          {userIsLeading ? user?.name?.split(' ')[0] : partnerData?.name?.split(' ')[0]}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className="h-1.5 w-16 bg-gray-700 rounded-full">
                            <div 
                              className="h-1.5 bg-green-400 rounded-full" 
                              style={{ width: `${userIsLeading ? userCompletionRate : partnerCompletionRate}%` }}
                            />
                          </div>
                          <span className="text-xs ml-2 text-green-400">
                            {userIsLeading ? userCompletionRate : partnerCompletionRate}% concluído
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{userIsLeading ? userScore : partnerScore}</div>
                      <div className="text-xs text-gray-400">pontos</div>
                    </div>
                  </div>

                  {/* Segundo lugar */}
                  <div className="flex items-center justify-between bg-gray-800/30 p-3 rounded-xl">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <div className="bg-gray-600 rounded-full h-full w-full flex items-center justify-center text-white font-bold">
                          {!userIsLeading ? user?.name?.charAt(0) : partnerData?.name?.charAt(0)}
                        </div>
                      </Avatar>
                      <div className="ml-3">
                        <h3 className="font-medium text-sm">
                          {!userIsLeading ? user?.name?.split(' ')[0] : partnerData?.name?.split(' ')[0]}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className="h-1.5 w-16 bg-gray-700 rounded-full">
                            <div 
                              className="h-1.5 bg-blue-400 rounded-full" 
                              style={{ width: `${!userIsLeading ? userCompletionRate : partnerCompletionRate}%` }}
                            />
                          </div>
                          <span className="text-xs ml-2 text-blue-400">
                            {!userIsLeading ? userCompletionRate : partnerCompletionRate}% concluído
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{!userIsLeading ? userScore : partnerScore}</div>
                      <div className="text-xs text-gray-400">pontos</div>
                    </div>
                  </div>

                  {/* Estatísticas do casal */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-gray-800/40 p-3 rounded-xl text-center">
                      <div className="text-xs text-gray-400 mb-1">Tempo Juntos</div>
                      <div className="text-lg font-bold">
                        {events.filter(e => e.isShared).length * 2}h
                      </div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-xl text-center">
                      <div className="text-xs text-gray-400 mb-1">Tarefas Concluídas</div>
                      <div className="text-lg font-bold">
                        {completedTasks.length}/{tasks.length}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próximas Tarefas */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">Tarefas Pendentes</CardTitle>
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      Ver todas
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-3">
                {urgentTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="bg-green-100 p-3 rounded-full mb-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium text-gray-700">Tudo em dia!</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Nenhuma tarefa pendente para hoje
                    </p>
                  </div>
                ) : (
                  <AnimatedList
                    items={urgentTasks.slice(0, 3)}
                    keyExtractor={(task) => task.id}
                    className="space-y-3 mt-2"
                    renderItem={(task) => (
                      <TactileFeedback
                        key={task.id}
                        onClick={() => setLocation(`/tasks?task=${task.id}`)}
                      >
                        <div className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <Checkbox
                            checked={task.completed}
                            className="h-5 w-5 rounded-full"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{task.title}</h4>
                              {task.dueDate && (
                                <div className="flex items-center">
                                  <Timer className="h-3 w-3 mr-1 text-gray-500" />
                                  {isBefore(new Date(task.dueDate), today) ? (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                      {formatDueDate(task.dueDate)}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs">
                                      {formatDueDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {task.priority > 0 && (
                              <div className="mt-1">
                                <Badge
                                  className={`text-[10px] px-1.5 py-0 ${
                                    task.priority === 2
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  <Star className="h-2.5 w-2.5 mr-0.5" />
                                  {task.priority === 2 ? "Alta" : "Média"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </TactileFeedback>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Botão de criação rápida */}
            <div className="fixed bottom-24 right-4 z-10">
              <TactileFeedback>
                <Button
                  className="rounded-full w-14 h-14 bg-primary shadow-lg hover:bg-primary/90"
                  onClick={() => setLocation("/calendar?create=true")}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </TactileFeedback>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </motion.div>
  );
}