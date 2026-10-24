import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Smartphone, Monitor, Download, ShieldCheck, Zap, Bell,
  Moon, ChevronDown, Check, ArrowRight, ExternalLink, Sparkles,
  Laptop, AlertCircle, RefreshCw, Compass, QrCode, Sliders,
  CheckCircle2, Info, Keyboard, ScreenShare
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

// ── SVG QR KOD BİLEŞENİ ──
function MahoraQRCode({ size = 130 }) {
  return (
    <div className="relative p-2.5 bg-white rounded-2xl shadow-xl flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="160" fill="white" rx="12" />
        
        {/* Corners */}
        <rect x="12" y="12" width="36" height="36" rx="6" fill="#0f0728" />
        <rect x="18" y="18" width="24" height="24" rx="4" fill="white" />
        <rect x="22" y="22" width="16" height="16" rx="3" fill="#8b5cf6" />
        
        <rect x="112" y="12" width="36" height="36" rx="6" fill="#0f0728" />
        <rect x="118" y="18" width="24" height="24" rx="4" fill="white" />
        <rect x="122" y="22" width="16" height="16" rx="3" fill="#8b5cf6" />
        
        <rect x="12" y="112" width="36" height="36" rx="6" fill="#0f0728" />
        <rect x="18" y="118" width="24" height="24" rx="4" fill="white" />
        <rect x="22" y="122" width="16" height="16" rx="3" fill="#8b5cf6" />
        
        {/* Matrix Dots */}
        <g fill="#180e38">
          <rect x="12" y="56" width="6" height="6" rx="1.5" />
          <rect x="24" y="56" width="6" height="6" rx="1.5" />
          <rect x="18" y="66" width="6" height="6" rx="1.5" />
          <rect x="30" y="66" width="6" height="6" rx="1.5" />
          <rect x="12" y="78" width="6" height="6" rx="1.5" />
          <rect x="24" y="88" width="6" height="6" rx="1.5" />
          <rect x="36" y="98" width="6" height="6" rx="1.5" />
          
          <rect x="56" y="14" width="6" height="6" rx="1.5" />
          <rect x="68" y="14" width="6" height="6" rx="1.5" />
          <rect x="80" y="20" width="6" height="6" rx="1.5" />
          <rect x="94" y="14" width="6" height="6" rx="1.5" />
          <rect x="56" y="30" width="6" height="6" rx="1.5" />
          <rect x="70" y="32" width="6" height="6" rx="1.5" />
          <rect x="90" y="32" width="6" height="6" rx="1.5" />

          <rect x="56" y="50" width="6" height="6" rx="1.5" />
          <rect x="66" y="58" width="6" height="6" rx="1.5" />
          <rect x="76" y="50" width="6" height="6" rx="1.5" />
          <rect x="88" y="58" width="6" height="6" rx="1.5" />
          <rect x="98" y="50" width="6" height="6" rx="1.5" />

          <rect x="54" y="72" width="6" height="6" rx="1.5" />
          <rect x="66" y="78" width="6" height="6" rx="1.5" />
          <rect x="88" y="72" width="6" height="6" rx="1.5" />
          <rect x="100" y="78" width="6" height="6" rx="1.5" />

          <rect x="56" y="94" width="6" height="6" rx="1.5" />
          <rect x="68" y="100" width="6" height="6" rx="1.5" />
          <rect x="80" y="94" width="6" height="6" rx="1.5" />
          <rect x="94" y="102" width="6" height="6" rx="1.5" />

          <rect x="56" y="120" width="6" height="6" rx="1.5" />
          <rect x="68" y="132" width="6" height="6" rx="1.5" />
          <rect x="80" y="122" width="6" height="6" rx="1.5" />
          <rect x="92" y="138" width="6" height="6" rx="1.5" />

          <rect x="114" y="56" width="6" height="6" rx="1.5" />
          <rect x="126" y="64" width="6" height="6" rx="1.5" />
          <rect x="138" y="56" width="6" height="6" rx="1.5" />
          <rect x="114" y="76" width="6" height="6" rx="1.5" />
          <rect x="130" y="82" width="6" height="6" rx="1.5" />
          <rect x="142" y="76" width="6" height="6" rx="1.5" />

          <rect x="114" y="100" width="6" height="6" rx="1.5" />
          <rect x="126" y="112" width="6" height="6" rx="1.5" />
          <rect x="138" y="102" width="6" height="6" rx="1.5" />
          <rect x="118" y="128" width="6" height="6" rx="1.5" />
          <rect x="130" y="136" width="6" height="6" rx="1.5" />
          <rect x="142" y="124" width="6" height="6" rx="1.5" />
        </g>

        {/* Center Logo Badge */}
        <rect x="66" y="66" width="28" height="28" rx="7" fill="#8b5cf6" />
        <path d="M73 80L80 73L87 80" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80 73V87" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── PLATFORM VERİLERİ (GERÇEK LİNKLER VE BİLGİLER) ──
const PLATFORM_DATA = {
  android: {
    id: 'android',
    name: 'Android APK',
    title: 'MahoraPeak Android Uygulaması',
    version: 'v1.2.1',
    status: 'active',
    statusBadge: 'Stabil Sürüm',
    size: '~10 MB',
    os: 'Android 8.0 ve üzeri',
    downloadUrl: 'https://github.com/BayDuckYT/anipeak/releases/download/android-v1.2.1/mahorapeak-android.apk',
    fileName: 'mahorapeak-android.apk',
    tagline: 'Telefonunda hızlı, reklamsız ve akıcı webtoon/manga okuma deneyimi.',
    accentColor: 'emerald',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    glowColor: 'from-emerald-600/20 via-teal-600/10 to-transparent',
    btnGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]',
    icon: Smartphone,
    iconColor: 'text-emerald-400',
    steps: [
      {
        num: '01',
        title: 'APK Dosyasını İndir',
        desc: 'Doğrudan APK İndir butonuna tıklayarak mahorapeak-android.apk dosyasını telefonuna kaydet.'
      },
      {
        num: '02',
        title: 'Bilinmeyen Kaynaklara İzin Ver',
        desc: 'İndirme tamamlandığında telefonunda "Ayarlar > Güvenlik > Bu kaynaktan yüklemeye izin ver" onayını ver.'
      },
      {
        num: '03',
        title: 'Yükle ve Okumaya Başla',
        desc: 'Dosyayı açıp "Yükle" seçeneğine bas. Kurulum bittiğinde hesabına giriş yapıp sınırsız oku!'
      }
    ],
    features: [
      { icon: Zap, title: 'Hafif ve Hızlı', desc: 'Sadece 10 MB boyut, düşük bellek tüketimi ve anında açılan bölümler.' },
      { icon: Bell, title: 'Bölüm Bildirimleri', desc: 'Takip ettiğin seriler yeni bölüm yayınladığı an cihazına anlık bildirim gelir.' },
      { icon: Moon, title: 'AMOLED Saf Gece Modu', desc: 'Gerçek siyah pikseller pil tüketimini düşürür, gece gözü yormaz.' },
      { icon: ShieldCheck, title: 'Reklamsız Deneyim', desc: 'Açılır pencereler, sahte yönlendirmeler ve can sıkıcı reklamlar yok.' }
    ],
    faqs: [
      {
        q: 'APK kurulumu telefonum için güvenli mi?',
        a: 'Evet, indirme doğrudan resmi GitHub Releases depomuzdan sağlanır. Dosyalarımız üçüncü taraf zararlı kod veya casus yazılım içermez.'
      },
      {
        q: 'Yeni güncellemeleri nasıl alırım?',
        a: 'Uygulama açılışında yeni bir sürüm çıktığında ekranda güncelleme bildirimi belirir ve tek tıkla en son sürüme geçebilirsin.'
      },
      {
        q: 'Hangi Android sürümlerini destekliyor?',
        a: 'Android 8.0 (Oreo) ve üzeri tüm Android telefon ve tabletlerde sorunsuz çalışır.'
      }
    ]
  },
  windows: {
    id: 'windows',
    name: 'Windows (PC)',
    title: 'MahoraPeak Windows Masaüstü',
    version: 'v1.5.6',
    status: 'active',
    statusBadge: '64-bit Kurulum',
    size: '~65 MB',
    os: 'Windows 10 / 11 (64-bit)',
    downloadUrl: 'https://github.com/BayDuckYT/anipeak/releases/download/desktop-v1.5.6/MahoraPeak.Desktop_1.5.6_x64-setup.exe',
    fileName: 'MahoraPeak.Desktop_1.5.6_x64-setup.exe',
    tagline: 'Geniş ekran monitörler ve klavye kısayollarıyla donatılmış masaüstü istemcisi.',
    accentColor: 'blue',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    glowColor: 'from-blue-600/20 via-indigo-600/10 to-transparent',
    btnGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(59,130,246,0.4)]',
    icon: Monitor,
    iconColor: 'text-blue-400',
    steps: [
      {
        num: '01',
        title: 'Setup Dosyasını İndir',
        desc: 'MahoraPeak.Desktop_1.5.6_x64-setup.exe dosyasını bilgisayarına indir.'
      },
      {
        num: '02',
        title: 'Kurulumu Çalıştır',
        desc: 'İndirilen dosyaya çift tıkla. Windows SmartScreen uyarısı verirse "Ek Bilgi > Yine de Çalıştır" de.'
      },
      {
        num: '03',
        title: 'Masaüstünden Tek Tıkla Aç',
        desc: 'Kurulum tamamlandıktan sonra masaüstündeki MahoraPeak simgesine tıklayarak tam ekran okumaya başla.'
      }
    ],
    features: [
      { icon: ScreenShare, title: 'Tam Ekran & Ultra-Wide', desc: 'Monitörün tüm alanını kaplayan sinematik okuma modu.' },
      { icon: Keyboard, title: 'Klavye Yön Tuşları', desc: 'Sağ/sol ok tuşlarıyla pratik sayfa çevirme ve F11 tam ekran kontrolü.' },
      { icon: Zap, title: 'Düşük RAM Tüketimi', desc: 'Tarayıcı sekmelerinin aksine hafiftir, bilgisayarını yormaz ve kasmaz.' },
      { icon: RefreshCw, title: 'Otomatik Güncelleme', desc: 'Yeni bir yama geldiğinde uygulama içinden tek tıkla otomatik güncellenir.' }
    ],
    faqs: [
      {
        q: 'Windows SmartScreen uyarısı çıkarsa ne yapmalıyım?',
        a: 'Yeni sürümler Microsoft tarafından indekslenene kadar mavi uyarı çıkabilir. "Ek Bilgi"ye tıklayıp ardından "Yine de Çalıştır" butonuna basarak güvenle kurabilirsin.'
      },
      {
        q: 'Windows 7 veya 32-bit destekliyor mu?',
        a: 'Uygulama modern 64-bit mimariye sahip olup Windows 10 ve Windows 11 için optimize edilmiştir.'
      },
      {
        q: 'Okuma geçmişim web sitesiyle senkronize olur mu?',
        a: 'Evet, hesabına giriş yaptığında okuduğun bölümler, yer imlerin ve profil ayarların anlık olarak eşitlenir.'
      }
    ]
  },
  ios: {
    id: 'ios',
    name: 'iOS / iPadOS',
    title: 'MahoraPeak iOS & iPadOS',
    version: 'Geliştiriliyor',
    status: 'maintenance',
    statusBadge: 'Bakımda & Çok Yakında',
    size: 'App Store',
    os: 'iOS 15.0+ (iPhone & iPad)',
    downloadUrl: '/',
    fileName: '',
    tagline: 'Apple cihazları için özel native uygulama şu anda geliştirme ve test aşamasındadır.',
    accentColor: 'amber',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    glowColor: 'from-amber-600/20 via-purple-600/10 to-transparent',
    btnGradient: 'bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.4)]',
    icon: Laptop,
    iconColor: 'text-amber-400',
    steps: [
      {
        num: '01',
        title: 'Safari ile Siteyi Aç',
        desc: 'iPhone veya iPad cihazında Safari tarayıcısıyla mahorapeak.com.tr adresine git.'
      },
      {
        num: '02',
        title: 'Paylaş Menüsüne Dokun',
        desc: 'Ekranın altındaki araç çubuğunda yer alan "Paylaş" (Kare ve yukarı ok) simgesine tıkla.'
      },
      {
        num: '03',
        title: 'Ana Ekrana Ekle',
        desc: 'Menüden "Ana Ekrana Ekle" seçeneğini seç. Tıpkı App Store uygulaması gibi çentiksiz ve tam ekran açılır.'
      }
    ],
    features: [
      { icon: AlertCircle, title: 'App Store Hazırlığı', desc: 'Resmi App Store inceleme ve onay süreçlerimiz devam etmektedir.' },
      { icon: Compass, title: 'Safari PWA Desteği', desc: 'Resmi uygulama çıkana kadar Safari üzerinden Ana Ekrana Ekle seçeneğiyle tam ekran kullanabilirsin.' },
      { icon: Sparkles, title: 'Özel iPad Arayüzü', desc: 'iPad ekranlarına özel geniş panel tasarımı geliştirilmektedir.' },
      { icon: Bell, title: 'Duyuru Bildirimi', desc: 'iOS sürümü App Store\'da açıldığı an siteden tüm kullanıcılara duyurulacaktır.' }
    ],
    faqs: [
      {
        q: 'iOS uygulaması App Store\'a ne zaman gelecek?',
        a: 'Apple geliştirici hesabımız ve test süreçlerimiz tamamlandığında Discord sunucumuzdan ve site içi bildirim merkezinden duyurulacaktır.'
      },
      {
        q: 'Şimdilik iPhone\'da nasıl tam ekran okuyabilirim?',
        a: 'Safari ile sitemize girip "Paylaş > Ana Ekrana Ekle" adımlarını uygulayarak tarayıcı çubuğu olmadan tam ekran deneyim yaşayabilirsin.'
      }
    ]
  }
};

export default function AppsPage() {
  const [activePlatform, setActivePlatform] = useState('android');
  const [openFaq, setOpenFaq] = useState(null);

  const current = PLATFORM_DATA[activePlatform] || PLATFORM_DATA.android;
  const Icon = current.icon;
  const isMaintenance = current.status === 'maintenance';

  useSEO({
    title: 'MahoraPeak Uygulamaları - Android APK & Windows İndir',
    description: 'MahoraPeak resmi Android APK ve Windows masaüstü uygulamalarını doğrudan indirin. Hızlı, reklamsız ve akıcı manga okuma deneyimi.',
    url: 'https://mahorapeak.com.tr/indir'
  });

  return (
    <div className="min-h-screen bg-[#070511] text-slate-100 relative overflow-hidden pt-28 pb-24 selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* ── ARKA PLAN EFEKTLERİ ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr ${current.glowColor} rounded-full blur-[140px] transition-all duration-700`} />
        <div className="absolute top-2/3 right-10 w-[450px] h-[450px] bg-gradient-to-bl from-purple-600/10 via-indigo-600/5 to-transparent rounded-full blur-[130px]" />
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }} 
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* ── 1. HERO BAŞLIK ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} className="text-purple-400" />
            MahoraPeak Resmi İstemcileri
          </div>

          <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight uppercase">
            Manga Keyfini <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Cihazına Taşı</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Tarayıcı sekmelerine bağımlı kalmadan; akıllı telefonunda veya bilgisayarında yüksek performansla manga ve webtoon oku.
          </p>
        </div>

        {/* ── 2. PLATFORM SEÇİCİ SEKMELER (TABS) ── */}
        <div className="flex justify-center">
          <div className="p-1.5 rounded-2xl bg-[#0c081a] border border-white/10 flex flex-wrap justify-center gap-2 shadow-2xl backdrop-blur-xl">
            {[
              { id: 'android', label: 'Android APK', icon: Smartphone, tag: 'v1.2.1' },
              { id: 'windows', label: 'Windows (PC)', icon: Monitor, tag: 'v1.5.6' },
              { id: 'ios', label: 'iOS / iPadOS', icon: Laptop, tag: 'Bakımda' }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activePlatform === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActivePlatform(tab.id);
                    setOpenFaq(null);
                  }}
                  className={`relative flex items-center gap-2.5 px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-platform-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <TabIcon size={18} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="relative z-10">{tab.label}</span>
                  <span className={`relative z-10 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
                  }`}>
                    {tab.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. AKTİF PLATFORM ANA KARTI ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-[#0c081a]/95 border border-purple-500/25 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          >
            {/* Arka plan ışıması */}
            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl ${current.glowColor} rounded-full blur-3xl pointer-events-none`} />

            <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
              
              {/* Sol: Platform Bilgileri & İndirme Butonu */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Rozet ve Başlık */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${current.badgeColor}`}>
                      {current.statusBadge}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {current.os} • {current.size}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
                    {current.title}
                  </h2>

                  <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                    {current.tagline}
                  </p>
                </div>

                {/* Hızlı Bilgi Maddeleri */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  {current.features.slice(0, 4).map((f, i) => {
                    const FeatIcon = f.icon;
                    return (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
                        <FeatIcon size={16} className={`${current.iconColor} shrink-0 mt-0.5`} />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white">{f.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{f.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* İndirme Aksiyon Butonu */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  {!isMaintenance ? (
                    <a
                      href={current.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-8 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-95 ${current.btnGradient}`}
                    >
                      <Download size={18} />
                      <span>{current.name} Doğrudan İndir</span>
                    </a>
                  ) : (
                    <Link
                      to="/"
                      className={`px-8 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-95 ${current.btnGradient}`}
                    >
                      <Compass size={18} />
                      <span>Web Sürümünden Oku</span>
                    </Link>
                  )}

                  {!isMaintenance && (
                    <span className="text-xs text-slate-400 font-mono text-center sm:text-left">
                      Dosya: <strong className="text-slate-200">{current.fileName}</strong>
                    </span>
                  )}
                </div>

              </div>

              {/* Sağ: QR Kod veya Masaüstü Rozet Alanı */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                {current.id === 'android' ? (
                  <div className="p-6 rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-4 max-w-xs shadow-xl">
                    <div className="flex items-center gap-2 text-xs font-black text-purple-300 uppercase tracking-wider">
                      <QrCode size={16} className="text-purple-400" />
                      Telefona Doğrudan İndir
                    </div>
                    
                    <MahoraQRCode size={150} />

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Telefonunun kamerasıyla QR kodu okut, <strong className="text-white">APK doğrudan telefonuna insin!</strong>
                    </p>
                  </div>
                ) : current.id === 'windows' ? (
                  <div className="p-6 rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-4 max-w-xs shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                      <Monitor size={32} />
                    </div>

                    <h3 className="text-base font-black text-white">Masaüstü İstemcisi</h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Windows 10 ve 11 ile tam uyumlu 64-bit bağımsız kurulum. Web tarayıcısı gerektirmez.
                    </p>

                    <div className="w-full pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] font-bold text-blue-300">
                      <Keyboard size={14} />
                      <span>Yön tuşlarıyla sayfa çevirme</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-black/40 border border-amber-500/20 flex flex-col items-center text-center space-y-4 max-w-xs shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
                      <AlertCircle size={32} />
                    </div>

                    <h3 className="text-base font-black text-white">Geliştirme Aşamasında</h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      iOS uygulamamız App Store inceleme sürecindedir. Yayınlandığında buradan doğrudan indirebileceksiniz.
                    </p>

                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      Çok Yakında
                    </span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── 4. ADIM ADIM KURULUM REHBERİ (NASIL KURULUR) ── */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Nasıl Kurulur?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {current.name} için 3 kolay adımda kurulum rehberi.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {current.steps.map((st, i) => (
              <div 
                key={i}
                className="relative rounded-2xl bg-[#0c081a]/80 border border-white/5 p-6 space-y-3 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-purple-400/40 group-hover:text-purple-400 transition-colors font-mono">
                    {st.num}
                  </span>
                  <CheckCircle2 size={18} className="text-emerald-400/60" />
                </div>

                <h4 className="text-sm font-black text-white uppercase tracking-tight">
                  {st.title}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. PLATFORMA ÖZEL SSS (AKORDEON) ── */}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Sıkça Sorulan Sorular
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {current.name} hakkında merak edilenler.
            </p>
          </div>

          <div className="space-y-3">
            {current.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0c081a]/80 border border-white/5 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm font-black text-white hover:text-purple-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-400' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 sm:px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
