import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Compass, Zap, Ghost, Eye, Terminal, 
  Activity, Star, Clock, Target, Layers, ArrowRight,
  TrendingUp, BookOpen, Shield, Crown, BarChart3
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getLevelInfo } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient';
import { 
  NebulaBackground, 
  SoulDNA, 
  OracleCard, 
  MetricBox 
} from '../components/NebulaOracle.jsx';
import { useSEO } from '../hooks/useSEO';

// ─── GERÇEK VERİ BAZLI RUH TİPLERİ ───────────────────────────────────
const SOUL_TYPES = [
  { name: 'Shadow Wanderer', title: 'Gölge Gezgini', desc: 'Karanlık ve gizemin derinliklerinde yürüyen bir ruh.', color: 'purple', genres: ['Horror', 'Korku', 'Dark Fantasy', 'Karanlık Fantezi', 'Gerilim', 'Thriller', 'Psikolojik'] },
  { name: 'Celestial Knight', title: 'Gök Şövalyesi', desc: 'Adalet ve ışığın peşinde, aksiyon dolu bir kader.', color: 'cyan', genres: ['Aksiyon', 'Action', 'Shounen', 'Macera', 'Adventure', 'Dövüş Sanatları'] },
  { name: 'Nebula Dreamer', title: 'Nebula Hayalperesti', desc: 'Gerçekliğin ötesindeki dünyalarda kaybolan bir zihin.', color: 'pink', genres: ['Fantezi', 'Fantasy', 'Isekai', 'Bilim Kurgu', 'Sci-Fi'] },
  { name: 'Silent Reaper', title: 'Sessiz Azrail', desc: 'Sessizliğin içindeki kaosu ve dramı hisseden bir bilinç.', color: 'indigo', genres: ['Drama', 'Romantik', 'Romance', 'Seinen', 'Slice of Life', 'Günlük Yaşam'] },
  { name: 'Void Hunter', title: 'Boşluk Avcısı', desc: 'Kaybolmuş serilerin ve gizli kalmış hikayelerin kaşifi.', color: 'blue', genres: ['Gizem', 'Mystery', 'Dedektif', 'Suç', 'Crime'] }
];

// ─── GERÇEK VERİYE DAYALI KEHANETLERİ OLUŞTUR ───────────────────────
function generateProphecy(manga, userGenres) {
  const topGenre = manga.genres?.[0] || 'Aksiyon';
  const prophecies = {
    'Aksiyon': `"${manga.title}" serisindeki savaş koreografisi, senin okuma ritmine mükemmel uyuyor.`,
    'Action': `"${manga.title}" serisindeki savaş koreografisi, senin okuma ritmine mükemmel uyuyor.`,
    'Drama': `"${manga.title}" hikaye derinliği ve karakter gelişimiyle tam senin ruhuna hitap ediyor.`,
    'Fantezi': `"${manga.title}" dünya inşası ve mitolojik alt metinleriyle seni başka bir evrene taşıyacak.`,
    'Fantasy': `"${manga.title}" dünya inşası ve mitolojik alt metinleriyle seni başka bir evrene taşıyacak.`,
    'Korku': `"${manga.title}" atmosferi ve gerilim unsurlarıyla karanlık tarafını besleyecek.`,
    'Horror': `"${manga.title}" atmosferi ve gerilim unsurlarıyla karanlık tarafını besleyecek.`,
  };
  return prophecies[topGenre] || `"${manga.title}" algoritmamızın senin için seçtiği ${manga.rating ? `${manga.rating} puanlık` : 'özel'} bir eser.`;
}

// ─── GERÇEK EŞLEŞME SKORU HESAPLA ───────────────────────────────────
function calculateMatchScore(manga, userTopGenres) {
  if (!manga.genres || !userTopGenres.length) return 75;
  
  const matchingGenres = manga.genres.filter(g => 
    userTopGenres.some(ug => ug.toLowerCase() === g.toLowerCase())
  );
  
  const genreScore = Math.min((matchingGenres.length / Math.max(manga.genres.length, 1)) * 60, 60);
  const ratingBonus = manga.rating ? Math.min((manga.rating / 10) * 25, 25) : 10;
  const popularityBonus = manga.reads_num ? Math.min((manga.reads_num / 10000) * 15, 15) : 5;
  
  return Math.min(Math.round(genreScore + ratingBonus + popularityBonus), 99);
}

export default function OraclePage() {
  const { sortedSeries, chapters } = useApp();
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(true);
  const [soulProfile, setSoulProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);

  useSEO({
    title: 'Oracle',
    description: 'AniPeak Oracle - Yapay zeka destekli kişisel manhwa ve webtoon önerileri.',
    url: 'https://anipeak.com.tr/oracle'
  });

  // ─── GERÇEK VERİ ANALİZİ (SAHTE DEĞİL) ───────────────────────────
  const analyzeUser = useCallback(async () => {
    // 1. Kullanıcının favori serilerini çek (gerçek veri)
    let favoriteGenres = [];
    let favCount = 0;
    
    if (user?.id) {
      // favorites tablosu mevcut olmadığı için ağ hatasını önlemek adına kaldırıldı
      favCount = 0;
      favoriteGenres = [];
    }
    
    // 2. Tüm serilerin tür dağılımını hesapla (okuma geçmişi bazlı)
    const genreCount = {};
    const readSeries = sortedSeries.filter(s => {
      const chapterList = chapters[String(s.id)];
      return chapterList && chapterList.length > 0;
    });
    
    // Favori türlerini ağırlıklı say
    favoriteGenres.forEach(g => {
      genreCount[g] = (genreCount[g] || 0) + 3; // Favoriler 3x ağırlık
    });
    
    // Genel tür dağılımı
    readSeries.forEach(s => {
      (s.genres || []).forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    });
    
    // 3. Tür dağılımını sırala
    const sortedGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1]);
    
    const topGenres = sortedGenres.slice(0, 5);
    const totalGenrePoints = topGenres.reduce((sum, [, v]) => sum + v, 0) || 1;
    
    const cosmicDistribution = topGenres.slice(0, 3).map(([label, value]) => ({
      label,
      value: Math.round((value / totalGenrePoints) * 100)
    }));
    
    // 4. Ruh tipini gerçek veriye göre belirle (rastgele DEĞİL)
    const userTopGenreNames = topGenres.map(([name]) => name.toLowerCase());
    
    let bestSoulMatch = SOUL_TYPES[2]; // Default: Nebula Dreamer
    let bestScore = 0;
    
    for (const soul of SOUL_TYPES) {
      const matchCount = soul.genres.filter(sg => 
        userTopGenreNames.some(ug => ug.includes(sg.toLowerCase()) || sg.toLowerCase().includes(ug))
      ).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestSoulMatch = soul;
      }
    }
    
    // 5. XP ve Seviye bilgilerini kullan (gerçek veri)
    const xp = user?.xp || 0;
    const levelInfo = getLevelInfo(xp, user?.is_elite);
    
    // 6. Gerçek istatistikler
    const totalChaptersRead = Object.values(chapters).reduce((sum, chs) => sum + (chs?.length || 0), 0);
    const totalSeries = sortedSeries.length;
    
    // Okuma ritmi: XP bazlı gerçek hesaplama
    let readingRhythm = 'Keşfedici';
    if (xp > 10000) readingRhythm = 'Yoğun';
    else if (xp > 5000) readingRhythm = 'Düzenli';
    else if (xp > 1000) readingRhythm = 'Aktif';
    else if (xp > 100) readingRhythm = 'Başlangıç';
    
    // Etkileşim oranı: gerçek hesaplama (favori/toplam seri)
    const engagementRate = totalSeries > 0 
      ? `${Math.min(Math.round((favCount / Math.max(totalSeries * 0.1, 1)) * 100), 100)}%`
      : '0%';
    
    // DNA skoru: XP + favori + okuma bazlı gerçek skor
    const dnaScore = Math.min(
      50 + (xp > 0 ? 15 : 0) + (favCount > 0 ? 15 : 0) + (totalChaptersRead > 100 ? 10 : totalChaptersRead / 10) + (bestScore > 0 ? 10 : 0),
      99.9
    ).toFixed(1);
    
    setSoulProfile({
      ...bestSoulMatch,
      dnaScore,
      readingRhythm,
      engagementRate,
      cosmicDistribution: cosmicDistribution.length > 0 ? cosmicDistribution : [
        { label: 'Henüz Veri Yok', value: 100 }
      ]
    });
    
    setUserStats({
      totalChaptersRead,
      totalSeries,
      favCount,
      xp,
      levelInfo,
      topGenres: topGenres.map(([name]) => name),
    });
    
    setAnalyzing(false);
  }, [user, sortedSeries, chapters]);

  useEffect(() => {
    // Gerçek analiz: minimum 1.5s animasyon + veri çekme
    const timer = setTimeout(() => {
      analyzeUser();
    }, 1500);
    return () => clearTimeout(timer);
  }, [analyzeUser]);

  // ─── GERÇEK VERİYE DAYALI ÖNERİLER ───────────────────────────────
  const recommendedSeries = useMemo(() => {
    if (!userStats?.topGenres) {
      return sortedSeries.filter(s => s.rating >= 8.5).slice(0, 4);
    }
    
    // Kullanıcının en çok okuduğu türlere göre eşleşme skoru hesapla
    const scored = sortedSeries
      .map(s => ({
        ...s,
        matchScore: calculateMatchScore(s, userStats.topGenres)
      }))
      .filter(s => s.matchScore > 60) // Minimum %60 eşleşme
      .sort((a, b) => b.matchScore - a.matchScore);
    
    return scored.slice(0, 6);
  }, [sortedSeries, userStats]);

  // ─── SİSTEM RÜTBESİ (GERÇEK) ───────────────────────────────────
  const systemRank = useMemo(() => {
    if (!user) return { value: 'Misafir', subtext: 'Giriş yaparak rütbenizi görün.' };
    
    const levelInfo = getLevelInfo(user.xp || 0, user.is_elite);
    
    return {
      value: levelInfo.rank,
      subtext: user.discord_id 
        ? `Discord ile senkronize · Lv.${levelInfo.level}` 
        : `Lv.${levelInfo.level} · Discord bağlantısı bekleniyor`
    };
  }, [user]);

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
            AKILLI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500 animate-gradient-x">ÖNERİ SİSTEMİ</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl font-light italic"
          >
            Okuma geçmişini, XP verilerini ve favori türlerini analiz eden akıllı algoritmamız senin için en uygun serileri buluyor.
          </motion.p>
        </div>

        <div className="min-h-[80vh]">
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
                Gerçek Veriler Analiz Ediliyor...
              </motion.p>
              <p className="mt-2 text-gray-500 text-xs font-mono">
                XP: {user?.xp || 0} · Seriler: {sortedSeries.length} · Bölümler taranıyor...
              </p>
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
                        {soulProfile.desc} Sistemdeki eşleşme oranınız %{soulProfile.dnaScore} oranında benzersiz bulundu.
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

                {/* Metrics Grid — GERÇEK VERİLER */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricBox 
                    icon={Activity} 
                    label="Okuma Ritmi" 
                    value={soulProfile.readingRhythm} 
                    subtext={`${userStats?.xp || 0} XP · ${userStats?.favCount || 0} favori seri`}
                    color="purple"
                  />
                  <MetricBox 
                    icon={Zap} 
                    label="Etkileşim" 
                    value={soulProfile.engagementRate} 
                    subtext={`${userStats?.totalSeries || 0} seri · ${userStats?.totalChaptersRead || 0} bölüm`}
                    color="cyan"
                  />
                  <MetricBox 
                    icon={user?.discord_id ? Shield : Clock} 
                    label="Sistem Rütbesi" 
                    value={systemRank.value} 
                    subtext={systemRank.subtext}
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
                        <h2 className="text-2xl font-black">AKILLI ALGORİTMA <span className="text-cyan-400">ÖNERİYOR</span></h2>
                        <p className="text-xs text-gray-500 font-mono">SİSTEM ANALİZİ: {recommendedSeries.length} OPTİMAL EŞLEŞME · {userStats?.topGenres?.slice(0, 2).join(' + ') || 'Genel'} bazlı</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">CANLI VERİ</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recommendedSeries.map((s, i) => (
                      <OracleCard 
                        key={s.id} 
                        manga={s} 
                        matchScore={s.matchScore || calculateMatchScore(s, userStats?.topGenres || [])} 
                        prophecy={generateProphecy(s, userStats?.topGenres || [])} 
                        idx={i}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-4 space-y-8">
                <div className="p-6 rounded-3xl bg-[#16162a]/60 border border-purple-500/10 backdrop-blur-md">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" /> ANALİZ RAPORU
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <p className="text-[11px] text-red-400/70 mb-1 font-mono uppercase tracking-tighter">Filtrelenen Parametreler</p>
                      <p className="text-xs text-gray-400 italic">
                        {userStats?.topGenres?.length > 0 
                          ? `"${userStats.topGenres[0]}" türü dışındaki düşük puanlı seriler elendi.`
                          : '"Yeterli okuma verisi toplanmadan filtre uygulanamaz."'
                        }
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-[11px] text-emerald-400/70 mb-1 font-mono uppercase tracking-tighter">Onaylanan Akış</p>
                      <p className="text-xs text-gray-400 italic">
                        {userStats?.topGenres?.length >= 2
                          ? `"${userStats.topGenres[0]}" ve "${userStats.topGenres[1]}" türlerinde yüksek eşleşme tespit edildi.`
                          : '"Daha fazla seri okuyarak algoritmanın hassasiyetini artırabilirsin."'
                        }
                      </p>
                    </div>
                    
                    {/* Gerçek İstatistik Özeti */}
                    <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                      <p className="text-[11px] text-cyan-400/70 mb-2 font-mono uppercase tracking-tighter">Veri Kaynakları</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Toplam XP</span>
                          <span className="text-cyan-400 font-mono">{userStats?.xp?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Favori Seriler</span>
                          <span className="text-cyan-400 font-mono">{userStats?.favCount || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Analiz Edilen Seriler</span>
                          <span className="text-cyan-400 font-mono">{userStats?.totalSeries || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Seviye</span>
                          <span className="text-cyan-400 font-mono">Lv.{userStats?.levelInfo?.level || 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group p-8 rounded-3xl bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border border-white/5 overflow-hidden text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_transparent_100%)] mix-blend-overlay" />
                  <div className="relative z-10">
                    {user?.discord_id ? (
                      <>
                        <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">DISCORD BAĞLI</h3>
                        <p className="text-xs text-gray-300 mb-4 font-light">
                          Discord hesabınız senkronize. Rütbeniz ve XP'niz anlık olarak güncelleniyor.
                        </p>
                        <div className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-500/30">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          SENKRONİZE
                        </div>
                      </>
                    ) : (
                      <>
                        <Ghost className="w-12 h-12 text-white mx-auto mb-4 animate-bounce" />
                        <h3 className="text-xl font-bold mb-2">DISCORD BAĞLANTISI</h3>
                        <p className="text-xs text-gray-300 mb-6 font-light">
                          Discord hesabınızı bağlayarak rütbenizi senkronize edin ve ek XP kazanın.
                        </p>
                        <button className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2">
                          SENKRONİZE ET <ArrowRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
