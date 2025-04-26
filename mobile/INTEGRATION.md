# Integrating React Native App with Existing Backend

This document provides detailed instructions on integrating the React Native mobile app with the existing Express backend.

## Overview

The mobile app uses the same API endpoints as the web application, but requires some adjustments to handle cross-platform authentication and API communication.

## Backend Adjustments

1. **Enable CORS for Mobile Devices**

Ensure your backend allows requests from mobile clients by updating the CORS configuration in `server/index.ts`:

```typescript
import cors from 'cors';

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    // Add additional origins as needed for mobile development
    'exp://*',  // For Expo development
  ],
  credentials: true
}));
```

2. **Authentication Session Handling**

Since mobile apps can't easily use cookie-based authentication due to different storage contexts, you have two options:

### Option A: Token-based Authentication (Recommended for Production)

Modify the authentication system to support token-based authentication:

1. Update the authentication routes in `server/routes.ts` to issue tokens:

```typescript
app.post('/api/auth/login', async (req, res) => {
  // ... existing login logic
  
  // Generate JWT token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
  
  // Return user info and token
  res.json({
    user,
    token
  });
});
```

2. Create a middleware to verify tokens:

```typescript
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### Option B: Use the Existing Cookie-based Authentication (for Development)

During development, you can use the existing cookie-based authentication by configuring the fetch API in the mobile app to include credentials:

```typescript
// In mobile/src/api/api.ts
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

  // ... rest of the function
}
```

## Mobile App API Integration

1. **Connection URL Configuration**

For development, set the correct API URL in `mobile/src/api/api.ts`:

- For iOS simulator: `http://localhost:5000`
- For Android emulator: `http://10.0.2.2:5000`
- For physical devices during development: `http://YOUR_COMPUTER_IP:5000`

Example implementation:

```typescript
// Choose the correct API URL based on platform and environment
const determineApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000'; // Android emulator
    } else {
      return 'http://localhost:5000'; // iOS simulator
    }
  }
  
  // Production URL
  return 'https://your-production-api.com';
};

export const API_URL = determineApiUrl();
```

2. **Token Storage**

For token-based authentication, use secure storage to persist tokens:

```typescript
import * as SecureStore from 'expo-secure-store';

// Save token
export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync('auth_token', token);
};

// Get token
export const getToken = async () => {
  return await SecureStore.getItemAsync('auth_token');
};

// Delete token
export const removeToken = async () => {
  await SecureStore.deleteItemAsync('auth_token');
};
```

3. **Token Usage in API Requests**

Update the API request function to include the token in headers:

```typescript
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  // Get token from secure storage
  const token = await getToken();
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  // ... rest of the function
}
```

## UI and Component Considerations

1. **SafeAreaView Replacement**

To avoid issues with the "topInsetsChange" error in React Native, we've replaced SafeAreaView components with regular Views with manual padding:

```typescript
// Instead of using SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';

return (
  <SafeAreaView style={styles.container}>
    {/* content */}
  </SafeAreaView>
);

// Use this pattern instead
import { View, Platform } from 'react-native';

return (
  <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 50 : 30 }]}>
    {/* content */}
  </View>
);
```

This approach provides more consistent behavior across different React Native environments and avoids issues with native modules that might not be properly linked.

2. **Cross-Platform Styling**

Ensure your styles are compatible with both platforms by using platform-specific code where needed:

```typescript
const styles = StyleSheet.create({
  button: {
    elevation: Platform.OS === 'android' ? 4 : 0, // Android shadow
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Common styles
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 12,
  }
});
```

## WebSocket Integration

If your app uses WebSockets for real-time features:

1. Update the WebSocket connection in `mobile/src/hooks/useWebSocket.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { API_URL } from '../api/api';
import { getToken } from '../utils/auth';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const connectWebSocket = async () => {
      // Get the base URL without the http:// or https:// prefix
      const baseUrl = API_URL.replace(/^https?:\/\//, '');
      const protocol = API_URL.startsWith('https') ? 'wss' : 'ws';
      
      // Get authentication token
      const token = await getToken();
      
      // Connect to WebSocket with the token
      const ws = new WebSocket(`${protocol}://${baseUrl}/ws?token=${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  // Function to send messages
  const sendMessage = (message: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message));
    }
  };
  
  return { isConnected, sendMessage, ws: wsRef.current };
};
```

## Push Notifications

For push notifications, use the Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNs) for iOS:

1. Install the required packages:

```bash
expo install expo-notifications
expo install expo-device
```

2. Create a notification hook:

```typescript
// mobile/src/hooks/useNotifications.ts
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../api/api';

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) {
        // Register the token with your backend
        api.notifications.registerDevice({
          deviceToken: token,
          deviceType: Platform.OS,
          deviceName: Device.modelName || 'Unknown Device',
          pushEnabled: true,
        });
      }
    });

    // Set up notification handlers
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Add notification received listener
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Add notification response listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      // Handle notification response (e.g., navigate to specific screen)
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!);
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  return { expoPushToken, notification };
};

// Function to register for push notifications
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    // For Expo projects
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}
```

## Deployment Considerations

1. **API URL Configuration**

Update the API URL in production builds to point to your production backend:

```typescript
const API_URL = __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://your-production-api.com';
```

2. **Expo Build Configuration**

Ensure your `app.json` is properly configured for building:

```json
{
  "expo": {
    "name": "Couples Calendar",
    "slug": "couples-calendar",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.couplescalendar"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.couplescalendar"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```