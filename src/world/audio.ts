/** Efeitos sonoros 8-bit feitos na hora com Web Audio (nenhum arquivo). */
let ctx: AudioContext | null = null;
let muted = false;

export const unlockAudio = () => {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
};

export const setMuted = (value: boolean) => {
  muted = value;
};

/** O contexto de áudio (depois do primeiro clique), pra música de fundo. */
export const audioContext = () => ctx;

const tone = (freq: number, at: number, duration: number, type: OscillatorType = 'square', volume = 0.05) => {
  if (!ctx || muted) return;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
};

const slide = (
  from: number,
  to: number,
  duration: number,
  volume = 0.04,
  type: OscillatorType = 'square',
  at = 0,
) => {
  if (!ctx || muted) return;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
};

export const sfx = {
  start: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.16)),
  visit: () => {
    tone(784, 0, 0.1);
    tone(1175, 0.09, 0.18);
  },
  collect: () => [988, 1319, 1568, 1976].forEach((f, i) => tone(f, i * 0.05, 0.1, 'square', 0.04)),
  open: () => tone(660, 0, 0.08, 'triangle', 0.08),
  close: () => tone(440, 0, 0.08, 'triangle', 0.08),
  jump: () => slide(300, 700, 0.18),
  /** Buzina do bugue: fon-fon! */
  horn: () => {
    tone(392, 0, 0.16, 'square', 0.05);
    tone(330, 0, 0.16, 'square', 0.04);
    tone(392, 0.2, 0.22, 'square', 0.05);
    tone(330, 0.2, 0.22, 'square', 0.04);
  },
  engine: () => slide(90, 180, 0.5, 0.05, 'sawtooth'),
  neigh: () => {
    slide(700, 1300, 0.18, 0.035, 'sawtooth');
    slide(1300, 600, 0.5, 0.035, 'sawtooth', 0.18);
  },
  moo: () => slide(190, 120, 0.9, 0.05, 'sawtooth'),
  oink: () => {
    slide(380, 240, 0.12, 0.05, 'square');
    slide(380, 220, 0.14, 0.05, 'square', 0.16);
  },
  baa: () => {
    [0, 0.07, 0.14, 0.21, 0.28].forEach((at, i) =>
      slide(520 + (i % 2) * 40, 480, 0.08, 0.035, 'sawtooth', at),
    );
  },
  bark: () => {
    slide(620, 300, 0.1, 0.05, 'square');
    slide(640, 280, 0.1, 0.05, 'square', 0.16);
  },
  /** Sineta de brinquedo do parque. */
  ride: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.14, 'triangle', 0.06)),
  /** Grito de alegria na descida: um "uiii" que cai. */
  whee: () => slide(900, 380, 0.7, 0.03, 'triangle'),
  /** Morador puxando conversa: um "hm-hm" de dois tons. */
  talk: () => {
    tone(587, 0, 0.09, 'triangle', 0.06);
    tone(784, 0.1, 0.12, 'triangle', 0.06);
  },
  /** Peixe beliscando a isca. */
  bite: () => [1319, 1568, 1319].forEach((f, i) => tone(f, i * 0.08, 0.08, 'square', 0.04)),
  /** Pegou o peixe! */
  catch: () => [523, 784, 1046, 1568].forEach((f, i) => tone(f, i * 0.08, 0.16, 'triangle', 0.06)),
  /** Decolou! Um "vuuum" subindo. */
  takeoff: () => slide(160, 420, 0.9, 0.04, 'sawtooth'),
  /** Pousou: dois quiques de pneu. */
  touchdown: () => {
    slide(260, 120, 0.12, 0.05, 'square');
    slide(240, 110, 0.12, 0.04, 'square', 0.16);
  },
  /** Remada e respingo. */
  splash: () => {
    slide(1800, 300, 0.22, 0.03, 'sawtooth');
    slide(1200, 200, 0.3, 0.02, 'triangle', 0.05);
  },
  win: () =>
    [523, 659, 784, 1046, 784, 1046, 1319].forEach((f, i) =>
      tone(f, i * 0.12, 0.22, i % 2 ? 'square' : 'triangle'),
    ),
};

/**
 * Ronco contínuo do motor do avião: `level` de 0 a 1 muda o tom e o volume;
 * `null` desliga.
 */
let drone: { osc: OscillatorNode; sub: OscillatorNode; gain: GainNode } | null = null;
export const engineDrone = (level: number | null) => {
  if (!ctx || muted || level === null) {
    if (drone) {
      const { osc, sub, gain } = drone;
      const now = ctx?.currentTime ?? 0;
      gain.gain.setTargetAtTime(0, now, 0.08);
      osc.stop(now + 0.4);
      sub.stop(now + 0.4);
      drone = null;
    }
    return;
  }
  if (!drone) {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    sub.type = 'square';
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    gain.gain.value = 0;
    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain).connect(ctx.destination);
    osc.start();
    sub.start();
    drone = { osc, sub, gain };
  }
  const now = ctx.currentTime;
  drone.osc.frequency.setTargetAtTime(55 + level * 85, now, 0.15);
  drone.sub.frequency.setTargetAtTime(27 + level * 42, now, 0.15);
  drone.gain.gain.setTargetAtTime(0.012 + level * 0.022, now, 0.15);
};
