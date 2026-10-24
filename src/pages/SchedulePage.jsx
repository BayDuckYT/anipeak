import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Star, Bell, BellRing, Sparkles, Search, 
  ChevronRight, ChevronLeft, Filter, CheckCircle2, AlertTriangle,
  Play, BookOpen, Layers, Volume2, ShieldCheck, Flame, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useSEO } from '../hooks/useSEO';
import { playNotificationSound } from '../lib/notifications';
import Loader from '../components/Loader';

// Helper to format Date to 'YYYY-MM-DD'
function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Schedule Card (Reusable)
// ─────────────────────────────────────────────────────────────────────────────
function ScheduleCard({ 
  item, 
  matchedSeries, 
  isTracked, 
  onToggleTrack, 
  onNavigate,
  isToday,
  nowTimeStr 
}) {
  const itemTime = item.release_time?.slice(0, 5) || '18:00';
  
  // Compute release status
  const isPublished = item.status === 'published' || (isToday && nowTimeStr >= itemTime);
  const isDelayed = item.status === 'delayed';
  const isNewSeries = item.chapter_info === 'Yeni Seri' || item.status === 'new_series';

  return (
    <div 
      onClick={() => onNavigate(matchedSeries)}
      className="group relative flex flex-col rounded-2xl bg-[#0e0a1f]/80 hover:bg-[#140e2b] border border-white/5 hover:border-purple-500/40 shadow-lg hover:shadow-[0_10px_30px_rgba(168,85,247,0.25)] transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Top Cover Section */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#070511]">
        <img 
          src={item.poster_url || matchedSeries?.cover || '/placeholder.png'} 
          alt={item.series_name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
          loading="lazy"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=Kapak'; }} 
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a1f] via-transparent to-black/60" />

        {/* Saat Rozeti (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white font-black text-xs shadow-md">
          <Clock size={11} className="text-purple-400" />
          <span>{itemTime}</span>
        </div>

        {/* Canlı Durum Rozeti (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isPublished ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Yayında
            </span>
          ) : isDelayed ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/90 text-black text-[10px] font-black uppercase tracking-wider shadow-lg">
              <AlertTriangle size={10} />
              Gecikmeli
            </span>
          ) : isToday ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
              Bugün
            </span>
          ) : null}
        </div>

        {/* Takip Butonu (Floating on bottom right of image) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleTrack(item); }}
          className={`absolute bottom-3 right-3 z-20 p-2.5 rounded-xl backdrop-blur-md transition-all ${
            isTracked
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)] scale-105 border border-purple-400/50'
              : 'bg-black/70 text-slate-300 hover:text-white hover:bg-white/20 border border-white/10'
          }`}
          aria-label={isTracked ? `${item.series_name} takibini kapat` : `${item.series_name} için bildirim aç`}
          title={isTracked ? 'Takip ediliyor (Bölüm çıktığında bildirim alacaksın)' : 'Bildirimleri Aç'}
        >
          {isTracked ? <BellRing size={15} className="animate-bounce" /> : <Bell size={15} />}
        </button>

        {/* Puan ve Kategori (Floating bottom left of image) */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 text-[10px] font-black">
            <Star size={10} className="fill-amber-400" />
            {item.rating || '9.5'}
          </span>
        </div>
      </div>

      {/* Bottom Info Section */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors line-clamp-1 drop-shadow-sm">
            {item.series_name}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
              isNewSeries
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-white/5 text-emerald-400 border-emerald-500/20'
            }`}>
              {item.chapter_info || 'Yeni Bölüm'}
            </span>

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {item.category || 'Genel'}
            </span>
          </div>

          {/* Gecikme sebebi varsa */}
          {isDelayed && item.delay_reason && (
            <p className="text-[11px] text-amber-300/80 mt-2 italic bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 line-clamp-2">
              "{item.delay_reason}"
            </p>
          )}
        </div>

        {/* Action link */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-purple-300 transition-colors">
          <span>{matchedSeries?.slug ? 'Seriye Git' : 'Detaylar'}</span>
          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Netflix Style Horizontal Row
// ─────────────────────────────────────────────────────────────────────────────
function NetflixRow({ day, isTracked, onToggleTrack, resolveSeries, onNavigate, nowTimeStr }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -600, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 600, behavior: 'smooth' });
  };

  if (!day.items || day.items.length === 0) return null;

  return (
    <div className="mb-12 relative group/row">
      <div className="flex items-end justify-between px-4 sm:px-10 mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            {day.title}
            {day.isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white tracking-widest uppercase">
                Bugün
              </span>
            )}
          </h2>
          <span className="text-xs font-bold text-slate-500">{day.displayDate}</span>
        </div>

        <span className="text-xs font-bold text-slate-500">
          {day.items.length} yayın
        </span>
      </div>

      {/* Buttons */}
      <button 
        type="button"
        onClick={scrollLeft} 
        aria-label="Sola kaydır"
        className="absolute left-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-r from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400"
      >
        <ChevronLeft size={36} />
      </button>

      <button 
        type="button"
        onClick={scrollRight} 
        aria-label="Sağa kaydır"
        className="absolute right-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-l from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400"
      >
        <ChevronRight size={36} />
      </button>

      {/* Items */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-4 sm:px-10 pb-4"
      >
        {day.items.map((item) => {
          const matched = resolveSeries(item);
          const tracked = isTracked(item);

          return (
            <div key={item.id} className="w-[180px] sm:w-[220px] shrink-0 snap-start">
              <ScheduleCard 
                item={item}
                matchedSeries={matched}
                isTracked={tracked}
                onToggleTrack={onToggleTrack}
                onNavigate={onNavigate}
                isToday={day.isToday}
                nowTimeStr={nowTimeStr}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component: SchedulePage
// ─────────────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = Today
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'netflix' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterTrackedOnly, setFilterTrackedOnly] = useState(false);
  const [followMessage, setFollowMessage] = useState('');

  const { user, toggleTrackSeries, trackedSeriesIds = [] } = useAuth();
  const { series = [], sortedSeries = [] } = useApp();
  const navigate = useNavigate();

  const allSeriesList = sortedSeries.length ? sortedSeries : series;

  // SEO
  useSEO({
    title: 'Yayın Takvimi - Günlük & Haftalık Bölüm Saatleri',
    description: 'MahoraPeak haftalık yayın takvimi. Favori manga, manhwa ve webtoon bölümlerinin yayın saatlerini takip et, bildirimleri kaçırma!',
    url: 'https://mahorapeak.com.tr/takvim'
  });

  // Current local time
  const now = new Date();
  const nowTimeStr = now.toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // Fetch from DB
  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchSchedule() {
      try {
        const { data, error } = await supabase
          .from('publishing_schedule')
          .select('*')
          .order('release_time', { ascending: true });

        if (!error && data) {
          setSchedules(data);
        }
      } catch (err) {
        console.error('[SchedulePage] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  // Helper to match schedule item to series
  const resolveSeries = (item) => {
    if (item.series_id) {
      const byId = allSeriesList.find(s => String(s.id) === String(item.series_id));
      if (byId) return byId;
    }
    const normalize = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR');
    return allSeriesList.find(s => normalize(s.title) === normalize(item.series_name)) || null;
  };

  const isTracked = (item) => {
    const matched = resolveSeries(item);
    return Boolean(matched?.id && trackedSeriesIds.includes(String(matched.id)));
  };

  const handleNavigate = (matchedSeries) => {
    if (matchedSeries?.slug) {
      navigate(`/manga/${matchedSeries.slug}`);
    }
  };

  const handleToggleTrack = async (item) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }
    const matched = resolveSeries(item);
    if (!matched?.id) {
      setFollowMessage('Bu seri doğrudan katalogla eşleştirilemedi.');
      window.setTimeout(() => setFollowMessage(''), 3000);
      return;
    }

    try {
      const nowTracked = await toggleTrackSeries(matched.id);
      playNotificationSound('normal');
      setFollowMessage(
        nowTracked
          ? `⭐ "${item.series_name}" takibe alındı! Yeni bölüm çıktığında anlık bildirim alacaksın.`
          : `🔕 "${item.series_name}" takibi kaldırıldı.`
      );
      window.setTimeout(() => setFollowMessage(''), 3500);
    } catch (err) {
      console.error('[SchedulePage] Follow error:', err);
      setFollowMessage('Takip işlemi başarısız oldu. Tekrar deneyin.');
      window.setTimeout(() => setFollowMessage(''), 3000);
    }
  };

  // Generate 7 upcoming days
  const upcomingWeek = useMemo(() => {
    const today = new Date();
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = getLocalDateString(d);

      let title = d.toLocaleDateString('tr-TR', { weekday: 'long' });
      if (i === 0) title = 'Bugün';
      else if (i === 1) title = 'Yarın';

      const displayDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

      // Filter items matching date
      let items = schedules.filter(s => s.release_date === dateStr);

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLocaleLowerCase('tr-TR');
        items = items.filter(s => s.series_name?.toLocaleLowerCase('tr-TR').includes(q));
      }

      // Category filter
      if (selectedCategory !== 'all') {
        items = items.filter(s => s.category?.toLowerCase() === selectedCategory.toLowerCase());
      }

      // Tracked only filter
      if (filterTrackedOnly) {
        items = items.filter(isTracked);
      }

      days.push({
        id: dateStr,
        index: i,
        title,
        displayDate,
        dateStr,
        isToday: i === 0,
        isTomorrow: i === 1,
        items
      });
    }

    return days;
  }, [schedules, searchQuery, selectedCategory, filterTrackedOnly, trackedSeriesIds]);

  // Featured Premiere Hero (First item of today, or first upcoming)
  const featuredItem = useMemo(() => {
    const todayItems = upcomingWeek[0]?.items || [];
    if (todayItems.length > 0) return todayItems[0];
    for (const day of upcomingWeek) {
      if (day.items?.length > 0) return day.items[0];
    }
    return null;
  }, [upcomingWeek]);

  // Categories present in schedule
  const availableCategories = useMemo(() => {
    const cats = new Set(schedules.map(s => s.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [schedules]);

  // Total items this week
  const totalThisWeekCount = useMemo(() => {
    return upcomingWeek.reduce((sum, d) => sum + d.items.length, 0);
  }, [upcomingWeek]);

  if (loading) {
    return <Loader fullScreen={false} text="Yayın Takvimi Hazırlanıyor..." />;
  }

  const activeDay = upcomingWeek[selectedDayIndex] || upcomingWeek[0];
  const featuredMatched = featuredItem ? resolveSeries(featuredItem) : null;
  const featuredIsTracked = featuredItem ? isTracked(featuredItem) : false;

  return (
    <main className="min-h-screen bg-[#070511] pb-24 overflow-x-hidden text-slate-100">

      {/* ── CINEMATIC HERO PREMIERE ── */}
      <div className="relative w-full h-[65vh] min-h-[460px] max-h-[700px] mb-8 overflow-hidden">
        {/* Background Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
          style={{ 
            backgroundImage: `url(${featuredItem?.poster_url || '/yayınarkaplan.jpg'})`,
            opacity: 0.35,
            filter: 'blur(2px)'
          }}
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/90 to-transparent" />

        {/* Hero Content */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-10 h-full flex flex-col justify-end pb-12 sm:pb-16">
          <div className="flex items-center gap-2 mb-4 px-3.5 py-1.5 bg-purple-500/10 backdrop-blur-md rounded-full w-fit border border-purple-500/30">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-xs font-black text-purple-300 tracking-widest uppercase">
              Haftanın Öne Çıkan Yayını
            </span>
          </div>

          <h1 className="text-3xl sm:text-6xl md:text-7xl font-black text-white uppercase tracking-tight drop-shadow-2xl mb-4 max-w-4xl line-clamp-2">
            {featuredItem?.series_name || 'MAHORAPEAK YAYIN TAKVİMİ'}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-slate-300 mb-6">
            {featuredItem ? (
              <>
                <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg uppercase">
                  {featuredItem.chapter_info || 'Yeni Bölüm'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star size={14} className="fill-amber-400" />
                  {featuredItem.rating || '9.5'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-purple-300">
                  <Clock size={14} />
                  Saat {featuredItem.release_time?.slice(0, 5)} TSİ
                </span>
                <span>•</span>
                <span className="text-slate-400">{featuredItem.category}</span>
              </>
            ) : (
              <span>Güncel anime ve manhwa yayın saatlerini anlık takip edin.</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {featuredItem && (
              <button
                type="button"
                onClick={() => handleToggleTrack(featuredItem)}
                className={`px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  featuredIsTracked
                    ? 'bg-purple-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:bg-purple-500'
                    : 'bg-white text-black hover:bg-slate-200'
                }`}
              >
                {featuredIsTracked ? <BellRing size={16} /> : <Bell size={16} />}
                {featuredIsTracked ? 'Takip Ediliyor' : 'Bölüm Bildirimi Aç'}
              </button>
            )}

            {featuredMatched?.slug && (
              <button
                type="button"
                onClick={() => navigate(`/manga/${featuredMatched.slug}`)}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-2 transition-all"
              >
                <BookOpen size={16} />
                Seriyi Oku
              </button>
            )}

            <button
              type="button"
              onClick={() => document.getElementById('takvim-ana-bolum')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 text-xs sm:text-sm font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-2 transition-all"
            >
              <Calendar size={16} />
              Tüm Haftayı Gör
            </button>
          </div>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {followMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status" 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] rounded-2xl border border-purple-500/40 bg-[#0e0a1f]/95 backdrop-blur-xl px-5 py-3 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <span className="font-semibold text-xs sm:text-sm">{followMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div id="takvim-ana-bolum" className="max-w-7xl mx-auto px-4 sm:px-10 space-y-8 scroll-mt-20">

        {/* ── CONTROLS & FILTER BAR ── */}
        <div className="rounded-3xl bg-[#0c081a]/90 border border-purple-500/20 p-4 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Left: View Mode Buttons */}
          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'daily'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock size={13} />
              Günün Akışı
            </button>

            <button
              type="button"
              onClick={() => setViewMode('netflix')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'netflix'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={13} />
              Haftalık Şerit
            </button>
          </div>

          {/* Center: Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Takvimde seri ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#070511] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all pr-10"
            />
            <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Right: Sadece Takip Ettiklerim Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
                return;
              }
              setFilterTrackedOnly(!filterTrackedOnly);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
              filterTrackedOnly
                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BellRing size={14} className={filterTrackedOnly ? 'text-amber-400' : 'text-slate-400'} />
            <span>Sadece Takip Ettiklerim</span>
            {trackedSeriesIds.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-bold ml-0.5">
                {trackedSeriesIds.length}
              </span>
            )}
          </button>
        </div>

        {/* ── 7-DAY HORIZONTAL STRIP (FOR DAILY VIEW) ── */}
        {viewMode === 'daily' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {upcomingWeek.map((day) => {
              const isSelected = selectedDayIndex === day.index;

              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayIndex(day.index)}
                  className={`relative p-4 rounded-2xl border text-center transition-all group overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-700 to-indigo-800 border-purple-400 shadow-xl shadow-purple-600/30'
                      : 'bg-[#0c081a]/60 border-white/5 hover:border-purple-500/30 hover:bg-[#120c24]'
                  }`}
                >
                  {day.isToday && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}

                  <span className={`block text-xs font-black uppercase tracking-wider mb-0.5 ${
                    isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}>
                    {day.title}
                  </span>

                  <span className={`block text-[11px] font-bold mb-2 ${
                    isSelected ? 'text-purple-200' : 'text-slate-500'
                  }`}>
                    {day.displayDate}
                  </span>

                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : day.items.length > 0 
                      ? 'bg-purple-500/10 text-purple-300' 
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    {day.items.length} Seri
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── VIEW 1: DAILY FLOW (CHOSEN DAY) ── */}
        {viewMode === 'daily' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Calendar size={22} className="text-purple-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  {activeDay.title} Programı
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  ({activeDay.displayDate})
                </span>
              </div>

              <span className="text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                {activeDay.items.length} İçerik
              </span>
            </div>

            {/* Grid of Cards */}
            {activeDay.items.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {activeDay.items.map(item => {
                  const matched = resolveSeries(item);
                  const tracked = isTracked(item);

                  return (
                    <ScheduleCard 
                      key={item.id}
                      item={item}
                      matchedSeries={matched}
                      isTracked={tracked}
                      onToggleTrack={handleToggleTrack}
                      onNavigate={handleNavigate}
                      isToday={activeDay.isToday}
                      nowTimeStr={nowTimeStr}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0c081a]/50 border border-white/5 p-16 text-center space-y-4">
                <Calendar size={40} className="mx-auto text-slate-600" />
                <h3 className="text-base font-black text-white">
                  {filterTrackedOnly 
                    ? 'Bu gün için takip ettiğin serilerden yayın bulunmuyor.' 
                    : `${activeDay.title} günü için henüz program girilmemiş.`}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {filterTrackedOnly
                    ? 'Takvimdeki serilerin ziline tıklayarak takibe alabilir, yeni bölümler yayınlandığında anlık bildirim alabilirsin!'
                    : 'Diğer günleri inceleyebilir veya arama filtrenizi temizleyebilirsiniz.'}
                </p>
                {filterTrackedOnly && (
                  <button
                    type="button"
                    onClick={() => setFilterTrackedOnly(false)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black uppercase tracking-wider hover:bg-purple-500 transition-all"
                  >
                    Tüm Programı Göster
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW 2: NETFLIX ROW SLIDERS (ALL 7 DAYS) ── */}
        {viewMode === 'netflix' && (
          <div className="space-y-4">
            {upcomingWeek.map(day => (
              <NetflixRow 
                key={day.id}
                day={day}
                isTracked={isTracked}
                onToggleTrack={handleToggleTrack}
                resolveSeries={resolveSeries}
                onNavigate={handleNavigate}
                nowTimeStr={nowTimeStr}
              />
            ))}

            {upcomingWeek.every(d => d.items.length === 0) && (
              <div className="text-center py-20 text-slate-500 text-sm">
                Arama kriterlerinize uygun yayın bulunamadı.
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATION HELPER BANNER ── */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#0e0a1f] to-indigo-950/40 border border-purple-500/30 p-6 sm:p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
              <BellRing size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Bölüm Yayınlarını Kaçırma!
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Takvime eklenen serilerin ziline tıklayarak takip listene ekle. Bölüm yayınlandığında sana otomatik tarayıcı bildirimi ve sesli uyarı iletilir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                playNotificationSound('normal');
                setFollowMessage('🔔 Bildirim sesi test edildi!');
                window.setTimeout(() => setFollowMessage(''), 2500);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10"
            >
              <Volume2 size={15} />
              Sesi Test Et
            </button>

            <button
              type="button"
              onClick={() => navigate('/ayarlar')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all"
            >
              Bildirim Ayarları
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
