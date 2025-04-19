import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Versão ultra simplificada sem ThemeProvider
console.log("[PWA] Aplicação iniciando em modo simplificado...");

createRoot(document.getElementById("root")!).render(
  <App />
);
