// Unit words: a god's body (its stats) and the rules it brings onto the field (`taunt 4`, `guard 0.25`). Each word is a
// pure function from its arguments to an Ability; a modifier's `factor` is a pure function of the Moment, the plain
// numbers the step rule (Phase 3) fills in for each strike. Cards list them in content/cards.kdl, one per line; a bare
// word is Nitya (always on), and triggers (cards.ts) wrap words that happen at a moment.
import { word, type Maker } from './content-load';
import type { Effect } from './effects';
import { T } from './tuning';

/** A unit's body. Speed in tiles/s, reach and splash in tiles, times in seconds. */
export type Stats = {
  hp: number;
  hit: number;
  hitEveryS: number;
  speedTps: number;
  reachTiles: number;
  splashTiles: number;
  stationary: boolean;
  /** A god with a lifetime returns to light when it runs out (Saraswati, Lakshmi, Brahma). */
  lifetimeS: number;
};
export const BASE_STATS: Stats = { hp: 1, hit: 0, hitEveryS: 1, speedTps: 0, reachTiles: T.MELEE_REACH_TILES, splashTiles: 0, stationary: false, lifetimeS: Infinity };

/** What a modifier may read about the moment it's asked about. */
export type Moment = {
  /** Enemies in this god's lane that returned to light since it arrived. */
  withdrawn: number;
  /** Other allies in this god's lane. */
  alliesInLane: number;
  /** This side's Dhvaja in this god's lane: hp / max. */
  ownBannerFrac: number;
  /** Seconds this god's strikes have stayed on the current target. */
  onTargetS: number;
  targetIsUnit: boolean;
};

/** Who a modifier touches: the god itself, allies in its lane (itself included), or allies/enemies within `radiusTiles`. */
export type Scope = 'self' | 'allies-lane' | 'allies-near' | 'enemies-near';
/** Which number a modifier multiplies: damage dealt, damage taken, strikes per second, walking speed. */
export type ModHook = 'dmg-out' | 'dmg-in' | 'strike-rate' | 'speed';
/** Where a god lands when played: a tile, or null for "not here". */
export type PlaceCtx = { dropTile: number; bannerTiles: number[]; ownDhvajaTile: number };

export type Ability =
  | { hook: 'stats'; apply: (s: Stats) => Stats }
  | { hook: ModHook; scope: Scope; radiusTiles?: number; factor: (m: Moment) => number }
  | { hook: 'taunt'; radiusTiles: number }
  | { hook: 'place'; where: (c: PlaceCtx) => number | null }
  | { hook: 'first-strike'; mult: number; reachTiles?: number; unitsOnly: boolean }
  | { hook: 'shield-at'; hpFrac: number; amount: number }
  | { hook: 'meditate'; seconds: number; guard: number }
  | { hook: 'pacifist' }
  | { hook: 'reveal-next' }
  | { hook: 'effect'; effect: Effect }
  | { hook: 'avahana' | 'visarjana'; abilities: Ability[] }
  | { hook: 'every'; everyS: number; firstS: number; abilities: Ability[] }
  | { hook: 'with'; match: string; abilities: Ability[] };

const stat = (apply: (s: Stats) => Stats): Ability => ({ hook: 'stats', apply });
const mod = (hook: ModHook, scope: Scope, factor: (m: Moment) => number, radiusTiles?: number): Ability => ({ hook, scope, factor, radiusTiles });

/** The body: hp, hit, speed, reach, splash, stationary, lifetime. */
export const STAT_WORDS: Record<string, Maker<Ability>> = {
  /** `hp n`: hit points. */
  hp: (hp) => stat((s) => ({ ...s, hp })),
  /** `hit dmg every=s`: each strike deals dmg, one every s seconds. */
  hit: word({ args: ['n'], opts: { every: 'n' } }, ([hit], o) => stat((s) => ({ ...s, hit, hitEveryS: o.every }))),
  /** `speed tps`: walking speed, tiles a second (slow 0.8, medium 1.1, fast 1.5, very fast 2.0). */
  speed: (speedTps) => stat((s) => ({ ...s, speedTps })),
  /** `reach tiles`: how far its strikes land (melee is 0.8). */
  reach: (reachTiles) => stat((s) => ({ ...s, reachTiles })),
  /** `splash tiles`: each strike also hits enemies within this many tiles of the target. */
  splash: (splashTiles) => stat((s) => ({ ...s, splashTiles })),
  /** `stationary`: it stays where it lands and never walks. */
  stationary: () => stat((s) => ({ ...s, stationary: true, speedTps: 0 })),
  /** `lifetime s`: it returns to light after s seconds. */
  lifetime: (lifetimeS) => stat((s) => ({ ...s, lifetimeS })),
};

/** What a god does on the field beyond walking and striking. */
export const UNIT_WORDS: Record<string, Maker<Ability>> = {
  /** `taunt r`: enemies within r tiles must target this god. */
  taunt: (radiusTiles) => ({ hook: 'taunt', radiusTiles }),
  /** `leap`: may land anywhere in its lane, even past the midline, but not within LEAP_BANNER_GAP_TILES of a banner. */
  leap: () => ({ hook: 'place', where: (c) => (c.bannerTiles.some((b) => Math.abs(b - c.dropTile) < T.LEAP_BANNER_GAP_TILES) ? null : c.dropTile) }),
  /** `emerge-at-dhvaja`: lands at its own side's Dhvaja in the lane, wherever it was dropped. */
  'emerge-at-dhvaja': () => ({ hook: 'place', where: (c) => c.ownDhvajaTile }),
  /** `shield-at frac amount`: once, when its HP falls to frac of its maximum, it gains an amount-HP shield. */
  'shield-at': (hpFrac, amount) => ({ hook: 'shield-at', hpFrac, amount }),
  /** `fury-below frac dmg=f`: deals f more damage (0.4 = +40%) while its side's Dhvaja in its lane is below frac HP. */
  'fury-below': word({ args: ['n'], opts: { dmg: 'n' } }, ([frac], o) => mod('dmg-out', 'self', (m) => (m.ownBannerFrac < frac ? 1 + o.dmg : 1))),
  /** `guard f`: allies in its lane (itself too) take f less damage (0.25 = 25%). */
  guard: (f) => mod('dmg-in', 'allies-lane', () => 1 - f),
  /** `first-strike mult reach= units-only`: its first strike deals mult times damage, from `reach` tiles if given; `units-only` never on a banner. */
  'first-strike': word({ args: ['n'], opts: { reach: 'n?' }, flags: ['units-only'] }, ([mult], o) => ({ hook: 'first-strike', mult, reachTiles: o.reach, unitsOnly: o['units-only'] })),
  /** `grow-on-withdraw step max=m`: +step damage each time an enemy in its lane returns to light, up to +m. */
  'grow-on-withdraw': word({ args: ['n'], opts: { max: 'n' } }, ([step], o) => mod('dmg-out', 'self', (m) => 1 + Math.min(o.max, step * m.withdrawn))),
  /** `gather step max=m`: strikes step faster per other ally in its lane, up to m faster. */
  gather: word({ args: ['n'], opts: { max: 'n' } }, ([step], o) => mod('strike-rate', 'self', (m) => 1 + Math.min(o.max, step * m.alliesInLane))),
  /** `meditate s guard=f`: sits still s seconds taking f less damage; the words after it in its block wait until it opens its eyes. */
  meditate: word({ args: ['n'], opts: { guard: 'n' } }, ([seconds], o) => ({ hook: 'meditate', seconds, guard: o.guard })),
  /** `ramp mult over=s units-only`: strikes on one target grow to mult times over s seconds; `units-only` never ramps on a banner. */
  ramp: word({ args: ['n'], opts: { over: 'n' }, flags: ['units-only'] }, ([mult], o) =>
    mod('dmg-out', 'self', (m) => (o['units-only'] && !m.targetIsUnit ? 1 : 1 + (mult - 1) * Math.min(1, m.onTargetS / o.over)))),
  /** `pacifist`: never strikes. */
  pacifist: () => ({ hook: 'pacifist' }),
  /** `inspire f radius=r`: allies within r tiles deal f more damage. */
  inspire: word({ args: ['n'], opts: { radius: 'n' } }, ([f], o) => mod('dmg-out', 'allies-near', () => 1 + f, o.radius)),
  /** `calm f radius=r`: enemies within r tiles strike f slower (0.2 = 20%). */
  calm: word({ args: ['n'], opts: { radius: 'n' } }, ([f], o) => mod('strike-rate', 'enemies-near', () => 1 - f, o.radius)),
  /** `dmg f`: deals f more damage (0.25 = +25%); usually inside `with`. */
  dmg: (f) => mod('dmg-out', 'self', () => 1 + f),
  /** `reveal-next`: while it is on the field, its player sees the opponent's next card. */
  'reveal-next': () => ({ hook: 'reveal-next' }),
};

/** A god's stats: its stat words applied to the base, in order. */
export const statsOf = (abilities: Ability[]): Stats =>
  abilities.reduce((s, a) => (a.hook === 'stats' ? a.apply(s) : s), BASE_STATS);

/** The product of the factors of every modifier on `hook` that applies, given the moment. */
export const factorOf = (mods: Ability[], hook: ModHook, m: Moment): number =>
  mods.reduce((f, a) => (a.hook === hook ? f * a.factor(m) : f), 1);
