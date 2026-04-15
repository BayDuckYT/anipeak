import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp }  from '../context/AppContext.jsx';
import {
  LayoutDashboard, BookOpen, PlusCircle, Users, Settings,
  Eye, Star, Trash2, Edit3, Shield, ChevronRight, Globe,
  Crown, Check, X, Search, Image as ImageIcon, Activity,
  UserCheck, Save, ShieldAlert, SkipBack, Flame, Layers, Bell
} from 'lucide-react';
import ChapterEditor from '../components/ChapterEditor.jsx';

// ── RBAC Map ──────────────────────────────────────────────────────────────────
export const ADMIN_ROLES = {
  'Baş Admin': {
    color: 'text-red-400 bg-red-500/10 border-red-500/30',
    badge: 'bg-gradient-to-br from-red-600 to-rose-900',
    access: ['dashboard','content','chapterEditor','add','announcements','users','settings','trash'],
  },
  'Yönetici': {
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    badge: 'bg-gradient-to-br from-purple-600 to-indigo-800',
    access: ['dashboard','content','chapterEditor','add','announcements','users','trash'],
  },
  'Admin Yardımcısı': {
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    badge: 'bg-gradient-to-br from-blue-600 to-cyan-800',
    access: ['dashboard','content','chapterEditor','add','trash'],
  },
  'Editör': {
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'bg-gradient-to-br from-emerald-600 to-teal-800',
    access: ['dashboard','content','chapterEditor'],
  },
};

const ALL_NAV = [
  { id: 'dashboard',     label: 'Dashboard',           icon: LayoutDashboard },
  { id: 'content',       label: 'Seri Envanteri',       icon: BookOpen        },
  { id: 'chapterEditor', label: 'Bölüm Editörü',        icon: Layers          },
  { id: 'add',           label: 'Hızlı Ekle',           icon: PlusCircle      },
  { id: 'announcements', label: 'Duyuru Yönetimi',      icon: Bell            },
  { id: 'users',         label: 'Kullanıcı Yönetimi',   icon: UserCheck       },
  { id: 'settings',      label: 'Kainat Ayarları',      icon: Settings        },
  { id: 'trash',         label: 'Geri Dönüşüm',         icon: Trash2          },
];

const IMGBB_KEY = '23884105154ff50ed54b8de837952b35';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: MetricCard
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, color, glow, change }) {
  return (
    <div
      className="relative glass border border-white/8 rounded-2xl p-5 overflow-hidden group hover:border-white/15 transition-all"
      style={{ boxShadow: `0 4px 30px ${glow}` }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
          <Icon size={18} className="text-white" />
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
          {change}
        </span>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Quick Add Form
// ─────────────────────────────────────────────────────────────────────────────
function QuickAddForm({ seriesList, showToast }) {
  const { addChapter, addSeries, addAnnouncement } = useApp();
  const [submitted, setSubmitted] = useState(null); // 'series' or 'chapter'
  
  // Chapter State
  const [selectedId,   setSelectedId]   = useState('');
  const [chapterNum,   setChapterNum]   = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pageUrls,     setPageUrls]     = useState('');
  const [isPremium,    setIsPremium]    = useState(false);
  
  // Series State
  const [newSeries,    setNewSeries]    = useState({
    title: '', cover: '', description: '', genre: 'Aksiyon', status: 'Devam Ediyor',
  });

  const compressToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1200;
        let { width: w, height: h } = img;
        if (w > maxW) { h = (maxW / w) * h; w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });

  const uploadToImgBB = async (base64) => {
    const form = new FormData();
    form.append('image', base64.split(',')[1]);
    const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: form });
    const json = await res.json();
    if (json.success) return json.data.url;
    throw new Error(json.error?.message || 'İmgBB yükleme hatası');
  };

  const handleFileSelect = async (e, target) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      showToast(`${files.length} görsel yükleniyor...`, 'info');
      const urls = await Promise.all(files.map(async f => uploadToImgBB(await compressToBase64(f))));
      if (target === 'pages') {
        setPageUrls(prev => [...(prev.trim() ? prev.split('\n') : []), ...urls].join('\n'));
      } else {
        setNewSeries(p => ({ ...p, cover: urls[0] }));
      }
      showToast(`✅ ${files.length} görsel başarıyla yüklendi!`, 'success');
    } catch (err) {
      showToast('Görsel yüklenemedi.', 'error');
    }
  };

  const handleAddSeries = async (e) => {
    e.preventDefault();
    if (!newSeries.title || !newSeries.cover) { showToast('Başlık ve kapak gerekli!', 'error'); return; }
    
    try {
      await addSeries(newSeries);
      showToast('Seri başarıyla oluşturuldu!', 'success');
      setNewSeries({ title: '', cover: '', description: '', genre: 'Aksiyon', status: 'Devam Ediyor' });
      setSubmitted('series');
      setTimeout(() => setSubmitted(null), 3000);
    } catch (err) {
      showToast('Seri eklenirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'), 'error');
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!selectedId) { showToast('Seri seçin!', 'error'); return; }
    if (!chapterNum)  { showToast('Bölüm no gerekli!', 'error'); return; }
    const pages = pageUrls.split('\n').map(u => u.trim()).filter(Boolean);
    await addChapter(Number(selectedId), { number: Number(chapterNum), title: chapterTitle, pages, isPremium });
    showToast(`🚀 Bölüm ${chapterNum} yayınlandı!`, 'success');
    setChapterNum(''); setChapterTitle(''); setPageUrls(''); setIsPremium(false);
    setSubmitted('chapter');
    setTimeout(() => setSubmitted(null), 3000);
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all';

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Series Sector */}
      <div className="glass border border-white/8 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl pointer-events-none" />
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
          <BookOpen className="text-green-400" size={20} /> Seri Oluştur
        </h3>
        <form onSubmit={handleAddSeries} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 ml-1">Başlık *</label>
              <input type="text" value={newSeries.title} onChange={e => setNewSeries(p => ({...p, title: e.target.value}))} className={inputCls} placeholder="Solo Leveling vb." />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Kapak URL *</label>
                <label className="cursor-pointer text-[9px] font-black text-green-400 hover:text-green-300">
                   Yükle <input type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'cover')} />
                </label>
              </div>
              <input type="url" value={newSeries.cover} onChange={e => setNewSeries(p => ({...p, cover: e.target.value}))} className={inputCls} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 ml-1">Açıklama</label>
            <textarea rows={2} value={newSeries.description} onChange={e => setNewSeries(p => ({...p, description: e.target.value}))} className={`${inputCls} resize-none`} placeholder="Seri özeti..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={newSeries.genre} onChange={e => setNewSeries(p => ({...p, genre: e.target.value}))} className={`${inputCls} cursor-pointer`}>
              {['Aksiyon','Macera','Fantezi','Dram','Romantik'].map(g => <option key={g} value={g} className="bg-[#0a0a14]">{g}</option>)}
            </select>
            <select value={newSeries.status} onChange={e => setNewSeries(p => ({...p, status: e.target.value}))} className={`${inputCls} cursor-pointer`}>
               <option value="Devam Ediyor" className="bg-[#0a0a14]">Devam Ediyor</option>
               <option value="Tamamlandı" className="bg-[#0a0a14]">Tamamlandı</option>
            </select>
          </div>
          <button type="submit" className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${submitted === 'series' ? 'bg-emerald-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'}`}>
            {submitted === 'series' ? <Check size={18} /> : <PlusCircle size={18} />} SERİYİ OLUŞTUR
          </button>
        </form>
      </div>

      {/* Chapter Sector */}
      <div className="glass border border-white/8 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl pointer-events-none" />
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
          <Layers className="text-purple-400" size={20} /> Bölüm Yayınla
        </h3>
        <form onSubmit={handleAddChapter} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 ml-1">Seri Seç *</label>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="" className="bg-[#0a0a14]">---</option>
                {seriesList.map(s => <option key={s.id} value={s.id} className="bg-[#0a0a14]">{s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 ml-1">Bölüm NO *</label>
              <input type="text" value={chapterNum} onChange={e => setChapterNum(e.target.value)} className={inputCls} placeholder="1. Bölüm" />
            </div>
          </div>
          <div className="flex items-center justify-between mb-1 ml-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Sayfa URL'leri / Dosyalar</label>
            <label className="cursor-pointer text-[9px] font-black text-purple-400 hover:text-purple-300">
               Dosya Seç <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'pages')} />
            </label>
          </div>
          <textarea rows={4} value={pageUrls} onChange={e => setPageUrls(e.target.value)} className={`${inputCls} resize-none font-mono text-[10px]`} placeholder="https://...\nhttps://..." />
          <button type="submit" className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${submitted === 'chapter' ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-neon-purple'}`}>
             {submitted === 'chapter' ? <Check size={18} /> : <Save size={18} />} BÖLÜMÜ YAYINLA
             </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Announcements Panel  (useState at TOP LEVEL — no IIFE!)
// ─────────────────────────────────────────────────────────────────────────────
function AnnouncementsPanel({ showToast }) {
  const { announcements, addAnnouncement, deleteAnnouncement } = useApp();
  const [newAnn,  setNewAnn]  = useState('');
  const [annType, setAnnType] = useState('system');

  return (
    <div className="space-y-6">
      <div className="glass border border-white/8 rounded-2xl p-6">
        <h3 className="text-white font-black text-xl mb-4">Yeni Duyuru Yayınla</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={annType} onChange={e => setAnnType(e.target.value)}
            className="bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500">
            <option value="system">Sistem Duyurusu</option>
            <option value="important">Kritik Uyarı</option>
            <option value="event">Etkinlik</option>
          </select>
          <input type="text" placeholder="Duyuru metni..." value={newAnn} onChange={e => setNewAnn(e.target.value)}
            className="flex-1 bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
          <button onClick={async () => {
            if (!newAnn.trim()) return;
            await addAnnouncement(newAnn, annType);
            setNewAnn('');
            showToast('Duyuru gönderildi!', 'success');
          }} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-xl text-sm shadow-neon-purple hover:scale-[1.02] transition-transform">
            YAYINLA
          </button>
        </div>
      </div>

      <div className="glass border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/8 bg-black/20">
          <h3 className="text-white font-black text-lg">Mevcut Duyurular</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/5 bg-black/40">
            {['Duyuru','Tip','Tarih','İşlem'].map(h => (
              <th key={h} className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {announcements.map(a => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-5 py-4 text-slate-200 max-w-xs truncate">{a.text}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    a.type === 'chapter' ? 'bg-emerald-500/10 text-emerald-400' :
                    a.type === 'series'  ? 'bg-blue-500/10 text-blue-400' :
                    'bg-purple-500/10 text-purple-400'}`}>{a.type}</span>
                </td>
                <td className="px-5 py-4 text-slate-500 text-xs">
                  {new Date(a.created_at || a.ts).toLocaleString('tr-TR')}
                </td>
                <td className="px-5 py-4">
                  <button onClick={async () => { await deleteAnnouncement(a.id); showToast('Duyuru silindi.', 'error'); }}
                    className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Henüz duyuru yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Users Panel  (useState at TOP LEVEL — no IIFE!)
// ─────────────────────────────────────────────────────────────────────────────
function UsersPanel({ showToast }) {
  const { registeredUsers, updateProfile, deleteProfile } = useApp();
  const [search,        setSearch]        = useState('');
  const [editingUser,   setEditingUser]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = registeredUsers.filter(u =>
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email    || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="glass border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-black/20">
          <div>
            <h3 className="text-white font-black text-lg">Kullanıcı Yönetimi</h3>
            <p className="text-slate-500 text-xs mt-0.5">{registeredUsers.length} kayıtlı kullanıcı</p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="İsim veya e-posta ara..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#0a0a14] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all w-full sm:w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5 bg-black/40">
              {['Kullanıcı','E-posta','Sağlayıcı','Rol','Katılım','İşlem'].map(h => (
                <th key={h} className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-4 py-3.5">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              <AnimatePresence>
                {filtered.map(u => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 ${ADMIN_ROLES[u.role] ? ADMIN_ROLES[u.role].badge : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
                          {(u.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-bold text-sm">{u.username || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {u.provider || 'E-posta'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ADMIN_ROLES[u.role] ? (
                        <span className={`inline-flex px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${ADMIN_ROLES[u.role].color}`}>{u.role}</span>
                      ) : (
                        <span className="text-slate-400 border border-slate-600/50 bg-slate-800/30 px-2 py-1 rounded-lg text-[9px] font-black uppercase">Kullanıcı</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {confirmDelete === u.id ? (
                          <>
                            <button onClick={() => setConfirmDelete(null)} className="p-1.5 text-slate-400 hover:bg-white/10 rounded-lg"><X size={14}/></button>
                            <button onClick={async () => { await deleteProfile(u.id); setConfirmDelete(null); showToast('Kullanıcı silindi', 'error'); }}
                              className="px-2 py-1 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] font-black flex items-center gap-1">
                              SİL <Check size={12}/>
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingUser({ ...u })} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all" title="Düzenle">
                              <Edit3 size={14}/>
                            </button>
                            <button onClick={() => setConfirmDelete(u.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all" title="Sil">
                              <Trash2 size={14}/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Kullanıcı bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-strong border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.25)]">
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-5 px-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck size={20} className="text-purple-400" />
                  <h3 className="text-xl font-black text-white">Kullanıcı Editörü</h3>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">Kullanıcı Adı</label>
                  <input type="text" value={editingUser.username || ''} onChange={e => setEditingUser(p => ({...p, username: e.target.value}))}
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">E-posta</label>
                  <input type="email" value={editingUser.email || ''} onChange={e => setEditingUser(p => ({...p, email: e.target.value}))}
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">Yeni Şifre (Boş bırakılırsa değişmez)</label>
                  <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser(p => ({...p, password: e.target.value}))}
                    placeholder="••••••••"
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all" />
                  <p className="text-[9px] text-amber-500/70 mt-1 font-bold italic">Not: Şifre değişikliği sadece Auth sağlayıcısı email ise çalışır.</p>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">Sistem Rolü</label>
                  <select value={editingUser.role || 'Kullanıcı'} onChange={e => setEditingUser(p => ({...p, role: e.target.value}))}
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer">
                    {['Kullanıcı','Editör','Admin Yardımcısı','Yönetici','Baş Admin'].map(r => (
                      <option key={r} value={r} className="bg-[#0a0a14]">{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-sm">İptal</button>
                <button onClick={async () => {
                  const updates = { role: editingUser.role, username: editingUser.username, email: editingUser.email };
                  await updateProfile(editingUser.id, updates);
                  
                  // Password update is handled separately if provided
                  if (editingUser.password) {
                     showToast('Şifre güncelleme isteği gönderildi (Admin API gereklidir).', 'info');
                  }

                  setEditingUser(null);
                  showToast('Kullanıcı bilgileri güncellendi!', 'success');
                }} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-black text-sm shadow-neon-purple hover:scale-[1.02] transition-transform flex items-center gap-2">
                  <Save size={16}/> Kaydet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN Admin Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { user, isOwner } = useAuth();
  const {
    series, loading: appLoading, chapters, announcements, registeredUsers,
    updateSeries, deleteSeries, toggleTrend, toggleStatus,
    maintenanceMode, toggleMaintenance,
  } = useApp();

  // ── ALL useState at top level — Rule of Hooks compliant ──────────────
  const [activeNav,        setActiveNav]        = useState('dashboard');
  const [sidebarOpen,      setSidebarOpen]      = useState(true);
  const [toast,            setToast]            = useState(null);
  const [searchSeries,     setSearchSeries]     = useState('');
  const [editingSeries,    setEditingSeries]     = useState(null);
  const [editingSeriesTab, setEditingSeriesTab] = useState('details');
  const [confirmDelSeries, setConfirmDelSeries] = useState(null);
  const [settingPrefs,     setSettingPrefs]     = useState({ tempMaintenance: false });

  // Sync maintenance toggle when context updates
  useEffect(() => {
    setSettingPrefs(p => ({ ...p, tempMaintenance: maintenanceMode }));
  }, [maintenanceMode]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Loading Screen ───────────────────────────────────────────────────
  if (appLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050507]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-purple-400 font-black tracking-widest animate-pulse uppercase text-xs">Kozmik Veriler Senkronize Ediliyor...</div>
      </div>
    </div>
  );

  // ── Auth Check ───────────────────────────────────────────────────────
  const userRole   = user?.role || '';
  const roleConfig = ADMIN_ROLES[userRole];

  if (!user || !roleConfig) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050507] p-4">
      <div className="glass border border-red-500/20 rounded-3xl p-10 max-w-md text-center shadow-[0_0_100px_rgba(239,68,68,0.1)]">
        <ShieldAlert size={64} className="text-red-500 mx-auto mb-6 opacity-90 animate-pulse" />
        <h2 className="text-2xl font-black text-white mb-2">Erişim Reddedildi</h2>
        <p className="text-slate-400 text-sm mb-8">Bu alana girme yetkiniz bulunmuyor.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all group">
          <SkipBack size={16} className="group-hover:-translate-x-1 transition-transform" /> Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );

  const allowedNavs = ALL_NAV.filter(n => roleConfig.access.includes(n.id));

  // Safe tab switch if current nav is no longer accessible
  const safeActiveNav = roleConfig.access.includes(activeNav) ? activeNav : 'dashboard';

  // ── Metrics ──────────────────────────────────────────────────────────
  const totalChapters = Object.values(chapters).reduce((a, c) => a + c.length, 0);
  const metrics = [
    { label: 'Toplam Seri',    value: series.length,            icon: BookOpen,  color: 'from-purple-600 to-purple-800', glow: 'rgba(168,85,247,0.3)', change: 'Canlı' },
    { label: 'Toplam Okuma',   value: series.reduce((a,s) => a + (s.reads_num||0), 0), icon: Eye, color: 'from-blue-600 to-blue-800', glow: 'rgba(59,130,246,0.3)', change: 'Tüm Zamanlar' },
    { label: 'Kullanıcılar',   value: registeredUsers.length,   icon: Users,     color: 'from-cyan-600 to-cyan-800',    glow: 'rgba(6,182,212,0.3)',   change: 'Kayıtlı' },
    { label: 'Toplam Bölüm',   value: totalChapters,            icon: BookOpen,  color: 'from-orange-600 to-orange-800',glow: 'rgba(249,115,22,0.3)',  change: 'Yayında' },
    { label: 'Duyurular',      value: announcements.length,     icon: Globe,     color: 'from-pink-600 to-pink-800',    glow: 'rgba(236,72,153,0.3)',  change: 'Sistem' },
  ];

  const filteredSeries  = series.filter(s => !s.is_deleted && (s.title||'').toLowerCase().includes(searchSeries.toLowerCase()));
  const deletedSeries   = series.filter(s =>  s.is_deleted && (s.title||'').toLowerCase().includes(searchSeries.toLowerCase()));

  const handleSaveSeries = async (e) => {
    e.preventDefault();
    await updateSeries(editingSeries.id, editingSeries);
    showToast('Seri detayları güncellendi!', 'success');
    setEditingSeries(null);
  };

  return (
    <div className="flex min-h-screen pt-16 bg-[#050507]">
      {/* ── SIDEBAR ── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-16 bottom-0 z-40 glass border-r border-white/8 flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/8 flex-shrink-0">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-white tracking-widest whitespace-nowrap">KOZMİK ODA</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(p => !p)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
            <ChevronRight size={16} className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {allowedNavs.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                safeActiveNav === item.id ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={17} className="flex-shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/8">
          <div className={`p-3 rounded-2xl border ${roleConfig.color}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${roleConfig.badge} flex items-center justify-center text-white text-sm font-black shadow-lg flex-shrink-0`}>
                {(user.username || 'A').charAt(0).toUpperCase()}
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{user.username}</p>
                    <p className="text-[10px] font-black uppercase mt-0.5 opacity-90 truncate">{userRole}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── MAIN ── */}
      <motion.main animate={{ marginLeft: sidebarOpen ? 260 : 64 }} transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 min-h-screen p-4 sm:p-6 md:p-8">

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {allowedNavs.find(n => n.id === safeActiveNav)?.label}
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Sistem Aktif</span>
          </div>
        </div>

        {/* Dashboard */}
        {safeActiveNav === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {metrics.map((m, i) => <MetricCard key={m.label} {...m} />)}
            </div>
            <div className="glass border border-white/8 rounded-2xl p-5 sm:p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-lg">
                <Activity size={18} className="text-purple-400" /> Son Aktiviteler
              </h3>
              <div className="space-y-3">
                {announcements.slice(0, 6).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 px-2 rounded-lg hover:bg-white/5 gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${a.type==='chapter'?'bg-emerald-400':a.type==='series'?'bg-blue-400':'bg-purple-400'}`} />
                      <span className="text-slate-300 text-sm line-clamp-1">{a.text}</span>
                    </div>
                    <span className="text-slate-500 text-xs bg-black/30 px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0">
                      {new Date(a.created_at || a.ts).toLocaleString('tr-TR', { hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                ))}
                {announcements.length === 0 && <div className="text-slate-500 text-center py-4">Henüz aktivite yok.</div>}
              </div>
            </div>
          </div>
        )}

        {/* Content (Series) */}
        {safeActiveNav === 'content' && (
          <div className="glass border border-white/8 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-black/20">
              <h3 className="text-white font-bold text-lg">Seri Envanteri</h3>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="Başlığa göre ara..." value={searchSeries} onChange={e => setSearchSeries(e.target.value)}
                  className="bg-[#0a0a14] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all w-full sm:w-64" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5 bg-black/40">
                  {['Seri','İstatistik','Durum','Aksiyon'].map(h => (
                    <th key={h} className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  <AnimatePresence>
                    {filteredSeries.map(s => (
                      <motion.tr key={s.id} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        className={`border-b border-white/5 transition-colors ${s.is_trending ? 'bg-orange-500/3 hover:bg-orange-500/5' : 'hover:bg-white/5'}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img src={s.cover} className="w-12 h-16 rounded-lg object-cover shadow-lg border border-white/10" alt="" />
                              <div className="absolute -bottom-2 -right-2 bg-black/80 rounded border border-white/10 px-1 py-0.5 text-[9px] font-bold text-white">
                                {(chapters[String(s.id)]||[]).length}B
                              </div>
                            </div>
                            <div>
                              <p className="text-white font-black">{s.title}</p>
                              <p className="text-slate-400 text-xs mt-0.5">{s.author} · {s.year || 2025}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold"><Star size={12} className="fill-amber-400" /> {s.rating}</span>
                            <span className="flex items-center gap-1.5 text-xs text-blue-400 font-bold"><Eye size={12} /> {s.reads_num?.toLocaleString() || 0}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <button onClick={() => toggleStatus(s.id)}
                              className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-black border transition-all hover:scale-[1.03] w-fit ${s.status==='Devam Ediyor'?'text-emerald-400 border-emerald-500/30 bg-emerald-500/10':'text-blue-400 border-blue-500/30 bg-blue-500/10'}`}>
                              {s.status}
                            </button>
                            {s.is_trending && (
                              <span className="flex items-center gap-1 text-[9px] text-orange-400 font-black uppercase bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full w-fit">
                                <Flame size={9} className="fill-orange-400" /> Trend
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {confirmDelSeries === s.id ? (
                              <>
                                <button onClick={() => setConfirmDelSeries(null)} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg"><X size={16}/></button>
                                <button onClick={async () => { await updateSeries(s.id, { is_deleted: true }); setConfirmDelSeries(null); showToast('Çöp kutusuna taşındı', 'error'); }}
                                  className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg bg-red-500/10 border border-red-500/30 font-bold text-xs flex items-center gap-1">
                                  ONAYLA <Check size={14}/>
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => toggleTrend(s.id)}
                                  className={`p-2 rounded-lg transition-all border ${s.is_trending?'text-orange-400 bg-orange-500/20 border-orange-500/30':'text-slate-500 border-transparent hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/10'}`}>
                                  <Flame size={15} className={s.is_trending ? 'fill-orange-400' : ''} />
                                </button>
                                <button onClick={() => { setEditingSeries(s); setEditingSeriesTab('details'); }} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all">
                                  <Edit3 size={16}/>
                                </button>
                                <button onClick={() => setConfirmDelSeries(s.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                                  <Trash2 size={16}/>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trash */}
        {safeActiveNav === 'trash' && (
          <div className="glass border border-white/8 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/8 bg-red-900/10 flex items-center gap-4 justify-between">
              <h3 className="text-red-400 font-bold text-lg flex items-center gap-2"><Trash2 size={20}/> Çöp Kutusu</h3>
            </div>
            {deletedSeries.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {deletedSeries.map(s => (
                    <tr key={s.id} className="border-b border-white/5 bg-red-900/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <img src={s.cover} className="w-12 h-16 rounded-lg object-cover grayscale opacity-80 border border-red-500/20" alt="" />
                          <p className="text-white font-black line-through opacity-70">{s.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={async () => { await updateSeries(s.id, { is_deleted: false }); showToast('Seri geri yüklendi!', 'success'); }}
                            className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-bold">
                            GERİ YÜKLE
                          </button>
                          <button onClick={async () => { await deleteSeries(s.id); showToast('Kalıcı olarak silindi!', 'error'); }}
                            className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700">
                            KALICI SİL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center text-slate-500">Çöp kutusu boş.</div>
            )}
          </div>
        )}

        {/* Other tabs like announcements and users are simple enough */}
        {safeActiveNav === 'announcements' && <AnnouncementsPanel showToast={showToast} />}
        {safeActiveNav === 'users' && <UsersPanel showToast={showToast} />}
        {safeActiveNav === 'add' && <QuickAddForm seriesList={series} showToast={showToast} />}

        {/* Universe Settings */}
        {safeActiveNav === 'settings' && (
          <div className="space-y-6 max-w-4xl">
             <div className="glass border border-white/8 rounded-2xl p-6">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                   <Globe className="text-blue-400" size={20} /> Kainat Ayarları
                </h3>
                <div className="space-y-8">
                   {/* Maintenance Mode */}
                   <div className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-2xl">
                      <div>
                         <p className="text-white font-bold text-sm">Bakım Modu</p>
                         <p className="text-slate-500 text-xs mt-1">Aktif edildiğinde sadece Baş Admin siteye erişebilir.</p>
                      </div>
                      <button 
                        onClick={() => toggleMaintenance(!maintenanceMode)}
                        className={`relative w-14 h-7 rounded-full transition-colors flex items-center px-1 ${maintenanceMode ? 'bg-red-600' : 'bg-white/10'}`}
                      >
                         <div className={`w-5 h-5 bg-white rounded-full transition-transform ${maintenanceMode ? 'translate-x-7' : 'translate-x-0'}`} />
                      </button>
                   </div>

                   {/* System Logs / Stats */}
                   <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/3 border border-white/8 rounded-2xl">
                         <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Activity size={14} /> <span className="text-[11px] font-black uppercase tracking-widest">Sistem Durumu</span>
                         </div>
                         <p className="text-2xl font-black text-white">YÜKSEK</p>
                         <p className="text-[10px] text-slate-500 mt-1">Tüm kozmik kanallar açık.</p>
                      </div>
                      <div className="p-4 bg-white/3 border border-white/8 rounded-2xl">
                         <div className="flex items-center gap-2 text-purple-400 mb-2">
                             <Check size={14} /> <span className="text-[11px] font-black uppercase tracking-widest">Otomatik Yedek</span>
                         </div>
                         <p className="text-2xl font-black text-white">AKTİF</p>
                         <p className="text-[10px] text-slate-500 mt-1">Her 24 saatte bir senkronizasyon.</p>
                      </div>
                   </div>

                   {/* Dangerous Actions */}
                   <div className="pt-6 border-t border-white/8">
                      <p className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-4">Kritik İşlemler</p>
                      <button onClick={() => { if(window.confirm('Tüm önbelleği temizlemek istiyor musunuz?')) showToast('Kozmik önbellek temizlendi.', 'success'); }} 
                        className="px-6 py-2.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all">
                        Önbelleği Boşalt
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

      </motion.main>
      
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:50 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 glass-strong border ${
              toast.type === 'error' ? 'border-red-500/50 text-red-200' :
              toast.type === 'info'  ? 'border-blue-500/50 text-blue-200' :
              'border-emerald-500/50 text-emerald-200'
            }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'info'  ? 'bg-blue-500' :
              'bg-emerald-500'
            }`} />
            <span className="text-sm font-bold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Editor Modal */}
      <AnimatePresence>
        {safeActiveNav === 'chapterEditor' && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl pt-16">
            <div className="absolute top-4 right-8 z-[110] flex gap-4">
               <button onClick={() => setActiveNav('dashboard')} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all flex items-center gap-2 font-bold">
                 <X size={20} /> Editörü Kapat
               </button>
            </div>
            <div className="h-full w-full overflow-y-auto custom-scrollbar">
              <ChapterEditor />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Editing Series Modal */}
      <AnimatePresence>
        {editingSeries && (
          <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-4xl glass-strong border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white">Seri Düzenle: {editingSeries.title}</h3>
                  <button onClick={() => setEditingSeries(null)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl"><X size={24}/></button>
               </div>
               
               <form onSubmit={handleSaveSeries} className="p-6 space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div>
                         <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Başlık</label>
                         <input type="text" value={editingSeries.title} onChange={e => setEditingSeries({...editingSeries, title: e.target.value})}
                           className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Yazar</label>
                         <input type="text" value={editingSeries.author || ''} onChange={e => setEditingSeries({...editingSeries, author: e.target.value})}
                           className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Açıklama</label>
                         <textarea rows={4} value={editingSeries.description || ''} onChange={e => setEditingSeries({...editingSeries, description: e.target.value})}
                           className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none resize-none" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div>
                         <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Kapak Görseli</label>
                         <div className="flex gap-4 items-start">
                            <img src={editingSeries.cover} className="w-24 h-32 rounded-xl object-cover border border-white/10 shadow-lg" alt="" />
                            <input type="url" value={editingSeries.cover} onChange={e => setEditingSeries({...editingSeries, cover: e.target.value})}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none text-xs" />
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Puan</label>
                            <input type="number" step="0.1" value={editingSeries.rating} onChange={e => setEditingSeries({...editingSeries, rating: Number(e.target.value)})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Durum</label>
                            <select value={editingSeries.status} onChange={e => setEditingSeries({...editingSeries, status: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none cursor-pointer">
                              <option value="Devam Ediyor">Devam Ediyor</option>
                              <option value="Tamamlandı">Tamamlandı</option>
                            </select>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingSeries(null)} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white font-bold">Vazgeç</button>
                    <button type="submit" className="px-10 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-black shadow-neon-purple hover:scale-[1.02] transition-transform flex items-center gap-2">
                       <Save size={18} /> Değişiklikleri Kaydet
                    </button>
                 </div>
               </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
