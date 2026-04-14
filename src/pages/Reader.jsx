import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Settings2, Sun, Moon,
  Maximize2, Minimize2, Home, Heart, MessageSquare, Send
} from 'lucide-react';
import { manhwaData, readerPages } from '../data/mockData.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';

function ReaderImage({ src, alt, idx, chapter }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full aspect-[2/3] bg-white/5 border border-white/10 flex flex-col items-center justify-center p-10 text-center">
        <Sun size={48} className="text-red-500/50 mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Resim Yüklenemedi</p>
        <p className="text-slate-600 text-xs mt-2 font-mono">Index: {idx + 1} | Cosmic Error</p>
      </div>
    );
  }

  const imageSrc = src?.startsWith('data:') ? src : `${src}?chapter=${chapter}`;

  return (
    <motion.img
      src={imageSrc}
      alt={alt}
      onError={() => setError(true)}
      loading={idx < 3 ? 'eager' : 'lazy'}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="w-full block select-none"
      style={{ display: 'block', lineHeight: 0 }}
    />
  );
}

export default function Reader() {
  const { id, chapter: chapterParam } = useParams();
  const navigate = useNavigate();
  const { user, addToHistory } = useAuth();
  const { series, chapters } = useApp();
  
  const handleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch(e) {}
  };
  
  const manhwaId = Number(id);
  const manhwa = series.find((m) => String(m.id) === String(id));
  const initialChapter = Number(chapterParam) || 1;

  const [chapter, setChapter] = useState(initialChapter);
  const [zenMode, setZenMode] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showPanel, setShowPanel] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([
    { id: 1, user: 'KaranlıkAvcı', text: 'Bu bölüm efsaneydi! Çizimler harika olmuş.', time: '2 saat önce', likes: 24, userLiked: false, role: 'Kullanıcı' },
    { id: 2, user: 'AnimeSever99', text: 'Sonraki bölümü sabırsızlıkla bekliyorum. Acaba ne olacak?', time: '5 saat önce', likes: 12, userLiked: false, role: 'Kullanıcı' },
    { id: 3, user: 'Yönetici', text: 'Okuduğum en iyi serilerden biri kesinlikle. İyi takipler!', time: '1 gün önce', likes: 188, userLiked: false, role: 'Yönetici' },
  ]);
  const [newComment, setNewComment] = useState('');

  const panelRef = useRef(null);
  const lastScrollY = useRef(0);

  // Update history when chapter changes
  useEffect(() => {
    if (user) {
      addToHistory(manhwaId, chapter);
    }
  }, [chapter, manhwaId, user, addToHistory]);

  // Sync URL when chapter changes
  useEffect(() => {
    if (chapter !== initialChapter) {
      navigate(`/read/${manhwaId}/${chapter}`, { replace: true });
    }
  }, [chapter, manhwaId, initialChapter, navigate]);

  // Auto-hide top bar on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 10 && currentY > 100) {
        setShowHeader(false);
      } else if (currentY < lastScrollY.current - 10) {
        setShowHeader(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      alert("Yorum yapmak için giriş yapmalısınız!");
      return;
    }
    const comment = {
      id: Date.now(),
      user: user.username,
      text: newComment,
      time: 'Şimdi',
      likes: 0,
      userLiked: false,
      role: user.role || 'Kullanıcı'
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleLikeComment = (commentId) => {
    if (!user) {
      alert("Yorumu beğenmek için giriş yapmalısınız!");
      return;
    }
    setComments((prev) => prev.map((c) => {
      if (c.id === commentId) {
        return c.userLiked
          ? { ...c, likes: c.likes - 1, userLiked: false }
          : { ...c, likes: c.likes + 1, userLiked: true };
      }
      return c;
    }));
  };

  const contextChapters = chapters[manhwaId] || [];
  const totalChapters = manhwa?.chapters || contextChapters.length || 0;
  const activeChapterData = contextChapters.find(c => String(c.number) === String(chapter));
  const pages = activeChapterData && activeChapterData.pages && activeChapterData.pages.length > 0 ? activeChapterData.pages : readerPages;

  return (
    <div
      className="min-h-screen bg-black transition-colors duration-300"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* ── TOP BAR ── */}
      <AnimatePresence>
        {!zenMode && (
          <motion.div
            key="reader-header"
            initial={{ y: 0 }}
            animate={{ y: showHeader ? 0 : -100 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 z-40 glass border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg shadow-black/50"
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <Link
                to={`/manhwa/${manhwaId}`}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Geri</span>
              </Link>
              <div className="w-px h-5 bg-white/10" />
              <div>
                <p className="text-white font-semibold text-sm leading-tight line-clamp-1 max-w-[180px] sm:max-w-xs">
                  {manhwa.title}
                </p>
                <p className="text-slate-500 text-xs">Bölüm {chapter}</p>
              </div>
            </div>

            {/* Chapter selector */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                disabled={chapter <= 1}
                onClick={() => { setChapter((c) => Math.max(1, c - 1)); window.scrollTo(0,0); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-slate-300 font-medium px-1">
                {chapter} / {totalChapters}
              </span>
              <button
                disabled={chapter >= totalChapters}
                onClick={() => { setChapter((c) => Math.min(totalChapters, c + 1)); window.scrollTo(0,0); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Right tools */}
            <div className="flex items-center gap-1" ref={panelRef}>
              <button
                onClick={() => { setZenMode(true); handleFullscreen(); }}
                className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all pointer-events-auto"
                title="Tam Ekran & Zen Modu"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all pointer-events-auto"
                title="Seçenekler"
              >
                <Settings2 size={16} />
              </button>

              {/* Settings dropdown */}
              <AnimatePresence>
                {showPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-14 right-4 glass-strong border border-white/10 rounded-2xl p-4 w-64 z-50 shadow-2xl"
                  >
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Okuma Ayarları</p>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300 flex items-center gap-1.5">
                          <Sun size={14} /> Parlaklık
                        </span>
                        <span className="text-xs text-purple-400 font-bold">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-purple-500 h-1.5 rounded-full cursor-pointer"
                      />
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                        Tüm Bölümler <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px]">{contextChapters.length || totalChapters}B</span>
                      </p>
                      <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                        {contextChapters?.length > 0 ? (
                           contextChapters?.map((ch) => (
                              <button
                                key={ch.id}
                                onClick={() => { setChapter(ch.number); window.scrollTo(0,0); setShowPanel(false); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${String(ch.number) === String(chapter) ? 'bg-purple-600 border border-purple-500 shadow-neon-purple text-white font-bold' : 'bg-white/5 border border-transparent text-slate-300 hover:bg-white/10'}`}
                              >
                                <span className="flex-1 truncate">
                                   Bölüm {ch.number}
                                   {ch.title && <span className="ml-2 text-xs text-slate-400 font-normal truncate group-hover:text-slate-300 transition-colors">— {ch.title}</span>}
                                </span>
                              </button>
                           ))
                        ) : (
                          // Fallback to sequential auto-generation if not in DB
                          Array.from({ length: totalChapters }, (_, i) => (
                             <button
                                key={i + 1}
                                onClick={() => { setChapter(i + 1); window.scrollTo(0,0); setShowPanel(false); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${String(i + 1) === String(chapter) ? 'bg-purple-600 border border-purple-500 shadow-neon-purple text-white font-bold' : 'bg-white/5 border border-transparent text-slate-300 hover:bg-white/10'}`}
                             >
                               Bölüm {i + 1}
                             </button>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ZEN MODE TOGGLE ── */}
      <AnimatePresence>
        {zenMode && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setZenMode(false); handleFullscreen(); }}
            className="fixed top-4 right-4 z-50 p-2.5 rounded-xl glass border border-white/10 text-white hover:border-purple-500/40 transition-all"
          >
            <Minimize2 size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── READER CONTENT ── */}
      <motion.div
        key={chapter}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`flex flex-col items-center ${!zenMode ? 'pt-[120px]' : ''}`}
      >
        {/* Chapter title banner */}
        {!zenMode && (
          <div className="w-full max-w-2xl text-center py-6 px-4">
            <h1 className="text-lg font-bold text-white mb-1">{manhwa.title}</h1>
            <p className="text-slate-500 text-sm">Bölüm {chapter}</p>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          </div>
        )}

        {/* Pages — webtoon vertical scroll */}
        <div className="w-full max-w-2xl mx-auto">
          {pages?.map((src, idx) => (
            <ReaderImage 
              key={`${chapter}-${idx}`} 
              src={src} 
              alt={`Sayfa ${idx + 1}`} 
              idx={idx} 
              chapter={chapter} 
            />
          ))}
        </div>

        {/* ── CHAPTER NAV BOTTOM ── */}
        <div className="w-full max-w-2xl mx-auto pt-10 pb-6 px-4">
          <div className="glass border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm mb-4">
              {chapter < totalChapters
                ? `Bölüm ${chapter + 1}'e geçmeye hazır mısın?`
                : 'Bu seri için tüm bölümleri okudun! 🎉'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {chapter > 1 && (
                <button
                  onClick={() => { setChapter((c) => c - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-white/10 text-slate-300 hover:border-purple-500/40 hover:text-white transition-all text-sm font-medium"
                >
                  <ChevronLeft size={16} />
                  Önceki Bölüm
                </button>
              )}
              {chapter < totalChapters && (
                <button
                  onClick={() => { setChapter((c) => c + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple"
                >
                  Sonraki Bölüm
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
            {/* Actions: Home, Like */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setLiked(!liked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-bold ${liked ? 'text-pink-400 bg-pink-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Heart size={18} className={liked ? 'fill-pink-400' : ''} /> {liked ? 'Beğendin' : 'Bölümü Beğen'}
              </button>
              <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold">
                <Home size={18} /> Ana Sayfa
              </Link>
            </div>
          </div>
        </div>

        {/* ── COMMENTS SECTION ── */}
        {!zenMode && (
          <div className="w-full max-w-2xl mx-auto pb-20 px-4">
            <div className="glass border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-purple-400" />
                Yorumlar ({comments.length})
              </h3>
              
              <form onSubmit={handleAddComment} className="mb-8 relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={user ? "Bu bölüm hakkında ne düşünüyorsun?" : "Yorum yapmak için giriş yapmalısın..."}
                  disabled={!user}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!user || !newComment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </form>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className={`flex gap-4 p-4 rounded-xl border transition-colors ${comment.role === 'Yönetici' ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg ${comment.role === 'Yönetici' ? 'bg-gradient-to-br from-red-600 to-red-900 shadow-red-500/30' : 'bg-gradient-to-br from-purple-600 to-blue-600'}`}>
                      {comment.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center gap-2">
                           <span className={`text-sm font-bold ${comment.role === 'Yönetici' ? 'text-red-500 line-clamp-1' : 'text-white'}`}>{comment.user}</span>
                           {comment.role && comment.role !== 'Kullanıcı' && (
                             <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${comment.role === 'Yönetici' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}>
                               {comment.role}
                             </span>
                           )}
                         </div>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{comment.time}</span>
                      </div>
                      <p className={`text-sm leading-relaxed mb-3 ${comment.role === 'Yönetici' ? 'text-red-200' : 'text-slate-300'}`}>
                        {comment.text}
                      </p>
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                         className={`flex items-center gap-1.5 text-xs font-semibold hover:text-pink-400 transition-colors ${comment.userLiked ? 'text-pink-400' : 'text-slate-500'}`}
                      >
                        <Heart size={14} className={comment.userLiked ? 'fill-pink-400' : ''} /> {comment.likes} Beğeni
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
