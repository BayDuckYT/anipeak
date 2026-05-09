import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2, Map, Activity, Zap, TrendingUp } from 'lucide-react';
import createGlobe from 'cobe';

const WORLD_NODES = [
  { name: 'Tokyo', country: 'Japonya', flag: '🇯🇵', reads: '1.2M', latLon: [35.68, 139.69], size: 0.07, color: '#10b981' },
  { name: 'Seoul', country: 'G.Kore', flag: '🇰🇷', reads: '890k', latLon: [37.57, 126.98], size: 0.06, color: '#6366f1' },
  { name: 'Mumbai', country: 'Hindistan', flag: '🇮🇳', reads: '750k', latLon: [19.08, 72.88], size: 0.06, color: '#f59e0b' },
  { name: 'Manila', country: 'Filipinler', flag: '🇵🇭', reads: '620k', latLon: [14.60, 120.98], size: 0.05, color: '#ec4899' },
  { name: 'Jakarta', country: 'Endonezya', flag: '🇮🇩', reads: '540k', latLon: [-6.21, 106.85], size: 0.05, color: '#ef4444' },
  { name: 'Bangkok', country: 'Tayland', flag: '🇹🇭', reads: '310k', latLon: [13.76, 100.50], size: 0.04, color: '#8b5cf6' },
  { name: 'Ho Chi Minh', country: 'Vietnam', flag: '🇻🇳', reads: '280k', latLon: [10.82, 106.63], size: 0.04, color: '#f97316' },
  { name: 'Kuala Lumpur', country: 'Malezya', flag: '🇲🇾', reads: '195k', latLon: [3.14, 101.69], size: 0.03, color: '#06b6d4' },
  { name: 'Taipei', country: 'Tayvan', flag: '🇹🇼', reads: '180k', latLon: [25.03, 121.57], size: 0.03, color: '#10b981' },
  { name: 'Beijing', country: 'Çin', flag: '🇨🇳', reads: '120k', latLon: [39.90, 116.41], size: 0.04, color: '#ef4444' },
  { name: 'Singapur', country: 'Singapur', flag: '🇸🇬', reads: '98k', latLon: [1.35, 103.82], size: 0.03, color: '#f59e0b' },
  { name: 'Dubai', country: 'BAE', flag: '🇦🇪', reads: '72k', latLon: [25.20, 55.27], size: 0.03, color: '#fbbf24' },
  { name: 'İstanbul', country: 'Türkiye', flag: '🇹🇷', reads: '420k', latLon: [41.01, 28.98], size: 0.05, color: '#06b6d4' },
  { name: 'Ankara', country: 'Türkiye', flag: '🇹🇷', reads: '120k', latLon: [39.93, 32.86], size: 0.03, color: '#06b6d4' },
  { name: 'London', country: 'İngiltere', flag: '🇬🇧', reads: '380k', latLon: [51.51, -0.13], size: 0.05, color: '#3b82f6' },
  { name: 'Paris', country: 'Fransa', flag: '🇫🇷', reads: '290k', latLon: [48.86, 2.35], size: 0.05, color: '#a855f7' },
  { name: 'Berlin', country: 'Almanya', flag: '🇩🇪', reads: '210k', latLon: [52.52, 13.41], size: 0.04, color: '#6366f1' },
  { name: 'Madrid', country: 'İspanya', flag: '🇪🇸', reads: '165k', latLon: [40.42, -3.70], size: 0.03, color: '#ef4444' },
  { name: 'New York', country: 'ABD', flag: '🇺🇸', reads: '680k', latLon: [40.71, -74.01], size: 0.06, color: '#3b82f6' },
  { name: 'Los Angeles', country: 'ABD', flag: '🇺🇸', reads: '490k', latLon: [34.05, -118.24], size: 0.05, color: '#3b82f6' },
  { name: 'Chicago', country: 'ABD', flag: '🇺🇸', reads: '210k', latLon: [41.88, -87.63], size: 0.04, color: '#3b82f6' },
  { name: 'Toronto', country: 'Kanada', flag: '🇨🇦', reads: '175k', latLon: [43.65, -79.38], size: 0.03, color: '#ef4444' },
  { name: 'São Paulo', country: 'Brezilya', flag: '🇧🇷', reads: '360k', latLon: [-23.55, -46.63], size: 0.05, color: '#10b981' },
  { name: 'Mexico City', country: 'Meksika', flag: '🇲🇽', reads: '245k', latLon: [19.43, -99.13], size: 0.04, color: '#f59e0b' },
  { name: 'Buenos Aires', country: 'Arjantin', flag: '🇦🇷', reads: '145k', latLon: [-34.60, -58.38], size: 0.03, color: '#6366f1' },
  { name: 'Sydney', country: 'Avustralya', flag: '🇦🇺', reads: '165k', latLon: [-33.87, 151.21], size: 0.04, color: '#fbbf24' },
  { name: 'Lagos', country: 'Nijerya', flag: '🇳🇬', reads: '75k', latLon: [6.52, 3.38], size: 0.03, color: '#10b981' },
  { name: 'Moskova', country: 'Rusya', flag: '🇷🇺', reads: '75k', latLon: [55.76, 37.62], size: 0.03, color: '#6366f1' },
];

// ── Shimmer Skeleton ──
function GlobeSkeleton() {
  return (
    <div className="w-full max-w-[520px] mx-auto aspect-square relative flex items-center justify-center">
      <div className="w-full h-full rounded-full relative overflow-hidden"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(5,5,7,0.9) 70%)' }}>
        <div className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.15) 25%, transparent 50%)',
            animation: 'spin 2s linear infinite',
          }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-purple-500/40 text-4xl animate-pulse">🌍</div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── 3D Cobe Globe ──
function NexusGlobe3D({ nodes }) {
  const canvasRef = useRef(null);
  const phiRef = useRef(0.5);
  const pointerRef = useRef({ down: false, x: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // GPU Hızlandırma
    canvas.style.willChange = 'transform';
    canvas.style.transform = 'translate3d(0,0,0)';

    const size = Math.min(canvas.offsetWidth, 520);

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: size * 2,
      height: size * 2,
      phi: 0.5,
      theta: 0.2,
      dark: 1,
      diffuse: 2.5,
      mapSamples: 16000,
      mapBrightness: 12,         // ← Yüksek: kara parçaları belirgin
      baseColor: [0.25, 0.12, 0.45],  // ← Daha açık mor: kıtalar görünür
      markerColor: [0.15, 0.95, 0.80],
      glowColor: [0.6, 0.25, 1.0],
      markers: nodes.map(n => ({ location: n.latLon, size: n.size })),
      onRender: (state) => {
        if (!pointerRef.current.down) phiRef.current += 0.004;
        state.phi = phiRef.current;
      },
    });

    setReady(true);

    const onDown = (e) => {
      pointerRef.current.down = true;
      pointerRef.current.x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    };
    const onMove = (e) => {
      if (!pointerRef.current.down) return;
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      phiRef.current += (cx - pointerRef.current.x) * 0.006;
      pointerRef.current.x = cx;
    };
    const onUp = () => { pointerRef.current.down = false; };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    canvas.addEventListener('touchmove', onMove, { passive: true });
    canvas.addEventListener('touchend', onUp);

    return () => {
      globe.destroy();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [nodes]);

  return (
    <div className="w-full max-w-[520px] mx-auto aspect-square relative">
      {!ready && <div className="absolute inset-0"><GlobeSkeleton /></div>}
      <canvas
        ref={canvasRef}
        aria-label="AniPeak Dünya Okuyucu Haritası"
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          touchAction: 'none',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.6s ease',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
      />
      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-full"
        style={{ background: 'radial-gradient(circle at 50% 50%, transparent 42%, rgba(5,5,7,0.98) 68%)' }} />
      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 font-bold uppercase tracking-widest select-none">
        Sürükle • Döndür
      </p>
    </div>
  );
}

// ── 2D Dünya Haritası ──
function NexusMap2D({ nodes }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  return (
    <div ref={containerRef}
      className="w-full max-w-[900px] mx-auto relative rounded-3xl overflow-hidden border border-white/5 shadow-[0_0_60px_rgba(168,85,247,0.08)]"
      style={{ aspectRatio: '2/1', background: '#060610', willChange: 'transform', transform: 'translate3d(0,0,0)' }}>

      {/* Doğal Dünya Haritası SVG Görseli */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/8/8f/Whole_world_-_land_and_oceans_12000.jpg"
        alt="Dünya haritası"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.12, filter: 'saturate(0) brightness(3) hue-rotate(240deg)' }}
        loading="lazy"
      />

      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 200 100" preserveAspectRatio="none">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 10} x2="200" y2={i * 10} stroke="#a855f7" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="#a855f7" strokeWidth="0.5" />
        ))}
        <line x1="0" y1="50" x2="200" y2="50" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* Okuyucu Noktaları */}
      {nodes.map((node, idx) => {
        const top = `${(90 - node.latLon[0]) / 180 * 100}%`;
        const left = `${(180 + node.latLon[1]) / 360 * 100}%`;
        return (
          <motion.div
            key={idx}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.025, type: 'spring', stiffness: 300 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{ top, left, willChange: 'transform', transform: 'translate3d(-50%,-50%,0)' }}
            onMouseEnter={() => setTooltip(node)}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="relative">
              <div className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: node.color,
                  boxShadow: `0 0 8px ${node.color}, 0 0 16px ${node.color}40`,
                  willChange: 'transform',
                }} />
              <div className="absolute inset-0 rounded-full animate-ping opacity-50"
                style={{ backgroundColor: node.color }} />
            </div>
          </motion.div>
        );
      })}

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-3 rounded-2xl pointer-events-none border border-white/10 shadow-2xl"
            style={{ background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(12px)' }}
          >
            <span className="text-2xl">{tooltip.flag}</span>
            <div>
              <p className="text-white font-black text-sm leading-none">{tooltip.name}</p>
              <p className="text-slate-500 text-xs">{tooltip.country}</p>
            </div>
            <div className="ml-2 pl-3 border-l border-white/10">
              <p className="font-black text-sm" style={{ color: tooltip.color }}>{tooltip.reads}</p>
              <p className="text-slate-600 text-[10px]">okuma</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Lazy Scroll Observer Hook ──
function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

// ── Ana Bileşen ──
export default function GlobalNexus() {
  const [mode, setMode] = useState('3D');
  const [liveCount, setLiveCount] = useState(8247);
  const mapRef = useRef(null);
  const mapInView = useInView(mapRef);

  useEffect(() => {
    const t = setInterval(() => setLiveCount(n => n + Math.floor(Math.random() * 5) - 1), 2000);
    return () => clearInterval(t);
  }, []);

  const topNodes = [...WORLD_NODES].sort((a, b) => {
    const parse = s => parseFloat(s.replace('M', '000').replace('k', ''));
    return parse(b.reads) - parse(a.reads);
  }).slice(0, 10);

  return (
    <div className="min-h-screen pt-20 bg-[#050507] text-white">
      {/* GPU Hızlandırmalı Arka Plan */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true"
        style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-900/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-900/8 rounded-full blur-[120px]" />
      </div>

      {/* Başlık — Critical Path: anında yüklensin */}
      <header className="relative z-10 px-4 sm:px-8 pt-4 pb-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400">
                Global Nexus
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" aria-hidden="true" />
              {liveCount.toLocaleString('tr-TR')} aktif okuyucu çevrimiçi
            </p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10" role="group" aria-label="Harita modu seçimi">
            {[
              { id: '3D', icon: Globe2, label: '3D Küre', activeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
              { id: '2D', icon: Map, label: '2D Harita', activeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' },
            ].map(({ id, icon: Icon, label, activeClass }) => (
              <button key={id} onClick={() => setMode(id)} aria-pressed={mode === id}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${mode === id ? activeClass : 'text-slate-400 hover:text-white'}`}>
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* İçerik */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col lg:flex-row gap-8">

        {/* Sol Panel */}
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="glass-strong border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                <TrendingUp size={22} className="text-purple-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Toplam Okuma</p>
                <p className="text-3xl font-black text-white">18.4M</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-slate-500 text-[9px] uppercase font-bold mb-1 flex items-center gap-1">
                  <Globe2 size={10} aria-hidden="true" className="text-cyan-400" /> Aktif Ülke
                </p>
                <p className="text-xl font-black text-cyan-300">{WORLD_NODES.length}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-slate-500 text-[9px] uppercase font-bold mb-1 flex items-center gap-1">
                  <Zap size={10} aria-hidden="true" className="text-emerald-400" /> Canlı
                </p>
                <p className="text-xl font-black text-emerald-300">{Math.floor(liveCount / 1000)}k</p>
              </div>
            </div>
          </div>

          <div className="glass-strong border border-white/10 rounded-3xl p-5 shadow-2xl flex-1">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={15} className="text-purple-400" aria-hidden="true" />
              En Aktif Lokasyonlar
            </h2>
            <ol className="flex flex-col gap-1" aria-label="En aktif okuyucu şehirleri">
              {topNodes.map((node, idx) => (
                <li key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black w-4 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-slate-600'}`}>{idx + 1}</span>
                    <span className="text-base">{node.flag}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-white leading-none">{node.name}</p>
                      <p className="text-[9px] text-slate-600">{node.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono" style={{ color: node.color }}>{node.reads}</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: node.color, boxShadow: `0 0 6px ${node.color}` }} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Harita Alanı — Intersection Observer ile Lazy Load */}
        <div ref={mapRef} className="flex-1 flex items-center justify-center min-h-[450px] relative">
          <AnimatePresence mode="wait">
            {mode === '3D' ? (
              <motion.div key="3d"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.45 }}
                className="w-full flex items-center justify-center"
                style={{ willChange: 'opacity, transform' }}>
                {mapInView ? <NexusGlobe3D nodes={WORLD_NODES} /> : <GlobeSkeleton />}
              </motion.div>
            ) : (
              <motion.div key="2d"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.45 }}
                className="w-full"
                style={{ willChange: 'opacity, transform' }}>
                {mapInView ? <NexusMap2D nodes={WORLD_NODES} /> : (
                  <div className="w-full rounded-3xl border border-white/5 animate-pulse"
                    style={{ aspectRatio: '2/1', background: 'linear-gradient(135deg, rgba(168,85,247,0.05), rgba(6,182,212,0.05))' }} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
