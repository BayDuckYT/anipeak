import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import AuthModal from './components/AuthModal.jsx';
import Home from './pages/Home.jsx';
import ManhwaDetail from './pages/ManhwaDetail.jsx';
import Reader from './pages/Reader.jsx';
import Admin from './pages/Admin.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AllSeries from './pages/AllSeries.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

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

function AppContent() {
  const [authModal, setAuthModal] = useState(null);
  const { maintenanceMode } = useApp();
  const { user, isOwner } = useAuth();

  // ── Global Stability Listeners ──────────────────────────────────────
  useEffect(() => {
    const handleError = (e) => {
      console.error("[KOZMİK ÇÖKME]", e);
      // Small delay to allow the error to settle, then reload if critical
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
  
  // Bakım modundayken, eğer giriş yapan kişi BAŞ ADMİN DEĞİLSE ekranı kapat
  const isMaintenanceBlocked = maintenanceMode && !isOwner;

  return (
    <>
      <BrowserRouter>
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
        </div>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </AppProvider>
  );
}
