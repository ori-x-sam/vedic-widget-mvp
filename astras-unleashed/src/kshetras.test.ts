import { describe, expect, it } from 'vitest';
import { KSHETRA_WORDS, type CardKey, type KshetraRule } from './kshetras';
import { readWord } from './words.test-helper';

const k = (kdl: string) => readWord(KSHETRA_WORDS, kdl);
const ganesha: CardKey = { id: 'ganesha', class: 'rakshak', tags: ['shaiva'] };
const indra: CardKey = { id: 'indra', class: 'astra', tags: ['vedic'] };
const pick = <R extends KshetraRule['rule']>(r: KshetraRule, rule: R) => { if (r.rule !== rule) throw new Error(`not ${rule}`); return r as Extract<KshetraRule, { rule: R }>; };

describe('kshetra words', () => {
  it('cost-cut: by tag (Kailash) or by class (Amaravati), never below 0', () => {
    expect(pick(k('cost-cut "shaiva" 1'), 'cost').cost(ganesha, 4)).toBe(3);
    expect(pick(k('cost-cut "shaiva" 1'), 'cost').cost(indra, 5)).toBe(5);
    expect(pick(k('cost-cut "astra" 1'), 'cost').cost(indra, 5)).toBe(4);
    expect(pick(k('cost-cut "astra" 9'), 'cost').cost(indra, 5)).toBe(0);
  });
  it('regen', () => expect(pick(k('regen 0.015'), 'regen').perS(2000)).toBeCloseTo(30));
  it('dmg-mult', () => expect(k('dmg-mult 1.2')).toEqual({ rule: 'dmg', mult: 1.2 }));
  it('speed-mult (Kishkindha and Himavat)', () => {
    expect(k('speed-mult 1.25')).toEqual({ rule: 'speed', mult: 1.25 });
    expect(k('speed-mult 0.75')).toEqual({ rule: 'speed', mult: 0.75 });
  });
  it('reach-cut: ranged only, never below melee', () => {
    const r = pick(k('reach-cut 1.5'), 'reach');
    expect(r.reach(6.5)).toBe(5);
    expect(r.reach(0.8)).toBe(0.8);
    expect(r.reach(1.5)).toBe(0.8);
  });
  it('dhvaja-hp', () => expect(k('dhvaja-hp 1.3')).toEqual({ rule: 'dhvaja', hpMult: 1.3, strikeRateMult: 1 }));
  it('dhvaja-haste', () => expect(k('dhvaja-haste 1.3')).toEqual({ rule: 'dhvaja', hpMult: 1, strikeRateMult: 1.3 }));
  it('amrit', () => expect(k('amrit 1 every=20')).toEqual({ rule: 'amrit', amount: 1, everyS: 20 }));
  it('veil', () => expect(k('veil 3')).toEqual({ rule: 'veil', seconds: 3 }));
  it('echo', () => expect(k('echo 0.5')).toEqual({ rule: 'echo', frac: 0.5 }));
});
