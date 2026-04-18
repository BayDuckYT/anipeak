import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Settings2, Sun, Moon,
  Maximize2, Minimize2, Home, Heart, MessageSquare, Send, BookOpen, Bug,
  ChevronDown, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import CommentSystem from '../components/CommentSystem.jsx';
import ChapterRating from '../components/ChapterRating.jsx';
import ReportIssueModal from '../components/ReportIssueModal.jsx';

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
      className="w-full block select-none pointer-events-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ display: 'block', lineHeight: 0 }}
    />
  );
}

export default function Reader() {
  const { id, chapter: chapterParam } = useParams();
  const navigate = useNavigate();
  const { user, addToHistory, updateXP } = useAuth();
  const { series, getChapters } = useApp();
  const imageRefs = useRef([]);
  
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
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [xpUpdated, setXpUpdated] = useState(false);
  const endRef = useRef(null);

  const panelRef = useRef(null);
  const lastScrollY = useRef(0);

  // All chapters for this manhwa
  const contextChapters = useMemo(() => getChapters(manhwa?.id), [getChapters, manhwa?.id]);

  // Update history & stats when chapter changes
  useEffect(() => {
    if (manhwa?.id) {
      if (user) addToHistory(manhwa.id, chapter);
      // Increment reads_num (Global view count)
      supabase.rpc('increment_reads', { row_id: manhwa.id }).catch(() => {
        // Fallback if RPC not defined
        supabase.from('series').update({ reads_num: (manhwa.reads_num || 0) + 1 }).eq('id', manhwa.id);
      });
    }
  }, [chapter, manhwa?.id, user, addToHistory]);

  // Sync state if URL changes externally
  useEffect(() => {
    setChapter(Number(chapterParam));
    setXpUpdated(false); // Reset XP trigger for new chapter
  }, [chapterParam]);

  // ── Anti-Steal Security (F12, Right-Click, etc) ──────────────────────
  useEffect(() => {
    const handleContext = (e) => e.preventDefault();
    const handleKey = (e) => {
      if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'i' || e.key === 'j')) e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // ── Scroll Spy for Header ───────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > 100) {
        setShowHeader(current < lastScrollY.current);
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close Chapter Panel on Outside Click ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChapterTab = (newCh) => {
    setChapter(newCh);
    navigate(`/read/${manhwa.id}/${newCh}`);
    window.scrollTo(0,0);
    setShowPanel(false);
  };

  if (!manhwa) return null;

  return (
    <div 
      className="min-h-screen bg-[#050507] pt-24 pb-12 overflow-x-hidden relative"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* ── REPORTS MODAL (MOVED TO TOP FOR ABSOLUTE VISIBILITY) ── */}
      <AnimatePresence>
        {isReportOpen && (
          <ReportIssueModal 
            isOpen={isReportOpen} 
            onClose={() => setIsReportOpen(false)} 
            seriesId={manhwa.id} 
            chapterNum={chapter} 
          />
        )}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <AnimatePresence>
        {!zenMode && (
          <motion.div
            key="reader-header"
            initial={{ y: 0 }}
            animate={{ y: showHeader ? 0 : -100 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 z-[500] glass border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg shadow-black/50"
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
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("[DEBUG] Hata Bildir tıklandı!");
                  setIsReportOpen(true);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer relative z-[600]"
                title="Hata Bildir"
              >
                <Bug size={18} />
              </button>
              <button
                onClick={() => { setZenMode(true); handleFullscreen(); }}
                className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all pointer-events-auto"
                title="Tam Ekran & Zen Modu"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all relative"
                title="Ayarlar & Bölümler"
              >
                <Settings2 size={16} />
              </button>
            </div>

            {/* Floating Panel */}
            <AnimatePresence>
              {showPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-4 top-full mt-3 w-80 glass-strong border border-white/10 rounded-3xl p-6 shadow-2xl z-[1000]"
                >
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Parlaklık</p>
                      <input 
                        type="range" min="30" max="100" value={brightness} 
                        onChange={(e) => setBrightness(e.target.value)}
                        className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Hızlı Bölüm Seç</p>
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                        {[...contextChapters].sort((a,b) => b.number-a.number).map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => handleChapterTab(ch.number)}
                            className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${chapter === ch.number ? 'bg-purple-600 border-purple-500 text-white' : 'glass border-white/10 text-slate-400 hover:border-white/20'}`}
                          >
                            {ch.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── READER CONTENT ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl mx-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]"
      >
        <div className="flex flex-col">
          {(() => {
            const currentCh = contextChapters?.find(c => parseFloat(c.number) === parseFloat(chapter));
            if (!currentCh && contextChapters?.length > 0) {
              console.warn(`[READER] Bölüm bulunamadı! Aranan: ${chapter}, Mevcutlar:`, contextChapters.map(c => c.number));
            }
            if (currentCh && (!currentCh.pages || currentCh.pages.length === 0)) {
              console.warn(`[READER] Bölüm bulundu ama sayfalar boş!`, currentCh);
            }

            return currentCh?.pages?.map((p, idx) => (
              <ReaderImage key={idx} src={p} alt={`Page ${idx + 1}`} idx={idx} chapter={chapter} />
            ));
          })()}

          {/* If no pages */}
          {(!contextChapters?.find(c => parseFloat(c.number) === parseFloat(chapter))?.pages || contextChapters?.find(c => parseFloat(c.number) === parseFloat(chapter))?.pages?.length === 0) && (
            <div className="py-40 text-center px-6">
               <Sun size={64} className="text-slate-800 mx-auto mb-6" />
               <h2 className="text-2xl font-black text-white mb-2">BU BÖLÜMDE GÖRÜNTÜ YOK</h2>
               <p className="text-slate-500 max-w-sm mx-auto">Henüz sayfalar yüklenmemiş veya kozmik bir hata oluşmuş amk.</p>
               <Link to={`/manhwa/${manhwa.id}`} className="inline-flex items-center gap-2 mt-8 text-purple-400 font-bold hover:text-purple-300">
                  <ArrowLeft size={16} /> Seri Detayına Dön
               </Link>
            </div>
          )}
        </div>

        {/* Visibility Pivot for XP reward */}
        <div ref={endRef} className="h-10 w-full" />

        {/* ── CHAPTER RATING SECTION ── */}
        <ChapterRating seriesId={manhwa.id} chapterNum={chapter} />

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
             <CommentSystem seriesId={manhwa.id} chapterNum={chapter} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
