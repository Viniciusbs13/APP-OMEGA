import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket errors in AI Studio environment
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason === 'WebSocket closed without opened.' || 
      (event.reason && typeof event.reason === 'string' && event.reason.includes('WebSocket closed'))) {
    event.preventDefault();
  }
});

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Only load script if key is present and doesn't look like a placeholder
if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 20 && !GOOGLE_MAPS_API_KEY.includes('MY_') && !GOOGLE_MAPS_API_KEY.includes('YOUR_')) {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
} else {
  console.warn('Google Maps API Key is missing or invalid. Please set VITE_GOOGLE_MAPS_API_KEY in Secrets.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
