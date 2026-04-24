import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GlobalEffects() {
  const { user } = useAuth();
  const canvasRef = useRef(null);

  useEffect(() => {
    // Sadece Admin ve Premium kullanıcılar için aktif
    const isAdmin = user?.role === 'Baş Admin' || user?.role === 'Yönetici';
    const isPremium = user?.premium === true;
    
    if (!isAdmin && !isPremium) return;
    
    // Varsayılan efekt: Adminlere Matrix, Premiumlara Sakura (veya ayarlara göre değiştirilebilir)
    // Şimdilik Admin/Yönetici isek Matrix yapalım.
    const effectType = isAdmin ? 'matrix' : 'sakura';

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (effectType === 'matrix') {
      // ── MATRIX RAIN EFEKTİ ──
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
      const fontSize = 14;
      const columns = Math.floor(canvas.width / fontSize) + 1; // Ekran boyutuna göre kolon sayısı
      
      const drops = [];
      for (let x = 0; x < columns; x++) {
        drops[x] = Math.random() * -100; // Ekrana aynı anda düşmemeleri için rastgele başlangıç
      }

      const drawMatrix = () => {
        // Yarı saydam siyah arkaplan ile izinli (trail) efekti
        ctx.fillStyle = 'rgba(5, 5, 7, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0f0'; // Klasik yeşil (veya rgba(168,85,247,0.5) siber mor)
        // Animain siber hissiyatı için neon yeşil-mor arası hafif ton
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)'; // Emerald 500 %30 opacity (Göz yormasın)
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
          const text = letters.charAt(Math.floor(Math.random() * letters.length));
          
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
        animationFrameId = requestAnimationFrame(drawMatrix);
      };
      
      drawMatrix();

    } else if (effectType === 'sakura') {
      // ── SAKURA (KİRAZ ÇİÇEĞİ) EFEKTİ ──
      const particles = [];
      const particleCount = 30; // Performans için düşük tutuldu
      
      for(let i=0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 2,
          speedX: Math.random() * 1 - 0.5,
          speedY: Math.random() * 1 + 0.5,
          color: `rgba(244, 114, 182, ${Math.random() * 0.4 + 0.2})` // Pink 400
        });
      }
      
      const drawSakura = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          
          p.x += p.speedX;
          p.y += p.speedY;
          
          // Rüzgar ve sallanma hissi
          p.x += Math.sin(p.y / 50) * 0.5;
          
          // Ekrandan çıkınca yukarıdan tekrar başlat
          if (p.y > canvas.height) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
          }
          if (p.x > canvas.width) p.x = 0;
          if (p.x < 0) p.x = canvas.width;
        });
        
        animationFrameId = requestAnimationFrame(drawSakura);
      };
      
      drawSakura();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [user]);

  // Sadece Admin ve Premiumlar için Canvas oluştur, aksi halde boş döner
  const isAdminOrPremium = user?.role === 'Baş Admin' || user?.role === 'Yönetici' || user?.premium === true;
  if (!isAdminOrPremium) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
      style={{ opacity: 0.8 }}
    />
  );
}
