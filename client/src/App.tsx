// Versão absolutamente mínima sem NADA
function App() {
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
        }}>Por Nós - Diagnóstico</h1>
        <p style={{ marginBottom: '8px' }}>
          Versão absolutamente mínima.
        </p>
        <p>Sem nenhuma dependência externa.</p>
      </div>
    </div>
  );
}

export default App;
