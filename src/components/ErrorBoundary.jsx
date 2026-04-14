import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Kozmik Hata Yakalandı:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 text-center">
          <div className="glass-strong border border-red-500/20 rounded-3xl p-10 max-w-lg shadow-[0_0_100px_rgba(239,68,68,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-600/10 blur-3xl pointer-events-none" />
            
            <ShieldAlert size={64} className="text-red-500 mx-auto mb-6 opacity-90 animate-pulse" />
            <h1 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Sistem Çökmesi Engellendi</h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Kritik bir veri uyuşmazlığı yakalandı. Endişelenmeyin, Error Boundary sayesinde tüm site çökmedi!
            </p>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 mx-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-bold text-base hover:from-red-500 hover:to-red-700 transition-all shadow-neon-red shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.45)]"
            >
              <RotateCcw size={18} />
              Ana Sayfaya Dön
            </button>
            
            <div className="mt-8 text-[10px] text-slate-600 font-mono opacity-50">
              Hata Kodu: {this.state.error?.message || 'Unknown Cosmic Anomaly'}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
