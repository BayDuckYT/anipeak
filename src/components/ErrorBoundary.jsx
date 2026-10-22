import React from 'react';
import { ShieldAlert, RotateCcw, AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import { getErrorCode, ERROR_DICTIONARY } from '../utils/errorDictionary.js';
import { supabase } from '../lib/supabaseClient';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorCode: "500", fullCode: null, retryCount: 0, isOnline: navigator.onLine };
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
    try {
      supabase.from('contact_messages').insert({
        name: fullCode,
        email: 'system@mahorapeak.com',
        subject: 'SYSTEM_ERROR_LOG',
        message: `Error: ${error?.message || 'Bilinmeyen'}\n\nStack:\n${error?.stack || 'Yok'}\n\nComponent Trace:\n${errorInfo?.componentStack || 'Yok'}\n\nUser Agent: ${navigator.userAgent}\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}`
      }).then(() => {}).catch(e => {});
    } catch (e) {}

    // Vite Sürüm Güncelleme (Chunk Missing) Hatası Çözümü
    // Sonsuz döngü koruması: 10sn içinde max 2 reload
    if (error.message && (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed'))) {
      try {
        const RELOAD_KEY = 'mahorapeak_eb_reload';
        const now = Date.now();
        const raw = sessionStorage.getItem(RELOAD_KEY);
        const history = raw ? JSON.parse(raw) : [];
        const recent = history.filter(ts => now - ts < 10000);
        
        if (recent.length < 2) {
          recent.push(now);
          sessionStorage.setItem(RELOAD_KEY, JSON.stringify(recent));
          window.location.reload(true);
          return;
        }
        // Döngü tespit edildi, reload yapma — hata ekranını göster
      } catch (e) {}
    }
  }

  componentDidMount() {
    // Çevrimiçi/çevrimdışı durumunu takip et
    this._handleOnline = () => this.setState({ isOnline: true });
    this._handleOffline = () => this.setState({ isOnline: false });
    window.addEventListener('online', this._handleOnline);
    window.addEventListener('offline', this._handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this._handleOnline);
    window.removeEventListener('offline', this._handleOffline);
  }

  handleRetry = () => {
    this.setState(prev => ({ 
      hasError: false, 
      error: null, 
      errorCode: "500", 
      fullCode: null, 
      retryCount: prev.retryCount + 1 
    }));
  };

  render() {
    if (this.state.hasError) {
      const errorInfo = ERROR_DICTIONARY[this.state.errorCode] || ERROR_DICTIONARY["500"];
      const isNetworkError = this.state.errorCode === "565" || !this.state.isOnline;
      const isChunkError = this.state.errorCode === "405" || this.state.errorCode === "564";

      if (this.props.mini) {
        return (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 sm:px-6 text-center">
            <div className="glass-strong border border-red-500/20 rounded-2xl p-5 sm:p-8 max-w-sm shadow-xl w-full">
               <ShieldAlert size={36} className="text-red-500 mx-auto mb-3 sm:mb-4 opacity-80" />
               <h3 className="text-base sm:text-lg font-black text-white mb-2 uppercase tracking-tight">BÖLGESEL HATA</h3>
               <p className="text-slate-400 text-[11px] sm:text-xs mb-4 sm:mb-6 leading-relaxed">
                 Bu içerik yüklenirken bir sorun oluştu. Diğer sayfalar hâlâ çalışır durumda!
               </p>
               
               {/* HATA TEŞHİS */}
               <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-950/30 border border-red-500/20 rounded-xl text-center">
                  <span className="block text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-1">HATA KODU</span>
                  <span className="block text-lg sm:text-xl font-black text-white tracking-wider">{this.state.fullCode}</span>
               </div>

               {/* Akıllı Çözüm Önerisi */}
               {isNetworkError && (
                 <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                   <WifiOff size={14} className="text-amber-400 flex-shrink-0" />
                   <p className="text-amber-400/80 text-[11px] text-left">İnternet bağlantınızı kontrol edin ve tekrar deneyin.</p>
                 </div>
               )}
               {isChunkError && (
                 <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
                   <RefreshCw size={14} className="text-blue-400 flex-shrink-0" />
                   <p className="text-blue-400/80 text-[11px] text-left">Site güncellenmiş olabilir. Sayfayı yenilemek sorunu çözecektir.</p>
                 </div>
               )}

               <div className="flex flex-col gap-2">
                 <button 
                    onClick={this.handleRetry}
                    className="w-full py-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-purple-500/30 min-h-[44px]"
                 >
                   <RefreshCw size={14} /> Tekrar Dene
                 </button>
                 <button 
                    onClick={() => window.location.href = '/'}
                    className="w-full py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-red-500/30 min-h-[44px]"
                 >
                   <Home size={14} /> Ana Sayfaya Dön
                 </button>
               </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#070511] flex items-center justify-center p-4 sm:p-6 text-center">
          <div className="glass-strong border border-red-500/20 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-[0_0_100px_rgba(239,68,68,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-600/10 blur-3xl pointer-events-none" />
            
            <ShieldAlert size={48} className="text-red-500 mx-auto mb-4 sm:mb-6 opacity-90 animate-pulse sm:w-16 sm:h-16" />
            <h1 className="text-xl sm:text-3xl font-black text-white mb-3 sm:mb-4 tracking-tight uppercase">Sistem Çökmesi Engellendi</h1>
            <p className="text-slate-400 text-sm sm:text-lg mb-6 sm:mb-8 leading-relaxed">
              Kritik bir veri uyuşmazlığı yakalandı. Endişelenmeyin, Error Boundary sayesinde tüm site çökmedi!
            </p>

            {/* Çevrimdışı Uyarısı */}
            {!this.state.isOnline && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                <WifiOff size={20} className="text-amber-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-amber-400 text-xs font-bold">Çevrimdışı Görünüyorsunuz</p>
                  <p className="text-amber-400/70 text-[11px] mt-0.5">İnternet bağlantınızı kontrol edip sayfayı yenileyin.</p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
              <button 
                onClick={this.handleRetry}
                className="flex-1 flex items-center gap-2 justify-center px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold text-sm sm:text-base hover:from-purple-500 hover:to-purple-700 transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] min-h-[48px]"
              >
                <RefreshCw size={18} />
                Tekrar Dene
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex-1 flex items-center gap-2 justify-center px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-bold text-sm sm:text-base hover:from-red-500 hover:to-red-700 transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] min-h-[48px]"
              >
                <Home size={18} />
                Ana Sayfa
              </button>
            </div>
            
            <div className="text-left bg-red-950/40 border border-red-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
               <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 pb-3 border-b border-red-500/20">
                  <span className="px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    HATA KODU: {this.state.fullCode}
                  </span>
                  <span className="text-xs sm:text-sm text-red-400 font-bold">{errorInfo?.name}</span>
               </div>
               <p className="text-red-200/90 text-[11px] sm:text-xs leading-relaxed mb-3 sm:mb-4">
                 {errorInfo?.description}
               </p>
               <div className="bg-black/50 rounded-lg sm:rounded-xl p-3 border border-red-500/10 mb-3 sm:mb-4">
                 <span className="block text-[10px] text-red-500/60 font-bold mb-1">ÇÖZÜM ÖNERİSİ:</span>
                 <p className="text-red-300/80 text-[11px] sm:text-xs">{errorInfo?.solution}</p>
               </div>
               <div className="bg-amber-500/10 rounded-lg sm:rounded-xl p-3 border border-amber-500/20">
                 <span className="flex items-center gap-2 text-[10px] text-amber-500 font-bold mb-1">
                   <AlertTriangle size={12} /> GELİŞTİRİCİ İÇİN BİLGİ:
                 </span>
                 <p className="text-amber-400/80 text-[11px] sm:text-xs">
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
