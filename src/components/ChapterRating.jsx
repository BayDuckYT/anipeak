import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function ChapterRating({ seriesId, chapterNum }) {
  const { user, updateXP } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchRatingStats();
    if (user) checkUserRating();
  }, [seriesId, chapterNum, user]);

  const fetchRatingStats = async () => {
    const { data, error } = await supabase
      .from('chapter_ratings')
      .select('value')
      .eq('series_id', seriesId)
      .eq('chapter_num', chapterNum);
    
    if (data && data.length > 0) {
      const sum = data.reduce((acc, curr) => acc + curr.value, 0);
      setAvgRating((sum / data.length) * 2); // Scale to 10
      setTotalVotes(data.length);
    }
  };

  const checkUserRating = async () => {
    const { data } = await supabase
      .from('chapter_ratings')
      .select('value')
      .eq('series_id', seriesId)
      .eq('chapter_num', chapterNum)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setRating(data.value);
      setSubmitted(true);
    }
  };

  const handleRate = async (val) => {
    if (!user) return alert('Puan vermek için giriş yapmalısın!');
    if (submitted) return;

    setRating(val);
    const { error } = await supabase
      .from('chapter_ratings')
      .upsert({
        series_id: seriesId,
        chapter_num: chapterNum,
        user_id: user.id,
        value: val
      });

    if (!error) {
      setSubmitted(true);
      updateXP(5); // +5 XP reward for rating
      fetchRatingStats();
    }
  };

  return (
    <div className="glass border border-white/10 rounded-3xl p-8 my-10 max-w-2xl mx-auto overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Award size={120} className="text-purple-500" />
      </div>

      <div className="relative z-10 text-center">
        <h3 className="text-2xl font-black text-white mb-2">Bölümü Değerlendir</h3>
        <p className="text-slate-400 text-sm mb-8">Bu bölüme bıraktığın her puan topluluğumuza ışık tutar.</p>

        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="relative p-1"
            >
              <Star
                size={42}
                className={`transition-all duration-300 ${
                  star <= (hover || rating)
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                    : 'text-slate-400'
                }`}
              />
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2 text-green-400 font-bold bg-green-400/10 px-4 py-2 rounded-full border border-green-400/20">
                <CheckCircle2 size={18} /> Puanın kaydedildi! (+5 XP)
              </div>
            </motion.div>
          ) : (
             <p className="text-xs text-slate-500 italic">Puan vererek seviye puanı kazanabilirsin.</p>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Genel Ortalanma</p>
            <p className="text-3xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'} 
              <span className="text-lg text-slate-400">/10</span>
            </p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Toplam Oy</p>
            <p className="text-3xl font-black text-white">{totalVotes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
