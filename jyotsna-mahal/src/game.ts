// The rules, pure: (state, ...args) -> next state. Nothing here touches the renderer, the store, the DOM or storage
// (src/core-purity.test.ts holds that line); time arrives as an argument. Each transition leaves `events` describing
// what just happened, and the shell plays them (a sound, a toast, a door swinging).
//
// The game is a loop of day scenes and night wings. A day scene is beats of lines and choices (content/day*.kdl). A
// night is Thistlewood walking a wing's rooms, touching its spots with empty hands or an item, photographing them,
// working their dials, hiding from Bhima, and assembling the night's deduction in the casebook; once it is proved, his
// bed ends the night. Everything a spot or a choice does is an effect (content.ts: gives, sets, opens, clue...).
import { z } from 'zod';
import { C, get, nightOf, roomsOf, spotsIn, doorsOf, type Cond, type Effects, type Spot, type SpotWord, type Beat, type BeatWord, type Door, type Room } from './content';
import type { Marks } from './rewards';
import { T } from './tuning';

// ---------- state ----------

export type Watchman = {
  id: string; x: number; z: number;
  /** Heading, rad: 0 north (-z), pi/2 east (+x). */
  face: number;
  /** The stop he is walking to, and how long he still waits at it. */
  leg: number; wait: number;
  mode: 'patrol' | 'alert' | 'chase' | 'return';
  /** Seconds left of "who's there?", or seconds since he last saw you while chasing. */
  t: number;
  /** Where he last saw you, and the way back to his round. */
  lastX: number; lastZ: number; trail: [number, number][];
};

export type NightRun = {
  n: number; x: number; z: number;
  candle: boolean;
  /** The spot he is hiding in, until he moves. */
  hidden: string | null;
  /** Real seconds since the bolt; the dawn knock comes at T.NIGHT_S. */
  clockS: number;
  quarters: number; knocks: number;
  /** Seconds since the last new flag, item or clue: the hints' clock. */
  sinceProgressS: number;
  doors: string[]; hints: string[];
  watch: Watchman[];
  caught: number;
};

/** A scene in progress: the beat, the child it is at, seconds in it (a timer), and the last line shown (-1: none). */
export type Talk = { scene: string; beat: string; at: number; t: number; said: number };

export type Phase = 'day' | 'night' | 'reveal' | 'end';

export type GameEvent =
  | { type: 'said'; text: string }
  | { type: 'line'; who: string; sound?: string }
  | { type: 'sound'; id: string }
  | { type: 'item'; id: string; gained: boolean }
  | { type: 'clue'; id: string }
  | { type: 'door'; id: string; open: boolean }
  | { type: 'photo'; spot: string }
  | { type: 'hint'; id: string; text: string }
  | { type: 'chime'; strikes: number }
  | { type: 'knock' }
  | { type: 'seen'; by: string }
  | { type: 'caught'; by: string }
  | { type: 'lost'; by: string }
  | { type: 'proved'; id: string }
  | { type: 'night-start'; n: number }
  | { type: 'night-end'; n: number }
  | { type: 'returned' }
  | { type: 'save' }
  | { type: 'ending'; id: string };

export type GameState = {
  day: number; phase: Phase; ending: string | null;
  flags: string[]; items: string[]; clues: string[];
  /** `spot#n` of the beats marked `once` that have fired. */
  fired: string[];
  /** Thistlewood's thoughts (hints) in the order he had them: the casebook keeps them. */
  thoughts: string[];
  marks: Marks;
  /** Counters content keeps (`adds="slots"`, `slots<2`): how many of a day's engagements he has spent. */
  counts: Record<string, number>;
  talk: Talk | null;
  night: NightRun | null;
  events: GameEvent[];
};

const base = (): GameState => ({
  day: 1, phase: 'day', ending: null, flags: [], items: [], clues: [], fired: [], thoughts: [],
  marks: { suspicion: T.SUSPICION_START, regard: T.REGARD_START }, counts: {}, talk: null, night: null, events: [],
});

/** The first morning: Day 1's first scene. */
export const newGame = (): GameState => enterScene(base(), firstScene(1));

const firstScene = (day: number) => {
  const sc = Object.values(C.scene).find((x) => x.day === day);
  if (!sc) throw new Error(`no scene for day ${day} in content`);
  return sc.id;
};

// ---------- conditions and effects ----------

/** Does every term hold? */
export function holds(s: GameState, conds: Cond[]): boolean {
  return conds.every((c) => {
    if (c.kind === 'flag') return s.flags.includes(c.name) !== c.not;
    if (c.kind === 'has') return s.items.includes(c.item) !== c.not;
    if (c.kind === 'knows') return s.clues.includes(c.clue) !== c.not;
    if (c.kind === 'after') return (!!s.night && watchMin(s.night) >= c.min) !== c.not;
    const v = c.kind === 'mark' ? s.marks[c.mark] : s.counts[c.name] ?? 0;
    return c.op === '>=' ? v >= c.n : c.op === '<=' ? v <= c.n : c.op === '>' ? v > c.n : v < c.n;
  });
}

const add = (list: string[], more: string[]) => { const out = [...list]; for (const x of more) if (!out.includes(x)) out.push(x); return out; };
const drop = (list: string[], less: string[]) => list.filter((x) => !less.includes(x));

/** Apply effects. `key` marks a `once` beat as fired. Watch minutes become night seconds. */
function apply(s: GameState, e: Effects, key?: string): GameState {
  const ev: GameEvent[] = [...s.events];
  for (const id of e.gives) if (!s.items.includes(id)) ev.push({ type: 'item', id, gained: true });
  for (const id of e.takes) if (s.items.includes(id)) ev.push({ type: 'item', id, gained: false });
  for (const id of e.clue) if (!s.clues.includes(id)) ev.push({ type: 'clue', id });
  if (e.sound) ev.push({ type: 'sound', id: e.sound });
  const items = add(drop(s.items, e.takes), e.gives);
  const flags = add(drop(s.flags, e.unsets), e.sets);
  const clues = add(s.clues, e.clue);
  const marks = e.marks.reduce((m, r) => r(m), s.marks);
  let counts = s.counts;
  if (e.adds.length || e.resets.length) {
    counts = { ...counts };
    for (const c of e.resets) counts[c] = 0;
    for (const c of e.adds) counts[c] = (counts[c] ?? 0) + 1;
  }
  let night = s.night;
  if (night) {
    const progressed = items.length > s.items.length || flags.length !== s.flags.length || clues.length > s.clues.length;
    const doors = drop(add(night.doors, e.opens), e.closes);
    for (const id of e.opens) if (!night.doors.includes(id)) ev.push({ type: 'door', id, open: true });
    for (const id of e.closes) if (night.doors.includes(id)) ev.push({ type: 'door', id, open: false });
    night = { ...night, doors, sinceProgressS: progressed ? 0 : night.sinceProgressS, clockS: night.clockS + e.minutes * secondsPerMinute() };
  }
  return { ...s, items, flags, clues, marks, counts, night, fired: e.once && key ? add(s.fired, [key]) : s.fired, events: ev };
}

const say = (s: GameState, text: string): GameState => ({ ...s, events: [...s.events, { type: 'said', text }] });
const remark = (s: GameState, id: string, name = '') => say(s, get('remark', id).text.replace('{name}', name));
const secondsPerMinute = () => T.NIGHT_S / (T.DAWN_MIN - T.NIGHT_START_MIN);
/** Start a transition: the previous transition's events are spent. */
const fresh = (s: GameState): GameState => (s.events.length ? { ...s, events: [] } : s);

// ---------- the floor plan ----------

type Rect = { x0: number; x1: number; z0: number; z1: number };
const roomRect = (r: Room, inset = 0): Rect => ({ x0: r.x - r.w / 2 + inset, x1: r.x + r.w / 2 - inset, z0: r.z - r.d / 2 + inset, z1: r.z + r.d / 2 - inset });
const inside = (q: Rect, x: number, z: number) => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1;

/** Where a door stands: its centre on the wall, which way the wall runs, and its gap as a rectangle. */
export function doorPlace(d: Door) {
  const r = get('room', d.from);
  const ns = d.wall === 'north' || d.wall === 'south';
  const x = ns ? r.x + d.at : r.x + (d.wall === 'east' ? r.w / 2 : -r.w / 2);
  const z = ns ? r.z + (d.wall === 'south' ? r.d / 2 : -r.d / 2) : r.z + d.at;
  return { x, z, ns, gap: (inset: number): Rect => ns ? { x0: x - d.w / 2 + inset, x1: x + d.w / 2 - inset, z0: z - 0.6, z1: z + 0.6 } : { x0: x - 0.6, x1: x + 0.6, z0: z - d.w / 2 + inset, z1: z + d.w / 2 - inset } };
}

/** Where a spot stands now: its first `pose` whose condition holds, else its own place. */
export function spotPose(s: GameState, sp: Spot) {
  const pose = sp.children.find((c): c is Extract<SpotWord, { word: 'pose' }> => c.word === 'pose' && holds(s, c.if));
  return { at: pose?.at ?? sp.at, turn: pose?.turn ?? (pose?.at ? 0 : sp.turn), y: pose?.y ?? sp.y };
}

function solids(s: GameState, n: number): { x: number; z: number; r: number }[] {
  const out: { x: number; z: number; r: number }[] = [];
  for (const room of roomsOf(n)) {
    for (const c of room.children) if (c.word === 'prop' && c.solid) out.push({ x: room.x + c.at[0], z: room.z + c.at[1], r: c.solid });
    for (const sp of spotsIn(room.id)) if (sp.solid) { const p = spotPose(s, sp); out.push({ x: room.x + p.at[0], z: room.z + p.at[1], r: sp.solid }); }
  }
  return out;
}

/** Can a body stand here? Inside a room, or in the gap of an open door, and clear of furniture. */
export function standable(s: GameState, x: number, z: number): boolean {
  const n = s.night!.n;
  const inRoom = roomsOf(n).some((r) => inside(roomRect(r, T.BODY_U), x, z)) ||
    doorsOf(n).some((d) => s.night!.doors.includes(d.id) && inside(doorPlace(d).gap(T.BODY_U), x, z));
  return inRoom && solids(s, n).every((o) => Math.hypot(o.x - x, o.z - z) >= o.r + T.BODY_U);
}

/** The room a point is in (a doorway belongs to whichever side holds the point). */
export function roomAt(n: number, x: number, z: number): string | null {
  return roomsOf(n).find((r) => inside(roomRect(r), x, z))?.id ?? null;
}

/** Is the straight line between two points clear of walls (through open doors only)? */
export function clear(s: GameState, ax: number, az: number, bx: number, bz: number): boolean {
  const n = s.night!.n, rooms = roomsOf(n).map((r) => roomRect(r, 0.05));
  const gaps = doorsOf(n).filter((d) => s.night!.doors.includes(d.id)).map((d) => doorPlace(d).gap(0.05));
  const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.15));
  for (let i = 0; i <= steps; i++) {
    const x = ax + ((bx - ax) * i) / steps, z = az + ((bz - az) * i) / steps;
    if (!rooms.some((q) => inside(q, x, z)) && !gaps.some((q) => inside(q, x, z))) return false;
  }
  return true;
}

// ---------- the day: scenes and beats ----------

const beatOf = (id: string): Beat => get('beat', id);
type Choice = Extract<BeatWord, { word: 'choose' }>;

/** The choices on offer now (empty while lines remain). */
export function choices(s: GameState): Choice[] {
  if (!s.talk) return [];
  const b = beatOf(s.talk.beat);
  if (s.talk.at < b.children.length) return [];
  return b.children.filter((c): c is Choice => c.word === 'choose' && holds(s, c.does.if));
}

/** The line on screen: the one being read, or (while choices are up) the last one read in this beat. */
export function currentLine(s: GameState): Extract<BeatWord, { word: 'line' }> | null {
  if (!s.talk) return null;
  const c = beatOf(s.talk.beat).children[s.talk.said];
  return c?.word === 'line' ? c : null;
}

export function enterScene(s: GameState, sceneId: string): GameState {
  const sc = get('scene', sceneId);
  return enterBeat({ ...s, talk: { scene: sc.id, beat: sc.first, at: -1, t: 0, said: -1 } }, sc.first);
}

function enterBeat(s: GameState, beatId: string): GameState {
  if (s.marks.suspicion >= T.SUSPICION_PEAK && s.talk?.scene !== PEAK_SCENE && s.phase !== 'end') {
    const sc = get('scene', PEAK_SCENE);
    return stepTalk({ ...s, talk: { scene: sc.id, beat: sc.first, at: -1, t: 0, said: -1 } });
  }
  return stepTalk({ ...s, talk: { scene: beatOf(beatId).scene, beat: beatId, at: -1, t: 0, said: -1 } });
}

/** The scene that plays when suspicion peaks: the Raja proposes a midnight shikar. */
export const PEAK_SCENE = 'midnight-shikar';

/** Move to the next line whose condition holds, applying `does` on the way; at the end, offer choices or move on. */
function stepTalk(s: GameState): GameState {
  const b = beatOf(s.talk!.beat);
  for (let i = s.talk!.at + 1; i < b.children.length; i++) {
    const c = b.children[i]!;
    if (c.word === 'does' && holds(s, c.does.if)) s = apply(s, c.does);
    if (c.word === 'line' && holds(s, c.does.if)) {
      const first = !b.children.slice(0, i).some((p) => p.word === 'line' && p.key === c.key);
      const sound = c.does.sound ?? (first ? C.person[c.key!]?.sound : undefined);
      s = apply({ ...s, talk: { ...s.talk!, at: i, said: i } }, { ...c.does, sound: undefined });
      return { ...s, events: [...s.events, { type: 'line', who: c.key!, sound }] };
    }
  }
  s = { ...s, talk: { ...s.talk!, at: b.children.length } };
  if (choices(s).length) return s;
  return resolve(s, b);
}

/** After the last line and no choices: the first `go` or `ends` whose condition holds. */
function resolve(s: GameState, b: Beat): GameState {
  for (const c of b.children) {
    if (c.word === 'go' && holds(s, c.if)) return enterBeat(s, c.to);
    if (c.word === 'ends' && holds(s, c.if)) return endScene(s, c.how, c.ending);
  }
  throw new Error(`beat "${b.id}": nothing comes after it (add go "..." or ends "...")`);
}

/** The player clicks on: the next line. No-op while choices are up. */
export function next(s: GameState): GameState {
  s = fresh(s);
  if (!s.talk || s.talk.at >= beatOf(s.talk.beat).children.length) return s;
  return stepTalk(s);
}

/** The player picks choice `i` of those on offer. */
export function choose(s: GameState, i: number): GameState {
  s = fresh(s);
  const c = choices(s)[i];
  if (!c) return s;
  s = apply(s, c.does);
  if (c.go) return enterBeat(s, c.go);
  if (c.ends) return endScene(s, c.ends as 'night' | 'resume' | 'ending');
  return resolve(s, beatOf(s.talk!.beat));
}

function endScene(s: GameState, how: 'night' | 'back-to-room' | 'morning' | 'resume' | 'ending', ending?: string): GameState {
  s = { ...s, talk: null };
  if (how === 'night') return startNight(s, s.day);
  if (how === 'back-to-room') return backToRoom(s);
  if (how === 'resume') return whens({ ...s, phase: 'night' });
  if (how === 'morning') return enterScene({ ...s, day: s.day + 1, phase: 'day', night: null }, firstScene(s.day + 1));
  return { ...s, phase: 'end', ending: ending ?? 'the-end', night: null, events: [...s.events, { type: 'ending', id: ending ?? 'the-end' }] };
}

// ---------- the night ----------

export function startNight(s: GameState, n: number): GameState {
  const nt = nightOf(n), room = get('room', nt.start);
  const watch = Object.values(C.patrol).filter((p) => p.night === n && holds(s, p.if ?? [])).map((p): Watchman => {
    const st = p.children[0]!, r = get('room', st.room);
    return { id: p.id, x: r.x + st.at[0], z: r.z + st.at[1], face: 0, leg: 1 % p.children.length, wait: st.wait, mode: 'patrol', t: 0, lastX: 0, lastZ: 0, trail: [] };
  });
  s = {
    ...s, phase: 'night', talk: null,
    night: {
      n, x: room.x + nt.at[0], z: room.z + nt.at[1], candle: false, hidden: null, clockS: 0, quarters: 0, knocks: 0, sinceProgressS: 0,
      doors: doorsOf(n).filter((d) => d.open).map((d) => d.id), hints: [], watch, caught: 0,
    },
  };
  for (const c of nt.children) if (c.word === 'begins' && holds(s, c.does.if)) s = apply(s, c.does);
  return { ...s, events: [...s.events, { type: 'night-start', n }, { type: 'save' }] };
}

/** Bhima walks him back: the night's `on-caught` effects, and he is where he woke, candle out. */
export function backToRoom(s: GameState): GameState {
  const nt = nightOf(s.night!.n), room = get('room', nt.start);
  for (const c of nt.children) if (c.word === 'on-caught' && holds(s, c.does.if)) s = apply(s, c.does);
  return { ...s, phase: 'night', night: { ...s.night!, x: room.x + nt.at[0], z: room.z + nt.at[1], candle: false, hidden: null, caught: s.night!.caught + 1 }, events: [...s.events, { type: 'returned' }] };
}

/** Is he free to act in the wing (not in a scene, not past the night)? */
const roaming = (s: GameState) => s.phase === 'night' && !!s.night && !s.talk;

/** Walk: `fwd` and `side` in -1..1 along his heading `yaw` (rad, 0 north), for `dtS` seconds. Walls stop him. */
export function walk(s: GameState, fwd: number, side: number, yaw: number, dtS: number): GameState {
  if (!roaming(s) || (!fwd && !side)) return s;
  const len = Math.hypot(fwd, side), k = (T.WALK_U_S * dtS) / Math.max(1, len);
  const dx = (Math.sin(yaw) * fwd + Math.cos(yaw) * side) * k, dz = (-Math.cos(yaw) * fwd + Math.sin(yaw) * side) * k;
  const { x, z } = s.night!;
  let nx = x, nz = z;
  if (standable(s, x + dx, z + dz)) { nx = x + dx; nz = z + dz; }
  else if (standable(s, x + dx, z)) nx = x + dx;
  else if (standable(s, x, z + dz)) nz = z + dz;
  if (nx === x && nz === z) return s;
  return { ...fresh(s), night: { ...s.night!, x: nx, z: nz, hidden: null } };
}

/** Can his hand reach the spot from where he stands? */
export function reachable(s: GameState, spotId: string, extra = 0): boolean {
  if (!roaming(s)) return false;
  const sp = get('spot', spotId), room = get('room', sp.room), p = spotPose(s, sp);
  const n = s.night!;
  if (roomAt(n.n, n.x, n.z) !== sp.room) return false;
  return Math.hypot(room.x + p.at[0] - n.x, room.z + p.at[1] - n.z) <= sp.r + T.REACH_U + extra;
}

type Verb = 'look' | 'use' | 'photo' | 'code' | 'hide' | 'bed' | 'talk';
/** The beat a touch would fire: the first of `verbs` (with `item` for use) whose condition holds and isn't spent. */
export function beatFor(s: GameState, spotId: string, verbs: Verb[], item?: string) {
  const sp = get('spot', spotId);
  const proved = s.night ? s.flags.includes(nightOf(s.night.n).proves) : false;
  for (const [i, c] of sp.children.entries()) {
    if (c.word === 'pose' || !verbs.includes(c.word)) continue;
    if (c.word === 'use' && c.key !== item) continue;
    if (c.word === 'bed' && !proved) continue;
    if (!holds(s, c.does.if) || (c.does.once && s.fired.includes(`${sp.id}#${i}`))) continue;
    return { c, key: `${sp.id}#${i}` };
  }
  return null;
}

/** Touch a spot with empty hands, or with `item` from the pockets. */
export function interact(s: GameState, spotId: string, item?: string): GameState {
  s = fresh(s);
  if (!reachable(s, spotId)) return s;
  if (item && !s.items.includes(item)) return s;
  const sp = get('spot', spotId);
  s = { ...s, flags: add(s.flags, [`seen:${spotId}`]) };
  const hit = beatFor(s, spotId, item ? ['use'] : ['look', 'hide', 'bed', 'talk'], item);
  if (!hit) return item ? remark(s, 'wrong-item', sp.name) : remark(s, 'nothing', sp.name);
  s = apply(say(s, hit.c.text), hit.c.does, hit.key);
  if (hit.c.word === 'hide') s = { ...s, night: { ...s.night!, hidden: spotId } };
  if (hit.c.word === 'bed') return { ...s, phase: 'reveal', events: [...s.events, { type: 'night-end', n: s.night!.n }] };
  if (hit.c.word === 'talk') return enterScene(s, hit.c.key!);
  return whens(s);
}

/** Photograph a spot (the camera reaches further than a hand). */
export function photograph(s: GameState, spotId: string): GameState {
  s = fresh(s);
  if (!reachable(s, spotId, T.REACH_U * 2)) return s;
  const sp = get('spot', spotId);
  s = { ...s, flags: add(s.flags, [`seen:${spotId}`]), events: [{ type: 'photo', spot: spotId }] };
  const hit = beatFor(s, spotId, ['photo']);
  if (!hit) return remark(s, 'photo-plain', sp.name);
  return whens(apply(say(s, hit.c.text), hit.c.does, hit.key));
}

/** The dials a spot carries, if any (what the code screen shows). */
export function dialsOf(s: GameState, spotId: string) {
  const hit = beatFor(s, spotId, ['code']);
  return hit && hit.c.word === 'code' ? { faces: hit.c.key!.split(/\s+/), dials: hit.c.dials } : null;
}

/** Turn a spot's dials to `faces` and try the handle. */
export function enterCode(s: GameState, spotId: string, faces: string[]): GameState {
  s = fresh(s);
  if (!reachable(s, spotId)) return s;
  const hit = beatFor(s, spotId, ['code']);
  if (!hit || hit.c.word !== 'code') return s;
  if (faces.join(' ') !== hit.c.answer.join(' ')) {
    s = remark(s, 'code-wrong', get('spot', spotId).name);
    return { ...s, night: { ...s.night!, clockS: s.night!.clockS + T.WRONG_CODE_MIN * secondsPerMinute() }, events: [...s.events, { type: 'sound', id: 'dial-rattle' }] };
  }
  return whens(apply(say(s, hit.c.text), hit.c.does, hit.key));
}

/** Put two things from the pockets together. */
export function combine(s: GameState, a: string, b: string): GameState {
  s = fresh(s);
  if (!s.items.includes(a) || !s.items.includes(b) || a === b) return s;
  const r = Object.values(C.recipe).find((x) => x.from.includes(a) && x.from.includes(b));
  if (!r) return remark(s, 'combine-no');
  const eff: Effects = { if: [], gives: [r.makes], takes: [a, b], sets: [], unsets: [], clue: r.clue ?? [], opens: [], closes: [], sound: r.sound, marks: [], once: false, minutes: 0, adds: [], resets: [] };
  return whens(apply(say(s, r.says), eff));
}

export const toggleCandle = (s: GameState): GameState =>
  roaming(s) ? { ...fresh(s), night: { ...s.night!, candle: !s.night!.candle, hidden: s.night!.candle ? s.night!.hidden : null }, events: [{ type: 'sound', id: s.night!.candle ? 'snuff' : 'match' }] } : s;

/** The night's `when` words whose condition now holds fire, once each, by themselves. */
export function whens(s: GameState): GameState {
  if (!s.night) return s;
  const nt = nightOf(s.night.n);
  nt.children.forEach((c, i) => {
    const key = `${nt.id}#${i}`;
    if (c.word !== 'when' || s.fired.includes(key) || !holds(s, c.does.if)) return;
    s = apply(say(s, c.text), { ...c.does, once: true }, key);
  });
  return s;
}

// ---------- the casebook's deduction ----------

/** The night's questions, each open once its clues are in the casebook. */
export function asks(s: GameState, dedId: string) {
  return get('deduction', dedId).children.map((a) => ({ ...a, open: a.from.every((c) => s.clues.includes(c)) }));
}

/** Lay the answers down together; they are only ever confirmed as a group. */
export function confirm(s: GameState, dedId: string, answers: string[]): GameState {
  s = fresh(s);
  const qs = asks(s, dedId);
  if (s.flags.includes(dedId) || !qs.every((q) => q.open) || answers.length !== qs.length) return s;
  if (qs.every((q, i) => q.answer === answers[i])) {
    return { ...s, flags: add(s.flags, [dedId]), events: [{ type: 'proved', id: dedId }, { type: 'sound', id: 'proved' }], night: s.night && { ...s.night, sinceProgressS: 0 } };
  }
  s = remark(s, 'deduction-wrong');
  return s.night ? { ...s, night: { ...s.night, clockS: s.night.clockS + T.WRONG_DEDUCTION_MIN * secondsPerMinute() } } : s;
}

/** After the reveal card: the night's following scene. */
export function afterReveal(s: GameState): GameState {
  if (s.phase !== 'reveal') return s;
  const n = s.night!.n;
  s = enterScene({ ...fresh(s), phase: 'day', day: n + 1, counts: {} }, nightOf(n).then);
  return { ...s, events: [...s.events, { type: 'save' }] };
}

// ---------- time: the clock, the knock, the hints, the watchman ----------

/** The pocket watch, minutes after the evening's midnight-but-one (so 23:30 is 1410). */
export const watchMin = (n: NightRun) => T.NIGHT_START_MIN + n.clockS / secondsPerMinute();

/** Time passes: `dtS` real seconds. */
export function tick(s: GameState, dtS: number): GameState {
  s = fresh(s);
  if (s.talk) {
    const b = beatOf(s.talk.beat);
    if (b['timer-s'] && b.timeout && choices(s).length) {
      const t = s.talk.t + dtS;
      return t >= b['timer-s'] ? enterBeat({ ...s, talk: { ...s.talk, t } }, b.timeout) : { ...s, talk: { ...s.talk, t } };
    }
    return s;
  }
  if (!roaming(s)) return s;
  const ev: GameEvent[] = [];
  let n: NightRun = { ...s.night!, clockS: s.night!.clockS + dtS, sinceProgressS: s.night!.sinceProgressS + dtS };
  // The Durbar Wing clock: a chime each quarter, the hour struck on the hour.
  const q = Math.floor((watchMin(n) - T.NIGHT_START_MIN) / T.CHIME_EVERY_MIN);
  if (q > n.quarters) { const hour = Math.floor(watchMin(n) / 60) % 12 || 12; ev.push({ type: 'chime', strikes: (watchMin(n) % 60) < T.CHIME_EVERY_MIN ? hour : 1 }); n = { ...n, quarters: q }; }
  // Dawn: Bhima's knock, again and again until he is in bed. A knock never pushes suspicion to the peak on its own.
  let marks = s.marks;
  if (n.clockS >= T.NIGHT_S + n.knocks * T.KNOCK_EVERY_S) {
    ev.push({ type: 'knock' });
    n = { ...n, knocks: n.knocks + 1 };
    marks = { ...marks, suspicion: Math.min(T.SUSPICION_PEAK - 1, marks.suspicion + T.KNOCK_SUSPICION) };
  }
  s = whens({ ...s, night: n, marks });
  // A thought, when stuck long enough on something not yet done.
  const hint = Object.values(C.hint).find((h) => h.night === n.n && !n.hints.includes(h.id) && n.sinceProgressS >= h['after-s'] && !holds(s, h.until));
  if (hint) { s = { ...s, thoughts: [...s.thoughts, hint.text], night: { ...s.night!, hints: [...n.hints, hint.id], sinceProgressS: 0 } }; ev.push({ type: 'hint', id: hint.id, text: hint.text }); }
  if (s.events.length) ev.push(...s.events);
  // The watchmen.
  let caught: string | null = null;
  const watch = s.night!.watch.map((w) => {
    const r = moveWatchman(s, w, dtS, ev);
    if (r.caught) caught = w.id;
    return r.w;
  });
  s = { ...s, night: { ...s.night!, watch }, events: ev };
  if (caught) {
    s = { ...s, events: [...s.events, { type: 'caught', by: caught }] };
    return enterScene(s, nightOf(n.n).caught);
  }
  return s;
}

const angleDiff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const headingTo = (ax: number, az: number, bx: number, bz: number) => Math.atan2(bx - ax, -(bz - az));

/** Does the watchman see him? His lantern shows a man close by; a lit candle shows him from much further. */
export function sees(s: GameState, w: Watchman, ignoreGaze = false): boolean {
  const n = s.night!;
  if (n.hidden) return false;
  const d = Math.hypot(n.x - w.x, n.z - w.z);
  if (d > (n.candle ? T.CANDLE_SIGHT_U : T.SIGHT_U)) return false;
  const facing = angleDiff(headingTo(w.x, w.z, n.x, n.z), w.face) <= (T.SIGHT_HALF_DEG * Math.PI) / 180;
  if (!ignoreGaze && !n.candle && d > T.NEAR_U && !facing) return false;
  return clear(s, w.x, w.z, n.x, n.z);
}

function stepToward(w: Watchman, tx: number, tz: number, speed: number, dtS: number): { w: Watchman; arrived: boolean } {
  const dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz), stepU = speed * dtS;
  if (d <= stepU) return { w: { ...w, x: tx, z: tz }, arrived: true };
  return { w: { ...w, x: w.x + (dx / d) * stepU, z: w.z + (dz / d) * stepU, face: Math.atan2(dx, -dz) }, arrived: false };
}

function moveWatchman(s: GameState, w: Watchman, dtS: number, ev: GameEvent[]): { w: Watchman; caught: boolean } {
  const p = get('patrol', w.id), n = s.night!;
  if (w.mode === 'patrol' || w.mode === 'return') {
    if (sees(s, w)) {
      ev.push({ type: 'seen', by: w.id }, { type: 'sound', id: 'who' });
      return { w: { ...w, mode: 'alert', t: T.ALERT_S, lastX: n.x, lastZ: n.z, face: headingTo(w.x, w.z, n.x, n.z), trail: w.mode === 'return' ? w.trail : [[w.x, w.z]] }, caught: false };
    }
    if (w.mode === 'return') {
      const back = w.trail.at(-1);
      if (!back) return { w: { ...w, mode: 'patrol' }, caught: false };
      const r = stepToward(w, back[0], back[1], p.speed, dtS);
      return { w: r.arrived ? { ...r.w, trail: w.trail.slice(0, -1) } : r.w, caught: false };
    }
    if (w.wait > 0) return { w: { ...w, wait: w.wait - dtS }, caught: false };
    const st = p.children[w.leg]!, r = get('room', st.room);
    const m = stepToward(w, r.x + st.at[0], r.z + st.at[1], p.speed, dtS);
    return { w: m.arrived ? { ...m.w, leg: (w.leg + 1) % p.children.length, wait: st.wait } : m.w, caught: false };
  }
  if (w.mode === 'alert') {
    const t = w.t - dtS;
    return { w: t <= 0 ? { ...w, mode: 'chase', t: 0 } : { ...w, t, face: headingTo(w.x, w.z, n.x, n.z) }, caught: false };
  }
  // Chasing: towards where he last saw you, dropping a trail to walk home by.
  const seeing = sees(s, w, true);
  let c: Watchman = seeing ? { ...w, lastX: n.x, lastZ: n.z, t: 0 } : { ...w, t: w.t + dtS };
  if (!seeing && c.t >= T.LOSE_S) { ev.push({ type: 'lost', by: w.id }); return { w: { ...c, mode: 'return' }, caught: false }; }
  const last = c.trail.at(-1);
  if (!last || Math.hypot(last[0] - c.x, last[1] - c.z) > 0.5) c = { ...c, trail: [...c.trail, [c.x, c.z]] };
  c = stepToward(c, c.lastX, c.lastZ, T.CHASE_U_S, dtS).w;
  const caught = seeing && Math.hypot(n.x - c.x, n.z - c.z) <= T.CATCH_U;
  return { w: caught ? { ...c, mode: 'return' } : c, caught };
}

// ---------- saves: a snapshot at the start of each night and each morning, checked by zod on load ----------

const Ids = z.array(z.string());
const WatchSave = z.object({ id: z.string(), x: z.number(), z: z.number(), face: z.number(), leg: z.number().int(), wait: z.number(), mode: z.enum(['patrol', 'alert', 'chase', 'return']), t: z.number(), lastX: z.number(), lastZ: z.number(), trail: z.array(z.tuple([z.number(), z.number()])) });
export const SaveSchema = z.object({
  day: z.number().int().positive(), phase: z.enum(['day', 'night', 'reveal', 'end']), ending: z.string().nullable(),
  flags: Ids, items: Ids, clues: Ids, fired: Ids, thoughts: Ids,
  marks: z.object({ suspicion: z.number(), regard: z.number() }),
  counts: z.record(z.string(), z.number()).default({}),
  talk: z.object({ scene: z.string(), beat: z.string(), at: z.number().int(), t: z.number(), said: z.number().int() }).nullable(),
  night: z.object({ n: z.number().int(), x: z.number(), z: z.number(), candle: z.boolean(), hidden: z.string().nullable(), clockS: z.number(), quarters: z.number().int(), knocks: z.number().int(), sinceProgressS: z.number(), doors: Ids, hints: Ids, watch: z.array(WatchSave), caught: z.number().int() }).nullable(),
});

/** A save's game, or null when it isn't one (or names content that no longer exists). */
export function parseSave(raw: unknown): GameState | null {
  const r = SaveSchema.safeParse(raw);
  if (!r.success) return null;
  const g = { ...r.data, events: [] } as GameState;
  if (g.talk && (!C.scene[g.talk.scene] || !C.beat[g.talk.beat])) return null;
  return g;
}
