import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Smartphone, Monitor, Download, ShieldCheck, Zap, Bell,
  Moon, ChevronDown, Check, ArrowRight, ExternalLink, Sparkles,
  Laptop, AlertCircle, RefreshCw, Compass
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

// Gerçek Sürüm ve İndirme Bilgileri
const PLATFORMS = [
  {
    id: 'android',
    name: 'Android APK',
    title: 'MahoraPeak Android',
    version: 'v1.2.1',
    status: 'active',
    statusText: 'Stabil Sürüm',
    size: '~10 MB',
    os: 'Android 8.0 ve üzeri',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    glowColor: 'from-emerald-500/10 via-purple-500/10 to-indigo-500/10',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
    btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]',
    icon: Smartphone,
    iconColor: 'text-emerald-400',
    downloadUrl: 'https://github.com/BayDuckYT/anipeak/releases/download/android-v1.2.1/mahorapeak-android.apk',
    fileName: 'mahorapeak-android.apk',
    tagline: 'Akıllı telefonunda hızlı, akıcı ve reklamsız okuma deneyimi.',
    features: [
      'Hafif boyut (~10 MB) ve düşük RAM kullanımı',
      'Yeni bölüm bildirimleri',
      'AMOLED saf siyah gece teması',
      'Hızlı dokunmatik sayfa geçişleri'
    ],
    installNote: 'İndirdikten sonra cihazınızda "Bilinmeyen kaynaklardan yükleme" iznini açarak kurabilirsiniz.'
  },
  {
    id: 'windows',
    name: 'Windows (PC)',
    title: 'MahoraPeak Desktop',
    version: 'v1.5.6',
    status: 'active',
    statusText: 'Resmi Masaüstü',
    size: '~65 MB',
    os: 'Windows 10 / 11 (64-bit)',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    glowColor: 'from-blue-500/10 via-indigo-500/10 to-purple-500/10',
    borderColor: 'border-blue-500/30 hover:border-blue-500/60',
    btnBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(59,130,246,0.4)]',
    icon: Monitor,
    iconColor: 'text-blue-400',
    downloadUrl: 'https://github.com/BayDuckYT/anipeak/releases/download/desktop-v1.5.6/MahoraPeak.Desktop_1.5.6_x64-setup.exe',
    fileName: 'MahoraPeak.Desktop_1.5.6_x64-setup.exe',
    tagline: 'Bilgisayarında geniş ekran ve klavye kısayollarıyla tam ekran okuma.',
    features: [
      'Geniş monitör ve ultra-wide tam ekran desteği',
      'Klavye yön tuşlarıyla pratik sayfa çevirme',
      'Dahili güncelleme kontrolü',
      'Akıcı GPU donanım ivmesi'
    ],
    installNote: 'Kurulum dosyasını (.exe) çalıştırın. Windows Defender uyarısı çıkarsa "Ek Bilgi > Yine de Çalıştır" seçeneğini kullanın.'
  },
  {
    id: 'ios',
    name: 'iOS / iPadOS',
    title: 'MahoraPeak iOS',
    version: 'Yakında',
    status: 'maintenance',
    statusText: 'Geliştiriliyor & Bakımda',
    size: 'App Store',
    os: 'iOS 15.0+ (iPhone & iPad)',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    glowColor: 'from-amber-500/10 via-purple-500/10 to-pink-500/10',
    borderColor: 'border-amber-500/30 hover:border-amber-500/50',
    btnBg: 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
    icon: Laptop,
    iconColor: 'text-amber-400',
    downloadUrl: '/',
    fileName: '',
    tagline: 'iOS ve iPadOS için özel native uygulama şu anda geliştirme aşamasındadır.',
    features: [
      'App Store onay ve geliştirme süreci devam ediyor',
      'iPhone ve iPad ekranlarına özel arayüz tasarımı',
      'PWA desteğiyle Safari üzerinden Ana Ekrana Eklenebilir',
      'Tamamlandığında tüm üyelere duyurulacaktır'
    ],
    installNote: 'Şu anda Safari üzerinden sitemize girip "Paylaş > Ana Ekrana Ekle" diyerek tam ekran web uygulaması olarak kullanabilirsiniz.'
  }
];

const FAQS = [
  {
    q: 'Android APK dosyasını nasıl kurabilirim?',
    a: 'Yukarıdaki butona tıklayarak "mahorapeak-android.apk" dosyasını indirin. İndirme bittiğinde bildirim paneline tıklayın. Telefonunuz güvenlik uyarısı verirse "Ayarlar > Bu kaynaktan yüklemeye izin ver" seçeneğini aktif edip "Yükle" butonuna basın.'
  },
  {
    q: 'Windows uygulamasını kurarken SmartScreen uyarısı çıkarsa ne yapmalıyım?',
    a: 'Yeni sürümler Microsoft tarafından taranana kadar SmartScreen mavi bir pencere açabilir. Bu pencerede "Ek Bilgi"ye tıklayıp ardından "Yine de Çalıştır" butonuna basarak kurulumu güvenle tamamlayabilirsiniz.'
  },
  {
    q: 'Uygulamalar güvenli mi?',
    a: 'Evet, tüm indirme dosyaları doğrudan resmi açık kaynaklı GitHub Releases depomuzdan çekilmektedir. İçerisinde hiçbir zararlı kod, virüs veya üçüncü taraf reklam yazılımı bulunmaz.'
  },
  {
    q: 'iOS sürümü ne zaman yayınlanacak?',
    a: 'Apple App Store inceleme ve geliştirme süreçlerimiz devam ediyor. Geliştirme tamamlandığında Discord sunucumuzdan ve site içi bildirimlerden duyurulacaktır. Bu süreçte Safari üzerinden sitemizi "Ana Ekrana Ekle" seçeneğiyle tam ekran kullanabilirsiniz.'
  }
];

export default function AppsPage() {
  const [openFaq, setOpenFaq] = useState(null);

  useSEO({
    title: 'MahoraPeak Uygulamaları - Android APK & Windows İndir',
    description: 'MahoraPeak resmi Android APK ve Windows masaüstü uygulamalarını doğrudan indirin. Reklamsız, hızlı manga ve webtoon okuma deneyimi.',
    url: 'https://mahorapeak.com.tr/indir'
  });

  return (
    <div className="min-h-screen bg-[#070511] text-slate-100 relative overflow-hidden pt-28 pb-24 selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* ── ARKA PLAN EFEKTLERİ ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-purple-700/15 via-indigo-600/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-2/3 right-10 w-[450px] h-[450px] bg-gradient-to-bl from-blue-600/10 via-cyan-600/5 to-transparent rounded-full blur-[130px]" />
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* ── HERO BAŞLIK ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider"
          >
            <Sparkles size={14} className="text-purple-400" />
            MahoraPeak Resmi İstemcileri
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase"
          >
            Manga Keyfini <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Cihazına Taşı</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-400 leading-relaxed"
          >
            Web tarayıcısına bağlı kalmadan Android telefonunda veya Windows bilgisayarında en sevdiğin manhwa ve mangaları hızlı, takılmasız ve akıcı oku.
          </motion.p>
        </div>

        {/* ── PLATFORM KARTLARI (3'LÜ GRID) ── */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PLATFORMS.map((platform, index) => {
            const Icon = platform.icon;
            const isMaintenance = platform.status === 'maintenance';

            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.1 }}
                className={`relative rounded-3xl bg-[#0c081a]/90 backdrop-blur-xl border ${platform.borderColor} p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 shadow-lg`}
              >
                {/* Arka plan ışıması */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${platform.glowColor} opacity-50 pointer-events-none`} />

                <div className="relative z-10 space-y-6">
                  {/* Üst Kısım: İkon ve Rozet */}
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
                      <Icon size={28} className={platform.iconColor} />
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${platform.badgeColor}`}>
                        {platform.statusText}
                      </span>
                      <span className="block text-[11px] font-mono text-slate-400 mt-1 font-bold">
                        {platform.version}
                      </span>
                    </div>
                  </div>

                  {/* Başlık ve Açıklama */}
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {platform.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {platform.tagline}
                    </p>
                  </div>

                  {/* Detay Bilgi Çipleri */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400 font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5">
                      {platform.os}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5">
                      {platform.size}
                    </span>
                  </div>

                  {/* Özellikler Listesi */}
                  <div className="space-y-2.5 pt-2">
                    {platform.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check size={14} className={`${platform.iconColor} shrink-0 mt-0.5`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alt Kısım: İndirme Butonu ve Not */}
                <div className="relative z-10 pt-6 mt-6 border-t border-white/10 space-y-3">
                  {!isMaintenance ? (
                    <a
                      href={platform.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${platform.btnBg}`}
                    >
                      <Download size={16} />
                      <span>{platform.name} İndir</span>
                    </a>
                  ) : (
                    <Link
                      to="/"
                      className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${platform.btnBg}`}
                    >
                      <Compass size={16} />
                      <span>Web Sürümünden Devam Et</span>
                    </Link>
                  )}

                  <p className="text-[10px] text-slate-500 leading-normal text-center">
                    {platform.installNote}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── ÖNE ÇIKAN AVANTAJLAR ── */}
        <div className="rounded-3xl bg-[#0c081a]/60 border border-white/10 p-6 sm:p-10 backdrop-blur-xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Neden Uygulama Kullanmalısın?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Web tarayıcısının getirdiği sekmeler ve kısıtlamalar yerine doğrudan cihazına optimize çözüm.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <Zap size={22} className="text-amber-400" />
              <h4 className="text-sm font-black text-white">Yüksek Hız & Akıcılık</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gereksiz tarayıcı yükleri olmadan sayfalar anında yüklenir ve takılmadan kayar.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <Bell size={22} className="text-purple-400" />
              <h4 className="text-sm font-black text-white">Bölüm Bildirimleri</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Takip ettiğin seriler yeni bölüm yayınladığı an cihazına sesli ve anlık bildirim düşer.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <Moon size={22} className="text-indigo-400" />
              <h4 className="text-sm font-black text-white">Saf Gece Teması</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                AMOLED ve OLED ekranlarda gerçek siyah pikseller pil tasarrufu sağlar ve gözü yormaz.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <ShieldCheck size={22} className="text-emerald-400" />
              <h4 className="text-sm font-black text-white">Güvenli & Doğrudan</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tüm kurulum paketleri GitHub Releases üzerinden güvenle ve doğrudan cihazınıza iner.
              </p>
            </div>
          </div>
        </div>

        {/* ── SSS (AKORDEON) ── */}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Sıkça Sorulan Sorular
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Kurulum ve sürümlerle ilgili aklına takılabilecek sorular.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
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
