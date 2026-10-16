import { describe, expect, it } from 'vitest';
import { STEP } from '../src/config';
import { vehicle } from '../src/data/vehicles';
import { RECORDS } from '../src/data/records';
import { HAZARDS } from '../src/data/chunks';
import { airTime, jumpApex, makeRunner, stepRunner, BUFFER_S, COYOTE_S } from '../src/systems/physics';
import { buildLevel } from '../src/systems/spawner';
import { solveLevel } from '../src/systems/solver';
import { recordSpeed } from '../src/systems/difficulty';

const canoe = vehicle('canoe');
const LANE = 598;

describe('runner physics', () => {
  it('tap vs hold: holding roughly doubles the height, capped at 220 ms', () => {
    const tap = jumpApex(canoe, 0);
    const full = jumpApex(canoe, 0.22);
    const longer = jumpApex(canoe, 0.5);
    expect(tap).toBeGreaterThan(110);
    expect(tap).toBeLessThan(135);
    expect(full).toBeGreaterThan(200);
    expect(full).toBeLessThan(245);
    expect(longer).toBeCloseTo(full, 0); // hold beyond 220 ms has no effect
  });

  it('air time stays readable (< 0.9 s)', () => {
    expect(airTime(canoe, 0.22)).toBeLessThan(0.9);
  });

  it('jump buffer: a press shortly before landing jumps on touchdown', () => {
    const s = makeRunner(LANE);
    stepRunner(s, canoe, { pressed: true, held: false }, LANE, STEP);
    // fall until just before landing
    let t = 0;
    while (!(s.vy > 0 && LANE - s.y < 20)) {
      stepRunner(s, canoe, { pressed: false, held: false }, LANE, STEP);
      t += STEP;
    }
    stepRunner(s, canoe, { pressed: true, held: false }, LANE, STEP); // early press
    let jumpedAgain = false;
    for (let i = 0; i < Math.ceil(BUFFER_S / STEP); i++) {
      const r = stepRunner(s, canoe, { pressed: false, held: false }, LANE, STEP);
      if (r.jumped) jumpedAgain = true;
    }
    expect(jumpedAgain).toBe(true);
  });

  it('coyote time: can still jump 80 ms after the surface drops away', () => {
    const s = makeRunner(LANE - 100);
    stepRunner(s, canoe, { pressed: false, held: false }, LANE - 100, STEP);
    // ledge ends: surface drops to LANE
    for (let i = 0; i < Math.floor(0.08 / STEP); i++) stepRunner(s, canoe, { pressed: false, held: false }, LANE, STEP);
    const r = stepRunner(s, canoe, { pressed: true, held: false }, LANE, STEP);
    expect(r.jumped).toBe(true);
    // …but not after coyote time has run out
    const s2 = makeRunner(LANE - 100);
    stepRunner(s2, canoe, { pressed: false, held: false }, LANE - 100, STEP);
    for (let i = 0; i < Math.ceil((COYOTE_S + 0.03) / STEP); i++) stepRunner(s2, canoe, { pressed: false, held: false }, LANE, STEP);
    expect(stepRunner(s2, canoe, { pressed: true, held: false }, LANE, STEP).jumped).toBe(false);
  });
});

describe('Act I hazards are clearable with a plain ~60 ms press (Act I teaches only "jump")', () => {
  const speed = recordSpeed(1);
  for (const [kind, defs] of Object.entries(HAZARDS)) {
    for (const [v, d] of defs.entries()) {
      it(`${kind} v${v}: timing window ≥ 0.1 s`, () => {
        // Sweep take-off distance and count how many steps clear the hazard.
        const hb = canoe.hitbox;
        let okSteps = 0;
        for (let lead = 0; lead < 1.2; lead += STEP) {
          const s = makeRunner(LANE);
          let x = -lead * speed; // player centre relative to hazard centre at take-off
          let t = 0;
          let hit = false;
          let first = true;
          while (t < 1.5) {
            stepRunner(s, canoe, { pressed: first, held: t < 0.06 }, LANE, STEP);
            first = false;
            t += STEP;
            x += speed * STEP;
            const px0 = x - hb.w / 2, px1 = x + hb.w / 2;
            const py1 = s.y - hb.inset, py0 = py1 - hb.h;
            const hx0 = -d.hitW / 2, hx1 = d.hitW / 2, hy0 = LANE - d.hitH, hy1 = LANE;
            if (px0 < hx1 && px1 > hx0 && py0 < hy1 && py1 > hy0) { hit = true; break; }
            if (px0 > hx1) break;
          }
          if (!hit) okSteps++;
        }
        console.log(`${kind} v${v} window ${(okSteps * STEP).toFixed(3)} s`);
        expect(okSteps * STEP).toBeGreaterThanOrEqual(0.1);
      });
    }
  }
});

describe('Record 01 levels are solvable (frame-perfect bot)', () => {
  const rec = RECORDS.r01;
  for (let seed = 1; seed <= 24; seed++) {
    it(`seed ${seed}`, () => {
      const level = buildLevel(rec, { seed, speed: recordSpeed(1), laneY: LANE, profile: canoe });
      const res = solveLevel(level, canoe);
      expect(res.ok).toBe(true);
    });
  }
  it('assist speed (0.75×) is solvable too', () => {
    const level = buildLevel(rec, { seed: 3, speed: recordSpeed(1, true), laneY: LANE, profile: canoe });
    expect(solveLevel(level, canoe).ok).toBe(true);
  });
});
