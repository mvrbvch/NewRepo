import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";

// Registrar o service worker para notificações push e PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Verificar se já existe um service worker registrado
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      
      // Se existir algum registro antigo, tentar atualizá-lo ou removê-lo
      if (existingRegistrations.length > 0) {
        console.log(`Encontrados ${existingRegistrations.length} service workers registrados.`);
        
        for (const registration of existingRegistrations) {
          console.log(`Service worker em: ${registration.scope}`);
          
          // Forçar atualização
          try {
            await registration.update();
            console.log(`Service worker atualizado em: ${registration.scope}`);
          } catch (updateError) {
            console.error(`Erro ao atualizar service worker:`, updateError);
            
            // Se não conseguir atualizar, tentar remover
            try {
              const unregistered = await registration.unregister();
              if (unregistered) {
                console.log(`Service worker desregistrado com sucesso em: ${registration.scope}`);
              }
            } catch (unregisterError) {
              console.error(`Erro ao desregistrar service worker:`, unregisterError);
            }
          }
        }
      }
      
      // Registrar o service worker com opções mais robustas
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/', 
        updateViaCache: 'none' // Sempre buscar do servidor, não do cache
      });
      
      console.log('Service Worker registrado com sucesso:', registration.scope);
      
      // Verificar se há uma nova versão disponível
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('Nova versão do Service Worker instalada, será ativada na próxima visita');
              } else {
                console.log('Service Worker instalado pela primeira vez');
              }
            }
          };
        }
      };
    } catch (error) {
      console.error('Falha ao registrar o Service Worker:', error);
      
      // Verificar se o arquivo do service worker está acessível
      fetch('/service-worker.js')
        .then(response => {
          if (response.ok) {
            console.log('Service worker existe e está acessível. Status:', response.status);
          } else {
            console.error('Service worker não está acessível. Status:', response.status);
          }
        })
        .catch(fetchError => {
          console.error('Erro ao verificar arquivo service-worker.js:', fetchError);
        });
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <App />
  </ThemeProvider>
);
