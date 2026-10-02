interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Inspirado no "Gradient Text" do React Bits: um degradê roxo que desliza
 * devagar pelo texto. O estilo mora na classe `.text-gradient-violet`, que
 * também pode ser aplicada direto em outros componentes.
 */
const GradientText = ({ children, className = '' }: GradientTextProps) => (
  <span className={`text-gradient-violet ${className}`}>{children}</span>
);

export default GradientText;
