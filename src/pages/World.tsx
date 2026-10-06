import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Clock, Map as MapIcon, Moon, Music, Shirt, Sun, Sunset, Volume2, VolumeX } from 'lucide-react';
import FlappyGame from '@/components/FlappyGame';
import OutfitShop from '@/components/OutfitShop';
import { burstConfetti } from '@/lib/confetti';
import { downloadCv, openExternal, openGame } from '@/lib/site';
import { createWorld, type GuideTarget, type RideState, type TimeMode, type WorldHandle } from '@/world/engine';
import { EGGS, STATIONS, type Station, type StationAction } from '@/world/stations';
import {
  BigMap,
  CameraControls,
  LiveHud,
  Minimap,
  PortfolioPanel,
  WelcomeCard,
} from '@/components/WorldHud';
import { formatTime, panel } from '@/world/ui';
import { setMuted, sfx, unlockAudio } from '@/world/audio';
import { music, TRACKS, type TrackId } from '@/world/music';
import type { RideKind } from '@/world/animals';
import { outfitById, type Outfit } from '@/world/outfits';

const STORAGE_KEY = 'sitio:progresso';
const MUTE_KEY = 'sitio:mudo';
const TIME_KEY = 'sitio:hora';
const OUTFIT_KEY = 'sitio:roupa';
const OWNED_KEY = 'sitio:roupas';
const FISH_KEY = 'sitio:peixes';
const MUSIC_KEY = 'sitio:musica';
const AMBIENCE_KEY = 'sitio:ambiente';
const WELCOME_KEY = 'sitio:boas-vindas';
const RECORDS_KEY = 'sitio:desafios';

const readList = (key: string): string[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

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

const readSetting = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const saveSetting = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // tudo bem
  }
};

const MOUNT_TEXT: Record<RideKind, { on: string; off: string }> = {
  cavalo: { on: 'Montar no cavalo', off: 'Descer do cavalo' },
  vaca: { on: 'Montar na vaca', off: 'Descer da vaca' },
  porco: { on: 'Montar no porco', off: 'Descer do porco' },
  ovelha: { on: 'Montar na ovelha', off: 'Descer da ovelha' },
  bugue: { on: 'Dirigir o bugue', off: 'Sair do bugue' },
  barco: { on: 'Andar de barco', off: 'Descer do barco' },
  aviao: { on: 'Pilotar o avião', off: 'Descer do avião' },
  brinquedo: { on: 'Andar no brinquedo', off: 'Descer do brinquedo' },
  pesca: { on: 'Pescar', off: 'Recolher a linha' },
};

const TIME_LABEL: Record<TimeMode, string> = {
  auto: 'Hora real',
  dia: 'Dia',
  tarde: 'Pôr do sol',
  noite: 'Noite',
};
const NEXT_TIME: Record<TimeMode, TimeMode> = { auto: 'dia', dia: 'tarde', tarde: 'noite', noite: 'auto' };
const TIME_ICON = { auto: Clock, dia: Sun, tarde: Sunset, noite: Moon };

interface Toast {
  id: number;
  text: string;
  tone: 'visit' | 'egg' | 'win';
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
      className="relative h-32 w-32 touch-none rounded-full border-2 border-white/25 bg-black/30 backdrop-blur-sm"
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
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border-2 border-white/70 bg-violet-500/85 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ página */

const World = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [world, setWorld] = useState<WorldHandle | null>(null);
  const [started, setStarted] = useState(false);
  const [near, setNear] = useState<Station | null>(null);
  const [ride, setRide] = useState<RideState>({ riding: null, canMount: null });
  const [night, setNight] = useState(false);
  const [card, setCard] = useState<Station | null>(null);
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [muted, setMutedState] = useState(() => readSetting(MUTE_KEY) === '1');
  const [timeMode, setTimeMode] = useState<TimeMode>(() => {
    const saved = readSetting(TIME_KEY);
    return saved === 'dia' || saved === 'tarde' || saved === 'noite' ? saved : 'auto';
  });
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [compact, setCompact] = useState(() => window.innerWidth < 640);
  const [narrow, setNarrow] = useState(() => window.innerWidth < 1000);
  const toastId = useRef(0);
  const [shop, setShop] = useState(false);
  const [outfitId, setOutfitId] = useState(() => outfitById(readSetting(OUTFIT_KEY)).id);
  const [owned, setOwned] = useState<string[]>(() => readList(OWNED_KEY));
  const [fish, setFish] = useState(() => Number(readSetting(FISH_KEY)) || 0);
  const [track, setTrack] = useState<TrackId | null>(() => {
    const saved = readSetting(MUSIC_KEY);
    if (saved === 'off') return null;
    return TRACKS.find((t) => t.id === saved)?.id ?? 'manha';
  });
  const [ambience, setAmbience] = useState(() => readSetting(AMBIENCE_KEY) !== '0');
  const [musicMenu, setMusicMenu] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [portfolio, setPortfolio] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [guide, setGuide] = useState<GuideTarget | null>(null);
  const [firstPerson, setFirstPerson] = useState(false);

  const visited = new Set(progress.visited);
  const points = STATIONS.length;

  const pushToast = useCallback((text: string, tone: Toast['tone']) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 2600);
  }, []);

  useEffect(() => {
    document.title = 'Sítio do David · portfólio 3D';
    const onResize = () => {
      setCompact(window.innerWidth < 640);
      setNarrow(window.innerWidth < 1000);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setMuted(muted);
    music.setMuted(muted);
  }, [muted]);
  useEffect(() => world?.setBag(fish), [world, fish]);
  useEffect(() => music.setNight(night), [night]);
  // música e sons da fazenda só começam depois de entrar (o navegador exige um clique)
  useEffect(() => {
    if (!started) return;
    music.play(track);
    saveSetting(MUSIC_KEY, track ?? 'off');
  }, [started, track]);
  useEffect(() => {
    if (!started) return;
    music.setAmbience(ambience);
    saveSetting(AMBIENCE_KEY, ambience ? '1' : '0');
  }, [started, ambience]);
  useEffect(() => () => music.stop(), []);
  useEffect(() => {
    world?.setTimeMode(timeMode);
    saveSetting(TIME_KEY, timeMode);
  }, [world, timeMode]);

  // monta o mundo depois que a fonte carrega (as plaquinhas usam ela)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: WorldHandle | null = null;
    let cancelled = false;
    const fontReady =
      Promise.all([
        document.fonts?.load('650 44px "Geist Variable"'),
        document.fonts?.load('750 72px "Geist Variable"'),
      ]).catch(() => undefined) ?? Promise.resolve();
    void Promise.race([fontReady, new Promise((resolve) => setTimeout(resolve, 2500))]).then(() => {
      if (cancelled) return;
      handle = createWorld(
        canvas,
        {
          onNear: (station) => setNear(station),
          onRide: (state) => setRide(state),
          onNight: (value) => setNight(value),
          onHint: (text) => pushToast(text, 'visit'),
          onView: (value) => setFirstPerson(value),
          onGuide: (target) => setGuide(target),
          onChallenge: (event) => {
            const { course } = event;
            if (event.type === 'start') pushToast(`🏁 ${course.name}: passe por ${course.rings.length - 1} argolas!`, 'egg');
            else if (event.type === 'fail') pushToast(`${course.emoji} Desafio cancelado: ${event.reason}`, 'visit');
            else if (event.type === 'done') {
              let records: Record<string, number> = {};
              try {
                records = JSON.parse(readSetting(RECORDS_KEY) ?? '{}') as Record<string, number>;
              } catch {
                records = {};
              }
              const best = records[course.id];
              const record = !best || event.time < best;
              if (record) saveSetting(RECORDS_KEY, JSON.stringify({ ...records, [course.id]: event.time }));
              pushToast(
                `🏆 ${course.name} em ${formatTime(event.time)}${record ? ' · novo recorde!' : ` · recorde ${formatTime(best)}`}`,
                'win',
              );
              burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 70);
            }
          },
          onFeed: (name) => {
            pushToast(`🐟 ${name[0].toUpperCase()}${name.slice(1)} adorou o peixe!`, 'visit');
            setFish((count) => {
              const next = Math.max(0, count - 1);
              saveSetting(FISH_KEY, String(next));
              return next;
            });
          },
          onCatch: (caught) => {
            if (caught.junk) pushToast(`${caught.emoji} Pescou ${caught.name}... 😅`, 'visit');
            else {
              pushToast(`${caught.emoji} ${caught.name} · ${caught.kg.toLocaleString('pt-BR')} kg!`, 'egg');
              setFish((count) => {
                saveSetting(FISH_KEY, String(count + 1));
                return count + 1;
              });
            }
          },
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
        },
        outfitById(readSetting(OUTFIT_KEY)),
      );
      handle.restore(readProgress().visited, readProgress().collected);
      if (import.meta.env.DEV) (window as unknown as { __sitio: WorldHandle }).__sitio = handle;
      setWorld(handle);
    });
    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, [pushToast]);

  // avisos de conquista
  const lastCounts = useRef({ visited: progress.visited.length, collected: progress.collected.length });
  useEffect(() => {
    const before = lastCounts.current;
    if (progress.visited.length > before.visited) {
      const station = STATIONS.find((s) => s.id === progress.visited[progress.visited.length - 1]);
      if (station && station.kind !== 'milestone') pushToast(`+1 ponto · ${station.label}`, 'visit');
      if (progress.visited.length === points) {
        sfx.win();
        pushToast('Você explorou o sítio inteiro!', 'win');
        burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 80);
      }
    }
    if (progress.collected.length > before.collected) {
      pushToast(`Ovo de ouro ${progress.collected.length}/${EGGS.length}`, 'egg');
      if (progress.collected.length === EGGS.length) {
        sfx.win();
        pushToast('Todos os ovos de ouro! Você é demais.', 'win');
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
    if (readSetting(WELCOME_KEY) !== '1') {
      setWelcome(true);
      saveSetting(WELCOME_KEY, '1');
    }
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

  const modal = Boolean(card) || shop || mapOpen || portfolio || welcome;
  useEffect(() => world?.setPaused(modal), [world, modal]);

  const chooseGuide = useCallback(
    (target: GuideTarget | null) => {
      setGuide(target);
      world?.setGuide(target);
    },
    [world],
  );
  const travel = useCallback(
    (x: number, z: number) => {
      setMapOpen(false);
      setPortfolio(false);
      setCard(null);
      chooseGuide(null);
      // espera o jogo despausar pra viagem valer
      window.setTimeout(() => world?.travel(x, z), 0);
    },
    [world, chooseGuide],
  );

  const wear = useCallback(
    (outfit: Outfit) => {
      setOutfitId(outfit.id);
      saveSetting(OUTFIT_KEY, outfit.id);
      world?.setOutfit(outfit);
    },
    [world],
  );
  const unlock = useCallback(
    (outfit: Outfit) => {
      setOwned((list) => {
        const next = list.includes(outfit.id) ? list : [...list, outfit.id];
        saveSetting(OWNED_KEY, JSON.stringify(next));
        return next;
      });
      wear(outfit);
      sfx.win();
      burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 70);
      pushToast(`Valeu pela força! ${outfit.emoji} ${outfit.name} liberada`, 'win');
    },
    [wear, pushToast],
  );

  const interactive = near && near.kind !== 'milestone' ? near : null;

  /** Botão A / tecla E: abre a estação; se não tiver, monta ou desce. */
  const primary = useCallback(() => {
    if (interactive) openCard(interactive);
    else world?.toggleRide();
  }, [interactive, openCard, world]);

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
      if (shop) {
        if (key === 'escape') setShop(false);
        return;
      }
      if (mapOpen || portfolio || welcome) {
        if (key === 'escape' || (key === 'm' && mapOpen) || (key === 'p' && portfolio)) {
          setMapOpen(false);
          setPortfolio(false);
          setWelcome(false);
        }
        return;
      }
      if (key === 'm') setMapOpen(true);
      else if (key === 'p') setPortfolio(true);
      else if (key === 'e' || key === 'enter') primary();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, card, shop, mapOpen, portfolio, welcome, start, closeCard, primary]);

  const runAction = (action: StationAction) => {
    if (action.href) openExternal(action.href);
    else if (action.run === 'cv') downloadCv();
    else if (action.run === 'ride' && card) {
      setCard(null);
      world?.ride(card.id);
    } else if (action.run === 'game') {
      setCard(null);
      openGame();
    }
  };

  const toggleMute = () => {
    setMutedState((value) => {
      saveSetting(MUTE_KEY, value ? '0' : '1');
      return !value;
    });
  };

  const resetProgress = () => {
    writeProgress({ visited: [], collected: [] });
    window.location.reload();
  };

  const milestoneNear = near?.kind === 'milestone' ? near : null;
  const rideText =
    ride.label ??
    (ride.riding ? MOUNT_TEXT[ride.riding].off : ride.canMount ? MOUNT_TEXT[ride.canMount].on : null);
  const promptText = interactive ? `Abrir · ${interactive.label}` : rideText;
  const promptKey = interactive ? 'E' : 'F';
  /** Perto de um brinquedo aparecem os dois: abrir o projeto e andar nele. */
  /** Segundo botão: andar no brinquedo (F), pescar do barco ou dar peixe pro bicho (G). */
  const secondPrompt =
    interactive && ride.canMount === 'brinquedo' && rideText
      ? { label: rideText, icon: '🎢', key: 'F', run: () => world?.toggleRide() }
      : ride.extra
        ? { ...ride.extra, key: 'G', run: () => world?.extra() }
        : null;
  const bLabel =
    ride.riding === 'bugue'
      ? 'Buzina'
      : ride.riding === 'barco'
        ? 'Remar'
        : ride.riding === 'aviao'
          ? 'Fumaça'
          : ride.riding === 'brinquedo'
            ? 'Gritar'
            : ride.riding === 'pesca'
              ? 'Puxar'
              : 'Pular';
  const TimeIcon = TIME_ICON[timeMode];

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#0f0a1e] font-sans text-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Sítio do David em 3D"
      />

      {!world && (
        <div className="absolute inset-0 grid place-items-center bg-[#0f0a1e]">
          <p className="animate-pulse text-sm font-medium tracking-wide text-violet-200">
            Abrindo a porteira do sítio…
          </p>
        </div>
      )}

      {/* tela inicial */}
      {world && !started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(15,10,30,0.78)_0%,rgba(15,10,30,0.5)_55%,rgba(15,10,30,0.15)_100%)] px-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300 sm:text-sm">
            Portfólio interativo · David Fernandes
          </p>
          <h1
            className="mt-4 animate-[world-bob_2.6s_ease-in-out_infinite] text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl"
            style={{ textShadow: '0 3px 0 #6d28d9, 0 10px 30px rgba(0,0,0,0.45)' }}
          >
            Sítio do
            <br />
            David
          </h1>
          <p className="mt-5 text-[15px] text-white/85 sm:text-base">
            Sou desenvolvedor full-stack. Ande pelo sítio pra conhecer meus projetos, minha carreira e como falar
            comigo.
          </p>
          <ul className="mt-5 grid w-full max-w-md grid-cols-2 gap-2 text-left text-[13px] font-medium sm:text-sm">
            {[
              ['🎡', 'Projetos são brinquedos'],
              ['🏡', 'A casa conta quem eu sou'],
              ['🧭', 'A trilha mostra a carreira'],
              ['✈️', '3 aviões e desafios de voo'],
              ['🐴', 'Monte nos bichos e reme'],
              ['🥚', `Ache ${EGGS.length} ovos de ouro`],
            ].map(([icon, text]) => (
              <li
                key={text}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-3 py-2 backdrop-blur-sm"
              >
                <span aria-hidden="true" className="text-lg">
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={start}
            className="mt-8 rounded-full bg-violet-500 px-8 py-3.5 text-base font-semibold shadow-lg shadow-violet-900/50 transition hover:bg-violet-400 active:scale-95"
          >
            Entrar no sítio
          </button>
          <p className="mt-5 text-xs leading-relaxed text-white/65 sm:text-sm">
            {touch
              ? 'Joystick anda · arraste pra girar e subir a câmera · A usa · B pula'
              : 'WASD anda · E abre · F monta · V olhos · M mapa · P portfólio'}
          </p>
          {(progress.visited.length > 0 || progress.collected.length > 0) && (
            <p className="mt-3 text-xs text-white/60 sm:text-sm">
              Você já visitou {progress.visited.length}/{points} pontos e achou {progress.collected.length}/
              {EGGS.length} ovos.{' '}
              <button
                type="button"
                onClick={resetProgress}
                className="underline underline-offset-2 hover:text-white"
              >
                Recomeçar
              </button>
            </p>
          )}
          <Link
            to="/"
            className="mt-8 text-sm text-white/65 underline-offset-4 hover:text-white hover:underline"
          >
            ← Voltar pro site normal
          </Link>
        </div>
      )}

      {/* HUD */}
      {started && (
        <>
          <div
            className="absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4"
            style={{ maxWidth: compact ? 'calc(100vw - 9.5rem)' : undefined }}
          >
            <Link to="/" aria-label="Voltar pro site" className={`${panel} flex h-9 items-center gap-1.5 px-3 text-sm font-medium`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {!compact && 'Site'}
            </Link>
            <button
              type="button"
              onClick={() => {
                sfx.open();
                setPortfolio(true);
              }}
              className="flex h-9 items-center gap-1.5 rounded-2xl border border-amber-200/50 bg-violet-600/90 px-3 text-sm font-semibold shadow-lg shadow-black/30 backdrop-blur-md"
              aria-label="Portfólio: projetos, sobre mim e contato (P)"
              title="Portfólio (P)"
            >
              <Briefcase className="h-4 w-4 text-amber-200" aria-hidden="true" />
              Portfólio
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.open();
                setMapOpen(true);
              }}
              className={`${panel} flex h-9 items-center gap-1.5 px-3 text-sm font-medium`}
              aria-label="Mapa do sítio (M)"
              title="Mapa (M)"
            >
              <MapIcon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              {!narrow && 'Mapa'}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className={`${panel} grid h-9 w-9 place-items-center`}
              aria-label={muted ? 'Ligar o som' : 'Desligar o som'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setTimeMode((mode) => NEXT_TIME[mode])}
              className={`${panel} flex h-9 items-center gap-1.5 px-3 text-sm font-medium`}
              aria-label={`Hora do dia: ${TIME_LABEL[timeMode]}. Toque pra trocar.`}
            >
              <TimeIcon
                className={`h-4 w-4 ${night ? 'text-indigo-200' : 'text-amber-300'}`}
                aria-hidden="true"
              />
              {!narrow && TIME_LABEL[timeMode]}
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.open();
                setShop(true);
              }}
              className={`${panel} flex h-9 items-center gap-1.5 px-3 text-sm font-medium`}
              aria-label="Trocar a roupa do boneco"
            >
              <Shirt className="h-4 w-4 text-pink-300" aria-hidden="true" />
              {!narrow && 'Roupas'}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMusicMenu((open) => !open)}
                className={`${panel} grid h-9 w-9 place-items-center`}
                aria-label="Música de fundo"
                aria-expanded={musicMenu}
              >
                <Music
                  className={`h-4 w-4 ${track ? 'text-emerald-300' : 'text-white/60'}`}
                  aria-hidden="true"
                />
              </button>
              {musicMenu && (
                <div
                  className={`${panel} absolute left-0 top-11 z-10 w-56 animate-[world-pop_0.2s_ease-out] p-2 text-sm`}
                >
                  <p className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                    Música de fundo
                  </p>
                  {[{ id: null, name: 'Sem música', emoji: '🔇' }, ...TRACKS].map((option) => (
                    <button
                      key={option.id ?? 'off'}
                      type="button"
                      onClick={() => setTrack(option.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/10 ${
                        track === option.id ? 'bg-violet-500/30 font-semibold' : ''
                      }`}
                    >
                      <span aria-hidden="true">{option.emoji}</span>
                      {option.name}
                    </button>
                  ))}
                  <label className="mt-1 flex cursor-pointer items-center gap-2 border-t border-white/10 px-2 pt-2">
                    <input
                      type="checkbox"
                      checked={ambience}
                      onChange={(event) => setAmbience(event.target.checked)}
                      className="h-4 w-4 accent-violet-500"
                    />
                    🐓 Sons da fazenda
                  </label>
                  {muted && (
                    <p className="px-2 pt-1.5 text-[11px] text-white/55">O som está desligado no 🔈.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
            <div className={`${panel} flex items-center gap-3 px-3 py-2 text-sm font-semibold tabular-nums`}>
              <span title="Pontos visitados">
                <span className="text-violet-300">★</span> {progress.visited.length}/{points}
              </span>
              <span title="Ovos de ouro">
                <span className="text-amber-300">●</span> {progress.collected.length}/{EGGS.length}
              </span>
              {fish > 0 && <span title="Peixes no balde (dá pra dar pros bichos)">🐟 {fish}</span>}
            </div>
            <Minimap
              world={world}
              visited={visited}
              size={compact ? 96 : 140}
              guide={guide}
              onOpen={() => {
                sfx.open();
                setMapOpen(true);
              }}
            />
            {world && !modal && <CameraControls world={world} firstPerson={firstPerson} />}
          </div>

          {world && <LiveHud world={world} touch={touch} onClearGuide={() => chooseGuide(null)} />}

          {/* avisos */}
          <div className="pointer-events-none absolute left-1/2 top-16 flex -translate-x-1/2 flex-col items-center gap-2 sm:top-5">
            {toasts.map((toast) => (
              <p
                key={toast.id}
                className={`${panel} animate-[world-pop_0.35s_ease-out] max-w-[92vw] px-4 py-2 text-center text-sm font-semibold ${
                  toast.tone === 'win'
                    ? 'text-emerald-300'
                    : toast.tone === 'egg'
                      ? 'text-amber-300'
                      : 'text-violet-200'
                }`}
              >
                {toast.text}
              </p>
            ))}
          </div>

          {/* marco da carreira: aparece sozinho quando chega perto */}
          {milestoneNear && !card && (
            <div
              className={`${panel} absolute left-1/2 w-[min(92vw,30rem)] -translate-x-1/2 animate-[world-pop_0.3s_ease-out] p-4 ${
                touch ? 'bottom-48' : 'bottom-8'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                {milestoneNear.subtitle}
              </p>
              <p className="mt-1.5 text-base font-semibold">{milestoneNear.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/80">{milestoneNear.text}</p>
            </div>
          )}

          {/* chamada pra interagir ou montar */}
          {(promptText || secondPrompt) && !card && !shop && !milestoneNear && (
            <div
              className={`absolute left-1/2 flex -translate-x-1/2 animate-[world-pop_0.3s_ease-out] flex-col items-center gap-2 sm:flex-row ${
                touch ? 'bottom-48' : 'bottom-8'
              }`}
            >
              {promptText && (
                <button
                  type="button"
                  onClick={primary}
                  className={`${panel} flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold`}
                >
                  {!touch && (
                    <kbd className="rounded-md bg-amber-300 px-1.5 py-0.5 font-mono text-xs font-bold text-[#140c26]">
                      {promptKey}
                    </kbd>
                  )}
                  {promptText}
                </button>
              )}
              {secondPrompt && (
                <button
                  type="button"
                  onClick={secondPrompt.run}
                  className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-amber-200/50 bg-violet-600/90 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-black/30 backdrop-blur-md"
                >
                  {!touch && (
                    <kbd className="rounded-md bg-amber-300 px-1.5 py-0.5 font-mono text-xs font-bold text-[#140c26]">
                      {secondPrompt.key}
                    </kbd>
                  )}
                  {secondPrompt.icon} {secondPrompt.label}
                </button>
              )}
            </div>
          )}

          {!touch && !card && !promptText && !secondPrompt && !milestoneNear && (
            <p className="absolute bottom-4 left-4 text-xs leading-relaxed text-white/80 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
              WASD anda · Shift corre · Espaço pula · E abre · F monta · G pesca
              <br />
              Arraste ou X/C sobe e desce a câmera · roda do mouse aproxima · V visão dos olhos · M mapa · P portfólio
            </p>
          )}

          {/* controles de toque */}
          {touch && !card && !shop && (
            <>
              <div className="absolute bottom-7 left-5">
                <Joystick onMove={(x, z) => world?.setJoystick(x, z)} />
              </div>
              <div className="absolute bottom-8 right-5 flex items-end gap-3">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onPointerDown={() => world?.action()}
                    className="h-14 w-14 rounded-full border-2 border-white/60 bg-sky-500/85 text-lg font-bold shadow-lg active:scale-95"
                    aria-label={bLabel}
                  >
                    B
                  </button>
                  <span className="text-[11px] font-medium text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                    {bLabel}
                  </span>
                </div>
                <div className="mb-7 flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={primary}
                    disabled={!promptText}
                    className="h-[4.25rem] w-[4.25rem] rounded-full border-2 border-white/60 bg-violet-500/90 text-xl font-bold shadow-lg transition-opacity active:scale-95 disabled:opacity-40"
                    aria-label={promptText ?? 'Interagir'}
                  >
                    A
                  </button>
                  <span className="max-w-[6.5rem] text-center text-[11px] font-medium leading-tight text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                    {interactive ? 'Abrir' : (rideText ?? 'Interagir')}
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {mapOpen && world && (
        <BigMap
          world={world}
          visited={visited}
          guide={guide}
          onGuide={(place) => {
            chooseGuide({ x: place.x, z: place.z, label: place.label });
            setMapOpen(false);
            pushToast(`Siga a seta amarela até ${place.label}`, 'visit');
          }}
          onTravel={(place) => travel(place.x, place.z)}
          onClose={() => setMapOpen(false)}
        />
      )}

      {portfolio && (
        <PortfolioPanel
          visited={visited}
          onOpen={(station) => {
            setPortfolio(false);
            openCard(station);
          }}
          onTravel={(station) => travel(station.x, station.z)}
          onRide={(station) => {
            setPortfolio(false);
            window.setTimeout(() => world?.ride(station.id), 0);
          }}
          onCv={downloadCv}
          onClose={() => setPortfolio(false)}
        />
      )}

      {welcome && (
        <WelcomeCard
          onProjects={() => {
            setWelcome(false);
            setPortfolio(true);
          }}
          onClose={() => setWelcome(false)}
        />
      )}

      {shop && (
        <OutfitShop
          current={outfitId}
          owned={owned}
          onWear={wear}
          onUnlock={unlock}
          onClose={() => {
            sfx.close();
            setShop(false);
          }}
        />
      )}

      {/* janela da estação */}
      {card && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 p-3" onClick={closeCard}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="estacao-titulo"
            className="max-h-[88vh] w-[min(94vw,34rem)] animate-[world-pop_0.3s_ease-out] overflow-y-auto rounded-2xl border border-violet-300/30 bg-[#140c26]/95 shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
              <p className="truncate text-xs font-semibold uppercase tracking-wider text-amber-300">
                {card.subtitle}
              </p>
              <button
                type="button"
                onClick={closeCard}
                className="shrink-0 rounded-full px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            {card.image && (
              <img
                src={card.image}
                alt={`Captura de tela do projeto ${card.title}`}
                className="aspect-[16/10] w-full border-b border-white/10 object-cover object-top"
              />
            )}
            <div className="p-5">
              <h2 id="estacao-titulo" className="text-xl font-semibold leading-snug">
                {card.title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">{card.text}</p>
              {card.tags && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-xs text-white/80"
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
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                        index === 0
                          ? 'bg-violet-500 text-white hover:bg-violet-400'
                          : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {action.label}
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
