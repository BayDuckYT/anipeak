export function renderCanvasEffect(ctx, canvas, effectType, particlesRef) {
  if (!effectType || effectType === 'none') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  // [PURGED] Character-specific effects are no longer supported.
  const purgedEffects = ['void-particles', 'blood-rain', 'black-flash', 'shadow-arise', 'dharma-wheel'];
  if (purgedEffects.includes(effectType)) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const { width, height } = canvas;
  
  // Initialize particles if empty or effect changed
  if (!particlesRef.current || particlesRef.effect !== effectType) {
    particlesRef.current = [];
    particlesRef.effect = effectType;
    particlesRef.globalAngle = 0;
    
    // Fallback or generic particles if needed in future
    const count = 50;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        life: Math.random() * 100,
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * (width / 2)
      });
    }
  }

  const particles = particlesRef.current;
  ctx.fillStyle = 'rgba(5, 5, 10, 0.3)';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'screen';

  // Generic particle animation for any other non-purged effects
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    
    p.x += p.speedX;
    p.y += p.speedY;
    
    if (p.x < 0 || p.x > width) p.speedX *= -1;
    if (p.y < 0 || p.y > height) p.speedY *= -1;
  });

  ctx.globalCompositeOperation = 'source-over';
}
