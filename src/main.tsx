import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Check if maintenance mode is enabled before initializing the app
const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

if (isMaintenanceMode) {
  // Redirect to static maintenance page
  window.location.href = '/maintenance.html';
} else {
  // Render normal app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
