import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Eye, BookOpen, ChevronRight, Flame, Zap,
  TrendingUp, Crown, Clock, CheckCircle, Play, Bell, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';

const statusColors = {
  'Devam Ediyor': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'Tamamlandı':   'text-blue-400 bg-blue-400/10 border-blue-400/30',
};
const statusIcons = {
  'Devam Ediyor': <Clock size={10} />,
  'Tamamlandı':   <CheckCircle size={10} />,
};

function ManhwaCard({ item, index, trendRank }) {
  const { getChapters } = useApp();
  const chapterCount = getChapters(item.id).length;

  // 5'li yıldız sistemi hesaplama (item.rating 10 üzerindense 2'ye bölüyoruz)
  const displayRating = item.rating > 5 ? (item.rating / 2) : item.rating;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      <Link to={`/manhwa/${item.id}`} className="block">
        <div className="relative rounded-2xl overflow-hidden glass border border-white/8 transition-all duration-300 group-hover:border-purple-500/40 group-hover:shadow-[0_20px_60px_rgba(168,85,247,0.25)]">
          {/* Cover */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={item?.cover}
              alt={item?.title}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=Resim+Yok'; }}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent" />

            {/* Top badges */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-1 flex-wrap">
              <div className="flex flex-col gap-1">
                {trendRank && trendRank <= 3 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/90 text-black text-[10px] font-bold w-fit">
                    <Crown size={10} />
                    #{trendRank} TREND
                  </span>
                )}
                {item.hasNewChapter && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-black w-fit animate-pulse">
                    <Sparkles size={9} /> YENİ BÖLÜM
                  </span>
                )}
              </div>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${statusColors[item.status]}`}>
                {statusIcons[item.status]}
                {item.status}
              </span>
            </div>

            {/* Rating & Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/40 to-transparent">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => {
                    const starVal = i + 1;
                    const isFull = displayRating >= starVal;
                    const isHalf = !isFull && displayRating > (starVal - 1);
                    return (
                      <div key={i} className="relative">
                        <Star size={10} className="text-slate-600" />
                        {isFull && <Star size={10} className="absolute inset-0 text-amber-400 fill-amber-400" />}
                        {isHalf && (
                          <div className="absolute inset-0 overflow-hidden w-[50%]">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-white font-black text-xs">{displayRating.toFixed(1)}</span>
              </div>
              
              {/* Professional Stats Row */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                    <BookOpen size={10} className="text-purple-400" />
                  </div>
                  <span className="truncate">{chapterCount} Bölüm</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                    <Eye size={10} className="text-blue-400" />
                  </div>
                  <span className="truncate">{(item.reads_num || 0).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
              <div className="w-14 h-14 rounded-full bg-purple-600/90 flex items-center justify-center shadow-neon-purple scale-90 group-hover:scale-100 transition-transform duration-300">
                <Play size={22} className="text-white ml-1" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-[#0a0a0c]">
            <h3 className="font-bold text-white text-sm leading-tight mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
              {item.title}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-[10px] font-medium truncate max-w-[70%]">{item.author || 'Anonim'}</p>
              <div className="flex gap-1">
                {(Array.isArray(item.genre) ? item.genre : [item.genre]).slice(0, 1).map((g) => (
                  <span key={g} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase tracking-tighter border border-purple-500/20">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Announcement ticker item
function AnnouncementItem({ ann, index }) {
  const colors = {
    chapter: 'border-purple-500/30 bg-purple-500/5',
    system:  'border-blue-500/30 bg-blue-500/5',
    update:  'border-emerald-500/30 bg-emerald-500/5',
  };
  const dotColors = {
    chapter: 'bg-purple-500',
    system:  'bg-blue-500',
    update:  'bg-emerald-500',
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[ann.type] || colors.system} group hover:bg-white/5 transition-colors`}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[ann.type] || dotColors.system} shadow-[0_0_6px_currentColor]`} />
      <p className="text-slate-300 text-sm flex-1 leading-snug">{ann.text}</p>
      <span className="text-slate-600 text-[10px] font-medium flex-shrink-0 whitespace-nowrap">{ann.time}</span>
    </motion.div>
  );
}

export default function Home({ onAuthOpen }) {
  const trendRef   = useRef(null);
  const location   = useLocation();
  const { user }   = useAuth();
  const { sortedSeries, announcements } = useApp();
  const validSeries = sortedSeries.filter(s => !s.is_deleted);

  // Featured — highest trending + most reads
  const featuredItem = validSeries.length > 0 ? validSeries[0] : null;

  useEffect(() => {
    if (location.hash === '#trendler' && trendRef.current) {
      setTimeout(() => trendRef.current.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  const handleHeroBtnClick = () => {
    if (user) {
      trendRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onAuthOpen('register');
    }
  };

  // Trending rank map
  const trendingSeriesIds = validSeries
    .filter((s) => s.isTrending)
    .slice(0, 10)
    .map((s) => s.id);

  return (
    <main className="min-h-screen" id="home-top">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/5 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(168,85,247,0.8) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(168,85,247,0.8) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/30 mb-6"
              >
                <Flame size={14} className="text-orange-400 animate-pulse" />
                <span className="text-sm text-slate-300 font-medium">
                  <span className="text-purple-400 font-bold">2.4M+</span> aktif okuyucu katıldı
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6"
              >
                <span className="text-white">Efsanevi</span>
                <br />
                <span className="gradient-text">Serüven</span>
                <br />
                <span className="text-white">Burada</span>{' '}
                <span className="text-slate-400">Başlıyor</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg"
              >
                Binlerce eşsiz Manhwa ve Webtoon serisine tek platformdan eriş.
                Koyu mod, sonsuz scroll ve sıfır gecikme ile kusursuz okuma deneyimi.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                <button
                  onClick={handleHeroBtnClick}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-base hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]"
                >
                  <Zap size={18} />
                  {user ? 'Trendleri Keşfet' : 'Ücretsiz Başla'}
                </button>
                <button
                  onClick={() => trendRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl glass border border-white/15 text-white font-semibold text-base hover:border-purple-500/40 hover:bg-purple-500/10 transition-all"
                >
                  Trendleri Keşfet <ChevronRight size={18} />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
                className="flex gap-8 mt-10"
              >
                {[
                  { label: 'Aktif Seri', value: '120+' },
                  { label: 'Bölüm', value: '8.7K+' },
                  { label: 'Kullanıcı', value: '48K+' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-black gradient-text">{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Featured card */}
            {featuredItem && (
              <motion.div
                initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="relative">
                  <div className="absolute inset-0 scale-105 blur-2xl bg-purple-600/30 rounded-3xl" />
                  <Link
                    to={`/manhwa/${featuredItem.id}`}
                    className="relative block rounded-3xl overflow-hidden glass border border-purple-500/20 animate-float shadow-2xl shadow-purple-900/40"
                  >
                    <img
                      src={featuredItem.cover}
                      alt={featuredItem.title}
                      className="w-full max-h-[520px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                       <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-xl bg-red-500/90 text-white text-xs font-bold flex items-center gap-1">
                          <Flame size={11} /> #1 TREND
                        </span>
                        {featuredItem.hasNewChapter && (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white text-xs font-black flex items-center gap-1 animate-pulse">
                            <Sparkles size={11} /> YENİ BÖLÜM
                          </span>
                        )}
                      </div>
                      <h2 className="text-white font-black text-2xl mb-1">{featuredItem.title}</h2>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                          {featuredItem.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={14} /> {featuredItem.reads_num} okuma
                        </span>
                      </div>
                    </div>
                  </Link>

                  <motion.div
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute -right-6 top-8 glass border border-white/10 rounded-2xl p-3 shadow-xl"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-400" />
                      <div>
                        <div className="text-white text-xs font-bold">{featuredItem.reads_num}</div>
                        <div className="text-slate-500 text-[10px]">Okuma</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
                    className="absolute -left-6 bottom-24 glass border border-white/10 rounded-2xl p-3 shadow-xl"
                  >
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-amber-400 fill-amber-400" />
                      <div>
                        <div className="text-white text-xs font-bold">{featuredItem.rating} / 10</div>
                        <div className="text-slate-500 text-[10px]">Puan</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050507] to-transparent" />
      </section>

      {/* ── SON HABERLER / OTOMATIK DUYURULAR ── */}
      {announcements.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass border border-white/8 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-neon-purple">
                <Bell size={15} className="text-white" />
              </div>
              <h2 className="text-white font-black text-base">Son Güncellemeler</h2>
              <span className="text-[10px] text-slate-600 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full ml-1">
                CANLI
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {announcements.slice(0, 5).map((ann, i) => (
                  <AnnouncementItem key={ann.id} ann={ann} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>
      )}

      {/* ── TRENDING GRID ── */}
      <section ref={trendRef} id="trendler" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-blue-500" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Bu Hafta</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-black text-white"
            >
              🔥 Trendler
            </motion.h2>
          </div>
          <Link
            to="/all-series"
            className="hidden sm:flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Tümünü Gör <ChevronRight size={16} />
          </Link>
        </div>

        {/* Grid — sorted: trending first, new chapter highlighted */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {validSeries?.map((item, i) => (
            <ManhwaCard
              key={item.id}
              item={item}
              index={i}
              trendRank={trendingSeriesIds?.indexOf(item.id) + 1 || null}
            />
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-blue-900/60" />
          <div className="absolute inset-0 border border-purple-500/20 rounded-3xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-600/30 blur-3xl" />
          <div className="relative z-10 text-center py-16 px-6">
            <Flame size={40} className="text-orange-400 mx-auto mb-4" />
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-3">Tüm Serileri Keşfet</h3>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Binlerce Manhwa ve Webtoon serisine ücretsiz eriş. Okumaya hemen başla!
            </p>
            <button
              onClick={handleHeroBtnClick}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-base hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple"
            >
              {user ? 'Trendleri Keşfet' : 'Hemen Başla'}
            </button>
          </div>
        </motion.div>
      </section>

      </section>
    </main>
  );
}
