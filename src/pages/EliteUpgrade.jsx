import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Crown, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EliteUpgrade() {
  const { user, upgradeToElite } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      alert("Lütfen önce giriş yapın amk.");
      // Trigger login modal conceptually
      const event = new CustomEvent('open-auth', { detail: 'login' });
      window.dispatchEvent(event);
      return;
    }
    
    // Simulate Stripe Checkout
    const success = await upgradeToElite();
    if (success) {
      alert("Tebrikler! Artık Elite Karargah üyesisin daa. Sınırsız güce eriştin.");
      navigate('/citadel');
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] pt-24 pb-20 relative overflow-hidden">
      {/* Cyber Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent rotate-45 opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-amber-500/30 text-amber-400 font-black text-xs uppercase tracking-widest mb-6">
            <Crown size={14} /> Karargahın Kapıları Açılıyor
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            SINIRSIZ <span className="elite-text-gradient">GÜCE ERİŞ</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            AniPeak'in en karanlık sırlarına, elit forum odalarına ve global canlı sohbette parlayan bir isme sahip ol. Sıradan bir okur olmaktan çık, Karargah'a katıl.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Base Tier (Current) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-[2.5rem] p-10 border border-white/5 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"
          >
            <h3 className="text-2xl font-black text-white mb-2">Sıradan Uşak</h3>
            <p className="text-slate-400 text-sm mb-8">Temel manga okuma deneyimi.</p>
            <div className="text-4xl font-black text-white mb-8">Ücretsiz</div>
            <ul className="space-y-4 mb-8">
              {[
                'Tüm serileri okuma',
                'Standart yorum yapma',
                'Reklamlı arayüz',
                'Kısıtlı profil özelleştirme'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check size={16} className="text-slate-500" /> {item}
                </li>
              ))}
            </ul>
            <button disabled className="w-full py-4 rounded-xl glass border border-white/10 text-slate-500 font-bold uppercase tracking-widest cursor-not-allowed">
              Mevcut Plan
            </button>
          </motion.div>

          {/* Elite Tier */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative glass-strong rounded-[2.5rem] p-10 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden group"
          >
            {/* Spinning background glow */}
            <div className="absolute -inset-20 bg-gradient-to-r from-red-600/20 via-blue-600/20 to-purple-600/20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity animate-spin-slow pointer-events-none" />
            
            <div className="relative z-10">
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-xl">
                En Popüler
              </div>
              <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-2">
                ELITE <Zap className="text-red-500" />
              </h3>
              <p className="text-red-200/60 text-sm mb-8">Gerçek gücü serbest bırak.</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black text-white">$9.99</span>
                <span className="text-slate-400 text-sm">/ ay</span>
              </div>
              <ul className="space-y-4 mb-10">
                {[
                  'Karargah Forumuna (Citadel) tam erişim',
                  'Özel Elite Chambers (Gizli Odalar) girişi',
                  'İsminin yanında kırmızı-mavi Neon Glow',
                  'Profilinde dönen özel Rünik Çerçeve',
                  'Canlı sohbette (In-Read) parlayan isim',
                  'Reklamsız ve pürüzsüz deneyim'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white font-medium text-sm">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 border border-red-500/50">
                      <Check size={12} className="text-red-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              {user?.is_elite ? (
                 <button disabled className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 text-white font-black uppercase tracking-widest shadow-lg opacity-50 cursor-not-allowed">
                    Zaten Elitsin
                 </button>
              ) : (
                <button 
                  onClick={handleUpgrade}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-blue-600 text-white font-black uppercase tracking-widest shadow-neon-purple hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Şimdi Satın Al <ArrowRight size={18} />
                </button>
              )}
              <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
                Stripe Altyapısı ile Güvenli Ödeme
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
