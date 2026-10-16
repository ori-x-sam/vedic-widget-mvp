// Painterly primitives for procedural layers: gouache-like dabs, tapered
// strokes, scumbled texture, soft glows. Every colour passed in comes from
// src/data/palettes.ts (directly or via mix()).
import { withAlpha } from '../lib/colour';
import type { Rng } from '../lib/rng';

export type Ctx = CanvasRenderingContext2D;
export interface Pt { x: number; y: number }

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  // CPU-backed: these are painted once and uploaded as textures, so GPU raster
  // would only add a slow readback (seconds on low-end GPUs).
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return [c, ctx];
}

/**
 * Draw something at x and, if it straddles a seam, again at x ± period so
 * horizontally tiling strips join invisibly.
 */
export function wrapped(period: number, x: number, halfExtent: number, draw: (x: number) => void): void {
  draw(x);
  if (x - halfExtent < 0) draw(x + period);
  if (x + halfExtent > period) draw(x - period);
}

export function polyPath(ctx: Ctx, pts: Pt[], close = true): void {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  if (close) ctx.closePath();
}

/** Smooth closed path through points (Catmull-Rom → Bézier). */
export function smoothPath(ctx: Ctx, pts: Pt[], close = true): void {
  const n = pts.length;
  if (n < 3) return polyPath(ctx, pts, close);
  ctx.beginPath();
  const get = (i: number) => (close ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  ctx.moveTo(pts[0].x, pts[0].y);
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    ctx.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6,
      p2.x, p2.y,
    );
  }
  if (close) ctx.closePath();
}

/** An ellipse outline with a hand-painted wobble. */
export function wobblyEllipse(rng: Rng, cx: number, cy: number, rx: number, ry: number, wobble = 0.06, steps = 18): Pt[] {
  const pts: Pt[] = [];
  const phase = rng.next() * Math.PI * 2;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const k = 1 + Math.sin(a * 3 + phase) * wobble * 0.6 + (rng.next() - 0.5) * wobble;
    pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k });
  }
  return pts;
}

/** A single elliptical dab of paint. */
export function dab(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot: number, colour: string, alpha: number): void {
  ctx.fillStyle = withAlpha(colour, alpha);
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), rot, 0, Math.PI * 2);
  ctx.fill();
}

export interface DabOpts {
  n: number;
  r: [number, number];
  colours: string[];
  alpha: [number, number];
  aspect?: [number, number];
  rot?: number; // base rotation; random if undefined
  rotJitter?: number;
}

/** Scatter dabs inside a rectangle (combine with a clip for shaped fills). */
export function dabField(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, o: DabOpts): void {
  for (let i = 0; i < o.n; i++) {
    const r = rng.range(o.r[0], o.r[1]);
    const asp = o.aspect ? rng.range(o.aspect[0], o.aspect[1]) : rng.range(0.45, 0.9);
    const rot = o.rot !== undefined ? o.rot + rng.range(-1, 1) * (o.rotJitter ?? 0.25) : rng.next() * Math.PI;
    dab(ctx, x + rng.next() * w, y + rng.next() * h, r, r * asp, rot, rng.pick(o.colours), rng.range(o.alpha[0], o.alpha[1]));
  }
}

/** Clip to a path while running `fn`. */
export function clipTo(ctx: Ctx, path: () => void, fn: () => void): void {
  ctx.save();
  path();
  ctx.clip();
  fn();
  ctx.restore();
}

/**
 * A tapered brush stroke along a polyline — thick in the middle, pointed at
 * the ends (or `taper` = [start, end] widths as fractions).
 */
export function taperStroke(ctx: Ctx, pts: Pt[], width: number, colour: string, alpha: number, taper: [number, number] = [0.1, 0.1]): void {
  if (pts.length < 2) return;
  const left: Pt[] = [];
  const right: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const t = i / (n - 1);
    const prof = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ;
    const endW = t < 0.5 ? taper[0] : taper[1];
    const w = (width / 2) * (endW + (1 - endW) * prof);
    left.push({ x: p.x - dy * w, y: p.y + dx * w });
    right.push({ x: p.x + dy * w, y: p.y - dx * w });
  }
  ctx.fillStyle = withAlpha(colour, alpha);
  smoothPath(ctx, [...left, ...right.reverse()], true);
  ctx.fill();
}

/** Quadratic curve sampled into points. */
export function curvePts(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n = 10): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push({ x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 });
  }
  return pts;
}

/** Short directional strokes: dry-brush texture over an area. */
export function scumble(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, n: number, len: [number, number], width: [number, number], angle: number, colours: string[], alpha: [number, number]): void {
  for (let i = 0; i < n; i++) {
    const px = x + rng.next() * w;
    const py = y + rng.next() * h;
    const l = rng.range(len[0], len[1]);
    const a = angle + rng.range(-0.15, 0.15);
    const bend = rng.range(-0.25, 0.25) * l;
    const x1 = px + Math.cos(a) * l, y1 = py + Math.sin(a) * l;
    taperStroke(ctx, curvePts(px, py, (px + x1) / 2 - Math.sin(a) * bend * 0.3, (py + y1) / 2 + Math.cos(a) * bend * 0.3, x1, y1, 6), rng.range(width[0], width[1]), rng.pick(colours), rng.range(alpha[0], alpha[1]), [0.25, 0.15]);
  }
}

/** Radial glow (sun, lamps, record halo). */
export function glow(ctx: Ctx, x: number, y: number, r: number, colour: string, alpha: number, falloff = 1): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(colour, alpha));
  g.addColorStop(Math.min(0.95, 0.35 * falloff), withAlpha(colour, alpha * 0.45));
  g.addColorStop(1, withAlpha(colour, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Soft elliptical contact shadow. */
export function softShadow(ctx: Ctx, x: number, y: number, rx: number, ry: number, colour: string, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  glow(ctx, 0, 0, rx, colour, alpha, 1.6);
  ctx.restore();
}

/** Vertical gradient fill of a rect. stops: [offset, colour, alpha]. */
export function vGradient(ctx: Ctx, x: number, y: number, w: number, h: number, stops: [number, string, number][]): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [o, c, a] of stops) g.addColorStop(o, withAlpha(c, a));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** Linear-gradient fill of the current path. */
export function fillGradient(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string, number][]): void {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c, a] of stops) g.addColorStop(o, withAlpha(c, a));
  ctx.fillStyle = g;
  ctx.fill();
}

/**
 * Faint printed halftone over a region (§4.3 rule 5): dot radius follows
 * `amount(x, y)` in 0..1.
 */
export function halftone(ctx: Ctx, x: number, y: number, w: number, h: number, spacing: number, colour: string, alpha: number, amount: (x: number, y: number) => number): void {
  ctx.fillStyle = withAlpha(colour, alpha);
  const ang = (15 * Math.PI) / 180;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const diag = Math.hypot(w, h);
  ctx.beginPath();
  for (let i = -diag; i < diag; i += spacing) {
    for (let j = -diag; j < diag; j += spacing) {
      const px = x + w / 2 + i * ca - j * sa;
      const py = y + h / 2 + i * sa + j * ca;
      if (px < x || px > x + w || py < y || py > y + h) continue;
      const r = (spacing / 2) * 0.9 * amount(px, py);
      if (r < 0.25) continue;
      ctx.moveTo(px + r, py);
      ctx.arc(px, py, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

/** Paint a shape with an outline rim, base fill, then light/shade dabs. */
export function paintedShape(ctx: Ctx, rng: Rng, path: () => void, bounds: { x: number; y: number; w: number; h: number }, o: {
  base: string; light: string; shade: string; rim?: string; rimW?: number; dabs?: number; dabR?: [number, number]; lightFrom?: 'top' | 'left' | 'right';
}): void {
  if (o.rim) {
    ctx.save();
    path();
    ctx.strokeStyle = withAlpha(o.rim, 0.95);
    ctx.lineWidth = o.rimW ?? 3;
    ctx.stroke();
    ctx.restore();
  }
  path();
  ctx.fillStyle = o.base;
  ctx.fill();
  const { x, y, w, h } = bounds;
  clipTo(ctx, path, () => {
    // broad light → shade
    const dir = o.lightFrom ?? 'top';
    const g = dir === 'top' ? ctx.createLinearGradient(0, y, 0, y + h) : dir === 'left' ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(x + w, 0, x, 0);
    g.addColorStop(0, withAlpha(o.light, 0.55));
    g.addColorStop(0.45, withAlpha(o.light, 0));
    g.addColorStop(0.6, withAlpha(o.shade, 0));
    g.addColorStop(1, withAlpha(o.shade, 0.55));
    ctx.fillStyle = g;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    const n = o.dabs ?? Math.round((w * h) / 90);
    const r = o.dabR ?? [Math.max(1.5, Math.min(w, h) * 0.06), Math.max(3, Math.min(w, h) * 0.16)];
    dabField(ctx, rng, x, y, w, h, { n, r, colours: [o.light, o.base, o.shade], alpha: [0.08, 0.22] });
  });
}
