import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { storage } from '../storage';
import { sendPushToUser } from '../pushNotifications';

// Mock the storage and push notification modules
vi.mock('../storage', () => ({
  storage: {
    createNotification: vi.fn().mockResolvedValue({ id: 1 }),
    getUser: vi.fn().mockImplementation((id) => {
      if (id === 1) {
        return Promise.resolve({
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          username: 'user1',
          password: 'password',
          partnerId: 2,
          partnerStatus: 'connected',
          onboardingComplete: true,
          phoneNumber: null
        });
      } else if (id === 2) {
        return Promise.resolve({
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          username: 'user2',
          password: 'password',
          partnerId: 1,
          partnerStatus: 'connected',
          onboardingComplete: true,
          phoneNumber: null
        });
      }
      return Promise.resolve(null);
    }),
    getUserDevices: vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        deviceToken: 'device-token-1',
        deviceType: 'web',
        deviceName: 'Chrome',
        pushEnabled: true,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ]),
    createHouseholdTask: vi.fn().mockImplementation((task) => {
      return Promise.resolve({
        id: 1,
        ...task,
        createdAt: new Date().toISOString()
      });
    }),
    updateHouseholdTask: vi.fn().mockImplementation((id, updates) => {
      return Promise.resolve({
        id,
        ...updates,
        createdAt: new Date().toISOString()
      });
    }),
    getHouseholdTask: vi.fn().mockResolvedValue({
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      frequency: 'once',
      assignedTo: 2,
      createdBy: 1,
      dueDate: new Date().toISOString(),
      completed: false,
      nextDueDate: null,
      recurrenceRule: null,
      createdAt: new Date().toISOString()
    }),
    markHouseholdTaskAsCompleted: vi.fn().mockImplementation((id, completed) => {
      return Promise.resolve({
        id,
        title: 'Test Task',
        description: 'Test Description',
        frequency: 'once',
        assignedTo: 2,
        createdBy: 1,
        dueDate: new Date().toISOString(),
        completed,
        nextDueDate: null,
        recurrenceRule: null,
        createdAt: new Date().toISOString()
      });
    }),
    createEvent: vi.fn().mockImplementation((event) => {
      return Promise.resolve({
        id: 1,
        ...event,
        date: new Date().toISOString()
      });
    }),
    shareEvent: vi.fn().mockResolvedValue({ id: 1, eventId: 1, userId: 2, permission: 'view' }),
    getEventShares: vi.fn().mockResolvedValue([
      { id: 1, eventId: 1, userId: 2, permission: 'view' }
    ]),
    updateEvent: vi.fn().mockImplementation((id, updates) => {
      return Promise.resolve({
        id,
        ...updates,
        date: new Date().toISOString()
      });
    }),
    getEvent: vi.fn().mockResolvedValue({
      id: 1,
      title: 'Test Event',
      description: 'Test Description',
      date: new Date().toISOString(),
      startTime: '10:00',
      endTime: '11:00',
      location: 'Test Location',
      emoji: '🎉',
      period: 'morning',
      recurrence: 'never',
      recurrenceEnd: null,
      recurrenceRule: null,
      createdBy: 1
    }),
    addEventComment: vi.fn().mockImplementation((comment) => {
      return Promise.resolve({
        id: 1,
        ...comment,
        createdAt: new Date().toISOString()
      });
    })
  }
}));

vi.mock('../pushNotifications', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(1),
  PushNotificationPayload: {}
}));

describe('Push Notifications for Tasks and Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Task Notifications', () => {
    it('should send push notification when a task is assigned to another user', async () => {
      // Mock task data
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        frequency: 'once',
        assignedTo: 2, // Assigned to User 2
        createdBy: 1, // Created by User 1
        dueDate: new Date()
      };

      // Create a task
      const task = await storage.createHouseholdTask(taskData);

      // Verify that sendPushToUser was called
      expect(sendPushToUser).toHaveBeenCalledTimes(1);
      expect(sendPushToUser).toHaveBeenCalledWith(2, expect.objectContaining({
        title: expect.stringContaining('Nova tarefa'),
        body: expect.stringContaining('atribuiu uma nova tarefa'),
        referenceType: 'task',
        referenceId: task.id
      }));

      // Verify that createNotification was called
      expect(storage.createNotification).toHaveBeenCalledTimes(1);
      expect(storage.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 2,
        type: 'task',
        referenceType: 'task',
        referenceId: task.id
      }));
    });

    it('should send push notification when a task is updated', async () => {
      // Mock task update
      const taskId = 1;
      const updates = {
        title: 'Updated Task',
        description: 'Updated Description'
      };

      // Update a task
      const updatedTask = await storage.updateHouseholdTask(taskId, updates);

      // Verify that sendPushToUser was called
      expect(sendPushToUser).toHaveBeenCalledTimes(1);
      expect(sendPushToUser).toHaveBeenCalledWith(2, expect.objectContaining({
        title: expect.stringContaining('Tarefa atualizada'),
        referenceType: 'task',
        referenceId: updatedTask.id
      }));

      // Verify that createNotification was called
      expect(storage.createNotification).toHaveBeenCalledTimes(1);
    });

    it('should send push notification when a task is marked as completed', async () => {
      // Mark a task as completed
      const taskId = 1;
      const completed = true;
      const updatedTask = await storage.markHouseholdTaskAsCompleted(taskId, completed);

      // Verify that sendPushToUser was called
      expect(sendPushToUser).toHaveBeenCalledTimes(1);
      expect(sendPushToUser).toHaveBeenCalledWith(1, expect.objectContaining({
        title: expect.stringContaining('Tarefa concluída'),
        referenceType: 'task',
        referenceId: updatedTask.id
      }));

      // Verify that createNotification was called
      expect(storage.createNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Notifications', () => {
    it('should send push notification when an event is shared with a partner', async () => {
      // Mock event data
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        location: 'Test Location',
        emoji: '🎉',
        period: 'morning',
        createdBy: 1,
        shareWithPartner: true
      };

      // Create an event
      const event = await storage.createEvent(eventData);
      await storage.shareEvent({
        eventId: event.id,
        userId: 2,
        permission: 'view'
      });

      // Verify that sendPushToUser was called
      expect(sendPushToUser).toHaveBeenCalledTimes(1);
      expect(sendPushToUser).toHaveBeenCalledWith(2, expect.objectContaining({
        title: expect.stringContaining('Novo evento'),
        referenceType: 'event',
        referenceId: event.id
      }));

      // Verify that createNotification was called
      expect(storage.createNotification).toHaveBeenCalledTimes(1);
    });

    it('should send push notification when an event is updated', async () => {
      // Mock event update
      const eventId = 1;
      const updates = {
        title: 'Updated Event',
        description: 'Updated Description'
      };

      // Update an event
      const updatedEvent = await storage.updateEvent(eventId, updates);

      // Verify that sendPushToUser was called
      expect(sendPushToUser).toHaveBeenCalledTimes(1);
      expect(sendPushToUser).toHaveBeenCalledWith(2, expect.objectContaining({
        title: expect.stringContaining('Evento atualizado'),
        referenceType: 'event',
        referenceId: updatedEvent.id
      }));

      // Verify that createNotification was called
      expect(storage.createNotification).toHaveBeenCalledTimes(1);
    });

    it('should send push notification when a comment is added to an event', async () => {
      // Add a comment to an event
      const eventId = 1;
      const userId = 2;
      const content = 'Test Comment';
      const comment = await storage.addEventComment({
        eventId,
        userId,
        content
      });

      // Verify that sendPushToUser was called
      expect(sendPushToUser).toHaveBeenCalledTimes(1);
      expect(sendPushToUser).toHaveBeenCalledWith(1, expect.objectContaining({
        title: expect.stringContaining('Novo comentário'),
        referenceType: 'event',
        referenceId: eventId
      }));

      // Verify that createNotification was called
      expect(storage.createNotification).toHaveBeenCalledTimes(1);
    });
  });
});