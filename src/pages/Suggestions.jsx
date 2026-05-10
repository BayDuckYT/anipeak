import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, MessageSquare, Mail, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Suggestions() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('contact_messages').insert([{
        name: formData.name,
        email: formData.email,
        subject: 'Kullanıcı Önerisi',
        message: formData.message
      }]);
      
      if (!error) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        alert('Veritabanına bağlanılamadı.');
      }
    } catch (err) {
      alert('Sunucu şu an çevrimdışı. Lütfen daha sonra tekrar deneyin!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] pt-32 pb-20 px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6"
          >
            <MessageSquare className="text-purple-400" size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter"
          >
            KULLANICI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">ÖNERİ</span> HATTI
          </motion.h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium">
            AniPeak'i daha iyi bir yer haline getirmek için fikirlerinize ihtiyacımız var. 
            <span className="text-white"> Önerinizi gönderin, ekibimizle birlikte değerlendirelim!</span>
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl bg-black/40 backdrop-blur-xl"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 size={56} />
                </div>
                <h2 className="text-4xl font-black text-white mb-4">BAŞARILI!</h2>
                <p className="text-slate-400 mb-10 max-w-sm leading-relaxed">
                  Öneriniz sistemimize başarıyla kaydedildi. İnceleyip en kısa sürede değerlendirmeye alacağız!
                </p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all hover:scale-105"
                >
                  YENİ ÖNERİ GÖNDER
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      <User size={12} className="text-purple-400" /> ADINIZ
                    </label>
                    <input 
                      required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-purple-500 outline-none transition-all placeholder-slate-700"
                      placeholder="Adınız veya kullanıcı adınız"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      <Mail size={12} className="text-blue-400" /> E-POSTA ADRESİNİZ
                    </label>
                    <input 
                      required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-purple-500 outline-none transition-all placeholder-slate-700"
                      placeholder="eposta@adresiniz.com"
                    />
                    <p className="text-[9px] text-slate-600 ml-1 italic">* Sizinle iletişime geçebilmemiz için gereklidir.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2 ml-1">Öneriniz Nedir?</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={6}
                    className="w-full glass border border-white/10 rounded-2xl p-4 text-white placeholder-slate-600 focus:border-purple-500 outline-none transition-all resize-none"
                    placeholder="AniPeak'te hangi özellikleri görmek istersiniz? Fikirlerinizi bizimle paylaşın..."
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg uppercase tracking-tighter"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={24} />
                  )}
                  {loading ? 'GÖNDERİLİYOR...' : 'ÖNERİYİ GÖNDER'}
                </button>
              </form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer Info */}
        <div className="mt-12 flex items-center justify-center gap-8 text-slate-600 font-bold text-[10px] uppercase tracking-widest">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> %100 GÜVENLİ
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> KULLANICI ODAKLI SİSTEM
           </div>
        </div>
      </div>
    </div>
  );
}
