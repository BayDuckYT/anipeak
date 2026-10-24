import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Eye, Palette, Link as LinkIcon, 
  AlertTriangle, Settings as SettingsIcon, Check, Loader2, 
  Camera, ImageIcon, Zap, ChevronRight, Fingerprint, Calendar,
  Moon, Sun, ShieldAlert, Sparkles, Volume2, VolumeX,
  MonitorSmartphone, BellRing, BellOff, BookOpen, PartyPopper, MessageCircle,
  ExternalLink, Trash2, Clock, KeyRound, AlertOctagon, RefreshCw, X, ShieldCheck,
  CheckCircle2, Sliders, Smartphone, Laptop, BadgeCheck, FileText, Bookmark, CalendarClock,
  Radio, Volume1
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useSEO } from '../hooks/useSEO';
import { uploadAvatar } from '../lib/imageService';
import { supabase } from '../lib/supabaseClient';
import {
  resolveNotifSettings,
  requestBrowserPermission,
  browserPushSupported,
  playNotificationSound,
} from '../lib/notifications.js';
import Cropper from 'react-easy-crop';

const SIZE_PRESETS = [
  { id: 'small', label: 'Küçük', desc: '128×128', size: 128, icon: '🔹' },
  { id: 'medium', label: 'Orta', desc: '256×256', size: 256, icon: '🔷' },
  { id: 'large', label: 'Büyük', desc: '512×512', size: 512, icon: '💎' },
  { id: 'original', label: 'Orijinal', desc: 'Tam Boyut', size: null, icon: '⚡' },
];

const BANNER_SIZE_PRESETS = [
  { id: 'small', label: 'Küçük', desc: '600×200', w: 600, h: 200, icon: '🔹' },
  { id: 'medium', label: 'Orta', desc: '900×300', w: 900, h: 300, icon: '🔷' },
  { id: 'large', label: 'Büyük', desc: '1200×400', w: 1200, h: 400, icon: '💎' },
  { id: 'original', label: 'Orijinal', desc: 'Tam Boyut', w: null, h: null, icon: '⚡' },
];

const getCroppedImg = async (imageSrc, pixelCrop, targetSize = null) => {
  const image = new Image();
  image.setAttribute('crossOrigin', 'anonymous');
  image.src = imageSrc;
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const outW = targetSize || pixelCrop.width;
    const outH = targetSize || pixelCrop.height;
    canvas.width = outW;
    canvas.height = outH;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        blob.name = `cropped_${Date.now()}.webp`;
        resolve(blob);
      }, 'image/webp', 0.9);
    });
  } catch (err) { throw err; }
};

const resizeImage = (file, maxDim) => {
  return new Promise((resolve) => {
    if (!maxDim) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          blob.name = file.name || `resized_${Date.now()}.webp`;
          resolve(blob);
        }, 'image/webp', 0.9);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

export default function SettingsPage() {
  const { user, updateProfile, updatePassword, clearAllNotifications, logout } = useAuth();
  const { series = [] } = useApp();
  const [activeTab, setActiveTab] = useState('hesap');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Ayarlar Güncellendi');
  const [browserPermission, setBrowserPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));
  
  // Tehlikeli Bölge Modalı
  const [dangerModal, setDangerModal] = useState({ isOpen: false, action: null, confirmText: '' });

  const [cropModal, setCropModal] = useState({
    isOpen: false,
    imageSrc: null,
    type: 'avatar',
    file: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null,
    outputSize: 'medium',
  });

  const [gifSizeModal, setGifSizeModal] = useState({
    isOpen: false,
    file: null,
    type: 'avatar',
    previewUrl: null,
    selectedSize: 'medium',
  });

  useSEO({
    title: 'Ayarlar | MahoraPeak Komuta Merkezi',
    description: 'MahoraPeak kullanıcı ayarları, güvenlik, bildirimler ve profil kontrol merkezi.',
    url: 'https://mahorapeak.com.tr/settings'
  });

  const [notifSettings, setNotifSettings] = useState(() => resolveNotifSettings(user?.notification_settings));
  const [privacySettings, setPrivacySettings] = useState({ publicProfile: true, showActivity: true });
  const [appearanceSettings, setAppearanceSettings] = useState({ theme: 'dark', animations: true });
  const [malUsername, setMalUsername] = useState('');
  const [bioText, setBioText] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    if (user) {
      setNotifSettings(resolveNotifSettings(user.notification_settings));
      if (user.privacy_settings) setPrivacySettings(user.privacy_settings);
      if (user.appearance_settings) setAppearanceSettings(user.appearance_settings);
      if (user.mal_username) setMalUsername(user.mal_username);
      if (user.bio) setBioText(user.bio);
      if (user.username) setUsernameInput(user.username);
      if (user.email) setEmailInput(user.email);
    }
  }, [user]);

  const handleSave = async (fields, customMsg = 'Ayarlar Güncellendi') => {
    setIsSaving(true);
    try {
      await updateProfile(fields);
      setToastMsg(customMsg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Ayarlar kaydedilirken hata oluştu: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotifSetting = async (key, val, label = 'Bildirim Ayarı Güncellendi') => {
    const updated = { ...notifSettings, [key]: val };
    setNotifSettings(updated);
    await handleSave({ notification_settings: updated }, label);
  };

  const updateQuietHours = async (field, val) => {
    const updatedQuiet = { ...notifSettings.quietHours, [field]: val };
    const updated = { ...notifSettings, quietHours: updatedQuiet };
    setNotifSettings(updated);
    await handleSave({ notification_settings: updated }, 'Sessiz Saatler Güncellendi');
  };

  const handleChangePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      alert('Yeni şifreler birbiriyle eşleşmiyor!');
      return;
    }
    if (passwords.next.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır!');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updatePassword(passwords.next);
      if (res?.error) throw res.error;
      setToastMsg('Şifreniz Başarıyla Değiştirildi');
      setShowToast(true);
      setPasswords({ current: '', next: '', confirm: '' });
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Şifre değiştirilemedi: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'image/gif') {
      const url = URL.createObjectURL(file);
      setGifSizeModal({
        isOpen: true,
        file,
        type,
        previewUrl: url,
        selectedSize: 'medium',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        isOpen: true,
        imageSrc: reader.result,
        type,
        file,
        crop: { x: 0, y: 0 },
        zoom: 1,
        croppedAreaPixels: null,
        outputSize: 'medium',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async () => {
    if (!cropModal.imageSrc || !cropModal.croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const isAvatar = cropModal.type === 'avatar';
      let targetDim = null;

      if (isAvatar) {
        const preset = SIZE_PRESETS.find(p => p.id === cropModal.outputSize);
        targetDim = preset?.size || null;
      } else {
        const preset = BANNER_SIZE_PRESETS.find(p => p.id === cropModal.outputSize);
        targetDim = preset?.w || null;
      }

      const croppedBlob = await getCroppedImg(cropModal.imageSrc, cropModal.croppedAreaPixels, targetDim);
      const url = await uploadAvatar(croppedBlob, user.id);

      if (isAvatar) {
        await handleSave({ avatar_url: url }, 'Profil Fotoğrafı Güncellendi');
      } else {
        await handleSave({ banner_url: url }, 'Kapak Fotoğrafı Güncellendi');
      }

      setCropModal({ isOpen: false, imageSrc: null, type: 'avatar', file: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null, outputSize: 'medium' });
    } catch (err) {
      alert('Görsel işlenirken hata oluştu: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGifUpload = async () => {
    if (!gifSizeModal.file) return;
    setIsSaving(true);
    try {
      const isAvatar = gifSizeModal.type === 'avatar';
      let maxDim = null;

      if (isAvatar) {
        const preset = SIZE_PRESETS.find(p => p.id === gifSizeModal.selectedSize);
        maxDim = preset?.size || null;
      } else {
        const preset = BANNER_SIZE_PRESETS.find(p => p.id === gifSizeModal.selectedSize);
        maxDim = preset?.w || null;
      }

      const finalFile = await resizeImage(gifSizeModal.file, maxDim);
      const url = await uploadAvatar(finalFile, user.id);

      if (isAvatar) {
        await handleSave({ avatar_url: url }, 'Hareketli Avatar Güncellendi');
      } else {
        await handleSave({ banner_url: url }, 'Hareketli Kapak Güncellendi');
      }

      setGifSizeModal({ isOpen: false, file: null, type: 'avatar', previewUrl: null, selectedSize: 'medium' });
    } catch (err) {
      alert('GIF yüklenirken hata oluştu: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDangerAction = async () => {
    const { action } = dangerModal;
    setIsSaving(true);

    try {
      if (action === 'clear_history') {
        localStorage.removeItem('reading_history');
        localStorage.removeItem('mahorapeak_reading_history');
        if (user?.id) {
          await supabase.from('reading_progress').delete().eq('user_id', user.id);
        }
        setToastMsg('Okuma Geçmişiniz Sıfırlandı');
        setShowToast(true);
      } else if (action === 'clear_notifications') {
        if (clearAllNotifications) await clearAllNotifications();
        setToastMsg('Tüm Bildirimler Temizlendi');
        setShowToast(true);
      } else if (action === 'clear_cache') {
        localStorage.clear();
        sessionStorage.clear();
        setToastMsg('Önbellek Temizlendi, Sayfa Yenileniyor...');
        setShowToast(true);
        setTimeout(() => window.location.reload(), 1200);
      } else if (action === 'delete_account') {
        if (dangerModal.confirmText !== 'HESABIMI SİL') {
          alert('Onaylamak için lütfen tam olarak "HESABIMI SİL" yazınız.');
          setIsSaving(false);
          return;
        }
        if (user?.id) {
          await supabase.from('profiles').update({ is_deleted: true, username: `deleted_${Date.now()}` }).eq('id', user.id);
        }
        alert('Hesabınız başarıyla silindi ve oturum kapatıldı.');
        await logout();
        return;
      }
    } catch (err) {
      alert('İşlem başarısız oldu: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
      setDangerModal({ isOpen: false, action: null, confirmText: '' });
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const menuItems = [
    { id: 'hesap', label: 'Profil Kimliği', icon: User, color: 'text-purple-400' },
    { id: 'bildirimler', label: 'Bildirim Merkezi', icon: Bell, color: 'text-cyan-400' },
    { id: 'guvenlik', label: 'Güvenlik & Şifre', icon: Shield, color: 'text-indigo-400' },
    { id: 'gorunum', label: 'Görünüm & Tema', icon: Palette, color: 'text-pink-400' },
    { id: 'gizlilik', label: 'Gizlilik (Gölge)', icon: Eye, color: 'text-emerald-400' },
    { id: 'mal', label: 'MyAnimeList', icon: LinkIcon, color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-[#070412] text-white pt-28 pb-24 relative overflow-hidden selection:bg-purple-600 selection:text-white">
      
      {/* Background Cyber Glows */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 bg-[#0e0924]/95 backdrop-blur-2xl border border-purple-500/40 rounded-2xl shadow-[0_10px_40px_rgba(168,85,247,0.3)]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-400">
              <Check size={18} strokeWidth={3} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white">{toastMsg}</p>
              <p className="text-[10px] text-gray-400">MahoraPeak Sistemi Güncellendi</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tehlikeli Bölge Onay Modalı */}
      {createPortal(
        <AnimatePresence>
          {dangerModal.isOpen && (
            <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#0e071c] border border-red-500/40 rounded-3xl p-6 shadow-[0_20px_60px_rgba(239,68,68,0.25)] relative overflow-hidden"
              >
                <div className="flex items-center gap-3 text-red-400 mb-4">
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase text-white">İşlemi Onaylayın</h3>
                    <p className="text-[11px] text-red-300">Bu işlem geri alınamaz!</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-6">
                  {dangerModal.action === 'clear_history' && 'Tüm okuma geçmişiniz ve bölüm ilerlemeleriniz silinecektir. Emin misiniz?'}
                  {dangerModal.action === 'clear_notifications' && 'Gelen kutunuzdaki tüm bildirimler ve duyuru kayıtları temizlenecektir.'}
                  {dangerModal.action === 'clear_cache' && 'Tarayıcınızdaki yerel veriler silinip site baştan yüklenecektir.'}
                  {dangerModal.action === 'delete_account' && 'MahoraPeak hesabınız kalıcı olarak kapatılacaktır. Devam etmek için aşağıdaki alana HESABIMI SİL yazınız:'}
                </p>

                {dangerModal.action === 'delete_account' && (
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="HESABIMI SİL"
                      value={dangerModal.confirmText}
                      onChange={(e) => setDangerModal({ ...dangerModal, confirmText: e.target.value })}
                      className="w-full bg-black/60 border border-red-500/40 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDangerModal({ isOpen: false, action: null, confirmText: '' })}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleDangerAction}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg shadow-red-900/40 flex items-center gap-2"
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    <span>Onayla ve Uygula</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Kırpma Modalı */}
      {createPortal(
        <AnimatePresence>
          {cropModal.isOpen && (
            <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-xl bg-[#0f0924] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-sm font-black text-white uppercase">
                    {cropModal.type === 'avatar' ? '👤 Avatar Kırp' : '🖼️ Kapak Kırp'}
                  </h3>
                  <button onClick={() => setCropModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <div className="relative w-full h-80 bg-black">
                  <Cropper
                    image={cropModal.imageSrc}
                    crop={cropModal.crop}
                    zoom={cropModal.zoom}
                    aspect={cropModal.type === 'avatar' ? 1 : 3}
                    cropShape={cropModal.type === 'avatar' ? 'round' : 'rect'}
                    showGrid={false}
                    onCropChange={(crop) => setCropModal(prev => ({ ...prev, crop }))}
                    onCropComplete={(_, croppedAreaPixels) => setCropModal(prev => ({ ...prev, croppedAreaPixels }))}
                    onZoomChange={(zoom) => setCropModal(prev => ({ ...prev, zoom }))}
                  />
                </div>
                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center">
                  <div className="w-48 hidden sm:block">
                    <input
                      type="range"
                      value={cropModal.zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      onChange={(e) => setCropModal(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={handleCropComplete}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg ml-auto"
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* GIF Modal */}
      {createPortal(
        <AnimatePresence>
          {gifSizeModal.isOpen && (
            <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0f0924] border border-purple-500/30 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-sm font-black text-white uppercase mb-4">🎞️ GIF Boyut Seçimi</h3>
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-purple-500/40 mb-6 bg-black flex items-center justify-center">
                  {gifSizeModal.previewUrl && <img src={gifSizeModal.previewUrl} alt="GIF" className="w-full h-full object-cover" />}
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setGifSizeModal(prev => ({ ...prev, selectedSize: preset.id }))}
                      className={`p-3 rounded-xl border text-center transition ${
                        gifSizeModal.selectedSize === preset.id
                          ? 'bg-purple-600/30 border-purple-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{preset.label}</span>
                      <span className="text-[10px] opacity-60">{preset.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setGifSizeModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-xs font-bold text-gray-400">İptal</button>
                  <button onClick={handleGifUpload} disabled={isSaving} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg">
                    {isSaving ? 'Yükleniyor...' : 'Yükle'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ÜST BAŞLIK & KOMUTA MERKEZİ */}
        <header className="mb-10 flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-2xl" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 via-indigo-700 to-pink-600 border border-white/20 flex items-center justify-center relative z-10 shadow-[0_0_25px_rgba(168,85,247,0.5)]">
              <SettingsIcon size={30} className="text-white animate-[spin_12s_linear_infinite]" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">Ayarlar</h1>
            <p className="text-purple-400 text-xs font-extrabold uppercase tracking-widest mt-1 flex items-center gap-1.5">
              <Fingerprint size={14} /> MahoraPeak Komuta Merkezi
            </p>
          </div>
        </header>

        {/* ANA DÜZEN: SOL SİDEBAR & SAĞ İÇERİK */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SOL MENÜ */}
          <aside className="w-full lg:w-[300px] shrink-0">
            <div className="sticky top-28 p-3 bg-[#0a0618]/90 backdrop-blur-2xl border border-purple-500/20 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
              <nav className="flex flex-col gap-1.5">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`relative flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/40 border border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]' 
                          : 'hover:bg-white/[0.04] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`p-2 rounded-xl transition ${isActive ? 'bg-purple-600/40 text-purple-200' : 'bg-white/5 group-hover:bg-white/10'}`}>
                          <item.icon size={18} className={isActive ? item.color : 'text-gray-400 group-hover:text-white'} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={15} className="text-purple-300 relative z-10" />}
                    </button>
                  );
                })}
              </nav>

              {/* TEHLİKELİ BÖLGE BUTONU */}
              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <button
                  onClick={() => setActiveTab('danger')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group border ${
                    activeTab === 'danger'
                      ? 'bg-red-950/60 border-red-500/60 text-white shadow-[0_0_25px_rgba(239,68,68,0.35)]'
                      : 'bg-red-500/5 hover:bg-red-500/15 border-red-500/20 text-red-400 hover:text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 text-red-400">
                      <ShieldAlert size={18} />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider">Tehlikeli Bölge</span>
                  </div>
                  {activeTab === 'danger' && <ChevronRight size={15} className="text-red-400" />}
                </button>
              </div>
            </div>
          </aside>

          {/* SAĞ İÇERİK ALANI */}
          <main className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0b071e]/90 backdrop-blur-3xl border border-purple-500/25 rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative overflow-hidden"
              >
                
                {/* 1. PROFİL KİMLİĞİ (HESAP BİLGİLERİ) */}
                {activeTab === 'hesap' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Profil Kimliği</h2>
                      <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mt-1">Görsel Varlıklar ve Hesap Detayları</p>
                    </div>

                    {/* Banner & Avatar Alanı */}
                    <div className="relative rounded-3xl overflow-hidden border border-purple-500/20 bg-black/50">
                      {/* Banner Görseli */}
                      <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-purple-950 via-[#0e0722] to-indigo-950 relative group">
                        {user?.banner_url ? (
                          <img src={user.banner_url} alt="Kapak" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-400/30 text-xs font-black uppercase tracking-widest">
                            Özel Kapak Görseli Ekleyin
                          </div>
                        )}
                        <label className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-black/60 hover:bg-black/90 text-white text-xs font-bold border border-white/20 backdrop-blur-md cursor-pointer transition flex items-center gap-2 shadow-lg">
                          <Camera size={14} />
                          <span>Kapağı Değiştir</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'banner')} />
                        </label>
                      </div>

                      {/* Avatar & İsim */}
                      <div className="p-6 pt-0 flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 sm:-mt-20 relative z-10">
                        <div className="relative group">
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-[#0b071e] bg-black shadow-2xl relative">
                            <img
                              src={user?.avatar_url || 'https://wsrv.nl/?url=https://mahorapeak.com.tr/mahorapeaklogov2.png'}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-xs">
                              <Camera size={20} />
                              <span className="text-[10px] font-bold mt-1">Değiştir</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'avatar')} />
                            </label>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-xl sm:text-2xl font-black text-white truncate">{user?.username}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {user?.role || 'Üye'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Form Alanları: Kullanıcı Adı & E-posta */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest block">KULLANICI ADI</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            placeholder="Kullanıcı Adı"
                            className="w-full bg-black/40 border border-purple-500/20 rounded-2xl p-4 pr-24 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
                          />
                          <button
                            onClick={() => handleSave({ username: usernameInput }, 'Kullanıcı Adı Güncellendi')}
                            disabled={isSaving || usernameInput === user?.username}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-0"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest block">E-POSTA ADRESİ</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="E-posta Adresi"
                            className="w-full bg-black/40 border border-purple-500/20 rounded-2xl p-4 pr-24 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
                          />
                          <button
                            onClick={() => handleSave({ email: emailInput }, 'E-posta Güncellendi')}
                            disabled={isSaving || emailInput === user?.email}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-0"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Biyografi */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest">BİYOGRAFİ / HAKKINDA</label>
                        <span className="text-[10px] text-gray-500 font-mono">{bioText.length}/280</span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={280}
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        placeholder="Profilinizde görünecek bir biyografi yazın..."
                        className="w-full bg-black/40 border border-purple-500/20 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSave({ bio: bioText }, 'Biyografi Güncellendi')}
                          disabled={isSaving}
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md"
                        >
                          Biyografiyi Kaydet
                        </button>
                      </div>
                    </div>

                    {/* Hesap Özeti & Rozet Bilgisi */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] grid sm:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Üyelik Rolü</span>
                        <span className="text-sm font-black text-white mt-0.5 block">{user?.role || 'Kullanıcı'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Aktif Plan</span>
                        <span className="text-sm font-black text-purple-300 mt-0.5 block">{user?.active_plan_id ? user.active_plan_id.toUpperCase() : 'Standart'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Kayıt Tarihi</span>
                        <span className="text-sm font-black text-slate-300 mt-0.5 block">{user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Şubat 2026'}</span>
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. BİLDİRİM MERKEZİ (DOPDOLU & DETAYLI) */}
                {activeTab === 'bildirimler' && (
                  <div className="space-y-10">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                        <Bell className="text-cyan-400" size={24} /> Bildirim Merkezi
                      </h2>
                      <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-1">
                        Hangi durumlarda, nasıl ve nereden sinyal almak istediğinizi özelleştirin
                      </p>
                    </div>

                    {/* Grup 1: Okuma & Seri Bildirimleri */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                        <BookOpen size={16} className="text-emerald-400" /> Okuma &amp; Seri Alarmları
                      </h3>

                      <div className="grid gap-3">
                        <EpicToggle
                          icon={BookOpen}
                          title="Yeni Bölüm Bildirimleri"
                          desc="Kütüphanenizdeki serilere yeni bölüm eklendiğinde anlık bildirim alın."
                          enabled={notifSettings.newChapter}
                          onToggle={() => updateNotifSetting('newChapter', !notifSettings.newChapter, 'Bölüm Bildirimleri Güncellendi')}
                        />

                        <EpicToggle
                          icon={Bookmark}
                          title="Yalnızca Takip Ettiğim Seriler"
                          desc="Aktif edildiğinde, yalnızca okuma listenizde veya favorilerinizde olan seriler için bölüm bildirimi alırsınız."
                          enabled={notifSettings.onlyTracked}
                          onToggle={() => updateNotifSetting('onlyTracked', !notifSettings.onlyTracked, 'Filtre Tercihi Güncellendi')}
                        />

                        <EpicToggle
                          icon={Sparkles}
                          title="Yeni Seri Eklemeleri"
                          desc="MahoraPeak kütüphanesine yepyeni bir manga veya manhwa eklendiğinde ilk sizin haberiniz olsun."
                          enabled={notifSettings.newSeries}
                          onToggle={() => updateNotifSetting('newSeries', !notifSettings.newSeries, 'Seri Bildirimleri Güncellendi')}
                        />

                        <EpicToggle
                          icon={CalendarClock}
                          title="Haftalık Yayın Takvimi Hatırlatıcıları"
                          desc="Takip ettiğiniz serilerin haftalık yayın günlerinde saat yaklaşınca sistem hatırlatması alın."
                          enabled={notifSettings.schedule}
                          onToggle={() => updateNotifSetting('schedule', !notifSettings.schedule, 'Takvim Hatırlatıcıları Güncellendi')}
                        />
                      </div>
                    </div>

                    {/* Grup 2: Sosyal & Etkileşim Bildirimleri */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                        <MessageCircle size={16} className="text-pink-400" /> Sosyal &amp; Topluluk Etkileşimi
                      </h3>

                      <div className="grid gap-3">
                        <EpicToggle
                          icon={MessageCircle}
                          title="Yanıtlar, Beğeniler ve Etiketlenmeler"
                          desc="Yorumunuza biri yanıt verdiğinde, beğendiğinde veya sohbetlerde sizden bahsedildiğinde anında haber ver."
                          enabled={notifSettings.replies}
                          onToggle={() => updateNotifSetting('replies', !notifSettings.replies, 'Sosyal Bildirimler Güncellendi')}
                        />
                      </div>
                    </div>

                    {/* Grup 3: Platform, Sistem & Etkinlikler */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                        <PartyPopper size={16} className="text-amber-400" /> Sistem &amp; Özel Etkinlikler
                      </h3>

                      <div className="grid gap-3">
                        <EpicToggle
                          icon={Zap}
                          title="Sistem Güncellemeleri & Bakım"
                          desc="Sunucu bakımları, yeni site özellikleri ve altyapı güncellemelerinden haberdar olun."
                          enabled={notifSettings.system}
                          onToggle={() => updateNotifSetting('system', !notifSettings.system, 'Sistem Bildirimleri Güncellendi')}
                        />

                        <EpicToggle
                          icon={PartyPopper}
                          title="Özel Etkinlikler, XP & Kampanyalar"
                          desc="Hafta sonu çift XP etkinlikleri, Aura çekilişleri ve topluluk yarışmaları hakkında bildirimler."
                          enabled={notifSettings.events}
                          onToggle={() => updateNotifSetting('events', !notifSettings.events, 'Etkinlik Bildirimleri Güncellendi')}
                        />
                      </div>
                    </div>

                    {/* Grup 4: İletim Kanalları & Ortam Tercihleri */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                        <Sliders size={16} className="text-purple-400" /> İletim Kanalları &amp; Sesler
                      </h3>

                      <div className="grid gap-3">
                        {/* Toast */}
                        <EpicToggle
                          icon={MonitorSmartphone}
                          title="Ekran İçi Toast Balonları"
                          desc="Sitede gezinirken yeni bir bildirim geldiğinde sağ alt köşede akıcı bir bildirim kartı belirtsin."
                          enabled={notifSettings.toast}
                          onToggle={() => updateNotifSetting('toast', !notifSettings.toast, 'Toast Bildirimleri Güncellendi')}
                        />

                        {/* Ses */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${notifSettings.sound ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                              {notifSettings.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-white">Bildirim Ses Efekti</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Yeni bildirim düştüğünde melodik bir ses çalar</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <button
                              onClick={() => playNotificationSound('high')}
                              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition"
                            >
                              <Volume1 size={13} /> Sesi Test Et
                            </button>
                            <button 
                              onClick={() => updateNotifSetting('sound', !notifSettings.sound, 'Ses Ayarı Güncellendi')}
                              className={`relative w-14 h-7 rounded-full transition-all duration-300 p-0.5 flex items-center border ${
                                notifSettings.sound ? 'bg-purple-600 border-purple-400' : 'bg-zinc-800 border-zinc-700'
                              }`}
                            >
                              <motion.div 
                                animate={{ x: notifSettings.sound ? 28 : 0 }}
                                className="w-5 h-5 bg-white rounded-full shadow"
                              />
                            </button>
                          </div>
                        </div>

                        {/* Web Push */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center">
                              <Laptop size={20} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-white">Tarayıcı Masaüstü / Web Push</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Sekme arka plandayken veya simge durumundayken sistem bildirimi alın</p>
                            </div>
                          </div>

                          <div className="self-end sm:self-auto">
                            {browserPermission !== 'granted' && browserPushSupported() ? (
                              <button
                                onClick={async () => {
                                  const perm = await requestBrowserPermission();
                                  setBrowserPermission(perm);
                                  if (perm === 'granted') {
                                    await updateNotifSetting('browserPush', true, 'Tarayıcı Bildirim İzni Verildi');
                                  }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-900/30"
                              >
                                Bildirim İzni İste
                              </button>
                            ) : browserPermission === 'granted' ? (
                              <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <CheckCircle2 size={12} /> İzin Aktif
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                                Desteklenmiyor
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grup 5: Sessiz Saatler / Rahatsız Etme Modu */}
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            <Moon size={20} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-white">Sessiz Saatler (Rahatsız Etme)</h4>
                            <p className="text-[10px] text-gray-400">Belirlediğiniz zaman aralığında bildirim sesleri ve pop-uplar otomatik susturulur.</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => updateQuietHours('enabled', !notifSettings.quietHours?.enabled)}
                          className={`relative w-14 h-7 rounded-full transition-all duration-300 p-0.5 flex items-center border ${
                            notifSettings.quietHours?.enabled ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-800 border-zinc-700'
                          }`}
                        >
                          <motion.div 
                            animate={{ x: notifSettings.quietHours?.enabled ? 28 : 0 }}
                            className="w-5 h-5 bg-white rounded-full shadow"
                          />
                        </button>
                      </div>

                      {notifSettings.quietHours?.enabled && (
                        <div className="pt-4 border-t border-white/[0.06] grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Başlangıç Saati</label>
                            <input
                              type="time"
                              value={notifSettings.quietHours?.start || '23:00'}
                              onChange={(e) => updateQuietHours('start', e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Bitiş Saati</label>
                            <input
                              type="time"
                              value={notifSettings.quietHours?.end || '08:00'}
                              onChange={(e) => updateQuietHours('end', e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 3. GÜVENLİK */}
                {activeTab === 'guvenlik' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                        <Shield className="text-indigo-400" size={24} /> Güvenlik Ağı
                      </h2>
                      <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">Şifreleme ve Erişim Yönetimi</p>
                    </div>

                    {/* Şifre Güncelleme Kartı */}
                    <div className="p-6 md:p-8 rounded-3xl bg-black/40 border border-purple-500/20 space-y-6">
                      <div className="flex items-center gap-3 text-white">
                        <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-300">
                          <KeyRound size={22} />
                        </div>
                        <div>
                          <h3 className="font-black text-sm uppercase">Şifre Değiştir</h3>
                          <p className="text-[11px] text-gray-400">Hesabınızın erişim anahtarını güncelleyin</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <input
                          type="password"
                          placeholder="Mevcut Şifre"
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition"
                        />
                        <div className="grid sm:grid-cols-2 gap-4">
                          <input
                            type="password"
                            placeholder="Yeni Şifre"
                            value={passwords.next}
                            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition"
                          />
                          <input
                            type="password"
                            placeholder="Yeni Şifre (Tekrar)"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition"
                          />
                        </div>

                        <button
                          onClick={handleChangePassword}
                          disabled={isSaving || !passwords.next}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest shadow-lg transition disabled:opacity-40"
                        >
                          {isSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                        </button>
                      </div>
                    </div>

                    {/* Güvenlik Tavsiyeleri */}
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                      <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-200 leading-relaxed">
                        <p className="font-bold text-emerald-300 mb-0.5">Hesabınız Güvende</p>
                        MahoraPeak şifreleriniz SHA-256 ve bcrypt ile tuzlanmış hash olarak korunur. Sistem yöneticileri dahi şifrenizi açık halde göremez.
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. GÖRÜNÜM */}
                {activeTab === 'gorunum' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                        <Palette className="text-pink-400" size={24} /> Görünüm &amp; Motor
                      </h2>
                      <p className="text-pink-400 text-xs font-bold uppercase tracking-widest mt-1">Arayüz ve Performans Seçenekleri</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-3">Arayüz Teması</label>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => handleSave({ appearance_settings: { ...appearanceSettings, theme: 'dark' } }, 'Cyber Mor Tema Seçildi')}
                            className={`p-5 rounded-2xl border text-left transition flex items-center gap-4 ${
                              appearanceSettings.theme === 'dark'
                                ? 'bg-purple-950/50 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-300">
                              <Moon size={20} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-white">Cyber Gece</h4>
                              <p className="text-[10px] text-gray-400">Klasik koyu MahoraPeak mor neon atmosferi</p>
                            </div>
                          </button>

                          <button
                            onClick={() => handleSave({ appearance_settings: { ...appearanceSettings, theme: 'amoled' } }, 'AMOLED Siyah Tema Seçildi')}
                            className={`p-5 rounded-2xl border text-left transition flex items-center gap-4 ${
                              appearanceSettings.theme === 'amoled'
                                ? 'bg-black border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            <div className="p-3 bg-black border border-white/20 rounded-xl text-white">
                              <Sun size={20} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-white">AMOLED Saf Siyah</h4>
                              <p className="text-[10px] text-gray-400">OLED ekranlar için ultra pil tasarrufu sağlayan derin siyah</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Akıcı Animasyonlar */}
                      <EpicToggle
                        icon={Zap}
                        title="Akıcı Animasyonlar & Efektler"
                        desc="Sayfa geçişleri, neon parlamaları ve etkileşim animasyonlarını etkinleştirin."
                        enabled={appearanceSettings.animations}
                        onToggle={() => handleSave({ appearance_settings: { ...appearanceSettings, animations: !appearanceSettings.animations } }, 'Animasyon Tercihi Güncellendi')}
                      />
                    </div>
                  </div>
                )}

                {/* 5. GİZLİLİK (GÖLGE MODU) */}
                {activeTab === 'gizlilik' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                        <Eye className="text-emerald-400" size={24} /> Gölge Modu
                      </h2>
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">Gizlilik ve Görünürlük Tercihleri</p>
                    </div>

                    <div className="space-y-4">
                      <EpicToggle
                        icon={Eye}
                        title="Profil Görünürlüğü"
                        desc="Profilinizin diğer kullanıcılar tarafından incelenmesine ve ziyaret edilmesine izin verin."
                        enabled={privacySettings.publicProfile}
                        onToggle={() => handleSave({ privacy_settings: { ...privacySettings, publicProfile: !privacySettings.publicProfile } }, 'Profil Görünürlüğü Güncellendi')}
                      />
                      <EpicToggle
                        icon={Zap}
                        title="Aktivite Radarı"
                        desc="Şu an okuduğunuz serilerin ve listelerinizin profilinizde görünmesini sağlayın."
                        enabled={privacySettings.showActivity}
                        onToggle={() => handleSave({ privacy_settings: { ...privacySettings, showActivity: !privacySettings.showActivity } }, 'Aktivite Radarı Güncellendi')}
                      />
                    </div>
                  </div>
                )}

                {/* 6. MYANIMELIST */}
                {activeTab === 'mal' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                        <LinkIcon className="text-blue-400" size={24} /> Veritabanı Bağlantısı
                      </h2>
                      <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">MyAnimeList Entegrasyonu</p>
                    </div>

                    <div className="p-6 md:p-8 rounded-3xl bg-[#2e51a2]/10 border border-[#2e51a2]/30 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#2e51a2] flex items-center justify-center font-black text-xl italic text-white shadow-lg">
                          MAL
                        </div>
                        <div>
                          <h3 className="font-black text-sm uppercase text-white">Global Senkronizasyon</h3>
                          <p className="text-[11px] text-gray-400">Okuma listelerinizi MyAnimeList hesabınızla bağlayın</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="MyAnimeList Kullanıcı Adınız"
                          value={malUsername}
                          onChange={(e) => setMalUsername(e.target.value)}
                          className="w-full bg-black/50 border border-[#2e51a2]/40 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#2e51a2] transition"
                        />
                        <button
                          onClick={() => handleSave({ mal_username: malUsername }, 'MyAnimeList Hesabı Bağlandı')}
                          disabled={isSaving}
                          className="w-full py-3.5 rounded-2xl bg-[#2e51a2] hover:bg-[#3b64c2] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg"
                        >
                          {isSaving ? 'Bağlanıyor...' : 'Bağlantıyı Kaydet'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. TEHLİKELİ BÖLGE (DANGER ZONE) */}
                {activeTab === 'danger' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400">
                        <ShieldAlert size={26} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Tehlikeli Bölge</h2>
                        <p className="text-red-400 text-xs font-bold uppercase tracking-widest mt-0.5">Kritik ve Geri Alınamaz İşlemler</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Okuma Geçmişini Sıfırla */}
                      <div className="p-5 rounded-2xl bg-black/40 border border-red-500/20 hover:border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                        <div>
                          <h4 className="text-xs font-black uppercase text-white">Okuma Geçmişini Sıfırla</h4>
                          <p className="text-[11px] text-gray-400 mt-1">Okuduğunuz tüm bölümlerin ve serilerin kayıtlarını temizler.</p>
                        </div>
                        <button
                          onClick={() => setDangerModal({ isOpen: true, action: 'clear_history', confirmText: '' })}
                          className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 font-bold text-xs transition shrink-0"
                        >
                          Geçmişi Temizle
                        </button>
                      </div>

                      {/* Bildirimleri Boşalt */}
                      <div className="p-5 rounded-2xl bg-black/40 border border-red-500/20 hover:border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                        <div>
                          <h4 className="text-xs font-black uppercase text-white">Bildirim Kutusunu Boşalt</h4>
                          <p className="text-[11px] text-gray-400 mt-1">Gelen kutunuzdaki tüm duyuru ve kişisel bildirimleri temizler.</p>
                        </div>
                        <button
                          onClick={() => setDangerModal({ isOpen: true, action: 'clear_notifications', confirmText: '' })}
                          className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 font-bold text-xs transition shrink-0"
                        >
                          Bildirimleri Sil
                        </button>
                      </div>

                      {/* Önbelleği Temizle */}
                      <div className="p-5 rounded-2xl bg-black/40 border border-red-500/20 hover:border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                        <div>
                          <h4 className="text-xs font-black uppercase text-white">Tarayıcı Önbelleğini Boşalt</h4>
                          <p className="text-[11px] text-gray-400 mt-1">Yerel verileri temizleyip siteyi baştan yükler.</p>
                        </div>
                        <button
                          onClick={() => setDangerModal({ isOpen: true, action: 'clear_cache', confirmText: '' })}
                          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-bold text-xs transition shrink-0"
                        >
                          Önbelleği Temizle
                        </button>
                      </div>

                      {/* Hesabı Kalıcı Olarak Sil */}
                      <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/50 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-black uppercase text-red-300 flex items-center gap-2">
                              <AlertOctagon size={16} /> Hesabı Kalıcı Olarak Kapat
                            </h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                              Hesabınız, kayıtlı listeleriniz, yorumlarınız ve tüm verileriniz kalıcı olarak silinir. Bu işlem geri döndürülemez.
                            </p>
                          </div>
                          <button
                            onClick={() => setDangerModal({ isOpen: true, action: 'delete_account', confirmText: '' })}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shrink-0"
                          >
                            Hesabı Sil
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Yardımcı Toggle Bileşeni ──────────────────────────────────────────────────

function EpicToggle({ icon: Icon, title, desc, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition-all group">
      <div className="flex items-center gap-4 flex-1 pr-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
          enabled ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/10 text-gray-500'
        }`}>
          <Icon size={20} strokeWidth={1.75} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-white tracking-wide">{title}</h4>
          <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">{desc}</p>
        </div>
      </div>

      <button 
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 p-0.5 flex items-center shrink-0 border ${
          enabled ? 'bg-purple-600 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-zinc-800 border-zinc-700'
        }`}
      >
        <motion.div 
          animate={{ x: enabled ? 28 : 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className="w-5 h-5 bg-white rounded-full shadow"
        />
      </button>
    </div>
  );
}
