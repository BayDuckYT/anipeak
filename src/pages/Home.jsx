import { useEffect, useRef, useMemo, useState, useCallback, Children } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, BookOpen, ChevronRight, ChevronLeft, Flame, Play, Crown, Sparkles,
  ArrowRight, Info, History, TrendingUp, Zap, CheckCircle2, Trophy, Eye, Clock
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { handleImageError, getOptimizedImage } from '../utils/imageOpt.js';
import { useSEO } from '../hooks/useSEO';
import '../styles/home.css';

const HERO_DURATION = 7000;

// ── Ultra-Akıcı Donanım Hızlandırmalı Motion Varyantları ──
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

// ── Yardımcı Fonksiyonlar ──
const genresOf = (s) => (Array.isArray(s?.genre) ? s.genre : s?.genre ? [s.genre] : []);
const fmtRating = (r) => (r ? Number(r).toFixed(1) : null);
const fmtReads = (n) => {
  if (!n) return null;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

// ════════════════════════════════════════════════════════════════════════
// ORTAK BİLEŞENLER
// ════════════════════════════════════════════════════════════════════════

function SectionHeader({ icon: Icon, title, subtitle, to, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-gradient-to-br from-violet-600/35 via-fuchsia-600/20 to-transparent border border-violet-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.28)]">
          <Icon size={20} className="text-violet-300" />
        </div>
        <div className="min-w-0">
          <h2 className="text-white text-xl sm:text-2xl font-black tracking-tight leading-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && <p className="text-slate-400 text-xs sm:text-sm mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {children}
        {to && (
          <Link
            to={to}
            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-xs font-bold text-violet-300 hover:text-white transition-all whitespace-nowrap shadow-sm"
          >
            Tümünü Gör
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  );
}

function ScrollRow({ children, variant = 'poster' }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const count = Children.count(children);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update, count]);

  const scroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: 'smooth' });
  };

  return (
    <div className="relative group/row">
      {canLeft && (
        <button type="button" onClick={() => scroll(-1)} className="mp-row-arrow mp-row-arrow--left" aria-label="Sola kaydır">
          <ChevronLeft size={20} />
        </button>
      )}
      <div ref={ref} className={`mp-row mp-row--${variant}`}>{children}</div>
      {canRight && (
        <button type="button" onClick={() => scroll(1)} className="mp-row-arrow mp-row-arrow--right" aria-label="Sağa kaydır">
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}

function RatingBadge({ rating, className = '' }) {
  const r = fmtRating(rating);
  if (!r) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-black text-amber-300 shadow-md ${className}`}>
      <Star size={11} className="text-amber-400 fill-amber-400" />
      {r}
    </span>
  );
}

const RANK_STYLES = {
  1: 'from-amber-300 via-amber-400 to-amber-600 text-black shadow-[0_0_20px_rgba(251,191,36,0.6)]',
  2: 'from-slate-100 via-slate-300 to-slate-400 text-[#111] shadow-[0_0_15px_rgba(203,213,225,0.4)]',
  3: 'from-orange-400 via-orange-500 to-amber-700 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]',
};

// ════════════════════════════════════════════════════════════════════════
// YENİLENMİŞ ULTRA-MODERN POSTER KARTI (Gören "Off Muk" Desin!)
// ════════════════════════════════════════════════════════════════════════
function PosterCard({ item, rank, isNew, meta, badge }) {
  const genres = genresOf(item);
  const primaryGenre = genres[0] || null;

  return (
    <Link 
      to={`/manga/${item.slug}`} 
      className="group block relative" 
      aria-label={`${item.title} detaylarını gör`}
    >
      {/* Kartın arkasındaki neon ambient aura */}
      <div className="mp-card-aura" />

      <article 
        style={{ contentVisibility: 'auto', containIntrinsicSize: '190px 290px' }}
        className="mp-card h-full rounded-2xl overflow-hidden bg-[#0F0B24]/90 border border-white/[0.08] group-hover:border-violet-500/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)] group-hover:shadow-[0_20px_40px_-12px_rgba(139,92,246,0.45)]"
      >
        <div className="relative aspect-[3/4.2] overflow-hidden bg-[#070511]">
          {/* Kapak Resmi */}
          <img
            src={getOptimizedImage(item.cover, 280)}
            alt={item.title}
            width={240}
            height={336}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          />

          {/* Cam Yansıması Overlay */}
          <div className="mp-glass-gloss absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity" />

          {/* Alt Karartma Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0F0B24] via-[#0F0B24]/70 to-transparent" />

          {/* Rank Badge */}
          {rank && (
            <span className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-xl bg-gradient-to-br ${RANK_STYLES[rank] || 'from-violet-600 to-indigo-700 text-white'} text-xs font-black flex items-center justify-center border border-white/20`}>
              {rank <= 3 ? (
                <span>#{rank}</span>
              ) : (
                rank
              )}
            </span>
          )}

          {/* Yeni Rozeti */}
          {isNew && !rank && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-violet-900/60 border border-violet-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Yeni
            </span>
          )}

          {/* Özel Badge */}
          {badge && !rank && !isNew && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-violet-600/80 backdrop-blur-md text-white text-[10px] font-bold border border-violet-400/30">
              {badge}
            </span>
          )}

          {/* Puan Rozeti */}
          <RatingBadge rating={item.rating} className="absolute top-2.5 right-2.5" />

          {/* Hover Hızlı Okuma Overlay Aksiyonu */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px] pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-600/90 text-white text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.8)] border border-violet-300/40 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
              <Play size={12} className="fill-current" /> Oku
            </span>
          </div>

          {/* Görselin Altında Minik Bölüm veya Tür Rozeti */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-300">
            {meta && (
              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-violet-300">
                {meta}
              </span>
            )}
            {primaryGenre && (
              <span className="ml-auto px-1.5 py-0.5 rounded-md bg-white/[0.08] backdrop-blur-md text-[10px] text-slate-300 truncate max-w-[70px]">
                {primaryGenre}
              </span>
            )}
          </div>
        </div>

        {/* Kart Başlığı */}
        <div className="p-3 pt-2">
          <h3 className="text-white text-xs sm:text-[13px] font-bold truncate group-hover:text-violet-300 transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span className="truncate">{item.author || item.status || 'Webtoon'}</span>
            {fmtReads(item.reads_num) && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Eye size={11} className="text-slate-500" />
                {fmtReads(item.reads_num)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// YENİ: DEV SPOTLIGHT / ÖNE ÇIKAN AMBIENT DEV KARTLAR (BENTO SHOWCASE)
// ════════════════════════════════════════════════════════════════════════
function GiantSpotlightCard({ item, chapters, badge = 'Haftanın Bombası', accent = 'violet' }) {
  if (!item) return null;
  const itemChapters = chapters[String(item.id)] || [];
  const latestChs = itemChapters.slice(0, 3);
  const genres = genresOf(item);

  return (
    <article className="mp-giant-card group relative flex flex-col md:flex-row items-stretch p-5 sm:p-7 md:p-8 gap-6 md:gap-8">
      {/* 1. Arka Plandaki Devasa Bulanıklaştırılmış Ambient Cover Görseli */}
      <div 
        className="mp-giant-ambient-bg"
        style={{
          backgroundImage: `url(${getOptimizedImage(item.hero_bg || item.cover, 500)})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0C081F] via-[#0C081F]/90 to-[#0C081F]/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0C081F] via-transparent to-transparent md:hidden" />

      {/* 2. Sol Bölüm: 3D Dikey Poster */}
      <div className="relative z-10 flex-shrink-0 mx-auto md:mx-0 w-[170px] sm:w-[200px] md:w-[220px] mp-giant-poster-wrapper">
        <Link to={`/manga/${item.slug}`} className="block relative aspect-[3/4.2] rounded-2xl overflow-hidden mp-giant-poster border-2 border-white/15">
          <img
            src={getOptimizedImage(item.cover, 340)}
            alt={item.title}
            width={240}
            height={336}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
          <div className="mp-glass-gloss absolute inset-0" />
          <RatingBadge rating={item.rating} className="absolute top-3 right-3 text-xs" />
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Info size={14} className="text-violet-300" /> Detayları Gör
            </span>
          </div>
        </Link>
      </div>

      {/* 3. Sağ Bölüm: Zengin Detaylar & Hızlı Bölüm Butonları */}
      <div className="relative z-10 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Badge & Meta */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border border-violet-400/40 text-violet-200 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles size={13} className="text-amber-300" />
              {badge}
            </span>
            {item.status && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.07] border border-white/10 text-slate-300 text-[11px] font-semibold">
                {item.status}
              </span>
            )}
            {itemChapters.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-bold">
                {itemChapters.length} Bölüm
              </span>
            )}
          </div>

          {/* Başlık */}
          <Link to={`/manga/${item.slug}`}>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white hover:text-violet-200 transition-colors tracking-tight leading-tight mb-3 line-clamp-2">
              {item.title}
            </h3>
          </Link>

          {/* Türler */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {genres.slice(0, 5).map((g) => (
              <span
                key={g}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-[11px] font-bold tracking-wide transition-colors"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Özet Metni */}
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 sm:line-clamp-4 mb-5 max-w-2xl">
            {item.description || 'Efsanevi karakterler, soluksuz bir aksiyon ve sürükleyici bir kurgu MahoraPeak kalitesiyle seni bekliyor.'}
          </p>
        </div>

        {/* Alt Aksiyonlar & Hızlı Bölüm Kısayolları */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Son Çıkan Bölümlerin Hızlı Butonları */}
          {latestChs.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Clock size={13} className="text-violet-400" /> Son Bölümler:
              </span>
              {latestChs.map((ch) => (
                <Link
                  key={ch.id || ch.number}
                  to={`/manga/${item.slug}/bolum-${ch.number}`}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-violet-600/30 border border-white/10 hover:border-violet-400/50 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  Bölüm {ch.number}
                </Link>
              ))}
            </div>
          ) : (
            <div />
          )}

          {/* Ana Butonlar */}
          <div className="flex items-center gap-3">
            <Link
              to={latestChs[0] ? `/manga/${item.slug}/bolum-1` : `/manga/${item.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs sm:text-sm font-bold shadow-[0_8px_25px_-6px_rgba(139,92,246,0.7)] hover:shadow-[0_12px_32px_-4px_rgba(168,85,247,0.85)] hover:brightness-110 active:scale-95 transition-all"
            >
              <BookOpen size={16} /> Şimdi Oku
            </Link>
            <Link
              to={`/manga/${item.slug}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs sm:text-sm font-semibold transition-all active:scale-95"
            >
              İncele
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DEVAM ET KARTI
// ════════════════════════════════════════════════════════════════════════
function ContinueCard({ item }) {
  const pct = item.total > 0 ? Math.min(100, Math.round((item.lastReadChapter / item.total) * 100)) : 0;
  return (
    <Link
      to={`/manga/${item.slug}/bolum-${item.lastReadChapter}`}
      className="group block relative"
      title={`${item.title} - Bölüm ${item.lastReadChapter} okumaya devam et`}
    >
      <div className="mp-card-aura" />
      <article className="mp-card h-full rounded-2xl overflow-hidden bg-[#0F0B24]/90 border border-white/[0.08] group-hover:border-violet-500/50 shadow-xl">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#070511]">
          <img
            src={getOptimizedImage(item.hero_bg || item.cover, 340)}
            alt={item.title}
            width={320}
            height={200}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-106"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B24] via-black/40 to-transparent" />
          <RatingBadge rating={item.rating} className="absolute top-2.5 right-2.5" />
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="w-10 h-10 rounded-full bg-violet-600/90 flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.9)] transform scale-75 group-hover:scale-100 transition-transform">
              <Play size={18} className="fill-current ml-0.5" />
            </span>
          </div>
        </div>
        <div className="p-3.5">
          <h3 className="text-white text-xs sm:text-sm font-bold truncate group-hover:text-violet-200 transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Bölüm {item.lastReadChapter}{item.total > 0 ? ` / ${item.total}` : ''}</span>
            {item.total > 0 && <span className="text-violet-300 font-bold">%{pct}</span>}
          </div>
          <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-500" 
              style={{ width: `${pct}%` }} 
            />
          </div>
        </div>
      </article>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HERO (Kullanıcının Korunmasını İstediği Muhteşem Vitrin)
// ════════════════════════════════════════════════════════════════════════
function Hero({ items, getChapters, readingHistory }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setTimeout(() => setIndex((p) => (p + 1) % count), HERO_DURATION);
    return () => clearTimeout(t);
  }, [index, count, paused]);

  useEffect(() => {
    if (!items[0]) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const src = getOptimizedImage(items[0].hero_bg || items[0].cover, isMobile ? 480 : 1000);
    if (!src || src.startsWith('/')) return;
    document.querySelector('link[data-hero-preload]')?.remove();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.setAttribute('data-hero-preload', 'true');
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  }, [items]);

  const safeIndex = index < count ? index : 0;
  const active = items[safeIndex] || items[0];
  if (!active) return null;

  const chapterList = getChapters(active.id) || [];
  const chapterCount = chapterList.length;
  const history = readingHistory?.find((h) => String(h.manhwaId) === String(active.id));
  const readLink = history
    ? `/manga/${active.slug}/bolum-${history.lastChapter}`
    : chapterCount > 0 ? `/manga/${active.slug}/bolum-1` : `/manga/${active.slug}`;

  const go = (dir) => setIndex((p) => (p + dir + count) % count);
  const thumbs = count > 1 ? Array.from({ length: Math.min(3, count) }, (_, i) => items[(safeIndex + i) % count]) : [];

  return (
    <section className="relative pt-24 sm:pt-28" aria-label="Öne çıkan seriler">
      <div className="mp-container">
        <div
          className="relative h-[530px] sm:h-[480px] lg:h-[500px] rounded-3xl overflow-hidden border border-white/[0.09] bg-[#0E0B1F] shadow-[0_30px_90px_-20px_rgba(124,58,237,0.45)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Arkaplan */}
          <AnimatePresence initial={false}>
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85 }}
              className="absolute inset-0"
            >
              <img
                src={getOptimizedImage(active.hero_bg || active.cover, 800)}
                srcSet={`
                  ${getOptimizedImage(active.hero_bg || active.cover, 480)} 480w,
                  ${getOptimizedImage(active.hero_bg || active.cover, 800)} 800w,
                  ${getOptimizedImage(active.hero_bg || active.cover, 1200)} 1200w
                `}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                alt={`${active.title} arkaplan`}
                width={1200}
                height={500}
                fetchpriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={handleImageError}
                className="mp-kenburns w-full h-full object-cover object-[center_25%]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Sinematik Gradiyentler */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/85 to-transparent sm:w-[75%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(650px_350px_at_15%_100%,rgba(124,58,237,0.3),transparent)]" />

          {/* İçerik */}
          <div className="relative z-10 h-full flex items-end sm:items-center px-6 sm:px-14 lg:px-16 pb-16 sm:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`c-${active.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="max-w-xl"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/30 border border-violet-400/40 text-violet-100 text-[11px] font-black uppercase tracking-wider backdrop-blur-md mb-4 shadow-lg shadow-violet-950/50">
                  <Flame size={14} className="text-orange-400" /> Öne Çıkan
                </span>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] line-clamp-2">
                  {active.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  {fmtRating(active.rating) && (
                    <span className="flex items-center gap-1.5 text-white font-bold">
                      <Star size={16} className="text-amber-400 fill-amber-400" /> {fmtRating(active.rating)}
                    </span>
                  )}
                  <span className="text-slate-300 text-sm font-semibold">{chapterCount} BÖLÜM</span>
                  <div className="flex flex-wrap gap-1.5">
                    {genresOf(active).slice(0, 4).map((g) => (
                      <span key={g} className="px-2.5 py-1 rounded-md bg-white/[0.08] border border-white/15 text-slate-200 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-7 line-clamp-2 sm:line-clamp-3">
                  {active.description || 'Efsanevi maceraya hemen katıl. Yüksek kaliteli çevirilerle kesintisiz okuma deneyimi seni bekliyor.'}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={readLink}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-[0_10px_30px_-8px_rgba(139,92,246,0.85)] hover:shadow-[0_14px_38px_-6px_rgba(168,85,247,0.95)] hover:brightness-110 active:scale-95 transition-all"
                  >
                    <BookOpen size={17} /> {history ? 'Devam Et' : 'Okumaya Başla'}
                  </Link>
                  <Link
                    to={`/manga/${active.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.07] border border-white/15 text-white text-sm font-semibold backdrop-blur-md hover:bg-white/[0.14] hover:border-violet-400/50 active:scale-95 transition-all"
                  >
                    <Info size={17} /> Seriyi İncele
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sağ küçük önizlemeler */}
          {thumbs.length > 0 && (
            <div className="hidden lg:flex absolute right-16 top-1/2 -translate-y-1/2 z-20 flex-col gap-3 w-[124px]">
              {thumbs.map((t, i) => (
                <button
                  key={`${t.id}-${i}`}
                  type="button"
                  onClick={() => setIndex((index + i) % count)}
                  className={`group relative rounded-xl overflow-hidden text-left transition-all duration-300 ${
                    i === 0
                      ? 'border-2 border-violet-400 shadow-[0_0_25px_rgba(139,92,246,0.65)] scale-102'
                      : 'border border-white/10 opacity-70 hover:opacity-100 hover:border-violet-400/60'
                  }`}
                  aria-label={`${t.title} göster`}
                >
                  <img
                    src={getOptimizedImage(t.cover, 160)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className={`w-full object-cover ${i === 0 ? 'aspect-[4/5]' : 'aspect-[16/10]'}`}
                  />
                  {i === 0 && (
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
                      <p className="text-white text-[11px] font-bold truncate">{t.title}</p>
                      <p className="text-slate-300 text-[10px]">{(getChapters(t.id) || []).length} Bölüm</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Oklar */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full hidden sm:flex items-center justify-center bg-black/45 border border-white/15 text-white backdrop-blur-md hover:bg-violet-600 hover:border-violet-400 transition-all active:scale-95 shadow-lg"
                aria-label="Önceki seri"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full hidden sm:flex items-center justify-center bg-black/45 border border-white/15 text-white backdrop-blur-md hover:bg-violet-600 hover:border-violet-400 transition-all active:scale-95 shadow-lg"
                aria-label="Sonraki seri"
              >
                <ChevronRight size={20} />
              </button>

              {/* Noktalar */}
              <div className="absolute bottom-5 left-6 sm:left-auto sm:right-16 lg:right-[210px] z-20 flex items-center gap-1.5">
                {items.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className="p-1.5"
                    aria-label={`Slayt ${i + 1}`}
                    aria-current={i === index}
                  >
                    <span className={`relative block h-1.5 rounded-full overflow-hidden transition-all duration-300 ${i === index ? 'w-8 bg-white/20' : 'w-2 bg-white/35 hover:bg-white/60'}`}>
                      {i === index && (
                        <span
                          key={`${index}-${paused}`}
                          className={`absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full ${paused ? '' : 'mp-dot-progress'}`}
                          style={{ '--mp-hero-duration': `${HERO_DURATION}ms` }}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <section className="pt-24 sm:pt-28">
      <div className="mp-container">
        <div className="h-[530px] sm:h-[480px] lg:h-[500px] rounded-3xl border border-white/[0.06] bg-[#0E0B1F] animate-pulse" />
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ZİRVEDEKİLER (PODYUM)
// ════════════════════════════════════════════════════════════════════════
const PODIUM = {
  1: { card: 'w-[40%] max-w-[175px] border-amber-400/90 shadow-[0_0_45px_rgba(251,191,36,0.45)]', badge: 'from-amber-300 to-amber-600 text-[#1a1203]', ped: 'mp-pedestal--gold', z: 'z-10' },
  2: { card: 'w-[29%] max-w-[130px] border-slate-300/70 shadow-[0_0_30px_rgba(148,163,184,0.3)]', badge: 'from-slate-200 to-slate-400 text-[#111]', ped: 'mp-pedestal--silver', z: '' },
  3: { card: 'w-[29%] max-w-[130px] border-orange-500/70 shadow-[0_0_30px_rgba(249,115,22,0.3)]', badge: 'from-orange-400 to-orange-700 text-white', ped: 'mp-pedestal--bronze', z: '' },
};

function PodiumCard({ item, place }) {
  const s = PODIUM[place];
  return (
    <Link to={`/manga/${item.slug}`} className={`group relative flex flex-col items-center ${s.card.split(' ').slice(0, 2).join(' ')} ${s.z}`}>
      {place === 1 && (
        <Crown size={28} className="mp-float text-amber-400 fill-amber-400/40 mb-1 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
      )}
      <div className={`relative w-full rounded-2xl overflow-hidden border-2 ${s.card.split(' ').slice(2).join(' ')} transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-102`}>
        <img
          src={getOptimizedImage(item.cover, place === 1 ? 340 : 250)}
          alt={item.title}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="w-full aspect-[3/4.2] object-cover"
        />
        <span className={`absolute top-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-lg bg-gradient-to-br ${s.badge} text-xs font-black flex items-center justify-center shadow-lg border border-white/20`}>
          #{place}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
          <p className="text-white text-xs sm:text-[13px] font-bold truncate group-hover:text-violet-200 transition-colors">{item.title}</p>
          {fmtRating(item.rating) && (
            <p className="flex items-center gap-1 text-[11px] text-amber-300 font-bold mt-0.5">
              <Star size={11} className="text-amber-400 fill-amber-400" /> {fmtRating(item.rating)}
            </p>
          )}
        </div>
      </div>
      <div className={`mp-pedestal ${s.ped} w-[130%] h-6 -mt-2`} />
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ════════════════════════════════════════════════════════════════════════
export default function Home() {
  const trendRef = useRef(null);
  const location = useLocation();
  const { user, readingHistory } = useAuth();
  const { sortedSeries, chapters, getChapters } = useApp();
  const [currentTime] = useState(() => Date.now());

  useSEO({
    title: 'Ana Sayfa',
    description: 'MahoraPeak - Premium Manhwa ve Webtoon okuma platformu. En popüler manga, manhwa, manhua ve webtoonları keşfet, oku ve eğlen.',
    url: 'https://mahorapeak.com.tr/'
  });

  // Performans: en fazla 500 seri üzerinden işlem yap
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

  const latestChapterNo = useCallback(
    (id) => {
      const list = chapters[String(id)] || [];
      const n = Number(list[0]?.number);
      return Math.max(Number.isFinite(n) ? n : 0, list.length);
    },
    [chapters]
  );

  // Hero Items
  const heroItems = useMemo(() => {
    const picked = validSeries.filter((s) => s.is_trending || (s.hero_bg && s.hero_bg.trim() !== ''));
    return picked.length > 0 ? picked : validSeries.slice(0, 5);
  }, [validSeries]);

  // DEV KARTLAR (Spotlight Showcase): Kullanıcının istediği dev kartlar için 2 harika seri seçiyoruz
  const giantSpotlightItems = useMemo(() => {
    // Hero harici en yüksek puanlı veya popüler serilerden 2 tanesini dev kart olarak öne çıkaralım
    const candidates = validSeries.filter((s) => !heroItems.slice(0, 2).some((h) => h.id === s.id));
    const sorted = [...candidates].sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0));
    return sorted.slice(0, 2);
  }, [validSeries, heroItems]);

  // Kaldığın yerden devam et
  const continueItems = useMemo(() => {
    if (!user || !readingHistory?.length) return [];
    return readingHistory
      .slice(0, 12)
      .map((rh) => {
        const s = validSeries.find((x) => String(x.id) === String(rh.manhwaId));
        return s ? { ...s, lastReadChapter: rh.lastChapter, total: latestChapterNo(s.id) } : null;
      })
      .filter(Boolean);
  }, [user, readingHistory, validSeries, latestChapterNo]);

  // Popüler seriler: en çok okunanlar
  const popularSeries = useMemo(
    () => [...validSeries].sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0)).slice(0, 16),
    [validSeries]
  );

  // Yeni eklenen bölümler (tür filtresiyle)
  const [activeType, setActiveType] = useState('TÜMÜ');
  const newChapterSeries = useMemo(() => {
    let list = validSeries;
    if (activeType !== 'TÜMÜ') {
      list = list.filter((s) => genresOf(s).some((g) => String(g).toLowerCase() === activeType.toLowerCase()));
    }
    return list
      .map((s) => ({ ...s, ts: chapters[String(s.id)]?.[0]?.created_at || '1970-01-01' }))
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, 18);
  }, [validSeries, chapters, activeType]);

  // Zirvedekiler: puan + okunma
  const topRated = useMemo(
    () =>
      [...validSeries]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reads_num || 0) - (a.reads_num || 0))
        .slice(0, 10),
    [validSeries]
  );

  useEffect(() => {
    if (location.hash === '#trendler' && trendRef.current) {
      setTimeout(() => trendRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  const premiumArt = topRated[0] || heroItems[0];

  return (
    <main className="mp-home-bg min-h-screen text-slate-200 selection:bg-violet-500/30 pb-20" id="home-top">
      {/* 1. HERO SLIDER */}
      {heroItems.length > 0 ? (
        <Hero items={heroItems} getChapters={getChapters} readingHistory={readingHistory} />
      ) : (
        <HeroSkeleton />
      )}

      <div className="mp-container mt-12 space-y-12 sm:space-y-16">
        {/* 2. KALDIĞIN YERDEN DEVAM ET */}
        {continueItems.length > 0 && (
          <motion.section 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: '-40px' }} 
            variants={fadeInUp}
          >
            <SectionHeader 
              icon={History} 
              title="Kaldığın Yerden Devam Et" 
              subtitle="Daha önce okuduğun seriler burada seni bekliyor." 
              to={user?.username ? `/profil/${user.username}` : undefined} 
            />
            <ScrollRow variant="wide">
              {continueItems.map((item) => (
                <ContinueCard key={`h-${item.id}`} item={item} />
              ))}
            </ScrollRow>
          </motion.section>
        )}

        {/* 3. POPÜLER SERİLER (YENİLENMİŞ POSTER KARTLARI) */}
        <motion.section
          ref={trendRef}
          id="trendler"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeInUp}
          className="pt-6 border-t border-white/[0.06] first:border-t-0 first:pt-0 scroll-mt-28"
        >
          <SectionHeader 
            icon={TrendingUp} 
            title="Popüler Seriler" 
            subtitle="Topluluğun en çok ilgi gösterdiği, soluksuz okunan başyapıtlar." 
            to="/popular" 
          />
          <ScrollRow>
            {popularSeries.map((item, i) => (
              <PosterCard 
                key={item.id} 
                item={item} 
                rank={i + 1} 
                meta={`${latestChapterNo(item.id)} Bölüm`} 
              />
            ))}
          </ScrollRow>
        </motion.section>

        {/* 4. YENİ: KULLANICININ İSTEDİĞİ DEV KARTLAR (BENTO SPOTLIGHT SHOWCASE) */}
        {giantSpotlightItems.length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeInUp}
            className="pt-6 border-t border-white/[0.06]"
          >
            <SectionHeader 
              icon={Sparkles} 
              title="Haftanın Dev Vitrini" 
              subtitle="Bulanık ambient arkaplanı ve özel bölümleriyle öne çıkan dev seriler." 
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {giantSpotlightItems[0] && (
                <GiantSpotlightCard 
                  item={giantSpotlightItems[0]} 
                  chapters={chapters} 
                  badge="Haftanın Zirvesi"
                />
              )}
              {giantSpotlightItems[1] && (
                <GiantSpotlightCard 
                  item={giantSpotlightItems[1]} 
                  chapters={chapters} 
                  badge="Editörün Seçimi"
                />
              )}
            </div>
          </motion.section>
        )}

        {/* 5. YENİ EKLENEN BÖLÜMLER */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeInUp}
          className="pt-6 border-t border-white/[0.06]"
        >
          <SectionHeader 
            icon={Zap} 
            title="Yeni Eklenenler" 
            subtitle="Güncel çeviriler ve taptaze bölümler anında yayında." 
            to="/all-series"
          >
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
              {['TÜMÜ', 'MANHWA', 'MANGA', 'MANHUA', 'WEBTOON'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveType(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black tracking-wider whitespace-nowrap transition-all duration-300 ${
                    activeType === f 
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/50 scale-102' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </SectionHeader>

          {newChapterSeries.length > 0 ? (
            <ScrollRow>
              {newChapterSeries.map((item) => {
                const last = chapters[String(item.id)]?.[0];
                const isNew = last?.created_at && currentTime - new Date(last.created_at).getTime() < 86400000 * 3;
                return (
                  <PosterCard
                    key={item.id}
                    item={item}
                    isNew={isNew}
                    meta={last ? `Bölüm ${last.number}` : 'Yakında'}
                  />
                );
              })}
            </ScrollRow>
          ) : (
            <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-slate-400 text-sm">Bu türde henüz yeni bölüm bulunmuyor.</p>
            </div>
          )}
        </motion.section>

        {/* 6. ZİRVEDEKİLER (PODYUM) & PREMIUM BANNER */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeInUp}
          className="pt-6 border-t border-white/[0.06] grid lg:grid-cols-[minmax(0,1fr)_390px] gap-6"
        >
          {/* Zirvedekiler (Hall of Fame) */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0E0A22]/85 backdrop-blur-md p-5 sm:p-7 shadow-xl">
            <SectionHeader 
              icon={Trophy} 
              title="Zirvedekiler" 
              subtitle="Puan ve okunma rekorları kıran efsanevi ilk 10 seri." 
              to="/popular" 
            />

            {topRated.length > 0 && (
              <div className="grid md:grid-cols-[1.15fr_1fr] gap-6 items-center">
                {/* Kürsü */}
                <div className="relative flex items-end justify-center gap-3 sm:gap-4 pt-4">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-24 bg-violet-600/25 blur-3xl rounded-full pointer-events-none" />
                  {topRated[1] && <PodiumCard item={topRated[1]} place={2} />}
                  {topRated[0] && <PodiumCard item={topRated[0]} place={1} />}
                  {topRated[2] && <PodiumCard item={topRated[2]} place={3} />}
                </div>

                {/* 4-10 listesi */}
                <ol className="rounded-2xl border border-white/[0.08] bg-black/25 divide-y divide-white/[0.05] overflow-hidden shadow-inner">
                  {topRated.slice(3, 10).map((item, i) => (
                    <li key={item.id}>
                      <Link 
                        to={`/manga/${item.slug}`} 
                        className="group flex items-center gap-3 px-3.5 py-2.5 hover:bg-violet-600/15 transition-all"
                      >
                        <span className="w-6 text-center text-xs font-black text-slate-500 group-hover:text-violet-300">
                          #{i + 4}
                        </span>
                        <img
                          src={getOptimizedImage(item.cover, 80)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
                          className="w-8 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10 group-hover:border-violet-400/50 shadow-sm"
                        />
                        <span className="flex-1 min-w-0 text-[13px] font-bold text-slate-200 truncate group-hover:text-white">
                          {item.title}
                        </span>
                        {fmtRating(item.rating) && (
                          <span className="flex items-center gap-1 text-[11px] font-black text-amber-300">
                            <Star size={11} className="text-amber-400 fill-amber-400" /> {fmtRating(item.rating)}
                          </span>
                        )}
                        <span className="hidden sm:inline w-16 text-right text-[11px] text-slate-500 font-semibold">
                          {latestChapterNo(item.id)} böl.
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Premium Kartı */}
          <aside className="relative rounded-3xl overflow-hidden border border-violet-500/35 bg-gradient-to-br from-[#1E1145] via-[#140D2E] to-[#0B0818] p-6 sm:p-8 flex flex-col min-h-[380px] shadow-[0_20px_50px_-10px_rgba(124,58,237,0.35)]">
            {premiumArt && (
              <img
                src={getOptimizedImage(premiumArt.cover, 400)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute right-0 top-0 h-full w-[65%] object-cover opacity-35 [mask-image:linear-gradient(to_left,black_30%,transparent)]"
              />
            )}
            <div className="absolute -top-20 -right-16 w-64 h-64 bg-fuchsia-600/35 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-violet-700/35 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-4 shadow-sm">
                <Crown size={14} className="fill-amber-400/40" /> Mahora Premium
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                Daha Fazlasını{' '}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
                  Keşfet!
                </span>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-5 max-w-[280px]">
                MahoraPeak Premium ile sıfır reklam, sana özel auralar ve ismine özel ışıldayan efektler seni bekliyor.
              </p>
              <ul className="space-y-2.5 mb-7">
                {[
                  'Tamamen reklamsız okuma deneyimi', 
                  'Yeni çıkan bölümlere erken erişim', 
                  'Kozmik mühürler ve parlayan profil efektleri', 
                  'Gelişmiş kütüphane ve okuma senkronizasyonu'
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                    <CheckCircle2 size={16} className="text-violet-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/elite-upgrade"
                className="mp-shine relative overflow-hidden mt-auto inline-flex items-center justify-center gap-2 w-full sm:w-fit px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-[0_10px_30px_-8px_rgba(168,85,247,0.85)] hover:brightness-110 active:scale-95 transition-all"
              >
                {user?.is_elite ? (
                  <>
                    <Sparkles size={17} /> Ayrıcalıklarını Gör
                  </>
                ) : (
                  <>
                    Premium'a Geç <ArrowRight size={17} />
                  </>
                )}
              </Link>
            </div>
          </aside>
        </motion.section>
      </div>
    </main>
  );
}
