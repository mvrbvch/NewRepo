import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";

interface ViewToggleProps {
  view: "day" | "week" | "month";
  onChange: (view: "day" | "week" | "month") => void;
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
        style={{ maxWidth: "280px" }}
      >
        <button
          className={`flex-1 py-1.5 px-3 rounded-md font-medium ${
            view === "day"
              ? "bg-primary text-white"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => {
            onChange("day");
            // Usar vibração para feedback tátil
            if (navigator.vibrate) {
              navigator.vibrate(15);
            }
          }}
        >
          Dia
        </button>

        <button
          className={`flex-1 py-1.5 px-3 mx-1 rounded-md font-medium ${
            view === "week"
              ? "bg-primary text-white"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => {
            onChange("week");
            // Usar vibração para feedback tátil
            if (navigator.vibrate) {
              navigator.vibrate(15);
            }
          }}
        >
          Semana
        </button>

        <button
          className={`flex-1 py-1.5 px-3 rounded-md font-medium ${
            view === "month"
              ? "bg-primary text-white"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => {
            onChange("month");
            // Usar vibração para feedback tátil
            if (navigator.vibrate) {
              navigator.vibrate(15);
            }
          }}
        >
          Mês
        </button>
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
