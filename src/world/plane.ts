import * as THREE from 'three';
import { SKY_CEILING, SKY_RADIUS, WATER_Y, canStand, groundHeight, terrainHeight } from './terrain';
import { bake, box, collide, glow, halo, keep, lambert, mesh, shared, type Kit } from './props';
import { canvasTexture, makeCanvas, TEXT_FONT } from './textures';

/**
 * Os aviões do aeroporto. No chão eles taxiam (W acelera, S freia, A/D vira);
 * passando da velocidade de decolagem, segurar W tira do chão. No ar, W sobe,
 * S desce, A/D inclina pra fazer a curva e o acelerador (Shift mais, Z menos)
 * escolhe a velocidade. Encostando no chão firme e reto, eles pousam.
 */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 12));
const CYL8 = shared(new THREE.CylinderGeometry(1, 1, 1, 8));
const CONE = shared(new THREE.ConeGeometry(1, 1, 10));
const SPHERE = shared(new THREE.IcosahedronGeometry(1, 2));
const PLANE = shared(new THREE.PlaneGeometry(1, 1));

export type PlaneKind = 'biplano' | 'jato' | 'ultraleve';

/** Ficha de cada avião: nome, como ele voa e onde a pessoa senta. */
export interface PlaneSpec {
  kind: PlaneKind;
  name: string;
  /** Nome com artigo, pros recadinhos ("o biplano"). */
  the: string;
  emoji: string;
  /** Uma frase pra quem vai escolher. */
  blurb: string;
  /** Velocidade (m/s) em que já sustenta no ar. */
  takeoff: number;
  taxiMax: number;
  /** Mais devagar e mais rápido que dá pra voar (acelerador em 0 e em 1). */
  minSpeed: number;
  maxSpeed: number;
  /** Quanto inclina e quão rápido faz a curva. */
  bank: number;
  turn: number;
  /** Ângulo máximo de subida. */
  climb: number;
  seat: [number, number, number];
  radius: number;
  /** Do centro até o bico e até a cauda (inclinar no chão, fumaça). */
  nose: number;
  tail: number;
  span: number;
  /** Altura da fumaça (na cauda). */
  smokeY: number;
}

export const PLANE_SPECS: Record<PlaneKind, PlaneSpec> = {
  biplano: {
    kind: 'biplano',
    name: 'Biplano',
    the: 'o biplano',
    emoji: '🛩️',
    blurb: 'Cabine aberta, faz curva fechada. O do meio-termo.',
    takeoff: 19,
    taxiMax: 34,
    minSpeed: 16,
    maxSpeed: 48,
    bank: 0.85,
    turn: 1.2,
    climb: 0.55,
    seat: [0, 0.83, -0.45],
    radius: 2.6,
    nose: 1.4,
    tail: 4.9,
    span: 10.4,
    smokeY: 1.9,
  },
  jato: {
    kind: 'jato',
    name: 'Jato',
    the: 'o jato',
    emoji: '✈️',
    blurb: 'O mais rápido. Precisa de pista inteira pra decolar.',
    takeoff: 30,
    taxiMax: 52,
    minSpeed: 26,
    maxSpeed: 105,
    bank: 1.05,
    turn: 1.05,
    climb: 0.62,
    seat: [0, 0.62, 1.4],
    radius: 3.2,
    nose: 4.2,
    tail: 4.6,
    span: 8.4,
    smokeY: 1.6,
  },
  ultraleve: {
    kind: 'ultraleve',
    name: 'Ultraleve',
    the: 'o ultraleve',
    emoji: '🪂',
    blurb: 'Devagarinho e fácil: bom pra passear e aprender.',
    takeoff: 11,
    taxiMax: 22,
    minSpeed: 9,
    maxSpeed: 26,
    bank: 0.7,
    turn: 1.35,
    climb: 0.45,
    seat: [0, 0.2, 0.15],
    radius: 2.4,
    nose: 1.6,
    tail: 1.2,
    span: 9.6,
    smokeY: 1.0,
  },
};

/** O que aconteceu nesse quadro (o motor transforma em som e recadinho). */
export type PlaneEvent = 'takeoff' | 'landed' | 'bump' | 'far' | null;

/** Letreiro com a matrícula pintada na lateral. */
const nameTexture = (text: string, color: string) => {
  const { canvas, ctx } = makeCanvas(512, 128);
  ctx.font = `800 92px ${TEXT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 68);
  return canvasTexture(canvas);
};

export class Plane {
  readonly root = new THREE.Group();
  readonly spec: PlaneSpec;
  private body = new THREE.Group();
  private prop: THREE.Group | null = null;
  private blurMaterial: THREE.MeshBasicMaterial | null = null;
  /** Chama do jato (cresce com o acelerador). */
  private flame: THREE.Mesh | null = null;
  private beam: THREE.Mesh;
  private beamMaterial: THREE.MeshBasicMaterial;
  private strobe: THREE.Mesh;
  private shadow: THREE.Mesh;
  private shadowMaterial: THREE.MeshBasicMaterial;
  x: number;
  z: number;
  /** Altura absoluta das rodas. */
  alt = 0;
  angle: number;
  pitch = 0;
  roll = 0;
  speed = 0;
  /** Quanto está virando (pra cabeça do piloto acompanhar). */
  steer = 0;
  grounded = true;
  ridden = false;
  /** Fumaça colorida ligada (botão B / espaço). */
  smoke = false;
  /** 0 a 1: quanto o motor está roncando agora (pro som e pra hélice). */
  throttle = 0;
  /** 0 a 1: o acelerador que a pessoa escolheu (a velocidade no ar). */
  power = 0.5;
  /** Sombrinha desenhada no chão (no celular, que não tem sombra de verdade). */
  blobShadow = true;
  readonly home: { x: number; z: number; angle: number };
  private spin = 0;
  private nextPuff = 0;
  private smokeIndex = 0;
  private farSaid = false;
  private bumpAt = 0;

  constructor(
    private kit: Kit,
    kind: PlaneKind,
    x: number,
    z: number,
    angle: number,
  ) {
    this.spec = PLANE_SPECS[kind];
    this.x = x;
    this.z = z;
    this.angle = angle;
    this.home = { x, z, angle };
    kit.scene.add(this.root);
    this.root.add(this.body);
    if (kind === 'jato') this.buildJet();
    else if (kind === 'ultraleve') this.buildTrike();
    else this.buildBiplane();
    const b = this.body;

    // farol de pouso: só de noite
    this.beamMaterial = new THREE.MeshBasicMaterial({
      color: '#fff1b0',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamGeometry = shared(new THREE.ConeGeometry(3, 18, 14, 1, true));
    beamGeometry.translate(0, -9, 0);
    beamGeometry.rotateX(-Math.PI / 2);
    const lamp: [number, number, number] =
      kind === 'jato' ? [0, 0.9, 3.4] : kind === 'ultraleve' ? [0, 0.9, 1.3] : [2.2, 1.05, 1.9];
    box(b, [0.3, 0.2, 0.1], [lamp[0], lamp[1], lamp[2] - 0.08], lambert('#fff4c8'));
    this.beam = keep(mesh(b, beamGeometry, this.beamMaterial, lamp));
    this.beam.rotation.x = 0.12;
    halo(this.kit, b, [lamp[0], lamp[1], lamp[2] + 0.05], 1.6);

    this.shadowMaterial = new THREE.MeshBasicMaterial({
      color: '#000',
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(PLANE, this.shadowMaterial);
    this.shadow.rotation.x = -Math.PI / 2;
    kit.scene.add(this.shadow);
    this.strobe = this.strobe ?? keep(box(b, [0.2, 0.2, 0.2], [0, 3, -1], glow('#ff3b3b')));
    bake(b);
    this.alt = groundHeight(x, z);
    this.place(0, 0);
  }

  /* -------------------------------------------------------------- modelos */

  /** Hélice com o borrão que aparece girando rápido. */
  private propeller(at: [number, number, number], size: number, wood: string, tip: string) {
    const prop = keep(new THREE.Group());
    prop.position.set(...at);
    this.body.add(prop);
    box(prop, [0.18, size, 0.06], [0, 0, 0], lambert(wood));
    box(prop, [0.2, 0.25, 0.07], [0, size / 2 - 0.1, 0], lambert(tip));
    box(prop, [0.2, 0.25, 0.07], [0, -size / 2 + 0.1, 0], lambert(tip));
    this.blurMaterial = new THREE.MeshBasicMaterial({
      color: '#e8e4f0',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const blur = keep(mesh(this.body, shared(new THREE.CircleGeometry(1, 20)), this.blurMaterial, at));
    blur.scale.setScalar(size / 2);
    this.prop = prop;
  }

  /** Matrícula nas laterais. */
  private plate(text: string, color: string, x: number, y: number, z: number, w = 2) {
    const label = new THREE.MeshBasicMaterial({ map: nameTexture(text, color), transparent: true, depthWrite: false });
    for (const side of [-1, 1]) {
      const plate = keep(mesh(this.body, PLANE, label, [side * x, y, z]));
      plate.scale.set(w, w / 4, 1);
      plate.rotation.y = side * (Math.PI / 2);
      plate.renderOrder = 2;
    }
  }

  /** Luzes de navegação: vermelha à esquerda, verde à direita. */
  private navLights(x: number, y: number, z: number) {
    box(this.body, [0.25, 0.2, 0.3], [x, y, z], glow('#ff4d4d'));
    box(this.body, [0.25, 0.2, 0.3], [-x, y, z], glow('#3dff8a'));
    halo(this.kit, this.body, [x + 0.05, y, z], 1.4);
    halo(this.kit, this.body, [-x - 0.05, y, z], 1.4);
  }

  private buildBiplane() {
    const b = this.body;
    const purple = lambert('#7c3aed');
    const deep = lambert('#5b21b6');
    const yellow = lambert('#ffd166');
    const dark = lambert('#2b2b33');
    const metal = lambert('#a0a4ac');
    // fuselagem (afina até a cauda)
    box(b, [1.3, 1.25, 4.4], [0, 1.65, 0.4], purple);
    box(b, [1.02, 1.0, 2.2], [0, 1.75, -2.8], purple);
    box(b, [0.62, 0.7, 1.5], [0, 1.85, -4.55], purple);
    box(b, [1.34, 0.18, 4.42], [0, 1.25, 0.4], deep);
    for (const side of [-1, 1]) {
      box(b, [0.04, 0.16, 4.2], [side * 0.66, 1.85, 0.4], yellow);
      box(b, [0.04, 0.14, 2.1], [side * 0.52, 1.95, -2.8], yellow);
    }
    // cabine aberta com para-brisa e o encosto do banco
    box(b, [1.0, 0.1, 1.3], [0, 2.29, -0.35], dark);
    const shield = new THREE.MeshLambertMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.45 });
    const windscreen = box(b, [0.95, 0.5, 0.05], [0, 2.52, 0.42], shield);
    windscreen.rotation.x = -0.45;
    box(b, [0.8, 0.5, 0.12], [0, 2.4, -1.05], lambert('#3b2a1a'));
    // capô do motor, hélice e o bico
    const cowl = mesh(b, CYL8, lambert('#3a3a44'), [0, 1.6, 2.95]);
    cowl.scale.set(0.78, 0.95, 0.78);
    cowl.rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pot = box(b, [0.24, 0.24, 0.5], [Math.cos(a) * 0.72, 1.6 + Math.sin(a) * 0.72, 2.95], metal);
      pot.rotation.z = a;
    }
    const spinner = mesh(b, CONE, yellow, [0, 1.6, 3.7]);
    spinner.scale.set(0.3, 0.5, 0.3);
    spinner.rotation.x = Math.PI / 2;
    this.propeller([0, 1.6, 3.48], 2.9, '#5a3a20', '#ffd166');
    // asas (de baixo e de cima) com as pontas roxas
    box(b, [9.6, 0.16, 1.6], [0, 1.05, 1.0], yellow);
    box(b, [10.4, 0.16, 1.7], [0, 3.35, 1.2], yellow);
    for (const side of [-1, 1]) {
      box(b, [0.8, 0.18, 1.62], [side * 4.45, 1.05, 1.0], purple);
      box(b, [0.8, 0.18, 1.72], [side * 4.85, 3.35, 1.2], purple);
      for (const sz of [0.6, 1.55]) box(b, [0.1, 2.3, 0.1], [side * 3.8, 2.2, sz], dark);
      const brace = box(b, [0.06, 2.6, 0.06], [side * 3.8, 2.2, 1.08], dark);
      brace.rotation.x = 0.36;
      const cabane = box(b, [0.08, 1.15, 0.08], [side * 0.55, 2.78, 1.3], dark);
      cabane.rotation.z = side * -0.25;
    }
    // cauda
    const fin = box(b, [0.1, 1.45, 1.1], [0, 2.75, -4.75], purple);
    fin.rotation.x = -0.2;
    box(b, [0.12, 0.35, 1.0], [0, 3.15, -4.85], yellow);
    box(b, [3.4, 0.1, 1.0], [0, 1.95, -4.65], yellow);
    for (const side of [-1, 1]) box(b, [0.5, 0.12, 1.02], [side * 1.5, 1.95, -4.65], purple);
    // trem de pouso
    for (const side of [-1, 1]) {
      const leg = box(b, [0.1, 1.0, 0.1], [side * 0.85, 0.85, 1.5], dark);
      leg.rotation.z = side * 0.35;
      const back = box(b, [0.08, 1.0, 0.08], [side * 0.85, 0.85, 1.0], dark);
      back.rotation.set(0.45, 0, side * 0.35);
      const wheel = mesh(b, CYL, lambert('#1c1c22'), [side * 1.05, 0.42, 1.4]);
      wheel.scale.set(0.42, 0.22, 0.42);
      wheel.rotation.z = Math.PI / 2;
      const cap = mesh(b, CYL, yellow, [side * 1.17, 0.42, 1.4]);
      cap.scale.set(0.2, 0.04, 0.2);
      cap.rotation.z = Math.PI / 2;
    }
    box(b, [1.9, 0.08, 0.1], [0, 0.42, 1.4], dark);
    box(b, [0.08, 1.4, 0.08], [0, 0.9, -4.9], dark);
    const tailWheel = mesh(b, CYL, lambert('#1c1c22'), [0, 0.2, -4.95]);
    tailWheel.scale.set(0.2, 0.12, 0.2);
    tailWheel.rotation.z = Math.PI / 2;
    this.navLights(5.25, 3.35, 1.2);
    box(b, [0.2, 0.2, 0.2], [0, 1.9, -5.32], glow('#ffffff'));
    this.strobe = keep(box(b, [0.22, 0.22, 0.22], [0, 3.55, -4.85], glow('#ff3b3b')));
    this.plate('PP-DAV', '#ffd166', 0.53, 1.55, -2.7);
  }

  /** Jato de caça branco e vermelho, cabine de bolha. */
  private buildJet() {
    const b = this.body;
    const white = lambert('#eef0f4');
    const red = lambert('#e23b4a');
    const grey = lambert('#8e949c');
    const dark = lambert('#2b2b33');
    const Y = 1.55;
    const hull = mesh(b, CYL8, white, [0, Y, 0]);
    hull.scale.set(0.82, 8.4, 0.82);
    hull.rotation.x = Math.PI / 2;
    const nose = mesh(b, CONE, white, [0, Y, 5.5]);
    nose.scale.set(0.82, 2.6, 0.82);
    nose.rotation.x = Math.PI / 2;
    box(b, [0.4, 0.4, 0.5], [0, Y, 6.7], red);
    const back = mesh(b, CYL8, grey, [0, Y, -4.5]);
    back.scale.set(0.72, 0.8, 0.72);
    back.rotation.x = Math.PI / 2;
    const nozzle = mesh(b, CYL8, dark, [0, Y, -4.95]);
    nozzle.scale.set(0.56, 0.2, 0.56);
    nozzle.rotation.x = Math.PI / 2;
    // chama (some com o motor parado)
    const flameGeometry = shared(new THREE.ConeGeometry(0.5, 2.6, 12, 1, true));
    flameGeometry.translate(0, -1.3, 0);
    flameGeometry.rotateX(-Math.PI / 2);
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: '#ff9a3b',
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.flame = keep(mesh(b, flameGeometry, flameMaterial, [0, Y, -5.05]));
    // faixas vermelhas
    for (const side of [-1, 1]) box(b, [0.06, 0.24, 6], [side * 0.8, Y + 0.05, 0.2], red);
    // cabine de bolha
    const canopy = mesh(
      b,
      SPHERE,
      new THREE.MeshLambertMaterial({ color: '#9fd6ef', transparent: true, opacity: 0.4 }),
      [0, Y + 0.85, 1.6],
    );
    canopy.scale.set(0.62, 0.9, 1.9);
    box(b, [0.7, 0.12, 2.4], [0, Y + 0.68, 1.5], dark);
    // entradas de ar
    for (const side of [-1, 1]) box(b, [0.4, 0.7, 2.2], [side * 0.9, Y - 0.1, 1.4], grey);
    // asas enflechadas
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      wing.position.set(side * 0.7, Y - 0.15, -0.4);
      wing.rotation.y = side * 0.55;
      b.add(wing);
      box(wing, [3.8, 0.14, 2.6], [side * 1.9, 0, 0], white);
      box(wing, [0.7, 0.16, 2.6], [side * 3.6, 0.01, 0], red);
      const missile = mesh(wing, CYL, grey, [side * 3.9, -0.2, 0.3]);
      missile.scale.set(0.1, 1.8, 0.1);
      missile.rotation.x = Math.PI / 2;
      const stab = box(b, [1.8, 0.1, 1.1], [side * 1.4, Y + 0.05, -4.1], white);
      stab.rotation.y = side * 0.5;
    }
    const fin = box(b, [0.12, 1.9, 1.7], [0, Y + 1.25, -3.8], red);
    fin.rotation.x = -0.5;
    // trem de pouso
    const nosegear = box(b, [0.12, Y - 0.4, 0.12], [0, (Y - 0.4) / 2 + 0.35, 3.6], dark);
    void nosegear;
    const wheel = (x: number, z: number, r: number) => {
      const w = mesh(b, CYL, lambert('#1c1c22'), [x, r, z]);
      w.scale.set(r, 0.24, r);
      w.rotation.z = Math.PI / 2;
    };
    wheel(0, 3.6, 0.32);
    for (const side of [-1, 1]) {
      box(b, [0.12, Y - 0.5, 0.12], [side * 1.1, (Y - 0.5) / 2 + 0.4, -0.6], dark);
      wheel(side * 1.2, -0.6, 0.4);
    }
    // a pessoa entra pela escadinha do lado
    this.navLights(4.2, Y - 0.12, -1.8);
    this.strobe = keep(box(b, [0.2, 0.2, 0.2], [0, Y + 2.1, -4.3], glow('#ff3b3b')));
    this.plate('DAV-01', '#e23b4a', 0.84, Y - 0.3, -2.4, 1.6);
  }

  /** Ultraleve de asa-delta colorida, com hélice empurrando atrás. */
  private buildTrike() {
    const b = this.body;
    const blue = lambert('#2f6fd6');
    const dark = lambert('#2b2b33');
    const metal = lambert('#c0c4cc');
    // carrinho
    box(b, [0.9, 0.5, 1.9], [0, 0.75, 0.2], blue);
    const nose = box(b, [0.8, 0.5, 0.7], [0, 0.85, 1.35], blue);
    nose.rotation.x = -0.4;
    box(b, [0.7, 0.12, 0.8], [0, 1.05, -0.2], lambert('#1f1f26'));
    box(b, [0.7, 0.6, 0.1], [0, 1.35, -0.55], lambert('#1f1f26'));
    const shield = new THREE.MeshLambertMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.4 });
    const windscreen = box(b, [0.8, 0.55, 0.05], [0, 1.35, 1.0], shield);
    windscreen.rotation.x = -0.6;
    // rodas
    const wheel = (x: number, z: number, r: number) => {
      const w = mesh(b, CYL, lambert('#1c1c22'), [x, r, z]);
      w.scale.set(r, 0.2, r);
      w.rotation.z = Math.PI / 2;
    };
    wheel(0, 1.55, 0.3);
    box(b, [0.08, 0.6, 0.08], [0, 0.55, 1.55], metal);
    for (const side of [-1, 1]) {
      wheel(side * 0.95, -0.5, 0.36);
      const axle = box(b, [0.9, 0.08, 0.08], [side * 0.5, 0.42, -0.5], metal);
      axle.rotation.z = side * -0.2;
    }
    // mastro e asa
    const mast = box(b, [0.1, 2.3, 0.1], [0, 2.15, -0.35], metal);
    mast.rotation.x = -0.12;
    const front = box(b, [0.08, 2.4, 0.08], [0, 2.05, 0.75], metal);
    front.rotation.x = 0.45;
    const colors = ['#ff4d6d', '#ffd166', '#5ee26b', '#4cb3d9', '#a78bfa'];
    for (const side of [-1, 1]) {
      const half = new THREE.Group();
      half.position.set(0, 3.3, 0.6);
      half.rotation.y = side * 0.62;
      b.add(half);
      colors.forEach((color, i) =>
        box(half, [1.0, 0.08, 2.0 - i * 0.28], [side * (0.5 + i * 1.0), 0, -0.9 - i * 0.12], lambert(color)),
      );
      box(half, [5, 0.1, 0.12], [side * 2.5, 0.02, 0.1], metal);
    }
    box(b, [0.12, 0.12, 3.6], [0, 3.32, -0.7], metal);
    // barra de controle (triângulo) na frente da pessoa
    for (const side of [-1, 1]) {
      const rod = box(b, [0.06, 2.0, 0.06], [side * 0.55, 2.3, 0.75], metal);
      rod.rotation.z = side * 0.28;
    }
    box(b, [1.6, 0.06, 0.06], [0, 1.35, 0.75], metal);
    // motor e hélice atrás
    box(b, [0.6, 0.55, 0.6], [0, 1.25, -1.0], dark);
    this.propeller([0, 1.25, -1.4], 2.0, '#3b3350', '#ffd166');
    this.navLights(4.7, 3.0, -1.4);
    this.strobe = keep(box(b, [0.2, 0.2, 0.2], [0, 3.5, -0.7], glow('#ff3b3b')));
    this.plate('PU-DAV', '#ffffff', 0.47, 0.75, 0.0, 1.2);
  }

  /* -------------------------------------------------------------- pilotar */

  /** Dá pra descer aqui? (no chão e quase parado) */
  get parked() {
    return this.grounded && Math.abs(this.speed) < 2.5;
  }

  /** Acelerador: `dir` +1 sobe, -1 desce (segurando). */
  adjust(dir: number, dt: number) {
    if (!dir) return;
    this.power = Math.max(0, Math.min(1, this.power + dir * dt * 0.55));
  }

  /** Pilota: `ix`/`iz` cru do joystick (W/↑ é iz -1, D/→ é ix +1). */
  drive(dt: number, t: number, ix: number, iz: number): PlaneEvent {
    const up = Math.max(-1, Math.min(1, -iz));
    const turn = Math.max(-1, Math.min(1, ix));
    const event = this.grounded ? this.taxi(dt, up, turn) : this.fly(dt, t, up, turn);
    this.effects(t, dt);
    this.place(t, dt);
    return event;
  }

  /** Sem ninguém: freia até parar no chão. */
  idle(t: number, dt: number) {
    if (!this.grounded) this.fly(dt, t, -0.3, 0);
    else this.taxi(dt, 0, 0);
    this.throttle += (0 - this.throttle) * Math.min(1, dt * 2);
    this.effects(t, dt);
    this.place(t, dt);
  }

  private taxi(dt: number, up: number, turn: number): PlaneEvent {
    const spec = this.spec;
    let target = 0;
    if (up > 0.1) target = spec.taxiMax * up;
    else if (up < -0.1) target = -3;
    const push = spec.taxiMax / 5;
    const accel = target > this.speed ? (this.speed < 0 ? 9 : push) : up < -0.1 ? 11 : 3.2;
    this.speed += Math.max(-accel * dt, Math.min(accel * dt, target - this.speed));
    this.throttle += (Math.max(0.25, up > 0.1 ? up : 0.25) - this.throttle) * Math.min(1, dt * 3);
    // vira devagar parado e mais rápido andando; muito rápido fica mais duro
    const fast = Math.max(0, Math.min(1, (Math.abs(this.speed) - spec.takeoff * 0.7) / spec.takeoff));
    const grip = Math.max(0.35, Math.min(1, Math.abs(this.speed) / 5)) * (1 - fast * 0.6);
    const rate = 1.5 * grip * (this.speed < -0.1 ? -1 : 1);
    this.angle -= turn * rate * dt;
    this.steer += (turn * 0.6 - this.steer) * Math.min(1, dt * 6);
    this.roll += (0 - this.roll) * Math.min(1, dt * 6);

    const nx = this.x + Math.sin(this.angle) * this.speed * dt;
    const nz = this.z + Math.cos(this.angle) * this.speed * dt;
    if (canStand(nx, nz, 1.0)) {
      this.x = nx;
      this.z = nz;
    } else this.speed *= -0.2;
    if (collide(this.kit, this, spec.radius * 0.8)) this.speed *= 0.7;
    this.alt = groundHeight(this.x, this.z);

    if (this.speed > spec.takeoff && up > 0.2) {
      this.grounded = false;
      this.pitch = Math.max(this.pitch, 0.12);
      this.alt += 0.15;
      this.power = Math.max(this.power, 0.55);
      return 'takeoff';
    }
    return null;
  }

  private fly(dt: number, t: number, up: number, turn: number): PlaneEvent {
    const spec = this.spec;
    let event: PlaneEvent = null;
    // o acelerador escolhe a velocidade; subir gasta, mergulhar ganha
    const cruise = spec.minSpeed + (spec.maxSpeed - spec.minSpeed) * this.power;
    const target = cruise - this.pitch * spec.minSpeed * 0.9;
    this.speed += (target - this.speed) * Math.min(1, dt * 0.7);
    this.throttle += (0.35 + this.power * 0.65 - this.throttle) * Math.min(1, dt * 2);
    let pitchTarget = up * spec.climb;
    if (this.alt > SKY_CEILING) pitchTarget = Math.min(pitchTarget, -0.15);
    // devagar demais o nariz cai (perde sustentação)
    if (this.speed < spec.minSpeed * 1.05) pitchTarget = Math.min(pitchTarget, -0.15);
    this.pitch += (pitchTarget - this.pitch) * Math.min(1, dt * 2.2);
    let rollTarget = turn * spec.bank;
    // longe demais: faz a curva sozinho de volta pro sítio
    const far = Math.hypot(this.x, this.z) > SKY_RADIUS;
    if (far) {
      const home = Math.atan2(-this.x, -this.z);
      const diff = Math.atan2(Math.sin(home - this.angle), Math.cos(home - this.angle));
      rollTarget = Math.max(-0.7, Math.min(0.7, -diff * 1.5));
      if (!this.farSaid) event = 'far';
      this.farSaid = true;
    } else if (Math.hypot(this.x, this.z) < SKY_RADIUS - 30) this.farSaid = false;
    this.roll += (rollTarget - this.roll) * Math.min(1, dt * 2.5);
    this.angle -= this.roll * spec.turn * dt;
    this.steer += (turn * 0.6 - this.steer) * Math.min(1, dt * 4);

    const flat = Math.cos(this.pitch) * this.speed * dt;
    this.x += Math.sin(this.angle) * flat;
    this.z += Math.cos(this.angle) * flat;
    this.alt += Math.sin(this.pitch) * this.speed * dt;
    this.alt = Math.min(this.alt, SKY_CEILING + 10);

    const floor = Math.max(terrainHeight(this.x, this.z), WATER_Y);
    if (this.alt < floor + 0.05) {
      const firm = canStand(this.x, this.z, 1.0) && terrainHeight(this.x, this.z) > WATER_Y;
      if (firm && this.pitch < 0.35 && Math.abs(this.roll) < 0.6) {
        // pousou: as rodas encostam e ele vira carro de novo
        this.grounded = true;
        this.alt = groundHeight(this.x, this.z);
        this.speed = Math.min(this.speed, spec.taxiMax * 0.8);
        this.kit.particles.burst([this.x, this.alt + 0.3, this.z], ['#e9dcc2', '#d9c29a', '#ffffff'], 18, 3);
        return 'landed';
      }
      // chão ruim (água, serra, de lado): quica e sobe de novo
      this.alt = floor + 0.05;
      this.pitch = Math.max(this.pitch, 0.3);
      this.roll *= 0.5;
      this.speed *= 0.92;
      const water = floor <= WATER_Y + 0.01;
      this.kit.particles.burst(
        [this.x, floor + 0.3, this.z],
        water ? ['#ffffff', '#9be7ff', '#cdeeff'] : ['#e9dcc2', '#8a7a5a'],
        16,
        3,
      );
      if (t > this.bumpAt) event = 'bump';
      this.bumpAt = t + 2;
    }
    return event;
  }

  /** Hélice, chama, fumaça e luzes. */
  private effects(t: number, dt: number) {
    const rpm = this.ridden ? 8 + this.throttle * 50 : this.throttle * 20;
    this.spin += rpm * dt;
    if (this.prop) this.prop.rotation.z = this.spin;
    if (this.blurMaterial) this.blurMaterial.opacity = Math.min(0.28, Math.max(0, (rpm - 12) / 120));
    if (this.flame) {
      const on = this.ridden ? 0.25 + this.throttle * 0.9 : 0;
      this.flame.visible = on > 0.05;
      this.flame.scale.set(0.7 + on * 0.4, 0.7 + on * 0.4, on * (1 + Math.sin(t * 40) * 0.08));
    }
    this.strobe.visible = Math.sin(t * 7) > 0.6;
    const night = this.kit.env.night;
    this.beam.visible = night > 0.25 && this.ridden;
    this.beamMaterial.opacity = 0.14 * night;

    if (t < this.nextPuff) return;
    const s = Math.sin(this.angle);
    const c = Math.cos(this.angle);
    const tail = this.spec.tail + 0.3;
    if (this.smoke && !this.grounded) {
      // fumaça colorida saindo da cauda
      this.nextPuff = t + (this.kit.env.mobile ? 0.05 : 0.03);
      const colors = ['#a78bfa', '#ffd166', '#ffffff', '#ff7eb6'];
      const color = colors[Math.floor(this.smokeIndex++ / 6) % colors.length];
      this.kit.particles.spawn([this.x - s * tail, this.alt + this.spec.smokeY, this.z - c * tail], {
        color,
        velocity: [(Math.random() - 0.5) * 0.6, 0.3, (Math.random() - 0.5) * 0.6],
        size: 0.55,
        grow: 4,
        life: 2.6,
        opacity: 0.8,
      });
    } else if (this.ridden && this.grounded && Math.abs(this.speed) > 4) {
      // poeira das rodas no chão
      this.nextPuff = t + 0.07;
      for (const side of [-1.05, 1.05]) {
        const px = this.x + c * side;
        const pz = this.z - s * side;
        this.kit.particles.spawn([px, groundHeight(px, pz) + 0.2, pz], {
          color: '#d9cfbd',
          velocity: [(Math.random() - 0.5) * 1.2, 0.8 + Math.random(), (Math.random() - 0.5) * 1.2],
          size: 0.25,
          grow: 2.4,
          life: 0.7,
          opacity: 0.6,
        });
      }
    } else if (this.ridden && this.spec.kind !== 'jato') {
      // fumacinha do escapamento com o motor ligado
      this.nextPuff = t + 0.18;
      this.kit.particles.spawn([this.x + c * 0.8, this.alt + 1.3, this.z - s * 0.8], {
        color: '#9a96a8',
        velocity: [c * 0.6, 0.6, -s * 0.6],
        size: 0.16,
        grow: 2,
        life: 0.8,
        opacity: 0.6,
      });
    }
  }

  private place(t: number, dt: number) {
    void dt;
    const s = Math.sin(this.angle);
    const c = Math.cos(this.angle);
    const { nose, tail } = this.spec;
    let pitch = this.pitch;
    let roll = this.roll;
    if (this.grounded) {
      // no chão: acompanha a ladeira (rodas da frente e de trás)
      const front = groundHeight(this.x + s * nose, this.z + c * nose);
      const back = groundHeight(this.x - s * tail, this.z - c * tail);
      const left = groundHeight(this.x + c * 1.1, this.z - s * 1.1);
      const right = groundHeight(this.x - c * 1.1, this.z + s * 1.1);
      this.alt = Math.max(front, (front + back) / 2);
      pitch = Math.atan2(front - back, nose + tail);
      roll = Math.atan2(left - right, 2.2) * 0.5;
      this.pitch = pitch;
      this.body.position.y = Math.sin(t * 31) * 0.012 * (this.ridden ? 1 : 0);
    } else {
      this.body.position.y = Math.sin(t * 2.1) * 0.06;
    }
    this.root.position.set(this.x, this.alt, this.z);
    this.root.rotation.set(0, this.angle, 0);
    this.root.rotateX(-pitch);
    this.root.rotateZ(roll);
    // sombra no chão: some com a altura
    const floor = Math.max(terrainHeight(this.x, this.z), WATER_Y);
    const height = this.alt - floor;
    this.shadow.position.set(this.x, floor + 0.08, this.z);
    this.shadow.rotation.z = this.angle;
    this.shadow.scale.set(this.spec.span * 0.85 * Math.cos(roll), nose + tail, 1);
    this.shadowMaterial.opacity = 0.22 * Math.max(0, 1 - height / 40);
    this.shadow.visible = this.blobShadow && height < 40;
  }

  /** Onde a pessoa senta (no mundo). */
  seatPosition(target: THREE.Vector3) {
    this.root.updateMatrixWorld(true);
    return target.set(...this.spec.seat).applyMatrix4(this.root.matrixWorld);
  }

  /** Leva o avião pra um ponto no chão, parado. */
  park(x: number, z: number, angle: number) {
    this.x = x;
    this.z = z;
    this.angle = angle;
    this.speed = 0;
    this.pitch = this.roll = 0;
    this.grounded = true;
    this.smoke = false;
    this.alt = groundHeight(x, z);
  }
}
