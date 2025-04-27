import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Ícones
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Telas
import HomeScreen from "../screens/HomeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import TasksScreen from "../screens/TasksScreen";
import LoginScreen from "../screens/LoginScreen";

// Tema
import { COLORS, SIZES } from "../constants/theme";
import { Text } from "../components/ui";
import { AuthProvider } from "@hooks/useAuth";

// Tipos para navegação
type BottomTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Tasks: undefined;
  Profile: undefined;
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Constantes
const Tab = createBottomTabNavigator<BottomTabParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Componente para o botão de adicionar (FAB)
const AddButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.fabContainer} onPress={onPress}>
      <View style={styles.fab}>
        <Icon name="plus" size={24} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );
};

// Configuração da navegação por Tab
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray600,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        tabBarStyle: {
          height: 60,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray200,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Início",
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" size={size} color={color} />
          ),
        }}
      />
      {/* Tab placeholder para o botão de adicionar */}
      <Tab.Screen
        name="AddAction"
        component={View}
        options={{
          tabBarLabel: "",
          tabBarButton: () => (
            <AddButton onPress={() => console.log("Adicionar novo item")} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Previne a navegação padrão
            e.preventDefault();
          },
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: "Tarefas",
          tabBarIcon: ({ color, size }) => (
            <Icon name="checkbox-marked-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={View} // Placeholder para uma futura tela de perfil
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Configuração da navegação de autenticação
const AuthNavigator = () => {
  return (
    <AuthProvider>
      <AuthStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <AuthStack.Screen name="Login" component={LoginScreen} />
        {/* Outras telas de autenticação podem ser adicionadas aqui */}
      </AuthStack.Navigator>
    </AuthProvider>
  );
};

// Navegador principal
const AppNavigator = () => {
  const isAuthenticated = false; // Na implementação real, verificaria se o usuário está autenticado

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={TabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Estilos
const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: -30,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AppNavigator;
