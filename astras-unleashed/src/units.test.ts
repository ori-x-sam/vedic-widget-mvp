import { describe, expect, it } from 'vitest';
import { BASE_STATS, factorOf, statsOf, STAT_WORDS, UNIT_WORDS, type Ability, type Moment } from './units';
import { T } from './tuning';
import { readWord, readWords } from './words.test-helper';

const at: Moment = { withdrawn: 0, alliesInLane: 0, ownBannerFrac: 1, onTargetS: 0, targetIsUnit: true };
const m = (over: Partial<Moment>): Moment => ({ ...at, ...over });
const u = (kdl: string) => readWord(UNIT_WORDS, kdl);
const f = (a: Ability, mo: Moment = at) => { if (!('factor' in a)) throw new Error('not a modifier'); return a.factor(mo); };

describe('stat words', () => {
  const s = (kdl: string) => statsOf(readWords(STAT_WORDS, kdl));
  it('hp', () => expect(s('hp 1790').hp).toBe(1790));
  it('hit', () => expect(s('hit 120 every=1.2')).toMatchObject({ hit: 120, hitEveryS: 1.2 }));
  it('speed', () => expect(s('speed 1.1').speedTps).toBe(1.1));
  it('reach (melee by default)', () => { expect(s('reach 5').reachTiles).toBe(5); expect(s('hp 1').reachTiles).toBe(T.MELEE_REACH_TILES); });
  it('splash', () => expect(s('splash 1.5').splashTiles).toBe(1.5));
  it('stationary', () => expect(s('speed 1.1\nstationary')).toMatchObject({ stationary: true, speedTps: 0 }));
  it('lifetime (forever by default)', () => { expect(s('lifetime 27').lifetimeS).toBe(27); expect(BASE_STATS.lifetimeS).toBe(Infinity); });
});

describe('unit words', () => {
  it('taunt', () => expect(u('taunt 4')).toEqual({ hook: 'taunt', radiusTiles: 4 }));
  it('leap lands where dropped, past the midline, but not by a banner', () => {
    const a = u('leap');
    if (a.hook !== 'place') throw new Error();
    expect(a.where({ dropTile: 13, bannerTiles: [3, 17], ownDhvajaTile: 3 })).toBe(13);
    expect(a.where({ dropTile: 15.5, bannerTiles: [3, 17], ownDhvajaTile: 3 })).toBeNull();
  });
  it('emerge-at-dhvaja lands at its own banner', () => {
    const a = u('emerge-at-dhvaja');
    if (a.hook !== 'place') throw new Error();
    expect(a.where({ dropTile: 8, bannerTiles: [3, 17], ownDhvajaTile: 3 })).toBe(3);
  });
  it('shield-at', () => expect(u('shield-at 0.5 500')).toEqual({ hook: 'shield-at', hpFrac: 0.5, amount: 500 }));
  it('fury-below: +40% only while its banner is below half', () => {
    expect(f(u('fury-below 0.5 dmg=0.4'), m({ ownBannerFrac: 0.4 }))).toBeCloseTo(1.4);
    expect(f(u('fury-below 0.5 dmg=0.4'), m({ ownBannerFrac: 0.6 }))).toBe(1);
  });
  it('guard: allies in its lane take 25% less', () => {
    const a = u('guard 0.25');
    expect(a).toMatchObject({ hook: 'dmg-in', scope: 'allies-lane' });
    expect(f(a)).toBe(0.75);
  });
  it('first-strike: the Vel from 3 tiles, or one arrow for units only', () => {
    expect(u('first-strike 2 reach=3')).toEqual({ hook: 'first-strike', mult: 2, reachTiles: 3, unitsOnly: false });
    expect(u('first-strike 3 units-only')).toEqual({ hook: 'first-strike', mult: 3, reachTiles: undefined, unitsOnly: true });
  });
  it('grow-on-withdraw: +12% a withdrawal, capped at +60%', () => {
    expect(f(u('grow-on-withdraw 0.12 max=0.6'), m({ withdrawn: 2 }))).toBeCloseTo(1.24);
    expect(f(u('grow-on-withdraw 0.12 max=0.6'), m({ withdrawn: 9 }))).toBeCloseTo(1.6);
  });
  it('gather: +10% strike rate an ally, capped at +40%', () => {
    expect(f(u('gather 0.10 max=0.4'), m({ alliesInLane: 3 }))).toBeCloseTo(1.3);
    expect(f(u('gather 0.10 max=0.4'), m({ alliesInLane: 7 }))).toBeCloseTo(1.4);
  });
  it('meditate', () => expect(u('meditate 3 guard=0.5')).toEqual({ hook: 'meditate', seconds: 3, guard: 0.5 }));
  it('ramp: dawn to noon over 3 s on units, never on a banner', () => {
    const a = u('ramp 3 over=3 units-only');
    expect(f(a, m({ onTargetS: 0 }))).toBe(1);
    expect(f(a, m({ onTargetS: 1.5 }))).toBe(2);
    expect(f(a, m({ onTargetS: 9 }))).toBe(3);
    expect(f(a, m({ onTargetS: 9, targetIsUnit: false }))).toBe(1);
  });
  it('pacifist', () => expect(u('pacifist')).toEqual({ hook: 'pacifist' }));
  it('inspire: allies within 4 deal +25%', () => {
    const a = u('inspire 0.25 radius=4');
    expect(a).toMatchObject({ hook: 'dmg-out', scope: 'allies-near', radiusTiles: 4 });
    expect(f(a)).toBe(1.25);
  });
  it('calm: enemies within 4 strike 20% slower', () => {
    const a = u('calm 0.2 radius=4');
    expect(a).toMatchObject({ hook: 'strike-rate', scope: 'enemies-near', radiusTiles: 4 });
    expect(f(a)).toBe(0.8);
  });
  it('dmg', () => expect(f(u('dmg 0.25'))).toBe(1.25));
  it('reveal-next', () => expect(u('reveal-next')).toEqual({ hook: 'reveal-next' }));
  it('modifiers on one number multiply', () => {
    expect(factorOf(readWords(UNIT_WORDS, 'dmg 0.25\nfury-below 0.5 dmg=0.4'), 'dmg-out', m({ ownBannerFrac: 0.1 }))).toBeCloseTo(1.75);
  });
});
