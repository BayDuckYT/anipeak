/**
 * MahoraPeak Aura Market — Nadirlik & Fiyat Sistemi
 * 
 * Nadirlik Seviyeleri:
 * - common (Yaygın)       : 5K - 15K Aura  → Bayraklar, basit çerçeveler
 * - uncommon (Sıradışı)   : 25K - 50K Aura → Orta seviye çerçeveler
 * - rare (Nadir)          : 75K - 150K Aura → İsim efektleri, özel çerçeveler
 * - legendary (Efsanevi)  : 250K - 500K Aura → Anime karakter efektleri
 * - mythic (Gizemli)      : 750K - 1M Aura → En özel profil efektleri
 */

export const RARITY_CONFIG = {
  common: {
    label: 'Yaygın',
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600',
    glow: 'rgba(16,185,129,0.4)',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: '🟢',
  },
  uncommon: {
    label: 'Sıradışı',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    glow: 'rgba(59,130,246,0.4)',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: '🔵',
  },
  rare: {
    label: 'Nadir',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    glow: 'rgba(168,85,247,0.4)',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    icon: '🟣',
  },
  legendary: {
    label: 'Efsanevi',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.5)',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: '🟡',
  },
  mythic: {
    label: 'Gizemli',
    color: 'rose',
    gradient: 'from-rose-500 to-red-600',
    glow: 'rgba(244,63,94,0.5)',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: '🔴',
  },
};

// ── Özel fiyat atamaları (ID bazlı override) ──────────────────────
const PRICE_OVERRIDES = {
  // Gizemli (Mythic) — En özel profil efektleri
  'custom_supernova': 1000000,
  'custom_timekeeper': 1000000,
  'custom_rüya_diyarı_portalı': 900000,
  'custom_bozulmuş_gerçeklik': 900000,
  'custom_full_cowling': 850000,
  'custom_yıldız_dalgası': 800000,
  'custom_su_patlaması': 750000,

  // Efsanevi (Legendary) — Anime karakter efektleri
  'custom_gojo': 500000,
  'custom_bakugo': 500000,
  'custom_spiderman': 400000,
  'custom_venom': 400000,
  'custom_samuray_dansı': 350000,
  'custom_kızıl_yumruk': 350000,
  'custom_m._bison': 300000,
  'custom_sonsuz_sakura_ağacı': 450000,
  'custom_pengui': 300000,
  'custom_lofi': 250000,
  'custom_little_twin_stars': 300000,
  'custom_cinnamoroll': 300000,
  'custom_kuromi_ve_my_melody': 350000,
  'custom_oni_laneti': 250000,
  'custom_terazi': 250000,
  'custom_balıkçı_köyü': 250000,
  'custom_oyun_alanı_dostları': 250000,
  'custom_koyun_sayma': 250000,
  'custom_tembel_köpekmek': 250000,
};

// ── Nadirlik atamaları (ID bazlı override) ────────────────────────
const RARITY_OVERRIDES = {
  'custom_supernova': 'mythic',
  'custom_timekeeper': 'mythic',
  'custom_rüya_diyarı_portalı': 'mythic',
  'custom_bozulmuş_gerçeklik': 'mythic',
  'custom_full_cowling': 'mythic',
  'custom_yıldız_dalgası': 'mythic',
  'custom_su_patlaması': 'mythic',
  'custom_gojo': 'legendary',
  'custom_bakugo': 'legendary',
  'custom_spiderman': 'legendary',
  'custom_venom': 'legendary',
  'custom_samuray_dansı': 'legendary',
  'custom_kızıl_yumruk': 'legendary',
  'custom_m._bison': 'legendary',
  'custom_sonsuz_sakura_ağacı': 'legendary',
};

/**
 * Bir efektin nadirlik seviyesini kategori/ID bazında belirler
 */
function getRarity(effect) {
  if (RARITY_OVERRIDES[effect.id]) return RARITY_OVERRIDES[effect.id];

  const idString = String(effect.id);
  const hash = idString.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // Bayraklar çoğunlukla yaygın/sıradışı kalsın
  if (effect.category === 'flags') {
    const flagRarities = ['common', 'common', 'common', 'uncommon'];
    return flagRarities[hash % flagRarities.length];
  }

  // Diğer tüm kategoriler için çeşitli nadirlik dağılımı (Yaygından Gizemliye)
  const rarities = [
    'common', 'common', 'common', 
    'uncommon', 'uncommon', 'uncommon',
    'rare', 'rare', 'rare',
    'legendary', 'legendary',
    'mythic'
  ];
  return rarities[hash % rarities.length];
}

/**
 * Bir efektin Aura fiyatını belirler
 */
function getPrice(effect, rarity) {
  if (PRICE_OVERRIDES[effect.id]) return PRICE_OVERRIDES[effect.id];

  // Hash-based deterministic pricing within rarity range
  const hash = effect.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  switch (rarity) {
    case 'mythic': {
      const prices = [750000, 800000, 850000, 900000, 1000000];
      return prices[hash % prices.length];
    }
    case 'legendary': {
      const prices = [250000, 300000, 350000, 400000, 500000];
      return prices[hash % prices.length];
    }
    case 'rare': {
      const prices = [75000, 100000, 125000, 150000];
      return prices[hash % prices.length];
    }
    case 'uncommon': {
      const prices = [25000, 30000, 35000, 40000, 50000];
      return prices[hash % prices.length];
    }
    case 'common':
    default: {
      const prices = [5000, 7500, 10000, 12500, 15000];
      return prices[hash % prices.length];
    }
  }
}

/**
 * effects.json + nameplates verisini alıp market verisi üretir.
 * Her item: { ...effect, rarity, price, rarityConfig }
 */
export function buildMarketItems(effectsData, nameplatesData = []) {
  const items = [];

  // effects.json'dan gelen efektler
  for (const effect of effectsData) {
    const rarity = getRarity(effect);
    const price = getPrice(effect, rarity);
    items.push({
      ...effect,
      rarity,
      price,
      rarityConfig: RARITY_CONFIG[rarity],
    });
  }

  // Nameplate'ler (isim plakaları)
  for (let i = 0; i < nameplatesData.length; i++) {
    const filename = nameplatesData[i];
    const id = `nameplate_${filename}`;
    
    // Hash tabanlı nadirlik ataması (genel sisteme benzer)
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rarities = [
      'common', 'common', 
      'uncommon', 'uncommon', 
      'rare', 'rare', 
      'legendary', 'legendary',
      'mythic'
    ];
    const rarity = rarities[hash % rarities.length];
    
    // getPrice kullanarak fiyat belirle (deterministic hash fiyatı)
    const price = getPrice({ id }, rarity);

    items.push({
      id,
      url: `/nameplates/${filename}`,
      label: `İsim Plakası ${i + 1}`,
      category: 'nameplates',
      emoji: '',
      rarity,
      price,
      rarityConfig: RARITY_CONFIG[rarity],
    });
  }

  return items;
}

/**
 * Market kategorileri (UI tabları için)
 */
export const MARKET_CATEGORIES = [
  { id: 'all', label: 'Tümü', icon: '✨' },
  { id: 'profile_effects', label: 'Profil Efektleri', icon: '🌟' },
  { id: 'decorations', label: 'Avatar Çerçeveleri', icon: '🖼️' },
  { id: 'name_effects', label: 'İsim Efektleri', icon: '💫' },
  { id: 'nameplates', label: 'İsim Plakaları', icon: '🏷️' },
  { id: 'flags', label: 'Bayraklar', icon: '🚩' },
];

/**
 * Nadirlik filtreleri
 */
export const RARITY_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'common', label: 'Yaygın', ...RARITY_CONFIG.common },
  { id: 'uncommon', label: 'Sıradışı', ...RARITY_CONFIG.uncommon },
  { id: 'rare', label: 'Nadir', ...RARITY_CONFIG.rare },
  { id: 'legendary', label: 'Efsanevi', ...RARITY_CONFIG.legendary },
  { id: 'mythic', label: 'Gizemli', ...RARITY_CONFIG.mythic },
];

/**
 * Kullanıcının bir efekti kullanıp kullanamayacağını kontrol eder
 */
export function canUseEffect(effectId, user) {
  if (!user) return false;
  
  // Admin/Elite/Editör/Tester rolleri her şeyi kullanabilir
  const premiumRoles = ['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester'];
  if (premiumRoles.includes(user.role)) return true;
  if (user.is_elite) return true;

  // Satın alınmış mı kontrol et
  const unlocked = user.unlocked_effects || [];
  return unlocked.includes(effectId);
}
