import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SimpleToastProvider } from "@/components/simple-toast";

// Registrar o Service Worker automaticamente
console.log("[PWA] Aplicação iniciando e verificando Service Worker...");

// Service Worker registrado em index.html
// Verificar se o registro foi feito com sucesso
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`[PWA] Service Workers registrados: ${registrations.length}`);
  }).catch(error => {
    console.error("[PWA] Erro ao verificar Service Workers:", error);
  });
}

// Inicializar aplicação com os providers básicos
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <SimpleToastProvider>
        <App />
      </SimpleToastProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
