# Couples Calendar Mobile App

A React Native mobile application for the Couples Calendar platform, designed to strengthen couples' communication and task coordination through collaborative calendar and task management.

## Features

- **User Authentication**: Secure login and registration system
- **Calendar Management**: View and manage shared calendar events
- **Task Management**: Organize and track household tasks
- **Partner Connection**: Invite and connect with your partner
- **Profile Management**: Update personal information and preferences
- **Push Notifications**: Get timely reminders for events and tasks

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac users) or Android Studio with a configured emulator
- Expo Go app installed on your physical device (for testing)

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd couples-calendar/mobile
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Configure the backend API URL**

Open `src/api/api.ts` and update the `API_URL` constant to point to your backend server:

```javascript
const API_URL = 'http://your-backend-url:5000';
```

For local development using an emulator/simulator:
- iOS simulator: `http://localhost:5000`
- Android emulator: `http://10.0.2.2:5000`
- Expo Go on physical device: `http://your-computer-ip:5000`

## Running the Application

1. **Start the development server**

```bash
npm start
# or
yarn start
```

2. **Run on a specific platform**

```bash
# For iOS
npm run ios
# or
yarn ios

# For Android
npm run android
# or
yarn android
```

3. **Testing on a physical device**

- Open the Expo Go app on your device
- Scan the QR code displayed in the terminal or browser

## Project Structure

```
mobile/
├── assets/              # Static assets like images and fonts
├── src/
│   ├── api/             # API service functions
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # Screen components
│   └── utils/           # Utility functions
├── App.tsx              # Main application component
├── app.json             # Expo configuration
├── babel.config.js      # Babel configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Connecting to the Backend

The mobile app connects to the same Express backend as the web application. Make sure the backend server is running and accessible from your device or emulator.

## Building for Production

To create a production build for distribution:

```bash
expo build:android  # For Android APK or AAB
expo build:ios      # For iOS IPA
```

This will start the build process on Expo's servers and provide you with download links when complete.

## Troubleshooting

- **API Connection Issues**: Ensure you've set the correct `API_URL` in `src/api/api.ts`
- **Expo Build Errors**: Check the Expo documentation and forums for specific error messages
- **React Native Errors**: Refer to the React Native documentation or Stack Overflow

## License

This project is licensed under the MIT License.