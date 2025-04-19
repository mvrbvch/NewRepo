import { useAuth } from "@/providers/auth-provider";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Componente wrapper que verifica autenticação
function ProtectedRouteRenderer({
  path,
  component: Component
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

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
  if (user && !user.onboardingComplete && path !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  // Se passou por todas as verificações, renderiza o componente
  return <Component />;
}

// Componente Route que usa o renderer
export function ProtectedRoute({
  path,
  component
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return (
    <Route path={path}>
      {() => <ProtectedRouteRenderer path={path} component={component} />}
    </Route>
  );
}
