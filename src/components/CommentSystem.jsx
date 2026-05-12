import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Send, MessageSquare, Heart, Trash2, Clock, 
  AlertTriangle, MoreHorizontal, ChevronDown, ChevronUp, 
  AtSign, X, Reply
} from 'lucide-react';
import AnimeAvatar from './AnimeAvatar';
import UserBadges from './UserBadges';
import effectsData from '../data/effects.json';

// ─── @Mention Parser ───────────────────────────────────────────
function CommentText({ text, onMentionClick }) {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span
            key={i}
            onClick={() => onMentionClick(part.slice(1))}
            className="text-blue-400 hover:text-blue-300 cursor-pointer font-bold hover:underline"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function CommentSystem({ seriesId, chapterNum }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const replyInputRef = useRef(null);

  // Like state
  const [likedByMe, setLikedByMe] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});

  // ─── FETCH ─────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    try {
      const sid = parseInt(seriesId);
      if (isNaN(sid)) return;

      let query = supabase.from('comments').select('*').eq('series_id', sid).order('created_at', { ascending: false });
      if (chapterNum) query = query.eq('chapter_num', parseInt(chapterNum));

      const { data: rawComments, error } = await query;
      if (error) { console.error('[COMMENTS] fetch err:', error); return; }
      if (!rawComments || rawComments.length === 0) { setComments([]); return; }

      // Profile join
      const userIds = [...new Set(rawComments.map(c => c.user_id).filter(Boolean))];
      let profileMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      // Like counts
      const commentIds = rawComments.map(c => c.id);
      const { data: allLikes } = await supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds);

      const counts = {};
      const myLikes = new Set();
      (allLikes || []).forEach(l => {
        counts[l.comment_id] = (counts[l.comment_id] || 0) + 1;
        if (user && l.user_id === user.id) myLikes.add(l.comment_id);
      });
      setLikeCounts(counts);
      setLikedByMe(myLikes);

      const merged = rawComments.map(c => ({ ...c, _profile: profileMap[c.user_id] || null }));
      setComments(merged);
    } catch (err) {
      console.error('[COMMENTS] unexpected:', err);
    }
  }, [seriesId, chapterNum, user]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // ─── SUBMIT (top-level) ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        username: user.username || 'Gezgin',
        avatar_url: user.avatar_url || '',
        text: text.trim(),
        series_id: parseInt(seriesId),
        is_spoiler: isSpoiler,
      };
      if (chapterNum) payload.chapter_num = parseInt(chapterNum);

      const { data: inserted, error } = await supabase.from('comments').insert([payload]).select();
      if (error) throw error;

      // Check for @mentions and send notifications
      if (inserted && inserted[0]) {
        await processMentions(inserted[0]);
      }

      setText('');
      setIsSpoiler(false);
      setTimeout(() => fetchComments(), 300);
    } catch (err) {
      alert('Yorum gönderilemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── REPLY SUBMIT ──────────────────────────────────────────
  const handleReplySubmit = async (parentComment) => {
    if (!user || !replyText.trim()) return;
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        username: user.username || 'Gezgin',
        avatar_url: user.avatar_url || '',
        text: replyText.trim(),
        series_id: parseInt(seriesId),
        parent_id: parentComment.id,
        is_spoiler: false,
      };
      if (chapterNum) payload.chapter_num = parseInt(chapterNum);

      const { data: inserted, error } = await supabase.from('comments').insert([payload]).select();
      if (error) throw error;

      // Notify parent comment author
      if (parentComment.user_id && parentComment.user_id !== user.id) {
        await supabase.from('notifications').insert([{
          user_id: parentComment.user_id,
          from_user_id: user.id,
          from_username: user.username,
          type: 'reply',
          comment_id: parentComment.id,
          series_id: parseInt(seriesId),
          message: `${user.username} yorumuna yanıt verdi: "${replyText.trim().slice(0, 60)}..."`
        }]);
      }

      // Check for @mentions
      if (inserted && inserted[0]) {
        await processMentions(inserted[0]);
      }

      setReplyText('');
      setReplyingTo(null);
      setExpandedReplies(prev => new Set([...prev, parentComment.id]));
      setTimeout(() => fetchComments(), 300);
    } catch (err) {
      alert('Yanıt gönderilemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── @MENTION PROCESSOR ────────────────────────────────────
  const processMentions = async (comment) => {
    const mentions = (comment.text || '').match(/@(\w+)/g);
    if (!mentions) return;

    const usernames = [...new Set(mentions.map(m => m.slice(1)))];

    for (const username of usernames) {
      // Don't notify yourself
      if (username === user.username) continue;

      // Find mentioned user
      const { data: mentionedUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .limit(1);

      if (mentionedUsers && mentionedUsers[0]) {
        await supabase.from('notifications').insert([{
          user_id: mentionedUsers[0].id,
          from_user_id: user.id,
          from_username: user.username,
          type: 'mention',
          comment_id: comment.id,
          series_id: parseInt(seriesId),
          message: `${user.username} seni bir yorumda etiketledi`
        }]);
      }
    }
  };

  // ─── LIKE TOGGLE ───────────────────────────────────────────
  const handleLike = async (commentId) => {
    if (!user) return;
    const alreadyLiked = likedByMe.has(commentId);

    // Optimistic update
    setLikedByMe(prev => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setLikeCounts(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (alreadyLiked ? -1 : 1)
    }));

    try {
      if (alreadyLiked) {
        await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', commentId);
      } else {
        await supabase.from('comment_likes').insert([{ user_id: user.id, comment_id: commentId }]);
      }
    } catch (err) {
      // Revert on error
      setLikedByMe(prev => {
        const next = new Set(prev);
        alreadyLiked ? next.add(commentId) : next.delete(commentId);
        return next;
      });
      setLikeCounts(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + (alreadyLiked ? 1 : -1)
      }));
    }
  };

  // ─── DELETE ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Bu yorumu silmek istiyor musun?')) return;
    await supabase.from('comments').delete().eq('id', id);
    fetchComments();
  };

  // ─── REPLY HELPERS ─────────────────────────────────────────
  const startReply = (comment) => {
    const profile = comment._profile;
    const username = profile?.username || comment.username || '';
    setReplyingTo(comment);
    setReplyText(username ? `@${username} ` : '');
    setTimeout(() => replyInputRef.current?.focus(), 100);
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  const toggleSpoiler = (id) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── SEPARATE PARENT / CHILD ───────────────────────────────
  const topLevelComments = comments.filter(c => !c.parent_id);
  const repliesMap = {};
  comments.filter(c => c.parent_id).forEach(c => {
    if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
    repliesMap[c.parent_id].push(c);
  });
  // Sort replies oldest first
  Object.values(repliesMap).forEach(arr => arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));

  // ─── NAME STYLE HELPER ────────────────────────────────────
  const getNameStyle = (profile) => {
    const isAdmin = ['Baş Admin', 'Yönetici', 'Admin Yardımcısı'].includes(profile?.role);
    const isElite = profile?.is_elite;
    if (isAdmin) return { color: 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]', card: 'bg-red-950/10 border border-red-500/20', badge: 'bg-red-500/20 border-red-500/40 text-red-300' };
    if (isElite) return { color: 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]', card: 'bg-amber-950/10 border border-amber-500/20', badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300' };
    return { color: 'text-white', card: 'bg-zinc-900/60 border border-white/5', badge: 'bg-white/5 border-white/10 text-slate-500' };
  };

  // ─── SINGLE COMMENT CARD ──────────────────────────────────
  const CommentCard = ({ comment, isReply = false }) => {
    const profile = comment._profile;
    const mix = profile?.active_mix || {};
    const style = getNameStyle(profile);
    const isOwner = user?.id === comment.user_id;
    const replies = repliesMap[comment.id] || [];
    const isExpanded = expandedReplies.has(comment.id);
    const liked = likedByMe.has(comment.id);
    const likeCount = likeCounts[comment.id] || 0;

    return (
      <motion.div
        layout
        key={comment.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative overflow-hidden transition-all duration-500 ${isReply ? 'rounded-2xl' : 'rounded-[2.5rem] shadow-2xl'} w-full group ${isReply ? 'bg-white/[0.02] border border-white/5' : style.card}`}
      >
        {/* Nameplate */}
        {!isReply && mix.nameplate && mix.nameplate !== 'none' && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-700">
            <video src={`/nameplates/${mix.nameplate}`} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
          </div>
        )}

        <div className={`relative z-10 ${isReply ? 'p-4' : 'p-6'} flex gap-4 items-start`}>
          {/* Avatar */}
          <div className="shrink-0 cursor-pointer" onClick={() => navigate(`/profil/${profile?.username || comment.username}`)}>
            <AnimeAvatar 
              src={profile?.avatar_url || comment.avatar_url} 
              effect={mix.avatar ? effectsData.find(e => e.id === mix.avatar) : null}
              size={isReply ? 'w-10 h-10' : 'w-14 h-14'}
              forcePlay={true}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    onClick={() => navigate(`/profil/${profile?.username || comment.username}`)}
                    className={`font-black ${isReply ? 'text-xs' : 'text-sm'} italic tracking-tight uppercase truncate cursor-pointer hover:underline ${style.color}`}
                  >
                    {profile?.username || comment.username || 'Gezgin'}
                  </span>
                  <UserBadges user={profile || comment} iconSize={isReply ? 12 : 14} />
                  <div className={`px-2 py-0.5 rounded-lg border text-[7px] font-black uppercase tracking-widest ${style.badge}`}>
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

              {/* Delete */}
              {(isOwner || user?.role === 'Baş Admin' || user?.role === 'Yönetici') && (
                <button onClick={() => handleDelete(comment.id)} className="p-2 bg-white/5 text-slate-500 hover:text-red-500 rounded-xl border border-white/5 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Comment Text */}
            <div className="relative mt-3">
              <p className={`text-slate-200 ${isReply ? 'text-xs' : 'text-sm'} leading-relaxed font-medium whitespace-pre-wrap ${comment.is_spoiler && !revealedSpoilers.has(comment.id) ? 'blur-2xl opacity-5 select-none' : ''}`}>
                <CommentText text={comment.text} onMentionClick={(username) => navigate(`/profil/${username}`)} />
              </p>
              {comment.is_spoiler && !revealedSpoilers.has(comment.id) && (
                <div onClick={() => toggleSpoiler(comment.id)} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl cursor-pointer rounded-2xl hover:bg-black/20 transition-all border border-red-500/20">
                  <AlertTriangle size={18} className="text-red-500 mb-1 animate-bounce" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">SPOILER - DOKUN</span>
                </div>
              )}
            </div>

            {/* Actions: Like, Reply */}
            <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/5">
              <button 
                onClick={() => handleLike(comment.id)}
                className={`group flex items-center gap-1.5 transition-all ${liked ? 'text-red-500' : 'text-slate-500 hover:text-red-400'}`}
              >
                <Heart size={isReply ? 14 : 16} className={`transition-transform group-hover:scale-125 ${liked ? 'fill-red-500' : ''}`} />
                <span className="text-[10px] font-black">{likeCount > 0 ? likeCount : ''}</span>
              </button>

              {!isReply && user && (
                <button 
                  onClick={() => startReply(comment)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  <Reply size={16} /> Yanıtla
                </button>
              )}

              {isReply && user && (
                <button 
                  onClick={() => startReply(comment)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-all text-[9px] font-bold uppercase tracking-widest"
                >
                  <Reply size={14} /> Yanıtla
                </button>
              )}
            </div>

            {/* Replies Section (Instagram-style) */}
            {!isReply && replies.length > 0 && (
              <div className="mt-4">
                <button 
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-all text-[10px] font-black uppercase tracking-widest mb-3"
                >
                  <div className="w-8 h-[1px] bg-slate-700" />
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? 'Yanıtları gizle' : `${replies.length} yanıtı gör`}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pl-4 border-l-2 border-purple-500/20"
                    >
                      {replies.map(reply => (
                        <CommentCard key={reply.id} comment={reply} isReply={true} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Reply Input (shows under the comment being replied to) */}
            {replyingTo?.id === comment.id && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex gap-3 items-start"
              >
                <div className="shrink-0">
                  <AnimeAvatar src={user?.avatar_url} size="w-8 h-8" />
                </div>
                <div className="flex-1 relative">
                  <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Yanıtını yaz..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-medium focus:outline-none focus:border-purple-500/50 min-h-[60px] resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="px-4 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => handleReplySubmit(comment)}
                      disabled={loading || !replyText.trim()}
                      className="px-6 py-1.5 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all disabled:opacity-40 flex items-center gap-2"
                    >
                      <Send size={12} /> Yanıtla
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // ─── MAIN RENDER ───────────────────────────────────────────
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
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{topLevelComments.length} YORUM</p>
          </div>
        </div>
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
          <div className="relative glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-5">
            <div className="flex gap-5 items-start">
              <div className="shrink-0">
                <AnimeAvatar 
                  src={user.avatar_url} 
                  effect={user.active_mix?.avatar ? effectsData.find(e => e.id === user.active_mix.avatar) : null}
                  size="w-12 h-12"
                />
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Düşüncelerini paylaş... (@kullanıcı ile etiketle)"
                className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 text-white text-sm font-medium focus:outline-none focus:border-purple-500/50 min-h-[100px] transition-all resize-none"
              />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSpoiler(!isSpoiler)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    isSpoiler ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'
                  }`}
                >
                  <AlertTriangle size={13} /> {isSpoiler ? 'SPOILER AKTİF' : 'SPOILER'}
                </button>
                <div className="flex items-center gap-1.5 text-slate-600 text-[9px] font-bold">
                  <AtSign size={13} /> @ ile etiketle
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40"
              >
                {loading ? 'GÖNDERİLİYOR...' : <><Send size={13} /> GÖNDER</>}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass p-10 rounded-[2.5rem] text-center border border-dashed border-white/10">
          <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Tartışmaya katılmak için giriş yapmalısın.</p>
        </div>
      )}

      {/* Comments Feed */}
      <div className="flex flex-col gap-5">
        <AnimatePresence mode="popLayout">
          {topLevelComments.map(comment => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </AnimatePresence>

        {topLevelComments.length === 0 && (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
            <MessageSquare size={56} className="mb-3 text-slate-500" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">İlk tartışmayı sen başlat!</p>
          </div>
        )}
      </div>
    </div>
  );
}
