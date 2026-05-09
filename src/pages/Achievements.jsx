
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Lock, Info, Sparkles, Book, Zap, Users, Shield, Ghost, 
  ChevronRight, Search, Filter, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { syncAllAchievements } from '../lib/achievementService';

const CATEGORY_ICONS = {
  'Okuma': <Book size={20} />,
  'İstikrar': <Zap size={20} />,
  'Tür': <Search size={20} />,
  'Sosyal': <Users size={20} />,
  'Rütbe': <Shield size={20} />,
  'Efsanevi': <Ghost size={20} />
};

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Hepsi');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        if (user) {
          // Geriye dönük tarama yap ve hak edilenleri mühürle
          await syncAllAchievements(user.id);
        }

        const { data: achData } = await supabase.from('achievements').select('*');
        setAchievements(achData || []);

        if (user) {
          const { data: userAchData } = await supabase
            .from('user_achievements')
            .select('achievement_id, unlocked_at')
            .eq('user_id', user.id);
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

  const categories = ['Hepsi', ...new Set(achievements.map(a => a.category))];

  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      const matchesCategory = selectedCategory === 'Hepsi' || a.category === selectedCategory;
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           a.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      const aUnlocked = userAchievements.some(ua => ua.achievement_id === a.id);
      const bUnlocked = userAchievements.some(ua => ua.achievement_id === b.id);
      if (aUnlocked === bUnlocked) return 0;
      return aUnlocked ? -1 : 1;
    });
  }, [achievements, selectedCategory, searchTerm, userAchievements]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-purple-400 font-black tracking-widest text-xs uppercase animate-pulse">Veriler Senkronize Ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Award className="text-purple-500" size={24} />
              </div>
              <span className="text-purple-500 font-black tracking-[0.3em] text-xs uppercase">Sistem Mührü</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white tracking-tighter"
            >
              KOZMİK <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">BAŞARIMLAR</span>
            </motion.h1>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-6 glass border border-white/10 p-6 rounded-3xl"
          >
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tamamlanan</p>
              <p className="text-2xl font-black text-white">{stats.unlocked} <span className="text-slate-600 text-sm">/ {stats.total}</span></p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                <circle 
                  cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * stats.percent) / 100}
                  className="text-purple-500 transition-all duration-1000"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">{stats.percent}%</span>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap border ${
                  selectedCategory === cat 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="BAŞARIM ARA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-500/50 w-full sm:w-64 transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map((ach, idx) => {
            const isUnlocked = userAchievements.some(ua => ua.achievement_id === ach.id);
            const unlockData = userAchievements.find(ua => ua.achievement_id === ach.id);

            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={`group relative p-6 rounded-3xl border transition-all duration-500 ${
                  isUnlocked 
                  ? 'bg-purple-600/5 border-purple-500/30 hover:border-purple-500/60 shadow-lg hover:shadow-purple-500/10' 
                  : 'bg-white/[0.02] border-white/5 grayscale opacity-60 hover:opacity-100'
                }`}
              >
                {/* Status Icon */}
                <div className="absolute top-4 right-4">
                  {isUnlocked ? (
                    <div className="bg-purple-500/20 p-1.5 rounded-full">
                      <Sparkles size={12} className="text-purple-400" />
                    </div>
                  ) : (
                    <Lock size={12} className="text-slate-600" />
                  )}
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-2xl transition-all duration-500 ${
                    isUnlocked 
                    ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] rotate-0 scale-110' 
                    : 'bg-white/5 text-slate-600 rotate-12'
                  }`}>
                    {ach.category === 'Efsanevi' ? <Star size={24} /> : CATEGORY_ICONS[ach.category] || <Award size={24} />}
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isUnlocked ? 'text-purple-400' : 'text-slate-600'}`}>
                      {ach.category}
                    </p>
                    <h3 className="text-white font-black text-sm group-hover:text-purple-400 transition-colors uppercase leading-tight">
                      {isUnlocked || !ach.is_secret ? ach.name : 'GİZLİ BAŞARIM'}
                    </h3>
                  </div>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  {isUnlocked || !ach.is_secret ? ach.description : 'Bu başarımı kazanana kadar gereksinimleri göremezsin uşağım!'}
                </p>

                {isUnlocked && unlockData && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest">Açıldı</span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {new Date(unlockData.unlocked_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
                
                {!isUnlocked && (
                  <div className="flex items-center gap-2 pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors">
                    <Info size={12} className="text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      {ach.requirement_type.replace('_', ' ')}: {ach.requirement_value}
                    </span>
                  </div>
                )}

                {/* Neon Glow Effect on Hover for unlocked */}
                {isUnlocked && (
                  <div className="absolute inset-0 rounded-3xl bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest">Eşleşen başarım bulunamadı uşağım...</p>
          </div>
        )}
      </div>
    </div>
  );
}
