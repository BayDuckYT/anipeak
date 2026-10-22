// Build trigger: 2026-05-09 12:18
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function adminApiPlugin() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yrcrgkdikkaeccikdzvw.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyY3Jna2Rpa2thZWNjaWtkenZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI2NDMxNywiZXhwIjoyMDkxODQwMzE3fQ.rVXIyF1wG6KG6K_bdtx0J84LZwv0Y0NGT4LJvAENvGw';

  return {
    name: 'admin-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/admin/change-password' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { target_user_id, new_password } = JSON.parse(body || '{}');
              if (!target_user_id || !new_password || new_password.length < 6) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'target_user_id ve en az 6 karakterli new_password zorunludur.' }));
              }
              const { createClient } = await import('@supabase/supabase-js');
              const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
              const { data, error } = await sbAdmin.auth.admin.updateUserById(target_user_id, {
                password: new_password
              });
              if (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: error.message }));
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, user: data.user }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (url === '/api/admin/update-user' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { target_user_id, updates } = JSON.parse(body || '{}');
              if (!target_user_id || !updates) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'target_user_id ve updates zorunludur.' }));
              }
              const { createClient } = await import('@supabase/supabase-js');
              const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
              
              if (updates.email) {
                await sbAdmin.auth.admin.updateUserById(target_user_id, {
                  email: updates.email
                });
              }

              const { data, error } = await sbAdmin.from('profiles').update(updates).eq('id', target_user_id).select();
              if (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: error.message }));
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, data }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), adminApiPlugin()],

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
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react'],
        },
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
