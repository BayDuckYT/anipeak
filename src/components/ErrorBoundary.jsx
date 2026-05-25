import React from 'react';
import { ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';
import { getErrorCode, ERROR_DICTIONARY } from '../utils/errorDictionary.js';
import { supabase } from '../lib/supabaseClient';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorCode: "500", fullCode: null };
  }

  static getDerivedStateFromError(error) {
    const errorCode = getErrorCode(error?.message || error?.toString());
    return { hasError: true, error, errorCode, fullCode: errorCode };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Hata Yakalandı:", error, errorInfo);
    
    // Benzersiz hata ID'si oluştur (Örn: 500-A7B2)
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const fullCode = `${this.state.errorCode}-${uniqueId}`;
    this.setState({ fullCode });

    // Hatayı Supabase'e logla (İletişim mesajları tablosunu gizli log tablosu olarak kullanıyoruz)
    supabase.from('contact_messages').insert({
      name: fullCode,
      email: 'system@anipeak.com',
      subject: 'SYSTEM_ERROR_LOG',
      message: `Error: ${error?.message || 'Bilinmeyen'}\n\nStack:\n${error?.stack || 'Yok'}\n\nComponent Trace:\n${errorInfo?.componentStack || 'Yok'}`
    }).then(() => console.log("[SYSTEM] Hata loglandı:", fullCode)).catch(e => console.error("Log hatası:", e));

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
               <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 rounded-xl text-center">
                  <span className="block text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-1">HATA KODU</span>
                  <span className="block text-xl font-black text-white tracking-wider">{this.state.fullCode}</span>
               </div>
               <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-red-500/30"
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
                    HATA KODU: {this.state.fullCode}
                  </span>
                  <span className="text-sm text-red-400 font-bold">{ERROR_DICTIONARY[this.state.errorCode]?.name}</span>
               </div>
               <p className="text-red-200/90 text-xs leading-relaxed mb-4">
                 {ERROR_DICTIONARY[this.state.errorCode]?.description}
               </p>
               <div className="bg-black/50 rounded-xl p-3 border border-red-500/10 mb-4">
                 <span className="block text-[10px] text-red-500/60 font-bold mb-1">ÇÖZÜM ÖNERİSİ:</span>
                 <p className="text-red-300/80 text-xs">{ERROR_DICTIONARY[this.state.errorCode]?.solution}</p>
               </div>
               <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                 <span className="flex items-center gap-2 text-[10px] text-amber-500 font-bold mb-1">
                   <AlertTriangle size={12} /> GELİŞTİRİCİ İÇİN BİLGİ:
                 </span>
                 <p className="text-amber-400/80 text-xs">
                   Bu kodu admin paneline girerek hatanın kodun hangi satırında ve dosyasında meydana geldiğini tam olarak görebilirsiniz.
                 </p>
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
