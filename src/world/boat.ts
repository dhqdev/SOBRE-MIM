import * as THREE from 'three';
import { WATER_Y, bridgeAt, waterDistance } from './terrain';
import { bake, box, halo, keep, lambert, mesh, nightGlow, shared, type Kit } from './props';

/** Barquinho a remo: anda no lago e no riacho até as pontes. */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 10));
const MAX_SPEED = 6.5;

/** Dá pra boiar aqui? Longe da margem e fora de baixo das pontes. */
export const floats = (x: number, z: number) => waterDistance(x, z) < -0.85 && !bridgeAt(x, z);

export class Boat {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private oars: THREE.Group[] = [];
  x: number;
  z: number;
  angle: number;
  speed = 0;
  steer = 0;
  y = 0;
  ridden = false;
  readonly radius = 1.3;
  private row = 0;
  private nextWake = 0;
  private push = 0;

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
    const white = lambert('#f4f0ff');
    const purple = lambert('#7c3aed');
    const wood = lambert('#9e7044');
    // casco
    box(b, [1.1, 0.25, 2.6], [0, -0.05, 0], white);
    for (const side of [-1, 1]) {
      const wall = box(b, [0.12, 0.5, 2.7], [side * 0.6, 0.2, 0], white);
      wall.rotation.z = side * -0.12;
      box(b, [0.14, 0.1, 2.75], [side * 0.64, 0.46, 0], purple);
    }
    const bow = box(b, [1.0, 0.55, 0.7], [0, 0.18, 1.45], white);
    bow.rotation.x = -0.35;
    box(b, [1.12, 0.12, 0.2], [0, 0.48, 1.62], purple);
    box(b, [1.15, 0.5, 0.14], [0, 0.2, -1.32], white);
    box(b, [1.2, 0.1, 0.2], [0, 0.46, -1.36], purple);
    // bancos
    box(b, [1.1, 0.1, 0.4], [0, 0.32, -0.15], wood);
    box(b, [1.1, 0.1, 0.35], [0, 0.32, 0.95], wood);
    // lampião na popa: de noite o barco brilha no lago
    box(b, [0.06, 1.1, 0.06], [0.42, 0.85, -1.2], lambert('#3b3350'));
    box(b, [0.22, 0.26, 0.22], [0.42, 1.42, -1.2], nightGlow(this.kit, '#ffd166'));
    halo(kit, b, [0.42, 1.42, -1.2], 1.6);
    // nome pintado
    box(b, [0.02, 0.18, 0.7], [0.67, 0.25, 0.6], lambert('#ffd166'));
    box(b, [0.02, 0.18, 0.7], [-0.67, 0.25, 0.6], lambert('#ffd166'));
    // remos
    for (const side of [-1, 1]) {
      const oar = keep(new THREE.Group());
      oar.position.set(side * 0.66, 0.5, 0.05);
      b.add(oar);
      const shaft = mesh(oar, CYL, wood, [side * 0.6, -0.15, 0]);
      shaft.scale.set(0.04, 1.6, 0.04);
      shaft.rotation.z = side * 1.25;
      box(oar, [0.05, 0.12, 0.38], [side * 1.32, -0.42, 0], wood);
      this.oars.push(oar);
      bake(oar);
    }
    bake(b);
    this.place(0, 0);
  }

  /** Remada forte: respingo e um empurrãozinho. */
  splash() {
    this.push = 1;
    const back = -1.4;
    const px = this.x + Math.sin(this.angle) * back;
    const pz = this.z + Math.cos(this.angle) * back;
    this.kit.particles.burst([px, WATER_Y + 0.1, pz], ['#ffffff', '#9be7ff', '#cdeeff'], 14, 2.2);
  }

  drive(dt: number, t: number, ix: number, iz: number, boost: boolean) {
    const input = Math.min(1, Math.hypot(ix, iz));
    let target = 0;
    let steerTarget = 0;
    if (input > 0.15) {
      const desired = Math.atan2(ix, iz);
      let diff = desired - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      steerTarget = Math.max(-0.7, Math.min(0.7, diff));
      // barco vira até parado (rema de um lado só)
      this.angle += steerTarget * dt * 1.9;
      target = MAX_SPEED * (boost ? 1.3 : 1) * input * (Math.abs(diff) > 1.6 ? 0.35 : 1);
    }
    target += this.push * 4;
    this.push = Math.max(0, this.push - dt * 1.5);
    this.steer += (steerTarget - this.steer) * Math.min(1, dt * 5);
    // na água tudo é mais devagar pra acelerar e pra parar
    this.speed += (target - this.speed) * Math.min(1, dt * (target > this.speed ? 1.1 : 0.7));
    this.move(dt);
    this.row += dt * (2.5 + Math.abs(this.speed) * 0.9) * (input > 0.15 || this.push > 0 ? 1 : 0.2);
    this.wake(t);
    this.place(t, dt);
  }

  idle(t: number, dt: number) {
    this.speed *= Math.max(0, 1 - dt * 0.8);
    this.steer *= Math.max(0, 1 - dt * 2);
    this.move(dt);
    this.wake(t);
    this.place(t, dt);
  }

  private move(dt: number) {
    if (Math.abs(this.speed) < 0.01) return;
    const nx = this.x + Math.sin(this.angle) * this.speed * dt;
    const nz = this.z + Math.cos(this.angle) * this.speed * dt;
    // olha um pouco à frente da proa pra não encalhar na margem
    const probe = Math.sign(this.speed) * 1.3;
    const ok = (x: number, z: number) =>
      floats(x, z) && floats(x + Math.sin(this.angle) * probe, z + Math.cos(this.angle) * probe);
    if (ok(nx, nz)) {
      this.x = nx;
      this.z = nz;
    } else if (ok(nx, this.z)) {
      this.x = nx;
      this.speed *= 0.9;
    } else if (ok(this.x, nz)) {
      this.z = nz;
      this.speed *= 0.9;
    } else this.speed *= -0.3;
  }

  private wake(t: number) {
    if (Math.abs(this.speed) < 1.2 || t < this.nextWake) return;
    this.nextWake = t + (this.kit.env.mobile ? 0.12 : 0.07);
    const back = -1.35;
    for (const side of [-0.45, 0.45]) {
      const px = this.x + Math.sin(this.angle) * back + Math.cos(this.angle) * side;
      const pz = this.z + Math.cos(this.angle) * back - Math.sin(this.angle) * side;
      this.kit.particles.spawn([px, WATER_Y + 0.05, pz], {
        color: '#ffffff',
        velocity: [Math.cos(this.angle) * side * 1.2, 0.25, -Math.sin(this.angle) * side * 1.2],
        size: 0.16,
        grow: 1.8,
        life: 0.9,
        opacity: 0.7,
      });
    }
  }

  private place(t: number, dt: number) {
    void dt;
    this.root.position.set(this.x, WATER_Y - 0.08 + Math.sin(t * 1.6 + this.x) * 0.05, this.z);
    this.root.rotation.set(0, this.angle, 0);
    this.root.rotateX(Math.sin(t * 1.3) * 0.03 - Math.min(0.06, this.speed * 0.008));
    this.root.rotateZ(Math.sin(t * 1.1 + 1) * 0.04 + this.steer * 0.08);
    // remos: giram no tolete quando a pessoa rema
    const stroke = Math.sin(this.row * 2.4);
    this.oars.forEach((oar, i) => {
      const side = i ? 1 : -1;
      oar.rotation.y = stroke * 0.55 * side;
      oar.rotation.z = Math.cos(this.row * 2.4) * 0.18 * side;
    });
  }

  /** Onde a pessoa senta (no mundo). */
  seatPosition(target: THREE.Vector3) {
    this.root.updateMatrixWorld(true);
    return target.set(0, 0.37 - 0.72, -0.15).applyMatrix4(this.root.matrixWorld);
  }

  /** Quanto a pessoa puxa o remo agora (-1 a 1), pra animar os braços. */
  get stroke() {
    return Math.sin(this.row * 2.4);
  }
}
