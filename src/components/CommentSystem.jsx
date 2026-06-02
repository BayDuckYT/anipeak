import React, { useState, useEffect, useRef, memo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Send, MessageSquare, Heart, Trash2, Clock, AlertTriangle, ChevronDown, ChevronUp, AtSign, Reply, Loader2 } from 'lucide-react';
import AnimeAvatar from './AnimeAvatar';
import UserBadges from './UserBadges';
import effectsData from '../data/effects.json';

// ─── @Mention renderer ──────────────────────────────
function RenderText({ text, navigate }) {
  if (!text) return null;
  return text.split(/(@\w+)/g).map((p, i) =>
    p.startsWith('@') ? <span key={i} onClick={() => navigate(`/profil/${p.slice(1)}`)} className="text-blue-400 hover:text-blue-300 cursor-pointer font-bold hover:underline">{p}</span> : <span key={i}>{p}</span>
  );
}

// ─── Style helper ───────────────────────────────────
function getStyle(profile) {
  const isAdmin = ['Baş Admin', 'Yönetici', 'Admin Yardımcısı'].includes(profile?.role);
  const isAethe = profile?.active_plan_id === 'aethe';
  const isElite = profile?.is_elite;
  if (isAdmin || isAethe) return { name: 'text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.8)] drop-shadow-[0_2px_2px_rgba(0,0,0,1)]', card: 'bg-red-950/10 border border-red-500/20', badge: 'bg-red-500/20 border-red-500/40 text-red-300' };
  if (isElite) return { name: 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] drop-shadow-[0_2px_2px_rgba(0,0,0,1)]', card: 'bg-amber-950/10 border border-amber-500/20', badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300' };
  return { name: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]', card: 'bg-card-navy/60 border border-white/5', badge: 'bg-white/5 border-white/10 text-slate-500' };
}

// ─── Color helper ───────────────────────────────────
function hexToRgba(hex, alpha) {
  if (!hex || hex === 'none') return undefined;
  if (hex.startsWith('rgba')) return hex;
  var r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r)) return hex;
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}
function CommentSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {[1,2,3].map(i => (
        <div key={i} className="bg-card-navy/60 border border-white/5 rounded-[2.5rem] p-6 flex gap-5">
          <div className="w-14 h-14 rounded-full bg-zinc-800" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-zinc-800 rounded w-1/4" />
            <div className="h-3 bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommentSystem({ seriesId, chapterNum }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [likedByMe, setLikedByMe] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const replyRef = useRef(null);

  // ─── FETCH ────────────────────────────────────────
  const fetchComments = async (showLoading = false) => {
    if (showLoading) setInitialLoading(true);
    try {
      const sid = parseInt(seriesId);
      if (isNaN(sid)) return;

      let q = supabase.from('comments').select('*').eq('series_id', sid).order('created_at', { ascending: false });
      if (chapterNum) q = q.eq('chapter_num', parseInt(chapterNum));

      const { data: raw, error } = await q;
      if (error) { console.error('[C] fetch:', error); return; }
      if (!raw?.length) { setComments([]); return; }

      // Profiles
      const uids = [...new Set(raw.map(c => c.user_id).filter(Boolean))];
      let pMap = {};
      if (uids.length) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', uids);
        pMap = (profiles || []).reduce((a, p) => ({ ...a, [p.id]: p }), {});
      }

      // Likes (safe)
      try {
        const { data: likes } = await supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', raw.map(c => c.id));
        const cnt = {}, my = new Set();
        (likes || []).forEach(l => { cnt[l.comment_id] = (cnt[l.comment_id] || 0) + 1; if (user?.id === l.user_id) my.add(l.comment_id); });
        setLikeCounts(cnt);
        setLikedByMe(my);
      } catch(e) { /* table may not exist yet */ }

      setComments(raw.map(c => ({ ...c, _profile: pMap[c.user_id] || null })));
    } catch (err) { console.error('[C]:', err); }
    finally { setInitialLoading(false); }
  };

  useEffect(() => { fetchComments(true); }, [seriesId, chapterNum]);

  // ─── SUBMIT ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSubmitting(true);
    try {
      const p = { user_id: user.id, username: user.username || 'Gezgin', avatar_url: user.avatar_url || '', text: text.trim(), series_id: parseInt(seriesId), is_spoiler: isSpoiler };
      if (chapterNum) p.chapter_num = parseInt(chapterNum);
      const { data: ins, error } = await supabase.from('comments').insert([p]).select();
      if (error) throw error;
      if (ins?.[0]) processMentions(ins[0]);
      setText(''); setIsSpoiler(false);
      setTimeout(() => fetchComments(), 300);
    } catch (err) { alert('Hata: ' + err.message); }
    finally { setSubmitting(false); }
  };

  // ─── REPLY (Instagram-style: all replies go under ROOT comment) ─
  const getRootParentId = (comment) => {
    // If this comment is already a reply, find its root parent
    if (comment.parent_id) return comment.parent_id;
    return comment.id;
  };

  const handleReply = async (targetComment) => {
    if (!user || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const rootId = getRootParentId(targetComment);
      const p = { user_id: user.id, username: user.username || 'Gezgin', avatar_url: user.avatar_url || '', text: replyText.trim(), series_id: parseInt(seriesId), parent_id: rootId, is_spoiler: false };
      if (chapterNum) p.chapter_num = parseInt(chapterNum);
      const { data: ins, error } = await supabase.from('comments').insert([p]).select();
      if (error) throw error;
      // Notify the person being replied to
      if (targetComment.user_id && targetComment.user_id !== user.id) {
        await supabase.from('notifications').insert([{ user_id: targetComment.user_id, from_user_id: user.id, from_username: user.username, type: 'reply', comment_id: targetComment.id, series_id: parseInt(seriesId), message: `${user.username} yorumuna yanıt verdi` }]).catch(() => {});
      }
      if (ins?.[0]) processMentions(ins[0]);
      setReplyText(''); setReplyingTo(null);
      setExpandedReplies(prev => new Set([...prev, rootId]));
      setTimeout(() => fetchComments(), 300);
    } catch (err) { alert('Hata: ' + err.message); }
    finally { setSubmitting(false); }
  };

  // ─── MENTIONS ─────────────────────────────────────
  const processMentions = async (comment) => {
    const mentions = (comment.text || '').match(/@(\w+)/g);
    if (!mentions) return;
    for (const m of [...new Set(mentions.map(x => x.slice(1)))]) {
      if (m === user.username) continue;
      const { data } = await supabase.from('profiles').select('id').eq('username', m).limit(1);
      if (data?.[0]) {
        await supabase.from('notifications').insert([{ user_id: data[0].id, from_user_id: user.id, from_username: user.username, type: 'mention', comment_id: comment.id, series_id: parseInt(seriesId), message: `${user.username} seni etiketledi` }]).catch(() => {});
      }
    }
  };

  // ─── LIKE TOGGLE ──────────────────────────────────
  const toggleLike = async (cid) => {
    if (!user) return;
    const liked = likedByMe.has(cid);
    setLikedByMe(p => { const n = new Set(p); liked ? n.delete(cid) : n.add(cid); return n; });
    setLikeCounts(p => ({ ...p, [cid]: (p[cid] || 0) + (liked ? -1 : 1) }));
    try {
      if (liked) await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', cid);
      else await supabase.from('comment_likes').insert([{ user_id: user.id, comment_id: cid }]);
    } catch(e) { /* revert */ setLikedByMe(p => { const n = new Set(p); liked ? n.add(cid) : n.delete(cid); return n; }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu yorumu silmek istiyor musun?')) return;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      fetchComments();
    } catch (err) {
      console.error('[DELETE]', err);
      alert('Yorum silinemedi: ' + err.message);
    }
  };

  const handleMuteUser = async (targetUserId, targetUsername) => {
    if (!window.confirm(`${targetUsername} kullanıcısını 24 saat susturmak istediğinize emin misiniz?`)) return;
    try {
      const { error } = await supabase.from('profiles').update({
        muted_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        mute_reason: 'Moderatör tarafından yorum kuralları ihlali sebebiyle susturuldu.'
      }).eq('id', targetUserId);
      if (error) throw error;
      alert(`${targetUsername} başarıyla 24 saat susturuldu.`);
      await supabase.from('notifications').insert([{ user_id: targetUserId, from_user_id: user.id, from_username: user.username, type: 'system', message: `Yorum kurallarını ihlal ettiğiniz için 24 saat susturuldunuz.` }]).catch(() => {});
    } catch (err) {
      alert('Susturma başarısız: ' + err.message);
    }
  };

  // ─── DERIVED DATA ─────────────────────────────────
  const topLevel = comments.filter(c => !c.parent_id);
  const repliesOf = {};
  comments.filter(c => c.parent_id).forEach(c => { (repliesOf[c.parent_id] = repliesOf[c.parent_id] || []).push(c); });
  Object.values(repliesOf).forEach(a => a.sort((x, y) => new Date(x.created_at) - new Date(y.created_at)));

  // ─── RENDER SINGLE COMMENT ────────────────────────
  const renderComment = (comment, isReply = false) => {
    const prof = comment._profile;
    const mix = prof?.active_mix || {};
    const s = getStyle(prof);
    const isOwner = user?.id === comment.user_id;
    const replies = repliesOf[comment.id] || [];
    const expanded = expandedReplies.has(comment.id);
    const liked = likedByMe.has(comment.id);
    const lc = likeCounts[comment.id] || 0;
    const isAethe = prof?.active_plan_id === 'aethe' || prof?.role === 'Baş Admin';
    const hasCustomColor = mix.commentColor && mix.commentColor !== 'none';

    // Aethe users get a glowing red border and shadow directly on the card
    const aetheStyle = isAethe ? {
      boxShadow: '0 0 20px rgba(225,29,72,0.4), inset 0 0 15px rgba(225,29,72,0.1)',
      borderColor: 'rgba(225,29,72,0.5)',
      backgroundColor: 'rgba(40, 0, 10, 0.4)' // Slight dark red tint
    } : {};

    const customColorStyle = hasCustomColor ? { 
      backgroundColor: hexToRgba(mix.commentColor, 0.08), 
      borderColor: hexToRgba(mix.commentColor, 0.2),
      ...(isAethe ? {
        boxShadow: `0 0 20px ${hexToRgba(mix.commentColor, 0.4)}, inset 0 0 15px ${hexToRgba(mix.commentColor, 0.1)}`
      } : {})
    } : {};

    const combinedStyle = isReply ? {} : { ...aetheStyle, ...customColorStyle };

    return (
      <div key={comment.id} style={combinedStyle} className={`relative transition-all duration-300 mt-2 ${isReply ? 'rounded-2xl' : 'rounded-[2.5rem] shadow-2xl'} w-full group ${isReply ? 'bg-white/[0.02] border border-white/5' : (!mix.commentColor || mix.commentColor === 'none' ? s.card : '')}`}>
        {/* Nameplate */}
        {!isReply && mix.nameplate && mix.nameplate !== 'none' && (
          <div className="absolute top-[12px] bottom-[12px] left-[8px] right-[8px] z-0 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-700 overflow-hidden" style={{ borderRadius: '1.5rem', clipPath: 'inset(0 round 1.5rem)' }}>
            <video autoPlay muted loop playsInline className="w-full h-full object-cover mix-blend-screen mix-blend-lighten" style={{ filter: `hue-rotate(${mix.hue || 0}deg)`, objectPosition: 'right center' }}>
              <source src={`/nameplates/${mix.nameplate}`} type="video/webm" />
            </video>
          </div>
        )}

        {/* INLINE BLOOD EMOJIS - falling from the top inside the card */}
        {isAethe && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ borderRadius: isReply ? '1rem' : '2.5rem' }}>
            {/* Dripping blood emoji 1 */}
            <div className="absolute animate-blood-rain text-[14px]" style={{ top: '-20px', left: '15%', animationDelay: '0s', animationDuration: '3s', opacity: 0.6 }}>🩸</div>
            
            {/* Dripping blood emoji 2 */}
            <div className="absolute animate-blood-rain text-[18px]" style={{ top: '-20px', left: '40%', animationDelay: '1.2s', animationDuration: '4s', opacity: 0.8 }}>🩸</div>
            
            {/* Dripping blood emoji 3 */}
            <div className="absolute animate-blood-rain text-[12px]" style={{ top: '-20px', left: '70%', animationDelay: '0.5s', animationDuration: '3.5s', opacity: 0.5 }}>🩸</div>
            
            {/* Dripping blood emoji 4 */}
            <div className="absolute animate-blood-rain text-[16px]" style={{ top: '-20px', right: '15%', animationDelay: '2s', animationDuration: '4.5s', opacity: 0.7 }}>🩸</div>
            
            {/* Dripping blood emoji 5 */}
            <div className="absolute animate-blood-rain text-[10px]" style={{ top: '-20px', right: '35%', animationDelay: '0.8s', animationDuration: '5s', opacity: 0.4 }}>🩸</div>
          </div>
        )}

        <div className={`relative z-10 ${isReply ? 'p-4' : 'p-6'} flex gap-4 items-start`}>
          <div className="shrink-0 cursor-pointer" onClick={() => navigate(`/profil/${prof?.username || comment.username}`)}>
            <AnimeAvatar src={prof?.avatar_url || comment.avatar_url} effect={mix.avatar ? effectsData.find(e => e.id === mix.avatar) : null} size={isReply ? 'w-10 h-10' : 'w-14 h-14'} forcePlay={true} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    onClick={() => navigate(`/profil/${prof?.username || comment.username}`)} 
                    className={`font-black ${isReply ? 'text-xs' : 'text-sm'} italic tracking-tight uppercase truncate cursor-pointer hover:underline ${s.name} ${mix.nametag && mix.nametag !== 'none' ? 'name-effect-text' : ''}`}
                    style={mix.nametag && mix.nametag !== 'none' ? { backgroundImage: `url(${effectsData.find(e => e.id === mix.nametag)?.url})`, filter: `hue-rotate(${mix.hue || 0}deg)` } : {}}
                  >
                    {prof?.username || comment.username || 'Gezgin'}
                  </span>
                  <UserBadges user={prof || comment} showCrown={true} iconSize={isReply ? 12 : 14} />
                  <div className={`px-2 py-0.5 rounded-lg border text-[7px] font-black uppercase tracking-widest ${s.badge}`}>
                    {['Baş Admin', 'Yönetici', 'Admin Yardımcısı'].includes(prof?.role) ? `${prof?.role} | ${prof?.rank || 'Çaylak'}` :
                     (prof?.active_plan_id === 'aethe') ? `Aethe ${prof?.rank || 'Çaylak'}` :
                     (prof?.is_elite) ? `Elite ${prof?.rank || 'Çaylak'}` :
                     prof?.rank || 'Çaylak'}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={10} className="text-slate-400" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {(!isOwner && ['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Moderatör'].includes(user?.role) && !['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Moderatör'].includes(prof?.role)) && (
                  <button onClick={() => handleMuteUser(comment.user_id, prof?.username || comment.username)} title="Sustur (24 Saat)" className="p-2 text-slate-400 hover:text-orange-500 rounded-xl transition-all">
                    <AlertTriangle size={13} />
                  </button>
                )}
                {(isOwner || ['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Moderatör'].includes(user?.role)) && (
                  <button onClick={() => handleDelete(comment.id)} title="Yorumu Sil" className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Text */}
            <div className="relative mt-3">
              <p className={`text-slate-200 ${isReply ? 'text-xs' : 'text-sm'} leading-relaxed font-medium whitespace-pre-wrap ${comment.is_spoiler && !revealedSpoilers.has(comment.id) ? 'blur-2xl opacity-5 select-none' : ''}`}>
                <RenderText text={comment.text} navigate={navigate} />
              </p>
              {comment.is_spoiler && !revealedSpoilers.has(comment.id) && (
                <div onClick={() => setRevealedSpoilers(p => new Set([...p, comment.id]))} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl cursor-pointer rounded-2xl border border-red-500/20">
                  <AlertTriangle size={18} className="text-red-500 mb-1 animate-bounce" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">SPOILER - DOKUN</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/5">
              <button onClick={() => toggleLike(comment.id)} className={`group flex items-center gap-1.5 transition-all ${liked ? 'text-red-500' : 'text-slate-500 hover:text-red-400'}`}>
                <Heart size={isReply ? 14 : 16} className={`transition-transform group-hover:scale-125 ${liked ? 'fill-red-500' : ''}`} />
                {lc > 0 && <span className="text-[10px] font-black">{lc}</span>}
              </button>
              {user && (
                <button onClick={() => {
                  const targetName = prof?.username || comment.username || '';
                  setReplyingTo(comment);
                  setReplyText(targetName ? `@${targetName} ` : '');
                  setTimeout(() => replyRef.current?.focus(), 50);
                }} className={`flex items-center gap-1.5 text-slate-500 hover:text-white transition-all ${isReply ? 'text-[9px]' : 'text-[10px]'} font-black uppercase tracking-widest`}>
                  <Reply size={isReply ? 14 : 16} /> Yanıtla
                </button>
              )}
            </div>

            {/* Replies expand */}
            {!isReply && replies.length > 0 && (
              <div className="mt-4">
                <button onClick={() => setExpandedReplies(p => { const n = new Set(p); n.has(comment.id) ? n.delete(comment.id) : n.add(comment.id); return n; })} className="flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-all text-[10px] font-black uppercase tracking-widest mb-3">
                  <div className="w-8 h-[1px] bg-slate-700" />
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expanded ? 'Gizle' : `${replies.length} yanıt`}
                </button>
                {expanded && (
                  <div className="space-y-3 pl-4 border-l-2 border-purple-500/20">
                    {replies.map(r => renderComment(r, true))}
                  </div>
                )}
              </div>
            )}

            {/* Reply input — OUTSIDE CommentCard to prevent re-render flicker */}
            {replyingTo?.id === comment.id && (
              <div className="mt-4 flex gap-3 items-start" onClick={e => e.stopPropagation()}>
                <AnimeAvatar src={user?.avatar_url} size="w-8 h-8" />
                <div className="flex-1">
                  <input
                    ref={replyRef}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(replyingTo); } }}
                    placeholder="Yanıtını yaz..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-medium focus:outline-none focus:border-purple-500/50"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white">İptal</button>
                    <button onClick={() => handleReply(replyingTo)} disabled={submitting || !replyText.trim()} className="px-5 py-1.5 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-purple-500 disabled:opacity-40 flex items-center gap-2">
                      <Send size={11} /> Yanıtla
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    return cardContent;
  };

  // ─── MAIN ─────────────────────────────────────────
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
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{topLevel.length} YORUM</p>
          </div>
        </div>
      </div>

      {/* Input */}
      {user ? (
        user.isMuted ? (
          <div className="glass p-10 rounded-[2.5rem] text-center border border-red-500/20 bg-red-500/5">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-500 animate-pulse" />
            <h3 className="text-red-400 font-black text-xl uppercase tracking-widest mb-2">Yorum Yapma Engeli</h3>
            <p className="text-slate-400 text-sm font-medium">Hesabınız geçici olarak susturulmuştur. Lütfen kurallara dikkat edin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-5">
              <div className="flex gap-5 items-start">
                <div className="shrink-0">
                  <AnimeAvatar src={user.avatar_url} effect={user.active_mix?.avatar ? effectsData.find(e => e.id === user.active_mix.avatar) : null} size="w-12 h-12" />
                </div>
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Düşüncelerini paylaş... (@kullanıcı ile etiketle)" className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 text-white text-sm font-medium focus:outline-none focus:border-purple-500/50 min-h-[100px] transition-all resize-none" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIsSpoiler(!isSpoiler)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isSpoiler ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}>
                    <AlertTriangle size={13} /> {isSpoiler ? 'SPOILER AKTİF' : 'SPOILER'}
                  </button>
                  <span className="text-slate-400 text-[9px] font-bold flex items-center gap-1"><AtSign size={12} />etiketle</span>
                </div>
                <button type="submit" disabled={submitting || !text.trim()} className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Send size={13} /> GÖNDER</>}
                </button>
              </div>
            </div>
          </form>
        )
      ) : (
        <div className="glass p-10 rounded-[2.5rem] text-center border border-dashed border-white/10">
          <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Tartışmaya katılmak için giriş yap.</p>
        </div>
      )}

      {/* Comments */}
      <div className="flex flex-col gap-5">
        {initialLoading ? (
          <CommentSkeleton />
        ) : topLevel.length > 0 ? (
          topLevel.map(c => renderComment(c))
        ) : (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
            <MessageSquare size={56} className="mb-3 text-slate-500" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">İlk tartışmayı sen başlat!</p>
          </div>
        )}
      </div>
    </div>
  );
}
