import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Crown, Check, ArrowRight, Palette, CircleSlash, Box, Image as ImageIcon, Star, Sparkles, MessageSquare, Tag, Layout, Ghost, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import AnimeAvatar from '../components/AnimeAvatar';
import effectsData from '../data/effects.json';
import nameplatesData from '../data/nameplates.json';
import { ELITE_BUNDLES } from '../lib/eliteBundles';

export default function EliteUpgrade() {
  const { user, upgradeToElite } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPlans = async () => {
      const { data } = await supabase.from('pricing_plans').select('*').order('price', { ascending: true });
      setPlans(data || []);
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
      alert(`Tebrikler! ${plan.name} paketine geçiş yaptın. Sınırsız güce eriştin.`);
      navigate('/profile');
    }
  };

  const getIcon = (iconName, color) => {
    const props = { size: 28, className: `text-${color}-400` };
    switch (iconName) {
      case 'Zap': return <Zap {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'Ghost': return <Ghost {...props} />;
      case 'Star': return <Star {...props} />;
      default: return <Zap {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] pt-24 pb-32 relative overflow-hidden font-sans">
      {/* ── ARKA PLAN EFEKTLERİ ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] right-1/4 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 space-y-32">
        
        {/* ── HERO BÖLÜMÜ ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center pt-10"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.3em] mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <Crown size={14} className="text-amber-400" /> Sınırları Kaldır
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none">
            ANIPEAK <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
              PREMIUM
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium mb-12">
            Anime ve manga deneyimini sıradanlıktan kurtar. Özel efektler, VIP odalar ve reklamsız saf okuma keyfiyle Karargah'ın zirvesine yerleş.
          </p>
          <div className="flex justify-center">
            <button onClick={() => document.getElementById('pricing-section').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3">
              Gücü Serbest Bırak <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* ── BENTO GRID ÖZELLİKLER ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Box 1: Sınırsız Özelleştirme */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-10 group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full group-hover:bg-purple-500/30 transition-all duration-700" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/30">
                  <Palette size={24} />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Sınırsız Özelleştirme</h3>
                <p className="text-slate-400 font-medium">Profilini 200'den fazla özel efekt, anime aura'ları ve hareketli çerçevelerle tamamen eşsiz bir hale getir. Kimse senin gibi parlayamayacak.</p>
              </div>
            </div>
          </motion.div>

          {/* Box 2: Discord Elite Odalar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-10 group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] rounded-full group-hover:bg-amber-500/30 transition-all duration-700" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-6 border border-amber-500/30">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-2xl font-black text-white mb-4">Elite Odalar</h3>
                <p className="text-slate-400 text-sm font-medium">Discord sunucumuzda sadece elit üyelere özel odalara ve gizli kanallara erişim hakkı kazan.</p>
              </div>
            </div>
          </motion.div>

          {/* Box 3: Reklamsız Deneyim */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-10 group"
          >
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/20 blur-[60px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-700" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/30">
                  <CircleSlash size={24} />
                </div>
                <h3 className="text-2xl font-black text-white mb-4">Sıfır Reklam</h3>
                <p className="text-slate-400 text-sm font-medium">Bölümleri okurken araya giren hiçbir şey yok. Yağ gibi akan, pürüzsüz ve tamamen kesintisiz bir deneyim.</p>
              </div>
            </div>
          </motion.div>

          {/* Box 4: Etkileşim Gücü */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-10 group"
          >
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full group-hover:bg-blue-500/30 transition-all duration-700" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/30">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Sohbette Hükmet</h3>
                <p className="text-slate-400 font-medium">Canlı sohbetlerde isminin yanındaki neon parlamalar ve rünik çerçevelerle otoriteni hissettir. Yorumların özel tasarımlı kutular içinde herkesten önce göze çarpsın.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── PREMIUM STATS & MARQUEE SHOWCASE ── */}
        <div className="max-w-[100vw] -mx-4 md:mx-0 overflow-hidden relative py-10">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">
              Devasa <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Cephanelik</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Sadece Premium üyelere özel {effectsData.length + nameplatesData.length}+ içerik anında envanterinde.
            </p>
          </div>

          {/* İstatistikler */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-20 px-4 max-w-5xl mx-auto">
            <div className="text-center">
              <span className="text-5xl font-black text-white block mb-1">{nameplatesData.length}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">İSİM PLAKASI</span>
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-white block mb-1">{effectsData.filter(e => e.category === 'decorations').length}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AVATAR EFEKTİ</span>
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-white block mb-1">{effectsData.filter(e => e.category === 'profile_effects').length}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PROFİL EFEKTİ</span>
            </div>
            <div className="text-center">
              <span className="text-5xl font-black text-white block mb-1">{effectsData.filter(e => e.category === 'flags').length}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ÜLKE BAYRAĞI</span>
            </div>
          </div>

          {/* Infinite Scroll Showcase (Matching Photo 2) */}
          <div className="relative w-full overflow-hidden mask-horizontal-fade">
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused] py-10">
              {[...effectsData.filter(e => e.category === 'decorations').slice(0, 15), ...effectsData.filter(e => e.category === 'decorations').slice(0, 15)].map((effect, idx) => (
                <div 
                  key={`${effect.id}-${idx}`}
                  className="w-48 h-64 flex-shrink-0 flex flex-col items-center justify-between p-6 mx-3 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20 group"
                >
                  <div className="relative flex items-center justify-center w-full h-32">
                    <div className="absolute inset-0 m-auto w-20 h-20 bg-zinc-950 rounded-full border border-zinc-800 shadow-inner group-hover:scale-110 transition-transform duration-500" />
                    <AnimeAvatar src={null} effect={effect} size="w-20 h-20" className="absolute inset-0 z-10 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="text-center w-full mt-auto">
                    <span className="block text-xs font-black text-white uppercase tracking-tight truncate opacity-90 mb-3">
                      {effect.label || effect.name}
                    </span>
                    <span className="inline-block px-4 py-1 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-500 uppercase tracking-[0.2em] border border-amber-500/30">
                      Premium
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PRICING BÖLÜMÜ ── */}
        <div id="pricing-section" className="pt-20">
          <div className="text-center mb-20">
             <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase">MÜHÜRLÜ <span className="text-indigo-400">PAKETLER</span></h2>
             <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Sana en uygun rütbeyi seç ve hükmetmeye başla</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`relative group ${plan.is_popular ? 'scale-105 z-20' : 'z-10'}`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 z-30">
                    EN POPÜLER
                  </div>
                )}

                <div className={`h-full flex flex-col p-8 md:p-10 rounded-[3rem] bg-zinc-950/50 backdrop-blur-3xl border-2 transition-all duration-500 ${
                  plan.color === 'cyan' ? 'border-cyan-500/20 group-hover:border-cyan-500/40 shadow-cyan-500/5' :
                  plan.color === 'amber' ? 'border-amber-500/30 group-hover:border-amber-500/50 shadow-amber-500/10 bg-gradient-to-b from-amber-500/[0.05] to-transparent' :
                  plan.color === 'purple' ? 'border-purple-500/20 group-hover:border-purple-500/40 shadow-purple-500/5' :
                  'border-white/10'
                }`}>
                  <div className="flex justify-between items-start mb-8">
                    <div className={`w-16 h-16 rounded-3xl bg-${plan.color}-500/10 flex items-center justify-center border border-${plan.color}-500/20 shadow-inner`}>
                      {getIcon(plan.icon, plan.color)}
                    </div>
                    <div className="text-right">
                       <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{plan.duration}</span>
                       <span className="text-3xl font-black text-white">₺{plan.price}</span>
                    </div>
                  </div>

                  <h3 className={`text-2xl font-black mb-8 tracking-tight uppercase ${
                    plan.color === 'cyan' ? 'text-cyan-400' : 
                    plan.color === 'amber' ? 'text-amber-400' : 
                    plan.color === 'purple' ? 'text-purple-400' : 
                    'text-white'
                  }`}>
                    {plan.name}
                  </h3>

                  <div className="flex-1 space-y-4 mb-12">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 group/item">
                        <div className={`w-5 h-5 rounded-full bg-${plan.color}-500/10 flex items-center justify-center flex-shrink-0 border border-${plan.color}-500/20`}>
                          <Check size={10} className={`text-${plan.color}-400`} />
                        </div>
                        <span className="text-slate-300 text-sm font-semibold tracking-wide group-hover/item:text-white transition-colors">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={user?.is_elite}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${
                      user?.is_elite ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed' :
                      plan.is_popular ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95' :
                      'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {user?.is_elite ? 'ZATEN ELİT ÜYESİN' : 'ŞİMDİ YÜKSELT'} <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── GÜVENLİK BİLGİSİ ── */}
        <div className="flex flex-col items-center justify-center gap-4 py-20 border-t border-white/5">
           <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
             <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
             <div className="w-px h-4 bg-white/20" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
           </div>
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Güvenli 256-bit SSL Siber Ödeme</p>
        </div>

      </div>
    </div>
  );
}
