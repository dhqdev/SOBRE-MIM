import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Github } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SpotlightCard from './effects/SpotlightCard';
import TiltedCard from './effects/TiltedCard';
import { projects, type Project } from '@/lib/projects';

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
        <div className={`p-3 pb-0 ${featured ? 'lg:w-[55%] lg:shrink-0 lg:self-center lg:pb-3' : ''}`}>
          <TiltedCard
            maxTilt={5}
            className="aspect-[16/10] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]"
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
                width={1600}
                height={1000}
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
