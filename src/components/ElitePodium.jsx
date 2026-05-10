import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Star, Eye } from 'lucide-react';
import { getOptimizedImage } from '../utils/imageOpt.js';

export default function ElitePodium({ items }) {
  if (!items || items.length === 0) return null;

  const top3 = items.slice(0, 3);
  const rest = items.slice(3, 10);

  // 1. (index 0) Ortada
  // 2. (index 1) Sağda
  // 3. (index 2) Solda
  // Podium positions map
  const podiumOrder = [
    top3[1], // 2nd Place (Left) -> Wait, user asked 2. Numara sağ, 3. Numara sol.
    // So visual order (Left to Right): [3rd, 1st, 2nd]
    top3[2], 
    top3[0], 
    top3[1]
  ].filter(Boolean); // Filter out undefined if less than 3 items

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1, 
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' }
    })
  };

  return (
    <div className="w-full">
      {/* 3D Podium Container */}
      <div className="relative flex justify-center items-end h-[350px] sm:h-[400px] mb-12 gap-2 sm:gap-6 px-2">
        {top3[2] && (
          <motion.div 
            custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}
            className="w-1/3 max-w-[140px] flex flex-col items-center relative z-10"
          >
            <div className="w-full aspect-[2/3] mb-4 relative group">
              <div className="absolute -inset-1 bg-gradient-to-t from-orange-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-lg rounded-xl" />
              <Link to={`/manhwa/${top3[2].id}`} className="block w-full h-full relative rounded-xl overflow-hidden border-2 border-orange-700/50 shadow-[0_10px_30px_rgba(194,65,12,0.3)] transform transition-transform hover:-translate-y-2">
                <img 
                  src={getOptimizedImage(top3[2].cover, 300)} 
                  alt={top3[2].title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  style={{ aspectRatio: '2/3' }}
                />
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-orange-600 border-2 border-[#050507] flex items-center justify-center text-[10px] font-black text-white shadow-lg">3</div>
              </Link>
            </div>
            {/* 3D Base */}
            <div className="w-[110%] h-16 bg-gradient-to-b from-zinc-800 to-zinc-950 border-t-2 border-orange-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative transform perspective-[1000px] rotateX-12 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-white uppercase truncate w-full text-center px-2">{top3[2].title}</span>
              <div className="flex gap-2 text-[9px] text-slate-400 mt-1 font-bold">
                <span className="flex items-center gap-1"><Star size={10} className="text-amber-400"/> {top3[2].rating}</span>
                <span className="flex items-center gap-1"><Eye size={10}/> {top3[2].reads_num || 0}</span>
              </div>
            </div>
          </motion.div>
        )}

        {top3[0] && (
          <motion.div 
            custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}
            className="w-2/5 max-w-[180px] flex flex-col items-center relative z-30 -mb-4"
          >
            <div className="w-full aspect-[2/3] mb-4 relative group">
              <div className="absolute -inset-2 bg-gradient-to-t from-yellow-400/60 to-transparent opacity-50 group-hover:opacity-100 transition-opacity blur-xl rounded-xl animate-pulse" />
              <Link to={`/manhwa/${top3[0].id}`} className="block w-full h-full relative rounded-xl overflow-hidden border-2 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.4)] transform transition-transform hover:-translate-y-3">
                <img 
                  src={getOptimizedImage(top3[0].cover, 400)} 
                  alt={top3[0].title} 
                  className="w-full h-full object-cover"
                  fetchpriority="high"
                  decoding="async"
                  style={{ aspectRatio: '2/3' }}
                />
                <div className="absolute -top-3 -right-3">
                  <Trophy size={32} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                </div>
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-yellow-500 border-2 border-[#050507] flex items-center justify-center text-xs font-black text-[#050507] shadow-lg">1</div>
              </Link>
            </div>
            {/* 3D Base */}
            <div className="w-[115%] h-24 bg-gradient-to-b from-zinc-800 to-black border-t-2 border-yellow-400 shadow-[0_30px_60px_rgba(0,0,0,0.9)] relative transform perspective-[1000px] rotateX-12 flex flex-col items-center justify-center px-2">
               <span className="text-xs font-black text-white uppercase truncate w-full text-center">{top3[0].title}</span>
               <div className="flex gap-3 text-[10px] text-slate-300 mt-2 font-bold bg-white/5 px-3 py-1 rounded-full">
                <span className="flex items-center gap-1"><Star size={12} className="text-amber-400"/> {top3[0].rating}</span>
                <span className="flex items-center gap-1"><Eye size={12} className="text-blue-400"/> {top3[0].reads_num || 0}</span>
              </div>
            </div>
          </motion.div>
        )}

        {top3[1] && (
          <motion.div 
            custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}
            className="w-1/3 max-w-[140px] flex flex-col items-center relative z-20"
          >
            <div className="w-full aspect-[2/3] mb-4 relative group">
              <div className="absolute -inset-1 bg-gradient-to-t from-slate-300/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-lg rounded-xl" />
              <Link to={`/manhwa/${top3[1].id}`} className="block w-full h-full relative rounded-xl overflow-hidden border-2 border-slate-300/50 shadow-[0_10px_30px_rgba(203,213,225,0.3)] transform transition-transform hover:-translate-y-2">
                <img 
                  src={getOptimizedImage(top3[1].cover, 300)} 
                  alt={top3[1].title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  style={{ aspectRatio: '2/3' }}
                />
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-300 border-2 border-[#050507] flex items-center justify-center text-[10px] font-black text-[#050507] shadow-lg">2</div>
              </Link>
            </div>
            {/* 3D Base */}
            <div className="w-[110%] h-20 bg-gradient-to-b from-zinc-800 to-zinc-950 border-t-2 border-slate-300/50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative transform perspective-[1000px] rotateX-12 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-white uppercase truncate w-full text-center px-2">{top3[1].title}</span>
              <div className="flex gap-2 text-[9px] text-slate-400 mt-1 font-bold">
                <span className="flex items-center gap-1"><Star size={10} className="text-amber-400"/> {top3[1].rating}</span>
                <span className="flex items-center gap-1"><Eye size={10}/> {top3[1].reads_num || 0}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Rest of the list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
        {rest.map((item, idx) => (
          <Link key={item.id} to={`/manhwa/${item.id}`} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800 transition-colors group">
             <div className="w-8 text-center text-sm font-black text-slate-500 group-hover:text-white transition-colors">{idx + 4}</div>
             <div className="w-10 h-14 rounded-md overflow-hidden bg-zinc-950 flex-shrink-0">
               <img src={getOptimizedImage(item.cover, 100)} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" style={{ aspectRatio: '2/3' }} loading="lazy" decoding="async" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
               <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                 <span className="flex items-center gap-1"><Star size={10} className="text-amber-400"/> {item.rating}</span>
                 <span className="flex items-center gap-1"><Eye size={10}/> {item.reads_num || 0}</span>
               </div>
             </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
