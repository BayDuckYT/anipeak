import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Compass, Zap, Ghost, Eye, Terminal, 
  Activity, Star, Clock, Target, Layers, ArrowRight,
  TrendingUp, BookOpen, Shield, Crown, BarChart3, Play, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth, getLevelInfo } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient';
import { NebulaBackground, SoulDNA, MetricBox } from '../components/NebulaOracle.jsx';
import NetflixRow from '../components/NetflixRow.jsx';
import NetflixCard from '../components/NetflixCard.jsx';
import { useSEO } from '../hooks/useSEO';
import Loader from '../components/Loader.jsx';

// ─── GERÇEK VERİ BAZLI RUH TİPLERİ ───────────────────────────────────
const SOUL_TYPES = [
  { name: 'Shadow Wanderer', title: 'Gölge Gezgini', desc: 'Karanlık ve gizemin derinliklerinde yürüyen bir ruh.', color: 'purple', genres: ['Horror', 'Korku', 'Dark Fantasy', 'Karanlık Fantezi', 'Gerilim', 'Thriller', 'Psikolojik'] },
  { name: 'Celestial Knight', title: 'Gök Şövalyesi', desc: 'Adalet ve ışığın peşinde, aksiyon dolu bir kader.', color: 'cyan', genres: ['Aksiyon', 'Action', 'Shounen', 'Macera', 'Adventure', 'Dövüş Sanatları'] },
  { name: 'Nebula Dreamer', title: 'Nebula Hayalperesti', desc: 'Gerçekliğin ötesindeki dünyalarda kaybolan bir zihin.', color: 'pink', genres: ['Fantezi', 'Fantasy', 'Isekai', 'Bilim Kurgu', 'Sci-Fi'] },
  { name: 'Silent Reaper', title: 'Sessiz Azrail', desc: 'Sessizliğin içindeki kaosu ve dramı hisseden bir bilinç.', color: 'indigo', genres: ['Drama', 'Romantik', 'Romance', 'Seinen', 'Slice of Life', 'Günlük Yaşam'] },
  { name: 'Void Hunter', title: 'Boşluk Avcısı', desc: 'Kaybolmuş serilerin ve gizli kalmış hikayelerin kaşifi.', color: 'blue', genres: ['Gizem', 'Mystery', 'Dedektif', 'Suç', 'Crime'] }
];

function calculateMatchScore(manga, userTopGenres) {
  if (!manga.genres || !userTopGenres.length) return 75;
  // Match with weights (top genre gives more points)
  let genreScore = 0;
  manga.genres.forEach(g => {
    const rank = userTopGenres.findIndex(ug => ug.toLowerCase() === g.toLowerCase());
    if (rank !== -1) {
      // The higher the genre is in user's top list (lower index), the more points
      genreScore += (10 - rank * 1.5);
    }
  });
  
  const normalizedGenreScore = Math.min((genreScore / 20) * 65, 65); // Max 65 points from genres
  const ratingBonus = manga.rating ? Math.min((manga.rating / 10) * 20, 20) : 10; // Max 20 points
  const popularityBonus = manga.reads_num ? Math.min((manga.reads_num / 10000) * 15, 15) : 5; // Max 15 points
  
  return Math.min(Math.round(normalizedGenreScore + ratingBonus + popularityBonus), 99);
}

export default function OraclePage() {
  const { sortedSeries } = useApp();
  const { user, readingHistory } = useAuth();
  
  useSEO({
    title: 'Oracle',
    description: 'MahoraPeak Oracle - Yapay zeka destekli kişisel manhwa ve webtoon önerileri.',
    url: 'https://mahorapeak.com.tr/oracle'
  });

  if (!sortedSeries || sortedSeries.length === 0) {
    return <Loader fullScreen={false} text="Sistem Başlatılıyor..." />;
  }

  const { soulProfile, userStats } = useMemo(() => {
    let favCount = 0;
    let totalChaptersRead = 0;
    
    if (user?.id && readingHistory) {
      favCount = readingHistory.length;
      totalChaptersRead = readingHistory.reduce((sum, item) => sum + (Number(item.lastChapter) || 1), 0);
    }
    
    const genreCount = {};
    const readSeries = sortedSeries.filter(s => {
      return readingHistory?.some(h => String(h.manhwaId) === String(s.id));
    });
    
    // Ağırlıklı Tür Hesaplaması (Okunan bölüm sayısına göre türe puan ver)
    readSeries.forEach(s => {
      const historyItem = readingHistory?.find(h => String(h.manhwaId) === String(s.id));
      const readChapters = Number(historyItem?.lastChapter) || 1;
      // Ne kadar çok okuduysa o türü o kadar çok seviyordur (max çarpan: 5)
      const weight = Math.min(1 + (readChapters / 20), 5);
      
      (s.genres || []).forEach(g => { 
        genreCount[g] = (genreCount[g] || 0) + weight; 
      });
    });
    
    const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
    const topGenres = sortedGenres.slice(0, 5);
    const totalGenrePoints = topGenres.reduce((sum, [, v]) => sum + v, 0) || 1;
    
    const cosmicDistribution = topGenres.slice(0, 3).map(([label, value]) => ({
      label, value: Math.round((value / totalGenrePoints) * 100)
    }));
    
    const userTopGenreNames = topGenres.map(([name]) => name.toLowerCase());
    
    let bestSoulMatch = SOUL_TYPES[2];
    let bestScore = 0;
    
    for (const soul of SOUL_TYPES) {
      const matchCount = soul.genres.filter(sg => userTopGenreNames.some(ug => ug.includes(sg.toLowerCase()) || sg.toLowerCase().includes(ug))).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestSoulMatch = soul;
      }
    }
    
    const xp = user?.xp || 0;
    const levelInfo = getLevelInfo(xp, user?.is_elite);
    const totalSeries = sortedSeries.length;
    
    let readingRhythm = 'Keşfedici';
    if (xp > 10000) readingRhythm = 'Yoğun';
    else if (xp > 5000) readingRhythm = 'Düzenli';
    else if (xp > 1000) readingRhythm = 'Aktif';
    else if (xp > 100) readingRhythm = 'Başlangıç';
    
    const engagementRate = totalSeries > 0 ? `${Math.min(Math.round((favCount / Math.max(totalSeries * 0.1, 1)) * 100), 100)}%` : '0%';
    
    const dnaScore = Math.min(50 + (xp > 0 ? 15 : 0) + (favCount > 0 ? 15 : 0) + (totalChaptersRead > 100 ? 10 : totalChaptersRead / 10) + (bestScore > 0 ? 10 : 0), 99.9).toFixed(1);
    
    const calculatedSoulProfile = {
      ...bestSoulMatch,
      dnaScore, readingRhythm, engagementRate,
      cosmicDistribution: cosmicDistribution.length > 0 ? cosmicDistribution : [{ label: 'Henüz Veri Yok', value: 100 }]
    };
    
    const calculatedUserStats = { totalChaptersRead, totalSeries, favCount, xp, levelInfo, topGenres: topGenres.map(([name]) => name) };
    
    return { soulProfile: calculatedSoulProfile, userStats: calculatedUserStats };
  }, [user, sortedSeries, readingHistory]);

  const recommendedSeries = useMemo(() => {
    // 1. Zaten okuduğu serileri dışla (Keşif için Oracle)
    const readIds = new Set(readingHistory?.map(h => String(h.manhwaId)) || []);
    const unreadSeries = sortedSeries.filter(s => !readIds.has(String(s.id)));
    const targetPool = unreadSeries.length > 20 ? unreadSeries : sortedSeries; // Eğer çok az seri kaldıysa hepsini kullan
    
    if (!userStats?.topGenres || userStats.topGenres.length === 0) {
      const topRated = targetPool.filter(s => s.rating >= 8.5);
      return topRated.length > 0 ? topRated.slice(0, 20) : targetPool.slice(0, 20);
    }
    
    const scored = targetPool.map(s => ({ ...s, matchScore: calculateMatchScore(s, userStats.topGenres) }))
      .filter(s => s.matchScore > 50).sort((a, b) => b.matchScore - a.matchScore);
      
    return scored.length > 0 ? scored.slice(0, 20) : targetPool.slice(0, 20);
  }, [sortedSeries, userStats, readingHistory]);

  const systemRank = useMemo(() => {
    if (!user) return { value: 'Misafir', subtext: 'Giriş yaparak rütbenizi görün.' };
    const levelInfo = getLevelInfo(user.xp || 0, user.is_elite);
    return { value: levelInfo.rank, subtext: user.discord_id ? `Discord ile senkronize · Lv.${levelInfo.level}` : `Lv.${levelInfo.level} · Discord bağlantısı bekleniyor` };
  }, [user]);

  const topMatch = recommendedSeries[0];
  const row1 = recommendedSeries.slice(1, 10);
  
  // Karanlık ve Derin satırı için, ruh eşleşmesi iyi ama popülerliği düşük olanları bul (Hidden Gems)
  const row2 = [...recommendedSeries].sort((a, b) => (a.reads_num || 0) - (b.reads_num || 0)).slice(0, 10);
  
  // Zıt Kutuplar satırı: Eşleşme puanı en düşük ama puanı en yüksek olanlar (Kozadan Çıkış)
  const row3 = [...sortedSeries]
    .map(s => ({ ...s, matchScore: calculateMatchScore(s, userStats?.topGenres || []) }))
    .filter(s => s.matchScore < 40 && s.rating >= 8.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  return (
    <div className="relative min-h-screen bg-[#070511] pb-20 text-white selection:bg-cyan-500/30 overflow-x-hidden">
      <NebulaBackground />

      {/* ── NETFLIX TOP HERO (RUH EŞLEŞMEN) ── */}
      <div className="relative w-full h-[80vh] min-h-[600px] mb-12">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" 
          style={{ backgroundImage: `url(${topMatch?.cover || '/yayinarkaplan.jpg'})`, opacity: 0.5, mixBlendMode: 'screen' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/90 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070511] to-transparent z-10" />
        
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-12 h-full flex flex-col justify-end pb-24">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 backdrop-blur-md rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">%99 RUH EŞLEŞMESİ</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 backdrop-blur-md rounded-full border border-purple-500/30">
              <Activity size={14} className="text-purple-400 animate-pulse" />
              <span className="text-xs font-bold text-purple-400 tracking-widest uppercase">SİNİR AĞI AKTİF</span>
            </div>
          </motion.div>
          
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight drop-shadow-2xl mb-4 max-w-4xl leading-tight" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
            {topMatch?.title || 'KADERİNİ SEÇ'}
          </motion.h1>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap items-center gap-4 text-slate-300 text-sm font-bold mb-6">
            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 text-emerald-400 rounded-lg uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">{soulProfile.name} Seçimi</span>
            <span className="text-white/30">•</span>
            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20"><Star size={14} className="fill-amber-400" /> {topMatch?.rating || '9.5'}</span>
            <span className="text-white/30">•</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/80">{Array.isArray(topMatch?.genre) ? topMatch.genre.slice(0,3).join(' · ') : topMatch?.genre}</span>
          </motion.div>
          
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-slate-300 text-lg sm:text-xl font-medium max-w-3xl mb-8 drop-shadow-md line-clamp-3 leading-relaxed border-l-4 border-cyan-500 pl-4 bg-gradient-to-r from-black/40 to-transparent py-2">
            Algoritmamızın derinliklerinde sana en uygun hikaye bu. {topMatch?.summary || 'Ruh profilin bu maceranın her karesinde kendinden bir parça bulacak. Kahin senin için bu seriyi özel olarak seçti.'}
          </motion.p>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-4">
            {topMatch && (
              <Link to={`/manga/${topMatch.slug}`} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 transform hover:scale-105">
                <Play size={20} className="fill-black" /> Hemen Oku
              </Link>
            )}
            <button className="px-8 py-4 bg-[#141414]/80 text-white font-black uppercase tracking-widest rounded-xl flex items-center gap-2 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300">
              <Info size={20} /> Detaylar
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── NETFLIX ROWS ── */}
      <div className="relative z-30 -mt-20">
        <NetflixRow title="Sistem Öneriyor" subtitle={`${soulProfile.name} DNA'sına Uygun`} items={row1} />
        <div className="mt-8">
          <NetflixRow title="Karanlık ve Derin" subtitle="Belki Gözden Kaçırmışsındır (Gizli Cevherler)" items={row2} />
        </div>
        {row3.length > 0 && (
          <div className="mt-8">
            <NetflixRow title="Sınırları Aş" subtitle="Konfor Alanından Çık (Zıt Kutuplar)" items={row3} />
          </div>
        )}
      </div>

      {/* ── SOUL PROFILE DASHBOARD ── */}
      <div className="relative z-30 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 mt-20 mb-16 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Terminal size={28} className="text-cyan-400" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">KAHİN <span className="text-cyan-400">ANALİZ RAPORU</span></h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Soul Mirror */}
          <div className="lg:col-span-8">
            <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden h-full group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700 transform group-hover:scale-110"><Layers className="w-64 h-64 text-cyan-500" /></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 h-full">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-[50px] rounded-full" />
                  <SoulDNA profile={soulProfile} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase bg-cyan-500/10 px-2 py-1 rounded">RUH MERTEBESİ</span>
                  </div>
                  <h3 className="text-4xl sm:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{soulProfile.name}</h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
                    {soulProfile.desc} Sistemdeki okuma geçmişin analiz edildi ve genetik eşleşme oranınız <strong className="text-cyan-400">%{soulProfile.dnaScore}</strong> olarak hesaplandı.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {soulProfile.cosmicDistribution.map(item => (
                      <div key={item.label} className="px-5 py-3 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-inner">
                        <div className="text-[10px] text-gray-500 uppercase mb-1 font-mono tracking-wider">{item.label}</div>
                        <div className="text-xl font-black text-cyan-400">%{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Metrics */}
          <div className="lg:col-span-4 space-y-4">
            <MetricBox icon={Activity} label="Okuma Ritmi" value={soulProfile.readingRhythm} subtext={`${userStats?.xp || 0} XP`} color="purple" />
            <MetricBox icon={Zap} label="Bilinç Senkronizasyonu" value={soulProfile.engagementRate} subtext={`${userStats?.totalChaptersRead || 0} okunan bölüm`} color="cyan" />
            <MetricBox icon={Shield} label="Sistem Rütbesi" value={systemRank.value} subtext={systemRank.subtext} color="pink" />
          </div>
        </div>
      </div>

    </div>
  );
}
