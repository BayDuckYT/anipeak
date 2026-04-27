import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EliteBadge from './EliteBadge';

// Mock messages for simulation
const MOCK_MESSAGES = [
  { id: 1, user: 'Gojo', text: 'Bu bölüm harika yahu!', isElite: true, time: '20:15', avatar_url: 'https://i.pinimg.com/736x/8f/c9/b0/8fc9b08f4c1e4f4a39b4b04928e469e3.jpg' },
  { id: 2, user: 'Uşak_123', text: 'Sonraki sayfaya geçemedim, bende mi sorun var?', isElite: false, time: '20:16', avatar_url: null },
  { id: 3, user: 'Sukuna', text: 'Domain expansion mükemmel çizilmiş.', isElite: true, time: '20:18', avatar_url: 'https://i.pinimg.com/736x/11/cb/c7/11cbc7d6db64f8ad90bfec064d55ff95.jpg' }
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
      isElite: user?.is_elite || false,
      avatar_url: user?.avatar_url || null,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  return (
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
              return (
              <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/5">
                  {msg.avatar_url ? (
                    <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-white">{msg.user?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${msg.isElite ? 'elite-text-gradient' : 'text-slate-500'}`}>
                      {msg.user}
                    </span>
                    {msg.isElite && <EliteBadge className="!w-3 !h-3 text-[8px]" />}
                    <span className="text-[9px] text-slate-600">{msg.time}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )})}
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
                  className={`w-full bg-black/50 border rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
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
    </AnimatePresence>
  );
}
