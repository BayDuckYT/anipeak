import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  Palette, 
  Bell, 
  ShieldCheck, 
  CreditCard,
  LogOut,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Check,
  Info,
  Zap,
  Globe,
  Link as LinkIcon,
  X,
  Loader2,
  Lock,
  MessageSquare,
  Instagram,
  Twitter,
  Youtube,
  Github
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Decoration from '../components/Decoration';
import effectsData from '../data/effects.json';

const AVATAR_DECORATIONS = effectsData.avatarDecorations;
const NAMEPLATES = effectsData.nameplates;

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile Form States
  const [username, setUsername] = useState(user?.username || 'Murathan');
  const [bio, setBio] = useState(user?.bio || 'AniPeak Global Üyesi');
  const [selectedDecoration, setSelectedDecoration] = useState(AVATAR_DECORATIONS[0]);
  const [selectedNameplate, setSelectedNameplate] = useState(NAMEPLATES[1]);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || 'https://github.com/shadcn.png');
  const [bannerUrl, setBannerUrl] = useState(user?.banner_url || 'https://images.unsplash.com/photo-1614850523296-e84e09ad8a73?q=80&w=2070&auto=format&fit=crop');

  // Interactive States
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showDecoModal, setShowDecoModal] = useState(false);
  const [showPlateModal, setShowPlateModal] = useState(false);

  const menuItems = [
    { id: 'profile', label: 'Kullanıcı Profili', icon: User },
    { id: 'account', label: 'Hesap Ayarları', icon: Settings },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
  ];

  const handleSave = () => {
    setIsSaving(true);
    // Simulated API call
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 font-sans selection:bg-purple-500/30 pt-20 pb-20">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 bg-zinc-900 border border-emerald-500/50 rounded-2xl shadow-2xl shadow-emerald-500/10"
          >
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500">
              <Check size={20} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight text-white">BAŞARILI!</p>
              <p className="text-[10px] font-bold text-zinc-500">Değişiklikler sisteme mühürlendi daa.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Modals */}
      <AnimatePresence>
        {(showDecoModal || showPlateModal) && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => { setShowDecoModal(false); setShowPlateModal(false); }}
               className="absolute inset-0 bg-black/90 backdrop-blur-md" 
             />
             
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-2xl bg-[#0F1219] border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    {showDecoModal ? <Sparkles className="text-purple-500" /> : <ImageIcon className="text-blue-500" />}
                    {showDecoModal ? 'AVATAR DEKORASYONU' : 'İSİM PLAKASI (BANNER)'}
                  </h3>
                  <button 
                    onClick={() => { setShowDecoModal(false); setShowPlateModal(false); }}
                    className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all hover:rotate-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar grid grid-cols-2 sm:grid-cols-3 gap-4">
                   {(showDecoModal ? AVATAR_DECORATIONS : NAMEPLATES).map((item) => (
                     <button 
                       key={item.id}
                       onClick={() => {
                         if (showDecoModal) setSelectedDecoration(item);
                         else setSelectedNameplate(item);
                       }}
                       className={`group relative p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                         (showDecoModal ? selectedDecoration.id : selectedNameplate.id) === item.id 
                           ? 'border-purple-600 bg-purple-600/5 shadow-neon-purple' 
                           : 'border-zinc-800 bg-zinc-950/30 hover:border-zinc-700'
                       } hover:scale-105 active:scale-95`}
                     >
                        <div className="relative w-20 h-20">
                           {showDecoModal ? (
                             <>
                               <div className="absolute inset-[-15%] z-20 pointer-events-none">
                                  <Decoration effect={item} />
                               </div>
                               <div className="w-full h-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden relative z-10 flex items-center justify-center">
                                  <User size={32} className="text-zinc-800" />
                               </div>
                             </>
                           ) : (
                             <div className="w-full h-full rounded-2xl overflow-hidden relative border border-zinc-800 bg-zinc-900">
                                {item.video && <video src={item.video} autoPlay loop muted className="w-full h-full object-cover opacity-80 mix-blend-screen" />}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-black uppercase tracking-widest italic" style={{ color: item.color }}>NAME</span>
                                </div>
                             </div>
                           )}
                        </div>
                        <span className="text-[9px] font-black uppercase text-zinc-500 group-hover:text-zinc-300 truncate w-full text-center tracking-widest">{item.name}</span>
                        {(showDecoModal ? selectedDecoration.id : selectedNameplate.id) === item.id && (
                          <div className="absolute top-3 right-3 p-1 rounded-full bg-purple-600 text-white shadow-lg scale-110">
                            <Check size={8} />
                          </div>
                        )}
                     </button>
                   ))}
                </div>

                <div className="p-8 border-t border-zinc-800 bg-zinc-950/30 flex justify-end">
                   <button 
                     onClick={() => { setShowDecoModal(false); setShowPlateModal(false); }}
                     className="px-10 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                   >
                     SEÇİMİ MÜHÜRLE
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-[300px] shrink-0">
            <div className="sticky top-24 space-y-8">
              <div className="px-4">
                <h1 className="text-3xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-zinc-600 bg-clip-text text-transparent uppercase italic">
                  AYARLAR
                </h1>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  PROFİLİNİ JİLET GİBİ YAP
                </p>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full group flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${
                      activeTab === item.id 
                        ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/30 border-purple-500 hover:scale-105' 
                        : 'bg-zinc-900/50 hover:bg-zinc-800 border-transparent text-zinc-500 hover:text-zinc-300 hover:scale-[1.02]'
                    } active:scale-95`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-zinc-600 group-hover:text-purple-400'} />
                      <span className="text-xs font-black uppercase tracking-tight">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight size={14} className={`transition-all ${activeTab === item.id ? 'text-white translate-x-1' : 'text-zinc-800 group-hover:translate-x-1'}`} />
                  </button>
                ))}
              </nav>

              <div className="pt-8 border-t border-zinc-800 px-2">
                <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all font-black text-xs uppercase group hover:scale-[1.02] active:scale-95">
                  <LogOut size={20} />
                  Oturumu Kapat
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0F1219]/40 backdrop-blur-xl border border-zinc-800/50 rounded-[3rem] p-8 lg:p-14 shadow-2xl relative min-h-[700px] flex flex-col"
              >
                {/* Content */}
                <div className="flex-1">
                  {activeTab === 'profile' && (
                    <div className="space-y-16">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                        {/* Forms Column */}
                        <div className="space-y-12">
                          <section className="space-y-6">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                              <Camera size={14} /> PROFİL GÖRSELLERİ
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <button className="group relative aspect-square rounded-3xl border-2 border-zinc-800/50 bg-zinc-950 overflow-hidden cursor-pointer hover:border-purple-500/50 hover:scale-[1.02] active:scale-95 transition-all">
                                <img src={avatarUrl} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                  <div className="p-3 rounded-2xl bg-zinc-900 group-hover:text-purple-400 group-hover:scale-110 transition-all"><Camera size={24} /></div>
                                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Avatar Değiştir</span>
                                </div>
                              </button>
                              <button className="group relative aspect-square rounded-3xl border-2 border-zinc-800/50 bg-zinc-950 overflow-hidden cursor-pointer hover:border-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all">
                                <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                  <div className="p-3 rounded-2xl bg-zinc-900 group-hover:text-blue-400 group-hover:scale-110 transition-all"><ImageIcon size={24} /></div>
                                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Banner Değiştir</span>
                                </div>
                              </button>
                            </div>
                          </section>

                          <section className="space-y-6">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                              <User size={14} /> TEMEL BİLGİLER
                            </h3>
                            <div className="space-y-5">
                              <div>
                                <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 ml-1">Kullanıcı Adı</label>
                                <input 
                                  type="text" 
                                  value={username} 
                                  onChange={e => setUsername(e.target.value)} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs font-bold focus:border-purple-600 transition-all hover:scale-[1.01] active:scale-[0.99]" 
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 ml-1">Biyografi</label>
                                <textarea 
                                  value={bio} 
                                  onChange={e => setBio(e.target.value)} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-white text-xs font-medium focus:border-purple-600 transition-all h-32 resize-none hover:scale-[1.01] active:scale-[0.99]" 
                                />
                              </div>
                            </div>
                          </section>

                          <section className="space-y-6">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                              <Sparkles size={14} className="text-amber-500" /> ÖZELLEŞTİRME
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                               <button 
                                 onClick={() => setShowDecoModal(true)}
                                 className="flex items-center justify-between p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-purple-600 transition-all group hover:scale-[1.02] active:scale-95"
                               >
                                 <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white">Efekt Seç</span>
                                 <Sparkles size={16} className="text-zinc-700 group-hover:text-purple-500" />
                               </button>
                               <button 
                                 onClick={() => setShowPlateModal(true)}
                                 className="flex items-center justify-between p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-blue-600 transition-all group hover:scale-[1.02] active:scale-95"
                               >
                                 <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white">İsim Plakası</span>
                                 <ImageIcon size={16} className="text-zinc-700 group-hover:text-blue-500" />
                               </button>
                            </div>
                          </section>
                        </div>

                        {/* Preview Column */}
                        <div className="xl:sticky xl:top-32 h-fit space-y-6">
                          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Globe size={14} className="text-emerald-400" /> CANLI ÖNİZLEME
                          </h3>
                          <div className="w-full max-w-[400px] mx-auto rounded-[3rem] bg-[#050507] border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
                            <div className="h-32 relative overflow-hidden bg-zinc-900">
                              <AnimatePresence mode="wait">
                                {selectedNameplate.video && (
                                  <motion.video 
                                    key={selectedNameplate.video}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                    exit={{ opacity: 0 }}
                                    src={selectedNameplate.video} 
                                    autoPlay loop muted 
                                    className="w-full h-full object-cover mix-blend-screen" 
                                  />
                                )}
                              </AnimatePresence>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-90" />
                            </div>
                            <div className="px-8 pb-10 -mt-12 relative z-20">
                              <div className="relative w-28 h-28 mb-6">
                                <div className="absolute inset-[-15%] z-20 pointer-events-none">
                                  <Decoration effect={selectedDecoration} />
                                </div>
                                <div className="w-full h-full rounded-[2.5rem] border-[6px] border-[#050507] bg-zinc-900 overflow-hidden relative z-10 shadow-2xl flex items-center justify-center">
                                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                              </div>
                              <div className="space-y-4 relative">
                                 {selectedNameplate.video && (
                                   <div className="absolute inset-0 -mx-6 pointer-events-none overflow-hidden z-0">
                                     <video src={selectedNameplate.video} autoPlay loop muted className="w-full h-full object-cover mix-blend-screen opacity-40" />
                                   </div>
                                 )}
                                 <div className="relative z-10">
                                  <h4 className="text-2xl font-black italic tracking-tighter text-white uppercase" style={{ color: selectedNameplate.color }}>{username}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black uppercase text-zinc-500">LEVEL 1</span>
                                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                    <span className="text-[9px] font-bold text-zinc-600 tracking-wider">@{username.toLowerCase().replace(/\s/g, '')}</span>
                                  </div>
                                 </div>
                                 <p className="text-[10px] text-zinc-400 leading-relaxed font-medium bg-zinc-900/50 p-4 rounded-2xl border border-white/5">{bio}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab !== 'profile' && (
                    <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                       <div className="p-6 rounded-full bg-zinc-900/50 text-zinc-700 animate-pulse">
                          <Settings size={48} />
                       </div>
                       <div className="space-y-2">
                         <h3 className="text-xl font-black text-zinc-400 uppercase tracking-tight">BU BÖLÜM ŞANTİYE HALİNDE!</h3>
                         <p className="text-zinc-600 text-xs font-medium">Uşağım burayı henüz inşa ediyoruz, çok yakında jilet gibi olacak daa! 🚀</p>
                       </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-12 pt-10 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-3 text-zinc-600">
                      <Clock size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Son güncelleme: Az önce</span>
                   </div>
                   <button 
                     onClick={handleSave}
                     disabled={isSaving}
                     className="w-full sm:w-[300px] h-[64px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-600/30 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:scale-100"
                   >
                     {isSaving ? (
                       <>
                         <Loader2 size={18} className="animate-spin" />
                         Mühürleniyor...
                       </>
                     ) : (
                       <>
                         <Check size={18} />
                         DEĞİŞİKLİKLERİ KAYDET
                       </>
                     )}
                   </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
