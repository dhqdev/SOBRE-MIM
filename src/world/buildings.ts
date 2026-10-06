import * as THREE from 'three';
import { groundHeight, groundNormal, terrainHeight } from './terrain';
import {
  box,
  faceTo,
  footing,
  glow,
  group,
  halo,
  lambert,
  lightPool,
  live,
  nightGlow,
  mesh,
  nightLight,
  seeded,
  shared,
  solid,
  wallPath,
  wallRect,
  type Kit,
} from './props';
import {
  canvasTexture,
  iconTexture,
  imageTexture,
  makeCanvas,
  makeMilestoneTexture,
  makeSignTexture,
} from './textures';

/** Construções do sítio. As que reagem à visita devolvem um "gancho". */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 10));
const CYL6 = shared(new THREE.CylinderGeometry(1, 1, 1, 6));
const SPHERE = shared(new THREE.IcosahedronGeometry(1, 1));

/** Placa de madeira com texto nítido. */
export const signBoard = (
  parent: THREE.Object3D,
  lines: string[],
  width: number,
  position: [number, number, number],
  options: {
    bg?: string;
    color?: string;
    size?: number;
    canvas?: number;
    basic?: boolean;
    back?: boolean;
  } = {},
) => {
  const texture = makeSignTexture(lines, {
    width: options.canvas ?? 1024,
    bg: options.bg,
    color: options.color,
    size: options.size,
  });
  const image = texture.image as HTMLCanvasElement;
  const height = (width * image.height) / image.width;
  const material = options.basic
    ? new THREE.MeshBasicMaterial({ map: texture })
    : new THREE.MeshLambertMaterial({ map: texture });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plane.position.set(...position);
  parent.add(plane);
  if (options.back) {
    const back = plane.clone();
    back.rotation.y = Math.PI;
    back.position.z -= 0.02;
    parent.add(back);
  }
  return { plane, height };
};

/** Telhado de duas águas (cumeeira ao longo de x). */
const gableRoof = (parent: THREE.Object3D, w: number, d: number, h: number, y: number, color: string) => {
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0);
  shape.lineTo(d / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
  geometry.translate(0, 0, -w / 2);
  geometry.rotateY(Math.PI / 2);
  return mesh(parent, geometry, lambert(color), [0, y, 0]);
};

/* ------------------------------------------------------------------ luzes */

/** Poste com lampião: apaga de dia, acende de noite. */
export const lampPost = (kit: Kit, x: number, z: number, withLight = false) => {
  const g = group(kit, x, z);
  box(g, [0.2, 3, 0.2], [0, 1.5, 0], lambert('#5a3a20'));
  box(g, [0.9, 0.12, 0.12], [0.35, 2.95, 0], lambert('#5a3a20'));
  box(g, [0.06, 0.25, 0.06], [0.7, 2.78, 0], lambert('#2a2a2a'));
  box(g, [0.36, 0.08, 0.36], [0.7, 2.66, 0], lambert('#2a2a2a'));
  box(g, [0.26, 0.34, 0.26], [0.7, 2.44, 0], kit.night.bulbs);
  box(g, [0.34, 0.06, 0.34], [0.7, 2.25, 0], lambert('#2a2a2a'));
  halo(kit, g, [0.7, 2.44, 0], 2.6);
  if (withLight) nightLight(kit, g, [0.7, 2.2, 0], '#ffc977', 10, 15);
  else lightPool(kit, x + 0.7, z, 4.2);
  kit.obstacles.push({ x, z, r: 0.25 });
};

/* ---------------------------------------------------------------- entrada */

export const gate = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  const wood = lambert('#6b4423');
  for (const side of [-3.6, 3.6]) {
    box(g, [0.95, 0.5, 0.95], [side, 0.1, 0], lambert('#8d8478'));
    const post = mesh(g, CYL, wood, [side, 2.8, 0]);
    post.scale.set(0.38, 5.6, 0.38);
    kit.obstacles.push({ x: x + side, z, r: 0.55 });
    // bandeirinha roxa
    box(g, [0.07, 1.3, 0.07], [side, 6.2, 0], lambert('#3b3350'));
    const flag = live(new THREE.Group());
    flag.position.set(side, 6.6, 0);
    g.add(flag);
    box(flag, [0.9, 0.5, 0.03], [0.45, 0, 0], lambert('#8b5cf6', '#6d28d9', 0.35));
    kit.ticks.push((t) => (flag.rotation.y = Math.sin(t * 3 + side) * 0.35));
    // tocha
    const torch = live(new THREE.Group());
    torch.position.set(side * 0.86, 3.4, 0.45);
    g.add(torch);
    box(torch, [0.14, 0.6, 0.14], [0, 0, 0], lambert('#3b2a1a'));
    const flame = mesh(torch, shared(new THREE.ConeGeometry(0.18, 0.45, 5)), glow('#ffb347'), [0, 0.45, 0]);
    kit.ticks.push((t) => {
      flame.scale.set(1 + Math.sin(t * 13 + side) * 0.15, 1 + Math.sin(t * 9 + side) * 0.25, 1);
      flame.visible = kit.env.night > 0.15;
    });
    halo(kit, torch, [0, 0.5, 0], 1.8);
  }
  nightLight(kit, g, [0, 3.6, 1.2], '#ffb76b', 10, 16);
  box(g, [8.6, 0.55, 0.6], [0, 5.25, 0], wood);
  box(g, [8.2, 0.3, 0.45], [0, 4.75, 0], lambert('#7a4a2a'));
  signBoard(g, ['SÍTIO DO DAVID'], 6.2, [0, 4.0, 0.32], { bg: '#5a3417', color: '#ffe9b0', size: 112 });
  signBoard(g, ['SÍTIO DO DAVID'], 6.2, [0, 4.0, -0.32], {
    bg: '#5a3417',
    color: '#ffe9b0',
    size: 112,
  }).plane.rotation.y = Math.PI;
  box(g, [6.4, 1.6, 0.5], [0, 4.0, 0], lambert('#5a3417'));
  // correntinhas segurando a placa
  for (const side of [-2.6, 2.6]) box(g, [0.06, 0.5, 0.06], [side, 4.85, 0], lambert('#3a3a3a'));
  return g;
};

/** Placa de boas-vindas. */
export const welcomeBoard = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  box(g, [0.2, 2.6, 0.2], [-1.6, 1.3, 0], lambert('#6b4423'));
  box(g, [0.2, 2.6, 0.2], [1.6, 1.3, 0], lambert('#6b4423'));
  box(g, [3.6, 2.15, 0.14], [0, 1.95, -0.06], lambert('#5a3417'));
  box(g, [3.9, 0.18, 0.4], [0, 3.1, 0], lambert('#7a4a2a'));
  signBoard(
    g,
    [
      'Olá! Eu sou o David.',
      'Desça a colina e visite',
      'cada ponto roxo. Monte',
      'nos bichos, pegue o bugue',
      'e ache os 12 ovos de ouro!',
    ],
    3.4,
    [0, 1.95, 0.02],
    { size: 66, bg: '#8a5a34' },
  );
  kit.obstacles.push({ x, z, r: 1.4 });
};

/** Mirante da colina: banco e binóculo de moedinha. */
export const overlook = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  for (const sx of [-0.8, 0.8]) box(g, [0.12, 0.45, 0.5], [sx, 0.22, 0], lambert('#5a3a20'));
  box(g, [2, 0.1, 0.55], [0, 0.48, 0], lambert('#9b6b3e'));
  box(g, [2, 0.5, 0.08], [0, 0.85, -0.25], lambert('#9b6b3e'));
  const scope = new THREE.Group();
  scope.position.set(2, 0, 0.6);
  g.add(scope);
  box(scope, [0.12, 1.2, 0.12], [0, 0.6, 0], lambert('#555'));
  box(scope, [0.36, 0.36, 0.7], [0, 1.35, 0], lambert('#7c3aed'));
  box(scope, [0.2, 0.2, 0.15], [-0.1, 1.38, 0.4], lambert('#222'));
  box(scope, [0.2, 0.2, 0.15], [0.1, 1.38, 0.4], lambert('#222'));
  kit.obstacles.push({ x, z, r: 1.1 });
  solid(kit, g, 2, 0.6, 0.35);
};

/* ------------------------------------------------------------------ casa */

export const farmhouse = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  footing(g, 10.6, 9.4);
  const W = 9;
  const D = 6.4;
  // paredes de tábua clara com rodapé
  box(g, [W, 3.4, D], [0, 1.88, -0.6], lambert('#f4ead8'));
  box(g, [W + 0.1, 0.4, D + 0.1], [0, 0.38, -0.6], lambert('#a9785a'));
  for (const sx of [-W / 2, W / 2])
    for (const sz of [-D / 2 - 0.6, D / 2 - 0.6])
      box(g, [0.25, 3.5, 0.25], [sx, 1.9, sz], lambert('#8a5a34'));
  gableRoof(g, W + 1.2, D + 1.4, 2.6, 3.55, '#c8553d');
  // beiral escuro na base do telhado
  box(g, [W + 1.2, 0.18, D + 1.4], [0, 3.52, -0.6], lambert('#8e3b2a'));
  // varanda
  box(g, [W, 0.22, 2.6], [0, 0.29, D / 2 + 0.7], lambert('#9e7044'));
  for (const sx of [-W / 2 + 0.2, -1.4, 1.4, W / 2 - 0.2])
    box(g, [0.2, 2.6, 0.2], [sx, 1.6, D / 2 + 1.8], lambert('#f4ead8'));
  const porchRoof = box(g, [W + 0.4, 0.16, 3], [0, 3.05, D / 2 + 0.75], lambert('#a8452f'));
  porchRoof.rotation.x = 0.18;
  for (const sx of [-W / 2 + 0.2, W / 2 - 0.2]) {
    box(g, [0.08, 0.6, 2.4], [sx, 0.85, D / 2 + 0.7], lambert('#f4ead8'));
  }
  // degraus
  box(g, [2, 0.15, 0.5], [0, 0.12, D / 2 + 2.2], lambert('#8a5a34'));
  // porta e janelas (acendem de noite)
  box(g, [1.2, 2.2, 0.1], [0, 1.6, D / 2 - 0.58], lambert('#7a4a2a'));
  box(g, [0.12, 0.12, 0.08], [0.4, 1.6, D / 2 - 0.5], glow('#ffd166'));
  for (const sx of [-2.9, 2.9]) {
    box(g, [1.3, 1.1, 0.08], [sx, 2.0, D / 2 - 0.58], kit.night.windows);
    box(g, [1.45, 0.1, 0.12], [sx, 1.42, D / 2 - 0.52], lambert('#ffffff'));
    box(g, [0.06, 1.1, 0.1], [sx, 2.0, D / 2 - 0.52], lambert('#ffffff'));
    for (const side of [-0.85, 0.85])
      box(g, [0.38, 1.2, 0.06], [sx + side, 2.0, D / 2 - 0.5], lambert('#3f7a5a'));
    // floreira
    box(g, [1.3, 0.25, 0.3], [sx, 1.3, D / 2 - 0.4], lambert('#7a4a2a'));
    for (let i = 0; i < 4; i++)
      box(
        g,
        [0.18, 0.18, 0.18],
        [sx - 0.45 + i * 0.3, 1.5, D / 2 - 0.4],
        lambert(['#ff7eb6', '#ffd166', '#c4b5fd', '#ff9f68'][i]),
      );
  }
  for (const sz of [-2.2, 0.8]) {
    box(g, [0.08, 1.1, 1.2], [W / 2 + 0.01, 2.0, sz - 0.6], kit.night.windows);
    box(g, [0.08, 1.1, 1.2], [-W / 2 - 0.01, 2.0, sz - 0.6], kit.night.windows);
  }
  // chaminé com fumaça
  box(g, [0.8, 2.4, 0.8], [2.6, 5.2, -1.6], lambert('#9a5b45'));
  box(g, [1, 0.2, 1], [2.6, 6.45, -1.6], lambert('#7a4535'));
  const chimney = new THREE.Vector3(2.6, 6.6, -1.6);
  g.updateMatrixWorld(true);
  g.localToWorld(chimney);
  let next = 0;
  kit.ticks.push((t) => {
    if (t < next) return;
    next = t + 0.4;
    kit.particles.spawn(chimney, {
      color: '#e8e4f0',
      velocity: [0.3 + Math.random() * 0.2, 1.1, Math.random() * 0.2],
      size: 0.35,
      grow: 2.2,
      life: 2.6,
      opacity: 0.8,
    });
  });
  // cadeira de balanço
  const chair = live(new THREE.Group());
  chair.position.set(-2.4, 0.4, D / 2 + 1.0);
  chair.rotation.y = 0.3;
  g.add(chair);
  box(chair, [0.8, 0.1, 0.7], [0, 0.45, 0], lambert('#8a5a34'));
  box(chair, [0.8, 0.9, 0.08], [0, 0.95, -0.35], lambert('#8a5a34'));
  for (const sx of [-0.38, 0.38]) {
    const rocker = box(chair, [0.06, 0.08, 1.0], [sx, 0.05, 0], lambert('#6b4423'));
    rocker.rotation.x = 0.05;
    box(chair, [0.06, 0.45, 0.06], [sx, 0.25, 0.25], lambert('#6b4423'));
    box(chair, [0.06, 0.45, 0.06], [sx, 0.25, -0.25], lambert('#6b4423'));
  }
  box(chair, [0.7, 0.12, 0.6], [0, 0.55, 0.02], lambert('#8b5cf6'));
  kit.ticks.push((t) => (chair.rotation.x = Math.sin(t * 1.4) * 0.12));
  // gato dormindo no degrau
  const cat = new THREE.Group();
  cat.position.set(1.6, 0.42, D / 2 + 1.4);
  g.add(cat);
  box(cat, [0.5, 0.25, 0.35], [0, 0.12, 0], lambert('#f0a050'));
  box(cat, [0.28, 0.24, 0.26], [0.32, 0.18, 0], lambert('#f0a050'));
  box(cat, [0.07, 0.1, 0.07], [0.38, 0.33, 0.08], lambert('#f0a050'));
  box(cat, [0.07, 0.1, 0.07], [0.38, 0.33, -0.08], lambert('#f0a050'));
  box(cat, [0.4, 0.08, 0.08], [-0.3, 0.06, 0.15], lambert('#e08a3a'));
  // lâmpada da varanda
  box(g, [0.3, 0.3, 0.3], [0, 2.8, D / 2 + 0.6], kit.night.bulbs);
  halo(kit, g, [0, 2.8, D / 2 + 0.6], 2.4);
  nightLight(kit, g, [0, 2.6, D / 2 + 2], '#ffc977', 12, 16);
  // paredes (colisão)
  wallRect(kit, g, W + 0.4, D + 0.4, 0, -0.6);
  for (const sx of [-W / 2 + 0.2, -1.4, 1.4, W / 2 - 0.2]) solid(kit, g, sx, D / 2 + 1.8, 0.25);
  wallPath(kit, g, [
    [-W / 2, D / 2],
    [-W / 2, D / 2 + 1.9],
  ]);
  wallPath(kit, g, [
    [W / 2, D / 2],
    [W / 2, D / 2 + 1.9],
  ]);
  return g;
};

/** Varal com roupa balançando. */
export const clothesline = (kit: Kit, x: number, z: number, angle: number) => {
  const g = group(kit, x, z, { live: true });
  g.rotation.y = angle;
  for (const sx of [-2.5, 2.5]) {
    box(g, [0.12, 2, 0.12], [sx, 1, 0], lambert('#8a5a34'));
    box(g, [0.6, 0.1, 0.1], [sx, 1.95, 0], lambert('#8a5a34'));
  }
  box(g, [5, 0.03, 0.03], [0, 1.9, 0], lambert('#e8e4f0'));
  const clothes = ['#8b5cf6', '#ffffff', '#ffd166', '#5ec8f2', '#ff7eb6'].map((color, i) => {
    const piece = new THREE.Group();
    piece.position.set(-2 + i * 1, 1.9, 0);
    g.add(piece);
    box(piece, [0.7, i % 2 ? 0.6 : 0.85, 0.04], [0, i % 2 ? -0.3 : -0.42, 0], lambert(color));
    return piece;
  });
  kit.ticks.push((t) => clothes.forEach((piece, i) => (piece.rotation.x = Math.sin(t * 2.2 + i) * 0.22)));
  kit.obstacles.push(
    { x: x + Math.cos(angle) * -2.5, z: z - Math.sin(angle) * -2.5, r: 0.2 },
    { x: x + Math.cos(angle) * 2.5, z: z - Math.sin(angle) * 2.5, r: 0.2 },
  );
};

export const mailbox = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z, { live: true });
  faceTo(g, faceX, faceZ);
  box(g, [0.16, 1.1, 0.16], [0, 0.55, 0], lambert('#6b4423'));
  box(g, [0.55, 0.5, 0.85], [0, 1.3, 0], lambert('#7c3aed'));
  const top = mesh(
    g,
    new THREE.CylinderGeometry(0.275, 0.275, 0.85, 10, 1, false, 0, Math.PI),
    lambert('#7c3aed'),
    [0, 1.55, 0],
  );
  top.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  box(g, [0.5, 0.06, 0.02], [0, 1.4, 0.43], lambert('#ffffff'));
  const flag = new THREE.Group();
  flag.position.set(0.3, 1.3, -0.1);
  g.add(flag);
  box(flag, [0.04, 0.6, 0.06], [0, 0.3, 0], lambert('#ffd166'));
  box(flag, [0.04, 0.2, 0.25], [0, 0.55, 0.12], lambert('#ffd166'));
  flag.rotation.x = 1.4;
  kit.obstacles.push({ x, z, r: 0.5 });
  let target = 1.4;
  kit.ticks.push((_, dt) => (flag.rotation.x += (target - flag.rotation.x) * Math.min(1, dt * 4)));
  return () => {
    target = 0;
  };
};

/** Rancho com o fogão a lenha, chaleira soltando vapor. */
export const woodStove = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  footing(g, 6.4, 5, '#9b8f7f', 0.12);
  for (const [sx, sz] of [
    [-2.8, -2],
    [2.8, -2],
    [-2.8, 2],
    [2.8, 2],
  ]) {
    box(g, [0.25, 3.2, 0.25], [sx, 1.6, sz], lambert('#6b4423'));
    solid(kit, g, sx, sz, 0.3);
  }
  const roof = box(g, [6.6, 0.2, 5.4], [0, 3.35, 0], lambert('#b8743a'));
  roof.rotation.x = -0.12;
  for (let i = 0; i < 9; i++)
    box(g, [0.1, 0.12, 5.4], [-3 + i * 0.75, 3.48, 0], lambert('#9c5f2c')).rotation.x = -0.12;
  // o fogão: alvenaria branca com chapa de ferro
  const stove = new THREE.Group();
  stove.position.set(0, 0, -1.2);
  g.add(stove);
  box(stove, [2.6, 1.0, 1.2], [0, 0.6, 0], lambert('#f2ece0'));
  box(stove, [2.7, 0.1, 1.3], [0, 1.12, 0], lambert('#2d2d33'));
  for (const sx of [-0.7, 0.3]) mesh(stove, CYL, lambert('#1f1f24'), [sx, 1.18, 0]).scale.set(0.3, 0.04, 0.3);
  const fire = live(box(stove, [0.6, 0.35, 0.06], [-0.5, 0.45, 0.6], glow('#ff8a3d')));
  box(stove, [0.18, 2.6, 0.18], [1.0, 2.4, -0.3], lambert('#2d2d33'));
  // chaleira
  const kettle = new THREE.Group();
  kettle.position.set(0.3, 1.25, 0);
  stove.add(kettle);
  mesh(kettle, SPHERE, lambert('#c0c4cc'), [0, 0.18, 0]).scale.set(0.3, 0.24, 0.3);
  box(kettle, [0.25, 0.06, 0.06], [0.3, 0.25, 0], lambert('#c0c4cc'));
  // bule e canecas na mesa
  box(g, [2.2, 0.1, 1], [-0.6, 0.95, 1.1], lambert('#9e7044'));
  for (const sx of [-1.5, 0.3]) box(g, [0.1, 0.9, 0.8], [sx, 0.45, 1.1], lambert('#6b4423'));
  ['#8b5cf6', '#ffffff', '#ffd166'].forEach((color, i) => {
    mesh(g, CYL, lambert(color), [-1.3 + i * 0.5, 1.12, 1.1]).scale.set(0.11, 0.22, 0.11);
  });
  box(g, [2.2, 0.1, 0.4], [-0.6, 0.5, 2.0], lambert('#8a5a34'));
  // lenha empilhada
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4 - row; i++) {
      const log = mesh(g, CYL6, lambert(i % 2 ? '#8a5a34' : '#7a4a2a'), [
        2.2,
        0.2 + row * 0.34,
        -1.4 + i * 0.36 + row * 0.18,
      ]);
      log.scale.set(0.17, 1.1, 0.17);
      log.rotation.z = Math.PI / 2;
    }
  }
  solid(kit, g, 0, -1.2, 1.3);
  solid(kit, g, -0.6, 1.1, 1.1);
  nightLight(kit, g, [-0.5, 1, 0], '#ff8a3d', 8, 10);
  const vapor = new THREE.Vector3(0.6, 1.6, -1.2);
  g.updateMatrixWorld(true);
  g.localToWorld(vapor);
  const smoke = new THREE.Vector3(1.0, 3.8, -1.5);
  g.localToWorld(smoke);
  let next = 0;
  kit.ticks.push((t) => {
    fire.scale.y = 0.35 * (0.8 + Math.sin(t * 11) * 0.2);
    if (t < next) return;
    next = t + 0.3;
    kit.particles.spawn(vapor, {
      color: '#ffffff',
      velocity: [0.2, 0.9, 0.1],
      size: 0.12,
      grow: 2,
      life: 1.3,
      opacity: 0.7,
    });
    kit.particles.spawn(smoke, {
      color: '#cfcbd6',
      velocity: [0.25, 1.1, 0.1],
      size: 0.25,
      grow: 2,
      life: 2.2,
      opacity: 0.7,
    });
  });
};

/* ---------------------------------------------------------------- GitHub */

/** Grade de commits no chão, acendendo em ondas. */
export const commitGrid = (kit: Kit, x: number, z: number, angle: number) => {
  const cols = 20;
  const rows = 7;
  const grid = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.42),
    new THREE.MeshLambertMaterial({ flatShading: true }),
    cols * rows,
  );
  const matrix = new THREE.Matrix4();
  const rand = seeded(42);
  const base: number[] = [];
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const lx = (col - cols / 2) * 0.5;
      const lz = (row - rows / 2) * 0.5;
      const wx = x + lx * c + lz * s;
      const wz = z - lx * s + lz * c;
      matrix.makeRotationY(angle).setPosition(wx, terrainHeight(wx, wz) + 0.06, wz);
      grid.setMatrixAt(col * rows + row, matrix);
      base.push(Math.floor(rand() * rand() * 5));
    }
  }
  const levels = ['#2b3a2b', '#0e4429', '#006d32', '#26a641', '#39d353'].map((v) => new THREE.Color(v));
  kit.scene.add(grid);
  let next = 0;
  kit.ticks.push((t) => {
    if (t < next) return;
    next = t + 0.12;
    const wave = (t * 5) % (cols + 8);
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const i = col * rows + row;
        const boost = Math.abs(col - wave) < 1.2 ? 2 : 0;
        grid.setColorAt(i, levels[Math.min(4, base[i] + boost)]);
      }
    }
    grid.instanceColor!.needsUpdate = true;
  });
};

/* ------------------------------------------------------------------- silo */

export const silo = (kit: Kit, x: number, z: number, icons: string[]) => {
  const g = group(kit, x, z);
  footing(g, 4.6, 4.6, '#8d8478', 0.2);
  const body = mesh(g, CYL, lambert('#c9ced6'), [0, 4.7, 0]);
  body.scale.set(1.9, 9, 1.9);
  for (let i = 0; i < 6; i++)
    mesh(g, CYL, lambert('#9aa1ab'), [0, 1 + i * 1.6, 0]).scale.set(1.94, 0.12, 1.94);
  mesh(g, CYL, lambert('#7c3aed'), [0, 7.3, 0]).scale.set(1.95, 0.9, 1.95);
  const dome = mesh(
    g,
    new THREE.SphereGeometry(1.95, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    lambert('#a7adb6'),
    [0, 9.2, 0],
  );
  dome.scale.y = 0.7;
  box(g, [0.3, 0.3, 0.3], [0, 10.7, 0], lambert('#7c3aed'));
  // escada
  for (const sx of [-0.35, 0.35]) box(g, [0.08, 9, 0.08], [sx, 4.7, 2.0], lambert('#5d636c'));
  for (let i = 0; i < 16; i++) box(g, [0.7, 0.06, 0.06], [0, 0.6 + i * 0.55, 2.0], lambert('#5d636c'));
  kit.obstacles.push({ x, z, r: 2.2 });
  const beaconLight = live(box(g, [0.3, 0.3, 0.3], [0, 11, 0], glow('#ff4d6d')));

  const ring = live(new THREE.Group());
  ring.position.set(x, g.position.y, z);
  kit.scene.add(ring);
  const cubes = icons.map((icon, i) => {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.95, 0.95),
      new THREE.MeshBasicMaterial({ map: iconTexture(icon) }),
    );
    const a = (i / icons.length) * Math.PI * 2;
    cube.position.set(Math.cos(a) * 3.6, 2 + (i % 3) * 1.8, Math.sin(a) * 3.6);
    ring.add(cube);
    return cube;
  });
  kit.ticks.push((t) => {
    ring.rotation.y = t * 0.35;
    cubes.forEach((cube, i) => {
      cube.rotation.x = t * 0.8 + i;
      cube.rotation.y = t * 1.1 + i;
      cube.position.y = 2 + (i % 3) * 1.8 + Math.sin(t * 2 + i) * 0.25;
    });
    beaconLight.visible = Math.sin(t * 5) > -0.3;
  });
};

/* ---------------------------------------------------------------- celeiro */

export const barn = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  footing(g, 10.6, 9.2);
  const W = 9.4;
  const D = 8;
  const red = lambert('#b8423a');
  const trim = lambert('#f6efe2');
  box(g, [W, 4.4, D], [0, 2.38, 0], red);
  for (let i = 0; i < 12; i++)
    box(g, [0.06, 4.3, D + 0.04], [-W / 2 + 0.4 + i * 0.78, 2.38, 0], lambert('#a83a33'));
  // telhado holandês (duas inclinações)
  const shape = new THREE.Shape();
  shape.moveTo(-D / 2 - 0.4, 0);
  shape.lineTo(D / 2 + 0.4, 0);
  shape.lineTo(D / 2 - 0.9, 1.9);
  shape.lineTo(0, 3.0);
  shape.lineTo(-D / 2 + 0.9, 1.9);
  shape.closePath();
  const roofGeometry = new THREE.ExtrudeGeometry(shape, { depth: W + 0.8, bevelEnabled: false });
  roofGeometry.translate(0, 0, -(W + 0.8) / 2);
  roofGeometry.rotateY(Math.PI / 2);
  mesh(g, roofGeometry, lambert('#5b5f6b'), [0, 4.55, 0]);
  // empena da frente e de trás (triângulo vermelho por baixo do telhado)
  for (const sz of [D / 2 - 0.02, -D / 2 + 0.02]) {
    const gable = new THREE.Shape();
    gable.moveTo(-D / 2 + 0.2, 0);
    gable.lineTo(D / 2 - 0.2, 0);
    gable.lineTo(D / 2 - 1.1, 1.75);
    gable.lineTo(0, 2.75);
    gable.lineTo(-D / 2 + 1.1, 1.75);
    gable.closePath();
    const front = mesh(g, new THREE.ShapeGeometry(gable), red, [0, 4.55, sz]);
    if (sz < 0) front.rotation.y = Math.PI;
  }
  // portas abertas com o X branco
  box(g, [3.4, 3.4, 0.1], [0, 1.9, D / 2 + 0.01], lambert('#3a2418'));
  for (const side of [-1, 1]) {
    const door = new THREE.Group();
    door.position.set(side * 1.7, 0.2, D / 2 + 0.05);
    door.rotation.y = side * 1.9;
    g.add(door);
    box(door, [1.7, 3.4, 0.12], [-side * 0.85, 1.7, 0], red);
    box(door, [1.7, 0.16, 0.14], [-side * 0.85, 0.1, 0], trim);
    box(door, [1.7, 0.16, 0.14], [-side * 0.85, 3.3, 0], trim);
    box(door, [0.16, 3.4, 0.14], [-side * 1.62, 1.7, 0], trim);
    const x1 = box(door, [0.14, 3.6, 0.14], [-side * 0.85, 1.7, 0.02], trim);
    x1.rotation.z = 0.46;
    const x2 = box(door, [0.14, 3.6, 0.14], [-side * 0.85, 1.7, 0.02], trim);
    x2.rotation.z = -0.46;
  }
  // feno lá dentro
  box(g, [3, 1.2, 2], [0, 0.8, D / 2 - 1.4], lambert('#e3c65a'));
  // janela do palheiro
  box(g, [1.3, 1.1, 0.1], [0, 5.3, D / 2 + 0.02], lambert('#3a2418'));
  box(g, [1.0, 0.5, 0.2], [0, 5.0, D / 2 + 0.06], lambert('#e3c65a'));
  for (const sx of [-0.7, 0.7]) box(g, [0.12, 1.3, 0.14], [sx, 5.3, D / 2 + 0.06], trim);
  box(g, [1.5, 0.12, 0.14], [0, 5.9, D / 2 + 0.06], trim);
  for (const sx of [-W / 2, W / 2])
    for (const sz of [-D / 2, D / 2]) box(g, [0.22, 4.4, 0.22], [sx, 2.38, sz], trim);
  // cata-vento de galo
  const vane = live(new THREE.Group());
  vane.position.set(0, 7.6, 0);
  g.add(vane);
  box(vane, [0.06, 0.8, 0.06], [0, -0.2, 0], lambert('#3a3a3a'));
  box(vane, [0.5, 0.35, 0.06], [0, 0.3, 0], lambert('#2a2a2a'));
  box(vane, [0.18, 0.2, 0.06], [0.28, 0.5, 0], lambert('#2a2a2a'));
  box(vane, [0.15, 0.3, 0.06], [-0.3, 0.45, 0], lambert('#2a2a2a'));
  kit.ticks.push((t) => (vane.rotation.y = Math.sin(t * 0.3) * 1.2));
  // lampião em cima da porta
  box(g, [0.3, 0.3, 0.3], [0, 3.9, D / 2 + 0.25], kit.night.bulbs);
  halo(kit, g, [0, 3.9, D / 2 + 0.3], 2.4);
  nightLight(kit, g, [0, 3.6, D / 2 + 1.6], '#ffc977', 10, 15);
  wallRect(kit, g, W + 0.3, D + 0.3);
  return g;
};

/** Baú do currículo: abre a tampa quando a pessoa chega. */
export const chest = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z, { live: true });
  faceTo(g, faceX, faceZ);
  box(g, [1.5, 0.8, 1], [0, 0.4, 0], lambert('#8a5a34'));
  for (const sx of [-0.5, 0.5]) box(g, [0.14, 0.82, 1.04], [sx, 0.4, 0], lambert('#ffd166'));
  box(g, [0.3, 0.3, 0.06], [0, 0.6, 0.52], lambert('#ffd166'));
  const treasure = box(g, [1.3, 0.2, 0.8], [0, 0.75, 0], glow('#ffd166'));
  treasure.visible = false;
  const lid = new THREE.Group();
  lid.position.set(0, 0.8, -0.5);
  g.add(lid);
  box(lid, [1.5, 0.35, 1], [0, 0.17, 0.5], lambert('#9b6b3e'));
  for (const sx of [-0.5, 0.5]) box(lid, [0.14, 0.37, 1.04], [sx, 0.17, 0.5], lambert('#ffd166'));
  // papel do currículo saindo do baú
  const paper = box(g, [0.6, 0.02, 0.8], [0, 0.9, 0], lambert('#ffffff'));
  paper.visible = false;
  kit.obstacles.push({ x, z, r: 0.9 });
  let open = false;
  let next = 0;
  kit.ticks.push((t, dt) => {
    const target = open ? -1.9 : 0;
    lid.rotation.x += (target - lid.rotation.x) * Math.min(1, dt * 3);
    if (open) {
      paper.position.y = 1.1 + Math.sin(t * 2) * 0.1;
      paper.rotation.y = t;
    }
    if (open && t > next) {
      next = t + 0.15;
      kit.particles.spawn([x + (Math.random() - 0.5), g.position.y + 1.1, z + (Math.random() - 0.5)], {
        color: Math.random() > 0.5 ? '#ffd166' : '#fff1a8',
        velocity: [0, 1.5, 0],
        size: 0.1,
        life: 1,
      });
    }
  });
  return () => {
    open = true;
    treasure.visible = true;
    paper.visible = true;
  };
};

/** Trator vermelho estacionado. */
export const tractor = (kit: Kit, x: number, z: number, angle: number) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  const red = lambert('#d23b2e');
  box(g, [1.3, 0.9, 2.6], [0, 1.15, 0.2], red);
  box(g, [1.1, 0.6, 1.2], [0, 1.0, 1.6], red);
  box(g, [1.0, 0.1, 0.1], [0, 1.35, 2.25], lambert('#2a2a2a'));
  box(g, [0.12, 1.0, 0.12], [0.35, 2.0, 1.4], lambert('#3a3a3a'));
  box(g, [0.8, 0.12, 0.7], [0, 1.95, -0.5], lambert('#2a2a2a'));
  box(g, [0.7, 0.6, 0.12], [0, 2.2, -0.85], lambert('#2a2a2a'));
  for (const side of [-1, 1]) {
    const rear = mesh(g, CYL, lambert('#222'), [side * 0.9, 0.85, -0.6]);
    rear.scale.set(0.85, 0.45, 0.85);
    rear.rotation.z = Math.PI / 2;
    const hub = mesh(g, CYL, lambert('#ffd166'), [side * 1.14, 0.85, -0.6]);
    hub.scale.set(0.35, 0.05, 0.35);
    hub.rotation.z = Math.PI / 2;
    const front = mesh(g, CYL, lambert('#222'), [side * 0.75, 0.5, 1.6]);
    front.scale.set(0.5, 0.3, 0.5);
    front.rotation.z = Math.PI / 2;
  }
  kit.obstacles.push({ x, z, r: 1.6 });
  solid(kit, g, 0, 1.6, 1);
};

export const hayBale = (kit: Kit, x: number, z: number, angle = 0, round = true) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  if (round) {
    const bale = mesh(g, CYL, lambert('#e3c65a'), [0, 0.75, 0]);
    bale.scale.set(0.75, 1.3, 0.75);
    bale.rotation.z = Math.PI / 2;
    for (const sx of [-0.66, 0.66]) {
      const face = mesh(g, CYL, lambert('#d4b44a'), [sx, 0.75, 0]);
      face.scale.set(0.68, 0.02, 0.68);
      face.rotation.z = Math.PI / 2;
    }
    kit.obstacles.push({ x, z, r: 0.9 });
  } else {
    box(g, [1.2, 0.6, 0.7], [0, 0.3, 0], lambert('#e3c65a'));
    box(g, [1.22, 0.04, 0.72], [0, 0.42, 0], lambert('#c9a83f'));
    kit.obstacles.push({ x, z, r: 0.6 });
  }
};

export const scarecrow = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z, { live: true });
  box(g, [0.12, 2.2, 0.12], [0, 1.1, 0], lambert('#6b4423'));
  box(g, [1.6, 0.12, 0.12], [0, 1.7, 0], lambert('#6b4423'));
  box(g, [0.7, 0.8, 0.4], [0, 1.6, 0], lambert('#5b8def'));
  box(g, [0.75, 0.2, 0.42], [0, 1.15, 0], lambert('#c84a3a'));
  box(g, [0.5, 0.5, 0.5], [0, 2.35, 0], lambert('#f4d58d'));
  box(g, [0.08, 0.08, 0.04], [-0.1, 2.4, 0.26], lambert('#222'));
  box(g, [0.08, 0.08, 0.04], [0.1, 2.4, 0.26], lambert('#222'));
  mesh(g, shared(new THREE.ConeGeometry(0.6, 0.5, 8)), lambert('#d9a441'), [0, 2.8, 0]);
  kit.ticks.push((t) => (g.rotation.z = Math.sin(t * 1.5 + x) * 0.05));
  kit.obstacles.push({ x, z, r: 0.3 });
};

/* ------------------------------------------------------- feira dos projetos */

const STRIPES = ['#8b5cf6', '#ffffff'];

/** Barraca da feira com o print do projeto bem nítido. */
export const stall = (
  kit: Kit,
  x: number,
  z: number,
  faceX: number,
  faceZ: number,
  name: string,
  image?: string,
) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  footing(g, 3.8, 2.6, '#9b8f7f', 0.1);
  for (const [sx, sz] of [
    [-1.7, -1],
    [1.7, -1],
    [-1.7, 1],
    [1.7, 1],
  ])
    box(g, [0.16, 3, 0.16], [sx, 1.5, sz], lambert('#6b4423'));
  // balcão
  box(g, [3.5, 1.05, 0.7], [0, 0.6, 0.9], lambert('#9e7044'));
  box(g, [3.7, 0.1, 0.9], [0, 1.15, 0.9], lambert('#c9a46b'));
  // toldo listrado
  for (let i = 0; i < 8; i++) {
    const stripe = box(g, [0.46, 0.08, 2.6], [-1.62 + i * 0.465, 3.2, 0.25], lambert(STRIPES[i % 2]));
    stripe.rotation.x = 0.22;
  }
  for (let i = 0; i < 8; i++) {
    const flap = box(g, [0.46, 0.35, 0.05], [-1.62 + i * 0.465, 2.78, 1.52], lambert(STRIPES[i % 2]));
    flap.rotation.x = 0.1;
  }
  // painel com a imagem
  box(g, [3.3, 2.15, 0.12], [0, 2.0, -0.95], lambert('#2a1650'));
  if (image) {
    const picture = new THREE.Mesh(
      new THREE.PlaneGeometry(3.04, 1.9),
      new THREE.MeshBasicMaterial({ map: imageTexture(image), toneMapped: false }),
    );
    picture.position.set(0, 2.0, -0.88);
    g.add(picture);
  }
  // placa com o nome em cima
  box(g, [3.3, 0.8, 0.12], [0, 3.85, 0.98], lambert('#2a1650'));
  signBoard(g, [name], 3.1, [0, 3.85, 1.05], {
    bg: '#2a1650',
    color: '#f4f0ff',
    size: 92,
    canvas: 1024,
    basic: true,
  });
  // lampadinhas na borda do toldo
  for (let i = 0; i < 9; i++) box(g, [0.13, 0.13, 0.13], [-1.6 + i * 0.4, 2.6, 1.56], kit.night.bulbs);
  halo(kit, g, [0, 2.6, 1.6], 3.2);
  // caixotes e coisinhas no balcão
  box(g, [0.5, 0.35, 0.4], [-1.1, 1.38, 0.9], lambert('#e3c65a'));
  box(g, [0.35, 0.25, 0.35], [1.2, 1.32, 0.95], lambert('#ff7eb6'));
  wallRect(kit, g, 3.6, 2.4, 0, 0.1);
};

/** Fliperama do Flappy Bird, com a tela animada de verdade. */
export const arcade = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z, { live: true });
  faceTo(g, faceX, faceZ);
  box(g, [1.7, 2.7, 1.3], [0, 1.35, 0], lambert('#5b2bb5'));
  box(g, [1.8, 0.12, 1.4], [0, 2.72, 0], lambert('#2a1650'));
  box(g, [1.72, 0.55, 0.3], [0, 2.95, 0.45], glow('#ff7eb6'));
  box(g, [1.7, 0.15, 0.75], [0, 1.2, 0.9], lambert('#2a1650'));
  box(g, [0.08, 0.3, 0.08], [-0.35, 1.4, 0.9], lambert('#222'));
  box(g, [0.18, 0.18, 0.18], [-0.35, 1.57, 0.9], glow('#ff4d6d'));
  box(g, [0.16, 0.06, 0.16], [0.15, 1.3, 0.9], glow('#ffd166'));
  box(g, [0.16, 0.06, 0.16], [0.45, 1.3, 1.0], glow('#5ec8f2'));
  const { canvas, ctx } = makeCanvas(128, 96);
  const texture = canvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36, 1.02),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  screen.position.set(0, 2.02, 0.66);
  screen.rotation.x = -0.18;
  g.add(screen);
  signBoard(g, ['FLAPPY'], 1.55, [0, 2.95, 0.61], {
    bg: '#ff7eb6',
    color: '#2a1650',
    size: 110,
    canvas: 512,
    basic: true,
  });
  kit.obstacles.push({ x, z, r: 1.1 });
  let next = 0;
  let birdY = 48;
  let velocity = 0;
  kit.ticks.push((t) => {
    if (t < next) return;
    next = t + 1 / 15;
    const scroll = (t * 60) % 80;
    ctx.fillStyle = '#4ec0ca';
    ctx.fillRect(0, 0, 128, 96);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(((-t * 12) % 160) + 140, 16, 20, 6);
    ctx.fillStyle = '#5ee26b';
    for (let i = 0; i < 3; i++) {
      const px = i * 80 - scroll + 40;
      const gap = 28 + ((i * 11 + Math.floor((t * 60) / 80)) % 3) * 12;
      ctx.fillRect(px, 0, 16, gap);
      ctx.fillRect(px, gap + 32, 16, 96);
    }
    velocity += 1.2;
    birdY += velocity;
    if (birdY > 60) velocity = -6.8;
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(36, birdY, 12, 10);
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(48, birdY + 4, 4, 4);
    ctx.fillStyle = '#d7b46a';
    ctx.fillRect(0, 84, 128, 12);
    texture.needsUpdate = true;
  });
};

/** Roda-gigante no meio da feira. */
export const ferrisWheel = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  const steel = lambert('#e8e4f0');
  for (const sz of [-0.9, 0.9]) {
    for (const side of [-1, 1]) {
      const leg = box(g, [0.18, 5.4, 0.18], [side * 1.2, 2.5, sz], steel);
      leg.rotation.z = side * 0.25;
    }
  }
  box(g, [3.2, 0.3, 2.4], [0, 0.15, 0], lambert('#6d28d9'));
  const wheel = live(new THREE.Group());
  wheel.position.set(0, 5, 0);
  g.add(wheel);
  const R = 3.3;
  const ringGeometry = new THREE.TorusGeometry(R, 0.08, 6, 32);
  for (const sz of [-0.7, 0.7]) mesh(wheel, ringGeometry, lambert('#a78bfa'), [0, 0, sz]);
  const cabins: THREE.Group[] = [];
  const colors = ['#ff7eb6', '#ffd166', '#5ec8f2', '#5ee26b', '#ff9f68', '#c4b5fd', '#ff4d6d', '#8b5cf6'];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = box(wheel, [0.08, R, 0.08], [(Math.cos(a) * R) / 2, (Math.sin(a) * R) / 2, 0], steel);
    spoke.rotation.z = a - Math.PI / 2;
    box(wheel, [0.16, 0.16, 0.16], [Math.cos(a) * R, Math.sin(a) * R, 0.75], kit.night.bulbs);
    const cabin = new THREE.Group();
    cabin.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    wheel.add(cabin);
    box(cabin, [0.06, 0.5, 0.06], [0, -0.25, 0], steel);
    box(cabin, [0.8, 0.5, 0.9], [0, -0.7, 0], lambert(colors[i]));
    box(cabin, [0.9, 0.08, 1.0], [0, -0.42, 0], lambert('#ffffff'));
    cabins.push(cabin);
  }
  const axle = mesh(wheel, CYL, lambert('#6d28d9'), [0, 0, 0]);
  axle.scale.set(0.4, 1.6, 0.4);
  axle.rotation.x = Math.PI / 2;
  halo(kit, g, [0, 5, 1.2], 5);
  kit.ticks.push((t) => {
    wheel.rotation.z = t * 0.25;
    cabins.forEach((cabin) => (cabin.rotation.z = -wheel.rotation.z));
  });
  kit.obstacles.push({ x, z, r: 2.1 });
  nightLight(kit, g, [0, 4, 2], '#c084fc', 10, 18);
};

/** Bandeirinhas de festa junina entre dois pontos. */
export const bunting = (kit: Kit, a: [number, number, number], b: [number, number, number]) => {
  const colors = ['#ff4d6d', '#ffd166', '#5ec8f2', '#5ee26b', '#8b5cf6', '#ff9f68'];
  const length = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const count = Math.max(3, Math.floor(length / 0.6));
  const angle = Math.atan2(b[0] - a[0], b[2] - a[2]);
  const flag = shared(new THREE.ConeGeometry(0.22, 0.42, 3));
  for (let i = 1; i < count; i++) {
    const k = i / count;
    const sag = Math.sin(k * Math.PI) * 0.6;
    const m = mesh(kit.statics, flag, lambert(colors[i % colors.length]), [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k - sag - 0.22,
      a[2] + (b[2] - a[2]) * k,
    ]);
    m.rotation.set(Math.PI, angle, 0);
    m.scale.z = 0.25;
  }
};

/** Arco de entrada da feira. */
export const fairArch = (
  kit: Kit,
  x: number,
  z: number,
  faceX: number,
  faceZ: number,
  text = 'FEIRA DOS PROJETOS',
) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  for (const sx of [-2.4, 2.4]) {
    box(g, [0.3, 4.2, 0.3], [sx, 2.1, 0], lambert('#6d28d9'));
    solid(kit, g, sx, 0, 0.35);
    for (let i = 0; i < 5; i++)
      box(g, [0.16, 0.16, 0.16], [sx, 0.8 + i * 0.75, 0.2], nightGlow(kit, i % 2 ? '#ffd166' : '#ff7eb6'));
  }
  box(g, [5.4, 1.1, 0.2], [0, 4.4, 0], lambert('#2a1650'));
  signBoard(g, [text], 5.1, [0, 4.4, 0.11], {
    bg: '#2a1650',
    color: '#ffd166',
    size: 92,
    basic: true,
  });
  signBoard(g, [text], 5.1, [0, 4.4, -0.11], {
    bg: '#2a1650',
    color: '#ffd166',
    size: 92,
    basic: true,
  }).plane.rotation.y = Math.PI;
  for (let i = 0; i < 12; i++)
    box(
      g,
      [0.14, 0.14, 0.14],
      [-2.5 + i * (5 / 11), 5.05, 0.1],
      nightGlow(kit, i % 2 ? '#5ec8f2' : '#ffd166'),
    );
  lightPool(kit, x, z, 4.5, '#ffb3d9', 0.45);
};

/* ------------------------------------------------------------------ trilha */

const KIND_COLOR: Record<string, string> = {
  trabalho: '#a78bfa',
  estudo: '#5ec8f2',
  evento: '#ff7eb6',
  inicio: '#5ee26b',
};

/** Placa de um marco da carreira, com lampião que acende na visita. */
export const milestoneSign = (
  kit: Kit,
  x: number,
  z: number,
  faceX: number,
  faceZ: number,
  milestone: { date: string; title: string; place: string; kind: string },
) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  const accent = KIND_COLOR[milestone.kind] ?? '#a78bfa';
  for (const sx of [-1.15, 1.15]) box(g, [0.16, 2.6, 0.16], [sx, 1.3, -0.05], lambert('#5a3a20'));
  box(g, [2.5, 1.62, 0.1], [0, 1.75, -0.08], lambert('#5a3417'));
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.5),
    new THREE.MeshLambertMaterial({
      map: makeMilestoneTexture(milestone.date, milestone.title, milestone.place, accent),
    }),
  );
  board.position.set(0, 1.75, -0.02);
  g.add(board);
  box(g, [2.7, 0.12, 0.4], [0, 2.62, -0.05], lambert('#6b4423'));
  // lampião em cima
  const lantern = live(new THREE.Group());
  lantern.position.set(1.15, 2.75, -0.05);
  g.add(lantern);
  box(lantern, [0.28, 0.06, 0.28], [0, 0.4, 0], lambert('#2a2a2a'));
  const bulb = box(lantern, [0.22, 0.3, 0.22], [0, 0.2, 0], lambert('#6b6450'));
  box(lantern, [0.28, 0.05, 0.28], [0, 0.03, 0], lambert('#2a2a2a'));
  const glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: kit.night.halo.map,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    }),
  );
  glowSprite.position.set(0, 0.2, 0);
  glowSprite.scale.setScalar(1.6);
  lantern.add(glowSprite);
  kit.obstacles.push({ x, z, r: 0.5 });
  solid(kit, g, -1.15, -0.05, 0.25);
  solid(kit, g, 1.15, -0.05, 0.25);
  let lit = false;
  kit.ticks.push((t) => {
    if (lit) glowSprite.material.opacity = 0.55 + kit.env.night * 0.4 + Math.sin(t * 6 + x) * 0.05;
  });
  return () => {
    lit = true;
    bulb.material = glow('#ffd166');
    kit.particles.burst([x, g.position.y + 3, z], [accent, '#ffd166', '#ffffff'], 16, 3);
  };
};

/** Torre do mirante, lá no alto do morro. */
export const lookoutTower = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  const wood = lambert('#7a4f2c');
  const H = 5;
  for (const [sx, sz] of [
    [-1.6, -1.6],
    [1.6, -1.6],
    [-1.6, 1.6],
    [1.6, 1.6],
  ]) {
    box(g, [0.3, H + 3, 0.3], [sx, (H + 3) / 2 - 0.4, sz], wood);
    solid(kit, g, sx, sz, 0.35);
  }
  // travas em X
  for (const sz of [-1.6, 1.6]) {
    for (const r of [0.85, -0.85]) {
      const brace = box(g, [0.12, 4.6, 0.12], [0, H / 2, sz], lambert('#6b4423'));
      brace.rotation.z = r;
    }
  }
  box(g, [4, 0.25, 4], [0, H, 0], lambert('#9e7044'));
  for (const sz of [-1.9, 1.9]) box(g, [4, 0.12, 0.12], [0, H + 1, sz], wood);
  for (const sx of [-1.9, 1.9]) box(g, [0.12, 0.12, 4], [sx, H + 1, 0], wood);
  const roof = mesh(g, shared(new THREE.ConeGeometry(3.4, 1.8, 4)), lambert('#5b5f6b'), [0, H + 3.5, 0]);
  roof.rotation.y = Math.PI / 4;
  // escada na frente
  for (const sx of [-0.4, 0.4]) {
    const rail = box(g, [0.08, H + 0.8, 0.08], [sx, H / 2, 2.4], lambert('#6b4423'));
    rail.rotation.x = -0.3;
  }
  for (let i = 0; i < 9; i++)
    box(g, [0.8, 0.06, 0.08], [0, 0.4 + i * 0.55, 2.98 - i * 0.165], lambert('#6b4423'));
  // bandeira roxa no topo
  box(g, [0.08, 1.6, 0.08], [0, H + 5, 0], lambert('#3b3350'));
  const flag = live(new THREE.Group());
  flag.position.set(0, H + 5.5, 0);
  g.add(flag);
  box(flag, [1.2, 0.7, 0.04], [0.6, 0, 0], lambert('#8b5cf6', '#6d28d9', 0.35));
  kit.ticks.push((t) => (flag.rotation.y = Math.sin(t * 2.4) * 0.4));
  box(g, [0.36, 0.4, 0.36], [0, H + 2.4, 0], kit.night.bulbs);
  halo(kit, g, [0, H + 2.4, 0], 3);
  nightLight(kit, g, [0, H + 2, 0], '#ffc977', 10, 18);
  signBoard(g, ['MIRANTE'], 2.2, [0, H - 0.7, 1.75], {
    bg: '#5a3417',
    color: '#ffe9b0',
    size: 110,
    canvas: 768,
  });
};

/* ------------------------------------------------------------- terreiro */

export const well = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  const ring = mesh(g, CYL, lambert('#a39b8e'), [0, 0.5, 0]);
  ring.scale.set(1.2, 1, 1.2);
  mesh(g, CYL, lambert('#26405a'), [0, 0.98, 0]).scale.set(0.95, 0.04, 0.95);
  mesh(g, CYL, lambert('#8d8478'), [0, 1.02, 0]).scale.set(1.3, 0.08, 1.3);
  for (const sx of [-1.1, 1.1]) box(g, [0.18, 2.6, 0.18], [sx, 1.6, 0], lambert('#6b4423'));
  const roof = gableRoof(g, 2.8, 2.2, 0.9, 2.85, '#c8553d');
  roof.rotation.y = Math.PI / 2;
  box(g, [2.2, 0.12, 0.12], [0, 2.3, 0], lambert('#5a3a20'));
  box(g, [0.1, 0.4, 0.1], [1.25, 2.1, 0], lambert('#5a3a20'));
  const bucket = live(new THREE.Group());
  bucket.position.set(0, 2.2, 0);
  g.add(bucket);
  box(bucket, [0.03, 1, 0.03], [0, -0.5, 0], lambert('#c9a46b'));
  mesh(bucket, CYL, lambert('#8a5a34'), [0, -1.15, 0]).scale.set(0.22, 0.32, 0.22);
  kit.ticks.push((t) => (bucket.position.y = 2.2 + Math.sin(t * 0.8) * 0.25));
  kit.obstacles.push({ x, z, r: 1.45 });
};

export const windmill = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  footing(g, 3.4, 3.4);
  mesh(g, shared(new THREE.CylinderGeometry(1.0, 1.6, 6, 8)), lambert('#f4ead8'), [0, 3, 0]);
  mesh(g, shared(new THREE.ConeGeometry(1.4, 1.6, 8)), lambert('#c8553d'), [0, 6.8, 0]);
  box(g, [0.8, 1.4, 0.1], [0, 0.7, 1.5], lambert('#7a4a2a'));
  box(g, [0.5, 0.5, 0.1], [0, 3.8, 1.25], kit.night.windows);
  const hub = live(new THREE.Group());
  hub.position.set(0, 5.6, 1.35);
  g.add(hub);
  box(hub, [0.4, 0.4, 0.4], [0, 0, 0], lambert('#6b4423'));
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    hub.add(arm);
    box(arm, [0.14, 3.6, 0.08], [0, 1.9, 0], lambert('#6b4423'));
    box(arm, [0.75, 2.8, 0.04], [0.44, 2.1, 0.02], lambert('#fff7e6'));
  }
  kit.obstacles.push({ x, z, r: 1.8 });
  kit.ticks.push((t) => (hub.rotation.z = -t * 1.2));
};

export const chickenCoop = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  for (const [sx, sz] of [
    [-1.2, -0.9],
    [1.2, -0.9],
    [-1.2, 0.9],
    [1.2, 0.9],
  ])
    box(g, [0.14, 0.8, 0.14], [sx, 0.4, sz], lambert('#6b4423'));
  box(g, [2.6, 1.5, 2], [0, 1.55, 0], lambert('#e8d6b0'));
  gableRoof(g, 3, 2.6, 1, 2.3, '#b8423a');
  box(g, [0.6, 0.7, 0.06], [0.5, 1.4, 1.02], lambert('#3a2418'));
  const ramp = box(g, [0.6, 0.06, 1.5], [0.5, 0.45, 1.6], lambert('#9e7044'));
  ramp.rotation.x = 0.55;
  box(g, [0.5, 0.4, 0.06], [-0.6, 1.7, 1.02], kit.night.windows);
  kit.obstacles.push({ x, z, r: 1.6 });
  // ninho com ovos brancos do lado
  const nest = mesh(
    g,
    shared(new THREE.TorusGeometry(0.35, 0.15, 5, 10)),
    lambert('#c9a46b'),
    [-1.8, 0.12, 0.6],
  );
  nest.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++)
    mesh(g, SPHERE, lambert('#fff7e6'), [-1.8 + (i - 1) * 0.16, 0.2, 0.6]).scale.set(0.1, 0.13, 0.1);
};

/** Chiqueiro: lama, cocho e casinha. */
export const pigsty = (kit: Kit, rect: { x: number; z: number; w: number; d: number }) => {
  const y = terrainHeight(rect.x, rect.z);
  const mud = new THREE.CircleGeometry(1, 14);
  mud.rotateX(-Math.PI / 2);
  const puddle = new THREE.Mesh(
    mud,
    new THREE.MeshPhongMaterial({ color: '#5a3d24', shininess: 70, flatShading: true }),
  );
  puddle.position.set(rect.x + 1.5, y + 0.06, rect.z + 1);
  puddle.scale.set(3, 1, 2);
  kit.scene.add(puddle);
  const g = group(kit, rect.x - rect.w / 2 + 2, rect.z - rect.d / 2 + 1.8);
  box(g, [3, 1.4, 2.2], [0, 0.7, 0], lambert('#9e7044'));
  gableRoof(g, 3.4, 2.8, 0.9, 1.4, '#7a4a2a');
  box(g, [1, 0.9, 0.06], [0, 0.5, 1.12], lambert('#3a2418'));
  kit.obstacles.push({ x: g.position.x, z: g.position.z, r: 1.7 });
  const trough = group(kit, rect.x + rect.w / 2 - 1.6, rect.z - rect.d / 2 + 1.2);
  box(trough, [2, 0.5, 0.6], [0, 0.25, 0], lambert('#7a4a2a'));
  box(trough, [1.8, 0.05, 0.4], [0, 0.48, 0], lambert('#c9a46b'));
  kit.obstacles.push({ x: trough.position.x, z: trough.position.z, r: 0.9 });
};

/** Estrebaria dentro do pasto dos cavalos. */
export const stable = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  for (const sx of [-3, 0, 3]) {
    box(g, [0.2, 2.8, 0.2], [sx, 1.4, 1.2], lambert('#6b4423'));
    solid(kit, g, sx, 1.2, 0.3);
  }
  box(g, [6.4, 2.6, 0.2], [0, 1.3, -1.2], lambert('#9e7044'));
  for (const sx of [-3.1, 3.1]) box(g, [0.2, 2.6, 2.4], [sx, 1.3, 0], lambert('#9e7044'));
  const roof = box(g, [6.8, 0.18, 3.2], [0, 2.95, 0], lambert('#5b5f6b'));
  roof.rotation.x = 0.15;
  box(g, [2, 0.8, 0.6], [-1.5, 0.7, -0.8], lambert('#e3c65a'));
  box(g, [1.6, 0.5, 0.5], [1.6, 0.25, -0.8], lambert('#7a4a2a'));
  box(g, [1.4, 0.05, 0.36], [1.6, 0.5, -0.8], lambert('#5ec8f2'));
  // ferradura da sorte
  const shoe = mesh(
    g,
    shared(new THREE.TorusGeometry(0.22, 0.05, 4, 10, Math.PI * 1.4)),
    lambert('#ffd166'),
    [0, 2.3, -1.08],
  );
  shoe.rotation.z = -Math.PI * 0.2 - Math.PI / 2;
  wallPath(kit, g, [
    [-3.1, 1.2],
    [-3.1, -1.2],
    [3.1, -1.2],
    [3.1, 1.2],
  ]);
};

/** Garagem do bugue. */
export const garage = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  footing(g, 5.6, 5.4, '#8d8478', 0.1);
  box(g, [5.2, 3, 0.2], [0, 1.6, -2.4], lambert('#7d8a96'));
  for (const sx of [-2.5, 2.5]) box(g, [0.2, 3, 4.8], [sx, 1.6, 0], lambert('#7d8a96'));
  const roof = box(g, [5.8, 0.2, 5.4], [0, 3.2, 0], lambert('#4b525c'));
  roof.rotation.x = -0.08;
  box(g, [5.4, 0.9, 0.18], [0, 3.6, 2.4], lambert('#2a1650'));
  signBoard(g, ['BUGUE'], 3.6, [0, 3.6, 2.5], {
    bg: '#2a1650',
    color: '#ffd166',
    size: 120,
    canvas: 768,
    basic: true,
  });
  // ferramentas na parede, pneus e tambor de óleo
  for (let i = 0; i < 5; i++)
    box(g, [0.08, 0.7 - (i % 2) * 0.2, 0.08], [-1.6 + i * 0.5, 2, -2.25], lambert('#c0c4cc'));
  for (let i = 0; i < 3; i++) {
    const tire = mesh(g, shared(new THREE.TorusGeometry(0.42, 0.18, 6, 12)), lambert('#222'), [
      1.7,
      0.2 + i * 0.36,
      -1.5,
    ]);
    tire.rotation.x = Math.PI / 2;
  }
  mesh(g, CYL, lambert('#d23b2e'), [-1.8, 0.6, -1.6]).scale.set(0.4, 1.1, 0.4);
  box(g, [0.3, 0.3, 0.3], [0, 2.9, 1.8], kit.night.bulbs);
  halo(kit, g, [0, 2.9, 1.8], 2.2);
  wallPath(kit, g, [
    [-2.6, 2.4],
    [-2.6, -2.5],
    [2.6, -2.5],
    [2.6, 2.4],
  ]);
};

/** Placa com setas para os lugares. */
export const signpost = (
  kit: Kit,
  x: number,
  z: number,
  arrows: { text: string; toX: number; toZ: number; color?: string }[],
) => {
  const g = group(kit, x, z);
  const tall = 2.95 + arrows.length * 0.56;
  box(g, [0.2, tall, 0.2], [0, tall / 2, 0], lambert('#6b4423'));
  box(g, [0.34, 0.12, 0.34], [0, tall + 0.04, 0], lambert('#4a2e18'));
  arrows.forEach(({ text, toX, toZ, color = '#9b6b3e' }, index) => {
    const holder = new THREE.Group();
    holder.position.y = tall - 0.3 - index * 0.56;
    holder.rotation.y = Math.atan2(toX - x, toZ - z) - Math.PI / 2;
    g.add(holder);
    // placa em forma de flecha, com a distância (dá pra saber se é longe)
    const meters = Math.round(Math.hypot(toX - x, toZ - z) / 10) * 10;
    const label = meters >= 20 ? `${text} · ${meters} m` : text;
    box(holder, [2.75, 0.5, 0.08], [1.45, 0, 0], lambert(color));
    const tip = box(holder, [0.36, 0.36, 0.08], [2.83, 0, 0], lambert(color));
    tip.rotation.z = Math.PI / 4;
    for (const side of [1, -1]) {
      const { plane } = signBoard(holder, [label], 2.6, [1.4, 0, side * 0.045], {
        bg: color,
        size: 76,
        canvas: 1024,
      });
      if (side < 0) plane.rotation.y = Math.PI;
    }
  });
  kit.obstacles.push({ x, z, r: 0.3 });
};

/** Mesa de piquenique. */
export const picnicTable = (kit: Kit, x: number, z: number, angle: number) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  box(g, [2.2, 0.1, 0.9], [0, 0.8, 0], lambert('#9e7044'));
  for (const sz of [-0.85, 0.85]) box(g, [2.2, 0.08, 0.35], [0, 0.45, sz], lambert('#8a5a34'));
  for (const sx of [-0.9, 0.9]) {
    box(g, [0.12, 0.8, 0.12], [sx, 0.4, 0], lambert('#6b4423'));
    box(g, [0.1, 0.1, 2.0], [sx, 0.4, 0], lambert('#6b4423'));
  }
  box(g, [0.9, 0.02, 0.6], [0.3, 0.86, 0], lambert('#e8443a'));
  box(g, [0.3, 0.03, 0.3], [0.3, 0.87, 0], lambert('#ffffff'));
  kit.obstacles.push({ x, z, r: 1.3 });
};

/** Pilha de caixotes. */
export const crates = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  box(g, [0.8, 0.8, 0.8], [0, 0.4, 0], lambert('#b8874e'));
  box(g, [0.8, 0.8, 0.8], [0.85, 0.4, 0.1], lambert('#a8794a'));
  box(g, [0.7, 0.7, 0.7], [0.4, 1.15, 0.05], lambert('#c9985a'));
  kit.obstacles.push({ x: x + 0.4, z, r: 0.9 });
};

/* -------------------------------------------------------- marcadores */

/** Losango roxo em cima de cada estação + anel no chão; dourado depois da visita. */
export const beacon = (kit: Kit, x: number, y: number, z: number, spotX: number, spotZ: number) => {
  const gem = mesh(kit.scene, shared(new THREE.OctahedronGeometry(0.42, 0)), glow('#a78bfa'), [x, y, z]);
  gem.scale.y = 1.4;
  const ringGeometry = shared(new THREE.RingGeometry(0.95, 1.2, 28));
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: '#a78bfa',
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const ring = mesh(kit.scene, ringGeometry, ringMaterial, [spotX, groundHeight(spotX, spotZ) + 0.12, spotZ]);
  const normal = groundNormal(spotX, spotZ);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  const phase = x * 0.7 + z;
  let visited = false;
  kit.ticks.push((t) => {
    gem.rotation.y = t * 1.6 + phase;
    gem.position.y = y + Math.sin(t * 2.2 + phase) * 0.25;
    const pulse = (Math.sin(t * 3 + phase) + 1) / 2;
    ring.scale.setScalar(1 + pulse * 0.15);
    ringMaterial.opacity = visited ? 0.3 : 0.45 + pulse * 0.45;
  });
  return () => {
    if (visited) return;
    visited = true;
    gem.material = glow('#ffd166');
    ringMaterial.color.set('#5ee26b');
    kit.particles.burst([x, y, z], ['#a78bfa', '#ffd166', '#ffffff'], 20, 3);
  };
};

/** Ovo de ouro num ninho de palha. */
export const goldenEgg = (kit: Kit, x: number, z: number) => {
  const base = groundHeight(x, z);
  const nest = mesh(kit.scene, shared(new THREE.TorusGeometry(0.42, 0.17, 5, 12)), lambert('#c9a46b'), [
    x,
    base + 0.12,
    z,
  ]);
  nest.rotation.x = Math.PI / 2;
  const egg = mesh(
    kit.scene,
    SPHERE,
    new THREE.MeshPhongMaterial({ color: '#ffcf33', emissive: '#7a5200', shininess: 90, flatShading: true }),
    [x, base + 0.6, z],
  );
  egg.scale.set(0.3, 0.4, 0.3);
  const phase = x + z;
  let state: 'idle' | 'collecting' | 'gone' = 'idle';
  let timer = 0;
  let next = 0;
  kit.ticks.push((t, dt) => {
    if (state === 'gone') return;
    if (state === 'collecting') {
      timer += dt;
      egg.position.y += dt * 5;
      egg.rotation.y += dt * 20;
      egg.scale.setScalar(Math.max(0.01, 0.35 * (1 - timer * 1.6)));
      if (timer > 0.6) {
        state = 'gone';
        egg.visible = false;
        nest.visible = false;
      }
      return;
    }
    egg.rotation.y = t * 1.5 + phase;
    egg.position.y = base + 0.6 + Math.sin(t * 3 + phase) * 0.12;
    if (t > next) {
      next = t + 0.7 + Math.random();
      kit.particles.spawn([x + (Math.random() - 0.5) * 0.6, base + 0.9, z + (Math.random() - 0.5) * 0.6], {
        color: '#fff1a8',
        velocity: [0, 0.6, 0],
        size: 0.08,
        life: 0.8,
      });
    }
  });
  return {
    collect: (silent = false) => {
      if (state !== 'idle') return;
      if (silent) {
        state = 'gone';
        egg.visible = false;
        nest.visible = false;
        return;
      }
      state = 'collecting';
      kit.particles.burst([x, base + 0.8, z], ['#ffd166', '#fff1a8', '#ffffff'], 16, 3);
    },
    get collected() {
      return state !== 'idle';
    },
  };
};

/* ------------------------------------------------------ casinhas e portaria */

/**
 * Casinha de morador: paredes coloridas, telhado, porta, janelas que acendem
 * de noite, chaminé, floreira e plaquinha com o nome. Devolve a porta (no mundo).
 */
export const cottage = (
  kit: Kit,
  x: number,
  z: number,
  faceX: number,
  faceZ: number,
  options: { wall: string; roof: string; trim?: string; name: string },
) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  const W = 4.6;
  const D = 3.8;
  const trim = lambert(options.trim ?? '#f4f0ff');
  footing(g, W + 0.4, D + 0.4, '#9b8f7f', 0.2);
  box(g, [W, 2.5, D], [0, 1.45, 0], lambert(options.wall));
  for (const [cx, cz] of [
    [-W / 2, -D / 2],
    [W / 2, -D / 2],
    [-W / 2, D / 2],
    [W / 2, D / 2],
  ])
    box(g, [0.22, 2.55, 0.22], [cx, 1.45, cz], trim);
  gableRoof(g, W + 0.7, D + 0.9, 1.7, 2.7, options.roof);
  // porta com degrau e luminária
  box(g, [0.95, 1.75, 0.08], [0, 1.08, D / 2 + 0.02], lambert('#6b4423'));
  box(g, [0.08, 0.08, 0.06], [0.3, 1.1, D / 2 + 0.08], lambert('#ffd166'));
  box(g, [1.4, 0.18, 0.7], [0, 0.25, D / 2 + 0.35], lambert('#9b8f7f'));
  box(g, [0.22, 0.26, 0.22], [0.8, 2.25, D / 2 + 0.15], kit.night.bulbs);
  halo(kit, g, [0.8, 2.25, D / 2 + 0.2], 1.6);
  // janelas (frente e lados) com floreira
  for (const sx of [-1.45, 1.45]) {
    box(g, [0.85, 0.75, 0.08], [sx, 1.65, D / 2 + 0.02], kit.night.windows);
    box(g, [1.0, 0.1, 0.12], [sx, 1.24, D / 2 + 0.06], trim);
    box(g, [0.95, 0.22, 0.28], [sx, 1.12, D / 2 + 0.18], lambert('#8a5a34'));
    for (let i = 0; i < 4; i++)
      box(
        g,
        [0.16, 0.16, 0.16],
        [sx - 0.33 + i * 0.22, 1.3, D / 2 + 0.2],
        lambert(['#ff7eb6', '#ffd166', '#ff4d6d', '#c4b5fd'][i]),
      );
  }
  for (const side of [-1, 1])
    box(g, [0.08, 0.75, 0.85], [side * (W / 2 + 0.01), 1.65, -0.4], kit.night.windows);
  // chaminé
  box(g, [0.55, 1.6, 0.55], [-1.2, 3.6, -0.6], lambert('#9b5a43'));
  // plaquinha com o nome do dono
  box(g, [0.05, 1.0, 0.05], [1.9, 0.5, D / 2 + 1.3], lambert('#5a3a20'));
  const plate = signBoard(g, [options.name], 1.3, [1.9, 1.15, D / 2 + 1.33], {
    bg: '#5a3417',
    color: '#ffe9b0',
    size: 60,
    canvas: 512,
  });
  void plate;
  wallRect(kit, g, W + 0.3, D + 0.3);
  lightPool(kit, ...worldXZ(g, 0.8, D / 2 + 1.4), 3.6);
  return worldXZ(g, 0, D / 2 + 1.3);
};

const worldXZ = (g: THREE.Object3D, lx: number, lz: number): [number, number] => {
  g.updateMatrixWorld(true);
  const p = new THREE.Vector3(lx, 0, lz).applyMatrix4(g.matrixWorld);
  return [p.x, p.z];
};

/**
 * Portaria na entrada: guarita com janelão, placa e a cancela listrada que
 * sobe sozinha quando alguém chega perto. `side` = de que lado da estrada fica a guarita.
 */
export const gatehouse = (kit: Kit, x: number, z: number, roadX: number, side = 1) => {
  const g = group(kit, x, z);
  g.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  const wall = lambert('#f4f0ff');
  const purple = lambert('#6d28d9');
  footing(g, 3.4, 3.2, '#9b8f7f', 0.25);
  box(g, [3.0, 0.9, 2.8], [0, 0.7, 0], wall);
  // janelões de vidro em volta
  box(
    g,
    [3.0, 1.2, 2.8],
    [0, 1.75, 0],
    new THREE.MeshLambertMaterial({ color: '#9fd6ef', transparent: true, opacity: 0.55 }),
  );
  for (const [cx, cz] of [
    [-1.45, -1.35],
    [1.45, -1.35],
    [-1.45, 1.35],
    [1.45, 1.35],
  ])
    box(g, [0.14, 2.6, 0.14], [cx, 1.4, cz], purple);
  box(g, [3.0, 0.12, 0.12], [0, 2.4, 1.35], purple);
  box(g, [3.0, 0.12, 0.12], [0, 2.4, -1.35], purple);
  // mesinha e luzinha lá dentro
  box(g, [1.6, 0.1, 0.6], [0, 1.15, 0.95], lambert('#8a5a34'));
  box(g, [0.5, 0.35, 0.3], [-0.3, 1.38, 0.95], lambert('#2a2a33'));
  box(g, [0.42, 0.25, 0.02], [-0.3, 1.4, 1.1], glow('#5ec8f2'));
  // telhado que sobra pros lados
  box(g, [4.2, 0.25, 4.0], [0, 2.75, 0], lambert('#3b3350'));
  box(g, [4.3, 0.1, 4.1], [0, 2.92, 0], purple);
  box(g, [3.6, 0.7, 0.12], [0, 3.35, 1.9], lambert('#2a1650'));
  signBoard(g, ['PORTARIA'], 3.4, [0, 3.35, 1.97], {
    bg: '#2a1650',
    color: '#ffd166',
    size: 110,
    basic: true,
  });
  box(g, [0.24, 0.24, 0.24], [1.6, 2.5, 2.05], kit.night.bulbs);
  halo(kit, g, [1.6, 2.5, 2.1], 2);
  nightLight(kit, g, [0, 2.4, 2.6], '#ffc977', 9, 13);
  wallRect(kit, g, 3.2, 3.0);
  // cancela: poste, contrapeso e o braço listrado
  const postX = roadX + side * 2.3;
  const post = group(kit, postX, z - 2.6);
  box(post, [0.45, 1.2, 0.45], [0, 0.6, 0], lambert('#ffd166'));
  box(post, [0.5, 0.2, 0.5], [0, 1.25, 0], lambert('#2a1650'));
  kit.obstacles.push({ x: postX, z: z - 2.6, r: 0.35 });
  const arm = live(new THREE.Group());
  arm.position.set(postX, terrainHeight(postX, z - 2.6) + 1.1, z - 2.6);
  kit.scene.add(arm);
  const reach = 5.2;
  for (let i = 0; i < 8; i++)
    box(
      arm,
      [reach / 8, 0.16, 0.16],
      [-side * (reach / 16 + (i * reach) / 8), 0, 0],
      lambert(i % 2 ? '#ffffff' : '#ff4d6d'),
    );
  box(arm, [0.6, 0.3, 0.3], [side * 0.45, 0, 0], lambert('#3b3350'));
  box(arm, [0.14, 0.14, 0.14], [-side * (reach - 0.1), 0.15, 0], kit.night.bulbs);
  let lift = 0;
  /** `near` = alguém perto da cancela: ela sobe; senão desce devagar. */
  return (dt: number, near: boolean) => {
    lift += ((near ? 1 : 0) - lift) * Math.min(1, dt * 2.5);
    arm.rotation.z = side * lift * 1.35;
  };
};
