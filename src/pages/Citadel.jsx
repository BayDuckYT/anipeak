import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldAlert, MessageSquare, Zap, Flame, Crown, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FORUM_CATEGORIES = [
  {
    id: 'teoriler',
    name: 'Kozmik Teoriler',
    description: 'Evrenin sırlarını çöz. Seriler hakkındaki en çılgın teorilerini paylaş.',
    icon: <Zap size={24} className="text-amber-400" />,
    requiresElite: false,
    color: 'from-amber-600/20 to-amber-900/20',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'yeni-bolumler',
    name: 'Yeni Bölüm Tartışmaları',
    description: 'Son çıkan bölümler hakkında sıcağı sıcağına muhabbet.',
    icon: <Flame size={24} className="text-orange-500" />,
    requiresElite: false,
    color: 'from-orange-600/20 to-red-900/20',
    borderColor: 'border-orange-500/30'
  },
  {
    id: 'off-topic',
    name: 'Siber Kahvehane',
    description: 'Anime/Manga dışı her şey. Geyik serbest daa.',
    icon: <MessageSquare size={24} className="text-emerald-400" />,
    requiresElite: false,
    color: 'from-emerald-600/20 to-teal-900/20',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'elite-chambers',
    name: 'Elite Karargah Odası',
    description: 'Sadece Elite statüsüne sahip efendilerin girebileceği gizli mabet.',
    icon: <Crown size={24} className="text-red-500" />,
    requiresElite: true,
    color: 'from-red-600/20 via-blue-900/20 to-purple-900/20',
    borderColor: 'border-red-500/50',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]'
  }
];

export default function Citadel() {
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050507] pt-24 pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert size={32} className="text-blue-500" />
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
              KARARGAH <span className="text-slate-500">FORUMU</span>
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl text-lg">
            Siber dünyadaki sığınağımız. Fikirlerini paylaş, teorilerini çarpıştır, sadece elitlerin girdiği odaların kapılarını zorla.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {FORUM_CATEGORIES.map((cat, idx) => {
            const isLocked = cat.requiresElite && !user?.is_elite;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={`/citadel/${cat.id}`}
                  className={`block relative h-full rounded-3xl p-8 transition-all duration-300 group
                    ${cat.requiresElite ? 'citadel-card border-red-500/30' : 'citadel-card'}
                    ${cat.glow || ''}
                    ${isLocked ? 'citadel-locked' : ''}
                  `}
                >
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${cat.color} opacity-30 group-hover:opacity-60 transition-opacity`} />
                  
                  <div className="relative z-20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center shadow-lg">
                        {cat.icon}
                      </div>
                      {cat.requiresElite && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest">
                          {isLocked ? <><Lock size={12}/> Kilitli</> : <><Crown size={12}/> Elite Özel</>}
                        </div>
                      )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {cat.name}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {cat.description}
                    </p>
                    
                    {/* Stats Placeholder */}
                    <div className="mt-6 flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">
                      <span>{Math.floor(Math.random() * 500) + 50} Konu</span>
                      <span>{Math.floor(Math.random() * 2000) + 100} Mesaj</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
