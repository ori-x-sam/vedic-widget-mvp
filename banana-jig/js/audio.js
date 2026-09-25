'use strict';
// All sound is synthesized: a small swing sequencer for ragtime/hot-jazz loops, plus SFX.
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], dim: [0, 3, 6, 9], '6': [0, 4, 7, 9], maj7: [0, 4, 7, 11] };
function parseChord(s) { const m = s.match(/^([A-G][b#]?)(.*)$/); return { root: NOTE[m[1]], iv: QUAL[m[2]] || QUAL[''] }; }
const SONGS = {
  title: { bpm: 152, swing: .64, key: 5, scale: [0, 2, 4, 5, 7, 9, 10], lead: 'clarinet', drums: 'brush',
    chords: ['F', 'D7', 'G7', 'C7', 'F', 'D7', 'G7', 'C7', 'Bb', 'Bdim', 'F', 'D7', 'G7', 'C7', 'F', 'C7'] },
  station: { bpm: 118, swing: .6, key: 0, scale: [0, 2, 4, 5, 7, 9, 11], lead: 'whistle', drums: 'brush', soft: true,
    chords: ['C6', 'Am', 'Dm7', 'G7', 'C6', 'A7', 'D7', 'G7', 'F', 'Fm', 'C6', 'A7', 'D7', 'G7', 'C6', 'G7'] },
  ride: { bpm: 132, swing: .6, key: 7, scale: [0, 2, 4, 5, 7, 9, 11], lead: 'clarinet', drums: 'train',
    chords: ['G', 'E7', 'Am', 'D7', 'G', 'E7', 'A7', 'D7', 'C', 'Cm', 'G', 'E7', 'A7', 'D7', 'G', 'D7'] },
  fight: { bpm: 184, swing: .64, key: 2, scale: [0, 2, 3, 5, 7, 8, 11], lead: 'trumpet', drums: 'hot',
    chords: ['Dm', 'Dm', 'A7', 'A7', 'Dm', 'D7', 'Gm', 'Gm', 'Dm', 'Bb7', 'A7', 'Dm', 'Gm', 'Dm', 'A7', 'A7'] }
};
const RHY = [[1, 0, 1, 1, 0, 1, 2, 0], [1, 1, 1, 0, 1, 0, 1, 0], [0, 1, 1, 1, 1, 0, 2, 0], [1, 2, 0, 1, 1, 1, 1, 0], [1, 0, 1, 0, 1, 1, 1, 1], [2, 2, 2, 0, 1, 1, 1, 0]];
const CONT = [[0, 1, 2, 1, 3, 2, 1, 0], [4, 3, 2, 1, 2, 3, 4, 2], [2, 2, 3, 4, 5, 4, 3, 2], [0, 2, 4, 2, 1, 3, 5, 3], [5, 4, 3, 2, 1, 0, 1, 2]];

const AudioSys = {
  ctx: null, song: null, pending: null,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    let a; try { a = this.ctx = new AC(); } catch (e) { return; }
    this.master = a.createGain();
    const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6200; // gramophone band
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(hp); hp.connect(lp); lp.connect(comp); comp.connect(a.destination);
    // small room reverb
    const len = a.sampleRate * 1.3, ir = a.createBuffer(2, len, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.rev = a.createConvolver(); this.rev.buffer = ir; const rg = a.createGain(); rg.gain.value = .22; this.rev.connect(rg); rg.connect(this.master);
    this.music = a.createGain(); this.music.connect(this.master); this.music.connect(this.rev);
    this.sfxG = a.createGain(); this.sfxG.connect(this.master); const sr = a.createGain(); sr.gain.value = .35; this.sfxG.connect(sr); sr.connect(this.rev);
    const nb = this.noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // vinyl crackle bed
    const cb = a.createBuffer(1, a.sampleRate * 3, a.sampleRate), cd = cb.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() < .0009 ? (Math.random() * 2 - 1) : 0) + (Math.random() * 2 - 1) * .012;
    const cs = a.createBufferSource(); cs.buffer = cb; cs.loop = true; const cf = a.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 2500; cf.Q.value = .6;
    this.crackle = a.createGain(); cs.connect(cf); cf.connect(this.crackle); this.crackle.connect(this.master); cs.start();
    this.applyVolumes();
    if (this.pending) { const p = this.pending; this.pending = null; this.play(p); }
  },
  applyVolumes() {
    if (!this.ctx) return; const s = G.settings;
    this.music.gain.value = s.music * .5; this.sfxG.gain.value = s.sfx * .75; this.crackle.gain.value = .5 * Math.max(s.music, s.sfx * .5);
  },
  suspend() { try { this.ctx?.suspend(); } catch (e) { } },
  resume() { try { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume(); } catch (e) { } },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  // ---- primitives ----
  tone(type, f, t, dur, vol, dest, o = {}) {
    const a = this.ctx, osc = a.createOscillator(), g = a.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + (o.slideT || dur));
    if (o.detune) osc.detune.value = o.detune;
    if (o.vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = o.vib; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vibD || f * .012, t + Math.min(.15, dur)); l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + .1); }
    const at = o.a || .006;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + at);
    if (o.sus) { g.gain.setValueAtTime(vol, t + dur * .7); }
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let node = osc;
    if (o.lp) { const f2 = a.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.setValueAtTime(o.lp, t); if (o.lpEnv) f2.frequency.exponentialRampToValueAtTime(o.lpEnv, t + dur); f2.Q.value = o.q || 1; node.connect(f2); node = f2; }
    node.connect(g); g.connect(dest || this.sfxG); osc.start(t); osc.stop(t + dur + .05);
  },
  noise(t, dur, vol, dest, type = 'bandpass', f = 1000, q = 1, o = {}) {
    const a = this.ctx, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = this.noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f, t); if (o.sweep) fl.frequency.exponentialRampToValueAtTime(o.sweep, t + dur); fl.Q.value = q;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.a || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfxG); s.start(t, Math.random() * .5); s.stop(t + dur + .05);
  },
  // ---- instruments ----
  inst(name, m, t, dur, vol = 1) {
    const f = mtof(m), M = this.music;
    switch (name) {
      case 'bass': this.tone('triangle', f, t, dur, .34 * vol, M, { lp: 900 }); this.tone('sine', f, t, dur * .8, .22 * vol, M); break;
      case 'piano': this.tone('triangle', f, t, .5, .07 * vol, M, { lp: 2600, lpEnv: 700 }); this.tone('sine', f * 2, t, .25, .025 * vol, M); break;
      case 'trumpet': this.tone('sawtooth', f, t, dur, .085 * vol, M, { a: .025, lp: 2400, lpEnv: 900, q: 3, vib: 5.6, vibD: f * .01, sus: 1 }); break;
      case 'clarinet': this.tone('square', f, t, dur, .05 * vol, M, { a: .03, lp: 1500, q: 1.5, vib: 5, vibD: f * .006, sus: 1 }); break;
      case 'whistle': this.tone('sine', f * 2, t, dur, .07 * vol, M, { a: .03, vib: 6, vibD: f * .02, sus: 1 }); break;
      case 'stab': this.tone('sawtooth', f, t, .16, .05 * vol, M, { a: .01, lp: 2800, lpEnv: 600, q: 2 }); break;
    }
  },
  drum(kind, t, vol = 1) {
    const M = this.music;
    if (kind === 'kick') this.tone('sine', 120, t, .22, .5 * vol, M, { slide: 45, slideT: .12 });
    else if (kind === 'snare') { this.noise(t, .14, .22 * vol, M, 'bandpass', 1900, .8); this.tone('triangle', 190, t, .08, .12 * vol, M); }
    else if (kind === 'hat') this.noise(t, .045, .08 * vol, M, 'highpass', 7000, .7);
    else if (kind === 'brush') this.noise(t, .16, .05 * vol, M, 'bandpass', 3200, .5, { a: .05 });
    else if (kind === 'wood') this.tone('sine', 900, t, .06, .12 * vol, M, { slide: 700 });
    else if (kind === 'chuff') this.noise(t, .1, .07 * vol, M, 'bandpass', 700, 1.2);
  },
  // ---- song sequencer ----
  play(name) {
    if (!this.ctx) { this.pending = name; return; }
    if (this.song && this.song.name === name) return;
    const s = SONGS[name]; this.song = Object.assign({}, s, { name, step: 0, next: this.ctx.currentTime + .08, t0: this.ctx.currentTime + .08, beats: 0 });
  },
  stopMusic() { this.song = null; this.pending = null; },
  beatPhase() {
    const s = this.song; if (!s || !this.ctx) return (G.t * 2.4) % 1;
    return ((this.ctx.currentTime - s.lastBeat) / (60 / s.curBpm) + 10) % 1;
  },
  tick() {
    const s = this.song, a = this.ctx; if (!s || !a || a.state !== 'running') return;
    if (s.next < a.currentTime - .25) s.next = a.currentTime + .03; // recover after suspend
    while (s.next < a.currentTime + .12) {
      const bpm = s.bpm * (s.name === 'fight' && G.intensity >= 2 ? 1.07 : 1); s.curBpm = bpm;
      const beat = 60 / bpm, i = s.step % 8;
      if (i % 2 === 0) s.lastBeat = s.next;
      this.step(s, s.step, s.next);
      s.next += (i % 2 === 0 ? s.swing : 1 - s.swing) * beat; s.step++;
    }
  },
  step(s, step, t) {
    const nb = s.chords.length, bar = Math.floor(step / 8) % nb, i = step % 8, beat = i >> 1, on = i % 2 === 0;
    const ch = parseChord(s.chords[bar]), root = ch.root, inten = s.name === 'fight' ? G.intensity : 0, soft = s.soft ? .7 : 1;
    // stride: bass on 1 & 3, chord on 2 & 4
    if (on && (beat === 0 || beat === 2)) this.inst('bass', 36 + root - (beat === 2 ? 5 : 0), t, .32, soft);
    if (on && (beat === 1 || beat === 3)) for (const iv of ch.iv) this.inst('piano', 55 + ((root + iv) % 12), t, .2, soft);
    // drums
    if (s.drums === 'hot') {
      if (on && (beat === 0 || beat === 2)) this.drum('kick', t, .9);
      if (on && (beat === 1 || beat === 3)) this.drum('snare', t, .8);
      this.drum('hat', t, on ? .7 : .45);
      if (inten >= 1 && bar % 2 === 1 && i === 7) for (const iv of ch.iv) this.inst('stab', 60 + ((root + iv) % 12), t);
      if (inten >= 2 && i >= 4 && bar % 4 === 3) this.drum('snare', t, .55);
      if (bar === nb - 1 && i >= 4) this.drum('snare', t, .7);
    } else if (s.drums === 'train') {
      this.drum('chuff', t, on ? .9 : .5); if (on && beat % 2 === 0) this.drum('kick', t, .35);
    } else { if (on) this.drum('brush', t, beat % 2 ? 1 : .6); if (on && beat === 0) this.drum('kick', t, .3); }
    // lead melody from phrase tables; repeats every 4 bars with variation so it sticks
    const sec = Math.floor(bar / 4) % 4, rh = RHY[(bar % 4 + sec * (sec === 2 ? 2 : 0)) % RHY.length], cont = CONT[(bar % 4 + (sec === 2 ? 3 : 0)) % CONT.length];
    const hit = rh[i]; if (!hit || hit === 2) return;
    let len = 1; while (i + len < 8 && rh[i + len] === 2) len++;
    const sc = s.scale, deg = cont[i] + (sec === 2 ? 2 : 0) + (bar % 4 === 3 ? -1 : 0);
    let m = 60 + s.key + sc[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);
    if (on) { // snap strong beats to chord tones
      let best = m, bd = 99; for (let o = -12; o <= 12; o += 12) for (const iv of ch.iv) { const cm = 60 + ((root + iv) % 12) + o; const d = Math.abs(cm - m); if (d < bd) { bd = d; best = cm; } }
      m = best;
    }
    if (s.name === 'fight' && m < 64) m += 12;
    const dur = len * (60 / s.curBpm) * .5 * 1.1;
    this.inst(s.lead, m, t, Math.max(.12, dur), soft);
    if (inten >= 2 && s.lead === 'trumpet') this.inst('trumpet', m - 12, t, Math.max(.12, dur), .5);
  },
  // ---- sound effects ----
  sfx(name, v = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime, S = this.sfxG;
    switch (name) {
      case 'click': this.tone('triangle', 720, t, .05, .12, S); this.tone('triangle', 1080, t + .03, .04, .06, S); break;
      case 'shoot': this.tone('square', 980, t, .05, .035 * v, S, { slide: 380, lp: 2500 }); break;
      case 'hit': this.tone('triangle', 420, t, .05, .07, S, { slide: 200 }); break;
      case 'ex': this.noise(t, .35, .2, S, 'bandpass', 500, 2, { sweep: 3000 }); this.tone('sawtooth', 300, t, .3, .07, S, { slide: 900, lp: 1800 }); break;
      case 'boomhit': this.tone('square', 260, t, .12, .1, S, { slide: 120, lp: 1400 }); this.noise(t, .1, .12, S, 'lowpass', 1500); break;
      case 'parry': this.tone('sine', 1760, t, .9, .22, S); this.tone('sine', 2637, t, .6, .08, S); this.tone('triangle', 880, t, .3, .1, S); break;
      case 'hurt': this.tone('sawtooth', 520, t, .3, .12, S, { slide: 110, lp: 1600 }); this.noise(t, .2, .14, S, 'lowpass', 1200); break;
      case 'honk': this.tone('sawtooth', 300, t, .5, .12, S, { slide: 560, slideT: .18, lp: 1800, q: 4, vib: 9, vibD: 18 }); this.tone('sawtooth', 302, t + .02, .5, .07, S, { slide: 540, slideT: .2, lp: 1500 }); break;
      case 'splash': this.noise(t, .35, .2, S, 'lowpass', 1400, 1, { sweep: 300 }); this.tone('sine', 700, t, .12, .07, S, { slide: 1300 }); break;
      case 'stomp': this.tone('sine', 95, t, .45, .5, S, { slide: 38 }); this.noise(t, .35, .28, S, 'lowpass', 500); break;
      case 'pop': this.noise(t, .22, .45, S, 'lowpass', 4000, 1, { sweep: 300 }); this.tone('sine', 700, t, .15, .3, S, { slide: 80 }); break;
      case 'card': this.tone('triangle', 1320, t, .06, .12, S); this.tone('triangle', 1760, t + .06, .08, .1, S); break;
      case 'page': this.noise(t, .28, .12, S, 'bandpass', 2600, .7, { sweep: 900, a: .06 }); break;
      case 'whistle': this.tone('square', 700, t, 1.1, .05, S, { a: .06, lp: 1500, vib: 6, vibD: 8, sus: 1 }); this.tone('square', 880, t, 1.1, .045, S, { a: .06, lp: 1500, sus: 1 }); this.tone('square', 1050, t, 1.1, .03, S, { a: .06, lp: 1600, sus: 1 }); break;
      case 'chuff': this.noise(t, .12, .08 * v, S, 'bandpass', 600, 1.2); break;
      case 'squeal': this.tone('sawtooth', 1900, t, .7, .035, S, { lp: 3000, vib: 20, vibD: 30, sus: 1 }); this.tone('sawtooth', 1940, t, .7, .03, S, { lp: 3000, sus: 1 }); break;
      case 'coin': this.tone('square', 1318, t, .07, .06, S, { lp: 3000 }); this.tone('square', 1760, t + .07, .14, .06, S, { lp: 3000 }); break;
      case 'locked': this.tone('square', 150, t, .12, .1, S, { lp: 700 }); this.tone('square', 140, t + .14, .14, .1, S, { lp: 700 }); break;
      case 'throw': this.noise(t, .2, .12, S, 'highpass', 1800, .7, { sweep: 5000 }); break;
      case 'bounce': this.tone('sine', 220, t, .2, .2, S, { slide: 660, slideT: .08 }); break;
      case 'cheer': this.noise(t, .9, .07, S, 'bandpass', 1300, .6, { a: .15 }); this.noise(t + .1, .7, .05, S, 'bandpass', 900, .6, { a: .1 }); break;
      case 'slow': this.tone('sine', 500, t, .5, .12, S, { slide: 150, vib: 12, vibD: 25 }); break;
      case 'warn': this.tone('triangle', 1000, t, .08, .08, S); break;
      case 'dash': this.noise(t, .16, .12, S, 'bandpass', 1200, 1, { sweep: 400 }); break;
      case 'jump': this.tone('sine', 300, t, .12, .08, S, { slide: 620 }); break;
      case 'land': this.noise(t, .07, .06, S, 'lowpass', 600); break;
      case 'buy': this.sfx('coin'); this.tone('triangle', 988, t + .16, .3, .1, S); this.tone('triangle', 1318, t + .26, .4, .1, S); break;
      case 'ready': for (let i = 0; i < 12; i++) this.noise(t + i * .05, .06, .06 + i * .012, S, 'bandpass', 1900, .8); break;
      case 'go': for (const m of [62, 66, 69, 74]) this.tone('sawtooth', mtof(m), t, .5, .06, S, { lp: 2600, lpEnv: 800, a: .01 }); this.tone('sine', 110, t, .4, .35, S, { slide: 45 }); this.noise(t, .5, .12, S, 'highpass', 5000); break;
      case 'knockout': [62, 66, 69, 74, 78].forEach((m, k) => this.tone('sawtooth', mtof(m), t + k * .09, .6, .07, S, { lp: 2800, lpEnv: 900, vib: 5, sus: 1 })); this.tone('sine', 90, t, .6, .4, S, { slide: 40 }); break;
      case 'death': [67, 66, 65, 62].forEach((m, k) => this.tone('sawtooth', mtof(m - 12), t + k * .32, k === 3 ? 1.1 : .32, .09, S, { lp: 1200, q: 3, vib: k === 3 ? 6 : 0, vibD: 5, sus: 1, slide: k === 3 ? mtof(m - 13) : 0 })); break;
      case 'win': [60, 64, 67, 72, 67, 72].forEach((m, k) => this.tone('square', mtof(m + 12), t + k * .11, .22, .05, S, { lp: 2400 })); break;
      case 'super': this.sfx('ex'); for (let i = 0; i < 18; i++) this.noise(t + i * .045, .06, .1, S, 'bandpass', 900 + i * 60, .8); [62, 66, 69, 74].forEach(m => this.tone('sawtooth', mtof(m), t + .8, .7, .06, S, { lp: 2800 })); break;
    }
  }
};
