import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

// ProtectedRoute componente simplificado
export function ProtectedRoute(props: {
  path: string;
  component: React.ComponentType;
}) {
  return (
    <Route
      path={props.path}
      component={() => {
        const { user, isLoading } = useAuth();
        const [, navigate] = useLocation();
        
        // Enquanto carrega, mostra um loader
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        // Se não estiver autenticado, redireciona para login
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        // Se estiver autenticado mas não concluiu onboarding e não está na página de onboarding
        if (user && !user.onboardingComplete && props.path !== "/onboarding") {
          return <Redirect to="/onboarding" />;
        }
        
        // Se passou por todas as verificações, renderiza o componente
        const Component = props.component;
        return <Component />;
      }}
    />
  );
}
