import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "d 'de' MMMM yyyy", { locale: ptBR });
};

export const formatTime = (time: string) => {
  // Convert "HH:MM" to a more readable format
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const hoursNum = parseInt(hours);

  // Format as "HH:MM" with optional leading zero for hours
  return `${hoursNum}:${minutes}`;
};

export const getPeriodFromTime = (
  time: string
): "morning" | "afternoon" | "night" => {
  const hour = parseInt(time.split(":")[0]);

  if (hour >= 6 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 18) {
    return "afternoon";
  } else {
    return "night";
  }
};

export const periodLabels = {
  morning: {
    label: "Manhã",
    timeRange: "6h - 12h",
    icon: "wb_sunny",
    color: "text-orange-500",
  },
  afternoon: {
    label: "Tarde",
    timeRange: "12h - 18h",
    icon: "wb_twilight",
    color: "text-blue-500",
  },
  night: {
    label: "Noite",
    timeRange: "18h - 00h",
    icon: "nights_stay",
    color: "text-purple-700",
  },
  allday: {
    label: "Dia todo",
    timeRange: "24h",
    icon: "nights_stay",
    color: "text-purple-700",
  },
};

export const commonEmojis = [
  "🎓",
  "🏋️",
  "👨‍⚕️",
  "🛒",
  "🎉",
  "🍽️",
  "💼",
  "🏠",
  "💬",
  "🚗",
  "🏖️",
  "🎮",
  "🎯",
  "🎨",
  "📚",
  "💻",
  "📱",
  "🎂",
];

export const formatDateSafely = (dateValue: any): string | null => {
  console.log(dateValue);
  if (!dateValue) return null;

  try {
    if (dateValue instanceof Date) {
      // Verificar se a data é válida
      if (isNaN(dateValue.getTime())) {
        console.log("Data inválida (Date object):", dateValue);
        return null;
      }
      return dateValue.toISOString();
    } else if (typeof dateValue === "string") {
      // Para datas no formato YYYY-MM-DD, adicione a parte de tempo
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateValue = `${dateValue}T00:00:00Z`;
      }

      // Verificar se a string de data pode ser convertida em um Date válido
      const tempDate = new Date(dateValue);
      if (isNaN(tempDate.getTime())) {
        console.log("Data inválida (string):", dateValue);
        return null;
      }
      return tempDate.toISOString();
    }
  } catch (err) {
    console.error("Erro ao processar data:", err, dateValue);
  }

  return null;
};
