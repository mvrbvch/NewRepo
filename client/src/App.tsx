import { useState, useEffect } from "react";

// Super versão simplificada - sem uso de bibliotecas externas ou hooks personalizados
function App() {
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<"checking" | "registered" | "failed">("checking");
  const [notificationStatus, setNotificationStatus] = useState<"checking" | "granted" | "denied" | "default">("checking");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{text: string, type: "success" | "error" | "info"} | null>(null);
  
  // Verificar status do service worker e notificações
  useEffect(() => {
    checkStatus();
  }, []);
  
  // Função para mostrar mensagem temporária
  const showMessage = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };
  
  // Função para verificar o status do service worker e notificações
  const checkStatus = async () => {
    try {
      // Verificar suporte a service worker
      if (!("serviceWorker" in navigator)) {
        setServiceWorkerStatus("failed");
        console.error("Service Worker não é suportado neste navegador");
        return;
      }
      
      // Verificar registros existentes
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length > 0) {
        console.log("Service Worker já registrado:", registrations);
        setServiceWorkerStatus("registered");
      } else {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log("Service Worker registrado com sucesso:", registration);
          setServiceWorkerStatus("registered");
        } catch (error) {
          console.error("Erro ao registrar Service Worker:", error);
          setServiceWorkerStatus("failed");
        }
      }
      
      // Verificar status das notificações
      setNotificationStatus(Notification.permission as "granted" | "denied" | "default");
      
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setServiceWorkerStatus("failed");
    }
  };
  
  // Solicitar permissão para notificações
  const requestNotificationPermission = async () => {
    try {
      setIsPending(true);
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      
      if (permission === "granted") {
        // Mostrar uma notificação de teste
        new Notification("Por Nós", {
          body: "Notificações ativadas com sucesso!",
          icon: "/icons/icon-192x192.png"
        });
        
        showMessage("Notificações ativadas com sucesso!", "success");
      } else if (permission === "denied") {
        showMessage("Permissão para notificações negada", "error");
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      showMessage("Erro ao solicitar permissão para notificações", "error");
    } finally {
      setIsPending(false);
    }
  };
  
  // Reiniciar service worker
  const resetServiceWorker = async () => {
    try {
      setIsPending(true);
      showMessage("Reiniciando Service Worker...", "info");
      
      // Remover todos os registros
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      
      // Registrar novamente
      await navigator.serviceWorker.register('/service-worker.js');
      
      setServiceWorkerStatus("registered");
      showMessage("Service Worker reiniciado com sucesso", "success");
    } catch (error) {
      console.error("Erro ao reiniciar service worker:", error);
      setServiceWorkerStatus("failed");
      showMessage("Erro ao reiniciar Service Worker", "error");
    } finally {
      setIsPending(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {message && (
        <div className={`fixed top-4 right-4 p-3 rounded shadow-lg ${
          message.type === "success" ? "bg-green-500 text-white" :
          message.type === "error" ? "bg-red-500 text-white" :
          "bg-blue-500 text-white"
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Por Nós - Diagnóstico
        </h1>
        
        <div className="space-y-8">
          {/* Status do Service Worker */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Status do Service Worker</h2>
            <div className={`mb-4 p-3 rounded ${
              serviceWorkerStatus === "checking" ? "bg-gray-100" :
              serviceWorkerStatus === "registered" ? "bg-green-100 text-green-800" :
              "bg-red-100 text-red-800"
            }`}>
              {serviceWorkerStatus === "checking" ? "Verificando..." :
               serviceWorkerStatus === "registered" ? "Service Worker registrado com sucesso!" :
               "Falha ao registrar Service Worker"}
            </div>
            
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={resetServiceWorker}
              disabled={isPending || serviceWorkerStatus === "checking"}
            >
              {isPending ? "Processando..." : "Reiniciar Service Worker"}
            </button>
          </div>
          
          {/* Status das Notificações */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Status das Notificações</h2>
            <div className={`mb-4 p-3 rounded ${
              notificationStatus === "checking" ? "bg-gray-100" :
              notificationStatus === "granted" ? "bg-green-100 text-green-800" :
              notificationStatus === "denied" ? "bg-red-100 text-red-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {notificationStatus === "checking" ? "Verificando..." :
               notificationStatus === "granted" ? "Permissão concedida para notificações." :
               notificationStatus === "denied" ? "Permissão negada para notificações." :
               "Permissão de notificações não solicitada."}
            </div>
            
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={requestNotificationPermission}
              disabled={isPending || notificationStatus === "checking" || notificationStatus === "denied"}
            >
              {isPending ? "Processando..." : 
               notificationStatus === "granted" ? "Permissão já concedida" :
               notificationStatus === "denied" ? "Permissão negada (reinicie as permissões do site)" :
               "Solicitar permissão para notificações"}
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-sm text-gray-500 text-center">
          Esta é uma versão de diagnóstico para testar o Service Worker e as notificações push.
        </p>
      </div>
    </div>
  );
}

export default App;
