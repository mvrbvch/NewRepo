import { useState } from "react";

// Versão extremamente simplificada para diagnosticar problemas de hooks
function App() {
  const [message] = useState("Aplicação Por Nós - Versão Diagnóstica");
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          {message}
        </h1>
        <p className="text-muted-foreground mb-4 text-center">
          Esta é uma versão simplificada para diagnosticar problemas com hooks React.
        </p>
        <div className="flex justify-center">
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            onClick={() => {
              alert("O sistema de hooks React está funcionando!");
            }}
          >
            Testar Hooks
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
