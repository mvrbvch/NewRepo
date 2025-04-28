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
  Notification,
  InsertNotification,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";
import { db } from "./db";
import { eq, and, or, SQL, inArray, desc, sql, count } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { formatDateSafely } from "./utils";

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
    permission: string,
  ): Promise<EventShare | undefined>;
  removeEventShare(id: number): Promise<boolean>;

  // Event comments
  addEventComment(comment: InsertEventComment): Promise<EventComment>;
  getEventComments(eventId: number): Promise<EventComment[]>;

  // Calendar connections
  addCalendarConnection(
    connection: InsertCalendarConnection,
  ): Promise<CalendarConnection>;
  getUserCalendarConnections(userId: number): Promise<CalendarConnection[]>;
  removeCalendarConnection(id: number): Promise<boolean>;

  // Partner invites
  createPartnerInvite(invite: InsertPartnerInvite): Promise<PartnerInvite>;
  getPartnerInviteByToken(token: string): Promise<PartnerInvite | undefined>;
  updatePartnerInvite(
    id: number,
    updates: Partial<PartnerInvite>,
  ): Promise<PartnerInvite | undefined>;

  // Household tasks
  createHouseholdTask(task: InsertHouseholdTask): Promise<HouseholdTask>;
  getHouseholdTask(id: number): Promise<HouseholdTask | undefined>;
  getUserHouseholdTasks(userId: number): Promise<HouseholdTask[]>;
  getPartnerHouseholdTasks(userId: number): Promise<HouseholdTask[]>;
  updateHouseholdTask(
    id: number,
    updates: Partial<HouseholdTask>,
  ): Promise<HouseholdTask | undefined>;
  deleteHouseholdTask(id: number): Promise<boolean>;
  markHouseholdTaskAsCompleted(
    id: number,
    completed: boolean,
  ): Promise<HouseholdTask | undefined>;

  // User devices for push notifications
  registerUserDevice(device: InsertUserDevice): Promise<UserDevice>;
  getUserDevices(userId: number): Promise<UserDevice[]>;
  getUserDeviceByToken(token: string): Promise<UserDevice | undefined>;
  updateUserDevice(
    id: number,
    updates: Partial<UserDevice>,
  ): Promise<UserDevice | undefined>;
  deleteUserDevice(id: number): Promise<boolean>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;

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

  private userIdCounter: number;
  private eventIdCounter: number;
  private eventShareIdCounter: number;
  private eventCommentIdCounter: number;
  private calendarConnectionIdCounter: number;
  private partnerInviteIdCounter: number;
  private householdTaskIdCounter: number;
  private userDeviceIdCounter: number;
  private notificationIdCounter: number;

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

    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.eventShareIdCounter = 1;
    this.eventCommentIdCounter = 1;
    this.calendarConnectionIdCounter = 1;
    this.partnerInviteIdCounter = 1;
    this.householdTaskIdCounter = 1;
    this.userDeviceIdCounter = 1;
    this.notificationIdCounter = 1;

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
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email,
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

  async updateUser(
    id: number,
    updates: Partial<User>,
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
      (event) => event.createdBy === userId,
    );
  }

  async updateEvent(
    id: number,
    updates: Partial<Event>,
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
      (share) => share.eventId === eventId,
    );
  }

  async getSharedEvents(userId: number): Promise<Event[]> {
    const shares = Array.from(this.eventSharesMap.values()).filter(
      (share) => share.userId === userId,
    );

    return shares
      .map((share) => this.eventsMap.get(share.eventId)!)
      .filter(Boolean);
  }

  async updateEventSharePermission(
    id: number,
    permission: string,
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
    insertComment: InsertEventComment,
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
      (comment) => comment.eventId === eventId,
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
    insertConnection: InsertCalendarConnection,
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
    userId: number,
  ): Promise<CalendarConnection[]> {
    return Array.from(this.calendarConnectionsMap.values()).filter(
      (conn) => conn.userId === userId,
    );
  }

  async removeCalendarConnection(id: number): Promise<boolean> {
    return this.calendarConnectionsMap.delete(id);
  }

  // Partner invites
  async createPartnerInvite(
    insertInvite: InsertPartnerInvite,
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
    token: string,
  ): Promise<PartnerInvite | undefined> {
    return Array.from(this.partnerInvitesMap.values()).find(
      (invite) => invite.token === token,
    );
  }

  async updatePartnerInvite(
    id: number,
    updates: Partial<PartnerInvite>,
  ): Promise<PartnerInvite | undefined> {
    const invite = this.partnerInvitesMap.get(id);
    if (!invite) return undefined;

    const updatedInvite = { ...invite, ...updates };
    this.partnerInvitesMap.set(id, updatedInvite);
    return updatedInvite;
  }

  // Household tasks methods
  async createHouseholdTask(
    insertTask: InsertHouseholdTask,
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
      (task) => task.assignedTo === userId || task.createdBy === userId,
    );
  }

  async getPartnerHouseholdTasks(userId: number): Promise<HouseholdTask[]> {
    // Primeiro, encontre o usuário
    const user = this.usersMap.get(userId);
    if (!user || !user.partnerId) return [];

    // Retorne as tarefas atribuídas ao parceiro
    return Array.from(this.householdTasksMap.values()).filter(
      (task) =>
        task.assignedTo === user.partnerId || task.createdBy === user.partnerId,
    );
  }

  async updateHouseholdTask(
    id: number,
    updates: Partial<HouseholdTask>,
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
  ): Promise<HouseholdTask | undefined> {
    const task = this.householdTasksMap.get(id);
    if (!task) return undefined;

    // Se a tarefa for recorrente, atualizar a próxima data de vencimento
    let nextDueDate = task.nextDueDate;
    if (completed && task.frequency !== "once") {
      const currentDate = new Date();

      if (task.frequency === "daily") {
        nextDueDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      } else if (task.frequency === "weekly") {
        nextDueDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
      } else if (task.frequency === "monthly") {
        nextDueDate = new Date(
          currentDate.setMonth(currentDate.getMonth() + 1),
        );
      }
    }

    const updatedTask = { ...task, completed, nextDueDate };
    this.householdTasksMap.set(id, updatedTask);
    return updatedTask;
  }

  // Métodos para dispositivos do usuário
  async registerUserDevice(
    insertDevice: InsertUserDevice,
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
      (device) => device.userId === userId,
    );
  }

  async getUserDeviceByToken(token: string): Promise<UserDevice | undefined> {
    return Array.from(this.userDevicesMap.values()).find(
      (device) => device.deviceToken === token,
    );
  }

  async updateUserDevice(
    id: number,
    updates: Partial<UserDevice>,
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
    insertNotification: InsertNotification,
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
      (notification) => notification.userId === userId,
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
}

export class DatabaseStorage implements IStorage {
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
    updates: Partial<Omit<UserDevice, "createdAt">>,
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
    notification: InsertNotification,
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

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    return true; // Drizzle não retorna informação fácil sobre se algo foi deletado
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
    updates: Partial<User>,
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
            insertEvent.date,
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
              insertEvent.date,
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
            err,
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
        recurrenceEndDate,
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
    endDate: Date | null,
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
      formattedEvent.date,
    );

    // Processar a data principal do evento
    if (!formattedEvent.date) {
      // Se a data for null ou undefined, definir a data atual para evitar erros na renderização
      console.warn(
        `Evento ${formattedEvent.id} sem data definida - usando data atual`,
      );
      formattedEvent.date = new Date();
    } else if (formattedEvent.date instanceof Date) {
      // Se for um objeto Date, verificar se é válido
      try {
        if (!isNaN(formattedEvent.date.getTime())) {
          console.log(`Evento ${formattedEvent.id} - data objeto válida`);
        } else {
          console.warn(
            `Evento ${formattedEvent.id} tem data inválida (objeto Date) - usando data atual`,
          );
          formattedEvent.date = new Date();
        }
      } catch (error) {
        console.error(
          `Erro ao validar Date no evento ${formattedEvent.id}:`,
          error,
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
            `Evento ${formattedEvent.id} tem data string inválida - usando data atual`,
          );
          formattedEvent.date = new Date();
        }
      } catch (err) {
        console.error(
          `Erro ao converter string para Date para evento ${formattedEvent.id}:`,
          err,
        );
        formattedEvent.date = new Date();
      }
    } else {
      // Para qualquer outro tipo de valor, converter para data atual
      console.warn(
        `Evento ${formattedEvent.id} tem formato de data desconhecido:`,
        typeof formattedEvent.date,
      );
      formattedEvent.date = new Date();
    }

    // Processar a data de término da recorrência
    if (formattedEvent.recurrenceEnd) {
      console.log(
        `Processando recurrenceEnd para evento ${formattedEvent.id}:`,
        formattedEvent.recurrenceEnd,
      );

      if (formattedEvent.recurrenceEnd instanceof Date) {
        try {
          if (isNaN(formattedEvent.recurrenceEnd.getTime())) {
            console.warn(
              `Evento ${formattedEvent.id} tem recurrenceEnd inválido (objeto Date) - definindo como null`,
            );
            formattedEvent.recurrenceEnd = null;
          }
        } catch (error) {
          console.error(
            `Erro ao validar recurrenceEnd para evento ${formattedEvent.id}:`,
            error,
          );
          formattedEvent.recurrenceEnd = null;
        }
      } else if (typeof formattedEvent.recurrenceEnd === "string") {
        try {
          // Se a data estiver no formato YYYY-MM-DD, adicionar a parte de hora
          if (formattedEvent.recurrenceEnd.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedEvent.recurrenceEnd = new Date(
              `${formattedEvent.recurrenceEnd}T00:00:00`,
            );
          } else {
            formattedEvent.recurrenceEnd = new Date(
              formattedEvent.recurrenceEnd,
            );
          }

          // Verificar se a data é válida
          if (isNaN(formattedEvent.recurrenceEnd.getTime())) {
            console.warn(
              `Evento ${formattedEvent.id} tem recurrenceEnd string inválida - definindo como null`,
            );
            formattedEvent.recurrenceEnd = null;
          }
        } catch (err) {
          console.error(
            `Erro ao converter recurrenceEnd string para Date para evento ${formattedEvent.id}:`,
            err,
          );
          formattedEvent.recurrenceEnd = null;
        }
      } else {
        console.warn(
          `Evento ${formattedEvent.id} tem recurrenceEnd em formato desconhecido:`,
          typeof formattedEvent.recurrenceEnd,
        );
        formattedEvent.recurrenceEnd = null;
      }
    }

    console.log(
      `Evento formatado: ID=${formattedEvent.id}, Data=${formattedEvent.date}`,
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
    updates: Partial<Event>,
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
          processedUpdates.recurrenceEnd,
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
    permission: string,
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
    insertComment: InsertEventComment,
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
    insertConnection: InsertCalendarConnection,
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
    userId: number,
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
    insertInvite: InsertPartnerInvite,
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
    token: string,
  ): Promise<PartnerInvite | undefined> {
    const [invite] = await db
      .select()
      .from(partnerInvites)
      .where(eq(partnerInvites.token, token));
    return invite;
  }

  async updatePartnerInvite(
    id: number,
    updates: Partial<Omit<PartnerInvite, "createdAt">>,
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
    date?: Date,
  ): Promise<HouseholdTask[]> {
    try {
      let query = db
        .select()
        .from(householdTasks)
        .where(
          or(
            eq(householdTasks.assignedTo, userId),
            eq(householdTasks.createdBy, userId),
          ),
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
            householdTasks.dueDate <= endOfDay,
          ),
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
    updates: Partial<HouseholdTask>,
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

      // Caso esteja marcando como concluída e é uma tarefa recorrente
      if (completed && task.frequency !== "once") {
        const currentDate = new Date();

        // Calcular próxima data de vencimento com base na frequência
        if (task.frequency === "daily") {
          updateData.nextDueDate = new Date(
            new Date().setDate(currentDate.getDate() + 1),
          );
        } else if (task.frequency === "weekly") {
          updateData.nextDueDate = new Date(
            new Date().setDate(currentDate.getDate() + 7),
          );
        } else if (task.frequency === "monthly") {
          updateData.nextDueDate = new Date(
            new Date().setMonth(currentDate.getMonth() + 1),
          );
        }
      }
      // Caso esteja desmarcando (voltando a incompleta)
      else if (!completed) {
        // Se a tarefa tiver uma próxima data programada, reseta-a para null
        // isso evita que tarefas recorrentes gerem múltiplas instâncias quando desmarcadas
        updateData.nextDueDate = null;
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
          typeof id === "number" &&
          !isNaN(id) &&
          Number.isInteger(id) &&
          id > 0,
      );

      // If we lost any IDs during filtering, log it
      if (validIds.length !== taskIds.length) {
        console.warn(
          `Filtered out ${taskIds.length - validIds.length} invalid IDs from verification`,
        );
        console.warn(`Original IDs:`, taskIds);
        console.warn(`Valid IDs:`, validIds);
      }

      if (validIds.length === 0) return false;

      // Count how many tasks exist with the given IDs using SQL
      const results = await db.execute(
        sql`SELECT COUNT(*) as count FROM household_tasks WHERE id IN (${sql.join(validIds, sql`, `)})`,
      );

      // Extract the count from the result
      const foundCount = parseInt(
        (results.rows[0]?.count as string) || "0",
        10,
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
    taskIds: number[],
  ): Promise<boolean> {
    try {
      if (taskIds.length === 0) return false;

      // Filter out any invalid IDs (like NaN)
      const validIds = taskIds.filter(
        (id) =>
          typeof id === "number" &&
          !isNaN(id) &&
          Number.isInteger(id) &&
          id > 0,
      );

      if (validIds.length === 0) return false;

      // Contar quantas tarefas existem com os IDs fornecidos E pertencem ao usuário
      const results = await db.execute(
        sql`SELECT COUNT(*) as count FROM household_tasks 
            WHERE id IN (${sql.join(validIds, sql`, `)}) 
            AND (created_by = ${userId} OR assigned_to = ${userId})`,
      );

      // Extrair a contagem do resultado
      const foundCount = parseInt(
        (results.rows[0]?.count as string) || "0",
        10,
      );

      // Verificar se todas as tarefas foram encontradas
      const allTasksBelongToUser = foundCount === validIds.length;

      // Log detalhado apenas se nem todas as tarefas pertencerem ao usuário
      if (!allTasksBelongToUser) {
        console.warn(
          `Usuário ${userId} tentou reordenar tarefas que não lhe pertencem.`,
        );
        console.warn(`IDs das tarefas: ${validIds.join(", ")}`);
        console.warn(
          `Tarefas pertencentes ao usuário: ${foundCount} de ${validIds.length}`,
        );
      }

      return allTasksBelongToUser;
    } catch (error) {
      console.error(
        "Erro ao verificar se tarefas pertencem ao usuário:",
        error,
      );
      return false;
    }
  }

  async updateTaskPositions(
    tasks: { id: number; position: number }[],
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
            `Tarefa com ID não inteiro ou negativo rejeitada: ${task.id}`,
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
            `Tarefa com posição não inteira ou negativa rejeitada: ${task.position}`,
          );
          return false;
        }

        return true;
      });

      // Log any filtered out tasks
      if (validTasks.length !== tasks.length) {
        console.warn(
          `Filtered out ${tasks.length - validTasks.length} invalid tasks from position update`,
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
            `IDs não encontrados no banco: ${missingIds.join(", ")}`,
          );

          // Remover tarefas não encontradas em vez de falhar completamente
          validTasks = validTasks.filter((task) => foundIds.includes(task.id));

          if (validTasks.length === 0) {
            console.error(
              "Nenhuma tarefa válida após remover IDs inexistentes",
            );
            return false;
          }

          console.log(
            `Continuando com ${validTasks.length} tarefas válidas após filtrar IDs inexistentes`,
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
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
