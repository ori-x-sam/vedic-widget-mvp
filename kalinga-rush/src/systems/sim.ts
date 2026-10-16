// Headless run simulation: scrolling, runner physics, collisions, pickups.
// Rendering reads this state; the solvability bot drives it with planned inputs.
import { PLAYER_X, INVULN_S } from '../config';
import type { HazardKind } from '../data/records';
import { makeRunner, stepRunner, type RunnerState, type StepInput, type VehicleProfile } from './physics';

export type EntityKind = HazardKind | 'cowrie' | 'dolphin' | 'record' | 'prompt';

export interface Box { x: number; y: number; w: number; h: number }

export interface DolphinData {
  triggerX: number; // player world x that starts the leap
  fromX: number;
  toX: number;
  height: number;
  duration: number;
  startT: number | null;
  bonus: boolean;
}

export interface Entity {
  id: number;
  kind: EntityKind;
  /** World x of the entity's centre. */
  x: number;
  /** Base y for hazards (ride line); centre y for pickups. */
  y: number;
  w: number;
  h: number;
  variant: number;
  hit: Box | null; // world-space hitbox (hazards)
  taken: boolean;
  text?: string;
  dolphin?: DolphinData;
}

export interface Level {
  recordId: string;
  speed: number;
  laneY: number;
  /** World x at which the segment ends (player world x). */
  endX: number;
  entities: Entity[]; // sorted by x
  recordEntity: Entity | null;
  seed: number;
}

export type SimEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'hit'; e: Entity }
  | { type: 'cowrie'; e: Entity }
  | { type: 'dolphinBonus'; e: Entity; amount: number }
  | { type: 'dolphinLeap'; e: Entity }
  | { type: 'record'; e: Entity }
  | { type: 'recordMissed'; e: Entity }
  | { type: 'dead' }
  | { type: 'end' };

export interface SimState {
  t: number;
  scroll: number; // world x of the left edge of the screen
  runner: RunnerState;
  lives: number;
  maxLives: number;
  cowries: number;
  hits: number;
  invuln: number;
  recordCaught: boolean;
  recordMissed: boolean;
  dead: boolean;
  ended: boolean;
  scan: number; // index of first entity that may still matter
  events: SimEvent[];
}

export interface SimOptions {
  god?: boolean;
  lives: number;
}

export const DOLPHIN_BONUS = 5;
export const COWRIE_R = 26;
export const RECORD_R = 48;

export function createSim(level: Level, opts: SimOptions): SimState {
  return {
    t: 0,
    scroll: 0,
    runner: makeRunner(level.laneY),
    lives: opts.lives,
    maxLives: opts.lives,
    cowries: 0,
    hits: 0,
    invuln: 0,
    recordCaught: false,
    recordMissed: false,
    dead: false,
    ended: false,
    scan: 0,
    events: [],
  };
}

export function playerWorldX(s: SimState): number {
  return s.scroll + PLAYER_X;
}

export function playerBox(s: SimState, p: VehicleProfile): Box {
  const hb = p.hitbox;
  return { x: playerWorldX(s) - hb.w / 2, y: s.runner.y - hb.inset - hb.h, w: hb.w, h: hb.h };
}

const overlap = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Palm-leaf record floats on a gentle bob; deterministic so the bot sees it too. */
export function recordY(e: Entity, t: number): number {
  return e.y + Math.sin(t * 2.2) * 9;
}

export function dolphinPos(e: Entity, t: number): { x: number; y: number; p: number } | null {
  const d = e.dolphin;
  if (!d || d.startT === null) return null;
  const p = (t - d.startT) / d.duration;
  if (p < 0 || p > 1) return null;
  return { x: d.fromX + (d.toX - d.fromX) * p, y: e.y - 4 * d.height * p * (1 - p), p };
}

export function stepSim(s: SimState, level: Level, p: VehicleProfile, input: StepInput, dt: number, opts: SimOptions): void {
  if (s.dead || s.ended) return;
  s.t += dt;
  s.scroll += level.speed * dt;
  const r = stepRunner(s.runner, p, input, level.laneY, dt);
  if (r.jumped) s.events.push({ type: 'jump' });
  if (r.landed) s.events.push({ type: 'land' });
  if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);

  const px = playerWorldX(s);
  const box = playerBox(s, p);
  const ents = level.entities;

  // Advance the scan pointer past entities that are well behind the player.
  while (s.scan < ents.length && ents[s.scan].x < px - 400) s.scan++;

  for (let i = s.scan; i < ents.length; i++) {
    const e = ents[i];
    if (e.x > px + 400) break;
    switch (e.kind) {
      case 'reed':
      case 'mud':
      case 'stakes':
        if (!e.taken && e.hit && s.invuln <= 0 && overlap(box, e.hit)) {
          e.taken = true; // a hazard can only hurt once
          s.hits++;
          s.invuln = INVULN_S;
          if (!opts.god) s.lives--;
          s.events.push({ type: 'hit', e });
          if (s.lives <= 0) {
            s.dead = true;
            s.events.push({ type: 'dead' });
            return;
          }
        }
        break;
      case 'cowrie': {
        if (e.taken) break;
        const cx = Math.max(box.x, Math.min(e.x, box.x + box.w));
        const cy = Math.max(box.y, Math.min(e.y, box.y + box.h));
        if (Math.hypot(cx - e.x, cy - e.y) < COWRIE_R) {
          e.taken = true;
          s.cowries++;
          s.events.push({ type: 'cowrie', e });
        }
        break;
      }
      case 'dolphin': {
        const d = e.dolphin!;
        if (d.startT === null && px >= d.triggerX) {
          d.startT = s.t;
          s.events.push({ type: 'dolphinLeap', e });
        }
        const pos = dolphinPos(e, s.t);
        if (pos && !d.bonus && !s.runner.grounded && s.runner.y < level.laneY - 34 && Math.abs(pos.x - px) < 90) {
          d.bonus = true;
          s.cowries += DOLPHIN_BONUS;
          s.events.push({ type: 'dolphinBonus', e, amount: DOLPHIN_BONUS });
        }
        break;
      }
      case 'record': {
        if (e.taken || s.recordMissed) break;
        const ry = recordY(e, s.t);
        const cx = Math.max(box.x, Math.min(e.x, box.x + box.w));
        const cy = Math.max(box.y, Math.min(ry, box.y + box.h));
        if (Math.hypot(cx - e.x, cy - ry) < RECORD_R) {
          e.taken = true;
          s.recordCaught = true;
          s.events.push({ type: 'record', e });
        } else if (px > e.x + RECORD_R + 60) {
          s.recordMissed = true;
          s.events.push({ type: 'recordMissed', e });
        }
        break;
      }
      default:
        break;
    }
  }

  if (px >= level.endX) {
    s.ended = true;
    s.events.push({ type: 'end' });
  }
}
