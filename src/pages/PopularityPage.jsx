import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Star, Eye, Flame, Crown } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getOptimizedImage, handleImageError } from '../utils/imageOpt.js';
import ElitePodium from '../components/ElitePodium.jsx';
import { useSEO } from '../hooks/useSEO';

export default function PopularityPage() {
  const { sortedSeries } = useApp();

  useSEO({
    title: 'Popüler Seriler',
    description: 'AniPeak üzerindeki en popüler manhwa ve webtoon serileri.',
    url: 'https://anipeak.com.tr/popular'
  });

  // Sıralama Mantığı: Puanı yüksek olanlar, puanı eşitse okunma sayısı yüksek olanlar
  const popularSeries = useMemo(() => {
    return [...sortedSeries].filter(s => !s.is_deleted).sort((a, b) => {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (b.reads_num || 0) - (a.reads_num || 0);
    }).slice(0, 100); // Top 100
  }, [sortedSeries]);

  const top10 = popularSeries.slice(0, 10);
  const remaining = popularSeries.slice(10);

  return (
    <main className="min-h-screen bg-[#070511] pt-24 pb-20 relative overflow-hidden">
      {/* Kozmik Arkaplan Efekti */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-yellow-900/20 via-orange-900/5 to-transparent pointer-events-none" />
      <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <header className="text-center mb-16">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black text-xs uppercase tracking-widest mb-4">
            <Trophy size={14} /> MyAnimeList Verileriyle
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight mb-4">
            KÜRESEL <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">POPÜLERLİK</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 max-w-2xl mx-auto font-medium">
            Platformdaki en yüksek puanlı ve en çok okunan başyapıtlar.
          </motion.p>
        </header>

        {/* Top 10 Podyum Alanı */}
        {top10.length > 0 && (
          <section className="mb-20">
            <h2 className="text-2xl font-black text-white text-center uppercase tracking-widest mb-10 flex items-center justify-center gap-3">
              <Crown className="text-yellow-400" size={28} /> ŞAMPİYONLAR LİGİ
            </h2>
            <ElitePodium items={top10} />
          </section>
        )}

        {/* Kalan Liste (11-100) */}
        {remaining.length > 0 && (
          <section>
             <h2 className="text-xl font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
              <Flame className="text-orange-500" size={20} /> Diğer Popüler Eserler
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {remaining.map((item, idx) => (
                <Link key={item.id} to={`/manhwa/${item.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-yellow-500/30 transition-all group">
                  <div className="w-10 text-center text-xl font-black text-slate-400 group-hover:text-yellow-400 transition-colors">
                    {idx + 11}
                  </div>
                  <div className="w-16 h-24 rounded-lg overflow-hidden bg-card-navy flex-shrink-0 shadow-lg">
                    <img 
                      src={getOptimizedImage(item.cover, 100)} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      loading="lazy" 
                      decoding="async"
                      width={64}
                      height={96}
                      onError={handleImageError} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white mb-2 truncate group-hover:text-yellow-400 transition-colors">{item.title}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-white/10">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-amber-400 font-bold text-xs">{item.rating}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-white/10">
                        <Eye size={12} className="text-blue-400" />
                        <span className="text-slate-300 font-medium text-xs">{item.reads_num || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
