// ============================================================
//  CONFIG — Infinity Guard Merkezi Konfigürasyon
// ============================================================

// ── Renk Paleti ─────────────────────────────────────────────
export const COLORS = {
  DANGER:      0xFF003C,  // Neon kırmızı — ban, tehdit
  CYBER_BLUE:  0x00FFFF,  // Siber mavi — bilgilendirme
  PURPLE:      0x8A2BE2,  // Mor — moderasyon
  NEON_PINK:   0xFF10F0,  // Neon pembe — uyarı
  SUCCESS:     0x00FF88,  // Yeşil — başarılı işlem
  WARNING:     0xFFAA00,  // Turuncu — uyarı
  DARK:        0x0D0D1A,  // Koyu arkaplan
  LOG_EDIT:    0x3498DB,  // Mavi — düzenleme logu
  LOG_DELETE:  0xE74C3C,  // Kırmızı — silme logu
  LOG_VOICE:   0x9B59B6,  // Mor — ses logu
  LOG_JOIN:    0x2ECC71,  // Yeşil — katılma
  LOG_LEAVE:   0xE67E22,  // Turuncu — ayrılma
};

// ── MahoraPeak Branding ────────────────────────────────────────
export const MAHORAPEAK = {
  FOOTER_TEXT: '⚡ Infinity Guard | MahoraPeak Haber Merkezi',
  FOOTER_ICON: 'https://cdn.discordapp.com/embed/avatars/0.png',
  PANEL_TITLE: '🛡️ INFINITY GUARD — YÖNETİM MERKEZİ',
};

// ── Log Kanalı ──────────────────────────────────────────────
export const LOG_CHANNEL_NAME = 'infinity-log';
export const CEZA_LOG_CHANNEL_ID = '1494328428646629377';

// ── Bağlantı Yasaklı Kanallar (Mutlak Engel) ──────────────
export const STRICT_LINK_CHANNELS = [
  '1494328426318925985',
  '1494328426570449077',
  '1494328426570449078',
  '1494328426570449083'
];

// ── Anti-Link Whitelist ─────────────────────────────────────
export const WHITELIST_DOMAINS = [
  'mahorapeak.com.tr',
  'discord.gg/mahorapeak',
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'instagram.com',
  'github.com',
  'spotify.com',
  'open.spotify.com',
  'soundcloud.com',
  'deezer.com',
  'tenor.com'
];

// ── Yasaklı Link Kalıpları (Regex) ─────────────────────────
export const BLOCKED_PATTERNS = [
  /discord\.gg\/[a-zA-Z0-9]+/gi,
  /discord\.com\/invite\/[a-zA-Z0-9]+/gi,
  /https?:\/\/(?!.*(?:mahorapeak\.com\.tr|youtube\.com|youtu\.be|twitter\.com|x\.com|instagram\.com|github\.com))[a-zA-Z0-9-]+\.(com|org|net|io|gg|me|xyz|site|online|fun|click|top|info|moe)(?:\/[^\s]*)?/gi,
];

// ── Anti-Spam Ayarları ──────────────────────────────────────
export const SPAM_CONFIG = {
  MAX_MESSAGES: 5,
  TIME_WINDOW_MS: 5000,
  TIMEOUT_DURATION_MS: 10 * 60 * 1000, // 10 dakika
};

// ── Güvenlik Konfigürasyonu (Yazma Güvenliği) ────────────────
export const SECURITY_CONFIG = {
  BAD_WORDS_FILTER: true,
  CAPS_LOCK_FILTER: true,
  CAPS_LOCK_PERCENTAGE: 70, // %70'den fazlası büyük harfse
  DUPLICATE_FILTER: true,
  MIN_LENGTH_FOR_CAPS: 10,  // En az 10 karakterlik mesajlarda caps kontrolü
};

// ── Küfür Filtresi (Akıllı Regex Tabanlı) ────────────────────
// NOT: Sadece gerçek küfür KÖKLERİ burada. Normal kelimeler (allah, din, ataturk vb.) YOK.
// Her kök regex olarak aranır — varyasyonları otomatik yakalar.
// Kelime sınırı (\b) kullanılarak "kanal" içindeki "anal" gibi yanlış tespitler önlenir.
export const PROFANITY_ROOTS = [
  // Türkçe küfür kökleri (tam kelime eşleşmesi — \b ile)
  'amk', 'amq', 'aq',
  'orospu', 'oruspu', 'orosbu', 'orspu',
  'siktir', 'siktiğim', 'siktigim', 'sikeyim', 'sikerim', 'sikecem', 'sikiyim', 'sikim',
  'yarrak', 'yarak', 'yarram', 'yarrağ',
  'pezevenk', 'pezeveng',
  'piç', 'pic',
  'gavat', 'gavad',
  'ibne', 'ipne',
  'kahpe', 'kaltak',
  'kerhane', 'kerane',
  'götveren', 'gotveren',
  'dalyarak', 'dalyarrak',
  'amcık', 'amcik', 'amcuk',
  'taşak', 'tassak', 'tasak',
  // İngilizce (yaygın olanlar)
  'fuck', 'motherfucker',
];

// Küfür köklerinden regex oluştur — kelime sınırı ile
// "am" gibi çok kısa ve false-positive yaratan kökler YOK
// "sik" tek başına yok çünkü "sikinti", "musikî" gibi kelimeleri yakalar
export const PROFANITY_REGEX = new RegExp(
  PROFANITY_ROOTS.map(root => {
    // Türkçe karakterleri ASCII karşılıklarıyla da eşle
    const escaped = root
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/ç/g, '[çc]')
      .replace(/ğ/g, '[ğg]')
      .replace(/ı/g, '[ıi]')
      .replace(/ö/g, '[öo]')
      .replace(/ş/g, '[şs]')
      .replace(/ü/g, '[üu]');
    return escaped;
  }).join('|'),
  'gi'
);

/**
 * Küfür kontrolü — false positive olmadan
 * @param {string} text - Kontrol edilecek metin
 * @returns {boolean} Küfür içeriyor mu
 */
export function containsProfanity(text) {
  if (!text || text.length < 2) return false;
  
  const normalized = text
    .toLowerCase()
    .replace(/[_.,-]/g, '') // Noktalama temizle
    .replace(/(\w)\1{2,}/g, '$1$1'); // "amkkkk" → "amkk" (fazla tekrarı azalt)
  
  return PROFANITY_REGEX.test(normalized);
}

// ── Selamlaşma Modülü ─────────────────────────────────────────
export const GREETINGS = {
  INPUTS: ['sa', 'selam', 'selamün aleyküm', 'merhaba', 'sea', 'selamlar', 's.a', 'selamun aleykum'],
  OUTPUTS: [
    'Aleyküm Selam, hoş geldin! Naber?',
    'Aleyküm Selam, aramıza hoş geldin! Keyifler nasıl?',
    'Ve Aleyküm Selam, hoş geldin! Seni görmek güzel.',
    'Aleyküm Selam, hoş geldin! Umarım günün güzel geçiyordur.'
  ]
};

// ── Uyarı ve Ceza Sistemi ─────────────────────────────────────
export const PUNISHMENT_CONFIG = {
  MAX_WARNINGS: 3,
  WARNING_TIMEOUT_MS: 1 * 60 * 60 * 1000, // 3 uyarı sonrası 1 saat timeout
  HEAVY_TIMEOUT_MIN_MS: 1 * 60 * 60 * 1000,   // 1 saat
  HEAVY_TIMEOUT_MAX_MS: 24 * 60 * 60 * 1000,  // 24 saat
};

// ── Moderasyon Ceza Sebepleri ───────────────────────────────
export const MOD_REASONS = [
// ... (existing content)
  { label: '🤬 Küfür / Hakaret',         value: 'kufur',       emoji: '🤬' },
  { label: '📨 Spam / Flood',            value: 'spam',        emoji: '📨' },
  { label: '🔗 Rakip Site Linki',        value: 'link',        emoji: '🔗' },
  { label: '🔞 NSFW İçerik',             value: 'nsfw',        emoji: '🔞' },
  { label: '🎭 Provokasyon / Trolleme',  value: 'provokasyon', emoji: '🎭' },
  { label: '📢 Reklam',                  value: 'reklam',      emoji: '📢' },
  { label: '⚠️ Tehdit',                  value: 'tehdit',      emoji: '⚠️' },
  { label: '📋 Diğer',                   value: 'diger',       emoji: '📋' },
];
