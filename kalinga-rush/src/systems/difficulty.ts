// Speed and forgiveness curves (brief §5, plus playtest feedback):
// - speed: +3.5% per record within an act, and act multipliers that set where
//   each act starts, so the end of Act VI ≈ 2.1× and the end of Act VII ≈ 2.8×
//   the base 280 px/s.
// - forgiveness: hitboxes start small (generous) and tighten record by
//   record, so early mistakes are forgiven and the late game is precise.
import { BASE_SPEED, SPEED_PER_RECORD, ASSIST_SPEED } from '../config';
import { OUTLINE } from '../data/records';
import type { ActNum } from '../data/palettes';

const ACT_START: Record<ActNum, number> = { 1: 1.0, 2: 1.15, 3: 1.45, 4: 1.5, 5: 1.65, 6: 1.787, 7: 2.25 };

export function speedMultiplier(num: number): number {
  const rec = OUTLINE.find((r) => r.num === num);
  if (!rec) return 1;
  const first = OUTLINE.find((r) => r.act === rec.act)!.num;
  const somber = rec.somber ? 0.82 : 1;
  return ACT_START[rec.act] * (1 + SPEED_PER_RECORD * (num - first)) * somber;
}

export function recordSpeed(num: number, assist = false): number {
  return BASE_SPEED * speedMultiplier(num) * (assist ? ASSIST_SPEED : 1);
}

/**
 * Hitbox scale for hazards: 0.62 at Record 01 → 1.0 by the end of Act VI and
 * beyond. (1.0 = the ~70%-of-sprite hitboxes of the brief.)
 */
export function forgiveness(num: number, assist = false): number {
  const k = Math.min(1, Math.max(0, (num - 1) / 36));
  const f = 0.62 + 0.38 * Math.pow(k, 0.85);
  return assist ? Math.max(0.55, f - 0.12) : f;
}

/** The player's own hitbox shrinks a little in the forgiving early game too. */
export function playerForgiveness(num: number, assist = false): number {
  const f = forgiveness(num, assist);
  return 0.82 + 0.18 * ((f - 0.62) / 0.38);
}

/** Jump buffer: early records accept presses a little earlier. */
export function bufferFor(num: number): number {
  return num <= 15 ? 0.16 : num <= 30 ? 0.14 : 0.12;
}
