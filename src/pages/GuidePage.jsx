import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Zap, Trophy, Crown, Sparkles, BookOpen, MessageSquare,
  Shield, Smartphone, HelpCircle, ChevronDown, ChevronRight, CheckCircle2,
  Flame, Award, Search, ArrowRight, Bot, Star, Info, ShieldCheck, Heart
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const GUIDE_SECTIONS = [
  { id: 'xp', label: 'XP & Seviye Kasma', icon: Zap, color: 'text-amber-400', border: 'border-amber-500/40' },
  { id: 'ranks', label: 'Rütbeler & Kademeler', icon: Trophy, color: 'text-purple-400', border: 'border-purple-500/40' },
  { id: 'achievements', label: 'Başarımlar & Mühürler', icon: Award, color: 'text-blue-400', border: 'border-blue-500/40' },
  { id: 'market', label: 'Aura Pazarı & Efektler', icon: Sparkles, color: 'text-fuchsia-400', border: 'border-fuchsia-500/40' },
  { id: 'elite', label: 'Elite & VIP Paketleri', icon: Crown, color: 'text-rose-400', border: 'border-rose-500/40' },
  { id: 'discord', label: 'Discord Entegrasyonu', icon: Bot, color: 'text-indigo-400', border: 'border-indigo-500/40' },
  { id: 'faq', label: 'Sıkça Sorulan Sorular', icon: HelpCircle, color: 'text-emerald-400', border: 'border-emerald-500/40' },
];

const XP_ACTIVITIES = [
  {
    title: 'Bölüm Okumak',
    reward: '+15 XP',
    desc: 'Okuduğun her manga veya manhwa bölümü bittiğinde hesabına anında XP yansır.',
    icon: BookOpen,
    color: 'from-blue-600/20 to-cyan-600/10',
    border: 'border-blue-500/30'
  },
  {
    title: 'Günlük Seri (Streak)',
    reward: 'Katlanan Bonus',
    desc: 'Her gün siteye giriş yapıp bölüm okuyarak serini koru, çarpanlı ekstra XP kazan.',
    icon: Flame,
    color: 'from-orange-600/20 to-amber-600/10',
    border: 'border-orange-500/30'
  },
  {
    title: 'Bölümlere Yorum Bırakmak',
    reward: '+5 XP',
    desc: 'Bölüm sonundaki yorum alanına fikirlerini yaz, toplulukla tartışmaya katıl.',
    icon: MessageSquare,
    color: 'from-purple-600/20 to-fuchsia-600/10',
    border: 'border-purple-500/30'
  },
  {
    title: 'Bölümleri Beğenmek',
    reward: '+2 XP',
    desc: 'Beğendiğin bölümleri kalple veya yıldızla ödüllendirerek seriyi öne çıkar.',
    icon: Heart,
    color: 'from-rose-600/20 to-pink-600/10',
    border: 'border-rose-500/30'
  },
  {
    title: 'Discord Hesabını Bağlamak',
    reward: '+250 XP (Anında)',
    desc: 'Profilinden Discord senkronizasyon kodunu alıp bot ile hesabını tek seferde bağla.',
    icon: Bot,
    color: 'from-indigo-600/20 to-violet-600/10',
    border: 'border-indigo-500/30'
  },
  {
    title: 'Kozmik Başarım Açmak',
    reward: '+50 - 500 XP',
    desc: 'Hedeflenen görevleri tamamlayıp mühür kazandıkça büyük ödül sandıkları açılır.',
    icon: Award,
    color: 'from-emerald-600/20 to-teal-600/10',
    border: 'border-emerald-500/30'
  }
];

const RANK_TIERS = [
  { level: 'Lv 1 - 9', name: 'Çaylak Okur', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40', perk: 'Temel okuma, yorum yapma ve kütüphane oluşturma.' },
  { level: 'Lv 10 - 24', name: 'Gezgin / Maceracı', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', perk: 'Mavi profil ışığı, yorumlarda öne çıkan ad rengi.' },
  { level: 'Lv 25 - 49', name: 'Kıdemli Avcı', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', perk: 'Zümrüt aurası, pazar indirimleri ve özel rozetler.' },
  { level: 'Lv 50 - 74', name: 'Üstün Avcı / Şövalye', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', perk: 'Mor kozmik parıltı, profil video afişleri ve Discord özel kanalı.' },
  { level: 'Lv 75 - 99', name: 'Hükümdar Muhafızı', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', perk: 'Ateşli aura, erken bölüm önizlemeleri ve özel ad plaketi.' },
  { level: 'Lv 100+', name: 'Mahora Hükümdarı', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', perk: 'Altın taç simgesi, tüm sitede yankılanan kozmik prestij.' },
];

const FAQS = [
  {
    q: 'XP kazandıkça seviyem otomatik yükselir mi?',
    a: 'Evet! Kazandığın her XP puanı anında hesabına işlenir. Seviye atladığında bildirim alırsın ve profilindeki rütbe rozeti otomatik olarak güncellenir.'
  },
  {
    q: 'Discord hesabımı bağlamak bana ne kazandırır?',
    a: 'Discord hesabını bağladığında tek seferlik 250 XP kazanırsın. Ayrıca Discord sunucumuzdaki seviyen ve rollerin siteye senkronize olur; VIP üyeliklerin Discord rollerine anında yansır.'
  },
  {
    q: 'Aura Pazarı\'ndaki kozmetikleri nasıl satın alırım?',
    a: 'Bölüm okuyarak ve etkinliklere katılarak biriktirdiğin Aura puanlarıyla veya MahoraPass avantajlarıyla pazardaki isim plaketlerini, çerçeveleri ve auraları satın alıp profilinde kuşanabilirsin.'
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
    a: 'Üst menüdeki veya profilindeki "Premium" sayfasına giderek aylık veya süresiz paket seçeneklerinden birini tercih edebilir ve anında tüm ayrıcalıklardan yararlanabilirsin.'
  }
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState('xp');
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useSEO({
    title: 'MahoraPeak Rehberi — XP Kasma & Kullanım Kılavuzu',
    description: 'MahoraPeak platform rehberi. Nasıl XP kasılır, rütbeler, aura pazarı, başarımlar ve platform ayrıcalıkları hakkında her şey.',
    url: 'https://mahorapeak.com.tr/rehber'
  });

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#070511] text-slate-200 pb-28 pt-24 sm:pt-28 relative overflow-x-hidden">
      {/* Arka Plan Atmosferik Parlamalar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="mp-container">
        {/* ── HERO BANNER ── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#130E2E] via-[#0E0A24] to-[#070511] p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.35)] mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600/30 border border-violet-400/40 text-violet-200 text-xs font-black uppercase tracking-wider backdrop-blur-md mb-4 shadow-sm">
              <Compass size={14} className="text-violet-300" />
              MahoraPeak Resmi Kılavuzu
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none mb-4">
              PLATFORM <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">REHBERİ</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Sitede ne var ne yok, nasıl en hızlı XP kasılır, rütbeler nasıl kazanılır ve profil nasıl özelleştirilir? İhtiyacın olan tüm taktikler ve rehber bilgileri burada!
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#xp"
                onClick={() => setActiveTab('xp')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-900/50 hover:brightness-110 transition-all"
              >
                <Zap size={16} /> XP Kasma Taktikleri
              </a>
              <Link
                to="/achievements"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs sm:text-sm font-semibold transition-all"
              >
                <Award size={16} className="text-amber-400" /> Başarımları İncele
              </Link>
            </div>
          </div>
        </div>

        {/* ── KATEGORİ NAVİGASYON HAPLARI ── */}
        <div className="sticky top-20 z-30 py-3 mb-10 bg-[#070511]/90 backdrop-blur-xl border-y border-white/[0.06]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
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
        <section id="xp" className="space-y-6 mb-16 scroll-mt-36">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Nasıl XP Kasılır?</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Hesabını hızla seviye atlatmak için uygulayabileceğin tüm aktiviteler</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {XP_ACTIVITIES.map((act, i) => {
              const Icon = act.icon;
              return (
                <div
                  key={i}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${act.color} border ${act.border} flex flex-col justify-between shadow-xl`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white shadow-inner">
                        <Icon size={22} />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-black">
                        {act.reward}
                      </span>
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2">{act.title}</h3>
                    <p className="text-slate-300 text-xs leading-relaxed">{act.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 rounded-2xl bg-violet-950/30 border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-violet-400 shrink-0" />
              <p className="text-xs text-slate-300">
                <span className="font-bold text-white">İpucu:</span> Bot veya spam amaçlı otomatik tıklamalar sistem tarafından algılanır ve puan verilmez. Düzenli ve samimi okuyucular çarpanlı bonus kazanır!
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. BÖLÜM: RÜTBELER & SEVİYE KADEMELERİ ── */}
        <section id="ranks" className="space-y-6 mb-16 scroll-mt-36">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Rütbeler ve Kademe Sistemi</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Seviye atladıkça açılan seçkin unvanlar ve ayrıcalıklar</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-[#0E0B1F]/80 backdrop-blur-md overflow-hidden divide-y divide-white/[0.05]">
            {RANK_TIERS.map((tier, i) => (
              <div key={i} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-24 text-xs font-black text-slate-400 shrink-0">{tier.level}</span>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border mb-1 ${tier.badge}`}>
                      {tier.name}
                    </span>
                    <p className="text-slate-300 text-xs sm:text-sm">{tier.perk}</p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kozmik Seviye</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. BÖLÜM: KOZMİK BAŞARIMLAR & MÜHÜRLER ── */}
        <section id="achievements" className="space-y-6 mb-16 scroll-mt-36">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Başarımlar & Mühürler</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Her başarımın kendine özel renkli bir logosu ve mühür hikayesi vardır</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#120D2A] to-[#0A0717] p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <h3 className="text-xl font-black text-white">Nasıl Başarım Kazanırım?</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Okuma hacmin, giriş serin, okuduğun tür çeşitliliği ve topluluk etkileşimlerin otomatik olarak takip edilir. Şartları sağladığında sistem başarımı kilitler ve mühür profilinde parlamaya başlar!
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  Profilinde ve vitrinde başarımlarının rozetleri sergilenir.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  Gizli başarımlar özel şartlar gerçekleştikçe sürpriz olarak açılır.
                </li>
              </ul>
            </div>
            <Link
              to="/achievements"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-900/50 hover:brightness-110 transition-all shrink-0"
            >
              Başarımlar Sayfasına Git
            </Link>
          </div>
        </section>

        {/* ── 4. BÖLÜM: AURA PAZARI & EFEKTLER ── */}
        <section id="market" className="space-y-6 mb-16 scroll-mt-36">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Aura Pazarı & Görünüm</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Profilini ve adını diğer okuyuculardan ayıran göz alıcı efektler</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
              <span className="text-xs font-black text-fuchsia-300 uppercase tracking-wider">İsim Plaketleri</span>
              <h3 className="text-white text-base font-bold">Nameplates</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Yorumlarda ve profilde kullanıcı adının arkasında animasyonlu video veya neon desenli plaketler dalgalanır.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
              <span className="text-xs font-black text-violet-300 uppercase tracking-wider">Avatar Çerçeveleri</span>
              <h3 className="text-white text-base font-bold">Decorations</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Discord tarzı hareketli spritesheet çerçevelerle profil resmine alevler, şimşekler veya büyülü auralar ekle.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Renk Özelleştirme</span>
              <h3 className="text-white text-base font-bold">Hue Sliders</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Profil düzenleme panelinden aura ve efekt renklerinin tonunu (0° - 360°) kendi zevkine göre özelleştir.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. BÖLÜM: ELITE & VIP AVANTAJLARI ── */}
        <section id="elite" className="space-y-6 mb-16 scroll-mt-36">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Crown size={20} />
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
                <p className="text-slate-300 text-xs leading-relaxed">Yeni çevrilen bölümlere genel yayından 24 ile 48 saat önce ilk sen ulaş.</p>
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-900/50 hover:brightness-110 transition-all"
              >
                Paketleri İncele
              </Link>
            </div>
          </div>
        </section>

        {/* ── 6. BÖLÜM: DİSCORD ENTEGRASYONU ── */}
        <section id="discord" className="space-y-6 mb-16 scroll-mt-36">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Discord Senkronizasyonu</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Site ile Discord sunucunu 3 adımda bağla</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">1</span>
              <h3 className="text-white text-base font-bold">Kodunu Al</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Profil sayfana gidip "Discord Hesabını Bağla" butonuna tıkla ve 5 dakikalık tek kullanımlık kodunu al.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</span>
              <h3 className="text-white text-base font-bold">Bota Gönder</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Discord sunucumuzdaki bota veya komut kanalına <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded">!bagla KOD</code> şeklinde yaz.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">3</span>
              <h3 className="text-white text-base font-bold">Ödülünü Kap</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Hesabın bağlandığı anda anında 250 XP hesabına yüklenir ve rollerin eşitlenir!
              </p>
            </div>
          </div>
        </section>

        {/* ── 7. BÖLÜM: SIKÇA SORULAN SORULAR ── */}
        <section id="faq" className="space-y-6 mb-16 scroll-mt-36">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HelpCircle size={20} />
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
        <div className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-fuchsia-950/40 border border-violet-500/30 shadow-2xl">
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Başka Bir Sorun mu Var?</h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mb-6">
            Discord topluluğumuza katılarak diğer okuyucularla sohbet edebilir veya yetkililerden anında yardım alabilirsin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://discord.gg/mahorapeak"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-lg"
            >
              Discord'a Katıl
            </a>
            <Link
              to="/iletisim"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
            >
              Bize Ulaşın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
