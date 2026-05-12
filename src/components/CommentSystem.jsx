import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Heart, Trash2, Clock, User, AlertTriangle } from 'lucide-react';

export default function CommentSystem({ seriesId, chapterNum }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);

  // 1. Yorumları ve Profil Bilgilerini Çek (Basit ve Sağlam Sistem)
  const fetchComments = async () => {
    try {
      const sid = parseInt(seriesId);
      if (isNaN(sid)) return;

      // Önce yorumları çek
      const { data: rawComments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('series_id', sid)
        .eq('chapter_num', chapterNum ? parseInt(chapterNum) : null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (rawComments && rawComments.length > 0) {
        // Sonra bu yorumları atanların profillerini çek (Join hatası almamak için manuel eşleştirme)
        const userIds = [...new Set(rawComments.map(c => c.user_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, rank')
          .in('id', userIds);

        const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        
        const merged = rawComments.map(c => ({
          ...c,
          user_profile: profileMap[c.user_id] || { username: c.username || 'Gezgin', avatar_url: c.avatar_url, rank: c.rank || 'Çaylak' }
        }));
        setComments(merged);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Yorumlar yüklenemedi:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [seriesId, chapterNum]);

  // 2. Yorum Gönder
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
        chapter_num: chapterNum ? parseInt(chapterNum) : null,
        is_spoiler: isSpoiler,
        rank: user.rank || 'Çaylak'
      };

      const { error } = await supabase.from('comments').insert([payload]);
      if (error) throw error;

      setText('');
      setIsSpoiler(false);
      fetchComments();
    } catch (err) {
      alert("Yorum gönderilemedi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yorumu silmek istediğine emin misin?")) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) fetchComments();
  };

  return (
    <div className="w-full space-y-8 py-10">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-purple-600/20 rounded-2xl text-purple-400">
          <MessageSquare size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Topluluk Yorumları</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{comments.length} Tartışma</p>
        </div>
      </div>

      {/* Input Area */}
      {user ? (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-[2rem] border border-white/5 space-y-4">
          <div className="flex gap-4">
            <img src={user.avatar_url || 'https://placehold.co/100x100?text=A'} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Düşüncelerini paylaş..."
              className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-purple-500/50 min-h-[100px] transition-all"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsSpoiler(!isSpoiler)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isSpoiler ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-slate-500 hover:text-white'
              }`}
            >
              <AlertTriangle size={14} /> Spoiler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : <><Send size={14} /> Gönder</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="glass p-8 rounded-[2rem] text-center border border-dashed border-white/10">
          <p className="text-slate-400 text-sm font-bold">Yorum yapmak için giriş yapmalısın.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-5 rounded-[2rem] border border-white/5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <img src={comment.user_profile?.avatar_url || 'https://placehold.co/100x100?text=U'} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white italic uppercase">{comment.user_profile?.username || 'Gezgin'}</span>
                      <span className="px-2 py-0.5 bg-white/5 rounded-md text-[8px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
                        {comment.user_profile?.rank || 'Çaylak'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                      <Clock size={10} /> {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
                {user?.id === comment.user_id && (
                  <button onClick={() => handleDelete(comment.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              <div className="pl-14">
                <p className={`text-slate-300 text-sm leading-relaxed ${comment.is_spoiler ? 'blur-md hover:blur-none transition-all cursor-help' : ''}`}>
                  {comment.text}
                </p>
                {comment.is_spoiler && (
                  <p className="text-[8px] text-red-500/50 font-black uppercase tracking-widest mt-2 italic">Spoiler - Görmek için üzerine gel</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
