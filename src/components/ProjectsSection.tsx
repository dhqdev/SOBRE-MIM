import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Calendar, Bot, Wallet, Gamepad2, MessagesSquare, CandlestickChart, Github } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SpotlightCard from './effects/SpotlightCard';
import TiltedCard from './effects/TiltedCard';

interface Project {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  /** Repositório do código, quando o link principal é o produto no ar. */
  repo?: string;
  /** Selo no canto da imagem, ex.: "Novo". */
  badge?: string;
  tags: string[];
  image?: string;
  video?: string;
  poster?: string;
}

const projects: Project[] = [
  {
    title: 'Meta-Bot - Escritório de trading com IA',
    description:
      'Um escritório de trading em pixel-art onde 8 agentes de IA trabalham juntos: a Nina lê as notícias, a Rita vigia o risco, a Estela testa estratégias, o Gustavo gerencia o plano e o Caio executa as ordens no MetaTrader 5. Eles conversam entre si, fazem reunião diária às 19h e aprendem com os próprios resultados. São 18 estratégias, backtest honesto (com slippage e comissão), conta simulada com preços reais e app PWA para acompanhar pelo celular.',
    icon: CandlestickChart,
    link: 'https://github.com/dhqdev/meta-bot',
    tags: ['Python', 'FastAPI', 'React', 'Agentes de IA', 'MetaTrader 5'],
    image: '/media/meta-bot.webp',
    badge: 'Novo',
  },
  {
    title: 'Tekvosoft Chat - Atendimento via WhatsApp',
    description:
      'Plataforma de atendimento com CRM e helpdesk: vários atendentes no mesmo número de WhatsApp, filas, chatbot com pipeline de IA, kanban, campanhas e agendamentos, tudo em tempo real. É multiempresa, roda em Docker e já está em produção.',
    icon: MessagesSquare,
    link: 'https://chat.tekvosoft.com/',
    repo: 'https://github.com/tekvosoft-chat/tekvosoft',
    tags: ['Node.js', 'TypeScript', 'React', 'WhatsApp', 'Socket.IO'],
    image: '/media/tekvosoft-chat.webp',
    badge: 'Em produção',
  },
  {
    title: 'Flappy Bird IA',
    description:
      '🤖 Ensinei uma IA a zerar o Flappy Bird — e ela aprendeu sozinha! Criei um experimento em Python onde 50 passarinhos-IA jogam Flappy Bird ao mesmo tempo. Eles evoluem, cruzam genes, sofrem mutação e ficam cada vez mais inteligentes. Depois de algumas gerações, começam a dominar o jogo com uma precisão absurda. Usei Algoritmo Genético, Rede Neural (4-5-1), Python + Pygame + NumPy. Resultado? Aprendizado 100% autônomo, zero jogadas humanas.',
    icon: Gamepad2,
    link: 'https://github.com/dhqdev/Projeto_FlappyBird',
    tags: ['Python', 'IA', 'Algoritmo Genético', 'Rede Neural'],
    video: '/media/flappy-bird-ai.mp4',
    poster: '/media/flappy-bird-poster.webp',
  },
  {
    title: 'Planejai - Gestão financeira',
    description:
      'Um software SaaS de gestão financeira desenvolvido para todo tipo de cliente que deseja ter um maior controle sobre o que gasta.',
    icon: Wallet,
    link: 'https://planejai.tekvosoft.com/',
    tags: ['SaaS', 'Gestão Financeira', 'Web App'],
    image: '/media/logoporconew.webp',
  },
  {
    title: 'Encontro com Deus',
    description:
      'Site oficial do retiro espiritual Encontro com Deus - Um ministério de transformação dedicado a promover experiências profundas de renovação espiritual, cura e reconexão com Deus. TypeScript e React, com inteligência artificial que conversa e aconselha a pessoa.',
    icon: Calendar,
    link: 'https://encontro-com-deus.vercel.app/',
    tags: ['React', 'TypeScript', 'IA'],
    image: '/media/encontro-com-deus.webp',
  },
  {
    title: 'BCI-ON1 - Automação Servopa',
    description:
      'O BCI-ON1 é um sistema de automação desenvolvido para simplificar e automatizar processos de licitação no portal Servopa. O sistema realiza login automático, extrai protocolos do Todoist, envia lances e notifica clientes via WhatsApp nos dias 8 e 16 de cada mês.',
    icon: Bot,
    link: 'https://github.com/dhqdev/bci-on1?tab=readme-ov-file',
    tags: ['Automação', 'Python', 'Selenium'],
    image: '/media/bci-on1-dashboard.webp',
  },
];

/**
 * Só baixa o vídeo quando o card chega perto da viewport. Sem isso o MP4 do
 * Flappy Bird era baixado no carregamento da página, mesmo para quem nunca
 * rolava até lá.
 */
const LazyVideo = ({ src, poster, className }: { src: string; poster?: string; className?: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={shouldLoad ? src : undefined}
      poster={poster}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      aria-label="Demonstração da IA jogando Flappy Bird"
    />
  );
};

/** "Meta-Bot - Escritório de trading com IA" vira nome + legenda. */
const splitTitle = (title: string) => {
  const [name, ...rest] = title.split(' - ');
  return { name, caption: rest.join(' - ') };
};

const ProjectCard = ({ project, featured }: { project: Project; featured: boolean }) => {
  const { name, caption } = splitTitle(project.title);
  const mediaClass =
    'h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]';

  return (
    <SpotlightCard
      className={`group scroll-reveal ${featured ? 'md:col-span-2' : ''}`}
      spotlightColor="rgba(167, 139, 250, 0.08)"
    >
      <article className={`flex h-full flex-col ${featured ? 'lg:flex-row' : ''}`}>
        {/* Mídia emoldurada */}
        <div className={`p-3 pb-0 ${featured ? 'lg:w-[55%] lg:shrink-0 lg:pb-3' : ''}`}>
          <TiltedCard
            maxTilt={5}
            className={`overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] ${
              featured ? 'aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[340px]' : 'aspect-[16/10]'
            }`}
          >
            {project.badge && (
              <span className="absolute z-10 top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-online" aria-hidden="true" />
                {project.badge}
              </span>
            )}
            {project.video ? (
              <LazyVideo src={project.video} poster={project.poster} className={mediaClass} />
            ) : (
              <img
                src={project.image}
                alt={`Captura de tela do projeto ${name}`}
                className={mediaClass}
                loading="lazy"
                decoding="async"
              />
            )}
          </TiltedCard>
        </div>

        <div className={`flex flex-1 flex-col p-6 ${featured ? 'md:p-8' : ''}`}>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <project.icon className="h-4 w-4 text-accent" />
            {caption && <span className="text-sm">{caption}</span>}
          </div>

          <h3 className={`mt-3 font-semibold tracking-tight text-foreground ${featured ? 'text-3xl' : 'text-2xl'}`}>
            {name}
          </h3>

          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{project.description}</p>

          <ul className="mt-5 flex flex-wrap gap-1.5 list-none p-0">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap items-center gap-5 pt-6">
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link inline-flex items-center gap-1 text-sm font-medium text-foreground"
            >
              Ver projeto
              <span className="sr-only"> {name} (abre em nova aba)</span>
              <ArrowUpRight
                className="h-4 w-4 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                aria-hidden="true"
              />
            </a>

            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                Código
                <span className="sr-only"> de {name} no GitHub (abre em nova aba)</span>
              </a>
            )}
          </div>
        </div>
      </article>
    </SpotlightCard>
  );
};

const ProjectsSection = () => (
  <section id="projetos" className="relative scroll-mt-20 py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-6 lg:px-10">
      <SectionHeading
        index="01"
        eyebrow="Projetos"
        title="O que eu"
        highlight="construí."
        subtitle="Sistemas, automações e experimentos que saíram do papel."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} featured={Boolean(project.badge)} />
        ))}
      </div>
    </div>
  </section>
);

export default ProjectsSection;
