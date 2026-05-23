import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSEO } from '../hooks/useSEO';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Genel İletişim', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useSEO({
    title: 'İletişim',
    description: 'AniPeak ile iletişime geç. Soru, öneri ve geri bildirimlerinizi bizimle paylaşın.',
    url: 'https://anipeak.com.tr/iletisim'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('contact_messages').insert([formData]);
      if (!error) {
        setSuccess(true);
        setFormData({ name: '', email: '', subject: 'Genel İletişim', message: '' });
      } else {
        alert('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      alert('Sunucu şu an çevrimdışı. Lütfen daha sonra tekrar deneyin!');
    }
    
    setLoading(false);
  };

  const contactCards = [
    { title: 'Genel İletişim', email: 'info@anipeak.com.tr', color: 'from-blue-500 to-cyan-500', icon: <Mail size={24} /> },
    { title: 'Öneri', email: 'support@anipeak.com.tr', color: 'from-emerald-500 to-teal-500', icon: <Send size={24} /> },
    { title: 'İşbirlikleri & Reklam', email: 'business@anipeak.com.tr', color: 'from-rose-500 to-orange-500', icon: <Send size={24} /> },
    { title: 'Hata Bildirimi', email: 'support@anipeak.com.tr', color: 'from-amber-500 to-red-500', icon: <CheckCircle2 size={24} /> }
  ];

  return (
    <div className="min-h-screen bg-[#070511] pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-4 italic uppercase"
          >
            İLETİŞİM <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">MERKEZİ</span>
          </motion.h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            AniPeak ekibiyle iletişime geçmek için konuyu seçin. 
            Tüm mesajlarınız doğrudan arka planda otonom olarak bize iletilir.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4">
            {contactCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <div className="text-white">{card.icon}</div>
                </div>
                <h3 className="text-white font-black text-lg mb-1">{card.title}</h3>
                <p className="text-slate-400 text-sm">{card.email}</p>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 glass border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative"
          >
            {success ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                  <CheckCircle2 size={64} />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">VERİ İLETİLDİ!</h2>
                <p className="text-slate-400 mb-8 max-w-sm">İletişim merkezimiz mesajınızı ilgili birime ulaştırdı. En kısa sürede dönüş yapılacaktır!</p>
                <button onClick={() => setSuccess(false)} className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Yeni Veri Gönder</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">ADINIZ</label>
                    <input 
                      required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-purple-500 outline-none transition-all placeholder-slate-400"
                      placeholder="Adınız..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">E-POSTA</label>
                    <input 
                      required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-purple-500 outline-none transition-all placeholder-slate-400"
                      placeholder="ornek@mail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">KONU</label>
                  <select 
                    value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-purple-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="Genel İletişim" className="bg-[#0a0a14]">Genel İletişim</option>
                    <option value="Öneri" className="bg-[#0a0a14]">Öneri</option>
                    <option value="Teknik Destek" className="bg-[#0a0a14]">Teknik Destek</option>
                    <option value="İşbirlikleri" className="bg-[#0a0a14]">İşbirlikleri</option>
                    <option value="Hata Bildirimi" className="bg-[#0a0a14]">Hata Bildirimi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">MESAJINIZ</label>
                  <textarea 
                    required rows={6} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-purple-500 outline-none transition-all resize-none placeholder-slate-400"
                    placeholder="İletmek istediğiniz mesaj..."
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-2xl shadow-neon-purple hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Send size={20} /> {loading ? 'MESAJ İLETİLİYOR...' : 'MESAJI GÖNDER'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
