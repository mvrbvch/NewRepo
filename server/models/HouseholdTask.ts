import {
  RecurrencePattern,
  RecurrenceOptions,
} from "../services/RecurrenceService";

export interface HouseholdTask {
  id: number;
  userId: number;
  title: string;
  description?: string;
  dueDate: Date | null;
  dueTime?: string | null; // Time in HH:mm format
  nextDueDate: Date | null;
  nextDueTime?: string | null; // Time in HH:mm format
  completed: boolean;
  recurrence: string | null; // 'daily', 'weekly', 'monthly', etc.
  createdAt: Date;
  updatedAt?: Date;
}

export interface InsertHouseholdTask {
  userId: number;
  title: string;
  description?: string;
  dueDate?: Date | string | null;
  dueTime?: string | null; // Time in HH:mm format
  nextDueDate?: Date | string | null;
  nextDueTime?: string | null; // Time in HH:mm format
  completed?: boolean;
  recurrence?: string | null;
}
