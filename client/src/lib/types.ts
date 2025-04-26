export interface EventCategory {
  id: number;
  name: string;
  color: string;
  icon?: string;
  userId: number;
  isShared: boolean;
}

export interface EventAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
  thumbnail?: string;
}

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
  description?: string;
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
  userName?: string;
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
  view: "day" | "week" | "month" | "timeline";
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
  position: number; // posição para ordenação na lista
  createdAt: string | Date | null;
}

export interface EventReminderType {
  id: number;
  eventId: number;
  userId: number;
  reminderTime: string | Date;
  reminderType: "push" | "email" | "sms";
  sent: boolean;
  createdAt: string | Date;
}

export interface SharedNoteType {
  id: number;
  title: string;
  content: string | null;
  createdBy: number;
  createdAt: string | Date;
  updatedAt: string | Date | null;
  pinnedOrder: number | null;
  color: string | null;
  attachments: {
    url: string;
    name: string;
    type: string;
    size?: number;
    thumbnail?: string;
  }[] | null;
}

export interface ProjectType {
  id: number;
  title: string;
  description: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  status: "planning" | "in_progress" | "completed" | "archived";
  createdBy: number;
  color: string | null;
  icon: string | null;
  createdAt: string | Date;
  updatedAt: string | Date | null;
}

export interface ProjectTaskType {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  dueDate: string | Date | null;
  assignedTo: number | null;
  priority: number; // 0=baixa, 1=média, 2=alta
  position: number;
  createdAt: string | Date;
  completedAt: string | Date | null;
}
