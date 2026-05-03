import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Clock, Star, Tv, ChevronRight, History, Zap, Shield, Sparkles } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Pazartesi', short: 'PZT' },
  { id: 2, name: 'Salı', short: 'SAL' },
  { id: 3, name: 'Çarşamba', short: 'ÇAR' },
  { id: 4, name: 'Perşembe', short: 'PER' },
  { id: 5, name: 'Cuma', short: 'CUM' },
  { id: 6, name: 'Cumartesi', short: 'CMT' },
  { id: 0, name: 'Pazar', short: 'PAZ' }
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [loading, setLoading] = useState(true);

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
    return schedule.filter(item => item.release_day === selectedDay);
  }, [schedule, selectedDay]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Zap className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={30} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Cyber Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-[500px] bg-[linear-gradient(to_top,#050507,transparent)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/30 mb-6"
          >
            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">AniPeak Global Yayın Ağı</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter"
          >
            YAYIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-500">PROGRAMI</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 font-medium max-w-2xl mx-auto text-lg leading-relaxed"
          >
            Mühürlenmiş serilerin haftalık yayın takvimi. Cyber-Shield korumasıyla her bölüm tam vaktinde sistemimizde yerini alır.
          </motion.p>
        </div>

        {/* Futuristic Day Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {DAYS.map((day, idx) => {
            const isActive = selectedDay === day.id;
            const dayCount = schedule.filter(s => s.release_day === day.id).length;

            return (
              <motion.button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative px-8 py-5 rounded-3xl border transition-all duration-500 group overflow-hidden ${
                  isActive 
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-600 border-indigo-400/50 shadow-[0_20px_50px_rgba(79,70,229,0.3)] scale-110' 
                  : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeGlow"
                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" 
                  />
                )}
                <span className={`block text-lg font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-white transition-colors'}`}>
                  {day.name}
                </span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-100' : 'text-zinc-600'}`}>
                    {dayCount} İçerik
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="wait">
            {dailyPrograms.length > 0 ? dailyPrograms.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative h-[450px] rounded-[2.5rem] overflow-hidden glass-strong border border-white/5 hover:border-indigo-500/30 transition-all duration-500"
              >
                {/* Poster Background */}
                <img 
                  src={item.poster_url || '/placeholder.png'} 
                  className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent" />
                
                {/* Floating Time Badge */}
                <div className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-indigo-600/90 backdrop-blur-md border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white" />
                    <span className="text-sm font-black text-white">{item.release_time.slice(0, 5)}</span>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-6 right-6 px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-black text-white">{item.rating || '0.0'}</span>
                  </div>
                </div>

                {/* Content Info */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                      {item.category}
                    </span>
                    {item.is_new_series ? (
                      <span className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/30 animate-pulse">
                        YENİ SERİ
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                        YENİ BÖLÜM
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                    {item.series_name}
                  </h3>
                  <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-6">
                    {item.chapter_info}
                  </p>

                  {!item.is_new_series && (
                    <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] group-hover:bg-indigo-600 group-hover:border-indigo-400 transition-all duration-300 flex items-center justify-center gap-2">
                      SERİYİ İNCELE <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 flex flex-col items-center justify-center glass border border-dashed border-white/10 rounded-[3rem]"
              >
                <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-8 border border-white/5">
                  <History size={40} className="text-zinc-700 opacity-50" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Kozmik Boşluk</h3>
                <p className="text-zinc-500 font-medium text-center max-w-sm px-6">
                  Bu gün için henüz bir yayın mühürlenmemiş. Diğer günleri kontrol edebilir veya admin onayını bekleyebilirsin.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats / Info Footer */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, label: 'Gecikme', value: '< 2ms', color: 'text-indigo-400' },
            { icon: Shield, label: 'Güvenlik', value: 'Cyber-Shield', color: 'text-emerald-400' },
            { icon: Tv, label: 'Kapasite', value: '99.9% Uptime', color: 'text-blue-400' }
          ].map((stat, i) => (
            <div key={i} className="glass border border-white/5 rounded-3xl p-8 flex items-center gap-6 group hover:border-white/10 transition-all">
              <div className={`p-4 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl font-black text-white uppercase">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
