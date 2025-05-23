import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { HouseholdTaskType } from "@/lib/types";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  format,
  isToday,
  isThisWeek,
  isThisMonth,
  isAfter,
  isBefore,
  addDays,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
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
  GripVertical,
} from "lucide-react";
import { useSearchParam } from "react-use";

// Components
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import CreateTaskModal from "@/components/household/create-task-modal";
import TaskDetailsModal from "@/components/household/task-details-modal";
import { CoupleLoadingAnimation } from "@/components/shared/couple-loading-animation";
import { AnimatedList } from "@/components/ui/animated-list";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { RippleButton } from "@/components/ui/ripple-button";
import {
  TaskCompletionCelebration,
  QuickTaskCelebration,
} from "@/components/household/task-completion-celebration";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EditTaskModal from "@/components/household/edit-task-modal";
import { formatDateSafely } from "@/lib/utils";
// Using a simple implementation of sortable list for now
import { SimpleSortableList } from "@/components/household/simple-sortable-list";
import { navigate } from "wouter/use-browser-location";
// Alias SimpleSortableList as SortableTaskList to fix errors
const SortableTaskList = SimpleSortableList;

// Pull to Refresh Component with improved UX and fixed tap issue
function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pullDistance = useRef(0);
  const hasMoved = useRef(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const MAX_PULL_DISTANCE = 120;
  const ACTIVATION_THRESHOLD = MAX_PULL_DISTANCE * 0.6;
  const MOVEMENT_THRESHOLD = 10; // Mínimo de pixels para considerar como um movimento de puxar

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      pullDistance.current = 0;
      hasMoved.current = false;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;

    const previousY = currentY.current;
    currentY.current = e.touches[0].clientY;

    // Calcular a distância do movimento atual
    const moveDistance = currentY.current - previousY;

    // Verificar se o usuário realmente está puxando para baixo
    if (currentY.current - startY.current > MOVEMENT_THRESHOLD) {
      hasMoved.current = true;

      pullDistance.current = Math.max(
        0,
        Math.min(currentY.current - startY.current, MAX_PULL_DISTANCE)
      );

      // Calcular progresso percentual
      const progress = (pullDistance.current / ACTIVATION_THRESHOLD) * 100;
      setPullProgress(Math.min(progress, 100));

      if (pullDistance.current > 0) {
        // Prevenir o comportamento padrão apenas quando estamos realmente puxando
        if (moveDistance > 0 && containerRef.current?.scrollTop === 0) {
          e.preventDefault();
        }

        // Aplicar fator de resistência para uma sensação mais natural
        const resistanceFactor =
          0.5 + 0.5 * Math.exp(-pullDistance.current / 50);
        const adjustedDistance = pullDistance.current * resistanceFactor;

        controls.set({
          y: adjustedDistance,
          opacity: Math.min(
            pullDistance.current / (MAX_PULL_DISTANCE * 0.5),
            1
          ),
          rotate: pullDistance.current > ACTIVATION_THRESHOLD ? [0, 180] : 0,
        });
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || refreshing) return;

    // Verificar se o usuário realmente puxou (não apenas tocou)
    if (hasMoved.current && pullDistance.current >= ACTIVATION_THRESHOLD) {
      setRefreshing(true);
      setPullProgress(100);

      // Animar para o estado de carregamento
      await controls.start({
        y: 50,
        opacity: 1,
        rotate: 0,
        transition: { type: "spring", stiffness: 400, damping: 30 },
      });

      try {
        await onRefresh();
      } catch (error) {
        console.error("Erro ao atualizar:", error);
      } finally {
        setRefreshing(false);
        setPullProgress(0);
      }
    }

    // Retornar ao estado inicial com animação spring
    await controls.start({
      y: 0,
      opacity: 0,
      transition: { type: "spring", stiffness: 400, damping: 30 },
    });

    setIsPulling(false);
    hasMoved.current = false;
    pullDistance.current = 0;
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
        className="absolute top-0 left-0 right-0 flex flex-col items-center z-10 pointer-events-none"
        animate={controls}
        initial={{ y: 0, opacity: 0 }}
      >
        <div className="bg-primary-light/20 backdrop-blur-sm rounded-full p-3 mt-2 shadow-sm">
          {refreshing ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <motion.div
              animate={{ rotate: pullProgress >= 100 ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ChevronDown className="h-6 w-6 text-primary" />
            </motion.div>
          )}
        </div>

        {/* Progress indicator */}
        {isPulling && hasMoved.current && !refreshing && pullProgress > 10 && (
          <div className="mt-2 text-xs font-medium text-primary bg-primary-light/30 px-3 py-1 rounded-full">
            {pullProgress >= 100
              ? "Solte para atualizar"
              : "Puxe para atualizar"}
          </div>
        )}

        {refreshing && (
          <div className="mt-2 text-xs font-medium text-primary bg-primary-light/30 px-3 py-1 rounded-full">
            Atualizando...
          </div>
        )}
      </motion.div>

      {/* Overlay for visual feedback during pull */}
      {isPulling && hasMoved.current && pullProgress > 5 && (
        <motion.div
          className="absolute inset-0 bg-primary-light/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: pullProgress / 200 }}
        />
      )}

      {children}
    </div>
  );
}

export default function HouseholdTasksPage() {
  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();
  const taskId = useSearchParam("taskId");
  const newTask = useSearchParam("newTask");

  // State
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<HouseholdTaskType | null>(null);
  const [selectedTask, setSelectedTask] = useState<HouseholdTaskType | null>(
    null
  );
  const [groupByFrequency, setGroupByFrequency] = useState(true);
  const [viewPartner, setViewPartner] = useState(false);
  const [viewMyTasks, setViewMyTasks] = useState(true);

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
  const [completedTaskTitle, setCompletedTaskTitle] = useState("");
  const [taskStreak, setTaskStreak] = useState(0);
  const [recentlyCompletedTasks, setRecentlyCompletedTasks] = useState<
    number[]
  >([]);
  const [showQuickCelebration, setShowQuickCelebration] = useState(false);
  const [quickCelebrationTask, setQuickCelebrationTask] = useState<string>("");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Queries
  const {
    data: tasks = [],
    isLoading,
    refetch: refetchTasks,
  } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: task, isLoading: taskIsLoading } = useQuery<HouseholdTaskType>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar evento ${taskId}`);
      }

      return response.json() as Promise<HouseholdTaskType>;
    },
    enabled: !!taskId, // Só executa se tiver um ID válido
  });

  useEffect(() => {
    if (user && !user.partnerId) {
      navigate("/invite-partner");
    }
    if (!taskIsLoading && task && task?.id && taskId) {
      setSelectedTask(task ?? null);
    }
  }, [taskId, task]);

  useEffect(() => {
    if (newTask) {
      handleOpenCreateModal();
    }
  }, [newTask]);

  const { data: partnerTasks = [], refetch: refetchPartnerTasks } = useQuery<
    HouseholdTaskType[]
  >({
    queryKey: ["/api/tasks/partner"],
    enabled: !!user?.partnerId,
  });

  // Mutations
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
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/partner"] });

      if (variables.completed) {
        const task = tasks.find((t) => t.id === variables.id);
        if (task) {
          setQuickCelebrationTask(task.title);
        }
        setShowQuickCelebration(true);
        setTimeout(() => {
          setShowQuickCelebration(false);
        }, 1800);
      } else {
        toast({
          title: "Tarefa atualizada",
          description: "O status da tarefa foi atualizado com sucesso.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/partner"] });
      setSelectedTask(null);
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir tarefa",
        description: "Não foi possível excluir a tarefa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation for reordering tasks
  const reorderTasksMutation = useMutation({
    mutationFn: async (tasks: { id: number; position: number }[]) => {
      const response = await apiRequest("PUT", "/api/tasks-reorder", {
        tasks,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/partner"] });
      toast({
        title: "Tarefas reordenadas",
        description: "A ordem das tarefas foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao reordenar tarefas",
        description:
          "Não foi possível atualizar a ordem das tarefas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getFilteredTasks = () => {
    let filteredTasks: HouseholdTaskType[] = [];

    // Filter by tab
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
    }

    if (viewMyTasks) {
      filteredTasks = filteredTasks.filter(
        (task) => task.assignedTo === user?.id || task.assignedTo === null // inclui tarefas atribuídas ao usuário ou a ambos
      );
    }

    // Filter by date if selected
    if (selectedDate) {
      filteredTasks = filteredTasks.filter((task) => {
        if (!task.dueDate) return false;
        const eventDate = new Date(task.dueDate);
        const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
        const formattedSelectedDate = formatDateSafely(
          new Date(selectedDate)
        )?.split("T")[0];

        if (!formattedEventDate || !formattedSelectedDate) {
          return false;
        }

        return isSameDay(formattedEventDate, formattedSelectedDate);
      });
    }

    // Filter by category if selected
    if (selectedCategory) {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === selectedCategory
      );
    }

    // Sort tasks
    return filteredTasks.sort((a, b) => {
      // Pending tasks first
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      const positionA = a.position || 0;
      const positionB = b.position || 0;

      if (positionA !== positionB) {
        return positionA - positionB;
      }
      // Sort by priority (high to low)
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      // Sort by due date
      if (a.dueDate && b.dueDate) {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      }

      // Tasks with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      return 0;
    });
  };

  const getFilteredTasksPartner = () => {
    let filteredTasks: HouseholdTaskType[] = [];

    // Filter by tab
    switch (activeTab) {
      case "all":
        filteredTasks = [...partnerTasks];
        break;
      case "pending":
        filteredTasks = partnerTasks.filter((task) => !task.completed);
        break;
      case "completed":
        filteredTasks = partnerTasks.filter((task) => task.completed);
        break;
    }

    // Filter by date if selected
    if (selectedDate) {
      filteredTasks = filteredTasks.filter((task) => {
        if (!task.dueDate) return false;
        const eventDate = new Date(task.dueDate);
        const formattedEventDate = formatDateSafely(eventDate)?.split("T")[0];
        const formattedSelectedDate = formatDateSafely(
          new Date(selectedDate)
        )?.split("T")[0];

        if (!formattedEventDate || !formattedSelectedDate) {
          return false;
        }

        return isSameDay(formattedEventDate, formattedSelectedDate);
      });
    }

    // Filter by category if selected
    if (selectedCategory) {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === selectedCategory
      );
    }

    // Sort tasks
    return filteredTasks.sort((a, b) => {
      // Pending tasks first
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      const positionA = a.position || 0;
      const positionB = b.position || 0;

      if (positionA !== positionB) {
        return positionA - positionB;
      }
      // Sort by priority (high to low)
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      // Sort by due date
      if (a.dueDate && b.dueDate) {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      }

      // Tasks with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      return 0;
    });
  };

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

  const getFrequencyText = (frequency: string): string => {
    switch (frequency) {
      case "once":
        return "Uma vez";
      case "daily":
        return "Diária";
      case "weekly":
        return "Semanal";
      case "biweekly":
        return "Quinzenal";
      case "monthly":
        return "Mensal";
      case "quarterly":
        return "Trimestral";
      case "yearly":
        return "Anual";
      case "custom":
        return "Personalizada";
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
      case "biweekly":
        return <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />;
      case "monthly":
        return <CalendarClock className="h-4 w-4 text-primary flex-shrink-0" />;
      case "quarterly":
        return <CalendarClock className="h-4 w-4 text-primary flex-shrink-0" />;
      case "yearly":
        return <CalendarClock className="h-4 w-4 text-primary flex-shrink-0" />;
      case "custom":
        return <CalendarClock className="h-4 w-4 text-primary flex-shrink-0" />;
      default:
        return <Clock className="h-4 w-4 text-primary flex-shrink-0" />;
    }
  };

  // Group tasks by frequency
  const groupedTasks = useMemo(() => {
    let filteredTasks: HouseholdTaskType[] = [];
    if (viewPartner && !viewMyTasks) {
      filteredTasks = getFilteredTasksPartner();
    } else {
      filteredTasks = getFilteredTasks();
    }

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
  }, [
    tasks,
    partnerTasks,
    activeTab,
    groupByFrequency,
    selectedDate,
    viewPartner,
    viewMyTasks,
    selectedCategory,
  ]);

  // Event handlers
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

  const handleOpenCreateModal = () => setCreateModalOpen(true);
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    navigate("/tasks", { replace: true });
  };
  const handleOpenTaskDetails = (task: HouseholdTaskType) =>
    setSelectedTask(task);
  const handleCloseTaskDetails = () => setSelectedTask(null);

  // Add a function to handle opening the edit modal
  const handleOpenEditModal = (task: HouseholdTaskType) => {
    setTaskToEdit(task);
    setEditModalOpen(true);
  };

  // Add a function to handle closing the edit modal
  const handleCloseEditModal = (task: HouseholdTaskType) => {
    setEditModalOpen(false);
    setSelectedTask(task);

    setTaskToEdit(null);
  };

  const handleToggleTaskComplete = (
    task: HouseholdTaskType,
    isModal: boolean
  ) => {
    // Only trigger celebration if marking as completed
    if (!task.completed) {
      setCompletedTaskTitle(task.title);

      // Calculate streak
      const updatedRecentlyCompleted = [...recentlyCompletedTasks];
      if (!updatedRecentlyCompleted.includes(task.id)) {
        updatedRecentlyCompleted.push(task.id);
        setRecentlyCompletedTasks(updatedRecentlyCompleted);
      }

      // Calculate streak (limit to last 10 for UI purposes)
      const streak = Math.min(updatedRecentlyCompleted.length, 10);
      setTaskStreak(streak);

      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }

    toggleCompleteMutation.mutate({
      id: task.id,
      completed: !task.completed,
    });
    if (isModal) {
      setSelectedTask({ ...task, completed: !task.completed });
    }
  };

  const handleDeleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // Handle drag and drop to reorder tasks
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // If order hasn't changed, do nothing
    if (active.id === over.id) return;

    // Get active tasks based on current filter
    let activeTasks: HouseholdTaskType[] = [];

    // Determine which tasks are being dragged based on the current view
    if (groupByFrequency) {
      // In grouped view, determine the frequency from the active element's data
      // Look at the active ID to determine which task we're working with
      const activeIdNum = Number(active.id);
      const activeTask = tasks.find((t) => Number(t.id) === activeIdNum);

      if (!activeTask) {
        console.error("Could not find active task with ID:", activeIdNum);
        return;
      }

      const frequency = activeTask.frequency;
      activeTasks = tasks.filter(
        (task) => task.frequency === frequency && !task.completed
      );
    } else {
      // In non-grouped view, use all active tasks
      activeTasks = tasks.filter((task) => !task.completed);
    }

    if (!activeTasks || activeTasks.length === 0) {
      console.error("No active tasks found in the current view");
      return;
    }

    // Make sure IDs are numbers
    const activeId = Number(active.id);
    const overId = Number(over.id);

    if (isNaN(activeId) || isNaN(overId)) {
      console.error("Invalid task IDs in drag operation", { active, over });
      return;
    }

    // Find the indices of the tasks
    const oldIndex = activeTasks.findIndex(
      (task) => Number(task.id) === activeId
    );
    const newIndex = activeTasks.findIndex(
      (task) => Number(task.id) === overId
    );

    if (oldIndex < 0 || newIndex < 0) {
      console.error("Could not find task indices", {
        oldIndex,
        newIndex,
        activeTasks,
      });
      return;
    }

    // Reorganize the task array
    const updatedTasks = arrayMove(activeTasks, oldIndex, newIndex);

    // Prepare data to update in the database
    const taskUpdates = updatedTasks.map((task, index) => ({
      id: Number(task.id),
      position: index,
    }));

    // Call the mutation to save the order to the database
    console.log("Sending task updates:", taskUpdates);
    reorderTasksMutation.mutate(taskUpdates);
  };

  // UI Components
  const renderTaskCard = (task: HouseholdTaskType) => {
    return (
      <TactileFeedback className="w-full">
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
                handleToggleTaskComplete(task, false);
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
            <div
              className="flex-1 min-w-0"
              onClick={() => handleOpenTaskDetails(task)}
            >
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
                      {task.weekdays && task.frequency === "weekly" && (
                        <span className="ml-1 text-primary-dark/70">
                          (
                          {task.weekdays
                            .split(",")
                            .map(
                              (day) =>
                                [
                                  "Dom",
                                  "Seg",
                                  "Ter",
                                  "Qua",
                                  "Qui",
                                  "Sex",
                                  "Sáb",
                                ][parseInt(day)]
                            )
                            .join(", ")}
                          )
                        </span>
                      )}
                      {task.monthDay && task.frequency === "monthly" && (
                        <span className="ml-1 text-primary-dark/70">
                          (Dia {task.monthDay})
                        </span>
                      )}
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

                {/* Status da tarefa: Concluída */}
                {task.completed ? (
                  <div className="text-xs flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                    <Check className="h-3 w-3 mr-1 flex-shrink-0" />
                    Concluída
                  </div>
                ) : (
                  /* Informação sobre atribuição */
                  task.assignedTo &&
                  task.assignedTo === user?.partnerId && (
                    <div className="text-xs flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                      <UserIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      Atribuída ao parceiro
                    </div>
                  )
                )}

                {/* Indicador de prioridade */}
                {!task.completed && (
                  <div
                    className={`text-xs flex items-center px-2 py-1 rounded-full font-medium ${
                      task.priority === 2
                        ? "bg-red-50 text-red-600"
                        : task.priority === 1
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Star className="h-3 w-3 mr-1 flex-shrink-0" />
                    {task.priority === 2
                      ? "Alta"
                      : task.priority === 1
                        ? "Média"
                        : "Baixa"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </TactileFeedback>
    );
  };

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
      case "biweekly":
        title = "Tarefas Quinzenais";
        icon = <CalendarDays className="h-5 w-5" />;
        break;
      case "monthly":
        title = "Tarefas Mensais";
        icon = <CalendarClock className="h-5 w-5" />;
        break;
      case "quarterly":
        title = "Tarefas Trimestrais";
        icon = <CalendarClock className="h-5 w-5" />;
        break;
      case "yearly":
        title = "Tarefas Anuais";
        icon = <CalendarClock className="h-5 w-5" />;
        break;
      case "custom":
        title = "Tarefas Personalizadas";
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
          <div className="p-4">
            <SimpleSortableList
              tasks={tasks}
              onDragEnd={handleDragEnd}
              onClick={handleOpenTaskDetails}
              onToggleComplete={(task: HouseholdTaskType) =>
                handleToggleTaskComplete(task, false)
              }
              getFormattedDueDate={getFormattedDueDate}
              user={user}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderFiltersDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={
            viewMyTasks || viewPartner || !groupByFrequency || selectedDate
              ? "default"
              : "outline"
          }
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
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setViewPartner(false);
              setViewMyTasks(true);
            }}
            className={!viewPartner && viewMyTasks ? "bg-lime-100/40" : ""}
          >
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Minhas tarefas</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setViewPartner(true);
              setViewMyTasks(false);
            }}
            className={viewPartner && !viewMyTasks ? "bg-lime-100/40" : ""}
          >
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Tarefas do parceiro</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setViewPartner(false);
              setViewMyTasks(false);
            }}
            className={!viewPartner && !viewMyTasks ? "bg-lime-100/40" : ""}
          >
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Todas as tarefas</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <Link href="/tasks/reorder">
            <DropdownMenuItem>
              <GripVertical className="mr-2 h-4 w-4" />
              <span>Reordenar tarefas</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Data</DropdownMenuLabel>
        <Popover>
          <PopoverTrigger asChild>
            <DropdownMenuItem
              className="cursor-pointer justify-between"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {selectedDate
                    ? format(selectedDate, "PP", { locale: ptBR })
                    : "Selecionar data"}
                </span>
              </div>
            </DropdownMenuItem>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {selectedDate && (
          <DropdownMenuItem onClick={() => setSelectedDate(undefined)}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Limpar data</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Categoria</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setSelectedCategory(null)}
            className={!selectedCategory ? "bg-primary-light/20" : ""}
          >
            <span>Todas</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setSelectedCategory("cleaning")}
            className={
              selectedCategory === "cleaning" ? "bg-primary-light/20" : ""
            }
          >
            <span>Limpeza</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("shopping")}
            className={
              selectedCategory === "shopping" ? "bg-primary-light/20" : ""
            }
          >
            <span>Compras</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("maintenance")}
            className={
              selectedCategory === "maintenance" ? "bg-primary-light/20" : ""
            }
          >
            <span>Manutenção</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("work")}
            className={selectedCategory === "work" ? "bg-primary-light/20" : ""}
          >
            <span>Trabalho</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("personal")}
            className={
              selectedCategory === "personal" ? "bg-primary-light/20" : ""
            }
          >
            <span>Pessoal</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("important")}
            className={
              selectedCategory === "important" ? "bg-primary-light/20" : ""
            }
          >
            <span>Importante</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("exercise")}
            className={
              selectedCategory === "exercise" ? "bg-primary-light/20" : ""
            }
          >
            <span>Exercício</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("meal_prep")}
            className={
              selectedCategory === "meal_prep" ? "bg-primary-light/20" : ""
            }
          >
            <span>Preparação de Refeições</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("finance")}
            className={
              selectedCategory === "finance" ? "bg-primary-light/20" : ""
            }
          >
            <span>Finanças</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("hobbies")}
            className={
              selectedCategory === "hobbies" ? "bg-primary-light/20" : ""
            }
          >
            <span>Hobbies</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("study")}
            className={
              selectedCategory === "study" ? "bg-primary-light/20" : ""
            }
          >
            <span>Estudo</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("relaxation")}
            className={
              selectedCategory === "relaxation" ? "bg-primary-light/20" : ""
            }
          >
            <span>Relaxamento</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("health")}
            className={
              selectedCategory === "health" ? "bg-primary-light/20" : ""
            }
          >
            <span>Saúde</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("pets")}
            className={selectedCategory === "pets" ? "bg-primary-light/20" : ""}
          >
            <span>Pets</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("planning")}
            className={
              selectedCategory === "planning" ? "bg-primary-light/20" : ""
            }
          >
            <span>Planejamento</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("gardening")}
            className={
              selectedCategory === "gardening" ? "bg-primary-light/20" : ""
            }
          >
            <span>Jardinagem</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelectedCategory("cleaning_car")}
            className={
              selectedCategory === "cleaning_car" ? "bg-primary-light/20" : ""
            }
          >
            <span>Limpeza do Carro</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setSelectedCategory("other")}
            className={
              selectedCategory === "other" ? "bg-primary-light/20" : ""
            }
          >
            <span>Outro</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderEmptyState = () => (
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
  );

  const renderTaskList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <CoupleLoadingAnimation
            type="tasks"
            text="Carregando tarefas domésticas..."
            size="lg"
          />
        </div>
      );
    }

    if (groupByFrequency) {
      // Grouped view by frequency
      const hasAnyTasks = Object.keys(groupedTasks).length > 0;

      return (
        <>
          {renderTaskGroup("once", groupedTasks.once || [])}

          {renderTaskGroup("daily", groupedTasks.daily || [])}
          {renderTaskGroup("weekly", groupedTasks.weekly || [])}
          {renderTaskGroup("biweekly", groupedTasks.biweekly || [])}
          {renderTaskGroup("monthly", groupedTasks.monthly || [])}
          {renderTaskGroup("quarterly", groupedTasks.quarterly || [])}
          {renderTaskGroup("yearly", groupedTasks.yearly || [])}
          {renderTaskGroup("custom", groupedTasks.custom || [])}

          {!hasAnyTasks && renderEmptyState()}
        </>
      );
    } else {
      // Simple list view
      return groupedTasks.ungrouped && groupedTasks.ungrouped.length > 0 ? (
        <SimpleSortableList
          tasks={groupedTasks.ungrouped}
          onDragEnd={handleDragEnd}
          onClick={handleOpenTaskDetails}
          onToggleComplete={(task: HouseholdTaskType) =>
            handleToggleTaskComplete(task, false)
          }
          getFormattedDueDate={getFormattedDueDate}
          user={user}
        />
      ) : (
        renderEmptyState()
      );
    }
  };

  const getTasksTitle = () => {
    if (viewPartner && !viewMyTasks) return "Tarefas do parceiro";
    if (!viewMyTasks && !viewPartner) return "Todas as tarefas";
    return "Minhas tarefas";
  };

  return (
    <div className="h-screen flex flex-col scroll-id">
      <div
        className="flex items-center justify-between p-4 bg-primary-light border-b border-primary-light"
        style={{ marginTop: 100 }}
      >
        <h2 className="text-xl font-semibold text-rose-900">
          {getTasksTitle()}
        </h2>
        <div className="flex gap-2">
          {renderFiltersDropdown()}

          {/* <Link href="/tasks/reorder">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <GripVertical className="h-4 w-4" /> Reordenar
            </Button>
          </Link> */}

          <Button
            onClick={handleOpenCreateModal}
            variant="default"
            size="sm"
            className="flex items-center gap-1 bg-primary-dark hover:bg-primary text-white transition-colors"
          >
            <span className="text-lg">+</span> Nova
          </Button>
        </div>
      </div>
      <Tabs
        defaultValue="pending"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1"
      >
        <TabsList className="grid grid-cols-3 mx-3 bg-gray-50 border border-gray-100 p-1 mt-2">
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
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Todas
          </TabsTrigger>
        </TabsList>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="mt-4 pb-16 px-4">{renderTaskList()}</div>
        </PullToRefresh>
      </Tabs>
      <BottomNavigation />
      {/* Modals */}
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
          onToggleComplete={() => handleToggleTaskComplete(selectedTask, true)}
          openEditModal={handleOpenEditModal}
        />
      )}
      {taskToEdit && (
        <EditTaskModal
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          task={taskToEdit}
        />
      )}
      {/* Animations */}
      <TaskCompletionCelebration
        isActive={showCelebration}
        taskTitle={completedTaskTitle}
        streakCount={taskStreak}
        onComplete={() => setShowCelebration(false)}
      />
      <QuickTaskCelebration
        isActive={showQuickCelebration}
        taskTitle={quickCelebrationTask}
        onComplete={() => setShowQuickCelebration(false)}
      />
      <div style={{ marginBottom: 90 }}></div>
    </div>
  );
}
