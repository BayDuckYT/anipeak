/**
 * Gelişmiş Resim Optimizasyon ve Fallback (Hata) Yöneticisi
 */

// Otomatik WebP çevirici ve boyutlandırıcı (Ücretsiz CDN: wsrv.nl)
export function getOptimizedImage(url, width = 300) {
  if (!url) return getFallbackImage();
  
  // Eğer url zaten optimize edilmiş bir servis ise
  if (url.includes('wsrv.nl')) {
    // Veritabanında w=300 olarak kaydedilmiş olabilir, onu istenen genişlikle değiştir
    return url.replace(/&w=\d+/, `&w=${width}`).replace(/\?w=\d+&/, `?w=${width}&`);
  }
  
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  // Supabase veya dış linkleri proxy üzerinden geçirerek küçült ve webp yap
  const isGif = url.toLowerCase().includes('.gif');
  // GIF'leri animated WebP'ye dönüştürmek için n=-1 ekliyoruz
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp${isGif ? '&n=-1' : ''}&q=70`;
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
