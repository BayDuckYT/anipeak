import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      console.log("[MODAL] Hata Bildirim Modalı Açıldı!", { seriesId, chapterNum });
    }
  }, [isOpen, seriesId, chapterNum]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim()) return;

    setLoading(true);
    console.log("[MODAL] İhbar gönderiliyor...", { type, desc, seriesId, chapterNum });

    try {
      const { data, error } = await supabase.from('error_reports').insert({
        user_id: user?.id || null,
        series_id: parseInt(seriesId),
        chapter_num: chapterNum ? parseFloat(chapterNum) : null,
        type,
        description: desc.trim(),
        status: 'Beklemede'
      }).select();

      if (error) {
        console.error("[MODAL] Supabase Hatası:", error);
        alert("İhbar gönderilemedi: " + error.message);
      } else {
        console.log("[MODAL] İhbar başarıyla kaydedildi:", data);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setDesc('');
          onClose();
        }, 2500);
      }
    } catch (err) {
      console.error("[MODAL] Beklenmedik Hata:", err);
      alert("Sistem hatası oluştu!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop with extreme blur and dark overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-[20px]"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative w-full max-w-lg glass border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.2)] bg-[#050507]"
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-600/20 blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="p-8 border-b border-white/5 relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <AlertCircle size={30} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Hata Bildirimi</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Acil Durum Müdahale Hattı</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all hover:rotate-90"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body */}
        <div className="p-10">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={48} />
              </div>
              <h4 className="text-3xl font-black text-white mb-3">MESAJIN ULAŞTI!</h4>
              <p className="text-slate-400 text-base font-medium">Siber ekiplerimiz radara düşen hatayı temizlemeye gidiyor.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Context row */}
              <div className="flex gap-4">
                <div className="flex-1 px-5 py-4 bg-white/3 border border-white/10 rounded-3xl flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <Book size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Seri No</p>
                    <p className="text-sm text-white font-black">#{seriesId}</p>
                  </div>
                </div>
                <div className="flex-1 px-5 py-4 bg-white/3 border border-white/10 rounded-3xl flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Layers size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Bölüm No</p>
                    <p className="text-sm text-white font-black">{chapterNum || 'Genel'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em] ml-1">Arıza Türü Seç</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Eksik Sayfa', 'Yanlış Çeviri', 'Görsel Hatası', 'Diğer'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-5 py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all border uppercase ${
                        type === t
                          ? 'bg-red-600 text-white border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-[1.03]'
                          : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em] ml-1">Arıza Detayı</label>
                <textarea
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Hata hakkında net bilgi ver, siber ekiplerimiz şaşırmasın..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] px-6 py-5 text-white text-sm focus:border-red-600 outline-none transition-all min-h-[160px] resize-none shadow-inner"
                />
              </div>

              <button
                disabled={loading || !desc.trim()}
                type="submit"
                className="group relative w-full py-5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-base rounded-[2rem] shadow-[0_20px_40px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-[0.2em]"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                    İhbarı Gönder
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-3 pt-4 opacity-50">
                <User size={14} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                  {user ? `Operatör ID: ${user.username}` : 'Anonim Veri Akışı'}
                </span>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
