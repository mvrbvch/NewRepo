import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { formatDateSafely, formatTime } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { EventType, HouseholdTaskType } from "@/lib/types";
import { isSameDay, format, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import { motion } from "framer-motion";
import { useRelationshipInsights } from "@/hooks/use-relationship-insights";
import { useRelationshipTips } from "@/hooks/use-relationship-tips";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AnimatedList } from "@/components/ui/animated-list";
import { CoupleLoadingAnimation } from "@/components/shared/couple-loading-animation";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  Heart,
  Lightbulb,
  Plus,
  ArrowRight,
  Bell,
  LayoutDashboard,
  Check,
  CheckCircle,
  Coffee,
  MessageSquare,
  Sparkles,
  CalendarClock,
  Home,
  Star,
  AlertCircle,
  Info,
} from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const today = new Date();
  const { toast } = useToast();
  const { user } = useAuth();
  const { useAllInsights } = useRelationshipInsights();
  const { useUserTips } = useRelationshipTips();

  // Formatando a data atual
  const formattedToday = format(today, "EEEE, d 'de' MMMM", { locale: ptBR });
  const formattedTodayCapitalized =
    formattedToday.charAt(0).toUpperCase() + formattedToday.slice(1);

  // Queries
  const { data: events = [], isLoading: isLoadingEvents } = useQuery<
    EventType[]
  >({
    queryKey: ["/api/events"],
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<
    HouseholdTaskType[]
  >({
    queryKey: ["/api/household/tasks"],
  });

  const insightsQuery = useAllInsights();
  const tipsQuery = useUserTips();

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

  // Filtra tarefas para hoje
  const pendingTasks = tasks.filter((task) => !task.completed);
  const urgentTasks = pendingTasks.filter((task) => {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return isSameDay(dueDate, today) || isBefore(dueDate, today);
    }
    return false;
  });

  const pendingTasksToday = pendingTasks.filter((task) => {
    if (task.dueDate) {
      return isSameDay(new Date(task.dueDate), today);
    }
    return false;
  });

  // Pega os insights mais recentes
  const recentInsights = insightsQuery.data?.slice(0, 1) || [];
  const recentTips = tipsQuery.data?.slice(0, 1) || [];

  // Filtra eventos compartilhados para o próximo evento do casal
  const nextCoupleEvent = sortedEvents.find((event) => event.isShared);

  // Carregando status
  const isLoading =
    isLoadingEvents ||
    isLoadingTasks ||
    insightsQuery.isLoading ||
    tipsQuery.isLoading;

  // Formata hora do evento
  const formatEventTime = (event: EventType) => {
    return `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
  };

  // Formata a data de vencimento da tarefa
  const formatDueDate = (date: string | Date) => {
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

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />

      <main className="flex-1 container px-4 pb-24" style={{ paddingTop: 98 }}>
        {/* Cabeçalho com saudação e data */}
        <div className="mb-6 mt-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {user?.name?.split(" ")[0] || ""}!
          </h1>
          <p className="text-muted-foreground">{formattedTodayCapitalized}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <CoupleLoadingAnimation
              text="Carregando seu dashboard..."
              size="md"
              type="dashboard"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo do dia */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <LayoutDashboard className="h-5 w-5 mr-2 text-primary" />
                  Resumo do seu dia
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <div className="flex items-center justify-between flex-wrap gap-2 mt-2 mb-1">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="ml-2 text-sm font-medium">Eventos</span>
                    <Badge variant="outline" className="ml-2">
                      {todaysEvents.length}
                    </Badge>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-amber-100 p-1.5 rounded-full">
                      <Home className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="ml-2 text-sm font-medium">Tarefas</span>
                    <Badge variant="outline" className="ml-2">
                      {pendingTasksToday.length}
                    </Badge>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-rose-100 p-1.5 rounded-full">
                      <Heart className="h-4 w-4 text-rose-600" />
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      Compartilhado
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {todaysEvents.filter((e) => e.isShared).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próximo evento importante */}
            {nextCoupleEvent && (
              <Card className="overflow-hidden border-primary/30 shadow-sm">
                <div className="bg-gradient-to-r from-primary/10 to-rose-500/10 px-6 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-rose-500 mr-2" />
                      <h3 className="font-medium text-primary">
                        Próximo momento a dois
                      </h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-white/80 text-primary text-xs"
                    >
                      {formatEventTime(nextCoupleEvent)}
                    </Badge>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-2xl mr-2">
                      {nextCoupleEvent.emoji || "❤️"}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {nextCoupleEvent.title}
                      </h3>
                      {nextCoupleEvent.location && (
                        <p className="text-sm text-gray-600">
                          {nextCoupleEvent.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-white">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between hover:bg-primary/5"
                    onClick={() => setLocation("/calendar")}
                  >
                    <span>Ver agenda completa</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Tarefas para hoje */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Home className="h-5 w-5 mr-2 text-amber-600" />
                    Tarefas para hoje
                  </CardTitle>
                  <Link href="/household">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -mr-2"
                    >
                      <span className="text-xs">Ver todas</span>
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {urgentTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="bg-green-100 p-3 rounded-full mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium text-gray-700">
                      Nenhuma tarefa pendente para hoje
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Seu dia está livre de compromissos domésticos!
                    </p>
                  </div>
                ) : (
                  <AnimatedList
                    items={urgentTasks.slice(0, 3)}
                    keyExtractor={(task) => task.id}
                    className="space-y-3 mt-3"
                    renderItem={(task) => (
                      <TactileFeedback
                        key={task.id}
                        onClick={() =>
                          setLocation(`/household?task=${task.id}`)
                        }
                      >
                        <div className="flex items-start p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                          <div className="mt-0.5 flex-shrink-0 mr-3">
                            <Checkbox
                              checked={task.completed}
                              className="h-5 w-5 rounded-sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-medium text-gray-800">
                                {task.title}
                              </h4>
                              {task.dueDate && (
                                <div className="text-xs flex items-center">
                                  <Clock className="h-3 w-3 mr-1 text-gray-500 flex-shrink-0" />
                                  {isBefore(new Date(task.dueDate), today) ? (
                                    <Badge
                                      variant="destructive"
                                      className="px-2 py-0 h-4 text-[10px]"
                                    >
                                      <AlertCircle size={10} className="mr-1" />
                                      {formatDueDate(task.dueDate)}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                                      {formatDueDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {task.priority > 0 && (
                              <div className="mt-1">
                                <Badge
                                  className={`text-[10px] px-2 py-0 ${
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

                {urgentTasks.length > 3 && (
                  <div className="mt-2 text-center">
                    <Link href="/household">
                      <Button variant="link" size="sm" className="text-xs">
                        Ver mais {urgentTasks.length - 3} tarefas pendentes
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agenda do dia */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Agenda de hoje
                  </CardTitle>
                  <Link href="/calendar">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -mr-2"
                    >
                      <span className="text-xs">Ver calendário</span>
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {sortedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                      <Coffee className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-700">
                      Nenhum evento para hoje
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Seu dia está livre de compromissos na agenda!
                    </p>
                  </div>
                ) : (
                  <AnimatedList
                    items={sortedEvents.slice(0, 3)}
                    keyExtractor={(event) => event.id}
                    className="space-y-3 mt-3"
                    renderItem={(event) => (
                      <TactileFeedback
                        key={event.id}
                        onClick={() =>
                          setLocation(`/calendar?event=${event.id}`)
                        }
                      >
                        <div
                          className={`p-3 rounded-md border-l-4 ${
                            event.isShared
                              ? "border-l-rose-400 bg-rose-50/50"
                              : "border-l-blue-400 bg-blue-50/30"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">
                                {event.emoji || "📅"}
                              </span>
                              <div>
                                <h4 className="font-medium">{event.title}</h4>
                                {event.location && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {event.location}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-xs font-medium bg-white px-2 py-1 rounded-full shadow-sm">
                              {formatTime(event.startTime)}
                            </div>
                          </div>
                          <div className="flex items-center mt-2 text-xs">
                            {event.isShared ? (
                              <div className="flex items-center text-rose-600">
                                <Heart className="h-3 w-3 mr-1" />
                                <span>Compartilhado</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <CalendarClock className="h-3 w-3 mr-1" />
                                <span>Evento pessoal</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TactileFeedback>
                    )}
                  />
                )}

                {sortedEvents.length > 3 && (
                  <div className="mt-2 text-center">
                    <Link href="/calendar">
                      <Button variant="link" size="sm" className="text-xs">
                        Ver mais {sortedEvents.length - 3} eventos hoje
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights e dicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Insight mais recente */}
              <Card className="border-[#F27474]/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Lightbulb className="h-5 w-5 mr-2 text-[#F27474]" />
                    Insight recente
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {recentInsights.length > 0 ? (
                    <TactileFeedback
                      onClick={() =>
                        setLocation(`/insights/${recentInsights[0].id}`)
                      }
                    >
                      <div className="bg-[#F27474]/10 p-4 rounded-md mt-2">
                        <h3 className="font-medium text-gray-800 mb-1">
                          {recentInsights[0].title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {recentInsights[0].content.substring(0, 100)}...
                        </p>
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-[#F27474] hover:text-[#F27474]/80 hover:bg-[#F27474]/10 p-0 h-6"
                          >
                            Ler mais
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TactileFeedback>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-4 mt-2">
                      <div className="bg-[#F27474]/20 p-2 rounded-full mb-2">
                        <Sparkles className="h-4 w-4 text-[#F27474]" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Nenhum insight disponível ainda
                      </p>
                      <Link href="/insights">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs text-[#F27474] mt-1"
                        >
                          Gerar insights
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dica de relacionamento */}
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                    Dica para o casal
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {recentTips.length > 0 ? (
                    <TactileFeedback
                      onClick={() => setLocation("/relationship-tips")}
                    >
                      <div className="bg-primary/10 p-4 rounded-md mt-2">
                        <h3 className="font-medium text-gray-800 mb-1">
                          {recentTips[0].title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {recentTips[0].content.substring(0, 100)}...
                        </p>
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 p-0 h-6"
                          >
                            Ver mais dicas
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TactileFeedback>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-4 mt-2">
                      <div className="bg-primary/20 p-2 rounded-full mb-2">
                        <Heart className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Nenhuma dica disponível ainda
                      </p>
                      <Link href="/relationship-tips">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs text-primary mt-1"
                        >
                          Ver dicas
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Seção de notificações recentes */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Bell className="h-5 w-5 mr-2 text-orange-500" />
                    Notificações recentes
                  </CardTitle>
                  <Link href="#">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -mr-2"
                    >
                      <span className="text-xs">Ver todas</span>
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center justify-center text-center py-4 mt-2">
                  <div className="bg-orange-100 p-2 rounded-full mb-2">
                    <Bell className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Todas as notificações foram visualizadas
                  </p>
                </div>
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
