import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { handleImageError, getOptimizedImage } from '../utils/imageOpt.js';

export default function NetflixCard({ item, type = 'trending', rank, chapters }) {
  const isTrending = type === 'trending';
  const chapterData = chapters ? (chapters[String(item.id)]?.[0]?.number || '?') : '?';

  return (
    <Link to={`/manhwa/${item.id}`} className="group block w-[160px] sm:w-[200px] flex-shrink-0 netflix-card" aria-label={`${item.title} okumaya başla`}>
      <article 
        style={{ contentVisibility: 'auto', containIntrinsicSize: '200px 280px' }}
        className="relative rounded-md overflow-hidden bg-[#141414] border border-white/5 transition-all duration-300 shadow-xl"
      >
        {isTrending && rank && (
          <div className="absolute top-0 left-0 z-20 pointer-events-none">
            <div className={`flex items-center justify-center w-10 h-10 rounded-br-md text-xl font-black italic shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${
              rank === 1 ? 'bg-gradient-to-br from-[#E50914] to-red-900 text-white' : 
              rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-[#141414]' : 
              rank === 3 ? 'bg-gradient-to-br from-orange-500 to-orange-800 text-white' : 
              'bg-gradient-to-br from-zinc-700 to-zinc-900 text-white'
            }`}>
              #{rank}
            </div>
          </div>
        )}
        <div className="relative aspect-[2/3] overflow-hidden bg-[#070511]">
          <img 
            src={getOptimizedImage(item.cover, 300)} 
            alt={item.title} 
            className="w-full h-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100" 
            loading="lazy"
            decoding="async"
            width={200}
            height={300}
            onError={handleImageError} 
          />
          {/* Netflix style bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded border border-white/10 opacity-100 transition-opacity">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-white text-[10px] font-bold">{item.rating}</span>
          </div>

          {/* Hover Details overlaying the image */}
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex flex-col gap-1 z-10">
            <h3 className="text-white text-sm font-black truncate shadow-black drop-shadow-md">{item.title}</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="text-emerald-400 drop-shadow-md">{chapterData} Bölüm</span>
              <span className="text-slate-300 drop-shadow-md truncate">{Array.isArray(item.genre) ? item.genre[0] : item.genre || 'Aksiyon'}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
