import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EventType, EventCommentType } from "@/lib/types";
import { formatDate, formatTime, periodLabels } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import EditEventModal from "./edit-event-modal";

interface EventDetailsModalProps {
  event: EventType;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
}: EventDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Determine background color based on period
  const periodColor =
    event.period === "morning"
      ? "bg-orange-500/10"
      : event.period === "afternoon"
        ? "bg-blue-500/10"
        : "bg-purple-700/10";

  // Format date for display, adjusting for timezone
  const formattedDate = event.date
    ? format(
        new Date(
          typeof event.date === "string"
            ? event.date.replace("Z", "")
            : event.date.toISOString().replace("Z", ""),
        ), // Remove Z to keep local time instead of UTC
        "EEEE, d 'de' MMMM yyyy",
        { locale: ptBR },
      )
    : "";

  // Duration calculation
  const startParts = event.startTime.split(":").map(Number);
  const endParts = event.endTime.split(":").map(Number);
  const startMinutes = startParts[0] * 60 + startParts[1];
  const endMinutes = endParts[0] * 60 + endParts[1];
  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes < 0) durationMinutes += 24 * 60; // If end time is next day
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  const durationText =
    durationHours > 0
      ? `${durationHours}h ${remainingMinutes > 0 ? `${remainingMinutes}min` : ""}`
      : `${remainingMinutes}min`;

  // Fetch event details including comments
  const { data: eventDetails, isLoading } = useQuery({
    queryKey: [`/api/events/${event.id}`],
    enabled: isOpen && !!event.id,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/events/${event.id}/comments`, {
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso!",
      });
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}`] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description:
          "Não foi possível adicionar o comentário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/events/${event.id}`, {});
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };

  const handleDeleteEvent = () => {
    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
      deleteEventMutation.mutate();
    }
  };

  // Define types for the event details
  type EventDetailsType = {
    comments: EventCommentType[];
    shares: any[];
    event: EventType;
  };

  const comments = (eventDetails as EventDetailsType)?.comments || [];
  const shares = (eventDetails as EventDetailsType)?.shares || [];

  // Handle edit button click
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className={`p-4 border-b ${periodColor}`}>
            <DialogTitle className="flex items-center">
              <span className="mr-2">{event.emoji || "📅"}</span>
              <span>{event.title}</span>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="p-6 space-y-4">
                <div className="flex items-center text-gray-700">
                  <span className="material-icons mr-3">schedule</span>
                  <div>
                    <div>{formattedDate}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(event.startTime)} -{" "}
                      {formatTime(event.endTime)} ({durationText})
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="flex items-center text-gray-700">
                    <span className="material-icons mr-3">book</span>
                    <div
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    ></div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center text-gray-700">
                    <span className="material-icons mr-3">location_on</span>
                    <div>{event.location}</div>
                  </div>
                )}

                {event.recurrence && event.recurrence !== "never" && (
                  <div className="flex items-center text-gray-700">
                    <span className="material-icons mr-3">repeat</span>
                    <div>
                      {event.recurrence === "daily" && "Diariamente"}
                      {event.recurrence === "weekly" && "Semanalmente"}
                      {event.recurrence === "monthly" && "Mensalmente"}
                      {event.recurrence === "custom" && "Personalizado"}
                    </div>
                  </div>
                )}

                {event.isShared && (
                  <div className="flex items-center text-gray-700">
                    <span className="material-icons text-secondary mr-3">
                      favorite
                    </span>
                    <div>
                      <div>Compartilhado</div>
                      <div className="text-sm text-gray-500">
                        {event.sharePermission === "edit"
                          ? "Pode editar"
                          : "Pode visualizar"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Conversa</h3>

                  {comments.length === 0 ? (
                    <div className="text-center text-gray-500 my-4">
                      Sem comentários ainda. Seja o primeiro a comentar!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                      {comments.map((comment: EventCommentType) => (
                        <div
                          key={comment.id}
                          className="bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex items-start mb-1">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm mr-2">
                              {user?.name?.[0] || "U"}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {user?.name}
                              </div>
                              <div className="text-sm">{comment.content}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 ml-10">
                            {format(new Date(comment.createdAt), "HH:mm")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex mt-3">
                    <Input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Escreva uma mensagem..."
                      className="flex-1 rounded-r-none"
                    />
                    <Button
                      className="rounded-l-none"
                      onClick={handleAddComment}
                      disabled={addCommentMutation.isPending || !comment.trim()}
                    >
                      {addCommentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="material-icons">send</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 flex items-center justify-center"
                  onClick={handleEditClick}
                >
                  <span className="material-icons mr-1">edit</span>
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDeleteEvent}
                  disabled={deleteEventMutation.isPending}
                >
                  {deleteEventMutation.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <span className="material-icons mr-1">delete</span>
                  )}
                  Excluir
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <EditEventModal
        event={event}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
      />
    </>
  );
}
