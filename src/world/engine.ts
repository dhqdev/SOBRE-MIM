import * as THREE from 'three';
import { milestones } from '@/lib/milestones';
import {
  applyNight,
  bake,
  box,
  buildHalos,
  buildPools,
  collide,
  createKit,
  disposeMaterials,
  glow,
  keep,
  lambert,
  mergeStatics,
  seeded,
  toWorld,
  type Kit,
} from './props';
import * as G from './ground';
import * as B from './buildings';
import * as L from './life';
import { Animal, ducks, type RideKind } from './animals';
import { Buggy } from './buggy';
import { Boat } from './boat';
import { DEFAULT_OUTFIT, type Outfit } from './outfits';
import * as D from './details';
import { fishingLine, stretchLine, villagers } from './people';
import { buildPark, stringLights, type Attraction } from './park';
import { Sky, localHour } from './sky';
import { sfx } from './audio';
import {
  BRIDGES,
  HIDDEN,
  HIDDEN_ISLAND,
  ISLAND,
  LAKE,
  LAKE_SOUTH,
  POND,
  S,
  STREAM_PATH,
  STREAM_HALF,
  bridgeAt,
  canStand,
  groundHeight,
  terrainHeight,
  WATER_Y,
  WORLD_RADIUS,
  inHidden,
  stillWater,
  waterDistance,
} from './terrain';
import { EGGS, GATE, PARK, PENS, RIDES, ROADS, SPAWN, STATIONS, TRAIL, YARD, type Station } from './stations';
import { makeLabel, textureQuality } from './textures';

export type TimeMode = 'auto' | 'dia' | 'tarde' | 'noite';

type Mount = Animal | Buggy | Boat;

export interface RideState {
  /** No que a pessoa está montada agora. */
  riding: RideKind | null;
  /** O que dá pra montar ali do lado. */
  canMount: RideKind | null;
  /** Texto do brinquedo (ex.: "Andar na montanha-russa"). */
  label?: string;
  /** Segunda ação ali (pescar do barco, dar peixe pro bicho): tecla G. */
  extra?: { label: string; icon: string };
}

export interface WorldEvents {
  /** A estação mais perto do boneco (ou nenhuma). */
  onNear: (station: Station | null) => void;
  /** Primeira vez que o boneco chega numa estação. */
  onVisit: (station: Station) => void;
  /** Pegou o ovo de ouro de índice `index`. */
  onCollect: (index: number) => void;
  onRide: (state: RideState) => void;
  /** Mudou entre dia e noite (pro HUD trocar o ícone). */
  onNight?: (night: boolean) => void;
  /** Recadinho rápido pra pessoa (ex.: "encoste o barco na margem"). */
  onHint?: (text: string) => void;
  /** Deu um peixe pro bicho (`name` = "o cavalo", "a vaca"...). */
  onFeed?: (name: string) => void;
  /** Tirou alguma coisa da água (peixe ou tralha). */
  onCatch?: (fish: { name: string; kg: number; emoji: string; junk: boolean }) => void;
}

export interface WorldHandle {
  start: () => void;
  setJoystick: (x: number, z: number) => void;
  /** Botão B / espaço: pula, faz o bicho pular ou buzina. */
  action: () => void;
  /** Botão de montar/descer. */
  toggleRide: () => void;
  /** Embarca no brinquedo da estação `id` (botão do cartão do projeto). */
  ride: (id: string) => void;
  setPaused: (paused: boolean) => void;
  setTimeMode: (mode: TimeMode) => void;
  /** Troca a roupa do boneco. */
  setOutfit: (outfit: Outfit) => void;
  /** Quantos peixes a pessoa tem no balde (pra dar pros bichos). */
  setBag: (count: number) => void;
  /** Segunda ação (botão 🎣/🐟, tecla G). */
  extra: () => void;
  restore: (visited: string[], collected: number[]) => void;
  player: () => { x: number; z: number; angle: number };
  /** Só pra testes: leva o boneco direto pra um ponto. */
  teleport: (x: number, z: number) => void;
  /** Só pra testes: onde está o bicho (ou o bugue) mais perto desse tipo. */
  locate: (kind: RideKind) => { x: number; z: number } | null;
  /** Só pra testes: chamadas de desenho, triângulos e fps. */
  stats: () => {
    calls: number;
    triangles: number;
    fps: number;
    mode: string;
    hour: number;
    timeMode: string;
  };
  dispose: () => void;
}

const TECH_ICONS = [
  'python.svg',
  'typescript.svg',
  'react.svg',
  'vuejs.svg',
  'nodejs.svg',
  'fastapi.svg',
  'java.svg',
  'mysql.svg',
  'docker.svg',
  'git.svg',
  'n8n.webp',
  'tailwindcss.svg',
].map((file) => `/media/tech/${file}`);

/** Altura da plaquinha (acima do chão) de cada estação. */
const labelHeight = (station: Station) => {
  if (station.kind === 'milestone') return 3.7;
  if (station.kind === 'project')
    return (
      { coaster: 13, carousel: 8.4, swing: 8.6, viking: 10.6, ferris: 18.2, drop: 21.5 }[
        station.ride!.type
      ] ?? 6
    );
  return (
    {
      inicio: 3.8,
      sobre: 7.8,
      contato: 2.5,
      cafe: 4.6,
      github: 10.2,
      stack: 12.2,
      curriculo: 9.4,
      redes: 12,
    }[station.id] ?? 5
  );
};

const SOUND: Record<RideKind, () => void> = {
  cavalo: sfx.neigh,
  vaca: sfx.moo,
  porco: sfx.oink,
  ovelha: sfx.baa,
  bugue: sfx.horn,
  barco: sfx.splash,
  brinquedo: sfx.ride,
  pesca: sfx.splash,
};

/** O que dá pra tirar do lago e do riacho (`w` = chance relativa). */
const CATCHES = [
  { name: 'Lambari', emoji: '🐟', min: 0.05, max: 0.2, w: 22, color: '#c9d6e3' },
  { name: 'Tilápia', emoji: '🐟', min: 0.3, max: 1.6, w: 20, color: '#8aa0a8' },
  { name: 'Traíra', emoji: '🐟', min: 0.5, max: 2.8, w: 12, color: '#6b6a3a' },
  { name: 'Pacu', emoji: '🐟', min: 1, max: 4.5, w: 11, color: '#9a8a8a' },
  { name: 'Bagre', emoji: '🐟', min: 0.6, max: 3.5, w: 10, color: '#7a6a5a' },
  { name: 'Tambaqui', emoji: '🐠', min: 2, max: 9, w: 8, color: '#4a4a5a' },
  { name: 'Dourado', emoji: '✨', min: 2, max: 10, w: 5, color: '#ffcf3a' },
  { name: 'Pintado', emoji: '🐠', min: 3, max: 14, w: 4, color: '#b8b0a0' },
  { name: 'Tucunaré gigante', emoji: '🏆', min: 6, max: 12, w: 2, color: '#e8b83a' },
  { name: 'uma bota velha', emoji: '🥾', min: 0.8, max: 0.8, w: 3, color: '#6b4423', junk: true },
  { name: 'um teclado molhado', emoji: '⌨️', min: 0.9, max: 0.9, w: 2, color: '#2a2a33', junk: true },
  { name: 'um patinho de borracha', emoji: '🦆', min: 0.05, max: 0.05, w: 1, color: '#ffd166', junk: true },
];

/** Na Lagoa Escondida os peixes grandes aparecem bem mais. */
const pickCatch = (hidden: boolean) => {
  const weight = (c: (typeof CATCHES)[number]) => (hidden && c.min >= 2 ? c.w * 4 : c.w);
  let roll = Math.random() * CATCHES.reduce((sum, c) => sum + weight(c), 0);
  for (const c of CATCHES) {
    roll -= weight(c);
    if (roll <= 0) return c;
  }
  return CATCHES[0];
};

/** Nome do bicho com artigo, pros recadinhos ("o cavalo", "a vaca"). */
const ANIMAL_NAME: Record<string, string> = {
  cavalo: 'o cavalo',
  vaca: 'a vaca',
  porco: 'o porquinho',
  ovelha: 'a ovelha',
  galinha: 'a galinha',
  cachorro: 'o cachorro',
  pato: 'o pato',
};
const ANIMAL_TO: Record<string, string> = {
  cavalo: 'pro cavalo',
  vaca: 'pra vaca',
  porco: 'pro porquinho',
  ovelha: 'pra ovelha',
  galinha: 'pra galinha',
  cachorro: 'pro cachorro',
  pato: 'pro pato',
};
const ANIMAL_SOUND: Record<string, () => void> = {
  cavalo: sfx.neigh,
  vaca: sfx.moo,
  porco: sfx.oink,
  ovelha: sfx.baa,
  cachorro: sfx.bark,
};

/** Peixinho (ou bota) pra mostrar em cima da cabeça. */
const catchModel = (color: string, junk: boolean) => {
  const g = new THREE.Group();
  const m = lambert(color);
  if (junk) {
    box(g, [0.36, 0.5, 0.3], [0, 0.1, 0], m);
    box(g, [0.36, 0.2, 0.55], [0, -0.1, 0.15], m);
  } else {
    box(g, [0.3, 0.42, 1.0], [0, 0, 0], m);
    const tail = box(g, [0.08, 0.5, 0.36], [0, 0, -0.62], m);
    tail.rotation.x = 0.4;
    box(g, [0.06, 0.24, 0.3], [0, 0.28, 0], m);
    for (const side of [-0.16, 0.16]) box(g, [0.02, 0.09, 0.09], [side, 0.06, 0.36], lambert('#1a1326'));
  }
  return g;
};

/* ---------------------------------------------------------------- boneco */

const buildPlayer = (scene: THREE.Scene, outfit: Outfit) => {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  scene.add(root);
  const skin = lambert('#e2a878');
  const shirt = lambert(outfit.shirt);
  const pants = lambert(outfit.pants);
  const trim = lambert(outfit.trim);

  const legs = [-0.18, 0.18].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side, 0.78, 0);
    body.add(hip);
    box(hip, [0.3, 0.62, 0.32], [0, -0.31, 0], pants);
    box(hip, [0.32, 0.16, 0.42], [0, -0.7, 0.05], lambert(outfit.shoes));
    return hip;
  });
  const torso = new THREE.Group();
  torso.position.y = 0.78;
  body.add(torso);
  box(torso, [0.8, 0.78, 0.46], [0, 0.4, 0], shirt);
  box(torso, [0.5, 0.18, 0.47], [0, 0.18, 0.01], trim);
  if (outfit.plaid) {
    // xadrez: listras cruzadas na frente e nas costas
    const stripe = lambert(outfit.plaid);
    for (const y of [0.32, 0.6]) box(torso, [0.82, 0.06, 0.48], [0, y, 0], stripe);
    for (const x of [-0.22, 0.22]) box(torso, [0.06, 0.78, 0.48], [x, 0.4, 0], stripe);
  }
  if (outfit.badge) box(torso, [0.16, 0.16, 0.05], [0.18, 0.58, 0.24], glow(outfit.badge));
  if (outfit.cape) {
    const cape = box(torso, [0.78, 1.1, 0.06], [0, 0.25, -0.3], lambert(outfit.cape));
    cape.rotation.x = 0.12;
    box(torso, [0.84, 0.12, 0.5], [0, 0.76, -0.02], lambert(outfit.cape));
  }
  const arms = [-0.52, 0.52].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side, 0.72, 0);
    torso.add(shoulder);
    box(shoulder, [0.24, 0.62, 0.28], [0, -0.28, 0], shirt);
    if (outfit.plaid) box(shoulder, [0.26, 0.06, 0.3], [0, -0.3, 0], lambert(outfit.plaid));
    box(shoulder, [0.22, 0.18, 0.24], [0, -0.66, 0], skin);
    return shoulder;
  });
  // vara de pesca (só aparece pescando)
  const rod = keep(new THREE.Group());
  rod.position.set(0, -0.64, 0);
  rod.rotation.x = -1.25;
  arms[1].add(rod);
  box(rod, [0.05, 3.0, 0.05], [0, -1.45, 0], lambert('#3b3350'));
  box(rod, [0.1, 0.1, 0.14], [0, -0.12, 0.07], lambert('#2a2a33'));
  rod.visible = false;
  const head = new THREE.Group();
  head.position.y = 0.8;
  torso.add(head);
  box(head, [0.72, 0.66, 0.66], [0, 0.36, 0], skin);
  box(head, [0.78, 0.22, 0.72], [0, 0.72, -0.02], lambert('#2b1d14'));
  box(head, [0.78, 0.46, 0.18], [0, 0.5, -0.3], lambert('#2b1d14'));
  box(head, [0.3, 0.12, 0.1], [-0.18, 0.62, 0.32], lambert('#2b1d14'));
  const eyes = [-0.16, 0.16].map((side) =>
    box(head, [0.1, 0.14, 0.04], [side, 0.38, 0.34], lambert('#1a1326')),
  );
  box(head, [0.16, 0.05, 0.04], [0, 0.2, 0.34], lambert('#b5644a'));
  dressHat(head, outfit);
  const shadowGeometry = new THREE.CircleGeometry(0.55, 12);
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadow = new THREE.Mesh(
    shadowGeometry,
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.3, depthWrite: false }),
  );
  scene.add(shadow);
  eyes.forEach(keep);
  bake(root);
  return { root, body, torso, head, legs, arms, eyes, shadow, rod };
};

const HAT_CYL = new THREE.CylinderGeometry(1, 1, 1, 14);

/** Chapéu de cada roupa (em cima da cabeça). */
const dressHat = (head: THREE.Group, outfit: Outfit) => {
  const color = lambert(outfit.hatColor);
  const band = lambert(outfit.hatBand ?? outfit.hatColor);
  const cyl = (r: number, h: number, y: number, material: THREE.Material, top = r) => {
    const m = new THREE.Mesh(top === r ? HAT_CYL : new THREE.CylinderGeometry(top, r, 1, 14), material);
    m.scale.set(top === r ? r : 1, h, top === r ? r : 1);
    m.position.y = y;
    head.add(m);
    return m;
  };
  switch (outfit.hat) {
    case 'palha':
      cyl(0.72, 0.06, 0.78, color);
      cyl(0.42, 0.34, 0.96, color, 0.36);
      cyl(0.43, 0.08, 0.84, band);
      break;
    case 'bone':
      box(head, [0.8, 0.26, 0.76], [0, 0.86, -0.02], color);
      box(head, [0.66, 0.06, 0.4], [0, 0.76, 0.52], color);
      box(head, [0.12, 0.08, 0.12], [0, 1.0, -0.02], lambert(outfit.trim));
      break;
    case 'cowboy': {
      const brim = cyl(0.85, 0.06, 0.78, color);
      brim.scale.z = 0.62;
      box(head, [0.62, 0.38, 0.52], [0, 1.0, 0], color);
      box(head, [0.64, 0.08, 0.54], [0, 0.85, 0], band);
      box(head, [0.62, 0.08, 0.2], [0, 1.2, 0], lambert('#6b4423'));
      break;
    }
    case 'pescador':
      cyl(0.58, 0.06, 0.8, color, 0.6).rotation.x = 0.05;
      cyl(0.44, 0.3, 0.95, color, 0.4);
      break;
    case 'coroa': {
      const gold = glow(outfit.hatColor);
      box(head, [0.66, 0.2, 0.62], [0, 0.88, 0], gold);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        box(head, [0.14, 0.24, 0.14], [Math.sin(a) * 0.26, 1.08, Math.cos(a) * 0.24], gold);
      }
      box(head, [0.12, 0.12, 0.04], [0, 0.9, 0.32], glow('#ff4d6d'));
      break;
    }
    case 'capacete': {
      const glass = new THREE.MeshLambertMaterial({ color: '#9fd6ef', transparent: true, opacity: 0.35 });
      const bubble = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), glass);
      bubble.position.y = 0.42;
      head.add(bubble);
      box(head, [0.9, 0.12, 0.9], [0, -0.04, 0], color);
      box(head, [0.08, 0.3, 0.08], [0.3, 1.0, 0], lambert('#8a8a9a'));
      box(head, [0.12, 0.12, 0.12], [0.3, 1.18, 0], glow('#ff4d6d'));
      break;
    }
    default:
      break;
  }
};

/* ------------------------------------------------------------------ mundo */

const buildWorld = (kit: Kit) => {
  const mobile = kit.env.mobile;
  const rand = seeded(1234);
  const byId = Object.fromEntries(STATIONS.map((s) => [s.id, s]));

  // chão pintado: terreiro, roças, chiqueiro, pasto e feira
  const FIELDS = {
    milho: { x: S(-22), z: S(37), w: 12, d: 8 },
    girassol: { x: S(25), z: S(42), w: 12, d: 8 },
    abobora: { x: S(-9), z: S(31.5), w: 8, d: 6 },
  };
  G.buildTerrain(kit, ROADS, [
    { x: YARD.x, z: YARD.z, r: 7, color: '#c9a46b' },
    ...RIDES.filter((ride) => ride.plaza > 0).map((ride) => ({
      x: ride.bx,
      z: ride.bz,
      r: ride.plaza,
      color: '#d8c08a',
    })),
    { ...PENS.pigs, color: '#8a6440' },
    { ...PENS.horses, color: '#b8975f' },
    { x: S(-27), z: S(-50), r: 11, color: '#8fc95a' },
    { ...FIELDS.milho, w: FIELDS.milho.w + 1, d: FIELDS.milho.d + 1, color: '#8a5a36' },
    { ...FIELDS.girassol, w: FIELDS.girassol.w + 1, d: FIELDS.girassol.d + 1, color: '#8a5a36' },
    { ...FIELDS.abobora, w: FIELDS.abobora.w + 1, d: FIELDS.abobora.d + 1, color: '#8a5a36' },
    { x: S(14), z: S(-26), r: 5, color: '#c9a46b' },
  ]);
  G.buildWater(kit);
  G.waterfall(kit);
  G.bridges(kit);
  G.farHills(kit);

  // currais
  G.pen(kit, PENS.pigs, 'e');
  G.pen(kit, PENS.sheep, 'e');
  G.pen(kit, PENS.horses, 's');
  B.pigsty(kit, PENS.pigs);
  B.stable(kit, PENS.horses.x, PENS.horses.z - 3.4, PENS.horses.x, PENS.horses.z + 6);
  // feno no pasto das vacas
  B.hayBale(kit, S(-21.5), S(-45.5), 0.4);

  // entrada no alto da colina
  B.gate(kit, GATE.x, GATE.z);
  G.fence(kit, [
    [-4.2, GATE.z],
    [-11, GATE.z - 0.6],
    [-17, GATE.z - 3.5],
  ]);
  G.fence(kit, [
    [4.2, GATE.z],
    [11, GATE.z - 0.6],
    [17, GATE.z - 3.5],
  ]);
  B.overlook(kit, S(-7), S(61.5), S(-7), S(40));
  B.signpost(kit, 4.2, S(73.5), [
    { text: 'Terreiro', toX: YARD.x, toZ: YARD.z },
    { text: 'Garagem', toX: S(8), toZ: S(39) },
    { text: 'Lago', toX: LAKE.x, toZ: LAKE.z },
  ]);
  B.signpost(kit, S(5.5), S(-1), [
    { text: 'Casa', toX: S(-17), toZ: S(-24) },
    { text: 'Parque', toX: PARK.x, toZ: PARK.z },
    { text: 'Celeiro', toX: S(14), toZ: S(-31) },
    { text: 'Trilha', toX: TRAIL[0][0], toZ: TRAIL[0][1] },
    { text: 'Cachoeira', toX: POND.x, toZ: POND.z },
  ]);

  // estações
  const hooks = new Map<string, (() => void)[]>();
  const addHook = (id: string, hook?: (() => void) | void) => {
    if (!hook) return;
    hooks.set(id, [...(hooks.get(id) ?? []), hook]);
  };
  const labels: { sprite: THREE.Sprite; station: Station; base: THREE.Vector3 }[] = [];
  const firstMilestone = STATIONS.findIndex((s) => s.kind === 'milestone');
  STATIONS.forEach((station, index) => {
    const { id, bx, bz, x, z } = station;
    if (station.kind === 'project') {
      // o brinquedo é montado no parque, logo abaixo
    } else if (station.kind === 'milestone') {
      addHook(id, B.milestoneSign(kit, bx, bz, x, z, milestones[index - firstMilestone]));
    } else {
      switch (id) {
        case 'inicio':
          B.welcomeBoard(kit, bx, bz, x, z);
          break;
        case 'sobre':
          B.farmhouse(kit, bx, bz, x, z);
          break;
        case 'contato':
          addHook(id, B.mailbox(kit, bx, bz, x, z));
          break;
        case 'cafe':
          B.woodStove(kit, bx, bz, x, z);
          break;
        case 'github': {
          G.ipe(kit, bx, bz, 1.25);
          const angle = Math.atan2(x - bx, z - bz);
          B.commitGrid(kit, bx - Math.sin(angle) * 5.5, bz - Math.cos(angle) * 5.5, angle);
          break;
        }
        case 'stack':
          B.silo(kit, bx, bz, TECH_ICONS);
          break;
        case 'curriculo': {
          const barn = B.barn(kit, bx, bz, x, z);
          const spot = toWorld(barn, 2.6, 5.0);
          addHook(id, B.chest(kit, spot.x, spot.z, x, z));
          break;
        }
        case 'redes':
          B.lookoutTower(kit, bx, bz, x, z);
          break;
      }
    }
    const height = labelHeight(station);
    const ground = terrainHeight(bx, bz);
    if (station.kind !== 'milestone') addHook(id, B.beacon(kit, bx, ground + height + 1.4, bz, x, z));
    else addHook(id, B.beacon(kit, x, groundHeight(x, z) - 10, z, x, z));
    const sprite = makeLabel(station.label, {
      height: station.kind === 'milestone' ? 0.6 : 0.78,
      accent: station.kind === 'milestone' ? '#5ec8f2' : '#a78bfa',
    });
    sprite.position.set(bx, ground + height, bz);
    kit.scene.add(sprite);
    labels.push({ sprite, station, base: sprite.scale.clone() });
  });

  // parque dos projetos: um brinquedo por projeto, arco na entrada e varal de luzes
  const attractions = buildPark(kit, STATIONS);
  B.fairArch(kit, S(14.6), S(0.4), S(6), S(-5), 'PARQUE DOS PROJETOS');
  B.arcade(kit, 22, 6, 22, 2);
  const parkPosts: [number, number][] = [];
  for (let px = S(18); px <= S(54); px += 6.4)
    parkPosts.push([px, PARK.z + (parkPosts.length % 2 ? 2.3 : -2.2)]);
  parkPosts.forEach(([px, pz]) => B.lampPost(kit, px, pz, false));
  for (let i = 0; i < parkPosts.length - 1; i++) {
    const [ax, az] = parkPosts[i];
    const [bx2, bz2] = parkPosts[i + 1];
    stringLights(
      kit,
      [ax + 0.7, terrainHeight(ax, az) + 3.0, az],
      [bx2 + 0.7, terrainHeight(bx2, bz2) + 3.0, bz2],
    );
  }

  // terreiro e arredores da casa
  B.well(kit, YARD.x, YARD.z);
  B.clothesline(kit, S(-28), S(-24.5), 0.9);
  B.chickenCoop(kit, S(-6), S(-34), S(0), S(-24));
  B.tractor(kit, S(22.5), S(-35), 2.4);
  B.hayBale(kit, S(7.5), S(-36.5), 0.3);
  B.hayBale(kit, S(7.5) + 1.7, S(-36.5) - 1.8, 1.2);
  B.hayBale(kit, S(20), S(-27), 0, false);
  B.hayBale(kit, S(20) + 0.2, S(-27) - 1.3, 0.2, false);
  B.crates(kit, S(-24), S(-8));
  B.crates(kit, S(30.5), S(-14));
  B.picnicTable(kit, 63, 54, 0.6);
  B.picnicTable(kit, S(-44), S(25), 0.2);

  // portaria na entrada (a cancela sobe quando alguém chega)
  const gatehouse = B.gatehouse(kit, 5.5, 114, 0, 1);
  // moradores, as casinhas deles e o que cada um faz
  const people = villagers(kit);
  // detalhes da fazenda
  D.barrels(kit, 11.5, -35.5);
  D.barrels(kit, 37.5, 21.5, 2);
  D.wheelbarrow(kit, -53.5, 61, 0.6);
  D.wheelbarrow(kit, 24, -30, -1.1, '#e6c36a');
  D.firewood(kit, -47, -23, 0.4);
  D.beehives(kit, [
    [44, 61.5],
    [45.8, 59.6],
    [44.6, 64.2],
  ]);
  D.trough(kit, -63.4, -41.6, Math.PI / 2);
  D.trough(kit, -40.8, -40, Math.PI / 2);
  D.bench(kit, 78, 74, 72, 64);
  D.bench(kit, 89.8, 49, 84, 46);
  D.bench(kit, -14, 82, -14, 70);
  D.tireSwing(kit, 56, 13);
  D.pumpkinPile(kit, -6.5, 45);
  G.roundTree(kit, 90.6, 52.6, 0.75, true, 2);

  // Lagoa Escondida: cercada de pedra, só se chega de barco pelo canal
  {
    const ring = HIDDEN.r + 2.6;
    const n = 80;
    const point = (i: number): [number, number] => [
      HIDDEN.x + Math.cos((i / n) * Math.PI * 2) * ring,
      HIDDEN.z + Math.sin((i / n) * Math.PI * 2) * ring,
    ];
    for (let i = 0; i < n; i++) {
      const [ax, az] = point(i);
      const [bx, bz] = point(i + 1);
      if (stillWater((ax + bx) / 2, (az + bz) / 2) < -0.3) continue;
      kit.walls.push({ ax, az, bx, bz });
      if (i % 3 === 0) G.rock(kit, ax, az, 1.5 + ((i * 7) % 5) * 0.22, false);
    }
    G.pine(kit, HIDDEN_ISLAND.x + 0.9, HIDDEN_ISLAND.z - 0.8, 0.8);
    B.signpost(kit, 104.5, 38, [{ text: 'Lagoa Escondida', toX: HIDDEN.x, toZ: HIDDEN.z }]);
  }

  // roças, moinho e garagem
  G.field(kit, FIELDS.milho, 'milho');
  G.field(kit, FIELDS.girassol, 'girassol');
  G.field(kit, FIELDS.abobora, 'abobora');
  B.scarecrow(kit, FIELDS.milho.x, FIELDS.milho.z + FIELDS.milho.d / 2 + 1.2);
  B.scarecrow(kit, FIELDS.girassol.x + 0.6, FIELDS.girassol.z - FIELDS.girassol.d / 2 - 1.2);
  B.windmill(kit, S(16), S(29), S(4), S(29));
  B.garage(kit, S(12.2), S(39), S(5), S(40));

  // pomar do outro lado da ponte de tronco
  const orchard: [number, number][] = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) orchard.push([S(-56) + i * 5.5 + (j % 2) * 1.5, S(22) + j * 5]);
  orchard.forEach(([x, z], i) => G.roundTree(kit, x, z, 0.85, true, i));

  // postes de luz pela estrada e pelo terreiro
  const posts: [number, number, boolean][] = [
    [S(2.3), S(64), false],
    [S(-1.9), S(52), false],
    [S(2.6), S(41), !mobile],
    [S(-2.1), S(27), false],
    [S(3.3), S(12.5), true],
    [S(-3.2), S(-1), false],
    [S(7.5), S(-12), false],
    [S(-9), S(-18.5), !mobile],
    [S(11), S(0.5), false],
    [S(-20), S(3.8), false],
    [S(43.5), S(15), false],
    [S(8), S(26), false],
    [S(-14), S(22), false],
    [S(-30), S(10.5), false],
    [S(-12), S(-26), false],
    [S(20), S(-22), false],
    [61.5, 43, false],
    [62, 50.5, false],
    [S(48), S(-21), false],
    [S(57), S(-42), false],
  ];
  posts.forEach(([x, z, light]) => B.lampPost(kit, x, z, light));

  // o que não pode ser coberto por árvore, pedra ou flor
  const reserved: [number, number, number][] = [
    [GATE.x, GATE.z, 7],
    [S(0), S(70), 6],
    [S(-7), S(61.5), 2.5],
    [YARD.x, YARD.z, 6],
    ...RIDES.map((ride) => [ride.bx, ride.bz, ride.type === 'coaster' ? 15 : 7] as [number, number, number]),
    [S(55), S(1.5), 7],
    [22, 6, 2],
    [ISLAND.x, ISLAND.z, ISLAND.r + 1],
    [S(-17), S(-24), 8],
    [S(-30), S(-14), 5],
    [S(-22), S(-1), 5],
    [-22, -1 - 5.5, 6],
    [S(31), S(-25), 6],
    [S(14), S(-31), 8],
    [S(22.5), S(-35), 3],
    [S(-6), S(-34), 4],
    [S(-4), S(-29), 6],
    [S(-27), S(-50), 10],
    [S(-28), S(-24.5), 4],
    [S(16), S(29), 3],
    [S(12.2), S(39), 5],
    [S(7.5), S(39.6), 3],
    [S(-50), S(27), 9],
    [63, 54, 3],
    [5.5, 114, 4],
    [2.3, 111.4, 1.5],
    ...people.reserved,
    [11.5, -35.5, 1.5],
    [37.5, 21.5, 1.3],
    [-53.5, 61, 1],
    [24, -30, 1],
    [-47, -23, 2.2],
    [44.8, 61.8, 3],
    [-63.4, -41.6, 1.4],
    [-40.8, -40, 1.4],
    [78, 74, 1.2],
    [LAKE_SOUTH.x, LAKE_SOUTH.z, LAKE_SOUTH.r + 3],
    [HIDDEN.x, HIDDEN.z, HIDDEN.r + 4],
    [104.5, 38, 1.5],
    [-14, 82, 1.2],
    [56, 13, 3.5],
    [-6.5, 45, 1.5],
    [S(57), S(-61), 6],
    [LAKE.x, LAKE.z, LAKE.r + 3],
    [POND.x, POND.z, POND.r + 4],
    ...Object.values(PENS).map((p) => [p.x, p.z, Math.hypot(p.w, p.d) / 2 + 2] as [number, number, number]),
    ...Object.values(FIELDS).map((f) => [f.x, f.z, Math.hypot(f.w, f.d) / 2 + 2] as [number, number, number]),
    ...STATIONS.map((s) => [s.x, s.z, 2.6] as [number, number, number]),
    ...STATIONS.map((s) => [s.bx, s.bz, 2.6] as [number, number, number]),
    ...EGGS.map(([x, z]) => [x, z, 1.4] as [number, number, number]),
    ...posts.map(([x, z]) => [x, z, 1] as [number, number, number]),
  ];
  const segments = ROADS.flatMap((road) =>
    road.points.slice(1).map((point, i) => [road.points[i], point, road.width] as const),
  );
  const nearRoad = (x: number, z: number, margin: number) =>
    segments.some(([[ax, az], [bx, bz], width]) => {
      const dx = bx - ax;
      const dz = bz - az;
      const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      return Math.hypot(x - (ax + dx * k), z - (az + dz * k)) < margin + width / 2;
    });
  const free = (x: number, z: number, margin = 1.6) =>
    !nearRoad(x, z, margin) &&
    waterDistance(x, z) > margin + 0.4 &&
    reserved.every(([rx, rz, r]) => Math.hypot(x - rx, z - rz) > r + margin * 0.5);
  const taken: [number, number][] = [];
  const pick = (minR: number, maxR: number, gap: number, margin = 1.6, tries = 300) => {
    for (let i = 0; i < tries; i++) {
      const angle = rand() * Math.PI * 2;
      const r = minR + Math.sqrt(rand()) * (maxR - minR);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!free(x, z, margin)) continue;
      if (taken.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < gap)) continue;
      taken.push([x, z]);
      return [x, z] as const;
    }
    return null;
  };

  // salgueiros na beira do riacho e em volta do lago
  for (let i = 8; i < STREAM_PATH.length - 6; i += 21) {
    const [ax, az] = STREAM_PATH[i];
    const [bx, bz] = STREAM_PATH[i + 1];
    const len = Math.hypot(bx - ax, bz - az) || 1;
    const side = ((i - 8) / 21) % 2 ? 1 : -1;
    const off = STREAM_HALF + 3 + rand() * 1.5;
    const x = ax + (-(bz - az) / len) * off * side;
    const z = az + ((bx - ax) / len) * off * side;
    if (!free(x, z, 1.4) || taken.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 6)) continue;
    taken.push([x, z]);
    G.willow(kit, x, z, 0.85 + rand() * 0.3);
  }
  for (const pool of [LAKE, LAKE_SOUTH]) {
    for (let a = 0; a < Math.PI * 2; a += 9 / pool.r) {
      const x = pool.x + Math.cos(a) * (pool.r + 3.6);
      const z = pool.z + Math.sin(a) * (pool.r + 3.6);
      if (Math.hypot(x, z) > WORLD_RADIUS - 6 || !free(x, z, 1.4)) continue;
      taken.push([x, z]);
      G.willow(kit, x, z, 0.9 + rand() * 0.3);
    }
  }

  // mata em volta (mais densa perto da serra)
  const trees = mobile ? 150 : 260;
  for (let i = 0; i < trees; i++) {
    const spot = i < trees * 0.45 ? pick(S(70), S(98), 3.2) : pick(S(12), S(78), 4.2);
    if (!spot) continue;
    const [x, z] = spot;
    const scale = 0.8 + rand() * 0.6;
    const h = terrainHeight(x, z);
    if (h > 6 || i % 4 === 0) G.pine(kit, x, z, scale);
    else G.roundTree(kit, x, z, scale, i % 7 === 0, i);
  }
  // ipês espalhados (um toque roxo)
  [
    [-12, 58],
    [18, 62],
    [44, 12],
    [-40, -6],
    [38, -48],
  ].forEach(([x, z]) => G.ipe(kit, S(x), S(z), 0.9));
  for (let i = 0; i < (mobile ? 75 : 130); i++) {
    const spot = pick(S(8), S(84), 2, 1.2);
    if (spot) G.bush(kit, spot[0], spot[1], 0.7 + rand() * 0.6, i % 3 === 0);
  }
  for (let i = 0; i < 40; i++) {
    const spot = pick(S(10), S(92), 2.4, 1.2);
    if (spot) G.rock(kit, spot[0], spot[1], 0.5 + rand() * 1.1);
  }
  const flowers: [number, number][] = [];
  const tufts: [number, number][] = [];
  const flowerCount = mobile ? 320 : 600;
  const tuftCount = mobile ? 900 : 1900;
  for (let i = 0; i < 14000 && (flowers.length < flowerCount || tufts.length < tuftCount); i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * S(86);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    if (!free(x, z, 0.6)) continue;
    if (flowers.length < flowerCount && i % 3 === 0) flowers.push([x, z]);
    else if (tufts.length < tuftCount) tufts.push([x, z]);
  }
  G.meadow(kit, flowers, tufts);

  // vida
  L.butterflies(
    kit,
    flowers.filter((_, i) => i % 30 === 0),
  );
  const fireflySpots: [number, number][] = [];
  for (let i = 0; i < STREAM_PATH.length; i += 5) {
    const [x, z] = STREAM_PATH[i];
    fireflySpots.push([x + (rand() - 0.5) * 9, z + (rand() - 0.5) * 9]);
  }
  orchard.forEach(([x, z]) => fireflySpots.push([x + 1, z + 1]));
  L.fireflies(kit, fireflySpots);
  L.fish(kit, [
    [LAKE.x - 3, LAKE.z + 2, 0.5],
    [STREAM_PATH[60][0], STREAM_PATH[60][1], 2],
    [LAKE.x + 2, LAKE.z - 4, -1],
    [POND.x + 1, POND.z, 1],
    [STREAM_PATH[180][0], STREAM_PATH[180][1], 1],
  ]);
  L.swimmers(kit);
  L.birds(kit, 6);
  L.clouds(kit, mobile ? 10 : 16, rand);

  // bichos
  const animals: Animal[] = [
    new Animal(kit, 'cavalo', PENS.horses, 0, [PENS.horses.x - 3, PENS.horses.z + 1]),
    new Animal(kit, 'cavalo', PENS.horses, 1, [PENS.horses.x + 3, PENS.horses.z + 2]),
    new Animal(kit, 'cavalo', PENS.horses, 2, [PENS.horses.x - 4, PENS.horses.z - 2]),
    new Animal(kit, 'vaca', { x: S(-27), z: S(-50), r: 10 }, 0),
    new Animal(kit, 'vaca', { x: S(-27), z: S(-50), r: 10 }, 1),
    new Animal(kit, 'vaca', { x: S(-27), z: S(-50), r: 10 }, 2),
    new Animal(kit, 'vaca', { x: S(-27), z: S(-50), r: 10 }, 3),
    new Animal(kit, 'porco', PENS.pigs, 0),
    new Animal(kit, 'porco', PENS.pigs, 1),
    new Animal(kit, 'porco', PENS.pigs, 2),
    ...[0, 1, 2, 3, 4].map((v) => new Animal(kit, 'ovelha', PENS.sheep, v)),
    ...[0, 1, 2, 3, 4, 5].map((v) => new Animal(kit, 'galinha', { x: S(-3), z: S(-28.5), r: 6 }, v)),
    new Animal(kit, 'cachorro', { x: S(-8), z: S(-12), r: 2.5 }, 0, [S(-7), S(-10)]),
  ];
  ducks(kit);
  const buggy = new Buggy(kit, S(12.2) - 6.8, S(39) + 0.4, -1.5);
  // barquinho amarrado no deque do lago
  const deck = BRIDGES.find((bridge) => bridge.flat)!;
  const boat = new Boat(
    kit,
    deck.x + Math.sin(deck.angle) * (deck.length / 2) + Math.cos(deck.angle) * 1.7,
    deck.z + Math.cos(deck.angle) * (deck.length / 2) - Math.sin(deck.angle) * 1.7,
    deck.angle,
  );

  const eggs = EGGS.map(([x, z]) => B.goldenEgg(kit, x, z));

  buildPools(kit, groundHeight);
  buildHalos(kit);
  mergeStatics(kit);
  return { hooks, labels, eggs, animals, buggy, boat, attractions, gatehouse, people };
};

/* ---------------------------------------------------------------- motor */

export const createWorld = (
  canvas: HTMLCanvasElement,
  events: WorldEvents,
  outfit: Outfit = DEFAULT_OUTFIT,
): WorldHandle => {
  const mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  textureQuality.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#cdeeff', 90, 300);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.3, 1200);

  const kit = createKit(scene, mobile);
  const sky = new Sky(scene);
  const { hooks, labels, eggs, animals, buggy, boat, attractions, gatehouse, people } = buildWorld(kit);
  let player = buildPlayer(scene, outfit);
  const rod = fishingLine(kit);
  rod.line.visible = rod.bobber.visible = false;
  const bang = makeLabel('Fisgou! Puxa!', { color: '#ffd166', accent: '#ffd166', height: 0.75 });
  bang.visible = false;
  scene.add(bang);
  const rideable = animals.filter((animal) => animal.rideable);

  const state = {
    mode: 'intro' as 'intro' | 'fly' | 'play',
    flyT: 0,
    paused: false,
    x: SPAWN.x,
    z: SPAWN.z,
    y: 0,
    vx: 0,
    vz: 0,
    vy: 0,
    angle: Math.PI,
    phase: 0,
    joyX: 0,
    joyZ: 0,
    nearId: '' as string,
    visited: new Set<string>(),
    nextDust: 0,
    blinkAt: 2,
    mount: null as Mount | null,
    mountable: null as Mount | null,
    rideKey: '',
    /** Brinquedo do parque em que a pessoa está. */
    attraction: null as Attraction | null,
    /** Giro da câmera quando embarcou (a câmera da montanha-russa segue o carrinho). */
    boardYaw: 0,
    lastThrill: 0,
    wheeAt: -10,
    /** Giro da câmera em volta do boneco (0 = olhando pro norte). */
    yaw: 0,
    timeMode: 'auto' as TimeMode,
    hour: localHour(),
    night: false,
    /** Pescando: lança, espera, belisca e (se puxar a tempo) mostra o peixe. */
    fishing: null as null | {
      phase: 'cast' | 'wait' | 'bite' | 'show';
      at: number;
      x: number;
      z: number;
      biteAt: number;
      fish?: THREE.Group;
    },
    /** Ponto na água pra onde dá pra lançar a linha agora (ou nada). */
    fishSpot: null as [number, number] | null,
    nextFishCheck: 0,
    /** Peixes no balde e o bicho ali do lado que pode ganhar um. */
    bag: 0,
    feedTarget: null as Animal | null,
  };
  const keys = new Set<string>();

  const kindOf = (mount: Mount | null): RideKind | null =>
    !mount
      ? null
      : mount instanceof Buggy
        ? 'bugue'
        : mount instanceof Boat
          ? 'barco'
          : (mount.kind as RideKind);

  /** Brinquedo cujo ponto de embarque está bem ali. */
  const nearAttraction = () =>
    state.mount || state.attraction ? null : (attractions.find((a) => a.station.id === state.nearId) ?? null);

  const emitRide = () => {
    const near = nearAttraction();
    let riding = kindOf(state.mount);
    let canMount = state.mount ? null : kindOf(state.mountable);
    let label: string | undefined;
    if (state.attraction) {
      riding = 'brinquedo';
      canMount = null;
      label = state.attraction.station.ride!.off;
    } else if (near) {
      canMount = 'brinquedo';
      label = near.station.ride!.on;
    } else if (state.fishing) {
      riding = 'pesca';
      label = state.fishing.phase === 'bite' ? 'Puxar agora!' : 'Recolher a linha';
    }
    let extra: RideState['extra'];
    if (state.fishing) extra = undefined;
    else if (state.fishSpot) extra = { label: 'Pescar', icon: '🎣' };
    else if (state.feedTarget) extra = { label: `Dar peixe ${ANIMAL_TO[state.feedTarget.kind]}`, icon: '🐟' };
    const key = `${riding}:${canMount}:${label}:${extra?.label}`;
    if (key === state.rideKey) return;
    state.rideKey = key;
    events.onRide({ riding, canMount, label, extra });
  };

  const board = (attraction: Attraction) => {
    stopFishing();
    if (state.mount) dismount(true);
    state.attraction = attraction;
    attraction.board(kit.time.value);
    state.boardYaw = state.yaw;
    state.vx = state.vz = state.vy = state.y = 0;
    state.lastThrill = 0;
    if (state.nearId) {
      state.nearId = '';
      events.onNear(null);
    }
    sfx.ride();
    emitRide();
  };

  const leaveAttraction = () => {
    const attraction = state.attraction;
    if (!attraction) return;
    attraction.leave();
    state.attraction = null;
    state.x = attraction.station.x;
    state.z = attraction.station.z;
    state.y = state.vy = state.vx = state.vz = 0;
    // de frente pro brinquedo, pra ver o que acabou de andar
    state.angle = Math.atan2(attraction.station.bx - state.x, attraction.station.bz - state.z);
    player.root.quaternion.identity();
    player.arms.forEach((arm) => arm.rotation.set(0, 0, 0));
    sfx.close();
    emitRide();
  };

  /** Água logo à frente (de quem está na margem, no deque ou na ponte). */
  /** Pesca só de dentro do barco: procura água em volta (de preferência pelo lado). */
  const castSpot = (): [number, number] | null => {
    if (!(state.mount instanceof Boat)) return null;
    for (const off of [1.57, -1.57, 0.9, -0.9, 0, 2.3, -2.3, 3.14]) {
      const a = state.angle + off;
      for (const d of [3.6, 4.6, 2.8]) {
        const x = state.x + Math.sin(a) * d;
        const z = state.z + Math.cos(a) * d;
        if (waterDistance(x, z) < -0.5 && !bridgeAt(x, z)) return [x, z];
      }
    }
    return null;
  };

  const stopFishing = () => {
    const fishing = state.fishing;
    if (!fishing) return;
    // o peixe é feito de caixinhas da geometria compartilhada: só tirar da cena
    if (fishing.fish) scene.remove(fishing.fish);
    state.fishing = null;
    player.rod.visible = false;
    rod.line.visible = rod.bobber.visible = false;
    bang.visible = false;
    emitRide();
  };

  const cast = (spot: [number, number]) => {
    const t = kit.time.value;
    state.angle = Math.atan2(spot[0] - state.x, spot[1] - state.z);
    state.vx = state.vz = 0;
    state.fishing = {
      phase: 'cast',
      at: t,
      x: spot[0],
      z: spot[1],
      biteAt: t + 0.7 + 2.5 + Math.random() * 4.5,
    };
    player.rod.visible = true;
    rod.line.visible = rod.bobber.visible = true;
    sfx.jump();
    emitRide();
  };

  /** Puxa a linha: na hora da fisgada pega o peixe, senão só recolhe. */
  const reel = () => {
    const fishing = state.fishing;
    if (!fishing) return;
    const t = kit.time.value;
    if (fishing.phase === 'bite') {
      const hidden = inHidden(fishing.x, fishing.z);
      const c = pickCatch(hidden);
      const kg =
        Math.round((c.min + Math.random() * (c.max - c.min)) * (hidden && !c.junk ? 1.3 : 1) * 100) / 100;
      fishing.phase = 'show';
      fishing.at = t;
      bang.visible = false;
      rod.line.visible = rod.bobber.visible = false;
      const fish = catchModel(c.color, Boolean(c.junk));
      fish.scale.setScalar(c.junk ? 1 : 0.7 + Math.min(1, kg / 8) * 0.8);
      scene.add(fish);
      fishing.fish = fish;
      kit.particles.burst([fishing.x, WATER_Y + 0.2, fishing.z], ['#ffffff', '#9be7ff', '#cdeeff'], 16, 2.6);
      sfx.catch();
      events.onCatch?.({ name: c.name, kg, emoji: c.emoji, junk: Boolean(c.junk) });
      emitRide();
    } else if (fishing.phase === 'show') stopFishing();
    else {
      if (fishing.phase === 'wait') events.onHint?.('Nada beliscou ainda... espera o "Fisgou!"');
      stopFishing();
    }
  };

  const updateFishing = (t: number) => {
    const fishing = state.fishing;
    if (!fishing) return;
    const p = player;
    const [right, left] = [p.arms[1], p.arms[0]];
    const base = p.root.position.y;
    // sentado no barco, vira o corpo pro lado da boia
    if (state.mount instanceof Boat) {
      const want = Math.atan2(fishing.x - state.x, fishing.z - state.z);
      p.root.rotateY(want - state.mount.angle);
      p.torso.rotation.x = 0;
    }
    if (fishing.phase === 'show') {
      // mostra o peixe com os dois braços pra cima
      left.rotation.set(-2.9, 0, -0.2);
      right.rotation.set(-2.9, 0, 0.2);
      p.rod.visible = false;
      const fish = fishing.fish!;
      fish.position.set(state.x, base + 3.1 + Math.sin(t * 6) * 0.05, state.z);
      fish.rotation.set(0, state.angle + Math.PI / 2 + Math.sin(t * 9) * 0.25, Math.sin(t * 12) * 0.15);
      if (t - fishing.at > 2.2) stopFishing();
      return;
    }
    const since = t - fishing.at;
    // a vara: lança de trás pra frente e depois fica esperando
    const throwK = fishing.phase === 'cast' ? Math.min(1, since / 0.6) : 1;
    right.rotation.set(-2.6 + throwK * 1.75 + (fishing.phase === 'bite' ? Math.sin(t * 30) * 0.06 : 0), 0, 0);
    left.rotation.set(-0.7, 0, -0.15);
    p.root.updateMatrixWorld(true);
    const tip = new THREE.Vector3(0, -2.95, 0).applyMatrix4(p.rod.matrixWorld);
    const water = new THREE.Vector3(fishing.x, WATER_Y + 0.02, fishing.z);
    if (fishing.phase === 'cast') {
      const k = Math.max(0, (since - 0.25) / 0.55);
      if (k <= 0) rod.bobber.position.copy(tip);
      else {
        rod.bobber.position.lerpVectors(tip, water, Math.min(1, k));
        rod.bobber.position.y += Math.sin(Math.min(1, k) * Math.PI) * 2;
      }
      if (k >= 1) {
        fishing.phase = 'wait';
        kit.particles.burst([water.x, WATER_Y + 0.1, water.z], ['#ffffff', '#9be7ff'], 8, 1.4);
        sfx.splash();
      }
    } else {
      const dip = fishing.phase === 'bite' ? 0.08 + Math.abs(Math.sin(t * 16)) * 0.16 : 0;
      rod.bobber.position.set(water.x, water.y + Math.sin(t * 2.2) * 0.04 - dip, water.z);
      if (fishing.phase === 'wait' && t > fishing.biteAt) {
        fishing.phase = 'bite';
        fishing.at = t;
        bang.visible = true;
        sfx.bite();
        kit.particles.burst([water.x, WATER_Y + 0.1, water.z], ['#ffffff', '#9be7ff'], 10, 1.8);
        emitRide();
      } else if (fishing.phase === 'bite' && since > 1.4) {
        // demorou: o peixe comeu a isca e foi embora
        fishing.phase = 'wait';
        fishing.at = t;
        fishing.biteAt = t + 2 + Math.random() * 3.5;
        bang.visible = false;
        events.onHint?.('Escapou! Fica de olho no "Fisgou!" e puxa rápido.');
        emitRide();
      }
    }
    bang.position.set(state.x, base + 3.2, state.z);
    stretchLine(rod.line, tip, rod.bobber.position);
  };

  /** Dá um peixe do balde pro bicho do lado: ele pula, faz barulho e solta coração. */
  const feed = (animal: Animal) => {
    if (state.bag <= 0) return;
    state.bag--;
    animal.hop();
    (ANIMAL_SOUND[animal.kind] ?? sfx.talk)();
    const y = groundHeight(animal.x, animal.z);
    kit.particles.burst([animal.x, y + 1.6, animal.z], ['#ff4d6d', '#ff7eb6', '#ffd1e3'], 14, 2);
    kit.particles.burst([animal.x, y + 0.6, animal.z], ['#c9d6e3', '#8aa0a8'], 6, 1.2);
    events.onFeed?.(ANIMAL_NAME[animal.kind] ?? 'o bicho');
    state.rideKey = '';
    emitRide();
  };

  const extra = () => {
    if (state.mode !== 'play' || state.paused) return;
    if (state.fishing) reel();
    else if (state.fishSpot) cast(state.fishSpot);
    else if (state.feedTarget) feed(state.feedTarget);
  };

  const action = () => {
    if (state.mode !== 'play' || state.paused) return;
    if (state.fishing) {
      reel();
      return;
    }
    const mount = state.mount;
    if (state.attraction) {
      sfx.whee();
      state.wheeAt = kit.time.value;
    } else if (mount instanceof Boat) {
      mount.splash();
      sfx.splash();
    } else if (mount instanceof Buggy) {
      mount.honk(kit.time.value);
      sfx.horn();
    } else if (mount) {
      mount.hop();
      SOUND[mount.kind as RideKind]?.();
    } else if (state.y < 0.01) {
      state.vy = 7.5;
      sfx.jump();
    }
  };

  /** Desce do bicho/bugue/barco. `force` = desce mesmo sem lugar bom (pra trocar de brinquedo). */
  const dismount = (force = false) => {
    const mount = state.mount;
    if (!mount) return true;
    const radius = mount instanceof Buggy || mount instanceof Boat ? mount.radius : mount.spec.radius;
    let spot: [number, number] | null = null;
    if (mount instanceof Boat) {
      // do barco: procura chão firme (ou o deque) em volta, cada vez mais longe
      for (let r = radius + 0.6; r < 4.6 && !spot; r += 0.5) {
        for (let k = 0; k < 16; k++) {
          const a = mount.angle + (k / 16) * Math.PI * 2;
          const ox = mount.x + Math.cos(a) * r;
          const oz = mount.z + Math.sin(a) * r;
          if (canStand(ox, oz, 0.5) && (bridgeAt(ox, oz) || waterDistance(ox, oz) > 0.5)) {
            spot = [ox, oz];
            break;
          }
        }
      }
      if (!spot && !force) {
        events.onHint?.('Encoste o barco na margem ou no deque pra descer');
        return false;
      }
    } else {
      // desce do lado, onde der pra pisar
      const s = Math.sin(mount.angle);
      const c = Math.cos(mount.angle);
      const r = radius + 0.7;
      const options: [number, number][] = [
        [mount.x + c * r, mount.z - s * r],
        [mount.x - c * r, mount.z + s * r],
        [mount.x - s * r, mount.z - c * r],
        [mount.x + s * r, mount.z + c * r],
      ];
      spot = options.find(([ox, oz]) => canStand(ox, oz, 0.4)) ?? null;
    }
    const [x, z] = spot ?? [mount.x, mount.z];
    state.x = x;
    state.z = z;
    state.vx = state.vz = 0;
    if (mount instanceof Buggy || mount instanceof Boat) mount.ridden = false;
    else mount.release();
    state.mount = null;
    player.root.quaternion.identity();
    sfx.close();
    return true;
  };

  const toggleRide = () => {
    if (state.mode !== 'play' || state.paused) return;
    if (state.fishing) reel();
    else if (state.attraction) leaveAttraction();
    else if (state.mount) dismount();
    else if (nearAttraction()) board(nearAttraction()!);
    else if (state.mountable) {
      const target = state.mountable;
      state.mount = target;
      target.ridden = true;
      if (target instanceof Buggy) sfx.engine();
      else if (target instanceof Boat) sfx.splash();
      else SOUND[target.kind as RideKind]?.();
      state.mountable = null;
    }
    emitRide();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (key === ' ' && !event.repeat) action();
    if (key === 'f' && !event.repeat) toggleRide();
    if (key === 'g' && !event.repeat) extra();
    keys.add(key);
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
  const onBlur = () => keys.clear();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  let portrait = false;
  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    portrait = camera.aspect < 0.9;
    camera.fov = portrait ? 66 : 55;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const UP = new THREE.Vector3(0, 1, 0);
  const followOffset = () => {
    const base = portrait ? new THREE.Vector3(0, 9, 14) : new THREE.Vector3(0, 6.6, 12.5);
    if (state.attraction) base.multiplyScalar(state.attraction.view);
    else if (state.mount instanceof Buggy) base.multiplyScalar(1.3);
    else if (state.mount instanceof Boat) base.multiplyScalar(1.2);
    else if (state.mount)
      base.multiplyScalar(state.mount.kind === 'cavalo' || state.mount.kind === 'vaca' ? 1.18 : 1.08);
    return base.applyAxisAngle(UP, state.yaw);
  };

  // arrastar na tela (ou com o mouse) gira a câmera em volta do boneco
  const drag = { id: -1, x: 0 };
  const onPointerDown = (event: PointerEvent) => {
    drag.id = event.pointerId;
    drag.x = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== drag.id) return;
    state.yaw -= (event.clientX - drag.x) * (event.pointerType === 'touch' ? 0.009 : 0.006);
    drag.x = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId === drag.id) drag.id = -1;
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  const lookTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const orbitPos = new THREE.Vector3();
  const orbitLook = new THREE.Vector3(4, 4, -6);
  const seat = new THREE.Vector3();
  const seatQuat = new THREE.Quaternion();
  const forward = new THREE.Vector3();

  /** Sobe a câmera se o morro ficar entre ela e o boneco. */
  const clearHills = (target: THREE.Vector3, focusY: number, fx: number, fz: number) => {
    for (const k of [1, 0.75, 0.5, 0.3]) {
      const x = fx + (target.x - fx) * k;
      const z = fz + (target.z - fz) * k;
      const lineY = focusY + (target.y - focusY) * k;
      const need = groundHeight(x, z) + 1.6 - lineY;
      if (need > 0) target.y += need / k;
    }
  };

  const visit = (station: Station, silent = false) => {
    if (state.visited.has(station.id)) return;
    state.visited.add(station.id);
    hooks.get(station.id)?.forEach((hook) => hook());
    if (!silent) events.onVisit(station);
  };

  const pose = (sitting: number, t: number, moving: number, k: number) => {
    const swing = Math.sin(state.phase) * 0.9 * k * (1 - sitting);
    player.legs[0].rotation.set(swing - sitting * 1.35, 0, -sitting * 0.35);
    player.legs[1].rotation.set(-swing - sitting * 1.35, 0, sitting * 0.35);
    player.arms[0].rotation.x = -swing * 0.8 - sitting * 0.9;
    player.arms[1].rotation.x = swing * 0.8 - sitting * 0.9;
    player.arms[0].rotation.z = state.y > 0 ? -0.6 : -0.05;
    player.arms[1].rotation.z = state.y > 0 ? 0.6 : 0.05;
    player.body.position.y = sitting ? 0 : Math.abs(Math.sin(state.phase)) * 0.1 * k;
    player.torso.scale.y = 1 + Math.sin(t * 2.5) * 0.015 * (1 - k);
    player.head.rotation.y = (1 - k) * Math.sin(t * 0.6) * 0.35;
    void moving;
  };

  const readInput = () => {
    let ix = state.joyX;
    let iz = state.joyZ;
    if (keys.has('arrowleft') || keys.has('a')) ix -= 1;
    if (keys.has('arrowright') || keys.has('d')) ix += 1;
    if (keys.has('arrowup') || keys.has('w')) iz -= 1;
    if (keys.has('arrowdown') || keys.has('s')) iz += 1;
    const length = Math.hypot(ix, iz);
    if (length > 1) {
      ix /= length;
      iz /= length;
    }
    if (keys.has('q')) state.yaw += 0.03;
    if (keys.has('r')) state.yaw -= 0.03;
    if (state.mode !== 'play' || state.paused) return [0, 0];
    // a direção é relativa à câmera
    const c = Math.cos(state.yaw);
    const s = Math.sin(state.yaw);
    return [ix * c + iz * s, -ix * s + iz * c];
  };

  const step = (dt: number, t: number) => {
    const [ix, iz] = readInput();
    const boost = keys.has('shift');
    const mount = state.mount;
    const attraction = state.attraction;
    let groundY = 0;

    if (attraction) {
      // no brinquedo: o boneco vai junto com a cadeirinha
      attraction.seat.updateWorldMatrix(true, false);
      attraction.seat.getWorldPosition(seat);
      attraction.seat.getWorldQuaternion(seatQuat);
      player.root.position.copy(seat);
      player.root.quaternion.copy(seatQuat);
      state.x = seat.x;
      state.z = seat.z;
      groundY = groundHeight(seat.x, seat.z);
      pose(1, t, 0, 0);
      const thrill = attraction.thrill;
      const cheer = t - state.wheeAt < 1 ? 1 : thrill;
      player.arms[0].rotation.set(-0.75 - 2.25 * cheer, 0, -0.3 * cheer);
      player.arms[1].rotation.set(-0.75 - 2.25 * cheer, 0, 0.3 * cheer);
      player.torso.rotation.x = 0;
      player.head.rotation.y = 0;
      if (thrill > 0.85 && state.lastThrill <= 0.85 && t - state.wheeAt > 3) {
        sfx.whee();
        state.wheeAt = t;
      }
      state.lastThrill = thrill;
    } else if (mount instanceof Buggy || mount instanceof Boat) {
      if (mount instanceof Boat && state.fishing) {
        // pescando o barco fica parado; remar recolhe a linha
        if (Math.hypot(ix, iz) > 0.2 && state.fishing.phase !== 'show') stopFishing();
        mount.idle(t, dt);
      } else mount.drive(dt, t, ix, iz, boost);
      state.x = mount.x;
      state.z = mount.z;
      state.angle = mount.angle;
      mount.seatPosition(seat);
      player.root.position.copy(seat);
      player.root.quaternion.copy(mount.root.quaternion);
      groundY = mount instanceof Boat ? seat.y + 0.4 : groundHeight(state.x, state.z);
      pose(1, t, 0, 0);
      if (mount instanceof Boat) {
        // remando
        const stroke = mount.stroke;
        player.arms[0].rotation.set(-1.2 + stroke * 0.45, 0, -0.2);
        player.arms[1].rotation.set(-1.2 + stroke * 0.45, 0, 0.2);
        player.torso.rotation.x = stroke * 0.12;
      } else {
        player.arms[0].rotation.x = -1.15;
        player.arms[1].rotation.x = -1.15;
      }
      player.head.rotation.y = -mount.steer * 0.6;
      if (state.fishing) updateFishing(t);
    } else {
      const speed = mount ? (mount.spec.ride ?? 7) * (boost ? 1.15 : 1) : boost ? 11 : 7.5;
      const blend = 1 - Math.exp(-dt * (mount ? 4 : 10));
      state.vx += (ix * speed - state.vx) * blend;
      state.vz += (iz * speed - state.vz) * blend;
      const body = mount ?? state;
      const radius = mount ? mount.spec.radius : 0.4;
      const nx = body.x + state.vx * dt;
      const nz = body.z + state.vz * dt;
      const margin = mount ? 0.5 : 0.2;
      if (canStand(nx, nz, margin)) {
        body.x = nx;
        body.z = nz;
      } else if (canStand(nx, body.z, margin)) body.x = nx;
      else if (canStand(body.x, nz, margin)) body.z = nz;
      collide(kit, body, radius);
      state.x = body.x;
      state.z = body.z;

      const moving = Math.hypot(state.vx, state.vz);
      if (moving > 0.4) {
        const target = Math.atan2(state.vx, state.vz);
        let diff = target - state.angle;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        state.angle += diff * Math.min(1, dt * (mount ? 6 : 12));
      }
      groundY = groundHeight(state.x, state.z);

      if (mount) {
        mount.angle = state.angle;
        mount.animate(t, dt, moving);
        state.phase += dt * 3;
        player.root.position.set(
          state.x,
          groundY + mount.y + mount.rig.body.position.y + mount.spec.seat! - 0.62,
          state.z,
        );
        player.root.rotation.set(0, state.angle, 0);
        player.root.translateZ(-0.05);
        pose(1, t, moving, 0);
        player.arms[0].rotation.x = -0.7;
        player.arms[1].rotation.x = -0.7;
        player.torso.rotation.x = Math.min(0.25, moving * 0.02);
      } else {
        player.torso.rotation.x = 0;
        state.vy -= 22 * dt;
        state.y = Math.max(0, state.y + state.vy * dt);
        if (state.y === 0) state.vy = 0;
        const k = Math.min(1, moving / 7.5);
        state.phase += dt * (4 + moving * 1.4);
        player.root.position.set(state.x, groundY + state.y, state.z);
        player.root.rotation.set(0, state.angle, 0);
        pose(0, t, moving, k);
        if (moving > 3 && state.y === 0 && t > state.nextDust) {
          state.nextDust = t + 0.13;
          kit.particles.spawn([state.x - state.vx * 0.04, groundY + 0.1, state.z - state.vz * 0.04], {
            color: '#e9dcc2',
            velocity: [(Math.random() - 0.5) * 0.8, 0.8, (Math.random() - 0.5) * 0.8],
            size: 0.18,
            grow: 1.2,
            life: 0.5,
            opacity: 0.8,
          });
        }
      }
    }
    if (mount !== buggy) buggy.idle(t, dt);
    if (mount !== boat) boat.idle(t, dt);

    const blinking = t > state.blinkAt && t < state.blinkAt + 0.12;
    if (t > state.blinkAt + 0.12) state.blinkAt = t + 2 + Math.random() * 3;
    player.eyes.forEach((eye) => (eye.scale.y = blinking ? 0.02 : 0.14));
    player.shadow.visible = !mount && !attraction;
    player.shadow.position.set(state.x, groundY + 0.05, state.z);
    player.shadow.scale.setScalar(1 - Math.min(0.5, state.y * 0.15));

    // bichos
    const busy = Boolean(mount || attraction);
    Animal.eye.copy(camera.position);
    animals.forEach((animal) => animal.update(t, dt, { x: state.x, z: state.z, busy }));
    // moradores e a cancela da portaria
    people.update(t, dt, state, camera.position, sfx.talk);
    gatehouse(dt, Math.hypot(state.x - 0.5, state.z - 111.4) < 7);

    if (state.mode === 'play') {
      // o que dá pra montar ali do lado
      if (!mount && !attraction) {
        let best: Mount | null = null;
        let bestD = Infinity;
        for (const animal of rideable) {
          const d = Math.hypot(animal.x - state.x, animal.z - state.z) - animal.spec.radius;
          if (d < 1.7 && d < bestD) {
            best = animal;
            bestD = d;
          }
        }
        const dBuggy = Math.hypot(buggy.x - state.x, buggy.z - state.z) - buggy.radius;
        if (dBuggy < 1.8 && dBuggy < bestD) {
          best = buggy;
          bestD = dBuggy;
        }
        const dBoat = Math.hypot(boat.x - state.x, boat.z - state.z) - boat.radius;
        if (dBoat < 2.0 && dBoat < bestD) best = boat;
        state.mountable = best;
        // bicho ali do lado que pode ganhar um peixe do balde
        let feed: Animal | null = null;
        if (state.bag > 0 && !nearAttraction()) {
          let near = 2.6;
          for (const animal of animals) {
            const d = Math.hypot(animal.x - state.x, animal.z - state.z);
            if (d < near) {
              near = d;
              feed = animal;
            }
          }
        }
        state.feedTarget = feed;
        state.fishSpot = null;
      } else {
        state.feedTarget = null;
        // no barco: dá pra pescar onde tiver água em volta
        if (mount instanceof Boat && !state.fishing && t > state.nextFishCheck) {
          state.nextFishCheck = t + 0.3;
          state.fishSpot = castSpot();
        } else if (!(mount instanceof Boat)) state.fishSpot = null;
      }
      emitRide();

      // estação mais perto
      let near: Station | null = null;
      let best = attraction ? -1 : Infinity;
      for (const station of STATIONS) {
        const d = Math.hypot(station.x - state.x, station.z - state.z);
        const radius = (station.kind === 'milestone' ? 2.6 : 3.0) + (mount ? 1 : 0);
        if (d < radius && d < best) {
          best = d;
          near = station;
        }
      }
      if (near) visit(near);
      if ((near?.id ?? '') !== state.nearId) {
        state.nearId = near?.id ?? '';
        events.onNear(near);
      }
      // ovos de ouro
      const reach = mount instanceof Buggy || mount instanceof Boat ? 2.4 : mount ? 1.9 : 1.4;
      eggs.forEach((egg, index) => {
        if (egg.collected) return;
        const [ex, ez] = EGGS[index];
        if (Math.hypot(ex - state.x, ez - state.z) < reach) {
          egg.collect();
          events.onCollect(index);
        }
      });
    }

    // plaquinhas aparecem quando chega perto
    labels.forEach(({ sprite, station, base }) => {
      const d = Math.hypot(station.bx - state.x, station.bz - state.z);
      sprite.scale
        .copy(base)
        .multiplyScalar(Math.max(0.45, Math.min(1, (d - 2) / 10)) * (portrait ? 1.3 : 1));
      const far = station.kind === 'milestone' ? 13 : station.kind === 'project' ? 24 : 36;
      const opacity = state.mode === 'intro' ? 0 : Math.max(0, Math.min(1, (far - d) / 5));
      const tooClose = camera.position.distanceTo(sprite.position) < 6;
      sprite.material.opacity = tooClose ? 0 : opacity;
      sprite.visible = sprite.material.opacity > 0.02;
    });

    // câmera
    const offset = followOffset();
    orbitPos.set(4 + Math.cos(t * 0.08) * S(78), 52, -6 + Math.sin(t * 0.08) * S(78));
    const focusY = groundY + 1.6;
    camPos.set(state.x + offset.x, groundY + offset.y, state.z + offset.z);
    clearHills(camPos, focusY, state.x, state.z);
    lookTarget.set(
      state.x - Math.sin(state.yaw) * 5,
      groundY + 2.1 + (mount ? 0.8 : 0),
      state.z - Math.cos(state.yaw) * 5,
    );
    if (attraction && state.attraction) {
      if (attraction.chase) {
        // montanha-russa: câmera atrás do carrinho, olhando pra frente da pista
        forward.set(0, 0, 1).applyQuaternion(seatQuat);
        const behind = forward
          .clone()
          .setY(forward.y * 0.5)
          .normalize();
        behind.applyAxisAngle(UP, state.yaw - state.boardYaw);
        camPos
          .copy(seat)
          .addScaledVector(behind, -6.2)
          .add(new THREE.Vector3(0, 2.9, 0));
        lookTarget
          .copy(seat)
          .addScaledVector(forward, 5)
          .add(new THREE.Vector3(0, 1.3, 0));
      } else {
        camPos.copy(seat).add(offset);
        lookTarget.copy(seat).add(new THREE.Vector3(0, 1.6, 0));
      }
      const floor = groundHeight(camPos.x, camPos.z) + 1.4;
      if (camPos.y < floor) camPos.y = floor;
    }
    if (state.mode === 'intro') {
      orbitPos.y = Math.max(orbitPos.y, groundHeight(orbitPos.x, orbitPos.z) + 18);
      camera.position.copy(orbitPos);
      camera.lookAt(orbitLook);
    } else if (state.mode === 'fly') {
      state.flyT = Math.min(1, state.flyT + dt / 2.6);
      const e = state.flyT < 0.5 ? 4 * state.flyT ** 3 : 1 - (-2 * state.flyT + 2) ** 3 / 2;
      camera.position.lerpVectors(orbitPos, camPos, e);
      camera.lookAt(new THREE.Vector3().lerpVectors(orbitLook, lookTarget, e));
      if (state.flyT >= 1) state.mode = 'play';
    } else {
      const follow = attraction?.chase ? 9 : attraction ? 4 : mount instanceof Buggy ? 6 : 5;
      camera.position.lerp(camPos, 1 - Math.exp(-dt * follow));
      const floor = groundHeight(camera.position.x, camera.position.z) + 1.4;
      if (camera.position.y < floor) camera.position.y = floor;
      camera.lookAt(lookTarget);
    }
  };

  // hora do dia (anda suave quando troca o modo)
  const HOURS: Record<TimeMode, number | null> = { auto: null, dia: 13, tarde: 17.75, noite: 22.5 };
  const targetHour = () => HOURS[state.timeMode] ?? localHour();
  let lastNight = -1;
  const updateTime = (dt: number, t: number) => {
    const goal = targetHour();
    let diff = goal - state.hour;
    diff = ((diff + 36) % 24) - 12;
    state.hour = (state.hour + diff * Math.min(1, dt * 1.2) + 24) % 24;
    sky.update(state.hour, camera.position, t);
    kit.env.dusk = sky.twilight;
    const night = 1 - sky.day;
    if (Math.abs(night - lastNight) > 0.002) {
      lastNight = night;
      applyNight(kit, night);
      const isNight = night > 0.5;
      if (isNight !== state.night) {
        state.night = isNight;
        events.onNight?.(isNight);
      }
    }
  };
  state.night = 1 - sky.day > 0.5;

  const clock = new THREE.Clock();
  let frame = 0;
  let fps = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    const raw = clock.getDelta();
    fps += (1 / Math.max(raw, 0.001) - fps) * 0.05;
    const dt = Math.min(0.05, raw);
    kit.time.value += dt;
    const t = kit.time.value;
    kit.ticks.forEach((tick) => tick(t, dt));
    kit.particles.update(dt);
    step(dt, t);
    updateTime(dt, t);
    renderer.render(scene, camera);
  };
  updateTime(1, 0);
  events.onNight?.(state.night);
  loop();

  return {
    start: () => {
      if (state.mode === 'intro') {
        state.mode = 'fly';
        state.flyT = 0;
      }
    },
    setJoystick: (x, z) => {
      state.joyX = x;
      state.joyZ = z;
    },
    action,
    toggleRide,
    ride: (id) => {
      if (state.mode !== 'play') return;
      const attraction = attractions.find((a) => a.station.id === id);
      if (!attraction || state.attraction === attraction) return;
      if (state.attraction) leaveAttraction();
      board(attraction);
    },
    setPaused: (paused) => {
      state.paused = paused;
      if (paused) keys.clear();
    },
    setTimeMode: (mode) => {
      state.timeMode = mode;
    },
    setBag: (count) => {
      state.bag = count;
    },
    extra,
    setOutfit: (next) => {
      stopFishing();
      const old = player;
      scene.remove(old.root, old.shadow);
      // (as geometrias do boneco antigo podem ser as compartilhadas; ficam aí, é pouca coisa)
      old.shadow.geometry.dispose();
      player = buildPlayer(scene, next);
      player.root.position.copy(old.root.position);
      player.root.quaternion.copy(old.root.quaternion);
      kit.particles.burst(
        [state.x, groundHeight(state.x, state.z) + 1.2, state.z],
        ['#a78bfa', '#ffd166', '#ff7eb6', '#ffffff'],
        24,
        3,
      );
      sfx.collect();
    },
    restore: (visited, collected) => {
      visited.forEach((id) => {
        const station = STATIONS.find((s) => s.id === id);
        if (station) visit(station, true);
      });
      collected.forEach((index) => eggs[index]?.collect(true));
    },
    player: () => ({ x: state.x, z: state.z, angle: state.angle }),
    teleport: (x, z) => {
      if (state.attraction) leaveAttraction();
      const mount = state.mount;
      if (mount) {
        mount.x = x;
        mount.z = z;
      }
      state.x = x;
      state.z = z;
      camera.position.set(x, groundHeight(x, z), z).add(followOffset());
    },
    locate: (kind) => {
      if (kind === 'bugue') return { x: buggy.x, z: buggy.z };
      if (kind === 'barco') return { x: boat.x, z: boat.z };
      const animal = rideable.find((a) => a.kind === kind && !a.ridden);
      return animal ? { x: animal.x, z: animal.z } : null;
    },
    stats: () => ({
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      fps: Math.round(fps),
      mode: state.mode,
      hour: Math.round(state.hour * 10) / 10,
      timeMode: state.timeMode,
    }),
    dispose: () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.Sprite
        ) {
          object.geometry?.dispose();
          const material = object.material as THREE.Material | THREE.Material[];
          (Array.isArray(material) ? material : [material]).forEach((m) => {
            (m as THREE.MeshBasicMaterial).map?.dispose();
            m.dispose();
          });
        }
      });
      disposeMaterials();
      renderer.dispose();
    },
  };
};
