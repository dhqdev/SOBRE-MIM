import * as THREE from 'three';
import { canStand, groundHeight } from './terrain';
import { bake, box, collide, halo, keep, lambert, mesh, shared, type Kit } from './props';

/** O bugue roxo: dá pra dirigir pelo sítio inteiro (menos dentro d'água). */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 12));
const MAX_SPEED = 17;

export class Buggy {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private wheels: THREE.Group[] = [];
  private steers: THREE.Group[] = [];
  private beams: THREE.Mesh[] = [];
  private beamMaterial: THREE.MeshBasicMaterial;
  private lamp: THREE.MeshBasicMaterial;
  private shadow: THREE.Mesh;
  x: number;
  z: number;
  angle: number;
  speed = 0;
  steer = 0;
  y = 0;
  vy = 0;
  ridden = false;
  readonly radius = 1.45;
  readonly seat = 1.0;
  private spin = 0;
  private nextDust = 0;
  private honkUntil = 0;

  constructor(
    private kit: Kit,
    x: number,
    z: number,
    angle: number,
  ) {
    this.x = x;
    this.z = z;
    this.angle = angle;
    kit.scene.add(this.root);
    this.root.add(this.body);
    const b = this.body;
    const purple = lambert('#7c3aed');
    const dark = lambert('#2b2b33');
    const tube = lambert('#e8e4f0');
    box(b, [1.7, 0.16, 2.9], [0, 0.55, 0], dark);
    box(b, [1.55, 0.4, 0.95], [0, 0.82, 1.0], purple);
    const nose = box(b, [1.5, 0.3, 0.5], [0, 0.72, 1.55], purple);
    nose.rotation.x = 0.35;
    for (const side of [-1, 1]) {
      box(b, [0.1, 0.42, 1.9], [side * 0.84, 0.82, -0.15], purple);
      box(b, [0.14, 0.12, 2.2], [side * 0.86, 1.08, 0.1], lambert('#ffd166'));
    }
    // motor atrás
    box(b, [1.3, 0.6, 0.7], [0, 0.95, -1.15], lambert('#3a3a44'));
    for (const side of [-0.35, 0.35]) {
      const pipe = mesh(b, CYL, lambert('#a0a4ac'), [side, 1.0, -1.55]);
      pipe.scale.set(0.08, 0.35, 0.08);
      pipe.rotation.x = Math.PI / 2;
    }
    // banco e volante
    box(b, [0.75, 0.16, 0.65], [0, 0.85, -0.25], lambert('#1f1f26'));
    box(b, [0.75, 0.75, 0.14], [0, 1.25, -0.58], lambert('#1f1f26'));
    const column = box(b, [0.08, 0.08, 0.6], [0, 1.15, 0.35], dark);
    column.rotation.x = 0.7;
    const wheel = mesh(b, shared(new THREE.TorusGeometry(0.22, 0.04, 5, 14)), dark, [0, 1.35, 0.15]);
    wheel.rotation.x = -0.9;
    // gaiola de proteção
    const cage: [number, number][] = [
      [-0.78, 0.55],
      [0.78, 0.55],
      [-0.78, -0.75],
      [0.78, -0.75],
    ];
    cage.forEach(([cx, cz]) => box(b, [0.09, 1.35, 0.09], [cx, 1.6, cz], tube));
    box(b, [1.65, 0.09, 0.09], [0, 2.28, 0.55], tube);
    box(b, [1.65, 0.09, 0.09], [0, 2.28, -0.75], tube);
    for (const side of [-0.78, 0.78]) box(b, [0.09, 0.09, 1.4], [side, 2.28, -0.1], tube);
    // barra de luz no teto
    for (let i = 0; i < 4; i++) box(b, [0.2, 0.14, 0.14], [-0.45 + i * 0.3, 2.38, 0.55], kit.night.bulbs);
    // faróis
    this.lamp = new THREE.MeshBasicMaterial({ color: '#fff4c8' });
    this.beamMaterial = new THREE.MeshBasicMaterial({
      color: '#fff1b0',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamGeometry = new THREE.ConeGeometry(1.6, 9, 14, 1, true);
    beamGeometry.translate(0, -4.5, 0);
    beamGeometry.rotateX(-Math.PI / 2);
    for (const side of [-0.5, 0.5]) {
      box(b, [0.34, 0.26, 0.1], [side, 0.95, 1.53], this.lamp);
      halo(kit, b, [side, 0.95, 1.65], 1.4);
      const beam = keep(mesh(b, beamGeometry, this.beamMaterial, [side, 0.95, 1.6]));
      beam.rotation.x = -0.12;
      this.beams.push(beam);
    }
    box(b, [0.5, 0.18, 0.06], [0, 0.62, 1.66], lambert('#f4f0ff'));
    // anteninha com bandeira
    box(b, [0.04, 1.6, 0.04], [0.6, 2.0, -1.3], dark);
    const flag = keep(box(b, [0.04, 0.32, 0.5], [0.6, 2.7, -1.55], lambert('#c4b5fd')));
    kit.ticks.push(
      (t) => (flag.rotation.y = Math.sin(t * 6) * 0.25 + Math.min(0.8, Math.abs(this.speed) * 0.05)),
    );
    // rodas grandes
    const wheelSpots: [number, number, boolean][] = [
      [-0.98, 1.05, true],
      [0.98, 1.05, true],
      [-0.98, -1.0, false],
      [0.98, -1.0, false],
    ];
    wheelSpots.forEach(([wx, wz, front]) => {
      const steer = new THREE.Group();
      steer.position.set(wx, 0.52, wz);
      this.root.add(steer);
      const spin = new THREE.Group();
      steer.add(spin);
      const tire = mesh(spin, CYL, lambert('#1c1c22'), [0, 0, 0]);
      tire.scale.set(0.52, 0.44, 0.52);
      tire.rotation.z = Math.PI / 2;
      for (let k = 0; k < 6; k++) {
        const tread = box(spin, [0.46, 0.08, 0.12], [0, 0, 0], lambert('#2a2a32'));
        const a = (k / 6) * Math.PI * 2;
        tread.position.set(0, Math.sin(a) * 0.53, Math.cos(a) * 0.53);
        tread.rotation.x = -a;
      }
      const rim = mesh(spin, CYL, lambert('#ffd166'), [Math.sign(wx) * 0.2, 0, 0]);
      rim.scale.set(0.26, 0.06, 0.26);
      rim.rotation.z = Math.PI / 2;
      this.wheels.push(spin);
      if (front) this.steers.push(steer);
    });
    this.shadow = new THREE.Mesh(
      shared(new THREE.PlaneGeometry(1, 1)),
      new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.25, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.scale.set(2.2, 3.3, 1);
    kit.scene.add(this.shadow);
    bake(this.root);
    this.place(0, 0);
  }

  /** Buzina: pisca os faróis e solta faísca. */
  honk(t: number) {
    this.honkUntil = t + 0.4;
  }

  hop() {
    if (this.y > 0.01) return;
    this.vy = 5.5;
  }

  /** Dirige: vira devagar em direção ao joystick/setas e acelera. */
  drive(dt: number, t: number, ix: number, iz: number, boost: boolean) {
    const input = Math.min(1, Math.hypot(ix, iz));
    let target = 0;
    let steerTarget = 0;
    if (input > 0.15) {
      const desired = Math.atan2(ix, iz);
      let diff = desired - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      steerTarget = Math.max(-0.6, Math.min(0.6, diff));
      const grip = Math.min(1, Math.abs(this.speed) / 5 + 0.35);
      this.angle += steerTarget * dt * 3.2 * grip;
      target = MAX_SPEED * (boost ? 1.25 : 1) * input * (Math.abs(diff) > 2.0 ? 0.45 : 1);
    }
    this.steer += (steerTarget - this.steer) * Math.min(1, dt * 8);
    const rate = target > this.speed ? 1.5 : 2.8;
    this.speed += (target - this.speed) * Math.min(1, dt * rate);

    const nx = this.x + Math.sin(this.angle) * this.speed * dt;
    const nz = this.z + Math.cos(this.angle) * this.speed * dt;
    if (canStand(nx, nz, 0.9)) {
      this.x = nx;
      this.z = nz;
    } else this.speed *= -0.25;
    if (collide(this.kit, this, this.radius)) this.speed *= 0.6;

    // poeira atrás das rodas
    if (Math.abs(this.speed) > 4 && this.y < 0.05 && t > this.nextDust) {
      this.nextDust = t + (this.kit.env.mobile ? 0.09 : 0.05);
      const back = -1.2;
      for (const side of [-0.95, 0.95]) {
        const px = this.x + Math.sin(this.angle) * back + Math.cos(this.angle) * side;
        const pz = this.z + Math.cos(this.angle) * back - Math.sin(this.angle) * side;
        this.kit.particles.spawn([px, groundHeight(px, pz) + 0.2, pz], {
          color: '#d9c29a',
          velocity: [(Math.random() - 0.5) * 1.2, 0.9 + Math.random(), (Math.random() - 0.5) * 1.2],
          size: 0.25,
          grow: 2.2,
          life: 0.7,
          opacity: 0.7,
        });
      }
    }
    this.place(t, dt);
  }

  /** Parado (sem ninguém): só fica no chão. */
  idle(t: number, dt: number) {
    this.speed *= Math.max(0, 1 - dt * 3);
    this.steer *= Math.max(0, 1 - dt * 3);
    if (Math.abs(this.speed) > 0.05) {
      this.x += Math.sin(this.angle) * this.speed * dt;
      this.z += Math.cos(this.angle) * this.speed * dt;
    }
    this.place(t, dt);
  }

  private place(t: number, dt: number) {
    const s = Math.sin(this.angle);
    const c = Math.cos(this.angle);
    const front = groundHeight(this.x + s * 1.1, this.z + c * 1.1);
    const back = groundHeight(this.x - s * 1.1, this.z - c * 1.1);
    const left = groundHeight(this.x - c * 0.9, this.z + s * 0.9);
    const right = groundHeight(this.x + c * 0.9, this.z - s * 0.9);
    const ground = (front + back + left + right) / 4;
    this.vy -= 22 * dt;
    this.y = Math.max(0, this.y + this.vy * dt);
    if (this.y === 0) this.vy = 0;
    this.root.position.set(this.x, ground + this.y, this.z);
    this.root.rotation.set(0, this.angle, 0);
    const pitch = Math.atan2(front - back, 2.2);
    const roll = Math.atan2(right - left, 1.8);
    this.root.rotateX(-pitch);
    this.root.rotateZ(roll);
    const shake = Math.min(1, Math.abs(this.speed) / 10);
    this.body.position.y = Math.sin(t * 23) * 0.025 * shake;
    this.spin += (this.speed * dt) / 0.52;
    this.wheels.forEach((wheel) => (wheel.rotation.x = this.spin));
    this.steers.forEach((steer) => (steer.rotation.y = this.steer));
    this.shadow.position.set(this.x, ground + 0.05, this.z);
    this.shadow.rotation.z = -this.angle;
    const night = this.kit.env.night;
    const flash = t < this.honkUntil && Math.sin(t * 40) > 0;
    this.beamMaterial.opacity = (this.ridden ? 0.16 : 0.06) * night + (flash ? 0.15 : 0);
    this.beams.forEach((beam) => (beam.visible = night > 0.2 || flash));
    this.lamp.color.set(night > 0.3 || flash ? '#fff4c8' : '#d8d2bc');
  }

  /** Onde a pessoa senta (no mundo). */
  seatPosition(target: THREE.Vector3) {
    this.root.updateMatrixWorld(true);
    return target.set(0, 0.22, -0.22).applyMatrix4(this.root.matrixWorld);
  }
}
