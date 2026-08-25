import { useEffect, useRef } from 'react';
import { ExternalLink, Heart, X } from 'lucide-react';

interface Experience {
  title: string;
  image: string;
  imageAlt: string;
  emoji?: string;
  showHeart?: boolean;
  postUrl: string;
  /** Tom de destaque do card, em tokens do design system. */
  accent: 'violet' | 'cyan';
  body: React.ReactNode;
}

const experiences: Experience[] = [
  {
    title: 'Nubank',
    image: '/media/nubank.webp',
    imageAlt: 'Logotipo do Nubank',
    showHeart: true,
    postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:7359717825935998976/',
    accent: 'violet',
    body: (
      <>
        Participei de uma palestra incrível no escritório da Nubank sobre{' '}
        <strong className="font-medium text-accent">Ciência de Dados</strong> e{' '}
        <strong className="font-medium text-accent">Engenharia de Software</strong>.
        <br />
        <br />
        Conheci <em className="text-accent">"o jeitinho NUUU!"</em> e um time que realmente faz a
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
    accent: 'cyan',
    body: (
      <>
        Sabe aquele momento em que você sai da caixinha pela quantidade de ideias? Foi assim na{' '}
        <strong className="font-medium text-primary">EXPOMAFE</strong>.
        <br />
        <br />
        Através de várias conversas com diferentes empresas, pude aprender muito e aprimorar minhas
        habilidades de trabalho.
        <br />
        <br />
        Agradeço à <strong className="font-medium text-primary">GRV Software</strong> pela
        oportunidade.
      </>
    ),
  },
];

const accentStyles = {
  violet: {
    rule: 'bg-gradient-to-r from-accent via-primary to-accent',
    card: 'border-accent/20 hover:border-accent/50',
    media: 'from-accent/10 to-transparent',
    button: 'bg-accent/15 hover:bg-accent/25 border-accent/30 text-accent',
  },
  cyan: {
    rule: 'bg-gradient-to-r from-primary via-neon-green to-primary',
    card: 'border-primary/20 hover:border-primary/50',
    media: 'from-primary/10 to-transparent',
    button: 'bg-primary/15 hover:bg-primary/25 border-primary/30 text-primary',
  },
} as const;

interface ExperiencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Painel lateral com as experiências. O gatilho vive na Navbar — este
 * componente só recebe o estado, para que a página inteira saiba quando o
 * painel está aberto (o botão de currículo, por exemplo, se esconde).
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
        className={`fixed inset-0 bg-background/70 backdrop-blur-sm z-[70] transition-opacity duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        // Mesma razão do painel: sem isto, rolar sobre a área escura move a
        // página que está atrás do modal.
        data-lenis-prevent
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
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-card/95 backdrop-blur-xl border-l border-border z-[80] transition-transform duration-500 ease-out overflow-hidden outline-none ${
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
          // O ScrollStack cria um Lenis (smooth scroll) preso à janela, que
          // captura a roda do mouse na página inteira — inclusive aqui dentro,
          // rolando o fundo em vez do painel. `data-lenis-prevent` faz o Lenis
          // ignorar gestos que nascem dentro deste elemento e devolve o scroll
          // nativo ao navegador.
          data-lenis-prevent
          className="h-full overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-6 md:p-8 pt-20 pb-4">
            <span className="font-mono text-sm text-primary">&lt;experiencias /&gt;</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Onde eu{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                estive
              </span>
            </h2>
            <div className="mt-4 h-px w-20 bg-gradient-to-r from-primary to-accent" />
          </div>

          <div className="px-6 md:px-8 pb-8 space-y-6">
            {experiences.map((experience) => {
              const styles = accentStyles[experience.accent];

              return (
                <article
                  key={experience.title}
                  className={`group relative bg-background/40 rounded-2xl overflow-hidden border transition-colors duration-300 ${styles.card}`}
                >
                  <div className={`absolute top-0 inset-x-0 h-px ${styles.rule}`} />

                  <div
                    className={`relative w-full aspect-video bg-gradient-to-br p-8 flex items-center justify-center overflow-hidden ${styles.media}`}
                  >
                    <img
                      src={experience.image}
                      loading="lazy"
                      decoding="async"
                      alt={experience.imageAlt}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="flex items-center gap-2 text-2xl font-bold">
                      {experience.title}
                      {experience.showHeart && (
                        <Heart className="w-5 h-5 text-accent fill-accent" aria-hidden="true" />
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
                      className={`inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors duration-300 ${styles.button}`}
                    >
                      Ver post completo
                      <span className="sr-only"> sobre {experience.title} (abre em nova aba)</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}

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
