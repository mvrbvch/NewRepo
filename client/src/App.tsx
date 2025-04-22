import React from "react";

// Versão extremamente simplificada do app sem nenhum hook ou provider complexo
function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Status do Aplicativo</h1>
        
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md mb-6">
          <h2 className="font-semibold text-amber-800 mb-2">Manutenção em Andamento</h2>
          <p className="text-amber-700 text-sm">
            Estamos corrigindo problemas críticos com os hooks do React.
            O aplicativo estará disponível em breve.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-medium">Progresso da Resolução:</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>✓ Identificação dos problemas de hooks</li>
              <li>✓ Isolamento da aplicação para diagnóstico</li>
              <li>→ Criando versão estável dos providers</li>
              <li>→ Corrigindo sistema de notificações</li>
            </ul>
          </div>
          
          <div className="rounded bg-gray-100 p-4 text-sm">
            <p className="font-medium mb-2">Navegue para:</p>
            <div className="space-y-2">
              <a href="/notifications/test" className="text-blue-600 hover:underline block">
                /notifications/test - Testes de Notificação
              </a>
              <a href="/auth" className="text-blue-600 hover:underline block">
                /auth - Página de Autenticação
              </a>
              <a href="/" className="text-blue-600 hover:underline block">
                / - Página Principal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
