import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';

export default function StarRating({ seriesId, initialRating }) {
  const { user } = useAuth();
  const { updateRating } = useApp();
  const [hover, setHover] = useState(0);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUserRating = async () => {
      try {
        const sid = parseInt(seriesId);
        if (isNaN(sid)) return;

        const { data, error } = await supabase
          .from('ratings')
          .select('value')
          .eq('series_id', sid)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error && data) setUserRating(data.value);
      } catch (err) {
        console.warn("[RATINGS] Puan çekilemedi:", err);
      }
    };

    fetchUserRating();
  }, [seriesId, user]);

  const handleRate = async (val) => {
    if (!user) return; // Should be handled by parent (e.g., open auth modal)
    setUserRating(val);
    await updateRating(seriesId, user.id, val);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!user}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRate(star)}
            className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star
              size={20}
              className={`${
                (hover || userRating) >= star
                  ? 'text-amber-400 fill-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                  : 'text-slate-600'
              } transition-all`}
            />
          </button>
        ))}
      </div>
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        {userRating ? 'Senin Puanın' : 'Puan Ver'}
      </span>
    </div>
  );
}
