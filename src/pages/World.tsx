import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '@fontsource/press-start-2p';
import FlappyGame from '@/components/FlappyGame';
import { burstConfetti } from '@/lib/confetti';
import { downloadCv, openExternal, openGame } from '@/lib/site';
import { createWorld, islandOutline, PIER_RECT, type WorldHandle } from '@/world/engine';
import { FLOPPIES, STATIONS, type Station, type StationAction } from '@/world/stations';
import { setMuted, sfx, unlockAudio } from '@/world/audio';

const STORAGE_KEY = 'ilha:progresso';
const MUTE_KEY = 'ilha:mudo';

interface Progress {
  visited: string[];
  collected: number[];
}

const readProgress = (): Progress => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { visited: [], collected: [] };
    const parsed = JSON.parse(raw) as Progress;
    return { visited: parsed.visited ?? [], collected: parsed.collected ?? [] };
  } catch {
    return { visited: [], collected: [] };
  }
};

const writeProgress = (progress: Progress) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // aba anônima: só não guarda
  }
};

const pixel = { fontFamily: '"Press Start 2P", monospace' } as const;

/** Moldura de janela de RPG. */
const panel =
  'border-[3px] border-[#a78bfa] bg-[#1a1030]/95 shadow-[4px_4px_0_#000] [image-rendering:pixelated]';

interface Toast {
  id: number;
  text: string;
  tone: 'visit' | 'floppy' | 'win';
}

/* ---------------------------------------------------------------- joystick */

const Joystick = ({ onMove }: { onMove: (x: number, z: number) => void }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointer = useRef<number | null>(null);

  const update = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const radius = rect.width / 2;
    let dx = clientX - (rect.left + radius);
    let dy = clientY - (rect.top + radius);
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }
    setKnob({ x: dx, y: dy });
    onMove(dx / radius, dy / radius);
  };
  const release = () => {
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div
      ref={baseRef}
      className="relative h-32 w-32 touch-none rounded-full border-[3px] border-white/30 bg-black/30 backdrop-blur-sm"
      onPointerDown={(event) => {
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => pointer.current === event.pointerId && update(event.clientX, event.clientY)}
      onPointerUp={release}
      onPointerCancel={release}
      aria-hidden="true"
    >
      <div
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border-[3px] border-white/70 bg-[#a78bfa]/80"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
};

/* ---------------------------------------------------------------- minimapa */

const OUTLINE = islandOutline();

const Minimap = ({
  world,
  visited,
  size,
}: {
  world: WorldHandle | null;
  visited: Set<string>;
  size: number;
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !world) return;
    const ctx = canvas.getContext('2d')!;
    const scale = size / 110;
    const toMap = (x: number, z: number) => [size / 2 + x * scale, size / 2 + z * scale] as const;
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#2f86b5';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#f2cf8d';
      ctx.beginPath();
      OUTLINE.forEach(([x, z], i) => (i ? ctx.lineTo(...toMap(x, z)) : ctx.moveTo(...toMap(x, z))));
      ctx.fill();
      ctx.fillStyle = '#5fbf5a';
      ctx.beginPath();
      OUTLINE.forEach(([x, z], i) => {
        const p = toMap(x * 0.86, z * 0.86);
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
      });
      ctx.fill();
      ctx.fillStyle = '#a8794a';
      const [px, pz] = toMap(PIER_RECT.x - 1.2, PIER_RECT.z);
      ctx.fillRect(px, pz, 2.4 * scale, PIER_RECT.length * scale);
      STATIONS.forEach((station) => {
        const [x, y] = toMap(station.x, station.z);
        const done = visited.has(station.id);
        ctx.fillStyle = done ? '#ffd166' : station.kind === 'milestone' ? '#5ec8f2' : '#a78bfa';
        const s = station.kind === 'milestone' ? 3 : 5;
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
      });
      const player = world.player();
      const [x, y] = toMap(player.x, player.z);
      ctx.translate(x, y);
      ctx.rotate(-player.angle + Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4.5, 5);
      ctx.lineTo(-4.5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    draw();
    const timer = window.setInterval(draw, 100);
    return () => window.clearInterval(timer);
  }, [world, visited, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className="rounded-full border-[3px] border-[#a78bfa] shadow-[3px_3px_0_#000]"
      aria-label="Mapa da ilha"
    />
  );
};

/* ------------------------------------------------------------------ página */

const World = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [world, setWorld] = useState<WorldHandle | null>(null);
  const [started, setStarted] = useState(false);
  const [near, setNear] = useState<Station | null>(null);
  const [card, setCard] = useState<Station | null>(null);
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [muted, setMutedState] = useState(() => {
    try {
      return window.localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [compact, setCompact] = useState(() => window.innerWidth < 640);
  const toastId = useRef(0);

  const visited = new Set(progress.visited);
  const points = STATIONS.length;

  const pushToast = useCallback((text: string, tone: Toast['tone']) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 2600);
  }, []);

  useEffect(() => {
    document.title = 'Ilha do David · portfólio 3D';
    const onResize = () => setCompact(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => setMuted(muted), [muted]);

  // monta o mundo depois que a fonte pixelada carrega (as placas usam ela)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: WorldHandle | null = null;
    let cancelled = false;
    const fontReady =
      document.fonts?.load('16px "Press Start 2P"').catch(() => undefined) ?? Promise.resolve();
    void Promise.race([fontReady, new Promise((resolve) => setTimeout(resolve, 2500))]).then(() => {
      if (cancelled) return;
      handle = createWorld(canvas, {
        onNear: (station) => setNear(station),
        onVisit: (station) => {
          sfx.visit();
          setProgress((current) => {
            if (current.visited.includes(station.id)) return current;
            const next = { ...current, visited: [...current.visited, station.id] };
            writeProgress(next);
            return next;
          });
        },
        onCollect: (index) => {
          sfx.collect();
          setProgress((current) => {
            if (current.collected.includes(index)) return current;
            const next = { ...current, collected: [...current.collected, index] };
            writeProgress(next);
            return next;
          });
        },
        onJump: () => sfx.jump(),
      });
      handle.restore(readProgress().visited, readProgress().collected);
      if (import.meta.env.DEV) (window as unknown as { __ilha: WorldHandle }).__ilha = handle;
      setWorld(handle);
    });
    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, []);

  // avisos de conquista
  const lastCounts = useRef({ visited: progress.visited.length, collected: progress.collected.length });
  useEffect(() => {
    const before = lastCounts.current;
    if (progress.visited.length > before.visited) {
      const station = STATIONS.find((s) => s.id === progress.visited[progress.visited.length - 1]);
      if (station && station.kind !== 'milestone') pushToast(`+1 ponto · ${station.label}`, 'visit');
      if (progress.visited.length === points) {
        sfx.win();
        pushToast('Você explorou a ilha inteira!', 'win');
        burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 80);
      }
    }
    if (progress.collected.length > before.collected) {
      pushToast(`Disquete ${progress.collected.length}/${FLOPPIES.length}`, 'floppy');
      if (progress.collected.length === FLOPPIES.length) {
        sfx.win();
        pushToast('Todos os disquetes! Você é demais.', 'win');
        burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 80);
      }
    }
    lastCounts.current = { visited: progress.visited.length, collected: progress.collected.length };
  }, [progress, points, pushToast]);

  const start = useCallback(() => {
    if (!world || started) return;
    unlockAudio();
    sfx.start();
    world.start();
    setStarted(true);
  }, [world, started]);

  const openCard = useCallback((station: Station | null) => {
    if (!station || station.kind === 'milestone') return;
    sfx.open();
    setCard(station);
  }, []);
  const closeCard = useCallback(() => {
    sfx.close();
    setCard(null);
  }, []);

  useEffect(() => world?.setPaused(Boolean(card)), [world, card]);

  // teclado da interface
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!started) {
        if (key === 'enter' || key === ' ') {
          event.preventDefault();
          start();
        }
        return;
      }
      if (card) {
        if (key === 'escape' || key === 'e') closeCard();
        return;
      }
      if ((key === 'e' || key === 'enter') && near) openCard(near);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, card, near, start, openCard, closeCard]);

  const runAction = (action: StationAction) => {
    if (action.href) openExternal(action.href);
    else if (action.run === 'cv') downloadCv();
    else if (action.run === 'game') {
      setCard(null);
      openGame();
    }
  };

  const toggleMute = () => {
    setMutedState((value) => {
      try {
        window.localStorage.setItem(MUTE_KEY, value ? '0' : '1');
      } catch {
        // tudo bem
      }
      return !value;
    });
  };

  const resetProgress = () => {
    writeProgress({ visited: [], collected: [] });
    window.location.reload();
  };

  const milestoneNear = near?.kind === 'milestone' ? near : null;
  const interactive = near && near.kind !== 'milestone' ? near : null;

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#1b1038] text-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: 'pixelated' }}
        aria-label="Ilha do David em 3D"
      />
      {/* scanlines e vinheta de TV antiga */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-multiply"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 3px)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(10,0,30,0.55) 100%)' }}
        aria-hidden="true"
      />

      {!world && (
        <div className="absolute inset-0 grid place-items-center bg-[#1b1038]" style={pixel}>
          <p className="animate-pulse text-xs text-[#c4b5fd]">CARREGANDO A ILHA…</p>
        </div>
      )}

      {/* tela inicial */}
      {world && !started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(27,16,56,0.82)_0%,rgba(27,16,56,0.55)_55%,rgba(27,16,56,0.2)_100%)] px-4 text-center">
          <p className="text-[10px] tracking-widest text-[#ffd166] sm:text-xs" style={pixel}>
            UM PORTFÓLIO PRA EXPLORAR
          </p>
          <h1
            className="mt-5 animate-[world-bob_2.4s_ease-in-out_infinite] text-3xl leading-tight sm:text-5xl md:text-6xl"
            style={{
              ...pixel,
              color: '#fff7e6',
              textShadow: '4px 4px 0 #7c3aed, 8px 8px 0 #2a1650',
            }}
          >
            ILHA DO
            <br />
            DAVID
          </h1>
          <p className="mt-8 max-w-md text-sm text-white/80 sm:text-base">
            Ande pela ilha, visite os {points} pontos e ache os {FLOPPIES.length} disquetes escondidos.
          </p>
          <button
            type="button"
            onClick={start}
            className={`${panel} mt-8 animate-[world-blink_1.1s_steps(2)_infinite] px-6 py-4 text-xs text-[#ffd166] sm:text-sm`}
            style={pixel}
          >
            ▶ PRESSIONE START
          </button>
          <p className="mt-6 text-[9px] leading-relaxed text-white/60 sm:text-[10px]" style={pixel}>
            {touch
              ? 'JOYSTICK PRA ANDAR · A PRA INTERAGIR'
              : 'WASD/SETAS · SHIFT CORRE · ESPAÇO PULA · E INTERAGE'}
          </p>
          {(progress.visited.length > 0 || progress.collected.length > 0) && (
            <p className="mt-4 text-xs text-white/60">
              Você já visitou {progress.visited.length}/{points} pontos e achou {progress.collected.length}/
              {FLOPPIES.length} disquetes.{' '}
              <button type="button" onClick={resetProgress} className="underline hover:text-white">
                Recomeçar
              </button>
            </p>
          )}
          <Link
            to="/"
            className="mt-8 text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            ← Voltar pro site normal
          </Link>
        </div>
      )}

      {/* HUD */}
      {started && (
        <>
          <div className="absolute left-3 top-3 flex items-center gap-2 sm:left-4 sm:top-4">
            <Link to="/" className={`${panel} px-3 py-2 text-[9px] text-white sm:text-[10px]`} style={pixel}>
              ← SITE
            </Link>
            <button
              type="button"
              onClick={toggleMute}
              className={`${panel} px-3 py-2 text-[9px] sm:text-[10px]`}
              style={pixel}
              aria-label={muted ? 'Ligar o som' : 'Desligar o som'}
            >
              {muted ? 'SOM: OFF' : 'SOM: ON'}
            </button>
          </div>

          <div className="absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
            <div className={`${panel} space-y-2 px-3 py-2 text-[9px] sm:text-[10px]`} style={pixel}>
              <p>
                <span className="text-[#ffd166]">★</span> {progress.visited.length}/{points}
              </p>
              <p>
                <span className="text-[#5ec8f2]">▣</span> {progress.collected.length}/{FLOPPIES.length}
              </p>
            </div>
            <Minimap world={world} visited={visited} size={compact ? 92 : 132} />
          </div>

          {/* avisos */}
          <div className="pointer-events-none absolute left-1/2 top-16 flex -translate-x-1/2 flex-col items-center gap-2 sm:top-6">
            {toasts.map((toast) => (
              <p
                key={toast.id}
                className={`${panel} animate-[world-pop_0.35s_ease-out] whitespace-nowrap px-3 py-2 text-[9px] sm:text-[10px] ${
                  toast.tone === 'win'
                    ? 'text-[#5ee26b]'
                    : toast.tone === 'floppy'
                      ? 'text-[#5ec8f2]'
                      : 'text-[#ffd166]'
                }`}
                style={pixel}
              >
                {toast.text}
              </p>
            ))}
          </div>

          {/* marco da carreira: aparece sozinho quando chega perto */}
          {milestoneNear && !card && (
            <div
              className={`${panel} absolute left-1/2 w-[min(92vw,30rem)] -translate-x-1/2 animate-[world-pop_0.3s_ease-out] p-4 ${
                touch ? 'bottom-44' : 'bottom-8'
              }`}
            >
              <p className="text-[9px] text-[#5ec8f2]" style={pixel}>
                {milestoneNear.subtitle?.toUpperCase()}
              </p>
              <p className="mt-2 text-base font-semibold">{milestoneNear.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{milestoneNear.text}</p>
            </div>
          )}

          {/* chamada pra interagir */}
          {interactive && !card && (
            <button
              type="button"
              onClick={() => openCard(interactive)}
              className={`${panel} absolute left-1/2 -translate-x-1/2 animate-[world-pop_0.3s_ease-out] px-4 py-3 text-[10px] text-white sm:text-xs ${
                touch ? 'bottom-44' : 'bottom-8'
              }`}
              style={pixel}
            >
              <span className="text-[#ffd166]">{touch ? '[A]' : '[E]'}</span>{' '}
              {interactive.label.toUpperCase()}
            </button>
          )}

          {!touch && !card && !near && (
            <p className="absolute bottom-4 left-4 text-[9px] leading-loose text-white/70" style={pixel}>
              WASD/SETAS ANDAR · SHIFT CORRER
              <br />
              ESPAÇO PULAR · E INTERAGIR
            </p>
          )}

          {/* controles de toque */}
          {touch && !card && (
            <>
              <div className="absolute bottom-6 left-5">
                <Joystick onMove={(x, z) => world?.setJoystick(x, z)} />
              </div>
              <div className="absolute bottom-8 right-5 flex items-end gap-3">
                <button
                  type="button"
                  onPointerDown={() => world?.jump()}
                  className="h-14 w-14 rounded-full border-[3px] border-white/60 bg-[#5ec8f2]/80 text-xs shadow-[3px_3px_0_#000] active:translate-y-0.5"
                  style={pixel}
                  aria-label="Pular"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => openCard(interactive)}
                  disabled={!interactive}
                  className="mb-6 h-16 w-16 rounded-full border-[3px] border-white/60 bg-[#a78bfa]/90 text-sm shadow-[3px_3px_0_#000] transition-opacity active:translate-y-0.5 disabled:opacity-40"
                  style={pixel}
                  aria-label="Interagir"
                >
                  A
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* janela da estação */}
      {card && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 p-3" onClick={closeCard}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="estacao-titulo"
            className={`${panel} max-h-[88vh] w-[min(94vw,34rem)] animate-[world-pop_0.3s_ease-out] overflow-y-auto`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b-[3px] border-[#a78bfa] bg-[#2a1650] px-4 py-3">
              <p className="truncate text-[9px] text-[#ffd166] sm:text-[10px]" style={pixel}>
                ★ {card.subtitle?.toUpperCase()}
              </p>
              <button
                type="button"
                onClick={closeCard}
                className="shrink-0 text-[10px] text-white/70 hover:text-white"
                style={pixel}
                aria-label="Fechar"
              >
                [X]
              </button>
            </div>
            {card.image && (
              <img
                src={card.image}
                alt={`Captura de tela do projeto ${card.title}`}
                className="aspect-[16/10] w-full border-b-[3px] border-[#a78bfa] object-cover object-top"
              />
            )}
            <div className="p-4 sm:p-5">
              <h2 id="estacao-titulo" className="text-base leading-snug sm:text-lg" style={pixel}>
                {card.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/80">{card.text}</p>
              {card.tags && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <li
                      key={tag}
                      className="border-2 border-white/20 bg-white/5 px-2 py-1 font-mono text-[11px] text-white/80"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              {card.actions && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {card.actions.map((action, index) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => runAction(action)}
                      className={`border-[3px] px-3 py-2.5 text-[9px] shadow-[3px_3px_0_#000] transition-transform active:translate-y-0.5 sm:text-[10px] ${
                        index === 0
                          ? 'border-[#ffd166] bg-[#ffd166] text-[#1a1030]'
                          : 'border-[#a78bfa] bg-[#2a1650] text-white'
                      }`}
                      style={pixel}
                    >
                      {action.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FlappyGame />
    </div>
  );
};

export default World;
