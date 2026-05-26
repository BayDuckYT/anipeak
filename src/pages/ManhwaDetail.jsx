import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, BookOpen, ArrowLeft, Heart, Bookmark,
  Clock, CheckCircle, Play, ChevronRight, Calendar, User,
  Flame, Lock, Sparkles, Search, SortAsc, Star, ListPlus, Plus, X, Trash2,
  Share2, MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabaseClient';
import StarRating from '../components/StarRating.jsx';
import CommentSystem from '../components/CommentSystem.jsx';
import { useSEO } from '../hooks/useSEO.js';
import { getOptimizedImage, handleImageError } from '../utils/imageOpt.js';

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n?.toString() || '0';
}

export default function ManhwaDetail({ onAuthOpen }) {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user, readingHistory } = useAuth();
  const { sortedSeries, getChapters } = useApp();

  // Find series from AppContext (dynamic data)
  const manhwa = useMemo(
    () => sortedSeries.find((m) => String(m.id) === String(id)),
    [sortedSeries, id]
  );

  useSEO({
    title: manhwa ? `${manhwa.title} Oku` : 'Yükleniyor...',
    description: manhwa ? manhwa.description : 'AniPeak - En iyi Manhwa ve Webtoon platformu.',
    image: manhwa ? manhwa.cover : '',
    url: window.location.href
  });

  // All chapters from AppContext
  const allChapters = useMemo(
    () => getChapters(manhwa?.id),
    [getChapters, manhwa?.id]
  );

  const [bookmarked, setBookmarked]   = useState(false);
  const [liked, setLiked]             = useState(false);
  const [search, setSearch]           = useState('');
  const [sortDesc, setSortDesc]       = useState(true); // newest first
  const [showListModal, setShowListModal] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(true);
  const [showCreateInput, setShowCreateInput] = useState(false);

  const history         = readingHistory?.find((h) => h.manhwaId === manhwa?.id);
  const continueChapter = history?.lastChapter;

  // Filter + sort
  const [ratingsMap, setRatingsMap]  = useState({});

  // Filter + sort
  const filteredChapters = useMemo(() => {
    let list = [...allChapters];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (ch) =>
          String(ch.number).includes(q) ||
          (ch.title && ch.title.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) =>
      sortDesc ? b.number - a.number : a.number - b.number
    );
    return list;
  }, [allChapters, search, sortDesc]);

  // Fetch all chapter ratings for this series
  useEffect(() => {
    const fetchChapterRatings = async () => {
      if (!manhwa?.id) return;
      const { data } = await supabase
        .from('chapter_ratings')
        .select('chapter_num, value')
        .eq('series_id', manhwa.id);
      
      if (data) {
        const map = {};
        const sums = {};
        const counts = {};

        data.forEach(r => {
          sums[r.chapter_num] = (sums[r.chapter_num] || 0) + r.value;
          counts[r.chapter_num] = (counts[r.chapter_num] || 0) + 1;
        });

        Object.keys(sums).forEach(num => {
          map[num] = (sums[num] / counts[num]) * 2; // Scale to 10
        });
        setRatingsMap(map);
      }
    };
    fetchChapterRatings();
  }, [manhwa?.id]);

  const handleReadChapter = (chNum) => {
    navigate(`/read/${manhwa.id}/${chNum}`);
  };

  const fetchUserLists = async () => {
    if (!user?.id) return;
    setListLoading(true);
    try {
      const { data } = await supabase
        .from('custom_lists')
        .select('*, custom_list_items(series_id)')
        .eq('user_id', user.id);
      setUserLists(data || []);
    } catch (err) {
      console.error("Fetch lists error:", err);
    } finally {
      setListLoading(false);
    }
  };

  const handleAddToList = async (listId) => {
    try {
      const { error } = await supabase
        .from('custom_list_items')
        .insert({
          list_id: listId,
          series_id: manhwa.id
        });
      
      if (error) throw error;
      
      // Update local state
      setUserLists(prev => prev.map(l => 
        l.id === listId 
          ? { ...l, custom_list_items: [...(l.custom_list_items || []), { series_id: manhwa.id }] }
          : l
      ));
    } catch (err) {
      console.error("Add to list error:", err);
      alert("Bu seri zaten listede olabilir!");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const { data, error } = await supabase
        .from('custom_lists')
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          is_public: newListIsPublic
        })
        .select()
        .single();
      
      if (error) throw error;
      setUserLists(prev => [...prev, { ...data, custom_list_items: [] }]);
      setNewListName('');
      setNewListIsPublic(true);
      setShowCreateInput(false);
    } catch (err) {
      console.error("Create list error:", err);
    }
  };

  useEffect(() => {
    if (showListModal) fetchUserLists();
  }, [showListModal]);

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [visibleChapters, setVisibleChapters] = useState(28);

  if (!manhwa) return null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#070511]"
    >
      {/* ── HERO ── */}
      <div className="relative w-full overflow-hidden min-h-[60vh] lg:min-h-[80vh] flex items-end">
        {/* Full width edge-to-edge background */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${manhwa.hero_bg ? 'opacity-60 lg:opacity-80 object-top' : 'blur-xl opacity-30 scale-110'}`}
          style={{ backgroundImage: `url(${manhwa.hero_bg || manhwa.cover})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/80 to-transparent lg:w-[75%]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070511] to-transparent z-10" />

        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-28 pb-12 flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-end">
          
          <Link to="/" className="absolute top-6 left-4 sm:left-6 lg:left-8 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md text-slate-300 hover:text-white border border-white/10 hover:border-white/30 text-sm transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Geri Dön
          </Link>

          {/* Left Poster */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex-shrink-0 w-48 sm:w-64 lg:w-72 relative group mt-12 lg:mt-0"
          >
            <div className="absolute -inset-4 bg-gradient-to-t from-purple-600/30 to-blue-600/30 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity rounded-3xl" />
            <img
              src={getOptimizedImage(manhwa?.cover, 600)}
              alt={manhwa?.title}
              onError={handleImageError}
              width={288}
              height={432}
              fetchpriority="high"
              decoding="async"
              className="w-full aspect-[2/3] rounded-2xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 relative z-10"
            />
            {/* Hover Play Button */}
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 backdrop-blur-sm rounded-2xl cursor-pointer" onClick={() => handleReadChapter(continueChapter || (filteredChapters[filteredChapters.length - 1]?.number))}>
              <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-110 transition-transform">
                <Play size={24} className="text-white ml-1 fill-white" />
              </div>
            </div>
          </motion.div>

          {/* Right Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 min-w-0 w-full text-center lg:text-left"
          >
            {/* Tags */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 flex items-center gap-1">
                <Star size={12} className="fill-amber-400" /> {manhwa.rating || '0.0'}
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  manhwa.status === 'Devam Ediyor' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                }`}>
                {manhwa.status}
              </span>
              {manhwa.year && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 tracking-widest">
                  {manhwa.year}
                </span>
              )}
              {manhwa.genre?.slice(0, 3).map(g => (
                <span key={g} className="px-3 py-1 rounded-sm text-[10px] font-bold text-slate-300 border border-slate-600 uppercase tracking-wider">{g}</span>
              ))}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tighter leading-none drop-shadow-2xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
              {manhwa.title}
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-3xl mx-auto lg:mx-0 drop-shadow-md">
              {showFullDesc ? manhwa.description : `${manhwa.description?.substring(0, 200) || ''}... `}
              {manhwa.description?.length > 200 && (
                <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-purple-400 hover:text-purple-300 font-bold ml-1 transition-colors">
                  {showFullDesc ? 'Daha az göster' : 'Daha fazla göster'}
                </button>
              )}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-8">
              <button
                onClick={() => handleReadChapter(continueChapter || (filteredChapters[filteredChapters.length - 1]?.number))}
                className="w-full sm:w-auto px-10 py-4 bg-white text-black font-black text-lg rounded-md hover:bg-white/80 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <BookOpen size={20} className="text-black" /> {continueChapter ? 'KALDIĞIN YERDEN' : 'OKUMAYA BAŞLA'}
              </button>

              <button
                onClick={() => user ? setShowListModal(true) : onAuthOpen('login')}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-md bg-[#2a2a2a]/80 backdrop-blur-md text-white hover:bg-[#3a3a3a] transition-all font-bold text-sm active:scale-95 shadow-lg border border-white/10"
              >
                <Plus size={20} /> <span className="hidden sm:inline">Listeye Ekle</span>
              </button>

              <button
                onClick={() => user ? setLiked(!liked) : onAuthOpen('login')}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl backdrop-blur-md border transition-all font-bold text-sm active:scale-95 whitespace-nowrap ${liked ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
              >
                <Heart size={18} className={liked ? 'fill-pink-400' : ''} /> <span className="hidden sm:inline">Beğen</span>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Bağlantı kopyalandı!");
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all font-bold text-sm active:scale-95 whitespace-nowrap"
              >
                <Share2 size={18} /> <span className="hidden sm:inline">Paylaş</span>
              </button>
              
              <button
                onClick={() => {
                  document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#2A2D43]/80 backdrop-blur-md border border-[#3E4366] text-white hover:bg-[#3E4366] transition-all font-bold text-sm active:scale-95 whitespace-nowrap"
              >
                <MessageCircle size={18} /> <span className="hidden sm:inline">Yorumlar</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Puan Kutusu (StarRating ile) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-[#0f111a] border border-[#1f2233] rounded-xl p-4 sm:p-5 flex flex-col justify-center hover:border-purple-500/30 transition-colors group col-span-2 sm:col-span-1"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">PUAN</div>
              <div className="flex items-center gap-1.5">
                 <Star size={14} className="text-amber-400 fill-amber-400" />
                 <span className="text-sm sm:text-base font-bold text-amber-400">{manhwa.rating || '0.0'}</span>
              </div>
            </div>
            <StarRating seriesId={manhwa.id} initialRating={manhwa.rating} />
          </motion.div>

          {/* Diğer Kutular */}
          {[
            { label: 'BÖLÜM', value: allChapters.length, icon: BookOpen, color: 'text-blue-400' },
            { label: 'YIL', value: manhwa.year || '2024', icon: Calendar, color: 'text-slate-300' },
            { label: 'DURUM', value: manhwa.status, icon: Sparkles, color: manhwa.status === 'Devam Ediyor' ? 'text-emerald-400' : 'text-blue-400' },
            { label: 'YAZAR/STÜDYO', value: manhwa.author || 'Bilinmiyor', icon: User, color: 'text-purple-400' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 + (i * 0.1) }}
              className="bg-[#0f111a] border border-[#1f2233] rounded-xl p-4 sm:p-5 flex flex-col justify-center hover:border-purple-500/30 transition-colors group"
            >
              <div className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</div>
              <div className="flex items-center gap-2">
                 <stat.icon size={14} className={`${stat.color} group-hover:scale-110 transition-transform`} />
                 <span className="text-sm sm:text-base font-bold text-white truncate">{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CHAPTERS GRID & COMMENTS ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              Bölümler <span className="text-sm font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full">{filteredChapters.length} Bölüm</span>
            </h2>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bölüm ara..."
                  className="w-full sm:w-48 bg-[#0f111a] border border-[#1f2233] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className="p-2.5 rounded-xl bg-[#0f111a] border border-[#1f2233] text-slate-400 hover:text-white transition-all flex-shrink-0"
                aria-label="Sırala"
              >
                <SortAsc size={18} className={sortDesc ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>

          {/* Grid View for Chapters */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredChapters.slice(0, visibleChapters).map((ch) => (
                <motion.div
                  key={ch.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleReadChapter(ch.number)}
                  className="relative group cursor-pointer"
                  title={ch.title ? `Bölüm ${ch.number} - ${ch.title}` : `Bölüm ${ch.number}`}
                >
                  <div className="flex items-center justify-center p-4 bg-[#0f111a] border border-[#1f2233] rounded-xl group-hover:bg-purple-600/10 group-hover:border-purple-500/40 transition-all text-slate-300 group-hover:text-purple-400 font-bold text-sm shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    {ch.number}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Show More / Show Less Buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {filteredChapters.length > visibleChapters && (
              <button 
                onClick={() => setVisibleChapters(prev => prev + 28)}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-[#1f2233] bg-[#0f111a] text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm font-bold active:scale-95"
              >
                Daha Fazla Göster <ChevronDown size={16} />
              </button>
            )}
            {visibleChapters > 28 && (
              <button 
                onClick={() => setVisibleChapters(prev => Math.max(28, prev - 28))}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-[#1f2233] bg-[#0f111a] text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm font-bold active:scale-95"
              >
                Daha Az Göster <ChevronUp size={16} />
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM: Comments */}
        <div id="comments-section" className="max-w-4xl mx-auto pt-8 border-t border-[#1f2233] scroll-mt-24">
           <CommentSystem seriesId={manhwa.id} />
        </div>
      </div>

      {/* ── ADD TO LIST MODAL ── */}
      {createPortal(
        <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowListModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0D1117] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Listeye Ekle</h3>
                <button onClick={() => setShowListModal(false)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                {listLoading ? (
                  <div className="py-10 text-center text-slate-500 text-xs font-bold uppercase animate-pulse">Listeler Yükleniyor...</div>
                ) : userLists.length > 0 ? (
                  userLists.map(list => {
                    const isInList = list.custom_list_items?.some(i => String(i.series_id) === String(manhwa.id));
                    return (
                      <button
                        key={list.id}
                        disabled={isInList}
                        onClick={() => handleAddToList(list.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          isInList 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:border-purple-500/50 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="text-sm font-bold">{list.name}</span>
                        {isInList ? <CheckCircle size={18} /> : <Plus size={18} />}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-slate-400 text-xs italic">Henüz bir listen yok.</div>
                )}
              </div>

              {showCreateInput ? (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Liste Adı..." 
                    autoFocus
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none"
                  />
                  <div className="flex items-center justify-between px-2 bg-black/20 py-2 rounded-xl border border-white/5">
                     <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
                        {newListIsPublic ? <Eye size={14} className="text-green-400"/> : <EyeOff size={14} className="text-red-400"/>}
                        <span className={newListIsPublic ? 'text-green-400' : 'text-red-400'}>{newListIsPublic ? 'Herkese Açık' : 'Gizli'}</span>
                     </div>
                     <button type="button" onClick={() => setNewListIsPublic(!newListIsPublic)} className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${newListIsPublic ? 'bg-green-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${newListIsPublic ? 'left-5' : 'left-1'}`} />
                     </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreateInput(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 text-xs font-black uppercase transition-colors hover:bg-white/10 hover:text-white">İptal</button>
                    <button onClick={handleCreateList} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-black uppercase shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition-colors">Oluştur</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowCreateInput(true)}
                  className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Yeni Liste Oluştur
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </motion.main>
  );
}
