// Sound, synthesised: each instrument is a small WebAudio recipe, and content/sounds.kdl composes every sound in the
// game from one of them with a pitch, a loudness, a length and a number of hits. play(id) is all the rest of the shell
// calls. Under the game runs music (bed()): a tanpura's four strings, round and round, and now and then a sitar
// phrase in the hour's raga (Bhupali by day, Malkauns at night), in a little reverb. A fright is a sitar string
// drawn sharp until it snaps (the `snap` instrument: Bhima seeing you).
// Catalog: ## Instruments.
import { C, get, type Sound } from './content';

let ctx: BaseAudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
/** The music's room: a soft hall reverb that the strings send into. */
let verb: GainNode | null = null;

/** Audio starts on the first gesture (browsers insist). Safe to call often. */
export function wake() {
  if (ctx) { if (ctx.state === 'suspended' && ctx instanceof AudioContext) void ctx.resume(); return; }
  try { setup(new AudioContext()); } catch { ctx = null; }
}

/** The graph every sound plays into: the master gain, the noise every noisy instrument shares, and the music's room
    (a soft hall reverb: an impulse of decaying stereo noise, darker as it dies). */
function setup(c: BaseAudioContext) {
  ctx = c;
  master = c.createGain(); master.gain.value = 0.8; master.connect(c.destination);
  noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const conv = c.createConvolver(), len = Math.floor(c.sampleRate * 2.8), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { lp += (Math.random() * 2 - 1 - lp) * (0.5 - 0.42 * (i / len)); x[i] = lp * Math.pow(1 - i / len, 3); } }
  conv.buffer = ir;
  verb = c.createGain(); verb.gain.value = 0.55;
  verb.connect(conv).connect(master);
}

/** For stories: what `fn`'s sounds come to, rendered offline (`seconds` long), the live audio left as it was. */
export async function renderOffline(seconds: number, fn: () => void): Promise<AudioBuffer> {
  const live = { ctx, master, noiseBuf, verb };
  const off = new OfflineAudioContext(2, Math.floor(44100 * seconds), 44100);
  setup(off);
  try { fn(); return await off.startRendering(); }
  finally { ({ ctx, master, noiseBuf, verb } = live); }
}

type Hit = (c: BaseAudioContext, out: AudioNode, t: number, s: Sound & { glide?: number }) => void;

const env = (c: BaseAudioContext, t: number, gain: number, attack: number, len: number) => {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.01, len));
  return g;
};
/** A plucked string (Karplus-Strong): a burst of noise round a delay line about one period long, softened each pass.
    A little soft clipping in the loop is the sitar's jawari buzz. The loop's length is whole samples plus the
    softening's delay, so each string carries the playback rate that puts it exactly in tune. Cached per pitch, kind. */
type Str = { buf: AudioBuffer; rate: number };
const strings = new Map<string, Str>();
function string(c: BaseAudioContext, hz: number, lenS: number, bright: number, buzz: number): Str {
  const key = `${hz.toFixed(1)}:${lenS}:${bright}:${buzz}`, got = strings.get(key);
  if (got) return got;
  const n = Math.floor(c.sampleRate * lenS), buf = c.createBuffer(1, n, c.sampleRate), out = buf.getChannelData(0);
  const period = c.sampleRate / hz, p = Math.max(2, Math.round(period)), line = new Float32Array(p);
  for (let i = 0; i < p; i++) line[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin((i / p) * Math.PI));
  const loss = Math.pow(0.001, 1 / (lenS * hz));
  let idx = 0, prev = 0;
  for (let i = 0; i < n; i++) {
    const x = line[idx]!;
    let y = (x * bright + prev * (1 - bright)) * loss;
    if (buzz) y = y + buzz * (Math.tanh(y * 3) / 3 - y * 0.6);
    prev = y; line[idx] = y; out[i] = x;
    idx = (idx + 1) % p;
  }
  // The one-pole softening delays the loop by (1 - bright) / bright samples at the fundamental.
  const s = { buf, rate: (p + (1 - bright) / bright) / period };
  strings.set(key, s);
  return s;
}
/** A string's source, its rate set to play in tune (`by` scales it further: a meend, a peg turned). */
const pluckOf = (c: BaseAudioContext, hz: number, lenS: number, bright: number, buzz: number) => { const st = string(c, hz, lenS, bright, buzz), b = c.createBufferSource(); b.buffer = st.buf; b.playbackRate.value = st.rate; return Object.assign(b, { tune: st.rate }); };
const osc = (c: BaseAudioContext, type: OscillatorType, hz: number) => { const o = c.createOscillator(); o.type = type; o.frequency.value = hz; return o; };
const noise = (c: BaseAudioContext) => { const n = c.createBufferSource(); n.buffer = noiseBuf; n.loop = true; return n; };
const filter = (c: BaseAudioContext, type: BiquadFilterType, hz: number, q = 1) => { const f = c.createBiquadFilter(); f.type = type; f.frequency.value = hz; f.Q.value = q; return f; };
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
  /** Filtered noise: a match, a page. */
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
  /** One tanpura string: a long, warm pluck with the bridge's soft shimmer. */
  tanpura(c, out, t, s) {
    const b = pluckOf(c, s.hz, s.len, 0.5, 0.15), f = filter(c, 'lowpass', s.hz * 9, 0.7), g = env(c, t, s.gain, 0.03, s.len);
    b.connect(f).connect(g).connect(out); run([b], t, s.len);
  },
  /** A sitar's played string: bright, buzzing, with a slow decay; a hit's `glide` slides into the note (meend). */
  pluck(c, out, t, s) {
    const b = pluckOf(c, s.hz, s.len, 0.62, 0.3), f = filter(c, 'lowpass', s.hz * 14, 0.8), hp = filter(c, 'highpass', 90, 0.7), g = env(c, t, s.gain, 0.004, s.len);
    if (s.glide) { b.playbackRate.setValueAtTime(b.tune * s.glide, t); b.playbackRate.exponentialRampToValueAtTime(b.tune, t + 0.18); }
    b.connect(f).connect(hp).connect(g).connect(out); run([b], t, s.len);
  },
  /** A string drawn sharp until it snaps: the peg turned, the note rising and trembling, a crack, the broken string
      flapping down out of tune, and two strings left humming a tritone apart. The fright. */
  snap(c, out, t, s) {
    const rise = 0.55, b = pluckOf(c, s.hz, 1.2, 0.7, 0.4), g = env(c, t, s.gain * 0.7, 0.01, rise + 0.05);
    b.playbackRate.setValueAtTime(b.tune, t); b.playbackRate.exponentialRampToValueAtTime(b.tune * 1.7, t + rise);
    const trem = osc(c, 'sine', 11), tg = c.createGain(); tg.gain.value = s.gain * 0.3; trem.connect(tg).connect(g.gain);
    b.connect(filter(c, 'lowpass', s.hz * 12)).connect(g).connect(out); run([b, trem], t, rise + 0.05);
    const at = t + rise, crack = noise(c), cg = env(c, at, s.gain * 1.4, 0.001, 0.06);
    crack.connect(filter(c, 'highpass', 2500, 0.7)).connect(cg).connect(out); run([crack], at, 0.08);
    const loose = pluckOf(c, s.hz * 0.5, 1.4, 0.75, 0.6), lg = env(c, at, s.gain, 0.002, 1.3);
    loose.playbackRate.setValueAtTime(loose.tune * 1.5, at); loose.playbackRate.exponentialRampToValueAtTime(loose.tune * 0.45, at + 1.1);
    loose.connect(lg).connect(out); run([loose], at, 1.3);
    for (const k of [0.5, 0.707]) { const o = osc(c, 'sawtooth', s.hz * k * 0.5), f = filter(c, 'lowpass', s.hz * 1.5, 1), og = env(c, at + 0.05, s.gain * 0.25, 0.4, s.len); o.connect(f).connect(og).connect(out); run([o], at + 0.05, s.len); }
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

/** The instruments that play in the music's room (the reverb). */
const ROOMED = new Set(['tanpura', 'pluck', 'snap']);

/** Play a sound by id, `gain` scaling it (distance, mostly); `pitch` multiplies its hz, `at` delays it (s), `glide`
    slides a pluck into its note from that ratio, `into` routes it to a bus. Unknown ids throw: content names only
    sounds it has. */
export function play(id: string, gain = 1, o: { pitch?: number; at?: number; glide?: number; into?: AudioNode } = {}) {
  const s0 = get('sound', id);
  const hit = INSTRUMENTS[s0.play];
  if (!hit) throw new Error(`audio: sound "${id}" plays "${s0.play}" (known: ${INSTRUMENT_WORDS.join(', ')})`);
  if (!ctx || !master || gain <= 0.01) return;
  const s = { ...s0, hz: s0.hz * (o.pitch ?? 1), glide: o.glide };
  // `into` a bus of its own (the music's), which sends to the room itself; else straight out, roomed or not.
  const out = ctx.createGain(); out.gain.value = gain; out.connect(o.into ?? master);
  if (verb && ROOMED.has(s.play) && !o.into) out.connect(verb);
  for (let i = 0; i < s.times; i++) hit(ctx, out, ctx.currentTime + 0.01 + (o.at ?? 0) + i * s.gap, s);
}

// ---------- the music ----------

/** The hour's raga: its notes as just ratios to Sa, as a tanpura tunes them (so they sit in its drone). Bhupali by
    day, bright and calm (S R G P D); Malkauns at night, the late-night raga, grave and soothing (S g M d n). */
const RAGAS = { day: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3], night: [1, 6 / 5, 4 / 3, 8 / 5, 9 / 5] } as const;
/** The tanpura's round: Pa, then the upper Sa twice, then the low Sa (ratios of Sa), a string every TANPURA_S. */
const TANPURA = [1.5, 2, 2, 1], TANPURA_S = 1.15;

let bedTimer: ReturnType<typeof setInterval> | null = null, bedKind: 'day' | 'night' | null = null;
/** The music's own bus: notes are scheduled seconds ahead, so stopping the music fades this out and lets it go. */
let bus: GainNode | null = null;
let nextString = 0, nextPhrase = 0, strand = 0, degree = 7;

/** One sitar phrase: three to six notes walking the raga, the last held, now and then sliding in from a neighbour. */
function phrase(kind: 'day' | 'night', at: number) {
  const scale = RAGAS[kind], notes = 3 + Math.floor(Math.random() * 4);
  let t = at;
  for (let i = 0; i < notes; i++) {
    const step = Math.random() < 0.7 ? (Math.random() < 0.5 ? -1 : 1) : (Math.random() < 0.5 ? -2 : 2);
    degree = Math.max(0, Math.min(scale.length * 2 - 1, degree + step));
    const ratio = scale[degree % scale.length]! * 2 ** Math.floor(degree / scale.length);
    const glide = Math.random() < 0.3 ? Math.pow(2, -(Math.random() < 0.5 ? 1 : 2) / 12) : undefined;
    play('bed-sitar', i === notes - 1 ? 0.9 : 0.7, { pitch: ratio, at: t - ctx!.currentTime, glide, into: bus! });
    t += i === notes - 1 ? 1.4 : 0.32 + Math.random() * 0.45;
  }
  return t;
}

/** Keep the music scheduled three seconds ahead. Called by a timer and by every frame (a browser may run a timer
    late, a busy frame or a tab in the background; a note already scheduled plays on time regardless). A round that
    fell behind (a long stall) picks up from now. */
export function bedTick() {
  if (!bedKind || !ctx || ctx.state !== 'running' || !master) return;
  if (!bus) { bus = ctx.createGain(); bus.connect(master); if (verb) bus.connect(verb); nextString = nextPhrase = 0; }
  const now = ctx.currentTime, ahead = now + 3;
  if (nextString < now - 1) nextString = now + 0.05;
  if (!nextPhrase) nextPhrase = now + 2.5;
  while (nextString < ahead) { play('bed-tanpura', 1, { pitch: TANPURA[strand % TANPURA.length], at: nextString - now, into: bus }); strand++; nextString += TANPURA_S; }
  if (nextPhrase < ahead) nextPhrase = phrase(bedKind, Math.max(nextPhrase, now + 0.05)) + 3 + Math.random() * 5;
}

/** The music under the game: 'day', 'night', or none. Changing it fades out what was already scheduled. */
export function bed(kind: 'day' | 'night' | null) {
  if (kind === bedKind) return;
  bedKind = kind && C.sound['bed-tanpura'] ? kind : null;
  if (bus && ctx) { const old = bus, t = ctx.currentTime; old.gain.setValueAtTime(old.gain.value, t); old.gain.linearRampToValueAtTime(0, t + 1.5); setTimeout(() => old.disconnect(), 4000); }
  bus = null;
  if (bedKind && !bedTimer) bedTimer = setInterval(bedTick, 200);
  if (!bedKind && bedTimer) { clearInterval(bedTimer); bedTimer = null; }
  bedTick();
}
