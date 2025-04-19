import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EventType } from "@/lib/types";
import { Loader2 } from "lucide-react";

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
  const [location, setLocation] = useState(event.location || "");
  const [recurrence, setRecurrence] = useState<'never' | 'daily' | 'weekly' | 'monthly' | 'custom'>(event.recurrence);
  const [emoji, setEmoji] = useState(event.emoji || "");
  const [shareWithPartner, setShareWithPartner] = useState(event.isShared || false);
  const [partnerPermission, setPartnerPermission] = useState<'view' | 'edit'>(event.sharePermission as 'view' | 'edit' || "view");
  
  // Set initial form values when modal opens or event changes
  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title);
      // Format date from event.date which could be string or Date object
      const eventDate = event.date instanceof Date 
        ? event.date 
        : new Date(event.date);
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
  
  // Handle period change to adjust default start/end times
  const handlePeriodChange = (value: string) => {
    setPeriod(value as "morning" | "afternoon" | "night");
    
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
        description: "Ocorreu um erro ao atualizar o evento. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submit
  const handleUpdateEvent = () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o evento.",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare event data
    const eventData = {
      title,
      date,
      period,
      startTime,
      endTime,
      location: location || null,
      recurrence,
      emoji: emoji || null,
    };
    
    // Send update request
    updateEventMutation.mutate(eventData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
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
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div className="flex-1">
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
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="startTime">Hora início</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex-1">
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
            <Label htmlFor="location">Local (opcional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Sala de reuniões, Restaurante..."
            />
          </div>
          
          <div>
            <Label htmlFor="emoji">Emoji (opcional)</Label>
            <Input
              id="emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Ex: 🎂, 🏋️‍♂️, 🍔..."
              maxLength={2}
            />
          </div>
          
          <div>
            <Label htmlFor="recurrence">Repetição</Label>
            <Select 
              value={recurrence} 
              onValueChange={(value: string) => setRecurrence(value as 'never' | 'daily' | 'weekly' | 'monthly' | 'custom')}
            >
              <SelectTrigger id="recurrence">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Não repetir</SelectItem>
                <SelectItem value="daily">Todos os dias</SelectItem>
                <SelectItem value="weekly">Todas as semanas</SelectItem>
                <SelectItem value="monthly">Todos os meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="shareWithPartner" 
              checked={shareWithPartner}
              onCheckedChange={(checked) => setShareWithPartner(!!checked)}
            />
            <Label htmlFor="shareWithPartner">
              Compartilhar com parceiro
            </Label>
          </div>
          
          {shareWithPartner && (
            <div className="bg-gray-50 p-3 rounded-lg flex items-center">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm mr-3">
                {user?.name?.[0] || "P"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Parceiro</div>
                <div className="text-xs text-gray-500">Permissão:</div>
              </div>
              <Select 
                value={partnerPermission} 
                onValueChange={(value: string) => setPartnerPermission(value as 'view' | 'edit')}
              >
                <SelectTrigger className="w-[140px]">
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
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateEvent}
            disabled={updateEventMutation.isPending}
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