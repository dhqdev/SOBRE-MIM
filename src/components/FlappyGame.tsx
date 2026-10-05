import { useCallback, useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { RotateCcw, Trophy, X } from 'lucide-react';
import { burstConfetti } from '@/lib/confetti';
import { OPEN_GAME_EVENT } from '@/lib/site';
import { FLAPPY_MIN_SCORE, FLAPPY_NAME_MAX, fetchRanking, sendScore, type FlappyScore } from '@/lib/arcade';

type Phase = 'ready' | 'playing' | 'over';

// Física em pixels por segundo. Ajustada pra ficar jogável no dedo.
const GRAVITY = 1500;
const FLAP = -440;
const BASE_SPEED = 165;
const PIPE_W = 58;
const SPACING = 230;
const GROUND = 56;
const BIRD_R = 13;

const BEST_KEY = 'flappy:best';
const NAME_KEY = 'flappy:name';

const readStorage = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // aba anônima: só não guarda
  }
};

interface Pipe {
  x: number;
  top: number;
  passed: boolean;
}

/**
 * O Flappy Bird do card de projetos, jogável: canvas 2D, roxo como o resto do
 * site. Abre em tela cheia no celular e numa janela no notebook. Quem passa de
 * 10 canos pode deixar o nome no ranking.
 */
const FlappyGame = () => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(readStorage(BEST_KEY) ?? 0));
  const [ranking, setRanking] = useState<FlappyScore[] | null>(null);
  const [name, setName] = useState(() => readStorage(NAME_KEY) ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ rank: number | null } | null>(null);
  const [saveError, setSaveError] = useState('');

  // O Dialog monta o conteúdo depois do estado mudar; com state o efeito
  // do jogo roda quando o canvas existe de fato.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const flapRef = useRef<() => void>(() => {});
  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_GAME_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_GAME_EVENT, onOpen);
  }, []);

  // Ranking: se a API não estiver configurada, o jogo segue sem ele.
  useEffect(() => {
    if (!open) return;
    fetchRanking()
      .then(setRanking)
      .catch(() => setRanking(null));
  }, [open]);

  // O jogo em si: só roda com a janela aberta.
  useEffect(() => {
    if (!open) return;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue('--accent').trim() || '258 90% 76%';
    const color = (alpha = 1) => `hsl(${accent} / ${alpha})`;

    let width = 0;
    let height = 0;
    let state: Phase = 'ready';
    let points = 0;
    let bird = { y: 0, vy: 0 };
    let pipes: Pipe[] = [];
    let ground = 0;
    let time = 0;
    let last = performance.now();
    let frame = 0;

    const gap = () => Math.min(190, Math.max(140, height * 0.26));
    const birdX = () => Math.min(width * 0.3, 140);
    const speed = () => BASE_SPEED + Math.min(points * 3, 90);

    const newPipe = (x: number): Pipe => {
      const margin = 56;
      const max = height - GROUND - gap() - margin;
      return { x, top: margin + Math.random() * Math.max(0, max - margin), passed: false };
    };

    const reset = () => {
      state = 'ready';
      points = 0;
      bird = { y: (height - GROUND) * 0.45, vy: 0 };
      pipes = [];
      setPhase('ready');
      setScore(0);
      setSaved(null);
      setSaveError('');
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state !== 'playing') bird.y = (height - GROUND) * 0.45;
    };

    const gameOver = () => {
      state = 'over';
      setPhase('over');
      setBest((previous) => {
        if (points <= previous) return previous;
        writeStorage(BEST_KEY, String(points));
        return points;
      });
    };

    const flap = () => {
      if (state === 'over') return;
      if (state === 'ready') {
        state = 'playing';
        setPhase('playing');
        pipes = [newPipe(width + 80)];
      }
      bird.vy = FLAP;
    };

    flapRef.current = flap;
    resetRef.current = reset;

    const update = (dt: number) => {
      time += dt;
      if (state !== 'over') ground = (ground + speed() * dt) % 24;

      if (state === 'ready') {
        bird.y = (height - GROUND) * 0.45 + Math.sin(time * 3) * 8;
        return;
      }
      if (state === 'over') {
        // O passarinho cai até o chão depois de bater.
        if (bird.y < height - GROUND - BIRD_R) {
          bird.vy += GRAVITY * dt;
          bird.y = Math.min(height - GROUND - BIRD_R, bird.y + bird.vy * dt);
        }
        return;
      }

      bird.vy += GRAVITY * dt;
      bird.y += bird.vy * dt;
      if (bird.y < BIRD_R) {
        bird.y = BIRD_R;
        bird.vy = 0;
      }

      const v = speed();
      pipes.forEach((pipe) => (pipe.x -= v * dt));
      if (pipes.length && pipes[0].x < -PIPE_W) pipes.shift();
      const lastPipe = pipes[pipes.length - 1];
      if (!lastPipe || lastPipe.x < width - SPACING) pipes.push(newPipe((lastPipe?.x ?? width) + SPACING));

      const bx = birdX();
      for (const pipe of pipes) {
        if (!pipe.passed && pipe.x + PIPE_W < bx) {
          pipe.passed = true;
          points += 1;
          setScore(points);
        }
        const withinX = bx + BIRD_R - 3 > pipe.x && bx - BIRD_R + 3 < pipe.x + PIPE_W;
        const hitsY = bird.y - BIRD_R + 3 < pipe.top || bird.y + BIRD_R - 3 > pipe.top + gap();
        if (withinX && hitsY) return gameOver();
      }
      if (bird.y + BIRD_R >= height - GROUND) {
        bird.y = height - GROUND - BIRD_R;
        gameOver();
      }
    };

    const draw = () => {
      ctx.fillStyle = '#0b0b0e';
      ctx.fillRect(0, 0, width, height);

      // Pontinhos de fundo andando devagar (parallax).
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      const offset = (time * 20) % 28;
      for (let x = -offset; x < width; x += 28) {
        for (let y = 14; y < height - GROUND; y += 28) ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Canos
      const g = gap();
      for (const pipe of pipes) {
        for (const [y, h] of [
          [-12, pipe.top + 12],
          [pipe.top + g, height - GROUND - pipe.top - g + 12],
        ]) {
          ctx.beginPath();
          // roundRect é recente (Safari 16+); sem ele, cano reto mesmo.
          if (ctx.roundRect) ctx.roundRect(pipe.x, y, PIPE_W, h, 12);
          else ctx.rect(pipe.x, y, PIPE_W, h);
          ctx.fillStyle = color(0.1);
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = color(0.65);
          ctx.stroke();
        }
        // Bordinha na boca do cano
        ctx.fillStyle = color(0.85);
        ctx.fillRect(pipe.x + 8, pipe.top - 3, PIPE_W - 16, 3);
        ctx.fillRect(pipe.x + 8, pipe.top + g, PIPE_W - 16, 3);
      }

      // Chão
      const floor = height - GROUND;
      ctx.fillStyle = '#0d0d10';
      ctx.fillRect(0, floor, width, GROUND);
      ctx.fillStyle = color(0.5);
      ctx.fillRect(0, floor, width, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let x = -ground; x < width; x += 24) ctx.fillRect(x, floor + 12, 12, 2);

      // Passarinho
      const bx = birdX();
      const tilt = Math.max(-0.5, Math.min(1.2, bird.vy / 600));
      ctx.save();
      ctx.translate(bx, bird.y);
      ctx.rotate(tilt);
      ctx.shadowColor = color(0.8);
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
      ctx.fillStyle = color(1);
      ctx.fill();
      ctx.shadowBlur = 0;
      // asa
      const flapping = state === 'playing' ? Math.sin(time * 22) * 4 : Math.sin(time * 6) * 2;
      ctx.beginPath();
      ctx.ellipse(-4, 2 + flapping * 0.5, 7, 4 + flapping * 0.3, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
      // olho
      ctx.beginPath();
      ctx.arc(5, -4, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6.5, -4, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0b0e';
      ctx.fill();
      // bico
      ctx.beginPath();
      ctx.moveTo(BIRD_R - 2, 0);
      ctx.lineTo(BIRD_R + 6, 2);
      ctx.lineTo(BIRD_R - 2, 5);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      ctx.restore();
    };

    const loop = (now: number) => {
      // Passo limitado: trocar de aba não teleporta o passarinho.
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      frame = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    reset();
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [open, canvas]);

  // Teclado: espaço, ↑ ou W voam; enter recomeça depois de perder.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest('input')) return;
      if (event.code === 'Space' || event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        event.preventDefault();
        if (phase === 'over') resetRef.current();
        else flapRef.current();
      } else if (event.key === 'Enter' && phase === 'over') {
        resetRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, phase]);

  const save = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const clean = name.trim();
      if (!clean || saving) return;
      setSaving(true);
      setSaveError('');
      writeStorage(NAME_KEY, clean);
      try {
        const result = await sendScore(clean, score);
        setRanking(result.scores);
        setSaved({ rank: result.rank });
        if (result.rank && result.rank <= 3) burstConfetti(window.innerWidth / 2, window.innerHeight / 3);
      } catch (error) {
        setSaveError((error as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [name, saving, score],
  );

  const qualifies = score >= FLAPPY_MIN_SCORE;
  const top = ranking?.slice(0, phase === 'over' ? 5 : 3) ?? [];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#0b0b0e] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(720px,90vh)] sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <DialogPrimitive.Title className="font-mono text-xs text-muted-foreground">
              flappy-bird<span className="text-accent">.ia</span>
            </DialogPrimitive.Title>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> recorde {best}
            </span>
            <DialogPrimitive.Close
              aria-label="Fechar o jogo"
              className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative flex-1 select-none">
            <canvas
              ref={setCanvas}
              onPointerDown={(event) => {
                event.preventDefault();
                if (phase !== 'over') flapRef.current();
              }}
              className="absolute inset-0 h-full w-full touch-none"
              aria-label="Área do jogo: toque, clique ou aperte espaço para voar"
            />

            {/* Placar */}
            {phase !== 'ready' && (
              <p
                className="pointer-events-none absolute inset-x-0 top-6 text-center text-6xl font-semibold tracking-tight text-foreground [text-shadow:0_4px_24px_rgba(0,0,0,0.6)]"
                aria-live="polite"
              >
                {score}
              </p>
            )}

            {phase === 'ready' && (
              <div className="pointer-events-none absolute inset-x-0 top-[12%] px-6 text-center">
                <p className="text-3xl font-semibold tracking-tight text-foreground">Flappy Bird</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  A IA aprendeu sozinha. Agora é a sua vez.
                </p>
                <p className="mt-6 inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 font-mono text-xs text-accent">
                  toque ou aperte espaço para voar
                </p>
                {top.length > 0 && (
                  <ol className="mx-auto mt-8 w-fit list-none space-y-1 p-0 text-left font-mono text-xs text-muted-foreground">
                    {top.map((item, index) => (
                      <li key={item.name} className="flex gap-3">
                        <span className="text-accent">#{index + 1}</span>
                        <span className="w-28 truncate text-foreground/80">{item.name}</span>
                        <span>{item.score}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {phase === 'over' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-5 backdrop-blur-[2px] animate-in fade-in duration-300">
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d10]/95 p-5 shadow-2xl">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    fim de jogo
                  </p>
                  <div className="mt-3 flex items-end gap-6">
                    <div>
                      <p className="text-4xl font-semibold tracking-tight text-foreground">{score}</p>
                      <p className="text-xs text-muted-foreground">canos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-muted-foreground">{best}</p>
                      <p className="text-xs text-muted-foreground">seu recorde</p>
                    </div>
                  </div>

                  {ranking !== null &&
                    (qualifies && !saved ? (
                      <form onSubmit={save} className="mt-5 space-y-2">
                        <label htmlFor="flappy-name" className="text-sm text-foreground">
                          Mandou bem! Deixe seu nome no ranking:
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="flappy-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={FLAPPY_NAME_MAX}
                            required
                            autoComplete="nickname"
                            placeholder="seu nome"
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent/60 sm:text-sm"
                          />
                          <button
                            type="submit"
                            disabled={saving}
                            className="shrink-0 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {saving ? 'salvando…' : 'salvar'}
                          </button>
                        </div>
                        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                      </form>
                    ) : (
                      !qualifies && (
                        <p className="mt-4 text-sm text-muted-foreground">
                          Passe de {FLAPPY_MIN_SCORE} canos para entrar no ranking.
                        </p>
                      )
                    ))}

                  {saved && (
                    <p className="mt-4 text-sm text-online">
                      {saved.rank ? `Você está em #${saved.rank} no ranking! 🏆` : 'Salvo no ranking!'}
                    </p>
                  )}

                  {top.length > 0 && (
                    <ol className="mt-4 list-none space-y-1.5 border-t border-white/[0.06] p-0 pt-4 font-mono text-xs">
                      {top.map((item, index) => (
                        <li
                          key={item.name}
                          className={`flex gap-3 ${
                            saved && item.name === name.trim() ? 'text-accent' : 'text-muted-foreground'
                          }`}
                        >
                          <span className="w-6 text-accent">#{index + 1}</span>
                          <span className="min-w-0 flex-1 truncate text-foreground/85">{item.name}</span>
                          <span>{item.score}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  <button
                    type="button"
                    onClick={() => resetRef.current()}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Jogar de novo
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default FlappyGame;
