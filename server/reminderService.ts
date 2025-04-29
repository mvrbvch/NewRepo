import { IStorage } from "./storage";
import { EventReminder, TaskReminder } from "@shared/schema";
import { sendEmail } from "./email";
import { sendPushToUser } from "./pushNotifications";
import { formatDateSafely } from "./utils";

/**
 * Serviço para gerenciar e processar lembretes
 */
export class ReminderService {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs = 60000; // Verificar a cada minuto

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Inicia o serviço de lembretes, verificando periodicamente por novos lembretes
   */
  public start(): void {
    if (this.intervalId) {
      console.log("Serviço de lembretes já está em execução");
      return;
    }

    console.log("Iniciando serviço de lembretes...");
    this.intervalId = setInterval(
      () => this.processReminders(),
      this.checkIntervalMs
    );
    
    // Processar imediatamente ao iniciar
    this.processReminders();
  }

  /**
   * Para o serviço de lembretes
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Serviço de lembretes parado");
    }
  }

  /**
   * Processa todos os lembretes pendentes
   */
  private async processReminders(): Promise<void> {
    try {
      await Promise.all([
        this.processEventReminders(),
        this.processTaskReminders(),
      ]);
    } catch (error) {
      console.error("Erro ao processar lembretes:", error);
    }
  }

  /**
   * Processa lembretes de eventos
   */
  private async processEventReminders(): Promise<void> {
    const pendingReminders = await this.storage.getPendingEventReminders();
    
    if (pendingReminders.length > 0) {
      console.log(`Processando ${pendingReminders.length} lembretes de eventos pendentes`);
      
      for (const reminder of pendingReminders) {
        await this.sendEventReminder(reminder);
      }
    }
  }
  
  /**
   * Processa lembretes de tarefas
   */
  private async processTaskReminders(): Promise<void> {
    const pendingReminders = await this.storage.getPendingTaskReminders();
    
    if (pendingReminders.length > 0) {
      console.log(`Processando ${pendingReminders.length} lembretes de tarefas pendentes`);
      
      for (const reminder of pendingReminders) {
        await this.sendTaskReminder(reminder);
      }
    }
  }

  /**
   * Envia um lembrete de evento
   */
  private async sendEventReminder(reminder: EventReminder): Promise<boolean> {
    try {
      // Obter detalhes do evento e do usuário
      const event = await this.storage.getEvent(reminder.eventId);
      const user = await this.storage.getUser(reminder.userId);
      
      if (!event || !user) {
        console.error(
          `Não foi possível enviar lembrete: Evento (${reminder.eventId}) ou Usuário (${reminder.userId}) não encontrado`
        );
        return false;
      }
      
      const formattedDate = formatDateSafely(
        event.date instanceof Date ? event.date : new Date(event.date)
      );
      
      // Configurar conteúdo do lembrete
      const subject = `Lembrete: ${event.title} - ${formattedDate}`;
      const message = `
        <h2>Lembrete de evento</h2>
        <p>Olá ${user.name},</p>
        <p>Este é um lembrete para o evento <strong>${event.title}</strong> em ${formattedDate} às ${event.startTime}.</p>
        ${event.location ? `<p>Local: ${event.location}</p>` : ''}
        ${event.description ? `<p>Descrição: ${event.description}</p>` : ''}
        <p>Tenha um ótimo dia!</p>
      `;
      
      let sent = false;
      
      // Enviar notificação conforme o tipo de lembrete
      if (reminder.reminderType === "email") {
        // Enviar e-mail
        sent = await sendEmail({
          to: user.email,
          from: "notifications@couplesapp.com",
          subject: subject,
          html: message,
        });
      } else if (reminder.reminderType === "push") {
        // Usar a função sendPushToUser para enviar para todos os dispositivos do usuário
        const successCount = await sendPushToUser(user.id, {
          title: subject,
          body: `${event.title} - ${formattedDate} às ${event.startTime}`,
          data: {
            type: "event",
            eventId: event.id.toString(),
            url: `/event/${event.id}`
          },
          referenceType: "event",
          referenceId: event.id
        });
        
        sent = successCount > 0;
        console.log(`Notificação push enviada para ${successCount} dispositivo(s) do usuário ${user.id}`);
      }
      
      // Criar notificação in-app
      await this.storage.createNotification({
        userId: user.id,
        title: subject,
        message: `${event.title} - ${formattedDate} às ${event.startTime}`,
        type: "reminder",
        referenceType: "event",
        referenceId: event.id,
        isRead: false,
      });
      
      // Atualizar status do lembrete
      await this.storage.markEventReminderAsSent(reminder.id);
      
      return sent;
    } catch (error) {
      console.error("Erro ao enviar lembrete de evento:", error);
      return false;
    }
  }

  /**
   * Envia um lembrete de tarefa
   */
  private async sendTaskReminder(reminder: TaskReminder): Promise<boolean> {
    try {
      // Obter detalhes da tarefa e do usuário
      const task = await this.storage.getHouseholdTask(reminder.taskId);
      const user = await this.storage.getUser(reminder.userId);
      
      if (!task || !user) {
        console.error(
          `Não foi possível enviar lembrete: Tarefa (${reminder.taskId}) ou Usuário (${reminder.userId}) não encontrado`
        );
        return false;
      }
      
      // Verificar se há data de vencimento
      let dueDateMessage = "";
      if (task.dueDate) {
        const dueDate = task.dueDate instanceof Date 
          ? task.dueDate 
          : new Date(task.dueDate);
        dueDateMessage = ` (Vence em ${formatDateSafely(dueDate)})`;
      }
      
      // Configurar conteúdo do lembrete
      const subject = `Lembrete de tarefa: ${task.title}${dueDateMessage}`;
      const message = reminder.message 
        ? reminder.message 
        : `
          <h2>Lembrete de tarefa</h2>
          <p>Olá ${user.name},</p>
          <p>Este é um lembrete para a tarefa <strong>${task.title}</strong>${dueDateMessage}.</p>
          ${task.description ? `<p>Descrição: ${task.description}</p>` : ''}
          <p>Não se esqueça de marcá-la como concluída quando terminar!</p>
        `;
      
      let sent = false;
      
      // Enviar notificação conforme o tipo de lembrete
      if (reminder.reminderType === "email") {
        // Enviar e-mail
        sent = await sendEmail({
          to: user.email,
          from: "notifications@couplesapp.com",
          subject: subject,
          html: message,
        });
      } else if (reminder.reminderType === "push") {
        // Usar a função sendPushToUser para enviar para todos os dispositivos do usuário
        const successCount = await sendPushToUser(user.id, {
          title: subject,
          body: task.title + dueDateMessage,
          data: {
            type: "task",
            taskId: task.id.toString(),
            url: `/household-tasks?task=${task.id}`
          },
          referenceType: "task",
          referenceId: task.id
        });
        
        sent = successCount > 0;
        console.log(`Notificação push enviada para ${successCount} dispositivo(s) do usuário ${user.id}`);
      }
      
      // Criar notificação in-app
      await this.storage.createNotification({
        userId: user.id,
        title: subject,
        message: task.title + dueDateMessage,
        type: "reminder",
        referenceType: "task",
        referenceId: task.id,
        isRead: false,
      });
      
      // Atualizar status do lembrete
      await this.storage.markTaskReminderAsSent(reminder.id);
      
      return sent;
    } catch (error) {
      console.error("Erro ao enviar lembrete de tarefa:", error);
      return false;
    }
  }
}