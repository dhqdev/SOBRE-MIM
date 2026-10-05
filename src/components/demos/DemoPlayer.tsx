import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export interface DemoSceneProps {
  /** Capítulo atual (0, 1, 2…). A cena anima a troca com CSS. */
  step: number;
  /** true enquanto a demo está rodando (na tela e sem pausa). */
  playing: boolean;
}

export interface Demo {
  /** Nome de cada capítulo, mostrado embaixo do vídeo. */
  steps: string[];
  /** Tempo de cada capítulo, em ms. */
  stepMs?: number;
  /** Endereço mostrado na barra do navegador falso. */
  url: string;
  Scene: React.ComponentType<DemoSceneProps>;
}

/** Tamanho em que as cenas são desenhadas; o player escala pra caber. */
export const STAGE_W = 560;
export const STAGE_H = 340;

/**
 * "Vídeo" interativo de um projeto: uma cena animada em capítulos que roda
 * sozinha em loop quando aparece na tela (no celular, ao rolar até ela) e
 * pausa quando sai. Clicar num capítulo pula pra ele; dá pra pausar também.
 * É tudo HTML/CSS: nítido em qualquer tela e bem mais leve que um MP4.
 */
const DemoPlayer = ({ demo, label }: { demo: Demo; label: string }) => {
  const { steps, stepMs = 3200, url, Scene } = demo;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const elapsed = useRef(0);

  const playing = visible && !paused && !reduced;

  // Escala a cena (desenhada em 560×340) pra largura do player.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / STAGE_W));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Só roda quando dá pra ver.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(root);
    const onVisibility = () => document.hidden && setVisible(false);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Relógio: avança o capítulo e enche a barrinha dele sem re-render.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const progress = Math.min(1, elapsed.current / stepMs);
      const bar = barRefs.current[step];
      if (bar) bar.style.transform = `scaleX(${progress})`;
      if (progress >= 1) {
        elapsed.current = 0;
        setStep((current) => (current + 1) % steps.length);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, step, stepMs, steps.length]);

  // Barrinhas: as anteriores cheias, as próximas vazias.
  useEffect(() => {
    barRefs.current.forEach((bar, index) => {
      if (!bar || index === step) return;
      bar.style.transform = `scaleX(${index < step ? 1 : 0})`;
    });
    if (reduced && barRefs.current[step]) barRefs.current[step]!.style.transform = 'scaleX(1)';
  }, [step, reduced]);

  const jump = (index: number) => {
    elapsed.current = 0;
    const bar = barRefs.current[index];
    if (bar) bar.style.transform = 'scaleX(0)';
    setStep(index);
  };

  return (
    <div ref={rootRef}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
        {/* Barra do navegador */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="ml-2 inline-flex min-w-0 items-center gap-1.5 truncate rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-online" />
            {url}
          </span>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? `Continuar demo de ${label}` : `Pausar demo de ${label}`}
            className="ml-auto rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            hidden={reduced}
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Palco */}
        <div
          ref={stageRef}
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
          aria-hidden="true"
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
          >
            <Scene step={step} playing={playing} />
          </div>
        </div>
      </div>

      {/* Capítulos */}
      <div className="mt-3 flex gap-1.5" role="tablist" aria-label={`Capítulos da demo de ${label}`}>
        {steps.map((name, index) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={index === step}
            aria-label={name}
            onClick={() => jump(index)}
            className="group flex-1 py-2"
          >
            <span className="block h-[3px] overflow-hidden rounded-full bg-white/10 transition-colors group-hover:bg-white/20">
              <span
                ref={(element) => (barRefs.current[index] = element)}
                className="block h-full origin-left rounded-full bg-accent"
                style={{ transform: 'scaleX(0)' }}
              />
            </span>
          </button>
        ))}
      </div>
      <p className="flex items-baseline gap-2 text-sm" aria-live="polite">
        <span className="font-mono text-xs text-accent">
          {String(step + 1).padStart(2, '0')}/{String(steps.length).padStart(2, '0')}
        </span>
        <span key={step} className="text-foreground animate-in fade-in slide-in-from-bottom-1 duration-300">
          {steps[step]}
        </span>
      </p>
    </div>
  );
};

export default DemoPlayer;
