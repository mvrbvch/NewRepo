import * as React from "react";
import { Switch, Route } from "wouter";
import LandingPage from "./pages/landing-page";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Versão super simplificada do App para demonstrar a landing page
// Removendo componentes que estão causando problemas com hooks
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/landing" component={LandingPage} />
        {/* Todas as outras rotas também vão para a landing page para demonstração */}
        <Route path="/:rest*" component={LandingPage} />
      </Switch>
    </QueryClientProvider>
  );
}

export default App;
