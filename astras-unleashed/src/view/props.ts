// Scenery painters for the arena: trees, palms, pines, boulders, flowers, pools, snow, flags, lotuses, clouds. Each
// draws at a ground point (x, y = where it touches the ground) at a scale `s` (1 = a prop at the near edge), in the
// bright textbook palette with soft gouache-like shading: a shadow, a body, a lit side. Hues come from palette tokens.
import { Graphics } from 'pixi.js';
import { lerpColor } from '../decl/css';
import { token } from '../tokens';

const T = (name: string) => token(name);
const shade = (c: number, k = 0.3) => lerpColor(c, T('--hud-edge'), k);
const light = (c: number, k = 0.35) => lerpColor(c, T('--limewhite'), k);
const shadow = (g: Graphics, x: number, y: number, w: number, h: number) => g.ellipse(x, y, w, h).fill({ color: T('--grass-shade'), alpha: 0.55 });

export type Prop = (g: Graphics, x: number, y: number, s: number, c?: number) => void;

/** A round, leafy tree like the ones along Kalinga Rush's shores: overlapping clumps, lit from the top-left. */
export const tree: Prop = (g, x, y, s, c = T('--tota')) => {
  shadow(g, x + 3 * s, y, 16 * s, 5 * s);
  g.rect(x - 2.5 * s, y - 16 * s, 5 * s, 16 * s).fill(T('--wood'));
  const clumps: [number, number, number][] = [[-9, -22, 9], [9, -22, 9], [0, -30, 11], [-4, -18, 8], [6, -16, 7]];
  for (const [dx, dy, r] of clumps) g.circle(x + dx * s, y + dy * s, r * s).fill(shade(c, 0.25));
  for (const [dx, dy, r] of clumps) g.circle(x + (dx - 1.5) * s, y + (dy - 1.5) * s, r * 0.8 * s).fill(c);
  for (const [dx, dy, r] of clumps.slice(0, 3)) g.circle(x + (dx - 3) * s, y + (dy - 3.5) * s, r * 0.4 * s).fill(light(c, 0.3));
};

/** A coconut palm: a leaning trunk and drooping fronds. */
export const palm: Prop = (g, x, y, s, c = T('--tota')) => {
  shadow(g, x + 6 * s, y, 12 * s, 4 * s);
  g.moveTo(x - 2 * s, y).quadraticCurveTo(x + 2 * s, y - 20 * s, x + 6 * s, y - 38 * s).lineTo(x + 9 * s, y - 37 * s).quadraticCurveTo(x + 5 * s, y - 20 * s, x + 2 * s, y).fill(T('--wood'));
  const tx = x + 7.5 * s, ty = y - 38 * s;
  for (const a of [-2.6, -2.0, -1.2, -0.5, 0.2]) {
    const ex = tx + Math.cos(a) * 18 * s, ey = ty + Math.sin(a) * 8 * s + 9 * s;
    g.moveTo(tx, ty).quadraticCurveTo(tx + Math.cos(a) * 12 * s, ty + Math.sin(a) * 12 * s - 4 * s, ex, ey).stroke({ width: 4 * s, color: c, cap: 'round' });
  }
  g.circle(tx, ty + 2 * s, 3 * s).fill(T('--wood'));
};

/** A deodar pine, its tiers dusted with snow when `snowy`. */
export const pine = (g: Graphics, x: number, y: number, s: number, snowy = false) => {
  const c = lerpColor(T('--tota'), T('--peacock'), 0.45);
  shadow(g, x + 3 * s, y, 10 * s, 3.5 * s);
  g.rect(x - 2 * s, y - 8 * s, 4 * s, 8 * s).fill(T('--wood'));
  for (let i = 0; i < 3; i++) {
    const by = y - 6 * s - i * 9 * s, w = (13 - i * 3) * s;
    g.moveTo(x - w, by).lineTo(x, by - 14 * s).lineTo(x + w, by).fill(shade(c, 0.15));
    g.moveTo(x - w * 0.8, by - 1 * s).lineTo(x, by - 14 * s).lineTo(x + w * 0.1, by - 1 * s).fill(c);
    if (snowy) g.moveTo(x - w * 0.45, by - 7 * s).lineTo(x, by - 14 * s).lineTo(x + w * 0.45, by - 7 * s).fill(T('--limewhite'));
  }
};

/** A rounded boulder. */
export const boulder: Prop = (g, x, y, s, c = T('--khondalite')) => {
  shadow(g, x + 2 * s, y, 11 * s, 3.5 * s);
  g.ellipse(x, y - 6 * s, 10 * s, 8 * s).fill(shade(c, 0.15));
  g.ellipse(x - 2 * s, y - 8 * s, 7 * s, 5.5 * s).fill(c);
  g.ellipse(x - 4 * s, y - 10 * s, 3 * s, 2 * s).fill(light(c, 0.35));
};

/** A flowering bush: green with bright blooms. */
export const flowerBush: Prop = (g, x, y, s, c = T('--rani')) => {
  shadow(g, x, y, 9 * s, 3 * s);
  for (const [dx, dy, r] of [[-5, -5, 6], [5, -5, 6], [0, -9, 6.5]] as const) g.circle(x + dx * s, y + dy * s, r * s).fill(T('--grass-shade'));
  for (const [dx, dy] of [[-6, -7], [4, -10], [6, -4], [-1, -4], [0, -12]] as const) g.circle(x + dx * s, y + dy * s, 2 * s).fill(c).circle(x + dx * s, y + dy * s, 0.8 * s).fill(T('--haldi'));
};

/** A small pool of water (or milk, for Ksheer Sagar). */
export const pool: Prop = (g, x, y, s, c = T('--river')) => {
  g.ellipse(x, y, 14 * s, 5 * s).fill(shade(c, 0.2)).ellipse(x - 1 * s, y - 0.5 * s, 12 * s, 4 * s).fill(c);
  g.ellipse(x - 4 * s, y - 1.5 * s, 4 * s, 1 * s).fill(light(c, 0.6));
};

/** A drift of snow on the ground. */
export const snow: Prop = (g, x, y, s) => {
  g.ellipse(x, y - 1 * s, 13 * s, 4.5 * s).fill(lerpColor(T('--limewhite'), T('--sky'), 0.25)).ellipse(x - 2 * s, y - 2 * s, 10 * s, 3 * s).fill(T('--limewhite'));
};

/** A war-banner on a pole (Kurukshetra's distant chariots' flags), never a body. */
export const flag: Prop = (g, x, y, s, c = T('--sindoor')) => {
  g.rect(x - 0.8 * s, y - 24 * s, 1.6 * s, 24 * s).fill(T('--wood'));
  g.moveTo(x + 0.8 * s, y - 24 * s).lineTo(x + 12 * s, y - 20 * s).lineTo(x + 0.8 * s, y - 15 * s).fill(c);
};

/** A lotus on its pad. */
export const lotusFlower: Prop = (g, x, y, s, c = T('--rani')) => {
  g.ellipse(x, y, 9 * s, 3 * s).fill(T('--grass-shade'));
  for (let i = -2; i <= 2; i++) g.ellipse(x + i * 2.4 * s, y - 3 * s - (2 - Math.abs(i)) * 1.2 * s, 1.8 * s, 4 * s).fill(i % 2 ? light(c, 0.3) : c);
};

/** A golden paving tile (Swarna Lanka) or terrace block (Meru). */
export const goldTile: Prop = (g, x, y, s, c = T('--haldi')) => {
  g.moveTo(x - 9 * s, y).lineTo(x, y - 4 * s).lineTo(x + 9 * s, y).lineTo(x, y + 4 * s).closePath().fill(c);
  g.moveTo(x - 9 * s, y).lineTo(x, y + 4 * s).lineTo(x, y + 6 * s).lineTo(x - 9 * s, y + 2 * s).closePath().fill(shade(c, 0.25));
};

/** A soft textbook cloud. */
export const cloud: Prop = (g, x, y, s) => {
  for (const [dx, dy, r] of [[-12, 0, 8], [0, -5, 11], [13, 0, 8], [4, 2, 9]] as const) g.circle(x + dx * s, y + dy * s, r * s).fill(T('--limewhite'));
  g.rect(x - 18 * s, y, 36 * s, 6 * s).fill(T('--limewhite'));
};

/** A glowing lamp-dot (Patala's naga lamps, Dandakaranya's fireflies). */
export const glow: Prop = (g, x, y, s, c = T('--haldi')) => {
  g.circle(x, y, 4 * s).fill({ color: c, alpha: 0.3 }).circle(x, y, 1.6 * s).fill(c);
};
