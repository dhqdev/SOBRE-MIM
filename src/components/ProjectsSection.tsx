import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Gamepad2, Github } from 'lucide-react';
import SectionHeading from './SectionHeading';
import DemoPlayer from './demos/DemoPlayer';
import { DEMOS } from './demos';
import { projects, type Project } from '@/lib/projects';
import { openGame } from '@/lib/site';

/** "Meta-Bot - Escritório de trading com IA" vira nome + legenda. */
const splitTitle = (title: string) => {
  const [name, ...rest] = title.split(' - ');
  return { name, caption: rest.join(' - ') };
};

const useIsDesktop = () => {
  const query = '(min-width: 1024px)';
  const [desktop, setDesktop] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setDesktop(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return desktop;
};

const ProjectLinks = ({ project, name }: { project: Project; name: string }) => (
  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
    {project.game && (
      <button
        type="button"
        onClick={openGame}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        <Gamepad2 className="h-4 w-4" aria-hidden="true" />
        Jogar no site
      </button>
    )}
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
);

/**
 * Projetos em lista: nome + uma linha. No notebook a demo do projeto ativo
 * fica fixa do lado (troca ao passar o mouse ou ao rolar); no celular cada
 * projeto tem a sua demo logo abaixo, que começa a rodar quando aparece.
 */
const ProjectsSection = () => {
  const desktop = useIsDesktop();
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // No notebook, o projeto que passa pelo meio da tela vira o ativo.
  useEffect(() => {
    if (!desktop) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    itemRefs.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, [desktop]);

  const current = projects[active];
  const currentName = splitTitle(current.title).name;

  return (
    <section id="projetos" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          index="01"
          eyebrow="Projetos"
          title="O que eu"
          highlight="construí."
          subtitle="Sistemas, automações e experimentos que saíram do papel."
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <ol className="list-none border-t border-white/[0.06] p-0">
            {projects.map((project, index) => {
              const { name, caption } = splitTitle(project.title);
              const isActive = desktop && index === active;
              const demo = DEMOS[name];
              return (
                <li
                  key={project.title}
                  ref={(element) => (itemRefs.current[index] = element)}
                  data-index={index}
                  onMouseEnter={() => desktop && setActive(index)}
                  onFocus={() => desktop && setActive(index)}
                  className="scroll-reveal relative border-b border-white/[0.06] py-7"
                >
                  <span
                    className={`absolute -left-4 top-7 hidden h-[calc(100%-3.5rem)] w-px bg-accent transition-opacity duration-300 lg:block ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="lg:flex lg:items-baseline lg:gap-4">
                    <span
                      className={`mb-2 block font-mono text-xs transition-colors lg:mb-0 ${
                        isActive ? 'text-accent' : 'text-muted-foreground/60'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3
                          className={`text-xl font-semibold tracking-tight transition-colors md:text-2xl ${
                            !desktop || isActive ? 'text-foreground' : 'text-foreground/60'
                          }`}
                        >
                          {desktop ? (
                            <button type="button" onClick={() => setActive(index)} className="text-left">
                              {name}
                            </button>
                          ) : (
                            name
                          )}
                        </h3>
                        {project.badge && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-online" aria-hidden="true" />
                            {project.badge}
                          </span>
                        )}
                      </div>
                      {caption && <p className="mt-1 text-sm text-muted-foreground">{caption}</p>}
                      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                        {project.summary}
                      </p>
                      <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
                        {project.tags.slice(0, 4).join(' · ')}
                      </p>

                      {!desktop && demo && (
                        <div className="mt-5">
                          <DemoPlayer demo={demo} label={name} />
                        </div>
                      )}

                      <ProjectLinks project={project} name={name} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {desktop && DEMOS[currentName] && (
            <div className="relative">
              <div className="sticky top-24">
                <div key={active} className="animate-in fade-in duration-500">
                  <DemoPlayer demo={DEMOS[currentName]} label={currentName} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
