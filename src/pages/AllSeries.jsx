import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Eye, BookOpen, Play, Flame, Grid3X3, List, ChevronRight, ChevronDown, Crown, Swords, Compass, Heart, Smile, Skull, HelpCircle, Brain, Rocket, Ghost, AlertTriangle, Landmark, School, Sparkles, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getOptimizedImage, handleImageError } from '../utils/imageOpt.js';
import { useSEO } from '../hooks/useSEO';

// ── Category config ──
const GENERAL_GENRES = [
  { label: 'Aksiyon', icon: Swords },
  { label: 'Macera', icon: Compass },
  { label: 'Fantastik', icon: Sparkles },
  { label: 'Romantik', icon: Heart },
  { label: 'Dram', icon: Flame },
  { label: 'Komedi', icon: Smile },
  { label: 'Korku', icon: Skull },
  { label: 'Gizem', icon: HelpCircle },
  { label: 'Psikolojik', icon: Brain },
  { label: 'Bilim Kurgu', icon: Rocket },
  { label: 'Doğaüstü', icon: Ghost },
  { label: 'Gerilim', icon: AlertTriangle },
  { label: 'Tarihi', icon: Landmark },
  { label: 'Okul Hayatı', icon: School },
];

const TYPE_TABS = ['Tümü', 'Manhwa', 'Manga', 'Manhua', 'Webtoon'];

const MANHWA_TAGS = ['Sistem / Seviye Atlama', 'Reenkarnasyon', 'Zindan / Kule', 'Dövüş Sanatları (Murim)', 'Zorbalık / İntikam', 'Başka Dünyaya Geçiş (Isekai)', 'Sanal Gerçeklik / Oyun', 'Yüce Varlıklar / Takımyıldızları', 'Modern Fantazi'];
const MANGA_TAGS = ['Shounen', 'Seinen', 'Shoujo', 'Josei', 'Mecha', 'Samuray / Ninja', 'Yaşamdan Kesitler', 'Spor', 'Ecchi'];
const MANHUA_TAGS = ['Gelişim (Cultivation)', 'Simya / Eczacılık', 'Ölümsüzlük Yolculuğu', 'İmparatorluk / Saray Entrikaları', 'Modern Şehirde Usta'];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popüler' },
  { value: 'rating', label: 'Puan' },
  { value: 'newest', label: 'En Yeni' },
  { value: 'az', label: 'A-Z' },
];

// ── Series Card ──
function SeriesCard({ item }) {
  const { getChapters } = useApp();
  const chapterCount = getChapters(item.id).length;
  const genres = Array.isArray(item.genre) ? item.genre : item.genre ? [item.genre] : [];

  return (
    <Link to={`/manhwa/${item.id}`} className="group block">
      <div className="relative rounded-xl overflow-hidden border border-white/8 group-hover:border-purple-500/40 group-hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={getOptimizedImage(item.cover, 300)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" width={200} height={267}
            onError={handleImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          {/* Rating badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 border border-amber-500/30 backdrop-blur-sm">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-white text-[11px] font-black">{item.rating}</span>
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
function SeriesListItem({ item }) {
  const { getChapters } = useApp();
  const chapterCount = getChapters(item.id).length;
  const genres = Array.isArray(item.genre) ? item.genre : item.genre ? [item.genre] : [];

  return (
    <Link to={`/manhwa/${item.id}`} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.02] transition-all group">
      <img src={getOptimizedImage(item.cover, 100)} alt={item.title} className="w-12 h-16 rounded-lg object-cover border border-white/10 flex-shrink-0" loading="lazy" decoding="async" width={48} height={64}
        onError={handleImageError} />
      <div className="flex-1 min-w-0">
        <h3 className="text-white text-sm font-bold truncate group-hover:text-purple-400 transition-colors">{item.title}</h3>
        <p className="text-slate-400 text-[10px] truncate">{genres.join(', ')}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-slate-500 text-[10px] font-bold">{chapterCount}B</span>
        <div className="flex items-center gap-1">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-amber-400 text-xs font-black">{item.rating}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Popularity Sidebar Item ──
function PopularItem({ item, rank }) {
  const genres = Array.isArray(item.genre) ? item.genre : item.genre ? [item.genre] : [];
  return (
    <Link to={`/manhwa/${item.id}`} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/5 transition-all group">
      <span className={`text-lg font-black w-6 text-center flex-shrink-0 ${
        rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-orange-400' : 'text-slate-400'
      }`}>{rank}</span>
      <img src={getOptimizedImage(item.cover, 100)} alt={item.title} className="w-10 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0" loading="lazy" decoding="async" width={40} height={56}
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

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function AllSeries() {
  const { series, getChapters } = useApp();
  const [searchParams] = useSearchParams();
  const urlGenre = searchParams.get('genre');

  useSEO({
    title: 'Tüm Seriler',
    description: 'AniPeak üzerindeki tüm manhwa ve webtoon serilerini keşfet. Türe, popülerliğe ve güncelleme tarihine göre filtrele.',
    url: 'https://anipeak.com.tr/all-series'
  });

  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState(urlGenre || 'Tümü');
  const [activeType, setActiveType] = useState('Tümü');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showTypeSubcats, setShowTypeSubcats] = useState(null); // 'Manhwa' | 'Manga' | 'Manhua'
  const [activeSubcat, setActiveSubcat] = useState(null);

  const validSeries = useMemo(() => series.filter(s => !s.is_deleted), [series]);

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

  // Filtered series
  const filtered = useMemo(() => {
    let result = validSeries.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const mGenres = Array.isArray(m.genre) ? m.genre : m.genre ? [m.genre] : [];
      const matchGenre = activeGenre === 'Tümü' || mGenres.some(g => g.toLowerCase().includes(activeGenre.toLowerCase()));
      return matchSearch && matchGenre;
    });

    // Sort
    switch (sortBy) {
      case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
      case 'az': result.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr')); break;
      default: result.sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0));
    }
    return result;
  }, [validSeries, search, activeGenre, sortBy]);

  // Top 5 popular
  const popular5 = useMemo(() =>
    [...validSeries].sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0)).slice(0, 5),
  [validSeries]);

  const handleGenreClick = (genre) => {
    setActiveGenre(genre);
    setActiveSubcat(null);
  };

  const getSubcats = () => {
    if (showTypeSubcats === 'Manhwa') return MANHWA_TAGS;
    if (showTypeSubcats === 'Manga') return MANGA_TAGS;
    if (showTypeSubcats === 'Manhua') return MANHUA_TAGS;
    return [];
  };

  return (
    <main className="min-h-screen pt-20 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">

          {/* ══════ LEFT SIDEBAR — KATEGORİLER ══════ */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="sticky top-24 glass border border-white/8 rounded-2xl p-4">
              <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen size={14} className="text-purple-400" /> Kategoriler
              </h3>

              {/* General genres */}
              <div className="space-y-0.5 mb-4">
                <button onClick={() => handleGenreClick('Tümü')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeGenre === 'Tümü' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <span className="flex items-center gap-2"><Layers size={13} /> Tümü</span>
                  <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{genreCounts['Tümü']}</span>
                </button>
                {GENERAL_GENRES.map(g => {
                  const Icon = g.icon;
                  const count = genreCounts[g.label] || 0;
                  return (
                    <button key={g.label} onClick={() => handleGenreClick(g.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeGenre === g.label ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}>
                      <span className="flex items-center gap-2"><Icon size={13} /> {g.label}</span>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/8 my-3" />

              {/* Type sections (Manhwa, Manga, Manhua) */}
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
                          <button key={tag} onClick={() => { setActiveSubcat(tag); setActiveGenre('Tümü'); }}
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
            </div>
          </aside>

          {/* ══════ CENTER — TÜM SERİLER ══════ */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Tüm Seriler</h1>
            </div>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Seri ara..." aria-label="Seri arama"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-purple-500 outline-none transition-all" />
              </div>

              {/* Type tabs */}
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
                {TYPE_TABS.map(t => (
                  <button key={t} onClick={() => setActiveType(t)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      activeType === t ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sıralama seçeneği"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 outline-none cursor-pointer">
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#0a0a14]">{o.label}</option>
                ))}
              </select>

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

            {/* Active filter badge */}
            {(activeGenre !== 'Tümü' || activeSubcat) && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Filtre:</span>
                {activeGenre !== 'Tümü' && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30 flex items-center gap-1">
                    {activeGenre}
                    <button onClick={() => setActiveGenre('Tümü')} aria-label="Tür filtresini kaldır" className="ml-1 text-purple-400 hover:text-white">✕</button>
                  </span>
                )}
                {activeSubcat && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black border border-blue-500/30 flex items-center gap-1">
                    {activeSubcat}
                    <button onClick={() => setActiveSubcat(null)} aria-label="Alt kategori filtresini kaldır" className="ml-1 text-blue-400 hover:text-white">✕</button>
                  </span>
                )}
              </div>
            )}

            {/* Results count */}
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{filtered.length} seri bulundu</p>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence mode="sync">
                  {filtered.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}>
                      <SeriesCard item={item} />
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
                      <SeriesListItem item={item} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-32">
                <Flame size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Aradığın seri bulunamadı.</h3>
                <p className="text-slate-500 text-sm">Farklı bir kategori veya arama dene.</p>
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
                  <PopularItem key={item.id} item={item} rank={i + 1} />
                ))}
              </div>
              <Link to="/popular" className="flex items-center justify-center gap-1 mt-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-xs text-slate-400 font-bold hover:text-purple-400 hover:border-purple-500/30 transition-all">
                Tümünü Gör <ChevronRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
