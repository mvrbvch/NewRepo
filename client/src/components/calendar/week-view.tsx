import { EventType } from "@/lib/types";
import { formatDate, formatTime, getPeriodFromTime } from "@/lib/utils";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeekViewProps {
  date: Date;
  events: EventType[];
  isLoading: boolean;
  onEventClick: (event: EventType) => void;
  onDayChange: (date: Date) => void;
}

export default function WeekView({
  date,
  events,
  isLoading,
  onEventClick,
  onDayChange,
}: WeekViewProps) {
  
  // Generate week days from selected date
  const weekDays = useMemo(() => {
    const start = startOfWeek(date, { locale: ptBR });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [date]);

  // Filter events by week
  const eventsInWeek = useMemo(() => {
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return weekDays.some(day => day.toDateString() === eventDate.toDateString());
    });

    // Group by day
    const groupedEvents = weekDays.map(day => {
      return {
        date: day,
        events: filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return day.toDateString() === eventDate.toDateString();
        })
      };
    });

    return groupedEvents;
  }, [events, weekDays]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar">
        <div className="grid grid-cols-7 bg-white border-b">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 m-1 rounded-md" />
          ))}
        </div>
        <div className="min-h-[500px] p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar">
      <div className="grid grid-cols-7 bg-white border-b">
        {weekDays.map((day, index) => (
          <div 
            key={index}
            className={`flex flex-col items-center justify-center p-2 cursor-pointer ${
              day.toDateString() === new Date().toDateString() ? 'bg-primary/10' : ''
            } ${
              day.toDateString() === date.toDateString() ? 'border-b-2 border-primary' : ''
            }`}
            onClick={() => onDayChange(day)}
          >
            <div className="text-sm font-medium">
              {format(day, 'EEE', { locale: ptBR })}
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              day.toDateString() === date.toDateString() ? 'bg-primary text-white' : ''
            }`}>
              {format(day, 'd')}
            </div>
            <div className="text-xs text-gray-500">
              {eventsInWeek[index].events.length > 0 
                ? `${eventsInWeek[index].events.length} evento${eventsInWeek[index].events.length > 1 ? 's' : ''}` 
                : ''}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4">
        {eventsInWeek.map((dayEvents, index) => (
          <div 
            key={index} 
            className={`mb-4 ${dayEvents.date.toDateString() === date.toDateString() ? 'block' : 'hidden'}`}
          >
            <h3 className="text-lg font-semibold mb-2">{format(dayEvents.date, "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
            
            {dayEvents.events.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                Nenhum evento neste dia
              </div>
            ) : (
              <div className="space-y-2">
                {dayEvents.events.map(event => {
                  const period = event.period;
                  const borderColorClass = 
                    period === 'morning' ? 'border-orange-500' : 
                    period === 'afternoon' ? 'border-blue-500' : 
                    'border-purple-700';
                  
                  return (
                    <div 
                      key={event.id}
                      className={`bg-white rounded-lg shadow-sm p-3 border-l-4 ${borderColorClass} ${
                        event.isShared ? 'bg-pink-50' : ''
                      }`}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <span className="mr-2">{event.emoji || '📅'}</span>
                          <h4 className="font-medium">{event.title}</h4>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                      </div>
                      
                      {event.location && (
                        <div className="text-sm text-gray-600 mb-1">{event.location}</div>
                      )}
                      
                      <div className="flex items-center text-xs text-gray-500">
                        {event.isShared ? (
                          <>
                            <span className="material-icons text-xs text-secondary mr-1">favorite</span>
                            <span>Compartilhado</span>
                          </>
                        ) : (
                          <>
                            <span className="material-icons text-xs mr-1">person</span>
                            <span>Somente você</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
