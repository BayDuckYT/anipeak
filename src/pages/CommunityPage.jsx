import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  UserPlus, 
  Clock, 
  Search, 
  Send, 
  Settings, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Link as LinkIcon, 
  Ban, 
  X,
  ChevronLeft,
  Paperclip,
  Smile,
  MoreVertical,
  Edit,
  Mail,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function CommunityPage() {
  const { user } = useAuth();
  const [showRules, setShowRules] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [activeTab, setActiveTab] = useState('dm');
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [chatTheme, setChatTheme] = useState({
    type: 'color',
    value: '#050507',
    gradient: null
  });

  const chatThemes = [
    { id: 1, type: 'color', value: '#0B0E14' },
    { id: 2, type: 'color', value: '#0F1219' },
    { id: 3, type: 'gradient', value: 'linear-gradient(to bottom right, #0F1219, #050507)' },
    { id: 4, type: 'gradient', value: 'linear-gradient(to bottom right, #1e1b4b, #050507)' },
    { id: 5, type: 'gradient', value: 'linear-gradient(to bottom right, #312e81, #1e1b4b)' },
    { id: 6, type: 'gradient', value: 'linear-gradient(to bottom right, #1e1b4b, #312e81)' },
    { id: 7, type: 'gradient', value: 'linear-gradient(to bottom right, #4c1d95, #1e1b4b)' },
    { id: 8, type: 'gradient', value: 'linear-gradient(to bottom right, #581c87, #050507)' },
    { id: 9, type: 'gradient', value: 'linear-gradient(to bottom right, #701a75, #1e1b4b)' },
    { id: 10, type: 'gradient', value: 'linear-gradient(to bottom right, #1e1b4b, #050507)' },
    { id: 11, type: 'gradient', value: 'linear-gradient(45deg, #1e1b4b, #0B0E14)' },
    { id: 12, type: 'gradient', value: 'linear-gradient(135deg, #0f172a, #020617)' },
    { id: 13, type: 'gradient', value: 'linear-gradient(to bottom right, #020617, #1e1b4b)' },
    { id: 14, type: 'gradient', value: 'linear-gradient(to right, #050507, #0f172a, #050507)' },
    { id: 15, type: 'gradient', value: 'linear-gradient(to bottom, #111827, #000000)' },
  ];

  const rules = [
    { 
      id: 1, 
      title: 'Zorbalık ve Taciz Yasaktır', 
      desc: 'Diğer kullanıcılara hakaret, tehdit, aşağılama veya cinsel taciz içeren mesajlar kesinlikle yasaktır.',
      icon: Ban,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    },
    { 
      id: 2, 
      title: 'Yasak Link Paylaşımı', 
      desc: 'Rakip site bağlantıları, zararlı içerikler ve izinsiz reklam linkleri paylaşılamaz.',
      icon: LinkIcon,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    { 
      id: 3, 
      title: 'Dini, Ahlaki ve Milli Değerlere Saygı', 
      desc: 'Dini inançlara, milli değerlere veya ahlaki normlara hakaret ve aşağılama içeren paylaşımlar yasaktır.',
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    { 
      id: 4, 
      title: 'Uygunsuz İçerik Yasaktır', 
      desc: 'Müstehcen, sapkın veya yaşa uygunsuz içerik paylaşımı kesinlikle yasaktır.',
      icon: AlertCircle,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10'
    },
    { 
      id: 5, 
      title: 'Reklam ve Spam Yasaktır', 
      desc: 'İzinsiz reklam, tekrarlayan mesaj gönderimi ve spam içerikli paylaşımlar yasaktır.',
      icon: Mail,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
  ];

  const tabs = [
    { id: 'dm', label: 'DM', icon: MessageSquare },
    { id: 'grup', label: 'Grup', icon: Users },
    { id: 'arkadaslar', label: 'Arkadaşlar', icon: UserPlus },
    { id: 'istekler', label: 'İstekler', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans pt-16">
      
      {/* Community Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-[#0F1219] border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 pb-4 text-center space-y-3">
                 <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-500">
                    <Shield size={32} />
                 </div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tight">Topluluk Kuralları</h2>
                 <p className="text-zinc-500 text-sm font-medium">Mesajlaşma özelliğini kullanmadan önce lütfen oku</p>
              </div>

              {/* Rules List */}
              <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-4 custom-scrollbar">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 flex gap-4 group hover:border-zinc-700 transition-all">
                    <div className={`shrink-0 w-12 h-12 rounded-2xl ${rule.bg} ${rule.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <rule.icon size={22} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{rule.title}</h4>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-zinc-800 space-y-6 bg-zinc-950/30">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div 
                    onClick={() => setAcceptedRules(!acceptedRules)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${acceptedRules ? 'bg-purple-600 border-purple-600' : 'border-zinc-700 group-hover:border-purple-500'}`}
                  >
                    {acceptedRules && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                  <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-300">
                    <span className="text-white">Tüm kuralları okudum</span> ve yukarıdaki kurallara uymayı kabul ediyorum.
                  </span>
                </label>

                <button 
                  onClick={() => acceptedRules && setShowRules(false)}
                  disabled={!acceptedRules}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-600/20 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:grayscale transition-all"
                >
                  Onaylıyorum
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Theme Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowThemeModal(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
             />
             
             <motion.div 
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: 20, opacity: 0 }}
               className="relative ml-auto w-full max-w-sm h-full bg-[#0F1219] border-l border-zinc-800 shadow-2xl flex flex-col"
             >
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                   <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Palette size={20} className="text-purple-500" /> Sohbet Arka Planı
                   </h3>
                   <button onClick={() => setShowThemeModal(false)} className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                   {/* Hazır Resimler */}
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hazır Resimler</h4>
                      <div className="grid grid-cols-1 gap-3">
                         <button className="relative aspect-video rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden group hover:border-purple-500 transition-all">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523296-e84e09ad8a73?q=80&w=1000')] bg-cover opacity-40 group-hover:opacity-20 transition-opacity" />
                            <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-tighter">
                               <div className="p-1 rounded bg-zinc-950/80"><Globe size={12} /></div> Masaüstü
                            </div>
                         </button>
                      </div>
                   </section>

                   {/* Hazır Renkler */}
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hazır Renkler</h4>
                      <div className="grid grid-cols-5 gap-3">
                         {chatThemes.map((theme) => (
                           <button 
                             key={theme.id}
                             onClick={() => setChatTheme(theme)}
                             className={`aspect-square rounded-xl border-2 transition-all hover:scale-110 active:scale-90 relative ${chatTheme.value === theme.value ? 'border-white' : 'border-zinc-800 hover:border-zinc-700'}`}
                             style={{ background: theme.value }}
                           >
                              {chatTheme.value === theme.value && (
                                <div className="absolute inset-0 flex items-center justify-center text-white">
                                   <CheckCircle2 size={16} />
                                </div>
                              )}
                           </button>
                         ))}
                      </div>
                   </section>

                   {/* Özel Renk */}
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Özel Renk</h4>
                      <div className="flex gap-3">
                         <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800" />
                         <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                            <CheckCircle2 size={16} /> Uygula
                         </button>
                      </div>
                   </section>

                   {/* Resim Yükle */}
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Resim Yükle</h4>
                      <button className="w-full h-20 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all group">
                         <ImageIcon size={24} className="group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Resim Seç</span>
                      </button>
                   </section>
                </div>

                <div className="p-6 border-t border-zinc-800">
                   <button 
                     onClick={() => setChatTheme({ type: 'color', value: '#050507', gradient: null })}
                     className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                   >
                      <Clock size={16} /> Varsayılana Sıfırla
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex overflow-hidden">
        
        {/* LEFT SIDEBAR: Messages & Channels */}
        <aside className="w-full md:w-[380px] shrink-0 border-r border-zinc-800/50 bg-[#070709] flex flex-col relative z-50">
          
          {/* Sidebar Header */}
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <button className="text-zinc-500 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                 </button>
                 <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Send size={18} className="text-purple-500" /> Mesajlar
                 </h2>
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => setShowThemeModal(true)}
                    className="p-2.5 rounded-xl bg-zinc-900 text-zinc-500 hover:text-purple-500 transition-all hover:scale-110 active:scale-90"
                  >
                     <Palette size={16} />
                  </button>
                  <button className="p-2.5 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-90">
                     <Edit size={16} />
                  </button>
                  <button className="p-2.5 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-90">
                     <Users size={16} />
                  </button>
               </div>
            </div>

            {/* Search */}
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Konuşma ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 text-xs font-bold text-zinc-100 focus:border-purple-600 transition-all"
              />
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-800/50">
               {tabs.map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex-1 pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                     activeTab === tab.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
                   }`}
                 >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeCommunityTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" 
                      />
                    )}
                 </button>
               ))}
            </div>
          </div>

          {/* Conversations List (Empty State) */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col items-center justify-center text-center space-y-4 opacity-40">
             <div className="p-6 rounded-full bg-zinc-900 text-zinc-800">
                <MessageSquare size={48} />
             </div>
             <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Henüz konuşma yok</p>
                <p className="text-[10px] text-zinc-600">Yeni bir mesaj başlat!</p>
             </div>
          </div>
        </aside>

        {/* MAIN AREA: Chat / Selected Conversation */}
        <main 
          className="flex-1 flex flex-col relative overflow-hidden transition-all duration-500"
          style={{ background: chatTheme.value }}
        >
          
          {/* Background Glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px]" />
             <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-12 text-center space-y-8">
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border border-zinc-800/50 flex items-center justify-center text-purple-500 shadow-2xl relative"
             >
                <div className="absolute inset-0 bg-purple-500/10 blur-[40px] rounded-full" />
                <Send size={48} className="relative z-10" />
             </motion.div>
             <div className="space-y-3">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Mesajların</h2>
                <p className="text-zinc-500 text-sm font-medium">Bir konuşma seç veya yeni mesaj başlat uşağım!</p>
             </div>
             <button className="px-10 py-4 rounded-2xl bg-purple-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-600/20 hover:scale-110 active:scale-95 transition-all">
                Konuşma Başlat
             </button>
          </div>

          {/* Sample Chat Header (Hidden in empty state) */}
          <div className="hidden border-b border-zinc-800/50 bg-[#070709]/80 backdrop-blur-md p-4 px-8 items-center justify-between relative z-20">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden relative">
                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#070709] rounded-full shadow-lg" />
                </div>
                <div>
                   <h3 className="text-sm font-black text-white uppercase tracking-tight">AniPeak Admin</h3>
                   <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Çevrimiçi</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button className="p-3 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all"><Users size={18} /></button>
                <button className="p-3 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all"><Settings size={18} /></button>
             </div>
          </div>

          {/* Chat Input (Hidden in empty state) */}
          <div className="hidden p-8 pt-4 relative z-20">
             <div className="max-w-4xl mx-auto flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl backdrop-blur-md shadow-2xl">
                <button className="p-3 rounded-2xl bg-zinc-950 text-zinc-500 hover:text-purple-400 transition-all"><Smile size={20} /></button>
                <button className="p-3 rounded-2xl bg-zinc-950 text-zinc-500 hover:text-purple-400 transition-all"><Paperclip size={20} /></button>
                <input 
                  type="text" 
                  placeholder="Mesajını buraya mühürle..."
                  className="flex-1 bg-transparent border-none text-zinc-100 text-sm font-medium focus:ring-0 placeholder:text-zinc-700"
                />
                <button className="p-4 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:scale-110 active:scale-95 transition-all">
                  <Send size={20} />
                </button>
             </div>
          </div>

        </main>
      </div>

    </div>
  );
}
