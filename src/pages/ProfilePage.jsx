import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Settings, Crown, LayoutDashboard, History, Bell, ChevronRight, Play } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function ProfilePage() {
  const { user, readingHistory } = useAuth();
  const { series } = useApp();
  const [activeTab, setActiveTab] = useState('history');

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const avatarLetter = user?.username?.charAt(0)?.toUpperCase() || 'U';

  // Get rich history data by merging with context data
  const richHistory = readingHistory?.map(h => ({
    ...h,
    manhwa: series?.find(m => String(m.id) === String(h.manhwaId))
  })).filter(h => h.manhwa) || [];

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl auto">
      {/* ── PROFILE HEADER ── */}
      <div className="glass border border-white/10 rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-neon-purple flex-shrink-0">
            {avatarLetter}
          </div>
          
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{user.username}</h1>
            <p className="text-slate-400 text-sm mb-4">{user.email}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {(user.role === 'Baş Admin' || user.role === 'Yönetici') && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Crown size={14} /> {user.role.toUpperCase()}
                </span>
              )}
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border-white/10 text-slate-300 text-xs font-bold">
                <BookOpen size={14} /> {user.totalRead || richHistory.length} Bölüm Okundu
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ── SIDEBAR ── */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {[
            { id: 'history', label: 'Okuduklarım', icon: History },
            { id: 'settings', label: 'Hesap Ayarları', icon: Settings },
            { id: 'notifications', label: 'Bildirim Tercihleri', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                  : 'glass border border-white/5 text-slate-400 hover:text-white hover:border-white/10'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
          {/* Admin link if user is admin */}
          {(user.role === 'Baş Admin' || user.role === 'Yönetici' || user.role === 'Admin Yardımcısı') && (
            <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold glass border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 transition-all mt-4">
              <LayoutDashboard size={18} />
              Yönetim Paneli
            </Link>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 pb-20">
          <AnimatePresence mode="wait">
            
            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-xl font-bold text-white mb-6">Okumaya Devam Et</h2>
                
                {richHistory.length === 0 ? (
                  <div className="glass border border-white/10 rounded-2xl p-10 text-center">
                    <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-white font-bold mb-2">Henüz seriye başlamadın</h3>
                    <p className="text-slate-400 text-sm mb-6">Keşfetmeye başla ve maceraya katıl!</p>
                    <Link to="/" className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold">Serileri Keşfet</Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {richHistory.map((item) => (
                      <div key={item.manhwaId} className="flex gap-4 p-4 rounded-2xl glass border border-white/10 hover:border-purple-500/30 transition-all group">
                        <img src={item.manhwa.cover} alt={item.manhwa.title} className="w-20 h-28 object-cover rounded-lg border border-white/10" />
                        <div className="flex-1 min-w-0 flex flex-col pt-1">
                          <h3 className="text-white font-bold text-sm truncate mb-1">{item.manhwa.title}</h3>
                          <p className="text-purple-400 text-xs font-semibold mb-2">Kaldığın Bölüm: {item.lastChapter}</p>
                          <p className="text-slate-500 text-[10px] mb-auto">Son okuma: {new Date(item.updatedAt).toLocaleDateString('tr-TR')}</p>
                          
                          <Link to={`/read/${item.manhwaId}/${item.lastChapter}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold hover:bg-purple-600 hover:text-white transition-all w-fit mt-2">
                            <Play size={12} /> Devam Et
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-xl font-bold text-white mb-6">Hesap Bilgileri</h2>
                <form className="max-w-md space-y-4" onSubmit={e => e.preventDefault()}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kullanıcı Adı</label>
                    <input type="text" defaultValue={user.username} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">E-posta Adresi</label>
                    <input type="email" defaultValue={user.email} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 bg-black/20" disabled />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Yeni Şifre</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-all" />
                  </div>
                  <button className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-neon-purple mt-2">
                    Ayarları Kaydet
                  </button>
                </form>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-xl font-bold text-white mb-6">Bildirim Tercihleri</h2>
                <div className="max-w-md space-y-4">
                  {[
                    { id: 'notif_new', title: 'Yeni Bölüm Uyarıları', desc: 'Takip ettiğiniz serilere yeni bölüm eklendiğinde anında haber verilir.' },
                    { id: 'notif_sys', title: 'Sistem Duyuruları', desc: 'Bakım, güncelleme ve site ile ilgili genel bilgilendirme mesajları.' },
                    { id: 'notif_promo', title: 'Kampanyalar ve Duyurular', desc: 'Size özel indirim ve hediyelerden e-posta ile haberdar olun.' }
                  ].map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between p-4 glass border border-white/10 rounded-2xl hover:bg-white/5 transition-colors group">
                      <div className="pr-4">
                        <p className="text-white text-sm font-bold">{notif.title}</p>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{notif.desc}</p>
                      </div>
                      <label className="relative cursor-pointer flex-shrink-0">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-12 h-6 bg-white/10 rounded-full peer peer-checked:bg-purple-600 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-6 after:shadow-sm" />
                      </label>
                    </div>
                  ))}
                  
                  <button className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-neon-purple mt-4 w-fit">
                    Tercihleri Kaydet
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
