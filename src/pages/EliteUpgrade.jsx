import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Check, ArrowRight, Zap, Star, Shield, 
  Monitor, Clock, Gift, Layout, Download, Sparkles,
  Palette, MessageSquare, Tag, Flame, Box, ZapOff,
  Users, Trophy, Rocket, Ghost
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import AnimeAvatar from '../components/AnimeAvatar';
import effectsData from '../data/effects.json';
import nameplatesData from '../data/nameplates.json';

export default function EliteUpgrade() {
  const { user, upgradeToElite } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Character Image (Generated Solo Leveling)
  const heroChar = "/premium_hero.png";

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPlans = async () => {
      const { data } = await supabase.from('pricing_plans').select('*').order('price', { ascending: true });
      
      // We will use the user's specific text/prices for the UI
      const customPlans = [
        {
          id: 'pro',
          name: 'ANIPEAK PRO',
          price: 75.00,
          duration: 'aylık',
          color: 'cyan',
          icon: 'Trophy',
          features: ['Reklamsız Deneyim', 'PRO Rozeti', 'Özel Discord Rolü', 'Sohbette Parlama', 'Temel Okuma Ayrıcalıkları']
        },
        {
          id: 'shadow',
          name: 'HÜKÜMDAR GÖLGESİ',
          price: 699.00,
          duration: 'yıllık',
          color: 'purple',
          icon: 'Ghost',
          is_yearly_only: true,
          savings: '₺201 İNDİRİM',
          features: ['Özel Profil Çerçeveleri', 'GÖLGE Rozeti', 'Erken Erişim Hakları', 'Özel Aura Efektleri', 'Discord Premium Kanal']
        },
        {
          id: 'ruler',
          name: 'HÜKÜMDAR',
          price: 999.00,
          duration: 'ömür boyu',
          color: 'amber',
          is_popular: true,
          is_lifetime: true,
          icon: 'Crown',
          features: ['Tüm Efektler ÜCRETSİZ', 'HÜKÜMDAR Mührü', 'Öncelikli Destek', 'Özel İsim Plakası', 'Tüm Gelecek Güncellemeler']
        }
      ];
      setPlans(customPlans);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleUpgrade = async (plan) => {
    if (!user) {
      const event = new CustomEvent('open-auth', { detail: 'login' });
      window.dispatchEvent(event);
      return;
    }
    const success = await upgradeToElite(plan.id);
    if (success) {
      navigate('/profile');
    }
  };

  const heroIcons = [
    { icon: <ZapOff size={16} />, label: "Reklamsız Deneyim" },
    { icon: <Clock size={16} />, label: "Erken Erişim" },
    { icon: <Gift size={16} />, label: "Özel İçerikler" },
    { icon: <Star size={16} />, label: "Premium Profil Simgeleri" },
    { icon: <Monitor size={16} />, label: "HD Kalite" },
    { icon: <Shield size={16} />, label: "7/24 Destek" },
  ];

  // For the infinite marquee, use all decorations
  const allDecorations = effectsData.filter(e => e.category === 'decorations');
  const marqueeList = [...allDecorations, ...allDecorations]; // Double for seamless loop

  return (
    <div className="min-h-screen bg-[#050508] pt-20 pb-32 relative overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* ── BACKGROUND DECOR ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-purple-600/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* ── 1. HERO SECTION ── */}
        <section className="relative flex flex-col md:flex-row items-center justify-between py-10 md:py-28 gap-8 md:gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 space-y-6 md:space-y-8 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-[10px] md:text-xs uppercase tracking-widest backdrop-blur-md">
               <Crown size={14} /> ANIPEAK PREMIUM
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white leading-[1.1] md:leading-[1.0] tracking-tighter">
              SINIRSIZ OKU. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500 animate-gradient-x">EFSANE OL.</span>
            </h1>
            <p className="text-base md:text-xl text-slate-400 max-w-xl font-medium leading-relaxed px-4 md:px-0">
              Reklamsız okuma, özel içerikler, eşsiz avantajlar ve benzersiz özelleştirme seçenekleri seni bekliyor.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-lg mx-auto md:mx-0">
              {heroIcons.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 md:gap-3 group">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-[10px] md:text-[12px] font-black text-slate-300 uppercase tracking-tight leading-tight text-left">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 justify-center md:justify-start">
              <button 
                onClick={() => document.getElementById('plans-section').scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-3 text-xs md:text-sm"
              >
                <Crown size={20} /> Premium'a Geç
              </button>
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md text-xs md:text-sm">
                Keşfet
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex-1 relative w-full max-w-[400px] md:max-w-none"
          >
             <div className="absolute inset-0 bg-purple-600/20 blur-[100px] rounded-full scale-75 animate-pulse" />
             <img src={heroChar} className="w-full relative z-10 drop-shadow-[0_0_80px_rgba(147,51,234,0.3)]" alt="Premium Hero" />
          </motion.div>
        </section>


        {/* ── 2. DEVASA CEPHANELİK (Infinite Marquee) ── */}
        <section className="py-24 border-y border-white/5 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent">
          <div className="text-center mb-20 px-4">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 uppercase">
              DEVASA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">CEPHANELİK</span>
            </h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[11px]">
              Sadece Premium üyelere özel {effectsData.length + nameplatesData.length}+ içerik anında envanterinde.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 mb-24 px-4">
            {[
              { val: nameplatesData.length, label: "İSİM PLAKASI" },
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

          {/* Avatar Infinite Marquee */}
          <div className="relative w-full overflow-hidden py-10">
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#050508] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#050508] to-transparent z-10" />
            
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

        {/* ── 3. PREMIUM ÖZELLİKLER SECTION ── */}
        <section className="py-24">
           <div className="flex items-center gap-3 mb-16 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Crown size={20} />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">PREMIUM ÖZELLİKLER</h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
             {[
               { icon: <Palette size={24} className="text-purple-400" />, title: "ÖZEL PROFİL ÖZELLEŞTİRME", desc: "Profilini eşsiz kıl! Çerçeveler, unvanlar, efektler ve daha fazlası." },
               { icon: <Sparkles size={24} className="text-blue-400" />, title: "OKUMA EFEKTLERİ", desc: "Okuma deneyimini özelleştir! Sayfa geçiş efektleri ve animasyonlar." },
               { icon: <Layout size={24} className="text-indigo-400" />, title: "ÖZEL TEMALAR", desc: "Kendi tarzını yansıt! Arayüz temaları ile platformu sana göre şekillendir." },
               { icon: <Flame size={24} className="text-amber-500" />, title: "ERKEN ERİŞİM", desc: "Yeni bölümlere herkesten önce sen ulaş! Popüler serilerin tadını çıkar." },
               { icon: <Download size={24} className="text-emerald-400" />, title: "İNDİR & OKU", desc: "İnternet olmadan da oku! Bölümleri indir, dilediğin yerde kesintisiz oku." }
             ].map((feature, i) => (
               <motion.div 
                 key={i} 
                 whileHover={{ y: -10 }}
                 className="p-8 rounded-[2.5rem] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 hover:border-white/20 transition-all group"
               >
                 <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all border border-white/5">
                   {feature.icon}
                 </div>
                 <h4 className="text-sm font-black text-white mb-3 uppercase tracking-tight leading-tight">{feature.title}</h4>
                 <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{feature.desc}</p>
               </motion.div>
             ))}
           </div>
        </section>

        {/* ── 4. PLANLARIMIZ SECTION (Cooler & Bottom) ── */}
        <section id="plans-section" className="py-24 border-t border-white/5 bg-gradient-to-b from-transparent to-purple-900/5">
          <div className="flex flex-col items-center justify-center mb-20 text-center px-4">
            <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-[0.4em] mb-3">
              <Box size={14} /> Üyelik Paketleri
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">PREMIUM PLANLAR</h2>
            <p className="text-slate-500 font-bold mt-4 tracking-wide max-w-lg">Sana en uygun rütbeyi seç ve siber dünyanın ayrıcalıklarını keşfet!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className={`relative p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col border-2 transition-all duration-700 group ${
                  plan.is_popular 
                  ? 'bg-gradient-to-br from-purple-900/40 via-black to-indigo-900/40 border-purple-500/50 md:scale-105 z-20 shadow-[0_40px_80px_rgba(168,85,247,0.2)]' 
                  : 'bg-zinc-950/80 border-white/10 z-10 hover:border-white/20'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-full shadow-2xl z-30 ring-4 ring-[#050508]">
                    ★ EN POPÜLER
                  </div>
                )}

                <div className="mb-8 md:mb-10">
                   <h3 className={`text-xl md:text-2xl font-black mb-2 uppercase tracking-tighter flex items-center gap-3 ${
                     plan.color === 'cyan' ? 'text-cyan-400' :
                     plan.color === 'purple' ? 'text-purple-400' :
                     'text-amber-400'
                   }`}>
                     {plan.name}
                   </h3>
                   
                   {plan.savings && (
                     <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4 animate-bounce-subtle">
                        <Sparkles size={10} className="text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{plan.savings}</span>
                     </div>
                   )}

                   <div className="flex items-baseline gap-2">
                     <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                       ₺{plan.price.toFixed(0)}
                     </span>
                     <span className="text-slate-500 text-[10px] md:text-sm font-black uppercase tracking-widest">
                       /{plan.duration}
                     </span>
                   </div>
                </div>

                <div className="space-y-5 mb-12 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-4 group/item">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        plan.is_popular ? 'bg-purple-500/20 border-purple-500/40' : 'bg-white/5 border-white/10'
                      }`}>
                        <Check size={10} className={plan.is_popular ? 'text-purple-400' : 'text-slate-500'} />
                      </div>
                      <span className="text-slate-300 text-[13px] font-bold tracking-tight group-hover/item:text-white transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleUpgrade(plan)}
                  className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden ${
                    plan.is_popular 
                    ? 'bg-white text-black shadow-2xl hover:scale-[1.05] active:scale-95' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span className="relative z-10">PLANI SEÇ</span>
                  {plan.is_popular && <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FOOTER TRUST ── */}
        <div className="flex flex-col items-center justify-center gap-6 py-24 border-t border-white/5">

           <div className="flex items-center gap-8 opacity-20 hover:opacity-100 transition-all duration-700">
             <Trophy size={32} className="text-white" />
             <div className="w-px h-8 bg-white/20" />
             <Rocket size={32} className="text-white" />
             <div className="w-px h-8 bg-white/20" />
             <Users size={32} className="text-white" />
           </div>
           <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em]">Güvenli Siber Ödeme Altyapısı</p>
        </div>

      </div>

      {/* Global Marquee Styles */}
      <style>{`
        @keyframes marquee-slower {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-slower {
          animation: marquee-slower 120s linear infinite;
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
