import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, Sparkles, ShieldCheck, Zap, ArrowRight, CreditCard, Clock, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabaseClient';

const AURA_PACKAGES = [
  { id: 1, aura: 25000, price: 25, popular: false, bonus: 0 },
  { id: 2, aura: 150000, price: 50, popular: false, bonus: '25K Bonus' },
  { id: 3, aura: 250000, price: 100, popular: true, bonus: '50K Bonus' },
  { id: 4, aura: 500000, price: 200, popular: false, bonus: '100K Bonus' },
  { id: 5, aura: 750000, price: 350, popular: false, bonus: '150K Bonus' },
  { id: 6, aura: 1250000, price: 500, popular: true, bonus: 'Yüksek Değer' }
];

const HISTORY_MOCK = [
  { id: 1, action: 'Aura Yüklemesi', amount: '+250.000', date: 'Bugün', icon: <Zap className="text-emerald-400" /> },
  { id: 2, action: 'İsim Plakası (Neon)', amount: '-15.000', date: 'Dün', icon: <CreditCard className="text-red-400" /> },
  { id: 3, action: 'Elit Çerçeve', amount: '-50.000', date: '3 Gün Önce', icon: <CreditCard className="text-red-400" /> },
  { id: 4, action: 'Aura Yüklemesi', amount: '+500.000', date: '1 Hafta Önce', icon: <Zap className="text-emerald-400" /> },
];

export default function Wallet() {
  const { user, fetchUserAura } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGift, setIsGift] = useState(false);

  // Promo Kodu State'leri
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState(null);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  useSEO({
    title: 'Cüzdanım - Aura',
    description: 'AniPeak sanal cüzdanınız. Aura bakiyenizi görüntüleyin ve yeni Aura satın alın.',
    url: 'https://anipeak.com.tr/cuzdan'
  });

  const handlePurchaseClick = (pkg) => {
    setSelectedPackage(pkg);
    setIsGift(false);
    setIsModalOpen(true);
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
      const { data: codeData, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();
        
      if (error || !codeData) throw new Error("Kod geçersiz veya bulunamadı.");
      if (codeData.used_count >= codeData.max_uses) throw new Error("Bu kodun kullanım limiti dolmuş.");
      if (codeData.type !== 'aura') throw new Error("Bu kod Aura puanı için geçerli değil.");
      
      const auraValue = parseInt(codeData.value);
      if (isNaN(auraValue)) throw new Error("Geçersiz aura değeri.");

      // Update user's aura balance
      const newAura = (user.aura || 0) + auraValue;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ aura: newAura })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Increment used_count
      await supabase.from('promo_codes')
        .update({ used_count: codeData.used_count + 1 })
        .eq('id', codeData.id);
        
      // Fetch user aura again if context provides a way, else reload or just optimistic update
      if (fetchUserAura) await fetchUserAura();
        
      setPromoMsg({ type: 'success', text: `${auraValue.toLocaleString('tr-TR')} Aura başarıyla eklendi!` });
      setPromoCode('');
    } catch (err) {
      setPromoMsg({ type: 'error', text: err.message });
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070511] pb-20 relative overflow-x-hidden">
      
      {/* ── CINEMATIC HERO HEADER (BALANCE) ── */}
      <div className="relative w-full h-[60vh] min-h-[500px] overflow-hidden flex items-end mb-12">
        <div className="absolute inset-0 bg-[url('/yayinarkaplan.jpg')] bg-cover bg-center opacity-30 mix-blend-screen scale-105 transition-all duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/70 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070511] to-transparent z-10" />
        
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-12 pt-28 pb-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
           <div className="text-center md:text-left">
             <div className="flex items-center gap-2 justify-center md:justify-start mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/20">
               <WalletIcon size={14} className="text-pink-400" />
               <span className="text-xs font-bold text-white tracking-widest uppercase">Senin Kasan</span>
             </div>
             <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-2 drop-shadow-2xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
               CÜZDAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">MERKEZİ</span>
             </h1>
             <p className="text-slate-300 text-lg max-w-xl font-medium drop-shadow-md mb-6">
               Aura, AniPeak ekosistemindeki sanal para birimidir. Aura ile özel profil efektleri, isim plakaları ve elit özellikler satın alabilirsiniz.
             </p>
             <div className="flex items-center gap-6 text-sm text-slate-400 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> %100 Güvenli</span>
                <span className="flex items-center gap-2"><Zap size={16} className="text-blue-400" /> Anında Teslimat</span>
             </div>
           </div>

           {/* Balance Display */}
           <div className="flex-shrink-0 bg-[#141414]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.15)] text-center">
             <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Mevcut Bakiye</div>
             <div className="flex items-center justify-center gap-2">
               <Sparkles size={28} className="text-pink-500" />
               <span className="text-5xl font-black text-white tracking-tighter">{user?.aura ? user.aura.toLocaleString('tr-TR') : '0'}</span>
             </div>
             <div className="text-lg font-bold text-pink-500 tracking-widest mt-1">AURA</div>
           </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 relative z-30 -mt-10">

        {/* ── PROMO KODU KULLANIMI ── */}
        <section className="mb-16 flex justify-center">
          <div className="w-full max-w-lg p-6 md:p-8 rounded-[2rem] bg-[#141414]/80 border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-pink-400" size={24} />
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Aura Kodu Kullan</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">Elinde bir Aura Puanı kodu mu var? Buradan kodunu girerek bakiyene ekleyebilirsin.</p>
            
            <div className="flex gap-3">
              <input 
                type="text" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Örn: AU-XXXX..."
                className="flex-grow bg-[#070511] border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase focus:border-pink-500/50 outline-none transition-all"
              />
              <button 
                onClick={handleUsePromo}
                disabled={promoLoading}
                className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {promoLoading ? 'Bekle...' : 'Kullan'}
              </button>
            </div>
            {promoMsg && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${promoMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {promoMsg.type === 'success' ? <ShieldCheck size={16} /> : <Zap size={16} />}
                {promoMsg.text}
              </div>
            )}
          </div>
        </section>
        
        {/* ── AURA PACKAGES (HORIZONTAL ROW) ── */}
        <div className="mb-16">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-end gap-3">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Aura Satın Al</h2>
              <span className="text-sm font-bold text-slate-500 mb-1">Paketler</span>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-2">
              <Zap size={14} /> Bonuslu Fırsatlar
            </div>
          </div>
          
          <div className="flex gap-6 overflow-x-auto no-scrollbar snap-x pb-8">
            {AURA_PACKAGES.map((pkg, idx) => (
              <div key={pkg.id} className="snap-start flex-shrink-0 w-[260px] sm:w-[300px] group">
                <div className={`relative h-full rounded-3xl p-1 overflow-hidden transition-transform duration-300 group-hover:scale-105 ${pkg.popular ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-[0_0_40px_rgba(236,72,153,0.3)]' : 'bg-white/5 border border-white/10 group-hover:border-pink-500/50'}`}>
                  <div className="h-[320px] w-full bg-[#141414] rounded-[22px] p-6 flex flex-col relative overflow-hidden">
                    {pkg.popular && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg z-10">
                        Popüler
                      </div>
                    )}
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                    <div className="mb-8 relative z-10">
                      <h3 className="text-5xl font-black text-white tracking-tighter">
                        {pkg.aura >= 1000000 ? (pkg.aura / 1000000) + 'M' : (pkg.aura / 1000) + 'K'}
                      </h3>
                      <div className="text-pink-400 font-bold uppercase tracking-widest text-sm flex items-center gap-1 mt-1">
                        <Sparkles size={14} /> AURA
                      </div>
                      {pkg.bonus && (
                        <div className="inline-block mt-4 px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
                          {pkg.bonus}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto relative z-10">
                      <button 
                        onClick={() => handlePurchaseClick(pkg)}
                        className={`w-full py-4 rounded-xl flex items-center justify-between px-6 font-black transition-all ${pkg.popular ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                      >
                        <span className="text-lg">{pkg.price} TL</span>
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HISTORY (HORIZONTAL) ── */}
        <div className="mb-16">
          <div className="flex items-end gap-3 mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Hesap Geçmişi</h2>
            <span className="text-sm font-bold text-slate-500 mb-1">Son İşlemler</span>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4">
            {HISTORY_MOCK.map((item) => (
              <div key={item.id} className="snap-start flex-shrink-0 w-[240px] sm:w-[280px] bg-[#141414] border border-white/5 rounded-2xl p-5 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> {item.date}</div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.action}</h3>
                  <div className={`text-xl font-black tracking-tight ${item.amount.startsWith('+') ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {item.amount} <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AURA</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {isModalOpen && selectedPackage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar rounded-3xl bg-[#070511] border border-white/10 shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-[50px] -translate-y-1/2 translate-x-1/2" />
              
              <div className="text-center space-y-4 relative z-10">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <CreditCard size={32} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Sipariş Oluştur</h3>
                <p className="text-slate-400 text-sm font-medium">
                  <strong className="text-white">{selectedPackage.aura.toLocaleString('tr-TR')} Aura</strong> satın almak üzeresiniz. İşlemi tamamlamak için lütfen Discord sunucumuza gelip destek talebi oluşturun.
                </p>
                
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 my-6 shadow-inner">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400 mb-2">
                    <span>Paket:</span>
                    <span className="text-white">{selectedPackage.aura.toLocaleString('tr-TR')} Aura</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-black text-white">
                    <span>Tutar:</span>
                    <span className="text-pink-400">{selectedPackage.price} TL</span>
                  </div>
                </div>

                {/* Hediye Et Checkbox */}
                <div className="my-6 px-2 text-left">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isGift ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-pink-500 text-white' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                      {isGift && <ShieldCheck size={14} />}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-white group-hover:text-pink-300 transition-colors">Hediye Et (Başkası İçin Kod Al)</span>
                      <span className="block text-[10px] text-slate-500">Seçildiğinde Discord üzerinden bir hediye kodu oluşturulacaktır.</span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all border border-white/10">
                    İptal
                  </button>
                  <a href="https://discord.gg/anipeak" target="_blank" rel="noopener noreferrer" className="flex-[2] py-4 rounded-xl bg-[#5865F2] text-white font-black hover:bg-[#4752C4] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(88,101,242,0.3)]">
                    <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.18,46,96.06,53,91.01,65.69,84.69,65.69Z"/></svg>
                    {isGift ? "HEDİYE KODU AL" : "DISCORD'A GİT"}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
