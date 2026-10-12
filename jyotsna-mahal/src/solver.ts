// The solver: plays a night from the content alone, through the real rules in game.ts, and proves it fair.
// It walks every reachable state of the night (where he is doesn't matter, only what he has, knows and has opened),
// from every way the day before can end, and reports:
//   - solvable: the bed can end the night from the start;
//   - dead ends: states from which it can't (a soft-lock), with how to get there;
//   - the critical path: the fewest touches that finish the night;
//   - threads: how many independent lines of evidence converge on the deduction;
//   - unreached: spots never touched and clues never found (content nobody can see).
// Fairness is built in: a code is only tried once every spot that teaches it has been seen, and the deduction only
// once its clues are in (the core refuses earlier), so nothing here can be brute-forced.
import { C, get, nightOf, roomsOf, spotsIn, doorsOf } from './content';
import * as Game from './game';
import type { GameState } from './game';

type Step = { label: string; next: GameState };

/** The `seen:spot` flags anything reads (a code's `learns`, a condition); the rest don't change what can happen. */
const READ_SEEN = new Set([
  ...Object.values(C.spot).flatMap((sp) => sp.children.flatMap((w) => [
    ...(w.word === 'code' ? w.learns.map((l) => `seen:${l}`) : []),
    ...('does' in w ? w.does.if : w.word === 'pose' ? w.if : []).flatMap((t) => (t.kind === 'flag' ? [t.name] : [])),
  ])),
  ...Object.values(C.hint).flatMap((h) => h.until.flatMap((t) => (t.kind === 'flag' ? [t.name] : []))),
].filter((f) => f.startsWith('seen:')));

/** What the night's progress is, ignoring where he stands, what time it is, and sights nothing reads. */
const keyOf = (s: GameState) => JSON.stringify([s.phase, s.flags.filter((f) => !f.startsWith('seen:') || READ_SEEN.has(f)).sort(), [...s.items].sort(), [...s.clues].sort(), [...s.fired].sort(), [...(s.night?.doors ?? [])].sort()]);

/** Rooms he can walk to through open doors. */
function openRooms(s: GameState): string[] {
  const n = s.night!, seen = new Set([nightOf(n.n).start]), q = [nightOf(n.n).start];
  for (let r; (r = q.shift()); ) for (const d of doorsOf(n.n)) {
    if (!n.doors.includes(d.id)) continue;
    const other = d.from === r ? d.to : d.to === r ? d.from : null;
    if (other && !seen.has(other)) { seen.add(other); q.push(other); }
  }
  return [...seen];
}

/** Stand him at a spot (the solver walks instantly; the stories walk for real). */
function at(s: GameState, spotId: string): GameState {
  const sp = get('spot', spotId), room = get('room', sp.room), p = Game.spotPose(s, sp);
  return { ...s, night: { ...s.night!, x: room.x + p.at[0], z: room.z + p.at[1], hidden: null } };
}

/** Every touch available in a state. */
function steps(s: GameState): Step[] {
  const out: Step[] = [];
  const n = s.night!, ded = nightOf(n.n).proves;
  for (const room of openRooms(s)) for (const sp of spotsIn(room)) {
    const here = at(s, sp.id);
    out.push({ label: `look ${sp.id}`, next: Game.interact(here, sp.id) });
    for (const item of s.items) if (Game.beatFor(here, sp.id, ['use'], item)) out.push({ label: `use ${item} on ${sp.id}`, next: Game.interact(here, sp.id, item) });
    if (Game.beatFor(here, sp.id, ['photo'])) out.push({ label: `photograph ${sp.id}`, next: Game.photograph(here, sp.id) });
    const code = Game.beatFor(here, sp.id, ['code']);
    if (code && code.c.word === 'code' && code.c.learns.every((l) => s.flags.includes(`seen:${l}`))) out.push({ label: `dial ${sp.id}`, next: Game.enterCode(here, sp.id, code.c.answer) });
  }
  for (const [i, a] of s.items.entries()) for (const b of s.items.slice(i + 1)) out.push({ label: `combine ${a} + ${b}`, next: Game.combine(s, a, b) });
  const qs = Game.asks(s, ded);
  if (!s.flags.includes(ded) && qs.every((q) => q.open)) out.push({ label: `deduce ${ded}`, next: Game.confirm(s, ded, qs.map((q) => q.answer)) });
  // Being caught can happen at any moment: Bhima puts right what the night's on-caught says.
  out.push({ label: 'caught', next: Game.backToRoom(s) });
  return out;
}

export type NightReport = {
  n: number; name: string; start: string;
  states: number; solvable: boolean;
  deadEnds: string[][];
  critical: string[];
  threads: string[][];
  unreachedSpots: string[]; unfoundClues: string[];
};

/** Explore one night from one starting state. */
export function solveNight(start: GameState, label = 'start'): NightReport {
  const n = start.night!.n, nt = nightOf(n);
  const byKey = new Map<string, { s: GameState; from: string | null; via: string }>();
  const edges = new Map<string, string[]>();
  const k0 = keyOf(start);
  byKey.set(k0, { s: start, from: null, via: label });
  const q = [k0], goals: string[] = [];
  const touched = new Set<string>(), found = new Set(start.clues);
  while (q.length) {
    const k = q.shift()!, { s } = byKey.get(k)!;
    if (s.phase === 'reveal') { goals.push(k); continue; }
    const nexts: string[] = [];
    for (const st of steps(s)) {
      if (st.label.startsWith('look ') || st.label.startsWith('use ') || st.label.startsWith('photograph ') || st.label.startsWith('dial ')) {
        const spot = st.label.split(' ').at(-1)!;
        if (st.next !== s && st.next.events.length) touched.add(spot);
      }
      for (const c of st.next.clues) found.add(c);
      const nk = keyOf(st.next);
      nexts.push(nk);
      if (!byKey.has(nk)) { byKey.set(nk, { s: st.next, from: k, via: st.label }); q.push(nk); }
    }
    edges.set(k, nexts);
  }
  // States that can still reach a goal: walk the edges backwards from the goals.
  const back = new Map<string, string[]>();
  for (const [k, ns] of edges) for (const nk of ns) back.set(nk, [...(back.get(nk) ?? []), k]);
  const good = new Set(goals), stack = [...goals];
  for (let k; (k = stack.pop()); ) for (const p of back.get(k) ?? []) if (!good.has(p)) { good.add(p); stack.push(p); }
  const path = (k: string) => { const out: string[] = []; for (let c: string | null = k; c; c = byKey.get(c)!.from) out.unshift(byKey.get(c)!.via); return out.slice(1); };
  const deadEnds = [...byKey.keys()].filter((k) => !good.has(k)).slice(0, 5).map(path);
  const critical = goals.length ? path(goals.reduce((a, b) => (path(a).length <= path(b).length ? a : b))) : [];

  // Threads: the shortest way to each clue the deduction needs, minus what every one of those ways shares (getting
  // out of the room); clues whose remaining ways overlap are one thread.
  const all = [...new Set(get('deduction', nt.proves).children.flatMap((a) => a.from))];
  const fromDay = all.filter((c) => start.clues.includes(c)), need = all.filter((c) => !start.clues.includes(c));
  const ways = need.map((c) => {
    const k = [...byKey.keys()].find((kk) => byKey.get(kk)!.s.clues.includes(c));
    return { c, steps: new Set(k ? path(k).filter((l) => l !== 'caught') : []) };
  });
  const shared = ways.length ? [...ways[0]!.steps].filter((st) => ways.every((w) => w.steps.has(st))) : [];
  const groups: { clues: string[]; steps: Set<string> }[] = [];
  for (const w of ways) {
    const own = new Set([...w.steps].filter((st) => !shared.includes(st)));
    const hit = groups.filter((g) => [...own].some((st) => g.steps.has(st)));
    const merged = { clues: [w.c, ...hit.flatMap((g) => g.clues)], steps: new Set([...own, ...hit.flatMap((g) => [...g.steps])]) };
    for (const g of hit) groups.splice(groups.indexOf(g), 1);
    groups.push(merged);
  }

  const spots = roomsOf(n).flatMap((r) => spotsIn(r.id).map((s) => s.id));
  const clues = Object.keys(C.clue).filter((c) => [...Object.values(C.spot)].some((sp) => roomsOf(n).some((r) => r.id === sp.room) && sp.children.some((w) => 'does' in w && w.does.clue.includes(c))));
  return {
    n, name: nt.name, start: label, states: byKey.size, solvable: good.has(k0), deadEnds, critical,
    threads: [...groups.map((g) => g.clues), ...(fromDay.length ? [fromDay.map((c) => `${c} (from the day)`)] : [])],
    unreachedSpots: spots.filter((s) => !touched.has(s)), unfoundClues: clues.filter((c) => !found.has(c)),
  };
}

/** Every way the day before a night can end: each distinct state at the moment the night begins. */
export function dayOutcomes(start: GameState = Game.newGame()): { label: string; s: GameState }[] {
  const out = new Map<string, { label: string; s: GameState }>();
  const seen = new Set<string>();
  const walk = (s: GameState, label: string, depth: number) => {
    if (depth > 400) throw new Error(`day never reaches its night along: ${label}`);
    if (s.phase === 'night' || s.phase === 'end') {
      const k = JSON.stringify([s.phase, [...s.flags].sort(), [...s.items].sort(), [...s.clues].sort(), s.marks]);
      if (!out.has(k)) out.set(k, { label, s });
      return;
    }
    const k = JSON.stringify([s.talk, s.flags, s.marks]);
    if (seen.has(k)) return;
    seen.add(k);
    const cs = Game.choices(s);
    if (!cs.length) return walk(Game.next(s), label, depth + 1);
    cs.forEach((c, i) => walk(Game.choose(s, i), `${label} > ${c.text.replace(/["“”]/g, '').slice(0, 28)}`, depth + 1));
    const b = get('beat', s.talk!.beat);
    if (b['timer-s']) walk(Game.tick(s, b['timer-s']), `${label} > (waits)`, depth + 1);
  };
  walk(start, 'day 1', 0);
  return [...out.values()];
}
