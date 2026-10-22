import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const STATIC_PETALS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: ((i * 37) % 96) + 2,
  size: 7 + ((i * 13) % 9),
  dur: 10 + ((i * 7) % 9),
  delay: -((i * 11) % 18),
  drift: ((i % 2 === 0 ? 1 : -1) * (60 + ((i * 19) % 130))),
}));

const STATIC_FIREFLIES = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  left: 40 + ((i * 31) % 56), // Sağ taraf ve merkez odaklı
  top: 6 + ((i * 23) % 86),
  size: 2 + ((i * 5) % 4),
  dur: 3.5 + ((i * 7) % 4),
  delay: ((i * 11) % 40) / 10,
}));

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const nextPath = searchParams.get('next') || '/';

  const { login, signup, loginWithDiscord, resetPassword, verifyOtp } = useAuth();

  const initialTab = searchParams.get('mode') || 'login';
  const [tab, setTab] = useState(initialTab);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '', otpCode: '' });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSuccessRedirect = () => {
    setTimeout(() => {
      navigate(nextPath, { replace: true });
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'forgot') {
      if (form.email.length < 3) { setError('Geçerli bir kullanıcı adı veya e-posta girin.'); return; }
      setLoading(true);
      try {
        const result = await resetPassword(form.email);
        if (result && result.email) {
          setForm((prev) => ({ ...prev, email: result.email }));
        }
        setTab('verify_otp');
        setError('');
      } catch (err) {
        setError(err.message || 'Sıfırlama maili gönderilemedi.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (tab === 'verify_otp' || tab === 'verify_register_otp') {
      if (!form.otpCode || form.otpCode.length < 8) { setError('Lütfen 8 haneli doğrulama kodunu tam girin.'); return; }
      setLoading(true);
      try {
        const type = tab === 'verify_register_otp' ? 'signup' : 'recovery';
        await verifyOtp(form.email, form.otpCode, type);
        setSuccess(true);
        setTimeout(() => {
          if (tab === 'verify_register_otp') {
            handleSuccessRedirect();
          } else {
            navigate('/reset-password', { replace: true });
          }
        }, 1500);
      } catch {
        setError('Kod geçersiz veya süresi dolmuş.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validation
    if (tab === 'register' && !form.email.includes('@')) { setError('Kayıt olmak için geçerli bir e-posta girin.'); return; }
    if (tab === 'login' && form.email.length < 3) { setError('Geçerli bir e-posta veya kullanıcı adı girin.'); return; }
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    if (tab === 'register' && form.password !== form.password2) { setError('Şifreler eşleşmiyor.'); return; }
    if (tab === 'register' && form.username.length < 3) { setError('Kullanıcı adı en az 3 karakter.'); return; }

    setLoading(true);
    try {
      let data;
      if (tab === 'register') {
        data = await signup(form.email, form.password, form.username);
      } else {
        data = await login(form.email, form.password);
      }

      if (tab === 'register' && !data?.session) {
        setTab('verify_register_otp');
        return;
      }

      setSuccess(true);
      handleSuccessRedirect();
    } catch (err) {
      console.error('Auth Error:', err);
      if (err.message === 'Failed to fetch') {
        setError('Bağlantı engellendi! Lütfen AdBlocker, VPN veya Brave Kalkanları kullanıyorsanız devredışı bırakıp sayfayı yenileyin.');
      } else if (err.message === 'Invalid login credentials') {
        setError('E-posta veya şifre hatalı!');
      } else if (err.message === 'Email not confirmed') {
        setError('E-posta adresi henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.');
      } else {
        setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      setLoading(true);
      setError('');
      if (loginWithDiscord) {
        await loginWithDiscord();
      } else {
        window.open('https://discord.gg/mahorapeak', '_blank');
      }
    } catch (err) {
      setError(err.message || 'Discord ile giriş başlatılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const censorEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 1) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  };

  const headline = tab === 'login' ? 'Tekrar hoş geldin.'
    : tab === 'register' ? 'Aramıza katıl.'
    : tab === 'confirm_email' ? 'Son bir adım kaldı.'
    : (tab === 'verify_otp' || tab === 'verify_register_otp') ? 'Kodu doğrula.'
    : 'Şifreni yenile.';

  const subline = tab === 'login' ? 'Kaldığın dünyadan devam et.'
    : tab === 'register' ? 'Sınırları aş, efsaneler arasına katıl.'
    : tab === 'confirm_email' ? 'Aramıza katılmana çok az kaldı.'
    : (tab === 'verify_otp' || tab === 'verify_register_otp') ? `${censorEmail(form.email)} adresine gelen doğrulama kodunu gir.`
    : 'Şifreni yenilemek için bir adım at.';

  return (
    <div className="min-h-screen bg-[#070512] text-white relative overflow-hidden font-sans select-none flex flex-col lg:grid lg:grid-cols-[1.15fr_1fr]">
      <style>{`
        /* Tam Ekran Arka Plan & Canlı Zoom */
        .au-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: 65% center;
          animation: au-zoom 26s ease-in-out infinite alternate;
        }
        @keyframes au-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }

        /* Ay ve Ay Işıması */
        .au-moon {
          position: absolute;
          left: 20%;
          top: 6%;
          width: 32vw;
          height: 32vw;
          max-width: 460px;
          max-height: 460px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.35), rgba(168,85,247,0.18) 45%, transparent 70%);
          filter: blur(34px);
          mix-blend-mode: screen;
          animation: au-moon 5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes au-moon {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }

        /* Sakura Yaprakları */
        .au-petal {
          position: absolute;
          top: -5vh;
          background: linear-gradient(135deg, #fbcfe8, #d946ef, #a855f7);
          border-radius: 150% 0 150% 0;
          opacity: 0.85;
          box-shadow: 0 0 10px rgba(244,114,182,0.65);
          animation: au-fall linear infinite;
          pointer-events: none;
        }
        @keyframes au-fall {
          0% { transform: translate3d(0,0,0) rotate(0); opacity: 0; }
          10% { opacity: 0.95; }
          100% { transform: translate3d(var(--drift), 110vh, 0) rotate(540deg); opacity: 0; }
        }

        /* Sağ Taraf Parlayan Ateşböcekleri / Yıldız Tozu */
        .au-firefly {
          position: absolute;
          border-radius: 50%;
          background: #f0abfc;
          box-shadow: 0 0 10px #c084fc, 0 0 20px #e879f9;
          animation: au-sparkle ease-in-out infinite alternate;
          pointer-events: none;
        }
        @keyframes au-sparkle {
          0% { transform: translateY(0) scale(0.6); opacity: 0.15; }
          50% { opacity: 0.9; transform: translateY(-8px) scale(1.2); }
          100% { transform: translateY(-16px) scale(0.8); opacity: 0.25; }
        }

        /* Form Kartı */
        .au-card {
          position: relative;
          border-radius: 1.75rem;
          background: rgba(18, 12, 38, 0.78);
          backdrop-filter: blur(28px);
          border: 1px solid rgba(168, 85, 247, 0.32);
          box-shadow: 0 0 50px rgba(124, 58, 237, 0.22), inset 0 0 35px rgba(168, 85, 247, 0.06);
          animation: au-glow 5s ease-in-out infinite;
        }
        @keyframes au-glow {
          0%, 100% {
            box-shadow: 0 0 45px rgba(124, 58, 237, 0.2), inset 0 0 35px rgba(168, 85, 247, 0.06);
            border-color: rgba(168, 85, 247, 0.32);
          }
          50% {
            box-shadow: 0 0 75px rgba(168, 85, 247, 0.45), inset 0 0 45px rgba(168, 85, 247, 0.12);
            border-color: rgba(192, 132, 252, 0.55);
          }
        }

        /* Aksiyon Butonu */
        .au-btn-gradient {
          background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%);
          background-size: 200% 100%;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .au-btn-gradient:hover {
          background-position: 100% 0;
          box-shadow: 0 0 35px rgba(217, 70, 239, 0.65);
          transform: translateY(-1px);
        }
        .au-btn-gradient::after {
          content: '';
          position: absolute;
          top: 0;
          left: -120%;
          width: 50%;
          height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transform: skewX(-20deg);
          animation: au-sheen 3.5s ease-in-out infinite;
        }
        @keyframes au-sheen {
          0%, 55% { left: -120%; }
          100% { left: 170%; }
        }

        /* Çiçek Sallantı Efekti */
        .au-flower {
          filter: drop-shadow(0 0 10px rgba(244, 114, 182, 0.7));
          animation: au-float 3.5s ease-in-out infinite;
        }
        @keyframes au-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(8deg); }
        }
      `}</style>

      {/* ── BÜTÜN SAYFAYI KAPLAYAN SİNEMATİK ANİME VE EFEKT ARKA PLANI ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Anime Panoramik Şehir & Ay Görseli */}
        <div className="au-bg" style={{ backgroundImage: "url('/bakim_arkaplanv2.webp')" }} />

        {/* Soldan sağa doğru yumuşak karartma (formun arkasında hafif mistik karanlık bırakır, şehri örtmez) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070512]/45 via-[#070512]/75 to-[#070512]/92" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070512]/70 via-transparent to-[#070512]/85" />

        {/* Ay Parıltısı */}
        <div className="au-moon" />

        {/* Sağ Taraf: Neon Nebula Parıltıları (Formun arkasında nefes alan büyüleyici mor ve pembe küreler) */}
        <div
          className="absolute -top-16 -right-16 w-[520px] h-[520px] rounded-full bg-purple-600/25 blur-[140px] animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div
          className="absolute -bottom-20 right-10 w-[480px] h-[480px] rounded-full bg-pink-600/18 blur-[140px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div className="absolute top-[40%] right-[5%] w-[380px] h-[380px] rounded-full bg-indigo-600/20 blur-[130px]" />

        {/* Sağ Taraf: Siber İnce Izgara Deseni */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 opacity-[0.06] bg-[linear-gradient(to_right,#c084fc_1px,transparent_1px),linear-gradient(to_bottom,#c084fc_1px,transparent_1px)] bg-[size:38px_38px]" />

        {/* Arka Plan Dev Anime Filigranı: 頂点 (MahoraPeak / Zirve) */}
        <div
          className="hidden lg:flex absolute right-10 top-1/2 -translate-y-1/2 select-none pointer-events-none text-[15vw] font-black text-purple-400/[0.04] leading-none tracking-tighter"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          頂点
        </div>

        {/* Sağ Taraf Işıltılı Yıldız Tozları ve Ateşböcekleri */}
        {STATIC_FIREFLIES.map((f) => (
          <span
            key={f.id}
            className="au-firefly"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              animationDuration: `${f.dur}s`,
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}

        {/* Bütün Ekrandan Dökülen Sakura Yaprakları */}
        {STATIC_PETALS.map((p) => (
          <span
            key={p.id}
            className="au-petal"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
            }}
          />
        ))}
      </div>

      {/* ── SOL BÖLÜM: Logo ve Tanıtım ── */}
      <div className="relative z-10 min-h-[260px] lg:min-h-screen flex flex-col justify-between p-6 lg:p-12">
        {/* Sol Üst: Kendi MahoraPeak Logomuz */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-20"
        >
          <img
            src="/mahorapeaklogov2.webp"
            alt="MahoraPeak Logo"
            className="h-28 md:h-36 w-auto object-contain cursor-pointer"
            style={{ filter: 'drop-shadow(0 0 18px rgba(168,85,247,0.75))' }}
            onClick={() => navigate('/')}
          />
        </motion.div>

        {/* Sol Alt: Tanıtım Başlığı & Sakura Çiçekleri */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-20 max-w-lg mb-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl au-flower">🌸</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-4">
            Her bölümde<br />
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              yeni bir dünya.
            </span>
          </h2>
          <p className="text-slate-300/80 text-base font-medium flex items-center gap-2">
            Manga ve manhwa evrenini keşfet.
            <span className="text-xl au-flower" style={{ animationDelay: '1.5s' }}>🌸</span>
          </p>
        </motion.div>
      </div>

      {/* ── SAĞ BÖLÜM: Form Paneli (Buzlu Cam Kart) ── */}
      <div className="relative z-20 flex flex-col justify-center items-center px-4 py-8 sm:py-12 lg:px-12 min-h-screen">
        {/* Ana Sayfaya Dön Butonu */}
        <div className="w-full max-w-[440px] flex justify-start mb-4">
          <button
            onClick={() => navigate(nextPath)}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors group text-sm font-semibold py-1.5 px-3 rounded-xl bg-white/5 border border-purple-500/20 backdrop-blur-md hover:bg-white/10"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-purple-400" />
            <span>Ana Sayfaya Dön</span>
          </button>
        </div>

        {/* Ana Form Kartı */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="au-card w-full max-w-[440px] p-6 sm:p-8"
        >
          {/* Köşe Işıma Vurguları */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-tr-[1.75rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-fuchsia-500/10 to-transparent rounded-bl-[1.75rem] pointer-events-none" />

          {/* Giriş Yap / Kayıt Ol Sekmeleri (Kusursuz Grid & Neon Alt Çizgi) */}
          {(tab === 'login' || tab === 'register') && (
            <div className="grid grid-cols-2 border-b border-purple-500/20 mb-7 relative">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); setSuccess(false); }}
                className={`pb-3 text-sm font-bold text-center transition-all relative ${
                  tab === 'login' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Giriş Yap
                {tab === 'login' && (
                  <motion.div
                    layoutId="authTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_12px_#c084fc]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); setSuccess(false); }}
                className={`pb-3 text-sm font-bold text-center transition-all relative ${
                  tab === 'register' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Kayıt Ol
                {tab === 'register' && (
                  <motion.div
                    layoutId="authTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_12px_#c084fc]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            </div>
          )}

          {/* Başlık & Açıklama */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
              {headline}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-normal">
              {subline}
            </p>
          </div>

          {/* Başarı Ekranı */}
          <AnimatePresence mode="wait">
            {(success || tab === 'confirm_email') && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="text-center py-6"
              >
                <CheckCircle size={60} className="text-emerald-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                <h2 className="text-white font-bold text-xl mb-2">
                  {(tab === 'verify_otp' || tab === 'verify_register_otp') && success ? 'Kod Doğrulandı! ✅' :
                   tab === 'forgot' ? 'Bağlantı Gönderildi! 📧' :
                   tab === 'confirm_email' ? 'E-postanı Doğrula! 📧' :
                   'Evrene Hoş Geldin! 🎉'}
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                  {tab === 'forgot' || tab === 'confirm_email'
                    ? 'Kayıtlı e-posta adresine bir bağlantı gönderdik. Lütfen gelen kutunu kontrol et.'
                    : tab === 'verify_otp' && success ? 'Şifre sıfırlama ekranına yönlendiriliyorsun...'
                    : tab === 'verify_register_otp' && success ? 'Kayıt başarılı! Yönlendiriliyorsun...'
                    : 'Giriş başarılı, hikayeye kaldığın yerden devam edebilirsin. Yönlendiriliyorsun...'}
                </p>
                {tab === 'confirm_email' && (
                  <button
                    onClick={() => { setTab('login'); setSuccess(false); }}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-xs transition-all"
                  >
                    Giriş Sayfasına Dön
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Alanı */}
          {!success && tab !== 'confirm_email' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Kullanıcı Adı</label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    type="text"
                    required
                    placeholder="Efsanevi_Okuyucu"
                    className="w-full bg-[#1b1532]/90 border border-purple-500/25 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
                  />
                </div>
              )}

              {tab !== 'verify_otp' && tab !== 'verify_register_otp' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    {tab === 'login' || tab === 'forgot' ? 'E-posta adresin veya kullanıcı adın' : 'E-posta adresin'}
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type={tab === 'login' || tab === 'forgot' ? 'text' : 'email'}
                    required
                    placeholder="E-posta adresin"
                    className="w-full bg-[#1b1532]/90 border border-purple-500/25 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
                  />
                </div>
              )}

              {(tab === 'verify_otp' || tab === 'verify_register_otp') && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300 text-center">8 Haneli Doğrulama Kodu</label>
                  <input
                    name="otpCode"
                    value={form.otpCode}
                    onChange={handleChange}
                    type="text"
                    maxLength="8"
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#1b1532]/90 border border-purple-500/25 focus:border-purple-400 rounded-xl px-4 py-3 text-center text-xl tracking-[0.4em] text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
                  />
                </div>
              )}

              {tab !== 'forgot' && tab !== 'verify_otp' && tab !== 'verify_register_otp' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Şifren</label>
                  <div className="relative">
                    <input
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#1b1532]/90 border border-purple-500/25 focus:border-purple-400 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              )}

              {tab === 'register' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Şifre Tekrarı</label>
                  <input
                    name="password2"
                    value={form.password2}
                    onChange={handleChange}
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#1b1532]/90 border border-purple-500/25 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
                  />
                </div>
              )}

              {/* Hata Kutusu */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2.5">
                      <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                      <span className="font-medium leading-relaxed">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Beni Hatırla & Şifremi Unuttum */}
              {tab === 'login' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                    <input
                      type="checkbox"
                      id="remember"
                      defaultChecked
                      className="rounded bg-[#1b1532] border-purple-500/30 text-purple-600 focus:ring-purple-500/40"
                    />
                    <span>Beni hatırla</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Şifremi unuttum
                  </button>
                </div>
              )}

              {tab === 'register' && (
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Kayıt olarak <a href="/kullanim-sartlari" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Kullanım Şartları</a>'nı kabul etmiş sayılırsınız.
                </p>
              )}

              {/* Ana Buton: Giriş Yap / Kayıt Ol */}
              <button
                type="submit"
                disabled={loading}
                className="au-btn-gradient w-full py-3.5 mt-2 rounded-xl text-sm font-bold text-white shadow-[0_0_25px_rgba(192,132,252,0.45)] disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Zap size={18} className="text-white/80" />
                  </motion.div>
                ) : tab === 'login' ? 'Giriş Yap' : tab === 'register' ? 'Kayıt Ol' : (tab === 'verify_otp' || tab === 'verify_register_otp') ? 'Doğrula' : 'Sıfırlama Kodu Al'}
              </button>

              {/* Veya Çizgisi */}
              {(tab === 'login' || tab === 'register') && (
                <>
                  <div className="relative flex items-center justify-center my-4">
                    <div className="border-t border-purple-500/20 w-full" />
                    <span className="bg-[#120d24] px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">veya</span>
                    <div className="border-t border-purple-500/20 w-full" />
                  </div>

                  {/* Discord ile Devam Et Butonu */}
                  <button
                    type="button"
                    onClick={handleDiscordLogin}
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold bg-[#1a1431]/80 hover:bg-[#241c42] border border-purple-500/25 hover:border-purple-400/60 text-white transition-all flex items-center justify-center gap-2.5 shadow-sm group active:scale-[0.99]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#5865F2] group-hover:scale-110 transition-transform">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span>Discord ile devam et</span>
                  </button>

                  {/* Alt Geçiş Linki */}
                  <p className="text-center text-xs text-slate-400 pt-2">
                    {tab === 'login' ? (
                      <>
                        Henüz hesabın yok mu?{' '}
                        <button
                          type="button"
                          onClick={() => { setTab('register'); setError(''); }}
                          className="text-purple-400 hover:text-purple-300 font-semibold ml-1 transition-colors"
                        >
                          Kayıt Ol
                        </button>
                      </>
                    ) : (
                      <>
                        Zaten bir hesabın var mı?{' '}
                        <button
                          type="button"
                          onClick={() => { setTab('login'); setError(''); }}
                          className="text-purple-400 hover:text-purple-300 font-semibold ml-1 transition-colors"
                        >
                          Giriş Yap
                        </button>
                      </>
                    )}
                  </p>
                </>
              )}

              {tab === 'forgot' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError(''); }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <ArrowLeft size={13} /> Giriş Ekranına Dön
                  </button>
                </div>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}