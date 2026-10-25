// ============================================================
//  SERVER TEMPLATE — MahoraPeak Webtoon/Manga Kurumsal Şablon
//  Platform: MahoraPeak (Manga, Manhwa, Webtoon Okuma Platformu)
//  Yönetim Modeli: Kurumsal Şirket Hiyerarşisi (Kurucu, CEO, BYK, UYK, AYK...)
//  Sistemler: Aethe Haneleri, Citadel, Aura & Rütbeler, Fansub Stüdyosu
// ============================================================

import { PermissionFlagsBits as P } from 'discord.js';

// ── Marka Bilgileri ─────────────────────────────────────────
export const BRAND = {
  NAME:   'MahoraPeak',
  TAGLINE: 'Türkiye\'nin En Kapsamlı Manga & Webtoon Platformu',
  SITE:   'https://mahorapeak.com.tr',
  COLOR:  0x8A2BE2,   // Mahora Moru
  ACCENT: 0xE11D48,   // Aethe Kırmızısı
  GOLD:   0xFFD700,   // CEO & Altın
  CYBER:  0x06B6D4,   // Cyan
  FOOTER: '🏛️ MahoraPeak Global • Infinity Guard',
};

const pick = (...flags) => flags.filter((f) => f !== undefined && f !== null);

// ── @everyone (temel okur) izinleri ─────────────────────────
export const BASE_MEMBER_PERMS = pick(
  P.ViewChannel,
  P.CreateInstantInvite,
  P.ChangeNickname,
  P.SendMessages,
  P.SendMessagesInThreads,
  P.CreatePublicThreads,
  P.EmbedLinks,
  P.AttachFiles,
  P.AddReactions,
  P.UseExternalEmojis,
  P.UseExternalStickers,
  P.ReadMessageHistory,
  P.UseApplicationCommands,
  P.SendVoiceMessages,
  P.SendPolls,
  P.Connect,
  P.Speak,
  P.Stream,
  P.UseVAD,
  P.UseEmbeddedActivities,
  P.UseSoundboard,
  P.UseExternalSounds,
);

// ── Yetkili Yetki Setleri (Kurumsal Derecelendirme) ──────────
const DESTEK_PERMS = pick(P.ManageThreads, P.MoveMembers, P.PrioritySpeaker);

const MOD_PERMS = pick(
  P.KickMembers, P.ModerateMembers, P.ManageMessages, P.ManageThreads,
  P.MuteMembers, P.DeafenMembers, P.MoveMembers, P.ViewAuditLog,
  P.ManageNicknames, P.PrioritySpeaker,
);

const AYK_PERMS = pick(...MOD_PERMS, P.BanMembers, P.MentionEveryone, P.ManageEvents);

const UYK_PERMS = pick(
  ...AYK_PERMS,
  P.ManageChannels, P.ManageRoles, P.ManageWebhooks, P.ManageGuild,
  P.ManageGuildExpressions ?? P.ManageEmojisAndStickers,
  P.CreateGuildExpressions, P.CreateEvents,
);

// ── ROLLER (Kurumsal Hiyerarşi) ─────────────────────────────
export const ROLE_TEMPLATE = [
  // ─── 1. İcra Kurulu & C-Level (Holding Yönetimi) ───
  { key: 'sep_exec', separator: true, name: '━━━ 🏛️ İCRA KURULU (HOLDING) ━━━' },
  { key: 'kurucu', name: '👑 Kurucu & İmtiyaz Sahibi', color: 0xFFD700, hoist: true, permissions: [P.Administrator] },
  { key: 'ceo',    name: '💼 CEO • Genel Müdür', color: 0xFFB300, hoist: true, permissions: [P.Administrator] },
  { key: 'byk',    name: '💎 Yönetim Kurulu Başkanı', color: 0xFF2E63, hoist: true, permissions: [P.Administrator] },
  { key: 'coo',    name: '📊 COO • Operasyon & Yayın Direktörü', color: 0xFF477E, hoist: true, permissions: [P.Administrator] },
  { key: 'cto',    name: '💻 CTO • Teknoloji & Sistem Direktörü', color: 0x00E5FF, hoist: true, permissions: [P.Administrator] },

  // ─── 2. İdari Heyet & Manga Asayiş Denetimi ───
  { key: 'sep_yonetim', separator: true, name: '━━━ 👔 YÖNETİM & ASAYİŞ DİREKTÖRLÜĞÜ ━━━' },
  { key: 'uyk',      name: '🔱 Üst Yönetim Kurulu Üyesi (UYK)', color: 0xFF6B35, hoist: true, permissions: UYK_PERMS },
  { key: 'ayk',      name: '⚜️ Asayiş & Disiplin Kurulu (AYK)', color: 0xF9A826, hoist: true, permissions: AYK_PERMS },
  { key: 'lead_mod', name: '🛡️ Baş Denetmen • Moderasyon Şefi', color: 0x00B4D8, hoist: true, permissions: MOD_PERMS },
  { key: 'mod',      name: '⚔️ Manga Topluluk Moderatörü',      color: 0x0096C7, hoist: true, permissions: MOD_PERMS },
  { key: 'spoiler_mod', name: '👁️ İçerik & Spoiler Denetmeni', color: 0x38BDF8, hoist: false, permissions: MOD_PERMS },
  { key: 'destek',   name: '🎧 Okur İlişkileri & Destek Temsilcisi', color: 0x3DDC97, hoist: true, permissions: DESTEK_PERMS },

  // ─── 3. Çeviri, Yayın ve Prodüksiyon Departmanı ───
  { key: 'sep_ekip', separator: true, name: '━━━ ✍️ PRODÜKSİYON & EDİTÖRYAL ━━━' },
  { key: 'yayindirektoru', name: '🎬 Genel Yayın Yönetmeni', color: 0x9D4EDD, hoist: true,  mentionable: true },
  { key: 'ceviri_lider',  name: '📖 Çeviri Departman Şefi',color: 0xB388FF, hoist: true,  mentionable: true },
  { key: 'ceviri',        name: '🌐 Manga Çevirmeni',       color: 0xC77DFF, hoist: true,  mentionable: true },
  { key: 'cleaner',       name: '🧹 Cleaner (Sayfa Temizleme)', color: 0x82B1FF, hoist: false, mentionable: true },
  { key: 'typesetter',    name: '✍️ Typesetter (Tipografi/Dizgi)', color: 0x60A5FA, hoist: false, mentionable: true },
  { key: 'redaktor',      name: '🔍 Baş Editör / Redaktör', color: 0x38BDF8, hoist: false, mentionable: true },
  { key: 'tasarim',       name: '🎨 Kreatif Tasarım & UI',  color: 0xFF80AB, hoist: false, mentionable: true },
  { key: 'gelistirici',   name: '💻 Sistem Mühendisi / Dev',color: 0x69F0AE, hoist: false, mentionable: true },
  { key: 'haber',         name: '📰 Basın & İçerik Editörü',color: 0xFFD180, hoist: false, mentionable: true },

  // ─── 4. MahoraPeak VIP & Yatırımcı/Abonelik Paketleri ───
  { key: 'sep_elite', separator: true, name: '━━━ ✨ ELITE & MAHORAPASS ━━━' },
  { key: 'vip_aethe',  name: '🩸 AETHE (Kadim Hami)',       color: 0xE11D48, hoist: true, mentionable: true },
  { key: 'vip_ruler',  name: '👑 HÜKÜMDAR (Kraliyet)',     color: 0xF59E0B, hoist: true, mentionable: true },
  { key: 'vip_shadow', name: '🌌 HÜKÜMDAR GÖLGESİ',       color: 0xA855F7, hoist: true, mentionable: true },
  { key: 'vip_pro',    name: '⚡ MAHORAPEAK PRO',         color: 0x06B6D4, hoist: true },
  { key: 'partner',    name: '🤝 Kurumsal Partner & Sponsor', color: 0x1ABC9C, hoist: true },
  { key: 'booster',    name: '💎 Server Booster',          color: 0xFF73FA, hoist: true },

  // ─── 5. Sitedeki 4 Büyük Hane Sistemi (Aethe Haneleri) ───
  { key: 'sep_haneler', separator: true, name: '━━━ 🏰 AETHE HANELERİ ━━━' },
  { key: 'h_kizil_ejder',   name: '🔥 Hane: Kızıl Ejder',   color: 0xF43F5E, mentionable: true },
  { key: 'h_gumus_kitsune', name: '✨ Hane: Gümüş Kitsune', color: 0xC084FC, mentionable: true },
  { key: 'h_buz_kurt',      name: '❄️ Hane: Buz Kurdu',     color: 0x38BDF8, mentionable: true },
  { key: 'h_altin_anka',    name: '⭐ Hane: Altın Anka',    color: 0xFBBF24, mentionable: true },

  // ─── 6. Sitedeki Resmi Gamification Seviye & Rütbeleri ───
  { key: 'sep_seviye', separator: true, name: '━━━ 🏆 OKUR RÜTBELERİ ━━━' },
  { key: 'r_hukumdar', name: '👑 Mahora Hükümdarı (Lv.100)', color: 0xFFD700 },
  { key: 'r_muhafiz',  name: '⚔️ Hükümdar Muhafızı (Lv.75+)', color: 0xF43F5E },
  { key: 'r_sovalye',  name: '🛡️ Üstün Şövalye (Lv.50+)',    color: 0xA855F7 },
  { key: 'r_avci',     name: '🏹 Kıdemli Avcı (Lv.25+)',     color: 0x10B981 },
  { key: 'r_maceraci', name: '🗺️ Maceracı (Lv.10+)',        color: 0x3B82F6 },
  { key: 'r_caylak',   name: '📖 Çaylak Okur (Lv.1-9)',      color: 0x94A3B8 },

  // ─── 7. Bildirim Rolleri (rol-al kanalından seçilir) ───
  { key: 'sep_bildirim', separator: true, name: '━━━ 🔔 BİLDİRİM TERCİHLERİ ━━━' },
  { key: 'n_bolum',    name: '🆕 Yeni Bölüm Bildirim', mentionable: true },
  { key: 'n_duyuru',   name: '📢 Resmi Kurumsal Duyuru', mentionable: true },
  { key: 'n_etkinlik', name: '🎉 Okuma Zirvesi & Etkinlik', mentionable: true },
  { key: 'n_cekilis',  name: '🎁 Hükümdar Çekilişi',   mentionable: true },

  // ─── 8. Genel Üyelik & Botlar ───
  { key: 'sep_uye', separator: true, name: '━━━ 👥 TOPLULUK ━━━' },
  { key: 'bot',     name: '🤖 Mahora Altyapı Botu', color: 0x5865F2, hoist: true },
  { key: 'uye',     name: '✅ Onaylı Okur', color: 0x94A3B8 },
  { key: 'cezali',  name: '🔇 Askıya Alınmış / Cezalı', color: 0x1E293B },
];

// Bildirim butonları
export const NOTIFICATION_ROLES = [
  { key: 'n_bolum',    label: 'Yeni Bölümler',      emoji: '🆕' },
  { key: 'n_duyuru',   label: 'Duyurular',          emoji: '📢' },
  { key: 'n_etkinlik', label: 'Etkinlik & Turnuva', emoji: '🎉' },
  { key: 'n_cekilis',  label: 'Çekilişler',         emoji: '🎁' },
];

// Hane butonları
export const HOUSE_ROLES = [
  { key: 'h_kizil_ejder',   label: 'Kızıl Ejder',   emoji: '🔥', desc: 'Ateşin ve yıkımın kudreti' },
  { key: 'h_gumus_kitsune', label: 'Gümüş Kitsune', emoji: '✨', desc: 'Zeka, kurnazlık ve gizem' },
  { key: 'h_buz_kurt',      label: 'Buz Kurdu',     emoji: '❄️', desc: 'Disiplin ve sarsılmaz sürü' },
  { key: 'h_altin_anka',    label: 'Altın Anka',    emoji: '⭐', desc: 'Yeniden doğuş ve sonsuz umut' },
];

// ── KATEGORİLER VE KANALLAR ─────────────────────────────────
// access seviyeleri:
//   public     -> Herkes görür
//   member     -> Sadece doğrulanmış okurlar (✅ Onaylı Okur)
//   team       -> Belirtilen özel roller + UYK/BYK/CEO/Kurucu
//   staff      -> Destek, Mod, AYK, UYK, BYK, CEO, Kurucu
//   board      -> UYK, BYK, COO, CTO, CEO, Kurucu
//   c_level    -> Sadece BYK, COO, CTO, CEO, Kurucu (En üst icra)
//   logs       -> Sadece yetkililer (AYK ve üstü)
export const CATEGORY_TEMPLATE = [
  {
    key: 'cat_baslangic', name: '╭─ 📌 RESMİ GİRİŞ & PROTOKOL', access: 'public', readOnly: true,
    channels: [
      { key: 'hosgeldin',  name: '👋・hoş-geldin',       topic: `🌸 MahoraPeak Manga & Webtoon dünyasına hoş geldin! | ${BRAND.SITE}` },
      { key: 'kurallar',   name: '📜・kurallar-ve-tüzük', topic: '📜 MahoraPeak topluluk tüzüğü ve yayın kuralları.' },
      { key: 'dogrulama',  name: '✅・kimlik-doğrulama',  topic: '✅ Tüzüğü onaylayarak okur kimliğini al.', verifyOnly: true },
      { key: 'site_rehber',name: '📚・platform-kılavuzu', topic: '📚 Seviye atlama (XP), Aura marketi, Haneler ve abonelik rehberi.' },
    ],
  },
  {
    key: 'cat_bilgi', name: '╭─ 📢 MAHORAPEAK YAYIN', access: 'member', readOnly: true,
    channels: [
      { key: 'duyurular',   name: '📢・kurumsal-duyurular', topic: '📢 MahoraPeak resmi duyuruları ve basın bültenleri.' },
      { key: 'yeni_bolum',  name: '🆕・yeni-bölümler',      topic: '🆕 Siteye yüklenen en son Türkçe manga & webtoon bölümleri!', writers: ['haber', 'ceviri', 'ceviri_lider', 'yayindirektoru'] },
      { key: 'bolum_sohbet',name: '💬・bölüm-tartışma',    topic: '💬 Yeni çıkan bölümleri sıcağı sıcağına değerlendirme alanı.', readOnly: false, slowmode: 3 },
      { key: 'etkinlikler', name: '🎉・etkinlikler',        topic: '🎉 Topluluk okuma geceleri, manga maratonları ve ödüllü yarışmalar.' },
      { key: 'cekilisler',  name: '🎁・çekilişler',         topic: '🎁 MahoraPass, Aura puanları ve VIP paket çekilişleri.' },
      { key: 'rol_al',      name: '🔔・bildirim-tercihi',  topic: '🔔 Yeni bölüm ve duyuru alarmlarını ayarla.' },
      { key: 'hane_sec',    name: '🏰・hane-bağlılığı',     topic: '🏰 Ait olduğun hanenin bayrağını seç (Kızıl Ejder, Buz Kurdu vb.).' },
    ],
  },
  {
    key: 'cat_sohbet', name: '╭─ 💬 TOPLULUK & SOHBET', access: 'member',
    channels: [
      { key: 'genel',       name: '💬・genel-sohbet',      topic: '💬 Manga severlerle seviyeli genel sohbet.', slowmode: 2 },
      { key: 'manga_chat',  name: '📖・manga-manhwa',      topic: '📖 Manga, Webtoon ve Manhua önerileri, seri incelemeleri.' },
      { key: 'teoriler',    name: '🔮・citadel-teorileri',  topic: '🔮 Citadel forum teorileri! Gizemli serilerin sonunu tahmin et.' },
      { key: 'spoiler',     name: '⚠️・ağır-spoiler',       topic: '⚠️ DİKKAT: Raw ve ileri bölümlerin spoiler alanı!' },
      { key: 'panel_paylas',name: '🖼️・çizim-ve-paneller', topic: '🖼️ En etkileyici webtoon sahneleri ve çizimler.', slowmode: 5 },
      { key: 'bot_komut',   name: '🤖・bot-komut',         topic: '🤖 Infinity Guard ve diğer bot komutları.' },
    ],
  },
  {
    key: 'cat_citadel', name: '╭─ 🏰 CITADEL & HANELER', access: 'member',
    channels: [
      { key: 'aura_pazari', name: '✨・aura-pazarı',       topic: '✨ Profil auraları, animasyonlu çerçeveler ve market istişaresi.' },
      { key: 'hane_meydani',name: '⚔️・haneler-arenası',    topic: '⚔️ 4 Büyük Hanenin puan savaşı ve dostane mücadelesi!' },
      { key: 'oneri_istek', name: '💡・seri-talepleri',    topic: '💡 Çevrilmesini istediğiniz manga ve webtoon önerileri.', slowmode: 30 },
      { key: 'hata_bildir', name: '🐛・teknik-destek',     topic: '🐛 Kırık resim, sitede donma veya okuma hatalarını raporlayın.', slowmode: 60 },
    ],
  },
  {
    key: 'cat_elite_vip', name: '╭─ 🩸 AETHE MABETİ (VIP)', access: 'team',
    channels: [
      { key: 'vip_sohbet',  name: '🍷・elite-kulübü',      topic: '🍷 Pro, Shadow, Ruler ve Aethe yatırımcılarına özel seçkin salon.', roles: ['vip_aethe', 'vip_ruler', 'vip_shadow', 'vip_pro'] },
      { key: 'vip_erken',   name: '⏳・erken-önizleme',     topic: '⏳ Çevirisi tamamlanan bölümlere 24-48 saat erken önizleme.', roles: ['vip_aethe', 'vip_ruler', 'vip_shadow'] },
      { key: 'v_vip',       name: '👑 Elite Lounge',       type: 'voice', roles: ['vip_aethe', 'vip_ruler', 'vip_shadow', 'vip_pro'] },
    ],
  },
  {
    key: 'cat_ses', name: '╭─ 🔊 OKUR ODALARI', access: 'member',
    channels: [
      { key: 'v_genel',     name: '🔊 Genel Muhabbet',     type: 'voice' },
      { key: 'v_okuma',     name: '📖 Sessiz Okuma',       type: 'voice', userLimit: 15 },
      { key: 'v_muzik',     name: '🎵 Lofi / Müzik',       type: 'voice' },
      { key: 'v_oyun',      name: '🎮 Oyun Odası',         type: 'voice' },
      { key: 'afk',         name: '💤 AFK Odası',          type: 'voice' },
    ],
  },
  {
    key: 'cat_fansub', name: '╭─ ✍️ PRODÜKSİYON & FANSUB', access: 'team',
    channels: [
      { key: 'f_duyuru',    name: '📌・stüdyo-bülteni',    topic: '📌 Yayın takvimi ve haftalık bölüm hedefleri.', readOnly: true },
      { key: 'f_sohbet',    name: '☕・çevirmen-odası',    topic: '☕ Çeviri, edit ve kontrol ekibinin genel çalışma alanı.', roles: ['yayindirektoru', 'ceviri_lider', 'ceviri', 'cleaner', 'typesetter', 'redaktor'] },
      { key: 'f_teslim',    name: '📤・bölüm-onay-teslim', topic: '📤 Çevrilen ve dizgisi biten bölümlerin teslimat kanalı.', roles: ['yayindirektoru', 'ceviri_lider', 'ceviri', 'cleaner', 'typesetter', 'redaktor'] },
      { key: 'f_ham',       name: '📁・raw-arşivi',         topic: '📁 Yüksek kaliteli ham RAW dosyaları ve fontlar.', roles: ['yayindirektoru', 'ceviri_lider', 'ceviri', 'cleaner', 'typesetter'] },
      { key: 'v_fansub',    name: '🎧 Çeviri & Edit Ses',  type: 'voice', roles: ['yayindirektoru', 'ceviri_lider', 'ceviri', 'cleaner', 'typesetter', 'redaktor'] },
    ],
  },
  {
    key: 'cat_yetkili', name: '╭─ 🛡️ ASAYİŞ & DENETİM', access: 'staff',
    channels: [
      { key: 'y_duyuru',    name: '📋・operasyon-talimatı', topic: '📋 Moderasyon protokolleri ve kural uygulama esasları.', readOnly: true },
      { key: 'y_sohbet',    name: '💬・asayiş-sohbet',      topic: '💬 Yetkili ekibin dahili operasyon sohbeti.' },
      { key: 'y_ceza',      name: '⚖️・ceza-sicil-kayıtları',topic: '⚖️ İtirazlar, şüpheli hareketler ve yaptırım kararları.', access: 'moderation' },
      { key: 'v_yetkili',   name: '🔊 Yetkili Brifing Odası', type: 'voice' },
    ],
  },
  {
    key: 'cat_yonetim', name: '╭─ 🏛️ YÖNETİM KURULU (BOARD)', access: 'board',
    channels: [
      { key: 'yk_sohbet',   name: '📊・genel-yönetim',     topic: '📊 MahoraPeak genel strateji, bütçe ve ekip kararları.' },
      { key: 'yk_site',     name: '💻・altyapı-ve-geliştirme', topic: '💻 Sunucu masrafları, veritabanı optimizasyonları ve yeni özellikler.' },
      { key: 'v_yk',        name: '🏛️ Yönetim Kurulu Salonu', type: 'voice' },
    ],
  },
  {
    key: 'cat_clevel', name: '╭─ 💼 İCRA MAKAM (C-LEVEL)', access: 'c_level',
    channels: [
      { key: 'c_sohbet',    name: '🔒・icra-zirvesi',       topic: '🔒 Sadece Kurucu, CEO, BYK, COO ve CTO özel gizli karar odası.' },
      { key: 'v_clevel',    name: '💼 C-Level Özel Toplantı', type: 'voice' },
    ],
  },
  {
    key: 'cat_log', name: '╭─ 📁 SİBER GÜVENLİK & LOGLAR', access: 'logs',
    channels: [
      { key: 'log',         name: 'infinity-log',          topic: '🛡️ Infinity Guard — otomatik güvenlik duvarı ve ceza tutanakları.' },
      { key: 'ticket_log',  name: '🎫・ticket-log',         topic: '🎫 Destek biletleri ve müşteri kayıtları.' },
      { key: 'haber_log',   name: '📰・sistem-webhook-log', topic: '📰 Otomasyon, RSS ve teknik hareketler.' },
    ],
  },
];

// ── Sunucu Kuralları ────────────────────────────────────────
export const RULES = [
  ['🤝 Karşılıklı Saygı & Nezaket', 'Tüm okur ve ekip üyelerimize saygılı olun. Çevirmenlere, editörlere veya diğer üyelere yönelik küfür, hakaret, aşağılama ve toksik davranışlar kesinlikle yasaktır.'],
  ['⚠️ KATI SPOILER PROTOKOLÜ', 'Yeni çıkan veya sitede henüz yayınlanmamış bölümler hakkında konuşurken MUTLAKA `||spoiler||` sansür etiketi kullanın ya da **#ağır-spoiler** kanalını tercih edin. İhlal edenler uyarılmaksızın susturulur.'],
  ['🚫 Reklam & Korsan Link Yasağı', 'İzinsiz Discord sunucu davetleri, rakip manga/webtoon platformlarının tanıtımı veya izinsiz bağış/korsan link paylaşımı mutlak yasaktır.'],
  ['🔞 NSFW & Uygunsuz İçerik', '+18 cinsel içerikler, aşırı kanlı/rahatsız edici şiddet çizimleri veya NSFW paneller paylaşmak yasaktır.'],
  ['📨 Spam, Flood & Bot İstismarı', 'Ardı ardına mesaj gönderme, anlamsız karakter tekrarları, botları gereksiz tetikleme ve büyük harf (CAPS) kirliliği Infinity Guard tarafından anında engellenir.'],
  ['📖 Prodüksiyon Ekibine Saygı', 'Çevirmen ve editörlerimizin emeklerine değer verin. "Bölüm nerede?", "Geç kaldınız" gibi kaba ve baskıcı tavırlar yerine nezaketle sorunuz.'],
  ['⚖️ Yönetim Hiyerarşisi & Kararlar', 'Yönetim ve moderatörler topluluk nizamını korumakla yetkilidir. Yetkili kararlarına uyunuz; itirazlarınızı destek biletleri üzerinden iletiniz.'],
  ['📜 Discord Hizmet Şartları', 'Discord Topluluk Kuralları ve Hizmet Şartları bu sunucuda harfiyen geçerlidir.'],
];

// ── Sıkça Sorulan Sorular ────────────────────────────────────
export const FAQ = [
  ['🌐 MahoraPeak resmi web adresi nedir?', `Resmi sitemiz **${BRAND.SITE}** adresidir. Sitemizden güvenle, reklamsız seçeneklerle ve yüksek kalitede manga okuyabilirsiniz.`],
  ['🆕 Yeni bölümler ne sıklıkla gelir?', 'Bölümler çevirmen, cleaner ve typesetter ekibimiz tarafından onaylandıkça **#yeni-bölümler** kanalına otomatik düşer. Haberdar olmak için **#bildirim-tercihi** kanalından bildirim rolü alabilirsiniz.'],
  ['✨ Aura Puanı ve Rütbeler nedir?', 'Sitemizde bölüm okudukça, serileri puanladıkça ve günlük okuma serisi (streak) yaptıkça XP ve Aura kazanırsınız. Bu puanlarla Aura Pazarından özel profil çerçeveleri alabilirsiniz.'],
  ['🏰 Aethe Haneleri nedir?', 'Sitemizdeki 4 Büyük Hane (Kızıl Ejder, Gümüş Kitsune, Buz Kurdu, Altın Anka) okurların klan sistemidir. Discord\'da **#hane-bağlılığı** kanalından hanenizi seçebilirsiniz!'],
  ['✍️ Çeviri / Editör ekibine nasıl katılırım?', 'Japonca/Korece/İngilizce çevirmenler veya Photoshop bilen temizlik/dizgi (cleaner/typesetter) yeteneklerini aramızda görmekten mutluluk duyarız! Destek talebi açarak başvurabilirsiniz.'],
  ['👑 Elite & MahoraPass nasıl alınır?', 'Sitemizin Premium sayfasından Pro, Hükümdar Gölgesi, Hükümdar veya Aethe paketlerini inceleyebilir ve benzersiz ayrıcalıklara erişebilirsiniz.'],
];

// ── Kurumsal Hiyerarşi & Görev Dağılım Rehberi ──────────────
export const STAFF_GUIDE = [
  ['👑 Kurucu & İmtiyaz Sahibi', 'Holding ve MahoraPeak platformunun tek imtiyaz sahibi. En üst stratejik ve hukuki karar mercii.'],
  ['💼 CEO • Genel Müdür', 'Tüm şirketin genel yürütücüsü. Departmanlar arası koordinasyon, bütçe ve büyüme stratejilerinin başı.'],
  ['💎 Yönetim Kurulu Başkanı', 'Yönetim kuruluna başkanlık eder; siber güvenlik protokolleri, bot altyapısı ve genel disiplini koordine eder.'],
  ['📊 COO • Operasyon & Yayın Direktörü', 'Manga/Webtoon yayın akışını, fansub ekiplerini, çeviri takvimini ve operasyonel verimliliği yönetir.'],
  ['💻 CTO • Teknoloji & Sistem Direktörü', 'Web sitesi, mobil uygulama mimarisi, veritabanı optimizasyonları ve bot altyapı mühendisliğinin başı.'],
  ['🔱 Üst Yönetim Kurulu Üyesi (UYK)', 'Platform idaresi, kanal/rol düzenlemeleri, personel denetimi ve üst düzey yetkili kararları.'],
  ['⚜️ Asayiş & Disiplin Kurulu (AYK)', 'Topluluk içi huzursuzluklar, ağır kural ihlalleri, kalıcı yasaklama (Ban) ve ceza sicil amirliği.'],
  ['🛡️ Baş Denetmen • Moderasyon Şefi', 'Moderatör ekibinin vardiya, performans ve sahadaki koordinasyonunu sağlayan lider denetmen.'],
  ['⚔️ Manga Topluluk Moderatörü', 'Sohbet düzeni, saygısızlık ve toksik davranışları engelleme, mesaj silme ve susturma (Mute/Timeout).'],
  ['👁️ İçerik & Spoiler Denetmeni', 'Bölüm sohbetlerinde ve genel kanallarda izinsiz raw/spoiler paylaşımını anında sansürleyen uzman denetmen.'],
  ['🎧 Okur İlişkileri & Destek Temsilcisi', 'Bölüm okuma sorunları, kırık resim bildirimleri, VIP paket destekleri ve okur talepleriyle ilgilenir.'],
];
