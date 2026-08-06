import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Calendar, Utensils, Bot, Wallet, Mic, Gamepad2 } from 'lucide-react';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

interface Project {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  tags: string[];
  image?: string;
  video?: string;
  poster?: string;
}

const projects: Project[] = [
  {
    title: 'Flappy Bird IA',
    description:
      '🤖 Ensinei uma IA a zerar o Flappy Bird — e ela aprendeu sozinha! Criei um experimento em Python onde 50 passarinhos-IA jogam Flappy Bird ao mesmo tempo. Eles evoluem, cruzam genes, sofrem mutação e ficam cada vez mais inteligentes. Depois de algumas gerações, começam a dominar o jogo com uma precisão absurda. Usei Algoritmo Genético, Rede Neural (4-5-1), Python + Pygame + NumPy. Resultado? Aprendizado 100% autônomo, zero jogadas humanas.',
    icon: Gamepad2,
    link: 'https://github.com/dhqdev/Projeto_FlappyBird',
    tags: ['Python', 'IA', 'Algoritmo Genético', 'Rede Neural'],
    video: '/lovable-uploads/flappy-bird-ai.mp4',
    poster: '/lovable-uploads/flappy-bird-poster.webp',
  },
  {
    title: 'Planejai - Gestão financeira',
    description:
      'Um software SaaS de gestão financeira desenvolvido para todo tipo de cliente que deseja ter um maior controle sobre o que gasta.',
    icon: Wallet,
    link: 'https://planejai.tekvosoft.com/',
    tags: ['SaaS', 'Gestão Financeira', 'Web App'],
    image: '/lovable-uploads/logoporconew.webp',
  },
  {
    title: 'Encontro com Deus',
    description:
      'Site oficial do retiro espiritual Encontro com Deus - Um ministério de transformação dedicado a promover experiências profundas de renovação espiritual, cura e reconexão com Deus. TypeScript e React, com inteligência artificial que conversa e aconselha a pessoa.',
    icon: Calendar,
    link: 'https://encontro-com-deus.vercel.app/',
    tags: ['React', 'TypeScript', 'IA'],
    image: '/lovable-uploads/encontro-com-deus.webp',
  },
  {
    title: 'Prato Flash',
    description:
      'Sistema completo de gestão para restaurantes, desenvolvido com React, TypeScript e shadcn/ui. Uma solução moderna e intuitiva para gerenciar todos os aspectos do seu estabelecimento.',
    icon: Utensils,
    link: 'https://github.com/dhqdev/prato-flash',
    tags: ['React', 'TypeScript', 'shadcn/ui'],
    image: '/lovable-uploads/prato-flash.webp',
  },
  {
    title: 'BCI-ON1 - Automação Servopa',
    description:
      'O BCI-ON1 é um sistema de automação desenvolvido para simplificar e automatizar processos de licitação no portal Servopa. O sistema realiza login automático, extrai protocolos do Todoist, envia lances e notifica clientes via WhatsApp nos dias 8 e 16 de cada mês.',
    icon: Bot,
    link: 'https://github.com/dhqdev/bci-on1?tab=readme-ov-file',
    tags: ['Automação', 'Python', 'Selenium'],
    image: '/lovable-uploads/bci-on1-dashboard.webp',
  },
  {
    title: 'Vozerão - Gerador de vozes com IA',
    description:
      'Vozerão é um saas desenvolvido para transcrever audio em texto, além de fazer um resumo do conteúdo e gerar uma voz artificial com base no texto. O sistema é construído com React, TypeScript e utiliza a API ElevenLabs para a geração de voz, oferecendo uma experiência completa de transcrição e síntese vocal.',
    icon: Mic,
    link: 'https://vozerao.vercel.app/',
    tags: ['React', 'TypeScript', 'ElevenLabs'],
    image: '/lovable-uploads/vozerao.webp',
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
    ? 'w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500'
    : 'w-full h-48 object-cover';

  return (
    <div
      className={
        isDesktop
          ? 'cursor-target group rounded-3xl bg-card border-2 border-border overflow-hidden hover:border-primary transition-all duration-300 hover:shadow-2xl'
          : 'group rounded-2xl bg-card border border-border overflow-hidden'
      }
    >
      <div className="overflow-hidden">
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
      </div>
    </div>
  );
};

const ProjectsSection = () => (
  <section id="projetos" className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 scroll-reveal">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-primary">Projetos</span>
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6" />
        <p className="text-xl text-muted-foreground">Feitos por mim</p>
      </div>

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
