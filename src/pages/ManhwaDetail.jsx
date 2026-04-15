import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, BookOpen, ArrowLeft, Heart, Bookmark,
  Clock, CheckCircle, Play, ChevronRight, Calendar, User,
  Flame, Lock, Sparkles, Search, SortAsc
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import StarRating from '../components/StarRating.jsx';
import CommentSystem from '../components/CommentSystem.jsx';

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n?.toString() || '0';
}

export default function ManhwaDetail({ onAuthOpen }) {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user, readingHistory } = useAuth();
  const { sortedSeries, getChapters } = useApp();

  // Find series from AppContext (dynamic data)
  const manhwa = useMemo(
    () => sortedSeries.find((m) => String(m.id) === String(id)),
    [sortedSeries, id]
  );

  // All chapters from AppContext
  const allChapters = useMemo(
    () => getChapters(manhwa?.id),
    [getChapters, manhwa?.id]
  );

  const [bookmarked, setBookmarked]   = useState(false);
  const [liked, setLiked]             = useState(false);
  const [search, setSearch]           = useState('');
  const [sortDesc, setSortDesc]       = useState(true); // newest first

  const history         = readingHistory?.find((h) => h.manhwaId === manhwa?.id);
  const continueChapter = history?.lastChapter;

  // Filter + sort
  const filteredChapters = useMemo(() => {
    let list = [...allChapters];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (ch) =>
          String(ch.number).includes(q) ||
          (ch.title && ch.title.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) =>
      sortDesc ? b.number - a.number : a.number - b.number
    );
    return list;
  }, [allChapters, search, sortDesc]);

  const handleReadChapter = (chNum) => {
    navigate(`/read/${manhwa.id}/${chNum}`);
  };

  if (!manhwa) return null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-16"
    >
      {/* ── HERO ── */}
      <div className="relative">
        <div
          className="absolute inset-0 h-[450px] bg-cover bg-center blur-3xl opacity-20 scale-105"
          style={{ backgroundImage: `url(${manhwa.cover})` }}
        />
        <div className="absolute inset-0 h-[450px] bg-gradient-to-b from-[#050507]/60 via-[#050507]/80 to-[#050507]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-0">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Geri Dön
          </Link>

          <div className="flex flex-col sm:flex-row gap-8">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
              className="flex-shrink-0 mx-auto sm:mx-0"
            >
              <img
                src={manhwa?.cover}
                alt={manhwa?.title}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=Kapak+Yüklenemedi'; }}
                className="w-48 h-64 sm:w-60 sm:h-80 rounded-2xl object-cover shadow-[0_0_50px_rgba(139,92,246,0.3)] border border-white/10"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    manhwa.status === 'Devam Ediyor' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                  }`}>
                  {manhwa.status}
                </span>
                {manhwa.is_trending && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 flex items-center gap-1">
                    <Flame size={10} className="fill-orange-400" /> Trend
                  </span>
                )}
                {manhwa.genre?.map(g => (
                  <span key={g} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 uppercase tracking-wider">{g}</span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tighter leading-tight">{manhwa.title}</h1>
              
              <div className="flex items-center gap-4 text-slate-400 text-sm mb-5">
                <span className="flex items-center gap-1.5"><User size={14} /> {manhwa.author}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {manhwa.year}</span>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-2xl line-clamp-4 sm:line-clamp-none">{manhwa.description}</p>

              {/* Stats & Rating */}
              <div className="flex flex-wrap items-center gap-8 mb-8 p-6 glass rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="text-center border-r border-white/10 pr-6">
                    <div className="text-2xl font-black text-white">{manhwa.rating || '0.0'}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Global Puan</div>
                  </div>
                  <StarRating seriesId={manhwa.id} initialRating={manhwa.rating} />
                </div>
                
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-lg font-black text-white flex items-center gap-1.5"><Eye size={16} className="text-purple-400" /> {formatNum(manhwa.reads_num)}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Okunma</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-white flex items-center gap-1.5"><BookOpen size={16} className="text-blue-400" /> {allChapters.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Bölüm</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleReadChapter(continueChapter || (filteredChapters[filteredChapters.length - 1]?.number))}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-sm hover:scale-105 transition-all shadow-neon-purple"
                >
                  <Play size={18} /> {continueChapter ? `Bölüm ${continueChapter}'den Devam Et` : 'Okumaya Başla'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => user ? setBookmarked(!bookmarked) : onAuthOpen('login')}
                    className={`p-4 rounded-2xl border transition-all ${bookmarked ? 'bg-purple-600 text-white border-purple-500 shadow-neon-purple' : 'glass border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <Bookmark size={20} className={bookmarked ? 'fill-white' : ''} />
                  </button>
                  <button
                    onClick={() => user ? setLiked(!liked) : onAuthOpen('login')}
                    className={`p-4 rounded-2xl border transition-all ${liked ? 'bg-pink-600 text-white border-pink-500 shadow-neon-pink' : 'glass border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <Heart size={20} className={liked ? 'fill-white' : ''} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left: Chapters */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <BookOpen size={24} className="text-purple-400" />
              Bölümler Listesi
            </h2>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bölüm Ara..."
                  className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 w-32 sm:w-48 transition-all"
                />
              </div>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className="p-2.5 rounded-xl glass border border-white/10 text-slate-400 hover:text-white transition-all"
              >
                <SortAsc size={18} className={sortDesc ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {filteredChapters.map((ch, idx) => (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                  onClick={() => handleReadChapter(ch.number)}
                  className="group flex items-center gap-4 px-6 py-4 glass border border-white/5 rounded-2xl hover:border-purple-500/30 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center font-black text-slate-300 group-hover:from-purple-600/20 group-hover:to-blue-600/20 group-hover:text-purple-400 transition-all border border-white/5">
                    {ch.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold group-hover:text-purple-300 transition-colors">Bölüm {ch.number}</span>
                      {ch.is_premium && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-500 text-[10px] font-black border border-amber-400/20 uppercase tracking-tighter">
                          <Lock size={10} /> Premium
                        </span>
                      )}
                    </div>
                    {ch.title && <p className="text-slate-500 text-xs truncate uppercase tracking-widest font-black">{ch.title}</p>}
                  </div>
                  <ChevronRight size={18} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredChapters.length === 0 && (
              <div className="text-center py-20 glass border border-white/5 rounded-3xl">
                <Search size={48} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Aradığın bölüm burada görünmüyor...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Comments */}
        <div className="lg:col-span-1">
           <CommentSystem seriesId={manhwa.id} />
        </div>
      </div>
    </motion.main>
  );
}
