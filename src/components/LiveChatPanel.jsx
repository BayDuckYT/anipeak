import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserBadges from './UserBadges';
import AnimeAvatar from './AnimeAvatar';
import effectsData from '../data/effects.json';

// Mock messages for simulation
const MOCK_MESSAGES = [
  { id: 1, user: 'Gojo', text: 'Bu bölüm harika yahu!', isElite: true, time: '20:15', avatar_url: 'https://i.pinimg.com/736x/8f/c9/b0/8fc9b08f4c1e4f4a39b4b04928e469e3.jpg', active_mix: { nameplate: 'fire_nameplate.webm', avatar: 'fire_aura' } },
  { id: 2, user: 'Uşak_123', text: 'Sonraki sayfaya geçemedim, bende mi sorun var?', isElite: false, time: '20:16', avatar_url: null, active_mix: null },
  { id: 3, user: 'Sukuna', text: 'Domain expansion mükemmel çizilmiş.', isElite: true, time: '20:18', avatar_url: 'https://i.pinimg.com/736x/11/cb/c7/11cbc7d6db64f8ad90bfec064d55ff95.jpg', active_mix: { nameplate: 'dark_nebula.webm', avatar: 'glitch_effect' } }
];

export default function LiveChatPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      user: user?.username || 'Misafir',
      text: inputText,
      isElite: user?.premium || user?.is_elite || false,
      avatar_url: user?.avatar_url || null,
      active_mix: user?.active_mix || null,
      active_decoration: user?.active_mix?.avatar || user?.active_decoration || 'none',
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-80 sm:w-96 glass-strong border-l border-white/10 shadow-2xl z-[1000] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-purple-400" />
              <h3 className="text-white font-black tracking-tighter">GLOBAL SOHBET</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar flex flex-col">
            {messages.map((msg) => {
              const isMe = user && (msg.user === user.username || msg.user === 'Misafir');
              const avatarId = msg.active_mix?.avatar || msg.active_decoration || 'none';
              const nameplateId = msg.active_mix?.nameplate || 'none';
              
              return (
                <motion.div
                  layout
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex gap-3 mb-6 p-4 rounded-3xl relative group overflow-hidden transition-all duration-300 ${isMe ? 'flex-row-reverse' : ''} ${
                    nameplateId !== 'none' ? 'border border-white/10 shadow-2xl' : 'bg-white/[0.02]'
                  }`}
                >
                  {/* Full-Card Nameplate Background */}
                  {nameplateId !== 'none' && (
                    <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
                      <video 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        className="w-full h-full object-cover mix-blend-screen mix-blend-lighten opacity-30 group-hover:opacity-50 transition-opacity duration-500" 
                      >
                        <source src={`/nameplates/${nameplateId}`} type="video/webm" />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/20 to-transparent" />
                    </div>
                  )}

                  <div className="w-12 h-12 shrink-0 relative z-10">
                    <AnimeAvatar 
                      src={msg.avatar_url || null} 
                      effect={avatarId !== 'none' ? effectsData.find(e => e.id === avatarId) : null}
                      size="w-12 h-12"
                      forcePlay={true}
                    />
                    {!msg.avatar_url && avatarId === 'none' && (
                      <span className="absolute inset-0 flex items-center justify-center z-20 text-[12px] font-black text-white pointer-events-none">{msg.user?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <div className={`flex flex-col relative z-10 ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span 
                        className={`text-[11px] font-black uppercase tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,1)] ${
                          msg.isElite ? 'rank-glow-gold text-amber-100' : 'text-slate-300'
                        } ${msg.active_mix?.nametag && msg.active_mix.nametag !== 'none' ? 'name-effect-text' : ''}`}
                        style={msg.active_mix?.nametag && msg.active_mix.nametag !== 'none' ? { backgroundImage: `url(${effectsData.find(e => e.id === msg.active_mix.nametag)?.url})`, filter: `hue-rotate(${msg.active_mix.hue || 0}deg)` } : {}}
                      >
                        {msg.user}
                      </span>
                      {msg.isElite && <UserBadges user={{ is_elite: true, active_plan_id: msg.active_plan_id || 'pro' }} showCrown={true} iconSize={12} />}
                      <span className="text-[8px] text-slate-500/60 font-bold">{msg.time}</span>
                    </div>

                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed font-medium transition-all ${
                      isMe 
                        ? 'bg-purple-600/20 text-white border border-purple-500/20 shadow-neon-purple/20' 
                        : 'bg-white/5 border border-white/5 text-slate-200 shadow-xl'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            {!user ? (
              <div className="text-center p-3 rounded-xl border border-red-500/30 bg-red-500/10">
                <p className="text-xs text-red-400 font-bold mb-2">Sohbete katılmak için giriş yap</p>
                {/* Note: In a real app, this would trigger the AuthModal */}
                <span className="text-[10px] text-slate-500 uppercase">Sadece üyeler yazabilir</span>
              </div>
            ) : (
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={user.is_elite ? "Elite olarak yaz..." : "Mesajını yaz..."}
                  className={`w-full bg-black/50 border rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-400 focus:outline-none transition-colors ${
                    user.is_elite ? 'border-red-500/30 focus:border-red-500' : 'border-white/10 focus:border-purple-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <Send size={16} className={user.is_elite ? 'text-red-400' : 'text-purple-400'} />
                </button>
              </form>
            )}
            {user?.is_elite && (
              <div className="mt-2 text-[10px] text-red-400 font-black tracking-widest text-center uppercase animate-pulse">
                Elite Sohbet Modu Aktif
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
