// Original procedural instruments (§6), all Web Audio, no samples: mardala
// (Odissi drum) strokes, gini cymbals, bansuri flute, harmonium drone, temple
// bell, conch, and an analog-style arpeggio voice for Act VII. Plus SFX.

export class Synth {
  readonly ctx: AudioContext;
  readonly out: GainNode;
  readonly music: GainNode;
  readonly sfx: GainNode;
  private verb: ConvolverNode;
  private verbSend: GainNode;
  private noiseBuf: AudioBuffer;
  private droneNodes: { stop: (t: number) => void } | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    this.out.connect(comp).connect(ctx.destination);
    this.music = ctx.createGain();
    this.music.gain.value = 0.55;
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.7;
    this.music.connect(this.out);
    this.sfx.connect(this.out);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(2.4, 2.6);
    this.verbSend = ctx.createGain();
    this.verbSend.gain.value = 0.28;
    this.verbSend.connect(this.verb).connect(this.music);
    this.noiseBuf = this.makeNoise();
  }

  private impulse(seconds: number, decay: number): AudioBuffer {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private makeNoise(): AudioBuffer {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private noise(t: number, dur: number, dest: AudioNode, filter: { type: BiquadFilterType; f: number; q?: number }, gain: number, attack = 0.002): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = filter.type;
    f.frequency.value = filter.f;
    f.Q.value = filter.q ?? 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  private tone(t: number, type: OscillatorType, f0: number, f1: number, dur: number, dest: AudioNode, gain: number, attack = 0.004, glide = dur * 0.6): void {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + glide);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ---- instruments --------------------------------------------------------------
  /** Mardala strokes: 'dhin' (deep, open), 'tha' (bass slap), 'ta' (sharp treble), 'ki' (light treble). */
  mardala(t: number, stroke: 'dhin' | 'tha' | 'ta' | 'ki', vel = 1): void {
    const m = this.music;
    switch (stroke) {
      case 'dhin':
        this.tone(t, 'sine', 150, 78, 0.55, m, 0.55 * vel, 0.003, 0.18);
        this.tone(t, 'triangle', 300, 220, 0.25, m, 0.12 * vel);
        this.noise(t, 0.05, m, { type: 'bandpass', f: 1800, q: 1.2 }, 0.12 * vel);
        break;
      case 'tha':
        this.tone(t, 'sine', 120, 60, 0.22, m, 0.6 * vel, 0.002, 0.08);
        this.noise(t, 0.04, m, { type: 'lowpass', f: 900 }, 0.18 * vel);
        break;
      case 'ta':
        this.tone(t, 'triangle', 520, 470, 0.14, m, 0.22 * vel);
        this.noise(t, 0.06, m, { type: 'bandpass', f: 3200, q: 2 }, 0.2 * vel);
        break;
      case 'ki':
        this.noise(t, 0.035, m, { type: 'bandpass', f: 4200, q: 3 }, 0.12 * vel);
        this.tone(t, 'sine', 660, 640, 0.06, m, 0.06 * vel);
        break;
    }
  }

  /** Gini (small cymbals): a bright ring, or a choked tick. */
  gini(t: number, open = true, vel = 1): void {
    const dur = open ? 0.9 : 0.09;
    for (const [f, a] of [[1870, 0.06], [2630, 0.045], [3410, 0.03], [5120, 0.02]] as const) this.tone(t, 'sine', f, f * 0.998, dur, this.music, a * vel, 0.002, dur);
    this.noise(t, open ? 0.25 : 0.05, this.music, { type: 'highpass', f: 6000 }, 0.05 * vel);
  }

  /** Bansuri: breathy sine with a slow vibrato and a little pitch scoop. */
  bansuri(t: number, freq: number, dur: number, vel = 1): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 0.97, t);
    o.frequency.linearRampToValueAtTime(freq, t + 0.07);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.2;
    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(0, t);
    lfoG.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(0.4, dur * 0.6));
    lfo.connect(lfoG).connect(o.frequency);
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = freq * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.08;
    o2.connect(g2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16 * vel, t + 0.06);
    g.gain.setValueAtTime(0.16 * vel, t + Math.max(0.07, dur - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    o.connect(g);
    g2.connect(g);
    g.connect(this.music);
    g.connect(this.verbSend);
    this.noise(t, Math.min(dur, 0.3), this.verbSend, { type: 'bandpass', f: freq * 2, q: 4 }, 0.03 * vel, 0.04);
    for (const n of [o, o2, lfo]) { n.start(t); n.stop(t + dur + 0.2); }
  }

  /** Harmonium drone: Sa–Pa–Sa' reeds, gently breathing. Replaces any running drone. */
  drone(root: number, t: number, level = 1): void {
    this.stopDrone(t);
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.07 * level, t + 1.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    lp.connect(out).connect(this.music);
    out.connect(this.verbSend);
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.23;
    const bg = ctx.createGain();
    bg.gain.value = 0.015 * level;
    breath.connect(bg).connect(out.gain);
    const oscs: OscillatorNode[] = [breath];
    for (const [ratio, det, a] of [[1, -4, 1], [1, 5, 0.8], [1.5, 0, 0.6], [2, 3, 0.4]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = root * ratio;
      o.detune.value = det;
      const g = ctx.createGain();
      g.gain.value = a * 0.3;
      o.connect(g).connect(lp);
      oscs.push(o);
    }
    oscs.forEach((o) => o.start(t));
    this.droneNodes = {
      stop: (at: number) => {
        out.gain.cancelScheduledValues(at);
        out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), at);
        out.gain.exponentialRampToValueAtTime(0.0001, at + 0.8);
        oscs.forEach((o) => o.stop(at + 0.9));
      },
    };
  }

  stopDrone(t: number): void {
    this.droneNodes?.stop(t);
    this.droneNodes = null;
  }

  /** Temple bell: inharmonic partials with a long tail. */
  bell(t: number, freq = 880, vel = 1, dest: AudioNode = this.music): void {
    for (const [r, a, d] of [[1, 0.12, 2.2], [2.76, 0.06, 1.4], [5.4, 0.035, 0.8], [8.93, 0.02, 0.5]] as const) this.tone(t, 'sine', freq * r, freq * r, d, dest, a * vel, 0.002, d);
    if (dest === this.music) this.tone(t, 'sine', freq, freq, 2.2, this.verbSend, 0.05 * vel, 0.002, 2.2);
  }

  /** Conch (shankha): a rich, swelling horn tone. */
  conch(t: number, dur = 1.4, vel = 1, dest: AudioNode = this.sfx): void {
    const ctx = this.ctx;
    const base = 233;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(base * 0.94, t);
    o.frequency.linearRampToValueAtTime(base, t + 0.25);
    o.frequency.linearRampToValueAtTime(base * 1.015, t + dur * 0.8);
    o.frequency.linearRampToValueAtTime(base * 0.96, t + dur);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.5;
    const vg = ctx.createGain();
    vg.gain.value = 2.2;
    vib.connect(vg).connect(o.frequency);
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 720; f1.Q.value = 3;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass'; f2.frequency.value = 1240; f2.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.22);
    g.gain.setValueAtTime(0.5 * vel, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f1).connect(g);
    o.connect(f2).connect(g);
    g.connect(dest);
    g.connect(this.verbSend);
    for (const n of [o, vib]) { n.start(t); n.stop(t + dur + 0.1); }
  }

  /** Act VII: a small analog-synth arpeggio note. */
  arp(t: number, freq: number, dur: number, vel = 1): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(freq * 6, t);
    lp.frequency.exponentialRampToValueAtTime(freq * 1.2, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07 * vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g).connect(this.music);
    g.connect(this.verbSend);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ---- sound effects ---------------------------------------------------------------
  fx(name: SfxName, t = this.ctx.currentTime): void {
    const s = this.sfx;
    switch (name) {
      case 'jump': this.tone(t, 'triangle', 380, 640, 0.16, s, 0.16, 0.004, 0.12); break;
      case 'land': this.tone(t, 'sine', 140, 70, 0.12, s, 0.22); this.noise(t, 0.06, s, { type: 'lowpass', f: 700 }, 0.06); break;
      case 'splash': this.noise(t, 0.28, s, { type: 'bandpass', f: 1400, q: 0.8 }, 0.12, 0.01); break;
      case 'hit':
        this.noise(t, 0.35, s, { type: 'lowpass', f: 1200 }, 0.3, 0.005);
        this.tone(t, 'sine', 220, 90, 0.4, s, 0.25);
        break;
      case 'cowrie': this.tone(t, 'sine', 1568, 1568, 0.12, s, 0.12); this.tone(t + 0.05, 'sine', 2093, 2093, 0.16, s, 0.1); break;
      case 'record':
        this.bell(t, 1046, 0.9, s);
        this.bell(t + 0.12, 1318, 0.7, s);
        this.bell(t + 0.24, 1568, 0.8, s);
        break;
      case 'cheer':
        for (let i = 0; i < 6; i++) this.gini(t + i * 0.07, i === 5, 0.7);
        this.noise(t, 0.7, s, { type: 'bandpass', f: 900, q: 0.6 }, 0.08, 0.1);
        break;
      case 'flip': this.tone(t, 'sine', 300, 900, 0.22, s, 0.14, 0.004, 0.2); break;
      case 'gust': this.noise(t, 1.1, s, { type: 'bandpass', f: 500, q: 0.7 }, 0.14, 0.35); break;
      case 'checkpoint': this.bell(t, 784, 1, s); break;
      case 'page': this.noise(t, 0.22, s, { type: 'highpass', f: 2500 }, 0.1, 0.03); break;
      case 'dolphin': this.tone(t, 'sine', 1400, 2600, 0.3, s, 0.08, 0.02, 0.25); break;
      case 'glitch':
        for (let i = 0; i < 8; i++) this.noise(t + i * 0.045, 0.04, s, { type: 'bandpass', f: 400 + Math.random() * 4000, q: 6 }, 0.2);
        this.tone(t, 'square', 90, 40, 0.5, s, 0.08);
        break;
      case 'dead': this.tone(t, 'sine', 330, 110, 0.9, s, 0.2, 0.01, 0.8); break;
      case 'select': this.tone(t, 'triangle', 660, 660, 0.08, s, 0.1); break;
    }
  }
}

export type SfxName = 'jump' | 'land' | 'splash' | 'hit' | 'cowrie' | 'record' | 'cheer' | 'flip' | 'gust' | 'checkpoint' | 'page' | 'dolphin' | 'glitch' | 'dead' | 'select';
