import React from 'react';
import { motion } from 'framer-motion';

/**
 * SiberAvatar - AniPeak High-Fidelity Avatar System
 * Implements the requested 3-layer precision alignment for Discord-style decorations.
 */
export default function SiberAvatar({ 
  src, 
  effect, 
  size = "w-32 h-32", // Tailwind classes for size
  className = "" 
}) {
  
  const renderEffect = () => {
    const effectSrc = effect.url || effect.src || effect.image || effect.asset;
    if (!effect || !effectSrc) return null;

    // Auto-detect type if missing (Discord PNGs are usually spritesheets)
    const type = effect.type || (effectSrc.includes('discordapp.com') ? 'spritesheet' : 'static');

    // Layer 3: Siber Çerçeve / Efekt (absolute z-10 oversized)
    const effectClasses = "absolute -left-[10%] -top-[10%] w-[120%] h-[120%] z-10 pointer-events-none bg-transparent";

    if (type === 'spritesheet') {
      const frames = effect.steps || 24;
      const duration = frames / (effect.fps || 12);
      
      return (
        <div className={effectClasses + " overflow-hidden bg-zinc-800/10 animate-pulse"}>
           <img 
            src={effectSrc}
            alt=""
            loading="eager"
            className="w-full h-auto max-w-none block"
            style={{
              animation: `siber-spritesheet-v2 ${duration}s steps(${frames}) infinite`,
            }}
            onLoad={(e) => {
              e.currentTarget.parentElement.classList.remove('animate-pulse', 'bg-zinc-800/10');
            }}
            onError={(e) => {
              e.currentTarget.parentElement.classList.remove('animate-pulse');
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (type === 'video') {
      return (
        <div className={effectClasses + " overflow-hidden rounded-full"}>
          <video 
            src={effectSrc} 
            autoPlay loop muted playsInline
            className="w-full h-full object-cover mix-blend-screen opacity-90 scale-[1.1]"
          />
        </div>
      );
    }

    return (
      <img 
        src={effectSrc} 
        className={effectClasses + " object-contain"} 
        alt={effect.label || effect.name || "Decoration"} 
      />
    );
  };

  return (
    // Layer 1: Ana Karargah (relative flex items-center justify-center)
    <div className={`relative flex items-center justify-center ${size} ${className}`}>
      
      {/* Layer 2: Alt Katman (Kullanıcı Avatarı - absolute w-full h-full rounded-full z-0) */}
      <div className="absolute w-full h-full rounded-full overflow-hidden z-0 bg-zinc-950/50 border border-zinc-800/50">
        {src && (
          <img 
            src={src} 
            alt="Avatar" 
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Layer 3: Efekt Katmanı (z-10) */}
      {renderEffect()}
      
      {/* Glow Effect Support */}
      <div className="absolute inset-0 rounded-full bg-purple-500/5 blur-xl pointer-events-none z-[-1]" />
    </div>
  );
}
