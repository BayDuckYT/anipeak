import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Star, Bell, BellRing, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Yayın Takvimi',
    description: 'AniPeak yayın takvimi. Hangi manhwa ve webtoonların hangi gün yeni bölüm yayınlayacağını takip et.',
    url: 'https://anipeak.com.tr/takvim'
  });

  // Weekly Calendar State
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi başlangıç
    return new Date(d.setDate(diff));
  };

  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateString(new Date()));

  const handlePrevWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate);
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

  const dailyPrograms = useMemo(() => {
    return schedule.filter(item => item.release_date === selectedDateStr);
  }, [schedule, selectedDateStr]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <Zap className="absolute inset-0 m-auto text-purple-400 animate-pulse" size={24} />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070511] pb-20">
      {/* ── CINEMATIC HERO HEADER ── */}
      <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-[url('/yayinarkaplan.jpg')] bg-cover bg-center opacity-40 mix-blend-screen scale-105 transition-all duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/60 to-transparent" />
        
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-28 pb-12 flex flex-col gap-4">
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
            YAYIN <span className="text-purple-500">PROGRAMI</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl drop-shadow-md">
            Yeni bölümlerin ne zaman yayınlanacağını buradan takip edebilirsin. AniPeak mühürlü serileri anında okumak için bildirimleri açmayı unutma!
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 -mt-8 relative z-30">
        {/* Days Tabs (Functional Weekly Calendar) */}
        <div className="bg-[#141414]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:px-8 mb-8 shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={handlePrevWeek} aria-label="Önceki hafta" className="p-2 sm:p-3 text-slate-400 hover:text-white glass hover:bg-white/10 rounded-xl transition-all">
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar custom-scrollbar flex-1 pb-2 sm:pb-0">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const dayDate = new Date(weekStart);
                dayDate.setDate(dayDate.getDate() + offset);
                
                const dayDateStr = getLocalDateString(dayDate);
                const isActive = selectedDateStr === dayDateStr;
                
                const dayNameShort = dayDate.toLocaleDateString('tr-TR', { weekday: 'short' });
                const dayNumber = dayDate.getDate();
                const monthName = dayDate.toLocaleDateString('tr-TR', { month: 'short' });
                
                return (
                  <button
                    key={offset}
                    onClick={() => setSelectedDateStr(dayDateStr)}
                    className={`flex flex-col items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-2xl min-w-[70px] sm:min-w-[90px] transition-all whitespace-nowrap flex-1 ${
                      isActive 
                      ? 'bg-purple-600 text-white shadow-neon-purple border border-purple-500/50 scale-[1.02]' 
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-1 opacity-80">{dayNameShort}</span>
                    <span className={`text-xl sm:text-2xl font-black ${isActive ? 'text-white' : 'text-slate-200'}`}>{dayNumber}</span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold opacity-60 mt-0.5">{monthName}</span>
                  </button>
                );
              })}
            </div>

            <button onClick={handleNextWeek} aria-label="Sonraki hafta" className="p-2 sm:p-3 text-slate-400 hover:text-white glass hover:bg-white/10 rounded-xl transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Table List */}
      <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden mb-8 shadow-2xl">
        {/* Table Header */}
        <div className="grid grid-cols-[80px_1fr_120px_100px_40px] sm:grid-cols-[100px_1fr_150px_120px_50px] items-center px-6 py-5 border-b border-white/10 bg-black/40">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SAAT</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SERİ</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:block">BÖLÜM</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-right sm:text-left">DURUM</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center"></span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          <AnimatePresence mode="wait">
            {dailyPrograms.length > 0 ? dailyPrograms.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-[80px_1fr_120px_100px_40px] sm:grid-cols-[100px_1fr_150px_120px_50px] items-center px-6 py-4 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Time */}
                <div className="text-slate-300 font-black text-sm sm:text-base">
                  {item.release_time?.slice(0, 5) || '00:00'}
                </div>

                {/* Series Info */}
                <div className="flex items-center gap-4">
                  <img src={item.poster_url} alt={item.series_name} className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg object-cover border border-white/10 group-hover:scale-105 transition-transform" width={56} height={80} decoding="async" loading={idx < 5 ? 'eager' : 'lazy'} fetchpriority={idx < 3 ? 'high' : 'auto'}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/64x96?text='; }} />
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-sm sm:text-base truncate group-hover:text-purple-400 transition-colors">
                      {item.series_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-amber-400 text-xs font-black">{item.rating || '9.0'}</span>
                    </div>
                    {/* Mobile section for chapter/status info */}
                    <div className="sm:hidden mt-2 flex flex-col gap-1">
                       <span className="text-slate-300 text-xs font-semibold">{item.chapter_info}</span>
                       {item.chapter_info === 'Yeni Seri' && (
                         <span className="px-2 py-0.5 w-fit rounded-md bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase border border-purple-500/30">
                           Yeni Seri
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                {/* Chapter Info (Desktop) */}
                <div className="hidden sm:flex flex-col gap-1">
                  <span className="text-slate-300 text-sm font-semibold">{item.chapter_info}</span>
                  {item.chapter_info === 'Yeni Seri' && (
                    <span className="px-2 py-0.5 w-fit rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                      Yeni Seri 🎉
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="text-right sm:text-left">
                  {item.chapter_info === 'Yeni Seri' ? (
                     <span className="text-emerald-400 text-xs font-bold">Yakında</span>
                  ) : (
                     <span className="text-purple-400 text-xs font-bold">Yayınlanacak</span>
                  )}
                </div>

                {/* Notification Bell */}
                <div className="flex justify-center">
                  <button aria-label={`${item.series_name} için bildirim aç`} className="text-slate-500 hover:text-white hover:scale-110 transition-all">
                    <Bell size={18} />
                  </button>
                </div>
              </motion.div>
            )) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <Bell size={40} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Bu gün için yayın yok</h3>
                <p className="text-slate-500 text-sm">Diğer günleri kontrol edebilirsin.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notification CTA Bottom */}
      <div className="glass border border-purple-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0">
            <BellRing size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Bildirimleri aç, yeni bölümleri kaçırma!</h3>
            <p className="text-slate-400 text-xs mt-1">Yeni bölümler yayınlandığında anında haberdar olmak için bildirimleri açabilirsin.</p>
          </div>
        </div>
        <button className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm shadow-neon-purple hover:bg-purple-500 transition-colors whitespace-nowrap">
          Bildirimleri Aç
        </button>
      </div>

    </main>
  );
}
