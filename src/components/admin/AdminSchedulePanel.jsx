import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Star, Plus, Trash2, Edit3, Copy, Send, 
  RefreshCw, Search, CheckCircle2, AlertTriangle, Sparkles, 
  ChevronRight, ArrowRight, Eye, Bell, BellRing, Filter, Flame
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AdminSchedulePanel({ showToast }) {
  const { sortedSeries = [], addAnnouncement } = useApp();
  const { sendNotification } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'this_week'
  const [editingId, setEditingId] = useState(null);

  // Quick Delay / Broadcast Modal State
  const [delayModalItem, setDelayModalItem] = useState(null);
  const [delayReason, setDelayReason] = useState('Çeviri ve edit aşamasında, bu akşam yayında olacak!');

  const [broadcastItem, setBroadcastItem] = useState(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Form State
  const initialForm = {
    release_date: getLocalDateString(),
    release_time: '18:00',
    series_id: '',
    series_name: '',
    poster_url: '',
    chapter_info: '',
    category: 'Aksiyon',
    rating: '9.5',
    status: 'scheduled',
    is_new_series: false,
    notify_followers: true,
    create_announcement: false
  };
  const [formData, setFormData] = useState(initialForm);
  const [seriesSearchTerm, setSeriesSearchTerm] = useState('');
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);

  // Fetch Schedules
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('publishing_schedule')
        .select('*')
        .order('release_date', { ascending: true })
        .order('release_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('[AdminSchedule] fetch error:', err);
      showToast?.('Takvim verisi yüklenemedi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Filtered series list for autocomplete
  const filteredSeriesList = useMemo(() => {
    if (!seriesSearchTerm) return sortedSeries.slice(0, 15);
    const q = seriesSearchTerm.toLocaleLowerCase('tr-TR');
    return sortedSeries.filter(s => 
      s.title?.toLocaleLowerCase('tr-TR').includes(q)
    ).slice(0, 15);
  }, [sortedSeries, seriesSearchTerm]);

  // Handle selecting a series from dropdown
  const handleSelectSeries = (s) => {
    // Smart chapter prediction
    let nextChap = 'Bölüm 1';
    if (s.chapters && Array.isArray(s.chapters) && s.chapters.length > 0) {
      nextChap = `Bölüm ${s.chapters.length + 1}`;
    }

    setFormData(prev => ({
      ...prev,
      series_id: s.id,
      series_name: s.title,
      poster_url: s.cover || '',
      category: s.genre || 'Aksiyon',
      rating: s.rating || '9.5',
      chapter_info: nextChap,
      is_new_series: false
    }));
    setSeriesSearchTerm(s.title);
    setShowSeriesDropdown(false);
  };

  // Safe insert with fallback if optional columns don't exist yet
  const insertOrUpdateSchedule = async (payload, id = null) => {
    const fullPayload = { ...payload };
    
    // First attempt with full payload
    let res = id
      ? await supabase.from('publishing_schedule').update(fullPayload).eq('id', id).select().single()
      : await supabase.from('publishing_schedule').insert([fullPayload]).select().single();

    if (!res.error) return res;

    // If failed due to missing columns (status, delay_reason, series_id)
    console.warn('[AdminSchedule] Full query failed, attempting stripped payload fallback:', res.error.message);
    const fallbackPayload = {
      series_name: payload.series_name,
      release_day: payload.release_day,
      release_date: payload.release_date,
      release_time: payload.release_time,
      poster_url: payload.poster_url,
      chapter_info: payload.chapter_info,
      category: payload.category,
      rating: payload.rating
    };

    if (id) {
      return await supabase.from('publishing_schedule').update(fallbackPayload).eq('id', id).select().single();
    } else {
      return await supabase.from('publishing_schedule').insert([fallbackPayload]).select().single();
    }
  };

  // Handle Form Submit
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.series_name.trim()) {
      showToast?.('Lütfen bir seri seçin veya seri adı girin', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const releaseDateObj = new Date(`${formData.release_date}T00:00:00`);
      const releaseDay = isNaN(releaseDateObj.getDay()) ? 0 : releaseDateObj.getDay();

      const matchedSeries = formData.series_id 
        ? sortedSeries.find(s => String(s.id) === String(formData.series_id)) 
        : sortedSeries.find(s => s.title?.toLowerCase() === formData.series_name.toLowerCase());

      const payload = {
        series_id: matchedSeries?.id || (formData.series_id ? parseInt(formData.series_id) : null),
        series_name: formData.series_name.trim(),
        release_date: formData.release_date,
        release_day: releaseDay,
        release_time: formData.release_time,
        poster_url: formData.poster_url || matchedSeries?.cover || 'https://via.placeholder.com/200x300?text=Kapak',
        chapter_info: formData.chapter_info.trim() || (formData.is_new_series ? 'Yeni Seri' : 'Yeni Bölüm'),
        category: formData.category || matchedSeries?.genre || 'Genel',
        rating: formData.rating || '9.5',
        status: formData.status || (formData.is_new_series ? 'new_series' : 'scheduled')
      };

      const { data, error } = await insertOrUpdateSchedule(payload, editingId);
      if (error) throw error;

      // Send automated notifications if requested
      if (formData.notify_followers) {
        try {
          const targetSlug = matchedSeries?.slug || '';
          await sendNotification?.({
            title: `📅 ${payload.series_name} Takvime Eklendi!`,
            message: `${payload.chapter_info} ${payload.release_date} saat ${payload.release_time.slice(0, 5)} için planlandı. Kaçırma!`,
            type: 'schedule',
            link: targetSlug ? `/manga/${targetSlug}` : '/takvim',
            series_id: payload.series_id
          });
        } catch (notifErr) {
          console.warn('[AdminSchedule] Notification dispatch error:', notifErr);
        }
      }

      // Create announcement if requested
      if (formData.create_announcement) {
        try {
          const targetSlug = matchedSeries?.slug || '';
          await addAnnouncement?.({
            title: `🗓️ Yayın Takvimi: ${payload.series_name}`,
            content: `${payload.series_name} ${payload.chapter_info} yayını ${payload.release_date} saat ${payload.release_time.slice(0, 5)} olarak takvime eklenmiştir.`,
            type: 'release',
            link: targetSlug ? `/manga/${targetSlug}` : '/takvim',
            audience: 'all',
            pinned: false,
            priority: 2
          });
        } catch (annErr) {
          console.warn('[AdminSchedule] Announcement dispatch error:', annErr);
        }
      }

      showToast?.(editingId ? 'Program güncellendi!' : 'Yeni yayın takvime eklendi!', 'success');
      setFormData(initialForm);
      setSeriesSearchTerm('');
      setEditingId(null);
      setActiveTab('list');
      fetchSchedules();
    } catch (err) {
      console.error('[AdminSchedule] Save error:', err);
      showToast?.('Kaydedilemedi: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Action: Publish & Notify
  const handlePublishNow = async (item) => {
    try {
      // 1. Update status to 'published'
      await insertOrUpdateSchedule({ ...item, status: 'published' }, item.id);

      // 2. Resolve series slug
      const matched = sortedSeries.find(s => 
        (item.series_id && String(s.id) === String(item.series_id)) ||
        s.title?.toLowerCase() === item.series_name?.toLowerCase()
      );
      const link = matched?.slug ? `/manga/${matched.slug}` : '/takvim';

      // 3. Dispatch high-priority notification to followers
      await sendNotification?.({
        title: `🎉 ${item.series_name} Yayında!`,
        message: `${item.chapter_info || 'Yeni bölüm'} şu an sitemizde yayınlandı! Hemen tıkla ve oku.`,
        type: 'chapter',
        link,
        series_id: item.series_id || matched?.id,
        chapter_num: item.chapter_info
      });

      showToast?.(`"${item.series_name}" yayında olarak işaretlendi ve bildirim gönderildi!`, 'success');
      fetchSchedules();
    } catch (err) {
      console.error('[AdminSchedule] Publish error:', err);
      showToast?.('Yayınlama hatası: ' + err.message, 'error');
    }
  };

  // Quick Action: Mark Delayed & Notify
  const handleConfirmDelay = async () => {
    if (!delayModalItem) return;
    try {
      const payload = {
        ...delayModalItem,
        status: 'delayed',
        delay_reason: delayReason
      };
      await insertOrUpdateSchedule(payload, delayModalItem.id);

      // Send delay notification
      await sendNotification?.({
        title: `⏳ ${delayModalItem.series_name} Yayınında Gecikme`,
        message: delayReason || 'Yeni bölüm hazırlıkları devam ediyor. En kısa sürede sizlerle!',
        type: 'schedule',
        link: '/takvim',
        series_id: delayModalItem.series_id
      });

      showToast?.('Gecikme durumu kaydedildi ve takipçilere bildirildi!', 'success');
      setDelayModalItem(null);
      fetchSchedules();
    } catch (err) {
      showToast?.('Gecikme kaydedilemedi: ' + err.message, 'error');
    }
  };

  // Quick Action: Duplicate to Next Week (+7 Days)
  const handleDuplicateToNextWeek = async (item) => {
    try {
      const curDate = new Date(`${item.release_date}T00:00:00`);
      curDate.setDate(curDate.getDate() + 7);
      const nextDateStr = getLocalDateString(curDate);
      const nextDay = curDate.getDay();

      // Auto increment chapter info if possible (e.g. "Bölüm 42" -> "Bölüm 43")
      let nextChap = item.chapter_info;
      const matchNum = item.chapter_info?.match(/\d+/);
      if (matchNum) {
        const nextNum = parseInt(matchNum[0]) + 1;
        nextChap = item.chapter_info.replace(matchNum[0], String(nextNum));
      }

      const newPayload = {
        series_id: item.series_id,
        series_name: item.series_name,
        release_date: nextDateStr,
        release_day: nextDay,
        release_time: item.release_time,
        poster_url: item.poster_url,
        chapter_info: nextChap,
        category: item.category,
        rating: item.rating,
        status: 'scheduled'
      };

      const { error } = await insertOrUpdateSchedule(newPayload);
      if (error) throw error;

      showToast?.(`"${item.series_name}" gelecek haftaya (+7 gün, ${nextChap}) kopyalandı!`, 'success');
      fetchSchedules();
    } catch (err) {
      showToast?.('Kopyalama hatası: ' + err.message, 'error');
    }
  };

  // Delete Action
  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" yayın programından silinecek. Emin misin?`)) return;
    try {
      const { error } = await supabase.from('publishing_schedule').delete().eq('id', id);
      if (error) throw error;
      showToast?.('Program silindi', 'success');
      fetchSchedules();
    } catch (err) {
      showToast?.('Silme hatası: ' + err.message, 'error');
    }
  };

  // Edit action
  const handleStartEdit = (item) => {
    setFormData({
      release_date: item.release_date || getLocalDateString(),
      release_time: item.release_time?.slice(0, 5) || '18:00',
      series_id: item.series_id || '',
      series_name: item.series_name || '',
      poster_url: item.poster_url || '',
      chapter_info: item.chapter_info || '',
      category: item.category || 'Aksiyon',
      rating: item.rating || '9.5',
      status: item.status || 'scheduled',
      is_new_series: item.chapter_info === 'Yeni Seri' || item.status === 'new_series',
      notify_followers: false,
      create_announcement: false
    });
    setSeriesSearchTerm(item.series_name || '');
    setEditingId(item.id);
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered schedules for view
  const todayStr = getLocalDateString();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrowObj);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLocaleLowerCase('tr-TR');
        if (!item.series_name?.toLocaleLowerCase('tr-TR').includes(q)) return false;
      }
      // Date Filter
      if (dateFilter === 'today') {
        return item.release_date === todayStr;
      }
      if (dateFilter === 'tomorrow') {
        return item.release_date === tomorrowStr;
      }
      if (dateFilter === 'this_week') {
        const diff = (new Date(item.release_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      }
      return true;
    });
  }, [schedules, searchQuery, dateFilter, todayStr, tomorrowStr]);

  // Group by date
  const groupedDates = useMemo(() => {
    const map = {};
    filteredSchedules.forEach(item => {
      const d = item.release_date || 'Tarihsiz';
      if (!map[d]) map[d] = [];
      map[d].push(item);
    });
    return Object.keys(map).sort().map(d => ({ date: d, items: map[d] }));
  }, [filteredSchedules]);

  // Statistics
  const todayCount = schedules.filter(s => s.release_date === todayStr).length;
  const publishedCount = schedules.filter(s => s.status === 'published').length;
  const delayedCount = schedules.filter(s => s.status === 'delayed').length;

  const inputCls = "w-full bg-[#0a0718] border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* ── HEADER & STATS ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#0e0a1f] to-indigo-950/40 border border-purple-500/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider mb-3">
              <Calendar size={14} className="text-purple-400" />
              Yayın Takvimi ve Bildirim Yönetimi
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Yayın Takvimi Kontrol Merkezi
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Haftalık bölüm yayınlarını planla, gecikmeleri takipçilere duyur, tek tıkla yeni bölüm yayına girdi bildirimi gönder.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData(initialForm);
                setSeriesSearchTerm('');
                setActiveTab(activeTab === 'add' ? 'list' : 'add');
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
            >
              <Plus size={16} />
              {activeTab === 'add' && !editingId ? 'Listeye Dön' : 'Yeni Yayın Planla'}
            </button>

            <button
              type="button"
              onClick={fetchSchedules}
              disabled={loading}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="Yenile"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-purple-400' : ''} />
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Program</span>
            <div className="text-2xl font-black text-white mt-1">{schedules.length}</div>
          </div>
          <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Bugün Yayınlanacak</span>
            <div className="text-2xl font-black text-purple-300 mt-1 flex items-center gap-2">
              {todayCount}
              {todayCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />}
            </div>
          </div>
          <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Yayında / Tamamlandı</span>
            <div className="text-2xl font-black text-emerald-300 mt-1">{publishedCount}</div>
          </div>
          <div className="bg-black/40 border border-amber-500/20 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Gecikenler</span>
            <div className="text-2xl font-black text-amber-300 mt-1">{delayedCount}</div>
          </div>
        </div>
      </div>

      {/* ── TAB 1: ADD / EDIT FORM ── */}
      {activeTab === 'add' && (
        <div className="rounded-3xl bg-[#0c081a] border border-purple-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingId ? 'Yayın Programını Güncelle' : 'Yeni Yayın Ekle ve Bildirim Planla'}
                </h3>
                <p className="text-xs text-slate-400">Günü, saati ve bölüm bilgisini belirleyin.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setEditingId(null);
                setFormData(initialForm);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5"
            >
              İptal Et
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Top Switch: Katalogdaki Seri vs Yeni Bağımsız Seri */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
              <input
                type="checkbox"
                id="is_new_series_toggle"
                checked={formData.is_new_series}
                onChange={e => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    is_new_series: checked,
                    chapter_info: checked ? 'Yeni Seri Duyurusu' : prev.chapter_info
                  }));
                }}
                className="w-5 h-5 rounded-lg border-white/20 bg-transparent text-purple-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="is_new_series_toggle" className="text-xs font-black text-slate-200 cursor-pointer select-none">
                ✨ Bu henüz sitede olmayan <span className="text-purple-400 uppercase">"Yeni Seri"</span> prömiyeri (Özel Afiş ve Başlık girebilirsiniz)
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Seri Seçimi / Arama */}
              {!formData.is_new_series ? (
                <div className="relative">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Katalogdan Seri Seç *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Seri adı ile ara..."
                      value={seriesSearchTerm}
                      onFocus={() => setShowSeriesDropdown(true)}
                      onChange={e => {
                        setSeriesSearchTerm(e.target.value);
                        setShowSeriesDropdown(true);
                      }}
                      className={inputCls}
                    />
                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>

                  {/* Dropdown list */}
                  {showSeriesDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl bg-[#0e0a1f] border border-purple-500/40 p-2 shadow-2xl space-y-1">
                      {filteredSeriesList.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectSeries(s)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-purple-600/20 text-left transition-all"
                        >
                          <img src={s.cover || '/placeholder.png'} className="w-8 h-11 object-cover rounded-lg border border-white/10" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate">{s.title}</p>
                            <span className="text-[10px] text-purple-300 font-bold">{s.genre || 'Genel'} • {s.chapters?.length || 0} Bölüm</span>
                          </div>
                        </button>
                      ))}
                      {filteredSeriesList.length === 0 && (
                        <div className="p-3 text-center text-xs text-slate-500">Seri bulunamadı.</div>
                      )}
                    </div>
                  )}

                  {formData.series_name && (
                    <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <img src={formData.poster_url} className="w-7 h-10 object-cover rounded" alt="" />
                      <div>
                        <span className="text-xs font-black text-white">{formData.series_name}</span>
                        <span className="block text-[10px] text-purple-400 font-bold">{formData.category} • Puan: {formData.rating}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Yeni Seri Adı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Solo Leveling: Ragnarok"
                      value={formData.series_name}
                      onChange={e => setFormData({ ...formData, series_name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Afiş Görseli URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.poster_url}
                      onChange={e => setFormData({ ...formData, poster_url: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* Bölüm & Kategori */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Bölüm / Rozet Bilgisi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Bölüm 45, Sezon Finali, Yeni Seri"
                    value={formData.chapter_info}
                    onChange={e => setFormData({ ...formData, chapter_info: e.target.value })}
                    className={inputCls}
                  />
                  <div className="flex gap-2 mt-2">
                    {['Yeni Bölüm', 'Sezon Finali', 'Özel Bölüm', 'Yeni Seri'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, chapter_info: preset })}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Kategori / Tür
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Puan
                    </label>
                    <input
                      type="text"
                      value={formData.rating}
                      onChange={e => setFormData({ ...formData, rating: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tarih ve Saat */}
            <div className="grid sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-black/30 border border-white/5">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Yayın Tarihi *</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, release_date: todayStr })}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300"
                    >
                      Bugün
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, release_date: tomorrowStr })}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300"
                    >
                      Yarın
                    </button>
                  </div>
                </label>
                <input
                  type="date"
                  required
                  value={formData.release_date}
                  onChange={e => setFormData({ ...formData, release_date: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Yayın Saati (TSİ) *</span>
                  <div className="flex gap-1.5">
                    {['12:00', '16:00', '18:00', '20:00', '22:00'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, release_time: t })}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </label>
                <input
                  type="time"
                  required
                  value={formData.release_time}
                  onChange={e => setFormData({ ...formData, release_time: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Bildirim ve Duyuru Seçenekleri */}
            <div className="space-y-3 p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
              <span className="text-xs font-black text-purple-300 uppercase tracking-wider block">
                🔔 Bildirim & Duyuru Entegrasyonu
              </span>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_followers"
                  checked={formData.notify_followers}
                  onChange={e => setFormData({ ...formData, notify_followers: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-transparent border-white/20 focus:ring-0"
                />
                <label htmlFor="notify_followers" className="text-xs text-slate-300 font-bold cursor-pointer">
                  Seriyi takvimde takip eden üyelere anlık bildirim gönder (Tarih ve Saat hatırlatması)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="create_announcement"
                  checked={formData.create_announcement}
                  onChange={e => setFormData({ ...formData, create_announcement: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-transparent border-white/20 focus:ring-0"
                />
                <label htmlFor="create_announcement" className="text-xs text-slate-300 font-bold cursor-pointer">
                  Ayrıca genel site duyurusu olarak da panoya ekle
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('list');
                  setEditingId(null);
                  setFormData(initialForm);
                }}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-all"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50"
              >
                {submitting ? 'Kaydediliyor...' : editingId ? 'Güncellemeyi Kaydet' : 'Programı Yayınla'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: SCHEDULE LIST & MANAGEMENT ── */}
      <div className="rounded-3xl bg-[#0c081a] border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tüm Program' },
              { id: 'today', label: 'Bugün' },
              { id: 'tomorrow', label: 'Yarın' },
              { id: 'this_week', label: 'Bu Hafta' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setDateFilter(pill.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  dateFilter === pill.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Programda seri ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#070511] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all pr-9"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Days & Schedules */}
        <div className="space-y-6">
          {groupedDates.map(group => {
            const isToday = group.date === todayStr;
            const isTomorrow = group.date === tomorrowStr;

            const dateObj = new Date(`${group.date}T00:00:00`);
            const displayTitle = isNaN(dateObj.getTime())
              ? group.date
              : isToday
              ? `BUGÜN (${dateObj.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })})`
              : isTomorrow
              ? `YARIN (${dateObj.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })})`
              : dateObj.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

            return (
              <div key={group.date} className="rounded-2xl bg-black/40 border border-white/5 p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs sm:text-sm font-black uppercase tracking-widest ${isToday ? 'text-purple-400' : 'text-slate-300'}`}>
                      {displayTitle}
                    </h4>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        CANLI
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-bold">
                    {group.items.length} seri
                  </span>
                </div>

                {/* Items in Day */}
                <div className="grid gap-3">
                  {group.items.map(item => {
                    const isPublished = item.status === 'published';
                    const isDelayed = item.status === 'delayed';

                    return (
                      <div
                        key={item.id}
                        className={`group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                          isPublished
                            ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40'
                            : isDelayed
                            ? 'bg-amber-950/10 border-amber-500/20 hover:border-amber-500/40'
                            : 'bg-white/5 border-white/5 hover:border-purple-500/30 hover:bg-white/8'
                        }`}
                      >
                        {/* Left: Info */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Saat Rozeti */}
                          <div className="shrink-0 flex flex-col items-center justify-center w-14 py-2 rounded-lg bg-black/60 border border-white/10 text-center">
                            <Clock size={12} className="text-purple-400 mb-0.5" />
                            <span className="text-xs font-black text-white">{item.release_time?.slice(0, 5) || '18:00'}</span>
                          </div>

                          {/* Cover */}
                          <img
                            src={item.poster_url || '/placeholder.png'}
                            alt={item.series_name}
                            className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0 shadow-md"
                            onError={e => { e.target.src = 'https://via.placeholder.com/200x300?text=Kapak'; }}
                          />

                          {/* Text info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-black text-white truncate group-hover:text-purple-300 transition-colors">
                                {item.series_name}
                              </h5>

                              {/* Status Badges */}
                              {isPublished && (
                                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Yayında
                                </span>
                              )}
                              {isDelayed && (
                                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                  <AlertTriangle size={10} /> Gecikmeli
                                </span>
                              )}
                              {item.chapter_info === 'Yeni Seri' && (
                                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Yeni Seri
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-slate-400">{item.chapter_info}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-[11px] font-bold text-slate-500">{item.category}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
                                <Star size={10} className="fill-amber-400" /> {item.rating || '9.5'}
                              </span>
                            </div>

                            {/* Gecikme açıklaması varsa */}
                            {isDelayed && item.delay_reason && (
                              <p className="text-[11px] text-amber-300/80 mt-1 italic">
                                "{item.delay_reason}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                          {/* 1. Yayında & Bildir Button */}
                          {!isPublished && (
                            <button
                              type="button"
                              onClick={() => handlePublishNow(item)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                              title="Bölümü yayına girdi olarak işaretle ve takipçilere anlık bildirim fırlat!"
                            >
                              <Send size={12} />
                              Yayında & Bildir
                            </button>
                          )}

                          {/* 2. Gecikme Bildir Button */}
                          {!isPublished && !isDelayed && (
                            <button
                              type="button"
                              onClick={() => {
                                setDelayModalItem(item);
                                setDelayReason('Çeviri ve edit aşamasında, bu akşam yayında olacak!');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-all"
                              title="Gecikme uyarısı ve sebebi girin"
                            >
                              Gecikme
                            </button>
                          )}

                          {/* 3. Haftaya Kopyala (+7 Gün) */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateToNextWeek(item)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                            title="Gelecek haftaya kopyala (+7 gün, Bölüm sayısını otomatik arttır)"
                          >
                            <Copy size={14} />
                          </button>

                          {/* 4. Düzenle */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-400 hover:text-purple-300 transition-all"
                            title="Düzenle"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* 5. Sil */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.series_name)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {groupedDates.length === 0 && !loading && (
            <div className="text-center py-16 text-slate-500 space-y-3">
              <Calendar size={32} className="mx-auto text-slate-600" />
              <p className="text-sm font-bold">Bu filtreye uygun herhangi bir yayın programı bulunamadı.</p>
              <button
                type="button"
                onClick={() => { setDateFilter('all'); setSearchQuery(''); }}
                className="text-xs text-purple-400 font-black uppercase hover:underline"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── DELAY MODAL ── */}
      {delayModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0e0a1f] border border-amber-500/40 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle size={24} />
              <div>
                <h4 className="text-base font-black text-white">Yayın Gecikmesi Bildir</h4>
                <p className="text-xs text-slate-400">{delayModalItem.series_name} için</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Gecikme Sebebi / Takipçilere Mesaj
              </label>
              <textarea
                rows={3}
                value={delayReason}
                onChange={e => setDelayReason(e.target.value)}
                className="w-full bg-[#070511] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                placeholder="Örn: Çevirmenimiz rahatsızlandı, bölüm bu gece 22:00'de yüklenecektir."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDelayModalItem(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelay}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/30"
              >
                Gecikmeyi Bildir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
