import { EventType } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths,
  subMonths,
  getMonth,
  getYear
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthViewProps {
  date: Date;
  events: EventType[];
  isLoading: boolean;
  onEventClick: (event: EventType) => void;
  onDayChange: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

export default function MonthView({
  date,
  events,
  isLoading,
  onEventClick,
  onDayChange,
  onMonthChange,
}: MonthViewProps) {
  const isMobile = useIsMobile();
  // Get all days in month view (including days from previous/next month to fill the grid)
  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(date), { locale: ptBR }),
    end: endOfWeek(endOfMonth(date), { locale: ptBR })
  });
  
  // Group events by date
  const eventsByDate = monthDays.map(day => {
    return {
      date: day,
      events: events.filter(event => {
        const eventDate = new Date(event.date);
        return isSameDay(day, eventDate);
      })
    };
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-2">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-2">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-600 flex items-center"
          onClick={() => onMonthChange && onMonthChange(subMonths(date, 1))}
        >
          <span className="material-icons mr-1">chevron_left</span>
          <span className="hidden sm:inline">{format(subMonths(date, 1), 'MMMM', { locale: ptBR })}</span>
        </Button>
        
        <h2 className="text-lg font-medium text-gray-800">
          {format(date, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-600 flex items-center"
          onClick={() => onMonthChange && onMonthChange(addMonths(date, 1))}
        >
          <span className="hidden sm:inline">{format(addMonths(date, 1), 'MMMM', { locale: ptBR })}</span>
          <span className="material-icons ml-1">chevron_right</span>
        </Button>
      </div>
      
      {/* Day names header */}
      <div className="grid grid-cols-7 mb-2">
        {isMobile 
          ? ["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
              <div key={i} className="text-center text-sm font-medium p-1">
                {day}
              </div>
            ))
          : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => (
              <div key={i} className="text-center text-sm font-medium p-2">
                {day}
              </div>
            ))
        }
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1">
        {eventsByDate.map((dayData, i) => {
          const isCurrentMonth = isSameMonth(dayData.date, date);
          const isToday = isSameDay(dayData.date, new Date());
          const isSelected = isSameDay(dayData.date, date);
          
          return (
            <div 
              key={i}
              className={`day-grid-cell bg-white rounded-lg p-1 cursor-pointer
                ${!isCurrentMonth ? 'opacity-40' : ''}
                ${isToday ? 'border border-primary' : ''}
                ${isSelected ? 'ring-2 ring-primary ring-opacity-50' : ''}
              `}
              onClick={() => onDayChange(dayData.date)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-primary text-white' : ''}
                `}>
                  {format(dayData.date, 'd')}
                </span>
                
                {dayData.events.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full">
                    {dayData.events.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1 overflow-hidden max-h-[calc(100%-24px)]">
                {dayData.events.slice(0, isMobile ? 2 : 3).map((event, idx) => (
                  <div 
                    key={idx}
                    className={`text-xs truncate px-1.5 py-0.5 rounded
                      ${event.period === 'morning' ? 'bg-orange-100 text-orange-800' : 
                        event.period === 'afternoon' ? 'bg-blue-100 text-blue-800' : 
                        'bg-purple-100 text-purple-800'
                      }
                      ${event.isShared ? 'border-l-2 border-pink-500' : ''}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    {isMobile 
                      ? (event.emoji ? event.emoji : (
                          event.period === 'morning' ? '🌅' : 
                          event.period === 'afternoon' ? '☀️' : '🌙'
                        ))
                      : `${event.emoji || ''} ${event.title}`
                    }
                  </div>
                ))}
                
                {dayData.events.length > (isMobile ? 2 : 3) && (
                  <div className="text-xs text-center text-gray-500">
                    +{dayData.events.length - (isMobile ? 2 : 3)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .day-grid-cell {
          min-height: 5rem;
        }
      `}</style>
    </div>
  );
}
