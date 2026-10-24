import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Star, Bell, BellRing, ChevronRight, ChevronLeft, Calendar, Filter, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useSEO } from '../hooks/useSEO';
import Loader from '../components/Loader';

// Netflix Style Horizontal Slider
function NetflixScheduleRow({ title, dateStr, items, isTracked, onToggleTrack, resolveSeries, onNavigate }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -800, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 800, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-10 relative group/row">
      <div className="flex items-end gap-3 px-4 sm:px-12 mb-4">
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{title}</h2>
        <span className="text-sm font-bold text-slate-500 mb-1">{dateStr}</span>
        <span className="text-xs font-bold text-slate-600 mb-1 ml-auto hidden sm:inline">
          {items.length} seri
        </span>
      </div>

      {/* Scroll Buttons */}
      <button 
        type="button"
        onClick={scrollLeft} 
        aria-label="Sola kaydır"
        className="absolute left-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-r from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400"
      >
        <ChevronLeft size={40} className="drop-shadow-lg" />
      </button>

      <button 
        type="button"
        onClick={scrollRight} 
        aria-label="Sağa kaydır"
        className="absolute right-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-l from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400"
      >
        <ChevronRight size={40} className="drop-shadow-lg" />
      </button>

      {/* Row Items */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-4 sm:px-12 pb-8"
      >
        {items.map((item) => {
          const match = resolveSeries(item);
          const tracked = isTracked(item);

          return (
            <div 
              key={item.id} 
              onClick={() => onNavigate(match)}
              className="relative group block w-[160px] sm:w-[200px] flex-shrink-0 snap-start cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              <article className="relative rounded-md overflow-hidden bg-[#141414] border border-white/5 shadow-xl">
                {/* Saat Rozeti */}
                <div className="absolute top-0 right-0 z-20 px-2 py-1 bg-purple-600/90 backdrop-blur-md rounded-bl-lg">
                  <span className="text-white text-xs font-black tracking-widest">{item.release_time?.slice(0, 5) || '00:00'}</span>
                </div>
                
                <div className="relative aspect-[2/3] overflow-hidden bg-[#070511]">
                  <img 
                    src={item.poster_url} 
                    alt={item.series_name} 
                    className="w-full h-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100" 
                    loading="lazy"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=Kapak'; }} 
                  />
                  
                  {/* Netflix Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent opacity-80" />
                  
                  {/* Details overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-1 z-10">
                    <h3 className="text-white text-sm font-black truncate drop-shadow-md">{item.series_name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        item.chapter_info === 'Yeni Seri' 
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                        : 'bg-white/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {item.chapter_info}
                      </span>

                      {/* Takip Butonu */}
                      <button
                        type="button"
                        disabled={!match?.id && !item.series_id}
                        onClick={(event) => { event.stopPropagation(); onToggleTrack(item); }}
                        className={`p-1.5 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                          tracked 
                            ? 'bg-purple-600/40 text-purple-300 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.5)] scale-110' 
                            : 'bg-black/60 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        aria-label={tracked ? `${item.series_name} takibini kapat` : `${item.series_name} için bölüm bildirimi aç`}
                        title={(!match?.id && !item.series_id) ? 'Bu seri katalogla eşleştirilemedi' : tracked ? 'Takip ediliyor (Bölüm duyurusu açık)' : 'Yeni bölüm bildirimi al'}
                      >
                        {tracked ? <BellRing size={13} /> : <Bell size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followMessage, setFollowMessage] = useState('');
  const [filterTrackedOnly, setFilterTrackedOnly] = useState(false);

  const { user, toggleTrackSeries, trackedSeriesIds = [] } = useAuth();
  const { series = [], sortedSeries = [] } = useApp();
  const navigate = useNavigate();

  const allSeriesList = sortedSeries.length ? sortedSeries : series;

  const resolveSeries = (item) => {
    if (item.series_id) {
      return allSeriesList.find(s => String(s.id) === String(item.series_id)) || { id: item.series_id, title: item.series_name };
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
    const matched = resolveSeries(item);
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }
    if (!matched?.id) return;
    
    try {
      const nowTracked = await toggleTrackSeries(matched.id);
      setFollowMessage(
        nowTracked
          ? `⭐ ${item.series_name} takibe alındı! Yeni bölüm yayınlandığında sana anlık bildirim göndereceğiz.`
          : `🔕 ${item.series_name} takibi kapatıldı.`
      );
      window.setTimeout(() => setFollowMessage(''), 3500);
    } catch (error) {
      console.error('[Takvim] Takip ayarı kaydedilemedi:', error);
      setFollowMessage('Takip ayarı kaydedilemedi. Yeniden dene.');
      window.setTimeout(() => setFollowMessage(''), 3500);
    }
  };

  useSEO({
    title: 'Yayın Takvimi',
    description: 'MahoraPeak yayın takvimi. Hangi manhwa ve webtoonların hangi gün yeni bölüm yayınlayacağını takip et.',
    url: 'https://mahorapeak.com.tr/takvim'
  });

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchSchedule() {
      const { data, error } = await supabase
        .from('publishing_schedule')
        .select('*')
        .order('release_time', { ascending: true });
      
      if (!error && data) {
        setSchedule(data);
      }
      setLoading(false);
    }
    fetchSchedule();
  }, []);

  // Prepare next 7 days
  const upcomingDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = getLocalDateString(date);
      
      let title = date.toLocaleDateString('tr-TR', { weekday: 'long' });
      if (i === 0) title = 'Bugün';
      else if (i === 1) title = 'Yarın';

      let items = schedule.filter(s => s.release_date === dateStr);
      if (filterTrackedOnly) {
        items = items.filter(isTracked);
      }
      days.push({ id: dateStr, title, dateStr, items });
    }
    return days;
  }, [schedule, filterTrackedOnly, trackedSeriesIds]);

  const featuredToday = upcomingDays[0]?.items[0]; // Hero feature

  if (loading) {
    return <Loader fullScreen={false} text="Yayın Takvimi Yükleniyor..." />;
  }

  return (
    <main className="min-h-screen bg-[#070511] pb-20 overflow-x-hidden">
      
      {/* ── CINEMATIC HERO (Featured Series of the Day) ── */}
      <div className="relative w-full h-[70vh] min-h-[420px] sm:min-h-[500px] mb-12">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" 
          style={{ backgroundImage: `url(${featuredToday?.poster_url || '/yayinarkaplan.jpg'})`, opacity: 0.4, mixBlendMode: 'screen' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/80 to-transparent" />
        
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-12 h-full flex flex-col justify-end pb-16 sm:pb-24">
          <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/20">
            <Calendar size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">Bugünün Öne Çıkanı</span>
          </div>
          
          <h1 className="text-4xl leading-tight sm:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-2xl mb-4 max-w-3xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
            {featuredToday?.series_name || 'YAYIN TAKVİMİ'}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-300 text-xs sm:text-sm font-bold mb-6 sm:mb-8">
            {featuredToday && (
              <>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded uppercase">{featuredToday.chapter_info}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-purple-400"><Star size={14} className="fill-purple-400" /> {featuredToday.rating}</span>
                <span>•</span>
                <span>Saat {featuredToday.release_time?.slice(0, 5)}</span>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!featuredToday || !resolveSeries(featuredToday)}
              onClick={() => featuredToday && handleToggleTrack(featuredToday)}
              className={`px-4 sm:px-8 py-3 text-xs sm:text-sm font-black uppercase tracking-widest rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                featuredToday && isTracked(featuredToday)
                  ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:bg-purple-500'
                  : 'bg-white text-black hover:bg-slate-200'
              }`}
            >
              {featuredToday && isTracked(featuredToday) ? <BellRing size={18} /> : <Bell size={18} />}
              {featuredToday && isTracked(featuredToday) ? 'Takip Ediliyor' : 'Bölüm Bildirimi Aç'}
            </button>
            <button onClick={() => document.getElementById('takvim-gunleri')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="px-4 sm:px-8 py-3 bg-white/20 text-white text-xs sm:text-sm font-black uppercase tracking-widest rounded flex items-center gap-2 backdrop-blur-md hover:bg-white/30 transition-colors">
              Haftalık Program
            </button>
          </div>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
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

      {/* ── FİLTRE ÇUBUĞU ── */}
      <div id="takvim-gunleri" className="relative z-30 -mt-20 scroll-mt-24 px-4 sm:px-12 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 max-w-fit">
          <button
            type="button"
            onClick={() => setFilterTrackedOnly(false)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              !filterTrackedOnly
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tüm Program
          </button>

          <button
            type="button"
            onClick={() => {
              if (!user) {
                window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
                return;
              }
              setFilterTrackedOnly(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              filterTrackedOnly
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BellRing size={13} className="text-amber-400" />
            <span>Takip Ettiklerim</span>
            {trackedSeriesIds.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-bold ml-1">
                {trackedSeriesIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── NETFLIX ROWS ── */}
      <div className="relative z-30">
        {upcomingDays.map(day => (
          <NetflixScheduleRow 
            key={day.id} 
            title={day.title} 
            dateStr={day.dateStr} 
            items={day.items} 
            isTracked={isTracked} 
            onToggleTrack={handleToggleTrack} 
            resolveSeries={resolveSeries}
            onNavigate={handleNavigate}
          />
        ))}
      </div>

      {upcomingDays.every(d => d.items.length === 0) && (
        <div className="text-center py-20 text-slate-500 text-sm">
          {filterTrackedOnly
            ? 'Takip ettiğin serilerden bu hafta yayınlanacak bir bölüm bulunmuyor. Takvimdeki serilerin ziline basarak takibe alabilirsin!'
            : 'Bu hafta için henüz program girilmemiş.'}
        </div>
      )}
    </main>
  );
}
