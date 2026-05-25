import React from 'react';
import { ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';
import { getErrorCode, ERROR_DICTIONARY } from '../utils/errorDictionary.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorCode: "500" };
  }

  static getDerivedStateFromError(error) {
    const errorCode = getErrorCode(error?.message || error?.toString());
    return { hasError: true, error, errorCode };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Hata Yakalandı:", error, errorInfo);
    
    // Vite Sürüm Güncelleme (Chunk Missing) Hatası Çözümü
    if (error.message && (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed'))) {
      window.location.reload(true);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.mini) {
        return (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="glass-strong border border-red-500/20 rounded-2xl p-8 max-w-sm shadow-xl">
               <ShieldAlert size={40} className="text-red-500 mx-auto mb-4 opacity-80" />
               <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">BÖLGESEL HATA</h3>
               <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                 Bu içerik yüklenirken bir sorun oluştu. Diğer sayfalar hâlâ çalışır durumda!
               </p>
               
               {/* HATA TEŞHİS */}
               <div className="mb-6 px-4 py-3 bg-red-950/30 border border-red-500/20 rounded-xl text-left overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">HATA KODU: {this.state.errorCode}</span>
                    <span className="text-[10px] text-red-400 font-bold truncate">{ERROR_DICTIONARY[this.state.errorCode]?.name}</span>
                  </div>
                  <p className="text-red-300/80 text-[10px] leading-relaxed mb-2">
                    {ERROR_DICTIONARY[this.state.errorCode]?.description}
                  </p>
                  <p className="text-red-500/50 font-mono text-[9px] break-all border-t border-red-500/10 pt-2">
                    Log: {this.state.error?.message || this.state.error?.toString()}
                  </p>
               </div>
               <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
               >
                 <RotateCcw size={14} /> Ana Sayfaya Dön
               </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#070511] flex items-center justify-center p-6 text-center">
          <div className="glass-strong border border-red-500/20 rounded-3xl p-10 max-w-lg shadow-[0_0_100px_rgba(239,68,68,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-600/10 blur-3xl pointer-events-none" />
            
            <ShieldAlert size={64} className="text-red-500 mx-auto mb-6 opacity-90 animate-pulse" />
            <h1 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Sistem Çökmesi Engellendi</h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Kritik bir veri uyuşmazlığı yakalandı. Endişelenmeyin, Error Boundary sayesinde tüm site çökmedi!
            </p>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 mx-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-bold text-base hover:from-red-500 hover:to-red-700 transition-all shadow-neon-red shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.45)] mb-8"
            >
              <RotateCcw size={18} />
              Ana Sayfaya Dön
            </button>
            
            <div className="text-left bg-red-950/40 border border-red-500/20 rounded-2xl p-5 backdrop-blur-sm">
               <div className="flex items-center gap-3 mb-3 pb-3 border-b border-red-500/20">
                  <span className="px-3 py-1 rounded-lg text-xs font-black bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    HATA KODU: {this.state.errorCode}
                  </span>
                  <span className="text-sm text-red-400 font-bold">{ERROR_DICTIONARY[this.state.errorCode]?.name}</span>
               </div>
               <p className="text-red-200/90 text-xs leading-relaxed mb-4">
                 {ERROR_DICTIONARY[this.state.errorCode]?.description}
               </p>
               <div className="bg-black/50 rounded-xl p-3 border border-red-500/10">
                 <span className="block text-[10px] text-red-500/60 font-bold mb-1">ÇÖZÜM ÖNERİSİ:</span>
                 <p className="text-red-300/80 text-xs">{ERROR_DICTIONARY[this.state.errorCode]?.solution}</p>
               </div>
               <div className="mt-4 pt-4 border-t border-red-500/10">
                 <span className="block text-[10px] text-red-500/60 font-bold mb-1">TEKNİK LOG:</span>
                 <div className="text-[10px] text-red-500/40 font-mono break-all max-h-20 overflow-y-auto">
                   {this.state.error?.message || this.state.error?.toString() || 'Bilinmeyen Hata'}
                 </div>
               </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
