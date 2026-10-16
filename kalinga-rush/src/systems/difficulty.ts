// Speed curve (brief §5): +3.5% per record within an act, and act multipliers
// that set where each act starts, so the end of Act VI ≈ 2.1× and the end of
// Act VII ≈ 2.8× the base 280 px/s.
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
