import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Zap, Trophy, Crown, Sparkles, BookOpen, MessageSquare,
  Smartphone, HelpCircle, ChevronDown, CheckCircle2,
  Flame, Award, Bot, Star, Info, Heart, ArrowRight,
  TrendingUp, Shield, Layers, Gauge, Gift, Play
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { getLevelInfo, MAX_LEVEL, RANKS } from '../lib/gamification';
import '../styles/home.css';

// ── Ultra-Akıcı Donanım Hızlandırmalı Motion Varyantları (GPU) ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
  }
};

const GUIDE_SECTIONS = [
  { id: 'xp', label: 'XP & Seviye Kasma', icon: Zap, color: 'text-amber-400' },
  { id: 'calculator', label: 'XP Simülatörü', icon: Gauge, color: 'text-cyan-400' },
  { id: 'ranks', label: 'Rütbeler & Kademeler', icon: Trophy, color: 'text-purple-400' },
  { id: 'achievements', label: 'Başarımlar & Rozetler', icon: Award, color: 'text-blue-400' },
  { id: 'market', label: 'Aura Pazarı & Görünüm', icon: Sparkles, color: 'text-fuchsia-400' },
  { id: 'elite', label: 'Elite & VIP Paketleri', icon: Crown, color: 'text-rose-400' },
  { id: 'discord', label: 'Discord Entegrasyonu', icon: Bot, color: 'text-indigo-400' },
  { id: 'faq', label: 'Sıkça Sorulan Sorular', icon: HelpCircle, color: 'text-emerald-400' },
];

const XP_ACTIVITIES = [
  {
    title: 'Bölüm Okumak',
    reward: '+10 XP',
    desc: 'Okuma ilerlemesi kaydedildiğinde hesabına XP eklenir.',
    icon: BookOpen,
    color: 'from-blue-600/25 via-cyan-600/15 to-[#0F0B24]',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    iconColor: 'text-cyan-300'
  },
  {
    title: 'Günlük Seri (Streak)',
    reward: '+100 XP / 7 gün',
    desc: 'Her yedi günlük kesintisiz okuma serisi dönümünde ek XP kazan.',
    icon: Flame,
    color: 'from-orange-600/25 via-amber-600/15 to-[#0F0B24]',
    border: 'border-orange-500/30 hover:border-orange-400/60',
    iconColor: 'text-orange-300'
  },
  {
    title: 'Seri veya bölüm puanlamak',
    reward: '+5 XP',
    desc: 'Seriye ya da bölüme ilk puanını verdiğinde XP kazanırsın.',
    icon: Star,
    color: 'from-amber-600/25 via-yellow-600/15 to-[#0F0B24]',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    iconColor: 'text-amber-300'
  }
];

const RANK_STYLES = [
  { badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40', perk: 'Yolculuğuna başla; her seviyede XP eşiği kademeli yükselir.' },
  { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', perk: 'Düzenli okumayla ilk rütbe eşiğini geç.' },
  { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', perk: 'Daha yüksek seviyelere ulaşarak okur profilini geliştir.' },
  { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', perk: 'Üst kademelerde her yeni seviye daha fazla XP ister.' },
  { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', perk: 'Ustalığa yaklaş; seviyeler arası XP aralığı genişler.' },
  { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', perk: '100. seviyeye ulaş ve en yüksek rütbeyi kazan.' },
];

const RANK_TIERS = [
  ...RANKS.map((rank, index) => ({
    level: rank.minLevel === MAX_LEVEL ? `Lv ${rank.minLevel}+` : `Lv ${rank.minLevel} - ${rank.maxLevel}`,
    name: rank.name,
    ...RANK_STYLES[index],
  })),
];

const FAQS = [
  {
    q: 'XP kazandıkça seviyem ve rütbem otomatik yükselir mi?',
    a: 'Evet! Kazandığın her XP puanı anında hesabına yansır. Yeterli XP\'ye ulaştığında seviyen ve profilindeki rütbe rozeti otomatik güncellenir.'
  },
  {
    q: 'Discord hesabımı bağlamak bana ne kazandırır?',
    a: 'Discord hesabını bağlamak XP kazandırmaz. Bağlantı, Discord özelliklerinin hesabınla eşleşmesini sağlar.'
  },
  {
    q: 'Aura Pazarı\'ndaki efektleri nasıl satın alırım?',
    a: 'Bölüm okuyarak biriktirdiğin Aura puanlarıyla veya MahoraPass avantajlarıyla pazardaki isim plaketlerini, çerçeveleri ve auraları satın alıp profilinde kuşanabilirsin.'
  },
  {
    q: 'Mobil uygulamayı nereden indirebilirim?',
    a: 'Sitemizin "Uygulama" sayfasından veya menüdeki bağlantıdan doğrudan Android APK dosyasını indirebilir veya tarayıcından "Ana Ekrana Ekle" (PWA) diyerek tek tıkla yükleyebilirsin.'
  },
  {
    q: 'İnternetsiz (çevrimdışı) okuma özelliği var mı?',
    a: 'Evet! Mobil uygulamamız ve PWA desteğimiz sayesinde beğendiğin bölümleri önceden indirip metroda, uçakta ve internet olmayan her yerde kesintisiz okuyabilirsin.'
  },
  {
    q: 'MahoraPeak Elite paketini nasıl alabilirim?',
    a: 'Premium paketlerin mevcut satın alma ve üyelik durumu için Premium sayfasındaki güncel bilgilere bakabilirsin.'
  }
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState('xp');
  const [openFaq, setOpenFaq] = useState(null);
  const [dailyChapters, setDailyChapters] = useState(10);

  useSEO({
    title: 'MahoraPeak Rehberi — XP Kasma & Kullanım Kılavuzu',
    description: 'MahoraPeak platform rehberi. Nasıl XP kasılır, rütbeler, aura pazarı, başarımlar ve platform ayrıcalıkları hakkında her şey.',
    url: 'https://mahorapeak.com.tr/rehber'
  });

  // İnteraktif XP Hesaplama Mantığı
  const calculatedStats = useMemo(() => {
    const readingXpPerDay = dailyChapters * 10;
    const monthlyXp = readingXpPerDay * 30 + Math.floor(30 / 7) * 100;
    const dailyXp = Math.round(monthlyXp / 30);
    const { level: estimatedLevel, rank: estimatedRank } = getLevelInfo(monthlyXp);
    return { dailyXp, monthlyXp, estimatedLevel, estimatedRank };
  }, [dailyChapters]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#070511] text-slate-200 pb-28 pt-24 sm:pt-28 relative overflow-x-hidden">
      {/* ── GPU-Hızlandırmalı Arka Plan Atmosferik Nebula Işıkları ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[580px] bg-gradient-to-b from-violet-600/22 via-fuchsia-600/12 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="mp-container">
        {/* ── HERO BANNER (Sinematik & Animasyonlu) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative rounded-3xl overflow-hidden border border-white/[0.09] bg-gradient-to-br from-[#140E31] via-[#0D0924] to-[#070511] p-6 sm:p-10 lg:p-12 shadow-[0_25px_70px_-15px_rgba(124,58,237,0.4)] mb-12"
        >
          {/* Hareketli Arka Plan Işık Çizgisi */}
          <div className="mp-shine absolute inset-0 pointer-events-none" />

          <div className="max-w-3xl relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/30 border border-violet-400/40 text-violet-200 text-xs font-black uppercase tracking-wider backdrop-blur-md mb-5 shadow-lg shadow-violet-950/50"
            >
              <Compass size={15} className="text-violet-300" />
              MahoraPeak Resmi Kılavuzu
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.05] mb-5">
              PLATFORM <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">REHBERİ</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-7 max-w-2xl">
              Sitede ne var ne yok, nasıl en hızlı XP kasılır, rütbeler nasıl kazanılır ve profil nasıl özelleştirilir? İhtiyacın olan tüm tüyolar ve rehber bilgileri burada!
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#xp"
                onClick={() => setActiveTab('xp')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs sm:text-sm font-bold shadow-[0_10px_30px_-8px_rgba(139,92,246,0.8)] hover:brightness-110 active:scale-95 transition-all"
              >
                <Zap size={16} /> XP Kasma Taktikleri
              </a>
              <a
                href="#calculator"
                onClick={() => setActiveTab('calculator')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs sm:text-sm font-semibold backdrop-blur-md transition-all active:scale-95"
              >
                <Gauge size={16} className="text-cyan-400" /> XP Simülatörü
              </a>
              <Link
                to="/achievements"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs sm:text-sm font-semibold backdrop-blur-md transition-all active:scale-95"
              >
                <Award size={16} className="text-amber-400" /> Başarımlar
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── KATEGORİ NAVİGASYON HAPLARI (Sticky & Yaylanan) ── */}
        <div className="sticky top-[72px] sm:top-20 z-30 py-2 sm:py-3 mb-10 sm:mb-12 bg-[#070511]/90 backdrop-blur-2xl border-y border-white/[0.08]">
          <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar py-1 px-3 sm:px-1 snap-x snap-mandatory" aria-label="Rehber bölümleri">
            {GUIDE_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveTab(sec.id);
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`relative flex shrink-0 snap-start items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-transparent shadow-lg shadow-violet-900/50 scale-102'
                      : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-white' : sec.color} />
                  {sec.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 1. BÖLÜM: XP VE SEVİYE NASIL KASILIR? ── */}
        <section id="xp" className="space-y-6 mb-20 scroll-mt-32 sm:scroll-mt-36">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <Zap size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Nasıl XP Kasılır?</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Hesabını hızla seviye atlatmak için uygulayabileceğin tüm aktiviteler</p>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {XP_ACTIVITIES.map((act, i) => {
              const Icon = act.icon;
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  className={`mp-interactive-card relative p-6 rounded-3xl bg-gradient-to-br ${act.color} border ${act.border} flex flex-col justify-between shadow-xl cursor-default overflow-hidden group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center text-white shadow-inner transform group-hover:scale-108 transition-transform">
                        <Icon size={22} className={act.iconColor} />
                      </div>
                      <span className="px-3.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-black shadow-md">
                        {act.reward}
                      </span>
                    </div>
                    <h3 className="text-white text-base sm:text-lg font-black mb-2 group-hover:text-violet-200 transition-colors">{act.title}</h3>
                    <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed">{act.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="p-5 rounded-2xl bg-violet-950/30 border border-violet-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-violet-400 shrink-0" />
              <p className="text-xs text-slate-300">
                <span className="font-bold text-white">İpucu:</span> Bot veya spam amaçlı otomatik tıklamalar sistem tarafından filtrelenir. Düzenli okuyan ve bölümlere samimi katkı sağlayan okuyucular katlanan bonuslar kazanır!
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. YENİ İNTERAKTİF BÖLÜM: CANLI XP VE KAZANÇ SİMÜLATÖRÜ ── */}
        <section id="calculator" className="space-y-6 mb-20 scroll-mt-32 sm:scroll-mt-36">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/35 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <Gauge size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Canlı XP Simülatörü</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Günde kaç bölüm okursan hangi seviyeye ulaşırsın? Kaydır ve canlı gör!</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#120F2B] via-[#0E0B20] to-[#080614] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <label className="block text-sm font-bold text-slate-200 mb-2">
                  Günde Okunan Bölüm Sayısı: <span className="text-cyan-400 text-xl font-black ml-2">{dailyChapters} Bölüm</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={dailyChapters} 
                  onChange={(e) => setDailyChapters(Number(e.target.value))}
                  className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-6"
                />

                <div className="flex justify-between text-xs text-slate-500 font-bold mb-6">
                  <span>1 Bölüm (Hafif Okur)</span>
                  <span>25 Bölüm (Tutkulu)</span>
                  <span>50 Bölüm (Efsanevi)</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-xs text-slate-400 font-medium">Günlük Tahmini XP:</span>
                  <span className="text-sm font-black text-amber-300">~{calculatedStats.dailyXp} XP</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-xs text-slate-400 font-medium">Aylık Tahmini Toplam XP:</span>
                    <span className="text-sm font-black text-cyan-300">~{calculatedStats.monthlyXp.toLocaleString('tr-TR')} XP</span>
                  </div>
                </div>
              </div>

              {/* Canlı Simülasyon Rozet Çıktısı */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/50 border border-white/10 text-center relative overflow-hidden">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-300 mb-2">
                  1 AY SONRAKİ TAHMİNİ RÜTBEN
                </span>
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600/30 to-cyan-600/20 border-2 border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.35)] mb-3 mp-float-smooth">
                  <Trophy size={36} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Seviye {calculatedStats.estimatedLevel}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {calculatedStats.estimatedRank} rütbesine ulaşırsın. Bu tahmin her gün okunan bölüm sayısına ve haftalık seri ödüllerine göre hesaplanır.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. BÖLÜM: RÜTBELER & SEVİYE KADEMELERİ ── */}
        <section id="ranks" className="space-y-6 mb-20 scroll-mt-32 sm:scroll-mt-36">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/35 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Rütbeler ve Kademe Sistemi</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Seviyene göre güncellenen rütbe unvanları</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-[#0E0B1F]/80 backdrop-blur-md overflow-hidden divide-y divide-white/[0.05] shadow-xl">
            {RANK_TIERS.map((tier, i) => (
              <div key={i} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-violet-600/10 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-24 text-xs font-black text-slate-400 shrink-0">{tier.level}</span>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border mb-1 ${tier.badge}`}>
                      {tier.name}
                    </span>
                    <p className="text-slate-300 text-xs sm:text-sm">{tier.perk}</p>
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/[0.05] px-2.5 py-1 rounded-md">
                    Seviye Kademesi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. BÖLÜM: BAŞARIMLAR & MÜHÜRLER ── */}
        <section id="achievements" className="space-y-6 mb-20 scroll-mt-32 sm:scroll-mt-36">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/35 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Başarımlar & Mühürler</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Her başarımın kendine özel renkli logosu bulunur</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#120D2A] to-[#0A0717] p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="space-y-4 max-w-xl">
              <h3 className="text-2xl font-black text-white tracking-tight">Nasıl Başarım Kazanırım?</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Okuma sayın, giriş serin, okuduğun tür çeşitliliği ve topluluk aktivitelerin sistem tarafından takip edilir. Şartları sağladığında başarımın kilidi açılır ve profilinde sergilenir!
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-1">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  Kazanılan başarımlar profilinde özel rozet vitrininde parıldar.
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  Gizli başarımlar özel şartlar gerçekleştikçe sürpriz olarak açılır.
                </li>
              </ul>
            </div>
            <Link
              to="/achievements"
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-900/50 hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              Başarımlar Sayfasına Git
            </Link>
          </div>
        </section>

        {/* ── 5. BÖLÜM: AURA PAZARI & GÖRÜNÜM ── */}
        <section id="market" className="space-y-6 mb-20 scroll-mt-32 sm:scroll-mt-36">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/35 flex items-center justify-center text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Aura Pazarı & Görünüm</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Profilini ve kullanıcı adını diğer okuyuculardan ayıran görsel efektler</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.08] hover:border-violet-500/40 transition-colors space-y-3 shadow-xl">
              <span className="text-xs font-black text-fuchsia-300 uppercase tracking-wider">İsim Plaketleri</span>
              <h3 className="text-white text-lg font-bold">Nameplates</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Yorumlarda ve profilde kullanıcı adının arkasında animasyonlu video veya neon desenli plaketler dalgalanır.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.08] hover:border-violet-500/40 transition-colors space-y-3 shadow-xl">
              <span className="text-xs font-black text-violet-300 uppercase tracking-wider">Avatar Çerçeveleri</span>
              <h3 className="text-white text-lg font-bold">Decorations</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Hareketli çerçevelerle profil resmine alevler, şimşekler veya büyülü auralar ekle.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.08] hover:border-violet-500/40 transition-colors space-y-3 shadow-xl">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Renk Özelleştirme</span>
              <h3 className="text-white text-lg font-bold">Hue Sliders</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Profil düzenleme panelinden aura ve efekt renklerinin tonunu kendi zevkine göre ayarla.
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. BÖLÜM: ELITE & VIP AVANTAJLARI ── */}
        <section id="elite" className="space-y-6 mb-20 scroll-mt-32 sm:scroll-mt-36">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/35 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Crown size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Mahora Elite & VIP Ayrıcalıkları</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Platformun en prestijli üyelerine özel ayrıcalıklar</p>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-br from-[#1C0F28] via-[#120A1A] to-[#070511] p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="space-y-2">
                <span className="text-rose-400 font-black text-sm uppercase">🚫 Sıfır Reklam</span>
                <p className="text-slate-300 text-xs leading-relaxed">Bölüm aralarında ve sitede hiçbir reklamla karşılaşmadan kesintisiz oku.</p>
              </div>
              <div className="space-y-2">
                <span className="text-purple-400 font-black text-sm uppercase">⚡ Erken Erişim</span>
                <p className="text-slate-300 text-xs leading-relaxed">Yeni bölümlere genel yayından 24 ile 48 saat önce ilk sen ulaş.</p>
              </div>
              <div className="space-y-2">
                <span className="text-amber-400 font-black text-sm uppercase">👑 Efsanevi Rozetler</span>
                <p className="text-slate-300 text-xs leading-relaxed">Tüm platformda parlayan altın veya kan kırmızısı Aethe mührüne sahip ol.</p>
              </div>
              <div className="space-y-2">
                <span className="text-cyan-400 font-black text-sm uppercase">💬 7/24 VIP Destek</span>
                <p className="text-slate-300 text-xs leading-relaxed">Discord ve site üzerinden yöneticilerle doğrudan iletişim kanalı.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-400 text-xs">Aylık veya süresiz paketlerle istediğin zaman yükseltebilirsin.</p>
              <Link
                to="/elite-upgrade"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-900/50 hover:brightness-110 active:scale-95 transition-all"
              >
                Paketleri İncele
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. BÖLÜM: DİSCORD ENTEGRASYONU ── */}
        <section id="discord" className="space-y-6 mb-20 scroll-mt-32 sm:scroll-mt-36">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/35 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Discord Senkronizasyonu</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Site ile Discord sunucunu 3 adımda bağla</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.08] hover:border-indigo-500/40 transition-colors space-y-3 shadow-xl">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">1</span>
              <h3 className="text-white text-base font-bold">Kodunu Al</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Profil sayfana gidip "Discord Hesabını Bağla" butonuna tıkla ve 5 dakikalık tek kullanımlık kodunu al.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.08] hover:border-indigo-500/40 transition-colors space-y-3 shadow-xl">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</span>
              <h3 className="text-white text-base font-bold">Bota Gönder</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Discord sunucumuzdaki bota veya komut kanalına <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded font-mono">!bagla KOD</code> şeklinde yaz.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.08] hover:border-indigo-500/40 transition-colors space-y-3 shadow-xl">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">3</span>
              <h3 className="text-white text-base font-bold">Ödülünü Kap</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Hesabın bağlandığı anda anında 250 XP hesabına yüklenir ve rollerin eşitlenir!
              </p>
            </div>
          </div>
        </section>

        {/* ── 8. BÖLÜM: SIKÇA SORULAN SORULAR ── */}
        <section id="faq" className="space-y-6 mb-20 scroll-mt-32 sm:scroll-mt-36">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sıkça Sorulan Sorular</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Merak ettiğin tüm soruların yanıtları</p>
            </div>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/[0.08] bg-[#0E0A22]/80 backdrop-blur-md overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-bold text-white">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-violet-400' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.04]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* ── ALT ÇAĞRI (FOOTER CTA) ── */}
        <div className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-fuchsia-950/40 border border-violet-500/30 shadow-2xl relative overflow-hidden">
          <div className="mp-shine absolute inset-0 pointer-events-none" />
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Başka Bir Sorun mu Var?</h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mb-6">
            Discord topluluğumuza katılarak diğer okuyucularla sohbet edebilir veya yetkililerden anında yardım alabilirsin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://discord.gg/mahorapeak"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              Discord'a Katıl
            </a>
            <Link
              to="/iletisim"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all active:scale-95"
            >
              Bize Ulaşın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
