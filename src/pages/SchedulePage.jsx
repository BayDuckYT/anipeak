import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Star, Bell, BellRing, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useSEO } from '../hooks/useSEO';
import Loader from '../components/Loader';

// Netflix Style Horizontal Slider
function NetflixScheduleRow({ title, dateStr, items, isTracked, onToggleTrack, resolveSeriesId }) {
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
      </div>

      {/* Scroll Buttons */}
      <button 
        onClick={scrollLeft} 
        className="absolute left-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-r from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400"
      >
        <ChevronLeft size={40} className="drop-shadow-lg" />
      </button>

      <button 
        onClick={scrollRight} 
        className="absolute right-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-l from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400"
      >
        <ChevronRight size={40} className="drop-shadow-lg" />
      </button>

      {/* Row Items */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-4 sm:px-12 pb-8"
      >
        {items.map((item, idx) => (
          <div key={item.id} className="relative group block w-[160px] sm:w-[200px] flex-shrink-0 snap-start cursor-pointer hover:scale-105 transition-transform duration-300">
            <article className="relative rounded-md overflow-hidden bg-[#141414] border border-white/5 shadow-xl">
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
                    <button
                      type="button"
                      disabled={!resolveSeriesId(item)}
                      onClick={(event) => { event.stopPropagation(); onToggleTrack(item); }}
                      className={`transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${isTracked(item) ? 'text-purple-300' : 'text-slate-400 hover:text-white'}`}
                      aria-label={isTracked(item) ? `${item.series_name} takibini kapat` : `${item.series_name} için bölüm bildirimi aç`}
                      title={!resolveSeriesId(item) ? 'Bu seri katalogla eşleştirilemedi' : isTracked(item) ? 'Takip ediliyor' : 'Yeni bölüm bildirimi al'}
                    >
                      {isTracked(item) ? <BellRing size={14} /> : <Bell size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followMessage, setFollowMessage] = useState('');
  const { user, updateProfile } = useAuth();
  const { sortedSeries = [] } = useApp();
  const trackedSeriesIds = (user?.notification_settings?.scheduleSeriesIds || []).map(String);

  const resolveSeriesId = (item) => {
    if (item.series_id) return String(item.series_id);
    const normalize = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR');
    return sortedSeries.find(series => normalize(series.title) === normalize(item.series_name))?.id?.toString() || null;
  };

  const isTracked = (item) => {
    const seriesId = resolveSeriesId(item);
    return Boolean(seriesId && trackedSeriesIds.includes(seriesId));
  };

  const toggleTrack = async (item) => {
    const seriesId = resolveSeriesId(item);
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }
    if (!seriesId) return;
    const wasTracked = isTracked(item);
    const nextIds = wasTracked
      ? trackedSeriesIds.filter(id => id !== seriesId)
      : [...new Set([...trackedSeriesIds, seriesId])];
    try {
      await updateProfile({ notification_settings: {
        newChapter: true,
        replies: true,
        system: true,
        schedule: true,
        ...(user.notification_settings || {}),
        scheduleSeriesIds: nextIds,
      } });
      setFollowMessage(wasTracked ? `${item.series_name} takibi kapatıldı.` : `${item.series_name} takibe alındı; yeni bölüm duyurularını bildirim kutusunda göreceksin.`);
      window.setTimeout(() => setFollowMessage(''), 3200);
    } catch (error) {
      console.error('[Takvim] Takip ayarı kaydedilemedi:', error);
      setFollowMessage('Takip ayarı kaydedilemedi. Yeniden dene.');
      window.setTimeout(() => setFollowMessage(''), 3200);
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

      const items = schedule.filter(s => s.release_date === dateStr);
      days.push({ id: dateStr, title, dateStr, items });
    }
    return days;
  }, [schedule]);

  const featuredToday = upcomingDays[0]?.items[0]; // Just use the first item of today as the featured hero

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
              disabled={!featuredToday || !resolveSeriesId(featuredToday)}
              onClick={() => featuredToday && toggleTrack(featuredToday)}
              className="px-4 sm:px-8 py-3 bg-white text-black text-xs sm:text-sm font-black uppercase tracking-widest rounded flex items-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {featuredToday && isTracked(featuredToday) ? <Bell size={20} /> : <BellRing size={20} />}
              {featuredToday && isTracked(featuredToday) ? 'Takibi Kapat' : 'Seriyi Takip Et'}
            </button>
            <button onClick={() => document.getElementById('takvim-gunleri')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="px-4 sm:px-8 py-3 bg-white/20 text-white text-xs sm:text-sm font-black uppercase tracking-widest rounded flex items-center gap-2 backdrop-blur-md hover:bg-white/30 transition-colors">
              Tüm Takvim
            </button>
          </div>
        </div>
      </div>

      {/* ── NETFLIX ROWS ── */}
      {followMessage && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-purple-400/30 bg-[#171126] px-4 py-3 text-sm text-white shadow-xl">{followMessage}</div>}
      <div id="takvim-gunleri" className="relative z-30 -mt-20 scroll-mt-24">
        {upcomingDays.map(day => (
          <NetflixScheduleRow key={day.id} title={day.title} dateStr={day.dateStr} items={day.items} isTracked={isTracked} onToggleTrack={toggleTrack} resolveSeriesId={resolveSeriesId} />
        ))}
      </div>

      {upcomingDays.every(d => d.items.length === 0) && (
        <div className="text-center py-20 text-slate-500">
          Bu hafta için henüz program girilmemiş.
        </div>
      )}
    </main>
  );
}
