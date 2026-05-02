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
    particlesRef.globalAngle = 0; // For galaxy rotation
    
    const count = effectType === 'void-particles' ? 200 // Devasa galaksi
                : effectType === 'blood-rain' ? 150 // Harlayan ateş kıvılcımları
                : effectType === 'black-flash' ? 80 // Hızlı şimşekler
                : effectType === 'shadow-arise' ? 120 // Yoğun gölge dumanları
                : 1; // Dharma wheel just needs 1 main particle
                
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 5 + 2, // Daha büyük
        speedX: (Math.random() - 0.5) * 6, // Daha hızlı
        speedY: (Math.random() - 0.5) * 6, // Daha hızlı
        life: Math.random() * 200, // Daha uzun ömür
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * (width / 2) // For spiral
      });
    }
  }

  const particles = particlesRef.current;
  
  // Clear slightly more opaque for stronger trails
  ctx.fillStyle = 'rgba(5, 5, 10, 0.3)';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'screen'; // Parlama efekti için çok kritik

  if (effectType === 'void-particles') {
    // Gojo Void - Devasa Dönen Galaksi Girdabı
    const cx = width / 2;
    const cy = height / 2;
    particlesRef.globalAngle += 0.002;
    
    particles.forEach(p => {
      p.distance -= 0.5; // Girdabın içine çekil
      p.angle += 0.02 + (100 / Math.max(p.distance, 10)); // Merkeze yaklaştıkça hızlan
      
      if (p.distance <= 0) {
        p.distance = width / 2;
        p.angle = Math.random() * Math.PI * 2;
      }

      const x = cx + Math.cos(p.angle + particlesRef.globalAngle) * p.distance;
      const y = cy + Math.sin(p.angle + particlesRef.globalAngle) * p.distance;

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${230 + Math.sin(p.life/10)*50}, 100%, 70%, ${0.5 + Math.sin(p.life/20)*0.5})`;
      ctx.shadowBlur = p.size * 3;
      ctx.shadowColor = '#8b5cf6';
      ctx.fill();
      
      p.life++;
    });
  } 
  else if (effectType === 'blood-rain') {
    // Sukuna - Malevolent Shrine (Ağaç Görünümlü Tapınak) ve Harlayan Kıvılcımlar
    const centerX = width / 2;
    const bottomY = height;

    // Tapınak Silhouette (Basit ama etkileyici bir yapı)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX - 60, bottomY);
    ctx.quadraticCurveTo(centerX - 50, bottomY - 100, centerX - 100, bottomY - 120); // Sol çatı
    ctx.lineTo(centerX, bottomY - 180); // Tepe
    ctx.lineTo(centerX + 100, bottomY - 120); // Sağ çatı
    ctx.quadraticCurveTo(centerX + 50, bottomY - 100, centerX + 60, bottomY);
    ctx.fillStyle = 'rgba(20, 10, 10, 0.9)';
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#dc2626';
    ctx.fill();

    // Tapınak Gözleri/Işıkları
    ctx.beginPath();
    ctx.arc(centerX - 20, bottomY - 130, 4, 0, Math.PI * 2);
    ctx.arc(centerX + 20, bottomY - 130, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0000';
    ctx.fill();
    ctx.restore();

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? '#dc2626' : '#f97316'; 
      ctx.shadowBlur = p.size * 4;
      ctx.shadowColor = '#dc2626';
      ctx.fill();
      
      p.y -= (Math.random() * 4 + 3);
      p.x += Math.sin(p.life / 10) * 2;
      p.life++;
      p.size *= 0.98; 
      
      if (p.y < 0 || p.size < 0.5) {
        p.y = height + 10;
        p.x = Math.random() * width;
        p.size = Math.random() * 6 + 3;
      }
    });
  }
  else if (effectType === 'black-flash') {
    // Itadori - Agresif ve Patlayıcı Şimşekler
    ctx.lineWidth = 3;
    particles.forEach(p => {
      if (Math.random() > 0.90) { // Sık şimşekler
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (Math.random() - 0.5) * 150, p.y + (Math.random() - 0.5) * 150); // Uzun şimşek kolları
        const isBlack = Math.random() > 0.6;
        ctx.strokeStyle = isBlack ? 'rgba(0,0,0,0.8)' : '#3b82f6';
        ctx.shadowBlur = isBlack ? 0 : 20;
        ctx.shadowColor = '#3b82f6';
        ctx.stroke();
        
        // Çarpma noktasında kıvılcım
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.random() * 10 + 5, 0, Math.PI*2);
        ctx.fillStyle = isBlack ? '#000' : '#f97316';
        ctx.fill();
      }
      p.x += p.speedX * 5;
      p.y += p.speedY * 5;
      if (p.x < 0 || p.x > width) p.speedX *= -1;
      if (p.y < 0 || p.y > height) p.speedY *= -1;
    });
  }
  else if (effectType === 'shadow-arise') {
    // Jinwoo - Devasa, Ağır Ağır Yükselen Kara Alevler/Gölge
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 58, 237, ${0.1 + (200-p.life)/1000})`; // Mor ve siyah arası
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#581c87';
      ctx.fill();
      
      // Kara gölge efekti (üst üste bindirme)
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + (200-p.life)/500})`;
      ctx.fill();
      
      p.y -= (Math.random() * 2 + 1);
      p.x += Math.sin(p.life / 20) * 1.5;
      p.size += 0.1;
      p.life--;
      
      if (p.life <= 0 || p.y < -50) {
        p.y = height + 50;
        p.x = Math.random() * width;
        p.life = 200;
        p.size = Math.random() * 5 + 3;
      }
    });
  }
  else if (effectType === 'dharma-wheel') {
    // Mahoraga - Arkada dönen devasa ışıklı altın çark ve yayılan enerji dalgaları
    const p = particles[0];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.45; // Daha devasa
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(p.angle);
    
    // Göz kamaştırıcı arka plan ışıltısı
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(0,0,radius*0.5, 0,0,radius*1.2);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.1)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Dış Çember
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 10;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#f59e0b';
    ctx.stroke();
    
    // Çark Külliyesi (Spokes)
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos((i * Math.PI) / 4) * radius, Math.sin((i * Math.PI) / 4) * radius);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 6;
      ctx.stroke();
      
      // Topuzlar
      ctx.beginPath();
      ctx.arc(Math.cos((i * Math.PI) / 4) * radius, Math.sin((i * Math.PI) / 4) * radius, 15, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#fef08a';
      ctx.fill();
    }
    
    ctx.restore();
    p.angle += 0.01; // Dönüş hızı arttırıldı
  }

  ctx.globalCompositeOperation = 'source-over'; // Restore
}
