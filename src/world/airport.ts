import * as THREE from 'three';
import { AIRPORT_Y, RUNWAY } from './terrain';
import {
  box,
  glow,
  group,
  halo,
  lambert,
  lightPool,
  live,
  mesh,
  nightGlow,
  nightLight,
  shared,
  solid,
  wallPath,
  wallRect,
  type Kit,
} from './props';
import { signBoard } from './buildings';
import { canvasTexture, makeCanvas, TEXT_FONT } from './textures';

/**
 * Aeroporto do sítio: pista com faixas e luzes, pátio, terminal, torre de
 * controle com radar, hangar, um avião grande estacionado e a biruta.
 * O aviãozinho que dá pra pilotar mora em `plane.ts`.
 */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 14));
const CYL8 = shared(new THREE.CylinderGeometry(1, 1, 1, 8));
const SPHERE = shared(new THREE.IcosahedronGeometry(1, 2));
const CONE = shared(new THREE.ConeGeometry(1, 1, 14));

const ASPHALT = '#3d3f46';
const CONCRETE = '#a9a79f';
const PAINT = '#f4f1e8';
const PURPLE = '#7c3aed';
const YELLOW = '#ffd166';

/** Pátio (concreto) na frente do terminal, ligado à pista por duas taxiways. */
export const APRON = { x: -6, z: -224, w: 150, d: 30 };
export const TAXIWAYS = [-60, 46];
/** Onde o aviãozinho fica estacionado (e pra onde ele volta se sumir). */
export const PLANE_SPOT = { x: 46, z: -217, angle: Math.PI };
const TOWER = { x: 16, z: -199 };
const TERMINAL = { x: -44, z: -199, w: 46, d: 12 };
const HANGAR = { x: 92, z: -212, w: 26, d: 22 };

/** Número da cabeceira pintado no chão. */
const runwayNumber = (text: string) => {
  const { canvas, ctx } = makeCanvas(256, 512);
  ctx.fillStyle = PAINT;
  ctx.font = `800 300px ${TEXT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(128, 256);
  ctx.scale(0.62, 1.4);
  ctx.fillText(text, 0, 10);
  ctx.restore();
  const material = new THREE.MeshLambertMaterial({ map: canvasTexture(canvas), transparent: true });
  material.depthWrite = false;
  material.polygonOffset = true;
  material.polygonOffsetFactor = -4;
  return material;
};

/** Pista, taxiways, pátio e o desenho no chão. */
const pavement = (kit: Kit) => {
  const g = group(kit, 0, 0);
  g.position.y = AIRPORT_Y;
  const y = AIRPORT_TOP;
  const { x, z, length, width } = RUNWAY;
  // pista com acostamento
  box(g, [length + 8, 0.3, width + 4], [x, y - 0.17, z], lambert('#6e6c66'));
  box(g, [length, 0.3, width], [x, y - 0.15, z], lambert(ASPHALT));
  const paint = lambert(PAINT);
  // linha do meio tracejada
  for (let px = x - length / 2 + 26; px < x + length / 2 - 26; px += 12)
    box(g, [6, 0.04, 0.45], [px, y + 0.01, z], paint);
  // bordas
  for (const side of [-1, 1]) box(g, [length - 2, 0.04, 0.35], [x, y + 0.01, z + side * (width / 2 - 0.6)], paint);
  // "piano" nas cabeceiras e marcas de toque
  for (const end of [-1, 1]) {
    const ex = x + end * (length / 2 - 3.5);
    for (let k = -3; k <= 3; k++) {
      if (k === 0) continue;
      box(g, [5, 0.04, 0.9], [ex, y + 0.01, z + k * 1.7], paint);
    }
    for (const side of [-1, 1]) box(g, [9, 0.04, 2], [x + end * (length / 2 - 40), y + 0.01, z + side * 3.2], paint);
    // número da cabeceira (09 a oeste, 27 a leste), virado pra quem chega
    const number = new THREE.Mesh(shared(new THREE.PlaneGeometry(1, 1)), runwayNumber(end < 0 ? '09' : '27'));
    number.scale.set(5, 9, 1);
    number.rotation.set(-Math.PI / 2, 0, end < 0 ? -Math.PI / 2 : Math.PI / 2);
    number.position.set(x + end * (length / 2 - 14), y + 0.03, z);
    g.add(number);
  }
  // pátio de concreto e as taxiways até a pista
  box(g, [APRON.w, 0.3, APRON.d], [APRON.x, y - 0.155, APRON.z], lambert(CONCRETE));
  for (let px = APRON.x - APRON.w / 2 + 7.5; px < APRON.x + APRON.w / 2; px += 15)
    box(g, [0.12, 0.04, APRON.d - 1], [px, y + 0.005, APRON.z], lambert('#96948c'));
  const yellow = lambert('#f2c230');
  for (const tx of TAXIWAYS) {
    const top = APRON.z - APRON.d / 2;
    const bottom = z + width / 2;
    const len = top - bottom;
    box(g, [12, 0.3, len + 2], [tx, y - 0.16, (top + bottom) / 2], lambert(ASPHALT));
    box(g, [0.35, 0.04, len + 2], [tx, y + 0.01, (top + bottom) / 2], yellow);
    // linha de espera antes da pista
    box(g, [12, 0.04, 0.3], [tx, y + 0.01, bottom + 2.2], yellow);
    box(g, [12, 0.04, 0.3], [tx, y + 0.01, bottom + 2.9], yellow);
  }
  // vagas pintadas no pátio (o "T" amarelo onde o avião para)
  for (const spot of [PLANE_SPOT.x, -44]) {
    box(g, [0.35, 0.04, APRON.d - 4], [spot, y + 0.01, APRON.z], yellow);
    box(g, [5, 0.04, 0.35], [spot, y + 0.01, APRON.z + APRON.d / 2 - 4], yellow);
  }
  // estacionamento de carros atrás do terminal
  box(g, [40, 0.3, 10], [-44, y - 0.16, -184], lambert('#55575d'));
  for (let px = -62; px <= -26; px += 4) box(g, [0.15, 0.04, 4.5], [px, y + 0.01, -181.5], paint);
};

/** Altura de cima do asfalto (o vale do aeroporto é plano). */
const AIRPORT_TOP = 0.06;

/** Luzes da pista: brancas nas bordas, verdes e vermelhas nas cabeceiras. */
const runwayLights = (kit: Kit) => {
  const g = group(kit, 0, 0);
  g.position.y = AIRPORT_Y + AIRPORT_TOP;
  const { x, z, length, width } = RUNWAY;
  const white = nightGlow(kit, '#fff3c4');
  const blue = nightGlow(kit, '#4f8cff');
  const base = lambert('#2a2a30');
  for (let px = x - length / 2 + 2; px <= x + length / 2 - 2; px += 10)
    for (const side of [-1, 1]) {
      const lz = z + side * (width / 2 + 1.2);
      box(g, [0.18, 0.3, 0.18], [px, 0.15, lz], base);
      box(g, [0.3, 0.22, 0.3], [px, 0.38, lz], white);
    }
  for (const end of [-1, 1])
    for (let k = -4; k <= 4; k++) {
      const lx = x + end * (length / 2 + 0.6);
      box(g, [0.3, 0.22, 0.3], [lx, 0.3, z + k * 1.8], nightGlow(kit, end < 0 ? '#3dff8a' : '#ff4d4d'));
    }
  // taxiways com luz azul
  for (const tx of TAXIWAYS)
    for (let pz = APRON.z - APRON.d / 2 - 2; pz > z + width / 2 + 1; pz -= 5)
      for (const side of [-1, 1]) box(g, [0.26, 0.2, 0.26], [tx + side * 6.6, 0.25, pz], blue);
  // luzes de aproximação depois da pista (fileira que pisca de noite)
  const strobes: THREE.Mesh[] = [];
  const strobe = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 });
  for (const end of [-1, 1])
    for (let k = 1; k <= 6; k++) {
      const lx = x + end * (length / 2 + 3 + k * 4);
      box(g, [0.14, 1.4, 0.14], [lx, 0.7, z], base);
      for (const w of [-1.2, 0, 1.2]) box(g, [0.34, 0.26, 0.34], [lx, 1.45, z + w], white);
      const flash = new THREE.Mesh(shared(new THREE.BoxGeometry(0.6, 0.6, 0.6)), strobe);
      flash.position.set(lx, 1.9, z);
      live(flash);
      kit.scene.add(flash);
      flash.position.y += AIRPORT_Y + AIRPORT_TOP;
      strobes.push(flash);
    }
  kit.ticks.push((t) => {
    const lit = Math.max(0, Math.min(1, (kit.env.night - 0.25) / 0.45));
    strobe.opacity = lit;
    // o clarão "corre" de fora pra dentro, em direção à pista
    const step = 5 - Math.floor((t * 6) % 8);
    strobes.forEach((flash, i) => (flash.visible = lit > 0.05 && i % 6 === step));
  });
};

/* ------------------------------------------------------------------ torre */

const controlTower = (kit: Kit) => {
  const g = group(kit, TOWER.x, TOWER.z);
  const concrete = lambert('#d7d2c6');
  const H = 19;
  // base com porta
  box(g, [7, 3.4, 7], [0, 1.7, 0], lambert('#bdb6a8'));
  box(g, [1.6, 2.4, 0.1], [0, 1.2, -3.52], lambert('#3b3350'));
  box(g, [7.4, 0.3, 7.4], [0, 3.5, 0], lambert('#8e887c'));
  // fuste
  const shaft = mesh(g, CYL8, concrete, [0, 3.4 + (H - 3.4) / 2, 0]);
  shaft.scale.set(2, H - 3.4, 2);
  // faixas roxas e janelinhas na subida
  for (const fy of [7, 12]) {
    const band = mesh(g, CYL8, lambert(PURPLE), [0, fy, 0]);
    band.scale.set(2.05, 0.4, 2.05);
  }
  for (let wy = 5; wy < H - 1; wy += 2.2) box(g, [0.5, 0.9, 0.1], [0, wy, -2.0], kit.night.windows);
  // cabine de vidro em cima
  const deck = mesh(g, CYL8, lambert('#8e887c'), [0, H + 0.2, 0]);
  deck.scale.set(4.3, 0.4, 4.3);
  const cabin = mesh(g, CYL8, kit.night.windows, [0, H + 1.9, 0]);
  cabin.scale.set(3.7, 3, 3.7);
  // montantes entre os vidros
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const post = box(g, [0.22, 3.1, 0.22], [Math.sin(a) * 3.55, H + 1.9, Math.cos(a) * 3.55], lambert('#4b525c'));
    post.rotation.y = a;
  }
  const roof = mesh(g, CYL8, lambert('#4b525c'), [0, H + 3.6, 0]);
  roof.scale.set(4.6, 0.45, 4.6);
  const cap = mesh(g, CONE, lambert(PURPLE), [0, H + 4.4, 0]);
  cap.scale.set(3.8, 1.2, 3.8);
  // antena com a luz vermelha que pisca
  box(g, [0.12, 4, 0.12], [1.2, H + 6.4, 0], lambert('#c0c4cc'));
  box(g, [0.8, 0.08, 0.08], [1.2, H + 7.4, 0], lambert('#c0c4cc'));
  const red = live(mesh(g, SPHERE, glow('#ff3b3b'), [1.2, H + 8.5, 0]));
  red.scale.setScalar(0.24);
  const redHalo = halo(kit, g, [1.2, H + 8.5, 0], 3);
  live(redHalo);
  // radar girando
  const radar = live(new THREE.Group());
  radar.position.set(-1.6, H + 5.6, 0);
  g.add(radar);
  box(radar, [0.15, 1.1, 0.15], [0, -0.5, 0], lambert('#c0c4cc'));
  const dish = box(radar, [2.6, 0.7, 0.14], [0, 0.2, 0.2], lambert('#eef0f4'));
  dish.rotation.x = -0.35;
  box(radar, [0.3, 0.3, 0.6], [0, 0, 0], lambert('#4b525c'));
  // farol do aeroporto: verde e branco girando
  const beacon = live(new THREE.Group());
  beacon.position.set(0, H + 5.3, 0);
  g.add(beacon);
  box(beacon, [0.5, 0.5, 0.5], [0, 0, 0], lambert('#2a2a30'));
  box(beacon, [0.1, 0.36, 0.36], [0.3, 0, 0], glow('#a8ffcb'));
  box(beacon, [0.1, 0.36, 0.36], [-0.3, 0, 0], glow('#ffffff'));
  const beam = new THREE.MeshBasicMaterial({
    color: '#d9ffe8',
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beamGeometry = shared(new THREE.ConeGeometry(2.4, 30, 12, 1, true));
  beamGeometry.translate(0, -15, 0);
  for (const side of [1, -1]) {
    const cone = mesh(beacon, beamGeometry, beam, [side * 0.35, 0, 0]);
    cone.rotation.z = side * (Math.PI / 2) * 1.04;
  }
  nightLight(kit, g, [0, 4.5, -4.5], '#ffd9a0', 8, 14);
  solid(kit, g, 0, 0, 4.6);
  kit.ticks.push((t, dt) => {
    radar.rotation.y += dt * 1.4;
    beacon.rotation.y = t * 1.6;
    const lit = Math.max(0, Math.min(1, (kit.env.night - 0.2) / 0.4));
    beam.opacity = 0.18 * lit;
    const blink = Math.sin(t * 3.2) > 0.3;
    red.visible = blink;
    redHalo.visible = blink && lit > 0.05;
  });
  signBoard(g, ['TORRE'], 3.6, [0, 3.0, -3.56], {
    bg: '#2a1650',
    color: YELLOW,
    size: 120,
    canvas: 768,
    basic: true,
  }).plane.rotation.y = Math.PI;
};

/* --------------------------------------------------------------- terminal */

const terminal = (kit: Kit) => {
  const { x, z, w, d } = TERMINAL;
  const g = group(kit, x, z);
  const wall = lambert('#eceae4');
  box(g, [w + 0.6, 0.4, d + 0.6], [0, 0.2, 0], lambert('#8e887c'));
  box(g, [w, 6, d], [0, 3.2, 0], wall);
  // fachada de vidro virada pro pátio (norte = -z)
  for (let px = -w / 2 + 2; px <= w / 2 - 2; px += 3.4) {
    box(g, [3, 2.2, 0.1], [px, 1.8, -d / 2 - 0.02], kit.night.windows);
    box(g, [3, 1.8, 0.1], [px, 4.6, -d / 2 - 0.02], kit.night.windows);
  }
  for (let px = -w / 2 + 0.3; px <= w / 2; px += 3.4)
    box(g, [0.3, 5.8, 0.25], [px, 3.2, -d / 2 - 0.08], lambert('#4b525c'));
  // janelas de trás e a porta pra quem chega pela estrada
  for (let px = -w / 2 + 3; px <= w / 2 - 3; px += 5)
    box(g, [2.4, 1.6, 0.1], [px, 4.2, d / 2 + 0.02], kit.night.windows);
  box(g, [5, 2.8, 0.1], [0, 1.6, d / 2 + 0.03], kit.night.windows);
  box(g, [7, 0.3, 3], [0, 3.3, d / 2 + 1.5], lambert('#4b525c'));
  for (const sx of [-3.2, 3.2]) box(g, [0.2, 3.1, 0.2], [sx, 1.6, d / 2 + 2.8], lambert('#4b525c'));
  // telhado ondulado com beiral
  box(g, [w + 3, 0.5, d + 3], [0, 6.45, 0], lambert('#4b525c'));
  box(g, [w + 3.2, 0.3, 0.4], [0, 6.25, -d / 2 - 1.6], lambert(PURPLE));
  for (let px = -w / 2 + 4; px < w / 2; px += 8) box(g, [2.4, 1.1, 2], [px, 7.2, 1], lambert('#a0a4ac'));
  // letreiro grande no telhado
  box(g, [20, 2.3, 0.3], [0, 8.4, -d / 2 + 1], lambert('#2a1650'));
  for (const sx of [-8, 8]) box(g, [0.25, 1.6, 0.25], [sx, 7, -d / 2 + 1.2], lambert('#4b525c'));
  signBoard(g, ['AEROPORTO DO SÍTIO'], 19, [0, 8.4, -d / 2 + 0.83], {
    bg: '#2a1650',
    color: YELLOW,
    size: 110,
    canvas: 1536,
    basic: true,
  }).plane.rotation.y = Math.PI;
  signBoard(g, ['AEROPORTO DO SÍTIO'], 19, [0, 8.4, -d / 2 + 1.17], {
    bg: '#2a1650',
    color: YELLOW,
    size: 110,
    canvas: 1536,
    basic: true,
  });
  // ponte de embarque até o avião grande
  const bridge = box(g, [2.6, 2.6, 9], [0, 4.2, -d / 2 - 4.6], lambert('#d7d2c6'));
  bridge.rotation.x = 0.06;
  box(g, [2.8, 0.3, 9.2], [0, 2.8, -d / 2 - 4.6], lambert('#8e887c'));
  for (const sz of [-d / 2 - 7.8]) {
    mesh(g, CYL, lambert('#4b525c'), [0, 1.4, sz]).scale.set(0.3, 2.8, 0.3);
    box(g, [1.8, 0.5, 0.8], [0, 0.3, sz], lambert('#2a2a30'));
  }
  for (const px of [-14, 14]) nightLight(kit, g, [px, 6.5, -d / 2 - 2.5], '#ffd9a0', 9, 16);
  wallRect(kit, g, w, d);
};

/* ----------------------------------------------------------------- hangar */

const hangar = (kit: Kit) => {
  const { x, z, w, d } = HANGAR;
  const g = group(kit, x, z);
  // abóbada (meio cilindro deitado), aberta pro pátio (norte)
  const shell = new THREE.CylinderGeometry(w / 2, w / 2, d, 20, 1, true, -Math.PI / 2, Math.PI);
  shell.rotateX(-Math.PI / 2);
  const arch = mesh(g, shell, new THREE.MeshLambertMaterial({ color: '#b7bcc4', flatShading: true, side: THREE.DoubleSide }), [
    0,
    0,
    0,
  ]);
  arch.scale.y = 0.62;
  // costelas e o fundo
  for (let k = -d / 2; k <= d / 2; k += d / 4) {
    const rib = mesh(g, shared(new THREE.TorusGeometry(w / 2, 0.2, 4, 20, Math.PI)), lambert('#8e949c'), [0, 0, k]);
    rib.scale.y = 0.62;
  }
  const back = new THREE.Shape();
  back.absarc(0, 0, w / 2, 0, Math.PI, false);
  const backGeometry = new THREE.ShapeGeometry(back, 16);
  const backWall = mesh(g, backGeometry, lambert('#9aa0a8'), [0, 0, d / 2 - 0.05]);
  backWall.scale.y = 0.62;
  box(g, [w, 0.08, d], [0, 0.03, 0], lambert('#8e8c86'));
  // faixa e número na entrada
  const stripe = mesh(g, shared(new THREE.TorusGeometry(w / 2 + 0.05, 0.45, 4, 20, Math.PI)), lambert(PURPLE), [
    0,
    0,
    -d / 2,
  ]);
  stripe.scale.y = 0.62;
  signBoard(g, ['HANGAR 1'], 7, [0, w * 0.31 - 1.6, -d / 2 - 0.1], {
    bg: '#2a1650',
    color: YELLOW,
    size: 120,
    canvas: 768,
    basic: true,
  }).plane.rotation.y = Math.PI;
  // bancada, caixas de ferramenta e tambores
  box(g, [6, 1, 1.2], [-w / 2 + 5, 0.5, d / 2 - 1.5], lambert('#6b4423'));
  box(g, [1, 1.6, 0.8], [w / 2 - 4, 0.8, d / 2 - 1.5], lambert('#d23b2e'));
  box(g, [1, 1.6, 0.8], [w / 2 - 5.2, 0.8, d / 2 - 1.5], lambert('#d23b2e'));
  for (const [bx, bz] of [
    [w / 2 - 3, d / 2 - 4],
    [w / 2 - 3, d / 2 - 5.2],
  ])
    mesh(g, CYL, lambert('#2f6fd6'), [bx, 0.6, bz]).scale.set(0.42, 1.2, 0.42);
  box(g, [0.5, 0.5, 0.5], [0, w * 0.31 - 3.2, 0], kit.night.bulbs);
  halo(kit, g, [0, w * 0.31 - 3.2, 0], 3);
  lightPool(kit, x, z, 7, '#ffd9a0', 0.5);
  // paredes: laterais e fundo (a frente é aberta)
  wallPath(kit, g, [
    [-w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
    [w / 2, -d / 2],
  ]);
};

/* ------------------------------------------------------- avião grande */

/** Jato de passageiros estacionado na ponte de embarque (só enfeite). */
const airliner = (kit: Kit, x: number, z: number, angle: number) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  const white = lambert('#f4f4f6');
  const purple = lambert(PURPLE);
  const grey = lambert('#a0a4ac');
  const Y = 3.4;
  // fuselagem
  const body = mesh(g, CYL, white, [0, Y, 0]);
  body.scale.set(2.1, 26, 2.1);
  body.rotation.x = Math.PI / 2;
  const belly = mesh(g, CYL, lambert('#d8dbe2'), [0, Y - 0.6, 0]);
  belly.scale.set(1.95, 25.6, 1.7);
  belly.rotation.x = Math.PI / 2;
  const nose = mesh(g, SPHERE, white, [0, Y - 0.1, 13]);
  nose.scale.set(2.08, 2.0, 3.6);
  const tail = mesh(g, CONE, white, [0, Y + 0.6, -16.2]);
  tail.scale.set(2.05, 6.4, 1.6);
  tail.rotation.x = -Math.PI / 2;
  // faixa roxa e janelas
  for (const side of [-1, 1]) {
    box(g, [0.1, 0.5, 26], [side * 2.06, Y + 0.2, 0], purple);
    for (let k = -11; k <= 10; k += 1.1)
      box(g, [0.08, 0.42, 0.42], [side * 2.08, Y + 0.95, k], kit.night.windows);
    box(g, [0.1, 1.6, 0.9], [side * 2.06, Y + 0.3, 9.5], lambert('#c9ccd4'));
  }
  // para-brisa
  for (const side of [-1, 1]) {
    const pane = box(g, [0.9, 0.5, 0.1], [side * 0.6, Y + 1.1, 15.4], lambert('#1d2a44'));
    pane.rotation.set(-0.7, side * 0.5, 0);
  }
  // asas enflechadas com motores
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(side * 1.6, Y - 0.9, 1);
    wing.rotation.y = side * 0.5;
    g.add(wing);
    box(wing, [13, 0.35, 3.6], [side * 6.5, 0, 0], white);
    box(wing, [1.2, 0.4, 3.6], [side * 13, 0.05, 0], purple);
    const winglet = box(wing, [0.2, 1.8, 1.4], [side * 13.5, 0.9, -0.8], purple);
    winglet.rotation.z = side * -0.25;
    const engine = mesh(wing, CYL, grey, [side * 5, -1.25, 1.2]);
    engine.scale.set(1.05, 3.6, 1.05);
    engine.rotation.x = Math.PI / 2;
    const intake = mesh(wing, CYL, lambert('#2a2a30'), [side * 5, -1.25, 3.0]);
    intake.scale.set(0.88, 0.1, 0.88);
    intake.rotation.x = Math.PI / 2;
    box(wing, [0.3, 0.9, 2], [side * 5, -0.6, 1], grey);
  }
  // cauda
  const fin = box(g, [0.35, 6.4, 4.2], [0, Y + 4.4, -14.8], purple);
  fin.rotation.x = -0.45;
  for (const side of [-1, 1]) {
    const stab = box(g, [6.4, 0.25, 2.4], [side * 3.4, Y + 1.0, -15.4], white);
    stab.rotation.y = side * 0.45;
  }
  // trem de pouso
  const gear = lambert('#2a2a30');
  for (const [gx, gz] of [
    [0, 11],
    [-2.6, 0],
    [2.6, 0],
  ]) {
    box(g, [0.25, Y - 1.2, 0.25], [gx, (Y - 1.2) / 2 + 0.4, gz], grey);
    for (const off of [-0.35, 0.35]) {
      const wheel = mesh(g, CYL, gear, [gx + off, 0.6, gz]);
      wheel.scale.set(0.6, 0.35, 0.6);
      wheel.rotation.z = Math.PI / 2;
    }
  }
  // luzes nas pontas das asas
  for (const side of [-1, 1]) {
    const tip = new THREE.Vector3(side * 1.6, 0, 1).add(
      new THREE.Vector3(side * 13.6, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), side * 0.5),
    );
    box(g, [0.3, 0.3, 0.3], [tip.x, Y - 0.7, tip.z], glow(side < 0 ? '#ff4d4d' : '#3dff8a'));
  }
  // escada e carrinhos de bagagem
  const stairs = box(g, [1.6, 0.25, 6], [-3.6, 1.8, 8], lambert('#e0e2e8'));
  stairs.rotation.x = 0.55;
  solid(kit, g, 0, 8, 2.4);
  solid(kit, g, 0, 2, 2.4);
  solid(kit, g, 0, -4, 2.4);
  solid(kit, g, 0, -10, 2.4);
  solid(kit, g, 0, -15, 2);
  solid(kit, g, -5, 0, 1.4);
  solid(kit, g, 5, 0, 1.4);
};

/* ---------------------------------------------------------- enfeites */

const windsock = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  box(g, [0.18, 6, 0.18], [0, 3, 0], lambert('#c0c4cc'));
  box(g, [0.3, 0.3, 0.3], [0, 6, 0], kit.night.bulbs);
  halo(kit, g, [0, 6.1, 0], 2);
  const sock = live(new THREE.Group());
  sock.position.set(0, 5.8, 0);
  g.add(sock);
  const rings = 5;
  for (let i = 0; i < rings; i++) {
    const r = 0.55 - i * 0.07;
    const ring = mesh(sock, CYL, lambert(i % 2 ? '#ffffff' : '#ff6a2b'), [0, 0, 0.3 + i * 0.6]);
    ring.scale.set(r, 0.58, r);
    ring.rotation.x = Math.PI / 2;
  }
  kit.ticks.push((t) => {
    sock.rotation.y = 1.9 + Math.sin(t * 0.4) * 0.35;
    sock.rotation.x = 0.15 + Math.sin(t * 1.7) * 0.06;
  });
  kit.obstacles.push({ x, z, r: 0.3 });
};

const fuelTruck = (kit: Kit, x: number, z: number, angle: number) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  box(g, [2.3, 2, 2], [0, 1.4, 3.2], lambert('#f2c230'));
  box(g, [2.1, 0.8, 0.1], [0, 1.9, 4.22], lambert('#1d2a44'));
  const tank = mesh(g, CYL, lambert('#eceae4'), [0, 1.7, -0.8]);
  tank.scale.set(1.15, 5.4, 1.15);
  tank.rotation.x = Math.PI / 2;
  box(g, [2.4, 0.3, 7.6], [0, 0.6, 0.4], lambert('#3a3a44'));
  for (const wz of [3, -0.6, -2.6])
    for (const side of [-1, 1]) {
      const wheel = mesh(g, CYL, lambert('#1c1c22'), [side * 1.1, 0.5, wz]);
      wheel.scale.set(0.5, 0.35, 0.5);
      wheel.rotation.z = Math.PI / 2;
    }
  box(g, [0.3, 0.3, 0.3], [0, 2.5, 3.2], glow('#ff9a3b'));
  kit.obstacles.push({ x, z, r: 2.2 });
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  kit.obstacles.push({ x: x + s * 3, z: z + c * 3, r: 1.6 });
  kit.obstacles.push({ x: x - s * 2.5, z: z - c * 2.5, r: 1.6 });
};

const baggageTrain = (kit: Kit, x: number, z: number, angle: number) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  box(g, [1.4, 1, 1.8], [0, 0.7, 0], lambert('#2f6fd6'));
  box(g, [1.2, 0.5, 0.8], [0, 1.45, -0.3], lambert('#2f6fd6'));
  const bags = ['#d23b2e', '#ffd166', '#7c3aed', '#3a8a4f', '#ff7eb6'];
  for (let k = 1; k <= 3; k++) {
    box(g, [1.5, 0.15, 2.2], [0, 0.55, -k * 2.6], lambert('#8e949c'));
    for (let b = 0; b < 4; b++)
      box(g, [0.6, 0.5, 0.8], [b % 2 ? 0.35 : -0.35, 0.9, -k * 2.6 + (b < 2 ? -0.5 : 0.5)], lambert(bags[(k + b) % 5]));
  }
  kit.obstacles.push({ x, z, r: 1.2 });
  for (let k = 1; k <= 3; k++)
    kit.obstacles.push({ x: x - Math.sin(angle) * k * 2.6, z: z - Math.cos(angle) * k * 2.6, r: 1.2 });
};

const cones = (kit: Kit, points: [number, number][]) =>
  points.forEach(([x, z]) => {
    const g = group(kit, x, z);
    box(g, [0.6, 0.08, 0.6], [0, 0.04, 0], lambert('#ff6a2b'));
    const cone = mesh(g, CONE, lambert('#ff6a2b'), [0, 0.42, 0]);
    cone.scale.set(0.24, 0.8, 0.24);
    const band = mesh(g, CYL, lambert('#ffffff'), [0, 0.45, 0]);
    band.scale.set(0.15, 0.14, 0.15);
  });

const car = (kit: Kit, x: number, z: number, angle: number, color: string) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  box(g, [1.8, 0.7, 3.8], [0, 0.7, 0], lambert(color));
  box(g, [1.6, 0.6, 2], [0, 1.35, -0.2], lambert(color));
  box(g, [1.62, 0.45, 1.9], [0, 1.37, -0.2], lambert('#1d2a44'));
  for (const [wx, wz] of [
    [-0.85, 1.2],
    [0.85, 1.2],
    [-0.85, -1.2],
    [0.85, -1.2],
  ]) {
    const wheel = mesh(g, CYL, lambert('#1c1c22'), [wx, 0.38, wz]);
    wheel.scale.set(0.38, 0.25, 0.38);
    wheel.rotation.z = Math.PI / 2;
  }
  kit.obstacles.push({ x, z, r: 1.6 });
};

/** Poste alto de holofote do pátio. */
const floodlight = (kit: Kit, x: number, z: number, withLight: boolean) => {
  const g = group(kit, x, z);
  box(g, [0.35, 12, 0.35], [0, 6, 0], lambert('#8e949c'));
  box(g, [2.6, 0.2, 0.3], [0, 12, 0], lambert('#4b525c'));
  for (const sx of [-0.9, 0, 0.9]) {
    box(g, [0.6, 0.45, 0.3], [sx, 11.7, -0.15], kit.night.bulbs);
    halo(kit, g, [sx, 11.7, -0.3], 3.2);
  }
  if (withLight) nightLight(kit, g, [0, 11, -2], '#fff1d0', 12, 26);
  else lightPool(kit, x, z - 4, 9, '#fff1d0', 0.45);
  kit.obstacles.push({ x, z, r: 0.35 });
};

/** Monta o aeroporto inteiro. */
export const buildAirport = (kit: Kit) => {
  const mobile = kit.env.mobile;
  pavement(kit);
  runwayLights(kit);
  controlTower(kit);
  terminal(kit);
  hangar(kit);
  airliner(kit, -44, -229, 0);
  windsock(kit, -96, -244);
  windsock(kit, 104, -279);
  fuelTruck(kit, 62, -224, 0.4);
  baggageTrain(kit, -32, -214, -Math.PI / 2);
  cones(kit, [
    [-38, -212],
    [-36, -212],
    [-50, -212],
    [30, -210],
  ]);
  [
    ['#d23b2e', -58],
    ['#2f6fd6', -50],
    ['#eceae4', -42],
    ['#3a8a4f', -30],
  ].forEach(([color, px]) => car(kit, Number(px), -181.5, 0, String(color)));
  floodlight(kit, -72, -206, !mobile);
  floodlight(kit, 4, -206, !mobile);
  floodlight(kit, 64, -206, false);
};

/** Gramado do aeroporto (fora da pista, do pátio e dos prédios): pra mato e flor. */
export const airportGround = (x: number, z: number, margin = 2) => {
  const inRect = (cx: number, cz: number, w: number, d: number) =>
    Math.abs(x - cx) < w / 2 + margin && Math.abs(z - cz) < d / 2 + margin;
  if (inRect(RUNWAY.x, RUNWAY.z, RUNWAY.length + 70, RUNWAY.width + 8)) return false;
  if (inRect(APRON.x, APRON.z, APRON.w, APRON.d)) return false;
  if (TAXIWAYS.some((tx) => inRect(tx, (APRON.z + RUNWAY.z) / 2, 13, APRON.z - RUNWAY.z))) return false;
  if (inRect(TERMINAL.x, TERMINAL.z, TERMINAL.w + 4, TERMINAL.d + 8)) return false;
  if (inRect(-44, -184, 42, 12)) return false;
  if (inRect(TOWER.x, TOWER.z, 9, 9)) return false;
  if (inRect(HANGAR.x, HANGAR.z - 4, HANGAR.w + 2, HANGAR.d + 10)) return false;
  return true;
};
