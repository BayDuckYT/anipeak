import { useEffect, useRef, useMemo, lazy, Suspense, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, BookOpen, ChevronRight, Flame, Play, Plus, Info,
  TrendingUp, Crown, Bell, Compass, Search, Zap, Trophy, Sparkles
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { handleImageError, getOptimizedImage } from '../utils/imageOpt.js';
import VirtualHScroll from '../components/VirtualHScroll.jsx';
import LazySection from '../components/LazySection.jsx';
import { useSEO } from '../hooks/useSEO';

const ElitePodium = lazy(() => import('../components/ElitePodium.jsx'));

// ── Motion Variants ──
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// ── Ultra-Premium Netflix Style Card ──
function GlassCard({ item, type = 'trending', rank, chapters }) {
  const isTrending = type === 'trending';
  const chapterData = chapters ? (chapters[String(item.id)]?.[0]?.number || '?') : '?';

  return (
    <Link to={`/manga/${item.slug}`} className="group block w-[160px] sm:w-[200px] flex-shrink-0 netflix-card" aria-label={`${item.title} okumaya başla`}>
      <article 
        style={{ contentVisibility: 'auto', containIntrinsicSize: '200px 280px' }}
        className="relative rounded-md overflow-hidden bg-[#141414] border border-white/5 transition-all duration-300 shadow-xl"
      >
        {isTrending && rank && (
          <div className="absolute top-0 left-0 z-20 pointer-events-none">
            <div className={`flex items-center justify-center w-10 h-10 rounded-br-md text-xl font-black italic shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${
              rank === 1 ? 'bg-gradient-to-br from-[#E50914] to-red-900 text-white' : 
              rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-[#141414]' : 
              rank === 3 ? 'bg-gradient-to-br from-orange-500 to-orange-800 text-white' : 
              'bg-gradient-to-br from-zinc-700 to-zinc-900 text-white'
            }`}>
              #{rank}
            </div>
          </div>
        )}
        <div className="relative aspect-[2/3] overflow-hidden bg-[#070511]">
          <img 
            src={getOptimizedImage(item.cover, 200)} 
            alt={item.title} 
            className="w-full h-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100" 
            loading="lazy"
            decoding="async"
            width={200}
            height={300}
            onError={handleImageError} 
          />
          {/* Netflix style bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded border border-white/10 opacity-100 transition-opacity">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-white text-[10px] font-bold">{item.rating}</span>
          </div>

          {/* Hover Details overlaying the image */}
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex flex-col gap-1 z-10">
            <h3 className="text-white text-sm font-black truncate shadow-black drop-shadow-md">{item.title}</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="text-emerald-400 drop-shadow-md">{chapterData} Bölüm</span>
              <span className="text-slate-300 drop-shadow-md truncate">{Array.isArray(item.genre) ? item.genre[0] : item.genre || 'Aksiyon'}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT - "GÜZELLİK ABİDESİ" VERSİYON
// ════════════════════════════════════════════════════════════════════════
export default function Home({ onAuthOpen }) {
  const trendRef = useRef(null);
  const location = useLocation();
  const { user, readingHistory } = useAuth();
  const { sortedSeries, announcements, chapters, getChapters } = useApp();

  useSEO({
    title: 'Ana Sayfa',
    description: 'MahoraPeak - Premium Manhwa ve Webtoon okuma platformu. En popüler manga,manhwa,manhua ve webtoonları keşfet, oku ve eğlen.',
    url: 'https://mahorapeak.com.tr/'
  });

  // 1. Performans: Sadece 500 seri üzerinden işlem yap (Gereksiz render'ı önler)
  const validSeries = useMemo(() => {
    const arr = [];
    for (let i = 0; i < sortedSeries.length; i++) {
      if (!sortedSeries[i].is_deleted) {
        arr.push(sortedSeries[i]);
        if (arr.length >= 500) break;
      }
    }
    return arr;
  }, [sortedSeries]);

  // 2. Veri Setleri
  // Admin panelindeki alev ikonu (is_trending) artık VİTRİN/HERO seçimini temsil ediyor.
  const adminSelectedHeroSeries = useMemo(() => validSeries.filter(s => s.is_trending || (s.hero_bg && s.hero_bg.trim() !== '')), [validSeries]);
  
  // Trend Seriler artık EN ÇOK OKUNAN (reads_num) serileri gösteriyor.
  const trendingSeries = useMemo(() => [...validSeries].sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0)).slice(0, 15), [validSeries]);

  const [activeType, setActiveType] = useState('TÜMÜ');

  const newChapterSeries = useMemo(() => {
    let list = [...validSeries];
    if (activeType !== 'TÜMÜ') {
      list = list.filter(s => {
        const mGenres = Array.isArray(s.genre) ? s.genre : s.genre ? [s.genre] : [];
        return mGenres.some(g => g.toLowerCase() === activeType.toLowerCase());
      });
    }
    return list
      .map(s => ({ ...s, ts: chapters[String(s.id)]?.[0]?.created_at || '1970-01-01' }))
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, 12);
  }, [validSeries, chapters, activeType]);
  
  const mostPopular = useMemo(() => {
    return [...validSeries].sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.reads_num || 0) - (a.reads_num || 0);
    }).slice(0, 10);
  }, [validSeries]);

  // 3. Hero Carousel Logic
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroItems = adminSelectedHeroSeries.length > 0 ? adminSelectedHeroSeries : validSeries.slice(0, 5);
  
  useEffect(() => {
    if (heroItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % heroItems.length);
    }, 7000); // 7 saniyede bir değişir
    return () => clearInterval(interval);
  }, [heroItems.length]);

  const activeHero = heroItems[currentHeroIndex] || heroItems[0];
  const activeHeroImage = activeHero ? getOptimizedImage(activeHero.hero_bg || activeHero.cover, 800) : '';
  const heroChapterCount = activeHero ? getChapters(activeHero.id).length : 0;

  // Preload SADECE ilk resim için (Lighthouse LCP metriği için kritik)
  useEffect(() => {
    if (!heroItems[0]) return;
    const firstImgSrc = getOptimizedImage(heroItems[0].hero_bg || heroItems[0].cover, 800);
    if (!firstImgSrc || firstImgSrc.startsWith('/')) return;
    const existing = document.querySelector('link[data-hero-preload]');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = firstImgSrc;
    link.setAttribute('data-hero-preload', 'true');
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  }, [heroItems]);

  useEffect(() => {
    if (location.hash === '#trendler' && trendRef.current) {
      setTimeout(() => trendRef.current.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  return (
    <main className="min-h-screen bg-[#070511] text-slate-200 selection:bg-purple-500/30" id="home-top">
      
      {/* ── 1. DİNAMİK HERO CAROUSEL (Netflix Stili) ── */}
      {activeHero && (
        <section className="relative w-full h-[85vh] lg:h-screen min-h-[600px] flex items-center overflow-hidden bg-[#141414]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHero.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 z-0"
            >
              {/* Ken Burns Effect using a slower transition scale */}
              <div className="w-full h-full transform scale-105 animate-[kenburns_20s_ease-out_forwards]">
                <img 
                  src={activeHeroImage} 
                  alt={`${activeHero.title} arkaplan`} 
                  width="1920"
                  height="1080"
                  className="w-full h-full object-cover object-top opacity-70 lg:opacity-80"
                  fetchpriority={currentHeroIndex === 0 ? "high" : "auto"}
                  loading={currentHeroIndex === 0 ? "eager" : "lazy"}
                />
              </div>
              
              {/* Netflix Gradients: Darker left side, fade to bottom */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/60 to-transparent w-full lg:w-[70%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-transparent to-transparent h-full" />
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070511] to-transparent z-10" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-20 w-full px-4 sm:px-12 lg:px-24 mt-20 lg:mt-0 pt-16 pb-20 lg:py-0">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`content-${activeHero.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="flex flex-col lg:flex-row items-center lg:items-end gap-8 lg:gap-12"
              >
                {/* Sol Taraf - Poster (Netflix stili ama poster görünümlü) */}
                <div className="hidden md:block flex-shrink-0 w-48 lg:w-64 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden border border-white/10 group relative">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Link to={`/manga/${activeHero.slug}/bolum-${heroChapterCount > 0 ? 1 : ''}`} className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center hover:scale-110 transition-transform">
                      <BookOpen size={24} className="text-white" />
                    </Link>
                  </div>
                  <img 
                    src={getOptimizedImage(activeHero.cover, 400)} 
                    alt={activeHero.title} 
                    width={400}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[2/3] object-cover"
                  />
                </div>

                {/* Sağ Taraf - Metin ve Butonlar */}
                <div className="flex flex-col w-full lg:w-[60%]">
                  {/* Title */}
                  <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[1] mb-6 drop-shadow-2xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
                    {activeHero.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base font-bold text-slate-300 mb-6 uppercase tracking-wider drop-shadow-md">
                    <span className="text-emerald-400">{activeHero.rating} Puan</span>
                    <span>{heroChapterCount} Bölüm</span>
                    <span className="px-2 py-0.5 border border-slate-500 text-slate-300 rounded-sm text-xs">
                      {Array.isArray(activeHero.genre) ? activeHero.genre[0] : activeHero.genre || 'AKSİYON'}
                    </span>
                    <span className="px-2 py-0.5 border border-slate-500 text-slate-300 rounded-sm text-xs">HD</span>
                  </div>

                  <p className="text-slate-200 text-base sm:text-lg leading-relaxed mb-10 line-clamp-3 lg:line-clamp-4 font-medium drop-shadow-md max-w-2xl">
                    {activeHero.description || "Efsanevi maceraya hemen katıl. Yüksek kaliteli çevirilerle kesintisiz okuma deneyimi seni bekliyor."}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <Link to={`/manga/${activeHero.slug}/bolum-${heroChapterCount > 0 ? 1 : ''}`} className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-bold text-lg rounded md:rounded-md hover:bg-white/80 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg">
                      <BookOpen size={24} className="text-black" /> Oku
                    </Link>
                    <Link to={`/manga/${activeHero.slug}`} className="w-full sm:w-auto px-8 py-3.5 bg-[#6d6d6eb3] hover:bg-[#6d6d6e] text-white font-bold text-lg rounded md:rounded-md backdrop-blur-sm transition-colors flex items-center justify-center gap-3 active:scale-95 shadow-lg">
                      <Info size={24} /> Daha Fazla Bilgi
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Okları (Desktop) - Netflix usually hides them or puts them on edges */}
            <button 
              onClick={() => setCurrentHeroIndex(prev => (prev - 1 + heroItems.length) % heroItems.length)}
              className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-16 h-full items-center justify-center text-white/50 hover:text-white transition-all z-20"
              aria-label="Önceki"
            >
              <ChevronRight size={48} className="rotate-180 drop-shadow-lg" />
            </button>
            <button 
              onClick={() => setCurrentHeroIndex(prev => (prev + 1) % heroItems.length)}
              className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-16 h-full items-center justify-center text-white/50 hover:text-white transition-all z-20"
              aria-label="Sonraki"
            >
              <ChevronRight size={48} className="drop-shadow-lg" />
            </button>
          </div>
        </section>
      )}


      {/* ── İÇERİK BÖLÜMÜ (Netflix Rows) ── */}
      <div className="w-full px-4 sm:px-12 lg:px-16 py-8 sm:py-12 bg-[#141414] min-h-screen">
        <div className="flex flex-col gap-12 sm:gap-16">
          
          <div className="flex-1 min-w-0 space-y-12 sm:space-y-16">
            
            {/* 1.5. KALDIĞIN YERDEN DEVAM ET (Continue Reading) */}
            <AnimatePresence>
              {user && readingHistory && readingHistory.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20">
                      <Compass size={16} className="text-blue-400" />
                    </div>
                    Kaldığın Yerden Devam Et
                  </h2>
                  <VirtualHScroll 
                    items={readingHistory.slice(0, 5).map(rh => {
                      const s = validSeries.find(s => String(s.id) === rh.manhwaId);
                      return s ? { ...s, lastReadChapter: rh.lastChapter } : null;
                    }).filter(Boolean)} 
                    itemWidth={200} 
                    gap={16} 
                    className="netflix-row-container"
                    renderItem={(item) => (
                      <Link key={`history-${item.id}`} to={`/manga/${item.slug}/bolum-${item.lastReadChapter}`} className="group block w-[160px] sm:w-[200px] flex-shrink-0 netflix-card" title={`${item.title} - Bölüm ${item.lastReadChapter} okumaya devam et`}>
                        <article className="relative rounded-md overflow-hidden bg-[#141414] border border-white/10 transition-all duration-300 shadow-xl group-hover:border-blue-500/50">
                          <div className="relative aspect-[2/3] overflow-hidden bg-[#070511]">
                            <img src={getOptimizedImage(item.cover, 200)} alt={item.title} className="w-full h-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-100" width={200} height={300} loading="lazy" decoding="async" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/40 to-transparent opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <div className="w-12 h-12 rounded-full bg-blue-600/90 backdrop-blur flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.8)] transform scale-75 group-hover:scale-100 transition-all duration-300">
                                <Play size={20} className="ml-1" />
                              </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-1 z-10">
                              <h3 className="text-white text-xs font-black truncate shadow-black drop-shadow-md">{item.title}</h3>
                              <div className="flex items-center justify-between">
                                <span className="text-blue-400 font-bold text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded backdrop-blur">Bölüm {item.lastReadChapter}</span>
                              </div>
                            </div>
                            {/* Progress bar mock (could be real if we track pages) */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
                              <div className="h-full bg-blue-500 w-[70%]" />
                            </div>
                          </div>
                        </article>
                      </Link>
                    )} 
                  />
                </motion.section>
              )}
            </AnimatePresence>

            {/* 2. TREND SERİLER (Yatay Scroll) */}
            <motion.section 
              ref={trendRef} id="trendler"
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  Trend Seriler
                </h2>
                <Link to="/all-series" className="text-xs font-black tracking-widest uppercase text-slate-400 hover:text-white transition-colors flex items-center gap-1 group">
                  Tümünü Gör <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <VirtualHScroll 
                items={trendingSeries} 
                itemWidth={200} 
                gap={16} 
                className="netflix-row-container"
                renderItem={(item, i) => (
                  <GlassCard key={item.id} item={item} type="trending" rank={i + 1} />
                )} 
              />
            </motion.section>

            {/* 3. EN POPÜLERLER KÜRSÜSÜ (Elite Podium) */}
            <LazySection minHeight="400px">
              <motion.section id="populerler" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <Trophy size={24} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" /> 
                    </div>
                    Zirvedekiler
                  </h2>
                </div>
                <Suspense fallback={<div className="h-[400px] bg-[#130E26]/50 animate-pulse rounded-3xl border border-white/5" />}>
                  <ElitePodium items={mostPopular} />
                </Suspense>
              </motion.section>
            </LazySection>

            {/* 4. YENİ EKLENEN BÖLÜMLER */}
            <LazySection minHeight="240px">
              <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <Zap size={20} className="text-emerald-500" />
                    </div>
                    Yeni Bölümler
                  </h2>
                  <div className="flex items-center gap-1 bg-[#130E26]/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                    {['TÜMÜ', 'MANHWA', 'MANGA', 'MANHUA', 'WEBTOON'].map(f => (
                      <button
                        key={f}
                        onClick={() => setActiveType(f)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeType === f ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <VirtualHScroll 
                  items={newChapterSeries} 
                  itemWidth={200} 
                  gap={16} 
                  className="netflix-row-container"
                  renderItem={(item) => (
                    <GlassCard key={item.id} item={item} type="new" chapters={chapters} />
                  )} 
                />
              </motion.section>
            </LazySection>

            {/* 5. PREMIUM CTA BÖLÜMÜ */}
            <motion.section 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              className="relative rounded-3xl overflow-hidden group"
            >
              {/* Premium Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-[#130E26] to-blue-900 border border-purple-500/30 rounded-3xl" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-glow" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-glow" style={{ animationDelay: '2s' }} />

              <div className="relative z-10 px-6 py-12 sm:p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                  <Crown size={32} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-white mb-4 uppercase tracking-tighter drop-shadow-lg">
                  Elitlerin Dünyasına Katıl
                </h3>
                <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
                  Reklamsız pürüzsüz okuma deneyimi, sana özel <span className="text-purple-400 font-bold">Haneler</span>, ismine özel parlayan efektler ve yeni bölümlere herkesten önce erişim fırsatı.
                </p>
                <Link to="/elite-upgrade" className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-[#070511] font-black text-sm uppercase tracking-widest rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] active:scale-95">
                  Premium Satın Al <ChevronRight size={18} />
                </Link>
              </div>
            </motion.section>

          </div>
        </div>
      </div>
    </main>
  );
}
