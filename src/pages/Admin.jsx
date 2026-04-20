import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabaseClient';
import {
  LayoutDashboard, BookOpen, PlusCircle, Users, Settings,
  Eye, Star, Trash2, Edit3, Shield, ChevronRight, Globe,
  Crown, Check, X, Search, Image as ImageIcon, Activity,
  UserCheck, Save, ShieldAlert, SkipBack, Flame, Layers, Bell,
  CheckCircle2, AlertCircle, Clock, FileText, Mail
} from 'lucide-react';
import ChapterEditor from '../components/ChapterEditor.jsx';

// ── RBAC Map ──────────────────────────────────────────────────────────────────
export const ADMIN_ROLES = {
  'Baş Admin': {
    color: 'text-red-400 bg-red-500/10 border-red-500/30',
    badge: 'bg-gradient-to-br from-red-600 to-rose-900',
    access: ['dashboard', 'content', 'chapterEditor', 'add', 'announcements', 'users', 'tickets', 'pages', 'messages', 'command', 'suggestions', 'settings', 'trash'],
  },
  'Yönetici': {
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    badge: 'bg-gradient-to-br from-purple-600 to-indigo-800',
    access: ['dashboard', 'content', 'chapterEditor', 'add', 'announcements', 'users', 'tickets', 'pages', 'messages', 'command', 'suggestions', 'settings', 'trash'],
  },
  'Admin Yardımcısı': {
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    badge: 'bg-gradient-to-br from-blue-600 to-cyan-800',
    access: ['dashboard', 'content', 'chapterEditor', 'add', 'command', 'suggestions', 'trash'],
  },
  'Editör': {
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'bg-gradient-to-br from-emerald-600 to-teal-800',
    access: ['dashboard', 'content', 'chapterEditor'],
  },
};

const ALL_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'content', label: 'Seri Envanteri', icon: BookOpen },
  { id: 'chapterEditor', label: 'Bölüm Editörü', icon: Layers },
  { id: 'add', label: 'Hızlı Ekle', icon: PlusCircle },
  { id: 'command', label: 'Siber Komuta', icon: Activity },
  { id: 'suggestions', label: 'Lojistik Öneriler', icon: FileText },
  { id: 'announcements', label: 'Duyuru Yönetimi', icon: Bell },
  { id: 'users', label: 'Kullanıcı Yönetimi', icon: UserCheck },
  { id: 'tickets', label: 'Bilet Hattı (Hata)', icon: ShieldAlert },
  { id: 'pages', label: 'Sayfa Yönetimi', icon: FileText },
  { id: 'messages', label: 'Gelen Mesajlar', icon: Mail },
  { id: 'settings', label: 'Kozmik Ayarlar', icon: Settings },
  { id: 'trash', label: 'Geri Dönüşüm', icon: Trash2 },
];

// ImgBB Key Pool (Mühürlendi!)
const IMGBB_KEYS = [
  'f86ef28239e9e9c876182dcbab114489',
  '61aac4bb998738d36994eb94bec61b3d',
  'c8aa007b2512bd5b4a97925acf9212a8'
];
console.log("[SYSTEM] ImgBB Anahtarları Namluda (Hardcoded):", IMGBB_KEYS.length);
let currentKeyIndex = 0;

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
  const [selectedId, setSelectedId] = useState('');
  const [chapterNum, setChapterNum] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pageUrls, setPageUrls] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  // Series State
  const [newSeries, setNewSeries] = useState({
    title: '', cover: '', description: '', genre: 'Aksiyon', status: 'Devam Ediyor',
  });

  const compressToBase64 = (file) => new Promise((resolve, reject) => {
    console.log(`[PROCESS] Sıkıştırma başladı: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = (e) => reject(new Error("Dosya okuma hatası!"));
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onerror = () => reject(new Error("Görsel formatı bozuk veya yüklenemedi!"));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 1200;
          let { width: w, height: h } = img;
          if (w > maxW) { h = (maxW / w) * h; w = maxW; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const b64 = canvas.toDataURL('image/jpeg', 0.8);
          console.log(`[PROCESS] Sıkıştırma tamam: ${file.name} -> ${(b64.length/1024).toFixed(1)} KB`);
          resolve(b64);
        } catch (err) {
          reject(new Error("Canvas işleme hatası: " + err.message));
        }
      };
    };
  });

  const uploadToImgBB = async (base64, fileName) => {
    let attempts = 0;
    while (attempts < IMGBB_KEYS.length) {
      const key = IMGBB_KEYS[currentKeyIndex];
      try {
        console.log(`[UPLOAD] ${fileName} gönderiliyor (Key: ${currentKeyIndex + 1})`);
        const form = new FormData();
        form.append('image', base64.split(',')[1]);
        
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { 
          method: 'POST', 
          body: form 
        });
        const json = await res.json();
        
        if (json.success) {
          console.log(`[UPLOAD-OK] ${fileName} yüklendi: ${json.data.url}`);
          return json.data.url;
        }
        
        console.warn(`[UPLOAD-HATA] Key ${currentKeyIndex + 1} reddetti:`, json.error?.message);
        currentKeyIndex = (currentKeyIndex + 1) % IMGBB_KEYS.length;
        attempts++;
      } catch (err) {
        console.error(`[UPLOAD-KRİTİK] Key ${currentKeyIndex + 1} ağ hatası:`, err.message);
        currentKeyIndex = (currentKeyIndex + 1) % IMGBB_KEYS.length;
        attempts++;
      }
    }
    throw new Error('Tüm ImgBB anahtarları tükendi. F12 konsoluna bakınız.');
  };

  const handleFileSelect = async (e, target) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    try {
      showToast(`${files.length} görsel işleniyor...`, 'info');
      const urls = [];
      
      for (const file of files) {
        const b64 = await compressToBase64(file);
        const url = await uploadToImgBB(b64, file.name);
        urls.push(url);
      }

      if (target === 'pages') {
        setPageUrls(prev => [...(prev.trim() ? prev.split('\n') : []), ...urls].join('\n'));
      } else {
        setNewSeries(p => ({ ...p, cover: urls[0] }));
      }
      showToast(`✅ ${files.length} görsel başarıyla yüklendi!`, 'success');
    } catch (err) {
      console.error("[FATAL] Harekât Başarısız:", err.message);
      showToast(err.message, 'error');
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
      if (err.message && err.message.includes('stole it')) {
        showToast('Sistem arka planda senkronize oluyor, lütfen butona tekrar basın.', 'info');
      } else {
        showToast('Seri eklenirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'), 'error');
      }
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!selectedId) { showToast('Seri seçin!', 'error'); return; }
    if (!chapterNum) { showToast('Bölüm no gerekli!', 'error'); return; }

    const parsedNum = parseFloat(chapterNum.toString().replace(',', '.'));
    if (isNaN(parsedNum)) { showToast('Bölüm no sadece sayı olmalıdır!', 'error'); return; }

    const pages = pageUrls.split('\n').map(u => u.trim()).filter(Boolean);

    try {
      await addChapter(Number(selectedId), { number: parsedNum, title: chapterTitle, pages, isPremium });
      showToast(`🚀 Bölüm ${parsedNum} yayınlandı!`, 'success');
      setChapterNum(''); setChapterTitle(''); setPageUrls(''); setIsPremium(false);
      setSubmitted('chapter');
      setTimeout(() => setSubmitted(null), 3000);
    } catch (err) {
      showToast('Bölüm eklenirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'), 'error');
    }
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
              <input type="text" value={newSeries.title} onChange={e => setNewSeries(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Solo Leveling vb." />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Kapak URL *</label>
                <label className="cursor-pointer text-[9px] font-black text-green-400 hover:text-green-300">
                  Yükle <input type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'cover')} />
                </label>
              </div>
              <input type="url" value={newSeries.cover} onChange={e => setNewSeries(p => ({ ...p, cover: e.target.value }))} className={inputCls} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 ml-1">Açıklama</label>
            <textarea rows={2} value={newSeries.description} onChange={e => setNewSeries(p => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Seri özeti..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={newSeries.genre} onChange={e => setNewSeries(p => ({ ...p, genre: e.target.value }))} className={`${inputCls} cursor-pointer`}>
              {['Aksiyon', 'Macera', 'Fantezi', 'Dram', 'Romantik'].map(g => <option key={g} value={g} className="bg-[#0a0a14]">{g}</option>)}
            </select>
            <select value={newSeries.status} onChange={e => setNewSeries(p => ({ ...p, status: e.target.value }))} className={`${inputCls} cursor-pointer`}>
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
  const [newAnn, setNewAnn] = useState('');
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
            {['Duyuru', 'Tip', 'Tarih', 'İşlem'].map(h => (
              <th key={h} className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {announcements.map(a => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-5 py-4 text-slate-200 max-w-xs truncate">{a.text}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${a.type === 'chapter' ? 'bg-emerald-500/10 text-emerald-400' :
                      a.type === 'series' ? 'bg-blue-500/10 text-blue-400' :
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
// Sub-component: Tickets Panel (Error Reports) — REDESIGNED PROFESSIONAL RADAR
// ─────────────────────────────────────────────────────────────────────────────
function TicketsPanel({ showToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { sortedSeries } = useApp();

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('error_reports')
      .select('*, series:series_id(title)')
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
    const channel = supabase
      .channel('admin-tickets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'error_reports' }, (payload) => {
        setTickets(prev => [payload.new, ...prev]);
        showToast('🚀 Yeni bir kozmik ihbar düştü!', 'info');
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleStatusUpdate = async (id, status) => {
    const { error } = await supabase.from('error_reports').update({ status }).eq('id', id);
    if (!error) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      showToast(`Bilet durumu ${status} olarak güncellendi.`, 'success');
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Bu ihbarı kalıcı olarak silmek istiyor musunuz?')) return;
    const { error } = await supabase.from('error_reports').delete().eq('id', id);
    if (!error) {
      setTickets(prev => prev.filter(t => t.id !== id));
      showToast('İhbar siber boşluğa gönderildi.', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldAlert size={32} className="text-red-500" /> Hata Bildirimleri
          </h2>
          <p className="text-slate-500 font-medium mt-1">Siber sahadan gelen tüm teknik ihbarlar burada toplanır.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 glass border border-white/5 rounded-2xl">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">Toplam:</span>
            <span className="text-white font-black">{tickets.length}</span>
          </div>
          <button onClick={fetchTickets} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all">
            <Activity size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Bekleyen', count: tickets.filter(t => t.status === 'Beklemede').length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'İncelenen', count: tickets.filter(t => t.status === 'İnceleniyor').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Çözülen', count: tickets.filter(t => t.status === 'Çözüldü').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(stat => (
          <div key={stat.label} className="glass border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 transition-all">
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className={`text-3xl font-black ${stat.color}`}>{stat.count}</h4>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center font-black ${stat.color} text-xl border border-white/5`}>
              {stat.count}
            </div>
          </div>
        ))}
      </div>

      {/* Main Table / Grid */}
      <div className="glass border border-white/8 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/3 border-b border-white/8">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Kullanıcı & Tarih</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Konu & Seri</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Hata Detayı</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Durum</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tickets.map((t) => (
                <tr key={t.id} className="group hover:bg-white/2 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-xs border border-white/10 shadow-lg">
                        {t.user_id ? '👤' : '🕵️'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{t.user_id ? 'Kayıtlı Üye' : 'Misafir Okuyucu'}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{new Date(t.created_at).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-black border border-red-500/20 w-fit uppercase tracking-tighter">
                        {t.type}
                      </span>
                      <p className="text-xs text-white font-black truncate max-w-[150px]">
                        {t.series?.title || `Seri ID: #${t.series_id}`}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">Bölüm: {t.chapter_num || '—'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm line-clamp-2 italic">
                      "{t.description}"
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-white/20 transition-all ${
                          t.status === 'Çözüldü' ? 'text-emerald-400' : 
                          t.status === 'İnceleniyor' ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        <option value="Beklemede">🔴 BEKLEMEDE</option>
                        <option value="İnceleniyor">🟡 İNCELENİYOR</option>
                        <option value="Çözüldü">🟢 ÇÖZÜLDÜ</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(t.id, 'Çözüldü')}
                        disabled={t.status === 'Çözüldü'}
                        className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title="Hızlı Çöz"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTicket(t.id)}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                        title="İhbarı İmhâ Et"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tickets.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h5 className="text-2xl font-black text-white mb-2">Siber Saha Temiz!</h5>
            <p className="text-slate-500 max-w-xs">Şu an için bekleyen herhangi bir hata bildirimi bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Users Panel
// ─────────────────────────────────────────────────────────────────────────────
function UsersPanel({ showToast }) {
const { calculateTitle } = useAuth();
const { registeredUsers, updateProfile, deleteProfile } = useApp();
const [search, setSearch] = useState('');
const [editingUser, setEditingUser] = useState(null);
const [confirmDelete, setConfirmDelete] = useState(null);

const filtered = registeredUsers.filter(u =>
  (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
  (u.email || '').toLowerCase().includes(search.toLowerCase())
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
            {['Kullanıcı', 'E-posta', 'Level / Rütbe', 'Rol', 'Katılım', 'İşlem'].map(h => (
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
                    <div className="flex flex-col gap-0.5">
                      <span className="text-purple-400 font-black text-[10px] uppercase tracking-tighter">XP: {u.xp || 0}</span>
                      <span className="text-white font-bold text-[10px] whitespace-nowrap bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {calculateTitle(u.xp || 0)}
                      </span>
                    </div>
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
                          <button onClick={() => setConfirmDelete(null)} className="p-1.5 text-slate-400 hover:bg-white/10 rounded-lg"><X size={14} /></button>
                          <button onClick={async () => { await deleteProfile(u.id); setConfirmDelete(null); showToast('Kullanıcı silindi', 'error'); }}
                            className="px-2 py-1 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] font-black flex items-center gap-1">
                            SİL <Check size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingUser({ ...u })} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all" title="Düzenle">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete(u.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all" title="Sil">
                            <Trash2 size={14} />
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
              <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">Kullanıcı Adı</label>
                <input type="text" value={editingUser.username || ''} onChange={e => setEditingUser(p => ({ ...p, username: e.target.value }))}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">E-posta</label>
                <input type="email" value={editingUser.email || ''} onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">Yeni Şifre (Boş bırakılırsa değişmez)</label>
                <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all" />
                <p className="text-[9px] text-amber-500/70 mt-1 font-bold italic">Not: Şifre değişikliği sadece Auth sağlayıcısı email ise çalışır.</p>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">Sistem Rolü</label>
                <select value={editingUser.role || 'Kullanıcı'} onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer">
                  {['Kullanıcı', 'Editör', 'Admin Yardımcısı', 'Yönetici', 'Baş Admin'].map(r => (
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
                <Save size={16} /> Kaydet
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
// Sub-component: Command Center (Update & Deploy)
// ─────────────────────────────────────────────────────────────────────────────
function CommandPanel({ showToast }) {
  const [staging, setStaging] = useState('Analiz ediliyor...');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('IDLE'); // IDLE, DEPLOYING, ROLLBACK

  const fetchStaging = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/staging');
      const data = await res.json();
      setStaging(data.status);
    } catch (err) {
      setStaging('Siber Karargâh Sunucusu Çevrimdışı!');
    }
  };

  useEffect(() => {
    fetchStaging();
    const interval = setInterval(fetchStaging, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeploy = async () => {
    if (!window.confirm('Tüm değişiklikler yayına alınacak. Taarruz başlasın mı?')) return;
    setLoading(true);
    setStatus('DEPLOYING');
    try {
      const res = await fetch('http://localhost:3001/api/admin/deploy', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('🚀 Taarruz Başarılı! Site rebuild ediliyor.', 'success');
      } else throw new Error(data.error);
    } catch (err) {
      showToast('Pusuya düşüldü: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setStatus('IDLE');
      fetchStaging();
    }
  };

  const handleRollback = async () => {
    if (!window.confirm('Sistem bir önceki başarılı nizamına geri döndürülecek. Onaylıyor musunuz?')) return;
    setLoading(true);
    setStatus('ROLLBACK');
    try {
      const res = await fetch('http://localhost:3001/api/admin/rollback', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('⚓ Geri Çekilme Başarılı! Sistem eski haline döndü.', 'info');
      } else throw new Error(data.error);
    } catch (err) {
      showToast('Geri çekilme başarısız: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setStatus('IDLE');
      fetchStaging();
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Staging Area */}
        <div className="glass border border-white/8 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[80px] pointer-events-none" />
          <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <Layers className="text-purple-400" size={24} /> Staging Area (Taslak)
          </h3>
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm text-emerald-400 min-h-[200px] max-h-[400px] overflow-auto whitespace-pre-wrap shadow-inner">
            {staging || 'Değişiklik taranıyor...'}
          </div>
          <p className="text-slate-500 text-xs mt-4 italic">* Yapılan yerel değişiklikler burada canlı olarak listelenir.</p>
        </div>

        {/* Deploy & Rollback */}
        <div className="space-y-6">
          <div className="glass border border-white/8 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-2xl font-black text-white mb-2">Hızlı Yayınlama (One-Click)</h3>
            <p className="text-slate-500 text-sm mb-8">Tek tıkla tüm kodları GitHub'a fırlatır ve siteyi günceller.</p>
            
            <div className="space-y-4">
              {status === 'DEPLOYING' && (
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: '100%' }} 
                    transition={{ duration: 10, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
                  />
                </div>
              )}
              <button 
                onClick={handleDeploy} 
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl ${
                  loading ? 'opacity-50 cursor-not-allowed bg-slate-800' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-95 shadow-neon-purple text-white'
                }`}
              >
                {loading && status === 'DEPLOYING' ? <Activity className="animate-spin" /> : <Globe size={24} />}
                {status === 'DEPLOYING' ? 'GÜNCELLEME YAYINLANIYOR...' : 'TASLAĞI YAYINLA'}
              </button>
            </div>
          </div>

          <div className="glass border border-white/8 rounded-3xl p-8 border-red-500/20 group">
             <h3 className="text-xl font-black text-white mb-2">Kozmik Rollback (Geri Al)</h3>
             <p className="text-slate-500 text-sm mb-6">Eğer bir hata çıktıysa, saniyeler içinde sistemi eski nizamına döndürür.</p>
             <button 
                onClick={handleRollback} 
                disabled={loading}
                className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 border border-red-500/30 ${
                  loading ? 'opacity-50' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'
                }`}
              >
                {loading && status === 'ROLLBACK' ? <Activity className="animate-spin" /> : <SkipBack size={18} />}
                {status === 'ROLLBACK' ? 'GERİ ÇEKİLME BAŞLADI...' : 'SİSTEMİ GERİ AL (ROLLBACK)'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Suggestions (Lojistik Öneriler)
// ─────────────────────────────────────────────────────────────────────────────
function SuggestionsPanel() {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/suggestions');
      const data = await res.json();
      setSuggestions(data.content || 'Henüz öneri gelmedi Teğmenim.');
    } catch (err) {
      setSuggestions('Lojistik Sunucusu Çevrimdışı!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    const interval = setInterval(fetchSuggestions, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Lojistik Öneri Hattı</h2>
            <p className="text-slate-500 text-sm mt-1">suggestions.txt dosyasından canlı olarak okunur.</p>
          </div>
          <button onClick={fetchSuggestions} className="p-2.5 glass border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
             <Activity size={18} className={loading ? 'animate-spin' : ''} />
          </button>
       </div>

       <div className="glass border border-white/8 rounded-3xl p-8 bg-black/30">
          <div className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap max-h-[600px] overflow-auto custom-scrollbar">
             {suggestions}
          </div>
       </div>
       
       <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <ShieldAlert className="text-amber-500 flex-shrink-0" size={20} />
          <p className="text-amber-500/80 text-xs font-medium">Bu veriler veritabanını şişirmemesi için direkt olarak sunucu dosya sisteminde mühürlenmektedir.</p>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Page Management (CMS)
// ─────────────────────────────────────────────────────────────────────────────
function PageManagement({ showToast }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('pages').select('*').order('slug');
    if (data) setPages(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleSavePage = async (e) => {
    e.preventDefault();
    if (!editingPage.slug || !editingPage.title) {
      showToast('Slug ve Başlık boş olamaz Teğmenim!', 'error');
      return;
    }

    try {
      // id varsa id üzerinden, yoksa slug üzerinden güncelle
      const { error } = await supabase
        .from('pages')
        .upsert(editingPage, { onConflict: 'slug' });

      if (error) throw error;

      showToast('Sayfa siber olarak mühürlendi!', 'success');
      setEditingPage(null);
      fetchPages();
    } catch (err) {
      console.error("[CMS] Kayıt Hatası:", err);
      showToast('Kayıt başarısız: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <FileText size={24} className="text-blue-400" /> Sayfa Yönetimi (CMS)
        </h2>
        <button 
          onClick={() => setEditingPage({ slug: '', title: '', content: '' })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <PlusCircle size={14} /> Yeni Sayfa
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {pages.map(p => (
          <div key={p.id} className="glass border border-white/10 rounded-2xl p-5 hover:border-blue-500/50 transition-all group">
            <h4 className="text-lg font-black text-white mb-1">{p.title}</h4>
            <p className="text-xs text-slate-500 font-mono mb-4">/{p.slug}</p>
            <div className="flex gap-2">
              <button onClick={() => setEditingPage(p)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase text-slate-300 transition-all">Düzenle</button>
              <button 
                onClick={async () => { if (window.confirm('Silinsin mi?')) { await supabase.from('pages').delete().eq('id', p.id); fetchPages(); } }}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingPage && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl glass-strong border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-2xl font-black text-white">Sayfa Düzenle: {editingPage.slug}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Slug (örn: gizlilik)" value={editingPage.slug} onChange={e => setEditingPage({...editingPage, slug: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
              <input type="text" placeholder="Başlık" value={editingPage.title} onChange={e => setEditingPage({...editingPage, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
              <textarea rows={10} placeholder="İçerik (HTML destekler)" value={editingPage.content} onChange={e => setEditingPage({...editingPage, content: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingPage(null)} className="px-6 py-2 text-slate-400 font-bold">Vazgeç</button>
              <button onClick={handleSavePage} className="px-8 py-2 bg-blue-600 text-white font-black rounded-xl">Kaydet</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Inbox Panel (Contact Messages)
// ─────────────────────────────────────────────────────────────────────────────
function InboxPanel({ showToast }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (data) setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu mesaj silinsin mi?')) return;
    await supabase.from('contact_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    showToast('Mesaj siber boşluğa gönderildi.', 'error');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Mail size={24} className="text-emerald-400" /> Gelen Mesajlar
        </h2>
        <button onClick={fetchMessages} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white"><Activity size={18} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="space-y-4">
        {messages.map(m => (
          <div key={m.id} className="glass border border-white/8 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md mb-2 inline-block">{m.subject || 'Genel İletişim'}</span>
                <h4 className="text-lg font-black text-white">{m.name}</h4>
                <p className="text-xs text-slate-500">{m.email} • {new Date(m.created_at).toLocaleString('tr-TR')}</p>
              </div>
              <button onClick={() => handleDelete(m.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button>
            </div>
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl italic text-sm text-slate-400 leading-relaxed">
              "{m.message}"
            </div>
          </div>
        ))}
        {messages.length === 0 && !loading && <div className="py-20 text-center text-slate-500">Henüz gelen bir mesaj yok Teğmenim.</div>}
      </div>
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
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchSeries, setSearchSeries] = useState('');
  const [editingSeries, setEditingSeries] = useState(null);
  const [editingSeriesTab, setEditingSeriesTab] = useState('details');
  const [confirmDelSeries, setConfirmDelSeries] = useState(null);
  const [settingPrefs, setSettingPrefs] = useState({ tempMaintenance: false });

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
  const userRole = user?.role || '';
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
    { label: 'Toplam Seri', value: series.length, icon: BookOpen, color: 'from-purple-600 to-purple-800', glow: 'rgba(168,85,247,0.3)', change: 'Canlı' },
    { label: 'Toplam Okuma', value: series.reduce((a, s) => a + (s.reads_num || 0), 0), icon: Eye, color: 'from-blue-600 to-blue-800', glow: 'rgba(59,130,246,0.3)', change: 'Tüm Zamanlar' },
    { label: 'Kullanıcılar', value: registeredUsers.length, icon: Users, color: 'from-cyan-600 to-cyan-800', glow: 'rgba(6,182,212,0.3)', change: 'Kayıtlı' },
    { label: 'Toplam Bölüm', value: totalChapters, icon: BookOpen, color: 'from-orange-600 to-orange-800', glow: 'rgba(249,115,22,0.3)', change: 'Yayında' },
    { label: 'Duyurular', value: announcements.length, icon: Globe, color: 'from-pink-600 to-pink-800', glow: 'rgba(236,72,153,0.3)', change: 'Sistem' },
  ];

  const filteredSeries = series.filter(s => !s.is_deleted && (s.title || '').toLowerCase().includes(searchSeries.toLowerCase()));
  const deletedSeries = series.filter(s => s.is_deleted && (s.title || '').toLowerCase().includes(searchSeries.toLowerCase()));

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
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${safeActiveNav === item.id ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon size={17} className="flex-shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
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
                      <div className={`w-2 h-2 rounded-full ${a.type === 'chapter' ? 'bg-emerald-400' : a.type === 'series' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                      <span className="text-slate-300 text-sm line-clamp-1">{a.text}</span>
                    </div>
                    <span className="text-slate-500 text-xs bg-black/30 px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0">
                      {new Date(a.created_at || a.ts).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
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
                  {['Seri', 'İstatistik', 'Durum', 'Aksiyon'].map(h => (
                    <th key={h} className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  <AnimatePresence>
                    {filteredSeries.map(s => (
                      <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`border-b border-white/5 transition-colors ${s.is_trending ? 'bg-orange-500/3 hover:bg-orange-500/5' : 'hover:bg-white/5'}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img src={s.cover} className="w-12 h-16 rounded-lg object-cover shadow-lg border border-white/10" alt="" />
                              <div className="absolute -bottom-2 -right-2 bg-black/80 rounded border border-white/10 px-1 py-0.5 text-[9px] font-bold text-white">
                                {(chapters[String(s.id)] || []).length}B
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
                              className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-black border transition-all hover:scale-[1.03] w-fit ${s.status === 'Devam Ediyor' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10'}`}>
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
                                <button onClick={() => setConfirmDelSeries(null)} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg"><X size={16} /></button>
                                <button onClick={async () => { await updateSeries(s.id, { is_deleted: true }); setConfirmDelSeries(null); showToast('Çöp kutusuna taşındı', 'error'); }}
                                  className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg bg-red-500/10 border border-red-500/30 font-bold text-xs flex items-center gap-1">
                                  ONAYLA <Check size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => toggleTrend(s.id)}
                                  className={`p-2 rounded-lg transition-all border ${s.is_trending ? 'text-orange-400 bg-orange-500/20 border-orange-500/30' : 'text-slate-500 border-transparent hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/10'}`}>
                                  <Flame size={15} className={s.is_trending ? 'fill-orange-400' : ''} />
                                </button>
                                <button onClick={() => { setEditingSeries(s); setEditingSeriesTab('details'); }} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all">
                                  <Edit3 size={16} />
                                </button>
                                <button onClick={() => setConfirmDelSeries(s.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                                  <Trash2 size={16} />
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
              <h3 className="text-red-400 font-bold text-lg flex items-center gap-2"><Trash2 size={20} /> Çöp Kutusu</h3>
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
        {safeActiveNav === 'tickets' && <TicketsPanel showToast={showToast} />}
        {safeActiveNav === 'pages' && <PageManagement showToast={showToast} />}
        {safeActiveNav === 'messages' && <InboxPanel showToast={showToast} />}
        {safeActiveNav === 'add' && <QuickAddForm seriesList={series} showToast={showToast} />}
        {safeActiveNav === 'chapterEditor' && <ChapterEditor seriesList={series} showToast={showToast} />}

        {/* Universe Settings */}
        {safeActiveNav === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            <div className="glass border border-white/8 rounded-2xl p-6">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <Globe className="text-blue-400" size={20} /> Kozmik Ayarlar
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
                  <button onClick={() => { if (window.confirm('Tüm önbelleği temizlemek istiyor musunuz?')) showToast('Kozmik önbellek temizlendi.', 'success'); }}
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
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 glass-strong border ${toast.type === 'error' ? 'border-red-500/50 text-red-200' :
                toast.type === 'info' ? 'border-blue-500/50 text-blue-200' :
                  'border-emerald-500/50 text-emerald-200'
              }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'info' ? 'bg-blue-500' :
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
              <ChapterEditor seriesList={series.filter(s => !s.is_deleted)} showToast={showToast} />
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
                <button onClick={() => setEditingSeries(null)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl"><X size={24} /></button>
              </div>

              <form onSubmit={handleSaveSeries} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Başlık</label>
                      <input type="text" value={editingSeries.title} onChange={e => setEditingSeries({ ...editingSeries, title: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Yazar</label>
                      <input type="text" value={editingSeries.author || ''} onChange={e => setEditingSeries({ ...editingSeries, author: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Açıklama</label>
                      <textarea rows={4} value={editingSeries.description || ''} onChange={e => setEditingSeries({ ...editingSeries, description: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none resize-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Kapak Görseli</label>
                      <div className="flex gap-4 items-start">
                        <img src={editingSeries.cover} className="w-24 h-32 rounded-xl object-cover border border-white/10 shadow-lg" alt="" />
                        <input type="url" value={editingSeries.cover} onChange={e => setEditingSeries({ ...editingSeries, cover: e.target.value })}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Puan</label>
                        <input type="number" step="0.1" value={editingSeries.rating} onChange={e => setEditingSeries({ ...editingSeries, rating: Number(e.target.value) })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1.5 tracking-widest">Durum</label>
                        <select value={editingSeries.status} onChange={e => setEditingSeries({ ...editingSeries, status: e.target.value })}
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
