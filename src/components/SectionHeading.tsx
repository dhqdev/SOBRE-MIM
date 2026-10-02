import BlurText from './effects/BlurText';
import DecryptedText from './effects/DecryptedText';

interface SectionHeadingProps {
  /** Número da seção, ex.: "01". */
  index: string;
  /** Etiqueta pequena acima do título, ex.: "Projetos". */
  eyebrow: string;
  /** Parte do título em branco. */
  title: string;
  /** Parte do título em cinza, completando a frase. */
  highlight: string;
  subtitle?: string;
}

/**
 * Cabeçalho padrão das seções: numeração discreta, título em duas tonalidades
 * (branco + cinza) e um subtítulo curto. Alinhado à esquerda, como o hero.
 */
const SectionHeading = ({ index, eyebrow, title, highlight, subtitle }: SectionHeadingProps) => (
  <div className="mb-14 md:mb-20">
    <p className="scroll-reveal flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <span className="text-accent">{index}</span>
      <span className="h-px w-8 bg-border" aria-hidden="true" />
      <DecryptedText text={eyebrow} />
    </p>

    <h2 className="mt-5 text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.1]">
      <BlurText text={title} className="text-foreground" />{' '}
      <BlurText text={highlight} className="text-muted-foreground/60" delay={150} />
    </h2>

    {subtitle && (
      <p className="scroll-reveal mt-5 max-w-xl text-lg text-muted-foreground">{subtitle}</p>
    )}
  </div>
);

export default SectionHeading;
