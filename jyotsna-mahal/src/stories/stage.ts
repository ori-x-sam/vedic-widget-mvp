// Story harness: boots the real game once per page into a persistent #app element, then each story sets core and UI
// state directly (no replay from the title) and drives it with real input: keys held on the window for walking,
// mouse drags on the canvas for turning the head, E/F/Q/Tab, and taps on the Pixi screens. The game clock is held
// and stepped (settle/advance), so every run is the same.
import type { Container } from 'pixi.js';
import { expect } from 'storybook/test';
import { advance, rewind, settle } from '../clock';
import { C, get, nightOf, doorsOf, roomsOf } from '../content';
import * as Game from '../game';
import { doorPlace, roomAt, spotPose, type GameState } from '../game';
import { look, face } from '../input';
import { boot, scene } from '../runtime';
import { layers, pixi, view } from '../stage';
import { game, initialUi, ui, type UiState } from '../store';
import { LOOK } from '../view/look';
import { T } from '../tuning';

export type StoryArgs = { runInteraction: boolean };
export const storyArgs: StoryArgs = { runInteraction: true };
export const storyControls = {
  argTypes: { runInteraction: { control: 'boolean' as const, description: 'Turn off to explore this starting state live (the play function then does nothing).' } },
};

const W = 844, H = 390;
let el: HTMLElement | null = null;
let booted: Promise<unknown> | null = null;

function host() {
  if (!el) {
    el = document.createElement('div');
    el.id = 'app';
    Object.assign(el.style, { width: `${W}px`, height: `${H}px` });
    booted = boot(el);
  }
  return el;
}

export type Setup = () => { run: GameState; ui?: Partial<UiState>; yaw?: number; pitch?: number; save?: GameState };

/** The story's canvas host, with `setup` applied once the game has booted. */
export function stage(setup: Setup, warmMs = 0) {
  const node = host();
  void booted!.then(() => apply(setup, warmMs));
  return node;
}

function apply(setup: Setup, warmMs: number) {
  const s = setup();
  rewind();
  game.setState({ run: { ...s.run, events: [] }, save: s.save ?? null });
  ui.setState({ ...initialUi, screen: 'play', ...s.ui });
  face(s.yaw ?? 0, s.pitch ?? 0);
  if (warmMs) advance(warmMs);
  settle();
}

/** Resolves when the story's state is on screen (call first in every play). */
export async function ready() {
  host();
  await booted;
  await new Promise((r) => setTimeout(r, 0)); // the stage's .then above runs first
}

// ---------- states to start from ----------

/** Night 1 at the bolt, as after a plain Day 1 (first choice every time), Bhima on his round or (`quiet`) away. */
export function night1(o: { quiet?: boolean; flags?: string[]; items?: string[]; clues?: string[]; open?: string[]; at?: [number, number]; candle?: boolean } = {}): GameState {
  let s = Game.newGame();
  while (s.phase === 'day') s = Game.choices(s).length ? Game.choose(s, 0) : Game.next(s);
  const n = s.night!;
  return {
    ...s, events: [],
    flags: [...s.flags, ...(o.flags ?? [])], items: [...s.items, ...(o.items ?? [])], clues: [...s.clues, ...(o.clues ?? [])],
    night: { ...n, x: o.at?.[0] ?? n.x, z: o.at?.[1] ?? n.z, candle: !!o.candle, doors: [...n.doors, ...(o.open ?? [])], watch: o.quiet ? [] : n.watch },
  };
}

// ---------- driver: keys, the mouse, walking ----------

const canvas = () => pixi.canvas;
const at = (x: number, y: number) => { const r = canvas().getBoundingClientRect(); return { clientX: r.left + x * view.scale, clientY: r.top + y * view.scale }; };
function send(type: string, x: number, y: number, extra: PointerEventInit = {}) {
  // Dispatched on the canvas and bubbling: Pixi hears pointerdown there and move/up on document/window.
  canvas().dispatchEvent(new PointerEvent(type, { ...at(x, y), pointerId: 1, pointerType: 'mouse', isPrimary: true, bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, ...extra }));
}

/** A tap at design coordinates, then the clock settles (and renders, so the next hit test sees the new layout). */
export async function tap(x: number, y: number) {
  send('pointerdown', x, y);
  send('pointerup', x, y);
  settle();
}

/** A key pressed and released (held `holdMs` of game time). */
export async function key(k: string, holdMs = 0) {
  dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  if (holdMs) advance(holdMs);
  dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
  settle();
  // Let the page breathe: test timeouts and console output need a macrotask to get through.
  await new Promise((r) => setTimeout(r, 0));
}

/** Turn the head by dragging the mouse across the middle of the view. */
export async function drag(dxPx: number, dyPx: number) {
  const mx = view.width / 2, my = view.height / 2;
  send('pointerdown', mx, my);
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dxPx), Math.abs(dyPx)) / 40));
  for (let i = 0; i < steps; i++) dispatchEvent(new PointerEvent('pointermove', { ...at(mx, my), movementX: dxPx / steps, movementY: dyPx / steps, pointerId: 1, pointerType: 'mouse', buttons: 1, bubbles: true }));
  send('pointerup', mx, my);
  settle();
}

const RATE = (LOOK.MOUSE_DEG_PX * Math.PI) / 180;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const me = () => game.getState().run.night!;

/** Turn (by real drags) to look at a point; `y` is its height. */
export async function lookAt(x: number, z: number, y = LOOK.EYE_HEIGHT_U) {
  const n = me(), yaw = Math.atan2(x - n.x, -(z - n.z));
  const pitch = Math.atan2(y - LOOK.EYE_HEIGHT_U, Math.hypot(x - n.x, z - n.z));
  await drag(wrap(yaw - look.yaw) / RATE, -(pitch - look.pitch) / RATE);
}

/** Walk to a point in a straight line, holding W (re-aiming a few times on the way). */
export async function walkTo(x: number, z: number, near = 0.15) {
  for (let tries = 0; tries < 6; tries++) {
    const n = me(), d = Math.hypot(x - n.x, z - n.z);
    if (d <= near) return;
    await lookAt(x, z);
    await key('w', Math.min(d, 3) / T.WALK_U_S * 1000);
  }
}

/** The way from his room to a room: the doors' middles, stepping through each. */
function route(from: string, to: string): [number, number][] {
  const n = me().n, prev = new Map<string, { room: string; door: string }>(), q = [from], seen = new Set([from]);
  for (let r; (r = q.shift()); ) for (const d of doorsOf(n)) {
    const other = d.from === r ? d.to : d.to === r ? d.from : null;
    if (!other || seen.has(other)) continue;
    seen.add(other); prev.set(other, { room: r, door: d.id }); q.push(other);
  }
  const pts: [number, number][] = [];
  for (let r = to; r !== from; ) {
    const p = prev.get(r);
    if (!p) throw new Error(`no way from ${from} to ${to}`);
    const d = get('door', p.door), dp = doorPlace(d);
    const into = roomsOf(n).find((x) => x.id === r)!, outOf = roomsOf(n).find((x) => x.id === p.room)!;
    const step = (room: typeof into) => (dp.ns ? [dp.x, dp.z + Math.sign(room.z - dp.z) * 0.7] : [dp.x + Math.sign(room.x - dp.x) * 0.7, dp.z]) as [number, number];
    pts.unshift(step(outOf), step(into));
    r = p.room;
  }
  return pts;
}

/** Furniture in a room that a walker has to go round: x, z, radius (with his body). */
function solidsIn(roomId: string) {
  const r = get('room', roomId), s = game.getState().run, out: { x: number; z: number; r: number }[] = [];
  for (const c of r.children) if (c.word === 'prop' && c.solid) out.push({ x: r.x + c.at[0], z: r.z + c.at[1], r: c.solid + T.BODY_U + 0.1 });
  for (const sp of Object.values(C.spot)) if (sp.room === roomId && sp.solid) { const p = spotPose(s, sp); out.push({ x: r.x + p.at[0], z: r.z + p.at[1], r: sp.solid + T.BODY_U + 0.1 }); }
  return out;
}

/** Walk to a point in the same room, stepping round any furniture in the way. */
async function walkRound(x: number, z: number, roomId: string, depth = 0) {
  const n = me();
  if (depth > 6) throw new Error(`walkRound: stuck going to ${x}, ${z}`);
  for (const o of solidsIn(roomId)) {
    // Closest approach of the straight line to the obstacle.
    const dx = x - n.x, dz = z - n.z, len2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((o.x - n.x) * dx + (o.z - n.z) * dz) / len2));
    const cx = n.x + dx * t, cz = n.z + dz * t, d = Math.hypot(o.x - cx, o.z - cz);
    if (d < o.r && t > 0 && t < 1) {
      const len = Math.sqrt(len2), px = -dz / len, pz = dx / len, side = (cx - o.x) * px + (cz - o.z) * pz >= 0 ? 1 : -1;
      const ax = o.x + px * side * (o.r + 0.35), az = o.z + pz * side * (o.r + 0.35);
      await walkTo(ax - (dx / len) * (o.r + 0.3), az - (dz / len) * (o.r + 0.3), 0.25);
      await walkTo(ax + (dx / len) * (o.r + 0.3), az + (dz / len) * (o.r + 0.3), 0.25);
      return walkRound(x, z, roomId, depth + 1);
    }
  }
  await walkTo(x, z, 0.2);
}

/** Walk to stand in reach of a spot and look at it: the free place `standU` from it nearest the room's middle. */
export async function goTo(spotId: string, standU = 0.95) {
  const sp = get('spot', spotId), room = get('room', sp.room), p = spotPose(game.getState().run, sp);
  const sx = room.x + p.at[0], sz = room.z + p.at[1];
  const here = roomAt(me().n, me().x, me().z)!;
  if (here !== sp.room) for (const [x, z] of route(here, sp.room)) { const r = roomAt(me().n, me().x, me().z) ?? here; await walkRound(x, z, r); }
  const s = game.getState().run, toMid = Math.atan2(room.x - sx, room.z - sz);
  const tries = Array.from({ length: 16 }, (_, i) => toMid + ((i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI) / 8);
  const a = tries.find((t) => { const x = sx + Math.sin(t) * standU, z = sz + Math.cos(t) * standU; return Game.standable(s, x, z) && roomAt(s.night!.n, x, z) === sp.room && Game.clear(s, x, z, sx, sz); }) ?? toMid;
  await walkRound(sx + Math.sin(a) * standU, sz + Math.cos(a) * standU, sp.room);
  await lookAt(sx, sz, p.y);
  await expect(ui.getState().target, `looking at ${spotId}`).toBe(spotId);
}

export { nightOf };

// ---------- reading the screens ----------

export const descendants = (n: Container): Container[] => n.children.flatMap((c) => [c, ...descendants(c as Container)]);
/** Visible all the way up (Pixi v8 dropped worldVisible). */
const shown = (n: Container | null): boolean => !n || (n.visible && n.alpha > 0 && shown(n.parent));
const textOf = (n: Container) => (n as Container & { text?: unknown }).text;
export const screenText = () => descendants(layers.ui).filter((n) => shown(n)).map(textOf).filter((t): t is string => typeof t === 'string');

/** Tap the tappable node holding the text `label` (or text starting with it). */
export async function press(label: string) {
  const texts = descendants(layers.ui).filter((n) => shown(n) && typeof textOf(n) === 'string');
  const t = texts.find((n) => textOf(n) === label) ?? texts.find((n) => (textOf(n) as string).startsWith(label));
  await expect(t, `a visible "${label}"`).toBeDefined();
  let n: Container | null = t!;
  while (n && n.eventMode !== 'static') n = n.parent;
  await expect(n, `a tappable ancestor of "${label}"`).toBeTruthy();
  const b = n!.getBounds();
  await tap((b.x + b.width / 2) / view.scale, (b.y + b.height / 2) / view.scale);
}

/** Click (or Space) through lines until a choice is up or the scene ends. */
export async function readOn(max = 60) {
  for (let i = 0; i < max && game.getState().run.talk && !Game.choices(game.getState().run).length; i++) {
    if (ui.getState().card) await key(' ');
    await key(' ');
  }
}

/** The run, now. */
export const run = () => game.getState().run;

export { advance, settle, game, ui, scene };
