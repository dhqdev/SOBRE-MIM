import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Briefcase, GraduationCap, Sparkles, Sprout } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { milestones, type Kind } from '@/lib/milestones';

const KIND_ICON = {
  trabalho: Briefcase,
  estudo: GraduationCap,
  evento: Sparkles,
  inicio: Sprout,
} satisfies Record<Kind, React.ComponentType<{ className?: string }>>;

const KIND_LABEL: Record<Kind, string> = {
  trabalho: 'trabalho',
  estudo: 'estudo',
  evento: 'evento',
  inicio: 'começo',
};

/**
 * Linha do tempo que vai se "desenhando" em roxo conforme a página rola. Cada
 * marco acende quando a linha passa por ele. No celular a linha fica à
 * esquerda; do notebook pra cima ela vai pro meio e os cards alternam de lado.
 */
const TimelineSection = ({ onOpenExperiences }: { onOpenExperiences: () => void }) => {
  const listRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    const list = listRef.current;
    const fill = fillRef.current;
    if (!list || !fill) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      fill.style.transform = 'scaleY(1)';
      setLit(milestones.length - 1);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = list.getBoundingClientRect();
      // A "ponta" da linha fica a 60% da altura da tela.
      const tip = window.innerHeight * 0.6 - rect.top;
      const progress = Math.min(1, Math.max(0, tip / rect.height));
      fill.style.transform = `scaleY(${progress})`;

      const dots = list.querySelectorAll<HTMLElement>('[data-dot]');
      let last = -1;
      dots.forEach((dot, index) => {
        const dotRect = dot.getBoundingClientRect();
        if (dotRect.top + dotRect.height / 2 - rect.top <= tip) last = index;
      });
      setLit(last);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="trajetoria" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          index="03"
          eyebrow="Trajetória"
          title="Do suporte ao"
          highlight="código."
          subtitle="Comecei consertando rede e servidor. Hoje lidero o financeiro de um ERP e estudo agentes de IA."
        />

        <div className="relative">
          {/* Trilho + preenchimento roxo que acompanha o scroll */}
          <div
            aria-hidden="true"
            className="absolute bottom-2 left-[11px] top-2 w-px bg-white/[0.08] lg:left-1/2 lg:-translate-x-1/2"
          >
            <div
              ref={fillRef}
              className="h-full w-full origin-top bg-gradient-to-b from-accent/0 via-accent to-accent shadow-[0_0_12px_rgba(167,139,250,0.6)]"
              style={{ transform: 'scaleY(0)' }}
            />
          </div>

          <ol ref={listRef} className="relative list-none space-y-8 p-0 lg:space-y-4">
            {milestones.map((item, index) => {
              const Icon = KIND_ICON[item.kind];
              const on = index <= lit;
              const right = index % 2 === 1;

              return (
                <li
                  key={`${item.date}-${item.title}`}
                  className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-5 lg:[&:not(:first-child)]:-mt-24 lg:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] lg:gap-x-0"
                >
                  {/* Ponto na linha */}
                  <div className="relative flex justify-center pt-5 lg:col-start-2 lg:row-start-1">
                    <span
                      data-dot
                      className={`relative grid h-6 w-6 place-items-center rounded-full border transition-all duration-500 ${
                        on
                          ? 'border-accent/70 bg-[#17121f] text-accent shadow-[0_0_0_4px_rgba(167,139,250,0.12),0_0_18px_rgba(167,139,250,0.45)]'
                          : 'border-white/10 bg-background text-muted-foreground/40'
                      }`}
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {item.current && on && (
                        <span className="absolute inset-0 animate-ping rounded-full border border-accent/60" />
                      )}
                    </span>
                  </div>

                  {/* Card */}
                  <article
                    className={`rounded-2xl border p-5 transition-all duration-700 ease-out sm:p-6 lg:row-start-1 lg:max-w-[30rem] ${
                      right
                        ? 'lg:col-start-3 lg:ml-6'
                        : 'lg:col-start-1 lg:mr-6 lg:justify-self-end lg:text-right'
                    } ${
                      on
                        ? 'translate-y-0 border-white/10 bg-card/90 opacity-100'
                        : 'translate-y-3 border-white/[0.05] bg-background/80 opacity-40'
                    }`}
                  >
                    <p
                      className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs ${
                        right ? '' : 'lg:justify-end'
                      }`}
                    >
                      <span className={on ? 'text-accent' : 'text-muted-foreground'}>{item.date}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="uppercase tracking-[0.15em] text-muted-foreground/70">
                        {KIND_LABEL[item.kind]}
                      </span>
                      {item.current && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-online/30 bg-online/10 px-2 py-0.5 text-[10px] text-online">
                          <span className="h-1.5 w-1.5 rounded-full bg-online" />
                          agora
                        </span>
                      )}
                    </p>
                    <h3 className="mt-2.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.place}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{item.text}</p>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={onOpenExperiences}
            aria-haspopup="dialog"
            aria-controls="painel-experiencias"
            className="group inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
          >
            Ver todas as experiências
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
