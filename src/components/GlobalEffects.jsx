import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GlobalEffects() {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

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
    if (!animations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }, [user?.appearance_settings]);

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

    const ctx = canvas.getContext('2d', { alpha: true });
    
    let animationFrameId;
    let particles = [];
    let width, height;

    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 0.5;
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
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        
        // Subtle glow for some particles
        if (this.radius > 1.5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = this.color;
        } else {
          ctx.shadowBlur = 0;
        }
      }
    }

    function initParticles() {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 15000), 120);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    resizeCanvas();

    const drawGrid = () => {
      const spacing = 100;
      const px = (mouse.current.x - width / 2) * 0.005;
      const py = (mouse.current.y - height / 2) * 0.005;

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.03)';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;

      ctx.beginPath();
      for (let x = (px % spacing); x < width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = (py % spacing); y < height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Performance optimization: 148 FPS target (actually matches monitor refresh rate)
      drawGrid();

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Special effects for Admin/Premium (Matrix blend)
      if (user?.role === 'Baş Admin' || user?.role === 'Yönetici') {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
        ctx.font = '10px monospace';
        for(let i = 0; i < 10; i++) {
            ctx.fillText(Math.random().toString(36).substring(7), Math.random() * width, Math.random() * height);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [user]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      role="presentation"
      className={`fixed inset-0 pointer-events-none z-[-1] gpu-accelerated transition-colors duration-700 ${
        user?.appearance_settings?.theme === 'amoled' ? 'bg-black' : 'bg-[#050507]'
      }`}
      style={{ opacity: 0.9 }}
    />
  );
}

