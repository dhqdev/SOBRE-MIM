import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Calendar, Bot, Wallet, Gamepad2, MessagesSquare, CandlestickChart, Github } from 'lucide-react';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import SectionHeading from './SectionHeading';

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

const ProjectCard = ({ project, variant }: { project: Project; variant: 'mobile' | 'desktop' }) => {
  const isDesktop = variant === 'desktop';
  const mediaClass = isDesktop
    ? 'w-full h-80 object-cover object-top group-hover:scale-105 transition-transform duration-700'
    : 'w-full h-48 object-cover object-top';

  return (
    <div
      className={
        isDesktop
          ? 'cursor-target group rounded-3xl bg-card border-2 border-border overflow-hidden hover:border-primary transition-all duration-300 hover:shadow-2xl'
          : 'group rounded-2xl bg-card border border-border overflow-hidden'
      }
    >
      <div className="relative overflow-hidden">
        {project.badge && (
          <span
            className={`absolute z-10 top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-md border border-primary/40 text-primary font-semibold ${
              isDesktop ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            {project.badge}
          </span>
        )}
        {project.video ? (
          <LazyVideo src={project.video} poster={project.poster} className={mediaClass} />
        ) : (
          <img
            src={project.image}
            alt={`Captura de tela do projeto ${project.title}`}
            className={mediaClass}
            loading="lazy"
            decoding="async"
          />
        )}
        {/* Fade da imagem para o corpo do card */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className={isDesktop ? 'p-10' : 'p-6'}>
        <div className={`flex items-center mb-3 ${isDesktop ? 'gap-4 mb-4' : 'gap-3'}`}>
          <div
            className={`rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${
              isDesktop ? 'w-14 h-14 rounded-xl' : 'w-10 h-10'
            }`}
          >
            <project.icon className={isDesktop ? 'w-7 h-7 text-primary' : 'w-5 h-5 text-primary'} />
          </div>
          <h3 className={isDesktop ? 'text-3xl font-bold' : 'text-lg font-semibold'}>{project.title}</h3>
        </div>

        <p
          className={
            isDesktop
              ? 'text-muted-foreground text-lg leading-relaxed mb-6'
              : 'text-muted-foreground text-sm leading-relaxed mb-4'
          }
        >
          {project.description}
        </p>

        <ul className={`flex flex-wrap list-none p-0 ${isDesktop ? 'gap-3 mb-6' : 'gap-2 mb-4'}`}>
          {project.tags.map((tag) => (
            <li
              key={tag}
              className={
                isDesktop
                  ? 'px-4 py-2 text-sm rounded-full bg-primary/10 text-primary font-semibold'
                  : 'px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium'
              }
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className={`flex flex-wrap items-center ${isDesktop ? 'gap-6' : 'gap-4'}`}>
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-300 ${
              isDesktop ? 'text-lg font-semibold' : 'text-sm font-medium'
            }`}
          >
            Ver projeto
            <span className="sr-only"> {project.title} (abre em nova aba)</span>
            <ExternalLink className={isDesktop ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
          </a>

          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 ${
                isDesktop ? 'text-lg font-semibold' : 'text-sm font-medium'
              }`}
            >
              <Github className={isDesktop ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
              Código
              <span className="sr-only"> de {project.title} no GitHub (abre em nova aba)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectsSection = () => (
  <section id="projetos" className="py-24 scroll-mt-16 relative overflow-hidden">
    <div className="container mx-auto px-6">
      <SectionHeading
        eyebrow="projetos"
        title="O que eu"
        highlight="construí"
        subtitle="Sistemas, automações e experimentos que saíram do papel."
      />

      {/* Mobile: grid simples */}
      <div className="md:hidden grid gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} variant="mobile" />
        ))}
      </div>

      {/* Desktop: cards empilhados conforme o scroll */}
      <div className="hidden md:block w-full max-w-7xl mx-auto">
        <ScrollStack
          itemDistance={120}
          itemStackDistance={50}
          stackPosition="20%"
          baseScale={0.92}
          rotationAmount={0}
          blurAmount={0}
          useWindowScroll={true}
        >
          {projects.map((project) => (
            <ScrollStackItem key={project.title}>
              <ProjectCard project={project} variant="desktop" />
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </div>
    </div>
  </section>
);

export default ProjectsSection;
