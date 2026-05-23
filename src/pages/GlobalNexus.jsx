import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2, Map, Activity, Zap, TrendingUp, Users } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const WORLD_NODES = [
  { name: 'Tokyo', country: 'Japonya', flag: '🇯🇵', reads: '1.2M', latLon: [35.68, 139.69], size: 0.08, color: '#10b981' },
  { name: 'Seoul', country: 'G.Kore', flag: '🇰🇷', reads: '890k', latLon: [37.57, 126.98], size: 0.07, color: '#6366f1' },
  { name: 'Mumbai', country: 'Hindistan', flag: '🇮🇳', reads: '750k', latLon: [19.08, 72.88], size: 0.07, color: '#f59e0b' },
  { name: 'Manila', country: 'Filipinler', flag: '🇵🇭', reads: '620k', latLon: [14.60, 120.98], size: 0.06, color: '#ec4899' },
  { name: 'Jakarta', country: 'Endonezya', flag: '🇮🇩', reads: '540k', latLon: [-6.21, 106.85], size: 0.06, color: '#ef4444' },
  { name: 'Bangkok', country: 'Tayland', flag: '🇹🇭', reads: '310k', latLon: [13.76, 100.50], size: 0.05, color: '#8b5cf6' },
  { name: 'Ho Chi Minh', country: 'Vietnam', flag: '🇻🇳', reads: '280k', latLon: [10.82, 106.63], size: 0.05, color: '#f97316' },
  { name: 'Kuala Lumpur', country: 'Malezya', flag: '🇲🇾', reads: '195k', latLon: [3.14, 101.69], size: 0.04, color: '#06b6d4' },
  { name: 'Taipei', country: 'Tayvan', flag: '🇹🇼', reads: '180k', latLon: [25.03, 121.57], size: 0.04, color: '#10b981' },
  { name: 'Beijing', country: 'Çin', flag: '🇨🇳', reads: '120k', latLon: [39.90, 116.41], size: 0.04, color: '#ef4444' },
  { name: 'Singapur', country: 'Singapur', flag: '🇸🇬', reads: '98k', latLon: [1.35, 103.82], size: 0.03, color: '#f59e0b' },
  { name: 'İstanbul', country: 'Türkiye', flag: '🇹🇷', reads: '420k', latLon: [41.01, 28.98], size: 0.06, color: '#0ea5e9' },
  { name: 'Ankara', country: 'Türkiye', flag: '🇹🇷', reads: '120k', latLon: [39.93, 32.86], size: 0.04, color: '#0ea5e9' },
  { name: 'London', country: 'İngiltere', flag: '🇬🇧', reads: '380k', latLon: [51.51, -0.13], size: 0.06, color: '#3b82f6' },
  { name: 'Paris', country: 'Fransa', flag: '🇫🇷', reads: '290k', latLon: [48.86, 2.35], size: 0.05, color: '#a855f7' },
  { name: 'Berlin', country: 'Almanya', flag: '🇩🇪', reads: '210k', latLon: [52.52, 13.41], size: 0.05, color: '#6366f1' },
  { name: 'Madrid', country: 'İspanya', flag: '🇪🇸', reads: '165k', latLon: [40.42, -3.70], size: 0.04, color: '#ef4444' },
  { name: 'New York', country: 'ABD', flag: '🇺🇸', reads: '680k', latLon: [40.71, -74.01], size: 0.07, color: '#3b82f6' },
  { name: 'Los Angeles', country: 'ABD', flag: '🇺🇸', reads: '490k', latLon: [34.05, -118.24], size: 0.06, color: '#3b82f6' },
  { name: 'Chicago', country: 'ABD', flag: '🇺🇸', reads: '210k', latLon: [41.88, -87.63], size: 0.05, color: '#3b82f6' },
  { name: 'Toronto', country: 'Kanada', flag: '🇨🇦', reads: '175k', latLon: [43.65, -79.38], size: 0.04, color: '#ef4444' },
  { name: 'São Paulo', country: 'Brezilya', flag: '🇧🇷', reads: '360k', latLon: [-23.55, -46.63], size: 0.06, color: '#10b981' },
  { name: 'Mexico City', country: 'Meksika', flag: '🇲🇽', reads: '245k', latLon: [19.43, -99.13], size: 0.05, color: '#f59e0b' },
  { name: 'Buenos Aires', country: 'Arjantin', flag: '🇦🇷', reads: '145k', latLon: [-34.60, -58.38], size: 0.04, color: '#6366f1' },
  { name: 'Sydney', country: 'Avustralya', flag: '🇦🇺', reads: '165k', latLon: [-33.87, 151.21], size: 0.04, color: '#fbbf24' },
];

// ── Shimmer Skeleton (Performans için optimize) ──
function GlobeSkeleton() {
  return (
    <div className="w-full max-w-[520px] mx-auto aspect-square relative flex items-center justify-center">
      <div className="w-full h-full rounded-full relative overflow-hidden"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(5,5,7,0.9) 70%)' }}>
        <div className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.2) 25%, transparent 50%)',
            animation: 'spin 2s linear infinite',
          }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe2 size={48} className="text-purple-500/30 animate-pulse" />
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── 3D Cobe Globe (Lighthouse dostu) ──
function NexusGlobe3D({ nodes }) {
  const canvasRef = useRef(null);
  const phiRef = useRef(0);
  const pointerRef = useRef({ down: false, x: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let current = canvasRef.current;
    if (!current) return;
    let globe;
    let destroyed = false;

    current.style.willChange = 'transform';
    const size = Math.min(current.offsetWidth, 520);
    const pixelRatio = 1; // Lighthouse mobile optimizasyonu: her zaman 1

    // Dynamic import — cobe sadece bu sayfa açıldığında yüklenir
    import('cobe').then(({ default: createGlobe }) => {
      if (destroyed) return;
      globe = createGlobe(current, {
        devicePixelRatio: pixelRatio,
        width: size * pixelRatio,
        height: size * pixelRatio,
        phi: 0,
        theta: 0.3,
        dark: 1,
        diffuse: 2.0,
        mapSamples: 4000,
        mapBrightness: 8,
      baseColor: [0.1, 0.05, 0.2], 
      markerColor: [0.1, 0.9, 0.7],
      glowColor: [0.5, 0.2, 0.8],
      markers: nodes.map(n => ({ location: n.latLon, size: n.size * 0.8 })),
      onRender: (state) => {
        if (!pointerRef.current.down) phiRef.current += 0.003;
        state.phi = phiRef.current;
      },
    });
      setReady(true);
    });

    const onDown = (e) => {
      pointerRef.current.down = true;
      pointerRef.current.x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    };
    const onMove = (e) => {
      if (!pointerRef.current.down) return;
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      phiRef.current += (cx - pointerRef.current.x) * 0.005;
      pointerRef.current.x = cx;
    };
    const onUp = () => { pointerRef.current.down = false; };

    current.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    current.addEventListener('touchstart', onDown, { passive: true });
    current.addEventListener('touchmove', onMove, { passive: true });
    current.addEventListener('touchend', onUp, { passive: true });

    return () => {
      destroyed = true;
      if (globe) globe.destroy();
      current.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [nodes]);

  return (
    <div className="w-full max-w-[520px] mx-auto aspect-square relative drop-shadow-[0_0_40px_rgba(168,85,247,0.15)]">
      {!ready && <div className="absolute inset-0 z-0"><GlobeSkeleton /></div>}
      <canvas
        ref={canvasRef}
        aria-label="AniPeak 3D Okuyucu Haritası"
        className="w-full h-full cursor-grab active:cursor-grabbing relative z-10"
        style={{
          touchAction: 'none',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      />
    </div>
  );
}

// ── 2D Dünya Haritası (Dev Görsel Yerine SVG Harita) ──
function NexusMap2D({ nodes }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="w-full max-w-[900px] mx-auto relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(6,182,212,0.1)] bg-[#080812]"
      style={{ aspectRatio: '2/1' }}>
      
      {/* Lighthouse Fix: 12000px dev JPG yerine, optimize edilmiş düşük boyutlu Vektör SVG kullanıldı */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg"
        alt="Dünya haritası"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ opacity: 0.15, filter: 'invert(1) sepia(1) hue-rotate(240deg) saturate(3)' }}
        loading="lazy"
        decoding="async"
        width={900}
        height={450}
      />

      {/* Modern Grid Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 200 100" preserveAspectRatio="none">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 10} x2="200" y2={i * 10} stroke="#0ea5e9" strokeWidth="0.2" />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="#0ea5e9" strokeWidth="0.2" />
        ))}
      </svg>

      {/* Okuyucu Noktaları */}
      {nodes.map((node, idx) => {
        // SVG haritaya göre lat/lon hizalaması
        const top = `${(90 - node.latLon[0]) / 180 * 100}%`;
        const left = `${(180 + node.latLon[1]) / 360 * 100}%`;
        
        return (
          <motion.div
            key={idx}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.02, type: 'spring' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
            style={{ top, left }}
            onMouseEnter={() => setTooltip(node)}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full z-10 relative transition-transform duration-300 group-hover:scale-150"
                style={{
                  backgroundColor: node.color,
                  boxShadow: `0 0 10px ${node.color}, 0 0 20px ${node.color}60`,
                }} />
              <div className="absolute inset-0 -m-1 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: node.color }} />
            </div>
          </motion.div>
        );
      })}

      {/* Premium Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-5 py-3 rounded-2xl pointer-events-none border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
            style={{ background: 'linear-gradient(145deg, rgba(15,15,25,0.95), rgba(5,5,10,0.98))', backdropFilter: 'blur(16px)' }}
          >
            <span className="text-3xl drop-shadow-md">{tooltip.flag}</span>
            <div className="flex flex-col">
              <p className="text-white font-black text-base tracking-tight">{tooltip.name}</p>
              <p className="text-slate-400 text-xs font-medium">{tooltip.country}</p>
            </div>
            <div className="ml-2 pl-4 border-l border-white/10 flex flex-col justify-center">
              <p className="font-black text-lg leading-none" style={{ color: tooltip.color }}>{tooltip.reads}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1">Okuma</p>
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
    }, { threshold: 0.05 }); // Daha erken yükleme için threshold düşürüldü
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

  useSEO({
    title: 'Global Nexus',
    description: 'AniPeak Global Nexus - Dünya genelinde manhwa okuma istatistikleri ve interaktif harita.',
    url: 'https://anipeak.com.tr/global-nexus'
  });

  // Canlı okuyucu simülasyonu
  useEffect(() => {
    const t = setInterval(() => setLiveCount(n => n + Math.floor(Math.random() * 7) - 2), 2500);
    return () => clearInterval(t);
  }, []);

  const topNodes = [...WORLD_NODES].sort((a, b) => {
    const parse = s => parseFloat(s.replace('M', '000').replace('k', ''));
    return parse(b.reads) - parse(a.reads);
  }).slice(0, 8);

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#030305] text-white selection:bg-purple-500/30 overflow-hidden relative">
      {/* Performans Dostu Arka Plan (Gölge Dom'u yormayan bulanıklık) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-cyan-900/10 blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 relative z-10">
        {/* Modern Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SİSTEM AKTİF
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500">
                Global Nexus
              </span>
            </h1>
            <p className="text-slate-400 max-w-lg text-sm sm:text-base font-medium">
              AniPeak okuyucularının dünya çapındaki anlık dağılımı ve platform metrikleri.
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            {[
              { id: '3D', icon: Globe2, label: '3D Küre', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
              { id: '2D', icon: Map, label: '2D Harita', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]' },
            ].map(({ id, icon: Icon, label, glow }) => (
              <button key={id} onClick={() => setMode(id)} aria-label={`${label} görünümüne geç`}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${mode === id ? `bg-white/10 text-white ${glow}` : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </header>

        {/* Ana İçerik Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sol Panel: Metrikler */}
          <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            
            {/* Canlı Sayaç Kartı */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <TrendingUp size={24} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Toplam Okuma</p>
                  <p className="text-3xl font-black text-white tracking-tight">18.4M</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                  <p className="text-slate-500 text-[10px] uppercase font-bold mb-2 flex items-center gap-1.5">
                    <Globe2 size={12} className="text-cyan-400" /> Ülkeler
                  </p>
                  <p className="text-2xl font-black text-cyan-400">{WORLD_NODES.length}</p>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                  <p className="text-slate-500 text-[10px] uppercase font-bold mb-2 flex items-center gap-1.5">
                    <Users size={12} className="text-emerald-400" /> Çevrimiçi
                  </p>
                  <p className="text-2xl font-black text-emerald-400">{liveCount.toLocaleString('tr-TR')}</p>
                </div>
              </div>
            </motion.div>

            {/* Sıralama Listesi */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex-1 p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <h2 className="text-sm font-black text-white mb-5 flex items-center gap-2 uppercase tracking-wide">
                <Activity size={16} className="text-purple-400" />
                Top Lokasyonlar
              </h2>
              <ol className="flex flex-col gap-2">
                {topNodes.map((node, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 text-center text-sm font-black ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-slate-400'}`}>
                        #{idx + 1}
                      </div>
                      <span className="text-xl filter drop-shadow-md">{node.flag}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{node.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{node.country}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black tracking-tight" style={{ color: node.color }}>{node.reads}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>
          </aside>

          {/* Sağ Panel: Harita Render Alanı */}
          <div ref={mapRef} className="lg:col-span-8 xl:col-span-9 flex items-center justify-center min-h-[500px] lg:min-h-[600px] relative p-4 lg:p-8 rounded-3xl bg-black/20 border border-white/5">
            <AnimatePresence mode="wait">
              {mode === '3D' ? (
                <motion.div key="3d"
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full flex items-center justify-center">
                  {mapInView ? <NexusGlobe3D nodes={WORLD_NODES} /> : <GlobeSkeleton />}
                </motion.div>
              ) : (
                <motion.div key="2d"
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full">
                  {mapInView ? <NexusMap2D nodes={WORLD_NODES} /> : (
                    <div className="w-full rounded-3xl border border-white/5 animate-pulse bg-white/5" style={{ aspectRatio: '2/1' }} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </main>
      </div>
    </div>
  );
}

