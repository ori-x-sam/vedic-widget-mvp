import { describe, expect, it } from 'vitest';
import { EFFECT_WORDS, gainPrana, knockedTo, pickTargets, pulledTo, type Effect, type Reachable } from './effects';
import { readWord } from './words.test-helper';

const e = (kdl: string) => readWord(EFFECT_WORDS, kdl);
/** An effect as pickTargets reads it (area, targets, pick, units-only). */
const reach = (x: Effect) => x as Parameters<typeof pickTargets>[2];
const field: Reachable[] = [
  { id: 1, tile: 10, hp: 300, isUnit: true },
  { id: 2, tile: 11.5, hp: 3530, isUnit: true },
  { id: 3, tile: 13, hp: 900, isUnit: true },
  { id: 4, tile: 17, hp: 2000, isUnit: false }, // a Dhvaja
];

describe('effect words', () => {
  it('damage: Vayu\'s gust reaches 4 tiles of lane', () => {
    const d = e('damage 150 width=4');
    expect(d).toEqual({ do: 'damage', amount: 150, widthTiles: 4, targets: undefined, pick: 'nearest', unitsOnly: false });
    expect(pickTargets(field, 11, reach(d))).toEqual([2, 1, 3]); // nearest first
  });
  it('damage: the Vajra picks the three strongest; the third eye spares banners', () => {
    expect(pickTargets(field, 12, reach(e('damage 520 targets=3 pick="highest-hp" width=6')))).toEqual([2, 3, 1]);
    expect(pickTargets(field, 12, reach(e('damage 420 units-only')))).toEqual([2, 3, 1]);
    expect(pickTargets(field, 12, reach(e('damage 420')))).toContain(4);
  });
  it('heal', () => expect(e('heal 60 dhvaja=25 width=6 seconds=5')).toEqual({ do: 'heal', perS: 60, dhvajaPerS: 25, widthTiles: 6, seconds: 5 }));
  it('stun: around the god, or (no area) whoever was just hit', () => {
    expect(e('stun 1 radius=2.5')).toEqual({ do: 'stun', seconds: 1, radiusTiles: 2.5, widthTiles: undefined });
    expect(pickTargets(field, 11, reach(e('stun 1 radius=2.5')))).toEqual([2, 1, 3]);
    expect(e('stun 0.5')).toMatchObject({ radiusTiles: undefined, widthTiles: undefined });
  });
  it('knockback pushes back toward their own end, inside the lane', () => {
    expect(e('knockback 2.5')).toEqual({ do: 'knockback', tiles: 2.5 });
    expect(knockedTo(12, 2.5, -1, 20)).toBe(14.5); // an opponent walks left; it's pushed right
    expect(knockedTo(19, 2.5, -1, 20)).toBe(20);
  });
  it('pull draws the farthest enemy closer, never past the puller', () => {
    expect(e('pull 3 root=1.5 range=6')).toEqual({ do: 'pull', tiles: 3, rootS: 1.5, rangeTiles: 6 });
    expect(pulledTo(14, 9, 3)).toBe(11);
    expect(pulledTo(10, 9, 3)).toBe(9);
  });
  it('haste', () => expect(e('haste 0.35 width=5 seconds=6')).toEqual({ do: 'haste', factor: 0.35, widthTiles: 5, seconds: 6 }));
  it('prana never fills past the diya row', () => {
    expect(e('prana 1')).toEqual({ do: 'prana', amount: 1 });
    expect(gainPrana(9.5, 1, 10)).toBe(10);
  });
  it('create', () => expect(e('create "hamsa"')).toEqual({ do: 'create', token: 'hamsa' }));
  it('discount-next', () => expect(e('discount-next 1')).toEqual({ do: 'discount-next', amount: 1 }));
  it('seconds', () => expect(e('seconds 10')).toEqual({ do: 'seconds', seconds: 10 }));
});
