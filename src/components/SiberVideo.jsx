import React, { useRef, useEffect } from 'react';

/**
 * SiberVideo — Garantili video oynatma bileşeni.
 * AbortError (play interrupted by pause) hatasına karşı bağışık.
 */
export default function SiberVideo({ src, className = '', ...props }) {
  const ref = useRef(null);
  const playPromiseRef = useRef(null);

  useEffect(() => {
    const vid = ref.current;
    if (!vid || !src) return;

    // Prop'lar üzerinden değil DOM üzerinden ayarla
    vid.muted = true;
    vid.playsInline = true;
    vid.loop = true;
    vid.preload = 'auto';

    const tryPlay = () => {
      // Eğer zaten oynuyorsa veya oynatma isteği devam ediyorsa dokunma
      if (!vid.paused || playPromiseRef.current) return;
      
      const p = vid.play();
      if (p !== undefined) {
        playPromiseRef.current = p;
        p.then(() => {
          // Başarılı
          playPromiseRef.current = null;
        }).catch((err) => {
          playPromiseRef.current = null;
          // AbortError genellikle sayfa değişimi veya hızlı re-render'da olur, yoksayabiliriz.
          if (err.name !== 'AbortError') {
            console.warn('[SiberVideo] Play hatası:', src, err.message);
          }
        });
      }
    };

    const onCanPlay = () => tryPlay();

    vid.addEventListener('canplay', onCanPlay);
    vid.addEventListener('loadeddata', onCanPlay);

    // Hemen dene
    tryPlay();
    
    // Güvenlik zamanlayıcısı (AbortError sonrası takılı kalmaması için)
    const t1 = setTimeout(tryPlay, 300);
    const t2 = setTimeout(tryPlay, 1000);

    return () => {
      vid.removeEventListener('canplay', onCanPlay);
      vid.removeEventListener('loadeddata', onCanPlay);
      clearTimeout(t1);
      clearTimeout(t2);
      
      // StrictMode veya hızlı re-render'larda play() işlemini bozmamak için 
      // agresif pause() ve removeAttribute yapmıyoruz. 
      // Tarayıcı elementi DOM'dan sildiğinde kendi temizliğini yapar.
    };
  }, [src]);

  if (!src) return null;

  // Discord CDN Tüneli (VPN'siz erişim için)
  const videoSrc = src.includes('cdn.discordapp.com')
    ? `/api/proxy?url=${encodeURIComponent(src)}`
    : src;

  return (
    <video
      ref={ref}
      className={className}
      src={videoSrc}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      {...props}
    >
      <track kind="captions" srcLang="tr" label="Efekt" />
    </video>
  );
}
