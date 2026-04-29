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
    if (!effect || !effect.src) return null;

    // Layer 3: Siber Çerçeve / Efekt (absolute inset-0 w-full h-full z-10)
    const effectClasses = "absolute inset-0 w-full h-full z-10 pointer-events-none scale-[1.12]";

    if (effect.type === 'spritesheet') {
      const frames = effect.steps || 24;
      const duration = frames / (effect.fps || 12);
      
      return (
        <div className={effectClasses}>
           <div 
            className="w-full h-full bg-no-repeat bg-center"
            style={{
              backgroundImage: `url(${effect.src})`,
              backgroundSize: `100% ${frames * 100}%`,
              animation: `play-spritesheet-${effect.id} ${duration}s steps(${frames}) infinite`,
            }}
          />
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes play-spritesheet-${effect.id} {
              from { background-position: 0 0; }
              to { background-position: 0 -${frames * 100}%; }
            }
          `}} />
        </div>
      );
    }

    if (effect.type === 'video') {
      return (
        <div className={effectClasses + " overflow-hidden rounded-full"}>
          <video 
            src={effect.src} 
            autoPlay loop muted playsInline
            className="w-full h-full object-cover mix-blend-screen opacity-90 scale-[1.1]"
          />
        </div>
      );
    }

    return (
      <img 
        src={effect.src} 
        className={effectClasses} 
        alt="Decoration" 
      />
    );
  };

  return (
    // Layer 1: Ana Karargah (relative flex items-center justify-center)
    <div className={`relative flex items-center justify-center ${size} ${className}`}>
      
      {/* Layer 2: Alt Katman (Kullanıcı Avatarı - absolute w-[85%] h-[85%] rounded-full z-0) */}
      <div className="absolute w-[84%] h-[84%] rounded-full overflow-hidden z-0 bg-zinc-900 border border-zinc-800">
        <img 
          src={src || "https://github.com/shadcn.png"} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = "https://github.com/shadcn.png"; }}
        />
      </div>

      {/* Layer 3: Efekt Katmanı */}
      {renderEffect()}
      
      {/* Glow Effect Support */}
      <div className="absolute inset-0 rounded-full bg-purple-500/5 blur-xl pointer-events-none z-[-1]" />
    </div>
  );
}
