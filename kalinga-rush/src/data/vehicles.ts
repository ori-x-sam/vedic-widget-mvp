// Jump feel per vehicle (§2.3). Most rides share the canoe's tuned jump with
// small differences; the boita carrying an elephant is heavier (lower arc),
// flight and orbit rides use their own modes.
import type { VehicleId, VehicleProfile } from '../systems/physics';

const RUN = { mode: 'run' as const, jumpVelocity: 820, gravity: 2700, holdGravity: 950, fallMul: 1.1, hitbox: { w: 60, h: 70, inset: 6 } };

const v = (id: VehicleId, over: Partial<VehicleProfile> = {}): VehicleProfile => ({ id, ...RUN, ...over });

export const VEHICLES: Record<VehicleId, VehicleProfile> = {
  canoe: v('canoe'),
  cart: v('cart', { jumpVelocity: 830 }),
  boita: v('boita', { jumpVelocity: 800, gravity: 2600 }),
  foot: v('foot', { jumpVelocity: 860, gravity: 2850, hitbox: { w: 50, h: 72, inset: 4 } }),
  elephant: v('elephant', { jumpVelocity: 800, gravity: 2550, holdGravity: 900 }),
  // Heavy cargo (§3 Record 12): a noticeably lower, slower arc, taught gently.
  boitaElephant: v('boitaElephant', { jumpVelocity: 680, gravity: 2300, holdGravity: 820, fallMul: 1.05 }),
  palanquin: v('palanquin', { jumpVelocity: 820 }),
  pressCart: v('pressCart', { jumpVelocity: 820 }),
  bicycle: v('bicycle', { jumpVelocity: 840 }),
  countryBoat: v('countryBoat', { jumpVelocity: 790, gravity: 2600 }),
  bus: v('bus', { jumpVelocity: 800, gravity: 2650 }),
  train: v('train', { jumpVelocity: 800, gravity: 2650 }),
  scooter: v('scooter', { jumpVelocity: 850 }),
  maglev: v('maglev', { jumpVelocity: 860, gravity: 2750 }),
  eboat: v('eboat', { jumpVelocity: 830 }),
  dakota: v('dakota', { mode: 'flight', climb: 2300, sink: 1250, maxUp: 470, maxDown: 520, hitbox: { w: 92, h: 34, inset: 0 } }),
  glider: v('glider', { mode: 'flight', climb: 2200, sink: 1100, maxUp: 440, maxDown: 480, hitbox: { w: 84, h: 32, inset: 0 } }),
  starBoita: v('starBoita', { mode: 'flight', climb: 2600, sink: 1450, maxUp: 540, maxDown: 580, hitbox: { w: 86, h: 34, inset: 0 } }),
  // Low gravity in orbit: floatier flips.
  lightsail: v('lightsail', { mode: 'gravity', gravity: 1750, flipKick: 300, hitbox: { w: 56, h: 64, inset: 4 } }),
};

export function vehicle(id: VehicleId): VehicleProfile {
  return VEHICLES[id];
}
