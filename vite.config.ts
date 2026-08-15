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
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable watching database files to prevent full page reloads during generation
      watch: {
        ignored: [
          '**/ebooks-db.json',
          '**/audio_cache/**',
          '**/*.log',
          '**/scratch/**',
          '**/.gemini/**'
        ]
      },
    },
  };
});
