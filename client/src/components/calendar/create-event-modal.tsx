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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { commonEmojis, formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "../ui/textarea";
import EmojiPicker from "emoji-picker-react";
import RecurrenceOptionsSelector, {
  RecurrenceOptionsProps,
} from "@/components/household/recurrence-options-selector";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// Schema de validação para criação de eventos
const eventFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  emoji: z.string().optional(),
  period: z.enum(["morning", "afternoon", "night"]),
  recurrence: z.enum(["never", "daily", "weekly", "monthly", "custom"]),
  recurrenceOptions: z
    .object({
      frequency: z.string(),
      weekdays: z.array(z.number()).optional(),
      monthDay: z.number().optional(),
      endDate: z.date().optional().nullable(),
    })
    .optional(),
  shareWithPartner: z.boolean(),
  partnerPermission: z.enum(["view", "edit"]).optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

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
  const [changeEmoji, setChangeEmoji] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(defaultDate, "yyyy-MM-dd"),
      startTime: "08:00",
      endTime: "09:00",
      location: "",
      emoji: "",
      period: "morning",
      recurrence: "never",
      shareWithPartner: false,
      partnerPermission: "view",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      const res = await apiRequest("POST", "/api/events", eventData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Evento criado",
        description: "Seu evento foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      form.reset();
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

  const onSubmit = (values: EventFormValues) => {
    createEventMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] modal-card max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-title title-gradient">
            Criar Novo Evento
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do evento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Reunião, Aniversário..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emoji</FormLabel>
                  <Button
                    variant="outline"
                    size={"lg"}
                    onClick={() => setChangeEmoji(true)}
                    className={`w-full sm:w-auto ${field.value ? "text-3xl" : ""}`}
                  >
                    {field.value || "Selecionar"}
                  </Button>
                  {changeEmoji && (
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        field.onChange(emojiData.emoji);
                        setChangeEmoji(false);
                      }}
                    />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "morning") {
                        form.setValue("startTime", "08:00");
                        form.setValue("endTime", "09:00");
                      } else if (value === "afternoon") {
                        form.setValue("startTime", "14:00");
                        form.setValue("endTime", "15:00");
                      } else {
                        form.setValue("startTime", "19:00");
                        form.setValue("endTime", "20:00");
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">Manhã (6h-12h)</SelectItem>
                      <SelectItem value="afternoon">Tarde (12h-18h)</SelectItem>
                      <SelectItem value="night">Noite (18h-0h)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repetir</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "custom") {
                        form.setValue("recurrenceOptions", {
                          frequency: "custom",
                        });
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.watch("recurrence") === "custom" && (
                    <RecurrenceOptionsSelector
                      options={
                        form.watch("recurrenceOptions") || {
                          frequency: "custom",
                        }
                      }
                      onChange={(newOptions) =>
                        form.setValue("recurrenceOptions", newOptions)
                      }
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createEventMutation.isPending
                  ? "Salvando..."
                  : "Salvar evento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
