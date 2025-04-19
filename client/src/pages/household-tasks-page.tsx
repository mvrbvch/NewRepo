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
import { useSimpleToast } from "@/components/simple-toast";
import CreateTaskModal from "@/components/household/create-task-modal";
import TaskDetailsModal from "@/components/household/task-details-modal";
import {
  Loader2,
  Calendar as CalendarIcon,
  Check,
  RefreshCw,
  Clock,
  AlertCircle,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export default function HouseholdTasksPage() {
  const simpleToast = useSimpleToast();
  const toast = (options: any) => simpleToast.showToast(options);
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

      <div className="flex items-center justify-between p-4 bg-primary-light border-b border-primary-light">
        <h2 className="text-xl font-semibold text-primary-dark">Minhas Tarefas</h2>
        <Button 
          onClick={handleOpenCreateModal}
          variant="default"
          size="sm"
          className="flex items-center gap-1 bg-primary-dark hover:bg-primary text-white transition-colors"
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

        <div className="mt-4 pb-16 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-4 px-4">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`p-4 relative ${
                    task.completed 
                      ? "bg-gray-50 border-gray-200" 
                      : "bg-white hover:bg-primary-light/10 border-primary-light"
                  } shadow-sm hover:shadow-md transition-all cursor-pointer`}
                  onClick={() => handleOpenTaskDetails(task)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTaskComplete(task);
                      }}
                    >
                      <Checkbox 
                        checked={task.completed} 
                        className={`h-5 w-5 rounded-sm ${
                          !task.completed 
                            ? "border-primary hover:border-primary-dark" 
                            : "text-green-600"
                        }`} 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`font-semibold text-lg ${
                            task.completed 
                              ? "line-through text-gray-500" 
                              : "text-dark"
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.frequency !== "once" && (
                          <div className="flex items-center text-xs bg-primary-light/30 text-primary-dark px-2 py-1 rounded-full font-medium">
                            <RefreshCw className="h-3 w-3 mr-1 text-primary" />
                            {getFrequencyText(task.frequency)}
                          </div>
                        )}
                      </div>

                      {task.description && (
                        <p
                          className={`text-sm mt-2 ${
                            task.completed 
                              ? "text-gray-500" 
                              : "text-medium"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 items-center">
                        {task.dueDate && (
                          <div className="text-xs flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1 text-gray-500" />
                            {isBefore(new Date(task.dueDate), new Date()) && !task.completed ? (
                              <Badge variant="destructive" className="px-2 py-0.5 h-5 flex items-center gap-1 font-medium">
                                <AlertCircle size={12} />
                                <span>{getFormattedDueDate(task.dueDate)}</span>
                              </Badge>
                            ) : (
                              <span className={`${
                                task.completed 
                                  ? "text-gray-500 bg-gray-100" 
                                  : "text-dark font-medium bg-primary-light/20"
                                } px-2 py-0.5 rounded-full`}
                              >
                                {getFormattedDueDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        )}

                        {task.completed ? (
                          <div className="text-xs flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                            <Check className="h-3 w-3 mr-1" />
                            Concluída
                          </div>
                        ) : task.assignedTo && task.assignedTo === user?.partnerId && (
                          <div className="text-xs flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Atribuída ao parceiro
                          </div>
                        )}
                      </div>
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
