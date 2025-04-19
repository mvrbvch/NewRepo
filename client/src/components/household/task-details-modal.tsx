import { useMutation } from "@tanstack/react-query";
import { HouseholdTaskType, UserType } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Trash2, Edit, Check, RefreshCw, BellRing, Send, User, Calendar } from "lucide-react";
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

interface TaskDetailsModalProps {
  task: HouseholdTaskType;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  onToggleComplete: (task: HouseholdTaskType) => void;
}

export default function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onDelete,
  onToggleComplete,
}: TaskDetailsModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  
  // Mutation para enviar lembrete
  const sendReminderMutation = useMutation({
    mutationFn: async ({ taskId, message }: { taskId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/remind`, { message });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lembrete enviado",
        description: "O lembrete foi enviado com sucesso para seu parceiro.",
      });
      setReminderDialogOpen(false);
      setReminderMessage('');
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
    }
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
    setTimeout(() => setUpdatingStatus(false), 500);
  };
  
  const handleOpenReminderDialog = () => {
    setReminderDialogOpen(true);
  };
  
  const handleSendReminder = () => {
    setSendingReminder(true);
    sendReminderMutation.mutate({
      taskId: task.id,
      message: reminderMessage
    });
  };

  const getFrequencyText = (frequency: string): string => {
    switch (frequency) {
      case 'once': return 'Uma vez';
      case 'daily': return 'Diária';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return frequency;
    }
  };

  const isCreatedByUser = task.createdBy === user?.id;
  const isAssignedToUser = task.assignedTo === user?.id || task.assignedTo === null;
  const canEdit = isCreatedByUser || isAssignedToUser;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] modal-card">
          <DialogHeader>
            <DialogTitle className="text-title flex items-center gap-2 title-gradient">
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
                <h3 className="text-subtitle font-semibold mb-2 text-primary-dark">Descrição</h3>
                <p className="text-body text-medium">{task.description}</p>
              </div>
            )}

            <div className="flex flex-col gap-4 p-4 bg-card rounded-lg shadow-card border border-gray-100">
              <h3 className="text-subtitle font-semibold text-dark mb-1">Detalhes da Tarefa</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                  <div className="bg-primary-light/30 p-2 rounded-full">
                    <RefreshCw className="h-4 w-4 text-primary-dark" />
                  </div>
                  <div>
                    <p className="text-xs text-medium">Frequência</p>
                    <p className="font-medium text-dark">{getFrequencyText(task.frequency)}</p>
                  </div>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                    <div className="bg-primary-light/30 p-2 rounded-full">
                      <CalendarIcon className="h-4 w-4 text-primary-dark" />
                    </div>
                    <div>
                      <p className="text-xs text-medium">Data de vencimento</p>
                      <p className="font-medium text-dark">{format(new Date(task.dueDate), 'PPP', { locale: ptBR })}</p>
                    </div>
                  </div>
                )}

                {task.assignedTo && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                    <div className="bg-primary-light/30 p-2 rounded-full">
                      <User className="h-4 w-4 text-primary-dark" />
                    </div>
                    <div>
                      <p className="text-xs text-medium">Atribuída a</p>
                      <p className="font-medium text-dark">{task.assignedTo === user?.id ? 'Você' : 'Seu parceiro'}</p>
                    </div>
                  </div>
                )}

                {task.createdAt && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                    <div className="bg-primary-light/30 p-2 rounded-full">
                      <Calendar className="h-4 w-4 text-primary-dark" />
                    </div>
                    <div>
                      <p className="text-xs text-medium">Criada em</p>
                      <p className="font-medium text-dark">{format(new Date(task.createdAt), 'PPP', { locale: ptBR })}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 border-t pt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer bg-gray-50" onClick={handleToggleComplete}>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={handleToggleComplete}
                  disabled={updatingStatus || !canEdit}
                  className={`h-5 w-5 rounded-sm ${
                    !task.completed 
                      ? "border-primary hover:border-primary-dark" 
                      : "text-green-600"
                  }`}
                />
                <div>
                  <span className="text-dark font-medium">
                    Status: {task.completed ? 'Concluída' : 'Pendente'}
                  </span>
                  <p className="text-xs text-medium">
                    Clique para marcar como {' '}
                    <span className={task.completed ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                      {task.completed ? 'pendente' : 'concluída'}
                    </span>
                  </p>
                </div>
                {updatingStatus && <Loader2 className="h-4 w-4 animate-spin ml-2 text-primary" />}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isCreatedByUser && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="mr-auto shadow-hover"
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
              <Button variant="outline" size="sm" disabled className="shadow-hover">
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            <Button onClick={onClose} className="btn-gradient shadow-hover">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="modal-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-title text-alert">Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-body text-medium">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              tarefa <span className="font-medium">"{task.title}"</span> e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="shadow-hover">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 shadow-hover"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo para enviar lembrete */}
      <Dialog open={reminderDialogOpen} onOpenChange={(open) => !open && setReminderDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px] modal-card">
          <DialogHeader>
            <DialogTitle className="text-title title-gradient">Enviar lembrete para seu parceiro</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-4 bg-primary-light/20 rounded-lg border border-primary-light/30 shadow-card">
              <h3 className="text-subtitle font-semibold mb-2 text-primary-dark">{task.title}</h3>
              {task.description && <p className="text-small text-medium">{task.description}</p>}
              {task.dueDate && (
                <div className="mt-2 text-xs flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1 text-primary" />
                  <span className="font-medium text-primary-dark">
                    {format(new Date(task.dueDate), 'PPP', { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-body text-medium">
                  Escreva uma mensagem personalizada para enviar junto com o lembrete dessa tarefa.
                  Seu parceiro receberá uma notificação com os detalhes da tarefa.
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
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReminderDialogOpen(false)}
              className="shadow-hover"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendReminder}
              disabled={sendingReminder}
              className="btn-gradient shadow-hover"
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