import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Legacy LocalStorage Cleanup (Production Migration)
const LEGACY_KEYS = ['anipeak_user', 'anipeak_maintenance', 'anipeak_history'];
LEGACY_KEYS.forEach(key => localStorage.removeItem(key));

// [KOZMİK GÜVENLİK] Global Error Fallback
window.addEventListener('unhandledrejection', (event) => {
  console.error('[KOZMİK SESSİZ HATA]', event.reason);
  // Optional: Force reload if it's a critical script load failure
  if (event.reason?.message?.includes('Load failed')) {
    window.location.reload();
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
