import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Eye, BookOpen, ArrowLeft, Heart, Bookmark, Share2,
  Clock, CheckCircle, Play, ChevronRight, Calendar, User,
  Flame, BarChart2, MessageSquare, Lock, Sparkles, Search,
  ChevronUp, ChevronDown, SortAsc
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
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
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [sortDesc, setSortDesc]       = useState(true); // newest first

  const history         = readingHistory.find((h) => h.manhwaId === manhwa?.id);
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

  const visibleChapters = filteredChapters;
  const hasMore         = false;

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
          className="absolute inset-0 h-80 bg-cover bg-center blur-2xl opacity-20 scale-105"
          style={{ backgroundImage: `url(${manhwa.cover})` }}
        />
        <div className="absolute inset-0 h-80 bg-gradient-to-b from-[#050507]/60 via-[#050507]/80 to-[#050507]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-0">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Ana Sayfa
          </Link>

          <div className="flex flex-col sm:flex-row gap-7">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
              className="flex-shrink-0"
            >
              <img
                src={manhwa?.cover}
                alt={manhwa?.title}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=Kapak+Yüklenemedi'; }}
                className="w-44 h-60 sm:w-52 sm:h-72 rounded-2xl object-cover shadow-2xl shadow-purple-900/40 border border-white/10"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    manhwa.status === 'Devam Ediyor'
                      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                      : 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                  }`}
                >
                  {manhwa.status === 'Devam Ediyor' ? <Clock size={11} /> : <CheckCircle size={11} />}
                  {manhwa.status}
                </span>
                {manhwa.hasNewChapter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border border-emerald-400/40 bg-emerald-400/15 text-emerald-300 animate-pulse">
                    <Sparkles size={11} /> YENİ BÖLÜM GELDİ
                  </span>
                )}
                {manhwa.isTrending && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border border-orange-400/40 bg-orange-400/15 text-orange-300">
                    <Flame size={11} className="fill-orange-400" /> TREND
                  </span>
                )}
                {(Array.isArray(manhwa?.genre) ? manhwa.genre : manhwa?.genre ? [manhwa.genre] : [])?.map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">{g}</span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">{manhwa.title}</h1>
              <p className="text-slate-400 text-sm mb-3 flex items-center gap-1.5">
                <User size={14} /> {manhwa.author} · {manhwa.year}
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-xl">{manhwa.description}</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-5 mb-5">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xl">
                    <Star size={16} className="fill-amber-400" /> {manhwa.rating}
                  </div>
                  <div className="text-slate-500 text-xs">Puan</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{manhwa.reads}</div>
                  <div className="text-slate-500 text-xs">Okunma</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{allChapters.length}</div>
                  <div className="text-slate-500 text-xs">Bölüm</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {continueChapter ? (
                  <button
                    onClick={() => handleReadChapter(continueChapter)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple"
                  >
                    <Play size={16} /> Bölüm {continueChapter}'den Devam Et
                  </button>
                ) : (
                  <button
                    onClick={() => handleReadChapter(filteredChapters[filteredChapters.length - 1]?.number)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple"
                  >
                    <Play size={16} /> İlk Bölümden Başla
                  </button>
                )}
                <button
                  onClick={() => handleReadChapter(filteredChapters[0]?.number)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl glass border border-white/10 text-slate-300 hover:border-purple-500/40 hover:text-white text-sm font-medium transition-all"
                >
                  <Flame size={15} /> Son Bölüm
                </button>
                <button
                  onClick={() => user ? setBookmarked(!bookmarked) : onAuthOpen('login')}
                  className={`p-3 rounded-xl border transition-all ${bookmarked ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' : 'glass border-white/10 text-slate-400 hover:text-white'}`}
                >
                  <Bookmark size={16} className={bookmarked ? 'fill-purple-400' : ''} />
                </button>
                <button
                  onClick={() => user ? setLiked(!liked) : onAuthOpen('login')}
                  className={`p-3 rounded-xl border transition-all ${liked ? 'bg-pink-600/20 border-pink-500/40 text-pink-400' : 'glass border-white/10 text-slate-400 hover:text-white'}`}
                >
                  <Heart size={16} className={liked ? 'fill-pink-400' : ''} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── CHAPTERS LIST ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header + controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BookOpen size={20} className="text-purple-400" />
            Bölümler
            <span className="text-sm text-slate-500 font-normal">
              ({allChapters.length} toplam{filteredChapters.length !== allChapters.length ? `, ${filteredChapters.length} sonuç` : ''})
            </span>
          </h2>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Bölüm ara..."
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all w-36 sm:w-44"
              />
            </div>

            {/* Sort */}
            <button
              onClick={() => { setSortDesc(!sortDesc); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all hover:border-purple-500/30"
            >
              <SortAsc size={13} />
              {sortDesc ? 'Eskiye' : 'Yeniye'}
            </button>
          </div>
        </div>

        {/* Chapter rows */}
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <AnimatePresence>
            {visibleChapters.length > 0 ? (
              visibleChapters.map((ch, idx) => (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                  className="group flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors cursor-pointer"
                  onClick={() => handleReadChapter(ch.number)}
                >
                  {/* Chapter number badge */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/15 transition-colors">
                    <span className="text-sm font-bold text-slate-300 group-hover:text-purple-300">{ch.number}</span>
                  </div>

                  {/* Title & meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-semibold group-hover:text-purple-300 transition-colors">
                        Bölüm {ch.number}{ch.title ? ` — ${ch.title}` : ''}
                      </p>
                      {(ch.isNew || ch.hasNewBadge) && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-400/15 text-emerald-400 text-[10px] font-black border border-emerald-400/30 animate-pulse-glow">
                          YENİ
                        </span>
                      )}
                      {ch.isPremium && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-400 text-[10px] font-bold border border-amber-400/30">
                          <Lock size={9} /> Premium
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {ch.date}</span>
                      <span className="flex items-center gap-1"><Eye size={10} /> {formatNum(ch.views)}</span>
                      <span className="flex items-center gap-1"><Heart size={10} /> {formatNum(ch.likes)}</span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </motion.div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-600">
                <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Bölüm bulunamadı</p>
              </div>
            )}
          </AnimatePresence>
        </div>



        {allChapters.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            <BookOpen size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Henüz bölüm yüklenmeyi bekliyor</p>
          </div>
        )}
      </div>
    </motion.main>
  );
}
