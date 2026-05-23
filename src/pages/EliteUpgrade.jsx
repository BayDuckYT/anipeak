import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Check, ArrowRight, Zap, Star, Shield, 
  Monitor, Clock, Gift, Layout, Download, Sparkles,
  Palette, Box, Users, Trophy, Rocket, Ghost, Infinity, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import AnimeAvatar from '../components/AnimeAvatar';
import effectsData from '../data/effects.json';
import nameplatesData from '../data/nameplates.json';
import { useSEO } from '../hooks/useSEO';

export default function EliteUpgrade() {
  const { user, upgradeToElite } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Elite Premium',
    description: 'AniPeak Elite Premium üyelik. Özel dekorasyonlar, rozetler ve ayrıcalıklı özellikler.',
    url: 'https://anipeak.com.tr/elite-upgrade'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const customPlans = [
      {
        id: 'pro',
        name: 'ANIPEAK PRO',
        price: 75.00,
        duration: 'aylık',
        color: 'cyan',
        icon: 'Trophy',
        features: ['5 İsim Plakası Hakkı', '10 Avatar Efekti Hakkı', 'PRO Rozeti', 'Reklamsız Deneyim', 'Temel Okuma Ayrıcalıkları']
      },
      {
        id: 'shadow',
        name: 'HÜKÜMDAR GÖLGESİ',
        price: 699.00,
        duration: 'yıllık',
        color: 'purple',
        icon: 'Ghost',
        savings: '₺201 İNDİRİM',
        features: ['15 İsim Plakası Hakkı', '30 Avatar Efekti Hakkı', '10 İsim Efekti Hakkı', 'GÖLGE Rozeti ve Erken Erişim', 'Özel Profil Çerçeveleri']
      },
      {
        id: 'ruler',
        name: 'HÜKÜMDAR',
        price: 999.00,
        duration: 'ömür boyu',
        color: 'amber',
        is_popular: true,
        icon: 'Crown',
        features: ['30 İsim Plakası Hakkı', '100 Avatar Efekti Hakkı', '25 İsim Efekti Hakkı', 'HÜKÜMDAR Rozeti ve Öncelikli Destek', 'Tüm Gelecek Güncellemeler']
      },
      {
        id: 'aethe',
        name: 'AETHE',
        price: 1500.00,
        duration: 'ömür boyu',
        color: 'rose',
        is_limited: true,
        icon: 'Sparkles',
        features: ['Sadece İlk 20 Kişiye Özel!', 'Sınırsız Tüm Efektlere Erişim (387+)', 'Özel AETHE Mührü', 'Efsanevi Discord Rolü', 'Gelecek Her Şeye Sınırsız Erişim']
      }
    ];
    setPlans(customPlans);
    setLoading(false);
  }, []);

  const handleUpgrade = async (plan) => {
    if (!user) {
      const event = new CustomEvent('open-auth', { detail: 'login' });
      window.dispatchEvent(event);
      return;
    }
    
    // Aethe package logic placeholder (Direct to Discord)
    if (plan.id === 'aethe') {
      window.open('https://discord.gg/anipeak', '_blank');
      return;
    }

    const success = await upgradeToElite(plan.id);
    if (success) {
      navigate('/profile');
    }
  };

  const allDecorations = effectsData.filter(e => e.category === 'decorations');
  const marqueeList = [...allDecorations, ...allDecorations];

  return (
    <div className="min-h-screen bg-[#070511] pt-20 pb-32 relative overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* ── BACKGROUND DECOR ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* ── 1. MODERN HERO SECTION ── */}
        <section className="relative flex flex-col items-center justify-center py-20 md:py-32 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-widest backdrop-blur-md mb-8"
          >
             <Crown size={14} className="text-purple-400" /> ANIPEAK PREMIUM DENEYİMİ
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black text-white leading-[1.1] tracking-tighter mb-6"
          >
            ELİT <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">AYRICALIK.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl font-medium leading-relaxed mb-12"
          >
            Reklamsız, kesintisiz, tamamen sana özel. Efsanevi paketlerimizle Anime ve Manga dünyasında sınırları kaldır.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <button 
              onClick={() => document.getElementById('plans-section').scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 text-sm"
            >
              Paketleri İncele <ArrowRight size={18} />
            </button>
          </motion.div>
        </section>

        {/* ── 2. DEVASA CEPHANELİK (KORUNAN BÖLÜM) ── */}
        <section className="py-24 border-y border-white/5 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent">
          <div className="text-center mb-20 px-4">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 uppercase">
              DEVASA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">CEPHANELİK</span>
            </h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[11px]">
              Sadece Premium üyelere özel {effectsData.length + nameplatesData.length}+ içerik.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-12 md:gap-24 mb-24 px-4">
            {[
              { val: nameplatesData.length, label: "İSİM PLAKASI" },
              { val: effectsData.filter(e => e.category === 'name_effects').length, label: "İSİM EFEKTİ" },
              { val: effectsData.filter(e => e.category === 'decorations').length, label: "AVATAR EFEKTİ" },
              { val: effectsData.filter(e => e.category === 'profile_effects').length, label: "PROFİL EFEKTİ" },
              { val: effectsData.filter(e => e.category === 'flags').length, label: "ÜLKE BAYRAĞI" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <span className="block text-6xl md:text-7xl font-black text-white mb-2 transition-all group-hover:text-purple-400 group-hover:scale-110">{stat.val}</span>
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-slate-400">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="relative w-full overflow-hidden py-10">
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#070511] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#070511] to-transparent z-10" />
            
            <div className="flex w-max animate-marquee-slower hover:[animation-play-state:paused]">
               {marqueeList.map((frame, i) => (
                 <div 
                   key={`${frame.id}-${i}`}
                   className="w-44 h-60 flex-shrink-0 flex flex-col items-center justify-between p-7 mx-4 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/[0.08] hover:border-purple-500/30 group"
                 >
                   <div className="relative w-24 h-24 flex items-center justify-center">
                      <div className="absolute w-20 h-20 rounded-full bg-black/60 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500" />
                      <AnimeAvatar src={null} effect={frame} size="w-20 h-20" className="z-10 group-hover:scale-125 transition-transform duration-700" />
                   </div>
                   <div className="text-center w-full">
                     <span className="block text-[11px] font-black text-white uppercase tracking-tight mb-3 truncate opacity-80">{frame.label}</span>
                     <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">PREMIUM</span>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* ── 3. MODERN PLANLARIMIZ ── */}
        <section id="plans-section" className="py-32">
          <div className="text-center mb-20 px-4">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-6">
              PREMİUM <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">ÜYELİKLER</span>
            </h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">
              Sana en uygun paketi seç ve maceraya başla. Aethe paketi sınırlarına ulaşmadan yerini ayırt!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {plans.map((plan, idx) => {
              const isAethe = plan.id === 'aethe';
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative flex flex-col h-full rounded-[2.5rem] p-8 transition-all duration-500 group overflow-hidden ${
                    plan.is_popular 
                    ? 'bg-gradient-to-b from-amber-500/10 to-black border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)] md:-translate-y-4' 
                    : isAethe
                    ? 'bg-gradient-to-b from-rose-500/20 to-black border-2 border-rose-500/50 shadow-[0_0_50px_rgba(225,29,72,0.2)]'
                    : 'bg-white/[0.03] border border-white/10 hover:border-white/30 hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Etiketler */}
                  {plan.is_popular && (
                    <div className="absolute top-0 inset-x-0 mx-auto w-max px-6 py-1.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-b-xl shadow-lg">
                      En Popüler
                    </div>
                  )}
                  {isAethe && (
                    <div className="absolute top-0 inset-x-0 mx-auto w-max px-6 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-b-xl shadow-lg flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle size={12} /> Sadece 20 Kişi
                    </div>
                  )}

                  <div className={`mt-6 mb-8 text-center`}>
                    <h3 className={`text-xl font-black uppercase tracking-widest mb-4 ${
                      plan.color === 'cyan' ? 'text-cyan-400' :
                      plan.color === 'purple' ? 'text-purple-400' :
                      plan.color === 'rose' ? 'text-rose-400' :
                      'text-amber-400'
                    }`}>
                      {plan.name}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-4xl font-black text-white">₺{plan.price.toFixed(0)}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">{plan.duration}</span>

                    {plan.savings && (
                      <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Sparkles size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{plan.savings}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 mb-10">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${isAethe ? 'bg-rose-500/20 text-rose-400' : plan.is_popular ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-slate-300'}`}>
                          {isAethe && i === 1 ? <Infinity size={12} /> : <Check size={12} />}
                        </div>
                        <span className="text-xs font-bold text-slate-300 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleUpgrade(plan)}
                    className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 mt-auto ${
                      plan.is_popular 
                      ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                      : isAethe
                      ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isAethe ? 'Discord\'dan Satın Al' : 'Paketi Seç'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

      </div>

      <style>{`
        @keyframes marquee-slower {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-slower {
          animation: marquee-slower 120s linear infinite;
        }
      `}</style>
    </div>
  );
}
