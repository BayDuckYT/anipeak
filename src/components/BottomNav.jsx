import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Library, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function BottomNav({ onAuthOpen }) {
  const location = useLocation();
  const { user } = useAuth();
  
  // Sadece belirli rotalarda bottom nav gösterilsin, Reader sayfasında gizlensin
  if (location.pathname.startsWith('/read/')) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 safe-p-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        
        <Link to="/" className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${location.pathname === '/' ? 'text-purple-400' : 'text-slate-400 hover:text-white'}`}>
          <Home size={20} className={location.pathname === '/' ? 'fill-purple-400/20' : ''} />
          <span className="text-[10px] font-bold">Ana Sayfa</span>
        </Link>
        
        <Link to="/all-series" className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${location.pathname === '/all-series' ? 'text-purple-400' : 'text-slate-400 hover:text-white'}`}>
          <Compass size={20} className={location.pathname === '/all-series' ? 'fill-purple-400/20' : ''} />
          <span className="text-[10px] font-bold">Keşfet</span>
        </Link>

        {/* Ortadaki belirgin buton (Örn: Arama veya Random) */}
        <div className="relative -top-4">
          <Link to="/all-series" className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full text-white shadow-neon-purple active:scale-95 transition-transform border-4 border-[#050507]">
            <Search size={20} />
          </Link>
        </div>

        {user ? (
          <Link to="/profile" className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${location.pathname === '/profile' ? 'text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <Library size={20} className={location.pathname === '/profile' ? 'fill-purple-400/20' : ''} />
            <span className="text-[10px] font-bold">Okuduklarım</span>
          </Link>
        ) : (
          <button onClick={() => onAuthOpen('login')} className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors text-slate-400 hover:text-white">
            <Library size={20} />
            <span className="text-[10px] font-bold">Okuduklarım</span>
          </button>
        )}

        {user ? (
          <Link to={`/profil/${user.username}`} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${location.pathname.startsWith('/profil/') ? 'text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <User size={20} className={location.pathname.startsWith('/profil/') ? 'fill-purple-400/20' : ''} />
            <span className="text-[10px] font-bold">Profil</span>
          </Link>
        ) : (
          <button onClick={() => onAuthOpen('login')} className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors text-slate-400 hover:text-white">
            <User size={20} />
            <span className="text-[10px] font-bold">Giriş Yap</span>
          </button>
        )}

      </div>
    </nav>
  );
}
