// Build trigger: 2026-05-09 12:18
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function adminApiPlugin() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yrcrgkdikkaeccikdzvw.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  async function getAdminAuthorizationStatus(sbAdmin, authorization) {
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) return 401;
    const { data: authData, error: authError } = await sbAdmin.auth.getUser(accessToken);
    if (authError || !authData?.user) return 401;
    const { data: profile } = await sbAdmin.from('profiles').select('role').eq('id', authData.user.id).maybeSingle();
    const isOwner = authData.user.email?.toLowerCase() === 'murathanozel134@gmail.com';
    return isOwner || ['Baş Admin', 'Yönetici'].includes(profile?.role) ? 200 : 403;
  }

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
              if (!SUPABASE_SERVICE_KEY) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Yönetim servisi yapılandırılmadı.' }));
              }
              const { createClient } = await import('@supabase/supabase-js');
              const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
              const authStatus = await getAdminAuthorizationStatus(sbAdmin, req.headers.authorization);
              if (authStatus !== 200) {
                res.statusCode = authStatus;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: authStatus === 401 ? 'Oturum doğrulanamadı.' : 'Bu işlem için yönetici yetkisi gerekiyor.' }));
              }
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
              if (!SUPABASE_SERVICE_KEY) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Yönetim servisi yapılandırılmadı.' }));
              }
              const { createClient } = await import('@supabase/supabase-js');
              const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
              const authStatus = await getAdminAuthorizationStatus(sbAdmin, req.headers.authorization);
              if (authStatus !== 200) {
                res.statusCode = authStatus;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: authStatus === 401 ? 'Oturum doğrulanamadı.' : 'Bu işlem için yönetici yetkisi gerekiyor.' }));
              }
              
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
