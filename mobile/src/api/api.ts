import { Platform } from "react-native";

// API configuration and methods
const determineApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://192.168.68.108:5000"; // Android emulator
    } else {
      return "http://192.168.68.108:5000"; // iOS simulator
    }
  }

  // Production URL
  return "http://192.168.68.108:5000";
};

export const API_URL = determineApiUrl();
// Generic fetch function with error handling
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API request failed with status ${response.status}`
    );
  }

  return response.json();
}

// Helper functions for common API operations
export const api = {
  // Auth API
  auth: {
    // Get current user
    getMe: () => apiRequest<any>("/api/user"),

    // Login
    login: (username: string, password: string) =>
      apiRequest<any>("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),

    // Register
    register: (userData: any) =>
      apiRequest<any>("/api/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),

    // Complete onboarding
    completeOnboarding: (id: number) =>
      apiRequest<any>("/api/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({ userId: id }),
      }),
    // Logout
    logout: () =>
      apiRequest<void>("/api/logout", {
        method: "POST",
      }),
  },

  // Events API
  events: {
    // Get all events
    getAll: () => apiRequest<any[]>("/api/events"),

    // Get event by ID
    getById: (id: number) => apiRequest<any>(`/api/events/${id}`),

    // Create new event
    create: (eventData: any) =>
      apiRequest<any>("/api/events", {
        method: "POST",
        body: JSON.stringify(eventData),
      }),

    // Update event
    update: (id: number, eventData: any) =>
      apiRequest<any>(`/api/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(eventData),
      }),

    // Delete event
    delete: (id: number) =>
      apiRequest<void>(`/api/events/${id}`, {
        method: "DELETE",
      }),
  },

  // Household tasks API
  tasks: {
    // Get all tasks
    getAll: () => apiRequest<any[]>("/api/tasks"),

    // Get task by ID
    getById: (id: number) => apiRequest<any>(`/api/tasks/${id}`),

    // Create new task
    create: (taskData: any) =>
      apiRequest<any>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(taskData),
      }),

    // Update task
    update: (id: number, taskData: any) =>
      apiRequest<any>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(taskData),
      }),

    // Delete task
    delete: (id: number) =>
      apiRequest<void>(`/api/tasks/${id}`, {
        method: "DELETE",
      }),

    // Mark task as completed
    complete: (id: number, completed: boolean) =>
      apiRequest<any>(`/api/tasks/${id}/complete`, {
        method: "POST",
        body: JSON.stringify({ completed }),
      }),

    // Update task positions
    updatePositions: (taskPositions: { id: number; position: number }[]) =>
      apiRequest<void>("/api/tasks-reorder", {
        method: "POST",
        body: JSON.stringify({ tasks: taskPositions }),
      }),
  },

  // Partner API
  partner: {
    // Invite partner
    invite: (email: string) =>
      apiRequest<any>("/api/partner/invite", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    // Accept partner invitation
    acceptInvite: (token: string) =>
      apiRequest<any>("/api/partner/accept-invite", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
  },

  // Push notifications API
  notifications: {
    // Register device
    registerDevice: (deviceData: any) =>
      apiRequest<any>("/api/push/register-device", {
        method: "POST",
        body: JSON.stringify(deviceData),
      }),

    // Get VAPID key for web push
    getVapidKey: () => apiRequest<string>("/api/push/vapid-key"),
  },
};
