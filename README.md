# Couples Calendar - Web and Mobile App

A collaborative calendar and task management application designed to strengthen couple's communication and task coordination through innovative, interactive features.

## Project Overview

This repository contains both the web application and the React Native mobile app for the Couples Calendar platform.

### Technology Stack

**Web Application:**
- TypeScript
- React Hooks
- Progressive Web App (PWA)
- WebSocket for real-time synchronization
- Push notification infrastructure
- Express backend
- Advanced mobile-first responsive design
- Service worker for offline support

**Mobile Application:**
- React Native
- Expo framework
- React Navigation
- TanStack Query
- Expo secure storage
- Native push notifications

**Shared Backend:**
- Express.js server
- PostgreSQL database with Drizzle ORM
- RESTful API
- WebSocket server
- Authentication system

## Directory Structure

```
.
├── client/                 # Web application frontend
├── server/                 # Express backend
├── shared/                 # Shared code (schemas, types)
├── mobile/                 # React Native mobile app
└── public/                 # Static assets
```

## Setup and Installation

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- PostgreSQL database

### Web Application Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd couples-calendar
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a PostgreSQL database and update the `DATABASE_URL` environment variable.

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The web application will be available at http://localhost:5000.

### Mobile Application Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the Expo development server:
```bash
npm start
# or
yarn start
```

Follow the on-screen instructions to run the app on an iOS simulator, Android emulator, or physical device.

For detailed instructions on mobile setup and integration with the backend, see [mobile/README.md](mobile/README.md) and [mobile/INTEGRATION.md](mobile/INTEGRATION.md).

## Features

- **User Authentication**: Secure login and registration system
- **Calendar Management**: Create, view, and manage calendar events
- **Event Sharing**: Share events with your partner
- **Household Tasks**: Manage and assign household tasks
- **Partner Connection**: Invite and connect with your partner
- **Push Notifications**: Get timely reminders for events and tasks
- **Real-time Updates**: Instant synchronization via WebSockets
- **Offline Support**: Web app functions offline with service worker

## Backend API

The Express backend provides RESTful API endpoints for both the web and mobile applications:

- `/api/auth/*` - Authentication endpoints
- `/api/events/*` - Calendar event management
- `/api/household-tasks/*` - Household task management
- `/api/partner/*` - Partner relationship management
- `/api/push/*` - Push notification management
- `/ws` - WebSocket endpoint for real-time updates

## License

This project is licensed under the MIT License.