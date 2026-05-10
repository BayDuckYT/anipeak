// Build trigger: 2026-05-09 12:18
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  esbuild: {
    drop: ['console', 'debugger'],
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name ? assetInfo.name.split('.').pop() : '';
          if (/png|jpe?g|svg|gif|webp/.test(ext)) return 'assets/images/[name]-[hash][extname]';
          if (/woff2?|ttf|eot/.test(ext)) return 'assets/fonts/[name]-[hash][extname]';
          if (ext === 'css') return 'assets/css/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    chunkSizeWarningLimit: 800,
    cssCodeSplit: true,

    // Source map production'da kapali (guvenlik + hiz)
    sourcemap: false,
  },

  // Bagimlilik on-paketleme optimizasyonu
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      '@supabase/supabase-js',
    ],
    // Cobe sadece talep edilince yüklensin
    exclude: ['cobe'],
  },
});
