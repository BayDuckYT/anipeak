'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Info,
  Zap,
  Globe,
  Link as LinkIcon
} from 'lucide-react';

import Decoration from '@/app/components/Decoration';
import effectsData from '@/app/data/effects.json';

const AVATAR_DECORATIONS = effectsData.avatarDecorations;
const NAMEPLATES = effectsData.nameplates;

export default function ProfileSettingsPage() {
  const [username, setUsername] = useState('Murathan');
  const [bio, setBio] = useState('MahoraPeak Global Kurucusu | Dijital İnşaatçı');
  const [selectedDecoration, setSelectedDecoration] = useState(AVATAR_DECORATIONS[0]);
  const [selectedNameplate, setSelectedNameplate] = useState(NAMEPLATES[0]);
  const [avatarUrl, setAvatarUrl] = useState('https://github.com/shadcn.png');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1614850523296-e84e09ad8a73?q=80&w=2070&auto=format&fit=crop');

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">PROFİL ÖZELLEŞTİRME</h2>
          <p className="text-zinc-500 text-sm">Profilini ve görsellerini buradan düzenleyebilirsin.</p>
        </div>
        <button className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center gap-2 group">
          <Check size={18} className="group-hover:scale-110 transition-transform" />
          DEĞİŞİKLİKLERİ KAYDET
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Left Side: Forms */}
        <div className="space-y-8">
          
          {/* Visual Assets Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Camera size={16} /> GÖRSEL VARLIKLAR
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Avatar Upload */}
              <div className="group relative aspect-square rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all shadow-xl">
                    <Camera size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-zinc-300">AVATAR DEĞİŞTİR</span>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="group relative aspect-square rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all">
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all shadow-xl">
                    <ImageIcon size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-zinc-300">BANNER DEĞİŞTİR</span>
                </div>
              </div>
            </div>
          </section>

          {/* Profile Info Section */}
          <section className="space-y-6">
             <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Info size={16} /> TEMEL BİLGİLER
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Kullanıcı Adı</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-100 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all text-sm font-medium"
                    placeholder="Kullanıcı adın"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Hakkında (Bio)</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all text-sm font-medium h-32 resize-none"
                  placeholder="Kendinden bahset..."
                />
              </div>
            </div>
          </section>

          {/* Effects Section */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" /> ELİT DEKORASYONLAR
            </h3>

            {/* Avatar Decoration Grid */}
            <div className="space-y-4">
               <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Avatar Çerçevesi / Efekti</label>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {AVATAR_DECORATIONS.map((effect) => (
                   <button
                    key={effect.id}
                    onClick={() => setSelectedDecoration(effect)}
                    className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 group
                      ${selectedDecoration.id === effect.id 
                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                   >
                     <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden relative">
                       {effect.id === 'none' ? <span className="text-zinc-600 text-[10px] font-bold">YOK</span> : (
                         <Decoration effect={effect} />
                       )}
                     </div>
                     <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase truncate w-full text-center">{effect.name}</span>
                     {selectedDecoration.id === effect.id && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center"><Check size={10} className="text-white" /></div>}
                   </button>
                 ))}
               </div>
            </div>

            {/* Nameplate Selection */}
            <div className="space-y-4">
               <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">İsim Plakası (Video Banner)</label>
               <div className="grid grid-cols-1 gap-3">
                 {NAMEPLATES.map((plate) => (
                   <button
                    key={plate.id}
                    onClick={() => setSelectedNameplate(plate)}
                    className={`relative w-full h-16 rounded-xl border transition-all overflow-hidden group
                      ${selectedNameplate.id === plate.id 
                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                   >
                     {plate.video && (
                       <video src={plate.video} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen group-hover:opacity-60 transition-opacity" />
                     )}
                     <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                       <span className="text-xs font-black uppercase italic tracking-tighter" style={{ color: plate.color || '#fff' }}>{plate.name}</span>
                       {selectedNameplate.id === plate.id && <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          </section>
        </div>

        {/* Right Side: Live Preview */}
        <div className="xl:sticky xl:top-8 h-fit">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Globe size={16} className="text-blue-400" /> CANLI ÖNİZLEME (PREVIEW)
            </h3>

            {/* Profile Card Preview */}
            <div className="relative group perspective-1000">
              <motion.div 
                layout
                className="w-full max-w-[420px] mx-auto rounded-[2.5rem] bg-[#050507] border border-zinc-800 overflow-hidden shadow-2xl relative z-10"
                style={{
                   boxShadow: selectedNameplate.color ? `0 20px 80px -10px ${selectedNameplate.color}15` : 'none'
                }}
              >
                {/* Banner Part */}
                <div className="h-32 relative overflow-hidden bg-zinc-900">
                  {selectedNameplate.video ? (
                    <video key={selectedNameplate.video} src={selectedNameplate.video} autoPlay loop muted className="w-full h-full object-cover mix-blend-screen opacity-80" />
                  ) : (
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  )}
                  {/* Glass Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050507] to-transparent opacity-80" />
                </div>

                {/* Content Part */}
                <div className="px-8 pb-10 -mt-12 relative z-20">
                   {/* Avatar Container */}
                   <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-6">
                      {/* Decoration Layer */}
                      <div className="absolute inset-[-15%] z-20 pointer-events-none">
                        {selectedDecoration.id !== 'none' && (
                          <Decoration effect={selectedDecoration} />
                        )}
                      </div>
                      
                      {/* Base Avatar */}
                      <div className="w-full h-full rounded-full border-[6px] border-[#050507] bg-zinc-900 overflow-hidden relative z-10 shadow-2xl">
                         <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* Pro Badge */}
                      <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 border-4 border-[#050507] flex items-center justify-center z-30 shadow-lg">
                        <Zap size={14} className="text-white" />
                      </div>
                   </div>

                   {/* User Details */}
                   <div className="space-y-4">
                      <div className="space-y-1 relative">
                        {/* Video Nameplate Overlay */}
                        {selectedNameplate.video && (
                          <div className="absolute inset-0 -mx-4 -my-2 pointer-events-none overflow-hidden z-0">
                            <video 
                              key={selectedNameplate.video} 
                              src={selectedNameplate.video} 
                              autoPlay 
                              loop 
                              muted 
                              className="w-full h-full object-cover mix-blend-screen opacity-50" 
                            />
                          </div>
                        )}
                        <h4 className="text-2xl font-black italic tracking-tight text-white uppercase flex items-center gap-2 relative z-10" style={{ color: selectedNameplate.color || '#fff' }}>
                          {username}
                        </h4>
                        <div className="flex items-center gap-2 relative z-10">
                           <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">ELİT ÜYE</span>
                           <span className="text-[10px] font-black uppercase text-zinc-500">@murathanozel</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-md">
                        <p className="text-xs text-zinc-400 leading-relaxed italic">
                          "{bio || 'Buraya bir biyografi ekle...'}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-500">
                          <LinkIcon size={12} /> mahorapeak.com/murathan
                        </div>
                      </div>
                   </div>
                </motion.div>

                {/* Floating Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
            </div>

            {/* Stats / Badges Preview */}
            <div className="p-6 rounded-[2rem] bg-zinc-950 border border-zinc-800 space-y-4">
               <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                 <Check size={14} className="text-emerald-500" /> ŞU AN AKTİF GÖRÜNÜM
               </h4>
               <div className="space-y-3">
                 <div className="flex items-center justify-between text-xs">
                   <span className="text-zinc-400">Efekt:</span>
                   <span className="text-zinc-100 font-bold">{selectedDecoration.name}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                   <span className="text-zinc-400">İsim Plakası:</span>
                   <span className="text-zinc-100 font-bold">{selectedNameplate.name}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center gap-4 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-blue-400 text-sm">
        <Info size={20} />
        <p>Bazı efektler ve isim plakaları sadece <strong>Pro</strong> veya <strong>Malevolent Elite</strong> üyelerine özeldir.</p>
      </div>
    </div>
  );
}

// Framer Motion helper for Tailwind perspective
const perspectiveClass = {
  perspective: '1000px'
};
