import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { HouseholdTaskType, UserType } from "@/lib/types";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  format,
  isToday,
  isThisWeek,
  isThisMonth,
  isAfter,
  isBefore,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import CreateTaskModal from "@/components/household/create-task-modal";
import TaskDetailsModal from "@/components/household/task-details-modal";
import { CoupleLoadingAnimation } from "@/components/shared/couple-loading-animation";
import { AnimatedList } from "@/components/ui/animated-list";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { RippleButton } from "@/components/ui/ripple-button";
import { motion, useAnimation } from "framer-motion";
import {
  Loader2,
  Calendar as CalendarIcon,
  Check,
  Clock,
  AlertCircle,
  User as UserIcon,
  Repeat,
  CalendarDays,
  CalendarClock,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TaskCompletionCelebration, QuickTaskCelebration } from "@/components/household/task-completion-celebration";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Componente de Pull to Refresh
function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const MAX_PULL_DISTANCE = 200; // Aumentado de 80 para 120 pixels

  // Também podemos ajustar o limiar para ativar o refresh
  const ACTIVATION_THRESHOLD = MAX_PULL_DISTANCE * 0.5; // 50% da distância máxima

  const handleTouchStart = (e: React.TouchEvent) => {
    // Só ativa o pull to refresh se estiver no topo da página
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;

    currentY.current = e.touches[0].clientY;
    const pullDistance = Math.max(
      0,
      Math.min(currentY.current - startY.current, MAX_PULL_DISTANCE)
    );

    if (pullDistance > 0) {
      // Prevenir o comportamento padrão de scroll quando estamos puxando
      e.preventDefault();
      controls.set({
        y: pullDistance,
        opacity: pullDistance / MAX_PULL_DISTANCE,
      });
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    const pullDistance = currentY.current - startY.current;

    if (pullDistance >= ACTIVATION_THRESHOLD) {
      // Puxou o suficiente para ativar o refresh
      setRefreshing(true);
      await controls.start({ y: MAX_PULL_DISTANCE / 2, opacity: 1 });

      try {
        await onRefresh();
      } catch (error) {
        console.error("Erro ao atualizar:", error);
      } finally {
        setRefreshing(false);
      }
    }

    // Animar de volta à posição original
    await controls.start({
      y: 0,
      opacity: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    });
    setIsPulling(false);
  };

  return (
    <div
      className="flex-1 overflow-y-auto relative"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none"
        animate={controls}
        initial={{ y: 0, opacity: 0 }}
      >
        <div className="bg-primary-light/30 rounded-full p-3 mt-2">
          {refreshing ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <ChevronDown className="h-6 w-6 text-primary" />
          )}
        </div>
      </motion.div>

      {children}
    </div>
  );
}

export default function HouseholdTasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HouseholdTaskType | null>(
    null
  );
  const [groupByFrequency, setGroupByFrequency] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      daily: true,
      weekly: true,
      monthly: true,
      once: true,
    }
  );
  
  // Celebration animation state
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTaskTitle, setCompletedTaskTitle] = useState('');
  const [taskStreak, setTaskStreak] = useState(0);
  
  // Track completed tasks to calculate streaks
  const [recentlyCompletedTasks, setRecentlyCompletedTasks] = useState<number[]>([]);

  // Busca todas as tarefas do usuário
  const {
    data: tasks = [],
    isLoading,
    refetch: refetchTasks,
  } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/tasks"],
  });

  // Busca tarefas do parceiro (se existir)
  const { data: partnerTasks = [], refetch: refetchPartnerTasks } = useQuery<
    HouseholdTaskType[]
  >({
    queryKey: ["/api/partner-tasks"],
    enabled: !!user?.partnerId, // Somente ativa se o usuário tiver um parceiro
  });

  // Estado para controlar a animação rápida
  const [showQuickCelebration, setShowQuickCelebration] = useState(false);
  const [quickCelebrationTask, setQuickCelebrationTask] = useState<string>('');
  
  // Mutação para marcar tarefa como concluída/pendente
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({
      id,
      completed,
    }: {
      id: number;
      completed: boolean;
    }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}/complete`, {
        completed,
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-tasks"] });
      
      // Mostrar mensagem de sucesso e celebração simples quando marcar como concluída
      if (variables.completed) {
        // Encontrar o título da tarefa que foi concluída
        const task = tasks.find(t => t.id === variables.id);
        if (task) {
          setQuickCelebrationTask(task.title);
        }
        // Mostrar celebração rápida para conclusões fora da tela de detalhes
        setShowQuickCelebration(true);
        setTimeout(() => {
          setShowQuickCelebration(false);
        }, 1800);
      } else {
        // Apenas mostrar toast para desmarcar como concluído
        toast({
          title: "Tarefa atualizada",
          description: "O status da tarefa foi atualizado com sucesso.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir tarefa
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-tasks"] });
      setSelectedTask(null);
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir tarefa",
        description: "Não foi possível excluir a tarefa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Filtrar tarefas baseado na aba ativa
  const getFilteredTasks = () => {
    let filteredTasks: HouseholdTaskType[] = [];

    switch (activeTab) {
      case "all":
        filteredTasks = [...tasks];
        break;
      case "pending":
        filteredTasks = tasks.filter((task) => !task.completed);
        break;
      case "completed":
        filteredTasks = tasks.filter((task) => task.completed);
        break;
      case "partner":
        filteredTasks = [...partnerTasks];
        break;
    }

    // Ordenar tarefas: primeiro por status (pendentes antes das concluídas), 
    // em seguida por prioridade (alta para baixa) e finalmente por data
    return filteredTasks.sort((a, b) => {
      // Se uma tarefa está completa e a outra não, a pendente vem primeiro
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      // Se ambas têm o mesmo status de conclusão, ordenar por prioridade (alta para baixa)
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Ordem decrescente: 2 (alta) vem antes de 0 (baixa)
      }
      
      // Se ambas têm a mesma prioridade, ordenar por data de vencimento
      if (a.dueDate && b.dueDate) {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      }

      // Se apenas uma tem data de vencimento, ela vem primeiro
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // Se nenhuma tem data de vencimento, manter a ordem original
      return 0;
    });
  };

  // Função auxiliar para formatação amigável de datas
  const getFormattedDueDate = (dueDate: string | Date) => {
    const date = new Date(dueDate);
    const today = new Date();

    if (isToday(date)) {
      return "Hoje";
    } else if (isToday(addDays(date, -1))) {
      return "Amanhã";
    } else if (isBefore(date, today)) {
      return `Atrasada: ${format(date, "dd/MM/yyyy", { locale: ptBR })}`;
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      return format(date, "EEEE", { locale: ptBR });
    } else {
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    }
  };

  // Agrupar tarefas por frequência
  const groupedTasks = useMemo(() => {
    const filteredTasks = getFilteredTasks();

    if (!groupByFrequency) {
      return { ungrouped: filteredTasks };
    }

    return filteredTasks.reduce(
      (acc, task) => {
        const frequency = task.frequency || "once";
        if (!acc[frequency]) {
          acc[frequency] = [];
        }
        acc[frequency].push(task);
        return acc;
      },
      {} as Record<string, HouseholdTaskType[]>
    );
  }, [tasks, partnerTasks, activeTab, groupByFrequency]);

  // Função para atualizar os dados
  const handleRefresh = async () => {
    toast({
      title: "Atualizando...",
      description: "Buscando as tarefas mais recentes.",
      duration: 2000,
    });

    await refetchTasks();
    if (user?.partnerId) {
      await refetchPartnerTasks();
    }
  };

  const handleOpenCreateModal = () => {
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
  };

  const handleOpenTaskDetails = (task: HouseholdTaskType) => {
    setSelectedTask(task);
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
  };

  const handleToggleTaskComplete = (task: HouseholdTaskType) => {
    // Only trigger celebration if marking as completed (not when uncompleting)
    if (!task.completed) {
      // Set the task title for the celebration message
      setCompletedTaskTitle(task.title);
      
      // Calculate streak (counting this task)
      const updatedRecentlyCompleted = [...recentlyCompletedTasks];
      // Add this task ID if not already in the list
      if (!updatedRecentlyCompleted.includes(task.id)) {
        updatedRecentlyCompleted.push(task.id);
        setRecentlyCompletedTasks(updatedRecentlyCompleted);
      }
      
      // Calculate streak (limit to last 24 hours for consecutive tasks)
      const streak = Math.min(updatedRecentlyCompleted.length, 10); // Cap at 10 for UI purposes
      setTaskStreak(streak);
      
      // Show the celebration animation
      setShowCelebration(true);
      
      // Auto-hide celebration after animation completes
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }
    
    toggleCompleteMutation.mutate({
      id: task.id,
      completed: !task.completed,
    });
  };

  const handleDeleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const getFrequencyText = (frequency: string): string => {
    switch (frequency) {
      case "once":
        return "Uma vez";
      case "daily":
        return "Diária";
      case "weekly":
        return "Semanal";
      case "monthly":
        return "Mensal";
      default:
        return frequency;
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return <Repeat className="h-4 w-4 text-primary flex-shrink-0" />;
      case "weekly":
        return <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />;
      case "monthly":
        return <CalendarClock className="h-4 w-4 text-primary flex-shrink-0" />;
      default:
        return <Clock className="h-4 w-4 text-primary flex-shrink-0" />;
    }
  };

  // Alternar expansão de um grupo
  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // Renderiza um card de tarefa
  const renderTaskCard = (task: HouseholdTaskType) => {
    return (
      <TactileFeedback scale={0.98} onClick={() => handleOpenTaskDetails(task)}>
        <Card
          className={`p-4 relative ${
            task.completed
              ? "bg-gray-50 border-gray-200"
              : "bg-white hover:bg-primary-light/10 border-primary-light"
          } shadow-sm hover:shadow-md transition-all`}
        >
          <div className="flex items-start gap-4">
            <motion.div
              className="mt-1 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTaskComplete(task);
              }}
              whileTap={{ scale: 0.8 }}
            >
              <Checkbox
                checked={task.completed}
                className={`h-5 w-5 rounded-sm ${
                  !task.completed
                    ? "border-primary hover:border-primary-dark"
                    : "text-green-600"
                }`}
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3
                  className={`font-semibold text-lg break-words ${
                    task.completed ? "line-through text-gray-500" : "text-dark"
                  }`}
                >
                  {task.title}
                </h3>
                {task.frequency && task.frequency !== "once" && (
                  <div className="flex items-center text-xs bg-primary-light/30 text-primary-dark px-2 py-1 rounded-full font-medium flex-shrink-0">
                    {getFrequencyIcon(task.frequency)}
                    <span className="ml-1">
                      {getFrequencyText(task.frequency)}
                    </span>
                  </div>
                )}
              </div>

              {task.description && (
                <p
                  className={`text-sm mt-2 break-words ${
                    task.completed ? "text-gray-500" : "text-medium"
                  }`}
                >
                  {task.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {task.dueDate && (
                  <div className="text-xs flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1 text-gray-500 flex-shrink-0" />
                    {isBefore(new Date(task.dueDate), new Date()) &&
                    !task.completed ? (
                      <Badge
                        variant="destructive"
                        className="px-2 py-0.5 h-5 flex items-center gap-1 font-medium"
                      >
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span className="truncate">
                          {getFormattedDueDate(task.dueDate)}
                        </span>
                      </Badge>
                    ) : (
                      <span
                        className={`${
                          task.completed
                            ? "text-gray-500 bg-gray-100"
                            : "text-dark font-medium bg-primary-light/20"
                        } px-2 py-0.5 rounded-full truncate`}
                      >
                        {getFormattedDueDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                )}

                {task.completed ? (
                  <div className="text-xs flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                    <Check className="h-3 w-3 mr-1 flex-shrink-0" />
                    Concluída
                  </div>
                ) : (
                  task.assignedTo &&
                  task.assignedTo === user?.partnerId && (
                    <div className="text-xs flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                      <UserIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      Atribuída ao parceiro
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Card>
      </TactileFeedback>
    );
  };

  // Renderiza uma seção de tarefas agrupadas
  const renderTaskGroup = (frequency: string, tasks: HouseholdTaskType[]) => {
    if (!tasks || tasks.length === 0) return null;

    const isExpanded = expandedGroups[frequency] !== false;

    let title = "Tarefas";
    let icon = <Clock className="h-5 w-5" />;

    switch (frequency) {
      case "daily":
        title = "Tarefas Diárias";
        icon = <Repeat className="h-5 w-5" />;
        break;
      case "weekly":
        title = "Tarefas Semanais";
        icon = <CalendarDays className="h-5 w-5" />;
        break;
      case "monthly":
        title = "Tarefas Mensais";
        icon = <CalendarClock className="h-5 w-5" />;
        break;
      case "once":
        title = "Tarefas Únicas";
        icon = <Clock className="h-5 w-5" />;
        break;
    }

    return (
      <Collapsible
        open={isExpanded}
        onOpenChange={() => toggleGroupExpansion(frequency)}
        className="mb-6 border border-gray-100 rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <div className="text-primary">{icon}</div>
            <h3 className="font-semibold text-primary-dark">{title}</h3>
            <Badge variant="outline" className="ml-1">
              {tasks.length.toString()}
            </Badge>
          </div>
          <div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            <AnimatedList
              items={tasks}
              keyExtractor={(task) => task.id}
              staggerDelay={0.05}
              className="space-y-4"
              renderItem={(task) => renderTaskCard(task)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex items-center justify-between p-4 bg-primary-light border-b border-primary-light">
        <h2 className="text-xl font-semibold text-primary-dark">
          Minhas Tarefas
        </h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visualização</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setGroupByFrequency(true)}
                  className={groupByFrequency ? "bg-primary-light/20" : ""}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <span>Agrupar por frequência</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setGroupByFrequency(false)}
                  className={!groupByFrequency ? "bg-primary-light/20" : ""}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Lista simples</span>
                </DropdownMenuItem>
                
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        // Add a test task completion
                        setCompletedTaskTitle('Teste de tarefa');
                        setTaskStreak(Math.floor(Math.random() * 10) + 1);
                        setShowCelebration(true);
                        // Auto-hide after a few seconds
                        setTimeout(() => setShowCelebration(false), 3000);
                      }}
                      className="text-amber-600"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      <span>Testar Celebração</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleOpenCreateModal}
            variant="default"
            size="sm"
            className="flex items-center gap-1 bg-primary-dark hover:bg-primary text-white transition-colors"
          >
            <span className="text-lg">+</span> Nova Tarefa
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1"
      >
        <TabsList className="grid grid-cols-4 mx-4 bg-gray-50 border border-gray-100 p-1 mt-2">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Todas
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Pendentes
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Concluídas
          </TabsTrigger>
          <TabsTrigger
            value="partner"
            disabled={!user?.partnerId}
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Parceiro
          </TabsTrigger>
        </TabsList>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="mt-4 pb-16 px-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <CoupleLoadingAnimation
                  type="tasks"
                  text="Carregando tarefas domésticas..."
                  size="lg"
                />
              </div>
            ) : (
              <>
                {groupByFrequency ? (
                  // Visualização agrupada por frequência
                  <>
                    {renderTaskGroup("daily", groupedTasks.daily || [])}
                    {renderTaskGroup("weekly", groupedTasks.weekly || [])}
                    {renderTaskGroup("monthly", groupedTasks.monthly || [])}
                    {renderTaskGroup("once", groupedTasks.once || [])}

                    {Object.keys(groupedTasks).length === 0 && (
                      <motion.div
                        className="flex flex-col items-center justify-center h-48 text-gray-500"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>Nenhuma tarefa encontrada</p>
                        <RippleButton
                          variant="link"
                          onClick={handleOpenCreateModal}
                          className="mt-2"
                        >
                          Criar uma nova tarefa
                        </RippleButton>
                      </motion.div>
                    )}
                  </>
                ) : (
                  // Visualização em lista simples
                  <>
                    {groupedTasks.ungrouped &&
                    groupedTasks.ungrouped.length > 0 ? (
                      <AnimatedList
                        items={groupedTasks.ungrouped}
                        keyExtractor={(task) => task.id}
                        staggerDelay={0.05}
                        className="space-y-4"
                        renderItem={(task) => renderTaskCard(task)}
                      />
                    ) : (
                      <motion.div
                        className="flex flex-col items-center justify-center h-48 text-gray-500"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>Nenhuma tarefa encontrada</p>
                        <RippleButton
                          variant="link"
                          onClick={handleOpenCreateModal}
                          className="mt-2"
                        >
                          Criar uma nova tarefa
                        </RippleButton>
                      </motion.div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </PullToRefresh>
      </Tabs>

      <BottomNavigation onCreateEvent={handleOpenCreateModal} />

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={handleCloseCreateModal}
      />

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={handleCloseTaskDetails}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleTaskComplete}
        />
      )}
      
      {/* Task completion celebration animation */}
      <TaskCompletionCelebration
        isActive={showCelebration}
        taskTitle={completedTaskTitle}
        streakCount={taskStreak}
        onComplete={() => setShowCelebration(false)}
      />
      
      {/* Quick celebration animation for checkbox toggles */}
      <QuickTaskCelebration
        isActive={showQuickCelebration}
        taskTitle={quickCelebrationTask}
        onComplete={() => setShowQuickCelebration(false)}
      />
    </div>
  );
}
