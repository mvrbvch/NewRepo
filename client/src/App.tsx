import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import OnboardingPage from "@/pages/onboarding-page";
import PartnerInvitePage from "@/pages/partner-invite-page";
import HouseholdTasksPage from "@/pages/household-tasks-page";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createContext, useState, useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { UserType } from "@/lib/types";

// Versão simplificada do AuthContext
export const AuthContext = createContext<any>(null);

// Versão simplificada do AuthProvider
function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const { 
    data: user,
    isLoading 
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        return await res.json();
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: {username: string, password: string}) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
    }
  });

  return (
    <AuthContext.Provider value={{ 
      user,
      isLoading,
      error: null,
      loginMutation,
      registerMutation,
      logoutMutation
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Versão simplificada do hook useAuth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Versão simplificada do ProtectedRoute
function SimpleProtectedRoute({ path, component: Component }: { path: string; component: () => React.JSX.Element }) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div>Carregando...</div>
      ) : user ? (
        <Component />
      ) : (
        <AuthPage />
      )}
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <SimpleProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <SimpleProtectedRoute path="/onboarding" component={OnboardingPage} />
      <SimpleProtectedRoute path="/invite-partner" component={PartnerInvitePage} />
      <SimpleProtectedRoute path="/tasks" component={HouseholdTasksPage} />
      <Route path="/accept-invite/:token" component={PartnerInvitePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SimpleAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
