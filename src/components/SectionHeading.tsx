interface SectionHeadingProps {
  /** Etiqueta em mono acima do título, ex.: "projetos" vira `<projetos />`. */
  eyebrow: string;
  /** Parte do título em branco. */
  title: string;
  /** Parte do título no gradiente ciano→violeta. */
  highlight: string;
  subtitle?: string;
}

/**
 * Cabeçalho padrão das seções. Antes cada seção inventava o seu — uma com
 * badge e gradiente, outra com texto ciano puro, com tamanhos e espessuras de
 * régua diferentes. Centralizar aqui mantém o ritmo da página.
 */
const SectionHeading = ({ eyebrow, title, highlight, subtitle }: SectionHeadingProps) => (
  <div className="text-center mb-16 scroll-reveal">
    <span className="inline-block font-mono text-sm text-primary px-4 py-1.5 rounded-full border border-primary/25 bg-primary/5">
      &lt;{eyebrow} /&gt;
    </span>

    <h2 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight">
      {title}{' '}
      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {highlight}
      </span>
    </h2>

    <div className="mt-5 mx-auto h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />

    {subtitle && (
      <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
    )}
  </div>
);

export default SectionHeading;
