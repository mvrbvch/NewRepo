import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API Endpoints
  app.get("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const userEvents = await storage.getUserEvents(userId);
      const sharedEvents = await storage.getSharedEvents(userId);
      
      // Combine user's own events and events shared with them
      const allEvents = [...userEvents, ...sharedEvents];
      
      res.json(allEvents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      console.log('Creating event for user:', userId);
      console.log('Event data received:', req.body);
      
      // Validate required fields
      if (!req.body.title || !req.body.date || !req.body.startTime || !req.body.endTime || !req.body.period) {
        return res.status(400).json({ 
          message: "Required fields missing", 
          required: ["title", "date", "startTime", "endTime", "period"] 
        });
      }
      
      // Parse date if it's a string
      let eventData: any = { ...req.body, createdBy: userId };
      if (typeof eventData.date === 'string') {
        eventData.date = new Date(eventData.date);
      }
      
      // Ensure proper recurrence values
      if (!eventData.recurrence) {
        eventData.recurrence = 'never';
      }
      
      console.log('Prepared event data:', eventData);
      
      const newEvent = await storage.createEvent(eventData);
      console.log('Event created successfully:', newEvent);
      
      // If event is being shared with a partner
      if (req.body.shareWithPartner && req.user?.partnerId) {
        console.log('Sharing event with partner:', req.user.partnerId);
        await storage.shareEvent({
          eventId: newEvent.id,
          userId: req.user.partnerId,
          permission: req.body.partnerPermission || "view"
        });
      }
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: "Failed to create event", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user has access to this event
      const userId = req.user?.id as number;
      if (event.createdBy !== userId) {
        // Check if event is shared with this user
        const shares = await storage.getEventShares(eventId);
        const userShare = shares.find(share => share.userId === userId);
        
        if (!userShare) {
          return res.status(403).json({ message: "You don't have permission to access this event" });
        }
      }
      
      // Get event shares and comments
      const shares = await storage.getEventShares(eventId);
      const comments = await storage.getEventComments(eventId);
      
      res.json({ event, shares, comments });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user has permission to edit
      const userId = req.user?.id as number;
      if (event.createdBy !== userId) {
        // Check if event is shared with this user with edit permission
        const shares = await storage.getEventShares(eventId);
        const userShare = shares.find(share => share.userId === userId && share.permission === "edit");
        
        if (!userShare) {
          return res.status(403).json({ message: "You don't have permission to edit this event" });
        }
      }
      
      const updatedEvent = await storage.updateEvent(eventId, req.body);
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Only the creator can delete an event
      const userId = req.user?.id as number;
      if (event.createdBy !== userId) {
        return res.status(403).json({ message: "Only the event creator can delete this event" });
      }
      
      const deleted = await storage.deleteEvent(eventId);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete event" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  app.post("/api/events/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user?.id as number;
      const { content } = req.body;
      
      // Verify the event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user has access to this event
      if (event.createdBy !== userId) {
        const shares = await storage.getEventShares(eventId);
        const userShare = shares.find(share => share.userId === userId);
        
        if (!userShare) {
          return res.status(403).json({ message: "You don't have permission to comment on this event" });
        }
      }
      
      const comment = await storage.addEventComment({
        eventId,
        userId,
        content
      });
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.post("/api/partner/invite", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { email, phoneNumber } = req.body;
      
      if (!email && !phoneNumber) {
        return res.status(400).json({ message: "Either email or phone number is required" });
      }
      
      const inviterId = req.user?.id as number;
      
      // Generate a unique token for the invite
      const token = randomBytes(20).toString('hex');
      
      const invite = await storage.createPartnerInvite({
        inviterId,
        email,
        phoneNumber,
        token
      });
      
      // In a real application, you would send an email or SMS here
      // For now, just return the token and details
      
      res.status(201).json({
        message: "Invite sent successfully",
        inviteLink: `/accept-invite/${token}`,
        inviteToken: token
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send invite" });
    }
  });

  app.get("/api/partner/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const invite = await storage.getPartnerInviteByToken(token);
      
      if (!invite) {
        return res.status(404).json({ message: "Invite not found or expired" });
      }
      
      if (invite.status !== 'pending') {
        return res.status(400).json({ message: `Invite has already been ${invite.status}` });
      }
      
      // Get inviter details
      const inviter = await storage.getUser(invite.inviterId);
      
      if (!inviter) {
        return res.status(404).json({ message: "Inviter not found" });
      }
      
      // Return invite details without sensitive information
      res.json({
        invite: {
          id: invite.id,
          status: invite.status,
          createdAt: invite.createdAt
        },
        inviter: {
          id: inviter.id,
          name: inviter.name
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve invite" });
    }
  });

  app.post("/api/partner/accept", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { token } = req.body;
      
      const invite = await storage.getPartnerInviteByToken(token);
      
      if (!invite) {
        return res.status(404).json({ message: "Invite not found or expired" });
      }
      
      if (invite.status !== 'pending') {
        return res.status(400).json({ message: `Invite has already been ${invite.status}` });
      }
      
      const inviterId = invite.inviterId;
      const acceptorId = req.user?.id as number;
      
      // Don't allow self-connection
      if (inviterId === acceptorId) {
        return res.status(400).json({ message: "You cannot connect with yourself" });
      }
      
      // Update the invite status
      await storage.updatePartnerInvite(invite.id, { status: 'accepted' });
      
      // Update both users to be partners
      await storage.updateUser(inviterId, { 
        partnerId: acceptorId, 
        partnerStatus: 'connected' 
      });
      
      await storage.updateUser(acceptorId, { 
        partnerId: inviterId, 
        partnerStatus: 'connected' 
      });
      
      res.json({ message: "Partner connection established successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  app.post("/api/onboarding/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      
      // Mark onboarding as complete
      const updatedUser = await storage.updateUser(userId, { onboardingComplete: true });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });
  
  app.post("/api/calendar/connect", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const { provider, providerId, accessToken, refreshToken, tokenExpiry } = req.body;
      
      // Add the calendar connection
      const connection = await storage.addCalendarConnection({
        userId,
        provider,
        providerId,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : undefined
      });
      
      // In a real app, you would actually sync calendars here
      
      res.status(201).json({
        id: connection.id,
        provider: connection.provider,
        syncEnabled: connection.syncEnabled
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to connect calendar" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
