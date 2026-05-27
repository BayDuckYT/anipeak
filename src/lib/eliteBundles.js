/**
 * MahoraPeak Elite Bundles — Merkezi Efekt ve Paket Konfigürasyonu
 * Profil çerçeveleri, yorum efektleri, isim etiketleri ve Canvas animasyonları.
 */

// ── ELITE PAKET TANIMLARI ───────────────────────────────────────────────
export const ELITE_BUNDLES = [];

// ── CSS EŞLEŞTİRMELERİ ─────────────────────────────────────────────
const CSS_MAP = {
  avatar: { 'none': '' },
  comment: { 'none': '' },
  nametag: { 'none': '' }
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
