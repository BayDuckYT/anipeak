import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Gem, Ghost, Trophy, Sparkles } from 'lucide-react';
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
  const planId = userData.active_plan_id;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/elite-upgrade');
  };

  const getPremiumIcon = () => {
    if (userData?.username === 'ANIPEAK' || planId === 'aethe') return <img src="/aethe.png" alt="Aethe" style={{ width: iconSize * 5, height: iconSize * 5, objectFit: 'contain' }} className="drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />;
    if (planId === 'shadow') return <Ghost size={iconSize} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />;
    if (planId === 'pro') return <Trophy size={iconSize} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />;
    return <Crown size={iconSize} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />;
  };

  const getPremiumLabel = () => {
    if (planId === 'aethe') return 'EFSANEVİ AETHE MÜHRÜ';
    if (planId === 'shadow') return 'HÜKÜMDAR GÖLGESİ';
    if (planId === 'ruler') return 'HÜKÜMDAR';
    if (planId === 'pro') return 'PRO ÜYE';
    return 'PREMIUM ÜYE';
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
          {getPremiumIcon()}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card-navy text-white text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border border-amber-500/50 z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom">
            {getPremiumLabel()}
          </div>
        </motion.button>
      )}

      {showGem && isStaff && !isElite && (
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="relative group cursor-pointer flex items-center justify-center p-0.5 outline-none"
          title="Sistem Yetkilisi"
        >
          <Gem size={iconSize} className="text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card-navy text-white text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border border-cyan-500/50 z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom">
            STAFF / YETKİLİ
          </div>
        </motion.button>
      )}
    </div>
  );
}
