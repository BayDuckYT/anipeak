import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function Loader({ text = "Sayfa Yükleniyor...", fullScreen = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-10 relative gpu-accelerated">
      {/* Cyber Radar Container */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer Radar Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-purple-500/20 rounded-full"
        />

        {/* Fast Inner Radar Sweep */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-l-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          style={{ maskImage: 'conic-gradient(from 0deg, black, transparent 60%)' }}
        />

        {/* Pulsing Core Zap */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
            filter: [
              "drop-shadow(0 0 10px rgba(168,85,247,0.4))",
              "drop-shadow(0 0 25px rgba(168,85,247,0.8))",
              "drop-shadow(0 0 10px rgba(168,85,247,0.4))"
            ]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-purple-400 relative z-10"
        >
          <Zap size={48} fill="currentColor" strokeWidth={1} />
        </motion.div>

        {/* Scanning Line Effect */}
        <motion.div 
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent rounded-full"
        />
      </div>

      {/* Text & Status */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-white font-black text-xs uppercase tracking-[0.6em] text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {text}
          </span>
          <div className="flex gap-2">
             {[0, 1, 2].map(i => (
               <motion.div 
                 key={i}
                 animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                 className="w-1 h-1 bg-purple-500 rounded-full"
               />
             ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="fixed inset-0 z-[50] bg-black/90 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.1)_0%,transparent_70%)]" />
      <div className="relative z-10">
        {content}
      </div>
    </div>
  );
}
