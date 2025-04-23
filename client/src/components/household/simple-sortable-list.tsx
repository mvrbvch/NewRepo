import React from "react";
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
import { HouseholdTaskType } from "@/lib/types";
import { Card } from "@/components/ui/card";

interface SortableItemProps {
  id: number;
  task: HouseholdTaskType;
}

function SortableItem({ id, task }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-4 mb-4 cursor-grab">
        <div className="font-semibold">{task.title}</div>
        {task.description && <div className="text-sm mt-2">{task.description}</div>}
        <div className="text-xs mt-2">
          Priority: {task.priority === 2 ? "Alta" : task.priority === 1 ? "Média" : "Baixa"}
        </div>
      </Card>
    </div>
  );
}

interface SortableListProps {
  tasks: HouseholdTaskType[];
  onDragEnd: (tasks: HouseholdTaskType[]) => void;
}

export function SimpleSortableList({ tasks, onDragEnd }: SortableListProps) {
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = arrayMove(tasks, oldIndex, newIndex);
        onDragEnd(newTasks);
      }
    }
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <SortableItem key={task.id} id={task.id} task={task} />
        ))}
      </SortableContext>
    </DndContext>
  );
}