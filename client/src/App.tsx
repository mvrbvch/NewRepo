// Versão ultramínima sem hooks problema
import { Route, Switch } from "wouter";

// Páginas
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";

// Aplicação principal
function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppRouter />
    </div>
  );
}

// Router simplificado sem ProtectedRoute
function AppRouter() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={HomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;