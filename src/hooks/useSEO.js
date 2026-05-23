import { useEffect } from 'react';

/**
 * Dinamik SEO (Arama Motoru Optimizasyonu) ve Sosyal Medya (Discord/Twitter) Kartları Hook'u.
 * Paket kurulumuna gerek kalmadan, doğrudan tarayıcı DOM'una müdahale ederek SEO'yu güçlendirir.
 * 
 * Lighthouse 100 için:
 * - document.title
 * - meta description
 * - canonical URL (link[rel=canonical])
 * - og:title, og:description, og:image, og:url
 * - twitter:title, twitter:description, twitter:image, twitter:card
 * - robots
 */
export function useSEO({ title, description, image, url, robots = 'index, follow' }) {
  useEffect(() => {
    // 1. Sayfa Başlığı (Sekme yazısı)
    if (title) {
      document.title = `${title} | AniPeak`;
    }

    // 2. Meta etiketlerini güncelleyen veya oluşturan yardımcı fonksiyon
    const setMeta = (attr, key, content) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Canonical URL — Lighthouse SEO için kritik
    if (url) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    }

    // 4. Robots meta
    if (robots) {
      setMeta('name', 'robots', robots);
    }

    // 5. Description
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    
    // 6. Title meta tags
    if (title) {
      setMeta('property', 'og:title', `${title} | AniPeak`);
      setMeta('name', 'twitter:title', `${title} | AniPeak`);
    }

    // 7. Image meta tags
    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:image', image);
      setMeta('name', 'twitter:card', 'summary_large_image');
    }

    // 8. URL meta tags
    if (url) {
      setMeta('property', 'og:url', url);
    }

    // Component'ten çıkıldığında temizleme yapılabilir ancak SPA'de yeni sayfa üzerine yazar.
  }, [title, description, image, url, robots]);
}
