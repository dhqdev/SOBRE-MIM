import * as THREE from 'three';

/**
 * O relevo do sítio. Tudo que anda (gente, bicho, bugue) pergunta a altura do
 * chão aqui, então o terreno, o riacho e as pontes moram no mesmo lugar.
 */

export const WATER_Y = -0.7;
/**
 * O sítio foi desenhado numa escala menor e depois espalhado: tudo que é
 * posição passa por `S` (os tamanhos das coisas continuam os mesmos), então
 * sobra mais espaço entre uma área e outra.
 */
export const K = 1.4;
export const S = (v: number) => v * K;
export const STREAM_HALF = 3.3;
export const WORLD_RADIUS = S(88);

/** O riacho desce da cachoeira (oeste) e deságua no lago (leste). */
const STREAM_POINTS: [number, number][] = (
  [
    [-68, -16],
    [-58, -9],
    [-46, 0],
    [-33, 8],
    [-20, 13],
    [-8, 18],
    [4, 19.5],
    [16, 17],
    [28, 21],
    [40, 26],
    [50, 29],
    [57, 32.5],
  ] as [number, number][]
).map(([x, z]) => [S(x), S(z)]);

export const POND = { x: S(-70), z: S(-17), r: 8.5 };
/** O lago grande no fim do riacho, com uma ilhinha no meio, e o braço sul dele. */
export const LAKE = { x: 85, z: 47, r: 21 };
export const LAKE_SOUTH = { x: 66, z: 70, r: 11 };
export const ISLAND = { x: 89, z: 51, r: 4.2 };
/**
 * Lagoa Escondida: no meio dos morros, cercada de pedra. Só se chega de barco,
 * pelo canal que sai do lago grande.
 */
export const HIDDEN = { x: 110, z: 20, r: 8.5 };
export const HIDDEN_ISLAND = { x: 112.4, z: 17.6, r: 2.4 };
export const CHANNEL: [number, number][] = [
  [98, 34],
  [102.5, 31],
  [105.5, 27],
  [107.5, 24],
];
export const CHANNEL_HALF = 2.5;
/** Águas paradas (lagos e canal), sem o riacho: pra água, peixes e plantas. */
export const POOLS = [LAKE, LAKE_SOUTH, HIDDEN];

const curve = new THREE.CatmullRomCurve3(STREAM_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)));
/** Pontos bem juntinhos do riacho (pra medir distância e montar a água). */
export const STREAM_PATH: [number, number][] = curve.getSpacedPoints(260).map((p) => [p.x, p.z]);

export interface Bridge {
  x: number;
  z: number;
  /** Direção do tabuleiro (radianos, 0 = ao longo de +z). */
  angle: number;
  length: number;
  width: number;
  /** Deque reto (o do lago), sem o arco das pontes. */
  flat?: boolean;
}

/** Pontes: a da estrada principal, a da trilha leste e uma de tronco no oeste. */
export const BRIDGES: Bridge[] = [
  { x: S(0.8), z: S(19.3), angle: 0.08, length: 14, width: 4.6 },
  { x: S(39.6), z: S(25.8), angle: -0.35, length: 13, width: 2.6 },
  { x: S(-33.4), z: S(7.6), angle: 1.0, length: 13, width: 2.2 },
  // deque de pesca entrando no lago pela margem oeste
  { x: 65, z: 47.5, angle: Math.PI / 2, length: 9, width: 2.4, flat: true },
];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Distância até a água mais próxima (riacho, lago ou poço da cachoeira). */
export const waterDistance = (x: number, z: number) => {
  let best = Infinity;
  for (let i = 0; i < STREAM_PATH.length - 1; i++) {
    const [ax, az] = STREAM_PATH[i];
    const [bx, bz] = STREAM_PATH[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    const d = Math.hypot(x - ax - dx * k, z - az - dz * k) - STREAM_HALF;
    if (d < best) best = d;
  }
  best = Math.min(best, stillWater(x, z));
  best = Math.min(best, Math.hypot(x - POND.x, z - POND.z) - POND.r);
  return best;
};

/** Distância até os lagos e o canal (sem o riacho). Dentro das ilhas volta a ser terra. */
export const stillWater = (x: number, z: number) => {
  let best = Math.min(
    Math.hypot(x - LAKE.x, z - LAKE.z) - LAKE.r,
    Math.hypot(x - LAKE_SOUTH.x, z - LAKE_SOUTH.z) - LAKE_SOUTH.r,
    Math.hypot(x - HIDDEN.x, z - HIDDEN.z) - HIDDEN.r,
  );
  for (let i = 0; i < CHANNEL.length - 1; i++) {
    const [ax, az] = CHANNEL[i];
    const [bx, bz] = CHANNEL[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * k, z - az - dz * k) - CHANNEL_HALF);
  }
  for (const island of [ISLAND, HIDDEN_ISLAND])
    best = Math.max(best, island.r - Math.hypot(x - island.x, z - island.z));
  return best;
};

/** Está na Lagoa Escondida (ou no canal dela)? Lá os peixes são maiores. */
export const inHidden = (x: number, z: number) => Math.hypot(x - HIDDEN.x, z - HIDDEN.z) < HIDDEN.r + 6;

/** Colina da entrada (sul), morro da trilha (nordeste) e serra da cachoeira (oeste). */
const ENTRANCE = { x: 0, z: 68, top: 13 };
const LOOKOUT_HILL = { x: 56, z: -54, top: 10 };
const WEST_HILL = { x: -90, z: -18, top: 15 };

/** Relevo desenhado na escala antiga, esticado por K (morros mais largos). */
const baseHeight = (wx: number, wz: number) => {
  const x = wx / K;
  const z = wz / K;
  let h = 0.35 * Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.06) + 0.25 * Math.sin((x + z) * 0.11);
  // o terreiro em volta da casa é plano
  const yard = 1 - smoothstep(20, 36, Math.hypot(x - 4, z + 14));
  h *= 1 - yard * 0.85;
  const d = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  h += smoothstep(80, 128, d) * 26 * (0.75 + 0.25 * Math.sin(angle * 5 + 1));
  h += ENTRANCE.top * (1 - smoothstep(9, 32, Math.hypot(x - ENTRANCE.x, z - ENTRANCE.z)));
  h += LOOKOUT_HILL.top * (1 - smoothstep(4, 30, Math.hypot(x - LOOKOUT_HILL.x, z - LOOKOUT_HILL.z)));
  h += WEST_HILL.top * (1 - smoothstep(5, 21, Math.hypot(x - WEST_HILL.x, z - WEST_HILL.z)));
  return h;
};

/** Altura do terreno (com o leito do riacho escavado). */
export const terrainHeight = (x: number, z: number) => terrainFrom(x, z, waterDistance(x, z));

/** Mesma coisa, pra quem já mediu a distância até a água. */
export const terrainFrom = (x: number, z: number, w: number) => {
  const base = baseHeight(x, z);
  const bed = WATER_Y - 0.9 + Math.max(0, w + STREAM_HALF) * 0.15;
  const carve = 1 - smoothstep(-0.2, 3.2, w);
  return base + (Math.min(base, bed) - base) * carve;
};

/** Ponto no sistema da ponte: `along` no comprimento, `across` na largura. */
const bridgeLocal = (bridge: Bridge, x: number, z: number) => {
  const dx = x - bridge.x;
  const dz = z - bridge.z;
  const s = Math.sin(bridge.angle);
  const c = Math.cos(bridge.angle);
  return { along: dx * s + dz * c, across: dx * c - dz * s };
};

export const bridgeDeck = (bridge: Bridge, along: number) =>
  bridge.flat ? 0.05 : 0.25 + 0.55 * Math.cos((along / bridge.length) * Math.PI);

export const bridgeAt = (x: number, z: number) => {
  for (const bridge of BRIDGES) {
    const { along, across } = bridgeLocal(bridge, x, z);
    if (Math.abs(along) <= bridge.length / 2 && Math.abs(across) <= bridge.width / 2) {
      return { bridge, along };
    }
  }
  return null;
};

/** Altura onde os pés pisam: terreno ou tabuleiro da ponte. */
export const groundHeight = (x: number, z: number) => {
  const onBridge = bridgeAt(x, z);
  const ground = terrainHeight(x, z);
  if (onBridge) return Math.max(ground, bridgeDeck(onBridge.bridge, onBridge.along));
  return Math.max(ground, WATER_Y - 0.4);
};

/** Dá pra pisar aqui? Água só pela ponte; o mundo acaba na serra. */
export const canStand = (x: number, z: number, margin = 0.3) => {
  if (Math.hypot(x, z) > WORLD_RADIUS) return false;
  if (bridgeAt(x, z)) return true;
  return waterDistance(x, z) > margin;
};

/** Normal do terreno (pra inclinar o bugue e os bichos na ladeira). */
export const groundNormal = (x: number, z: number, target = new THREE.Vector3()) => {
  const e = 0.6;
  const hx = groundHeight(x + e, z) - groundHeight(x - e, z);
  const hz = groundHeight(x, z + e) - groundHeight(x, z - e);
  return target.set(-hx, 2 * e, -hz).normalize();
};
