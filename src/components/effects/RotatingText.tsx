import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface RotatingTextProps {
  words: string[];
  /** Tempo que cada palavra fica na tela, em ms. */
  interval?: number;
  className?: string;
}

/**
 * Inspirado no "Rotating Text" do React Bits: as palavras se revezam deslizando
 * de baixo para cima. Substitui o antigo efeito de digitação, que mexia na
 * largura da linha a cada letra.
 */
const RotatingText = ({ words, interval = 2400, className = '' }: RotatingTextProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [interval, prefersReducedMotion, words.length]);

  return (
    <span className={`relative -mb-[0.15em] inline-grid overflow-hidden pb-[0.15em] align-bottom ${className}`}>
      {/* Leitores de tela ouvem só a primeira palavra, sem anúncios a cada troca. */}
      <span className="sr-only">{words[0]}</span>
      {words.map((word, i) => {
        const offset = (i - index + words.length) % words.length;
        const state = offset === 0 ? 'current' : offset === words.length - 1 ? 'previous' : 'next';
        return (
          <span
            key={word}
            aria-hidden="true"
            className="col-start-1 row-start-1 whitespace-nowrap transition-[transform,opacity,filter] duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform:
                state === 'current' ? 'translateY(0)' : state === 'previous' ? 'translateY(-100%)' : 'translateY(100%)',
              opacity: state === 'current' ? 1 : 0,
              filter: state === 'current' ? 'blur(0)' : 'blur(6px)',
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};

export default RotatingText;
