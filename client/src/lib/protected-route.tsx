import { useAuth } from "../hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Se o usuário está autenticado mas não completou o onboarding e não está na página de boas-vindas
  if (
    user &&
    !user.onboardingComplete &&
    path !== "/welcome" &&
    path !== "/onboarding"
  ) {
    return (
      <Route path={path}>
        <Redirect to="/welcome" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
