import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Check, ArrowRight, Zap, Star, Shield, 
  Monitor, Clock, Gift, Layout, Download, Sparkles,
  Palette, MessageSquare, Tag, Flame
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
      if (data && data.length > 0) {
        setPlans(data);
      } else {
        // Fallback to match Photo 2
        setPlans([
          {
            id: 'basic',
            name: 'BASIC',
            price: 19.99,
            duration: 'aylık',
            color: 'slate',
            icon: 'Zap',
            features: ['Reklamsız okuma', 'Sınırsız bölüm erişimi', 'Temel okuma deneyimi', 'Favori listesi', 'Özel profil özelleştirme']
          },
          {
            id: 'premium',
            name: 'PREMIUM',
            price: 39.99,
            old_price: 49.99,
            duration: 'aylık',
            color: 'purple',
            is_popular: true,
            icon: 'Crown',
            features: ['Reklamsız okuma', 'Sınırsız bölüm erişimi', 'Erken erişim (Yeni bölümler)', 'Özel içerikler & bölümler', 'Premium profil özelleştirme', 'HD & Full HD kalite', 'İndirme & çevrimdışı okuma', '7/24 öncelikli destek']
          },
          {
            id: 'ultimate',
            name: 'ULTIMATE',
            price: 79.99,
            old_price: 99.99,
            duration: 'aylık',
            color: 'amber',
            icon: 'Flame',
            features: ['Premium planın tüm özellikleri +', 'VIP rozet & özel simge', 'Özel okuma efektleri', 'Animasyonlu profil çerçeveleri', 'Özel tema ve arayüz', 'Sınırsız bulut kaydı', 'Özel topluluk ayrıcalıkları', 'Beta özelliklere erken erişim']
          }
        ]);
      }
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
    { icon: <Zap size={16} />, label: "Reklamsız Deneyim" },
    { icon: <Clock size={16} />, label: "Erken Erişim" },
    { icon: <Gift size={16} />, label: "Özel İçerikler" },
    { icon: <Star size={16} />, label: "Premium Profil Simgeleri" },
    { icon: <Monitor size={16} />, label: "HD Kalite" },
    { icon: <Shield size={16} />, label: "7/24 Destek" },
  ];

  const showcaseFrames = effectsData.filter(e => e.category === 'decorations').slice(0, 6);

  return (
    <div className="min-h-screen bg-[#050508] pt-20 pb-32 relative overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* ── HERO SECTION (Matching Photo 2) ── */}
        <section className="relative flex flex-col md:flex-row items-center justify-between py-16 md:py-24 gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 space-y-8 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-xs uppercase tracking-widest">
               <Crown size={14} /> ANIPEAK PREMIUM
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
              SINIRSIZ OKU. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">EFSANE OL.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl font-medium leading-relaxed">
              Reklamsız okuma, özel içerikler, eşsiz avantajlar ve benzersiz özelleştirme seçenekleri seni bekliyor.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg">
              {heroIcons.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-6 justify-center md:justify-start">
              <button 
                onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(147,51,234,0.3)] hover:scale-105 transition-all flex items-center gap-2"
              >
                <Crown size={18} /> Premium'a Geç
              </button>
              <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Tüm Özellikleri İncele
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1 }}
            className="flex-1 relative"
          >
             <div className="absolute inset-0 bg-purple-500/20 blur-[120px] rounded-full scale-75 animate-pulse" />
             <img src={heroChar} className="w-full max-w-[550px] relative z-10 drop-shadow-[0_0_100px_rgba(147,51,234,0.4)]" alt="Premium Hero" />
          </motion.div>
        </section>

        {/* ── PLANLARIMIZ SECTION (Matching Photo 2) ── */}
        <section id="plans" className="py-24">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-[0.3em] mb-2">
                <Layout size={14} /> Üyelik Paketleri
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">PLANLARIMIZ</h2>
              <p className="text-slate-500 font-medium mt-2">Sana en uygun planı seç ve ayrıcalıkları keşfet!</p>
            </div>

            <div className="flex items-center gap-6 p-2 bg-white/5 border border-white/10 rounded-2xl">
               <button 
                 onClick={() => setIsYearly(false)}
                 className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!isYearly ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}
               >
                 AYLIK ÖDEME
               </button>
               <button 
                 onClick={() => setIsYearly(true)}
                 className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${isYearly ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}
               >
                 YILLIK ÖDEME <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md text-[9px]">%20 İNDİRİM</span>
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`relative p-8 rounded-[2.5rem] flex flex-col border transition-all duration-500 group ${
                  plan.is_popular 
                  ? 'bg-gradient-to-b from-purple-900/20 to-black border-purple-500/40 scale-105 z-20 shadow-[0_0_60px_rgba(168,85,247,0.15)]' 
                  : 'bg-white/3 border-white/10 z-10'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg z-30">
                    ★ EN POPÜLER
                  </div>
                )}

                <div className="mb-8">
                   <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter flex items-center gap-3">
                     {plan.name} {plan.id === 'basic' && <span className="bg-white/10 text-slate-400 px-2 py-0.5 rounded text-[10px]">Temel</span>}
                     {plan.id === 'ultimate' && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px]">En İyi Deneyim</span>}
                   </h3>
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-black text-white">₺{isYearly ? (plan.price * 10).toFixed(2) : plan.price.toFixed(2)}</span>
                     <span className="text-slate-500 text-sm font-bold">/{isYearly ? 'yıllık' : 'aylık'}</span>
                     {plan.old_price && (
                       <span className="ml-2 text-slate-600 line-through text-sm">₺{isYearly ? (plan.old_price * 10).toFixed(2) : plan.old_price.toFixed(2)}</span>
                     )}
                   </div>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check size={14} className={plan.is_popular ? 'text-purple-400 mt-1' : 'text-slate-500 mt-1'} />
                      <span className="text-slate-300 text-sm font-medium leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleUpgrade(plan)}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    plan.is_popular 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02]' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.id === 'premium' ? "Premium'a Geç" : "Planı Seç"}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── DEVASA CEPHANELİK (Matching Photo 1) ── */}
        <section className="py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-[1.2] mb-4 uppercase">
              DEVASA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">CEPHANELİK</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">
              Sadece Premium üyelere özel {effectsData.length + nameplatesData.length}+ içerik anında envanterinde.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 mb-24">
            {[
              { val: 50, label: "İSİM PLAKASI" },
              { val: 198, label: "AVATAR EFEKTİ" },
              { val: 26, label: "PROFİL EFEKTİ" },
              { val: 22, label: "ÜLKE BAYRAĞI" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <span className="block text-5xl md:text-6xl font-black text-white mb-2 transition-transform group-hover:scale-110">{stat.val}</span>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Avatar Effects Grid (Matching Photo 1 Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {showcaseFrames.map((frame, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative flex flex-col items-center justify-between p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/8 backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/20 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                   <div className="absolute w-20 h-20 rounded-full bg-black/60 border border-white/5 group-hover:scale-105 transition-transform" />
                   <AnimeAvatar src={null} effect={frame} size="w-20 h-20" className="z-10 group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="text-center relative z-10 w-full">
                  <span className="block text-[11px] font-black text-white uppercase tracking-tight mb-3 truncate">{frame.label}</span>
                  <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                     <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">PREMIUM</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── PREMIUM ÖZELLİKLER SECTION (Photo 2 Bottom) ── */}
        <section className="py-24 border-t border-white/5">
           <div className="flex items-center gap-3 mb-12">
              <Crown className="text-amber-400" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">PREMIUM ÖZELLİKLER</h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
             {[
               { icon: <Palette className="text-purple-400" />, title: "ÖZEL PROFİL ÖZELLEŞTİRME", desc: "Profilini eşsiz kıl! Çerçeveler, unvanlar, efektler ve daha fazlası." },
               { icon: <Sparkles className="text-blue-400" />, title: "OKUMA EFEKTLERİ", desc: "Okuma deneyimini özelleştir! Sayfa geçiş efektleri ve animasyonlar." },
               { icon: <Layout className="text-indigo-400" />, title: "ÖZEL TEMALAR", desc: "Kendi tarzını yansıt! Arayüz temaları ile platformu sana göre şekillendir." },
               { icon: <Flame className="text-amber-500" />, title: "ERKEN ERİŞİM", desc: "Yeni bölümlere herkesten önce sen ulaş! Popüler serilerin tadını çıkar." },
               { icon: <Download className="text-emerald-400" />, title: "İNDİR & OKU", desc: "İnternet olmadan da oku! Bölümleri indir, dilediğin yerde kesintisiz oku." }
             ].map((feature, i) => (
               <div key={i} className="p-6 rounded-3xl bg-white/3 border border-white/8 hover:border-white/15 transition-all group">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   {feature.icon}
                 </div>
                 <h4 className="text-[11px] font-black text-white mb-2 uppercase tracking-tight">{feature.title}</h4>
                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
               </div>
             ))}
           </div>
        </section>

      </div>
    </div>
  );
}
