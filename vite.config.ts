import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    host: true, // Enable network access for iPhone
    port: 5173,
    allowedHosts: ['flappy.helsdingen.com'],
  },
});
