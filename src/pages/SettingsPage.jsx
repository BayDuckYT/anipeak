import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  Palette, 
  Link as LinkIcon, 
  AlertTriangle,
  Settings as SettingsIcon,
  Check,
  X,
  Loader2,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Globe,
  Lock,
  Mail,
  Zap,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import effectsData from '../data/effects.json';
import Decoration from '../components/Decoration';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('hesap');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const menuItems = [
    { id: 'hesap', label: 'Hesap', icon: User },
    { id: 'guvenlik', label: 'Güvenlik', icon: Shield },
    { id: 'bildirimler', label: 'Bildirimler', icon: Bell },
    { id: 'gizlilik', label: 'Gizlilik', icon: Eye },
    { id: 'gorunum', label: 'Görünüm', icon: Palette },
    { id: 'mal', label: 'MyAnimeList', icon: LinkIcon },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 font-sans pt-20 pb-20">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[200] flex items-center gap-3 px-6 py-4 bg-purple-600 rounded-2xl shadow-2xl shadow-purple-500/20"
          >
            <Check size={20} className="text-white" />
            <span className="text-xs font-black uppercase tracking-widest">Değişiklikler Kaydedildi</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-purple-600/10 text-purple-500">
               <SettingsIcon size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">Ayarlar</h1>
              <p className="text-zinc-500 text-sm font-medium">Hesap ayarlarını ve tercihlerini buradan yönetebilirsin</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0 space-y-8">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-95 ${
                    activeTab === item.id 
                      ? 'bg-zinc-900/50 text-white shadow-xl' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <item.icon size={20} className={activeTab === item.id ? 'text-purple-500' : 'text-zinc-700 group-hover:text-zinc-500'} />
                  <span className="text-sm font-black tracking-tight">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="pt-8 border-t border-zinc-800/50">
               <button className="w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group hover:scale-[1.02] active:scale-95">
                  <AlertTriangle size={20} />
                  <span className="text-sm font-black tracking-tight">Tehlikeli Bölge</span>
               </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full max-w-3xl bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
             
             {activeTab === 'hesap' && (
               <div className="space-y-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <User size={20} className="text-purple-500" />
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Profil Bilgileri</h2>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium -mt-4">Temel profil bilgilerini düzenle</p>

                    <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center gap-6 group hover:border-zinc-700 transition-all">
                       <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center relative">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <User size={40} className="text-zinc-800" />
                          )}
                       </div>
                       <div className="space-y-1">
                          <h3 className="text-2xl font-black text-white tracking-tight">{user?.username || 'Kullanıcı'}</h3>
                          <p className="text-sm text-zinc-500 font-medium">{user?.email || 'eposta@anipeak.com'}</p>
                       </div>
                    </div>

                    <div className="space-y-6 pt-4">
                       <div className="space-y-4">
                          <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                          <div className="flex flex-col gap-3">
                             <input 
                               type="text" 
                               defaultValue={user?.username}
                               className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-600 transition-all" 
                             />
                             <p className="text-[10px] text-zinc-600 font-medium ml-1 italic">30 günde bir değiştirebilirsiniz.</p>
                             <button 
                               onClick={handleSave}
                               disabled={isSaving}
                               className="w-fit flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                             >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                Kaydet
                             </button>
                          </div>
                       </div>

                       <div className="space-y-4 pt-6 border-t border-zinc-800/50">
                          <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">E-posta Adresi</label>
                          <div className="flex flex-col gap-3">
                             <input 
                               type="email" 
                               defaultValue={user?.email}
                               className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-600 transition-all" 
                             />
                             <button 
                               onClick={handleSave}
                               disabled={isSaving}
                               className="w-fit flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                             >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                Kaydet
                             </button>
                          </div>
                       </div>
                    </div>
                  </section>
               </div>
             )}

             {activeTab !== 'hesap' && (
               <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                  <div className="p-6 rounded-full bg-zinc-950 text-zinc-800">
                     <SettingsIcon size={48} />
                  </div>
                  <p className="text-zinc-500 text-sm font-medium italic">Bu sekme üzerinde çalışmalarımız devam ediyor uşağım! 🚀</p>
               </div>
             )}

          </main>
        </div>

      </div>
    </div>
  );
}
}
