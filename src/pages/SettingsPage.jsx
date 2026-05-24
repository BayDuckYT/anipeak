import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Eye, Palette, Link as LinkIcon, 
  AlertTriangle, Settings as SettingsIcon, Check, Loader2, 
  Camera, ImageIcon, Zap, Swords
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSEO } from '../hooks/useSEO';

const HOUSES = [
  { id: 'dragon', name: 'Kızıl Ejder', color: 'from-red-600 to-red-900', shadow: 'shadow-red-500/20', border: 'border-red-500/30' },
  { id: 'fox', name: 'Gümüş Kitsune', color: 'from-purple-600 to-purple-900', shadow: 'shadow-purple-500/20', border: 'border-purple-500/30' },
  { id: 'wolf', name: 'Buz Kurt', color: 'from-blue-600 to-blue-900', shadow: 'shadow-blue-500/20', border: 'border-blue-500/30' },
  { id: 'phoenix', name: 'Altın Anka', color: 'from-orange-500 to-orange-800', shadow: 'shadow-orange-500/20', border: 'border-orange-500/30' },
];

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('hesap');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useSEO({
    title: 'Ayarlar',
    description: 'AniPeak hesap ayarları. Profil, bildirim ve görünüm tercihlerini yönet.',
    url: 'https://anipeak.com.tr/settings'
  });

  // State Management for all settings
  const [notifSettings, setNotifSettings] = useState({
    newChapter: true, replies: true, system: true
  });
  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: true, showActivity: true
  });
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark', // dark, amoled
    animations: true,
    dataSaver: false // Yeni Eklendi
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
      const { updatePassword } = useAuth(); 
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
    { id: 'hesap', label: 'Hesap & Fraksiyon', icon: User },
    { id: 'guvenlik', label: 'Güvenlik', icon: Shield },
    { id: 'gorunum', label: 'Görünüm & Performans', icon: Palette },
    { id: 'bildirimler', label: 'Bildirimler', icon: Bell },
    { id: 'gizlilik', label: 'Gizlilik', icon: Eye },
    { id: 'mal', label: 'MyAnimeList', icon: LinkIcon },
  ];

  return (
    <div className="min-h-screen bg-[#070511] text-zinc-100 font-sans pt-24 pb-20 relative overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)]"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Check size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-white">Değişiklikler Kaydedildi</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 relative z-10">
        
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.3)]">
               <SettingsIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight drop-shadow-lg">Ayarlar</h1>
              <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest mt-1">Komuta ve Kontrol Merkezi</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0">
            <nav className="flex flex-col gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-[2.5rem] backdrop-blur-md">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="relative flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group overflow-hidden"
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-tab"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent border-l-2 border-purple-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <item.icon size={20} className={`relative z-10 transition-colors ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-purple-300'}`} />
                    <span className={`relative z-10 text-xs font-black uppercase tracking-widest transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}

              <div className="mt-4 pt-4 border-t border-white/5">
                 <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-red-500/10 transition-all group overflow-hidden border border-transparent hover:border-red-500/20">
                    <AlertTriangle size={20} className="text-red-500/60 group-hover:text-red-500 transition-colors" />
                    <span className="text-xs font-black uppercase tracking-widest text-red-500/60 group-hover:text-red-500 transition-colors">Tehlikeli Bölge</span>
                 </button>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden"
              >
                {/* Subtle Inner Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {activeTab === 'hesap' && (
                  <div className="space-y-12">
                    <header className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Profil & Fraksiyon</h2>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Kişisel verilerin ve tarafın</p>
                    </header>

                    {/* Avatar Section */}
                    <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 flex flex-col md:flex-row items-center gap-8 group hover:border-white/10 transition-all">
                      <div className="relative group/avatar shrink-0">
                        <div className="w-32 h-32 rounded-full bg-zinc-900 border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            <User size={48} className="text-zinc-700" />
                          )}
                        </div>
                        <button className="absolute bottom-2 right-2 p-3 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl hover:scale-110 transition-transform">
                          <Camera size={16} />
                        </button>
                      </div>
                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <h3 className="text-3xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                          {user?.username}
                          {user?.is_elite && <Zap size={24} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />}
                        </h3>
                        <p className="text-sm text-zinc-400 font-medium">{user?.email}</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                          <span className="px-4 py-1.5 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-300 border border-white/10">{user?.role}</span>
                          <span className="px-4 py-1.5 rounded-full bg-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">LVL {user?.level || 1}</span>
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

                    {/* Faction Selection */}
                    <div className="pt-8 border-t border-white/5 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 text-purple-400 border border-white/10">
                          <Swords size={20} />
                        </div>
                        <div>
                          <label className="text-xs font-black text-white uppercase tracking-widest block">Haneni Seç</label>
                          <p className="text-[10px] text-zinc-500 font-medium mt-1">Savaşlarda ve etkinliklerde hangi tarafı temsil edeceksin?</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {HOUSES.map((house) => (
                          <button
                            key={house.id}
                            onClick={() => handleSave({ house_id: house.id })}
                            className={`relative p-6 rounded-3xl border transition-all duration-300 overflow-hidden text-left group
                              ${user?.house_id === house.id ? \`bg-gradient-to-br \${house.color} \${house.border} \${house.shadow}\` : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}
                            `}
                          >
                            <div className={`text-sm font-black uppercase tracking-widest ${user?.house_id === house.id ? 'text-white drop-shadow-md' : 'text-zinc-300'}`}>
                              {house.name}
                            </div>
                            {user?.house_id === house.id && (
                              <div className="absolute top-1/2 right-6 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {activeTab === 'gorunum' && (
                  <div className="space-y-12">
                    <header className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Görünüm & Performans</h2>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Sitenin sana nasıl görüneceği</p>
                    </header>

                    <div className="space-y-8">
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4 ml-2">Tema</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => {
                              const next = { ...appearanceSettings, theme: 'dark' };
                              setAppearanceSettings(next);
                              handleSave({ appearance_settings: next });
                            }}
                            className={`p-6 rounded-[2rem] border transition-all text-left space-y-4 relative overflow-hidden ${appearanceSettings.theme === 'dark' ? 'bg-[#13111C] border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'bg-black/20 border-white/5 hover:bg-black/40'}`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                               <ImageIcon size={24} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-white">Standart Koyu</p>
                          </button>
                          <button 
                            onClick={() => {
                              const next = { ...appearanceSettings, theme: 'amoled' };
                              setAppearanceSettings(next);
                              handleSave({ appearance_settings: next });
                            }}
                            className={`p-6 rounded-[2rem] border transition-all text-left space-y-4 relative overflow-hidden ${appearanceSettings.theme === 'amoled' ? 'bg-black border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'bg-black/20 border-white/5 hover:bg-black/40'}`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-purple-500">
                               <Zap size={24} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-white">Ultra Siyah (AMOLED)</p>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4 ml-2">Sistem Performansı</label>
                        <NotificationToggle 
                          title="Akıcı Animasyonlar" 
                          desc="Sitedeki parçacık efektlerini ve yumuşak geçişleri açar."
                          enabled={appearanceSettings.animations}
                          onToggle={() => {
                            const next = { ...appearanceSettings, animations: !appearanceSettings.animations };
                            setAppearanceSettings(next);
                            handleSave({ appearance_settings: next });
                          }}
                        />
                        <NotificationToggle 
                          title="Okuyucu Veri Tasarrufu" 
                          desc="Bölümleri okurken resimleri erkenden indirmeyi durdurur. İnternet kotası az olanlar için idealdir."
                          enabled={appearanceSettings.dataSaver}
                          onToggle={() => {
                            const next = { ...appearanceSettings, dataSaver: !appearanceSettings.dataSaver };
                            setAppearanceSettings(next);
                            handleSave({ appearance_settings: next });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'guvenlik' && (
                  <div className="space-y-12">
                    <header className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Güvenlik Merkezi</h2>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Hesabını güvende tut</p>
                    </header>

                    <div className="space-y-6">
                      <div className="p-8 md:p-10 rounded-[2.5rem] bg-black/40 border border-white/5">
                        <label className="text-xs font-black text-white uppercase tracking-widest block mb-6">Şifre Değiştir</label>
                        <div className="space-y-4">
                          <input 
                            type="password" 
                            placeholder="Mevcut Şifre"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-500 focus:bg-white/10 transition-all outline-none"
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                          />
                          <input 
                            type="password" 
                            placeholder="Yeni Şifre"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-500 focus:bg-white/10 transition-all outline-none"
                            value={passwords.next}
                            onChange={(e) => setPasswords({...passwords, next: e.target.value})}
                          />
                          <input 
                            type="password" 
                            placeholder="Yeni Şifre (Tekrar)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-purple-500 focus:bg-white/10 transition-all outline-none"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                          />
                          <button 
                            onClick={handleChangePassword}
                            disabled={isSaving || !passwords.next}
                            className="w-full mt-4 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                          >
                            Şifreyi Güncelle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'bildirimler' && (
                  <div className="space-y-12">
                    <header className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Bildirim Tercihleri</h2>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Nelerden haberdar olmak istersin?</p>
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
                  <div className="space-y-12">
                    <header className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Gizlilik</h2>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Görünürlüğünü ayarla</p>
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

                {activeTab === 'mal' && (
                  <div className="space-y-12">
                    <header className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">MyAnimeList</h2>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Listelerini senkronize et</p>
                    </header>

                    <div className="p-8 md:p-10 rounded-[2.5rem] bg-[#2E51A2]/10 border border-[#2E51A2]/30 space-y-8 relative overflow-hidden">
                      {/* Decorative Background for MAL */}
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#2E51A2]/20 blur-[80px] rounded-full pointer-events-none" />

                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-[#2E51A2] flex items-center justify-center text-white shadow-[0_0_30px_rgba(46,81,162,0.4)]">
                          <span className="font-black text-2xl italic tracking-tighter">MAL</span>
                        </div>
                        <div>
                          <p className="text-lg font-black text-white uppercase tracking-widest">Hesabını Bağla</p>
                          <p className="text-xs text-[#2E51A2] font-medium mt-1">Okuma listen otomatik güncellenir.</p>
                        </div>
                      </div>

                      <div className="space-y-4 relative z-10">
                        <input 
                          type="text" 
                          placeholder="MAL Kullanıcı Adın"
                          className="w-full bg-black/40 border border-[#2E51A2]/30 rounded-2xl py-5 px-6 text-white text-sm font-bold focus:border-[#2E51A2] focus:bg-black/60 transition-all outline-none"
                          value={malUsername}
                          onChange={(e) => setMalUsername(e.target.value)}
                        />
                        <button 
                          onClick={() => handleSave({ mal_username: malUsername })}
                          disabled={isSaving}
                          className="w-full py-5 rounded-2xl bg-[#2E51A2] text-white text-xs font-black uppercase tracking-widest shadow-[0_0_30px_rgba(46,81,162,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                          Bağlantıyı Kur / Güncelle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, value, placeholder, onSave, isSaving, type = "text" }) {
  const [val, setVal] = useState(value || '');
  
  useEffect(() => {
    setVal(value || '');
  }, [value]);

  return (
    <div className="space-y-3">
       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-2">{label}</label>
       <div className="relative group">
          <input 
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 pr-14 text-white text-sm font-bold focus:border-purple-500 focus:bg-white/5 transition-all outline-none"
          />
          <button 
            onClick={() => onSave(val)}
            disabled={isSaving || val === value}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg disabled:opacity-0 disabled:scale-90 transition-all hover:scale-105"
          >
             {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
          </button>
       </div>
    </div>
  );
}

function NotificationToggle({ title, desc, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-black/40 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group">
       <div className="space-y-1 pr-6 flex-1">
          <h4 className="text-sm font-black text-white uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{desc}</p>
       </div>
       <button 
          onClick={onToggle}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 p-1 flex items-center shrink-0 ${
            enabled ? 'bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/10'
          }`}
       >
          <motion.div 
            animate={{ x: enabled ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-5 h-5 bg-white rounded-full shadow-md"
          />
       </button>
    </div>
  );
}
