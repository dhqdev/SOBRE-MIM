import * as THREE from 'three';
import { glowTexture } from './textures';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Quanto é dia (1), noite (0) e quanto o sol está no horizonte (crepúsculo). */
export const lightFor = (hour: number) => {
  const elevation = Math.sin(((hour - 6) / 12) * Math.PI);
  return {
    elevation,
    day: smoothstep(-0.12, 0.24, elevation),
    twilight: Math.exp(-(elevation * elevation) / 0.03),
  };
};

const C = (hex: string) => new THREE.Color(hex);
const PALETTE = {
  dayTop: C('#2f86e0'),
  dayHorizon: C('#cdeeff'),
  duskTop: C('#3a2d7d'),
  duskHorizon: C('#ff9a66'),
  nightTop: C('#04071a'),
  nightHorizon: C('#1a2756'),
};

/**
 * Céu do sítio: degradê que acompanha a hora de verdade, sol e lua que
 * cruzam o céu, estrelas de noite e as luzes da cena junto.
 */
export class Sky {
  private dome: THREE.Mesh;
  private uniforms: { top: { value: THREE.Color }; horizon: { value: THREE.Color } };
  private sun: THREE.Sprite;
  private moon: THREE.Sprite;
  private stars: THREE.Points;
  private starMaterial: THREE.PointsMaterial;
  readonly hemi: THREE.HemisphereLight;
  readonly sunLight: THREE.DirectionalLight;
  readonly moonLight: THREE.DirectionalLight;
  /** 1 = dia claro, 0 = noite. Lido pelas lâmpadas, janelas e vaga-lumes. */
  day = 1;
  twilight = 0;

  constructor(private scene: THREE.Scene) {
    this.uniforms = { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } };
    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(480, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: this.uniforms,
        vertexShader: /* glsl */ `
          varying float vY;
          void main() {
            vY = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 horizon;
          varying float vY;
          void main() {
            float k = smoothstep(-0.05, 0.55, vY);
            gl_FragColor = vec4(mix(horizon, top, k), 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    scene.add(this.dome);

    this.sun = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture('#fff6d6', 'rgba(255,200,120,0)'),
        fog: false,
        depthWrite: false,
      }),
    );
    this.sun.scale.setScalar(90);
    this.moon = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture('#eef2ff', 'rgba(160,180,255,0)'),
        fog: false,
        depthWrite: false,
      }),
    );
    this.moon.scale.setScalar(46);
    scene.add(this.sun, this.moon);

    const positions: number[] = [];
    for (let i = 0; i < 700; i++) {
      const a = Math.random() * Math.PI * 2;
      const y = 0.12 + Math.random() * 0.88;
      const r = Math.sqrt(1 - y * y);
      positions.push(Math.cos(a) * r * 450, y * 450, Math.sin(a) * r * 450);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      fog: false,
      depthWrite: false,
    });
    this.stars = new THREE.Points(starGeometry, this.starMaterial);
    scene.add(this.stars);

    this.hemi = new THREE.HemisphereLight('#d8ecff', '#4d6b3a', 1.8);
    this.sunLight = new THREE.DirectionalLight('#fff1dc', 2.6);
    this.moonLight = new THREE.DirectionalLight('#9fb4ff', 0.5);
    scene.add(this.hemi, this.sunLight, this.sunLight.target, this.moonLight, this.moonLight.target);
  }

  /** Atualiza tudo pra hora `hour` (0–24), centrado onde a câmera está. */
  update(hour: number, center: THREE.Vector3, t: number) {
    const { elevation, day, twilight } = lightFor(hour);
    this.day = day;
    this.twilight = twilight;

    const top = PALETTE.nightTop
      .clone()
      .lerp(PALETTE.dayTop, day)
      .lerp(PALETTE.duskTop, twilight * 0.75);
    const horizon = PALETTE.nightHorizon
      .clone()
      .lerp(PALETTE.dayHorizon, day)
      .lerp(PALETTE.duskHorizon, twilight * 0.85);
    this.uniforms.top.value.copy(top);
    this.uniforms.horizon.value.copy(horizon);
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(horizon);
    fog.near = 70 + day * 40;
    fog.far = 210 + day * 90;

    // o sol nasce no leste (+x) e se põe no oeste, sempre ao norte da câmera
    const arc = ((hour - 6) / 12) * Math.PI;
    this.sun.position.set(center.x + Math.cos(arc) * 330, center.y + elevation * 230 + 20, center.z - 300);
    const moonArc = arc + Math.PI;
    this.moon.position.set(
      center.x + Math.cos(moonArc) * 300,
      center.y - elevation * 200 + 30,
      center.z - 300,
    );
    this.sun.material.opacity = smoothstep(-0.25, 0.05, elevation);
    this.moon.material.opacity = smoothstep(0.1, -0.2, elevation);
    this.sun.material.color.set(twilight > 0.4 ? '#ffb27a' : '#ffffff');
    this.dome.position.copy(center);
    this.stars.position.copy(center);
    this.stars.rotation.y = t * 0.004;
    this.starMaterial.opacity = (1 - day) * (0.75 + Math.sin(t * 1.3) * 0.15);

    this.hemi.intensity = 0.55 + day * 1.45;
    this.hemi.color.set(day > 0.5 ? '#d8ecff' : '#7d8cff').lerp(C('#ffc49a'), twilight * 0.5);
    this.hemi.groundColor.set(day > 0.5 ? '#4d6b3a' : '#1d2340');
    this.sunLight.intensity = 2.7 * day;
    this.sunLight.color.set('#fff1dc').lerp(C('#ff9a5c'), twilight * 0.8);
    this.sunLight.position.set(
      center.x + Math.cos(arc) * 60,
      center.y + Math.max(8, elevation * 70),
      center.z + 25,
    );
    this.sunLight.target.position.copy(center);
    this.moonLight.intensity = 0.65 * (1 - day);
    this.moonLight.position.set(center.x - Math.cos(arc) * 60, center.y + 60, center.z + 30);
    this.moonLight.target.position.copy(center);
  }
}

/** Hora local de agora, com minutos (ex.: 14.5 = 14h30). */
export const localHour = () => {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
};
