import { Suspense, lazy, useState, useEffect } from 'react';
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
import Loader from './components/Loader.jsx';

// ANIPEAK_SİBER_GÜNCELLEME_V3_1741
import ScrollToTop from './components/ScrollToTop.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home.jsx'));
const ManhwaDetail = lazy(() => import('./pages/ManhwaDetail.jsx'));
const Reader = lazy(() => import('./pages/Reader.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const ProfileShowcase = lazy(() => import('./pages/ProfileShowcase.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const AllSeries = lazy(() => import('./pages/AllSeries.jsx'));
const StaticPage = lazy(() => import('./pages/StaticPage.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Suggestions = lazy(() => import('./pages/Suggestions.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'));
const EliteUpgrade = lazy(() => import('./pages/EliteUpgrade.jsx'));
const ListDetail = lazy(() => import('./pages/ListDetail.jsx'));
const Achievements = lazy(() => import('./pages/Achievements.jsx'));
const SchedulePage = lazy(() => import('./pages/SchedulePage.jsx'));
const OraclePage = lazy(() => import('./pages/OraclePage.jsx'));
const GlobalNexus = lazy(() => import('./pages/GlobalNexus.jsx'));

// Role-based Route Protection
function AdminRoute({ children }) {
  const { isEditor, loading } = useAuth();
  if (loading) return <Loader />;
  return isEditor ? children : <Navigate to="/" />;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/" />;
}

function ProfileRedirect() {
  const { user } = useAuth();
  return <Navigate to={`/profil/${user?.username}`} replace />;
}

function AnimatedRoutes({ onAuthOpen }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<Loader fullScreen={false} text="Sayfa Yükleniyor..." />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home onAuthOpen={onAuthOpen} />} />
          <Route path="/all-series" element={<AllSeries />} />
          <Route path="/manhwa/:id" element={<ManhwaDetail onAuthOpen={onAuthOpen} />} />
          <Route path="/read/:id/:chapter" element={<Reader />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfileRedirect /></PrivateRoute>} />
          <Route path="/profil/:username" element={<ProfileShowcase />} />
          <Route path="/@:username" element={<ProfileShowcase />} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/oneriler" element={<Suggestions />} />
          <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
          <Route path="/elite-upgrade" element={<EliteUpgrade />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/takvim" element={<SchedulePage />} />
          <Route path="/oracle" element={<OraclePage />} />
          <Route path="/global-nexus" element={<GlobalNexus />} />
          <Route path="/:username/liste/:listId" element={<ListDetail />} />
          <Route path="/:slug" element={<StaticPage />} />
        </Routes>
      </Suspense>
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
  const { user, loading, isAdmin, isTester } = useAuth();

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

  // ── DevTools & Right-Click Security (Anti-Inspect) ──────────────────
  useEffect(() => {
    // SADECE YETKİLİLER (Admin, Editor, Tester) İNCELEME YAPABİLİR
    if (isAdmin || isTester) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdmin, isTester]);
  
  // Global loading kaldırıldı, çünkü Home sayfası anında yüklenmeli. PrivateRoute'lar kendi loading state'ini yönetiyor.

  // Bakım modundayken, eğer giriş yapan kişi YETKİLİ DEĞİLSE ekranı kapat
  const isResetPage = window.location.pathname === '/reset-password';
  const isMaintenanceBlocked = maintenanceMode && !isAdmin && !isTester && !isResetPage;

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <GlobalEffects />

        <div id="main-content" className="min-h-screen bg-[#050507]">
          {isMaintenanceBlocked ? (
            <MaintenanceScreen onAuthOpen={(mode) => setAuthModal(mode)} />
          ) : (
            <>
              {maintenanceMode && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 to-red-900 border-b border-red-500/50 text-white text-xs font-black py-1.5 uppercase tracking-widest shadow-lg overflow-hidden flex items-center">
                   <marquee scrollamount="8" className="w-full drop-shadow-md">
                     🚨 SİSTEM BAKIMDA 🚨 • SADECE YETKİLİ & TESTER MODU AKTİF • LÜTFEN YAPTIĞINIZ DEĞİŞİKLİKLERE DİKKAT EDİNİZ • 🚨 SİSTEM BAKIMDA 🚨
                   </marquee>
                </div>
              )}
              <div className={(maintenanceMode ? "pt-7 " : "") + "portal-transition"}>
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
