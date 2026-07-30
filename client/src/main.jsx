import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Dynamically route Axios requests to local or Render backend depending on current host origin
axios.interceptors.request.use((config) => {
  const localBackend = "http://localhost:8000";
  const prodBackend = "https://mq-gas-censor-sensegrid-api-tronix.onrender.com";
  
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const targetBackend = isLocal ? localBackend : prodBackend;
  
  if (config.url) {
    config.url = config.url
      .replace("http://localhost:8000", targetBackend)
      .replace("https://mq-gas-censor-sensegrid-api-tronix.onrender.com", targetBackend);
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
