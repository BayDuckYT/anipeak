// Build trigger: 2026-05-09 12:18
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

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
    // Kod sikistirma motoru: esbuild (varsayilan) yerine terser daha iyi sikistirir
    // Ancak esbuild daha hizli — target ayarlayip production'i kucultelim
    target: 'esnext',
    minify: 'esbuild',

    // Chunk (Parca) ayristirma — her sayfa kendi paketini yukler
    // Bu sayede anasayfa gereksiz 500KB yuklemez
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — her sayfada ortak, onbellege alinir
          'vendor-react': ['react', 'react-dom'],
          // Router — navigasyon
          'vendor-router': ['react-router-dom'],
          // Animasyon kutuphanesi
          'vendor-framer': ['framer-motion'],
          // Ikon kutuphanesi
          'vendor-icons': ['lucide-react'],
          // Supabase — veri katmani
          'vendor-supabase': ['@supabase/supabase-js'],
          // 3D Globe — sadece GlobalNexus sayfasinda lazim
          'vendor-cobe': ['cobe'],
        },
        // Asset dosyalarini kategorilere ayir
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

    // Chunk boyutu uyari limitini artir (kutuphane parcalari buyuk olabilir)
    chunkSizeWarningLimit: 600,

    // CSS kodu bolme — her chunk kendi CSS'ini yukler
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
