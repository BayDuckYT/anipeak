import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Compass, TrendingUp, Shield, LogIn, UserPlus,
  Menu, X, Bell, Search, User, Settings, LogOut, Library,
  ChevronDown, Crown, CheckCheck, Zap, SendHorizontal, Award, Calendar, Star, Ghost, Sparkles, Gem, Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import AnimeAvatar from './AnimeAvatar.jsx';
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

  const { user, logout, notifications, markAllRead, unreadCount, calculateTitle } = useAuth();
  const { series, plans } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

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
    const q = searchQuery.toLowerCase();
    const results = series.filter(s => !s.isDeleted).filter((m) => {
      const titleMatches = m.title && m.title.toLowerCase().includes(q);
      const authorMatches = m.author && m.author.toLowerCase().includes(q);
      const docGenres = Array.isArray(m.genre) ? m.genre : m.genre ? [m.genre] : [];
      const genreMatches = docGenres.some(g => typeof g === 'string' && g.toLowerCase().includes(q));
      return titleMatches || authorMatches || genreMatches;
    }).slice(0, 5);
    setSearchResults(results);
  }, [searchQuery, series]);

  const handleSearchSelect = (id) => {
    navigate(`/manhwa/${id}`);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

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
    if (user?.is_elite) {
      e.preventDefault();
      alert('Premium üyeliğiniz zaten aktif! Sınırsız gücün tadını çıkarın. 🔥');
    }
  };

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-white/10 shadow-lg shadow-purple-900/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center group flex-shrink-0 relative">
            <div className="relative">
              <img 
                src="/anipeaklogo.png" 
                alt="AniPeak Logo" 
                className="h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-0.5" 
                style={{ 
                  filter: 'hue-rotate(270deg) brightness(1.2) drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))' 
                }} 
              />
            </div>
          </Link>


          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Ana navigasyon">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${location.pathname === '/' && location.hash !== '#trendler' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:text-purple-400 hover:bg-purple-500/10'}`}>
              <Compass size={16} /> Keşfet
            </Link>
            <Link to="/#trendler" className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${location.hash === '#trendler' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:text-purple-400 hover:bg-purple-500/10'}`}>
              <TrendingUp size={16} /> Trendler
            </Link>
            <Link 
              to="/takvim"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all uppercase"
            >
              <Calendar size={16} className="text-indigo-400" /> Takvim
            </Link>
            <Link 
              to="/oracle"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${location.pathname === '/oracle' ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30' : 'text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
            >
              <Sparkles size={16} className="text-cyan-400" /> Oracle
            </Link>
            <Link 
              to="/elite-upgrade" 
              onClick={handlePremiumClick}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-black transition-all energy-pulse ${
                location.pathname === '/elite-upgrade' 
                  ? (activePlan ? `text-${activePlan.color}-400 bg-${activePlan.color}-500/10 border border-${activePlan.color}-500/30` : 'text-red-400 bg-red-500/10 border border-red-500/30')
                  : 'text-slate-300 hover:text-red-400 hover:bg-red-500/10'
              }`}
            >
              {getPlanIcon(activePlan)} <span className="hidden xl:inline">{activePlan ? activePlan.name : 'Premium'}</span>
            </Link>
          </nav>


          {/* Search bar (inline) */}
          <div className="hidden md:flex flex-1 max-w-xs relative">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Manhwa ara..."
                aria-label="Manhwa arama"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_8px_rgba(168,85,247,0.3)] transition-all"
              />
            </div>
            {/* Search results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full mt-2 left-0 right-0 glass-strong border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                >
                  {searchResults?.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSearchSelect(m.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <img 
                        src={getOptimizedImage(m?.cover, 100)} 
                        alt={m?.title || 'Seri kapağı'} 
                        onError={handleImageError}
                        width={32}
                        height={40}
                        decoding="async"
                        className="w-8 h-10 rounded-lg object-cover flex-shrink-0" 
                      />
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{m?.title}</p>
                        <p className="text-slate-400 text-[10px] truncate">
                          {Array.isArray(m?.genre) ? m.genre.join(', ') : m?.genre || 'Genel'}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Admin */}
            <Link to="/admin" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-all" aria-label="Yönetim panelini aç">
              <Shield size={16} /> <span className="hidden xl:inline">Yönetim Paneli</span>
            </Link>


          {/* Notifications Bell - Always Visible */}
          <div className="relative" ref={notifRef}>
            <button
              aria-label="Bildirimler"
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && user) markAllRead(); }}
              className="relative p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
            >
              <Bell size={18} />
              {user && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
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
                  className="absolute right-0 top-full mt-2 w-80 glass-strong border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                >
                  <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                    <span className="text-white text-sm font-bold">Bildirimler</span>
                    {user && (
                      <button onClick={markAllRead} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        <CheckCheck size={12} /> Tümü Okundu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {user ? (
                      notifications?.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors ${!n.read ? 'bg-purple-500/5' : ''}`}>
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-purple-400' : 'bg-slate-700'}`} />
                            <div className="min-w-0">
                              <p className="text-slate-300 text-xs leading-relaxed">{n?.text}</p>
                              <p className="text-slate-400 text-[10px] mt-1">{n?.time}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-slate-500 text-xs">Henüz bildirim yok.</div>
                      )
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <Bell size={28} className="text-purple-400 mx-auto mb-3 opacity-60" />
                        <p className="text-slate-300 text-xs font-semibold mb-1">Bildirimleri görmek için giriş yap</p>
                        <p className="text-slate-500 text-[10px] mb-4">Yeni bölüm ve duyurulardan haberdar ol!</p>
                        <button
                          onClick={() => { setNotifOpen(false); onAuthOpen('login'); }}
                          className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                        >
                          Giriş Yap
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <>
              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                  aria-label="Profil menüsünü aç"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-neon-purple relative flex-shrink-0">
                    <AnimeAvatar 
                      src={user.avatar_url ? getOptimizedImage(user.avatar_url, 100) : null} 
                      effect={userEffect}
                      size="w-8 h-8"
                      forcePlay={true}
                    />
                    {!user.avatar_url && !userEffect && <span className="absolute z-10">{avatarLetter}</span>}
                  </div>
                    <div className="hidden sm:flex flex-col items-start justify-center">
                      <p className={`text-[11px] font-black leading-tight uppercase tracking-tighter flex items-center gap-1 ${
                        user.rankStyle === 'elite-gold-glow' ? 'elite-gold-glow' : 
                        user.rank === 'Manga Hükümdarı' ? 'rank-glow-purple' : 'text-white'
                      }`}>
                        {['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester'].includes(user.role) && <Gem size={10} className="text-cyan-400 animate-pulse" />}
                        {user.username}
                      </p>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-0.5 mt-0.5 ${user.rankStyle === 'elite-gold-glow' ? 'elite-gold-glow opacity-80' : 'text-slate-500'}`}>
                        {user.is_elite && <Crown size={8} className="text-amber-400" />}
                        {user.rank}
                      </span>
                    </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 glass-strong border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-white/8 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-purple-500/20 relative">
                            <AnimeAvatar 
                              src={user.avatar_url ? getOptimizedImage(user.avatar_url, 100) : null} 
                              effect={userEffect}
                              size="w-10 h-10"
                              forcePlay={true}
                            />
                            {!user.avatar_url && !userEffect && <span className="absolute z-10">{avatarLetter}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black truncate uppercase tracking-tighter text-white">
                               {user.username}
                             </p>
                             <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${user.rankStyle === 'elite-gold-glow' ? 'elite-gold-glow opacity-80' : 'text-purple-400'}`}>
                                {user.is_elite && <Crown size={10} className="text-amber-400" />}
                                {['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester'].includes(user.role) && <Gem size={10} className="text-cyan-400 animate-pulse" />}
                                {user.rank}
                              </span>
                               <span className="w-1 h-1 rounded-full bg-slate-700" />
                               <span className="text-[9px] font-bold text-slate-400 uppercase">XP: {user.xp || 0}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* XP Progress Mini Bar */}
                        <div className="mt-3">
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min((user.xp || 0) / 15, 100)}%` }}
                               className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                             />
                          </div>
                        </div>
                      </div>

                      <div className="p-1.5">
                        <Link
                          to={`/profil/${user.username}`}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <User size={15} className="text-purple-400 group-hover:scale-110 transition-transform" />
                          Profilim
                        </Link>
                        <Link
                          to="/cuzdan"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <div className="flex items-center gap-3">
                            <Wallet size={15} className="text-pink-400 group-hover:scale-110 transition-transform" />
                            Cüzdanım
                          </div>
                          <div className="flex items-center gap-1.5 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
                            <span className="text-[10px] font-black text-pink-400">AURA</span>
                            <span className="text-xs font-bold text-white">{user.aura ? user.aura.toLocaleString('tr-TR') : '0'}</span>
                          </div>
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <Library size={15} className="text-blue-400 group-hover:scale-110 transition-transform" />
                          Okuduklarım
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <Settings size={15} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                          Ayarlar
                        </Link>
                        <Link
                          to="/achievements"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
                        >
                          <Award size={15} className="text-amber-400 group-hover:scale-110 transition-transform" />
                          Başarımlar
                        </Link>
                      </div>

                      <div className="p-1.5 border-t border-white/8">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm"
                        >
                          <LogOut size={15} />
                          Çıkış Yap
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => onAuthOpen('login')}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all energy-pulse min-h-[44px]"
                aria-label="Giriş yap"
              >
                <LogIn size={15} /> Giriş
              </button>
              <button
                onClick={() => onAuthOpen('register')}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple energy-pulse min-h-[44px]"
                aria-label="Ücretsiz kayıt ol"
              >
                <UserPlus size={15} /> Kayıt Ol
              </button>

            </>
          )}

            {/* Mobile toggle */}
            <button
              aria-label="Menü"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden glass border-t border-white/10 px-4 py-4 space-y-2"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 glass-strong border border-white/10 rounded-xl overflow-hidden z-50">
                    {searchResults.map((m) => (
                      <button key={m.id} onClick={() => handleSearchSelect(m.id)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left">
                        <img src={m.cover} alt={m.title || 'Seri kapağı'} width={28} height={36} decoding="async" className="w-7 h-9 rounded object-cover" />
                        <span className="text-white text-xs truncate">{m.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-purple-400 hover:bg-purple-500/10 transition-all min-h-[44px]"><Compass size={16} /> Keşfet</Link>

              <Link to="/elite-upgrade" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all min-h-[44px]"><Crown size={16} /> Premium</Link>
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all min-h-[44px]"><Shield size={16} /> Yönetim Paneli</Link>
              <Link to="/achievements" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all min-h-[44px]"><Award size={16} /> Başarımlar</Link>
              <Link 
                to="/takvim"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 transition-all uppercase min-h-[44px]"
              >
                <Calendar size={16} /> Yayın Takvimi
              </Link>
              <Link 
                to="/oracle"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-black text-cyan-400 hover:bg-cyan-500/10 transition-all uppercase min-h-[44px]"
              >
                <Sparkles size={16} /> Oracle
              </Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-all min-h-[44px]"><Library size={16} /> Okuduklarım</Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all min-h-[44px]"><LogOut size={16} /> Çıkış Yap</button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { onAuthOpen('login'); setMobileOpen(false); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-300 border border-white/10 min-h-[44px]">Giriş Yap</button>
                  <button onClick={() => { onAuthOpen('register'); setMobileOpen(false); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white min-h-[44px]">Kayıt Ol</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
