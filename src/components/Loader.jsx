import React from 'react';
import { motion } from 'framer-motion';

export default function Loader({ text = "Yükleniyor...", fullScreen = true }) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-6 p-10 ${!fullScreen ? 'min-h-[60vh] w-full' : ''}`}>
      <div className="relative w-20 h-20">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
        
        {/* Main Spinner */}
        <div className="w-full h-full border-4 border-white/5 border-t-purple-500 rounded-full animate-spin shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
        
        {/* Inner Spinner (Counter-clockwise) */}
        <div className="absolute inset-2 border-4 border-white/5 border-b-blue-400 rounded-full animate-spin-reverse opacity-80" />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="flex flex-col items-center gap-2"
      >
        <span className="text-white font-black text-xs uppercase tracking-[0.4em] drop-shadow-md">
          {text}
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-1 h-1 bg-purple-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050507] flex items-center justify-center">
      {content}
    </div>
  );
}
