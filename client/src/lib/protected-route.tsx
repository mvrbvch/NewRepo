import { Redirect, Route } from "wouter";

// Versão extremamente simplificada que não usa hooks diretamente
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return (
    <Route path={path}>
      {() => <Component />}
    </Route>
  );
}
