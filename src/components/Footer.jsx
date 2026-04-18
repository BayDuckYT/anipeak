import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-4 bg-[#050507]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link to="/" className="gradient-text font-black text-3xl tracking-tighter">AniPeak</Link>
          <p className="text-slate-500 text-xs max-w-xs text-center md:text-left leading-relaxed">
            Türkiye'nin en gelişmiş siber manga platformu. Kaliteli çeviri, hızlı okuma ve siber topluluk deneyimi.
          </p>
          <p className="text-slate-400/60 text-[10px] max-w-xs text-center md:text-left leading-relaxed mt-2 italic">
            Bu sitede fan yapımı çeviriler yer almaktadır. Orijinal sürüm için, lütfen ülkenizde mevcutsa çizgi romanı satın alın.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 text-sm">
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-black text-xs uppercase tracking-widest">Platform</h4>
            <Link to="/all-series" className="text-slate-500 hover:text-purple-400 transition-colors">Tüm Seriler</Link>
            <Link to="/#trendler" className="text-slate-500 hover:text-purple-400 transition-colors">Trendler</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-black text-xs uppercase tracking-widest">Kurumsal</h4>
            <Link to="/gizlilik" className="text-slate-500 hover:text-purple-400 transition-colors">Gizlilik Politikası</Link>
            <Link to="/sartlar" className="text-slate-500 hover:text-purple-400 transition-colors">Kullanım Şartları</Link>
            <Link to="/iletisim" className="text-slate-500 hover:text-purple-400 transition-colors">İletişim</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-black text-xs uppercase tracking-widest">Topluluk</h4>
            <a href="https://discord.gg/anipeak" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors">Discord</a>
            <a href="https://www.instagram.com/anipeakoffical/" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-pink-400 transition-colors">Instagram</a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        <span>© 2026 AniPeak Production. Tüm hakları saklıdır.</span>
        <span>Siber Güvenlik: morthan-shield v2.0</span>
      </div>
    </footer>
  );
}
