import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/accessibility.css'

// [PERFORMANS] Fontlar index.html içerisinde yüklendiğinden script kaldırıldı.

// Legacy LocalStorage Cleanup (Production Migration)
const LEGACY_KEYS = ['anipeak_user', 'anipeak_maintenance', 'anipeak_history'];
LEGACY_KEYS.forEach(key => localStorage.removeItem(key));

// [KOZMİK GÜVENLİK] Global Error Fallback & Chunk Load Fix
window.addEventListener('unhandledrejection', (event) => {
  // Tüm unhandled rejection'ları yakala — tarayıcı konsolunda kırmızı hata göstermesin
  event.preventDefault();
  
  const msg = event.reason?.message || '';
  const isChunkError = msg.includes('Failed to fetch dynamically imported module') || 
                       msg.includes('Importing a module script failed') || 
                       msg.includes('Load failed');
                       
  if (isChunkError) {
    window.location.reload(true);
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
