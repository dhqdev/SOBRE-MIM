import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { terrainHeight } from './terrain';
import { softGlowTexture } from './textures';

/**
 * Peças básicas do sítio: materiais, caixinhas, partículas, colisão e o
 * "kit" que todas as construções recebem.
 */

/** Animação que roda a cada quadro. `t` é o tempo total em segundos. */
export type Tick = (t: number, dt: number) => void;

export interface Obstacle {
  x: number;
  z: number;
  r: number;
}

/** Parede reta (cerca, parede de casa): ninguém atravessa. */
export interface Wall {
  ax: number;
  az: number;
  bx: number;
  bz: number;
}

export interface Night {
  /** Lâmpadas: apagadas de dia, acesas de noite. */
  bulbs: THREE.MeshBasicMaterial;
  /** Janelas das casas. */
  windows: THREE.MeshBasicMaterial;
  /** Brilho em volta das lâmpadas (um material só pra todos). */
  halo: THREE.SpriteMaterial;
  halos: THREE.Sprite[];
  lamps: { light: THREE.PointLight; base: number }[];
  /** Lâmpadas coloridas (parque): cada cor é um material que acende de noite. */
  glows: Map<string, { material: THREE.MeshBasicMaterial; on: THREE.Color; off: THREE.Color }>;
  /** Círculos de luz no chão em volta das lâmpadas (viram uma malha só). */
  pools: { x: number; z: number; r: number; color: THREE.Color }[];
  poolMaterial: THREE.MeshBasicMaterial;
  hooks: ((night: number) => void)[];
}

export interface Kit {
  scene: THREE.Scene;
  /** O que nunca se mexe vai aqui e vira poucas malhas no fim (fica leve no celular). */
  statics: THREE.Group;
  ticks: Tick[];
  obstacles: Obstacle[];
  walls: Wall[];
  particles: Particles;
  time: { value: number };
  /** 0 = dia, 1 = noite; `dusk` = quanto é pôr do sol. Atualizado pelo motor a cada quadro. */
  env: { night: number; dusk: number; mobile: boolean };
  night: Night;
}

export const createKit = (scene: THREE.Scene, mobile: boolean): Kit => {
  const statics = new THREE.Group();
  scene.add(statics);
  return {
    scene,
    statics,
    ticks: [],
    obstacles: [],
    walls: [],
    particles: new Particles(scene),
    time: { value: 0 },
    env: { night: 0, dusk: 0, mobile },
    night: {
      bulbs: new THREE.MeshBasicMaterial({ color: '#8a7b58' }),
      windows: new THREE.MeshBasicMaterial({ color: '#4a5a6e' }),
      halo: new THREE.SpriteMaterial({
        map: softGlowTexture(255, 214, 150),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
      halos: [],
      lamps: [],
      glows: new Map(),
      pools: [],
      poolMaterial: new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        fog: true,
      }),
      hooks: [],
    },
  };
};

const BULB_OFF = new THREE.Color('#9a8a62');
const BULB_ON = new THREE.Color('#ffe7a3');
const WINDOW_OFF = new THREE.Color('#51637a');
const WINDOW_ON = new THREE.Color('#ffcf7a');

/** Acende (ou apaga) tudo que depende da noite. */
export const applyNight = (kit: Kit, night: number) => {
  kit.env.night = night;
  kit.night.bulbs.color.lerpColors(BULB_OFF, BULB_ON, Math.min(1, night * 1.6));
  kit.night.windows.color.lerpColors(WINDOW_OFF, WINDOW_ON, Math.min(1, night * 1.3));
  // as lâmpadas só acendem quando já escureceu de verdade (no pôr do sol ficam apagadas)
  const lit = Math.max(0, Math.min(1, (night - 0.25) / 0.45));
  kit.night.halo.opacity = lit * 0.85;
  kit.night.halos.forEach((sprite) => (sprite.visible = lit > 0.02));
  kit.night.poolMaterial.opacity = lit;
  kit.night.glows.forEach(({ material, on, off }) => material.color.lerpColors(off, on, lit));
  PARTY.color.setScalar(0.5 + 0.5 * lit);
  kit.night.lamps.forEach(({ light, base }) => {
    light.intensity = base * lit;
    light.visible = lit > 0.02;
  });
  kit.night.hooks.forEach((hook) => hook(night));
};

/* ---------------------------------------------------------------- materiais */

const materials = new Map<string, THREE.Material>();

/** Material fosco com sombreamento facetado (o visual low-poly). */
export const lambert = (color: string, emissive?: string, intensity = 1) => {
  const key = `l:${color}:${emissive ?? ''}:${intensity}`;
  let material = materials.get(key);
  if (!material) {
    material = new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      emissive: emissive ?? '#000000',
      emissiveIntensity: intensity,
    });
    materials.set(key, material);
  }
  return material;
};

/** Material que brilha sozinho, sem luz (telas, chamas, cristais). */
export const glow = (color: string, opacity = 1) => {
  const key = `g:${color}:${opacity}`;
  let material = materials.get(key);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
    });
    materials.set(key, material);
  }
  return material;
};

export const disposeMaterials = () => {
  materials.forEach((material) => material.dispose());
  materials.clear();
};

/* ------------------------------------------------------------- utilidades */

const BOX = new THREE.BoxGeometry(1, 1, 1);
const SHARED = new Set<THREE.BufferGeometry>([BOX]);
/** Geometria reaproveitada por muita gente (não é descartada no merge). */
export const shared = <T extends THREE.BufferGeometry>(geometry: T) => {
  SHARED.add(geometry);
  return geometry;
};

export const box = (
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
) => {
  const m = new THREE.Mesh(BOX, material);
  m.scale.set(...size);
  m.position.set(...position);
  parent.add(m);
  return m;
};

export const mesh = (
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number] = [0, 0, 0],
) => {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  parent.add(m);
  return m;
};

/** Gira o objeto pra "olhar" (com a frente +z) para o ponto. */
export const faceTo = (object: THREE.Object3D, x: number, z: number) => {
  object.rotation.y = Math.atan2(x - object.position.x, z - object.position.z);
};

/** Gerador aleatório com semente: o sítio nasce sempre igual. */
export const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** Marca um pedaço que se mexe (não entra na malha estática). */
export const live = <T extends THREE.Object3D>(object: T) => {
  object.userData.live = true;
  return object;
};

/**
 * Grupo plantado no chão. Por padrão é estático (vira parte da malha
 * única no fim); `live` deixa ele solto pra animar.
 */
export const group = (kit: Kit, x: number, z: number, options: { live?: boolean; lift?: number } = {}) => {
  const g = new THREE.Group();
  g.position.set(x, terrainHeight(x, z) + (options.lift ?? 0), z);
  if (options.live) {
    live(g);
    kit.scene.add(g);
  } else kit.statics.add(g);
  return g;
};

const tmp = new THREE.Vector3();
/** Ponto local de um grupo em coordenadas do mundo. */
export const toWorld = (g: THREE.Object3D, x: number, z: number, y = 0) => {
  g.updateMatrixWorld(true);
  return g.localToWorld(tmp.set(x, y, z)).clone();
};

/** Obstáculo redondo num ponto local do grupo. */
export const solid = (kit: Kit, g: THREE.Object3D, x: number, z: number, r: number) => {
  const p = toWorld(g, x, z);
  kit.obstacles.push({ x: p.x, z: p.z, r });
};

/** Paredes ligando pontos locais do grupo. */
export const wallPath = (kit: Kit, g: THREE.Object3D, points: [number, number][], closed = false) => {
  const world = points.map(([x, z]) => toWorld(g, x, z));
  const count = closed ? world.length : world.length - 1;
  for (let i = 0; i < count; i++) {
    const a = world[i];
    const b = world[(i + 1) % world.length];
    kit.walls.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
  }
};

/** Retângulo sólido (casa, celeiro): 4 paredes. */
export const wallRect = (kit: Kit, g: THREE.Object3D, w: number, d: number, cx = 0, cz = 0) =>
  wallPath(
    kit,
    g,
    [
      [cx - w / 2, cz - d / 2],
      [cx + w / 2, cz - d / 2],
      [cx + w / 2, cz + d / 2],
      [cx - w / 2, cz + d / 2],
    ],
    true,
  );

/** Base de pedra que entra no chão, pra construção não flutuar na ladeira. */
export const footing = (g: THREE.Object3D, w: number, d: number, color = '#8d8478', top = 0.18) =>
  box(g, [w, 2 + top, d], [0, top - (2 + top) / 2, 0], lambert(color));

/** Brilho em volta de uma lâmpada (aparece de noite). */
export const halo = (kit: Kit, parent: THREE.Object3D, position: [number, number, number], size = 1.6) => {
  const sprite = new THREE.Sprite(kit.night.halo);
  sprite.position.set(...position);
  sprite.scale.setScalar(size);
  sprite.visible = false;
  parent.add(sprite);
  kit.night.halos.push(sprite);
  return sprite;
};

/** Luz de verdade (poucas, porque pesam). Só acende de noite. */
export const nightLight = (
  kit: Kit,
  parent: THREE.Object3D,
  position: [number, number, number],
  color = '#ffc977',
  intensity = 9,
  distance = 14,
) => {
  // queda física (decay 2): o clarão some suave, sem aquele círculo duro no chão
  const light = new THREE.PointLight(color, 0, distance * 1.3, 2);
  light.position.set(...position);
  parent.add(light);
  const base = intensity * 3.2;
  kit.night.lamps.push({ light, base: kit.env.mobile ? base * 0.9 : base });
  const spot = toWorld(parent, position[0], position[2], position[1]);
  lightPool(kit, spot.x, spot.z, Math.min(7, distance * 0.42), color, 0.4);
  return light;
};

/** Lâmpada colorida que fica apagadinha de dia e acende de noite. */
export const nightGlow = (kit: Kit, color: string) => {
  let entry = kit.night.glows.get(color);
  if (!entry) {
    const on = new THREE.Color(color);
    const off = on.clone().lerp(new THREE.Color('#8f8a80'), 0.55).multiplyScalar(0.85);
    entry = { material: new THREE.MeshBasicMaterial({ color: off }), on, off };
    // na hora de juntar as malhas, todas as cores viram um material só (cor no vértice)
    entry.material.userData.party = on;
    kit.night.glows.set(color, entry);
  }
  return entry.material;
};

/** Círculo de luz quente no chão (de noite), sem custo de luz de verdade. */
export const lightPool = (kit: Kit, x: number, z: number, r = 4.5, color = '#ffb866', strength = 0.55) => {
  kit.night.pools.push({ x, z, r, color: new THREE.Color(color).multiplyScalar(strength) });
};

/** Monta todos os círculos de luz numa malha só, colada no relevo. */
export const buildPools = (kit: Kit, height: (x: number, z: number) => number) => {
  const RINGS = 6;
  const SEGMENTS = 20;
  const positions: number[] = [];
  const colors: number[] = [];
  const index: number[] = [];
  kit.night.pools.forEach(({ x, z, r, color }) => {
    const start = positions.length / 3;
    positions.push(x, height(x, z) + 0.07, z);
    colors.push(color.r, color.g, color.b);
    for (let ring = 1; ring <= RINGS; ring++) {
      const k = ring / RINGS;
      // queda suave tipo gaussiana: forte no meio, some na borda
      const fade = Math.exp(-k * k * 3.2) * (1 - k * k);
      for (let s = 0; s < SEGMENTS; s++) {
        const a = (s / SEGMENTS) * Math.PI * 2;
        const px = x + Math.cos(a) * r * k;
        const pz = z + Math.sin(a) * r * k;
        positions.push(px, height(px, pz) + 0.07, pz);
        colors.push(color.r * fade, color.g * fade, color.b * fade);
      }
    }
    for (let s = 0; s < SEGMENTS; s++) {
      const n = (s + 1) % SEGMENTS;
      index.push(start, start + 1 + n, start + 1 + s);
    }
    for (let ring = 1; ring < RINGS; ring++) {
      const a0 = start + 1 + (ring - 1) * SEGMENTS;
      const b0 = start + 1 + ring * SEGMENTS;
      for (let s = 0; s < SEGMENTS; s++) {
        const n = (s + 1) % SEGMENTS;
        index.push(a0 + s, a0 + n, b0 + s, a0 + n, b0 + n, b0 + s);
      }
    }
  });
  if (!positions.length) return;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(index);
  const pools = new THREE.Mesh(geometry, kit.night.poolMaterial);
  pools.renderOrder = 2;
  kit.night.hooks.push((night) => (pools.visible = night > 0.25));
  kit.scene.add(pools);
};

/**
 * Troca os brilhos das lâmpadas paradas (postes, casas, brinquedos) por uma
 * malha só de "cartõezinhos" virados pra câmera: dezenas de sprites viram
 * uma chamada de desenho.
 */
export const buildHalos = (kit: Kit) => {
  kit.scene.updateMatrixWorld(true);
  const isStatic = (object: THREE.Object3D) => {
    for (let o: THREE.Object3D | null = object.parent; o; o = o.parent) {
      if (o.userData.live) return false;
      if (o === kit.statics) return true;
    }
    return false;
  };
  const still = kit.night.halos.filter(isStatic);
  if (!still.length) return;
  const centers: number[] = [];
  const corners: number[] = [];
  const index: number[] = [];
  const point = new THREE.Vector3();
  still.forEach((sprite, i) => {
    sprite.getWorldPosition(point);
    const size = sprite.scale.x;
    for (const [cx, cy] of [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ]) {
      centers.push(point.x, point.y, point.z);
      corners.push(cx * size, cy * size);
    }
    index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    sprite.removeFromParent();
  });
  kit.night.halos = kit.night.halos.filter((sprite) => !still.includes(sprite));
  const geometry = new THREE.BufferGeometry();
  // "position" é o centro (pro frustum culling funcionar), "corner" abre o cartão
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(centers, 3));
  geometry.setAttribute('corner', new THREE.Float32BufferAttribute(corners, 2));
  geometry.setIndex(index);
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    { map: { value: kit.night.halo.map }, opacity: { value: 0 } },
  ]);
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
    vertexShader: /* glsl */ `
      attribute vec2 corner;
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        mvPosition.xy += corner;
        vUv = corner / max(abs(corner.x) * 2.0, 0.0001) + 0.5;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float opacity;
      varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        vec4 tex = texture2D(map, vUv);
        float fade = 1.0;
        #ifdef USE_FOG
          fade = 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
        #endif
        gl_FragColor = vec4(tex.rgb, tex.a * opacity * fade);
        #include <colorspace_fragment>
      }
    `,
  });
  const halos = new THREE.Mesh(geometry, material);
  halos.frustumCulled = false;
  halos.renderOrder = 4;
  kit.scene.add(halos);
  kit.night.hooks.push(() => {
    uniforms.opacity.value = kit.night.halo.opacity;
    halos.visible = kit.night.halo.opacity > 0.01;
  });
};

/** Malha instanciada a partir de um modelinho (só peças foscas e lisas). */
export const instancedFrom = (template: THREE.Object3D, count: number) => {
  const flat = flatten(template);
  const part = flat.children[0] as THREE.Mesh;
  const instanced = new THREE.InstancedMesh(part.geometry, part.material, count);
  instanced.frustumCulled = false;
  return instanced;
};

/* ------------------------------------------------------ malha estática */

/** Um material só pra tudo que é fosco e liso: a cor vai em cada vértice. */
const PAINTED = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
/** Todas as lampadinhas coloridas juntas: a cor vai no vértice, o brilho acende de noite. */
const PARTY = new THREE.MeshBasicMaterial({ vertexColors: true, color: '#808080' });

const isPlain = (material: THREE.Material): material is THREE.MeshLambertMaterial =>
  material instanceof THREE.MeshLambertMaterial &&
  !material.map &&
  !material.vertexColors &&
  !material.transparent &&
  material.emissive.getHex() === 0;

const mergeable = (object: THREE.Object3D): object is THREE.Mesh =>
  object instanceof THREE.Mesh &&
  !(object instanceof THREE.InstancedMesh) &&
  !Array.isArray(object.material) &&
  !(object.material as THREE.MeshBasicMaterial).map &&
  object.visible;

/** Copia a geometria já na posição final, pintando os vértices se o material for liso. */
const prepare = (object: THREE.Mesh, matrix: THREE.Matrix4) => {
  const source = object.geometry as THREE.BufferGeometry;
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  Object.keys(geometry.attributes).forEach((name) => {
    if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
  });
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  geometry.clearGroups();
  geometry.applyMatrix4(matrix);
  const material = object.material as THREE.Material;
  const party = material.userData.party as THREE.Color | undefined;
  if (isPlain(material) || party) {
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const { r, g, b } = party ?? (material as THREE.MeshLambertMaterial).color;
    for (let i = 0; i < count; i++) {
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry, material: (party ? PARTY : PAINTED) as THREE.Material };
  }
  return { geometry, material };
};

const flush = (buckets: Map<THREE.Material, THREE.BufferGeometry[]>, parent: THREE.Object3D) => {
  buckets.forEach((list, material) => {
    const geometry = mergeGeometries(list, false);
    list.forEach((g) => g.dispose());
    if (!geometry) return;
    const m = new THREE.Mesh(geometry, material);
    parent.add(m);
  });
};

/**
 * Junta tudo que é estático em pouquíssimas malhas. O sítio tem milhares
 * de peças; assim ele vira poucas chamadas de desenho (fica leve no celular).
 */
export const mergeStatics = (kit: Kit) => {
  const root = kit.statics;
  root.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const merged: THREE.Mesh[] = [];
  const visit = (object: THREE.Object3D) => {
    if (object.userData.live) return;
    if (mergeable(object)) {
      const { geometry, material } = prepare(object, object.matrixWorld);
      const list = buckets.get(material) ?? [];
      list.push(geometry);
      buckets.set(material, list);
      merged.push(object);
    }
    object.children.forEach(visit);
  };
  visit(root);
  merged.forEach((object) => {
    object.removeFromParent();
    if (!SHARED.has(object.geometry)) object.geometry.dispose();
  });
  flush(buckets, kit.scene);
};

/**
 * Junta os pedaços de cada grupo que se mexe (bicho, bugue, boneco): cada
 * grupo vira uma malha só, mas continua podendo girar e andar.
 */
export const bake = (group: THREE.Object3D) => {
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const merged: THREE.Mesh[] = [];
  group.children.forEach((child) => {
    if (mergeable(child) && !child.userData.keep) {
      child.updateMatrix();
      const { geometry, material } = prepare(child, child.matrix);
      const list = buckets.get(material) ?? [];
      list.push(geometry);
      buckets.set(material, list);
      merged.push(child);
    }
  });
  group.children.filter((child) => !mergeable(child) || child.userData.keep).forEach(bake);
  if (merged.length < 2) return;
  merged.forEach((object) => {
    object.removeFromParent();
    if (!SHARED.has(object.geometry)) object.geometry.dispose();
  });
  flush(buckets, group);
};

/** Uma cópia do grupo inteiro numa malha só (versão "de longe", sem animação). */
export const flatten = (group: THREE.Object3D) => {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const matrix = new THREE.Matrix4();
  group.traverse((child) => {
    if (!mergeable(child)) return;
    const { geometry, material } = prepare(child, matrix.multiplyMatrices(inverse, child.matrixWorld));
    const list = buckets.get(material) ?? [];
    list.push(geometry);
    buckets.set(material, list);
  });
  const result = new THREE.Group();
  flush(buckets, result);
  return result;
};

/** Peça que o `bake` deve deixar separada (porque troca de material, some…). */
export const keep = <T extends THREE.Object3D>(object: T) => {
  object.userData.keep = true;
  return object;
};

/* -------------------------------------------------------------- partículas */

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  gravity: number;
  grow: number;
  size: number;
  spin: number;
}

const MAX_PARTICLES = 420;

/** Quadradinhos de fumaça, poeira, respingo e confete: tudo numa malha só. */
export class Particles {
  private active: Particle[] = [];
  private pool: Particle[] = [];
  private mesh: THREE.InstancedMesh;
  private matrix = new THREE.Matrix4();
  private quaternion = new THREE.Quaternion();
  private euler = new THREE.Euler();
  private scale = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(
      BOX,
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false }),
      MAX_PARTICLES,
    );
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    scene.add(this.mesh);
  }

  spawn(
    position: THREE.Vector3 | [number, number, number],
    options: {
      color: string;
      velocity?: [number, number, number];
      size?: number;
      life?: number;
      gravity?: number;
      grow?: number;
      opacity?: number;
    },
  ) {
    if (this.active.length >= MAX_PARTICLES) return;
    const particle = this.pool.pop() ?? {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      color: new THREE.Color(),
      life: 0,
      maxLife: 1,
      gravity: 0,
      grow: 0,
      size: 0.2,
      spin: 0,
    };
    if (Array.isArray(position)) particle.position.set(...position);
    else particle.position.copy(position);
    particle.velocity.set(...(options.velocity ?? [0, 1, 0]));
    particle.color.set(options.color);
    particle.life = particle.maxLife = options.life ?? 1;
    particle.gravity = options.gravity ?? 0;
    particle.grow = options.grow ?? 0;
    particle.size = options.size ?? 0.2;
    particle.spin = Math.random() * 3;
    this.active.push(particle);
  }

  burst(position: [number, number, number], colors: string[], count = 24, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const up = 2 + Math.random() * speed;
      this.spawn(position, {
        color: colors[i % colors.length],
        velocity: [Math.cos(angle) * speed * Math.random(), up, Math.sin(angle) * speed * Math.random()],
        size: 0.12 + Math.random() * 0.12,
        life: 0.9 + Math.random() * 0.6,
        gravity: 9,
      });
    }
  }

  update(dt: number) {
    let n = 0;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const particle = this.active[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        this.active.splice(i, 1);
        this.pool.push(particle);
        continue;
      }
      particle.velocity.y -= particle.gravity * dt;
      particle.position.addScaledVector(particle.velocity, dt);
      particle.spin += dt * 2;
      const k = particle.life / particle.maxLife;
      const size = Math.max(0.01, particle.size * (k + particle.grow * (1 - k)));
      this.quaternion.setFromEuler(this.euler.set(particle.spin, particle.spin * 0.7, 0));
      this.matrix.compose(particle.position, this.quaternion, this.scale.setScalar(size));
      this.mesh.setMatrixAt(n, this.matrix);
      this.mesh.setColorAt(n, particle.color);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

/* --------------------------------------------------------------- colisão */

/** Empurra um círculo pra fora de obstáculos e paredes. Devolve se bateu. */
export const collide = (kit: Kit, position: { x: number; z: number }, radius: number) => {
  let hit = false;
  for (const obstacle of kit.obstacles) {
    const dx = position.x - obstacle.x;
    const dz = position.z - obstacle.z;
    const min = obstacle.r + radius;
    if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
    const distance = Math.hypot(dx, dz);
    if (distance < min && distance > 0.0001) {
      position.x = obstacle.x + (dx / distance) * min;
      position.z = obstacle.z + (dz / distance) * min;
      hit = true;
    }
  }
  for (const wall of kit.walls) {
    const wx = wall.bx - wall.ax;
    const wz = wall.bz - wall.az;
    const length2 = wx * wx + wz * wz || 1;
    const k = Math.max(0, Math.min(1, ((position.x - wall.ax) * wx + (position.z - wall.az) * wz) / length2));
    const cx = wall.ax + wx * k;
    const cz = wall.az + wz * k;
    const dx = position.x - cx;
    const dz = position.z - cz;
    const distance = Math.hypot(dx, dz);
    if (distance < radius) {
      if (distance > 0.0001) {
        position.x = cx + (dx / distance) * radius;
        position.z = cz + (dz / distance) * radius;
      } else {
        // em cima da linha: empurra pela normal da parede
        const n = Math.sqrt(length2);
        position.x = cx - (wz / n) * radius;
        position.z = cz + (wx / n) * radius;
      }
      hit = true;
    }
  }
  return hit;
};
