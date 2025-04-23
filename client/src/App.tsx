import { Switch, Route, useLocation } from "wouter";
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
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { PushNotificationsProvider } from "./hooks/use-push-notifications";
import NotificationSettingsPage from "./pages/notification-settings-page";
import { SplashScreenProvider } from "./hooks/use-splash-screen";
import { SplashScreen } from "./components/pwa/splash-screen";
import { useState, useEffect, ReactNode } from "react";
import { PageTransition } from "./components/ui/page-transition";

// Componente para envolver as páginas com transição
function TransitionedPage({ children, effect = "fade" }: { children: ReactNode, effect?: string }) {
  return (
    <PageTransition effect={effect as any} duration={0.35}>
      <div className="min-h-screen">
        {children}
      </div>
    </PageTransition>
  );
}

// Versões com transição dos componentes de página
const TransitionedPages = {
  // A página Home tem formatação específica e não deve usar o wrapper de transição
  // para evitar problemas com os seletores de calendário
  Home: HomePage,
  
  Auth: () => (
    <TransitionedPage effect="fade">
      <AuthPage />
    </TransitionedPage>
  ),
  
  Onboarding: () => (
    <TransitionedPage effect="slide">
      <OnboardingPage />
    </TransitionedPage>
  ),
  
  PartnerInvite: () => (
    <TransitionedPage effect="slide">
      <PartnerInvitePage />
    </TransitionedPage>
  ),
  
  NotificationSettings: () => (
    <TransitionedPage effect="slide-up">
      <NotificationSettingsPage />
    </TransitionedPage>
  ),
  
  HouseholdTasks: () => (
    <TransitionedPage effect="slide-up">
      <HouseholdTasksPage />
    </TransitionedPage>
  ),
  
  NotFound: () => (
    <TransitionedPage effect="fade">
      <NotFound />
    </TransitionedPage>
  )
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={TransitionedPages.Home} />
      <Route path="/auth" component={TransitionedPages.Auth} />
      <ProtectedRoute path="/onboarding" component={TransitionedPages.Onboarding} />
      <ProtectedRoute path="/invite-partner" component={TransitionedPages.PartnerInvite} />
      <ProtectedRoute
        path="/notifications"
        component={TransitionedPages.NotificationSettings}
      />
      <ProtectedRoute path="/tasks" component={TransitionedPages.HouseholdTasks} />
      <Route path="/accept-invite/:token" component={TransitionedPages.PartnerInvite} />
      <Route component={TransitionedPages.NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [location] = useLocation();

  // Handle splash screen finish
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onFinished={handleSplashFinish} />}
      <TooltipProvider>
        <Toaster />
        <div className="overflow-hidden">
          <Router />
        </div>
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
