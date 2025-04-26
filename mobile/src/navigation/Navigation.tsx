import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import TasksScreen from '../screens/TasksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PartnerInviteScreen from '../screens/PartnerInviteScreen';

// Define navigation types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  AcceptInvite: { token?: string };
};

export type MainStackParamList = {
  Main: undefined;
  Onboarding: undefined;
  PartnerInvite: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Tasks: undefined;
  Profile: undefined;
};

// Create navigation stacks
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Auth navigator for unauthenticated users
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="AcceptInvite" component={PartnerInviteScreen} />
    </AuthStack.Navigator>
  );
}

// Tab navigator for authenticated users
function MainTabNavigator() {
  return (
    <MainTab.Navigator screenOptions={{ headerShown: false }}>
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <MainTab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{
          tabBarLabel: 'Calendar',
        }}
      />
      <MainTab.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{
          tabBarLabel: 'Tasks',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </MainTab.Navigator>
  );
}

// Main navigator that handles auth state
export default function Navigation() {
  const { isSignedIn, user } = useAuth();
  
  // Show loading screen if auth state is being determined
  if (!isSignedIn) {
    return <AuthNavigator />;
  }

  // Check if onboarding is complete
  const onboardingComplete = user?.onboardingComplete;

  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingComplete ? (
        <MainStack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <MainStack.Screen name="Main" component={MainTabNavigator} />
      )}
      <MainStack.Screen name="PartnerInvite" component={PartnerInviteScreen} />
    </MainStack.Navigator>
  );
}