import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-4 bg-black/20 backdrop-blur-2xl relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link to="/" className="gradient-text font-black text-3xl tracking-tighter drop-shadow-md">AniPeak</Link>
          <p className="text-slate-300 text-sm max-w-xs text-center md:text-left leading-relaxed font-medium">
            Türkiye'nin en gelişmiş elit manga platformu. Kaliteli çeviri, hızlı okuma ve premium topluluk deneyimi.
          </p>
          <p className="text-slate-400 text-[10px] max-w-xs text-center md:text-left leading-relaxed mt-2 italic">
            Bu sitede fan yapımı çeviriler yer almaktadır. Orijinal sürüm için, lütfen ülkenizde mevcutsa çizgi romanı satın alın.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 text-sm">
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Platform</h4>
            <Link to="/all-series" className="text-slate-300 hover:text-purple-300 transition-colors font-medium py-1" aria-label="Tüm manga serilerini görüntüle">Tüm Seriler</Link>
            <Link to="/#trendler" className="text-slate-300 hover:text-purple-300 transition-colors font-medium py-1" aria-label="Trend mangaları görüntüle">Trendler</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Kurumsal</h4>
            <Link to="/gizlilik" className="text-slate-300 hover:text-purple-300 transition-colors font-medium">Gizlilik Politikası</Link>
            <Link to="/sartlar" className="text-slate-300 hover:text-purple-300 transition-colors font-medium">Kullanım Şartları</Link>
            <Link to="/iletisim" className="text-slate-300 hover:text-purple-300 transition-colors font-medium">İletişim</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Topluluk</h4>
            <a href="https://discord.gg/anipeak" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-blue-400 transition-colors font-medium py-1" aria-label="AniPeak Discord sunucusuna katıl">Discord</a>
            <a href="https://www.instagram.com/anipeakoffical/" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-pink-400 transition-colors font-medium py-1" aria-label="AniPeak Instagram sayfasını ziyaret et">Instagram</a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>© 2026 AniPeak Production. Tüm hakları saklıdır.</span>
        <span className="text-emerald-500/80 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse">
          🛡️ SİBER GÜVENLİK: ANİPEAK İNFİNİTY-GUARD
        </span>
        <span>Altyapı: AniPeak Core v3.0</span>
      </div>
    </footer>
  );
}
