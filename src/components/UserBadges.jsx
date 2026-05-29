import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Gem, Ghost, Trophy, Sparkles, Shield } from 'lucide-react';
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
  const houseId = userData.house_id;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/elite-upgrade');
  };

  // Badge image size: significantly larger than iconSize for visual impact
  const badgeSize = Math.round(iconSize * 2.4);

  const getPremiumIcon = () => {
    if (userData?.username === 'MAHORAPEAK' || planId === 'aethe') return (
       <div className="flex items-center justify-center shrink-0" style={{ width: badgeSize, height: badgeSize }}>
          <img src="/badges/aethe.png" alt="Aethe" style={{ width: badgeSize, height: badgeSize, objectFit: 'contain' }} className="drop-shadow-[0_0_6px_rgba(244,63,94,0.7)] animate-pulse" />
       </div>
    );
    if (planId === 'shadow') return (
       <div className="flex items-center justify-center shrink-0" style={{ width: badgeSize, height: badgeSize }}>
          <img src="/badges/shadow.png" alt="Shadow" style={{ width: badgeSize, height: badgeSize, objectFit: 'contain' }} className="drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
       </div>
    );
    if (planId === 'ruler') return (
       <div className="flex items-center justify-center shrink-0" style={{ width: badgeSize, height: badgeSize }}>
          <img src="/badges/ruler.png" alt="Ruler" style={{ width: badgeSize, height: badgeSize, objectFit: 'contain' }} className="drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
       </div>
    );
    if (planId === 'pro') return (
       <div className="flex items-center justify-center shrink-0" style={{ width: badgeSize, height: badgeSize }}>
          <img src="/badges/pro.png" alt="Pro" style={{ width: badgeSize, height: badgeSize, objectFit: 'contain' }} className="drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
       </div>
    );
    return <Crown size={iconSize} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />;
  };

  const getPremiumLabel = () => {
    if (planId === 'aethe') return 'EFSANEVİ AETHE MÜHRÜ';
    if (planId === 'shadow') return 'HÜKÜMDAR GÖLGESİ';
    if (planId === 'ruler') return 'HÜKÜMDAR';
    if (planId === 'pro') return 'PRO ÜYE';
    return 'PREMIUM ÜYE';
  };

  const getTooltipBorder = () => {
    if (planId === 'aethe') return 'border-rose-500/50';
    if (planId === 'shadow') return 'border-purple-500/50';
    if (planId === 'ruler') return 'border-amber-500/50';
    if (planId === 'pro') return 'border-cyan-500/50';
    return 'border-amber-500/50';
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {showCrown && isElite && (
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="relative group cursor-pointer flex items-center justify-center outline-none"
          title="Premium Üyelik (Tıkla ve Yükselt)"
        >
          {getPremiumIcon()}
          <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-card-navy text-white text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border ${getTooltipBorder()} z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom`}>
            {getPremiumLabel()}
          </div>
        </motion.button>
      )}

      {showGem && isStaff && !isElite && (
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="relative group cursor-pointer flex items-center justify-center outline-none"
          title="Sistem Yetkilisi"
        >
          <Gem size={iconSize} className="text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card-navy text-white text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border border-cyan-500/50 z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom">
            STAFF / YETKİLİ
          </div>
        </motion.button>
      )}

      {houseId && (
        <motion.div
          whileHover={{ scale: 1.15 }}
          className="relative group cursor-pointer flex items-center justify-center outline-none"
        >
          <Shield size={iconSize} className={`drop-shadow-[0_0_8px_currentColor] ${
            houseId === 'dragon' ? 'text-red-500' :
            houseId === 'fox' ? 'text-purple-400' :
            houseId === 'wolf' ? 'text-blue-400' :
            'text-orange-400'
          }`} />
          <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-card-navy text-white text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom ${
            houseId === 'dragon' ? 'border-red-500/50' :
            houseId === 'fox' ? 'border-purple-500/50' :
            houseId === 'wolf' ? 'border-blue-500/50' :
            'border-orange-500/50'
          }`}>
            {houseId === 'dragon' ? 'KIZIL EJDER' :
             houseId === 'fox' ? 'GÜMÜŞ KITSUNE' :
             houseId === 'wolf' ? 'BUZ KURT' :
             'ALTIN ANKA'}
          </div>
        </motion.div>
      )}
    </div>
  );
}
