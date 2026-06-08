/**
 * Gelişmiş Resim Optimizasyon ve Fallback (Hata) Yöneticisi
 */

// Otomatik WebP çevirici ve boyutlandırıcı (Ücretsiz CDN: wsrv.nl)
export function getOptimizedImage(url, width = 300) {
  if (!url) return getFallbackImage();
  
  // Retina (Yüksek çözünürlüklü) ekranlar için genişliği %50 artırıp kaliteyi yükseltiyoruz.
  const targetWidth = Math.round(width * 1.5);

  // Eğer url zaten optimize edilmiş bir servis ise
  if (url.includes('wsrv.nl')) {
    // Veritabanında w=300 olarak kaydedilmiş olabilir, onu istenen genişlikle değiştir
    return url.replace(/&w=\d+/, `&w=${targetWidth}`).replace(/\?w=\d+&/, `?w=${targetWidth}&`).replace(/&q=\d+/, '&q=70');
  }
  
  // URL'yi absolute yap
  let absoluteUrl = url;
  if (url.startsWith('/')) {
    absoluteUrl = `https://mahorapeak.com.tr${url}`;
  } else if (url.startsWith('data:')) {
    return url;
  }

  // GIF ve Avatarlar için animasyon destekli (n=-1)
  const isGif = absoluteUrl.toLowerCase().includes('.gif') || absoluteUrl.includes('/avatars/');
  if (isGif) {
    return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${targetWidth}&af=1&n=-1&q=60`;
  }

  return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${targetWidth}&af=1&q=65`;
}

// Sadece tek bir kare (animasyonsuz) halini getiren fonksiyon
// page=5 ekleyerek, fade-in animasyonlarında ilk karenin boş/siyah çıkmasını engelliyoruz
export function getStaticImage(url, width = 300) {
  if (!url) return getFallbackImage();
  
  const targetWidth = Math.round(width * 1.5);

  if (url.includes('wsrv.nl')) {
    let staticUrl = url.replace(/&w=\d+/, `&w=${targetWidth}`).replace(/\?w=\d+&/, `?w=${targetWidth}&`).replace(/&q=\d+/, '&q=75');
    if (!staticUrl.includes('&n=')) {
      staticUrl += '&n=1&page=5';
    }
    return staticUrl;
  }
  
  let absoluteUrl = url;
  if (url.startsWith('/')) {
    absoluteUrl = `https://mahorapeak.com.tr${url}`;
  } else if (url.startsWith('data:')) {
    return url;
  }

  // n=1 (sadece 1 kare) ve page=5 (5. kareyi al ki fade-in efekti boş çıkmasın)
  return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${targetWidth}&af=1&q=75&n=1&page=5`;
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
