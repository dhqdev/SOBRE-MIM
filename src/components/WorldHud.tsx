import { useEffect, useRef, useState } from "react";
import type { GuideTarget, HudState, WorldHandle } from "@/world/engine";
import {
  drawMapBase,
  drawPlaceLabel,
  PLACES,
  type Place,
} from "@/world/mapdraw";
import { STATIONS, type Station } from "@/world/stations";
import { WORLD_RADIUS } from "@/world/terrain";
import { formatTime, panel } from "@/world/ui";

/** Botão que age enquanto está apertado (acelerador, câmera). */
const HoldButton = ({
  onHold,
  label,
  children,
  className = "",
}: {
  onHold: (on: boolean) => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onPointerDown={(event) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      onHold(true);
    }}
    onPointerUp={() => onHold(false)}
    onPointerCancel={() => onHold(false)}
    onLostPointerCapture={() => onHold(false)}
    onContextMenu={(event) => event.preventDefault()}
    className={`grid touch-none select-none place-items-center rounded-xl border border-white/25 bg-white/10 font-bold active:scale-95 active:bg-violet-500/60 ${className}`}
  >
    {children}
  </button>
);

/* ------------------------------------------------------------ HUD ao vivo */

/**
 * Painel de voo, desafio e bússola de guia. Fica num componente separado
 * porque atualiza umas 8 vezes por segundo.
 */
export const LiveHud = ({
  world,
  touch,
  onClearGuide,
}: {
  world: WorldHandle;
  touch: boolean;
  onClearGuide: () => void;
}) => {
  const [hud, setHud] = useState<HudState>({
    flight: null,
    challenge: null,
    guide: null,
  });
  useEffect(() => {
    const timer = window.setInterval(() => setHud(world.hud()), 120);
    return () => window.clearInterval(timer);
  }, [world]);
  const { flight, challenge, guide } = hud;

  return (
    <>
      {(challenge || guide) && (
        <div className="pointer-events-none absolute left-1/2 top-[7.5rem] flex -translate-x-1/2 flex-col items-center gap-2 sm:top-16">
          {challenge && (
            <div
              className={`${panel} flex items-center gap-3 whitespace-nowrap px-4 py-2 text-sm font-semibold tabular-nums`}
              style={{ borderColor: challenge.color }}
            >
              <span>
                {challenge.emoji} {challenge.name}
              </span>
              <span style={{ color: challenge.color }}>
                Argola {challenge.ring}/{challenge.total}
              </span>
              <span className="text-white/90">
                ⏱ {formatTime(challenge.time)}
              </span>
            </div>
          )}
          {guide && (
            <div
              className={`${panel} pointer-events-auto flex items-center gap-2.5 py-1.5 pl-2 pr-1.5 text-sm font-semibold`}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-amber-300 text-lg text-[#140c26]"
                style={{ transform: `rotate(${guide.bearing}rad)` }}
                aria-hidden="true"
              >
                ↑
              </span>
              <span className="whitespace-nowrap">
                {guide.label} ·{" "}
                <span className="tabular-nums text-amber-300">
                  {guide.distance} m
                </span>
              </span>
              {!challenge && (
                <button
                  type="button"
                  onClick={onClearGuide}
                  className="rounded-full px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Parar de mostrar o caminho"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {flight && (
        <div
          className={`${panel} absolute flex items-center gap-3 px-3 py-2.5 ${
            touch ? "bottom-[11.5rem] right-3" : "bottom-6 right-4"
          }`}
        >
          <div className="text-xs leading-tight">
            <p className="font-semibold">
              {flight.emoji} {flight.name}
            </p>
            <p className="mt-1 tabular-nums text-white/85">
              <span className="text-lg font-bold text-white">
                {Math.round(Math.max(0, flight.speed) * 3.6)}
              </span>{" "}
              km/h
            </p>
            <p className="tabular-nums text-white/75">
              {flight.grounded
                ? flight.speed < flight.takeoff
                  ? `Decola com ${Math.round(flight.takeoff * 3.6)} km/h`
                  : "Puxe W pra subir!"
                : `Altura ${Math.round(flight.alt)} m`}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <HoldButton
              label="Acelerar (Shift)"
              onHold={(on) => world.setThrottle(on ? 1 : 0)}
              className="h-8 w-9 text-base"
            >
              +
            </HoldButton>
            <div
              className="relative h-14 w-3 overflow-hidden rounded-full bg-white/15"
              title="Acelerador"
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-emerald-400 via-amber-300 to-rose-400"
                style={{ height: `${Math.round(flight.power * 100)}%` }}
              />
            </div>
            <HoldButton
              label="Desacelerar (Z)"
              onHold={(on) => world.setThrottle(on ? -1 : 0)}
              className="h-8 w-9 text-base"
            >
              −
            </HoldButton>
          </div>
        </div>
      )}
    </>
  );
};

/* -------------------------------------------------------- botões de câmera */

export const CameraControls = ({
  world,
  firstPerson,
}: {
  world: WorldHandle;
  firstPerson: boolean;
}) => (
  <div className={`${panel} flex flex-col items-center gap-1.5 p-1.5`}>
    <button
      type="button"
      onClick={() => world.toggleView()}
      className={`grid h-9 w-9 place-items-center rounded-xl text-lg ${firstPerson ? "bg-violet-500" : "bg-white/10"}`}
      aria-label={
        firstPerson
          ? "Voltar pra visão de fora (V)"
          : "Ver pelos olhos do personagem (V)"
      }
      title={firstPerson ? "Visão de fora (V)" : "Visão dos olhos (V)"}
    >
      {firstPerson ? "🎥" : "👀"}
    </button>
    <HoldButton
      label={firstPerson ? "Olhar pra cima (X)" : "Subir a câmera (X)"}
      onHold={(on) => world.setCamera(0, on ? 1 : 0)}
      className="h-8 w-9 text-sm"
    >
      ▲
    </HoldButton>
    <HoldButton
      label={firstPerson ? "Olhar pra baixo (C)" : "Descer a câmera (C)"}
      onHold={(on) => world.setCamera(0, on ? -1 : 0)}
      className="h-8 w-9 text-sm"
    >
      ▼
    </HoldButton>
    {!firstPerson && (
      <>
        <button
          type="button"
          onClick={() => world.zoom(0.8)}
          className="grid h-8 w-9 place-items-center rounded-xl bg-white/10 text-sm font-bold"
          aria-label="Aproximar a câmera (+)"
          title="Aproximar (+ ou roda do mouse)"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => world.zoom(1.25)}
          className="grid h-8 w-9 place-items-center rounded-xl bg-white/10 text-sm font-bold"
          aria-label="Afastar a câmera (-)"
          title="Afastar (- ou roda do mouse)"
        >
          −
        </button>
      </>
    )}
  </div>
);

/* ------------------------------------------------------------- minimapa */

export const Minimap = ({
  world,
  visited,
  size,
  guide,
  onOpen,
}: {
  world: WorldHandle | null;
  visited: Set<string>;
  size: number;
  guide: GuideTarget | null;
  onOpen: () => void;
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !world) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const scale = size / 2 / (WORLD_RADIUS + 4);
    // fora do sítio (aeroporto, voando) o mapa acompanha a pessoa
    const center = { x: 0, z: 0 };
    const toMap = (x: number, z: number) =>
      [
        size / 2 + (x - center.x) * scale,
        size / 2 + (z - center.z) * scale,
      ] as const;
    const draw = () => {
      const me = world.player();
      const away = Math.hypot(me.x, me.z) > WORLD_RADIUS + 2;
      center.x += ((away ? me.x : 0) - center.x) * 0.35;
      center.z += ((away ? me.z : 0) - center.z) * 0.35;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      drawMapBase(ctx, toMap, scale, size, size, visited);
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const plane = world.locate("aviao");
      if (plane) ctx.fillText("✈️", ...toMap(plane.x, plane.z));
      if (guide) {
        const [gx, gy] = toMap(guide.x, guide.z);
        ctx.fillStyle = "#ffd166";
        ctx.strokeStyle = "#140c26";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(gx, gy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      drawPlayer(ctx, ...toMap(me.x, me.z), me.angle, 1);
      ctx.restore();
    };
    draw();
    const timer = window.setInterval(draw, 120);
    return () => window.clearInterval(timer);
  }, [world, visited, size, guide]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-full"
      aria-label="Abrir o mapa do sítio (M)"
      title="Abrir o mapa (M)"
    >
      <canvas
        ref={ref}
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-violet-300/60 shadow-lg shadow-black/30"
      />
    </button>
  );
};

const drawPlayer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  k: number,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-angle + Math.PI);
  ctx.scale(k, k);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#140c26";
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

/* ---------------------------------------------------------- mapa grande */

const VIEW = { x0: -205, x1: 205, z0: -215, z1: 160 };

export const BigMap = ({
  world,
  visited,
  guide,
  onGuide,
  onTravel,
  onClose,
}: {
  world: WorldHandle;
  visited: Set<string>;
  guide: GuideTarget | null;
  onGuide: (place: Place) => void;
  onTravel: (place: Place) => void;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const places = useRef<Place[]>([]);

  useEffect(() => {
    const canvas = ref.current;
    const box = wrap.current;
    if (!canvas || !box) return;
    const challenge = world
      .challengeStarts()
      .map(
        (c): Place => ({
          id: `desafio-${c.id}`,
          label: `Desafio: ${c.name}`,
          short: c.name,
          emoji: "🏁",
          x: c.x,
          z: c.z,
          kind: "brinquedo",
        }),
      );
    places.current = [...PLACES, ...challenge];
    const draw = () => {
      const width = box.clientWidth;
      const scale = width / (VIEW.x1 - VIEW.x0);
      const height = (VIEW.z1 - VIEW.z0) * scale;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(width * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.height = `${height}px`;
      }
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const toMap = (x: number, z: number) =>
        [(x - VIEW.x0) * scale, (z - VIEW.z0) * scale] as const;
      drawMapBase(ctx, toMap, scale, width, height, visited);
      const size = Math.max(10, Math.min(13, width / 60));
      places.current.forEach((place) => {
        const [px, py] = toMap(place.x, place.z);
        drawPlaceLabel(
          ctx,
          px,
          py,
          width < 520
            ? place.emoji
            : width < 820
              ? `${place.emoji} ${place.short}`
              : `${place.emoji} ${place.label}`,
          {
            size,
            highlight: place.kind === "portfolio" || place.id === selected?.id,
            accent:
              place.id === selected?.id ||
              (guide && guide.label === place.label)
                ? "#ffd166"
                : undefined,
          },
        );
      });
      const me = world.player();
      drawPlayer(ctx, ...toMap(me.x, me.z), me.angle, 1.6);
    };
    draw();
    const timer = window.setInterval(draw, 250);
    return () => window.clearInterval(timer);
  }, [world, visited, selected, guide]);

  const pick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = rect.width / (VIEW.x1 - VIEW.x0);
    const x = (event.clientX - rect.left) / scale + VIEW.x0;
    const z = (event.clientY - rect.top) / scale + VIEW.z0;
    let best: Place | null = null;
    let bestD = 22 / scale;
    for (const place of places.current) {
      const d = Math.hypot(place.x - x, place.z - z);
      if (d < bestD) {
        best = place;
        bestD = d;
      }
    }
    setSelected(best);
  };

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center bg-black/60 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mapa do sítio"
        className="flex max-h-[96vh] w-[min(98vw,64rem)] animate-[world-pop_0.25s_ease-out] flex-col overflow-hidden rounded-2xl border border-violet-300/30 bg-[#140c26]/95 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
          <p className="text-sm font-semibold">
            🗺️ Mapa do sítio{" "}
            <span className="font-normal text-white/60">· toque num lugar</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Fechar o mapa"
          >
            ✕
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div ref={wrap} className="min-h-0 overflow-y-auto md:flex-1">
            <canvas
              ref={ref}
              onClick={pick}
              className="block w-full cursor-pointer"
            />
          </div>
          <div className="flex max-h-[34vh] flex-col border-t border-white/10 md:max-h-none md:w-64 md:border-l md:border-t-0">
            {selected ? (
              <div className="border-b border-white/10 bg-violet-500/15 p-3">
                <p className="text-sm font-semibold">
                  {selected.emoji} {selected.label}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onGuide(selected)}
                    className="flex-1 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-bold text-[#140c26]"
                  >
                    Mostrar caminho
                  </button>
                  <button
                    type="button"
                    onClick={() => onTravel(selected)}
                    className="flex-1 rounded-full bg-violet-500 px-3 py-1.5 text-xs font-bold"
                  >
                    Ir agora
                  </button>
                </div>
              </div>
            ) : (
              <p className="border-b border-white/10 p-3 text-xs text-white/65">
                Escolha um lugar: a seta amarela mostra o caminho, ou vá direto.
              </p>
            )}
            <ul className="min-h-0 flex-1 overflow-y-auto p-1.5 text-sm">
              {[
                ...PLACES,
                ...places.current.filter((p) => p.id.startsWith("desafio-")),
              ].map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(place)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/10 ${
                      selected?.id === place.id
                        ? "bg-violet-500/30 font-semibold"
                        : ""
                    }`}
                  >
                    <span aria-hidden="true">{place.emoji}</span>
                    <span className="flex-1">{place.label}</span>
                    {place.kind === "portfolio" && (
                      <span className="rounded-full bg-violet-500/40 px-1.5 text-[10px] font-semibold uppercase">
                        portfólio
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------- painel do portfólio */

const PROJECTS = STATIONS.filter((s) => s.kind === "project");
const station = (id: string) => STATIONS.find((s) => s.id === id)!;

export const PortfolioPanel = ({
  visited,
  onOpen,
  onTravel,
  onRide,
  onCv,
  onClose,
}: {
  visited: Set<string>;
  onOpen: (station: Station) => void;
  onTravel: (station: Station) => void;
  onRide: (station: Station) => void;
  onCv: () => void;
  onClose: () => void;
}) => (
  <div
    className="absolute inset-0 z-30 grid place-items-center bg-black/60 p-3"
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-titulo"
      className="max-h-[92vh] w-[min(96vw,46rem)] animate-[world-pop_0.25s_ease-out] overflow-y-auto rounded-2xl border border-violet-300/30 bg-[#140c26]/95 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#140c26]/95 px-5 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            Portfólio
          </p>
          <h2
            id="portfolio-titulo"
            className="text-lg font-semibold leading-tight"
          >
            David Fernandes · Desenvolvedor Full-Stack
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-white/80">
          {station("sobre").text}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpen(station("sobre"))}
            className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold hover:bg-violet-400"
          >
            🏡 Sobre mim
          </button>
          <button
            type="button"
            onClick={onCv}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            📄 Baixar currículo
          </button>
          <button
            type="button"
            onClick={() => onOpen(station("contato"))}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            📬 Contato
          </button>
          <button
            type="button"
            onClick={() => onOpen(station("stack"))}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            🧰 Tecnologias
          </button>
          <button
            type="button"
            onClick={() => onTravel(station("marco-0"))}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            🧭 Trilha da carreira
          </button>
        </div>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-amber-300">
          Projetos · cada um é um brinquedo do parque
        </h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <li
              key={project.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
            >
              <button
                type="button"
                onClick={() => onOpen(project)}
                className="block w-full text-left"
              >
                {project.image && (
                  <img
                    src={project.image}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/8] w-full border-b border-white/10 object-cover object-top"
                  />
                )}
                <div className="px-3 pt-2.5">
                  <p className="flex items-center gap-1.5 font-semibold">
                    {project.title}
                    {visited.has(project.id) && (
                      <span
                        className="text-xs text-amber-300"
                        title="Você já visitou"
                      >
                        ★
                      </span>
                    )}
                  </p>
                  <p className="line-clamp-2 text-xs text-white/65">
                    {project.subtitle}
                  </p>
                </div>
              </button>
              <div className="flex flex-wrap gap-1.5 p-3">
                <button
                  type="button"
                  onClick={() => onOpen(project)}
                  className="rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold hover:bg-violet-400"
                >
                  Ver projeto
                </button>
                <button
                  type="button"
                  onClick={() => onTravel(project)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/10"
                >
                  Ir até lá
                </button>
                {project.ride && (
                  <button
                    type="button"
                    onClick={() => onRide(project)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/10"
                  >
                    🎢 {project.ride.name}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------ boas-vindas */

export const WelcomeCard = ({
  onProjects,
  onClose,
}: {
  onProjects: () => void;
  onClose: () => void;
}) => (
  <div
    className="absolute inset-0 z-30 grid place-items-center bg-black/55 p-3"
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="boas-vindas"
      className="w-[min(94vw,30rem)] animate-[world-pop_0.3s_ease-out] rounded-2xl border border-violet-300/30 bg-[#140c26]/95 p-5 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
        Portfólio interativo
      </p>
      <h2 id="boas-vindas" className="mt-1 text-xl font-semibold leading-snug">
        Oi! Eu sou o David Fernandes 👋
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/80">
        Sou desenvolvedor full-stack e este sítio é o meu portfólio. Tudo aqui
        conta alguma coisa sobre o meu trabalho:
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {[
          ["🎡", "Cada brinquedo do parque é um projeto meu"],
          ["🏡", "A casa conta quem eu sou"],
          ["🧭", "A trilha mostra minha carreira, passo a passo"],
          ["📬", "O correio tem meus contatos e o celeiro, meu currículo"],
          ["✈️", "E no aeroporto tem aviões e desafios de voo"],
        ].map(([icon, text]) => (
          <li key={text} className="flex gap-2">
            <span aria-hidden="true">{icon}</span>
            {text}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-white/60">
        Pontos roxos no mapa e placas roxas levam pro portfólio. O botão
        “Portfólio” lá em cima lista tudo.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onProjects}
          className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold hover:bg-violet-400"
        >
          Ver meus projetos
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Explorar o sítio
        </button>
      </div>
    </div>
  </div>
);
