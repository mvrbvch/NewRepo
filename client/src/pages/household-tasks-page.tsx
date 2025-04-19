import { useState } from "react";
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
import { format, isToday, isThisWeek, isThisMonth, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import CreateTaskModal from "@/components/household/create-task-modal";
import TaskDetailsModal from "@/components/household/task-details-modal";
import {
  Loader2,
  Calendar as CalendarIcon,
  Check,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function HouseholdTasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HouseholdTaskType | null>(
    null,
  );

  // Busca todas as tarefas do usuário
  const { data: tasks = [], isLoading } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/tasks"],
  });

  // Busca tarefas do parceiro (se existir)
  const { data: partnerTasks = [] } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/partner-tasks"],
    enabled: !!user?.partnerId, // Somente ativa se o usuário tiver um parceiro
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-tasks"] });
      toast({
        title: "Tarefa atualizada",
        description: "O status da tarefa foi atualizado com sucesso.",
      });
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

    // Ordenar tarefas: primeiro as pendentes com data de vencimento próxima, depois as concluídas
    return filteredTasks.sort((a, b) => {
      // Se uma tarefa está completa e a outra não, a pendente vem primeiro
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      // Se ambas têm o mesmo status de conclusão, ordenar por data de vencimento
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

  const filteredTasks = getFilteredTasks();

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

  return (
    <div className="h-screen flex flex-col">
      <Header title="Tarefas Domésticas" />

      <div className="flex items-center justify-between p-4 bg-gray-50">
        <h2 className="text-xl font-semibold">Minhas Tarefas</h2>
        <Button 
          onClick={handleOpenCreateModal}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <span className="text-lg">+</span> Nova Tarefa
        </Button>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1"
      >
        <TabsList className="grid grid-cols-4 mx-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
          <TabsTrigger value="partner" disabled={!user?.partnerId}>
            Parceiro
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 pb-16 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-3 px-4">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`p-4 relative ${task.completed ? "bg-gray-50" : ""}`}
                  onClick={() => handleOpenTaskDetails(task)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTaskComplete(task);
                      }}
                    >
                      <Checkbox checked={task.completed} className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}
                        >
                          {task.title}
                        </h3>
                        {task.frequency !== "once" && (
                          <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {getFrequencyText(task.frequency)}
                          </div>
                        )}
                      </div>

                      {task.description && (
                        <p
                          className={`text-sm mt-1 ${task.completed ? "text-gray-500" : "text-gray-700"}`}
                        >
                          {task.description}
                        </p>
                      )}

                      {task.dueDate && (
                        <div className="mt-2 text-xs flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {isBefore(new Date(task.dueDate), new Date()) && !task.completed ? (
                            <Badge variant="destructive" className="px-1 py-0 h-4 flex items-center gap-1">
                              <AlertCircle size={10} />
                              <span>{getFormattedDueDate(task.dueDate)}</span>
                            </Badge>
                          ) : (
                            <span className={`${task.completed ? "text-gray-500" : "text-gray-700"}`}>
                              {getFormattedDueDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      )}

                      {task.completed ? (
                        <div className="mt-1 text-xs flex items-center text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Concluída
                        </div>
                      ) : task.assignedTo && task.assignedTo === user?.partnerId && (
                        <div className="mt-1 text-xs flex items-center text-blue-600">
                          Atribuída ao parceiro
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <p>Nenhuma tarefa encontrada</p>
              <Button
                variant="link"
                onClick={handleOpenCreateModal}
                className="mt-2"
              >
                Criar uma nova tarefa
              </Button>
            </div>
          )}
        </div>
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
    </div>
  );
}
