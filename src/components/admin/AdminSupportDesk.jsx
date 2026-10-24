// src/components/admin/AdminSupportDesk.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  Send, 
  Bot, 
  UserCheck, 
  Sparkles, 
  Crown, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Search,
  Zap,
  Filter,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  getPriorityMeta, 
  getSupportPriority,
  getSupportPlanLabel,
  ADMIN_CANNED_RESPONSES 
} from '../../lib/supportBot';

const getTicketPriority = (ticket) => {
  const storedPriority = Number(ticket?.priority);
  const plan = ticket?.user_plan || ticket?.plan_id;
  if (plan) return Math.max(Number.isFinite(storedPriority) ? storedPriority : 0, getSupportPriority({ active_plan_id: plan }));
  return Number.isFinite(storedPriority) && storedPriority > 0 ? storedPriority : 50;
};

const normalizeSupportMessage = (message) => ({
  ...message,
  sender_type: message?.sender_type || message?.sender || 'user'
});

export default function AdminSupportDesk() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all, waiting_admin, in_progress, closed
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Biletleri Çek - Kesin Kural: priority DESC, created_at ASC (VIP en üstte, eşitlikte ilk yazan en üstte!)
  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (statusFilter === 'closed') {
        query = query.in('status', ['resolved', 'closed']);
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        const ordered = data.map(ticket => ({
          ...ticket,
          user_plan: ticket.user_plan || ticket.plan_id || 'member'
        })).sort((a, b) => {
          const byPriority = getTicketPriority(b) - getTicketPriority(a);
          return byPriority || new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setTickets(ordered);
        setSelectedTicket(previous => !previous || !ordered.some(item => item.id === previous.id) ? (ordered[0] || null) : previous);
      } else if (!error) {
        setTickets([]);
        setSelectedTicket(null);
      }
    } catch (err) {
      console.warn('Destek biletleri çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-support-ticket-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [statusFilter]);

  // Seçili bilet değiştikçe mesajlarını çek
  useEffect(() => {
    if (!selectedTicket?.id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', selectedTicket.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setMessages(data.map(normalizeSupportMessage));
        }
      } catch (err) {
        console.warn('Mesajlar çekilemedi:', err);
      }
    };

    fetchMessages();

    // Realtime Mesaj Dinleyici
    const channel = supabase
      .channel(`admin_chat_${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, normalizeSupportMessage(payload.new)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Admin Mesaj Gönderme
  const handleSendAdminReply = async (textToSend) => {
    const text = (textToSend || replyText).trim();
    if (!text || !selectedTicket?.id || ['resolved', 'closed'].includes(selectedTicket.status)) return;

    setSending(true);
    setReplyText('');

    const newMsg = {
      ticket_id: selectedTicket.id,
      sender: 'admin',
      sender_name: user?.username || 'Yetkili Destek Ekibi',
      sender_avatar: user?.avatar_url || null,
      message: text
    };

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert([newMsg])
        .select()
        .single();

      if (!error && data) {
        setMessages(prev => [...prev, normalizeSupportMessage(data)]);
      }

      // Bileti 'in_progress' durumuna güncelle
      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress', last_message: text, last_message_at: new Date().toISOString(), unread_user: true })
        .eq('id', selectedTicket.id);

      // Listeyi de güncelle
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'in_progress' } : t));
    } catch (err) {
      console.error('Mesaj gönderilemedi:', err);
    } finally {
      setSending(false);
    }
  };

  // Bilet Durumunu Güncelle (Çözüldü, Beklemede, vb.)
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket?.id) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', selectedTicket.id);
      if (error) throw error;

      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      setTickets(prev => {
        const shouldRemain = statusFilter === 'all' ||
          (statusFilter === 'closed' ? ['resolved', 'closed'].includes(newStatus) : statusFilter === newStatus);
        if (!shouldRemain) return prev.filter(t => t.id !== selectedTicket.id);
        return prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t);
      });
    } catch (err) {
      console.error('Bilet durumu güncellenemedi:', err);
    }
  };

  // Filtrelenmiş biletler
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || (priorityFilter === 'priority' ? getTicketPriority(t) >= 250 : getTicketPriority(t) < 250);
    return matchesSearch && matchesPriority;
  });

  const waitingCount = tickets.filter(t => t.status === 'waiting_admin').length;
  const activeCount = tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length;
  const priorityCount = tickets.filter(t => getTicketPriority(t) >= 250 && !['resolved', 'closed'].includes(t.status)).length;

  return (
    <div className="flex flex-col lg:flex-row h-[min(780px,calc(100dvh-190px))] min-h-[560px] bg-[#090614]/90 rounded-2xl border border-purple-500/20 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.7)]">
      
      {/* SOL PANEL: ÖNCELİKLİ KUYRUK LİSTESİ */}
      <div className="w-full lg:w-96 min-h-0 border-b lg:border-b-0 lg:border-r border-purple-500/20 flex flex-col bg-[#070410]">
        
        {/* Panel Başlığı & Yenile */}
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Canlı Destek Masası</h2>
              <p className="text-[11px] text-gray-400">Önceliğe ve bekleme süresine göre</p>
            </div>
          </div>
          <button
            onClick={fetchTickets}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 px-3 pt-3">
          {[
            { label: 'Yanıt bekliyor', value: waitingCount, tone: 'text-amber-300' },
            { label: 'Açık görüşme', value: activeCount, tone: 'text-cyan-300' },
            { label: 'Öncelikli', value: priorityCount, tone: 'text-violet-300' }
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-2 py-2">
              <div className={`text-lg font-bold leading-none ${stat.tone}`}>{stat.value}</div>
              <div className="mt-1 text-[9px] leading-tight text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Arama & Durum Filtreleri */}
        <div className="p-3 space-y-2 border-b border-purple-500/10">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı veya konu ara..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'open', label: '🆕 Yeni' },
              { id: 'waiting_admin', label: '⚡ Yetkili Bekleyen' },
              { id: 'in_progress', label: '💬 Aktif' },
              { id: 'closed', label: '✅ Kapatılan' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  statusFilter === tab.id
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <Filter className="h-3 w-3 shrink-0" />
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-purple-500/15 bg-[#100b1e] px-2 py-1.5 text-[11px] text-gray-300 outline-none focus:border-purple-400/50"
              aria-label="Destek önceliği filtresi"
            >
              <option value="all">Tüm öncelikler</option>
              <option value="priority">Öncelikli üyeler</option>
              <option value="standard">Standart sıra</option>
            </select>
            <span className="shrink-0">{filteredTickets.length} talep</span>
          </div>
        </div>

        {/* Bilet Listesi */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-purple-600/30">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              {loading ? 'Biletler yükleniyor...' : 'Kriterlere uygun bilet bulunamadı.'}
            </div>
          ) : (
            filteredTickets.map((t, idx) => {
              const priority = getTicketPriority(t);
              const meta = getPriorityMeta(priority);
              const isSelected = selectedTicket?.id === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-purple-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                      <span className="font-semibold text-white text-xs truncate max-w-[130px]">
                        {t.user_name || 'Kullanıcı'}
                      </span>
                    </div>

                    {/* VIP Rozet */}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                      {meta.short}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 truncate mb-2">
                    {t.subject || 'Destek Talebi'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(t.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} · {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <span className={`px-2 py-0.5 rounded font-medium ${
                      t.status === 'waiting_admin' ? 'bg-amber-500/20 text-amber-300' :
                      t.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-300' :
                      ['resolved', 'closed'].includes(t.status) ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {t.status === 'waiting_admin' ? 'Yetkili Bekliyor' :
                       t.status === 'in_progress' ? 'Görüşülüyor' :
                       ['resolved', 'closed'].includes(t.status) ? 'Kapatıldı' : 'Açık'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SAĞ PANEL: SEÇİLİ BİLET VE CANLI CHAT */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#0b071a]">
        {selectedTicket ? (
          <>
            {/* ÜST BİLET BİLGİ ÇUBUĞU */}
            <div className="p-4 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-3 bg-[#0d091e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-purple-300 text-sm">
                  {selectedTicket.user_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{selectedTicket.user_name}</h3>
                    {(() => {
                      const meta = getPriorityMeta(getTicketPriority(selectedTicket));
                      return (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                          {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {selectedTicket.user_email || 'Misafir'} · {getSupportPlanLabel(selectedTicket.user_plan || selectedTicket.plan_id || 'member')} · Açılış: {new Date(selectedTicket.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              {/* Bilet Durum Eylemleri */}
              <div className="flex items-center gap-2">
                {!['resolved', 'closed'].includes(selectedTicket.status) ? (
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Çözüldü Olarak Kapat
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold transition"
                  >
                    Yeniden Aç
                  </button>
                )}
              </div>
            </div>

            {/* SOHBET MESAJLARI AKIŞI */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-purple-600/30">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  Henüz mesaj yok.
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isAdmin = m.sender_type === 'admin';
                  const isBot = m.sender_type === 'bot';

                  return (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-400">
                        {isAdmin ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Siz ({m.sender_name})
                          </span>
                        ) : isBot ? (
                          <span className="text-purple-400 font-semibold flex items-center gap-1">
                            <Bot className="w-3 h-3" /> Mahora Asistan (Bot)
                          </span>
                        ) : (
                          <span className="text-pink-400 font-semibold">
                            {selectedTicket.user_name}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                          isAdmin
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-none shadow-[0_4px_15px_rgba(16,185,129,0.3)]'
                            : isBot
                            ? 'bg-purple-950/40 border border-purple-500/20 text-purple-200 rounded-tl-none'
                            : 'bg-white/10 text-white border border-white/10 rounded-tl-none'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {['resolved', 'closed'].includes(selectedTicket.status) ? (
              <div className="border-t border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs text-gray-400">
                Bu talep kapatıldı. Yanıt göndermek için önce <span className="font-semibold text-violet-200">Yeniden Aç</span> seçin.
              </div>
            ) : <>
            {/* HAZIR ŞABLON HIZLI CEVAPLAR (CANNED RESPONSES) */}
            <div className="p-2.5 bg-[#080514] border-t border-purple-500/10">
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-purple-300">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Hazır Hızlı Yanıtlar:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {ADMIN_CANNED_RESPONSES.map((canned, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendAdminReply(canned.text)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/30 text-gray-300 hover:text-white border border-white/10 text-[11px] transition flex items-center gap-1"
                  >
                    {canned.title}
                  </button>
                ))}
              </div>
            </div>

            {/* CEVAP YAZMA GİRİŞİ */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAdminReply();
              }}
              className="p-3 bg-[#080514] border-t border-purple-500/20 flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`${selectedTicket.user_name} kullanıcısına yanıt yazın...`}
                className="flex-1 bg-white/5 border border-purple-500/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || sending}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 transition shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gönder</span>
              </button>
            </form>
            </>}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <Headphones className="w-12 h-12 mb-3 text-purple-500/30" />
            <p className="text-sm font-medium text-gray-400">Görüntülemek için sol listeden bir destek bileti seçin.</p>
            <p className="text-xs text-gray-600 mt-1">Aethe VIP üyeler kuyrukta her zaman en üstte listelenir.</p>
          </div>
        )}
      </div>

    </div>
  );
}
