import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Crown, Check, ArrowRight, Palette, CircleSlash, Box, Image as ImageIcon, Star, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SiberAvatar from '../components/SiberAvatar';
import effectsData from '../data/effects.json';

export default function EliteUpgrade() {
  const { user, upgradeToElite } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      alert("Lütfen önce giriş yapın.");
      const event = new CustomEvent('open-auth', { detail: 'login' });
      window.dispatchEvent(event);
      return;
    }
    const success = await upgradeToElite();
    if (success) {
      alert("Tebrikler! Artık Premium üyesisin. Sınırsız güce eriştin.");
      navigate('/citadel');
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] pt-24 pb-32 relative overflow-hidden font-sans">
      {/* ── ARKA PLAN EFEKTLERİ ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] right-1/4 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 space-y-32">
        
        {/* ── HERO BÖLÜMÜ ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center pt-10"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.3em] mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <Crown size={14} className="text-amber-400" /> Sınırları Kaldır
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none">
            ANIPEAK <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 animate-pulse-glow">
              PREMIUM
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium mb-12">
            Anime ve manga deneyimini sıradanlıktan kurtar. Özel efektler, VIP odalar ve reklamsız saf okuma keyfiyle Karargah'ın zirvesine yerleş.
          </p>
          <div className="flex justify-center">
            <button 
              onClick={() => {
                document.getElementById('pricing-section').scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3"
            >
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

          {/* Box 2: Gizli Odalar */}
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
                <p className="text-slate-400 text-sm font-medium">Karargah Forumunda sadece elit üyelerin görebildiği gizli bölmelere ve özel içeriklere erişim sağla.</p>
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
                <p className="text-slate-400 text-sm font-medium">Bölümleri okurken araya giren hiçbir şey yok. Yağ gibi akan, pürüzsüz ve tamamen kesintisiz bir okuma deneyimi.</p>
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
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
              Devasa <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Cephanelik</span>
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              Sadece Premium üyelere özel {effectsData.length}+ içerik anında envanterinde.
            </p>
          </div>

          {/* İstatistikler */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-20 mb-20 px-4">
            <div className="text-center flex flex-col items-center">
              <span className="text-5xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {effectsData.filter(e => e.category === 'decorations').length}
              </span>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5"><ImageIcon size={14} className="text-purple-400"/> Profil Efekti</span>
            </div>
            <div className="text-center flex flex-col items-center">
              <span className="text-5xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {effectsData.filter(e => e.category === 'flags').length}
              </span>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5"><Palette size={14} className="text-blue-400"/> Ülke Bayrağı</span>
            </div>
            <div className="text-center flex flex-col items-center">
              <span className="text-5xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">5</span>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5"><Zap size={14} className="text-amber-400"/> İsim Stili</span>
            </div>
            <div className="text-center flex flex-col items-center">
              <span className="text-5xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">5</span>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5"><Box size={14} className="text-emerald-400"/> Yorum Kutusu</span>
            </div>
          </div>

          {/* Marquee Vitrini */}
          <div className="relative w-full overflow-hidden mask-horizontal-fade">
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused] py-5">
              {[...effectsData.filter(e => e.category === 'decorations').slice(0, 30), ...effectsData.filter(e => e.category === 'decorations').slice(0, 30)].map((effect, idx) => (
                <div 
                  key={`${effect.id}-${idx}`}
                  className="w-48 flex-shrink-0 flex flex-col items-center justify-center p-6 mx-3 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.05]"
                >
                  <div className="relative mb-6 flex items-center justify-center w-24 h-24">
                    {/* Arka plandaki karanlık daire (Avatar yer tutucu) */}
                    <div className="absolute inset-0 m-auto w-[4.5rem] h-[4.5rem] bg-zinc-950 rounded-full border border-zinc-800 shadow-inner" />
                    {/* SiberAvatar bileşeni (tam oturacak şekilde boyutlandırıldı) */}
                    <SiberAvatar src={null} effect={effect} size="w-[4.5rem] h-[4.5rem]" className="absolute inset-0 z-10" />
                  </div>
                  <div className="text-center w-full">
                    <span className="block text-xs font-black text-white uppercase tracking-tight truncate opacity-90 mb-1">
                      {effect.label || effect.name}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black bg-amber-500/20 text-amber-500 uppercase tracking-widest">
                      Premium
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PRICING BÖLÜMÜ ── */}
        <div id="pricing-section" className="max-w-md mx-auto pt-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative glass-strong rounded-[3rem] p-10 md:p-12 border border-white/20 shadow-[0_0_80px_rgba(168,85,247,0.15)] text-center overflow-hidden"
          >
            {/* Kart içi glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200px] bg-purple-500/20 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-black mb-6 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                <Crown size={32} />
              </div>
              
              <h3 className="text-3xl font-black text-white mb-2">
                Premium Bilet
              </h3>
              <p className="text-slate-400 text-sm font-medium mb-8">
                Hemen Karargah'a katıl ve tüm sınırları kaldır.
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-10">
                <span className="text-6xl font-black text-white tracking-tighter">₺79.99</span>
                <span className="text-slate-400 font-bold uppercase tracking-widest mt-4">/ Ay</span>
              </div>
              
              {user?.is_elite ? (
                 <button disabled className="w-full py-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-widest opacity-50 cursor-not-allowed">
                    Zaten Premium'sun
                 </button>
              ) : (
                <button 
                  onClick={handleUpgrade}
                  className="w-full py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                  Şimdi Satın Al <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-6">
                Stripe güvencesiyle
              </p>
            </div>
          </motion.div>
        </div>
        
      </div>
    </div>
  );
}
