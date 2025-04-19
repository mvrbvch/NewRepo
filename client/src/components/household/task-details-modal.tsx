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
import { CalendarIcon, Loader2, Trash2, Edit, Check, RefreshCw, BellRing, Send } from "lucide-react";
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {task.title}
              {task.completed && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3 mr-1" /> Concluída
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {task.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">Descrição</h3>
                <p className="text-gray-700">{task.description}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Frequência:</span>
                <span>{getFrequencyText(task.frequency)}</span>
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Data de vencimento:</span>
                  <span>{format(new Date(task.dueDate), 'PPP', { locale: ptBR })}</span>
                </div>
              )}

              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <span className="material-icons text-gray-500 text-sm">person</span>
                  <span className="font-medium">Atribuída a:</span>
                  <span>{task.assignedTo === user?.id ? 'Você' : 'Seu parceiro'}</span>
                </div>
              )}

              {task.createdAt && (
                <div className="flex items-center gap-2">
                  <span className="material-icons text-gray-500 text-sm">event_available</span>
                  <span className="font-medium">Criada em:</span>
                  <span>{format(new Date(task.createdAt), 'PPP', { locale: ptBR })}</span>
                </div>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={handleToggleComplete}
                  disabled={updatingStatus || !canEdit}
                  className="h-5 w-5"
                />
                <span>Marcar como {task.completed ? 'pendente' : 'concluída'}</span>
                {updatingStatus && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isCreatedByUser && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="mr-auto"
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
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                <BellRing className="h-4 w-4 mr-1" />
                Lembrar Parceiro
              </Button>
            )}
            
            {/* Botão de edição - será implementado futuramente */}
            {canEdit && (
              <Button variant="outline" size="sm" disabled>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              tarefa "{task.title}" e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo para enviar lembrete */}
      <Dialog open={reminderDialogOpen} onOpenChange={(open) => !open && setReminderDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar lembrete para seu parceiro</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
              <h3 className="font-medium mb-1">{task.title}</h3>
              {task.description && <p className="text-sm text-gray-700">{task.description}</p>}
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Escreva uma mensagem personalizada para enviar junto com o lembrete dessa tarefa.
                Seu parceiro receberá um e-mail com os detalhes da tarefa.
              </p>
              
              <Textarea
                placeholder="Exemplo: Por favor, não se esqueça de realizar esta tarefa até amanhã!"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReminderDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendReminder}
              disabled={sendingReminder}
              className="bg-blue-600 hover:bg-blue-700"
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