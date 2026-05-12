import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  MessageSquare, 
  Heart, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  MoreHorizontal
} from 'lucide-react';
import AnimeAvatar from './AnimeAvatar';
import UserBadges from './UserBadges';
import effectsData from '../data/effects.json';

export default function CommentSystem({ seriesId, chapterNum }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

  // ─── FETCH COMMENTS ──────────────────────────────────────────
  const fetchComments = async () => {
    try {
      const sid = parseInt(seriesId);
      if (isNaN(sid)) return;

      // Use select('*') — safe for reads, the parent_id error was only on INSERT
      let query = supabase
        .from('comments')
        .select('*')
        .eq('series_id', sid)
        .order('created_at', { ascending: false });

      // If on a chapter page, filter by chapter
      if (chapterNum) {
        query = query.eq('chapter_num', parseInt(chapterNum));
      }

      const { data: rawComments, error } = await query;

      if (error) {
        console.error('[COMMENTS] Fetch error:', error);
        return;
      }

      if (!rawComments || rawComments.length === 0) {
        setComments([]);
        return;
      }

      // Manual profile join — fetch profiles for all commenters
      const userIds = [...new Set(rawComments.map(c => c.user_id).filter(Boolean))];
      
      let profileMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      const merged = rawComments.map(c => ({
        ...c,
        _profile: profileMap[c.user_id] || null
      }));

      setComments(merged);
    } catch (err) {
      console.error('[COMMENTS] Unexpected error:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [seriesId, chapterNum]);

  // ─── SUBMIT COMMENT ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setLoading(true);
    try {
      // ONLY send columns that EXIST in the comments table
      const payload = {
        user_id: user.id,
        username: user.username || 'Gezgin',
        avatar_url: user.avatar_url || '',
        text: text.trim(),
        series_id: parseInt(seriesId),
        is_spoiler: isSpoiler
      };

      // Only add chapter_num if we're on a chapter page
      if (chapterNum) {
        payload.chapter_num = parseInt(chapterNum);
      }

      const { error } = await supabase.from('comments').insert([payload]);
      if (error) throw error;

      setText('');
      setIsSpoiler(false);
      // Delay to let DB process the insert
      setTimeout(() => fetchComments(), 400);
    } catch (err) {
      console.error('[COMMENTS] Submit error:', err);
      alert('Yorum gönderilemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── DELETE ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Bu yorumu silmek istiyor musun?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) fetchComments();
  };

  // ─── SPOILER TOGGLE ──────────────────────────────────────────
  const toggleSpoiler = (id) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="w-full space-y-10 py-12">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-purple-500/20">
          <MessageSquare size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Topluluk Tartışması</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{comments.length} AKTİF YORUM</p>
          </div>
        </div>
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
          <div className="relative glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
            <div className="flex gap-6 items-start">
              <div className="shrink-0">
                <AnimeAvatar 
                  src={user.avatar_url} 
                  effect={user.active_mix?.avatar ? effectsData.find(e => e.id === user.active_mix.avatar) : null}
                  size="w-14 h-14"
                />
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 bg-white/5 border border-white/5 rounded-[1.5rem] p-5 text-white text-sm font-medium focus:outline-none focus:border-purple-500/50 min-h-[120px] transition-all resize-none"
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsSpoiler(!isSpoiler)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isSpoiler ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'
                }`}
              >
                <AlertTriangle size={14} /> {isSpoiler ? 'SPOILER AKTİF' : 'SPOILER?'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="relative flex items-center gap-3 px-10 py-3.5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <span className="relative z-10 group-hover/btn:text-white transition-colors">{loading ? 'GÖNDERİLİYOR' : 'YORUM YAP'}</span>
                {!loading && <Send size={14} className="relative z-10 group-hover/btn:text-white" />}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass p-12 rounded-[2.5rem] text-center border border-dashed border-white/10">
          <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Tartışmaya katılmak için giriş yapmalısın.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-6">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => {
            const profile = comment._profile;
            const mix = profile?.active_mix || {};
            const isAdmin = profile?.role === 'Baş Admin' || profile?.role === 'Yönetici' || profile?.role === 'Admin Yardımcısı';
            const isElite = profile?.is_elite;
            const isOwner = user?.id === comment.user_id;

            // Name color: Admin = red, Elite/Premium = amber, Normal = white
            const nameColorClass = isAdmin
              ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]'
              : isElite
                ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                : 'text-white';

            // Card border style
            const cardClass = isAdmin
              ? 'bg-red-950/10 border border-red-500/20'
              : isElite
                ? 'bg-amber-950/10 border border-amber-500/20 shadow-amber-500/5'
                : 'bg-zinc-900/60 border border-white/5';

            // Rank badge style
            const rankBadgeClass = isAdmin
              ? 'bg-red-500/20 border-red-500/40 text-red-300'
              : isElite
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-500';

            return (
              <motion.div
                layout
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative overflow-hidden transition-all duration-500 rounded-[2.5rem] shadow-2xl w-full group ${cardClass}`}
              >
                {/* Nameplate Video Background */}
                {mix.nameplate && mix.nameplate !== 'none' && (
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                    <video src={`/nameplates/${mix.nameplate}`} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
                  </div>
                )}

                <div className="relative z-10 p-6 flex gap-5 items-start">
                  {/* Avatar with Effect */}
                  <div className="shrink-0 cursor-pointer" onClick={() => navigate(`/profil/${profile?.username || comment.username}`)}>
                    <AnimeAvatar 
                      src={profile?.avatar_url || comment.avatar_url} 
                      effect={mix.avatar ? effectsData.find(e => e.id === mix.avatar) : null}
                      size="w-14 h-14"
                      forcePlay={true}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="space-y-4">
                      {/* Name Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Username with premium/admin glow */}
                            <span 
                              onClick={() => navigate(`/profil/${profile?.username || comment.username}`)}
                              className={`font-black text-sm italic tracking-tight uppercase truncate cursor-pointer hover:underline ${nameColorClass}`}
                            >
                              {profile?.username || comment.username || 'Gezgin'}
                            </span>
                            
                            {/* Diamond badge */}
                            <UserBadges user={profile || comment} iconSize={14} />

                            {/* Rank tag */}
                            <div className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest backdrop-blur-xl ${rankBadgeClass}`}>
                              {profile?.rank || 'Çaylak'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock size={10} className="text-slate-600" />
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                              {new Date(comment.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(isOwner || user?.role === 'Baş Admin' || user?.role === 'Yönetici') && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="p-2.5 bg-white/5 text-slate-500 hover:text-red-500 rounded-xl border border-white/5 transition-all hover:bg-red-500/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Comment Text */}
                      <div className="relative">
                        <p className={`text-slate-200 text-sm leading-relaxed font-medium whitespace-pre-wrap transition-all duration-700 ${comment.is_spoiler && !revealedSpoilers.has(comment.id) ? 'blur-2xl opacity-5 select-none' : ''}`}>
                          {comment.text}
                        </p>
                        
                        {comment.is_spoiler && !revealedSpoilers.has(comment.id) && (
                          <div 
                            onClick={() => toggleSpoiler(comment.id)}
                            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl cursor-pointer rounded-2xl hover:bg-black/20 transition-all border border-red-500/20"
                          >
                            <AlertTriangle size={20} className="text-red-500 mb-1 animate-bounce" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest text-center px-4">SPOILER - GÖRMEK İÇİN DOKUN</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5">
                        <div className="flex items-center gap-5">
                          <button className="group flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-all">
                            <Heart size={16} className="group-hover:scale-125 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{comment.likes || 0}</span>
                          </button>
                          <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                            <MessageSquare size={16} />
                            Yanıtla
                          </button>
                        </div>
                        <button className="p-2 text-slate-700 hover:text-white transition-colors">
                          <MoreHorizontal size={18} />
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
          <div className="text-center py-24 opacity-20 flex flex-col items-center">
            <MessageSquare size={64} className="mb-4 text-slate-500" />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">İlk tartışmayı sen başlat!</p>
          </div>
        )}
      </div>
    </div>
  );
}
