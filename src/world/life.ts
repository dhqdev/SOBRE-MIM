import * as THREE from 'three';
import { ISLAND, LAKE, STREAM_HALF, STREAM_PATH, WATER_Y, terrainHeight, waterDistance } from './terrain';
import { bake, box, glow, instancedFrom, lambert, mesh, type Kit } from './props';

/** Vida em volta: passarinhos, nuvens, peixes, borboletas e vaga-lumes. */

export const birds = (kit: Kit, count: number) => {
  const material = new THREE.MeshLambertMaterial({ color: '#f4f0ff', flatShading: true });
  const flock: THREE.Group[] = [];
  for (let i = 0; i < count; i++) {
    const bird = new THREE.Group();
    kit.scene.add(bird);
    flock.push(bird);
    box(bird, [0.25, 0.18, 0.6], [0, 0, 0], material);
    box(bird, [0.1, 0.08, 0.16], [0, -0.02, 0.36], lambert('#ffb347'));
    const left = new THREE.Group();
    const right = new THREE.Group();
    bird.add(left, right);
    box(left, [0.9, 0.05, 0.35], [-0.45, 0, 0], material);
    box(right, [0.9, 0.05, 0.35], [0.45, 0, 0], material);
    bake(bird);
    const radius = 22 + i * 5;
    const height = 20 + (i % 3) * 3;
    const speed = 0.22 + (i % 2) * 0.07;
    const phase = i * 1.7;
    const cx = (i % 2 ? -1 : 1) * 10;
    kit.ticks.push((t) => {
      const a = t * speed + phase;
      bird.position.set(
        cx + Math.cos(a) * radius,
        height + Math.sin(t * 0.7 + i) * 1.2,
        Math.sin(a) * radius - 10,
      );
      bird.rotation.y = -a;
      const flap = Math.sin(t * 9 + i) * 0.6;
      left.rotation.z = flap;
      right.rotation.z = -flap;
    });
  }
  // de noite os passarinhos vão dormir
  kit.night.hooks.push((night) => flock.forEach((bird) => (bird.visible = night < 0.6)));
};

export const clouds = (kit: Kit, count: number, rand: () => number) => {
  const material = new THREE.MeshLambertMaterial({
    color: '#ffffff',
    flatShading: true,
    emissive: '#ffffff',
    emissiveIntensity: 0.25,
  });
  const day = new THREE.Color('#ffffff');
  const dark = new THREE.Color('#4a5278');
  const pink = new THREE.Color('#ff9fb0');
  const white = new THREE.Color('#ffffff');
  const orange = new THREE.Color('#ff8a4a');
  let last = -1;
  // no pôr do sol as nuvens ficam rosadas e com a barriga laranja
  kit.ticks.push(() => {
    const { night, dusk } = kit.env;
    const key = night * 1000 + dusk;
    if (Math.abs(key - last) < 0.001) return;
    last = key;
    material.color.lerpColors(day, dark, night).lerp(pink, dusk * 0.75);
    material.emissive.copy(white).lerp(orange, dusk);
    material.emissiveIntensity = 0.25 * (1 - night) + dusk * 0.3;
  });
  const puff = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const parts = 3 + Math.floor(rand() * 3);
    for (let p = 0; p < parts; p++) {
      const m = mesh(cloud, puff, material, [p * 3 - parts * 1.5, rand() * 1.4, rand() * 2]);
      m.scale.set(2.4 + rand() * 1.8, 1.5 + rand() * 0.8, 2 + rand() * 1.2);
    }
    const z = -170 + rand() * 280;
    const y = 42 + rand() * 18;
    const speed = 1 + rand() * 1.5;
    const offset = rand() * 420;
    bake(cloud);
    kit.scene.add(cloud);
    kit.ticks.push((t) => cloud.position.set(((t * speed + offset) % 420) - 210, y, z));
  }
};

/** Peixinho que pula fora d'água de vez em quando. */
export const fish = (kit: Kit, spots: [number, number, number][]) => {
  const body = new THREE.Group();
  kit.scene.add(body);
  box(body, [0.22, 0.36, 0.8], [0, 0, 0], lambert('#ff8c42'));
  const tail = box(body, [0.06, 0.4, 0.32], [0, 0, -0.5], lambert('#ff6b35'));
  tail.rotation.x = 0.3;
  body.visible = false;
  let start = 2;
  let spot = 0;
  kit.ticks.push((t) => {
    const k = (t - start) / 1.0;
    if (k < 0) return;
    if (k > 1) {
      body.visible = false;
      start = t + 2 + Math.random() * 3;
      spot = (spot + 1) % spots.length;
      return;
    }
    const [x, z, angle] = spots[spot];
    body.visible = true;
    const dx = Math.sin(angle) * 2.2;
    const dz = Math.cos(angle) * 2.2;
    body.position.set(x + dx * k, WATER_Y + Math.sin(k * Math.PI) * 1.6, z + dz * k);
    body.rotation.set(0, angle, 0);
    body.rotateX(-Math.cos(k * Math.PI) * 1.1);
    if (Math.abs(k - 0.03) < 0.03 || Math.abs(k - 0.97) < 0.03) {
      kit.particles.burst([body.position.x, WATER_Y + 0.1, body.position.z], ['#ffffff', '#9be7ff'], 6, 1.5);
    }
  });
};

export const butterflies = (kit: Kit, spots: [number, number][]) => {
  const all: THREE.Group[] = [];
  spots.forEach(([x, z], i) => {
    const fly = new THREE.Group();
    kit.scene.add(fly);
    all.push(fly);
    const color = ['#ff7eb6', '#ffd166', '#c4b5fd', '#8ec5ff'][i % 4];
    const left = new THREE.Group();
    const right = new THREE.Group();
    fly.add(left, right);
    box(left, [0.25, 0.02, 0.22], [-0.13, 0, 0], glow(color));
    box(right, [0.25, 0.02, 0.22], [0.13, 0, 0], glow(color));
    const y = terrainHeight(x, z);
    kit.ticks.push((t) => {
      if (!fly.visible) return;
      const a = t * 0.9 + i;
      fly.position.set(
        x + Math.cos(a) * 1.6,
        y + 1.1 + Math.sin(t * 2.3 + i) * 0.4,
        z + Math.sin(a * 1.3) * 1.6,
      );
      fly.rotation.y = -a;
      const flap = Math.sin(t * 18 + i) * 0.9;
      left.rotation.z = flap;
      right.rotation.z = -flap;
    });
  });
  kit.night.hooks.push((night) => all.forEach((fly) => (fly.visible = night < 0.5)));
};

/** Vaga-lumes piscando de noite perto do riacho e do pomar. */
export const fireflies = (kit: Kit, spots: [number, number][]) => {
  const count = spots.length;
  const positions = new Float32Array(count * 3);
  const seeds = spots.map(([x, z], i) => [x, terrainHeight(x, z), z, i * 1.37] as const);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: '#fff3a0',
    size: kit.env.mobile ? 4 : 3.5,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  kit.scene.add(points);
  kit.ticks.push((t) => {
    const night = kit.env.night;
    points.visible = night > 0.2;
    if (!points.visible) return;
    seeds.forEach(([x, y, z, p], i) => {
      positions[i * 3] = x + Math.sin(t * 0.5 + p) * 1.8;
      positions[i * 3 + 1] = y + 1 + Math.sin(t * 0.9 + p * 2) * 0.7;
      positions[i * 3 + 2] = z + Math.cos(t * 0.4 + p) * 1.8;
    });
    geometry.attributes.position.needsUpdate = true;
    material.opacity = night * (0.65 + Math.sin(t * 4) * 0.3);
  });
};

/** Cardume: peixes coloridos nadando no lago e subindo e descendo o riacho. */
export const swimmers = (kit: Kit) => {
  const template = new THREE.Group();
  box(template, [0.22, 0.3, 0.75], [0, 0, 0], lambert('#ffffff'));
  box(template, [0.18, 0.22, 0.25], [0, 0, 0.42], lambert('#ffffff'));
  const tail = box(template, [0.05, 0.34, 0.26], [0, 0, -0.5], lambert('#ffffff'));
  tail.rotation.x = 0.2;
  box(template, [0.04, 0.16, 0.3], [0, 0.2, 0], lambert('#ffffff'));
  const count = kit.env.mobile ? 26 : 44;
  const fish = instancedFrom(template, count);
  const tints = ['#ff8c42', '#ffb347', '#c0c8d8', '#ff6b6b', '#ffd166', '#9fb8c8', '#f4a261'];
  const rand = (() => {
    let seed = 7;
    return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  })();
  type Swim = {
    lake: boolean;
    cx: number;
    cz: number;
    r: number;
    speed: number;
    phase: number;
    size: number;
    lane: number;
  };
  const swims: Swim[] = [];
  for (let i = 0; i < count; i++) {
    fish.setColorAt(i, new THREE.Color(tints[i % tints.length]));
    if (i < count * 0.6) {
      // no lago: voltinhas em torno de pontos longe da ilha e da margem
      let cx = LAKE.x;
      let cz = LAKE.z;
      for (let k = 0; k < 20; k++) {
        const a = rand() * Math.PI * 2;
        const r = 3 + rand() * (LAKE.r - 7);
        cx = LAKE.x + Math.cos(a) * r;
        cz = LAKE.z + Math.sin(a) * r;
        if (Math.hypot(cx - ISLAND.x, cz - ISLAND.z) > ISLAND.r + 4) break;
      }
      swims.push({
        lake: true,
        cx,
        cz,
        r: 1.2 + rand() * 2.2,
        speed: (0.5 + rand() * 0.6) * (i % 2 ? 1 : -1),
        phase: rand() * 6,
        size: 0.8 + rand() * 0.7,
        lane: 0,
      });
    } else {
      swims.push({
        lake: false,
        cx: 0,
        cz: 0,
        r: 0,
        speed: (1 + rand() * 1.2) * (i % 2 ? 1 : -1),
        phase: rand() * STREAM_PATH.length,
        size: 0.7 + rand() * 0.5,
        lane: (rand() - 0.5) * STREAM_HALF * 1.1,
      });
    }
  }
  kit.scene.add(fish);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const n = STREAM_PATH.length - 1;
  kit.ticks.push((t) => {
    swims.forEach((swim, i) => {
      let heading = 0;
      if (swim.lake) {
        const a = (t * swim.speed) / swim.r + swim.phase;
        position.set(swim.cx + Math.cos(a) * swim.r, 0, swim.cz + Math.sin(a) * swim.r);
        heading = Math.atan2(-Math.sin(a) * Math.sign(swim.speed), Math.cos(a) * Math.sign(swim.speed));
      } else {
        // vai e volta no riacho, uma faixa pra cada peixe
        const span = n - 40;
        const u = (((swim.phase + t * swim.speed * 1.5) % (span * 2)) + span * 2) % (span * 2);
        const k = 20 + (u < span ? u : span * 2 - u);
        const i0 = Math.floor(k);
        const [ax, az] = STREAM_PATH[i0];
        const [bx, bz] = STREAM_PATH[Math.min(n, i0 + 1)];
        const f = k - i0;
        const tx = bx - ax;
        const tz = bz - az;
        const length = Math.hypot(tx, tz) || 1;
        const lane = swim.lane + Math.sin(t * 0.7 + i) * 0.4;
        position.set(ax + tx * f + (-tz / length) * lane, 0, az + tz * f + (tx / length) * lane);
        const forward = (u < span ? 1 : -1) * Math.sign(swim.speed);
        heading = Math.atan2(tx * forward, tz * forward);
      }
      // fundo raso perto da margem: o peixe some
      const deep = waterDistance(position.x, position.z) < -0.9;
      position.y = WATER_Y - 0.28 + Math.sin(t * 2 + i) * 0.05;
      quaternion.setFromEuler(euler.set(0, heading + Math.sin(t * 6 + i) * 0.15, 0));
      matrix.compose(position, quaternion, scale.setScalar(deep ? swim.size : 0.001));
      fish.setMatrixAt(i, matrix);
    });
    fish.instanceMatrix.needsUpdate = true;
  });
};
