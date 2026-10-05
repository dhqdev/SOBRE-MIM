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

const slide = (from: number, to: number, duration: number, volume = 0.04) => {
  if (!ctx || muted) return;
  const start = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
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
  win: () =>
    [523, 659, 784, 1046, 784, 1046, 1319].forEach((f, i) =>
      tone(f, i * 0.12, 0.22, i % 2 ? 'square' : 'triangle'),
    ),
};
