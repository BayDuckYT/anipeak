import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImage } from '../utils/imageOpt.js';
import { StaticImageFallback } from './StaticImageFallback.jsx';

/**
 * AutoSpritesheet — Otomatik kare tespitli spritesheet animatörü.
 * Resmin naturalWidth/naturalHeight oranından kare sayısını hesaplar.
 */
function AutoSpritesheet({ src, style, isHovered, forcePlay, hoverOnly = false, label }) {
  const [frameData, setFrameData] = useState({ count: null, direction: 'h' });

  useEffect(() => {
    setFrameData({ count: null, direction: 'h' });
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > h) {
        const ratio = Math.round(w / h);
        setFrameData({ count: ratio > 1 ? ratio : 1, direction: 'h' });
      } else {
        const ratio = Math.round(h / w);
        setFrameData({ count: ratio > 1 ? ratio : 1, direction: 'v' });
      }
    };
    img.onerror = () => setFrameData({ count: 1, direction: 'h' });
    img.src = src;
  }, [src]);

  if (frameData.count === null || frameData.count <= 1) {
    if (!hoverOnly || isHovered || forcePlay) {
      return (
        <img 
          src={src}
          alt={label || 'Effect'}
          style={style}
          className="max-w-none"
        />
      );
    } else {
      return (
        <StaticImageFallback 
          src={src}
          alt={label || 'Effect'}
          style={style}
          className="max-w-none"
        />
      );
    }
  }

  const fps = 12;
  const duration = frameData.count / fps;
  const isV = frameData.direction === 'v';

  return (
    <div 
      style={{
        ...style,
        backgroundImage: `url(${src})`,
        backgroundSize: isV ? `100% ${frameData.count * 100}%` : `${frameData.count * 100}% 100%`,
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        animation: `${isV ? 'siber-spritesheet-vertical' : 'siber-spritesheet'} ${duration}s steps(${frameData.count - 1}) infinite`,
        animationPlayState: (!hoverOnly || isHovered || forcePlay) ? 'running' : 'paused',
      }}
      className="max-w-none"
    />
  );
}

export default function AnimeAvatar({ 
  src, 
  effect, 
  size = "w-32 h-32", 
  className = "",
  forcePlay = false,
  hoverOnly = false,
  eager = false
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current && isVisible) {
      if (!hoverOnly || isHovered || forcePlay) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isHovered, forcePlay, isVisible, hoverOnly]);

  const renderEffect = () => {
    if (!effect || !isVisible) return null;
    const rawSrc = effect.url || effect.src || effect.image || effect.asset;
    if (!rawSrc) return null;

    const isVideo = rawSrc.toLowerCase().endsWith('.webm') || effect.type === 'video';
    
    const effectStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '120%',
      height: '120%',
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

    const isSpritesheet = 
      effect.category === 'flags' || 
      effect.type === 'spritesheet' || 
      rawSrc.includes('/effects/') || 
      rawSrc.includes('/avatar-efekts/') ||
      rawSrc.includes('/decorations/');

    // [PERFORMANS] Yerel dosyaları proxy'ye (wsrv.nl) gönderme; çünkü proxy şerit yapısını bozabiliyor.
    // Cloudflare zaten bunları kendi CDN'inde otomatik olarak WebP yapıp sıkıştıracaktır.
    const optimizedSrc = rawSrc;
    
    return (
      <AutoSpritesheet 
        src={optimizedSrc} 
        style={effectStyle} 
        isHovered={isHovered} 
        forcePlay={forcePlay} 
        hoverOnly={hoverOnly}
        label={effect.label || 'Effect'} 
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative aspect-square flex-shrink-0 overflow-visible cursor-pointer grid place-items-center ${size} ${className}`}
    >
      {/* KATMAN 1: AVATAR */}
      <div className="relative z-0 w-full h-full rounded-full overflow-hidden bg-zinc-950/80 border border-white/5 shadow-2xl">
        {src && (
          <img 
            src={getOptimizedImage(src, 200)} 
            alt="Avatar" 
            loading={eager ? "eager" : "lazy"}
            fetchpriority={eager ? "high" : "auto"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full" />
      </div>

      {/* KATMAN 2: EFEKT */}
      <div className="absolute inset-0">
        {renderEffect()}
      </div>
      
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
