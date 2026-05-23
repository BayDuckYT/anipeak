import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass, Zap, Ghost, Eye, Terminal } from 'lucide-react';

/**
 * Nebula Background Effect
 */
export const NebulaBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-[#050510]" />
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 90, 0],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(138,43,226,0.15)_0%,_transparent_50%)]"
    />
    <motion.div
      animate={{
        scale: [1.2, 1, 1.2],
        rotate: [0, -90, 0],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(0,255,255,0.1)_0%,_transparent_50%)]"
    />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
  </div>
);

/**
 * Soul DNA Schema Component
 */
export const SoulDNA = ({ profile }) => {
  const segments = 12;
  const radius = 60;
  
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" />
      <svg className="w-full h-full transform -rotate-90">
        {[...Array(segments)].map((_, i) => {
          const angle = (i / segments) * Math.PI * 2;
          const x2 = 80 + radius * Math.cos(angle);
          const y2 = 80 + radius * Math.sin(angle);
          return (
            <motion.line
              key={i}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 1 }}
              x1="80" y1="80" x2={x2} y2={y2}
              stroke="currentColor"
              className="text-cyan-400/30"
              strokeWidth="2"
            />
          );
        })}
        <circle cx="80" cy="80" r="40" className="fill-none stroke-purple-500/50" strokeWidth="1" strokeDasharray="4 4" />
        <motion.circle
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "80px 80px" }}
          cx="80" cy="80" r="35"
          className="fill-none stroke-cyan-400"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Sparkles className="text-cyan-400 w-6 h-6 mb-1" />
        <span className="text-[10px] text-cyan-400/70 font-mono tracking-tighter">DNA-VERIFIED</span>
      </div>
    </div>
  );
};

/**
 * Oracle Recommendation Card
 */
export const OracleCard = ({ manga, matchScore, prophecy, idx = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative group overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1a3a]/80 to-[#0d0d1a]/95 border border-purple-500/20 backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Match Score Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-2">
          <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
          <span className="text-xs font-bold text-cyan-400 font-mono">%{matchScore} MATCH</span>
        </div>
      </div>

      <div className="relative aspect-[2/3] overflow-hidden">
        <img 
          src={manga.cover} 
          alt={manga.title}
          width={400}
          height={600}
          loading={idx < 3 ? 'eager' : 'lazy'}
          fetchpriority={idx < 3 ? 'high' : 'auto'}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-transparent to-transparent opacity-60" />
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
          {manga.title}
        </h3>
        <p className="text-xs text-purple-300/70 italic line-clamp-3 mb-4 font-serif">
          "{prophecy}"
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div className="flex gap-2">
            {manga.genres?.slice(0, 2).map(genre => (
              <span key={genre} className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-700/30 uppercase tracking-widest font-mono">
                {genre}
              </span>
            ))}
          </div>
          <button aria-label={`${manga.title} Serisini İncele`} className="text-cyan-400 hover:text-white transition-colors">
            <Eye className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Soul Profile Metric Component
 */
export const MetricBox = ({ icon: Icon, label, value, subtext, color = "cyan" }) => (
  <div className={`p-4 rounded-xl bg-[#16162a]/60 border border-${color}-500/20 backdrop-blur-md`}>
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg bg-${color}-500/10`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <span className="text-xs font-mono uppercase tracking-widest text-gray-400">{label}</span>
    </div>
    <div className="flex flex-col">
      <span className={`text-2xl font-bold text-${color}-400`}>{value}</span>
      <span className="text-[10px] text-gray-500 font-mono">{subtext}</span>
    </div>
  </div>
);
