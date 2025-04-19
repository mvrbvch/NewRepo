import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import OnboardingPage from "@/pages/onboarding-page";
import PartnerInvitePage from "@/pages/partner-invite-page";
import HouseholdTasksPage from "@/pages/household-tasks-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

// Versão simplificada para evitar problemas de hooks
function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} />
      <ProtectedRoute path="/invite-partner" component={PartnerInvitePage} />
      <ProtectedRoute path="/tasks" component={HouseholdTasksPage} />
      <Route path="/accept-invite/:token" component={PartnerInvitePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Versão simplificada do App para resolver problemas de hooks
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
