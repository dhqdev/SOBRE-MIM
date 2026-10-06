import * as THREE from "three";
import { airlinerBody } from "./airport";
import {
  bake,
  box,
  glow,
  lambert,
  live,
  mesh,
  shared,
  type Kit,
} from "./props";
import { signBoard } from "./buildings";
import { makeLabel } from "./textures";
import { AIRPORT_Y, groundHeight, PASS, S } from "./terrain";

/**
 * Tráfego do aeroporto: aviões de carga que pousam, taxiam até o pátio,
 * embarcam a colheita do sítio (que chega de caminhão) e decolam de novo.
 * Tudo segue um roteiro fixo, com horários escolhidos pra dois aviões nunca
 * usarem a pista ou a vaga ao mesmo tempo.
 */

type Phase =
  | "longe"
  | "pousando"
  | "taxiando"
  | "carregando"
  | "decolando"
  | "subindo";

interface Point {
  x: number;
  z: number;
  /** Altura absoluta (NaN = no chão do aeroporto). */
  y: number;
  /** Velocidade passando por aqui (m/s). */
  v: number;
  phase: Phase;
  /** Fica parado aqui esse tanto (s). */
  wait?: number;
  /** Anda de ré até o próximo ponto (empurrado pelo trator). */
  reverse?: boolean;
  /** Usa a pista (ou a final) nesse trecho: só um avião por vez. */
  runway?: boolean;
  /** Usa a vaga de carga nesse trecho. */
  spot?: boolean;
}

const G = NaN;
/** Vaga de carga no pátio (onde ficava o avião parado). */
export const CARGO_SPOT = { x: -44, z: -157 };
const APPROACH: Point[] = [
  { x: 560, z: -260, y: 105, v: 52, phase: "longe" },
  { x: 400, z: -226, y: 66, v: 48, phase: "pousando" },
  { x: 230, z: -192, y: 28, v: 42, phase: "pousando", runway: true },
  { x: 112, z: -190, y: G, v: 34, phase: "pousando", runway: true },
];
const CLIMB_OUT: Point[] = [
  { x: 150, z: -186, y: 16, v: 42, phase: "subindo", runway: true },
  { x: 320, z: -150, y: 62, v: 48, phase: "subindo" },
  { x: 560, z: -110, y: 105, v: 52, phase: "longe" },
];
/** Rota A: sai da pista pela taxiway leste e para no pátio principal. */
const ROUTE_A: Point[] = [
  ...APPROACH,
  { x: 56, z: -190, y: G, v: 7, phase: "taxiando", runway: true, spot: true },
  { x: 45, z: -181, y: G, v: 6, phase: "taxiando", spot: true },
  { x: 38, z: -175, y: G, v: 7, phase: "taxiando", spot: true },
  { x: -22, z: -175, y: G, v: 6, phase: "taxiando", spot: true },
  { x: -38, z: -173, y: G, v: 4, phase: "taxiando", spot: true },
  { x: -44, z: -166, y: G, v: 2.5, phase: "taxiando", spot: true },
  {
    x: CARGO_SPOT.x,
    z: CARGO_SPOT.z,
    y: G,
    v: 0,
    phase: "carregando",
    wait: 22,
    spot: true,
    reverse: true,
  },
  { x: -44, z: -170, y: G, v: 0, phase: "taxiando", spot: true },
  { x: -52, z: -175, y: G, v: 4, phase: "taxiando", spot: true },
  { x: -60, z: -181, y: G, v: 4, phase: "taxiando", spot: true, runway: true },
  { x: -55, z: -189, y: G, v: 3, phase: "decolando", runway: true },
  { x: -44, z: -190, y: G, v: 6, phase: "decolando", runway: true },
  { x: 58, z: -190, y: G, v: 36, phase: "decolando", runway: true },
  ...CLIMB_OUT,
];
/** Rota B: rola a pista toda e para no pátio de carga do oeste. */
const ROUTE_B: Point[] = [
  ...APPROACH,
  { x: 10, z: -190, y: G, v: 13, phase: "pousando", runway: true },
  { x: -92, z: -190, y: G, v: 6, phase: "taxiando", runway: true, spot: true },
  { x: -100, z: -182, y: G, v: 5, phase: "taxiando", runway: true, spot: true },
  { x: -105, z: -174, y: G, v: 3, phase: "taxiando", spot: true },
  { x: -108, z: -167, y: G, v: 2.5, phase: "taxiando", spot: true },
  {
    x: -108,
    z: -155,
    y: G,
    v: 0,
    phase: "carregando",
    wait: 22,
    spot: true,
    reverse: true,
  },
  { x: -108, z: -168, y: G, v: 0, phase: "taxiando", spot: true },
  { x: -114, z: -176, y: G, v: 4, phase: "taxiando", spot: true },
  {
    x: -116,
    z: -183,
    y: G,
    v: 3,
    phase: "decolando",
    spot: true,
    runway: true,
  },
  { x: -109, z: -190, y: G, v: 4, phase: "decolando", runway: true },
  { x: -96, z: -190, y: G, v: 7, phase: "decolando", runway: true },
  { x: 48, z: -190, y: G, v: 36, phase: "decolando", runway: true },
  ...CLIMB_OUT,
];

interface Leg {
  from: Point;
  to: Point;
  start: number;
  /** Duração andando (sem contar a espera). */
  move: number;
  wait: number;
  length: number;
}

const buildLegs = (route: Point[]) => {
  const legs: Leg[] = [];
  let cycle = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i];
    const to = route[i + 1];
    const ya = Number.isNaN(from.y) ? AIRPORT_Y : from.y;
    const yb = Number.isNaN(to.y) ? AIRPORT_Y : to.y;
    const length = Math.hypot(to.x - from.x, to.z - from.z, yb - ya);
    // de ré e saindo da parada começa devagar
    const v0 = Math.max(from.v, from.reverse || from.wait ? 1.6 : 0.5);
    const v1 = Math.max(to.v, 0.5);
    const move = length / ((v0 + v1) / 2);
    const wait = from.wait ?? 0;
    legs.push({ from, to, start: cycle, move, wait, length });
    cycle += wait + move;
  }
  return { legs, cycle };
};
const ROUTES = [buildLegs(ROUTE_A), buildLegs(ROUTE_B)];
const CYCLE = Math.max(...ROUTES.map((r) => r.cycle));

/** Intervalos (no ciclo) em que o avião usa a pista e a vaga. */
const busy = (legs: Leg[], key: "runway" | "spot") =>
  legs
    .filter((leg) => leg.from[key] && leg.to[key])
    .map((leg) => [leg.start, leg.start + leg.wait + leg.move]);

const collide = (a: number[][], b: number[][], shift: number, period: number) =>
  a.some(([a0, a1]) =>
    b.some(([b0, b1]) => {
      for (const k of [-period, 0, period]) {
        const s0 = b0 + shift + k;
        const s1 = b1 + shift + k;
        if (a0 < s1 + 4 && s0 < a1 + 4) return true;
      }
      return false;
    }),
  );

/** Escolhe o período e o atraso de cada avião (rotas A e B alternadas) pra ninguém se trombar. */
const schedule = (count: number) => {
  const runway = ROUTES.map((r) => busy(r.legs, "runway"));
  const spot = ROUTES.map((r) => busy(r.legs, "spot"));
  for (let period = Math.ceil(CYCLE) + 10; period < CYCLE * 4; period += 5) {
    const chosen: { offset: number; route: number }[] = [
      { offset: 0, route: 0 },
    ];
    for (let d = 1; d < period && chosen.length < count; d++) {
      const route = chosen.length % 2;
      const ok = chosen.every((c) => {
        const shift = (((d - c.offset) % period) + period) % period;
        if (collide(runway[c.route], runway[route], shift, period))
          return false;
        return (
          c.route !== route || !collide(spot[route], spot[route], shift, period)
        );
      });
      if (ok) chosen.push({ offset: d, route });
    }
    if (chosen.length === count) return { period, chosen };
  }
  return { period: CYCLE + 30, chosen: [{ offset: 0, route: 0 }] };
};

const PHASE_TEXT: Record<Phase, string> = {
  longe: "",
  pousando: "pousando",
  taxiando: "taxiando",
  carregando: "embarcando a colheita",
  decolando: "decolando",
  subindo: "indo pra cidade",
};

class CargoPlane {
  readonly root = live(new THREE.Group());
  private body = new THREE.Group();
  private labels = new Map<Phase, THREE.Sprite>();
  phase: Phase = "longe";
  heading = Math.PI / 2;
  pitch = 0;
  roll = 0;
  /** Obstáculos que andam junto (pra ninguém atravessar o avião parado). */
  obstacles = [0, 1, 2, 3, 4].map(() => ({ x: 1e5, z: 1e5, r: 2.4 }));
  private flash: THREE.Mesh;

  constructor(
    kit: Kit,
    readonly code: string,
    stripe: string,
  ) {
    kit.scene.add(this.root);
    this.root.add(this.body);
    airlinerBody(kit, this.body, stripe);
    this.flash = box(
      this.body,
      [0.35, 0.35, 0.35],
      [0, 9.2, -16.6],
      glow("#ff3b3b"),
    );
    bake(this.body);
    kit.obstacles.push(...this.obstacles);
    (Object.keys(PHASE_TEXT) as Phase[]).forEach((phase) => {
      if (!PHASE_TEXT[phase]) return;
      const label = makeLabel(`✈️ ${code} · ${PHASE_TEXT[phase]}`, {
        accent: stripe,
        height: 2.4,
      });
      label.visible = false;
      this.root.add(label);
      label.position.set(0, 11, 0);
      this.labels.set(phase, label);
    });
  }

  /** Põe o avião no ponto do roteiro do instante `time` (segundos dentro do ciclo). */
  place(legs: Leg[], time: number, dt: number, t: number) {
    let leg = legs[legs.length - 1];
    for (const candidate of legs) {
      if (time < candidate.start + candidate.wait + candidate.move) {
        leg = candidate;
        break;
      }
    }
    const { from, to } = leg;
    const local = Math.max(0, time - leg.start - leg.wait);
    const tau = Math.min(1, local / leg.move);
    const v0 = Math.max(from.v, from.reverse || from.wait ? 1.6 : 0.5);
    const v1 = Math.max(to.v, 0.5);
    // velocidade muda aos pouquinhos ao longo do trecho
    const u = Math.min(
      1,
      (leg.move * tau * (v0 + 0.5 * (v1 - v0) * tau)) / leg.length,
    );
    const ya = Number.isNaN(from.y) ? AIRPORT_Y : from.y;
    const yb = Number.isNaN(to.y) ? AIRPORT_Y : to.y;
    const x = from.x + (to.x - from.x) * u;
    const z = from.z + (to.z - from.z) * u;
    const y = ya + (yb - ya) * u;
    const parked = local === 0 && leg.wait > 0;
    let goal = Math.atan2(to.x - from.x, to.z - from.z);
    if (from.reverse) goal += Math.PI;
    if (parked) goal = this.heading;
    let turn = ((goal - this.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const jump = dt > 0.5 || this.phase === "longe";
    const rate = Math.min(1, dt * (from.phase === "taxiando" ? 2.2 : 1.2));
    if (jump) {
      this.heading = goal;
      turn = 0;
    } else this.heading += turn * rate;
    const climb = Math.atan2(yb - ya, Math.hypot(to.x - from.x, to.z - from.z));
    const flare = from.phase === "pousando" && Number.isNaN(to.y) ? 0.06 : 0;
    this.pitch += (climb + flare - this.pitch) * Math.min(1, dt * 1.5);
    const grounded = Number.isNaN(from.y) && Number.isNaN(to.y);
    const bank = grounded ? 0 : Math.max(-0.5, Math.min(0.5, -turn * 1.6));
    this.roll += (bank - this.roll) * Math.min(1, dt * 2);
    this.root.position.set(x, y, z);
    this.root.rotation.set(0, 0, 0);
    this.body.rotation.set(-this.pitch, this.heading, this.roll, "YXZ");
    this.phase = from.phase;
    this.root.visible = this.phase !== "longe" || Math.hypot(x, z + 160) < 420;
    this.labels.forEach(
      (label, phase) =>
        (label.visible = phase === this.phase && this.root.visible),
    );
    this.flash.visible = Math.sin(t * 6) > 0.6;
    // obstáculos do corpo no chão (no ar ficam longe)
    const s = Math.sin(this.heading);
    const c = Math.cos(this.heading);
    [10, 3, -4, -11, -15].forEach((k, i) => {
      const o = this.obstacles[i];
      o.x = grounded ? x + s * k : 1e5;
      o.z = grounded ? z + c * k : 1e5;
    });
    const loaded = parked ? (time - leg.start) / leg.wait : 0;
    return { parked, loaded };
  }
}

/* --------------------------------------------------- comércio da fazenda */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 10));
const CRATE_COLORS = ["#c99a5b", "#b07f45", "#d6ad6c"];
const PRODUCE = ["#ffd23f", "#ff8c2b", "#f5c518", "#e05a2b"];

/** Engradados de madeira com milho, abóbora e girassol por cima. */
const crates = (parent: THREE.Object3D, count: number, seed = 0) => {
  const g = new THREE.Group();
  parent.add(g);
  for (let i = 0; i < count; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3) % 2;
    const level = Math.floor(i / 6);
    const cx = (col - 1) * 0.95;
    const cz = (row - 0.5) * 0.95;
    const cy = 0.42 + level * 0.82;
    box(
      g,
      [0.85, 0.8, 0.85],
      [cx, cy, cz],
      lambert(CRATE_COLORS[(i + seed) % 3]),
    );
    box(
      g,
      [0.7, 0.12, 0.7],
      [cx, cy + 0.44, cz],
      lambert(PRODUCE[(i * 3 + seed) % 4]),
    );
  }
  return g;
};

/** Caminhãozinho que leva a colheita do sítio até o avião de carga. */
const truckRoute: [number, number][] = [
  [S(9), S(-33)],
  [S(3), S(-39)],
  [-9, -56],
  ...PASS,
  [0, -128],
  [-10, -138],
  [-24, -146],
];

class FarmTruck {
  readonly root = live(new THREE.Group());
  private load: THREE.Group;
  private wheels: THREE.Mesh[] = [];
  obstacle = { x: 1e5, z: 1e5, r: 1.8 };
  private lengths: number[] = [];
  private total = 0;
  heading = 0;

  constructor(kit: Kit) {
    kit.scene.add(this.root);
    const g = this.root;
    const paint = lambert("#3a8a4f");
    box(g, [2.1, 1.5, 1.8], [0, 1.35, 1.9], paint);
    box(g, [1.9, 0.6, 0.1], [0, 1.7, 2.82], lambert("#1d2a44"));
    box(g, [2.2, 0.35, 5.8], [0, 0.6, 0.1], lambert("#3a3a44"));
    box(g, [2.2, 0.1, 3.8], [0, 0.82, -0.8], lambert("#8a5a34"));
    for (const side of [-1, 1])
      box(g, [0.1, 0.5, 3.8], [side * 1.05, 1.1, -0.8], lambert("#8a5a34"));
    box(g, [2.2, 0.5, 0.1], [0, 1.1, -2.7], lambert("#8a5a34"));
    box(g, [0.3, 0.2, 0.1], [0.7, 0.9, 2.85], glow("#fff4c8"));
    box(g, [0.3, 0.2, 0.1], [-0.7, 0.9, 2.85], glow("#fff4c8"));
    for (const [wx, wz] of [
      [-1.05, 2],
      [1.05, 2],
      [-1.05, -1.5],
      [1.05, -1.5],
    ]) {
      const wheel = mesh(g, CYL, lambert("#1c1c22"), [wx, 0.45, wz]);
      wheel.scale.set(0.45, 0.3, 0.45);
      wheel.rotation.z = Math.PI / 2;
      this.wheels.push(wheel);
    }
    this.load = crates(g, 6, 1);
    this.load.position.set(0, 0.85, -0.8);
    this.load.scale.setScalar(0.95);
    kit.obstacles.push(this.obstacle);
    for (let i = 0; i < truckRoute.length - 1; i++) {
      const [ax, az] = truckRoute[i];
      const [bx, bz] = truckRoute[i + 1];
      const length = Math.hypot(bx - ax, bz - az);
      this.lengths.push(length);
      this.total += length;
    }
  }

  /** `s` = metros andados a partir da fazenda; `loaded` = carregado de colheita. */
  place(s: number, loaded: boolean, dt: number, speed: number) {
    let i = 0;
    let rest = Math.max(0, Math.min(this.total - 0.01, s));
    while (rest > this.lengths[i]) rest -= this.lengths[i++];
    const [ax, az] = truckRoute[i];
    const [bx, bz] = truckRoute[i + 1];
    const k = rest / this.lengths[i];
    const x = ax + (bx - ax) * k;
    const z = az + (bz - az) * k;
    const forward = Math.atan2(bx - ax, bz - az);
    const goal = speed < 0 ? forward + Math.PI : forward;
    const turn =
      ((goal - this.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    this.heading += turn * Math.min(1, dt * 3);
    this.root.position.set(x, groundHeight(x, z), z);
    // de lado no morro: inclina um pouquinho pra acompanhar a estrada
    const ahead = 2;
    const front = groundHeight(
      x + Math.sin(this.heading) * ahead,
      z + Math.cos(this.heading) * ahead,
    );
    const back = groundHeight(
      x - Math.sin(this.heading) * ahead,
      z - Math.cos(this.heading) * ahead,
    );
    this.root.rotation.set(0, this.heading, 0);
    this.root.rotateX(-Math.atan2(front - back, ahead * 2));
    this.load.visible = loaded;
    this.wheels.forEach(
      (wheel) => (wheel.rotation.x += Math.abs(speed) * dt * 2),
    );
    this.obstacle.x = x;
    this.obstacle.z = z;
  }

  get length() {
    return this.total;
  }
}

/** Placa do comércio da fazenda. */
const commerceSign = (
  kit: Kit,
  x: number,
  z: number,
  angle: number,
  lines: string[],
) => {
  const g = new THREE.Group();
  g.position.set(x, groundHeight(x, z), z);
  g.rotation.y = angle;
  kit.statics.add(g);
  for (const side of [-1, 1])
    box(g, [0.18, 2.8, 0.18], [side * 1.5, 1.4, -0.05], lambert("#5a3a20"));
  signBoard(g, lines, 3.2, [0, 2, 0.02], {
    bg: "#3a6b2a",
    size: 70,
    canvas: 1024,
    back: true,
  });
  kit.obstacles.push({ x, z, r: 0.8 });
};

/** Tudo junto: aviões, caminhão e a pilha de engradados no pátio. */
export const buildTraffic = (kit: Kit) => {
  const { period, chosen } = schedule(kit.env.mobile ? 3 : 4);
  const liveries: [string, string][] = [
    ["SC-101", "#7c3aed"],
    ["SC-202", "#2f6fd6"],
    ["SC-303", "#e0702b"],
    ["SC-404", "#3a8a4f"],
  ];
  const planes = chosen.map(({ offset, route }, i) => ({
    plane: new CargoPlane(kit, ...liveries[i % liveries.length]),
    offset,
    route: ROUTES[route],
    pile: route,
  }));
  const truck = new FarmTruck(kit);
  // engradados esperando o avião na vaga de carga
  const pile = live(new THREE.Group());
  pile.position.set(CARGO_SPOT.x + 10, AIRPORT_Y, CARGO_SPOT.z + 9);
  kit.scene.add(pile);
  crates(pile, 12, 2);
  bake(pile);
  const pileB = live(new THREE.Group());
  pileB.position.set(-94, AIRPORT_Y, -150);
  kit.scene.add(pileB);
  crates(pileB, 12, 1);
  bake(pileB);
  const piles = [pile, pileB];
  const empty = [false, false];
  // a pilha da fazenda (de onde o caminhão sai)
  const farmPile = live(new THREE.Group());
  const [fx, fz] = [truckRoute[0][0] + 3.2, truckRoute[0][1] + 1.5];
  farmPile.position.set(fx, groundHeight(fx, fz), fz);
  kit.scene.add(farmPile);
  crates(farmPile, 9, 0);
  bake(farmPile);
  kit.obstacles.push(
    { x: pile.position.x, z: pile.position.z, r: 1.8 },
    { x: pileB.position.x, z: pileB.position.z, r: 1.8 },
    { x: fx, z: fz, r: 1.6 },
  );
  commerceSign(kit, fx + 2.6, fz + 2.4, 0.4, [
    "COMÉRCIO DA FAZENDA",
    "Milho, abóbora e girassol",
    "vão de caminhão pro aeroporto",
  ]);
  commerceSign(kit, pile.position.x + 4, pile.position.z + 3, 0, [
    "CARGA DA FAZENDA",
    "Embarque pro avião de carga",
    "Voos SC saindo toda hora",
  ]);

  const drive = truck.length / 7.5;
  const truckCycle = drive * 2 + 24;
  let lastPhase = new Map<string, Phase>();

  return {
    period,
    /** Atualiza e devolve recados da torre quando um avião muda de fase. */
    update(t: number, dt: number) {
      const loading = [-1, -1];
      const news: { code: string; phase: Phase }[] = [];
      planes.forEach(({ plane, offset, route, pile: which }) => {
        const time = (((t - offset) % period) + period) % period;
        const { parked, loaded } = plane.place(
          route.legs,
          Math.min(time, route.cycle - 0.001),
          dt,
          t,
        );
        if (time >= route.cycle) plane.root.visible = false;
        if (parked) loading[which] = loaded;
        // outro avião vindo: o pessoal da fazenda já deixa a carga pronta
        if (plane.phase === "pousando") empty[which] = false;
        if (lastPhase.get(plane.code) !== plane.phase) {
          if (lastPhase.has(plane.code))
            news.push({ code: plane.code, phase: plane.phase });
          lastPhase.set(plane.code, plane.phase);
        }
      });
      // caminhão: vai carregado, espera, volta vazio, espera
      const tt = t % truckCycle;
      if (tt < drive) truck.place((tt / drive) * truck.length, true, dt, 7.5);
      else if (tt < drive + 12) truck.place(truck.length, false, dt, 0);
      else if (tt < drive * 2 + 12)
        truck.place(
          truck.length - ((tt - drive - 12) / drive) * truck.length,
          false,
          dt,
          -7.5,
        );
      else truck.place(0, tt - drive * 2 - 12 > 8, dt, 0);
      // a pilha vai sumindo pra dentro do avião enquanto ele carrega
      piles.forEach((p, i) => {
        if (loading[i] >= 0.8) empty[i] = true;
        p.visible = !empty[i];
        p.scale.y = loading[i] >= 0 ? Math.max(0.2, 1 - loading[i]) : 1;
      });
      return news;
    },
    /** Onde estão os aviões (pro mapa). */
    positions: () =>
      planes
        .filter(({ plane }) => plane.root.visible)
        .map(({ plane }) => plane.root.position),
    reset() {
      lastPhase = new Map();
    },
  };
};
