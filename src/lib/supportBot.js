// src/lib/supportBot.js
// MahoraPeak Akıllı Canlı Destek Botu ("Mahora Destek Asistanı") ve Öncelik Hesaplayıcı

export const PRIORITY_WEIGHTS = {
  aethe: 1000,
  ruler: 750,
  shadow: 500,
  pro: 250,
  member: 50,
  guest: 10
};

const PLAN_ALIASES = [
  { id: 'aethe', terms: ['aethe', 'efsanevi'] },
  { id: 'shadow', terms: ['shadow', 'gölge'] },
  { id: 'ruler', terms: ['ruler', 'hükümdar'] },
  { id: 'pro', terms: ['pro', 'vip'] }
];

export function getSupportPlan(user, fallbackPlan = '') {
  const source = [
    user?.active_plan_id,
    user?.plan_id,
    user?.subscription_plan,
    user?.plan,
    user?.role,
    user?.user_metadata?.plan,
    fallbackPlan
  ].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');

  const plan = PLAN_ALIASES.find(({ terms }) => terms.some(term => source.includes(term)));
  if (plan) return plan.id;
  if (!user) return 'guest';
  return user.is_elite || user.premium ? 'pro' : 'member';
}

export function getSupportPriority(user, fallbackPlan = '') {
  const plan = getSupportPlan(user, fallbackPlan);
  return PRIORITY_WEIGHTS[plan] ?? PRIORITY_WEIGHTS.member;
}

export function getSupportPlanLabel(plan) {
  return ({ aethe: 'Aethe', ruler: 'Hükümdar', shadow: 'Hükümdar Gölgesi', pro: 'Pro', member: 'Standart üye', guest: 'Misafir' })[String(plan || '').toLowerCase()] || 'Standart üye';
}

/**
 * Kullanıcı profil/abonelik bilgisine göre kuyruk öncelik puanı belirler
 * Eşit puanlarda veritabanı "created_at ASC" ile ilk yazanı en üste koyar!
 */
export function calculateSupportPriority(user, profile) {
  return getSupportPriority(user, profile?.active_plan_id || profile?.subscription_plan || profile?.plan);
}

/**
 * Öncelik bilgisi için UI rozeti (Yalnızca Admin panelinde veya gizli sistemde kullanılır)
 */
export function getPriorityMeta(priority) {
  if (priority >= 1000) {
    return {
      label: '👑 AETHE VIP (1. Sıra)',
      short: 'AETHE VIP',
      color: 'from-amber-400 to-yellow-500 text-black',
      glow: 'shadow-[0_0_15px_rgba(251,191,36,0.6)]',
      border: 'border-amber-400/60',
      badge: 'bg-amber-400/20 text-amber-300 border-amber-400/40'
    };
  }
  if (priority >= 750) {
    return {
      label: 'Hükümdar · Öncelikli',
      short: 'HÜKÜMDAR',
      color: 'from-amber-400 to-orange-500 text-black',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]',
      border: 'border-amber-400/50',
      badge: 'bg-amber-500/15 text-amber-200 border-amber-400/30'
    };
  }
  if (priority >= 500) {
    return {
      label: 'Hükümdar Gölgesi · Öncelikli',
      short: 'GÖLGE',
      color: 'from-purple-500 to-indigo-600 text-white',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]',
      border: 'border-purple-500/50',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    };
  }
  if (priority >= 250) {
    return {
      label: '⭐ PRO ÜYE',
      short: 'PRO',
      color: 'from-cyan-400 to-blue-500 text-white',
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.4)]',
      border: 'border-cyan-400/40',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    };
  }
  if (priority >= 50) {
    return {
      label: '👤 STANDART ÜYE',
      short: 'ÜYE',
      color: 'from-gray-700 to-gray-800 text-gray-200',
      glow: '',
      border: 'border-gray-700',
      badge: 'bg-gray-800 text-gray-300 border-gray-700'
    };
  }
  return {
    label: '🌐 MİSAFİR',
    short: 'MİSAFİR',
    color: 'from-gray-800 to-gray-900 text-gray-400',
    glow: '',
    border: 'border-gray-800',
    badge: 'bg-gray-900 text-gray-400 border-gray-800'
  };
}

/**
 * Hazır Destek Konuları (Kullanıcının bilet konusu seçebilmesi için)
 */
export const SUPPORT_TOPICS = [
  { id: 'general', label: '❔ Genel Destek', description: 'Listede olmayan her türlü soru ve yardım talebi', placeholder: 'Konuyu ve nasıl yardımcı olabileceğimizi kısaca anlatın...' },
  { id: 'account', label: '🔑 Hesap ve Giriş', description: 'Giriş, şifre, profil veya hesap işlemleri', placeholder: 'Hesabınızla ilgili yaşadığınız durumu anlatın...' },
  { id: 'payment', label: '💳 Üyelik ve Ödeme', description: 'Premium paket, Aura, ödeme veya iade işlemleri', placeholder: 'Ödeme ya da üyelik işlemini ve varsa işlem tarihini yazın...' },
  { id: 'campaign', label: '🎁 Kod ve Kampanyalar', description: 'Promosyon kodu, hediye veya kampanya sorunları', placeholder: 'Kampanya ya da kod adını ve karşılaştığınız durumu yazın...' },
  { id: 'content', label: '📚 Manga ve İçerik Talebi', description: 'Seri, bölüm, çeviri veya içerik önerisi', placeholder: 'Seri adını ve istediğiniz bölüm/içerik bilgisini ekleyin...' },
  { id: 'reader', label: '📖 Okuyucu ve Bölüm Sorunu', description: 'Sayfa yüklenmesi, görsel, indirme veya çevrimdışı okuma', placeholder: 'Seri, bölüm, cihaz ve gördüğünüz hata mesajını yazın...' },
  { id: 'partnership', label: '🤝 İş Birliği ve Reklam', description: 'Yayıncı, içerik üreticisi ve marka iş birlikleri', placeholder: 'İş birliği teklifinizi ve iletişim bilginizi paylaşın...' },
  { id: 'feedback', label: '💬 Öneri ve Geri Bildirim', description: 'Site deneyimi, özellik önerisi veya genel sorunlar', placeholder: 'Önerinizi ya da yaşadığınız sorunu ayrıntılarıyla yazın...' }
];

/**
 * Otomatik Bot Cevap Şablonları & Intent Eşleştirme Motoru
 */
export const BOT_KNOWLEDGE_BASE = [
  {
    id: 'connect_admin',
    keywords: ['yetkiliye bağlan', 'canlı yetkili', 'canlı destek istiyorum', 'temsilciyle görüşmek', 'insanla konuşmak', 'destek ekibine aktar'],
    reply: 'Talebiniz canlı destek yetkilimize aktarıldı. Lütfen bekleyin sayfayı kapatmayın, buradan yanıt verilecektir!',
    escalateToAdmin: true,
    actions: []
  },
  {
    id: 'aura_balance',
    keywords: ['aura', 'bakiye', 'para', 'cüzdan', 'yükle', 'ödeme', 'papara', 'iban', 'havale', 'kart'],
    reply: 'Aura yükleme işlemlerinizi MahoraPeak Cüzdan sayfasından 3D Güvenli ödeme veya Havale/EFT ile anında gerçekleştirebilirsiniz. Yüklediğiniz Auralar saniyeler içinde hesabınıza geçer!',
    actions: [
      { label: '💳 Cüzdana Git', url: '/cuzdan' },
      { label: '🛒 Market & VIP', url: '/market' }
    ]
  },
  {
    id: 'aethe_vip',
    keywords: ['aethe', 'vip', 'shadow', 'ruler', 'paket', 'abonelik', 'avantaj', 'ayrıcalık', 'nasıl aethe'],
    reply: '👑 Aethe & Shadow VIP üyelikler reklamsız izleme, 4K Ultra HD yayın, sınırsız indirme, canlı destekte 1. Sıra Önceliği ve özel profil çerçeveleri sağlar!',
    actions: [
      { label: '👑 Aethe VIP Yükselt', url: '/elite-upgrade' },
      { label: '✨ Avantajları Gör', url: '/market' }
    ]
  },
  {
    id: 'app_download',
    keywords: ['uygulama', 'indir', 'apk', 'android', 'windows', 'ios', 'ipho', 'mobil', 'pc', 'telefon'],
    reply: 'MahoraPeak uygulamalarının güncel indirme seçeneklerini Uygulamalar sayfasında bulabilirsiniz. Cihazınızı seçerek uyumlu sürüm ve kurulum adımlarını görüntüleyin.',
    actions: [
      { label: '📱 Uygulamaları İndir', url: '/indir' },
      { label: '📲 Android APK İndir', url: 'https://github.com/BayDuckYT/anipeak-app/releases/download/v2.4.0/anipeak-android-v2.4.0.apk', external: true }
    ]
  },
  {
    id: 'video_issue',
    keywords: ['açılmıyor', 'video', 'bölüm', 'sayfa yüklenmiyor', 'donuyor', 'hata', 'yüklenmiyor', 'görsel görünmüyor', 'indirme sorunu', 'çevrimdışı'],
    reply: 'Okuyucu veya bölüm sorunu için önce sayfayı yenile, ardından başka bir ağda ya da tarayıcıda dene. Sorun sürerse seri adı, bölüm numarası, cihazın ve gördüğün hata mesajıyla birlikte bu sohbete yaz; destek ekibimiz inceleyebilsin.',
    actions: [
      { label: '👨‍💻 Canlı Yetkiliye Aktar', trigger: 'force_admin' }
    ]
  },
  {
    id: 'content_request',
    keywords: ['seri önerisi', 'manga önerisi', 'seri ekleyin', 'manga ekleyin', 'içerik talebi', 'çeviri isteği'],
    reply: 'Seri veya bölüm önerini not ettim. Talebin daha hızlı değerlendirilsin diye seri adını, istediğin bölüm/çeviri bilgisini ve varsa kaynak bağlantısını da paylaşabilirsin.',
    actions: [{ label: '👨‍💻 Talebi yetkiliye ilet', trigger: 'force_admin' }]
  },
  {
    id: 'campaign',
    keywords: ['promosyon kodu', 'kampanya kodu', 'hediye kodu', 'kod çalışmıyor'],
    reply: 'Kodun geçerlilik tarihini ve hesabında daha önce kullanılıp kullanılmadığını kontrol et. Sorun devam ederse kodu ve gördüğün uyarıyı bu sohbete ekle; ekibimiz kontrol etsin.',
    actions: [{ label: '👨‍💻 Kodu yetkiliye ilet', trigger: 'force_admin' }]
  },
  {
    id: 'partnership',
    keywords: ['iş birliği', 'reklam vermek', 'sponsor olmak', 'marka iş birliği'],
    reply: 'İş birliği talebini doğru ekibe iletebilmemiz için marka/kanal adını, teklif türünü ve sana ulaşabileceğimiz e-posta adresini paylaş.',
    actions: [{ label: '👨‍💻 İş birliği talebi oluştur', trigger: 'force_admin' }]
  },
  {
    id: 'password_reset',
    keywords: ['şifre', 'giriş yapamıyorum', 'unuttum', 'hesap', 'mail gelmedi', 'e-posta'],
    reply: 'Şifrenizi unuttuysanız Şifremi Unuttum sayfasından e-posta adresinizi girerek sıfırlama bağlantısı talep edebilirsiniz. Spam klasörünü kontrol etmeyi unutmayın.',
    actions: [
      { label: '🔑 Şifremi Sıfırla', url: '/reset-password' }
    ]
  },
  {
    id: 'schedule_releases',
    keywords: ['takvim', 'yayın', 'yeni bölüm', 'ne zaman', 'hangi gün', 'saat kaç'],
    reply: 'Haftalık güncel anime yayın akışını, hangi animenin hangi gün ve saatte çıkacağını Yayın Takvimi sayfamızdan canlı olarak takip edebilirsiniz!',
    actions: [
      { label: '📅 Yayın Takvimine Git', url: '/takvim' }
    ]
  },
  {
    id: 'greetings',
    keywords: ['selam', 'merhaba', 'slm', 'hey', 'günaydın', 'iyi günler', 'iyi akşamlar', 'naber'],
    reply: 'Merhaba! Ben MahoraPeak Asistanı Mahora 🤖 Size nasıl yardımcı olabilirim? Aşağıdaki hızlı konulardan seçebilir veya sorunuzu yazabilirsiniz!',
    actions: [
      { label: '💎 Aura & Bakiye', trigger: 'aura' },
      { label: '👑 Aethe VIP', trigger: 'aethe' },
      { label: '📱 Uygulama İndir', trigger: 'uygulama' },
      { label: '👨‍💻 Yetkiliye Bağlan', trigger: 'force_admin' }
    ]
  }
];

/**
 * Kullanıcı metnini analiz edip en uygun hazır bot cevabını üretir
 */
export function analyzeSupportMessage(text) {
  if (!text || typeof text !== 'string') return null;

  const tokenize = (value) => value.toLocaleLowerCase('tr-TR').match(/[\p{L}\p{N}]+/gu) || [];
  const tokens = tokenize(text);

  // Tam kelime ve kelime öbeği eşleştirmesi; kısa parçalar (ör. "sa" içeren "sayfa") eşleşmez.
  for (const item of BOT_KNOWLEDGE_BASE) {
    const match = item.keywords.some(kw => {
      const keywordTokens = tokenize(kw);
      if (!keywordTokens.length || keywordTokens.length > tokens.length) return false;
      for (let start = 0; start <= tokens.length - keywordTokens.length; start += 1) {
        if (keywordTokens.every((token, offset) => tokens[start + offset] === token)) return true;
      }
      return false;
    });

    if (match) {
      return {
        matched: true,
        reply: item.reply,
        actions: item.actions || [],
        escalateToAdmin: !!item.escalateToAdmin,
        intent: item.id
      };
    }
  }

  // Bilinmeyen mesajları otomatik olarak canlı desteğe aktarma; kullanıcıya net seçenek sun.
  return {
    matched: false,
    reply: 'Mesajını aldım. Konunu doğru anlayabilmem için seri adı, bölüm numarası veya gördüğün hata mesajı gibi biraz daha ayrıntı yazabilirsin. İstersen aşağıdan canlı yetkiliye de aktarabilirsin.',
    actions: [{ label: '👨‍💻 Canlı yetkiliye bağlan', trigger: 'force_admin' }],
    escalateToAdmin: false,
    intent: 'fallback'
  };
}

/**
 * Admin hazır şablon cevapları (Canned responses)
 */
export const ADMIN_CANNED_RESPONSES = [
  {
    title: '👋 Karşılama',
    text: 'Merhaba! MahoraPeak Canlı Destek ekibinden ben. Talebiniz inceleniyor, size nasıl yardımcı olabilirim?'
  },
  {
    title: '🔍 İnceleme Sürüyor',
    text: 'Bildirdiğiniz durumu inceliyoruz. Kontrol tamamlandığında bu sohbet üzerinden size bilgi vereceğiz.'
  },
  {
    title: '💳 Ödeme / Aura Onayı',
    text: 'Ödemeniz ve dekontunuz kontrol edildi, Auralarınız hesabınıza başarıyla tanımlandı. İyi seyirler dileriz!'
  },
  {
    title: '🎬 Bölüm Düzeltildi',
    text: 'Bildirdiğiniz bölümün video kaynağı güncellendi ve alternatif sunucular eklendi. Sayfayı yenileyerek izleyebilirsiniz!'
  },
  {
    title: '🧹 Önbellek & Çözüm',
    text: 'Lütfen tarayıcınızın çerezlerini ve önbelleğini temizleyip (veya Ctrl+Shift+R yaparak) tekrar deneyin.'
  },
  {
    title: '✅ Çözüm & Kapanış',
    text: 'Sorununuz çözüme kavuşturulmuştur. Başka bir konuda yardımcı olabilir miyim? MahoraPeak\'i tercih ettiğiniz için teşekkür ederiz!'
  }
];
