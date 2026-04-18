import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Send, CheckCircle2, User, Book, Layers } from 'lucide-react';
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
    try {
      const { error } = await supabase.from('error_reports').insert({
        user_id: user?.id || null,
        series_id: seriesId,
        chapter_num: chapterNum,
        type,
        description: desc,
        status: 'Beklemede'
      });

      if (!error) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setDesc('');
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Report Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg glass border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0a0a0c]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-red-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic tracking-tighter">KOZMİK İHBAR</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Hata Bildirim Sistemi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-all hover:rotate-90">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="text-2xl font-black text-white mb-2">İHBAR ALINDI!</h4>
              <p className="text-slate-400 text-sm font-medium">Siber ekiplerimiz hatayı incelemeye başladı amk.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                  <Book size={14} className="text-purple-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase">Seri ID</p>
                    <p className="text-xs text-white font-bold">#{seriesId}</p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                  <Layers size={14} className="text-blue-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase">Bölüm</p>
                    <p className="text-xs text-white font-bold">{chapterNum}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">Hata Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Eksik Sayfa', 'Yanlış Çeviri', 'Görsel Hatası', 'Diğer'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border uppercase ${
                        type === t
                          ? 'bg-red-500 text-white border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                          : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">Detaylar</label>
                <textarea
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Hata hakkında biraz bilgi ver amk..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-red-500 outline-none transition-all min-h-[140px] resize-none"
                />
              </div>

              <button
                disabled={loading || !desc.trim()}
                type="submit"
                className="w-full py-5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-base rounded-2xl shadow-[0_15px_35px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={20} /> İHBARI GÖNDER
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-slate-500 border-t border-white/5 pt-4">
                <User size={12} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {user ? `OPERATÖR: ${user.email.split('@')[0]}` : 'ANONİM İHBARCI'}
                </span>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
