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
  const matchingGenres = manga.genres.filter(g => userTopGenres.some(ug => ug.toLowerCase() === g.toLowerCase()));
  const genreScore = Math.min((matchingGenres.length / Math.max(manga.genres.length, 1)) * 60, 60);
  const ratingBonus = manga.rating ? Math.min((manga.rating / 10) * 25, 25) : 10;
  const popularityBonus = manga.reads_num ? Math.min((manga.reads_num / 10000) * 15, 15) : 5;
  return Math.min(Math.round(genreScore + ratingBonus + popularityBonus), 99);
}

export default function OraclePage() {
  const { sortedSeries, chapters } = useApp();
  const { user } = useAuth();
  
  useSEO({
    title: 'Oracle',
    description: 'AniPeak Oracle - Yapay zeka destekli kişisel manhwa ve webtoon önerileri.',
    url: 'https://anipeak.com.tr/oracle'
  });

  if (!sortedSeries || sortedSeries.length === 0) {
    return <Loader fullScreen={false} text="Sistem Başlatılıyor..." />;
  }

  const { soulProfile, userStats } = useMemo(() => {
    let favoriteGenres = [];
    let favCount = 0;
    if (user?.id) {
      favCount = 0;
      favoriteGenres = [];
    }
    
    const genreCount = {};
    const readSeries = sortedSeries.filter(s => {
      const chapterList = chapters[String(s.id)];
      return chapterList && chapterList.length > 0;
    });
    
    favoriteGenres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 3; });
    readSeries.forEach(s => {
      (s.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; });
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
    const totalChaptersRead = Object.values(chapters).reduce((sum, chs) => sum + (chs?.length || 0), 0);
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
  }, [user, sortedSeries, chapters]);

  const recommendedSeries = useMemo(() => {
    if (!userStats?.topGenres) return sortedSeries.filter(s => s.rating >= 8.5).slice(0, 20);
    const scored = sortedSeries.map(s => ({ ...s, matchScore: calculateMatchScore(s, userStats.topGenres) }))
      .filter(s => s.matchScore > 60).sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, 20);
  }, [sortedSeries, userStats]);

  const systemRank = useMemo(() => {
    if (!user) return { value: 'Misafir', subtext: 'Giriş yaparak rütbenizi görün.' };
    const levelInfo = getLevelInfo(user.xp || 0, user.is_elite);
    return { value: levelInfo.rank, subtext: user.discord_id ? `Discord ile senkronize · Lv.${levelInfo.level}` : `Lv.${levelInfo.level} · Discord bağlantısı bekleniyor` };
  }, [user]);

  const topMatch = recommendedSeries[0];
  const row1 = recommendedSeries.slice(1, 10);
  const row2 = recommendedSeries.slice(10, 20);

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
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2 mb-4 px-3 py-1 bg-cyan-500/10 backdrop-blur-md rounded-full w-fit border border-cyan-500/20">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">%99 RUH EŞLEŞMESİ</span>
          </motion.div>
          
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-6xl sm:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter drop-shadow-2xl mb-4 max-w-4xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
            {topMatch?.title || 'KADERİNİ SEÇ'}
          </motion.h1>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 text-slate-300 text-sm font-bold mb-6">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded uppercase">{soulProfile.name} Seçimi</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-400"><Star size={14} className="fill-amber-400" /> {topMatch?.rating || '9.5'}</span>
            <span>•</span>
            <span className="truncate max-w-[200px]">{Array.isArray(topMatch?.genre) ? topMatch.genre.join(', ') : topMatch?.genre}</span>
          </motion.div>
          
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-slate-200 text-lg sm:text-xl font-medium max-w-2xl mb-8 drop-shadow-md line-clamp-3">
            Algoritmamızın derinliklerinde sana en uygun hikaye bu. {topMatch?.summary || 'Ruh profilin bu maceranın her karesinde kendinden bir parça bulacak.'}
          </motion.p>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-4">
            {topMatch && (
              <Link to={`/manhwa/${topMatch.id}`} className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded flex items-center gap-2 hover:bg-slate-200 transition-colors">
                <Play size={20} className="fill-black" /> Hemen Oku
              </Link>
            )}
            <button className="px-8 py-3 bg-white/20 text-white font-black uppercase tracking-widest rounded flex items-center gap-2 backdrop-blur-md hover:bg-white/30 transition-colors">
              <Info size={20} /> Detaylar
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── NETFLIX ROWS ── */}
      <div className="relative z-30 -mt-20">
        <NetflixRow title="Sistem Öneriyor" subtitle={`${soulProfile.name} DNA'sına Uygun`} items={row1} />
        <NetflixRow title="Karanlık ve Derin" subtitle="Belki Gözden Kaçırmışsındır" items={row2} />
      </div>

      {/* ── SOUL PROFILE DASHBOARD ── */}
      <div className="relative z-30 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 mt-24 mb-12">
        <div className="flex items-center gap-3 mb-8">
          <Terminal size={28} className="text-cyan-400" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">ANALİZ <span className="text-cyan-400">RAPORU</span></h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Soul Mirror */}
          <div className="lg:col-span-8">
            <div className="relative p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Layers className="w-40 h-40 text-cyan-500" /></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 h-full">
                <SoulDNA profile={soulProfile} />
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">RUH MERTEBESİ</span>
                  </div>
                  <h3 className="text-4xl font-black mb-3 text-white">{soulProfile.name}</h3>
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
          </div>

          {/* Sidebar Metrics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-[#141414] border border-white/5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Metrikler</h4>
              <div className="space-y-3">
                <MetricBox icon={Activity} label="Okuma Ritmi" value={soulProfile.readingRhythm} subtext={`${userStats?.xp || 0} XP`} color="purple" />
                <MetricBox icon={Zap} label="Etkileşim" value={soulProfile.engagementRate} subtext={`${userStats?.totalChaptersRead || 0} bölüm`} color="cyan" />
                <MetricBox icon={Shield} label="Sistem Rütbesi" value={systemRank.value} subtext={systemRank.subtext} color="pink" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
