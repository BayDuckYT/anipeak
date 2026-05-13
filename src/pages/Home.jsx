import { useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Star, BookOpen, ChevronRight, Flame, Play, Plus,
  TrendingUp, Crown, Bell, Compass, Search, Zap, Trophy
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { handleImageError, getOptimizedImage } from '../utils/imageOpt.js';
import VirtualHScroll from '../components/VirtualHScroll.jsx';
import LazySection from '../components/LazySection.jsx';

const ElitePodium = lazy(() => import('../components/ElitePodium.jsx'));

// ── Sadeleştirilmiş Zaman Formatlayıcı ──
function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMins = Math.floor((now - date) / 60000);
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gün önce`;
  return `${Math.floor(diffDays / 7)} hafta önce`;
}

// ── Ultra-Sade Kart Bileşenleri ──
function MinimalCard({ item, type = 'trending', rank, chapters }) {
  const isTrending = type === 'trending';
  const chapterData = chapters ? (chapters[String(item.id)]?.[0]?.number || '?') : '?';

  return (
    <Link to={`/manhwa/${item.id}`} className="group block w-[140px] sm:w-[160px] flex-shrink-0" aria-label={`${item.title} serisine git`}>
      <div className="relative rounded-xl overflow-hidden bg-[#0c0a10] border border-white/5 transition-colors hover:border-purple-500/40">
        {isTrending && rank && (
          <div className="absolute top-2 left-2 z-20 pointer-events-none">
            <span className={`text-4xl font-black italic drop-shadow-lg ${
              rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-200' : rank === 3 ? 'text-orange-400' : 'text-white/80'
            }`} style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.9)' }}>
              {rank}
            </span>
          </div>
        )}
        <div className="relative" style={{ aspectRatio: '3/4' }}>
          <img 
            src={getOptimizedImage(item.cover, 200)} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            loading="lazy"
            decoding="async"
            onError={handleImageError} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded border border-white/10">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-white text-[10px] font-bold">{item.rating}</span>
          </div>
        </div>
        <div className="p-3 bg-[#0c0a10]">
          <h3 className="text-slate-200 text-sm font-bold truncate group-hover:text-purple-400 transition-colors">{item.title}</h3>
          {!isTrending && (
            <p className="text-slate-400 text-xs mt-1">Bölüm {chapterData}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function SidebarItem({ item, rank }) {
  return (
    <Link to={`/manhwa/${item.id}`} className="flex items-center gap-3 py-2.5 group border-b border-white/5 last:border-0" aria-label={`${item.title} keşfet`}>
      <span className="text-slate-400 font-mono font-bold w-4 text-center group-hover:text-purple-400">{rank}</span>
      <div className="w-10 h-14 flex-shrink-0 rounded bg-white/5 overflow-hidden">
        <img src={getOptimizedImage(item.cover, 100)} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100" loading="lazy" decoding="async" onError={handleImageError} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-slate-200 text-sm font-bold truncate group-hover:text-purple-300">{item.title}</h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-slate-400 text-xs">{item.rating}</span>
        </div>
      </div>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT - "SADE VE ORİJİNAL" VERSİYON
// ════════════════════════════════════════════════════════════════════════
export default function Home({ onAuthOpen }) {
  const trendRef = useRef(null);
  const location = useLocation();
  const { user } = useAuth();
  const { sortedSeries, announcements, chapters, getChapters } = useApp();

  // Performans: Sadece 500 seri üzerinden işlem yap
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

  // Karusel yerine tek bir statik Hero (En Popüler Seri)
  const heroItem = useMemo(() => validSeries.filter(s => s.is_trending)[0] || validSeries[0], [validSeries]);
  const heroChapterCount = heroItem ? getChapters(heroItem.id).length : 0;
  
  const heroImageSrc = useMemo(() => {
    if (!heroItem) return '';
    return getOptimizedImage(heroItem.hero_bg || heroItem.cover, 400);
  }, [heroItem]);

  // Preload Hero Image
  useEffect(() => {
    if (!heroImageSrc || heroImageSrc.startsWith('/')) return;
    const existing = document.querySelector('link[data-hero-preload]');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = heroImageSrc;
    link.setAttribute('data-hero-preload', 'true');
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  }, [heroImageSrc]);

  // Veri Setleri
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

  useEffect(() => {
    if (location.hash === '#trendler' && trendRef.current) {
      setTimeout(() => trendRef.current.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  return (
    <main className="min-h-screen bg-[#050507]" id="home-top">
      
      {/* ── STATİK HERO SECTION (Sıfır Javascript Animasyonu, Maksimum Hız) ── */}
      {heroItem && (
        <section className="relative pt-20 pb-12 sm:pb-16 lg:pt-28 lg:pb-24 border-b border-white/5 overflow-hidden">
          {/* Arka Plan Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0812] to-[#050507] pointer-events-none" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
              
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-widest text-purple-400 border border-purple-500/20 rounded-full uppercase">
                  Haftanın En İyisi
                </span>
                
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-tight sm:leading-none mb-4">
                  {heroItem.title}
                </h1>
                
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mb-6 justify-center lg:justify-start">
                  <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> {heroItem.rating} Puan</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><BookOpen size={14} /> {heroChapterCount} Bölüm</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{Array.isArray(heroItem.genre) ? heroItem.genre[0] : heroItem.genre || 'Aksiyon'}</span>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 line-clamp-3 px-2 sm:px-0">
                  {heroItem.description || "Efsanevi maceraya hemen katıl. Yüksek kaliteli çevirilerle kesintisiz okuma deneyimi."}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link to={`/manhwa/${heroItem.id}`} className="w-full sm:w-auto px-10 py-3.5 bg-white text-black font-black text-sm rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 active:scale-95 touch-manipulation">
                    <Play size={16} className="fill-black" /> Oku Şimdi
                  </Link>
                  <button onClick={() => { if (!user) onAuthOpen('login'); }} className="w-full sm:w-auto px-8 py-3.5 bg-white/5 text-white border border-white/10 font-bold text-sm rounded-xl hover:bg-white/10 transition-colors active:scale-95 touch-manipulation">
                    Listeme Ekle
                  </button>
                </div>
              </div>

              <div className="hidden lg:block w-[280px] flex-shrink-0">
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src={heroImageSrc} alt={heroItem.title} className="w-full h-auto object-cover" loading="eager" fetchpriority="high" decoding="async" />
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── İÇERİK IZGARASI ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
          
          <div className="flex-1 min-w-0 space-y-12 sm:space-y-16">
            
            {/* Trendler */}
            <section ref={trendRef} id="trendler">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame size={18} className="text-orange-500" /> Trend Seriler
                </h2>
                <Link to="/all-series" className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-white transition-colors">Tümünü Gör</Link>
              </div>
              <VirtualHScroll items={trendingSeries.length > 0 ? trendingSeries : validSeries.slice(0, 5)} itemWidth={160} gap={16} renderItem={(item, i) => (
                <MinimalCard key={item.id} item={item} type="trending" rank={i + 1} />
              )} />
            </section>

            {/* En Popülerler Kürsüsü */}
            <LazySection minHeight="400px">
              <section id="populerler">
                <div className="flex items-center justify-between mb-8 sm:mb-10">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <Trophy size={24} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" /> 
                    En Popülerler
                  </h2>
                </div>
                <Suspense fallback={<div className="h-[400px] bg-zinc-900/50 animate-pulse rounded-2xl border border-white/5" />}>
                  <ElitePodium items={mostPopular} />
                </Suspense>
              </section>
            </LazySection>

            {/* Yeni Bölümler */}
            <LazySection minHeight="240px">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap size={18} className="text-emerald-500" /> Yeni Eklenenler
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {newChapterSeries.map((item) => (
                    <MinimalCard key={item.id} item={item} type="new" chapters={chapters} />
                  ))}
                </div>
              </section>
            </LazySection>

            {/* Duyurular */}
            {announcements.length > 0 && (
              <LazySection minHeight="100px">
                <section className="bg-white/5 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <Bell size={16} className="text-purple-400" /> Duyurular
                  </h3>
                  <div className="space-y-4">
                    {announcements.slice(0, 3).map((ann) => (
                      <div key={ann.id} className="flex items-start gap-4 text-sm text-slate-300 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        <p className="flex-1 leading-relaxed">{ann.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </LazySection>
            )}

            {/* Premium CTA */}
            <section className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown size={120} />
              </div>
              <div className="relative z-10">
                <Crown size={32} className="text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 uppercase tracking-tight">Premium Ayrıcalıkları</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">Reklamsız okuma, özel discord rolleri, isim efektleri ve herkesten önce yeni bölümler!</p>
                <Link to="/elite-upgrade" className="inline-block px-10 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-900/40 active:scale-95 touch-manipulation">
                  HEMEN ELİTE OL
                </Link>
              </div>
            </section>

          </div>

          {/* SAĞ SÜTUN (Desktop Sidebar) */}
          <aside className="hidden xl:block w-[300px] flex-shrink-0 space-y-10">
            <div className="bg-[#0c0a10] border border-white/5 rounded-2xl p-6 sticky top-24">
               <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <Search size={16} className="text-slate-400" /> Tür Keşfet
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {['Aksiyon', 'Romantik', 'Fantezi', 'Okul', 'Komedi', 'Macera', 'Dram', 'Shounen', 'Seinen'].map(g => (
                  <Link key={g} to={`/all-series?genre=${g}`} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-purple-500/20 hover:border-purple-500/30 transition-all">
                    {g}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
