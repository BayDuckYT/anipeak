import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-white/5 py-16 px-4 bg-black/20 backdrop-blur-2xl relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link to="/" className="gradient-text font-black text-3xl tracking-tighter drop-shadow-md">MahoraPeak</Link>
          <p className="text-slate-300 text-sm max-w-xs text-center md:text-left leading-relaxed font-medium">
            Türkiye'nin en gelişmiş elit manga platformu. Kaliteli çeviri, hızlı okuma ve premium topluluk deneyimi.
          </p>
          <p className="text-slate-300 text-[11px] max-w-xs text-center md:text-left leading-relaxed mt-2 italic">
            Bu sitede fan yapımı çeviriler yer almaktadır. Orijinal sürüm için, lütfen ülkenizde mevcutsa çizgi romanı satın alın.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 text-sm">
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Platform</h2>
            <Link to="/all-series" className="text-slate-300 hover:text-purple-300 transition-colors font-medium py-1" aria-label="Tüm manga serilerini görüntüle">Tüm Seriler</Link>
            <Link to="/#trendler" className="text-slate-300 hover:text-purple-300 transition-colors font-medium py-1" aria-label="Trend mangaları görüntüle">Trendler</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Kurumsal</h2>
            <Link to="/gizlilik" className="text-slate-300 hover:text-purple-300 transition-colors font-medium">Gizlilik Politikası</Link>
            <Link to="/sartlar" className="text-slate-300 hover:text-purple-300 transition-colors font-medium">Kullanım Şartları</Link>
            <Link to="/iletisim" className="text-slate-300 hover:text-purple-300 transition-colors font-medium">İletişim</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Topluluk</h2>
            <a href="https://discord.gg/mahorapeak" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-blue-400 transition-colors font-medium py-1" aria-label="MahoraPeak Discord sunucusuna katıl">Discord</a>
            <a href="https://www.instagram.com/mahorapeakoffical/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-pink-400 transition-colors font-medium py-1" aria-label="MahoraPeak Instagram sayfasını ziyaret et">Instagram</a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        <span>© 2026 MahoraPeak Tüm hakları saklıdır.</span>
      </div>
    </footer>
  );
}
