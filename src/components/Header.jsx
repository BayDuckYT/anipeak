import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Compass, TrendingUp, Shield, LogIn, UserPlus,
  Menu, X, Bell, Search, User, Settings, LogOut, Library,
  ChevronDown, ChevronRight, Crown, CheckCheck, Zap, SendHorizontal, Award, Calendar, Star, Ghost, Sparkles, Gem, Wallet, ShoppingCart,
  Smartphone, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import AnimeAvatar from './AnimeAvatar.jsx';
import NotificationCenter from './NotificationCenter.jsx';
import effectsData from '../data/effects.json';
import { getOptimizedImage, handleImageError } from '../utils/imageOpt.js';

export default function Header({ onAuthOpen }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { user, logout, notifications, markAllRead, markNotificationRead, unreadCount, calculateTitle, isEditor, isMod } = useAuth();
  const { series, plans } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  // Mobil menü açıkken arka plan scroll'unu kilitle
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!searchOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => searchInputRef.current?.focus());

    const handleSearchKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleSearchKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleSearchKeyDown);
    };
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live search
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const q = searchQuery.toLocaleLowerCase('tr-TR');
    const results = series.filter(s => !s.isDeleted).filter((m) => {
      const titleMatches = m.title && m.title.toLocaleLowerCase('tr-TR').includes(q);
      const authorMatches = m.author && m.author.toLocaleLowerCase('tr-TR').includes(q);
      const docGenres = Array.isArray(m.genre) ? m.genre : m.genre ? [m.genre] : [];
      const genreMatches = docGenres.some(g => typeof g === 'string' && g.toLocaleLowerCase('tr-TR').includes(q));
      return titleMatches || authorMatches || genreMatches;
    }).slice(0, 5);
    setSearchResults(results);
  }, [searchQuery, series]);

  const handleSelect = (slug) => {
    navigate(`/manga/${slug}`);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const suggestedSeries = series.filter(item => !item.isDeleted).slice(0, 6);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const avatarLetter = user?.username?.[0]?.toUpperCase() || 'U';
  
  // Bulunabilen aktif efekti getir
  const userEffect = (user?.active_mix?.avatar || user?.active_decoration) && (user?.active_mix?.avatar !== 'none' && user?.active_decoration !== 'none')
    ? effectsData.find(e => e.id === (user?.active_mix?.avatar || user?.active_decoration)) 
    : null;

  // Bulunabilen aktif isim efekti (nametag)
  const nameEffectId = user?.active_mix?.nametag || user?.active_name_effect;
  const userNameEffect = nameEffectId && nameEffectId !== 'none'
    ? effectsData.find(e => e.id === nameEffectId)
    : null;
  const nameTagHue = user?.active_mix?.nametagHue || 0;

  // Bulunabilen aktif isimlik (nameplate video)
  const rawNameplate = user?.active_mix?.nameplate;
  const userNameplate = rawNameplate && rawNameplate !== 'none'
    ? rawNameplate.replace('nameplate_', '')
    : null;
    
  // Aktif plan ikonunu getir
  const activePlan = user?.is_elite && user.active_plan_id 
    ? plans.find(p => p.id === user.active_plan_id) 
    : null;

  const getPlanIcon = (plan) => {
    if (!plan) return <Crown size={15} className="text-red-500" />;
    const props = { size: 15, className: `text-${plan.color || 'red'}-500` };
    switch (plan.icon) {
      case 'Zap': return <Zap {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'Ghost': return <Ghost size={15} className="text-purple-400" />;
      case 'Star': return <Star {...props} />;
      default: return <Crown {...props} />;
    }
  };

  const handlePremiumClick = (e) => {
    // Sadece /elite-upgrade sayfasına yönlendirmesi için e.preventDefault ve alert kaldırıldı.
  };

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none"
    >
      {/* Dynamic Header Capsule Bar */}
      <div
        className={`pointer-events-auto transition-all duration-500 ease-out flex items-center justify-between ${
          scrolled
            ? 'mt-2 sm:mt-3 md:mt-3.5 w-[96%] max-w-[1380px] h-[60px] sm:h-[72px] md:h-[76px] px-3 sm:px-7 md:px-8 rounded-full border border-white/12 bg-black/55 backdrop-blur-2xl shadow-[0_16px_45px_rgba(0,0,0,0.7)]'
            : 'mt-0 w-full h-[72px] sm:h-24 px-3 sm:px-10 lg:px-12 rounded-none border-b border-transparent bg-transparent backdrop-blur-none shadow-none'
        }`}
      >
        {/* Left: Prominent, Large & Readable Logo */}
        <Link 
          to="/" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center group flex-shrink-0 relative mr-1 sm:mr-4 md:mr-8"
          aria-label="Ana Sayfa"
        >
          <div className="relative flex items-center">
            <img 
              src="https://wsrv.nl/?url=https://mahorapeak.com.tr/mahorapeaklogov2.png&w=500&output=webp&q=95" 
              alt="MahoraPeak Logo" 
              width="240"
              height="80"
              loading="eager"
              className={`w-auto object-contain transition-all duration-300 origin-left drop-shadow-[0_0_20px_rgba(239,68,68,0.55)] group-hover:drop-shadow-[0_0_30px_rgba(239,68,68,0.85)] ${
                scrolled
                  ? 'h-9 max-w-[112px] sm:h-14 sm:max-w-none md:h-16 scale-100 sm:scale-110 md:scale-120'
                  : 'h-9 max-w-[112px] sm:h-20 sm:max-w-none md:h-22 scale-100 sm:scale-125 md:scale-[1.38]'
              }`}
            />
          </div>
        </Link>

        {/* Center: Desktop Navigation with Icons, Generous Spacing & Glowing Active Underline */}
        <nav className="hidden lg:flex items-center gap-7 xl:gap-11" aria-label="Ana navigasyon">
          {[
            { label: 'Ana Sayfa', path: '/', icon: Compass, iconColor: 'text-red-500', isActive: location.pathname === '/' && !location.hash, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
            { label: 'Kütüphane', path: '/kutuphane', icon: BookOpen, iconColor: 'text-purple-400', isActive: location.pathname === '/kutuphane' || location.pathname === '/all-series' },
            { label: 'Takvim', path: '/takvim', icon: Calendar, iconColor: 'text-indigo-400', isActive: location.pathname === '/takvim' },
            { label: 'Rehber', path: '/rehber', icon: HelpCircle, iconColor: 'text-emerald-400', isActive: location.pathname === '/rehber' },
            { label: 'Oracle', path: '/oracle', icon: Sparkles, iconColor: 'text-cyan-400', isActive: location.pathname === '/oracle' },
            { label: 'Uygulama', path: '/indir', icon: Smartphone, iconColor: 'text-violet-400', isActive: location.pathname === '/indir' || location.pathname === '/apps' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={item.onClick}
                className="relative px-2 py-2 flex flex-col items-center group select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} className={`${item.isActive ? item.iconColor : 'text-slate-400 group-hover:' + item.iconColor} transition-colors duration-200`} />
                  <span className={`text-[15px] font-bold tracking-tight transition-colors duration-200 ${
                    item.isActive ? 'text-white font-extrabold' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {item.isActive && (
                  <motion.div
                    layoutId="header-active-line"
                    className="absolute -bottom-1.5 w-7 h-[2.5px] bg-[#e50914] rounded-full shadow-[0_0_10px_#e50914]"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-3">

          {/* Circular Search Toggle Button */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all active:scale-95"
              aria-label="Arama"
            >
              <Search size={17} />
            </button>

            <AnimatePresence>
              {searchOpen && createPortal((
                <motion.div
                  role="presentation"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeSearch();
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#030208]/[0.97] p-4 backdrop-blur-xl sm:p-6"
                >
                  <motion.section
                    role="dialog"
                    aria-modal="true"
                    aria-label="Seri ara"
                    initial={{ opacity: 0, y: 18, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onMouseDown={(event) => event.stopPropagation()}
                    className="flex max-h-[min(82dvh,720px)] w-full max-w-[640px] flex-col overflow-hidden rounded-[26px] border border-violet-500/35 bg-[#0d0917] shadow-[0_30px_100px_rgba(0,0,0,0.85),0_0_60px_rgba(124,58,237,0.14)]"
                  >
                    <div className="border-b border-white/[0.07] bg-[#0d0917] p-5 sm:p-6">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 className="flex items-center gap-3 text-base font-bold text-white sm:text-lg">
                          <Search size={19} className="text-cyan-400" /> MahoraPeak Kataloğunda Ara
                        </h2>
                        <button
                          type="button"
                          onClick={closeSearch}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-400 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
                          aria-label="Aramayı kapat"
                        >
                          <X size={17} />
                        </button>
                      </div>

                      <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-300" />
                        <input
                          ref={searchInputRef}
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Manga veya seri adı yaz..."
                          className="w-full rounded-2xl border border-cyan-400/30 bg-[#07050d] py-3.5 pl-12 pr-4 text-sm text-white shadow-inner outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/10"
                        />
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                      {searchQuery.trim().length < 2 ? (
                        <>
                          <p className="mb-3 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Önerilen seriler</p>
                          <div className="space-y-1">
                            {suggestedSeries.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelect(m.slug)}
                                className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/[0.05]"
                              >
                                <img
                                  src={getOptimizedImage(m?.cover, 120)}
                                  alt={m?.title || 'Seri kapağı'}
                                  onError={handleImageError}
                                  width={40}
                                  height={52}
                                  decoding="async"
                                  className="h-[52px] w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] font-bold text-slate-100 group-hover:text-cyan-200">{m?.title}</span>
                                  <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                                    <span>{Array.isArray(m?.genre) ? m.genre.join(', ') : m?.genre || 'Genel'}</span>
                                    {Number(m?.rating) > 0 && <><span>·</span><Star size={11} className="fill-amber-400 text-amber-400" /><span>{Number(m.rating).toFixed(1)}</span></>}
                                  </span>
                                </span>
                                <ChevronRight size={17} className="shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                              </button>
                            ))}
                          </div>
                        </>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Sonuçlar</p>
                          {searchResults.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelect(m.slug)}
                              className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-2.5 py-2.5 text-left transition hover:border-purple-400/20 hover:bg-purple-500/[0.09]"
                            >
                              <img
                                src={getOptimizedImage(m?.cover, 120)}
                                alt={m?.title || 'Seri kapağı'}
                                onError={handleImageError}
                                width={44}
                                height={58}
                                decoding="async"
                                className="h-[58px] w-11 shrink-0 rounded-xl border border-white/10 object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white group-hover:text-violet-200">{m?.title}</p>
                                <p className="mt-1 truncate text-xs text-slate-400">{Array.isArray(m?.genre) ? m.genre.join(', ') : m?.genre || 'Genel'}</p>
                                {m?.author && <p className="mt-0.5 truncate text-[11px] text-slate-500">{m.author}</p>}
                              </div>
                              <ChevronRight className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" size={17} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/[0.07] bg-black/15 px-5 py-8 text-center">
                          <p className="text-sm font-semibold text-slate-200">Bu aramayla eşleşen seri bulamadık.</p>
                          <p className="mt-1 text-xs text-slate-500">Başka bir ad veya yazım deneyebilirsin.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3 text-[10px] text-slate-500 sm:px-5">
                      <span>Arama · Başlık, yazar ve tür</span>
                      <span><kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-sans text-slate-300">Esc</kbd> ile kapat</span>
                    </div>
                  </motion.section>
                </motion.div>
              ), document.body)}
            </AnimatePresence>
          </div>

          {/* Admin Panel Button */}
          {(isEditor || isMod) && (
            <Link
              to="/admin"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
              aria-label="Yönetim panelini aç"
            >
              <Shield size={14} /> <span className="hidden xl:inline">Yönetim</span>
            </Link>
          )}

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              aria-label="Bildirimler"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all active:scale-95"
            >
              <Bell size={17} />
              {user && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                  {unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 z-50 shadow-2xl"
                >
                  <NotificationCenter
                    onClose={() => setNotifOpen(false)}
                    onAuthOpen={onAuthOpen}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile or Auth Buttons */}
          {user ? (
            <>
              {/* Premium Plan Pill */}
              <Link 
                to="/elite-upgrade" 
                onClick={handlePremiumClick}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                  activePlan 
                    ? `text-${activePlan.color || 'amber'}-300 bg-${activePlan.color || 'amber'}-500/10 border border-${activePlan.color || 'amber'}-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]`
                    : 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                }`}
              >
                {getPlanIcon(activePlan)}
                <span>{activePlan ? activePlan.name : '★ Premium'}</span>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 p-1 pr-2 sm:pr-2.5 rounded-full hover:bg-white/10 border border-white/10 hover:border-purple-500/40 bg-white/5 transition-all active:scale-95 flex-shrink-0"
                  aria-label="Profil menüsünü aç"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-red-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold relative flex-shrink-0 shadow-md">
                    <AnimeAvatar 
                      src={user.avatar_url ? getOptimizedImage(user.avatar_url, 100) : null} 
                      effect={userEffect}
                      size="w-8 h-8 sm:w-9 sm:h-9"
                      forcePlay={true}
                    />
                    {!user.avatar_url && !userEffect && <span className="absolute z-10">{avatarLetter}</span>}
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 group-hover:text-white transition-transform duration-200 ${profileOpen ? 'rotate-180 text-purple-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-3 w-64 sm:w-72 bg-[#0e0a1f] border border-purple-500/25 rounded-3xl overflow-hidden z-50 shadow-[0_20px_60px_rgba(0,0,0,0.95)]"
                    >
                      {/* User info header */}
                      <div className="relative px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-purple-950/60 via-[#140d2e] to-indigo-950/60 overflow-hidden">
                        {userNameplate && (
                          <video
                            src={`/nameplates/${userNameplate}`}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                          />
                        )}
                        <div className="relative z-10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg relative">
                              <AnimeAvatar 
                                src={user.avatar_url ? getOptimizedImage(user.avatar_url, 100) : null} 
                                effect={userEffect}
                                size="w-11 h-11"
                                forcePlay={true}
                              />
                              {!user.avatar_url && !userEffect && <span className="absolute z-10">{avatarLetter}</span>}
                            </div>
                            <div className="min-w-0">
                              <p 
                                className={`text-sm sm:text-base font-black truncate uppercase tracking-tight ${
                                  userNameEffect 
                                    ? 'name-effect-text drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' 
                                    : user.rankStyle === 'elite-gold-glow' 
                                    ? 'elite-gold-glow' 
                                    : user.baseRank === 'Mahora Hükümdarı' 
                                    ? 'rank-glow-purple' 
                                    : 'text-white'
                                }`}
                                style={userNameEffect ? { backgroundImage: `url(${userNameEffect.url})`, filter: `hue-rotate(${nameTagHue}deg)` } : {}}
                              >
                                {user.username}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${user.rankStyle === 'elite-gold-glow' ? 'elite-gold-glow opacity-90' : 'text-amber-400'}`}>
                                  {user.is_elite && <Crown size={10} className="text-amber-400 shrink-0" />}
                                  {['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester'].includes(user.role) && <Gem size={10} className="text-cyan-400 animate-pulse shrink-0" />}
                                  {user.rank}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">XP</span>
                            <span className="text-xs font-black text-purple-300 font-mono">{(user.xp || 0).toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                        
                        {/* XP Progress Bar */}
                        <div className="relative z-10 mt-3">
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(Math.max(((user.xp || 0) % 1000) / 10, 8), 100)}%` }}
                               className="h-full bg-gradient-to-r from-red-500 via-purple-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.7)]"
                             />
                          </div>
                        </div>
                      </div>

                      <div className="p-2 space-y-0.5">
                        <Link
                          to={`/profil/${user.username}`}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <User size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold">Profilim</span>
                        </Link>
                        <Link
                          to="/cuzdan"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <div className="flex items-center gap-3">
                            <Wallet size={16} className="text-pink-400 group-hover:scale-110 transition-transform" />
                            <span className="font-semibold">Cüzdanım</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
                            <span className="text-[9px] font-black text-pink-400 tracking-wider">AURA</span>
                            <span className="text-xs font-black text-white">{(user.aura || 0).toLocaleString('tr-TR')}</span>
                          </div>
                        </Link>
                        <Link
                          to="/market"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <ShoppingCart size={16} className="text-violet-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold">Aura Market</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <Library size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold">Okuduklarım</span>
                        </Link>
                        <Link
                          to="/achievements"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <Award size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold">Başarımlar</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <Settings size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold">Ayarlar</span>
                        </Link>
                      </div>

                      <div className="p-2 border-t border-white/8 bg-black/20">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-bold"
                        >
                          <LogOut size={16} />
                          Çıkış Yap
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onAuthOpen('login')}
                className="hidden md:inline-flex text-sm font-bold text-slate-200 hover:text-white px-3 py-2 transition-colors"
                aria-label="Giriş yap"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => onAuthOpen('register')}
                className="px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold bg-[#e50914] hover:bg-[#ff1a26] text-white shadow-[0_0_20px_rgba(229,9,20,0.5)] hover:shadow-[0_0_25px_rgba(229,9,20,0.7)] transition-all active:scale-95 flex items-center gap-1.5"
                aria-label="Üye ol"
              >
                <span>Üye Ol</span>
              </button>
              <Link
                to="/elite-upgrade"
                onClick={handlePremiumClick}
                className="px-4 py-2 rounded-full text-sm font-bold border border-amber-500/50 bg-black/40 hover:bg-amber-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span>Premium</span>
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button 
            className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 text-slate-200 hover:text-white transition-all active:scale-95 flex items-center justify-center ml-0 sm:ml-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Floating Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto lg:hidden w-[95%] max-w-md mt-2 rounded-3xl bg-[#080614]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-4 space-y-2 max-h-[80dvh] overflow-y-auto overscroll-contain touch-pan-y"
          >
            {/* Mobile search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Manhwa ara..."
                aria-label="Manhwa arama"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition-all"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 glass-strong border border-white/10 rounded-xl overflow-hidden z-50">
                  {searchResults.map((m) => (
                    <button key={m.id} onClick={() => { handleSelect(m.slug); setMobileOpen(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all group text-left min-h-[44px]">
                      <img src={getOptimizedImage(m?.cover, 100)} alt={m?.title || 'Seri kapağı'} width={28} height={36} decoding="async" loading="lazy" onError={handleImageError} className="w-7 h-9 rounded object-cover flex-shrink-0" />
                      <span className="text-white text-xs truncate">{m?.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
              <Compass size={16} className="text-red-500" /> Keşfet
            </Link>
            <Link to="/kutuphane" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
              <BookOpen size={16} className="text-purple-400" /> Kütüphane
            </Link>
            <Link to="/takvim" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
              <Calendar size={16} className="text-indigo-400" /> Takvim
            </Link>
            <Link to="/rehber" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
              <HelpCircle size={16} className="text-emerald-400" /> Rehber (XP & Bilgi)
            </Link>
            <Link to="/oracle" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
              <Sparkles size={16} className="text-cyan-400" /> Oracle
            </Link>
            <Link to="/indir" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
              <Smartphone size={16} className="text-violet-400" /> Uygulama
            </Link>
            <Link to="/elite-upgrade" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-amber-300 hover:bg-amber-500/10 transition-all min-h-[44px]">
              <Star size={16} className="text-amber-400 fill-amber-400" /> Premium Paketler
            </Link>
            {(isEditor || isMod) && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-400 hover:bg-amber-500/10 transition-all min-h-[44px]">
                <Shield size={16} /> Yönetim Paneli
              </Link>
            )}
            <Link to="/achievements" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
              <Award size={16} className="text-amber-400" /> Başarımlar
            </Link>

            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-all min-h-[44px]">
                  <Library size={16} className="text-blue-400" /> Okuduklarım
                </Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all min-h-[44px]">
                  <LogOut size={16} /> Çıkış Yap
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button onClick={() => { onAuthOpen('login'); setMobileOpen(false); }} className="flex-1 py-2.5 rounded-full text-sm font-bold text-slate-300 border border-white/10 hover:bg-white/5 min-h-[44px]">
                  Giriş Yap
                </button>
                <button onClick={() => { onAuthOpen('register'); setMobileOpen(false); }} className="flex-1 py-2.5 rounded-full text-sm font-black bg-[#e50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.5)] min-h-[44px]">
                  Kayıt Ol
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
