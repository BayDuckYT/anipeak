import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Check, ArrowRight, Zap, Star, Shield, 
  Monitor, Clock, Gift, Layout, Download, Sparkles,
  Palette, Box, Users, Trophy, Rocket, Ghost, Infinity, AlertTriangle, X,
  Flame, Calendar, Tag, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import AnimeAvatar from '../components/AnimeAvatar';
import effectsData from '../data/effects.json';
import nameplatesData from '../data/nameplates.json';
import { useSEO } from '../hooks/useSEO';

// ─── PLAN DATA ───────────────────────────────────────────────────────────────
const PLAN_DATA = [
  {
    id: 'pro',
    name: 'MAHORAPEAK PRO',
    basePrice: 75,
    oldPrice: 150,
    color: 'cyan',
    colorHex: '#06b6d4',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
    bgGlow: 'rgba(6,182,212,0.15)',
    icon: Trophy,
    aura: '25.000',
    duration: 'AYLIK',
    isSubscription: true,
    bgImage: '/plans/pro-bg.png',
    features: [
      '5 İsim Plakası & 10 Avatar Efekti', 
      'PRO Rozeti & Özel Profil Çerçevesi', 
      'Tamamen Reklamsız Okuma Deneyimi', 
      'Bölümleri Çevrimdışı İndirme', 
      'Sohbet ve Yorumlarda Özel Renk',
      'Aylık 25.000 Aura Puanı Kazanımı'
    ]
  },
  {
    id: 'shadow',
    name: 'HÜKÜMDAR GÖLGESİ',
    basePrice: 349,
    oldPrice: 699,
    color: 'purple',
    colorHex: '#a855f7',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-600',
    bgGlow: 'rgba(168,85,247,0.15)',
    icon: Ghost,
    aura: '50.000',
    duration: 'AYLIK',
    isSubscription: true,
    bgImage: '/plans/shadow-bg.png',
    features: [
      '15 İsim Plakası & 30 Avatar Efekti', 
      '10 İsim Efekti & Dinamik Çerçeveler', 
      'GÖLGE Rozeti & Gelişmiş Profil', 
      'Yeni Bölümlere Erken Erişim (+24 Saat)', 
      'Özel Yorum Stilleri & Sınırsız İndirme',
      'Discord Özel "Gölge" Rolü',
      'Aylık 50.000 Aura Puanı Kazanımı'
    ]
  },
  {
    id: 'ruler',
    name: 'HÜKÜMDAR',
    basePrice: 500,
    oldPrice: 1000,
    color: 'amber',
    colorHex: '#f59e0b',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-600',
    bgGlow: 'rgba(245,158,11,0.15)',
    icon: Crown,
    aura: '250.000',
    duration: 'ÖMÜR BOYU',
    is_popular: true,
    isSubscription: false,
    bgImage: '/plans/ruler-bg.png',
    features: [
      '30 İsim Plakası & 100 Avatar Efekti', 
      '25 İsim Efekti & Animasyonlu Çerçeveler', 
      'HÜKÜMDAR Rozeti & Hareketli Avatar', 
      'Yeni Bölümlere En Erken Erişim (+48 Saat)', 
      'Yorumlarda Sürekli Parlama Efekti',
      '7/24 Öncelikli VIP Destek',
      'Tüm Gelecek Güncellemeler Bedava',
      'Aylık 250.000 Aura Puanı Kazanımı'
    ]
  },
  {
    id: 'aethe',
    name: 'AETHE',
    basePrice: 1199,
    oldPrice: 1500,
    color: 'rose',
    colorHex: '#e11d48',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-red-800',
    bgGlow: 'rgba(225,29,72,0.15)',
    icon: Infinity,
    aura: '1.000.000',
    duration: 'ÖMÜR BOYU',
    is_limited: true,
    isSubscription: false,
    bgImage: '/plans/aethe-bg.png',
    features: [
      'Hükümdar Paketindeki TÜM Ayrıcalıklar',
      'Dört Efsanevi Haneden Birine Katılım',
      'Aethe Kutsal Alanı & Haneler Savaşı',
      'Efsanevi AETHE Mührü & Kan Kırmızı Aura', 
      'TÜM Efektlere Sınırsız Erişim (387+)', 
      'Sadece İlk 20 Kişiye Özel Kadim Statü',
      'Aylık 1.000.000 Aura Puanı Kazanımı'
    ]
  }
];

// ─── COLOR UTILS ─────────────────────────────────────────────────────────────
const getColorClasses = (color) => ({
  text: color === 'cyan' ? 'text-cyan-400' : color === 'purple' ? 'text-purple-400' : color === 'amber' ? 'text-amber-400' : 'text-rose-400',
  textLight: color === 'cyan' ? 'text-cyan-300' : color === 'purple' ? 'text-purple-300' : color === 'amber' ? 'text-amber-300' : 'text-rose-300',
  textDark: color === 'cyan' ? 'text-cyan-600' : color === 'purple' ? 'text-purple-600' : color === 'amber' ? 'text-amber-600' : 'text-rose-600',
  bg: color === 'cyan' ? 'bg-cyan-500' : color === 'purple' ? 'bg-purple-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500',
  bgLight: color === 'cyan' ? 'bg-cyan-500/10' : color === 'purple' ? 'bg-purple-500/10' : color === 'amber' ? 'bg-amber-500/10' : 'bg-rose-500/10',
  border: color === 'cyan' ? 'border-cyan-500/30' : color === 'purple' ? 'border-purple-500/30' : color === 'amber' ? 'border-amber-500/30' : 'border-rose-500/30',
  borderStrong: color === 'cyan' ? 'border-cyan-400' : color === 'purple' ? 'border-purple-400' : color === 'amber' ? 'border-amber-400' : 'border-rose-400',
  check: color === 'cyan' ? 'text-cyan-500' : color === 'purple' ? 'text-purple-500' : color === 'amber' ? 'text-amber-500' : 'text-rose-500',
  gradient: color === 'cyan' ? 'from-cyan-600 to-blue-600' : color === 'purple' ? 'from-purple-600 to-indigo-600' : color === 'amber' ? 'from-amber-500 to-yellow-600' : 'from-rose-700 to-red-900',
  shadow: color === 'cyan' ? 'shadow-cyan-500/40' : color === 'purple' ? 'shadow-purple-500/40' : color === 'amber' ? 'shadow-amber-500/40' : 'shadow-rose-500/40',
});

export default function EliteUpgrade() {
  const { user, upgradeToElite } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Promo Kodu State'leri
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState(null);

  // İndirim Kuponu State'leri (Modal içi)
  const [discountCode, setDiscountCode] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountData, setDiscountData] = useState(null);
  const [discountMsg, setDiscountMsg] = useState(null);

  // Modal Scroll Kilidi
  useEffect(() => {
    if (selectedPlan) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedPlan]);
  
  const [isGift, setIsGift] = useState(false);

  useSEO({
    title: 'Elite Premium',
    description: 'MahoraPeak Elite Premium üyelik. Özel dekorasyonlar, rozetler ve ayrıcalıklı özellikler.',
    url: 'https://mahorapeak.com.tr/elite-upgrade'
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleSelectPlan = (plan) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }
    setSelectedPlan(plan);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    if (selectedPlan.id === 'aethe' || isGift) {
      window.open('https://discord.gg/mahorapeak', '_blank');
      setSelectedPlan(null);
      setIsGift(false);
      return;
    }
    const success = await upgradeToElite(selectedPlan.id);
    if (success) {
      setSelectedPlan(null);
      navigate('/profile');
    }
  };

  const handleUsePromo = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }
    if (!promoCode.trim()) return;
    
    setPromoLoading(true);
    setPromoMsg(null);
    try {
      // Kodu veritabanından bul
      const { data: codeData, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();
        
      if (error || !codeData) throw new Error("Kod geçersiz veya bulunamadı.");
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) throw new Error("Bu kodun süresi dolmuş.");
      if (codeData.used_count >= codeData.max_uses) throw new Error("Bu kodun kullanım limiti dolmuş.");
      if (codeData.type !== 'elite') throw new Error("Bu kod Elite paketleri için geçerli değil.");
      
      // Kullanıcıya paketi tanımla
      const success = await upgradeToElite(codeData.value);
      if (success) {
        // Kodun kullanım sayısını artır
        await supabase.from('promo_codes')
          .update({ used_count: codeData.used_count + 1 })
          .eq('id', codeData.id);
          
        setPromoMsg({ type: 'success', text: 'Kod başarıyla kullanıldı! Paketiniz aktif edildi.' });
        setPromoCode('');
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        throw new Error("Paket tanımlanırken bir hata oluştu.");
      }
    } catch (err) {
      setPromoMsg({ type: 'error', text: err.message });
    } finally {
      setPromoLoading(false);
    }
  };

  const calcDiscount = (oldPrice, newPrice) => Math.round(((oldPrice - newPrice) / oldPrice) * 100);

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
             <Crown size={14} className="text-purple-400" /> MAHORAPEAK PREMIUM DENEYİMİ
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

        {/* ── 2. DEVASA CEPHANELİK ── */}
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

        {/* ── 3. PROMO KODU KULLANIMI ── */}
        <section className="py-16 flex justify-center">
          <div className="w-full max-w-lg p-6 md:p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="text-purple-400" size={24} />
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Hediye Kodu Kullan</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">Elinde bir Elite Paket kodu mu var? Buradan kodunu girerek paketi anında hesabına tanımlayabilirsin.</p>
            
            <div className="flex gap-3">
              <input 
                type="text" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Örn: PP-XXXX..."
                className="flex-grow bg-[#070511] border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase focus:border-purple-500/50 outline-none transition-all"
              />
              <button 
                onClick={handleUsePromo}
                disabled={promoLoading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {promoLoading ? 'Bekle...' : 'Kullan'}
              </button>
            </div>
            {promoMsg && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${promoMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {promoMsg.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                {promoMsg.text}
              </div>
            )}
          </div>
        </section>

        {/* ── 4. PREMİUM ÜYELİKLER ── */}
        <section id="plans-section" className="py-16">
          <div className="text-center mb-20 px-4">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-6">
              PREMİUM <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">ÜYELİKLER</span>
            </h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">
              Sana en uygun paketi seç ve maceraya başla. Aethe paketi sınırlarına ulaşmadan yerini ayırt!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-32">
            {PLAN_DATA.map((plan, idx) => {
              const cc = getColorClasses(plan.color);
              const discount = plan.oldPrice ? calcDiscount(plan.oldPrice, plan.basePrice) : null;
              const PlanIcon = plan.icon;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -8 }}
                  className={`relative flex flex-col w-full rounded-[2rem] overflow-hidden group cursor-pointer border bg-[#0c0b15] transition-all duration-500 ${
                    plan.is_popular ? `border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]` : 
                    plan.is_limited ? `border-rose-500/30 shadow-[0_0_25px_rgba(225,29,72,0.1)]` :
                    'border-white/[0.06] hover:border-white/10'
                  }`}
                  style={{ boxShadow: `0 0 80px ${plan.bgGlow}` }}
                >
                  {/* Background Image */}
                  <img 
                    src={plan.bgImage} 
                    alt={plan.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-[1.03] opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b15] via-[#0c0b15]/85 to-[#0c0b15]/40 z-[1] pointer-events-none" />

                  {/* Top Badges */}
                  <div className="relative z-[2] p-5 flex items-start justify-between">
                    {plan.is_popular && (
                      <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 backdrop-blur-md flex items-center gap-1.5">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">En Popüler</span>
                      </div>
                    )}
                    {plan.is_limited && (
                      <div className="px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/50 backdrop-blur-md flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle size={10} className="text-rose-400" />
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Son 20 Kişi</span>
                      </div>
                    )}
                    {!plan.is_popular && !plan.is_limited && <div />}
                    
                    {/* Aura Badge */}
                    {plan.aura && (
                      <div className={`px-3 py-1.5 rounded-full ${cc.bgLight} border ${cc.border} backdrop-blur-md flex items-center gap-1.5`}>
                        <Flame size={10} className={cc.text} />
                        <span className={`text-[9px] font-black ${cc.text} uppercase tracking-widest`}>{plan.aura} Aura/Ay</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="relative z-[2] flex flex-col flex-grow px-6 pb-6 pt-16">
                    
                    {/* Plan Icon & Name */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cc.gradient} flex items-center justify-center shadow-lg ${cc.shadow}`}>
                        <PlanIcon size={20} className="text-white" />
                      </div>
                      <h3 className={`text-lg font-black uppercase tracking-wider ${cc.text}`}>{plan.name}</h3>
                    </div>

                    {/* Price Block */}
                    <div className="mb-6 border-b border-white/5 pb-6">
                      {/* Old Price with Strikethrough */}
                      {plan.oldPrice && (
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg text-slate-500 line-through font-bold">{plan.oldPrice} TL</span>
                          <div className={`px-2.5 py-1 rounded-lg ${cc.bgLight} border ${cc.border}`}>
                            <span className={`text-[10px] font-black ${cc.text} uppercase tracking-wider`}>%{discount} İNDİRİM</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Current Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl lg:text-5xl font-black text-white">{plan.basePrice}</span>
                        <span className="text-lg font-bold text-slate-400">TL</span>
                      </div>
                      
                      {/* Duration */}
                      <span className={`text-[11px] font-black uppercase tracking-[0.2em] mt-1 inline-block ${cc.textDark}`}>
                        {plan.duration}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="space-y-3.5 mb-8 flex-grow">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`mt-0.5 shrink-0 ${cc.check}`}>
                            <Check size={15} strokeWidth={3} />
                          </div>
                          <span className="text-[13px] font-semibold text-slate-300 leading-snug">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 border bg-gradient-to-r ${cc.gradient} ${cc.borderStrong} text-white hover:scale-[1.03] hover:shadow-lg ${cc.shadow} active:scale-[0.98]`}
                    >
                      <PlanIcon size={16} />
                      <span>{plan.id === 'aethe' ? 'DISCORD\'DAN AL' : 'PAKETİ SEÇ'}</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── 5. KARŞILAŞTIRMA TABLOSU ── */}
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
                  {[
                    { label: 'Reklamsız Okuma', pro: true, shadow: true, ruler: true, aethe: true },
                    { label: 'Aura Puanı Kazanımı', pro: 'Aylık 25.000', shadow: 'Aylık 50.000', ruler: 'Aylık 250.000', aethe: 'Aylık 1.000.000' },
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

      {/* ── PURCHASE CONFIRMATION MODAL ── */}
      {createPortal(
        <AnimatePresence>
          {selectedPlan && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => { setSelectedPlan(null); setDiscountCode(''); setDiscountData(null); setDiscountMsg(null); }} />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar rounded-[2.5rem] border border-white/10 bg-[#0c0b15] shadow-2xl"
              style={{ boxShadow: `0 0 100px ${selectedPlan.bgGlow}` }}
            >
              {/* Modal Header */}
              <div className="relative p-8 pb-6">
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                
                <button 
                  onClick={() => { setSelectedPlan(null); setDiscountCode(''); setDiscountData(null); setDiscountMsg(null); }} 
                  className="absolute top-5 right-5 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getColorClasses(selectedPlan.color).gradient} flex items-center justify-center shadow-lg`}>
                      <selectedPlan.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-black uppercase tracking-wider ${getColorClasses(selectedPlan.color).text}`}>{selectedPlan.name}</h3>
                      <p className="text-xs text-slate-500 font-bold">{selectedPlan.isSubscription ? 'Abonelik Planı' : 'Tek Seferlik Satın Alma'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Summary */}
              <div className="px-8 pb-4">
                <div className={`p-5 rounded-2xl ${getColorClasses(selectedPlan.color).bgLight} border ${getColorClasses(selectedPlan.color).border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">
                        {selectedPlan.isSubscription ? 'Aylık Ödeme' : 'Tek Seferlik Ödeme'}
                      </p>
                      <div className="flex items-baseline gap-2">
                        {selectedPlan.oldPrice && (
                          <span className="text-lg text-slate-500 line-through font-bold">{selectedPlan.oldPrice} TL</span>
                        )}
                        <span className="text-3xl font-black text-white">{selectedPlan.basePrice} TL</span>
                      </div>
                    </div>
                    {selectedPlan.oldPrice && (
                      <div className={`px-3 py-1.5 rounded-xl ${getColorClasses(selectedPlan.color).bgLight} border ${getColorClasses(selectedPlan.color).border}`}>
                        <span className={`text-sm font-black ${getColorClasses(selectedPlan.color).text}`}>
                          %{calcDiscount(selectedPlan.oldPrice, selectedPlan.basePrice)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs font-bold mt-3 ${getColorClasses(selectedPlan.color).textDark}`}>
                    {selectedPlan.isSubscription ? 'Her ay yenilenir. İstediğin zaman iptal edebilirsin.' : 'Ömür boyu geçerli. Bir kez öde, sonsuza kadar kullan.'}
                  </p>
                </div>
              </div>

              {/* ── İNDİRİM KODU ALANI ── */}
              <div className="px-8 py-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Tag size={12} /> İndirim Kodun Var Mı?
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Örn: SEPETTE150"
                      className="flex-grow bg-[#070511] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono uppercase focus:border-amber-500/50 outline-none transition-all"
                    />
                    <button 
                      onClick={async () => {
                        if (!discountCode.trim()) return;
                        setDiscountLoading(true);
                        setDiscountMsg(null);
                        try {
                          const { data: dc, error } = await supabase
                            .from('promo_codes')
                            .select('*')
                            .eq('code', discountCode.trim().toUpperCase())
                            .eq('type', 'discount')
                            .eq('is_active', true)
                            .single();
                          if (error || !dc) throw new Error("Geçersiz veya bulunamayan kod.");
                          if (dc.expires_at && new Date(dc.expires_at) < new Date()) throw new Error("Bu kodun süresi dolmuş.");
                          if (dc.used_count >= dc.max_uses) throw new Error("Bu kodun kullanım limiti dolmuş.");
                          if (dc.applies_to !== 'all' && dc.applies_to !== 'elite') throw new Error("Bu kod Elite paketleri için geçerli değil.");
                          if (dc.min_amount > 0 && selectedPlan.basePrice < dc.min_amount) throw new Error(`Bu kod minimum ${dc.min_amount} TL tutarındaki siparişlerde geçerlidir.`);
                          
                          setDiscountData(dc);
                          setDiscountMsg({ type: 'success', text: 'İndirim kodu uygulandı!' });
                        } catch (err) {
                          setDiscountData(null);
                          setDiscountMsg({ type: 'error', text: err.message });
                        } finally {
                          setDiscountLoading(false);
                        }
                      }}
                      disabled={discountLoading}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {discountLoading ? '...' : 'Uygula'}
                    </button>
                  </div>
                  {discountMsg && (
                    <div className={`mt-3 p-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${discountMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {discountMsg.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                      {discountMsg.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary & Purchase */}
              <div className="px-8 pb-8 pt-4">
                {/* Total Display */}
                <div className="flex items-center justify-between mb-6 px-2">
                  <span className="text-sm font-bold text-slate-400">Toplam Tutar</span>
                  <div className="text-right">
                    {discountData ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-slate-500 line-through">{selectedPlan.basePrice} TL</span>
                        <div>
                          <span className="text-3xl font-black text-emerald-400">
                            {discountData.discount_type === 'percent' 
                              ? Math.max(0, Math.round(selectedPlan.basePrice * (1 - discountData.discount_value / 100)))
                              : Math.max(0, selectedPlan.basePrice - discountData.discount_value)
                            }
                          </span>
                          <span className="text-lg font-bold text-slate-400 ml-1.5">TL</span>
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold">
                          {discountData.discount_type === 'percent' ? `%${discountData.discount_value} indirim uygulandı` : `${discountData.discount_value} TL indirim uygulandı`}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-white">{selectedPlan.basePrice}</span>
                        <span className="text-lg font-bold text-slate-400 ml-1.5">TL</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Hediye Et Checkbox */}
                <div className="mb-6 px-2">
                  <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsGift(!isGift)}>
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isGift ? `bg-gradient-to-r ${getColorClasses(selectedPlan.color).gradient} ${getColorClasses(selectedPlan.color).borderStrong}` : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                      {isGift && <Check size={14} className="text-white" />}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Hediye Et (Başkası İçin Kod Al)</span>
                      <span className="block text-[10px] text-slate-500">Seçildiğinde Discord üzerinden bir hediye kodu oluşturulacaktır.</span>
                    </div>
                  </label>
                </div>

                {/* Purchase Button */}
                <button 
                  onClick={handlePurchase}
                  className={`w-full py-5 rounded-2xl font-black text-base uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 border bg-gradient-to-r ${getColorClasses(selectedPlan.color).gradient} ${getColorClasses(selectedPlan.color).borderStrong} text-white hover:scale-[1.02] hover:shadow-xl ${getColorClasses(selectedPlan.color).shadow} active:scale-[0.98]`}
                >
                  <Sparkles size={18} />
                  {isGift ? "HEDİYE KODU AL" : (selectedPlan.id === 'aethe' ? 'DISCORD\'DAN SATIN AL' : 'SATIN AL')}
                </button>

                <p className="text-center text-[10px] text-slate-600 mt-4 font-medium">
                  {isGift ? "Hediye kodu satın almak için Discord sunucumuzdan destek talebi oluşturun." : "Satın alma işlemi Discord sunucumuz üzerinden gerçekleştirilmektedir."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}

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
