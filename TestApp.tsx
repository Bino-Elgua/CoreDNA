import React from 'react';

const TestApp: React.FC = () => {
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
      <h1>✓ App is Loading</h1>
      <p>If you see this, React is working</p>
      <p style={{ marginTop: '2rem', fontSize: '12px', color: '#666' }}>
        Check browser console (F12) for errors
      </p>
    </div>
  );
};

export default TestApp;
