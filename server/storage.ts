import { users, events, eventShares, eventComments, calendarConnections, partnerInvites } from "@shared/schema";
import type { User, InsertUser, Event, InsertEvent, EventShare, InsertEventShare, 
  EventComment, InsertEventComment, CalendarConnection, InsertCalendarConnection, 
  PartnerInvite, InsertPartnerInvite } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
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
  
  sessionStore: session.SessionStore;

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
    return Array.from(this.eventCommentsMap.values())
      .filter(comment => comment.eventId === eventId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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

export const storage = new MemStorage();
