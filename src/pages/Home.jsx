import { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, BookOpen, ChevronRight, Flame, Zap, Play, Plus,
  TrendingUp, Crown, Bell, Sparkles, Heart, Compass,
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
import { handleImageError, getOptimizedImage } from '../utils/imageOpt.js';
import VirtualHScroll from '../components/VirtualHScroll.jsx';
import LazySection from '../components/LazySection.jsx';


// ── Trending Card (numbered) ──
function TrendingCard({ item, rank, getChapters }) {
  const chapterCount = getChapters(item.id).length;
  return (
    <Link to={`/manhwa/${item.id}`} className="group flex-shrink-0 w-[160px] sm:w-[180px] hover-lift portal-transition block min-h-[44px]" aria-label={`${rank}. Sırada: ${item.title} serisi, ${item.rating} yıldız`}>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-[0_8px_30px_rgba(168,85,247,0.3)] energy-pulse bg-[#0a0a0c]">
        {/* Rank number */}
        <div className="absolute top-2 left-2 z-20 pointer-events-none">
          <span className={`text-4xl font-black italic drop-shadow-lg ${
            rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-200' : rank === 3 ? 'text-orange-400' : 'text-white/80'
          }`} style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.9)' }}>
            {rank}
          </span>
        </div>
        <div className="relative overflow-hidden bg-purple-900/20" style={{ aspectRatio: '3/4', width: '100%' }}>
          <img src={getOptimizedImage(item.cover, 300)} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-0 transition-opacity" loading="lazy"
            onLoad={(e) => { e.currentTarget.classList.remove('opacity-0'); e.currentTarget.parentElement.classList.remove('animate-pulse'); }}
            onError={handleImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
          {/* Rating badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-600/95 text-white text-[12px] font-black border border-emerald-500/50 backdrop-blur-sm">
            <Star size={12} className="fill-white" aria-hidden="true" /> {item.rating}
          </div>
        </div>
        <div className="p-3 bg-gradient-to-b from-transparent to-[#050507]">
          <h3 className="text-white text-sm font-bold truncate group-hover:text-purple-300 transition-colors read-invitation">{item.title}</h3>
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
    <Link to={`/manhwa/${item.id}`} className="group flex-shrink-0 w-[130px] block min-h-[44px]" aria-label={`${item.title} - Bölüm ${chapterNum} oku`}>
      <div className="relative rounded-xl overflow-hidden border border-white/10 group-hover:border-purple-500/40 transition-all bg-[#0a0a0c]">
        <div className="relative overflow-hidden bg-purple-900/20" style={{ aspectRatio: '3/4', width: '100%' }}>
          <img src={getOptimizedImage(item.cover, 300)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 opacity-0" loading="lazy"
            onLoad={(e) => { e.currentTarget.classList.remove('opacity-0'); e.currentTarget.parentElement.classList.remove('animate-pulse'); }}
            onError={handleImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent pointer-events-none" />
          {/* "Güncel" badge */}
          <div className="absolute top-1.5 left-1.5 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider border border-emerald-500/50">Güncel</span>
          </div>
        </div>
        <div className="p-2.5 bg-gradient-to-b from-transparent to-[#050507]">
          <p className="text-white text-xs font-bold truncate">{item.title}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-purple-300 text-[10px] font-black px-1.5 py-0.5 bg-purple-500/20 rounded">Bölüm {chapterNum}</span>
            {timeAgo && <span className="text-slate-400 text-[10px] font-medium">{timeAgo}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Recommendation Card ──
function RecommendationCard({ item }) {
  return (
    <Link to={`/manhwa/${item.id}`} className="group flex-shrink-0 w-[150px] block min-h-[44px]" aria-label={`${item.title} önerilen seri`}>
      <div className="relative rounded-xl overflow-hidden border border-white/10 group-hover:border-cyan-500/40 transition-all bg-[#0a0a0c]">
        <div className="relative overflow-hidden bg-cyan-900/20 animate-pulse" style={{ aspectRatio: '3/4', width: '100%' }}>
          <img src={getOptimizedImage(item.cover, 300)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 opacity-0" loading="lazy"
            onLoad={(e) => { e.currentTarget.classList.remove('opacity-0'); e.currentTarget.parentElement.classList.remove('animate-pulse'); }}
            onError={handleImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
            <div className="flex items-center gap-1.5 mb-1 px-2 py-1 bg-black/60 rounded-lg w-max backdrop-blur-sm border border-white/10">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-white text-[11px] font-black">{item.rating}</span>
            </div>
          </div>
        </div>
        <div className="p-3 bg-gradient-to-b from-transparent to-[#050507]">
          <p className="text-white text-xs font-bold truncate group-hover:text-cyan-300 transition-colors">{item.title}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Sidebar Discovery Item ──
function DiscoveryItem({ item, rank }) {
  return (
    <Link to={`/manhwa/${item.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group min-h-[44px]" aria-label={`${item.title} manga keşfet`}>
      <div className="relative w-12 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-purple-900/20" style={{ aspectRatio: '3/4' }}>
        <img src={getOptimizedImage(item.cover, 100)} alt={item.title} className="w-full h-full object-cover" loading="lazy" onError={handleImageError} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-slate-100 text-sm font-bold truncate group-hover:text-emerald-300 transition-colors leading-tight">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-amber-400 text-xs font-black">{item.rating}</span>
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
  const validSeries = useMemo(() => {
    // PERFORMANS OPTİMİZASYONU: Anasayfa hesaplamaları için veriyi 1000 ile sınırla.
    // 30.000 manga olduğunda her render'da map/sort yapmak ana iş parçacığını kilitler (TBT'yi uçurur).
    const arr = [];
    for (let i = 0; i < sortedSeries.length; i++) {
      if (!sortedSeries[i].is_deleted) {
        arr.push(sortedSeries[i]);
        if (arr.length >= 1000) break;
      }
    }
    return arr;
  }, [sortedSeries]);

  // Hero Carousel — top 5 series
  const heroItems = useMemo(() => validSeries.slice(0, 5), [validSeries]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Auto-slide hero
  useEffect(() => {
    if (heroItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroItems.length]);

  const featuredItem = heroItems[currentHeroIndex];
  const featuredChapters = featuredItem ? getChapters(featuredItem.id) : [];
  const featuredChapterCount = featuredChapters.length;

  // Trending — top 10 by reads
  const trendingSeries = useMemo(() =>
    validSeries.filter(s => s.is_trending).slice(0, 10),
  [validSeries]);

  // New chapters — series with most recent chapter updates
  const newChapterSeries = useMemo(() => {
    const withLatest = validSeries.map(s => {
      const chs = chapters[String(s.id)];
      const latest = chs && chs.length > 0 ? chs[0] : null;
      return { ...s, latestChapterDate: latest?.created_at || '1970-01-01' };
    });
    // PERFORMANS OPTİMİZASYONU: new Date() kullanmak düşük CPU'lu cihazlarda (Lighthouse/Mobil) 
    // aşırı maliyetlidir. ISO tarih stringleri doğrudan localeCompare ile sıralanabilir.
    return withLatest.sort((a, b) => b.latestChapterDate.localeCompare(a.latestChapterDate)).slice(0, 12);
  }, [validSeries, chapters]);

  // Recommendations — shuffle of high-rated series with fallback
  const recommendations = useMemo(() => {
    let pool = validSeries.filter(s => s.rating >= 8.5);
    if (pool.length < 4) pool = validSeries; // Fallback if not enough high rated
    
    // PERFORMANS OPTİMİZASYONU: Tüm diziyi Math.random() - 0.5 ile sort etmek 
    // Lighthouse CPU'sunu boğar. Bunun yerine 10 rastgele eleman seç.
    const result = [];
    const tempPool = [...pool];
    const count = Math.min(10, tempPool.length);
    for (let i = 0; i < count; i++) {
       const randomIndex = Math.floor(Math.random() * tempPool.length);
       result.push(tempPool.splice(randomIndex, 1)[0]);
    }
    return result;
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
    <main className="min-h-screen portal-transition" id="home-top">

      {/* ── ══════════════ HERO SECTION (CAROUSEL) ══════════════ ── */}
      <section className="relative h-[520px] sm:h-[600px] overflow-hidden bg-[#050507]">
        <AnimatePresence mode='wait'>
          {featuredItem && (
            <div
              key={featuredItem.id}
              className="absolute inset-0"
            >
              {/* Background image — LCP Element (eager + high priority + no fake delays) */}
              <div className="absolute inset-0 bg-[#050507]">
                <img
                  src={
                    featuredItem.title === 'Solo Leveling' ? '/solo_leveling_bg.jpg' : // Örnek özel arkaplan mantığı
                    featuredItem.hero_bg ? featuredItem.hero_bg : // Veritabanından gelirse
                    getOptimizedImage(featuredItem.cover, 1200) // Varsayılan olarak seri kapağı
                  }
                  alt={featuredItem.title}
                  aria-hidden="true"
                  fetchpriority="high"
                  loading="eager"
                  decoding="sync"
                  width="1440"
                  height="600"
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/85 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-[#050507]/40" />
              </div>

              {/* Purple ambient glow */}
              <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

              {/* Content */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-16 pt-20">
                <div className="max-w-2xl">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4 backdrop-blur-md"
                  >
                    <Flame size={12} className="text-orange-400 animate-pulse" />
                    <span className="text-[11px] text-purple-300 font-bold uppercase tracking-wider">Öne Çıkan</span>
                  </motion.div>

                  {/* Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight leading-[1] mb-4 drop-shadow-2xl"
                    style={{ textShadow: '0 4px 30px rgba(168,85,247,0.3)' }}
                  >
                    {featuredItem.title}
                  </motion.h1>

                  {/* Meta info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-3 text-sm text-slate-300 mb-4 flex-wrap"
                  >
                    <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 backdrop-blur-sm">
                      <Star size={14} className="text-amber-400 fill-amber-400" /> {featuredItem.rating}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 backdrop-blur-sm">
                      <BookOpen size={14} className="text-purple-400" /> {featuredChapterCount} Bölüm
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 italic font-medium">
                      {(Array.isArray(featuredItem.genre) ? featuredItem.genre : [featuredItem.genre || 'Aksiyon']).join(', ')}
                    </span>
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 line-clamp-2 max-w-lg"
                  >
                    {featuredItem.description || `${featuredItem.title} serisini keşfet. Efsanevi bir hikaye seni bekliyor.`}
                  </motion.p>

                  {/* Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-4"
                  >
                    <Link
                      to={`/manhwa/${featuredItem.id}`}
                      className="flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple hover:scale-105 active:scale-95"
                      aria-label={`${featuredItem.title} serisini okumaya başla`}
                    >
                      <Play size={16} className="fill-white" aria-hidden="true" /> Oku Şimdi
                    </Link>
                    <button
                      onClick={() => { if (!user) { onAuthOpen('login'); } }}
                      className="flex items-center gap-2 px-7 py-4 rounded-xl glass border border-white/10 text-white font-semibold text-sm hover:border-purple-500/40 hover:bg-purple-500/10 transition-all"
                      aria-label={`${featuredItem.title} serisini listeye ekle`}
                    >
                      <Plus size={16} aria-hidden="true" /> Listeye Ekle
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 right-8 z-20 flex gap-2">
          {heroItems.map((_, i) => (
            <button
              key={i}
              aria-label={`Slayt ${i + 1} göster`}
              onClick={() => setCurrentHeroIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentHeroIndex === i ? 'w-8 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

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
                <Link to="/all-series" className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors read-invitation" aria-label="Tüm trend serileri görüntüle">
                  Tümünü Gör <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
              <VirtualHScroll
                items={trendingSeries.length > 0 ? trendingSeries : validSeries.slice(0, 10)}
                itemWidth={180}
                gap={12}
                renderItem={(item, i) => (
                  <TrendingCard key={item.id} item={item} rank={i + 1} getChapters={getChapters} />
                )}
              />
            </section>

            {/* ── NEW CHAPTERS & RECOMMENDATIONS ── */}
            <div className="flex flex-col gap-10">

              {/* Yeni Bölümler */}
              <LazySection minHeight="240px">
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Sparkles size={18} className="text-emerald-400" />
                      </div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight">Yeni Bölümler</h2>
                    </div>
                    <Link to="/all-series" className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors" aria-label="Tüm yeni bölümleri görüntüle">
                      Tümünü Gör <ChevronRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                <VirtualHScroll
                  items={newChapterSeries}
                  itemWidth={130}
                  gap={16}
                  renderItem={(item) => (
                    <NewChapterCard key={item.id} item={item} chapters={chapters} />
                  )}
                />
                </section>
              </LazySection>

              {/* Oracle: Sana Özel (Personalized) */}
              <LazySection minHeight="300px">
                <section className="relative overflow-hidden rounded-3xl p-8 border border-cyan-500/10 bg-gradient-to-br from-[#0a0a0c] via-[#0d0d1a] to-[#0a0a0c]">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles size={120} className="text-cyan-400" />
                </div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                      <Compass size={24} className="text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sana Özel Öneriler</h2>
                      <p className="text-[10px] text-cyan-400/70 font-mono tracking-widest uppercase">Akıllı Algoritma Senin İçin Seçti</p>
                    </div>
                  </div>
                  <Link to="/oracle" className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/10 transition-all min-h-[44px]" aria-label="Tüm oracle önerilerini görüntüle">
                    Tüm Öneriler <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </div>

                <div className="relative z-10">
                  <VirtualHScroll
                    items={recommendations}
                    itemWidth={150}
                    gap={20}
                    renderItem={(item) => (
                      <RecommendationCard key={item.id} item={item} />
                    )}
                  />
                </div>
                </section>
              </LazySection>
            </div>

            {/* ── ANNOUNCEMENTS ── */}
            {announcements.length > 0 && (
              <LazySection minHeight="150px">
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
              </LazySection>
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
