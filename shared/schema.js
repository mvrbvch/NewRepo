"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHouseholdTaskDump = exports.insertRelationshipTipSchema = exports.insertRelationshipInsightSchema = exports.relationshipInsights = exports.relationshipTips = exports.insertWebAuthnCredentialSchema = exports.insertProjectTaskSchema = exports.insertProjectSchema = exports.insertSharedNoteSchema = exports.insertTaskReminderSchema = exports.insertEventReminderSchema = exports.insertEventCategorySchema = exports.insertWebAuthnChallengeSchema = exports.insertTaskCompletionHistorySchema = exports.insertHouseholdTaskSchema = exports.insertNotificationSchema = exports.insertUserDeviceSchema = exports.insertPartnerInviteSchema = exports.insertCalendarConnectionSchema = exports.insertEventCommentSchema = exports.insertEventShareSchema = exports.insertEventSchema = exports.insertUserSchema = exports.webAuthnCredentials = exports.projectTasks = exports.projects = exports.sharedNotes = exports.taskReminders = exports.eventReminders = exports.webAuthnChallenges = exports.notifications = exports.userDevices = exports.taskCompletionHistory = exports.householdTasks = exports.partnerInvites = exports.calendarConnections = exports.eventComments = exports.eventShares = exports.events = exports.eventCategories = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    birthday: (0, pg_core_1.timestamp)("birthday").notNull(),
    avatar: (0, pg_core_1.text)("avatar"),
    phoneNumber: (0, pg_core_1.text)("phone_number"),
    partnerId: (0, pg_core_1.integer)("partner_id").references(function () { return exports.users.id; }),
    partnerStatus: (0, pg_core_1.text)("partner_status").default("none"),
    onboardingComplete: (0, pg_core_1.boolean)("onboarding_complete").default(false),
});
exports.eventCategories = (0, pg_core_1.pgTable)("event_categories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    color: (0, pg_core_1.text)("color").notNull(),
    icon: (0, pg_core_1.text)("icon"),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    isShared: (0, pg_core_1.boolean)("is_shared").default(false),
});
exports.events = (0, pg_core_1.pgTable)("events", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    date: (0, pg_core_1.timestamp)("date").notNull(),
    startTime: (0, pg_core_1.text)("start_time").notNull(),
    endTime: (0, pg_core_1.text)("end_time").notNull(),
    location: (0, pg_core_1.text)("location"),
    emoji: (0, pg_core_1.text)("emoji"),
    period: (0, pg_core_1.text)("period").notNull(),
    recurrence: (0, pg_core_1.text)("recurrence").default("never"),
    recurrenceEnd: (0, pg_core_1.timestamp)("recurrence_end"),
    recurrenceRule: (0, pg_core_1.text)("recurrence_rule"),
    isShared: (0, pg_core_1.boolean)("is_shared").default(false),
    createdBy: (0, pg_core_1.integer)("created_by")
        .notNull()
        .references(function () { return exports.users.id; }),
    category: (0, pg_core_1.text)("category"), // Categoria do evento (ex: reunião, celebração, etc.)
    isSpecial: (0, pg_core_1.boolean)("is_special").default(false), // Indica se é um evento especial
});
exports.eventShares = (0, pg_core_1.pgTable)("event_shares", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    eventId: (0, pg_core_1.integer)("event_id")
        .notNull()
        .references(function () { return exports.events.id; }),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    permission: (0, pg_core_1.text)("permission").notNull().default("view"),
});
exports.eventComments = (0, pg_core_1.pgTable)("event_comments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    eventId: (0, pg_core_1.integer)("event_id")
        .notNull()
        .references(function () { return exports.events.id; }),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    content: (0, pg_core_1.text)("content").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.calendarConnections = (0, pg_core_1.pgTable)("calendar_connections", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    provider: (0, pg_core_1.text)("provider").notNull(),
    providerId: (0, pg_core_1.text)("provider_id").notNull(),
    accessToken: (0, pg_core_1.text)("access_token"),
    refreshToken: (0, pg_core_1.text)("refresh_token"),
    tokenExpiry: (0, pg_core_1.timestamp)("token_expiry"),
    syncEnabled: (0, pg_core_1.boolean)("sync_enabled").default(true),
});
exports.partnerInvites = (0, pg_core_1.pgTable)("partner_invites", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    inviterId: (0, pg_core_1.integer)("inviter_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    email: (0, pg_core_1.text)("email"),
    phoneNumber: (0, pg_core_1.text)("phone_number"),
    token: (0, pg_core_1.text)("token").notNull().unique(),
    status: (0, pg_core_1.text)("status").notNull().default("pending"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Tabela para tarefas domésticas
exports.householdTasks = (0, pg_core_1.pgTable)("household_tasks", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    frequency: (0, pg_core_1.text)("frequency").notNull().default("once"), // once, daily, weekly, monthly
    assignedTo: (0, pg_core_1.integer)("assigned_to").references(function () { return exports.users.id; }),
    createdBy: (0, pg_core_1.integer)("created_by")
        .notNull()
        .references(function () { return exports.users.id; }),
    dueDate: (0, pg_core_1.timestamp)("due_date"),
    completed: (0, pg_core_1.boolean)("completed").default(false),
    completedAt: (0, pg_core_1.timestamp)("completed_at"), // Data em que a tarefa foi concluída
    nextDueDate: (0, pg_core_1.timestamp)("next_due_date"),
    recurrenceRule: (0, pg_core_1.text)("recurrence_rule"),
    // Campos adicionais para configuração de recorrência
    weekdays: (0, pg_core_1.text)("weekdays"), // Para recorrência semanal, dias da semana (ex: "0,2,4" para domingo, terça, quinta)
    monthDay: (0, pg_core_1.integer)("month_day"), // Para recorrência mensal, dia do mês (1-31)
    priority: (0, pg_core_1.integer)("priority").default(0), // Valores: 0 (baixa), 1 (média), 2 (alta) prioridade
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    position: (0, pg_core_1.integer)().notNull().default(0),
    category: (0, pg_core_1.text)("category"), // Categoria da tarefa (ex: limpeza, compras, etc.)
    isSpecial: (0, pg_core_1.boolean)("is_special").default(false), // Indica se é uma tarefa especial
});
// Tabela para histórico de conclusão de tarefas
exports.taskCompletionHistory = (0, pg_core_1.pgTable)("task_completion_history", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    taskId: (0, pg_core_1.integer)("task_id")
        .notNull()
        .references(function () { return exports.householdTasks.id; }),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    completedDate: (0, pg_core_1.timestamp)("completed_date").notNull(), // Data de conclusão da tarefa
    expectedDate: (0, pg_core_1.timestamp)("expected_date"), // Data em que a tarefa deveria ter sido concluída
    isCompleted: (0, pg_core_1.boolean)("is_completed").default(true), // Se foi concluída ou marcada como não concluída
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Tabela para dispositivos registrados para push notifications
exports.userDevices = (0, pg_core_1.pgTable)("user_devices", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    deviceToken: (0, pg_core_1.text)("device_token").notNull().unique(),
    deviceType: (0, pg_core_1.text)("device_type").notNull(), // ios, android, web
    deviceName: (0, pg_core_1.text)("device_name"),
    pushEnabled: (0, pg_core_1.boolean)("push_enabled").default(true),
    lastUsed: (0, pg_core_1.timestamp)("last_used").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Tabela para notificações
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    title: (0, pg_core_1.text)("title").notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    type: (0, pg_core_1.text)("type").notNull(), // event, task, message, system, etc.
    referenceType: (0, pg_core_1.text)("reference_type"), // event, task, message, etc.
    referenceId: (0, pg_core_1.integer)("reference_id"),
    metadata: (0, pg_core_1.jsonb)("metadata"), // dados adicionais em formato JSON
    isRead: (0, pg_core_1.boolean)("is_read").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Tabela para armazenar desafios de autenticação WebAuthn
exports.webAuthnChallenges = (0, pg_core_1.pgTable)("webauthn_challenges", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    challenge: (0, pg_core_1.text)("challenge").notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Tabela para armazenar credenciais biométricas WebAuthn
// Lembretes personalizados para eventos
exports.eventReminders = (0, pg_core_1.pgTable)("event_reminders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    eventId: (0, pg_core_1.integer)("event_id")
        .notNull()
        .references(function () { return exports.events.id; }),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    reminderTime: (0, pg_core_1.timestamp)("reminder_time").notNull(),
    reminderType: (0, pg_core_1.text)("reminder_type").notNull(), // push, email, sms, etc.
    sent: (0, pg_core_1.boolean)("sent").default(false),
    message: (0, pg_core_1.text)("message"), // Mensagem personalizada opcional
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Lembretes personalizados para tarefas domésticas
exports.taskReminders = (0, pg_core_1.pgTable)("task_reminders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    taskId: (0, pg_core_1.integer)("task_id")
        .notNull()
        .references(function () { return exports.householdTasks.id; }),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    createdBy: (0, pg_core_1.integer)("created_by")
        .notNull()
        .references(function () { return exports.users.id; }),
    reminderDate: (0, pg_core_1.timestamp)("reminder_date").notNull(),
    reminderType: (0, pg_core_1.text)("reminder_type").notNull(), // push, email, sms, etc.
    message: (0, pg_core_1.text)("message"), // Mensagem personalizada opcional
    sent: (0, pg_core_1.boolean)("sent").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Notas compartilhadas entre parceiros
exports.sharedNotes = (0, pg_core_1.pgTable)("shared_notes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content"),
    createdBy: (0, pg_core_1.integer)("created_by")
        .notNull()
        .references(function () { return exports.users.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at"),
    pinnedOrder: (0, pg_core_1.integer)("pinned_order"), // Se preenchido, a nota está fixada nesta posição
    color: (0, pg_core_1.text)("color"), // Cor da nota
    attachments: (0, pg_core_1.jsonb)("attachments"), // Anexos na nota
});
// Planejamento de projetos
exports.projects = (0, pg_core_1.pgTable)("projects", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    startDate: (0, pg_core_1.timestamp)("start_date"),
    endDate: (0, pg_core_1.timestamp)("end_date"),
    status: (0, pg_core_1.text)("status").notNull().default("planning"), // planning, in_progress, completed, archived
    createdBy: (0, pg_core_1.integer)("created_by")
        .notNull()
        .references(function () { return exports.users.id; }),
    color: (0, pg_core_1.text)("color"),
    icon: (0, pg_core_1.text)("icon"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at"),
});
// Tarefas de projetos
exports.projectTasks = (0, pg_core_1.pgTable)("project_tasks", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    projectId: (0, pg_core_1.integer)("project_id")
        .notNull()
        .references(function () { return exports.projects.id; }),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    status: (0, pg_core_1.text)("status").notNull().default("todo"), // todo, in_progress, done
    dueDate: (0, pg_core_1.timestamp)("due_date"),
    assignedTo: (0, pg_core_1.integer)("assigned_to").references(function () { return exports.users.id; }),
    priority: (0, pg_core_1.integer)("priority").default(0), // 0=baixa, 1=média, 2=alta
    position: (0, pg_core_1.integer)("position").notNull().default(0), // Posição na lista
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
});
exports.webAuthnCredentials = (0, pg_core_1.pgTable)("webauthn_credentials", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    credentialId: (0, pg_core_1.text)("credential_id").notNull().unique(),
    publicKey: (0, pg_core_1.text)("public_key").notNull(),
    counter: (0, pg_core_1.integer)("counter").notNull().default(0),
    credentialDeviceType: (0, pg_core_1.text)("credential_device_type").notNull(), // platform (Touch ID/Face ID) ou cross-platform (security key)
    credentialBackedUp: (0, pg_core_1.boolean)("credential_backed_up").default(false),
    transports: (0, pg_core_1.text)("transports"), // array de transportes suportados (internal, usb, nfc, ble)
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    lastUsed: (0, pg_core_1.timestamp)("last_used"),
    authenticatorAttachment: (0, pg_core_1.text)("authenticator_attachment"), // platform, cross-platform
    deviceName: (0, pg_core_1.text)("device_name"), // nome amigável do dispositivo
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    username: true,
    password: true,
    name: true,
    email: true,
    phoneNumber: true,
});
exports.insertEventSchema = (0, drizzle_zod_1.createInsertSchema)(exports.events).pick({
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
exports.insertEventShareSchema = (0, drizzle_zod_1.createInsertSchema)(exports.eventShares).pick({
    eventId: true,
    userId: true,
    permission: true,
});
exports.insertEventCommentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.eventComments).pick({
    eventId: true,
    userId: true,
    content: true,
});
exports.insertCalendarConnectionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.calendarConnections).pick({
    userId: true,
    provider: true,
    providerId: true,
    accessToken: true,
    refreshToken: true,
    tokenExpiry: true,
});
exports.insertPartnerInviteSchema = (0, drizzle_zod_1.createInsertSchema)(exports.partnerInvites).pick({
    inviterId: true,
    email: true,
    phoneNumber: true,
    token: true,
});
// Este schema será atualizado mais abaixo
exports.insertUserDeviceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userDevices).pick({
    userId: true,
    deviceToken: true,
    deviceType: true,
    deviceName: true,
    pushEnabled: true,
});
exports.insertNotificationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.notifications).pick({
    userId: true,
    title: true,
    message: true,
    type: true,
    referenceType: true,
    referenceId: true,
    metadata: true,
    isRead: true,
});
exports.insertHouseholdTaskSchema = (0, drizzle_zod_1.createInsertSchema)(exports.householdTasks).pick({
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
// Schema para o histórico de conclusão de tarefas
exports.insertTaskCompletionHistorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.taskCompletionHistory).pick({
    taskId: true,
    userId: true,
    completedDate: true,
    expectedDate: true,
    isCompleted: true,
});
// WebAuthn schemas
exports.insertWebAuthnChallengeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.webAuthnChallenges).pick({
    userId: true,
    challenge: true,
    expiresAt: true,
});
// Schemas para inserção de novas entidades
exports.insertEventCategorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.eventCategories).pick({
    name: true,
    color: true,
    icon: true,
    userId: true,
    isShared: true,
});
exports.insertEventReminderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.eventReminders).pick({
    eventId: true,
    userId: true,
    reminderTime: true,
    reminderType: true,
    message: true,
    sent: true,
});
exports.insertTaskReminderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.taskReminders).pick({
    taskId: true,
    userId: true,
    createdBy: true,
    reminderDate: true,
    reminderType: true,
    message: true,
    sent: true,
});
exports.insertSharedNoteSchema = (0, drizzle_zod_1.createInsertSchema)(exports.sharedNotes).pick({
    title: true,
    content: true,
    createdBy: true,
    color: true,
    attachments: true,
    pinnedOrder: true,
});
exports.insertProjectSchema = (0, drizzle_zod_1.createInsertSchema)(exports.projects).pick({
    title: true,
    description: true,
    startDate: true,
    endDate: true,
    status: true,
    createdBy: true,
    color: true,
    icon: true,
});
exports.insertProjectTaskSchema = (0, drizzle_zod_1.createInsertSchema)(exports.projectTasks).pick({
    projectId: true,
    title: true,
    description: true,
    status: true,
    dueDate: true,
    assignedTo: true,
    priority: true,
    position: true,
});
exports.insertWebAuthnCredentialSchema = (0, drizzle_zod_1.createInsertSchema)(exports.webAuthnCredentials).pick({
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
// Tabela para armazenar insights de relacionamento gerados pela IA
// Tabela para dicas de relacionamento geradas por IA
exports.relationshipTips = (0, pg_core_1.pgTable)("relationship_tips", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    partnerId: (0, pg_core_1.integer)("partner_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    category: (0, pg_core_1.text)("category").notNull(), // communication, quality_time, conflict_resolution, etc.
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    actionItems: (0, pg_core_1.jsonb)("action_items"), // Sugestões de ações práticas
    saved: (0, pg_core_1.boolean)("saved").default(false), // Se o usuário salvou a dica como favorita
    customData: (0, pg_core_1.jsonb)("custom_data"), // Dados adicionais específicos da categoria
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.relationshipInsights = (0, pg_core_1.pgTable)("relationship_insights", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    partnerId: (0, pg_core_1.integer)("partner_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    insightType: (0, pg_core_1.text)("insight_type").notNull(), // communication, tasks, time_spent, habits, goals, etc.
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    sentiment: (0, pg_core_1.text)("sentiment").notNull().default("neutral"), // positive, negative, neutral
    score: (0, pg_core_1.integer)("score"), // De 1 a 10, indicando importância/urgência
    userRead: (0, pg_core_1.boolean)("user_read").default(false),
    partnerRead: (0, pg_core_1.boolean)("partner_read").default(false),
    rawData: (0, pg_core_1.jsonb)("raw_data"), // Dados brutos que foram usados para gerar o insight
    metadata: (0, pg_core_1.jsonb)("metadata"), // Dados adicionais, como pontuações ou destaques específicos
    actions: (0, pg_core_1.jsonb)("actions"), // Sugestões de ações para melhorar
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"), // Alguns insights podem ter prazo de validade
});
exports.insertRelationshipInsightSchema = (0, drizzle_zod_1.createInsertSchema)(exports.relationshipInsights).pick({
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
exports.insertRelationshipTipSchema = (0, drizzle_zod_1.createInsertSchema)(exports.relationshipTips).pick({
    userId: true,
    partnerId: true,
    category: true,
    title: true,
    content: true,
    actionItems: true,
    saved: true,
    customData: true,
});
var generateHouseholdTaskDump = function (userIds) {
    var getRandomUserId = function () {
        return userIds[Math.floor(Math.random() * userIds.length)];
    };
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
exports.generateHouseholdTaskDump = generateHouseholdTaskDump;
