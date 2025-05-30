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
import { RelationshipInsightsPage } from "./pages/relationship-insights-page";
import RelationshipTipsPage from "./pages/relationship-tips-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { PushNotificationsProvider } from "./hooks/use-push-notifications";
import NotificationSettingsPage from "./pages/notification-settings-page";
import { SplashScreenProvider } from "./hooks/use-splash-screen";
import { SplashScreen } from "./components/pwa/splash-screen";
import { useEffect } from "react";
import { useLocation } from "wouter";
import DashboardPage from "./pages/dashboard-page"; //Import added for the new dashboard page
import Header from "@/components/shared/header";

function ScrollToTop() {
  const [pathname] = useLocation();
  const [showHeader, setShowHeader] = React.useState(true);
  console.log(pathname);
  useEffect(() => {
    if (pathname !== "/auth") {
      setTimeout(() => {
        window.document
          .getElementsByClassName("scroll-id")[0]
          .scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [pathname]);

  return null;
}

// Componente de rotas da aplicação
function Router() {
  const [pathname] = useLocation();
  const [showHeader, setShowHeader] = React.useState(false);
  console.log(pathname);
  useEffect(() => {
    setTimeout(() => {
      if (
        pathname === "/auth" ||
        pathname === "/register" ||
        pathname === "/" ||
        pathname === "/welcome" ||
        pathname === "/onboarding" ||
        pathname === "/partner-invite"
      ) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
    }, 100);

    if (pathname !== "/" && pathname !== "/auth") {
      setTimeout(() => {
        if (window.document.getElementsByClassName("scroll-id").length > 0)
          window.document
            .getElementsByClassName("scroll-id")[0]
            .scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [pathname]);
  return (
    <>
      <ScrollToTop />
      {showHeader && <Header />}
      <Switch>
        {/* Landing page pública */}
        <Route path="/" component={LandingPage} />
        {/* Rota principal protegida */}
        <ProtectedRoute path="/calendar" component={HomePage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />{" "}
        {/* New route added */}
        {/* Rotas de autenticação */}
        <Route path="/auth" component={AuthPage} />
        <Route path="/register" component={AuthPage} />
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
        {/* Insights de relacionamento */}
        <ProtectedRoute
          path="/insights/:id?"
          component={RelationshipInsightsPage}
        />
        {/* Dicas de relacionamento */}
        <ProtectedRoute path="/tips" component={RelationshipTipsPage} />
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
