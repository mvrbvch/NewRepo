import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setHours,
  setMinutes,
  parseISO,
  isBefore,
  isAfter,
  isValid,
  format,
  addQuarters,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Event, HouseholdTask } from "@shared/schema";

export type RecurrenceFrequency = 
  | "never"
  | "once"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export interface RecurrenceOptions {
  frequency: RecurrenceFrequency;
  interval?: number; // For custom intervals (every X days, weeks, etc.)
  weekdays?: number[]; // For weekly recurrence on specific days (0-6, where 0 is Sunday)
  monthDay?: number; // For monthly recurrence on specific day of month
  endDate?: Date | string | null; // Optional end date for the recurrence
  timezone?: string; // User's timezone
  startDate: Date | string; // Base date to start recurrence calculations
}

export interface RecurrenceRule {
  FREQ: string; // DAILY, WEEKLY, MONTHLY, YEARLY
  INTERVAL?: number; // Default is 1 if not specified
  BYDAY?: string; // For specific days, e.g., "MO,WE,FR"
  BYMONTHDAY?: number; // For specific day of month
  UNTIL?: string; // End date in ISO format
  COUNT?: number; // Number of occurrences
}

/**
 * Service unificado para tratar recorrência tanto de eventos quanto de tarefas domésticas
 */
export class UnifiedRecurrenceService {
  /**
   * Converte uma string de recorrência simples para um objeto de opções de recorrência
   */
  static frequencyToOptions(
    frequency: RecurrenceFrequency,
    startDate: Date | string,
    endDate?: Date | string | null
  ): RecurrenceOptions {
    return {
      frequency,
      startDate,
      endDate: endDate || null,
      timezone: "UTC", // Default timezone
    };
  }

  /**
   * Converte uma string de regra de recorrência (iCalendar) para um objeto de opções de recorrência
   * Ex: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR"
   */
  static parseRecurrenceRule(
    rule: string, 
    startDate: Date | string
  ): RecurrenceOptions | null {
    try {
      const parts = rule.split(';');
      const ruleObj: Partial<RecurrenceRule> = {};
      
      parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
          ruleObj[key as keyof RecurrenceRule] = 
            key === 'INTERVAL' || key === 'BYMONTHDAY' || key === 'COUNT' 
              ? parseInt(value, 10) 
              : value;
        }
      });
      
      if (!ruleObj.FREQ) return null;
      
      const frequency = this.mapRuleFrequencyToFrequency(ruleObj.FREQ);
      if (!frequency) return null;
      
      const options: RecurrenceOptions = {
        frequency,
        interval: ruleObj.INTERVAL || 1,
        startDate,
        endDate: ruleObj.UNTIL || null,
        timezone: "UTC",
      };
      
      // Adicionar dias da semana se especificados
      if (ruleObj.BYDAY) {
        options.weekdays = this.mapByDayToWeekdays(ruleObj.BYDAY);
      }
      
      // Adicionar dia do mês se especificado
      if (ruleObj.BYMONTHDAY) {
        options.monthDay = ruleObj.BYMONTHDAY;
      }
      
      return options;
    } catch (error) {
      console.error("Erro ao analisar regra de recorrência:", error);
      return null;
    }
  }

  /**
   * Mapeia frequência de regra iCalendar para RecurrenceFrequency
   */
  private static mapRuleFrequencyToFrequency(
    ruleFreq: string
  ): RecurrenceFrequency | null {
    const map: Record<string, RecurrenceFrequency> = {
      'DAILY': 'daily',
      'WEEKLY': 'weekly',
      'MONTHLY': 'monthly',
      'YEARLY': 'yearly'
    };
    
    return map[ruleFreq] || null;
  }
  
  /**
   * Mapeia string BYDAY para array de dias da semana
   * Ex: "MO,WE,FR" => [1, 3, 5]
   */
  private static mapByDayToWeekdays(byDay: string): number[] {
    const days: Record<string, number> = {
      'SU': 0,
      'MO': 1,
      'TU': 2,
      'WE': 3,
      'TH': 4,
      'FR': 5,
      'SA': 6
    };
    
    return byDay.split(',')
      .map(d => days[d])
      .filter(d => d !== undefined);
  }

  /**
   * Converte frequência e opções para uma regra de recorrência no formato iCalendar
   */
  static buildRecurrenceRule(options: RecurrenceOptions): string {
    if (options.frequency === 'never' || options.frequency === 'once') {
      return '';
    }
    
    const parts: string[] = [];
    
    // Mapear frequência
    const freqMap: Record<RecurrenceFrequency, string> = {
      'daily': 'DAILY',
      'weekly': 'WEEKLY',
      'biweekly': 'WEEKLY', // Biweekly é weekly com intervalo 2
      'monthly': 'MONTHLY',
      'quarterly': 'MONTHLY', // Quarterly é monthly com intervalo 3
      'yearly': 'YEARLY',
      'custom': 'DAILY', // Default para custom
      'never': '',
      'once': ''
    };
    
    parts.push(`FREQ=${freqMap[options.frequency]}`);
    
    // Adicionar intervalo
    if (options.interval || options.frequency === 'biweekly' || options.frequency === 'quarterly') {
      let interval = options.interval || 1;
      
      // Casos especiais
      if (options.frequency === 'biweekly') interval = 2;
      if (options.frequency === 'quarterly') interval = 3;
      
      parts.push(`INTERVAL=${interval}`);
    }
    
    // Adicionar dias da semana
    if (options.weekdays?.length) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const byDay = options.weekdays.map(day => dayMap[day]).join(',');
      parts.push(`BYDAY=${byDay}`);
    }
    
    // Adicionar dia do mês
    if (options.monthDay) {
      parts.push(`BYMONTHDAY=${options.monthDay}`);
    }
    
    // Adicionar data final
    if (options.endDate) {
      const endDate = options.endDate instanceof Date 
        ? options.endDate 
        : new Date(options.endDate);
      
      if (isValid(endDate)) {
        parts.push(`UNTIL=${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`);
      }
    }
    
    return parts.join(';');
  }

  /**
   * Calcula a próxima data com base nas opções de recorrência
   */
  static calculateNextDate(
    baseDate: Date | string,
    options: RecurrenceOptions
  ): Date | null {
    try {
      // Se não tem recorrência, retorna null
      if (options.frequency === 'never' || options.frequency === 'once') {
        return null;
      }
      
      // Converter baseDate para Date se for string
      const baseDateObj = typeof baseDate === 'string' 
        ? new Date(baseDate) 
        : baseDate;
      
      // Use current date as base if the date is in the past
      const now = new Date();
      const startDate = baseDateObj < now ? now : baseDateObj;
      
      // Apply user's timezone if provided
      const timezone = options.timezone || "UTC";
      // Simplificando para evitar problemas com timezone
      let nextDate: Date;
      
      switch (options.frequency) {
        case "daily":
          nextDate = addDays(startDate, options.interval || 1);
          break;
        case "weekly":
          nextDate = addWeeks(startDate, options.interval || 1);
          break;
        case "biweekly":
          nextDate = addWeeks(startDate, 2);
          break;
        case "monthly":
          nextDate = addMonths(startDate, options.interval || 1);
          break;
        case "quarterly":
          nextDate = addQuarters(startDate, options.interval || 1);
          break;
        case "yearly":
          nextDate = addYears(startDate, options.interval || 1);
          break;
        case "custom":
          nextDate = this.handleCustomRecurrence(startDate, options);
          break;
        default:
          throw new Error(
            `Unsupported recurrence frequency: ${options.frequency}`
          );
      }
      
      // Retornar a data diretamente
      return nextDate;
    } catch (error) {
      console.error("Erro ao calcular próxima data:", error);
      return null;
    }
  }

  /**
   * Handle custom recurrence patterns
   */
  private static handleCustomRecurrence(
    baseDate: Date,
    options: RecurrenceOptions
  ): Date {
    if (options.weekdays && options.weekdays.length > 0) {
      // Find the next occurrence based on weekdays
      let nextDate = addDays(baseDate, 1);
      const maxIterations = 7; // Prevent infinite loop
      let iterations = 0;
      
      while (iterations < maxIterations) {
        const dayOfWeek = nextDate.getDay();
        if (options.weekdays.includes(dayOfWeek)) {
          return nextDate;
        }
        nextDate = addDays(nextDate, 1);
        iterations++;
      }
    }
    
    // If no specific pattern, default to daily
    return addDays(baseDate, options.interval || 1);
  }

  /**
   * Expande um evento recorrente para mostrar todas as instâncias dentro de um período
   */
  static expandRecurringEvent(
    event: Event,
    startDate: Date,
    endDate: Date
  ): Event[] {
    const result: Event[] = [];
    
    // Evento sem recorrência é adicionado diretamente
    if (!event.recurrence || event.recurrence === "never") {
      result.push(event);
      return result;
    }
    
    // Adiciona a instância original
    result.push(event);
    
    // Se não tem regra de recorrência, retorna apenas o original
    if (!event.recurrenceRule) {
      return result;
    }
    
    // Parse a data do evento
    let eventDate: Date;
    try {
      eventDate = typeof event.date === 'string' 
        ? new Date(event.date) 
        : event.date;
      
      if (!isValid(eventDate)) return result;
    } catch {
      return result; // Retorna só o original se não conseguir converter a data
    }
    
    // Se a data está após o período de visualização, retorna só o original
    if (isAfter(eventDate, endDate)) {
      return result;
    }
    
    // Parse a data final da recorrência
    let recurrenceEndDate: Date | null = null;
    if (event.recurrenceEnd) {
      try {
        recurrenceEndDate = typeof event.recurrenceEnd === 'string'
          ? new Date(event.recurrenceEnd)
          : event.recurrenceEnd;
          
        if (!isValid(recurrenceEndDate)) recurrenceEndDate = null;
      } catch {
        recurrenceEndDate = null;
      }
    }
    
    // Limite pelo período de visualização ou pela data de fim da recorrência
    const finalEndDate = recurrenceEndDate && isBefore(recurrenceEndDate, endDate)
      ? recurrenceEndDate
      : endDate;
    
    // Obtém as opções de recorrência da regra
    const recurrenceOptions = this.parseRecurrenceRule(
      event.recurrenceRule,
      eventDate
    );
    
    if (!recurrenceOptions) return result;
    
    // Usa a frequência da regra de recorrência para gerar instâncias
    let currentDate = eventDate;
    const maxIterations = 100; // Limite de segurança para evitar loops infinitos
    let iterations = 0;
    
    while (isBefore(currentDate, finalEndDate) && iterations < maxIterations) {
      // Calcula a próxima data
      const nextDate = this.calculateNextDate(
        currentDate,
        recurrenceOptions
      );
      
      if (!nextDate) break;
      currentDate = nextDate;
      iterations++;
      
      // Se a data está fora do período, pule
      if (isAfter(currentDate, finalEndDate)) {
        break;
      }
      
      // Adicionar nova instância do evento recorrente
      const recurringInstance: Event = {
        ...event,
        date: currentDate,
        id: event.id, // ID da instância original
        isRecurring: true, // Marcar como instância de recorrência
        originalDate: event.date, // Guardar a data original para referência
      };
      
      result.push(recurringInstance);
    }
    
    return result;
  }
  
  /**
   * Determina se uma tarefa doméstica precisa ser reativada
   * baseada em sua programação de recorrência
   */
  static shouldReactivateTask(task: HouseholdTask): boolean {
    // Se a tarefa não está completa ou não tem recorrência, não precisa reativar
    if (!task.completed || !task.frequency || task.frequency === 'once' || task.frequency === 'never') {
      return false;
    }
    
    // Se tem próxima data e está no futuro, não reativa ainda
    if (task.nextDueDate) {
      const nextDueDate = typeof task.nextDueDate === 'string'
        ? new Date(task.nextDueDate)
        : task.nextDueDate;
        
      if (isValid(nextDueDate) && isAfter(nextDueDate, new Date())) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Calcula a próxima data de vencimento para uma tarefa doméstica
   */
  static calculateNextDueDateForTask(task: HouseholdTask): Date | null {
    // Se não tem recorrência, retorna null
    if (!task.frequency || task.frequency === 'once' || task.frequency === 'never') {
      return null;
    }
    
    // Define a data base para cálculo
    let baseDate: Date;
    if (task.dueDate) {
      baseDate = typeof task.dueDate === 'string'
        ? new Date(task.dueDate)
        : task.dueDate;
    } else {
      baseDate = new Date(); // Usa hoje como base se não tem data de vencimento
    }
    
    if (!isValid(baseDate)) {
      baseDate = new Date();
    }
    
    // Cria opções de recorrência
    const options: RecurrenceOptions = {
      frequency: task.frequency as RecurrenceFrequency,
      startDate: baseDate,
      timezone: "UTC"
    };
    
    // Se tem regra de recorrência no formato iCalendar, usa-a para opções mais detalhadas
    if (task.recurrenceRule) {
      const parsedOptions = this.parseRecurrenceRule(
        task.recurrenceRule,
        baseDate
      );
      
      if (parsedOptions) {
        return this.calculateNextDate(baseDate, parsedOptions);
      }
    }
    
    // Utiliza a frequência simples se não tem regra detalhada
    return this.calculateNextDate(baseDate, options);
  }
  
  /**
   * Check if a task or event is overdue
   */
  static isOverdue(dueDate: Date | string | null): boolean {
    if (!dueDate) return false;
    
    const date = typeof dueDate === 'string'
      ? new Date(dueDate)
      : dueDate;
      
    return isValid(date) && date < new Date();
  }

  /**
   * Validate a date
   */
  static validateDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;
    
    try {
      const dateObj = typeof date === 'string'
        ? new Date(date)
        : date;
        
      return isValid(dateObj) ? dateObj : null;
    } catch {
      return null;
    }
  }
}