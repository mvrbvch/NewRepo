import * as React from "react";
import { Switch, Route } from "wouter";
import LandingPage from "./pages/landing-page";
import SimpleLandingPage from "./pages/simple-landing";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import AuthPage from "./pages/auth-page";
import HomePage from "./pages/home-page";

// Versão simplificada do App com componentes essenciais
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Páginas públicas */}
        <Route path="/" component={SimpleLandingPage} />
        <Route path="/landing" component={SimpleLandingPage} />
        <Route path="/original-landing" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        
        {/* Home Page com acesso não protegido para visualização */}
        <Route path="/home" component={HomePage} />
        
        {/* Todas as outras rotas vão para a landing page */}
        <Route path="/:rest*" component={LandingPage} />
      </Switch>
    </QueryClientProvider>
  );
}

export default App;
