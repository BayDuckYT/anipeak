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
  const isStaff = ['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester', 'Moderatör'].includes(role);
  const planId = userData.active_plan_id;
  const houseId = userData.house_id;
  const isHeadAdmin = role === 'Baş Admin' || role === 'Kurucu' || userData?.username === 'MAHORAPEAK' || userData?.username === 'MAHORA';

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/elite-upgrade');
  };

  const getPremiumIcon = () => {
    if (userData?.username === 'MAHORAPEAK' || planId === 'aethe') return (
       <div className="flex items-center justify-center shrink-0" style={{ width: iconSize, height: iconSize }}>
          <img src="/badges/aethe.png" alt="Aethe" style={{ width: 80, height: 80, maxWidth: 'none', objectFit: 'contain' }} className="drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
       </div>
    );
    if (planId === 'shadow') return (
       <div className="flex items-center justify-center shrink-0" style={{ width: iconSize, height: iconSize }}>
          <img src="/badges/shadow.png" alt="Shadow" style={{ width: 80, height: 80, maxWidth: 'none', objectFit: 'contain' }} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
       </div>
    );
    if (planId === 'ruler') return (
       <div className="flex items-center justify-center shrink-0" style={{ width: iconSize, height: iconSize }}>
          <img src="/badges/ruler.png" alt="Ruler" style={{ width: 80, height: 80, maxWidth: 'none', objectFit: 'contain' }} className="drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
       </div>
    );
    if (planId === 'pro') return (
       <div className="flex items-center justify-center shrink-0" style={{ width: iconSize, height: iconSize }}>
          <img src="/badges/pro.png" alt="Pro" style={{ width: 80, height: 80, maxWidth: 'none', objectFit: 'contain' }} className="drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
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

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showCrown && isElite && !isHeadAdmin && (
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

      {isHeadAdmin && (
        <motion.div
          whileHover={{ scale: 1.2 }}
          className="relative group cursor-pointer flex items-center justify-center p-0.5 outline-none"
        >
          <div className="flex items-center justify-center shrink-0 w-10 h-10 md:w-12 md:h-12">
             <img src="/basadminicon.png" alt="Baş Admin" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(220,38,38,0.8)] mix-blend-screen" />
          </div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card-navy text-white text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border border-red-500/50 z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom">
            KURUCU / BAŞ ADMİN
          </div>
        </motion.div>
      )}

      {showGem && isStaff && role !== 'Baş Admin' && role !== 'Kurucu' && !isElite && (
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

      {role === 'Moderatör' && (
        <motion.div
          whileHover={{ scale: 1.2 }}
          className="relative group cursor-pointer flex items-center justify-center p-0.5 outline-none"
        >
          <span className="text-[12px] drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">🛡️</span>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card-navy text-white text-[9px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap border border-orange-500/50 z-[100] shadow-2xl scale-90 group-hover:scale-100 origin-bottom">
            MODERATÖR
          </div>
        </motion.div>
      )}

      {houseId && (
        <motion.div
          whileHover={{ scale: 1.2 }}
          className="relative group cursor-pointer flex items-center justify-center p-0.5 outline-none"
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
