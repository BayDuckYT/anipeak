import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, BookOpen, ArrowLeft, Heart, Bookmark,
  Clock, CheckCircle, Play, ChevronRight, Calendar, User,
  Flame, Lock, Sparkles, Search, SortAsc, Star, ListPlus, Plus, X, Trash2
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
          name: newListName.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      setUserLists(prev => [...prev, { ...data, custom_list_items: [] }]);
      setNewListName('');
      setShowCreateInput(false);
    } catch (err) {
      console.error("Create list error:", err);
    }
  };

  useEffect(() => {
    if (showListModal) fetchUserLists();
  }, [showListModal]);

  if (!manhwa) return null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-16"
    >
      {/* ── HERO ── */}
      <div className="relative">
        <div
          className="absolute inset-0 h-[450px] bg-cover bg-center blur-3xl opacity-20 scale-105"
          style={{ backgroundImage: `url(${manhwa.cover})` }}
        />
        <div className="absolute inset-0 h-[450px] bg-gradient-to-b from-[#050507]/40 via-[#050507]/60 to-[#050507]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-0">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Geri Dön
          </Link>

          <div className="flex flex-col sm:flex-row gap-8">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
              className="flex-shrink-0 mx-auto sm:mx-0"
            >
              <img
                src={getOptimizedImage(manhwa?.cover, 400)}
                alt={manhwa?.title}
                onError={handleImageError}
                width={240}
                height={320}
                fetchpriority="high"
                decoding="async"
                className="w-48 h-64 sm:w-60 sm:h-80 rounded-2xl object-cover shadow-[0_0_50px_rgba(139,92,246,0.3)] border border-white/10"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    manhwa.status === 'Devam Ediyor' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                  }`}>
                  {manhwa.status}
                </span>
                {manhwa.is_trending && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 flex items-center gap-1">
                    <Flame size={10} className="fill-orange-400" /> Trend
                  </span>
                )}
                {manhwa.genre?.map(g => (
                  <span key={g} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 uppercase tracking-wider">{g}</span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tighter leading-tight">{manhwa.title}</h1>
              
              <div className="flex items-center gap-4 text-slate-400 text-sm mb-5">
                <span className="flex items-center gap-1.5"><User size={14} /> {manhwa.author}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {manhwa.year}</span>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-2xl line-clamp-4 sm:line-clamp-none">{manhwa.description}</p>

              {/* Stats & Rating */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-8 p-4 sm:p-6 glass rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-6 justify-between sm:justify-start">
                  <div className="text-left sm:text-center">
                    <div className="text-2xl font-black text-white">{manhwa.rating || '0.0'}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Global Puan</div>
                  </div>
                  <StarRating seriesId={manhwa.id} initialRating={manhwa.rating} />
                </div>
                <div className="flex flex-wrap gap-4 sm:gap-8">
                  <div className="flex-1 min-w-[100px]">
                    <div className="text-lg font-black text-white flex items-center gap-1.5"><Eye size={16} className="text-purple-400" /> {formatNum(manhwa.reads_num)}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Okunma</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-white flex items-center gap-1.5"><BookOpen size={16} className="text-blue-400" /> {allChapters.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Bölüm</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleReadChapter(continueChapter || (filteredChapters[filteredChapters.length - 1]?.number))}
                  className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-sm hover:scale-105 transition-all shadow-neon-purple active:scale-95 touch-manipulation"
                >
                  <Play size={18} /> {continueChapter ? `Bölüm ${continueChapter}'den Devam Et` : 'Okumaya Başla'}
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => user ? setShowListModal(true) : onAuthOpen('login')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl glass border border-white/10 text-slate-400 hover:text-white hover:border-purple-500/50 transition-all group active:scale-95 touch-manipulation"
                  >
                    <ListPlus size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Listeye Ekle</span>
                  </button>
                  <button
                    onClick={() => user ? setBookmarked(!bookmarked) : onAuthOpen('login')}
                    className={`flex-1 sm:flex-none p-4 rounded-2xl border transition-all active:scale-95 touch-manipulation flex items-center justify-center ${bookmarked ? 'bg-purple-600 text-white border-purple-500 shadow-neon-purple' : 'glass border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <Bookmark size={20} className={bookmarked ? 'fill-white' : ''} />
                  </button>
                  <button
                    onClick={() => user ? setLiked(!liked) : onAuthOpen('login')}
                    className={`flex-1 sm:flex-none p-4 rounded-2xl border transition-all active:scale-95 touch-manipulation flex items-center justify-center ${liked ? 'bg-pink-600 text-white border-pink-500 shadow-neon-pink' : 'glass border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <Heart size={20} className={liked ? 'fill-white' : ''} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Left: Chapters */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <BookOpen size={24} className="text-purple-400" />
                Bölümler Listesi
              </h2>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ara..."
                    className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 w-24 sm:w-32 transition-all"
                  />
                </div>
                <button
                  onClick={() => setSortDesc(!sortDesc)}
                  className="p-2.5 rounded-xl glass border border-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <SortAsc size={18} className={sortDesc ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {filteredChapters.map((ch, idx) => (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                    onClick={() => handleReadChapter(ch.number)}
                    className="group flex items-center gap-4 px-6 py-4 glass border border-white/5 rounded-2xl hover:border-purple-500/30 hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center font-black text-slate-300 group-hover:from-purple-600/20 group-hover:to-blue-600/20 group-hover:text-purple-400 transition-all border border-white/5 text-xs">
                      {ch.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm text-white font-bold group-hover:text-purple-300 transition-colors">Bölüm {ch.number}</span>
                        {ratingsMap[ch.number] && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                             <Star size={10} className="fill-emerald-400 text-emerald-400" />
                             <span className="text-emerald-400 text-[10px] font-black">{ratingsMap[ch.number].toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Sidebar (Stats, etc. could go here) */}
          <div className="lg:col-span-1">
             <div className="glass border border-white/5 rounded-3xl p-8 sticky top-24">
                <h3 className="text-lg font-black text-white mb-6 uppercase italic tracking-tighter">Seri İstatistikleri</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-slate-400 text-xs font-bold uppercase">Toplam Okunma</span>
                    <span className="text-purple-400 font-black">{manhwa.reads_num || 0}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-slate-400 text-xs font-bold uppercase">Bölüm Sayısı</span>
                    <span className="text-white font-black">{allChapters.length}</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* BOTTOM: Comments (Exactly like the Reader page) */}
        <div className="max-w-2xl mx-auto pt-8 border-t border-white/5">
           <CommentSystem seriesId={manhwa.id} />
        </div>
      </div>

      {/* ── ADD TO LIST MODAL ── */}
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
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreateInput(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 text-xs font-black uppercase">İptal</button>
                    <button onClick={handleCreateList} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-black uppercase">Oluştur</button>
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
      </AnimatePresence>
    </motion.main>
  );
}
