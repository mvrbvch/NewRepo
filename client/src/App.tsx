import * as React from "react";
import { Switch, Route, Redirect } from "wouter";
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
import { SplashScreenProvider } from "./hooks/use-splash-screen";
import { SplashScreen } from "./components/pwa/splash-screen";
import { useEffect } from "react";
import { useLocation } from "wouter";

function ScrollToTop() {
  const [pathname] = useLocation();
  console.log(pathname);
  useEffect(() => {
    setTimeout(() => {
      window.document
        .getElementsByClassName("scroll-id")[0]
        .scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [pathname]);

  return null;
}

// Componente de rotas da aplicação
function Router() {
  return (
    <>
      <ScrollToTop />

      <Switch>
        {/* Landing page pública */}
        <Route path="/" component={LandingPage} />

        {/* Rota principal protegida */}
        <ProtectedRoute path="/calendar" component={HomePage} />

        {/* Rotas de autenticação */}
        <Route path="/auth" component={AuthPage} />
        <Route path="/accept-invite/:token" component={PartnerInvitePage} />
        <Route path="/partner-invite" component={PartnerInvitePage} />

        {/* Experiência unificada de onboarding e boas-vindas */}
        <Route path="/onboarding">{() => <Redirect to="/welcome" />}</Route>
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
    </>
  );
}

// Componente de conteúdo principal que usa o splash screen
const AppContent = () => {
  // Gerenciamos o estado do splash screen diretamente aqui
  // ao invés de usar o contexto que está causando problemas
  const [isLoading, setIsLoading] = React.useState(true);

  // Efeito para esconder o splash screen após um tempo
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Função para finalizar a exibição do splash screen
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
};

// Componente principal da aplicação
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PushNotificationsProvider>
          <AppContent />
        </PushNotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
