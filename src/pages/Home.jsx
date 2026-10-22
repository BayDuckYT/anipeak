import { useEffect, useRef, useMemo, useState, useCallback, Children } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, BookOpen, ChevronRight, ChevronLeft, Flame, Play, Crown, Sparkles,
  ArrowRight, Info, History, TrendingUp, Zap, CheckCircle2, Trophy
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { handleImageError, getOptimizedImage } from '../utils/imageOpt.js';
import { useSEO } from '../hooks/useSEO';
import '../styles/home.css';

const HERO_DURATION = 7000;

// ── Motion Variants ──
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } }
};

// ── Yardımcılar ──
const genresOf = (s) => (Array.isArray(s?.genre) ? s.genre : s?.genre ? [s.genre] : []);
const fmtRating = (r) => (r ? Number(r).toFixed(1) : null);

// ════════════════════════════════════════════════════════════════════════
// ORTAK BİLEŞENLER
// ════════════════════════════════════════════════════════════════════════

function SectionHeader({ icon: Icon, title, subtitle, to, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-600/35 to-fuchsia-600/10 border border-violet-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.25)]">
          <Icon size={18} className="text-violet-300" />
        </div>
        <div className="min-w-0">
          <h2 className="text-white text-lg sm:text-xl font-extrabold tracking-tight leading-tight">{title}</h2>
          {subtitle && <p className="text-slate-400 text-xs sm:text-[13px] mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {children}
        {to && (
          <Link
            to={to}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-white transition-colors whitespace-nowrap"
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
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
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
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {canLeft && (
        <button type="button" onClick={() => scroll(-1)} className="mp-row-arrow mp-row-arrow--left" aria-label="Sola kaydır">
          <ChevronLeft size={18} />
        </button>
      )}
      <div ref={ref} className={`mp-row mp-row--${variant}`}>{children}</div>
      {canRight && (
        <button type="button" onClick={() => scroll(1)} className="mp-row-arrow mp-row-arrow--right" aria-label="Sağa kaydır">
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

function RatingBadge({ rating, className = '' }) {
  const r = fmtRating(rating);
  if (!r) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white ${className}`}>
      <Star size={10} className="text-amber-400 fill-amber-400" />
      {r}
    </span>
  );
}

const RANK_STYLES = {
  1: 'from-amber-300 to-amber-600 text-[#1a1203]',
  2: 'from-slate-200 to-slate-400 text-[#111]',
  3: 'from-orange-400 to-orange-700 text-white',
};

function PosterCard({ item, rank, isNew, meta }) {
  return (
    <Link to={`/manga/${item.slug}`} className="group block" aria-label={`${item.title} detaylarını gör`}>
      <article className="h-full rounded-xl overflow-hidden bg-[#100C22] border border-white/[0.06] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-violet-500/50 group-hover:shadow-[0_14px_34px_-12px_rgba(139,92,246,0.55)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#070511]">
          <img
            src={getOptimizedImage(item.cover, 220)}
            alt={item.title}
            width={220}
            height={293}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#100C22] to-transparent" />
          {rank && (
            <span className={`absolute top-2 left-2 w-7 h-7 rounded-lg bg-gradient-to-br ${RANK_STYLES[rank] || 'from-violet-500 to-indigo-600 text-white'} text-sm font-black flex items-center justify-center shadow-lg`}>
              {rank}
            </span>
          )}
          {isNew && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold shadow-lg shadow-violet-900/50">
              Yeni
            </span>
          )}
          <RatingBadge rating={item.rating} className="absolute top-2 right-2" />
        </div>
        <div className="px-2.5 pt-1.5 pb-2.5">
          <h3 className="text-white text-[13px] font-semibold truncate group-hover:text-violet-200 transition-colors">{item.title}</h3>
          {meta && <p className="text-slate-400 text-[11px] mt-0.5 truncate">{meta}</p>}
        </div>
      </article>
    </Link>
  );
}

function ContinueCard({ item }) {
  const pct = item.total > 0 ? Math.min(100, Math.round((item.lastReadChapter / item.total) * 100)) : 0;
  return (
    <Link
      to={`/manga/${item.slug}/bolum-${item.lastReadChapter}`}
      className="group block"
      title={`${item.title} - Bölüm ${item.lastReadChapter} okumaya devam et`}
    >
      <article className="h-full rounded-xl overflow-hidden bg-[#100C22] border border-white/[0.06] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-violet-500/50 group-hover:shadow-[0_14px_34px_-12px_rgba(139,92,246,0.55)]">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#070511]">
          <img
            src={getOptimizedImage(item.cover, 300)}
            alt={item.title}
            width={300}
            height={375}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#100C22] to-transparent" />
          <RatingBadge rating={item.rating} className="absolute top-2 right-2" />
        </div>
        <div className="p-3">
          <h3 className="text-white text-sm font-bold truncate">{item.title}</h3>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Bölüm {item.lastReadChapter}{item.total > 0 ? ` / ${item.total}` : ''}</span>
            {item.total > 0 && <span className="text-violet-300 font-semibold">%{pct}</span>}
          </div>
          <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-200 text-xs font-semibold transition-colors group-hover:bg-violet-600 group-hover:border-violet-500 group-hover:text-white">
            <Play size={12} className="fill-current" /> Devam Et
          </span>
        </div>
      </article>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HERO
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

  // LCP: sadece ilk görseli önceden yükle (mobilde hafif boyut)
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
          className="relative h-[520px] sm:h-[460px] lg:h-[480px] rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0E0B1F] shadow-[0_30px_80px_-24px_rgba(124,58,237,0.45)]"
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
              transition={{ duration: 0.9 }}
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
                height={480}
                fetchpriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={handleImageError}
                className="mp-kenburns w-full h-full object-cover object-[center_25%]"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/80 to-transparent sm:w-[75%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_15%_100%,rgba(124,58,237,0.25),transparent)]" />

          {/* İçerik */}
          <div className="relative z-10 h-full flex items-end sm:items-center px-6 sm:px-14 lg:px-16 pb-16 sm:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`c-${active.id}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-xl"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/25 border border-violet-400/40 text-violet-100 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md mb-4">
                  <Flame size={13} className="text-orange-400" /> Öne Çıkan
                </span>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)] line-clamp-2">
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
                      <span key={g} className="px-2.5 py-1 rounded-md bg-white/[0.07] border border-white/10 text-slate-200 text-[10px] font-bold uppercase tracking-wider">
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
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-[0_10px_30px_-8px_rgba(139,92,246,0.8)] hover:shadow-[0_14px_36px_-6px_rgba(168,85,247,0.9)] hover:brightness-110 active:scale-95 transition-all"
                  >
                    <BookOpen size={17} /> {history ? 'Devam Et' : 'Okumaya Başla'}
                  </Link>
                  <Link
                    to={`/manga/${active.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm font-semibold backdrop-blur-md hover:bg-white/[0.12] hover:border-violet-400/50 active:scale-95 transition-all"
                  >
                    <Info size={17} /> Seriyi İncele
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sağ küçük önizlemeler */}
          {thumbs.length > 0 && (
            <div className="hidden lg:flex absolute right-16 top-1/2 -translate-y-1/2 z-20 flex-col gap-3 w-[118px]">
              {thumbs.map((t, i) => (
                <button
                  key={`${t.id}-${i}`}
                  type="button"
                  onClick={() => setIndex((index + i) % count)}
                  className={`group relative rounded-xl overflow-hidden text-left transition-all duration-300 ${
                    i === 0
                      ? 'border-2 border-violet-500 shadow-[0_0_24px_rgba(139,92,246,0.55)]'
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
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full hidden sm:flex items-center justify-center bg-black/40 border border-white/15 text-white backdrop-blur-md hover:bg-violet-600 hover:border-violet-400 transition-colors"
                aria-label="Önceki seri"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full hidden sm:flex items-center justify-center bg-black/40 border border-white/15 text-white backdrop-blur-md hover:bg-violet-600 hover:border-violet-400 transition-colors"
                aria-label="Sonraki seri"
              >
                <ChevronRight size={18} />
              </button>

              {/* Noktalar */}
              <div className="absolute bottom-5 left-6 sm:left-auto sm:right-16 lg:right-[200px] z-20 flex items-center gap-1.5">
                {items.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className="p-1.5"
                    aria-label={`Slayt ${i + 1}`}
                    aria-current={i === index}
                  >
                    <span className={`relative block h-1.5 rounded-full overflow-hidden transition-all duration-300 ${i === index ? 'w-7 bg-white/20' : 'w-1.5 bg-white/35 hover:bg-white/60'}`}>
                      {i === index && (
                        <span
                          key={`${index}-${paused}`}
                          className={`absolute inset-0 bg-violet-400 rounded-full ${paused ? '' : 'mp-dot-progress'}`}
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
        <div className="h-[520px] sm:h-[460px] lg:h-[480px] rounded-3xl border border-white/[0.06] bg-[#0E0B1F] animate-pulse" />
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ZİRVEDEKİLER
// ════════════════════════════════════════════════════════════════════════

const PODIUM = {
  1: { card: 'w-[40%] max-w-[170px] border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.35)]', badge: 'from-amber-300 to-amber-600 text-[#1a1203]', ped: 'mp-pedestal--gold', z: 'z-10' },
  2: { card: 'w-[29%] max-w-[125px] border-slate-300/60 shadow-[0_0_24px_rgba(148,163,184,0.25)]', badge: 'from-slate-200 to-slate-400 text-[#111]', ped: '', z: '' },
  3: { card: 'w-[29%] max-w-[125px] border-orange-500/60 shadow-[0_0_24px_rgba(249,115,22,0.25)]', badge: 'from-orange-400 to-orange-700 text-white', ped: '', z: '' },
};

function PodiumCard({ item, place }) {
  const s = PODIUM[place];
  return (
    <Link to={`/manga/${item.slug}`} className={`group relative flex flex-col items-center ${s.card.split(' ').slice(0, 2).join(' ')} ${s.z}`}>
      {place === 1 && <Crown size={26} className="mp-float text-amber-400 fill-amber-400/30 mb-1 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />}
      <div className={`relative w-full rounded-xl overflow-hidden border-2 ${s.card.split(' ').slice(2).join(' ')} transition-transform duration-300 group-hover:-translate-y-1.5`}>
        <img
          src={getOptimizedImage(item.cover, place === 1 ? 340 : 250)}
          alt={item.title}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="w-full aspect-[3/4] object-cover"
        />
        <span className={`absolute top-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-lg bg-gradient-to-br ${s.badge} text-sm font-black flex items-center justify-center shadow-lg`}>
          {place}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-2 pt-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
          <p className="text-white text-xs sm:text-[13px] font-bold truncate">{item.title}</p>
          {fmtRating(item.rating) && (
            <p className="flex items-center gap-1 text-[11px] text-slate-200 font-semibold">
              <Star size={10} className="text-amber-400 fill-amber-400" /> {fmtRating(item.rating)}
            </p>
          )}
        </div>
      </div>
      <div className={`mp-pedestal ${s.ped} w-[130%] h-6 -mt-2`} />
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT — V3
// ════════════════════════════════════════════════════════════════════════
export default function Home() {
  const trendRef = useRef(null);
  const location = useLocation();
  const { user, readingHistory } = useAuth();
  const { sortedSeries, chapters, getChapters } = useApp();
  const [currentTime] = useState(() => Date.now());

  useSEO({
    title: 'Ana Sayfa',
    description: 'MahoraPeak - Premium Manhwa ve Webtoon okuma platformu. En popüler manga,manhwa,manhua ve webtoonları keşfet, oku ve eğlen.',
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

  // Admin panelindeki alev ikonu (is_trending) VİTRİN/HERO seçimini temsil ediyor.
  const heroItems = useMemo(() => {
    const picked = validSeries.filter((s) => s.is_trending || (s.hero_bg && s.hero_bg.trim() !== ''));
    return picked.length > 0 ? picked : validSeries.slice(0, 5);
  }, [validSeries]);

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
    () => [...validSeries].sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0)).slice(0, 15),
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
    <main className="mp-home-bg min-h-screen text-slate-200 selection:bg-violet-500/30 pb-16" id="home-top">
      {/* 1. HERO */}
      {heroItems.length > 0 ? (
        <Hero items={heroItems} getChapters={getChapters} readingHistory={readingHistory} />
      ) : (
        <HeroSkeleton />
      )}

      <div className="mp-container mt-10 space-y-10 sm:space-y-12">
        {/* 2. KALDIĞIN YERDEN DEVAM ET */}
        {continueItems.length > 0 && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeInUp}>
            <SectionHeader icon={History} title="Kaldığın Yerden Devam Et" subtitle="Daha önce okuduğun seriler burada seni bekliyor." to={user?.username ? `/profil/${user.username}` : undefined} />
            <ScrollRow variant="wide">
              {continueItems.map((item) => (
                <ContinueCard key={`h-${item.id}`} item={item} />
              ))}
            </ScrollRow>
          </motion.section>
        )}

        {/* 3. POPÜLER SERİLER */}
        <motion.section
          ref={trendRef}
          id="trendler"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeInUp}
          className="pt-8 border-t border-white/[0.05] first:border-t-0 first:pt-0 scroll-mt-28"
        >
          <SectionHeader icon={TrendingUp} title="Popüler Seriler" subtitle="Herkesin konuştuğu, senin de mutlaka okuman gereken seriler." to="/popular" />
          <ScrollRow>
            {popularSeries.map((item, i) => (
              <PosterCard key={item.id} item={item} rank={i + 1} meta={`${latestChapterNo(item.id)} Bölüm`} />
            ))}
          </ScrollRow>
        </motion.section>

        {/* 4. YENİ EKLENENLER */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeInUp}
          className="pt-8 border-t border-white/[0.05]"
        >
          <SectionHeader icon={Zap} title="Yeni Eklenenler" subtitle="Son eklenen manga, manhwa ve webtoon bölümleri." to="/all-series">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07] overflow-x-auto no-scrollbar max-w-full">
              {['TÜMÜ', 'MANHWA', 'MANGA', 'MANHUA', 'WEBTOON'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveType(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider whitespace-nowrap transition-all ${
                    activeType === f ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
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
            <p className="text-slate-500 text-sm py-10 text-center">Bu türde henüz yeni bölüm yok.</p>
          )}
        </motion.section>

        {/* 5. ZİRVEDEKİLER + PREMIUM */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeInUp}
          className="pt-8 border-t border-white/[0.05] grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6"
        >
          {/* Zirvedekiler */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0C0A1A]/80 backdrop-blur-sm p-5 sm:p-6">
            <SectionHeader icon={Trophy} title="Zirvedekiler" subtitle="Tüm zamanların en çok okunan ve sevilen serileri." to="/popular" />

            {topRated.length > 0 && (
              <div className="grid md:grid-cols-[1.15fr_1fr] gap-6 items-center">
                {/* Kürsü */}
                <div className="relative flex items-end justify-center gap-3 sm:gap-4 pt-4">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-24 bg-violet-600/20 blur-3xl rounded-full pointer-events-none" />
                  {topRated[1] && <PodiumCard item={topRated[1]} place={2} />}
                  {topRated[0] && <PodiumCard item={topRated[0]} place={1} />}
                  {topRated[2] && <PodiumCard item={topRated[2]} place={3} />}
                </div>

                {/* 4-10 listesi */}
                <ol className="rounded-xl border border-white/[0.06] bg-black/20 divide-y divide-white/[0.04] overflow-hidden">
                  {topRated.slice(3, 10).map((item, i) => (
                    <li key={item.id}>
                      <Link to={`/manga/${item.slug}`} className="group flex items-center gap-3 px-3 py-2 hover:bg-violet-500/10 transition-colors">
                        <span className="w-5 text-center text-xs font-black text-slate-500 group-hover:text-violet-300">{i + 4}</span>
                        <img
                          src={getOptimizedImage(item.cover, 64)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
                          className="w-7 h-9 rounded object-cover flex-shrink-0 border border-white/10"
                        />
                        <span className="flex-1 min-w-0 text-[13px] font-semibold text-slate-200 truncate group-hover:text-white">{item.title}</span>
                        {fmtRating(item.rating) && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-white">
                            <Star size={10} className="text-amber-400 fill-amber-400" /> {fmtRating(item.rating)}
                          </span>
                        )}
                        <span className="hidden sm:inline w-16 text-right text-[11px] text-slate-500">{latestChapterNo(item.id)} bölüm</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Premium */}
          <aside className="relative rounded-2xl overflow-hidden border border-violet-500/30 bg-gradient-to-br from-[#1C1040] via-[#130C2A] to-[#0B0818] p-6 sm:p-7 flex flex-col min-h-[360px]">
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
            <div className="absolute -top-20 -right-16 w-64 h-64 bg-fuchsia-600/30 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-violet-700/30 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-4">
                <Crown size={13} className="fill-amber-400/40" /> Premium
              </span>
              <h3 className="text-2xl sm:text-[28px] font-black text-white leading-tight mb-3">
                Daha Fazlasını{' '}
                <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Keşfet!</span>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-5 max-w-[260px]">
                MahoraPeak Premium ile reklamsız okuma, sana özel Haneler ve ismine özel parlayan efektler seni bekliyor.
              </p>
              <ul className="space-y-2.5 mb-6">
                {['Reklamsız okuma deneyimi', 'Yeni bölümlere erken erişim', 'Özel Haneler ve profil efektleri', 'Öncelikli destek'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 size={16} className="text-violet-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/elite-upgrade"
                className="mp-shine relative overflow-hidden mt-auto inline-flex items-center justify-center gap-2 w-full sm:w-fit px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-[0_10px_30px_-8px_rgba(168,85,247,0.8)] hover:brightness-110 active:scale-95 transition-all"
              >
                {user?.is_elite ? (
                  <>
                    <Sparkles size={16} /> Avantajlarını Gör
                  </>
                ) : (
                  <>
                    Premium'a Geç <ArrowRight size={16} />
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
