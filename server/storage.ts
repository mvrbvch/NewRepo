import { users, events, eventShares, eventComments, calendarConnections, partnerInvites } from "@shared/schema";
import type { User, InsertUser, Event, InsertEvent, EventShare, InsertEventShare, 
  EventComment, InsertEventComment, CalendarConnection, InsertCalendarConnection, 
  PartnerInvite, InsertPartnerInvite } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";
import { db } from "./db";
import { eq, and, or, SQL, inArray } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
  
  private userIdCounter: number;
  private eventIdCounter: number;
  private eventShareIdCounter: number;
  private eventCommentIdCounter: number;
  private calendarConnectionIdCounter: number;
  private partnerInviteIdCounter: number;
  
  sessionStore: SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.eventsMap = new Map();
    this.eventSharesMap = new Map();
    this.eventCommentsMap = new Map();
    this.calendarConnectionsMap = new Map();
    this.partnerInvitesMap = new Map();
    
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.eventShareIdCounter = 1;
    this.eventCommentIdCounter = 1;
    this.calendarConnectionIdCounter = 1;
    this.partnerInviteIdCounter = 1;
    
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
    // Garantir que os campos opcionais sejam null quando não fornecidos
    const eventData = {
      ...insertEvent,
      location: insertEvent.location || null,
      emoji: insertEvent.emoji || null,
      recurrence: insertEvent.recurrence || 'never',
      recurrenceEnd: insertEvent.recurrenceEnd || null,
      recurrenceRule: insertEvent.recurrenceRule || null
    };
    
    console.log('Creating event with data:', eventData);
    
    const [event] = await db.insert(events)
      .values(eventData)
      .returning();
    
    return event;
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event ? this.formatEventDates(event) : undefined;
  }
  
  // Função auxiliar para formatar as datas dos eventos
  private formatEventDates(event: Event): Event {
    // Converter a data para string ISO se for uma data válida
    if (event.date instanceof Date) {
      // Criar uma cópia do evento para não modificar o original
      return {
        ...event,
        date: event.date.toISOString()
      };
    }
    return event;
  }
  
  async getUserEvents(userId: number): Promise<Event[]> {
    const userEvents = await db.select().from(events).where(eq(events.createdBy, userId));
    
    // Formatar as datas dos eventos antes de retorná-los
    return userEvents.map(event => this.formatEventDates(event));
  }
  
  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    const [updatedEvent] = await db.update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
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
      const event = await this.getEvent(share.eventId);
      if (event) {
        sharedEvents.push(event);
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
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
