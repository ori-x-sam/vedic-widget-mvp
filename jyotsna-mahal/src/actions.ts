// The one impure boundary for state: every key, click and tick lands here and reaches the core through a namespace
// (`Game.interact`), so the layer shows at the call site. Screens and input call these; they never write a store.
// After each transition, the events it left decide what the UI shows next (a toast, a card, the alarm) and when the
// game saves; the runtime plays the same events as sound and light.
import { C, get, nightOf } from './content';
import * as Game from './game';
import type { GameEvent, GameState } from './game';
import { game, initialUi, ui, type Tab } from './store';
import { now } from './clock';

const run = () => game.getState().run;

/** Commit a transition, then let its events steer the UI. */
function commit(next: GameState) {
  const prev = run();
  if (next === prev) return;
  game.setState({ run: next });
  react(prev, next, next.events);
}

const MOON = (f: number) => (f >= 0.99 ? 'Full moon' : f >= 0.85 ? 'The moon nearly full' : f >= 0.62 ? 'A gibbous moon' : f > 0.5 ? 'A waxing moon' : 'Half moon');

function react(prev: GameState, next: GameState, events: GameEvent[]) {
  const u = ui.getState(), patch: Partial<typeof u> = {};
  const say = (text: string, thought = false) => { patch.toast = { text, at: now(), thought }; };
  for (const e of events) {
    if (e.type === 'said') say(e.text);
    if (e.type === 'hint') say(e.text, true);
    if (e.type === 'seen') patch.alarm = true;
    if (e.type === 'lost' || e.type === 'caught') patch.alarm = false;
    if (e.type === 'item' && !e.gained && u.held === e.id) patch.held = null;
    if (e.type === 'item' && !e.gained && u.pick === e.id) patch.pick = null;
    if (e.type === 'save') game.setState({ save: { ...next, events: [] } });
    if (e.type === 'night-start') {
      const nt = nightOf(e.n);
      patch.card = { kind: 'title', title: `Night ${nt.n}`, sub: nt.name, text: `${MOON(nt.moon)}. ${e.n === 1 ? 'WASD to walk, the mouse to look (click to hold it; or drag). E to touch, F to photograph, Q for the candle, Tab for the casebook, the right button to peer.' : ''}` };
      patch.answers = []; patch.held = null; patch.pick = null; patch.dials = null; patch.casebook = false;
    }
    if (e.type === 'night-end') {
      const d = get('deduction', nightOf(e.n).proves);
      patch.card = { kind: 'reveal', title: d.title, sub: d.reveal, text: d.question };
      patch.casebook = false; patch.dials = null; patch.alarm = false;
    }
    if (e.type === 'ending') { const en = C.ending[e.id]; patch.card = { kind: 'ending', title: en?.title ?? 'The end', sub: '', text: en?.text ?? '' }; }
    if (e.type === 'caught') { patch.casebook = false; patch.dials = null; }
  }
  // A new day scene with a name gets its title card.
  const sc = next.talk?.scene;
  if (sc && sc !== prev.talk?.scene && get('scene', sc).name && !patch.card) {
    const name = get('scene', sc).name!, [title, sub] = name.includes(' — ') ? name.split(' — ') : [name, ''];
    patch.card = { kind: 'title', title: title!, sub: sub!, text: '' };
  }
  if (Object.keys(patch).length) ui.setState(patch);
}

// ---------- the title ----------

export function begin() {
  game.setState({ run: Game.newGame() });
  ui.setState({ ...initialUi, screen: 'play' });
  react({ ...run(), talk: null }, run(), run().events);
}

/** Back to the last save point: the start of the night, or the morning. */
export function resume() {
  const s = game.getState().save;
  if (!s) return begin();
  game.setState({ run: { ...s, events: [] } });
  ui.setState({ ...initialUi, screen: 'play' });
  if (s.phase === 'night' && s.night) react({ ...s, talk: null }, s, [{ type: 'night-start', n: s.night.n }]);
}

export const toTitle = () => ui.setState({ ...initialUi });

// ---------- the day: lines and choices ----------

export const next = () => commit(Game.next(run()));
export const choose = (i: number) => commit(Game.choose(run(), i));

// ---------- time and walking ----------

export const tick = (dtS: number) => commit(Game.tick(run(), dtS));
export const walk = (fwd: number, side: number, yaw: number, dtS: number) => commit(Game.walk(run(), fwd, side, yaw, dtS));

/** The spot under the eye changed (the runtime calls this only on a change). */
export const aim = (spot: string | null) => ui.setState({ target: spot });

// ---------- touching, photographing, light ----------

/** E: touch what he is looking at, with what is in his hand. A spot with dials opens them. */
export function touch() {
  const { target, held } = ui.getState();
  if (!target) return;
  if (!held && Game.dialsOf(run(), target)) {
    commit(Game.interact(run(), target));
    const d = Game.dialsOf(run(), target);
    if (d && Game.reachable(run(), target)) ui.setState({ dials: { spot: target, faces: Array.from({ length: d.dials }, () => d.faces[0]!) } });
    return;
  }
  commit(Game.interact(run(), target, held ?? undefined));
}

export function photograph() {
  const { target } = ui.getState();
  if (!target || !Game.reachable(run(), target, 2.8)) {
    game.setState({ run: { ...run(), events: [{ type: 'photo', spot: '' }] } });
    ui.setState({ toast: { text: get('remark', 'photo-plain').text.replace('{name}', 'the dark'), at: now(), thought: false } });
    return;
  }
  commit(Game.photograph(run(), target));
}

export const toggleCandle = () => commit(Game.toggleCandle(run()));

// ---------- the casebook ----------

export const openCasebook = (tab?: Tab) => ui.setState({ casebook: true, dials: null, ...(tab ? { tab, entry: 0 } : {}) });
export const closeCasebook = () => ui.setState({ casebook: false, pick: null });
export const showTab = (tab: Tab) => ui.setState({ tab, entry: 0, pick: null });
export const showEntry = (entry: number) => ui.setState({ entry });

/** Put an item in his hand (or empty it); the casebook closes so he can use it. */
export const hold = (item: string | null) => ui.setState({ held: item, casebook: false, pick: null });

/** Pick an item to combine; the second pick puts the two together. */
export function pickToCombine(item: string) {
  const { pick } = ui.getState();
  if (!pick || pick === item) return ui.setState({ pick: pick === item ? null : item });
  ui.setState({ pick: null });
  commit(Game.combine(run(), pick, item));
}

/** Choose an answer to one of the deduction's questions. */
export function answer(q: number, option: string) {
  const a = [...ui.getState().answers];
  a[q] = option;
  ui.setState({ answers: a });
}

/** Lay the answers down together. */
export function confirm() {
  const s = run(), ded = s.night ? nightOf(s.night.n).proves : null;
  if (!ded) return;
  commit(Game.confirm(s, ded, ui.getState().answers.map((x) => x ?? '')));
}

// ---------- dials ----------

export function turnDial(i: number, by: number) {
  const d = ui.getState().dials, info = d && Game.dialsOf(run(), d.spot);
  if (!d || !info) return;
  const faces = [...d.faces], at = info.faces.indexOf(faces[i]!);
  faces[i] = info.faces[(at + by + info.faces.length) % info.faces.length]!;
  ui.setState({ dials: { ...d, faces } });
  game.setState({ run: { ...run(), events: [{ type: 'sound', id: 'dial-rattle' }] } });
}

export function tryDials() {
  const d = ui.getState().dials;
  if (!d) return;
  const next = Game.enterCode(run(), d.spot, d.faces);
  commit(next);
  if (next.events.some((e) => e.type === 'door' && e.open)) ui.setState({ dials: null });
}

export const closeDials = () => ui.setState({ dials: null });

// ---------- cards ----------

/** Dismiss the card; after a night's reveal, the morning comes. */
export function dismissCard() {
  const c = ui.getState().card;
  if (!c) return;
  if (c.kind === 'ending') return ui.setState({ ...initialUi });
  ui.setState({ card: null });
  if (c.kind === 'reveal') commit(Game.afterReveal(run()));
}
