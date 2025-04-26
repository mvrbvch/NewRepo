import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { CalendarDays, Calendar, LayoutGrid, List } from "lucide-react";

interface ViewToggleProps {
  view: "day" | "week" | "month" | "timeline";
  onChange: (view: "day" | "week" | "month" | "timeline") => void;
  onToday: () => void;
}

export default function ViewToggle({
  view,
  onChange,
  onToday,
}: ViewToggleProps) {
  return (
    <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
      <div
        className="flex bg-gray-100 rounded-lg p-1 text-sm"
        style={{ maxWidth: "360px" }}
      >
        <TactileFeedback>
          <button
            className={`flex-1 py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1 ${
              view === "day"
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => onChange("day")}
            title="Visualização diária"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dia</span>
          </button>
        </TactileFeedback>

        <TactileFeedback>
          <button
            className={`flex-1 py-1.5 px-2 mx-1 rounded-md font-medium flex items-center justify-center gap-1 ${
              view === "week"
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => onChange("week")}
            title="Visualização semanal"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Semana</span>
          </button>
        </TactileFeedback>

        <TactileFeedback>
          <button
            className={`flex-1 py-1.5 px-2 mx-1 rounded-md font-medium flex items-center justify-center gap-1 ${
              view === "month"
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => onChange("month")}
            title="Visualização mensal"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mês</span>
          </button>
        </TactileFeedback>

        <TactileFeedback>
          <button
            className={`flex-1 py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1 ${
              view === "timeline"
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => onChange("timeline")}
            title="Visualização em linha do tempo"
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Timeline</span>
          </button>
        </TactileFeedback>
      </div>

      <RippleButton
        variant="ghost"
        size="sm"
        className="text-primary font-medium"
        onClick={onToday}
        rippleColor="rgba(79, 70, 229, 0.2)"
      >
        Hoje
      </RippleButton>
    </div>
  );
}
