import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), 'index.html'),
        offline: resolve(process.cwd(), 'offline.html'),
      },
    },
  },
  server: { host: '127.0.0.1', port: 1420, strictPort: true },
});
