import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetApi = env.VITE_API_URL || 'https://mq-gas-censor-sensegrid-api-tronix.onrender.com';

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: targetApi,
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: targetApi,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
