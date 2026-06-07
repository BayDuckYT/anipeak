import { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Eye, BookOpen, Play, Flame, Grid3X3, List, ChevronRight, ChevronDown, Crown, Swords, Compass, Heart, Smile, Skull, HelpCircle, Brain, Rocket, Ghost, AlertTriangle, Landmark, School, Sparkles, Layers, SlidersHorizontal, X, BookMarked, Zap, Shield, Clock, Gamepad2, RefreshCw, Target, Mountain, Wand2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getOptimizedImage, handleImageError } from '../utils/imageOpt.js';
import { useSEO } from '../hooks/useSEO';

// ── Category config (MangaDex Style) ──
const FORMATS = ['Manhwa', 'Manga', 'Manhua', 'Webtoon', 'One-shot'];
const GENRES = [
  'Aksiyon', 'Macera', 'Komedi', 'Dram', 'Fantastik', 'Korku', 'Gizem', 
  'Psikolojik', 'Bilim Kurgu', 'Doğaüstü', 'Gerilim', 'Tarihi', 'Okul Hayatı', 
  'Romantik', 'Spor', 'Yaşamdan Kesitler', 'Ecchi', 'Mecha'
];
const THEMES = [
  'Büyü', 'Dövüş Sanatları', 'İntikam', 'Post-Apokaliptik', 'Reenkarnasyon', 
  'Sistem / Seviye Atlama', 'Zindan / Kule', 'Sanal Gerçeklik', 'Simya', 
  'Kötü Adam/Kadın', 'İblisler', 'Vampirler', 'Zombiler', 'Hayatta Kalma', 
  'Zorbalık', 'Isekai', 'Canavarlar', 'Oyun', 'Mafya'
];
const DEMOGRAPHICS = ['Shounen', 'Seinen', 'Shoujo', 'Josei'];

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

// ── Mobile Filter Drawer ──
function MobileFilterDrawer({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return (
    <>
      <div className="filter-drawer-overlay" onClick={onClose} />
      <div className="filter-drawer custom-scrollbar" style={{ maxHeight: '90vh' }}>
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
    description: 'MahoraPeak üzerindeki tüm manhwa ve webtoon serilerini keşfet. Gelişmiş kategori, tema ve bölüm sayısı filtresiyle aradığını bul.',
    url: 'https://mahorapeak.com.tr/all-series'
  });

  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState(urlGenre ? [urlGenre] : []);
  const [activeStatus, setActiveStatus] = useState('Tümü');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [maxChapters, setMaxChapters] = useState('');
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

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (activeFilters.length > 0) c += activeFilters.length;
    if (activeStatus !== 'Tümü') c++;
    if (maxChapters !== '' && parseInt(maxChapters) > 0) c++;
    return c;
  }, [activeFilters, activeStatus, maxChapters]);

  // Filtered series
  const filtered = useMemo(() => {
    let result = validSeries.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
      
      const mGenres = Array.isArray(m.genre) ? m.genre.map(g => g.toLowerCase()) : m.genre ? [m.genre.toLowerCase()] : [];
      
      // Multi-select AND mantığı: Eğer filter seçildiyse, serinin tüm o seçili tag'leri barındırması lazım (MangaDex mantığına yakın)
      // Ya da OR mantığı yapabiliriz. Çok daralmaması için OR mantığı kullanalım (herhangi biri eşleşiyorsa)
      const matchFilters = activeFilters.length === 0 || activeFilters.some(af => mGenres.some(g => g.includes(af.toLowerCase())));
      
      const matchStatus = activeStatus === 'Tümü' || m.status === activeStatus;
      
      // MAX Chapter Logic
      const currentChCount = chapterCounts[String(m.id)] || 0;
      const maxVal = parseInt(maxChapters);
      const matchChapters = isNaN(maxVal) || maxVal === 0 || currentChCount <= maxVal;
      
      return matchSearch && matchFilters && matchStatus && matchChapters;
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
  }, [validSeries, search, activeFilters, activeStatus, sortBy, maxChapters, chapterCounts]);

  const toggleFilter = useCallback((filter) => {
    setActiveFilters(prev => {
      if (prev.includes(filter)) return prev.filter(f => f !== filter);
      return [...prev, filter];
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setActiveStatus('Tümü');
    setMaxChapters('');
    setSearch('');
  }, []);

  // ── MangaDex Style Filter Checkbox ──
  const CheckboxItem = ({ label }) => {
    const isActive = activeFilters.includes(label);
    return (
      <button 
        onClick={() => toggleFilter(label)}
        className="flex items-center gap-2.5 px-2 py-1.5 w-full text-left group"
      >
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
          isActive 
            ? 'bg-purple-600 border-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
            : 'bg-[#1a1625] border-slate-600 group-hover:border-purple-400'
        }`}>
          {isActive && <Check size={12} className="text-white stroke-[3]" />}
        </div>
        <span className={`text-[11px] font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
          {label}
        </span>
      </button>
    );
  };

  // ── Shared Filter Content (MangaDex Style Grid) ──
  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      
      {/* Üst Kısım: Status & Max Chapters */}
      <div className="flex flex-col xl:flex-row gap-4 bg-[#1a1625] p-4 rounded-xl border border-white/5">
        
        {/* Durum */}
        <div className="flex-1">
          <h4 className="text-slate-300 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
            <RefreshCw size={12} className="text-blue-400" /> Durum
          </h4>
          <div className="flex flex-wrap gap-2">
            {['Tümü', 'Devam Ediyor', 'Tamamlandı'].map(s => (
              <button key={s} onClick={() => setActiveStatus(s)}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeStatus === s ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-[#0d0a15] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Max Bölüm */}
        <div className="flex-1">
          <h4 className="text-slate-300 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookOpen size={12} className="text-emerald-400" /> Maksimum Bölüm Sayısı
          </h4>
          <div className="relative">
            <input 
              type="number" 
              value={maxChapters} 
              onChange={(e) => setMaxChapters(e.target.value)}
              placeholder="Örn: 50" 
              className="w-full bg-[#0d0a15] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-all"
            />
            {maxChapters && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-bold">
                ≤ {maxChapters} Bölüm
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Filter Categories */}
      <div className="bg-[#1a1625] p-5 rounded-xl border border-white/5">
        <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <SlidersHorizontal size={14} className="text-purple-400" /> Detaylı Kategoriler
        </h4>
        
        <div className="space-y-6">
          {/* Format */}
          <div>
            <h5 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Format</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-1">
              {FORMATS.map(f => <CheckboxItem key={f} label={f} />)}
            </div>
          </div>

          {/* Tür (Demographic) */}
          <div>
            <h5 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Hedef Kitle</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-1">
              {DEMOGRAPHICS.map(d => <CheckboxItem key={d} label={d} />)}
            </div>
          </div>

          {/* Genre */}
          <div>
            <h5 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Türler (Genres)</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-x-2 gap-y-1">
              {GENRES.map(g => <CheckboxItem key={g} label={g} />)}
            </div>
          </div>

          {/* Theme */}
          <div>
            <h5 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Temalar (Themes)</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-x-2 gap-y-1">
              {THEMES.map(t => <CheckboxItem key={t} label={t} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <X size={14} /> Tüm Seçimleri Temizle
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title & Search Bar Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Compass size={28} className="text-purple-500" /> Kütüphane
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">Gelişmiş filtreleme ile aradığın seriyi nokta atışı bul</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Seri ara..." aria-label="Seri arama"
                className="w-full bg-[#1a1625] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 outline-none transition-all shadow-inner" />
            </div>

            {/* Sort */}
            <div className="relative w-full md:w-auto">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sıralama seçeneği"
                className="w-full md:w-auto appearance-none bg-[#1a1625] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-purple-500 outline-none cursor-pointer shadow-inner">
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#0a0a14]">{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1.5 bg-[#1a1625] rounded-xl border border-white/10 h-[46px]">
              <button onClick={() => setViewMode('grid')} aria-label="Izgara görünümü"
                className={`w-9 h-full flex items-center justify-center rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setViewMode('list')} aria-label="Liste görünümü"
                className={`w-9 h-full flex items-center justify-center rounded-lg transition-all ${viewMode === 'list' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>
                <List size={16} />
              </button>
            </div>

            {/* Mobile filter button */}
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all relative shadow-lg shadow-purple-600/20"
            >
              <SlidersHorizontal size={16} /> Gelişmiş Filtre
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#070511]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ══════ LEFT SIDEBAR — KATEGORİLER (Desktop) ══════ */}
          <aside className="hidden lg:block w-[320px] xl:w-[380px] flex-shrink-0">
            <div className="sticky top-28">
              <FilterContent />
            </div>
          </aside>

          {/* ══════ CENTER — SONUÇLAR ══════ */}
          <div className="flex-1 min-w-0">
            
            {/* Active filter badges */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6 bg-[#1a1625]/50 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mr-1">Aktif:</span>
                {activeFilters.map(f => (
                  <span key={f} className="filter-tag bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {f}
                    <button onClick={() => toggleFilter(f)} className="tag-remove" aria-label={`${f} filtresini kaldır`}>✕</button>
                  </span>
                ))}
                {activeStatus !== 'Tümü' && (
                  <span className="filter-tag bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {activeStatus}
                    <button onClick={() => setActiveStatus('Tümü')} className="tag-remove" aria-label="Durum filtresini kaldır">✕</button>
                  </span>
                )}
                {maxChapters !== '' && parseInt(maxChapters) > 0 && (
                  <span className="filter-tag bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Maks {maxChapters} Bölüm
                    <button onClick={() => setMaxChapters('')} className="tag-remove" aria-label="Bölüm filtresini kaldır">✕</button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-[10px] text-red-400 font-bold hover:text-red-300 transition-colors ml-auto mr-2">
                  Temizle
                </button>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-6 px-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <motion.span
                  key={filtered.length}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center justify-center px-2 py-0.5 bg-white/10 rounded text-white"
                >
                  {filtered.length}
                </motion.span>
                Sonuç
              </p>
            </div>

            {/* Grid / List Render */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((item, i) => (
                    <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                      <SeriesCard item={item} idx={i} chapterCount={chapterCounts[String(item.id)] || 0} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((item, i) => (
                    <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                      <SeriesListItem item={item} idx={i} chapterCount={chapterCounts[String(item.id)] || 0} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-[#1a1625]/30 rounded-2xl border border-white/5 border-dashed mt-4">
                <Ghost size={64} className="text-slate-600 mb-6" />
                <h3 className="text-2xl font-black text-white mb-3">Hiçbir sonuç bulunamadı</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-sm">
                  Seçtiğiniz filtrelere uygun bir seri eşleşmedi. Filtreleri daraltmayı veya aramayı değiştirmeyi deneyin.
                </p>
                <button 
                  onClick={clearAllFilters}
                  className="px-8 py-3.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer isOpen={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}>
        <FilterContent />
        <button
          onClick={() => setMobileFilterOpen(false)}
          className="w-full mt-6 py-4 rounded-xl bg-purple-600 text-white font-black uppercase tracking-wider hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.5)]"
        >
          {filtered.length} Sonucu Göster
        </button>
      </MobileFilterDrawer>
    </main>
  );
}
