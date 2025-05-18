import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { HouseholdTaskType } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import RecurrenceOptionsSelector, {
  RecurrenceOptionsProps,
} from "./recurrence-options-selector";
import { getCategories } from "@/lib/utils";
import { ReminderForm } from "../shared/ReminderForm";

// Form schema
const taskFormSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  dueTime: z.string().optional().nullable(),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "biweekly"]),
  assignedTo: z.union([z.number(), z.literal("both"), z.null()]).optional(),
  priority: z.enum(["0", "1", "2"]),
  category: z.string().optional(),
  recurrenceOptions: z
    .object({
      frequency: z.string(),
      weekdays: z.array(z.number()).optional(),
      monthDay: z.number().optional(),
      endDate: z.date().optional().nullable(),
    })
    .optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: (task: HouseholdTaskType) => void;
  task: HouseholdTaskType;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
}: EditTaskModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with task data
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      dueTime: task.dueTime || null,
      frequency: task.frequency || "once",
      priority: (task.priority?.toString() as "0" | "1" | "2") || "0",
      assignedTo:
        task.assignedTo === user?.partnerId
          ? user?.partnerId
          : task.assignedTo === user?.id
            ? user?.id
            : "both",
      category: task.category || "personal",
    },
  });

  // Processar weekdays do formato de string para array de números
  const parseWeekdays = (weekdaysStr: string | null): number[] | undefined => {
    if (!weekdaysStr) return undefined;
    try {
      return weekdaysStr.split(",").map((day) => parseInt(day.trim(), 10));
    } catch (e) {
      console.error("Erro ao processar dias da semana:", e);
      return undefined;
    }
  };

  // Update form values when task changes
  useEffect(() => {
    if (task) {
      // Preparar opções de recorrência se necessário
      const recurrenceOptions =
        task.frequency === "weekly" ||
        task.frequency === "biweekly" ||
        task.frequency === "monthly"
          ? {
              frequency: task.frequency,
              weekdays: parseWeekdays(task.weekdays),
              monthDay: task.monthDay || undefined,
              endDate: task.recurrenceEnd ? new Date(task.recurrenceEnd) : null,
            }
          : undefined;

      form.reset({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        dueTime: task.dueTime || null,
        frequency: task.frequency || "once",
        priority: (task.priority?.toString() as "0" | "1" | "2") || "0",
        assignedTo:
          task.assignedTo === user?.partnerId
            ? user?.partnerId
            : task.assignedTo === user?.id
              ? user?.id
              : "both",
        recurrenceOptions,
        category: task.category || "personal",
      });
    }
  }, [task, form, user?.partnerId]);

  // Get partner data if available
  const { data: partner } = useQuery({
    queryKey: ["/api/tasks/partner"],
    enabled: !!user?.partnerId,
  });
  console.log(partner);
  // Get tasks data

  // Função para converter array de dias da semana para string
  const formatWeekdays = (weekdays?: number[]): string | null => {
    if (!weekdays || weekdays.length === 0) return null;
    return weekdays.join(",");
  };

  // Mutation to update task
  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      // Prepara os dados de recorrência extras se necessário
      const recurrenceOptions = data.recurrenceOptions;

      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        frequency: data.frequency,
        priority: parseInt(data.priority),
        assignedTo: data.assignedTo === "both" ? null : data.assignedTo,
        // Adiciona campos de recorrência se disponíveis
        weekdays: recurrenceOptions
          ? formatWeekdays(recurrenceOptions.weekdays)
          : null,
        monthDay: recurrenceOptions?.monthDay || null,
        recurrenceEnd: recurrenceOptions?.endDate || null,
        category: data.category || "personal",
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/partner"] });
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar tarefa:", error);
      toast({
        title: "Erro ao atualizar tarefa",
        description: "Não foi possível atualizar a tarefa. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const getCategoryByContext = useMutation({
    mutationFn: async (taskData: { title: string; description?: string }) => {
      const response = await apiRequest(
        "POST",
        "/api/tasks/smart-category",
        taskData
      );
      return response.json();
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);

    // Prepara objeto para passar para onClose
    const updatedTask: HouseholdTaskType = {
      ...task,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate || null,
      dueTime: data.dueTime || null,
      frequency: data.frequency,
      priority: parseInt(data.priority),
      assignedTo: data.assignedTo === "both" ? null : data.assignedTo,
      category: data.category || "personal",
    };

    // Determinar categoria automaticamente, se necessário
    if (data.category === "generate") {
      const response = await getCategoryByContext.mutateAsync({
        title: data.title,
        description: data.description,
      });
      data.category = response || "personal"; // Default to "personal" if no match
    }

    // Adiciona opções de recorrência adicionais, se disponíveis
    if (data.recurrenceOptions) {
      updatedTask.weekdays = formatWeekdays(data.recurrenceOptions.weekdays);
      updatedTask.monthDay = data.recurrenceOptions.monthDay || null;
      updatedTask.recurrenceEnd = data.recurrenceOptions.endDate || null;
    }

    onClose(updatedTask);
    updateTaskMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(task)}>
      <DialogContent className="sm:max-w-[425px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lavar a louça" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre a tarefa"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Inicializar as opções de recorrência quando a frequência muda
                      form.setValue("recurrenceOptions", {
                        frequency: value,
                        weekdays:
                          value === "weekly" || value === "biweekly"
                            ? [1, 2, 3, 4, 5]
                            : undefined, // Seg a Sex por padrão
                        monthDay: value === "monthly" ? 1 : undefined, // Dia 1 por padrão
                        endDate: null,
                      });
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="once">Uma vez</SelectItem>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("frequency") !== "once" &&
              form.watch("frequency") !== "daily" && (
                <Collapsible className="space-y-2 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                      Opções de recorrência
                    </h4>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="recurrenceOptions"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RecurrenceOptionsSelector
                              options={
                                field.value || {
                                  frequency: form.watch("frequency"),
                                  weekdays: [1, 2, 3, 4, 5], // Seg a Sex
                                  monthDay: 1,
                                  endDate: null,
                                }
                              }
                              onChange={(newOptions) => {
                                field.onChange(newOptions);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Configure opções adicionais de recorrência para esta
                            tarefa.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              )}

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Baixa</SelectItem>
                      <SelectItem value="1">Média</SelectItem>
                      <SelectItem value="2">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atribuir a</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (value === "both") {
                        field.onChange(null); // Usar null para indicar atribuição a ambos
                      } else {
                        field.onChange(parseInt(value));
                      }
                    }}
                    defaultValue={
                      field.value === null
                        ? "both"
                        : field.value?.toString() || user.id.toString()
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Quem realizará a tarefa?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={user.id.toString()}>Eu</SelectItem>
                      <SelectItem value={user.partnerId?.toString() || ""}>
                        Meu Parceiro
                      </SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione "Ambos" para criar uma tarefa compartilhada que
                    qualquer um pode completar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="shadow-input" id="category">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="generate">
                        Identificar automaticamente
                      </SelectItem>
                      {getCategories().tasks.map((category: any) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-small text-medium">
                    Escolha uma categoria para esta tarefa, ou deixe que nossa
                    IA faça isso por você!.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Collapsible className="space-y-2 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Lembretes</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-4">
                <ReminderForm type="task" id={task?.id} onCreated={(e) => {}} />
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(task)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin mt-1" />
                    Salvando...
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
