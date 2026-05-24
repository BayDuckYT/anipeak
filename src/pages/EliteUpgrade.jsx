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
        name: 'PRO',
        subtitle: 'ÜYELİK',
        price: 75.00,
        duration: 'AYLIK',
        color: 'cyan',
        bgImage: '/plans/pro.png',
        features: [
          '5 İsim Plakası & 10 Avatar Efekti', 
          'PRO Rozeti & Özel Profil Çerçevesi', 
          'Tamamen Reklamsız Okuma Deneyimi', 
          'Bölümleri Çevrimdışı İndirme', 
          'Sohbet ve Yorumlarda Özel Renk'
        ]
      },
      {
        id: 'shadow',
        name: 'HÜKÜMDAR GÖLGESİ',
        price: 699.00,
        duration: 'YILLIK',
        color: 'purple',
        savings: '₺201 İNDİRİM',
        bgImage: '/plans/shadow.png',
        features: [
          '15 İsim Plakası & 30 Avatar Efekti', 
          '10 İsim Efekti & Dinamik Çerçeveler', 
          'GÖLGE Rozeti & Gelişmiş Profil', 
          'Yeni Bölümlere Erken Erişim (+24 Saat)', 
          'Özel Yorum Stilleri & Sınırsız İndirme',
          'Discord Özel "Gölge" Rolü'
        ]
      },
      {
        id: 'ruler',
        name: 'HÜKÜMDAR',
        price: 999.00,
        duration: 'ÖMÜR BOYU',
        color: 'amber',
        is_popular: true,
        bgImage: '/plans/ruler.png',
        features: [
          '30 İsim Plakası & 100 Avatar Efekti', 
          '25 İsim Efekti & Animasyonlu Çerçeveler', 
          'HÜKÜMDAR Rozeti & Hareketli Avatar', 
          'Yeni Bölümlere En Erken Erişim (+48 Saat)', 
          'Yorumlarda Sürekli Parlama Efekti',
          '7/24 Öncelikli VIP Destek',
          'Tüm Gelecek Güncellemeler Bedava'
        ]
      },
      {
        id: 'aethe',
        name: 'AETHE',
        price: 1500.00,
        duration: 'ÖMÜR BOYU',
        color: 'rose',
        is_limited: true,
        bgImage: '/plans/aethe.png',
        features: [
          'Sadece İlk 20 Kişiye Özel Sınır!', 
          'Dört Efsanevi Haneden Birine Katılım',
          'Aethe Kutsal Alanı (Karargah) Erişimi',
          'Haneler Arası Kadim Savaş & Turnuvalar',
          'Efsanevi AETHE Mührü & Kan Kırmızı Aura', 
          'Tüm Efektlere Sınırsız Erişim (387+)', 
          'Discord Efsanevi AETHE Rolü'
        ]
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

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 px-4">
            {plans.map((plan, idx) => {
              const isAethe = plan.id === 'aethe';
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative flex flex-col h-full rounded-3xl p-6 md:p-8 pt-[220px] pb-8 transition-all duration-500 group overflow-hidden bg-cover bg-center bg-no-repeat ${
                    plan.is_popular 
                    ? 'shadow-[0_0_50px_rgba(245,158,11,0.15)] xl:-translate-y-4' 
                    : isAethe
                    ? 'shadow-[0_0_50px_rgba(225,29,72,0.2)]'
                    : 'hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                  }`}
                  style={{ backgroundImage: \`url(\${plan.bgImage})\` }}
                >
                  <div className="absolute inset-0 bg-black/40 xl:bg-transparent z-0"></div>

                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="mt-auto text-center">
                      {/* Fiyat Alanı - Resimdeki gibi görünüm */}
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-5xl font-black text-white tracking-tighter">₺{plan.price.toFixed(0)}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{plan.duration}</span>

                      {plan.savings && (
                        <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                          <Sparkles size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{plan.savings}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mt-8 mb-8">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${isAethe ? 'text-rose-400' : plan.is_popular ? 'text-amber-400' : 'text-blue-400'}`}>
                            {isAethe && i === 1 ? <Infinity size={14} /> : <Check size={14} />}
                          </div>
                          <span className="text-[11px] md:text-xs font-medium text-slate-300 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => handleUpgrade(plan)}
                      className={`w-full py-4 mt-auto rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 border ${
                        plan.is_popular 
                        ? 'bg-amber-600/90 text-white border-amber-500 hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                        : isAethe
                        ? 'bg-rose-700/90 text-white border-rose-500 hover:bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                        : 'bg-blue-600/80 text-white border-blue-500 hover:bg-blue-500'
                      } backdrop-blur-md`}
                    >
                      {isAethe ? 'DISCORD\'DAN SATIN AL' : 'PAKETİ SEÇ'}
                    </button>
                  </div>
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
