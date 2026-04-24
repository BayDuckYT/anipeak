/**
 * AniPeak Profil Efekt Paketi — Merkezi Efekt Konfigürasyonu
 * Avatar çerçeveleri, yorum efektleri ve isim etiketi dekorasyonları.
 * Rarity: common | rare | epic | legendary
 */

// ── AVATAR FRAME EFEKTLERİ ─────────────────────────────────────────────
export const AVATAR_EFFECTS = [
  {
    id: 'none',
    name: 'Varsayılan',
    description: 'Standart profil çerçevesi',
    css: '',
    rarity: 'common',
    minXP: 0,
    price: 0,
    icon: '⚪'
  },
  {
    id: 'purple-glow',
    name: 'Mor Parıltı',
    description: 'Neon mor ışık saçan çerçeve',
    css: 'avatar-effect-purple-glow',
    rarity: 'common',
    minXP: 100,
    price: 0,
    icon: '🟣'
  },
  {
    id: 'rainbow-ring',
    name: 'Gökkuşağı Halkası',
    description: 'Dönen gökkuşağı renk geçişli çerçeve',
    css: 'avatar-effect-rainbow-ring',
    rarity: 'rare',
    minXP: 500,
    price: 0,
    icon: '🌈'
  },
  {
    id: 'sailor-special',
    name: 'Denizci Özel',
    description: 'Mavi-beyaz çakar lambalı denizci çerçevesi',
    css: 'avatar-effect-sailor',
    rarity: 'rare',
    minXP: 0,
    price: 250,
    icon: '⚓'
  },
  {
    id: 'fire-ring',
    name: 'Ateş Çemberi',
    description: 'Alevli ateş animasyonlu çerçeve',
    css: 'avatar-effect-fire-ring',
    rarity: 'epic',
    minXP: 1000,
    price: 0,
    icon: '🔥'
  },
  {
    id: 'lightning',
    name: 'Şimşek',
    description: 'Elektrik çarpması efektli çerçeve',
    css: 'avatar-effect-lightning',
    rarity: 'epic',
    minXP: 0,
    price: 500,
    icon: '⚡'
  },
  {
    id: 'diamond',
    name: 'Elmas',
    description: 'Elmas parıltılı premium çerçeve',
    css: 'avatar-effect-diamond',
    rarity: 'legendary',
    minXP: 0,
    price: 1000,
    adminOnly: true,
    icon: '💎'
  },
  {
    id: 'cyber-aura',
    name: 'Siber Aura',
    description: 'Dışa taşan neon pembe/mavi enerji alanı',
    css: 'avatar-effect-cyber-aura',
    rarity: 'legendary',
    minXP: 0,
    price: 1500,
    adminOnly: true,
    icon: '🌀'
  },
  {
    id: 'god-aura',
    name: 'İlahi Aura',
    description: 'Devasa altın/turuncu siber parlama',
    css: 'avatar-effect-god-aura',
    rarity: 'legendary',
    minXP: 0,
    price: 2000,
    adminOnly: true,
    icon: '☀️'
  },
  // ── ELITE ANIME PAKETLER ──
  {
    id: 'gojo-aura',
    name: 'Altı Göz Aurası',
    description: 'Mavi-mor Altı Göz: avatar arkasında yüzen mavı ışıklar',
    css: 'avatar-effect-gojo-aura',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🔵',
    elite: 'gojo'
  },
  {
    id: 'sukuna-aura',
    name: 'Kan Kırmızısı Aura',
    description: 'Taşan güçlü, nefes alan kırmızı alev aurası',
    css: 'avatar-effect-sukuna-aura',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🔴',
    elite: 'sukuna'
  },
  {
    id: 'itadori-aura',
    name: 'Lanetli Enerji',
    description: 'Mavi lanetli enerji, parlayan şimşek ışıkları',
    css: 'avatar-effect-itadori-aura',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '⚡',
    elite: 'itadori'
  },
  {
    id: 'jinwoo-aura',
    name: 'Gölge Aurası',
    description: 'Parçacıklarla nefes alan derin gölge aurası',
    css: 'avatar-effect-jinwoo-aura',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🌑',
    elite: 'jinwoo'
  },
  {
    id: 'mahoraga-aura',
    name: 'Altın Dharma Çarkı',
    description: 'Ağır ağır dönen devasa altın parıltı',
    css: 'avatar-effect-mahoraga-aura',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '☸️',
    elite: 'mahoraga'
  }
];

// ── YORUM EFEKTLERİ ────────────────────────────────────────────────────
export const COMMENT_EFFECTS = [
  {
    id: 'none',
    name: 'Varsayılan',
    description: 'Standart yorum stili',
    css: '',
    rarity: 'common',
    minXP: 0,
    price: 0,
    icon: '⚪'
  },
  {
    id: 'gradient-border',
    name: 'Gradient Çerçeve',
    description: 'Animasyonlu renk geçişli sınır',
    css: 'comment-effect-gradient-border',
    rarity: 'common',
    minXP: 100,
    price: 0,
    icon: '🎨'
  },
  {
    id: 'glass-premium',
    name: 'Premium Cam',
    description: 'Parlak cam efektli yorum kutusu',
    css: 'comment-effect-glass-premium',
    rarity: 'rare',
    minXP: 500,
    price: 0,
    icon: '🪟'
  },
  {
    id: 'neon-glow',
    name: 'Neon Parıltı',
    description: 'Neon ışıklı yorum kutusu',
    css: 'comment-effect-neon-glow',
    rarity: 'epic',
    minXP: 1000,
    price: 0,
    icon: '💡'
  },
  {
    id: 'holographic',
    name: 'Holografik',
    description: 'Gökkuşağı yansımalı hologram efekti',
    css: 'comment-effect-holographic',
    rarity: 'epic',
    minXP: 0,
    price: 500,
    icon: '🌟'
  },
  {
    id: 'royal',
    name: 'Kraliyet',
    description: 'Altın çerçeveli kraliyet yorumu',
    css: 'comment-effect-royal',
    rarity: 'legendary',
    minXP: 0,
    price: 1000,
    adminOnly: true,
    icon: '👑'
  },
  {
    id: 'cyberpunk-theme',
    name: 'Cyberpunk',
    description: 'Kayan dijital grid çizgileri',
    css: 'comment-effect-cyberpunk',
    rarity: 'epic',
    minXP: 0,
    price: 750,
    icon: '🌆'
  },
  {
    id: 'ocean-theme',
    name: 'Okyanus Dalgaları',
    description: 'Hareketli derin deniz dalgalanması',
    css: 'comment-effect-ocean',
    rarity: 'epic',
    minXP: 0,
    price: 750,
    icon: '🌊'
  },
  {
    id: 'magma-theme',
    name: 'Lav Akıntısı',
    description: 'Alttan üste akan magma efekti',
    css: 'comment-effect-magma',
    rarity: 'legendary',
    minXP: 0,
    price: 1000,
    adminOnly: true,
    icon: '🌋'
  },
  // ── ELITE ANIME YORUM TEMALARI ──
  {
    id: 'gojo-void',
    name: 'Sonsuz Boşluk',
    description: 'Saydam mavi void kutusu, yüzen ışık parçacıkları',
    css: 'comment-effect-gojo-void',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🔵',
    elite: 'gojo'
  },
  {
    id: 'sukuna-blood',
    name: 'Kötücül Tapınak',
    description: 'Koyu kırmızı tema, rünlü kenarlar',
    css: 'comment-effect-sukuna-blood',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🔴',
    elite: 'sukuna'
  },
  {
    id: 'itadori-cursed',
    name: 'Lanetli Ateş',
    description: 'Turuncu parlayan kutu, lanetli enerji',
    css: 'comment-effect-itadori-cursed',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🔥',
    elite: 'itadori'
  },
  {
    id: 'jinwoo-shadow',
    name: 'Gölge Ordusu',
    description: 'Gölge ordu teması, mor dikey rünler',
    css: 'comment-effect-jinwoo-shadow',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🌑',
    elite: 'jinwoo'
  },
  {
    id: 'mahoraga-dharma',
    name: 'Dharma Çarkı',
    description: 'Altın dharma teması, parıltılar',
    css: 'comment-effect-mahoraga-dharma',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '☸️',
    elite: 'mahoraga'
  }
];

// ── İSİM ETİKETİ EFEKTLERİ ─────────────────────────────────────────────
export const NAMETAG_EFFECTS = [
  {
    id: 'none',
    name: 'Varsayılan',
    description: 'Düz beyaz isim',
    css: '',
    rarity: 'common',
    minXP: 0,
    price: 0,
    icon: '⚪'
  },
  {
    id: 'gradient-text',
    name: 'Gradient İsim',
    description: 'Mor-mavi renk geçişli isim',
    css: 'nametag-effect-gradient-text',
    rarity: 'common',
    minXP: 100,
    price: 0,
    icon: '🎨'
  },
  {
    id: 'glowing',
    name: 'Parıldayan',
    description: 'Işıldayan neon isim efekti',
    css: 'nametag-effect-glowing',
    rarity: 'rare',
    minXP: 500,
    price: 0,
    icon: '✨'
  },
  {
    id: 'sailor-tag',
    name: 'Denizci Etiketi',
    description: 'Mavi-beyaz denizci tarzı isim',
    css: 'nametag-effect-sailor',
    rarity: 'rare',
    minXP: 0,
    price: 250,
    icon: '⚓'
  },
  {
    id: 'rainbow',
    name: 'Gökkuşağı',
    description: 'Animasyonlu gökkuşağı renk geçişi',
    css: 'nametag-effect-rainbow',
    rarity: 'epic',
    minXP: 1000,
    price: 0,
    icon: '🌈'
  },
  {
    id: 'fire-text',
    name: 'Ateşli İsim',
    description: 'Ateş renkli metin efekti',
    css: 'nametag-effect-fire-text',
    rarity: 'epic',
    minXP: 0,
    price: 500,
    icon: '🔥'
  },
  {
    id: 'golden',
    name: 'Altın',
    description: 'Altın parıltılı ve ışıltı animasyonlu isim',
    css: 'nametag-effect-golden',
    rarity: 'legendary',
    minXP: 0,
    price: 1000,
    adminOnly: true,
    icon: '👑'
  },
  {
    id: 'cyber-glitch',
    name: 'Siber Glitch',
    description: 'Hafif titreyen neon yansımalar',
    css: 'nametag-effect-cyber-glitch',
    rarity: 'epic',
    minXP: 0,
    price: 750,
    icon: '👾'
  },
  {
    id: 'diamond-shimmer',
    name: 'Elmas Parıltısı',
    description: 'İçten geçen buz mavisi/beyaz parıltı',
    css: 'nametag-effect-diamond-shimmer',
    rarity: 'epic',
    minXP: 0,
    price: 800,
    icon: '💎'
  },
  {
    id: 'toxic-neon',
    name: 'Toksik Neon',
    description: 'Dışa doğru parlayan güçlü neon yeşili',
    css: 'nametag-effect-toxic-neon',
    rarity: 'legendary',
    minXP: 0,
    price: 1200,
    adminOnly: true,
    icon: '☣️'
  },
  // ── ELITE ANIME İSİM ETİKETLERİ ──
  {
    id: 'unlimited-void',
    name: 'Unlimited Void',
    description: 'Mavi-mor parıltı dalgası, yazı içinden geçen kozmik akış',
    css: 'nametag-effect-unlimited-void',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🔵',
    elite: 'gojo'
  },
  {
    id: 'malevolent-shrine',
    name: 'Malevolent Shrine',
    description: 'Kırmızı-siyah glitch ve kan efekti',
    css: 'nametag-effect-malevolent-shrine',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🔴',
    elite: 'sukuna'
  },
  {
    id: 'cursed-fire',
    name: 'Cursed Fire',
    description: 'Alev efektli, içinden yumruk ikonları geçer',
    css: 'nametag-effect-cursed-fire',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🔥',
    elite: 'itadori'
  },
  {
    id: 'monarch-shadows',
    name: 'Monarch of Shadows',
    description: 'Koyu mor parıltı, içinden rünler akar',
    css: 'nametag-effect-monarch-shadows',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '🌑',
    elite: 'jinwoo'
  },
  {
    id: 'diviner-general',
    name: 'Diviner General',
    description: 'Yazı içinden altın parıltılı çark dalgası geçer',
    css: 'nametag-effect-diviner-general',
    rarity: 'legendary',
    minXP: 0,
    price: 3000,
    adminOnly: true,
    icon: '☸️',
    elite: 'mahoraga'
  }
];

// ── RARITY (NADİRLİK) TANIMLARI ────────────────────────────────────────
export const RARITY_CONFIG = {
  common:    { label: 'Yaygın',    color: 'text-slate-400',  border: 'border-slate-500/30', bg: 'bg-slate-500/10' },
  rare:      { label: 'Nadir',     color: 'text-blue-400',   border: 'border-blue-500/30',  bg: 'bg-blue-500/10' },
  epic:      { label: 'Efsanevi',  color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  legendary: { label: 'Efsane',    color: 'text-amber-400',  border: 'border-amber-500/30', bg: 'bg-amber-500/10' }
};

// ── YARDIMCI FONKSİYONLAR ───────────────────────────────────────────────

/**
 * Kullanıcının açtığı efektleri döndürür.
 * Admin kullanıcılar TÜM efektlere erişebilir.
 */
export function canUseEffect(effect, userXP = 0, userRole = 'Kullanıcı', unlockedEffects = []) {
  // Admin/Yönetici = tüm efektlere erişim
  if (userRole === 'Baş Admin' || userRole === 'Yönetici') return true;
  
  // Varsayılan efekt herkes için açık
  if (effect.id === 'none') return true;
  
  // Admin-only efektler
  if (effect.adminOnly) return false;
  
  // Satın alınmış mı kontrol et
  if (unlockedEffects.includes(effect.id)) return true;
  
  // XP ile açılmış mı
  if (effect.price === 0 && effect.minXP > 0 && userXP >= effect.minXP) return true;
  
  return false;
}

/**
 * Efektin kilitli olma nedenini döndürür.
 */
export function getLockReason(effect, userXP = 0) {
  if (effect.adminOnly) return 'Admin Özel';
  if (effect.price > 0) return `${effect.price} Coin`;
  if (effect.minXP > 0 && userXP < effect.minXP) return `${effect.minXP} XP Gerekli`;
  return null;
}

/**
 * Efekt ID'sinden CSS class'ını döndürür.
 */
export function getEffectCSS(effectType, effectId) {
  const effectMap = {
    avatar: AVATAR_EFFECTS,
    comment: COMMENT_EFFECTS,
    nametag: NAMETAG_EFFECTS
  };
  
  const list = effectMap[effectType];
  if (!list) return '';
  
  const found = list.find(e => e.id === effectId);
  return found?.css || '';
}

/**
 * Tüm efektleri tek bir map olarak döndürür.
 */
export function getAllEffects() {
  return {
    avatar: AVATAR_EFFECTS,
    comment: COMMENT_EFFECTS,
    nametag: NAMETAG_EFFECTS
  };
}

// ── ELITE PAKET TANIMLARI ───────────────────────────────────────────────
export const ELITE_PACKAGES = [
  {
    id: 'gojo',
    name: 'Satoru Gojo',
    anime: 'Jujutsu Kaisen',
    icon: '🔵',
    color: '#3b82f6',
    effects: {
      nametag: 'unlimited-void',
      avatar: 'gojo-aura',
      comment: 'gojo-void'
    }
  },
  {
    id: 'sukuna',
    name: 'Sukuna',
    anime: 'Jujutsu Kaisen',
    icon: '🔴',
    color: '#dc2626',
    effects: {
      nametag: 'malevolent-shrine',
      avatar: 'sukuna-aura',
      comment: 'sukuna-blood'
    }
  },
  {
    id: 'itadori',
    name: 'Yuji Itadori',
    anime: 'Jujutsu Kaisen',
    icon: '🔥',
    color: '#f97316',
    effects: {
      nametag: 'cursed-fire',
      avatar: 'itadori-aura',
      comment: 'itadori-cursed'
    }
  },
  {
    id: 'jinwoo',
    name: 'Sung Jin Woo',
    anime: 'Solo Leveling',
    icon: '🌑',
    color: '#7c3aed',
    effects: {
      nametag: 'monarch-shadows',
      avatar: 'jinwoo-aura',
      comment: 'jinwoo-shadow'
    }
  },
  {
    id: 'mahoraga',
    name: 'Dahi General Mahoraga',
    anime: 'Jujutsu Kaisen',
    icon: '☸️',
    color: '#f59e0b',
    effects: {
      nametag: 'diviner-general',
      avatar: 'mahoraga-aura',
      comment: 'mahoraga-dharma'
    }
  }
];
