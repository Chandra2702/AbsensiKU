import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,        // Frontend jalan di 3001
        host: '0.0.0.0',   // Bisa diakses dari network
        allowedHosts: ['absensiku.fazznet.my.id'],
        // SETTING PROXY: Arahkan request api.php ke backend PHP (Port 8080)
        proxy: {
          '/api.php': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
