import React from "react";
import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-context";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
};

// Componente para proteger rotas que exigem autenticação
export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  return (
    <Route
      path={path}
      component={() => {
        const { user, isLoading } = useAuth();
        
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        if (user && !user.onboardingComplete && path !== "/onboarding") {
          return <Redirect to="/onboarding" />;
        }
        
        return <Component />;
      }}
    />
  );
}