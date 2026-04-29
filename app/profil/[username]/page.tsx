'use client';

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

import Decoration from '@/app/components/Decoration';
import effectsData from '@/app/data/effects.json';

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  // In real app, fetch from DB. Here we find based on mock params or default
  const selectedDecoration = effectsData.avatarDecorations[0]; // Example: Lightning
  const selectedNameplate = effectsData.nameplates[1]; // Example: Malevolent Shrine

  const user = {
    username: params.username || 'Murathan',
    fullName: 'Murathan Özel',
    role: 'Malevolent Elite',
    bio: 'AniPeak Global Kurucusu | Dijital Dünyaların Mimarisi ve Geleceğin Teknolojileri Üzerine Çalışıyorum.',
    avatar: 'https://github.com/shadcn.png',
    banner: 'https://images.unsplash.com/photo-1614850523296-e84e09ad8a73?q=80&w=2070&auto=format&fit=crop',
    xp: 25400,
    level: 42,
    joinDate: 'Nisan 2024',
    stats: [
      { label: 'Bölüm Okundu', value: '1.2k', icon: BookOpen },
      { label: 'Favori Seri', value: '42', icon: Star },
      { label: 'Yorum', value: '850', icon: MessageSquare },
      { label: 'Başarılar', value: '15/50', icon: Award },
    ],
    effects: {
      decoration: selectedDecoration,
      nameplate: selectedNameplate,
      glowColor: selectedNameplate.glow || 'rgba(168, 85, 247, 0.2)'
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-red-500/30 overflow-hidden relative">
      
      {/* Dynamic Background Effects - Breathing Glow */}
      <div className="absolute inset-0 pointer-events-none">
        {user.effects.nameplate.video && (
          <video 
            src={user.effects.nameplate.video} 
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
            background: `radial-gradient(circle at 50% 50%, ${user.effects.glowColor} 0%, transparent 70%)`
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        
        {/* Profile Card Header */}
        <div className="relative mb-20">
          {/* Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[300px] sm:h-[400px] rounded-[3rem] overflow-hidden border border-zinc-800 shadow-2xl relative"
          >
            <img src={user.banner} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            
            {/* Share / Social Buttons */}
            <div className="absolute top-8 right-8 flex gap-3">
              <button className="p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all">
                <Share2 size={20} />
              </button>
            </div>
          </motion.div>

          {/* Profile Info Overlay */}
          <div className="absolute -bottom-16 left-8 sm:left-16 flex flex-col sm:flex-row items-end gap-6 sm:gap-10">
            {/* Avatar with Decoration */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative w-40 h-40 sm:w-56 sm:h-56"
            >
              {/* Decoration Layer */}
              <div className="absolute inset-[-15%] z-20 pointer-events-none">
                <Decoration effect={user.effects.decoration} />
              </div>
              
              {/* Base Avatar */}
              <div className="w-full h-full rounded-[2.5rem] border-[8px] border-[#050507] bg-zinc-900 overflow-hidden relative z-10 shadow-2xl">
                 <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              </div>

              {/* Status / Level Indicator */}
              <div 
                className="absolute -bottom-4 -right-4 w-16 h-16 rounded-3xl border-8 border-[#050507] flex flex-col items-center justify-center z-30 shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${user.effects.decoration.color}, #000)` }}
              >
                 <span className="text-[10px] font-black uppercase text-white/60 leading-none">LVL</span>
                 <span className="text-xl font-black text-white">{user.level}</span>
              </div>
            </motion.div>

            {/* User Details */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 sm:mb-8 text-center sm:text-left relative"
            >
               {/* Video Nameplate Overlay */}
               {user.effects.nameplate.video && (
                <div className="absolute inset-0 -mx-10 -my-4 pointer-events-none overflow-hidden z-0">
                  <video 
                    src={user.effects.nameplate.video} 
                    autoPlay 
                    loop 
                    muted 
                    className="w-full h-full object-cover mix-blend-screen opacity-40" 
                  />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <h1 
                    className="text-4xl sm:text-6xl font-black tracking-tighter text-white uppercase italic"
                    style={{ color: user.effects.nameplate.color }}
                  >
                    {user.username}
                  </h1>
                  <span 
                    className="w-fit mx-auto sm:mx-0 px-4 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-2xl"
                    style={{ backgroundColor: user.effects.nameplate.color }}
                  >
                     {user.role}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm font-medium flex items-center justify-center sm:justify-start gap-2">
                  <Calendar size={14} /> {user.joinDate} tarihinde katıldı
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Bio & Links */}
          <div className="space-y-8">
            <section className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl space-y-6">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Info size={16} /> HAKKINDA
              </h3>
              <p className="text-zinc-300 leading-relaxed font-medium">
                {user.bio}
              </p>
              
              <div className="pt-4 flex flex-wrap gap-3">
                 <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-400">
                    <LinkIcon size={14} /> anipeak.com/murathan
                 </div>
              </div>
            </section>

            {/* XP / Level Progress */}
            <section className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">TECRÜBE (XP)</h3>
                 <span className="text-xs font-black text-white">{user.xp.toLocaleString()} / 30.000</span>
              </div>
              <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-1">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.xp / 30000) * 100}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]" 
                 />
              </div>
            </section>
          </div>

          {/* Right Column: Stats & Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {user.stats.map((stat, i) => (
                 <motion.div 
                   key={stat.label}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5 + (i * 0.1) }}
                   className="p-6 rounded-[2rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl flex flex-col items-center gap-2 group hover:border-red-500/30 transition-all"
                 >
                   <div className="p-3 rounded-2xl bg-zinc-950 text-zinc-500 group-hover:text-red-500 transition-colors">
                     <stat.icon size={24} />
                   </div>
                   <div className="text-center">
                      <span className="block text-2xl font-black text-white">{stat.value}</span>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                   </div>
                 </motion.div>
               ))}
            </div>

            {/* Reading Showcase */}
            <section className="p-8 rounded-[3rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl space-y-8">
               <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                   <History size={16} /> SON AKTİVİTELER
                 </h3>
                 <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">TÜMÜNÜ GÖR</button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[1, 2].map((item) => (
                   <div key={item} className="group relative rounded-3xl overflow-hidden aspect-[16/9] border border-zinc-800">
                      <img 
                        src={`https://images.unsplash.com/photo-1578632738980-43318b5c9440?q=80&w=2070&auto=format&fit=crop`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt="Activity" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                         <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">OKUYOR</span>
                         <h4 className="text-lg font-black text-white uppercase italic tracking-tight truncate">Jujutsu Kaisen</h4>
                         <p className="text-xs text-zinc-400">Bölüm 256 • 2 saat önce</p>
                      </div>
                   </div>
                 ))}
               </div>
            </section>
          </div>

        </div>

      </div>

      {/* Global Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

    </div>
  );
}
