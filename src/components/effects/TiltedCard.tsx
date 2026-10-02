import { useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  /** Inclinação máxima, em graus. */
  maxTilt?: number;
}

/**
 * Inspirado no "Tilted Card" do React Bits: o conteúdo inclina em 3D seguindo
 * o cursor, com um reflexo de luz por cima. Só no mouse; no toque fica parado.
 */
const TiltedCard = ({ children, className = '', maxTilt = 7 }: TiltedCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element || prefersReducedMotion || event.pointerType !== 'mouse') return;
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    element.style.transform = `perspective(900px) rotateX(${(0.5 - py) * maxTilt}deg) rotateY(${(px - 0.5) * maxTilt}deg) scale(1.02)`;
    element.style.setProperty('--glare-x', `${px * 100}%`);
    element.style.setProperty('--glare-y', `${py * 100}%`);
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={`group/tilt relative transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        style={{
          background:
            'radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.14), transparent 55%)',
        }}
      />
    </div>
  );
};

export default TiltedCard;
