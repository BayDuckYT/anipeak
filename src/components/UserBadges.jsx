import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserBadges({ user, showCrown = false, showGem = true, className = '', iconSize = 12 }) {
  const navigate = useNavigate();
  if (!user) return null;

  // Handle both flat user objects and nested profile objects
  const userData = user.profiles || user;
  const role = userData.role;
  const rank = userData.rank;
  const isElite = userData.is_elite || (rank && rank.includes('Elite'));
  const isStaff = ['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester'].includes(role);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/elite-upgrade');
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showCrown && isElite && (
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="relative group cursor-pointer flex items-center justify-center p-0.5 outline-none"
          title="Premium Üyelik (Tıkla ve Yükselt)"
        >
          <Crown size={iconSize} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border border-amber-500/50 z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom">
            PREMIUM ÜYE
          </div>
        </motion.button>
      )}

      {showGem && isStaff && (
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="relative group cursor-pointer flex items-center justify-center p-0.5 outline-none"
          title="Sistem Yetkilisi"
        >
          <Gem size={iconSize} className="text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border border-cyan-500/50 z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom">
            STAFF / YETKİLİ
          </div>
        </motion.button>
      )}
    </div>
  );
}
