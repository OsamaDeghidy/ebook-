import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Proxy API requests to backend Express server on port 3000
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable watching database files to prevent full page reloads during generation
      watch: {
        ignored: [
          '**/data/**',
          '**/data/*.json',
          '**/data/reels.json',
          '**/ebooks-db.json',
          '**/vouchers.json',
          '**/audio_cache/**',
          '**/cache/**',
          '**/*.log',
          '**/scratch/**',
          '**/.gemini/**',
          '**/*.mp3'
        ]
      },
    },
  };
});
