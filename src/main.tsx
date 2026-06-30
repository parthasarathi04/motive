import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign HMR WebSocket connection errors in the sandbox preview environment
if (typeof window !== 'undefined') {
  const isViteWebsocketError = (msg: string) => 
    msg.toLowerCase().includes('websocket') || 
    msg.includes('WebSocket closed without opened');

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason || '');
    if (isViteWebsocketError(message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (isViteWebsocketError(message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

