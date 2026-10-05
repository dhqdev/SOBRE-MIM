import * as THREE from 'three';
import {
  BRIDGES,
  CHANNEL,
  POOLS,
  POND,
  S,
  STREAM_HALF,
  STREAM_PATH,
  WATER_Y,
  bridgeDeck,
  groundHeight,
  terrainFrom,
  terrainHeight,
  waterDistance,
  stillWater,
} from './terrain';
import { box, glow, group, lambert, live, mesh, seeded, shared, type Kit } from './props';

/**
 * Chão do sítio: o relevo pintado (grama, estradinha de terra, roça), o
 * riacho com a cachoeira e o lago, as pontes, as cercas e as plantas.
 */

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface Road {
  points: [number, number][];
  width: number;
}

/** Mancha pintada no chão: retângulo (`w`/`d`) ou círculo (`r`). */
export interface Patch {
  x: number;
  z: number;
  w?: number;
  d?: number;
  r?: number;
  color: string;
}

/* ------------------------------------------------------------------ relevo */

const C = (hex: string) => new THREE.Color(hex);
const GRASS_A = C('#6cc24e');
const GRASS_B = C('#46993a');
const GRASS_DRY = C('#93cc58');
const HILL = C('#4c943e');
const ROCKY = C('#6f8f5a');
const MUD = C('#8b7652');
const BED = C('#5f5a44');
const DIRT = C('#c9a46b');
const DIRT_DARK = C('#b28c58');

const grassColor = (x: number, z: number, h: number, target: THREE.Color) => {
  const n =
    0.5 +
    0.25 * Math.sin(x * 0.31 + z * 0.17) +
    0.18 * Math.sin(x * 0.11 - z * 0.27 + 1.7) +
    0.07 * Math.sin(x * 1.3 + z * 0.9);
  target.copy(GRASS_A).lerp(GRASS_B, Math.max(0, Math.min(1, n)));
  const dry = smoothstep(0.55, 0.95, Math.sin(x * 0.05 + 2.1) * Math.cos(z * 0.06 - 0.4));
  target.lerp(GRASS_DRY, dry * 0.3);
  target.lerp(HILL, smoothstep(5, 14, h) * 0.55);
  target.lerp(ROCKY, smoothstep(16, 26, h) * 0.7);
  return target;
};

const segmentDistance = (x: number, z: number, ax: number, az: number, bx: number, bz: number) => {
  const dx = bx - ax;
  const dz = bz - az;
  const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - ax - dx * k, z - az - dz * k);
};

const buildPlane = (
  size: number,
  segments: number,
  height: (x: number, z: number) => { h: number; color: THREE.Color },
) => {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const { h, color } = height(x, z);
    position.setY(i, h);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
};

export const buildTerrain = (kit: Kit, roads: Road[], patches: Patch[]) => {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const segments = roads.flatMap((road) =>
    road.points.slice(1).map((point, i) => ({ a: road.points[i], b: point, half: road.width / 2 })),
  );
  const color = new THREE.Color();
  const patchColors = patches.map((patch) => C(patch.color));
  const rand = seeded(99);
  const jitter = Array.from({ length: 64 }, () => rand());

  // miolo detalhado (onde se anda)
  const INNER = 280;
  const inner = buildPlane(INNER, kit.env.mobile ? 200 : 270, (x, z) => {
    const far = Math.hypot(x, z) > S(112);
    const w = far ? 40 : waterDistance(x, z);
    const h = terrainFrom(x, z, w);
    grassColor(x, z, h, color);
    // barranco de terra molhada e o fundo do riacho
    color.lerp(MUD, 1 - smoothstep(0.2, 1.6, w));
    color.lerp(BED, 1 - smoothstep(-1.4, 0, w));
    patches.forEach((patch, index) => {
      let k = 0;
      if (patch.r !== undefined)
        k = 1 - smoothstep(patch.r - 0.8, patch.r + 0.6, Math.hypot(x - patch.x, z - patch.z));
      else {
        const ex = Math.abs(x - patch.x) - (patch.w ?? 0) / 2;
        const ez = Math.abs(z - patch.z) - (patch.d ?? 0) / 2;
        k = 1 - smoothstep(-0.4, 0.8, Math.max(ex, ez));
      }
      if (k > 0) color.lerp(patchColors[index], k);
    });
    if (!far) {
      let best = Infinity;
      let half = 1;
      for (const segment of segments) {
        const d =
          segmentDistance(x, z, segment.a[0], segment.a[1], segment.b[0], segment.b[1]) - segment.half;
        if (d < best) {
          best = d;
          half = segment.half;
        }
      }
      const road = 1 - smoothstep(-0.3, 0.7, best);
      if (road > 0) {
        const n = jitter[Math.abs(Math.floor(x * 3.1 + z * 7.3)) % jitter.length];
        // trilho das rodas no meio da estrada
        const rut = half > 1.4 && best < -half * 0.35 && best > -half * 0.75 ? 0.35 : 0;
        color.lerp(DIRT, road).lerp(DIRT_DARK, road * (n * 0.35 + rut));
      }
    }
    return { h, color };
  });
  const innerMesh = new THREE.Mesh(inner, material);
  innerMesh.matrixAutoUpdate = false;
  kit.scene.add(innerMesh);

  // anel grosso até o horizonte (fica por baixo do miolo)
  const outer = buildPlane(640, 64, (x, z) => {
    const insideInner = Math.max(Math.abs(x), Math.abs(z)) < INNER / 2 - 1;
    const h = terrainHeight(x, z) - (insideInner ? 1.5 : 0);
    grassColor(x, z, h, color);
    return { h, color };
  });
  const outerMesh = new THREE.Mesh(outer, material);
  outerMesh.matrixAutoUpdate = false;
  kit.scene.add(outerMesh);
};

/* -------------------------------------------------------------------- água */

const waterShader = (flow: number, opacity = 0.8) => {
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uDay: { value: 1 },
      uDusk: { value: 0 },
      uFlow: { value: flow },
      uOpacity: { value: opacity },
    },
  ]);
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    fog: true,
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      attribute float across;
      attribute float along;
      varying float vAcross;
      varying float vAlong;
      varying vec3 vWorld;
      void main() {
        vAcross = across;
        vAlong = along;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform float uTime;
      uniform float uDay;
      uniform float uFlow;
      uniform float uDusk;
      uniform float uOpacity;
      varying float vAcross;
      varying float vAlong;
      varying vec3 vWorld;
      vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      void main() {
        vec3 deep = mix(lin(vec3(0.05, 0.09, 0.22)), lin(vec3(0.1, 0.42, 0.62)), uDay);
        vec3 shallow = mix(lin(vec3(0.12, 0.19, 0.38)), lin(vec3(0.34, 0.76, 0.82)), uDay);
        float edge = clamp(abs(vAcross), 0.0, 1.2);
        vec3 col = mix(deep, shallow, smoothstep(0.15, 0.95, edge));
        vec3 sparkle = mix(lin(vec3(0.6, 0.66, 1.0)), vec3(1.0), uDay);
        // correnteza: manchas alongadas descendo o riacho
        vec2 p = uFlow > 0.5
          ? vec2(vAlong * 0.4 - uTime * 1.6, vAcross * 2.6)
          : vWorld.xz * 0.3 + vec2(uTime * 0.06, uTime * 0.04);
        float n = noise(p) * 0.6 + noise(p * 2.3 + vec2(-uTime * 1.1 * uFlow, 3.1)) * 0.4;
        float patches = smoothstep(0.58, 0.85, n);
        // risquinhos finos de espuma correndo junto
        float lines = uFlow * smoothstep(0.86, 1.0, sin(vAcross * 11.0 + noise(vec2(vAlong * 0.15 - uTime * 0.5, 0.0)) * 5.0))
          * smoothstep(0.45, 0.8, noise(vec2(vAlong * 0.7 - uTime * 2.4, vAcross * 1.7)));
        float ripple = sin(vWorld.x * 1.7 + uTime * 1.6) * sin(vWorld.z * 1.5 - uTime * 1.2);
        col += sparkle * (patches * 0.32 + lines * 0.55 + smoothstep(0.8, 1.0, ripple) * 0.12 * (1.0 - uFlow));
        float foam = smoothstep(0.8, 1.02, edge + (n - 0.5) * 0.25);
        col = mix(col, sparkle * 0.95, foam * 0.7);
        // pôr do sol refletido: a água esquenta pro laranja e rosa
        col = mix(col, col * vec3(1.15, 0.7, 0.75) + lin(vec3(0.55, 0.3, 0.25)), uDusk * 0.55);
        gl_FragColor = vec4(col, uOpacity);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  return material;
};

export const buildWater = (kit: Kit) => {
  const materials: THREE.ShaderMaterial[] = [];

  // riacho: uma fita seguindo o leito
  const half = STREAM_HALF + 0.9;
  const positions: number[] = [];
  const across: number[] = [];
  const along: number[] = [];
  const index: number[] = [];
  let distance = 0;
  STREAM_PATH.forEach(([x, z], i) => {
    const [px, pz] = STREAM_PATH[Math.max(0, i - 1)];
    const [nx, nz] = STREAM_PATH[Math.min(STREAM_PATH.length - 1, i + 1)];
    if (i > 0) distance += Math.hypot(x - px, z - pz);
    const tx = nx - px;
    const tz = nz - pz;
    const length = Math.hypot(tx, tz) || 1;
    const ox = -tz / length;
    const oz = tx / length;
    positions.push(x + ox * half, WATER_Y, z + oz * half, x - ox * half, WATER_Y, z - oz * half);
    across.push(1, -1);
    along.push(distance, distance);
    if (i > 0) {
      const a = (i - 1) * 2;
      // sentido anti-horário visto de cima, senão a fita fica de costas e some
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  });
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  ribbon.setAttribute('across', new THREE.Float32BufferAttribute(across, 1));
  ribbon.setAttribute('along', new THREE.Float32BufferAttribute(along, 1));
  ribbon.setIndex(index);
  const streamMaterial = waterShader(1);
  materials.push(streamMaterial);
  const stream = new THREE.Mesh(ribbon, streamMaterial);
  stream.renderOrder = 1;
  kit.scene.add(stream);

  // lagos, canal e Lagoa Escondida: uma malha só, recortada pela margem
  {
    const step = kit.env.mobile ? 1.4 : 1;
    const [x0, x1, z0, z1] = [40, 124, 0, 86];
    const nx = Math.ceil((x1 - x0) / step);
    const nz = Math.ceil((z1 - z0) / step);
    const pos: number[] = [];
    const edge: number[] = [];
    const ids = new Map<number, number>();
    const dist: number[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) dist.push(stillWater(x0 + i * step, z0 + j * step));
    const vertex = (i: number, j: number) => {
      const key = j * (nx + 1) + i;
      let id = ids.get(key);
      if (id === undefined) {
        id = pos.length / 3;
        ids.set(key, id);
        pos.push(x0 + i * step, WATER_Y - 0.01, z0 + j * step);
        edge.push(Math.min(1.2, Math.max(0, 1 + dist[key] / 7)));
      }
      return id;
    };
    const tris: number[] = [];
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const k = j * (nx + 1) + i;
        if (Math.min(dist[k], dist[k + 1], dist[k + nx + 1], dist[k + nx + 2]) > 0.9) continue;
        const a = vertex(i, j);
        const b = vertex(i + 1, j);
        const c = vertex(i, j + 1);
        const d = vertex(i + 1, j + 1);
        tris.push(a, c, b, b, c, d);
      }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute('across', new THREE.Float32BufferAttribute(edge, 1));
    geometry.setAttribute('along', new THREE.Float32BufferAttribute(new Float32Array(edge.length), 1));
    geometry.setIndex(tris);
    const material = waterShader(0);
    materials.push(material);
    const lakes = new THREE.Mesh(geometry, material);
    lakes.renderOrder = 1;
    kit.scene.add(lakes);
  }
  // poço da cachoeira
  for (const pool of [POND]) {
    const disc = new THREE.CircleGeometry(pool.r + 0.9, 56);
    disc.rotateX(-Math.PI / 2);
    const count = disc.attributes.position.count;
    const radial = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      radial[i] = Math.hypot(disc.attributes.position.getX(i), disc.attributes.position.getZ(i)) / pool.r;
    }
    disc.setAttribute('across', new THREE.BufferAttribute(radial, 1));
    disc.setAttribute('along', new THREE.BufferAttribute(new Float32Array(count), 1));
    const material = waterShader(0);
    materials.push(material);
    const water = new THREE.Mesh(disc, material);
    water.position.set(pool.x, WATER_Y - 0.01, pool.z);
    water.renderOrder = 1;
    kit.scene.add(water);
  }

  kit.ticks.push((t) =>
    materials.forEach((m) => {
      m.uniforms.uTime.value = t;
      m.uniforms.uDusk.value = kit.env.dusk;
    }),
  );
  driftingBits(kit);
  kit.night.hooks.push((night) => materials.forEach((m) => (m.uniforms.uDay.value = 1 - night)));

  // pedras, taboas e vitórias-régias nas margens
  const rand = seeded(31);
  const rockGeometry = shared(new THREE.DodecahedronGeometry(1, 0));
  for (let i = 4; i < STREAM_PATH.length - 4; i += 4) {
    const [x, z] = STREAM_PATH[i];
    const [nx, nz] = STREAM_PATH[i + 1];
    const tx = nx - x;
    const tz = nz - z;
    const length = Math.hypot(tx, tz) || 1;
    const side = rand() > 0.5 ? 1 : -1;
    const offset = STREAM_HALF + 0.2 + rand() * 0.8;
    const rx = x + (-tz / length) * offset * side;
    const rz = z + (tx / length) * offset * side;
    if (nearBridge(rx, rz, 3)) continue;
    const rock = mesh(kit.statics, rockGeometry, lambert(rand() > 0.5 ? '#9a978f' : '#85837c'), [
      rx,
      terrainHeight(rx, rz) + 0.1,
      rz,
    ]);
    rock.scale.set(0.5 + rand() * 0.6, 0.35 + rand() * 0.35, 0.5 + rand() * 0.5);
    rock.rotation.y = rand() * 6;
    if (i % 3 === 0)
      reeds(
        kit,
        x + (-tz / length) * (STREAM_HALF - 0.3) * -side,
        z + (tx / length) * (STREAM_HALF - 0.3) * -side,
        rand,
      );
  }
  POOLS.forEach((pool) => {
    for (let i = 0; i < pool.r * 2.2; i++) {
      const a = rand() * Math.PI * 2;
      const r = pool.r + 0.2 + rand() * 0.6;
      const x = pool.x + Math.cos(a) * r;
      const z = pool.z + Math.sin(a) * r;
      const w = stillWater(x, z);
      if (w > -0.4 && w < 1 && !nearBridge(x, z, 3)) reeds(kit, x, z, rand);
    }
  });
  // pedras dentro do riacho: a água espirra em volta (corredeira)
  for (let i = 10; i < STREAM_PATH.length - 20; i += 13) {
    const [x, z] = STREAM_PATH[i];
    const ox = (rand() - 0.5) * STREAM_HALF * 1.2;
    const oz = (rand() - 0.5) * STREAM_HALF * 1.2;
    if (nearBridge(x + ox, z + oz, 4)) continue;
    const rock = mesh(kit.statics, rockGeometry, lambert('#8f8c84'), [x + ox, WATER_Y + 0.05, z + oz]);
    rock.scale.set(0.45 + rand() * 0.4, 0.3 + rand() * 0.25, 0.45 + rand() * 0.4);
    rock.rotation.y = rand() * 6;
  }
  // vitórias-régias
  const pad = shared(new THREE.CircleGeometry(0.55, 9, 0.4, Math.PI * 2 - 0.4));
  pad.rotateX(-Math.PI / 2);
  const spots: [number, number, number][] = [];
  POOLS.forEach((pool) => {
    for (let i = 0; i < pool.r * 2.6; i++) {
      const a = rand() * Math.PI * 2;
      const r = 2 + rand() * (pool.r - 3);
      const x = pool.x + Math.cos(a) * r;
      const z = pool.z + Math.sin(a) * r;
      if (stillWater(x, z) > -1.6 || nearBridge(x, z, 2.5)) continue;
      // deixa a passagem do canal livre pro barco
      if (Math.hypot(x - CHANNEL[0][0], z - CHANNEL[0][1]) < 6) continue;
      spots.push([x, z, rand()]);
    }
  });
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2;
    const r = 1.5 + rand() * (POND.r - 2.5);
    spots.push([POND.x + Math.cos(a) * r, POND.z + Math.sin(a) * r, rand()]);
  }
  spots.forEach(([x, z, k], i) => {
    const m = mesh(kit.statics, pad, lambert(k > 0.5 ? '#4f9a46' : '#5fae4f'), [x, WATER_Y + 0.03, z]);
    m.rotation.y = k * 6;
    m.scale.setScalar(0.8 + k * 0.6);
    if (i % 3 === 0) {
      box(kit.statics, [0.22, 0.16, 0.22], [x, WATER_Y + 0.12, z], lambert('#ff9ec8'));
      box(kit.statics, [0.1, 0.1, 0.1], [x, WATER_Y + 0.22, z], lambert('#fff1a8'));
    }
  });
};

const nearBridge = (x: number, z: number, margin: number) =>
  BRIDGES.some((b) => Math.hypot(x - b.x, z - b.z) < b.length / 2 + margin);

const reeds = (kit: Kit, x: number, z: number, rand: () => number) => {
  const y = terrainHeight(x, z);
  for (let j = 0; j < 5; j++) {
    const h = 0.9 + rand() * 0.8;
    const stalk = box(
      kit.statics,
      [0.07, h, 0.07],
      [x + (rand() - 0.5) * 0.7, y + h / 2, z + (rand() - 0.5) * 0.7],
      lambert('#5d8f3a'),
    );
    stalk.rotation.z = (rand() - 0.5) * 0.3;
    if (j % 2 === 0) {
      box(
        kit.statics,
        [0.13, 0.32, 0.13],
        [stalk.position.x, y + h + 0.05, stalk.position.z],
        lambert('#7a4a2a'),
      );
    }
  }
};

/** Cachoeira descendo a serra do oeste até o poço. */
export const waterfall = (kit: Kit) => {
  const z0 = POND.z;
  const x0 = -83.5;
  const x1 = POND.x - POND.r + 0.6;
  const steps = 36;
  const width = 4.2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const x = x0 + (x1 - x0) * k;
    const y = Math.max(WATER_Y + 0.05, terrainHeight(x, z0) + 0.25);
    positions.push(x, y, z0 - width / 2, x, y, z0 + width / 2);
    uvs.push(0, k, 1, k);
    if (i > 0) {
      const a = (i - 1) * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    { uTime: { value: 0 }, uDay: { value: 1 } },
  ]);
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform float uTime;
      uniform float uDay;
      varying vec2 vUv;
      vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
      void main() {
        float stripes = sin(vUv.y * 46.0 - uTime * 9.0 + sin(vUv.x * 23.0) * 2.0);
        float foam = smoothstep(0.3, 1.0, stripes) * 0.6 + smoothstep(0.75, 1.0, vUv.y) * 0.5;
        vec3 water = mix(lin(vec3(0.12, 0.2, 0.4)), lin(vec3(0.55, 0.85, 0.95)), uDay);
        vec3 white = mix(lin(vec3(0.55, 0.62, 0.9)), vec3(1.0), uDay);
        vec3 col = mix(water, white, clamp(foam, 0.0, 1.0));
        float side = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        gl_FragColor = vec4(col, 0.88 * side);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  const fall = new THREE.Mesh(geometry, material);
  fall.renderOrder = 2;
  kit.scene.add(fall);
  kit.ticks.push((t) => (uniforms.uTime.value = t));
  kit.night.hooks.push((night) => (uniforms.uDay.value = 1 - night));

  // pedras emoldurando a queda
  const rand = seeded(5);
  const rock = shared(new THREE.DodecahedronGeometry(1, 0));
  for (let i = 0; i < 14; i++) {
    const k = rand();
    const x = x0 + (x1 - x0) * k;
    const side = i % 2 ? 1 : -1;
    const z = z0 + side * (width / 2 + 0.6 + rand() * 1.2);
    const m = mesh(kit.statics, rock, lambert(i % 3 ? '#8f8c86' : '#77756f'), [
      x,
      terrainHeight(x, z) + 0.2,
      z,
    ]);
    m.scale.set(0.9 + rand() * 1.2, 0.8 + rand() * 1.4, 0.9 + rand());
    m.rotation.set(rand(), rand() * 6, rand());
  }
  // espuma e névoa lá embaixo
  const foot = new THREE.Vector3(x1 + 0.6, WATER_Y + 0.2, z0);
  let next = 0;
  kit.ticks.push((t) => {
    if (t < next) return;
    next = t + (kit.env.mobile ? 0.12 : 0.06);
    kit.particles.spawn(
      [foot.x + Math.random() * 1.2, foot.y, foot.z + (Math.random() - 0.5) * width * 0.8],
      {
        color: '#ffffff',
        velocity: [0.8 + Math.random(), 1 + Math.random() * 1.4, (Math.random() - 0.5) * 0.8],
        size: 0.22,
        grow: 2.4,
        life: 1.1,
        opacity: 0.55,
      },
    );
  });
};

/* ------------------------------------------------------------------ pontes */

export const bridges = (kit: Kit) => {
  BRIDGES.forEach((bridge) => {
    const g = new THREE.Group();
    g.position.set(bridge.x, 0, bridge.z);
    g.rotation.y = bridge.angle;
    kit.statics.add(g);
    const logs = !bridge.flat && bridge.width < 2.4;
    const step = logs ? 0.42 : 0.5;
    const deckColors = ['#a8794a', '#94683d', '#9e7044'];
    let i = 0;
    for (let along = -bridge.length / 2 + step / 2; along < bridge.length / 2; along += step, i++) {
      const y = bridgeDeck(bridge, along);
      const slope = (bridgeDeck(bridge, along + 0.1) - bridgeDeck(bridge, along - 0.1)) / 0.2;
      if (logs) {
        const log = mesh(
          g,
          shared(new THREE.CylinderGeometry(0.2, 0.2, 1, 7)),
          lambert(i % 2 ? '#7a5032' : '#86593a'),
          [0, y - 0.15, along],
        );
        log.scale.y = bridge.width;
        log.rotation.set(-Math.atan(slope), 0, Math.PI / 2, 'YXZ');
      } else {
        const plank = box(
          g,
          [bridge.width, 0.12, step * 0.88],
          [0, y - 0.06, along],
          lambert(deckColors[i % 3]),
        );
        plank.rotation.x = -Math.atan(slope);
      }
    }
    // vigas e corrimão
    const sides = [-bridge.width / 2 + 0.1, bridge.width / 2 - 0.1];
    for (const sx of sides) {
      for (let along = -bridge.length / 2; along <= bridge.length / 2 + 0.01; along += bridge.length / 4) {
        const y = bridgeDeck(bridge, along);
        if (!bridge.flat || Math.abs(along - bridge.length / 2) < 0.1) {
          box(g, [0.16, 1.1, 0.16], [sx, y + 0.45, along], lambert('#6b4423'));
        }
        // estacas descendo até o fundo
        box(g, [0.18, 2.4, 0.18], [sx, y - 1.3, along], lambert('#5a3a20'));
      }
      if (!bridge.flat) {
        const points: THREE.Vector3[] = [];
        for (let k = 0; k <= 8; k++) {
          const along = -bridge.length / 2 + (bridge.length * k) / 8;
          points.push(new THREE.Vector3(sx, bridgeDeck(bridge, along) + 0.95, along));
        }
        for (let k = 0; k < points.length - 1; k++)
          beam(g, points[k], points[k + 1], 0.12, lambert('#7a4a2a'));
      }
    }
    if (bridge.flat) boat(kit, bridge);
  });
};

const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** Barra entre dois pontos locais do pai (corrimão, ripa de cerca). */
export const beam = (
  parent: THREE.Object3D,
  a: THREE.Vector3,
  b: THREE.Vector3,
  thickness: number,
  material: THREE.Material,
  height = thickness,
) => {
  const direction = b.clone().sub(a);
  const m = box(
    parent,
    [thickness, height, direction.length()],
    [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2],
    material,
  );
  m.quaternion.setFromUnitVectors(Z_AXIS, direction.normalize());
  return m;
};

/** Barquinho amarrado no fim do deque do lago. */
const boat = (kit: Kit, deck: (typeof BRIDGES)[number]) => {
  const g = new THREE.Group();
  const s = Math.sin(deck.angle);
  const c = Math.cos(deck.angle);
  const along = deck.length / 2 - 1.2;
  g.position.set(deck.x + s * along + c * 1.9, WATER_Y + 0.05, deck.z + c * along - s * 1.9);
  g.rotation.y = deck.angle;
  live(g);
  kit.scene.add(g);
  const hull = new THREE.Shape();
  hull.moveTo(-0.7, 0.45);
  hull.lineTo(0.7, 0.45);
  hull.lineTo(0.45, -0.1);
  hull.lineTo(-0.45, -0.1);
  hull.closePath();
  const hullGeometry = new THREE.ExtrudeGeometry(hull, { depth: 2.6, bevelEnabled: false });
  hullGeometry.translate(0, 0, -1.3);
  mesh(g, hullGeometry, lambert('#d9534f'));
  box(g, [1.2, 0.06, 0.5], [0, 0.35, 0.3], lambert('#f4e3c1'));
  box(g, [1.2, 0.06, 0.4], [0, 0.35, -0.7], lambert('#f4e3c1'));
  const oar = box(g, [0.08, 0.08, 2.2], [0.5, 0.5, -0.2], lambert('#8a5a34'));
  oar.rotation.y = 0.4;
  kit.ticks.push((t) => {
    g.position.y = WATER_Y + 0.05 + Math.sin(t * 1.4) * 0.05;
    g.rotation.z = Math.sin(t * 1.1) * 0.04;
  });
  kit.obstacles.push({ x: g.position.x, z: g.position.z, r: 1.2 });
};

/* ------------------------------------------------------------------ cercas */

/** Cerca de madeira passando pelos pontos (com colisão). */
export const fence = (kit: Kit, points: [number, number][], color = '#8a5a34', walls = true) => {
  const post = lambert('#6b4423');
  const rail = lambert(color);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const length = Math.hypot(bx - ax, bz - az);
    const count = Math.max(1, Math.round(length / 2.2));
    let prev: THREE.Vector3 | null = null;
    for (let k = 0; k <= count; k++) {
      const x = ax + ((bx - ax) * k) / count;
      const z = az + ((bz - az) * k) / count;
      const y = terrainHeight(x, z);
      box(kit.statics, [0.18, 1.3, 0.18], [x, y + 0.55, z], post);
      const top = new THREE.Vector3(x, y + 0.95, z);
      if (prev) {
        beam(kit.statics, prev, top, 0.09, rail, 0.16);
        beam(kit.statics, prev.clone().setY(prev.y - 0.45), top.clone().setY(top.y - 0.45), 0.09, rail, 0.16);
      }
      prev = top;
    }
    if (walls) kit.walls.push({ ax, az, bx, bz });
  }
};

export type Side = 'n' | 's' | 'e' | 'w';

/** Curral retangular com uma porteira aberta. */
export const pen = (
  kit: Kit,
  rect: { x: number; z: number; w: number; d: number },
  gate: Side,
  gap = 2.8,
) => {
  const x0 = rect.x - rect.w / 2;
  const x1 = rect.x + rect.w / 2;
  const z0 = rect.z - rect.d / 2;
  const z1 = rect.z + rect.d / 2;
  const sides: Record<Side, [[number, number], [number, number]]> = {
    n: [
      [x0, z0],
      [x1, z0],
    ],
    e: [
      [x1, z0],
      [x1, z1],
    ],
    s: [
      [x1, z1],
      [x0, z1],
    ],
    w: [
      [x0, z1],
      [x0, z0],
    ],
  };
  (Object.keys(sides) as Side[]).forEach((side) => {
    const [[ax, az], [bx, bz]] = sides[side];
    if (side !== gate) {
      fence(kit, [
        [ax, az],
        [bx, bz],
      ]);
      return;
    }
    const mx = (ax + bx) / 2;
    const mz = (az + bz) / 2;
    const length = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / length;
    const uz = (bz - az) / length;
    const g1: [number, number] = [mx - (ux * gap) / 2, mz - (uz * gap) / 2];
    const g2: [number, number] = [mx + (ux * gap) / 2, mz + (uz * gap) / 2];
    fence(kit, [[ax, az], g1]);
    fence(kit, [g2, [bx, bz]]);
    // porteira aberta pra fora
    const y = terrainHeight(g1[0], g1[1]);
    const swing = new THREE.Group();
    swing.position.set(g1[0], y, g1[1]);
    swing.rotation.y = Math.atan2(ux, uz) - Math.PI / 2 - 1.2;
    kit.statics.add(swing);
    for (const h of [0.45, 0.95]) box(swing, [gap * 0.9, 0.14, 0.08], [gap * 0.45, h, 0], lambert('#c9a46b'));
    const brace = box(swing, [gap, 0.1, 0.07], [gap * 0.45, 0.7, 0], lambert('#c9a46b'));
    brace.rotation.z = 0.3;
  });
};

/* ----------------------------------------------------------------- plantas */

const CONE = shared(new THREE.ConeGeometry(1, 1, 7));
const BLOB = shared(new THREE.IcosahedronGeometry(1, 1));
const TRUNK = shared(new THREE.CylinderGeometry(0.18, 0.28, 1, 6));

export const pine = (kit: Kit, x: number, z: number, scale = 1) => {
  const g = group(kit, x, z);
  g.scale.setScalar(scale);
  const trunk = mesh(g, TRUNK, lambert('#6b4423'), [0, 0.8, 0]);
  trunk.scale.set(1, 1.6, 1);
  const tones = ['#2f7a45', '#3a8a4f', '#47995a'];
  [
    [1.7, 2.2, 2.0],
    [1.3, 1.9, 3.2],
    [0.85, 1.6, 4.3],
  ].forEach(([r, h, y], i) => {
    const cone = mesh(g, CONE, lambert(tones[i]), [0, y, 0]);
    cone.scale.set(r, h, r);
  });
  kit.obstacles.push({ x, z, r: 0.5 * scale });
};

export const roundTree = (kit: Kit, x: number, z: number, scale = 1, fruit = false, seed = 0) => {
  const g = group(kit, x, z);
  g.scale.setScalar(scale);
  const trunk = mesh(g, TRUNK, lambert('#7a4f2c'), [0, 1.1, 0]);
  trunk.scale.set(1.1, 2.2, 1.1);
  const tones = ['#4fa04a', '#5cb455', '#3f8f40'];
  const blobs: [number, number, number, number][] = [
    [0, 3, 0, 1.6],
    [0.9, 2.6, 0.4, 1.1],
    [-0.8, 2.7, -0.3, 1.15],
    [0.1, 3.7, -0.4, 1.0],
  ];
  blobs.forEach(([bx, by, bz, r], i) => {
    const blob = mesh(g, BLOB, lambert(tones[(i + seed) % 3]), [bx, by, bz]);
    blob.scale.setScalar(r);
  });
  if (fruit) {
    const color = seed % 2 ? '#ff8c2b' : '#e8443a';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + seed;
      box(
        g,
        [0.24, 0.24, 0.24],
        [Math.cos(a) * 1.45, 2.5 + (i % 3) * 0.45, Math.sin(a) * 1.45],
        lambert(color),
      );
    }
  }
  kit.obstacles.push({ x, z, r: 0.55 * scale });
};

/** Ipê roxo florido, com pétalas caindo. */
export const ipe = (kit: Kit, x: number, z: number, scale = 1) => {
  const g = group(kit, x, z);
  g.scale.setScalar(scale);
  const trunk = mesh(g, TRUNK, lambert('#5e4030'), [0, 1.6, 0]);
  trunk.scale.set(1.4, 3.2, 1.4);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const branch = mesh(g, TRUNK, lambert('#5e4030'), [Math.cos(a) * 0.55, 3.6, Math.sin(a) * 0.55]);
    branch.scale.set(0.6, 1.8, 0.6);
    branch.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
  }
  const tones = ['#b56cf0', '#9d4edd', '#d29bff', '#c77dff'];
  const rand = seeded(Math.round(x * 13 + z * 7) + 77);
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const r = rand() * 1.8;
    const blob = mesh(g, BLOB, lambert(tones[i % tones.length]), [
      Math.cos(a) * r,
      4.4 + rand() * 1.4,
      Math.sin(a) * r,
    ]);
    blob.scale.setScalar(1 + rand() * 0.7);
  }
  // tapete de pétalas no chão
  const carpet = new THREE.CircleGeometry(3.4 * scale, 18);
  carpet.rotateX(-Math.PI / 2);
  mesh(kit.statics, carpet, lambert('#c79ae8'), [x, terrainHeight(x, z) + 0.04, z]);
  kit.obstacles.push({ x, z, r: 0.7 * scale });
  let next = 0;
  kit.ticks.push((t) => {
    if (t < next) return;
    next = t + 0.45;
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 2.6 * scale;
    kit.particles.spawn([x + Math.cos(a) * r, g.position.y + 4.2 * scale, z + Math.sin(a) * r], {
      color: Math.random() > 0.5 ? '#d29bff' : '#b56cf0',
      velocity: [0.4 + Math.random() * 0.3, -0.9, 0.2],
      size: 0.13,
      life: 4,
    });
  });
};

export const bush = (kit: Kit, x: number, z: number, scale = 1, flowers = false) => {
  const g = group(kit, x, z);
  g.scale.setScalar(scale);
  [
    [0, 0.45, 0, 0.75],
    [0.55, 0.35, 0.15, 0.55],
    [-0.5, 0.35, -0.1, 0.55],
  ].forEach(([bx, by, bz, r], i) => {
    const blob = mesh(g, BLOB, lambert(i ? '#4f9f45' : '#5bb050'), [bx, by, bz]);
    blob.scale.setScalar(r);
  });
  if (flowers) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(
        g,
        [0.14, 0.14, 0.14],
        [Math.cos(a) * 0.65, 0.65 + (i % 2) * 0.2, Math.sin(a) * 0.5],
        lambert(i % 2 ? '#ff7eb6' : '#ffd166'),
      );
    }
  }
  kit.obstacles.push({ x, z, r: 0.6 * scale });
};

export const rock = (kit: Kit, x: number, z: number, scale = 1, solidRock = true) => {
  const m = mesh(
    kit.statics,
    shared(new THREE.DodecahedronGeometry(1, 0)),
    lambert(scale > 1.2 ? '#8b8984' : '#9d9a92'),
    [x, terrainHeight(x, z) + 0.15 * scale, z],
  );
  m.scale.set(scale, scale * 0.65, scale * 0.9);
  m.rotation.y = x * 3 + z;
  if (solidRock) kit.obstacles.push({ x, z, r: scale * 0.8 });
};

/** Flores e tufos de capim espalhados (instanciados: milhares sem pesar). */
export const meadow = (kit: Kit, flowers: [number, number][], tufts: [number, number][]) => {
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  const stem = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.05, 0.38, 0.05),
    lambert('#3f8f3a'),
    flowers.length,
  );
  const head = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.13, 0),
    new THREE.MeshLambertMaterial({ flatShading: true }),
    flowers.length,
  );
  const palette = ['#ff7eb6', '#ffd166', '#ffffff', '#c4b5fd', '#ff9f68', '#8ec5ff'].map(
    (c) => new THREE.Color(c),
  );
  flowers.forEach(([x, z], i) => {
    const y = terrainHeight(x, z);
    matrix.makeTranslation(x, y + 0.19, z);
    stem.setMatrixAt(i, matrix);
    quaternion.setFromAxisAngle(up, i);
    matrix.compose(position.set(x, y + 0.42, z), quaternion, scale.set(1, 0.7, 1));
    head.setMatrixAt(i, matrix);
    head.setColorAt(i, palette[i % palette.length]);
  });
  kit.scene.add(stem, head);

  const tuft = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.12, 0.55, 3),
    new THREE.MeshLambertMaterial({ flatShading: true }),
    tufts.length * 3,
  );
  const greens = ['#4f9f3f', '#66b84f', '#3f8a37', '#7cc35a'].map((c) => new THREE.Color(c));
  let n = 0;
  tufts.forEach(([x, z], i) => {
    const y = terrainHeight(x, z);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + i;
      quaternion.setFromAxisAngle(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), 0.25);
      matrix.compose(
        position.set(x + Math.cos(a) * 0.12, y + 0.22, z + Math.sin(a) * 0.12),
        quaternion,
        scale.set(1, 0.8 + (k % 2) * 0.4, 1),
      );
      tuft.setMatrixAt(n, matrix);
      tuft.setColorAt(n, greens[(i + k) % greens.length]);
      n++;
    }
  });
  kit.scene.add(tuft);
};

export type Crop = 'milho' | 'girassol' | 'abobora';

/** Roça com fileiras de terra arada. */
export const field = (kit: Kit, rect: { x: number; z: number; w: number; d: number }, crop: Crop) => {
  const rows = Math.floor(rect.d / 1.3);
  const perRow = Math.floor(rect.w / 1.1);
  for (let r = 0; r < rows; r++) {
    const z = rect.z - rect.d / 2 + 0.65 + r * 1.3;
    for (let i = 0; i < perRow; i++) {
      const x = rect.x - rect.w / 2 + 0.55 + i * 1.1;
      const y = terrainHeight(x, z);
      box(kit.statics, [1.15, 0.22, 0.7], [x, y + 0.05, z], lambert('#7a4e2e'));
      const g = new THREE.Group();
      g.position.set(x, y + 0.15, z);
      g.rotation.y = (i * 1.7 + r) % 6;
      kit.statics.add(g);
      if (crop === 'milho') {
        box(g, [0.1, 2.1, 0.1], [0, 1.05, 0], lambert('#6fae3a'));
        for (const [h, a] of [
          [0.7, 0],
          [1.2, 2.1],
          [1.6, 4.2],
        ]) {
          const leaf = box(
            g,
            [0.7, 0.04, 0.16],
            [Math.cos(a) * 0.3, h, Math.sin(a) * 0.3],
            lambert('#7fbf45'),
          );
          leaf.rotation.set(0, -a, 0.5);
        }
        box(g, [0.16, 0.42, 0.16], [0.12, 1.3, 0], lambert('#f2cf5b'));
        box(g, [0.06, 0.25, 0.06], [0, 2.2, 0], lambert('#d8b85a'));
      } else if (crop === 'girassol') {
        g.rotation.y = 0;
        box(g, [0.09, 1.9, 0.09], [0, 0.95, 0], lambert('#5d9a35'));
        box(g, [0.5, 0.04, 0.18], [0.2, 0.9, 0], lambert('#6fae3a'));
        const flower = new THREE.Group();
        flower.position.set(0, 1.95, 0.08);
        flower.rotation.x = -0.25;
        g.add(flower);
        const petals = mesh(
          flower,
          shared(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 10)),
          lambert('#ffcf33'),
        );
        petals.rotation.x = Math.PI / 2;
        const center = mesh(
          flower,
          shared(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8)),
          lambert('#6b3f1d'),
          [0, 0, 0.03],
        );
        center.rotation.x = Math.PI / 2;
      } else {
        const pumpkin = mesh(g, BLOB, lambert(i % 4 === 1 ? '#f7a440' : '#f08a24'), [0, 0.28, 0]);
        pumpkin.scale.set(0.45, 0.34, 0.45);
        box(g, [0.06, 0.2, 0.06], [0, 0.66, 0], lambert('#5d7a2a'));
        const leaf = box(g, [0.5, 0.04, 0.4], [0.4, 0.12, 0.2], lambert('#5d9a35'));
        leaf.rotation.y = 0.6;
      }
    }
  }
  if (crop !== 'abobora') {
    // a roça alta não deixa atravessar: cerca invisível em volta
    kit.walls.push(
      { ax: rect.x - rect.w / 2, az: rect.z - rect.d / 2, bx: rect.x + rect.w / 2, bz: rect.z - rect.d / 2 },
      { ax: rect.x + rect.w / 2, az: rect.z - rect.d / 2, bx: rect.x + rect.w / 2, bz: rect.z + rect.d / 2 },
      { ax: rect.x + rect.w / 2, az: rect.z + rect.d / 2, bx: rect.x - rect.w / 2, bz: rect.z + rect.d / 2 },
      { ax: rect.x - rect.w / 2, az: rect.z + rect.d / 2, bx: rect.x - rect.w / 2, bz: rect.z - rect.d / 2 },
    );
  }
};

/** Serras lá longe, sumindo na névoa. */
export const farHills = (kit: Kit) => {
  const rand = seeded(17);
  const tones = ['#5b8a63', '#4f7d5f', '#678f6a'];
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 + rand() * 0.15;
    const r = 300 + rand() * 60;
    const h = 22 + rand() * 26;
    const m = mesh(kit.statics, BLOB, lambert(tones[i % 3]), [Math.cos(a) * r, 16, Math.sin(a) * r]);
    m.scale.set(h * 2.4, h, h * 1.8);
    m.rotation.y = rand() * 6;
  }
};

/** Pedra-caminho no meio do gramado (decoração). */
export const steppingStones = (kit: Kit, points: [number, number][]) => {
  points.forEach(([x, z], i) => {
    const m = mesh(
      kit.statics,
      shared(new THREE.CylinderGeometry(0.45, 0.5, 0.15, 7)),
      lambert(i % 2 ? '#b5b0a5' : '#a7a297'),
      [x, groundHeight(x, z) + 0.04, z],
    );
    m.rotation.y = i;
  });
};

export const glowStone = (kit: Kit, x: number, z: number, color: string) =>
  box(kit.statics, [0.2, 0.2, 0.2], [x, terrainHeight(x, z) + 0.15, z], glow(color));

/** Folhinhas e espuma descendo o riacho com a correnteza. */
const driftingBits = (kit: Kit) => {
  const cumulative = [0];
  for (let i = 1; i < STREAM_PATH.length; i++) {
    const [ax, az] = STREAM_PATH[i - 1];
    const [bx, bz] = STREAM_PATH[i];
    cumulative.push(cumulative[i - 1] + Math.hypot(bx - ax, bz - az));
  }
  const total = cumulative[cumulative.length - 1];
  const count = kit.env.mobile ? 36 : 60;
  const bits = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.28, 0.03, 0.2),
    new THREE.MeshLambertMaterial({ flatShading: true }),
    count,
  );
  const colors = ['#ffffff', '#e8f6ff', '#7fbf45', '#d9a441', '#ffffff', '#b56cf0'].map(
    (c) => new THREE.Color(c),
  );
  const seeds = Array.from({ length: count }, (_, i) => ({
    start: (i / count) * total,
    across: (Math.random() - 0.5) * 1.6 * STREAM_HALF,
    speed: 1.6 + Math.random() * 0.8,
    spin: Math.random() * 6,
    scale: i % 6 < 2 ? 0.7 + Math.random() * 0.6 : 1,
  }));
  seeds.forEach((_, i) => bits.setColorAt(i, colors[i % colors.length]));
  bits.frustumCulled = false;
  kit.scene.add(bits);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  let segment = 0;
  kit.ticks.push((t) => {
    seeds.forEach((seed, i) => {
      const d = (seed.start + t * seed.speed) % total;
      segment = 0;
      let lo = 0;
      let hi = cumulative.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (cumulative[mid] <= d) lo = mid;
        else hi = mid;
      }
      segment = lo;
      const [ax, az] = STREAM_PATH[segment];
      const [bx, bz] = STREAM_PATH[segment + 1];
      const k = (d - cumulative[segment]) / (cumulative[segment + 1] - cumulative[segment] || 1);
      const tx = bx - ax;
      const tz = bz - az;
      const length = Math.hypot(tx, tz) || 1;
      const wobble = Math.sin(t * 1.3 + i) * 0.25;
      position.set(
        ax + tx * k + (-tz / length) * (seed.across + wobble),
        WATER_Y + 0.04,
        az + tz * k + (tx / length) * (seed.across + wobble),
      );
      quaternion.setFromEuler(euler.set(0, seed.spin + t * 0.6, 0));
      matrix.compose(position, quaternion, scale.setScalar(seed.scale));
      bits.setMatrixAt(i, matrix);
    });
    bits.instanceMatrix.needsUpdate = true;
  });
};

/** Salgueiro-chorão: fica lindo na beira d'água, com os galhos caindo. */
export const willow = (kit: Kit, x: number, z: number, scale = 1) => {
  const g = group(kit, x, z);
  g.scale.setScalar(scale);
  g.rotation.y = x * 0.37 + z;
  const trunk = mesh(
    g,
    shared(new THREE.CylinderGeometry(0.28, 0.4, 3.4, 6)),
    lambert('#6b4a33'),
    [0, 1.7, 0],
  );
  trunk.rotation.z = 0.08;
  const crown = mesh(g, shared(new THREE.IcosahedronGeometry(1, 0)), lambert('#7fbf55'), [0, 3.9, 0]);
  crown.scale.set(2.3, 1.2, 2.3);
  const strand = lambert('#8fcc5f');
  const dark = lambert('#6aa848');
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 1.7 + (i % 3) * 0.35;
    const h = 1.8 + ((i * 7) % 5) * 0.35;
    box(g, [0.38, h, 0.38], [Math.cos(a) * r, 4.1 - h / 2, Math.sin(a) * r], i % 2 ? strand : dark);
  }
  kit.obstacles.push({ x, z, r: 0.45 * scale });
};
