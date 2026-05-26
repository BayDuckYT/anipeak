import { Suspense, lazy, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Zap, Lock, Wrench, Calendar, Clock, Instagram } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { PerformanceProvider } from './context/PerformanceContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import GlobalEffects from './components/GlobalEffects.jsx';
import Loader from './components/Loader.jsx';
import XPToast from './components/XPToast.jsx';

// ANIPEAK_SİBER_GÜNCELLEME_V3_1741
import ScrollToTop from './components/ScrollToTop.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Ana sayfa için LCP optimizasyonu: Eager (direkt) yükleme, lazy değil
import Home from './pages/Home.jsx';

// Diğer sayfalar Lazy Loaded
const ManhwaDetail = lazy(() => import('./pages/ManhwaDetail.jsx'));
const Reader = lazy(() => import('./pages/Reader.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const ProfileShowcase = lazy(() => import('./pages/ProfileShowcase.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const Wallet = lazy(() => import('./pages/Wallet.jsx'));
const AllSeries = lazy(() => import('./pages/AllSeries.jsx'));
const StaticPage = lazy(() => import('./pages/StaticPage.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Suggestions = lazy(() => import('./pages/Suggestions.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));

const EliteUpgrade = lazy(() => import('./pages/EliteUpgrade.jsx'));
const ListDetail = lazy(() => import('./pages/ListDetail.jsx'));
const Achievements = lazy(() => import('./pages/Achievements.jsx'));
const SchedulePage = lazy(() => import('./pages/SchedulePage.jsx'));
const OraclePage = lazy(() => import('./pages/OraclePage.jsx'));
const PopularityPage = lazy(() => import('./pages/PopularityPage.jsx'));
const AetheSanctuary = lazy(() => import('./pages/AetheSanctuary.jsx'));
const HouseInfo = lazy(() => import('./pages/HouseInfo.jsx'));
const AuraMarket = lazy(() => import('./pages/AuraMarket.jsx'));

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

// Global olarak tetiklenen Auth ekranlarını yöneten ve yönlendiren gizli bileşen
import { useNavigate } from 'react-router-dom';
function GlobalAuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOpenAuth = (e) => {
      const mode = e.detail || 'login';
      const nextPath = location.pathname !== '/auth' ? location.pathname + location.search : '/';
      navigate(`/auth?mode=${mode}&next=${encodeURIComponent(nextPath)}`);
    };
    window.addEventListener('open-auth', handleOpenAuth);
    return () => window.removeEventListener('open-auth', handleOpenAuth);
  }, [navigate, location]);

  return null;
}

function AnimatedRoutes({ onAuthOpen }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="sync" initial={false}>
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
          <Route path="/cuzdan" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/oneriler" element={<Suggestions />} />

          <Route path="/elite-upgrade" element={<EliteUpgrade />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/takvim" element={<SchedulePage />} />
          <Route path="/oracle" element={<OraclePage />} />
          <Route path="/popular" element={<PopularityPage />} />
          <Route path="/aethe-sanctuary" element={<AetheSanctuary />} />
          <Route path="/haneler" element={<HouseInfo />} />
          <Route path="/market" element={<PrivateRoute><AuraMarket /></PrivateRoute>} />
          <Route path="/:username/liste/:listId" element={<ListDetail />} />
          <Route path="/:slug" element={<StaticPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function MaintenanceScreen({ onAuthOpen }) {
  return (
    <div className="min-h-screen bg-[#070511] relative overflow-hidden font-sans flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://wsrv.nl/?url=https://anipeak.com.tr/bakim_arkaplan.png&w=1920&output=webp" 
          alt="Bakım" 
          onError={(e) => { e.target.onerror = null; e.target.src = "/yayınarkaplan.jpg" }}
          className="w-full h-full object-cover object-right lg:object-center"
        />
      </div>

      {/* Gradient Overlay for Text Readability - Matches the soft lavender fade */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#DFD7F5] via-[#DFD7F5]/90 to-transparent lg:w-[65%] w-full" />

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 lg:px-12 lg:pt-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="https://wsrv.nl/?url=https://anipeak.com.tr/anipeaklogo.png&w=320&output=webp" 
            alt="AniPeak Logo" 
            className="h-28 w-auto object-contain" 
            style={{ 
              filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.4))' 
            }} 
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onAuthOpen('login')} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#130E26]/90 backdrop-blur-md border border-[#6D28D9]/50 text-white font-semibold text-sm hover:bg-[#130E26] hover:border-[#6D28D9] transition-all"
          >
            <Lock size={16} className="text-[#8B5CF6]" /> Yetkili Girişi
          </button>
          
          <a href="https://discord.gg/anipeak" target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#130E26]/90 backdrop-blur-md border border-[#6D28D9]/50 text-white hover:bg-[#130E26] hover:border-[#6D28D9] transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
               <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
          
          <a href="https://instagram.com/anipeak" target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#130E26]/90 backdrop-blur-md border border-[#6D28D9]/50 text-white hover:bg-[#130E26] hover:border-[#6D28D9] transition-all">
            <Instagram size={20} />
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full px-6 lg:px-20 max-w-7xl mx-auto flex flex-col justify-center h-full">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#E5D5F5] border border-[#D5C1ED] text-[#6D3DF5] font-semibold text-sm mb-6 shadow-sm">
            <div className="text-[#6D28D9]">
               <Wrench size={16} />
            </div>
            <span className="text-[#6D28D9]">Bakımda</span>
            <div className="w-2 h-2 rounded-full bg-[#6D28D9] ml-1" />
          </div>

          {/* Heading */}
          <h1 
            style={{ fontFamily: "'Clash Display', sans-serif" }}
            className="text-6xl md:text-7xl font-bold text-[#070511] tracking-tight leading-[1.1] mb-6"
          >
            Sitemiz şu anda <br />
            <span className="text-[#6D3DF5]">bakımda.</span>
          </h1>

          {/* Paragraph */}
          <p className="text-[#475569] text-[1.1rem] font-medium leading-relaxed mb-10 max-w-lg">
            Daha iyi bir deneyim sunabilmek için sitemizde güncelleme çalışmaları yapıyoruz. 
            Kısa süre içinde geri döneceğiz.
          </p>

          {/* Calendar Card */}
          <div className="inline-flex items-center gap-6 p-5 pr-14 rounded-2xl bg-[#1E1B3A] text-white shadow-xl shadow-purple-900/10 border border-white/5">
            <div className="w-14 h-14 rounded-xl bg-[#312759] flex items-center justify-center relative">
              <Calendar size={28} className="text-[#A78BFA]" strokeWidth={1.5} />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#8B5CF6] border-[3px] border-[#1E1B3A] flex items-center justify-center">
                <Clock size={12} className="text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-400 text-sm font-medium mb-0.5">Açılış Yılımız</span>
              <span className="text-3xl font-bold tracking-tight">2026</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Copy */}
      <div className="absolute bottom-6 left-6 lg:left-12 z-20 flex items-center gap-3 text-[#475569] text-sm font-medium">
        <svg width="16" height="16" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
            <path d="M20 4L4 32H13.6L20 20.8L26.4 32H36L20 4Z" fill="#6D3DF5"/>
            <path d="M20 20.8L13.6 32H26.4L20 20.8Z" fill="#3B82F6"/>
            <path d="M11 20L4 32H11L14.5 26L11 20Z" fill="#3B82F6"/>
            <path d="M29 20L36 32H29L25.5 26L29 20Z" fill="#3B82F6"/>
        </svg>
        <span>© 2026 AniPeak. Tüm hakları saklıdır.</span>
      </div>
    </div>
  );
}



function AppContent() {
  const { maintenanceMode } = useApp();
  const { user, loading, isAdmin, isTester } = useAuth();

  const handleAuthEvent = (mode) => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: mode }));
  };

  // ── Global Stability Listeners ──────────────────────────────────────────
  useEffect(() => {
    const handleError = (e) => {
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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GlobalAuthHandler />
        <ScrollToTop />
        <GlobalEffects />
        <XPToast />

        <main id="main-content" className="min-h-screen bg-[#070511]">
          {isMaintenanceBlocked ? (
            <MaintenanceScreen onAuthOpen={handleAuthEvent} />
          ) : (
            <>
              {maintenanceMode && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 to-red-900 border-b border-red-500/50 text-white text-xs font-black py-1.5 uppercase tracking-widest shadow-lg overflow-hidden flex items-center">
                   <div className="w-full overflow-hidden whitespace-nowrap relative">
                     <div className="inline-block animate-[marquee-slide_15s_linear_infinite] drop-shadow-md">
                       <span className="mx-4">🚨 SİSTEM BAKIMDA 🚨</span>
                       <span className="mx-4">• SADECE YETKİLİ & TESTER MODU AKTİF •</span>
                       <span className="mx-4">LÜTFEN YAPTIĞINIZ DEĞİŞİKLİKLERE DİKKAT EDİNİZ</span>
                       <span className="mx-4">🚨 SİSTEM BAKIMDA 🚨</span>
                     </div>
                   </div>
                </div>
              )}
              <div className={(maintenanceMode ? "pt-7 " : "") + "portal-transition"}>
                 <Header onAuthOpen={handleAuthEvent} />
                 <ErrorBoundary mini>
                   <AnimatedRoutes onAuthOpen={handleAuthEvent} />
                   <Footer />
                 </ErrorBoundary>
              </div>
            </>
          )}
        </main>
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
