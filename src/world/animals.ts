import * as THREE from 'three';
import { LAKE, WATER_Y, canStand, groundHeight } from './terrain';
import { bake, box, collide, flatten, lambert, mesh, shared, type Kit } from './props';

/**
 * Os bichos do sítio. Cada um passeia sozinho pela sua área; cavalo, vaca,
 * porco e ovelha dá pra montar.
 */

export type AnimalKind = 'cavalo' | 'vaca' | 'porco' | 'ovelha' | 'galinha' | 'cachorro' | 'pato';
export type RideKind = 'cavalo' | 'vaca' | 'porco' | 'ovelha' | 'bugue';

interface Rig {
  root: THREE.Group;
  body: THREE.Group;
  /** Pernas na ordem: frente-esq, frente-dir, trás-esq, trás-dir. */
  legs: THREE.Group[];
  head: THREE.Group;
  tail?: THREE.Group;
}

const SPHERE = shared(new THREE.IcosahedronGeometry(1, 1));
const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 8));

const leg = (
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  color: string,
  hoof?: string,
) => {
  const hip = new THREE.Group();
  hip.position.set(x, y, z);
  parent.add(hip);
  box(hip, [w, h, w], [0, -h / 2, 0], lambert(color));
  if (hoof) box(hip, [w * 1.08, h * 0.16, w * 1.1], [0, -h + h * 0.08, 0.01], lambert(hoof));
  return hip;
};

const eyes = (parent: THREE.Object3D, x: number, y: number, z: number, size = 0.08) => {
  for (const side of [-1, 1]) {
    box(parent, [size * 0.4, size, size], [side * x, y, z], lambert('#1a1326'));
    box(
      parent,
      [size * 0.42, size * 0.35, size * 0.35],
      [side * (x + 0.005), y + size * 0.2, z + size * 0.2],
      lambert('#ffffff'),
    );
  }
};

const shell = (): Rig => {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  return { root, body, legs: [], head: new THREE.Group() };
};

/* ------------------------------------------------------------- modelos */

const horse = (coat: string, mane: string, blaze: boolean): Rig => {
  const rig = shell();
  const { body } = rig;
  box(body, [0.9, 0.9, 2.0], [0, 1.6, 0], lambert(coat));
  box(body, [0.94, 0.5, 0.7], [0, 1.45, -0.75], lambert(coat));
  // pescoço inclinado
  const neck = box(body, [0.5, 1.15, 0.6], [0, 2.2, 0.85], lambert(coat));
  neck.rotation.x = 0.5;
  const maneStrip = box(body, [0.16, 1.15, 0.22], [0, 2.28, 0.6], lambert(mane));
  maneStrip.rotation.x = 0.5;
  // cabeça
  const head = rig.head;
  head.position.set(0, 2.7, 1.2);
  body.add(head);
  const skull = box(head, [0.46, 0.5, 0.95], [0, 0, 0.3], lambert(coat));
  skull.rotation.x = 0.45;
  const muzzle = box(
    head,
    [0.42, 0.36, 0.4],
    [0, -0.3, 0.72],
    lambert(coat === '#ece6dc' ? '#d8cfc2' : '#3b2a20'),
  );
  muzzle.rotation.x = 0.45;
  if (blaze) {
    const stripe = box(head, [0.14, 0.05, 0.8], [0, 0.18, 0.38], lambert('#ffffff'));
    stripe.rotation.x = 0.45;
  }
  for (const side of [-0.14, 0.14]) {
    const ear = box(head, [0.1, 0.26, 0.1], [side, 0.36, 0], lambert(coat));
    ear.rotation.x = -0.2;
  }
  box(head, [0.18, 0.22, 0.3], [0, 0.3, 0.1], lambert(mane));
  eyes(head, 0.24, 0.08, 0.32, 0.09);
  // cauda
  const tail = new THREE.Group();
  tail.position.set(0, 1.9, -1.0);
  body.add(tail);
  const strand = box(tail, [0.2, 1.1, 0.22], [0, -0.5, -0.12], lambert(mane));
  strand.rotation.x = 0.25;
  rig.tail = tail;
  // sela roxa com estribos
  box(body, [1.0, 0.16, 0.95], [0, 2.1, 0.05], lambert('#7c3aed'));
  box(body, [0.7, 0.24, 0.16], [0, 2.22, -0.38], lambert('#5b21b6'));
  box(body, [0.92, 0.08, 1.1], [0, 2.04, 0.05], lambert('#ffd166'));
  for (const side of [-0.5, 0.5]) {
    box(body, [0.04, 0.6, 0.04], [side, 1.75, 0.15], lambert('#3a2a1a'));
    box(body, [0.14, 0.06, 0.2], [side, 1.45, 0.15], lambert('#c0c4cc'));
  }
  rig.legs = [
    leg(body, -0.3, 1.25, 0.75, 0.24, 1.25, coat, '#2a211b'),
    leg(body, 0.3, 1.25, 0.75, 0.24, 1.25, coat, '#2a211b'),
    leg(body, -0.3, 1.25, -0.75, 0.26, 1.25, coat, '#2a211b'),
    leg(body, 0.3, 1.25, -0.75, 0.26, 1.25, coat, '#2a211b'),
  ];
  return rig;
};

const cow = (): Rig => {
  const rig = shell();
  const { body } = rig;
  box(body, [1.15, 1.0, 2.0], [0, 1.4, 0], lambert('#f4f1ea'));
  // manchas pretas
  [
    [0.58, 1.5, 0.3, 0.7, 0.55],
    [-0.58, 1.3, -0.4, 0.8, 0.5],
    [0.58, 1.2, -0.6, 0.5, 0.4],
    [0, 1.91, -0.2, 0.6, 0.7],
  ].forEach(([x, y, z, a, b]) => {
    if (x === 0) box(body, [a, 0.04, b], [x, y, z], lambert('#2a2626'));
    else box(body, [0.04, a * 0.7, b], [x, y, z], lambert('#2a2626'));
  });
  box(body, [0.5, 0.22, 0.5], [0, 0.82, -0.45], lambert('#f2a5b0'));
  const head = rig.head;
  head.position.set(0, 1.7, 1.05);
  body.add(head);
  box(head, [0.62, 0.6, 0.66], [0, 0, 0.25], lambert('#f4f1ea'));
  box(head, [0.3, 0.3, 0.04], [0.12, 0.12, 0.59], lambert('#2a2626'));
  box(head, [0.56, 0.32, 0.26], [0, -0.18, 0.66], lambert('#f2a5b0'));
  for (const side of [-0.1, 0.1]) box(head, [0.06, 0.06, 0.04], [side, -0.16, 0.8], lambert('#7a3b44'));
  for (const side of [-1, 1]) {
    box(head, [0.3, 0.12, 0.16], [side * 0.42, 0.12, 0.15], lambert('#f4f1ea'));
    const horn = box(head, [0.08, 0.24, 0.08], [side * 0.24, 0.38, 0.12], lambert('#efe2bf'));
    horn.rotation.z = -side * 0.4;
  }
  eyes(head, 0.32, 0.08, 0.38, 0.08);
  // sininho
  box(head, [0.5, 0.08, 0.5], [0, -0.38, 0.1], lambert('#7a4a2a'));
  mesh(head, CYL, lambert('#ffd166'), [0, -0.52, 0.32]).scale.set(0.1, 0.18, 0.1);
  const tail = new THREE.Group();
  tail.position.set(0, 1.85, -1.0);
  body.add(tail);
  box(tail, [0.08, 0.9, 0.08], [0, -0.45, -0.05], lambert('#f4f1ea'));
  box(tail, [0.16, 0.22, 0.16], [0, -0.92, -0.05], lambert('#2a2626'));
  rig.tail = tail;
  rig.legs = [
    leg(body, -0.36, 0.95, 0.7, 0.26, 0.95, '#f4f1ea', '#3a3030'),
    leg(body, 0.36, 0.95, 0.7, 0.26, 0.95, '#f4f1ea', '#3a3030'),
    leg(body, -0.36, 0.95, -0.7, 0.26, 0.95, '#f4f1ea', '#3a3030'),
    leg(body, 0.36, 0.95, -0.7, 0.26, 0.95, '#f4f1ea', '#3a3030'),
  ];
  return rig;
};

const pig = (): Rig => {
  const rig = shell();
  const { body } = rig;
  const pink = '#f4a7ad';
  const torso = mesh(body, SPHERE, lambert(pink), [0, 0.78, 0]);
  torso.scale.set(0.55, 0.48, 0.8);
  const head = rig.head;
  head.position.set(0, 0.88, 0.72);
  body.add(head);
  box(head, [0.56, 0.5, 0.45], [0, 0, 0.1], lambert(pink));
  const snout = mesh(head, CYL, lambert('#ee8f98'), [0, -0.06, 0.38]);
  snout.scale.set(0.17, 0.12, 0.17);
  snout.rotation.x = Math.PI / 2;
  for (const side of [-0.06, 0.06]) box(head, [0.05, 0.07, 0.03], [side, -0.06, 0.45], lambert('#9a4a55'));
  for (const side of [-1, 1]) {
    const ear = box(head, [0.2, 0.05, 0.22], [side * 0.2, 0.28, 0.12], lambert('#ee8f98'));
    ear.rotation.set(0.6, 0, side * 0.3);
  }
  eyes(head, 0.17, 0.08, 0.33, 0.07);
  const tail = new THREE.Group();
  tail.position.set(0, 0.95, -0.78);
  body.add(tail);
  const curl = mesh(
    tail,
    shared(new THREE.TorusGeometry(0.08, 0.03, 4, 8, Math.PI * 1.6)),
    lambert('#ee8f98'),
    [0, 0, -0.05],
  );
  curl.rotation.y = Math.PI / 2;
  rig.tail = tail;
  rig.legs = [
    leg(body, -0.24, 0.45, 0.42, 0.16, 0.45, pink, '#9a6a5a'),
    leg(body, 0.24, 0.45, 0.42, 0.16, 0.45, pink, '#9a6a5a'),
    leg(body, -0.24, 0.45, -0.42, 0.16, 0.45, pink, '#9a6a5a'),
    leg(body, 0.24, 0.45, -0.42, 0.16, 0.45, pink, '#9a6a5a'),
  ];
  return rig;
};

const sheep = (): Rig => {
  const rig = shell();
  const { body } = rig;
  const wool = lambert('#f7f4ee');
  [
    [0, 1.0, 0, 0.62],
    [0, 1.05, 0.42, 0.5],
    [0, 1.05, -0.45, 0.52],
    [0.3, 1.0, 0.1, 0.42],
    [-0.3, 1.0, 0.1, 0.42],
    [0, 1.32, 0, 0.45],
  ].forEach(([x, y, z, r]) => mesh(body, SPHERE, wool, [x, y, z]).scale.setScalar(r));
  const head = rig.head;
  head.position.set(0, 1.22, 0.72);
  body.add(head);
  box(head, [0.36, 0.42, 0.5], [0, 0, 0.12], lambert('#3a3330'));
  mesh(head, SPHERE, wool, [0, 0.24, 0.02]).scale.set(0.24, 0.16, 0.24);
  for (const side of [-1, 1]) {
    const ear = box(head, [0.24, 0.07, 0.12], [side * 0.26, 0.08, 0.05], lambert('#3a3330'));
    ear.rotation.z = side * -0.3;
  }
  eyes(head, 0.19, 0.06, 0.24, 0.07);
  const tail = new THREE.Group();
  tail.position.set(0, 1.1, -0.9);
  body.add(tail);
  mesh(tail, SPHERE, wool, [0, 0, 0]).scale.setScalar(0.18);
  rig.tail = tail;
  rig.legs = [
    leg(body, -0.22, 0.6, 0.35, 0.13, 0.62, '#3a3330'),
    leg(body, 0.22, 0.6, 0.35, 0.13, 0.62, '#3a3330'),
    leg(body, -0.22, 0.6, -0.35, 0.13, 0.62, '#3a3330'),
    leg(body, 0.22, 0.6, -0.35, 0.13, 0.62, '#3a3330'),
  ];
  return rig;
};

const chicken = (brown: boolean): Rig => {
  const rig = shell();
  const { body } = rig;
  const feather = brown ? '#b8742e' : '#fbf8f0';
  box(body, [0.34, 0.34, 0.46], [0, 0.42, 0], lambert(feather));
  box(body, [0.3, 0.3, 0.12], [0, 0.6, -0.26], lambert(feather));
  const head = rig.head;
  head.position.set(0, 0.68, 0.2);
  body.add(head);
  box(head, [0.24, 0.26, 0.24], [0, 0.06, 0], lambert(feather));
  box(head, [0.06, 0.14, 0.16], [0, 0.26, 0], lambert('#e8443a'));
  box(head, [0.08, 0.06, 0.12], [0, 0.02, 0.17], lambert('#f2b33d'));
  box(head, [0.05, 0.1, 0.05], [0, -0.08, 0.13], lambert('#e8443a'));
  eyes(head, 0.12, 0.1, 0.06, 0.05);
  for (const side of [-1, 1])
    box(body, [0.04, 0.22, 0.32], [side * 0.18, 0.45, -0.02], lambert(brown ? '#9a5f25' : '#ebe5d8'));
  rig.legs = [
    leg(body, -0.08, 0.26, 0, 0.05, 0.26, '#f2b33d'),
    leg(body, 0.08, 0.26, 0, 0.05, 0.26, '#f2b33d'),
  ];
  return rig;
};

const dog = (): Rig => {
  const rig = shell();
  const { body } = rig;
  const fur = '#c98a4b';
  box(body, [0.44, 0.42, 0.9], [0, 0.62, 0], lambert(fur));
  box(body, [0.36, 0.3, 0.5], [0, 0.55, 0.15], lambert('#f2dcc0'));
  const head = rig.head;
  head.position.set(0, 0.92, 0.5);
  body.add(head);
  box(head, [0.42, 0.4, 0.4], [0, 0, 0.05], lambert(fur));
  box(head, [0.24, 0.2, 0.26], [0, -0.08, 0.32], lambert('#f2dcc0'));
  box(head, [0.1, 0.08, 0.06], [0, -0.0, 0.46], lambert('#2a2020'));
  for (const side of [-1, 1]) {
    const ear = box(head, [0.1, 0.28, 0.16], [side * 0.24, -0.02, 0], lambert('#8a5a34'));
    ear.rotation.z = side * 0.2;
  }
  eyes(head, 0.13, 0.08, 0.26, 0.07);
  // coleira roxa
  box(head, [0.46, 0.08, 0.3], [0, -0.22, -0.08], lambert('#7c3aed'));
  const tail = new THREE.Group();
  tail.position.set(0, 0.8, -0.45);
  body.add(tail);
  const wag = box(tail, [0.08, 0.08, 0.4], [0, 0.1, -0.15], lambert(fur));
  wag.rotation.x = -0.7;
  rig.tail = tail;
  rig.legs = [
    leg(body, -0.14, 0.45, 0.3, 0.12, 0.45, fur),
    leg(body, 0.14, 0.45, 0.3, 0.12, 0.45, fur),
    leg(body, -0.14, 0.45, -0.3, 0.12, 0.45, fur),
    leg(body, 0.14, 0.45, -0.3, 0.12, 0.45, fur),
  ];
  return rig;
};

const duck = (baby: boolean): Rig => {
  const rig = shell();
  const { body } = rig;
  const s = baby ? 0.5 : 1;
  const color = baby ? '#ffe066' : '#fbf8f0';
  box(body, [0.36 * s, 0.3 * s, 0.55 * s], [0, 0.12 * s, 0], lambert(color));
  box(body, [0.2 * s, 0.14 * s, 0.14 * s], [0, 0.22 * s, -0.3 * s], lambert(color));
  const head = rig.head;
  head.position.set(0, 0.42 * s, 0.24 * s);
  body.add(head);
  box(head, [0.22 * s, 0.24 * s, 0.24 * s], [0, 0, 0], lambert(baby ? color : '#2f7a45'));
  box(head, [0.14 * s, 0.06 * s, 0.16 * s], [0, -0.04 * s, 0.18 * s], lambert('#f28c28'));
  eyes(head, 0.11 * s, 0.03 * s, 0.06 * s, 0.05 * s);
  return rig;
};

/* ---------------------------------------------------------------- bicho */

export type Area = { x: number; z: number; r: number } | { x: number; z: number; w: number; d: number };

interface Spec {
  build: () => Rig;
  walk: number;
  ride?: number;
  seat?: number;
  radius: number;
  stride: number;
  /** Rótulo pro HUD ("Montar no cavalo"). */
  name: string;
}

const SPECS: Record<AnimalKind, (variant: number) => Spec> = {
  cavalo: (v) => ({
    build: () =>
      horse(['#8b5a2b', '#ece6dc', '#2b2522'][v % 3], ['#3b2414', '#9a948c', '#111'][v % 3], v % 3 === 0),
    walk: 2.2,
    ride: 14,
    seat: 2.18,
    radius: 1.0,
    stride: 1.3,
    name: 'cavalo',
  }),
  vaca: () => ({ build: cow, walk: 1.2, ride: 7.5, seat: 2.0, radius: 1.0, stride: 1.0, name: 'vaca' }),
  porco: () => ({ build: pig, walk: 1.4, ride: 8.5, seat: 1.25, radius: 0.7, stride: 0.6, name: 'porco' }),
  ovelha: () => ({ build: sheep, walk: 1.3, ride: 7, seat: 1.62, radius: 0.75, stride: 0.7, name: 'ovelha' }),
  galinha: (v) => ({
    build: () => chicken(v % 2 === 1),
    walk: 1.5,
    radius: 0.3,
    stride: 0.25,
    name: 'galinha',
  }),
  cachorro: () => ({ build: dog, walk: 6.5, radius: 0.45, stride: 0.5, name: 'cachorro' }),
  pato: (v) => ({ build: () => duck(v > 0), walk: 0.9, radius: 0.3, stride: 0.3, name: 'pato' }),
};

const insideArea = (area: Area, x: number, z: number, margin: number) =>
  'r' in area
    ? Math.hypot(x - area.x, z - area.z) < area.r - margin
    : Math.abs(x - area.x) < area.w / 2 - margin && Math.abs(z - area.z) < area.d / 2 - margin;

export class Animal {
  readonly rig: Rig;
  readonly spec: Spec;
  x: number;
  z: number;
  angle: number;
  y = 0;
  vy = 0;
  ridden = false;
  /** O cachorro segue a pessoa depois que ela chega perto. */
  following = false;
  private state: 'idle' | 'walk' | 'graze' = 'idle';
  private timer = 1;
  private tx = 0;
  private tz = 0;
  private phase = Math.random() * 6;
  private speed = 0;
  private shadow: THREE.Mesh;
  /** Versão de uma malha só, usada quando o bicho está longe da câmera. */
  private far: THREE.Group;
  /** Posição da câmera, pra escolher entre o bicho animado e o "de longe". */
  static eye = new THREE.Vector3();

  constructor(
    private kit: Kit,
    readonly kind: AnimalKind,
    public area: Area,
    variant = 0,
    start?: [number, number],
  ) {
    this.spec = SPECS[kind](variant);
    this.rig = this.spec.build();
    this.far = flatten(this.rig.root);
    this.far.visible = false;
    kit.scene.add(this.far);
    bake(this.rig.root);
    kit.scene.add(this.rig.root);
    const [sx, sz] = start ?? this.randomPoint();
    this.x = sx;
    this.z = sz;
    this.angle = Math.random() * Math.PI * 2;
    this.timer = Math.random() * 3;
    const shadowGeometry = shared(new THREE.CircleGeometry(1, 12));
    this.shadow = new THREE.Mesh(
      shadowGeometry,
      new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.22, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.scale.set(this.spec.radius * 0.9, this.spec.radius * 1.3, 1);
    if (kind !== 'pato') kit.scene.add(this.shadow);
    this.place(0);
  }

  get rideable() {
    return this.spec.ride !== undefined;
  }

  private randomPoint(): [number, number] {
    for (let i = 0; i < 30; i++) {
      let x: number;
      let z: number;
      if ('r' in this.area) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * this.area.r;
        x = this.area.x + Math.cos(a) * r;
        z = this.area.z + Math.sin(a) * r;
      } else {
        x = this.area.x + (Math.random() - 0.5) * (this.area.w - 2.4);
        z = this.area.z + (Math.random() - 0.5) * (this.area.d - 2.4);
      }
      if (this.kind === 'pato' || canStand(x, z, 0.6)) return [x, z];
    }
    return [this.area.x, this.area.z];
  }

  /** Pula (quando alguém está montado e aperta B). */
  hop() {
    if (this.y > 0.01) return;
    this.vy = 6.5;
  }

  /** Volta a andar sozinho em volta de onde foi deixado. */
  release() {
    this.ridden = false;
    if (!insideArea(this.area, this.x, this.z, 0)) this.area = { x: this.x, z: this.z, r: 5 };
    this.state = 'idle';
    this.timer = 2;
  }

  update(t: number, dt: number, player: { x: number; z: number; busy: boolean }) {
    if (this.ridden) return;
    const { spec } = this;
    let moveSpeed = 0;
    const dPlayer = Math.hypot(player.x - this.x, player.z - this.z);

    if (this.kind === 'pato') {
      // patos nadando em roda no lago; os filhotes atrás da mãe
      return;
    }

    if (this.kind === 'cachorro') {
      if (!this.following && dPlayer < 7) this.following = true;
      if (this.following) {
        const far = dPlayer > (player.busy ? 4.5 : 3);
        if (far) {
          this.tx = player.x;
          this.tz = player.z;
          this.state = 'walk';
        } else this.state = 'idle';
        if (dPlayer > 40) {
          // ficou muito pra trás: aparece do lado
          this.x = player.x + 2;
          this.z = player.z + 2;
        }
      }
    }

    this.timer -= dt;
    if (this.state === 'walk') {
      const dx = this.tx - this.x;
      const dz = this.tz - this.z;
      const distance = Math.hypot(dx, dz);
      const target = Math.atan2(dx, dz);
      let diff = target - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.angle += diff * Math.min(1, dt * 4);
      const run = this.kind === 'cachorro' ? Math.min(1.6, 0.5 + distance / 6) : 1;
      moveSpeed = spec.walk * run * (Math.abs(diff) > 1.2 ? 0.3 : 1);
      const nx = this.x + Math.sin(this.angle) * moveSpeed * dt;
      const nz = this.z + Math.cos(this.angle) * moveSpeed * dt;
      if (canStand(nx, nz, 0.5) || this.kind === 'cachorro') {
        if (canStand(nx, nz, 0.2)) {
          this.x = nx;
          this.z = nz;
        }
      } else this.timer = -1;
      if (collide(this.kit, this, spec.radius) && this.kind !== 'cachorro')
        this.timer = Math.min(this.timer, 0.3);
      if ((distance < 0.6 || this.timer < 0) && this.kind !== 'cachorro') {
        this.state = Math.random() > 0.45 ? 'graze' : 'idle';
        this.timer = 2 + Math.random() * 4;
      }
    } else if (this.timer < 0 && this.kind !== 'cachorro') {
      [this.tx, this.tz] = this.randomPoint();
      this.state = 'walk';
      this.timer = 7;
    }
    // olha pra pessoa quando ela chega perto
    if (this.state !== 'walk' && dPlayer < 3.5 && this.kind !== 'galinha') {
      const target = Math.atan2(player.x - this.x, player.z - this.z);
      let diff = target - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.angle += diff * Math.min(1, dt * 2);
    }
    this.speed += (moveSpeed - this.speed) * Math.min(1, dt * 6);
    this.animate(t, dt, this.speed);
  }

  /** Coloca o bicho no chão e mexe as pernas conforme a velocidade. */
  animate(t: number, dt: number, speed: number) {
    const { rig, spec } = this;
    this.vy -= 20 * dt;
    this.y = Math.max(0, this.y + this.vy * dt);
    if (this.y === 0) this.vy = 0;
    this.phase += dt * (speed / spec.stride) * 2.2;
    const k = Math.min(1, speed / Math.max(1, spec.walk));
    const swing = Math.sin(this.phase) * 0.7 * Math.min(1, k + (this.ridden ? 0 : 0));
    if (rig.legs.length === 4) {
      rig.legs[0].rotation.x = swing;
      rig.legs[3].rotation.x = swing;
      rig.legs[1].rotation.x = -swing;
      rig.legs[2].rotation.x = -swing;
    } else if (rig.legs.length === 2) {
      rig.legs[0].rotation.x = swing;
      rig.legs[1].rotation.x = -swing;
    }
    const gallop =
      speed > 6 ? Math.abs(Math.sin(this.phase)) * 0.18 : Math.abs(Math.sin(this.phase)) * 0.05 * k;
    rig.body.position.y = gallop;
    rig.body.rotation.x = speed > 6 ? Math.sin(this.phase) * 0.06 : 0;
    const grazing = this.state === 'graze' && !this.ridden;
    const targetHead = grazing
      ? 0.75
      : this.kind === 'galinha' && speed < 0.1
        ? Math.max(0, Math.sin(t * 5 + this.x)) * 0.9
        : Math.sin(t * 1.3 + this.z) * 0.05;
    rig.head.rotation.x += (targetHead - rig.head.rotation.x) * Math.min(1, dt * 5);
    if (rig.tail) {
      const wag = this.kind === 'cachorro' ? 10 : 2.2;
      rig.tail.rotation.y = Math.sin(t * wag + this.x) * (this.kind === 'cachorro' ? 0.7 : 0.25);
    }
    this.place(t);
  }

  place(t: number) {
    const ground = groundHeight(this.x, this.z);
    const near = this.ridden || Math.hypot(Animal.eye.x - this.x, Animal.eye.z - this.z) < 38;
    const shown = near ? this.rig.root : this.far;
    this.rig.root.visible = near;
    this.far.visible = !near;
    shown.position.set(this.x, ground + this.y, this.z);
    shown.rotation.y = this.angle;
    this.shadow.position.set(this.x, ground + 0.06, this.z);
    this.shadow.rotation.z = -this.angle;
    void t;
  }

  /** Mostra o bicho animado (usado pelos patos, que se posicionam sozinhos). */
  get root() {
    this.far.visible = false;
    this.rig.root.visible = true;
    return this.rig.root;
  }
}

/** Família de patos nadando no lago. */
export const ducks = (kit: Kit) => {
  const family = [0, 1, 2, 3].map((v) => new Animal(kit, 'pato', { x: LAKE.x, z: LAKE.z, r: 4 }, v));
  kit.ticks.push((t) => {
    family.forEach((duckling, i) => {
      const a = t * 0.18 - i * 0.16;
      const r = LAKE.r * 0.55 + Math.sin(t * 0.3) * 0.8;
      duckling.x = LAKE.x + Math.cos(a) * r;
      duckling.z = LAKE.z + Math.sin(a) * r;
      duckling.angle = -a;
      duckling.root.position.set(duckling.x, WATER_Y + 0.02 + Math.sin(t * 3 + i) * 0.03, duckling.z);
      duckling.root.rotation.y = duckling.angle;
      duckling.rig.head.rotation.x = Math.max(0, Math.sin(t * 0.7 + i * 2)) * 0.6;
    });
    if (Math.random() < 0.02) {
      const lead = family[0];
      kit.particles.spawn([lead.x, WATER_Y + 0.05, lead.z], {
        color: '#ffffff',
        velocity: [0, 0.2, 0],
        size: 0.12,
        grow: 3,
        life: 1,
        opacity: 0.5,
      });
    }
  });
  return family;
};
