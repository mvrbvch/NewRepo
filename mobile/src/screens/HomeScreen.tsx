import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/api";
import { Card, Button, Text } from "../components/ui";
import { COLORS, FONTS, SIZES, SHADOWS } from "../constants/theme";

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
    queryKey: ["tasks"],
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
          <Text variant="h2" color={COLORS.white}>
            Hello, {user?.name || "there"}!
          </Text>
          <Text variant="body" color={COLORS.white} style={{ opacity: 0.8 }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Today's Schedule Section */}
        <Card style={styles.section} variant="elevated">
          <Text variant="h4" color={COLORS.text} style={styles.sectionPadding}>
            Today's Schedule
          </Text>

          {eventsLoading ? (
            <ActivityIndicator style={styles.loader} color={COLORS.primary} />
          ) : eventsError ? (
            <Text
              variant="body"
              color={COLORS.error}
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
                  <Text variant="body-sm" color={COLORS.textSecondary}>
                    {event.startTime}
                  </Text>
                  <Text variant="caption" color={COLORS.textLight}>
                    -
                  </Text>
                  <Text variant="body-sm" color={COLORS.textSecondary}>
                    {event.endTime}
                  </Text>
                </View>
                <View style={styles.eventDetails}>
                  <Text variant="body" weight="semibold" color={COLORS.text}>
                    {event.title}
                  </Text>
                  {event.location && (
                    <Text variant="body-sm" color={COLORS.textSecondary}>
                      {event.location}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Tasks Section */}
        <Card style={styles.section} variant="elevated">
          <Text variant="h4" color={COLORS.text} style={styles.sectionPadding}>
            Today's Tasks
          </Text>

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
                    variant="body"
                    weight="semibold"
                    color={task.completed ? COLORS.textLight : COLORS.text}
                    style={task.completed ? styles.textStrikethrough : {}}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text
                      variant="body-sm"
                      color={
                        task.completed ? COLORS.textLight : COLORS.textSecondary
                      }
                      style={task.completed ? styles.textStrikethrough : {}}
                    >
                      {task.description}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Quick Actions Section */}
        <Card style={styles.section} variant="elevated">
          <Text variant="h4" color={COLORS.text} style={styles.sectionPadding}>
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
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.primary,
  },
  sectionPadding: {
    paddingHorizontal: SIZES.spacing.md,
    paddingTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.md,
  },
  messagePadding: {
    paddingHorizontal: SIZES.spacing.md,
    paddingBottom: SIZES.spacing.md,
    marginVertical: SIZES.spacing.md,
  },
  section: {
    marginTop: SIZES.spacing.md,
    padding: 0,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.md,
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.md,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    ...FONTS.semiBold,
    marginBottom: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.md,
    paddingTop: SIZES.spacing.md,
    color: COLORS.text,
  },
  loader: {
    marginVertical: SIZES.spacing.md,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginVertical: SIZES.spacing.md,
    ...FONTS.medium,
    paddingHorizontal: SIZES.spacing.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: SIZES.spacing.md,
    fontStyle: "italic",
    ...FONTS.regular,
    paddingHorizontal: SIZES.spacing.md,
    paddingBottom: SIZES.spacing.md,
  },
  eventCard: {
    flexDirection: "row",
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.gray50,
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  eventTimeContainer: {
    marginRight: SIZES.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  eventTime: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  eventTimeDivider: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginVertical: 2,
  },
  eventDetails: {
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: SIZES.md,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.gray50,
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  taskStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: SIZES.spacing.md,
    backgroundColor: "transparent",
  },
  taskCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: SIZES.md,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  taskCompletedText: {
    textDecorationLine: "line-through",
    color: COLORS.textLight,
  },
  taskDescription: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.md,
    paddingBottom: SIZES.spacing.md,
  },
  actionButton: {
    width: "48%",
  },
  textStrikethrough: {
    textDecorationLine: "line-through",
  },
});

export default HomeScreen;
