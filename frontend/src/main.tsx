import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { db } from './services/api'
import { allTrailers, accessories, defaultSettings } from './data'

console.log('Starting app initialization...');

const initPromise = db.initializeData(allTrailers, accessories, defaultSettings);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Initialization timed out (3s)')), 3000)
);

// Инициализируем данные перед рендером с таймаутом
Promise.race([initPromise, timeoutPromise])
  .then(() => {
    console.log('Data initialized successfully');
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Failed to initialize app:', error);
    // Если таймаут, все равно пробуем отрендерить, возможно данные уже есть
    if (error.message.includes('timed out')) {
        console.warn('Proceeding with render despite timeout...');
        const rootElement = document.getElementById('root');
        if (rootElement) {
            ReactDOM.createRoot(rootElement).render(
              <React.StrictMode>
                <App />
              </React.StrictMode>,
            );
            return;
        }
    }

    document.body.innerHTML = `<div style="color: red; padding: 20px;">
      <h1>Application Error</h1>
      <p>Failed to initialize application data.</p>
      <pre>${error?.message || String(error)}</pre>
      <button onclick="location.reload()">Reload</button>
    </div>`;
  });
