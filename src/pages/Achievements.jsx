import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Lock, Info, Sparkles, Book, Zap, Users, Shield, Ghost, 
  ChevronRight, ChevronLeft, Search, Star, Target, CheckCircle2,
  Trophy, Flame, TrendingUp, RefreshCw, Filter, Layers
} from 'lucide-react';
import { useAuth, getLevelInfo } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { syncAllAchievements } from '../lib/achievementService';
import { useSEO } from '../hooks/useSEO';
import Loader from '../components/Loader';
import { AchievementLogo, DEFAULT_ACHIEVEMENTS, getAchievementMeta, ACHIEVEMENT_PALETTES } from '../data/achievementIcons';

const CATEGORIES = ['Hepsi', 'Okuma', 'İstikrar', 'Tür', 'Sosyal', 'Rütbe', 'Efsanevi'];

export default function Achievements() {
  const { user } = useAuth();

  useSEO({
    title: 'Kozmik Başarımlar & Mühürler',
    description: 'MahoraPeak başarım sistemi. Eşsiz rozetler kazanın, rütbenizi yükseltin ve profilinizde parıldayın.',
    url: 'https://mahorapeak.com.tr/achievements'
  });

  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Hepsi');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unlocked', 'locked'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalAch, setActiveModalAch] = useState(null);

  // Verileri Yükle & Otomatik Senkronize Et
  const loadData = async () => {
    try {
      // 1. Kullanıcı varsa istatistiklerden hak edilmiş başarımları tara ve veritabanına mühürle
      if (user?.id) {
        setSyncing(true);
        await syncAllAchievements(user.id);
      }

      // 2. Başarımlar listesini çek
      const { data: achData, error: achErr } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      // Eğer veritabanında henüz tablo boşsa veya veri gelmediyse varsayılan zengin listeyi kullan
      const list = (achData && achData.length > 0) ? achData : DEFAULT_ACHIEVEMENTS;
      setAchievements(list);

      // 3. Kullanıcının açtığı başarımları çek
      if (user?.id) {
        const { data: userAchData } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id);

        let unlocked = userAchData || [];

        // Kullanıcı istatistiklerine göre yerel kontrol (Fallback güvenlik ağı)
        if (unlocked.length === 0 && user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (profile) {
            const levelInfo = getLevelInfo(profile.xp || 0, profile.is_elite, profile.active_plan_id);
            const autoUnlocked = [];
            list.forEach(ach => {
              let met = false;
              if (ach.requirement_type === 'total_chapters' && (profile.total_chapters_read || 0) >= ach.requirement_value) met = true;
              if (ach.requirement_type === 'streak' && (profile.max_streak || 0) >= ach.requirement_value) met = true;
              if (ach.requirement_type === 'level' && levelInfo.level >= ach.requirement_value) met = true;
              if (ach.requirement_type === 'discord_link' && profile.discord_id) met = true;
              if (ach.requirement_type === 'comments' && (profile.comments_count || 0) >= ach.requirement_value) met = true;
              if (met) {
                autoUnlocked.push({ achievement_id: ach.id, unlocked_at: new Date().toISOString() });
              }
            });
            if (autoUnlocked.length > 0) unlocked = autoUnlocked;
          }
        }

        setUserAchievements(unlocked);
      }
    } catch (err) {
      console.error('Başarımlar yükleme hatası:', err);
      setAchievements(DEFAULT_ACHIEVEMENTS);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Manuel Yenileme / Senkronizasyon Butonu
  const handleManualSync = async () => {
    if (!user) return;
    setSyncing(true);
    await syncAllAchievements(user.id);
    await loadData();
    setSyncing(false);
  };

  // İstatistikler
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = userAchievements.length;
    const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, percent };
  }, [achievements, userAchievements]);

  // Filtrelenmiş liste
  const filteredAchievements = useMemo(() => {
    return achievements.filter(ach => {
      const isUnlocked = userAchievements.some(ua => ua.achievement_id === ach.id || String(ua.achievement_id) === String(ach.id));
      
      // Kategori filtresi
      if (selectedCategory !== 'Hepsi' && ach.category !== selectedCategory) return false;

      // Durum filtresi (Açık / Kilitli)
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;

      // Arama filtresi
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = ach.name.toLowerCase().includes(q);
        const matchDesc = ach.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [achievements, userAchievements, selectedCategory, statusFilter, searchTerm]);

  if (loading) {
    return <Loader fullScreen={false} text="Kozmik Başarımlar Yükleniyor..." />;
  }

  return (
    <div className="min-h-screen bg-[#070511] text-slate-200 pb-24 relative overflow-x-hidden pt-24 sm:pt-28">
      {/* Arka Plan Atmosferik Nebula */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-violet-600/20 via-fuchsia-600/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="mp-container">
        {/* ── ÜST BAŞLIK & İSTATİSTİK KARTLARI ── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#120D2C] via-[#0D0921] to-[#070511] p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.35)] mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600/25 border border-violet-400/40 text-violet-200 text-xs font-black uppercase tracking-wider backdrop-blur-md mb-4">
                <Trophy size={14} className="text-amber-400" />
                Kozmik Sistem Mühürleri
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none mb-4">
                KOZMİK <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">BAŞARIMLAR</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Manga oku, yorum yap, serilerini tamamla ve her biri için özel olarak tasarlanmış benzersiz mühürleri kazan. Açılan her başarım profilinde parıldayan bir unvan olarak sergilenir!
              </p>
            </div>

            {/* İlerleme ve Rozet Özeti */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md shrink-0">
              <div className="flex flex-col items-center justify-center p-3 sm:px-6">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {stats.unlocked} <span className="text-sm font-semibold text-slate-400">/ {stats.total}</span>
                </span>
                <span className="text-[10px] font-black text-violet-300 uppercase tracking-widest mt-1">
                  KAZANILAN MÜHÜR
                </span>
              </div>

              <div className="w-full sm:w-48 flex flex-col justify-center">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-300">Genel İlerleme</span>
                  <span className="text-amber-300 font-black">%{stats.percent}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 transition-all duration-700" 
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
                {user && (
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-violet-300 hover:text-white transition-colors"
                  >
                    <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Senkronize ediliyor...' : 'İlerlemeyi Yenile'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── FİLTRELER & ARAMA ÇUBUĞU ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Kategori Hapları */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md overflow-x-auto no-scrollbar max-w-full w-full md:w-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/50 scale-102'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Durum & Arama */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Durum Seçici */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-slate-300">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              >
                Tümü
              </button>
              <button
                onClick={() => setStatusFilter('unlocked')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${statusFilter === 'unlocked' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
              >
                Açılanlar
              </button>
              <button
                onClick={() => setStatusFilter('locked')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${statusFilter === 'locked' ? 'bg-slate-700/40 text-slate-300' : 'text-slate-400'}`}
              >
                Kilitliler
              </button>
            </div>

            {/* Arama */}
            <div className="relative flex-1 md:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Başarım ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-violet-500 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── BAŞARIM KARTLARI IZGARASI ── */}
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAchievements.map((ach) => {
              const isUnlocked = userAchievements.some(
                ua => ua.achievement_id === ach.id || String(ua.achievement_id) === String(ach.id)
              );
              const unlockData = userAchievements.find(
                ua => ua.achievement_id === ach.id || String(ua.achievement_id) === String(ach.id)
              );
              const meta = getAchievementMeta(ach.name, ach.category);
              const palette = ACHIEVEMENT_PALETTES[meta.palette] || ACHIEVEMENT_PALETTES.purple;

              return (
                <div
                  key={ach.id}
                  onClick={() => setActiveModalAch({ ...ach, isUnlocked, unlockData, meta, palette })}
                  className={`group relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                    isUnlocked
                      ? 'bg-[#100C24]/90 border-violet-500/30 hover:border-violet-400/70 hover:shadow-[0_10px_30px_-5px_rgba(139,92,246,0.35)] -translate-y-0.5'
                      : 'bg-black/30 border-white/[0.05] hover:border-white/20 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Arka plan yumuşak aurası */}
                  {isUnlocked && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />
                  )}

                  <div>
                    {/* Üst Kısım: Farklı Özel Logo + Kilit / Yıldız Rozeti */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <AchievementLogo
                        name={ach.name}
                        category={ach.category}
                        isUnlocked={isUnlocked}
                        size="md"
                      />

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${palette.badge}`}>
                          {ach.category}
                        </span>

                        {isUnlocked ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm" title="Kazanıldı">
                            <CheckCircle2 size={14} />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-500" title="Kilitli">
                            <Lock size={13} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Başlık */}
                    <h3 className={`text-base font-black tracking-tight leading-snug mb-1.5 transition-colors ${
                      isUnlocked ? 'text-white group-hover:text-violet-200' : 'text-slate-300'
                    }`}>
                      {isUnlocked || !ach.is_secret ? ach.name : 'GİZLİ BAŞARIM'}
                    </h3>

                    {/* Açıklama */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                      {isUnlocked || !ach.is_secret
                        ? ach.description
                        : 'Bu başarımı kazanana kadar gizemini korur.'}
                    </p>
                  </div>

                  {/* Alt Durum Çubuğu */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    {isUnlocked ? (
                      <>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Sparkles size={11} /> Mühür Açıldı
                        </span>
                        {unlockData?.unlocked_at && (
                          <span className="text-slate-400 text-[10px]">
                            {new Date(unlockData.unlocked_at).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <Target size={11} className="text-violet-400" /> Hedef
                        </span>
                        <span className="text-slate-300 font-bold bg-white/[0.05] px-2 py-0.5 rounded">
                          {ach.requirement_value}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
            <Trophy size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-white text-base font-bold mb-1">Başarım Bulunamadı</h3>
            <p className="text-slate-400 text-xs">Arama kriterlerinize uygun başarım bulunamadı.</p>
          </div>
        )}
      </div>

      {/* ── DETAY VE İNCELEME MODALI ── */}
      <AnimatePresence>
        {activeModalAch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalAch(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md rounded-3xl bg-[#0F0B24] border border-white/15 p-6 sm:p-8 shadow-2xl z-10 overflow-hidden text-center"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

              <div className="mx-auto w-fit mb-5">
                <AchievementLogo
                  name={activeModalAch.name}
                  category={activeModalAch.category}
                  isUnlocked={activeModalAch.isUnlocked}
                  size="xl"
                />
              </div>

              <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border mb-3 ${activeModalAch.palette.badge}`}>
                {activeModalAch.category}
              </span>

              <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                {activeModalAch.name}
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {activeModalAch.description}
              </p>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6 flex items-center justify-between text-xs">
                <span className="text-slate-400">Durum:</span>
                {activeModalAch.isUnlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Açıldı ({new Date(activeModalAch.unlockData?.unlocked_at || Date.now()).toLocaleDateString('tr-TR')})
                  </span>
                ) : (
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Lock size={14} /> Gereksinim: {activeModalAch.requirement_value} Puan / İşlem
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveModalAch(null)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Kapat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
