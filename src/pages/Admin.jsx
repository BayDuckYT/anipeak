import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import {
  LayoutDashboard, BookOpen, PlusCircle, Users, Settings,
  TrendingUp, Eye, Star, Trash2, Edit3, Shield, ChevronRight,
  BarChart2, Globe, Crown, Check, X, Search, Image as ImageIcon,
  Activity, DollarSign, UserCheck, Save, ShieldAlert, SkipBack,
  Flame, Layers
} from 'lucide-react';
import ChapterEditor from '../components/ChapterEditor.jsx';

export const ADMIN_ROLES = {
  'Yönetici':               { color: 'text-red-500 bg-red-500/10 border-red-500/30',         badge: 'bg-gradient-to-br from-red-600 to-red-900',       access: ['dashboard', 'content', 'chapterEditor', 'add', 'enterpriseUsers', 'settings', 'trash'] },
  'Baş Admin':              { color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', badge: 'bg-gradient-to-br from-purple-500 to-indigo-600',  access: ['dashboard', 'content', 'chapterEditor', 'add', 'enterpriseUsers', 'trash'] },
  'Baş Admin Yardımcısı':  { color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',       badge: 'bg-gradient-to-br from-blue-500 to-cyan-600',     access: ['dashboard', 'content', 'chapterEditor', 'add', 'trash'] },
  'Admin':                  { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', badge: 'bg-gradient-to-br from-emerald-500 to-teal-600', access: ['dashboard', 'content', 'chapterEditor', 'trash'] },
  'Admin Yardımcısı':      { color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',     badge: 'bg-gradient-to-br from-amber-500 to-orange-600',  access: ['dashboard'] },
};



function MetricCard({ card, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="relative glass border border-white/8 rounded-2xl p-5 overflow-hidden group hover:border-white/15 transition-all duration-300"
      style={{ boxShadow: `0 4px 30px ${card.glow}` }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
          <card.icon size={18} className="text-white" />
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
          {card.change}
        </span>
      </div>
      <div className="text-2xl font-black text-white mb-1">{card.value}</div>
      <div className="text-xs text-slate-500 font-medium">{card.label}</div>
    </motion.div>
  );
}

function AddChapterForm({ seriesList, showToast, sendNotification }) {
  const { addChapter, addAnnouncement, addSeries } = useApp();
  const [submitted, setSubmitted]     = useState(false);
  const [tab, setTab]                 = useState('chapter');
  const [announcementText, setAnnouncementText] = useState('');
  const [selectedId, setSelectedId]   = useState('');
  const [chapterNum, setChapterNum]   = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pageUrls, setPageUrls]       = useState('');
  const [isPremium, setIsPremium]     = useState(false);
  const [newSeriesData, setNewSeriesData] = useState({ title: '', cover: '', description: '', genre: 'Aksiyon', status: 'Devam Ediyor' });
  const IMGBB_API_KEY = "23884105154ff50ed54b8de837952b35";

  const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
    });
  };

  const uploadToImgBB = async (base64Image) => {
    const formData = new FormData();
    // Base64 string looks like "data:image/jpeg;base64, ..."
    // We only need the part after the comma
    const base64Content = base64Image.split(',')[1];
    formData.append('image', base64Content);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    if (result.success) {
      return result.data.url;
    } else {
      throw new Error(result.error?.message || 'Yükleme başarısız');
    }
  };

  const handleFileSelect = async (e, target) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      showToast(`${files.length} görsel buluta yükleniyor...`, 'info');
      
      const uploadedUrls = await Promise.all(files.map(async (f) => {
        const compressed = await compressImage(f);
        return await uploadToImgBB(compressed);
      }));
      
      if (target === 'pages') {
        const currentPages = pageUrls.trim() ? pageUrls.split('\n') : [];
        setPageUrls([...currentPages, ...uploadedUrls].join('\n'));
      } else if (target === 'cover') {
        setNewSeriesData({ ...newSeriesData, cover: uploadedUrls[0] });
      }
      showToast(`✅ ${files.length} görsel başarıyla buluta yüklendi ve linkleri oluşturuldu!`, 'success');
    } catch (err) {
      console.error("Yükleme hatası:", err);
      showToast('Görsel buluta aktarılamadı. Lütfen API anahtarını kontrol edin.', 'error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (tab === 'chapter') {
        if (!selectedId) { showToast('Lütfen bir seri seçin!', 'error'); return; }
        if (!chapterNum)  { showToast('Bölüm numarası gerekli!', 'error'); return; }
        const pages = pageUrls?.split('\n').map(u => u.trim()).filter(Boolean) || [];
        addChapter(Number(selectedId), {
          number: Number(chapterNum),
          title: chapterTitle,
          pages,
          isPremium,
        });
        sendNotification('Yeni Bölüm!', `Bölüm ${chapterNum} yayınlandı.`, 'info');
        showToast(`🚀 Bölüm ${chapterNum} başarıyla yayınlandı! Trendlere otomatik eklendi.`, 'success');
        setChapterNum(''); setChapterTitle(''); setPageUrls(''); setIsPremium(false);
      } else if (tab === 'series') {
        if (!newSeriesData?.title || !newSeriesData?.cover) { showToast('Başlık ve Kapak URL gerekli!', 'error'); return; }
        addSeries({
          title: newSeriesData.title,
          cover: newSeriesData.cover,
          description: newSeriesData.description,
          genre: newSeriesData.genre,
          status: newSeriesData.status,
        });
        sendNotification('Yeni Seri!', `"${newSeriesData.title}" veritabanına eklendi.`, 'info');
        showToast('Seri başarıyla oluşturuldu!', 'success');
        setNewSeriesData({ title: '', cover: '', description: '', genre: 'Aksiyon', status: 'Devam Ediyor' });
      } else {
        if (!announcementText?.trim()) return;
        addAnnouncement(announcementText, 'system');
        sendNotification('Global Duyuru', announcementText, 'info');
        showToast('Duyuru tüm evrene gönderildi!', 'success');
        setAnnouncementText('');
      }
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      console.error("İşlem hatası:", err);
      showToast('Kritik bir hata oluştu. Veri yapısını kontrol edin.', 'error');
    }
  };

  return (
    <div className="glass border border-white/8 rounded-2xl p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
        <button onClick={() => setTab('series')} className={`font-bold text-lg flex items-center gap-2 transition-colors ${tab === 'series' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
          <BookOpen size={20} className={tab === 'series' ? 'text-green-400' : ''} />
          Yeni Seri
        </button>
        <button onClick={() => setTab('chapter')} className={`font-bold text-lg flex items-center gap-2 transition-colors ${tab === 'chapter' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
          <PlusCircle size={20} className={tab === 'chapter' ? 'text-purple-400' : ''} />
          Yeni Bölüm
        </button>
        <button onClick={() => setTab('announcement')} className={`font-bold text-lg flex items-center gap-2 transition-colors ${tab === 'announcement' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
          <Activity size={20} className={tab === 'announcement' ? 'text-blue-400' : ''} />
          Duyuru
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === 'chapter' ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Seri Seç *</label>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:shadow-[0_0_8px_rgba(168,85,247,0.3)] transition-all">
                  <option value="" className="bg-[#0a0a14]">— Seçin —</option>
                  {seriesList?.map((s) => (<option key={s.id} value={s.id} className="bg-[#0a0a14]">{s?.title}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Bölüm Numarası *</label>
                <input type="text" value={chapterNum} onChange={e => setChapterNum(e.target.value)} placeholder="Örn: 188 veya Özel" required className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Bölüm Başlığı</label>
              <input type="text" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} placeholder="İsteğe bağlı başlık" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Görsel URL'leri (her satıra bir URL)</label>
                <label className="cursor-pointer text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  <PlusCircle size={10} className="inline mr-1" /> Bilgisayardan Seç
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'pages')} />
                </label>
              </div>
              <textarea rows={4} value={pageUrls} onChange={e => setPageUrls(e.target.value)} placeholder={`https://cdn.anipeak.com/series/1/ch188/01.jpg\nveya bilgisayardan seçin...`} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all resize-none font-mono text-[10px]" />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsPremium(p => !p)}>
                <div className="relative">
                  <div className={`w-10 h-5 rounded-full transition-colors ${isPremium ? 'bg-purple-600' : 'bg-white/10'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isPremium ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-slate-300">Premium İçerik</span>
              </label>
            </div>
          </>
        ) : tab === 'series' ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Seri Başlığı *</label>
                <input type="text" required value={newSeriesData.title} onChange={e => setNewSeriesData({...newSeriesData, title: e.target.value})} placeholder="Örn: Solo Leveling" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-all" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Kapak URL *</label>
                  <label className="cursor-pointer text-[10px] font-bold text-green-400 hover:text-green-300 transition-colors bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                    <ImageIcon size={10} className="inline mr-1" /> PC'den Yükle
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'cover')} />
                  </label>
                </div>
                <input type="url" required value={newSeriesData.cover} onChange={e => setNewSeriesData({...newSeriesData, cover: e.target.value})} placeholder="https://... veya yükleyin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Özet (İsteğe Bağlı)</label>
              <textarea rows={2} value={newSeriesData.description} onChange={e => setNewSeriesData({...newSeriesData, description: e.target.value})} placeholder="Hikayenin kısa özeti..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-all resize-none" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Tür</label>
                <select value={newSeriesData.genre} onChange={e => setNewSeriesData({...newSeriesData, genre: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-all">
                  <option value="Aksiyon">Aksiyon</option>
                  <option value="Fantezi">Fantezi</option>
                  <option value="Romantik">Romantik</option>
                  <option value="Bilim Kurgu">Bilim Kurgu</option>
                  <option value="Dram">Dram</option>
                  <option value="Gerilim">Gerilim</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Durum</label>
                <select value={newSeriesData.status} onChange={e => setNewSeriesData({...newSeriesData, status: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-all">
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Evrensel Duyuru Metni</label>
            <textarea rows={4} required value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Sistem bakımından çıktık, iyi okumalar!" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none" />
          </div>
        )}
        <button
          type="submit"
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            submitted
              ? 'bg-emerald-600 text-white'
              : tab === 'chapter' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-neon-purple'
              : tab === 'series' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/30'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/30'
          }`}
        >
          {submitted ? <><Check size={16} /> Gönderildi!</> : <><PlusCircle size={16} /> {tab === 'chapter' ? 'Bölümü Yayınla' : tab === 'series' ? 'Seriyi Yarat' : 'Duyuruyu Gönder'}</>}
        </button>
      </form>
    </div>
  );
}

export default function Admin() {
  const { user, maintenanceMode, toggleMaintenance, sendNotification } = useAuth();
  const {
    series, addChapter, addAnnouncement, deleteAnnouncement,
    registeredUsers, updateRegisteredUser, deleteRegisteredUser,
    updateSeries, deleteSeries, toggleTrend, toggleStatus,
    chapters, announcements, loading: appLoading
  } = useApp();


  const [searchEnterprise, setSearchEnterprise] = useState('');
  const [editingEnterpriseUser, setEditingEnterpriseUser] = useState(null);
  const [confirmDeleteEnterprise, setConfirmDeleteEnterprise] = useState(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);

  const [searchSeries, setSearchSeries] = useState('');
  const [editingSeries, setEditingSeries] = useState(null);
  const [editingSeriesTab, setEditingSeriesTab] = useState('details');
  const [confirmDeleteSeries, setConfirmDeleteSeries] = useState(null);
  const [searchUsers, setSearchUsers] = useState('');

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050507]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-purple-400 font-black tracking-widest animate-pulse uppercase text-xs">Kozmik Veriler Senkronize Ediliyor...</div>
        </div>
      </div>
    );
  }

  const totalChapters = Object.values(chapters).reduce((acc, curr) => acc + curr.length, 0);

  const metricCards = [
    { label: 'Toplam Seri',      value: series.length,             icon: BookOpen,    color: 'from-purple-600 to-purple-800',  glow: 'rgba(168,85,247,0.3)',  change: 'Canlı Veri' },
    { label: 'Toplam Okunma',    value: series.reduce((acc, s) => acc + (s.reads_num || 0), 0), icon: Eye,         color: 'from-blue-600 to-blue-800',      glow: 'rgba(59,130,246,0.3)',  change: 'Tüm Zamanlar' },
    { label: 'Kayıtlı Ruhlar',   value: registeredUsers.length,    icon: Users,       color: 'from-cyan-600 to-cyan-800',      glow: 'rgba(6,182,212,0.3)',   change: 'Global Kayıt' },
    { label: 'Yeni Bugün',       value: registeredUsers.filter(u => u.joinDate === new Date().toISOString().split('T')[0]).length, icon: Activity,    color: 'from-emerald-600 to-emerald-800',glow: 'rgba(16,185,129,0.3)',  change: 'Bugünkü Kayıt' },
    { label: 'Toplam Bölüm',     value: totalChapters,             icon: BarChart2,   color: 'from-orange-600 to-orange-800',  glow: 'rgba(249,115,22,0.3)',  change: 'Yayında' },
    { label: 'Premium Üye',      value: registeredUsers.filter(u => u.premium).length,  icon: Crown,       color: 'from-amber-600 to-amber-800',    glow: 'rgba(245,158,11,0.3)',  change: 'VIP' },
    { label: 'Duyurular',        value: announcements.length,      icon: Globe,       color: 'from-pink-600 to-pink-800',      glow: 'rgba(236,72,153,0.3)',  change: 'Sistem' },
    { label: 'Memnuniyet',       value: '100%',                   icon: UserCheck,   color: 'from-violet-600 to-violet-800',  glow: 'rgba(124,58,237,0.3)',  change: 'Kusursuz' },
  ];

  // Settings mock state
  const [settingPrefs, setSettingPrefs] = useState({ newRegisters: true, premiumFeatures: true, emailNotifs: true, tempMaintenance: maintenanceMode });

  const handleSaveSettings = () => {
    toggleMaintenance(settingPrefs.tempMaintenance);
    showToast('Platform ayarları kalıcı olarak kaydedildi!', 'success');
  };

  // Authentication Check
  const userRole = user?.role || 'Kullanıcı';
  const roleConfig = ADMIN_ROLES[userRole];

  if (!user || !roleConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050507] p-4">
        <div className="glass border border-red-500/20 rounded-3xl p-10 max-w-md text-center shadow-[0_0_100px_rgba(239,68,68,0.1)]">
          <ShieldAlert size={64} className="text-red-500 mx-auto mb-6 opacity-90 animate-pulse" />
          <h2 className="text-2xl font-black text-white mb-2">Erişim Reddedildi</h2>
          <p className="text-slate-400 text-sm mb-8">
            Kozmik Oda'ya girmek için yeterli yetkiye sahip değilsiniz. Yalnızca Adminler burayı görebilir.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all group">
            <SkipBack size={16} className="group-hover:-translate-x-1 transition-transform" /> Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  // Determine allowed menus based on rank
  const allNavItems = [
    { id: 'dashboard',       label: 'Dashboard',                icon: LayoutDashboard },
    { id: 'content',         label: 'Eserler (Seriler)',        icon: BookOpen },
    { id: 'chapterEditor',   label: 'Bölüm Editörü',            icon: Layers },
    { id: 'add',             label: 'Hızlı Ekle',               icon: PlusCircle },
    { id: 'announcements',   label: 'Duyuru Yönetimi',          icon: Globe },
    { id: 'enterpriseUsers', label: 'Ruh Yönetimi (Kullanıcılar)', icon: UserCheck },
    { id: 'settings',        label: 'Kainat Ayarları',          icon: Settings },
    { id: 'trash',           label: 'Geri Dönüşüm',             icon: Trash2 },
  ];

  const allowedNavs = allNavItems.filter(n => roleConfig.access.includes(n.id));

  // Switch tab safely if current activeNav is restricted
  if (!roleConfig.access.includes(activeNav)) {
    setActiveNav('dashboard');
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSeries = (e) => {
    e.preventDefault();
    updateSeries(editingSeries.id, editingSeries);
    showToast('Tüm seri detayları başarıyla kaydedildi!', 'success');
    setEditingSeries(null);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    showToast('Kullanıcı evren kayıtları güncellendi!', 'success');
    setEditingUser(null);
  };

  const handleTrendToggle = (id) => {
    toggleTrend(id);
    const target = series.find(x => x.id === id);
    if (target) showToast(!target.isTrending ? "🔥 Trendlere taşındı!" : "Trendlerden çıkarıldı", !target.isTrending ? 'success' : 'error');
  };

  const handleStatusToggle = (id) => {
    toggleStatus(id);
    showToast('Seri durumu güncellendi!', 'success');
  };

  const filteredSeries = series.filter((s) => !s.isDeleted && (
    s.title.toLowerCase().includes(searchSeries.toLowerCase()) ||
    s.author.toLowerCase().includes(searchSeries.toLowerCase())
  ));

  const deletedSeries = series.filter((s) => s.isDeleted && (
    s.title.toLowerCase().includes(searchSeries.toLowerCase()) ||
    s.author.toLowerCase().includes(searchSeries.toLowerCase())
  ));
  
  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email[0].toLowerCase().includes(searchUsers.toLowerCase())
  );

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
                <Shield size={16} className={userRole === 'Yönetici' ? 'text-red-500' : 'text-amber-400'} />
                <span className="text-sm font-bold text-white tracking-widest whitespace-nowrap">KOZMİK ODA</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
            <ChevronRight size={16} className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {allowedNavs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeNav === item.id ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={17} className="flex-shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} className="whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        {/* User Rank Display */}
        <div className="p-4 border-t border-white/8">
           <div className={`p-3 rounded-2xl border ${roleConfig.color} shadow-lg shadow-black/20`}>
             <div className="flex gap-3 items-center w-full">
                <div className={`w-9 h-9 rounded-full ${roleConfig.badge} flex items-center justify-center text-white text-sm font-black shadow-lg flex-shrink-0`}>
                   {user.username.charAt(0).toUpperCase()}
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

      {/* ── MAIN CONTENT ── */}
      <motion.main animate={{ marginLeft: sidebarOpen ? 260 : 64 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="flex-1 min-h-screen p-4 sm:p-6 md:p-8 relative">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {allowedNavs.find((n) => n.id === activeNav)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Sistem Aktif</span>
          </div>
        </div>

        {/* Dashboard */}
        {activeNav === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {metricCards.map((card, i) => <MetricCard key={card.label} card={card} index={i} />)}
            </div>
            <div className="glass border border-white/8 rounded-2xl p-5 sm:p-6 shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-lg">
                <Activity size={18} className="text-purple-400" /> Son Kozmik Aktiviteler
              </h3>
              <div className="space-y-3">
                {announcements.length > 0 ? (
                  announcements.slice(0, 6).map((a, i) => (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
                          a.type === 'chapter' ? 'bg-emerald-400 text-emerald-400' : 
                          a.type === 'series' ? 'bg-blue-400 text-blue-400' : 
                          'bg-purple-400 text-purple-400'
                        }`} />
                        <div>
                          <span className="text-slate-300 text-sm">{a.text}</span>
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs font-medium bg-black/30 px-2 py-1 rounded-md">
                        {new Date(a.ts).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-center py-4">Henüz aktivite kaydı yok.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content (Series) Table */}
        {activeNav === 'content' && (
          <div className="glass border border-white/8 rounded-2xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
            <div className="p-5 border-b border-white/8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-black/20">
              <h3 className="text-white font-bold text-lg">Seri Envanteri</h3>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="İsim veya yazar ile ara..." value={searchSeries} onChange={(e) => setSearchSeries(e.target.value)} className="bg-[#0a0a14] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all w-full sm:w-64" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40">
                    <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">Seri Detayı</th>
                    <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">İstatistikler</th>
                    <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">Durum</th>
                    <th className="text-right text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredSeries?.map((s) => (
                      <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`border-b border-white/5 transition-colors ${s.isTrending ? 'bg-orange-500/3 hover:bg-orange-500/5' : 'hover:bg-white/5'}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                             <div className="relative">
                               <img src={s.cover} className="w-12 h-16 rounded-lg object-cover shadow-lg border border-white/10" alt="" />
                               <div className="absolute -bottom-2 -right-2 bg-black/80 rounded border border-white/10 px-1 py-0.5 text-[9px] font-bold text-white">{s.chapters} Bölüm</div>
                             </div>
                             <div>
                               <p className="text-white font-black text-base">{s.title}</p>
                               <p className="text-slate-400 text-xs mt-0.5">{s.author} • {s.year || '2025'}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex flex-col gap-1.5">
                             <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                               <Star size={12} className="fill-amber-400" /> Puan: {s.rating}
                             </span>
                             <span className="flex items-center gap-1.5 text-xs text-blue-400 font-bold">
                               <Eye size={12} /> Okuma: {s.reads}
                             </span>
                           </div>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex flex-col gap-1.5">
                             <button
                               onClick={() => handleStatusToggle(s.id)}
                               title="Durumu değiştirmek için tıkla"
                               className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-black border transition-all hover:scale-[1.03] cursor-pointer w-fit ${s.status === 'Devam Ediyor' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]' : 'text-blue-400 border-blue-500/30 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)] hover:shadow-[0_0_18px_rgba(59,130,246,0.35)]'}`}
                             >
                               {s.status}
                             </button>
                             {s.isTrending && (
                               <span className="flex items-center gap-1 text-[9px] text-orange-400 font-black uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full w-fit">
                                 <Flame size={9} className="fill-orange-400" /> Trend
                               </span>
                             )}
                           </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {confirmDeleteSeries === s.id ? (
                              <>
                                <button onClick={() => setConfirmDeleteSeries(null)} className="p-2 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg transition-all"><X size={16}/></button>
                                <button onClick={() => { updateSeries(s.id, { isDeleted: true }); setConfirmDeleteSeries(null); showToast('Seri çöp kutusuna taşındı', 'error'); }} className="p-2 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all bg-red-500/10 border border-red-500/30 font-bold text-xs flex items-center gap-1">ONAYLA <Check size={14}/></button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleTrendToggle(s.id)}
                                  title={s.isTrending ? 'Trendlerden çıkar' : 'Trendlere taşı'}
                                  className={`p-2 rounded-lg transition-all border ${
                                    s.isTrending
                                      ? 'text-orange-400 bg-orange-500/20 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                                      : 'text-slate-500 border-transparent hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/10'
                                  }`}
                                >
                                  <Flame size={15} className={s.isTrending ? 'fill-orange-400' : ''} />
                                </button>
                                <button onClick={() => { setEditingSeries(s); setEditingSeriesTab('details'); }} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all border border-transparent hover:border-blue-500/30" title="Eseri Düzenle"><Edit3 size={16}/></button>
                                <button onClick={() => setConfirmDeleteSeries(s.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all border border-transparent hover:border-red-500/30" title="Sil"><Trash2 size={16}/></button>
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

        {/* Trash / Deleted Series */}
        {activeNav === 'trash' && (
          <div className="glass border border-white/8 rounded-2xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
            <div className="p-5 border-b border-white/8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-red-900/10">
              <h3 className="text-red-400 font-bold text-lg flex items-center gap-2"><Trash2 size={20}/> Çöp Kutusu</h3>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="Silinen seri bul..." value={searchSeries} onChange={(e) => setSearchSeries(e.target.value)} className="bg-[#0a0a14] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-all w-full sm:w-64" />
              </div>
            </div>
            {deletedSeries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/40">
                      <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">Seri Detayı</th>
                      <th className="text-right text-xs uppercase tracking-wider text-slate-400 font-bold px-5 py-4">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {deletedSeries?.map((s) => (
                        <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`border-b border-white/5 bg-red-900/5 hover:bg-white/5 transition-colors`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4">
                               <img src={s.cover} className="w-12 h-16 rounded-lg object-cover shadow-lg border border-red-500/20 grayscale opacity-80" alt="" />
                               <div>
                                 <p className="text-white font-black text-base line-through opacity-70">{s.title}</p>
                                 <p className="text-slate-500 text-xs mt-0.5">{s.author}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {confirmDeleteSeries === s.id ? (
                                <>
                                  <button onClick={() => setConfirmDeleteSeries(null)} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg">İptal</button>
                                  <button onClick={() => { deleteSeries(s.id); setConfirmDeleteSeries(null); showToast('Eser evrenden sonsuza dek silindi!', 'error'); }} className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg shadow-neon-red text-xs hover:bg-red-700">KALICI SİL</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { updateSeries(s.id, { isDeleted: false }); showToast('Seri Geri Yüklendi!', 'success'); }} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-bold transition-colors">GERİ YÜKLE</button>
                                  <button onClick={() => { setActiveNav('content'); setEditingSeries(s); setEditingSeriesTab('details'); }} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all" title="Kurtarmadan İncele/Düzenle"><Edit3 size={16}/></button>
                                  <button onClick={() => setConfirmDeleteSeries(s.id)} className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all" title="Kalıcı Olarak Sil!"><Trash2 size={16}/></button>
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
            ) : (
              <div className="p-10 text-center text-slate-500">Çöp kutusu tertemiz.</div>
            )}
          </div>
        )}

        {/* Chapter Editor */}
        {activeNav === 'chapterEditor' && (
          <ChapterEditor seriesList={series} showToast={showToast} />
        )}

        {/* Add Chapter */}
        {activeNav === 'add' && <AddChapterForm seriesList={series} showToast={showToast} sendNotification={sendNotification} />}

        {/* Announcements Management Tab */}
        {activeNav === 'announcements' && (() => {
          const [newAnn, setNewAnn] = useState('');
          const [annType, setAnnType] = useState('system');

          return (
            <div className="space-y-6">
              <div className="glass border border-white/8 rounded-2xl p-6 shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
                <h3 className="text-white font-black text-xl mb-4">Yeni Bildirim / Duyuru Yayınla</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <select 
                    value={annType} 
                    onChange={e => setAnnType(e.target.value)}
                    className="bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="system">Sistem Duyurusu</option>
                    <option value="important">Kritik Uyarı</option>
                    <option value="event">Etkinlik</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Duyuru metni yazın..." 
                    value={newAnn} 
                    onChange={e => setNewAnn(e.target.value)}
                    className="flex-1 bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button 
                    onClick={async () => {
                      if (!newAnn.trim()) return;
                      await addAnnouncement(newAnn, annType);
                      setNewAnn('');
                      showToast('Duyuru başarıyla evrene fısıldandı!', 'success');
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-xl text-sm shadow-neon-purple hover:scale-[1.02] transition-transform"
                  >
                    YAYINLA
                  </button>
                </div>
              </div>

              <div className="glass border border-white/8 rounded-2xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
                <div className="p-5 border-b border-white/8 bg-black/20">
                  <h3 className="text-white font-black text-lg">Eski Duyuruları Yönet</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/40">
                        <th className="text-left text-xs uppercase text-slate-400 font-bold px-5 py-4">Duyuru</th>
                        <th className="text-left text-xs uppercase text-slate-400 font-bold px-5 py-4">Tip</th>
                        <th className="text-left text-xs uppercase text-slate-400 font-bold px-5 py-4">Tarih</th>
                        <th className="text-right text-xs uppercase text-slate-400 font-bold px-5 py-4">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.map((a) => (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4 text-slate-200">{a.text}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                              a.type === 'chapter' ? 'bg-emerald-500/10 text-emerald-400' :
                              a.type === 'series' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-purple-500/10 text-purple-400'
                            }`}>{a.type}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">
                            {new Date(a.ts).toLocaleString('tr-TR')}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button 
                              onClick={async () => {
                                await deleteAnnouncement(a.id);
                                showToast('Duyuru tarihin tozlu sayfalarına gömüldü.', 'error');
                              }}
                              className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Enterprise Users Tab ── Primary User Management */}
        {activeNav === 'enterpriseUsers' && (() => {

          const filtered = registeredUsers.filter(u =>
            u.username?.toLowerCase().includes(searchEnterprise.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchEnterprise.toLowerCase())
          );
          return (
            <div className="space-y-4">
              <div className="glass border border-white/8 rounded-2xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
                <div className="p-5 border-b border-white/8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-black/20">
                  <div>
                    <h3 className="text-white font-black text-lg">Enterprise Kullanıcı Yönetimi</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{registeredUsers.length} kayıtlı kullanıcı</p>
                  </div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="İsim veya e-posta ara..." value={searchEnterprise} onChange={e => setSearchEnterprise(e.target.value)} className="bg-[#0a0a14] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all w-full sm:w-64" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/40">
                        {['Kullanıcı', 'E-posta', 'Sağlayıcı', 'Rol', 'Plan', 'Durum', 'Katılım', 'İşlem'].map(h => (
                          <th key={h} className="text-left text-xs uppercase tracking-wider text-slate-400 font-bold px-4 py-3.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filtered.map((u, i) => (
                          <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`border-b border-white/5 transition-colors ${u.status === 'Askıya Alındı' ? 'bg-red-500/3' : 'hover:bg-white/5'}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-inner flex-shrink-0 ${u.provider === 'google' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
                                  {u.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white font-bold text-sm">{u.username}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                            <td className="px-4 py-3">
                              {u.provider === 'google' ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full w-fit">
                                  <svg viewBox="0 0 24 24" className="w-3 h-3"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                  Google
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">E-posta</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {ADMIN_ROLES[u.role] ? (
                                <span className={`inline-flex px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest shadow-md ${ADMIN_ROLES[u.role].color}`}>{u.role}</span>
                              ) : (
                                <span className="text-slate-400 border border-slate-600/50 bg-slate-800/30 px-2 py-1 rounded-lg uppercase text-[9px] font-black tracking-widest">Kullanıcı</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {u.premium ? (
                                <span className="flex items-center gap-1 text-amber-500 text-xs font-bold drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"><Crown size={11} className="fill-amber-500" />Premium</span>
                              ) : (
                                <span className="text-slate-500 text-xs">Standart</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                                u.status === 'Aktif' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                                u.status === 'Askıya Alındı' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                                'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              }`}>{u.status}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{u.joinDate}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                {confirmDeleteEnterprise === u.id ? (
                                  <>
                                    <button onClick={() => setConfirmDeleteEnterprise(null)} className="p-1.5 text-slate-400 hover:bg-white/10 rounded-lg transition-all"><X size={14}/></button>
                                    <button onClick={() => { deleteRegisteredUser(u.id); setConfirmDeleteEnterprise(null); showToast('Kullanıcı silindi', 'error'); }} className="px-2 py-1 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] font-black flex items-center gap-1">SİL <Check size={12}/></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => setEditingEnterpriseUser({...u})} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all" title="Düzenle"><Edit3 size={14}/></button>
                                    <button
                                      onClick={() => { updateRegisteredUser(u.id, { status: u.status === 'Aktif' ? 'Askıya Alındı' : 'Aktif' }); showToast(u.status === 'Aktif' ? 'Hesap askıya alındı' : 'Hesap aktive edildi', u.status === 'Aktif' ? 'error' : 'success'); }}
                                      className={`p-1.5 rounded-lg transition-all ${u.status === 'Aktif' ? 'text-amber-400 hover:bg-amber-500/20' : 'text-emerald-400 hover:bg-emerald-500/20'}`}
                                      title={u.status === 'Aktif' ? 'Askıya Al' : 'Aktif Et'}
                                    >
                                      {u.status === 'Aktif' ? <Shield size={14}/> : <Check size={14}/>}
                                    </button>
                                    <button onClick={() => setConfirmDeleteEnterprise(u.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all" title="Sil"><Trash2 size={14}/></button>
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

              {/* Enterprise User Edit Modal */}
              <AnimatePresence>
                {editingEnterpriseUser && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg glass-strong border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.2)]">
                      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-5 px-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserCheck size={20} className="text-purple-400" />
                          <h3 className="text-xl font-black text-white">Kullanıcı Editörü</h3>
                        </div>
                        <button onClick={() => setEditingEnterpriseUser(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"><X size={20}/></button>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] text-purple-400 mb-1.5 font-black uppercase tracking-widest">Kullanıcı Adı</label>
                            <input type="text" value={editingEnterpriseUser.username} onChange={e => setEditingEnterpriseUser({...editingEnterpriseUser, username: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all" />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">E-posta</label>
                            <input type="email" value={editingEnterpriseUser.email} onChange={e => setEditingEnterpriseUser({...editingEnterpriseUser, email: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">Şifre (Değiştirmek İçin)</label>
                            <input type="text" placeholder="Yeni şifre girin..." onChange={e => setEditingEnterpriseUser({...editingEnterpriseUser, password: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-all" />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">Sistem Rolü</label>
                            <select value={editingEnterpriseUser.role} onChange={e => setEditingEnterpriseUser({...editingEnterpriseUser, role: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer">
                              <option value="Kullanıcı" className="bg-[#0a0a14]">Kullanıcı</option>
                            <option value="Admin Yardımcısı" className="bg-[#0a0a14]">Admin Yardımcısı</option>
                            <option value="Admin" className="bg-[#0a0a14]">Admin</option>
                            <option value="Baş Admin Yardımcısı" className="bg-[#0a0a14]">Baş Admin Yardımcısı</option>
                            <option value="Baş Admin" className="bg-[#0a0a14]">Baş Admin</option>
                            <option value="Yönetici" className="bg-[#0a0a14]">Yönetici</option>
                          </select>
                        </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-wider">Hesap Durumu</label>
                            <select value={editingEnterpriseUser.status} onChange={e => setEditingEnterpriseUser({...editingEnterpriseUser, status: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer">
                              <option value="Aktif">Aktif</option>
                              <option value="Askıya Alındı">Askıya Alındı</option>
                              <option value="Pasif">Pasif</option>
                            </select>
                          </div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <label className="block text-[10px] text-amber-500 mb-2 font-bold uppercase tracking-wider">Premium İzni</label>
                            <div className="flex items-center gap-2 mt-1 cursor-pointer" onClick={() => setEditingEnterpriseUser({...editingEnterpriseUser, premium: !editingEnterpriseUser.premium})}>
                              <div className={`w-10 h-5 rounded-full relative transition-colors ${editingEnterpriseUser.premium ? 'bg-amber-500' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${editingEnterpriseUser.premium ? 'translate-x-5' : ''}`} />
                              </div>
                              <span className="text-xs font-bold text-white">{editingEnterpriseUser.premium ? 'Premium' : 'Standart'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                        <button onClick={() => setEditingEnterpriseUser(null)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-sm transition-colors">İptal</button>
                        <button onClick={() => { updateRegisteredUser(editingEnterpriseUser.id, editingEnterpriseUser); setEditingEnterpriseUser(null); showToast('Kullanıcı güncellendi!', 'success'); }} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-black text-sm shadow-neon-purple hover:scale-[1.02] transition-transform flex items-center gap-2"><Save size={16}/> Kaydet</button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {/* Settings Tab */}
        {activeNav === 'settings' && (
          <div className="glass border border-white/8 rounded-2xl p-6 sm:p-8 max-w-2xl space-y-8 shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
            <div>
              <h3 className="text-white font-black text-2xl tracking-tight mb-2">Kainat Ayarları</h3>
              <p className="text-slate-400 text-sm">Sistemin genel işleyişini, bakım modunu ve platform izinlerini yönetin.</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-4 rounded-2xl group border border-transparent hover:border-white/10">
                <div className="max-w-[70%]">
                  <p className="text-white text-base font-bold flex items-center gap-2">
                     <ShieldAlert size={16} className={maintenanceMode ? "text-red-500 animate-pulse" : "text-slate-500"}/> 
                     Acil Bakım Modu
                  </p>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">Sistem dışarıdan erişime tamamen kapanır. Sadece yetkililer giriş yapıp sistemi görmeye devam edebilir.</p>
                </div>
                <label className="relative cursor-pointer">
                  <input type="checkbox" checked={settingPrefs.tempMaintenance} onChange={(e) => setSettingPrefs({...settingPrefs, tempMaintenance: e.target.checked})} className="sr-only peer" />
                  <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:bg-red-600 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-7 after:shadow-sm" />
                </label>
              </div>

              {[
                { key: 'newRegisters', label: 'Yeni Kayıt Alımı', desc: 'Sisteme dışarıdan yeni "Ruh" (Kullanıcı) kayıt olabilmesine izin verir.' },
                { key: 'premiumFeatures', label: 'Premium Kilitleri Aktif', desc: 'Premium özellikleri barındıran bölümlerin kilitli kalmasını sağlar. Kapanırsa tüm bölümler okunabilir olur.' },
                { key: 'emailNotifs', label: 'Evrensel Bildirimler (E-posta)', desc: 'Yeni bölüm yayınlarında tüm sisteme aktif e-posta sirkülasyonu gönderir.' },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-4 rounded-2xl group border border-transparent hover:border-white/10">
                  <div className="max-w-[70%]">
                    <p className="text-white text-base font-bold">{s.label}</p>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                  <label className="relative cursor-pointer">
                    <input type="checkbox" checked={settingPrefs[s.key]} onChange={(e) => setSettingPrefs({...settingPrefs, [s.key]: e.target.checked})} className="sr-only peer" />
                    <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:bg-purple-600 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-7 after:shadow-sm" />
                  </label>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button 
                onClick={handleSaveSettings} 
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-sm shadow-neon-purple hover:scale-[1.02] transition-transform flex justify-center items-center gap-2"
              >
                <Save size={18} /> AYARLARI ZİHNİYETE KAZI
              </button>
            </div>
          </div>
        )}

      </motion.main>

      {/* ── İLERİ DÜZEY MODALS ── */}
      <AnimatePresence>
        {editingSeries && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-2xl glass-strong border border-white/10 rounded-3xl p-0 relative shadow-[0_0_80px_rgba(168,85,247,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
              
               <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-5 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                     <Edit3 size={20} className="text-purple-400" />
                     <h3 className="text-xl font-black text-white tracking-tight">Kozmik Eser Düzenleme Modülü</h3>
                  </div>
                  <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                     <button onClick={() => setEditingSeriesTab('details')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${editingSeriesTab === 'details' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Genel Ayarlar</button>
                     <button onClick={() => setEditingSeriesTab('chapters')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${editingSeriesTab === 'chapters' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Bölüm & URL Yöneticisi</button>
                  </div>
                  <button onClick={() => setEditingSeries(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
               </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                 {editingSeriesTab === 'details' ? (
                   <>
                     {/* Top Image Preview & Title Row */}
                     <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-shrink-0 group overflow-hidden rounded-2xl relative w-32 h-44 sm:w-40 sm:h-56 shadow-2xl border border-white/10 cursor-pointer">
                           <img src={editingSeries.cover} alt="Kapak" className="w-full h-full object-cover group-hover:blur-sm transition-all" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                              <ImageIcon size={24} className="mb-2" />
                              <span className="text-xs font-bold font-white">Kapağı Değiştir</span>
                           </div>
                        </div>
                        <div className="flex-1 space-y-4">
                           <div>
                             <label className="block text-[11px] text-purple-400 mb-1.5 font-black uppercase tracking-widest">Eser Başlığı</label>
                             <input type="text" value={editingSeries.title} onChange={e => setEditingSeries({...editingSeries, title: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-base font-bold text-white focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Yazar/Çizer</label>
                                <input type="text" value={editingSeries.author} onChange={e => setEditingSeries({...editingSeries, author: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Çıkış Yılı</label>
                                <input type="text" value={editingSeries.year} onChange={e => setEditingSeries({...editingSeries, year: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Description */}
                     <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Kozmik Özet (Açıklama)</label>
                        <textarea value={editingSeries.description} onChange={e => setEditingSeries({...editingSeries, description: e.target.value})} rows={4} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all resize-none leading-relaxed" />
                     </div>

                     {/* Stats Controls */}
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Puan Değerlemesi</label>
                          <input type="number" step="0.1" max="10" min="0" value={editingSeries.rating} onChange={e => setEditingSeries({...editingSeries, rating: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:border-amber-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Okunma manipülesi</label>
                          <input type="number" value={editingSeries.readsNum} onChange={e => setEditingSeries({...editingSeries, readsNum: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-blue-400 font-bold focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Toplam Bölüm</label>
                          <input type="number" value={editingSeries.chapters} onChange={e => setEditingSeries({...editingSeries, chapters: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:border-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Yayın Durumu</label>
                          <select value={editingSeries.status} onChange={e => setEditingSeries({...editingSeries, status: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-purple-500 outline-none cursor-pointer">
                            <option value="Devam Ediyor">Devam Ediyor</option>
                            <option value="Tamamlandı">Tamamlandı</option>
                          </select>
                        </div>
                     </div>
                   </>
                 ) : (
                   <div className="space-y-4">
                     <p className="text-slate-400 text-sm mb-4">Bu seriye ait bölümleri ve fotoğraf sağlayan URL linklerini anlık olarak güncelleyebilirsiniz.</p>
                     
                     <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                       {editingSeries.chapterList && editingSeries.chapterList.map((ch, idx) => (
                         <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 relative group">
                           <button onClick={() => {
                             const newList = editingSeries.chapterList.filter((_, i) => i !== idx);
                             setEditingSeries({...editingSeries, chapterList: newList});
                           }} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                           
                           <div className="grid grid-cols-3 gap-4 mb-3">
                              <div className="col-span-1">
                                <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">Bölüm No</label>
                                <input type="number" value={ch.num} onChange={e => {
                                  const newList = [...editingSeries.chapterList];
                                  newList[idx].num = e.target.value;
                                  setEditingSeries({...editingSeries, chapterList: newList});
                                }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-emerald-400 outline-none" />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">Başlık (Opsiyonel)</label>
                                <input type="text" value={ch.title} onChange={e => {
                                  const newList = [...editingSeries.chapterList];
                                  newList[idx].title = e.target.value;
                                  setEditingSeries({...editingSeries, chapterList: newList});
                                }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none" />
                              </div>
                           </div>
                           
                           <div>
                              <label className="block text-[10px] text-purple-400 mb-1 font-bold uppercase tracking-wider">Görsel URL Kaynakları (Satır satır)</label>
                              <textarea value={ch.urls} onChange={e => {
                                const newList = [...editingSeries.chapterList];
                                newList[idx].urls = e.target.value;
                                setEditingSeries({...editingSeries, chapterList: newList});
                              }} rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono outline-none focus:border-purple-500 resize-y" />
                           </div>
                         </div>
                       ))}
                     </div>
                     <button onClick={() => {
                       const newList = [...(editingSeries.chapterList || []), { num: (editingSeries.chapterList?.length || 0) + 1, title: '', urls: '' }];
                       setEditingSeries({...editingSeries, chapterList: newList});
                     }} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/50 hover:bg-white/5 font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-2">
                        <PlusCircle size={16} /> Yeni Bölüm URL Kaydı
                     </button>
                   </div>
                 )}
              </div>
              
              <div className="p-5 border-t border-white/10 bg-[#0a0a14] shrink-0 flex items-center justify-end gap-3 z-10">
                 <button type="button" onClick={() => setEditingSeries(null)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">İptal</button>
                 <button onClick={handleSaveSeries} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 shadow-neon-purple text-white rounded-xl text-sm font-black tracking-wide flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform">
                    <Save size={18} /> DEĞİŞİKLİKLERİ EVRENE YAZ
                 </button>
              </div>

            </motion.div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-lg glass-strong border border-white/10 rounded-3xl p-0 relative shadow-[0_0_80px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col">
              
              <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-5 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                     <Users size={20} className="text-cyan-400" />
                     <h3 className="text-xl font-black text-white tracking-tight">Kullanıcı (Ruh) Modülü</h3>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
               </div>

              <div className="p-6 space-y-6">
                
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                   <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-2xl shadow-inner border border-white/10">
                      {editingUser.name.charAt(0)}
                   </div>
                   <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-cyan-400 mb-1.5 font-black uppercase tracking-widest">Kullanıcı / Mahlas</label>
                        <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-transparent border-b border-white/20 px-0 py-1 text-xl font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">E-posta</label>
                        <input type="email" value={editingUser.email?.[0] || ''} onChange={e => setEditingUser({...editingUser, email: [e.target.value]})} className="w-full bg-transparent border-b border-white/20 px-0 py-1 text-base font-medium text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors" />
                      </div>
                   </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Şifre Değiştir</label>
                    <input type="text" placeholder="Yeni şifre belirle..." onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Yetki Hiyerarşisi (Sistem Rolü)</label>
                    <select 
                       value={editingUser.role} 
                       onChange={e => setEditingUser({...editingUser, role: e.target.value})} 
                       className={`w-full border rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider outline-none cursor-pointer transition-all ${ADMIN_ROLES[editingUser.role] ? ADMIN_ROLES[editingUser.role].color : 'bg-[#0a0a14] border-white/20 text-slate-300'}`}
                    >
                      <option value="Kullanıcı" className="bg-[#0a0a14] text-slate-300">Kullanıcı (Sıradan Yetki)</option>
                      <option value="Admin Yardımcısı" className="bg-[#0a0a14] text-amber-500">Admin Yardımcısı</option>
                      <option value="Admin" className="bg-[#0a0a14] text-emerald-500">Admin</option>
                      <option value="Baş Admin Yardımcısı" className="bg-[#0a0a14] text-blue-500">Baş Admin Yardımcısı</option>
                      <option value="Baş Admin" className="bg-[#0a0a14] text-purple-500">Baş Admin</option>
                      <option value="Yönetici" className="bg-[#0a0a14] text-red-500">SİSTEM YÖNETİCİSİ (MUTLAK GÜÇ)</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                     <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                       <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-wider">Hesap Durumu</label>
                       <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer">
                         <option value="Aktif" className="text-emerald-400">Aktif Edilmiş</option>
                         <option value="Pasif" className="text-red-400">Pasif / Uzaklaştırılmış</option>
                       </select>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                       <label className="block text-[10px] text-amber-500 mb-2 font-bold uppercase tracking-wider drop-shadow-md">Premium İzinleri</label>
                       <div className="flex items-center gap-2 mt-1 relative cursor-pointer group" onClick={() => setEditingUser({...editingUser, premium: !editingUser.premium})}>
                         <div className={`w-10 h-5 rounded-full transition-colors relative ${editingUser.premium ? 'bg-amber-500' : 'bg-white/10'}`}>
                           <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${editingUser.premium ? 'translate-x-5' : ''}`} />
                         </div>
                         <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">VIP Zorla</span>
                       </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-[11px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider flex items-center gap-2"><BookOpen size={14}/> Okuma Geçmişi (Manipülasyon)</label>
                     <div className="flex items-center gap-3">
                        <input type="number" value={editingUser.reads} onChange={e => setEditingUser({...editingUser, reads: e.target.value})} className="flex-1 bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white focus:outline-none focus:border-cyan-500" />
                        <span className="text-slate-500 text-sm font-bold uppercase">BÖLÜM OKUMUŞ</span>
                     </div>
                  </div>

                </div>

              </div>

              <div className="p-5 border-t border-white/10 bg-black/40 shrink-0 flex items-center justify-end gap-3">
                 <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">İptal Et</button>
                 <button onClick={handleSaveUser} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white rounded-xl text-sm font-black tracking-widest flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform">
                    RUHU ŞEKİLLENDİR
                 </button>
              </div>

            </motion.div>
          </div>
        )}

        {toast && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-4 rounded-2xl glass-strong border shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-sm font-black tracking-wide ${toast.type === 'error' ? 'border-red-500/50 text-red-400 bg-red-950/80 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-emerald-500/50 text-emerald-400 bg-emerald-950/80 shadow-[0_0_30px_rgba(16,185,129,0.2)]'}`}>
            <Check size={18} /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
