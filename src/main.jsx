import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Legacy LocalStorage Cleanup (Production Migration)
const LEGACY_KEYS = ['anipeak_user', 'anipeak_maintenance', 'anipeak_history'];
LEGACY_KEYS.forEach(key => localStorage.removeItem(key));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
