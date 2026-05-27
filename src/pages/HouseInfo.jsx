import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Sword, Castle, Star, Flame, Droplet, Wind, Zap } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { Link } from 'react-router-dom';

const Factions = [
  {
    id: 1,
    name: "Kızıl Ejder (Red Dragon)",
    description: "Ateşin ve yıkımın kudreti. Cesaret, güç ve amansız saldırganlık. Kızıl Ejder hanesi her zaman ön saflarda yer alır ve asla geri adım atmaz. Savaş alanını küle çevirmek isteyenlerin mekanı.",
    icon: Flame,
    color: "rose",
    bgGradient: "from-rose-600/20 to-red-900/40",
    border: "border-rose-500/50",
    text: "text-rose-400"
  },
  {
    id: 2,
    name: "Gümüş Kitsune (Silver Kitsune)",
    description: "Zeka, kurnazlık ve gizem. Gümüş Kitsune üyeleri gölgelerde hareket eder. Stratejik dehaları ve yanıltıcı taktikleriyle savaşları daha kılıçlar çekilmeden kazanırlar.",
    icon: Sparkles,
    color: "purple",
    bgGradient: "from-purple-600/20 to-fuchsia-900/40",
    border: "border-purple-500/50",
    text: "text-purple-400"
  },
  {
    id: 3,
    name: "Buz Kurt (Ice Wolf)",
    description: "Disiplin, sadakat ve soğukkanlılık. Dondurucu diyarların yılmaz savaşçıları. Sürü mantığıyla hareket eden Buz Kurt hanesi, birliğini koruyan sarsılmaz bir kalkandır.",
    icon: Droplet,
    color: "cyan",
    bgGradient: "from-cyan-600/20 to-blue-900/40",
    border: "border-cyan-500/50",
    text: "text-cyan-400"
  },
  {
    id: 4,
    name: "Altın Anka (Golden Phoenix)",
    description: "Yeniden doğuş, bilgelik ve umut. Altın Anka üyeleri küllerinden doğan efsanelerdir. İyileştirici güçleri ve sonsuz potansiyelleriyle en zor zamanlarda ışık saçarlar.",
    icon: Star,
    color: "amber",
    bgGradient: "from-amber-600/20 to-orange-900/40",
    border: "border-amber-500/50",
    text: "text-amber-400"
  }
];

export default function HouseInfo() {
  useSEO({
    title: 'Haneler Sistemi',
    description: 'MahoraPeak Aethe özel Haneler sistemi. Tarafını seç, savaşa katıl, efsaneni yarat!',
    url: 'https://mahorapeak.com.tr/haneler'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#070511] pt-24 pb-32 relative overflow-hidden selection:bg-purple-500/30">
      
      {/* ── BACKGROUND DECOR ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* HEADER */}
        <section className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-widest backdrop-blur-md mb-8"
          >
             <Shield size={16} className="text-amber-400" /> AETHE ÖZEL SİSTEMİ
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-6 uppercase"
          >
            KADİM HANELERİN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-purple-500">
              SAVAŞINA HOŞ GELDİN
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed mb-10"
          >
            Sadece Aethe paketine sahip efsanevi okuyucuların katılabildiği kadim bir savaş. Hangi gücü seçeceksin? Kanının çektiği o eşsiz gücü bul ve hane bayrağını dalgalandır.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/elite-upgrade" className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_40px_rgba(225,29,72,0.3)] hover:scale-105 transition-all">
              <Sparkles size={20} />
              AETHE OL VE KATIL
            </Link>
          </motion.div>
        </section>

        {/* FACTIONS GRID */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase">EFSANEVİ 4 HANE</h2>
            <p className="text-slate-500 uppercase tracking-widest text-sm">Seçimin Kaderini Belirleyecek (Seçim Sadece 1 Kez Yapılır)</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {Factions.map((faction, i) => (
              <motion.div 
                key={faction.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative overflow-hidden p-8 rounded-[2rem] glass-strong border ${faction.border} hover:scale-[1.02] transition-transform`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${faction.bgGradient} opacity-50`} />
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center ${faction.text} mb-6 shadow-2xl`}>
                    <faction.icon size={32} />
                  </div>
                  <h3 className={`text-2xl md:text-3xl font-black ${faction.text} mb-4`}>{faction.name}</h3>
                  <p className="text-slate-300 leading-relaxed font-medium text-sm md:text-base">
                    {faction.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase">HANE SİSTEMİ NEDİR?</h2>
            <p className="text-slate-500 uppercase tracking-widest text-sm">Sistemin sana sunduğu ayrıcalıklar</p>
          </div>

          <div className="space-y-6">
            {[
              { title: "Kutsal Alan (Karargah) Erişimi", desc: "Aethe Sanctuary (Kutsal Alan) sayfasından hanenize özel gizli karargaha girebilirsiniz. Kendi hane üyelerinizle özel, şifreli bir chate erişim sağlarsınız.", icon: Castle, color: "text-purple-400" },
              { title: "Haneler Arası Savaş (Yakında)", desc: "Her hafta düzenlenen gizli görevleri yerine getirerek hanene puan kazandır. Haftanın sonunda en çok puanı toplayan hane özel ödüller, efektler ve sitenin ana sayfasında şampiyonluk bayrağı kazanır.", icon: Sword, color: "text-rose-400" },
              { title: "Profil & Yorumlarda Prestij", desc: "Seçtiğiniz hanenin renkli küçük mühür kalkanı profilinizin her yerinde parlar. Yorum yaptığınızda herkes sizin hangi büyük hane çatısı altında olduğunuzu görür.", icon: Zap, color: "text-amber-400" },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 p-6 md:p-8 rounded-[2rem] glass border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                  <feature.icon size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white mb-2">{feature.title}</h4>
                  <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
