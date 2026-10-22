import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/accessibility.css'

// [PERFORMANS] Fontlar index.html içerisinde yüklendiğinden script kaldırıldı.

// Legacy LocalStorage Cleanup (Production Migration)
try {
  const LEGACY_KEYS = ['mahorapeak_user', 'mahorapeak_maintenance', 'mahorapeak_history'];
  LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
} catch (e) {}

// [KOZMİK GÜVENLİK] Global Error Fallback & Chunk Load Fix
// Sonsuz reload döngüsünü engelle — 10sn içinde en fazla 2 reload
const RELOAD_KEY = 'mahorapeak_chunk_reload';
const RELOAD_WINDOW_MS = 10000;
const MAX_RELOADS = 2;

function safeChunkReload() {
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(RELOAD_KEY);
    const history = raw ? JSON.parse(raw) : [];
    
    // Son 10 saniyedeki reload'ları filtrele
    const recent = history.filter(ts => now - ts < RELOAD_WINDOW_MS);
    
    if (recent.length >= MAX_RELOADS) {
      // Sonsuz döngü tespit edildi — reload yapma
      console.warn('[SYSTEM] Chunk reload döngüsü engellendi. Sayfa yenilenmeyecek.');
      return;
    }
    
    recent.push(now);
    sessionStorage.setItem(RELOAD_KEY, JSON.stringify(recent));
    window.location.reload(true);
  } catch (e) {
    // sessionStorage erişilemezse güvenli şekilde reload et
    window.location.reload(true);
  }
}

window.addEventListener('unhandledrejection', (event) => {
  // Tüm unhandled rejection'ları yakala — tarayıcı konsolunda kırmızı hata göstermesin
  event.preventDefault();
  
  // Güvenli mesaj çıkarma: event.reason null/undefined olabilir (özellikle mobilde)
  let msg = '';
  try {
    if (event.reason) {
      msg = (event.reason.message || event.reason.toString() || '').toLowerCase();
    }
  } catch (e) {
    msg = '';
  }
  
  const isChunkError = msg.includes('failed to fetch dynamically imported module') || 
                       msg.includes('importing a module script failed') || 
                       msg.includes('load failed') ||
                       msg.includes('loading chunk') ||
                       msg.includes('loading css chunk');
                       
  if (isChunkError) {
    safeChunkReload();
  }
});

// Global error handler (senkron hatalar için)
window.addEventListener('error', (event) => {
  const msg = (event.message || '').toLowerCase();
  const isChunkError = msg.includes('failed to fetch dynamically imported module') ||
                       msg.includes('importing a module script failed') ||
                       msg.includes('loading chunk') ||
                       msg.includes('loading css chunk') ||
                       msg.includes('unexpected token \'<\'');
  
  if (isChunkError) {
    event.preventDefault();
    safeChunkReload();
  }
});

// [KOZMİK TEMİZLİK] Takılan Auth verilerini temizle
try {
  const authKey = 'sb-nkvxavrhsoazpeucscso-auth-token'; // Specific to this project
  const currentAuth = localStorage.getItem(authKey);
  if (currentAuth && currentAuth.includes('error')) {
    localStorage.removeItem(authKey);
  }
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
