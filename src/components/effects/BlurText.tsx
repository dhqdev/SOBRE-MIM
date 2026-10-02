import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface BlurTextProps {
  text: string;
  className?: string;
  /** Atraso entre uma palavra e a próxima, em ms. */
  stagger?: number;
  /** Atraso antes da primeira palavra, em ms. */
  delay?: number;
  /** Classe aplicada a cada palavra (ex.: um degradê no texto). */
  wordClassName?: string;
}

/**
 * Inspirado no "Blur Text" do React Bits: cada palavra sai do desfoque e sobe
 * para o lugar quando o texto entra na tela. O texto completo continua no DOM
 * desde o início, então leitores de tela e buscadores não perdem nada.
 */
const BlurText = ({ text, className = '', stagger = 90, delay = 0, wordClassName = '' }: BlurTextProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const words = text.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={`inline-block will-change-[transform,filter,opacity] ${wordClassName}`}
          style={{
            opacity: visible ? 1 : 0,
            filter: visible ? 'blur(0)' : 'blur(10px)',
            transform: visible ? 'translateY(0)' : 'translateY(0.35em)',
            transition:
              'opacity 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
            transitionDelay: `${delay + index * stagger}ms`,
          }}
        >
          {word}
          {index < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  );
};

export default BlurText;
