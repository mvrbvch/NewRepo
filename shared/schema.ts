import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  birthday: timestamp("birthday").notNull(),
  avatar: text("avatar"),
  phoneNumber: text("phone_number"),
  partnerId: integer("partner_id").references(() => users.id),
  partnerStatus: text("partner_status").default("none"),
  onboardingComplete: boolean("onboarding_complete").default(false),
});

export const eventCategories = pgTable("event_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  isShared: boolean("is_shared").default(false),
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
  isShared: boolean("is_shared").default(false),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  category: text("category"), // Categoria do evento (ex: reunião, celebração, etc.)
  isSpecial: boolean("is_special").default(false), // Indica se é um evento especial
});

export const eventShares = pgTable("event_shares", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  permission: text("permission").notNull().default("view"),
});

export const eventComments = pgTable("event_comments", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calendarConnections = pgTable("calendar_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  provider: text("provider").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  syncEnabled: boolean("sync_enabled").default(true),
});

export const partnerInvites = pgTable("partner_invites", {
  id: serial("id").primaryKey(),
  inviterId: integer("inviter_id")
    .notNull()
    .references(() => users.id),
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
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  dueDate: timestamp("due_date"),
  dueTime: text("due_time"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"), // Data em que a tarefa foi concluída
  nextDueDate: timestamp("next_due_date"),
  nextDueTime: text("next_due_time"),
  recurrenceRule: text("recurrence_rule"),
  // Campos adicionais para configuração de recorrência
  weekdays: text("weekdays"), // Para recorrência semanal, dias da semana (ex: "0,2,4" para domingo, terça, quinta)
  monthDay: integer("month_day"), // Para recorrência mensal, dia do mês (1-31)
  priority: integer("priority").default(0), // Valores: 0 (baixa), 1 (média), 2 (alta) prioridade
  createdAt: timestamp("created_at").defaultNow(),
  position: integer().notNull().default(0),
  category: text("category"), // Categoria da tarefa (ex: limpeza, compras, etc.)
  isSpecial: boolean("is_special").default(false), // Indica se é uma tarefa especial
});

// Tabela para histórico de conclusão de tarefas
export const taskCompletionHistory = pgTable("task_completion_history", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => householdTasks.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  completedDate: timestamp("completed_date").notNull(), // Data de conclusão da tarefa
  expectedDate: timestamp("expected_date"), // Data em que a tarefa deveria ter sido concluída
  isCompleted: boolean("is_completed").default(true), // Se foi concluída ou marcada como não concluída
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para dispositivos registrados para push notifications
export const userDevices = pgTable("user_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // event, task, message, system, etc.
  referenceType: text("reference_type"), // event, task, message, etc.
  referenceId: integer("reference_id"),
  metadata: jsonb("metadata"), // dados adicionais em formato JSON
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para armazenar desafios de autenticação WebAuthn
export const webAuthnChallenges = pgTable("webauthn_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  challenge: text("challenge").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lembretes personalizados para eventos
export const eventReminders = pgTable("event_reminders", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  reminderTime: timestamp("reminder_time").notNull(),
  reminderType: text("reminder_type").notNull(), // push, email, sms, etc.
  sent: boolean("sent").default(false),
  message: text("message"), // Mensagem personalizada opcional
  createdAt: timestamp("created_at").defaultNow(),
});

// Lembretes personalizados para tarefas domésticas
export const taskReminders = pgTable("task_reminders", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => householdTasks.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  reminderDate: timestamp("reminder_date").notNull(),
  reminderType: text("reminder_type").notNull(), // push, email, sms, etc.
  reminderTime: text("reminder_time").notNull(), // push, email, sms, etc.
  message: text("message"), // Mensagem personalizada opcional
  sent: boolean("sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notas compartilhadas entre parceiros
export const sharedNotes = pgTable("shared_notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  pinnedOrder: integer("pinned_order"), // Se preenchido, a nota está fixada nesta posição
  color: text("color"), // Cor da nota
  attachments: jsonb("attachments"), // Anexos na nota
});

// Planejamento de projetos
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("planning"), // planning, in_progress, completed, archived
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  color: text("color"),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tarefas de projetos
export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, done
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  priority: integer("priority").default(0), // 0=baixa, 1=média, 2=alta
  position: integer("position").notNull().default(0), // Posição na lista
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const webAuthnCredentials = pgTable("webauthn_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  credentialDeviceType: text("credential_device_type").notNull(), // platform (Touch ID/Face ID) ou cross-platform (security key)
  credentialBackedUp: boolean("credential_backed_up").default(false),
  transports: text("transports"), // array de transportes suportados (internal, usb, nfc, ble)
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used"),
  authenticatorAttachment: text("authenticator_attachment"), // platform, cross-platform
  deviceName: text("device_name"), // nome amigável do dispositivo
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
  isShared: true,
  category: true,
  isSpecial: true,
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

export const insertCalendarConnectionSchema = createInsertSchema(
  calendarConnections
).pick({
  userId: true,
  provider: true,
  providerId: true,
  accessToken: true,
  refreshToken: true,
  tokenExpiry: true,
});

export const insertPartnerInviteSchema = createInsertSchema(
  partnerInvites
).pick({
  inviterId: true,
  email: true,
  phoneNumber: true,
  token: true,
});

// Este schema será atualizado mais abaixo

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
export type Event = Omit<typeof events.$inferSelect, "date"> & {
  date: Date | string;
  isRecurring?: boolean; // Indica se esta é uma instância de um evento recorrente
  originalDate?: Date | string; // Data original do evento recorrente
};

export type InsertEventShare = z.infer<typeof insertEventShareSchema>;
export type EventShare = typeof eventShares.$inferSelect;

export type InsertEventComment = z.infer<typeof insertEventCommentSchema>;
export type EventComment = Omit<
  typeof eventComments.$inferSelect,
  "createdAt"
> & {
  createdAt: Date | string | null;
};

export type InsertCalendarConnection = z.infer<
  typeof insertCalendarConnectionSchema
>;
export type CalendarConnection = Omit<
  typeof calendarConnections.$inferSelect,
  "tokenExpiry"
> & {
  tokenExpiry: Date | string | null;
};

export type InsertPartnerInvite = z.infer<typeof insertPartnerInviteSchema>;
export type PartnerInvite = Omit<
  typeof partnerInvites.$inferSelect,
  "createdAt"
> & {
  createdAt: Date | string | null;
};

export const insertHouseholdTaskSchema = createInsertSchema(
  householdTasks
).pick({
  title: true,
  description: true,
  frequency: true,
  assignedTo: true,
  createdBy: true,
  dueDate: true,
  completed: true,
  completedAt: true,
  nextDueDate: true,
  recurrenceRule: true,
  // Campos adicionais para configuração de recorrência
  weekdays: true,
  monthDay: true,
  priority: true,
  position: true,
  category: true,
  isSpecial: true,
});

export type InsertHouseholdTask = z.infer<typeof insertHouseholdTaskSchema>;
export type HouseholdTask = Omit<
  typeof householdTasks.$inferSelect,
  "dueDate" | "nextDueDate" | "createdAt" | "completedAt"
> & {
  dueDate: Date | string | null;
  nextDueDate: Date | string | null;
  createdAt: Date | string | null;
  completedAt: Date | string | null;
};

export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;
export type UserDevice = Omit<
  typeof userDevices.$inferSelect,
  "lastUsed" | "createdAt"
> & {
  lastUsed: Date | string | null;
  createdAt: Date | string | null;
};

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = Omit<
  typeof notifications.$inferSelect,
  "createdAt"
> & {
  createdAt: Date | string | null;
};

// Schema para o histórico de conclusão de tarefas
export const insertTaskCompletionHistorySchema = createInsertSchema(
  taskCompletionHistory
).pick({
  taskId: true,
  userId: true,
  completedDate: true,
  expectedDate: true,
  isCompleted: true,
});

export type InsertTaskCompletionHistory = z.infer<
  typeof insertTaskCompletionHistorySchema
>;
export type TaskCompletionHistory = Omit<
  typeof taskCompletionHistory.$inferSelect,
  "createdAt" | "completedDate" | "expectedDate"
> & {
  createdAt: Date | string | null;
  completedDate: Date | string;
  expectedDate: Date | string | null;
};

// WebAuthn schemas
export const insertWebAuthnChallengeSchema = createInsertSchema(
  webAuthnChallenges
).pick({
  userId: true,
  challenge: true,
  expiresAt: true,
});

// Schemas para inserção de novas entidades
export const insertEventCategorySchema = createInsertSchema(
  eventCategories
).pick({
  name: true,
  color: true,
  icon: true,
  userId: true,
  isShared: true,
});

export const insertEventReminderSchema = createInsertSchema(
  eventReminders
).pick({
  eventId: true,
  userId: true,
  reminderTime: true,
  reminderType: true,
  message: true,
  sent: true,
});

export const insertTaskReminderSchema = createInsertSchema(taskReminders).pick({
  taskId: true,
  userId: true,
  createdBy: true,
  reminderDate: true,
  reminderType: true,
  reminderTime: true,
  message: true,
  sent: true,
});

export const insertSharedNoteSchema = createInsertSchema(sharedNotes).pick({
  title: true,
  content: true,
  createdBy: true,
  color: true,
  attachments: true,
  pinnedOrder: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  status: true,
  createdBy: true,
  color: true,
  icon: true,
});

export const insertProjectTaskSchema = createInsertSchema(projectTasks).pick({
  projectId: true,
  title: true,
  description: true,
  status: true,
  dueDate: true,
  assignedTo: true,
  priority: true,
  position: true,
});

export const insertWebAuthnCredentialSchema = createInsertSchema(
  webAuthnCredentials
).pick({
  userId: true,
  credentialId: true,
  publicKey: true,
  counter: true,
  credentialDeviceType: true,
  credentialBackedUp: true,
  transports: true,
  authenticatorAttachment: true,
  deviceName: true,
});

export type InsertWebAuthnChallenge = z.infer<
  typeof insertWebAuthnChallengeSchema
>;
export type WebAuthnChallenge = Omit<
  typeof webAuthnChallenges.$inferSelect,
  "createdAt" | "expiresAt"
> & {
  createdAt: Date | string | null;
  expiresAt: Date | string;
};

export type InsertWebAuthnCredential = z.infer<
  typeof insertWebAuthnCredentialSchema
>;
export type WebAuthnCredential = Omit<
  typeof webAuthnCredentials.$inferSelect,
  "createdAt" | "lastUsed"
> & {
  createdAt: Date | string | null;
  lastUsed: Date | string | null;
};

export type InsertEventReminder = z.infer<typeof insertEventReminderSchema>;
export type EventReminder = Omit<
  typeof eventReminders.$inferSelect,
  "reminderTime" | "createdAt"
> & {
  reminderTime: Date | string;
  createdAt: Date | string | null;
};

export type InsertTaskReminder = z.infer<typeof insertTaskReminderSchema>;
export type TaskReminder = Omit<
  typeof taskReminders.$inferSelect,
  "reminderDate" | "createdAt"
> & {
  reminderDate: Date | string;
  createdAt: Date | string | null;
};

// Tabela para armazenar insights de relacionamento gerados pela IA
// Tabela para dicas de relacionamento geradas por IA
export const relationshipTips = pgTable("relationship_tips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  partnerId: integer("partner_id")
    .notNull()
    .references(() => users.id),
  category: text("category").notNull(), // communication, quality_time, conflict_resolution, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  actionItems: jsonb("action_items"), // Sugestões de ações práticas
  saved: boolean("saved").default(false), // Se o usuário salvou a dica como favorita
  customData: jsonb("custom_data"), // Dados adicionais específicos da categoria
  createdAt: timestamp("created_at").defaultNow(),
});

export const relationshipInsights = pgTable("relationship_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  partnerId: integer("partner_id")
    .notNull()
    .references(() => users.id),
  insightType: text("insight_type").notNull(), // communication, tasks, time_spent, habits, goals, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  sentiment: text("sentiment").notNull().default("neutral"), // positive, negative, neutral
  score: integer("score"), // De 1 a 10, indicando importância/urgência
  userRead: boolean("user_read").default(false),
  partnerRead: boolean("partner_read").default(false),
  rawData: jsonb("raw_data"), // Dados brutos que foram usados para gerar o insight
  metadata: jsonb("metadata"), // Dados adicionais, como pontuações ou destaques específicos
  actions: jsonb("actions"), // Sugestões de ações para melhorar
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Alguns insights podem ter prazo de validade
});

export const insertRelationshipInsightSchema = createInsertSchema(
  relationshipInsights
).pick({
  userId: true,
  partnerId: true,
  insightType: true,
  title: true,
  content: true,
  sentiment: true,
  score: true,
  rawData: true,
  metadata: true,
  actions: true,
  expiresAt: true,
});

export const insertRelationshipTipSchema = createInsertSchema(
  relationshipTips
).pick({
  userId: true,
  partnerId: true,
  category: true,
  title: true,
  content: true,
  actionItems: true,
  saved: true,
  customData: true,
});

export type InsertRelationshipTip = z.infer<typeof insertRelationshipTipSchema>;
export type RelationshipTip = Omit<
  typeof relationshipTips.$inferSelect,
  "createdAt"
> & {
  createdAt: Date | string | null;
};

export type InsertRelationshipInsight = z.infer<
  typeof insertRelationshipInsightSchema
>;
export type RelationshipInsight = Omit<
  typeof relationshipInsights.$inferSelect,
  "createdAt" | "expiresAt"
> & {
  createdAt: Date | string | null;
  expiresAt: Date | string | null;
};

export const generateHouseholdTaskDump = (userIds: number[]) => {
  const getRandomUserId = () =>
    userIds[Math.floor(Math.random() * userIds.length)];

  return [
    {
      title: "Limpar e organizar cômoda",
      description: "Cômodo 1 - Quarto de casal",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1, // Média prioridade
      assignedTo: getRandomUserId(),
    },
    {
      title: "Tirar pó e organizar mesa do trabalho",
      description: "Cômodo 1 - Quarto de casal",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 2, // Alta prioridade
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar as portas do guarda roupas",
      description: "Cômodo 1 - Quarto de casal",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 0, // Baixa prioridade
      assignedTo: getRandomUserId(),
    },
    {
      title: "Guardar o resto das roupas no guarda roupas",
      description: "Cômodo 2 - Escritório",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Organizar e limpar mesa do Matheus",
      description: "Cômodo 2 - Escritório",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 2,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar portas do guarda roupas",
      description: "Cômodo 2 - Escritório",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 0,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar estante de suprimentos",
      description: "Cômodo 5 - Copa",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Tirar comidas antigas da geladeira para jogar fora",
      description: "Cômodo 6 - Cozinha",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 2,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar a geladeira e microondas",
      description: "Cômodo 6 - Cozinha",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar os móveis e organizar a cozinha",
      description: "Cômodo 6 - Cozinha",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 0,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Lavar banheiros",
      description: "Cômodo 7 - Banheiros",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 2,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar prateleira",
      description: "Tarefas gerais",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Guardar todas as roupas",
      description: "Tarefas gerais",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 0,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar mesas de trabalho",
      description: "Tarefas gerais",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 2,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar as portas",
      description: "Tarefas gerais",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar janelas",
      description: "Tarefas gerais",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 0,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Arrumar as caixas do guarda roupa branco",
      description: "Tarefas gerais",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar e arrumar ventiladores",
      description: "Tarefas gerais",
      category: "maintenance",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 2,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar tanque de roupas",
      description: "Cômodo 6 - Cozinha",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 0,
      assignedTo: getRandomUserId(),
    },
    {
      title: "Limpar armário cozinha",
      description: "Cômodo 6 - Cozinha",
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1,
      assignedTo: getRandomUserId(),
    },
  ];
};
