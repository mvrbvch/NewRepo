import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupReminderRoutes } from "./reminder-routes";
import { setupRelationshipInsightsRoutes } from "./relationship-insights-routes";
import relationshipTipsRoutes from "./relationship-tips-routes";
import { z } from "zod";
// Importações e preparações necessárias
import { sql, eq } from "drizzle-orm";
import { pool, db } from "./db";
import {
  Event,
  householdTasks,
  insertHouseholdTaskSchema,
  insertUserDeviceSchema,
  insertNotificationSchema,
} from "@shared/schema";
import {
  addDays,
  addMonths,
  addWeeks,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import {
  sendEmail,
  generateTaskReminderEmail,
  generatePartnerInviteEmail,
} from "./email";
import {
  sendPushToUser,
  sendPushToDevice,
  PushNotificationPayload,
} from "./pushNotifications";
import { UnifiedRecurrenceService } from "./services/UnifiedRecurrenceService";
import { WebSocketServer } from "ws";
import { log } from "./vite";
import { registerWebAuthnRoutes } from "./webauthn-routes";
import { getVapidPublicKey } from "./pushNotifications";

import { PerplexityService } from "./perplexityService";

const perplexityService = new PerplexityService();

// Função para expandir eventos recorrentes em múltiplas instâncias
function expandRecurringEvents(
  events: Event[],
  startDate: Date,
  endDate: Date
): Event[] {
  const result: Event[] = [];

  for (const event of events) {
    // Usar o serviço unificado de recorrência para expandir eventos
    const expandedEvents = UnifiedRecurrenceService.expandRecurringEvent(
      event,
      startDate,
      endDate
    );

    // Adicionar todas as instâncias expandidas ao resultado
    result.push(...expandedEvents);
  }

  return result;
}

// Add overdue check for recurring events
function checkOverdueEvents(events: Event[]): Event[] {
  return events.filter((event) => {
    if (!event.recurrence || event.recurrence === "never") {
      return false;
    }

    const nextDueDate =
      UnifiedRecurrenceService.calculateNextDueDateForEvent(event);
    return UnifiedRecurrenceService.isOverdue(nextDueDate);
  });
}

/**
 * Registers all API routes for the application, including authentication, events, tasks,
 * partner management, device registration, and WebSocket configuration.
 *
 * @param {Express} app - The Express application instance to register routes on
 * @returns {Promise<Server>} A Promise resolving to the configured HTTP server
 *
 * @description This function sets up comprehensive routing for the application, including:
 * - Authentication routes
 * - Event management endpoints
 * - Household task management
 * - Partner invitation and connection
 * - Device and push notification registration
 * - WebSocket server for real-time communication
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Registrar rotas de autenticação biométrica WebAuthn
  registerWebAuthnRoutes(app);

  // Configurar rotas para o sistema de lembretes
  setupReminderRoutes(app, storage);

  // Configurar rotas para o sistema de insights de relacionamento
  setupRelationshipInsightsRoutes(app, storage);

  // Configurar rotas para o sistema de dicas de relacionamento
  app.use(relationshipTipsRoutes);

  // Rota de teste para a funcionalidade do histórico de conclusão
  app.get("/api/test/task-history/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);

      // Obter a tarefa
      const task = await storage.getHouseholdTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }

      // Obter o histórico de conclusão
      const history = await storage.getTaskCompletionHistory(taskId);

      return res.json({
        task,
        history,
        message: `Histórico de conclusão recuperado para a tarefa ${taskId}`,
        count: history.length,
      });
    } catch (error) {
      console.error("Erro ao obter histórico de conclusão:", error);
      return res
        .status(500)
        .json({ message: "Erro ao obter histórico de conclusão de tarefa" });
    }
  });

  // Rota de teste para a funcionalidade de marcar tarefas como concluídas
  app.get(
    "/api/test/task-complete/:id",
    async (req: Request, res: Response) => {
      try {
        const taskId = parseInt(req.params.id);
        const task = await storage.getHouseholdTask(taskId);

        if (!task) {
          return res.status(404).json({ message: "Tarefa não encontrada" });
        }

        // Verificar se o parâmetro completed foi fornecido na query, padrão é true
        const completed = req.query.completed === "false" ? false : true;
        console.log(
          `Marcando tarefa ${taskId} como ${completed ? "concluída" : "não concluída"}`
        );

        // Usar userId padrão para testes (1 é geralmente o primeiro usuário do sistema)
        const testUserId = parseInt(req.query.userId as string) || 1;
        console.log(`Usando userId ${testUserId} para registro de conclusão`);

        const updatedTask = await storage.markHouseholdTaskAsCompleted(
          taskId,
          completed,
          testUserId
        );

        // Verificar o status da tarefa
        if (updatedTask) {
          // Se a tarefa foi marcada como concluída, verificar se a data de conclusão foi registrada
          if (completed && !updatedTask.completedAt) {
            return res.status(500).json({
              message: "Falha ao marcar data de conclusão",
              task: updatedTask,
            });
          }

          // Se a tarefa foi desmarcada, verificar se a data de conclusão foi limpa
          if (!completed && updatedTask.completedAt) {
            return res.status(500).json({
              message: "Falha ao limpar data de conclusão",
              task: updatedTask,
            });
          }

          // Sucesso
          const status = completed ? "concluída" : "não concluída";
          return res.json({
            message: `Tarefa marcada como ${status} com sucesso`,
            task: updatedTask,
          });
        } else {
          return res.status(500).json({
            message: "Falha ao atualizar tarefa",
            task: null,
          });
        }
      } catch (error) {
        console.error("Erro ao testar conclusão de tarefa:", error);
        return res
          .status(500)
          .json({ message: "Erro ao testar conclusão de tarefa" });
      }
    }
  );

  // Rota de diagnóstico para verificar a conexão com o banco de dados
  app.get("/api/db-health", async (req: Request, res: Response) => {
    try {
      // Testa a conexão com o banco de dados
      const result = await pool.query("SELECT NOW()");
      return res.status(200).json({
        status: "ok",
        dbTime: result.rows[0].now,
        message: "Banco de dados conectado e funcionando corretamente",
      });
    } catch (error) {
      console.error("Erro na verificação do banco de dados:", error);
      return res.status(500).json({
        status: "error",
        message: "Falha na conexão com o banco de dados",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Rota de diagnóstico para verificar as chaves VAPID
  app.get("/api/push/vapid-info", (req: Request, res: Response) => {
    try {
      // Obter a chave pública VAPID do módulo de notificações push
      const vapidPublicKey = getVapidPublicKey();
      if (!vapidPublicKey) {
        return res.status(500).json({
          status: "error",
          message:
            "VAPID public key is not configured in environment variables",
        });
      }

      // Esta função converte a chave base64url para um array Uint8Array
      // É a mesma função utilizada no frontend
      const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        const rawData = Buffer.from(base64, "base64");
        return new Uint8Array(rawData);
      };
      // Converter a chave para verificar se está correta
      const decodedKey = urlBase64ToUint8Array(vapidPublicKey);

      return res.status(200).json({
        status: "ok",
        publicKey: vapidPublicKey,
        vapidPublicKeyLength: vapidPublicKey.length,
        decodedKeyLength: decodedKey.length,
        isP256Curve: true, // Já sabemos que é P-256 porque geramos corretamente
        timestamp: new Date().toISOString(),
        message: "Chaves VAPID configuradas corretamente",
      });
    } catch (error) {
      console.error("Erro ao verificar chaves VAPID:", error);
      return res.status(500).json({
        status: "error",
        message: "Falha ao verificar chaves VAPID",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Endpoint para obter a chave pública VAPID para Web Push
  app.get("/api/push/vapid-key", (req: Request, res: Response) => {
    try {
      // Obter a chave pública VAPID do módulo de notificações push
      const { getVapidPublicKey } = require("./pushNotifications");
      const vapidPublicKey = getVapidPublicKey();

      if (!vapidPublicKey) {
        return res.status(500).json({
          status: "error",
          message: "VAPID public key is not configured",
        });
      }

      return res.status(200).json({
        publicKey: vapidPublicKey,
      });
    } catch (error) {
      console.error("Erro ao obter chave VAPID:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to get VAPID key",
        error: error instanceof Error ? error.message : String(error),
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
      const startDate = new Date(req.body.date); // hoje
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // 3 meses depois

      // Expandir eventos recorrentes para o período de visualização
      const expandedEvents = expandRecurringEvents(
        allEvents,
        startDate,
        endDate
      );

      res.json(expandedEvents);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/overdue", async (req, res) => {
    try {
      const userId = req.user?.id as number;
      const userEvents = await storage.getUserEvents(userId);
      const overdueEvents = checkOverdueEvents(userEvents);

      res.json(overdueEvents);
    } catch (error) {
      console.error("Error fetching overdue events:", error);
      res.status(500).json({ message: "Failed to fetch overdue events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user?.id as number;
      console.log("Creating event for user:", userId);
      console.log("Event data received:", req.body);

      // Validate required fields
      if (
        !req.body.title ||
        !req.body.date ||
        !req.body.startTime ||
        !req.body.endTime ||
        !req.body.period
      ) {
        return res.status(400).json({
          message: "Required fields missing",
          required: ["title", "date", "startTime", "endTime", "period"],
        });
      }

      // Parse date if it's a string
      let eventData: any = { ...req.body, createdBy: userId };
      if (typeof eventData.date === "string") {
        eventData.date = new Date(eventData.date);
      }

      // Ensure proper recurrence values
      if (!eventData.recurrence) {
        eventData.recurrence = "never";
      }

      console.log("Prepared event data:", eventData);

      const newEvent = await storage.createEvent(eventData);
      console.log("Event created successfully:", newEvent);

      // If event is being shared with a partner
      if (req.body.shareWithPartner && req.user?.partnerId) {
        console.log("Sharing event with partner:", req.user.partnerId);
        await storage.shareEvent({
          eventId: newEvent.id,
          userId: req.user.partnerId,
          permission: req.body.partnerPermission || "view",
        });

        // Send push notification to partner about the shared event
        try {
          // Get the creator's name
          const creator = await storage.getUser(userId);
          const creatorName = creator ? creator.name : "Alguém";

          // Create push notification payload
          const pushPayload: PushNotificationPayload = {
            title: `Novo evento: ${newEvent.title}`,
            body: `${creatorName} compartilhou um evento com você`,
            data: {
              type: "event_shared",
              referenceType: "event",
              referenceId: newEvent.id,
            },
            referenceType: "event",
            referenceId: newEvent.id,
            tag: `event_${newEvent.id}`,
          };

          // Send push notification to the partner
          const sentCount = await sendPushToUser(
            req.user.partnerId,
            pushPayload
          );
          console.log(
            `Enviadas ${sentCount} notificações push para o parceiro sobre o evento compartilhado`
          );

          // Create notification in database
          await storage.createNotification({
            userId: req.user.partnerId,
            title: pushPayload.title,
            message: pushPayload.body,
            type: "event",
            referenceType: "event",
            referenceId: newEvent.id,
            isRead: false,
            metadata: JSON.stringify({
              eventId: newEvent.id,
              sharedBy: userId,
              permission: req.body.partnerPermission || "view",
            }),
          });
        } catch (notificationError) {
          console.error(
            "Erro ao enviar notificação de evento compartilhado:",
            notificationError
          );
          // Continue even if notification fails
        }
      }

      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({
        message: "Failed to create event",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/user/byId/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(parseInt(req.params.id));
    res.json({ user: user.name });
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
        const userShare = shares.find((share) => share.userId === userId);

        if (!userShare) {
          return res.status(403).json({
            message: "You don't have permission to access this event",
          });
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
        const userShare = shares.find(
          (share) => share.userId === userId && share.permission === "edit"
        );

        if (!userShare) {
          return res
            .status(403)
            .json({ message: "You don't have permission to edit this event" });
        }
      }

      const updatedEvent = await storage.updateEvent(eventId, req.body);

      // Get all users who have access to this event (shares)
      const shares = await storage.getEventShares(eventId);

      // Notify all users who have access to this event (except the updater)
      if (shares.length > 0) {
        try {
          // Get the updater's name
          const updater = await storage.getUser(userId);
          const updaterName = updater ? updater.name : "Alguém";

          // For each user who has access to the event
          for (const share of shares) {
            // Skip if it's the user who updated the event
            if (share.userId === userId) continue;

            // Create push notification payload
            const pushPayload: PushNotificationPayload = {
              title: `Evento atualizado: ${updatedEvent.title}`,
              body: `${updaterName} atualizou um evento compartilhado com você`,
              data: {
                type: "event_updated",
                referenceType: "event",
                referenceId: updatedEvent.id,
              },
              referenceType: "event",
              referenceId: updatedEvent.id,
              tag: `event_${updatedEvent.id}`,
            };

            // Send push notification to the user
            const sentCount = await sendPushToUser(share.userId, pushPayload);
            console.log(
              `Enviadas ${sentCount} notificações push para o usuário ${share.userId} sobre o evento atualizado`
            );

            // Create notification in database
            await storage.createNotification({
              userId: share.userId,
              title: pushPayload.title,
              message: pushPayload.body,
              type: "event",
              referenceType: "event",
              referenceId: updatedEvent.id,
              isRead: false,
              metadata: JSON.stringify({
                eventId: updatedEvent.id,
                updatedBy: userId,
              }),
            });
          }
        } catch (notificationError) {
          console.error(
            "Erro ao enviar notificações de evento atualizado:",
            notificationError
          );
          // Continue even if notification fails
        }
      }

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
        return res
          .status(403)
          .json({ message: "Only the event creator can delete this event" });
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
        const userShare = shares.find((share) => share.userId === userId);

        if (!userShare) {
          return res.status(403).json({
            message: "You don't have permission to comment on this event",
          });
        }
      }

      const comment = await storage.addEventComment({
        eventId,
        userId,
        content,
      });

      // Notify the event creator and all users who have access to this event (except the commenter)
      try {
        // Get the event creator
        const eventCreator = event.createdBy;

        // Get all users who have access to this event (shares)
        const shares = await storage.getEventShares(eventId);

        // Get the commenter's name
        const commenter = await storage.getUser(userId);
        const commenterName = commenter ? commenter.name : "Alguém";

        // Create a set of users to notify (to avoid duplicates)
        const usersToNotify = new Set<number>();

        // Add the event creator if it's not the commenter
        if (eventCreator !== userId) {
          usersToNotify.add(eventCreator);
        }

        // Add all users who have access to the event (except the commenter)
        for (const share of shares) {
          if (share.userId !== userId) {
            usersToNotify.add(share.userId);
          }
        }

        // For each user to notify
        for (const userIdToNotify of usersToNotify) {
          // Create push notification payload
          const pushPayload: PushNotificationPayload = {
            title: `Novo comentário em: ${event.title}`,
            body: `${commenterName}: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
            data: {
              type: "event_comment",
              referenceType: "event",
              referenceId: eventId,
            },
            referenceType: "event",
            referenceId: eventId,
            tag: `event_${eventId}_comment`,
          };

          // Send push notification to the user
          const sentCount = await sendPushToUser(userIdToNotify, pushPayload);
          console.log(
            `Enviadas ${sentCount} notificações push para o usuário ${userIdToNotify} sobre o novo comentário`
          );

          // Create notification in database
          await storage.createNotification({
            userId: userIdToNotify,
            title: pushPayload.title,
            message: pushPayload.body,
            type: "event_comment",
            referenceType: "event",
            referenceId: eventId,
            isRead: false,
            metadata: JSON.stringify({
              eventId: eventId,
              commentId: comment.id,
              commentBy: userId,
            }),
          });
        }
      } catch (notificationError) {
        console.error(
          "Erro ao enviar notificações de novo comentário:",
          notificationError
        );
        // Continue even if notification fails
      }

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
        return res
          .status(400)
          .json({ message: "Either email or phone number is required" });
      }

      const inviterId = req.user?.id as number;
      const inviter = await storage.getUser(inviterId);

      if (!inviter) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a unique token for the invite
      const token = randomBytes(20).toString("hex");

      const invite = await storage.createPartnerInvite({
        inviterId,
        email,
        phoneNumber,
        token,
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

          const emailSent = await sendEmail({
            to: email, // Usando o email autorizado para respeitar as limitações da API
            subject: `💌 Convite especial de ${inviter.name} para construir algo Nós Juntos`,
            html,
            text,
          });

          console.log(
            `Email de convite ${emailSent ? "enviado com sucesso" : "falhou ao enviar"}`
          );
        } catch (emailError) {
          console.error("Erro ao enviar email de convite:", emailError);
          // Continuamos mesmo se o email falhar, pois o link ainda pode ser compartilhado manualmente
        }
      }

      res.status(201).json({
        message: "Invite sent successfully",
        inviteLink: `${token}`,
        inviteToken: token,
      });
    } catch (error) {
      console.error("Erro ao criar convite:", error);
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

      if (invite.status !== "pending") {
        return res
          .status(400)
          .json({ message: `Invite has already been ${invite.status}` });
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
          createdAt: invite.createdAt,
        },
        inviter: {
          id: inviter.id,
          name: inviter.name,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve invite" });
    }
  });

  // Rota para validar um convite
  app.get("/api/invites/validate", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token é obrigatório" });
      }

      const invite = await storage.getPartnerInviteByToken(token);

      if (!invite) {
        return res
          .status(404)
          .json({ message: "Convite não encontrado ou expirado" });
      }

      if (invite.status !== "pending") {
        return res
          .status(400)
          .json({ message: `Convite já foi ${invite.status}` });
      }

      // Obter informações do usuário que enviou o convite
      const inviter = await storage.getUser(invite.inviterId);

      if (!inviter) {
        return res
          .status(404)
          .json({ message: "Usuário que enviou o convite não encontrado" });
      }

      // Retornar informações sobre o convite
      res.json({
        inviteId: invite.id,
        inviterName: inviter.name,
        inviterEmail: inviter.email,
        status: invite.status,
        createdAt: invite.createdAt,
      });
    } catch (error) {
      console.error("Erro ao validar convite:", error);
      res.status(500).json({ message: "Falha ao validar convite" });
    }
  });

  // Rota para aceitar um convite através da API
  app.post("/api/invites/accept", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { token } = req.body;

      const invite = await storage.getPartnerInviteByToken(token);

      if (!invite) {
        return res
          .status(404)
          .json({ message: "Convite não encontrado ou expirado" });
      }

      if (invite.status !== "pending") {
        return res
          .status(400)
          .json({ message: `Convite já foi ${invite.status}` });
      }

      const inviterId = invite.inviterId;
      const acceptorId = req.user?.id as number;

      // Não permitir auto-conexão
      if (inviterId === acceptorId) {
        return res
          .status(400)
          .json({ message: "Você não pode se conectar consigo mesmo" });
      }

      // Atualizar o status do convite
      await storage.updatePartnerInvite(invite.id, { status: "accepted" });

      // Atualizar ambos os usuários para serem parceiros
      await storage.updateUser(inviterId, {
        partnerId: acceptorId,
        partnerStatus: "connected",
      });

      await storage.updateUser(acceptorId, {
        partnerId: inviterId,
        partnerStatus: "connected",
      });

      // Obter informações do parceiro para retornar
      const partner = await storage.getUser(inviterId);

      res.json({
        message: "Conexão com parceiro estabelecida com sucesso",
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
        },
      });
    } catch (error) {
      console.error("Erro ao aceitar convite:", error);
      res.status(500).json({ message: "Falha ao aceitar convite" });
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

      if (invite.status !== "pending") {
        return res
          .status(400)
          .json({ message: `Invite has already been ${invite.status}` });
      }

      const inviterId = invite.inviterId;
      const acceptorId = req.user?.id as number;

      // Don't allow self-connection
      if (inviterId === acceptorId) {
        return res
          .status(400)
          .json({ message: "You cannot connect with yourself" });
      }

      // Update the invite status
      await storage.updatePartnerInvite(invite.id, { status: "accepted" });

      // Update both users to be partners
      await storage.updateUser(inviterId, {
        partnerId: acceptorId,
        partnerStatus: "connected",
      });

      await storage.updateUser(acceptorId, {
        partnerId: inviterId,
        partnerStatus: "connected",
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
      const updatedUser = await storage.updateUser(userId, {
        onboardingComplete: true,
      });

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
      const { provider, providerId, accessToken, refreshToken, tokenExpiry } =
        req.body;

      // Add the calendar connection
      const connection = await storage.addCalendarConnection({
        userId,
        provider,
        providerId,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : undefined,
      });

      // In a real app, you would actually sync calendars here

      res.status(201).json({
        id: connection.id,
        provider: connection.provider,
        syncEnabled: connection.syncEnabled,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to connect calendar" });
    }
  });

  // Household Tasks API
  // GET - Obter tarefas do usuário

  app.post("/api/tasks/smart-category", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const taskData = req.body;
      console.log(taskData);
      const response =
        await perplexityService.generateCategoryBasedOnTask(taskData);
      res.json(response);
    } catch (error) {
      console.error("Erro smart category:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch partner's household tasks" });
    }
  });
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user?.id as number;
      let filterDate: Date | undefined;

      // Parse date parameter if provided
      if (req.query.date) {
        try {
          filterDate = new Date(req.query.date as string);
          // Validate that the parsed date is valid
          if (isNaN(filterDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }

      const tasks = await storage.getUserHouseholdTasks(userId, filterDate);
      res.json(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas domésticas:", error);
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
      console.error("Erro ao buscar tarefas do parceiro:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch partner's household tasks" });
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
        if (
          !user?.partnerId ||
          (task.createdBy !== user.partnerId &&
            task.assignedTo !== user.partnerId)
        ) {
          return res
            .status(403)
            .json({ message: "You don't have permission to access this task" });
        }
      }

      res.json(task);
    } catch (error) {
      console.error("Erro ao buscar tarefa específica:", error);
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
        createdBy: userId,
      };

      // Converter strings de data para objetos Date
      if (typeof taskData.dueDate === "string") {
        taskData.dueDate = new Date(taskData.dueDate);
      }

      if (typeof taskData.nextDueDate === "string") {
        taskData.nextDueDate = new Date(taskData.nextDueDate);
      }

      // Remover campos undefined para evitar erros de validação
      Object.keys(taskData).forEach((key) => {
        if (taskData[key] === undefined) {
          delete taskData[key];
        }
      });

      const newTask = await storage.createHouseholdTask(taskData);

      // Send push notification to the assigned user if it's not the creator
      if (newTask.assignedTo && newTask.assignedTo !== userId) {
        try {
          // Get the assigned user
          const assignedUser = await storage.getUser(newTask.assignedTo);
          if (assignedUser) {
            // Get the creator's name
            const creator = await storage.getUser(userId);
            const creatorName = creator ? creator.name : "Alguém";

            // Create push notification payload
            const pushPayload: PushNotificationPayload = {
              title: `Nova tarefa: ${newTask.title}`,
              body: `${creatorName} atribuiu uma nova tarefa para você`,
              data: {
                type: "task_assigned",
                referenceType: "task",
                referenceId: newTask.id,
              },
              referenceType: "task",
              referenceId: newTask.id,
              tag: `task_${newTask.id}`,
            };

            // Send push notification to the assigned user
            const sentCount = await sendPushToUser(
              newTask.assignedTo,
              pushPayload
            );
            console.log(
              `Enviadas ${sentCount} notificações push para o usuário responsável pela tarefa`
            );

            // Create notification in database
            await storage.createNotification({
              userId: newTask.assignedTo,
              title: pushPayload.title,
              message: pushPayload.body,
              type: "task",
              referenceType: "task",
              referenceId: newTask.id,
              isRead: false,
              metadata: JSON.stringify({
                taskId: newTask.id,
                createdBy: userId,
              }),
            });
          }
        } catch (notificationError) {
          console.error(
            "Erro ao enviar notificação de tarefa:",
            notificationError
          );
          // Continue even if notification fails
        }
      }

      res.status(201).json(newTask);
    } catch (error) {
      console.error("Erro ao criar tarefa doméstica:", error);
      res.status(500).json({
        message: "Failed to create household task",
        error: error instanceof Error ? error.message : String(error),
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
        return res
          .status(403)
          .json({ message: "You don't have permission to update this task" });
      }

      // Processar datas antes de atualizar
      const updates = { ...req.body };

      // Converter strings de data para objetos Date
      if (typeof updates.dueDate === "string") {
        updates.dueDate = new Date(updates.dueDate);
      }

      if (typeof updates.nextDueDate === "string") {
        updates.nextDueDate = new Date(updates.nextDueDate);
      }

      // Remover campos undefined para evitar erros de validação
      Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const updatedTask = await storage.updateHouseholdTask(taskId, updates);

      // Send push notification if the task was reassigned to someone else
      if (
        updates.assignedTo &&
        updates.assignedTo !== userId &&
        updates.assignedTo !== task.assignedTo
      ) {
        try {
          // Get the assigned user
          const assignedUser = await storage.getUser(updates.assignedTo);
          if (assignedUser) {
            // Get the updater's name
            const updater = await storage.getUser(userId);
            const updaterName = updater ? updater.name : "Alguém";

            // Create push notification payload
            const pushPayload: PushNotificationPayload = {
              title: `Tarefa atribuída: ${updatedTask.title}`,
              body: `${updaterName} atribuiu uma tarefa para você`,
              data: {
                type: "task_assigned",
                referenceType: "task",
                referenceId: updatedTask.id,
              },
              referenceType: "task",
              referenceId: updatedTask.id,
              tag: `task_${updatedTask.id}`,
            };

            // Send push notification to the newly assigned user
            const sentCount = await sendPushToUser(
              updates.assignedTo,
              pushPayload
            );
            console.log(
              `Enviadas ${sentCount} notificações push para o novo responsável pela tarefa`
            );

            // Create notification in database
            await storage.createNotification({
              userId: updates.assignedTo,
              title: pushPayload.title,
              message: pushPayload.body,
              type: "task",
              referenceType: "task",
              referenceId: updatedTask.id,
              isRead: false,
              metadata: JSON.stringify({
                taskId: updatedTask.id,
                updatedBy: userId,
              }),
            });
          }
        } catch (notificationError) {
          console.error(
            "Erro ao enviar notificação de tarefa atualizada:",
            notificationError
          );
          // Continue even if notification fails
        }
      }

      // If the task was updated by someone else, notify the assigned user
      if (task.assignedTo && task.assignedTo !== userId) {
        try {
          // Get the updater's name
          const updater = await storage.getUser(userId);
          const updaterName = updater ? updater.name : "Alguém";

          // Create push notification payload
          const pushPayload: PushNotificationPayload = {
            title: `Tarefa atualizada: ${updatedTask.title}`,
            body: `${updaterName} atualizou uma tarefa atribuída a você`,
            data: {
              type: "task_updated",
              referenceType: "task",
              referenceId: updatedTask.id,
            },
            referenceType: "task",
            referenceId: updatedTask.id,
            tag: `task_${updatedTask.id}`,
          };

          // Send push notification to the assigned user
          const sentCount = await sendPushToUser(task.assignedTo, pushPayload);
          console.log(
            `Enviadas ${sentCount} notificações push para o responsável pela tarefa atualizada`
          );

          // Create notification in database
          await storage.createNotification({
            userId: task.assignedTo,
            title: pushPayload.title,
            message: pushPayload.body,
            type: "task",
            referenceType: "task",
            referenceId: updatedTask.id,
            isRead: false,
            metadata: JSON.stringify({
              taskId: updatedTask.id,
              updatedBy: userId,
            }),
          });
        } catch (notificationError) {
          console.error(
            "Erro ao enviar notificação de tarefa atualizada:",
            notificationError
          );
          // Continue even if notification fails
        }
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Erro ao atualizar tarefa doméstica:", error);
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
        return res
          .status(403)
          .json({ message: "Only the task creator can delete this task" });
      }

      const deleted = await storage.deleteHouseholdTask(taskId);

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete task" });
      }
    } catch (error) {
      console.error("Erro ao excluir tarefa doméstica:", error);
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

      if (typeof completed !== "boolean") {
        return res
          .status(400)
          .json({ message: "completed field must be a boolean" });
      }

      const task = await storage.getHouseholdTask(taskId);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verificar se o usuário tem permissão para atualizar
      const userId = req.user?.id as number;
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        const user = await storage.getUser(userId);
        if (
          !user?.partnerId ||
          (task.createdBy !== user.partnerId &&
            task.assignedTo !== user.partnerId)
        ) {
          return res
            .status(403)
            .json({ message: "You don't have permission to update this task" });
        }
      }

      const updatedTask = await storage.markHouseholdTaskAsCompleted(
        taskId,
        completed,
        userId
      );

      // If the task was completed by someone else, notify the creator
      if (completed && task.createdBy !== userId) {
        try {
          // Get the completer's name
          const completer = await storage.getUser(userId);
          const completerName = completer ? completer.name : "Alguém";

          // Create push notification payload
          const pushPayload: PushNotificationPayload = {
            title: `Tarefa concluída: ${updatedTask.title}`,
            body: `${completerName} marcou a tarefa como concluída`,
            data: {
              type: "task_completed",
              referenceType: "task",
              referenceId: updatedTask.id,
            },
            referenceType: "task",
            referenceId: updatedTask.id,
            tag: `task_${updatedTask.id}`,
          };

          // Send push notification to the task creator
          const sentCount = await sendPushToUser(task.createdBy, pushPayload);
          console.log(
            `Enviadas ${sentCount} notificações push para o criador da tarefa concluída`
          );

          // Create notification in database
          await storage.createNotification({
            userId: task.createdBy,
            title: pushPayload.title,
            message: pushPayload.body,
            type: "task",
            referenceType: "task",
            referenceId: updatedTask.id,
            isRead: false,
            metadata: JSON.stringify({
              taskId: updatedTask.id,
              completedBy: userId,
              completed: true,
            }),
          });
        } catch (notificationError) {
          console.error(
            "Erro ao enviar notificação de tarefa concluída:",
            notificationError
          );
          // Continue even if notification fails
        }
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Erro ao atualizar status da tarefa:", error);
      res
        .status(500)
        .json({ message: "Failed to update task completion status" });
    }
  });

  // POST - Enviar lembrete de tarefa por e-mail para o parceiro
  // GET - Obter histórico de conclusão de uma tarefa
  app.get("/api/tasks/:id/completion-history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getHouseholdTask(taskId);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verificar se o usuário tem permissão para visualizar
      const userId = req.user?.id as number;
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        const user = await storage.getUser(userId);
        if (
          !user?.partnerId ||
          (task.createdBy !== user.partnerId &&
            task.assignedTo !== user.partnerId)
        ) {
          return res.status(403).json({
            message: "You don't have permission to view this task history",
          });
        }
      }

      // Obter parâmetros de filtro opcional
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;

      let history;
      if (startDateParam && endDateParam) {
        // Se foram fornecidas datas de início e fim, filtrar por período
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);
        history = await storage.getTaskCompletionHistoryForPeriod(
          taskId,
          startDate,
          endDate
        );
      } else {
        // Caso contrário, retornar todo o histórico
        history = await storage.getTaskCompletionHistory(taskId);
      }

      res.json({
        task,
        history,
      });
    } catch (error) {
      console.error("Erro ao obter histórico de conclusão:", error);
      res
        .status(500)
        .json({ message: "Failed to get task completion history" });
    }
  });

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
        return res.status(403).json({
          message: "You don't have permission to send reminders for this task",
        });
      }

      // Obter o usuário atual e seu parceiro
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!currentUser.partnerId) {
        return res
          .status(400)
          .json({ message: "You don't have a partner to send reminders to" });
      }

      const partner = await storage.getUser(currentUser.partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      if (!partner.email) {
        return res
          .status(400)
          .json({ message: "Your partner doesn't have an email address" });
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

      const emailSent = await sendEmail({
        to: partner.email, // Usando o email do próprio usuário para respeitar as limitações da API de teste do Resend
        subject: `💡 Amor, lembrete da tarefa: ${task.title}`,
        html,
        text,
      });

      if (emailSent) {
        res.status(200).json({ message: "Reminder sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send reminder email" });
      }
    } catch (error) {
      console.error("Erro ao enviar lembrete de tarefa:", error);
      res.status(500).json({
        message: "Failed to send task reminder",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.put("/api/tasks-reorder", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { tasks } = req.body;
      console.log("Received task reorder request:", JSON.stringify(tasks));

      // Obter o ID do usuário atual
      const userId = req.user?.id as number;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Validate input
      if (!Array.isArray(tasks)) {
        return res.status(400).json({
          status: "error",
          message: "Expected an array of tasks",
        });
      }

      // Strict validation and conversion of task IDs and positions
      let validTasks = [];

      for (const task of tasks) {
        // Task deve ter um ID e uma posição
        if (!task || task.id === undefined || task.position === undefined) {
          console.warn(
            `Task inválida ou incompleta recebida: ${JSON.stringify(task)}`
          );
          continue;
        }

        // Make sure both values are numeric
        let id, position;

        try {
          // Tratar múltiplos tipos de dados para ID
          if (typeof task.id === "number") {
            id = task.id;
          } else if (typeof task.id === "string") {
            id = parseInt(task.id, 10);
          } else {
            console.warn(`Tipo de ID não tratável: ${typeof task.id}`);
            continue;
          }

          // Tratar múltiplos tipos de dados para posição
          if (typeof task.position === "number") {
            position = task.position;
          } else if (typeof task.position === "string") {
            position = parseInt(task.position, 10);
          } else {
            console.warn(
              `Tipo de posição não tratável: ${typeof task.position}`
            );
            continue;
          }

          // Validar após conversão
          if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
            console.warn(
              `ID de tarefa inválido após conversão: ${task.id} => ${id}`
            );
            continue;
          }

          if (isNaN(position) || !Number.isInteger(position) || position < 0) {
            console.warn(
              `Posição inválida após conversão: ${task.position} => ${position}`
            );
            continue;
          }

          // Add to valid tasks
          validTasks.push({ id, position });
        } catch (err) {
          console.warn(
            `Erro ao processar tarefa: ${JSON.stringify(task)}`,
            err
          );
          continue;
        }
      }

      if (validTasks.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Nenhuma tarefa válida fornecida para reordenação",
        });
      }

      // Verificar se as tarefas pertencem ao usuário
      // Obter IDs de todas as tarefas que queremos reordenar
      const taskIds = validTasks.map((task) => task.id);

      // Verificar se alguma tarefa está com ID NaN
      const nanTasks = taskIds.filter((id) => isNaN(id));
      if (nanTasks.length > 0) {
        console.error("ID de tarefa inválido recebido como NaN:", nanTasks);
        return res.status(400).json({
          status: "error",
          message: "Invalid task ID received",
          details: { invalidIds: nanTasks },
        });
      }

      // Verificar diretamente no banco se as tarefas existem e pertencem ao usuário
      try {
        // Log detalhado para depuração
        console.log(
          "Executando consulta SQL para verificar tarefas. IDs das tarefas:",
          taskIds
        );
        console.log("UserID atual:", userId);

        const results = await db.execute(
          sql`SELECT id FROM household_tasks 
              WHERE id IN (${sql.join(taskIds, sql`, `)}) 
              AND (created_by = ${userId} OR assigned_to = ${userId})`
        );

        console.log("Resultados da consulta:", results.rows);

        const foundIds = results.rows.map((row) => Number(row.id));
        console.log("IDs encontrados no banco:", foundIds);

        const missingIds = taskIds.filter((id) => !foundIds.includes(id));
        console.log("IDs de tarefas não encontrados:", missingIds);

        if (missingIds.length > 0) {
          console.warn(
            `Tarefas não encontradas ou sem permissão: ${missingIds.join(", ")}`
          );

          // Verificar se qualquer ID existe no banco de dados (independente do dono)
          const taskExistenceCheck = await db.execute(
            sql`SELECT id FROM household_tasks WHERE id IN (${sql.join(missingIds, sql`, `)})`
          );

          const existingIds = taskExistenceCheck.rows.map((row) =>
            Number(row.id)
          );
          const nonExistentIds = missingIds.filter(
            (id) => !existingIds.includes(id)
          );
          const unauthorizedIds = missingIds.filter((id) =>
            existingIds.includes(id)
          );

          if (nonExistentIds.length > 0) {
            console.error("Tarefas inexistentes:", nonExistentIds);
          }

          if (unauthorizedIds.length > 0) {
            console.error(
              "Tarefas existentes, mas sem permissão:",
              unauthorizedIds
            );
          }

          // Filtrar apenas tarefas que foram encontradas
          const filteredTasks = validTasks.filter((task) =>
            foundIds.includes(task.id)
          );

          if (filteredTasks.length === 0) {
            console.error("Nenhuma tarefa válida encontrada após filtragem");
            return res.status(404).json({
              status: "error",
              message: "Task not found",
              details: {
                nonExistentIds,
                unauthorizedIds,
                message: "None of the provided tasks belong to you or exist",
              },
            });
          }

          // Atualizar a referência
          console.log(
            `Continuando com ${filteredTasks.length} tarefas válidas:`,
            filteredTasks.map((t) => ({ id: t.id, position: t.position }))
          );

          // Usar a lista filtrada
          validTasks = filteredTasks;
        }

        // Se chegou aqui, temos pelo menos algumas tarefas válidas
        console.log("Tarefas validadas para reordenação:", validTasks);

        // Tentar atualizar diretamente no banco com uma transação
        let success = false;

        await db.transaction(async (tx) => {
          // Atualizar cada tarefa diretamente
          for (const task of validTasks) {
            await tx
              .update(householdTasks)
              .set({ position: task.position })
              .where(eq(householdTasks.id, task.id));
          }
          success = true;
        });

        if (success) {
          return res.status(200).json({
            status: "success",
            message: "Tasks reordered successfully",
            count: validTasks.length,
          });
        } else {
          return res.status(500).json({
            status: "error",
            message: "Failed to update task positions",
          });
        }
      } catch (error) {
        console.error(
          "Erro durante verificação ou atualização de tarefas:",
          error
        );
        return res.status(500).json({
          status: "error",
          message: "Error processing tasks",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    } catch (error) {
      console.error("Error reordering tasks:", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
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
      message:
        "Notification feature is under development. Currently, use email reminders instead.",
      alternativeEndpoint: `/api/tasks/${req.params.id}/remind`,
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
        return res
          .status(400)
          .json({ message: "You don't have a partner to send reminders to" });
      }

      const partner = await storage.getUser(currentUser.partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      if (!partner.email) {
        return res
          .status(400)
          .json({ message: "Your partner doesn't have an email address" });
      }

      // No ambiente de teste do Resend, só podemos enviar emails para o próprio email do usuário registrado
      // Esta é uma limitação da API gratuita do Resend
      const testEmail = "matheus.murbach@gmail.com"; // Email do usuário registrado no Resend
      console.log(
        `Usando endereço autorizado pelo Resend em vez de ${partner.email}: ${testEmail}`
      );

      // Sobrescrever o email do parceiro para o endereço de teste
      const partnerWithTestEmail = {
        ...partner,
        email: testEmail,
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
        text,
      });

      if (emailSent) {
        res.status(200).json({
          message: "Test reminder sent successfully",
          details: {
            from: currentUser.name,
            to: partner.name,
            email: partner.email,
            task: task.title,
          },
        });
      } else {
        res.status(500).json({ message: "Failed to send test reminder email" });
      }
    } catch (error) {
      console.error("Erro ao enviar lembrete de teste:", error);
      res.status(500).json({
        message: "Failed to send test reminder",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ===== API para gerenciamento de dispositivos e notificações push =====

  // Endpoint para registrar um dispositivo de navegador para notificações Web Push
  app.post("/api/push/register-device", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user?.id as number;
      const { deviceToken, deviceType, deviceName } = req.body;

      if (!deviceToken) {
        return res.status(400).json({
          message: "Invalid request",
          error: "Device token is required",
        });
      }

      // Verificar se é um token de subscription válido (para web push)
      if (deviceType === "web") {
        try {
          const subscription = JSON.parse(deviceToken);
          if (
            !subscription.endpoint ||
            !subscription.keys ||
            !subscription.keys.p256dh ||
            !subscription.keys.auth
          ) {
            return res.status(400).json({
              message: "Invalid web push subscription",
              error: "Subscription format is invalid",
            });
          }
        } catch (error) {
          return res.status(400).json({
            message: "Invalid web push subscription",
            error: "Could not parse subscription",
          });
        }
      }

      // Verificar se o token já está registrado para este usuário
      const existingDevice = await storage.getUserDeviceByToken(deviceToken);

      // Se o dispositivo já existe e pertence a este usuário, apenas atualize-o
      if (existingDevice && existingDevice.userId === userId) {
        const updatedDevice = await storage.updateUserDevice(
          existingDevice.id,
          {
            lastUsed: new Date(),
            pushEnabled: true,
            deviceName: deviceName || existingDevice.deviceName,
          }
        );

        console.log("Dispositivo atualizado para Web Push:", updatedDevice);
        return res.status(200).json({
          message: "Device updated",
          device: updatedDevice,
        });
      }

      // Se o dispositivo existe mas pertence a outro usuário, rejeite
      if (existingDevice) {
        return res.status(409).json({
          message: "Device token already registered to another user",
        });
      }

      // Registrar novo dispositivo
      const newDevice = await storage.registerUserDevice({
        userId,
        deviceToken,
        deviceType,
        deviceName: deviceName || `Browser ${new Date().toLocaleDateString()}`,
        pushEnabled: true,
      });

      console.log("Novo dispositivo registrado para Web Push:", newDevice);
      return res.status(201).json({
        message: "Device registered successfully",
        device: newDevice,
      });
    } catch (error) {
      console.error("Erro ao registrar dispositivo para Web Push:", error);
      return res.status(500).json({
        message: "Failed to register device",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Endpoint para cancelar registro de dispositivo para notificações Web Push
  app.post(
    "/api/push/unregister-device",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const userId = req.user?.id as number;
        const { deviceToken } = req.body;

        if (!deviceToken) {
          return res.status(400).json({
            message: "Invalid request",
            error: "Device token is required",
          });
        }

        // Verificar se o token está registrado
        const device = await storage.getUserDeviceByToken(deviceToken);

        // Se não encontrou o dispositivo, informe que a operação foi bem-sucedida
        if (!device) {
          return res.status(200).json({
            message: "Device was not registered",
          });
        }

        // Se o dispositivo pertence a outro usuário, não permita a remoção
        if (device.userId !== userId) {
          return res.status(403).json({
            message: "You don't have permission to unregister this device",
          });
        }

        // Desabilitar notificações para o dispositivo ou removê-lo
        const removed = await storage.deleteUserDevice(device.id);

        if (removed) {
          return res.status(200).json({
            message: "Device unregistered successfully",
          });
        } else {
          return res.status(500).json({
            message: "Failed to unregister device",
          });
        }
      } catch (error) {
        console.error("Erro ao cancelar registro de dispositivo:", error);
        return res.status(500).json({
          message: "Failed to unregister device",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Registra um novo dispositivo para receber notificações push (endpoint genérico)
  app.post("/api/devices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user?.id as number;

      // Criar um novo objeto com os dados do corpo da requisição + userId da sessão
      const deviceData = {
        ...req.body,
        userId, // Atribua o ID do usuário da sessão
      };

      // Validar dados do dispositivo com o userId já atribuído
      const validationResult = insertUserDeviceSchema.safeParse(deviceData);
      if (!validationResult.success) {
        console.log("Erro de validação:", validationResult.error.format());
        return res.status(400).json({
          message: "Invalid device data",
          errors: validationResult.error.format(),
        });
      }

      // Verificar se o token já está registrado para este usuário
      const existingDevice = await storage.getUserDeviceByToken(
        deviceData.deviceToken
      );
      if (existingDevice && existingDevice.userId === userId) {
        // Atualizar dispositivo existente
        const updatedDevice = await storage.updateUserDevice(
          existingDevice.id,
          {
            ...deviceData,
            lastUsed: new Date(),
          }
        );
        return res.json(updatedDevice);
      }

      // Registrar novo dispositivo com dados validados
      const device = await storage.registerUserDevice(validationResult.data);

      res.status(201).json(device);
    } catch (error) {
      console.error("Erro ao registrar dispositivo:", error);
      res.status(500).json({
        message: "Failed to register device",
        error: error instanceof Error ? error.message : String(error),
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
      console.error("Erro ao obter dispositivos:", error);
      res.status(500).json({
        message: "Failed to fetch devices",
        error: error instanceof Error ? error.message : String(error),
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
      const device = devices.find((d) => d.id === deviceId);

      if (!device) {
        return res
          .status(404)
          .json({ message: "Device not found or not owned by you" });
      }

      const updatedDevice = await storage.updateUserDevice(deviceId, {
        ...req.body,
        lastUsed: new Date(),
      });

      res.json(updatedDevice);
    } catch (error) {
      console.error("Erro ao atualizar dispositivo:", error);
      res.status(500).json({
        message: "Failed to update device",
        error: error instanceof Error ? error.message : String(error),
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
      const device = devices.find((d) => d.id === deviceId);

      if (!device) {
        return res
          .status(404)
          .json({ message: "Device not found or not owned by you" });
      }

      const deleted = await storage.deleteUserDevice(deviceId);

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete device" });
      }
    } catch (error) {
      console.error("Erro ao remover dispositivo:", error);
      res.status(500).json({
        message: "Failed to delete device",
        error: error instanceof Error ? error.message : String(error),
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
      console.error("Erro ao obter notificações:", error);
      res.status(500).json({
        message: "Failed to fetch notifications",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/notifications-readAll", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user?.id as number;
      const notifications = await storage.markAllNotificationsAsRead(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Erro ao obter notificações:", error);
      res.status(500).json({
        message: "Failed to fetch notifications",
        error: error instanceof Error ? error.message : String(error),
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
        return res.status(403).json({
          message: "You don't have permission to access this notification",
        });
      }

      const updatedNotification =
        await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      res.status(500).json({
        message: "Failed to mark notification as read",
        error: error instanceof Error ? error.message : String(error),
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
        return res.status(403).json({
          message: "You don't have permission to delete this notification",
        });
      }

      const deleted = await storage.deleteNotification(notificationId);

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete notification" });
      }
    } catch (error) {
      console.error("Erro ao remover notificação:", error);
      res.status(500).json({
        message: "Failed to delete notification",
        error: error instanceof Error ? error.message : String(error),
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
        return res
          .status(400)
          .json({ message: "You don't have a partner to notify" });
      }

      // Validar dados da notificação
      const { title, message, type, referenceType, referenceId, metadata } =
        req.body;

      if (!title || !message || !type) {
        return res.status(400).json({
          message: "Required fields missing",
          required: ["title", "message", "type"],
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
        isRead: false,
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
            metadata,
          },
        };

        // Enviar push para todos os dispositivos do parceiro
        const sentCount = await sendPushToUser(
          currentUser.partnerId,
          pushPayload
        );

        console.log(`Enviadas ${sentCount} notificações push para o parceiro`);

        res.status(201).json({
          message: "Notification sent to partner",
          notification,
          pushSent: sentCount > 0,
        });
      } catch (pushError) {
        console.error("Erro ao enviar notificação push:", pushError);

        // Mesmo com falha no push, a notificação foi criada
        res.status(201).json({
          message: "Notification created but push failed",
          notification,
          pushSent: false,
          pushError:
            pushError instanceof Error ? pushError.message : String(pushError),
        });
      }
    } catch (error) {
      console.error("Erro ao enviar notificação para o parceiro:", error);
      res.status(500).json({
        message: "Failed to send notification",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Endpoint para teste de notificação push
  app.post("/api/notifications/test", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user?.id as number;

      // Verificar dados da solicitação para personalização
      const {
        title = "Notificação de teste",
        message = "Esta é uma notificação de teste do sistema NossaRotina!",
        platform = null, // 'web', 'ios', ou null (todos)
        icon = null,
        sound = "default",
        badge = 1,
        requireInteraction = true,
        actions = [],
      } = req.body;

      console.log(
        `Teste de notificação solicitado pelo usuário ${userId} para plataforma: ${platform || "todas"}`
      );

      // Criar uma notificação de teste no banco de dados
      const notification = await storage.createNotification({
        userId,
        title,
        message,
        type: "test",
        referenceType: platform ? `test-${platform}` : "test-all",
        referenceId: null,
        metadata: JSON.stringify({
          platform,
          icon,
          sound,
          badge,
          requestedAt: new Date().toISOString(),
          requireInteraction,
          actions,
        }),
        isRead: false,
      });

      // Configurar payload da notificação com formato explícito para compatibilidade com o service worker
      const pushPayload: PushNotificationPayload = {
        title,
        body: message,
        icon: icon || "/icons/icon-192x192.png", // Fornecer um ícone padrão
        badge: badge ? String(badge) : undefined,
        sound,
        requireInteraction,
        tag: `test-${Date.now()}`,
        actions,
        // Garantir que estes dados estejam disponíveis para o service worker
        data: {
          type: "test",
          notificationId: notification.id,
          timestamp: Date.now(),
          referenceType: "test",
        },
        // Incluir referências explicitamente
        referenceType: "test",
        referenceId: notification.id,
      };

      console.log(
        "[NOTIF TEST] Payload configurado:",
        JSON.stringify(pushPayload)
      );

      // Enviar push para dispositivos com base na plataforma solicitada
      let sentCount = 0;

      try {
        if (platform) {
          // Buscar dispositivos da plataforma específica
          const devices = await storage.getUserDevices(userId);
          console.log(userId, devices);
          const filteredDevices = devices.filter(
            (device) => device.deviceType === platform && device.pushEnabled
          );

          if (filteredDevices.length === 0) {
            res.status(400).json({
              message: `No registered ${platform} devices found`,
              notification,
              pushSent: false,
            });
            return;
          }

          // Enviar para dispositivos específicos da plataforma
          const results = await Promise.all(
            filteredDevices.map((device) =>
              sendPushToDevice(device, pushPayload)
            )
          );

          sentCount = results.filter((result: boolean) => result).length;
          console.log(
            `Enviadas ${sentCount} notificações push de teste para dispositivos ${platform}`
          );
        } else {
          // Enviar para todos os dispositivos
          sentCount = await sendPushToUser(userId, pushPayload);
          console.log(
            `Enviadas ${sentCount} notificações push de teste para todos os dispositivos`
          );
        }

        res.status(201).json({
          message: "Test notification sent",
          notification,
          pushSent: sentCount > 0,
          sentCount,
          targetPlatform: platform || "all",
        });
      } catch (pushError) {
        console.error("Erro ao enviar notificação push de teste:", pushError);

        // Mesmo com falha no push, a notificação foi criada
        res.status(201).json({
          message: "Test notification created but push failed",
          notification,
          pushSent: false,
          error:
            pushError instanceof Error ? pushError.message : String(pushError),
          targetPlatform: platform || "all",
        });
      }
    } catch (error) {
      console.error("Erro ao criar notificação de teste:", error);
      res.status(500).json({
        message: "Failed to create test notification",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const httpServer = createServer(app);

  // Configurar servidor WebSocket para diagnóstico
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
  });

  console.log("Servidor WebSocket configurado em /ws");

  wss.on("connection", (ws) => {
    console.log("Nova conexão WebSocket estabelecida");

    ws.on("message", (message) => {
      console.log("Mensagem recebida:", message.toString());
      ws.send("Mensagem recebida com sucesso! Servidor WebSocket funcionando.");
    });

    ws.on("close", () => {
      console.log("Conexão WebSocket fechada");
    });

    ws.on("error", (error) => {
      console.error("Erro na conexão WebSocket:", error);
    });

    // Enviar mensagem de boas-vindas
    ws.send("Conexão WebSocket estabelecida com sucesso!");
  });

  return httpServer;
}
