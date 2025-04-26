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
import HouseholdTasksPage from "./pages/household-tasks-page-drag";
import HouseholdTasksPageSimple from "./pages/household-tasks-page-simple";
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
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} />
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
      <Route path="/accept-invite/:token" component={PartnerInvitePage} />
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
