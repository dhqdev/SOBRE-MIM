import * as THREE from 'three';
import { box, group, lambert, live, mesh, shared, type Kit } from './props';
import { terrainHeight } from './terrain';

/** Os detalhinhos da fazenda: barril, carrinho de mão, lenha, colmeia, cocho, banco e balanço. */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 10));
const TORUS = shared(new THREE.TorusGeometry(0.42, 0.13, 6, 12));
const WOOD = '#9e7044';
const DARK = '#6b4423';

export const barrels = (kit: Kit, x: number, z: number, count = 3) => {
  const g = group(kit, x, z);
  for (let i = 0; i < count; i++) {
    const bx = (i % 2) * 0.85 - 0.4;
    const bz = Math.floor(i / 2) * 0.85 - 0.2;
    const barrel = mesh(g, CYL, lambert('#8a5a34'), [bx, 0.5, bz]);
    barrel.scale.set(0.38, 1, 0.38);
    for (const h of [0.2, 0.8]) {
      const hoop = mesh(g, CYL, lambert('#3b3350'), [bx, h, bz]);
      hoop.scale.set(0.4, 0.06, 0.4);
    }
    const lid = mesh(g, CYL, lambert('#b8874e'), [bx, 1.0, bz]);
    lid.scale.set(0.34, 0.03, 0.34);
  }
  kit.obstacles.push({ x, z, r: 0.95 });
};

export const wheelbarrow = (kit: Kit, x: number, z: number, angle = 0, load = '#7fbf55') => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  const tub = box(g, [0.8, 0.4, 1.1], [0, 0.6, 0], lambert('#5a8fd6'));
  tub.rotation.x = -0.08;
  box(g, [0.7, 0.18, 0.95], [0, 0.82, 0], lambert(load));
  const wheel = mesh(g, CYL, lambert('#2a2a33'), [0, 0.28, 0.75]);
  wheel.scale.set(0.28, 0.12, 0.28);
  wheel.rotation.z = Math.PI / 2;
  for (const side of [-0.32, 0.32]) {
    box(g, [0.07, 0.07, 1.2], [side, 0.55, -0.7], lambert(DARK));
    box(g, [0.06, 0.45, 0.06], [side, 0.25, -0.35], lambert(DARK));
  }
  kit.obstacles.push({ x, z, r: 0.7 });
};

/** Pilha de lenha com o machado fincado no toco. */
export const firewood = (kit: Kit, x: number, z: number, angle = 0) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  const tones = ['#8a5a34', '#9e7044', '#7a4f2c'].map((c) => lambert(c));
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 5 - row; i++) {
      const log = mesh(g, CYL, tones[(i + row) % 3], [-0.9 + i * 0.44 + row * 0.22, 0.2 + row * 0.38, 0]);
      log.scale.set(0.2, 1.3, 0.2);
      log.rotation.x = Math.PI / 2;
      const end = mesh(g, CYL, lambert('#d9b47a'), [-0.9 + i * 0.44 + row * 0.22, 0.2 + row * 0.38, 0.66]);
      end.scale.set(0.17, 0.02, 0.17);
      end.rotation.x = Math.PI / 2;
    }
  const stump = mesh(g, CYL, lambert('#7a4f2c'), [1.7, 0.3, 0.3]);
  stump.scale.set(0.42, 0.6, 0.42);
  const handle = box(g, [0.07, 0.8, 0.07], [1.75, 0.95, 0.3], lambert(WOOD));
  handle.rotation.z = -0.4;
  box(g, [0.3, 0.2, 0.05], [1.62, 0.62, 0.3], lambert('#8a8a9a'));
  kit.obstacles.push({ x, z, r: 1.3 });
};

/** Caixas de abelha (com abelhinhas zumbindo em volta). */
export const beehives = (kit: Kit, spots: [number, number][]) => {
  spots.forEach(([x, z], i) => {
    const g = group(kit, x, z);
    g.rotation.y = i * 0.4;
    for (const sx of [-0.3, 0.3]) box(g, [0.08, 0.4, 0.6], [sx, 0.2, 0], lambert(DARK));
    box(g, [0.8, 0.36, 0.7], [0, 0.58, 0], lambert('#fff1c9'));
    box(g, [0.8, 0.36, 0.7], [0, 0.95, 0], lambert('#ffd166'));
    box(g, [0.95, 0.1, 0.85], [0, 1.18, 0], lambert('#f4f0ff'));
    box(g, [0.3, 0.06, 0.04], [0, 0.48, 0.36], lambert('#3b2a1e'));
    kit.obstacles.push({ x, z, r: 0.55 });
  });
  // abelhas: pontinhos amarelos voando em volta das caixas
  const count = spots.length * 5;
  const bees = new THREE.InstancedMesh(
    shared(new THREE.BoxGeometry(0.09, 0.07, 0.11)),
    lambert('#ffcf3a'),
    count,
  );
  live(bees);
  bees.frustumCulled = false;
  kit.scene.add(bees);
  const m = new THREE.Matrix4();
  kit.ticks.push((t) => {
    for (let i = 0; i < count; i++) {
      const [x, z] = spots[Math.floor(i / 5)];
      const a = t * (1.6 + (i % 5) * 0.4) + i * 2.1;
      const r = 0.7 + Math.sin(t * 0.9 + i) * 0.4;
      m.makeTranslation(
        x + Math.cos(a) * r,
        terrainHeight(x, z) + 1.2 + Math.sin(a * 1.7) * 0.35,
        z + Math.sin(a) * r,
      );
      bees.setMatrixAt(i, m);
    }
    bees.instanceMatrix.needsUpdate = true;
  });
};

/** Cocho de água pros bichos. */
export const trough = (kit: Kit, x: number, z: number, angle = 0) => {
  const g = group(kit, x, z);
  g.rotation.y = angle;
  box(g, [2.0, 0.5, 0.7], [0, 0.35, 0], lambert('#8a8a9a'));
  box(g, [1.85, 0.05, 0.55], [0, 0.58, 0], lambert('#5ec8f2'));
  for (const sx of [-0.8, 0.8]) box(g, [0.15, 0.2, 0.8], [sx, 0.1, 0], lambert(DARK));
  kit.obstacles.push({ x, z, r: 0.9 });
};

/** Banquinho de madeira. */
export const bench = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  g.rotation.y = Math.atan2(faceX - x, faceZ - z);
  box(g, [1.8, 0.1, 0.5], [0, 0.5, 0], lambert(WOOD));
  box(g, [1.8, 0.4, 0.08], [0, 0.8, -0.24], lambert(WOOD));
  for (const sx of [-0.75, 0.75]) box(g, [0.1, 0.5, 0.45], [sx, 0.25, 0], lambert(DARK));
  kit.obstacles.push({ x, z, r: 0.7 });
};

/** Árvore grande com balanço de pneu que fica balançando com o vento. */
export const tireSwing = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  const trunk = mesh(g, CYL, lambert('#7a4f2c'), [0, 1.8, 0]);
  trunk.scale.set(0.42, 3.6, 0.42);
  const branch = box(g, [2.4, 0.26, 0.26], [1.1, 3.4, 0], lambert('#7a4f2c'));
  branch.rotation.z = 0.12;
  const blob = shared(new THREE.IcosahedronGeometry(1, 0));
  [
    [0, 4.6, 0, 2.2],
    [1.6, 4.1, 0.4, 1.5],
    [-1.3, 4.2, -0.4, 1.5],
    [0.3, 5.4, -0.3, 1.3],
  ].forEach(([bx, by, bz, r], i) => {
    const b = mesh(g, blob, lambert(['#4fa04a', '#5cb455', '#3f8f40'][i % 3]), [bx, by, bz]);
    b.scale.setScalar(r);
  });
  kit.obstacles.push({ x, z, r: 0.5 });
  // o balanço mexe: fica fora da malha estática
  const swing = live(new THREE.Group());
  swing.position.set(x + 1.9, terrainHeight(x, z) + 3.45, z);
  kit.scene.add(swing);
  box(swing, [0.04, 2.4, 0.04], [0, -1.2, 0], lambert('#c9a46b'));
  const tire = mesh(swing, TORUS, lambert('#2a2a33'), [0, -2.6, 0]);
  tire.rotation.y = Math.PI / 2;
  kit.ticks.push((t) => {
    swing.rotation.x = Math.sin(t * 1.3) * 0.18;
  });
};

/** Canteiro de abóboras colhidas e um espantalho de cesto. */
export const pumpkinPile = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  const orange = lambert('#f28c28');
  [
    [0, 0.3, 0, 0.42],
    [0.7, 0.26, 0.2, 0.36],
    [-0.6, 0.26, 0.3, 0.34],
    [0.2, 0.7, 0.1, 0.3],
  ].forEach(([px, py, pz, r]) => {
    const p = mesh(g, CYL, orange, [px, py, pz]);
    p.scale.set(r, r * 1.3, r);
    box(g, [0.06, 0.16, 0.06], [px, py + r * 0.7, pz], lambert('#4f7a3a'));
  });
  mesh(g, CYL, lambert('#c9a46b'), [1.3, 0.25, -0.4]).scale.set(0.38, 0.5, 0.38);
  kit.obstacles.push({ x, z, r: 0.9 });
};
