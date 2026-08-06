import { useEffect } from 'react';

const SELECTOR = '.scroll-reveal';

/**
 * Revela os elementos `.scroll-reveal` conforme entram na viewport.
 *
 * Como esses elementos começam com `opacity: 0`, qualquer falha aqui deixaria
 * conteúdo invisível — por isso há duas saídas de segurança: navegador sem
 * IntersectionObserver e preferência por menos movimento revelam tudo de uma vez.
 */
export const useScrollReveal = () => {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll(SELECTOR));
    const revealAll = () => elements.forEach((el) => el.classList.add('revealed'));

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('revealed');
          // Uma vez revelado, o elemento não precisa mais ser observado.
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
};
