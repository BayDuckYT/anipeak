import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Sparkles, ShieldCheck, Zap, ArrowRight, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSEO } from '../hooks/useSEO';

const AURA_PACKAGES = [
  { id: 1, aura: 25000, price: 25, popular: false, bonus: 0 },
  { id: 2, aura: 150000, price: 50, popular: false, bonus: '25K Bonus' },
  { id: 3, aura: 250000, price: 100, popular: true, bonus: '50K Bonus' },
  { id: 4, aura: 500000, price: 200, popular: false, bonus: '100K Bonus' },
  { id: 5, aura: 750000, price: 350, popular: false, bonus: '150K Bonus' },
  { id: 6, aura: 1250000, price: 500, popular: true, bonus: 'Yüksek Değer' }
];

export default function Wallet() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useSEO({
    title: 'Cüzdanım - Aura',
    description: 'AniPeak sanal cüzdanınız. Aura bakiyenizi görüntüleyin ve yeni Aura satın alın.',
    url: 'https://anipeak.com.tr/cuzdan'
  });

  const handlePurchaseClick = (pkg) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070511] pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header & Balance Card */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter"
            >
              CÜZDAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">MERKEZİ</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 font-medium max-w-md"
            >
              Aura, AniPeak ekosistemindeki sanal para birimidir. Aura ile özel profil efektleri, isim plakaları ve elit özellikler satın alabilirsiniz.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-3xl p-8 overflow-hidden group bg-card-navy border border-white/5 shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-500/30 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <WalletIcon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Mevcut Bakiye</h3>
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-pink-400" />
                    <span className="text-3xl font-black text-white">{user?.aura ? user.aura.toLocaleString('tr-TR') : '0'}</span>
                    <span className="text-lg font-bold text-pink-400">AURA</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> %100 Güvenli İşlem</span>
                <span className="flex items-center gap-2"><Zap size={16} className="text-blue-400" /> Anında Teslimat</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Packages Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Aura Satın Al</h2>
            <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-2">
              <Zap size={14} /> Bonuslu Fırsatlar
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AURA_PACKAGES.map((pkg, idx) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={`relative rounded-3xl p-1 overflow-hidden transition-all duration-300 hover:scale-[1.02] ${pkg.popular ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-[0_0_40px_rgba(236,72,153,0.3)]' : 'bg-white/5 border border-white/10 hover:border-pink-500/50'}`}
              >
                <div className="h-full w-full bg-card-navy rounded-[22px] p-6 flex flex-col relative overflow-hidden">
                  {pkg.popular && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                      En Popüler
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-4xl font-black text-white flex items-baseline gap-1">
                      {pkg.aura >= 1000000 ? (pkg.aura / 1000000) + 'M' : (pkg.aura / 1000) + 'K'}
                    </h3>
                    <div className="text-pink-400 font-bold uppercase tracking-widest text-sm flex items-center gap-1 mt-1">
                      <Sparkles size={14} /> AURA
                    </div>
                    {pkg.bonus && (
                      <div className="inline-block mt-3 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
                        {pkg.bonus}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <button 
                      onClick={() => handlePurchaseClick(pkg)}
                      className={`w-full py-4 rounded-xl flex items-center justify-between px-6 font-black transition-all ${pkg.popular ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]' : 'bg-white/5 text-white hover:bg-white/10'}`}
                    >
                      <span>{pkg.price} TL</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {isModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-[50px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="text-center space-y-4 relative z-10">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <CreditCard size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sipariş Oluştur</h3>
              <p className="text-slate-400 text-sm font-medium">
                <strong className="text-white">{selectedPackage.aura.toLocaleString('tr-TR')} Aura</strong> satın almak üzeresiniz. İşlemi tamamlamak için lütfen Discord sunucumuza gelip destek talebi oluşturun.
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 my-6">
                <div className="flex justify-between items-center text-sm font-bold text-slate-300 mb-2">
                  <span>Paket:</span>
                  <span className="text-white">{selectedPackage.aura.toLocaleString('tr-TR')} Aura</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black text-white">
                  <span>Tutar:</span>
                  <span className="text-pink-400">{selectedPackage.price} TL</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 transition-all">
                  İptal
                </button>
                <a href="https://discord.gg/anipeak" target="_blank" rel="noopener noreferrer" className="flex-[2] py-4 rounded-xl bg-[#5865F2] text-white font-black hover:bg-[#4752C4] transition-all flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.18,46,96.06,53,91.01,65.69,84.69,65.69Z"/></svg>
                  Discord'a Git
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
