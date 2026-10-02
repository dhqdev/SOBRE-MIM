const COLORS = ['#a78bfa', '#c4b5fd', '#8b5cf6', '#f5f5f5', '#6ee7b7'];

/**
 * Solta um punhado de confetes a partir de um ponto da tela. Cada pedaço é um
 * <span> animado com a Web Animations API e removido ao terminar, então não
 * sobra nada no DOM nem precisa de biblioteca.
 */
export const burstConfetti = (x: number, y: number, count = 36) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    const size = 5 + Math.random() * 5;
    piece.setAttribute('aria-hidden', 'true');
    Object.assign(piece.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size * (Math.random() > 0.5 ? 1 : 0.45)}px`,
      background: COLORS[i % COLORS.length],
      borderRadius: Math.random() > 0.6 ? '999px' : '1px',
      pointerEvents: 'none',
      zIndex: '95',
    });
    document.body.appendChild(piece);

    // Sobe num leque e cai com "gravidade".
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const velocity = 120 + Math.random() * 180;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;
    const spin = (Math.random() - 0.5) * 900;

    const animation = piece.animate(
      [
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx * 1.3}px, ${dy + 260}px) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 600, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' }
    );
    animation.onfinish = () => piece.remove();
  }
};
