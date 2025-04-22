import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { motion } from "framer-motion";

interface ViewToggleProps {
  view: 'day' | 'week' | 'month';
  onChange: (view: 'day' | 'week' | 'month') => void;
  onToday: () => void;
}

export default function ViewToggle({ view, onChange, onToday }: ViewToggleProps) {
  return (
    <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
      <div className="flex bg-gray-100 rounded-lg p-1 text-sm relative">
        {/* Indicador deslizante animado */}
        <motion.div 
          className="absolute top-1 bottom-1 rounded-md bg-primary"
          initial={false}
          animate={{
            left: view === 'day' ? '0%' : view === 'week' ? '33.33%' : '66.66%',
            width: view === 'week' ? '33.33%' : '33.33%'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ width: '33.33%' }}
        />
        
        {/* Botões de visualização com efeito tátil */}
        <TactileFeedback>
          <button 
            className={`px-3 py-1 rounded-md font-medium z-10 transition-colors duration-200 relative ${
              view === 'day' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={() => onChange('day')}
          >
            Dia
          </button>
        </TactileFeedback>
        
        <TactileFeedback>
          <button 
            className={`px-3 py-1 rounded-md font-medium z-10 transition-colors duration-200 relative ${
              view === 'week' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={() => onChange('week')}
          >
            Semana
          </button>
        </TactileFeedback>
        
        <TactileFeedback>
          <button 
            className={`px-3 py-1 rounded-md font-medium z-10 transition-colors duration-200 relative ${
              view === 'month' ? 'text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={() => onChange('month')}
          >
            Mês
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
