import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Settings2, Sun, Moon,
  Maximize2, Minimize2, Home, Heart, MessageSquare, Send, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import CommentSystem from '../components/CommentSystem.jsx';

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

  // Ensure src is valid
  const imageSrc = src?.startsWith('data:') ? src : src;

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
  const { series, getChapters } = useApp();
  
  const handleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch(e) {}
  };
  
  const manhwaId = id;
  const manhwa = useMemo(() => series.find((m) => String(m.id) === String(id)), [series, id]);
  const initialChapter = Number(chapterParam) || 1;

  const [chapter, setChapter] = useState(initialChapter);
  const [zenMode, setZenMode] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showPanel, setShowPanel] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [liked, setLiked] = useState(false);

  const panelRef = useRef(null);
  const lastScrollY = useRef(0);

  // All chapters for this manhwa
  const contextChapters = useMemo(() => getChapters(manhwa?.id), [getChapters, manhwa?.id]);

  // Update history when chapter changes
  useEffect(() => {
    if (user && manhwa?.id) {
      addToHistory(manhwa.id, chapter);
    }
  }, [chapter, manhwa?.id, user, addToHistory]);

  // Sync state if URL changes externally
  useEffect(() => {
    setChapter(Number(chapterParam));
  }, [chapterParam]);

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

  if (!manhwa) return null;

  const totalChapters = contextChapters.length || 0;
  const activeChapterData = contextChapters.find(c => Number(c.number) === Number(chapter));
  const pages = activeChapterData?.pages || [];

  const handleChapterTab = (newCh) => {
    setChapter(newCh);
    navigate(`/read/${manhwa.id}/${newCh}`);
    window.scrollTo(0,0);
    setShowPanel(false);
  };

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
                to={`/manhwa/${manhwa.id}`}
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
                <p className="text-slate-500 text-xs text-uppercase font-black tracking-widest">Bölüm {chapter}</p>
              </div>
            </div>

            {/* Chapter selector */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                disabled={chapter <= (contextChapters[contextChapters.length - 1]?.number || 1)}
                onClick={() => handleChapterTab(chapter - 1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setShowPanel(!showPanel)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:border-purple-500/50 transition-all flex items-center gap-2"
              >
                Bölüm {chapter} <ChevronDown size={12} className={showPanel ? 'rotate-180' : ''} />
              </button>
              <button
                disabled={chapter >= (contextChapters[0]?.number || 1)}
                onClick={() => handleChapterTab(chapter + 1)}
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
                        Tüm Bölümler <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px]">{contextChapters.length}B</span>
                      </p>
                      <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                        {contextChapters.map((ch) => (
                           <button
                             key={ch.id}
                             onClick={() => handleChapterTab(ch.number)}
                             className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${Number(ch.number) === Number(chapter) ? 'bg-purple-600 border border-purple-500 shadow-neon-purple text-white font-bold' : 'bg-white/5 border border-transparent text-slate-300 hover:bg-white/10'}`}
                           >
                             <span className="flex-1 truncate">
                                Bölüm {ch.number}
                                {ch.title && <span className="ml-2 text-xs text-slate-400 font-normal truncate group-hover:text-slate-300 transition-colors">— {ch.title}</span>}
                             </span>
                           </button>
                        ))}
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
            <p className="text-slate-500 text-sm font-black tracking-widest uppercase">Bölüm {chapter}</p>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          </div>
        )}

        {/* Pages — webtoon vertical scroll */}
        <div className="w-full max-w-2xl mx-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          {pages.length > 0 ? pages.map((src, idx) => (
            <ReaderImage 
              key={`${chapter}-${idx}`} 
              src={src} 
              alt={`Sayfa ${idx + 1}`} 
              idx={idx} 
              chapter={chapter} 
            />
          )) : (
            <div className="py-40 text-center glass border border-white/5 rounded-3xl mx-4">
                <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Bu bölüm için sayfa yüklenemedi.</p>
                <p className="text-slate-600 text-xs mt-2">Editör henüz sayfaları girmemiş olabilir.</p>
            </div>
          )}
        </div>

        {/* ── CHAPTER NAV BOTTOM ── */}
        <div className="w-full max-w-2xl mx-auto pt-10 pb-6 px-4">
          <div className="glass border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm mb-4">
              Bölüm {chapter} tamamlandı. Devam etmek ister misin?
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => {
                  const prev = contextChapters.find(c => Number(c.number) < Number(chapter));
                  if (prev) handleChapterTab(prev.number);
                }}
                disabled={!contextChapters.some(c => Number(c.number) < Number(chapter))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-white/10 text-slate-300 hover:border-purple-500/40 hover:text-white transition-all text-sm font-medium disabled:opacity-20"
              >
                <ChevronLeft size={16} />
                Önceki Bölüm
              </button>
              
              <button
                onClick={() => {
                  const next = [...contextChapters].reverse().find(c => Number(c.number) > Number(chapter));
                  if (next) handleChapterTab(next.number);
                }}
                disabled={!contextChapters.some(c => Number(c.number) > Number(chapter))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple disabled:opacity-20"
              >
                Sonraki Bölüm
                <ChevronRight size={16} />
              </button>
            </div>
            
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

        {/* ── REAL-TIME COMMENTS SECTION ── */}
        {!zenMode && (
          <div className="w-full max-w-2xl mx-auto pb-20 px-4">
             <CommentSystem seriesId={manhwa.id} chapterId={chapter} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ChevronDown({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
    );
}
