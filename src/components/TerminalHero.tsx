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
      {/* Sophisticated background */}
      <div className="absolute inset-0">
        {/* Mesh gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-neon-green/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-primary/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />

        {/* Scan lines effect */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 4px)',
        }} />
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

                <div className="absolute -left-6 top-2 text-2xl animate-emoji-float-1" aria-hidden="true">💻</div>
                <div className="absolute -right-6 top-4 text-xl animate-emoji-float-2" aria-hidden="true">⚡</div>
                <div className="absolute -left-5 bottom-8 text-xl animate-emoji-float-3" aria-hidden="true">🚀</div>
                <div className="absolute -right-5 bottom-10 text-2xl animate-emoji-float-4" aria-hidden="true">✨</div>
                <div className="absolute left-2 -top-2 text-xl animate-emoji-float-5" aria-hidden="true">🎯</div>

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

                <div className="absolute -left-8 top-4 text-3xl animate-emoji-float-1 hover:scale-125 transition-transform" aria-hidden="true">💻</div>
                <div className="absolute -right-8 top-8 text-2xl animate-emoji-float-2 hover:scale-125 transition-transform" aria-hidden="true">⚡</div>
                <div className="absolute -left-6 bottom-12 text-2xl animate-emoji-float-3 hover:scale-125 transition-transform" aria-hidden="true">🚀</div>
                <div className="absolute -right-6 bottom-16 text-3xl animate-emoji-float-4 hover:scale-125 transition-transform" aria-hidden="true">✨</div>
                <div className="absolute left-4 -top-4 text-2xl animate-emoji-float-5 hover:scale-125 transition-transform" aria-hidden="true">🎯</div>

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
