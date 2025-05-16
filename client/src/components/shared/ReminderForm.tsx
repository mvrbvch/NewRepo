// ReminderForm.tsx
import React, { useState } from "react";

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

interface ReminderFormProps {
  type: "event" | "task";
  id: number; // eventId ou taskId
  onCreated?: (reminders: any[]) => void;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({
  type,
  id,
  onCreated,
}) => {
  const [reminderType, setReminderType] = useState<ReminderType>("push");
  const [reminderTime, setReminderTime] = useState<ReminderTime>("1hour");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const url =
      type === "event"
        ? `/api/events/${id}/reminders`
        : `/api/tasks/${id}/reminders`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reminderType,
        reminderTime,
        customMessage: customMessage || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setResult("Lembrete criado com sucesso!");
      if (onCreated) onCreated(data.reminders);
    } else {
      setResult(data.message || "Erro ao criar lembrete");
    }
  };

  return (
    <div>
      <label>
        Tipo de lembrete:
        <select
          value={reminderType}
          onChange={(e) => setReminderType(e.target.value as ReminderType)}
        >
          <option value="push">Push</option>
          <option value="email">Email</option>
          <option value="both">Push + Email</option>
        </select>
      </label>
      <br />
      <label>
        Quando enviar:
        <select
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value as ReminderTime)}
        >
          <option value="10min">10 minutos antes</option>
          <option value="30min">30 minutos antes</option>
          <option value="1hour">1 hora antes</option>
          <option value="2hours">2 horas antes</option>
          <option value="1day">1 dia antes</option>
          <option value="2days">2 dias antes</option>
          <option value="1week">1 semana antes</option>
          <option value="now">Enviar agora</option>
        </select>
      </label>
      <br />
      <label>
        Mensagem personalizada:
        <input
          type="text"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Opcional"
        />
      </label>
      <br />
      <button type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? "Enviando..." : "Criar lembrete"}
      </button>
      {result && <div>{result}</div>}
    </div>
  );
};
