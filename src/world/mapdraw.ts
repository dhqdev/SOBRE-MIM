import { APRON, CARGO_PAD } from "./airport";
import {
  PENS,
  RIDES,
  ROADS,
  STATIONS,
  TRAIL,
  GATE,
  YARD,
  PARK,
} from "./stations";
import {
  AIRPORT,
  CHANNEL,
  CHANNEL_HALF,
  HIDDEN,
  LAKE,
  POND,
  POOLS,
  RUNWAY,
  S,
  STREAM_HALF,
  STREAM_PATH,
  WORLD_RADIUS,
} from "./terrain";

/** Lugares com nome no mapa (e pra onde a seta de guia pode levar). */
export interface Place {
  id: string;
  label: string;
  /** Nome curtinho (pras placas, onde não cabe muito). */
  short: string;
  emoji: string;
  x: number;
  z: number;
  /** Lugares de portfólio aparecem com destaque. */
  kind: "portfolio" | "lugar" | "brinquedo";
  /** Estação que abre o cartão quando chega lá. */
  station?: string;
}

const at = (id: string) => STATIONS.find((s) => s.id === id)!;

export const PLACES: Place[] = [
  {
    id: "entrada",
    label: "Entrada",
    short: "Entrada",
    emoji: "🚪",
    x: GATE.x,
    z: GATE.z + 6,
    kind: "lugar",
    station: "inicio",
  },
  {
    id: "sobre",
    label: "Sobre mim (Casa)",
    short: "Sobre mim",
    emoji: "🏡",
    x: at("sobre").x,
    z: at("sobre").z,
    kind: "portfolio",
    station: "sobre",
  },
  {
    id: "projetos",
    label: "Projetos (Parque)",
    short: "Projetos",
    emoji: "🎡",
    x: PARK.x,
    z: PARK.z,
    kind: "portfolio",
  },
  {
    id: "carreira",
    label: "Trilha da carreira",
    short: "Carreira",
    emoji: "🧭",
    x: TRAIL[0][0],
    z: TRAIL[0][1],
    kind: "portfolio",
    station: "marco-0",
  },
  {
    id: "stack",
    label: "Tecnologias (Silo)",
    short: "Tecnologias",
    emoji: "🧰",
    x: at("stack").x,
    z: at("stack").z,
    kind: "portfolio",
    station: "stack",
  },
  {
    id: "curriculo",
    label: "Currículo (Celeiro)",
    short: "Currículo",
    emoji: "📄",
    x: at("curriculo").x,
    z: at("curriculo").z,
    kind: "portfolio",
    station: "curriculo",
  },
  {
    id: "contato",
    label: "Contato (Correio)",
    short: "Contato",
    emoji: "📬",
    x: at("contato").x,
    z: at("contato").z,
    kind: "portfolio",
    station: "contato",
  },
  {
    id: "github",
    label: "GitHub (Ipê)",
    short: "GitHub",
    emoji: "🌳",
    x: at("github").x,
    z: at("github").z,
    kind: "portfolio",
    station: "github",
  },
  {
    id: "redes",
    label: "Redes (Mirante)",
    short: "Mirante",
    emoji: "🌄",
    x: at("redes").x,
    z: at("redes").z,
    kind: "portfolio",
    station: "redes",
  },
  {
    id: "terreiro",
    label: "Terreiro",
    short: "Terreiro",
    emoji: "⛲",
    x: YARD.x,
    z: YARD.z,
    kind: "lugar",
  },
  {
    id: "cafe",
    label: "Cafezinho",
    short: "Café",
    emoji: "☕",
    x: at("cafe").x,
    z: at("cafe").z,
    kind: "lugar",
    station: "cafe",
  },
  {
    id: "lago",
    label: "Lago e barco",
    short: "Lago",
    emoji: "🚣",
    x: LAKE.x - 14,
    z: LAKE.z - 12,
    kind: "brinquedo",
  },
  {
    id: "lagoa",
    label: "Lagoa Escondida",
    short: "Lagoa",
    emoji: "🏝️",
    x: HIDDEN.x,
    z: HIDDEN.z,
    kind: "lugar",
  },
  {
    id: "cavalos",
    label: "Cavalos",
    short: "Cavalos",
    emoji: "🐴",
    x: PENS.horses.x,
    z: PENS.horses.z + 9,
    kind: "brinquedo",
  },
  {
    id: "bichos",
    label: "Porcos e ovelhas",
    short: "Bichos",
    emoji: "🐑",
    x: PENS.sheep.x + 12,
    z: PENS.sheep.z + 9,
    kind: "brinquedo",
  },
  {
    id: "bugue",
    label: "Bugue",
    short: "Bugue",
    emoji: "🚙",
    x: S(8),
    z: S(39),
    kind: "brinquedo",
  },
  {
    id: "aeroporto",
    label: "Aeroporto e aviões",
    short: "Aeroporto",
    emoji: "✈️",
    x: 40,
    z: -138,
    kind: "brinquedo",
  },
];

export type ToMap = (x: number, z: number) => readonly [number, number];

const line = (
  ctx: CanvasRenderingContext2D,
  toMap: ToMap,
  points: [number, number][],
) => {
  ctx.beginPath();
  points.forEach(([x, z], i) =>
    i ? ctx.lineTo(...toMap(x, z)) : ctx.moveTo(...toMap(x, z)),
  );
  ctx.stroke();
};

/**
 * Desenha o sítio visto de cima (grama, serra, aeroporto, estradas, água,
 * currais, brinquedos e as estações). `scale` = pixels por metro.
 */
export const drawMapBase = (
  ctx: CanvasRenderingContext2D,
  toMap: ToMap,
  scale: number,
  width: number,
  height: number,
  visited?: Set<string>,
) => {
  ctx.fillStyle = "#6f8a4a";
  ctx.fillRect(0, 0, width, height);
  // serra em volta (anéis cada vez mais escuros)
  [
    [S(138), "#7c8a52"],
    [S(112), "#6f9a48"],
    [WORLD_RADIUS + 8, "#58a548"],
    [WORLD_RADIUS * 0.9, "#5fae4c"],
  ].forEach(([r, color]) => {
    ctx.fillStyle = color as string;
    ctx.beginPath();
    ctx.arc(...toMap(0, 0), (r as number) * scale, 0, Math.PI * 2);
    ctx.fill();
  });
  // aeroporto: o vale, o pátio e a pista
  const rect = (
    r: { x: number; z: number; w: number; d: number },
    color: string,
  ) => {
    ctx.fillStyle = color;
    const [x, y] = toMap(r.x - r.w / 2, r.z - r.d / 2);
    ctx.fillRect(x, y, r.w * scale, r.d * scale);
  };
  rect(AIRPORT, "#5fae4c");
  rect(APRON, "#b9b7ae");
  rect(CARGO_PAD, "#b9b7ae");
  rect(
    { x: RUNWAY.x, z: RUNWAY.z, w: RUNWAY.length, d: RUNWAY.width },
    "#3d3f46",
  );
  if (scale > 0.9) {
    ctx.strokeStyle = "#f4f1e8";
    ctx.setLineDash([6 * scale, 6 * scale]);
    ctx.lineWidth = Math.max(1, 0.5 * scale);
    line(ctx, toMap, [
      [RUNWAY.x - RUNWAY.length / 2 + 8, RUNWAY.z],
      [RUNWAY.x + RUNWAY.length / 2 - 8, RUNWAY.z],
    ]);
    ctx.setLineDash([]);
  }
  // estradas
  ctx.strokeStyle = "#d6b27a";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ROADS.forEach((road) => {
    ctx.lineWidth = Math.max(1.2, road.width * scale);
    line(ctx, toMap, road.points);
  });
  // trilha da carreira
  ctx.strokeStyle = "rgba(214,178,122,0.8)";
  ctx.lineWidth = Math.max(1, 1.6 * scale);
  line(ctx, toMap, TRAIL);
  // riacho, lago e poço
  ctx.strokeStyle = "#4cb3d9";
  ctx.lineWidth = Math.max(2, STREAM_HALF * 2 * scale);
  line(ctx, toMap, STREAM_PATH);
  ctx.fillStyle = "#4cb3d9";
  for (const pool of [...POOLS, POND]) {
    ctx.beginPath();
    ctx.arc(...toMap(pool.x, pool.z), pool.r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = Math.max(2, CHANNEL_HALF * 2 * scale);
  line(ctx, toMap, CHANNEL);
  // currais
  ctx.strokeStyle = "rgba(122,74,42,0.9)";
  ctx.lineWidth = 1;
  Object.values(PENS).forEach((p) => {
    const [x, y] = toMap(p.x - p.w / 2, p.z - p.d / 2);
    ctx.strokeRect(x, y, p.w * scale, p.d * scale);
  });
  // brinquedos do parque (a montanha-russa é o anel grande)
  RIDES.forEach((ride) => {
    ctx.beginPath();
    if (ride.type === "coaster") {
      ctx.strokeStyle = "rgba(244,240,255,0.9)";
      ctx.lineWidth = 1.5;
      ctx.ellipse(
        ...toMap(ride.bx, ride.bz),
        11 * scale,
        8 * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(216,192,138,0.95)";
      ctx.arc(...toMap(ride.bx, ride.bz), ride.plaza * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const dot = Math.max(1, scale * 0.9);
  STATIONS.forEach((station) => {
    const [x, y] = toMap(station.x, station.z);
    const done = visited?.has(station.id);
    ctx.fillStyle = done
      ? "#ffd166"
      : station.kind === "milestone"
        ? "#5ec8f2"
        : "#a78bfa";
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      (station.kind === "milestone" ? 1.8 : 2.8) * dot,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
  });
};

/** Etiqueta com emoji e nome (no mapa grande e nas placas de mapa). */
export const drawPlaceLabel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  options: { size?: number; accent?: string; highlight?: boolean } = {},
) => {
  const size = options.size ?? 13;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width + size * 1.1;
  const h = size * 1.7;
  ctx.fillStyle = options.highlight
    ? "rgba(124,58,237,0.92)"
    : "rgba(20,12,38,0.82)";
  ctx.strokeStyle = options.accent ?? "rgba(196,181,253,0.7)";
  ctx.lineWidth = Math.max(1, size / 10);
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + size * 0.05);
};
