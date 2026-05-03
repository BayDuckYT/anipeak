import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Clock, Star, Tv, ChevronRight, History } from 'lucide-react';

const DAYS = [
  { id: 0, name: 'Pazar', short: 'Paz' },
  { id: 1, name: 'Pazartesi', short: 'Pzt' },
  { id: 2, name: 'Salı', short: 'Sal' },
  { id: 3, name: 'Çarşamba', short: 'Çar' },
  { id: 4, name: 'Perşembe', short: 'Per' },
  { id: 5, name: 'Cuma', short: 'Cum' },
  { id: 6, name: 'Cumartesi', short: 'Cmt' }
];

export default function ScheduleSection() {
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return schedule.filter(item => item.release_day === selectedDay);
  }, [schedule, selectedDay]);

  const upcomingPrograms = useMemo(() => {
    const today = new Date().getDay();
    const now = new Date().toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    return schedule
      .filter(item => {
        if (item.release_day > today) return true;
        if (item.release_day === today && item.release_time > now) return true;
        return false;
      })
      .slice(0, 5);
  }, [schedule]);

  if (loading) return null;

  return (
    <section id="yayin-takvimi" className="py-20 px-4 max-w-7xl mx-auto overflow-hidden">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter"
        >
          YAYIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">TAKVİMİ</span>
        </motion.h2>
        <p className="text-zinc-500 font-medium max-w-lg mx-auto">Haftalık anime ve manga yayın programını anlık takip edin, mühürlenmiş serileri kaçırmayın!</p>
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-16">
        {DAYS.map((day) => {
          const isActive = selectedDay === day.id;
          const dayCount = schedule.filter(s => s.release_day === day.id).length;

          return (
            <motion.button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              whileHover={{ y: -5 }}
              className={`relative p-6 rounded-[2rem] border transition-all duration-500 text-center group overflow-hidden ${
                isActive 
                ? 'bg-gradient-to-br from-indigo-600 to-blue-500 border-indigo-400/50 shadow-2xl shadow-indigo-600/20' 
                : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
              }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
              <span className={`block text-sm font-black uppercase tracking-widest mb-1 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'}`}>
                {day.name}
              </span>
              <span className={`block text-[10px] font-bold opacity-60 mb-3 ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                {dayCount > 0 ? `${dayCount} Seri` : 'Boş'}
              </span>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-black ${
                isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-600'
              }`}>
                {dayCount}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Schedule Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="text-indigo-400" size={20} />
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{DAYS[selectedDay].name} Programı</h3>
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{dailyPrograms.length} İÇERİK YAYINLANACAK</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDay}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid gap-4"
            >
              {dailyPrograms.length > 0 ? dailyPrograms.map((item) => (
                <div key={item.id} className="group relative glass bg-zinc-900/40 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 transition-all flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center min-w-[80px] text-center border-r border-white/5 pr-6">
                    <span className="text-2xl font-black text-white">{item.release_time.slice(0, 5)}</span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">TÜRKİYE</span>
                  </div>

                  <div className="w-16 h-24 rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
                    <img src={item.poster_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-black text-white uppercase tracking-tight truncate group-hover:text-indigo-400 transition-colors">{item.series_name}</h4>
                    </div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{item.chapter_info}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <Star size={12} fill="currentColor" />
                        <span className="text-[10px] font-black">{item.rating || '0.0'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-400">
                        <Tv size={12} />
                        <span className="text-[10px] font-black uppercase">{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <button className="p-3 rounded-2xl bg-white/5 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              )) : (
                <div className="py-20 text-center glass border border-dashed border-white/10 rounded-[2.5rem]">
                  <History size={48} className="text-zinc-800 mx-auto mb-4 opacity-20" />
                  <p className="text-zinc-500 text-sm italic font-medium">Bu gün için henüz bir yayın mühürlenmemiş.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar: Upcoming */}
        <div className="lg:col-span-4">
          <div className="glass bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-3 mb-8">
              <Clock className="text-indigo-400" size={20} />
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Gelecek Yayınlar</h3>
            </div>

            <div className="space-y-4">
              {upcomingPrograms.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                  <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.poster_url || '/placeholder.png'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{item.series_name}</h5>
                    <p className="text-[9px] font-bold text-zinc-500 mt-1">{item.release_time.slice(0, 5)}</p>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase">
                    {DAYS[item.release_day].short}
                  </div>
                </div>
              ))}
              {upcomingPrograms.length === 0 && (
                <p className="text-[10px] text-zinc-600 text-center italic font-bold uppercase tracking-widest py-4">Sırada yayın yok</p>
              )}
            </div>

            <button className="w-full mt-8 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
              TÜM TAKVİMİ GÖR
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
