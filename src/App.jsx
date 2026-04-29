import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Zap } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { PerformanceProvider } from './context/PerformanceContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AuthModal from './components/AuthModal.jsx';
import GlobalEffects from './components/GlobalEffects.jsx';
import Home from './pages/Home.jsx';
import ManhwaDetail from './pages/ManhwaDetail.jsx';
import Reader from './pages/Reader.jsx';
import Admin from './pages/Admin.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProfileShowcase from './pages/ProfileShowcase.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AllSeries from './pages/AllSeries.jsx';
import StaticPage from './pages/StaticPage.jsx';
import Contact from './pages/Contact.jsx';
import Suggestions from './pages/Suggestions.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Citadel from './pages/Citadel.jsx';
import CitadelCategory from './pages/CitadelCategory.jsx';
import EliteUpgrade from './pages/EliteUpgrade.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import GlobalBundleTheme from './components/GlobalBundleTheme.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

// Role-based Route Protection
function AdminRoute({ children }) {
  const { isEditor, loading } = useAuth();
  if (loading) return null;
  return isEditor ? children : <Navigate to="/" />;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/" />;
}

function AnimatedRoutes({ onAuthOpen }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home onAuthOpen={onAuthOpen} />} />
        <Route path="/all-series" element={<AllSeries />} />
        <Route path="/manhwa/:id" element={<ManhwaDetail onAuthOpen={onAuthOpen} />} />
        <Route path="/read/:id/:chapter" element={<Reader />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profil/:username" element={<ProfileShowcase />} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/iletisim" element={<Contact />} />
        <Route path="/oneriler" element={<Suggestions />} />
        <Route path="/citadel" element={<Citadel />} />
        <Route path="/citadel/:category" element={<CitadelCategory />} />
        <Route path="/elite-upgrade" element={<EliteUpgrade />} />
        <Route path="/:slug" element={<StaticPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function MaintenanceScreen({ onAuthOpen }) {
  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Top Right Admin Door */}
      <div className="absolute top-6 right-6 z-50">
        <button onClick={() => onAuthOpen('login')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/10 hover:border-amber-500/40 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] group">
          <ShieldAlert size={16} className="group-hover:scale-110 transition-transform" /> Kozmik Oda Giriş
        </button>
      </div>

      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px]" />
      </div>
      
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong border border-red-500/20 rounded-3xl p-10 max-w-lg text-center relative z-10 shadow-[0_0_100px_rgba(239,68,68,0.15)]">
         <ShieldAlert size={80} className="text-red-500 mx-auto mb-6 opacity-90 animate-pulse" />
         <h1 className="text-4xl font-black text-white mb-2 tracking-tight">SİSTEM BAKIMDA</h1>
         <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full mb-6" />
         
         <p className="text-lg text-slate-300 font-semibold mb-4 leading-relaxed">
           Şu anda altyapımızda kozmik bir güncelleme yapıyoruz.
         </p>
         
         <p className="text-sm text-slate-400 mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
           En yakın zamanda tekrar kullanıma açılacaktır.<br/><br/>
           <strong className="text-slate-300">İyi okumalar dileriz!</strong>
         </p>
      </motion.div>
    </div>
  );
}

function ConnectionDiagnostic() {
  const [show, setShow] = useState(false);
  const [, setTick] = useState(0); // For forcing re-renders
  const debugData = window.__SUPABASE_DEBUG__ || {};
  const authErr = window.__AUTH_ERROR__;

  // Update check every second
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!show && !authErr) {
    return (
      <button 
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 z-[1000] w-6 h-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[10px] text-slate-500 hover:bg-white/10 transition-all shadow-lg"
      >
        ?
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[1000] p-4 glass-strong border border-amber-500/30 rounded-2xl shadow-2xl max-w-[280px] text-[11px] animate-float">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <span className="font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
          <Zap size={12} /> Bağlantı Teşhisi
        </span>
        <button onClick={() => { setShow(false); window.__AUTH_ERROR__ = null; }} className="text-slate-500 hover:text-white">✕</button>
      </div>
      <div className="space-y-2 text-slate-300">
        <div className="flex justify-between items-center text-[10px]">
          <span className="opacity-50 uppercase tracking-tighter">Domain:</span>
          <span className="font-mono bg-white/5 px-2 py-0.5 rounded">{debugData.domain}</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="opacity-50 uppercase tracking-tighter">Sunucu:</span>
          <span className="font-mono text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded">{debugData.url}</span>
        </div>
        
        <div className="mt-4">
          <span className="block opacity-50 mb-1.5 uppercase tracking-tighter text-[9px]">Mevcut Durum:</span>
          {authErr && !authErr.includes('stole it') ? (
            <div className="text-red-400 font-bold leading-tight bg-red-500/10 p-3 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              ❌ {authErr}
            </div>
          ) : (
            <div className="text-emerald-400 font-medium bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20 italic">
              ✅ Bağlantı Kararlı (Sorun Yok)
            </div>
          )}
        </div>

        {authErr && authErr.includes('Failed to fetch') && (
          <div className="text-[9px] text-slate-400 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed mt-2">
            <strong className="text-amber-500">İPUCU:</strong> Bu hata genellikle bir <strong className="text-white">AdBlocker</strong> veya <strong className="text-white">Brave Kalkanı</strong>'nın Supabase'i engellediğini gösterir.
          </div>
        )}

        {authErr && authErr.includes('timeout') && (
          <div className="text-[9px] text-slate-400 bg-red-500/5 p-2.5 rounded-lg border border-red-500/20 leading-relaxed mt-2">
            <strong className="text-red-500">DİKKAT:</strong> Supabase senin IP adresini geçici olarak kısıtlamış (Rate Limit) olabilir. <br/> 
            <strong className="text-white">ÇÖZÜM:</strong> Giriş Yap'a 15-20 dk sonra tekrar dene veya Google ile devam etmeyi denemelisin.
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const [authModal, setAuthModal] = useState(null);
  const { maintenanceMode } = useApp();
  const { user, isOwner } = useAuth();

  // ── Global Stability Listeners ──────────────────────────────────────
  useEffect(() => {
    const handleError = (e) => {
      console.error("[KOZMİK ÇÖKME]", e);
      if (e.message?.includes('chunk') || e.message?.includes('Loading')) {
        window.location.reload();
      }
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // ── Global Auth Modal Trigger (allows any component to open login) ───
  useEffect(() => {
    const handleOpenAuth = (e) => setAuthModal(e.detail || 'login');
    window.addEventListener('open-auth', handleOpenAuth);
    return () => window.removeEventListener('open-auth', handleOpenAuth);
  }, []);
  
  // Bakım modundayken, eğer giriş yapan kişi BAŞ ADMİN DEĞİLSE ekranı kapat
  // İSTİSNA: Şifre sıfırlama sayfası bakım modundan muaf tutulur
  const isResetPage = window.location.pathname === '/reset-password';
  const { isOkur } = useAuth();
  const isMaintenanceBlocked = maintenanceMode && !isOwner && !isOkur && !isResetPage;

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <GlobalEffects />
        <GlobalBundleTheme />
        <div className="min-h-screen bg-[#050507]">
          {isMaintenanceBlocked ? (
            <MaintenanceScreen onAuthOpen={(mode) => setAuthModal(mode)} />
          ) : (
            <>
              {maintenanceMode && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 to-red-900 border-b border-red-500/50 text-white text-xs font-black py-1.5 uppercase tracking-widest shadow-lg overflow-hidden flex items-center">
                   <marquee scrollamount="8" className="w-full drop-shadow-md">
                     🚨 SİSTEM BAKIMDA 🚨 • SADECE BAŞ ADMİN MODU AKTİF • LÜTFEN YAPTIĞINIZ DEĞİŞİKLİKLERE DİKKAT EDİNİZ • 🚨 SİSTEM BAKIMDA 🚨
                   </marquee>
                </div>
              )}
              <div className={maintenanceMode ? "pt-7" : ""}>
                 <Header onAuthOpen={(mode) => setAuthModal(mode)} />
                 <ErrorBoundary mini>
                   <AnimatedRoutes onAuthOpen={(mode) => setAuthModal(mode)} />
                   <Footer />
                 </ErrorBoundary>
              </div>
            </>
          )}

          <AnimatePresence>
            {authModal && (
              <AuthModal
                key="auth-modal"
                mode={authModal}
                onClose={() => setAuthModal(null)}
              />
            )}
          </AnimatePresence>

          <ConnectionDiagnostic />
        </div>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PerformanceProvider>
        <AppProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </AppProvider>
      </PerformanceProvider>
    </ErrorBoundary>
  );
}
