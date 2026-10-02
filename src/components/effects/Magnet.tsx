import { useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface MagnetProps {
  children: React.ReactNode;
  /** Quanto o elemento acompanha o cursor; maior = mais sutil. */
  strength?: number;
  className?: string;
}

/**
 * Inspirado no "Magnet" do React Bits: o elemento é puxado levemente na
 * direção do cursor e volta ao lugar quando ele sai.
 */
const Magnet = ({ children, strength = 6, className = '' }: MagnetProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element || prefersReducedMotion) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - (rect.left + rect.width / 2)) / strength;
    const y = (event.clientY - (rect.top + rect.height / 2)) / strength;
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate3d(0, 0, 0)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`inline-block transition-transform duration-300 ease-out ${className}`}
    >
      {children}
    </div>
  );
};

export default Magnet;
