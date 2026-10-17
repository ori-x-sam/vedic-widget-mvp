// Frame-perfect solvability search (brief §5). A beam search over button
// decisions (every 1/30 s: release, hold, or press) that plays the real sim
// for every ride mode, and finds a plan that avoids every hazard and catches
// the record. Used by unit tests, tools/solvability-bot.ts and the autopilot.
import { STEP } from '../config';
import type { VehicleProfile } from './physics';
import { cloneSim, createSim, stepSim, type Level, type SimOptions, type SimState } from './sim';

/** Decision codes: 0 release, 1 hold, 2 press (and hold). */
export type Action = 0 | 1 | 2;
export const DECISION_STEPS = 4;

export interface SolveResult {
  ok: boolean;
  /** One action per decision (every DECISION_STEPS sim steps). */
  plan: Uint8Array;
  failedAt?: number;
  nodes: number;
}

interface Node { s: SimState; parent: Node | null; a: Action }

function keyOf(s: SimState, level: Level): string {
  const r = s.runner;
  const rc = s.recordCaught ? 1 : 0;
  const dx = Math.round(s.dx / 8);
  if (level.mode === 'flight') return `${Math.round(r.y / 7)}|${Math.round(r.vy / 50)}|${dx}|${rc}`;
  if (level.mode === 'gravity') return `${r.gsign}|${Math.round(r.y / 8)}|${r.grounded ? 1 : 0}|${Math.round(r.vy / 60)}|${rc}`;
  return `${Math.round(r.y / 4)}|${Math.round(r.vy / 40)}|${r.holding ? 1 : 0}|${r.grounded ? 1 : 0}|${dx}|${r.buffer > 0 ? 1 : 0}|${rc}`;
}

function actionsFor(level: Level, s: SimState): Action[] {
  if (level.mode === 'flight') return [0, 1];
  if (level.mode === 'gravity') return [0, 2];
  // Run: holding only matters while rising from a jump.
  return s.runner.grounded && !s.runner.holding ? [0, 2] : [0, 1, 2];
}

function stepWith(s: SimState, level: Level, p: VehicleProfile, a: Action, opts: SimOptions): void {
  for (let k = 0; k < DECISION_STEPS && !s.dead && !s.ended; k++) {
    stepSim(s, level, p, { pressed: a === 2 && k === 0, held: a !== 0 }, STEP, opts);
    s.events.length = 0;
  }
}

function resetLevel(level: Level): void {
  for (const e of level.entities) {
    e.taken = false;
    e.bonus = false;
    if (e.dolphin) { e.dolphin.startT = null; e.dolphin.bonus = false; }
  }
}

export function solveLevel(level: Level, p: VehicleProfile, opts: { beam?: number; startScroll?: number } = {}): SolveResult {
  const B = opts.beam ?? (level.mode === 'flight' ? 96 : 40);
  const simOpts: SimOptions = { lives: 1, startScroll: opts.startScroll };
  let beam: Node[] = [{ s: createSim(level, simOpts), parent: null, a: 0 }];
  let nodes = 0;
  let winner: Node | null = null;
  let lastT = 0;
  const needRecord = !!level.recordEntity;
  while (beam.length && !winner) {
    const next = new Map<string, Node>();
    for (const n of beam) {
      for (const a of actionsFor(level, n.s)) {
        const s = cloneSim(n.s);
        stepWith(s, level, p, a, simOpts);
        nodes++;
        if (s.dead) continue;
        const node: Node = { s, parent: n, a };
        if (s.ended) {
          if (!needRecord || s.recordCaught) {
            winner = node;
            break;
          }
          continue;
        }
        if (needRecord && s.recordMissed) continue;
        const key = keyOf(s, level);
        if (!next.has(key)) next.set(key, node);
      }
      if (winner) break;
    }
    if (winner) break;
    let list = [...next.values()];
    if (list.length > B) {
      // Prefer states that already hold the record, then spread across heights.
      // Order by height, then vertical speed, so an even pick covers both.
      list.sort((x, y) => Number(y.s.recordCaught) - Number(x.s.recordCaught) || Math.round(x.s.runner.y / 12) - Math.round(y.s.runner.y / 12) || x.s.runner.vy - y.s.runner.vy);
      const caught = list.filter((n) => n.s.recordCaught);
      const rest = list.filter((n) => !n.s.recordCaught);
      const pick: Node[] = caught.slice(0, B);
      const room = B - pick.length;
      // Spread evenly across heights, always keeping both extremes.
      for (let i = 0; i < room && rest.length; i++) pick.push(rest[room > 1 ? Math.round((i * (rest.length - 1)) / (room - 1)) : 0]);
      list = pick;
    }
    if (list.length) lastT = list[0].s.t;
    beam = list;
  }
  resetLevel(level);
  if (!winner) return { ok: false, plan: new Uint8Array(0), failedAt: lastT, nodes };
  const acts: number[] = [];
  for (let n: Node | null = winner; n && n.parent; n = n.parent) acts.push(n.a);
  acts.reverse();
  return { ok: true, plan: Uint8Array.from(acts), nodes };
}

/** Replays a plan: input for sim step `k` (counted from the solve's start). */
export function planInput(plan: Uint8Array, k: number): { pressed: boolean; held: boolean } {
  const a = plan[Math.floor(k / DECISION_STEPS)] ?? 0;
  return { pressed: a === 2 && k % DECISION_STEPS === 0, held: a !== 0 };
}
