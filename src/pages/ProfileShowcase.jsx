import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  BookOpen, 
  Star, 
  History, 
  MessageSquare, 
  Share2,
  Calendar,
  Award,
  Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import Decoration from '../components/Decoration';
import effectsData from '../data/effects.json';

export default function ProfileShowcase() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { series } = useApp();
  
  // In a real app, you'd fetch the user data for 'username' from the backend.
  // For now, if it's the current user, use their data.
  const isOwnProfile = currentUser?.username === username;
  
  // Mock/Fallback data if not current user
  const displayUser = isOwnProfile ? currentUser : {
    username: username,
    role: 'Üye',
    bio: 'Henüz bir biyografi eklenmemiş.',
    avatar_url: null,
    xp: 0,
    level: 1,
    joinDate: 'Nisan 2024',
    totalRead: 0
  };

  // Effects selection (Mocked for now based on effects.json)
  const selectedDecoration = effectsData.avatarDecorations[0];
  const selectedNameplate = effectsData.nameplates[1];
  const glowColor = selectedNameplate.glow || 'rgba(168, 85, 247, 0.2)';

  const stats = [
    { label: 'Bölüm Okundu', value: displayUser.totalRead || 0, icon: BookOpen },
    { label: 'Favori Seri', value: '0', icon: Star },
    { label: 'Yorum', value: '0', icon: MessageSquare },
    { label: 'Başarılar', value: '0/50', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-red-500/30 overflow-hidden relative pt-16">
      
      {/* Dynamic Background Effects - Breathing Glow */}
      <div className="absolute inset-0 pointer-events-none">
        {selectedNameplate.video && (
          <video 
            src={selectedNameplate.video} 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover opacity-10 mix-blend-screen" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/20 via-[#050507]/80 to-[#050507]" />
        
        {/* Breathing Glow Layer */}
        <motion.div 
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)`
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        
        {/* Profile Card Header */}
        <div className="relative mb-20">
          {/* Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[200px] sm:h-[350px] rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl relative bg-zinc-900"
          >
            {displayUser.banner_url ? (
              <img src={displayUser.banner_url} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black opacity-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            
            {/* Share / Social Buttons */}
            <div className="absolute top-6 right-6 flex gap-3">
              <button className="p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all">
                <Share2 size={18} />
              </button>
            </div>
          </motion.div>

          {/* Profile Info Overlay */}
          <div className="absolute -bottom-16 left-6 sm:left-12 flex flex-col sm:flex-row items-end gap-6 sm:gap-10">
            {/* Avatar with Decoration */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative w-32 h-32 sm:w-48 sm:h-48"
            >
              {/* Decoration Layer */}
              <div className="absolute inset-[-15%] z-20 pointer-events-none">
                <Decoration effect={selectedDecoration} />
              </div>
              
              {/* Base Avatar */}
              <div className="w-full h-full rounded-[2.2rem] border-[6px] border-[#050507] bg-zinc-900 overflow-hidden relative z-10 shadow-2xl flex items-center justify-center">
                 {displayUser.avatar_url ? (
                   <img src={displayUser.avatar_url} alt={displayUser.username} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-4xl font-black text-white/20 uppercase">{displayUser.username?.[0]}</span>
                 )}
              </div>

              {/* Status / Level Indicator */}
              <div 
                className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl border-4 border-[#050507] flex flex-col items-center justify-center z-30 shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${selectedDecoration.color}, #000)` }}
              >
                 <span className="text-[8px] font-black uppercase text-white/60 leading-none">LVL</span>
                 <span className="text-base font-black text-white">{Math.floor((displayUser.xp || 0) / 100) + 1}</span>
              </div>
            </motion.div>

            {/* User Details */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 sm:mb-6 text-center sm:text-left relative"
            >
               {/* Video Nameplate Overlay */}
               {selectedNameplate.video && (
                <div className="absolute inset-0 -mx-10 -my-4 pointer-events-none overflow-hidden z-0">
                  <video 
                    src={selectedNameplate.video} 
                    autoPlay 
                    loop 
                    muted 
                    className="w-full h-full object-cover mix-blend-screen opacity-40" 
                  />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                  <h1 
                    className="text-3xl sm:text-5xl font-black tracking-tighter text-white uppercase italic"
                    style={{ color: selectedNameplate.color }}
                  >
                    {displayUser.username}
                  </h1>
                  <span 
                    className="w-fit mx-auto sm:mx-0 px-3 py-1 rounded-lg text-white text-[9px] font-black uppercase tracking-widest shadow-2xl"
                    style={{ backgroundColor: selectedNameplate.color }}
                  >
                     {displayUser.role}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs font-medium flex items-center justify-center sm:justify-start gap-2">
                  <Calendar size={12} /> {displayUser.joinDate || 'Nisan 2024'} tarihinde katıldı
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Bio & Links */}
          <div className="space-y-8">
            <section className="p-6 sm:p-8 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl space-y-6">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} /> HAKKINDA
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                {displayUser.bio || 'Henüz bir biyografi eklenmemiş.'}
              </p>
              
              <div className="pt-2 flex flex-wrap gap-2">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-400">
                    <LinkIcon size={12} /> anipeak.com/{displayUser.username}
                 </div>
              </div>
            </section>

            {/* XP / Level Progress */}
            <section className="p-6 sm:p-8 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">TECRÜBE (XP)</h3>
                 <span className="text-xs font-black text-white">{(displayUser.xp || 0).toLocaleString()} / 30.000</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((displayUser.xp || 0) / 30000) * 100, 100)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                 />
              </div>
            </section>
          </div>

          {/* Right Column: Stats & Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {stats.map((stat, i) => (
                 <motion.div 
                   key={stat.label}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5 + (i * 0.1) }}
                   className="p-5 rounded-[2rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl flex flex-col items-center gap-2 group hover:border-purple-500/30 transition-all"
                 >
                   <div className="p-3 rounded-2xl bg-zinc-950 text-zinc-500 group-hover:text-purple-500 transition-colors">
                     <stat.icon size={20} />
                   </div>
                   <div className="text-center">
                      <span className="block text-xl font-black text-white">{stat.value}</span>
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                   </div>
                 </motion.div>
               ))}
            </div>

            {/* Reading Showcase */}
            <section className="p-6 sm:p-8 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl space-y-6">
               <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                   <History size={16} /> SON AKTİVİTELER
                 </h3>
                 <button className="text-[10px] font-black text-purple-500 uppercase tracking-widest hover:underline">TÜMÜNÜ GÖR</button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="px-4 py-10 text-center border border-dashed border-white/5 rounded-2xl text-zinc-600 text-xs italic">
                    Henüz bir aktivite bulunmuyor.
                  </div>
               </div>
            </section>
          </div>

        </div>

      </div>

      {/* Global Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

    </div>
  );
}
