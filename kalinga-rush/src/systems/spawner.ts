// Builds a record's level from hand-authored chunks (brief §5): a safe
// 5-second intro, a tutorial hazard, then chunks drawn from a difficulty
// window that slides upward, ending with the palm-leaf record.
import { PLAYER_X } from '../config';
import { CHUNKS, HAZARDS, type Chunk } from '../data/chunks';
import type { HazardKind, RecordDef } from '../data/records';
import { Rng } from '../lib/rng';
import { makeRunner, stepRunner, type VehicleProfile } from './physics';
import type { Entity, Level } from './sim';

export const INTRO_S = 5;
/** Minimum seconds between the last hazard of one chunk and the first of the next. */
export const MIN_CHUNK_GAP_S = 1.05;
const RECORD_LEAD_S = 2.6; // record sits this long before the segment end

export interface BuildOptions {
  seed: number;
  speed: number;
  laneY: number;
  profile: VehicleProfile;
}

export function buildLevel(rec: RecordDef, o: BuildOptions): Level {
  const rng = new Rng(`${rec.id}:${o.seed}`);
  const entities: Entity[] = [];
  let id = 0;
  const xAt = (t: number) => PLAYER_X + t * o.speed;
  const hbH = o.profile.hitbox.h;
  const hbInset = o.profile.hitbox.inset;
  const riderMidY = o.laneY - hbInset - hbH / 2;

  const hazard = (kind: HazardKind, t: number, variant?: number) => {
    const defs = HAZARDS[kind];
    const v = variant ?? rng.int(0, defs.length - 1);
    const d = defs[Math.min(v, defs.length - 1)];
    const x = xAt(t);
    entities.push({
      id: id++, kind, x, y: o.laneY, w: d.w, h: d.h, variant: v, taken: false,
      hit: { x: x - d.hitW / 2, y: o.laneY - d.hitH, w: d.hitW, h: d.hitH },
    });
    return x;
  };
  const cowrie = (x: number, y: number) => {
    entities.push({ id: id++, kind: 'cowrie', x, y, w: 28, h: 22, variant: 0, taken: false, hit: null });
  };
  const prompt = (text: string, x: number, y: number) => {
    entities.push({ id: id++, kind: 'prompt', x, y, w: 0, h: 0, variant: 0, taken: false, hit: null, text });
  };
  /** Cowries along the path of a real jump taking off at time t, held `hold` s. */
  const cowrieArc = (t: number, hold: number, n: number) => {
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
  const cowrieRow = (t: number, n: number) => {
    for (let i = 0; i < n; i++) cowrie(xAt(t + i * 0.16), riderMidY);
  };
  const dolphin = (t: number) => {
    const D = 1.0;
    const X0 = xAt(t);
    entities.push({
      id: id++, kind: 'dolphin', x: X0, y: o.laneY + 4, w: 124, h: 56, variant: 0, taken: false, hit: null,
      dolphin: { triggerX: xAt(t - D / 2), fromX: X0 + 150, toX: X0 - 150, height: 190, duration: D, startT: null, bonus: false },
    });
  };

  // --- Intro: no hazards for the first 5 s (§5 "safe 5-second intro") --------
  cowrieRow(1.3, 4);
  cowrieArc(3.0, 0.08, 5);
  // Tutorial hazard.
  const tutX = hazard(rec.hazards[0], INTRO_S, 0);
  prompt(rec.hazards[0] === 'reed' ? 'Jump the reeds' : 'Jump!', tutX, o.laneY - 150);

  // --- Chunks ---------------------------------------------------------------
  const end = rec.segmentSeconds;
  const recordT = end - RECORD_LEAD_S;
  const lastHazardT = recordT - 1.6;
  let cursor = INTRO_S + 1.7;
  const [dLo, dHi] = rec.difficulty;
  let prev = '';
  let promptedHold = false;
  const pool = CHUNKS.filter((c) => c.terrain === 'water' && c.items.every((i) => i.k === 'cowrieArc' || i.k === 'cowrieRow' || i.k === 'dolphin' || rec.hazards.includes(i.k as HazardKind)));
  while (cursor < lastHazardT) {
    const progress = (cursor - INTRO_S) / (lastHazardT - INTRO_S);
    const maxD = Math.round(dLo + (dHi - dLo) * Math.min(1, progress * 1.5));
    const minD = Math.max(1, maxD - 2);
    let options = pool.filter((c) => c.difficulty >= minD && c.difficulty <= maxD && c.id !== prev && cursor + c.dur <= lastHazardT);
    if (!options.length) break;
    // Prefer the newest difficulty a little.
    options = options.flatMap((c) => (c.difficulty === maxD ? [c, c] : [c]));
    const chunk: Chunk = rng.pick(options);
    prev = chunk.id;
    for (const it of chunk.items) {
      const t = cursor + it.at;
      switch (it.k) {
        case 'cowrieArc': cowrieArc(t, it.hold ?? 0.1, it.n ?? 5); break;
        case 'cowrieRow': cowrieRow(t, it.n ?? 5); break;
        case 'dolphin': dolphin(t); break;
        default: {
          const x = hazard(it.k, t, it.v);
          if (chunk.id === 'stakes-high' && !promptedHold) {
            prompt('Hold for a higher jump', x, o.laneY - 200);
            promptedHold = true;
          }
        }
      }
    }
    cursor += chunk.dur + MIN_CHUNK_GAP_S + rng.range(0.15, 0.75) * (1 - progress * 0.35);
  }

  // --- The palm-leaf record --------------------------------------------------
  cowrieArc(recordT - 0.75, 0.06, 3);
  const recX = xAt(recordT);
  const recordEntity: Entity = { id: id++, kind: 'record', x: recX, y: o.laneY - 196, w: 104, h: 34, variant: 0, taken: false, hit: null };
  entities.push(recordEntity);
  prompt('Catch the palm-leaf record', recX, o.laneY - 262);

  entities.sort((a, b) => a.x - b.x);
  return { recordId: rec.id, speed: o.speed, laneY: o.laneY, endX: xAt(end), entities, recordEntity, seed: o.seed };
}
