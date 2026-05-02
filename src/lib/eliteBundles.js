/**
 * AniPeak Elite Bundles — Merkezi Efekt ve Paket Konfigürasyonu
 * Profil çerçeveleri, yorum efektleri, isim etiketleri ve Canvas animasyonları.
 */

// ── ELITE PAKET TANIMLARI ───────────────────────────────────────────────
export const ELITE_BUNDLES = [
  {
    id: 'itadori',
    name: 'Yuji Itadori',
    anime: 'Jujutsu Kaisen',
    icon: '🔥',
    color: '#f97316', // Turuncu
    price: 3000,
    effects: {
      nametag: 'cursed-fire',
      avatar: 'itadori-aura',
      comment: 'itadori-cursed'
    },
    canvasEffect: 'black-flash'
  },
  {
    id: 'jinwoo',
    name: 'Sung Jin Woo',
    anime: 'Solo Leveling',
    icon: '🌑',
    color: '#7c3aed', // Mor
    price: 3000,
    effects: {
      nametag: 'monarch-shadows',
      avatar: 'jinwoo-aura',
      comment: 'jinwoo-shadow'
    },
    canvasEffect: 'shadow-arise'
  },
  {
    id: 'mahoraga',
    name: 'Dahi General Mahoraga',
    anime: 'Jujutsu Kaisen',
    icon: '☸️',
    color: '#f59e0b', // Altın
    price: 3000,
    effects: {
      nametag: 'diviner-general',
      avatar: 'mahoraga-aura',
      comment: 'mahoraga-dharma'
    },
    canvasEffect: 'dharma-wheel'
  }
];

// ── CSS EŞLEŞTİRMELERİ ─────────────────────────────────────────────
const CSS_MAP = {
  avatar: {
    'none': '',
    'itadori-aura': 'avatar-effect-itadori-aura',
    'jinwoo-aura': 'avatar-effect-jinwoo-aura',
    'mahoraga-aura': 'avatar-effect-mahoraga-aura'
  },
  comment: {
    'none': '',
    'itadori-cursed': 'comment-effect-itadori-cursed',
    'jinwoo-shadow': 'comment-effect-jinwoo-shadow',
    'mahoraga-dharma': 'comment-effect-mahoraga-dharma'
  },
  nametag: {
    'none': '',
    'cursed-fire': 'nametag-effect-cursed-fire',
    'monarch-shadows': 'nametag-effect-monarch-shadows',
    'diviner-general': 'nametag-effect-diviner-general'
  }
};

/**
 * Efekt ID'sinden (jsonb) CSS class'ını döndürür.
 */
export function getEffectCSS(effectType, effectId) {
  if (!effectId || effectId === 'none') return '';
  return CSS_MAP[effectType]?.[effectId] || '';
}

/**
 * Kullanıcının belirli bir paketi kullanıp kullanamayacağını kontrol eder
 */
export function canUseBundle(bundleId, userRole = 'Kullanıcı', unlockedEffects = []) {
  const premiumRoles = ['Baş Admin', 'Yönetici', 'Admin', 'Admin Yardımcısı', 'Editör', 'Tester', 'Premium'];
  if (premiumRoles.includes(userRole)) return true;
  return unlockedEffects.includes(bundleId);
}

/**
 * Kullanıcının sahip olduğu efektleri (Avatar, Comment, vb.) filtreleyerek getirir.
 * Bu sayede Mix & Karıştır menüsünde sadece sahip olunan paketlerin parçaları görünür.
 */
export function getUnlockedEffectParts(userRole, unlockedEffects = []) {
  const premiumRoles = ['Baş Admin', 'Yönetici', 'Admin', 'Admin Yardımcısı', 'Editör', 'Tester', 'Premium'];
  const hasPremiumAccess = premiumRoles.includes(userRole);
  
  const availableBundles = hasPremiumAccess 
    ? ELITE_BUNDLES 
    : ELITE_BUNDLES.filter(b => unlockedEffects.includes(b.id));

  return {
    avatar: availableBundles.map(b => ({ id: b.effects.avatar, name: `${b.name} Aurası`, bundle: b.id })),
    comment: availableBundles.map(b => ({ id: b.effects.comment, name: `${b.name} Yorumu`, bundle: b.id })),
    nametag: availableBundles.map(b => ({ id: b.effects.nametag, name: `${b.name} İsmi`, bundle: b.id })),
    aura: availableBundles.map(b => ({ id: b.canvasEffect, name: `${b.name} Canvas`, bundle: b.id }))
  };
}
