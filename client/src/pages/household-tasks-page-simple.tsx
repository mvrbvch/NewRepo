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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, GripVertical } from "lucide-react";
import { Link } from "wouter";

// Task item that can be dragged
interface SortableTaskItemProps {
  id: number;
  task: HouseholdTaskType;
}

function SortableTaskItem({ id, task }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4 relative group">
      <Card className={`p-4 relative ${isDragging ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center gap-4">
          <Checkbox checked={task.completed} className="h-5 w-5" />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
          </div>

          {/* Drag handle */}
          <div 
            className="opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing" 
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function HouseholdTasksPageSimple() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<HouseholdTaskType[]>({
    queryKey: ["/api/tasks"],
  });

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Mutation for reordering tasks
  const reorderTasksMutation = useMutation({
    mutationFn: async (tasks: { id: number; position: number }[]) => {
      const response = await apiRequest("PUT", "/api/tasks/reorder", {
        tasks,
      });
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
      console.error("Error reordering tasks:", error);
      toast({
        title: "Erro ao reordenar tarefas",
        description: "Não foi possível atualizar a ordem das tarefas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handle the end of a drag operation
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    // If order hasn't changed, do nothing
    if (active.id === over.id) return;

    console.log("Drag end event:", { active, over });

    // Make sure IDs are valid numbers
    const activeId = typeof active.id === 'string' ? parseInt(active.id, 10) : Number(active.id);
    const overId = typeof over.id === 'string' ? parseInt(over.id, 10) : Number(over.id);
    
    if (isNaN(activeId) || isNaN(overId)) {
      console.error("Invalid task IDs in drag operation", { active, over });
      toast({
        title: "Erro ao reordenar",
        description: "IDs de tarefas inválidos. Por favor, tente novamente.",
        variant: "destructive"
      });
      return;
    }

    // Find the tasks in our active tasks list
    const activeTasks = tasks.filter(task => !task.completed);
    
    // Find the indices in the filtered list
    const oldIndex = activeTasks.findIndex((task) => task.id === activeId);
    const newIndex = activeTasks.findIndex((task) => task.id === overId);

    if (oldIndex < 0 || newIndex < 0) {
      console.error("Could not find task indices", { 
        oldIndex, 
        newIndex, 
        activeId,
        overId,
        activeTasks: activeTasks.map(t => t.id) 
      });
      return;
    }

    // Reorganize the task array
    const updatedTasks = arrayMove(activeTasks, oldIndex, newIndex);

    // Prepare data to update in the database - only include tasks we've actually reordered
    const taskUpdates = updatedTasks.map((task, index) => ({
      id: task.id,
      position: index
    }));

    // Validate all IDs are valid integers before sending
    const validTaskUpdates = taskUpdates.filter(update => 
      Number.isInteger(update.id) && 
      !isNaN(update.id) && 
      Number.isInteger(update.position) && 
      !isNaN(update.position)
    );

    // If we lost any tasks due to invalid IDs, log an error
    if (validTaskUpdates.length !== taskUpdates.length) {
      console.error("Some tasks were filtered out due to invalid IDs", {
        original: taskUpdates,
        filtered: validTaskUpdates
      });
    }

    // Call the mutation to save the order to the database
    console.log("Sending task updates:", validTaskUpdates);
    
    if (validTaskUpdates.length > 0) {
      reorderTasksMutation.mutate(validTaskUpdates);
    } else {
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível identificar as tarefas para reordenar.",
        variant: "destructive"
      });
    }
  }

  // Get only active (not completed) tasks for reordering
  const activeTasks = tasks.filter(task => !task.completed);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex items-center p-4 bg-white border-b" style={{ marginTop: 100 }}>
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
            Arraste as tarefas para reorganizá-las na sua lista de prioridades.
            As alterações serão salvas automaticamente.
          </p>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : activeTasks.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-500">Nenhuma tarefa pendente para organizar.</p>
            </Card>
          ) : (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {activeTasks.map(task => (
                  <SortableTaskItem key={task.id} id={task.id} task={task} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}