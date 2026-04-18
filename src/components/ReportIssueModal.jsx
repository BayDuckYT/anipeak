import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function ReportIssueModal({ isOpen, onClose, seriesId, chapterNum }) {
  const { user } = useAuth();
  const [type, setType] = useState('Eksik Sayfa');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('error_reports').insert([{
      user_id: user?.id || null,
      series_id: seriesId,
      chapter_num: chapterNum,
      type,
      description: desc.trim()
    }]);

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDesc('');
        onClose();
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-[10000]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400" size={24} />
            <h3 className="text-xl font-black text-white">Hata Bildir / Kozmik İhbar</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Sorun Türü</label>
            <div className="grid grid-cols-2 gap-2">
              {['Eksik Sayfa', 'Hatalı Çeviri', 'Bozuk Görsel', 'Yüklenme Hatası'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    type === t 
                      ? 'bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Açıklama</label>
            <textarea
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Sorunu kısaca anlatır mısın? (Örn: 5. sayfa yarıda kesilmiş)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 transition-all min-h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white h-12 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              {success ? (
                <>
                  <CheckCircle2 size={18} /> Rapor Gönderildi
                </>
              ) : (
                <>
                  <Send size={18} /> İhbarı Gönder
                </>
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-zinc-600 text-center uppercase tracking-tighter">
            * Bildirimlerin direkt admin paneline düşer ve en kısa sürede incelenir.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
