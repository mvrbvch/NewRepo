import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { commonEmojis, formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  defaultDate = new Date(),
}: CreateEventModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [period, setPeriod] = useState("morning");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [recurrence, setRecurrence] = useState("never");
  const [emoji, setEmoji] = useState("");
  const [shareWithPartner, setShareWithPartner] = useState(false);
  const [partnerPermission, setPartnerPermission] = useState("view");
  
  // Reset form when modal opens with a new default date
  useEffect(() => {
    if (isOpen) {
      setDate(format(defaultDate, "yyyy-MM-dd"));
      
      // Set default times based on selected period
      if (period === "morning") {
        setStartTime("08:00");
        setEndTime("09:00");
      } else if (period === "afternoon") {
        setStartTime("14:00");
        setEndTime("15:00");
      } else {
        setStartTime("19:00");
        setEndTime("20:00");
      }
    }
  }, [isOpen, defaultDate, period]);
  
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await apiRequest("POST", "/api/events", eventData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Evento criado",
        description: "Seu evento foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateEvent = () => {
    if (!title) {
      toast({
        title: "Erro",
        description: "Por favor, informe um título para o evento.",
        variant: "destructive",
      });
      return;
    }
    
    createEventMutation.mutate({
      title,
      date: new Date(date),
      startTime,
      endTime,
      location: location || undefined,
      emoji: emoji || undefined,
      period,
      recurrence,
      shareWithPartner,
      partnerPermission,
    });
  };
  
  const resetForm = () => {
    setTitle("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setPeriod("morning");
    setStartTime("08:00");
    setEndTime("09:00");
    setLocation("");
    setRecurrence("never");
    setEmoji("");
    setShareWithPartner(false);
    setPartnerPermission("view");
  };
  
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    
    // Update time suggestions based on period
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
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
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
              <Label htmlFor="startTime">Hora de início</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="endTime">Hora de fim</Label>
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
          
          <div>
            <Label htmlFor="recurrence">Repetir</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger id="recurrence">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Nunca</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Emoji</Label>
            <div className="grid grid-cols-6 gap-2 border border-gray-200 rounded-lg p-2 mt-1">
              {commonEmojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`h-8 w-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded ${
                    emoji === em ? 'bg-gray-200' : ''
                  }`}
                  onClick={() => setEmoji(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          
          {/* Show partner sharing option only if user has a partner */}
          {user?.partnerId && (
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
              
              {shareWithPartner && (
                <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm mr-3">
                    {user?.name?.[0] || "P"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Parceiro</div>
                    <div className="text-xs text-gray-500">Permissão:</div>
                  </div>
                  <Select value={partnerPermission} onValueChange={setPartnerPermission}>
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
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateEvent}
            disabled={createEventMutation.isPending}
          >
            {createEventMutation.isPending ? "Salvando..." : "Salvar evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
