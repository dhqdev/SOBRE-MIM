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
 * o cursor. Só no mouse; no toque fica parado. (O reflexo branco por cima saiu
 * a pedido do David: ficava uma bola clara seguindo o mouse.)
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
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={`relative transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};

export default TiltedCard;
