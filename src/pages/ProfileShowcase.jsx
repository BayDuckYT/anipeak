import { useState, useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  BookOpen, 
  Star, 
  History, 
  MessageSquare, 
  Share2,
  Calendar,
  Award,
  Link as LinkIcon,
  UserPlus,
  Mail,
  Instagram,
  Twitter,
  Github,
  Youtube,
  Settings as SettingsIcon,
  Edit3,
  Plus,
  Eye,
  EyeOff,
  Palette,
  Image as ImageIcon,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import Decoration from '../components/Decoration';
import effectsData from '../data/effects.json';

export default function ProfileShowcase() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('listeler');
  
  // Handle Hash-based Tabs
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['listeler', 'basarimlar', 'etkinlik', 'customize'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  const isOwnProfile = currentUser?.username === username;
  
  // Mock/Fallback data
  const displayUser = isOwnProfile ? currentUser : {
    username: username,
    role: 'Üye',
    bio: 'Henüz bir biyografi eklenmemiş.',
    avatar_url: null,
    xp: 90,
    level: 1,
    joinDate: '29 Nis 2026',
    followers: 0,
    following: 0,
    favorites: 0,
    comments: 0,
    socialLinks: []
  };

  const selectedDecoration = effectsData.avatarDecorations[0];
  const selectedNameplate = effectsData.nameplates[1];

  const tabs = [
    { id: 'listeler', label: 'Listeler', icon: BookOpen },
    { id: 'basarimlar', label: 'Başarımlar', icon: Award },
    { id: 'etkinlik', label: 'Etkinlik', icon: History },
    { id: 'customize', label: 'Özelleştir', icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 font-sans selection:bg-purple-500/30 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT SIDEBAR: User Info */}
          <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] overflow-hidden shadow-2xl">
              {/* Profile Header */}
              <div className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-[-15%] z-20 pointer-events-none">
                    <Decoration effect={selectedDecoration} />
                  </div>
                  <div className="w-full h-full rounded-full border-[6px] border-zinc-900 bg-zinc-800 overflow-hidden relative z-10 shadow-2xl">
                    {displayUser.avatar_url ? (
                      <img src={displayUser.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-3xl font-black text-white/20 uppercase">
                        {displayUser.username?.[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                    {displayUser.username}
                    <span className="text-[10px] font-black bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">SV.{displayUser.level || 1}</span>
                  </h2>
                  <p className="text-zinc-500 text-[10px] font-medium tracking-wider uppercase">anipeak.com/profil/{displayUser.username}</p>
                </div>

                <p className="text-zinc-400 text-xs italic font-medium">
                  "{displayUser.bio || 'Henüz bir biyografi eklenmemiş.'}"
                </p>

                {isOwnProfile && (
                  <div className="flex gap-2 w-full pt-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-[10px] font-black uppercase hover:bg-zinc-800 transition-all">
                      <Edit3 size={14} /> Biyografiyi Düzenle
                    </button>
                    <button className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white">
                      <LinkIcon size={16} />
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black uppercase shadow-lg shadow-purple-500/20">
                      PRO
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-5 border-y border-zinc-800/50 bg-zinc-950/30">
                {[
                  { label: 'TAKİPÇİ', value: displayUser.followers || 0 },
                  { label: 'TAKİP', value: displayUser.following || 0 },
                  { label: 'FAVORİ', value: displayUser.favorites || 0 },
                  { label: 'TAKİP', value: 0 },
                  { label: 'YORUM', value: displayUser.comments || 0 },
                ].map((stat, i) => (
                  <div key={i} className="py-4 flex flex-col items-center justify-center gap-0.5 border-r last:border-0 border-zinc-800/50">
                    <span className="text-xs font-black text-white">{stat.value}</span>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-tighter">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Footer Info */}
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <Calendar size={14} /> {displayUser.joinDate || '29 Nis 2026'} Tarihinden Beri Üye
                </div>

                {/* Social Links */}
                <div className="space-y-3">
                  <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">BAĞLANTILAR</h3>
                  <div className="flex flex-col gap-2 text-center text-zinc-500 text-[10px] font-medium py-4 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800/50">
                    Sosyal hesaplarını ekle
                    <button className="mx-auto mt-1 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[9px] font-black uppercase transition-all">
                      <Plus size={12} /> Bağlantı Ekle
                    </button>
                  </div>
                </div>

                {/* XP Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">SEVİYE {displayUser.level || 1}</span>
                    <span className="text-zinc-400">{displayUser.xp || 0} / 100 XP</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(displayUser.xp || 0, 100)}%` }}
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-500" 
                    />
                  </div>
                </div>

                {/* Achievements Preview */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">BAŞARIMLAR</h3>
                     <span className="text-[9px] font-black text-zinc-500">0/50</span>
                   </div>
                   <div className="grid grid-cols-5 gap-2">
                     {[...Array(5)].map((_, i) => (
                       <div key={i} className="aspect-square rounded-lg bg-zinc-950/50 border border-zinc-800/50 flex items-center justify-center text-zinc-800">
                         <Award size={14} />
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT: Tabs & Sections */}
          <main className="flex-1 min-w-0 space-y-6">
            
            {/* Tab Navigation */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-zinc-800 text-white shadow-xl' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </a>
              ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] p-8 min-h-[600px]"
              >
                {activeTab === 'listeler' && (
                  <div className="space-y-12">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">Anime Listeleri (0)</h3>
                          <p className="text-zinc-500 text-xs">Özel anime koleksiyonları</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase hover:bg-zinc-700 transition-all">
                        <Plus size={14} /> Yeni Liste
                      </button>
                    </div>

                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                       <div className="p-6 rounded-full bg-zinc-950/50 text-zinc-800">
                         <BookOpen size={48} />
                       </div>
                       <div className="space-y-1">
                         <p className="text-zinc-500 text-sm font-medium">Henüz bir listen yok. İlk listeni oluştur!</p>
                       </div>
                       <button className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black uppercase shadow-lg shadow-purple-500/20 hover:scale-105 transition-all">
                         Liste Oluştur
                       </button>
                    </div>

                    <div className="pt-12 border-t border-zinc-800/50">
                       <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                               <img src="https://myanimelist.net/favicon.ico" className="w-6 h-6 grayscale brightness-200" />
                            </div>
                            <div>
                               <h3 className="text-sm font-black text-white uppercase tracking-tight">MyAnimeList</h3>
                               <p className="text-zinc-500 text-[10px] font-bold">Bağlı değil</p>
                            </div>
                         </div>
                         <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase hover:bg-zinc-700 transition-all">
                           MAL Bağla
                         </button>
                       </div>
                       <p className="text-center text-zinc-500 text-xs font-medium">
                         MAL hesabını bağlayarak anime listeni buraya aktarabilirsin.
                       </p>
                    </div>
                  </div>
                )}

                {activeTab === 'customize' && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                          <Palette size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">Profil Özelleştir</h3>
                          <p className="text-zinc-500 text-xs">Premium özelliklerin kilidini aç</p>
                        </div>
                    </div>

                    {/* Privacy Toggle */}
                    <div className="p-6 rounded-3xl bg-zinc-950/30 border border-zinc-800/50 space-y-6">
                       <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                         <Eye size={14} /> ETKİNLİK GİZLİLİĞİ
                       </h4>
                       <div className="flex items-center justify-between">
                         <div className="space-y-1">
                           <p className="text-white text-sm font-bold">Etkinliğimi Göster</p>
                           <p className="text-zinc-500 text-[10px]">Profilinde ne izlediğini başkalarının görmesini sağla</p>
                         </div>
                         <div className="w-12 h-6 rounded-full bg-purple-600 p-1 flex justify-end cursor-pointer">
                           <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                         </div>
                       </div>
                    </div>

                    {/* Character Frames Grid */}
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                         <ImageIcon size={14} /> KARAKTER ÇERÇEVESİ
                       </h4>
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                         {effectsData.avatarDecorations.map((effect, idx) => (
                           <div key={idx} className="group flex flex-col items-center gap-3">
                              <div className={`relative w-24 h-24 rounded-2xl bg-zinc-950/50 border transition-all cursor-pointer flex items-center justify-center ${displayUser.active_decoration === effect.id ? 'border-purple-500' : 'border-zinc-800 hover:border-zinc-700'}`}>
                                 <div className="absolute inset-[-10%] z-20 pointer-events-none">
                                    <Decoration effect={effect} />
                                 </div>
                                 <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden relative z-10">
                                   <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                      <User size={32} />
                                   </div>
                                 </div>
                              </div>
                              <span className="text-[9px] font-black text-zinc-500 uppercase text-center group-hover:text-zinc-300 truncate w-full">{effect.name}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                )}

                {(activeTab === 'basarimlar' || activeTab === 'etkinlik') && (
                   <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
                      <div className="p-4 rounded-full bg-zinc-950 text-zinc-800">
                        {activeTab === 'basarimlar' ? <Award size={48} /> : <History size={48} />}
                      </div>
                      <p className="text-zinc-500 text-sm font-medium">Bu bölüme ait bir veri bulunamadı.</p>
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

