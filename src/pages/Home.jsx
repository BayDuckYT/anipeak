import { useEffect, useRef, useMemo, lazy, Suspense, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, BookOpen, ChevronRight, Flame, Play, Plus,
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

// ── Ultra-Premium Glass Card ──
function GlassCard({ item, type = 'trending', rank, chapters }) {
  const isTrending = type === 'trending';
  const chapterData = chapters ? (chapters[String(item.id)]?.[0]?.number || '?') : '?';

  return (
    <Link to={`/manhwa/${item.id}`} className="group block w-[150px] sm:w-[180px] flex-shrink-0" aria-label={`${item.title} okumaya başla`}>
      <motion.article 
        whileHover={{ y: -8, scale: 1.02 }}
        className="relative rounded-2xl overflow-hidden bg-[#130E26]/60 backdrop-blur-xl border border-white/5 transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]"
      >
        {isTrending && rank && (
          <div className="absolute top-0 left-0 z-20 pointer-events-none">
            <div className={`flex items-center justify-center w-10 h-10 rounded-br-2xl text-lg font-black italic shadow-lg ${
              rank === 1 ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-[#070511]' : 
              rank === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-[#070511]' : 
              rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 
              'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
            }`}>
              #{rank}
            </div>
          </div>
        )}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#070511]">
          <img 
            src={getOptimizedImage(item.cover, 300)} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
            loading="lazy"
            decoding="async"
            width={180}
            height={240}
            onError={handleImageError} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/20 to-transparent opacity-90 transition-opacity duration-300" />
          
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/10">
            <Star size={12} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
            <span className="text-white text-[11px] font-black">{item.rating}</span>
          </div>
        </div>
        
        <div className="p-4 relative z-10">
          <h3 className="text-slate-100 text-sm font-bold truncate group-hover:text-purple-300 transition-colors" title={item.title}>{item.title}</h3>
          {!isTrending && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-purple-400/90 text-[11px] font-black tracking-wider uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Bölüm {chapterData}
              </span>
            </div>
          )}
          {isTrending && (
             <p className="text-slate-400 text-xs mt-1.5 truncate font-medium">{Array.isArray(item.genre) ? item.genre[0] : item.genre || 'Aksiyon'}</p>
          )}
        </div>
      </motion.article>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT - "GÜZELLİK ABİDESİ" VERSİYON
// ════════════════════════════════════════════════════════════════════════
export default function Home({ onAuthOpen }) {
  const trendRef = useRef(null);
  const location = useLocation();
  const { user } = useAuth();
  const { sortedSeries, announcements, chapters, getChapters } = useApp();

  useSEO({
    title: 'Ana Sayfa',
    description: 'AniPeak - Premium Manhwa ve Webtoon okuma platformu. En popüler manhwaları keşfet, oku ve eğlen.',
    url: 'https://anipeak.com.tr/'
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
  const trendingSeries = useMemo(() => validSeries.filter(s => s.is_trending).slice(0, 5), [validSeries]);
  const newChapterSeries = useMemo(() => {
    return [...validSeries]
      .map(s => ({ ...s, ts: chapters[String(s.id)]?.[0]?.created_at || '1970-01-01' }))
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, 12);
  }, [validSeries, chapters]);
  
  const mostPopular = useMemo(() => {
    return [...validSeries].sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.reads_num || 0) - (a.reads_num || 0);
    }).slice(0, 10);
  }, [validSeries]);

  // 3. Hero Carousel Logic
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroItems = trendingSeries.length > 0 ? trendingSeries : validSeries.slice(0, 5);
  
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
      
      {/* ── 1. DİNAMİK HERO CAROUSEL (AnimeRank Stili) ── */}
      {activeHero && (
        <section className="relative w-full min-h-[85vh] lg:h-[85vh] max-h-[900px] flex items-center overflow-hidden border-b border-white/5">
          <AnimatePresence mode="wait">
            {/* Arka Plan (Bulanık ve Karanlık) */}
            <motion.div
              key={activeHero.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 z-0"
            >
              <img 
                src={activeHeroImage} 
                alt={`${activeHero.title} arkaplan`} 
                className="w-full h-full object-cover opacity-30 filter blur-xl scale-110"
                fetchpriority={currentHeroIndex === 0 ? "high" : "auto"}
                loading={currentHeroIndex === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-[#070511]/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#070511]/80 via-transparent to-transparent h-48" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 lg:mt-0 pt-16 pb-20 lg:py-0">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`content-${activeHero.id}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16"
              >
                {/* Sol: Poster Kartı */}
                <div className="w-[200px] sm:w-[260px] lg:w-[320px] flex-shrink-0 group">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10 group-hover:border-purple-500/50 transition-colors duration-500">
                    <img 
                      src={getOptimizedImage(activeHero.cover, 600)} 
                      alt={activeHero.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Sağ: Bilgiler */}
                <div className="flex-1 text-center lg:text-left">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full"
                  >
                    <Sparkles size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400 uppercase">
                      Günün Öne Çıkanı
                    </span>
                  </motion.div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-4 drop-shadow-lg">
                    {activeHero.title}
                  </h1>
                  
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3 lg:line-clamp-4 font-medium opacity-90 max-w-2xl mx-auto lg:mx-0">
                    {activeHero.description || "Efsanevi maceraya hemen katıl. Yüksek kaliteli çevirilerle kesintisiz okuma deneyimi seni bekliyor."}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs font-bold text-slate-300 mb-8 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Star size={14} className="fill-amber-400" /> {activeHero.rating} Puan
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="flex items-center gap-1.5 text-white">
                      <BookOpen size={14} className="text-slate-400" /> {heroChapterCount} Bölüm
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="flex items-center gap-1.5 text-purple-400">
                      <Flame size={14} /> {Array.isArray(activeHero.genre) ? activeHero.genre[0] : activeHero.genre || 'Aksiyon'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                    <Link to={`/manhwa/${activeHero.id}`} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-sm rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                      <Play size={16} className="fill-white" /> OKUMAYA BAŞLA
                    </Link>
                    <button onClick={() => { if (!user) onAuthOpen('login'); }} aria-label="Listeme ekle" className="w-full sm:w-auto px-8 py-4 bg-white/5 backdrop-blur-md text-white border border-white/10 font-bold text-sm rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 active:scale-95">
                      <Plus size={16} /> Listeye Ekle
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Okları (Desktop) */}
            <button 
              onClick={() => setCurrentHeroIndex(prev => (prev - 1 + heroItems.length) % heroItems.length)}
              className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/80 border border-white/10 rounded-full items-center justify-center text-white backdrop-blur-md transition-all z-20 hover:scale-110"
              aria-label="Önceki"
            >
              <ChevronRight size={24} className="rotate-180" />
            </button>
            <button 
              onClick={() => setCurrentHeroIndex(prev => (prev + 1) % heroItems.length)}
              className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/80 border border-white/10 rounded-full items-center justify-center text-white backdrop-blur-md transition-all z-20 hover:scale-110"
              aria-label="Sonraki"
            >
              <ChevronRight size={24} />
            </button>

            {/* Carousel Noktaları (Mobil) */}
            <div className="lg:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {heroItems.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentHeroIndex ? 'w-8 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── İÇERİK IZGARASI ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-16">
          
          <div className="flex-1 min-w-0 space-y-20">
            
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
              
              <VirtualHScroll items={trendingSeries.length > 0 ? trendingSeries : validSeries.slice(0, 5)} itemWidth={180} gap={20} renderItem={(item, i) => (
                <GlassCard key={item.id} item={item} type="trending" rank={i + 1} />
              )} />
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
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <Zap size={20} className="text-emerald-500" />
                    </div>
                    Yeni Bölümler
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {newChapterSeries.map((item) => (
                    <motion.div key={item.id} variants={fadeInUp}>
                      <GlassCard item={item} type="new" chapters={chapters} />
                    </motion.div>
                  ))}
                </div>
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

          {/* SAĞ SÜTUN (Desktop Sidebar) */}
          <aside className="hidden xl:block w-[320px] flex-shrink-0 space-y-8">
            
            {/* Duyurular - Glassmorphism */}
            {announcements.length > 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-[#130E26]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full" />
                <h3 className="text-white font-black text-sm uppercase tracking-wider mb-6 flex items-center gap-2 relative z-10">
                  <Bell size={18} className="text-purple-400" /> Son Duyurular
                </h3>
                <div className="space-y-4 relative z-10">
                  {announcements.slice(0, 4).map((ann) => (
                    <div key={ann.id} className="flex items-start gap-4 text-sm text-slate-300 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      <p className="flex-1 leading-relaxed text-[13px]">{ann.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tür Keşfet */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-[#130E26]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 shadow-xl">
               <h3 className="text-white font-black text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <Compass size={18} className="text-cyan-400" /> Tür Keşfet
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {['Aksiyon', 'Romantik', 'Fantezi', 'Okul', 'Komedi', 'Macera', 'Dram', 'Shounen', 'Seinen', 'Büyü'].map(g => (
                  <Link key={g} to={`/all-series?genre=${g}`} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black tracking-wider uppercase text-slate-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all hover:scale-105 active:scale-95 shadow-sm">
                    {g}
                  </Link>
                ))}
              </div>
            </motion.div>
            
          </aside>

        </div>
      </div>
    </main>
  );
}
