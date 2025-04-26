import { EventType, UserType } from "@/lib/types";
import { formatTime, periodLabels } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CoupleLoadingAnimation } from "@/components/shared/couple-loading-animation";

interface DayViewProps {
  date: Date;
  morningEvents: EventType[];
  afternoonEvents: EventType[];
  nightEvents: EventType[];
  isLoading: boolean;
  user?: UserType | null;
  onEventClick: (event: EventType) => void;
}

export default function DayView({
  date,
  morningEvents = [],
  afternoonEvents = [],
  nightEvents = [],
  isLoading,
  onEventClick,
  user = undefined,
}: DayViewProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar p-4 flex items-center justify-center">
        <CoupleLoadingAnimation
          type="calendar"
          text="Carregando agenda do dia..."
          size="lg"
        />
      </div>
    );
  }

  // Check if there are any events for the day
  const hasEvents =
    morningEvents.length > 0 ||
    afternoonEvents.length > 0 ||
    nightEvents.length > 0;

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar"
      style={{ minHeight: "100vh" }}
    >
      {/* Morning section */}
      <div className="p-4 pb-2">
        <div className="flex items-center mb-3">
          <span className={`material-icons ${periodLabels.morning.color} mr-2`}>
            {periodLabels.morning.icon}
          </span>
          <h3 className={`${periodLabels.morning.color} font-medium`}>
            {periodLabels.morning.label}
          </h3>
          <span className="text-xs text-gray-500 ml-2">
            {periodLabels.morning.timeRange}
          </span>
        </div>

        {morningEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500 text-sm mb-3">
            Nenhum evento neste período
          </div>
        ) : (
          morningEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-lg shadow-sm mb-3 event-morning p-3 flex ${
                event.isShared ? "event-partner" : ""
              } cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onEventClick(event)}
            >
              <div className="mr-3 flex flex-col items-center">
                <span className="text-sm font-medium">
                  {formatTime(event.startTime)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(event.endTime)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="mr-1">{event.emoji || "📅"}</span>
                  <h4 className="font-medium">{event.title}</h4>
                </div>
                {event.location && (
                  <div className="text-sm text-gray-600 mb-1">
                    {event.location}
                  </div>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  {event.isShared ? (
                    <>
                      <span className="material-icons text-xs text-secondary mr-1">
                        favorite
                      </span>
                      <span>Compartilhado</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-xs mr-1">
                        person
                      </span>
                      <span>Somente você</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Afternoon section */}
      <div className="p-4 pb-2">
        <div className="flex items-center mb-3">
          <span
            className={`material-icons ${periodLabels.afternoon.color} mr-2`}
          >
            {periodLabels.afternoon.icon}
          </span>
          <h3 className={`${periodLabels.afternoon.color} font-medium`}>
            {periodLabels.afternoon.label}
          </h3>
          <span className="text-xs text-gray-500 ml-2">
            {periodLabels.afternoon.timeRange}
          </span>
        </div>

        {afternoonEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500 text-sm mb-3">
            Nenhum evento neste período
          </div>
        ) : (
          afternoonEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-lg shadow-sm mb-3 event-afternoon p-3 flex ${
                event.isShared ? "event-partner" : ""
              } cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onEventClick(event)}
            >
              <div className="mr-3 flex flex-col items-center">
                <span className="text-sm font-medium">
                  {formatTime(event.startTime)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(event.endTime)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="mr-1">{event.emoji || "📅"}</span>
                  <h4 className="font-medium">{event.title}</h4>
                </div>
                {event.location && (
                  <div className="text-sm text-gray-600 mb-1">
                    {event.location}
                  </div>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  {event.isShared ? (
                    <>
                      <span className="material-icons text-xs text-secondary mr-1">
                        favorite
                      </span>
                      <span>Compartilhado</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-xs mr-1">
                        person
                      </span>
                      <span>Somente você</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Night section */}
      <div className="p-4 pb-2">
        <div className="flex items-center mb-3">
          <span className={`material-icons ${periodLabels.night.color} mr-2`}>
            {periodLabels.night.icon}
          </span>
          <h3 className={`${periodLabels.night.color} font-medium`}>
            {periodLabels.night.label}
          </h3>
          <span className="text-xs text-gray-500 ml-2">
            {periodLabels.night.timeRange}
          </span>
        </div>

        {nightEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500 text-sm mb-3">
            Nenhum evento neste período
          </div>
        ) : (
          nightEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-lg shadow-sm mb-3 event-night p-3 flex ${
                event.isShared ? "event-partner" : ""
              } cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onEventClick(event)}
            >
              <div className="mr-3 flex flex-col items-center">
                <span className="text-sm font-medium">
                  {formatTime(event.startTime)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(event.endTime)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="mr-1">{event.emoji || "📅"}</span>
                  <h4 className="font-medium">{event.title}</h4>
                </div>

                {event.location && (
                  <div className="text-sm text-gray-600 mb-1">
                    {event.location}
                  </div>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  {event.isShared ? (
                    <>
                      <span className="material-icons text-xs text-secondary mr-1">
                        favorite
                      </span>
                      <span>Compartilhado</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-xs mr-1">
                        person
                      </span>
                      <span>Somente você</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .event-morning {
          border-left: 4px solid #f97316;
        }
        .event-afternoon {
          border-left: 4px solid #0ea5e9;
        }
        .event-night {
          border-left: 4px solid #6d28d9;
        }
        .event-partner {
          background-color: rgba(236, 72, 153, 0.1);
        }
      `}</style>
    </div>
  );
}
