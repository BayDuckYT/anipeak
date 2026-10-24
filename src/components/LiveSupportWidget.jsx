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
  Crown,
  Tag,
  Check,
  CircleHelp,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  analyzeSupportMessage, 
  calculateSupportPriority, 
  getPriorityMeta,
  getSupportPlan,
  getSupportPlanLabel,
  SUPPORT_TOPICS 
} from '../lib/supportBot';

const normalizeSupportMessage = (message) => ({
  ...message,
  sender_type: message?.sender_type || message?.sender || 'user'
});

export default function LiveSupportWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(SUPPORT_TOPICS[0]);
  const [showTopicSelect, setShowTopicSelect] = useState(false);
  const [supportView, setSupportView] = useState('chat');
  const [supportStep, setSupportStep] = useState(1);
  const [issueDescription, setIssueDescription] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [intakeError, setIntakeError] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const messagesEndRef = useRef(null);

  const account = user;
  const priorityScore = calculateSupportPriority(account);
  const supportPlan = getSupportPlan(account);
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
      message: `Merhaba ${account?.username || account?.user_metadata?.username || 'değerli izleyicimiz'}! 👋 Ben MahoraPeak Asistanı. Size nasıl yardımcı olabilirim? Aşağıdan konunuzu seçebilir veya sorunuzu yazabilirsiniz.`,
      created_at: new Date().toISOString(),
      actions: [
        { label: '💳 Aura / Bakiye', trigger: 'aura' },
        { label: '👑 Aethe VIP Avantajları', trigger: 'aethe' },
        { label: '📱 Uygulama İndir', trigger: 'uygulama' },
        { label: '👨‍💻 Canlı Yetkiliye Bağlan', trigger: 'force_admin' }
      ]
    };

    if (!user) {
      setMessages([welcomeMsg]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'waiting_admin', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setTicket({ ...data, user_plan: data.user_plan || data.plan_id || 'member' });
        if (data.subject) {
          const matched = SUPPORT_TOPICS.find(t => t.label.includes(data.subject) || data.subject.includes(t.id));
          if (matched) setSelectedTopic(matched);
        }

        const { data: msgData } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', data.id)
          .order('created_at', { ascending: true });

        if (msgData && msgData.length > 0) {
          setMessages(msgData.map(normalizeSupportMessage));
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
          const newMsg = normalizeSupportMessage(payload.new);
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
  const getOrCreateTicket = async (initialQuery = '', contact = {}, startInQueue = false) => {
    if (ticket && !String(ticket.id).startsWith('local_')) return ticket;

    const newTicketData = {
      user_id: user?.id || null,
      user_email: user?.email || contact.email || null,
      user_name: account?.username || account?.user_metadata?.username || contact.name || 'Misafir İzleyici',
      user_avatar: account?.avatar_url || null,
      priority: priorityScore,
      plan_id: supportPlan,
      status: startInQueue ? 'waiting_admin' : 'open',
      subject: selectedTopic?.label || initialQuery.slice(0, 80) || 'Genel Destek',
      ...(startInQueue ? { last_message: initialQuery, last_message_at: new Date().toISOString(), unread_admin: true } : {})
    };

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([newTicketData])
        .select()
        .single();

      if (!error && data) {
        const savedTicket = { ...data, user_plan: data.user_plan || data.plan_id || supportPlan };
        setTicket(savedTicket);
        return savedTicket;
      }
      if (error) console.warn('Destek talebi kaydedilemedi:', error);
    } catch (err) {
      console.warn('Bilet açılamadı, yerel mod devam ediyor:', err);
    }

    const localTicket = { ...newTicketData, id: 'local_' + Date.now() };
    setTicket(localTicket);
    return localTicket;
  };

  // Konu Değiştirme
  const handleSelectTopic = async (topic) => {
    setSelectedTopic(topic);
    setShowTopicSelect(false);

    if (ticket && !ticket.id.startsWith('local_')) {
      try {
        const { error } = await supabase
          .from('support_tickets')
          .update({ subject: topic.label })
          .eq('id', ticket.id);
        if (error) console.warn('Destek konusu güncellenemedi:', error);
      } catch (error) {
        console.warn('Destek konusu güncellenemedi:', error);
      }
    }

    const topicMsg = {
      id: 'sys_' + Date.now(),
      sender_type: 'system',
      sender_name: 'Sistem',
      message: `Konu güncellendi: ${topic.label}`,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, topicMsg]);
  };

  const startSupportChat = async () => {
    setIntakeError('');
    const description = issueDescription.trim();

    if (supportStep === 1) {
      setSupportStep(2);
      return;
    }
    if (description.length < 20) {
      setIntakeError('Sorununuzu en az 20 karakterle biraz daha açıklayın.');
      return;
    }
    if (!user && supportStep === 2) {
      setSupportStep(3);
      return;
    }
    if (!user) {
      if (guestName.trim().length < 2) {
        setIntakeError('Lütfen adınızı ve soyadınızı yazın.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
        setIntakeError('Geçerli bir e-posta adresi girin.');
        return;
      }
    }

    setStartingChat(true);
    let supportStage = 'destek talebini oluşturma';
    try {
      const contact = user ? {} : { name: guestName.trim(), email: guestEmail.trim() };
      const activeTicket = await getOrCreateTicket(description, contact, true);
      if (activeTicket.id.startsWith('local_')) {
        setIntakeError('Destek talebi veritabanına kaydedilemedi. Supabase SQL Editor’da MahoraPeak destek şeması (supabase_support_v3.sql) çalıştırıldıktan sonra yeniden deneyin.');
        return;
      }

      supportStage = 'destek kuyruğuna ekleme';
      const queueReady = await escalateTicketToAdmin(activeTicket, description);
      if (!queueReady) {
        setIntakeError('Talebiniz şu anda destek kuyruğuna eklenemedi. Lütfen yeniden deneyin; sorun sürerse biraz sonra tekrar yazın.');
        return;
      }

      supportStage = 'ilk mesajı kaydetme';
      const { data: savedMessage, error: messageError } = await supabase
        .from('support_messages')
        .insert([{
          ticket_id: activeTicket.id,
          sender: 'user',
          sender_name: user?.username || user?.user_metadata?.username || guestName.trim() || 'Misafir',
          sender_avatar: user?.avatar_url || null,
          message: description
        }])
        .select()
        .single();

      if (messageError || !savedMessage) {
        console.warn('İlk destek mesajı kaydedilemedi:', messageError);
        setIntakeError('Mesajınız kaydedilemedi. Lütfen tekrar deneyin.');
        return;
      }

      setMessages(prev => [
        ...prev.filter(message => message.id !== savedMessage.id),
        { id: `support-opened-${Date.now()}`, sender_type: 'system', message: 'Talebiniz alındı. Bu sohbetten destek ekibiyle yazışabilirsiniz.', created_at: new Date().toISOString() },
        normalizeSupportMessage(savedMessage)
      ]);
      setSupportView('chat');
    } catch (error) {
      console.error(`Canlı destek başlatılamadı (${supportStage}):`, error);
      setIntakeError(`Canlı destek başlatılamadı: ${supportStage} adımında beklenmeyen bir hata oluştu. Biraz sonra yeniden deneyin.`);
    } finally {
      setStartingChat(false);
    }
  };

  const launchSupport = () => {
    setSupportStep(1);
    setIntakeError('');
    setSupportView('intake');
    setIsOpen(true);
  };

  // Mesaj Gönderme
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');

    const activeTicket = await getOrCreateTicket(text);

    // 1. Kullanıcı mesajı ekle
    const userMsg = {
      id: 'usr_' + Date.now(),
      ticket_id: activeTicket.id,
      sender_type: 'user',
      sender_name: account?.username || account?.user_metadata?.username || 'Ben',
      message: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);

    // Veritabanına kaydet
    if (!activeTicket.id.startsWith('local_')) {
      const { error } = await supabase.from('support_messages').insert([{
        ticket_id: activeTicket.id,
        sender: 'user',
        sender_name: userMsg.sender_name,
        sender_avatar: account?.avatar_url || null,
        message: text
      }]);
      if (error) console.warn('Kullanıcı mesajı kaydedilemedi:', error);
      else {
        await supabase.from('support_tickets').update({
          last_message: text,
          last_message_at: new Date().toISOString(),
          unread_admin: true
        }).eq('id', activeTicket.id);
      }
    }

    // 2. Bot Otonom Cevap Motoru Analizi
    setIsTyping(true);

    setTimeout(async () => {
      const botResult = analyzeSupportMessage(text);
      setIsTyping(false);

      if (botResult) {
        const queueConnected = botResult.escalateToAdmin
          ? await escalateTicketToAdmin(activeTicket, text)
          : false;
        const botMsg = {
          id: 'bot_' + Date.now(),
          ticket_id: activeTicket.id,
          sender_type: 'bot',
          sender_name: 'Mahora Asistan',
          message: botResult.escalateToAdmin
            ? (queueConnected
              ? 'Talebiniz destek kuyruğuna alındı. Yanıt geldiğinde bu sohbetten görebilirsiniz.'
              : 'Talebiniz şu anda destek kuyruğuna eklenemedi. Lütfen yeniden deneyin; sorun sürerse biraz sonra tekrar yazın.')
            : botResult.reply,
          actions: botResult.actions || [],
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMsg]);

        // Veritabanına bot mesajını kaydet
        if (!activeTicket.id.startsWith('local_')) {
          supabase.from('support_messages').insert([{
            ticket_id: activeTicket.id,
            sender: 'bot',
            sender_name: 'Mahora Asistan',
            message: botResult.reply
          }]).then(({ error }) => { if (error) console.warn('Asistan mesajı kaydedilemedi:', error); });
        }

      }
    }, 600);
  };

  // Yetkiliye Aktar (Admin Kuyruğuna Al)
  const escalateTicketToAdmin = async (currentTicket, latestMessage = '') => {
    const t = currentTicket || ticket;

    if (t?.id && !String(t.id).startsWith('local_')) {
      try {
        const { error } = await supabase
          .from('support_tickets')
          .update({
            status: 'waiting_admin',
            priority: priorityScore,
            ...(latestMessage ? { last_message: latestMessage } : {}),
            last_message_at: new Date().toISOString(),
            unread_admin: true
          })
          .eq('id', t.id);

        if (error) {
          console.warn('Destek talebi kuyruğa alınamadı:', error);
          return false;
        }
      } catch (error) {
        console.warn('Destek talebi kuyruğa alınamadı:', error);
        return false;
      }
      setTicket(prev => prev?.id === t.id ? { ...prev, status: 'waiting_admin' } : prev);
      return true;
    }
    return false;
  };

  // Buton Tıklaması
  const handleActionClick = async (action) => {
    if (action.trigger === 'force_admin') {
      const activeTicket = await getOrCreateTicket('Canlı destek yetkilisi');
      const queued = await escalateTicketToAdmin(activeTicket, 'Canlı destek yetkilisi talebi');
      const adminNoticeMsg = {
        id: 'escalate_' + Date.now(),
        sender_type: 'bot',
        sender_name: 'Mahora Asistan',
        message: queued
          ? 'Talebiniz destek kuyruğuna alındı. Yanıt geldiğinde bu sohbetten görebilirsiniz.'
          : 'Talebiniz şu anda destek kuyruğuna eklenemedi. Lütfen yeniden deneyin; sorun sürerse biraz sonra tekrar yazın.',
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
      {/* Kompakt destek açma düğmesi */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {!isOpen && (
          <button
          onClick={launchSupport}
          aria-label="Yardıma mı ihtiyacınız var?"
            title="MahoraPeak destek merkezi"
            className="relative group grid h-12 w-12 place-items-center rounded-full border border-purple-300/40 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-[0_6px_24px_rgba(147,51,234,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_32px_rgba(147,51,234,0.7)] active:scale-95"
          >
            <CircleHelp className="h-6 w-6" aria-hidden="true" />

            {/* Okunmamış Rozet */}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#090614] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* CANLI DESTEK PENCERESİ */}
      {isOpen && (
        <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-2 left-2 sm:left-auto sm:right-8 sm:bottom-8 w-auto sm:w-[410px] h-[min(620px,calc(100dvh-2rem-env(safe-area-inset-bottom)))] max-h-[88dvh] z-50 flex flex-col rounded-3xl bg-[#090518]/95 backdrop-blur-2xl border border-purple-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          
          {/* ÜST BAŞLIK / HEADER */}
          <div className="relative p-4 bg-gradient-to-r from-purple-950/90 via-[#130b2c] to-indigo-950/90 border-b border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-[0_0_18px_rgba(168,85,247,0.6)]">
                <Bot className="w-5 h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-violet-300 rounded-full border-2 border-[#090518]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-sm tracking-wide">MahoraPeak Asistan</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-200 font-bold border border-violet-400/20">
                    Yardım merkezi
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Otomatik yardım ve canlı destek</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {supportView === 'intake' ? (
            <div className="flex flex-1 min-h-0 flex-col bg-[#0b0719]">
              <div className="px-5 pt-5 pb-4">
                <div className="mb-3 flex items-center justify-between text-[11px] text-gray-400">
                  {supportStep > 1 ? (
                    <button
                      onClick={() => { setIntakeError(''); setSupportStep(step => step - 1); }}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 -ml-2 text-gray-300 hover:bg-white/5"
                    ><ArrowLeft size={14} /> Geri</button>
                  ) : <span>MahoraPeak Destek</span>}
                  <span>Adım {supportStep} / {user ? 2 : 3}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300" style={{ width: `${(supportStep / (user ? 2 : 3)) * 100}%` }} />
                </div>
                <h4 className="mt-5 text-xl font-bold tracking-tight text-white">
                  {supportStep === 1 ? 'Size nasıl yardımcı olabiliriz?' : supportStep === 2 ? 'Talebinizi kısaca anlatın' : 'Size nasıl ulaşalım?'}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-gray-400">
                  {supportStep === 1 ? 'Konuyu seçin; talebinizi doğru ekibe iletelim.' : supportStep === 2 ? 'Sorunu ilk mesajda anlatmanız daha hızlı yardımcı olmamızı sağlar.' : 'Yanıtımız bu sohbet penceresinde görünür; e-posta adresinizi de iletişim için kullanırız.'}
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
                {supportStep === 1 && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] divide-y divide-white/[0.07]">
                    {SUPPORT_TOPICS.map(topic => {
                      const selected = selectedTopic?.id === topic.id;
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => setSelectedTopic(topic)}
                          className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${selected ? 'bg-violet-500/10' : 'hover:bg-white/[0.04]'}`}
                        >
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-base ${selected ? 'border-violet-400/30 bg-violet-500/15' : 'border-white/10 bg-white/[0.04]'}`}>{topic.label.split(' ')[0]}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-white">{topic.label.replace(/^\S+\s/, '')}</span>
                            <span className="mt-0.5 block text-xs text-gray-400">{topic.description}</span>
                          </span>
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-violet-300 bg-violet-400 text-[#160c2a]' : 'border-gray-500'}`}>
                            {selected && <Check size={12} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {supportStep === 2 && (
                  <div>
                    <textarea
                      value={issueDescription}
                      onChange={event => { setIssueDescription(event.target.value); setIntakeError(''); }}
                      maxLength={2000}
                      rows={6}
                      placeholder="Örn. ne oldu, ne zaman oldu, hangi seri veya sayfada?"
                      className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-sm leading-relaxed text-white outline-none placeholder:text-gray-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/15"
                    />
                    <div className="mt-2 flex items-start justify-between gap-3 text-[11px] text-gray-500">
                      <span>Talebinizin doğru ekibe ulaşması için birkaç ayrıntı ekleyin.</span>
                      <span className="shrink-0">{issueDescription.trim().length} / 20 min.</span>
                    </div>
                  </div>
                )}

                {supportStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="support-guest-name" className="mb-1.5 block text-xs font-semibold text-gray-300">Ad soyad</label>
                      <input id="support-guest-name" autoComplete="name" value={guestName} onChange={event => setGuestName(event.target.value)} placeholder="Adınız ve soyadınız" maxLength={100} className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-400/70" />
                    </div>
                    <div>
                      <label htmlFor="support-guest-email" className="mb-1.5 block text-xs font-semibold text-gray-300">E-posta</label>
                      <input id="support-guest-email" type="email" autoComplete="email" value={guestEmail} onChange={event => setGuestEmail(event.target.value)} placeholder="ornek@eposta.com" maxLength={254} className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-400/70" />
                    </div>
                    <p className="text-xs leading-relaxed text-gray-500">E-posta adresiniz yalnızca bu destek talebine yanıt vermek için kullanılır.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.07] bg-[#090614] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {intakeError && <p role="alert" className="mb-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{intakeError}</p>}
                <button
                  type="button"
                  onClick={startSupportChat}
                  disabled={startingChat || (supportStep === 2 && issueDescription.trim().length < 20) || (supportStep === 3 && (!guestName.trim() || !guestEmail.trim()))}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {startingChat ? 'Sohbet hazırlanıyor…' : supportStep === 1 ? 'Devam et' : supportStep === 2 && !user ? 'Devam et' : 'Sohbete geç'}
                  {!startingChat && <ArrowRight size={16} />}
                </button>
                <p className="mt-2 text-center text-[10px] text-gray-600">Güvenli destek altyapısı · MahoraPeak</p>
              </div>
            </div>
          ) : (
            <>

          {/* KONU SEÇİCİ BARI */}
          <div className="relative px-3.5 py-2 bg-[#0c0722] border-b border-purple-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] text-gray-400">Konu:</span>
              <span className="font-bold text-purple-200 text-xs truncate max-w-[180px]">
                {selectedTopic?.label}
              </span>
            </div>

            <button
              onClick={() => setShowTopicSelect(!showTopicSelect)}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 transition flex items-center gap-1"
            >
              <span>Değiştir</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showTopicSelect ? 'rotate-180' : ''}`} />
            </button>

            {/* Konu Seçim Menüsü */}
            {showTopicSelect && (
              <div className="absolute top-full left-0 right-0 z-20 bg-[#0c0724] border-b border-purple-500/30 shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 px-2 py-1">Yardım Konunuzu Seçin</p>
                {SUPPORT_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      selectedTopic?.id === topic.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{topic.label}</span>
                    {selectedTopic?.id === topic.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {account && (
            <div className="px-3.5 py-2 bg-[#100a25] border-b border-purple-500/15 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400">Hesap önceliği</span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${priorityMeta.badge}`}>
                {getSupportPlanLabel(supportPlan)}{priorityScore >= 250 ? ' · Öncelikli kuyruk' : ''}
              </span>
            </div>
          )}

          {/* SOHBET MESAJ ALANI */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-purple-600/30 hover:scrollbar-thumb-purple-500/50">
            {messages.map((msg, index) => {
              const isUser = msg.sender_type === 'user';
              const isBot = msg.sender_type === 'bot';
              const isSystem = msg.sender_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id || index} className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 text-[11px] text-center flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
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
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(168,85,247,0.3)]'
                        : isBot
                        ? 'bg-[#150d30] border border-purple-500/30 text-gray-100 rounded-tl-none'
                        : 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 rounded-tl-none'
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/40 text-[11px] font-semibold transition"
                              >
                                {act.label} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <Link
                                key={actIdx}
                                to={act.url}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/40 text-[11px] font-semibold transition"
                              >
                                {act.label}
                              </Link>
                            )
                          ) : (
                            <button
                              key={actIdx}
                              onClick={() => handleActionClick(act)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/40 to-indigo-600/40 hover:from-purple-600 hover:to-indigo-600 text-white border border-purple-400/40 text-[11px] font-semibold transition shadow-sm"
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
          <div className="px-3 py-1.5 bg-[#070314]/90 border-t border-purple-500/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
              <Headphones className="w-3 h-3" /> Canlı Yetkili
            </button>
          </div>

          {/* MESAJ YAZMA ALANI */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0a051c] border-t border-purple-500/30 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={selectedTopic?.placeholder || "Bir soru yazın veya yardım isteyin..."}
              aria-label="Destek mesajınız"
              maxLength={2000}
              className="flex-1 bg-white/5 border border-purple-500/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white disabled:opacity-40 hover:opacity-95 active:scale-95 transition shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
