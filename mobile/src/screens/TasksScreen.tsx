import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform
} from 'react-native';
import { Text, Card } from '../components/ui';
import { COLORS, SIZES } from '../constants/theme';

// Ícones
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Tipos para as tarefas
interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'alta' | 'média' | 'baixa';
  completed: boolean;
  isDaily?: boolean;
}

// Componente para o cabeçalho de tarefas com botões de ação
const TasksHeader = ({ onFilter, onAddTask }: any) => {
  return (
    <View style={styles.headerContainer}>
      <Text variant="h3" color={COLORS.white}>
        Minhas tarefas
      </Text>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={onFilter}
        >
          <Icon name="filter-variant" size={18} color={COLORS.white} />
          <Text variant="body-sm" color={COLORS.white} style={styles.filterText}>
            Filtros
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onAddTask}
        >
          <Icon name="plus" size={18} color={COLORS.white} />
          <Text variant="body-sm" color={COLORS.white}>
            Nova
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Componente para abas de filtragem de tarefas
const TasksTabs = ({ activeTab, onTabChange }: any) => {
  const tabs = [
    { id: 'pending', label: 'Pendentes' },
    { id: 'completed', label: 'Concluídas' },
    { id: 'all', label: 'Todas' }
  ];

  return (
    <View style={styles.tabsContainer}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tabButton,
            activeTab === tab.id && styles.activeTabButton
          ]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text
            variant="body"
            color={activeTab === tab.id ? COLORS.primary : COLORS.gray600}
            style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.id && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Componente para uma categoria de tarefas
const TaskCategory = ({ title, count, expanded, onToggle, tasks }: any) => {
  return (
    <View style={styles.categoryContainer}>
      <TouchableOpacity 
        style={styles.categoryHeader}
        onPress={onToggle}
      >
        <View style={styles.categoryTitleContainer}>
          <Icon 
            name={title === 'Tarefas Diárias' ? 'refresh' : 'format-list-bulleted'} 
            size={20} 
            color={COLORS.primary} 
          />
          <Text variant="body" weight="semibold" color={COLORS.text} style={styles.categoryTitle}>
            {title}
          </Text>
        </View>
        <View style={styles.categoryCountContainer}>
          <Text variant="body-sm" color={COLORS.gray600} style={styles.categoryCount}>
            {count}
          </Text>
          <Icon 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={COLORS.gray600} 
          />
        </View>
      </TouchableOpacity>

      {expanded && tasks && tasks.map((task: Task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </View>
  );
};

// Componente para um item de tarefa
const TaskItem = ({ task }: { task: Task }) => {
  // Determinar a cor com base na prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return COLORS.error;
      case 'média':
        return COLORS.warning;
      case 'baixa':
        return COLORS.primary;
      default:
        return COLORS.primary;
    }
  };

  // Obtém o ícone baseado na prioridade
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'arrow-up';
      case 'média':
        return 'minus';
      case 'baixa':
        return 'arrow-down';
      default:
        return 'minus';
    }
  };

  const [isChecked, setIsChecked] = useState(task.completed);
  
  const toggleCheck = () => {
    setIsChecked(!isChecked);
    // Aqui você faria a chamada à API para atualizar o estado da tarefa
  };

  return (
    <Card style={styles.taskCard} variant="outlined">
      <View style={styles.taskContainer}>
        <TouchableOpacity 
          style={[styles.checkbox, isChecked && styles.checkboxChecked]} 
          onPress={toggleCheck}
        >
          {isChecked && <Icon name="check" size={16} color={COLORS.white} />}
        </TouchableOpacity>
        
        <View style={styles.taskContent}>
          <Text 
            variant="body" 
            weight="semibold" 
            color={COLORS.text}
            style={isChecked ? styles.taskTitleCompleted : undefined}
          >
            {task.title}
          </Text>
          
          {task.description && (
            <Text 
              variant="body-sm" 
              color={COLORS.textSecondary}
              style={isChecked ? styles.taskTitleCompleted : undefined}
            >
              {task.description}
            </Text>
          )}
          
          <View style={styles.taskInfo}>
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Icon name="calendar" size={14} color={COLORS.gray500} />
                <Text variant="caption" color={COLORS.gray500} style={styles.dueDate}>
                  {task.dueDate}
                </Text>
              </View>
            )}
            
            <View style={styles.priorityContainer}>
              <Icon 
                name={getPriorityIcon(task.priority)} 
                size={14} 
                color={getPriorityColor(task.priority)} 
              />
              <Text 
                variant="caption" 
                color={getPriorityColor(task.priority)} 
                style={styles.priority}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.taskMenuButton}>
          <Icon name="dots-vertical" size={20} color={COLORS.gray600} />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const TasksScreen = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedCategories, setExpandedCategories] = useState({
    daily: true,
    personal: false,
    work: false
  });

  // Simulação de dados de tarefas
  const dailyTasks: Task[] = [
    {
      id: 1,
      title: 'Tirar os lixos',
      description: 'Tarefa diária: Tirar os lixos',
      priority: 'baixa',
      completed: false,
      isDaily: true,
      dueDate: 'Amanhã'
    },
    {
      id: 2,
      title: 'Limpar o robô aspirador',
      description: 'Tarefa diária: Limpar o robô aspirador',
      priority: 'baixa',
      completed: false,
      isDaily: true
    },
    {
      id: 3,
      title: 'Lavar louça',
      description: '',
      priority: 'alta',
      completed: false,
      isDaily: true
    }
  ];

  // Funções para expandir/recolher categorias
  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category as keyof typeof expandedCategories]
    });
  };

  // Filtragem de tarefas com base na aba ativa
  const getFilteredTasks = (tasks: Task[]) => {
    switch (activeTab) {
      case 'pending':
        return tasks.filter(task => !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  };

  const filteredDailyTasks = getFilteredTasks(dailyTasks);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <TasksHeader 
          onFilter={() => console.log('Filtrar tarefas')} 
          onAddTask={() => console.log('Adicionar nova tarefa')} 
        />

        <TasksTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <ScrollView style={styles.scrollView}>
          <TaskCategory 
            title="Tarefas Diárias" 
            count={filteredDailyTasks.length} 
            expanded={expandedCategories.daily}
            onToggle={() => toggleCategory('daily')}
            tasks={filteredDailyTasks}
          />
          
          {/* Outras categorias podem ser adicionadas aqui */}
        </ScrollView>

        {/* Botão flutuante para adicionar tarefa */}
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab}>
            <Icon name="plus" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.primary,
    padding: SIZES.spacing.md,
    paddingTop: Platform.OS === 'android' ? SIZES.spacing.xl : SIZES.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: SIZES.spacing.sm,
  },
  filterText: {
    marginLeft: SIZES.spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  activeTabButton: {},
  tabText: {
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.sm,
  },
  categoryContainer: {
    marginTop: SIZES.spacing.md,
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.sm,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    marginLeft: SIZES.spacing.sm,
  },
  categoryCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    marginRight: SIZES.spacing.xs,
  },
  taskCard: {
    marginVertical: SIZES.spacing.xs,
    borderColor: COLORS.gray200,
  },
  taskContainer: {
    flexDirection: 'row',
    padding: SIZES.spacing.md,
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.spacing.md,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  taskContent: {
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.gray400,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.xs,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  dueDate: {
    marginLeft: SIZES.spacing.xs,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priority: {
    marginLeft: SIZES.spacing.xs,
  },
  taskMenuButton: {
    padding: SIZES.spacing.xs,
  },
  fabContainer: {
    position: 'absolute',
    bottom: SIZES.spacing.xl,
    right: 0,
    left: 0,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default TasksScreen;