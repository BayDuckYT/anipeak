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

// ── Yasaklı Kelimeler (Siber Filtre) ─────────────────────────
export const BAD_WORDS = {
  LIGHT: [
    'abaza', 'abazan', 'ag', 'agzina sicayim', 'ahmak', 'allahsiz', 'am', 'amarim', 'ambiti', 'am biti',
    'amcigi', 'amcigin', 'amcigini', 'amciginizi', 'amcik', 'amcik hosafi', 'amciklama', 'amciklandi',
    'amcik', 'amck', 'amckl', 'amcklama', 'amcklaryla', 'amckta', 'amcktan', 'amcuk', 'amik', 'amina',
    'aminako', 'amina koy', 'amina koyarim', 'amina koyayim', 'aminakoyim', 'amina koyyim', 'amina s',
    'amina sikem', 'amina sokam', 'amin feryadi', 'amini', 'amini s', 'amin oglu', 'aminoglu', 'amin oglu',
    'amisina', 'amisini', 'amina', 'amina g', 'amina k', 'aminako', 'aminakoyarim', 'amina koyarim',
    'amina koyayim', 'aminakoyim', 'aminda', 'amindan', 'amindayken', 'amini', 'aminiyarraaniskiim',
    'aminoglu', 'amin oglu', 'amiyum', 'amk', 'amkafa', 'amk cocugu', 'amlarnzn', 'amli', 'amm', 'ammak',
    'ammna', 'amn', 'amna', 'amnda', 'amndaki', 'amngtn', 'amnn', 'amona', 'amq', 'amsiz', 'amsiz',
    'amsz', 'amteri', 'amugaa', 'amuga', 'amuna', 'ana', 'anaaann', 'anal', 'analarn', 'anam', 'anamla',
    'anan', 'anana', 'anandan', 'anani', 'anani ', 'ananin', 'ananin am', 'ananin ami', 'ananin dolu',
    'ananinki', 'ananisikerim', 'anani sikerim', 'ananisikeyim', 'anani sikeyim', 'aninizin', 'ananizin am',
    'anani', 'ananin', 'ananisikerim', 'anani sikerim', 'ananisikeyim', 'anani sikeyim', 'anann', 'ananz',
    'anas', 'anasini', 'anasinin am', 'anasi orospu', 'anasi', 'anasinin', 'anay', 'anayin', 'angut',
    'anneni', 'annenin', 'annesiz', 'anuna', 'aptal', 'aq', 'a.q', 'a.q.', 'aq.', 'ass', 'atkafası',
    'atmik', 'attirdigim', 'attrrm', 'auzlu', 'avrat', 'ayklarmalrmsikerim', 'azdim', 'azdir', 'azdirici',
    'babaannesi kasar', 'babani', 'babanin', 'babani', 'babasi pezevenk', 'bacina sicayim', 'bacina',
    'bacini', 'bacinin', 'bacini', 'bacn', 'bacndan', 'bacy', 'bastard', 'basur', 'beyinsiz', 'bizir',
    'bitch', 'biting', 'bok', 'boka', 'bokbok', 'bokca', 'bokhu', 'bokkkumu', 'boklar', 'boktan', 'boku',
    'bokubokuna', 'bokum', 'bombok', 'boner', 'bosalmak', 'bosalmak', 'cenabet', 'cibiliyetsiz',
    'cibilliyetini', 'cibilliyetsiz', 'cif', 'cikar', 'cim', 'cuk', 'dalaksiz', 'dallama', 'daltassak',
    'dalyarak', 'dalyarrak', 'dangalak', 'dassagi', 'diktim', 'dildo', 'dingil', 'dingilini', 'dinsiz',
    'dkerim', 'domal', 'domalan', 'domaldi', 'domaldin', 'domalik', 'domaliyor', 'domalmak', 'domalmis',
    'domalsin', 'domalt', 'domaltarak', 'domaltip', 'domaltir', 'domaltirim', 'domaltip', 'domaltmak',
    'dolu', 'donek', 'duduk', 'eben', 'ebeni', 'ebenin', 'ebeninki', 'ebleh', 'ecdadini', 'ecdadini',
    'embesil', 'emi', 'fahise', 'fahise', 'feristah', 'ferre', 'fuck', 'fucker', 'fuckin', 'fucking',
    'gavad', 'gavat', 'geber', 'geberik', 'gebermek', 'gebermis', 'gebertir', 'gerizekali', 'gerizekali',
    'gerizekali', 'gerzek', 'giberim', 'giberler', 'gibis', 'gibis', 'gibmek', 'gibtiler', 'goddamn',
    'godos', 'godumun', 'gotelek', 'gotlalesi', 'gotlu', 'gotten', 'gotundeki', 'gotunden', 'gotune',
    'gotunu', 'gotveren', 'goyiim', 'goyum', 'goyuyim', 'goyyim', 'got', 'got deligi', 'gotelek',
    'got herif', 'gotlalesi', 'gotlek', 'gotoglani', 'got oglani', 'gotos', 'gotten', 'gotu', 'gotun',
    'gotune', 'gotunekoyim', 'gotune koyim', 'gotunu', 'gotveren', 'got veren', 'got verir', 'gtelek',
    'gtn', 'gtnde', 'gtnden', 'gtne', 'gtten', 'gtveren', 'hasiktir', 'hassikome', 'hassiktir',
    'has siktir', 'hassittir', 'haysiyetsiz', 'hayvan herif', 'hosafi', 'hoduk', 'hsktr', 'huur',
    'ibnelik', 'ibina', 'ibine', 'ibinenin', 'ibne', 'ibnedir', 'ibneleri', 'ibnelik', 'ibnelri',
    'ibneni', 'ibnenin', 'ibnerator', 'ibnesi', 'idiot', 'idiyot', 'imansz', 'ipne', 'iserim', 'iserim',
    'itoglu it', 'kafam girsin', 'kafasiz', 'kafasiz', 'kahpe', 'kahpenin', 'kahpenin feryadi', 'kaka',
    'kaltak', 'kancik', 'kancik', 'kappe', 'karhane', 'kasar', 'kavat', 'kavatn', 'kaypak', 'kayyum',
    'kerane', 'kerhane', 'kerhanelerde', 'kevase', 'kevase', 'kevvase', 'koca got', 'kodugmun',
    'kodugmunun', 'kodumun', 'kodumunun', 'koduumun', 'koyarm', 'koyayim', 'koyiim', 'koyiiym',
    'koyim', 'koyum', 'koyyim', 'krar', 'kukudaym', 'laciye boyadim', 'lavuk', 'libos', 'madafaka',
    'mal', 'malafat', 'malak', 'manyak', 'mcik', 'meme', 'memelerini', 'mezveleli', 'minaamcik',
    'mincikliyim', 'mna', 'monakkoluyum', 'motherfucker', 'mudik', 'oc', 'ocuu', 'ocuun', 'OC', 'oc',
    'o. cocugu', 'oglan', 'oglanci', 'oglu it', 'orosbucocuu', 'orospu', 'orospucocugu', 'orospu cocugu',
    'orospu coc', 'orospucocugu', 'orospu cocugu', 'orospu cocugudur', 'orospu cocuklari', 'orospudur',
    'orospular', 'orospunun', 'orospunun evladi', 'orospuydu', 'orospuyuz', 'orostoban', 'orostopol',
    'orrospu', 'oruspu', 'oruspucocugu', 'oruspu cocugu', 'osbir', 'ossurduum', 'ossurmak', 'ossuruk',
    'osur', 'osurduu', 'osuruk', 'osururum', 'otuzbir', 'okuz', 'osex', 'patlak zar', 'penis', 'pezevek',
    'pezeven', 'pezeveng', 'pezevengi', 'pezevengin evladi', 'pezevenk', 'pezo', 'pic', 'pici', 'picler',
    'pic', 'picin oglu', 'pic kurusu', 'picler', 'pipi', 'pipis', 'pisliktir', 'porno', 'pussy', 'pust',
    'pusttur', 'rahminde', 'revizyonist', 's1kerim', 's1kerm', 's1krm', 'sakso', 'saksofon', 'salaak',
    'salak', 'saxo', 'sekis', 'serefsiz', 'sevgi koyarim', 'seviselim', 'sexs', 'sicarim', 'sictigim',
    'siecem', 'sicarsin', 'sie', 'sik', 'sikdi', 'sikdigim', 'sike', 'sikecem', 'sikem', 'siken',
    'sikenin', 'siker', 'sikerim', 'sikerler', 'sikersin', 'sikertir', 'sikertmek', 'sikesen',
    'sikesicenin', 'sikey', 'sikeydim', 'sikeyim', 'sikeym', 'siki', 'sikicem', 'sikici', 'sikien',
    'sikienler', 'sikiiim', 'sikiiimmm', 'sikiim', 'sikiir', 'sikiirken', 'sikik', 'sikil',
    'sikildiini', 'sikilesice', 'sikilmi', 'sikilmie', 'sikilmis', 'sikilmis', 'sikilsin', 'sikim',
    'sikimde', 'sikimden', 'sikime', 'sikimi', 'sikimiin', 'sikimin', 'sikimle', 'sikimsonik',
    'sikimtrak', 'sikin', 'sikinde', 'sikinden', 'sikine', 'sikini', 'sikip', 'sikis', 'sikisek',
    'sikisen', 'sikish', 'sikismis', 'sikis', 'sikisen', 'sikisme', 'sikitiin', 'sikiyim', 'sikiym',
    'sikiyorum', 'sikkim', 'sikko', 'sikleri', 'sikleriii', 'sikli', 'sikm', 'sikmek', 'sikmem',
    'sikmiler', 'sikmisligim', 'siksem', 'sikseydin', 'sikseyidin', 'siksin', 'siksinbaya', 'siksinler',
    'siksiz', 'siksok', 'siksz', 'sikt', 'sikti', 'siktigimin', 'siktigiminin', 'siktiğim',
    'siktigimin', 'siktigiminin', 'siktii', 'siktiim', 'siktiimin', 'siktiiminin', 'siktiler',
    'siktim', 'siktim ', 'siktimin', 'siktiminin', 'siktir', 'siktir et', 'siktirgit', 'siktir git',
    'siktirir', 'siktiririm', 'siktiriyor', 'siktir lan', 'siktirolgit', 'siktir ol git', 'sittimin',
    'sittir', 'skcem', 'skecem', 'skem', 'sker', 'skerim', 'skerm', 'skeyim', 'skiim', 'skik', 'skim',
    'skime', 'skmek', 'sksin', 'sksn', 'sksz', 'sktiimin', 'sktrr', 'skyim', 'slaleni', 'sokam',
    'sokarim', 'sokarim', 'sokarm', 'sokarmkoduumun', 'sokayim', 'sokaym', 'sokiim', 'soktugumunun',
    'sokuk', 'sokum', 'sokus', 'sokuyum', 'soxum', 'sulaleni', 'sulaleni', 'sulalenizi', 'surtuk',
    'serefsiz', 'sillik', 'taaklarn', 'taaklarna', 'tarrakimin', 'tasak', 'tassak', 'tasak', 'tassak',
    'tipini s.k', 'tipinizi s.keyim', 'tiyniyat', 'toplarm', 'topsun', 'totos', 'vajina', 'vajinani',
    'veled', 'veledizina', 'veled i zina', 'verdiimin', 'weled', 'weledizina', 'whore', 'xikeyim',
    'yaaraaa', 'yalama', 'yalarim', 'yalarun', 'yaraaam', 'yarak', 'yaraksiz', 'yaraktr', 'yaram',
    'yaraminbasi', 'yaramn', 'yararmorospunun', 'yarra', 'yarraaaa', 'yarraak', 'yarraam', 'yarraami',
    'yarragi', 'yarragimi', 'yarragina', 'yarragindan', 'yarragm', 'yarrag', 'yarragim', 'yarragimi',
    'yarraiminin', 'yarrak', 'yarram', 'yarramin', 'yarraminbasi', 'yarramn', 'yarran', 'yarrana',
    'yarrrak', 'yavak', 'yavs', 'yavsak', 'yavsaktir', 'yavusak', 'yilisik', 'yilisik', 'yogurtlayam',
    'yogurtlayam', 'yrrak', 'zikkimim', 'zibidi', 'zigsin', 'zikeyim', 'zikiiim', 'zikiim', 'zikik',
    'zikim', 'ziksiiin', 'ziksiin', 'zulliyetini', 'zviyetini'
  ],
  HEAVY: [
    'ataturk', 'din', 'allah', 'peygamber', 'kitap', 'kuran', 'irk', 'irki',
    'atama', 'atam', 'cumhurbaşkanı', 'rte', 'siyaset', 'dinime', 'kuranıma'
  ]
};

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
