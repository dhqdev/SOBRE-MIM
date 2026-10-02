import { useEffect, useRef } from 'react';
import { ExternalLink, Heart, X } from 'lucide-react';

interface Experience {
  title: string;
  image: string;
  imageAlt: string;
  emoji?: string;
  showHeart?: boolean;
  postUrl: string;
  body: React.ReactNode;
}

const experiences: Experience[] = [
  {
    title: 'Nubank',
    image: '/media/nubank.webp',
    imageAlt: 'Logotipo do Nubank',
    showHeart: true,
    postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:7359717825935998976/',
    body: (
      <>
        Participei de uma palestra incrível no escritório da Nubank sobre{' '}
        <strong className="font-medium text-foreground">Ciência de Dados</strong> e{' '}
        <strong className="font-medium text-foreground">Engenharia de Software</strong>.
        <br />
        <br />
        Conheci <em className="text-foreground">"o jeitinho NUUU!"</em> e um time que realmente faz a
        diferença.
      </>
    ),
  },
  {
    title: 'EXPOMAFE',
    image: '/media/euexpo.webp',
    imageAlt: 'David Fernandes na feira EXPOMAFE',
    emoji: '🎉',
    postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:7326759044335980544/',
    body: (
      <>
        Sabe aquele momento em que você sai da caixinha pela quantidade de ideias? Foi assim na{' '}
        <strong className="font-medium text-foreground">EXPOMAFE</strong>.
        <br />
        <br />
        Através de várias conversas com diferentes empresas, pude aprender muito e aprimorar minhas
        habilidades de trabalho.
        <br />
        <br />
        Agradeço à <strong className="font-medium text-foreground">GRV Software</strong> pela
        oportunidade.
      </>
    ),
  },
];

interface ExperiencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Painel lateral com as experiências. O gatilho vive na Navbar — este
 * componente só recebe o estado.
 */
const ExperiencesPanel = ({ isOpen, onClose }: ExperiencesPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Trava o scroll da página enquanto o painel está aberto e devolve o
  // controle ao fechar — inclusive se o componente sair da tela aberto.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
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
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        id="painel-experiencias"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Experiências"
        tabIndex={-1}
        // `inert` tira o painel fechado da ordem de tabulação e do leitor de tela.
        {...(!isOpen && { inert: '' })}
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-background border-l border-border z-[80] transition-transform duration-500 ease-out overflow-hidden outline-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar experiências"
          className="absolute top-5 right-5 z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div
          // className="h-full overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-6 md:p-8 pt-20 pb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Experiências
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.03em]">
              Onde eu <span className="text-muted-foreground/60">estive.</span>
            </h2>
          </div>

          <div className="px-6 md:px-8 pb-8 space-y-6">
            {experiences.map((experience) => (
                <article
                  key={experience.title}
                  className={`group relative bg-card/60 rounded-2xl overflow-hidden border transition-colors duration-300 border-border hover:border-white/15`}
                >
                  <div className="relative w-full aspect-video bg-white/[0.02] p-8 flex items-center justify-center overflow-hidden border-b border-border">
                    <img
                      src={experience.image}
                      loading="lazy"
                      decoding="async"
                      alt={experience.imageAlt}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                      {experience.title}
                      {experience.showHeart && (
                        <Heart className="w-4 h-4 text-accent fill-accent" aria-hidden="true" />
                      )}
                      {experience.emoji && <span aria-hidden="true">{experience.emoji}</span>}
                    </h3>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {experience.body}
                    </p>

                    <a
                      href={experience.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors duration-300 border-white/10 text-foreground hover:bg-white/[0.04]`}
                    >
                      Ver post completo
                      <span className="sr-only"> sobre {experience.title} (abre em nova aba)</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>
                </article>
            ))}

            <p className="py-8 text-center text-sm italic text-muted-foreground/50">
              Mais experiências em breve...
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExperiencesPanel;
