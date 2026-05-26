import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff, Zap, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // URL'den `mode` al (login, register, forgot). Yoksa 'login' olsun.
  const initialMode = searchParams.get('mode') || 'login';
  // Giriş sonrası nereye döneceğini al.
  const nextPath = searchParams.get('next') || '/';

  const [tab, setTab] = useState(initialMode);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();

  // Mode URL'den değişirse tab'i senkronize et
  useEffect(() => {
    if (searchParams.get('mode')) {
      setTab(searchParams.get('mode'));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSuccessRedirect = () => {
    // Biraz bekleyip kullanıcıyı kaldığı yere yönlendir
    setTimeout(() => {
      navigate(nextPath, { replace: true });
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'forgot') {
      if (!form.email.includes('@')) { setError('Geçerli bir e-posta girin.'); return; }
      setLoading(true);
      try {
        await resetPassword(form.email);
        setSuccess(true);
      } catch (err) {
        setError(err.message || 'Sıfırlama maili gönderilemedi.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validation
    if (!form.email.includes('@')) { setError('Geçerli bir e-posta girin.'); return; }
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
        setTab('confirm_email');
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      // Google Auth kendi redirect'ini yapıyor, Supabase bunu handle eder
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-white flex items-center justify-center relative overflow-hidden font-inter select-none">
      
      {/* --- Büyüleyici Arka Plan Efektleri --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Hareketli Mistik Küreler */}
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.5, 1] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] bg-cyan-500/10 rounded-full blur-[100px]" 
        />
        {/* Izgara ve Vignette Deseni */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-[#05050A]"></div>
      </div>

      {/* Geri Dön Butonu */}
      <button 
        onClick={() => navigate(nextPath)}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft size={18} />
        </div>
        <span className="font-semibold text-sm">Geri Dön</span>
      </button>

      {/* --- Merkez Cam Panel (Glassmorphism) --- */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px] mx-4"
      >
        <div className="bg-[#0c0a10]/60 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_0_80px_rgba(168,85,247,0.15)] border border-white/10 relative overflow-hidden">
          
          {/* İçerik Yansıması Efekti */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          {/* Başlık ve Logo */}
          <div className="text-center mb-8 relative z-20">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
            >
              <Zap size={32} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            </motion.div>
            <h1 className="text-3xl font-black gradient-text tracking-tight mb-2">AniPeak</h1>
            <p className="text-slate-400 text-sm font-medium">
              {tab === 'login' ? 'Evrene geri dön ve okumaya başla' : 
               tab === 'register' ? 'Sınırları aş, efsaneler arasına katıl' : 
               tab === 'confirm_email' ? 'Aramıza katılmana çok az kaldı' :
               'Şifreni yenilemek için adım at'}
            </p>
          </div>

          {/* Sekmeler (Sadece Login ve Register için) */}
          {(tab === 'login' || tab === 'register') && (
            <div className="flex bg-black/40 backdrop-blur-md rounded-2xl p-1.5 mb-8 border border-white/5 relative z-20">
              {['login', 'register'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setError(''); setSuccess(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${
                    tab === t ? 'text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab === t && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/80 to-blue-600/80 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {t === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                    {t === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Başarı / Email Doğrulama Ekranı */}
          <AnimatePresence mode="wait">
            {(success || tab === 'confirm_email') && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="text-center py-6 relative z-20"
              >
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                >
                  <CheckCircle size={64} className="text-emerald-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                </motion.div>
                <h2 className="text-white font-black text-xl mb-2">
                  {tab === 'forgot' ? 'Mail Gönderildi! 📧' : 
                   tab === 'confirm_email' ? 'E-postanı Doğrula! 📧' : 
                   'Evrene Hoş Geldin! 🎉'}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {tab === 'forgot' || tab === 'confirm_email' 
                    ? 'Kayıt olduğun e-posta adresine bir bağlantı gönderdik. Lütfen gelen kutunu (ve spam klasörünü) kontrol et.' 
                    : 'Giriş başarılı, hikayeye kaldığın yerden devam edebilirsin. Yönlendiriliyorsun...'}
                </p>
                
                {tab === 'confirm_email' && (
                  <button 
                    onClick={() => { setTab('login'); setSuccess(false); }}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm transition-all"
                  >
                    Giriş Sayfasına Dön
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Alanı */}
          {!success && tab !== 'confirm_email' && (
            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'login' ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-5 relative z-20"
              >
                {tab === 'register' && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                    <input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      type="text"
                      required
                      placeholder="Efsanevi_Okuyucu"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:bg-purple-500/5 transition-all shadow-inner"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">E-posta Adresi</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    required
                    placeholder="sen@anipeak.com"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all shadow-inner"
                  />
                </div>

                {tab !== 'forgot' && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Şifre</label>
                    <div className="relative">
                      <input
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:bg-purple-500/5 transition-all shadow-inner"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'register' && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Şifre Tekrarı</label>
                    <div className="relative">
                      <input
                        name="password2"
                        value={form.password2}
                        onChange={handleChange}
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                )}

                {/* Hata Mesajı */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                        <span className="font-semibold leading-relaxed">{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Ekstra Linkler */}
                <div className="flex items-center justify-between mt-2">
                  {tab === 'login' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="remember" className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50" />
                        <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer">Beni hatırla</label>
                      </div>
                      <button type="button" onClick={() => setTab('forgot')} className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                        Şifremi Unuttum?
                      </button>
                    </>
                  ) : tab === 'forgot' ? (
                    <button type="button" onClick={() => setTab('login')} className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                      <ArrowLeft size={12} /> Giriş Ekranına Dön
                    </button>
                  ) : (
                    <p className="text-[10px] text-slate-500 px-1 leading-relaxed">
                      Kayıt olarak <a href="#" className="text-purple-400 hover:underline">Kullanım Şartları</a> ve <a href="#" className="text-purple-400 hover:underline">Gizlilik Politikası</a>'nı kabul etmiş sayılırsınız.
                    </p>
                  )}
                </div>

                {/* Ana Aksiyon Butonu */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 rounded-2xl text-sm font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Zap size={18} className="text-white/80" />
                    </motion.div>
                  ) : tab === 'login' ? 'Giriş Yap' : tab === 'register' ? 'Efsaneye Katıl' : 'Bağlantı Gönder'}
                </button>

                {/* Google ile Giriş (Sadece Login ve Register) */}
                {tab !== 'forgot' && (
                  <div className="pt-4 mt-4 border-t border-white/10 relative">
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0c0a10] px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">VEYA</span>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold bg-white border border-white hover:bg-slate-100 text-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google ile Devam Et
                    </button>
                  </div>
                )}
              </motion.form>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
