import {
  users,
  events,
  eventShares,
  eventComments,
  calendarConnections,
  partnerInvites,
  householdTasks,
  userDevices,
  notifications,
  eventReminders,
  taskReminders,
  relationshipInsights,
  taskCompletionHistory,
} from "@shared/schema";
import type {
  User,
  InsertUser,
  Event,
  InsertEvent,
  EventShare,
  InsertEventShare,
  EventComment,
  InsertEventComment,
  CalendarConnection,
  InsertCalendarConnection,
  PartnerInvite,
  InsertPartnerInvite,
  HouseholdTask,
  InsertHouseholdTask,
  UserDevice,
  InsertUserDevice,
  RelationshipInsight,
  InsertRelationshipInsight,
  Notification,
  InsertNotification,
  EventReminder,
  InsertEventReminder,
  TaskReminder,
  InsertTaskReminder,
  TaskCompletionHistory,
  InsertTaskCompletionHistory,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";
import { db } from "./db";
import { eq, and, or, SQL, inArray, desc, sql, count, isNull, gt } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { formatDateSafely } from "./utils";
import { UnifiedRecurrenceService, RecurrenceOptions, RecurrenceFrequency } from "./services/UnifiedRecurrenceService";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Define the session store type to fix the TypeScript error
type SessionStore = any;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Event methods
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getUserEvents(userId: number): Promise<Event[]>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Event sharing methods
  shareEvent(share: InsertEventShare): Promise<EventShare>;
  getEventShares(eventId: number): Promise<EventShare[]>;
  getSharedEvents(userId: number): Promise<Event[]>;
  updateEventSharePermission(
    id: number,
    permission: string
  ): Promise<EventShare | undefined>;
  removeEventShare(id: number): Promise<boolean>;

  // Event comments
  addEventComment(comment: InsertEventComment): Promise<EventComment>;
  getEventComments(eventId: number): Promise<EventComment[]>;

  // Calendar connections
  addCalendarConnection(
    connection: InsertCalendarConnection
  ): Promise<CalendarConnection>;
  getUserCalendarConnections(userId: number): Promise<CalendarConnection[]>;
  removeCalendarConnection(id: number): Promise<boolean>;

  // Partner invites
  createPartnerInvite(invite: InsertPartnerInvite): Promise<PartnerInvite>;
  getPartnerInviteByToken(token: string): Promise<PartnerInvite | undefined>;
  updatePartnerInvite(
    id: number,
    updates: Partial<PartnerInvite>
  ): Promise<PartnerInvite | undefined>;

  // Household tasks
  createHouseholdTask(task: InsertHouseholdTask): Promise<HouseholdTask>;
  getHouseholdTask(id: number): Promise<HouseholdTask | undefined>;
  getUserHouseholdTasks(userId: number): Promise<HouseholdTask[]>;
  getPartnerHouseholdTasks(userId: number): Promise<HouseholdTask[]>;
  updateHouseholdTask(
    id: number,
    updates: Partial<HouseholdTask>
  ): Promise<HouseholdTask | undefined>;
  deleteHouseholdTask(id: number): Promise<boolean>;
  markHouseholdTaskAsCompleted(
    id: number,
    completed: boolean,
    userId?: number
  ): Promise<HouseholdTask | undefined>;
  
  // Task Completion History
  addTaskCompletionRecord(record: InsertTaskCompletionHistory): Promise<TaskCompletionHistory>;
  getTaskCompletionHistory(taskId: number): Promise<TaskCompletionHistory[]>;
  getTaskCompletionHistoryForPeriod(
    taskId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<TaskCompletionHistory[]>;
  getMissedTasksForPeriod(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{task: HouseholdTask, missedDates: Date[]}[]>;

  // User devices for push notifications
  registerUserDevice(device: InsertUserDevice): Promise<UserDevice>;
  getUserDevices(userId: number): Promise<UserDevice[]>;
  getUserDeviceByToken(token: string): Promise<UserDevice | undefined>;
  updateUserDevice(
    id: number,
    updates: Partial<UserDevice>
  ): Promise<UserDevice | undefined>;
  deleteUserDevice(id: number): Promise<boolean>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<Notification[]>;
  deleteNotification(id: number): Promise<boolean>;

  // Event Reminders
  createEventReminder(reminder: InsertEventReminder): Promise<EventReminder>;
  getEventReminders(eventId: number): Promise<EventReminder[]>;
  getUserEventReminders(userId: number): Promise<EventReminder[]>;
  getPendingEventReminders(): Promise<EventReminder[]>;
  markEventReminderAsSent(id: number): Promise<EventReminder | undefined>;
  deleteEventReminder(id: number): Promise<boolean>;

  // Task Reminders
  createTaskReminder(reminder: InsertTaskReminder): Promise<TaskReminder>;
  getTaskReminders(taskId: number): Promise<TaskReminder[]>;
  getUserTaskReminders(userId: number): Promise<TaskReminder[]>;
  getPendingTaskReminders(): Promise<TaskReminder[]>;
  markTaskReminderAsSent(id: number): Promise<TaskReminder | undefined>;
  deleteTaskReminder(id: number): Promise<boolean>;

  // Relationship Insights
  createRelationshipInsight(insight: InsertRelationshipInsight): Promise<RelationshipInsight>;
  getRelationshipInsight(id: number): Promise<RelationshipInsight | undefined>;
  getUserRelationshipInsights(userId: number): Promise<RelationshipInsight[]>;
  getPartnerRelationshipInsights(userId: number, partnerId: number): Promise<RelationshipInsight[]>;
  updateRelationshipInsight(id: number, updates: Partial<RelationshipInsight>): Promise<RelationshipInsight | undefined>;
  markInsightAsRead(id: number, isUser: boolean): Promise<RelationshipInsight | undefined>;
  deleteRelationshipInsight(id: number): Promise<boolean>;

  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private eventsMap: Map<number, Event>;
  private eventSharesMap: Map<number, EventShare>;
  private eventCommentsMap: Map<number, EventComment>;
  private calendarConnectionsMap: Map<number, CalendarConnection>;
  private partnerInvitesMap: Map<number, PartnerInvite>;
  private householdTasksMap: Map<number, HouseholdTask>;
  private userDevicesMap: Map<number, UserDevice>;
  private notificationsMap: Map<number, Notification>;
  private eventRemindersMap: Map<number, EventReminder>;
  private taskRemindersMap: Map<number, TaskReminder>;
  private relationshipInsightsMap: Map<number, RelationshipInsight>;
  private taskCompletionHistoryMap: Map<number, TaskCompletionHistory>;

  private userIdCounter: number;
  private eventIdCounter: number;
  private eventShareIdCounter: number;
  private eventCommentIdCounter: number;
  private calendarConnectionIdCounter: number;
  private partnerInviteIdCounter: number;
  private householdTaskIdCounter: number;
  private userDeviceIdCounter: number;
  private notificationIdCounter: number;
  private eventReminderIdCounter: number;
  private taskReminderIdCounter: number;
  private relationshipInsightIdCounter: number;
  private taskCompletionHistoryIdCounter: number;

  sessionStore: SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.eventsMap = new Map();
    this.eventSharesMap = new Map();
    this.eventCommentsMap = new Map();
    this.calendarConnectionsMap = new Map();
    this.partnerInvitesMap = new Map();
    this.householdTasksMap = new Map();
    this.userDevicesMap = new Map();
    this.notificationsMap = new Map();
    this.eventRemindersMap = new Map();
    this.taskRemindersMap = new Map();
    this.relationshipInsightsMap = new Map();
    this.taskCompletionHistoryMap = new Map();

    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.eventShareIdCounter = 1;
    this.eventCommentIdCounter = 1;
    this.calendarConnectionIdCounter = 1;
    this.partnerInviteIdCounter = 1;
    this.householdTaskIdCounter = 1;
    this.userDeviceIdCounter = 1;
    this.notificationIdCounter = 1;
    this.eventReminderIdCounter = 1;
    this.taskReminderIdCounter = 1;
    this.relationshipInsightIdCounter = 1;
    this.taskCompletionHistoryIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = {
      ...insertUser,
      id,
      partnerId: null,
      partnerStatus: "none",
      onboardingComplete: false,
    };
    this.usersMap.set(id, user);
    return user;
  }

  async markAllNotificationsAsRead(userId: number): Promise<Notification[]> {
    const notifications = Array.from(this.notificationsMap.values()).filter(
      (n) => n.userId === userId && !n.isRead
    );

    for (const notification of notifications) {
      notification.isRead = true;
    }

    return notifications;
  }

  async updateUser(
    id: number,
    updates: Partial<User>
  ): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  // Event methods
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = { ...insertEvent, id };
    this.eventsMap.set(id, event);
    return event;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.eventsMap.get(id);
  }

  async getUserEvents(userId: number): Promise<Event[]> {
    return Array.from(this.eventsMap.values()).filter(
      (event) => event.createdBy === userId
    );
  }

  async updateEvent(
    id: number,
    updates: Partial<Event>
  ): Promise<Event | undefined> {
    const event = this.eventsMap.get(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...updates };
    this.eventsMap.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.eventsMap.delete(id);
  }

  // Event sharing methods
  async shareEvent(insertShare: InsertEventShare): Promise<EventShare> {
    const id = this.eventShareIdCounter++;
    const share: EventShare = {
      ...insertShare,
      id,
      permission: insertShare.permission || "read",
    };
    this.eventSharesMap.set(id, share);
    return share;
  }

  async getEventShares(eventId: number): Promise<EventShare[]> {
    return Array.from(this.eventSharesMap.values()).filter(
      (share) => share.eventId === eventId
    );
  }

  async getSharedEvents(userId: number): Promise<Event[]> {
    const shares = Array.from(this.eventSharesMap.values()).filter(
      (share) => share.userId === userId
    );

    return shares
      .map((share) => this.eventsMap.get(share.eventId)!)
      .filter(Boolean);
  }

  async updateEventSharePermission(
    id: number,
    permission: string
  ): Promise<EventShare | undefined> {
    const share = this.eventSharesMap.get(id);
    if (!share) return undefined;

    const updatedShare = { ...share, permission };
    this.eventSharesMap.set(id, updatedShare);
    return updatedShare;
  }

  async removeEventShare(id: number): Promise<boolean> {
    return this.eventSharesMap.delete(id);
  }

  // Event comments
  async addEventComment(
    insertComment: InsertEventComment
  ): Promise<EventComment> {
    const id = this.eventCommentIdCounter++;
    const comment: EventComment = {
      ...insertComment,
      id,
      createdAt: new Date(),
    };
    this.eventCommentsMap.set(id, comment);
    return comment;
  }

  async getEventComments(eventId: number): Promise<EventComment[]> {
    const comments = Array.from(this.eventCommentsMap.values()).filter(
      (comment) => comment.eventId === eventId
    );

    // Sort comments manually to handle null createdAt values (for consistency with DB implementation)
    return comments.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  // Calendar connections
  async addCalendarConnection(
    insertConnection: InsertCalendarConnection
  ): Promise<CalendarConnection> {
    const id = this.calendarConnectionIdCounter++;
    const connection: CalendarConnection = {
      ...insertConnection,
      id,
      syncEnabled: true,
    };
    this.calendarConnectionsMap.set(id, connection);
    return connection;
  }

  async getUserCalendarConnections(
    userId: number
  ): Promise<CalendarConnection[]> {
    return Array.from(this.calendarConnectionsMap.values()).filter(
      (conn) => conn.userId === userId
    );
  }

  async removeCalendarConnection(id: number): Promise<boolean> {
    return this.calendarConnectionsMap.delete(id);
  }

  // Partner invites
  async createPartnerInvite(
    insertInvite: InsertPartnerInvite
  ): Promise<PartnerInvite> {
    const id = this.partnerInviteIdCounter++;
    const invite: PartnerInvite = {
      ...insertInvite,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.partnerInvitesMap.set(id, invite);
    return invite;
  }

  async getPartnerInviteByToken(
    token: string
  ): Promise<PartnerInvite | undefined> {
    return Array.from(this.partnerInvitesMap.values()).find(
      (invite) => invite.token === token
    );
  }

  async updatePartnerInvite(
    id: number,
    updates: Partial<PartnerInvite>
  ): Promise<PartnerInvite | undefined> {
    const invite = this.partnerInvitesMap.get(id);
    if (!invite) return undefined;

    const updatedInvite = { ...invite, ...updates };
    this.partnerInvitesMap.set(id, updatedInvite);
    return updatedInvite;
  }

  // Household tasks methods
  async createHouseholdTask(
    insertTask: InsertHouseholdTask
  ): Promise<HouseholdTask> {
    const id = this.householdTaskIdCounter++;
    const task: HouseholdTask = {
      ...insertTask,
      id,
      completed: insertTask.completed || false,
      createdAt: new Date(),
      dueDate: insertTask.dueDate || null,
      nextDueDate: insertTask.nextDueDate || null,
      description: insertTask.description || null,
      recurrenceRule: insertTask.recurrenceRule || null,
      frequency: insertTask.frequency || "once",
      assignedTo: insertTask.assignedTo || null,
    };
    this.householdTasksMap.set(id, task);
    return task;
  }
  async getHouseholdTask(id: number): Promise<HouseholdTask | undefined> {
    return this.householdTasksMap.get(id);
  }

  async getUserHouseholdTasks(userId: number): Promise<HouseholdTask[]> {
    return Array.from(this.householdTasksMap.values()).filter(
      (task) => task.assignedTo === userId || task.createdBy === userId
    );
  }

  async getPartnerHouseholdTasks(userId: number): Promise<HouseholdTask[]> {
    // Primeiro, encontre o usuário
    const user = this.usersMap.get(userId);
    if (!user || !user.partnerId) return [];

    // Retorne as tarefas atribuídas ao parceiro
    return Array.from(this.householdTasksMap.values()).filter(
      (task) =>
        task.assignedTo === user.partnerId || task.createdBy === user.partnerId
    );
  }

  async updateHouseholdTask(
    id: number,
    updates: Partial<HouseholdTask>
  ): Promise<HouseholdTask | undefined> {
    const task = this.householdTasksMap.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.householdTasksMap.set(id, updatedTask);
    return updatedTask;
  }

  async deleteHouseholdTask(id: number): Promise<boolean> {
    return this.householdTasksMap.delete(id);
  }

  async markHouseholdTaskAsCompleted(
    id: number,
    completed: boolean,
    userId?: number
  ): Promise<HouseholdTask | undefined> {
    const task = this.householdTasksMap.get(id);
    if (!task) return undefined;

    // Se a tarefa for recorrente, atualizar a próxima data de vencimento
    let nextDueDate = task.nextDueDate;
    let completedAt = null;
    
    if (completed) {
      const currentDate = new Date();
      completedAt = currentDate;
      
      // Registrar no histórico de conclusão se tiver userId
      if (userId) {
        const completionRecord: InsertTaskCompletionHistory = {
          taskId: id,
          userId: userId,
          completedDate: currentDate,
          expectedDate: task.dueDate,
          isCompleted: true
        };
        this.addTaskCompletionRecord(completionRecord);
      }
      
      // Calcular a próxima data de vencimento com base na frequência e nas opções de recorrência
      if (task.frequency !== "once" && task.frequency !== "never") {
        const options: RecurrenceOptions = {
          frequency: task.frequency as RecurrenceFrequency,
          startDate: currentDate,
          weekdays: task.weekdays ? task.weekdays.split(',').map(day => parseInt(day)) : undefined,
          monthDay: task.monthDay || undefined
        };
        
        // Usar o UnifiedRecurrenceService para calcular a próxima data
        nextDueDate = UnifiedRecurrenceService.calculateNextDate(currentDate, options);
      }
    } else if (task.completed && !completed && userId) {
      // Se estiver desmarcando uma tarefa como concluída, registrar como não concluída
      const currentDate = new Date();
      const completionRecord: InsertTaskCompletionHistory = {
        taskId: id,
        userId: userId,
        completedDate: currentDate,
        expectedDate: task.dueDate,
        isCompleted: false
      };
      this.addTaskCompletionRecord(completionRecord);
    }

    const updatedTask = { 
      ...task, 
      completed, 
      nextDueDate,
      completedAt 
    };
    this.householdTasksMap.set(id, updatedTask);
    return updatedTask;
  }
  
  // Implementação de métodos para histórico de conclusão de tarefas
  async addTaskCompletionRecord(record: InsertTaskCompletionHistory): Promise<TaskCompletionHistory> {
    const id = this.taskCompletionHistoryIdCounter++;
    const historyRecord: TaskCompletionHistory = {
      ...record,
      id,
      createdAt: new Date()
    };
    this.taskCompletionHistoryMap.set(id, historyRecord);
    return historyRecord;
  }
  
  async getTaskCompletionHistory(taskId: number): Promise<TaskCompletionHistory[]> {
    return Array.from(this.taskCompletionHistoryMap.values())
      .filter(record => record.taskId === taskId)
      .sort((a, b) => {
        const dateA = new Date(a.completedDate).getTime();
        const dateB = new Date(b.completedDate).getTime();
        return dateB - dateA; // Ordenar por data de conclusão, mais recente primeiro
      });
  }
  
  async getTaskCompletionHistoryForPeriod(
    taskId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<TaskCompletionHistory[]> {
    return Array.from(this.taskCompletionHistoryMap.values())
      .filter(record => {
        const recordDate = new Date(record.completedDate);
        return record.taskId === taskId && 
               recordDate >= startDate && 
               recordDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.completedDate).getTime();
        const dateB = new Date(b.completedDate).getTime();
        return dateA - dateB; // Ordenar por data de conclusão, mais antiga primeiro
      });
  }
  
  async getMissedTasksForPeriod(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{task: HouseholdTask, missedDates: Date[]}[]> {
    // Obter tarefas do usuário
    const userTasks = await this.getUserHouseholdTasks(userId);
    const result: {task: HouseholdTask, missedDates: Date[]}[] = [];
    
    // Para cada tarefa, verificar histórico de não conclusões no período
    for (const task of userTasks) {
      const history = await this.getTaskCompletionHistoryForPeriod(task.id, startDate, endDate);
      
      // Filtrar por registros marcados como não concluídos
      const missedRecords = history.filter(record => !record.isCompleted);
      if (missedRecords.length > 0) {
        const missedDates = missedRecords.map(record => new Date(record.completedDate));
        result.push({
          task,
          missedDates
        });
      }
    }
    
    return result;
  }

  // Métodos para dispositivos do usuário
  async registerUserDevice(
    insertDevice: InsertUserDevice
  ): Promise<UserDevice> {
    const id = this.userDeviceIdCounter++;
    const device: UserDevice = {
      ...insertDevice,
      id,
      lastUsed: new Date(),
      createdAt: new Date(),
    };
    this.userDevicesMap.set(id, device);
    return device;
  }

  async getUserDevices(userId: number): Promise<UserDevice[]> {
    return Array.from(this.userDevicesMap.values()).filter(
      (device) => device.userId === userId
    );
  }

  async getUserDeviceByToken(token: string): Promise<UserDevice | undefined> {
    return Array.from(this.userDevicesMap.values()).find(
      (device) => device.deviceToken === token
    );
  }

  async updateUserDevice(
    id: number,
    updates: Partial<UserDevice>
  ): Promise<UserDevice | undefined> {
    const device = this.userDevicesMap.get(id);
    if (!device) return undefined;

    const updatedDevice = { ...device, ...updates, lastUsed: new Date() };
    this.userDevicesMap.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteUserDevice(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userDevices)
        .where(eq(userDevices.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir dispositivo:", error);
      return false;
    }
  }

  // Métodos para notificações
  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: new Date(),
    };
    this.notificationsMap.set(id, notification);
    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    const notifications = Array.from(this.notificationsMap.values()).filter(
      (notification) => notification.userId === userId
    );

    // Ordenar notificações pela data de criação (mais recentes primeiro)
    return notifications.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notificationsMap.get(id);
    if (!notification) return undefined;

    const updatedNotification = { ...notification, isRead: true };
    this.notificationsMap.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notificationsMap.delete(id);
  }

  // Métodos para lembretes de eventos
  async createEventReminder(
    insertReminder: InsertEventReminder
  ): Promise<EventReminder> {
    const id = this.eventReminderIdCounter++;
    const reminder: EventReminder = {
      ...insertReminder,
      id,
      sent: false,
      createdAt: new Date(),
      reminderTime: insertReminder.reminderTime,
    };
    this.eventRemindersMap.set(id, reminder);
    return reminder;
  }

  async getEventReminders(eventId: number): Promise<EventReminder[]> {
    return Array.from(this.eventRemindersMap.values())
      .filter((reminder) => reminder.eventId === eventId)
      .sort((a, b) => {
        // Ordenar por tempo do lembrete, mais próximos primeiro
        const timeA = a.reminderTime ? new Date(a.reminderTime).getTime() : 0;
        const timeB = b.reminderTime ? new Date(b.reminderTime).getTime() : 0;
        return timeA - timeB;
      });
  }

  async getUserEventReminders(userId: number): Promise<EventReminder[]> {
    return Array.from(this.eventRemindersMap.values())
      .filter((reminder) => reminder.userId === userId)
      .sort((a, b) => {
        // Ordenar por tempo do lembrete, mais próximos primeiro
        const timeA = a.reminderTime ? new Date(a.reminderTime).getTime() : 0;
        const timeB = b.reminderTime ? new Date(b.reminderTime).getTime() : 0;
        return timeA - timeB;
      });
  }

  async getPendingEventReminders(): Promise<EventReminder[]> {
    const now = new Date();
    return Array.from(this.eventRemindersMap.values())
      .filter((reminder) => {
        // Filtrar lembretes não enviados e que já passaram do tempo programado
        return (
          !reminder.sent &&
          reminder.reminderTime &&
          new Date(reminder.reminderTime) <= now
        );
      })
      .sort((a, b) => {
        // Ordenar por tempo do lembrete, mais antigos primeiro
        const timeA = a.reminderTime ? new Date(a.reminderTime).getTime() : 0;
        const timeB = b.reminderTime ? new Date(b.reminderTime).getTime() : 0;
        return timeA - timeB;
      });
  }

  async markEventReminderAsSent(
    id: number
  ): Promise<EventReminder | undefined> {
    const reminder = this.eventRemindersMap.get(id);
    if (!reminder) return undefined;

    const updatedReminder = { ...reminder, sent: true };
    this.eventRemindersMap.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteEventReminder(id: number): Promise<boolean> {
    return this.eventRemindersMap.delete(id);
  }

  // Métodos para lembretes de tarefas
  async createTaskReminder(
    insertReminder: InsertTaskReminder
  ): Promise<TaskReminder> {
    const [newReminder] = await db
      .insert(taskReminders)
      .values({
        taskId: insertReminder.taskId,
        userId: insertReminder.userId,
        createdBy: insertReminder.createdBy,
        reminderDate: insertReminder.reminderDate,
        reminderType: insertReminder.reminderType,
        message: insertReminder.message || null,
        sent: false,
      })
      .returning();

    return {
      ...newReminder,
      reminderDate: newReminder.reminderDate.toISOString(),
      createdAt: newReminder.createdAt ? newReminder.createdAt.toISOString() : null,
    };
  }

  async getTaskReminders(taskId: number): Promise<TaskReminder[]> {
    const results = await db
      .select()
      .from(taskReminders)
      .where(eq(taskReminders.taskId, taskId))
      .orderBy(taskReminders.reminderDate);

    return results.map((reminder) => ({
      ...reminder,
      reminderDate: reminder.reminderDate.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async getUserTaskReminders(userId: number): Promise<TaskReminder[]> {
    const results = await db
      .select()
      .from(taskReminders)
      .where(eq(taskReminders.userId, userId))
      .orderBy(taskReminders.reminderDate);

    return results.map((reminder) => ({
      ...reminder,
      reminderDate: reminder.reminderDate.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async getPendingTaskReminders(): Promise<TaskReminder[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(taskReminders)
      .where(
        and(
          eq(taskReminders.sent, false),
          sql`${taskReminders.reminderDate} <= ${now}`
        )
      )
      .orderBy(taskReminders.reminderDate);

    return results.map((reminder) => ({
      ...reminder,
      reminderDate: reminder.reminderDate.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async markTaskReminderAsSent(
    id: number
  ): Promise<TaskReminder | undefined> {
    const reminder = this.taskRemindersMap.get(id);
    if (!reminder) return undefined;

    const updatedReminder = { ...reminder, sent: true };
    this.taskRemindersMap.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteTaskReminder(id: number): Promise<boolean> {
    return this.taskRemindersMap.delete(id);
  }

  // Relationship Insights implementation
  private relationshipInsightsMap: Map<number, RelationshipInsight>;
  private relationshipInsightIdCounter: number;

  async createRelationshipInsight(insight: InsertRelationshipInsight): Promise<RelationshipInsight> {
    const id = ++this.relationshipInsightIdCounter;
    const now = new Date();
    
    const newInsight: RelationshipInsight = {
      id,
      userId: insight.userId,
      partnerId: insight.partnerId,
      insightType: insight.insightType,
      title: insight.title,
      content: insight.content,
      sentiment: insight.sentiment,
      score: insight.score,
      actions: insight.actions,
      rawData: insight.rawData,
      metadata: insight.metadata,
      userRead: false,
      partnerRead: false,
      createdAt: now,
      expiresAt: insight.expiresAt || null
    };
    
    this.relationshipInsightsMap.set(id, newInsight);
    return newInsight;
  }

  async getRelationshipInsight(id: number): Promise<RelationshipInsight | undefined> {
    return this.relationshipInsightsMap.get(id);
  }

  async getUserRelationshipInsights(userId: number): Promise<RelationshipInsight[]> {
    const now = new Date();
    return Array.from(this.relationshipInsightsMap.values())
      .filter(
        insight => 
          (insight.userId === userId || insight.partnerId === userId) && 
          (!insight.expiresAt || insight.expiresAt > now)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPartnerRelationshipInsights(userId: number, partnerId: number): Promise<RelationshipInsight[]> {
    const now = new Date();
    return Array.from(this.relationshipInsightsMap.values())
      .filter(
        insight => 
          ((insight.userId === userId && insight.partnerId === partnerId) || 
           (insight.userId === partnerId && insight.partnerId === userId)) && 
          (!insight.expiresAt || insight.expiresAt > now)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateRelationshipInsight(id: number, updates: Partial<RelationshipInsight>): Promise<RelationshipInsight | undefined> {
    const insight = this.relationshipInsightsMap.get(id);
    if (!insight) return undefined;
    
    const updatedInsight = { 
      ...insight,
      ...updates
    };
    
    this.relationshipInsightsMap.set(id, updatedInsight);
    return updatedInsight;
  }

  async markInsightAsRead(id: number, isUser: boolean): Promise<RelationshipInsight | undefined> {
    const insight = this.relationshipInsightsMap.get(id);
    if (!insight) return undefined;
    
    const updatedInsight = { 
      ...insight, 
      ...(isUser ? { userRead: true } : { partnerRead: true })
    };
    
    this.relationshipInsightsMap.set(id, updatedInsight);
    return updatedInsight;
  }

  async deleteRelationshipInsight(id: number): Promise<boolean> {
    return this.relationshipInsightsMap.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // Implementação dos métodos de histórico de conclusão de tarefas
  async addTaskCompletionRecord(record: InsertTaskCompletionHistory): Promise<TaskCompletionHistory> {
    try {
      const [newRecord] = await db
        .insert(taskCompletionHistory)
        .values({
          taskId: record.taskId,
          userId: record.userId,
          completedDate: record.completedDate,
          expectedDate: record.expectedDate || null,
          isCompleted: record.isCompleted !== undefined ? record.isCompleted : true,
        })
        .returning();
        
      return {
        ...newRecord,
        completedDate: formatDateSafely(newRecord.completedDate),
        expectedDate: newRecord.expectedDate ? formatDateSafely(newRecord.expectedDate) : null,
        createdAt: newRecord.createdAt ? formatDateSafely(newRecord.createdAt) : null,
      };
    } catch (error) {
      console.error("Erro ao adicionar registro de conclusão:", error);
      throw error;
    }
  }
  
  async getTaskCompletionHistory(taskId: number): Promise<TaskCompletionHistory[]> {
    try {
      const results = await db
        .select()
        .from(taskCompletionHistory)
        .where(eq(taskCompletionHistory.taskId, taskId))
        .orderBy(desc(taskCompletionHistory.completedDate));
        
      return results.map(record => ({
        ...record,
        completedDate: formatDateSafely(record.completedDate),
        expectedDate: record.expectedDate ? formatDateSafely(record.expectedDate) : null,
        createdAt: record.createdAt ? formatDateSafely(record.createdAt) : null,
      }));
    } catch (error) {
      console.error("Erro ao obter histórico de conclusão:", error);
      return [];
    }
  }
  
  async getTaskCompletionHistoryForPeriod(
    taskId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<TaskCompletionHistory[]> {
    try {
      const results = await db
        .select()
        .from(taskCompletionHistory)
        .where(
          and(
            eq(taskCompletionHistory.taskId, taskId),
            // Verificar se a data de conclusão está dentro do período
            sql`${taskCompletionHistory.completedDate} >= ${startDate}`,
            sql`${taskCompletionHistory.completedDate} <= ${endDate}`
          )
        )
        .orderBy(taskCompletionHistory.completedDate);
        
      return results.map(record => ({
        ...record,
        completedDate: formatDateSafely(record.completedDate),
        expectedDate: record.expectedDate ? formatDateSafely(record.expectedDate) : null,
        createdAt: record.createdAt ? formatDateSafely(record.createdAt) : null,
      }));
    } catch (error) {
      console.error("Erro ao obter histórico de conclusão para o período:", error);
      return [];
    }
  }
  
  async getMissedTasksForPeriod(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{task: HouseholdTask, missedDates: Date[]}[]> {
    try {
      // Obter tarefas do usuário
      const userTasks = await this.getUserHouseholdTasks(userId);
      const result: {task: HouseholdTask, missedDates: Date[]}[] = [];
      
      // Para cada tarefa, buscar histórico de não conclusões no período
      for (const task of userTasks) {
        const history = await this.getTaskCompletionHistoryForPeriod(task.id, startDate, endDate);
        
        // Filtrar por registros marcados como não concluídos
        const missedRecords = history.filter(record => !record.isCompleted);
        if (missedRecords.length > 0) {
          const missedDates = missedRecords.map(record => new Date(record.completedDate));
          result.push({
            task,
            missedDates
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Erro ao obter tarefas não concluídas:", error);
      return [];
    }
  }
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User devices methods
  async registerUserDevice(device: InsertUserDevice): Promise<UserDevice> {
    const [userDevice] = await db
      .insert(userDevices)
      .values({
        ...device,
        lastUsed: new Date(),
        createdAt: new Date(),
      })
      .returning();

    return {
      ...userDevice,
      lastUsed: userDevice.lastUsed ? userDevice.lastUsed.toISOString() : null,
      createdAt: userDevice.createdAt
        ? userDevice.createdAt.toISOString()
        : null,
    };
  }

  async getUserDevices(userId: number): Promise<UserDevice[]> {
    const devices = await db
      .select()
      .from(userDevices)
      .where(eq(userDevices.userId, userId));

    return devices.map((device) => ({
      ...device,
      lastUsed: device.lastUsed ? device.lastUsed.toISOString() : null,
      createdAt: device.createdAt ? device.createdAt.toISOString() : null,
    }));
  }

  async getUserDeviceByToken(token: string): Promise<UserDevice | undefined> {
    const [device] = await db
      .select()
      .from(userDevices)
      .where(eq(userDevices.deviceToken, token));

    if (!device) return undefined;

    return {
      ...device,
      lastUsed: device.lastUsed ? device.lastUsed.toISOString() : null,
      createdAt: device.createdAt ? device.createdAt.toISOString() : null,
    };
  }

  async updateUserDevice(
    id: number,
    updates: Partial<Omit<UserDevice, "createdAt">>
  ): Promise<UserDevice | undefined> {
    const [device] = await db
      .update(userDevices)
      .set({
        ...updates,
        lastUsed: new Date(),
      })
      .where(eq(userDevices.id, id))
      .returning();

    if (!device) return undefined;

    return {
      ...device,
      lastUsed: device.lastUsed ? device.lastUsed.toISOString() : null,
      createdAt: device.createdAt ? device.createdAt.toISOString() : null,
    };
  }
  async deleteUserDevice(id: number): Promise<boolean> {
    const result = await db.delete(userDevices).where(eq(userDevices.id, id));
    return true; // Drizzle não retorna informação fácil sobre se algo foi deletado
  }

  // Notifications methods
  async createNotification(
    notification: InsertNotification
  ): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        createdAt: new Date(),
      })
      .returning();

    return {
      ...newNotification,
      createdAt: newNotification.createdAt
        ? newNotification.createdAt.toISOString()
        : null,
    };
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return userNotifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt
        ? notification.createdAt.toISOString()
        : null,
    }));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    if (!notification) return undefined;

    return {
      ...notification,
      createdAt: notification.createdAt
        ? notification.createdAt.toISOString()
        : null,
    };
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();

    if (!notification) return undefined;

    return {
      ...notification,
      createdAt: notification.createdAt
        ? notification.createdAt.toISOString()
        : null,
    };
  }

  async markAllNotificationsAsRead(userId: number): Promise<Notification[]> {
    const updatedNotifications = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId))
      .returning();

    if (!updatedNotifications.length) return [];

    return updatedNotifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt
        ? notification.createdAt.toISOString()
        : null,
    }));
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    return true; // Drizzle não retorna informação fácil sobre se algo foi deletado
  }

  // Métodos para lembretes de eventos
  async createEventReminder(
    reminder: InsertEventReminder
  ): Promise<EventReminder> {
    const [newReminder] = await db
      .insert(eventReminders)
      .values({
        ...reminder,
        sent: false,
        createdAt: new Date(),
      })
      .returning();

    return {
      ...newReminder,
      reminderTime: newReminder.reminderTime.toISOString(),
      createdAt: newReminder.createdAt ? newReminder.createdAt.toISOString() : null,
    };
  }

  async getEventReminders(eventId: number): Promise<EventReminder[]> {
    const results = await db
      .select()
      .from(eventReminders)
      .where(eq(eventReminders.eventId, eventId))
      .orderBy(eventReminders.reminderTime);

    return results.map((reminder) => ({
      ...reminder,
      reminderTime: reminder.reminderTime.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async getUserEventReminders(userId: number): Promise<EventReminder[]> {
    const results = await db
      .select()
      .from(eventReminders)
      .where(eq(eventReminders.userId, userId))
      .orderBy(eventReminders.reminderTime);

    return results.map((reminder) => ({
      ...reminder,
      reminderTime: reminder.reminderTime.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async getPendingEventReminders(): Promise<EventReminder[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(eventReminders)
      .where(
        and(
          eq(eventReminders.sent, false),
          sql`${eventReminders.reminderTime} <= ${now}`
        )
      )
      .orderBy(eventReminders.reminderTime);

    return results.map((reminder) => ({
      ...reminder,
      reminderTime: reminder.reminderTime.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async markEventReminderAsSent(
    id: number
  ): Promise<EventReminder | undefined> {
    const [reminder] = await db
      .update(eventReminders)
      .set({ sent: true })
      .where(eq(eventReminders.id, id))
      .returning();

    if (!reminder) return undefined;

    return {
      ...reminder,
      reminderTime: reminder.reminderTime.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    };
  }

  async deleteEventReminder(id: number): Promise<boolean> {
    await db.delete(eventReminders).where(eq(eventReminders.id, id));
    return true;
  }

  // Métodos para lembretes de tarefas
  async createTaskReminder(
    reminder: InsertTaskReminder
  ): Promise<TaskReminder> {
    const [newReminder] = await db
      .insert(taskReminders)
      .values({
        ...reminder,
        sent: false,
        createdAt: new Date(),
      })
      .returning();

    return {
      ...newReminder,
      reminderDate: newReminder.reminderDate.toISOString(),
      createdAt: newReminder.createdAt ? newReminder.createdAt.toISOString() : null,
    };
  }

  async getTaskReminders(taskId: number): Promise<TaskReminder[]> {
    const results = await db
      .select()
      .from(taskReminders)
      .where(eq(taskReminders.taskId, taskId))
      .orderBy(taskReminders.reminderDate);

    return results.map((reminder) => ({
      ...reminder,
      reminderDate: reminder.reminderDate.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async getUserTaskReminders(userId: number): Promise<TaskReminder[]> {
    const results = await db
      .select()
      .from(taskReminders)
      .where(eq(taskReminders.userId, userId))
      .orderBy(taskReminders.reminderDate);

    return results.map((reminder) => ({
      ...reminder,
      reminderDate: reminder.reminderDate.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async getPendingTaskReminders(): Promise<TaskReminder[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(taskReminders)
      .where(
        and(
          eq(taskReminders.sent, false),
          sql`${taskReminders.reminderDate} <= ${now}`
        )
      )
      .orderBy(taskReminders.reminderDate);

    return results.map((reminder) => ({
      ...reminder,
      reminderDate: reminder.reminderDate.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    }));
  }

  async markTaskReminderAsSent(
    id: number
  ): Promise<TaskReminder | undefined> {
    const [reminder] = await db
      .update(taskReminders)
      .set({ sent: true })
      .where(eq(taskReminders.id, id))
      .returning();

    if (!reminder) return undefined;

    return {
      ...reminder,
      reminderDate: reminder.reminderDate.toISOString(),
      createdAt: reminder.createdAt ? reminder.createdAt.toISOString() : null,
    };
  }

  async deleteTaskReminder(id: number): Promise<boolean> {
    await db.delete(taskReminders).where(eq(taskReminders.id, id));
    return true;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  /**
   * Retrieves a user from the database by their email address.
   *
   * @param email The email address of the user to retrieve
   * @returns The user with the matching email, or undefined if no user is found
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = (await db
      .insert(users)
      .values({
        ...insertUser,
        partnerStatus: "none",
        onboardingComplete: false,
      })
      .returning()) as User[];
    return user;
  }
  async updateUser(
    id: number,
    updates: Partial<User>
  ): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Event methods
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    // Para garantir que a data seja válida
    let eventDate = new Date();

    if (insertEvent.date) {
      if (insertEvent.date instanceof Date) {
        if (!isNaN(insertEvent.date.getTime())) {
          eventDate = insertEvent.date;
        } else {
          console.error(
            "Data inválida recebida como objeto Date:",
            insertEvent.date
          );
        }
      } else if (typeof insertEvent.date === "string") {
        try {
          const parsedDate = new Date(insertEvent.date);
          if (!isNaN(parsedDate.getTime())) {
            eventDate = parsedDate;
          } else {
            console.error(
              "Data inválida recebida como string:",
              insertEvent.date
            );
          }
        } catch (err) {
          console.error("Erro ao converter string para data:", err);
        }
      }
    }

    // Processar a data de término da recorrência se existir
    let recurrenceEndDate: Date | null = null;
    if (insertEvent.recurrenceEnd) {
      if (insertEvent.recurrenceEnd instanceof Date) {
        if (!isNaN(insertEvent.recurrenceEnd.getTime())) {
          recurrenceEndDate = insertEvent.recurrenceEnd;
        }
      } else if (typeof insertEvent.recurrenceEnd === "string") {
        try {
          const parsedDate = new Date(insertEvent.recurrenceEnd);
          if (!isNaN(parsedDate.getTime())) {
            recurrenceEndDate = parsedDate;
          }
        } catch (err) {
          console.error(
            "Erro ao converter string de recorrenceEnd para data:",
            err
          );
        }
      }
    }

    // Gerar regra de recorrência se necessário
    let recurrenceRule = insertEvent.recurrenceRule;
    if (
      insertEvent.recurrence &&
      insertEvent.recurrence !== "never" &&
      !recurrenceRule
    ) {
      recurrenceRule = this.generateRecurrenceRule(
        insertEvent.recurrence,
        recurrenceEndDate
      );
    }

    // Garantir que os campos opcionais sejam null quando não fornecidos
    const eventData = {
      ...insertEvent,
      date: eventDate,
      location: insertEvent.location || null,
      emoji: insertEvent.emoji || null,
      recurrence: insertEvent.recurrence || "never",
      recurrenceEnd: recurrenceEndDate,
      recurrenceRule: recurrenceRule,
      isShared: insertEvent.isShared || false,
    };

    console.log("Creating event with data:", eventData);

    const [event] = await db.insert(events).values(eventData).returning();

    // Formatar a data antes de retornar
    return this.formatEventDates(event);
  }

  // Método para gerar regra de recorrência baseada na frequência escolhida
  private generateRecurrenceRule(
    recurrence: string,
    endDate: Date | null
  ): string {
    let rule = "";

    switch (recurrence) {
      case "daily":
        rule = "FREQ=DAILY";
        break;
      case "weekly":
        rule = "FREQ=WEEKLY";
        break;
      case "monthly":
        rule = "FREQ=MONTHLY";
        break;
      case "custom":
        // Definição padrão para custom, pode ser sobrescrita com regras específicas
        rule = "FREQ=DAILY";
        break;
      default:
        return "";
    }

    // Adicionar data de término se especificada
    if (endDate && !isNaN(endDate.getTime())) {
      const formattedDate =
        endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      rule += `;UNTIL=${formattedDate}`;
    }

    return rule;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        emoji: events.emoji,
        period: events.period,
        recurrence: events.recurrence,
        recurrenceEnd: events.recurrenceEnd,
        recurrenceRule: events.recurrenceRule,
        createdBy: events.createdBy,
        isShared: events.isShared,
      })
      .from(events)
      .where(eq(events.id, id));

    return event ? this.formatEventDates(event) : undefined;
  }

  // Função auxiliar para formatar as datas dos eventos
  private formatEventDates(event: Event): Event {
    // Criar uma cópia do evento para não modificar o original
    const formattedEvent = { ...event };

    // Debug log
    console.log(
      `Formatando evento ${formattedEvent.id}, data original:`,
      formattedEvent.date
    );

    // Processar a data principal do evento
    if (!formattedEvent.date) {
      // Se a data for null ou undefined, definir a data atual para evitar erros na renderização
      console.warn(
        `Evento ${formattedEvent.id} sem data definida - usando data atual`
      );
      formattedEvent.date = new Date();
    } else if (formattedEvent.date instanceof Date) {
      // Se for um objeto Date, verificar se é válido
      try {
        if (!isNaN(formattedEvent.date.getTime())) {
          console.log(`Evento ${formattedEvent.id} - data objeto válida`);
        } else {
          console.warn(
            `Evento ${formattedEvent.id} tem data inválida (objeto Date) - usando data atual`
          );
          formattedEvent.date = new Date();
        }
      } catch (error) {
        console.error(
          `Erro ao validar Date no evento ${formattedEvent.id}:`,
          error
        );
        formattedEvent.date = new Date();
      }
    } else if (typeof formattedEvent.date === "string") {
      // Se for uma string, converter para Date
      try {
        // Se a data estiver no formato YYYY-MM-DD, adicionar a parte de hora
        if (formattedEvent.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedEvent.date = new Date(`${formattedEvent.date}T00:00:00`);
        } else {
          formattedEvent.date = new Date(formattedEvent.date);
        }

        // Verificar se é uma data válida
        if (isNaN(formattedEvent.date.getTime())) {
          console.warn(
            `Evento ${formattedEvent.id} tem data string inválida - usando data atual`
          );
          formattedEvent.date = new Date();
        }
      } catch (err) {
        console.error(
          `Erro ao converter string para Date para evento ${formattedEvent.id}:`,
          err
        );
        formattedEvent.date = new Date();
      }
    } else {
      // Para qualquer outro tipo de valor, converter para data atual
      console.warn(
        `Evento ${formattedEvent.id} tem formato de data desconhecido:`,
        typeof formattedEvent.date
      );
      formattedEvent.date = new Date();
    }

    // Processar a data de término da recorrência
    if (formattedEvent.recurrenceEnd) {
      console.log(
        `Processando recurrenceEnd para evento ${formattedEvent.id}:`,
        formattedEvent.recurrenceEnd
      );

      if (formattedEvent.recurrenceEnd instanceof Date) {
        try {
          if (isNaN(formattedEvent.recurrenceEnd.getTime())) {
            console.warn(
              `Evento ${formattedEvent.id} tem recurrenceEnd inválido (objeto Date) - definindo como null`
            );
            formattedEvent.recurrenceEnd = null;
          }
        } catch (error) {
          console.error(
            `Erro ao validar recurrenceEnd para evento ${formattedEvent.id}:`,
            error
          );
          formattedEvent.recurrenceEnd = null;
        }
      } else if (typeof formattedEvent.recurrenceEnd === "string") {
        try {
          // Se a data estiver no formato YYYY-MM-DD, adicionar a parte de hora
          if (formattedEvent.recurrenceEnd.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedEvent.recurrenceEnd = new Date(
              `${formattedEvent.recurrenceEnd}T00:00:00`
            );
          } else {
            formattedEvent.recurrenceEnd = new Date(
              formattedEvent.recurrenceEnd
            );
          }

          // Verificar se a data é válida
          if (isNaN(formattedEvent.recurrenceEnd.getTime())) {
            console.warn(
              `Evento ${formattedEvent.id} tem recurrenceEnd string inválida - definindo como null`
            );
            formattedEvent.recurrenceEnd = null;
          }
        } catch (err) {
          console.error(
            `Erro ao converter recurrenceEnd string para Date para evento ${formattedEvent.id}:`,
            err
          );
          formattedEvent.recurrenceEnd = null;
        }
      } else {
        console.warn(
          `Evento ${formattedEvent.id} tem recurrenceEnd em formato desconhecido:`,
          typeof formattedEvent.recurrenceEnd
        );
        formattedEvent.recurrenceEnd = null;
      }
    }

    console.log(
      `Evento formatado: ID=${formattedEvent.id}, Data=${formattedEvent.date}`
    );
    return formattedEvent;
  }
  async getUserEvents(userId: number): Promise<Event[]> {
    // Selecionando explicitamente os campos para evitar problemas com novas colunas
    const userEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        emoji: events.emoji,
        period: events.period,
        recurrence: events.recurrence,
        recurrenceEnd: events.recurrenceEnd,
        recurrenceRule: events.recurrenceRule,
        createdBy: events.createdBy,
        isShared: events.isShared,
      })
      .from(events)
      .where(eq(events.createdBy, userId));

    // Formatar as datas dos eventos antes de retorná-los
    return userEvents.map((event) => this.formatEventDates(event));
  }

  async updateEvent(
    id: number,
    updates: Partial<Event>
  ): Promise<Event | undefined> {
    // Para atualizações que envolvem uma data, precisamos garantir que é um objeto Date
    const processedUpdates: any = { ...updates };

    // Se a data estiver presente como string, converta para Date
    if (typeof processedUpdates.date === "string") {
      try {
        processedUpdates.date = new Date(processedUpdates.date);
      } catch (error) {
        console.error("Error converting date string to Date:", error);
      }
    }

    // Mesmo para recurrenceEnd
    if (typeof processedUpdates.recurrenceEnd === "string") {
      try {
        processedUpdates.recurrenceEnd = new Date(
          processedUpdates.recurrenceEnd
        );
      } catch (error) {
        console.error("Error converting recurrenceEnd string to Date:", error);
      }
    }

    const [updatedEvent] = await db
      .update(events)
      .set(processedUpdates)
      .where(eq(events.id, id))
      .returning();

    return updatedEvent ? this.formatEventDates(updatedEvent) : undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(events).where(eq(events.id, id));
    // Since we donan't have a reliable way to get the count, assume it succeeded
    return true;
  }

  // Event sharing methods
  async shareEvent(insertShare: InsertEventShare): Promise<EventShare> {
    // Garantir que permission sempre tenha um valor
    const shareData = {
      ...insertShare,
      permission: insertShare.permission || "view",
    };

    console.log("Sharing event with data:", shareData);

    const [share] = await db.insert(eventShares).values(shareData).returning();

    return share;
  }

  async getEventShares(eventId: number): Promise<EventShare[]> {
    return await db
      .select()
      .from(eventShares)
      .where(eq(eventShares.eventId, eventId));
  }

  async getSharedEvents(userId: number): Promise<Event[]> {
    const shares = await db
      .select()
      .from(eventShares)
      .where(eq(eventShares.userId, userId));

    if (shares.length === 0) return [];

    // Get events one by one since we have type issues with the inArray operator
    const sharedEvents: Event[] = [];
    for (const share of shares) {
      // Usando um select explícito para cada evento para evitar problemas com novas colunas
      const [event] = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          date: events.date,
          startTime: events.startTime,
          endTime: events.endTime,
          location: events.location,
          emoji: events.emoji,
          period: events.period,
          recurrence: events.recurrence,
          recurrenceEnd: events.recurrenceEnd,
          recurrenceRule: events.recurrenceRule,
          createdBy: events.createdBy,
          isShared: events.isShared,
        })
        .from(events)
        .where(eq(events.id, share.eventId));

      if (event) {
        sharedEvents.push(this.formatEventDates(event));
      }
    }

    return sharedEvents;
  }

  async updateEventSharePermission(
    id: number,
    permission: string
  ): Promise<EventShare | undefined> {
    const [updatedShare] = await db
      .update(eventShares)
      .set({ permission })
      .where(eq(eventShares.id, id))
      .returning();
    return updatedShare;
  }

  async removeEventShare(id: number): Promise<boolean> {
    await db.delete(eventShares).where(eq(eventShares.id, id));
    // Since we don't have a reliable way to get the count, assume it succeeded
    return true;
  }

  // Event comments
  async addEventComment(
    insertComment: InsertEventComment
  ): Promise<EventComment> {
    const [comment] = await db
      .insert(eventComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getEventComments(eventId: number): Promise<EventComment[]> {
    // Add explicit handling for possibly null createdAt dates
    const comments = await db
      .select()
      .from(eventComments)
      .where(eq(eventComments.eventId, eventId));

    // Sort comments manually to handle null createdAt values
    comments.map((comment) => ({
      ...comment,
      userName: this.getUser(comment.userId).then((user) => user?.name),
    }));

    return comments.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  // Calendar connections
  async addCalendarConnection(
    insertConnection: InsertCalendarConnection
  ): Promise<CalendarConnection> {
    // Garantir que os campos opcionais sejam null quando não fornecidos
    const connectionData = {
      ...insertConnection,
      accessToken: insertConnection.accessToken || null,
      refreshToken: insertConnection.refreshToken || null,
      tokenExpiry: insertConnection.tokenExpiry || null,
      syncEnabled: true,
    };

    console.log("Adding calendar connection with data:", connectionData);

    const [connection] = await db
      .insert(calendarConnections)
      .values(connectionData)
      .returning();

    return connection;
  }

  async getUserCalendarConnections(
    userId: number
  ): Promise<CalendarConnection[]> {
    return await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId));
  }

  async removeCalendarConnection(id: number): Promise<boolean> {
    await db.delete(calendarConnections).where(eq(calendarConnections.id, id));
    // Since we don't have a reliable way to get the count, assume it succeeded
    return true;
  }

  // Partner invites
  async createPartnerInvite(
    insertInvite: InsertPartnerInvite
  ): Promise<PartnerInvite> {
    // Garantir que os campos opcionais sejam null quando não fornecidos
    const inviteData = {
      ...insertInvite,
      email: insertInvite.email || null,
      phoneNumber: insertInvite.phoneNumber || null,
      status: "pending",
    };

    console.log("Creating partner invite with data:", inviteData);

    const [invite] = await db
      .insert(partnerInvites)
      .values(inviteData)
      .returning();

    return invite;
  }

  async getPartnerInviteByToken(
    token: string
  ): Promise<PartnerInvite | undefined> {
    const [invite] = await db
      .select()
      .from(partnerInvites)
      .where(eq(partnerInvites.token, token));
    return invite;
  }

  async updatePartnerInvite(
    id: number,
    updates: Partial<Omit<PartnerInvite, "createdAt">>
  ): Promise<PartnerInvite | undefined> {
    const [updatedInvite] = await db
      .update(partnerInvites)
      .set(updates)
      .where(eq(partnerInvites.id, id))
      .returning();
    return updatedInvite;
  }
  // Household tasks methods
  async createHouseholdTask(task: InsertHouseholdTask): Promise<HouseholdTask> {
    // Get the highest current position
    const [maxPositionResult] = await db
      .select({
        maxPosition: sql`COALESCE(MAX(${householdTasks.position}), -1)`,
      })
      .from(householdTasks)
      .where(eq(householdTasks.id, task.id));

    const nextPosition = (Number(maxPositionResult?.maxPosition) ?? -1) + 1;

    const [newTask] = await db
      .insert(householdTasks)
      .values({
        ...task,
        position: nextPosition,
        createdAt: new Date(),
      })
      .returning();

    return {
      ...newTask,
      dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
      createdAt: newTask.createdAt ? newTask.createdAt.toISOString() : null,
    };
  }
  // Função auxiliar para formatar as datas das tarefas
  private formatHouseholdTaskDates(task: any): HouseholdTask {
    const formattedTask = { ...task };

    // Função auxiliar para formatar datas de forma segura
    const formatDateSafely = (dateValue: any): string | null => {
      if (!dateValue) return null;

      try {
        if (dateValue instanceof Date) {
          // Verificar se a data é válida
          if (isNaN(dateValue.getTime())) {
            console.log("Data inválida (Date object):", dateValue);
            return null;
          }
          return dateValue.toISOString();
        } else if (typeof dateValue === "string") {
          // Para datas no formato YYYY-MM-DD, adicione a parte de tempo
          if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateValue = `${dateValue}T00:00:00Z`;
          }

          // Verificar se a string de data pode ser convertida em um Date válido
          const tempDate = new Date(dateValue);
          if (isNaN(tempDate.getTime())) {
            console.log("Data inválida (string):", dateValue);
            return null;
          }
          return tempDate.toISOString();
        }
      } catch (err) {
        console.error("Erro ao processar data:", err, dateValue);
      }

      return null;
    };

    // Aplicar a função de formatação às datas
    formattedTask.dueDate = formatDateSafely(formattedTask.dueDate);
    formattedTask.nextDueDate = formatDateSafely(formattedTask.nextDueDate);
    formattedTask.createdAt = formatDateSafely(formattedTask.createdAt);

    return formattedTask;
  }

  async getHouseholdTask(id: number): Promise<HouseholdTask | undefined> {
    try {
      // Validar o ID para garantir que seja um número inteiro válido
      const validId = Number(id);
      if (isNaN(validId) || !Number.isInteger(validId) || validId <= 0) {
        console.warn(`ID de tarefa inválido recebido: ${id}`);
        return undefined;
      }

      const [task] = await db
        .select()
        .from(householdTasks)
        .where(eq(householdTasks.id, validId));
      if (!task) return undefined;

      // Formatar datas de forma segura usando a função utilitária
      return {
        ...task,
        dueDate: formatDateSafely(task.dueDate),
        nextDueDate: formatDateSafely(task.nextDueDate),
        createdAt: formatDateSafely(task.createdAt),
      } as HouseholdTask;
    } catch (error) {
      console.error("Erro ao buscar tarefa doméstica:", error);
      return undefined;
    }
  }

  async getUserHouseholdTasks(
    userId: number,
    date?: Date
  ): Promise<HouseholdTask[]> {
    try {
      let query = db
        .select()
        .from(householdTasks)
        .where(
          or(
            eq(householdTasks.assignedTo, userId),
            eq(householdTasks.createdBy, userId)
          )
        );

      // If a date is provided, add date filtering
      if (date) {
        // Convert the provided date to start and end of day for comparison
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Add date filter condition
        query = query.where(
          and(
            householdTasks.dueDate >= startOfDay,
            householdTasks.dueDate <= endOfDay
          )
        );
      }

      const tasks = await query;

      // Mapear cada tarefa e formatar suas datas de forma segura usando a função utilitária
      return tasks.map((task) => {
        return {
          ...task,
          dueDate: formatDateSafely(task.dueDate),
          nextDueDate: formatDateSafely(task.nextDueDate),
          createdAt: formatDateSafely(task.createdAt),
        } as HouseholdTask;
      });
    } catch (error) {
      console.error("Erro ao buscar tarefas do usuário:", error);
      return [];
    }
  }

  async getPartnerHouseholdTasks(userId: number): Promise<HouseholdTask[]> {
    try {
      // Primeiro, encontrar o usuário e seu parceiro
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.partnerId) return [];

      // Obter as tarefas do parceiro
      const tasks = await db
        .select()
        .from(householdTasks)
        .where(or(eq(householdTasks.assignedTo, user.partnerId)));

      // Mapear cada tarefa e formatar suas datas de forma segura usando a função utilitária
      return tasks.map((task) => {
        return {
          ...task,
          dueDate: formatDateSafely(task.dueDate),
          nextDueDate: formatDateSafely(task.nextDueDate),
          createdAt: formatDateSafely(task.createdAt),
        } as HouseholdTask;
      });
    } catch (error) {
      console.error("Erro ao buscar tarefas do parceiro:", error);
      return [];
    }
  }

  async updateHouseholdTask(
    id: number,
    updates: Partial<HouseholdTask>
  ): Promise<HouseholdTask | undefined> {
    try {
      // Processar datas se estiverem sendo atualizadas
      const processedUpdates: any = { ...updates };

      if (typeof processedUpdates.dueDate === "string") {
        try {
          // Usar a mesma lógica de formatDateSafely mas convertendo para Date
          if (processedUpdates.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            processedUpdates.dueDate = `${processedUpdates.dueDate}T00:00:00.000Z`;
          }
          processedUpdates.dueDate = new Date(processedUpdates.dueDate);
          if (isNaN(processedUpdates.dueDate.getTime())) {
            console.log("dueDate inválido, definindo como null");
            processedUpdates.dueDate = null;
          }
        } catch (err) {
          console.error("Erro ao converter dueDate para Date:", err);
          processedUpdates.dueDate = null;
        }
      }

      if (typeof processedUpdates.nextDueDate === "string") {
        try {
          // Usar a mesma lógica de formatDateSafely mas convertendo para Date
          if (processedUpdates.nextDueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            processedUpdates.nextDueDate = `${processedUpdates.nextDueDate}T00:00:00.000Z`;
          }
          processedUpdates.nextDueDate = new Date(processedUpdates.nextDueDate);
          if (isNaN(processedUpdates.nextDueDate.getTime())) {
            console.log("nextDueDate inválido, definindo como null");
            processedUpdates.nextDueDate = null;
          }
        } catch (err) {
          console.error("Erro ao converter nextDueDate para Date:", err);
          processedUpdates.nextDueDate = null;
        }
      }

      const [updatedTask] = await db
        .update(householdTasks)
        .set(processedUpdates)
        .where(eq(householdTasks.id, id))
        .returning();

      if (!updatedTask) return undefined;

      // Formatar datas de forma segura usando a função utilitária
      return {
        ...updatedTask,
        dueDate: formatDateSafely(updatedTask.dueDate),
        nextDueDate: formatDateSafely(updatedTask.nextDueDate),
        createdAt: formatDateSafely(updatedTask.createdAt),
      } as HouseholdTask;
    } catch (error) {
      console.error("Erro ao atualizar tarefa doméstica:", error);
      return undefined;
    }
  }

  async deleteHouseholdTask(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(householdTasks)
        .where(eq(householdTasks.id, id))
        .returning({ id: householdTasks.id });

      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir tarefa doméstica:", error);
      return false;
    }
  }

  async markHouseholdTaskAsCompleted(
    id: number,
    completed: boolean,
    userId?: number
  ): Promise<HouseholdTask | undefined> {
    try {
      // Obter a tarefa atual
      const [task] = await db
        .select()
        .from(householdTasks)
        .where(eq(householdTasks.id, id));
      if (!task) return undefined;

      // Objeto com os campos a serem atualizados
      const updateData: any = { completed };
      
      // Registrar data de conclusão
      if (completed) {
        // Registra a data atual como momento da conclusão
        const completionDate = new Date();
        updateData.completedAt = completionDate;
        
        // Registrar no histórico de conclusão se tiver userId
        if (userId) {
          try {
            const completionRecord: InsertTaskCompletionHistory = {
              taskId: id,
              userId: userId,
              completedDate: completionDate,
              expectedDate: task.dueDate,
              isCompleted: true
            };
            await this.addTaskCompletionRecord(completionRecord);
            console.log("Registro de conclusão adicionado:", completionRecord);
          } catch (error) {
            console.error("Erro ao registrar histórico de conclusão:", error);
            // Continuar mesmo se falhar o registro no histórico
          }
        }
        
        // Caso seja uma tarefa recorrente
        if (task.frequency && task.frequency !== "once" && task.frequency !== "never") {
          // Criar as opções de recorrência para usar o serviço unificado
          const options: RecurrenceOptions = {
            frequency: task.frequency as RecurrenceFrequency,
            startDate: completionDate,
            weekdays: task.weekdays ? task.weekdays.split(',').map(day => parseInt(day)) : undefined,
            monthDay: task.monthDay || undefined
          };
          
          // Usar o UnifiedRecurrenceService para calcular a próxima data de vencimento
          const nextDueDate = UnifiedRecurrenceService.calculateNextDate(completionDate, options);
          
          if (nextDueDate) {
            updateData.nextDueDate = nextDueDate;
            console.log("Próxima data de vencimento calculada:", {
              taskId: id,
              frequency: task.frequency,
              options,
              nextDueDate: nextDueDate.toISOString()
            });
          }
        }
      }
      // Caso esteja desmarcando (voltando a incompleta)
      else if (!completed) {
        // Se a tarefa tiver uma próxima data programada, reseta-a para null
        // isso evita que tarefas recorrentes gerem múltiplas instâncias quando desmarcadas
        updateData.nextDueDate = null;
        // Limpar a data de conclusão
        updateData.completedAt = null;
        
        // Registrar desmarcação no histórico se tiver userId
        if (userId && task.completed) {
          try {
            const completionRecord: InsertTaskCompletionHistory = {
              taskId: id,
              userId: userId,
              completedDate: new Date(),
              expectedDate: task.dueDate,
              isCompleted: false
            };
            await this.addTaskCompletionRecord(completionRecord);
            console.log("Registro de desmarcação adicionado:", completionRecord);
          } catch (error) {
            console.error("Erro ao registrar histórico de desmarcação:", error);
            // Continuar mesmo se falhar o registro no histórico
          }
        }
      }

      console.log("Atualizando status da tarefa:", {
        id,
        completed,
        updateData,
      });

      // Atualizar a tarefa
      const [updatedTask] = await db
        .update(householdTasks)
        .set(updateData)
        .where(eq(householdTasks.id, id))
        .returning();

      if (!updatedTask) return undefined;

      // Formatar datas de forma segura usando a função utilitária
      return {
        ...updatedTask,
        dueDate: formatDateSafely(updatedTask.dueDate),
        nextDueDate: formatDateSafely(updatedTask.nextDueDate),
        createdAt: formatDateSafely(updatedTask.createdAt),
        completedAt: formatDateSafely(updatedTask.completedAt),
      } as HouseholdTask;
    } catch (error) {
      console.error("Erro ao marcar tarefa como concluída:", error);
      return undefined;
    }
  }

  // Verify if tasks exist before attempting to update them
  async verifyTasksExist(taskIds: number[]): Promise<boolean> {
    try {
      if (taskIds.length === 0) return false;

      // Filter out any invalid IDs (like NaN)
      const validIds = taskIds.filter(
        (id) =>
          typeof id === "number" && !isNaN(id) && Number.isInteger(id) && id > 0
      );

      // If we lost any IDs during filtering, log it
      if (validIds.length !== taskIds.length) {
        console.warn(
          `Filtered out ${taskIds.length - validIds.length} invalid IDs from verification`
        );
        console.warn(`Original IDs:`, taskIds);
        console.warn(`Valid IDs:`, validIds);
      }

      if (validIds.length === 0) return false;

      // Count how many tasks exist with the given IDs using SQL
      const results = await db.execute(
        sql`SELECT COUNT(*) as count FROM household_tasks WHERE id IN (${sql.join(validIds, sql`, `)})`
      );

      // Extract the count from the result
      const foundCount = parseInt(
        (results.rows[0]?.count as string) || "0",
        10
      );
      return foundCount === validIds.length;
    } catch (error) {
      console.error("Error verifying tasks exist:", error);
      return false;
    }
  }

  /**
   * Verifica se todas as tarefas pertencem ao usuário informado (criadas por ele ou atribuídas a ele)
   *
   * @param userId ID do usuário
   * @param taskIds Array de IDs de tarefas para verificar
   * @returns true se todas as tarefas pertencem ao usuário, false caso contrário
   */
  async verifyTasksBelongToUser(
    userId: number,
    taskIds: number[]
  ): Promise<boolean> {
    try {
      if (taskIds.length === 0) return false;

      // Filter out any invalid IDs (like NaN)
      const validIds = taskIds.filter(
        (id) =>
          typeof id === "number" && !isNaN(id) && Number.isInteger(id) && id > 0
      );

      if (validIds.length === 0) return false;

      // Contar quantas tarefas existem com os IDs fornecidos E pertencem ao usuário
      const results = await db.execute(
        sql`SELECT COUNT(*) as count FROM household_tasks 
            WHERE id IN (${sql.join(validIds, sql`, `)}) 
            AND (created_by = ${userId} OR assigned_to = ${userId})`
      );

      // Extrair a contagem do resultado
      const foundCount = parseInt(
        (results.rows[0]?.count as string) || "0",
        10
      );

      // Verificar se todas as tarefas foram encontradas
      const allTasksBelongToUser = foundCount === validIds.length;

      // Log detalhado apenas se nem todas as tarefas pertencerem ao usuário
      if (!allTasksBelongToUser) {
        console.warn(
          `Usuário ${userId} tentou reordenar tarefas que não lhe pertencem.`
        );
        console.warn(`IDs das tarefas: ${validIds.join(", ")}`);
        console.warn(
          `Tarefas pertencentes ao usuário: ${foundCount} de ${validIds.length}`
        );
      }

      return allTasksBelongToUser;
    } catch (error) {
      console.error(
        "Erro ao verificar se tarefas pertencem ao usuário:",
        error
      );
      return false;
    }
  }

  async updateTaskPositions(
    tasks: { id: number; position: number }[]
  ): Promise<boolean> {
    try {
      // Log the tasks being updated
      console.log("Updating task positions for:", tasks);

      // Validação extra detalhada para depuração
      for (const task of tasks) {
        console.log(`Validando tarefa:`, {
          id: task.id,
          tipo_id: typeof task.id,
          isNaN_id: isNaN(task.id),
          isInteger_id: Number.isInteger(task.id),
          position: task.position,
          tipo_position: typeof task.position,
          isNaN_position: isNaN(task.position),
          isInteger_position: Number.isInteger(task.position),
        });
      }

      // First, filter out any tasks with invalid IDs or positions
      let validTasks = tasks.filter((task) => {
        // Validação de ID
        if (task.id === undefined || task.id === null) {
          console.warn(`Tarefa com ID undefined/null rejeitada`);
          return false;
        }

        if (isNaN(task.id)) {
          console.warn(`Tarefa com ID NaN rejeitada: ${task.id}`);
          return false;
        }

        if (!Number.isInteger(task.id) || task.id <= 0) {
          console.warn(
            `Tarefa com ID não inteiro ou negativo rejeitada: ${task.id}`
          );
          return false;
        }

        // Validação de posição
        if (task.position === undefined || task.position === null) {
          console.warn(`Tarefa com posição undefined/null rejeitada`);
          return false;
        }

        if (isNaN(task.position)) {
          console.warn(`Tarefa com posição NaN rejeitada: ${task.position}`);
          return false;
        }

        if (!Number.isInteger(task.position) || task.position < 0) {
          console.warn(
            `Tarefa com posição não inteira ou negativa rejeitada: ${task.position}`
          );
          return false;
        }

        return true;
      });

      // Log any filtered out tasks
      if (validTasks.length !== tasks.length) {
        console.warn(
          `Filtered out ${tasks.length - validTasks.length} invalid tasks from position update`
        );
        console.warn("Original tasks:", tasks);
        console.warn("Valid tasks:", validTasks);
      }

      if (validTasks.length === 0) {
        console.error("No valid tasks remain after filtering");
        return false;
      }

      // Verificar existência de cada tarefa individualmente
      const taskIds = validTasks.map((t) => t.id);

      try {
        // Verificar cada tarefa diretamente
        const tasks = await db
          .select({ id: householdTasks.id })
          .from(householdTasks)
          .where(inArray(householdTasks.id, taskIds));

        const foundIds = tasks.map((t) => t.id);
        const missingIds = taskIds.filter((id) => !foundIds.includes(id));

        if (missingIds.length > 0) {
          console.warn(
            `IDs não encontrados no banco: ${missingIds.join(", ")}`
          );

          // Remover tarefas não encontradas em vez de falhar completamente
          validTasks = validTasks.filter((task) => foundIds.includes(task.id));

          if (validTasks.length === 0) {
            console.error(
              "Nenhuma tarefa válida após remover IDs inexistentes"
            );
            return false;
          }

          console.log(
            `Continuando com ${validTasks.length} tarefas válidas após filtrar IDs inexistentes`
          );
        }
      } catch (error) {
        console.error("Erro ao verificar existência das tarefas:", error);
        return false;
      }

      // Proceed with the update
      await db.transaction(async (tx) => {
        for (const task of validTasks) {
          await tx
            .update(householdTasks)
            .set({ position: task.position })
            .where(eq(householdTasks.id, task.id));
        }
      });

      console.log("Task positions updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating task positions:", error);
      return false;
    }
  }

  // Relationship Insights methods
  async createRelationshipInsight(insight: InsertRelationshipInsight): Promise<RelationshipInsight> {
    try {
      // Use current date for createdAt if not provided
      const now = new Date();
      
      const [newInsight] = await db
        .insert(relationshipInsights)
        .values({
          userId: insight.userId,
          partnerId: insight.partnerId,
          insightType: insight.insightType,
          title: insight.title,
          content: insight.content,
          sentiment: insight.sentiment,
          score: insight.score,
          actions: insight.actions,
          rawData: insight.rawData,
          metadata: insight.metadata,
          userRead: false,
          partnerRead: false,
          createdAt: now,
          expiresAt: insight.expiresAt || null
        })
        .returning();

      return {
        ...newInsight,
        createdAt: new Date(newInsight.createdAt),
        expiresAt: newInsight.expiresAt ? new Date(newInsight.expiresAt) : null
      };
    } catch (error) {
      console.error("Erro ao criar insight de relacionamento:", error);
      throw error;
    }
  }

  async getRelationshipInsight(id: number): Promise<RelationshipInsight | undefined> {
    try {
      const insight = await db
        .select()
        .from(relationshipInsights)
        .where(eq(relationshipInsights.id, id))
        .limit(1);

      if (!insight || insight.length === 0) {
        return undefined;
      }

      return {
        ...insight[0],
        createdAt: new Date(insight[0].createdAt),
        expiresAt: insight[0].expiresAt ? new Date(insight[0].expiresAt) : null
      };
    } catch (error) {
      console.error("Erro ao obter insight de relacionamento:", error);
      return undefined;
    }
  }

  async getUserRelationshipInsights(userId: number): Promise<RelationshipInsight[]> {
    try {
      const now = new Date();
      const insights = await db
        .select()
        .from(relationshipInsights)
        .where(
          and(
            or(
              eq(relationshipInsights.userId, userId),
              eq(relationshipInsights.partnerId, userId)
            ),
            or(
              isNull(relationshipInsights.expiresAt),
              gt(relationshipInsights.expiresAt, now)
            )
          )
        )
        .orderBy(desc(relationshipInsights.createdAt));

      return insights.map(insight => ({
        ...insight,
        createdAt: new Date(insight.createdAt),
        expiresAt: insight.expiresAt ? new Date(insight.expiresAt) : null
      }));
    } catch (error) {
      console.error("Erro ao obter insights de relacionamento do usuário:", error);
      return [];
    }
  }

  async getPartnerRelationshipInsights(userId: number, partnerId: number): Promise<RelationshipInsight[]> {
    try {
      const now = new Date();
      const insights = await db
        .select()
        .from(relationshipInsights)
        .where(
          and(
            or(
              and(
                eq(relationshipInsights.userId, userId),
                eq(relationshipInsights.partnerId, partnerId)
              ),
              and(
                eq(relationshipInsights.userId, partnerId),
                eq(relationshipInsights.partnerId, userId)
              )
            ),
            or(
              isNull(relationshipInsights.expiresAt),
              gt(relationshipInsights.expiresAt, now)
            )
          )
        )
        .orderBy(desc(relationshipInsights.createdAt));

      return insights.map(insight => ({
        ...insight,
        createdAt: new Date(insight.createdAt),
        expiresAt: insight.expiresAt ? new Date(insight.expiresAt) : null
      }));
    } catch (error) {
      console.error("Erro ao obter insights de relacionamento do casal:", error);
      return [];
    }
  }

  async updateRelationshipInsight(id: number, updates: Partial<RelationshipInsight>): Promise<RelationshipInsight | undefined> {
    try {
      const [updatedInsight] = await db
        .update(relationshipInsights)
        .set(updates)
        .where(eq(relationshipInsights.id, id))
        .returning();

      if (!updatedInsight) {
        return undefined;
      }

      return {
        ...updatedInsight,
        createdAt: new Date(updatedInsight.createdAt),
        expiresAt: updatedInsight.expiresAt ? new Date(updatedInsight.expiresAt) : null
      };
    } catch (error) {
      console.error("Erro ao atualizar insight de relacionamento:", error);
      return undefined;
    }
  }

  async markInsightAsRead(id: number, isUser: boolean): Promise<RelationshipInsight | undefined> {
    try {
      const [updatedInsight] = await db
        .update(relationshipInsights)
        .set(isUser ? { userRead: true } : { partnerRead: true })
        .where(eq(relationshipInsights.id, id))
        .returning();

      if (!updatedInsight) {
        return undefined;
      }

      return {
        ...updatedInsight,
        createdAt: new Date(updatedInsight.createdAt),
        expiresAt: updatedInsight.expiresAt ? new Date(updatedInsight.expiresAt) : null
      };
    } catch (error) {
      console.error("Erro ao marcar insight como lido:", error);
      return undefined;
    }
  }

  async deleteRelationshipInsight(id: number): Promise<boolean> {
    try {
      await db
        .delete(relationshipInsights)
        .where(eq(relationshipInsights.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir insight de relacionamento:", error);
      return false;
    }
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
