import { useState, useMemo } from 'react';
import {
  Bell, Pin, PinOff, Trash2, Send, ExternalLink, Calendar,
  Clock, Sparkles, AlertTriangle, Shield, Check, Eye, Search,
  Filter, Rocket, Wrench, PartyPopper, Gift, Info, BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import {
  NOTIF_TYPES,
  ADMIN_ANNOUNCEMENT_TYPES,
  getTypeMeta,
  AUDIENCES,
  timeAgo,
  timeLeft,
} from '../../lib/notifications.js';

const TEMPLATES = [
  {
    label: 'Planlı Bakım',
    type: 'maintenance',
    title: 'Planlı Sunucu Bakımı',
    text: 'Sistem altyapımızı güçlendirmek için bu gece kısa süreli bakım çalışması yapılacaktır.',
    priority: 'high',
    expiresHours: 24,
  },
  {
    label: 'Yeni Güncelleme',
    type: 'update',
    title: 'Yeni Özellikler Yayında!',
    text: 'Bildirim merkezi, performans iyileştirmeleri ve yeni profil özellikleri eklendi. Keşfetmeye başla!',
    priority: 'normal',
    expiresHours: 72,
  },
  {
    label: 'Aura Etkinliği',
    type: 'event',
    title: 'Hafta Sonu 2X Aura Etkinliği',
    text: 'Bu hafta sonu boyunca okuduğun her bölüm için 2 kat Aura ve XP kazanacaksın!',
    priority: 'normal',
    expiresHours: 48,
  },
  {
    label: 'Kritik Uyarı',
    type: 'important',
    title: 'Önemli Güvenlik Bildirimi',
    text: 'Lütfen hesap güvenliğiniz için şifrenizi güncel tutunuz ve kimseyle paylaşmayınız.',
    priority: 'high',
    expiresHours: 168,
  },
];

export default function AdminAnnouncementsPanel({ showToast }) {
  const { announcements = [], addAnnouncement, updateAnnouncement, deleteAnnouncement, series = [] } = useApp();

  // Form State
  const [form, setForm] = useState({
    title: '',
    text: '',
    type: 'system',
    link: '',
    audience: 'all',
    pinned: false,
    priority: 'normal',
    expiresHours: '0', // '0' = süresiz
    seriesId: '',
  });

  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pinningId, setPinningId] = useState(null);

  // Filtreleme State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const applyTemplate = (tpl) => {
    setForm((prev) => ({
      ...prev,
      title: tpl.title,
      text: tpl.text,
      type: tpl.type,
      priority: tpl.priority,
      expiresHours: String(tpl.expiresHours || 0),
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.text.trim() || sending) return;

    setSending(true);
    try {
      const expiresAt =
        Number(form.expiresHours) > 0
          ? new Date(Date.now() + Number(form.expiresHours) * 3_600_000).toISOString()
          : null;

      await addAnnouncement({
        title: form.title.trim() || null,
        text: form.text.trim(),
        type: form.type,
        link: form.link.trim() || null,
        audience: form.audience,
        pinned: form.pinned,
        priority: form.priority,
        expiresAt,
        seriesId: form.seriesId ? Number(form.seriesId) : null,
      });

      setForm({
        title: '',
        text: '',
        type: 'system',
        link: '',
        audience: 'all',
        pinned: false,
        priority: 'normal',
        expiresHours: '0',
        seriesId: '',
      });

      showToast('Duyuru başarıyla yayınlandı!', 'success');
    } catch (err) {
      console.error('[Admin] Duyuru hatası:', err);
      showToast(`Duyuru yayınlanamadı: ${err.message || 'Hata oluştu'}`, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePin = async (item) => {
    if (pinningId) return;
    setPinningId(item.id);
    try {
      const nextPinned = !item.pinned;
      await updateAnnouncement(item.id, { pinned: nextPinned });
      showToast(nextPinned ? 'Duyuru başa sabitlendi.' : 'Sabitleme kaldırıldı.', 'success');
    } catch (err) {
      showToast(`Sabitleme güncellenemedi: ${err.message}`, 'error');
    } finally {
      setPinningId(null);
    }
  };

  const handleDelete = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
      showToast('Duyuru silindi.', 'success');
    } catch (err) {
      showToast(`Duyuru silinemedi: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrelenmiş liste
  const filteredList = useMemo(() => {
    return announcements.filter((a) => {
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const t = (a.title || '').toLowerCase();
        const txt = (a.text || '').toLowerCase();
        if (!t.includes(q) && !txt.includes(q)) return false;
      }
      return true;
    });
  }, [announcements, filterType, search]);

  const previewMeta = getTypeMeta(form.type);
  const PreviewIcon = previewMeta.icon;

  return (
    <div className="space-y-8">
      {/* ── Şablonlar Çubuğu ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1.5 mr-2">
          <Sparkles size={14} className="text-purple-400" /> Hızlı Şablonlar:
        </span>
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            onClick={() => applyTemplate(tpl)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 shrink-0 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>{tpl.label}</span>
          </button>
        ))}
      </div>

      {/* ── Form & Önizleme Bölümü ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Alanı (2 Kolon) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 glass border border-white/8 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-xl flex items-center gap-2">
              <Bell size={20} className="text-purple-400" />
              Yeni Duyuru Yayınla
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              Real-time sinyal anında kullanıcılara iletilir
            </span>
          </div>

          {/* Başlık ve Tür */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Başlık (Opsiyonel)
              </label>
              <input
                type="text"
                maxLength={80}
                placeholder="Örn: Yeni Sezon Başlıyor!"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Duyuru Türü
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                {ADMIN_ANNOUNCEMENT_TYPES.map((t) => {
                  const m = getTypeMeta(t);
                  return (
                    <option key={t} value={t}>
                      {m.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Duyuru Metni */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Duyuru Metni *
              </label>
              <span className="text-[11px] text-slate-500">{form.text.length}/320</span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={320}
              placeholder="Kullanıcıların bildirim merkezinde göreceği açıklayıcı metin..."
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Bağlantı & İlgili Seri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hedef Bağlantı (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Örn: /market veya https://..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                İlgili Seri Bağla (Opsiyonel)
              </label>
              <select
                value={form.seriesId}
                onChange={(e) => setForm({ ...form, seriesId: e.target.value })}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">Seri Seçilmedi</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hedef Kitle, Öncelik, Süre Sonu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hedef Kitle
              </label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {Object.entries(AUDIENCES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Öncelik
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="normal">Normal Öncelik</option>
                <option value="high">Yüksek Öncelik (Kritik)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Yayın Süresi
              </label>
              <select
                value={form.expiresHours}
                onChange={(e) => setForm({ ...form, expiresHours: e.target.value })}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="0">Süresiz (Kalıcı)</option>
                <option value="12">12 Saat</option>
                <option value="24">24 Saat (1 Gün)</option>
                <option value="48">48 Saat (2 Gün)</option>
                <option value="72">72 Saat (3 Gün)</option>
                <option value="168">7 Gün (1 Hafta)</option>
                <option value="720">30 Gün (1 Ay)</option>
              </select>
            </div>
          </div>

          {/* Sabitle & Gönder */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Pin size={13} className="text-amber-400" />
                Listede Başa Sabitle (Pinned)
              </span>
            </label>

            <button
              type="submit"
              disabled={sending || !form.text.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-black rounded-xl text-sm shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:shadow-[0_0_35px_rgba(147,51,234,0.6)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <Send size={15} />
              <span>{sending ? 'YAYINLANIYOR…' : 'DUYURUYU YAYINLA'}</span>
            </button>
          </div>
        </form>

        {/* Canlı Önizleme Kartı (1 Kolon) */}
        <div className="glass border border-white/8 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Eye size={16} className="text-emerald-400" />
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                Canlı Önizleme
              </h4>
            </div>

            <div className="relative rounded-2xl border border-white/15 bg-[#0e0b1d] p-4 shadow-xl overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: previewMeta.accent }}
              />

              <div className="flex items-start gap-3 pl-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${previewMeta.gradient}`}
                >
                  <PreviewIcon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider"
                      style={{ color: previewMeta.accent }}
                    >
                      {previewMeta.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">şimdi</span>
                  </div>

                  {form.title && (
                    <h5 className="text-white text-xs font-bold mb-0.5 line-clamp-1">
                      {form.title}
                    </h5>
                  )}

                  <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                    {form.text.trim() || 'Duyuru metni buraya gelecek...'}
                  </p>

                  <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/5 text-[10px] text-slate-400 font-bold">
                    {form.pinned && (
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Pin size={10} /> Sabit
                      </span>
                    )}
                    {form.priority === 'high' && (
                      <span className="text-red-400">🚨 Yüksek Öncelik</span>
                    )}
                    {form.link && (
                      <span className="flex items-center gap-0.5 text-sky-400">
                        <ExternalLink size={10} /> Bağlantılı
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 text-[11px] text-slate-500 leading-relaxed">
            💡 Yayınlanan duyuru, kullanıcıların bildirim menüsünde ve tarayıcı açıkken anlık toast olarak gösterilir.
          </div>
        </div>
      </div>

      {/* ── Mevcut Duyurular Listesi & Yönetimi ── */}
      <div className="glass border border-white/8 rounded-2xl overflow-hidden">
        {/* Tablo Üst Çubuğu: Arama ve Filtre */}
        <div className="p-5 border-b border-white/8 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h3 className="text-white font-black text-lg">Mevcut Duyurular</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-300">
              {announcements.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Arama */}
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Duyurularda ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Tür Filtresi */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">Tüm Türler</option>
              {ADMIN_ANNOUNCEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {getTypeMeta(t).label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-black/40 text-left text-xs uppercase tracking-wider text-slate-400 font-bold">
                <th className="px-5 py-4">Duyuru</th>
                <th className="px-5 py-4">Tür & Kitle</th>
                <th className="px-5 py-4">Tarih / Süre</th>
                <th className="px-5 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredList.map((a) => {
                const meta = getTypeMeta(a.type);
                const Icon = meta.icon;
                const isPinned = Boolean(a.pinned);
                const isExpired = a.expires_at && new Date(a.expires_at).getTime() < Date.now();

                return (
                  <tr
                    key={a.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isPinned ? 'bg-amber-500/[0.03]' : ''
                    }`}
                  >
                    {/* Duyuru Metni & Başlığı */}
                    <td className="px-5 py-4 max-w-md">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${meta.gradient}`}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          {a.title && (
                            <p className="text-white text-xs font-bold truncate mb-0.5">
                              {a.title}
                            </p>
                          )}
                          <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                            {a.text}
                          </p>
                          {a.link && (
                            <a
                              href={a.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 mt-1 inline-flex"
                            >
                              <ExternalLink size={10} /> {a.link}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tür & Kitle Rozetleri */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: `${meta.accent}20`,
                            color: meta.accent,
                          }}
                        >
                          {meta.label}
                        </span>
                        {a.audience && a.audience !== 'all' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {AUDIENCES[a.audience]?.label || a.audience}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tarih & Süre */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">
                      <div>{new Date(a.created_at || a.ts).toLocaleDateString('tr-TR')}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {a.expires_at ? (
                          <span className={isExpired ? 'text-red-400 font-bold' : 'text-slate-400'}>
                            {timeLeft(new Date(a.expires_at).getTime())}
                          </span>
                        ) : (
                          'Süresiz'
                        )}
                      </div>
                    </td>

                    {/* Aksiyonlar */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Sabitle / Çöz */}
                        <button
                          type="button"
                          disabled={pinningId === a.id}
                          onClick={() => handleTogglePin(a)}
                          className={`p-2 rounded-lg transition-all ${
                            isPinned
                              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                          title={isPinned ? 'Sabitlemeyi kaldır' : 'Başa sabitle'}
                        >
                          {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                        </button>

                        {/* Sil */}
                        <button
                          type="button"
                          disabled={deletingId === a.id}
                          onClick={() => handleDelete(a.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-500 text-xs">
                    {search ? 'Arama kriterlerine uygun duyuru bulunamadı.' : 'Henüz yayınlanmış duyuru yok.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
