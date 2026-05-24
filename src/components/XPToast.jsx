import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronUp } from 'lucide-react';

export default function XPToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleXPGain = (e) => {
      const { amount, newXP, newRank, levelUp } = e.detail;
      
      const newToast = {
        id: Date.now() + Math.random(),
        amount,
        newXP,
        newRank,
        levelUp
      };

      // Play sound
      try {
        const audio = new Audio('/sounds/xp-gain.mp3'); // We'll add this later or it will fail silently
        audio.volume = 0.4;
        audio.play().catch(() => {}); // ignore autoplay errors
      } catch (err) {}

      setToasts(prev => [...prev, newToast]);

      // Remove after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 3000);
    };

    window.addEventListener('xp-gained', handleXPGain);
    return () => window.removeEventListener('xp-gained', handleXPGain);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className={`relative overflow-hidden rounded-lg border ${
              toast.levelUp 
              ? 'bg-gradient-to-r from-blue-900/90 to-cyan-900/90 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]' 
              : 'bg-black/80 border-slate-700 shadow-lg'
            } backdrop-blur-md p-4 min-w-[280px] flex items-center gap-4`}
          >
            {/* Solo Leveling Style Scanline / Glitch Effect (CSS defined in index.css) */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>

            <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${
              toast.levelUp ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {toast.levelUp ? <ChevronUp size={24} className="animate-pulse" /> : <Zap size={20} />}
            </div>

            <div className="flex-1">
              {toast.levelUp ? (
                <>
                  <h4 className="text-cyan-400 font-black text-sm uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                    Sistem Mesajı
                  </h4>
                  <p className="text-white text-xs font-medium">
                    Seviye Atladın! <span className="font-black text-cyan-300">{toast.newRank}</span>
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                    Tecrübe Puanı
                  </h4>
                  <p className="text-white text-sm font-black flex items-baseline gap-1">
                    <span className="text-amber-400">+{toast.amount} XP</span> 
                    <span className="text-slate-500 text-[10px] font-normal ml-1">Kazanıldı</span>
                  </p>
                </>
              )}
            </div>
            
            {/* Animated Glow Line at the bottom */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.8, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-0.5 ${toast.levelUp ? 'bg-cyan-400' : 'bg-amber-400'}`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
