import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldAlert, MessageSquare, Zap, Flame, Crown, Lock, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';

const FORUM_CATEGORIES = [
  { id: 'teoriler', name: 'Teoriler', description: 'Evrenin sırlarını çöz. Seriler hakkındaki en çılgın teorilerini paylaş.', icon: <Zap size={24} className="text-amber-400" />, requiresElite: false, color: 'from-amber-600/20 to-amber-900/20', borderColor: 'border-amber-500/30' },
  { id: 'yeni-bolumler', name: 'Yeni Bölüm', description: 'Son çıkan bölümler hakkında sıcağı sıcağına muhabbet.', icon: <Flame size={24} className="text-orange-500" />, requiresElite: false, color: 'from-orange-600/20 to-red-900/20', borderColor: 'border-orange-500/30' },
  { id: 'off-topic', name: 'Siber Kahve', description: 'Anime/Manga dışı her şey. Geyik serbest daa.', icon: <MessageSquare size={24} className="text-emerald-400" />, requiresElite: false, color: 'from-emerald-600/20 to-teal-900/20', borderColor: 'border-emerald-500/30' },
  { id: 'elite-odasi', name: 'Elite Mabet', description: 'Sadece Elite statüsüne sahip manga gurmelerinin odası.', icon: <Crown size={24} className="text-red-500" />, requiresElite: true, color: 'from-red-600/20 via-blue-900/20 to-purple-900/20', borderColor: 'border-red-500/50', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]' }
];

const HOT_DISCUSSIONS = [
  { id: 1, title: 'Solo Leveling Son Bölüm İncelemesi', cat: 'Yeni Bölüm', replies: 142, views: 5000, poster: '/yayinarkaplan.jpg' },
  { id: 2, title: 'Kızıl Ejder Hanesi Neden En İyisi?', cat: 'Siber Kahve', replies: 89, views: 2400, poster: 'https://via.placeholder.com/400x200?text=KızılEjder' },
  { id: 3, title: 'Gelecek Hafta Çıkacak Efsane Seri', cat: 'Teoriler', replies: 312, views: 8900, poster: 'https://via.placeholder.com/400x200?text=Teori' },
  { id: 4, title: 'Aethe Mührü Almalı mıyım?', cat: 'Elite Mabet', replies: 45, views: 1200, poster: 'https://via.placeholder.com/400x200?text=Elite' },
];

function HorizontalRow({ title, subtitle, children }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -600, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 600, behavior: 'smooth' });

  return (
    <div className="mb-12 relative group/row">
      <div className="flex items-end gap-3 px-4 sm:px-12 mb-4">
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{title}</h2>
        {subtitle && <span className="text-sm font-bold text-slate-500 mb-1">{subtitle}</span>}
      </div>

      <button onClick={scrollLeft} className="absolute left-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-r from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-blue-400">
        <ChevronLeft size={40} className="drop-shadow-lg" />
      </button>

      <button onClick={scrollRight} className="absolute right-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-l from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-blue-400">
        <ChevronRight size={40} className="drop-shadow-lg" />
      </button>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-4 sm:px-12 pb-8">
        {children}
      </div>
    </div>
  );
}

export default function Citadel() {
  const { user } = useAuth();

  useSEO({
    title: 'Citadel Forum',
    description: 'MahoraPeak Citadel - Topluluk forum ve tartışma platformu.',
    url: 'https://mahorapeak.com.tr/citadel'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#070511] pb-20 relative overflow-x-hidden">
      {/* ── CINEMATIC HERO HEADER ── */}
      <div className="relative w-full h-[60vh] min-h-[500px] overflow-hidden flex items-end mb-12">
        <div className="absolute inset-0 bg-[url('/yayinarkaplan.jpg')] bg-cover bg-center opacity-30 mix-blend-screen scale-105 transition-all duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070511] to-transparent z-10" />
        
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-12 pt-28 pb-12 flex flex-col md:flex-row items-center md:items-end gap-6">
           <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.4)] flex-shrink-0">
             <MessageSquare size={40} className="text-white" />
           </div>
           <div className="text-center md:text-left">
             <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-2xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
               MAHORAPEAK <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">FORUMU</span>
             </h1>
             <p className="text-slate-300 text-lg sm:text-xl max-w-2xl font-medium drop-shadow-md">
               Siber dünyadaki manga sığınağımız. Fikirlerini paylaş, teorilerini çarpıştır, favori serilerini diğer okurlarla tartış.
             </p>
           </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-30 -mt-10">
        
        <HorizontalRow title="Kategoriler" subtitle="Keşfetmeye Başla">
          {FORUM_CATEGORIES.map((cat, idx) => {
            const isLocked = cat.requiresElite && !user?.is_elite;
            return (
              <Link
                key={cat.id}
                to={`/citadel/${cat.id}`}
                className={`snap-start flex-shrink-0 w-[280px] sm:w-[320px] relative h-[200px] rounded-3xl p-6 transition-transform hover:scale-105 group overflow-hidden border ${cat.requiresElite ? 'border-red-500/30' : 'border-white/10'} ${cat.glow || ''}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-30 group-hover:opacity-60 transition-opacity`} />
                <div className="relative z-20 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-auto">
                    <div className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center shadow-lg">
                      {cat.icon}
                    </div>
                    {cat.requiresElite && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest">
                        {isLocked ? <><Lock size={12}/> Kilitli</> : <><Crown size={12}/> Elite</>}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors uppercase tracking-widest">{cat.name}</h2>
                    <p className="text-slate-400 text-xs line-clamp-2 font-medium">{cat.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </HorizontalRow>

        <HorizontalRow title="Ateşli Tartışmalar" subtitle="Gündemden Düşmeyenler">
          {HOT_DISCUSSIONS.map((disc) => (
            <div key={disc.id} className="snap-start flex-shrink-0 w-[300px] sm:w-[360px] relative h-[220px] rounded-2xl overflow-hidden group cursor-pointer border border-white/5 shadow-xl hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-[#141414]">
                <img src={disc.poster} alt={disc.title} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-2 z-10">
                <div className="px-2 py-1 w-fit bg-white/10 backdrop-blur-md rounded border border-white/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                  {disc.cat}
                </div>
                <h3 className="text-white text-lg font-black leading-tight group-hover:text-purple-400 transition-colors drop-shadow-md">
                  {disc.title}
                </h3>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> {disc.replies} Yanıt</span>
                  <span className="flex items-center gap-1"><Flame size={12} className="text-orange-500" /> {disc.views} Görüntülenme</span>
                </div>
              </div>
            </div>
          ))}
        </HorizontalRow>

      </div>
    </div>
  );
}
