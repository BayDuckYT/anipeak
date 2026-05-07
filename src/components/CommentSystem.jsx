import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Trash2, Clock, AlertTriangle, 
  Edit2, Heart, MoreHorizontal 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import AnimeAvatar from './AnimeAvatar';
import effectsData from '../data/effects.json';

export default function CommentSystem({ seriesId, chapterNum }) {
  const { user, updateXP } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());
  
  // Real-time Editing States
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // ── Fetch Logic
  const fetchComments = async () => {
    try {
      const sid = parseInt(seriesId);
      if (isNaN(sid)) return;

      let query = supabase
        .from('comments')
        .select('*')
        .eq('series_id', sid);

      if (chapterNum) {
        query = query.eq('chapter_num', chapterNum);
      } else {
        query = query.is('chapter_num', null);
      }

      const { data: rawComments, error: commentError } = await query.order('created_at', { ascending: false });
      if (commentError) throw commentError;
      if (!rawComments) return;

      const userIds = [...new Set(rawComments.map(c => c.user_id))].filter(Boolean);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profileError) console.warn("[COMMENTS] Profil hatası:", profileError);

      const hydratedComments = rawComments.map(comment => ({
        ...comment,
        profiles: profiles?.find(p => p.id === comment.user_id) || null
      }));

      setComments(hydratedComments);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel(`comments_room_${seriesId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [seriesId, chapterNum]);

  // ── Actions
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user) { alert("Yorum yapmak için giriş yapmalısın!"); return; }
    if (!text.trim()) return;
    if (loading) return;

    const sid = parseInt(seriesId);
    if (isNaN(sid)) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.from('comments').insert([{
        user_id: user.id,
        text: text.trim(),
        series_id: sid,
        chapter_num: chapterNum ? parseInt(chapterNum) : null,
        is_spoiler: isSpoiler
      }]).select();

      if (error) throw error;
      setText('');
      setIsSpoiler(false);
      updateXP(10);
      fetchComments();
    } catch (err) {
      console.error("[COMMENTS] Hata:", err);
      alert(`Hata: ${err.message || "Bağlantı sorunu"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditValue(comment.text);
  };

  const saveEdit = async (id) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ text: editValue.trim() })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchComments();
    } catch (err) { console.error('Save error:', err); }
  };

  const handleLike = async (comment) => {
    try {
      const newLikes = (comment.likes || 0) + 1;
      await supabase.from('comments').update({ likes: newLikes }).eq('id', comment.id);
      setComments(comments.map(c => c.id === comment.id ? { ...c, likes: newLikes } : c));
    } catch (err) { console.error('Like error:', err); }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (!error) fetchComments();
    } catch (e) { console.error(e); }
  };

  const toggleSpoiler = (id) => {
    const next = new Set(revealedSpoilers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedSpoilers(next);
  };

  return (
    <div className="flex flex-col gap-4 w-full py-2">
      {/* Header - Minimal */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <MessageSquare size={16} />
        </div>
        <div>
          <h3 className="text-base font-black text-white italic tracking-tighter uppercase leading-none">
            Sosyal Panel
          </h3>
          <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mt-1">{comments.length} MESAJ</p>
        </div>
      </div>

      {/* Input Section - Extreme Compact */}
      <div className="glass-morphism rounded-2xl p-4 border border-white/5 bg-zinc-900/40 relative overflow-hidden">
         <form onSubmit={handleSubmit} className="relative z-10">
          <div className="flex gap-3">
            <div className="w-10 h-10 shrink-0">
               <AnimeAvatar src={user?.avatar_url} size="w-10 h-10" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Düşüncelerin..."
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 min-h-[70px] transition-all text-xs font-medium resize-none"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsSpoiler(!isSpoiler)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${
                    isSpoiler ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <AlertTriangle size={10} />
                  Spoiler
                </button>
                <button
                  type="submit"
                  disabled={!text.trim() || loading}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                >
                  {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={10} />}
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Comments Feed - High Density & Force-Clip */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => {
            const profile = comment.profiles;
            const mix = profile?.active_mix || {};
            const nameplateId = mix.nameplate;
            const avatarId = mix.avatar;
            const isHukumdar = profile?.rank === 'Manga Hükümdarı';
            const isElite = profile?.rank === 'Elite' || profile?.rank === 'Efsanevi Okur';

            return (
              <motion.div
                layout
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ clipPath: 'inset(0 round 1.5rem)' }}
                className={`relative overflow-hidden transition-all duration-500 rounded-[1.5rem] shadow-xl w-full group isolation-isolate ${
                  isHukumdar ? 'bg-purple-950/20' : 
                  isElite ? 'bg-amber-950/20' : 'bg-zinc-900/60'
                }`}
              >
                {/* ── İsim Plakası (Extreme Containment) ── */}
                {nameplateId && nameplateId !== 'none' && (
                  <div className="absolute inset-[5px] z-0 pointer-events-none rounded-[1.3rem] overflow-hidden">
                    <video 
                      src={`/nameplates/${nameplateId}`} 
                      autoPlay muted loop playsInline 
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-1000 scale-[1.15]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/98 via-black/40 to-black/95 z-1" />
                  </div>
                )}

                {/* ── Outer Border Shield ── */}
                <div className="absolute inset-0 z-20 pointer-events-none border-2 border-white/10 rounded-[1.5rem]" />

                <div className="relative z-10 p-3.5 flex gap-3 items-start">
                  <div className="w-10 h-10 shrink-0 relative">
                    <AnimeAvatar 
                      src={profile?.avatar_url || comment.avatar_url} 
                      effect={avatarId ? effectsData.find(e => e.id === avatarId) : null}
                      size="w-10 h-10"
                      forcePlay={true}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5 min-w-0">
                             <div className="flex items-center gap-2">
                               <span className={`font-black text-[13px] italic tracking-tight uppercase truncate drop-shadow-md ${
                                 isHukumdar ? 'text-purple-200' : isElite ? 'text-amber-200' : 'text-white'
                               }`}>
                                 {profile?.username || comment.username || 'Gezgin'}
                               </span>
                               <div className={`px-2 py-0.5 rounded border text-[6px] font-black uppercase tracking-widest backdrop-blur-xl ${
                                 isHukumdar ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 
                                 isElite ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-slate-500'
                               }`}>
                                 {profile?.rank || 'Çaylak'}
                               </div>
                             </div>
                             <div className="flex items-center gap-1.5 opacity-20">
                               <Clock size={8} className="text-slate-500" />
                               <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">
                                 {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                               </span>
                             </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                             {(user?.id === comment.user_id || user?.role === 'Baş Admin') && (
                               <button
                                 onClick={() => editingId === comment.id ? saveEdit(comment.id) : handleEdit(comment)}
                                 className="p-1 bg-black/40 text-white/30 hover:text-white rounded-md border border-white/5 transition-all"
                               >
                                 <Edit2 size={10} />
                               </button>
                             )}
                             {(user?.id === comment.user_id || user?.role === 'Baş Admin' || user?.role === 'Yönetici') && (
                               <button
                                 onClick={() => handleDelete(comment.id)}
                                 className="p-1 bg-black/40 text-white/30 hover:text-red-500 rounded-md border border-white/5 transition-all"
                                >
                                 <Trash2 size={10} />
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
                             className="w-full bg-white/5 border border-purple-500/20 rounded-lg p-2 text-white focus:outline-none min-h-[40px] text-xs font-bold resize-none"
                           />
                        ) : (
                          <p className={`text-slate-200 text-xs leading-normal font-bold whitespace-pre-wrap transition-all duration-500 ${comment.is_spoiler && !revealedSpoilers.has(comment.id) ? 'blur-lg opacity-5 select-none' : ''}`}>
                            {comment.text}
                          </p>
                        )}
                        
                        {comment.is_spoiler && !revealedSpoilers.has(comment.id) && (
                          <div 
                            onClick={() => toggleSpoiler(comment.id)}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-2xl cursor-pointer rounded-lg hover:bg-black/40 transition-all border border-red-500/10"
                          >
                             <AlertTriangle size={16} className="text-red-500 mb-0.5" />
                             <span className="text-[6px] font-black text-white uppercase tracking-tighter">SPOILER</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 mt-0.5 border-t border-white/5">
                         <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleLike(comment)}
                              className="group flex items-center gap-1.5 px-2 py-1 rounded-md border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all"
                            >
                               <Heart size={10} className="text-purple-400 group-hover:scale-110 transition-transform" />
                               <span className="text-[10px] font-black text-purple-200">{comment.likes || 0}</span>
                            </button>
                            <button className="flex items-center gap-1.5 text-white/20 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest">
                               <MessageSquare size={10} />
                               Yanıtla
                            </button>
                         </div>
                         <MoreHorizontal size={12} className="text-white/5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-10 opacity-5">
            <MessageSquare size={24} className="mx-auto mb-1" />
            <p className="text-[9px] font-black uppercase tracking-widest">Yorum yok</p>
          </div>
        )}
      </div>
    </div>
  );
}
