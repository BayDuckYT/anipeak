import { useState, useEffect, useRef } from 'react';

/**
 * LazySection
 * Alt kısımdaki bileşenleri (Trending, Öneriler vb.) ekrana yaklaşana kadar yüklemez.
 * Render-blocking'i engeller, Initial Load süresini (LCP/FCP) drastik şekilde hızlandırır.
 */
export default function LazySection({ children, minHeight = '300px', rootMargin = '300px 0px' }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // SSR veya eski tarayıcılar için fallback
    if (!window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin } // Eleman ekrana 300px yaklaşınca yüklemeye başla
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={sectionRef} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {isVisible ? (
        children
      ) : (
        <div className="w-full h-full min-h-[inherit] rounded-2xl bg-purple-900/10 animate-pulse border border-purple-500/10 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
