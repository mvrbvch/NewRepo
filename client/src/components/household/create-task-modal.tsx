import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { HouseholdTaskType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, ChevronDown } from "lucide-react";
import RecurrenceOptionsSelector, {
  RecurrenceOptionsProps,
} from "./recurrence-options-selector";
import { getCategories } from "@/lib/utils";
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Schema de validação para criação de tarefas
const taskFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  frequency: z.enum(["once", "daily", "weekly", "biweekly", "monthly"]),
  assignedTo: z.union([z.number(), z.literal("both"), z.null()]).optional(),
  dueDate: z.date().nullable().optional(),
  priority: z.number().default(0), // 0: baixa, 1: média, 2: alta
  recurrenceOptions: z
    .object({
      frequency: z.string(),
      weekdays: z.array(z.number()).optional(),
      monthDay: z.number().optional(),
      endDate: z.date().optional().nullable(),
    })
    .optional(),
  category: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function CreateTaskModal({
  isOpen,
  onClose,
}: CreateTaskModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Form com validação Zod
  const form = useForm({
    resolver: zodResolver(taskFormSchema) as Resolver<TaskFormValues>,
    defaultValues: {
      title: "",
      description: "",
      frequency: "once",
      assignedTo: user?.id || null,
      dueDate: null,
      priority: 0, // prioridade baixa por padrão
      category: "generate",
    },
  });

  // Mutação para criar tarefa
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json() as Promise<HouseholdTaskType>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso!",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tarefa",
        description:
          error?.message || "Não foi possível criar a tarefa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const getCategoryByContext = useMutation({
    mutationFn: async (taskData: TaskFormValues) => {
      const response = await apiRequest(
        "POST",
        "/api/tasks/smart-category",
        taskData
      );
      console.log(response);
      return response.json();
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({
        queryKey: ["/api/tasks/smart-category"],
      });
      onClose();
    },
  });

  // Função para formatar array de dias da semana para string
  const formatWeekdays = (weekdays?: number[]): string | null => {
    if (!weekdays || weekdays.length === 0) return null;
    return weekdays.join(",");
  };

  const onSubmit = async (values: TaskFormValues) => {
    // Cria uma cópia dos valores para adicionar propriedades específicas
    const taskData: any = { ...values };
    console.log(taskData, values);
    // Determinar categoria automaticamente, se necessário
    if (values.category === "generate") {
      const response = await getCategoryByContext.mutateAsync({
        title: values.title || "", // Garantir que o título seja uma string
        description: values.description || "", // Garantir que a descrição seja uma string
      });

      taskData.category = response || "personal"; // Default to "personal" if no match
    }

    // Adiciona as opções de recorrência, se disponíveis
    if (values.recurrenceOptions) {
      taskData.weekdays = formatWeekdays(values.recurrenceOptions.weekdays);
      taskData.monthDay = values.recurrenceOptions.monthDay || null;
      taskData.recurrenceEnd = values.recurrenceOptions.endDate || null;
    }

    createTaskMutation.mutate(taskData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] modal-card max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-title title-gradient">
            Criar Nova Tarefa
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-subtitle">Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Lavar louça"
                      {...field}
                      className="shadow-input"
                    />
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
                  <FormLabel className="text-subtitle">
                    Descrição (opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a tarefa em detalhes..."
                      {...field}
                      value={field.value || ""}
                      className="shadow-input min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-subtitle">Frequência</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Inicializar as opções de recorrência quando a frequência muda
                      if (
                        value === "weekly" ||
                        value === "biweekly" ||
                        value === "monthly"
                      ) {
                        form.setValue("recurrenceOptions", {
                          frequency: value,
                          weekdays:
                            value === "weekly" || value === "biweekly"
                              ? [1, 2, 3, 4, 5]
                              : undefined, // Seg a Sex por padrão
                          monthDay: value === "monthly" ? 1 : undefined, // Dia 1 por padrão
                          endDate: null,
                        });
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="shadow-input">
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="once">Uma vez</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="biweekly">Quinzenalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-small text-medium">
                    Com que frequência esta tarefa deve ser realizada?
                  </FormDescription>
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
                          <FormDescription className="text-small text-medium">
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

            {user?.partnerId && (
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-subtitle">Atribuir a</FormLabel>
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
                        <SelectTrigger className="shadow-input">
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
                    <FormDescription className="text-small text-medium">
                      Selecione "Ambos" para criar uma tarefa compartilhada que
                      qualquer um pode completar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-subtitle">
                    Data de Vencimento (opcional)
                  </FormLabel>
                  <Popover
                    open={isDatePickerOpen}
                    onOpenChange={setIsDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal shadow-input ${
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
                    <PopoverContent
                      className="w-auto p-0 modal-card"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsDatePickerOpen(false);
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-small text-medium">
                    Até quando esta tarefa deve ser concluída?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-subtitle">Prioridade</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="shadow-input">
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Baixa</SelectItem>
                      <SelectItem value="1">Média</SelectItem>
                      <SelectItem value="2">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-small text-medium">
                    Qual a prioridade desta tarefa?
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
                  <FormLabel className="text-subtitle">Categoria</FormLabel>
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
                    Escolha uma cateogoria para esta tarefa, ou deixe que nossa
                    IA faça nossa IA faça isso por você.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createTaskMutation.isPending}
                className="shadow-hover w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="btn-gradient shadow-hover w-full sm:w-auto"
              >
                {createTaskMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Tarefa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
