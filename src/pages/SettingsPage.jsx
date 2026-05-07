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
import AnimeAvatar from '../components/AnimeAvatar.jsx';
import effectsData from '../data/effects.json';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('hesap');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // State Management for all settings
  const [notifSettings, setNotifSettings] = useState({
    newChapter: true, replies: true, mentions: true, system: true, marketing: false
  });
  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: true, showActivity: true, showLists: true
  });
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark', // dark, amoled
    animations: true,
    performanceMode: false
  });
  const [malUsername, setMalUsername] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  // Profil verisinden ayarları yükle
  useEffect(() => {
    if (user) {
      if (user.notification_settings) setNotifSettings(user.notification_settings);
      if (user.privacy_settings) setPrivacySettings(user.privacy_settings);
      if (user.appearance_settings) setAppearanceSettings(user.appearance_settings);
      if (user.mal_username) setMalUsername(user.mal_username);
    }
  }, [user]);

  const handleSave = async (data = {}) => {
    setIsSaving(true);
    try {
      await updateProfile(data);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Ayarlar kaydedilemedi:', err);
      alert('Kaydedilirken bir hata oluştu!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.next !== passwords.confirm) return alert('Şifreler eşleşmiyor!');
    setIsSaving(true);
    try {
      const { updatePassword } = useAuth(); // Assuming it's in context
      await updatePassword(passwords.next);
      setShowToast(true);
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { id: 'hesap', label: 'Hesap', icon: User },
    { id: 'guvenlik', label: 'Güvenlik', icon: Shield },
    { id: 'bildirimler', label: 'Bildirimler', icon: Bell },
    { id: 'gizlilik', label: 'Gizlilik', icon: Eye },
    { id: 'gorunum', label: 'Görünüm', icon: Palette },
    { id: 'discord', label: 'Discord Sync', icon: LinkIcon },
    { id: 'mal', label: 'MyAnimeList', icon: LinkIcon },
  ];

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
                  <section className="space-y-8">
                    <div className="flex items-center gap-3">
                       <User size={20} className="text-purple-500" />
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Profil Bilgileri</h2>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-zinc-950/50 border border-zinc-800/50 flex flex-col md:flex-row items-center gap-8 group hover:border-purple-500/20 transition-all">
                       <div className="relative group/avatar">
                          <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-800 overflow-hidden flex items-center justify-center">
                             {user?.avatar_url ? (
                               <img src={user.avatar_url} className="w-full h-full object-cover" />
                             ) : (
                               <User size={48} className="text-zinc-800" />
                             )}
                          </div>
                          <button className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 text-white shadow-xl hover:scale-110 transition-transform">
                             <Camera size={16} />
                          </button>
                       </div>
                       <div className="flex-1 space-y-1 text-center md:text-left">
                          <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                            {user?.username}
                            {user?.is_elite && <Zap size={18} className="text-amber-400 fill-amber-400" />}
                          </h3>
                          <p className="text-sm text-zinc-500 font-medium">{user?.email}</p>
                          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                             <span className="px-3 py-1 rounded-full bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-800">{user?.role}</span>
                             <span className="px-3 py-1 rounded-full bg-purple-500/10 text-[10px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/20">LVL {user?.level}</span>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputGroup 
                          label="Kullanıcı Adı" 
                          value={user?.username} 
                          placeholder="Yeni kullanıcı adın..."
                          onSave={(val) => handleSave({ username: val })}
                          isSaving={isSaving}
                       />
                       <InputGroup 
                          label="E-posta" 
                          value={user?.email} 
                          type="email"
                          placeholder="Yeni e-posta adresin..."
                          onSave={(val) => handleSave({ email: val })}
                          isSaving={isSaving}
                       />
                    </div>
                  </section>
               </div>
             )}

             {activeTab === 'guvenlik' && (
               <div className="space-y-10">
                  <header className="space-y-2">
                    <div className="flex items-center gap-3">
                       <Shield size={20} className="text-purple-500" />
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Güvenlik Merkezi</h2>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium">Hesabını ve erişimini güvende tut</p>
                  </header>

                  <div className="space-y-6">
                     <div className="space-y-4 p-8 rounded-3xl bg-zinc-950/50 border border-zinc-800/50">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Şifre Değiştir</label>
                        <div className="space-y-3">
                           <input 
                             type="password" 
                             placeholder="Mevcut Şifre"
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-600 transition-all"
                             value={passwords.current}
                             onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                           />
                           <input 
                             type="password" 
                             placeholder="Yeni Şifre"
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-600 transition-all"
                             value={passwords.next}
                             onChange={(e) => setPasswords({...passwords, next: e.target.value})}
                           />
                           <input 
                             type="password" 
                             placeholder="Yeni Şifre (Tekrar)"
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-600 transition-all"
                             value={passwords.confirm}
                             onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                           />
                           <button 
                             onClick={handleChangePassword}
                             disabled={isSaving || !passwords.next}
                             className="w-full py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                           >
                             Şifreyi Güncelle
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'bildirimler' && (
               <div className="space-y-10">
                  <header className="space-y-2">
                    <div className="flex items-center gap-3">
                       <Bell size={20} className="text-purple-500" />
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Bildirim Tercihleri</h2>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium">Hangi durumlarda bildirim almak istediğini belirle</p>
                  </header>

                  <div className="space-y-4">
                     <NotificationToggle 
                        title="Yeni Bölüm Yayınları" 
                        desc="Takip ettiğin serilere yeni bölüm eklendiğinde haberin olsun."
                        enabled={notifSettings.newChapter}
                        onToggle={() => {
                          const next = { ...notifSettings, newChapter: !notifSettings.newChapter };
                          setNotifSettings(next);
                          handleSave({ notification_settings: next });
                        }}
                     />
                     <NotificationToggle 
                        title="Yorum Yanıtları" 
                        desc="Yaptığın yorumlara birisi yanıt verdiğinde bildirim al."
                        enabled={notifSettings.replies}
                        onToggle={() => {
                          const next = { ...notifSettings, replies: !notifSettings.replies };
                          setNotifSettings(next);
                          handleSave({ notification_settings: next });
                        }}
                     />
                     <NotificationToggle 
                        title="Sistem Duyuruları" 
                        desc="Bakım modu, güncellemeler ve önemli duyuruları kaçırma."
                        enabled={notifSettings.system}
                        onToggle={() => {
                          const next = { ...notifSettings, system: !notifSettings.system };
                          setNotifSettings(next);
                          handleSave({ notification_settings: next });
                        }}
                     />
                  </div>
               </div>
             )}

             {activeTab === 'gizlilik' && (
               <div className="space-y-10">
                  <header className="space-y-2">
                    <div className="flex items-center gap-3">
                       <Eye size={20} className="text-purple-500" />
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Gizlilik Ayarları</h2>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium">Profilinin görünürlüğünü yönet</p>
                  </header>

                  <div className="space-y-4">
                     <NotificationToggle 
                        title="Genel Profil" 
                        desc="Profilinin diğer kullanıcılar tarafından görülmesine izin ver."
                        enabled={privacySettings.publicProfile}
                        onToggle={() => {
                          const next = { ...privacySettings, publicProfile: !privacySettings.publicProfile };
                          setPrivacySettings(next);
                          handleSave({ privacy_settings: next });
                        }}
                     />
                     <NotificationToggle 
                        title="Aktivite Durumu" 
                        desc="Şu an ne okuduğunun başkaları tarafından görülmesine izin ver."
                        enabled={privacySettings.showActivity}
                        onToggle={() => {
                          const next = { ...privacySettings, showActivity: !privacySettings.showActivity };
                          setPrivacySettings(next);
                          handleSave({ privacy_settings: next });
                        }}
                     />
                  </div>
               </div>
             )}

             {activeTab === 'gorunum' && (
               <div className="space-y-10">
                  <header className="space-y-2">
                    <div className="flex items-center gap-3">
                       <Palette size={20} className="text-purple-500" />
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Görünüm Ayarları</h2>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium">Site tasarımını kişiselleştir</p>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => {
                         const next = { ...appearanceSettings, theme: 'dark' };
                         setAppearanceSettings(next);
                         handleSave({ appearance_settings: next });
                       }}
                       className={`p-6 rounded-[2rem] border transition-all text-left space-y-3 ${appearanceSettings.theme === 'dark' ? 'bg-zinc-900 border-purple-500/50' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'}`}
                     >
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                           <ImageIcon size={20} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-white">Standart Koyu</p>
                     </button>
                     <button 
                       onClick={() => {
                         const next = { ...appearanceSettings, theme: 'amoled' };
                         setAppearanceSettings(next);
                         handleSave({ appearance_settings: next });
                       }}
                       className={`p-6 rounded-[2rem] border transition-all text-left space-y-3 ${appearanceSettings.theme === 'amoled' ? 'bg-black border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'}`}
                     >
                        <div className="w-10 h-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-purple-500">
                           <Zap size={20} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-white">Ultra Siyah (AMOLED)</p>
                     </button>
                  </div>

                  <div className="space-y-4">
                     <NotificationToggle 
                        title="Akıcı Animasyonlar" 
                        desc="Sayfa geçişlerinde ve efektlerde yüksek kaliteli animasyonlar."
                        enabled={appearanceSettings.animations}
                        onToggle={() => {
                          const next = { ...appearanceSettings, animations: !appearanceSettings.animations };
                          setAppearanceSettings(next);
                          handleSave({ appearance_settings: next });
                        }}
                     />
                  </div>
               </div>
             )}

             {activeTab === 'mal' && (
               <div className="space-y-10">
                  <header className="space-y-2">
                    <div className="flex items-center gap-3">
                       <LinkIcon size={20} className="text-blue-500" />
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">MyAnimeList Entegrasyonu</h2>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium">Listelerini MAL ile senkronize et</p>
                  </header>

                  <div className="p-8 rounded-[2.5rem] bg-[#2E51A2]/10 border border-[#2E51A2]/20 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#2E51A2] flex items-center justify-center text-white">
                           <span className="font-black text-xl italic">MAL</span>
                        </div>
                        <div className="flex-1">
                           <p className="text-sm font-bold text-white">MyAnimeList Hesabın</p>
                           <p className="text-[10px] text-zinc-500 font-medium">Otomatik liste güncelleme ve senkronizasyon.</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <input 
                           type="text" 
                           placeholder="MAL Kullanıcı Adı"
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-[#2E51A2] transition-all"
                           value={malUsername}
                           onChange={(e) => setMalUsername(e.target.value)}
                        />
                        <button 
                           onClick={() => handleSave({ mal_username: malUsername })}
                           disabled={isSaving}
                           className="w-full py-4 rounded-2xl bg-[#2E51A2] text-white text-xs font-black uppercase tracking-widest hover:bg-[#254182] transition-all shadow-lg shadow-[#2E51A2]/20"
                        >
                           Hesabı Bağla / Güncelle
                         )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, value, placeholder, onSave, isSaving, type = "text" }) {
  const [val, setVal] = useState(value || '');
  return (
    <div className="space-y-4">
       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">{label}</label>
       <div className="relative group">
          <input 
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-600 transition-all"
          />
          <button 
            onClick={() => onSave(val)}
            disabled={isSaving || val === value}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-600 text-white shadow-lg disabled:opacity-0 transition-all hover:scale-110"
          >
             {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
       </div>
    </div>
  );
}

function NotificationToggle({ title, desc, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-all group">
       <div className="space-y-1 pr-4">
          <h4 className="text-sm font-black text-white uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{desc}</p>
       </div>
       <button 
          onClick={onToggle}
          className={`relative w-12 h-6 rounded-full transition-all duration-500 p-1 flex items-center ${
            enabled ? 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-zinc-800'
          }`}
       >
          <motion.div 
            animate={{ x: enabled ? 24 : 0 }}
            className="w-4 h-4 bg-white rounded-full shadow-lg"
          />
       </button>
    </div>
  );
}
}
