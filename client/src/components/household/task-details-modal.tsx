import { useMutation } from "@tanstack/react-query";
import { HouseholdTaskType, UserType } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Trash2,
  Edit,
  Check,
  RefreshCw,
  BellRing,
  Send,
  User,
  Calendar,
  History,
  ClipboardList,
} from "lucide-react";
import { Star } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil } from "lucide-react";
import EditTaskModal from "./edit-task-modal";
import TaskCompletionHistory from "./task-completion-history";

interface TaskDetailsModalProps {
  task: HouseholdTaskType;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  onToggleComplete: (task: HouseholdTaskType) => void;
  openEditModal: (task: HouseholdTaskType) => void;
}

export default function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onDelete,
  openEditModal,
  onToggleComplete,
}: TaskDetailsModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  // Mutation para enviar lembrete
  const sendReminderMutation = useMutation({
    mutationFn: async ({
      taskId,
      message,
    }: {
      taskId: number;
      message: string;
    }) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/remind`, {
        message,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lembrete enviado",
        description: "O lembrete foi enviado com sucesso para seu parceiro.",
      });
      setReminderDialogOpen(false);
      setReminderMessage("");
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar lembrete",
        description: "Não foi possível enviar o lembrete. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSendingReminder(false);
    },
  });

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    onDelete(task.id);
    setDeleteDialogOpen(false);
  };

  const handleToggleComplete = () => {
    setUpdatingStatus(true);
    onToggleComplete(task);
    // Simular um pequeno atraso para feedback visual
    setTimeout(() => setUpdatingStatus(false), 100);
  };

  const handleOpenReminderDialog = () => {
    setReminderDialogOpen(true);
  };

  const handleSendReminder = () => {
    setSendingReminder(true);
    sendReminderMutation.mutate({
      taskId: task.id,
      message: reminderMessage,
    });
  };

  const getFrequencyText = (frequency: string): string => {
    switch (frequency) {
      case "once":
        return "Uma vez";
      case "daily":
        return "Diária";
      case "weekly":
        return "Semanal";
      case "biweekly":
        return "Quinzenal";
      case "monthly":
        return "Mensal";
      default:
        return frequency;
    }
  };

  const getPriorityText = (priority: number): string => {
    switch (priority) {
      case 0:
        return "Baixa";
      case 1:
        return "Média";
      case 2:
        return "Alta";
      default:
        return "Baixa";
    }
  };

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 0:
        return "bg-blue-100 text-blue-600";
      case 1:
        return "bg-yellow-100 text-yellow-600";
      case 2:
        return "bg-red-100 text-red-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  const isCreatedByUser = task.createdBy === user?.id;
  const isAssignedToUser =
    task.assignedTo === user?.id || task.assignedTo === null;
  const canEdit = isCreatedByUser || isAssignedToUser;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] modal-card max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-title flex flex-wrap items-center gap-2 title-gradient">
              {task.title}
              {task.completed && (
                <Badge variant="outline" className="status-completed">
                  <Check className="h-3 w-3 mr-1" /> Concluída
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {task.description && (
              <div className="bg-primary-light/10 p-4 rounded-lg border border-primary-light/30">
                <h3 className="text-subtitle font-semibold mb-2 text-primary-dark">
                  Descrição
                </h3>
                <p className="text-body text-medium">{task.description}</p>
              </div>
            )}

            <div className="flex flex-col gap-4 p-4 bg-card rounded-lg shadow-card border border-gray-100">
              <h3 className="text-subtitle font-semibold text-dark mb-2">
                Detalhes da Tarefa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50">
                  <div className="bg-primary-light/30 p-2 rounded-full flex-shrink-0">
                    <RefreshCw className="h-4 w-4 text-primary-dark" />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-medium">Frequência</p>
                    <p className="font-medium text-dark truncate">
                      {getFrequencyText(task.frequency)}
                      {task.weekdays && task.frequency === "weekly" && (
                        <span className="ml-1 text-gray-500 text-xs">
                          (
                          {task.weekdays
                            .split(",")
                            .map(
                              (day) =>
                                [
                                  "Dom",
                                  "Seg",
                                  "Ter",
                                  "Qua",
                                  "Qui",
                                  "Sex",
                                  "Sáb",
                                ][parseInt(day)]
                            )
                            .join(", ")}
                          )
                        </span>
                      )}
                      {task.monthDay && task.frequency === "monthly" && (
                        <span className="ml-1 text-gray-500 text-xs">
                          (Dia {task.monthDay})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50">
                    <div className="bg-primary-light/30 p-2 rounded-full flex-shrink-0">
                      <Calendar className="h-4 w-4 text-primary-dark" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs text-medium">Data de vencimento</p>
                      <p className="font-medium text-dark truncate">
                        {format(new Date(task.dueDate), "PPP", {
                          locale: ptBR,
                        })}
                        {task.dueTime && ` às ${task.dueTime}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50">
                  <div className="bg-primary-light/30 p-2 rounded-full flex-shrink-0">
                    <User className="h-4 w-4 text-primary-dark" />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-medium">Atribuída a</p>
                    <p className="font-medium text-dark truncate">
                      {task.assignedTo === user?.id
                        ? "Você"
                        : task.assignedTo === null
                          ? "Você e seu parceiro"
                          : "Seu parceiro"}
                    </p>
                  </div>
                </div>

                {task.createdAt && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50">
                    <div className="bg-primary-light/30 p-2 rounded-full flex-shrink-0">
                      <Calendar className="h-4 w-4 text-primary-dark" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs text-medium">Criada em</p>
                      <p className="font-medium text-dark truncate">
                        {format(new Date(task.createdAt), "PPP", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Prioridade da tarefa */}
                <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50">
                  <div
                    className={`p-2 rounded-full flex-shrink-0 ${
                      task.priority === 2
                        ? "bg-red-100"
                        : task.priority === 1
                          ? "bg-yellow-100"
                          : "bg-blue-100"
                    }`}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        task.priority === 2
                          ? "text-red-600"
                          : task.priority === 1
                            ? "text-yellow-600"
                            : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-medium">Prioridade</p>
                    <p
                      className={`font-medium truncate ${
                        task.priority === 2
                          ? "text-red-600"
                          : task.priority === 1
                            ? "text-yellow-600"
                            : "text-blue-600"
                      }`}
                    >
                      {getPriorityText(task.priority || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t pt-4">
              <div
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer bg-gray-50"
                onClick={handleToggleComplete}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={handleToggleComplete}
                  disabled={updatingStatus || !canEdit}
                  className={`h-5 w-5 rounded-sm flex-shrink-0 ${
                    !task.completed
                      ? "border-primary hover:border-primary-dark"
                      : "text-green-600"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-dark font-medium block text-sm">
                    Status: {task.completed ? "Concluída" : "Pendente"}
                  </span>
                  <p className="text-xs text-medium">
                    Clique para marcar como{" "}
                    <span
                      className={
                        task.completed
                          ? "text-red-500 font-medium"
                          : "text-green-600 font-medium"
                      }
                    >
                      {task.completed ? "pendente" : "concluída"}
                    </span>
                  </p>
                </div>
                {updatingStatus && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2 text-primary flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Tabs para detalhes e histórico */}
            <div className="mt-6 border-t pt-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger
                    value="details"
                    className="flex items-center gap-1.5"
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>Detalhes</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-1.5"
                  >
                    <History className="h-4 w-4" />
                    <span>Histórico</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  {/* Conteúdo já existente sobre os detalhes */}
                  <div className="bg-primary-light/5 p-3 rounded-lg border border-primary-light/20">
                    <p className="text-sm text-muted-foreground">
                      Esta tarefa foi criada por{" "}
                      {isCreatedByUser ? "você" : "seu parceiro"}.
                      {task.assignedTo && (
                        <span className="block mt-1">
                          Atribuída a{" "}
                          {task.assignedTo === null
                            ? "vocês"
                            : task.assignedTo === user?.id
                              ? "você"
                              : "seu parceiro"}
                          .
                        </span>
                      )}
                    </p>
                  </div>

                  {task.nextDueDate && task.frequency !== "once" && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-sm flex items-center gap-1.5 font-medium">
                        <CalendarIcon className="h-4 w-4 text-amber-500" />
                        <span>
                          Próximo vencimento:{" "}
                          {format(new Date(task.nextDueDate), "PPP", {
                            locale: ptBR,
                          })}
                        </span>
                      </p>
                    </div>
                  )}

                  {task.frequency !== "once" && (
                    <div className="bg-primary-light/5 p-3 rounded-lg border border-primary-light/20">
                      <h4 className="text-sm font-semibold mb-2">
                        Detalhes da recorrência
                      </h4>

                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-1.5">
                          <RefreshCw className="h-4 w-4 text-primary" />
                          <span>
                            Frequência: {getFrequencyText(task.frequency)}
                          </span>
                        </p>

                        {(task.frequency === "weekly" ||
                          task.frequency === "biweekly") &&
                          task.weekdays && (
                            <p className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>
                                Dias da semana:{" "}
                                {task.weekdays
                                  .split(",")
                                  .map((day) => {
                                    switch (day.trim()) {
                                      case "0":
                                        return "Dom";
                                      case "1":
                                        return "Seg";
                                      case "2":
                                        return "Ter";
                                      case "3":
                                        return "Qua";
                                      case "4":
                                        return "Qui";
                                      case "5":
                                        return "Sex";
                                      case "6":
                                        return "Sáb";
                                      default:
                                        return "";
                                    }
                                  })
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </p>
                          )}

                        {task.frequency === "monthly" && task.monthDay && (
                          <p className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>Dia do mês: {task.monthDay}</span>
                          </p>
                        )}

                        {task.recurrenceEnd && (
                          <p className="flex items-center gap-1.5">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span>
                              Término da recorrência:{" "}
                              {format(new Date(task.recurrenceEnd), "PPP", {
                                locale: ptBR,
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  {/* Componente de histórico de conclusão */}
                  <TaskCompletionHistory taskId={task.id} userId={user?.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="flex flex-wrap gap-2 mt-4 justify-between sm:justify-end">
            {isCreatedByUser && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="shadow-hover sm:mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            )}

            {/* Botão para enviar lembrete ao parceiro */}
            {user?.partnerId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenReminderDialog}
                className="status-active shadow-hover"
              >
                <BellRing className="h-4 w-4 mr-1" />
                Lembrar Parceiro
              </Button>
            )}

            {/* Botão de edição - será implementado futuramente */}
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(task)}
                className="shadow-hover"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            <Button onClick={onClose} className="btn-gradient shadow-hover">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="modal-card max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-title text-alert">
              Você tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body text-medium">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              tarefa <span className="font-medium">"{task.title}"</span> e todos
              os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="shadow-hover w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 shadow-hover w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para enviar lembrete */}
      <Dialog
        open={reminderDialogOpen}
        onOpenChange={(open) => !open && setReminderDialogOpen(false)}
      >
        <DialogContent className="sm:max-w-[500px] modal-card max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-title title-gradient">
              Enviar lembrete para seu parceiro
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-4 bg-primary-light/20 rounded-lg border border-primary-light/30 shadow-card">
              <h3 className="text-subtitle font-semibold mb-2 text-primary-dark break-words">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-small text-medium break-words">
                  {task.description}
                </p>
              )}
              {task.dueDate && (
                <div className="mt-2 text-xs flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1 text-primary flex-shrink-0" />
                  <span className="font-medium text-primary-dark truncate">
                    {format(new Date(task.dueDate), "PPP", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-body text-medium text-pretty">
                  Escreva uma mensagem personalizada para enviar junto com o
                  lembrete dessa tarefa. Seu parceiro receberá uma notificação
                  com os detalhes da tarefa.
                </p>
              </div>

              <Textarea
                placeholder="Exemplo: Por favor, não se esqueça de realizar esta tarefa até amanhã!"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="min-h-[100px] shadow-input"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setReminderDialogOpen(false)}
              className="shadow-hover w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendReminder}
              disabled={sendingReminder}
              className="btn-gradient shadow-hover w-full sm:w-auto"
            >
              {sendingReminder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Lembrete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
