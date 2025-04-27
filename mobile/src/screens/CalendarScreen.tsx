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

// Tipos de período do dia
enum DayPeriod {
  MORNING = 'Manhã',
  AFTERNOON = 'Tarde',
  NIGHT = 'Noite'
}

// Tipos para os eventos
interface Event {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
}

// Componente para o cabeçalho do calendário com controles de navegação
const CalendarHeader = ({ date, onPrevDay, onNextDay }: any) => {
  // Formatar a data em português
  const formatDate = (date: Date) => {
    return `${date.getDate()} de ${getMonthName(date.getMonth())}`;
  };

  // Obter nome do mês em português
  const getMonthName = (month: number) => {
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return months[month];
  };

  // Calcular a quantidade de eventos (fictício para este exemplo)
  const eventCount = 0;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.dateContainer}>
        <Text variant="h3" color={COLORS.white}>
          Hoje, {formatDate(date)}
        </Text>
        <Text variant="body" color={COLORS.white} style={{ opacity: 0.8 }}>
          {eventCount} eventos
        </Text>
      </View>
      <View style={styles.navigationContainer}>
        <TouchableOpacity onPress={onPrevDay} style={styles.navigationButton}>
          <Icon name="chevron-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onNextDay} style={styles.navigationButton}>
          <Icon name="chevron-right" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Componente para os filtros de visualização do calendário
const CalendarFilters = ({ activeFilter, onFilterChange }: any) => {
  const filters = [
    { id: 'day', label: 'Dia' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mês' },
    { id: 'timeline', label: 'Timeline' }
  ];

  return (
    <View style={styles.filtersContainer}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterButton,
            activeFilter === filter.id && styles.activeFilterButton
          ]}
          onPress={() => onFilterChange(filter.id)}
        >
          <Text
            variant="body"
            color={activeFilter === filter.id ? COLORS.primary : COLORS.gray600}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.todayButton}>
        <Text variant="body" color={COLORS.primary}>
          Hoje
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente para um período do dia com seus eventos
const DayPeriodSection = ({ period, timeRange, events }: any) => {
  // Ícones para cada período do dia
  const getPeriodIcon = () => {
    switch (period) {
      case DayPeriod.MORNING:
        return <Icon name="weather-sunny" size={20} color={COLORS.warning} />;
      case DayPeriod.AFTERNOON:
        return <Icon name="weather-partly-cloudy" size={20} color={COLORS.primary} />;
      case DayPeriod.NIGHT:
        return <Icon name="weather-night" size={20} color={COLORS.secondary} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.periodSection}>
      <View style={styles.periodHeader}>
        {getPeriodIcon()}
        <Text variant="body" color={COLORS.gray700} style={styles.periodTitle}>
          {period}
        </Text>
        <Text variant="body-sm" color={COLORS.gray500} style={styles.periodTime}>
          {timeRange}
        </Text>
      </View>

      {events && events.length > 0 ? (
        events.map((event: Event) => (
          <Card key={event.id} style={styles.eventCard} variant="outlined">
            <View style={styles.eventContent}>
              <View style={styles.eventTimeContainer}>
                <Text variant="body-sm" color={COLORS.gray600}>
                  {event.startTime}
                </Text>
                <Text variant="caption" color={COLORS.gray400}>
                  -
                </Text>
                <Text variant="body-sm" color={COLORS.gray600}>
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
          </Card>
        ))
      ) : (
        <Text
          variant="body"
          color={COLORS.textSecondary}
          style={styles.noEventsText}
        >
          Nenhum evento neste período
        </Text>
      )}
    </View>
  );
};

const CalendarScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState('day');

  // Funções para navegação entre dias
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Dados fictícios para demonstração - normalmente viriam de uma API
  const morningEvents: Event[] = [];
  const afternoonEvents: Event[] = [];
  const nightEvents: Event[] = [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <CalendarHeader
          date={currentDate}
          onPrevDay={goToPreviousDay}
          onNextDay={goToNextDay}
        />

        <CalendarFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <ScrollView style={styles.scrollView}>
          <DayPeriodSection
            period={DayPeriod.MORNING}
            timeRange="6h - 12h"
            events={morningEvents}
          />
          <DayPeriodSection
            period={DayPeriod.AFTERNOON}
            timeRange="12h - 18h"
            events={afternoonEvents}
          />
          <DayPeriodSection
            period={DayPeriod.NIGHT}
            timeRange="18h - 00h"
            events={nightEvents}
          />
        </ScrollView>

        {/* Botão de adicionar evento */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? SIZES.spacing.xl : SIZES.spacing.md,
  },
  dateContainer: {
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
  },
  navigationButton: {
    padding: SIZES.spacing.xs,
    marginLeft: SIZES.spacing.sm,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: SIZES.spacing.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  filterButton: {
    paddingVertical: SIZES.spacing.xs,
    paddingHorizontal: SIZES.spacing.md,
    marginRight: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
  },
  activeFilterButton: {
    backgroundColor: COLORS.gray100,
  },
  todayButton: {
    marginLeft: 'auto',
    paddingVertical: SIZES.spacing.xs,
    paddingHorizontal: SIZES.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  periodSection: {
    marginTop: SIZES.spacing.md,
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.md,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  periodTitle: {
    marginLeft: SIZES.spacing.xs,
  },
  periodTime: {
    marginLeft: SIZES.spacing.sm,
  },
  eventCard: {
    marginBottom: SIZES.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  eventContent: {
    flexDirection: 'row',
    padding: SIZES.spacing.md,
  },
  eventTimeContainer: {
    marginRight: SIZES.spacing.md,
    alignItems: 'center',
    minWidth: 45,
  },
  eventDetails: {
    flex: 1,
  },
  noEventsText: {
    fontStyle: 'italic',
    marginVertical: SIZES.spacing.md,
    textAlign: 'center',
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

export default CalendarScreen;