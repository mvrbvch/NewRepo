import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phoneNumber: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertEventShare = z.infer<typeof insertEventShareSchema>;
export type EventShare = typeof eventShares.$inferSelect;

export type InsertEventComment = z.infer<typeof insertEventCommentSchema>;
export type EventComment = typeof eventComments.$inferSelect;

export type InsertCalendarConnection = z.infer<typeof insertCalendarConnectionSchema>;
export type CalendarConnection = typeof calendarConnections.$inferSelect;

export type InsertPartnerInvite = z.infer<typeof insertPartnerInviteSchema>;
export type PartnerInvite = typeof partnerInvites.$inferSelect;
