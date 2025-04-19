import { useState } from "react";
import Header from "@/components/shared/header";
import BottomNavigation from "@/components/shared/bottom-navigation";
import DateNavigation from "@/components/shared/date-navigation";
import ViewToggle from "@/components/shared/view-toggle";
import DayView from "@/components/calendar/day-view";
import WeekView from "@/components/calendar/week-view";
import MonthView from "@/components/calendar/month-view";
import CreateEventModal from "@/components/calendar/create-event-modal";
import EventDetailsModal from "@/components/calendar/event-details-modal";
import { EventType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  
  // Fetch events
  const { data: events = [], isLoading } = useQuery<EventType[]>({
    queryKey: ['/api/events'],
  });
  
  // Filter events for the selected date
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  // Group events by period
  const morningEvents = filteredEvents.filter(event => event.period === 'morning');
  const afternoonEvents = filteredEvents.filter(event => event.period === 'afternoon');
  const nightEvents = filteredEvents.filter(event => event.period === 'night');
  
  const handleOpenCreateModal = () => {
    setCreateModalOpen(true);
  };
  
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
  };
  
  const handleOpenEventDetails = (event: EventType) => {
    setSelectedEvent(event);
  };
  
  const handleCloseEventDetails = () => {
    setSelectedEvent(null);
  };
  
  const handlePrevDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };
  
  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  const sharedEventsCount = filteredEvents.filter(event => event.isShared).length;
  
  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <DateNavigation 
        date={selectedDate} 
        eventCount={filteredEvents.length}
        sharedCount={sharedEventsCount}
        onPrev={handlePrevDay}
        onNext={handleNextDay}
      />
      
      <ViewToggle 
        view={view} 
        onChange={setView} 
        onToday={goToToday}
      />
      
      {view === 'day' && (
        <DayView 
          date={selectedDate}
          morningEvents={morningEvents}
          afternoonEvents={afternoonEvents}
          nightEvents={nightEvents}
          isLoading={isLoading}
          onEventClick={handleOpenEventDetails}
        />
      )}
      
      {view === 'week' && (
        <WeekView 
          date={selectedDate}
          events={events}
          isLoading={isLoading}
          onEventClick={handleOpenEventDetails}
          onDayChange={setSelectedDate}
        />
      )}
      
      {view === 'month' && (
        <MonthView 
          date={selectedDate}
          events={events}
          isLoading={isLoading}
          onEventClick={handleOpenEventDetails}
          onDayChange={setSelectedDate}
        />
      )}
      
      <BottomNavigation 
        onCreateEvent={handleOpenCreateModal} 
      />
      
      <CreateEventModal 
        isOpen={createModalOpen}
        onClose={handleCloseCreateModal}
        defaultDate={selectedDate}
      />
      
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={handleCloseEventDetails}
        />
      )}
    </div>
  );
}
