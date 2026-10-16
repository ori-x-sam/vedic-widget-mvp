// Jump feel per vehicle (§2.3). Phase 1 tunes the dugout canoe; the rest are
// filled in as their records are built.
import type { VehicleId, VehicleProfile } from '../systems/physics';

export const VEHICLES: Partial<Record<VehicleId, VehicleProfile>> = {
  // Light, bobbing dugout. A normal ~60 ms press clears every Act I hazard;
  // holding (up to 220 ms) roughly doubles the height.
  canoe: {
    id: 'canoe',
    jumpVelocity: 820,
    gravity: 2700,
    holdGravity: 950,
    fallMul: 1.1,
    hitbox: { w: 60, h: 70, inset: 6 },
  },
};

export function vehicle(id: VehicleId): VehicleProfile {
  const v = VEHICLES[id];
  if (!v) throw new Error(`Vehicle "${id}" is not built yet`);
  return v;
}
