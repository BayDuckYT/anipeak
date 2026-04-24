export function renderCanvasEffect(ctx, canvas, effectType, particlesRef) {
  if (!effectType || effectType === 'none') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const { width, height } = canvas;
  
  // Initialize particles if empty or effect changed
  if (!particlesRef.current || particlesRef.effect !== effectType) {
    particlesRef.current = [];
    particlesRef.effect = effectType;
    
    const count = effectType === 'void-particles' ? 50 
                : effectType === 'blood-rain' ? 100 
                : effectType === 'black-flash' ? 30
                : effectType === 'shadow-arise' ? 80
                : 1; // Dharma wheel just needs 1 main particle
                
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        life: Math.random() * 100,
        angle: Math.random() * Math.PI * 2
      });
    }
  }

  const particles = particlesRef.current;
  
  // Semi-transparent clear for trailing effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, width, height);

  if (effectType === 'void-particles') {
    // Gojo Void - Blue/Purple slow floating particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${240 + Math.sin(p.life/20) * 40}, 100%, 70%, ${0.3 + Math.sin(p.life/10)*0.2})`;
      ctx.fill();
      
      p.y -= 0.5;
      p.x += Math.sin(p.life / 20) * 0.5;
      p.life++;
      
      if (p.y < 0) p.y = height;
    });
  } 
  else if (effectType === 'blood-rain') {
    // Sukuna - Fast red streaks falling
    ctx.lineWidth = 2;
    particles.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.speedX * 2, p.y - p.speedY * 5);
      ctx.strokeStyle = `rgba(220, 38, 38, ${Math.random() * 0.5 + 0.2})`; // Red
      ctx.stroke();
      
      p.y += p.speedY * 2 + 5;
      p.x += p.speedX;
      
      if (p.y > height) {
        p.y = 0;
        p.x = Math.random() * width;
      }
    });
  }
  else if (effectType === 'black-flash') {
    // Itadori - Sharp erratic orange/black flashes
    particles.forEach(p => {
      if (Math.random() > 0.95) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (Math.random() - 0.5) * 50, p.y + (Math.random() - 0.5) * 50);
        ctx.strokeStyle = Math.random() > 0.5 ? '#f97316' : '#000000';
        ctx.lineWidth = Math.random() * 3 + 1;
        ctx.stroke();
      }
      p.x += p.speedX * 3;
      p.y += p.speedY * 3;
      if (p.x < 0 || p.x > width) p.speedX *= -1;
      if (p.y < 0 || p.y > height) p.speedY *= -1;
    });
  }
  else if (effectType === 'shadow-arise') {
    // Jinwoo - Dark purple/black rising smoke-like particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 58, 237, ${0.1 + (100-p.life)/500})`;
      ctx.fill();
      
      p.y -= 1.5;
      p.size += 0.05;
      p.life--;
      
      if (p.life <= 0 || p.y < 0) {
        p.y = height;
        p.x = Math.random() * width;
        p.life = 100;
        p.size = Math.random() * 3 + 1;
      }
    });
  }
  else if (effectType === 'dharma-wheel') {
    // Mahoraga - Golden rotating wheel in the background center
    const p = particles[0];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(p.angle);
    
    // Draw wheel
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw spokes
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos((i * Math.PI) / 4) * radius, Math.sin((i * Math.PI) / 4) * radius);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw end nodes
      ctx.beginPath();
      ctx.arc(Math.cos((i * Math.PI) / 4) * radius, Math.sin((i * Math.PI) / 4) * radius, 8, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.fill();
    }
    
    ctx.restore();
    p.angle += 0.005; // Slow rotation
  }
}
