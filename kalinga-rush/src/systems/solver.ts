// Frame-perfect solvability search (brief §5). Plays a generated level with
// the real sim and finds a press/hold plan that avoids every hazard and
// catches the record. Used by unit tests and tools/solvability-bot.ts.
import { STEP } from '../config';
import { cloneRunner, type VehicleProfile } from './physics';
import { createSim, playerBox, stepSim, type Entity, type Level, type SimOptions, type SimState } from './sim';

export interface Press { t: number; hold: number }
export interface SolveResult { ok: boolean; presses: Press[]; failedAt?: number; nodes: number }

interface Snap { s: SimState; ents: { taken: boolean; startT: number | null; bonus: boolean }[] }

function snap(s: SimState, level: Level): Snap {
  return {
    s: { ...s, runner: cloneRunner(s.runner), events: [] },
    ents: level.entities.map((e) => ({ taken: e.taken, startT: e.dolphin?.startT ?? null, bonus: e.dolphin?.bonus ?? false })),
  };
}
function restore(sn: Snap, level: Level): SimState {
  sn.ents.forEach((v, i) => {
    const e = level.entities[i];
    e.taken = v.taken;
    if (e.dolphin) { e.dolphin.startT = v.startT; e.dolphin.bonus = v.bonus; }
  });
  return { ...sn.s, runner: cloneRunner(sn.s.runner), events: [] };
}

const HOLDS = [0, 0.04, 0.08, 0.12, 0.17, 0.22];

export function solveLevel(level: Level, p: VehicleProfile, maxNodes = 60000): SolveResult {
  const opts: SimOptions = { lives: 1 };
  const targets: Entity[] = level.entities.filter((e) => e.hit || e.kind === 'record');
  let nodes = 0;
  const plan: Press[] = [];

  const advanceIdle = (s: SimState, steps: number) => {
    for (let i = 0; i < steps && !s.dead && !s.ended; i++) stepSim(s, level, p, { pressed: false, held: false }, STEP, opts);
  };

  const solveFrom = (sn: Snap, ti: number): boolean => {
    if (nodes > maxNodes) return false;
    // Skip targets already behind the player.
    let s = restore(sn, level);
    while (ti < targets.length) {
      const e = targets[ti];
      const box = playerBox(s, p);
      if (e.kind === 'record' ? e.taken : e.hit!.x + e.hit!.w < box.x) ti++;
      else break;
    }
    if (ti >= targets.length) {
      while (!s.ended && !s.dead) advanceIdle(s, 60);
      return !s.dead;
    }
    const target = targets[ti];
    // Latest moment a take-off could still matter: when the target reaches the player.
    const box0 = playerBox(s, p);
    const targetLeft = target.kind === 'record' ? target.x - 60 : target.hit!.x;
    const lastStep = Math.max(0, Math.ceil((targetLeft - (box0.x + box0.w)) / (level.speed * STEP)) + 2);
    const firstStep = Math.max(0, lastStep - Math.ceil(0.9 / STEP));
    const base = snap(s, level);
    for (let k = lastStep; k >= firstStep; k -= 2) {
      for (const hold of HOLDS) {
        nodes++;
        s = restore(base, level);
        advanceIdle(s, k);
        if (s.dead) continue;
        if (!s.runner.grounded) continue;
        const pressT = s.t;
        let held = 0;
        stepSim(s, level, p, { pressed: true, held: true }, STEP, opts);
        // Fly until we land past the target (or catch it), or die.
        let guard = 0;
        while (!s.dead && !s.ended && guard++ < 600) {
          held += STEP;
          stepSim(s, level, p, { pressed: false, held: held < hold }, STEP, opts);
          if (s.runner.grounded) break;
        }
        if (s.dead) continue;
        const after = playerBox(s, p);
        const cleared = target.kind === 'record' ? target.taken : target.hit!.x + target.hit!.w < after.x + after.w;
        if (target.kind === 'record' && !target.taken) continue;
        if (!cleared && target.kind !== 'record') {
          // Landed before the hazard: this jump was a no-op for the target; let a later candidate handle it.
          continue;
        }
        plan.push({ t: pressT, hold });
        if (solveFrom(snap(s, level), ti + 1)) return true;
        plan.pop();
      }
    }
    return false;
  };

  const s0 = createSim(level, opts);
  const ok = solveFrom(snap(s0, level), 0);
  // Leave the level clean for the caller.
  for (const e of level.entities) {
    e.taken = false;
    if (e.dolphin) { e.dolphin.startT = null; e.dolphin.bonus = false; }
  }
  return { ok, presses: ok ? [...plan] : [], nodes, failedAt: ok ? undefined : nodes };
}
