import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setHours,
  setMinutes,
  parseISO,
  format,
  addMinutes,
} from "date-fns";

import { toZonedTime } from "date-fns-tz";

// To convert from a timezone to UTC
function zonedTimeToUtc(date: Date, timeZone: string): Date {
  const tzOffset = -date.getTimezoneOffset();
  const localDate = new Date(date);
  const targetDate = toZonedTime(date, timeZone);
  const targetOffset =
    (targetDate.getTime() - localDate.getTime()) / (60 * 1000);
  return addMinutes(date, tzOffset - targetOffset);
}

export type RecurrencePattern =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export interface RecurrenceOptions {
  pattern: RecurrencePattern;
  interval?: number; // For custom intervals (every X days, weeks, etc.)
  weekdays?: number[]; // For weekly recurrence on specific days (0-6, where 0 is Sunday)
  monthDay?: number; // For monthly recurrence on specific day of month
  endDate?: Date; // Optional end date for the recurrence
  timezone?: string; // User's timezone
}

export class RecurrenceService {
  /**
   * Calculate the next due date based on recurrence pattern
   */
  static calculateNextDueDate(
    baseDate: Date,
    recurrenceOptions: RecurrenceOptions
  ): Date {
    // Use current date as base if the task is overdue
    const now = new Date();
    const startDate = baseDate < now ? now : baseDate;

    // Apply user's timezone if provided
    const timezone = recurrenceOptions.timezone || "UTC";

    const zonedDate = toZonedTime(startDate, timezone);

    let nextDate: Date;

    switch (recurrenceOptions.pattern) {
      case "daily":
        nextDate = addDays(zonedDate, recurrenceOptions.interval || 1);
        break;
      case "weekly":
        nextDate = addWeeks(zonedDate, recurrenceOptions.interval || 1);
        break;
      case "biweekly":
        nextDate = addWeeks(zonedDate, 2);
        break;
      case "monthly":
        nextDate = addMonths(zonedDate, recurrenceOptions.interval || 1);
        break;
      case "quarterly":
        nextDate = addMonths(zonedDate, 3);
        break;
      case "yearly":
        nextDate = addYears(zonedDate, recurrenceOptions.interval || 1);
        break;
      case "custom":
        // Handle custom recurrence logic
        nextDate = this.handleCustomRecurrence(zonedDate, recurrenceOptions);
        break;
      default:
        throw new Error(
          `Unsupported recurrence pattern: ${recurrenceOptions.pattern}`
        );
    }

    // Convert back to UTC for storage
    return zonedTimeToUtc(nextDate, timezone);
  }

  /**
   * Handle custom recurrence patterns
   */
  private static handleCustomRecurrence(
    baseDate: Date,
    options: RecurrenceOptions
  ): Date {
    // Implement custom recurrence logic here
    // This could include specific weekdays, nth day of month, etc.
    return baseDate; // Placeholder
  }

  /**
   * Check if a task is overdue
   */
  static isOverdue(dueDate: Date): boolean {
    return dueDate < new Date();
  }

  /**
   * Validate a due date
   */
  static validateDueDate(dueDate: Date | null | undefined): Date | null {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Converts a date from a specific timezone to UTC
   * @param date The date to convert
   * @param timeZone The timezone of the input date (e.g., 'America/New_York')
   */
  convertToUtc(date: Date | string, timeZone: string): Date {
    // If date is a string, parse it first
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return zonedTimeToUtc(dateObj, timeZone);
  }

  /**
   * Converts a UTC date to a specific timezone
   * @param date The UTC date to convert
   * @param timeZone The target timezone (e.g., 'America/New_York')
   */
  convertFromUtc(date: Date | string, timeZone: string): Date {
    // If date is a string, parse it first
    const dateObj = typeof date === "string" ? parseISO(date) : date;

    return toZonedTime(dateObj, timeZone);
  }

  /**
   * Formats a date for display in a specific timezone
   * @param date The date to format
   * @param timeZone The timezone to format the date in
   * @param formatString The format string to use
   */
  formatInTimeZone(
    date: Date | string,
    timeZone: string,
    formatString: string
  ): string {
    // If date is a string, parse it first
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const zonedDate = toZonedTime(dateObj, timeZone);
    return format(zonedDate, formatString);
  }
}
