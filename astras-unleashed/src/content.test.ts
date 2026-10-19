// The content holds what the brief promises: twenty gods on its cost curve, legal starter decks at their averages,
// twelve Kshetras, yugas in a 4:3:2:1 ratio worth about 117 Prana, and every card's words parsed.
import { describe, expect, it } from 'vitest';
import { BOTS, CARDS, CLASSES, DECKS, DHVAJAS, EMOTES, KATHA, KSHETRAS, TOKENS_ON_FIELD, YUGAS, deckProblem } from './content';
import { T } from './tuning';

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('content', () => {
  it('twenty gods, four per class', () => {
    expect(Object.keys(CARDS)).toHaveLength(20);
    for (const c of Object.keys(CLASSES)) expect(Object.values(CARDS).filter((x) => x.class === c), c).toHaveLength(4);
  });
  it('the cost curve: 3 at 2, 4 at 3, 4 at 4, 4 at 5, 3 at 6, 1 at 7, 1 at 8 (average 4.35)', () => {
    const costs = Object.values(CARDS).map((c) => c.cost);
    expect([2, 3, 4, 5, 6, 7, 8].map((n) => costs.filter((c) => c === n).length)).toEqual([3, 4, 4, 4, 3, 1, 1]);
    expect(avg(costs)).toBeCloseTo(4.35);
  });
  it('the three Trimurti cards, and only they, are tagged trimurti', () => {
    expect(Object.values(CARDS).filter((c) => c.tags.includes('trimurti')).map((c) => c.id).sort()).toEqual(['brahma', 'shiva', 'vishnu']);
  });
  it('stats come from the words (Hanuman, Saraswati)', () => {
    expect(CARDS.hanuman!.stats).toMatchObject({ hp: 1790, hit: 120, hitEveryS: 1.2, speedTps: 1.1, reachTiles: T.MELEE_REACH_TILES });
    expect(CARDS.saraswati!.stats).toMatchObject({ hp: 450, stationary: true, lifetimeS: 12 });
    expect(TOKENS_ON_FIELD.hamsa!.stats.hp).toBe(180);
  });
  it('starter decks are legal, at the brief\'s averages, and none holds Brahma', () => {
    const averages = Object.fromEntries(Object.values(DECKS).map((d) => [d.id, avg(d.cards.map((c) => CARDS[c]!.cost))]));
    expect(averages).toEqual({ suryavamsha: 3.375, shakti: 3.375, kailash: 3.875, vaikuntha: 4.25 });
    for (const d of Object.values(DECKS)) { expect(deckProblem(d.cards)).toBeNull(); expect(d.cards).not.toContain('brahma'); }
  });
  it('the deck rules refuse a second Trimurti card, a short deck, a repeat', () => {
    expect(deckProblem(['shiva', 'vishnu', 'agni', 'vayu', 'yama', 'surya', 'rama', 'kali'])).toBe('at most 1 trimurti card per deck');
    expect(deckProblem(['agni'])).toBe('a deck has 8 cards, not 1');
    expect(deckProblem(['agni', 'agni', 'vayu', 'yama', 'surya', 'rama', 'kali', 'durga'])).toBe('"agni" is in the deck twice');
  });
  it('twelve Kshetras, one rule word each', () => {
    expect(Object.keys(KSHETRAS)).toHaveLength(12);
    for (const k of Object.values(KSHETRAS)) expect(k.rules, k.id).toHaveLength(1);
  });
  it('yugas run 4:3:2:1, then Pralaya; about 117 Prana over regulation', () => {
    const reg = YUGAS.filter((y) => !y.overtime);
    expect(reg.map((y) => y.seconds)).toEqual([80, 60, 40, 20]);
    expect(reg.map((y) => y.die)).toEqual([4, 3, 2, 1]);
    expect(reg.map((y) => y.reveal)).toEqual([1, 2, 3, undefined]);
    const prana = T.PRANA_START + reg.reduce((a, y) => a + (y.seconds / T.PRANA_EVERY_S) * y.prana, 0);
    expect(prana).toBeGreaterThan(116);
    expect(prana).toBeLessThan(118);
    expect(YUGAS.at(-1)).toMatchObject({ id: 'pralaya', overtime: true, prana: 3 });
  });
  it('banners', () => {
    expect(DHVAJAS.dhvaja).toMatchObject({ hp: 2000, tile: 3, range: 7, allLanes: false });
    expect(DHVAJAS.mahadhvaja).toMatchObject({ hp: 3600, tile: 0, allLanes: true });
  });
  it('a Katha page per god, none verified yet, numbered 1..20', () => {
    expect(Object.values(KATHA).map((k) => k.god).sort()).toEqual(Object.keys(CARDS).sort());
    expect(Object.values(KATHA).map((k) => k.page)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
  it('three opponents; four blessings and no other emote', () => {
    expect(Object.keys(BOTS)).toEqual(['taapoi', 'nachiketa', 'gargi']);
    expect(Object.keys(EMOTES)).toEqual(['namaskar', 'sadhu', 'shubham', 'lotus']);
  });
});
