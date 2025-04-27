import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList 
} from 'react-native';
import { 
  Card, 
  Checkbox, 
  Chip, 
  Divider, 
  FAB, 
  Text,
  Badge,
  useTheme,
  IconButton,
  List,
  SegmentedButtons
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Constantes
import { COLORS } from '../constants/theme';

// Tipos
interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  completed: boolean;
  priority: 'alta' | 'média' | 'baixa';
  assignedTo?: string;
}

// Dados mock para demonstração
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Lavar a louça',
    description: 'Lavar os pratos e copos do jantar',
    category: 'Casa',
    deadline: '2025-04-28',
    completed: false,
    priority: 'média'
  },
  {
    id: '2',
    title: 'Pagar conta de água',
    description: 'Efetuar o pagamento da conta até o vencimento',
    category: 'Finanças',
    deadline: '2025-04-30',
    completed: false,
    priority: 'alta'
  },
  {
    id: '3',
    title: 'Comprar mantimentos',
    description: 'Fazer compras semanais no supermercado',
    category: 'Compras',
    deadline: '2025-04-29',
    completed: true,
    priority: 'média'
  },
  {
    id: '4',
    title: 'Agendar jantar romântico',
    description: 'Reservar mesa para aniversário de namoro',
    category: 'Relacionamento',
    deadline: '2025-05-05',
    completed: false,
    priority: 'alta',
    assignedTo: 'parceiro'
  },
  {
    id: '5',
    title: 'Cortar a grama',
    description: 'Limpar o jardim e cortar a grama',
    category: 'Casa',
    deadline: '2025-04-28',
    completed: false,
    priority: 'baixa'
  }
];

// Cores para categorias
const categoryColors = {
  'Casa': '#8E44AD', // Roxo
  'Finanças': '#2980B9', // Azul
  'Compras': '#27AE60', // Verde
  'Relacionamento': '#E74C3C', // Vermelho
  'Outros': '#F39C12' // Laranja
};

// Ícones para categorias
const categoryIcons = {
  'Casa': 'home',
  'Finanças': 'cash',
  'Compras': 'cart',
  'Relacionamento': 'heart',
  'Outros': 'tag'
};

const TasksScreen = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState('todas');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const theme = useTheme();

  // Filtrar tarefas com base no filtro e categoria selecionada
  const filteredTasks = tasks.filter(task => {
    // Filtro de status (todas, pendentes, concluídas)
    if (filter === 'pendentes' && task.completed) return false;
    if (filter === 'concluídas' && !task.completed) return false;
    
    // Filtro de categoria
    if (selectedCategory && task.category !== selectedCategory) return false;
    
    return true;
  });

  // Marcar/desmarcar tarefa como concluída
  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Obter cores para prioridade
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'alta': return theme.colors.error;
      case 'média': return theme.colors.warning;
      case 'baixa': return theme.colors.secondary;
      default: return theme.colors.secondary;
    }
  };

  // Renderizar cada tarefa
  const renderTaskItem = ({ item }: { item: Task }) => {
    const formattedDate = new Date(item.deadline).toLocaleDateString('pt-BR');
    const categoryColor = categoryColors[item.category as keyof typeof categoryColors] || categoryColors.Outros;
    const categoryIcon = categoryIcons[item.category as keyof typeof categoryIcons] || 'tag';
    
    return (
      <Card style={styles.taskCard} mode="outlined">
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <Checkbox
              status={item.completed ? 'checked' : 'unchecked'}
              onPress={() => toggleTaskStatus(item.id)}
              color={theme.colors.primary}
            />
            <Text
              variant="titleMedium"
              style={[
                styles.taskTitle,
                item.completed && styles.completedTaskTitle
              ]}
            >
              {item.title}
            </Text>
          </View>
          
          <Badge 
            size={24} 
            style={{ backgroundColor: getPriorityColor(item.priority) }}
          >
            {item.priority === 'alta' ? '!' : ''}
          </Badge>
        </View>
        
        <Divider style={{ marginVertical: 8 }} />
        
        <List.Item
          title={item.description}
          titleStyle={[
            styles.taskDescription,
            item.completed && styles.completedTaskText
          ]}
          titleNumberOfLines={2}
          left={() => (
            <List.Icon icon="information-outline" color={theme.colors.primary} />
          )}
        />
        
        <View style={styles.taskFooter}>
          <Chip 
            icon={categoryIcon}
            style={{ backgroundColor: categoryColor + '20' }}
            textStyle={{ color: categoryColor }}
          >
            {item.category}
          </Chip>
          
          <View style={styles.taskMetadata}>
            <View style={styles.taskMetadataItem}>
              <MaterialCommunityIcons 
                name="calendar" 
                size={16} 
                color={COLORS.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text variant="bodySmall" style={styles.taskMetadataText}>
                {formattedDate}
              </Text>
            </View>
            
            {item.assignedTo && (
              <View style={styles.taskMetadataItem}>
                <MaterialCommunityIcons 
                  name="account" 
                  size={16} 
                  color={COLORS.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text variant="bodySmall" style={styles.taskMetadataText}>
                  {item.assignedTo}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  // Lista de categorias únicas
  const categories = Array.from(new Set(tasks.map(task => task.category)));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Tarefas
        </Text>
        
        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={filter}
            onValueChange={setFilter}
            buttons={[
              { value: 'todas', label: 'Todas' },
              { value: 'pendentes', label: 'Pendentes' },
              { value: 'concluídas', label: 'Concluídas' }
            ]}
            style={styles.filterButtons}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <Chip
            mode={selectedCategory === null ? 'flat' : 'outlined'}
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={styles.categoryChip}
            showSelectedCheck={false}
          >
            Todas
          </Chip>
          
          {categories.map(category => (
            <Chip
              key={category}
              mode={selectedCategory === category ? 'flat' : 'outlined'}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category === selectedCategory ? null : category)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === category 
                    ? (categoryColors[category as keyof typeof categoryColors] + '20') 
                    : 'transparent'
                }
              ]}
              icon={categoryIcons[category as keyof typeof categoryIcons] || 'tag'}
              showSelectedCheck={false}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.contentContainer}>
        {filteredTasks.length > 0 ? (
          <FlatList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.tasksList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="check-all"
              size={64}
              color={theme.colors.primary}
            />
            <Text 
              variant="titleMedium" 
              style={{ color: COLORS.textSecondary, marginTop: 16, textAlign: 'center' }}
            >
              {filter === 'concluídas' 
                ? 'Nenhuma tarefa concluída ainda' 
                : 'Nenhuma tarefa pendente'}
            </Text>
          </View>
        )}
      </View>
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => console.log('Adicionar nova tarefa')}
        color={theme.colors.onPrimary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButtons: {
    width: '100%',
  },
  categoriesContainer: {
    paddingBottom: 16,
    paddingRight: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  contentContainer: {
    flex: 1,
  },
  tasksList: {
    padding: 16,
    paddingBottom: 80, // Espaço para o FAB
  },
  taskCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  taskDescription: {
    fontSize: 14,
  },
  completedTaskText: {
    color: COLORS.textSecondary,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  taskMetadataText: {
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});

export default TasksScreen;