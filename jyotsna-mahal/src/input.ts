// Keyboard and mouse: keys become actions; the eye's yaw and pitch are this module's own scratch (they change on every
// mousemove and nothing binds them), read by the 3D view. Look works with the pointer locked (click the view) or by
// dragging with the left button held, which is also how stories turn the head with real events.
//   WASD / arrows  walk          mouse          look            E        touch (with what's in hand)
//   F              photograph    Q              candle          Tab / C  casebook
//   R              empty hand    right button   peer (zoom)     Space / Enter / click   next line; 1-4 choose
//   Esc            close         any key or click on a card dismisses it
// On a phone (any touch): the left thumb walks on a thumbstick that appears where it lands; a thumb anywhere else drags
// the eye round; taps on the screens' buttons (the pad, choices, the casebook) are theirs. A tap moves talk on.
import * as Actions from './actions';
import * as Game from './game';
import { view } from './stage';
import { game, ui } from './store';
import { T } from './tuning';
import { LOOK } from './view/look';
import type { Look } from './view/scene';

export const look: Look = { yaw: 0, pitch: 0, walked: 0, zoom: 0 };
const held = new Set<string>();
let dragging = false, peering = false;
/** Thumbs down on the screen: which is walking (the stick) and which is looking, where each was last. */
type Thumb = { kind: 'stick' | 'look'; ox: number; oy: number; x: number; y: number };
const thumbs = new Map<number, Thumb>();
/** The stick's push, -1..1 each way (right, back). */
let stick = { x: 0, y: 0 };

const D2R = Math.PI / 180;
const PITCH_MAX = 80 * D2R;
/** How fast peering zooms in and out, per second. */
const PEER_RATE = 6;
/** Peering doubles the eye's magnification at most. */
const PEER_MAX = 1;

const roaming = () => { const s = game.getState().run, u = ui.getState(); return u.screen === 'play' && s.phase === 'night' && !s.talk && !u.casebook && !u.dials && !u.card && !u.menu; };
const talking = () => { const s = game.getState().run, u = ui.getState(); return u.screen === 'play' && !!s.talk && !u.card && !u.menu; };

function key(e: KeyboardEvent) {
  const k = e.key.toLowerCase(), u = ui.getState();
  if (k === 'm' && (u.screen === 'play' || u.menu)) { if (u.menu) Actions.closeMenu(); else Actions.openMenu(); return; }
  if (u.menu) { if (k === 'escape') Actions.closeMenu(); return; }
  if (u.screen !== 'play') return;
  if (u.card) { if (!['shift', 'control', 'alt', 'meta', 'tab'].includes(k)) Actions.dismissCard(); e.preventDefault(); return; }
  if (k === 'escape') { if (u.dials) Actions.closeDials(); else if (u.casebook) Actions.closeCasebook(); return; }
  if (k === 'tab' || k === 'c') { e.preventDefault(); if (u.casebook) Actions.closeCasebook(); else if (game.getState().run.phase === 'night' && !game.getState().run.talk) Actions.openCasebook(); return; }
  if (talking()) {
    const n = Number(k);
    if (n >= 1 && n <= 9) { Actions.choose(n - 1); return; }
    if (k === ' ' || k === 'enter') { e.preventDefault(); Actions.next(); }
    return;
  }
  if (!roaming()) return;
  if (k === 'e') Actions.touch();
  if (k === 'f') Actions.photograph();
  if (k === 'q') Actions.toggleCandle();
  if (k === 'r') Actions.hold(null);
}

function turn(dx: number, dy: number) {
  const rate = LOOK.MOUSE_DEG_PX * D2R / (1 + look.zoom);
  look.yaw += dx * rate;
  look.pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, look.pitch - dy * rate));
}

/** A thumb's place in design px, within the canvas. */
function design(canvas: HTMLElement, e: PointerEvent) {
  const r = canvas.getBoundingClientRect();
  return { cx: e.clientX - r.left, cy: e.clientY - r.top, x: (e.clientX - r.left) / view.scale, y: (e.clientY - r.top) / view.scale };
}

/** Start listening; returns the disposer. `canvas` is the top canvas (clicks on it lock the pointer); `onUi(x, y)` says
    whether a point (CSS px in the canvas) is on a screen's button or a screen that swallows taps. */
export function listen(canvas: HTMLElement, onUi: (cx: number, cy: number) => boolean = () => false): () => void {
  const down = (e: KeyboardEvent) => { held.add(e.key.toLowerCase()); key(e); };
  const up = (e: KeyboardEvent) => { held.delete(e.key.toLowerCase()); };
  const tdown = (e: PointerEvent) => {
    Actions.useTouch();
    const p = design(canvas, e), u = ui.getState();
    if (u.screen !== 'play' || u.menu) return;
    // A card swallows taps (it covers everything) and any tap dismisses it; then a thumb on a button (the Menu, a
    // choice) is the button's; a line with no choices moves on from a tap anywhere else.
    if (u.card) { Actions.dismissCard(); return; }
    if (onUi(p.cx, p.cy)) return;
    if (talking() && !Game.choices(game.getState().run).length) { Actions.next(); return; }
    if (!roaming() && !talking()) return;
    const walking = [...thumbs.values()].some((t) => t.kind === 'stick');
    const kind = roaming() && !walking && p.x < view.width * 0.42 ? 'stick' : 'look';
    thumbs.set(e.pointerId, { kind, ox: p.x, oy: p.y, x: p.x, y: p.y });
    if (kind === 'stick') Actions.setStick({ x: p.x, y: p.y, dx: 0, dy: 0 });
  };
  const tmove = (e: PointerEvent) => {
    const t = thumbs.get(e.pointerId);
    if (!t) return;
    const p = design(canvas, e);
    if (t.kind === 'look') {
      if (roaming() || talking()) { const k = T.TOUCH_DEG_PX * D2R / (1 + look.zoom); look.yaw += (p.x - t.x) * k; look.pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, look.pitch - (p.y - t.y) * k)); }
    } else {
      let dx = p.x - t.ox, dy = p.y - t.oy;
      const d = Math.hypot(dx, dy), R = T.STICK_R_PX;
      if (d > R) { dx *= R / d; dy *= R / d; }
      stick = { x: dx / R, y: dy / R };
      Actions.setStick({ x: t.ox, y: t.oy, dx, dy });
    }
    t.x = p.x; t.y = p.y;
  };
  const tup = (e: PointerEvent) => {
    const t = thumbs.get(e.pointerId);
    thumbs.delete(e.pointerId);
    if (t?.kind === 'stick') { stick = { x: 0, y: 0 }; Actions.setStick(null); }
  };
  const pdown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') { tdown(e); return; }
    if (e.button === 2) { peering = true; return; }
    if (e.button !== 0) return;
    const u = ui.getState(), p = design(canvas, e);
    if (u.card) { Actions.dismissCard(); return; }
    if (onUi(p.cx, p.cy)) return; // a button (the Menu, a choice, the pad): the screen's, not the look's
    if (talking() && !Game.choices(game.getState().run).length) { Actions.next(); return; }
    if (roaming() || talking()) { dragging = true; if (roaming() && document.pointerLockElement !== canvas) canvas.requestPointerLock?.()?.catch?.(() => {}); }
  };
  const pup = (e: PointerEvent) => { if (e.pointerType === 'touch') { tup(e); return; } if (e.button === 2) peering = false; if (e.button === 0) dragging = false; };
  const move = (e: PointerEvent | MouseEvent) => {
    if ('pointerType' in e && e.pointerType === 'touch') { tmove(e); return; } if ((document.pointerLockElement === canvas || dragging) && (roaming() || talking())) turn(e.movementX, e.movementY); };
  const menu = (e: Event) => e.preventDefault();
  const blur = () => { held.clear(); dragging = false; peering = false; thumbs.clear(); stick = { x: 0, y: 0 }; if (ui.getState().stick) Actions.setStick(null); };
  // A phone says so before the first touch (the title already reads "tap").
  if (globalThis.matchMedia?.('(pointer: coarse)')?.matches) Actions.useTouch();
  addEventListener('keydown', down); addEventListener('keyup', up); addEventListener('blur', blur);
  canvas.addEventListener('pointerdown', pdown); addEventListener('pointerup', pup); addEventListener('pointercancel', pup); addEventListener('pointermove', move);
  canvas.addEventListener('contextmenu', menu);
  return () => {
    removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('blur', blur);
    canvas.removeEventListener('pointerdown', pdown); removeEventListener('pointerup', pup); removeEventListener('pointercancel', pup); removeEventListener('pointermove', move);
    canvas.removeEventListener('contextmenu', menu);
  };
}

/** One frame: walk from the held keys, peer, and say how far he walked (for the head bob and footsteps). */
export function step(dtS: number): number {
  look.zoom = Math.max(0, Math.min(PEER_MAX, look.zoom + (peering ? 1 : -1) * dtS * PEER_RATE));
  if (!roaming()) return 0;
  const has = (...ks: string[]) => ks.some((k) => held.has(k));
  const push = Math.hypot(stick.x, stick.y) > T.STICK_DEAD ? stick : { x: 0, y: 0 };
  const fwd = (has('w', 'arrowup') ? 1 : 0) - (has('s', 'arrowdown') ? 1 : 0) - push.y;
  const side = (has('d', 'arrowright') ? 1 : 0) - (has('a', 'arrowleft') ? 1 : 0) + push.x;
  if (!fwd && !side) return 0;
  const before = game.getState().run.night!;
  Actions.walk(fwd, side, look.yaw, dtS);
  const after = game.getState().run.night!;
  const d = Math.hypot(after.x - before.x, after.z - before.z);
  look.walked += d;
  return d;
}

/** Stories and a new night: put the eye back to a heading (deg, 0 north). */
export function face(deg: number, pitchDeg = 0) { look.yaw = deg * D2R; look.pitch = pitchDeg * D2R; held.clear(); }
