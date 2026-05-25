import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NetflixCard from './NetflixCard.jsx';

export default function NetflixRow({ title, subtitle, items, renderCard }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -800, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 800, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-10 relative group/row">
      <div className="flex items-end gap-3 px-4 sm:px-12 mb-4">
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h2>
        {subtitle && <span className="text-sm font-bold text-slate-500 mb-1">{subtitle}</span>}
      </div>

      {/* Scroll Buttons */}
      <button 
        onClick={scrollLeft} 
        className="absolute left-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-r from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400"
      >
        <ChevronLeft size={40} className="drop-shadow-lg" />
      </button>

      <button 
        onClick={scrollRight} 
        className="absolute right-0 top-14 bottom-0 w-12 z-20 bg-gradient-to-l from-[#070511] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-purple-400"
      >
        <ChevronRight size={40} className="drop-shadow-lg" />
      </button>

      {/* Row Items */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-4 sm:px-12 pb-8"
      >
        {items.map((item, idx) => (
          <div key={item.id} className="snap-start flex-shrink-0">
            {renderCard ? renderCard(item, idx) : <NetflixCard item={item} />}
          </div>
        ))}
      </div>
    </div>
  );
}
