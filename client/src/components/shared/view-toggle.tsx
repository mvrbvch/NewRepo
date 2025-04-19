import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  view: 'day' | 'week' | 'month';
  onChange: (view: 'day' | 'week' | 'month') => void;
  onToday: () => void;
}

export default function ViewToggle({ view, onChange, onToday }: ViewToggleProps) {
  return (
    <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
      <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
        <button 
          className={`px-3 py-1 rounded-md font-medium ${
            view === 'day' ? 'bg-primary text-white' : 'text-gray-700'
          }`}
          onClick={() => onChange('day')}
        >
          Dia
        </button>
        <button 
          className={`px-3 py-1 rounded-md font-medium ${
            view === 'week' ? 'bg-primary text-white' : 'text-gray-700'
          }`}
          onClick={() => onChange('week')}
        >
          Semana
        </button>
        <button 
          className={`px-3 py-1 rounded-md font-medium ${
            view === 'month' ? 'bg-primary text-white' : 'text-gray-700'
          }`}
          onClick={() => onChange('month')}
        >
          Mês
        </button>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-primary font-medium"
        onClick={onToday}
      >
        Hoje
      </Button>
    </div>
  );
}
