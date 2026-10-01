// Fully synthesized audio. Music themes are KDL (content/music.kdl): per-track step patterns
// for tabla, dholak, harmonium, synth, bass, shaker. SFX are tiny synth recipes. Sounds are
// panned by world x so you can track an invisible elephant by ear.
import type { ThemeDef } from "../core/content";

type Ctx = AudioContext;

export class Audio {
  ctx: Ctx | null = null;
  master!: GainNode; music!: GainNode; sfx!: GainNode;
  private noiseBuf!: AudioBuffer;
  private theme: ThemeDef | null = null;
  private step = 0; private nextT = 0; private timer = 0;
  private noteIdx: Record<string, number> = {};
  private glide: { src: AudioBufferSourceNode; g: GainNode } | null = null;
  musicVol = 0.55; sfxVol = 0.8; muted = false;
  camX = 0;

  constructor(public themes: Record<string, ThemeDef>) {}

  /** Must be called from a user gesture (browser autoplay rules). */
  unlock() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.music = ctx.createGain(); this.music.gain.value = this.musicVol; this.music.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.sfxVol; this.sfx.connect(this.master);
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  setMuted(m: boolean) { this.muted = m; if (this.ctx) this.master.gain.value = m ? 0 : 1; }
  setVolumes(music: number, sfx: number) { this.musicVol = music; this.sfxVol = sfx; if (this.ctx) { this.music.gain.value = music; this.sfx.gain.value = sfx; } }

  playTheme(id: string) {
    const th = this.themes[id];
    if (!th || this.theme?.id === id) return;
    this.theme = th;
    this.step = 0;
    this.noteIdx = {};
    if (this.ctx) this.nextT = this.ctx.currentTime + 0.1;
  }
  stopTheme() { this.theme = null; }

  private schedule() {
    const ctx = this.ctx, th = this.theme;
    if (!ctx || !th) return;
    const stepDur = 60 / th.bpm / 4;
    while (this.nextT < ctx.currentTime + 0.12) {
      const swing = this.step % 2 ? stepDur * th.swing : 0;
      for (const tr of th.tracks) {
        const ch = tr.pattern[this.step % tr.pattern.length];
        if (!ch || ch === "." || ch === "-" || ch === " " || ch === "|") continue;
        this.playStep(tr.inst, ch, tr, th, this.nextT + swing, stepDur);
      }
      this.nextT += stepDur;
      this.step++;
    }
  }

  private nextNote(tr: ThemeDef["tracks"][number], th: ThemeDef): number {
    const k = tr.inst + tr.pattern;
    const i = this.noteIdx[k] ?? 0;
    this.noteIdx[k] = i + 1;
    if (!tr.notes.length) return th.root;
    const n = tr.notes[i % tr.notes.length];
    // small numbers are scale degrees relative to the theme root; big numbers are MIDI notes
    if (n < 24) { const oct = Math.floor(n / th.scale.length); return th.root + 12 * oct + th.scale[((n % th.scale.length) + th.scale.length) % th.scale.length]; }
    return n;
  }

  private playStep(inst: string, ch: string, tr: ThemeDef["tracks"][number], th: ThemeDef, t: number, sd: number) {
    const g = tr.gain;
    switch (inst) {
      case "tabla": this.tabla(ch, t, g); break;
      case "dholak": this.dholak(ch, t, g); break;
      case "shaker": this.noise(t, 0.04, 6000, 0.12 * g * (ch === "X" ? 1.6 : 1), "highpass", this.music); break;
      case "clap": this.noise(t, 0.08, 1500, 0.3 * g, "bandpass", this.music); break;
      case "harmonium": { const n = this.nextNote(tr, th); this.harmonium([n, n + 4 - (th.scale[2] === 3 ? 1 : 0), n + 7], t, sd * (ch === "X" ? 4 : 2), 0.09 * g); break; }
      case "synth": this.tone("square", mtof(this.nextNote(tr, th) + 12), t, sd * 1.6, 0.06 * g, 2400, this.music, ch === "X" ? 0.15 : 0); break;
      case "bass": this.tone("triangle", mtof(this.nextNote(tr, th) - 12), t, sd * 1.8, 0.22 * g, 900, this.music); break;
      case "bell": this.tone("sine", mtof(this.nextNote(tr, th) + 24), t, 0.6, 0.06 * g, 8000, this.music); break;
    }
  }

  // ── instruments ──
  private tabla(ch: string, t: number, g: number) {
    const ctx = this.ctx!;
    if (ch === "g" || ch === "G") { // ge: low bayan with pitch bend up
      const o = ctx.createOscillator(); const a = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.12); o.frequency.exponentialRampToValueAtTime(80, t + 0.4);
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(0.5 * g, t + 0.005); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(a).connect(this.music); o.start(t); o.stop(t + 0.5);
      return;
    }
    // na / tin / ta: ringing dayan with harmonic partials + slap noise
    const f = ch === "t" ? 520 : ch === "k" ? 380 : 440;
    for (const [mult, amp] of [[1, 0.25], [2.01, 0.12], [3.02, 0.06]] as const) {
      const o = ctx.createOscillator(); const a = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f * mult * 1.02, t); o.frequency.exponentialRampToValueAtTime(f * mult, t + 0.05);
      const dec = ch === "k" ? 0.06 : ch === "t" ? 0.35 : 0.22;
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(amp * g * (ch === "N" ? 1.5 : 1), t + 0.003); a.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o.connect(a).connect(this.music); o.start(t); o.stop(t + dec + 0.02);
    }
    this.noise(t, 0.02, 3000, 0.1 * g, "bandpass", this.music);
  }

  private dholak(ch: string, t: number, g: number) {
    const ctx = this.ctx!;
    if (ch === "D" || ch === "x") {
      const o = ctx.createOscillator(); const a = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(0.7 * g, t + 0.004); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(a).connect(this.music); o.start(t); o.stop(t + 0.32);
    } else {
      this.noise(t, 0.06, 1800, 0.35 * g, "bandpass", this.music);
      this.tone("triangle", 330, t, 0.05, 0.12 * g, 3000, this.music);
    }
  }

  private harmonium(notes: number[], t: number, dur: number, g: number) {
    const ctx = this.ctx!;
    const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 1700; filt.Q.value = 0.7;
    const a = ctx.createGain();
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.04); a.gain.setValueAtTime(g, t + dur * 0.8); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // bellows tremolo
    const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.value = g * 0.25; lfo.connect(lg).connect(a.gain); lfo.start(t); lfo.stop(t + dur);
    filt.connect(a).connect(this.music);
    for (const n of notes) for (const det of [-7, 6]) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(n); o.detune.value = det;
      o.connect(filt); o.start(t); o.stop(t + dur + 0.02);
    }
  }

  private tone(type: OscillatorType, f: number, t: number, dur: number, g: number, cutoff: number, out: AudioNode, slide = 0, pan = 0) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); const a = ctx.createGain(); const fl = ctx.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(f * (1 + slide), t); if (slide) o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    fl.type = "lowpass"; fl.frequency.value = cutoff;
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.006); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = a;
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; a.connect(p); node = p; }
    o.connect(fl).connect(a); node.connect(out);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  }

  private noise(t: number, dur: number, f: number, g: number, type: BiquadFilterType, out: AudioNode, pan = 0) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
    const a = ctx.createGain();
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = a;
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; a.connect(p); node = p; }
    s.connect(fl).connect(a); node.connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  // ── SFX ──
  play(name: string, x = this.camX, n = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const pan = Math.max(-1, Math.min(1, (x - this.camX) / 640));
    const S = this.sfx;
    switch (name) {
      case "shoot": this.tone("square", 900 + Math.random() * 80, t, 0.05, 0.035, 3000, S, 0.4, pan); break;
      case "shoot-mirchi": this.noise(t, 0.06, 2500, 0.08, "bandpass", S, pan); break;
      case "shoot-kabootar": this.tone("triangle", 1300, t, 0.06, 0.04, 4000, S, -0.3, pan); break;
      case "shoot-laddoo": this.tone("sine", 300, t, 0.1, 0.12, 2000, S, 0.6, pan); break;
      case "enemy-shot": case "volley": this.tone("sawtooth", 260, t, 0.09, 0.06, 1200, S, 0.5, pan); break;
      case "boss-hit": this.noise(t, 0.04, 2200, 0.05, "bandpass", S, pan); break;
      case "hit": case "glass": this.noise(t, 0.05, 5000, 0.08, "highpass", S, pan); this.tone("sine", 1800, t, 0.08, 0.04, 8000, S, 0, pan); break;
      case "player-hurt": this.tone("sawtooth", 180, t, 0.35, 0.25, 900, S, 1.2); this.noise(t, 0.2, 800, 0.25, "lowpass", S); break;
      case "parry": [1568, 2093, 2637].forEach((f, i) => this.tone("sine", f, t + i * 0.03, 0.4, 0.12, 9000, S)); this.noise(t, 0.12, 4000, 0.15, "highpass", S); break;
      case "parry-swing": this.noise(t, 0.08, 3000, 0.05, "bandpass", S, pan); break;
      case "blink": this.tone("square", 2000, t, 0.12, 0.05, 6000, S, -0.7, pan); this.noise(t, 0.1, 6000, 0.06, "highpass", S, pan); break;
      case "jump": this.tone("sine", 420, t, 0.12, 0.08, 3000, S, -0.4, pan); break;
      case "jump2": this.tone("sine", 620, t, 0.12, 0.08, 3000, S, -0.4, pan); break;
      case "land": this.noise(t, 0.05, 400, 0.08, "lowpass", S, pan); break;
      case "stomp": case "thud": case "crash":
        this.tone("sine", 90, t, 0.4, 0.5, 400, S, 1.5, pan); this.noise(t, 0.3, 500, 0.4, "lowpass", S, pan); break;
      case "boom": this.tone("sine", 70, t, 0.5, 0.45, 300, S, 2, pan); this.noise(t, 0.4, 900, 0.35, "lowpass", S, pan); break;
      case "boing": this.tone("sine", 200, t, 0.25, 0.15, 2000, S, 1.6, pan); break;
      case "poof": case "shrink": case "grow": case "split": case "reassemble": this.noise(t, 0.3, 1200, 0.2, "bandpass", S, pan); this.tone("triangle", name === "shrink" ? 1200 : 400, t, 0.3, 0.06, 4000, S, name === "shrink" ? -0.6 : 0.8, pan); break;
      case "ta-da": [0, 4, 7, 12].forEach((s) => this.tone("sawtooth", mtof(62 + s), t + 0.05, 0.7, 0.05, 2200, S)); this.noise(t, 0.4, 7000, 0.1, "highpass", S); break;
      case "step": this.tone("sine", 60, t, 0.18, 0.35, 300, S, 0.4, pan); this.noise(t, 0.06, 300, 0.12, "lowpass", S, pan); break;
      case "coin": case "pickup": [1975, 2637].forEach((f, i) => this.tone("square", f, t + i * 0.06, 0.12, 0.04, 6000, S)); break;
      case "pop": case "ko": this.tone("triangle", 600, t, 0.15, 0.12, 4000, S, -0.5, pan); this.noise(t, 0.08, 2000, 0.1, "bandpass", S, pan); break;
      case "denied": this.tone("square", 140, t, 0.12, 0.06, 800, S); break;
      case "swap": this.tone("triangle", 880, t, 0.06, 0.05, 4000, S); this.tone("triangle", 1320, t + 0.05, 0.06, 0.05, 4000, S); break;
      case "ex": this.tone("sawtooth", 220, t, 0.3, 0.12, 2000, S, 1, pan); this.noise(t, 0.2, 3000, 0.15, "bandpass", S, pan); break;
      case "super": [0, 7, 12, 19].forEach((s, i) => this.tone("sawtooth", mtof(50 + s), t + i * 0.05, 1.0, 0.07, 3000, S)); this.noise(t, 0.8, 1500, 0.2, "bandpass", S); break;
      case "beam": this.tone("sawtooth", 110, t, 1.0, 0.1, 1200, S, 0, pan); break;
      case "whoosh": case "lob": case "flap": case "sheet": this.noise(t, 0.25, 1400, 0.12, "bandpass", S, pan); break;
      case "ring": case "chart": case "candles": this.tone("square", 520, t, 0.2, 0.05, 2000, S, 0.6, pan); break;
      case "mirror": this.tone("sine", 2400, t, 0.5, 0.06, 9000, S, 0.3, pan); this.tone("sine", 3200, t + 0.05, 0.5, 0.04, 9000, S, 0, pan); break;
      case "pot-lift": case "scrape": this.noise(t, 0.15, 700, 0.12, "bandpass", S, pan); break;
      case "snap": this.noise(t, 0.05, 4000, 0.2, "highpass", S, pan); break;
      case "gurgle": for (let i = 0; i < 6; i++) this.tone("sine", 200 + Math.random() * 300, t + i * 0.08, 0.1, 0.06, 2000, S, 0.5, pan); break;
      case "buzzsaw": this.tone("sawtooth", 140, t, 2.0, 0.06, 1800, S, 0, pan); break;
      case "card": this.noise(t, 0.04, 5000, 0.06, "highpass", S, pan); break;
      case "knockout": [0, 4, 7, 12, 16].forEach((s, i) => this.tone("sawtooth", mtof(55 + s), t + i * 0.09, 1.4, 0.07, 2500, S)); this.tone("sine", 60, t, 2, 0.4, 300, S); break;
      case "lose": [0, -1, -3, -5].forEach((s, i) => this.tone("triangle", mtof(60 + s), t + i * 0.25, 0.5, 0.1, 2000, S)); break;
      case "drumroll": this.drumroll(n); break;
      case "ui": this.tone("triangle", 1200, t, 0.06, 0.05, 5000, S); break;
      default: this.tone("triangle", 700, t, 0.08, 0.04, 3000, S, 0, pan);
    }
  }

  /** Accelerating snare roll ending on a ta-da: the universal "something big is coming". */
  drumroll(dur: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    let t = t0;
    for (let i = 0; t < t0 + dur; i++) {
      const k = (t - t0) / Math.max(0.1, dur);
      this.noise(t, 0.05, 2200, 0.08 + k * 0.12, "bandpass", this.sfx);
      t += 0.07 - k * 0.04;
    }
  }

  glideLoop(on: boolean) {
    const ctx = this.ctx;
    if (!ctx) return;
    if (on && !this.glide) {
      const src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 4;
      const g = ctx.createGain(); g.gain.value = 0.12;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 22; const lg = ctx.createGain(); lg.gain.value = 0.1;
      lfo.connect(lg).connect(g.gain); lfo.start();
      src.connect(f).connect(g).connect(this.sfx); src.start();
      this.glide = { src, g };
    } else if (!on && this.glide) {
      this.glide.g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      const s = this.glide.src;
      setTimeout(() => { try { s.stop(); } catch { /* ignore */ } }, 120);
      this.glide = null;
    }
  }

  dispose() { clearInterval(this.timer); void this.ctx?.close(); }
}

export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
