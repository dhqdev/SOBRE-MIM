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
import { buildPark, stringLights, type Attraction } from './park';
import { Sky, localHour } from './sky';
import { sfx } from './audio';
import {
  BRIDGES,
  LAKE,
  POND,
  STREAM_PATH,
  bridgeAt,
  canStand,
  groundHeight,
  terrainHeight,
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
};

/* ---------------------------------------------------------------- boneco */

const buildPlayer = (scene: THREE.Scene) => {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  scene.add(root);
  const skin = lambert('#e2a878');
  const hoodie = lambert('#7c3aed');
  const jeans = lambert('#33407a');

  const legs = [-0.18, 0.18].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side, 0.78, 0);
    body.add(hip);
    box(hip, [0.3, 0.62, 0.32], [0, -0.31, 0], jeans);
    box(hip, [0.32, 0.16, 0.42], [0, -0.7, 0.05], lambert('#f4f0ff'));
    return hip;
  });
  const torso = new THREE.Group();
  torso.position.y = 0.78;
  body.add(torso);
  box(torso, [0.8, 0.78, 0.46], [0, 0.4, 0], hoodie);
  box(torso, [0.5, 0.18, 0.47], [0, 0.18, 0.01], lambert('#6d28d9'));
  box(torso, [0.16, 0.16, 0.05], [0.18, 0.58, 0.24], glow('#ffd166'));
  const arms = [-0.52, 0.52].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side, 0.72, 0);
    torso.add(shoulder);
    box(shoulder, [0.24, 0.62, 0.28], [0, -0.28, 0], hoodie);
    box(shoulder, [0.22, 0.18, 0.24], [0, -0.66, 0], skin);
    return shoulder;
  });
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
  // chapéu de palha, porque agora é sítio
  const hat = new THREE.Group();
  hat.position.y = 0.78;
  head.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.06, 14), lambert('#e6c36a'));
  hat.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.34, 12), lambert('#e6c36a'));
  crown.position.y = 0.18;
  hat.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.08, 12), lambert('#7c3aed'));
  band.position.y = 0.06;
  hat.add(band);
  const shadowGeometry = new THREE.CircleGeometry(0.55, 12);
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadow = new THREE.Mesh(
    shadowGeometry,
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.3, depthWrite: false }),
  );
  scene.add(shadow);
  eyes.forEach(keep);
  bake(root);
  return { root, body, torso, head, legs, arms, eyes, shadow };
};

/* ------------------------------------------------------------------ mundo */

const buildWorld = (kit: Kit) => {
  const mobile = kit.env.mobile;
  const rand = seeded(1234);
  const byId = Object.fromEntries(STATIONS.map((s) => [s.id, s]));

  // chão pintado: terreiro, roças, chiqueiro, pasto e feira
  const FIELDS = {
    milho: { x: -22, z: 35, w: 10, d: 7 },
    girassol: { x: 25, z: 40, w: 10, d: 7 },
    abobora: { x: -9, z: 29.5, w: 7, d: 5 },
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
    { x: -27, z: -50, r: 9, color: '#8fc95a' },
    { ...FIELDS.milho, w: FIELDS.milho.w + 1, d: FIELDS.milho.d + 1, color: '#8a5a36' },
    { ...FIELDS.girassol, w: FIELDS.girassol.w + 1, d: FIELDS.girassol.d + 1, color: '#8a5a36' },
    { ...FIELDS.abobora, w: FIELDS.abobora.w + 1, d: FIELDS.abobora.d + 1, color: '#8a5a36' },
    { x: 14, z: -26, r: 4.5, color: '#c9a46b' },
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
  B.hayBale(kit, -21.5, -45.5, 0.4);

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
  B.overlook(kit, -7, 61.5, -7, 40);
  B.signpost(kit, 4, 73.5, [
    { text: 'Terreiro', toX: YARD.x, toZ: YARD.z },
    { text: 'Garagem', toX: 8, toZ: 39 },
    { text: 'Lago', toX: LAKE.x, toZ: LAKE.z },
  ]);
  B.signpost(kit, 5.5, -1, [
    { text: 'Casa', toX: -17, toZ: -24 },
    { text: 'Parque', toX: PARK.x, toZ: PARK.z },
    { text: 'Celeiro', toX: 14, toZ: -31 },
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
  B.fairArch(kit, 14.6, 0.4, 6, -5, 'PARQUE DOS PROJETOS');
  B.arcade(kit, 16.4, 5.4, 18.5, 1.2);
  const parkPosts: [number, number][] = [];
  for (let px = 18; px <= 52; px += 5.7) parkPosts.push([px, parkPosts.length % 2 ? 3.7 : -0.7]);
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
  B.clothesline(kit, -28, -24.5, 0.9);
  B.chickenCoop(kit, -6, -34, 0, -24);
  B.tractor(kit, 22.5, -35, 2.4);
  B.hayBale(kit, 7.5, -36.5, 0.3);
  B.hayBale(kit, 9.2, -38.3, 1.2);
  B.hayBale(kit, 20, -27, 0, false);
  B.hayBale(kit, 20.2, -28.3, 0.2, false);
  B.crates(kit, -24, -8);
  B.crates(kit, 30.5, -14);
  B.picnicTable(kit, 52.5, 37, 0.6);
  B.picnicTable(kit, -44, 25, 0.2);

  // roças, moinho e garagem
  G.field(kit, FIELDS.milho, 'milho');
  G.field(kit, FIELDS.girassol, 'girassol');
  G.field(kit, FIELDS.abobora, 'abobora');
  B.scarecrow(kit, FIELDS.milho.x, FIELDS.milho.z + FIELDS.milho.d / 2 + 1.2);
  B.scarecrow(kit, FIELDS.girassol.x + 0.6, FIELDS.girassol.z - FIELDS.girassol.d / 2 - 1.2);
  B.windmill(kit, 16, 29, 4, 29);
  B.garage(kit, 12.2, 39, 5, 40);

  // pomar do outro lado da ponte de tronco
  const orchard: [number, number][] = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) orchard.push([-56 + i * 5.5 + (j % 2) * 1.5, 22 + j * 5]);
  orchard.forEach(([x, z], i) => G.roundTree(kit, x, z, 0.85, true, i));

  // postes de luz pela estrada e pelo terreiro
  const posts: [number, number, boolean][] = [
    [2.3, 64, false],
    [-1.9, 52, false],
    [2.6, 41, !mobile],
    [-2.1, 27, false],
    [3.3, 12.5, true],
    [-3.2, -1, false],
    [7.5, -12, false],
    [-9, -18.5, !mobile],
    [11, 0.5, false],
    [-20, 3.8, false],
    [43.5, 15, false],
    [8, 26, false],
    [-14, 22, false],
    [-30, 10.5, false],
    [-12, -26, false],
    [20, -22, false],
    [58.5, 31, false],
    [62, 4, false],
    [48, 34, false],
    [48, -21, false],
    [57, -42, false],
  ];
  posts.forEach(([x, z, light]) => B.lampPost(kit, x, z, light));

  // o que não pode ser coberto por árvore, pedra ou flor
  const reserved: [number, number, number][] = [
    [GATE.x, GATE.z, 7],
    [0, 70, 6],
    [-7, 61.5, 2.5],
    [YARD.x, YARD.z, 6],
    ...RIDES.map((ride) => [ride.bx, ride.bz, ride.type === 'coaster' ? 15 : 7] as [number, number, number]),
    [55, 2, 6],
    [16.4, 5.4, 2],
    [61.4, 27.5, 3],
    [-17, -24, 8],
    [-30, -14, 5],
    [-22, -1, 5],
    [-22, -1 - 5.5, 6],
    [31, -25, 6],
    [14, -31, 8],
    [22.5, -35, 3],
    [-6, -34, 4],
    [-4, -29, 6],
    [-27, -50, 10],
    [-28, -24.5, 4],
    [16, 29, 3],
    [12.2, 39, 5],
    [7.5, 39.6, 3],
    [-50, 27, 9],
    [52.5, 37, 3],
    [57, -61, 6],
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

  // mata em volta (mais densa perto da serra)
  const trees = mobile ? 110 : 175;
  for (let i = 0; i < trees; i++) {
    const spot = i < trees * 0.45 ? pick(70, 98, 3.2) : pick(12, 78, 4.2);
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
  ].forEach(([x, z]) => G.ipe(kit, x, z, 0.9));
  for (let i = 0; i < (mobile ? 50 : 85); i++) {
    const spot = pick(8, 84, 2, 1.2);
    if (spot) G.bush(kit, spot[0], spot[1], 0.7 + rand() * 0.6, i % 3 === 0);
  }
  for (let i = 0; i < 26; i++) {
    const spot = pick(10, 92, 2.4, 1.2);
    if (spot) G.rock(kit, spot[0], spot[1], 0.5 + rand() * 1.1);
  }
  const flowers: [number, number][] = [];
  const tufts: [number, number][] = [];
  const flowerCount = mobile ? 230 : 420;
  const tuftCount = mobile ? 650 : 1300;
  for (let i = 0; i < 9000 && (flowers.length < flowerCount || tufts.length < tuftCount); i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 86;
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
  L.birds(kit, 6);
  L.clouds(kit, mobile ? 10 : 16, rand);

  // bichos
  const animals: Animal[] = [
    new Animal(kit, 'cavalo', PENS.horses, 0, [0, -45]),
    new Animal(kit, 'cavalo', PENS.horses, 1, [6, -44]),
    new Animal(kit, 'cavalo', PENS.horses, 2, [-1, -48]),
    new Animal(kit, 'vaca', { x: -27, z: -50, r: 8 }, 0),
    new Animal(kit, 'vaca', { x: -27, z: -50, r: 8 }, 1),
    new Animal(kit, 'vaca', { x: -27, z: -50, r: 8 }, 2),
    new Animal(kit, 'porco', PENS.pigs, 0),
    new Animal(kit, 'porco', PENS.pigs, 1),
    new Animal(kit, 'porco', PENS.pigs, 2),
    ...[0, 1, 2, 3, 4].map((v) => new Animal(kit, 'ovelha', PENS.sheep, v)),
    ...[0, 1, 2, 3, 4, 5].map((v) => new Animal(kit, 'galinha', { x: -3, z: -28.5, r: 5 }, v)),
    new Animal(kit, 'cachorro', { x: -8, z: -12, r: 2 }, 0, [-7, -10]),
  ];
  ducks(kit);
  const buggy = new Buggy(kit, 7.4, 39.4, -1.5);
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
  return { hooks, labels, eggs, animals, buggy, boat, attractions };
};

/* ---------------------------------------------------------------- motor */

export const createWorld = (canvas: HTMLCanvasElement, events: WorldEvents): WorldHandle => {
  const mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  textureQuality.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#cdeeff', 90, 300);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.3, 1200);

  const kit = createKit(scene, mobile);
  const sky = new Sky(scene);
  const { hooks, labels, eggs, animals, buggy, boat, attractions } = buildWorld(kit);
  const player = buildPlayer(scene);
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
    }
    const key = `${riding}:${canMount}:${label}`;
    if (key === state.rideKey) return;
    state.rideKey = key;
    events.onRide({ riding, canMount, label });
  };

  const board = (attraction: Attraction) => {
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

  const action = () => {
    if (state.mode !== 'play' || state.paused) return;
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
    if (state.attraction) leaveAttraction();
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
      mount.drive(dt, t, ix, iz, boost);
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
    orbitPos.set(4 + Math.cos(t * 0.08) * 78, 40, -6 + Math.sin(t * 0.08) * 78);
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
