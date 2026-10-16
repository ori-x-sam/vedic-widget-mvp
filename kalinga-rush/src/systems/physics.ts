// Runner physics: pure, deterministic, no Phaser. The game, the unit tests
// and the solvability bot all step exactly this code at a fixed 120 Hz.

export const COYOTE_S = 0.09; // §2.1 coyote time 90 ms
export const BUFFER_S = 0.12; // §2.1 jump buffer 120 ms
export const MAX_HOLD_S = 0.22; // §2.1 max hold 220 ms

export type VehicleId =
  | 'canoe' | 'cart' | 'boita' | 'foot' | 'elephant' | 'boitaElephant' | 'palanquin'
  | 'pressCart' | 'bicycle' | 'countryBoat' | 'dakota' | 'bus' | 'train' | 'scooter'
  | 'maglev' | 'eboat' | 'glider' | 'lightsail' | 'starBoita';

export interface VehicleProfile {
  id: VehicleId;
  /** Take-off speed, px/s (upwards). */
  jumpVelocity: number;
  /** Gravity while rising without the button held, px/s². */
  gravity: number;
  /** Gravity while the button is held during the first MAX_HOLD_S of a jump. */
  holdGravity: number;
  /** Extra gravity multiplier while falling (snappier landings). */
  fallMul: number;
  /** Player hitbox (~70% of the sprite), centred on PLAYER_X, bottom `inset` px above the ride line. */
  hitbox: { w: number; h: number; inset: number };
}

export interface RunnerState {
  y: number; // ride line of the vehicle (bottom), screen px
  vy: number;
  grounded: boolean;
  coyote: number;
  buffer: number;
  holding: boolean;
  holdT: number;
  airT: number;
}

export interface StepInput {
  /** Button went down during this step. */
  pressed: boolean;
  /** Button is currently held. */
  held: boolean;
}

export interface StepResult {
  jumped: boolean;
  landed: boolean;
}

export function makeRunner(groundY: number): RunnerState {
  return { y: groundY, vy: 0, grounded: true, coyote: COYOTE_S, buffer: 0, holding: false, holdT: 0, airT: 0 };
}

export function cloneRunner(s: RunnerState): RunnerState {
  return { ...s };
}

/**
 * Advance the runner by dt. `groundY` is the surface under the player this
 * step (constant water line for most records; platforms later).
 */
export function stepRunner(s: RunnerState, p: VehicleProfile, input: StepInput, groundY: number, dt: number): StepResult {
  let jumped = false;
  let landed = false;

  if (input.pressed) s.buffer = BUFFER_S;
  else s.buffer = Math.max(0, s.buffer - dt);

  if (s.grounded) s.coyote = COYOTE_S;

  if (s.buffer > 0 && (s.grounded || s.coyote > 0)) {
    s.vy = -p.jumpVelocity;
    s.grounded = false;
    s.coyote = 0;
    s.buffer = 0;
    s.holding = true;
    s.holdT = 0;
    s.airT = 0;
    jumped = true;
  }

  if (!s.grounded) {
    let g: number;
    if (s.holding && input.held && s.holdT < MAX_HOLD_S && s.vy < 0) {
      g = p.holdGravity;
      s.holdT += dt;
    } else {
      s.holding = false;
      g = s.vy > 0 ? p.gravity * p.fallMul : p.gravity;
    }
    s.vy += g * dt;
    s.y += s.vy * dt;
    s.coyote = Math.max(0, s.coyote - dt);
    s.airT += dt;
    if (s.vy >= 0 && s.y >= groundY) {
      s.y = groundY;
      s.vy = 0;
      s.grounded = true;
      s.holding = false;
      s.airT = 0;
      landed = true;
    }
  } else if (groundY > s.y + 0.5) {
    // The surface dropped away (end of a platform): start falling, coyote time runs.
    s.grounded = false;
  } else {
    s.y = groundY;
  }

  return { jumped, landed };
}

/** Height (px above take-off) of a jump held for `holdS` seconds, simulated. */
export function jumpApex(p: VehicleProfile, holdS: number, dt = 1 / 120): number {
  const s = makeRunner(0);
  let t = 0;
  let top = 0;
  let first = true;
  while (t < 3) {
    stepRunner(s, p, { pressed: first, held: t < holdS }, 0, dt);
    first = false;
    top = Math.min(top, s.y);
    t += dt;
    if (s.grounded && t > dt * 2) break;
  }
  return -top;
}

/** Total air time of a jump held for `holdS`. */
export function airTime(p: VehicleProfile, holdS: number, dt = 1 / 120): number {
  const s = makeRunner(0);
  let t = 0;
  let first = true;
  while (t < 3) {
    stepRunner(s, p, { pressed: first, held: t < holdS }, 0, dt);
    first = false;
    t += dt;
    if (s.grounded && t > dt * 2) break;
  }
  return t;
}
