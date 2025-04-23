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
  nextDueDate: Date | null;
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
  nextDueDate?: Date | string | null;
  completed?: boolean;
  recurrence?: string | null;
}
