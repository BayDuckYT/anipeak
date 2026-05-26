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

  // Supabase avatars bucket'ındaki dosyaları proxy'den geçirme (GIF animasyonu bozulur)
  // Supabase zaten kendi CDN'ini kullanıyor, ekstra optimizasyona gerek yok
  if (url.includes('/storage/v1/object/public/avatars/')) {
    return url;
  }

  // GIF'leri bozmamak için direkt orijinal url'yi döndürüyoruz
  const isGif = url.toLowerCase().includes('.gif');
  if (isGif) return url;

  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=70`;
}

// Sadece tek bir kare (animasyonsuz) halini getiren fonksiyon
// page=5 ekleyerek, fade-in animasyonlarında ilk karenin boş/siyah çıkmasını engelliyoruz
export function getStaticImage(url, width = 300) {
  if (!url) return getFallbackImage();
  
  if (url.includes('wsrv.nl')) {
    let staticUrl = url.replace(/&w=\d+/, `&w=${width}`).replace(/\?w=\d+&/, `?w=${width}&`);
    if (!staticUrl.includes('&n=')) {
      staticUrl += '&n=1&page=5';
    }
    return staticUrl;
  }
  
  let absoluteUrl = url;
  if (url.startsWith('/')) {
    absoluteUrl = `https://anipeak.com.tr${url}`;
  } else if (url.startsWith('data:')) {
    return url;
  }

  // n=1 (sadece 1 kare) ve page=5 (5. kareyi al ki fade-in efekti boş çıkmasın)
  return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${width}&output=webp&q=70&n=1&page=5`;
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
