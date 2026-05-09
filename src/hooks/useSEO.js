import { useEffect } from 'react';

/**
 * Dinamik SEO (Arama Motoru Optimizasyonu) ve Sosyal Medya (Discord/Twitter) Kartları Hook'u.
 * Paket kurulumuna gerek kalmadan, doğrudan tarayıcı DOM'una müdahale ederek SEO'yu güçlendirir.
 */
export function useSEO({ title, description, image, url }) {
  useEffect(() => {
    // 1. Sayfa Başlığı (Sekme yazısı)
    if (title) {
      document.title = `${title} | AniPeak`;
    }

    // 2. Meta etiketlerini güncelleyen veya oluşturan yardımcı fonksiyon
    const setMeta = (name, content) => {
      let element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('twitter:')) {
          element.setAttribute('property', name); // OpenGraph kuralları gereği property kullanılır
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Etiketleri Uygula
    if (description) {
      setMeta('description', description);
      setMeta('og:description', description);
      setMeta('twitter:description', description);
    }
    
    if (title) {
      setMeta('og:title', `${title} | AniPeak`);
      setMeta('twitter:title', `${title} | AniPeak`);
    }

    if (image) {
      setMeta('og:image', image);
      setMeta('twitter:image', image);
      setMeta('twitter:card', 'summary_large_image'); // Büyük resimli kart
      setMeta('theme-color', '#A855F7'); // Discord yanıp sönen mor neon rengi
    }

    if (url) {
      setMeta('og:url', url);
    }

    // Component'ten çıkıldığında temizleme yapılabilir ancak SPA'de yeni sayfa üzerine yazar.
  }, [title, description, image, url]);
}
