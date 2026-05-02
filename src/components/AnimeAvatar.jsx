import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AutoSpritesheet — Otomatik kare tespitli spritesheet animatörü.
 * Resmin naturalWidth/naturalHeight oranından kare sayısını hesaplar.
 */
function AutoSpritesheet({ src, style, isHovered, forcePlay, label }) {
  const [frameCount, setFrameCount] = useState(null);

  useEffect(() => {
    setFrameCount(null);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.round(img.naturalWidth / img.naturalHeight);
      setFrameCount(ratio > 1 ? ratio : 1);
    };
    img.onerror = () => setFrameCount(1);
    img.src = src;
  }, [src]);

  // Henüz boyut tespit edilmedi — direkt img göster (APNG ise browser oynatır)
  if (frameCount === null || frameCount <= 1) {
    return (
      <img 
        src={src}
        alt={label || 'Effect'}
        style={style}
        className="max-w-none mix-blend-screen"
      />
    );
  }

  // Çok kare = spritesheet animasyonu (her zaman oynat)
  const fps = 12;
  const duration = frameCount / fps;

  return (
    <div 
      style={{
        ...style,
        backgroundImage: `url(${src})`,
        backgroundSize: `${frameCount * 100}% 100%`,
        backgroundPosition: '0% center',
        backgroundRepeat: 'no-repeat',
        animation: `siber-spritesheet ${duration}s steps(${frameCount - 1}) infinite`,
      }}
      className="max-w-none mix-blend-screen"
    />
  );
}

export default function AnimeAvatar({ 
  src, 
  effect, 
  size = "w-32 h-32", 
  className = "",
  forcePlay = false // Dışarıdan tetiklenebilir (Örn: Aktif efekt)
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Intersection Observer: Sadece ekranda görünürken yükle (Performans Kilidi)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        // Ekranda değilse videoyu durdur
        if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Video Kontrolü: Sadece Hover iken VE Görünür iken oynat
  useEffect(() => {
    if (videoRef.current && isVisible) {
      if (isHovered || forcePlay) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => { /* Auto-play intercept */ });
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, forcePlay, isVisible]);

  const renderEffect = () => {
    if (!effect || !isVisible) return null;
    const rawSrc = effect.url || effect.src || effect.image || effect.asset;
    if (!rawSrc) return null;

    const isVideo = rawSrc.endsWith('.webm') || effect.type === 'video';
    
    // Milimetrik Hizalama Stili (Perfect Center)
    const effectStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '130%',
      height: '130%',
      zIndex: 10,
      pointerEvents: 'none',
      objectFit: 'contain',
    };

    if (isVideo) {
      return (
        <video 
          ref={videoRef}
          src={rawSrc} 
          muted 
          loop 
          playsInline
          preload="none"
          style={effectStyle}
          className="max-w-none opacity-90 mix-blend-screen"
        />
      );
    }

    // Spritesheet / PNG Efekt Mantığı
    const isPng = rawSrc.toLowerCase().split('?')[0].endsWith('.png');
    const isSpritesheet = 
      effect.category === 'flags' || 
      effect.category === 'decorations' ||
      effect.type === 'spritesheet' || 
      rawSrc.includes('/effects/') || 
      rawSrc.includes('/avatar-efekts/');
    
    if (isPng && isSpritesheet) {
      // Oto-tespit bileşenini kullan
      return <AutoSpritesheet src={rawSrc} style={effectStyle} isHovered={isHovered} forcePlay={forcePlay} label={effect.label} />;
    }

    // Statik / APNG / GIF - IMG Taktiği (Animasyon için en garanti yöntem)
    return (
      <img 
        src={rawSrc}
        alt={effect.label || effect.name}
        style={effectStyle}
        className="max-w-none"
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsVisible(true) || setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative aspect-square flex-shrink-0 overflow-visible cursor-pointer grid place-items-center ${size} ${className}`}
    >
      {/* KATMAN 1: AVATAR */}
      <div className="relative z-0 w-full h-full rounded-full overflow-hidden bg-zinc-950/80 border border-white/5 shadow-2xl">
        {src && (
          <img 
            src={src} 
            alt="Avatar" 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        {/* İç Gölge ve Derinlik */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full" />
      </div>

      {/* KATMAN 2: EFEKT (Simetrik Render) */}
      <AnimatePresence>
        {(isHovered || forcePlay || !effect?.url?.endsWith('.webm')) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {renderEffect()}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Arka Plan Işıltısı (Glow) */}
      <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
