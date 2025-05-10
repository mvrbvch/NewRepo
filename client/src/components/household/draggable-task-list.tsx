import React from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HouseholdTaskType } from "@/lib/types";
import { AnimatedList } from "@/components/ui/animated-list";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Check,
  AlertCircle,
  User as UserIcon,
  Star,
} from "lucide-react";
import { isBefore } from "date-fns";

interface SortableTaskCardProps {
  task: HouseholdTaskType & { id: number }; // Garante que id é um número
  onClick: () => void;
  onToggleComplete: (task: HouseholdTaskType) => void;
  getFormattedDueDate: (date: string | Date) => string;
  getFrequencyIcon: (frequency: string) => React.ReactNode;
  getFrequencyText: (frequency: string) => string;
  user?: any;
}

// Componente de item arrastável (Sortable Task Card)
export function SortableTaskCard({
  task,
  onClick,
  onToggleComplete,
  getFormattedDueDate,
  getFrequencyIcon,
  getFrequencyText,
  user,
}: SortableTaskCardProps) {
  // Garantir que id é um número
  const taskId = typeof task.id === "string" ? parseInt(task.id, 10) : task.id;

  // Log para ajudar a identificar problemas
  if (isNaN(taskId)) {
    console.error("ID de tarefa inválido:", task);
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TactileFeedback onClick={onClick} className="w-full">
        <Card
          className={`p-4 relative ${
            task.completed
              ? "bg-gray-50 border-gray-200"
              : "bg-white hover:bg-primary-light/10 border-primary-light"
          } shadow-sm hover:shadow-md transition-all ${isDragging ? "ring-2 ring-primary cursor-grabbing" : "cursor-grab"}`}
        >
          <div className="flex items-start gap-4">
            <motion.div
              className="mt-1 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(task);
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

                {/* Status da tarefa: Concluída */}
                {task.completed ? (
                  <div className="text-xs flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                    <Check className="h-3 w-3 mr-1 flex-shrink-0" />
                    Concluída
                  </div>
                ) : /* Informação sobre atribuição */
                task.assignedTo === null ? (
                  <div className="text-xs flex items-center bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium">
                    <UserIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                    Atribuída a ambos
                  </div>
                ) : (
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
    </div>
  );
}

interface SortableTaskListProps {
  tasks: HouseholdTaskType[];
  onDragEnd: (event: DragEndEvent, tasks: HouseholdTaskType[]) => void;
  onClick: (task: HouseholdTaskType) => void;
  onToggleComplete: (task: HouseholdTaskType) => void;
  getFormattedDueDate: (date: string | Date) => string;
  getFrequencyIcon: (frequency: string) => React.ReactNode;
  getFrequencyText: (frequency: string) => string;
  user?: any;
}

export function SortableTaskList({
  tasks,
  onDragEnd,
  onClick,
  onToggleComplete,
  getFormattedDueDate,
  getFrequencyIcon,
  getFrequencyText,
  user,
}: SortableTaskListProps) {
  const { toast } = useToast();

  // Log para debug
  console.log(
    "SortableTaskList recebeu tarefas:",
    tasks.map((t) => ({ id: t.id, tipo: typeof t.id }))
  );

  // Configure o sensor para detectar arrasto
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Distância mínima para começar a arrastar
      },
    })
  );

  // Preparar os IDs das tarefas para o SortableContext
  const taskIds = tasks
    .map((task) => {
      // Fazer uma validação mais rigorosa dos IDs de tarefas
      if (task.id === undefined || task.id === null) {
        console.error("Tarefa sem ID encontrada:", task);
        return -1;
      }

      // Garantir que todos os IDs são números
      const id =
        typeof task.id === "string" ? parseInt(task.id, 10) : Number(task.id);

      if (isNaN(id) || id <= 0) {
        console.error("ID inválido encontrado:", {
          taskId: task.id,
          taskType: typeof task.id,
          taskValue: task.id,
          convertedId: id,
        });
        return -1; // Valor de fallback para evitar NaN
      }

      return id;
    })
    .filter((id) => id > 0); // Remover IDs inválidos

  // Verificação adicional de segurança
  if (taskIds.length === 0 && tasks.length > 0) {
    console.error(
      "Nenhum ID válido encontrado nas tarefas. Verifique o formato dos dados:",
      tasks
    );
  }

  console.log("Task IDs processados para SortableContext:", taskIds);

  // Wrapper personalizado para onDragEnd
  const handleDragEnd = (event: DragEndEvent) => {
    console.log("DragEnd raw event:", event);

    // Verifique se os IDs são válidos antes de chamar o callback
    const { active, over } = event;
    if (!active || !over) {
      console.error("Evento de arrasto inválido - active ou over ausentes");
      return;
    }

    // Validar IDs antes de processar o evento
    const activeId =
      typeof active.id === "string" ? Number(active.id) : Number(active.id);
    const overId =
      typeof over.id === "string" ? Number(over.id) : Number(over.id);

    if (isNaN(activeId) || isNaN(overId) || activeId <= 0 || overId <= 0) {
      console.error("ID de tarefa inválido no evento de arrasto:", {
        activeId,
        overId,
      });
      toast({
        title: "Erro ao reordenar",
        description: "Identificadores de tarefas inválidos",
        variant: "destructive",
      });
      return;
    }

    // Continuar com o processamento normal
    onDragEnd(event, tasks);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <AnimatedList
          items={tasks}
          keyExtractor={(task) => task.id}
          staggerDelay={0.05}
          className="space-y-4"
          renderItem={(task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onClick(task)}
              onToggleComplete={onToggleComplete}
              getFormattedDueDate={getFormattedDueDate}
              getFrequencyIcon={getFrequencyIcon}
              getFrequencyText={getFrequencyText}
              user={user}
            />
          )}
        />
      </SortableContext>
    </DndContext>
  );
}
