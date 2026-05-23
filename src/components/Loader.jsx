import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function Loader({ text = "Sayfa Yükleniyor...", fullScreen = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-8 relative gpu-accelerated">
      {/* Heartbeat Pulse Container */}
      <div className="relative w-24 h-24 flex items-center justify-center will-change-transform">
        {/* Animated Rings (Pulse Effect) */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.8],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut"
            }}
            className="absolute inset-0 border border-purple-500/30 rounded-full"
          />
        ))}

        {/* Central Core (The Zap) */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
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
          className="text-purple-500 relative z-10"
        >
          <Zap size={40} fill="currentColor" strokeWidth={1} />
        </motion.div>
      </div>

      {/* Text with Heartbeat rhythm */}
      <div className="flex flex-col items-center gap-3">
        <motion.span 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="text-white font-black text-[10px] uppercase tracking-[0.5em] text-center"
        >
          {text}
        </motion.span>
        
        {/* Progress Line */}
        <div className="w-32 h-[1px] bg-white/5 relative overflow-hidden">
          <motion.div 
            animate={{ x: [-128, 128] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          />
        </div>
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="relative min-h-[80vh] w-full flex items-center justify-center py-20">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#070511] flex items-center justify-center">
      <div className="relative">
        {content}
      </div>
    </div>
  );
}
