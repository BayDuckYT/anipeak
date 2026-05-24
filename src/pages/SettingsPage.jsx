import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Eye, Palette, Link as LinkIcon, 
  AlertTriangle, Settings as SettingsIcon, Check, Loader2, 
  Camera, ImageIcon, Zap, Swords, ChevronRight, Fingerprint, 
  Moon, Sun, Wind, Flame, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSEO } from '../hooks/useSEO';

// Geliştirilmiş Faction (Hane) Verileri
const HOUSES = [
  { 
    id: 'dragon', 
    name: 'Kızıl Ejder', 
    desc: 'Saldırgan ve lider ruhlular',
    icon: Flame,
    color: 'from-red-600 to-rose-900', 
    shadow: 'shadow-[0_0_40px_rgba(225,29,72,0.4)]', 
    border: 'border-red-500',
    glow: 'bg-red-500/20'
  },
  { 
    id: 'fox', 
    name: 'Gümüş Kitsune', 
    desc: 'Stratejik ve zeki olanlar',
    icon: Wind,
    color: 'from-purple-600 to-indigo-900', 
    shadow: 'shadow-[0_0_40px_rgba(147,51,234,0.4)]', 
    border: 'border-purple-500',
    glow: 'bg-purple-500/20'
  },
  { 
    id: 'wolf', 
    name: 'Buz Kurt', 
    desc: 'Dayanışmacı ve sadık olanlar',
    icon: Moon,
    color: 'from-blue-600 to-cyan-900', 
    shadow: 'shadow-[0_0_40px_rgba(37,99,235,0.4)]', 
    border: 'border-blue-500',
    glow: 'bg-blue-500/20'
  },
  { 
    id: 'phoenix', 
    name: 'Altın Anka', 
    desc: 'Küllerinden doğan azimliler',
    icon: Sun,
    color: 'from-amber-500 to-orange-900', 
    shadow: 'shadow-[0_0_40px_rgba(245,158,11,0.4)]', 
    border: 'border-amber-500',
    glow: 'bg-amber-500/20'
  },
];

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('hesap');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useSEO({
    title: 'Ayarlar | AniPeak',
    description: 'AniPeak komuta ve kontrol merkezi.',
    url: 'https://anipeak.com.tr/settings'
  });

  const [notifSettings, setNotifSettings] = useState({ newChapter: true, replies: true, system: true });
  const [privacySettings, setPrivacySettings] = useState({ publicProfile: true, showActivity: true });
  const [appearanceSettings, setAppearanceSettings] = useState({ theme: 'dark', animations: true, dataSaver: false });
  const [malUsername, setMalUsername] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

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
      alert('Kaydedilirken hata oluştu!');
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
    { id: 'hesap', label: 'Profil & Hane', icon: User, color: 'text-purple-400' },
    { id: 'guvenlik', label: 'Güvenlik', icon: Shield, color: 'text-emerald-400' },
    { id: 'gorunum', label: 'Görünüm', icon: Palette, color: 'text-pink-400' },
    { id: 'bildirimler', label: 'Bildirimler', icon: Bell, color: 'text-blue-400' },
    { id: 'gizlilik', label: 'Gizlilik', icon: Eye, color: 'text-amber-400' },
    { id: 'mal', label: 'MyAnimeList', icon: LinkIcon, color: 'text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-[#030208] text-zinc-100 font-sans pt-24 pb-20 relative overflow-hidden selection:bg-purple-500/30">
      
      {/* Cinematic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Futuristic Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full" />
              <Check size={18} strokeWidth={3} className="relative z-10" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Sistem Güncellendi</p>
              <p className="text-[10px] text-emerald-400/80 font-medium">Değişiklikler başarıyla kaydedildi.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
        
        {/* Header */}
        <header className="mb-14 px-4">
          <div className="flex items-end gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-black to-zinc-900 border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                 <SettingsIcon size={36} className="text-white" strokeWidth={1.5} />
              </div>
            </div>
            <div className="pb-2">
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 uppercase tracking-tighter">Ayarlar</h1>
              <p className="text-purple-400/80 text-xs font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <Fingerprint size={14} /> Komuta Merkezi
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Cyber Sidebar */}
          <aside className="w-full lg:w-[320px] shrink-0">
            <div className="sticky top-28 p-3 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl">
              <nav className="flex flex-col gap-1">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`relative flex items-center justify-between px-6 py-5 rounded-[2rem] transition-all duration-500 group overflow-hidden ${isActive ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav-bg"
                          className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent border-l-4 border-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10 shadow-lg' : 'group-hover:bg-white/5'}`}>
                          <item.icon size={20} className={`${isActive ? item.color : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                          {item.label}
                        </span>
                      </div>
                      
                      {isActive && <ChevronRight size={16} className="text-white/50 relative z-10" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-3 p-1">
                 <button className="w-full flex items-center justify-between px-6 py-5 rounded-[2rem] bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all group overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <ShieldAlert size={20} className="text-red-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-red-500">Tehlikeli Bölge</span>
                    </div>
                 </button>
              </div>
            </div>
          </aside>

          {/* Epic Main Content */}
          <main className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="bg-[#0A0A0F]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-6 md:p-12 shadow-2xl relative overflow-hidden min-h-[600px]"
              >
                {/* Glare effect */}
                <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                {activeTab === 'hesap' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Profil Kimliği</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Kişisel Veri Akışı</p>
                    </header>

                    {/* Cyber Avatar Section */}
                    <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent group hover:from-purple-500/20 transition-all duration-700">
                      <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] backdrop-blur-xl -z-10" />
                      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="relative">
                          {/* Holographic rings */}
                          <div className="absolute -inset-4 rounded-full border border-white/10 animate-[spin_10s_linear_infinite]" />
                          <div className="absolute -inset-8 rounded-full border border-dashed border-white/5 animate-[spin_20s_linear_infinite_reverse]" />
                          
                          <div className="w-36 h-36 rounded-full bg-black border-2 border-white/20 overflow-hidden flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] group-hover:border-purple-500/50 transition-colors duration-500">
                            {user?.avatar_url ? (
                              <img src={user.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                            ) : (
                              <User size={56} className="text-zinc-800" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm cursor-pointer">
                               <Camera size={24} className="text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-3">
                          <h3 className="text-4xl font-black text-white tracking-tighter flex items-center justify-center md:justify-start gap-4">
                            {user?.username}
                            {user?.is_elite && (
                              <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                                <Zap size={28} className="text-amber-400 fill-amber-400 relative z-10" />
                              </div>
                            )}
                          </h3>
                          <p className="text-zinc-400 font-medium tracking-wide">{user?.email}</p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                            <div className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
                              {user?.role}
                            </div>
                            <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-xs font-black uppercase tracking-[0.2em] text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                              Sistem Seviyesi: {user?.level || 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FuturisticInput 
                        label="Kullanıcı Adı" 
                        value={user?.username} 
                        placeholder="Yeni adın..."
                        onSave={(val) => handleSave({ username: val })}
                        isSaving={isSaving}
                      />
                      <FuturisticInput 
                        label="E-posta Adresi" 
                        value={user?.email} 
                        type="email"
                        placeholder="Yeni e-posta..."
                        onSave={(val) => handleSave({ email: val })}
                        isSaving={isSaving}
                      />
                    </div>

                    {/* Epic Faction Selection */}
                    <div className="pt-10 border-t border-white/5 space-y-8 relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Swords size={24} className="text-red-500" />
                            Haneni Seç
                          </h3>
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Kaderini belirle ve safını seç</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {HOUSES.map((house) => {
                          const isSelected = user?.house_id === house.id;
                          return (
                            <button
                              key={house.id}
                              onClick={() => handleSave({ house_id: house.id })}
                              className={`relative p-1 rounded-[2.5rem] transition-all duration-500 text-left group overflow-hidden ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                            >
                              {/* Background Gradient Border Effect */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${isSelected ? house.color : 'from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10'} rounded-[2.5rem] opacity-50`} />
                              
                              {/* Inner Glass */}
                              <div className={`relative h-full p-8 rounded-[2.4rem] bg-[#0A0A0F] border ${isSelected ? house.border : 'border-transparent'} backdrop-blur-xl overflow-hidden`}>
                                
                                {/* Ambient House Glow */}
                                {isSelected && (
                                  <div className={`absolute -right-20 -top-20 w-64 h-64 ${house.glow} blur-[80px] rounded-full pointer-events-none`} />
                                )}

                                <div className="relative z-10 flex items-start gap-6">
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${isSelected ? `bg-gradient-to-br ${house.color} ${house.border} ${house.shadow} text-white` : 'bg-white/5 border-white/10 text-zinc-500 group-hover:text-white group-hover:border-white/30'}`}>
                                    <house.icon size={28} strokeWidth={1.5} />
                                  </div>
                                  <div className="flex-1 pt-1">
                                    <h4 className={`text-xl font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-white drop-shadow-md' : 'text-zinc-400 group-hover:text-white'}`}>
                                      {house.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 leading-relaxed">
                                      {house.desc}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Active Indicator */}
                                <div className={`absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${isSelected ? house.border : 'border-white/10 group-hover:border-white/30'}`}>
                                  <motion.div 
                                    initial={false}
                                    animate={{ scale: isSelected ? 1 : 0 }}
                                    className={`w-3 h-3 rounded-full bg-gradient-to-br ${house.color} ${house.shadow}`}
                                  />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'gorunum' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Görünüm & Motor</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Arayüz ve Performans Ayarları</p>
                    </header>

                    <div className="space-y-10">
                      <div>
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] block mb-6">Arayüz Teması</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <button 
                            onClick={() => handleSave({ appearance_settings: { ...appearanceSettings, theme: 'dark' } })}
                            className={`relative p-8 rounded-[2.5rem] border transition-all text-left group overflow-hidden ${appearanceSettings.theme === 'dark' ? 'bg-[#13111C] border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${appearanceSettings.theme === 'dark' ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                                 <ImageIcon size={24} />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Standart Koyu</h4>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Dengeli kontrast</p>
                              </div>
                            </div>
                          </button>
                          <button 
                            onClick={() => handleSave({ appearance_settings: { ...appearanceSettings, theme: 'amoled' } })}
                            className={`relative p-8 rounded-[2.5rem] border transition-all text-left group overflow-hidden ${appearanceSettings.theme === 'amoled' ? 'bg-[#000000] border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${appearanceSettings.theme === 'amoled' ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                                 <Zap size={24} />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Ultra Siyah</h4>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Saf siyah pikseller</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 space-y-6">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] block">Sistem Parametreleri</label>
                        <EpicToggle 
                          icon={Sparkles}
                          title="Sinematik Animasyonlar" 
                          desc="Sitedeki parçacık efektlerini, glowları ve yumuşak geçişleri açar. Kapatırsan performans artar."
                          enabled={appearanceSettings.animations}
                          onToggle={() => handleSave({ appearance_settings: { ...appearanceSettings, animations: !appearanceSettings.animations } })}
                        />
                        <EpicToggle 
                          icon={Shield}
                          title="Okuyucu Veri Tasarrufu" 
                          desc="Okuyucuda sonraki sayfaları erkenden indirmeyi durdurur. İnternet kotası kısıtlı olanlar için."
                          enabled={appearanceSettings.dataSaver}
                          onToggle={() => handleSave({ appearance_settings: { ...appearanceSettings, dataSaver: !appearanceSettings.dataSaver } })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'guvenlik' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Güvenlik Ağı</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Şifreleme ve Erişim Yönetimi</p>
                    </header>

                    <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent">
                      <div className="absolute inset-0 bg-black/60 rounded-[3rem] backdrop-blur-2xl -z-10" />
                      <div className="p-10 md:p-14">
                        <div className="flex items-center gap-6 mb-10">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                            <ShieldAlert size={28} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Şifre Güncelleme</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Erişim anahtarını yenile</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <input 
                            type="password" 
                            placeholder="Mevcut Şifre"
                            className="w-full bg-black/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white text-sm font-bold focus:border-white focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <input 
                              type="password" 
                              placeholder="Yeni Şifre"
                              className="w-full bg-black/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white text-sm font-bold focus:border-white focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
                              value={passwords.next}
                              onChange={(e) => setPasswords({...passwords, next: e.target.value})}
                            />
                            <input 
                              type="password" 
                              placeholder="Yeni Şifre (Tekrar)"
                              className="w-full bg-black/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white text-sm font-bold focus:border-white focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
                              value={passwords.confirm}
                              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            />
                          </div>
                          
                          <div className="pt-6">
                            <button 
                              onClick={handleChangePassword}
                              disabled={isSaving || !passwords.next}
                              className="w-full py-6 rounded-[2rem] bg-white text-black text-sm font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                            >
                              Güvenlik Protokolünü Onayla
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'bildirimler' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Sinyal Ağları</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Haberleşme Tercihleri</p>
                    </header>

                    <div className="space-y-6">
                      <EpicToggle 
                        icon={Bell}
                        title="Yeni Bölüm Alarmı" 
                        desc="Takip ettiğin serilere yeni bölüm eklendiğinde anında haberin olsun."
                        enabled={notifSettings.newChapter}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, newChapter: !notifSettings.newChapter } })}
                      />
                      <EpicToggle 
                        icon={User}
                        title="Yorum Etkileşimleri" 
                        desc="Yaptığın yorumlara birisi yanıt verdiğinde veya beğendiğinde bildirim al."
                        enabled={notifSettings.replies}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, replies: !notifSettings.replies } })}
                      />
                      <EpicToggle 
                        icon={AlertTriangle}
                        title="Sistem Duyuruları" 
                        desc="Bakım modu, kritik güncellemeler ve platform duyuruları."
                        enabled={notifSettings.system}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, system: !notifSettings.system } })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'gizlilik' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gölge Modu</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Gizlilik ve Görünürlük</p>
                    </header>

                    <div className="space-y-6">
                      <EpicToggle 
                        icon={Eye}
                        title="Profil Görünürlüğü" 
                        desc="Profilinin diğer kullanıcılar tarafından incelenmesine izin ver."
                        enabled={privacySettings.publicProfile}
                        onToggle={() => handleSave({ privacy_settings: { ...privacySettings, publicProfile: !privacySettings.publicProfile } })}
                      />
                      <EpicToggle 
                        icon={Zap}
                        title="Aktivite Radarı" 
                        desc="Şu an ne okuduğunun ve listelerinin başkaları tarafından görülmesine izin ver."
                        enabled={privacySettings.showActivity}
                        onToggle={() => handleSave({ privacy_settings: { ...privacySettings, showActivity: !privacySettings.showActivity } })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'mal' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Veritabanı Bağlantısı</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">MyAnimeList Senkronizasyonu</p>
                    </header>

                    <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-[#2E51A2]/30 to-transparent overflow-hidden">
                      <div className="absolute inset-0 bg-black/80 rounded-[3rem] backdrop-blur-2xl -z-10" />
                      <div className="absolute -right-40 -top-40 w-96 h-96 bg-[#2E51A2]/30 blur-[120px] rounded-full pointer-events-none" />
                      
                      <div className="p-10 md:p-14 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-10 mb-10">
                          <div className="w-24 h-24 rounded-[2.5rem] bg-[#2E51A2] flex items-center justify-center text-white shadow-[0_0_50px_rgba(46,81,162,0.5)] border border-white/20">
                            <span className="font-black text-4xl italic tracking-tighter">MAL</span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest">Global Eşitleme</h3>
                            <p className="text-[11px] text-[#2E51A2] font-bold uppercase tracking-[0.2em] mt-2 leading-relaxed max-w-sm">
                              Hesabını bağla ve okuma listelerinin otomatik olarak MyAnimeList sunucularıyla eşitlenmesini sağla.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="relative">
                            <div className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-600">
                              <User size={20} />
                            </div>
                            <input 
                              type="text" 
                              placeholder="MAL Kullanıcı Adın"
                              className="w-full bg-black/60 border border-[#2E51A2]/30 rounded-[2rem] py-6 pl-20 pr-8 text-white text-base font-bold focus:border-[#2E51A2] focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
                              value={malUsername}
                              onChange={(e) => setMalUsername(e.target.value)}
                            />
                          </div>
                          
                          <button 
                            onClick={() => handleSave({ mal_username: malUsername })}
                            disabled={isSaving}
                            className="w-full py-6 rounded-[2rem] bg-[#2E51A2] text-white text-sm font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(46,81,162,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                          >
                            Uplink Kur / Güncelle
                          </button>
                        </div>
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

// ── Ozel Komponentler ────────────────────────────────────────────────────────

function FuturisticInput({ label, value, placeholder, onSave, isSaving, type = "text" }) {
  const [val, setVal] = useState(value || '');
  
  useEffect(() => {
    setVal(value || '');
  }, [value]);

  return (
    <div className="space-y-4">
       <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] block ml-4">{label}</label>
       <div className="relative group">
          <input 
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/40 border border-white/5 rounded-[2rem] py-5 px-8 pr-20 text-white text-sm font-bold focus:border-white focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
          />
          <button 
            onClick={() => onSave(val)}
            disabled={isSaving || val === value}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[1.5rem] bg-white flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-0 disabled:scale-50 transition-all duration-300 hover:scale-105"
          >
             {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
          </button>
       </div>
    </div>
  );
}

function EpicToggle({ icon: Icon, title, desc, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-black/40 border border-white/5 hover:border-white/20 transition-all duration-500 group overflow-hidden relative">
       {/* Hover Glow */}
       <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
       
       <div className="flex items-center gap-6 relative z-10 flex-1 pr-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${enabled ? 'bg-white text-black border-transparent shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
            <Icon size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-widest">{title}</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 leading-relaxed max-w-lg">{desc}</p>
          </div>
       </div>

       <button 
          onClick={onToggle}
          className={`relative w-20 h-10 rounded-full transition-all duration-500 p-1 flex items-center shrink-0 border relative z-10 ${
            enabled ? 'bg-white/20 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-black/60 border-white/10'
          }`}
       >
          <motion.div 
            animate={{ x: enabled ? 40 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`w-8 h-8 rounded-full shadow-lg ${enabled ? 'bg-white' : 'bg-zinc-600'}`}
          />
       </button>
    </div>
  );
}
