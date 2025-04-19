import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  partnerId: integer("partner_id").references(() => users.id),
  partnerStatus: text("partner_status").default("none"),
  onboardingComplete: boolean("onboarding_complete").default(false),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location"),
  emoji: text("emoji"),
  period: text("period").notNull(),
  recurrence: text("recurrence").default("never"),
  recurrenceEnd: timestamp("recurrence_end"),
  recurrenceRule: text("recurrence_rule"),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

export const eventShares = pgTable("event_shares", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  permission: text("permission").notNull().default("view"),
});

export const eventComments = pgTable("event_comments", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calendarConnections = pgTable("calendar_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  syncEnabled: boolean("sync_enabled").default(true),
});

export const partnerInvites = pgTable("partner_invites", {
  id: serial("id").primaryKey(),
  inviterId: integer("inviter_id").notNull().references(() => users.id),
  email: text("email"),
  phoneNumber: text("phone_number"),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para tarefas domésticas
export const householdTasks = pgTable("household_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull().default("once"), // once, daily, weekly, monthly
  assignedTo: integer("assigned_to").references(() => users.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  nextDueDate: timestamp("next_due_date"),
  recurrenceRule: text("recurrence_rule"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para dispositivos registrados para push notifications
export const userDevices = pgTable("user_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceToken: text("device_token").notNull().unique(),
  deviceType: text("device_type").notNull(), // ios, android, web
  deviceName: text("device_name"),
  pushEnabled: boolean("push_enabled").default(true),
  lastUsed: timestamp("last_used").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para notificações 
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // event, task, message, system, etc.
  referenceType: text("reference_type"), // event, task, message, etc.
  referenceId: integer("reference_id"), 
  metadata: jsonb("metadata"), // dados adicionais em formato JSON
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phoneNumber: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  date: true,
  startTime: true,
  endTime: true,
  location: true,
  emoji: true,
  period: true,
  recurrence: true,
  recurrenceEnd: true,
  recurrenceRule: true,
  createdBy: true,
});

export const insertEventShareSchema = createInsertSchema(eventShares).pick({
  eventId: true,
  userId: true,
  permission: true,
});

export const insertEventCommentSchema = createInsertSchema(eventComments).pick({
  eventId: true,
  userId: true,
  content: true,
});

export const insertCalendarConnectionSchema = createInsertSchema(calendarConnections).pick({
  userId: true,
  provider: true,
  providerId: true,
  accessToken: true,
  refreshToken: true,
  tokenExpiry: true,
});

export const insertPartnerInviteSchema = createInsertSchema(partnerInvites).pick({
  inviterId: true,
  email: true,
  phoneNumber: true,
  token: true,
});

export const insertHouseholdTaskSchema = createInsertSchema(householdTasks).pick({
  title: true,
  description: true,
  frequency: true,
  assignedTo: true,
  createdBy: true,
  dueDate: true,
  completed: true,
  nextDueDate: true,
  recurrenceRule: true,
});

export const insertUserDeviceSchema = createInsertSchema(userDevices).pick({
  userId: true,
  deviceToken: true,
  deviceType: true,
  deviceName: true,
  pushEnabled: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  referenceType: true,
  referenceId: true,
  metadata: true,
  isRead: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = Omit<typeof events.$inferSelect, 'date'> & {
  date: Date | string;
  isRecurring?: boolean; // Indica se esta é uma instância de um evento recorrente
  originalDate?: Date | string; // Data original do evento recorrente
};

export type InsertEventShare = z.infer<typeof insertEventShareSchema>;
export type EventShare = typeof eventShares.$inferSelect;

export type InsertEventComment = z.infer<typeof insertEventCommentSchema>;
export type EventComment = Omit<typeof eventComments.$inferSelect, 'createdAt'> & {
  createdAt: Date | string | null;
};

export type InsertCalendarConnection = z.infer<typeof insertCalendarConnectionSchema>;
export type CalendarConnection = Omit<typeof calendarConnections.$inferSelect, 'tokenExpiry'> & {
  tokenExpiry: Date | string | null;
};

export type InsertPartnerInvite = z.infer<typeof insertPartnerInviteSchema>;
export type PartnerInvite = Omit<typeof partnerInvites.$inferSelect, 'createdAt'> & {
  createdAt: Date | string | null;
};

export type InsertHouseholdTask = z.infer<typeof insertHouseholdTaskSchema>;
export type HouseholdTask = Omit<typeof householdTasks.$inferSelect, 'dueDate' | 'nextDueDate' | 'createdAt'> & {
  dueDate: Date | string | null;
  nextDueDate: Date | string | null;
  createdAt: Date | string | null;
};

export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;
export type UserDevice = Omit<typeof userDevices.$inferSelect, 'lastUsed' | 'createdAt'> & {
  lastUsed: Date | string | null;
  createdAt: Date | string | null;
};

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = Omit<typeof notifications.$inferSelect, 'createdAt'> & {
  createdAt: Date | string | null;
};
