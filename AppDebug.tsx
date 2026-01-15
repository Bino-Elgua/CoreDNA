import React, { useState, useEffect } from 'react';

const AppDebug: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log('[AppDebug] Component mounted');
    setLoaded(true);
  }, []);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff6b6b',
        color: 'white',
        padding: '20px',
        fontFamily: 'monospace',
        flexDirection: 'column'
      }}>
        <h1>ERROR</h1>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {error}
        </pre>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4c63ff',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Loading...</h1>
          <p>Initializing app</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      flexDirection: 'column',
      color: '#000',
      fontFamily: 'sans-serif'
    }}>
      <h1>✓ App Loaded</h1>
      <p>Now trying to load full App...</p>
      <button onClick={() => {
        try {
          console.log('[AppDebug] Attempting to import App...');
          import('./App').then(module => {
            console.log('[AppDebug] App imported successfully');
            setLoaded(true);
          }).catch(err => {
            console.error('[AppDebug] Failed to import App:', err);
            setError(`Failed to load App: ${err.message}`);
          });
        } catch (err: any) {
          setError(`Error: ${err.message}`);
        }
      }} style={{
        marginTop: '20px',
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        backgroundColor: '#4c63ff',
        color: 'white',
        border: 'none',
        borderRadius: '5px'
      }}>
        Load Full App
      </button>
    </div>
  );
};

export default AppDebug;
