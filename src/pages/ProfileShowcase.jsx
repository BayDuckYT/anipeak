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
  User,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import SiberAvatar from '../components/SiberAvatar.jsx';
import effectsData from '../data/effects.json';

export default function ProfileShowcase() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  
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
    active_decoration: 'lightning-bolt'
  };

  const [activeTab, setActiveTab] = useState('listeler');
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [userLinks, setUserLinks] = useState(displayUser.links || []);
  const [decorationCategory, setDecorationCategory] = useState('Tümü');
  
  // Handle Hash-based Tabs
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['listeler', 'basarimlar', 'etkinlik', 'customize'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  const selectedDecoration = effectsData.avatarDecorations.find(d => d.id === displayUser.active_decoration) || effectsData.avatarDecorations[0];

  const tabs = [
    { id: 'listeler', label: 'Listeler', icon: BookOpen },
    { id: 'basarimlar', label: 'Başarımlar', icon: Award },
    { id: 'etkinlik', label: 'Etkinlik', icon: History },
    { id: 'customize', label: 'Özelleştir', icon: Palette },
  ];

  const categories = ['Tümü', ...new Set(effectsData.avatarDecorations.map(d => d.category))];

  const filteredDecorations = decorationCategory === 'Tümü' 
    ? effectsData.avatarDecorations 
    : effectsData.avatarDecorations.filter(d => d.category === decorationCategory);

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'discord': return <MessageSquare size={14} className="text-indigo-400" />;
      case 'youtube': return <Youtube size={14} className="text-red-500" />;
      case 'instagram': return <Instagram size={14} className="text-pink-500" />;
      case 'twitter': return <Twitter size={14} className="text-blue-400" />;
      case 'github': return <Github size={14} className="text-white" />;
      default: return <LinkIcon size={14} className="text-zinc-500" />;
    }
  };

  const getPlatformUrl = (link) => {
    if (link.type === 'url') return link.value;
    switch (link.platform) {
      case 'instagram': return `https://instagram.com/${link.value}`;
      case 'twitter': return `https://twitter.com/${link.value}`;
      case 'youtube': return `https://youtube.com/@${link.value}`;
      case 'github': return `https://github.com/${link.value}`;
      case 'discord': return `https://discord.com/users/${link.value}`;
      default: return '#';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 font-sans selection:bg-purple-500/30 pt-20">
      <AnimatePresence>
        {showLinksModal && (
          <ConnectedAccountsModal 
            isOpen={showLinksModal} 
            onClose={() => setShowLinksModal(false)} 
            onSave={setUserLinks}
            initialLinks={userLinks}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT SIDEBAR: User Info */}
          <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] overflow-hidden shadow-2xl">
              {/* Profile Header */}
              <div className="p-8 flex flex-col items-center text-center space-y-4">
                <SiberAvatar 
                  src={displayUser.avatar_url} 
                  effect={selectedDecoration} 
                  size="w-32 h-32" 
                />

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
                  <div className="flex flex-col gap-2">
                    {userLinks.map((link, idx) => (
                      <a 
                        key={idx}
                        href={getPlatformUrl(link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
                      >
                         {getSocialIcon(link.platform)}
                         <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white truncate">{link.value}</span>
                      </a>
                    ))}
                    {isOwnProfile && (
                      <button 
                        onClick={() => setShowLinksModal(true)}
                        className="flex items-center justify-center gap-2 mt-1 p-3 rounded-2xl bg-zinc-950/20 border border-dashed border-zinc-800/50 text-[9px] font-black uppercase text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
                      >
                        <Plus size={12} /> Bağlantı Ekle
                      </button>
                    )}
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                              <Palette size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tight">Profil Özelleştir</h3>
                              <p className="text-zinc-500 text-xs">Siber mühimmatını seç ve kuşan</p>
                            </div>
                        </div>
                        {/* Premium Badge */}
                        <div className="px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center gap-2">
                           <Zap size={14} className="text-purple-400" />
                           <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Premium Aktif</span>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 p-1.5 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 w-fit">
                        {categories.map(cat => (
                           <button 
                             key={cat}
                             onClick={() => setDecorationCategory(cat)}
                             className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${decorationCategory === cat ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                           >
                              {cat}
                           </button>
                        ))}
                    </div>

                    {/* Character Frames Grid */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-3 text-zinc-500">
                          <ImageIcon size={14} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">KARAKTER ÇERÇEVELERİ</h4>
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                         {filteredDecorations.map((effect) => (
                           <motion.div 
                             key={effect.id} 
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             className="group flex flex-col items-center gap-4"
                           >
                              <div className={`relative p-3 rounded-[2rem] bg-zinc-950/50 border transition-all cursor-pointer flex items-center justify-center ${displayUser.active_decoration === effect.id ? 'border-purple-500 bg-purple-500/5 shadow-2xl shadow-purple-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                                 <SiberAvatar 
                                   src={displayUser.avatar_url} 
                                   effect={effect} 
                                   size="w-24 h-24" 
                                 />
                                 
                                 {displayUser.active_decoration === effect.id && (
                                   <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-purple-600 text-white shadow-lg">
                                      <Zap size={10} />
                                   </div>
                                 )}
                              </div>
                              <div className="text-center space-y-1">
                                 <span className="block text-[11px] font-black text-zinc-100 uppercase tracking-tight group-hover:text-purple-400 transition-colors">{effect.name}</span>
                                 <span className="block text-[8px] font-bold text-zinc-600 uppercase tracking-widest italic">{effect.category}</span>
                              </div>
                           </motion.div>
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

function ConnectedAccountsModal({ isOpen, onClose, onSave, initialLinks }) {
  const [links, setLinks] = useState(initialLinks?.length > 0 ? initialLinks : [{ platform: '', value: '', type: 'username' }]);
  const platforms = [
    { id: 'discord', label: 'Discord', icon: MessageSquare },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'twitter', label: 'Twitter / X', icon: Twitter },
    { id: 'reddit', label: 'Reddit', icon: LinkIcon },
    { id: 'tiktok', label: 'TikTok', icon: Zap },
    { id: 'github', label: 'GitHub', icon: Github },
  ];

  const addRow = () => setLinks([...links, { platform: '', value: '', type: 'username' }]);
  const removeRow = (idx) => setLinks(links.filter((_, i) => i !== idx));
  const updateRow = (idx, field, val) => {
    const newLinks = [...links];
    newLinks[idx][field] = val;
    setLinks(newLinks);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-[#151921] border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Bağlı Hesaplar</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {links.map((link, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center group">
              <div className="relative w-full sm:w-40 shrink-0">
                <select 
                  value={link.platform}
                  onChange={(e) => updateRow(idx, 'platform', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-bold text-zinc-300 appearance-none focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="">Platform Seç</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                   <Plus size={14} className="rotate-0" />
                </div>
              </div>

              <div className="relative flex-1 w-full">
                <input 
                  type="text"
                  placeholder={link.type === 'username' ? "Kullanıcı adı" : "Bağlantı URL'si"}
                  value={link.value}
                  onChange={(e) => updateRow(idx, 'value', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-bold text-zinc-100 focus:border-purple-500 transition-all"
                />
                <button 
                  onClick={() => updateRow(idx, 'type', link.type === 'username' ? 'url' : 'username')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-zinc-500 hover:text-purple-400 transition-all"
                >
                  {link.type === 'username' ? 'URL GİR' : 'AD GİR'}
                </button>
              </div>

              <button 
                onClick={() => removeRow(idx)}
                className="p-3 rounded-xl bg-zinc-900 text-zinc-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <Plus size={16} className="rotate-45" />
              </button>
            </div>
          ))}

          <button 
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[10px] font-black uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all w-fit"
          >
            <Plus size={14} /> Bağlantı Ekle
          </button>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/20">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-zinc-900 text-zinc-400 text-xs font-black uppercase hover:bg-zinc-800 transition-all"
          >
            İptal
          </button>
          <button 
            onClick={() => {
              onSave(links.filter(l => l.platform && l.value));
              onClose();
            }}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black uppercase shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} className="rotate-0" /> Kaydet
          </button>
        </div>
      </motion.div>
    </div>
  );
}
