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
import NotificationToast from './components/NotificationToast.jsx';
import MaintenanceScreen from './components/MaintenanceScreen.jsx';

// MAHORAPEAK_SİBER_GÜNCELLEME_V3_1741
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
const GuidePage = lazy(() => import('./pages/GuidePage.jsx'));
const AuraMarket = lazy(() => import('./pages/AuraMarket.jsx'));
const AppsPage = lazy(() => import('./pages/AppsPage.jsx'));

// Role-based Route Protection
function AdminRoute({ children }) {
  const { isEditor, isMod, loading } = useAuth();
  if (loading) return <Loader />;
  return (isEditor || isMod) ? children : <Navigate to="/" />;
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
      <Suspense fallback={<Loader fullScreen={true} text="Sayfa Yükleniyor..." />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home onAuthOpen={onAuthOpen} />} />
          <Route path="/all-series" element={<AllSeries />} />
          <Route path="/manga/:slug" element={<ManhwaDetail onAuthOpen={onAuthOpen} />} />
          <Route path="/manga/:slug/:chapterSlug" element={<Reader />} />
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
          <Route path="/rehber" element={<GuidePage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/haneler" element={<Navigate to="/rehber" replace />} />
          <Route path="/market" element={<PrivateRoute><AuraMarket /></PrivateRoute>} />
          <Route path="/:username/liste/:listId" element={<ListDetail />} />
          <Route path="/indir" element={<AppsPage />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/uygulama" element={<AppsPage />} />
          <Route path="/:slug" element={<StaticPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}



function AppContent() {
  const { maintenanceMode } = useApp();
  const { user, loading, isAdmin, isTester, isMod } = useAuth();
  const location = useLocation();

  const handleAuthEvent = (mode) => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: mode }));
  };

  // ── Global Stability Listeners ──────────────────────────────────────────
  // Not: Chunk reload mantığı artık main.jsx'te merkezi olarak yönetiliyor.
  // Burada sadece beklenmeyen hataları sessizce yakalıyoruz ki site çökmesin.
  useEffect(() => {
    const handleError = (e) => {
      // Güvenli mesaj çıkarma — mobilde e.message veya e.reason undefined olabilir
      let msg = '';
      try {
        msg = (e.message || e.reason?.message || e.reason?.toString() || '').toLowerCase();
      } catch (err) {
        msg = '';
      }
      
      // ResizeObserver hatalarını yoksay (zararsız, özellikle Safari/mobilde)
      if (msg.includes('resizeobserver')) {
        e.preventDefault?.();
        return;
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
    if (isAdmin || isTester || isMod) return;

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
  }, [isAdmin, isTester, isMod]);
  
  // Global loading kaldırıldı, çünkü Home sayfası anında yüklenmeli. PrivateRoute'lar kendi loading state'ini yönetiyor.

  // Bakım modundayken, eğer giriş yapan kişi YETKİLİ DEĞİLSE ekranı kapat
  const isResetPage = location.pathname === '/reset-password';
  const isAuthPage = location.pathname === '/auth';
  const isMaintenanceBlocked = maintenanceMode && !isAdmin && !isTester && !isMod && !isResetPage && !isAuthPage;

  return (
    <>
        <GlobalAuthHandler />
        <ScrollToTop />
        <GlobalEffects />
        <XPToast />
        <NotificationToast />

        <main id="main-content" className="min-h-screen bg-[#070511]">
          {isMaintenanceBlocked ? (
            <MaintenanceScreen onAuthOpen={handleAuthEvent} />
          ) : (
            <>
              {maintenanceMode && (
                 <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 to-red-900 border-b border-red-500/50 text-white text-[10px] md:text-xs font-black py-1.5 uppercase tracking-widest shadow-lg flex items-center justify-center">
                    <div className="flex items-center justify-center text-center drop-shadow-md w-full px-4">
                        <span className="truncate">🚨 SİSTEM BAKIMDA - LÜTFEN YAPTIĞINIZ DEĞİŞİKLİKLERE DİKKAT EDİNİZ 🚨</span>
                    </div>
                 </div>
              )}
              {isAuthPage ? (
                // Sadece Auth sayfasını göster (Header ve Footer olmadan)
                <ErrorBoundary mini>
                  <AnimatedRoutes onAuthOpen={handleAuthEvent} />
                </ErrorBoundary>
              ) : (
                <>
                  <Header onAuthOpen={handleAuthEvent} />
                  <div className={(maintenanceMode ? "pt-7 " : "") + "portal-transition"}>
                    <ErrorBoundary mini>
                      <AnimatedRoutes onAuthOpen={handleAuthEvent} />
                      <Footer />
                    </ErrorBoundary>
                  </div>
                </>
              )}
            </>
          )}
        </main>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PerformanceProvider>
        <AppProvider>
          <AuthProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </AppProvider>
      </PerformanceProvider>
    </ErrorBoundary>
  );
}
