// Versão ultra simplificada sem dependência do dnd-kit
import * as React from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { HouseholdTaskType } from "@/lib/types";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WebSocketTest } from "@/components/shared/websocket-test";

// Task item simples com botões para mover para cima/baixo
interface TaskItemProps {
  task: HouseholdTaskType;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (taskId: number) => void;
  onMoveDown: (taskId: number) => void;
}

function TaskItem({
  task,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: TaskItemProps) {
  // Função segura para garantir que o ID seja numérico
  const safeGetId = (): number => {
    if (typeof task.id === "number") return task.id;
    if (typeof task.id === "string") return parseInt(task.id, 10);
    return -1; // valor inválido
  };

  const id = safeGetId();

  return (
    <div className="mb-4">
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Checkbox checked={task.completed} className="h-5 w-5" disabled />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              ID: {id} | Posição: {task.position ?? index}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={isFirst}
              onClick={() => onMoveUp(id)}
              title="Mover para cima"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              disabled={isLast}
              onClick={() => onMoveDown(id)}
              title="Mover para baixo"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function HouseholdTasksPageSimple() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<HouseholdTaskType[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Buscar todas as tarefas
  const { data: allTasks = [], isLoading } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/tasks"],
  });

  // Processa as tarefas quando elas são carregadas
  React.useEffect(() => {
    if (allTasks && allTasks.length > 0 && user?.id) {
      try {
        // Processar os IDs e garantir que todos são números
        const processedTasks = allTasks
          .map((task) => ({
            ...task,
            id:
              typeof task.id === "string"
                ? parseInt(task.id, 10)
                : Number(task.id),
          }))
          .filter((task) => !isNaN(task.id));

        // Filtrar tarefas do usuário atual e não completadas
        const myTasks = processedTasks.filter(
          (task) =>
            (task.assignedTo === user.id || task.createdBy === user.id) &&
            !task.completed,
        );

        console.log("Tarefas filtradas por usuário:", myTasks.length);

        // Ordenar tarefas por posição
        const sortedTasks = [...myTasks].sort((a, b) => {
          const posA = typeof a.position === "number" ? a.position : 999999;
          const posB = typeof b.position === "number" ? b.position : 999999;
          return posA - posB;
        });

        console.log(
          "Tarefas processadas para reordenação:",
          sortedTasks.map((t) => ({ id: t.id, position: t.position })),
        );

        setTasks(sortedTasks);
      } catch (error) {
        console.error("Erro ao processar tarefas:", error);
        setErrorMsg("Erro ao carregar tarefas. Tente novamente.");
      }
    }
  }, [allTasks, user?.id]);

  // Mutation para reordenar as tarefas no servidor
  const reorderTasksMutation = useMutation({
    mutationFn: async (taskUpdates: { id: number; position: number }[]) => {
      // Debug detalhado dos dados de entrada
      console.log(
        "DADOS ORIGINAIS RECEBIDOS PELA MUTATION:",
        JSON.stringify(taskUpdates),
      );

      // Validar dados antes de enviar
      const validatedTasks = taskUpdates
        .filter((task) => {
          console.log(`Validando tarefa ${JSON.stringify(task)}`);

          // Verificar se a tarefa tem as propriedades necessárias
          if (!task || typeof task !== "object") {
            console.error("Tarefa inválida ou não é um objeto");
            return false;
          }

          // Converter ID para número de forma segura
          let numericId;
          try {
            if (typeof task.id === "number") {
              numericId = task.id;
            } else if (typeof task.id === "string") {
              numericId = parseInt(task.id, 10);
            } else {
              console.error(`ID com tipo não suportado: ${typeof task.id}`);
              return false;
            }
          } catch (e) {
            console.error(`Erro ao converter ID: ${e}`);
            return false;
          }

          // Validar ID
          if (isNaN(numericId)) {
            console.error(`ID resultou em NaN: ${task.id} -> ${numericId}`);
            return false;
          }

          if (!Number.isInteger(numericId) || numericId <= 0) {
            console.error(`ID não é um inteiro positivo: ${numericId}`);
            return false;
          }

          // Validação da posição (similar ao ID)
          let numericPosition;
          try {
            if (typeof task.position === "number") {
              numericPosition = task.position;
            } else if (typeof task.position === "string") {
              numericPosition = parseInt(task.position, 10);
            } else {
              console.error(
                `Posição com tipo não suportado: ${typeof task.position}`,
              );
              return false;
            }
          } catch (e) {
            console.error(`Erro ao converter posição: ${e}`);
            return false;
          }

          // Validar posição
          if (isNaN(numericPosition)) {
            console.error(
              `Posição resultou em NaN: ${task.position} -> ${numericPosition}`,
            );
            return false;
          }

          if (!Number.isInteger(numericPosition) || numericPosition < 0) {
            console.error(
              `Posição não é um inteiro não-negativo: ${numericPosition}`,
            );
            return false;
          }

          console.log(
            `Tarefa validada com sucesso: ID=${numericId}, Posição=${numericPosition}`,
          );
          return true;
        })
        .map((task) => {
          // Garantir que estamos enviando números
          const safeId = Number(task.id);
          const safePosition = Number(task.position);

          console.log(
            `Convertendo para envio: ID=${safeId}, Posição=${safePosition}`,
          );

          return {
            id: safeId,
            position: safePosition,
          };
        });

      console.log(
        "Enviando atualizações de posições:",
        JSON.stringify(validatedTasks),
      );

      if (validatedTasks.length === 0) {
        throw new Error("Nenhuma tarefa válida para reordenar");
      }

      const response = await apiRequest("PUT", "/api/tasks-reorder", {
        tasks: validatedTasks,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro na resposta da API:", errorData);
        throw new Error(errorData.message || "Erro ao reordenar tarefas");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarefas reordenadas",
        description: "A ordem das tarefas foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao reordenar tarefas:", error);
      setErrorMsg(
        error instanceof Error ? error.message : "Erro ao reordenar tarefas",
      );
      toast({
        title: "Erro ao reordenar tarefas",
        description:
          "Não foi possível atualizar a ordem das tarefas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função para mover uma tarefa para cima na lista
  const handleMoveUp = (taskId: number) => {
    try {
      // Validar o ID de tarefa de forma rígida
      const numericId = Number(taskId);
      if (isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
        console.error("ID de tarefa inválido:", taskId, "->", numericId);
        toast({
          title: "Erro ao reordenar",
          description: "ID de tarefa inválido. Por favor, tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Encontrar a tarefa usando o ID numérico
      const taskIndex = tasks.findIndex((t) => {
        const tId = Number(t.id);
        return !isNaN(tId) && Number.isInteger(tId) && tId === numericId;
      });

      if (taskIndex < 0) {
        console.error("Tarefa não encontrada:", numericId);
        return;
      }

      if (taskIndex === 0) {
        console.log("Tarefa já está no topo:", numericId);
        return;
      }

      // Criar uma cópia para manipular
      const updatedTasks = [...tasks];

      // Trocar posições
      const temp = updatedTasks[taskIndex];
      updatedTasks[taskIndex] = updatedTasks[taskIndex - 1];
      updatedTasks[taskIndex - 1] = temp;

      // Atualizar o estado otimisticamente
      setTasks(updatedTasks);

      // Preparar os dados para atualização no servidor com validação extra
      if (user?.id) {
        // Filtramos apenas as tarefas que pertencem ao usuário atual
        const userTasks = updatedTasks.filter((task) => {
          // Validação adicional para garantir que os IDs sejam números válidos
          if (!task || task.id === undefined) return false;

          const ownerId = Number(task.createdBy);
          const assigneeId = task.assignedTo ? Number(task.assignedTo) : null;
          const userId = Number(user.id);

          return (
            !isNaN(ownerId) &&
            !isNaN(userId) &&
            (ownerId === userId || assigneeId === userId)
          );
        });

        // Criar array de atualizações com posições explicitamente numeradas
        const taskUpdates = userTasks
          .map((task, index) => {
            const safeId = Number(task.id);

            // Validação extra para garantir que não enviamos IDs inválidos
            if (isNaN(safeId) || !Number.isInteger(safeId) || safeId <= 0) {
              console.error("Pulando tarefa com ID inválido:", task.id);
              return null;
            }

            return {
              id: safeId,
              position: index,
            };
          })
          .filter((item) => item !== null);

        console.log("Enviando atualizações após mover para cima:", taskUpdates);

        // Enviar para o servidor apenas se tivermos atualizações válidas
        if (taskUpdates.length > 0) {
          reorderTasksMutation.mutate(taskUpdates);
        }
      }
    } catch (error) {
      console.error("Erro ao mover tarefa para cima:", error);
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível mover a tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para mover uma tarefa para baixo na lista
  const handleMoveDown = (taskId: number) => {
    try {
      // Validar o ID de tarefa de forma rígida
      const numericId = Number(taskId);
      if (isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
        console.error("ID de tarefa inválido:", taskId, "->", numericId);
        toast({
          title: "Erro ao reordenar",
          description: "ID de tarefa inválido. Por favor, tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Encontrar a tarefa usando o ID numérico
      const taskIndex = tasks.findIndex((t) => {
        const tId = Number(t.id);
        return !isNaN(tId) && Number.isInteger(tId) && tId === numericId;
      });

      if (taskIndex < 0) {
        console.error("Tarefa não encontrada:", numericId);
        return;
      }

      if (taskIndex >= tasks.length - 1) {
        console.log("Tarefa já está no final da lista:", numericId);
        return;
      }

      // Criar uma cópia para manipular
      const updatedTasks = [...tasks];

      // Trocar posições
      const temp = updatedTasks[taskIndex];
      updatedTasks[taskIndex] = updatedTasks[taskIndex + 1];
      updatedTasks[taskIndex + 1] = temp;

      // Atualizar o estado otimisticamente
      setTasks(updatedTasks);

      // Preparar os dados para atualização no servidor com validação extra
      if (user?.id) {
        // Filtramos apenas as tarefas que pertencem ao usuário atual
        const userTasks = updatedTasks.filter((task) => {
          // Validação adicional para garantir que os IDs sejam números válidos
          if (!task || task.id === undefined) return false;

          const ownerId = Number(task.createdBy);
          const assigneeId = task.assignedTo ? Number(task.assignedTo) : null;
          const userId = Number(user.id);

          return (
            !isNaN(ownerId) &&
            !isNaN(userId) &&
            (ownerId === userId || assigneeId === userId)
          );
        });

        // Criar array de atualizações com posições explicitamente numeradas
        const taskUpdates = userTasks
          .map((task, index) => {
            const safeId = Number(task.id);

            // Validação extra para garantir que não enviamos IDs inválidos
            if (isNaN(safeId) || !Number.isInteger(safeId) || safeId <= 0) {
              console.error("Pulando tarefa com ID inválido:", task.id);
              return null;
            }

            return {
              id: safeId,
              position: index,
            };
          })
          .filter((item) => item !== null);

        console.log(
          "Enviando atualizações após mover para baixo:",
          taskUpdates,
        );

        // Enviar para o servidor apenas se tivermos atualizações válidas
        if (taskUpdates.length > 0) {
          reorderTasksMutation.mutate(taskUpdates);
        }
      }
    } catch (error) {
      console.error("Erro ao mover tarefa para baixo:", error);
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível mover a tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />

      <div
        className="flex items-center p-4 bg-white border-b"
        style={{ marginTop: 100 }}
      >
        <Link href="/tasks">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Reordenar Tarefas</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Use os botões de seta para cima e para baixo para reorganizar suas
            tarefas. As alterações são salvas automaticamente.
          </p>

          {/* Mensagem de depuração */}
          <div className="bg-gray-100 p-3 rounded-lg mb-4 text-xs">
            <p className="font-semibold">
              Debug Mode: Reordenação com Validação Aprimorada
            </p>
            <p className="text-gray-600 mt-1">
              • Total de tarefas: {tasks.length}
              <br />• Validação numérica:{" "}
              <span className="text-green-600">Ativa</span>
              <br />• Filtro por usuário:{" "}
              <span className="text-green-600">Ativo</span>
              <br />• Validação em tempo real:{" "}
              <span className="text-green-600">Ativa</span>
            </p>
          </div>

          {/* Mensagem de erro */}
          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setErrorMsg(null)}
              >
                Fechar
              </Button>
            </Alert>
          )}

          {/* Status de processamento */}
          {reorderTasksMutation.isPending && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-blue-600 rounded-full"></div>
                <AlertTitle>Salvando alterações...</AlertTitle>
              </div>
            </Alert>
          )}

          {/* Estado de carregamento */}
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : tasks.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-500">
                Nenhuma tarefa pendente para organizar.
              </p>
              <Link href="/tasks">
                <Button variant="link" className="mt-2">
                  Voltar para tarefas
                </Button>
              </Link>
            </Card>
          ) : (
            <div>
              {tasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === tasks.length - 1}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
