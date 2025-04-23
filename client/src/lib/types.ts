export interface EventType {
  id: number;
  title: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  location?: string;
  emoji?: string;
  period: "morning" | "afternoon" | "night" | "allday";
  recurrence: "never" | "daily" | "weekly" | "monthly" | "custom";
  recurrenceEnd?: string | Date;
  recurrenceRule?: string;
  createdBy: number;
  isShared?: boolean;
  sharePermission?: "view" | "edit";
}

export interface EventShareType {
  id: number;
  eventId: number;
  userId: number;
  permission: "view" | "edit";
}

export interface EventCommentType {
  id: number;
  eventId: number;
  userId: number;
  content: string;
  createdAt: string | Date;
}

export interface UserType {
  id: number;
  username: string;
  name: string;
  email: string;
  phoneNumber?: string;
  partnerId?: number | null;
  partnerStatus: "none" | "invited" | "pending" | "connected";
  onboardingComplete: boolean;
}

export interface PartnerInviteType {
  id: number;
  inviterId: number;
  email?: string;
  phoneNumber?: string;
  token: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string | Date;
}

export interface CalendarConnectionType {
  id: number;
  userId: number;
  provider: "google" | "apple" | "outlook";
  providerId: string;
  syncEnabled: boolean;
}

export interface DateSelection {
  date: Date;
  view: "day" | "week" | "month";
}

export interface HouseholdTaskType {
  id: number;
  title: string;
  description: string | null;
  frequency: "once" | "daily" | "weekly" | "monthly";
  assignedTo: number | null;
  createdBy: number;
  dueDate: string | Date | null;
  completed: boolean;
  nextDueDate: string | Date | null;
  recurrenceRule: string | null;
  priority: number; // 0: baixa, 1: média, 2: alta
  createdAt: string | Date | null;
}
