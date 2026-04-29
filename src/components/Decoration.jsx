import React from 'react';

export default function Decoration({ effect, size = 160 }) {
  if (!effect || !effect.src) return null;

  if (effect.type === 'spritesheet') {
    const frames = effect.steps || 24;
    const duration = frames / (effect.fps || 12);

    return (
      <div 
        className="relative overflow-hidden pointer-events-none"
        style={{
          width: '120%',
          height: '120%',
          position: 'absolute',
          top: '-10%',
          left: '-10%',
        }}
      >
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
      <div className="absolute inset-[-10%] w-[120%] h-[120%] pointer-events-none overflow-hidden rounded-full">
        <video 
          src={effect.src} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover mix-blend-screen opacity-90"
        />
      </div>
    );
  }

  return (
    <img 
      src={effect.src} 
      className="absolute inset-[-10%] w-[120%] h-[120%] pointer-events-none object-contain" 
      alt="Decoration" 
    />
  );
}
