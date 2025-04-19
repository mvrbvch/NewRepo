import { useState, useEffect } from "react";

// Versão ultra simplificada só com verificação de Service Worker
function App() {
  const [swStatus, setSwStatus] = useState<"checking" | "registered" | "failed">("checking");
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  
  // Verificar status do Service Worker ao carregar
  useEffect(() => {
    async function checkServiceWorker() {
      try {
        if (!("serviceWorker" in navigator)) {
          console.log("Service Worker não é suportado neste navegador");
          setSwStatus("failed");
          return;
        }
        
        // Verificar registros existentes
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length > 0) {
          console.log("Service Worker já registrado:", registrations);
          setSwStatus("registered");
        } else {
          // Tenta registrar
          try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log("Service Worker registrado com sucesso:", registration);
            setSwStatus("registered");
          } catch (error) {
            console.error("Erro ao registrar Service Worker:", error);
            setSwStatus("failed");
          }
        }
        
        // Verifica permissão de notificação
        setPermission(Notification.permission);
        
      } catch (error) {
        console.error("Erro ao verificar Service Worker:", error);
        setSwStatus("failed");
      }
    }
    
    checkServiceWorker();
  }, []);
  
  // Solicitar permissão de notificação
  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        // Mostra uma notificação de teste
        new Notification("Por Nós", {
          body: "Notificações ativadas com sucesso!",
          icon: "/icons/icon-192x192.png"
        });
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Por Nós - Teste de Service Worker
        </h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Status do Service Worker:</h2>
            <div className={`mt-2 p-3 rounded ${
              swStatus === "checking" ? "bg-gray-100" : 
              swStatus === "registered" ? "bg-green-100 text-green-800" : 
              "bg-red-100 text-red-800"
            }`}>
              {swStatus === "checking" ? "Verificando..." : 
               swStatus === "registered" ? "Service Worker registrado com sucesso!" : 
               "Falha ao registrar Service Worker"}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Status das Notificações:</h2>
            <div className={`mt-2 p-3 rounded ${
              permission === "unknown" ? "bg-gray-100" : 
              permission === "granted" ? "bg-green-100 text-green-800" : 
              permission === "denied" ? "bg-red-100 text-red-800" : 
              "bg-yellow-100 text-yellow-800"
            }`}>
              {permission === "unknown" ? "Status desconhecido" : 
               permission === "granted" ? "Permissão concedida" : 
               permission === "denied" ? "Permissão negada" : 
               "Permissão não solicitada"}
            </div>
          </div>
          
          <div>
            <button 
              className={`w-full py-2 px-4 rounded ${
                permission === "granted" ? "bg-green-500 text-white" : 
                permission === "denied" ? "bg-gray-400 text-gray-200 cursor-not-allowed" : 
                "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              onClick={requestPermission}
              disabled={permission === "denied"}
            >
              {permission === "granted" ? "Permissão já concedida" : 
               permission === "denied" ? "Notificações bloqueadas" : 
               "Solicitar permissão para notificações"}
            </button>
          </div>
        </div>
        
        <p className="mt-6 text-sm text-gray-500 text-center">
          Esta é uma versão simplificada para testar apenas o Service Worker e as notificações.
        </p>
      </div>
    </div>
  );
}

export default App;
