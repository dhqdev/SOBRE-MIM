import { useState, useEffect } from 'react';
import LinkedInTooltip from './LinkedInTooltip';
import GitHubTooltip from './GitHubTooltip';
import WhatsAppIcon from './WhatsAppIcon';
import { ArrowDown, Code2, Briefcase, Rocket, Terminal } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { WHATSAPP_URL } from '@/lib/contact';
import davidProfile from '@/assets/david-profile.webp';

const PHRASES = [
  'Desenvolvedor Full-Stack',
  'Especialista em Vue & React',
  'Automação & Integração',
  'Frappe Framework',
];

const TYPE_MS = 80;
const ERASE_MS = 50;
const HOLD_MS = 2000;

/**
 * Chips que orbitam a foto. Substituem os emojis (💻⚡🚀✨🎯) que davam um tom
 * infantil ao topo — mesma ideia de movimento, agora dizendo algo sobre a stack.
 * As posições são diferentes no mobile e no desktop, por isso vêm de fora.
 */
const orbitChips = [
  { label: 'Vue', color: '#42B883', animation: 'animate-orbit-1' },
  { label: 'React', color: '#61DAFB', animation: 'animate-orbit-2' },
  { label: 'Python', color: '#FFD343', animation: 'animate-orbit-3' },
  { label: 'Frappe', color: '#7575FF', animation: 'animate-orbit-4' },
];

const OrbitChip = ({
  label,
  color,
  animation,
  className,
}: {
  label: string;
  color: string;
  animation: string;
  className: string;
}) => (
  <div
    className={`absolute ${className} ${animation} pointer-events-none select-none`}
    aria-hidden="true"
  >
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-background/80 backdrop-blur-md shadow-lg font-mono text-[11px] text-foreground/90 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  </div>
);

const stats = [
  { icon: Code2, value: '2+', label: 'Anos de XP' },
  { icon: Briefcase, value: '10+', label: 'Projetos' },
  { icon: Rocket, value: '5+', label: 'Tecnologias' },
];

/** Conteúdo do "perfil.json" exibido no card de terminal. */
const profileEntries: Array<{ key: string; value: string | string[] }> = [
  { key: 'nome', value: 'David Fernandes' },
  { key: 'cargo', value: 'Full-Stack Developer' },
  { key: 'empresa', value: 'GRV Software' },
  { key: 'stack', value: ['Vue', 'React', 'Python', 'Frappe'] },
  { key: 'foco', value: 'automação & integrações' },
  { key: 'status', value: 'disponível para projetos' },
];

const JsonString = ({ children }: { children: string }) => (
  <span className="text-neon-yellow">"{children}"</span>
);

const TerminalCard = () => (
  <div className="relative group">
    {/* Brilho difuso atrás do card */}
    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/50 via-accent/30 to-neon-green/40 opacity-60 blur-[2px] group-hover:opacity-90 transition-opacity duration-500" />

    <div className="relative rounded-2xl overflow-hidden bg-card/90 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Barra de título estilo macOS */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs font-mono text-muted-foreground truncate">
          david@portfolio: ~
        </span>
      </div>

      <div className="p-5 sm:p-6 font-mono text-[13px] sm:text-sm leading-relaxed">
        <p className="mb-3">
          <span className="text-neon-green">$</span>{' '}
          <span className="text-foreground">cat perfil.json</span>
        </p>

        <div className="text-muted-foreground">
          <p>{'{'}</p>

          {profileEntries.map(({ key, value }, index) => (
            <p key={key} className="pl-4 break-words">
              <span className="text-primary">"{key}"</span>
              <span>: </span>
              {Array.isArray(value) ? (
                <>
                  <span>[</span>
                  {value.map((item, i) => (
                    <span key={item}>
                      <JsonString>{item}</JsonString>
                      {i < value.length - 1 && <span>, </span>}
                    </span>
                  ))}
                  <span>]</span>
                </>
              ) : (
                <JsonString>{value}</JsonString>
              )}
              {index < profileEntries.length - 1 && <span>,</span>}
            </p>
          ))}

          <p>{'}'}</p>
        </div>

        <p className="mt-3">
          <span className="text-neon-green">$</span>{' '}
          <span className="animate-pulse text-primary" aria-hidden="true">
            ▌
          </span>
        </p>
      </div>
    </div>
  </div>
);

const TerminalHero = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayedText, setDisplayedText] = useState(PHRASES[0]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(PHRASES[0]);
      return;
    }

    const phrase = PHRASES[currentPhraseIndex];
    let charIndex = 0;
    // Um único timeout encadeado, guardado aqui, garante que o cleanup
    // realmente pare a animação — a versão anterior deixava o setTimeout e o
    // intervalo de apagar rodando depois do unmount.
    let timeoutId: number;

    const erase = () => {
      charIndex -= 1;
      setDisplayedText(phrase.slice(0, Math.max(charIndex, 0)));
      if (charIndex > 0) {
        timeoutId = window.setTimeout(erase, ERASE_MS);
      } else {
        setCurrentPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      }
    };

    const type = () => {
      charIndex += 1;
      setDisplayedText(phrase.slice(0, charIndex));
      timeoutId = window.setTimeout(
        charIndex < phrase.length ? type : erase,
        charIndex < phrase.length ? TYPE_MS : HOLD_MS
      );
    };

    setDisplayedText('');
    timeoutId = window.setTimeout(type, TYPE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [currentPhraseIndex, prefersReducedMotion]);

  const scrollToProjects = () => {
    document.getElementById('projetos')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fundo: o shader iridescente da página já ocupa esta área. Aqui ficam
          só a grade fina, que dá escala, e a vinheta, que puxa o olho para o
          centro. As quatro orbs desfocadas e as scan lines saíram — somadas ao
          WebGL viravam borrão colorido e ainda custavam repaint. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,hsl(var(--background)/0.85)_85%)]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 py-20 sm:py-24 lg:py-20 xl:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 sm:gap-12 lg:gap-16 items-center max-w-7xl mx-auto">

          {/* Coluna esquerda: apresentação */}
          <div className="text-center lg:text-left space-y-5 sm:space-y-6 lg:space-y-7">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
              </span>
              <span className="text-sm sm:text-base text-muted-foreground font-mono">
                Disponível para projetos
              </span>
            </div>

            {/* Foto de perfil — só no mobile, onde não existe coluna da direita */}
            <div className="lg:hidden flex justify-center">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-xl opacity-50" />

                {/* Só dois no mobile: a foto é pequena e quatro chips
                    se sobrepõem a ela. */}
                <OrbitChip {...orbitChips[0]} className="-left-16 top-10" />
                <OrbitChip {...orbitChips[1]} className="-right-16 bottom-6" />

                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-primary/50 shadow-2xl">
                  <img
                    src={davidProfile}
                    alt="David Fernandes"
                    width={524}
                    height={530}
                    {...{ fetchpriority: 'high' }}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Prompt de terminal */}
            <div className="hidden lg:block font-mono text-base text-muted-foreground">
              <span className="text-neon-green">david@portfolio</span>
              <span>:</span>
              <span className="text-primary">~</span>
              <span>$ </span>
              <span className="text-foreground">whoami</span>
            </div>

            {/* Título */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
                <span className="block text-foreground">Olá, eu sou</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  David Fernandes
                </span>
              </h1>

              {/* Animação de digitação */}
              <div className="h-8 sm:h-10 md:h-12 flex items-center justify-center lg:justify-start">
                <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 hidden sm:block" aria-hidden="true" />
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-mono">
                  {displayedText}
                  <span className="animate-pulse text-primary" aria-hidden="true">|</span>
                </p>
              </div>
            </div>

            {/* Descrição */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Transformando <span className="text-primary font-medium">ideias</span> em soluções digitais.
              Especializado em criar aplicações web modernas,
              sistemas de automação e integrações que fazem a diferença.
            </p>

            {/* Números */}
            <div className="flex justify-center lg:justify-start gap-6 sm:gap-8 md:gap-10 pt-1">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left group cursor-default">
                  <div className="flex items-center justify-center lg:justify-start mb-1">
                    <stat.icon
                      className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 opacity-60 group-hover:opacity-100 transition-opacity"
                      aria-hidden="true"
                    />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Chamadas para ação */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-target group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-[#062f1c] bg-gradient-to-r from-neon-green to-primary shadow-lg shadow-neon-green/20 transition-transform duration-300 hover:-translate-y-0.5 overflow-hidden"
              >
                {/* Brilho que atravessa o botão no hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <WhatsAppIcon className="w-5 h-5 relative" />
                <span className="relative">Falar comigo</span>
              </a>

              <button
                type="button"
                onClick={scrollToProjects}
                className="cursor-target inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-primary/40 bg-primary/5 text-primary font-semibold backdrop-blur-sm transition-colors duration-300 hover:bg-primary/15 hover:border-primary/70"
              >
                Ver projetos
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" aria-hidden="true" />
              </button>
            </div>

            {/* Redes sociais */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 pt-3 items-center">
              <LinkedInTooltip />
              <GitHubTooltip />
            </div>
          </div>

          {/* Coluna direita: foto (desktop) + card de terminal */}
          <div className="space-y-8">
            <div className="hidden lg:flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" />

                {/* O canto inferior direito é do selo "GRV Software" — os
                    chips contornam essa área. */}
                <OrbitChip {...orbitChips[0]} className="-left-20 top-4" />
                <OrbitChip {...orbitChips[1]} className="-right-20 top-2" />
                <OrbitChip {...orbitChips[2]} className="-left-16 -bottom-4" />
                <OrbitChip {...orbitChips[3]} className="-right-24 bottom-16" />

                <div className="relative">
                  <div className="w-52 h-52 xl:w-56 xl:h-56 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <img
                      src={davidProfile}
                      alt="David Fernandes"
                      width={524}
                      height={530}
                      {...{ fetchpriority: 'high' }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-card border border-primary/30 rounded-lg px-3 py-1.5 shadow-lg">
                    <span className="text-xs font-mono text-primary">GRV Software</span>
                  </div>
                </div>
              </div>
            </div>

            <TerminalCard />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TerminalHero;
