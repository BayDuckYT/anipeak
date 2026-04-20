import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { 
  BookOpen, Settings, Crown, LayoutDashboard, History, 
  Bell, ChevronRight, Play, Camera, Image as ImageIcon,
  Check, Upload, Sparkles, X, Minus, Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { uploadAvatar } from '../lib/imageService';

// Profil Kırpma Yardımcısı
const getCroppedImg = async (imageSrc, pixelCrop) => {
  console.log("🎨 [KIRPMA] İşlem hazırlığı başladı...");
  
  const image = new Image();
  image.setAttribute('crossOrigin', 'anonymous'); // CORS desteği
  image.src = imageSrc;

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => {
        console.error("❌ [KIRPMA] Resim yüklenemedi!");
        reject(new Error('Resim yüklenemedi.'));
      };
    });

    console.log("📏 [KIRPMA] Resim boyutu:", image.width, "x", image.height);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context oluşturulamadı.');
    }

    canvas.width = 512;
    canvas.height = 512;

    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, 512, 512
    );

    console.log("🧪 [KIRPMA] Blob oluşturuluyor...");
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        console.log("✅ [KIRPMA] Blob hazır.");
        resolve(blob);
      }, 'image/webp', 0.8);
    });
  } catch (err) {
    console.error("❌ [KIRPMA] Kritik Hata:", err);
    throw err;
  }
};

export default function ProfilePage() {
  const { user, readingHistory, updateProfile } = useAuth();
  const { series } = useApp();
  const [activeTab, setActiveTab] = useState('history');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const avatarLetter = user?.username?.charAt(0)?.toUpperCase() || 'U';

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    console.log("📁 [DOSYA] Resim seçildi: ", file);
    if (!file) {
      console.warn("Siber Hata: Dosya seçilmedi veya iptal edildi.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      console.log("📥 [SİSTEM] Görsel önizleme hazırlandı.");
      setImageSrc(reader.result);
    });
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    e.target.value = null;
  };

  const handleSave = async () => {
    console.log("💾 [KAYDET] İşlem başlatıldı...");
    if (!imageSrc || !croppedAreaPixels) {
      console.warn("⚠️ [HATA] Görsel kaynağı veya kırpma verisi eksik!");
      return;
    }

    setUploading(true);
    try {
      console.log("✂️ [KIRPMA] Görsel işleniyor...");
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      console.log("✅ [KIRPMA] Başarılı, Blob boyutu:", blob.size);

      console.log("🚀 [YÜKLEME] Sunucuya gönderiliyor...");
      const url = await uploadAvatar(blob);
      
      if (url) {
        console.log("✅ [YÜKLEME] Başarılı, URL:", url);
        await updateProfile({ avatar_url: url });
        console.log("✨ [PROFİL] Güncelleme tamamlandı!");
        setIsEditModalOpen(false);
        setImageSrc(null);
      } else {
        // Hata zaten imageService içinde alert ile gösterildi veya loglandı
        console.warn("⚠️ [YÜKLEME] İşlem durduruldu (URL alınamadı).");
      }
    } catch (err) {
      console.error("❌ [KRİTİK HATA]:", err.message);
      alert(`Bir hata oluştu: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Get rich history data by merging with context data
  const richHistory = readingHistory?.map(h => ({
    ...h,
    manhwa: series?.find(m => String(m.id) === String(h.manhwaId))
  })).filter(h => h.manhwa) || [];

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ── PROFILE HEADER ── */}
      <div className="glass border border-white/10 rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
          {/* Avatar Container */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-purple-500/30 shadow-neon-purple relative bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl sm:text-5xl font-black">{avatarLetter}</span>
              )}
              
              {/* Overlay on Hover */}
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white"
              >
                <Camera size={20} />
                <span className="text-[10px] font-black uppercase">Düzenle</span>
              </button>
            </div>
            {/* Rank Badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center shadow-lg">
               <Sparkles size={14} className="text-purple-400" />
            </div>
          </div>
          
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h1 className="text-3xl sm:text-4xl font-black text-white">{user.username}</h1>
              {(user.role === 'Baş Admin' || user.role === 'Yönetici') && (
                <span className="w-fit mx-auto sm:mx-0 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  <Crown size={12} /> {user.role}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mb-6 flex items-center justify-center sm:justify-start gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Kayıtlı E-posta: {user.email}
            </p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass border-white/10 text-slate-300 text-xs font-bold">
                <BookOpen size={14} className="text-purple-400" /> {user.totalRead || richHistory.length} Bölüm
              </span>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass border-white/10 text-slate-300 text-xs font-bold">
                <Sparkles size={14} className="text-blue-400" /> {user.xp || 0} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AVATAR EDIT MODAL ── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsEditModalOpen(false); setImageSrc(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl glass-strong border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">PROFİL FOTOĞRAFI SEÇİMİ</h3>
                <button onClick={() => { setIsEditModalOpen(false); setImageSrc(null); }} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X /></button>
              </div>

              <div className="space-y-6">
                <input 
                  type="file" ref={fileInputRef} className="hidden" 
                  accept="image/*" onChange={handleFileUpload}
                />

                {imageSrc ? (
                  <div className="space-y-6">
                    <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="round"
                        showGrid={false}
                      />
                    </div>
                    
                    {/* Zoom Control */}
                    <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl">
                      <Minus size={16} className="text-slate-500" />
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(e.target.value)}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <Plus size={16} className="text-slate-500" />
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setImageSrc(null); console.log("🔄 [İPTAL] Fotoğraf seçimine dönüldü."); }}
                        className="flex-1 py-4 glass border border-white/5 text-slate-400 font-bold rounded-2xl hover:text-white transition-all"
                      >
                        İPTAL
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={uploading}
                        className="flex-[2] py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-2xl shadow-neon-purple flex items-center justify-center gap-2"
                      >
                        {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={20} />}
                        {uploading ? 'İŞLENİYOR...' : 'FOTOĞRAFI GÜNCELLE'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Upload Section */}
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">Cihazından Yükle</p>
                       <button 
                        onClick={() => { console.log("🖱️ [TIKLA] Dosya seçici açılıyor."); fileInputRef.current?.click(); }}
                         className="w-full h-40 rounded-3xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-3 group"
                       >
                         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-purple-400 group-hover:scale-110 transition-all">
                           <Upload size={32} />
                         </div>
                         <div className="text-center">
                            <span className="block text-sm font-bold text-slate-300">Yeni Fotoğraf Yükle</span>
                            <span className="text-[10px] text-slate-600 font-medium">JPEG, PNG veya WebP (Max 5MB)</span>
                         </div>
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ── SIDEBAR ── */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {[
            { id: 'history', label: 'Okuduklarım', icon: History },
            { id: 'settings', label: 'Hesap Ayarları', icon: Settings },
            { id: 'notifications', label: 'Bildirim Tercihleri', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                  : 'glass border border-white/5 text-slate-400 hover:text-white hover:border-white/10'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
          {/* Admin link if user is admin */}
          {(user.role === 'Baş Admin' || user.role === 'Yönetici' || user.role === 'Admin Yardımcısı') && (
            <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold glass border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 transition-all mt-4">
              <LayoutDashboard size={18} />
              Yönetim Paneli
            </Link>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 pb-20">
          <AnimatePresence mode="wait">
            
            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-xl font-bold text-white mb-6">Okumaya Devam Et</h2>
                
                {richHistory.length === 0 ? (
                  <div className="glass border border-white/10 rounded-2xl p-10 text-center">
                    <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-white font-bold mb-2">Henüz seriye başlamadın</h3>
                    <p className="text-slate-400 text-sm mb-6">Keşfetmeye başla ve maceraya katıl!</p>
                    <Link to="/" className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold">Serileri Keşfet</Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {richHistory.map((item) => (
                      <div key={item.manhwaId} className="flex gap-4 p-4 rounded-2xl glass border border-white/10 hover:border-purple-500/30 transition-all group">
                        <img src={item.manhwa.cover} alt={item.manhwa.title} className="w-20 h-28 object-cover rounded-lg border border-white/10" />
                        <div className="flex-1 min-w-0 flex flex-col pt-1">
                          <h3 className="text-white font-bold text-sm truncate mb-1">{item.manhwa.title}</h3>
                          <p className="text-purple-400 text-xs font-semibold mb-2">Kaldığın Bölüm: {item.lastChapter}</p>
                          <p className="text-slate-500 text-[10px] mb-auto">Son okuma: {new Date(item.updatedAt).toLocaleDateString('tr-TR')}</p>
                          
                          <Link to={`/read/${item.manhwaId}/${item.lastChapter}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold hover:bg-purple-600 hover:text-white transition-all w-fit mt-2">
                            <Play size={12} /> Devam Et
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-xl font-bold text-white mb-6">Hesap Bilgileri</h2>
                <form className="max-w-md space-y-4" onSubmit={e => e.preventDefault()}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kullanıcı Adı</label>
                    <input type="text" defaultValue={user.username} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">E-posta Adresi</label>
                    <input type="email" defaultValue={user.email} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 bg-black/20" disabled />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Yeni Şifre</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 transition-all" />
                  </div>
                  <button className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-neon-purple mt-2">
                    Ayarları Kaydet
                  </button>
                </form>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-xl font-bold text-white mb-6">Bildirim Tercihleri</h2>
                <div className="max-w-md space-y-4">
                  {[
                    { id: 'notif_new', title: 'Yeni Bölüm Uyarıları', desc: 'Takip ettiğiniz serilere yeni bölüm eklendiğinde anında haber verilir.' },
                    { id: 'notif_sys', title: 'Sistem Duyuruları', desc: 'Bakım, güncelleme ve site ile ilgili genel bilgilendirme mesajları.' },
                    { id: 'notif_promo', title: 'Kampanyalar ve Duyurular', desc: 'Size özel indirim ve hediyelerden e-posta ile haberdar olun.' }
                  ].map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between p-4 glass border border-white/10 rounded-2xl hover:bg-white/5 transition-colors group">
                      <div className="pr-4">
                        <p className="text-white text-sm font-bold">{notif.title}</p>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{notif.desc}</p>
                      </div>
                      <label className="relative cursor-pointer flex-shrink-0">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-12 h-6 bg-white/10 rounded-full peer peer-checked:bg-purple-600 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-6 after:shadow-sm" />
                      </label>
                    </div>
                  ))}
                  
                  <button className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-neon-purple mt-4 w-fit">
                    Tercihleri Kaydet
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
