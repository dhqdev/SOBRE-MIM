interface LogoLoopItem {
  name: string;
  icon: string;
}

interface LogoLoopProps {
  items: LogoLoopItem[];
  /** Tempo de uma volta completa, em segundos. */
  duration?: number;
  reverse?: boolean;
}

/**
 * Inspirado no "Logo Loop" do React Bits: uma faixa de logos rolando sem fim,
 * com as bordas sumindo num degradê. Pausa quando o mouse passa por cima.
 * A lista é repetida até passar da largura da tela, renderizada duas vezes, e
 * a faixa anda metade da largura — assim a emenda nunca aparece.
 */
const LogoLoop = ({ items, duration = 40, reverse = false }: LogoLoopProps) => {
  const segment = [...items, ...items, ...items];
  return (
  <div className="logo-loop overflow-hidden" aria-hidden="true">
    <div
      className="logo-loop-track flex w-max"
      style={
        {
          '--loop-duration': `${duration}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        } as React.CSSProperties
      }
    >
      {[...segment, ...segment].map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="flex items-center gap-3 px-6 sm:px-8 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <img
            src={item.icon}
            alt=""
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            className="h-7 w-7 object-contain grayscale opacity-70 transition duration-300 hover:grayscale-0 hover:opacity-100"
          />
          <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
        </div>
      ))}
    </div>
  </div>
  );
};

export default LogoLoop;
