import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Eye, BookOpen, Clock, CheckCircle, Crown, Play, Filter, Flame, Sparkles } from 'lucide-react';
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
  const { getChapters } = useApp();
  const chapterCount = getChapters(item.id).length;

  // 5'li yıldız sistemi hesaplama (item.rating 10 üzerindense 2'ye bölüyoruz)
  const displayRating = item.rating > 5 ? (item.rating / 2) : item.rating;

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
                  {[...Array(5)].map((_, i) => {
                    const starVal = i + 1;
                    const isFull = displayRating >= starVal;
                    const isHalf = !isFull && displayRating > (starVal - 1);
                    return (
                      <div key={i} className="relative">
                        <Star size={10} className="text-slate-600" />
                        {isFull && <Star size={10} className="absolute inset-0 text-amber-400 fill-amber-400" />}
                        {isHalf && (
                          <div className="absolute inset-0 overflow-hidden w-[50%]">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-white font-black text-xs">{displayRating.toFixed(1)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                    <BookOpen size={10} className="text-purple-400" />
                  </div>
                  <span className="truncate">{chapterCount} Bölüm</span>
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

  const filtered = series
    .filter(s => !s.is_deleted)
    .filter((m) => {
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const mGenres = Array.isArray(m.genre) ? m.genre : m.genre ? [m.genre] : m.tags || [];
      const matchGenre  = activeGenre === 'Tümü' || mGenres.includes(activeGenre);
      return matchSearch && matchGenre;
    })
    .sort((a, b) => (b.reads_num || 0) - (a.reads_num || 0));

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-blue-500" />
            <span className="text-xs font-bold text-purple-400 uppercase tracking-[0.2em]">AniPeak Kütüphanesi</span>
          </div>
          <h1 className="text-4xl font-black text-white">Tüm Seriler</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Seri ara amk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-purple-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Genres Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {allGenres.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGenre(g)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border whitespace-nowrap ${
              activeGenre === g
                ? 'bg-purple-600 border-purple-500 text-white shadow-neon-purple'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => (
            <ManhwaCard key={item?.id} item={item} index={Math.min(i, 20)} />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-32">
          <Flame size={48} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Aradığın seri siber boşlukta yok amk.</h3>
          <p className="text-slate-500">Farklı bir şeyler aramayı dene.</p>
        </div>
      )}
    </main>
  );
}
