// Game-wide declarative-UI registrations (the only module that calls defineProp/defineElement), the screenUi factory
// every screen is made with, and binding builders for the shared prefabs so a screen's .ts stays bindings-only.
import { Container, Graphics } from 'pixi.js';
import { color, defineProp, lerpColor } from '../decl/css';
import { token } from '../tokens';
import { createUi, defineElement, use, type Use, type UiNode } from '../decl/engine';
import { layers, view } from '../stage';
import sharedKdl from './shared.kdl?raw';
import sharedCss from './shared.css?raw';

// ---------- properties ----------

/** Multiplies a node's colours: a `meter`'s fill is drawn white and coloured by this. */
defineProp('tint', {
  parse: color, initial: 0xffffff, lerp: lerpColor,
  apply: (n: UiNode, v: number) => { n.el.tint = v; },
});

// ---------- elements ----------

/** A bar's fill: a rect of the box's width * `value` (0..1), coloured by `tint`: `meter value=(bind)"fill"`. */
defineElement('meter', ({ value }, { w, h }) => {
  const c = new Container();
  c.addChild(new Graphics().rect(0, 0, w * Math.min(1, Math.max(0, value as number)), h).fill(0xffffff));
  return c;
});

/** The pocket watch: a gold face with an hour and a minute hand; `minutes` after midnight (may exceed 24 h).
    `watch minutes=(bind)"min"`. Its size is the box. */
defineElement('watch', ({ minutes }, { w, h }) => {
  const c = new Container(), g = new Graphics(), r = Math.min(w, h) / 2, m = Number(minutes) % (12 * 60);
  g.circle(r, r, r).fill(token('--brass')).circle(r, r, r * 0.86).fill(token('--paper'));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.moveTo(r + Math.sin(a) * r * 0.72, r - Math.cos(a) * r * 0.72).lineTo(r + Math.sin(a) * r * 0.82, r - Math.cos(a) * r * 0.82); }
  g.stroke({ color: token('--pencil'), width: 1 });
  const hand = (a: number, len: number, wd: number) => g.moveTo(r, r).lineTo(r + Math.sin(a) * len, r - Math.cos(a) * len).stroke({ color: token('--pencil'), width: wd });
  hand((m / 720) * Math.PI * 2, r * 0.45, 2);
  hand(((m % 60) / 60) * Math.PI * 2, r * 0.7, 1.2);
  g.circle(r, r, 1.5).fill(token('--patta-red'));
  c.addChild(g);
  return c;
});

/** A pattachitra border: a red band between ochre rules, set with small lotus-petal teeth, inside the box.
    `patta-border` fills its box; put content in a sibling panel over it. */
defineElement('patta-border', (_p, { w, h }) => {
  const c = new Container(), g = new Graphics(), band = 9;
  g.rect(0, 0, w, h).fill(token('--patta-red'));
  g.rect(band, band, w - band * 2, h - band * 2).fill(token('--paper'));
  g.rect(2, 2, w - 4, h - 4).stroke({ color: token('--patta-ochre'), width: 1.5 });
  g.rect(band - 2, band - 2, w - band * 2 + 4, h - band * 2 + 4).stroke({ color: token('--patta-ochre'), width: 1.5 });
  const tooth = (x: number, y: number, a: number) => { g.moveTo(x, y).lineTo(x + Math.cos(a - 0.6) * 3.2, y + Math.sin(a - 0.6) * 3.2).lineTo(x + Math.cos(a) * 4.5, y + Math.sin(a) * 4.5).lineTo(x + Math.cos(a + 0.6) * 3.2, y + Math.sin(a + 0.6) * 3.2).closePath(); };
  for (let x = band + 6; x < w - band; x += 10) { tooth(x, 3, Math.PI / 2); tooth(x, h - 3, -Math.PI / 2); }
  for (let y = band + 6; y < h - band; y += 10) { tooth(3, y, 0); tooth(w - 3, y, Math.PI); }
  g.fill(token('--patta-ochre'));
  c.addChild(g);
  return c;
});

/** A round touch button's face: a dark glass disc with a brass ring, filling its box (a `button` around it takes the
    tap). `disc lit=(bind)"on"`: lit is 1 when what it does is on offer (the use button over a spot). */
defineElement('disc', ({ lit }, { w, h }) => {
  const c = new Container(), g = new Graphics(), r = Math.min(w, h) / 2 - 1;
  g.circle(w / 2, h / 2, r).fill({ color: token('--scrim'), alpha: 0.55 });
  g.circle(w / 2, h / 2, r).stroke({ color: token(lit ? '--patta-ochre' : '--dim'), width: lit ? 2 : 1.2, alpha: lit ? 0.95 : 0.6 });
  c.addChild(g);
  return c;
});

/** The walking thumbstick: a ring where the thumb came down and a knob where it is now; at rest (`live` 0) a faint ring
    where the left thumb goes. Fills its box (the whole screen); `x y` are the ring's centre, `dx dy` the knob's
    offset, design px. */
defineElement('stick', ({ x, y, dx, dy, live, r }, { w, h }) => {
  const c = new Container(), g = new Graphics(), R = Number(r) || 52;
  const cx = live ? Number(x) : Math.min(w * 0.16, 130), cy = live ? Number(y) : h - R - 28;
  g.circle(cx, cy, R).fill({ color: token('--scrim'), alpha: live ? 0.35 : 0.18 }).stroke({ color: token('--paper'), width: 1.2, alpha: live ? 0.5 : 0.22 });
  g.circle(cx + (Number(dx) || 0), cy + (Number(dy) || 0), R * 0.42).fill({ color: token('--paper'), alpha: live ? 0.45 : 0.18 });
  c.addChild(g);
  return c;
});

// ---------- the screen factory ----------

const screens: ReturnType<typeof createUi>[] = [];

/**
 * Every screen's Ui: the shared prefabs and styles come first (a screen's own CSS wins ties). Screens draw in creation
 * order: each gets its own layer now, because the engine adds a root to its parent when it first renders, which would
 * otherwise stack a screen by when it last appeared rather than by the order the runtime imports them.
 */
export function screenUi(kdl: string, css: string) {
  const layer = new Container();
  layers.ui.addChild(layer);
  const ui = createUi(layer, sharedKdl + kdl, sharedCss + css, {
    texture: (name) => { throw new Error(`no texture atlas in this game (asked for "${name}"); draw it with a defineElement in screens/shared.ts`); },
    viewport: () => ({ width: view.width, height: view.height, touch: view.touch }),
  });
  screens.push(ui);
  let last = 'null';
  return {
    ...ui,
    reload: (k?: string, c?: string) => ui.reload(k && sharedKdl + k, c && sharedCss + c),
    /** Render when the tree differs from the last one shown (bindings compared as JSON; handlers are assumed stable per data). */
    show(u: Use | null) {
      const k = JSON.stringify(u);
      if (k === last) return;
      last = k;
      ui.render(u);
    },
  };
}

/** Steps every screen's styles and layout; true while any of them is mid-animation. */
export const tickScreens = (dt: number) => screens.reduce((busy, s) => { s.tick(dt); return s.busy() || busy; }, false);

// ---------- binding builders ----------

/** A button: `state` is space-joined classes its CSS matches on (`primary`, `off`). */
export const btn = (label: string, tap: () => void, state = '', key: string = label) => use('btn', { key, label, tap, state });

/** A line in a list (the casebook's index, a choice): `state` classes (`on`, `new`, `off`). */
export const row = (label: string, tap: () => void, state = '', key: string = label) => use('row', { key, label, tap, state });
