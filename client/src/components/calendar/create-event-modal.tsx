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
import { commonEmojis, formatDate, getCategories } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format, set } from "date-fns";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

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
  category: z.string().optional(),
  isSpecial: z.boolean().optional(),
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
  const [isSpecial, setIsSpecial] = useState(false); // Example: Replace with actual logic

  const [isEditable, setIsEditable] = useState(true); // Example: Replace with actual logic
  const [shareWithPartner, setShareWithPartner] = useState(false);
  const [partnerPermission, setPartnerPermission] = useState<"view" | "edit">(
    "view"
  );

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(defaultDate, "yyyy-MM-dd"),
      startTime: "08:00",
      endTime: "09:00",
      location: "",
      emoji: "📅",
      period: "morning",
      recurrence: "never",
      shareWithPartner: false,
      partnerPermission: "view",
      category: "",
      isSpecial: false,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      const newEventData = {
        ...eventData,
        isShared: shareWithPartner,
        partnerPermission,
        shareWithPartner,
        isSpecial,
      };

      const res = await apiRequest("POST", "/api/events", newEventData);
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
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
                  <FormLabel className="w-full">Emoji</FormLabel>
                  <Button
                    variant="outline"
                    size={"lg"}
                    onClick={(e) => {
                      e.preventDefault();
                      setChangeEmoji(true);
                    }}
                    className={`w-full ${field.value ? "text-3xl" : ""}`}
                  >
                    {field.value || "Selecionar"}
                  </Button>
                  {changeEmoji && (
                    <div className={`w-full sm:w-auto`}>
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          field.onChange(emojiData.emoji);
                          setChangeEmoji(false);
                        }}
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite uma descrição para o evento"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Inicializar as opções de recorrência quando a frequência muda
                      if (
                        value === "weekly" ||
                        value === "monthly" ||
                        value === "custom"
                      ) {
                        form.setValue("recurrenceOptions", {
                          frequency: value,
                          weekdays:
                            value === "weekly" ? [1, 2, 3, 4, 5] : undefined, // Seg a Sex por padrão
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
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-small text-medium">
                    Com que frequência este evento deve ser realizado?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("recurrence") !== "never" &&
              form.watch("recurrence") !== "daily" && (
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
                                  frequency: form.watch("recurrence"),
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
                            Configure opções adicionais de recorrência para este
                            evento.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              )}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getCategories().events.map((category: any) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <SelectItem value="afternoon">
                          Tarde (12h-18h)
                        </SelectItem>
                        <SelectItem value="night">Noite (18h-0h)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora fim</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o endereço ou local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      onValueChange={(value) =>
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
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="isSpecial" className="cursor-pointer">
                  Evento especial:
                </Label>
                <Switch
                  id="isSpecial"
                  checked={isSpecial}
                  onCheckedChange={setIsSpecial}
                />
              </div>
            </div>

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
