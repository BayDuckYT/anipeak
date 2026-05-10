/**
 * Gelişmiş Resim Optimizasyon ve Fallback (Hata) Yöneticisi
 */

// Otomatik WebP çevirici ve boyutlandırıcı (Ücretsiz CDN: wsrv.nl)
export function getOptimizedImage(url, width = 300) {
  if (!url) return getFallbackImage();
  
  // Eğer url zaten optimize edilmiş bir servis ise veya yerel dosya ise karışma
  if (url.includes('wsrv.nl') || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  // Supabase veya dış linkleri proxy üzerinden geçirerek küçült ve webp yap
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=70`;
}

// Resim yüklenemezse gösterilecek güvenli (çökmeyen) siyah/mor yer tutucu
export function getFallbackImage() {
  return 'https://placehold.co/300x450/0a0a0c/a855f7?text=Gorsel+Yok';
}

// React <img onError={...} /> için güvenli handler (Sonsuz döngüyü engeller)
export function handleImageError(e) {
  e.target.onerror = null; // Sonsuz döngüyü kır
  e.target.src = getFallbackImage();
}
