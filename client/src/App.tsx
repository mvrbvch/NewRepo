import { Route, Switch } from "wouter";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// Páginas
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import OnboardingPage from "@/pages/onboarding-page";
import HouseholdTasksPage from "@/pages/household-tasks-page";
import PartnerInvitePage from "@/pages/partner-invite-page";

// Provedores personalizados
import { AuthProvider } from "@/providers/auth-provider";
import { PushNotificationsProvider } from "@/providers/push-notifications-provider";

// Componentes de proteção de rota
import { ProtectedRoute } from "@/lib/protected-route";

// Aplicação principal
function App() {
  // Garantir que o Service Worker esteja registrado
  useEffect(() => {
    async function ensureServiceWorker() {
      try {
        // Verificar se o navegador suporta Service Worker
        if (!("serviceWorker" in navigator)) {
          console.error("[PWA] Service Worker não é suportado neste navegador");
          return;
        }
        
        // Verificar se já existe algum Service Worker registrado
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length > 0) {
          console.log("[PWA] Service Worker já está registrado:", registrations.length);
        } else {
          try {
            // Tenta registrar o Service Worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log("[PWA] Service Worker registrado com sucesso:", registration);
            
            // Mostra uma notificação na interface
            toast({
              title: "Service Worker Ativado",
              description: "Notificações e recursos offline agora estão disponíveis.",
            });
          } catch (error) {
            console.error("[PWA] Erro ao registrar Service Worker:", error);
          }
        }
      } catch (error) {
        console.error("[PWA] Erro geral ao verificar Service Worker:", error);
      }
    }
    
    ensureServiceWorker();
  }, []);
  
  return (
    <AuthProvider>
      <PushNotificationsProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <AppRouter />
        </div>
      </PushNotificationsProvider>
    </AuthProvider>
  );
}

// Router separado para facilitar manutenção
function AppRouter() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/partner-invite/:token" component={PartnerInvitePage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} />
      <ProtectedRoute path="/household-tasks" component={HouseholdTasksPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
