// API configuration and methods
const API_URL = 'http://localhost:5000';

// Generic fetch function with error handling
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
    getMe: () => apiRequest<any>('/api/auth/me'),
    
    // Login
    login: (username: string, password: string) => 
      apiRequest<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    
    // Register
    register: (userData: any) => 
      apiRequest<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    // Logout
    logout: () => 
      apiRequest<void>('/api/auth/logout', {
        method: 'POST',
      }),
  },
  
  // Events API
  events: {
    // Get all events
    getAll: () => apiRequest<any[]>('/api/events'),
    
    // Get event by ID
    getById: (id: number) => apiRequest<any>(`/api/events/${id}`),
    
    // Create new event
    create: (eventData: any) => 
      apiRequest<any>('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    
    // Update event
    update: (id: number, eventData: any) => 
      apiRequest<any>(`/api/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(eventData),
      }),
    
    // Delete event
    delete: (id: number) => 
      apiRequest<void>(`/api/events/${id}`, {
        method: 'DELETE',
      }),
  },
  
  // Household tasks API
  tasks: {
    // Get all tasks
    getAll: () => apiRequest<any[]>('/api/household-tasks'),
    
    // Get task by ID
    getById: (id: number) => apiRequest<any>(`/api/household-tasks/${id}`),
    
    // Create new task
    create: (taskData: any) => 
      apiRequest<any>('/api/household-tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),
    
    // Update task
    update: (id: number, taskData: any) => 
      apiRequest<any>(`/api/household-tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(taskData),
      }),
    
    // Delete task
    delete: (id: number) => 
      apiRequest<void>(`/api/household-tasks/${id}`, {
        method: 'DELETE',
      }),
    
    // Mark task as completed
    complete: (id: number, completed: boolean) => 
      apiRequest<any>(`/api/household-tasks/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ completed }),
      }),
    
    // Update task positions
    updatePositions: (taskPositions: { id: number; position: number }[]) => 
      apiRequest<void>('/api/household-tasks/positions', {
        method: 'POST',
        body: JSON.stringify({ tasks: taskPositions }),
      }),
  },
  
  // Partner API
  partner: {
    // Invite partner
    invite: (email: string) => 
      apiRequest<any>('/api/partner/invite', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    
    // Accept partner invitation
    acceptInvite: (token: string) => 
      apiRequest<any>('/api/partner/accept-invite', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },
  
  // Push notifications API
  notifications: {
    // Register device
    registerDevice: (deviceData: any) => 
      apiRequest<any>('/api/push/register-device', {
        method: 'POST',
        body: JSON.stringify(deviceData),
      }),
    
    // Get VAPID key for web push
    getVapidKey: () => apiRequest<string>('/api/push/vapid-key'),
  },
};