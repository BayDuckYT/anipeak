import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Compass, TrendingUp, Shield, LogIn, UserPlus,
  Menu, X, Bell, Search, User, Settings, LogOut, Library,
  ChevronDown, Crown, CheckCheck, Zap, MessageSquare, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Header({ onAuthOpen }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { user, logout, notifications, markAllRead, unreadCount, calculateTitle } = useAuth();
  const { series } = useApp();
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
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-neon-purple group-hover:scale-105 transition-transform">
                <BookOpen size={18} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse-glow" />
            </div>
            <span className="text-xl font-black tracking-tight">
              <span className="gradient-text">Ani</span>
              <span className="text-white">Peak</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/' && location.hash !== '#trendler' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:text-purple-400 hover:bg-purple-500/10'}`}>
              <Compass size={15} /> Keşfet
            </Link>
            <Link to="/#trendler" className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.hash === '#trendler' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:text-purple-400 hover:bg-purple-500/10'}`}>
              <TrendingUp size={15} /> Trendler
            </Link>
            <Link to="/citadel" className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname.startsWith('/citadel') ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:text-purple-400 hover:bg-purple-500/10'}`}>
              <Users size={15} /> Forum
            </Link>
            <Link to="/elite-upgrade" className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-black transition-all ${location.pathname === '/elite-upgrade' ? 'text-red-400 bg-red-500/10 border border-red-500/30' : 'text-slate-300 hover:text-red-400 hover:bg-red-500/10'}`}>
              <Crown size={15} className="text-red-500" /> Premium
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_8px_rgba(168,85,247,0.3)] transition-all"
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
                        src={m?.cover} 
                        alt={m?.title} 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/32x40?text='; }}
                        className="w-8 h-10 rounded-lg object-cover flex-shrink-0" 
                      />
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{m?.title}</p>
                        <p className="text-slate-500 text-[10px] truncate">
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
          <div className="flex items-center gap-1.5">
            {/* Admin */}
            <Link to="/admin" className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-all">
              <Shield size={14} /> <span className="hidden lg:inline">Yönetim Paneli</span>
            </Link>

          {/* Notifications Bell - Always Visible */}
          <div className="relative" ref={notifRef}>
            <button
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
                              <p className="text-slate-600 text-[10px] mt-1">{n?.time}</p>
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
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-neon-purple overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      avatarLetter
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-white text-xs font-semibold leading-tight">{user.username}</p>
                  </div>
                  <ChevronDown size={13} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-purple-500/20 overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              avatarLetter
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-black truncate uppercase tracking-tight">{user.username}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                               <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest">
                                 YENİ ÜYE
                               </span>
                               <span className="w-1 h-1 rounded-full bg-slate-700" />
                               <span className="text-[9px] font-bold text-slate-500 uppercase">XP: {user.xp || 0}</span>
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
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <LogIn size={15} /> Giriş
              </button>
              <button
                onClick={() => onAuthOpen('register')}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple"
              >
                <UserPlus size={15} /> Kayıt Ol
              </button>
            </>
          )}

            {/* Mobile toggle */}
            <button
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 glass-strong border border-white/10 rounded-xl overflow-hidden z-50">
                    {searchResults.map((m) => (
                      <button key={m.id} onClick={() => handleSearchSelect(m.id)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left">
                        <img src={m.cover} alt="" className="w-7 h-9 rounded object-cover" />
                        <span className="text-white text-xs truncate">{m.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-purple-400 hover:bg-purple-500/10 transition-all"><Compass size={16} /> Keşfet</Link>
              <Link to="/citadel" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-purple-400 hover:bg-purple-500/10 transition-all"><Users size={16} /> Forum</Link>
              <Link to="/elite-upgrade" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"><Crown size={16} /> Premium</Link>
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all"><Shield size={16} /> Yönetim Paneli</Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-all"><Library size={16} /> Okuduklarım</Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"><LogOut size={16} /> Çıkış Yap</button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { onAuthOpen('login'); setMobileOpen(false); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-300 border border-white/10">Giriş Yap</button>
                  <button onClick={() => { onAuthOpen('register'); setMobileOpen(false); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white">Kayıt Ol</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
