import { useState } from 'react';
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
  Link as LinkIcon
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
  const [selectedNameplate, setSelectedNameplate] = useState(NAMEPLATES[0]);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || 'https://github.com/shadcn.png');
  const [bannerUrl, setBannerUrl] = useState(user?.banner_url || 'https://images.unsplash.com/photo-1614850523296-e84e09ad8a73?q=80&w=2070&auto=format&fit=crop');

  const menuItems = [
    { id: 'profile', label: 'Kullanıcı Profili', icon: User },
    { id: 'account', label: 'Hesap Ayarları', icon: Settings },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 font-sans selection:bg-purple-500/30 pt-20">
      <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-[280px] shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent uppercase">
                  AYARLAR
                </h1>
                <p className="text-zinc-500 text-xs">
                  Hesabını ve deneyimini buradan yönetebilirsin.
                </p>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all border border-transparent ${
                      activeTab === item.id 
                        ? 'bg-purple-500/10 border-purple-500/20 text-white shadow-lg' 
                        : 'hover:bg-zinc-800/50 hover:border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${activeTab === item.id ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-900 group-hover:text-purple-400'}`}>
                        <item.icon size={18} />
                      </div>
                      <span className="text-sm font-semibold">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight size={14} className={`transition-all ${activeTab === item.id ? 'text-purple-400' : 'text-zinc-600 group-hover:translate-x-0.5'}`} />
                  </button>
                ))}
              </nav>

              <div className="pt-6 border-t border-zinc-800">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm group">
                  <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-red-500/20 transition-colors">
                    <LogOut size={18} />
                  </div>
                  Çıkış Yap
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-[2rem] p-6 md:p-10 shadow-2xl">
            {activeTab === 'profile' && (
              <div className="space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">PROFİL ÖZELLEŞTİRME</h2>
                    <p className="text-zinc-500 text-sm">Profilini ve görsellerini buradan düzenleyebilirsin.</p>
                  </div>
                  <button className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 shadow-neon-purple transition-all flex items-center gap-2 group">
                    <Check size={18} className="group-hover:scale-110 transition-transform" />
                    KAYDET
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  {/* Forms */}
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Camera size={14} /> GÖRSEL VARLIKLAR
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="group relative aspect-square rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden cursor-pointer">
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <Camera size={20} className="text-zinc-400 group-hover:text-purple-400" />
                            <span className="text-[10px] font-black text-zinc-500 uppercase">AVATAR DEĞİŞTİR</span>
                          </div>
                        </div>
                        <div className="group relative aspect-square rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden cursor-pointer">
                          <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <ImageIcon size={20} className="text-zinc-400 group-hover:text-purple-400" />
                            <span className="text-[10px] font-black text-zinc-500 uppercase">BANNER DEĞİŞTİR</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Kullanıcı Adı</label>
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:border-purple-500 transition-all text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Biyografi</label>
                          <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:border-purple-500 transition-all text-sm h-24 resize-none" />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <LinkIcon size={14} /> SOSYAL BAĞLANTILAR
                      </h3>
                      <div className="space-y-4">
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-zinc-900 text-pink-500 group-focus-within:bg-pink-500/20 transition-all">
                            <Instagram size={16} />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Instagram Kullanıcı Adı" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-14 pr-4 text-zinc-100 focus:border-pink-500 transition-all text-sm" 
                          />
                        </div>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-zinc-900 text-blue-400 group-focus-within:bg-blue-400/20 transition-all">
                            <Twitter size={16} />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Twitter Kullanıcı Adı" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-14 pr-4 text-zinc-100 focus:border-blue-400 transition-all text-sm" 
                          />
                        </div>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-zinc-900 text-indigo-400 group-focus-within:bg-indigo-400/20 transition-all">
                            <MessageSquare size={16} />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Discord Kullanıcı Adı (Örn: murathan#0001)" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-14 pr-4 text-zinc-100 focus:border-indigo-500 transition-all text-sm" 
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-400" /> DEKORASYONLAR
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {AVATAR_DECORATIONS.map(effect => (
                          <button key={effect.id} onClick={() => setSelectedDecoration(effect)} className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 group ${selectedDecoration.id === effect.id ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
                            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden relative">
                              <Decoration effect={effect} />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 truncate w-full text-center">{effect.name}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Live Preview */}
                  <div className="xl:sticky xl:top-24 h-fit">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Globe size={14} className="text-blue-400" /> CANLI ÖNİZLEME
                    </h3>
                    <div className="w-full max-w-[380px] mx-auto rounded-[2.5rem] bg-[#050507] border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
                      <div className="h-28 relative overflow-hidden bg-zinc-900">
                        {selectedNameplate.video && <video key={selectedNameplate.video} src={selectedNameplate.video} autoPlay loop muted className="w-full h-full object-cover mix-blend-screen opacity-80" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] to-transparent opacity-80" />
                      </div>
                      <div className="px-6 pb-8 -mt-10 relative z-20">
                        <div className="relative w-24 h-24 mb-4">
                          <div className="absolute inset-[-15%] z-20 pointer-events-none">
                            <Decoration effect={selectedDecoration} />
                          </div>
                          <div className="w-full h-full rounded-[2rem] border-[4px] border-[#050507] bg-zinc-900 overflow-hidden relative z-10 shadow-2xl flex items-center justify-center">
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="space-y-3 relative">
                           {selectedNameplate.video && (
                             <div className="absolute inset-0 -mx-4 pointer-events-none overflow-hidden z-0">
                               <video src={selectedNameplate.video} autoPlay loop muted className="w-full h-full object-cover mix-blend-screen opacity-50" />
                             </div>
                           )}
                           <div className="relative z-10">
                            <h4 className="text-xl font-black italic tracking-tight text-white uppercase" style={{ color: selectedNameplate.color }}>{username}</h4>
                            <p className="text-[10px] font-bold text-zinc-500">@{username.toLowerCase().replace(' ', '')}</p>
                           </div>
                           <p className="text-[10px] text-zinc-400 leading-relaxed italic bg-zinc-900/50 p-3 rounded-xl border border-white/5">{bio}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab !== 'profile' && (
               <div className="py-20 text-center">
                  <p className="text-zinc-500 text-sm">Bu sekme çok yakında aktif edilecek uşağım! 🚀</p>
               </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
