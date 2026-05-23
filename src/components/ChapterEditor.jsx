import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, rectSortingStrategy,
  sortableKeyboardCoordinates, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Upload, GripVertical, Trash2, Eye, X, Plus,
  FileImage, Save, Layers, ImageIcon, Check, RotateCcw, Monitor, Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

// ── Unique ID generator
let _uid = 0;
const uid = () => `pg-${++_uid}-${Math.random().toString(36).slice(2, 7)}`;

// ImgBB Key Pool (Mühürlendi!)
const IMGBB_KEYS = [
  "f86ef28239e9e9c876182dcbab114489",
  "61aac4bb998738d36994eb94bec61b3d",
  "c8aa007b2512bd5b4a97925acf9212a8"
];
let currentKeyIndex = 0;

const uploadToImgBB = async (base64Image) => {
  let attempts = 0;
  console.log(`[ImgBB-Editor] Başlatıldı, Havuz: ${IMGBB_KEYS.length}`);
  
  while (attempts < IMGBB_KEYS.length) {
    const key = IMGBB_KEYS[currentKeyIndex];
    try {
      const formData = new FormData();
      const base64Content = base64Image.split(',')[1];
      formData.append('image', base64Content);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(`[ImgBB-Editor-OK] Anahtar ${currentKeyIndex + 1} başarılı.`);
        return result.data.url;
      }
      
      console.warn(`[ImgBB-Editor-HATA] Anahtar ${currentKeyIndex + 1} reddetti:`, result.error?.message);
      currentKeyIndex = (currentKeyIndex + 1) % IMGBB_KEYS.length;
      attempts++;
    } catch (err) {
      console.error(`[ImgBB-Editor-KRİTİK] Anahtar ${currentKeyIndex + 1} ağ hatası:`, err.message);
      currentKeyIndex = (currentKeyIndex + 1) % IMGBB_KEYS.length;
      attempts++;
    }
  }
  throw new Error('Tüm API anahtarları tükendi! Detaylar için F12 (Konsol) açın.');
};

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

// ──────────────────────────────────────────
//  Sortable Page Card
// ──────────────────────────────────────────
function SortablePage({ page, index, onDelete, onReplace }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });
  const fileRef = useRef();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition || 'transform 200ms cubic-bezier(0.2,0,0,1)',
    opacity: isDragging ? 0 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className={`rounded-xl overflow-hidden border bg-black/60 shadow-lg transition-all duration-200 ${
          isDragging
            ? 'border-purple-500/50'
            : 'border-white/8 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-900/20'
        }`}
      >
        {/* Top bar: drag handle + page number */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-black/50 border-b border-white/5">
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded text-slate-400 hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors touch-none"
            title="Sürükle"
          >
            <GripVertical size={13} />
          </button>
          <span className="text-[10px] font-black text-purple-400 bg-purple-600/20 border border-purple-500/20 px-2 py-0.5 rounded-full">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Thumbnail */}
        <div className="aspect-[3/4] w-full overflow-hidden bg-slate-900 border-b border-black/40 relative">
          {page.url ? (
            <img
              src={page.url}
              alt={`Sayfa ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
              <ImageIcon size={18} />
              <span className="text-[9px]">Görsel yok</span>
            </div>
          )}

          {/* Hover overlay actions */}
          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              title="Görseli Değiştir"
              className="p-2 rounded-lg bg-blue-600/85 text-white hover:bg-blue-500 transition-colors shadow-lg"
            >
              <ImageIcon size={13} />
            </button>
            <button
              onClick={() => onDelete(page.id)}
              title="Sayfayı Sil"
              className="p-2 rounded-lg bg-red-600/85 text-white hover:bg-red-500 transition-colors shadow-lg"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Filename */}
        <div className="px-2 py-1.5 bg-black/80">
          <span className="text-[10px] text-slate-400 font-mono tracking-wider leading-none block truncate text-center">
            {page.name
              ? page.name.length > 20 ? page.name.slice(0, 18) + '...' : page.name
              : `sayfa_${String(index + 1).padStart(2, '0')}.jpg`}
          </span>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) onReplace(page.id, f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────
//  Webtoon Preview Modal
// ──────────────────────────────────────────
function PreviewModal({ pages, series, chapterNum, onClose }) {
  return (
    <div className="fixed inset-0 z-[300] bg-[#050507] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-black/85 backdrop-blur-xl border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-neon-purple">
            <Eye size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">
              {series?.title || 'Seri Adı'}
            </p>
            <p className="text-purple-400 text-[11px] mt-0.5">
              Bölüm {chapterNum || '?'} • Okuyucu Gözüyle Webtoon Önizleme
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Monitor size={12} className="text-slate-500" />
            <span className="text-slate-400 text-xs font-bold">{pages.length} Sayfa</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable webtoon strip */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {pages.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Layers size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Önizlenecek sayfa yok</p>
              </div>
            </div>
          ) : (
            pages.map((page, i) => (
              <div key={page.id} className="relative w-full">
                {page.url ? (
                  <img
                    src={page.url}
                    alt={`Sayfa ${i + 1}`}
                    className="w-full block select-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-72 bg-slate-900/50 border border-white/5 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <ImageIcon size={28} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Sayfa görseli yok</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2 text-[10px] text-white/25 bg-black/60 backdrop-blur-sm px-2 py-1 rounded font-mono">
                  {i + 1} / {pages.length}
                </div>
              </div>
            ))
          )}

          {/* End of chapter */}
          <div className="py-16 flex flex-col items-center gap-3 border-t border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-neon-purple">
              <Check size={26} className="text-white" />
            </div>
            <p className="text-slate-300 font-black text-sm">Bölüm Sonu</p>
            <p className="text-slate-400 text-xs">Önizleme tamamlandı</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
//  Main ChapterEditor Export
// ──────────────────────────────────────────
export default function ChapterEditor({ seriesList = [], showToast = () => {} }) {
  const { getChapters, addChapter, updateChapter, deleteChapter } = useApp();
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [chapterMode, setChapterMode]           = useState('new');
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterNum, setChapterNum]             = useState('');
  const [chapterTitle, setChapterTitle]         = useState('');
  const [isPremium, setIsPremium]               = useState(false);
  const [pages, setPages]                       = useState([]);
  const [isDraggingFiles, setIsDraggingFiles]   = useState(false);
  const [activeId, setActiveId]                 = useState(null);
  const [previewOpen, setPreviewOpen]           = useState(false);
  const [showUrlInput, setShowUrlInput]         = useState(false);
  const [urlInput, setUrlInput]                 = useState('');
  const [saved, setSaved]                       = useState(false);
  const fileInputRef = useRef();

  const selectedSeries = seriesList.find(s => s.id === Number(selectedSeriesId));
  const existingChapters = selectedSeriesId ? getChapters(Number(selectedSeriesId)) : [];

  const handleLoadChapter = (ch) => {
    setChapterMode('edit');
    setEditingChapterId(ch.id);
    setChapterNum(ch.number);
    setChapterTitle(ch.title || '');
    setIsPremium(ch.is_premium || false);
    setPages((ch.pages || []).map((url, i) => ({ id: uid(), name: `page_${i+1}.jpg`, url, isFile: false })));
    showToast(`Bölüm ${ch.number} düzenlenmek üzere yüklendi.`, 'info');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const processFiles = useCallback(async (files) => {
    const imageFiles = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

    if (!imageFiles.length) {
      showToast('Geçerli görsel dosyası bulunamadı!', 'error');
      return;
    }

    try {
      showToast(`${imageFiles.length} görsel buluta yükleniyor...`, 'info');
      
      const uploadedPages = await Promise.all(imageFiles.map(async (file) => {
        const compressed = await compressImage(file);
        const url = await uploadToImgBB(compressed);
        return {
          id: uid(),
          name: file.name,
          url: url,
          isFile: true,
        };
      }));

      setPages(prev => [...prev, ...uploadedPages]);
      showToast(`✅ ${imageFiles.length} sayfa başarıyla buluta yüklendi!`, 'success');
    } catch (err) {
      console.error("Bulut yükleme hatası:", err);
      showToast('Görseller buluta aktarılamadı. Lütfen API anahtarını kontrol edin.', 'error');
    }
  }, [showToast]);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDraggingFiles(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingFiles(false);
  }, []);

  const handleDragStart  = ({ active }) => setActiveId(active.id);
  const handleDragCancel = () => setActiveId(null);
  const handleDragEnd    = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setPages(prev => {
      const oi = prev.findIndex(p => p.id === active.id);
      const ni = prev.findIndex(p => p.id === over.id);
      return arrayMove(prev, oi, ni);
    });
  };

  const handleDeletePage  = useCallback((id) => setPages(prev => prev.filter(p => p.id !== id)), []);
  const handleReplacePage = useCallback(async (id, file) => {
    try {
      showToast('Görsel buluta yükleniyor...', 'info');
      const compressed = await compressImage(file);
      const url = await uploadToImgBB(compressed);
      setPages(prev => prev.map(p => p.id === id ? { ...p, url, name: file.name } : p));
      showToast('Sayfa başarıyla buluta yüklendi.', 'success');
    } catch (err) {
      showToast('Bulut yükleme hatası!', 'error');
    }
  }, [showToast]);

  const handleAddUrls = () => {
    const lines = urlInput.split('\n').map(u => u.trim()).filter(Boolean);
    if (!lines.length) return;
    const newPages = lines.map(u => ({
      id: uid(),
      name: u.split('/').pop() || 'sayfa.jpg',
      url: u,
      isFile: false,
    }));
    setPages(prev => [...prev, ...newPages]);
    setUrlInput('');
    setShowUrlInput(false);
    showToast(`${lines.length} URL sayfası eklendi!`, 'success');
  };

  const handlePublish = async () => {
    if (!selectedSeriesId) { showToast('Lütfen bir seri seçin!', 'error'); return; }
    if (!chapterNum)        { showToast('Bölüm numarası gerekli!', 'error'); return; }
    if (!pages.length)      { showToast('En az bir sayfa ekleyin!', 'error'); return; }
    
    const pagesUrls = pages.map(p => p.url);
    try {
      if (chapterMode === 'edit' && editingChapterId) {
        await updateChapter(editingChapterId, {
          number: Number(chapterNum),
          title: chapterTitle,
          pages: pagesUrls,
          is_premium: isPremium
        });
        showToast(`✨ Bölüm ${chapterNum} güncellendi! (${pages.length} sayfa)`, 'success');
      } else {
        await addChapter(Number(selectedSeriesId), {
          number: Number(chapterNum),
          title: chapterTitle,
          pages: pagesUrls,
          isPremium
        });
        showToast(`🚀 Bölüm ${chapterNum} başarıyla yayınlandı! (${pages.length} sayfa)`, 'success');
      }
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setChapterMode('new');
        setEditingChapterId(null);
        setChapterNum('');
        setChapterTitle('');
        setPages([]);
        setIsPremium(false);
      }, 2000);
    } catch (err) {
      showToast('Hatayı kaydetme hatası!', 'error');
    }
  };

  const activePageData = activeId ? pages.find(p => p.id === activeId) : null;

  return (
    <div className="space-y-5 max-w-full p-4 sm:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Bölüm Editörü</h2>
          <p className="text-slate-500 text-sm mt-1">
            Toplu yükleme · Sürükle-bırak sıralama · Webtoon önizleme
          </p>
        </div>
        {pages.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <FileImage size={12} />
            {pages.length} Sayfa Yüklü
          </div>
        )}
      </div>

      <div className="glass border border-white/8 rounded-2xl p-5">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">
          Bölüm Tanımı
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] text-purple-400 mb-1.5 font-black uppercase tracking-widest">
              Seri *
            </label>
            <select
              value={selectedSeriesId}
              onChange={e => setSelectedSeriesId(e.target.value)}
              className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all cursor-pointer"
            >
              <option value="">— Seri Seçin —</option>
              {seriesList.map(s => (
                <option key={s.id} value={s.id} className="bg-[#0a0a14]">
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">
              Bölüm No *
            </label>
            <input
              type="text"
              value={chapterNum}
              onChange={e => setChapterNum(e.target.value)}
              placeholder="188, Özel, vb."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">
              Bölüm Başlığı
            </label>
            <input
              type="text"
              value={chapterTitle}
              onChange={e => setChapterTitle(e.target.value)}
              placeholder="İsteğe bağlı..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

      </div>

      <AnimatePresence>
        {selectedSeriesId && existingChapters.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass border border-white/8 rounded-2xl p-5 overflow-hidden">
             <div className="flex items-center justify-between mb-3">
               <h3 className="text-[11px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Mevcut Bölümler (Yönetim)</h3>
               <button onClick={() => { setChapterMode('new'); setPages([]); setChapterNum(''); setChapterTitle(''); setIsPremium(false); setEditingChapterId(null); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chapterMode==='new'?'bg-blue-600 text-white':'bg-white/5 text-slate-400 hover:bg-white/10'}`}><Plus size={12} className="inline mr-1" />Yeni Ekle</button>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[340px] overflow-y-auto custom-scrollbar p-1">
               {existingChapters.map(ch => (
                 <div key={ch.id} className={`flex flex-col p-3 rounded-xl border transition-all ${editingChapterId === ch.id ? 'bg-blue-600/30 border-blue-500/50 shadow-neon-blue scale-105' : 'bg-black/60 border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                    <div className="flex items-center justify-between">
                       <button onClick={() => handleLoadChapter(ch)} className="text-left text-sm text-white font-black flex-1 truncate pr-2">
                         Bölüm {ch.number}
                       </button>
                       <button onClick={() => { if(window.confirm('Bu bölümü kalıcı olarak silmek istiyor musunuz?')){ deleteChapter(ch.id); setPages([]); setChapterMode('new'); showToast('Bölüm silindi', 'error');} }} className="text-red-400 hover:text-white p-1.5 bg-red-500/10 hover:bg-red-600 rounded-lg transition-colors shadow-lg"><Trash2 size={14} /></button>
                    </div>
                    {ch.pages && ch.pages.length > 0 ? (
                       <div className="text-[10px] text-green-400/80 mt-1.5 font-bold tracking-wider">{ch.pages.length} Sayfa Yüklü</div>
                    ) : (
                       <div className="text-[10px] text-red-400/60 mt-1.5 font-bold tracking-wider">İçerik Yok</div>
                    )}
                 </div>
               ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 select-none overflow-hidden ${
          isDraggingFiles
            ? 'border-purple-500 bg-purple-500/8 shadow-[0_0_50px_rgba(168,85,247,0.2)]'
            : 'border-white/10 hover:border-purple-500/40 hover:bg-purple-500/3 group'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => { processFiles(e.target.files); e.target.value = ''; }}
        />

        <div className="flex flex-col items-center gap-4 relative z-10 pointer-events-none">
          <motion.div
            animate={{
              scale: isDraggingFiles ? 1.2 : 1,
              rotate: isDraggingFiles ? 8 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
              isDraggingFiles
                ? 'bg-purple-600 shadow-neon-purple'
                : 'bg-white/5 border border-white/10'
            }`}
          >
            <Upload
              size={30}
              className={isDraggingFiles ? 'text-white' : 'text-slate-500'}
            />
          </motion.div>

          <div>
            <p
              className={`text-lg font-black transition-colors ${
                isDraggingFiles ? 'text-purple-200' : 'text-slate-300'
              }`}
            >
              {isDraggingFiles
                ? '⚡ Bırak! Sayfaları Alıyorum...'
                : 'JPG / PNG Sayfalarını Buraya Sürükle & Bırak'}
            </p>
            <p className="text-slate-400 text-sm mt-1.5">
              veya tıkla ve seç &nbsp;•&nbsp; Dosya ismine göre otomatik sıralanır (01, 02, 03...)
            </p>
          </div>

          {pages.length > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-bold"
            >
              <FileImage size={14} />
              {pages.length} sayfa mevcut
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {pages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap items-center gap-2"
          >
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-300 font-bold text-sm hover:bg-blue-600/25 hover:border-blue-500/40 transition-all"
            >
              <Eye size={15} /> Okuyucu Gözüyle Ön İzle
            </button>
            <button
              onClick={() => setShowUrlInput(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/8 transition-all"
            >
              <Plus size={15} /> URL ile Sayfa Ekle
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onClick={() => { setPages([]); showToast('Tüm sayfalar temizlendi', 'error'); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400/70 font-bold text-sm hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <RotateCcw size={13} /> Sıfırla
            </button>
            <div className="flex-1" />
            <button
              onClick={handlePublish}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg ${
                saved
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-neon-purple hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'
              }`}
            >
              {saved
                ? <><Check size={15} /> Yayınlandı!</>
                : <><Save size={15} /> Bölümü Yayınla</>
              }
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass border border-white/10 rounded-2xl p-5 mt-1">
              <label className="block text-[11px] text-purple-400 mb-2 font-black uppercase tracking-widest">
                URL Listesi (Her Satıra Bir URL)
              </label>
              <textarea
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                rows={4}
                placeholder={`https://cdn.anipeak.com/series/1/ch188/01.jpg\nhttps://cdn.anipeak.com/series/1/ch188/02.jpg`}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all resize-none font-mono"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleAddUrls}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm hover:scale-[1.02] transition-transform shadow-neon-purple"
                >
                  Ekle
                </button>
                <button
                  onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                  className="px-5 py-2 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {pages.length > 0 && (
        <div className="glass border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h3 className="text-white font-black text-sm">Sayfa Sıralama Editörü</h3>
            <span className="text-[10px] text-slate-400 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
              {pages.length} Sayfa
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-purple-400/60 ml-1">
              <GripVertical size={11} />
              Sürükle & bırak ile sıralamayı değiştir
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}
              >
                {pages.map((page, index) => (
                  <SortablePage
                    key={page.id}
                    page={page}
                    index={index}
                    onDelete={handleDeletePage}
                    onReplace={handleReplacePage}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activePageData && (
                <div className="w-24 rounded-xl overflow-hidden border-2 border-purple-500 shadow-2xl shadow-purple-900/70 rotate-2 scale-110">
                  <div className="h-1.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                  {activePageData.url ? (
                    <img
                      src={activePageData.url}
                      alt="sürükleniyor"
                      className="w-full aspect-[3/4] object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-slate-800 flex items-center justify-center text-slate-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {pages.length === 0 && (
        <div className="text-center py-6 text-slate-400">
          <Layers size={34} className="mx-auto mb-3 opacity-25" />
          <p className="text-sm">Sayfaları yüklemek için yukarıdaki alana sürükle veya tıkla</p>
        </div>
      )}

      <AnimatePresence>
        {previewOpen && (
          <motion.div
            className="fixed inset-0 z-[300]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PreviewModal
              pages={pages}
              series={selectedSeries}
              chapterNum={chapterNum}
              onClose={() => setPreviewOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
