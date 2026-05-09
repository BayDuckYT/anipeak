import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Compass, Zap, Ghost, Eye, Terminal, 
  Activity, Star, Clock, Target, Layers, ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  NebulaBackground, 
  SoulDNA, 
  OracleCard, 
  MetricBox 
} from '../components/NebulaOracle.jsx';

const SOUL_TYPES = [
  { name: 'Shadow Wanderer', title: 'Gölge Gezgini', desc: 'Karanlık ve gizemin derinliklerinde yürüyen bir ruh.', color: 'purple' },
  { name: 'Celestial Knight', title: 'Gök Şövalyesi', desc: 'Adalet ve ışığın peşinde, aksiyon dolu bir kader.', color: 'cyan' },
  { name: 'Nebula Dreamer', title: 'Nebula Hayalperesti', desc: 'Gerçekliğin ötesindeki dünyalarda kaybolan bir zihin.', color: 'pink' },
  { name: 'Silent Reaper', title: 'Sessiz Azrail', desc: 'Sessizliğin içindeki kaosu ve dramı hisseden bir bilinç.', color: 'indigo' },
  { name: 'Void Hunter', title: 'Boşluk Avcısı', desc: 'Kaybolmuş serilerin ve gizli kalmış hikayelerin kaşifi.', color: 'blue' }
];

const PROPHECIES = [
  "Kategorilerin derinliklerinde kaybolan ruhun, intikam ve karanlık fantezinin kesiştiği bu Nebula'da huzur bulacak.",
  "Zamanın ötesindeki çizgiler, senin aksiyon dolu bir evrende yeniden doğacağını fısıldıyor.",
  "Ruhun, dramanın ve acının en saf halini ararken, yıldızların arasında bir teselli bulacak.",
  "Nebula'nın kalbi senin için atıyor; seçimlerin geleceğin tozlu raflarında bir efsane olacak.",
  "Karanlık fantezinin soğuk nefesi seni korkutmuyor, aksine rüyalarına ilham veriyor."
];

export default function OraclePage() {
  const { sortedSeries } = useApp();
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(true);
  const [soulProfile, setSoulProfile] = useState(null);

  useEffect(() => {
    // Simulate complex AI Analysis
    const timer = setTimeout(() => {
      const randomType = SOUL_TYPES[Math.floor(Math.random() * SOUL_TYPES.length)];
      setSoulProfile({
        ...randomType,
        dnaScore: 98.4,
        readingRhythm: 'Intense',
        engagementRate: '94%',
        cosmicDistribution: [
          { label: 'Dark Fantasy', value: 70 },
          { label: 'Drama', value: 20 },
          { label: 'Action', value: 10 }
        ]
      });
      setAnalyzing(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const recommendedSeries = useMemo(() => {
    return [...sortedSeries]
      .filter(s => s.rating >= 8.5)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
  }, [sortedSeries]);

  return (
    <div className="relative min-h-screen pt-24 pb-20 text-white selection:bg-cyan-500/30">
      <NebulaBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(138,43,226,0.4)] mb-6"
          >
            <Compass className="w-10 h-10 text-white animate-spin-slow" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl sm:text-7xl font-black tracking-tighter mb-4"
          >
            ORACLE OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500 animate-gradient-x">NEBULA</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl font-light italic"
          >
            Ruhunun derinliklerindeki manga DNA'sını keşfet. Nebula Kahini senin için kehanetlerini fısıldıyor.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {analyzing ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin" />
              </div>
              <motion.p 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-8 text-cyan-400 font-mono tracking-widest uppercase text-sm"
              >
                Ruhun Analiz Ediliyor...
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Soul Mirror Section */}
              <div className="lg:col-span-8 space-y-8">
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#1a1a3a]/40 to-[#0d0d1a]/80 border border-white/5 backdrop-blur-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Layers className="w-32 h-32 text-purple-500" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <SoulDNA profile={soulProfile} />
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-mono text-purple-400 tracking-widest uppercase">RUH MERTEBESİ</span>
                      </div>
                      <h2 className="text-4xl font-black mb-3 text-white">
                        {soulProfile.name} <span className="text-purple-400">/ {soulProfile.title}</span>
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-lg">
                        {soulProfile.desc} Nebula'nın derinliklerindeki kozmik imzanız %{soulProfile.dnaScore} oranında benzersiz bulundu.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {soulProfile.cosmicDistribution.map(item => (
                          <div key={item.label} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-[10px] text-gray-500 uppercase mb-1 font-mono">{item.label}</div>
                            <div className="text-lg font-bold text-cyan-400">%{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricBox 
                    icon={Activity} 
                    label="Reading Rhythm" 
                    value={soulProfile.readingRhythm} 
                    subtext="Okuma ritmin duygusal yoğunlukla %92 uyumlu."
                    color="purple"
                  />
                  <MetricBox 
                    icon={Zap} 
                    label="Engagement" 
                    value={soulProfile.engagementRate} 
                    subtext="Artstyle ve panel detaylarına olan odağın."
                    color="cyan"
                  />
                  <MetricBox 
                    icon={Clock} 
                    label="Nebula Rank" 
                    value="Elder Envoy" 
                    subtext="Discord XP verilerinle senkronize edildi."
                    color="pink"
                  />
                </div>

                {/* Recommendations Header */}
                <div className="pt-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <Terminal className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">NEBULA KAHİNİ <span className="text-cyan-400">ÖNERİYOR</span></h2>
                        <p className="text-xs text-gray-500 font-mono">SİSTEM ANALİZİ: {recommendedSeries.length} OPTİMAL EŞLEŞME</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                      <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">REAL-TIME SYNC</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recommendedSeries.map((s, i) => (
                      <OracleCard 
                        key={s.id} 
                        manga={s} 
                        matchScore={99 - i * 0.1} 
                        prophecy={PROPHECIES[i % PROPHECIES.length]} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-4 space-y-8">
                <div className="p-6 rounded-3xl bg-[#16162a]/60 border border-purple-500/10 backdrop-blur-md">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" /> DROP-RATE LOGIC
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <p className="text-[11px] text-red-400/70 mb-1 font-mono uppercase tracking-tighter">İmha Edilen Parametre</p>
                      <p className="text-xs text-gray-400 italic">"Yetersiz olay örgüsü ve zayıf karakter gelişimi içeren seriler kehanetlerden çıkarıldı."</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-[11px] text-emerald-400/70 mb-1 font-mono uppercase tracking-tighter">Onaylanan Akış</p>
                      <p className="text-xs text-gray-400 italic">"Görsel sanat kalitesi yüksek ve psikolojik derinliği olan seriler önceliklendirildi."</p>
                    </div>
                  </div>
                </div>

                <div className="relative group p-8 rounded-3xl bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border border-white/5 overflow-hidden text-center">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  <div className="relative z-10">
                    <Ghost className="w-12 h-12 text-white mx-auto mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold mb-2">NEBULA ELÇİSİ</h3>
                    <p className="text-xs text-gray-300 mb-6 font-light">
                      Ruh profilin Discord Elite statünle %100 uyumlu. Nebula rütbeni şimdi Discord'da sergile.
                    </p>
                    <button className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2">
                      SENKRONİZE ET <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
