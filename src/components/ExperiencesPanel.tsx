import { useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { scrollToSection } from '@/lib/site';

interface Experience {
  title: string;
  date: string;
  place: string;
  image: string;
  imageAlt: string;
  postUrl: string;
  body: string;
}

const experiences: Experience[] = [
  {
    title: 'Palestra no Nubank',
    date: 'Ago 2025',
    place: 'Escritório do Nubank',
    image: '/media/nubank.webp',
    imageAlt: 'Ilustração de David Fernandes no escritório do Nubank',
    postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:7359717825935998976/',
    body: 'Uma tarde sobre Ciência de Dados e Engenharia de Software, conhecendo de perto o "jeitinho NU" e um time que realmente faz a diferença.',
  },
  {
    title: 'EXPOMAFE',
    date: 'Mai 2025',
    place: 'Estande da GRV Software',
    image: '/media/euexpo.webp',
    imageAlt: 'David Fernandes no estande da GRV Software na EXPOMAFE',
    postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:7326759044335980544/',
    body: 'Um dia inteiro conversando com empresas de vários setores e saindo da caixinha com um monte de ideias. Obrigado à GRV Software pela oportunidade.',
  },
];

interface ExperiencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Painel das experiências. No notebook abre como gaveta à direita; no celular
 * sobe de baixo como uma folha, com a lista rolando dentro dele. O gatilho
 * vive na Navbar; aqui só chega o estado.
 */
const ExperiencesPanel = ({ isOpen, onClose }: ExperiencesPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Trava o scroll da página enquanto o painel está aberto.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen && listRef.current) listRef.current.scrollTop = 0;
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Esc fecha. Sem isso o painel fica intransponível para quem usa teclado.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const goToTimeline = () => {
    onClose();
    window.setTimeout(() => scrollToSection('trajetoria'), 350);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        id="painel-experiencias"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-experiencias"
        tabIndex={-1}
        // `inert` tira o painel fechado da ordem de tabulação e do leitor de tela.
        {...(!isOpen && { inert: '' })}
        className={`fixed inset-x-0 bottom-0 z-[80] flex h-[88dvh] flex-col overflow-hidden rounded-t-3xl border-t border-white/10 bg-background outline-none transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[440px] md:rounded-none md:border-l md:border-t-0 ${
          isOpen ? 'translate-x-0 translate-y-0' : 'translate-y-full md:translate-x-full md:translate-y-0'
        }`}
      >
        {/* Alça (só no celular) */}
        <div className="flex justify-center pt-3 md:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        <header className="flex items-start justify-between gap-4 border-b border-border px-6 pb-5 pt-4 md:px-8 md:pt-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Experiências</p>
            <h2 id="titulo-experiencias" className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              Onde eu <span className="text-muted-foreground/60">estive.</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar experiências"
            className="-mr-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8"
        >
          <ol className="list-none space-y-10 p-0">
            {experiences.map((experience) => (
              <li key={experience.title}>
                <article>
                  <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                    <img
                      src={experience.image}
                      alt={experience.imageAlt}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover object-[center_22%]"
                    />
                  </div>
                  <p className="mt-4 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span className="text-accent">{experience.date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{experience.place}</span>
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{experience.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{experience.body}</p>
                  <a
                    href={experience.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground"
                  >
                    Ver post no LinkedIn
                    <span className="sr-only"> sobre {experience.title} (abre em nova aba)</span>
                    <ArrowUpRight
                      className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </a>
                </article>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={goToTimeline}
            className="group mt-12 flex w-full items-center justify-between rounded-xl border border-border px-4 py-3.5 text-left text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
          >
            Ver a trajetória completa
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
};

export default ExperiencesPanel;
