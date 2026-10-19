// Game-wide declarative-UI registrations (the only module that calls defineProp/defineElement), the screenUi factory
// every screen is made with, and binding builders for the shared prefabs so a screen's .ts stays bindings-only.
import { Container, Graphics, type Text, type TextStyleFontWeight } from 'pixi.js';
import { color, defineProp, lerpColor } from '../decl/css';
import { token } from '../tokens';
import { createUi, defineElement, use, type Use, type UiNode } from '../decl/engine';
import { layers, view } from '../stage';
import { CARDS, CLASSES, EMOTES, KATHA, KSHETRAS, TEAMS, TOKENS_ON_FIELD } from '../content';
import type { Ability } from '../units';
import type { Effect } from '../effects';
import sharedKdl from './shared.kdl?raw';
import sharedCss from './shared.css?raw';

// ---------- properties ----------

/** Multiplies a node's colours: a `meter`'s fill is drawn white and coloured by this. */
defineProp('tint', {
  parse: color, initial: 0xffffff, lerp: lerpColor,
  apply: (n: UiNode, v: number) => { n.el.tint = v; },
});

/** Text weight, as CSS (`400`, `800`, `900`): Inter Tight 900 for headlines. Applied to the text's own style, so the next layout measures it. */
defineProp('font-weight', {
  parse: (raw: string) => raw, initial: '400', inherit: true,
  apply: (n: UiNode, v: string) => { if (n.type === 'text' && (n.el as Text).style.fontWeight !== v) (n.el as Text).style.fontWeight = v as TextStyleFontWeight; },
});

// ---------- elements ----------
// Painted bits the shell draws itself. Hues come from the palette by token name (content says which: a class's
// `paint`, a god's `skin`); sizes from the laid-out box, so CSS sizes them. These are the procedural placeholders the
// painted art (ASSETS.md) replaces in the look pass.

/** A bar's fill: a rect of the box's width * `value` (0..1), coloured by `tint`: `meter value=(bind)"fill"`. */
defineElement('meter', ({ value }, { w, h }) => {
  const c = new Container();
  c.addChild(new Graphics().rect(0, 0, w * Math.min(1, Math.max(0, value as number)), h).fill(0xffffff));
  return c;
});

/** An element's drawing, in the Container the engine expects. */
const wrap = (g: Graphics) => { const c = new Container(); c.addChild(g); return c; };

/** Vertical bands from `top` to `bottom`: a soft gouache-like gradient (Pixi gradients band anyway at these sizes). */
function bands(g: Graphics, x: number, y: number, w: number, h: number, top: number, bottom: number, n = 18) {
  for (let i = 0; i < n; i++) g.rect(x, y + (h * i) / n, w, h / n + 0.5).fill(lerpColor(top, bottom, i / (n - 1)));
  return g;
}

/** A diya: a laterite lamp and a haldi flame with a marigold heart. `fill` 0..1 grows the flame; 0 is unlit. */
defineElement('diya', ({ fill }, { w, h }) => {
  const f = Math.min(1, Math.max(0, Number(fill))), g = new Graphics();
  const cx = w / 2, base = h * 0.78;
  if (f > 0) {
    const fh = h * 0.5 * (0.35 + 0.65 * f), fw = w * 0.16 * (0.5 + 0.5 * f);
    g.moveTo(cx, base - h * 0.16 - fh).bezierCurveTo(cx + fw * 1.6, base - h * 0.2 - fh * 0.35, cx + fw, base - h * 0.14, cx, base - h * 0.14)
      .bezierCurveTo(cx - fw, base - h * 0.14, cx - fw * 1.6, base - h * 0.2 - fh * 0.35, cx, base - h * 0.16 - fh).fill({ color: token('--haldi'), alpha: f < 1 ? 0.75 : 1 });
    g.ellipse(cx, base - h * 0.2, fw * 0.45, fh * 0.28).fill(token('--marigold'));
  }
  const bowl = f > 0 ? token('--laterite') : lerpColor(token('--laterite'), token('--frame'), 0.45); // unlit: the lamp sinks into the page
  g.moveTo(w * 0.08, base - h * 0.12).quadraticCurveTo(cx, base + h * 0.26, w * 0.92, base - h * 0.12).closePath().fill(bowl);
  g.ellipse(cx, base - h * 0.12, w * 0.42, h * 0.04).fill(lerpColor(bowl, token('--frame-edge'), 0.35));
  return wrap(g);
});

/** A class sigil in its class colour: shield, sword, bow, flame or lotus. */
defineElement('sigil', ({ kind, paint }, { w, h }) => {
  const g = new Graphics(), c = token(String(paint)), ink = token('--frame-edge'), s = Math.min(w, h), cx = w / 2, cy = h / 2;
  g.circle(cx, cy, s / 2).fill(ink).circle(cx, cy, s / 2 - 1.5).stroke({ width: 1.2, color: c });
  const r = s * 0.3;
  if (kind === 'shield') g.circle(cx, cy, r).fill(c).circle(cx, cy, r * 0.35).fill(ink);
  else if (kind === 'sword') g.moveTo(cx, cy - r * 1.2).lineTo(cx + r * 0.25, cy + r * 0.4).lineTo(cx - r * 0.25, cy + r * 0.4).closePath().fill(c).rect(cx - r * 0.6, cy + r * 0.4, r * 1.2, r * 0.22).fill(c).rect(cx - r * 0.12, cy + r * 0.6, r * 0.24, r * 0.5).fill(c);
  else if (kind === 'bow') g.arc(cx + r * 0.5, cy, r * 1.15, Math.PI * 0.62, Math.PI * 1.38).stroke({ width: s * 0.09, color: c }).moveTo(cx - r * 0.38, cy - r * 1.05).lineTo(cx - r * 0.38, cy + r * 1.05).stroke({ width: 1, color: c });
  else if (kind === 'flame') g.moveTo(cx, cy - r * 1.3).bezierCurveTo(cx + r * 1.3, cy - r * 0.1, cx + r * 0.8, cy + r, cx, cy + r).bezierCurveTo(cx - r * 0.8, cy + r, cx - r * 1.3, cy - r * 0.1, cx, cy - r * 1.3).fill(c);
  else if (kind === 'lotus') {
    for (let i = -2; i <= 2; i++) {
      const a = (i * Math.PI) / 7, px = cx + Math.sin(a) * r * 0.6, py = cy + r * 0.3 - Math.cos(a) * r * 0.6;
      g.ellipse(px, py, r * 0.26, r * 0.55).fill(c);
    }
    g.rect(cx - r * 0.9, cy + r * 0.55, r * 1.8, r * 0.18).fill(c);
  }
  return wrap(g);
});

/**
 * A card's painted face (placeholder): a textbook sky banded from sky-cream into the class colour, a haldi halo, the
 * god as a simple heroic silhouette in its traditional skin colour breaking over the top edge, laterite ground, and a
 * Pattachitra-style border of cream dots in the class colour; the Trimurti get a Tanjore gold-leaf border with gems.
 */
defineElement('card-art', ({ paint, skin, trimurti }, { w, h }) => {
  const g = new Graphics(), c = token(String(paint)), sk = token(String(skin)), b = Math.max(3, w * 0.03);
  bands(g, 0, 0, w, h, token('--sky-cream'), lerpColor(token('--sky-cream'), c, 0.75));
  g.rect(0, h * 0.68, w, h * 0.32).fill(lerpColor(token('--laterite'), c, 0.25));
  const cx = w / 2, head = w * 0.11;
  g.circle(cx, h * 0.27, w * 0.27).fill({ color: token('--haldi'), alpha: 0.55 }).circle(cx, h * 0.27, w * 0.2).fill({ color: token('--limewhite'), alpha: 0.35 });
  // the figure: shoulders and chest, a dhoti, arms raised in a low-angle hero pose; the head breaks the top edge
  g.moveTo(cx - w * 0.2, h * 0.36).lineTo(cx + w * 0.2, h * 0.36).lineTo(cx + w * 0.13, h * 0.56).lineTo(cx - w * 0.13, h * 0.56).closePath().fill(sk);
  g.moveTo(cx - w * 0.15, h * 0.55).lineTo(cx + w * 0.15, h * 0.55).lineTo(cx + w * 0.22, h * 0.74).lineTo(cx - w * 0.22, h * 0.74).closePath().fill(token('--limewhite'));
  g.rect(cx - w * 0.15, h * 0.54, w * 0.3, h * 0.025).fill(token('--marigold'));
  g.moveTo(cx - w * 0.19, h * 0.37).lineTo(cx - w * 0.33, h * 0.14).lineTo(cx - w * 0.28, h * 0.12).lineTo(cx - w * 0.14, h * 0.36).closePath().fill(sk);
  g.moveTo(cx + w * 0.19, h * 0.37).lineTo(cx + w * 0.36, h * 0.46).lineTo(cx + w * 0.34, h * 0.5).lineTo(cx + w * 0.15, h * 0.42).closePath().fill(sk);
  g.circle(cx, h * 0.29, head).fill(sk).circle(cx, h * 0.29 - head * 0.9, head * 0.55).fill(token('--haldi')); // crown
  // the border: class colour, an inner cream line with Pattachitra dots; gold leaf and gems for the Trimurti
  const edge = trimurti ? token('--gold-leaf') : c;
  g.rect(0, 0, w, h).stroke({ width: b * 2, color: edge, alignment: 1 });
  g.rect(b * 1.6, b * 1.6, w - b * 3.2, h - b * 3.2).stroke({ width: 1, color: token('--cream') });
  const step = Math.max(6, w / 16);
  for (let x = b * 3; x < w - b * 2; x += step) g.circle(x, b, b * 0.32).circle(x, h - b, b * 0.32).fill(token('--cream'));
  for (let y = b * 3; y < h - b * 2; y += step) g.circle(b, y, b * 0.32).circle(w - b, y, b * 0.32).fill(token('--cream'));
  if (trimurti) for (const [x, y] of [[b, b], [w - b, b], [b, h - b], [w - b, h - b]] as const) g.circle(x, y, b * 0.9).fill(token('--sindoor')).circle(x, y, b * 0.45).fill(token('--peacock'));
  return wrap(g);
});

/** A team emblem: the Sun's disc (haldi with a sindoor ring and rays) or the Moon's crescent (limewhite on neel). */
defineElement('emblem', ({ kind, paint, trim }, { w, h }) => {
  const g = new Graphics(), r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2, p = token(String(paint)), t = token(String(trim));
  if (kind === 'disc') {
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.moveTo(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62).lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r).stroke({ width: 1.2, color: p }); }
    g.circle(cx, cy, r * 0.58).fill(t).circle(cx, cy, r * 0.58).stroke({ width: 1, color: p });
  } else g.circle(cx, cy, r).fill(p).circle(cx, cy, r * 0.7).fill(t).circle(cx + r * 0.3, cy - r * 0.18, r * 0.62).fill(p);
  return wrap(g);
});

/** A Dhvaja in the score: a bamboo staff and a Pipili-style pennant in the team's colours; lowered, it folds at the foot. */
defineElement('flag', ({ paint, trim, lowered }, { w, h }) => {
  const g = new Graphics(), p = token(String(paint)), t = token(String(trim));
  g.rect(1, 0, 1.4, h).fill(token('--khondalite'));
  if (lowered) g.rect(2.4, h * 0.72, w - 3, h * 0.2).fill(lerpColor(p, token('--frame'), 0.4));
  else g.moveTo(2.4, 0).lineTo(w, h * 0.22).lineTo(2.4, h * 0.46).closePath().fill(p).moveTo(2.4, h * 0.14).lineTo(w * 0.62, h * 0.23).lineTo(2.4, h * 0.32).closePath().fill(t);
  return wrap(g);
});

/** The long die (pasaka), seen from the side: a limewhite bar with `face` pips (4..1) in frame colour. */
defineElement('long-die', ({ face }, { w, h }) => {
  const g = new Graphics(), n = Math.max(1, Math.min(4, Number(face) || 1));
  g.rect(0, 0, w, h).fill(token('--limewhite')).rect(0, 0, w, h).stroke({ width: 1, color: token('--khondalite'), alignment: 1 });
  g.rect(0, h * 0.8, w, h * 0.2).fill(token('--sky-cream'));
  for (let i = 0; i < n; i++) g.circle(w * ((i + 1) / (n + 1)), h * 0.45, h * 0.17).fill(token('--frame'));
  return wrap(g);
});

/** A Pattachitra-style label border: a hingula (sindoor) frame with a row of haldi dots and conch-white corners. */
defineElement('patta-border', (_, { w, h }) => {
  const g = new Graphics(), s = token('--sindoor');
  g.rect(0, 0, w, h).stroke({ width: 2, color: s, alignment: 1 }).rect(3, 3, w - 6, h - 6).stroke({ width: 0.8, color: s, alignment: 1 });
  for (let x = 8; x < w - 4; x += 7) g.circle(x, 1.5, 0.9).circle(x, h - 1.5, 0.9).fill(token('--haldi'));
  for (const [x, y] of [[2, 2], [w - 2, 2], [2, h - 2], [w - 2, h - 2]] as const) g.circle(x, y, 2.2).fill(token('--limewhite')).circle(x, y, 2.2).stroke({ width: 0.6, color: s });
  return wrap(g);
});

/** The teacher's red tick, once a page is unlocked (`on`); nothing until then. */
defineElement('tick', ({ on }, { w, h }) => {
  const g = new Graphics();
  if (on) g.moveTo(w * 0.12, h * 0.55).lineTo(w * 0.4, h * 0.82).lineTo(w * 0.9, h * 0.18).stroke({ width: Math.max(2, w * 0.13), color: token('--sindoor'), cap: 'round', join: 'round' });
  return wrap(g);
});

/** A dotted fill-in line, in frame colour. */
defineElement('dots', (_, { w, h }) => {
  const g = new Graphics();
  for (let x = 1; x < w; x += 5) g.circle(x, h / 2, 0.9).fill(token('--frame'));
  return wrap(g);
});

// ---------- fonts ----------

/** The faces the palette's font tokens name (Google Fonts, linked in index.html and the Storybook head). */
const FACES = ['900 40px "Inter Tight"', '800 16px "Inter Tight"', '700 16px "Inter Tight"', '400 16px "Baloo 2"', '600 16px "Baloo 2"', '400 16px "Baloo Thambi 2"'];
/** How long boot waits for the fonts before drawing with the fallbacks (offline, a blocked font host). */
const FONT_WAIT_MS = 2500;

/** Wait for the fonts, or FONT_WAIT_MS, whichever is first: Pixi measures text once, with whatever face is loaded. */
export async function loadFonts() {
  const all = Promise.all(FACES.map((f) => document.fonts.load(f, 'Aaका').catch(() => []))); // the sample includes Devanagari so its subset loads
  await Promise.race([all, new Promise((r) => setTimeout(r, FONT_WAIT_MS))]);
}

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
export const btn = (label: string, tap: () => void, state = '') => use('btn', { key: label, label, tap, state });

/** Lane numerals for signboards: KSHETRA II. */
const ROMAN = ['I', 'II', 'III'];
/** A page number in Devanagari numerals (०–९). */
export const devaNumber = (n: number) => String(n).replace(/\d/g, (d) => '०१२३४५६७८९'[+d]!);

/**
 * The header: label (peach), yuga line (gold), headline (cream, two lines at most); `score` and `die` are the banner
 * score's and the long die's Uses (or none). The headline's text is its key, so a new headline plays title-card-in.
 */
export const titleCard = (label: string, line: string, headline: string, { score = [], die = [] }: { score?: Use[]; die?: Use[] } = {}) =>
  use('title-card', { label, line, headline, headlineKey: headline }, { score, die });

/** Lane `lane` (1..3)'s signboard: its Kshetra, or veiled (null) until its yuga. */
export function signboard(lane: number, kshetra: string | null) {
  const k = kshetra ? KSHETRAS[kshetra] : undefined;
  if (kshetra && !k) throw new Error(`signboard: no Kshetra "${kshetra}"`);
  const kicker = `KSHETRA ${ROMAN[lane - 1]}${k ? '' : ' · ?'}`;
  return use('signboard', { key: `lane-${lane}`, state: k ? '' : 'veiled', kicker, title: k?.name.toUpperCase(), rule: k?.rule });
}

/** What a word does, in a card's own words (the detail view). */
function said(a: Ability): string {
  const e = (x: Effect): string => {
    switch (x.do) {
      case 'damage': return `${x.amount} damage to ${x.targets ? `the ${x.targets} ${x.pick === 'highest-hp' ? 'strongest' : 'nearest'} enemies` : x.unitsOnly ? 'every enemy god' : 'every enemy'}${x.widthTiles ? ` across ${x.widthTiles} tiles` : ' in the lane'}${x.unitsOnly ? ', never a banner' : ''}`;
      case 'heal': return `allies regain ${x.perS} HP a second${x.dhvajaPerS ? `, your banner ${x.dhvajaPerS}` : ''}, for ${x.seconds} s`;
      case 'stun': return `enemies${x.radiusTiles ? ` within ${x.radiusTiles} tiles` : ' it hits'} are held ${x.seconds} s`;
      case 'knockback': return `pushes them back ${x.tiles} tiles`;
      case 'pull': return `pulls the farthest enemy within ${x.rangeTiles} tiles ${x.tiles} closer and holds it ${x.rootS} s`;
      case 'haste': return `allies move and strike ${Math.round(x.factor * 100)}% faster for ${x.seconds} s`;
      case 'prana': return `+${x.amount} Prana`;
      case 'create': return `creates a ${TOKENS_ON_FIELD[x.token]?.name ?? x.token}`;
      case 'discount-next': return `your next card costs ${x.amount} less`;
      case 'seconds': return `lasts ${x.seconds} s`;
    }
  };
  switch (a.hook) {
    case 'taunt': return `enemies within ${a.radiusTiles} tiles must target it`;
    case 'place': return a.how === 'leap' ? 'may land anywhere in its lane, even past the midline, but not by a banner' : 'bursts from your banner in its lane';
    case 'first-strike': return `its first strike deals ×${a.mult}${a.reachTiles ? ` from ${a.reachTiles} tiles` : ''}${a.unitsOnly ? ' to a god' : ''}`;
    case 'shield-at': return `at ${Math.round(a.hpFrac * 100)}% HP it gains a ${a.amount} shield, once`;
    case 'meditate': return `sits still ${a.seconds} s, taking ${Math.round(a.guard * 100)}% less damage, then:`;
    case 'pacifist': return 'never strikes';
    case 'reveal-next': return "you see the opponent's next card";
    case 'effect': return e(a.effect);
    case 'every': return `every ${a.everyS} s: ${a.abilities.map(said).join('; ')}`;
    case 'with': return `with ${CARDS[a.match]?.name ?? a.match} in the lane: ${a.abilities.map(said).join('; ')}`;
    case 'dmg-out': case 'dmg-in': case 'strike-rate': case 'speed':
      return { 'dmg-out': 'deals more damage', 'dmg-in': 'takes less damage', 'strike-rate': 'strikes at a different pace', speed: 'moves at a different pace' }[a.hook] + (a.scope === 'self' ? '' : ` (${a.scope.replace('-', ' ')})`);
    default: return '';
  }
}

/** A card's rule lines: AVAHANA, NITYA (CAST for an Astra) and VISARJANA; stats are not rules. */
export function cardRules(id: string): { when: string; text: string }[] {
  const card = CARDS[id]!, out: { when: string; text: string }[] = [];
  const line = (when: string, as: Ability[]) => { const t = as.filter((a) => a.hook !== 'stats').map(said).filter(Boolean); if (t.length) out.push({ when, text: t.join('; ').replaceAll(':; ', ': ') }); };
  for (const a of card.abilities) if (a.hook === 'avahana') line('AVAHANA', a.abilities);
  line(card.class === 'astra' ? 'CAST' : 'NITYA', card.abilities.filter((a) => a.hook !== 'avahana' && a.hook !== 'visarjana'));
  for (const a of card.abilities) if (a.hook === 'visarjana') line('VISARJANA', a.abilities);
  return out;
}

/** A god card at `size` (hand, next: the one after the hand, face, detail). `cost` overrides the printed cost (a Kshetra's discount). */
export function card(id: string, size: 'hand' | 'next' | 'face' | 'detail', cost?: number) {
  const c = CARDS[id];
  if (!c) throw new Error(`card: no card "${id}"`);
  const cls = CLASSES[c.class]!, trimurti = c.tags.includes('trimurti'), now = cost ?? c.cost;
  const variant = [size, trimurti && 'trimurti', now < c.cost && 'discounted'].filter(Boolean).join(' ');
  const rules = size === 'detail' ? cardRules(id).map((r) => use('card-rule', { key: r.when, ...r })) : [];
  return use('card', { key: `${id}-${size}`, variant, god: id, paint: cls.paint, skin: c.skin, trimurti, sigil: cls.sigil, cost: String(now), name: c.name, deva: c.deva, title: c.title.toUpperCase() }, { rules });
}

/** The Prana row: `prana` (fractional: the next diya's flame grows) of `max`. */
export const pranaDiyas = (prana: number, max: number) => use('prana-diyas', { count: `${Math.floor(prana)} / ${max}` }, {
  diyas: Array.from({ length: max }, (_, i) => use('prana-diya', { key: i, fill: Math.max(0, Math.min(1, prana - i)) })),
});

/** The banner score: how many of each side's three Dhvajas are lowered. */
export function bannerScore(sunLowered: number, moonLowered: number) {
  const side = (id: 'sun' | 'moon', lowered: number) => {
    const t = TEAMS[id]!;
    return [use('banner-score-emblem', { key: `${id}-emblem`, kind: t.emblem, paint: t.paint, trim: t.trim }),
      ...[0, 1, 2].map((i) => use('banner-score-flag', { key: `${id}-${i}`, state: i < lowered ? 'lowered' : '', paint: t.paint, trim: t.trim, lowered: i < lowered }))];
  };
  return use('banner-score', {}, { sun: side('sun', sunLowered), moon: side('moon', moonLowered) });
}

/** The long die showing `face` (4 Satya ... 1 Kali); tap pauses. */
export const longDie = (face: number, tap: () => void) => use('long-die', { face, faceKey: `face-${face}`, tap });

/** A Deva Katha page. */
export function kathaPage(id: string, unlocked: boolean) {
  const k = KATHA[id];
  if (!k) throw new Error(`kathaPage: no page "${id}"`);
  const god = CARDS[k.god]!;
  return use('katha-page', {
    kicker: `KATHA ${String(k.page).padStart(2, '0')}`, unlocked, name: god.name, deva: god.regional ? `${god.deva} · ${god.regional}` : god.deva,
    label: k.label.toUpperCase(), text: k.text, know: k.know, fill: k.fill, source: `SOURCE · ${k.source.toUpperCase()}${k.verified ? '' : ' · (VERIFY)'}`, pageN: devaNumber(k.page),
  });
}

/** What the Leela Report shows. */
export type Report = { kicker: string; rows: [string, string][]; remark: string; stamp: 'vijaya' | 'punah' | 'sama'; assisted: boolean };
const STAMPS = { vijaya: ['VIJAYA', 'विजय'], punah: ['PUNAH', 'पुनः'], sama: ['SAMA', 'सम'] } as const;
export const reportCard = (r: Report) => use('report-card', {
  kicker: r.kicker, remark: r.remark, stamp: r.stamp, stampText: STAMPS[r.stamp][0], stampDeva: STAMPS[r.stamp][1], assisted: r.assisted ? 'ASSISTED' : undefined,
}, { rows: r.rows.map(([label, value]) => use('report-row', { key: label, label, value })) });

/** One of the four blessings. */
export function emote(id: string) {
  const e = EMOTES[id];
  if (!e) throw new Error(`emote: no blessing "${id}" (there are only ${Object.keys(EMOTES).join(', ')})`);
  return use('emote', { key: id, text: e.text });
}
