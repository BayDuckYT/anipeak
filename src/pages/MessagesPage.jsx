import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SendHorizontal, 
  Search, 
  MoreVertical, 
  Image as ImageIcon, 
  Smile, 
  Paperclip,
  ChevronLeft,
  X,
  Plus,
  Info,
  User,
  Zap,
  CheckCheck,
  Users,
  Globe,
  Star,
  FileText,
  AlertCircle,
  ArrowLeft,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabaseClient';
import AnimeAvatar from '../components/AnimeAvatar.jsx';
import { useSEO } from '../hooks/useSEO';

import CryptoJS from 'crypto-js';

// --- ENCRYPTION ZIRHI (WhatsApp Mantığı) ---
const SECRET_KEY = 'anipeak-siber-karargah-guvenlik-anahtari';

const encryptMsg = (text) => {
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (e) { return text; }
};

const decryptMsg = (text) => {
  if (!text) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(text, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || text;
  } catch (e) {
    return text;
  }
};


// --- SUB-COMPONENT: Message Item ---
import { Link, useSearchParams } from 'react-router-dom';

// --- SUB-COMPONENT: Anime Nameplate (Discord Style) ---
const AnimeNameplate = ({ username, role, mix }) => {
  const nametagEffect = mix?.nametag || 'none';
  const nameplateFile = mix?.nameplate || 'none';
  const isAdmin = ['Baş Admin', 'Yönetici', 'Admin Yardımcısı'].includes(role);
  
  const isMalevolent = nametagEffect === 'malevolent-shrine';
  const isVoid = nametagEffect === 'unlimited-void';
  const isCursed = nametagEffect === 'cursed-fire';

  return (
    <Link to={`/profil/${username}`} className="relative group cursor-pointer w-[130px] h-[44px] block">
      <div className={`relative w-full h-full rounded-md transition-all duration-500 flex items-center justify-center gap-2 overflow-hidden border
        ${nametagEffect !== 'none' || nameplateFile !== 'none'
          ? 'border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] bg-zinc-950/40' 
          : 'bg-transparent border-transparent'
        }`}
      >
        {/* ── VIDEO NAMEPLATE BACKGROUND ── */}
        {nameplateFile !== 'none' && (
          <div className="absolute inset-0 z-0">
            <video 
              src={`/nameplates/${nameplateFile}`} 
              autoPlay muted loop playsInline 
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] z-[1]" />
          </div>
        )}

        {/* ── ANIMATED CSS EFFECTS ── */}
        {isMalevolent && (
          <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
             <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-red-600/40 to-transparent animate-pulse" />
             <motion.div 
               animate={{ x: [-100, 100] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500 blur-[2px] opacity-50"
             />
          </div>
        )}

        {isVoid && (
          <div className="absolute inset-0 z-[2] pointer-events-none">
             <div className="absolute inset-0 bg-indigo-600/10 animate-pulse" />
          </div>
        )}
        
        {/* Username */}
        <span className={`relative z-10 text-[10px] font-black uppercase tracking-tight transition-all duration-300 truncate max-w-[80px]
          ${nametagEffect !== 'none' ? `nametag-effect-${nametagEffect}` : 'text-slate-300 group-hover:text-white'}
        `}>
          {username}
        </span>

        {/* Admin Badge */}
        {isAdmin && (
          <span className="relative z-10 text-[6px] bg-red-600 text-white px-1 py-0.5 rounded-sm font-black uppercase tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.4)] shrink-0">
            ADM
          </span>
        )}
      </div>
      
      {/* Outer Glow */}
      {(nametagEffect !== 'none' || nameplateFile !== 'none') && (
        <div className="absolute inset-0 -z-10 rounded-md bg-white/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
    </Link>
  );
};

// --- SUB-COMPONENT: Message Item ---
const MessageItem = ({ msg, isMe, effectLookup }) => {
  const effectMatch = msg.text?.match(/\/effect\/(\d+)/);
  const effectId = effectMatch ? parseInt(effectMatch[1]) : null;
  const linkedEffect = effectId ? effectLookup.find(e => e.id === effectId) : null;

  const mix = msg.sender?.active_mix || { avatar: 'none', nametag: 'none', nameplate: 'none' };
  const avatarEffect = effectLookup.find(e => e.id === mix.avatar);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex items-start gap-3 mb-3 px-2 py-1.5 rounded-xl transition-all group hover:bg-white/[0.02]`}
    >
      {/* LEFT: Avatar */}
      <Link to={`/profil/${msg.sender?.username}`} className="flex-shrink-0 mt-0.5 hover:scale-105 transition-transform">
        <AnimeAvatar 
          src={msg.sender?.avatar_url} 
          effect={avatarEffect}
          size="w-10 h-10" 
          forcePlay={true}
        />
      </Link>

      {/* RIGHT: Content */}
      <div className="flex-1 min-w-0">
        {/* Nameplate + Timestamp */}
        <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5 backdrop-blur-md">
            <AnimeNameplate 
              username={msg.sender?.username || 'Anonim'} 
              role={msg.sender?.role} 
              mix={mix} 
            />
          </div>
          <span className="text-[9px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message Text Bubble */}
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium break-words shadow-lg ${
            isMe 
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none border border-white/10' 
              : 'bg-zinc-800/80 text-slate-100 rounded-tl-none border border-white/5 backdrop-blur-sm'
          }`}>
            {decryptMsg(msg.content)}
          </div>
        </div>

        {/* Effect Mini Preview */}
        {linkedEffect && (
          <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/5 max-w-[200px] shadow-xl backdrop-blur-xl">
            <div className="relative aspect-square flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
              <AnimeAvatar effect={linkedEffect} size="w-24 h-24" forcePlay={true} />
            </div>
            <p className="mt-2 text-center text-[9px] font-black uppercase text-slate-500 tracking-widest">{linkedEffect.label}</p>
          </div>
        )}

        {/* Attachments */}
        {msg.attachments?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {msg.attachments.map((at, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer">
                <FileText size={12} className="text-blue-400" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">{at.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { registeredUsers } = useApp();

  useSEO({
    title: 'Mesajlar',
    description: 'AniPeak özel mesajlaşma sistemi.',
    url: 'https://anipeak.com.tr/messages'
  });

  const [activeTab, setActiveTab] = useState('dm'); // 'dm', 'group', 'community', 'friends'
  const [searchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get('user_id');
  const usernameFromUrl = searchParams.get('user');

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [following, setFollowing] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  const messagesEndRef = useRef(null);

  // Efekt Listesi (Pre-load from a static context or prop)
  const effectLookup = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('anipeak_effects_cache')) || [];
    } catch { return []; }
  }, []);

  const [onlineUsers, setOnlineUsers] = useState({});
  const messagesContainerRef = useRef(null);

  // --- DATA FETCHING & REALTIME ---
  useEffect(() => {
    if (!user) return;
    
    const init = async () => {
      await Promise.all([fetchConversations(), fetchFollowing()]);
      if (userIdFromUrl || usernameFromUrl) handleAutoStartChat();
    };
    init();

    // SUPABASE REALTIME & PRESENCE
    const channel = supabase.channel('anipeak-global-sync', {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = {};
        Object.keys(state).forEach(key => { online[key] = true; });
        setOnlineUsers(online);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        
        // 1. Sol paneli (konuşmaları) tazele
        fetchConversations();

        // 2. Eğer açık olan sohbetin mesajıysa ekrana fırlat
        if (activeChatRef.current && newMsg.conversation_id === activeChatRef.current.id) {
          // Eğer bu mesajı biz atmadıysak (başkası attıysa) ekle
          // (Bizim attıklarımız zaten Optimistic Update ile ekleniyor)
          if (newMsg.sender_id !== user.id) {
            const enrichedMsg = {
              ...newMsg,
              sender: newMsg.sender_id === activeChatRef.current.user1_id 
                ? activeChatRef.current.user1 
                : activeChatRef.current.user2
            };
            setMessages(prev => {
              // Mükerrer kaydı önle
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, enrichedMsg];
            });
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const activeChatRef = useRef(null);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const handleAutoStartChat = async () => {
    let targetId = userIdFromUrl;
    let targetUsername = '';

    // If only username is provided, fetch user_id first
    if (!targetId && usernameFromUrl) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('username', usernameFromUrl).single();
      if (profile) targetId = profile.id;
    }

    if (!targetId) return;

    let chat = conversations.find(c => 
      (c.user1_id === targetId && c.user2_id === user.id) ||
      (c.user2_id === targetId && c.user1_id === user.id)
    );
    
    if (chat) {
      setActiveChat(chat);
    } else {
      try {
        const newConvId = crypto.randomUUID();
        const [u1, u2] = [user.id, targetId].sort();

        const { data: newChat, error: convErr } = await supabase
          .from('conversations')
          .insert({ 
            id: newConvId, 
            user1_id: u1, 
            user2_id: u2, 
            updated_at: new Date().toISOString() 
          })
          .select(`
            *,
            user1:profiles!user1_id(id, username, avatar_url, role, active_mix),
            user2:profiles!user2_id(id, username, avatar_url, role, active_mix)
          `)
          .single();

        console.log("Auto-Start Sohbet ID:", newChat?.id);
        if (convErr) throw convErr;

        setActiveChat(newChat);
        fetchConversations();
      } catch (err) {
        console.error('Error creating DM:', err);
      }
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    if (data) setFollowing(data.map(f => f.following_id));
  };

  useEffect(() => {
    if (activeChat) fetchMessages(activeChat.id);
    else setMessages([]);
  }, [activeChat]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!user1_id(id, username, avatar_url, role, active_mix),
          user2:profiles!user2_id(id, username, avatar_url, role, active_mix)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    if (!activeChat) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Profil bilgilerini activeChat'ten alarak N+1 sorgu sorununu ve join hatalarını önle
      const enriched = (data || []).map(m => ({
        ...m,
        sender: m.sender_id === activeChat.user1_id ? activeChat.user1 : activeChat.user2
      }));

      setMessages(enriched);
    } catch (err) {
      console.error('Mesaj çekme hatası:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !user) return;

    const text = inputText;
    setInputText('');

    // OPTIMISTIC UPDATE: Beklemeden ekrana bas
    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      conversation_id: activeChat.id,
      sender_id: user.id,
      content: encryptMsg(text),
      created_at: new Date().toISOString(),
      sender: user
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: activeChat.id,
          sender_id: user.id,
          content: encryptMsg(text)
        }])
        .select()
        .single();
      
      if (error) throw error;

      // Gerçek ID ile güncelle
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: user } : m));

      // Trigger zaten last_message'ı güncelliyor ama manuel updated_at iteleyelim
      await supabase.from('conversations').update({ 
        updated_at: new Date().toISOString() 
      }).eq('id', activeChat.id);
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Send error:', err);
      alert("Mesaj gönderilemedi!");
    }
  };

  const startNewConversation = async () => {
    if (selectedUsers.length === 0) return;
    const targetId = selectedUsers[0];
    
    console.log("Sohbet Başlat butonuna tıklandı. Seçilen Kullanıcı:", targetId);

    try {
      // 1. Önce veritabanında bu iki kişi arasında oda var mı bak
      const [u1, u2] = [user.id, targetId].sort();
      
      const { data: existingChat, error: searchError } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!user1_id(id, username, avatar_url, role, active_mix),
          user2:profiles!user2_id(id, username, avatar_url, role, active_mix)
        `)
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingChat) {
        console.log("Mevcut oda veritabanında bulundu. Oda ID:", existingChat.id);
        setActiveChat(existingChat);
        setShowNewChat(false);
        setSelectedUsers([]);
        return;
      }

      // 2. Oda yoksa yeni oluştur
      console.log("Oda bulunamadı, yeni oda oluşturuluyor...");
      const newConvId = crypto.randomUUID();

      const { data: newChat, error: insertError } = await supabase
        .from('conversations')
        .insert({ id: newConvId, user1_id: u1, user2_id: u2 })
        .select(`
          *,
          user1:profiles!user1_id(id, username, avatar_url, role, active_mix),
          user2:profiles!user2_id(id, username, avatar_url, role, active_mix)
        `)
        .single();

      if (insertError) {
        console.error("Supabase INSERT Hatası:", insertError);
        throw insertError;
      }

      console.log("Yeni oda başarıyla oluşturuldu. Oda ID:", newChat.id);

      setActiveChat(newChat);
      setShowNewChat(false);
      setSelectedUsers([]);
      fetchConversations();
    } catch (err) {
      console.error("Sohbet Başlatma İşlemi Başarısız:", err);
      alert("Sohbet başlatılamadı: " + (err.message || "Bilinmeyen hata."));
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'dm') return true; // Bu versiyonda hepsi DM odaklı
    return false;
  });

  return (
    <div className="min-h-screen bg-[#070511] text-white pt-16 font-sans overflow-hidden">
      <div className="max-w-[1400px] mx-auto h-[calc(100vh-64px)] flex border-x border-white/5 bg-[#070709]/50 backdrop-blur-3xl overflow-hidden shadow-2xl relative">
        
        {/* SIDEBAR */}
        <aside className={`w-full md:w-[380px] shrink-0 flex flex-col border-r border-white/5 bg-zinc-950/20 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black italic tracking-tighter text-indigo-500 uppercase">AniPeak Sohbet</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Çevrimiçi</span>
                </div>
              </div>
              <button 
                onClick={() => setShowNewChat(true)}
                aria-label="Yeni sohbet başlat"
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                type="text" 
                placeholder="Arkadaşlarını veya grupları ara..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder-slate-400 focus:border-indigo-500/50 outline-none transition-all"
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/5">
              {[
                { id: 'dm', icon: User, label: 'Kişiler' },
                { id: 'groups', icon: Users, label: 'Gruplar' },
                { id: 'community', icon: Globe, label: 'Topluluk' },
                { id: 'friends', icon: Star, label: 'Arkadaşlar' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-2 gap-1 rounded-xl transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <tab.icon size={16} />
                  <span className="text-[8px] font-black uppercase tracking-tighter">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse flex items-center p-4 gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-white/10 rounded" />
                      <div className="h-2 w-40 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((chat) => {
                const partner = chat.user1_id === user.id ? chat.user2 : chat.user1;
                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden ${
                      activeChat?.id === chat.id 
                        ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-card-navy flex items-center justify-center">
                        <img src={partner?.avatar_url || '/default-avatar.png'} alt={`${partner?.username || 'Kullanıcı'} avatarı`} className="w-full h-full object-cover" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#070511] ${
                        onlineUsers[partner?.id] ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-zinc-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left relative z-10">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-black truncate text-slate-100 group-hover:text-white">
                          {partner?.username || 'Bilinmeyen'}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                          {new Date(chat.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] truncate text-slate-500 font-medium tracking-tight italic">
                        {chat.last_message ? (
                          <>
                            {chat.last_sender_id === user.id && <span className="text-indigo-400/80 not-italic mr-1">Sen:</span>}
                            {decryptMsg(chat.last_message)}
                          </>
                        ) : 'Sohbet başladı...'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                   <Zap size={32} className="text-indigo-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Mesaj Kutusu Boş</p>
                  <p className="text-[10px] text-slate-500 font-bold max-w-[200px]">Henüz kimseyle iletişime geçmedin.</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CHAT WINDOW */}
        <main className={`flex-1 flex flex-col relative bg-[#070511]/40 backdrop-blur-md ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Mobile Back Button */}
                  <button 
                    onClick={() => setActiveChat(null)}
                    aria-label="Sohbet listesine dön"
                    className="md:hidden p-2 -ml-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  {(() => {
                    const partner = activeChat.user1_id === user.id ? activeChat.user2 : activeChat.user1;
                    return (
                      <>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-card-navy border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                           <img 
                             src={partner?.avatar_url || '/default-avatar.png'} 
                             alt={`${partner?.username || 'Kullanıcı'} avatarı`}
                             className="w-full h-full object-cover" 
                             loading="lazy"
                           />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm md:text-lg font-black truncate tracking-tighter uppercase italic text-indigo-100">
                            {partner?.username || 'Siber Üye'}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${onlineUsers[partner?.id] ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest italic text-slate-500">
                               {onlineUsers[partner?.id] ? 'Aktif' : 'Çevrimdışı'}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <button aria-label="Sohbet bilgisi" className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-inner"><Info size={18} /></button>
                  <button aria-label="Diğer seçenekler" className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-inner"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 flex flex-col custom-scrollbar"
              >
                
                {/* ── WELCOME BANNER ── */}
                <div className="mb-6 p-4 rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">👋</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white">
                        {activeChat.type === 'community' 
                          ? `${activeChat.name || 'Topluluk'} kanalına hoş geldiniz!`
                          : `Sohbet başladı!`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5 opacity-30">
                  <div className="flex-1 h-[1px] bg-white/10" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Mesajlar</span>
                  <div className="flex-1 h-[1px] bg-white/10" />
                </div>

                <AnimatePresence mode="sync">
                  {messages.map((msg) => (
                    <MessageItem 
                      key={msg.id} 
                      msg={msg} 
                      isMe={msg.sender_id === user?.id} 
                      effectLookup={effectLookup}
                    />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-zinc-950/60 backdrop-blur-2xl border-t border-white/5">
                <form 
                  onSubmit={handleSendMessage}
                  className="max-w-5xl mx-auto relative flex items-center gap-4 bg-white/5 border border-white/10 p-3 pl-6 rounded-[2rem] focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all group"
                >
                  <button type="button" aria-label="Emoji ekle" className="text-slate-500 hover:text-indigo-400 transition-colors"><Smile size={22} /></button>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Bir mesaj yaz uşağım..."
                    autoFocus
                    className="flex-1 bg-transparent border-none text-white text-sm font-bold focus:ring-0 outline-none placeholder:text-slate-400"
                  />
                  <div className="flex items-center gap-1 pr-1">
                    <button type="button" aria-label="Dosya ekle" className="p-2.5 text-slate-500 hover:text-blue-400 transition-all"><Paperclip size={20} /></button>
                    <button type="button" aria-label="Resim ekle" className="p-2.5 text-slate-500 hover:text-emerald-400 transition-all"><ImageIcon size={20} /></button>
                    <div className="w-[1px] h-6 bg-white/10 mx-1" />
                    <button 
                      type="submit"
                      disabled={!inputText.trim()}
                      className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale transition-all"
                    >
                      <SendHorizontal size={22} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-10 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600/30 blur-[100px] rounded-full animate-pulse" />
                <motion.div 
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-40 h-40 rounded-[4rem] bg-card-navy/80 border border-white/10 flex items-center justify-center text-indigo-500 relative z-10 shadow-[0_0_50px_rgba(79,70,229,0.3)]"
                >
                  <SendHorizontal size={64} className="rotate-12 translate-x-1 -translate-y-1" />
                </motion.div>
              </div>
              <div className="space-y-4 relative z-10">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-indigo-500">AniPeak Sohbet</h2>
                <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em] max-w-[350px] mx-auto leading-loose">
                  Sohbet başlatmak için bir arkadaşını seç uşağım!
                </p>
              </div>
              <button 
                onClick={() => setShowNewChat(true)}
                className="px-12 py-5 rounded-[2rem] bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all relative overflow-hidden group"
              >
                <span className="relative z-10">YENİ SOHBET BAŞLAT</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          )}
        </main>

        {/* MODAL: NEW CHAT / GROUP */}
        {createPortal(
        <AnimatePresence>
          {showNewChat && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNewChat(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="w-full max-w-md bg-card-navy border border-white/10 rounded-[2.5rem] p-8 relative z-[101] shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase text-indigo-500">Yeni Sohbet</h3>
                  <button onClick={() => setShowNewChat(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                  {/* Search User */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Kullanıcı Ara</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Kullanıcı adı girin..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* User List */}
                  <div className="max-h-[250px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {registeredUsers
                      .filter(u => u.id !== user?.id && u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(u => {
                        const isSelected = selectedUsers.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSelectedUsers(prev => isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                            }}
                            className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                              isSelected ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/5">
                              {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-400" />}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="text-xs font-black text-white">{u.username}</div>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{u.role}</div>
                            </div>
                            {isSelected && <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"><CheckCheck size={12} className="text-white" /></div>}
                          </button>
                        );
                      })}
                  </div>

                  {/* Group Name (Only if > 1 user) */}
                  {selectedUsers.length > 1 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Grup Kimliği</label>
                      <input 
                        type="text" 
                        placeholder="Grup adını belirleyin..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                      />
                    </motion.div>
                  )}

                  {/* Create Button */}
                  <button 
                    onClick={startNewConversation}
                    disabled={selectedUsers.length === 0}
                    className="w-full py-5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {selectedUsers.length > 1 ? 'GRUP OLUŞTUR' : 'SOHBET BAŞLAT'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(99, 102, 241, 0.1); 
          border-radius: 10px; 
          transition: all 0.3s ease;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { 
          background: rgba(99, 102, 241, 0.4); 
        }
      `}</style>
    </div>
  );
}
