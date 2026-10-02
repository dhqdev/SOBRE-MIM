import { useEffect, useRef } from 'react';

interface ScrollVelocityProps {
  text: string;
  /** Velocidade base, em px por segundo. */
  baseVelocity?: number;
  className?: string;
}

/**
 * Inspirado no "Scroll Velocity" do React Bits: uma faixa de texto que anda
 * sozinha e acelera (e troca de sentido) conforme a pessoa rola a página.
 */
const ScrollVelocity = ({ text, baseVelocity = 40, className = '' }: ScrollVelocityProps) => {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let offset = 0;
    let direction = 1;
    let boost = 0;
    let lastScroll = window.scrollY;
    let lastTime = performance.now();
    let frame = 0;
    let visible = false;

    const onScroll = () => {
      const delta = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      if (delta !== 0) direction = delta > 0 ? 1 : -1;
      boost = Math.min(boost + Math.abs(delta) * 0.6, 900);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      boost *= 0.92;
      offset -= direction * (baseVelocity + boost) * dt;
      const half = track.scrollWidth / 2;
      if (half > 0) {
        if (offset <= -half) offset += half;
        if (offset > 0) offset -= half;
      }
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      frame = visible ? requestAnimationFrame(tick) : 0;
    };

    // Só anima enquanto a faixa está na tela.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    });
    observer.observe(track);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [baseVelocity]);

  const items = Array.from({ length: 8 }, () => text);

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden="true">
      <div ref={trackRef} className="inline-flex will-change-transform">
        {[...items, ...items].map((item, index) => (
          <span key={index} className="flex items-center">
            {item}
            <span className="mx-6 text-accent sm:mx-10">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default ScrollVelocity;
