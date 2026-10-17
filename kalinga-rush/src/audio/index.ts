// Music director: plays the record's tala, drone and flute in step with the
// game clock (so pauses and slow-motion carry the music with them), the conch
// at act changes, and sound effects. Starts muted until the first input
// (autoplay rules); music and SFX toggle separately (§6).
import type { RecordDef } from '../data/records';
import type { ActNum } from '../data/palettes';
import { Rng } from '../lib/rng';
import { ACT_MUSIC, SA, semis, tempoFor } from './patterns';
import { Synth, type SfxName } from './synth';

type Style = 'full' | 'flute' | 'drone' | 'festival' | 'rhythm' | 'title';

interface Track {
  act: ActNum;
  bpm: number;
  style: Style;
  melody: (number | null)[]; // 64 steps (4 bars) of scale degrees or null
  beats?: number[];
}

class AudioDirector {
  private synth: Synth | null = null;
  private musicOn = true;
  private sfxOn = true;
  private track: Track | null = null;
  private nextStep = 0; // index of next sixteenth to schedule
  private offset = 0; // ctx time - music time
  private anchored = false;
  private beatIdx = 0;

  get ready(): boolean {
    return !!this.synth && this.synth.ctx.state === 'running';
  }

  /** Call from a user gesture. */
  unlock(): void {
    try {
      if (!this.synth) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.synth = new Synth(new AC());
        this.applyGains();
      }
      if (this.synth.ctx.state === 'suspended') void this.synth.ctx.resume();
    } catch {
      this.synth = null;
    }
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    this.applyGains();
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
    this.applyGains();
  }

  private applyGains(): void {
    if (!this.synth) return;
    const t = this.synth.ctx.currentTime;
    this.synth.music.gain.setTargetAtTime(this.musicOn ? 0.55 : 0, t, 0.05);
    this.synth.sfx.gain.setTargetAtTime(this.sfxOn ? 0.7 : 0, t, 0.05);
  }

  /** Start the music for a record (or the title / the end). */
  play(rec: RecordDef | null, opts: { title?: boolean; beats?: number[] } = {}): void {
    const act = (rec?.act ?? 1) as ActNum;
    let style: Style = 'full';
    if (opts.title) style = 'title';
    else if (rec) {
      if (rec.id === 'r22') style = 'drone';
      else if (rec.somber) style = 'flute';
      else if (rec.mech.noHazards) style = 'festival';
      else if (rec.mech.rhythm) style = 'rhythm';
    }
    const rng = new Rng(`music:${rec?.id ?? 'title'}`);
    const melody: (number | null)[] = [];
    const dens = ACT_MUSIC[act].density * (style === 'flute' ? 0.5 : 1);
    let deg = 0;
    for (let i = 0; i < 64; i++) {
      const strong = i % 4 === 0;
      if (rng.chance(strong ? dens : dens * 0.35)) {
        deg = Math.max(-2, Math.min(7, deg + rng.pick([-2, -1, -1, 0, 1, 1, 2])));
        melody.push(deg);
      } else melody.push(null);
    }
    this.track = { act, bpm: rec ? tempoFor(rec.num) : 76, style, melody, beats: opts.beats };
    this.nextStep = 0;
    this.beatIdx = 0;
    this.anchored = false;
    const s = this.synth;
    if (s) {
      const t = s.ctx.currentTime + 0.05;
      if (style === 'drone' || style === 'full' || style === 'title' || style === 'festival') s.drone(SA[act], t, style === 'drone' ? 1.3 : 0.8);
      else s.stopDrone(t);
    }
  }

  stop(): void {
    this.track = null;
    if (this.synth) this.synth.stopDrone(this.synth.ctx.currentTime);
  }

  /** Advance the music to game time `t` (seconds since the record began). */
  tick(t: number, timeScale = 1): void {
    const s = this.synth;
    const tr = this.track;
    if (!s || !tr || s.ctx.state !== 'running') return;
    const now = s.ctx.currentTime;
    const want = now - t;
    if (!this.anchored || Math.abs(want - this.offset) > 0.08) {
      this.offset = want;
      this.anchored = true;
      // skip steps that are already in the past
      const spb = 60 / tr.bpm / 4;
      this.nextStep = Math.max(this.nextStep, Math.ceil(t / spb));
    }
    if (timeScale < 0.6) return; // slow-motion: let the last notes ring
    const ahead = 0.14;
    if (tr.style === 'rhythm' && tr.beats) {
      while (this.beatIdx < tr.beats.length && tr.beats[this.beatIdx] < t + ahead) {
        const bt = tr.beats[this.beatIdx];
        if (bt >= t - 0.02) this.rhythmBeat(this.beatIdx, Math.max(now, this.offset + bt));
        this.beatIdx++;
      }
      return;
    }
    const spb = 60 / tr.bpm / 4;
    while (this.nextStep * spb < t + ahead) {
      this.playStep(this.nextStep, Math.max(now, this.offset + this.nextStep * spb), spb);
      this.nextStep++;
    }
  }

  private playStep(i: number, at: number, spb: number): void {
    const s = this.synth!;
    const tr = this.track!;
    const am = ACT_MUSIC[tr.act];
    const bar = Math.floor(i / 16);
    const k = i % 16;
    const drums = tr.style === 'full' || tr.style === 'festival' || (tr.style === 'title' && bar % 2 === 1);
    if (drums) {
      const st = am.drum[bar % am.drum.length][k];
      if (st === 'D') s.mardala(at, 'dhin');
      else if (st === 'H') s.mardala(at, 'tha');
      else if (st === 'T') s.mardala(at, 'ta', 0.85);
      else if (st === 'k') s.mardala(at, 'ki', 0.7);
      const g = am.gini[k];
      if (g === 'O' || (tr.style === 'festival' && k % 4 === 0)) s.gini(at, true, 0.7);
      else if (g === 'c') s.gini(at, false, 0.6);
    }
    if (tr.style === 'drone') return;
    const deg = tr.melody[i % 64];
    if (deg !== null && (tr.style !== 'title' || k % 8 === 0)) {
      const scale = am.scale;
      const n = scale.length;
      const oct = Math.floor(deg / n);
      const semi = scale[((deg % n) + n) % n] + oct * 12;
      // hold until the next note
      let len = 1;
      while (len < 8 && tr.melody[(i + len) % 64] === null) len++;
      s.bansuri(at, semis(SA[tr.act] * 2, semi), spb * len * (tr.style === 'flute' ? 1.6 : 0.95), tr.style === 'flute' ? 0.8 : 0.7);
    }
    if (am.arp && tr.style === 'full' && i % 2 === 0) {
      const chord = [0, 2, 4, 2];
      const scale = am.scale;
      const d = chord[(i / 2) % 4] + (bar % 4 === 3 ? 1 : 0);
      s.arp(at, semis(SA[tr.act], scale[d % scale.length] + 12 * Math.floor(d / scale.length) + 12), spb * 1.6, 0.8);
    }
  }

  private rhythmBeat(i: number, at: number): void {
    const s = this.synth!;
    s.mardala(at, i % 4 === 0 ? 'dhin' : i % 2 ? 'ta' : 'tha', 1);
    if (i % 2 === 0) s.gini(at, i % 8 === 0, 0.6);
    const scale = ACT_MUSIC[7].scale;
    s.arp(at, semis(SA[7], scale[(i * 3) % scale.length] + 12), 0.18, 0.9);
    if (i % 8 === 0) s.bansuri(at, semis(SA[7] * 2, scale[(i / 8) % scale.length]), 0.5, 0.6);
  }

  sfx(name: SfxName): void {
    if (!this.synth || this.synth.ctx.state !== 'running') return;
    this.synth.fx(name);
  }

  /** The conch: act changes, the title-card sting, the countdown. */
  conch(dur = 1.4, delay = 0): void {
    const s = this.synth;
    if (!s || s.ctx.state !== 'running') return;
    s.conch(s.ctx.currentTime + delay, dur, 0.9, s.out);
  }

  bell(freq = 880, delay = 0): void {
    const s = this.synth;
    if (!s || s.ctx.state !== 'running') return;
    s.bell(s.ctx.currentTime + delay, freq, 1, s.sfx);
  }

  suspend(): void {
    void this.synth?.ctx.suspend();
  }

  resume(): void {
    void this.synth?.ctx.resume();
  }
}

export const audio = new AudioDirector();
