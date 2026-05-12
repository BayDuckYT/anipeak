import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Trash2, Clock, AlertTriangle, 
  Edit2, Heart, MoreHorizontal, X, CornerDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import AnimeAvatar from './AnimeAvatar';
import UserBadges from './UserBadges';
import effectsData from '../data/effects.json';

export default function CommentSystem({ seriesId, chapterNum }) {
  const { user, updateXP } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());
  
  // States for Reply & Edit
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const inputRef = useRef(null);

  // ── Fetch Logic
  const fetchComments = async () => {
    try {
      const sid = parseInt(seriesId);
      if (isNaN(sid)) return;

      // Fetch comments logic
      let query = supabase
        .from('comments')
        .select('*, profiles(*)');
      
      if (chapterNum) {
        query = query.eq('series_id', sid).eq('chapter_num', chapterNum);
      } else {
        query = query.eq('series_id', sid);
      }

      const { data: rawComments, error: commentError } = await query.order('created_at', { ascending: false });

      if (commentError) throw commentError;
      setComments(rawComments || []);
    } catch (err) {
      console.error('[COMMENTS] Yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel(`comments_realtime_${seriesId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [seriesId, chapterNum]);

  // ── Actions
  const toggleSpoiler = (id) => {
    const newRevealed = new Set(revealedSpoilers);
    if (newRevealed.has(id)) newRevealed.delete(id);
    else newRevealed.add(id);
    setRevealedSpoilers(newRevealed);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user) { alert("Yorum yapmak için giriş yapmalısın!"); return; }
    if (!text.trim()) return;
    if (loading) return;

    console.log("[COMMENTS] Gönderim başlatıldı...", { seriesId, chapterNum, userId: user.id });
    setLoading(true);
    try {
      const finalContent = replyTo ? `@${replyTo.username} ${text}` : text;
      
      const payload = {
        user_id: user.id,
        text: finalContent.trim(),
        series_id: parseInt(seriesId),
        chapter_num: chapterNum ? parseInt(chapterNum) : null,
        is_spoiler: isSpoiler
      };

      console.log("[COMMENTS] Payload:", payload);

      const { data, error } = await supabase.from('comments').insert([payload]).select();

      if (error) {
        console.error("[COMMENTS] DB Hatası:", error);
        alert(`Gönderim Hatası: ${error.message} (${error.code})`);
        throw error;
      }

      console.log("[COMMENTS] Başarıyla gönderildi:", data);
      
      setText('');
      setIsSpoiler(false);
      setReplyTo(null);
      
      // XP update should not block the UI or the success state
      try {
        if (updateXP) updateXP(10);
      } catch (xpErr) {
        console.warn("[COMMENTS] XP güncellenirken hata oluştu (önemsiz):", xpErr);
      }

      fetchComments();
    } catch (err) {
      console.error("[COMMENTS] Kritik Hata:", err);
      alert("Sistem hatası oluştu, konsolu kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditValue(comment.text);
  };

  const saveEdit = async (id) => {
    if (!editValue.trim()) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ text: editValue.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchComments();
    } catch (err) { console.error('Edit error:', err); }
  };

  const handleLike = async (comment) => {
    if (!user) return;
    try {
      const newLikes = (comment.likes || 0) + 1;
      await supabase.from('comments').update({ likes: newLikes }).eq('id', comment.id);
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, likes: newLikes } : c));
    } catch (err) { console.error('Like error:', err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu yorumu silmek istediğine emin misin?")) return;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (!error) fetchComments();
    } catch (e) { console.error(e); }
  };

  const startReply = (comment) => {
    setReplyTo({ id: comment.id, username: comment.profiles?.username || 'Gezgin' });
    inputRef.current?.focus();
    // Scroll to input smoothly
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex flex-col gap-6 w-full py-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/5">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">
              Topluluk Yorumları
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{comments.length} Tartışma</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-morphism rounded-[2rem] p-6 border border-white/5 bg-zinc-900/40 relative overflow-hidden shadow-2xl">
         <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <AnimatePresence>
            {replyTo && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-2"
              >
                <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest">
                  <CornerDownRight size={12} />
                  Yanıtlanıyor: @{replyTo.username}
                </div>
                <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            <div className="w-12 h-12 shrink-0 hidden sm:block">
               <AnimeAvatar src={user?.avatar_url} size="w-12 h-12" />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={user ? "Düşüncelerini paylaş..." : "Yorum yapmak için giriş yapmalısın..."}
                  disabled={loading || !user}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 min-h-[100px] transition-all text-sm font-medium resize-none shadow-inner"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsSpoiler(!isSpoiler)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                    isSpoiler ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <AlertTriangle size={12} />
                  Spoiler
                </button>
                <button
                  type="submit"
                  disabled={!text.trim() || loading || !user}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 flex items-center gap-2 shadow-purple-500/20"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={12} />}
                  GÖNDER
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Comments Feed */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => {
            const profile = comment.profiles;
            const mix = profile?.active_mix || {};
            const isHukumdar = profile?.rank === 'Manga Hükümdarı' || (profile?.rank && profile.rank.includes('Hükümdar'));
            const isElite = profile?.is_elite || (profile?.rank && profile.rank.includes('Elite'));
            const isOwner = user?.id === comment.user_id;

            return (
              <motion.div
                layout
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative overflow-hidden transition-all duration-500 rounded-[2rem] shadow-2xl w-full group ${
                  isHukumdar ? 'bg-purple-950/10 border border-purple-500/20' : 
                  isElite ? 'bg-amber-950/10 border border-amber-500/20' : 'bg-zinc-900/60 border border-white/5'
                }`}
              >
                {/* Nameplate Animation */}
                {mix.nameplate && mix.nameplate !== 'none' && (
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                    <video src={`/nameplates/${mix.nameplate}`} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
                  </div>
                )}

                <div className="relative z-10 p-5 flex gap-4 items-start">
                  <div className="w-12 h-12 shrink-0 relative cursor-pointer" onClick={() => navigate(`/profil/${profile?.username}`)}>
                    <AnimeAvatar 
                      src={profile?.avatar_url} 
                      effect={mix.avatar ? effectsData.find(e => e.id === mix.avatar) : null}
                      size="w-12 h-12"
                      forcePlay={true}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="space-y-3">
                       <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col min-w-0">
                             <div className="flex items-center gap-2 flex-wrap">
                               <span 
                                 onClick={() => navigate(`/profil/${profile?.username}`)}
                                 className={`font-black text-sm italic tracking-tight uppercase truncate cursor-pointer hover:underline ${
                                   isHukumdar ? 'text-purple-300' : isElite ? 'text-amber-300' : 'text-white'
                                 }`}
                               >
                                 {profile?.username || 'Gezgin'}
                               </span>
                               
                               <UserBadges user={profile} iconSize={14} />

                               <div className={`px-2 py-0.5 rounded-lg border text-[7px] font-black uppercase tracking-widest backdrop-blur-xl ${
                                 isHukumdar ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-neon-purple' : 
                                 isElite ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-neon-gold' : 'bg-white/5 border-white/10 text-slate-500'
                               }`}>
                                 {profile?.rank || 'Çaylak'}
                               </div>
                             </div>
                             <div className="flex items-center gap-2 mt-1">
                               <Clock size={10} className="text-slate-600" />
                               <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                 {new Date(comment.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                               </span>
                             </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             {(isOwner || user?.role === 'Baş Admin') && (
                               <button
                                 onClick={() => editingId === comment.id ? saveEdit(comment.id) : handleEdit(comment)}
                                 className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
                               >
                                 <Edit2 size={12} />
                               </button>
                             )}
                             {(isOwner || user?.role === 'Baş Admin' || user?.role === 'Yönetici') && (
                               <button
                                 onClick={() => handleDelete(comment.id)}
                                 className="p-2 bg-white/5 text-slate-400 hover:text-red-500 rounded-xl border border-white/5 transition-all"
                                >
                                 <Trash2 size={12} />
                               </button>
                             )}
                          </div>
                       </div>
                       
                       <div className="relative">
                        {editingId === comment.id ? (
                           <textarea
                             autoFocus
                             value={editValue}
                             onChange={(e) => setEditValue(e.target.value)}
                             onBlur={() => saveEdit(comment.id)}
                             className="w-full bg-white/5 border border-purple-500/30 rounded-xl p-3 text-white focus:outline-none min-h-[60px] text-xs font-bold resize-none shadow-inner"
                           />
                        ) : (
                          <p className={`text-slate-200 text-sm leading-relaxed font-medium whitespace-pre-wrap transition-all duration-500 ${comment.is_spoiler && !revealedSpoilers.has(comment.id) ? 'blur-xl opacity-10 select-none' : ''}`}>
                            {comment.text}
                          </p>
                        )}
                        
                        {comment.is_spoiler && !revealedSpoilers.has(comment.id) && (
                          <div 
                            onClick={() => toggleSpoiler(comment.id)}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl cursor-pointer rounded-2xl hover:bg-black/40 transition-all border border-red-500/20"
                          >
                             <AlertTriangle size={24} className="text-red-500 mb-1 animate-pulse" />
                             <span className="text-[8px] font-black text-white uppercase tracking-widest">SPOILER İÇERİK - GÖRMEK İÇİN TIKLA</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5">
                         <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleLike(comment)}
                              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all"
                            >
                               <Heart size={14} className={`${comment.likes > 0 ? 'fill-purple-500 text-purple-500' : 'text-purple-400'} group-hover:scale-110 transition-transform`} />
                               <span className="text-xs font-black text-purple-200">{comment.likes || 0}</span>
                            </button>
                            <button 
                              onClick={() => startReply(comment)}
                              className="flex items-center gap-2 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest px-2"
                            >
                               <MessageSquare size={14} />
                               Yanıtla
                            </button>
                         </div>
                         <button className="p-2 text-slate-700 hover:text-white transition-colors">
                            <MoreHorizontal size={16} />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-20 opacity-10 flex flex-col items-center">
            <MessageSquare size={48} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">Henüz yorum yapılmamış. İlk sen ol!</p>
          </div>
        )}
      </div>
    </div>
  );
}
