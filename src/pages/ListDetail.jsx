import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Share2, 
  Edit3, 
  Plus, 
  Minus, 
  X, 
  BookOpen, 
  Eye, 
  EyeOff,
  ArrowLeft,
  ChevronRight,
  Shield,
  Zap,
  TrendingUp,
  Award,
  MoreVertical,
  Check,
  ClipboardCheck,
  Flame,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import { useSEO } from '../hooks/useSEO';

export default function ListDetail() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { series, loading: appLoading } = useApp();

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const isOwner = currentUser?.id === list?.user_id;

  useSEO({
    title: list?.name ? `${list.name} - Koleksiyon` : 'Koleksiyon Detayı',
    description: list?.description || 'MahoraPeak koleksiyon detay sayfası.',
    url: `https://mahorapeak.com.tr/list/${listId}`
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchListData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch List
      const { data: listData, error: listErr } = await supabase
        .from('custom_lists')
        .select('*, profiles(username, avatar_url)')
        .eq('id', listId)
        .single();
      
      if (listErr) throw listErr;
      
      if (!listData.is_public && currentUser?.id !== listData.user_id) {
          setIsPrivate(true);
          setLoading(false);
          return;
      }
      
      console.log("Supabase'den Gelen Liste Verisi:", listData);
      setList(listData);
      setEditTitle(listData.name);
      setEditDesc(listData.description || '');
      setEditIsPublic(listData.is_public ?? true);

      // Fetch Items with Deep Join
      const { data: items, error: itemsErr } = await supabase
        .from('custom_list_items')
        .select('*, series(id, title, cover, slug)')
        .eq('list_id', listId)
        .order('created_at', { ascending: false });
      
      if (itemsErr) throw itemsErr;
      console.log("Supabase'den Gelen Derin Liste İçeriği (JOIN):", items);
      setListItems(items || []);

      // Fetch Likes (Try/Catch ile izole edildi, DB tablosu yoksa patlamasın)
      try {
        const { data: likes, error: likesErr } = await supabase
          .from('custom_list_likes')
          .select('*')
          .eq('list_id', listId);
        
        if (likesErr) throw likesErr;
        const safeLikes = likes || [];
        setLikesCount(safeLikes.length);
        setIsLiked(currentUser ? safeLikes.some(l => l.user_id === currentUser.id) : false);
      } catch (likesErr) {
        console.warn("Beğeniler çekilirken hata (tablo eksik olabilir):", likesErr);
        setLikesCount(0);
        setIsLiked(false);
      }

    } catch (err) {
      console.error("Fetch list error:", err);
      // navigate('/'); // Sorun çözülene kadar anasayfaya yönlendirmeyi durduruyoruz.
    } finally {
      setLoading(false);
    }
  }, [listId, currentUser, navigate]);

  useEffect(() => {
    fetchListData();
  }, [fetchListData]);

  // Dinamik İstatistik Motoru (Derin Veri)
  const stats = useMemo(() => {
    if (!listItems?.length) return { count: 0, avgScore: "0.0" };
    
    let totalScore = 0;
    let validCount = 0;

    listItems?.forEach(item => {
      // Eğer JOIN başarılıysa veri item.series içinde, değilse fallback olarak global series'den bak
      const s = item.series || series?.find(ser => String(ser.id) === String(item.series_id));
      if (s && s.rating) {
        const ratingVal = parseFloat(s.rating);
        if (!isNaN(ratingVal) && ratingVal > 0) {
          totalScore += ratingVal;
          validCount++;
        }
      }
    });

    const avg = validCount > 0 ? (totalScore / validCount).toFixed(1) : "0.0";
    return { count: listItems?.length || 0, avgScore: avg };
  }, [listItems, series]);

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('custom_lists')
        .update({ name: editTitle, description: editDesc, is_public: editIsPublic })
        .eq('id', listId);
      if (error) throw error;
      setList(prev => ({ ...prev, name: editTitle, description: editDesc, is_public: editIsPublic }));
      setIsEditing(false);
      showToast('Liste başarıyla güncellendi!');
    } catch (err) {
      showToast('Güncelleme hatası uşağım!');
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) return;
    try {
      if (isLiked) {
        await supabase.from('custom_list_likes').delete().eq('list_id', listId).eq('user_id', currentUser.id);
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await supabase.from('custom_list_likes').insert({ list_id: listId, user_id: currentUser.id });
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  };

  const handleAddSeries = async (sId) => {
    const eklenecekVeri = { list_id: listId, series_id: String(sId) };
    console.log("Eklenen Veri:", eklenecekVeri);

    try {
      const { data: inserted, error } = await supabase
        .from('custom_list_items')
        .insert(eklenecekVeri)
        .select('*, series(id, title, cover, slug)')
        .single();
      
      if (error) {
        if (error.code === '23505') showToast('Bu seri zaten mühürlenmiş!');
        else {
          console.error("Insert Error:", error);
          showToast('Ekleme hatası uşağım!');
        }
        return;
      }

      if (inserted) {
        console.log("Mermi Hedefe Ulaştı (Optimistic):", inserted);
        setListItems(prev => [inserted, ...prev]);
        setShowAddModal(false);
        showToast('Seri listeye mühürlendi!');
      }
    } catch (err) {
      console.error("Ekleme Hatası:", err);
      showToast('Ekleme başarısız uşağım!');
    }
  };

  const handleIncrementProgress = async (itemId, current) => {
    try {
      const newVal = (current || 0) + 1;
      const { error } = await supabase
        .from('custom_list_items')
        .update({ read_chapters: newVal })
        .eq('id', itemId);
      if (error) throw error;
      setListItems(prev => prev.map(i => i.id === itemId ? { ...i, read_chapters: newVal } : i));
    } catch (err) {
      console.error("Increment error:", err);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!confirm('Bu seriyi listeden kaldırmak istediğine emin misin?')) return;
    try {
      await supabase.from('custom_list_items').delete().eq('id', itemId);
      setListItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Seri listeden kaldırıldı.');
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm('Bu listeyi ebediyen silmek istediğine emin misin uşağım?')) return;
    try {
      await supabase.from('custom_lists').delete().eq('id', listId);
      navigate(-1);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast('Bağlantı kopyalandı! 🚀');
  };

  if (loading) return <Loader text="Sayfa Yükleniyor..." />;
  
  if (isPrivate) return (
    <div className="min-h-screen bg-[#070511] flex flex-col items-center justify-center p-6 text-center">
       <Shield size={80} className="text-red-500 mb-6 opacity-40 drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]" />
       <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Gizli Okuma Bölgesi</h1>
       <p className="text-zinc-500 text-sm mb-8">Bu koleksiyon ustası tarafından mühürlenmiş ve gizli tutuluyor uşağım.</p>
       <button onClick={() => navigate(-1)} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-black uppercase text-xs hover:text-white transition-all">Geri Dön</button>
    </div>
  );

  if (!list) return (
    <div className="min-h-screen bg-[#070511] flex flex-col items-center justify-center p-6 text-center">
       <X size={80} className="text-red-500 mb-6 opacity-20" />
       <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Koleksiyon Bulunamadı</h1>
       <p className="text-zinc-500 text-sm mb-8">Aradığın liste mühürlenmiş veya silinmiş olabilir uşağım.</p>
       <button onClick={() => navigate(-1)} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-black uppercase text-xs hover:text-white transition-all">Geri Dön</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070511] pb-20 relative overflow-hidden text-zinc-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* ── CINEMATIC HERO HEADER ── */}
      <div className="relative w-full h-[60vh] min-h-[500px] overflow-hidden flex items-end mb-12">
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/70 to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070511] to-transparent z-10" />
        
        {listItems?.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.3, scale: 1 }}
            className="absolute inset-0 flex flex-wrap gap-0 blur-[8px] scale-105 z-0"
          >
            {listItems?.slice(0, 16).map((item, idx) => {
              const s = item.series || series?.find(ser => String(ser.id) === String(item.series_id));
              return s ? <img key={idx} src={s.cover} alt="" className="w-1/4 h-1/2 object-cover opacity-80 mix-blend-screen" loading="lazy" /> : null;
            })}
          </motion.div>
        )}
        
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-28 pb-12">
          {/* Navigation */}
          <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-all">
              <ArrowLeft size={16} />
            </div>
            Geri Dön
          </button>
          
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
            <div className="flex-1">
              {isEditing ? (
                <input 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="text-4xl sm:text-7xl lg:text-8xl font-black text-white bg-black/40 border border-white/10 rounded-2xl px-6 py-4 w-full outline-none focus:border-indigo-500 transition-all uppercase tracking-tighter shadow-2xl drop-shadow-2xl mb-4"
                  placeholder="Liste Adı..."
                />
              ) : (
                <div className="flex items-center gap-6 mb-4">
                  <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[1] drop-shadow-2xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
                    {list.name}
                  </h1>
                  {isOwner && (
                    <button onClick={() => setIsEditing(true)} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-indigo-500/50 transition-all shadow-xl">
                      <Edit3 size={24} />
                    </button>
                  )}
                </div>
              )}

              {isEditing ? (
                <>
                  <textarea 
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="text-lg text-zinc-300 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 w-full max-w-2xl outline-none focus:border-indigo-500 transition-all resize-none shadow-2xl drop-shadow-md"
                    rows={3}
                    placeholder="Bu koleksiyonun hikayesi nedir uşağım?"
                  />
                  <div className="flex items-center justify-between p-4 mt-4 rounded-xl bg-black/40 border border-white/10 max-w-2xl">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${editIsPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                           {editIsPublic ? <Eye size={20} /> : <EyeOff size={20} />}
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-white">{editIsPublic ? 'Herkese Açık' : 'Gizli Liste'}</h4>
                           <p className="text-[10px] text-zinc-400">{editIsPublic ? 'Bu listeyi herkes görebilir' : 'Sadece sen görebilirsin'}</p>
                        </div>
                     </div>
                     <button type="button" onClick={() => setEditIsPublic(!editIsPublic)} className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${editIsPublic ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${editIsPublic ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>
                </>
              ) : (
                <p className="text-slate-200 text-lg sm:text-xl max-w-2xl font-medium drop-shadow-md border-l-4 border-indigo-500/50 pl-6 py-2">
                  {list.description || 'Bu kadim koleksiyon için henüz bir açıklama mühürlenmemiş...'}
                </p>
              )}
              
              {isEditing && (
                <div className="flex gap-4 mt-6">
                   <button onClick={handleUpdate} className="px-10 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all">Kaydet</button>
                   <button onClick={() => setIsEditing(false)} className="px-10 py-4 bg-black/40 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:text-white transition-all">İptal</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-30">
        
        {/* Navigation & Header (Artık yukarıdaki Hero alanında) */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-16">
           <div className="space-y-4 flex-1 hidden md:block">
              {/* Desktop boşluk, içerik yukarı taşındı */}
           </div>


           {/* Stats & Actions Card */}
           <div className="w-full md:w-auto min-w-[320px] p-8 rounded-[2.5rem] bg-zinc-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl space-y-8">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <img src={list.profiles?.avatar_url} alt={`${list.profiles?.username || 'Kullanıcı'} avatarı`} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20 shadow-lg" />
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Oluşturan</span>
                       <Link to={`/profil/${list.profiles?.username}`} className="text-[11px] font-black text-white hover:text-indigo-400 transition-colors">@{list.profiles?.username}</Link>
                    </div>
                 </div>
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${list.is_public ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {list.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span className="text-[9px] font-black uppercase tracking-widest">{list.is_public ? 'Açık' : 'Gizli'}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-black text-white">{stats.count}</p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Toplam Seri</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-black text-indigo-400">{stats.avgScore}</p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Ort. Puan</p>
                 </div>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={handleToggleLike}
                   aria-label="Beğen"
                   className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all ${
                     isLiked 
                       ? 'bg-rose-500 border-rose-400 text-white shadow-xl shadow-rose-500/30' 
                       : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                   }`}
                 >
                    <Star size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{likesCount}</span>
                 </button>
                 <button 
                   onClick={handleShare}
                   aria-label="Paylaş"
                   className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all"
                 >
                    <Share2 size={18} />
                    PAYLAŞ
                 </button>
              </div>

              {isOwner && (
                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                    >
                       <Plus size={16} /> EKLE
                    </button>
                    <button 
                      onClick={handleDeleteList}
                      aria-label="Listeyi sil"
                      className="p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    >
                       <X size={16} />
                    </button>
                 </div>
              )}
           </div>
        </div>

        {/* Dynamic Table Section */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                   <LayoutGrid className="text-indigo-500" /> KOLEKSİYON İÇERİĞİ
                 </h2>
                 <span className="h-px w-32 bg-gradient-to-r from-indigo-500/50 to-transparent" />
              </div>
           </div>



           <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="w-full border-separate border-spacing-y-4">
                 <thead>
                    <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-left">
                       <th className="px-8 pb-4 font-black">#</th>
                       <th className="px-4 pb-4">Seri Bilgisi</th>
                       <th className="px-4 pb-4 text-center">Puan</th>
                       <th className="px-4 pb-4">Tür</th>
                       <th className="px-4 pb-4 text-center">İlerleme</th>
                       <th className="px-4 pb-4 text-center">Durum</th>
                       <th className="px-8 pb-4 text-right">İşlem</th>
                    </tr>
                 </thead>
                 <tbody>
                    {listItems?.map((item, idx) => {
                      const s = item.series || series?.find(ser => String(ser.id) === String(item.series_id));
                      if (!s) return null;
                      return (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group bg-zinc-950/40 backdrop-blur-2xl border border-white/5 hover:bg-white/5 transition-all duration-300"
                        >
                           {/* Rank */}
                           <td className="px-8 py-4 rounded-l-[1.5rem] border-y border-l border-white/5">
                              <span className="text-lg font-black text-zinc-700 group-hover:text-indigo-500 transition-colors">{(idx + 1).toString().padStart(2, '0')}</span>
                           </td>

                           {/* Series Info */}
                           <td className="px-4 py-4 border-y border-white/5">
                              <div className="flex items-center gap-6">
                                 <div className="relative w-16 h-24 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                    <img src={s.cover} alt={s.title} className="w-full h-full object-cover" loading="lazy" decoding="async" width={64} height={96} />
                                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/20 transition-all" />
                                 </div>
                                 <div className="flex flex-col gap-1">
                                    <Link to={`/manga/${s.slug}`} className="text-sm font-black text-white hover:text-indigo-400 transition-all uppercase tracking-tight line-clamp-1">{s.title}</Link>
                                    <div className="flex items-center gap-3">
                                       <span className="text-[10px] text-zinc-500 font-bold uppercase">{s.author || 'Anonim'}</span>
                                       <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                       <span className="text-[10px] text-zinc-500 font-bold">{s.year}</span>
                                    </div>
                                 </div>
                              </div>
                           </td>

                           {/* Score */}
                           <td className="px-4 py-4 border-y border-white/5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                 <div className="flex items-center gap-1.5 text-amber-500">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm font-black text-white">{s.rating || '0.0'}</span>
                                 </div>
                                 {item.user_score > 0 && (
                                   <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest bg-card-navy/50 px-2 py-0.5 rounded-md border border-white/5">SİZ: {item.user_score}/10</span>
                                 )}
                              </div>
                           </td>

                           {/* Genre */}
                           <td className="px-4 py-4 border-y border-white/5">
                              <div className="flex flex-wrap gap-2 max-w-[150px]">
                                 {s.genre?.slice(0, 2).map((g, i) => (
                                   <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[9px] font-black text-indigo-400 uppercase tracking-tight">{g}</span>
                                 ))}
                              </div>
                           </td>

                           {/* Progress */}
                           <td className="px-4 py-4 border-y border-white/5">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                       <span className="text-sm font-black text-white tracking-tighter">{item.read_chapters || 0}</span>
                                       <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Bölüm</span>
                                    </div>
                                    <div className="h-6 w-px bg-zinc-800" />
                                    <div className="flex flex-col items-center">
                                       <span className="text-sm font-black text-zinc-500 tracking-tighter">?</span>
                                       <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Toplam</span>
                                    </div>
                                 </div>
                                 {isOwner && (
                                   <button 
                                     onClick={() => handleIncrementProgress(item.id, item.read_chapters)}
                                     aria-label="Bölüm artır"
                                     className="w-10 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                                   >
                                      <Plus size={14} />
                                   </button>
                                 )}
                              </div>
                           </td>

                           {/* Status */}
                           <td className="px-4 py-4 border-y border-white/5 text-center">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                item.status === 'Okuyor' 
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                                : item.status === 'Tamamladı' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-800/50 border-white/5 text-zinc-500'
                              }`}>
                                 {item.status || 'Okuyor'}
                              </span>
                           </td>

                           {/* Actions */}
                           <td className="px-8 py-4 rounded-r-[1.5rem] border-y border-r border-white/5 text-right">
                              {isOwner ? (
                                <button 
                                  onClick={() => handleRemoveItem(item.id)}
                                  aria-label="Kaldır"
                                  className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                   <Minus size={16} />
                                </button>
                              ) : (
                                <Link to={`/manga/${s.slug}`} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-500 flex items-center justify-center hover:border-indigo-500/50 hover:text-white transition-all">
                                   <ChevronRight size={18} />
                                </Link>
                              )}
                           </td>
                        </motion.tr>
                      );
                    })}
                    {listItems?.length === 0 && (
                       <tr>
                          <td colSpan={7} className="py-40 text-center">
                             <div className="flex flex-col items-center gap-6 opacity-20">
                                <BookOpen size={80} />
                                <p className="text-lg font-black uppercase tracking-[0.5em]">BU KOLEKSİYON HENÜZ BOŞ</p>
                             </div>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* Add Series Modal */}
      {createPortal(
        <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAddModal(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-xl bg-card-navy border border-white/10 rounded-[3rem] p-10 shadow-[0_0_80px_rgba(0,0,0,1)]"
             >
                <div className="flex items-center justify-between mb-8">
                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Seri Mühürle</h4>
                   <button onClick={() => setShowAddModal(false)} aria-label="Kapat" className="p-2 text-zinc-500 hover:text-white transition-all"><X /></button>
                </div>

                <div className="relative mb-8">
                   <input 
                     type="text"
                     autoFocus
                     placeholder="Seri ismini yaz uşağım..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                   />
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-3 pr-2">
                   {series?.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 15).map(s => (
                     <button 
                       key={s.id}
                       onClick={() => handleAddSeries(s.id)}
                       className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-indigo-600/10 border border-transparent hover:border-indigo-500/30 transition-all text-left group"
                     >
                        <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 shadow-lg">
                           <img src={s.cover} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" width={56} height={80} />
                        </div>
                        <div className="flex-1">
                           <p className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">{s.title}</p>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{s.genre?.[0] || 'Aksiyon'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                           <Plus size={18} />
                        </div>
                     </button>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Toast Notification */}
      <AnimatePresence>
         {toast && (
           <motion.div 
             initial={{ opacity: 0, y: 50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.9 }}
             className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 flex items-center gap-4 border border-indigo-400/30"
           >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                 <ClipboardCheck size={18} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{toast}</span>
           </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
