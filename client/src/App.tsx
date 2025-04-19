import * as React from "react";

// Definição de estado mínima que você mencionou que estava funcionando
interface State {
  count: number;
}

const memoryState: State = {
  count: 0
};

function App() {
  const [state, setState] = React.useState<State>(memoryState);
  
  function incrementCounter() {
    setState(prevState => ({
      ...prevState,
      count: prevState.count + 1
    }));
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '400px',
        padding: '24px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>Por Nós - Teste de Estado</h1>
        <p style={{ marginBottom: '16px' }}>
          Contador: {state.count}
        </p>
        <button 
          onClick={incrementCounter}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Incrementar
        </button>
      </div>
    </div>
  );
}

export default App;
