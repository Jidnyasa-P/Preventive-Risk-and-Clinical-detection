import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy /api calls to the Node.js auth server (port 3000)
      // and ML prediction calls to the Python FastAPI backend (port 8000)
      proxy: {
        '/api': {
          target: `http://localhost:3000`,
          changeOrigin: true,
        },
      },
    },
  };
});
