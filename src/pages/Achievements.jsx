import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Lock, Info, Sparkles, Book, Zap, Users, Shield, Ghost, 
  ChevronRight, ChevronLeft, Search, Star, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { syncAllAchievements } from '../lib/achievementService';
import { useSEO } from '../hooks/useSEO';

const CATEGORY_ICONS = {
  'Okuma': <Book size={20} />,
  'İstikrar': <Zap size={20} />,
  'Tür': <Search size={20} />,
  'Sosyal': <Users size={20} />,
  'Rütbe': <Shield size={20} />,
  'Efsanevi': <Ghost size={20} />
};

function HorizontalAchievementRow({ title, items, userAchievements }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -600, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 600, behavior: 'smooth' });

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-16 relative group/row">
      <div className="flex items-end gap-3 px-4 sm:px-12 mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          {CATEGORY_ICONS[title] || <Target size={24} />} {title}
        </h2>
        <span className="text-sm font-bold text-slate-500 mb-1">{items.length} Başarım</span>
      </div>

      <button onClick={scrollLeft} className="absolute left-0 top-16 bottom-0 w-12 z-20 bg-gradient-to-r from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400">
        <ChevronLeft size={40} className="drop-shadow-lg" />
      </button>

      <button onClick={scrollRight} className="absolute right-0 top-16 bottom-0 w-12 z-20 bg-gradient-to-l from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400">
        <ChevronRight size={40} className="drop-shadow-lg" />
      </button>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-4 sm:px-12 pb-8">
        {items.map((ach, idx) => {
          const isUnlocked = userAchievements.some(ua => ua.achievement_id === ach.id);
          const unlockData = userAchievements.find(ua => ua.achievement_id === ach.id);

          return (
            <div key={ach.id} className={`snap-start flex-shrink-0 w-[280px] sm:w-[320px] relative h-[220px] rounded-3xl p-6 transition-transform hover:scale-105 group overflow-hidden border ${isUnlocked ? 'border-purple-500/30' : 'border-white/5 opacity-60 hover:opacity-100'}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${isUnlocked ? 'from-purple-900/40 to-[#070511]' : 'from-slate-900/40 to-[#070511]'} opacity-50 group-hover:opacity-80 transition-opacity`} />
              
              {/* Unlock Glow */}
              {isUnlocked && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />}

              <div className="absolute top-4 right-4 z-10">
                {isUnlocked ? (
                  <div className="bg-purple-500/20 p-2 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                    <Sparkles size={14} className="text-purple-400" />
                  </div>
                ) : (
                  <div className="bg-black/40 p-2 rounded-full border border-white/10">
                    <Lock size={14} className="text-slate-500" />
                  </div>
                )}
              </div>

              <div className="relative z-20 h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-2xl transition-all duration-500 ${isUnlocked ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] rotate-0' : 'bg-white/5 text-slate-400 rotate-12'}`}>
                    {ach.category === 'Efsanevi' ? <Star size={24} /> : CATEGORY_ICONS[ach.category] || <Award size={24} />}
                  </div>
                  <div>
                    <h3 className={`font-black text-lg uppercase leading-tight ${isUnlocked ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-slate-300'}`}>
                      {isUnlocked || !ach.is_secret ? ach.name : 'GİZLİ BAŞARIM'}
                    </h3>
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-auto line-clamp-3">
                  {isUnlocked || !ach.is_secret ? ach.description : 'Bu başarımı kazanana kadar gereksinimleri göremezsin uşağım!'}
                </p>

                {isUnlocked && unlockData ? (
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10}/> Açıldı</span>
                    <span className="text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-1 rounded">
                      {new Date(unlockData.unlocked_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-4 group-hover:border-white/20 transition-colors">
                    <Info size={12} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Görev: {ach.requirement_value} Puan
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Achievements() {
  const { user } = useAuth();

  useSEO({
    title: 'Başarımlar',
    description: 'AniPeak başarım sistemi. Rozetler kazanın ve profilinizde sergileyin.',
    url: 'https://anipeak.com.tr/achievements'
  });

  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Hepsi');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        if (user) await syncAllAchievements(user.id);
        const { data: achData } = await supabase.from('achievements').select('*');
        setAchievements(achData || []);
        if (user) {
          const { data: userAchData } = await supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id);
          setUserAchievements(userAchData || []);
        }
      } catch (err) {
        console.error('Başarımlar yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const stats = useMemo(() => {
    return {
      total: achievements.length,
      unlocked: userAchievements.length,
      percent: achievements.length > 0 ? Math.floor((userAchievements.length / achievements.length) * 100) : 0
    };
  }, [achievements, userAchievements]);

  const uniqueCategories = useMemo(() => [...new Set(achievements.map(a => a.category))], [achievements]);
  const categoriesToDisplay = selectedCategory === 'Hepsi' ? uniqueCategories : [selectedCategory];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070511] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070511] pb-20 relative overflow-x-hidden">
      {/* ── CINEMATIC HERO HEADER ── */}
      <div className="relative w-full h-[60vh] min-h-[500px] overflow-hidden flex items-end mb-12">
        <div className="absolute inset-0 bg-[url('/yayinarkaplan.jpg')] bg-cover bg-center opacity-30 mix-blend-screen scale-105 transition-all duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/70 to-transparent" />
        <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070511] to-transparent z-10" />
        
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-12 pt-28 pb-12 flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8">
           <div className="text-center lg:text-left flex-1">
             <div className="flex items-center gap-2 justify-center lg:justify-start mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/20 mx-auto lg:mx-0">
               <Award size={14} className="text-purple-400" />
               <span className="text-xs font-bold text-white tracking-widest uppercase">Sistem Mührü</span>
             </div>
             <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-2xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
               KOZMİK <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">MÜHÜRLER</span>
             </h1>
             <p className="text-slate-300 text-lg max-w-xl font-medium drop-shadow-md mx-auto lg:mx-0">
               Başarımlarını sergile, rütbeni yükselt ve sistemin zirvesine ulaş. Açılan her mühür, profilinde bir efsane olarak parlayacak.
             </p>
           </div>

           {/* Completion Stats */}
           <div className="flex-shrink-0 flex items-center gap-6 bg-[#141414]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)]">
             <div className="text-right">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mühürler</p>
               <p className="text-3xl font-black text-white">{stats.unlocked} <span className="text-slate-400 text-lg">/ {stats.total}</span></p>
             </div>
             <div className="w-px h-12 bg-white/10" />
             <div className="relative">
               <svg className="w-20 h-20 transform -rotate-90">
                 <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                 <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * stats.percent) / 100} className="text-purple-500 transition-all duration-1000" />
               </svg>
               <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{stats.percent}%</span>
             </div>
           </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-30 -mt-10">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 px-4 sm:px-12">
          <div className="flex-1 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['Hepsi', ...uniqueCategories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap border ${
                  selectedCategory === cat ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-[#141414] border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative flex-shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="MÜHÜR ARA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-[#141414] border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-purple-500/50 w-full sm:w-64 transition-all"
            />
          </div>
        </div>

        {/* Categories Netflix Rows */}
        {categoriesToDisplay.map(cat => {
          const catItems = achievements.filter(a => a.category === cat && (searchTerm === '' || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()))).sort((a, b) => {
            const aUnlocked = userAchievements.some(ua => ua.achievement_id === a.id);
            const bUnlocked = userAchievements.some(ua => ua.achievement_id === b.id);
            if (aUnlocked === bUnlocked) return 0;
            return aUnlocked ? -1 : 1;
          });
          
          if (catItems.length === 0) return null;
          
          return (
            <HorizontalAchievementRow key={cat} title={cat} items={catItems} userAchievements={userAchievements} />
          );
        })}

        {categoriesToDisplay.every(cat => achievements.filter(a => a.category === cat && (searchTerm === '' || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0) && (
          <div className="py-20 text-center">
             <Ghost className="w-16 h-16 text-slate-600 mx-auto mb-4" />
             <p className="text-slate-500 font-bold uppercase tracking-widest">Hiçbir Mühür Bulunamadı...</p>
          </div>
        )}

      </div>
    </div>
  );
}
