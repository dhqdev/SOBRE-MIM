interface StarBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Cor da luz que percorre a borda. */
  color?: string;
}

/**
 * Inspirado no "Star Border" do React Bits: duas luzes correm pelas bordas de
 * cima e de baixo do botão, em sentidos opostos.
 */
const StarBorder = ({ children, className = '', color = 'rgb(167, 139, 250)' }: StarBorderProps) => (
  <span className={`relative inline-block overflow-hidden rounded-xl p-px ${className}`}>
    <span
      aria-hidden="true"
      className="absolute -bottom-3 right-[-250%] h-1/2 w-[300%] animate-star-bottom rounded-full opacity-80"
      style={{ background: `radial-gradient(circle, ${color}, transparent 12%)` }}
    />
    <span
      aria-hidden="true"
      className="absolute -top-3 left-[-250%] h-1/2 w-[300%] animate-star-top rounded-full opacity-80"
      style={{ background: `radial-gradient(circle, ${color}, transparent 12%)` }}
    />
    <span className="relative block">{children}</span>
  </span>
);

export default StarBorder;
