# React Native Troubleshooting Guide

This document provides solutions for common issues encountered when running the React Native mobile app.

## "Unsupported top level event type 'topInsetsChange' dispatched" Error

This error is related to the `SafeAreaView` component and insets handling in React Native.

### Solution:

1. Replace `SafeAreaView` components with regular `View` components and manually handle safe areas:

```jsx
// Instead of this:
import { SafeAreaView } from 'react-native-safe-area-context';

return (
  <SafeAreaView style={styles.container}>
    {/* content */}
  </SafeAreaView>
);

// Use this:
import { View, Platform } from 'react-native';

return (
  <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 50 : 30 }]}>
    {/* content */}
  </View>
);
```

2. Update the imports in your app.tsx file to remove the `SafeAreaProvider`:

```jsx
// Instead of this:
import { SafeAreaProvider } from 'react-native-safe-area-context';

// And this:
<SafeAreaProvider>
  {/* app content */}
</SafeAreaProvider>

// Just use regular View:
import { View, StyleSheet } from 'react-native';

// And:
<View style={styles.container}>
  {/* app content */}
</View>
```

## Installation Issues

If you encounter dependency conflicts or installation errors:

1. Clear the npm cache:
```bash
npm cache clean --force
```

2. Remove node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

3. Use a specific version of React and React Native that work well together:
```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.2"
  }
}
```

## Expo Development Server Issues

If the Expo development server is not working properly:

1. Clear Expo's cache:
```bash
expo start -c
```

2. Restart with a clean slate:
```bash
expo start --no-dev --minify
```

## Metro Bundler Errors

If you encounter issues with the Metro bundler:

1. Reset Metro's cache:
```bash
npx react-native start --reset-cache
```

2. Check for conflicting versions in your package.json and make sure all React Native packages have compatible versions.

## API Connection Issues

If your app cannot connect to the backend API:

1. Verify the correct API URL based on platform:
```js
const API_URL = Platform.select({
  android: 'http://10.0.2.2:5000', // For Android emulator
  ios: 'http://localhost:5000',    // For iOS simulator
  default: 'http://localhost:5000',
});
```

2. For physical devices, use your computer's local IP address:
```js
const API_URL = 'http://192.168.1.X:5000'; // Replace X with your IP
```

3. Ensure your backend allows CORS requests from your app.

## iOS-Specific Issues

1. For Cocoapods errors, try:
```bash
cd ios
pod install --repo-update
```

2. For iOS simulator issues:
```bash
npx react-native run-ios --simulator="iPhone 14"
```

## Android-Specific Issues

1. For Gradle errors, try:
```bash
cd android
./gradlew clean
```

2. For Android emulator issues:
```bash
npx react-native run-android --variant=debug
```

## Performance Issues

If your app is running slowly:

1. Use the React Native Performance Monitor:
```bash
npx react-native-performance-monitor
```

2. Reduce unnecessary re-renders by using React.memo and useCallback.

3. Optimize image loading with the `react-native-fast-image` package.

## Debugging Tips

1. Use React Native Debugger for a better debugging experience:
```bash
brew install --cask react-native-debugger  # macOS
```

2. For network debugging, use Flipper:
```bash
brew install --cask flipper  # macOS
```

3. Console logs can be viewed with:
```bash
npx react-native log-ios
npx react-native log-android
```