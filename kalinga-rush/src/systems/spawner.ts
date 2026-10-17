// Builds a record's level from hand-authored chunks (brief §5): a safe
// 5-second intro, a tutorial hazard, then chunks drawn from a difficulty
// window that slides upward, ending with the palm-leaf record. Also places
// the era's mechanics: gusts, shelters, dark stretches, letter platforms and
// rhythm gates.
import { PLAYER_X } from '../config';
import { CHUNKS, type Chunk, type ChunkItem } from '../data/chunks';
import { ARCH, type Arch } from '../data/hazards';
import type { RecordDef } from '../data/records';
import { Rng } from '../lib/rng';
import { makeRunner, stepRunner, type VehicleProfile } from './physics';
import { bufferFor, forgiveness, playerForgiveness } from './difficulty';
import type { Entity, Level, Zone } from './sim';

export const INTRO_S = 5;
const RECORD_LEAD_S = 2.6; // the record sits this long before the segment end

export interface BuildOptions {
  seed: number;
  speed: number;
  laneY: number;
  profile: VehicleProfile;
  assist?: boolean;
  /** Endless mode: override the length and difficulty window. */
  seconds?: number;
  difficulty?: [number, number];
}

const ODIA_LETTERS = ['ଅ', 'ଆ', 'ଇ', 'ଈ', 'ଉ', 'ଊ', 'ଏ', 'ଐ', 'ଓ', 'ଔ', 'କ', 'ଖ', 'ଗ', 'ଘ', 'ଙ', 'ଚ', 'ଛ', 'ଜ', 'ଝ', 'ଞ', 'ଟ', 'ଠ', 'ଡ', 'ଢ', 'ଣ', 'ତ', 'ଥ', 'ଦ', 'ଧ', 'ନ', 'ପ', 'ଫ', 'ବ', 'ଭ', 'ମ', 'ଯ', 'ର', 'ଲ', 'ଳ', 'ଶ', 'ଷ', 'ସ', 'ହ'];

export const CEIL_Y = { flight: 70, gravity: 170 };

export function buildLevel(rec: RecordDef, o: BuildOptions): Level {
  const rng = new Rng(`${rec.id}:${o.seed}`);
  const mode = o.profile.mode;
  const entities: Entity[] = [];
  const zones: Zone[] = [];
  const beatsOut: number[] = [];
  let id = 0;
  const xAt = (t: number) => PLAYER_X + t * o.speed;
  const forgive = forgiveness(rec.num, o.assist);
  const playerScale = playerForgiveness(rec.num, o.assist);
  const hbH = o.profile.hitbox.h * playerScale;
  const hbInset = o.profile.hitbox.inset;
  const riderMidY = o.laneY - hbInset - hbH / 2;
  const ceilY = mode === 'flight' ? CEIL_Y.flight : CEIL_Y.gravity;
  const floorY = mode === 'flight' ? o.laneY - 24 : o.laneY;
  const band = (f: number) => ceilY + 40 + f * (floorY - ceilY - 80);
  const noCowries = !!rec.mech.noCowries;
  const seconds = o.seconds ?? rec.segmentSeconds;

  const hazard = (arch: Arch, t: number, opts: { v?: number; y?: number } = {}) => {
    const vis = rec.hazards[arch];
    if (!vis) return null;
    const d = ARCH[arch];
    const x = xAt(t);
    let y = o.laneY;
    if (arch === 'ceil') y = ceilY;
    else if (d.anchor === 'centre') y = opts.y ?? (mode === 'flight' ? band(0.5) : o.laneY - (d.lift ?? 140));
    const vx = mode === 'flight' && arch === 'floater' ? -90 : d.vx;
    const e: Entity = {
      id: id++, kind: 'hazard', arch, vis, x, y, w: d.w, h: d.h, variant: opts.v ?? rng.int(0, 2), taken: false,
      hw: d.w * d.hitW * forgive, hh: d.h * d.hitH * forgive,
      vx, meetT: vx ? t : undefined, bob: d.bob, bobPhase: rng.next() * 6,
    };
    entities.push(e);
    return e;
  };
  const cowrie = (x: number, y: number) => {
    if (noCowries) return;
    entities.push({ id: id++, kind: 'cowrie', x, y, w: 28, h: 22, variant: 0, taken: false });
  };
  const prompt = (text: string, x: number, y: number) => {
    if (!text) return;
    entities.push({ id: id++, kind: 'prompt', x, y, w: 0, h: 0, variant: 0, taken: false, text });
  };
  /** Cowries along the path of a real jump taking off at time t, held `hold` s. */
  const cowrieArc = (t: number, hold: number, n: number) => {
    if (mode !== 'run') return cowrieRow(t, n, 0.5);
    const r = makeRunner(o.laneY);
    const pts: { x: number; y: number }[] = [];
    const dt = 1 / 120;
    let tt = 0;
    stepRunner(r, o.profile, { pressed: true, held: true }, o.laneY, dt);
    pts.push({ x: xAt(t), y: r.y });
    while (!r.grounded && tt < 2) {
      tt += dt;
      stepRunner(r, o.profile, { pressed: false, held: tt < hold }, o.laneY, dt);
      pts.push({ x: xAt(t + tt), y: r.y });
    }
    const a = Math.floor(pts.length * 0.14);
    const b = Math.floor(pts.length * 0.86);
    for (let i = 0; i < n; i++) {
      const p = pts[Math.round(a + ((b - a) * i) / Math.max(1, n - 1))];
      cowrie(p.x, p.y - hbInset - hbH / 2);
    }
  };
  const cowrieRow = (t: number, n: number, y?: number) => {
    const cy = mode === 'flight' ? band(y ?? 0.5) : mode === 'gravity' ? riderMidY : riderMidY;
    for (let i = 0; i < n; i++) cowrie(xAt(t + i * 0.16), cy);
  };
  const dolphin = (t: number) => {
    const D = 1.0;
    const X0 = xAt(t);
    entities.push({
      id: id++, kind: 'dolphin', x: X0, y: o.laneY + 4, w: 124, h: 56, variant: 0, taken: false,
      dolphin: { triggerX: xAt(t - D / 2), fromX: X0 + 150, toX: X0 - 150, height: 190, duration: D, startT: null, bonus: false },
    });
  };
  const friend = (t: number) => {
    entities.push({ id: id++, kind: 'friend', x: xAt(t), y: o.laneY, w: 90, h: 80, variant: rng.int(0, 2), taken: false, vis: rec.friends });
  };
  const gate = (t: number, centre: number, gap: number) => {
    // Columns of air hazards above and below a gap in the band.
    const top = band(centre - gap / 2);
    const bot = band(centre + gap / 2);
    const step = ARCH.air.h * 0.78;
    const col = (y: number) => { const e = hazard('air', t, { y }); if (e) e.bob = 0; };
    for (let y = top - ARCH.air.h * 0.32; y > ceilY - 10; y -= step) col(y);
    for (let y = bot + ARCH.air.h * 0.32; y < floorY + 20; y += step) col(y);
    cowrie(xAt(t), band(centre));
  };
  const letter = (t: number) => {
    const top = o.laneY - 104;
    const w = Math.max(220, 1.15 * o.speed);
    const x0 = xAt(t) - w / 2;
    entities.push({ id: id++, kind: 'platform', x: x0 + w / 2, y: top, w, h: 60, variant: 0, taken: false, plat: { top, x0, x1: x0 + w, glyph: rng.pick(ODIA_LETTERS) } });
    hazard('small', t + 0.05);
    for (let i = 0; i < 4; i++) cowrie(x0 + 30 + (i * (w - 60)) / 3, top - hbInset - hbH / 2);
  };

  const place = (it: ChunkItem, t: number) => {
    switch (it.k) {
      case 'cowrieArc': cowrieArc(t, it.hold ?? 0.1, it.n ?? 5); break;
      case 'cowrieRow': cowrieRow(t, it.n ?? 5, it.y); break;
      case 'dolphin': dolphin(t); break;
      case 'friend': friend(t); break;
      case 'gate': gate(t, it.y ?? 0.5, it.gap ?? 0.4); break;
      case 'letter': letter(t); break;
      default: {
        const y = mode === 'flight' && it.y !== undefined ? band(it.y) : undefined;
        hazard(it.k, t, { v: it.v, y });
      }
    }
  };

  // --- Intro: no hazards for the first 5 s (§5 "safe 5-second intro") --------
  const end = seconds;
  const recordT = end - RECORD_LEAD_S;
  if (mode === 'flight') {
    cowrieRow(1.2, 5, 0.5);
    cowrieRow(3.0, 5, 0.3);
  } else {
    cowrieRow(1.3, 4);
    cowrieArc(3.0, 0.08, 5);
  }
  const hasHazards = !rec.mech.noHazards && Object.keys(rec.hazards).length > 0;
  const firstArch = (['small', 'wide', 'pit', 'tall', 'air', 'roller', 'walker', 'floater'] as Arch[]).find((a) => rec.hazards[a]);
  if (hasHazards && firstArch && !rec.mech.rhythm) {
    const e = hazard(firstArch, INTRO_S, { v: 0, y: mode === 'flight' ? band(0.72) : undefined });
    if (e) prompt(rec.tutorial, e.x, mode === 'flight' ? band(0.3) : o.laneY - (firstArch === 'tall' ? 200 : 152));
  }

  // --- Chunks ---------------------------------------------------------------
  const lastHazardT = recordT - 1.6;
  let cursor = INTRO_S + 1.7;
  const [dLo, dHi] = o.difficulty ?? rec.difficulty;
  const minGap = Math.max(0.7, 1.05 - (rec.num - 1) * 0.0075);
  if (rec.mech.rhythm) {
    rhythmGates(INTRO_S - 1.5, lastHazardT + 0.8);
  } else if (!hasHazards) {
    // A breather: cowrie arcs and friends only.
    while (cursor < lastHazardT) {
      if (rng.chance(0.5)) cowrieArc(cursor, rng.pick([0.06, 0.12, 0.2]), 5);
      else cowrieRow(cursor, 6);
      if (rec.friends) friend(cursor + 0.5);
      cursor += 2.4;
    }
  } else {
    let prev = '';
    const allowed = (k: ChunkItem['k']) => {
      if (k === 'cowrieArc' || k === 'cowrieRow' || k === 'gate') return k !== 'gate' || !!rec.hazards.air;
      if (k === 'dolphin') return rec.friends === 'dolphin';
      if (k === 'friend') return !!rec.friends && rec.friends !== 'dolphin';
      if (k === 'letter') return !!rec.mech.platforms;
      return !!rec.hazards[k as Arch];
    };
    const pool = CHUNKS.filter((ch) => ch.mode === mode && ch.items.every((i) => allowed(i.k)));
    const sparse = !!rec.mech.sparse;
    while (cursor < lastHazardT) {
      const progress = (cursor - INTRO_S) / Math.max(1, lastHazardT - INTRO_S);
      const maxD = Math.round(dLo + (dHi - dLo) * Math.min(1, progress * 1.4));
      const minD = Math.max(1, maxD - 3);
      let options = pool.filter((ch) => ch.difficulty >= minD && ch.difficulty <= maxD && ch.id !== prev && cursor + ch.dur <= lastHazardT);
      if (!options.length) options = pool.filter((ch) => ch.difficulty <= maxD && ch.id !== prev && cursor + ch.dur <= lastHazardT);
      if (!options.length) break;
      options = options.flatMap((ch) => (ch.difficulty >= maxD - 1 ? [ch, ch] : [ch]));
      if (rec.mech.platforms) options = options.flatMap((ch) => (ch.items.some((i) => i.k === 'letter') ? [ch, ch, ch] : [ch]));
      const chunk: Chunk = rng.pick(options);
      prev = chunk.id;
      for (const it of chunk.items) place(it, cursor + it.at);
      cursor += chunk.dur + minGap + rng.range(0.15, 0.7) * (1 - progress * 0.4) + (sparse ? rng.range(1.6, 2.6) : 0);
    }
  }

  // --- Mechanics zones ---------------------------------------------------------
  if (rec.mech.wind) {
    const push = rec.mech.wind === 'push';
    let t = INTRO_S + 2.5;
    while (t < lastHazardT - 2) {
      const len = rng.range(1.8, 2.8);
      zones.push({ kind: 'wind', x0: xAt(t), x1: xAt(t + len), force: push ? -420 : 150, lift: push ? 0 : 420 });
      t += len + rng.range(3.5, 6);
    }
  }
  if (rec.mech.shelters) {
    for (const f of [0.28, 0.55, 0.8]) {
      const t = INTRO_S + (lastHazardT - INTRO_S) * f;
      const x0 = xAt(t);
      // Clear hazards inside the shelter so it really is a safe place.
      for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        if (e.kind === 'hazard' && e.x > x0 - 140 && e.x < x0 + 1.8 * o.speed + 140) entities.splice(i, 1);
      }
      zones.push({ kind: 'shelter', x0, x1: x0 + 1.8 * o.speed });
    }
    // Shelters break the wind.
    for (const z of zones.filter((zz) => zz.kind === 'wind')) {
      for (const s of zones.filter((zz) => zz.kind === 'shelter')) if (z.x1 > s.x0 && z.x0 < s.x1) z.x1 = z.x0;
    }
  }
  if (rec.mech.dark) {
    zones.push({ kind: 'dark', x0: xAt(INTRO_S + (lastHazardT - INTRO_S) * 0.35), x1: xAt(INTRO_S + (lastHazardT - INTRO_S) * 0.72) });
  }

  // --- The palm-leaf record ------------------------------------------------------
  let recY = o.laneY - 196;
  if (mode === 'flight') recY = band(0.5);
  if (mode === 'gravity') recY = o.laneY - 108;
  if (mode === 'run') cowrieArc(recordT - 0.75, 0.06, 3);
  else cowrieRow(recordT - 0.9, 4, 0.5);
  const recX = xAt(recordT);
  const recordEntity: Entity = { id: id++, kind: 'record', x: recX, y: recY, w: 104, h: 34, variant: 0, taken: false, vis: rec.recordVis ?? 'leaf' };
  entities.push(recordEntity);
  const what = rec.recordVis === 'drum' ? 'Catch the drum' : rec.recordVis === 'oar' ? 'Catch the oar' : 'Catch the palm-leaf record';
  prompt(what, recX, mode === 'flight' ? band(0.18) : mode === 'gravity' ? o.laneY - 190 : o.laneY - 262);

  entities.sort((a, b) => a.x - b.x);
  return {
    recordId: rec.id, num: rec.num, mode, terrain: rec.terrain, speed: o.speed, laneY: o.laneY, ceilY, floorY,
    endX: xAt(end), entities, zones, recordEntity, seed: o.seed, playerScale, buffer: bufferFor(rec.num),
    beats: beatsOut.length ? beatsOut : undefined, seconds: end,
  };

  // Rhythm gates on the mardala's beat (∞): tempo rises from 100 to 152 BPM.
  function rhythmGates(t0: number, t1: number) {
    let t = t0;
    let beat = 0;
    let centre = 0.5;
    while (t < t1) {
      const k = (t - t0) / (t1 - t0);
      const bpm = 100 + 52 * k;
      const spb = 60 / bpm;
      beatsOut.push(t);
      if (beat % 2 === 0 && t > t0 + 1.5) {
        centre = Math.max(0.28, Math.min(0.72, centre + rng.range(-0.3, 0.3)));
        gate(t, centre, 0.4 - 0.08 * k);
      }
      t += spb;
      beat++;
    }
  }
}

