import * as THREE from 'three';
import { canvasTexture, iconTexture, makeCanvas, makeSignTexture } from './textures';

/** Animação que roda a cada quadro. `t` é o tempo total em segundos. */
export type Tick = (t: number, dt: number) => void;

export interface Obstacle {
  x: number;
  z: number;
  r: number;
}

export interface Kit {
  scene: THREE.Scene;
  ticks: Tick[];
  obstacles: Obstacle[];
  particles: Particles;
  time: { value: number };
}

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

/** Material que brilha sozinho, sem luz (lâmpadas, telas, chamas). */
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

export const box = (
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
) => {
  const mesh = new THREE.Mesh(BOX, material);
  mesh.scale.set(...size);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
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

/** Gerador aleatório com semente: a ilha nasce sempre igual. */
export const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const group = (kit: Kit, x: number, z: number, y = 0) => {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  kit.scene.add(g);
  return g;
};

/* -------------------------------------------------------------- partículas */

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity: number;
  grow: number;
  size: number;
}

/** Pool de quadradinhos: fumaça, faíscas, poeira, confete… */
export class Particles {
  private pool: Particle[] = [];
  private active: Particle[] = [];

  constructor(private scene: THREE.Scene) {}

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
    if (this.active.length > 420) return;
    const particle = this.pool.pop() ?? {
      mesh: new THREE.Mesh(BOX),
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      gravity: 0,
      grow: 0,
      size: 0.2,
    };
    particle.mesh.material = glow(options.color, options.opacity ?? 1);
    if (Array.isArray(position)) particle.mesh.position.set(...position);
    else particle.mesh.position.copy(position);
    particle.velocity.set(...(options.velocity ?? [0, 1, 0]));
    particle.life = particle.maxLife = options.life ?? 1;
    particle.gravity = options.gravity ?? 0;
    particle.grow = options.grow ?? 0;
    particle.size = options.size ?? 0.2;
    particle.mesh.scale.setScalar(particle.size);
    particle.mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    this.scene.add(particle.mesh);
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
    for (let i = this.active.length - 1; i >= 0; i--) {
      const particle = this.active[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        this.active.splice(i, 1);
        this.pool.push(particle);
        continue;
      }
      particle.velocity.y -= particle.gravity * dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      const k = particle.life / particle.maxLife;
      particle.mesh.scale.setScalar(Math.max(0.01, particle.size * (k + particle.grow * (1 - k))));
      particle.mesh.rotation.x += dt * 2;
    }
  }
}

/* ------------------------------------------------------------------ ilha */

/** Raio da praia em cada direção: a ilha não é um círculo perfeito. */
export const islandRadius = (angle: number) => 46 + 3 * Math.sin(3 * angle) + 2 * Math.cos(5 * angle + 1);
export const GRASS_INSET = 6;

const islandShape = (inset: number, steps = 72) => {
  const shape = new THREE.Shape();
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = islandRadius(angle) - inset;
    // O shape vive no plano XY; depois de deitado, y vira -z.
    const x = Math.cos(angle) * r;
    const y = -Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
};

const layDown = (geometry: THREE.BufferGeometry, top: number, depth: number) => {
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, top - depth, 0);
  return geometry;
};

export const buildIsland = (kit: Kit) => {
  const sand = new THREE.ExtrudeGeometry(islandShape(0), { depth: 5, bevelEnabled: false });
  mesh(kit.scene, layDown(sand, -0.06, 5), lambert('#f2cf8d'));

  const grass = new THREE.ExtrudeGeometry(islandShape(GRASS_INSET), { depth: 1, bevelEnabled: false });
  mesh(kit.scene, layDown(grass, 0, 1), lambert('#5fbf5a'));

  // Faixa de grama mais escura colada na areia.
  const edge = new THREE.Shape(islandShape(GRASS_INSET).getPoints());
  edge.holes.push(
    new THREE.Path(
      islandShape(GRASS_INSET + 1.2)
        .getPoints()
        .reverse(),
    ),
  );
  const edgeGeometry = new THREE.ShapeGeometry(edge);
  mesh(kit.scene, layDown(edgeGeometry, 0.012, 0), lambert('#4aa64e'));

  // Espuma das ondas em volta da praia, pulsando.
  const foamShape = new THREE.Shape(islandShape(-1.6).getPoints());
  foamShape.holes.push(new THREE.Path(islandShape(0.6).getPoints().reverse()));
  const foamMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 });
  const foam = mesh(kit.scene, layDown(new THREE.ShapeGeometry(foamShape), -0.32, 0), foamMaterial);
  kit.ticks.push((t) => {
    foamMaterial.opacity = 0.35 + Math.sin(t * 1.6) * 0.2;
    foam.scale.setScalar(1 + Math.sin(t * 1.6) * 0.008);
  });

  // Manchas de grama em tons diferentes, pra quebrar o verde liso.
  const rand = seeded(7);
  const patchGeometry = new THREE.CircleGeometry(1, 6);
  patchGeometry.rotateX(-Math.PI / 2);
  const tones = ['#6fcd62', '#56b352', '#7ad66a', '#4fa94b'];
  tones.forEach((tone, toneIndex) => {
    const patches = new THREE.InstancedMesh(patchGeometry, lambert(tone), 60);
    const matrix = new THREE.Matrix4();
    let count = 0;
    for (let i = 0; i < 400 && count < 60; i++) {
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * (islandRadius(angle) - GRASS_INSET - 2.5);
      const size = 1 + rand() * 2.4;
      matrix.compose(
        new THREE.Vector3(Math.cos(angle) * r, 0.006 + toneIndex * 0.001, Math.sin(angle) * r),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * 6),
        new THREE.Vector3(size, 1, size * (0.6 + rand() * 0.6)),
      );
      patches.setMatrixAt(count++, matrix);
    }
    patches.count = count;
    kit.scene.add(patches);
  });
};

/** Mar com ondas facetadas (o vertex shader mexe a malha). */
export const buildSea = (kit: Kit) => {
  const geometry = new THREE.PlaneGeometry(900, 900, 150, 150);
  const material = new THREE.MeshLambertMaterial({ color: '#2f86b5', flatShading: true });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = kit.time;
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       transformed.z += sin(position.x * 0.3 + uTime * 1.3) * 0.22 + cos(position.y * 0.37 + uTime * 0.9) * 0.2;`,
    );
  };
  const sea = new THREE.Mesh(geometry, material);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.45;
  kit.scene.add(sea);

  // Água rasa, mais clara, em volta da ilha.
  const shallow = new THREE.Shape(islandShape(-7).getPoints());
  shallow.holes.push(new THREE.Path(islandShape(-0.5).getPoints().reverse()));
  const shallowMaterial = new THREE.MeshBasicMaterial({ color: '#7fe0e0', transparent: true, opacity: 0.28 });
  mesh(kit.scene, layDown(new THREE.ShapeGeometry(shallow), -0.36, 0), shallowMaterial);
};

/* ------------------------------------------------------------- vegetação */

export const pine = (kit: Kit, x: number, z: number, scale = 1, phase = 0) => {
  const g = group(kit, x, z);
  g.scale.setScalar(scale);
  mesh(g, new THREE.CylinderGeometry(0.18, 0.26, 1.2, 5), lambert('#7a4b2a'), [0, 0.6, 0]);
  const tones = ['#2f8f5b', '#38a066', '#45b072'];
  tones.forEach((tone, index) => {
    mesh(g, new THREE.ConeGeometry(1.25 - index * 0.3, 1.5, 6), lambert(tone), [0, 1.5 + index * 0.75, 0]);
  });
  kit.obstacles.push({ x, z, r: 0.5 * scale });
  kit.ticks.push((t) => {
    g.rotation.z = Math.sin(t * 1.2 + phase) * 0.03;
  });
};

export const roundTree = (kit: Kit, x: number, z: number, scale = 1, phase = 0, fruit = false) => {
  const g = group(kit, x, z);
  g.scale.setScalar(scale);
  mesh(g, new THREE.CylinderGeometry(0.2, 0.3, 1.6, 5), lambert('#8a5a34'), [0, 0.8, 0]);
  const crown = new THREE.Group();
  crown.position.y = 2.3;
  g.add(crown);
  mesh(crown, new THREE.IcosahedronGeometry(1.25, 0), lambert('#5cbf4f'), [0, 0, 0]);
  mesh(crown, new THREE.IcosahedronGeometry(0.85, 0), lambert('#6fd15c'), [0.7, 0.35, 0.3]);
  mesh(crown, new THREE.IcosahedronGeometry(0.8, 0), lambert('#4daa47'), [-0.6, 0.2, -0.4]);
  if (fruit) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      mesh(crown, new THREE.IcosahedronGeometry(0.14, 0), lambert('#ff5a6e'), [
        Math.cos(a) * 1.05,
        -0.2 + (i % 2) * 0.5,
        Math.sin(a) * 1.05,
      ]);
    }
  }
  kit.obstacles.push({ x, z, r: 0.55 * scale });
  kit.ticks.push((t) => {
    crown.rotation.z = Math.sin(t * 1.1 + phase) * 0.05;
    crown.rotation.x = Math.cos(t * 0.9 + phase) * 0.04;
  });
};

/** Coqueiro de praia, com o tronco curvado em gomos. */
export const palm = (kit: Kit, x: number, z: number, lean = 0, phase = 0) => {
  const g = group(kit, x, z);
  g.rotation.y = lean;
  let y = 0;
  let offset = 0;
  for (let i = 0; i < 6; i++) {
    const segment = mesh(
      g,
      new THREE.CylinderGeometry(0.17, 0.22, 0.75, 6),
      lambert(i % 2 ? '#a8794a' : '#94683d'),
      [offset, y + 0.37, 0],
    );
    segment.rotation.z = -0.08 * i;
    y += 0.7;
    offset += 0.09 * i;
  }
  const crown = new THREE.Group();
  crown.position.set(offset, y + 0.1, 0);
  g.add(crown);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Group();
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    crown.add(leaf);
    const blade = box(leaf, [0.5, 0.06, 2], [0, -0.25, 0.95], lambert(i % 2 ? '#3fae5a' : '#54c066'));
    blade.rotation.x = 0.45;
  }
  mesh(crown, new THREE.IcosahedronGeometry(0.2, 0), lambert('#6b4423'), [0.15, -0.25, 0.1]);
  mesh(crown, new THREE.IcosahedronGeometry(0.2, 0), lambert('#6b4423'), [-0.1, -0.28, -0.15]);
  kit.obstacles.push({ x, z, r: 0.45 });
  kit.ticks.push((t) => {
    crown.rotation.z = Math.sin(t * 1.4 + phase) * 0.08;
    crown.rotation.y = Math.sin(t * 0.6 + phase) * 0.1;
  });
};

export const rock = (kit: Kit, x: number, z: number, scale = 1, color = '#9b98a8', solid = true) => {
  const m = mesh(kit.scene, new THREE.DodecahedronGeometry(0.7, 0), lambert(color), [x, 0.25 * scale, z]);
  m.scale.set(scale, scale * 0.7, scale * 0.9);
  m.rotation.set(scale, scale * 2, 0);
  if (solid) kit.obstacles.push({ x, z, r: 0.6 * scale });
  return m;
};

export const bush = (kit: Kit, x: number, z: number, scale = 1, flowers = false) => {
  const g = group(kit, x, z);
  g.scale.setScalar(scale);
  mesh(g, new THREE.IcosahedronGeometry(0.6, 0), lambert('#3f9a45'), [0, 0.4, 0]);
  mesh(g, new THREE.IcosahedronGeometry(0.45, 0), lambert('#4db04f'), [0.45, 0.32, 0.1]);
  if (flowers) {
    ['#ffd166', '#ff7eb6', '#ffffff'].forEach((color, i) => {
      box(g, [0.12, 0.12, 0.12], [Math.cos(i * 2) * 0.45, 0.7, Math.sin(i * 2) * 0.45], glow(color));
    });
  }
};

/** Florzinhas e tufos de grama espalhados (instanciados, custam quase nada). */
export const scatterFlowers = (kit: Kit, spots: [number, number][]) => {
  const stem = new THREE.BoxGeometry(0.05, 0.3, 0.05);
  stem.translate(0, 0.15, 0);
  const petal = new THREE.BoxGeometry(0.2, 0.08, 0.2);
  petal.translate(0, 0.32, 0);
  const tuft = new THREE.ConeGeometry(0.12, 0.45, 3);
  tuft.translate(0, 0.22, 0);
  const colors = ['#ffd166', '#ff7eb6', '#ffffff', '#c4b5fd', '#ff6b6b'];
  const matrix = new THREE.Matrix4();
  const stems = new THREE.InstancedMesh(stem, lambert('#3c8f3c'), spots.length);
  const petals = new THREE.InstancedMesh(
    petal,
    new THREE.MeshLambertMaterial({ flatShading: true }),
    spots.length,
  );
  const tufts = new THREE.InstancedMesh(tuft, lambert('#3f9e45'), spots.length * 2);
  const color = new THREE.Color();
  spots.forEach(([x, z], i) => {
    matrix.makeTranslation(x, 0, z);
    stems.setMatrixAt(i, matrix);
    petals.setMatrixAt(i, matrix);
    petals.setColorAt(i, color.set(colors[i % colors.length]));
    matrix.makeTranslation(x + 0.5, 0, z - 0.3);
    tufts.setMatrixAt(i * 2, matrix);
    matrix.makeTranslation(x - 0.7, 0, z + 0.4);
    tufts.setMatrixAt(i * 2 + 1, matrix);
  });
  kit.scene.add(stems, petals, tufts);
};

/* --------------------------------------------------------------- caminhos */

/** Trilha de pedrinhas seguindo uma linha. */
export const path = (kit: Kit, points: [number, number][], rand: () => number) => {
  const tiles: THREE.Matrix4[] = [];
  const tileColors: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const length = Math.hypot(bx - ax, bz - az);
    const steps = Math.ceil(length / 0.95);
    for (let s = 0; s < steps; s++) {
      const k = s / steps;
      const x = ax + (bx - ax) * k;
      const z = az + (bz - az) * k;
      const angle = Math.atan2(bx - ax, bz - az);
      for (const side of [-0.55, 0.55]) {
        const ox = Math.cos(angle) * side + (rand() - 0.5) * 0.15;
        const oz = -Math.sin(angle) * side + (rand() - 0.5) * 0.15;
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(x + ox, 0.03, z + oz),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle + (rand() - 0.5) * 0.5),
          new THREE.Vector3(0.95, 1, 0.85),
        );
        tiles.push(m);
        tileColors.push(['#d9c7a3', '#cdb994', '#e3d3b2', '#c2ad86'][Math.floor(rand() * 4)]);
      }
    }
  }
  const geometry = new THREE.BoxGeometry(1, 0.06, 1);
  const instanced = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshLambertMaterial({ flatShading: true }),
    tiles.length,
  );
  const color = new THREE.Color();
  tiles.forEach((m, i) => {
    instanced.setMatrixAt(i, m);
    instanced.setColorAt(i, color.set(tileColors[i]));
  });
  kit.scene.add(instanced);
};

/** Poste de luz que acende no fim de tarde. */
export const lampPost = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  mesh(g, new THREE.CylinderGeometry(0.08, 0.12, 2.6, 6), lambert('#3b3350'), [0, 1.3, 0]);
  box(g, [0.5, 0.08, 0.5], [0, 2.62, 0], lambert('#3b3350'));
  const bulb = box(g, [0.34, 0.4, 0.34], [0, 2.4, 0], glow('#ffe7a3'));
  box(g, [0.55, 0.12, 0.55], [0, 2.7, 0], lambert('#2a2440'));
  kit.obstacles.push({ x, z, r: 0.25 });
  const phase = x * 0.3 + z;
  kit.ticks.push((t) => {
    bulb.scale.y = 0.4 * (0.92 + Math.sin(t * 7 + phase) * 0.04);
  });
};

/* ----------------------------------------------------------- construções */

export const gate = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  for (const side of [-3.2, 3.2]) {
    box(g, [1, 0.5, 1], [side, 0.25, 0], lambert('#8c86a0'));
    box(g, [0.8, 3.6, 0.8], [side, 2, 0], lambert('#b8b2c8'));
    box(g, [1, 0.4, 1], [side, 3.9, 0], lambert('#8c86a0'));
    kit.obstacles.push({ x: x + side, z, r: 0.7 });
    const flagPole = box(g, [0.08, 1.4, 0.08], [side, 4.8, 0], lambert('#3b3350'));
    flagPole.name = 'pole';
    const flag = new THREE.Group();
    flag.position.set(side, 5.3, 0);
    g.add(flag);
    box(flag, [0.9, 0.5, 0.04], [0.45, 0, 0], lambert('#a78bfa', '#7c3aed', 0.4));
    kit.ticks.push((t) => {
      flag.rotation.y = Math.sin(t * 3 + side) * 0.35;
    });
  }
  box(g, [7.6, 0.5, 0.9], [0, 4.35, 0], lambert('#6d4c8f'));
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.1),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture(['ILHA DO DAVID'], { width: 320, bg: '#2a1650', color: '#ffd166' }),
    }),
  );
  sign.position.set(0, 3.55, 0.46);
  g.add(sign);
  const back = sign.clone();
  back.rotation.y = Math.PI;
  back.position.z = -0.46;
  g.add(back);
  // lanterninhas
  for (const side of [-2.2, 0, 2.2]) {
    box(g, [0.04, 0.4, 0.04], [side, 3.9, 0], lambert('#3b3350'));
    const lantern = box(g, [0.3, 0.38, 0.3], [side, 3.0, 0.0], glow('#ffb347'));
    lantern.visible = side !== 0;
    kit.ticks.push((t) => {
      lantern.rotation.z = Math.sin(t * 2 + side) * 0.12;
    });
  }
};

/** Placa de boas-vindas com pernas, virada pro ponto. */
export const welcomeBoard = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  box(g, [0.18, 2.2, 0.18], [-1.2, 1.1, 0], lambert('#6b4423'));
  box(g, [0.18, 2.2, 0.18], [1.2, 1.1, 0], lambert('#6b4423'));
  box(g, [2.9, 1.7, 0.16], [0, 1.75, 0], lambert('#8a5a34'));
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 1.5),
    new THREE.MeshLambertMaterial({
      map: makeSignTexture(['OLÁ, EU SOU', 'O DAVID!', '', 'EXPLORE A ILHA', 'E ACHE OS 12', 'DISQUETES'], {
        width: 220,
      }),
    }),
  );
  board.position.set(0, 1.75, 0.09);
  g.add(board);
  kit.obstacles.push({ x, z, r: 1.2 });
};

export const signpost = (kit: Kit, x: number, z: number, arrows: { text: string; angle: number }[]) => {
  const g = group(kit, x, z);
  mesh(g, new THREE.CylinderGeometry(0.12, 0.14, 3, 6), lambert('#6b4423'), [0, 1.5, 0]);
  arrows.forEach(({ text, angle }, index) => {
    const holder = new THREE.Group();
    holder.position.y = 2.6 - index * 0.5;
    holder.rotation.y = angle;
    g.add(holder);
    const texture = makeSignTexture([text], { width: 200, bg: '#9b6b3e' });
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 1.7), [
      new THREE.MeshLambertMaterial({ map: texture }),
      new THREE.MeshLambertMaterial({ map: texture }),
      lambert('#9b6b3e'),
      lambert('#9b6b3e'),
      lambert('#9b6b3e'),
      lambert('#9b6b3e'),
    ]);
    plank.position.z = 0.75;
    plank.rotation.y = Math.PI / 2;
    holder.add(plank);
    // o "bico" da seta
    const tip = box(holder, [0.27, 0.27, 0.06], [0, 0, 1.65], lambert('#9b6b3e'));
    tip.rotation.z = Math.PI / 4;
    tip.rotation.y = Math.PI / 2;
  });
  kit.obstacles.push({ x, z, r: 0.3 });
};

export const house = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  box(g, [5.2, 0.3, 4.4], [0, 0.15, 0], lambert('#8c86a0'));
  box(g, [4.8, 2.8, 4], [0, 1.7, 0], lambert('#fff1d6'));
  // telhado em duas águas
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-3, 0);
  roofShape.lineTo(3, 0);
  roofShape.lineTo(0, 2.2);
  roofShape.closePath();
  const roofGeometry = new THREE.ExtrudeGeometry(roofShape, { depth: 4.8, bevelEnabled: false });
  roofGeometry.translate(0, 0, -2.4);
  mesh(g, roofGeometry, lambert('#c2485c'), [0, 3.1, 0]);
  // porta, janelas acesas e degrau
  box(g, [1.1, 1.8, 0.1], [0, 1.2, 2.02], lambert('#7a4a2a'));
  box(g, [0.12, 0.12, 0.08], [0.35, 1.2, 2.1], glow('#ffd166'));
  box(g, [1.6, 0.2, 0.8], [0, 0.35, 2.4], lambert('#a9a3b8'));
  for (const side of [-1.6, 1.6]) {
    box(g, [0.95, 0.85, 0.08], [side, 1.9, 2.02], glow('#ffd88a'));
    box(g, [1.15, 0.12, 0.12], [side, 1.42, 2.06], lambert('#ffffff'));
    box(g, [0.06, 0.85, 0.1], [side, 1.9, 2.07], lambert('#7a4a2a'));
  }
  box(g, [0.08, 0.8, 0.9], [2.42, 1.9, 0], glow('#ffd88a'));
  // chaminé com fumaça
  box(g, [0.6, 1.6, 0.6], [1.4, 4.2, -0.8], lambert('#8c4a3c'));
  const chimney = new THREE.Vector3(1.4, 5.1, -0.8);
  g.updateMatrixWorld();
  g.localToWorld(chimney);
  let next = 0;
  kit.ticks.push((t) => {
    if (t < next) return;
    next = t + 0.35;
    kit.particles.spawn(chimney, {
      color: '#e8e4f0',
      velocity: [0.3 + Math.random() * 0.2, 1.1, Math.random() * 0.2],
      size: 0.35,
      grow: 2.2,
      life: 2.6,
      opacity: 0.85,
    });
  });
  // jardim na frente
  for (const side of [-2.1, 2.1]) {
    box(g, [0.8, 0.35, 0.5], [side, 0.18, 2.6], lambert('#7a4a2a'));
    for (let i = 0; i < 3; i++) {
      box(
        g,
        [0.15, 0.15, 0.15],
        [side - 0.25 + i * 0.25, 0.48, 2.6],
        glow(['#ff7eb6', '#ffd166', '#c4b5fd'][i]),
      );
    }
  }
  kit.obstacles.push({ x, z, r: 2.9 });
  // os cantos também barram
  const corners = [
    [-2, -1.6],
    [2, -1.6],
    [-2, 1.6],
    [2, 1.6],
  ];
  corners.forEach(([cx, cz]) => {
    const p = new THREE.Vector3(cx, 0, cz);
    g.localToWorld(p);
    kit.obstacles.push({ x: p.x, z: p.z, r: 0.8 });
  });
};

export const mailbox = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  box(g, [0.16, 1.1, 0.16], [0, 0.55, 0], lambert('#6b4423'));
  box(g, [0.55, 0.5, 0.85], [0, 1.3, 0], lambert('#e0424f'));
  mesh(
    g,
    new THREE.CylinderGeometry(0.275, 0.275, 0.85, 8, 1, false, 0, Math.PI),
    lambert('#e0424f'),
    [0, 1.55, 0],
  ).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  box(g, [0.5, 0.06, 0.02], [0, 1.4, 0.43], lambert('#ffffff'));
  const flag = new THREE.Group();
  flag.position.set(0.3, 1.3, -0.1);
  g.add(flag);
  box(flag, [0.04, 0.6, 0.06], [0, 0.3, 0], lambert('#ffd166'));
  box(flag, [0.04, 0.2, 0.25], [0, 0.55, 0.12], lambert('#ffd166'));
  flag.rotation.x = 1.4;
  kit.obstacles.push({ x, z, r: 0.5 });
  let target = 1.4;
  kit.ticks.push((_, dt) => {
    flag.rotation.x += (target - flag.rotation.x) * Math.min(1, dt * 4);
  });
  return () => {
    target = 0;
  };
};

export const campfire = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    mesh(g, new THREE.DodecahedronGeometry(0.22, 0), lambert('#8f8a9e'), [
      Math.cos(a) * 0.8,
      0.12,
      Math.sin(a) * 0.8,
    ]);
  }
  for (let i = 0; i < 3; i++) {
    const log = box(g, [1.1, 0.18, 0.18], [0, 0.15, 0], lambert('#6b4423'));
    log.rotation.y = (i / 3) * Math.PI;
  }
  const flames = [
    { color: '#ff6b35', size: 0.42, h: 1.0 },
    { color: '#ffb347', size: 0.3, h: 0.8 },
    { color: '#fff1a8', size: 0.16, h: 0.5 },
  ].map(({ color, size, h }) => {
    const flame = mesh(g, new THREE.ConeGeometry(size, h, 5), glow(color), [0, 0.2 + h / 2, 0]);
    return flame;
  });
  const light = new THREE.PointLight('#ff8a3d', 6, 9, 1.6);
  light.position.set(0, 1.2, 0);
  g.add(light);
  // troncos pra sentar
  for (const a of [0.6, 2.4, 4.2]) {
    const seat = mesh(g, new THREE.CylinderGeometry(0.25, 0.25, 1.4, 6), lambert('#8a5a34'), [
      Math.cos(a) * 2,
      0.25,
      Math.sin(a) * 2,
    ]);
    seat.rotation.set(0, -a, Math.PI / 2);
    kit.obstacles.push({ x: x + Math.cos(a) * 2, z: z + Math.sin(a) * 2, r: 0.6 });
  }
  kit.obstacles.push({ x, z, r: 1 });
  let next = 0;
  kit.ticks.push((t) => {
    flames.forEach((flame, i) => {
      flame.scale.set(1 + Math.sin(t * 13 + i) * 0.12, 1 + Math.sin(t * 9 + i * 2) * 0.22, 1);
      flame.rotation.y = t * (1 + i);
    });
    light.intensity = 5 + Math.sin(t * 11) * 1.2 + Math.sin(t * 23) * 0.6;
    if (t > next) {
      next = t + 0.12;
      kit.particles.spawn([x + (Math.random() - 0.5) * 0.4, 0.9, z + (Math.random() - 0.5) * 0.4], {
        color: Math.random() > 0.5 ? '#ffb347' : '#ff6b35',
        velocity: [(Math.random() - 0.5) * 0.6, 1.6 + Math.random(), (Math.random() - 0.5) * 0.6],
        size: 0.09,
        life: 1.2,
      });
    }
  });
};

export const fountain = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  mesh(g, new THREE.CylinderGeometry(5, 5, 0.08, 16), lambert('#cfc6dc'), [0, 0.04, 0]);
  mesh(g, new THREE.CylinderGeometry(4.2, 4.2, 0.1, 16), lambert('#bdb3cc'), [0, 0.06, 0]);
  mesh(g, new THREE.CylinderGeometry(2.3, 2.4, 0.7, 12), lambert('#a69cbb'), [0, 0.35, 0]);
  mesh(g, new THREE.CylinderGeometry(2.0, 2.0, 0.1, 12), glow('#5ec8f2'), [0, 0.62, 0]);
  mesh(g, new THREE.CylinderGeometry(0.3, 0.4, 1.6, 8), lambert('#a69cbb'), [0, 1.2, 0]);
  mesh(g, new THREE.CylinderGeometry(0.9, 0.4, 0.35, 10), lambert('#a69cbb'), [0, 2.0, 0]);
  mesh(g, new THREE.CylinderGeometry(0.75, 0.75, 0.06, 10), glow('#7fd8ff'), [0, 2.16, 0]);
  kit.obstacles.push({ x, z, r: 2.5 });
  let next = 0;
  kit.ticks.push((t) => {
    if (t < next) return;
    next = t + 0.04;
    const a = Math.random() * Math.PI * 2;
    kit.particles.spawn([x, 2.3, z], {
      color: Math.random() > 0.3 ? '#9be7ff' : '#ffffff',
      velocity: [Math.cos(a) * 1.3, 3 + Math.random(), Math.sin(a) * 1.3],
      size: 0.12,
      life: 0.95,
      gravity: 9,
    });
  });
};

/** Telão do drive-in com o print do projeto e lampadinhas piscando. */
export const billboard = (kit: Kit, x: number, z: number, faceX: number, faceZ: number, image?: string) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  for (const side of [-1.9, 1.9]) {
    box(g, [0.25, 2.2, 0.25], [side, 1.1, -0.1], lambert('#3b3350'));
    kit.obstacles.push({
      x: x + Math.cos(-g.rotation.y) * side,
      z: z + Math.sin(-g.rotation.y) * side,
      r: 0.4,
    });
  }
  box(g, [4.6, 3.0, 0.25], [0, 3.3, -0.12], lambert('#241a38'));
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.6),
    image
      ? new THREE.MeshBasicMaterial({
          map: (() => {
            const texture = new THREE.TextureLoader().load(image);
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture;
          })(),
        })
      : glow('#3b2a5c'),
  );
  screen.position.set(0, 3.3, 0.02);
  g.add(screen);
  // lâmpadas do letreiro, acendendo em sequência
  const bulbs: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    bulbs.push(box(g, [0.16, 0.16, 0.16], [-2.2 + i * 0.4, 4.9, 0], glow('#ffd166')));
  }
  const dim = glow('#6b5a2e');
  const lit = glow('#ffd166');
  const phase = x + z;
  kit.ticks.push((t) => {
    const step = Math.floor(t * 6 + phase);
    bulbs.forEach((bulb, i) => {
      bulb.material = (i + step) % 3 === 0 ? lit : dim;
    });
  });
};

/** Fliperama do Flappy Bird, com a tela animada de verdade. */
export const arcade = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  box(g, [1.6, 2.6, 1.2], [0, 1.3, 0], lambert('#5b2bb5'));
  box(g, [1.7, 0.1, 1.3], [0, 2.62, 0], lambert('#2a1650'));
  box(g, [1.62, 0.5, 0.3], [0, 2.85, 0.4], glow('#ff7eb6'));
  box(g, [1.6, 0.15, 0.7], [0, 1.15, 0.85], lambert('#2a1650'));
  box(g, [0.08, 0.3, 0.08], [-0.35, 1.35, 0.85], lambert('#222'));
  box(g, [0.18, 0.18, 0.18], [-0.35, 1.52, 0.85], glow('#ff4d6d'));
  box(g, [0.16, 0.06, 0.16], [0.15, 1.25, 0.85], glow('#ffd166'));
  box(g, [0.16, 0.06, 0.16], [0.45, 1.25, 0.95], glow('#5ec8f2'));
  const { canvas, ctx } = makeCanvas(64, 48);
  const texture = canvasTexture(canvas);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.98),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  screen.position.set(0, 1.95, 0.61);
  screen.rotation.x = -0.18;
  g.add(screen);
  // marquise escrita
  const marquee = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.42),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture(['FLAPPY'], { width: 120, bg: '#ff7eb6', color: '#2a1650' }),
    }),
  );
  marquee.position.set(0, 2.85, 0.56);
  g.add(marquee);
  kit.obstacles.push({ x, z, r: 1 });
  let next = 0;
  let birdY = 24;
  let velocity = 0;
  kit.ticks.push((t) => {
    if (t < next) return;
    next = t + 1 / 15;
    const scroll = (t * 30) % 40;
    ctx.fillStyle = '#4ec0ca';
    ctx.fillRect(0, 0, 64, 48);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(((-t * 6) % 80) + 70, 8, 10, 3);
    ctx.fillStyle = '#5ee26b';
    for (let i = 0; i < 3; i++) {
      const px = i * 40 - scroll + 20;
      const gap = 14 + ((i * 11 + Math.floor((t * 30) / 40)) % 3) * 6;
      ctx.fillRect(px, 0, 8, gap);
      ctx.fillRect(px, gap + 16, 8, 48);
    }
    velocity += 0.6;
    birdY += velocity;
    if (birdY > 30) velocity = -3.4;
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(18, birdY, 6, 5);
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(24, birdY + 2, 2, 2);
    ctx.fillStyle = '#d7b46a';
    ctx.fillRect(0, 42, 64, 6);
    texture.needsUpdate = true;
  });
};

export const gallerySign = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  box(g, [0.2, 2.4, 0.2], [-1.4, 1.2, 0], lambert('#3b3350'));
  box(g, [0.2, 2.4, 0.2], [1.4, 1.2, 0], lambert('#3b3350'));
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.1),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture(['GALERIA DE', 'PROJETOS'], { width: 220, bg: '#2a1650', color: '#c4b5fd' }),
      side: THREE.DoubleSide,
    }),
  );
  sign.position.y = 2.4;
  g.add(sign);
  kit.obstacles.push({ x, z, r: 1.2 });
  kit.ticks.push((t) => {
    sign.position.y = 2.4 + Math.sin(t * 2) * 0.05;
  });
};

/** A árvore do GitHub: bolinhas ligadas e um gráfico de commits no chão. */
export const githubTree = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  mesh(g, new THREE.CylinderGeometry(0.6, 1.1, 5, 7), lambert('#6b4423'), [0, 2.5, 0]);
  for (let i = 0; i < 4; i++) {
    const branch = mesh(g, new THREE.CylinderGeometry(0.15, 0.3, 2.6, 5), lambert('#6b4423'), [0, 4.6, 0]);
    branch.rotation.set(0.7, (i / 4) * Math.PI * 2, 0, 'YXZ');
    branch.position.set(Math.sin((i / 4) * Math.PI * 2) * 0.8, 5.3, Math.cos((i / 4) * Math.PI * 2) * 0.8);
  }
  // raízes
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const root = box(g, [0.35, 0.3, 1.4], [Math.sin(a) * 1.2, 0.15, Math.cos(a) * 1.2], lambert('#5a3a20'));
    root.rotation.y = a;
  }
  const rand = seeded(42);
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2;
    const r = 1.2 + rand() * 2.8;
    nodes.push(new THREE.Vector3(Math.cos(a) * r, 5.4 + rand() * 3.2, Math.sin(a) * r));
  }
  const positions: number[] = [];
  nodes.forEach((node, i) => {
    const near = nodes
      .map((other, j) => ({ j, d: other.distanceTo(node) }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    near.forEach(({ j }) => positions.push(node.x, node.y, node.z, nodes[j].x, nodes[j].y, nodes[j].z));
  });
  const lines = new THREE.BufferGeometry();
  lines.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.add(
    new THREE.LineSegments(
      lines,
      new THREE.LineBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.7 }),
    ),
  );
  const orbColors = ['#a78bfa', '#7c3aed', '#5ee26b', '#c4b5fd', '#39d353'];
  const orbs = nodes.map((node, i) =>
    mesh(g, new THREE.IcosahedronGeometry(0.28 + (i % 3) * 0.1, 0), glow(orbColors[i % orbColors.length]), [
      node.x,
      node.y,
      node.z,
    ]),
  );
  kit.obstacles.push({ x, z, r: 1.5 });

  // gráfico de contribuições no chão
  const cols = 22;
  const rows = 7;
  const tile = new THREE.BoxGeometry(0.46, 0.06, 0.46);
  const grid = new THREE.InstancedMesh(
    tile,
    new THREE.MeshLambertMaterial({ flatShading: true }),
    cols * rows,
  );
  const matrix = new THREE.Matrix4();
  const levels = ['#2b2440', '#0e4429', '#006d32', '#26a641', '#39d353'];
  const base: number[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const i = c * rows + r;
      matrix.makeTranslation(x - 5.6 + c * 0.55, 0.05, z + 5.5 + r * 0.55);
      grid.setMatrixAt(i, matrix);
      base.push(Math.floor(rand() * rand() * 5));
    }
  }
  const color = new THREE.Color();
  kit.scene.add(grid);
  let next = 0;
  kit.ticks.push((t) => {
    orbs.forEach((orb, i) => orb.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.18));
    if (t < next) return;
    next = t + 0.12;
    const wave = (t * 5) % (cols + 8);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const i = c * rows + r;
        const boost = Math.abs(c - wave) < 1.2 ? 2 : 0;
        grid.setColorAt(i, color.set(levels[Math.min(4, base[i] + boost)]));
      }
    }
    grid.instanceColor!.needsUpdate = true;
  });
};

/** Torre da stack: andares em roxo e os cubos das tecnologias orbitando. */
export const stackTower = (kit: Kit, x: number, z: number, icons: string[]) => {
  const g = group(kit, x, z);
  const tiers = [
    [4, 1.2, '#4c2a85'],
    [3.4, 1.6, '#2a1650'],
    [2.9, 1.6, '#5b2bb5'],
    [2.4, 1.6, '#2a1650'],
    [1.9, 1.4, '#7c3aed'],
  ] as const;
  let y = 0;
  tiers.forEach(([w, h, color], index) => {
    box(g, [w, h, w], [0, y + h / 2, 0], lambert(color));
    if (index > 0) {
      for (let side = 0; side < 4; side++) {
        const win = box(
          g,
          [w * 0.5, 0.25, 0.05],
          [0, y + h / 2, w / 2 + 0.01],
          glow(index % 2 ? '#c4b5fd' : '#ffd166'),
        );
        const holder = new THREE.Group();
        holder.rotation.y = (side * Math.PI) / 2;
        g.add(holder);
        holder.add(win);
      }
    }
    y += h;
  });
  box(g, [0.1, 2, 0.1], [0, y + 1, 0], lambert('#3b3350'));
  const beacon = box(g, [0.3, 0.3, 0.3], [0, y + 2.1, 0], glow('#ff4d6d'));
  kit.obstacles.push({ x, z, r: 2.6 });

  const ring = new THREE.Group();
  ring.position.set(x, 0, z);
  kit.scene.add(ring);
  const cubes = icons.map((icon, i) => {
    const material = new THREE.MeshBasicMaterial({ map: iconTexture(icon) });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), material);
    const a = (i / icons.length) * Math.PI * 2;
    cube.position.set(Math.cos(a) * 4.3, 2 + (i % 3) * 1.6, Math.sin(a) * 4.3);
    ring.add(cube);
    return cube;
  });
  kit.ticks.push((t) => {
    ring.rotation.y = t * 0.35;
    cubes.forEach((cube, i) => {
      cube.rotation.x = t * 0.8 + i;
      cube.rotation.y = t * 1.1 + i;
      cube.position.y = 2 + (i % 3) * 1.6 + Math.sin(t * 2 + i) * 0.25;
    });
    beacon.visible = Math.sin(t * 5) > -0.3;
  });
};

export const coffeeKiosk = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  box(g, [3.2, 1.2, 1.8], [0, 0.6, 0], lambert('#8a5a34'));
  box(g, [3.4, 0.12, 2], [0, 1.26, 0], lambert('#f4e3c1'));
  for (const sx of [-1.5, 1.5]) box(g, [0.14, 1.6, 0.14], [sx, 2.1, 0.8], lambert('#6b4423'));
  box(g, [3.2, 2.2, 0.2], [0, 2.1, -0.9], lambert('#6b4423'));
  // toldo listrado
  for (let i = 0; i < 8; i++) {
    const stripe = box(
      g,
      [0.45, 0.1, 2.2],
      [-1.58 + i * 0.45, 3.0, 0.2],
      lambert(i % 2 ? '#ffffff' : '#ff7eb6'),
    );
    stripe.rotation.x = 0.22;
  }
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.5),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture(['CAFÉ'], { width: 120, bg: '#2a1650', color: '#ffd166' }),
    }),
  );
  sign.position.set(0, 3.45, -0.6);
  g.add(sign);
  // xícara gigante no telhado
  const cup = new THREE.Group();
  cup.position.set(0, 3.6, -0.6);
  g.add(cup);
  mesh(cup, new THREE.CylinderGeometry(0.55, 0.42, 0.8, 10), lambert('#ffffff'), [0, 0.6, 0]);
  mesh(cup, new THREE.CylinderGeometry(0.5, 0.5, 0.05, 10), lambert('#6b3a1f'), [0, 0.98, 0]);
  const handle = mesh(cup, new THREE.TorusGeometry(0.22, 0.07, 5, 8), lambert('#ffffff'), [0.6, 0.62, 0]);
  handle.rotation.y = 0;
  // banquinhos e xícaras no balcão
  for (const sx of [-1, 0, 1]) {
    mesh(g, new THREE.CylinderGeometry(0.25, 0.25, 0.12, 8), lambert('#ff7eb6'), [sx, 0.75, 1.5]);
    mesh(g, new THREE.CylinderGeometry(0.06, 0.06, 0.7, 5), lambert('#3b3350'), [sx, 0.35, 1.5]);
    mesh(g, new THREE.CylinderGeometry(0.1, 0.08, 0.16, 6), lambert('#ffffff'), [sx * 0.9, 1.4, 0.3]);
  }
  kit.obstacles.push({ x, z, r: 1.8 });
  const steam = new THREE.Vector3(0, 4.7, -0.6);
  g.updateMatrixWorld();
  g.localToWorld(steam);
  let next = 0;
  kit.ticks.push((t) => {
    cup.rotation.y = Math.sin(t * 0.8) * 0.3;
    if (t < next) return;
    next = t + 0.25;
    kit.particles.spawn(
      [steam.x + (Math.random() - 0.5) * 0.4, steam.y, steam.z + (Math.random() - 0.5) * 0.4],
      {
        color: '#ffffff',
        velocity: [0, 0.9, 0],
        size: 0.18,
        grow: 1.8,
        life: 1.6,
        opacity: 0.8,
      },
    );
  });
};

export const lighthouse = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    rock(kit, x + Math.cos(a) * 2.2, z + Math.sin(a) * 2.2, 1.2 + (i % 2) * 0.5, '#8a8698', false);
  }
  let y = 0.2;
  for (let i = 0; i < 6; i++) {
    const bottom = 1.6 - i * 0.14;
    const top = bottom - 0.14;
    mesh(g, new THREE.CylinderGeometry(top, bottom, 1.4, 8), lambert(i % 2 ? '#ffffff' : '#e0424f'), [
      0,
      y + 0.7,
      0,
    ]);
    y += 1.4;
  }
  mesh(g, new THREE.CylinderGeometry(1.3, 1.3, 0.2, 8), lambert('#2a2440'), [0, y + 0.1, 0]);
  const lamp = mesh(g, new THREE.CylinderGeometry(0.75, 0.75, 1.1, 8), glow('#fff1a8'), [0, y + 0.75, 0]);
  mesh(g, new THREE.ConeGeometry(1.1, 1.0, 8), lambert('#e0424f'), [0, y + 1.8, 0]);
  const beam = new THREE.Group();
  beam.position.set(0, y + 0.75, 0);
  g.add(beam);
  const cone = new THREE.ConeGeometry(2.2, 22, 12, 1, true);
  cone.translate(0, -11, 0);
  cone.rotateZ(Math.PI / 2);
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: '#fff1a8',
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  beam.add(new THREE.Mesh(cone, beamMaterial));
  const back = new THREE.Mesh(cone, beamMaterial);
  back.rotation.y = Math.PI;
  beam.add(back);
  kit.obstacles.push({ x, z, r: 2.4 });
  kit.ticks.push((t) => {
    beam.rotation.y = t * 0.9;
    lamp.scale.setScalar(1 + Math.sin(t * 6) * 0.04);
  });
};

/** Baú do tesouro: abre a tampa quando a pessoa chega. */
export const chest = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
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
  kit.obstacles.push({ x, z, r: 1 });
  let open = false;
  let next = 0;
  kit.ticks.push((t, dt) => {
    const target = open ? -1.9 : 0;
    lid.rotation.x += (target - lid.rotation.x) * Math.min(1, dt * 3);
    if (open && t > next) {
      next = t + 0.15;
      kit.particles.spawn([x + (Math.random() - 0.5), 1.1, z + (Math.random() - 0.5)], {
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
  };
};

export const windmill = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  faceTo(g, faceX, faceZ);
  mesh(g, new THREE.CylinderGeometry(1.0, 1.6, 5.5, 8), lambert('#f4ead8'), [0, 2.75, 0]);
  mesh(g, new THREE.ConeGeometry(1.4, 1.6, 8), lambert('#c2485c'), [0, 6.3, 0]);
  box(g, [0.8, 1.4, 0.1], [0, 0.7, 1.45], lambert('#7a4a2a'));
  box(g, [0.5, 0.5, 0.1], [0, 3.6, 1.2], glow('#ffd88a'));
  const hub = new THREE.Group();
  hub.position.set(0, 5.2, 1.3);
  g.add(hub);
  box(hub, [0.4, 0.4, 0.4], [0, 0, 0], lambert('#6b4423'));
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    hub.add(arm);
    box(arm, [0.14, 3.4, 0.08], [0, 1.8, 0], lambert('#6b4423'));
    box(arm, [0.7, 2.6, 0.04], [0.42, 2.0, 0.02], lambert('#fff7e6'));
  }
  kit.obstacles.push({ x, z, r: 1.8 });
  kit.ticks.push((t) => {
    hub.rotation.z = -t * 1.4;
  });
};

/** Hortinha ao lado do moinho. */
export const farm = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  for (let row = 0; row < 4; row++) {
    box(g, [5, 0.18, 0.8], [0, 0.09, row * 1.2], lambert('#7a4a2a'));
    for (let i = 0; i < 6; i++) {
      const crop = row % 2 ? '#ff8c42' : '#5ee26b';
      if (row % 2) {
        mesh(g, new THREE.IcosahedronGeometry(0.28, 0), lambert(crop), [-2 + i * 0.8, 0.35, row * 1.2]);
      } else {
        mesh(g, new THREE.ConeGeometry(0.2, 0.6, 4), lambert(crop), [-2 + i * 0.8, 0.45, row * 1.2]);
      }
    }
  }
  kit.obstacles.push({ x, z: z + 1.8, r: 2.6 });
  // cerquinha
  for (let i = 0; i < 8; i++) {
    box(g, [0.12, 0.8, 0.12], [-3 + i * 0.85, 0.4, -0.9], lambert('#f4ead8'));
  }
  box(g, [6.2, 0.1, 0.06], [-0.05, 0.6, -0.9], lambert('#f4ead8'));
  // espantalho
  const scarecrow = new THREE.Group();
  scarecrow.position.set(2.9, 0, 2);
  g.add(scarecrow);
  box(scarecrow, [0.12, 2, 0.12], [0, 1, 0], lambert('#6b4423'));
  box(scarecrow, [1.4, 0.12, 0.12], [0, 1.5, 0], lambert('#6b4423'));
  box(scarecrow, [0.6, 0.7, 0.35], [0, 1.4, 0], lambert('#5b8def'));
  box(scarecrow, [0.45, 0.45, 0.45], [0, 2.1, 0], lambert('#f4d58d'));
  mesh(scarecrow, new THREE.ConeGeometry(0.45, 0.4, 6), lambert('#d9a441'), [0, 2.5, 0]);
  kit.ticks.push((t) => {
    scarecrow.rotation.z = Math.sin(t * 1.5) * 0.05;
  });
};

export const pier = (kit: Kit, x: number, z: number, length: number) => {
  const g = group(kit, x, z);
  for (let i = 0; i < length / 0.5; i++) {
    box(g, [2.4, 0.15, 0.42], [0, 0.05, i * 0.5], lambert(i % 2 ? '#a8794a' : '#94683d'));
  }
  for (let i = 0; i <= length; i += 3) {
    for (const side of [-1.2, 1.2]) {
      mesh(g, new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6), lambert('#6b4423'), [side, -0.6, i]);
    }
  }
  for (const side of [-1.15, 1.15]) {
    lampPost(kit, x + side, z + length - 0.5);
  }
  // barquinho balançando
  const boat = new THREE.Group();
  boat.position.set(x + 3, -0.3, z + length - 3);
  kit.scene.add(boat);
  const hull = new THREE.Shape();
  hull.moveTo(-1.6, 0.5);
  hull.lineTo(1.6, 0.5);
  hull.lineTo(1.1, -0.2);
  hull.lineTo(-1.1, -0.2);
  hull.closePath();
  const hullGeometry = new THREE.ExtrudeGeometry(hull, { depth: 1.2, bevelEnabled: false });
  hullGeometry.translate(0, 0, -0.6);
  hullGeometry.rotateY(Math.PI / 2);
  mesh(boat, hullGeometry, lambert('#e0424f'));
  box(boat, [1.0, 0.08, 2.9], [0, 0.48, 0], lambert('#f4ead8'));
  box(boat, [0.08, 2.2, 0.08], [0, 1.6, 0], lambert('#6b4423'));
  const sail = new THREE.Shape();
  sail.moveTo(0, 0);
  sail.lineTo(0, 1.8);
  sail.lineTo(1.2, 0);
  sail.closePath();
  const sailMesh = mesh(
    boat,
    new THREE.ShapeGeometry(sail),
    new THREE.MeshLambertMaterial({ color: '#fff7e6', side: THREE.DoubleSide, flatShading: true }),
    [0, 0.7, 0.05],
  );
  sailMesh.rotation.y = Math.PI / 2;
  kit.ticks.push((t) => {
    boat.position.y = -0.3 + Math.sin(t * 1.5) * 0.12;
    boat.rotation.z = Math.sin(t * 1.2) * 0.06;
    boat.rotation.x = Math.cos(t * 1.1) * 0.04;
  });
};

/* ------------------------------------------------- marcos e sinalizadores */

const KIND_COLOR: Record<string, string> = {
  trabalho: '#a78bfa',
  estudo: '#5ec8f2',
  evento: '#ff7eb6',
  inicio: '#5ee26b',
};

export const milestonePillar = (kit: Kit, x: number, z: number, kind: string) => {
  const g = group(kit, x, z);
  mesh(g, new THREE.CylinderGeometry(0.55, 0.7, 0.3, 6), lambert('#8c86a0'), [0, 0.15, 0]);
  mesh(g, new THREE.CylinderGeometry(0.35, 0.45, 1.2, 6), lambert('#b8b2c8'), [0, 0.9, 0]);
  mesh(g, new THREE.CylinderGeometry(0.55, 0.45, 0.2, 6), lambert('#8c86a0'), [0, 1.6, 0]);
  const color = KIND_COLOR[kind] ?? '#a78bfa';
  const crystal = mesh(g, new THREE.OctahedronGeometry(0.4, 0), glow(color), [0, 2.4, 0]);
  crystal.scale.y = 1.5;
  kit.obstacles.push({ x, z, r: 0.6 });
  const phase = x + z;
  let lit = false;
  kit.ticks.push((t) => {
    crystal.rotation.y = t * (lit ? 3 : 1.2) + phase;
    crystal.position.y = 2.4 + Math.sin(t * 2 + phase) * 0.15;
  });
  return () => {
    lit = true;
    crystal.material = glow('#ffd166');
    kit.particles.burst([x, 2.4, z], [color, '#ffd166', '#ffffff'], 18, 3);
  };
};

/** Losango roxo que gira em cima de cada estação; fica dourado depois de visitada. */
export const beacon = (kit: Kit, x: number, z: number, height: number, spotX: number, spotZ: number) => {
  const gem = mesh(kit.scene, new THREE.OctahedronGeometry(0.45, 0), glow('#a78bfa'), [x, height, z]);
  gem.scale.y = 1.4;
  const ringGeometry = new THREE.RingGeometry(0.95, 1.2, 20);
  ringGeometry.rotateX(-Math.PI / 2);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: '#a78bfa',
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const ring = mesh(kit.scene, ringGeometry, ringMaterial, [spotX, 0.07, spotZ]);
  const phase = x * 0.7 + z;
  let visited = false;
  kit.ticks.push((t) => {
    gem.rotation.y = t * 1.6 + phase;
    gem.position.y = height + Math.sin(t * 2.2 + phase) * 0.25;
    const pulse = (Math.sin(t * 3 + phase) + 1) / 2;
    ring.scale.setScalar(1 + pulse * 0.15);
    ringMaterial.opacity = visited ? 0.35 : 0.45 + pulse * 0.45;
  });
  return () => {
    if (visited) return;
    visited = true;
    gem.material = glow('#ffd166');
    ringMaterial.color.set('#5ee26b');
    kit.particles.burst([x, height, z], ['#a78bfa', '#ffd166', '#ffffff'], 20, 3);
  };
};

/** Disquete colecionável. */
export const floppy = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z, 0.9);
  box(g, [0.7, 0.7, 0.08], [0, 0, 0], lambert('#3b2f8f', '#2a1f70', 0.6));
  box(g, [0.5, 0.3, 0.09], [0, 0.12, 0.005], lambert('#ffffff'));
  box(g, [0.36, 0.22, 0.09], [0.04, -0.22, 0.005], lambert('#c9c5d6'));
  box(g, [0.1, 0.16, 0.1], [0.12, -0.22, 0.01], lambert('#3b2f8f'));
  const shadowGeometry = new THREE.CircleGeometry(0.35, 8);
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadow = mesh(
    kit.scene,
    shadowGeometry,
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.25, depthWrite: false }),
    [x, 0.06, z],
  );
  const phase = x + z;
  let state: 'idle' | 'collecting' | 'gone' = 'idle';
  let timer = 0;
  kit.ticks.push((t, dt) => {
    if (state === 'gone') return;
    if (state === 'collecting') {
      timer += dt;
      g.position.y += dt * 6;
      g.rotation.y += dt * 20;
      g.scale.setScalar(Math.max(0.01, 1 - timer * 1.6));
      if (timer > 0.6) {
        state = 'gone';
        g.visible = false;
        shadow.visible = false;
      }
      return;
    }
    g.rotation.y = t * 2 + phase;
    g.position.y = 0.9 + Math.sin(t * 3 + phase) * 0.18;
  });
  return {
    collect: (silent = false) => {
      if (state !== 'idle') return;
      if (silent) {
        state = 'gone';
        g.visible = false;
        shadow.visible = false;
        return;
      }
      state = 'collecting';
      kit.particles.burst([x, 1, z], ['#a78bfa', '#5ec8f2', '#ffffff'], 16, 3);
    },
    get collected() {
      return state !== 'idle';
    },
  };
};

/* ---------------------------------------------------------- bichos e céu */

export const birds = (kit: Kit, count: number) => {
  for (let i = 0; i < count; i++) {
    const bird = new THREE.Group();
    kit.scene.add(bird);
    box(bird, [0.25, 0.18, 0.6], [0, 0, 0], lambert('#f4f0ff'));
    const left = new THREE.Group();
    const right = new THREE.Group();
    bird.add(left, right);
    box(left, [0.9, 0.05, 0.35], [-0.45, 0, 0], lambert('#e8e4f0'));
    box(right, [0.9, 0.05, 0.35], [0.45, 0, 0], lambert('#e8e4f0'));
    const radius = 18 + i * 4;
    const height = 13 + (i % 3) * 3;
    const speed = 0.25 + (i % 2) * 0.08;
    const phase = i * 1.7;
    kit.ticks.push((t) => {
      const a = t * speed + phase;
      bird.position.set(Math.cos(a) * radius, height + Math.sin(t * 0.7 + i) * 1.2, Math.sin(a) * radius);
      bird.rotation.y = -a;
      const flap = Math.sin(t * 9 + i) * 0.6;
      left.rotation.z = flap;
      right.rotation.z = -flap;
    });
  }
};

/** Peixinho que pula fora d'água de vez em quando. */
export const fish = (kit: Kit, spots: [number, number][]) => {
  const body = new THREE.Group();
  kit.scene.add(body);
  box(body, [0.25, 0.4, 0.9], [0, 0, 0], lambert('#ff8c42'));
  const tail = box(body, [0.08, 0.45, 0.35], [0, 0, -0.55], lambert('#ff6b35'));
  tail.rotation.x = 0.3;
  body.visible = false;
  let start = 2;
  let spot = 0;
  kit.ticks.push((t) => {
    const k = (t - start) / 1.1;
    if (k < 0) return;
    if (k > 1) {
      body.visible = false;
      start = t + 2.5 + Math.random() * 3;
      spot = (spot + 1) % spots.length;
      return;
    }
    const [x, z] = spots[spot];
    body.visible = true;
    body.position.set(x + k * 2.5, -0.4 + Math.sin(k * Math.PI) * 2.2, z);
    body.rotation.set(0, Math.PI / 2, 0);
    body.rotateX(-Math.cos(k * Math.PI) * 1.1);
    if (Math.abs(k - 0.02) < 0.02 || Math.abs(k - 0.98) < 0.02) {
      kit.particles.burst([body.position.x, -0.3, z], ['#ffffff', '#9be7ff'], 6, 1.5);
    }
  });
};

/** Caranguejos andando de lado na areia. */
export const crabs = (kit: Kit, spots: [number, number, number][]) => {
  spots.forEach(([x, z, angle], i) => {
    const crab = new THREE.Group();
    crab.rotation.y = angle;
    crab.position.set(x, 0, z);
    kit.scene.add(crab);
    box(crab, [0.55, 0.25, 0.4], [0, 0.22, 0], lambert('#ff5a4e'));
    box(crab, [0.07, 0.15, 0.07], [-0.12, 0.42, 0.15], lambert('#ff5a4e'));
    box(crab, [0.07, 0.15, 0.07], [0.12, 0.42, 0.15], lambert('#ff5a4e'));
    box(crab, [0.08, 0.08, 0.08], [-0.12, 0.52, 0.15], lambert('#111'));
    box(crab, [0.08, 0.08, 0.08], [0.12, 0.52, 0.15], lambert('#111'));
    const claws = [-0.38, 0.38].map((side) =>
      box(crab, [0.2, 0.15, 0.2], [side, 0.28, 0.25], lambert('#ff7a6e')),
    );
    for (const side of [-0.3, 0.3]) {
      for (const dz of [-0.12, 0.05]) box(crab, [0.25, 0.05, 0.05], [side, 0.1, dz], lambert('#d94a3e'));
    }
    const dx = Math.cos(angle);
    const dz = -Math.sin(angle);
    kit.ticks.push((t) => {
      const s = Math.sin(t * 0.8 + i * 2) * 1.6;
      crab.position.set(x + dx * s, Math.abs(Math.sin(t * 10)) * 0.04, z + dz * s);
      claws.forEach((claw, j) => (claw.rotation.z = Math.sin(t * 6 + j) * 0.4));
    });
  });
};

export const butterflies = (kit: Kit, spots: [number, number][]) => {
  spots.forEach(([x, z], i) => {
    const fly = new THREE.Group();
    kit.scene.add(fly);
    const color = ['#ff7eb6', '#ffd166', '#c4b5fd'][i % 3];
    const left = new THREE.Group();
    const right = new THREE.Group();
    fly.add(left, right);
    box(left, [0.25, 0.02, 0.22], [-0.13, 0, 0], glow(color));
    box(right, [0.25, 0.02, 0.22], [0.13, 0, 0], glow(color));
    kit.ticks.push((t) => {
      const a = t * 0.9 + i;
      fly.position.set(x + Math.cos(a) * 1.5, 1.1 + Math.sin(t * 2.3 + i) * 0.4, z + Math.sin(a * 1.3) * 1.5);
      fly.rotation.y = -a;
      const flap = Math.sin(t * 18 + i) * 0.9;
      left.rotation.z = flap;
      right.rotation.z = -flap;
    });
  });
};

export const fireflies = (kit: Kit, count: number, rand: () => number) => {
  const positions = new Float32Array(count * 3);
  const seeds: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const r = 6 + rand() * 30;
    seeds.push([Math.cos(angle) * r, Math.sin(angle) * r, rand() * 10]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: '#fff3a0',
    size: 3,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  kit.scene.add(new THREE.Points(geometry, material));
  kit.ticks.push((t) => {
    seeds.forEach(([x, z, p], i) => {
      positions[i * 3] = x + Math.sin(t * 0.5 + p) * 1.5;
      positions[i * 3 + 1] = 1 + Math.sin(t * 0.9 + p * 2) * 0.6 + 0.6;
      positions[i * 3 + 2] = z + Math.cos(t * 0.4 + p) * 1.5;
    });
    geometry.attributes.position.needsUpdate = true;
    material.opacity = 0.6 + Math.sin(t * 4) * 0.3;
  });
};

export const clouds = (kit: Kit, count: number, rand: () => number) => {
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const parts = 3 + Math.floor(rand() * 3);
    for (let p = 0; p < parts; p++) {
      const puff = mesh(cloud, new THREE.IcosahedronGeometry(1.6 + rand() * 1.6, 0), lambert('#ffe4f2'), [
        p * 2.2 - parts,
        rand() * 1.2,
        rand() * 1.5,
      ]);
      puff.scale.y = 0.7;
    }
    const z = -120 + rand() * 200;
    const y = 24 + rand() * 14;
    const speed = 1.2 + rand() * 1.5;
    const offset = rand() * 300;
    kit.scene.add(cloud);
    kit.ticks.push((t) => {
      cloud.position.set(((t * speed + offset) % 300) - 150, y, z);
    });
  }
};

/** Ilhas lá longe, que somem na névoa rosa do horizonte. */
export const farIslands = (kit: Kit) => {
  const spots = [
    [-170, -200, 26],
    [-60, -260, 38],
    [90, -230, 30],
    [210, -150, 22],
    [-240, -40, 20],
    [230, 60, 18],
  ];
  spots.forEach(([x, z, h]) => {
    const m = mesh(kit.scene, new THREE.ConeGeometry(h * 1.6, h, 7), lambert('#6a3f8f'), [x, h / 2 - 1, z]);
    m.rotation.y = x;
  });
};

export const stars = (kit: Kit, rand: () => number) => {
  const groups = [0, 1].map(() => {
    const positions: number[] = [];
    for (let i = 0; i < 160; i++) {
      const a = rand() * Math.PI * 2;
      const y = 0.35 + rand() * 0.65;
      const r = Math.sqrt(1 - y * y);
      positions.push(Math.cos(a) * r * 380, y * 380, Math.sin(a) * r * 380);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 2,
      sizeAttenuation: false,
      fog: false,
      transparent: true,
    });
    kit.scene.add(new THREE.Points(geometry, material));
    return material;
  });
  kit.ticks.push((t) => {
    groups[0].opacity = 0.5 + Math.sin(t * 1.7) * 0.4;
    groups[1].opacity = 0.5 + Math.cos(t * 1.3) * 0.4;
  });
};
