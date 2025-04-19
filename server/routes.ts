import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { pool } from "./db";
import { Event, insertHouseholdTaskSchema, insertUserDeviceSchema, insertNotificationSchema } from "@shared/schema";
import { addDays, addMonths, addWeeks, isAfter, isBefore, parseISO } from "date-fns";
import { sendEmail, generateTaskReminderEmail, generatePartnerInviteEmail } from "./email";
import { sendPushToUser, PushNotificationPayload } from "./pushNotifications";

// Função para expandir eventos recorrentes em múltiplas instâncias
function expandRecurringEvents(events: Event[], startDate: Date, endDate: Date): Event[] {
  const result: Event[] = [];
  
  for (const event of events) {
    // Eventos sem recorrência são adicionados diretamente
    if (!event.recurrence || event.recurrence === 'never') {
      result.push(event);
      continue;
    }
    
    // Para eventos recorrentes, precisamos gerar instâncias adicionais
    // Primeiro, adicione a instância original
    result.push(event);
    
    // Se não tem regra de recorrência, pule
    if (!event.recurrenceRule) {
      continue;
    }
    
    // Parse a data do evento
    let eventDate: Date;
    if (typeof event.date === 'string') {
      try {
        eventDate = parseISO(event.date);
      } catch {
        continue; // Pula se não conseguir converter a data
      }
    } else if (event.date instanceof Date) {
      eventDate = event.date;
    } else {
      continue; // Pula se não tiver data
    }
    
    // Se a data está após o período de visualização, pule
    if (isAfter(eventDate, endDate)) {
      continue;
    }
    
    // Parse a data final da recorrência
    let recurrenceEndDate: Date | null = null;
    if (event.recurrenceEnd) {
      if (typeof event.recurrenceEnd === 'string') {
        try {
          recurrenceEndDate = parseISO(event.recurrenceEnd);
        } catch {
          // Se não conseguir converter, deixa null
        }
      } else if (event.recurrenceEnd instanceof Date) {
        recurrenceEndDate = event.recurrenceEnd;
      }
    }
    
    // Limite pelo período de visualização ou pela data de fim da recorrência
    const finalEndDate = recurrenceEndDate && isBefore(recurrenceEndDate, endDate) 
      ? recurrenceEndDate 
      : endDate;
    
    // Extrair a frequência da regra de recorrência
    const freqMatch = event.recurrenceRule.match(/FREQ=([A-Z]+)/);
    if (!freqMatch) continue;
    
    const freq = freqMatch[1];
    let currentDate = eventDate;
    
    // Gerar instâncias baseadas na frequência
    while (isBefore(currentDate, finalEndDate)) {
      if (freq === 'DAILY') {
        currentDate = addDays(currentDate, 1);
      } else if (freq === 'WEEKLY') {
        currentDate = addWeeks(currentDate, 1);
      } else if (freq === 'MONTHLY') {
        currentDate = addMonths(currentDate, 1);
      } else {
        break; // Frequência desconhecida
      }
      
      // Se a data está fora do período, pule
      if (isAfter(currentDate, finalEndDate)) {
        break;
      }
      
      // Adicionar nova instância do evento recorrente
      const recurringInstance: Event = {
        ...event,
        date: currentDate.toISOString(),
        id: event.id, // ID da instância original
        isRecurring: true, // Marcar como instância de recorrência
        originalDate: event.date // Guardar a data original para referência
      };
      
      result.push(recurringInstance);
    }
  }
  
  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Rota de diagnóstico para verificar a conexão com o banco de dados
  app.get('/api/db-health', async (req: Request, res: Response) => {
    try {
      // Testa a conexão com o banco de dados
      const result = await pool.query('SELECT NOW()');
      return res.status(200).json({ 
        status: 'ok', 
        dbTime: result.rows[0].now,
        message: 'Banco de dados conectado e funcionando corretamente'
      });
    } catch (error) {
      console.error('Erro na verificação do banco de dados:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Falha na conexão com o banco de dados',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

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
      let allEvents = [...userEvents, ...sharedEvents];
      
      // Processar eventos recorrentes
      // O período de visualização padrão é 3 meses a partir de hoje
      const startDate = new Date(); // hoje
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // 3 meses depois
      
      // Expandir eventos recorrentes para o período de visualização
      const expandedEvents = expandRecurringEvents(allEvents, startDate, endDate);
      
      res.json(expandedEvents);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
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
      const inviter = await storage.getUser(inviterId);
      
      if (!inviter) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate a unique token for the invite
      const token = randomBytes(20).toString('hex');
      
      const invite = await storage.createPartnerInvite({
        inviterId,
        email,
        phoneNumber,
        token
      });
      
      // Enviar email de convite se o email foi fornecido
      if (email) {
        try {
          const { html, text } = generatePartnerInviteEmail(
            email,
            inviter.name,
            token
          );
          
          // No ambiente de teste do Resend, só podemos enviar emails para o endereço autorizado
          // Esta é uma limitação da API gratuita do Resend
          const validEmail = "out@no-reply.murbach.work"; // Email do usuário registrado no Resend
          console.log(`Usando endereço autorizado pelo Resend em vez de ${email}: ${validEmail}`);
          
          const emailSent = await sendEmail({
            to: validEmail, // Usando o email autorizado para respeitar as limitações da API
            subject: `Convite para parceria no NossaRotina de ${inviter.name}`,
            html,
            text
          });
          
          console.log(`Email de convite ${emailSent ? 'enviado com sucesso' : 'falhou ao enviar'}`);
        } catch (emailError) {
          console.error('Erro ao enviar email de convite:', emailError);
          // Continuamos mesmo se o email falhar, pois o link ainda pode ser compartilhado manualmente
        }
      }
      
      res.status(201).json({
        message: "Invite sent successfully",
        inviteLink: `/accept-invite/${token}`,
        inviteToken: token
      });
    } catch (error) {
      console.error('Erro ao criar convite:', error);
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

  // Household Tasks API
  // GET - Obter tarefas do usuário
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const tasks = await storage.getUserHouseholdTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error('Erro ao buscar tarefas domésticas:', error);
      res.status(500).json({ message: "Failed to fetch household tasks" });
    }
  });

  // GET - Obter tarefas do parceiro
  app.get("/api/tasks/partner", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const partnerTasks = await storage.getPartnerHouseholdTasks(userId);
      res.json(partnerTasks);
    } catch (error) {
      console.error('Erro ao buscar tarefas do parceiro:', error);
      res.status(500).json({ message: "Failed to fetch partner's household tasks" });
    }
  });

  // GET - Obter tarefa específica
  app.get("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getHouseholdTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verificar se o usuário tem acesso à tarefa
      const userId = req.user?.id as number;
      const user = await storage.getUser(userId);
      
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        // Verificar se é uma tarefa do parceiro
        if (!user?.partnerId || (task.createdBy !== user.partnerId && task.assignedTo !== user.partnerId)) {
          return res.status(403).json({ message: "You don't have permission to access this task" });
        }
      }
      
      res.json(task);
    } catch (error) {
      console.error('Erro ao buscar tarefa específica:', error);
      res.status(500).json({ message: "Failed to fetch task details" });
    }
  });

  // POST - Criar nova tarefa
  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      
      // Processar datas antes de validar com Zod
      const taskData = {
        ...req.body,
        createdBy: userId
      };
      
      // Converter strings de data para objetos Date
      if (typeof taskData.dueDate === 'string') {
        taskData.dueDate = new Date(taskData.dueDate);
      }
      
      if (typeof taskData.nextDueDate === 'string') {
        taskData.nextDueDate = new Date(taskData.nextDueDate);
      }
      
      // Remover campos undefined para evitar erros de validação
      Object.keys(taskData).forEach(key => {
        if (taskData[key] === undefined) {
          delete taskData[key];
        }
      });
      
      const newTask = await storage.createHouseholdTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      console.error('Erro ao criar tarefa doméstica:', error);
      res.status(500).json({ 
        message: "Failed to create household task",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PUT - Atualizar tarefa
  app.put("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getHouseholdTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verificar se o usuário tem permissão para editar
      const userId = req.user?.id as number;
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this task" });
      }
      
      // Processar datas antes de atualizar
      const updates = { ...req.body };
      
      // Converter strings de data para objetos Date
      if (typeof updates.dueDate === 'string') {
        updates.dueDate = new Date(updates.dueDate);
      }
      
      if (typeof updates.nextDueDate === 'string') {
        updates.nextDueDate = new Date(updates.nextDueDate);
      }
      
      // Remover campos undefined para evitar erros de validação
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });
      
      const updatedTask = await storage.updateHouseholdTask(taskId, updates);
      res.json(updatedTask);
    } catch (error) {
      console.error('Erro ao atualizar tarefa doméstica:', error);
      res.status(500).json({ message: "Failed to update household task" });
    }
  });

  // DELETE - Excluir tarefa
  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getHouseholdTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Apenas o criador pode excluir uma tarefa
      const userId = req.user?.id as number;
      if (task.createdBy !== userId) {
        return res.status(403).json({ message: "Only the task creator can delete this task" });
      }
      
      const deleted = await storage.deleteHouseholdTask(taskId);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete task" });
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa doméstica:', error);
      res.status(500).json({ message: "Failed to delete household task" });
    }
  });

  // PATCH - Marcar tarefa como completa ou incompleta
  app.patch("/api/tasks/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const taskId = parseInt(req.params.id);
      const { completed } = req.body;
      
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ message: "completed field must be a boolean" });
      }
      
      const task = await storage.getHouseholdTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verificar se o usuário tem permissão para atualizar
      const userId = req.user?.id as number;
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        const user = await storage.getUser(userId);
        if (!user?.partnerId || (task.createdBy !== user.partnerId && task.assignedTo !== user.partnerId)) {
          return res.status(403).json({ message: "You don't have permission to update this task" });
        }
      }
      
      const updatedTask = await storage.markHouseholdTaskAsCompleted(taskId, completed);
      res.json(updatedTask);
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      res.status(500).json({ message: "Failed to update task completion status" });
    }
  });

  // POST - Enviar lembrete de tarefa por e-mail para o parceiro
  app.post("/api/tasks/:id/remind", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const taskId = parseInt(req.params.id);
      const { message } = req.body;
      const userId = req.user?.id as number;
      
      // Obter a tarefa
      const task = await storage.getHouseholdTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verificar se o usuário tem acesso à tarefa
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        return res.status(403).json({ message: "You don't have permission to send reminders for this task" });
      }
      
      // Obter o usuário atual e seu parceiro
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!currentUser.partnerId) {
        return res.status(400).json({ message: "You don't have a partner to send reminders to" });
      }
      
      const partner = await storage.getUser(currentUser.partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      if (!partner.email) {
        return res.status(400).json({ message: "Your partner doesn't have an email address" });
      }
      
      // Gerar e enviar o e-mail
      const { html, text } = generateTaskReminderEmail(
        partner.name,
        currentUser.name,
        task.title,
        task.description,
        message || null,
        taskId
      );
      
      // No ambiente de teste do Resend, só podemos enviar emails para o próprio email do usuário registrado
      // Esta é uma limitação da API gratuita do Resend
      const validEmail = "matheus.murbach@gmail.com"; // Email do usuário registrado no Resend
      console.log(`Usando endereço autorizado pelo Resend em vez de ${partner.email}: ${validEmail}`);
      
      const emailSent = await sendEmail({
        to: validEmail, // Usando o email do próprio usuário para respeitar as limitações da API de teste do Resend
        subject: `Lembrete: ${task.title}`,
        html,
        text
      });
      
      if (emailSent) {
        res.status(200).json({ message: "Reminder sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send reminder email" });
      }
    } catch (error) {
      console.error('Erro ao enviar lembrete de tarefa:', error);
      res.status(500).json({ 
        message: "Failed to send task reminder",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // POST - Notificar parceiro via WhatsApp (stub para expansão futura)
  app.post("/api/tasks/:id/notify", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Esta rota é um stub para expansão futura com integração WhatsApp
    // Por enquanto, fornecemos uma resposta informativa
    res.status(200).json({ 
      message: "Notification feature is under development. Currently, use email reminders instead.",
      alternativeEndpoint: `/api/tasks/${req.params.id}/remind`
    });
  });
  
  // Rota de teste para demonstração do envio de lembrete
  // IMPORTANTE: Esta rota é apenas para testes e deve ser removida em produção
  app.get("/api/test-reminder/:taskId/:userId", async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const userId = parseInt(req.params.userId);
      
      // Obter a tarefa
      const task = await storage.getHouseholdTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Obter o usuário e seu parceiro
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!currentUser.partnerId) {
        return res.status(400).json({ message: "You don't have a partner to send reminders to" });
      }
      
      const partner = await storage.getUser(currentUser.partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      if (!partner.email) {
        return res.status(400).json({ message: "Your partner doesn't have an email address" });
      }
      
      // No ambiente de teste do Resend, só podemos enviar emails para o próprio email do usuário registrado
      // Esta é uma limitação da API gratuita do Resend
      const testEmail = "matheus.murbach@gmail.com"; // Email do usuário registrado no Resend
      console.log(`Usando endereço autorizado pelo Resend em vez de ${partner.email}: ${testEmail}`);
      
      // Sobrescrever o email do parceiro para o endereço de teste
      const partnerWithTestEmail = {
        ...partner,
        email: testEmail
      };
      
      // Gerar e enviar o e-mail
      const { html, text } = generateTaskReminderEmail(
        partnerWithTestEmail.name,
        currentUser.name,
        task.title,
        task.description,
        "Este é um lembrete de teste da funcionalidade de notificação entre parceiros!",
        taskId
      );
      
      const emailSent = await sendEmail({
        to: testEmail, // Usando o email do próprio usuário para respeitar as limitações da API de teste do Resend
        subject: `Lembrete de teste: ${task.title}`,
        html,
        text
      });
      
      if (emailSent) {
        res.status(200).json({ 
          message: "Test reminder sent successfully",
          details: {
            from: currentUser.name,
            to: partner.name,
            email: partner.email,
            task: task.title
          }
        });
      } else {
        res.status(500).json({ message: "Failed to send test reminder email" });
      }
    } catch (error) {
      console.error('Erro ao enviar lembrete de teste:', error);
      res.status(500).json({ 
        message: "Failed to send test reminder",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ===== API para gerenciamento de dispositivos e notificações push =====
  
  // Registra um novo dispositivo para receber notificações push
  app.post("/api/devices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      
      // Validar dados do corpo da requisição
      const validationResult = insertUserDeviceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid device data", 
          errors: validationResult.error.format() 
        });
      }
      
      // Verificar se o token já está registrado para este usuário
      const existingDevice = await storage.getUserDeviceByToken(req.body.deviceToken);
      if (existingDevice && existingDevice.userId === userId) {
        // Atualizar dispositivo existente
        const updatedDevice = await storage.updateUserDevice(existingDevice.id, {
          ...req.body,
          lastUsed: new Date()
        });
        return res.json(updatedDevice);
      }
      
      // Registrar novo dispositivo
      const device = await storage.registerUserDevice({
        ...req.body,
        userId
      });
      
      res.status(201).json(device);
    } catch (error) {
      console.error('Erro ao registrar dispositivo:', error);
      res.status(500).json({ 
        message: "Failed to register device", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Obtém todos os dispositivos registrados para o usuário atual
  app.get("/api/devices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const devices = await storage.getUserDevices(userId);
      res.json(devices);
    } catch (error) {
      console.error('Erro ao obter dispositivos:', error);
      res.status(500).json({ 
        message: "Failed to fetch devices", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Atualiza as configurações de um dispositivo
  app.put("/api/devices/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const deviceId = parseInt(req.params.id);
      
      // Verificar se o dispositivo pertence ao usuário
      const devices = await storage.getUserDevices(userId);
      const device = devices.find(d => d.id === deviceId);
      
      if (!device) {
        return res.status(404).json({ message: "Device not found or not owned by you" });
      }
      
      const updatedDevice = await storage.updateUserDevice(deviceId, {
        ...req.body,
        lastUsed: new Date()
      });
      
      res.json(updatedDevice);
    } catch (error) {
      console.error('Erro ao atualizar dispositivo:', error);
      res.status(500).json({ 
        message: "Failed to update device", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Remove um dispositivo
  app.delete("/api/devices/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const deviceId = parseInt(req.params.id);
      
      // Verificar se o dispositivo pertence ao usuário
      const devices = await storage.getUserDevices(userId);
      const device = devices.find(d => d.id === deviceId);
      
      if (!device) {
        return res.status(404).json({ message: "Device not found or not owned by you" });
      }
      
      const deleted = await storage.deleteUserDevice(deviceId);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete device" });
      }
    } catch (error) {
      console.error('Erro ao remover dispositivo:', error);
      res.status(500).json({ 
        message: "Failed to delete device", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // ===== Endpoints para notificações =====
  
  // Obtém todas as notificações do usuário
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      res.status(500).json({ 
        message: "Failed to fetch notifications", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Marca uma notificação como lida
  app.put("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const notificationId = parseInt(req.params.id);
      
      // Verificar se a notificação pertence ao usuário
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this notification" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ 
        message: "Failed to mark notification as read", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Remove uma notificação
  app.delete("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const notificationId = parseInt(req.params.id);
      
      // Verificar se a notificação pertence ao usuário
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this notification" });
      }
      
      const deleted = await storage.deleteNotification(notificationId);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete notification" });
      }
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
      res.status(500).json({ 
        message: "Failed to delete notification", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Envia uma notificação para o parceiro
  app.post("/api/partner/notify", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id as number;
      const currentUser = req.user;
      
      // Verificar se o usuário tem um parceiro
      if (!currentUser.partnerId) {
        return res.status(400).json({ message: "You don't have a partner to notify" });
      }
      
      // Validar dados da notificação
      const { title, message, type, referenceType, referenceId, metadata } = req.body;
      
      if (!title || !message || !type) {
        return res.status(400).json({ 
          message: "Required fields missing", 
          required: ["title", "message", "type"] 
        });
      }
      
      // Criar a notificação para o parceiro
      const notification = await storage.createNotification({
        userId: currentUser.partnerId,
        title,
        message,
        type,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        metadata: metadata || null,
        isRead: false
      });
      
      // Enviar notificação push para os dispositivos do parceiro
      try {
        const pushPayload: PushNotificationPayload = {
          title: title,
          body: message,
          data: {
            type,
            referenceType,
            referenceId,
            metadata
          }
        };
        
        // Enviar push para todos os dispositivos do parceiro
        const sentCount = await sendPushToUser(currentUser.partnerId, pushPayload);
        
        console.log(`Enviadas ${sentCount} notificações push para o parceiro`);
        
        res.status(201).json({
          message: "Notification sent to partner",
          notification,
          pushSent: sentCount > 0
        });
      } catch (pushError) {
        console.error('Erro ao enviar notificação push:', pushError);
        
        // Mesmo com falha no push, a notificação foi criada
        res.status(201).json({
          message: "Notification created but push failed",
          notification,
          pushSent: false,
          pushError: pushError instanceof Error ? pushError.message : String(pushError)
        });
      }
    } catch (error) {
      console.error('Erro ao enviar notificação para o parceiro:', error);
      res.status(500).json({ 
        message: "Failed to send notification", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
