import { useEffect, useState } from 'react';
import { useInView } from '@/hooks/useInView';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/';

interface DecryptedTextProps {
  text: string;
  className?: string;
  /** Intervalo entre os quadros da animação, em ms. */
  speed?: number;
}

/**
 * Inspirado no "Decrypted Text" do React Bits: ao aparecer, o texto surge
 * embaralhado e vai se revelando da esquerda para a direita.
 */
const DecryptedText = ({ text, className = '', speed = 40 }: DecryptedTextProps) => {
  const [ref, inView] = useInView<HTMLSpanElement>(0.5);
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOutput(text);
      return;
    }

    let revealed = 0;
    const id = window.setInterval(() => {
      revealed += 0.5;
      setOutput(
        text
          .split('')
          .map((char, i) =>
            char === ' ' || i < revealed ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join('')
      );
      if (revealed >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [inView, speed, text]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{output}</span>
    </span>
  );
};

export default DecryptedText;
