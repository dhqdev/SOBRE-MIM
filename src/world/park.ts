import * as THREE from 'three';
import { terrainHeight } from './terrain';
import {
  bake,
  box,
  faceTo,
  footing,
  group,
  halo,
  instancedFrom,
  lambert,
  lightPool,
  live,
  mesh,
  nightGlow,
  nightLight,
  shared,
  wallRect,
  type Kit,
} from './props';
import { signBoard } from './buildings';
import { imageTexture } from './textures';
import type { RideType, Station } from './stations';

/**
 * Parque dos projetos: cada projeto é um brinquedo, e dá pra andar em todos.
 * Cada brinquedo roda sozinho (pra parecer vivo) e, quando a pessoa embarca,
 * faz uma volta inteira com ela e devolve no ponto de embarque.
 */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 12));
const CYL24 = shared(new THREE.CylinderGeometry(1, 1, 1, 24));
const BALL = shared(new THREE.IcosahedronGeometry(1, 1));
const BULB_COLORS = ['#ffd166', '#ff7eb6', '#5ec8f2', '#c4b5fd', '#5ee26b'];

const smooth = (a: number, b: number, x: number) => {
  const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

export interface Attraction {
  station: Station;
  type: RideType;
  /** Onde a pessoa senta: o boneco copia posição e giro deste objeto. */
  seat: THREE.Object3D;
  /** Câmera atrás do carrinho (montanha-russa) ou girando em volta (o resto). */
  chase: boolean;
  /** Quanto a câmera se afasta. */
  view: number;
  /** 0 = sentadinho, 1 = braços pra cima gritando. */
  thrill: number;
  riding: boolean;
  /** A volta acabou: o motor desembarca a pessoa. */
  done: boolean;
  board: (t: number) => void;
  leave: () => void;
}

/** Relógio de um brinquedo: em loop quando vazio, uma volta só quando tem gente. */
class Cycle {
  riding = false;
  start = 0;
  constructor(
    private length: number,
    private pause: number,
    private offset: number,
  ) {}
  /** Tempo dentro da volta (0 = parado no embarque). */
  at(t: number) {
    if (this.riding) return Math.min(t - this.start, this.length);
    const u = (t + this.offset) % (this.length + this.pause);
    return u > this.length ? 0 : u;
  }
  done(t: number) {
    return this.riding && t - this.start >= this.length;
  }
}

const makeAttraction = (
  station: Station,
  seat: THREE.Object3D,
  cycle: Cycle,
  options: { chase?: boolean; view?: number; onBoard?: (t: number) => void } = {},
) => {
  const attraction: Attraction = {
    station,
    type: station.ride!.type,
    seat,
    chase: options.chase ?? false,
    view: options.view ?? 1.3,
    thrill: 0,
    riding: false,
    done: false,
    board: (t) => {
      attraction.riding = true;
      attraction.done = false;
      cycle.riding = true;
      cycle.start = t;
      options.onBoard?.(t);
    },
    leave: () => {
      attraction.riding = false;
      cycle.riding = false;
    },
  };
  return attraction;
};

/** Cadeirinha vazia: o ponto onde o quadril do boneco fica (`top` = topo do assento). */
const seatAt = (parent: THREE.Object3D, x: number, top: number, z: number, facing = 0) => {
  const seat = new THREE.Object3D();
  seat.position.set(x, top - 0.72, z);
  seat.rotation.y = facing;
  parent.add(seat);
  return seat;
};

/** Cone listrado (telhado de carrossel e de chapéu mexicano). */
const stripedCone = (
  parent: THREE.Object3D,
  radius: number,
  height: number,
  y: number,
  colors: string[],
  pieces = 16,
) => {
  for (let i = 0; i < pieces; i++) {
    const geometry = new THREE.ConeGeometry(
      radius,
      height,
      2,
      1,
      false,
      (i / pieces) * Math.PI * 2,
      (Math.PI * 2) / pieces,
    );
    mesh(parent, geometry, lambert(colors[i % colors.length]), [0, y, 0]);
  }
};

/** Fileira de lampadinhas coloridas num círculo. */
const bulbRing = (
  kit: Kit,
  parent: THREE.Object3D,
  radius: number,
  y: number,
  count: number,
  size = 0.16,
) => {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    box(
      parent,
      [size, size, size],
      [Math.sin(a) * radius, y, Math.cos(a) * radius],
      nightGlow(kit, BULB_COLORS[i % BULB_COLORS.length]),
    );
  }
};

/** Placa do brinquedo com o print do projeto, iluminada de noite. */
const rideSign = (kit: Kit, x: number, z: number, faceX: number, faceZ: number, station: Station) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  const wood = lambert('#2a1650');
  for (const sx of [-1.55, 1.55]) {
    box(g, [0.18, 3.6, 0.18], [sx, 1.8, -0.05], wood);
    box(g, [0.45, 0.3, 0.45], [sx, 0.15, -0.05], lambert('#8d8478'));
  }
  box(g, [3.3, 2.25, 0.14], [0, 2.15, -0.1], wood);
  if (station.image) {
    const picture = new THREE.Mesh(
      new THREE.PlaneGeometry(3.04, 1.9),
      new THREE.MeshBasicMaterial({ map: imageTexture(station.image), toneMapped: false }),
    );
    picture.position.set(0, 2.15, -0.02);
    g.add(picture);
  }
  box(g, [3.3, 0.72, 0.14], [0, 3.62, -0.1], lambert('#7c3aed'));
  signBoard(g, [`${station.ride!.name.toUpperCase()} · ${station.label}`], 3.1, [0, 3.62, -0.02], {
    bg: '#7c3aed',
    color: '#fff7d6',
    size: 70,
    canvas: 1024,
    basic: true,
  });
  // moldura de lampadinhas
  for (let i = 0; i <= 10; i++) {
    const material = nightGlow(kit, i % 2 ? '#ffd166' : '#ff7eb6');
    box(g, [0.12, 0.12, 0.12], [-1.6 + i * 0.32, 4.05, 0], material);
    box(g, [0.12, 0.12, 0.12], [-1.6 + i * 0.32, 1.0, 0], material);
  }
  kit.obstacles.push({ x, z, r: 0.5 });
};

/* -------------------------------------------------------------- carrossel */

const carousel = (kit: Kit, station: Station) => {
  const { bx, bz, x, z } = station;
  const base = group(kit, bx, bz);
  faceTo(base, x, z);
  const plinth = mesh(base, CYL24, lambert('#e8e4f0'), [0, 0.15, 0]);
  plinth.scale.set(4.6, 0.7, 4.6);
  const step = mesh(base, CYL24, lambert('#c9b8f0'), [0, -0.1, 0]);
  step.scale.set(5.1, 0.7, 5.1);
  kit.obstacles.push({ x: bx, z: bz, r: 4.6 });
  lightPool(kit, bx, bz, 8, '#ffcf8a', 0.5);

  const spin = live(new THREE.Group());
  spin.position.set(bx, terrainHeight(bx, bz) + 0.5, bz);
  kit.scene.add(spin);
  const floor = mesh(spin, CYL24, lambert('#a78bfa'), [0, 0.06, 0]);
  floor.scale.set(4.3, 0.14, 4.3);
  const column = mesh(spin, CYL, lambert('#ffd166'), [0, 2.3, 0]);
  column.scale.set(0.7, 4.4, 0.7);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const panel = box(
      spin,
      [0.5, 1.6, 0.06],
      [Math.sin(a) * 0.72, 2.3, Math.cos(a) * 0.72],
      lambert(i % 2 ? '#f4f0ff' : '#ff7eb6'),
    );
    panel.rotation.y = a;
  }
  // telhado listrado com franja e lampadinhas
  stripedCone(spin, 4.8, 1.8, 5.35, ['#8b5cf6', '#ffffff']);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const flap = box(
      spin,
      [1.25, 0.45, 0.08],
      [Math.sin(a) * 4.7, 4.25, Math.cos(a) * 4.7],
      lambert(i % 2 ? '#ffd166' : '#8b5cf6'),
    );
    flap.rotation.y = a;
  }
  bulbRing(kit, spin, 4.78, 4.62, 24);
  bulbRing(kit, spin, 0.75, 3.7, 8, 0.14);
  const top = mesh(spin, BALL, lambert('#ffd166'), [0, 6.45, 0]);
  top.scale.setScalar(0.32);
  box(spin, [0.05, 0.9, 0.05], [0, 6.9, 0], lambert('#3b3350'));
  box(spin, [0.6, 0.35, 0.03], [0.3, 7.15, 0], lambert('#ff7eb6'));

  // cavalinhos
  const coats = ['#ffffff', '#ffd6e8', '#c9e8ff', '#fff1b8', '#e6dcff', '#d8f5d0'];
  const manes = ['#8b5cf6', '#ff4d6d', '#2f86e0', '#ff9f68', '#7c3aed', '#2e9e5b'];
  const horses: THREE.Group[] = [];
  const R = 3.05;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const horse = new THREE.Group();
    horse.position.set(Math.sin(a) * R, 1.2, Math.cos(a) * R);
    horse.rotation.y = a + Math.PI / 2;
    spin.add(horse);
    const coat = lambert(coats[i]);
    const mane = lambert(manes[i]);
    box(horse, [0.5, 0.55, 1.25], [0, 0.55, 0], coat);
    const neck = box(horse, [0.36, 0.75, 0.36], [0, 1.0, 0.5], coat);
    neck.rotation.x = 0.45;
    box(horse, [0.36, 0.38, 0.7], [0, 1.3, 0.8], coat);
    box(horse, [0.1, 0.55, 0.5], [0, 1.25, 0.42], mane);
    box(horse, [0.18, 0.3, 0.12], [0, 0.5, -0.66], mane);
    for (const [lx, lz, tilt] of [
      [-0.16, 0.45, -0.7],
      [0.16, 0.45, -0.4],
      [-0.16, -0.45, 0.6],
      [0.16, -0.45, 0.4],
    ]) {
      const leg = box(horse, [0.13, 0.6, 0.13], [lx, 0.12, lz], coat);
      leg.rotation.x = tilt;
    }
    box(horse, [0.56, 0.08, 0.6], [0, 0.86, -0.05], lambert('#ffd166'));
    box(horse, [0.52, 0.12, 0.5], [0, 0.9, -0.05], mane);
    // o cano dourado passa na frente de quem monta (dá pra segurar)
    const pole = mesh(horse, CYL, lambert('#ffd166'), [0, 1.3, 0.34]);
    pole.scale.set(0.06, 5, 0.06);
    horses.push(horse);
  }
  const seat = seatAt(horses[0], 0, 0.96, -0.05);
  horses.forEach((horse) => bake(horse));
  bake(spin);

  const cycle = new Cycle(24, 4, bx);
  let angle = 0;
  kit.ticks.push((t, dt) => {
    const u = cycle.at(t);
    const speed = 0.62 * smooth(0, 3.5, u) * (1 - smooth(20.5, 24, u));
    angle += speed * dt;
    spin.rotation.y = angle;
    horses.forEach(
      (horse, i) => (horse.position.y = 1.2 + Math.sin(angle * 4 + i * 1.7) * 0.32 * (speed / 0.62)),
    );
  });
  const attraction = makeAttraction(station, seat, cycle, { view: 1.25 });
  kit.ticks.push((t) => (attraction.done = cycle.done(t)));
  return attraction;
};

/* -------------------------------------------------------- chapéu mexicano */

const swing = (kit: Kit, station: Station) => {
  const { bx, bz, x, z } = station;
  const base = group(kit, bx, bz);
  faceTo(base, x, z);
  const plinth = mesh(base, CYL24, lambert('#d8eef8'), [0, 0.1, 0]);
  plinth.scale.set(2.4, 0.6, 2.4);
  const H = 4.9;
  const tower = mesh(base, CYL, lambert('#ffd166'), [0, (H - 0.2) / 2, 0]);
  tower.scale.set(0.42, H - 0.2, 0.42);
  for (let i = 0; i < 4; i++) {
    const ring = mesh(base, CYL, lambert(i % 2 ? '#5ec8f2' : '#ffffff'), [0, 1 + i * 1.05, 0]);
    ring.scale.set(0.47, 0.25, 0.47);
  }
  kit.obstacles.push({ x: bx, z: bz, r: 2.4 });
  lightPool(kit, bx, bz, 8.5, '#bfe8ff', 0.45);

  const top = live(new THREE.Group());
  top.position.set(bx, terrainHeight(bx, bz) + H, bz);
  kit.scene.add(top);
  const spin = new THREE.Group();
  top.add(spin);
  // chapéu com as cores do céu do Flappy
  stripedCone(spin, 3.6, 1.4, 0.75, ['#5ec8f2', '#ffffff']);
  const brim = mesh(spin, CYL24, lambert('#ffd166'), [0, 0.0, 0]);
  brim.scale.set(3.65, 0.22, 3.65);
  bulbRing(kit, spin, 3.68, 0.0, 28);
  const crown = mesh(spin, BALL, lambert('#5ee26b'), [0, 1.55, 0]);
  crown.scale.setScalar(0.35);

  // correntes e cadeirinhas em forma de passarinho
  const template = new THREE.Group();
  for (const cz of [-0.4, 0.4]) box(template, [0.035, 3.0, 0.035], [0, -1.5, cz], lambert('#c8c4d4'));
  box(template, [0.7, 0.42, 0.66], [0, -3.12, 0], lambert('#ffd166'));
  box(template, [0.08, 0.6, 0.62], [-0.33, -2.75, 0], lambert('#ffd166'));
  box(template, [0.18, 0.12, 0.2], [0.42, -3.0, 0.0], lambert('#ff6b35'));
  box(template, [0.12, 0.14, 0.14], [0.3, -2.85, 0.2], lambert('#ffffff'));
  box(template, [0.06, 0.08, 0.08], [0.35, -2.85, 0.24], lambert('#1a1326'));
  box(template, [0.42, 0.08, 0.3], [-0.05, -3.0, 0.4], lambert('#fff1b8'));
  const COUNT = 12;
  const chairs = instancedFrom(template, COUNT);
  kit.scene.add(chairs);
  const R = 3.05;
  const pivots: THREE.Object3D[] = [];
  for (let i = 0; i < COUNT; i++) {
    const a = (i / COUNT) * Math.PI * 2;
    const pivot = new THREE.Object3D();
    pivot.position.set(Math.sin(a) * R, -0.1, Math.cos(a) * R);
    pivot.rotation.order = 'YXZ';
    pivot.rotation.y = a;
    spin.add(pivot);
    pivots.push(pivot);
  }
  // a cadeirinha olha pra frente (+x do pivô); o boneco senta de frente pra ela
  const seat = seatAt(pivots[0], 0, -2.9, 0, Math.PI / 2);
  bake(spin);

  const cycle = new Cycle(26, 4, bz * 3);
  let angle = 0;
  kit.ticks.push((t, dt) => {
    const u = cycle.at(t);
    const run = smooth(0, 6, u) * (1 - smooth(20, 26, u));
    const speed = 1.55 * run;
    angle += speed * dt;
    spin.rotation.y = angle;
    // o chapéu sobe e balança enquanto gira
    top.position.y = terrainHeight(bx, bz) + H + run * 1.1;
    top.rotation.set(Math.sin(u * 0.9) * 0.12 * run, 0, Math.cos(u * 0.9) * 0.12 * run);
    const tilt = Math.min(1.05, Math.atan((speed * speed * 4.2) / 9.8));
    top.updateMatrixWorld(true);
    pivots.forEach((pivot, i) => {
      pivot.rotation.x = -tilt + Math.sin(t * 2 + i) * 0.03 * run;
      pivot.updateMatrixWorld(true);
      chairs.setMatrixAt(i, pivot.matrixWorld);
    });
    chairs.instanceMatrix.needsUpdate = true;
    attraction.thrill = run;
    attraction.done = cycle.done(t);
  });
  const attraction = makeAttraction(station, seat, cycle, { view: 1.5 });
  return attraction;
};

/* ------------------------------------------------------------ barco viking */

const viking = (kit: Kit, station: Station) => {
  const { bx, bz, x, z } = station;
  const base = group(kit, bx, bz);
  faceTo(base, x, z);
  const steel = lambert('#3b3350');
  const P = 7.6;
  box(base, [11, 0.35, 5.2], [0, 0.1, 0], lambert('#8d8478'));
  for (const sz of [-2.1, 2.1]) {
    for (const side of [-1, 1]) {
      const leg = box(base, [0.32, 8.2, 0.32], [side * 2.05, P / 2, sz], steel);
      leg.rotation.z = side * 0.5;
    }
    box(base, [0.5, 0.5, 0.5], [0, P, sz], lambert('#ffd166'));
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      box(
        base,
        [0.14, 0.14, 0.14],
        [-(1 - k) * 3.9 - 0.15, 0.4 + k * (P - 0.6), sz + 0.18],
        nightGlow(kit, BULB_COLORS[i % 5]),
      );
      box(
        base,
        [0.14, 0.14, 0.14],
        [(1 - k) * 3.9 + 0.15, 0.4 + k * (P - 0.6), sz + 0.18],
        nightGlow(kit, BULB_COLORS[(i + 2) % 5]),
      );
    }
  }
  const axle = mesh(base, CYL, steel, [0, P, 0]);
  axle.scale.set(0.2, 4.4, 0.2);
  axle.rotation.x = Math.PI / 2;
  for (const sx of [-4.6, 4.6])
    for (const sz of [-2.1, 2.1]) kit.obstacles.push({ ...worldOf(base, sx, sz), r: 0.5 });
  lightPool(kit, bx, bz, 8, '#ffcf8a', 0.5);

  const pivot = live(new THREE.Group());
  base.updateMatrixWorld(true);
  pivot.position.copy(new THREE.Vector3(0, P, 0).applyMatrix4(base.matrixWorld));
  pivot.rotation.y = base.rotation.y;
  kit.scene.add(pivot);
  const swingGroup = new THREE.Group();
  pivot.add(swingGroup);
  const L = 5.6;
  for (const sz of [-1.2, 1.2]) {
    for (const sx of [-1.6, 1.6]) {
      const arm = box(swingGroup, [0.16, Math.hypot(sx, L), 0.16], [sx / 2, -L / 2, sz], lambert('#e8e4f0'));
      arm.rotation.z = Math.atan2(sx, L);
    }
  }
  // casco do barco
  const hull = lambert('#8a4b2a');
  const trim = lambert('#ffd166');
  box(swingGroup, [7.2, 0.6, 2.2], [0, -L - 0.55, 0], hull);
  box(swingGroup, [6.2, 0.4, 1.4], [0, -L - 0.95, 0], hull);
  for (const side of [-1, 1]) {
    box(swingGroup, [7.4, 0.75, 0.18], [0, -L - 0.05, side * 1.12], hull);
    box(swingGroup, [7.4, 0.12, 0.24], [0, -L + 0.38, side * 1.12], trim);
    for (let i = 0; i < 5; i++) {
      const shield = mesh(
        swingGroup,
        CYL,
        lambert(['#ff4d6d', '#5ec8f2', '#ffd166', '#5ee26b', '#c4b5fd'][i]),
        [-2.6 + i * 1.3, -L - 0.05, side * 1.24],
      );
      shield.scale.set(0.42, 0.08, 0.42);
      shield.rotation.x = Math.PI / 2;
    }
  }
  // proa com cabeça de dragão e popa com rabo
  for (const end of [-1, 1]) {
    const post = box(swingGroup, [0.9, 1.9, 1.6], [end * 3.9, -L + 0.3, 0], hull);
    post.rotation.z = end * -0.35;
  }
  box(swingGroup, [0.8, 0.9, 0.7], [4.6, -L + 1.55, 0], lambert('#2e9e5b'));
  box(swingGroup, [0.7, 0.3, 0.5], [5.15, -L + 1.4, 0], lambert('#2e9e5b'));
  for (const side of [-0.22, 0.22])
    box(swingGroup, [0.14, 0.14, 0.08], [4.85, -L + 1.75, side], lambert('#ffd166'));
  box(swingGroup, [0.5, 1.2, 0.3], [-4.6, -L + 1.6, 0], lambert('#2e9e5b'));
  // mastro e vela
  box(swingGroup, [0.14, 3.2, 0.14], [0, -L + 1.6, 0], lambert('#5a3a20'));
  box(swingGroup, [0.05, 2.0, 2.0], [0.05, -L + 2.1, 0], lambert('#f4f0ff'));
  box(swingGroup, [0.06, 0.5, 2.02], [0.06, -L + 2.6, 0], lambert('#8b5cf6'));
  // bancos
  for (let i = 0; i < 5; i++) {
    const bx2 = -2.8 + i * 1.4;
    box(swingGroup, [0.5, 0.3, 1.9], [bx2, -L + 0.0, 0], lambert('#5a3a20'));
    box(swingGroup, [0.12, 0.55, 1.9], [bx2 - 0.28, -L + 0.3, 0], lambert('#5a3a20'));
  }
  for (let i = 0; i < 12; i++)
    box(
      swingGroup,
      [0.13, 0.13, 0.13],
      [-3.4 + i * 0.62, -L + 0.48, 1.18],
      nightGlow(kit, BULB_COLORS[i % 5]),
    );
  const seat = seatAt(swingGroup, 2.8, -L + 0.17, 0.4, Math.PI / 2);
  bake(swingGroup);

  const cycle = new Cycle(26, 3, bx * 2);
  const period = 4.7;
  kit.ticks.push((t) => {
    const u = cycle.at(t);
    const amplitude = 1.2 * smooth(0, 10, u) * (1 - smooth(17, 26, u));
    swingGroup.rotation.z = Math.sin((u / period) * Math.PI * 2) * amplitude;
    attraction.thrill = smooth(0.7, 1.05, Math.abs(swingGroup.rotation.z));
    attraction.done = cycle.done(t);
  });
  const attraction = makeAttraction(station, seat, cycle, { view: 1.6 });
  return attraction;
};

const worldOf = (g: THREE.Object3D, x: number, z: number) => {
  g.updateMatrixWorld(true);
  const p = new THREE.Vector3(x, 0, z).applyMatrix4(g.matrixWorld);
  return { x: p.x, z: p.z };
};

/* ------------------------------------------------------------ roda-gigante */

const ferris = (kit: Kit, station: Station) => {
  const { bx, bz, x, z } = station;
  const base = group(kit, bx, bz);
  faceTo(base, x, z);
  const steel = lambert('#e8e4f0');
  const H = 9.6;
  const R = 5.8;
  footing(base, 6, 3.6, '#8d8478', 0.25);
  for (const sz of [-1.4, 1.4]) {
    for (const side of [-1, 1]) {
      const leg = box(
        base,
        [0.28, H / Math.cos(0.32) + 0.3, 0.28],
        [side * Math.tan(0.32) * (H / 2), H / 2, sz],
        steel,
      );
      leg.rotation.z = side * 0.32;
    }
  }
  const axle = mesh(base, CYL, lambert('#6d28d9'), [0, H, 0]);
  axle.scale.set(0.35, 3.2, 0.35);
  axle.rotation.x = Math.PI / 2;
  box(base, [1.6, 0.5, 1.4], [0, 0.4, 2.4], lambert('#c9b8f0'));
  for (const sx of [-2.4, 2.4]) kit.obstacles.push({ ...worldOf(base, sx, 0), r: 1.6 });
  lightPool(kit, bx, bz, 8, '#e0c0ff', 0.45);
  nightLight(kit, base, [0, 3.5, 3.5], '#c084fc', 10, 18);

  const wheel = live(new THREE.Group());
  base.updateMatrixWorld(true);
  wheel.position.copy(new THREE.Vector3(0, H, 0).applyMatrix4(base.matrixWorld));
  wheel.rotation.y = base.rotation.y;
  kit.scene.add(wheel);
  const spinner = new THREE.Group();
  wheel.add(spinner);
  const ringGeometry = new THREE.TorusGeometry(R, 0.1, 6, 48);
  for (const sz of [-0.75, 0.75]) mesh(spinner, ringGeometry, lambert('#a78bfa'), [0, 0, sz]);
  const inner = new THREE.TorusGeometry(R * 0.55, 0.07, 5, 36);
  for (const sz of [-0.75, 0.75]) mesh(spinner, inner, lambert('#ffd166'), [0, 0, sz]);
  const COUNT = 10;
  for (let i = 0; i < COUNT * 2; i++) {
    const a = (i / (COUNT * 2)) * Math.PI * 2;
    for (const sz of [-0.75, 0.75]) {
      const spoke = box(spinner, [0.07, R, 0.07], [(Math.cos(a) * R) / 2, (Math.sin(a) * R) / 2, sz], steel);
      spoke.rotation.z = a - Math.PI / 2;
    }
  }
  // lampadinhas no aro da frente: de noite a roda vira um anel colorido
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    box(
      spinner,
      [0.18, 0.18, 0.18],
      [Math.cos(a) * R, Math.sin(a) * R, 0.88],
      nightGlow(kit, BULB_COLORS[i % 5]),
    );
  }
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    box(
      spinner,
      [0.14, 0.14, 0.14],
      [Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, 0.85],
      nightGlow(kit, '#ffd166'),
    );
  }
  const hub = mesh(spinner, CYL, lambert('#6d28d9'), [0, 0, 0]);
  hub.scale.set(0.7, 1.8, 0.7);
  hub.rotation.x = Math.PI / 2;
  bake(spinner);

  // cabines (instanciadas), sempre de pé
  const template = new THREE.Group();
  // cabine aberta: teto, quatro colunas, mureta e banco (dá pra ver quem está dentro)
  box(template, [0.1, 0.4, 0.1], [0, -0.2, 0], lambert('#ffffff'));
  box(template, [1.6, 0.14, 1.6], [0, -0.45, 0], lambert('#ffffff'));
  for (const [cx, cz] of [
    [-0.72, -0.72],
    [0.72, -0.72],
    [-0.72, 0.72],
    [0.72, 0.72],
  ])
    box(template, [0.08, 2.3, 0.08], [cx, -1.6, cz], lambert('#ffffff'));
  box(template, [1.55, 0.12, 1.55], [0, -2.75, 0], lambert('#ffffff'));
  for (const [w, d, cx, cz] of [
    [1.5, 0.08, 0, -0.74],
    [1.5, 0.08, 0, 0.74],
    [0.08, 1.5, -0.74, 0],
    [0.08, 1.5, 0.74, 0],
  ])
    box(template, [w, 0.5, d], [cx, -2.45, cz], lambert('#ffffff'));
  box(template, [1.1, 0.14, 0.5], [0, -2.37, -0.42], lambert('#dcd6ea'));
  const cabins = instancedFrom(template, COUNT);
  const tints = [
    '#ff7eb6',
    '#ffd166',
    '#5ec8f2',
    '#5ee26b',
    '#ff9f68',
    '#c4b5fd',
    '#ff4d6d',
    '#8b5cf6',
    '#2ec4b6',
    '#f4a261',
  ];
  tints.forEach((tint, i) => cabins.setColorAt(i, new THREE.Color(tint)));
  kit.scene.add(cabins);
  const hangers: THREE.Object3D[] = [];
  for (let i = 0; i < COUNT; i++) {
    const hanger = new THREE.Object3D();
    wheel.add(hanger);
    hangers.push(hanger);
  }
  const seats = hangers.map((hanger) => seatAt(hanger, 0, -2.3, -0.42));

  const speed = 0.2;
  let angle = Math.PI * 0.3;
  let boardedAt = 0;
  let current = 0;
  const lowest = () => {
    let best = 0;
    let bestY = Infinity;
    hangers.forEach((hanger, i) => {
      if (hanger.position.y < bestY) {
        bestY = hanger.position.y;
        best = i;
      }
    });
    return best;
  };
  const cycle = new Cycle(1e9, 0, 0);
  const attraction = makeAttraction(station, seats[0], cycle, {
    view: 1.9,
    onBoard: () => {
      current = lowest();
      attraction.seat = seats[current];
      boardedAt = angle;
    },
  });
  kit.ticks.push((t, dt) => {
    angle += speed * dt;
    spinner.rotation.z = angle;
    hangers.forEach((hanger, i) => {
      const a = angle + (i / COUNT) * Math.PI * 2;
      hanger.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      hanger.rotation.z = Math.sin(t * 1.3 + i) * 0.05;
    });
    wheel.updateMatrixWorld(true);
    hangers.forEach((hanger, i) => cabins.setMatrixAt(i, hanger.matrixWorld));
    cabins.instanceMatrix.needsUpdate = true;
    attraction.done = attraction.riding && angle - boardedAt >= Math.PI * 2 - 0.05;
  });
  return attraction;
};

/* --------------------------------------------------------------- elevador */

const dropTower = (kit: Kit, station: Station) => {
  const { bx, bz, x, z } = station;
  const base = group(kit, bx, bz);
  faceTo(base, x, z);
  const H = 18;
  footing(base, 3.6, 3.6, '#8d8478', 0.3);
  box(base, [1.3, H, 1.3], [0, H / 2, 0], lambert('#7c3aed'));
  for (let i = 0; i < 9; i++) box(base, [1.42, 0.25, 1.42], [0, 2 + i * 1.8, 0], lambert('#5b2bb5'));
  box(base, [2.4, 0.8, 2.4], [0, H + 0.4, 0], lambert('#ffd166'));
  const ball = mesh(base, BALL, lambert('#ff7eb6'), [0, H + 1.2, 0]);
  ball.scale.setScalar(0.6);
  // fileiras de luz subindo pela torre
  for (let i = 0; i < 26; i++) {
    for (const [sx, sz] of [
      [0.7, 0.7],
      [-0.7, 0.7],
      [0.7, -0.7],
      [-0.7, -0.7],
    ])
      box(
        base,
        [0.12, 0.12, 0.12],
        [sx, 1.2 + i * 0.66, sz],
        nightGlow(kit, BULB_COLORS[(i + (sx > 0 ? 0 : 2)) % 5]),
      );
  }
  halo(kit, base, [0, H + 1.2, 0], 3);
  kit.obstacles.push({ x: bx, z: bz, r: 2.2 });
  lightPool(kit, bx, bz, 6, '#ffb3d9', 0.5);

  const carriage = live(new THREE.Group());
  base.updateMatrixWorld(true);
  const ground = terrainHeight(bx, bz);
  carriage.position.set(bx, ground, bz);
  carriage.rotation.y = base.rotation.y;
  kit.scene.add(carriage);
  box(carriage, [2.9, 0.3, 2.9], [0, 0.55, 0], lambert('#ffd166'));
  const seats: THREE.Object3D[] = [];
  for (let side = 0; side < 4; side++) {
    const face = new THREE.Group();
    face.rotation.y = (side * Math.PI) / 2;
    carriage.add(face);
    for (const sx of [-0.55, 0.55]) {
      box(face, [0.75, 0.16, 0.6], [sx, 1.0, 1.15], lambert('#2a1650'));
      box(face, [0.75, 1.1, 0.16], [sx, 1.55, 0.86], lambert('#2a1650'));
      const bar = box(face, [0.12, 0.7, 0.12], [sx, 1.85, 1.15], lambert('#ff4d6d'));
      bar.rotation.x = 0.6;
      box(face, [0.5, 0.08, 0.3], [sx, 0.35, 1.5], lambert('#3b3350'));
    }
    if (side === 0) seats.push(seatAt(face, 0.55, 1.08, 1.12));
  }
  bake(carriage);

  const cycle = new Cycle(19, 4, bz * 5);
  kit.ticks.push((t) => {
    const u = cycle.at(t);
    let y = 0;
    let thrill = 0;
    if (u < 2) y = 0;
    else if (u < 10) y = smooth(2, 10, u) * 14.5;
    else if (u < 12.5) {
      y = 14.5;
      thrill = 0.3;
    } else {
      const d = u - 12.5;
      const fall = 14.5 - 0.5 * 15 * d * d;
      if (fall > 3) {
        y = fall;
        thrill = 1;
      } else {
        // freio magnético: desacelera até o chão
        const tBrake = Math.sqrt((2 * 11.5) / 15);
        const k = Math.min(1, (d - tBrake) / 1.6);
        y = 3 * (1 - (1 - (1 - k) * (1 - k)));
        thrill = 1 - k;
      }
    }
    carriage.position.y = ground + y + (u > 10 && u < 12.5 ? Math.sin(t * 40) * 0.01 : 0);
    attraction.thrill = thrill;
    attraction.done = cycle.done(t);
  });
  const attraction = makeAttraction(station, seats[0], cycle, { view: 1.5 });
  return attraction;
};

/* --------------------------------------------------------- montanha-russa */

/** Desenho da pista: (x, z, altura acima do chão). Começa na estação, indo pro norte. */
const TRACK: [number, number, number][] = [
  [56, 6, 1.4],
  [56, 0, 1.4],
  [56.2, -5, 1.7],
  [57.6, -9.4, 3.6],
  [60.8, -12, 7],
  [64.8, -12.8, 10],
  [68.6, -12.2, 10.4],
  [72.4, -10.3, 3.2],
  [76.2, -7, 1.6],
  [78.6, -2.2, 6.2],
  [77.2, 3.4, 7],
  [73.2, 7.2, 2.6],
  [68, 8.6, 1.5],
  [63.4, 7.2, 4.4],
  [59.6, 9.8, 2.1],
  [56.6, 9.6, 1.5],
];

const coaster = (kit: Kit, station: Station) => {
  const points = TRACK.map(([x, z, h]) => new THREE.Vector3(x, terrainHeight(x, z) + h, z));
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  const length = curve.getLength();
  const N = 420;
  const samples = curve.getSpacedPoints(N).slice(0, N);
  const tangents = samples.map((_, i) => curve.getTangentAt(i / N));
  const UP = new THREE.Vector3(0, 1, 0);
  const sides = tangents.map((tangent) => new THREE.Vector3().crossVectors(tangent, UP).normalize());

  // trilhos (tubos) e a viga do meio
  const rail = (offset: number, down: number, radius: number, color: string) => {
    const path = new THREE.CatmullRomCurve3(
      samples.map((p, i) =>
        p
          .clone()
          .addScaledVector(sides[i], offset)
          .add(new THREE.Vector3(0, -down, 0)),
      ),
      true,
    );
    const tube = new THREE.Mesh(new THREE.TubeGeometry(path, N, radius, 6, true), lambert(color));
    kit.statics.add(tube);
  };
  rail(0.42, 0, 0.075, '#f4f0ff');
  rail(-0.42, 0, 0.075, '#f4f0ff');
  rail(0, 0.32, 0.15, '#7c3aed');
  const tie = new THREE.Object3D();
  samples.forEach((p, i) => {
    if (i % 3 === 0) {
      tie.position.copy(p).add(new THREE.Vector3(0, -0.12, 0));
      tie.lookAt(p.clone().add(tangents[i]));
      const m = box(kit.statics, [1.0, 0.08, 0.16], [0, 0, 0], lambert('#3b3350'));
      m.position.copy(tie.position);
      m.quaternion.copy(tie.quaternion);
    }
    // pilares até o chão
    const ground = terrainHeight(p.x, p.z);
    const height = p.y - 0.4 - ground;
    if (i % 10 === 0 && height > 0.6) {
      box(kit.statics, [0.24, height + 0.4, 0.24], [p.x, ground + height / 2 - 0.2, p.z], lambert('#e8e4f0'));
      box(kit.statics, [0.5, 0.25, 0.5], [p.x, ground + 0.1, p.z], lambert('#8d8478'));
    }
    // lampadinhas nas duas beiradas
    if (i % 6 === 0) {
      for (const side of [-0.58, 0.58]) {
        const q = p.clone().addScaledVector(sides[i], side);
        box(
          kit.statics,
          [0.13, 0.13, 0.13],
          [q.x, q.y - 0.05, q.z],
          nightGlow(kit, BULB_COLORS[(i / 6 + (side > 0 ? 0 : 2)) % 5]),
        );
      }
    }
  });

  // estação de embarque
  const st = group(kit, 54.6, 2);
  footing(st, 2.2, 10.5, '#c9b8f0', 0.95);
  for (const [sx, sz] of [
    [-0.9, -5],
    [-0.9, 5],
    [2.4, -5],
    [2.4, 5],
  ])
    box(st, [0.18, 4.1, 0.18], [sx, 2.05, sz], lambert('#3b3350'));
  for (let i = 0; i < 10; i++) {
    const stripe = box(
      st,
      [3.8, 0.1, 1.05],
      [0.75, 4.15, -4.7 + i * 1.05],
      lambert(i % 2 ? '#ffffff' : '#8b5cf6'),
    );
    stripe.rotation.z = -0.12;
  }
  for (let i = 0; i < 14; i++)
    box(st, [0.13, 0.13, 0.13], [-1.05, 3.85, -4.9 + i * 0.75], nightGlow(kit, BULB_COLORS[i % 5]));
  box(st, [0.2, 0.9, 3.4], [-1.0, 4.75, 0], lambert('#2a1650'));
  signBoard(st, ['MONTANHA-RUSSA'], 3.2, [-1.12, 4.75, 0], {
    bg: '#2a1650',
    color: '#ffd166',
    size: 92,
    basic: true,
  }).plane.rotation.y = -Math.PI / 2;
  wallRect(kit, st, 2.2, 10.5);
  lightPool(kit, 54.6, 2, 6, '#ffcf8a', 0.5);
  nightLight(kit, st, [0.2, 3.6, 0], '#ffc977', 8, 12);

  // trenzinho
  const colors = ['#ff4d6d', '#ffd166', '#5ec8f2'];
  const cars = colors.map((color, k) => {
    const car = live(new THREE.Group());
    kit.scene.add(car);
    const body = lambert(color);
    box(car, [1.15, 0.5, 1.6], [0, 0.35, 0], body);
    box(car, [1.2, 0.12, 1.66], [0, 0.62, 0], lambert('#ffffff'));
    box(car, [1.0, 0.22, 0.7], [0, 0.55, -0.15], lambert('#2a1650'));
    box(car, [1.0, 0.55, 0.14], [0, 0.85, -0.55], lambert('#2a1650'));
    const bar = box(car, [1.0, 0.1, 0.1], [0, 1.0, 0.2], lambert('#c8c4d4'));
    bar.rotation.x = 0.4;
    for (const sx of [-0.45, 0.45])
      for (const sz of [-0.55, 0.55]) box(car, [0.16, 0.26, 0.26], [sx, 0.02, sz], lambert('#3b3350'));
    if (k === 0) {
      // carrinho da frente com carinha
      box(car, [1.05, 0.45, 0.3], [0, 0.45, 0.88], body);
      box(car, [0.2, 0.2, 0.06], [-0.25, 0.55, 1.04], lambert('#ffffff'));
      box(car, [0.2, 0.2, 0.06], [0.25, 0.55, 1.04], lambert('#ffffff'));
      box(car, [0.1, 0.1, 0.06], [-0.25, 0.53, 1.08], lambert('#1a1326'));
      box(car, [0.1, 0.1, 0.06], [0.25, 0.53, 1.08], lambert('#1a1326'));
    }
    return car;
  });
  const seat = seatAt(cars[0], 0, 0.66, -0.12);
  cars.forEach((car) => bake(car));

  // velocidade: estação devagar, subida no corrente, depois é só gravidade
  const heights = samples.map((p) => p.y);
  let crest = 0;
  heights.forEach((h, i) => {
    if (h > heights[crest]) crest = i;
  });
  const sCrest = (crest / N) * length;
  const yCrest = heights[crest];
  const heightAt = (s: number) => {
    const k = ((((s / length) * N) % N) + N) % N;
    const i = Math.floor(k);
    const f = k - i;
    return heights[i] * (1 - f) + heights[(i + 1) % N] * f;
  };
  const LIFT = 3.4;
  const speedAt = (s: number) => {
    if (s < 6) return 2.2 + s * 0.4;
    if (s <= sCrest) return LIFT;
    const v = Math.sqrt(LIFT * LIFT + 2 * 7.5 * Math.max(0, yCrest - heightAt(s)));
    const toEnd = length - s;
    if (toEnd < 12) return Math.max(1.2, Math.min(v, 1.2 + toEnd * 0.6));
    return v;
  };
  // tabela tempo -> distância de uma volta
  const table: number[] = [0];
  const STEP = 1 / 30;
  let s = 0;
  while (s < length && table.length < 6000) {
    s += speedAt(s) * STEP;
    table.push(Math.min(s, length));
  }
  const lap = (table.length - 1) * STEP;
  const distanceAt = (u: number) => {
    const k = Math.min(table.length - 1, u / STEP);
    const i = Math.floor(k);
    return table[i] + (table[Math.min(i + 1, table.length - 1)] - table[i]) * (k - i);
  };

  const DWELL = 2.5;
  const cycle = new Cycle(lap + DWELL, 3, 0);
  const point = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  kit.ticks.push((t) => {
    const u = cycle.at(t);
    const d = u < DWELL ? 0 : distanceAt(u - DWELL);
    cars.forEach((car, k) => {
      const at = ((((d - k * 1.85) / length) % 1) + 1) % 1;
      curve.getPointAt(at, point);
      curve.getPointAt((at + 0.004) % 1, ahead);
      car.position.copy(point).add(new THREE.Vector3(0, 0.1, 0));
      car.lookAt(ahead.x, ahead.y + 0.1, ahead.z);
    });
    const v = u < DWELL ? 0 : speedAt(d);
    attraction.thrill = smooth(7, 11, v);
    attraction.done = cycle.done(t);
  });
  const attraction = makeAttraction(station, seat, cycle, { chase: true, view: 1 });
  return attraction;
};

/* ------------------------------------------------------------------ montagem */

const BUILDERS: Record<RideType, (kit: Kit, station: Station) => Attraction> = {
  coaster,
  carousel,
  swing,
  viking,
  ferris,
  drop: dropTower,
};

export const buildPark = (kit: Kit, stations: Station[]) =>
  stations
    .filter((station) => station.ride)
    .map((station) => {
      const attraction = BUILDERS[station.ride!.type](kit, station);
      // placa com o print do projeto ao lado do embarque
      const dx = station.bx - station.x;
      const dz = station.bz - station.z;
      const length = Math.hypot(dx, dz) || 1;
      if (station.ride!.type === 'coaster') rideSign(kit, 51, -1.9, 49, 1.5, station);
      else {
        const sx = station.x + (-dz / length) * 3.3 + (dx / length) * 0.6;
        const sz = station.z + (dx / length) * 3.3 + (dz / length) * 0.6;
        rideSign(kit, sx, sz, sx - dx, sz - dz, station);
      }
      return attraction;
    });

/** Varal de lampadinhas coloridas entre dois postes (com barriga no meio). */
export const stringLights = (kit: Kit, a: [number, number, number], b: [number, number, number]) => {
  const length = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const count = Math.max(4, Math.round(length / 0.65));
  const at = (k: number) =>
    new THREE.Vector3(
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * 0.75,
      a[2] + (b[2] - a[2]) * k,
    );
  const wire = lambert('#2a2438');
  for (let i = 0; i < count; i++) {
    const p = at(i / count);
    const q = at((i + 1) / count);
    const piece = box(kit.statics, [0.03, 0.03, p.distanceTo(q)], [0, 0, 0], wire);
    piece.position.copy(p).add(q).multiplyScalar(0.5);
    piece.lookAt(q);
    if (i > 0)
      box(
        kit.statics,
        [0.13, 0.16, 0.13],
        [p.x, p.y - 0.1, p.z],
        nightGlow(kit, BULB_COLORS[i % BULB_COLORS.length]),
      );
  }
};
