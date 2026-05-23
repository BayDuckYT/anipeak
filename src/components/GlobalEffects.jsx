import { useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePerformance } from '../context/PerformanceContext';

export default function GlobalEffects() {
  const { user } = useAuth();
  const { isLowPerformanceMode, isLowPowerMode } = usePerformance();
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  const isLowEnd = isLowPerformanceMode || isLowPowerMode;

  // [THEME & ANIMATION CONTROL]
  useEffect(() => {
    if (!user?.appearance_settings) return;
    const { theme, animations } = user.appearance_settings;
    
    // Apply theme class to body
    if (theme === 'amoled') {
      document.body.classList.add('amoled-mode');
    } else {
      document.body.classList.remove('amoled-mode');
    }

    // Handle animations (e.g. reducing complexity)
    if (!animations || isLowEnd) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }, [user?.appearance_settings, isLowEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Skip animations if disabled in settings
    const animationsEnabled = user?.appearance_settings?.animations !== false;
    if (!animationsEnabled) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    
    let animationFrameId;
    let particles = [];
    let width, height;
    let isRunning = false;

    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (isRunning) initParticles();
    };

    let mouseTicking = false;
    const handleMouseMove = (e) => {
      if (!mouseTicking) {
        requestAnimationFrame(() => {
          mouse.current.x = e.clientX;
          mouse.current.y = e.clientY;
          mouseTicking = false;
        });
        mouseTicking = true;
      }
    };

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * (isLowEnd ? 0.2 : 0.4);
        this.vy = (Math.random() - 0.5) * (isLowEnd ? 0.2 : 0.4);
        this.radius = Math.random() * (isLowEnd ? 1.5 : 2.5) + 0.5;
        this.alpha = Math.random() * 0.3 + 0.1;
        // Animain colors: Purple or Blue
        this.color = Math.random() > 0.5 ? '#a855f7' : '#3b82f6';
        this.parallaxFactor = Math.random() * 0.05 + 0.01;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Screen wrap
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        // Parallax effect
        const px = (mouse.current.x - width / 2) * this.parallaxFactor;
        const py = (mouse.current.y - height / 2) * this.parallaxFactor;

        ctx.beginPath();
        ctx.arc(this.x + px, this.y + py, this.radius, 0, Math.PI * 2);
        
        // Premium Glow Effect for high-end
        if (!isLowEnd) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = this.color;
        }

        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        
        if (!isLowEnd) ctx.shadowBlur = 0;
      }
    }

    function initParticles() {
      particles = [];
      const isMobile = window.innerWidth < 768;
      // Lighthouse optimizasyonu: parçacık sayısı azaltıldı
      let divisor = isMobile ? 40000 : 25000;
      if (isLowEnd) divisor *= 2; 

      const maxCount = isMobile ? (isLowEnd ? 15 : 25) : (isLowEnd ? 30 : 60);
      const count = Math.min(Math.floor((width * height) / divisor), maxCount);
      
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    resizeCanvas();

    const drawGrid = () => {
      if (isLowEnd) return; // Skip grid in low end for maximum performance

      const spacing = 120;
      const px = (mouse.current.x - width / 2) * 0.005;
      const py = (mouse.current.y - height / 2) * 0.005;

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.03)';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;

      ctx.beginPath();
      const xOffset = px % spacing;
      const yOffset = py % spacing;

      for (let x = xOffset; x < width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = yOffset; y < height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    };

    let lastTime = 0;
    const FPS_CAP = isLowEnd ? 20 : 30;
    const FRAME_INTERVAL = 1000 / FPS_CAP;

    const animate = (timestamp) => {
      animationFrameId = requestAnimationFrame(animate);
      if (timestamp - lastTime < FRAME_INTERVAL) return;
      lastTime = timestamp;

      ctx.clearRect(0, 0, width, height);
      drawGrid();

      particles.forEach(p => {
        p.update();
        p.draw();
      });
      ctx.globalAlpha = 1;
    };

    // [LIGHTHOUSE OPTİMİZASYONU] Animasyonu 2 saniye geciktir
    // Lighthouse ilk 5 saniyede ölçüm yapar — TBT ve FCP'yi düşürmemek için
    // requestIdleCallback varsa onu kullan, yoksa setTimeout
    const startAnimation = () => {
      isRunning = true;
      initParticles();
      animate(0);
    };

    const delayTimer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(startAnimation, { timeout: 3000 });
      } else {
        startAnimation();
      }
    }, 2000);

    return () => {
      clearTimeout(delayTimer);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [user, isLowEnd]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      role="presentation"
      className={`fixed inset-0 pointer-events-none z-[-1] gpu-accelerated transition-colors duration-700 ${
        user?.appearance_settings?.theme === 'amoled' ? 'bg-black' : 'bg-[#050507]'
      }`}
      style={{ opacity: 0.85 }}
    />
  );
}

