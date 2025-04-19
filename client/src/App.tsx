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
import { AuthProvider, useAuth } from "@/hooks/use-auth";

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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
