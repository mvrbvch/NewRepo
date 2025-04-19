import { users, events, eventShares, eventComments, calendarConnections, partnerInvites, householdTasks, userDevices, notifications } from "@shared/schema";
import type { User, InsertUser, Event, InsertEvent, EventShare, InsertEventShare, 
  EventComment, InsertEventComment, CalendarConnection, InsertCalendarConnection, 
  PartnerInvite, InsertPartnerInvite, HouseholdTask, InsertHouseholdTask,
  UserDevice, InsertUserDevice, Notification, InsertNotification } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";
import { db } from "./db";
import { eq, and, or, SQL, inArray } from "drizzle-orm";
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
  updateEventSharePermission(id: number, permission: string): Promise<EventShare | undefined>;
  removeEventShare(id: number): Promise<boolean>;
  
  // Event comments
  addEventComment(comment: InsertEventComment): Promise<EventComment>;
  getEventComments(eventId: number): Promise<EventComment[]>;
  
  // Calendar connections
  addCalendarConnection(connection: InsertCalendarConnection): Promise<CalendarConnection>;
  getUserCalendarConnections(userId: number): Promise<CalendarConnection[]>;
  removeCalendarConnection(id: number): Promise<boolean>;
  
  // Partner invites
  createPartnerInvite(invite: InsertPartnerInvite): Promise<PartnerInvite>;
  getPartnerInviteByToken(token: string): Promise<PartnerInvite | undefined>;
  updatePartnerInvite(id: number, updates: Partial<PartnerInvite>): Promise<PartnerInvite | undefined>;
  
  // Household tasks
  createHouseholdTask(task: InsertHouseholdTask): Promise<HouseholdTask>;
  getHouseholdTask(id: number): Promise<HouseholdTask | undefined>;
  getUserHouseholdTasks(userId: number): Promise<HouseholdTask[]>;
  getPartnerHouseholdTasks(userId: number): Promise<HouseholdTask[]>;
  updateHouseholdTask(id: number, updates: Partial<HouseholdTask>): Promise<HouseholdTask | undefined>;
  deleteHouseholdTask(id: number): Promise<boolean>;
  markHouseholdTaskAsCompleted(id: number, completed: boolean): Promise<HouseholdTask | undefined>;
  
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
  
  private userIdCounter: number;
  private eventIdCounter: number;
  private eventShareIdCounter: number;
  private eventCommentIdCounter: number;
  private calendarConnectionIdCounter: number;
  private partnerInviteIdCounter: number;
  private householdTaskIdCounter: number;
  
  sessionStore: SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.eventsMap = new Map();
    this.eventSharesMap = new Map();
    this.eventCommentsMap = new Map();
    this.calendarConnectionsMap = new Map();
    this.partnerInvitesMap = new Map();
    this.householdTasksMap = new Map();
    
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.eventShareIdCounter = 1;
    this.eventCommentIdCounter = 1;
    this.calendarConnectionIdCounter = 1;
    this.partnerInviteIdCounter = 1;
    this.householdTaskIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
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
    const user: User = { ...insertUser, id, partnerId: null, partnerStatus: "none", onboardingComplete: false };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
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
  
  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
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
    const share: EventShare = { ...insertShare, id };
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
    
    return shares.map(share => this.eventsMap.get(share.eventId)!).filter(Boolean);
  }
  
  async updateEventSharePermission(id: number, permission: string): Promise<EventShare | undefined> {
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
  async addEventComment(insertComment: InsertEventComment): Promise<EventComment> {
    const id = this.eventCommentIdCounter++;
    const comment: EventComment = { 
      ...insertComment, 
      id, 
      createdAt: new Date() 
    };
    this.eventCommentsMap.set(id, comment);
    return comment;
  }
  
  async getEventComments(eventId: number): Promise<EventComment[]> {
    const comments = Array.from(this.eventCommentsMap.values())
      .filter(comment => comment.eventId === eventId);
    
    // Sort comments manually to handle null createdAt values (for consistency with DB implementation)
    return comments.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }
  
  // Calendar connections
  async addCalendarConnection(insertConnection: InsertCalendarConnection): Promise<CalendarConnection> {
    const id = this.calendarConnectionIdCounter++;
    const connection: CalendarConnection = { 
      ...insertConnection, 
      id, 
      syncEnabled: true 
    };
    this.calendarConnectionsMap.set(id, connection);
    return connection;
  }
  
  async getUserCalendarConnections(userId: number): Promise<CalendarConnection[]> {
    return Array.from(this.calendarConnectionsMap.values()).filter(
      (conn) => conn.userId === userId
    );
  }
  
  async removeCalendarConnection(id: number): Promise<boolean> {
    return this.calendarConnectionsMap.delete(id);
  }
  
  // Partner invites
  async createPartnerInvite(insertInvite: InsertPartnerInvite): Promise<PartnerInvite> {
    const id = this.partnerInviteIdCounter++;
    const invite: PartnerInvite = { 
      ...insertInvite, 
      id,
      status: 'pending',
      createdAt: new Date()
    };
    this.partnerInvitesMap.set(id, invite);
    return invite;
  }
  
  async getPartnerInviteByToken(token: string): Promise<PartnerInvite | undefined> {
    return Array.from(this.partnerInvitesMap.values()).find(
      (invite) => invite.token === token
    );
  }
  
  async updatePartnerInvite(id: number, updates: Partial<PartnerInvite>): Promise<PartnerInvite | undefined> {
    const invite = this.partnerInvitesMap.get(id);
    if (!invite) return undefined;
    
    const updatedInvite = { ...invite, ...updates };
    this.partnerInvitesMap.set(id, updatedInvite);
    return updatedInvite;
  }

  // Household tasks methods
  async createHouseholdTask(insertTask: InsertHouseholdTask): Promise<HouseholdTask> {
    const id = this.householdTaskIdCounter++;
    const task: HouseholdTask = {
      ...insertTask,
      id,
      completed: insertTask.completed || false,
      createdAt: new Date(),
      dueDate: insertTask.dueDate || null,
      nextDueDate: insertTask.nextDueDate || null
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
      (task) => task.assignedTo === user.partnerId || task.createdBy === user.partnerId
    );
  }
  
  async updateHouseholdTask(id: number, updates: Partial<HouseholdTask>): Promise<HouseholdTask | undefined> {
    const task = this.householdTasksMap.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.householdTasksMap.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteHouseholdTask(id: number): Promise<boolean> {
    return this.householdTasksMap.delete(id);
  }
  
  async markHouseholdTaskAsCompleted(id: number, completed: boolean): Promise<HouseholdTask | undefined> {
    const task = this.householdTasksMap.get(id);
    if (!task) return undefined;
    
    // Se a tarefa for recorrente, atualizar a próxima data de vencimento
    let nextDueDate = task.nextDueDate;
    if (completed && task.frequency !== 'once') {
      const currentDate = new Date();
      
      if (task.frequency === 'daily') {
        nextDueDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      } else if (task.frequency === 'weekly') {
        nextDueDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
      } else if (task.frequency === 'monthly') {
        nextDueDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      }
    }
    
    const updatedTask = { ...task, completed, nextDueDate };
    this.householdTasksMap.set(id, updatedTask);
    return updatedTask;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values({
        ...insertUser,
        partnerStatus: "none",
        onboardingComplete: false
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
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
          console.error('Data inválida recebida como objeto Date:', insertEvent.date);
        }
      } else if (typeof insertEvent.date === 'string') {
        try {
          const parsedDate = new Date(insertEvent.date);
          if (!isNaN(parsedDate.getTime())) {
            eventDate = parsedDate;
          } else {
            console.error('Data inválida recebida como string:', insertEvent.date);
          }
        } catch (err) {
          console.error('Erro ao converter string para data:', err);
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
      } else if (typeof insertEvent.recurrenceEnd === 'string') {
        try {
          const parsedDate = new Date(insertEvent.recurrenceEnd);
          if (!isNaN(parsedDate.getTime())) {
            recurrenceEndDate = parsedDate;
          }
        } catch (err) {
          console.error('Erro ao converter string de recorrenceEnd para data:', err);
        }
      }
    }
    
    // Gerar regra de recorrência se necessário
    let recurrenceRule = insertEvent.recurrenceRule;
    if (insertEvent.recurrence && insertEvent.recurrence !== 'never' && !recurrenceRule) {
      recurrenceRule = this.generateRecurrenceRule(insertEvent.recurrence, recurrenceEndDate);
    }
    
    // Garantir que os campos opcionais sejam null quando não fornecidos
    const eventData = {
      ...insertEvent,
      date: eventDate,
      location: insertEvent.location || null,
      emoji: insertEvent.emoji || null,
      recurrence: insertEvent.recurrence || 'never',
      recurrenceEnd: recurrenceEndDate,
      recurrenceRule: recurrenceRule
    };
    
    console.log('Creating event with data:', eventData);
    
    const [event] = await db.insert(events)
      .values(eventData)
      .returning();
    
    // Formatar a data antes de retornar
    return this.formatEventDates(event);
  }
  
  // Método para gerar regra de recorrência baseada na frequência escolhida
  private generateRecurrenceRule(recurrence: string, endDate: Date | null): string {
    let rule = '';
    
    switch (recurrence) {
      case 'daily':
        rule = 'FREQ=DAILY';
        break;
      case 'weekly':
        rule = 'FREQ=WEEKLY';
        break;
      case 'monthly':
        rule = 'FREQ=MONTHLY';
        break;
      case 'custom':
        // Definição padrão para custom, pode ser sobrescrita com regras específicas
        rule = 'FREQ=DAILY';
        break;
      default:
        return '';
    }
    
    // Adicionar data de término se especificada
    if (endDate && !isNaN(endDate.getTime())) {
      const formattedDate = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      rule += `;UNTIL=${formattedDate}`;
    }
    
    return rule;
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select({
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
      createdBy: events.createdBy
    }).from(events).where(eq(events.id, id));
    
    return event ? this.formatEventDates(event) : undefined;
  }
  
  // Função auxiliar para formatar as datas dos eventos
  private formatEventDates(event: Event): Event {
    // Criar uma cópia do evento para não modificar o original
    const formattedEvent = { ...event };
    
    // Processar a data principal do evento
    if (!formattedEvent.date) {
      // Se a data for null ou undefined, definir uma data padrão (hoje)
      formattedEvent.date = new Date().toISOString();
    } else if (formattedEvent.date instanceof Date) {
      if (!isNaN(formattedEvent.date.getTime())) {
        // Se for um objeto Date válido, converter para string ISO
        formattedEvent.date = formattedEvent.date.toISOString();
      } else {
        // Se for um objeto Date inválido, definir uma data padrão (hoje)
        formattedEvent.date = new Date().toISOString();
      }
    } else if (typeof formattedEvent.date === 'string') {
      // Se já for uma string, verificar se é uma data válida
      // Alguns bancos retornam datas como: '2025-04-19'
      try {
        // Adicionar 'T00:00:00Z' se for uma data sem hora
        if (formattedEvent.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedEvent.date = `${formattedEvent.date}T00:00:00Z`;
        }
        
        // Verificar se a data agora é válida
        const tempDate = new Date(formattedEvent.date);
        if (isNaN(tempDate.getTime())) {
          formattedEvent.date = new Date().toISOString();
        }
      } catch (err) {
        console.error('Erro ao validar data em formato string:', err);
        formattedEvent.date = new Date().toISOString();
      }
    }
    
    // Processar a data de término da recorrência
    if (formattedEvent.recurrenceEnd) {
      if (formattedEvent.recurrenceEnd instanceof Date) {
        if (!isNaN(formattedEvent.recurrenceEnd.getTime())) {
          formattedEvent.recurrenceEnd = formattedEvent.recurrenceEnd.toISOString();
        } else {
          formattedEvent.recurrenceEnd = null;
        }
      } else if (typeof formattedEvent.recurrenceEnd === 'string') {
        try {
          // Adicionar 'T00:00:00Z' se for uma data sem hora
          if (formattedEvent.recurrenceEnd.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedEvent.recurrenceEnd = `${formattedEvent.recurrenceEnd}T00:00:00Z`;
          }
          
          // Verificar se a data agora é válida
          const tempDate = new Date(formattedEvent.recurrenceEnd);
          if (isNaN(tempDate.getTime())) {
            formattedEvent.recurrenceEnd = null;
          }
        } catch (err) {
          console.error('Erro ao validar recurrenceEnd em formato string:', err);
          formattedEvent.recurrenceEnd = null;
        }
      }
    }
    
    console.log(`Evento formatado: ID=${formattedEvent.id}, Data=${formattedEvent.date}`);
    return formattedEvent;
  }
  
  async getUserEvents(userId: number): Promise<Event[]> {
    // Selecionando explicitamente os campos para evitar problemas com novas colunas
    const userEvents = await db.select({
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
      createdBy: events.createdBy
    }).from(events).where(eq(events.createdBy, userId));
    
    // Formatar as datas dos eventos antes de retorná-los
    return userEvents.map(event => this.formatEventDates(event));
  }
  
  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    // Para atualizações que envolvem uma data, precisamos garantir que é um objeto Date
    const processedUpdates: any = { ...updates };
    
    // Se a data estiver presente como string, converta para Date
    if (typeof processedUpdates.date === 'string') {
      try {
        processedUpdates.date = new Date(processedUpdates.date);
      } catch (error) {
        console.error('Error converting date string to Date:', error);
      }
    }
    
    // Mesmo para recurrenceEnd
    if (typeof processedUpdates.recurrenceEnd === 'string') {
      try {
        processedUpdates.recurrenceEnd = new Date(processedUpdates.recurrenceEnd);
      } catch (error) {
        console.error('Error converting recurrenceEnd string to Date:', error);
      }
    }
    
    const [updatedEvent] = await db.update(events)
      .set(processedUpdates)
      .where(eq(events.id, id))
      .returning();
    
    return updatedEvent ? this.formatEventDates(updatedEvent) : undefined;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(events).where(eq(events.id, id));
    // Since we don't have a reliable way to get the count, assume it succeeded
    return true;
  }
  
  // Event sharing methods
  async shareEvent(insertShare: InsertEventShare): Promise<EventShare> {
    // Garantir que permission sempre tenha um valor
    const shareData = {
      ...insertShare,
      permission: insertShare.permission || 'view'
    };
    
    console.log('Sharing event with data:', shareData);
    
    const [share] = await db.insert(eventShares)
      .values(shareData)
      .returning();
    
    return share;
  }
  
  async getEventShares(eventId: number): Promise<EventShare[]> {
    return await db.select().from(eventShares).where(eq(eventShares.eventId, eventId));
  }
  
  async getSharedEvents(userId: number): Promise<Event[]> {
    const shares = await db.select().from(eventShares).where(eq(eventShares.userId, userId));
    
    if (shares.length === 0) return [];
    
    // Get events one by one since we have type issues with the inArray operator
    const sharedEvents: Event[] = [];
    for (const share of shares) {
      // Usando um select explícito para cada evento para evitar problemas com novas colunas
      const [event] = await db.select({
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
        createdBy: events.createdBy
      }).from(events).where(eq(events.id, share.eventId));
      
      if (event) {
        sharedEvents.push(this.formatEventDates(event));
      }
    }
    
    return sharedEvents;
  }
  
  async updateEventSharePermission(id: number, permission: string): Promise<EventShare | undefined> {
    const [updatedShare] = await db.update(eventShares)
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
  async addEventComment(insertComment: InsertEventComment): Promise<EventComment> {
    const [comment] = await db.insert(eventComments)
      .values(insertComment)
      .returning();
    return comment;
  }
  
  async getEventComments(eventId: number): Promise<EventComment[]> {
    // Add explicit handling for possibly null createdAt dates
    const comments = await db.select()
      .from(eventComments)
      .where(eq(eventComments.eventId, eventId));
    
    // Sort comments manually to handle null createdAt values
    return comments.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }
  
  // Calendar connections
  async addCalendarConnection(insertConnection: InsertCalendarConnection): Promise<CalendarConnection> {
    // Garantir que os campos opcionais sejam null quando não fornecidos
    const connectionData = {
      ...insertConnection,
      accessToken: insertConnection.accessToken || null,
      refreshToken: insertConnection.refreshToken || null,
      tokenExpiry: insertConnection.tokenExpiry || null,
      syncEnabled: true
    };
    
    console.log('Adding calendar connection with data:', connectionData);
    
    const [connection] = await db.insert(calendarConnections)
      .values(connectionData)
      .returning();
    
    return connection;
  }
  
  async getUserCalendarConnections(userId: number): Promise<CalendarConnection[]> {
    return await db.select().from(calendarConnections).where(eq(calendarConnections.userId, userId));
  }
  
  async removeCalendarConnection(id: number): Promise<boolean> {
    await db.delete(calendarConnections).where(eq(calendarConnections.id, id));
    // Since we don't have a reliable way to get the count, assume it succeeded
    return true;
  }
  
  // Partner invites
  async createPartnerInvite(insertInvite: InsertPartnerInvite): Promise<PartnerInvite> {
    // Garantir que os campos opcionais sejam null quando não fornecidos
    const inviteData = {
      ...insertInvite,
      email: insertInvite.email || null,
      phoneNumber: insertInvite.phoneNumber || null,
      status: 'pending'
    };
    
    console.log('Creating partner invite with data:', inviteData);
    
    const [invite] = await db.insert(partnerInvites)
      .values(inviteData)
      .returning();
    
    return invite;
  }
  
  async getPartnerInviteByToken(token: string): Promise<PartnerInvite | undefined> {
    const [invite] = await db.select().from(partnerInvites).where(eq(partnerInvites.token, token));
    return invite;
  }
  
  async updatePartnerInvite(id: number, updates: Partial<PartnerInvite>): Promise<PartnerInvite | undefined> {
    const [updatedInvite] = await db.update(partnerInvites)
      .set(updates)
      .where(eq(partnerInvites.id, id))
      .returning();
    return updatedInvite;
  }

  // Household tasks methods
  async createHouseholdTask(insertTask: InsertHouseholdTask): Promise<HouseholdTask> {
    try {
      console.log('Criando tarefa doméstica com dados:', JSON.stringify(insertTask, null, 2));
      
      // Processa as datas antes de inserir
      let dueDate: Date | null = null;
      if (insertTask.dueDate) {
        console.log('dueDate original:', insertTask.dueDate);
        if (insertTask.dueDate instanceof Date) {
          dueDate = insertTask.dueDate;
          console.log('dueDate é um objeto Date');
        } else if (typeof insertTask.dueDate === 'string') {
          dueDate = new Date(insertTask.dueDate);
          console.log('dueDate convertido de string:', dueDate);
        }
      }

      let nextDueDate: Date | null = null;
      if (insertTask.nextDueDate) {
        console.log('nextDueDate original:', insertTask.nextDueDate);
        if (insertTask.nextDueDate instanceof Date) {
          nextDueDate = insertTask.nextDueDate;
          console.log('nextDueDate é um objeto Date');
        } else if (typeof insertTask.nextDueDate === 'string') {
          nextDueDate = new Date(insertTask.nextDueDate);
          console.log('nextDueDate convertido de string:', nextDueDate);
        }
      }

      // Verificar se as datas são válidas
      if (dueDate && isNaN(dueDate.getTime())) {
        console.log('dueDate inválido, definindo como null');
        dueDate = null;
      }
      
      if (nextDueDate && isNaN(nextDueDate.getTime())) {
        console.log('nextDueDate inválido, definindo como null');
        nextDueDate = null;
      }

      // Remover campos desnecessários antes de passar para o banco de dados
      const { dueDate: _, nextDueDate: __, ...restOfInsertTask } = insertTask;
      
      const taskData = {
        ...restOfInsertTask,
        dueDate,
        nextDueDate,
        completed: insertTask.completed || false,
      };

      console.log('Dados finais para inserção:', JSON.stringify(taskData, null, 2));

      const [task] = await db.insert(householdTasks)
        .values(taskData)
        .returning();
      
      console.log('Tarefa criada com sucesso, dados do banco:', JSON.stringify(task, null, 2));
      
      // Processar para retorno
      const formatted = {
        ...task,
        dueDate: dueDate ? dueDate.toISOString() : null,
        nextDueDate: nextDueDate ? nextDueDate.toISOString() : null, 
        createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null
      };
      
      console.log('Tarefa formatada:', JSON.stringify(formatted, null, 2));
      return formatted as HouseholdTask;
    } catch (error) {
      console.error('Erro crítico ao criar tarefa:', error);
      throw error;
    }
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
            console.log('Data inválida (Date object):', dateValue);
            return null;
          }
          return dateValue.toISOString();
        } 
        else if (typeof dateValue === 'string') {
          // Para datas no formato YYYY-MM-DD, adicione a parte de tempo
          if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateValue = `${dateValue}T00:00:00Z`;
          }
          
          // Verificar se a string de data pode ser convertida em um Date válido
          const tempDate = new Date(dateValue);
          if (isNaN(tempDate.getTime())) {
            console.log('Data inválida (string):', dateValue);
            return null;
          }
          return tempDate.toISOString();
        }
      } catch (err) {
        console.error('Erro ao processar data:', err, dateValue);
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
      const [task] = await db.select().from(householdTasks).where(eq(householdTasks.id, id));
      if (!task) return undefined;
      
      // Formatar datas de forma segura usando a função utilitária
      return {
        ...task,
        dueDate: formatDateSafely(task.dueDate),
        nextDueDate: formatDateSafely(task.nextDueDate),
        createdAt: formatDateSafely(task.createdAt)
      } as HouseholdTask;
    } catch (error) {
      console.error('Erro ao buscar tarefa doméstica:', error);
      return undefined;
    }
  }
  
  async getUserHouseholdTasks(userId: number): Promise<HouseholdTask[]> {
    try {
      const tasks = await db.select().from(householdTasks).where(
        or(
          eq(householdTasks.assignedTo, userId),
          eq(householdTasks.createdBy, userId)
        )
      );
      
      // Mapear cada tarefa e formatar suas datas de forma segura usando a função utilitária
      return tasks.map(task => {
        return {
          ...task,
          dueDate: formatDateSafely(task.dueDate),
          nextDueDate: formatDateSafely(task.nextDueDate),
          createdAt: formatDateSafely(task.createdAt)
        } as HouseholdTask;
      });
    } catch (error) {
      console.error('Erro ao buscar tarefas do usuário:', error);
      return [];
    }
  }
  
  async getPartnerHouseholdTasks(userId: number): Promise<HouseholdTask[]> {
    try {
      // Primeiro, encontrar o usuário e seu parceiro
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.partnerId) return [];
      
      // Obter as tarefas do parceiro
      const tasks = await db.select().from(householdTasks).where(
        or(
          eq(householdTasks.assignedTo, user.partnerId),
          eq(householdTasks.createdBy, user.partnerId)
        )
      );
      
      // Mapear cada tarefa e formatar suas datas de forma segura usando a função utilitária
      return tasks.map(task => {
        return {
          ...task,
          dueDate: formatDateSafely(task.dueDate),
          nextDueDate: formatDateSafely(task.nextDueDate),
          createdAt: formatDateSafely(task.createdAt)
        } as HouseholdTask;
      });
    } catch (error) {
      console.error('Erro ao buscar tarefas do parceiro:', error);
      return [];
    }
  }
  
  async updateHouseholdTask(id: number, updates: Partial<HouseholdTask>): Promise<HouseholdTask | undefined> {
    try {
      // Processar datas se estiverem sendo atualizadas
      const processedUpdates: any = { ...updates };
      
      if (typeof processedUpdates.dueDate === 'string') {
        try {
          // Usar a mesma lógica de formatDateSafely mas convertendo para Date
          if (processedUpdates.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            processedUpdates.dueDate = `${processedUpdates.dueDate}T00:00:00.000Z`;
          }
          processedUpdates.dueDate = new Date(processedUpdates.dueDate);
          if (isNaN(processedUpdates.dueDate.getTime())) {
            console.log('dueDate inválido, definindo como null');
            processedUpdates.dueDate = null;
          }
        } catch (err) {
          console.error('Erro ao converter dueDate para Date:', err);
          processedUpdates.dueDate = null;
        }
      }
      
      if (typeof processedUpdates.nextDueDate === 'string') {
        try {
          // Usar a mesma lógica de formatDateSafely mas convertendo para Date
          if (processedUpdates.nextDueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            processedUpdates.nextDueDate = `${processedUpdates.nextDueDate}T00:00:00.000Z`;
          }
          processedUpdates.nextDueDate = new Date(processedUpdates.nextDueDate);
          if (isNaN(processedUpdates.nextDueDate.getTime())) {
            console.log('nextDueDate inválido, definindo como null');
            processedUpdates.nextDueDate = null;
          }
        } catch (err) {
          console.error('Erro ao converter nextDueDate para Date:', err);
          processedUpdates.nextDueDate = null;
        }
      }
      
      const [updatedTask] = await db.update(householdTasks)
        .set(processedUpdates)
        .where(eq(householdTasks.id, id))
        .returning();
      
      if (!updatedTask) return undefined;
      
      // Formatar datas de forma segura usando a função utilitária
      return {
        ...updatedTask,
        dueDate: formatDateSafely(updatedTask.dueDate),
        nextDueDate: formatDateSafely(updatedTask.nextDueDate),
        createdAt: formatDateSafely(updatedTask.createdAt)
      } as HouseholdTask;
    } catch (error) {
      console.error('Erro ao atualizar tarefa doméstica:', error);
      return undefined;
    }
  }
  
  async deleteHouseholdTask(id: number): Promise<boolean> {
    try {
      const result = await db.delete(householdTasks)
        .where(eq(householdTasks.id, id))
        .returning({ id: householdTasks.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao excluir tarefa doméstica:', error);
      return false;
    }
  }
  
  async markHouseholdTaskAsCompleted(id: number, completed: boolean): Promise<HouseholdTask | undefined> {
    try {
      // Obter a tarefa atual
      const [task] = await db.select().from(householdTasks).where(eq(householdTasks.id, id));
      if (!task) return undefined;
      
      // Objeto com os campos a serem atualizados
      const updateData: any = { completed };
      
      // Caso esteja marcando como concluída e é uma tarefa recorrente
      if (completed && task.frequency !== 'once') {
        const currentDate = new Date();
        
        // Calcular próxima data de vencimento com base na frequência
        if (task.frequency === 'daily') {
          updateData.nextDueDate = new Date(new Date().setDate(currentDate.getDate() + 1));
        } else if (task.frequency === 'weekly') {
          updateData.nextDueDate = new Date(new Date().setDate(currentDate.getDate() + 7));
        } else if (task.frequency === 'monthly') {
          updateData.nextDueDate = new Date(new Date().setMonth(currentDate.getMonth() + 1));
        }
      } 
      // Caso esteja desmarcando (voltando a incompleta)
      else if (!completed) {
        // Se a tarefa tiver uma próxima data programada, reseta-a para null
        // isso evita que tarefas recorrentes gerem múltiplas instâncias quando desmarcadas
        updateData.nextDueDate = null;
      }
      
      console.log('Atualizando status da tarefa:', { id, completed, updateData });
      
      // Atualizar a tarefa
      const [updatedTask] = await db.update(householdTasks)
        .set(updateData)
        .where(eq(householdTasks.id, id))
        .returning();
      
      if (!updatedTask) return undefined;
      
      // Formatar datas de forma segura usando a função utilitária
      return {
        ...updatedTask,
        dueDate: formatDateSafely(updatedTask.dueDate),
        nextDueDate: formatDateSafely(updatedTask.nextDueDate),
        createdAt: formatDateSafely(updatedTask.createdAt)
      } as HouseholdTask;
    } catch (error) {
      console.error('Erro ao marcar tarefa como concluída:', error);
      return undefined;
    }
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
