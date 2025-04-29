import express, { Request, Response } from "express";
import { IStorage } from "./storage";
import { z } from "zod";
import { 
  insertEventReminderSchema, 
  insertTaskReminderSchema,
  EventReminder,
  TaskReminder
} from "@shared/schema";

/**
 * Configura as rotas para o sistema de lembretes
 */
export function setupReminderRoutes(app: express.Express, storage: IStorage) {
  // ===== Rotas para lembretes de eventos =====
  
  // Adicionar um novo lembrete para um evento
  app.post("/api/events/:eventId/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user?.id as number;

      // Verificar se o evento existe
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verificar se o usuário tem acesso ao evento
      if (event.createdBy !== userId) {
        // Verificar se é um evento compartilhado
        const eventShares = await storage.getEventShares(eventId);
        const userShare = eventShares.find(share => share.userId === userId);
        
        if (!userShare) {
          return res.status(403).json({
            message: "You don't have permission to add reminders to this event"
          });
        }
      }

      // Validar os dados do lembrete
      const reminderData = {
        ...req.body,
        eventId,
        userId
      };

      const validationResult = insertEventReminderSchema.safeParse(reminderData);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid reminder data",
          errors: validationResult.error.format()
        });
      }

      // Criar o lembrete
      const reminder = await storage.createEventReminder(validationResult.data);
      
      res.status(201).json({
        message: "Reminder created successfully",
        reminder
      });
    } catch (error) {
      console.error("Error creating event reminder:", error);
      res.status(500).json({
        message: "Failed to create event reminder",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Obter lembretes de um evento
  app.get("/api/events/:eventId/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user?.id as number;

      // Verificar se o evento existe
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verificar se o usuário tem acesso ao evento
      if (event.createdBy !== userId) {
        // Verificar se é um evento compartilhado
        const eventShares = await storage.getEventShares(eventId);
        const userShare = eventShares.find(share => share.userId === userId);
        
        if (!userShare) {
          return res.status(403).json({
            message: "You don't have permission to view reminders for this event"
          });
        }
      }

      // Obter lembretes do evento (filtrando pelo usuário atual)
      const reminders = await storage.getEventReminders(eventId);
      const userReminders = reminders.filter(r => r.userId === userId);
      
      res.status(200).json(userReminders);
    } catch (error) {
      console.error("Error fetching event reminders:", error);
      res.status(500).json({
        message: "Failed to fetch event reminders",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Excluir um lembrete de evento
  app.delete("/api/events/reminders/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const reminderId = parseInt(req.params.id);
      const userId = req.user?.id as number;

      // Obter lembretes do usuário para verificar autorização
      const userReminders = await storage.getUserEventReminders(userId);
      const reminder = userReminders.find(r => r.id === reminderId);
      
      if (!reminder) {
        return res.status(404).json({
          message: "Reminder not found or you don't have permission to delete it"
        });
      }

      // Excluir o lembrete
      await storage.deleteEventReminder(reminderId);
      
      res.status(200).json({
        message: "Reminder deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting event reminder:", error);
      res.status(500).json({
        message: "Failed to delete event reminder",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ===== Rotas para lembretes de tarefas =====

  // Adicionar um novo lembrete para uma tarefa
  app.post("/api/tasks/:taskId/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const taskId = parseInt(req.params.taskId);
      const userId = req.user?.id as number;

      // Verificar se a tarefa existe
      const task = await storage.getHouseholdTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verificar se o usuário tem acesso à tarefa
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        return res.status(403).json({
          message: "You don't have permission to add reminders to this task"
        });
      }

      // Validar os dados do lembrete
      const reminderData = {
        ...req.body,
        taskId,
        userId
      };

      const validationResult = insertTaskReminderSchema.safeParse(reminderData);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid reminder data",
          errors: validationResult.error.format()
        });
      }

      // Criar o lembrete
      const reminder = await storage.createTaskReminder(validationResult.data);
      
      res.status(201).json({
        message: "Reminder created successfully",
        reminder
      });
    } catch (error) {
      console.error("Error creating task reminder:", error);
      res.status(500).json({
        message: "Failed to create task reminder",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Obter lembretes de uma tarefa
  app.get("/api/tasks/:taskId/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const taskId = parseInt(req.params.taskId);
      const userId = req.user?.id as number;

      // Verificar se a tarefa existe
      const task = await storage.getHouseholdTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verificar se o usuário tem acesso à tarefa
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        return res.status(403).json({
          message: "You don't have permission to view reminders for this task"
        });
      }

      // Obter lembretes da tarefa (filtrando pelo usuário atual)
      const reminders = await storage.getTaskReminders(taskId);
      const userReminders = reminders.filter(r => r.userId === userId);
      
      res.status(200).json(userReminders);
    } catch (error) {
      console.error("Error fetching task reminders:", error);
      res.status(500).json({
        message: "Failed to fetch task reminders",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Excluir um lembrete de tarefa
  app.delete("/api/tasks/reminders/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const reminderId = parseInt(req.params.id);
      const userId = req.user?.id as number;

      // Obter lembretes do usuário para verificar autorização
      const userReminders = await storage.getUserTaskReminders(userId);
      const reminder = userReminders.find(r => r.id === reminderId);
      
      if (!reminder) {
        return res.status(404).json({
          message: "Reminder not found or you don't have permission to delete it"
        });
      }

      // Excluir o lembrete
      await storage.deleteTaskReminder(reminderId);
      
      res.status(200).json({
        message: "Reminder deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting task reminder:", error);
      res.status(500).json({
        message: "Failed to delete task reminder",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ===== Rotas gerais para lembretes do usuário =====

  // Obter todos os lembretes do usuário atual
  app.get("/api/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user?.id as number;
      
      // Obter lembretes de eventos e tarefas
      const [eventReminders, taskReminders] = await Promise.all([
        storage.getUserEventReminders(userId),
        storage.getUserTaskReminders(userId)
      ]);
      
      // Converter para um formato comum
      const formattedEventReminders = await Promise.all(
        eventReminders.map(async (reminder) => {
          const event = await storage.getEvent(reminder.eventId);
          return {
            id: reminder.id,
            type: "event",
            referenceId: reminder.eventId,
            title: event?.title || "Evento não encontrado",
            reminderTime: reminder.reminderTime,
            reminderType: reminder.reminderType,
            sent: reminder.sent,
            createdAt: reminder.createdAt
          };
        })
      );
      
      const formattedTaskReminders = await Promise.all(
        taskReminders.map(async (reminder) => {
          const task = await storage.getHouseholdTask(reminder.taskId);
          return {
            id: reminder.id,
            type: "task",
            referenceId: reminder.taskId,
            title: task?.title || "Tarefa não encontrada",
            message: reminder.message,
            reminderTime: reminder.reminderTime,
            reminderType: reminder.reminderType,
            sent: reminder.sent,
            createdAt: reminder.createdAt
          };
        })
      );
      
      // Combinar e ordenar pelos mais próximos primeiro
      const allReminders = [...formattedEventReminders, ...formattedTaskReminders]
        .sort((a, b) => {
          const timeA = a.reminderTime ? new Date(a.reminderTime).getTime() : 0;
          const timeB = b.reminderTime ? new Date(b.reminderTime).getTime() : 0;
          return timeA - timeB;
        });
      
      res.status(200).json(allReminders);
    } catch (error) {
      console.error("Error fetching user reminders:", error);
      res.status(500).json({
        message: "Failed to fetch user reminders",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}