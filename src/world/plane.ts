import * as THREE from 'three';
import { SKY_CEILING, SKY_RADIUS, WATER_Y, canStand, groundHeight, terrainHeight } from './terrain';
import { bake, box, collide, glow, halo, keep, lambert, mesh, shared, type Kit } from './props';
import { canvasTexture, makeCanvas, TEXT_FONT } from './textures';

/**
 * O teco-teco do aeroporto: um biplano roxo e amarelo de cabine aberta.
 * No chão ele taxia (W acelera, S freia, A/D vira); passando da velocidade
 * de decolagem, segurar W tira ele do chão. No ar, W sobe, S desce e A/D
 * inclina pra fazer a curva. Encostando no chão firme devagar, ele pousa.
 */

const CYL = shared(new THREE.CylinderGeometry(1, 1, 1, 12));
const CYL8 = shared(new THREE.CylinderGeometry(1, 1, 1, 8));
const CONE = shared(new THREE.ConeGeometry(1, 1, 10));

/** Velocidade (m/s) em que ele já sustenta no ar. */
export const TAKEOFF_SPEED = 19;
const TAXI_MAX = 34;
const CRUISE = 30;
const BOOST = 46;

/** O que aconteceu nesse quadro (o motor transforma em som e recadinho). */
export type PlaneEvent = 'takeoff' | 'landed' | 'bump' | 'far' | null;

/** Letreiro com o nome pintado na lateral. */
const nameTexture = () => {
  const { canvas, ctx } = makeCanvas(512, 128);
  ctx.font = `800 92px ${TEXT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd166';
  ctx.fillText('PP-DAV', 256, 68);
  return canvasTexture(canvas);
};

export class Plane {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private prop = new THREE.Group();
  private blur: THREE.Mesh;
  private blurMaterial: THREE.MeshBasicMaterial;
  private beam: THREE.Mesh;
  private beamMaterial: THREE.MeshBasicMaterial;
  private strobe: THREE.Mesh;
  private shadow: THREE.Mesh;
  private shadowMaterial: THREE.MeshBasicMaterial;
  x: number;
  z: number;
  /** Altura absoluta das rodas. */
  alt = 0;
  angle: number;
  pitch = 0;
  roll = 0;
  speed = 0;
  /** Quanto está virando (pra cabeça do piloto acompanhar). */
  steer = 0;
  grounded = true;
  ridden = false;
  /** Fumaça colorida ligada (botão B / espaço). */
  smoke = false;
  /** 0 a 1: quanto o motor está acelerado (pro som). */
  throttle = 0;
  readonly radius = 2.6;
  /** Sombrinha desenhada no chão (no celular, que não tem sombra de verdade). */
  blobShadow = true;
  private spin = 0;
  private nextPuff = 0;
  private smokeIndex = 0;
  private farSaid = false;
  private bumpAt = 0;

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
    const deep = lambert('#5b21b6');
    const yellow = lambert('#ffd166');
    const dark = lambert('#2b2b33');
    const metal = lambert('#a0a4ac');

    // fuselagem (afina até a cauda)
    box(b, [1.3, 1.25, 4.4], [0, 1.65, 0.4], purple);
    box(b, [1.02, 1.0, 2.2], [0, 1.75, -2.8], purple);
    box(b, [0.62, 0.7, 1.5], [0, 1.85, -4.55], purple);
    box(b, [1.34, 0.18, 4.42], [0, 1.25, 0.4], deep);
    // faixa amarela nas laterais
    for (const side of [-1, 1]) {
      box(b, [0.04, 0.16, 4.2], [side * 0.66, 1.85, 0.4], yellow);
      box(b, [0.04, 0.14, 2.1], [side * 0.52, 1.95, -2.8], yellow);
    }
    // cabine aberta com para-brisa e o encosto do banco
    box(b, [1.0, 0.1, 1.3], [0, 2.29, -0.35], dark);
    const shield = new THREE.MeshLambertMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.45 });
    const windscreen = box(b, [0.95, 0.5, 0.05], [0, 2.52, 0.42], shield);
    windscreen.rotation.x = -0.45;
    box(b, [0.8, 0.5, 0.12], [0, 2.4, -1.05], lambert('#3b2a1a'));
    // capô do motor, hélice e o bico
    const cowl = mesh(b, CYL8, lambert('#3a3a44'), [0, 1.6, 2.95]);
    cowl.scale.set(0.78, 0.95, 0.78);
    cowl.rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pot = box(b, [0.24, 0.24, 0.5], [Math.cos(a) * 0.72, 1.6 + Math.sin(a) * 0.72, 2.95], metal);
      pot.rotation.z = a;
    }
    const spinner = mesh(b, CONE, yellow, [0, 1.6, 3.7]);
    spinner.scale.set(0.3, 0.5, 0.3);
    spinner.rotation.x = Math.PI / 2;
    this.prop.position.set(0, 1.6, 3.48);
    b.add(keep(this.prop));
    box(this.prop, [0.18, 2.9, 0.06], [0, 0, 0], lambert('#5a3a20'));
    box(this.prop, [0.2, 0.25, 0.07], [0, 1.35, 0], yellow);
    box(this.prop, [0.2, 0.25, 0.07], [0, -1.35, 0], yellow);
    this.blurMaterial = new THREE.MeshBasicMaterial({
      color: '#e8e4f0',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.blur = keep(mesh(b, shared(new THREE.CircleGeometry(1.45, 20)), this.blurMaterial, [0, 1.6, 3.5]));
    // asas (de baixo e de cima) com as pontas roxas
    box(b, [9.6, 0.16, 1.6], [0, 1.05, 1.0], yellow);
    box(b, [10.4, 0.16, 1.7], [0, 3.35, 1.2], yellow);
    for (const side of [-1, 1]) {
      box(b, [0.8, 0.18, 1.62], [side * 4.45, 1.05, 1.0], purple);
      box(b, [0.8, 0.18, 1.72], [side * 4.85, 3.35, 1.2], purple);
      // montantes entre as asas
      for (const sz of [0.6, 1.55]) box(b, [0.1, 2.3, 0.1], [side * 3.8, 2.2, sz], dark);
      const brace = box(b, [0.06, 2.6, 0.06], [side * 3.8, 2.2, 1.08], dark);
      brace.rotation.x = 0.36;
      // montantes da cabane (asa de cima até a fuselagem)
      const cabane = box(b, [0.08, 1.15, 0.08], [side * 0.55, 2.78, 1.3], dark);
      cabane.rotation.z = side * -0.25;
    }
    // cauda
    const fin = box(b, [0.1, 1.45, 1.1], [0, 2.75, -4.75], purple);
    fin.rotation.x = -0.2;
    box(b, [0.12, 0.35, 1.0], [0, 3.15, -4.85], yellow);
    box(b, [3.4, 0.1, 1.0], [0, 1.95, -4.65], yellow);
    for (const side of [-1, 1]) box(b, [0.5, 0.12, 1.02], [side * 1.5, 1.95, -4.65], purple);
    // trem de pouso
    for (const side of [-1, 1]) {
      const leg = box(b, [0.1, 1.0, 0.1], [side * 0.85, 0.85, 1.5], dark);
      leg.rotation.z = side * 0.35;
      const back = box(b, [0.08, 1.0, 0.08], [side * 0.85, 0.85, 1.0], dark);
      back.rotation.set(0.45, 0, side * 0.35);
      const wheel = mesh(b, CYL, lambert('#1c1c22'), [side * 1.05, 0.42, 1.4]);
      wheel.scale.set(0.42, 0.22, 0.42);
      wheel.rotation.z = Math.PI / 2;
      const cap = mesh(b, CYL, yellow, [side * 1.17, 0.42, 1.4]);
      cap.scale.set(0.2, 0.04, 0.2);
      cap.rotation.z = Math.PI / 2;
    }
    box(b, [1.9, 0.08, 0.1], [0, 0.42, 1.4], dark);
    box(b, [0.08, 1.4, 0.08], [0, 0.9, -4.9], dark);
    const tailWheel = mesh(b, CYL, lambert('#1c1c22'), [0, 0.2, -4.95]);
    tailWheel.scale.set(0.2, 0.12, 0.2);
    tailWheel.rotation.z = Math.PI / 2;
    // luzes de navegação: vermelha à esquerda, verde à direita, branca na cauda
    box(b, [0.25, 0.2, 0.3], [5.25, 3.35, 1.2], glow('#ff4d4d'));
    box(b, [0.25, 0.2, 0.3], [-5.25, 3.35, 1.2], glow('#3dff8a'));
    box(b, [0.2, 0.2, 0.2], [0, 1.9, -5.32], glow('#ffffff'));
    halo(this.kit, b, [5.3, 3.35, 1.2], 1.4);
    halo(this.kit, b, [-5.3, 3.35, 1.2], 1.4);
    this.strobe = keep(box(b, [0.22, 0.22, 0.22], [0, 3.55, -4.85], glow('#ff3b3b')));
    // nome nas laterais
    const label = new THREE.MeshBasicMaterial({ map: nameTexture(), transparent: true, depthWrite: false });
    for (const side of [-1, 1]) {
      const plate = keep(mesh(b, shared(new THREE.PlaneGeometry(1, 1)), label, [side * 0.53, 1.55, -2.7]));
      plate.scale.set(2.0, 0.5, 1);
      plate.rotation.y = side * (Math.PI / 2);
      plate.renderOrder = 2;
    }
    // farol de pouso: só de noite
    box(b, [0.3, 0.2, 0.1], [2.2, 1.05, 1.82], lambert('#fff4c8'));
    this.beamMaterial = new THREE.MeshBasicMaterial({
      color: '#fff1b0',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamGeometry = shared(new THREE.ConeGeometry(3, 18, 14, 1, true));
    beamGeometry.translate(0, -9, 0);
    beamGeometry.rotateX(-Math.PI / 2);
    this.beam = keep(mesh(b, beamGeometry, this.beamMaterial, [2.2, 1.05, 1.9]));
    this.beam.rotation.x = 0.12;
    halo(this.kit, b, [2.2, 1.05, 1.95], 1.6);

    this.shadowMaterial = new THREE.MeshBasicMaterial({
      color: '#000',
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(shared(new THREE.PlaneGeometry(1, 1)), this.shadowMaterial);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.scale.set(9, 9.5, 1);
    kit.scene.add(this.shadow);
    bake(b);
    this.alt = groundHeight(x, z);
    this.place(0, 0);
  }

  /** Dá pra descer aqui? (no chão e quase parado) */
  get parked() {
    return this.grounded && Math.abs(this.speed) < 2.5;
  }

  /** Pilota: `up` é W/↑ (+1) ou S/↓ (-1); `turn` é D/→ (+1) ou A/← (-1). */
  drive(dt: number, t: number, ix: number, iz: number, boost: boolean): PlaneEvent {
    const up = Math.max(-1, Math.min(1, -iz));
    const turn = Math.max(-1, Math.min(1, ix));
    const event = this.grounded ? this.taxi(dt, up, turn, boost) : this.fly(dt, t, up, turn, boost);
    this.effects(t, dt);
    this.place(t, dt);
    return event;
  }

  /** Sem ninguém: freia até parar no chão. */
  idle(t: number, dt: number) {
    if (!this.grounded) {
      // ninguém pilotando no ar (não acontece, mas por via das dúvidas): plana até o chão
      this.fly(dt, t, -0.3, 0, false);
    } else {
      this.taxi(dt, 0, 0, false);
    }
    this.throttle += (0 - this.throttle) * Math.min(1, dt * 2);
    this.effects(t, dt);
    this.place(t, dt);
  }

  private taxi(dt: number, up: number, turn: number, boost: boolean): PlaneEvent {
    let target = 0;
    if (up > 0.1) target = TAXI_MAX * (boost ? 1.2 : 1) * up;
    else if (up < -0.1) target = -3;
    const accel = target > this.speed ? (this.speed < 0 ? 9 : 7) : up < -0.1 ? 11 : 3.2;
    this.speed += Math.max(-accel * dt, Math.min(accel * dt, target - this.speed));
    this.throttle += (Math.max(0.25, up > 0.1 ? up : 0.25) - this.throttle) * Math.min(1, dt * 3);
    // vira devagar parado e mais rápido andando; muito rápido fica mais duro
    const fast = Math.max(0, Math.min(1, (Math.abs(this.speed) - 14) / 16));
    const grip = Math.max(0.35, Math.min(1, Math.abs(this.speed) / 5)) * (1 - fast * 0.6);
    const rate = 1.5 * grip * (this.speed < -0.1 ? -1 : 1);
    this.angle -= turn * rate * dt;
    this.steer += (turn * 0.6 - this.steer) * Math.min(1, dt * 6);
    this.roll += (0 - this.roll) * Math.min(1, dt * 6);

    const nx = this.x + Math.sin(this.angle) * this.speed * dt;
    const nz = this.z + Math.cos(this.angle) * this.speed * dt;
    if (canStand(nx, nz, 1.0)) {
      this.x = nx;
      this.z = nz;
    } else this.speed *= -0.2;
    if (collide(this.kit, this, 2.0)) this.speed *= 0.7;
    this.alt = groundHeight(this.x, this.z);

    if (this.speed > TAKEOFF_SPEED && up > 0.2) {
      this.grounded = false;
      this.pitch = Math.max(this.pitch, 0.12);
      this.alt += 0.15;
      return 'takeoff';
    }
    return null;
  }

  private fly(dt: number, t: number, up: number, turn: number, boost: boolean): PlaneEvent {
    let event: PlaneEvent = null;
    const cruise = boost ? BOOST : CRUISE;
    // subir gasta velocidade, mergulhar ganha
    const target = cruise - this.pitch * 16;
    this.speed += (target - this.speed) * Math.min(1, dt * 0.7);
    this.throttle += ((boost ? 1 : 0.75) - this.throttle) * Math.min(1, dt * 2);
    let pitchTarget = up * 0.55;
    if (this.alt > SKY_CEILING) pitchTarget = Math.min(pitchTarget, -0.15);
    if (this.speed < 17) pitchTarget = Math.min(pitchTarget, -0.2);
    this.pitch += (pitchTarget - this.pitch) * Math.min(1, dt * 2.2);
    let rollTarget = turn * 0.85;
    // longe demais: faz a curva sozinho de volta pro sítio
    const far = Math.hypot(this.x, this.z) > SKY_RADIUS;
    if (far) {
      const home = Math.atan2(-this.x, -this.z);
      const diff = Math.atan2(Math.sin(home - this.angle), Math.cos(home - this.angle));
      rollTarget = Math.max(-0.7, Math.min(0.7, -diff * 1.5));
      if (!this.farSaid) event = 'far';
      this.farSaid = true;
    } else if (Math.hypot(this.x, this.z) < SKY_RADIUS - 30) this.farSaid = false;
    this.roll += (rollTarget - this.roll) * Math.min(1, dt * 2.5);
    this.angle -= this.roll * 1.2 * dt;
    this.steer += (turn * 0.6 - this.steer) * Math.min(1, dt * 4);

    const flat = Math.cos(this.pitch) * this.speed * dt;
    this.x += Math.sin(this.angle) * flat;
    this.z += Math.cos(this.angle) * flat;
    this.alt += Math.sin(this.pitch) * this.speed * dt;
    this.alt = Math.min(this.alt, SKY_CEILING + 10);

    const floor = Math.max(terrainHeight(this.x, this.z), WATER_Y);
    if (this.alt < floor + 0.05) {
      const firm = canStand(this.x, this.z, 1.0) && terrainHeight(this.x, this.z) > WATER_Y;
      if (firm && this.pitch < 0.35 && Math.abs(this.roll) < 0.6) {
        // pousou: as rodas encostam e ele vira carro de novo
        this.grounded = true;
        this.alt = groundHeight(this.x, this.z);
        this.speed = Math.min(this.speed, 26);
        this.kit.particles.burst([this.x, this.alt + 0.3, this.z], ['#e9dcc2', '#d9c29a', '#ffffff'], 18, 3);
        return 'landed';
      }
      // chão ruim (água, serra, de lado): quica e sobe de novo
      this.alt = floor + 0.05;
      this.pitch = Math.max(this.pitch, 0.3);
      this.roll *= 0.5;
      this.speed *= 0.92;
      const water = floor <= WATER_Y + 0.01;
      this.kit.particles.burst(
        [this.x, floor + 0.3, this.z],
        water ? ['#ffffff', '#9be7ff', '#cdeeff'] : ['#e9dcc2', '#8a7a5a'],
        16,
        3,
      );
      if (t > this.bumpAt) event = 'bump';
      this.bumpAt = t + 2;
    }
    return event;
  }

  /** Hélice, fumaça e luzes. */
  private effects(t: number, dt: number) {
    const rpm = this.ridden ? 8 + this.throttle * 50 : this.throttle * 20;
    this.spin += rpm * dt;
    this.prop.rotation.z = this.spin;
    this.blurMaterial.opacity = Math.min(0.28, Math.max(0, (rpm - 12) / 120));
    this.strobe.visible = Math.sin(t * 7) > 0.6;
    const night = this.kit.env.night;
    this.beam.visible = night > 0.25 && this.ridden;
    this.beamMaterial.opacity = 0.14 * night;

    if (t < this.nextPuff) return;
    const s = Math.sin(this.angle);
    const c = Math.cos(this.angle);
    if (this.smoke && !this.grounded) {
      // fumaça colorida saindo da cauda
      this.nextPuff = t + (this.kit.env.mobile ? 0.05 : 0.03);
      const colors = ['#a78bfa', '#ffd166', '#ffffff', '#ff7eb6'];
      const color = colors[Math.floor(this.smokeIndex++ / 6) % colors.length];
      this.kit.particles.spawn([this.x - s * 5.2, this.alt + 1.9, this.z - c * 5.2], {
        color,
        velocity: [(Math.random() - 0.5) * 0.6, 0.3, (Math.random() - 0.5) * 0.6],
        size: 0.55,
        grow: 4,
        life: 2.6,
        opacity: 0.8,
      });
    } else if (this.ridden && this.grounded && Math.abs(this.speed) > 4) {
      // poeira das rodas no chão
      this.nextPuff = t + 0.07;
      for (const side of [-1.05, 1.05]) {
        const px = this.x + s * 1.2 + c * side;
        const pz = this.z + c * 1.2 - s * side;
        this.kit.particles.spawn([px, groundHeight(px, pz) + 0.2, pz], {
          color: '#d9cfbd',
          velocity: [(Math.random() - 0.5) * 1.2, 0.8 + Math.random(), (Math.random() - 0.5) * 1.2],
          size: 0.25,
          grow: 2.4,
          life: 0.7,
          opacity: 0.6,
        });
      }
    } else if (this.ridden) {
      // fumacinha do escapamento com o motor ligado
      this.nextPuff = t + 0.18;
      this.kit.particles.spawn([this.x + s * 2.6 + c * 0.8, this.alt + 1.3, this.z + c * 2.6 - s * 0.8], {
        color: '#9a96a8',
        velocity: [c * 0.6, 0.6, -s * 0.6],
        size: 0.16,
        grow: 2,
        life: 0.8,
        opacity: 0.6,
      });
    }
  }

  private place(t: number, dt: number) {
    void dt;
    const s = Math.sin(this.angle);
    const c = Math.cos(this.angle);
    let pitch = this.pitch;
    let roll = this.roll;
    if (this.grounded) {
      // no chão: acompanha a ladeira (rodas da frente e da cauda)
      const front = groundHeight(this.x + s * 1.4, this.z + c * 1.4);
      const back = groundHeight(this.x - s * 4.9, this.z - c * 4.9);
      const left = groundHeight(this.x + c * 1.1, this.z - s * 1.1);
      const right = groundHeight(this.x - c * 1.1, this.z + s * 1.1);
      this.alt = Math.max(front, (front + back) / 2);
      pitch = Math.atan2(front - back, 6.3);
      roll = Math.atan2(left - right, 2.2) * 0.5;
      this.pitch = pitch;
      // tremidinha do motor
      this.body.position.y = Math.sin(t * 31) * 0.012 * (this.ridden ? 1 : 0);
    } else {
      this.body.position.y = Math.sin(t * 2.1) * 0.06;
    }
    this.root.position.set(this.x, this.alt, this.z);
    this.root.rotation.set(0, this.angle, 0);
    this.root.rotateX(-pitch);
    this.root.rotateZ(roll);
    // sombra no chão: some com a altura
    const floor = Math.max(terrainHeight(this.x, this.z), WATER_Y);
    const height = this.alt - floor;
    this.shadow.position.set(this.x, floor + 0.08, this.z);
    this.shadow.rotation.z = this.angle;
    this.shadow.scale.set(9 * Math.cos(roll), 9.5, 1);
    this.shadowMaterial.opacity = 0.22 * Math.max(0, 1 - height / 40);
    this.shadow.visible = this.blobShadow && height < 40;
  }

  /** Onde a pessoa senta (no mundo). */
  seatPosition(target: THREE.Vector3) {
    this.root.updateMatrixWorld(true);
    return target.set(0, 0.83, -0.45).applyMatrix4(this.root.matrixWorld);
  }

  /** Direção do nariz (pra câmera de perseguição). */
  forward(target: THREE.Vector3) {
    return target
      .set(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), -this.pitch)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.angle);
  }

  /** Leva o avião de volta pra vaga (quando a pessoa some com ele). */
  park(x: number, z: number, angle: number) {
    this.x = x;
    this.z = z;
    this.angle = angle;
    this.speed = 0;
    this.pitch = this.roll = 0;
    this.grounded = true;
    this.alt = groundHeight(x, z);
  }
}
