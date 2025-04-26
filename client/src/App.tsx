import * as React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "./pages/not-found";
import HomePage from "./pages/home-page";
import AuthPage from "./pages/auth-page";
import OnboardingPage from "./pages/onboarding-page";
import PartnerInvitePage from "./pages/partner-invite-page";
import HouseholdTasksPage from "./pages/household-tasks-page";
import HouseholdTasksPageSimple from "./pages/household-tasks-page-simple";
import LandingPage from "./pages/landing-page";
import WelcomePage from "./pages/welcome-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { PushNotificationsProvider } from "./hooks/use-push-notifications";
import NotificationSettingsPage from "./pages/notification-settings-page";
import {
  SplashScreenProvider,
  SplashScreenContext,
} from "./hooks/use-splash-screen";
import { SplashScreen } from "./components/pwa/splash-screen";

function Router() {
  return (
    <Switch>
      {/* Landing page pública */}
      <Route path="/landing" component={LandingPage} />
      
      {/* Rota principal protegida */}
      <ProtectedRoute path="/" component={HomePage} />
      
      {/* Rotas de autenticação */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/accept-invite/:token" component={PartnerInvitePage} />
      
      {/* Experiência de onboarding e boas-vindas */}
      <ProtectedRoute path="/onboarding" component={OnboardingPage} />
      <ProtectedRoute path="/welcome" component={WelcomePage} />
      
      {/* Outras rotas protegidas */}
      <ProtectedRoute path="/invite-partner" component={PartnerInvitePage} />
      <ProtectedRoute
        path="/notifications"
        component={NotificationSettingsPage}
      />
      <ProtectedRoute path="/tasks" component={HouseholdTasksPage} />
      <ProtectedRoute
        path="/tasks/reorder"
        component={HouseholdTasksPageSimple}
      />
      
      {/* Rota de não encontrado */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // Use the splash screen context
  const { isLoading, setIsLoading } = React.useContext(SplashScreenContext);

  // Handle splash screen finish
  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && <SplashScreen onFinished={handleSplashFinish} />}
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SplashScreenProvider>
        <AuthProvider>
          <PushNotificationsProvider>
            <AppContent />
          </PushNotificationsProvider>
        </AuthProvider>
      </SplashScreenProvider>
    </QueryClientProvider>
  );
}

export default App;
