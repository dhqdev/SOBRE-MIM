import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface CountUpProps {
  to: number;
  /** Duração da contagem, em ms. */
  duration?: number;
  suffix?: string;
  className?: string;
}

/** Inspirado no "Count Up" do React Bits: conta de 0 até o valor quando aparece. */
const CountUp = ({ to, duration = 1600, suffix = '', className }: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(prefersReducedMotion ? to : 0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      setValue(to);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          // ease-out: desacelera perto do fim
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * to));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [duration, prefersReducedMotion, to]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {value}
      {suffix}
    </span>
  );
};

export default CountUp;
