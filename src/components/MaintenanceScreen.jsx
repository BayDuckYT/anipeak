import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, Wrench, CalendarClock, BookOpen, Zap, Heart, Instagram, Sparkles, Smartphone } from 'lucide-react';

/**
 * Açılış zamanı. Bir tarih verirsen (ör. '2026-12-01T18:00:00+03:00') canlı geri sayım gösterilir.
 * null bırakırsan "Açılış Yılı 2026" kartı gösterilir.
 */
const LAUNCH_AT = null;
const LAUNCH_YEAR = 2026;

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
  };
}

const pad = (n) => String(n).padStart(2, '0');

function TimeCell({ value, label }) {
  return (
    <div className="mp-cell">
      <span key={value} className="mp-digit">{pad(value)}</span>
      <span className="mp-cell-label">{label}</span>
    </div>
  );
}

const STATIC_PETALS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: ((i * 37) % 94) + 3,
  size: 6 + ((i * 13) % 10),
  dur: 9 + ((i * 7) % 10),
  delay: -((i * 11) % 18),
  drift: ((i % 2 === 0 ? 1 : -1) * (60 + ((i * 19) % 130))),
}));

const STATIC_STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: ((i * 47) % 96) + 2,
  top: ((i * 23) % 55) + 3,
  size: 1 + ((i * 7) % 3),
  delay: ((i * 13) % 50) / 10,
}));

export default function MaintenanceScreen({ onAuthOpen }) {
  const countdown = useCountdown(LAUNCH_AT);

  return (
    <div className="mp-root">
      <style>{`
        .mp-root { position:relative; min-height:100vh; overflow:hidden; background:#06040f; color:#fff; font-family:'Inter',system-ui,sans-serif; display:flex; align-items:center; }
        .mp-bg { position:absolute; inset:0; background-size:cover; background-position:70% center; animation: mp-zoom 30s ease-in-out infinite alternate; }
        @keyframes mp-zoom { from { transform:scale(1); } to { transform:scale(1.08); } }
        .mp-shade { position:absolute; inset:0; background: linear-gradient(90deg, rgba(6,4,15,.92) 0%, rgba(6,4,15,.7) 38%, rgba(6,4,15,.05) 70%), linear-gradient(0deg, rgba(6,4,15,.85) 0%, transparent 35%); }
        .mp-moon-glow { position:absolute; right:12%; top:8%; width:34vw; height:34vw; max-width:520px; max-height:520px; border-radius:50%; background: radial-gradient(circle, rgba(192,132,252,.45), rgba(168,85,247,.15) 45%, transparent 70%); filter:blur(30px); animation: mp-moon 5s ease-in-out infinite; mix-blend-mode:screen; pointer-events:none; }
        @keyframes mp-moon { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.12); } }
        .mp-star { position:absolute; border-radius:50%; background:#e9d5ff; box-shadow:0 0 8px #c084fc; animation: mp-twinkle 3s ease-in-out infinite; }
        @keyframes mp-twinkle { 0%,100% { opacity:.1; transform:scale(.6); } 50% { opacity:1; transform:scale(1.2); } }
        .mp-petal { position:absolute; top:-5vh; background: linear-gradient(135deg,#f0abfc,#a855f7); border-radius:150% 0 150% 0; opacity:.8; box-shadow:0 0 10px rgba(217,70,239,.6); animation: mp-fall linear infinite; pointer-events:none; }
        @keyframes mp-fall { 0% { transform: translate3d(0,0,0) rotate(0deg); opacity:0; } 10% { opacity:.9; } 100% { transform: translate3d(var(--drift),110vh,0) rotate(540deg); opacity:0; } }

        .mp-btn { display:inline-flex; align-items:center; gap:.5rem; padding:.65rem 1.1rem; border-radius:.85rem; background:rgba(19,14,38,.7); backdrop-filter:blur(14px); border:1px solid rgba(168,85,247,.35); color:#fff; font-weight:600; font-size:.85rem; transition:all .25s; position:relative; overflow:hidden; cursor:pointer; }
        .mp-btn:hover { border-color:#c084fc; box-shadow:0 0 24px rgba(168,85,247,.55); transform:translateY(-2px); }
        .mp-btn::after { content:''; position:absolute; top:0; left:-120%; width:60%; height:100%; background:linear-gradient(100deg,transparent,rgba(255,255,255,.25),transparent); transform:skewX(-20deg); animation: mp-sheen 3.5s ease-in-out infinite; }
        @keyframes mp-sheen { 0%,60% { left:-120%; } 100% { left:160%; } }
        .mp-icon-btn { width:2.6rem; height:2.6rem; padding:0; justify-content:center; }

        .mp-badge { display:inline-flex; align-items:center; gap:.5rem; padding:.45rem 1rem; border-radius:999px; background:rgba(109,40,217,.25); border:1px solid rgba(168,85,247,.45); font-size:.8rem; font-weight:600; color:#e9d5ff; margin-bottom:1.5rem; box-shadow:0 0 22px rgba(168,85,247,.3); }
        .mp-dot { width:.5rem; height:.5rem; border-radius:50%; background:#c084fc; box-shadow:0 0 10px #c084fc; animation: mp-ping 1.6s ease-in-out infinite; }
        @keyframes mp-ping { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.8); opacity:.4; } }
        .mp-wrench { animation: mp-wrench 2.4s ease-in-out infinite; transform-origin:70% 70%; }
        @keyframes mp-wrench { 0%,100% { transform:rotate(0); } 25% { transform:rotate(-25deg); } 75% { transform:rotate(15deg); } }

        .mp-title { font-family:'Clash Display','Inter',sans-serif; font-weight:700; letter-spacing:-.02em; line-height:1.05; font-size:clamp(2.8rem,6.5vw,4.8rem); margin:0 0 1.25rem; }
        .mp-grad { background:linear-gradient(100deg,#a855f7,#e879f9,#818cf8,#a855f7); background-size:250% 100%; -webkit-background-clip:text; background-clip:text; color:transparent; animation: mp-flow 5s linear infinite; filter:drop-shadow(0 0 22px rgba(168,85,247,.55)); }
        @keyframes mp-flow { to { background-position:250% 0; } }

        .mp-card { display:inline-flex; align-items:center; gap:1.5rem; padding:1.1rem 1.6rem; border-radius:1.2rem; background:rgba(22,15,48,.65); backdrop-filter:blur(18px); border:1px solid rgba(168,85,247,.35); position:relative; box-shadow:0 0 40px rgba(124,58,237,.25), inset 0 0 30px rgba(168,85,247,.07); animation: mp-card 4s ease-in-out infinite; }
        @keyframes mp-card { 0%,100% { box-shadow:0 0 30px rgba(124,58,237,.2), inset 0 0 30px rgba(168,85,247,.05); } 50% { box-shadow:0 0 55px rgba(168,85,247,.5), inset 0 0 40px rgba(168,85,247,.12); } }
        .mp-card-icon { width:3rem; height:3rem; border-radius:.9rem; display:flex; align-items:center; justify-content:center; background:rgba(109,40,217,.35); color:#d8b4fe; animation: mp-pulse 2.4s ease-in-out infinite; }
        @keyframes mp-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(168,85,247,.5); } 50% { box-shadow:0 0 0 12px rgba(168,85,247,0); } }
        .mp-card-label { font-size:.75rem; color:#a1a1c5; }
        .mp-card-value { font-size:2.2rem; font-weight:800; letter-spacing:.02em; background:linear-gradient(180deg,#f5d0fe,#a855f7); -webkit-background-clip:text; background-clip:text; color:transparent; filter:drop-shadow(0 0 14px rgba(168,85,247,.6)); }
        .mp-divider { width:1px; align-self:stretch; background:linear-gradient(transparent,rgba(168,85,247,.5),transparent); }
        .mp-time { display:flex; gap:.6rem; }
        .mp-cell { display:flex; flex-direction:column; align-items:center; min-width:3.4rem; }
        .mp-digit { font-size:2rem; font-weight:800; font-variant-numeric:tabular-nums; color:#e9d5ff; text-shadow:0 0 16px rgba(168,85,247,.8); animation: mp-tick .4s ease-out; }
        @keyframes mp-tick { from { transform:translateY(-8px); opacity:0; } to { transform:none; opacity:1; } }
        .mp-cell-label { font-size:.65rem; letter-spacing:.15em; text-transform:uppercase; color:#8b8bb0; }

        .mp-feat { display:flex; align-items:center; gap:.7rem; font-size:.8rem; color:#d4d4f0; transition:transform .25s; }
        .mp-feat:hover { transform:translateY(-3px); }
        .mp-feat svg { color:#a855f7; filter:drop-shadow(0 0 8px rgba(168,85,247,.8)); }
        .mp-script { font-family:'Brush Script MT','Segoe Script',cursive; font-size:1.25rem; color:#c084fc; text-shadow:0 0 14px rgba(168,85,247,.7); animation: mp-float 4s ease-in-out infinite; }
        @keyframes mp-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @media (max-width:768px) { .mp-shade { background:linear-gradient(0deg, rgba(6,4,15,.95), rgba(6,4,15,.65)); } .mp-card { flex-direction:column; align-items:flex-start; } .mp-divider { display:none; } }
        @media (prefers-reduced-motion: reduce) { .mp-root *, .mp-root *::before, .mp-root *::after { animation:none !important; } }
      `}</style>

      <div className="mp-bg" style={{ backgroundImage: "url('/bakim_arkaplanv2.webp')" }} />
      <div className="mp-shade" />
      <div className="mp-moon-glow" />

      {STATIC_STARS.map((s) => (
        <span key={s.id} className="mp-star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
      ))}
      {STATIC_PETALS.map((p) => (
        <span
          key={p.id}
          className="mp-petal"
          style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, '--drift': `${p.drift}px` }}
        />
      ))}

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem clamp(1.25rem,4vw,3rem)' }}>
        <motion.img
          src="/mahorapeaklogov2.webp"
          alt="MahoraPeak Logo"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ height: 'clamp(4rem,9vw,7rem)', width: 'auto', filter: 'drop-shadow(0 0 14px rgba(168,85,247,.6))' }}
        />
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} style={{ display: 'flex', gap: '.7rem', alignItems: 'center' }}>
          <Link to="/indir" className="mp-btn" style={{ textDecoration: 'none' }}>
            <Smartphone size={15} style={{ color: '#c084fc' }} /> Uygulama İndir
          </Link>
          <button id="maintenance-staff-login" className="mp-btn" onClick={() => onAuthOpen('login')}>
            <Lock size={15} style={{ color: '#c084fc' }} /> Yetkili Girişi
          </button>
          <a className="mp-btn mp-icon-btn" href="https://discord.gg/mahorapeak" target="_blank" rel="noreferrer" aria-label="Discord">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
          </a>
          <a className="mp-btn mp-icon-btn" href="https://instagram.com/mahorapeakoffical" target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram size={18} />
          </a>
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 20, width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '8rem clamp(1.25rem,5vw,5rem) 6rem' }}>
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ maxWidth: '36rem' }}>
          <div className="mp-badge">
            <Wrench size={15} className="mp-wrench" /> Bakımda <span className="mp-dot" />
          </div>

          <h1 className="mp-title">
            Şu anda<br />
            <span className="mp-grad">bakımdayız.</span>
          </h1>

          <p style={{ color: '#b9b9d6', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 2rem', maxWidth: '30rem' }}>
            Daha iyi bir deneyim sunabilmek için sitemizde güncelleme çalışmaları yapıyoruz. Kısa süre içinde geri döneceğiz. Anlayışınız için teşekkür ederiz. <Heart size={14} style={{ display: 'inline', color: '#a855f7' }} fill="#a855f7" />
          </p>

          <motion.div className="mp-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}>
            <div className="mp-card-icon"><CalendarClock size={24} /></div>
            {countdown ? (
              <div>
                <div className="mp-card-label">Açılışa kalan süre</div>
                <div className="mp-time">
                  <TimeCell value={countdown.d} label="Gün" />
                  <TimeCell value={countdown.h} label="Saat" />
                  <TimeCell value={countdown.m} label="Dk" />
                  <TimeCell value={countdown.s} label="Sn" />
                </div>
              </div>
            ) : (
              <div>
                <div className="mp-card-label">Açılış yılımız</div>
                <div className="mp-card-value">{LAUNCH_YEAR}</div>
              </div>
            )}
            <div className="mp-divider" />
            <div className="mp-card-label" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              Manga dünyasına<br />çok yakında <Sparkles size={14} style={{ color: '#c084fc' }} />
            </div>
          </motion.div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            <div className="mp-feat"><BookOpen size={22} />Daha fazla<br />manga</div>
            <div className="mp-feat"><Zap size={22} />Daha hızlı<br />sunucu</div>
            <div className="mp-feat"><Heart size={22} />Daha iyi<br />deneyim</div>
          </div>
        </motion.div>
      </div>

      <div className="mp-script" style={{ position: 'absolute', bottom: '1.5rem', left: 'clamp(1.25rem,4vw,3rem)', zIndex: 20 }}>
        Aynı gökyüzü altında, daha güzel bölümlerle…
      </div>
      <div style={{ position: 'absolute', bottom: '1.5rem', right: 'clamp(1.25rem,4vw,3rem)', zIndex: 20, textAlign: 'right', fontSize: '.75rem', color: '#a1a1c5' }}>
        <b style={{ color: '#d8b4fe' }}>MahoraPeak</b><br />Manga • Anime • Sen<br />© 2026
      </div>
    </div>
  );
}
