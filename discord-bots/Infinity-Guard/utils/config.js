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

// ── AniPeak Branding ────────────────────────────────────────
export const ANIPEAK = {
  FOOTER_TEXT: '⚡ Infinity Guard | AniPeak Haber Merkezi',
  FOOTER_ICON: 'https://cdn.discordapp.com/embed/avatars/0.png',
  PANEL_TITLE: '🛡️ INFINITY GUARD — YÖNETİM MERKEZİ',
};

// ── Log Kanalı ──────────────────────────────────────────────
export const LOG_CHANNEL_NAME = 'infinity-log';

// ── Anti-Link Whitelist ─────────────────────────────────────
export const WHITELIST_DOMAINS = [
  'anipeak.com.tr',
  'discord.gg/anipeak',
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'instagram.com',
  'github.com',
];

// ── Yasaklı Link Kalıpları (Regex) ─────────────────────────
export const BLOCKED_PATTERNS = [
  /discord\.gg\/[a-zA-Z0-9]+/gi,
  /discord\.com\/invite\/[a-zA-Z0-9]+/gi,
  /https?:\/\/(?!.*(?:anipeak\.com\.tr|youtube\.com|youtu\.be|twitter\.com|x\.com|instagram\.com|github\.com))[a-zA-Z0-9-]+\.(com|org|net|io|gg|me|xyz|site|online|fun|click|top|info|moe)(?:\/[^\s]*)?/gi,
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

// ── Yasaklı Kelimeler (Siber Filtre) ─────────────────────────
export const BAD_WORDS = [
  'amk', 'aq', 'ananı', 'sikeyim', 'oç', 'piç', 'göt', 'yarrak', 'meme', 
  'sik', 'am', 'meme', 'gavat', 'pezevenk', 'kahbe', 'fahişe', 'daşşak'
  // Buraya daha fazla kelime eklenebilir
];

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
