import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { HouseholdTaskType } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Schema de validação para criação de tarefas
const taskFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]),
  assignedTo: z.number().nullable().optional(),
  dueDate: z.date().nullable().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Form com validação Zod
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      frequency: "once",
      assignedTo: user?.id || null,
      dueDate: null,
    },
  });

  // Mutação para criar tarefa
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json() as Promise<HouseholdTaskType>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
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
        description: error?.message || "Não foi possível criar a tarefa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: TaskFormValues) => {
    createTaskMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
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
                    <Input placeholder="Ex: Lavar louça" {...field} />
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
                      placeholder="Descreva a tarefa em detalhes..."
                      {...field}
                      value={field.value || ""}
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
                  <FormLabel>Frequência</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="once">Uma vez</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Com que frequência esta tarefa deve ser realizada?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {user?.partnerId && (
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atribuir a</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString() || user.id.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Quem realizará a tarefa?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={user.id.toString()}>Eu</SelectItem>
                        <SelectItem value={user.partnerId.toString()}>Meu Parceiro</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Data de Vencimento (opcional)</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
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
                        selected={field.value || undefined}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsDatePickerOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createTaskMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
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