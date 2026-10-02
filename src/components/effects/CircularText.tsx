interface CircularTextProps {
  text: string;
  /** Diâmetro do círculo, em px. */
  size?: number;
  /** Tempo de uma volta, em segundos. */
  duration?: number;
  className?: string;
}

/**
 * Inspirado no "Circular Text" do React Bits: um texto girando devagar em
 * círculo, bom para emoldurar uma foto. Decorativo, então fica fora da
 * árvore de acessibilidade.
 */
const CircularText = ({ text, size = 200, duration = 22, className = '' }: CircularTextProps) => {
  const radius = size / 2 - 10;
  const id = `circle-${text.length}-${size}`;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={`animate-spin-slow ${className}`}
      style={{ animationDuration: `${duration}s` }}
    >
      <defs>
        <path
          id={id}
          d={`M ${size / 2}, ${size / 2} m -${radius}, 0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
        />
      </defs>
      <text className="fill-current font-mono text-[11px] uppercase tracking-[0.32em]">
        <textPath href={`#${id}`} textLength={2 * Math.PI * radius - 4}>
          {text}
        </textPath>
      </text>
    </svg>
  );
};

export default CircularText;
