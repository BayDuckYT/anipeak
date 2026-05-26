import React, { useRef, useEffect } from 'react';

export function StaticImageFallback({ src, alt, className, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.onerror = () => {
      // Çapraz köken (CORS) hatası alırsak crossOrigin olmadan tekrar deneyelim (bazen işe yarar)
      if (img.crossOrigin) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          canvas.width = fallbackImg.naturalWidth;
          canvas.height = fallbackImg.naturalHeight;
          ctx.drawImage(fallbackImg, 0, 0);
        };
        fallbackImg.src = src;
      }
    };
    img.src = src;
  }, [src]);

  return <canvas ref={canvasRef} className={className} style={style} aria-label={alt} />;
}
