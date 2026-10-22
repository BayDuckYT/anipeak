import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Smartphone, Monitor, Download, ShieldCheck, Zap, WifiOff, Bell,
  Moon, Maximize2, ChevronDown, Check, ArrowRight, Star,
  ExternalLink, Sparkles, QrCode, Laptop,
  Flame, Cpu, HelpCircle, Sliders
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getOptimizedImage, handleImageError } from '../utils/imageOpt.js';

// Static configurations outside component to satisfy React Compiler & purity
const APP_VERSIONS = {
  android: {
    version: 'v1.4.0',
    size: '9.2 MB',
    minOs: 'Android 8.0 ve üzeri (Android 8 - 15+)',
    framework: 'Native Kotlin & Jetpack Compose',
    updated: 'Ekim 2026',
    downloadUrl: '/downloads/mahorapeak.apk',
    fileName: 'mahorapeak-v1.4.0.apk',
    badge: 'Resmi Android APK • v1.4.0 • Stabil Sürüm',
  },
  windows: {
    version: 'v1.2.0',
    size: '48.5 MB',
    minOs: 'Windows 10 / 11 (64-bit)',
    framework: 'DirectX & GPU Accelerated Masaüstü İstemcisi',
    updated: 'Ekim 2026',
    downloadUrl: 'https://github.com/BayDuckYT/anipeak/releases/download/v1.2.0/MahoraPeak-Setup-1.2.0.exe',
    fileName: 'MahoraPeak-Setup-1.2.0.exe',
    badge: 'Resmi Windows Sürümü • v1.2.0 • 64-bit Kurulum',
  },
  ios: {
    version: 'PWA v2.0',
    size: '< 1 MB (Anında Yükleme)',
    minOs: 'iOS 14.0+ ve iPadOS (Safari)',
    framework: 'Safari WebKit Full-Screen Standalone',
    updated: 'Canlı Güncelleme',
    downloadUrl: '/',
    badge: 'Safari Web App • Ana Ekrana Ekle • Çentiksiz',
  }
};

const PLATFORM_CONTENT = {
  android: {
    name: 'Android APK',
    tabBadge: 'v1.4',
    title: 'MahoraPeak Android Uygulaması (APK)',
    tagline: 'Akıllı Telefonunda Sınırsız, Reklamsız ve Çevrimdışı Okuma',
    accentColor: 'violet',
    glowClass: 'from-violet-600/20 via-fuchsia-600/15',
    borderClass: 'border-violet-500/30',
    featuresTitle: 'Neden MahoraPeak Android Uygulaması?',
    featuresSubtitle: 'Web tarayıcısını unutun. Kotlin ve Jetpack Compose ile yazılmış yerel Android deneyimi.',
    features: [
      {
        icon: WifiOff,
        title: 'Çevrimdışı Bölüm İndirme',
        desc: 'Metroda, uçakta ve internetin çekmediği her yerde kütüphanendeki tüm bölümleri tek tıkla indirip internetsiz oku.',
        color: 'from-violet-500 to-indigo-500',
        tag: 'İnternetsiz',
      },
      {
        icon: Sliders,
        title: 'Ses Tuşlarıyla Sayfa Çevirme',
        desc: 'Ekrana dokunarak panelleri engellemeden, telefonunun ses açma/kısma tuşlarıyla pratik şekilde sayfa geçişi yap.',
        color: 'from-fuchsia-500 to-pink-500',
        tag: 'Özel Kontrol',
      },
      {
        icon: Moon,
        title: 'Saf AMOLED #000000 Gece Modu',
        desc: 'Gerçek siyah pikseller OLED ekranlarda tamamen söner. Gece karanlığında gözlerini yormaz ve %40 pil tasarrufu sağlar.',
        color: 'from-purple-600 to-cyan-500',
        tag: 'Pil Dostu',
      },
      {
        icon: Cpu,
        title: '120 Hz Yüksek Ekran Yenileme',
        desc: 'Uzun dikey webtoon serilerinde en ufak takılma veya yırtılma olmadan, tereyağı gibi kayan 120 FPS performansı.',
        color: 'from-emerald-400 to-teal-500',
        tag: '120 Hz',
      },
      {
        icon: Bell,
        title: 'Kilit Ekranı & Anlık Push Bildirimleri',
        desc: 'Takip ettiğin serilere yeni bölüm yüklendiğinde telefonuna anında bildirim gelsin. Asla yeni bölüm kaçırma.',
        color: 'from-amber-400 to-orange-500',
        tag: 'Anlık Alarm',
      },
      {
        icon: ShieldCheck,
        title: 'Sıfır Reklam & Güvenli Kotlin Motoru',
        desc: 'Hiçbir sinir bozucu pop-up veya reklam yok. Google Play Protect uyumlu, tamamen temiz ve şeffaf altyapı.',
        color: 'from-blue-500 to-cyan-400',
        tag: 'Güvenli',
      },
    ],
    comparisonTitle: 'Mobil Web Tarayıcısı vs. MahoraPeak Android APK',
    comparisonHeaders: ['Özellik', 'Mobil Web', 'Mahora Android'],
    comparison: [
      { feature: 'Bölümleri Çevrimdışı İndirme & İnternetsiz Okuma', web: 'Sınırlı', app: true },
      { feature: 'Ses Açma/Kısma Tuşlarıyla Sayfa Çevirme', web: false, app: true },
      { feature: 'Tam Ekran Çentiksiz & Adres Çubuğu Olmadan', web: false, app: true },
      { feature: 'Kilit Ekranına Anlık Push Bildirimleri', web: false, app: true },
      { feature: '120 Hz Yüksek Ekran Yenileme Desteği', web: 'Standart', app: true },
      { feature: 'Saf #000000 AMOLED Pil Tasarrufu', web: 'Gri Koyu Mod', app: true },
      { feature: 'Sıfır Reklam ve Müdahalesiz Okuma', web: true, app: true },
    ],
    faqs: [
      {
        q: 'Android APK dosyasını kurmak güvenli mi?',
        a: 'Evet, kesinlikle güvenlidir. MahoraPeak resmi APK dosyası kendi açık kaynaklı Kotlin projemizden derlenir, hiçbir zararlı yazılım, üçüncü parti izleyici veya gizli reklam içermez. Virustotal ve Play Protect taramalarından tam not almıştır.',
      },
      {
        q: 'Bilinmeyen kaynaklardan uygulama yükleme uyarısını nasıl geçerim?',
        a: 'Google Play dışından indirilen tüm APK dosyalarında Android güvenlik amacıyla "Bilinmeyen uygulamaları yükle" uyarısı verir. İndirme tamamlandıktan sonra bildirim panelinden dosyaya tıklayın, Ayarlar butonuna basarak tarayıcınıza izin verin ve "Yükle" butonuna dokunun.',
      },
      {
        q: 'Web sitesindeki hesabım ve okuma geçmişim Android uygulamasında senkronize olur mu?',
        a: 'Evet! Web sitemizde kullandığınız e-posta veya Discord hesabınızla uygulamaya giriş yaptığınızda favori serileriniz, son kaldığınız bölümler, kütüphaneniz ve VIP/Aura rütbeniz anında eşitlenir.',
      },
      {
        q: 'Uygulama güncellemelerini nasıl alacağım?',
        a: 'MahoraPeak uygulaması açılışta yeni bir sürüm olup olmadığını otomatik olarak kontrol eder. Yeni bir versiyon yayınlandığında uygulama içinde doğrudan tek tıkla güncelleme butonu belirir.',
      },
    ],
    cta: {
      title: 'MahoraPeak Android ile Cebinde Taşı',
      desc: 'Hemen resmi APK dosyasını indirin; metroda, otobüste veya yatakta kesintisiz manhwa keyfini başlatın.',
      btnText: 'Android APK İndir (9.2 MB)',
      url: APP_VERSIONS.android.downloadUrl,
      fileName: APP_VERSIONS.android.fileName,
      isDownload: true,
      badge: 'v1.4.0 • Android 8.0+',
      icon: Smartphone
    }
  },

  windows: {
    name: 'Windows (PC)',
    tabBadge: 'x64',
    title: 'MahoraPeak Masaüstü Uygulaması (PC)',
    tagline: 'Ultra-Geniş Monitörlerde 144Hz DirectX GPU Destekli Zirve Okuma',
    accentColor: 'blue',
    glowClass: 'from-blue-600/20 via-indigo-600/15',
    borderClass: 'border-blue-500/30',
    featuresTitle: 'Neden MahoraPeak Windows Uygulaması?',
    featuresSubtitle: 'Tarayıcı sekmelerinin yarattığı bellek yükünden, kasmalarından ve çökme riskinden kurtulun.',
    features: [
      {
        icon: Monitor,
        title: 'Ultra-Geniş (21:9 & 32:9) & 4K Monitör Desteği',
        desc: 'Büyük monitörlerde web sitelerinin bıraktığı anlamsız boşlukları yok eder. Kenardan kenara çift sayfa veya dev dikey akış keyfi.',
        color: 'from-blue-500 to-indigo-500',
        tag: 'Geniş Ekran',
      },
      {
        icon: Cpu,
        title: 'DirectX & GPU Donanım Hızlandırma',
        desc: '144Hz ve 240Hz oyuncu monitörlerinde fare tekerleğiyle kaydırırken en ufak takılma veya ekran yırtılması yaşatmaz.',
        color: 'from-cyan-400 to-blue-600',
        tag: '144+ FPS',
      },
      {
        icon: Zap,
        title: 'Klavye & Fareyle Kusursuz Kontrol',
        desc: 'Ok tuşları (← / →), [Space] hızlı kaydırma, [F11] tam ekran ve [ / ] bölüm geçişleriyle elinizi fareden çekmeden okuyun.',
        color: 'from-amber-400 to-orange-500',
        tag: 'Kısayollar',
      },
      {
        icon: ShieldCheck,
        title: 'Ultra Düşük RAM & Arka Plan Uyku Modu',
        desc: 'Chrome veya Edge sekmelerine göre %70 daha az bellek tüketir. Arkada oyun oynarken bile bilgisayarınızı asla yormaz.',
        color: 'from-emerald-400 to-teal-500',
        tag: 'Hafif & Hızlı',
      },
      {
        icon: WifiOff,
        title: 'Yerel Disk Bölüm Önbellekleme',
        desc: 'İnternet kesintilerine karşı bölümleri SSD veya sabit diskinize yüksek hızda önbelleğe alır ve anında açar.',
        color: 'from-violet-500 to-purple-600',
        tag: 'Yerel Disk',
      },
      {
        icon: Maximize2,
        title: 'Özel Çift Sayfa & Manga Modu',
        desc: 'Japon mangalarını sağdan sola çift sayfa kitap görünümünde, dikey webtoonları ise kesintisiz akışta okuma özgürlüğü.',
        color: 'from-blue-600 to-cyan-400',
        tag: 'Çift Sayfa',
      },
    ],
    comparisonTitle: 'Web Tarayıcısı vs. MahoraPeak Windows Masaüstü İstemcisi',
    comparisonHeaders: ['Özellik', 'Web Tarayıcısı', 'Windows PC App'],
    comparison: [
      { feature: 'DirectX / GPU Donanım Hızlandırma (144Hz+)', web: 'Kısıtlı', app: true },
      { feature: 'Ultra-Geniş (21:9 & 32:9) Çift Sayfa Desteği', web: 'Boşluk Kalır', app: true },
      { feature: 'Özelleştirilebilir Klavye Kısayolları (← / →, Space)', web: 'Sınırlı', app: true },
      { feature: 'RAM Tüketimi (Bellek Verimliliği)', web: 'Yüksek (1.5GB+)', app: 'Çok Düşük (~120MB)' },
      { feature: 'Tam Ekran Çerçevesiz Pencere Modu', web: 'Sekme Çubuklu', app: true },
      { feature: 'Arka Planda Donma & Yeniden Yüklenme Engeli', web: false, app: true },
      { feature: 'Sıfır Reklam ve Müdahalesiz Okuma', web: true, app: true },
    ],
    faqs: [
      {
        q: 'Windows uygulamasında SmartScreen veya Defender uyarısı çıkarsa ne yapmalıyım?',
        a: 'Uygulama bağımsız açık kaynaklı derleme olduğu için Windows SmartScreen "Kişisel bilgisayarınız korundu" mavi penceresi gösterebilir. "Ek bilgi"ye tıklayıp "Yine de çalıştır" butonuna basarak güvenle kurabilirsiniz.',
      },
      {
        q: 'Windows için sistem gereksinimleri nelerdir?',
        a: 'Windows 10 veya Windows 11 (64-bit) işletim sistemi, minimum 2 GB RAM ve 100 MB disk alanı yeterlidir. Tüm modern Intel, AMD işlemciler ve ekran kartlarıyla uyumludur.',
      },
      {
        q: 'Web hesabımdaki favorilerim ve kaldığım bölümler PC uygulamasına gelir mi?',
        a: 'Evet! Uygulamayı açıp sitemizdeki hesabınızla veya Discord ile giriş yaptığınız anda tüm favorileriniz, okuma geçmişiniz ve rütbeniz eşitlenir.',
      },
      {
        q: 'Masaüstü uygulaması güncellemeleri otomatik mi yapılıyor?',
        a: 'Evet, yeni bir sürüm yayınlandığında uygulama açılışında güncelleme bildirimi verilir ve tek tıkla en son sürüme güncellenir.',
      },
    ],
    cta: {
      title: 'MahoraPeak Windows Masaüstü Sürümünü İndirin',
      desc: 'Büyük ekranınızda 144Hz akıcılık ve tam klavye hakimiyetiyle benzersiz bir çizgi roman deneyimi yaşayın.',
      btnText: 'Windows Yükleyicisini İndir (.exe)',
      url: APP_VERSIONS.windows.downloadUrl,
      fileName: APP_VERSIONS.windows.fileName,
      isDownload: true,
      badge: 'v1.2.0 • 64-bit Windows 10 & 11',
      icon: Monitor
    }
  },

  ios: {
    name: 'iOS / iPadOS',
    tabBadge: 'PWA',
    title: 'iPhone & iPad Safari Web Uygulaması (PWA)',
    tagline: 'Apple Cihazlarında Sıfır Depolama Yüküyle Tam Ekran Çentiksiz Deneyim',
    accentColor: 'pink',
    glowClass: 'from-pink-600/20 via-purple-600/15',
    borderClass: 'border-pink-500/30',
    featuresTitle: 'Neden MahoraPeak iOS Safari Uygulaması?',
    featuresSubtitle: 'App Store kısıtlamalarını ve indirme bekleme sürelerini ortadan kaldırın.',
    features: [
      {
        icon: Smartphone,
        title: 'Tam Ekran Çentiksiz Okuma Deneyimi',
        desc: 'Safari adres çubuğu ve alt kontrol paneli tamamen gizlenir. Dynamic Island ve çentikli ekranlarda kenardan kenara tam ekran.',
        color: 'from-pink-500 to-purple-500',
        tag: 'Tam Ekran',
      },
      {
        icon: Cpu,
        title: 'Apple ProMotion (120Hz) Pürüzsüz Kaydırma',
        desc: 'iPhone 13 Pro, 14 Pro, 15 Pro, 16 Pro ve iPad Pro modellerindeki 120Hz ProMotion ekranlarda yağ gibi akıcı kaydırma.',
        color: 'from-purple-500 to-indigo-500',
        tag: '120 Hz ProMotion',
      },
      {
        icon: Zap,
        title: 'Sıfır Hafıza & Anında Açılış Hızı',
        desc: 'Telefonunda gigabaytlarca yer kaplamaz (< 1 MB). Safari WebKit önbelleklemesiyle uygulama anında açılır.',
        color: 'from-amber-400 to-orange-500',
        tag: '< 1 MB Depolama',
      },
      {
        icon: Moon,
        title: 'iOS Dinamik Koyu Tema Desteği',
        desc: 'iOS sistem karanlık modunuzla otomatik olarak eşleşir. Gerçek siyah tonları ile OLED Super Retina ekranlarda gözü dinlendirir.',
        color: 'from-pink-600 to-cyan-500',
        tag: 'OLED Koyu',
      },
      {
        icon: Laptop,
        title: 'iPadOS & iPad Pro Geniş Ekran Uyumu',
        desc: 'iPad tabletlerde yatay çevirerek çift sayfa manga görünümüne geçebilir, geniş ekranda dergi kalitesinde okuyabilirsiniz.',
        color: 'from-blue-500 to-cyan-400',
        tag: 'iPad Uyumlu',
      },
      {
        icon: ShieldCheck,
        title: 'Otomatik Canlı Güncellemeler',
        desc: 'App Store inceleme süreçlerini beklemenize gerek yok. Eklenen her yeni özellik ve iyileştirme açılışta anında aktif olur.',
        color: 'from-emerald-400 to-teal-500',
        tag: 'Canlı Güncel',
      },
    ],
    comparisonTitle: 'Standart Safari Sekmesi vs. MahoraPeak iOS Web Uygulaması',
    comparisonHeaders: ['Özellik', 'Safari Sekmesi', 'Mahora iOS App'],
    comparison: [
      { feature: 'Adres Çubuğu & Alt Menü Gizleme (Tam Ekran)', web: false, app: true },
      { feature: 'Ana Ekrandan Bağımsız İkonla Tek Tıkla Başlatma', web: false, app: true },
      { feature: 'ProMotion (120Hz) Ekran Hızlandırması', web: 'Standart', app: true },
      { feature: 'Cihazda Kapladığı Hafıza Alanı', web: 'Değişken', app: '< 1 MB (Minimum)' },
      { feature: 'Uygulama İçi Akıllı Otomatik Kaydırma', web: 'Sınırlı', app: true },
      { feature: 'Sıfır Reklam ve Müdahalesiz Okuma', web: true, app: true },
      { feature: 'Otomatik Arka Plan Canlı Güncelleme', web: false, app: true },
    ],
    faqs: [
      {
        q: 'Neden doğrudan App Store indirme linki yok?',
        a: 'Apple, App Store üzerinde bağımsız manga/manhwa çeviri uygulamalarına sıkı kısıtlamalar uygulamaktadır. Bunun yerine Apple\'ın resmi olarak desteklediği ve önerdiği Safari PWA teknolojisini sunuyoruz. Bu sayede hiçbir mağaza kısıtlaması olmadan ana ekranınıza yerel bir uygulama gibi ekleyebilirsiniz.',
      },
      {
        q: 'iPhone veya iPad\'de Ana Ekrana nasıl eklerim?',
        a: 'Safari tarayıcısında web sitemize girin, ekranın en altındaki kare ve yukarı oklu Paylaş simgesine dokunun, ardından açılan menüden "Ana Ekrana Ekle"yi seçin. Saniyeler içinde ikon ana ekranınıza yerleşecektir.',
      },
      {
        q: 'Ana ekrana ekledikten sonra internet olmadan okuyabilir miyim?',
        a: 'Daha önce açtığınız ve önbelleğe alınan bölümler çevrimdışı olarak hafızada tutulur. Ancak en güncel bölümleri çekmek ve hesap senkronizasyonu için internet bağlantısı önerilir.',
      },
      {
        q: 'Uygulama iOS sürümümle uyumlu mu?',
        a: 'iOS 14.0 ve üzerindeki tüm iPhone modelleri (iPhone 8\'den en yeni iPhone 16 Pro Max\'e kadar) ve iPadOS yüklü tüm iPad tabletlerle tam uyumludur.',
      },
    ],
    cta: {
      title: 'MahoraPeak\'i iPhone & iPad Ana Ekranına Ekle',
      desc: 'Safari üzerinden saniyeler içinde ana ekranınıza ekleyin; tam ekran çentiksiz ve reklamsız okumanın keyfini çıkarın.',
      btnText: 'Safari\'de Başlat & Ana Ekrana Ekle',
      url: '/',
      fileName: '',
      isDownload: false,
      badge: 'iOS 14.0+ • iPadOS • Safari WebKit',
      icon: Laptop
    }
  }
};

// Clean stylized QR Code SVG
function StylizedQRCode({ size = 150 }) {
  return (
    <div className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
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

export default function AppsPage() {
  const [activePlatform, setActivePlatform] = useState('android');
  const [openFaq, setOpenFaq] = useState(0);

  const { series } = useApp();
  const sampleSeries = series?.slice(0, 4) || [];

  const current = PLATFORM_CONTENT[activePlatform] || PLATFORM_CONTENT.android;

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden pt-24 pb-20 selection:bg-violet-500/30 selection:text-violet-200">
      {/* Background Cyber Ambient Lights */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr ${current.glowClass} to-transparent rounded-full blur-[140px] transition-all duration-700`} />
        <div className="absolute top-2/3 right-10 w-[450px] h-[450px] bg-gradient-to-bl from-indigo-600/15 via-cyan-600/10 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-r from-purple-700/15 to-transparent rounded-full blur-[120px]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── 1. HERO SECTION ── */}
        <div className="text-center max-w-4xl mx-auto mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-950/40 backdrop-blur-md mb-6 shadow-[0_0_25px_rgba(139,92,246,0.25)]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              MahoraPeak Resmi Uygulamaları • Android &amp; Windows &amp; iOS
            </span>
            <span className="bg-violet-500/20 text-violet-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-violet-400/30">
              GÜNCEL
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15]"
          >
            En Sevdiğin Hikayeler,{' '}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.4)]">
                Her An Seninle.
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-violet-600/20 -rotate-1 rounded -z-0" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            Hangi cihazı kullanıyorsanız aşağıdan seçin; sayfanın tüm detayları, özellikleri ve kurulum rehberi seçtiğiniz sürüme göre uyarlanacaktır.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <span className="text-white font-bold">4.9 / 5.0</span> (1.800+ Değerlendirme)
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Download size={16} className="text-violet-400" />
              <span className="text-white font-bold">12.500+</span> İndirme
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={16} />
              <span>Virustotal Onaylı &amp; Güvenli</span>
            </div>
          </motion.div>
        </div>

        {/* ── 2. PLATFORM SELECTOR TABS ── */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="flex justify-center mb-8">
            <div className="p-1.5 rounded-2xl glass-strong border border-white/10 flex gap-1 sm:gap-2 shadow-2xl">
              <button
                onClick={() => setActivePlatform('android')}
                className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activePlatform === 'android'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(139,92,246,0.6)] scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smartphone size={18} className={activePlatform === 'android' ? 'text-white' : 'text-violet-400'} />
                <span>Android APK</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-black hidden sm:inline">v1.4</span>
              </button>

              <button
                onClick={() => setActivePlatform('windows')}
                className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activePlatform === 'windows'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(59,130,246,0.6)] scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Monitor size={18} className={activePlatform === 'windows' ? 'text-white' : 'text-blue-400'} />
                <span>Windows (PC)</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-black hidden sm:inline">x64</span>
              </button>

              <button
                onClick={() => setActivePlatform('ios')}
                className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activePlatform === 'ios'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_25px_rgba(236,72,153,0.6)] scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Laptop size={18} className={activePlatform === 'ios' ? 'text-white' : 'text-pink-400'} />
                <span>iOS / iPadOS</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-black hidden sm:inline">PWA</span>
              </button>
            </div>
          </div>

          {/* Active Platform Card */}
          <AnimatePresence mode="wait">
            
            {/* ── ANDROID TAB CARD ── */}
            {activePlatform === 'android' && (
              <motion.div
                key="android-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="relative rounded-3xl glass-strong border border-violet-500/30 p-6 sm:p-8 md:p-10 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-7 flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <Check size={13} /> {APP_VERSIONS.android.badge}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Boyut: <strong className="text-white">{APP_VERSIONS.android.size}</strong>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Sistem: <strong className="text-white">{APP_VERSIONS.android.minOs}</strong>
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        MahoraPeak Android Uygulaması (APK)
                      </h2>
                      <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                        Android akıllı telefon ve tabletler için sıfırdan geliştirilen resmi MahoraPeak istemcisi. Tarayıcı yükünü ve kasılmaları ortadan kaldırarak cihazınızın gücünü kullanır; internetsiz çevrimdışı okuma, saf siyah AMOLED gece modu ve ses tuşlarıyla sayfa çevirme gibi mobilde okuma keyfini zirveye çıkaran özellikler barındırır.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Bölümleri indir &amp; internetsiz çevrimdışı oku
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Ses tuşlarıyla (Vol+/Vol-) sayfa çevirme
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Saf AMOLED #000000 gece &amp; pil tasarrufu
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">✓</span>
                        120 Hz yüksek ekran yenileme akıcılığı
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <a
                        href={APP_VERSIONS.android.downloadUrl}
                        download={APP_VERSIONS.android.fileName}
                        className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-black text-base shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:shadow-[0_0_40px_rgba(139,92,246,0.8)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <Download size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                        <span>Android APK İndir ({APP_VERSIONS.android.size})</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                      <span>MD5 Doğrulanmış • Google Play Protect Uyumlu • Sıfır Reklam &amp; Casus Yazılımsız</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="p-5 rounded-2xl bg-[#090616]/90 border border-white/10 flex flex-col gap-3">
                      <span className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} /> Android Kurulum Adımları
                      </span>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                          <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center flex-shrink-0">1</span>
                          <span className="text-slate-300">İndirme butonuna basıp <strong>mahorapeak-v1.4.0.apk</strong> dosyasını indirin.</span>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                          <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center flex-shrink-0">2</span>
                          <span className="text-slate-300">Bildirime dokunup tarayıcınıza <strong>&quot;Bilinmeyen kaynaklara izin ver&quot;</strong> onayını verin.</span>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                          <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center flex-shrink-0">3</span>
                          <span className="text-slate-300"><strong>&quot;Yükle&quot;</strong> butonuna basın ve hesabınızla favorilerinizi hemen senkronize edin.</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#090616]/90 border border-white/10 flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <StylizedQRCode size={96} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-violet-300 flex items-center gap-1 mb-1">
                          <QrCode size={13} /> Telefondan Tara &amp; Yükle
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Kameranızı QR koda tutarak APK dosyasını doğrudan telefonunuza indirebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── WINDOWS TAB CARD ── */}
            {activePlatform === 'windows' && (
              <motion.div
                key="windows-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="relative rounded-3xl glass-strong border border-blue-500/30 p-6 sm:p-8 md:p-10 shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-7 flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                        <Monitor size={13} /> {APP_VERSIONS.windows.badge}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Boyut: <strong className="text-white">{APP_VERSIONS.windows.size}</strong>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Platform: <strong className="text-white">{APP_VERSIONS.windows.minOs}</strong>
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        MahoraPeak Masaüstü Uygulaması (PC)
                      </h2>
                      <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                        Geniş ekran monitörler ve masaüstü bilgisayarlar için özel olarak optimize edilmiş resmi 64-bit Windows okuyucusu. Tarayıcı sekmelerinin yarattığı bellek yükünü ve kasmaları ortadan kaldırır; DirectX GPU donanım hızlandırmasıyla 144Hz/240Hz monitörlerde yırtılmasız 120+ FPS akıcı kaydırma, ultra-geniş (21:9) çift sayfa manga modu ve tam klavye kısayol desteği sunar.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Ultra-geniş (21:9 &amp; 32:9) ve 4K monitör desteği
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Klavye kontrolleri (← / →, F11, Space, [ / ])
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">✓</span>
                        DirectX &amp; GPU donanım hızlandırma (144+ FPS)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Düşük RAM tüketimi &amp; arkada sıfır kasma
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <a
                        href={APP_VERSIONS.windows.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-base shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <Download size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                        <span>Windows Yükleyicisini İndir (.exe)</span>
                      </a>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                      <span>Resmi GitHub Sürümü • Virustotal Taramalı • 64-bit Windows 10 &amp; 11 Uyumlu</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="p-5 rounded-2xl bg-[#090616]/90 border border-white/10 flex flex-col gap-3">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} /> Windows Kurulum Adımları
                      </span>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center flex-shrink-0">1</span>
                          <span className="text-slate-300"><strong>MahoraPeak-Setup-1.2.0.exe</strong> dosyasını bilgisayarınıza indirin.</span>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center flex-shrink-0">2</span>
                          <span className="text-slate-300">Dosyayı çalıştırın (SmartScreen çıkarsa &quot;Ek bilgi&quot; ➔ &quot;Yine de çalıştır&quot;a basın).</span>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center flex-shrink-0">3</span>
                          <span className="text-slate-300">Masaüstü simgesinden tek tıkla uygulamayı açıp 144Hz keyfine başlayın.</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#090616]/90 border border-white/10 flex flex-col gap-2">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={13} /> PC Kısayol Tuşları
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-1.5 rounded bg-white/5 flex justify-between items-center px-2">
                          <span className="text-slate-300">Sayfa:</span>
                          <span className="font-mono text-blue-400 font-bold">← / →</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5 flex justify-between items-center px-2">
                          <span className="text-slate-300">Tam Ekran:</span>
                          <span className="font-mono text-blue-400 font-bold">F11 / F</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5 flex justify-between items-center px-2">
                          <span className="text-slate-300">Kaydırma:</span>
                          <span className="font-mono text-blue-400 font-bold">Space</span>
                        </div>
                        <div className="p-1.5 rounded bg-white/5 flex justify-between items-center px-2">
                          <span className="text-slate-300">Bölüm:</span>
                          <span className="font-mono text-blue-400 font-bold">[ / ]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── IOS TAB CARD ── */}
            {activePlatform === 'ios' && (
              <motion.div
                key="ios-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="relative rounded-3xl glass-strong border border-pink-500/30 p-6 sm:p-8 md:p-10 shadow-[0_0_50px_rgba(236,72,153,0.15)] overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-7 flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center gap-1.5">
                        <Laptop size={13} /> {APP_VERSIONS.ios.badge}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Boyut: <strong className="text-white">{APP_VERSIONS.ios.size}</strong>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Sistem: <strong className="text-white">{APP_VERSIONS.ios.minOs}</strong>
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        iPhone &amp; iPad Safari Web Uygulaması (PWA)
                      </h2>
                      <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                        Apple ekosistemindeki kullanıcılar için özel olarak optimize edilmiş PWA (Progressive Web App) deneyimi. App Store kısıtlamalarını ve indirme bekleme sürelerini ortadan kaldırır. Safari üzerinden tek dokunuşla ana ekranınıza eklenir; Safari&apos;nin adres çubuğu ve alt menüsü tamamen gizlenerek çentiksiz, tam ekran yerel bir uygulama gibi çalışır.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Tam ekran çentiksiz okuma (Adres çubuğu yok)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">✓</span>
                        ProMotion 120Hz ekranlarda yağ gibi akıcı kaydırma
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Sıfır hafıza kullanımı &amp; anında açılış hızı
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">✓</span>
                        Apple Retina ekran renk doğruluğu
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <Link
                        to="/"
                        className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-black text-base shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <span>Safari&apos;de Başlat &amp; Ana Ekrana Ekle</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                      <span>Apple WebKit Onaylı • Pil Dostu • App Store İndirmesi Bekletmez</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-3">
                    <span className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} /> 3 Adımda iOS Kurulumu
                    </span>
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 font-black text-xs flex items-center justify-center border border-pink-500/30 flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">Safari&apos;de Aç</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                            iPhone veya iPad cihazınızda Safari tarayıcısını kullanarak sitemize girin.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 font-black text-xs flex items-center justify-center border border-pink-500/30 flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">Paylaş Menüsüne Dokun</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                            Safari&apos;nin altındaki kare ve yukarı oklu <strong>Paylaş</strong> simgesine basın.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 font-black text-xs flex items-center justify-center border border-pink-500/30 flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">&quot;Ana Ekrana Ekle&quot;yi Seç</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                            Listeden <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğini seçin. Artık tam ekran app hazır!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── 3. DYNAMIC PLATFORM DEVICE MOCKUP ── */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
              Canlı Cihaz Önizlemesi
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {activePlatform === 'windows' ? 'Windows (PC) Masaüstü Okuyucu' : 'MahoraPeak Mobil Arayüzü'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activePlatform === 'windows' 
                ? 'Ultra-Geniş Monitör & 144Hz Donanım Hızlandırma Modu'
                : 'Saf AMOLED Gece Teması & 120 FPS Webtoon Dikey Kaydırma'}
            </p>
          </div>

          <div className="flex justify-center items-center">
            {activePlatform === 'windows' ? (
              /* Desktop UltraWide Window Mockup */
              <motion.div
                key="mock-desktop"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-4xl rounded-2xl bg-[#090616] border border-blue-500/30 shadow-[0_0_60px_rgba(59,130,246,0.25)] overflow-hidden"
              >
                <div className="px-4 py-3 bg-[#0e0a22] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-3 text-xs text-slate-400 font-mono">
                      MahoraPeak Desktop v1.2 — 64-bit UltraWide Reader
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-mono border border-blue-500/30">DIRECTX: 144 FPS</span>
                    <Maximize2 size={13} />
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 aspect-[16/9] rounded-xl overflow-hidden bg-black/60 border border-white/5 relative group">
                    <img
                      src="/premium_hero.png"
                      alt="Desktop Reader View"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-5">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400">
                        <Sparkles size={14} /> Çift Sayfa Yüksek Çözünürlüklü Manga Modu
                      </div>
                      <h4 className="text-lg font-black text-white">Zirvedeki Gölgeler • Bölüm 210</h4>
                      <p className="text-xs text-slate-300">Monitör: 2560x1440 @ 144Hz • DirectX Donanım İvmesi Açık</p>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex flex-col gap-3">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Hızlı Kontroller</span>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Ekran Modu:</span>
                        <strong className="text-white">Tam Ekran</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Kaydırma Hızı:</span>
                        <strong className="text-blue-400">Ultra Akıcı (144 FPS)</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>RAM Tüketimi:</span>
                        <strong className="text-emerald-400">~120 MB (Hafif)</strong>
                      </div>
                    </div>
                    <a
                      href={APP_VERSIONS.windows.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-center py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      <span>Windows İçin İndir (.exe)</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Mobile Phone Mockup */
              <motion.div
                key="mock-mobile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-[9/18.5] bg-black rounded-[48px] p-3 shadow-[0_0_60px_rgba(139,92,246,0.35)] border-4 border-slate-800 ring-1 ring-white/10"
              >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-end px-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                </div>

                <div className="w-full h-full bg-[#080514] rounded-[38px] overflow-hidden flex flex-col relative text-white select-none">
                  <div className="pt-8 px-4 pb-2 flex items-center justify-between border-b border-white/5 bg-[#0a0718]">
                    <div className="flex items-center gap-1.5">
                      <img 
                        src="/mahorapeaklogov2.webp" 
                        alt="MahoraPeak" 
                        className="h-6 w-auto object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="font-black text-xs tracking-wider bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        MAHORA
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ⚡ Çevrimdışı: Aktif
                    </span>
                  </div>

                  <div className="flex-1 p-3 overflow-hidden flex flex-col gap-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-violet-500/30 group">
                      <img
                        src="https://wsrv.nl/?url=https://mahorapeak.com.tr/anipeaklink.png&w=400&output=webp"
                        alt="Öne Çıkan Seri"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.src = '/premium_hero.png'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-2.5">
                        <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Son Okunan</span>
                        <h5 className="text-xs font-black text-white truncate">Zirveye Ulaşan Hükümdar</h5>
                        <p className="text-[10px] text-slate-300">Bölüm 142 • %85 Okundu</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-300">İndirilen Bölümler</span>
                        <span className="text-[10px] text-violet-400 font-semibold">Tümü (12)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {sampleSeries.slice(0, 2).map((s, idx) => (
                          <div key={s.id || idx} className="p-2 rounded-xl bg-white/5 border border-white/5 flex gap-2 items-center">
                            <img
                              src={getOptimizedImage(s.cover, 80)}
                              alt={s.title}
                              onError={handleImageError}
                              className="w-8 h-10 object-cover rounded"
                            />
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold text-white truncate">{s.title}</p>
                              <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                                <Check size={10} /> İndirildi
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto p-2.5 rounded-xl bg-violet-950/70 border border-violet-500/40 backdrop-blur-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                          <Zap size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white">120 FPS Modu</p>
                          <p className="text-[9px] text-slate-400">Pürüzsüz kaydırma açık</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">120 Hz</span>
                    </div>
                  </div>

                  <div className="py-2 px-6 border-t border-white/5 bg-[#0a0718] flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="text-violet-400 font-bold flex flex-col items-center gap-0.5">
                      <Flame size={14} /> Keşfet
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <WifiOff size={14} /> Çevrimdışı
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <Bell size={14} /> Bildirim
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── 4. DYNAMIC FEATURES GRID (ADAPTED TO SELECTED PLATFORM) ── */}
        <div className="max-w-6xl mx-auto mb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={`features-${activePlatform}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                  Öne Çıkan Avantajlar
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white mt-2">
                  {current.featuresTitle}
                </h3>
                <p className="mt-3 text-slate-400 text-sm sm:text-base">
                  {current.featuresSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {current.features.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: idx * 0.06 }}
                      className="group relative rounded-3xl glass-strong border border-white/10 p-7 hover:border-violet-500/40 transition-all duration-300 hover:shadow-[0_0_35px_rgba(139,92,246,0.2)] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-5">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <Icon size={24} />
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            {feat.tag}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                          {feat.title}
                        </h4>
                        <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-1 text-xs font-bold text-violet-400 group-hover:translate-x-1 transition-transform">
                        <span>{current.name} Özelliği</span>
                        <ArrowRight size={14} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── 5. DYNAMIC COMPARISON TABLE ── */}
        <div className="max-w-4xl mx-auto mb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={`comparison-${activePlatform}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-10">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                  Performans &amp; Karşılaştırma
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {current.comparisonTitle}
                </h3>
              </div>

              <div className="rounded-3xl glass-strong border border-white/10 overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 px-6 py-4 bg-white/[0.03] border-b border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <div className="col-span-6 sm:col-span-7">{current.comparisonHeaders[0]}</div>
                  <div className="col-span-3 sm:col-span-2 text-center">{current.comparisonHeaders[1]}</div>
                  <div className="col-span-3 text-center text-violet-400 font-black">{current.comparisonHeaders[2]}</div>
                </div>

                <div className="divide-y divide-white/5">
                  {current.comparison.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 px-6 py-4 items-center text-xs sm:text-sm hover:bg-white/[0.02] transition-colors">
                      <div className="col-span-6 sm:col-span-7 font-medium text-slate-200">
                        {row.feature}
                      </div>
                      
                      <div className="col-span-3 sm:col-span-2 text-center text-xs">
                        {row.web === true ? (
                          <span className="text-emerald-400 font-bold">✓ Var</span>
                        ) : row.web === false ? (
                          <span className="text-slate-600 font-bold">✕ Yok</span>
                        ) : (
                          <span className="text-amber-400 font-semibold">{row.web}</span>
                        )}
                      </div>

                      <div className="col-span-3 text-center text-xs">
                        {row.app === true ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-black px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Check size={13} /> Tam Destek
                          </span>
                        ) : (
                          <span className="text-violet-300 font-bold">{row.app}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── 6. DYNAMIC FAQ ACCORDION ── */}
        <div className="max-w-3xl mx-auto mb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={`faq-${activePlatform}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-10">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <HelpCircle size={14} /> {current.name} Sıkça Sorulan Sorular
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  Aklınıza Takılan Sorular
                </h3>
              </div>

              <div className="space-y-3">
                {current.faqs.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl glass border border-white/10 overflow-hidden transition-all duration-200"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-sm sm:text-base font-bold text-white">
                          {item.q}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-violet-400 transition-transform duration-300 flex-shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3"
                          >
                            {item.a}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── 7. DYNAMIC FINAL DOWNLOAD CTA BANNER ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`cta-${activePlatform}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className={`relative rounded-3xl overflow-hidden p-8 sm:p-12 text-center max-w-4xl mx-auto border ${current.borderClass} bg-gradient-to-b from-slate-950/90 to-[#070512] shadow-[0_0_80px_rgba(139,92,246,0.25)]`}
          >
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr ${current.glowClass} to-transparent rounded-full blur-[100px] pointer-events-none`} />

            <div className="relative z-10 flex flex-col items-center">
              <span className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xl mb-5">
                <Download size={28} />
              </span>

              <h3 className="text-2xl sm:text-4xl font-black text-white">
                {current.cta.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl">
                {current.cta.desc}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {current.cta.isDownload ? (
                  <a
                    href={current.cta.url}
                    download={current.cta.fileName || undefined}
                    target={activePlatform === 'windows' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-black text-sm sm:text-base shadow-[0_0_35px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Download size={20} />
                    <span>{current.cta.btnText}</span>
                  </a>
                ) : (
                  <Link
                    to={current.cta.url}
                    className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-black text-sm sm:text-base shadow-[0_0_35px_rgba(236,72,153,0.6)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Laptop size={20} />
                    <span>{current.cta.btnText}</span>
                  </Link>
                )}

                <a
                  href="https://discord.gg/mahorapeak"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-bold transition-all"
                >
                  <span>Destek &amp; Discord Topluluğu</span>
                  <ExternalLink size={16} />
                </a>
              </div>

              <p className="mt-5 text-[11px] text-slate-500">
                {current.cta.badge} • Reklamsız &amp; Kesintisiz Deneyim
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
