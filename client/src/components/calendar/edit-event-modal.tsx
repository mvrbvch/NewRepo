import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EventType } from "@/lib/types";
import { Loader2 } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { getCategories } from "@/lib/utils";

interface EditEventModalProps {
  event: EventType;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditEventModal({
  event,
  isOpen,
  onClose,
}: EditEventModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState("");
  const [period, setPeriod] = useState(event.period);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [description, setDescription] = useState(event.description || "");
  const [location, setLocation] = useState(event.location || "");
  const [recurrence, setRecurrence] = useState<
    "never" | "daily" | "weekly" | "monthly" | "custom"
  >(event.recurrence);
  const [emoji, setEmoji] = useState(event.emoji || "");
  const [changeEmoji, setChangeEmoji] = useState(false);
  const [shareWithPartner, setShareWithPartner] = useState(
    event.isShared || false
  );
  const [partnerPermission, setPartnerPermission] = useState<"view" | "edit">(
    (event.sharePermission as "view" | "edit") || "view"
  );
  const [category, setCategory] = useState(event.category || "");

  // Set initial form values when modal opens or event changes
  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title);

      // Format date from event.date which could be string or Date object
      // Remove 'Z' from the ISO string to prevent timezone shift
      let dateStr =
        typeof event.date === "string" ? event.date : event.date.toISOString();
      dateStr = dateStr.replace("Z", "");

      const eventDate = new Date(dateStr);
      setDate(format(eventDate, "yyyy-MM-dd"));

      setPeriod(event.period);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setLocation(event.location || "");
      setRecurrence(event.recurrence);
      setEmoji(event.emoji || "");
      setShareWithPartner(event.isShared || false);
      setPartnerPermission(event.sharePermission || "view");
    }
  }, [isOpen, event]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };
  const isEditable =
    user?.id === event.createdBy ||
    (event.sharePermission === "edit" && event.isShared);

  // Handle period change to adjust default start/end times
  const handlePeriodChange = (value: string) => {
    setPeriod(value as "morning" | "afternoon" | "night" | "allday");

    // Update default times based on selected period
    if (value === "morning") {
      setStartTime("08:00");
      setEndTime("09:00");
    } else if (value === "afternoon") {
      setStartTime("14:00");
      setEndTime("15:00");
    } else {
      setStartTime("19:00");
      setEndTime("20:00");
    }
  };

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await apiRequest("PUT", `/api/events/${event.id}`, eventData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Evento atualizado",
        description: "O evento foi atualizado com sucesso.",
      });

      // Invalidate related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}`] });
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao atualizar evento:", error);
      toast({
        title: "Erro ao atualizar evento",
        description: "Não foi possível atualizar o evento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleRecurrenceChange = (value: string) => {
    setRecurrence(value as any);
  };

  // Update event with form data
  const handleUpdateEvent = () => {
    // Check if user has edit permission
    if (!isEditable) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para editar este evento.",
        variant: "destructive",
      });
      return;
    }

    // Format the data for API request
    const eventData = {
      title,
      date: new Date(date),
      period,
      startTime,
      endTime,
      location: location || null,
      recurrence,
      description,
      emoji: emoji || null,
      isShared: shareWithPartner,
      category,
    };

    // Send update request
    updateEventMutation.mutate(eventData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] modal-card max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-title title-gradient">
            Editar evento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="title">Nome do evento</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião, Aniversário..."
            />
          </div>
          <div>
            <Label className="w-full">Emoji</Label>
            <Button
              variant="outline"
              size={"lg"}
              onClick={(e) => {
                e.preventDefault();
                setChangeEmoji(true);
              }}
              className={`w-full ${emoji ? "text-3xl" : ""}`}
            >
              {emoji || "Selecionar"}
            </Button>
            {changeEmoji && (
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setEmoji(emojiData.emoji);
                  setChangeEmoji(false);
                }}
              />
            )}
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma descrição para o evento"
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {getCategories().events.map((category: any) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="period">Período</Label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger id="period">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Manhã (6h-12h)</SelectItem>
                  <SelectItem value="afternoon">Tarde (12h-18h)</SelectItem>
                  <SelectItem value="night">Noite (18h-0h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime">Hora início</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">Hora fim</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Digite o endereço ou local"
            />
          </div>
          {isEditable && user?.partnerId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="shareWithPartner" className="cursor-pointer">
                  Compartilhar com parceiro
                </Label>
                <Switch
                  id="shareWithPartner"
                  checked={shareWithPartner}
                  onCheckedChange={setShareWithPartner}
                />
              </div>
            </div>
          )}
          {shareWithPartner && (
            <div className="bg-gray-50 p-3 rounded-lg flex flex-wrap items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm">
                {user?.name?.[0] || "P"}
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="text-sm font-medium">Parceiro</div>
                <div className="text-xs text-gray-500">Permissão:</div>
              </div>
              <Select
                value={partnerPermission}
                onValueChange={(value: string) =>
                  setPartnerPermission(value as "view" | "edit")
                }
              >
                <SelectTrigger className="w-[130px] lg:w-[140px]">
                  <SelectValue placeholder="Permissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Pode visualizar</SelectItem>
                  <SelectItem value="edit">Pode editar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateEvent}
            disabled={updateEventMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateEventMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
