import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';

// Simple calendar implementation - in a real app, you'd use a library like react-native-calendars
const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  
  // Fetch events
  const { 
    data: events, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.events.getAll()
  });

  // Generate calendar days for the current month
  useEffect(() => {
    const days: Date[] = [];
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    // Get the first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    
    // Get the last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add days from previous month to fill the first week
    for (let i = firstDayOfWeek; i > 0; i--) {
      const prevMonthDay = new Date(currentYear, currentMonth, 1 - i);
      days.push(prevMonthDay);
    }
    
    // Add all days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(currentYear, currentMonth, i);
      days.push(day);
    }
    
    // Add days from next month to complete the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextMonthDay = new Date(currentYear, currentMonth + 1, i);
        days.push(nextMonthDay);
      }
    }
    
    setCalendarDays(days);
  }, [selectedDate]);

  // Change month
  const changeMonth = (amount: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + amount);
    setSelectedDate(newDate);
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Check if a day has events
  const dayHasEvents = (day: Date) => {
    if (!events) return false;
    
    return events.some(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear()
      );
    });
  };

  // Get events for selected date
  const getEventsForSelectedDate = () => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  // Render calendar day
  const renderDay = (day: Date, index: number) => {
    const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
    const isSelected = (
      day.getDate() === selectedDate.getDate() &&
      day.getMonth() === selectedDate.getMonth() &&
      day.getFullYear() === selectedDate.getFullYear()
    );
    const isToday = (
      day.getDate() === new Date().getDate() &&
      day.getMonth() === new Date().getMonth() &&
      day.getFullYear() === new Date().getFullYear()
    );
    const hasEvents = dayHasEvents(day);
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          !isCurrentMonth && styles.otherMonthDay,
          isSelected && styles.selectedDay,
          isToday && styles.today
        ]}
        onPress={() => setSelectedDate(day)}
      >
        <Text style={[
          styles.dayText,
          !isCurrentMonth && styles.otherMonthDayText,
          isSelected && styles.selectedDayText
        ]}>
          {day.getDate()}
        </Text>
        {hasEvents && <View style={styles.eventIndicator} />}
      </TouchableOpacity>
    );
  };

  // Render day of week header
  const renderDayOfWeek = (day: string, index: number) => (
    <View key={index} style={styles.dayOfWeek}>
      <Text style={styles.dayOfWeekText}>{day}</Text>
    </View>
  );

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const eventsForSelectedDate = getEventsForSelectedDate();

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 50 : 30 }]}>
      <View style={styles.calendarContainer}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Text style={styles.headerButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Text style={styles.headerButton}>→</Text>
          </TouchableOpacity>
        </View>
        
        {/* Days of Week */}
        <View style={styles.daysOfWeekContainer}>
          {daysOfWeek.map(renderDayOfWeek)}
        </View>
        
        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map(renderDay)}
        </View>
      </View>
      
      {/* Selected Date Events */}
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsHeader}>
          Events for {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color="#4F46E5" />
        ) : error ? (
          <Text style={styles.errorText}>Failed to load events</Text>
        ) : eventsForSelectedDate.length === 0 ? (
          <Text style={styles.emptyText}>No events scheduled for this day</Text>
        ) : (
          <FlatList
            data={eventsForSelectedDate}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <View style={styles.eventTimeContainer}>
                  <Text style={styles.eventTime}>{item.startTime}</Text>
                  <Text style={styles.eventTimeDivider}>-</Text>
                  <Text style={styles.eventTime}>{item.endTime}</Text>
                </View>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  {item.location && (
                    <Text style={styles.eventLocation}>{item.location}</Text>
                  )}
                </View>
              </View>
            )}
            style={styles.eventsList}
          />
        )}
      </View>
      
      {/* Add Event Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    padding: 15,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    fontSize: 24,
    color: '#4F46E5',
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  dayOfWeek: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekText: {
    fontSize: 12,
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  otherMonthDayText: {
    color: '#999',
  },
  selectedDay: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
  },
  today: {
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 20,
  },
  eventIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
    position: 'absolute',
    bottom: 5,
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    padding: 15,
  },
  eventsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: '#E53E3E',
    textAlign: 'center',
    marginVertical: 15,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 15,
    fontStyle: 'italic',
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9ff',
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  eventTimeContainer: {
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  eventTimeDivider: {
    fontSize: 12,
    color: '#999',
    marginVertical: 2,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
  },
});

export default CalendarScreen;