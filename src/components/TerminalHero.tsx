import { ArrowDown, ArrowUpRight, Download, Github, Instagram, Linkedin } from 'lucide-react';
import BlurText from './effects/BlurText';
import RotatingText from './effects/RotatingText';
import CountUp from './effects/CountUp';
import Magnet from './effects/Magnet';
import StarBorder from './effects/StarBorder';
import WhatsAppIcon from './WhatsAppIcon';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { INSTAGRAM_URL, WHATSAPP_URL } from '@/lib/contact';
import davidProfile from '@/assets/david-profile.webp';

const PHRASES = ['Vue & React', 'Automação & Integração', 'Frappe Framework', 'Python & IA'];

const stats = [
  { value: 2, suffix: '+', label: 'anos de experiência' },
  { value: 10, suffix: '+', label: 'projetos entregues' },
  { value: 5, suffix: '+', label: 'tecnologias no dia a dia' },
];

const socials = [
  { icon: Github, url: 'https://github.com/dhqdev', label: 'GitHub' },
  { icon: Linkedin, url: 'https://www.linkedin.com/in/david-fernandes-77a663229/', label: 'LinkedIn' },
  { icon: Instagram, url: INSTAGRAM_URL, label: 'Instagram' },
];

const TerminalHero = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const scrollToProjects = () => {
    document.getElementById('projetos')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section className="relative min-h-[100svh] flex items-center">
      <div className="mx-auto w-full max-w-5xl px-6 pt-32 pb-20">
        {/* Foto + status */}
        <div className="flex items-center gap-4 mb-10">
          <div className="relative">
            <img
              src={davidProfile}
              alt="David Fernandes"
              width={524}
              height={530}
              {...{ fetchpriority: 'high' }}
              className="w-14 h-14 rounded-full object-cover ring-1 ring-accent/40"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background">
              <span className="h-2 w-2 rounded-full bg-online" />
            </span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">Desenvolvedor Full-Stack</p>
            <p className="text-sm">
              <span className="shiny-text">Disponível para projetos</span>
            </p>
          </div>
        </div>

        <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl md:text-7xl font-semibold tracking-[-0.04em]">
          <span className="sr-only">David Fernandes, desenvolvedor full-stack. </span>
          <span aria-hidden="true">
            <span className="block text-foreground">
              <BlurText text="Olá, eu sou" />{' '}
              <BlurText text="David." delay={270} wordClassName="text-gradient-violet pb-[0.08em]" />
            </span>
          </span>
          <span className="block text-muted-foreground/60" aria-hidden="true">
            <BlurText text="Especialista em" delay={300} />{' '}
            <RotatingText words={PHRASES} className="text-foreground" />
          </span>
        </h1>

        <p className="scroll-reveal mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground" style={{ '--reveal-delay': '400ms' } as React.CSSProperties}>
          Transformando ideias em soluções digitais. Crio aplicações web modernas,
          sistemas de automação e integrações que fazem a diferença. Hoje na{' '}
          <span className="text-foreground">GRV Software</span>.
        </p>

        {/* Chamadas para ação */}
        <div
          className="scroll-reveal mt-10 flex flex-wrap items-center gap-3"
          style={{ '--reveal-delay': '500ms' } as React.CSSProperties}
        >
          <Magnet>
            <StarBorder>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-[11px] bg-foreground px-6 text-[15px] font-medium text-background transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon className="w-4 h-4" />
                Falar comigo
              </a>
            </StarBorder>
          </Magnet>

          <button
            type="button"
            onClick={scrollToProjects}
            className="group inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 px-6 text-[15px] font-medium text-foreground transition-colors hover:bg-white/[0.04]"
          >
            Ver projetos
            <ArrowDown className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
          </button>

          <a
            href="/CV-David.pdf"
            download="CV-David-Fernandes.pdf"
            className="inline-flex h-12 items-center gap-2 rounded-xl px-4 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Currículo
          </a>
        </div>

        {/* Números + redes */}
        <div
          className="scroll-reveal mt-16 flex flex-col gap-8 border-t border-border pt-8 sm:flex-row sm:items-end sm:justify-between"
          style={{ '--reveal-delay': '600ms' } as React.CSSProperties}
        >
          <dl className="grid grid-cols-3 gap-6 sm:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs sm:text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>

          <ul className="flex flex-wrap items-center gap-1 list-none p-0 -ml-3 sm:ml-0">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]"
                >
                  <social.icon className="w-4 h-4" aria-hidden="true" />
                  {social.label}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default TerminalHero;
