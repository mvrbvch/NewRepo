import * as React from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Check,
  AlertCircle,
  User as UserIcon,
  Star,
  GripVertical
} from "lucide-react";
import { isBefore } from 'date-fns';

interface SortableItemProps {
  id: number;
  task: HouseholdTaskType;
  onClick: (task: HouseholdTaskType) => void;
  onToggleComplete: (task: HouseholdTaskType) => void;
  getFormattedDueDate: (date: string | Date) => string;
  user?: any;
}

function SortableItem({ 
  id, 
  task, 
  onClick, 
  onToggleComplete, 
  getFormattedDueDate,
  user
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: Number(id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4 relative group">
      <Card
        className={`p-4 relative ${
          task.completed
            ? "bg-gray-50 border-gray-200"
            : "bg-white hover:bg-primary-light/10 border-primary-light"
        } shadow-sm hover:shadow-md transition-all ${isDragging ? 'ring-2 ring-primary' : ''}`}
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
          
          <div 
            className="flex-1 min-w-0"
            onClick={() => onClick(task)}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3
                className={`font-semibold text-lg break-words ${
                  task.completed ? "line-through text-gray-500" : "text-dark"
                }`}
              >
                {task.title}
              </h3>
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

              {/* Completed status */}
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

              {/* Priority indicator */}
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

          {/* Drag handle */}
          <div 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing" 
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

interface SortableListProps {
  tasks: HouseholdTaskType[];
  onDragEnd: (event: DragEndEvent) => void;
  onClick: (task: HouseholdTaskType) => void;
  onToggleComplete: (task: HouseholdTaskType) => void;
  getFormattedDueDate: (date: string | Date) => string;
  user?: any;
}

export function SimpleSortableList({ 
  tasks, 
  onDragEnd,
  onClick,
  onToggleComplete,
  getFormattedDueDate,
  user
}: SortableListProps) {
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
    onDragEnd(event);
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map(t => Number(t.id))} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <SortableItem 
            key={task.id} 
            id={task.id} 
            task={task}
            onClick={onClick}
            onToggleComplete={onToggleComplete}
            getFormattedDueDate={getFormattedDueDate}
            user={user}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}