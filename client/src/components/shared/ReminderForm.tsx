// ReminderForm.tsx
import React, { useState, useEffect } from "react";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReminderType = "push" | "email" | "both";
type ReminderTime =
  | "10min"
  | "30min"
  | "1hour"
  | "2hours"
  | "1day"
  | "2days"
  | "1week"
  | "now";

interface Reminder {
  id: number;
  reminderType: ReminderType;
  reminderTime: ReminderTime;
  customMessage?: string;
}

interface ReminderFormProps {
  type: "event" | "task";
  id: number;
  onCreated?: (reminders: any[]) => void;
  pendingReminders?: any[];
  mode?: "pending" | "api";
}

export const ReminderForm: React.FC<ReminderFormProps> = ({
  type,
  id,
  onCreated,
  pendingReminders,
  mode = "api",
}) => {
  const [reminderType, setReminderType] = useState<ReminderType>("push");
  const [reminderTime, setReminderTime] = useState<ReminderTime>("1hour");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fetch existing reminders
  useEffect(() => {
    if (mode === "pending" && pendingReminders) {
      setReminders(pendingReminders);
    } else if (mode === "api" && id) {
      const fetchReminders = async () => {
        const url =
          type === "event"
            ? `/api/events/${id}/reminders`
            : `/api/tasks/${id}/reminders`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setReminders(data.reminders || []);
        }
      };
      fetchReminders();
    }
  }, [id, type, mode, pendingReminders]);

  const handleSave = async () => {
    if (mode === "pending") {
      const newReminder = {
        id: Date.now(),
        reminderType,
        reminderTime,
        customMessage,
      };
      const updated = editingId
        ? reminders.map((r) => (r.id === editingId ? newReminder : r))
        : [...reminders, newReminder];
      setReminders(updated);
      setEditingId(null);
      setReminderType("push");
      setReminderTime("1hour");
      setCustomMessage("");
      if (onCreated) onCreated(updated);
      setResult(editingId ? "Lembrete atualizado!" : "Lembrete adicionado!");
      return;
    }

    setLoading(true);
    setResult(null);

    const url =
      type === "event"
        ? `/api/events/${id}/reminders${editingId ? `/${editingId}` : ""}`
        : `/api/tasks/${editingId ? `/${editingId}` : `${id}/reminders`}`;

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: id,
        reminderType,
        reminderTime,
        message: customMessage || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setResult(
        editingId ? "Lembrete atualizado!" : "Lembrete criado com sucesso!"
      );
      setEditingId(null);
      setReminderType("push");
      setReminderTime("1hour");
      setCustomMessage("");
      setReminders(data.reminders || []);
      if (onCreated) onCreated(data.reminders);
    } else {
      setResult(data.message || "Erro ao salvar lembrete");
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setReminderType(reminder.reminderType);
    setReminderTime(reminder.reminderTime);
    setCustomMessage(reminder.customMessage || "");
  };

  const handleDelete = async (reminderId: number) => {
    if (mode === "pending") {
      const updated = reminders.filter((r) => r.id !== reminderId);
      setReminders(updated);
      if (onCreated) onCreated(updated);
      setResult("Lembrete removido!");
      return;
    }
    const url =
      type === "event"
        ? `/api/events/${id}/reminders/${reminderId}`
        : `/api/tasks/reminders/${reminderId}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      const updated = reminders.filter((r) => r.id !== reminderId);
      setReminders(updated);
      if (onCreated) onCreated(updated);
      setResult("Lembrete removido!");
    } else {
      setResult("Erro ao remover lembrete");
    }
  };

  return (
    <div>
      <div className="space-y-4">
        <FormItem>
          <FormLabel>Tipo de lembrete</FormLabel>
          <FormControl>
            <Select
              value={reminderType}
              onValueChange={(value) => setReminderType(value as ReminderType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="both">Push + Email</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>
            Escolha como deseja receber o lembrete.
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Quando enviar</FormLabel>
          <FormControl>
            <Select
              value={reminderTime}
              onValueChange={(value) => setReminderTime(value as ReminderTime)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o momento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10min">10 minutos antes</SelectItem>
                <SelectItem value="30min">30 minutos antes</SelectItem>
                <SelectItem value="1hour">1 hora antes</SelectItem>
                <SelectItem value="2hours">2 horas antes</SelectItem>
                <SelectItem value="1day">1 dia antes</SelectItem>
                <SelectItem value="2days">2 dias antes</SelectItem>
                <SelectItem value="1week">1 semana antes</SelectItem>
                <SelectItem value="now">Enviar agora</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>
            Defina quando o lembrete será enviado.
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Mensagem personalizada</FormLabel>
          <FormControl>
            <Input
              id="customMessage"
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Opcional"
            />
          </FormControl>
          <FormDescription>
            Escreva uma mensagem personalizada para o lembrete.
          </FormDescription>
          <FormMessage />
        </FormItem>

        <Button
          type="button"
          className="w-full"
          disabled={loading}
          onClick={handleSave}
        >
          {loading
            ? editingId
              ? "Salvando..."
              : "Enviando..."
            : editingId
              ? "Salvar alterações"
              : "Criar lembrete"}
        </Button>
        {result && <div className="text-center text-sm mt-2">{result}</div>}
      </div>

      {reminders.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2 text-sm">Lembretes criados</h4>
          <ul className="space-y-2">
            {reminders.map((reminder) => (
              <li
                key={reminder.id}
                className="flex items-center justify-between border rounded-md px-3 py-2"
              >
                <div>
                  <div className="text-xs text-muted-foreground">
                    {reminder.reminderType === "push"
                      ? "Push"
                      : reminder.reminderType === "email"
                        ? "Email"
                        : "Push + Email"}
                    {" • "}
                    {(() => {
                      switch (reminder.reminderTime) {
                        case "10min":
                          return "10 minutos antes";
                        case "30min":
                          return "30 minutos antes";
                        case "1hour":
                          return "1 hora antes";
                        case "2hours":
                          return "2 horas antes";
                        case "1day":
                          return "1 dia antes";
                        case "2days":
                          return "2 dias antes";
                        case "1week":
                          return "1 semana antes";
                        case "now":
                          return "Enviar agora";
                        default:
                          return reminder.reminderTime;
                      }
                    })()}
                  </div>
                  {reminder.customMessage && (
                    <div className="text-xs mt-1">
                      <span className="font-medium">Mensagem:</span>{" "}
                      {reminder.customMessage}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(reminder)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(reminder.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
