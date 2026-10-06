import * as THREE from "three";
import type { Kit } from "./props";
import { keep } from "./props";
import { makeLabel } from "./textures";
import { S, terrainHeight, WATER_Y } from "./terrain";

/**
 * Desafios de voo: argolas brilhando no céu. Passe voando pela argola de
 * largada (a amarela grandona) e o cronômetro começa; atravesse todas, na
 * ordem, o mais rápido que der.
 */
export interface Course {
  id: string;
  name: string;
  emoji: string;
  /** Uma frase pra pessoa saber o que esperar. */
  blurb: string;
  /** Avião que combina mais (só uma dica). */
  tip: string;
  /** Argolas: x, z e a altura acima do chão (ou da água). */
  rings: [number, number, number][];
  color: string;
}

export const COURSES: Course[] = [
  {
    id: "fazenda",
    name: "Volta na Fazenda",
    emoji: "🌾",
    blurb: "Passeio por cima do curral, do terreiro, do parque e do lago.",
    tip: "Bom pra começar (qualquer avião)",
    color: "#ffd166",
    rings: [
      [0, -126, 22],
      [-4, -84, 28],
      [S(3), S(-46), 20],
      [S(2), S(-5), 18],
      [S(30), S(1.5), 22],
      [S(50), S(10), 18],
      [85, 47, 14],
      [30, S(55), 18],
      [-40, S(40), 18],
      [S(-60), S(10), 20],
      [S(-40), S(-34), 22],
      [-12, -96, 30],
    ],
  },
  {
    id: "lago",
    name: "Rasante no Lago",
    emoji: "🌊",
    blurb: "Argolas baixinhas, quase encostando na água. Devagar e com calma.",
    tip: "O ultraleve é o mais fácil aqui",
    color: "#5eead4",
    rings: [
      [S(30), S(14), 14],
      [S(44), S(24), 7],
      [72, 38, 4.5],
      [96, 55, 4.5],
      [80, 66, 4.5],
      [62, 74, 4.5],
      [S(56), S(70) - 20, 10],
      [104, 36, 8],
      [110, 18, 5],
      [S(60), S(-8), 14],
    ],
  },
  {
    id: "serra",
    name: "Serra Acima",
    emoji: "⛰️",
    blurb: "Uma volta inteira por cima das montanhas, lá no alto.",
    tip: "Pede velocidade: vá de jato",
    color: "#ff7eb6",
    rings: Array.from({ length: 10 }, (_, i) => {
      // começa no norte (perto do aeroporto) e dá a volta no sentido horário
      const a = Math.PI + (i / 10) * Math.PI * 2;
      return [Math.sin(a) * 168, Math.cos(a) * 168 + 10, 16] as [
        number,
        number,
        number,
      ];
    }),
  },
];

const RING_RADIUS = 6;
/** Folga pra contar a passagem (asas grandes, avião rápido). */
const HIT_RADIUS = RING_RADIUS + 2.2;
const RING = new THREE.TorusGeometry(RING_RADIUS, 0.42, 8, 40);
const RING_GLOW = new THREE.TorusGeometry(RING_RADIUS, 1.1, 6, 40);

interface Ring {
  root: THREE.Group;
  core: THREE.MeshBasicMaterial;
  aura: THREE.MeshBasicMaterial;
  pos: THREE.Vector3;
}

interface Track {
  course: Course;
  rings: Ring[];
  label: THREE.Sprite;
}

export type ChallengeEvent =
  | { type: "start"; course: Course }
  | { type: "ring"; course: Course; index: number }
  | { type: "done"; course: Course; time: number }
  | { type: "fail"; course: Course; reason: string }
  | null;

/** Altura de cada argola: acima do morro (ou da água) mais alto ali em volta. */
const ringHeight = (x: number, z: number, h: number) => {
  let floor = WATER_Y;
  for (const [ox, oz] of [
    [0, 0],
    [6, 0],
    [-6, 0],
    [0, 6],
    [0, -6],
  ])
    floor = Math.max(floor, terrainHeight(x + ox, z + oz));
  return floor + RING_RADIUS + h;
};

export class Challenges {
  private tracks: Track[];
  active: Track | null = null;
  /** Próxima argola do desafio que está rolando. */
  next = 0;
  private startedAt = 0;
  private lastPos = new THREE.Vector3(Infinity, 0, 0);

  constructor(private kit: Kit) {
    this.tracks = COURSES.map((course) => {
      const points = course.rings.map(
        ([x, z, h]) => new THREE.Vector3(x, ringHeight(x, z, h), z),
      );
      const rings = points.map((pos, i) => {
        const before = points[Math.max(0, i - 1)];
        const after = points[Math.min(points.length - 1, i + 1)];
        const root = keep(new THREE.Group());
        root.position.copy(pos);
        // a argola fica de frente pra quem vem da anterior indo pra próxima
        root.rotation.y = Math.atan2(after.x - before.x, after.z - before.z);
        const core = new THREE.MeshBasicMaterial({
          color: course.color,
          transparent: true,
          opacity: 0.95,
        });
        const aura = new THREE.MeshBasicMaterial({
          color: course.color,
          transparent: true,
          opacity: 0.25,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        root.add(new THREE.Mesh(RING, core), new THREE.Mesh(RING_GLOW, aura));
        if (i === 0) root.scale.setScalar(1.35);
        kit.scene.add(root);
        return { root, core, aura, pos };
      });
      const label = makeLabel(`${course.emoji} Desafio: ${course.name}`, {
        accent: course.color,
        height: 2.6,
      });
      label.position
        .copy(points[0])
        .add(new THREE.Vector3(0, RING_RADIUS * 1.35 + 1.2, 0));
      kit.scene.add(label);
      return { course, rings, label };
    });
    this.show();
  }

  /** Quanto tempo de prova (segundos). */
  elapsed(t: number) {
    return this.active ? t - this.startedAt : 0;
  }

  /** Argola que a pessoa tem que atravessar agora. */
  target() {
    if (!this.active) return null;
    const ring = this.active.rings[this.next];
    return {
      x: ring.pos.x,
      y: ring.pos.y,
      z: ring.pos.z,
      label: `Argola ${this.next + 1}`,
    };
  }

  /** Onde fica a largada de cada desafio (pro mapa). */
  starts() {
    return this.tracks.map(({ course, rings }) => ({
      course,
      x: rings[0].pos.x,
      z: rings[0].pos.z,
    }));
  }

  /** Mostra só a largada de cada um; com desafio rolando, só as argolas dele. */
  private show() {
    this.tracks.forEach((track) => {
      const mine = track === this.active;
      track.label.visible = !this.active;
      track.rings.forEach((ring, i) => {
        ring.root.visible = this.active ? mine && i >= this.next : i === 0;
      });
    });
  }

  abort(reason: string): ChallengeEvent {
    if (!this.active) return null;
    const course = this.active.course;
    this.active = null;
    this.show();
    return { type: "fail", course, reason };
  }

  /**
   * `pos` = onde está o avião voando (ou null se não estiver voando).
   * Devolve o que aconteceu nesse quadro.
   */
  update(t: number, pos: THREE.Vector3 | null): ChallengeEvent {
    // argolas pulsando (a próxima pulsa mais)
    this.tracks.forEach((track) => {
      track.rings.forEach((ring, i) => {
        if (!ring.root.visible) return;
        const hot = this.active ? i === this.next : i === 0;
        const pulse = 0.5 + 0.5 * Math.sin(t * (hot ? 5 : 2) + i);
        ring.aura.opacity = hot ? 0.3 + pulse * 0.35 : 0.08;
        ring.core.opacity = hot ? 1 : 0.45;
        ring.root.rotation.z = t * (hot ? 0.8 : 0.2);
      });
    });
    if (!pos) {
      this.lastPos.set(Infinity, 0, 0);
      return null;
    }
    const last = this.lastPos.x === Infinity ? pos : this.lastPos;
    const crossed = (ring: Ring) => passes(last, pos, ring.pos);
    let event: ChallengeEvent = null;
    if (!this.active) {
      const track = this.tracks.find((tr) => crossed(tr.rings[0]));
      if (track) {
        this.active = track;
        this.next = 1;
        this.startedAt = t;
        this.show();
        event = { type: "start", course: track.course };
      }
    } else {
      const track = this.active;
      if (crossed(track.rings[this.next])) {
        const index = this.next;
        this.next++;
        if (this.next >= track.rings.length) {
          this.active = null;
          event = {
            type: "done",
            course: track.course,
            time: t - this.startedAt,
          };
        } else event = { type: "ring", course: track.course, index };
        this.show();
      } else if (t - this.startedAt > 300) event = this.abort("Tempo esgotado");
    }
    this.lastPos.copy(pos);
    return event;
  }
}

/** O segmento de `a` até `b` passou perto do centro da argola? */
const passes = (a: THREE.Vector3, b: THREE.Vector3, center: THREE.Vector3) => {
  const ab = TMP.subVectors(b, a);
  const len = ab.lengthSq();
  const k =
    len > 0
      ? Math.max(0, Math.min(1, TMP2.subVectors(center, a).dot(ab) / len))
      : 0;
  const closest = TMP2.copy(a).addScaledVector(ab, k);
  return closest.distanceTo(center) < HIT_RADIUS;
};
const TMP = new THREE.Vector3();
const TMP2 = new THREE.Vector3();
