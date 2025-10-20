import { useEffect, useRef } from 'react';

const SplashCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system for fluid effect
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
      hue: number;
    }> = [];

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let hue = 180; // Start with cyan

    // Create fluid cloud effect
    const createFluidParticles = (x: number, y: number, vx: number, vy: number) => {
      // Create multiple particles for dense cloud effect
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
          vx: vx * 0.5 + (Math.random() - 0.5) * 0.5,
          vy: vy * 0.5 + (Math.random() - 0.5) * 0.5,
          life: 1,
          size: Math.random() * 40 + 30,
          hue: hue + (Math.random() - 0.5) * 30
        });
      }
    };

    let lastX = mouseX;
    let lastY = mouseY;
    let lastTime = Date.now();

    // Animation loop
    const animate = () => {
      // Fade effect for trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Slowly change hue for color variation
      hue += 0.5;
      if (hue > 270) hue = 180; // Cycle through cyan to violet

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update physics
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95; // Smooth deceleration
        p.vy *= 0.95;
        p.life -= 0.008; // Slower fade
        p.size *= 0.99; // Gradual size reduction
        
        // Remove dead particles
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        // Draw fluid blob
        const alpha = p.life * 0.4;
        
        // Create radial gradient for soft edges
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size
        );
        
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 80%, 55%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 45%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      requestAnimationFrame(animate);
    };
    animate();

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      const dt = currentTime - lastTime;
      
      if (dt > 10) { // Throttle particle creation
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
          const vx = dx / dt * 10;
          const vy = dy / dt * 10;
          
          createFluidParticles(e.clientX, e.clientY, vx, vy);
          
          lastX = e.clientX;
          lastY = e.clientY;
          lastTime = currentTime;
        }
      }
      
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Click handler for burst effect
    const handleMouseDown = (e: MouseEvent) => {
      // Create dense burst
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 2 + Math.random() * 2;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: Math.random() * 50 + 40,
          hue: hue + (Math.random() - 0.5) * 40
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'screen'
      }}
    />
  );
};

export default SplashCursor;
