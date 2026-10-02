import { useRef } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cor do holofote; qualquer cor CSS. */
  spotlightColor?: string;
}

/**
 * Inspirado no "Spotlight Card" do React Bits: um brilho suave segue o cursor
 * dentro do card. A posição vai por variável CSS, sem re-render no React.
 */
const SpotlightCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.06)',
  ...rest
}: SpotlightCardProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`group/spot relative overflow-hidden rounded-2xl border border-border bg-card/80 transition-colors duration-300 hover:border-white/15 ${className}`}
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(500px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 45%)`,
        }}
      />
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  );
};

export default SpotlightCard;
