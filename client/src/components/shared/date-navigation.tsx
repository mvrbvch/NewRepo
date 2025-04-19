import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateNavigationProps {
  date: Date;
  eventCount: number;
  sharedCount: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function DateNavigation({
  date,
  eventCount,
  sharedCount,
  onPrev,
  onNext,
}: DateNavigationProps) {
  const formattedDate = format(date, "d 'de' MMMM yyyy", { locale: ptBR });
  
  // Determine if the date is today, tomorrow, or yesterday
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  let displayDate = formattedDate;
  if (isToday) {
    displayDate = `Hoje, ${format(date, "d 'de' MMMM", { locale: ptBR })}`;
  } else if (isYesterday) {
    displayDate = `Ontem, ${format(date, "d 'de' MMMM", { locale: ptBR })}`;
  } else if (isTomorrow) {
    displayDate = `Amanhã, ${format(date, "d 'de' MMMM", { locale: ptBR })}`;
  }
  
  return (
    <div className="px-4 py-3 bg-white border-b flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">{displayDate}</h2>
        <div className="flex items-center text-sm text-gray-500">
          <span>
            {eventCount} evento{eventCount !== 1 ? 's' : ''}
          </span>
          {sharedCount > 0 && (
            <>
              <span className="mx-1">•</span>
              <span className="flex items-center">
                <span className="material-icons text-sm text-secondary mr-1">favorite</span>
                <span>
                  {sharedCount} compartilhado{sharedCount !== 1 ? 's' : ''}
                </span>
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex">
        <Button variant="ghost" size="icon" onClick={onPrev}>
          <span className="material-icons">chevron_left</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext}>
          <span className="material-icons">chevron_right</span>
        </Button>
      </div>
    </div>
  );
}
