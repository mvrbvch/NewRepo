// Versão extremamente simplificada sem nenhum componente externo
function App() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#fff' 
    }}>
      <div style={{ 
        maxWidth: '400px', 
        padding: '20px', 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Diagnóstico do Por Nós</h1>
        <p style={{ marginBottom: '12px' }}>
          Versão básica para verificar o funcionamento do React.
        </p>
        <p style={{ color: '#666' }}>
          Sem hooks, sem contextos, sem autenticação.
        </p>
      </div>
    </div>
  );
}

export default App;
