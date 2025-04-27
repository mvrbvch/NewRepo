import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/api';

const HomeScreen = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Get user's events
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.events.getAll(),
  });

  // Get household tasks
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["api/tasks"],
    queryFn: () => api.tasks.getAll(),
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchEvents(), refetchTasks()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate if a task is due today
  const isTaskDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);

    return today.getTime() === taskDate.getTime();
  };

  // Get today's events
  const getTodayEvents = () => {
    if (!events) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
  };

  // Get today's tasks
  const getTodayTasks = () => {
    if (!tasks) return [];
    return tasks.filter((task) => isTaskDueToday(task.dueDate));
  };

  const todayEvents = getTodayEvents();
  const todayTasks = getTodayTasks();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "ios" ? 50 : 30 },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'there'}!</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Today's Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          
          {eventsLoading ? (
            <ActivityIndicator style={styles.loader} color={COLORS.primary} />
          ) : eventsError ? (
            <Text 
              variant="body" 
              color={COL  ORS.error} 
              align="center" 
              style={styles.messagePadding}
            >
              Failed to load events
            </Text>
          ) : todayEvents.length === 0 ? (
            <Text 
              variant="body" 
              color={COLORS.textSecondary} 
              align="center" 
              style={styles.messagePadding}
            >
              No events scheduled for today
            </Text>
          ) : (
            todayEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventTimeContainer}>
                  <Text variant="body-sm" color={COLORS.textSecondary}>{event.startTime}</Text>
                  <Text variant="caption" color={COLORS.textLight}>-</Text>
                  <Text variant="body-sm" color={COLORS.textSecondary}>{event.endTime}</Text>
                </View>
                <View style={styles.eventDetails}>
                  <Text variant="body" weight="semibold" color={COLORS.text}>{event.title}</Text>
                  {event.location && (
                    <Text variant="body-sm" color={COLORS.textSecondary}>{event.location}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          
          {tasksLoading ? (
            <ActivityIndicator style={styles.loader} color={COLORS.primary} />
          ) : tasksError ? (
            <Text 
              variant="body" 
              color={COLORS.error} 
              align="center" 
              style={styles.messagePadding}
            >
              Failed to load tasks
            </Text>
          ) : todayTasks.length === 0 ? (
            <Text 
              variant="body" 
              color={COLORS.textSecondary} 
              align="center" 
              style={styles.messagePadding}
            >
              No tasks due today
            </Text>
          ) : (
            todayTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View
                  style={[
                    styles.taskStatus,
                    task.completed ? styles.taskCompleted : {},
                  ]}
                />
                <View style={styles.taskDetails}>
                  <Text 
                    style={[
                      styles.taskTitle, 
                      task.completed ? styles.taskCompletedText : {}
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Quick Actions Section */}
        <Card style={styles.section} variant="elevated">
          <Text 
            variant="h4" 
            color={COLORS.text} 
            style={styles.sectionPadding}
          >
            Quick Actions
          </Text>
          <View style={styles.actionButtons}>
            <Button 
              title="Add Event" 
              variant="primary"
              style={styles.actionButton}
            />
            <Button 
              title="Add Task" 
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  loader: {
    marginVertical: SIZES.spacing.md,
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
    justifyContent: "center",
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
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9ff',
    marginBottom: 10,
  },
  taskStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4F46E5',
    marginRight: 15,
    backgroundColor: 'transparent',
  },
  taskCompleted: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  taskCompletedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default HomeScreen;
