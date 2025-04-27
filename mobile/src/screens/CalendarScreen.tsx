import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { 
  Appbar, 
  Card, 
  Divider, 
  FAB, 
  Text, 
  useTheme, 
  IconButton,
  Surface,
  SegmentedButtons,
  Chip,
  Button
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Constantes
import { COLORS } from '../constants/theme';

// Tipos
interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  note?: string;
  category: 'pessoal' | 'casal' | 'trabalho' | 'família';
}

// Dados mock para demonstração
const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Café da manhã juntos',
    startTime: '07:30',
    endTime: '08:30',
    location: 'Casa',
    category: 'casal'
  },
  {
    id: '2',
    title: 'Reunião de trabalho',
    startTime: '09:00',
    endTime: '10:30',
    location: 'Escritório',
    category: 'trabalho'
  },
  {
    id: '3',
    title: 'Almoço com parceiro',
    startTime: '12:00',
    endTime: '13:30',
    location: 'Restaurante Favorito',
    note: 'Aniversário de namoro',
    category: 'casal'
  },
  {
    id: '4',
    title: 'Academia',
    startTime: '18:00',
    endTime: '19:30',
    location: 'Academia Central',
    category: 'pessoal'
  },
  {
    id: '5',
    title: 'Jantar em família',
    startTime: '20:00',
    endTime: '22:00',
    location: 'Casa dos pais',
    category: 'família'
  }
];

// Cores para categorias
const CATEGORY_COLORS = {
  'pessoal': '#9C27B0', // Roxo
  'casal': '#E91E63',   // Rosa
  'trabalho': '#2196F3', // Azul
  'família': '#4CAF50'  // Verde
};

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const theme = useTheme();

  // Formatação de datas
  const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Divisão de eventos por período do dia
  const eventsByPeriod = {
    morning: MOCK_EVENTS.filter(e => {
      const hour = parseInt(e.startTime.split(':')[0]);
      return hour >= 5 && hour < 12;
    }),
    afternoon: MOCK_EVENTS.filter(e => {
      const hour = parseInt(e.startTime.split(':')[0]);
      return hour >= 12 && hour < 18;
    }),
    evening: MOCK_EVENTS.filter(e => {
      const hour = parseInt(e.startTime.split(':')[0]);
      return hour >= 18 || hour < 5;
    })
  };

  // Renderiza um período do dia com seus eventos
  const renderPeriod = (title: string, icon: string, events: Event[]) => {
    if (selectedPeriod !== 'all' && selectedPeriod !== title.toLowerCase()) {
      return null;
    }

    return (
      <View style={styles.periodContainer}>
        <Surface style={styles.periodHeader}>
          <View style={styles.periodTitleContainer}>
            <MaterialCommunityIcons 
              name={icon} 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text variant="titleMedium" style={styles.periodTitle}>
              {title}
            </Text>
          </View>
          <Chip icon="calendar-clock">
            {events.length} eventos
          </Chip>
        </Surface>
        
        {events.length > 0 ? (
          events.map(event => (
            <Card key={event.id} style={styles.eventCard} mode="outlined">
              <View style={styles.eventTimeContainer}>
                <Text variant="titleMedium" style={styles.eventTime}>
                  {event.startTime}
                </Text>
                <Text variant="bodySmall" style={styles.eventTimeSeparator}>
                  até
                </Text>
                <Text variant="titleMedium" style={styles.eventTime}>
                  {event.endTime}
                </Text>
              </View>
              
              <Card.Content>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleContainer}>
                    <View
                      style={[
                        styles.categoryIndicator,
                        { backgroundColor: CATEGORY_COLORS[event.category] }
                      ]}
                    />
                    <Text variant="titleMedium" style={styles.eventTitle}>
                      {event.title}
                    </Text>
                  </View>
                </View>
                
                {event.location && (
                  <View style={styles.eventDetailRow}>
                    <MaterialCommunityIcons 
                      name="map-marker" 
                      size={16} 
                      color={COLORS.textSecondary}
                      style={styles.eventDetailIcon}
                    />
                    <Text variant="bodyMedium" style={styles.eventDetailText}>
                      {event.location}
                    </Text>
                  </View>
                )}
                
                {event.note && (
                  <View style={styles.eventDetailRow}>
                    <MaterialCommunityIcons 
                      name="text" 
                      size={16} 
                      color={COLORS.textSecondary}
                      style={styles.eventDetailIcon}
                    />
                    <Text variant="bodyMedium" style={styles.eventDetailText}>
                      {event.note}
                    </Text>
                  </View>
                )}
              </Card.Content>
              
              <Card.Actions>
                <Button mode="text" icon="pencil">Editar</Button>
                <Button mode="text" icon="delete" textColor={theme.colors.error}>
                  Excluir
                </Button>
              </Card.Actions>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyCardContent}>
              <MaterialCommunityIcons 
                name="calendar-blank" 
                size={40} 
                color={COLORS.textSecondary}
              />
              <Text variant="bodyLarge" style={styles.emptyText}>
                Nenhum evento neste período
              </Text>
              <Button 
                mode="outlined" 
                icon="plus" 
                onPress={() => console.log('Adicionar evento')}
                style={styles.addEventButton}
              >
                Adicionar evento
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Calendário" 
          titleStyle={styles.headerTitle}
          subtitle={formattedDate}
          subtitleStyle={styles.headerSubtitle} 
        />
        <Appbar.Action icon="calendar-month" onPress={() => console.log('Abrir seletor de data')} />
        <Appbar.Action icon="dots-vertical" onPress={() => console.log('Abrir menu')} />
      </Appbar.Header>
      
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          buttons={[
            { value: 'all', label: 'Tudo' },
            { value: 'morning', label: 'Manhã' },
            { value: 'afternoon', label: 'Tarde' },
            { value: 'evening', label: 'Noite' },
          ]}
        />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderPeriod('Manhã', 'weather-sunny', eventsByPeriod.morning)}
        {renderPeriod('Tarde', 'weather-partly-cloudy', eventsByPeriod.afternoon)}
        {renderPeriod('Noite', 'weather-night', eventsByPeriod.evening)}
      </ScrollView>
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => console.log('Adicionar novo evento')}
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
    backgroundColor: COLORS.white,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Espaço para o FAB
  },
  periodContainer: {
    marginBottom: 24,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  periodTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  eventCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryLight,
  },
  eventTime: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  eventTimeSeparator: {
    color: COLORS.primaryLight,
    marginHorizontal: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 4,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
  },
  eventTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  eventDetailIcon: {
    marginRight: 8,
  },
  eventDetailText: {
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.gray100,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  emptyCardContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginVertical: 12,
  },
  addEventButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CalendarScreen;