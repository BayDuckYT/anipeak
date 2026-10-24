// src/components/LiveSupportWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  UserCheck, 
  Sparkles, 
  ChevronDown, 
  ExternalLink, 
  AlertCircle,
  Clock,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  analyzeSupportMessage, 
  calculateSupportPriority, 
  getPriorityMeta 
} from '../lib/supportBot';

export default function LiveSupportWidget() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnectingAdmin, setIsConnectingAdmin] = useState(false);
  const messagesEndRef = useRef(null);

  const priorityScore = calculateSupportPriority(user, profile);
  const priorityMeta = getPriorityMeta(priorityScore);

  // Otomatik aşağı kaydır
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  // Sayfa yüklendiğinde var olan aktif bileti veya karşılama mesajını başlat
  useEffect(() => {
    initTicket();
  }, [user?.id]);

  const initTicket = async () => {
    const welcomeMsg = {
      id: 'welcome-bot',
      sender_type: 'bot',
      sender_name: 'Mahora Asistan',
      message: `Merhaba ${profile?.username || user?.user_metadata?.username || 'değerli izleyicimiz'}! 👋 Ben AniPeak Destek Asistanı. Size nasıl yardımcı olabilirim? Merak ettiğiniz bir konuyu yazabilir veya aşağıdaki hızlı butonları kullanabilirsiniz.`,
      created_at: new Date().toISOString(),
      actions: [
        { label: '💳 Aura / Bakiye', trigger: 'aura' },
        { label: '👑 Aethe VIP Avantajları', trigger: 'aethe' },
        { label: '📱 Uygulama İndir', trigger: 'uygulama' },
        { label: '👨‍💻 Yetkiliye Bağlan', trigger: 'force_admin' }
      ]
    };

    if (!user) {
      // Misafir oturumu - Local fallback
      setMessages([welcomeMsg]);
      return;
    }

    try {
      // Kullanıcının açık ticket'ı var mı?
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'waiting_admin', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setTicket(data);
        // Biletin mesajlarını çek
        const { data: msgData } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', data.id)
          .order('created_at', { ascending: true });

        if (msgData && msgData.length > 0) {
          setMessages(msgData);
        } else {
          setMessages([welcomeMsg]);
        }
      } else {
        setMessages([welcomeMsg]);
      }
    } catch (err) {
      console.warn('Destek ticket yüklenirken fallback kullanılıyor:', err);
      setMessages([welcomeMsg]);
    }
  };

  // Realtime Mesaj Dinleyici
  useEffect(() => {
    if (!ticket?.id) return;

    const channel = supabase
      .channel(`support_ticket_${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        (payload) => {
          const newMsg = payload.new;
          // Eğer mesaj bot veya kullanıcı tarafından zaten lokal eklenmediyse
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (!isOpen) {
            setUnreadCount(c => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket?.id, isOpen]);

  // Yeni Bilet Açma veya Varolanı Alma
  const getOrCreateTicket = async (initialQuery = '') => {
    if (ticket) return ticket;

    const newTicketData = {
      user_id: user?.id || null,
      user_email: user?.email || 'guest@anipeak.com',
      user_name: profile?.username || user?.user_metadata?.username || 'Misafir Kullanıcı',
      user_avatar: profile?.avatar_url || null,
      priority: priorityScore,
      user_plan: profile?.subscription_plan || profile?.plan || 'member',
      status: 'open',
      subject: initialQuery.slice(0, 80) || 'Canlı Destek Görüşmesi'
    };

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([newTicketData])
        .select()
        .single();

      if (!error && data) {
        setTicket(data);
        return data;
      }
    } catch (err) {
      console.warn('Veritabanına bilet açılamadı, yerel mod devam ediyor:', err);
    }

    const localTicket = { ...newTicketData, id: 'local_' + Date.now() };
    setTicket(localTicket);
    return localTicket;
  };

  // Mesaj Gönderme
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');

    const activeTicket = await getOrCreateTicket(text);

    // 1. Kullanıcı mesajını ekle
    const userMsg = {
      id: 'usr_' + Date.now(),
      ticket_id: activeTicket.id,
      sender_type: 'user',
      sender_name: profile?.username || user?.user_metadata?.username || 'Ben',
      message: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);

    // Veritabanına kaydet
    if (!activeTicket.id.startsWith('local_')) {
      supabase.from('support_messages').insert([{
        ticket_id: activeTicket.id,
        sender_type: 'user',
        sender_name: userMsg.sender_name,
        sender_avatar: profile?.avatar_url || null,
        message: text
      }]).catch(e => console.warn(e));
    }

    // 2. Bot Otonom Cevap Motoru Analizi
    setIsTyping(true);

    setTimeout(async () => {
      const botResult = analyzeSupportMessage(text);
      setIsTyping(false);

      if (botResult) {
        const botMsg = {
          id: 'bot_' + Date.now(),
          ticket_id: activeTicket.id,
          sender_type: 'bot',
          sender_name: 'Mahora Asistan',
          message: botResult.reply,
          actions: botResult.actions || [],
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMsg]);

        // Veritabanına bot mesajını kaydet
        if (!activeTicket.id.startsWith('local_')) {
          supabase.from('support_messages').insert([{
            ticket_id: activeTicket.id,
            sender_type: 'bot',
            sender_name: 'Mahora Asistan',
            message: botResult.reply
          }]).catch(e => console.warn(e));
        }

        // Eğer bot yetkiliye aktarma ihtiyacı hissettiyse
        if (botResult.escalateToAdmin) {
          escalateTicketToAdmin(activeTicket);
        }
      }
    }, 700);
  };

  // Yetkiliye Aktar (Admin Kuyruğuna Al)
  const escalateTicketToAdmin = async (currentTicket) => {
    setIsConnectingAdmin(true);
    const t = currentTicket || ticket;

    if (t && !t.id.startsWith('local_')) {
      await supabase
        .from('support_tickets')
        .update({
          status: 'waiting_admin',
          priority: priorityScore, // VIP derecesi ile en tepeye
          updated_at: new Date().toISOString()
        })
        .eq('id', t.id)
        .catch(e => console.warn(e));
    }

    setTimeout(() => {
      setIsConnectingAdmin(false);
    }, 1500);
  };

  // Buton Tıklaması
  const handleActionClick = (action) => {
    if (action.trigger === 'force_admin') {
      escalateTicketToAdmin();
      const adminNoticeMsg = {
        id: 'escalate_' + Date.now(),
        sender_type: 'system',
        sender_name: 'Sistem',
        message: `Talebiniz ${priorityMeta.label} önceliğiyle canlı destek yetkilimize aktarıldı. Sıranız: 1. Öncelikli Bekleme Havuzu. Lütfen sayfayı kapatmayın, buradan yanıt verilecektir!`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, adminNoticeMsg]);
      return;
    }

    if (action.trigger) {
      handleSendMessage(action.label);
    }
  };

  // Reader (bölüm okuma) sayfasındayken gizle
  const isReaderPage = location.pathname.startsWith('/manga/') && location.pathname.split('/').filter(Boolean).length >= 3;
  if (isReaderPage) return null;

  return (
    <>
      {/* SAĞ ALT TETİKLEME BUTONU */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Canlı Destek"
            className={`relative group flex items-center gap-3 px-4 py-3.5 rounded-full bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 text-white font-semibold shadow-[0_8px_30px_rgba(147,51,234,0.45)] hover:shadow-[0_10px_40px_rgba(147,51,234,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20`}
          >
            {/* Canlı Parlama Efekti */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 blur-md group-hover:opacity-100 transition duration-300 -z-10 animate-pulse"></span>

            <div className="relative">
              <Headphones className="w-5 h-5 animate-bounce" />
              {/* Online Yeşil Nokta */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#090614] shadow-[0_0_8px_#34d399]" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs uppercase tracking-wider font-bold text-pink-200">Canlı Yardım</span>
              <span className="text-[11px] text-white/80 font-normal">7/24 Otonom Destek</span>
            </div>

            {/* Okunmamış Rozet */}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#090614] animate-pulse">
                {unreadCount}
              </span>
            )}

            {/* Aethe VIP Özel Rozet */}
            {priorityScore >= 1000 && (
              <div className="hidden sm:flex items-center gap-1 bg-amber-400 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)]">
                <Crown className="w-3 h-3 fill-black" />
                VIP 1. SIRA
              </div>
            )}
          </button>
        )}
      </div>

      {/* CANLI DESTEK PENCERESİ */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[410px] h-[580px] max-h-[85vh] z-50 flex flex-col rounded-2xl bg-[#0c081a]/95 backdrop-blur-2xl border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          
          {/* ÜST BAŞLIK / HEADER */}
          <div className="relative p-4 bg-gradient-to-r from-purple-950/80 via-[#130b2c] to-indigo-950/80 border-b border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0c081a]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">AniPeak Asistan</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    Çevrimiçi
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Akıllı Bot & Canlı Temsilci Masası</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* KULLANICI VIP ÖNCELİK BİLGİ BANDI */}
          <div className={`px-4 py-2 bg-gradient-to-r ${priorityMeta.color} flex items-center justify-between text-xs font-bold border-b border-white/10 ${priorityMeta.glow}`}>
            <div className="flex items-center gap-1.5">
              <span>{priorityMeta.label}</span>
            </div>
            <span className="text-[10px] opacity-90 font-medium">
              {priorityScore >= 1000 ? 'Sırada En Üstte' : 'Öncelikli Sıra'}
            </span>
          </div>

          {/* SOHBET MESAJ ALANI */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-purple-600/30">
            {messages.map((msg, index) => {
              const isUser = msg.sender_type === 'user';
              const isBot = msg.sender_type === 'bot';
              const isSystem = msg.sender_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id || index} className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-200 text-xs text-center flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{msg.message}</span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-400">
                    {isBot ? (
                      <span className="text-purple-400 font-semibold flex items-center gap-1">
                        <Bot className="w-3 h-3" /> Mahora Bot
                      </span>
                    ) : isUser ? (
                      <span className="text-pink-400 font-medium">Siz</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Destek Yetkilisi
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(168,85,247,0.3)]'
                        : isBot
                        ? 'bg-white/5 border border-purple-500/20 text-gray-100 rounded-tl-none'
                        : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-100 rounded-tl-none'
                    }`}
                  >
                    {msg.message}

                    {/* Bot Aksiyon Butonları */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, actIdx) => (
                          act.url ? (
                            act.external ? (
                              <a
                                key={actIdx}
                                href={act.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/40 text-[11px] font-semibold transition"
                              >
                                {act.label} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <Link
                                key={actIdx}
                                to={act.url}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/40 text-[11px] font-semibold transition"
                              >
                                {act.label}
                              </Link>
                            )
                          ) : (
                            <button
                              key={actIdx}
                              onClick={() => handleActionClick(act)}
                              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/40 to-indigo-600/40 hover:from-purple-600 hover:to-indigo-600 text-white border border-purple-400/30 text-[11px] font-semibold transition"
                            >
                              {act.label}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Daktilo / Yazıyor Efekti */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-purple-300">
                <Bot className="w-3.5 h-3.5 animate-bounce" />
                <span className="flex gap-1 items-center bg-white/5 px-3 py-1.5 rounded-full border border-purple-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse delay-100"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse delay-200"></span>
                  <span className="ml-1 text-[11px]">Mahora yazıyor...</span>
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* HIZLI KONU ETİKETLERİ */}
          <div className="px-3 py-1.5 bg-[#090614]/80 border-t border-purple-500/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSendMessage('Aura bakiye nasıl yüklenir?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] border border-white/10 transition"
            >
              💳 Aura Yükle
            </button>
            <button
              onClick={() => handleSendMessage('Uygulama nasıl indirilir?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] border border-white/10 transition"
            >
              📱 Uygulama İndir
            </button>
            <button
              onClick={() => handleSendMessage('Video açılmıyor hata veriyor')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] border border-white/10 transition"
            >
              ⚠️ Video Hatası
            </button>
            <button
              onClick={() => handleActionClick({ trigger: 'force_admin' })}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-semibold border border-amber-500/30 transition flex items-center gap-1"
            >
              <Crown className="w-3 h-3" /> Yetkiliye Aktar
            </button>
          </div>

          {/* MESAJ YAZMA ALANI */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0a0618] border-t border-purple-500/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Bir soru yazın veya yardım isteyin..."
              className="flex-1 bg-white/5 border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition shadow-[0_0_12px_rgba(168,85,247,0.4)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
