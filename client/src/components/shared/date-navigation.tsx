import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";
import { formatDate } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

interface DateNavigationProps {
  date: Date;
  eventCount: number;
  sharedCount: number;
  onPrev: () => void;
  onNext: () => void;
  calendarView?: 'day' | 'week' | 'month';
}

export default function DateNavigation({
  date,
  eventCount,
  sharedCount,
  onPrev,
  onNext,
  calendarView = 'day',
}: DateNavigationProps) {
  const isMobile = useIsMobile();
  
  let displayDate = '';
  const today = new Date();
  
  if (calendarView === 'day') {
    const formattedDate = format(date, "d 'de' MMMM yyyy", { locale: ptBR });
    
    // Determine if the date is today, tomorrow, or yesterday
    if (isToday(date)) {
      displayDate = `Hoje, ${format(date, "d 'de' MMMM", { locale: ptBR })}`;
    } else if (isSameDay(date, addDays(today, -1))) {
      displayDate = `Ontem, ${format(date, "d 'de' MMMM", { locale: ptBR })}`;
    } else if (isSameDay(date, addDays(today, 1))) {
      displayDate = `Amanhã, ${format(date, "d 'de' MMMM", { locale: ptBR })}`;
    } else {
      displayDate = formattedDate;
    }
  } else if (calendarView === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const end = endOfWeek(date, { weekStartsOn: 0 });
    
    // Formato para semana atual ou não
    if (isSameMonth(start, end)) {
      displayDate = `${format(start, "d")} - ${format(end, "d 'de' MMMM", { locale: ptBR })}`;
    } else {
      displayDate = `${format(start, "d 'de' MMM", { locale: ptBR })} - ${format(end, "d 'de' MMM", { locale: ptBR })}`;
    }
    
    // Verificar se é a semana atual
    const todayStart = startOfWeek(today, { weekStartsOn: 0 });
    if (isSameDay(start, todayStart)) {
      displayDate = `Semana atual (${displayDate})`;
    }
  } else if (calendarView === 'month') {
    displayDate = format(date, "MMMM yyyy", { locale: ptBR });
    
    // Verificar se é o mês atual
    if (isSameMonth(date, today)) {
      displayDate = `Mês atual (${displayDate})`;
    }
  }
  
  return (
    <motion.div 
      className="px-4 py-3 bg-primary-light border-b border-primary-light flex items-center justify-between"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <motion.h2 
          className="text-lg font-semibold text-primary-dark"
          layout
          key={displayDate}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {displayDate}
        </motion.h2>
        <motion.div 
          className="flex items-center text-sm text-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <span>
            {eventCount} evento{eventCount !== 1 ? 's' : ''}
          </span>
          {sharedCount > 0 && (
            <>
              <span className="mx-1">•</span>
              <motion.span 
                className="flex items-center"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  whileHover={{ scale: 1.2 }}
                  className="text-primary mr-1"
                >
                  <Heart size={14} className="fill-primary" />
                </motion.div>
                <span>
                  {sharedCount} compartilhado{sharedCount !== 1 ? 's' : ''}
                </span>
              </motion.span>
            </>
          )}
        </motion.div>
      </div>
      
      <div className="flex space-x-1">
        <RippleButton 
          variant="ghost" 
          size="icon" 
          onClick={onPrev}
          className="text-primary-dark hover:bg-white hover:text-primary"
          rippleColor="rgba(79, 70, 229, 0.2)"
        >
          <motion.div whileTap={{ x: -2 }}>
            <ChevronLeft size={20} />
          </motion.div>
        </RippleButton>
        <RippleButton 
          variant="ghost" 
          size="icon" 
          onClick={onNext}
          className="text-primary-dark hover:bg-white hover:text-primary"
          rippleColor="rgba(79, 70, 229, 0.2)"
        >
          <motion.div whileTap={{ x: 2 }}>
            <ChevronRight size={20} />
          </motion.div>
        </RippleButton>
      </div>
    </motion.div>
  );
}
