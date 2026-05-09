import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * VirtualHScroll — Yatay kaydırma listesi için sanal pencere (virtualization)
 * Ekranda görünmeyen elemanları DOM'dan kaldırır → bellek ve render yükü düşer
 * 
 * @param {Array} items - Liste elemanları
 * @param {Function} renderItem - (item, index) => JSX
 * @param {number} itemWidth - Her elemanın genişliği (px)
 * @param {number} gap - Elemanlar arası boşluk (px)
 * @param {string} className - Container class
 * @param {number} overscan - Görünür alan dışında tutulan ekstra eleman sayısı
 */
export default function VirtualHScroll({
  items,
  renderItem,
  itemWidth = 160,
  gap = 12,
  className = '',
  overscan = 2,
}) {
  const containerRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // İlk ölçüm
    setContainerWidth(el.clientWidth);

    const handleScroll = () => setScrollLeft(el.scrollLeft);
    const resizeObs = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    el.addEventListener('scroll', handleScroll, { passive: true });
    resizeObs.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      resizeObs.disconnect();
    };
  }, []);

  const stride = itemWidth + gap;
  const totalWidth = items.length * stride - gap;

  // Hangi indexler görünür?
  const startIndex = Math.max(0, Math.floor(scrollLeft / stride) - overscan);
  const visibleCount = Math.ceil(containerWidth / stride) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto no-scrollbar ${className}`}
      style={{ scrollSnapType: 'x mandatory', position: 'relative' }}
    >
      {/* Toplam genişliği koruyacak placeholder */}
      <div style={{ width: totalWidth, position: 'relative', height: '100%', display: 'flex' }}>
        {/* Sol boşluk (görünmeyen elemanların yeri) */}
        {startIndex > 0 && (
          <div style={{ width: startIndex * stride, flexShrink: 0 }} aria-hidden="true" />
        )}

        {/* Sadece görünür elemanlar */}
        {items.slice(startIndex, endIndex).map((item, i) => (
          <div
            key={item.id ?? startIndex + i}
            style={{ flexShrink: 0, width: itemWidth, marginRight: i < endIndex - startIndex - 1 ? gap : 0, scrollSnapAlign: 'start' }}
          >
            {renderItem(item, startIndex + i)}
          </div>
        ))}
      </div>
    </div>
  );
}
