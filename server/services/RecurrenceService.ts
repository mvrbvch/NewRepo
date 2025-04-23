import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setHours,
  setMinutes,
} from "date-fns";
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";

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
    const zonedDate = utcToZonedTime(startDate, timezone);

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
}
