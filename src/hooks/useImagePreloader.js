import { useEffect } from 'react';

export function useImagePreloader(imageUrls) {
  useEffect(() => {
    if (!imageUrls || !imageUrls.length) return;

    // First 3 images load normally via DOM, so we can preload from index 3 onwards.
    // Or we can aggressively preload all of them into browser cache.
    const timer = setTimeout(() => {
      // Preload images silently in the background
      imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    }, 500); // Wait 500ms to let the first visible images load first

    return () => clearTimeout(timer);
  }, [imageUrls]);
}
