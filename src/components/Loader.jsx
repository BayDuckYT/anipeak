import { motion } from 'framer-motion';

export default function Loader({ text = "Sayfa Yükleniyor...", fullScreen = true }) {
  const content = (
    <div className="relative flex flex-col items-center justify-center select-none py-12 px-6">
      {/* Background Cinematic Radial Aura */}
      <div className="absolute w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full bg-gradient-to-tr from-red-600/30 via-violet-600/35 to-fuchsia-600/25 blur-[120px] pointer-events-none animate-pulse" />
      
      {/* Watermarked Kanji in Background */}
      <div className="absolute font-black text-8xl sm:text-[13rem] text-white/[0.035] tracking-widest pointer-events-none select-none font-serif">
        頂点
      </div>

      {/* Center Logo with Breathing Pulse & Light Sweep Effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative group">
          {/* Logo Glow Ring */}
          <div className="absolute -inset-6 bg-gradient-to-r from-red-600/35 via-violet-600/45 to-fuchsia-600/35 rounded-3xl blur-3xl opacity-80 animate-pulse" />
          
          {/* Large & Imposing Logo Image */}
          <div className="relative overflow-hidden rounded-2xl p-3">
            <img
              src="https://wsrv.nl/?url=https://mahorapeak.com.tr/mahorapeaklogov2.png&w=600&output=webp&q=95"
              alt="MahoraPeak"
              width="360"
              height="180"
              className="h-28 sm:h-36 md:h-44 w-auto object-contain drop-shadow-[0_0_35px_rgba(239,68,68,0.7)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('loader-text-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />

            {/* Fallback Text Logo */}
            <div id="loader-text-fallback" className="hidden items-center gap-1.5 font-black text-4xl sm:text-6xl tracking-wider text-white">
              <span>MAHORA</span>
              <span className="text-red-500">/PEAK</span>
            </div>

            {/* Traveling Laser Sheen across logo */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12 pointer-events-none"
            />
          </div>
        </div>

        {/* Sleek Laser Line Divider with Scanning Light Point */}
        <div className="relative mt-6 w-64 sm:w-96 md:w-[440px] h-[2.5px] bg-white/10 rounded-full overflow-hidden">
          {/* Base gradient bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          
          {/* Scanning Laser Beam */}
          <motion.div
            animate={{ x: [-200, 400] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white to-transparent"
          />
        </div>

        {/* Cinematic Subtitle Typography */}
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <motion.p
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-xs sm:text-sm font-black uppercase tracking-[0.38em] text-slate-200 text-center drop-shadow-md"
          >
            {text}
          </motion.p>
          <span className="text-[10px] sm:text-[11px] tracking-[0.45em] font-bold text-red-400/90 uppercase">
            MahoraPeak • Anime &amp; Manhwa
          </span>
        </div>
      </motion.div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="relative min-h-[55vh] w-full flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#06040e]/95 backdrop-blur-2xl flex items-center justify-center">
      {content}
    </div>
  );
}
