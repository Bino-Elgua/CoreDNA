import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('[index.tsx] Starting...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

console.log('[index.tsx] Creating root...');

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[index.tsx] Rendered successfully');
} catch (error) {
  console.error('[index.tsx] Error rendering:', error);
}
