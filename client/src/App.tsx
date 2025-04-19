import { Route, Switch } from "wouter";

// Páginas básicas que funcionarão sem providers
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Aplicação principal extremamente simplificada (sem toasts)
function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <h1 className="text-center p-4 text-xl font-bold">Por Nós - Versão Mínima</h1>
      <AppRouter />
    </div>
  );
}

// Router mínimo apenas com páginas essenciais
function AppRouter() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={MinimalHomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Página inicial mínima para testar
function MinimalHomePage() {
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Por Nós</h2>
      <p className="text-center mb-4">
        Esta é uma versão mínima da aplicação para depuração.
      </p>
      <a 
        href="/auth" 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Ir para Login
      </a>
    </div>
  );
}

export default App;
