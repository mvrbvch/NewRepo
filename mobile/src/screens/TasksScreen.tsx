import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { useAuth } from '../hooks/useAuth';

const TasksScreen = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'today', 'completed'

  // Fetch household tasks
  const { 
    data: tasks, 
    isLoading, 
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.getAll()
  });

  // Mutation for completing tasks
  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number, completed: boolean }) => 
      api.tasks.complete(id, completed),
    onSuccess: () => {
      // Refetch tasks to update the list
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('Error toggling task completion:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  });

  // Mutation for deleting tasks
  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => api.tasks.delete(id),
    onSuccess: () => {
      // Refetch tasks to update the list
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  });

  // Handle task completion toggle
  const handleToggleComplete = (id: number, currentState: boolean) => {
    toggleTaskMutation.mutate({ id, completed: !currentState });
  };

  // Handle task deletion
  const handleDeleteTask = (id: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTaskMutation.mutate(id),
        },
      ]
    );
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if a task is due today
  const isTaskDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === taskDate.getTime();
  };

  // Filter tasks based on selected filter
  const filteredTasks = () => {
    if (!tasks) return [];
    
    switch (selectedFilter) {
      case 'today':
        return tasks.filter(task => isTaskDueToday(task.dueDate));
      case 'completed':
        return tasks.filter(task => task.completed);
      case 'all':
      default:
        return tasks;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 2: return '#E53E3E'; // High priority - red
      case 1: return '#DD6B20'; // Medium priority - orange
      default: return '#38A169'; // Low priority - green
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 2: return 'High';
      case 1: return 'Medium';
      default: return 'Low';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Household Tasks</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'today' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('today')}
        >
          <Text style={[styles.filterText, selectedFilter === 'today' && styles.filterTextActive]}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('completed')}
        >
          <Text style={[styles.filterText, selectedFilter === 'completed' && styles.filterTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4F46E5" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load tasks</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTasks().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedFilter === 'today' 
              ? 'No tasks due today' 
              : selectedFilter === 'completed' 
                ? 'No completed tasks' 
                : 'No tasks found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <TouchableOpacity
                style={[styles.taskStatus, item.completed && styles.taskCompleted]}
                onPress={() => handleToggleComplete(item.id, item.completed)}
              />
              
              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <Text 
                    style={[
                      styles.taskTitle, 
                      item.completed && styles.taskCompletedText
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  
                  <View 
                    style={[
                      styles.priorityBadge, 
                      { backgroundColor: getPriorityColor(item.priority) }
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {getPriorityLabel(item.priority)}
                    </Text>
                  </View>
                </View>
                
                {item.description && (
                  <Text 
                    style={[
                      styles.taskDescription, 
                      item.completed && styles.taskCompletedText
                    ]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                )}
                
                <View style={styles.taskFooter}>
                  <Text style={styles.dueDate}>
                    Due: {formatDate(item.dueDate)}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTask(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.taskList}
        />
      )}

      {/* Add Task Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    backgroundColor: '#4F46E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
  taskList: {
    padding: 15,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    marginRight: 15,
    alignSelf: 'center',
  },
  taskCompleted: {
    backgroundColor: '#4F46E5',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  taskCompletedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#888',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    color: '#E53E3E',
    fontSize: 12,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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

export default TasksScreen;