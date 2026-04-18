import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Eye, BookOpen, Clock, CheckCircle, Crown, Play, Filter, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const statusColors = {
  'Devam Ediyor': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'Tamamlandı':   'text-blue-400 bg-blue-400/10 border-blue-400/30',
};

const statusIcons = {
  'Devam Ediyor': <Clock size={10} />,
  'Tamamlandı':   <CheckCircle size={10} />,
};

function ManhwaCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative h-full"
    >
      <Link to={`/manhwa/${item.id}`} className="block h-full">
        <div className="relative h-full rounded-2xl overflow-hidden glass border border-white/8 transition-all duration-300 group-hover:border-purple-500/40 hover:shadow-[0_20px_60px_rgba(168,85,247,0.25)] flex flex-col">
          {/* Cover */}
          <div className="relative aspect-[3/4] overflow-hidden shrink-0">
            <img 
              src={item?.cover} 
              alt={item?.title} 
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=Resim+Yok'; }} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              loading="lazy" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent" />

            <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
              {index < 3 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/90 text-black text-[10px] font-bold">
                  <Crown size={10} /> #{index + 1} TREND
                </span>
              )}
              <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${statusColors[item.status]}`}>
                {statusIcons[item.status]} {item.status}
              </span>
            </div>

            {/* Rating & Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/40 to-transparent">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={10} 
                      className={i < Math.floor(item.rating / 2) ? "text-amber-400 fill-amber-400" : "text-slate-600"} 
                    />
                  ))}
                </div>
                <span className="text-white font-black text-xs">{item.rating}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                    <BookOpen size={10} className="text-purple-400" />
                  </div>
                  <span className="truncate">{item.chapter_count || 0} Bölüm</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                    <Eye size={10} className="text-blue-400" />
                  </div>
                  <span className="truncate">{(item.reads_num || 0).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
              <div className="w-14 h-14 rounded-full bg-purple-600/90 flex items-center justify-center shadow-neon-purple scale-90 group-hover:scale-100 transition-transform duration-300">
                <Play size={22} className="text-white ml-1" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-[#0a0a0c] flex-1">
            <h3 className="font-bold text-white text-sm leading-tight mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
              {item.title}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-[10px] font-medium truncate max-w-[70%]">{item.author || 'Anonim'}</p>
              <div className="flex gap-1">
                {(Array.isArray(item.genre) ? item.genre : [item.genre]).slice(0, 1).map((g) => (
                  <span key={g} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase tracking-tighter border border-purple-500/20">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AllSeries() {
  const { series } = useApp();
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('Tümü');

  const allGenres = ['Tümü', ...new Set(series.filter(s => !s.is_deleted).flatMap(m => {
    const docGenres = Array.isArray(m.genre) ? m.genre : m.genre ? [m.genre] : m.tags || [];
    return docGenres;
  }))];

  const filteredData = series.filter(m => {
    if (m.is_deleted) return false;
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || (m.author && m.author.toLowerCase().includes(search.toLowerCase()));
    const docGenres = Array.isArray(m.genre) ? m.genre : m.genre ? [m.genre] : m.tags || [];
    const matchesGenre = activeGenre === 'Tümü' || docGenres.includes(activeGenre);
    return matchesSearch && matchesGenre;
  });

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass border border-white/10 p-8 sm:p-12 mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/30 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4">
                <Flame size={14} className="text-purple-400" />
                <span className="text-xs font-bold text-purple-300 tracking-wider uppercase">Evrensel Arşiv</span>
             </motion.div>
             <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3">
               Tüm <span className="gradient-text">Seriler</span>
             </motion.h1>
             <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 max-w-lg">
                AniPeak'in devasa kozmik kütüphanesini keşfedin. Aksiyondan romantizme, binlerce efsanevi eser sizi bekliyor.
             </motion.p>
           </div>
           
           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="w-full md:w-80 space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Seri veya yazar ara..." 
                  className="w-full bg-[#0a0a14]/60 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-md"
                />
              </div>
           </motion.div>
        </div>
      </div>

      {/* Filter Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-bold shrink-0">
           <Filter size={16} /> Kategoriler
        </div>
        <div className="w-px h-6 bg-white/10 mx-2 shrink-0" />
        {allGenres.map(g => (
          <button 
            key={g} 
            onClick={() => setActiveGenre(g)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all ${activeGenre === g ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-500' : 'glass border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredData?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          <AnimatePresence>
            {filteredData?.map((item, i) => (
              <ManhwaCard key={item?.id} item={item} index={Math.min(i, 20)} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-20 text-center glass border border-white/10 rounded-3xl">
           <Search size={48} className="mx-auto text-slate-600 mb-4" />
           <h3 className="text-xl font-bold text-white mb-2">Eser Bulunamadı</h3>
           <p className="text-slate-500">Aradığınız kriterlere uygun bir seri kozmik kütüphanemizde bulunmuyor.</p>
           <button onClick={() => {setSearch(''); setActiveGenre('Tümü');}} className="mt-6 px-6 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 font-bold hover:bg-purple-500/20 transition-colors">Filtreleri Temizle</button>
        </div>
      )}
    </main>
  );
}
