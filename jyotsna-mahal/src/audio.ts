// Sound, synthesised: each instrument is a small WebAudio recipe, and content/sounds.kdl composes every sound in the
// game from one of them with a pitch, a loudness, a length and a number of hits. play(id) is all the rest of the shell
// calls. The night's bed (a tanpura-like drone, crickets) runs under everything while a wing is showing.
// Catalog: ## Instruments.
import { C, get, type Sound } from './content';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

/** Audio starts on the first gesture (browsers insist). Safe to call often. */
export function wake() {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return; }
  try {
    ctx = new AudioContext();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch { ctx = null; }
}

type Hit = (c: AudioContext, out: AudioNode, t: number, s: Sound) => void;

const env = (c: AudioContext, t: number, gain: number, attack: number, len: number) => {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.01, len));
  return g;
};
const osc = (c: AudioContext, type: OscillatorType, hz: number) => { const o = c.createOscillator(); o.type = type; o.frequency.value = hz; return o; };
const noise = (c: AudioContext) => { const n = c.createBufferSource(); n.buffer = noiseBuf; n.loop = true; return n; };
const filter = (c: AudioContext, type: BiquadFilterType, hz: number, q = 1) => { const f = c.createBiquadFilter(); f.type = type; f.frequency.value = hz; f.Q.value = q; return f; };
function run(nodes: AudioScheduledSourceNode[], t: number, len: number) { for (const n of nodes) { n.start(t); n.stop(t + len + 0.05); } }

/** The instruments. Each hit is scheduled at time t. */
const INSTRUMENTS: Record<string, Hit> = {
  /** Knuckles on teak: a low thud with a woody click. */
  knock(c, out, t, s) {
    const o = osc(c, 'sine', s.hz), g = env(c, t, s.gain, 0.003, s.len);
    o.frequency.exponentialRampToValueAtTime(s.hz * 0.6, t + s.len);
    const n = noise(c), f = filter(c, 'bandpass', s.hz * 9, 3), gn = env(c, t, s.gain * 0.5, 0.001, 0.03);
    o.connect(g).connect(out); n.connect(f).connect(gn).connect(out); run([o, n], t, s.len);
  },
  /** A soft body sound: a footstep, a heavy shift. */
  thud(c, out, t, s) {
    const o = osc(c, 'sine', s.hz), g = env(c, t, s.gain, 0.005, s.len);
    o.frequency.exponentialRampToValueAtTime(s.hz * 0.5, t + s.len);
    o.connect(g).connect(out); run([o], t, s.len);
  },
  /** Filtered noise: a match, a page, the crickets. */
  noise(c, out, t, s) {
    const n = noise(c), f = filter(c, 'bandpass', s.hz, 1.5), g = env(c, t, s.gain, Math.min(0.05, s.len / 4), s.len);
    if (s.len > 3) { const lfo = osc(c, 'square', 13), lg = c.createGain(); lg.gain.value = s.gain * 0.8; lfo.connect(lg).connect(g.gain); run([lfo], t, s.len); }
    n.connect(f).connect(g).connect(out); run([n], t, s.len);
  },
  /** A jackal: a rising, wavering yip that falls away; several overlap into the chorus. */
  howl(c, out, t, s) {
    for (let v = 0; v < 3; v++) {
      const st = t + v * 0.13, o = osc(c, 'sawtooth', s.hz * (0.8 + v * 0.17)), f = filter(c, 'bandpass', s.hz * 1.5, 4), g = env(c, st, s.gain / 3, 0.06, s.len * (0.7 + v * 0.15));
      o.frequency.setValueAtTime(s.hz * (0.7 + v * 0.1), st);
      o.frequency.exponentialRampToValueAtTime(s.hz * (1.3 + v * 0.12), st + s.len * 0.25);
      o.frequency.exponentialRampToValueAtTime(s.hz * 0.6, st + s.len);
      const vib = osc(c, 'sine', 7 + v), vg = c.createGain(); vg.gain.value = s.hz * 0.04; vib.connect(vg).connect(o.frequency);
      o.connect(f).connect(g).connect(out); run([o, vib], st, s.len);
    }
  },
  /** A tiger far off: low noise, growling, swelling and dying in the trees. */
  roar(c, out, t, s) {
    const n = noise(c), f = filter(c, 'lowpass', s.hz * 4, 2), g = env(c, t, s.gain, s.len * 0.3, s.len);
    const o = osc(c, 'sawtooth', s.hz), og = env(c, t, s.gain * 0.5, s.len * 0.3, s.len);
    const am = osc(c, 'sine', 23), ag = c.createGain(); ag.gain.value = s.gain * 0.4; am.connect(ag).connect(g.gain);
    n.connect(f).connect(g).connect(out); o.connect(filter(c, 'lowpass', s.hz * 3)).connect(og).connect(out); run([n, o, am], t, s.len);
  },
  /** Small bells, bright and quick. */
  bell(c, out, t, s) {
    for (const k of [1, 2.76, 5.4]) { const o = osc(c, 'sine', s.hz * k * (0.98 + Math.random() * 0.04)), g = env(c, t, s.gain / k, 0.002, s.len / k); o.connect(g).connect(out); run([o], t, s.len); }
  },
  /** A clock's bell: struck, with long inharmonic partials. */
  chime(c, out, t, s) {
    for (const k of [0.5, 1, 2.4, 3.0, 4.2]) { const o = osc(c, 'sine', s.hz * k), g = env(c, t, s.gain / (1 + k), 0.004, s.len * (1.2 - k * 0.15)); o.connect(g).connect(out); run([o], t, s.len); }
  },
  /** Metal on metal: a lock, a shutter, a dial. */
  click(c, out, t, s) {
    const n = noise(c), f = filter(c, 'bandpass', s.hz, 6), g = env(c, t, s.gain, 0.001, s.len);
    n.connect(f).connect(g).connect(out); run([n], t, s.len);
  },
  /** The Raja's laugh: "ha" after "ha", a voice through a nose. */
  laugh(c, out, t, s) {
    const o = osc(c, 'sawtooth', s.hz * (0.95 + Math.random() * 0.1)), f1 = filter(c, 'bandpass', 700, 5), f2 = filter(c, 'bandpass', 1200, 6), g = env(c, t, s.gain, 0.015, s.len);
    o.frequency.exponentialRampToValueAtTime(s.hz * 0.85, t + s.len);
    o.connect(f1).connect(g); o.connect(f2).connect(g); g.connect(out); run([o], t, s.len);
  },
  /** A sniff: breath drawn up through the nose. */
  sniff(c, out, t, s) {
    const n = noise(c), f = filter(c, 'bandpass', s.hz, 2), g = env(c, t, s.gain, s.len * 0.6, s.len);
    f.frequency.exponentialRampToValueAtTime(s.hz * 1.6, t + s.len);
    n.connect(f).connect(g).connect(out); run([n], t, s.len);
  },
  /** A puff: a cigar, a harrumph, a snuffed candle. */
  puff(c, out, t, s) {
    const n = noise(c), f = filter(c, 'lowpass', s.hz, 1), g = env(c, t, s.gain, 0.02, s.len);
    n.connect(f).connect(g).connect(out); run([n], t, s.len);
  },
  /** A handkerchief fluttering: fast soft noise beats. */
  flutter(c, out, t, s) {
    const n = noise(c), f = filter(c, 'highpass', s.hz, 1), g = env(c, t, s.gain, 0.02, s.len);
    const am = osc(c, 'square', 24), ag = c.createGain(); ag.gain.value = s.gain; am.connect(ag).connect(g.gain);
    n.connect(f).connect(g).connect(out); run([n, am], t, s.len);
  },
  /** A rifle: a crack, then the hills sending it back. */
  shot(c, out, t, s) {
    const n = noise(c), g = env(c, t, s.gain, 0.001, 0.25);
    n.connect(filter(c, 'lowpass', 3000)).connect(g).connect(out);
    for (const [dt, k] of [[0.4, 0.35], [0.85, 0.2], [1.3, 0.1]] as const) { const e = noise(c), eg = env(c, t + dt, s.gain * k, 0.01, 0.4); e.connect(filter(c, 'lowpass', 900)).connect(eg).connect(out); run([e], t + dt, 0.5); }
    run([n], t, 0.3);
  },
  /** A tanpura-like drone: a fifth and an octave, with a slow buzz. */
  drone(c, out, t, s) {
    for (const k of [1, 1.5, 2, 1.002]) { const o = osc(c, 'sawtooth', s.hz * k), f = filter(c, 'lowpass', s.hz * 6, 1), g = env(c, t, s.gain / 3, s.len * 0.3, s.len); o.connect(f).connect(g).connect(out); run([o], t, s.len); }
  },
  /** Wood under strain: a rope, a punkah beam, a hinge. */
  creak(c, out, t, s) {
    const o = osc(c, 'sawtooth', s.hz), f = filter(c, 'bandpass', s.hz * 3, 8), g = env(c, t, s.gain, s.len * 0.2, s.len);
    o.frequency.linearRampToValueAtTime(s.hz * 1.3, t + s.len * 0.5); o.frequency.linearRampToValueAtTime(s.hz * 0.9, t + s.len);
    const am = osc(c, 'square', 31), ag = c.createGain(); ag.gain.value = s.gain * 0.6; am.connect(ag).connect(g.gain);
    o.connect(f).connect(g).connect(out); run([o, am], t, s.len);
  },
  /** Something dragged: a bolt in its staple, a trunk on marble, brakes. */
  scrape(c, out, t, s) {
    const n = noise(c), f = filter(c, 'bandpass', s.hz, 3), g = env(c, t, s.gain, 0.03, s.len);
    f.frequency.linearRampToValueAtTime(s.hz * 0.7, t + s.len);
    const end = noise(c), ef = filter(c, 'bandpass', s.hz * 2, 8), eg = env(c, t + s.len, s.gain * 0.6, 0.001, 0.05);
    n.connect(f).connect(g).connect(out); end.connect(ef).connect(eg).connect(out); run([n], t, s.len); run([end], t + s.len, 0.06);
  },
  /** A mynah's whistle. */
  whistle(c, out, t, s) {
    const o = osc(c, 'sine', s.hz), g = env(c, t, s.gain, 0.02, s.len);
    o.frequency.exponentialRampToValueAtTime(s.hz * 1.5, t + s.len * 0.4); o.frequency.exponentialRampToValueAtTime(s.hz * 0.9, t + s.len);
    o.connect(g).connect(out); run([o], t, s.len);
  },
  /** A held, bowed tone that rises a fifth: a thing proved. */
  tone(c, out, t, s) {
    const o = osc(c, 'sawtooth', s.hz), f = filter(c, 'lowpass', s.hz * 4, 2), g = env(c, t, s.gain, s.len * 0.3, s.len);
    o.frequency.setValueAtTime(s.hz, t); o.frequency.linearRampToValueAtTime(s.hz * 1.5, t + s.len * 0.6);
    o.connect(f).connect(g).connect(out); run([o], t, s.len);
  },
};
export const INSTRUMENT_WORDS = Object.keys(INSTRUMENTS);

/** Play a sound by id, `gain` scaling it (distance, mostly). Unknown ids throw: content names only sounds it has. */
export function play(id: string, gain = 1) {
  const s = get('sound', id);
  const hit = INSTRUMENTS[s.play];
  if (!hit) throw new Error(`audio: sound "${id}" plays "${s.play}" (known: ${INSTRUMENT_WORDS.join(', ')})`);
  if (!ctx || !master || gain <= 0.01) return;
  const out = ctx.createGain(); out.gain.value = gain; out.connect(master);
  for (let i = 0; i < s.times; i++) hit(ctx, out, ctx.currentTime + 0.01 + i * s.gap, s);
}

let bedTimer: ReturnType<typeof setInterval> | null = null;
/** The night's bed of sound, on or off. */
export function nightBed(on: boolean) {
  if (on === !!bedTimer) return;
  if (!on) { clearInterval(bedTimer!); bedTimer = null; return; }
  const loop = () => { if (!C.sound['night-drone']) return; play('night-drone'); play('crickets'); };
  loop();
  bedTimer = setInterval(loop, get('sound', 'night-drone').len * 1000 * 0.9);
}
