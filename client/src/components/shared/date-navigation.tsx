import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <div className="px-4 py-3 bg-primary-light border-b border-primary-light flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-primary-dark">{displayDate}</h2>
        <div className="flex items-center text-sm text-medium">
          <span>
            {eventCount} evento{eventCount !== 1 ? 's' : ''}
          </span>
          {sharedCount > 0 && (
            <>
              <span className="mx-1">•</span>
              <span className="flex items-center">
                <span className="material-icons text-sm text-primary mr-1">favorite</span>
                <span>
                  {sharedCount} compartilhado{sharedCount !== 1 ? 's' : ''}
                </span>
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onPrev}
          className="text-primary-dark hover:bg-white hover:text-primary"
        >
          <span className="material-icons">chevron_left</span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onNext}
          className="text-primary-dark hover:bg-white hover:text-primary"
        >
          <span className="material-icons">chevron_right</span>
        </Button>
      </div>
    </div>
  );
}
