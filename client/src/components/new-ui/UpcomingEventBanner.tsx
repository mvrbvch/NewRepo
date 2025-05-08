import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { EventType } from "@/lib/types";
import { addDays, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UpcomingEventBannerProps {
  events?: EventType[];
}

export const UpcomingEventBanner = ({
  events = [],
}: UpcomingEventBannerProps) => {
  const isMobile = useMobile();

  // Find the next special event
  const today = new Date();
  console.log("events", events);
  const upcomingSpecialEvents = events
    .filter((event) => event.isSpecial)
    .filter((event) => new Date(event.date) > today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextSpecialEvent = upcomingSpecialEvents[0];

  // If there's no special event, don't render the banner
  if (!nextSpecialEvent) return null;

  const daysUntil = differenceInDays(new Date(nextSpecialEvent.date), today);

  return (
    <div className="mb-4 md:mb-6">
      <div className="bg-gradient-to-r from-emotional-love/30 to-emotional-love/10 rounded-lg p-3 md:p-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-emotional-love/30 flex items-center justify-center text-lg md:text-xl mr-3 md:mr-4">
            {nextSpecialEvent.emoji || "🎉"}
          </div>
          <div>
            <Badge className="mb-1 bg-emotional-love text-white text-xs">
              Evento Especial
            </Badge>
            <h3 className="font-semibold text-sm md:text-lg">
              {nextSpecialEvent.title}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {daysUntil === 0
                ? "Hoje!"
                : daysUntil === 1
                  ? "Amanhã"
                  : `Em ${daysUntil} dias`}
              {" • "}
              {format(addDays(nextSpecialEvent.date, 1), "d 'de' MMMM", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="border-emotional-love text-emotional-love hover:bg-emotional-love/10 whitespace-nowrap"
        >
          {isMobile ? "Ver" : "Ver detalhes"}
        </Button>
      </div>
    </div>
  );
};
