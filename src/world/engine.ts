import * as THREE from 'three';
import { milestones } from '@/lib/milestones';
import * as P from './props';
import { FLOPPIES, GALLERY, SPAWN, STATIONS, TRAIL, type Station } from './stations';
import { makeLabel, skyMaterial, sunMaterial } from './textures';

export interface WorldEvents {
  /** A estação mais perto do boneco (ou nenhuma). */
  onNear: (station: Station | null) => void;
  /** Primeira vez que o boneco chega numa estação. */
  onVisit: (station: Station) => void;
  /** Pegou o disquete de índice `index`. */
  onCollect: (index: number) => void;
  onJump?: () => void;
}

export interface WorldHandle {
  start: () => void;
  setJoystick: (x: number, z: number) => void;
  jump: () => void;
  setPaused: (paused: boolean) => void;
  restore: (visited: string[], collected: number[]) => void;
  player: () => { x: number; z: number; angle: number };
  /** Só pra testes: leva o boneco direto pra um ponto. */
  teleport: (x: number, z: number) => void;
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

/** Onde fica a plaquinha (e o losango) de cada estação. */
const labelHeight = (station: Station) => {
  if (station.kind === 'milestone') return 3.5;
  if (station.kind === 'project') return station.id === 'projeto-2' ? 3.8 : 5.7;
  return (
    {
      inicio: 4.2,
      sobre: 6.9,
      contato: 2.9,
      cafe: 6.2,
      github: 10.2,
      stack: 11.2,
      redes: 12.6,
      curriculo: 2.4,
    }[station.id] ?? 5
  );
};

/** O pier sai da praia pro mar, no sudeste. */
const PIER = { x: 12, z: 41, length: 11 };

const walkable = (x: number, z: number) => {
  if (Math.abs(x - PIER.x) < 1.1 && z > PIER.z - 2 && z < PIER.z + PIER.length) return true;
  return Math.hypot(x, z) < P.islandRadius(Math.atan2(z, x)) - 1;
};

/* ---------------------------------------------------------------- boneco */

const buildPlayer = (scene: THREE.Scene) => {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  scene.add(root);
  const skin = P.lambert('#e2a878');
  const hoodie = P.lambert('#7c3aed');
  const jeans = P.lambert('#33407a');

  const legs = [-0.18, 0.18].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side, 0.78, 0);
    body.add(hip);
    P.box(hip, [0.3, 0.62, 0.32], [0, -0.31, 0], jeans);
    P.box(hip, [0.32, 0.16, 0.42], [0, -0.7, 0.05], P.lambert('#f4f0ff'));
    return hip;
  });
  const torso = new THREE.Group();
  torso.position.y = 0.78;
  body.add(torso);
  P.box(torso, [0.8, 0.78, 0.46], [0, 0.4, 0], hoodie);
  P.box(torso, [0.5, 0.18, 0.47], [0, 0.18, 0.01], P.lambert('#6d28d9'));
  P.box(torso, [0.16, 0.16, 0.05], [0.18, 0.58, 0.24], P.glow('#ffd166'));
  const arms = [-0.52, 0.52].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side, 0.72, 0);
    torso.add(shoulder);
    P.box(shoulder, [0.24, 0.62, 0.28], [0, -0.28, 0], hoodie);
    P.box(shoulder, [0.22, 0.18, 0.24], [0, -0.66, 0], skin);
    return shoulder;
  });
  const head = new THREE.Group();
  head.position.y = 0.8;
  torso.add(head);
  P.box(head, [0.72, 0.66, 0.66], [0, 0.36, 0], skin);
  P.box(head, [0.78, 0.22, 0.72], [0, 0.72, -0.02], P.lambert('#2b1d14'));
  P.box(head, [0.78, 0.46, 0.18], [0, 0.5, -0.3], P.lambert('#2b1d14'));
  P.box(head, [0.3, 0.12, 0.1], [-0.18, 0.62, 0.32], P.lambert('#2b1d14'));
  const eyes = [-0.16, 0.16].map((side) =>
    P.box(head, [0.1, 0.14, 0.04], [side, 0.38, 0.34], P.lambert('#1a1326')),
  );
  P.box(head, [0.16, 0.05, 0.04], [0, 0.2, 0.34], P.lambert('#b5644a'));
  // fone de ouvido roxo, porque todo dev tem um
  P.box(head, [0.84, 0.08, 0.14], [0, 0.82, 0], P.lambert('#a78bfa'));
  for (const side of [-0.42, 0.42]) {
    P.box(head, [0.08, 0.36, 0.08], [side, 0.62, 0], P.lambert('#a78bfa'));
    P.box(head, [0.14, 0.3, 0.3], [side, 0.36, 0], P.lambert('#5b2bb5'));
  }
  const shadowGeometry = new THREE.CircleGeometry(0.55, 10);
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadow = new THREE.Mesh(
    shadowGeometry,
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.3, depthWrite: false }),
  );
  scene.add(shadow);
  return { root, body, torso, head, legs, arms, eyes, shadow };
};

/* ------------------------------------------------------------------ mundo */

const buildWorld = (kit: P.Kit) => {
  const rand = P.seeded(1234);
  const byId = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
  const spot = (id: string): [number, number] => [byId[id].x, byId[id].z];

  P.buildSea(kit);
  P.buildIsland(kit);

  // trilhas
  const paths: [number, number][][] = [
    [
      [0, 41],
      [0, 30],
      [0, 15.5],
    ],
    [[4.6, 8.2], spot('cafe')],
    [[-4.6, 11.4], [-9, 13.4], spot('sobre')],
    [spot('sobre'), [-10.5, 18], spot('contato')],
    [
      [-4.4, 7.6],
      [-10, 2],
      [-13.5, -5],
    ],
    [
      [0, 5],
      [0.8, -7.4],
    ],
    [[5.5, -11], [11, -14], spot('stack')],
    [[4, 12.8], TRAIL[0]],
    TRAIL,
    [TRAIL[3], [28, 16], spot('redes')],
    [TRAIL[8], spot('stack')],
    [[-15.5, -11.5], [-19.5, -19], spot('curriculo')],
    [
      [1.5, 38],
      [7, 39.5],
      [PIER.x, PIER.z - 0.5],
    ],
    [
      [-13.5, 14.5],
      [-18.5, 19.5],
    ],
  ];
  paths.forEach((points) => P.path(kit, points, rand));

  // praça, portão e placas
  P.fountain(kit, 0, 10);
  P.gate(kit, 0, 31);
  P.signpost(kit, 3.6, 15.5, [
    { text: 'PROJETOS', angle: -Math.PI / 2 - 0.5 },
    { text: 'CARREIRA', angle: Math.PI / 2 - 0.9 },
    { text: 'GITHUB', angle: Math.PI },
    { text: 'PRAIA', angle: 0.2 },
  ]);
  P.gallerySign(kit, GALLERY.x + 1.5, GALLERY.z, 0, 0);
  P.campfire(kit, -21.5, 22.5);
  P.windmill(kit, -35, 2, -20, 6);
  P.farm(kit, -31, 13);
  P.pier(kit, PIER.x, PIER.z, PIER.length);

  // estações
  const hooks = new Map<string, (() => void)[]>();
  const addHook = (id: string, hook?: (() => void) | void) => {
    if (!hook) return;
    hooks.set(id, [...(hooks.get(id) ?? []), hook]);
  };
  const labels: { sprite: THREE.Sprite; station: Station; base: THREE.Vector3 }[] = [];
  STATIONS.forEach((station, index) => {
    const { id, bx, bz, x, z } = station;
    if (station.kind === 'project') {
      if (id === 'projeto-2') P.arcade(kit, bx, bz, GALLERY.x, GALLERY.z);
      else P.billboard(kit, bx, bz, GALLERY.x, GALLERY.z, station.image);
    } else if (station.kind === 'milestone') {
      const milestone = milestones[index - STATIONS.findIndex((s) => s.kind === 'milestone')];
      addHook(id, P.milestonePillar(kit, x, z, milestone.kind));
    } else {
      switch (id) {
        case 'inicio':
          P.welcomeBoard(kit, bx, bz, x, z);
          break;
        case 'sobre':
          P.house(kit, bx, bz, x, z);
          break;
        case 'contato':
          addHook(id, P.mailbox(kit, bx, bz, x, z));
          break;
        case 'cafe':
          P.coffeeKiosk(kit, bx, bz, x, z);
          break;
        case 'github':
          P.githubTree(kit, bx, bz);
          break;
        case 'stack':
          P.stackTower(kit, bx, bz, TECH_ICONS);
          break;
        case 'redes':
          P.lighthouse(kit, bx, bz);
          break;
        case 'curriculo':
          addHook(id, P.chest(kit, bx, bz, x, z));
          break;
      }
    }
    const height = labelHeight(station);
    if (station.kind !== 'milestone') addHook(id, P.beacon(kit, bx, bz, height + 1.3, x, z));
    const sprite = makeLabel(station.label, {
      height: station.kind === 'milestone' ? 0.55 : 0.65,
      border: station.kind === 'milestone' ? '#5ec8f2' : '#a78bfa',
    });
    sprite.position.set(bx, height, bz);
    kit.scene.add(sprite);
    labels.push({ sprite, station, base: sprite.scale.clone() });
  });

  // postes de luz pelas trilhas
  [
    [1.6, 36],
    [-1.6, 25],
    [1.6, 19],
    [6.5, 4.6],
    [-7.5, 10.6],
    [-9, 0.5],
    [2.4, -2],
    [9, -12.4],
    [12, 19.5],
    [21, 21.2],
    [28.2, 9],
    [30.4, -3],
    [-18, -21],
    [-12.5, 17.5],
  ].forEach(([x, z]) => P.lampPost(kit, x, z));

  // o que não pode ser coberto por árvore
  const reserved: [number, number, number][] = [
    [0, 10, 7],
    [GALLERY.x, GALLERY.z, 12.5],
    [2, -10, 7.5],
    [0, 31, 5],
    [-21.5, 22.5, 4],
    [-35, 2, 3.5],
    [-31, 15, 5],
    [35, 17, 5],
    [-17, 15, 5],
    [18, -21, 6],
    [10.5, 4, 3.5],
    [3.6, 15.5, 1.5],
    ...STATIONS.map((s) => [s.x, s.z, 2.6] as [number, number, number]),
    ...STATIONS.map((s) => [s.bx, s.bz, 2.6] as [number, number, number]),
    ...FLOPPIES.map(([x, z]) => [x, z, 1.6] as [number, number, number]),
  ];
  const segments = paths.flatMap((points) => points.slice(1).map((point, i) => [points[i], point] as const));
  const nearPath = (x: number, z: number, margin: number) =>
    segments.some(([[ax, az], [bx, bz]]) => {
      const dx = bx - ax;
      const dz = bz - az;
      const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      return Math.hypot(x - (ax + dx * k), z - (az + dz * k)) < margin;
    });
  const free = (x: number, z: number, margin = 2.2) =>
    !nearPath(x, z, margin) && reserved.every(([rx, rz, r]) => Math.hypot(x - rx, z - rz) > r + margin * 0.5);
  const taken: [number, number][] = [];
  const pick = (inset: number, spread: number, tries = 400, gap = 2.6) => {
    for (let i = 0; i < tries; i++) {
      const angle = rand() * Math.PI * 2;
      const max = P.islandRadius(angle) - inset;
      const r = max - rand() * spread;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!free(x, z)) continue;
      if (taken.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < gap)) continue;
      taken.push([x, z]);
      return [x, z] as const;
    }
    return null;
  };

  for (let i = 0; i < 64; i++) {
    const spotTree = pick(P.GRASS_INSET + 1.5, 34);
    if (!spotTree) continue;
    const [x, z] = spotTree;
    const scale = 0.8 + rand() * 0.6;
    if (i % 5 < 2) P.pine(kit, x, z, scale, i);
    else P.roundTree(kit, x, z, scale, i, i % 4 === 0);
  }
  for (let i = 0; i < 18; i++) {
    const spotPalm = pick(2.2, 2.2, 200, 4);
    if (spotPalm)
      P.palm(kit, spotPalm[0], spotPalm[1], Math.atan2(spotPalm[0], spotPalm[1]) + Math.PI / 2, i);
  }
  for (let i = 0; i < 26; i++) {
    const spotBush = pick(P.GRASS_INSET + 1, 32, 200, 1.6);
    if (spotBush) P.bush(kit, spotBush[0], spotBush[1], 0.8 + rand() * 0.6, i % 3 === 0);
  }
  for (let i = 0; i < 16; i++) {
    const spotRock = pick(1.8, 6, 200, 2);
    if (spotRock) P.rock(kit, spotRock[0], spotRock[1], 0.6 + rand() * 0.9);
  }
  const flowerSpots: [number, number][] = [];
  for (let i = 0; i < 1200 && flowerSpots.length < 170; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (P.islandRadius(angle) - P.GRASS_INSET - 1.5);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    if (free(x, z, 1.2)) flowerSpots.push([x, z]);
  }
  P.scatterFlowers(kit, flowerSpots);
  P.butterflies(
    kit,
    flowerSpots.filter((_, i) => i % 28 === 0),
  );
  P.fireflies(kit, 50, rand);

  const beachAngles = [0.3, 1.9, 2.6, 4.0, 5.3];
  P.crabs(
    kit,
    beachAngles.map((a) => {
      const r = P.islandRadius(a) - 3;
      return [Math.cos(a) * r, Math.sin(a) * r, -a];
    }),
  );
  P.fish(
    kit,
    [0.8, 2.2, 3.4, 4.6, 5.8].map((a) => {
      const r = P.islandRadius(a) + 6;
      return [Math.cos(a) * r, Math.sin(a) * r];
    }),
  );
  P.birds(kit, 6);
  P.clouds(kit, 12, rand);
  P.farIslands(kit);
  P.stars(kit, rand);

  const floppies = FLOPPIES.map(([x, z]) => P.floppy(kit, x, z));
  return { hooks, labels, floppies };
};

/* ---------------------------------------------------------------- motor */

export const createWorld = (canvas: HTMLCanvasElement, events: WorldEvents): WorldHandle => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#f0917e', 70, 210);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.3, 900);

  const time = { value: 0 };
  const kit: P.Kit = { scene, ticks: [], obstacles: [], particles: new P.Particles(scene), time };

  // céu, sol e luz de fim de tarde
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMaterial()));
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), sunMaterial(time));
  sun.position.set(0, 52, -390);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight('#d9c9ff', '#6b4a3a', 2.1));
  const sunlight = new THREE.DirectionalLight('#ffd7a8', 2.6);
  sunlight.position.set(-30, 45, 25);
  scene.add(sunlight, sunlight.target);

  const { hooks, labels, floppies } = buildWorld(kit);
  const player = buildPlayer(scene);

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
  };
  const keys = new Set<string>();

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (key === ' ' && !event.repeat) jump();
    keys.add(key);
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
  const onBlur = () => keys.clear();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  const jump = () => {
    if (state.mode !== 'play' || state.paused || state.y > 0.01) return;
    state.vy = 7.5;
    events.onJump?.();
  };

  // render em baixa resolução, esticado com pixels nítidos
  let portrait = false;
  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const target = height < 700 ? 250 : 330;
    const scale = Math.max(1, height / target);
    renderer.setSize(Math.round(width / scale), Math.round(height / scale), false);
    camera.aspect = width / height;
    portrait = camera.aspect < 0.9;
    camera.fov = portrait ? 68 : 55;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const followOffset = () => (portrait ? new THREE.Vector3(0, 9.5, 15) : new THREE.Vector3(0, 6.8, 12.5));
  const lookTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const orbitPos = new THREE.Vector3();
  const orbitLook = new THREE.Vector3(0, 2, 0);

  const resolveCollisions = () => {
    for (const obstacle of kit.obstacles) {
      const dx = state.x - obstacle.x;
      const dz = state.z - obstacle.z;
      const distance = Math.hypot(dx, dz);
      const min = obstacle.r + 0.38;
      if (distance < min && distance > 0.0001) {
        state.x = obstacle.x + (dx / distance) * min;
        state.z = obstacle.z + (dz / distance) * min;
      }
    }
  };

  const visit = (station: Station, silent = false) => {
    if (state.visited.has(station.id)) return;
    state.visited.add(station.id);
    hooks.get(station.id)?.forEach((hook) => hook());
    if (!silent) events.onVisit(station);
  };

  const step = (dt: number, t: number) => {
    // entrada: teclado + joystick
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
    if (state.mode !== 'play' || state.paused) {
      ix = 0;
      iz = 0;
    }
    const speed = keys.has('shift') ? 11 : 7.5;
    const blend = 1 - Math.exp(-dt * 10);
    state.vx += (ix * speed - state.vx) * blend;
    state.vz += (iz * speed - state.vz) * blend;

    const nx = state.x + state.vx * dt;
    const nz = state.z + state.vz * dt;
    if (walkable(nx, nz)) {
      state.x = nx;
      state.z = nz;
    } else if (walkable(nx, state.z)) {
      state.x = nx;
    } else if (walkable(state.x, nz)) {
      state.z = nz;
    }
    resolveCollisions();

    // pulo
    state.vy -= 22 * dt;
    state.y = Math.max(0, state.y + state.vy * dt);
    if (state.y === 0) state.vy = 0;

    const moving = Math.hypot(state.vx, state.vz);
    if (moving > 0.4) {
      const target = Math.atan2(state.vx, state.vz);
      let diff = target - state.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      state.angle += diff * Math.min(1, dt * 12);
    }

    // animação do boneco
    const k = Math.min(1, moving / 7.5);
    state.phase += dt * (4 + moving * 1.4);
    player.root.position.set(state.x, state.y, state.z);
    player.root.rotation.y = state.angle;
    const swing = Math.sin(state.phase) * 0.9 * k;
    player.legs[0].rotation.x = swing;
    player.legs[1].rotation.x = -swing;
    player.arms[0].rotation.x = -swing * 0.8;
    player.arms[1].rotation.x = swing * 0.8;
    player.arms[0].rotation.z = state.y > 0 ? -0.6 : -0.05;
    player.arms[1].rotation.z = state.y > 0 ? 0.6 : 0.05;
    player.body.position.y = Math.abs(Math.sin(state.phase)) * 0.1 * k;
    player.torso.scale.y = 1 + Math.sin(t * 2.5) * 0.015 * (1 - k);
    player.head.rotation.y = (1 - k) * Math.sin(t * 0.6) * 0.35;
    const blinking = t > state.blinkAt && t < state.blinkAt + 0.12;
    if (t > state.blinkAt + 0.12) state.blinkAt = t + 2 + Math.random() * 3;
    player.eyes.forEach((eye) => (eye.scale.y = blinking ? 0.02 : 0.14));
    player.shadow.position.set(state.x, 0.05, state.z);
    player.shadow.scale.setScalar(1 - Math.min(0.5, state.y * 0.15));

    if (moving > 3 && state.y === 0 && t > state.nextDust) {
      state.nextDust = t + 0.13;
      kit.particles.spawn([state.x - state.vx * 0.04, 0.1, state.z - state.vz * 0.04], {
        color: '#e9dcc2',
        velocity: [(Math.random() - 0.5) * 0.8, 0.8, (Math.random() - 0.5) * 0.8],
        size: 0.18,
        grow: 1.2,
        life: 0.5,
        opacity: 0.8,
      });
    }

    if (state.mode === 'play') {
      // estação mais perto
      let near: Station | null = null;
      let best = Infinity;
      for (const station of STATIONS) {
        const d = Math.hypot(station.x - state.x, station.z - state.z);
        const radius = station.kind === 'milestone' ? 2.6 : 2.9;
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
      // disquetes
      floppies.forEach((item, index) => {
        if (item.collected) return;
        const [fx, fz] = FLOPPIES[index];
        if (Math.hypot(fx - state.x, fz - state.z) < 1.3) {
          item.collect();
          events.onCollect(index);
        }
      });
    }

    // plaquinhas aparecem quando chega perto
    labels.forEach(({ sprite, station, base }) => {
      const d = Math.hypot(station.bx - state.x, station.bz - state.z);
      // de perto a plaquinha encolhe, senão toma a tela
      sprite.scale
        .copy(base)
        .multiplyScalar(Math.max(0.4, Math.min(1, (d - 2) / 10)) * (portrait ? 1.35 : 1));
      const far = station.kind === 'milestone' ? 12 : 30;
      const opacity = state.mode === 'intro' ? 0 : Math.max(0, Math.min(1, (far - d) / 4));
      // e some se ficar colada na câmera
      const tooClose = camera.position.distanceTo(sprite.position) < 7;
      sprite.material.opacity = tooClose ? 0 : opacity;
      sprite.visible = opacity > 0.02;
    });

    // câmera
    orbitPos.set(Math.cos(t * 0.12) * 62, 26, Math.sin(t * 0.12) * 62);
    camPos.set(state.x, state.y * 0.4, state.z).add(followOffset());
    lookTarget.set(state.x, 2.4 + state.y * 0.3, state.z - 6);
    if (state.mode === 'intro') {
      camera.position.copy(orbitPos);
      camera.lookAt(orbitLook);
    } else if (state.mode === 'fly') {
      state.flyT = Math.min(1, state.flyT + dt / 2.2);
      const e = state.flyT < 0.5 ? 4 * state.flyT ** 3 : 1 - (-2 * state.flyT + 2) ** 3 / 2;
      camera.position.lerpVectors(orbitPos, camPos, e);
      camera.lookAt(new THREE.Vector3().lerpVectors(orbitLook, lookTarget, e));
      if (state.flyT >= 1) state.mode = 'play';
    } else {
      camera.position.lerp(camPos, 1 - Math.exp(-dt * 5));
      camera.lookAt(lookTarget);
    }
  };

  const clock = new THREE.Clock();
  let frame = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    time.value += dt;
    const t = time.value;
    kit.ticks.forEach((tick) => tick(t, dt));
    kit.particles.update(dt);
    step(dt, t);
    renderer.render(scene, camera);
  };
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
    jump,
    setPaused: (paused) => {
      state.paused = paused;
      if (paused) keys.clear();
    },
    restore: (visited, collected) => {
      visited.forEach((id) => {
        const station = STATIONS.find((s) => s.id === id);
        if (station) visit(station, true);
      });
      collected.forEach((index) => floppies[index]?.collect(true));
    },
    player: () => ({ x: state.x, z: state.z, angle: state.angle }),
    teleport: (x, z) => {
      state.x = x;
      state.z = z;
      camera.position.set(x, 0, z).add(followOffset());
    },
    dispose: () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
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
      P.disposeMaterials();
      renderer.dispose();
    },
  };
};

/** Contorno da ilha pro minimapa. */
export const islandOutline = (steps = 48) =>
  Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2;
    const r = P.islandRadius(angle);
    return [Math.cos(angle) * r, Math.sin(angle) * r] as [number, number];
  });

export const PIER_RECT = PIER;
