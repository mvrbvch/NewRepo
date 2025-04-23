import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { HouseholdTaskType } from "@/lib/types";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function HouseholdTasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  // Busca todas as tarefas do usuário
  const {
    data: tasks = [],
    isLoading,
  } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/tasks"],
  });

  // Renderiza uma tarefa
  const renderTask = (task: HouseholdTaskType) => {
    return (
      <Card key={task.id} className="p-4 mb-4">
        <div className="font-semibold">{task.title}</div>
        {task.description && <div className="text-sm mt-2">{task.description}</div>}
        <div className="text-xs mt-2">
          Priority: {task.priority === 2 ? 'Alta' : task.priority === 1 ? 'Média' : 'Baixa'}
        </div>
      </Card>
    );
  };

  // Filtra as tarefas
  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return tasks.filter(t => !t.completed);
      case "completed":
        return tasks.filter(t => t.completed);
      default:
        return tasks;
    }
  }, [tasks, activeTab]);

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1"
      >
        <TabsList className="grid grid-cols-3 mx-4 p-1 mt-2">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>

        <div className="p-4 pb-16">
          {isLoading ? (
            <div>Carregando tarefas...</div>
          ) : (
            <>
              {filteredTasks.length === 0 ? (
                <div className="text-center mt-8">Nenhuma tarefa encontrada</div>
              ) : (
                <div>
                  {filteredTasks.map(task => renderTask(task))}
                </div>
              )}
            </>
          )}
        </div>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}