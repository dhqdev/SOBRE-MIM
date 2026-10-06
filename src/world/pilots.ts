import * as THREE from 'three';
import { COURSES, ringHeight } from './challenges';
import { Plane, type PlaneKind } from './plane';
import { box, lambert, type Kit } from './props';
import { makeLabel } from './textures';
import { RUNWAY, terrainHeight, WATER_Y } from './terrain';

/**
 * Outros "jogadores" no céu: aviões no piloto automático, cada um com um
 * nome em cima. Uns passeiam, uns fazem os desafios de argolas, uns
 * encostam na pista e decolam de novo (arremetida), e de vez em quando
 * soltam fumaça colorida.
 */

const NAMES = ['Lucas_22', 'Bia.voa', 'Pedrão', 'Ana_Piloto', 'Gui_Gamer', 'Malu', 'Rafa_SP', 'JP_Ases'];
const SHIRTS = ['#e0702b', '#2f6fd6', '#3a8a4f', '#d23b2e', '#ff7eb6', '#ffd166', '#5eead4', '#7c3aed'];
const KINDS: PlaneKind[] = ['biplano', 'ultraleve', 'jato', 'biplano', 'jato', 'ultraleve', 'biplano', 'jato'];

type Plan = 'passeio' | 'argolas' | 'pista';

interface Goal {
  x: number;
  z: number;
  /** Altura absoluta (NaN = encostar na pista). */
  y: number;
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Lista de pontos de cada plano de voo. */
const route = (plan: Plan, kind: PlaneKind, rand: () => number): Goal[] => {
  if (plan === 'argolas') {
    const course = COURSES[Math.floor(rand() * COURSES.length)];
    return course.rings.map(([x, z, h]) => ({ x, z, y: ringHeight(x, z, h) }));
  }
  if (plan === 'pista') {
    // chega pelo leste, desce na pista e (no ultraleve e no biplano) encosta as rodas
    const touch = kind !== 'jato';
    const y = terrainHeight(RUNWAY.x, RUNWAY.z);
    return [
      { x: 300, z: RUNWAY.z, y: y + 45 },
      { x: 160, z: RUNWAY.z, y: y + 16 },
      { x: 70, z: RUNWAY.z, y: touch ? NaN : y + 6 },
      { x: -100, z: RUNWAY.z, y: y + 12 },
      { x: -260, z: RUNWAY.z + 40, y: y + 50 },
    ];
  }
  return Array.from({ length: 5 }, () => {
    const a = rand() * Math.PI * 2;
    const r = 60 + rand() * 200;
    const x = Math.sin(a) * r;
    const z = Math.cos(a) * r - 40;
    return { x, z, y: Math.max(terrainHeight(x, z), WATER_Y) + 30 + rand() * 60 };
  });
};

class Pilot {
  readonly plane: Plane;
  private goals: Goal[] = [];
  private index = 0;
  private smokeUntil = 0;
  private nextSmoke = 0;
  /** Segundos rodando na pista depois de encostar. */
  private rolling = -1;

  constructor(
    kit: Kit,
    readonly name: string,
    kind: PlaneKind,
    shirt: string,
    private rand: () => number,
    i: number,
  ) {
    const a = (i / 8) * Math.PI * 2;
    this.plane = new Plane(kit, kind, Math.sin(a) * 150, Math.cos(a) * 150 - 40, a + Math.PI / 2);
    const p = this.plane;
    p.ridden = true;
    p.grounded = false;
    p.alt = 50 + rand() * 50;
    p.speed = p.spec.minSpeed + (p.spec.maxSpeed - p.spec.minSpeed) * 0.5;
    p.power = 0.45 + rand() * 0.35;
    // pilotinho sentado na cabine
    const seat = p.spec.seat;
    const body = new THREE.Group();
    body.position.set(seat[0], seat[1], seat[2]);
    box(body, [0.62, 0.7, 0.4], [0, 0.55, 0], lambert(shirt));
    box(body, [0.52, 0.5, 0.5], [0, 1.15, 0], lambert('#e2a878'));
    box(body, [0.58, 0.2, 0.56], [0, 1.45, -0.02], lambert('#2b1d14'));
    box(body, [0.5, 0.14, 0.12], [0, 1.25, 0.26], lambert('#1a1326'));
    p.root.add(body);
    const label = makeLabel(`🎮 ${name}`, { accent: shirt, height: 1.5 });
    label.position.set(0, 3.6, 0);
    p.root.add(label);
    this.newPlan();
  }

  private newPlan() {
    const roll = this.rand();
    const plan: Plan = roll < 0.35 ? 'argolas' : roll < 0.6 ? 'pista' : 'passeio';
    this.goals = route(plan, this.plane.spec.kind, this.rand);
    this.index = 0;
  }

  update(t: number, dt: number) {
    const p = this.plane;
    const goal = this.goals[this.index];
    let ix = 0;
    let iz = 0;
    if (p.grounded) {
      // encostou na pista: rola um pouquinho e acelera pra decolar de novo
      if (this.rolling < 0) this.rolling = 0;
      this.rolling += dt;
      p.angle += wrap(-Math.PI / 2 - p.angle) * Math.min(1, dt * 2);
      iz = this.rolling < 1.5 ? 0 : -1;
      p.power = 0.8;
    } else {
      this.rolling = -1;
      const want = Math.atan2(goal.x - p.x, goal.z - p.z);
      ix = Math.max(-1, Math.min(1, -wrap(want - p.angle) * 1.6));
      const floor = Math.max(terrainHeight(p.x, p.z), WATER_Y);
      const ahead = Math.max(
        terrainHeight(p.x + Math.sin(p.angle) * 30, p.z + Math.cos(p.angle) * 30),
        WATER_Y,
      );
      const targetY = Number.isNaN(goal.y) ? floor - 2 : goal.y;
      let up = Math.max(-1, Math.min(1, (targetY - p.alt) / 12));
      // não bater no morro
      if (!Number.isNaN(goal.y) && p.alt < Math.max(floor, ahead) + 12) up = 1;
      // na final da pista: asas niveladas e descida suave
      if (Number.isNaN(goal.y)) {
        ix *= 0.4;
        up = Math.max(up, -0.35);
        p.power = 0.15;
      }
      iz = -up;
    }
    p.drive(dt, t, ix, iz);
    if (!p.grounded) {
      const d = Math.hypot(goal.x - p.x, goal.z - p.z);
      const reached = Number.isNaN(goal.y) ? p.x < goal.x : d < 14;
      if (reached) {
        this.index++;
        if (this.index >= this.goals.length) this.newPlan();
      }
      if (this.index > 0 && Number.isNaN(this.goals[this.index - 1]?.y) && p.power < 0.3) p.power = 0.6;
    }
    // fumaça colorida de vez em quando
    if (t > this.nextSmoke) {
      this.smokeUntil = t + 4 + this.rand() * 6;
      this.nextSmoke = t + 25 + this.rand() * 35;
    }
    p.smoke = t < this.smokeUntil && !p.grounded;
  }
}

/** Monta os aviões dos "outros jogadores". */
export const buildPilots = (kit: Kit) => {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const count = kit.env.mobile ? 4 : 7;
  const pilots = Array.from(
    { length: count },
    (_, i) => new Pilot(kit, NAMES[i], KINDS[i], SHIRTS[i], rand, i),
  );
  return {
    planes: pilots.map((p) => p.plane),
    update: (t: number, dt: number) => pilots.forEach((p) => p.update(t, dt)),
    positions: () => pilots.map(({ plane }) => ({ x: plane.x, z: plane.z, name: '' })),
  };
};
