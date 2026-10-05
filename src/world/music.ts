import { audioContext } from './audio';

/**
 * Música de fundo e sons da fazenda, tudo sintetizado na hora (sem arquivo):
 * acordes macios, um dedilhado de viola e passarinhos, vento, grilos de noite
 * e de vez em quando um bicho ao longe.
 */

export const TRACKS = [
  { id: 'manha', name: 'Manhã no sítio', emoji: '🌅' },
  { id: 'viola', name: 'Viola na varanda', emoji: '🪕' },
  { id: 'noite', name: 'Noite estrelada', emoji: '🌙' },
] as const;
export type TrackId = (typeof TRACKS)[number]['id'];

interface Song {
  bpm: number;
  /** Acordes (em semitons a partir de A4 = 440), um por compasso. */
  chords: number[][];
  /** Notas da melodia (escala pentatônica, em semitons). */
  scale: number[];
  /** Como o dedilhado anda em cada compasso de 8 colcheias. */
  pattern: number[];
  melody: number;
  pad: number;
  pluck: OscillatorType;
}

const SONGS: Record<TrackId, Song> = {
  // Dó maior: C - Am - F - G, dedilhado leve
  manha: {
    bpm: 74,
    chords: [
      [-21, -17, -14, -9],
      [-24, -21, -17, -12],
      [-28, -24, -21, -16],
      [-26, -22, -19, -14],
    ],
    scale: [3, 5, 7, 10, 12, 15, 17, 19],
    pattern: [0, 2, 1, 3, 2, 1, 3, 2],
    melody: 0.5,
    pad: 0.5,
    pluck: 'triangle',
  },
  // Sol maior: G - Em - C - D, viola caipira (baixo + ponteado)
  viola: {
    bpm: 88,
    chords: [
      [-26, -14, -10, -7],
      [-31, -19, -14, -10],
      [-21, -14, -9, -5],
      [-19, -12, -7, -3],
    ],
    scale: [-2, 0, 2, 5, 7, 10, 12, 14],
    pattern: [0, 2, 3, 2, 1, 2, 3, 2],
    melody: 0.35,
    pad: 0.25,
    pluck: 'sawtooth',
  },
  // Lá menor: Am - F - C - G, devagar, com sininhos
  noite: {
    bpm: 58,
    chords: [
      [-24, -12, -9, -5],
      [-28, -16, -12, -9],
      [-21, -9, -5, -2],
      [-26, -14, -10, -7],
    ],
    scale: [0, 3, 5, 7, 10, 12, 15, 17],
    pattern: [0, -1, 2, -1, 3, -1, 1, -1],
    melody: 0.3,
    pad: 0.8,
    pluck: 'sine',
  },
};

const freq = (semi: number) => 440 * 2 ** (semi / 12);

let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let ambBus: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let timer = 0;
let current: TrackId | null = null;
let ambience = false;
let night = false;
let muted = false;
let nextNote = 0;
let step = 0;
let nextBird = 0;
let nextCricket = 0;
let nextCritter = 0;
let wind: AudioBufferSourceNode | null = null;
let seed = 7;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** Monta a mesa de som na primeira vez (reverb feito de ruído que some). */
const setup = () => {
  const ctx = audioContext();
  if (!ctx) return null;
  if (master) return ctx;
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  reverb = ctx.createConvolver();
  const length = ctx.sampleRate * 3;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6;
  }
  reverb.buffer = impulse;
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  reverb.connect(wet).connect(master);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  musicBus.connect(master);
  musicBus.connect(reverb);
  ambBus = ctx.createGain();
  ambBus.gain.value = 0;
  ambBus.connect(master);
  return ctx;
};

/** Nota com ataque e queda (tipo violão/piano macio). */
const pluck = (
  ctx: AudioContext,
  f: number,
  at: number,
  length: number,
  volume: number,
  type: OscillatorType,
) => {
  const osc = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = f;
  harmonic.type = 'sine';
  harmonic.frequency.value = f * 2;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(type === 'sawtooth' ? 2600 : 3200, at);
  filter.frequency.exponentialRampToValueAtTime(500, at + length);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  const hgain = ctx.createGain();
  hgain.gain.value = 0.25;
  osc.connect(filter);
  harmonic.connect(hgain).connect(filter);
  filter.connect(gain).connect(musicBus!);
  osc.start(at);
  harmonic.start(at);
  osc.stop(at + length + 0.05);
  harmonic.stop(at + length + 0.05);
};

/** Acorde de fundo: osciladores levemente desafinados entrando e saindo devagar. */
const pad = (ctx: AudioContext, notes: number[], at: number, length: number, volume: number) => {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(volume, at + length * 0.35);
  gain.gain.linearRampToValueAtTime(0.0001, at + length + 0.8);
  filter.connect(gain).connect(musicBus!);
  notes.forEach((n, i) => {
    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq(n + 12);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(at);
      osc.stop(at + length + 1);
    }
  });
};

const chime = (ctx: AudioContext, f: number, at: number, volume: number) => {
  for (const [mult, v] of [
    [1, 1],
    [2.76, 0.3],
    [5.4, 0.12],
  ]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f * mult;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume * v, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.2 / mult);
    osc.connect(gain).connect(musicBus!);
    osc.start(at);
    osc.stop(at + 3.4);
  }
};

/* ------------------------------------------------------- sons da fazenda */

const tweet = (ctx: AudioContext, at: number) => {
  const base = 2400 + rand() * 1800;
  const notes = 2 + Math.floor(rand() * 4);
  for (let i = 0; i < notes; i++) {
    const t = at + i * (0.09 + rand() * 0.06);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * (1 + rand() * 0.3), t);
    osc.frequency.exponentialRampToValueAtTime(base * (0.7 + rand() * 0.8), t + 0.07);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.025, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(gain).connect(ambBus!);
    osc.start(t);
    osc.stop(t + 0.1);
  }
};

const cricket = (ctx: AudioContext, at: number) => {
  const f = 4300 + rand() * 600;
  for (let i = 0; i < 3; i++) {
    const t = at + i * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.006, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(gain).connect(ambBus!);
    osc.start(t);
    osc.stop(t + 0.05);
  }
};

/** Um bicho lá longe: galo, vaca ou galinha (abafado, com eco). */
const critter = (ctx: AudioContext, at: number) => {
  const which = rand();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1400;
  const out = ctx.createGain();
  out.gain.value = 0.5;
  filter.connect(out);
  out.connect(ambBus!);
  out.connect(reverb!);
  const voice = (
    from: number,
    to: number,
    t: number,
    length: number,
    volume: number,
    type: OscillatorType,
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + length);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(filter);
    osc.start(t);
    osc.stop(t + length + 0.05);
  };
  if (night) {
    // coruja: hu-huu
    voice(420, 380, at, 0.3, 0.03, 'sine');
    voice(430, 360, at + 0.45, 0.6, 0.03, 'sine');
  } else if (which < 0.35) {
    // galo: có-có-ri-cóóó
    voice(500, 620, at, 0.16, 0.02, 'sawtooth');
    voice(620, 700, at + 0.18, 0.14, 0.02, 'sawtooth');
    voice(760, 900, at + 0.34, 0.2, 0.02, 'sawtooth');
    voice(900, 560, at + 0.56, 0.7, 0.02, 'sawtooth');
  } else if (which < 0.7) {
    voice(190, 120, at, 1.1, 0.03, 'sawtooth');
  } else {
    for (let i = 0; i < 3; i++) voice(700, 520, at + i * 0.16, 0.1, 0.015, 'square');
  }
};

const startWind = (ctx: AudioContext) => {
  if (wind) return;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    // ruído "marrom": grave e macio, parece vento nas folhas
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.2;
  }
  wind = ctx.createBufferSource();
  wind.buffer = buffer;
  wind.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 500;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.value = 0.05;
  // o vento vai e volta
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = 0.07;
  depth.gain.value = 0.035;
  lfo.connect(depth).connect(gain.gain);
  lfo.start();
  wind.connect(filter).connect(gain).connect(ambBus!);
  wind.start();
};

/* ------------------------------------------------------------- agendador */

const tick = () => {
  const ctx = setup();
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const ahead = now + 0.7;
  if (current) {
    const song = SONGS[current];
    const eighth = 60 / song.bpm / 2;
    if (nextNote < now) nextNote = now + 0.1;
    while (nextNote < ahead) {
      const bar = Math.floor(step / 8) % song.chords.length;
      const beat = step % 8;
      const chord = song.chords[bar];
      if (beat === 0 && song.pad > 0) pad(ctx, chord, nextNote, eighth * 8, 0.022 * song.pad);
      const string = song.pattern[beat];
      if (string >= 0) {
        // baixo no tempo forte, o resto do acorde uma oitava acima
        const note = string === 0 ? chord[0] : chord[string] + 12;
        pluck(
          ctx,
          freq(note),
          nextNote,
          eighth * (string === 0 ? 5 : 3),
          string === 0 ? 0.07 : 0.045,
          song.pluck,
        );
      }
      // melodia esparsa por cima
      if ((beat === 0 || beat === 3 || beat === 6) && rand() < song.melody) {
        const note = song.scale[Math.floor(rand() * song.scale.length)];
        if (current === 'noite') chime(ctx, freq(note), nextNote, 0.035);
        else pluck(ctx, freq(note), nextNote, eighth * 6, 0.05, 'triangle');
      }
      step++;
      nextNote += eighth;
    }
  }
  if (ambience) {
    startWind(ctx);
    if (!night && now > nextBird) {
      tweet(ctx, now + 0.2);
      nextBird = now + 1.5 + rand() * 5;
    }
    if (night && now > nextCricket) {
      cricket(ctx, now + 0.1);
      nextCricket = now + 0.25 + rand() * 0.9;
    }
    if (now > nextCritter) {
      if (nextCritter > 0) critter(ctx, now + 0.2);
      nextCritter = now + 14 + rand() * 22;
    }
  }
};

const fade = (bus: GainNode | null, on: boolean) => {
  const ctx = audioContext();
  if (!ctx || !bus) return;
  bus.gain.cancelScheduledValues(ctx.currentTime);
  bus.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.6);
};

const ensureLoop = () => {
  if (!timer && (current || ambience)) timer = window.setInterval(tick, 200);
  tick();
};

export const music = {
  /** Toca uma faixa (ou `null` pra parar). Só funciona depois do primeiro clique na página. */
  play(id: TrackId | null) {
    if (id !== current) step = 0;
    current = id;
    setup();
    fade(musicBus, Boolean(id));
    ensureLoop();
  },
  setAmbience(on: boolean) {
    ambience = on;
    setup();
    fade(ambBus, on);
    ensureLoop();
  },
  setNight(value: boolean) {
    night = value;
  },
  setMuted(value: boolean) {
    muted = value;
    const ctx = audioContext();
    if (ctx && master) master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.1);
  },
  stop() {
    window.clearInterval(timer);
    timer = 0;
    fade(musicBus, false);
    fade(ambBus, false);
  },
};
