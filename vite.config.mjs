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
    // Kod sıkıştırma motoru: esbuild (varsayılan) yerine terser daha iyi sıkıştırır
    // Ancak esbuild daha hızlı — target ayarlayıp production'ı küçültelim
    target: 'esnext',
    minify: 'esbuild',

    // Chunk (Parça) ayrıştırma — her sayfa kendi paketini yükler
    // Bu sayede anasayfa gereksiz 500KB yüklemez
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — her sayfada ortak, önbelleğe alınır
          'vendor-react': ['react', 'react-dom'],
          // Router — navigasyon
          'vendor-router': ['react-router-dom'],
          // Animasyon kütüphanesi
          'vendor-framer': ['framer-motion'],
          // İkon kütüphanesi
          'vendor-icons': ['lucide-react'],
          // Supabase — veri katmanı
          'vendor-supabase': ['@supabase/supabase-js'],
          // 3D Globe — sadece GlobalNexus sayfasında lazım
          'vendor-cobe': ['cobe'],
        },
        // Asset dosyalarını kategorilere ayır
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name?.split('.').pop();
          if (/png|jpe?g|svg|gif|webp/.test(ext)) return 'assets/images/[name]-[hash][extname]';
          if (/woff2?|ttf|eot/.test(ext)) return 'assets/fonts/[name]-[hash][extname]';
          if (ext === 'css') return 'assets/css/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // Chunk boyutu uyarı limitini artır (kütüphane parçaları büyük olabilir)
    chunkSizeWarningLimit: 600,

    // CSS kodu bölme — her chunk kendi CSS'ini yükler
    cssCodeSplit: true,

    // Source map production'da kapalı (güvenlik + hız)
    sourcemap: false,
  },

  // Bağımlılık ön-paketleme optimizasyonu
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
