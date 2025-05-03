import express, { type Request, Response } from "express";
import { IStorage } from "./storage";
import { z } from "zod";
import { addMinutes, addHours, addDays } from "date-fns";

/**
 * Configura as rotas para o sistema de lembretes
 */
export function setupReminderRoutes(app: express.Express, storage: IStorage) {
  /**
   * Criar um novo lembrete para um evento
   */
  app.post(
    "/api/events/:eventId/reminders",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const eventId = parseInt(req.params.eventId);
        const userId = req.user?.id as number;

        // Verificar se o evento existe e se o usuário tem acesso a ele
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Evento não encontrado" });
        }

        // Verificar se o usuário é o criador do evento ou tem acesso a ele
        if (event.createdBy !== userId) {
          const shares = await storage.getEventShares(eventId);
          const userShare = shares.find((share) => share.userId === userId);
          if (!userShare) {
            return res.status(403).json({
              message:
                "Você não tem permissão para adicionar lembretes a este evento",
            });
          }
        }

        // Validar os dados do lembrete
        const reminderSchema = z.object({
          reminderType: z.enum(["email", "push", "both"]),
          reminderTime: z.string(),
          customMessage: z.string().optional().nullable(),
        });

        const validation = reminderSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Dados de lembrete inválidos",
            errors: validation.error.format(),
          });
        }

        const { reminderType, reminderTime, customMessage } = validation.data;

        // Calcular a data e hora do lembrete com base no reminderTime (reminderDate no banco)
        const eventDate =
          event.date instanceof Date ? event.date : new Date(event.date);

        let reminderDate = new Date(eventDate);

        if (reminderTime === "10min") {
          reminderDate = addMinutes(reminderDate, -10);
        } else if (reminderTime === "30min") {
          reminderDate = addMinutes(reminderDate, -30);
        } else if (reminderTime === "1hour") {
          reminderDate = addHours(reminderDate, -1);
        } else if (reminderTime === "2hours") {
          reminderDate = addHours(reminderDate, -2);
        } else if (reminderTime === "1day") {
          reminderDate = addDays(reminderDate, -1);
        } else if (reminderTime === "2days") {
          reminderDate = addDays(reminderDate, -2);
        } else if (reminderTime === "1week") {
          reminderDate = addDays(reminderDate, -7);
        }

        // Criar lembretes para cada tipo (email, push ou ambos)
        const reminders = [];

        if (reminderType === "email" || reminderType === "both") {
          const emailReminder = await storage.createEventReminder({
            eventId,
            userId,
            reminderTime: reminderDate,
            reminderType: "email",
            message: customMessage || null,
            sent: false,
          });
          reminders.push(emailReminder);
        }

        if (reminderType === "push" || reminderType === "both") {
          const pushReminder = await storage.createEventReminder({
            eventId,
            userId,
            reminderTime: reminderDate,
            reminderType: "push",
            message: customMessage || null,
            sent: false,
          });
          reminders.push(pushReminder);
        }

        return res.status(201).json({
          message: "Lembretes criados com sucesso",
          reminders,
        });
      } catch (error) {
        console.error("Erro ao criar lembretes de evento:", error);
        return res.status(500).json({
          message: "Erro ao criar lembretes de evento",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * Obter todos os lembretes de um evento
   */
  app.get(
    "/api/events/:eventId/reminders",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const eventId = parseInt(req.params.eventId);
        const userId = req.user?.id as number;

        // Verificar se o evento existe e se o usuário tem acesso a ele
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Evento não encontrado" });
        }

        // Verificar se o usuário é o criador do evento ou tem acesso a ele
        if (event.createdBy !== userId) {
          const shares = await storage.getEventShares(eventId);
          const userShare = shares.find((share) => share.userId === userId);
          if (!userShare) {
            return res.status(403).json({
              message: "Você não tem permissão para ver lembretes deste evento",
            });
          }
        }

        // Obter lembretes do usuário para este evento
        const reminders = await storage.getUserEventReminders(userId);

        return res.json({
          eventId,
          reminders,
        });
      } catch (error) {
        console.error("Erro ao buscar lembretes de evento:", error);
        return res.status(500).json({
          message: "Erro ao buscar lembretes de evento",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * Excluir um lembrete de evento
   */
  app.delete(
    "/api/events/reminders/:id",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const reminderId = parseInt(req.params.id);
        const userId = req.user?.id as number;

        // Verificar se o lembrete existe e pertence ao usuário
        const reminders = await storage.getEventReminders(reminderId);
        const reminder = reminders[0]; // Assuming you want the first reminder
        if (!reminder) {
          return res.status(404).json({ message: "Lembrete não encontrado" });
        }

        if (reminder.userId !== userId) {
          return res.status(403).json({
            message: "Você não tem permissão para excluir este lembrete",
          });
        }

        // Excluir o lembrete
        await storage.deleteEventReminder(reminderId);

        return res.json({
          message: "Lembrete excluído com sucesso",
        });
      } catch (error) {
        console.error("Erro ao excluir lembrete de evento:", error);
        return res.status(500).json({
          message: "Erro ao excluir lembrete de evento",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );
  /**
   * Criar um novo lembrete para uma tarefa
   */
  app.post(
    "/api/tasks/:taskId/reminders",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const taskId = parseInt(req.params.taskId);
        const userId = req.user?.id as number;

        // Verificar se a tarefa existe e se o usuário tem acesso a ela
        const task = await storage.getHouseholdTask(taskId);
        if (!task) {
          return res.status(404).json({ message: "Tarefa não encontrada" });
        }

        // Verificar se o usuário é o criador da tarefa ou se ela foi atribuída a ele
        if (task.createdBy !== userId && task.assignedTo !== userId) {
          return res.status(403).json({
            message:
              "Você não tem permissão para adicionar lembretes a esta tarefa",
          });
        }

        // Validar os dados do lembrete
        const reminderSchema = z.object({
          reminderType: z.enum(["email", "push", "both"]),
          reminderTime: z.string(),
          customMessage: z.string().optional().nullable(),
          recipientId: z.number().optional(), // ID do destinatário (se for para outra pessoa)
        });

        const validation = reminderSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Dados de lembrete inválidos",
            errors: validation.error.format(),
          });
        }

        const { reminderType, reminderTime, customMessage, recipientId } =
          validation.data;

        // Determinar o usuário que receberá o lembrete
        let reminderUserId = userId;

        // Se for um lembrete para o parceiro
        if (recipientId && recipientId !== userId) {
          // Verificar se é o parceiro
          const user = await storage.getUser(userId);
          if (user?.partnerId !== recipientId) {
            return res.status(403).json({
              message: "Você só pode enviar lembretes para seu parceiro",
            });
          }
          reminderUserId = recipientId;
        }

        // Calcular a data e hora do lembrete com base no reminderTime (reminderDate no banco)
        let reminderDate = new Date();

        // Se a tarefa tiver data de vencimento, usar como base
        if (task.dueDate) {
          reminderDate =
            task.dueDate instanceof Date
              ? new Date(task.dueDate)
              : new Date(task.dueDate);
        }

        if (reminderTime === "10min") {
          reminderDate = addMinutes(reminderDate, -10);
        } else if (reminderTime === "30min") {
          reminderDate = addMinutes(reminderDate, -30);
        } else if (reminderTime === "1hour") {
          reminderDate = addHours(reminderDate, -1);
        } else if (reminderTime === "2hours") {
          reminderDate = addHours(reminderDate, -2);
        } else if (reminderTime === "1day") {
          reminderDate = addDays(reminderDate, -1);
        } else if (reminderTime === "2days") {
          reminderDate = addDays(reminderDate, -2);
        } else if (reminderTime === "1week") {
          reminderDate = addDays(reminderDate, -7);
        } else if (reminderTime === "now") {
          // Enviar agora - não alterar a data
        }

        // Criar lembretes para cada tipo (email, push ou ambos)
        const reminders = [];

        if (reminderType === "email" || reminderType === "both") {
          const emailReminder = await storage.createTaskReminder({
            taskId,
            userId: reminderUserId,
            createdBy: userId,
            reminderDate,
            reminderType: "email",
            message: customMessage ?? null,
            sent: reminderTime === "now", // Se for "now", marcar como enviado
          });
          reminders.push(emailReminder);

          // Se for para enviar agora, disparar o email
          if (reminderTime === "now") {
            // Obter detalhes do destinatário
            const recipient = await storage.getUser(reminderUserId);
            const sender = await storage.getUser(userId);

            if (recipient && sender) {
              // Enviar email usando o serviço de email
              const { generateTaskReminderEmail, sendEmail } = await import(
                "./email"
              );

              const emailContent = generateTaskReminderEmail(
                recipient.name,
                sender.name,
                task.title,
                task.description,
                customMessage ?? null,
                task.id
              );

              await sendEmail({
                to: recipient.email,
                subject: `Lembrete: ${task.title}`,
                html: emailContent.html,
                text: emailContent.text,
              });
            }
          }
        }

        if (reminderType === "push" || reminderType === "both") {
          const pushReminder = await storage.createTaskReminder({
            taskId,
            userId: reminderUserId,
            createdBy: userId,
            reminderDate,
            reminderType: "push",
            message: customMessage ?? null,
            sent: reminderTime === "now", // Se for "now", marcar como enviado
          });
          reminders.push(pushReminder);

          // Se for para enviar agora, disparar a notificação push
          if (reminderTime === "now") {
            // Obter detalhes do destinatário
            const recipient = await storage.getUser(reminderUserId);
            const sender = await storage.getUser(userId);

            if (recipient && sender) {
              // Enviar notificação push
              const { sendPushToUser } = await import("./pushNotifications");

              await sendPushToUser(reminderUserId, {
                title: `Lembrete: ${task.title}`,
                body:
                  customMessage ??
                  `${sender.name} enviou um lembrete sobre uma tarefa`,
                data: {
                  type: "task_reminder",
                  taskId: task.id.toString(),
                  url: `/household-tasks?task=${task.id}`,
                },
                referenceType: "task",
                referenceId: task.id,
              });

              // Criar uma notificação in-app
              await storage.createNotification({
                userId: reminderUserId,
                title: `Lembrete: ${task.title}`,
                message:
                  customMessage ??
                  `${sender.name} enviou um lembrete sobre uma tarefa`,
                type: "task_reminder",
                referenceType: "task",
                referenceId: task.id,
                isRead: false,
              });
            }
          }
        }

        return res.status(201).json({
          message: "Lembretes criados com sucesso",
          reminders,
        });
      } catch (error) {
        console.error("Erro ao criar lembretes de tarefa:", error);
        return res.status(500).json({
          message: "Erro ao criar lembretes de tarefa",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );
  /**
   * Obter todos os lembretes de uma tarefa
   */
  app.get(
    "/api/tasks/:taskId/reminders",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const taskId = parseInt(req.params.taskId);
        const userId = req.user?.id as number;

        // Verificar se a tarefa existe
        const task = await storage.getHouseholdTask(taskId);
        if (!task) {
          return res.status(404).json({ message: "Tarefa não encontrada" });
        }

        // Verificar se o usuário tem acesso à tarefa
        if (task.createdBy !== userId && task.assignedTo !== userId) {
          return res.status(403).json({
            message: "Você não tem permissão para ver lembretes desta tarefa",
          });
        }

        // Obter lembretes criados pelo usuário ou destinados a ele
        const reminders = await storage.getUserTaskReminders(userId);

        return res.json({
          taskId,
          reminders,
        });
      } catch (error) {
        console.error("Erro ao buscar lembretes de tarefa:", error);
        return res.status(500).json({
          message: "Erro ao buscar lembretes de tarefa",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * Excluir um lembrete de tarefa
   */
  app.delete(
    "/api/tasks/reminders/:id",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const reminderId = parseInt(req.params.id);
        const userId = req.user?.id as number;

        // Verificar se o lembrete existe e pertence ao usuário
        const reminders = await storage.getTaskReminders(reminderId);
        const reminder = reminders[0];
        if (!reminder) {
          return res.status(404).json({ message: "Lembrete não encontrado" });
        }

        if (reminder.createdBy !== userId) {
          return res.status(403).json({
            message: "Você não tem permissão para excluir este lembrete",
          });
        }

        // Excluir o lembrete
        await storage.deleteTaskReminder(reminderId);

        return res.json({
          message: "Lembrete excluído com sucesso",
        });
      } catch (error) {
        console.error("Erro ao excluir lembrete de tarefa:", error);
        return res.status(500).json({
          message: "Erro ao excluir lembrete de tarefa",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * Obter todos os lembretes pendentes do usuário
   */
  app.get("/api/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user?.id as number;

      // Obter lembretes de eventos e tarefas para o usuário
      const eventReminders = await storage.getUserEventReminders(userId);
      const taskReminders = await storage.getUserTaskReminders(userId);

      // Combinar os lembretes e ordenar por data
      const allReminders = {
        events: eventReminders,
        tasks: taskReminders,
      };

      return res.json(allReminders);
    } catch (error) {
      console.error("Erro ao buscar lembretes do usuário:", error);
      return res.status(500).json({
        message: "Erro ao buscar lembretes do usuário",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
