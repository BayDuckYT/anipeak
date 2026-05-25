import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Check, ArrowRight, Zap, Star, Shield, 
  Monitor, Clock, Gift, Layout, Download, Sparkles,
  Palette, Box, Users, Trophy, Rocket, Ghost, Infinity, AlertTriangle, X
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
        duration: 'AYLIK',
        color: 'cyan',
        bgImage: '/plans/pro-bg.png',
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
        bgImage: '/plans/shadow-bg.png',
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
        bgImage: '/plans/ruler-bg.png',
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
        bgImage: '/plans/aethe-bg.png',
        features: [
          'Hükümdar Paketindeki TÜM Ayrıcalıklar',
          'Dört Efsanevi Haneden Birine Katılım',
          'Aethe Kutsal Alanı & Haneler Savaşı',
          'Efsanevi AETHE Mührü & Kan Kırmızı Aura', 
          'TÜM Efektlere Sınırsız Erişim (387+)', 
          'Sadece İlk 20 Kişiye Özel Kadim Statü'
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 mb-32">
            {plans.map((plan, idx) => {
              const isAethe = plan.id === 'aethe';
              
              // Her pakete özel buton renk şeması (Glow, Gradient, Hover efekti)
              const buttonClasses = {
                cyan: 'bg-cyan-600 border-cyan-400 text-white hover:bg-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]',
                purple: 'bg-purple-600 border-purple-400 text-white hover:bg-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]',
                amber: 'bg-gradient-to-r from-amber-500 to-yellow-600 border-yellow-400 text-black hover:from-yellow-400 hover:to-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.8)]',
                rose: 'bg-gradient-to-r from-rose-700 to-red-900 border-red-500 text-white hover:from-red-600 hover:to-rose-800 hover:shadow-[0_0_40px_rgba(225,29,72,0.9)] animate-pulse hover:animate-none'
              };

              // Buton ikonları
              const buttonIcons = {
                cyan: <Trophy size={16} className="text-cyan-200" />,
                purple: <Ghost size={16} className="text-purple-200" />,
                amber: <Crown size={16} className="text-yellow-900" />,
                rose: <Infinity size={16} className="text-rose-200" />
              };

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.03, y: -10 }}
                  className="relative flex flex-col w-full rounded-[2rem] overflow-hidden group cursor-pointer border border-white/5 bg-[#0A0A10]"
                >
                  {/* Arkaplan Görseli (Tasarımın Kendisi, kendi boyutunda) */}
                  <div className="h-48 w-full overflow-hidden relative">
                    <img 
                      src={plan.bgImage} 
                      alt={plan.name}
                      loading="lazy"
                      className="w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A10] to-transparent z-10" />
                  </div>

                  {/* İçerik Konteyneri */}
                  <div className="relative z-20 flex flex-col flex-grow p-6 -mt-12">
                    
                    {/* Üstteki etiketler */}
                    {plan.savings && (
                      <div className="absolute top-0 right-6 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-md">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{plan.savings}</span>
                      </div>
                    )}
                    {plan.is_popular && (
                      <div className="absolute top-0 right-6 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 backdrop-blur-md flex items-center gap-1">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">En Popüler</span>
                      </div>
                    )}
                    {isAethe && (
                      <div className="absolute top-0 right-6 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 backdrop-blur-md flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={10} className="text-rose-400" />
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Son 20 Kişi</span>
                      </div>
                    )}

                    {/* Fiyat ve Süre */}
                    <div className="mb-6 mt-4 border-b border-white/5 pb-6">
                      <h3 className={`text-xl font-black uppercase tracking-wider mb-2 ${
                        plan.color === 'cyan' ? 'text-cyan-400' :
                        plan.color === 'purple' ? 'text-purple-400' :
                        plan.color === 'amber' ? 'text-amber-400' :
                        'text-rose-400'
                      }`}>{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-4xl lg:text-5xl font-black text-white">₺{plan.price.toFixed(0)}</span>
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        {plan.duration}
                      </span>
                    </div>

                    {/* Özellikler */}
                    <div className="space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 group/item">
                          <div className={`mt-1 shrink-0 ${
                            plan.color === 'cyan' ? 'text-cyan-500' :
                            plan.color === 'purple' ? 'text-purple-500' :
                            plan.color === 'amber' ? 'text-amber-500' :
                            'text-rose-500'
                          }`}>
                            <Check size={16} strokeWidth={3} />
                          </div>
                          <span className="text-sm font-bold text-slate-300 leading-snug">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Aksiyon Butonu */}
                    <button 
                      onClick={() => handleUpgrade(plan)}
                      className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.1em] transition-all duration-300 flex items-center justify-center gap-2 ${buttonClasses[plan.color]}`}
                    >
                      {buttonIcons[plan.color]}
                      <span>{isAethe ? 'DISCORD\'DAN AL' : 'PAKETİ SEÇ'}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── 4. KARŞILAŞTIRMA TABLOSU ── */}
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-4">
                ÖZELLİK <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">KARŞILAŞTIRMASI</span>
              </h2>
              <p className="text-slate-400 text-sm font-medium">Hangi efsanevi paketin sana uygun olduğunu detaylıca incele.</p>
            </div>

            <div className="overflow-x-auto custom-scrollbar pb-6">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr>
                    <th className="p-6 text-left border-b border-white/10 w-1/3">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Özellik</span>
                    </th>
                    <th className="p-6 text-center border-b border-white/10">
                      <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">PRO</span>
                    </th>
                    <th className="p-6 text-center border-b border-white/10 bg-purple-900/10 rounded-t-xl">
                      <span className="text-sm font-black text-purple-400 uppercase tracking-widest">GÖLGE</span>
                    </th>
                    <th className="p-6 text-center border-b border-amber-500/30 bg-amber-900/10 rounded-t-xl">
                      <span className="text-sm font-black text-amber-400 uppercase tracking-widest">HÜKÜMDAR</span>
                    </th>
                    <th className="p-6 text-center border-b border-white/10">
                      <span className="text-sm font-black text-rose-400 uppercase tracking-widest">AETHE</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-slate-300">
                  {/* Satır Öğeleri */}
                  {[
                    { label: 'Reklamsız Okuma', pro: true, shadow: true, ruler: true, aethe: true },
                    { label: 'Bölümleri Çevrimdışı İndirme', pro: 'Limitli (Günlük 10)', shadow: 'Sınırsız', ruler: 'Sınırsız', aethe: 'Sınırsız' },
                    { label: 'Özel Profil Çerçevesi', pro: true, shadow: 'Dinamik', ruler: 'Animasyonlu', aethe: 'Efsanevi Kırmızı Aura' },
                    { label: 'Sohbet ve Yorum Rengi', pro: 'Mavi Ton', shadow: 'Mor Ton', ruler: 'Altın Parlaması', aethe: 'Kan Kırmızısı Efekti' },
                    { label: 'Yeni Bölümlere Erken Erişim', pro: false, shadow: '+24 Saat', ruler: '+48 Saat', aethe: '+48 Saat' },
                    { label: 'Discord Özel Rolü', pro: false, shadow: 'Gölge Rolü', ruler: 'Hükümdar Rolü', aethe: 'Kadim Aethe Rolü' },
                    { label: 'İsim Plakası', pro: '5 Adet', shadow: '15 Adet', ruler: '30 Adet', aethe: 'Tümü Açık' },
                    { label: 'Avatar Efekti', pro: '10 Adet', shadow: '30 Adet', ruler: '100 Adet', aethe: 'Tümü Açık' },
                    { label: 'VIP Müşteri Desteği', pro: false, shadow: false, ruler: '7/24 Öncelikli', aethe: '7/24 Direkt Hat' },
                    { label: 'Haneler Savaşına Katılım', pro: false, shadow: false, ruler: false, aethe: true }
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-6 text-slate-400">{row.label}</td>
                      <td className="p-6 text-center">
                        {typeof row.pro === 'boolean' ? (row.pro ? <Check size={20} className="mx-auto text-cyan-400" /> : <X size={20} className="mx-auto text-slate-700" />) : <span className="text-cyan-200">{row.pro}</span>}
                      </td>
                      <td className="p-6 text-center bg-purple-900/5">
                        {typeof row.shadow === 'boolean' ? (row.shadow ? <Check size={20} className="mx-auto text-purple-400" /> : <X size={20} className="mx-auto text-slate-700" />) : <span className="text-purple-200">{row.shadow}</span>}
                      </td>
                      <td className="p-6 text-center bg-amber-900/5 border-l border-r border-amber-500/10">
                        {typeof row.ruler === 'boolean' ? (row.ruler ? <Check size={20} className="mx-auto text-amber-400" /> : <X size={20} className="mx-auto text-slate-700" />) : <span className="text-amber-200">{row.ruler}</span>}
                      </td>
                      <td className="p-6 text-center">
                        {typeof row.aethe === 'boolean' ? (row.aethe ? <Check size={20} className="mx-auto text-rose-400" /> : <X size={20} className="mx-auto text-slate-700" />) : <span className="text-rose-200">{row.aethe}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
