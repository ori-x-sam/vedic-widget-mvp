import { describe, expect, it } from 'vitest';
import { C, get } from './content';
import * as G from './game';
import type { GameState } from './game';
import { campaign, dayOutcomes, solveNight } from './solver';
import { T } from './tuning';

/** Play the day by always taking choice `pick` (or the first), until the night starts. */
function dayTo(pick: (texts: string[]) => number = () => 0): GameState {
  let s = G.newGame();
  for (let i = 0; i < 500 && s.phase === 'day'; i++) {
    const cs = G.choices(s);
    s = cs.length ? G.choose(s, pick(cs.map((c) => c.text))) : G.next(s);
  }
  return s;
}
const night = () => dayTo();
/** Stand at a spot, as the solver does. */
const at = (s: GameState, spot: string): GameState => {
  const sp = get('spot', spot), r = get('room', sp.room), p = G.spotPose(s, sp);
  return { ...s, night: { ...s.night!, x: r.x + p.at[0], z: r.z + p.at[1] } };
};
const said = (s: GameState) => s.events.filter((e) => e.type === 'said').map((e) => (e as { text: string }).text).join(' ');
/** Out of the guest room: hairpin, tripod leg, the trunk to the door, the hook. */
function outOfRoom(s: GameState) {
  s = G.interact(at(s, 'punkah-rope'), 'punkah-rope');
  s = G.interact(at(s, 'trunk'), 'trunk');
  s = G.interact(at(s, 'trunk'), 'trunk');
  s = G.combine(s, 'hairpin', 'tripod-leg');
  return G.interact(at(s, 'bolted-door'), 'bolted-door', 'bolt-hook');
}

describe('the day', () => {
  it('starts in the jeep with the camera and the candle', () => {
    const s = G.newGame();
    expect(s.talk!.scene).toBe('drive-in');
    expect(s.items).toEqual(['camera', 'candle']);
    expect(G.currentLine(s)!.key).toBe('narrator');
  });
  it('the doe waits only so long: hesitating is a choice too', () => {
    let s = G.newGame();
    while (s.talk!.beat !== 'doe' || !G.choices(s).length) s = G.choices(s).length ? G.choose(s, 0) : G.next(s);
    s = G.tick(s, get('beat', 'doe')['timer-s']! + 0.1);
    expect(s.talk!.beat).toBe('doe-gone');
    expect(s.flags).toContain('hesitated');
  });
  it('sparing the doe raises Bhima\'s regard; shooting it lowers it', () => {
    const spare = dayTo((t) => Math.max(0, t.indexOf('Lower the rifle.')));
    const shoot = dayTo((t) => Math.max(0, t.indexOf('Raise the rifle, and fire.')));
    expect(spare.marks.regard).toBeGreaterThan(T.REGARD_START);
    expect(shoot.marks.regard).toBeLessThan(T.REGARD_START);
  });
  it('the verandah gives the Raja\'s date, and the night starts in the guest room', () => {
    const s = night();
    expect(s.phase).toBe('night');
    expect(s.clues).toContain('sudam-vanished');
    expect(G.roomAt(1, s.night!.x, s.night!.z)).toBe('guest-room');
    expect(s.events.map((e) => e.type)).toContain('save');
  });
  it('a suspicious Raja bolts the door twice', () => {
    const s = dayTo((t) => { const i = t.findIndex((x) => x.includes('Your brother') || x.includes('Lower the rifle')); return Math.max(0, i); });
    expect(s.marks.suspicion).toBeGreaterThanOrEqual(5);
    expect(s.flags).toContain('bolted-twice');
  });
});

describe('the night: walking', () => {
  it('walls stop him; an open door lets him through', () => {
    let s = night();
    for (let i = 0; i < 200; i++) s = G.walk(s, 1, 0, 0, 1 / 30);
    expect(G.roomAt(1, s.night!.x, s.night!.z)).toBe('guest-room');
    s = outOfRoom(s);
    s = { ...s, night: { ...s.night!, x: 0, z: -1.6 } };
    for (let i = 0; i < 60; i++) s = G.walk(s, 1, 0, 0, 1 / 30);
    expect(G.roomAt(1, s.night!.x, s.night!.z)).toBe('corridor');
  });
  it('a walk that goes nowhere is the same state', () => {
    const s = night();
    expect(G.walk(s, 0, 0, 0, 0.1)).toBe(s);
  });
  it('furniture is solid', () => {
    const s = night(), bed = get('spot', 'guest-bed'), r = get('room', 'guest-room');
    expect(G.standable(s, r.x + bed.at[0], r.z + bed.at[1])).toBe(false);
  });
});

describe('the night: touching things', () => {
  it('the escape: hairpin, tripod leg, trunk, hook, door', () => {
    const s = outOfRoom(night());
    expect(s.night!.doors).toContain('guest-door');
    expect(s.items).toContain('bolt-hook');
    expect(s.items).not.toContain('hairpin');
    expect(s.events).toContainEqual({ type: 'door', id: 'guest-door', open: true });
  });
  it('the hook without the trunk says what is missing', () => {
    let s = G.interact(at(night(), 'punkah-rope'), 'punkah-rope');
    s = G.interact(at(s, 'trunk'), 'trunk');
    s = G.combine(s, 'hairpin', 'tripod-leg');
    s = G.interact(at(s, 'bolted-door'), 'bolted-door', 'bolt-hook');
    expect(s.night!.doors).not.toContain('guest-door');
    expect(said(s)).toMatch(/Something to stand on/);
  });
  it('a spot out of reach does nothing', () => {
    const s = night();
    expect(G.interact(s, 'workbench')).toEqual({ ...s, events: [] });
  });
  it('a wrong item gets a stock line, not silence', () => {
    const s = G.interact(at(night(), 'punkah'), 'punkah', 'camera');
    expect(said(s)).toBe(get('remark', 'wrong-item').text);
  });
  it('a once beat fires once, then the next beat answers', () => {
    let s = G.interact(at(night(), 'punkah-rope'), 'punkah-rope');
    expect(s.items).toContain('hairpin');
    s = G.interact(s, 'punkah-rope');
    expect(said(s)).toMatch(/no cooler/);
  });
  it('the trunk moves to the door', () => {
    let s = G.interact(at(night(), 'trunk'), 'trunk');
    s = G.interact(s, 'trunk');
    expect(G.spotPose(s, get('spot', 'trunk')).at).toEqual([0.85, -2.05]);
  });
  it('a wrong code costs watch time and opens nothing', () => {
    const s = outOfRoom(night());
    const near = at(s, 'storeroom-dials');
    const wrong = G.enterCode(near, 'storeroom-dials', ['leopard', 'boar', 'gaur', 'bear']);
    expect(wrong.night!.doors).not.toContain('storeroom-door');
    expect(wrong.night!.clockS).toBeGreaterThan(near.night!.clockS);
    const right = G.enterCode(near, 'storeroom-dials', ['gaur', 'bear', 'leopard', 'boar']);
    expect(right.night!.doors).toContain('storeroom-door');
  });
  it('the camera finds what the eye missed', () => {
    const s = outOfRoom(night());
    expect(G.interact(at(s, 'man-eater'), 'man-eater').clues).not.toContain('photo-man-eater');
    expect(G.photograph(at(s, 'man-eater'), 'man-eater').clues).toContain('photo-man-eater');
  });
});

describe('the night: the deduction and the bed', () => {
  const ready = () => {
    let s = outOfRoom(night());
    s = G.photograph(at(s, 'man-eater'), 'man-eater');
    s = G.interact(at(s, 'man-eater-plaque'), 'man-eater-plaque');
    s = G.enterCode(at(s, 'storeroom-dials'), 'storeroom-dials', ['gaur', 'bear', 'leopard', 'boar']);
    s = G.interact(at(s, 'workbench'), 'workbench');
    return G.interact(at(s, 'taxidermy-register'), 'taxidermy-register');
  };
  const answers = (s: GameState) => G.asks(s, 'staged-tiger').map((a) => a.answer);
  it('the bed refuses until the night is proved', () => {
    const s = G.interact(at(night(), 'guest-bed'), 'guest-bed');
    expect(s.phase).toBe('night');
    expect(said(s)).toMatch(/Not yet/);
  });
  it('a question stays shut until its clues are in', () => {
    expect(G.asks(night(), 'staged-tiger').every((a) => a.open)).toBe(false);
    expect(G.asks(ready(), 'staged-tiger').every((a) => a.open)).toBe(true);
  });
  it('answers are confirmed together; a wrong set costs time and says nothing about which', () => {
    const s = ready();
    const wrong = G.confirm(s, 'staged-tiger', [...answers(s).slice(0, 2), 'a tiger']);
    expect(wrong.flags).not.toContain('staged-tiger');
    expect(wrong.night!.clockS - s.night!.clockS).toBeGreaterThan(0);
    const right = G.confirm(s, 'staged-tiger', answers(s));
    expect(right.flags).toContain('staged-tiger');
  });
  it('proved, the bed ends the night on the reveal, and the reveal leads to the morning', () => {
    let s = G.confirm(ready(), 'staged-tiger', answers(ready()));
    s = G.interact(at(s, 'guest-bed'), 'guest-bed');
    expect(s.phase).toBe('reveal');
    s = G.afterReveal(s);
    expect(s.talk!.scene).toBe('morning-2');
  });
});

describe('the night: time and the watchman', () => {
  it('the clock chimes the quarters', () => {
    const s = G.tick(night(), (T.CHIME_EVERY_MIN + 0.1) * (T.NIGHT_S / (T.DAWN_MIN - T.NIGHT_START_MIN)));
    expect(s.events.some((e) => e.type === 'chime')).toBe(true);
  });
  it('dawn knocks, costs suspicion, and knocks again, but never to the peak on its own', () => {
    let s = G.tick(night(), T.NIGHT_S + 0.01);
    expect(s.events).toContainEqual({ type: 'knock' });
    for (let i = 0; i < 40; i++) s = G.tick(s, T.KNOCK_EVERY_S);
    expect(s.night!.knocks).toBeGreaterThan(10);
    expect(s.marks.suspicion).toBe(T.SUSPICION_PEAK - 1);
    expect(s.phase).toBe('night');
  });
  it('stuck long enough, he thinks aloud, and the casebook keeps the thought', () => {
    const s = G.tick(night(), 91);
    expect(s.events.some((e) => e.type === 'hint')).toBe(true);
    expect(s.thoughts.length).toBe(1);
  });
  it('Bhima sees a lit candle down the corridor, a dark man only close and in front of him', () => {
    const s = outOfRoom(night());
    const w: G.Watchman = { ...s.night!.watch[0]!, x: 6, z: -4, face: -Math.PI / 2, mode: 'patrol' };
    const dark = { ...s, night: { ...s.night!, x: -2, z: -4, candle: false } };
    expect(G.sees(dark, w)).toBe(false);
    expect(G.sees({ ...dark, night: { ...dark.night!, candle: true } }, w)).toBe(true);
    const close = { ...dark, night: { ...dark.night!, x: 3, z: -4 } };
    expect(G.sees(close, w)).toBe(true);
    expect(G.sees(close, { ...w, face: Math.PI / 2 })).toBe(false);
    expect(G.sees({ ...close, night: { ...close.night!, hidden: 'corridor-alcove' } }, w)).toBe(false);
  });
  it('walls hide him: Bhima in the corridor can\'t see into a bolted room', () => {
    const s = night();
    const w: G.Watchman = { ...s.night!.watch[0]!, x: 0, z: -3.2, face: Math.PI, mode: 'patrol' };
    expect(G.sees({ ...s, night: { ...s.night!, candle: true } }, w)).toBe(false);
  });
  it('seen, then chased, then caught: the excuse scene, and back to the bolted room', () => {
    let s = outOfRoom(night());
    s = { ...s, night: { ...s.night!, x: 2, z: -4, candle: true, watch: [{ ...s.night!.watch[0]!, x: 5, z: -4, face: -Math.PI / 2, mode: 'patrol', wait: 0 }] } };
    s = G.tick(s, 0.05);
    expect(s.night!.watch[0]!.mode).toBe('alert');
    for (let i = 0; i < 200 && !s.talk; i++) s = G.tick(s, 0.05);
    expect(s.talk!.scene).toBe('caught-1');
    while (!G.choices(s).length) s = G.next(s);
    s = G.choose(s, 0);
    while (s.talk) s = G.next(s);
    expect(s.night!.doors).not.toContain('guest-door');
    expect(G.roomAt(1, s.night!.x, s.night!.z)).toBe('guest-room');
    expect(s.items).toContain('bolt-hook');
  });
  it('caught in his own doorway, he is walked back once: Bhima goes back to his round, he does not catch him again', () => {
    // Bhima follows him into the guest room and catches him there, by the bed he is about to be walked back to.
    let s = night();
    const home = { x: s.night!.x, z: s.night!.z };
    s = { ...s, night: { ...s.night!, doors: [...s.night!.doors, 'guest-door'], candle: true, watch: [{ ...s.night!.watch[0]!, x: home.x + 0.5, z: home.z, mode: 'chase', t: 0, lastX: home.x, lastZ: home.z, trail: [[home.x + 0.5, home.z]] }] } };
    for (let i = 0; i < 40 && !s.talk; i++) s = G.tick(s, 0.05);
    expect(s.talk!.scene).toBe('caught-1');
    while (!G.choices(s).length) s = G.next(s);
    s = G.choose(s, 0);
    while (s.talk) s = G.next(s);
    expect(G.roomAt(1, s.night!.x, s.night!.z)).toBe('guest-room');
    // Twenty seconds at the bed after: no second catch, no second excuse.
    for (let i = 0; i < 400; i++) { s = G.tick(s, 0.05); expect(s.talk, `caught again after ${(i * 0.05).toFixed(2)} s`).toBeNull(); }
  });
  it('out of his sight long enough, he gives up and walks home', () => {
    let s = outOfRoom(night());
    s = { ...s, night: { ...s.night!, x: 2, z: -4, candle: true, watch: [{ ...s.night!.watch[0]!, x: 5, z: -4, face: -Math.PI / 2, mode: 'patrol', wait: 0 }] } };
    s = G.tick(s, 0.05);
    s = { ...s, night: { ...s.night!, hidden: 'corridor-alcove' } };
    for (let i = 0; i < 200; i++) s = G.tick(s, 0.05);
    expect(s.talk).toBeNull();
    expect(['return', 'patrol']).toContain(s.night!.watch[0]!.mode);
  });
});

describe('the marks', () => {
  it('at the peak, the next beat is the midnight shikar', () => {
    let s = G.newGame();
    s = { ...s, marks: { ...s.marks, suspicion: T.SUSPICION_PEAK } };
    while (G.choices(s).length === 0 && s.talk?.scene !== G.PEAK_SCENE) s = G.next(s);
    if (s.talk?.scene !== G.PEAK_SCENE) s = G.choose(s, 0);
    expect(s.talk!.scene).toBe(G.PEAK_SCENE);
    while (s.phase !== 'end') s = G.next(s);
    expect(s.ending).toBe('shikar-end');
  });
});

describe('saves', () => {
  it('a night\'s start round-trips through JSON', () => {
    const s = night();
    expect(G.parseSave(JSON.parse(JSON.stringify(s)))).toEqual({ ...s, events: [] });
  });
  it('a broken save is refused', () => {
    expect(G.parseSave({ day: 'one' })).toBeNull();
    expect(G.parseSave({ ...night(), talk: { scene: 'gone', beat: 'gone', at: 0, t: 0, said: -1 } })).toBeNull();
  });
});

describe('the solver', () => {
  const outcomes = dayOutcomes();
  it('Day 1 can end many ways, all of them into Night 1', () => {
    expect(outcomes.length).toBeGreaterThan(4);
    expect(outcomes.every((o) => o.s.phase === 'night')).toBe(true);
  });
  it('after every one of them, Night 1 is solvable, without dead ends, and every clue can be found', () => {
    for (const o of outcomes) {
      const r = solveNight(o.s, o.label);
      expect(r.solvable, o.label).toBe(true);
      expect(r.deadEnds, o.label).toEqual([]);
      expect(r.unfoundClues, o.label).toEqual([]);
      expect(r.threads.length, o.label).toBeGreaterThanOrEqual(2);
    }
  }, 60_000);
  it('every spot answers a touch', () => {
    const r = solveNight(outcomes[0]!.s);
    expect(r.unreachedSpots).toEqual([]);
  });
  it('every night has one place it ends once proved, so the game can say where', () => {
    for (const nt of Object.values(C.night)) expect(G.bedSpot(nt.n), nt.id).toBeTruthy();
    expect(G.bedSpot(1)).toBe('guest-bed');
  });
  it('the content ids it relies on exist', () => {
    expect(C.scene[G.PEAK_SCENE]).toBeDefined();
  });
  it('the whole campaign: every night is solvable from the night before, and the last one ends on the full moon', () => {
    const nights = campaign();
    expect(nights.map((x) => x.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    let last: GameState | null = null;
    for (const { n, starts } of nights) {
      expect(starts.length, `night ${n}`).toBeGreaterThan(0);
      const r = solveNight(starts[0]!.s, starts[0]!.label);
      expect(r.solvable, `night ${n}`).toBe(true);
      expect(r.deadEnds, `night ${n}`).toEqual([]);
      last = r.end;
    }
    let s = G.afterReveal(last!);
    for (let i = 0; i < 40 && s.phase !== 'end'; i++) s = G.next(s);
    expect([s.phase, s.ending]).toEqual(['end', 'full-moon']);
  }, 120_000);
});
