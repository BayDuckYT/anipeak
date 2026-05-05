import { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, BookOpen, ChevronRight, Flame, Zap, Play, Plus,
  TrendingUp, Crown, Bell, Sparkles, Heart,
  Swords, Skull, School, Rocket, Theater, Smile, Ghost, Search
} from 'lucide-react';

// ── Genre icon mapping ──
const GENRE_ICONS = {
  'Aksiyon': Swords, 'Romantik': Heart, 'Fantezi': Sparkles, 'Fantastik': Sparkles,
  'Korku': Skull, 'Okul': School, 'Sci-Fi': Rocket, 'Dram': Theater,
  'Komedi': Smile, 'Macera': Flame, 'Gerilim': Ghost,
};

const GENRE_COLORS = {
  'Aksiyon': 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400',
  'Romantik': 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
  'Fantezi': 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
  'Fantastik': 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400',
  'Korku': 'from-gray-500/20 to-zinc-500/20 border-gray-500/30 text-gray-400',
  'Okul': 'from-blue-500/20 to-sky-500/20 border-blue-500/30 text-blue-400',
  'Sci-Fi': 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400',
  'Dram': 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400',
  'Komedi': 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
  'Macera': 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
  'Gerilim': 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-400',
};
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';


// ── Trending Card (numbered) ──
function TrendingCard({ item, rank, getChapters }) {
  const chapterCount = getChapters(item.id).length;
  return (
    <Link to={`/manhwa/${item.id}`} className="group flex-shrink-0 w-[160px] sm:w-[180px]">
      <div className="relative rounded-2xl overflow-hidden border border-white/8 transition-all duration-300 group-hover:border-purple-500/40 group-hover:shadow-[0_8px_30px_rgba(168,85,247,0.2)]">
        {/* Rank number */}
        <div className="absolute top-2 left-2 z-20">
          <span className={`text-3xl font-black italic drop-shadow-lg ${
            rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-orange-400' : 'text-white/60'
          }`} style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
            {rank}
          </span>
        </div>
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=Resim+Yok'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          {/* Rating badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[11px] font-black">
            <Star size={10} className="fill-white" /> {item.rating}
          </div>
        </div>
        <div className="p-2.5 bg-[#0a0a0c]">
          <h3 className="text-white text-xs font-bold truncate group-hover:text-purple-400 transition-colors">{item.title}</h3>
        </div>
      </div>
    </Link>
  );
}

// ── New Chapter Card ──
function NewChapterCard({ item, chapters }) {
  const seriesChapters = chapters[String(item.id)] || [];
  const latestChapter = seriesChapters[0];
  const chapterNum = latestChapter?.number || '?';
  const timeAgo = latestChapter?.created_at ? getTimeAgo(latestChapter.created_at) : '';

  return (
    <Link to={`/manhwa/${item.id}`} className="group flex-shrink-0 w-[130px]">
      <div className="relative rounded-xl overflow-hidden border border-white/8 group-hover:border-purple-500/30 transition-all">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=Resim+Yok'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          {/* "Güncel" badge */}
          <div className="absolute top-1.5 left-1.5">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/90 text-white text-[8px] font-black uppercase">Güncel</span>
          </div>
        </div>
        <div className="p-2 bg-[#0a0a0c]">
          <p className="text-white text-[10px] font-bold truncate">{item.title}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-purple-400 text-[9px] font-black">Bölüm {chapterNum}</span>
            {timeAgo && <span className="text-slate-600 text-[8px]">{timeAgo}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Recommendation Card ──
function RecommendationCard({ item }) {
  return (
    <Link to={`/manhwa/${item.id}`} className="group flex-shrink-0 w-[150px]">
      <div className="relative rounded-xl overflow-hidden border border-white/8 group-hover:border-blue-500/30 transition-all">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=Resim+Yok'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-1 mb-1">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-white text-[10px] font-black">{item.rating}</span>
            </div>
          </div>
        </div>
        <div className="p-2 bg-[#0a0a0c]">
          <p className="text-white text-[10px] font-bold truncate group-hover:text-blue-400 transition-colors">{item.title}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Sidebar Discovery Item ──
function DiscoveryItem({ item, rank }) {
  return (
    <Link to={`/manhwa/${item.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
      <img src={item.cover} alt={item.title} className="w-10 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0" loading="lazy"
        onError={(e) => { e.target.src = 'https://via.placeholder.com/40x56?text='; }} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-bold truncate group-hover:text-purple-400 transition-colors">{item.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-amber-400 text-[10px] font-black">{item.rating}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Time ago helper ──
function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gün önce`;
  return `${Math.floor(diffDays / 7)} hafta önce`;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ════════════════════════════════════════════════════════════════════════
export default function Home({ onAuthOpen }) {
  const trendRef = useRef(null);
  const newChaptersRef = useRef(null);
  const location = useLocation();
  const { user } = useAuth();
  const { sortedSeries, announcements, chapters, getChapters } = useApp();
  const validSeries = sortedSeries.filter(s => !s.is_deleted);

  // Featured item — highest trending
  const featuredItem = validSeries.length > 0 ? validSeries[0] : null;
  const featuredChapters = featuredItem ? getChapters(featuredItem.id) : [];
  const featuredChapterCount = featuredChapters.length;

  // Trending — top 10 by reads
  const trendingSeries = useMemo(() =>
    validSeries.filter(s => s.is_trending).slice(0, 10),
  [validSeries]);

  // New chapters — series with most recent chapter updates
  const newChapterSeries = useMemo(() => {
    const withLatest = validSeries.map(s => {
      const chs = chapters[String(s.id)] || [];
      const latest = chs[0];
      return { ...s, latestChapterDate: latest?.created_at || '1970-01-01' };
    });
    return withLatest.sort((a, b) => new Date(b.latestChapterDate) - new Date(a.latestChapterDate)).slice(0, 12);
  }, [validSeries, chapters]);

  // Recommendations — random shuffle of high-rated series
  const recommendations = useMemo(() => {
    const highRated = validSeries.filter(s => s.rating >= 8.5);
    const shuffled = [...highRated].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [validSeries]);

  // All genres from series
  const allGenres = useMemo(() => {
    const genreSet = new Set();
    validSeries.forEach(s => {
      const genres = Array.isArray(s.genre) ? s.genre : s.genre ? [s.genre] : [];
      genres.forEach(g => genreSet.add(g));
    });
    return Array.from(genreSet).slice(0, 10);
  }, [validSeries]);

  // Top rated for sidebar
  const topRated = useMemo(() =>
    [...validSeries].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6),
  [validSeries]);

  useEffect(() => {
    if (location.hash === '#trendler' && trendRef.current) {
      setTimeout(() => trendRef.current.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  const featuredGenres = featuredItem
    ? (Array.isArray(featuredItem.genre) ? featuredItem.genre : [featuredItem.genre || 'Aksiyon']).join(', ')
    : '';

  return (
    <main className="min-h-screen" id="home-top">

      {/* ══════════════ HERO SECTION ══════════════ */}
      {featuredItem && (
        <section className="relative h-[520px] sm:h-[560px] overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <img src={featuredItem.cover} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/85 to-[#050507]/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-[#050507]/60" />
          </div>

          {/* Purple ambient glow */}
          <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12 pt-20">
            <div className="max-w-xl">
              {/* Badge */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
                <Flame size={12} className="text-orange-400" />
                <span className="text-[11px] text-purple-300 font-bold uppercase tracking-wider">Öne Çıkan</span>
              </motion.div>

              {/* Title */}
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.1] mb-3"
                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {featuredItem.title}
              </motion.h1>

              {/* Meta info */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex items-center gap-3 text-sm text-slate-300 mb-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" /> {featuredItem.rating}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} className="text-purple-400" /> {featuredChapterCount} Bölüm
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{featuredGenres}</span>
              </motion.div>

              {/* Description */}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2 max-w-md">
                {featuredItem.description || `${featuredItem.title} serisini keşfet. Efsanevi bir hikaye seni bekliyor.`}
              </motion.p>

              {/* Buttons */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="flex items-center gap-3">
                <Link to={`/manhwa/${featuredItem.id}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple">
                  <Play size={16} className="fill-white" /> Oku Şimdi
                </Link>
                <button
                  onClick={() => { if (!user) { onAuthOpen('login'); } }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl glass border border-white/15 text-white font-semibold text-sm hover:border-purple-500/40 hover:bg-purple-500/10 transition-all">
                  <Plus size={16} /> Listeye Ekle
                </button>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ MAIN CONTENT GRID ══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">

          {/* ── LEFT: Main Content ── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* ── TRENDING NOW ── */}
            <section ref={trendRef} id="trendler">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-orange-400" />
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Trending Now</h2>
                </div>
                <Link to="/all-series" className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors">
                  Tümünü Gör <ChevronRight size={14} />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar custom-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
                {(trendingSeries.length > 0 ? trendingSeries : validSeries.slice(0, 10)).map((item, i) => (
                  <TrendingCard key={item.id} item={item} rank={i + 1} getChapters={getChapters} />
                ))}
              </div>
            </section>

            {/* ── BOTTOM ROW: New Chapters + Recommendations ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Yeni Bölümler */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-400" />
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Yeni Bölümler</h2>
                  </div>
                  <Link to="/all-series" className="text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors">
                    Tümünü Gör
                  </Link>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar custom-scrollbar">
                  {newChapterSeries.map((item) => (
                    <NewChapterCard key={item.id} item={item} chapters={chapters} />
                  ))}
                </div>
              </section>

              {/* Sana Özel */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart size={18} className="text-pink-400" />
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Sana Özel</h2>
                  </div>
                  <span className="text-[10px] text-slate-600 italic">Bunları okudun — bunları seversin</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar custom-scrollbar">
                  {recommendations.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            </div>

            {/* ── ANNOUNCEMENTS ── */}
            {announcements.length > 0 && (
              <section className="glass border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-neon-purple">
                    <Bell size={13} className="text-white" />
                  </div>
                  <h2 className="text-white font-black text-sm">Son Güncellemeler</h2>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Canlı</span>
                </div>
                <div className="space-y-2">
                  {announcements.slice(0, 5).map((ann, i) => (
                    <motion.div key={ann.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                        ann.type === 'chapter' ? 'border-purple-500/20 bg-purple-500/5' :
                        ann.type === 'series' ? 'border-blue-500/20 bg-blue-500/5' :
                        'border-emerald-500/20 bg-emerald-500/5'
                      } hover:bg-white/5 transition-colors`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        ann.type === 'chapter' ? 'bg-purple-500' : ann.type === 'series' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                      <p className="text-slate-300 text-xs flex-1">{ann.text}</p>
                      <span className="text-slate-600 text-[9px] flex-shrink-0">
                        {new Date(ann.created_at || ann.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* ── CTA BANNER ── */}
            <section>
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 via-[#050507] to-blue-900/40" />
                <div className="absolute inset-0 border border-red-500/20 rounded-2xl" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-32 bg-red-600/20 blur-3xl" />
                <div className="relative z-10 text-center py-12 px-6">
                  <Crown size={32} className="text-red-500 mx-auto mb-3 animate-pulse" />
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                    <span className="elite-text-gradient">Sınırsız Güce Eriş</span>
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                    Elite odalara giriş yap, ismin parlasın, canlı sohbette fark yarat.
                  </p>
                  <Link to="/elite-upgrade"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold text-sm hover:scale-[1.02] transition-transform shadow-neon-purple">
                    Premiuma Katıl
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT SIDEBAR (Desktop) ── */}
          <aside className="hidden xl:flex flex-col gap-6 w-[280px] flex-shrink-0">

            {/* Kategoriler */}
            <div className="glass border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search size={14} className="text-purple-400" /> Kategoriler
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {allGenres.map(genre => {
                  const IconComp = GENRE_ICONS[genre] || BookOpen;
                  const colorCls = GENRE_COLORS[genre] || 'from-slate-500/20 to-zinc-500/20 border-slate-500/30 text-slate-400';
                  return (
                    <Link key={genre} to={`/all-series?genre=${genre}`}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${colorCls} border hover:scale-[1.03] transition-all`}>
                      <IconComp size={18} />
                      <span className="text-[9px] font-black uppercase tracking-wider">{genre}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Manga Keşif */}
            <div className="glass border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-400" /> Manga Keşif
              </h3>
              <div className="space-y-1">
                {topRated.map((item, i) => (
                  <DiscoveryItem key={item.id} item={item} rank={i + 1} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
