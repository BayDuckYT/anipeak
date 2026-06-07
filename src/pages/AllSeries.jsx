import { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Eye, BookOpen, Play, Flame, Grid3X3, List, ChevronRight, ChevronDown, Crown, Swords, Compass, Heart, Smile, Skull, HelpCircle, Brain, Rocket, Ghost, AlertTriangle, Landmark, School, Sparkles, Layers, SlidersHorizontal, X, BookMarked, Zap, Shield, Clock, Gamepad2, RefreshCw, Target, Mountain, Wand2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getOptimizedImage, handleImageError } from '../utils/imageOpt.js';
import { useSEO } from '../hooks/useSEO';

// ── Category config ──
const GENERAL_GENRES = [
  { label: 'Aksiyon', icon: Swords, color: 'red' },
  { label: 'Macera', icon: Compass, color: 'blue' },
  { label: 'Fantastik', icon: Sparkles, color: 'purple' },
  { label: 'Romantik', icon: Heart, color: 'pink' },
  { label: 'Dram', icon: Flame, color: 'orange' },
  { label: 'Komedi', icon: Smile, color: 'yellow' },
  { label: 'Korku', icon: Skull, color: 'slate' },
  { label: 'Gizem', icon: HelpCircle, color: 'indigo' },
  { label: 'Psikolojik', icon: Brain, color: 'violet' },
  { label: 'Bilim Kurgu', icon: Rocket, color: 'cyan' },
  { label: 'Doğaüstü', icon: Ghost, color: 'emerald' },
  { label: 'Gerilim', icon: AlertTriangle, color: 'amber' },
  { label: 'Tarihi', icon: Landmark, color: 'stone' },
  { label: 'Okul Hayatı', icon: School, color: 'teal' },
  { label: 'Büyü', icon: Wand2, color: 'fuchsia' },
  { label: 'Dövüş Sanatları', icon: Shield, color: 'rose' },
  { label: 'İntikam', icon: Target, color: 'red' },
  { label: 'Post-Apokaliptik', icon: Mountain, color: 'zinc' },
];

const TYPE_TABS = [
  { label: 'Tümü', icon: Layers, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', glow: 'rgba(168,85,247,0.15)' },
  { label: 'Manhwa', icon: BookMarked, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', glow: 'rgba(168,85,247,0.15)' },
  { label: 'Manga', icon: BookOpen, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', glow: 'rgba(239,68,68,0.15)' },
  { label: 'Manhua', icon: Zap, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', glow: 'rgba(59,130,246,0.15)' },
  { label: 'Webtoon', icon: Sparkles, color: '#10b981', bg: 'rgba(16,185,129,0.15)', glow: 'rgba(16,185,129,0.15)' },
];

const MANHWA_TAGS = ['Sistem / Seviye Atlama', 'Reenkarnasyon', 'Zindan / Kule', 'Dövüş Sanatları (Murim)', 'Zorbalık / İntikam', 'Başka Dünyaya Geçiş (Isekai)', 'Sanal Gerçeklik / Oyun', 'Yüce Varlıklar / Takımyıldızları', 'Modern Fantazi'];
const MANGA_TAGS = ['Shounen', 'Seinen', 'Shoujo', 'Josei', 'Mecha', 'Samuray / Ninja', 'Yaşamdan Kesitler', 'Spor', 'Ecchi'];
const MANHUA_TAGS = ['Gelişim (Cultivation)', 'Simya / Eczacılık', 'Ölümsüzlük Yolculuğu', 'İmparatorluk / Saray Entrikaları', 'Modern Şehirde Usta'];

const CHAPTER_PRESETS = [
  { label: '10+', value: 10 },
  { label: '30+', value: 30 },
  { label: '50+', value: 50 },
  { label: '70+', value: 70 },
  { label: '100+', value: 100 },
  { label: '200+', value: 200 },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popüler', icon: Flame },
  { value: 'rating', label: 'Puan', icon: Star },
  { value: 'newest', label: 'En Yeni', icon: Clock },
  { value: 'chapters', label: 'En Çok Bölüm', icon: BookOpen },
  { value: 'az', label: 'A-Z', icon: null },
];

// ── Series Card ──
function SeriesCard({ item, idx = 0, chapterCount }) {
  const genres = Array.isArray(item.genre) ? item.genre : item.genre ? [item.genre] : [];

  return (
    <Link to={`/manga/${item.slug}`} className="group block">
      <div className="relative rounded-xl overflow-hidden border border-white/8 group-hover:border-purple-500/40 group-hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={getOptimizedImage(item.cover, 300)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading={idx < 10 ? 'eager' : 'lazy'} fetchpriority={idx < 5 ? 'high' : 'auto'} decoding="async" width={200} height={267}
            onError={handleImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          {/* Rating badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 border border-amber-500/30 backdrop-blur-sm">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-white text-[11px] font-black">{item.rating}</span>
          </div>
          {/* Chapter count badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 border border-emerald-500/30 backdrop-blur-sm">
            <BookOpen size={9} className="text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-black">{chapterCount}</span>
          </div>
          {/* Hover play */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
            <div className="w-12 h-12 rounded-full bg-purple-600/90 flex items-center justify-center shadow-neon-purple">
              <Play size={18} className="text-white ml-0.5" />
            </div>
          </div>
        </div>
        <div className="p-2.5 bg-[#0a0a0c]">
          <h3 className="text-white text-xs font-bold truncate group-hover:text-purple-400 transition-colors">{item.title}</h3>
          <p className="text-slate-400 text-[9px] font-medium truncate mt-0.5">{genres.slice(0, 2).join(', ') || 'Genel'}</p>
        </div>
      </div>
    </Link>
  );
}

// ── List View Card ──
function SeriesListItem({ item, idx = 0, chapterCount }) {
  const genres = Array.isArray(item.genre) ? item.genre : item.genre ? [item.genre] : [];

  return (
    <Link to={`/manga/${item.slug}`} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.02] transition-all group">
      <img src={getOptimizedImage(item.cover, 100)} alt={item.title} className="w-12 h-16 rounded-lg object-cover border border-white/10 flex-shrink-0" loading={idx < 10 ? 'eager' : 'lazy'} fetchpriority={idx < 5 ? 'high' : 'auto'} decoding="async" width={48} height={64}
        onError={handleImageError} />
      <div className="flex-1 min-w-0">
        <h3 className="text-white text-sm font-bold truncate group-hover:text-purple-400 transition-colors">{item.title}</h3>
        <p className="text-slate-400 text-[10px] truncate">{genres.join(', ')}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1"><BookOpen size={10} />{chapterCount}B</span>
        <div className="flex items-center gap-1">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-amber-400 text-xs font-black">{item.rating}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Popularity Sidebar Item ──
function PopularItem({ item, rank, idx = 0 }) {
  const genres = Array.isArray(item.genre) ? item.genre : item.genre ? [item.genre] : [];
  return (
    <Link to={`/manga/${item.slug}`} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/5 transition-all group">
      <span className={`text-lg font-black w-6 text-center flex-shrink-0 ${
        rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-orange-400' : 'text-slate-400'
      }`}>{rank}</span>
      <img src={getOptimizedImage(item.cover, 100)} alt={item.title} className="w-10 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0" loading={idx < 5 ? 'eager' : 'lazy'} fetchpriority={idx < 3 ? 'high' : 'auto'} decoding="async" width={40} height={56}
        onError={handleImageError} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-bold truncate group-hover:text-purple-400 transition-colors">{item.title}</p>
        <p className="text-slate-400 text-[9px] truncate">{genres.slice(0, 2).join(', ')}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Star size={10} className="text-amber-400 fill-amber-400" />
        <span className="text-amber-400 text-[11px] font-black">{item.rating}</span>
      </div>
    </Link>
  );
}

// ── Mobile Filter Drawer ──
function MobileFilterDrawer({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return (
    <>
      <div className="filter-drawer-overlay" onClick={onClose} />
      <div className="filter-drawer custom-scrollbar">
        <div className="filter-drawer-handle" />
        <div className="p-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-black text-lg uppercase tracking-tight">Filtreler</h3>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function AllSeries() {
  const { series, getChapters } = useApp();
  const [searchParams] = useSearchParams();
  const urlGenre = searchParams.get('genre');

  useSEO({
    title: 'Tüm Seriler',
    description: 'MahoraPeak üzerindeki tüm manhwa ve webtoon serilerini keşfet. Türe, popülerliğe ve güncelleme tarihine göre filtrele.',
    url: 'https://mahorapeak.com.tr/all-series'
  });

  const [search, setSearch] = useState('');
  const [activeGenres, setActiveGenres] = useState(urlGenre ? [urlGenre] : []);
  const [activeType, setActiveType] = useState('Tümü');
  const [activeStatus, setActiveStatus] = useState('Tümü');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showTypeSubcats, setShowTypeSubcats] = useState(null); // 'Manhwa' | 'Manga' | 'Manhua'
  const [activeSubcat, setActiveSubcat] = useState(null);
  const [minChapters, setMinChapters] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const validSeries = useMemo(() => series.filter(s => !s.is_deleted), [series]);

  // Chapter counts memo (avoid recalculating in filter loop)
  const chapterCounts = useMemo(() => {
    const counts = {};
    validSeries.forEach(s => {
      counts[String(s.id)] = getChapters(s.id).length;
    });
    return counts;
  }, [validSeries, getChapters]);

  // Count per genre
  const genreCounts = useMemo(() => {
    const counts = { 'Tümü': validSeries.length };
    GENERAL_GENRES.forEach(g => { counts[g.label] = 0; });
    validSeries.forEach(s => {
      const genres = Array.isArray(s.genre) ? s.genre : s.genre ? [s.genre] : [];
      genres.forEach(g => { counts[g] = (counts[g] || 0) + 1; });
    });
    return counts;
  }, [validSeries]);

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (activeGenres.length > 0) c += activeGenres.length;
    if (activeType !== 'Tümü') c++;
    if (activeStatus !== 'Tümü') c++;
    if (minChapters > 0) c++;
    if (activeSubcat) c++;
    return c;
  }, [activeGenres, activeType, activeStatus, minChapters, activeSubcat]);

  // Filtered series
  const filtered = useMemo(() => {
    let result = validSeries.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const mGenres = Array.isArray(m.genre) ? m.genre : m.genre ? [m.genre] : [];
      const matchGenre = activeGenres.length === 0 || activeGenres.some(ag => mGenres.some(g => g.toLowerCase().includes(ag.toLowerCase())));
      const matchType = activeType === 'Tümü' || mGenres.some(g => g.toLowerCase() === activeType.toLowerCase());
      const matchStatus = activeStatus === 'Tümü' || m.status === activeStatus;
      const matchChapters = minChapters === 0 || (chapterCounts[String(m.id)] || 0) >= minChapters;
      return matchSearch && matchGenre && matchType && matchStatus && matchChapters;
    });

    // Sort
    switch (sortBy) {
      case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
      case 'az': result.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr')); break;
      case 'chapters': result.sort((a, b) => (chapterCounts[String(b.id)] || 0) - (chapterCounts[String(a.id)] || 0)); break;
      default: result.sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0));
    }
    return result;
  }, [validSeries, search, activeGenres, activeType, activeStatus, sortBy, minChapters, chapterCounts]);

  // Top 5 popular
  const popular5 = useMemo(() =>
    [...validSeries].sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0)).slice(0, 5),
  [validSeries]);

  const toggleGenre = useCallback((genre) => {
    setActiveGenres(prev => {
      if (prev.includes(genre)) return prev.filter(g => g !== genre);
      return [...prev, genre];
    });
    setActiveSubcat(null);
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveGenres([]);
    setActiveType('Tümü');
    setActiveStatus('Tümü');
    setMinChapters(0);
    setActiveSubcat(null);
    setSearch('');
  }, []);

  const getSubcats = () => {
    if (showTypeSubcats === 'Manhwa') return MANHWA_TAGS;
    if (showTypeSubcats === 'Manga') return MANGA_TAGS;
    if (showTypeSubcats === 'Manhua') return MANHUA_TAGS;
    return [];
  };

  // ── Shared Filter Content (used in both sidebar and mobile drawer) ──
  const FilterContent = () => (
    <>
      {/* Minimum Bölüm Sayısı */}
      <div className="mb-6">
        <h4 className="text-white font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <BookOpen size={12} className="text-emerald-400" /> Min. Bölüm Sayısı
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMinChapters(0)}
            className={`chapter-preset-btn ${minChapters === 0 ? 'active' : ''}`}
          >
            Tümü
          </button>
          {CHAPTER_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setMinChapters(minChapters === p.value ? 0 : p.value)}
              className={`chapter-preset-btn ${minChapters === p.value ? 'active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {minChapters > 0 && (
          <p className="text-[10px] text-purple-400 mt-2 font-bold">
            ✨ {minChapters}+ bölümü olan seriler gösteriliyor
          </p>
        )}
      </div>

      <div className="h-px bg-white/8 my-4" />

      {/* İçerik Türü */}
      <div className="mb-6">
        <h4 className="text-white font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers size={12} className="text-purple-400" /> İçerik Türü
        </h4>
        <div className="flex flex-wrap gap-2">
          {TYPE_TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.label}
                onClick={() => setActiveType(t.label)}
                className={`type-chip ${activeType === t.label ? 'active' : ''}`}
                style={activeType === t.label ? { '--chip-color': t.color, '--chip-bg': t.bg, '--chip-glow': t.glow } : {}}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-white/8 my-4" />

      {/* Kategoriler (Multi-select) */}
      <div className="mb-6">
        <h4 className="text-white font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <Swords size={12} className="text-red-400" /> Tür / Tema
        </h4>
        <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {GENERAL_GENRES.map(g => {
            const Icon = g.icon;
            const count = genreCounts[g.label] || 0;
            const isActive = activeGenres.includes(g.label);
            return (
              <button key={g.label} onClick={() => toggleGenre(g.label)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}>
                <span className="flex items-center gap-2"><Icon size={13} /> {g.label}</span>
                <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-white/8 my-4" />

      {/* Durum */}
      <div className="mb-4">
        <h4 className="text-white font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <RefreshCw size={12} className="text-blue-400" /> Durum
        </h4>
        <div className="flex gap-2">
          {['Tümü', 'Devam Ediyor', 'Tamamlandı'].map(s => (
            <button key={s} onClick={() => setActiveStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                activeStatus === s ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 hover:text-white bg-white/3 border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Type sub-categories */}
      <div className="h-px bg-white/8 my-4" />
      {['Manhwa', 'Manga', 'Manhua'].map(type => (
        <div key={type} className="mb-2">
          <button onClick={() => setShowTypeSubcats(showTypeSubcats === type ? null : type)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider">
            <span>{type}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showTypeSubcats === type ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showTypeSubcats === type && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pl-3 space-y-0.5">
                {(type === 'Manhwa' ? MANHWA_TAGS : type === 'Manga' ? MANGA_TAGS : MANHUA_TAGS).map(tag => (
                  <button key={tag} onClick={() => { setActiveSubcat(tag); setActiveGenres([]); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      activeSubcat === tag ? 'bg-purple-600/20 text-purple-300' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}>
                    {tag}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full mt-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <X size={12} /> Tüm Filtreleri Temizle
        </button>
      )}
    </>
  );

  return (
    <main className="min-h-screen pt-20 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">

          {/* ══════ LEFT SIDEBAR — KATEGORİLER ══════ */}
          <aside className="hidden lg:block w-[250px] flex-shrink-0">
            <div className="sticky top-24 filter-panel rounded-2xl p-4 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
              <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-purple-400" /> Gelişmiş Filtre
              </h3>
              <FilterContent />
            </div>
          </aside>

          {/* ══════ CENTER — TÜM SERİLER ══════ */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Tüm Seriler</h1>
              <p className="text-slate-500 text-xs mt-1 font-medium">Aradığın seriyi tam filtreleyerek bul</p>
            </div>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Seri ara..." aria-label="Seri arama"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-purple-500 outline-none transition-all" />
              </div>

              {/* Mobile filter button */}
              <button 
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs font-bold hover:bg-purple-600/20 transition-all relative"
              >
                <SlidersHorizontal size={14} /> Filtrele
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-purple-500 text-white text-[9px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Quick type tabs (Desktop) */}
              <div className="hidden lg:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
                {TYPE_TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.label} onClick={() => setActiveType(t.label)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        activeType === t.label ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                      }`}>
                      <Icon size={10} /> {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Sort */}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sıralama seçeneği"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 outline-none cursor-pointer">
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#0a0a14]">{o.label}</option>
                ))}
              </select>

              {/* Chapter count quick filter (Desktop) */}
              <div className="hidden xl:flex items-center gap-1.5">
                {CHAPTER_PRESETS.slice(0, 4).map(p => (
                  <button
                    key={p.value}
                    onClick={() => setMinChapters(minChapters === p.value ? 0 : p.value)}
                    className={`chapter-preset-btn ${minChapters === p.value ? 'active' : ''}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
                <button onClick={() => setViewMode('grid')} aria-label="Izgara görünümü"
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                  <Grid3X3 size={14} />
                </button>
                <button onClick={() => setViewMode('list')} aria-label="Liste görünümü"
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Active filter badges */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Filtreler:</span>
                {activeGenres.map(g => (
                  <span key={g} className="filter-tag bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {g}
                    <button onClick={() => toggleGenre(g)} className="tag-remove" aria-label={`${g} filtresini kaldır`}>✕</button>
                  </span>
                ))}
                {activeType !== 'Tümü' && (
                  <span className="filter-tag bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {activeType}
                    <button onClick={() => setActiveType('Tümü')} className="tag-remove" aria-label="Tür filtresini kaldır">✕</button>
                  </span>
                )}
                {activeStatus !== 'Tümü' && (
                  <span className="filter-tag bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeStatus}
                    <button onClick={() => setActiveStatus('Tümü')} className="tag-remove" aria-label="Durum filtresini kaldır">✕</button>
                  </span>
                )}
                {minChapters > 0 && (
                  <span className="filter-tag bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {minChapters}+ Bölüm
                    <button onClick={() => setMinChapters(0)} className="tag-remove" aria-label="Bölüm filtresini kaldır">✕</button>
                  </span>
                )}
                {activeSubcat && (
                  <span className="filter-tag bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeSubcat}
                    <button onClick={() => setActiveSubcat(null)} className="tag-remove" aria-label="Alt kategori filtresini kaldır">✕</button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-[10px] text-red-400 font-bold hover:text-red-300 transition-colors ml-1">
                  Tümünü Temizle
                </button>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <motion.span
                  key={filtered.length}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block"
                >
                  {filtered.length}
                </motion.span>
                {' '}seri bulundu
              </p>
              {minChapters > 0 && (
                <p className="text-[10px] text-purple-400 font-bold">
                  🔥 Minimum {minChapters} bölüm
                </p>
              )}
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence mode="sync">
                  {filtered.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}>
                      <SeriesCard item={item} idx={i} chapterCount={chapterCounts[String(item.id)] || 0} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="sync">
                  {filtered.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}>
                      <SeriesListItem item={item} idx={i} chapterCount={chapterCounts[String(item.id)] || 0} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-32">
                <Flame size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Aradığın seri bulunamadı.</h3>
                <p className="text-slate-500 text-sm mb-6">Farklı bir kategori veya arama dene.</p>
                {activeFilterCount > 0 && (
                  <div className="flex flex-col items-center gap-3">
                    <button 
                      onClick={clearAllFilters}
                      className="px-6 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-bold hover:bg-purple-600/30 transition-all"
                    >
                      Filtreleri Temizle
                    </button>
                    <p className="text-slate-400 text-xs">veya şu filtreleri dene:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Aksiyon', 'Fantastik', 'Romantik'].map(g => (
                        <button key={g} onClick={() => { clearAllFilters(); toggleGenre(g); }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all">
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══════ RIGHT SIDEBAR — POPÜLERLİK LİSTESİ ══════ */}
          <aside className="hidden xl:block w-[260px] flex-shrink-0">
            <div className="sticky top-24 glass border border-white/8 rounded-2xl p-4">
              <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Crown size={14} className="text-amber-400" /> Popülerlik Listesi
              </h3>
              <div className="space-y-1">
                {popular5.map((item, i) => (
                  <PopularItem key={item.id} item={item} rank={i + 1} idx={i} />
                ))}
              </div>
              <Link to="/popular" className="flex items-center justify-center gap-1 mt-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-xs text-slate-400 font-bold hover:text-purple-400 hover:border-purple-500/30 transition-all">
                Tümünü Gör <ChevronRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer isOpen={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}>
        <FilterContent />
        <button
          onClick={() => setMobileFilterOpen(false)}
          className="w-full mt-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all flex items-center justify-center gap-2"
        >
          {filtered.length} Sonucu Göster
        </button>
      </MobileFilterDrawer>
    </main>
  );
}
