import { Link } from 'react-router-dom';
import { Heart, Instagram, ArrowRight } from 'lucide-react';

function DiscordIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const linkCls = 'text-slate-400 hover:text-violet-300 transition-colors text-sm';

export default function Footer() {
  return (
    <footer role="contentinfo" className="relative z-10 border-t border-white/[0.06] bg-[#06040E]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.6fr] gap-8 md:gap-10">
          {/* Marka */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <Link to="/" aria-label="Ana Sayfa" className="w-fit">
              <img
                src="https://wsrv.nl/?url=https://mahorapeak.com.tr/mahorapeaklogov2.png&w=450&output=webp&q=95"
                alt="MahoraPeak"
                width="220"
                height="90"
                loading="lazy"
                className="h-20 sm:h-24 w-auto object-contain scale-110 sm:scale-120 origin-left drop-shadow-[0_0_20px_rgba(168,85,247,0.55)]"
              />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Manga, manhwa ve daha fazlası. Kaliteli çeviri, hızlı okuma ve premium topluluk deneyimi.
            </p>
          </div>

          {/* Hızlı Erişim */}
          <nav aria-label="Hızlı erişim" className="flex flex-col gap-2.5">
            <h2 className="text-white font-bold text-sm mb-1">Hızlı Erişim</h2>
            <Link to="/all-series" className={linkCls}>Keşfet</Link>
            <Link to="/#trendler" className={linkCls}>Trendler</Link>
            <Link to="/rehber" className={`${linkCls} text-emerald-300 font-semibold`}>Rehber &amp; XP</Link>
            <Link to="/achievements" className={linkCls}>Başarımlar</Link>
            <Link to="/takvim" className={linkCls}>Takvim</Link>
            <Link to="/oracle" className={linkCls}>Oracle</Link>
            <Link to="/elite-upgrade" className={linkCls}>Premium</Link>
            <Link to="/indir" className={`${linkCls} text-violet-300 font-semibold flex items-center gap-1`}>
              <span>Uygulama İndir</span>
              <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1 rounded border border-violet-400/30">APK</span>
            </Link>
          </nav>

          {/* Kurumsal */}
          <nav aria-label="Kurumsal" className="flex flex-col gap-2.5">
            <h2 className="text-white font-bold text-sm mb-1">Kurumsal</h2>
            <Link to="/sartlar" className={linkCls}>Kullanım Şartları</Link>
            <Link to="/gizlilik" className={linkCls}>Gizlilik Politikası</Link>
            <Link to="/oneriler" className={linkCls}>Öneriler</Link>
            <Link to="/iletisim" className={linkCls}>İletişim</Link>
          </nav>

          {/* Topluluk */}
          <div className="flex flex-col gap-2.5">
            <h2 className="text-white font-bold text-sm mb-1">Topluluk</h2>
            <a href="https://discord.gg/mahorapeak" target="_blank" rel="noopener noreferrer" className={`${linkCls} inline-flex items-center gap-2`} aria-label="MahoraPeak Discord sunucusuna katıl">
              <DiscordIcon size={15} /> Discord
            </a>
            <a href="https://www.instagram.com/mahorapeakoffical/" target="_blank" rel="noopener noreferrer" className={`${linkCls} inline-flex items-center gap-2`} aria-label="MahoraPeak Instagram sayfasını ziyaret et">
              <Instagram size={15} /> Instagram
            </a>
          </div>

          {/* Discord CTA */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-white font-bold text-sm mb-1">Topluluğa Katıl</h2>
            <p className="text-slate-400 text-sm mb-4">Yeni bölümlerden ve duyurulardan ilk sen haberdar ol.</p>
            <a
              href="https://discord.gg/mahorapeak"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 w-full rounded-xl border border-violet-500/30 bg-white/[0.03] pl-4 pr-1.5 py-1.5 hover:border-violet-400/60 hover:bg-violet-500/10 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <DiscordIcon size={16} className="text-[#8C9EFF]" /> discord.gg/mahorapeak
              </span>
              <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/40">
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          </div>
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed mt-10 italic max-w-2xl">
          Bu sitede fan yapımı çeviriler yer almaktadır. Orijinal sürüm için, lütfen ülkenizde mevcutsa çizgi romanı satın alın.
        </p>

        <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© 2026 MahoraPeak. Tüm hakları saklıdır.</span>
          <span className="inline-flex items-center gap-1.5">
            <Heart size={12} className="text-fuchsia-500 fill-fuchsia-500" /> Manga &amp; Manhwa tutkunları için
          </span>
        </div>
      </div>
    </footer>
  );
}
