// Headless run simulation: scrolling, ride physics (run / flight / gravity),
// wind, platforms, collisions and pickups. Rendering reads this state; the
// solvability bot drives it with planned inputs. Everything that decides
// survival lives in SimState (not on shared entities), so the bot can branch.
import { PLAYER_X, INVULN_S } from '../config';
import { ARCH, type Arch } from '../data/hazards';
import type { Terrain } from '../data/records';
import { makeRunner, stepFlight, stepGravity, stepRunner, type RideMode, type RunnerState, type StepInput, type VehicleProfile } from './physics';

export type EntityKind = 'hazard' | 'cowrie' | 'dolphin' | 'friend' | 'record' | 'prompt' | 'platform';

export interface Box { x: number; y: number; w: number; h: number }

export interface DolphinData {
  triggerX: number;
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
  /** World x of the centre (moving hazards: where they meet the player at `meetT`). */
  x: number;
  /** Ground hazards: the ride line; centred things: centre y; ceiling hazards: the ceiling. */
  y: number;
  w: number;
  h: number;
  variant: number;
  arch?: Arch;
  vis?: string;
  /** Hitbox size (already scaled by forgiveness). */
  hw?: number;
  hh?: number;
  vx?: number;
  meetT?: number;
  bob?: number;
  bobPhase?: number;
  taken: boolean;
  text?: string;
  dolphin?: DolphinData;
  plat?: { top: number; x0: number; x1: number; glyph: string };
  bonus?: boolean;
}

export interface Zone {
  kind: 'wind' | 'shelter' | 'dark';
  x0: number;
  x1: number;
  /** Wind: horizontal push (px/s²) and, for boost gusts, lift (px/s²). */
  force?: number;
  lift?: number;
}

export interface Level {
  recordId: string;
  num: number;
  mode: RideMode;
  terrain: Terrain;
  speed: number;
  laneY: number;
  /** Flight / gravity bounds. */
  ceilY: number;
  floorY: number;
  /** World x at which the segment ends (player world x). */
  endX: number;
  entities: Entity[]; // sorted by x
  zones: Zone[];
  recordEntity: Entity | null;
  seed: number;
  /** Player hitbox scale (forgiveness) and jump buffer for this record. */
  playerScale: number;
  buffer: number;
  /** Rhythm records: beat times (s) the music follows. */
  beats?: number[];
  /** Total length in seconds. */
  seconds: number;
}

export type SimEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'flip' }
  | { type: 'hit'; e: Entity }
  | { type: 'cowrie'; e: Entity }
  | { type: 'dolphinBonus'; e: Entity; amount: number }
  | { type: 'dolphinLeap'; e: Entity }
  | { type: 'friendBonus'; e: Entity; amount: number }
  | { type: 'record'; e: Entity }
  | { type: 'recordMissed'; e: Entity }
  | { type: 'checkpoint'; x: number }
  | { type: 'gust'; z: Zone }
  | { type: 'dead' }
  | { type: 'end' };

export interface SimState {
  t: number;
  scroll: number; // world x of the left edge of the screen
  runner: RunnerState;
  /** Wind drift of the player relative to the screen. */
  dx: number;
  dvx: number;
  lives: number;
  maxLives: number;
  cowries: number;
  hits: number;
  invuln: number;
  lastHit: number;
  recordCaught: boolean;
  recordMissed: boolean;
  dead: boolean;
  ended: boolean;
  checkpointX: number;
  zoneIdx: number;
  inGust: boolean;
  scan: number;
  events: SimEvent[];
}

export interface SimOptions {
  god?: boolean;
  lives: number;
  /** Start part-way through (mid-record checkpoint): world scroll. */
  startScroll?: number;
}

export const DOLPHIN_BONUS = 5;
export const FRIEND_BONUS = 3;
export const COWRIE_R = 26;
export const RECORD_R = 48;

export function createSim(level: Level, opts: SimOptions): SimState {
  const start = opts.startScroll ?? 0;
  const runner = makeRunner(level.mode === 'flight' ? level.floorY - 140 : level.laneY);
  let scan = 0;
  while (scan < level.entities.length && level.entities[scan].x < start + PLAYER_X - 400) scan++;
  return {
    t: start / level.speed,
    scroll: start,
    runner,
    dx: 0,
    dvx: 0,
    lives: opts.lives,
    maxLives: opts.lives,
    cowries: 0,
    hits: 0,
    invuln: start > 0 ? 1.5 : 0,
    lastHit: -1,
    recordCaught: false,
    recordMissed: false,
    dead: false,
    ended: false,
    checkpointX: start,
    zoneIdx: 0,
    inGust: false,
    scan,
    events: [],
  };
}

export function cloneSim(s: SimState): SimState {
  return { ...s, runner: { ...s.runner }, events: [] };
}

export function playerWorldX(s: SimState): number {
  return s.scroll + PLAYER_X + s.dx;
}

export function playerBox(s: SimState, p: VehicleProfile, level: Level): Box {
  const k = level.playerScale;
  const w = p.hitbox.w * k;
  const h = p.hitbox.h * k;
  const x = playerWorldX(s) - w / 2;
  const r = s.runner;
  if (level.mode === 'flight') return { x, y: r.y - h / 2, w, h };
  if (level.mode === 'gravity' && r.gsign < 0) return { x, y: r.y + p.hitbox.inset, w, h };
  return { x, y: r.y - p.hitbox.inset - h, w, h };
}

const overlap = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function entityX(e: Entity, t: number): number {
  return e.vx ? e.x + e.vx * (t - (e.meetT ?? 0)) : e.x;
}

export function entityY(e: Entity, t: number): number {
  return e.bob ? e.y + Math.sin(t * 2.4 + (e.bobPhase ?? 0)) * e.bob : e.y;
}

export function hazardBox(e: Entity, t: number): Box {
  const x = entityX(e, t);
  const y = entityY(e, t);
  const hw = e.hw ?? e.w * 0.66;
  const hh = e.hh ?? e.h * 0.66;
  const anchor = ARCH[e.arch ?? 'small'].anchor;
  if (anchor === 'ground') return { x: x - hw / 2, y: y - hh, w: hw, h: hh };
  if (anchor === 'ceiling') return { x: x - hw / 2, y, w: hw, h: hh };
  return { x: x - hw / 2, y: y - hh / 2, w: hw, h: hh };
}

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

function groundAt(s: SimState, level: Level, px: number): number {
  let g = level.laneY;
  for (let i = Math.max(0, s.scan - 2); i < level.entities.length; i++) {
    const e = level.entities[i];
    if (e.x > px + 900) break;
    if (e.kind !== 'platform' || !e.plat) continue;
    const pl = e.plat;
    if (px >= pl.x0 - 10 && px <= pl.x1 + 10 && s.runner.y <= pl.top + 2 && pl.top < g) g = pl.top;
  }
  return g;
}

export function zoneAt(level: Level, px: number, kind: Zone['kind']): Zone | null {
  for (const z of level.zones) if (z.kind === kind && px >= z.x0 && px <= z.x1) return z;
  return null;
}

export function stepSim(s: SimState, level: Level, p: VehicleProfile, input: StepInput, dt: number, opts: SimOptions): void {
  if (s.dead || s.ended) return;
  s.t += dt;
  s.scroll += level.speed * dt;
  let px = playerWorldX(s);

  // Wind and shelters.
  const shelter = level.zones.length ? zoneAt(level, px, 'shelter') : null;
  const gust = level.zones.length && !shelter ? zoneAt(level, px, 'wind') : null;
  if (shelter && shelter.x0 > s.checkpointX) {
    s.checkpointX = shelter.x0;
    s.events.push({ type: 'checkpoint', x: shelter.x0 });
  }
  if (gust && !s.inGust) s.events.push({ type: 'gust', z: gust });
  s.inGust = !!gust;

  const r = s.runner;
  let res;
  if (level.mode === 'flight') {
    res = stepFlight(r, p, input, level.floorY, level.ceilY, dt, gust?.lift ?? 0);
  } else if (level.mode === 'gravity') {
    res = stepGravity(r, p, input, level.laneY, level.ceilY, dt, level.buffer);
    if (res.flipped) s.events.push({ type: 'flip' });
  } else {
    res = stepRunner(r, p, input, groundAt(s, level, px), dt, level.buffer);
    if (gust?.lift && !r.grounded) r.vy -= gust.lift * dt;
  }
  if (res.jumped && level.mode === 'run') s.events.push({ type: 'jump' });
  if (res.landed && level.mode !== 'flight') s.events.push({ type: 'land' });

  const airborne = level.mode === 'flight' || !r.grounded;
  if (gust && airborne) s.dvx += (gust.force ?? 0) * dt;
  else s.dvx *= Math.max(0, 1 - 6 * dt);
  s.dx += s.dvx * dt;
  if (!gust || !airborne) s.dx -= s.dx * Math.min(1, 2.2 * dt);
  s.dx = Math.max(-110, Math.min(120, s.dx));
  if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);

  px = playerWorldX(s);
  const box = playerBox(s, p, level);
  const ents = level.entities;
  while (s.scan < ents.length && ents[s.scan].x < px - 600) s.scan++;

  for (let i = s.scan; i < ents.length; i++) {
    const e = ents[i];
    if (e.x > px + 900) break;
    switch (e.kind) {
      case 'hazard': {
        if (s.invuln > 0 || e.id === s.lastHit) break;
        if (overlap(box, hazardBox(e, s.t))) {
          s.lastHit = e.id;
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
      }
      case 'cowrie': {
        if (e.taken) break;
        const ey = entityY(e, s.t);
        const cx = Math.max(box.x, Math.min(e.x, box.x + box.w));
        const cy = Math.max(box.y, Math.min(ey, box.y + box.h));
        if (Math.hypot(cx - e.x, cy - ey) < COWRIE_R) {
          e.taken = true;
          s.cowries++;
          s.events.push({ type: 'cowrie', e });
        }
        break;
      }
      case 'dolphin': {
        const d = e.dolphin!;
        if (d.startT === null && s.scroll + PLAYER_X >= d.triggerX) {
          d.startT = s.t;
          s.events.push({ type: 'dolphinLeap', e });
        }
        const pos = dolphinPos(e, s.t);
        if (pos && !d.bonus && !r.grounded && r.y < level.laneY - 34 && Math.abs(pos.x - px) < 90) {
          d.bonus = true;
          s.cowries += DOLPHIN_BONUS;
          s.events.push({ type: 'dolphinBonus', e, amount: DOLPHIN_BONUS });
        }
        break;
      }
      case 'friend': {
        if (!e.bonus && !r.grounded && Math.abs(e.x - px) < 46 && r.y < level.laneY - 40) {
          e.bonus = true;
          s.cowries += FRIEND_BONUS;
          s.events.push({ type: 'friendBonus', e, amount: FRIEND_BONUS });
        }
        break;
      }
      case 'record': {
        if (s.recordCaught || s.recordMissed) break;
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

  if (s.scroll + PLAYER_X >= level.endX) {
    s.ended = true;
    s.events.push({ type: 'end' });
  }
}
