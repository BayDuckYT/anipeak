import React from 'react';
import { motion } from 'framer-motion';

export default function EliteBadge({ className = '' }) {
  return (
    <motion.div 
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-red-600 to-blue-600 text-slate-900 font-black text-xs shadow-neon-purple border border-purple-900/20 relative ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      title="Elite Üye"
    >
      <span className="relative z-10" style={{ transform: 'translateY(-0.5px)' }}>Ω</span>
      <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white" />
    </motion.div>
  );
}
