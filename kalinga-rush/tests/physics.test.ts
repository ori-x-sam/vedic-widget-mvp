import { describe, expect, it } from 'vitest';
import { STEP } from '../src/config';
import { vehicle } from '../src/data/vehicles';
import { OUTLINE, RECORDS } from '../src/data/records';
import { ARCH } from '../src/data/hazards';
import { airTime, jumpApex, makeRunner, stepFlight, stepGravity, stepRunner, BUFFER_S, COYOTE_S } from '../src/systems/physics';
import { buildLevel } from '../src/systems/spawner';
import { solveLevel } from '../src/systems/solver';
import { forgiveness, recordSpeed } from '../src/systems/difficulty';

const canoe = vehicle('canoe');
const LANE = 598;

describe('runner physics', () => {
  it('tap vs hold: holding roughly doubles the height, capped at 220 ms', () => {
    const tap = jumpApex(canoe, 0);
    const full = jumpApex(canoe, 0.22);
    expect(tap).toBeGreaterThan(110);
    expect(tap).toBeLessThan(135);
    expect(full).toBeGreaterThan(200);
    expect(full).toBeLessThan(245);
    expect(jumpApex(canoe, 0.5)).toBeCloseTo(full, 0);
  });

  it('heavy cargo jumps noticeably lower (Record 12)', () => {
    expect(jumpApex(vehicle('boitaElephant'), 0)).toBeLessThan(jumpApex(canoe, 0) * 0.85);
  });

  it('air time stays readable (< 0.9 s)', () => {
    expect(airTime(canoe, 0.22)).toBeLessThan(0.9);
  });

  it('jump buffer: a press shortly before landing jumps on touchdown', () => {
    const s = makeRunner(LANE);
    stepRunner(s, canoe, { pressed: true, held: false }, LANE, STEP);
    while (!(s.vy > 0 && LANE - s.y < 20)) stepRunner(s, canoe, { pressed: false, held: false }, LANE, STEP);
    stepRunner(s, canoe, { pressed: true, held: false }, LANE, STEP);
    let again = false;
    for (let i = 0; i < Math.ceil(BUFFER_S / STEP); i++) if (stepRunner(s, canoe, { pressed: false, held: false }, LANE, STEP).jumped) again = true;
    expect(again).toBe(true);
  });

  it('coyote time: can still jump 80 ms after the surface drops away', () => {
    const s = makeRunner(LANE - 100);
    stepRunner(s, canoe, { pressed: false, held: false }, LANE - 100, STEP);
    for (let i = 0; i < Math.floor(0.08 / STEP); i++) stepRunner(s, canoe, { pressed: false, held: false }, LANE, STEP);
    expect(stepRunner(s, canoe, { pressed: true, held: false }, LANE, STEP).jumped).toBe(true);
    const s2 = makeRunner(LANE - 100);
    stepRunner(s2, canoe, { pressed: false, held: false }, LANE - 100, STEP);
    for (let i = 0; i < Math.ceil((COYOTE_S + 0.03) / STEP); i++) stepRunner(s2, canoe, { pressed: false, held: false }, LANE, STEP);
    expect(stepRunner(s2, canoe, { pressed: true, held: false }, LANE, STEP).jumped).toBe(false);
  });

  it('flight: holding climbs, releasing glides down, bounded', () => {
    const p = vehicle('dakota');
    const s = makeRunner(400);
    for (let i = 0; i < 60; i++) stepFlight(s, p, { pressed: false, held: true }, 574, 70, STEP);
    expect(s.y).toBeLessThan(300);
    for (let i = 0; i < 240; i++) stepFlight(s, p, { pressed: false, held: false }, 574, 70, STEP);
    expect(s.y).toBe(574);
  });

  it('gravity flip: a tap sends you to the ceiling and back', () => {
    const p = vehicle('lightsail');
    const s = makeRunner(LANE);
    stepGravity(s, p, { pressed: true, held: false }, LANE, 170, STEP);
    for (let i = 0; i < 120 && !s.grounded; i++) stepGravity(s, p, { pressed: false, held: false }, LANE, 170, STEP);
    expect(s.y).toBe(170);
    stepGravity(s, p, { pressed: true, held: false }, LANE, 170, STEP);
    for (let i = 0; i < 120 && !s.grounded; i++) stepGravity(s, p, { pressed: false, held: false }, LANE, 170, STEP);
    expect(s.y).toBe(LANE);
  });
});

/** Seconds of take-off timing that clear a lone hazard with a plain ~60 ms press. */
function window(arch: 'small' | 'wide' | 'tall', num: number, speedNum = num): number {
  const p = vehicle('canoe');
  const speed = recordSpeed(speedNum);
  const f = forgiveness(num);
  const d = ARCH[arch];
  const hw = d.w * d.hitW * f, hh = d.h * d.hitH * f;
  const pw = p.hitbox.w * (0.82 + 0.18 * ((f - 0.62) / 0.38));
  const ph = p.hitbox.h * (0.82 + 0.18 * ((f - 0.62) / 0.38));
  let ok = 0;
  for (let lead = 0; lead < 1.4; lead += STEP) {
    const s = makeRunner(LANE);
    let x = -lead * speed;
    let t = 0;
    let hit = false;
    let first = true;
    while (t < 1.6) {
      stepRunner(s, p, { pressed: first, held: t < 0.06 }, LANE, STEP);
      first = false;
      t += STEP;
      x += speed * STEP;
      const px0 = x - pw / 2, px1 = x + pw / 2;
      const py1 = s.y - p.hitbox.inset, py0 = py1 - ph;
      if (px0 < hw / 2 && px1 > -hw / 2 && py0 < LANE && py1 > LANE - hh) { hit = true; break; }
      if (px0 > hw / 2) break;
    }
    if (!hit) ok++;
  }
  return ok * STEP;
}

describe('forgiveness: generous early, precise late', () => {
  it('Record 01 gives a wide timing window for every hazard (≥ 0.25 s)', () => {
    for (const a of ['small', 'wide', 'tall'] as const) expect(window(a, 1)).toBeGreaterThanOrEqual(0.25);
  });
  it('windows shrink as the game goes on', () => {
    expect(window('small', 30, 1)).toBeLessThan(window('small', 1));
    expect(forgiveness(37)).toBeCloseTo(1, 2);
  });
});

describe('every record is solvable (frame-perfect bot)', () => {
  for (const o of OUTLINE) {
    it(`${o.id} ${o.headline}`, () => {
      const rec = RECORDS[o.id];
      const p = vehicle(rec.ride);
      const level = buildLevel(rec, { seed: 1, speed: recordSpeed(rec.num), laneY: LANE, profile: p });
      const res = solveLevel(level, p);
      expect(res.ok, `failed at t=${res.failedAt?.toFixed(2)}s`).toBe(true);
    }, 30000);
  }
});
