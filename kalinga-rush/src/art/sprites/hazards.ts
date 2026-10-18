// Hazard sprites for every era (records.ts → hazards), the non-leaf record
// visuals (mridanga, oar) and the friendly characters you hop for a bonus.
//
// Every hazard is painted into its own canvas at HZ_SCALE×, then given a
// dark outline (§4.3 rule 7) by stamping a tinted silhouette under it, so the
// rim is consistent across ~100 painters. Painters work in logical px with
// the origin at the sprite's anchor: ground types stand on y = 0 (up is
// negative), floaters/air are centred on (0, 0), ceiling things hang from
// y = 0 downward.
//
// Colour rules: palette tokens only; Act IV (r20–r26) things are sepia /
// faded indigo; neon only in Act VII keys; hazards never borrow the
// collectible look (haldi leaf + sindoor string, limewhite cowrie).
import type { Arch } from '../../data/hazards';
import { ARCH } from '../../data/hazards';
import { DERIVED, FIXED, P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, glow, makeCanvas, paintedShape, polyPath, smoothPath, softShadow, taperStroke, wobblyEllipse, type Ctx, type Pt } from '../brush';
import { person } from '../kit/people';
import { ORIGIN, paintMud, paintReed, paintStakes } from './props';

export const HZ_SCALE = 2; // canvases are painted at 2× logical size and displayed at 0.5×
const S = HZ_SCALE;

export interface Sprite { canvas: HTMLCanvasElement; ox: number; oy: number } // origin as FRACTIONS (0–1) of the canvas

// ---- colours ---------------------------------------------------------------
const RW = mix(P.laterite, P.ink, 0.65); // warm rim
const RC = mix(P.neel, P.ink, 0.5); // cool rim
const lt = (c: string, t = 0.35) => mix(c, P.limewhite, t);
const dk = (c: string, t = 0.35) => mix(c, P.ink, t);
const t4 = (c: string, k = 0.6) => mix(c, DERIVED.sepia, k); // Act IV tone
const STONE = mix(P.khondalite, P.chandan, 0.25);
const SAND = mix(P.skyCream, P.chandan, 0.35);
const WOOD = mix(P.laterite, P.chandan, 0.35);
const WOODD = mix(P.laterite, P.ink, 0.45);
const BAMBOO = mix(P.haldi, P.laterite, 0.42);
const BARK = mix(P.laterite, P.khondalite, 0.5);
const TERRA = mix(P.laterite, P.chandan, 0.12);
const STEEL = mix(P.khondalite, P.neel, 0.3);
const CREAM = mix(P.limewhite, P.chandan, 0.2);
const LEAF = mix(P.tota, P.neel, 0.2);
const LEAFL = mix(P.tota, P.haldi, 0.3);
const LEAFD = mix(P.tota, P.ink, 0.35);
const PAPER = t4(mix(P.limewhite, P.chandan, 0.15), 0.3);
const IND4 = mix(P.neel, DERIVED.sepia, 0.35); // faded indigo
const NIGHT = mix(DERIVED.sepia, P.neel, 0.35);

// ---- small painting helpers -----------------------------------------------
type B = [number, number, number, number];
interface SO { rim?: string; rimW?: number; light?: string; shade?: string; dabs?: number; from?: 'top' | 'left' | 'right' }
function ps(c: Ctx, r: Rng, path: () => void, b: B, base: string, o: SO = {}): void {
  paintedShape(c, r, path, { x: b[0], y: b[1], w: b[2], h: b[3] }, {
    base, light: o.light ?? lt(base, 0.4), shade: o.shade ?? dk(base, 0.35), rim: o.rim, rimW: o.rimW ?? 1.3, dabs: o.dabs, lightFrom: o.from,
  });
}
const E = (c: Ctx, cx: number, cy: number, rx: number, ry: number, rot = 0) => () => { c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); };
const RR = (c: Ctx, x: number, y: number, w: number, h: number, rad = 2) => () => { c.beginPath(); c.roundRect(x, y, w, h, rad); };
const PL = (c: Ctx, pts: Pt[]) => () => polyPath(c, pts);
const SM = (c: Ctx, pts: Pt[]) => () => smoothPath(c, pts);
const pts = (a: number[][], sx = 1, sy = 1, dx = 0, dy = 0): Pt[] => a.map(([x, y]) => ({ x: x * sx + dx, y: y * sy + dy }));
function fill(c: Ctx, path: () => void, col: string, a = 1): void { path(); c.fillStyle = withAlpha(col, a); c.fill(); }
function stroke(c: Ctx, path: () => void, col: string, w: number, a = 1): void { path(); c.strokeStyle = withAlpha(col, a); c.lineWidth = w; c.stroke(); }
function stick(c: Ctx, p: Pt[], w: number, col: string, rim?: string): void {
  if (rim) taperStroke(c, p, w + 2.2, rim, 1, [1, 1]);
  taperStroke(c, p, w, col, 1, [1, 1]);
}
function ln(c: Ctx, p: Pt[], w: number, col: string, a = 1): void {
  c.strokeStyle = withAlpha(col, a);
  c.lineWidth = w;
  c.beginPath();
  p.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
  c.stroke();
}
const P2 = (x: number, y: number): Pt => ({ x, y });
function shadow(c: Ctx, rx: number, a = 0.4, y = 1): void { softShadow(c, 0, y, rx, Math.max(3, rx * 0.16), DERIVED.shadowWarm, a); }
function grain(c: Ctx, r: Rng, x: number, y: number, w: number, h: number, col: string, n: number, a = 0.35): void {
  for (let i = 0; i < n; i++) {
    const yy = y + r.range(1, h - 1), x0 = x + r.range(0, w * 0.4);
    taperStroke(c, [P2(x0, yy), P2(x0 + r.range(w * 0.3, w * 0.6), yy + r.range(-0.6, 0.6))], r.range(0.5, 1.1), col, a);
  }
}
function leaf(c: Ctx, x: number, y: number, len: number, wid: number, ang: number, col: string): void {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.45, -wid, len, 0); c.quadraticCurveTo(len * 0.45, wid, 0, 0); c.closePath();
  c.fillStyle = col; c.fill();
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.45, -wid, len, 0); c.closePath();
  c.fillStyle = withAlpha(P.limewhite, 0.16); c.fill();
  ln(c, [P2(len * 0.05, 0), P2(len * 0.9, 0)], 0.7, dk(col, 0.4), 0.7);
  c.restore();
}
function marigold(c: Ctx, x: number, y: number, rr: number, col: string = P.marigold): void {
  dab(c, x, y, rr, rr, 0, dk(col, 0.25), 1);
  dab(c, x - rr * 0.15, y - rr * 0.15, rr * 0.8, rr * 0.8, 0, col, 1);
  dab(c, x - rr * 0.3, y - rr * 0.35, rr * 0.4, rr * 0.35, 0, mix(col, P.haldi, 0.6), 0.9);
}
function tuft(c: Ctx, r: Rng, x: number, y: number, h: number, col: string = LEAFL, n = 5): void {
  for (let j = 0; j < n; j++) {
    const a = -Math.PI / 2 + r.range(-0.7, 0.7);
    const l = h * r.range(0.6, 1);
    taperStroke(c, curvePts(x, y, x + Math.cos(a) * l * 0.4, y + Math.sin(a) * l * 0.6, x + Math.cos(a) * l, y + Math.sin(a) * l, 5), 2, j % 2 ? col : dk(col, 0.2), 1, [1, 0.1]);
  }
}
/** Front-facing 2.5D box: front face, top face, right side. */
function box3(c: Ctx, r: Rng, x: number, y: number, w: number, h: number, d: number, col: string, o: { top?: string; side?: string } = {}): void {
  const dy = d * 0.55;
  fill(c, PL(c, [P2(x, y - h), P2(x + d, y - h - dy), P2(x + w + d, y - h - dy), P2(x + w, y - h)]), o.top ?? lt(col, 0.3));
  fill(c, PL(c, [P2(x + w, y), P2(x + w, y - h), P2(x + w + d, y - h - dy), P2(x + w + d, y - dy)]), o.side ?? dk(col, 0.25));
  ps(c, r, RR(c, x, y - h, w, h, 1), [x, y - h, w, h], col);
  ln(c, [P2(x, y - h), P2(x + w, y - h), P2(x + w + d, y - h - dy)], 0.8, lt(col, 0.6), 0.6);
}
function wheel(c: Ctx, cx: number, cy: number, rad: number, o: { wood: string; dark: string; spokes?: number; tyre?: string; hub?: string; ang?: number; thin?: boolean }): void {
  const n = o.spokes ?? 8;
  const a0 = o.ang ?? 0.2;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const p = [P2(cx, cy), P2(cx + Math.cos(a) * rad * 0.9, cy + Math.sin(a) * rad * 0.9)];
    if (o.thin) ln(c, p, 0.7, o.wood, 0.9);
    else stick(c, p, rad * 0.14, o.wood, o.dark);
  }
  c.beginPath(); c.arc(cx, cy, rad * 0.92, 0, Math.PI * 2);
  c.strokeStyle = o.dark; c.lineWidth = rad * 0.3; c.stroke();
  c.strokeStyle = o.tyre ?? o.wood; c.lineWidth = rad * 0.18; c.stroke();
  c.beginPath(); c.arc(cx, cy, rad * 0.92, Math.PI * 1.05, Math.PI * 1.5);
  c.strokeStyle = withAlpha(P.limewhite, 0.35); c.lineWidth = rad * 0.07; c.stroke();
  dab(c, cx, cy, rad * 0.2, rad * 0.2, 0, o.dark, 1);
  dab(c, cx, cy, rad * 0.13, rad * 0.13, 0, o.hub ?? lt(o.wood, 0.2), 1);
}
function rope(c: Ctx, p: Pt[], w: number, col: string, rim?: string): void {
  if (rim) taperStroke(c, p, w + 2, rim, 1, [1, 1]);
  taperStroke(c, p, w, col, 1, [1, 1]);
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ln(c, [P2(mx - w * 0.35, my - w * 0.4), P2(mx + w * 0.35, my + w * 0.4)], 0.6, dk(col, 0.4), 0.7);
  }
}
/** Rocky lump through wobbly points, painted. */
function rock(c: Ctx, r: Rng, cx: number, cy: number, rx: number, ry: number, col: string, flatBase = true): void {
  const p = wobblyEllipse(r, cx, cy, rx, ry, 0.12, 14).map((q) => ({ x: q.x, y: flatBase ? Math.min(q.y, Math.max(cy + ry * 0.75, 0.5)) : q.y }));
  ps(c, r, SM(c, p), [cx - rx, cy - ry, rx * 2, ry * 2], col, { light: lt(col, 0.45), shade: dk(col, 0.45) });
  clipTo(c, SM(c, p), () => {
    for (let i = 0; i < 3; i++) {
      const x = cx + r.range(-rx * 0.6, rx * 0.5), y = cy + r.range(-ry * 0.5, ry * 0.3);
      taperStroke(c, [P2(x, y), P2(x + r.range(-4, 6), y + r.range(3, 8)), P2(x + r.range(-3, 8), y + r.range(8, 14))], 0.9, dk(col, 0.55), 0.5);
    }
    dab(c, cx - rx * 0.3, cy - ry * 0.5, rx * 0.35, ry * 0.18, -0.3, P.limewhite, 0.22);
  });
}
function foamLine(c: Ctx, r: Rng, x0: number, x1: number, y: number, n: number, col: string = P.limewhite): void {
  for (let i = 0; i < n; i++) {
    const x = r.range(x0, x1);
    dab(c, x, y + r.range(-2, 2), r.range(2.5, 6), r.range(1.4, 2.6), 0, col, r.range(0.6, 0.95));
  }
}

// ---- sprite framework ------------------------------------------------------
type Paint = (c: Ctx, r: Rng, v: number) => void;
interface Def {
  arch: Arch;
  /** Number of variants (1–3). */
  n?: number;
  rim?: string;
  /** Extra margin [side, top, bottom] in logical px around the archetype box. */
  m?: [number, number, number];
  /** Drawn first, not outlined (contact shadows). */
  under?: Paint;
  /** The outlined mass. */
  body: Paint;
  /** Drawn last, not outlined (glows, spray, foam, rain). */
  over?: Paint;
}

function layout(arch: Arch, m?: [number, number, number]): { W: number; H: number; ox: number; oy: number } {
  const a = ARCH[arch];
  const [mx, mt, mb] = m ?? (a.anchor === 'ground' ? [14, 14, 10] : a.anchor === 'ceiling' ? [14, 4, 14] : [14, 14, 14]);
  const W = a.w + mx * 2, H = mt + a.h + mb;
  const oy = a.anchor === 'ground' ? mt + a.h : a.anchor === 'ceiling' ? mt : mt + a.h / 2;
  return { W, H, ox: W / 2, oy };
}

const RIM_PX = 2.6; // outline width in canvas px (at HZ_SCALE)
function render(W: number, H: number, ox: number, oy: number, seed: string, v: number, rim: string, body: Paint, under?: Paint, over?: Paint): Sprite {
  const cw = Math.ceil(W * S), ch = Math.ceil(H * S);
  const [c, ctx] = makeCanvas(cw, ch);
  const prep = (k: Ctx) => k.setTransform(S, 0, 0, S, ox * S, oy * S);
  if (under) { prep(ctx); under(ctx, new Rng(`${seed}:u`), v); }
  const [b, bctx] = makeCanvas(cw, ch);
  prep(bctx);
  body(bctx, new Rng(seed), v);
  // silhouette → outline
  const [sil, sctx] = makeCanvas(cw, ch);
  sctx.drawImage(b, 0, 0);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = rim;
  sctx.fillRect(0, 0, cw, ch);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.drawImage(sil, Math.cos(a) * RIM_PX, Math.sin(a) * RIM_PX);
  }
  ctx.drawImage(sil, 0, 0);
  ctx.drawImage(b, 0, 0);
  if (over) { prep(ctx); over(ctx, new Rng(`${seed}:o`), v); }
  return { canvas: c, ox: ox / W, oy: oy / H };
}

const D: Record<string, Def> = {};
const def = (key: string, d: Def) => { D[key] = d; };

// =============================================================================
// Act I — Kalinga Sagar
// =============================================================================

// moat (pit): a ditch in the laterite with spoil banks either side.
def('moat', {
  arch: 'pit', n: 2, m: [14, 22, 16],
  body: (c, r, v) => {
    const earth = mix(P.laterite, P.chandan, 0.2);
    // spoil banks (lips) either side
    for (const sx of [-1, 1]) {
      const p = pts([[30, 2], [36, -14], [44, -24 + v * 2], [52, -22], [60, -8], [64, 2]], sx, 1);
      ps(c, r, SM(c, p), [sx > 0 ? 30 : -64, -26, 34, 28], earth, { light: mix(earth, P.haldi, 0.35) });
      tuft(c, r, sx * 46, -22 + v * 2, 9, LEAFL, 6);
    }
    // the hollow: lit far wall, dark inside, muddy water at the bottom
    const hole = SM(c, pts([[-42, 0], [-30, -4], [0, -5], [30, -4], [42, 0], [32, 8], [0, 12], [-32, 8]]));
    fill(c, hole, dk(P.laterite, 0.55));
    clipTo(c, hole, () => {
      c.fillStyle = withAlpha(mix(P.laterite, P.khondalite, 0.3), 1);
      c.beginPath(); c.ellipse(0, -2, 44, 6, 0, Math.PI, Math.PI * 2); c.fill();
      for (let i = 0; i < 9; i++) taperStroke(c, [P2(-38 + i * 9.5, -4), P2(-36 + i * 9.5, 2)], 1, dk(P.laterite, 0.4), 0.6);
      const water = mix(mix(P.neel, P.khondalite, 0.45), P.ink, 0.2);
      fill(c, E(c, 0, 8, 36, 5), water);
      taperStroke(c, [P2(-20, 6.5), P2(14, 6.8)], 1.6, P.seafoam, 0.55);
      dab(c, 22, 7.5, 5, 1, 0, P.limewhite, 0.35);
    });
    // near lip of the hole
    taperStroke(c, curvePts(-44, 1, 0, 13, 44, 1, 12), 3, mix(earth, P.haldi, 0.2), 1, [0.4, 0.4]);
    if (v === 1) {
      // a little frog on the right bank
      dab(c, 47, -26, 5.5, 4, 0, mix(P.tota, P.khondalite, 0.2), 1);
      dab(c, 44, -29, 1.6, 1.6, 0, P.limewhite, 1);
      dab(c, 44, -29, 0.8, 0.8, 0, P.ink, 1);
      dab(c, 49, -29, 1.6, 1.6, 0, P.limewhite, 1);
      dab(c, 49, -29, 0.8, 0.8, 0, P.ink, 1);
    }
  },
});

// pot (roller): a round terracotta water handi, rolling.
function handi(c: Ctx, r: Rng, cx: number, cy: number, rad: number, base: string, band: string, black = false): void {
  // neck and lip
  ps(c, r, RR(c, cx - rad * 0.42, cy - rad * 1.18, rad * 0.84, rad * 0.4, 2), [cx - rad * 0.5, cy - rad * 1.2, rad, rad * 0.4], dk(base, 0.1));
  fill(c, E(c, cx, cy - rad * 1.16, rad * 0.56, rad * 0.14), dk(base, 0.15));
  fill(c, E(c, cx, cy - rad * 1.16, rad * 0.4, rad * 0.08), dk(base, 0.55));
  const body = E(c, cx, cy, rad, rad * 0.94);
  ps(c, r, body, [cx - rad, cy - rad, rad * 2, rad * 2], base, { light: lt(base, black ? 0.25 : 0.45), shade: dk(base, 0.45) });
  clipTo(c, body, () => {
    // painted bands
    taperStroke(c, curvePts(cx - rad, cy - rad * 0.3, cx, cy - rad * 0.15, cx + rad, cy - rad * 0.3, 10), rad * 0.13, band, 0.95, [1, 1]);
    for (let i = 0; i < 7; i++) {
      const x = cx - rad * 0.8 + i * rad * 0.27;
      taperStroke(c, [P2(x, cy - rad * 0.08), P2(x + rad * 0.13, cy + rad * 0.12), P2(x + rad * 0.26, cy - rad * 0.08)], rad * 0.06, band, 0.9, [1, 1]);
    }
    taperStroke(c, curvePts(cx - rad, cy + rad * 0.3, cx, cy + rad * 0.45, cx + rad, cy + rad * 0.3, 10), rad * 0.06, band, 0.8, [1, 1]);
    dab(c, cx - rad * 0.4, cy - rad * 0.5, rad * 0.3, rad * 0.16, -0.5, P.limewhite, black ? 0.35 : 0.3);
  });
}
def('pot', {
  arch: 'roller', n: 2, m: [14, 18, 8],
  under: (c) => shadow(c, 20),
  body: (c, r, v) => {
    if (v === 0) handi(c, r, 0, -22, 20, TERRA, P.limewhite);
    else handi(c, r, 0, -22, 20, mix(P.khondalite, P.ink, 0.45), mix(P.chandan, P.limewhite, 0.4), true);
    // a splash of spilt water on one side
    dab(c, -16, -40, 3, 2, 0.4, P.seafoam, 0.9);
  },
});
// pot (small) — r16 coronation: a stack of festive pots on a straw ring.
def('pot@small', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    // straw ring base
    fill(c, E(c, 0, -3, 22, 4), mix(P.haldi, P.chandan, 0.5));
    handi(c, r, 0, -20, 18, TERRA, v ? P.tota : P.limewhite);
    fill(c, E(c, 0, -40, 12, 3), mix(P.haldi, P.chandan, 0.5));
    handi(c, r, 0, -52, 13, mix(TERRA, P.marigold, 0.2), v ? P.limewhite : P.neel);
    handi(c, r, 0, -75, 7.5, TERRA, P.tota);
    // mango-leaf sprig in the top pot
    for (const a of [-2.4, -1.6, -0.8]) leaf(c, 0, -85, 12, 3.4, a, LEAF);
  },
});

// bovine painter (faces LEFT): cows, bullocks, buffalo, calves.
interface BovO { col: string; spot?: string; horn?: string; garland?: boolean; bell?: boolean; phase?: number; buffalo?: boolean; calf?: boolean }
function bovine(c: Ctx, r: Rng, x: number, y: number, s: number, o: BovO): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const col = o.col, sh = dk(col, o.buffalo ? 0.25 : 0.3), li = lt(col, 0.4);
  const hoof = dk(P.khondalite, 0.5);
  const sw = Math.sin(o.phase ?? 0.8) * 4;
  const leg = (lx: number, swing: number, lc: string) => {
    taperStroke(c, [P2(lx, -34), P2(lx + swing * 0.4, -16), P2(lx + swing, -3)], 9, lc, 1, [1, 0.7]);
    dab(c, lx + swing, -2.4, 4.6, 2.6, 0, hoof, 1);
  };
  leg(-14, sw, sh);
  leg(26, -sw, sh);
  // tail
  taperStroke(c, curvePts(32, -48, 42, -38, 37, -16, 8), 2.8, sh, 1, [1, 0.6]);
  dab(c, 37, -15, 3, 5, 0, dk(col, 0.45), 1);
  const body = E(c, 4, -42, 32, 17);
  ps(c, r, body, [-28, -59, 64, 34], col, { light: li, shade: sh });
  clipTo(c, body, () => {
    if (o.spot) { dab(c, 16, -48, 11, 8, 0.3, o.spot, 0.9); dab(c, -6, -33, 7, 5, 0, o.spot, 0.8); }
    dab(c, 2, -28, 30, 5, 0, sh, 0.35);
  });
  if (!o.buffalo && !o.calf) ps(c, r, E(c, -16, -56, 10, 8), [-26, -64, 20, 16], col, { light: li, shade: sh });
  leg(-22, -sw, col);
  leg(18, sw, col);
  // neck + dewlap
  fill(c, SM(c, pts([[-12, -54], [-30, -60], [-40, -44], [-34, -32], [-20, -30], [-12, -36]])), col);
  dab(c, -27, -36, 6, 7, 0.2, sh, 0.25);
  // head (big and round: cosy)
  ps(c, r, E(c, -38, -52, 12, 13, -0.2), [-50, -65, 24, 26], col, { light: li, shade: sh });
  // ears
  for (const [ex, ey, a] of [[-49, -58, 2.7], [-28, -60, 0.2]] as const) {
    c.save(); c.translate(ex, ey); c.rotate(a);
    fill(c, E(c, 5, 0, 7, 3.4), col); fill(c, E(c, 5, 0, 4.4, 1.8), mix(P.chandan, P.rani, 0.25), 0.8);
    c.restore();
  }
  // horns
  if (!o.calf) {
    const hc = o.horn ?? mix(P.chandan, P.limewhite, 0.25);
    if (o.buffalo) {
      taperStroke(c, curvePts(-34, -63, -18, -72, -12, -60, 8), 4.4, mix(P.khondalite, P.ink, 0.35), 1, [1, 0.2]);
      taperStroke(c, curvePts(-44, -62, -58, -70, -60, -58, 8), 4.4, mix(P.khondalite, P.ink, 0.35), 1, [1, 0.2]);
    } else {
      taperStroke(c, curvePts(-43, -61, -46, -68, -42, -73, 6), 3.4, hc, 1, [1, 0.3]);
      taperStroke(c, curvePts(-33, -62, -30, -69, -34, -74, 6), 3.4, hc, 1, [1, 0.3]);
      if (o.horn) { dab(c, -42, -72, 1.6, 1.8, 0, o.horn, 1); dab(c, -34, -73, 1.6, 1.8, 0, o.horn, 1); }
    }
  }
  // muzzle, nostrils, eyes, blush
  fill(c, E(c, -46, -43, 8.5, 6.8, -0.2), mix(P.chandan, P.rani, o.buffalo ? 0.05 : 0.18));
  dab(c, -50, -43, 1.2, 1.4, 0, dk(P.chandan, 0.5), 1);
  dab(c, -44.5, -41.5, 1.2, 1.4, 0, dk(P.chandan, 0.5), 1);
  taperStroke(c, curvePts(-50, -38.5, -46, -36.5, -42, -39, 5), 0.9, dk(P.chandan, 0.5), 0.9);
  dab(c, -40, -55, 2.9, 3.3, 0, P.ink, 1);
  dab(c, -40.8, -56.4, 1.1, 1.1, 0, P.limewhite, 1);
  dab(c, -33, -48, 3.6, 2.2, 0, P.rani, 0.22);
  if (o.bell) {
    taperStroke(c, curvePts(-34, -40, -28, -34, -20, -40, 6), 1.8, P.neel, 1, [1, 1]);
    dab(c, -27, -32, 3, 3.6, 0, mix(P.haldi, P.khondalite, 0.4), 1);
    dab(c, -27.6, -33.2, 1, 1.4, 0, P.limewhite, 0.7);
  }
  if (o.garland) {
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      marigold(c, -36 + t * 20 - Math.sin(t * Math.PI) * 3, -42 + Math.sin(t * Math.PI) * 12 - t * 6, 2.8, i % 3 === 1 ? P.haldi : P.marigold);
    }
  }
  c.restore();
}

// oxcart (walker): a bullock pulls a two-wheeled cart, heading left.
def('oxcart', {
  arch: 'walker', n: 2, m: [16, 12, 10],
  under: (c) => { shadow(c, 54, 0.35); },
  body: (c, r, v) => {
    const wood = WOOD, dark = WOODD;
    // yoke pole
    stick(c, [P2(-40, -38), P2(4, -34)], 3, dark);
    // cart bed + load
    if (v === 0) {
      // straw load
      const hay = mix(P.haldi, P.chandan, 0.5);
      ps(c, r, SM(c, pts([[-2, -36], [6, -58], [22, -66], [40, -62], [50, -46], [50, -36]])), [-2, -66, 52, 30], hay);
      for (let i = 0; i < 16; i++) {
        const x = r.range(2, 48), y = r.range(-62, -40);
        taperStroke(c, [P2(x, y), P2(x + r.range(5, 10), y + r.range(-2, 2))], 1, r.chance(0.5) ? lt(hay, 0.3) : dk(hay, 0.3), 0.8);
      }
      stick(c, [P2(2, -40), P2(50, -42)], 1.4, dk(P.chandan, 0.4));
    } else {
      // arched woven hood
      const hood = mix(P.laterite, P.chandan, 0.45);
      ps(c, r, SM(c, pts([[0, -36], [2, -54], [14, -66], [34, -66], [48, -54], [50, -36]])), [0, -66, 50, 30], hood);
      for (let i = 1; i < 6; i++) taperStroke(c, curvePts(i * 8.5, -37, i * 8.5 + 1, -60, i * 8.5, -64, 6), 1.1, dk(hood, 0.35), 0.8);
      fill(c, E(c, 2, -48, 4, 10), dk(hood, 0.55));
    }
    ps(c, r, RR(c, -4, -38, 56, 7, 1.5), [-4, -38, 56, 7], wood);
    grain(c, r, -4, -38, 56, 7, dark, 4);
    // wheel
    wheel(c, 22, -20, 19, { wood: mix(WOOD, P.chandan, 0.2), dark: dark, spokes: 10, ang: 0.15 });
    // bullock
    bovine(c, r, -28, 0, 0.62, { col: mix(P.limewhite, P.chandan, 0.18), horn: P.tota, bell: true, phase: 1.2 });
  },
});

// milestone (small): stone post, ochre cap, no lettering.
def('milestone', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 24),
  body: (c, r, v) => {
    const stone = mix(P.limewhite, P.khondalite, 0.22);
    ps(c, r, RR(c, -22, -8, 44, 8, 2), [-22, -8, 44, 8], mix(P.khondalite, P.chandan, 0.2));
    const post = () => { c.beginPath(); c.moveTo(-16, -6); c.lineTo(-16, -40); c.arc(0, -40, 16, Math.PI, 0); c.lineTo(16, -6); c.closePath(); };
    ps(c, r, post, [-16, -56, 32, 50], stone, { light: P.limewhite, shade: mix(P.khondalite, P.ink, 0.1) });
    clipTo(c, post, () => {
      const cap = mix(P.haldi, P.chandan, 0.4);
      fill(c, RR(c, -20, -60, 40, 28, 0), cap);
      vGradient2(c, -20, -60, 40, 28, cap);
      fill(c, RR(c, -20, -33, 40, 2.4, 0), dk(cap, 0.3), 0.7);
      dab(c, -8, -48, 4, 2, -0.4, P.limewhite, 0.35);
    });
    tuft(c, r, -18, -2, 12, LEAFL, 6);
    tuft(c, r, 19, -2, 10, LEAF, 5);
    if (v === 1) {
      // a crow resting on top
      c.save(); c.translate(3, -55); c.scale(-1.5, 1.5);
      dab(c, 0, -5, 5, 3.4, -0.2, P.ink, 1);
      dab(c, 4.5, -8, 2.8, 2.6, 0, P.ink, 1);
      dab(c, 5, -8.6, 0.6, 0.6, 0, P.limewhite, 1);
      taperStroke(c, [P2(6.5, -8), P2(10, -7.4)], 1.6, P.khondalite, 1, [1, 0.2]);
      taperStroke(c, [P2(-4, -5), P2(-10, -3)], 2.6, P.ink, 1, [1, 0.3]);
      c.restore();
    }
  },
});
function vGradient2(c: Ctx, x: number, y: number, w: number, h: number, col: string): void {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, withAlpha(lt(col, 0.3), 0.6));
  g.addColorStop(1, withAlpha(dk(col, 0.25), 0.5));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
}

// waves (small/tall): a curling crest, deep indigo-blue with limewhite foam.
const WAVE_PTS = [[34, 4], [31, -14], [22, -38], [8, -56], [-8, -66], [-22, -64], [-33, -55], [-32, -46], [-25, -50], [-16, -47], [-11, -36], [-15, -17], [-28, 4]];
function paintWave(c: Ctx, r: Rng, sx: number, sy: number): void {
  const p = pts(WAVE_PTS, sx, sy);
  const path = SM(c, p);
  const base = mix(P.neel, P.peacock, 0.4);
  ps(c, r, path, [-34 * sx, -68 * sy, 68 * sx, 72 * sy], base, { light: mix(P.seafoam, P.limewhite, 0.1), shade: mix(P.neel, P.ink, 0.25) });
  clipTo(c, path, () => {
    // hollow under the lip
    dab(c, -16 * sx, -36 * sy, 10 * sx, 16 * sy, 0.2, mix(P.neel, P.ink, 0.3), 0.55);
    // streaks along the face
    for (let i = 0; i < 4; i++) {
      const k = i / 3;
      taperStroke(c, curvePts((26 - k * 26) * sx, (-6 - k * 4) * sy, (14 - k * 18) * sx, (-30 - k * 6) * sy, (-2 - k * 10) * sx, (-44 - k * 8) * sy, 8), 2.2, P.seafoam, 0.3);
    }
    // translucent green-blue near the crest
    dab(c, 8 * sx, -50 * sy, 14 * sx, 8 * sy, -0.6, P.seafoam, 0.35);
  });
  // foam on the crest and the curl
  const crest = pts([[24, -36], [12, -54], [-4, -64], [-18, -65], [-29, -58], [-32, -50]], sx, sy);
  taperStroke(c, crest, 9 * Math.min(sx, sy), P.limewhite, 1, [0.4, 0.6]);
  for (const q of crest) dab(c, q.x + r.range(-3, 3), q.y + r.range(-3, 2), r.range(3, 5.5), r.range(2.4, 4), 0, P.limewhite, 1);
  for (let i = 0; i < 6; i++) dab(c, r.range(-30, 26) * sx, r.range(-2, 3), r.range(4, 7), r.range(2, 3), 0, lt(P.seafoam, 0.4), 1);
}
def('wave', {
  arch: 'small', n: 2, rim: RC,
  body: (c, r, v) => paintWave(c, r, v ? 1.12 : 1, v ? 0.92 : 1),
  over: (c, r) => { for (let i = 0; i < 10; i++) dab(c, r.range(-36, -10), r.range(-78, -56), r.range(0.8, 2), r.range(0.8, 2), 0, P.limewhite, r.range(0.5, 0.9)); },
});
def('bigwave', {
  arch: 'tall', n: 2, rim: RC, m: [26, 16, 10],
  body: (c, r, v) => paintWave(c, r, v ? 1.4 : 1.3, v ? 1.75 : 1.85),
  over: (c, r) => {
    for (let i = 0; i < 18; i++) dab(c, r.range(-50, -10), r.range(-136, -96), r.range(0.8, 2.6), r.range(0.8, 2.4), 0, P.limewhite, r.range(0.5, 0.9));
    for (let i = 0; i < 6; i++) dab(c, r.range(-44, 44), r.range(-2, 4), r.range(4, 8), 2, 0, P.limewhite, 0.8);
  },
});

// rock (wide, sea): wet rocks with weed and a foam collar.
def('rock', {
  arch: 'wide', n: 2, rim: RC, m: [14, 18, 10],
  body: (c, r, v) => {
    const col = mix(P.khondalite, P.neel, 0.22);
    rock(c, r, -32, -10, 20, 16, dk(col, 0.1));
    rock(c, r, 34, -8, 18, 13, col);
    rock(c, r, 2, -18, 32, 24 + v * 3, col);
    for (let i = 0; i < 7; i++) {
      const x = r.range(-44, 44);
      taperStroke(c, curvePts(x, 0, x + r.range(-4, 4), -6, x + r.range(-6, 6), -r.range(8, 14), 5), 2.4, mix(P.tota, P.khondalite, 0.45), 0.95, [1, 0.2]);
    }
    for (let i = 0; i < 10; i++) dab(c, r.range(-20, 26), r.range(-30, -6), 1.2, 1, 0, CREAM, 0.8);
  },
  over: (c, r) => { foamLine(c, r, -56, 56, 1, 22); },
});

// squall (floater): a small dark rain cloud.
def('squall', {
  arch: 'floater', n: 2, rim: RC, m: [16, 12, 20],
  body: (c, r, v) => {
    const col = DERIVED.stormGrey;
    const lobes = [[-22, 2, 14], [-8, -8, 17], [10, -10, 16], [24, 0, 13], [0, 6, 18]];
    const path = () => { c.beginPath(); for (const [x, y, rr] of lobes) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } };
    path(); c.fillStyle = col; c.fill();
    clipTo(c, path, () => {
      const g = c.createLinearGradient(0, -26, 0, 22);
      g.addColorStop(0, withAlpha(lt(col, 0.45), 1));
      g.addColorStop(0.5, withAlpha(col, 1));
      g.addColorStop(1, withAlpha(mix(P.neel, P.ink, 0.4), 1));
      c.fillStyle = g; c.fillRect(-40, -28, 80, 52);
      for (let i = 0; i < 14; i++) dab(c, r.range(-30, 30), r.range(-20, 4), r.range(3, 7), r.range(2, 4), 0, lt(col, 0.5), 0.25);
    });
    if (v === 1) {
      // a small lightning flick
      const z = pts([[4, 12], [-2, 22], [4, 22], [-3, 34]]);
      taperStroke(c, z, 3.2, mix(P.haldi, P.limewhite, 0.3), 1, [1, 0.2]);
    }
  },
  over: (c, r) => {
    for (let i = 0; i < 16; i++) {
      const x = r.range(-26, 26), y = r.range(12, 18);
      taperStroke(c, [P2(x, y), P2(x - 4, y + r.range(8, 14))], 1.2, mix(P.seafoam, P.limewhite, 0.5), 0.85);
    }
  },
});

// stone (small): a rounded fieldstone with a small one in front.
def('stone', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const col = v ? mix(P.khondalite, P.chandan, 0.2) : mix(P.khondalite, P.neel, 0.08);
    rock(c, r, 2, -25, 22, 26, col);
    rock(c, r, -15, -8, 11, 9, lt(col, 0.1));
    rock(c, r, 19, -5, 7, 5, dk(col, 0.1));
    if (v === 1) for (let i = 0; i < 8; i++) dab(c, r.range(-10, 14), r.range(-46, -30), r.range(1.4, 3), r.range(1, 2), 0, mix(P.tota, P.limewhite, 0.45), 0.7);
    tuft(c, r, -22, -1, 10, LEAFL, 5);
    tuft(c, r, 24, -1, 8, LEAF, 4);
  },
});

// steps (small): rock-cut sandstone steps, Udayagiri.
def('steps', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 30),
  body: (c, r, v) => {
    const col = mix(P.chandan, P.khondalite, 0.45);
    box3(c, r, -28, 0, 50, 18, 6, col);
    box3(c, r, -20, -18, 36, 18, 6, lt(col, 0.05));
    box3(c, r, -12, -36, 22, 18, 6, lt(col, 0.1));
    for (let i = 0; i < 10; i++) {
      const x = r.range(-26, 20), y = r.range(-50, -2);
      taperStroke(c, [P2(x, y), P2(x + 2, y + 3)], 0.8, dk(col, 0.4), 0.5);
    }
    tuft(c, r, -27, -1, 9, LEAF, 5);
    tuft(c, r, 22, -19, 7, LEAFL, 4);
    if (v === 1) {
      // a squirrel sitting on the top step
      const sq = mix(P.khondalite, P.chandan, 0.5);
      taperStroke(c, curvePts(6, -58, 14, -66, 8, -76, 8), 6, sq, 1, [1, 0.5]);
      dab(c, 0, -60, 5, 6, 0, sq, 1);
      dab(c, -4, -67, 4, 3.6, 0, sq, 1);
      dab(c, -7, -66, 1.2, 1.2, 0, P.ink, 1);
      dab(c, -1, -59, 2, 4, 0, lt(sq, 0.5), 0.9);
      for (let k = 0; k < 3; k++) taperStroke(c, [P2(-2, -63 + k * 2), P2(3, -63 + k * 2)], 0.6, P.limewhite, 0.8);
      dab(c, -6, -58, 2, 1.5, 0, P.tota, 1);
    }
  },
});

// monkey (roller): a cosy monkey curled into a tumbling ball, hugging a banana.
def('monkey', {
  arch: 'roller', n: 2, m: [14, 18, 8],
  under: (c) => shadow(c, 20),
  body: (c, r, v) => {
    const fur = mix(P.khondalite, P.chandan, 0.45);
    const face = mix(P.chandan, P.rani, 0.2);
    c.save(); c.scale(1.12, 1.12);
    // tail wrapping round
    taperStroke(c, curvePts(12, -6, 30, -26, 12, -46, 12), 4, dk(fur, 0.15), 1, [1, 0.4]);
    ps(c, r, E(c, 0, -24, 21, 21), [-21, -45, 42, 42], fur, { light: lt(fur, 0.35), shade: dk(fur, 0.35) });
    // ears
    for (const ex of [-20, 4]) { dab(c, ex, -33, 4.2, 4.6, 0, fur, 1); dab(c, ex, -33, 2.4, 2.8, 0, face, 1); }
    // face
    ps(c, r, E(c, -8, -30, 11, 10), [-19, -40, 22, 20], face, { light: lt(face, 0.3), shade: dk(face, 0.2) });
    fill(c, E(c, -8, -39, 12, 5), fur); // fur cap
    dab(c, -12.5, -31, 2.2, 2.6, 0, P.ink, 1);
    dab(c, -3.5, -31, 2.2, 2.6, 0, P.ink, 1);
    dab(c, -13, -32, 0.8, 0.8, 0, P.limewhite, 1);
    dab(c, -4, -32, 0.8, 0.8, 0, P.limewhite, 1);
    taperStroke(c, curvePts(-12, -25, -8, -22, -4, -25, 5), 1, dk(face, 0.5), 1);
    dab(c, -16, -27, 2.4, 1.4, 0, P.rani, 0.3);
    dab(c, 0, -27, 2.4, 1.4, 0, P.rani, 0.3);
    // knees, feet, hugging arms
    dab(c, -6, -9, 9, 7, 0, lt(fur, 0.12), 1);
    dab(c, -14, -5, 4, 3, 0, face, 1);
    dab(c, 2, -5, 4, 3, 0, face, 1);
    if (v === 0) {
      // banana held in front
      taperStroke(c, curvePts(-20, -16, -8, -10, 6, -18, 8), 6, P.haldi, 1, [0.5, 0.4]);
      taperStroke(c, curvePts(-20, -16, -8, -12, 6, -18, 8), 2, mix(P.haldi, P.marigold, 0.4), 0.8, [0.5, 0.4]);
      dab(c, 6.5, -18.5, 1.4, 1.4, 0, mix(P.laterite, P.ink, 0.4), 1);
    }
    taperStroke(c, curvePts(-18, -18, -12, -12, -4, -14, 6), 4, fur, 1, [1, 0.8]);
    taperStroke(c, curvePts(12, -18, 6, -12, -2, -14, 6), 4, dk(fur, 0.1), 1, [1, 0.8]);
    c.restore();
  },
});

// leaves (floater): a gust of broad sal leaves.
def('leaves', {
  arch: 'floater', n: 2,
  body: (c, r, v) => {
    const cols = [LEAF, LEAFL, mix(P.laterite, P.haldi, 0.35), mix(P.tota, P.haldi, 0.55), LEAFD];
    stick(c, curvePts(-24, 10, -4, 0, 20, -12, 8), 1.6, BARK);
    const n = 8 + v * 2;
    for (let i = 0; i < n; i++) {
      const a = r.range(-Math.PI, Math.PI);
      const x = r.range(-26, 22), y = r.range(-16, 12);
      leaf(c, x, y, r.range(15, 21), r.range(5, 7), a, cols[i % cols.length]);
    }
  },
});

// =============================================================================
// Act II — Temple Coast (lead laterite: hazards lean stone / green / indigo)
// =============================================================================

def('reef', {
  arch: 'wide', n: 2, rim: RC, m: [14, 18, 10],
  body: (c, r, v) => {
    const rockC = mix(P.khondalite, P.chandan, 0.15);
    ps(c, r, SM(c, pts([[-56, 2], [-46, -14], [-24, -22], [0, -18], [22, -24], [44, -14], [56, 2]])), [-56, -24, 112, 26], rockC);
    const coral = mix(P.rani, P.chandan, 0.55);
    const brain = mix(P.marigold, P.chandan, 0.45);
    const fan = mix(P.neel, P.rani, 0.35);
    // staghorn
    for (let i = 0; i < 3; i++) {
      const bx = -34 + i * 30 + v * 6;
      const tw = (x: number, y: number, a: number, l: number, d: number) => {
        const x1 = x + Math.cos(a) * l, y1 = y + Math.sin(a) * l;
        taperStroke(c, [P2(x, y), P2(x1, y1)], 4.4 - d, coral, 1, [1, 0.7]);
        dab(c, x1, y1, 2, 2, 0, lt(coral, 0.4), 1);
        if (d < 2) { tw(x1, y1, a - 0.5, l * 0.7, d + 1); tw(x1, y1, a + 0.45, l * 0.7, d + 1); }
      };
      tw(bx, -16, -Math.PI / 2 + r.range(-0.3, 0.3), 12, 0);
    }
    ps(c, r, E(c, 14, -20, 12, 9), [2, -29, 24, 18], brain, { light: lt(brain, 0.4) });
    for (let k = 0; k < 4; k++) taperStroke(c, curvePts(4, -22 + k * 3, 14, -28 + k * 3, 24, -22 + k * 3, 6), 0.8, dk(brain, 0.4), 0.7);
    // sea fan
    c.save(); c.translate(-46, -12);
    for (let k = 0; k < 9; k++) taperStroke(c, [P2(0, 0), P2(-12 + k * 3, -22 + Math.abs(k - 4) * 2)], 1.2, fan, 1, [1, 0.4]);
    c.restore();
  },
  over: (c, r) => foamLine(c, r, -58, 58, 1, 22),
});

// block (small): stacked cut sandstone blocks with a mallet.
def('block', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 28),
  body: (c, r, v) => {
    const col = mix(P.khondalite, P.chandan, 0.3);
    box3(c, r, -26, 0, 46, 26, 6, col);
    if (v === 0) box3(c, r, -20, -26, 34, 26, 6, lt(col, 0.08));
    else { box3(c, r, -22, -26, 20, 30, 5, lt(col, 0.06)); box3(c, r, 0, -26, 18, 18, 5, dk(col, 0.05)); }
    for (let i = 0; i < 12; i++) {
      const x = r.range(-24, 16), y = r.range(-50, -4);
      taperStroke(c, [P2(x, y), P2(x + 3, y + 1)], 0.7, dk(col, 0.4), 0.45);
    }
    // wooden mallet leaning
    stick(c, [P2(24, -2), P2(32, -34)], 2.2, WOOD, WOODD);
    ps(c, r, RR(c, 25, -44, 14, 10, 2), [25, -44, 14, 10], mix(WOOD, P.laterite, 0.2));
  },
});

// chips (wide): a heap of stone chips with a chisel.
def('chips', {
  arch: 'wide', n: 2, m: [14, 16, 10],
  under: (c) => shadow(c, 54, 0.3),
  body: (c, r, v) => {
    const col = mix(P.khondalite, P.chandan, 0.25 + v * 0.1);
    ps(c, r, SM(c, pts([[-56, 2], [-40, -12], [-14, -28], [10, -30], [36, -16], [56, 2]])), [-56, -30, 112, 32], dk(col, 0.1));
    for (let i = 0; i < 42; i++) {
      const x = r.range(-48, 48);
      const top = -30 * Math.max(0, 1 - Math.abs(x + 2) / 54) - 1;
      const y = r.range(top + 2, 0);
      const s = r.range(3, 6);
      const ch = [P2(x - s, y), P2(x - s * 0.3, y - s * 0.8), P2(x + s * 0.9, y - s * 0.4), P2(x + s * 0.6, y + s * 0.5)];
      fill(c, PL(c, ch), r.pick([col, lt(col, 0.25), dk(col, 0.2), lt(col, 0.45)]));
      ln(c, [ch[0], ch[1], ch[2]], 0.6, lt(col, 0.6), 0.7);
    }
    // chisel
    stick(c, [P2(4, -30), P2(22, -40)], 2.2, STEEL, dk(STEEL, 0.4));
    stick(c, [P2(-2, -27), P2(6, -31)], 3.2, WOOD);
  },
});

// scaffold (tall): bamboo scaffold lashed with rope, a mat screen and a plank.
def('scaffold', {
  arch: 'tall', n: 2, m: [18, 16, 10],
  under: (c) => shadow(c, 30),
  body: (c, r, v) => {
    const bl = mix(P.haldi, P.limewhite, 0.25), bd = mix(P.laterite, P.ink, 0.3);
    const pole = (x0: number, x1: number, top: number) => {
      stick(c, [P2(x0, 2), P2(x1, top)], 5.4, BAMBOO);
      taperStroke(c, [P2(x0 + 1, 2), P2(x1 + 1, top + 2)], 1.6, bl, 0.8, [1, 1]);
      for (let y = -16; y > top + 6; y -= 20) taperStroke(c, [P2(x0 + (x1 - x0) * (y / top) - 3, y), P2(x0 + (x1 - x0) * (y / top) + 3, y)], 1.6, bd, 1, [1, 1]);
    };
    // woven mat screen across the lower half
    const mat = mix(P.chandan, P.haldi, 0.3);
    ps(c, r, PL(c, pts([[-22, -6], [-22, -52], [22, -50], [22, -6]])), [-22, -52, 44, 46], mat);
    for (let y = -48; y < -8; y += 5) taperStroke(c, [P2(-21, y), P2(21, y + 1)], 1, dk(mat, 0.3), 0.6, [1, 1]);
    for (let x = -18; x < 22; x += 6) taperStroke(c, [P2(x, -50), P2(x, -7)], 0.6, dk(mat, 0.3), 0.4, [1, 1]);
    pole(-24, -21, -124);
    pole(24, 20, -116);
    for (const y of [-54, -92]) stick(c, [P2(-28, y), P2(28, y + 2)], 4, BAMBOO);
    stick(c, [P2(-22, -56), P2(20, -92)], 3.4, mix(BAMBOO, P.laterite, 0.2));
    // lashings
    for (const [x, y] of [[-23, -54], [22, -52], [-22, -92], [21, -90]]) { dab(c, x, y, 3.6, 3, 0, mix(P.chandan, P.khondalite, 0.3), 1); ln(c, [P2(x - 3, y - 2), P2(x + 3, y + 2)], 0.6, P.ink, 0.5); }
    // plank on the top ledger
    ps(c, r, RR(c, -32, -99, 64, 5, 1), [-32, -99, 64, 5], WOOD);
    if (v === 0) handi(c, r, 14, -106, 6.5, TERRA, P.limewhite);
    else { dab(c, -14, -104, 7, 5, 0, mix(P.chandan, P.haldi, 0.35), 1); for (let k = 0; k < 3; k++) ln(c, [P2(-20, -106 + k * 2), P2(-8, -106 + k * 2)], 0.6, dk(P.chandan, 0.4), 0.6); }
  },
});

// basket (small): a tall cane basket heaped with flowers (or coconuts).
function basketBody(c: Ctx, r: Rng, w0: number, w1: number, h: number, col: string): void {
  const path = PL(c, [P2(-w0, 0), P2(-w1, -h), P2(w1, -h), P2(w0, 0)]);
  ps(c, r, path, [-w1, -h, w1 * 2, h], col);
  clipTo(c, path, () => {
    for (let y = -h + 4; y < 0; y += 5) taperStroke(c, [P2(-w1, y), P2(w1, y + 1)], 1.3, dk(col, 0.35), 0.55, [1, 1]);
    for (let x = -w1; x < w1; x += 5) taperStroke(c, [P2(x, -h), P2(x * (w0 / w1), 0)], 0.8, lt(col, 0.35), 0.5, [1, 1]);
  });
  fill(c, E(c, 0, -h, w1 + 1, 3.2), dk(col, 0.1));
  stroke(c, E(c, 0, -h, w1 + 1, 3.2), dk(col, 0.45), 1);
}
def('basket', {
  arch: 'small', n: 3,
  under: (c) => shadow(c, 24),
  body: (c, r, v) => {
    basketBody(c, r, 16, 22, 40, mix(P.chandan, P.haldi, 0.22));
    if (v === 2) {
      // green coconuts and leaves
      for (const a of [-2.6, -0.5]) leaf(c, 0, -46, 22, 5, a, LEAF);
      for (const [x, y] of [[-10, -48], [8, -49], [-1, -58]]) ps(c, r, E(c, x, y, 10, 9), [x - 10, y - 9, 20, 18], mix(P.tota, P.khondalite, 0.12));
      return;
    }
    const heap = SM(c, pts([[-22, -40], [-18, -54], [-4, -62], [10, -60], [20, -50], [22, -40]]));
    fill(c, heap, v ? mix(P.tota, P.ink, 0.2) : dk(P.marigold, 0.3));
    for (let i = 0; i < 26; i++) {
      const x = r.range(-19, 19), y = r.range(-58, -42) + Math.abs(x) * 0.25;
      if (v === 0) marigold(c, x, y, r.range(3.4, 4.6), r.chance(0.3) ? P.haldi : P.marigold);
      else if (i % 3 === 0) { dab(c, x, y, 4.6, 3.6, 0, mix(P.rani, P.limewhite, 0.45), 1); dab(c, x, y - 1, 2.4, 2, 0, mix(P.rani, P.limewhite, 0.7), 1); }
      else dab(c, x, y, 1.8, 1.8, 0, P.limewhite, 1);
    }
    leaf(c, -18, -46, 12, 3.6, -2.6, LEAF);
    leaf(c, 18, -46, 12, 3.6, -0.5, LEAF);
  },
});

// stupa (small): an UNFINISHED stone votive-stupa blank on a mason's sledge —
// workshop stone, never a worshipped object.
def('stupa', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 28),
  body: (c, r, v) => {
    const col = mix(P.khondalite, P.limewhite, 0.22);
    // wooden sledge
    ps(c, r, RR(c, -28, -7, 56, 7, 2), [-28, -7, 56, 7], WOOD);
    box3(c, r, -20, -7, 36, 12, 5, dk(col, 0.05));
    ps(c, r, RR(c, -16, -40, 32, 22, 1), [-16, -40, 32, 22], col);
    const dome = () => { c.beginPath(); c.ellipse(0, -40, 17, 17, 0, Math.PI, Math.PI * 2); c.closePath(); };
    ps(c, r, dome, [-17, -57, 34, 17], lt(col, 0.05));
    box3(c, r, -6, -56, 10, 7, 3, col);
    // rough, unfinished half: chisel hatching and a guide line
    clipTo(c, RR(c, 2, -60, 20, 54, 0), () => { for (let i = 0; i < 18; i++) { const y = r.range(-56, -20); taperStroke(c, [P2(4, y), P2(16, y + 2)], 0.8, dk(col, 0.35), 0.6); } });
    ln(c, [P2(-16, -30), P2(16, -30)], 0.8, mix(P.laterite, P.ink, 0.2), 0.7);
    // rope sling round it
    rope(c, curvePts(-24, -6, -18, -34, -6, -48, 8), 2, mix(P.chandan, P.khondalite, 0.2));
    if (v === 1) { stick(c, [P2(22, -2), P2(28, -30)], 2, WOOD, WOODD); ps(c, r, RR(c, 22, -40, 12, 9, 2), [22, -40, 12, 9], mix(WOOD, P.laterite, 0.2)); }
  },
});

// carved (wide): a fallen carved lintel with scrolls and rosettes (no figures).
def('carved', {
  arch: 'wide', n: 2, m: [14, 16, 10],
  under: (c) => shadow(c, 56, 0.3),
  body: (c, r, v) => {
    const col = mix(P.khondalite, P.chandan, 0.18 + v * 0.1);
    const front = PL(c, pts([[-54, 0], [-54, -24], [46, -24], [50, -18], [46, -12], [52, -6], [48, 0]]));
    fill(c, PL(c, pts([[-54, -24], [-48, -30], [52, -30], [46, -24]])), lt(col, 0.3));
    ps(c, r, front, [-54, -24, 106, 24], col);
    clipTo(c, front, () => {
      ln(c, [P2(-54, -20), P2(48, -20)], 1, dk(col, 0.4), 0.6);
      ln(c, [P2(-54, -4), P2(48, -4)], 1, dk(col, 0.4), 0.6);
      for (let i = 0; i < 5; i++) {
        const x = -44 + i * 20;
        // rosette
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; dab(c, x + Math.cos(a) * 3.6, -12 + Math.sin(a) * 3.6, 2.2, 1.2, a, dk(col, 0.3), 0.8); }
        dab(c, x, -12, 1.6, 1.6, 0, lt(col, 0.4), 1);
        // scroll between rosettes
        taperStroke(c, curvePts(x + 6, -12, x + 10, -19, x + 14, -12, 6), 1.1, dk(col, 0.4), 0.8);
        taperStroke(c, curvePts(x + 6, -12, x + 10, -5, x + 14, -12, 6), 1.1, lt(col, 0.4), 0.8);
      }
    });
    for (let i = 0; i < 5; i++) { const x = r.range(-50, 50); fill(c, PL(c, [P2(x, 1), P2(x + 3, -3), P2(x + 7, 1)]), dk(col, 0.1)); }
    tuft(c, r, -48, -1, 8, LEAF, 4);
  },
});

// pillar (tall): a plain greenish-chlorite pillar with ring mouldings, propped.
def('pillar', {
  arch: 'tall', n: 2, m: [16, 14, 10],
  under: (c) => shadow(c, 28),
  body: (c, r, v) => {
    const col = mix(P.khondalite, P.tota, 0.14);
    box3(c, r, -22, 0, 40, 14, 6, col);
    ps(c, r, RR(c, -14, -104, 28, 92, 1), [-14, -104, 28, 92], lt(col, 0.05), { from: 'left' });
    for (const y of [-42, -72]) { ps(c, r, RR(c, -17, y - 4, 34, 8, 3), [-17, y - 4, 34, 8], col); ln(c, [P2(-16, y), P2(16, y)], 0.8, dk(col, 0.4), 0.7); }
    box3(c, r, -21, -104, 38, 10, 5, col);
    box3(c, r, -15, -114, 26, 8, 4, lt(col, 0.1));
    if (v === 0) { stick(c, [P2(24, 0), P2(10, -88)], 3.6, BAMBOO); rope(c, [P2(-15, -86), P2(0, -84), P2(14, -86)], 2, mix(P.chandan, P.khondalite, 0.2)); }
    else { const p = [P2(-30, 0), P2(-12, -64)]; stick(c, p, 3.6, BAMBOO); tuft(c, r, 16, -1, 10, LEAF, 5); }
  },
});

// mangoBasket (small): a wide bamboo basket heaped with ripe mangoes.
function mangoShape(c: Ctx, r: Rng, x: number, y: number, s: number, rot: number): void {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const path = SM(c, pts([[-10, 2], [-9, -6], [-2, -9], [8, -7], [11, 0], [6, 7], [-4, 8]]));
  path();
  const g = c.createLinearGradient(-10, -8, 10, 8);
  g.addColorStop(0, withAlpha(mix(P.tota, P.haldi, 0.25), 1));
  g.addColorStop(0.5, withAlpha(P.haldi, 1));
  g.addColorStop(1, withAlpha(mix(P.marigold, P.sindoor, 0.35), 1));
  c.fillStyle = g; c.fill();
  dab(c, -3, -4, 4, 2, -0.3, P.limewhite, 0.35);
  dab(c, -9, -4, 1, 1, 0, LEAFD, 1);
  c.restore();
  void r;
}
def('mangoBasket', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 28),
  body: (c, r, v) => {
    const col = mix(P.chandan, P.haldi, 0.18);
    for (let i = 0; i < 13; i++) {
      const x = r.range(-20, 20), y = -26 - r.range(0, 22) * (1 - Math.abs(x) / 28);
      mangoShape(c, r, x, y, r.range(0.85, 1.05), r.range(-0.6, 0.6));
    }
    for (const a of [-2.4, -1.4, -0.6]) leaf(c, 2, -50, 18, 4.2, a + v * 0.2, LEAF);
    basketBody(c, r, 22, 28, 22, col);
  },
});
def('mango', {
  arch: 'roller', n: 2, m: [14, 18, 8],
  under: (c) => shadow(c, 20),
  body: (c, r, v) => {
    mangoShape(c, r, 0, -24, 2.15, v ? 0.4 : -0.25);
    stick(c, curvePts(-6, -42, -8, -48, -4, -52, 4), 2, BARK);
    leaf(c, -5, -50, 20, 6, -0.4, LEAF);
    if (v === 0) leaf(c, -5, -50, 16, 5, -2.5, LEAFL);
  },
});

// ladder (tall): a bamboo stepladder (mango picking, sign painting).
def('ladder', {
  arch: 'tall', n: 3, m: [16, 14, 10],
  under: (c) => shadow(c, 30),
  body: (c, r, v) => {
    const back = mix(BAMBOO, P.ink, 0.25);
    stick(c, [P2(-4, -120), P2(30, 0)], 4, back);
    for (let y = -100; y < 0; y += 18) {
      const k = (y + 124) / 124;
      stick(c, [P2(-22 + k * -4 + 14 * (1 - k) + 4, y), P2(22 + k * 4 - 14 * (1 - k) - 4, y)], 3.6, mix(BAMBOO, P.laterite, 0.15));
    }
    for (const sx of [-1, 1]) {
      const p = [P2(sx * 26, 2), P2(sx * 9, -124)];
      stick(c, p, 5.2, BAMBOO);
      taperStroke(c, [P2(sx * 26 + 1, 2), P2(sx * 9 + 1, -122)], 1.6, mix(P.haldi, P.limewhite, 0.25), 0.8, [1, 1]);
    }
    if (v === 1) {
      // paint drips and a hanging rag
      for (let i = 0; i < 6; i++) dab(c, r.pick([-20, 18, -14, 12]), r.range(-110, -10), 1.6, 2.6, 0, r.pick([P.peacock, P.haldi, P.tota]), 0.9);
      fill(c, PL(c, pts([[-14, -64], [-2, -64], [-4, -48], [-9, -52], [-13, -46]])), mix(P.peacock, P.limewhite, 0.3));
    } else if (v === 2) {
      // a small bucket hanging from a rung
      ln(c, [P2(6, -82), P2(6, -72)], 0.9, P.ink, 0.8);
      ps(c, r, PL(c, pts([[0, -72], [12, -72], [10, -58], [2, -58]])), [0, -72, 12, 14], STEEL);
    }
  },
});

// leafpile (wide): raked mango leaves with a broom.
def('leafpile', {
  arch: 'wide', n: 2, m: [14, 22, 10],
  under: (c) => shadow(c, 54, 0.3),
  body: (c, r, v) => {
    const mound = SM(c, pts([[-56, 2], [-38, -16], [-10, -28], [16, -26], [40, -14], [56, 2]]));
    fill(c, mound, mix(P.tota, P.khondalite, 0.45));
    const cols = [LEAF, LEAFL, LEAFD, mix(P.haldi, P.laterite, 0.4), mix(P.laterite, P.khondalite, 0.3)];
    for (let i = 0; i < 46; i++) {
      const x = r.range(-50, 50), top = -28 * Math.max(0, 1 - Math.abs(x + 2) / 56);
      leaf(c, x, r.range(top + 2, 0), r.range(10, 15), r.range(2.6, 3.6), r.range(-Math.PI, Math.PI), r.pick(cols));
    }
    // broom (jhadu)
    const bx = v ? -40 : 38;
    stick(c, [P2(bx, -4), P2(bx + (v ? -6 : 6), -42)], 3, mix(P.chandan, P.haldi, 0.3));
    for (let k = 0; k < 7; k++) taperStroke(c, [P2(bx, -4), P2(bx - 8 + k * 2.6, 6)], 1.4, mix(P.chandan, P.haldi, 0.2), 1, [1, 0.3]);
    dab(c, bx, -6, 3.6, 2, 0, P.sindoor, 1);
  },
});

// handcart (wide): a painted thela with sacks or coconuts.
def('handcart', {
  arch: 'wide', n: 2, m: [16, 24, 10],
  under: (c) => shadow(c, 50, 0.35),
  body: (c, r, v) => {
    const frame = mix(P.peacock, P.khondalite, 0.35);
    // handles
    stick(c, [P2(30, -24), P2(58, -30)], 2.6, frame);
    // load
    if (v === 0) {
      const sack = mix(P.chandan, P.skyCream, 0.35);
      for (const [x, y, rx] of [[-28, -36, 14], [-2, -38, 15], [22, -35, 12], [-14, -50, 13]]) {
        ps(c, r, E(c, x, y, rx, 10), [x - rx, y - 10, rx * 2, 20], sack);
        ln(c, [P2(x - rx * 0.5, y - 2), P2(x + rx * 0.5, y + 1)], 0.6, dk(sack, 0.4), 0.6);
      }
    } else {
      for (let i = 0; i < 9; i++) {
        const x = -34 + (i % 5) * 15 + (i > 4 ? 8 : 0), y = i > 4 ? -48 : -36;
        ps(c, r, E(c, x, y, 8.5, 7.5), [x - 8, y - 8, 17, 15], mix(P.tota, P.khondalite, r.range(0.05, 0.3)));
      }
      leaf(c, -40, -40, 22, 5, -2.8, LEAF);
    }
    ps(c, r, RR(c, -46, -28, 80, 6, 1), [-46, -28, 80, 6], frame);
    ln(c, [P2(-44, -26), P2(32, -26)], 0.8, lt(frame, 0.5), 0.6);
    stick(c, [P2(-42, -24), P2(-42, -2)], 2.4, frame);
    wheel(c, -6, -14, 13, { wood: mix(P.khondalite, P.limewhite, 0.3), dark: dk(P.khondalite, 0.5), spokes: 12, tyre: dk(P.khondalite, 0.4), thin: true });
  },
});

// pole (tall): three bamboo poles tied as a tripod, with garlands and pennants.
def('pole', {
  arch: 'tall', n: 2, m: [16, 14, 10],
  under: (c) => shadow(c, 30),
  body: (c, r, v) => {
    stick(c, [P2(-26, 2), P2(2, -120)], 4.6, BAMBOO);
    stick(c, [P2(26, 2), P2(-2, -120)], 4.6, mix(BAMBOO, P.ink, 0.1));
    stick(c, [P2(0, 2), P2(0, -124)], 4.6, mix(BAMBOO, P.limewhite, 0.1));
    rope(c, [P2(-5, -104), P2(5, -100)], 3, mix(P.chandan, P.khondalite, 0.2));
    // garlands looping down
    for (let g = 0; g < 2; g++) {
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, y0 = -80 + g * 30;
        const x = -18 + g * 4 + t * (36 - g * 8), y = y0 + Math.sin(t * Math.PI) * 10;
        marigold(c, x, y, 2.6, (i + g) % 3 ? P.marigold : P.haldi);
      }
    }
    // pennants
    const pc = v ? [P.neel, P.tota] : [P.tota, P.peacock];
    fill(c, PL(c, pts([[0, -124], [20, -118], [0, -110]])), pc[0]);
    fill(c, PL(c, pts([[-2, -108], [-18, -103], [-2, -96]])), pc[1]);
    // stone weights at the feet
    for (const x of [-26, 0, 26]) rock(c, r, x, -4, 6, 5, STONE);
  },
});

// coconut (roller): green tender coconut, or a husked brown one.
def('coconut', {
  arch: 'roller', n: 2, m: [14, 18, 8],
  under: (c) => shadow(c, 20),
  body: (c, r, v) => {
    if (v === 0) {
      const col = mix(P.tota, P.khondalite, 0.12);
      ps(c, r, SM(c, pts([[-20, -6], [-22, -26], [-12, -44], [4, -47], [18, -38], [22, -18], [12, -2]])), [-22, -47, 44, 46], col, { light: mix(P.tota, P.haldi, 0.45), shade: dk(col, 0.4) });
      taperStroke(c, curvePts(-4, -46, -2, -26, 4, -2, 8), 1.2, dk(col, 0.35), 0.5);
      dab(c, 0, -46, 6, 3, 0, mix(P.khondalite, P.chandan, 0.3), 1);
      for (let k = 0; k < 4; k++) dab(c, -4 + k * 2.6, -48, 1.4, 1.8, 0, mix(P.chandan, P.khondalite, 0.5), 1);
      dab(c, -10, -34, 5, 2.4, -0.7, P.limewhite, 0.3);
    } else {
      const col = mix(P.laterite, P.khondalite, 0.45);
      ps(c, r, E(c, 0, -23, 21, 20), [-21, -43, 42, 40], col);
      for (let i = 0; i < 26; i++) { const a = r.range(0, Math.PI * 2), rr = r.range(4, 18); const x = Math.cos(a) * rr, y = -23 + Math.sin(a) * rr; taperStroke(c, [P2(x, y), P2(x + r.range(-3, 3), y + r.range(3, 7))], 0.9, r.chance(0.5) ? lt(col, 0.35) : dk(col, 0.4), 0.8); }
      for (const [x, y] of [[-12, -30], [-6, -33], [-9, -25]]) dab(c, x, y, 1.6, 1.6, 0, dk(col, 0.6), 1);
    }
  },
});

// puddle (wide): a muddy ring with a rain puddle and a frog.
def('puddle', {
  arch: 'wide', n: 2, m: [14, 26, 10],
  body: (c, r, v) => {
    const mud = mix(P.laterite, P.khondalite, 0.55);
    ps(c, r, SM(c, pts([[-56, 2], [-50, -14], [-36, -20], [-16, -14], [0, -12], [18, -14], [38, -21], [52, -14], [56, 2]])), [-56, -21, 112, 23], mud);
    const water = E(c, 0, -9, 40, 5.5);
    fill(c, water, mix(P.seafoam, P.neel, 0.35));
    clipTo(c, water, () => { taperStroke(c, [P2(-30, -10), P2(10, -10)], 2, P.limewhite, 0.55); taperStroke(c, [P2(14, -8), P2(30, -8)], 1.4, P.limewhite, 0.4); });
    // splash crown
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      const x = -6 + Math.cos(a) * 9, y = -11 + Math.sin(a) * 8;
      taperStroke(c, [P2(-6 + Math.cos(a) * 5, -10), P2(x, y)], 1.8, mix(P.seafoam, P.limewhite, 0.4), 1, [1, 0.3]);
      dab(c, x, y - 2, 1.6, 1.8, 0, P.limewhite, 1);
    }
    if (v === 1) {
      const fr = mix(P.tota, P.khondalite, 0.2);
      dab(c, 42, -24, 7, 5, 0, fr, 1);
      dab(c, 38, -28, 2.2, 2.2, 0, P.limewhite, 1);
      dab(c, 38, -28, 1, 1, 0, P.ink, 1);
      dab(c, 45, -28, 2.2, 2.2, 0, P.limewhite, 1);
      dab(c, 45, -28, 1, 1, 0, P.ink, 1);
      taperStroke(c, curvePts(37, -22, 42, -20, 46, -22, 4), 0.8, dk(fr, 0.4), 1);
    } else tuft(c, r, 44, -18, 10, LEAFL, 5);
  },
});

// dune (wide): wind-rippled sand with spinifex and beach morning glory.
def('dune', {
  arch: 'wide', n: 2, m: [14, 18, 10],
  under: (c) => shadow(c, 56, 0.25),
  body: (c, r, v) => {
    const path = SM(c, pts([[-58, 2], [-46, -8], [-26, -26], [-12, -32], [8, -28], [34, -16], [58, 2]]));
    ps(c, r, path, [-58, -32, 116, 34], SAND, { light: P.skyCream, shade: mix(SAND, P.laterite, 0.35) });
    clipTo(c, path, () => { for (let i = 0; i < 8; i++) taperStroke(c, curvePts(-50 + i * 6, -4 - i * 2.5, -10 + i * 6, -14 - i * 2, 40 + i * 2, -6 - i, 8), 1, dk(SAND, 0.3), 0.45); });
    tuft(c, r, -24, -26, 14, mix(P.tota, P.khondalite, 0.3), 7);
    tuft(c, r, 22, -20, 10, mix(P.tota, P.khondalite, 0.2), 5);
    if (v === 1) tuft(c, r, 2, -30, 12, mix(P.tota, P.khondalite, 0.3), 6);
    // creeper with pink trumpets
    const vine = curvePts(-44, -6, -10, -20, 40, -8, 10);
    taperStroke(c, vine, 1.4, LEAF, 1);
    for (let i = 1; i < vine.length; i += 2) {
      leaf(c, vine[i].x, vine[i].y, 6, 3, -1.2 + (i % 4) * 0.6, LEAF);
      if (i % 4 === 1) { dab(c, vine[i].x + 2, vine[i].y - 3, 3, 3, 0, mix(P.rani, P.limewhite, 0.4), 1); dab(c, vine[i].x + 2, vine[i].y - 3, 1, 1, 0, P.limewhite, 1); }
    }
  },
});

// foam (pit): a scooped tidal hollow lined with lacy foam.
def('foam', {
  arch: 'pit', n: 2, rim: RC, m: [14, 22, 16],
  body: (c, r, v) => {
    const wet = mix(SAND, P.khondalite, 0.45);
    for (const sx of [-1, 1]) ps(c, r, SM(c, pts([[24, 2], [32, -10], [46, -15 - v * 3], [58, -10], [64, 2]], sx, 1)), [sx > 0 ? 24 : -64, -18, 40, 20], SAND, { light: P.skyCream });
    const hole = SM(c, pts([[-42, 0], [-30, -4], [0, -5], [30, -4], [42, 0], [32, 8], [0, 12], [-32, 8]]));
    fill(c, hole, dk(wet, 0.4));
    clipTo(c, hole, () => {
      fill(c, E(c, 0, 6, 38, 7), mix(P.seafoam, P.neel, 0.3));
      taperStroke(c, [P2(-24, 4), P2(18, 4.6)], 1.6, P.limewhite, 0.6);
    });
    // foam lace along the rims
    for (const sx of [-1, 1]) for (let i = 0; i < 12; i++) {
      const t = r.range(0, 1);
      dab(c, sx * (30 + t * 14), -2 - t * 9, r.range(2, 4), r.range(1.4, 2.6), 0, P.limewhite, 1);
    }
    for (let i = 0; i < 14; i++) dab(c, r.range(-38, 38), r.range(-2, 2), r.range(2, 4), 1.6, 0, P.limewhite, 0.9);
  },
});

// =============================================================================
// Act III — Gajapati (lead sindoor)
// =============================================================================

function jumbo(c: Ctx, r: Rng, x: number, y: number, s: number, o: { phase?: number; baby?: boolean; deco?: boolean }): void {
  c.save(); c.translate(x, y); c.scale(s, s);
  const col = mix(P.khondalite, P.neel, 0.14), sh = dk(col, 0.3), li = lt(col, 0.35);
  const sw = Math.sin(o.phase ?? 0.6) * 4;
  const leg = (lx: number, swing: number, lc: string) => {
    taperStroke(c, [P2(lx, -36), P2(lx + swing * 0.4, -16), P2(lx + swing, -2)], 13, lc, 1, [1, 0.95]);
    dab(c, lx + swing, -2.5, 6.4, 2.6, 0, lt(col, 0.3), 1);
  };
  leg(-10, sw, sh); leg(26, -sw, sh);
  taperStroke(c, curvePts(36, -50, 44, -40, 42, -24, 6), 2.6, sh, 1, [1, 0.4]);
  const body = SM(c, pts([[-26, -30], [-28, -56], [-6, -70], [22, -68], [38, -52], [36, -32], [10, -24]]));
  ps(c, r, body, [-28, -70, 66, 46], col, { light: li, shade: sh });
  leg(-18, -sw, col); leg(18, sw, col);
  // head, trunk (curled), ear
  ps(c, r, E(c, -30, -56, 16, 16), [-46, -72, 32, 32], col, { light: li, shade: sh });
  taperStroke(c, [P2(-40, -50), P2(-46, -36), P2(-46, -22), P2(-52, -16), P2(-56, -20)], 9, col, 1, [1, 0.5]);
  for (let k = 0; k < 4; k++) ln(c, [P2(-48, -42 + k * 6), P2(-42, -42 + k * 6)], 0.7, sh, 0.6);
  ps(c, r, SM(c, pts([[-26, -66], [-12, -70], [-6, -56], [-10, -40], [-22, -42]])), [-26, -70, 20, 30], lt(col, 0.08), { light: li, shade: sh });
  fill(c, SM(c, pts([[-22, -62], [-12, -64], [-9, -54], [-12, -45], [-20, -47]])), mix(P.chandan, P.rani, 0.25), 0.3);
  stroke(c, SM(c, pts([[-26, -66], [-12, -70], [-6, -56], [-10, -40], [-22, -42]])), sh, 1.2, 0.8);
  dab(c, -36, -60, 2.6, 3, 0, P.ink, 1);
  dab(c, -36.8, -61.2, 0.9, 0.9, 0, P.limewhite, 1);
  dab(c, -40, -52, 3, 2, 0, P.rani, 0.25);
  if (o.deco) {
    // painted forehead dots (festive, not a caparison)
    for (let k = 0; k < 5; k++) dab(c, -40 + k * 1.6, -68 + Math.abs(k - 2) * 1.6, 1.3, 1.3, 0, k % 2 ? P.haldi : P.limewhite, 1);
  }
  c.restore();
}
def('elephantHerd', {
  arch: 'walker', n: 2, m: [16, 12, 10],
  under: (c) => shadow(c, 56, 0.35),
  body: (c, r, v) => {
    jumbo(c, r, 40, 0, 0.5, { baby: true, phase: 2 + v });
    jumbo(c, r, -4, 0, 0.98, { deco: v === 1, phase: v });
  },
});

// banner (tall): Pipili-appliqué banner on a bamboo pole (indigo field).
def('banner', {
  arch: 'tall', n: 2, m: [18, 16, 10],
  under: (c) => shadow(c, 24),
  body: (c, r, v) => {
    stick(c, [P2(-18, 2), P2(-18, -126)], 4.2, BAMBOO);
    dab(c, -18, -128, 3.4, 3.4, 0, mix(P.haldi, P.khondalite, 0.3), 1);
    stick(c, [P2(-20, -116), P2(24, -116)], 2.6, BAMBOO);
    const field = v ? mix(P.tota, P.ink, 0.15) : P.neel;
    const cloth = PL(c, pts([[-14, -114], [22, -114], [22, -34], [12, -42], [4, -34], [-6, -42], [-14, -34]]));
    ps(c, r, cloth, [-14, -114, 36, 80], field, { from: 'left' });
    clipTo(c, cloth, () => {
      stroke(c, PL(c, pts([[-11, -111], [19, -111], [19, -40], [-11, -40]])), P.haldi, 2.4);
      for (let k = 0; k < 3; k++) {
        const y = -96 + k * 22;
        for (let p = 0; p < 8; p++) { const a = (p / 8) * Math.PI * 2; dab(c, 4 + Math.cos(a) * 5, y + Math.sin(a) * 5, 2.4, 1.4, a, k === 1 ? P.limewhite : P.haldi, 1); }
        dab(c, 4, y, 2.2, 2.2, 0, v ? P.neel : P.tota, 1);
        dab(c, 4, y, 0.9, 0.9, 0, P.limewhite, 1);
      }
    });
    for (let k = 0; k < 5; k++) taperStroke(c, [P2(-12 + k * 8, -36), P2(-12 + k * 8, -28)], 2, P.haldi, 1, [1, 0.3]);
    // stone weight + ties at foot
    rock(c, r, -18, -5, 12, 7, STONE);
    tuft(c, r, -2, -1, 8, LEAFL, 4);
  },
});

// flowerHeap (small): a heap of marigolds and jasmine strings on a mat.
def('flowerHeap', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 28),
  body: (c, r, v) => {
    fill(c, E(c, 0, -2, 28, 4), mix(P.chandan, P.haldi, 0.3));
    const heap = SM(c, pts([[-26, -2], [-20, -24], [-8, -50], [6, -54], [18, -28], [26, -2]]));
    fill(c, heap, dk(P.marigold, 0.35));
    for (let i = 0; i < 46; i++) {
      const y = r.range(-52, -4);
      const half = 26 * (1 - (-y) / 58);
      marigold(c, r.range(-half, half), y, r.range(3, 4.4), r.chance(v ? 0.55 : 0.25) ? P.haldi : P.marigold);
    }
    // jasmine strings draped
    for (let g = 0; g < 2; g++) {
      const p = curvePts(-18 + g * 8, -40 + g * 16, 0, -24 + g * 16, 20 - g * 4, -42 + g * 18, 10);
      for (const q of p) dab(c, q.x, q.y, 1.8, 1.8, 0, P.limewhite, 1);
    }
    for (const a of [-2.8, -0.3, -1.5]) leaf(c, 0, -52, 10, 3, a, LEAF);
  },
});

// rope (wide): a coiled thick coir rope.
def('rope', {
  arch: 'wide', n: 2, m: [16, 16, 10],
  under: (c) => shadow(c, 50, 0.35),
  body: (c, _r, v) => {
    const col = mix(P.chandan, P.laterite, 0.3);
    rope(c, curvePts(-58, -2, -46, -8, -32, -4, 6), 6.4, col);
    const ring = (y: number, rx: number, ry: number, a0: number, a1: number, cc: string) => {
      const p: Pt[] = [];
      for (let i = 0; i <= 16; i++) { const a = a0 + (i / 16) * (a1 - a0); p.push(P2(Math.cos(a) * rx, y + Math.sin(a) * ry)); }
      rope(c, p, 6.2, cc);
    };
    // back halves first (darker), then the front halves, bottom layer up
    for (let k = 0; k < 4; k++) ring(-6 - k * 6, 36 - k * 3, 9 - k * 0.6, Math.PI, Math.PI * 2, dk(col, 0.22));
    fill(c, E(c, 0, -26, 20, 4.6), dk(col, 0.6));
    for (let k = 0; k < 4; k++) ring(-6 - k * 6, 36 - k * 3, 9 - k * 0.6, 0, Math.PI, k % 2 ? lt(col, 0.1) : col);
    rope(c, curvePts(30, -26, 46, -22, 58 - v * 6, -2, 6), 6.4, lt(col, 0.05));
  },
});

// root (small): a gnarled forest root arching out of the path.
def('root', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const col = mix(P.laterite, P.khondalite, 0.55);
    taperStroke(c, [P2(-28, 2), P2(-24, -30), P2(-6, -52), P2(12, -46), P2(22, -20), P2(26, 2)], 13, col, 1, [1, 0.6]);
    taperStroke(c, [P2(-26, 0), P2(-22, -28), P2(-6, -48), P2(10, -44)], 3, lt(col, 0.3), 0.7, [0.3, 0.3]);
    taperStroke(c, curvePts(-6, -50, -20, -60, -10, -70 + v * 4, 6), 6, col, 1, [1, 0.2]);
    taperStroke(c, curvePts(20, -20, 32, -14, 34, 2, 6), 6, dk(col, 0.1), 1, [1, 0.3]);
    for (let i = 0; i < 5; i++) dab(c, r.range(-20, 14), r.range(-50, -30), r.range(2, 3.4), r.range(1.4, 2), 0, mix(P.tota, P.khondalite, 0.3), 0.85);
    // mushrooms
    stick(c, [P2(-12, 0), P2(-12, -6)], 2, CREAM);
    fill(c, E(c, -12, -7, 4.4, 2.6), mix(P.chandan, P.laterite, 0.3));
  },
});

// log (wide): a fallen log with a ringed cut end facing the runner.
def('log', {
  arch: 'wide', n: 2, m: [14, 20, 10],
  under: (c) => shadow(c, 54, 0.35),
  body: (c, r, v) => {
    const bark = BARK;
    ps(c, r, RR(c, -46, -32, 96, 32, 14), [-46, -32, 96, 32], bark);
    clipTo(c, RR(c, -46, -32, 96, 32, 14), () => {
      for (let i = 0; i < 16; i++) { const y = r.range(-30, -2); const x = r.range(-40, 40); taperStroke(c, [P2(x, y), P2(x + r.range(12, 26), y + r.range(-1, 1))], r.range(1, 2), r.chance(0.5) ? dk(bark, 0.4) : lt(bark, 0.25), 0.7); }
      dab(c, 10, -30, 22, 4, 0, mix(P.tota, P.khondalite, 0.25), 0.8);
    });
    // cut end
    const end = mix(P.chandan, P.haldi, 0.15);
    fill(c, E(c, -46, -16, 9, 16), dk(bark, 0.2));
    fill(c, E(c, -46, -16, 7.4, 14), end);
    for (let k = 1; k < 4; k++) stroke(c, E(c, -46, -16, 7.4 * k / 4, 14 * k / 4), dk(end, 0.35), 0.7, 0.8);
    // branch stub with leaves
    stick(c, [P2(20, -28), P2(28, -44)], 4, bark);
    if (v === 0) for (const a of [-2.2, -1.2, -0.4]) leaf(c, 28, -44, 12, 4, a, LEAF);
    stick(c, [P2(36, -4), P2(36, -10)], 2, CREAM);
    fill(c, E(c, 36, -11, 4.6, 2.6), mix(P.chandan, P.laterite, 0.25));
  },
});

// branch (floater): a broken leafy branch.
def('branch', {
  arch: 'floater', n: 2, m: [18, 14, 14],
  body: (c, r, v) => {
    const col = BARK;
    stick(c, curvePts(-38, 12, -2, 0, 36, -12, 10), 4.6, col);
    stick(c, curvePts(-8, 3, -2, -10, 6, -18, 6), 2.6, col);
    stick(c, curvePts(14, -5, 22, 4, 30, 8, 6), 2.4, col);
    const cols = [LEAF, LEAFD, LEAFL];
    for (let i = 0; i < 14 + v * 3; i++) {
      const t = r.range(0.2, 1);
      const x = -38 + t * 74 + r.range(-6, 6), y = 12 - t * 24 + r.range(-10, 10);
      leaf(c, x, y, r.range(11, 16), r.range(3.4, 4.6), r.range(-Math.PI, Math.PI), r.pick(cols));
    }
    // broken splintered end
    for (let k = 0; k < 3; k++) taperStroke(c, [P2(-38, 12), P2(-44, 10 + k * 3)], 1.6, mix(P.chandan, P.haldi, 0.2), 1, [1, 0.2]);
  },
});

// =============================================================================
// Act IV — Company & Resistance (sepia + faded indigo, strong rims)
// =============================================================================

def('tollgate', {
  arch: 'tall', n: 2, rim: RC, m: [18, 14, 10],
  under: (c) => shadow(c, 30),
  body: (c, r, v) => {
    const wood = t4(WOOD, 0.45), wd = t4(WOODD, 0.3);
    for (const x of [-22, 22]) { ps(c, r, RR(c, x - 4, -104, 8, 106, 1), [x - 4, -104, 8, 106], wood, { from: 'left' }); grain(c, r, x - 4, -104, 8, 106, wd, 3); }
    // little plank roof
    fill(c, PL(c, pts([[-32, -100], [0, -118], [32, -100], [28, -96], [0, -112], [-28, -96]])), t4(mix(P.laterite, P.khondalite, 0.4), 0.4));
    ps(c, r, RR(c, -28, -100, 56, 6, 1), [-28, -100, 56, 6], wood);
    // striped bar
    const bar = RR(c, -28, -56, 56, 8, 2);
    fill(c, bar, PAPER);
    clipTo(c, bar, () => { for (let k = -2; k < 7; k++) fill(c, PL(c, pts([[-28 + k * 10, -48], [-22 + k * 10, -56], [-17 + k * 10, -56], [-23 + k * 10, -48]])), IND4); });
    // X-brace
    stick(c, [P2(-20, -46), P2(20, -6)], 3, wood, wd);
    stick(c, [P2(20, -46), P2(-20, -6)], 3, wood, wd);
    // hanging lantern
    ln(c, [P2(v ? 10 : 0, -96), P2(v ? 10 : 0, -86)], 0.8, P.ink, 0.8);
    const lx = v ? 10 : 0;
    ps(c, r, RR(c, lx - 4, -86, 8, 11, 2), [lx - 4, -86, 8, 11], t4(mix(P.haldi, P.chandan, 0.4), 0.3));
    fill(c, RR(c, lx - 4.4, -87.5, 8.8, 2, 1), wd);
  },
  over: (c, _r, v) => glow(c, v ? 10 : 0, -80, 12, mix(P.haldi, DERIVED.sepia, 0.3), 0.45),
});

def('pothole', {
  arch: 'pit', n: 2, rim: RC, m: [14, 22, 16],
  body: (c, r, v) => {
    const road = t4(mix(P.laterite, P.khondalite, 0.35), 0.45);
    for (let i = 0; i < 7; i++) {
      const sx = i % 2 ? 1 : -1, x = sx * r.range(32, 52);
      const s = r.range(4, 8 + v * 2);
      fill(c, PL(c, [P2(x - s, 1), P2(x - s * 0.4, -s * 1.4 - 4), P2(x + s, -s * 0.8), P2(x + s * 0.8, 1)]), r.pick([road, lt(road, 0.15), dk(road, 0.15)]));
    }
    for (const sx of [-1, 1]) ps(c, r, SM(c, pts([[28, 2], [36, -8], [46, -12 - v * 3], [56, -6], [62, 2]], sx, 1)), [sx > 0 ? 28 : -62, -16, 34, 18], road);
    const hole = SM(c, pts([[-40, 0], [-24, -4], [4, -5], [30, -3], [40, 0], [28, 8], [0, 11], [-30, 7]]));
    fill(c, hole, dk(road, 0.55));
    clipTo(c, hole, () => {
      fill(c, E(c, 0, -2, 42, 5), dk(road, 0.25));
      fill(c, E(c, 2, 7, 32, 4), mix(IND4, P.ink, 0.25));
      taperStroke(c, [P2(-16, 6), P2(12, 6.4)], 1.4, PAPER, 0.5);
    });
  },
});

def('stump', {
  arch: 'small', n: 2, rim: RC,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const bark = t4(BARK, 0.35);
    const trunk = SM(c, pts([[-28, 2], [-20, -6], [-18, -40], [18, -44], [20, -8], [30, 2]]));
    ps(c, r, trunk, [-28, -46, 58, 48], bark, { from: 'left' });
    clipTo(c, trunk, () => { for (let i = 0; i < 9; i++) { const x = r.range(-16, 16); taperStroke(c, [P2(x, -42), P2(x + r.range(-2, 2), -4)], r.range(1, 2), r.chance(0.5) ? dk(bark, 0.35) : lt(bark, 0.2), 0.7); } });
    const top = t4(mix(P.chandan, P.haldi, 0.2), 0.35);
    fill(c, E(c, 0, -42, 18.5, 5.4, -0.08), top);
    for (let k = 1; k < 4; k++) stroke(c, E(c, 0.5, -42, 18 * k / 4, 5.2 * k / 4, -0.08), dk(top, 0.35), 0.6, 0.8);
    // sprout
    stick(c, curvePts(16, -30, 22, -36, 24, -46, 5), 1.2, t4(LEAF, 0.4));
    leaf(c, 24, -46, 9, 3, -0.8, t4(LEAFL, 0.35));
    leaf(c, 22, -40, 8, 2.6, -2.6, t4(LEAF, 0.35));
    if (v === 1) { stick(c, [P2(-16, 0), P2(-16, -6)], 2, PAPER); fill(c, E(c, -16, -7, 4.4, 2.4), t4(P.laterite, 0.4)); }
  },
});

def('boulder', {
  arch: 'roller', n: 2, rim: RC, m: [14, 18, 8],
  under: (c) => shadow(c, 20),
  body: (c, r, v) => {
    const col = t4(mix(P.khondalite, P.neel, 0.1), 0.25);
    rock(c, r, 0, -24, 23, 23, col, false);
    for (let i = 0; i < 6 + v * 4; i++) dab(c, r.range(-14, 14), r.range(-44, -34), r.range(1.4, 3), r.range(1, 2), 0, t4(mix(P.tota, P.limewhite, 0.3), 0.4), 0.8);
  },
});

def('shrub', {
  arch: 'small', n: 2, rim: mix(DERIVED.sepia, P.ink, 0.6),
  under: (c) => shadow(c, 24, 0.3),
  body: (c, r, v) => {
    const twig = mix(DERIVED.sepia, P.ink, 0.25);
    fill(c, SM(c, pts([[-20, 0], [-22, -18], [-10, -36], [8, -38], [20, -20], [20, 0]])), mix(DERIVED.sepia, P.khondalite, 0.55), 0.9);
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI / 2 + r.range(-1.1, 1.1);
      const l = r.range(22, 48);
      const p = curvePts(r.range(-4, 4), 0, Math.cos(a) * l * 0.4, Math.sin(a) * l * 0.5, Math.cos(a) * l * 0.7, Math.sin(a) * l, 6);
      taperStroke(c, p, 1.8, twig, 1, [1, 0.2]);
    }
    for (let i = 0; i < 10 + v * 6; i++) leaf(c, r.range(-20, 20), r.range(-44, -12), 5, 2, r.range(-3, 0), mix(DERIVED.sepia, P.tota, 0.2));
  },
});

// newsprint (floater): flying newspaper sheets (column lines, no letters).
function sheet(c: Ctx, x: number, y: number, w: number, h: number, rot: number, bend: number, col: string, lines: string): void {
  c.save(); c.translate(x, y); c.rotate(rot);
  const path = () => { c.beginPath(); c.moveTo(-w / 2, -h / 2); c.quadraticCurveTo(0, -h / 2 - bend, w / 2, -h / 2); c.lineTo(w / 2, h / 2); c.quadraticCurveTo(0, h / 2 - bend, -w / 2, h / 2); c.closePath(); };
  fill(c, path, col);
  clipTo(c, path, () => {
    fill(c, RR(c, -w / 2 + 3, -h / 2 + 2 - bend * 0.5, w - 6, 3.6, 0), lines, 0.85);
    const cols = 3, cw = (w - 8) / cols;
    for (let k = 0; k < cols; k++) for (let j = 0; j < 7; j++) {
      const yy = -h / 2 + 9 + j * 2.6 - bend * 0.4;
      ln(c, [P2(-w / 2 + 4 + k * cw, yy), P2(-w / 2 + 2 + (k + 1) * cw - 1, yy)], 0.7, lines, 0.55);
    }
    fill(c, RR(c, w / 2 - cw - 2, h / 2 - 9 - bend * 0.3, cw - 1, 6, 0), lines, 0.35);
    const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, withAlpha(P.ink, 0.15)); g.addColorStop(0.5, withAlpha(P.ink, 0)); g.addColorStop(1, withAlpha(P.ink, 0.12));
    c.fillStyle = g; c.fillRect(-w / 2, -h, w, h * 2);
  });
  c.restore();
}
def('newsprint', {
  arch: 'floater', n: 2, rim: RC,
  body: (c, _r, v) => {
    sheet(c, 16, 6, 30, 22, 0.5 + v * 0.2, 4, lt(PAPER, 0.1), IND4);
    sheet(c, -8, -2, 42, 30, -0.25 - v * 0.15, -5, PAPER, mix(IND4, P.ink, 0.3));
  },
});

def('typeCrate', {
  arch: 'small', n: 2, rim: RC,
  under: (c) => shadow(c, 28),
  body: (c, r, v) => {
    const wood = t4(WOOD, 0.45);
    box3(c, r, -26, 0, 46, 30, 6, wood);
    grain(c, r, -26, -30, 46, 30, t4(WOODD, 0.3), 6);
    for (const x of [-26, 18]) fill(c, RR(c, x, -30, 2.4, 30, 0), mix(STEEL, DERIVED.sepia, 0.3));
    // open type case on top, tilted
    c.save(); c.translate(-2, -30); c.rotate(-0.06 + v * 0.1);
    ps(c, r, RR(c, -22, -20, 44, 20, 1), [-22, -20, 44, 20], dk(wood, 0.05));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      fill(c, RR(c, -19 + i * 10, -17 + j * 8.4, 8, 6.6, 0.5), dk(wood, 0.5));
      for (let k = 0; k < 4; k++) dab(c, -17 + i * 10 + (k % 2) * 3.4, -15.4 + j * 8.4 + Math.floor(k / 2) * 2.6, 1.2, 0.9, 0, mix(STEEL, P.limewhite, 0.3), 0.9);
    }
    c.restore();
    dab(c, -12, -6, 5, 2.4, 0.2, IND4, 0.8);
  },
});

def('paperBundle', {
  arch: 'wide', n: 2, rim: RC, m: [14, 20, 10],
  under: (c) => shadow(c, 54, 0.3),
  body: (c, r, v) => {
    const twine = t4(mix(P.chandan, P.laterite, 0.3), 0.3);
    const bundle = (x: number, y: number, w: number, h: number, col: string) => {
      box3(c, r, x, y, w, h, 5, col);
      for (let k = 2; k < h; k += 2.2) ln(c, [P2(x + 1, y - k), P2(x + w - 1, y - k)], 0.5, dk(col, 0.3), 0.5);
      fill(c, RR(c, x + w * 0.3, y - h, 2, h, 0), twine);
      fill(c, RR(c, x + w * 0.68, y - h, 2, h, 0), twine);
    };
    bundle(-52, 0, 44, 18, PAPER);
    bundle(-4, 0, 48, 22, lt(PAPER, 0.1));
    bundle(-30 + v * 10, -20, 42, 14, mix(PAPER, IND4, 0.25));
    dab(c, -2 + v * 10, -36, 4, 2.2, 0, twine, 1);
  },
});

def('inkBarrel', {
  arch: 'roller', n: 2, rim: RC, m: [14, 18, 8],
  under: (c) => shadow(c, 20),
  body: (c, r, v) => {
    const wood = t4(WOOD, 0.45);
    const head = E(c, 0, -24, 22, 22);
    ps(c, r, head, [-22, -46, 44, 44], wood);
    clipTo(c, head, () => {
      for (let k = -3; k <= 3; k++) ln(c, [P2(-24, -24 + k * 6.6), P2(24, -24 + k * 6.6)], 0.8, t4(WOODD, 0.3), 0.8);
      // ink running down from the bung
      const ink = mix(P.neel, P.ink, 0.45);
      taperStroke(c, curvePts(6, -40, 8, -30, 6, -18 - v * 4, 6), 3.6, ink, 0.95, [1, 0.6]);
      dab(c, 6, -17 - v * 4, 2.6, 2.6, 0, ink, 0.95);
      taperStroke(c, curvePts(-4, -42, -6, -36, -5, -30, 4), 2.4, ink, 0.9, [1, 0.6]);
    });
    stroke(c, E(c, 0, -24, 20.5, 20.5), mix(STEEL, DERIVED.sepia, 0.3), 3.4);
    stroke(c, E(c, 0, -24, 15, 15), dk(wood, 0.35), 0.8, 0.7);
    dab(c, 5, -40, 3.2, 3.2, 0, dk(wood, 0.6), 1);
  },
});

def('chair', {
  arch: 'small', n: 2, rim: RC,
  under: (c) => shadow(c, 24),
  body: (c, r, v) => {
    const wood = t4(mix(P.laterite, P.ink, 0.15), 0.4);
    const legs = [[-16, 2, -16, -32], [14, 2, 14, -32], [-10, -1, -10, -30], [19, -1, 19, -30]];
    legs.forEach(([x0, y0, x1, y1], i) => stick(c, [P2(x0, y0), P2(x1, y1)], 3, i > 1 ? dk(wood, 0.2) : wood));
    // cane seat
    const seat = PL(c, pts([[-20, -32], [-12, -38], [22, -38], [18, -32]]));
    fill(c, seat, t4(mix(P.haldi, P.chandan, 0.5), 0.4));
    clipTo(c, seat, () => { for (let k = -24; k < 26; k += 3) { ln(c, [P2(k, -40), P2(k + 6, -30)], 0.5, dk(wood, 0.2), 0.6); ln(c, [P2(k + 6, -40), P2(k, -30)], 0.5, dk(wood, 0.2), 0.6); } });
    ps(c, r, RR(c, -21, -33, 40, 3.4, 1), [-21, -33, 40, 3.4], wood);
    // back
    stick(c, [P2(-16, -34), P2(-18, -76)], 3, wood);
    stick(c, [P2(14, -36), P2(14, -76)], 3, wood);
    ps(c, r, RR(c, -22, -80, 40, 7, 3), [-22, -80, 40, 7], wood);
    for (const x of [-8, 0, 7]) stick(c, [P2(x, -40), P2(x, -72)], 1.6, wood);
    // a shawl over the back
    if (v === 0) fill(c, PL(c, pts([[-20, -78], [16, -78], [18, -58], [10, -50], [4, -60], [-6, -52], [-18, -60]])), IND4);
    else { fill(c, E(c, 0, -42, 12, 4), t4(P.limewhite, 0.4)); dab(c, 0, -46, 8, 3, 0, PAPER, 1); }
  },
});

def('bench', {
  arch: 'wide', n: 2, rim: RC, m: [14, 22, 10],
  under: (c) => shadow(c, 52, 0.3),
  body: (c, r, v) => {
    const wood = t4(mix(P.laterite, P.ink, 0.12), 0.4);
    for (const x of [-44, 40]) { stick(c, [P2(x - 6, 2), P2(x, -28)], 3.2, wood); stick(c, [P2(x + 6, 2), P2(x, -28)], 3.2, dk(wood, 0.15)); }
    stick(c, [P2(-42, -12), P2(40, -12)], 2.4, dk(wood, 0.15));
    ps(c, r, RR(c, -56, -32, 112, 6, 1.5), [-56, -32, 112, 6], wood);
    grain(c, r, -56, -32, 112, 6, dk(wood, 0.3), 5);
    if (v === 0) {
      // a folded umbrella and a hat
      stick(c, [P2(-30, -36), P2(6, -40)], 3, mix(IND4, P.ink, 0.3));
      ps(c, r, E(c, 26, -36, 10, 4), [16, -40, 20, 8], PAPER);
      ps(c, r, E(c, 26, -40, 6, 4), [20, -44, 12, 8], PAPER);
    } else {
      ps(c, r, RR(c, -20, -42, 26, 10, 1), [-20, -42, 26, 10], PAPER);
      for (let k = 0; k < 4; k++) ln(c, [P2(-19, -40 + k * 2.2), P2(5, -40 + k * 2.2)], 0.5, IND4, 0.6);
    }
  },
});

def('bannerPole', {
  arch: 'tall', n: 2, rim: RC, m: [18, 14, 10],
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const wood = t4(BAMBOO, 0.45);
    stick(c, [P2(-16, 2), P2(-16, -126)], 4, wood);
    stick(c, [P2(-18, -114), P2(24, -114)], 2.4, wood);
    const cloth = PL(c, pts([[-12, -112], [22, -112], [22, -44], [-12, -44]]));
    ps(c, r, cloth, [-12, -112, 34, 68], v ? PAPER : IND4, { from: 'left' });
    clipTo(c, cloth, () => {
      stroke(c, PL(c, pts([[-9, -109], [19, -109], [19, -47], [-9, -47]])), v ? IND4 : PAPER, 2);
      for (let k = 0; k < 3; k++) dab(c, 5, -92 + k * 20, 6, 6, 0, v ? IND4 : PAPER, 0.85);
      for (let k = 0; k < 3; k++) dab(c, 5, -92 + k * 20, 2.4, 2.4, 0, v ? PAPER : IND4, 1);
    });
    for (let k = 0; k < 7; k++) taperStroke(c, [P2(-11 + k * 5.4, -44), P2(-11 + k * 5.4, -38)], 1.2, PAPER, 1, [1, 0.3]);
    // guy rope + stones
    ln(c, [P2(-16, -100), P2(-34, 0)], 0.9, t4(P.chandan, 0.3), 0.9);
    rock(c, r, -16, -5, 12, 7, t4(STONE, 0.3));
  },
});

def('wheelRim', {
  arch: 'roller', n: 2, rim: RC, m: [14, 18, 8],
  under: (c) => shadow(c, 20),
  body: (c, _r, v) => {
    if (v === 0) {
      wheel(c, 0, -24, 23, { wood: mix(STEEL, P.limewhite, 0.35), dark: mix(P.neel, P.ink, 0.5), spokes: 24, tyre: mix(DERIVED.sepia, P.ink, 0.55), thin: true, hub: PAPER });
      stroke(c, E(c, 0, -24, 18.6, 18.6), mix(STEEL, P.limewhite, 0.4), 1.6);
    } else {
      wheel(c, 0, -24, 23, { wood: t4(WOOD, 0.45), dark: t4(WOODD, 0.2), spokes: 10, tyre: mix(STEEL, DERIVED.sepia, 0.3) });
    }
  },
});

def('lampStand', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 22),
  body: (c, r, v) => {
    const brass = mix(P.haldi, P.laterite, 0.38);
    const bs = { light: mix(P.haldi, P.limewhite, 0.35), shade: mix(P.laterite, P.ink, 0.3) };
    ps(c, r, E(c, 0, -4, 20, 5), [-20, -9, 40, 10], brass, bs);
    ps(c, r, PL(c, pts([[-10, -6], [10, -6], [5, -16], [-5, -16]])), [-10, -16, 20, 10], brass, bs);
    ps(c, r, RR(c, -3.6, -58, 7.2, 44, 2), [-4, -58, 8, 44], brass, { ...bs, from: 'left' });
    for (const y of [-26, -40, -50]) ps(c, r, E(c, 0, y, 7, 3.4), [-7, y - 3.4, 14, 7], brass, bs);
    // top dish with wick-lamps
    ps(c, r, SM(c, pts([[-18, -62], [18, -62], [12, -56], [-12, -56]])), [-18, -62, 36, 6], brass, bs);
    for (let k = 0; k < 5 - v * 2; k++) {
      const x = -12 + k * (24 / (4 - v * 2));
      taperStroke(c, curvePts(x, -62, x - 1.4, -67, x, -72, 5), 3.6, P.marigold, 1, [1, 0.1]);
      dab(c, x, -64.5, 1, 1.6, 0, P.haldi, 1);
    }
  },
  over: (c) => glow(c, 0, -66, 22, P.marigold, 0.35),
});

def('newspapers', {
  arch: 'wide', n: 2, rim: RC, m: [14, 22, 10],
  under: (c) => shadow(c, 52, 0.3),
  body: (c, r, v) => {
    const col = lt(PAPER, 0.08);
    for (let k = 0; k < 5; k++) {
      const y = -k * 6, sh = r.range(-4, 4);
      fill(c, PL(c, pts([[-44 + sh, y], [-40 + sh, y - 6], [38 + sh, y - 6], [42 + sh, y]])), k % 2 ? col : PAPER);
      for (let j = 1; j < 3; j++) ln(c, [P2(-40 + sh, y - j * 2), P2(38 + sh, y - j * 2)], 0.4, dk(PAPER, 0.4), 0.5);
    }
    ln(c, [P2(-20, 0), P2(-20, -30)], 1.4, t4(P.chandan, 0.3));
    ln(c, [P2(18, 0), P2(18, -30)], 1.4, t4(P.chandan, 0.3));
    sheet(c, 6, -36, 40, 14, -0.08 + v * 0.1, 2, PAPER, IND4);
    // a rolled paper
    ps(c, r, RR(c, -48, -40, 30, 8, 4), [-48, -40, 30, 8], col);
    fill(c, E(c, -48, -36, 2.4, 4), dk(PAPER, 0.2));
    ln(c, [P2(-34, -40), P2(-34, -32)], 1.2, t4(P.chandan, 0.3));
  },
});

def('conch', {
  arch: 'roller', n: 1, rim: RC, m: [14, 18, 8],
  under: (c) => shadow(c, 20),
  body: (c, r) => {
    const shell = mix(P.limewhite, P.chandan, 0.32);
    const shade = mix(P.chandan, P.laterite, 0.35);
    // spire: stacked whorls stepping to the right
    for (let k = 0; k < 3; k++) ps(c, r, E(c, 16 + k * 6, -30 + k * 1.2, 9 - k * 2.4, 8 - k * 2), [8, -38, 28, 16], lt(shell, 0.05 + k * 0.05), { shade });
    dab(c, 32, -27, 2, 1.6, 0, lt(shell, 0.2), 1);
    // body whorl tapering to the siphon canal at the left
    const body = SM(c, pts([[-28, -14], [-18, -24], [-4, -36], [10, -38], [18, -28], [14, -12], [0, -4], [-14, -6], [-24, -10]]));
    ps(c, r, body, [-28, -38, 46, 34], shell, { shade });
    clipTo(c, body, () => {
      for (let k = 0; k < 4; k++) taperStroke(c, curvePts(-12 + k * 7, -36, -6 + k * 7, -20, -12 + k * 7, -2, 8), 2, mix(P.laterite, P.chandan, 0.3), 0.55);
    });
    // knobs on the shoulder
    for (let k = 0; k < 4; k++) dab(c, -6 + k * 6, -36 + Math.abs(k - 1.5) * 1.2, 2.6, 2.2, 0, lt(shell, 0.25), 1);
    // long aperture with a pink lip along the underside
    fill(c, SM(c, pts([[-26, -12], [-12, -18], [4, -16], [10, -9], [-4, -6], [-16, -8]])), mix(P.chandan, P.rani, 0.3));
    fill(c, SM(c, pts([[-18, -11], [-8, -15], [4, -13], [6, -9], [-6, -8]])), mix(P.chandan, P.rani, 0.55));
  },
});

def('garlandPole', {
  arch: 'tall', n: 2, m: [18, 14, 10],
  under: (c) => shadow(c, 30),
  body: (c, r, v) => {
    stick(c, [P2(0, 2), P2(0, -124)], 4.4, BAMBOO);
    // garland strands from the top to pegs at the feet (a tent of flowers)
    for (let g = 0; g < 4; g++) {
      const fx = -30 + g * 20;
      const p = curvePts(0, -114, fx * 0.5, -56, fx, -2, 10);
      taperStroke(c, p, 1, dk(P.marigold, 0.4), 1, [1, 1]);
      for (let i = 1; i < p.length; i++) marigold(c, p[i].x, p[i].y, 3.2, (i + g + v) % 3 === 0 ? P.haldi : P.marigold);
    }
    // mango-leaf toran ring at the top
    for (let k = 0; k < 9; k++) leaf(c, -18 + k * 4.5, -112 + Math.sin((k / 8) * Math.PI) * 4, 9, 2.6, 1.6 + r.range(-0.2, 0.2), LEAF);
    fill(c, PL(c, pts([[0, -124], [16, -120], [0, -114]])), v ? P.tota : P.neel);
  },
});

def('driftwood', {
  arch: 'small', n: 2, rim: mix(P.neel, P.ink, 0.6),
  body: (c, r, v) => {
    const wood = mix(NIGHT, P.khondalite, 0.25);
    stick(c, [P2(-14, 4), P2(-4, -30), P2(4, -58)], 7, wood);
    stick(c, curvePts(-6, -24, -18, -36, -26, -50 + v * 6, 6), 3.4, wood);
    stick(c, curvePts(0, -44, 12, -50, 18, -62, 6), 2.6, wood);
    stick(c, curvePts(-12, -2, 6, -10, 24, -8, 6), 4.4, lt(wood, 0.08));
    taperStroke(c, [P2(-3, -30), P2(3, -54)], 1.4, lt(wood, 0.3), 0.7);
    for (let i = 0; i < 4; i++) taperStroke(c, curvePts(-8 + i * 4, -6, -10 + i * 4, -14, -6 + i * 4, -20, 4), 1, mix(NIGHT, P.tota, 0.25), 0.9);
    void r;
  },
  over: (c, r) => foamLine(c, r, -26, 28, 1, 10, mix(P.limewhite, NIGHT, 0.35)),
});

def('sandbar', {
  arch: 'wide', n: 2, rim: mix(P.neel, P.ink, 0.6), m: [14, 22, 10],
  body: (c, r, v) => {
    const sand = mix(DERIVED.sepia, P.skyCream, 0.25);
    const path = SM(c, pts([[-58, 2], [-40, -12], [-12, -20], [16, -18], [42, -10], [58, 2]]));
    ps(c, r, path, [-58, -20, 116, 22], sand, { shade: mix(sand, P.neel, 0.35) });
    clipTo(c, path, () => { for (let i = 0; i < 6; i++) taperStroke(c, curvePts(-50 + i * 4, -2 - i * 2.4, 0, -8 - i * 2.4, 46 - i * 6, -2 - i * 1.6, 8), 0.9, dk(sand, 0.3), 0.5); });
    for (const x of [-26, 4 + v * 10, 30]) tuft(c, r, x, -14, 16, mix(DERIVED.sepia, P.tota, 0.3), 6);
  },
  over: (c, r) => foamLine(c, r, -60, 60, 1, 18, mix(P.limewhite, NIGHT, 0.35)),
});

// =============================================================================
// Act V — Naya Odisha (lead marigold)
// =============================================================================

def('stormcell', {
  arch: 'air', n: 2, rim: RC, m: [16, 14, 22],
  body: (c, r, v) => {
    const col = DERIVED.stormGrey;
    const lobes = [[-28, 10, 15], [-12, -6, 20], [8, -14, 22], [26, -2, 17], [36, 12, 12], [0, 14, 22], [-38, 18, 10]];
    // anvil top
    const anvil = SM(c, pts([[-40, -16], [-20, -32], [10, -36], [44, -30], [46, -24], [10, -22], [-24, -16]]));
    fill(c, anvil, lt(col, 0.35));
    const path = () => { c.beginPath(); for (const [x, y, rr] of lobes) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } };
    path(); c.fillStyle = col; c.fill();
    clipTo(c, path, () => {
      const g = c.createLinearGradient(0, -36, 0, 34);
      g.addColorStop(0, withAlpha(lt(col, 0.5), 1));
      g.addColorStop(0.55, withAlpha(col, 1));
      g.addColorStop(1, withAlpha(mix(P.neel, P.ink, 0.45), 1));
      c.fillStyle = g; c.fillRect(-50, -40, 100, 76);
      for (let i = 0; i < 18; i++) dab(c, r.range(-40, 40), r.range(-24, 10), r.range(3, 8), r.range(2, 5), 0, lt(col, 0.55), 0.22);
    });
    const z = v ? pts([[10, 22], [2, 32], [9, 32], [0, 44]]) : pts([[-6, 24], [-12, 34], [-5, 34], [-12, 46]]);
    taperStroke(c, z, 3.4, mix(P.haldi, P.limewhite, 0.35), 1, [1, 0.2]);
  },
  over: (c, r) => {
    for (let i = 0; i < 20; i++) { const x = r.range(-34, 34), y = r.range(26, 32); taperStroke(c, [P2(x, y), P2(x - 5, y + r.range(8, 14))], 1.2, mix(P.seafoam, P.limewhite, 0.5), 0.8); }
  },
});

def('birds', {
  arch: 'floater', n: 2, rim: RC, m: [16, 16, 14],
  body: (c, r, v) => {
    const pos = v ? [[-26, 8], [-10, -6], [6, 4], [20, -12], [30, 6]] : [[-28, -2], [-12, 10], [2, -10], [18, 6], [30, -6]];
    for (const [x, y] of pos) {
      const s = r.range(0.85, 1.1), up = r.chance(0.5);
      c.save(); c.translate(x, y); c.scale(s, s);
      const wing = up ? -10 : -3;
      taperStroke(c, curvePts(0, 0, -6, wing, -13, wing + 3, 6), 3.4, P.limewhite, 1, [1, 0.2]);
      taperStroke(c, curvePts(0, 0, 6, wing, 13, wing + 3, 6), 3.4, mix(P.limewhite, P.khondalite, 0.15), 1, [1, 0.2]);
      dab(c, -12, wing + 3, 2, 1.2, 0, dk(P.khondalite, 0.3), 1);
      dab(c, 12, wing + 3, 2, 1.2, 0, dk(P.khondalite, 0.3), 1);
      dab(c, 0, 1, 4.4, 2.4, 0, P.limewhite, 1);
      dab(c, -4, 0, 2, 1.8, 0, P.limewhite, 1);
      dab(c, -4.6, -0.4, 0.6, 0.6, 0, P.ink, 1);
      taperStroke(c, [P2(-6, 0.4), P2(-9, 1)], 1.2, P.sindoor, 1, [1, 0.3]);
      c.restore();
    }
  },
});

def('surveyStake', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    fill(c, SM(c, pts([[-26, 2], [-12, -3], [8, -3.5], [26, 2]])), mix(P.khondalite, P.chandan, 0.35));
    // ranging rod (red/white bands) with a flag
    const rx = v ? 10 : -2;
    for (let k = 0; k < 8; k++) stick(c, [P2(rx, -4 - k * 10), P2(rx, -14 - k * 10)], 3.4, k % 2 ? P.limewhite : P.sindoor);
    fill(c, PL(c, pts([[rx, -84], [rx + 14, -80], [rx, -74]])), P.haldi);
    // pegs with white tops and a string between
    const pegs = v ? [-20, -6, 22] : [-20, 12, 22];
    const hs = [34, 24, 30];
    pegs.forEach((x, i) => {
      c.save(); c.translate(x, 0); c.rotate([-0.12, 0.08, 0.16][i]);
      const h = hs[i];
      ps(c, r, RR(c, -3.6, -h, 7.2, h, 1), [-4, -h, 8, h], WOOD, { from: 'left' });
      fill(c, RR(c, -3.6, -h, 7.2, 5, 1), P.limewhite);
      fill(c, RR(c, -3.6, -h + 5, 7.2, 2, 0), P.sindoor);
      c.restore();
    });
    ln(c, [P2(pegs[0] - 3, -28), P2(pegs[1], -18), P2(pegs[2] + 3, -24)], 0.8, P.limewhite, 0.9);
  },
});

def('chain', {
  arch: 'wide', n: 2, rim: RC, m: [16, 20, 10],
  under: (c) => shadow(c, 50, 0.3),
  body: (c, r, v) => {
    const iron = mix(P.khondalite, P.neel, 0.3);
    const brass = mix(P.haldi, P.khondalite, 0.4);
    const link = (x: number, y: number, a: number) => {
      stroke(c, E(c, x, y, 3.4, 1.8, a), dk(iron, 0.35), 2.2);
      stroke(c, E(c, x, y, 3.4, 1.8, a), lt(iron, 0.3), 1);
    };
    // heap of loops
    for (let k = 0; k < 4; k++) {
      const rx = 30 - k * 4, cy = -6 - k * 6;
      for (let i = 0; i < 26; i++) { const t = (i / 26) * Math.PI * 2; link(Math.cos(t) * rx + r.range(-1, 1), cy + Math.sin(t) * 5, t + Math.PI / 2); }
    }
    // tails along the ground with brass handles
    for (let i = 0; i < 6; i++) link(-36 - i * 3.6, -2, 0);
    for (let i = 0; i < 5; i++) link(32 + i * 3.6, -2, 0);
    for (const x of [-58, 52]) { stroke(c, E(c, x, -4, 4, 5), brass, 2.4); }
    for (let k = 0; k < 3; k++) dab(c, -14 + k * 14, -20 - v * 4, 1.8, 2.6, 0, brass, 1);
  },
});

def('theodolite', {
  arch: 'tall', n: 2, m: [22, 30, 10],
  under: (c) => shadow(c, 30),
  body: (c, r, v) => {
    const wood = mix(P.laterite, P.chandan, 0.35);
    const brass = mix(P.haldi, P.khondalite, 0.38);
    stick(c, [P2(0, -88), P2(4, 0)], 3.4, dk(wood, 0.25));
    stick(c, [P2(-2, -88), P2(-28, 2)], 3.6, wood);
    stick(c, [P2(2, -88), P2(26, 2)], 3.6, wood);
    for (const x of [-28, 26, 4]) dab(c, x, 0, 2.2, 1.6, 0, brass, 1);
    // plumb bob
    ln(c, [P2(0, -88), P2(0, -40)], 0.6, P.ink, 0.8);
    fill(c, PL(c, pts([[-2.4, -40], [2.4, -40], [0, -34]])), brass);
    // head
    ps(c, r, RR(c, -12, -94, 24, 6, 1), [-12, -94, 24, 6], brass);
    ps(c, r, RR(c, -6, -106, 12, 12, 2), [-6, -106, 12, 12], dk(brass, 0.1));
    ps(c, r, RR(c, -20, -110, 40, 7, 3.4), [-20, -110, 40, 7], brass);
    fill(c, RR(c, -22, -111, 4, 9, 1), dk(P.khondalite, 0.5));
    fill(c, RR(c, 18, -110, 4, 7, 1), dk(P.khondalite, 0.5));
    dab(c, 0, -100, 2, 2, 0, P.seafoam, 1);
    // surveyor's umbrella
    stick(c, [P2(14, -60), P2(-4, -132)], 1.6, dk(wood, 0.2));
    const can = v ? P.peacock : P.neel;
    const um = SM(c, pts([[-36, -126], [-20, -138], [4, -142], [26, -132], [28, -124], [8, -128], [-14, -124]]));
    ps(c, r, um, [-36, -142, 64, 18], can);
    clipTo(c, um, () => { for (let k = 0; k < 4; k++) taperStroke(c, [P2(-4, -142), P2(-30 + k * 18, -122)], 2.4, P.limewhite, 0.7); });
  },
});

def('cow', {
  arch: 'walker', n: 3, m: [16, 12, 10],
  under: (c) => shadow(c, 40, 0.35),
  body: (c, r, v) => {
    const cols = [mix(P.limewhite, P.chandan, 0.12), mix(P.chandan, P.laterite, 0.35), mix(P.limewhite, P.chandan, 0.2)];
    bovine(c, r, 6, 0, 1, { col: cols[v], spot: v === 0 ? mix(P.khondalite, P.chandan, 0.4) : undefined, horn: v === 2 ? P.peacock : P.tota, garland: v === 2, bell: v !== 2, phase: 0.6 + v });
  },
});

def('spray', {
  arch: 'floater', n: 2, rim: RC, m: [16, 16, 16],
  body: (c, r, v) => {
    const lobes = [[-20, 6, 11], [-6, -4, 14], [10, -2, 13], [22, 8, 10], [0, 10, 12]];
    const path = () => { c.beginPath(); for (const [x, y, rr] of lobes) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } };
    path(); c.fillStyle = mix(P.seafoam, P.limewhite, 0.35); c.fill();
    clipTo(c, path, () => {
      const g = c.createLinearGradient(0, -18, 0, 22);
      g.addColorStop(0, withAlpha(P.limewhite, 0.9)); g.addColorStop(1, withAlpha(mix(P.peacock, P.seafoam, 0.4), 0.9));
      c.fillStyle = g; c.fillRect(-34, -20, 68, 44);
      for (let i = 0; i < 16; i++) dab(c, r.range(-28, 28), r.range(-14, 18), r.range(2, 5), r.range(1.5, 4), 0, P.limewhite, 0.4);
    });
    // droplets thrown out
    for (let i = 0; i < 9 + v * 4; i++) {
      const a = r.range(-Math.PI, 0.2), d = r.range(18, 30);
      const x = Math.cos(a) * d * 1.2, y = Math.sin(a) * d * 0.8;
      fill(c, () => { c.beginPath(); c.moveTo(x, y - 3.6); c.quadraticCurveTo(x + 2.6, y + 0.6, x, y + 2); c.quadraticCurveTo(x - 2.6, y + 0.6, x, y - 3.6); }, mix(P.seafoam, P.peacock, 0.25));
    }
  },
});

def('cattle', {
  arch: 'walker', n: 2, m: [16, 14, 10],
  under: (c) => shadow(c, 54, 0.35),
  body: (c, r, v) => {
    bovine(c, r, 34, 0, 0.56, { col: mix(P.chandan, P.limewhite, 0.3), calf: true, phase: 2 });
    const buf = mix(mix(P.khondalite, P.neel, 0.2), P.ink, 0.2);
    bovine(c, r, -6, 0, 0.86, { col: buf, buffalo: true, phase: 0.4 + v });
    if (v === 0) {
      // an egret hitching a ride
      c.save(); c.translate(-2, -52);
      dab(c, 0, -4, 6, 3.6, -0.2, P.limewhite, 1);
      taperStroke(c, curvePts(-4, -6, -8, -12, -6, -16, 5), 2.2, P.limewhite, 1, [1, 0.8]);
      dab(c, -6, -17, 2.6, 2.2, 0, P.limewhite, 1);
      taperStroke(c, [P2(-8, -17), P2(-13, -16)], 1.2, P.haldi, 1, [1, 0.3]);
      dab(c, -6.6, -17.6, 0.6, 0.6, 0, P.ink, 1);
      c.restore();
    }
  },
});

def('slagCart', {
  arch: 'walker', n: 2, rim: RC, m: [14, 18, 10],
  under: (c) => shadow(c, 46, 0.35),
  body: (c, r, v) => {
    const steel = mix(P.khondalite, P.neel, 0.32);
    ps(c, r, RR(c, -40, -24, 80, 8, 1), [-40, -24, 80, 8], dk(steel, 0.15));
    stick(c, [P2(-46, -20), P2(-38, -20)], 3, dk(steel, 0.3));
    for (const x of [-26, 26]) { dab(c, x, -9, 10, 10, 0, dk(steel, 0.45), 1); dab(c, x, -9, 7, 7, 0, steel, 1); dab(c, x, -9, 2.4, 2.4, 0, lt(steel, 0.4), 1); }
    // ladle bowl on trunnions
    stick(c, [P2(-30, -24), P2(-26, -42)], 4, dk(steel, 0.2));
    stick(c, [P2(30, -24), P2(26, -42)], 4, dk(steel, 0.2));
    const bowl = SM(c, pts([[-30, -56], [30, -56], [26, -36], [12, -26], [-12, -26], [-26, -36]]));
    ps(c, r, bowl, [-30, -58, 60, 32], steel);
    for (let i = 0; i < 6; i++) dab(c, -22 + i * 9, -50, 1.1, 1.1, 0, lt(steel, 0.45), 1);
    stroke(c, E(c, 0, -56, 30, 4), dk(steel, 0.3), 3);
    // glowing slag crust
    fill(c, E(c, 0, -56, 27, 3), mix(P.marigold, P.haldi, 0.3));
    for (let i = 0; i < 6; i++) dab(c, r.range(-22, 22), -56, r.range(2, 4), 1.2, 0, mix(P.sindoor, P.marigold, 0.5), 0.9);
    if (v === 1) fill(c, PL(c, pts([[-30, -56], [-40, -48], [-36, -44], [-28, -50]])), mix(P.marigold, P.haldi, 0.3));
  },
  over: (c, r) => {
    glow(c, 0, -60, 26, P.marigold, 0.35);
    for (let i = 0; i < 4; i++) dab(c, r.range(-14, 14), r.range(-74, -64), r.range(4, 7), r.range(3, 5), 0, mix(P.limewhite, P.khondalite, 0.3), 0.35);
  },
});

def('railSwitch', {
  arch: 'small', n: 2, rim: RC,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const steel = mix(P.khondalite, P.neel, 0.3);
    // sleeper + rail stub
    ps(c, r, RR(c, -28, -6, 56, 6, 1), [-28, -6, 56, 6], mix(P.laterite, P.ink, 0.4));
    fill(c, RR(c, -28, -9, 56, 3, 0), lt(steel, 0.3));
    box3(c, r, -14, -6, 20, 12, 5, steel);
    // lever with counterweight
    const a = v ? -1.1 : -1.4;
    const tip = P2(-4 + Math.cos(a) * 56, -18 + Math.sin(a) * 56);
    stick(c, [P2(-4, -18), tip], 3, dk(steel, 0.1));
    dab(c, tip.x, tip.y, 5, 5, 0, mix(P.haldi, P.khondalite, 0.3), 1);
    dab(c, tip.x - 1.4, tip.y - 1.4, 1.6, 1.6, 0, P.limewhite, 0.5);
    // target disc on a post
    stick(c, [P2(14, -6), P2(14, -40)], 2.6, steel);
    const board = PL(c, pts([[14, -64], [26, -50], [14, -36], [2, -50]]));
    ps(c, r, board, [2, -64, 24, 28], P.haldi);
    stroke(c, PL(c, pts([[14, -59], [21, -50], [14, -41], [7, -50]])), dk(P.neel, 0.4), 1.6);
    dab(c, 14, -50, 2.4, 2.4, 0, dk(P.neel, 0.4), 1);
  },
});

def('signal', {
  arch: 'tall', n: 2, rim: RC, m: [22, 14, 10],
  under: (c) => shadow(c, 28),
  body: (c, r, v) => {
    const steel = mix(P.khondalite, P.neel, 0.3);
    box3(c, r, -18, 0, 30, 26, 6, mix(P.khondalite, P.chandan, 0.25));
    stick(c, [P2(-4, -26), P2(-4, -122)], 5, steel);
    for (let y = -34; y > -112; y -= 9) stick(c, [P2(4, y), P2(9, y)], 1.4, lt(steel, 0.2));
    stick(c, [P2(4, -30), P2(4, -114)], 1.4, lt(steel, 0.2));
    stick(c, [P2(9, -30), P2(9, -114)], 1.4, lt(steel, 0.2));
    // semaphore arm
    const a = v ? -0.5 : 0;
    c.save(); c.translate(-4, -110); c.rotate(a);
    ps(c, r, RR(c, -34, -4, 34, 8, 1), [-34, -4, 34, 8], P.sindoor);
    fill(c, RR(c, -28, -3, 4, 6, 0), P.limewhite);
    c.restore();
    // lamp spectacle
    ps(c, r, RR(c, -2, -104, 12, 18, 2), [-2, -104, 12, 18], dk(steel, 0.25));
    dab(c, 4, -99, 3, 3, 0, mix(P.tota, P.seafoam, 0.2), 1);
    dab(c, 4, -91, 3, 3, 0, P.sindoor, 1);
    dab(c, -4, -124, 4, 3, 0, dk(steel, 0.3), 1);
  },
});

def('sleepers', {
  arch: 'wide', n: 2, m: [14, 18, 10],
  under: (c) => shadow(c, 54, 0.35),
  body: (c, r, v) => {
    const wood = mix(mix(P.laterite, P.khondalite, 0.4), P.ink, 0.35);
    const endC = mix(P.chandan, P.laterite, 0.45);
    for (let k = 0; k < 3; k++) {
      const y = -k * 11;
      if (k % 2 === 0) {
        const x0 = -54 + k * 4, w = 108 - k * 8;
        ps(c, r, RR(c, x0, y - 11, w, 11, 1), [x0, y - 11, w, 11], wood);
        grain(c, r, x0, y - 11, w, 11, dk(wood, 0.45), 7, 0.6);
        fill(c, RR(c, x0, y - 11, w, 2, 0), lt(wood, 0.25), 0.8);
        for (const bx of [x0 + 8, x0 + w - 10]) dab(c, bx, y - 5.5, 1.4, 1.4, 0, mix(P.khondalite, P.limewhite, 0.3), 1);
      } else for (let i = 0; i < 4; i++) {
        const x = -46 + i * 28;
        ps(c, r, RR(c, x, y - 11, 16, 11, 1), [x, y - 11, 16, 11], endC);
        for (let q = 1; q < 4; q++) stroke(c, E(c, x + 8, y - 5.5, q * 2.2, q * 1.5), dk(endC, 0.4), 0.6, 0.8);
      }
    }
    if (v === 1) { const steel = mix(P.khondalite, P.neel, 0.3); ps(c, r, RR(c, -40, -36, 80, 6, 1), [-40, -36, 80, 6], steel); fill(c, RR(c, -40, -36, 80, 1.6, 0), lt(steel, 0.5)); }
  },
});

def('debris', {
  arch: 'small', n: 2, rim: RC,
  under: (c) => shadow(c, 28),
  body: (c, r, v) => {
    const wood = mix(WOOD, P.khondalite, 0.3);
    box3(c, r, -22, 0, 30, 22, 5, mix(WOOD, P.chandan, 0.2));
    for (let k = 0; k < 3; k++) ln(c, [P2(-22, -6 - k * 7), P2(8, -6 - k * 7)], 0.8, dk(wood, 0.4), 0.7);
    stick(c, [P2(-28, -4), P2(24, -48)], 4.6, wood, dk(wood, 0.5));
    stick(c, [P2(-20, -46), P2(26, -6)], 4, lt(wood, 0.1), dk(wood, 0.5));
    // a dented tin bucket on its side
    const tin = mix(P.khondalite, P.limewhite, 0.3);
    ps(c, r, PL(c, pts([[6, -2], [8, -18], [26, -20], [26, 0]])), [6, -20, 20, 20], tin);
    fill(c, E(c, 26, -10, 3, 10), dk(tin, 0.4));
    // palm frond fragment
    const fr = v ? mix(P.tota, DERIVED.stormGrey, 0.35) : mix(P.tota, P.khondalite, 0.3);
    const rib = curvePts(-26, -26, -10, -60, 8, -58, 8);
    taperStroke(c, rib, 1.6, fr, 1);
    for (let i = 1; i < rib.length; i++) taperStroke(c, [rib[i], P2(rib[i].x + 6, rib[i].y + 10)], 2, fr, 1, [1, 0.2]);
  },
});

def('fallenPalm', {
  arch: 'wide', n: 2, m: [22, 26, 10],
  under: (c) => shadow(c, 58, 0.35),
  body: (c, r, v) => {
    const trunk = mix(P.khondalite, P.chandan, 0.35);
    const frond = mix(mix(P.tota, P.khondalite, 0.25), DERIVED.stormGrey, 0.15 + v * 0.15);
    // fronds at the left end
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + r.range(-0.9, 0.8);
      const l = r.range(28, 40);
      const p = curvePts(-46, -16, -46 + Math.cos(a) * l * 0.5, -16 + Math.sin(a) * l * 0.5 - 8, -46 + Math.cos(a) * l, -16 + Math.sin(a) * l * 0.6 + 6, 8);
      taperStroke(c, p, 1.6, dk(frond, 0.2), 1);
      for (let k = 1; k < p.length; k++) {
        taperStroke(c, [p[k], P2(p[k].x - 3, p[k].y + 8)], 2.4, frond, 1, [1, 0.2]);
        taperStroke(c, [p[k], P2(p[k].x + 3, p[k].y - 7)], 2.4, lt(frond, 0.08), 1, [1, 0.2]);
      }
    }
    // trunk
    const path = SM(c, pts([[-48, -22], [40, -16], [48, -8], [40, -2], [-48, -8]]));
    ps(c, r, path, [-48, -22, 96, 20], trunk);
    clipTo(c, path, () => { for (let x = -44; x < 42; x += 5) taperStroke(c, [P2(x, -22), P2(x + 1, -2)], 1, dk(trunk, 0.35), 0.6); });
    // root ball at the right
    ps(c, r, E(c, 48, -14, 10, 15), [38, -29, 20, 30], mix(P.laterite, P.khondalite, 0.45));
    for (let k = 0; k < 5; k++) taperStroke(c, curvePts(50, -14, 56 + k, -20 + k * 5, 58 + k * 1.6, -26 + k * 7, 4), 1.2, mix(P.chandan, P.khondalite, 0.4), 1);
  },
});

def('flyingSheet', {
  arch: 'floater', n: 2, rim: RC, m: [16, 16, 16],
  body: (c, r, v) => {
    const tin = mix(P.khondalite, P.limewhite, 0.25 - v * 0.1);
    c.save(); c.rotate(-0.22 + v * 0.35);
    const w = 64, h = 34;
    const path = () => { c.beginPath(); c.moveTo(-w / 2, -h / 2); c.quadraticCurveTo(0, -h / 2 - 8, w / 2, -h / 2 + 4); c.lineTo(w / 2 - 2, h / 2 + 2); c.quadraticCurveTo(0, h / 2 - 8, -w / 2, h / 2); c.closePath(); };
    fill(c, path, tin);
    clipTo(c, path, () => {
      for (let k = 0; k < 10; k++) { const x = -w / 2 + 4 + k * 6.4; taperStroke(c, [P2(x, -h), P2(x + 1, h)], 2.6, k % 2 ? lt(tin, 0.35) : dk(tin, 0.25), 0.9, [1, 1]); }
      for (let i = 0; i < 6; i++) dab(c, r.range(-28, 28), r.range(-14, 14), r.range(2, 5), r.range(1.4, 3), 0, mix(P.laterite, P.khondalite, 0.25), 0.55);
    });
    dab(c, -w / 2 + 6, -h / 2 + 4, 1.4, 1.4, 0, P.ink, 1);
    c.restore();
  },
});

// =============================================================================
// Act VI — Odisha, Now (lead rani: no rani masses)
// =============================================================================

def('paintBucket', {
  arch: 'small', n: 3,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const paint = [P.peacock, P.haldi, P.tota][v];
    // a wooden crate to stand on
    box3(c, r, -24, 0, 42, 18, 6, mix(WOOD, P.chandan, 0.25));
    grain(c, r, -24, -18, 42, 18, WOODD, 4);
    const tin = mix(P.khondalite, P.limewhite, 0.4);
    const body = PL(c, pts([[-16, -18], [-19, -56], [17, -56], [14, -18]]));
    ps(c, r, body, [-19, -56, 36, 38], tin, { from: 'left' });
    clipTo(c, body, () => {
      fill(c, RR(c, -20, -46, 40, 12, 0), paint, 0.9);
      for (let k = 0; k < 3; k++) taperStroke(c, [P2(-12 + k * 12, -56), P2(-12 + k * 12, -48 + (k % 2) * 8)], 3, paint, 1, [1, 0.9]);
    });
    fill(c, E(c, -1, -56, 18, 4), dk(tin, 0.2));
    fill(c, E(c, -1, -56, 15, 3), paint);
    stroke(c, () => { c.beginPath(); c.ellipse(-1, -56, 20, 16, 0, Math.PI * 1.1, Math.PI * 1.9); }, dk(tin, 0.4), 1.2);
    // brush across the rim
    stick(c, [P2(-12, -60), P2(22, -70)], 2.4, WOOD);
    ps(c, r, RR(c, -22, -61, 10, 6, 1), [-22, -61, 10, 6], dk(paint, 0.1));
    dab(c, 20, -2, 6, 2, 0, paint, 0.9);
  },
});

def('barricade', {
  arch: 'wide', n: 2, m: [14, 18, 10],
  under: (c) => shadow(c, 54, 0.35),
  body: (c, r, v) => {
    const wood = mix(P.khondalite, P.chandan, 0.3);
    for (const x of [-42, 42]) { stick(c, [P2(x - 7, 2), P2(x, -38)], 3, wood); stick(c, [P2(x + 7, 2), P2(x, -38)], 3, dk(wood, 0.2)); }
    const boards = [[-56, -40, 112, 10], [-50, -20, 100, 7]];
    for (const [x, y, w, h] of boards) {
      const b = RR(c, x, y, w, h, 1.5);
      fill(c, b, P.haldi);
      clipTo(c, b, () => { for (let k = -2; k < 16; k++) fill(c, PL(c, pts([[x + k * 10, y + h], [x + k * 10 + 6, y], [x + k * 10 + 11, y], [x + k * 10 + 5, y + h]])), dk(P.neel, 0.5)); });
      ln(c, [P2(x, y + 1), P2(x + w, y + 1)], 0.8, P.limewhite, 0.5);
    }
    // little warning lamp
    ps(c, r, RR(c, (v ? 30 : -36) - 4, -48, 8, 8, 2), [-40, -48, 8, 8], P.marigold);
  },
  over: (c, _r, v) => glow(c, v ? 30 : -36, -44, 12, P.marigold, 0.4),
});

def('branchPile', {
  arch: 'wide', n: 2, m: [16, 22, 10],
  under: (c) => shadow(c, 54, 0.35),
  body: (c, r, v) => {
    const wood = BARK;
    for (let i = 0; i < 9; i++) {
      const x0 = r.range(-56, -10), x1 = r.range(10, 56);
      const y0 = r.range(-20, -2), y1 = r.range(-30, -4);
      stick(c, [P2(x0, y0), P2(x1, y1)], r.range(3, 5), r.chance(0.5) ? wood : lt(wood, 0.12));
      fill(c, E(c, x0, y0, 2, r.range(1.6, 2.6)), mix(P.chandan, P.haldi, 0.2));
    }
    const cols = [LEAF, LEAFL, LEAFD, mix(P.tota, P.haldi, 0.5)];
    for (let i = 0; i < 40 + v * 10; i++) {
      const x = r.range(-48, 50), top = -34 * Math.max(0, 1 - Math.abs(x) / 58);
      leaf(c, x, r.range(top, -4), r.range(9, 14), r.range(3, 4), r.range(-Math.PI, Math.PI), r.pick(cols));
    }
  },
});

def('inkpot', {
  arch: 'small', n: 2,
  under: (c) => { shadow(c, 26); fill(c, E(c, 14, 0, 14, 2.6), mix(P.neel, P.ink, 0.35), 0.9); },
  body: (c, r, v) => {
    const glass = mix(P.neel, P.limewhite, 0.55);
    const ink = mix(P.neel, P.ink, 0.4);
    // reed pen
    stick(c, [P2(-6, -40), P2(16 - v * 26, -84)], 2.6, mix(P.haldi, P.chandan, 0.4));
    const body = SM(c, pts([[-22, -2], [-24, -22], [-16, -36], [-8, -40], [8, -40], [16, -36], [24, -22], [22, -2]]));
    ps(c, r, body, [-24, -40, 48, 38], glass, { light: P.limewhite });
    clipTo(c, body, () => {
      fill(c, RR(c, -26, -26, 52, 26, 0), ink, 0.92);
      taperStroke(c, [P2(-24, -26), P2(24, -26)], 1.4, mix(P.neel, P.limewhite, 0.3), 0.8);
      dab(c, -12, -30, 3, 6, 0, P.limewhite, 0.6);
    });
    ps(c, r, RR(c, -9, -46, 18, 7, 2), [-9, -46, 18, 7], glass);
    fill(c, E(c, 0, -46, 9, 2.4), ink);
    for (let i = 0; i < 4; i++) dab(c, 24 + i * 4, r.range(-6, -2), 1.4, 1.4, 0, ink, 1);
  },
});

def('slate', {
  arch: 'wide', n: 2, m: [14, 20, 10],
  under: (c) => shadow(c, 54, 0.35),
  body: (c, r, v) => {
    const frame = mix(WOOD, P.chandan, 0.25);
    const board = mix(P.neel, P.ink, 0.55);
    const slateAt = (x: number, y: number, w: number, h: number, rot: number) => {
      c.save(); c.translate(x, y); c.rotate(rot);
      ps(c, r, RR(c, -w / 2, -h, w, h, 2), [-w / 2, -h, w, h], frame);
      fill(c, RR(c, -w / 2 + 3.4, -h + 3.4, w - 6.8, h - 6.8, 1), board);
      // chalk doodles (sun, flower, wiggle) — no letters
      const cx = -w / 2 + 12, cy = -h / 2;
      stroke(c, E(c, cx, cy, 4, 4), P.limewhite, 0.9, 0.85);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ln(c, [P2(cx + Math.cos(a) * 5.6, cy + Math.sin(a) * 5.6), P2(cx + Math.cos(a) * 7.6, cy + Math.sin(a) * 7.6)], 0.8, P.limewhite, 0.85); }
      taperStroke(c, curvePts(cx + 12, cy + 2, cx + 18, cy - 8, cx + 26, cy + 2, 8), 0.9, P.limewhite, 0.8);
      for (let k = 0; k < 5; k++) dab(c, cx + 32 + Math.cos(k * 1.26) * 3, cy + Math.sin(k * 1.26) * 3, 1.8, 1.8, 0, P.limewhite, 0.8);
      c.restore();
    };
    slateAt(-10, 0, 72, 10, 0);
    slateAt(-14, -10, 64, 34, -0.04);
    slateAt(36, 0, 40, 38, 0.24 - v * 0.08);
    stick(c, [P2(-40, -44), P2(-14, -48)], 1.6, mix(P.khondalite, P.limewhite, 0.4));
    fill(c, RR(c, 0, -48, 7, 3, 1), P.limewhite);
  },
});

def('hockeyBall', {
  arch: 'roller', n: 2, m: [14, 18, 8],
  under: (c) => shadow(c, 18),
  body: (c, r, v) => {
    const col = v ? mix(P.limewhite, P.skyCream, 0.3) : P.marigold;
    ps(c, r, E(c, 0, -22, 21, 21), [-21, -43, 42, 42], col, { light: lt(col, 0.6), shade: v ? mix(P.khondalite, P.skyCream, 0.3) : mix(P.marigold, P.laterite, 0.5) });
    clipTo(c, E(c, 0, -22, 21, 21), () => {
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
        const x = i * 6 + (j % 2) * 3, y = -22 + j * 5.6;
        const d = Math.hypot(x, y + 22) / 21;
        if (d > 0.92) continue;
        dab(c, x * (1 - d * 0.15), y, 1.7 * (1 - d * 0.5), 1.5 * (1 - d * 0.5), 0, dk(col, 0.3), 0.7);
      }
      dab(c, -7, -32, 7, 4, -0.5, P.limewhite, 0.5);
    });
  },
});

def('cone', {
  arch: 'small', n: 3,
  under: (c) => shadow(c, 24),
  body: (c, r, v) => {
    const cone = (x: number, y: number, s: number, rot = 0) => {
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
      ps(c, r, RR(c, -22, -6, 44, 6, 1.5), [-22, -6, 44, 6], dk(P.neel, 0.5));
      const body = PL(c, pts([[-17, -6], [-6, -62], [6, -62], [17, -6]]));
      ps(c, r, body, [-17, -62, 34, 56], P.marigold, { from: 'left', shade: mix(P.marigold, P.laterite, 0.5) });
      clipTo(c, body, () => { fill(c, RR(c, -20, -30, 40, 8, 0), P.limewhite); fill(c, RR(c, -20, -48, 40, 6, 0), P.limewhite); });
      fill(c, E(c, 0, -62, 6, 1.6), mix(P.marigold, P.laterite, 0.4));
      c.restore();
    };
    if (v === 0) cone(0, 0, 1);
    else if (v === 1) { cone(0, 0, 1); cone(0, -14, 0.92); }
    else { cone(10, 0, 1); cone(-18, -4, 0.7, -1.45); }
  },
});

def('goal', {
  arch: 'tall', n: 1, m: [20, 14, 10],
  under: (c) => {
    shadow(c, 34);
    // net mesh between the frames (not outlined, so it stays light)
    const net = mix(P.limewhite, P.seafoam, 0.2);
    c.save();
    polyPath(c, pts([[-26, -96], [26, -102], [36, -16], [36, 0], [-26, 0]])); c.clip();
    c.fillStyle = withAlpha(P.limewhite, 0.18); c.fillRect(-30, -110, 70, 112);
    for (let k = -30; k < 40; k += 6) ln(c, [P2(k, -110), P2(k + 6, 4)], 0.9, net, 0.9);
    for (let y = -98; y < 0; y += 6) ln(c, [P2(-28, y), P2(38, y - 4)], 0.9, net, 0.9);
    c.restore();
  },
  body: (c, r) => {
    const post = mix(P.limewhite, P.skyCream, 0.2);
    // backboard
    ps(c, r, RR(c, -26, -16, 62, 16, 1), [-26, -16, 62, 16], mix(P.neel, P.khondalite, 0.35));
    stick(c, [P2(26, -102), P2(36, -16)], 2.4, mix(post, P.khondalite, 0.25));
    stick(c, [P2(-26, 0), P2(-26, -98)], 5, post);
    stick(c, [P2(-28, -97), P2(28, -103)], 5, post);
    stick(c, [P2(26, -16), P2(26, -102)], 4, mix(post, P.khondalite, 0.12));
  },
});

def('kitBag', {
  arch: 'wide', n: 2, m: [18, 20, 10],
  under: (c) => shadow(c, 52, 0.35),
  body: (c, r, v) => {
    const bag = v ? mix(P.tota, P.neel, 0.25) : P.peacock;
    // hockey sticks poking out
    for (const [x, y, a] of [[24, -30, -0.5], [28, -24, -0.3]] as const) {
      const p = [P2(x - 30, y + 6), P2(x + Math.cos(a) * 24, y + Math.sin(a) * 24)];
      stick(c, p, 3, mix(P.chandan, P.haldi, 0.25));
      stick(c, [p[1], P2(p[1].x + 7, p[1].y + 3)], 4, mix(P.chandan, P.haldi, 0.25));
      fill(c, RR(c, x - 24, y, 6, 4, 1), P.haldi);
    }
    const body = RR(c, -48, -32, 88, 32, 14);
    ps(c, r, body, [-48, -32, 88, 32], bag);
    clipTo(c, body, () => {
      fill(c, RR(c, -48, -14, 88, 4, 0), P.haldi);
      ln(c, [P2(-34, -30), P2(28, -30)], 1.2, dk(bag, 0.5), 0.8);
      fill(c, RR(c, -14, -26, 26, 9, 2), lt(bag, 0.15));
    });
    fill(c, E(c, -48, -16, 6, 15), dk(bag, 0.2));
    stroke(c, () => { c.beginPath(); c.ellipse(-4, -32, 16, 10, 0, Math.PI, Math.PI * 2); }, dk(bag, 0.4), 3);
  },
});

def('planter', {
  arch: 'small', n: 2,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const stone = mix(P.khondalite, P.chandan, 0.3);
    // shrub
    const shrub = SM(c, pts([[-22, -28], [-26, -46], [-14, -64], [4, -68], [20, -58], [24, -40], [20, -28]]));
    ps(c, r, shrub, [-26, -68, 50, 40], LEAF, { light: LEAFL, shade: LEAFD });
    clipTo(c, shrub, () => { for (let i = 0; i < 40; i++) leaf(c, r.range(-24, 22), r.range(-66, -28), 6, 2.4, r.range(-Math.PI, Math.PI), r.pick([LEAF, LEAFL, LEAFD])); });
    for (let i = 0; i < 9; i++) { const x = r.range(-18, 18), y = r.range(-62, -36); dab(c, x, y, 2.4, 2.4, 0, v ? P.limewhite : P.haldi, 1); dab(c, x, y, 0.9, 0.9, 0, P.marigold, 1); }
    const pot = PL(c, pts([[-24, -30], [24, -30], [18, 0], [-18, 0]]));
    ps(c, r, pot, [-24, -30, 48, 30], stone, { from: 'left' });
    fill(c, RR(c, -26, -34, 52, 6, 1), lt(stone, 0.15));
    clipTo(c, pot, () => { ln(c, [P2(-24, -16), P2(24, -16)], 1.2, dk(stone, 0.35), 0.7); for (let k = 0; k < 4; k++) dab(c, -12 + k * 8, -9, 1.6, 1.6, 0, dk(stone, 0.3), 0.8); });
  },
});

def('queueRail', {
  arch: 'wide', n: 2, rim: RC, m: [14, 18, 10],
  under: (c) => shadow(c, 54, 0.3),
  body: (c, r, v) => {
    const steel = mix(P.khondalite, P.limewhite, 0.4);
    const cloth = v ? mix(P.haldi, P.chandan, 0.2) : mix(P.peacock, P.neel, 0.2);
    const cl = RR(c, -50, -34, 100, 16, 1);
    ps(c, r, cl, [-50, -34, 100, 16], cloth);
    clipTo(c, cl, () => { ln(c, [P2(-50, -32), P2(50, -32)], 1.4, v ? P.peacock : P.haldi, 0.9); ln(c, [P2(-50, -20), P2(50, -20)], 1.4, v ? P.peacock : P.haldi, 0.9); });
    for (const y of [-36, -16]) stick(c, [P2(-54, y), P2(54, y)], 2.6, steel);
    for (const x of [-52, -4, 50]) { stick(c, [P2(x, 0), P2(x, -40)], 3.4, steel); fill(c, E(c, x, -1, 7, 2), dk(steel, 0.3)); dab(c, x, -41, 2.6, 2, 0, lt(steel, 0.3), 1); }
    void r;
  },
});

def('shadeUmbrella', {
  arch: 'tall', n: 2, m: [28, 20, 10],
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const stone = mix(P.khondalite, P.chandan, 0.25);
    box3(c, r, -18, 0, 32, 22, 5, stone);
    stick(c, [P2(-2, -22), P2(-2, -116)], 3.4, mix(P.khondalite, P.limewhite, 0.3));
    const a = v ? P.tota : P.peacock;
    const can = SM(c, pts([[-44, -96], [-30, -116], [-2, -126], [26, -116], [40, -96], [20, -100], [-2, -98], [-24, -100]]));
    ps(c, r, can, [-44, -126, 84, 30], a);
    clipTo(c, can, () => { for (let k = 0; k < 6; k++) if (k % 2) fill(c, PL(c, [P2(-2, -128), P2(-44 + k * 14, -94), P2(-30 + k * 14, -94)]), P.limewhite, 0.9); });
    for (let k = 0; k < 9; k++) dab(c, -40 + k * 10, -96 + Math.abs(k - 4) * 0.5, 2.6, 2, 0, P.haldi, 1);
    dab(c, -2, -128, 2.6, 2.4, 0, P.haldi, 1);
    tuft(c, r, 14, -1, 8, LEAF, 4);
  },
});

def('boxes', {
  arch: 'wide', n: 2, m: [14, 22, 10],
  under: (c) => shadow(c, 52, 0.35),
  body: (c, r, v) => {
    const card = mix(P.chandan, P.khondalite, 0.2);
    const tape = mix(P.chandan, P.limewhite, 0.4);
    const bx = (x: number, y: number, w: number, h: number, col: string) => {
      box3(c, r, x, y, w, h, 6, col);
      fill(c, RR(c, x + w / 2 - 3, y - h, 6, h, 0), tape, 0.85);
      // pictograms: "this side up" arrows and a chip square
      ln(c, [P2(x + 5, y - 6), P2(x + 5, y - 12)], 1, P.ink, 0.6);
      ln(c, [P2(x + 3, y - 10), P2(x + 5, y - 12), P2(x + 7, y - 10)], 1, P.ink, 0.6);
      stroke(c, RR(c, x + w - 13, y - 13, 8, 8, 1), P.neel, 1, 0.7);
      for (let k = 0; k < 3; k++) ln(c, [P2(x + w - 15, y - 11 + k * 2.4), P2(x + w - 13, y - 11 + k * 2.4)], 0.6, P.neel, 0.7);
    };
    bx(-52, 0, 44, 26, card);
    bx(-6, 0, 46, 30, lt(card, 0.08));
    bx(-34 + v * 16, -26 - (v ? 4 : 0), 34, 20, dk(card, 0.06));
  },
});

def('robot', {
  arch: 'walker', n: 2, m: [16, 14, 10],
  under: (c) => shadow(c, 40, 0.35),
  body: (c, r, v) => {
    const shell = mix(P.limewhite, P.skyCream, 0.25);
    const band = v ? P.tota : P.peacock;
    // flag on a whip antenna
    ln(c, [P2(22, -50), P2(28, -84)], 1, P.ink, 0.9);
    fill(c, PL(c, pts([[28, -84], [42, -80], [28, -74]])), P.haldi);
    // wheels
    for (const x of [-24, 0, 24]) { dab(c, x, -9, 9, 9, 0, dk(P.neel, 0.55), 1); dab(c, x, -9, 4, 4, 0, mix(P.khondalite, P.limewhite, 0.3), 1); }
    const body = RR(c, -34, -54, 64, 40, 12);
    ps(c, r, body, [-34, -54, 64, 40], shell, { from: 'left' });
    clipTo(c, body, () => { fill(c, RR(c, -36, -30, 70, 6, 0), band); ln(c, [P2(-30, -46), P2(28, -46)], 0.8, dk(shell, 0.35), 0.6); });
    // friendly face screen (facing left)
    ps(c, r, RR(c, -32, -48, 20, 14, 5), [-32, -48, 20, 14], mix(P.neel, P.ink, 0.45));
    dab(c, -27, -42, 2, 2.6, 0, P.haldi, 1);
    dab(c, -18, -42, 2, 2.6, 0, P.haldi, 1);
    taperStroke(c, curvePts(-26, -38, -22.5, -35.5, -19, -38, 5), 1, P.haldi, 1);
  },
});

def('barrier', {
  arch: 'tall', n: 2, m: [20, 14, 10],
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const house = mix(P.khondalite, P.limewhite, 0.35);
    // raised boom arm
    const a = -Math.PI / 2 + (v ? 0.38 : 0.22);
    const pivot = P2(4, -44);
    const end = P2(pivot.x + Math.cos(a) * 84, pivot.y + Math.sin(a) * 84);
    stick(c, [pivot, end], 6, P.limewhite);
    for (let k = 0; k < 6; k++) { const t0 = 0.12 + k * 0.15, t1 = t0 + 0.075; stick(c, [P2(pivot.x + (end.x - pivot.x) * t0, pivot.y + (end.y - pivot.y) * t0), P2(pivot.x + (end.x - pivot.x) * t1, pivot.y + (end.y - pivot.y) * t1)], 6, P.sindoor); }
    const body = RR(c, -18, -56, 32, 56, 3);
    ps(c, r, body, [-18, -56, 32, 56], house, { from: 'left' });
    clipTo(c, body, () => { fill(c, RR(c, -18, -40, 32, 5, 0), P.peacock); });
    fill(c, RR(c, -20, -58, 36, 4, 1), dk(house, 0.3));
    dab(c, 4, -44, 4, 4, 0, dk(house, 0.4), 1);
    dab(c, -10, -50, 2, 2, 0, P.tota, 1);
  },
});

// =============================================================================
// Act VII — the future (neel + haldi + neon accents allowed)
// =============================================================================

def('cargoPod', {
  arch: 'small', n: 2, rim: RC,
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    const shell = v ? mix(P.limewhite, P.neel, 0.12) : mix(P.neel, P.limewhite, 0.2);
    for (const x of [-16, 16]) ps(c, r, RR(c, x - 6, -6, 12, 6, 2), [x - 6, -6, 12, 6], dk(P.neel, 0.4));
    const body = RR(c, -24, -60, 48, 54, 14);
    ps(c, r, body, [-24, -60, 48, 54], shell, { from: 'left' });
    clipTo(c, body, () => {
      fill(c, RR(c, -26, -36, 52, 4, 0), P.neonCyan);
      for (let k = 0; k < 3; k++) fill(c, PL(c, pts([[-18 + k * 8, -18], [-14 + k * 8, -24], [-10 + k * 8, -18], [-14 + k * 8, -12]])), P.haldi, 0.9);
    });
    dab(c, 8, -48, 6, 6, 0, dk(P.neel, 0.5), 1);
    dab(c, 8, -48, 4, 4, 0, mix(P.neonCyan, P.limewhite, 0.3), 1);
  },
  over: (c) => { glow(c, 0, -34, 26, P.neonCyan, 0.25); glow(c, 8, -48, 8, P.neonCyan, 0.4); },
});

def('drone', {
  arch: 'floater', n: 2, rim: RC, m: [16, 14, 14],
  body: (c, r, v) => {
    const body = mix(P.neel, P.limewhite, 0.15);
    for (const sx of [-1, 1]) {
      stick(c, [P2(0, -2), P2(sx * 28, -8)], 2.6, dk(P.neel, 0.3));
      stick(c, [P2(sx * 28, -8), P2(sx * 28, -13)], 2, dk(P.neel, 0.3));
      fill(c, E(c, sx * 28, -14, 15, 3), P.limewhite, 0.5);
      ln(c, [P2(sx * 28 - 13, -14), P2(sx * 28 + 13, -14)], 1.4, mix(P.limewhite, P.neel, 0.3), 0.9);
    }
    ps(c, r, E(c, 0, 0, 16, 9), [-16, -9, 32, 18], body);
    fill(c, RR(c, -10, 6, 20, 5, 2), dk(P.neel, 0.3));
    dab(c, -8, 2, 4, 3.4, 0, dk(P.neel, 0.5), 1);
    dab(c, -8, 2, 2.4, 2, 0, v ? P.neonRani : P.neonCyan, 1);
    dab(c, 10, -4, 1.6, 1.6, 0, P.haldi, 1);
  },
  over: (c, _r, v) => glow(c, -8, 2, 10, v ? P.neonRani : P.neonCyan, 0.4),
});

def('serviceBot', {
  arch: 'walker', n: 2, rim: RC, m: [16, 14, 10],
  under: (c) => shadow(c, 30, 0.35),
  body: (c, r, v) => {
    const shell = mix(P.limewhite, P.neel, 0.1);
    const joint = dk(P.neel, 0.35);
    const sw = v ? 6 : -6;
    stick(c, [P2(4, -30), P2(4 + sw, -2)], 6, joint);
    stick(c, [P2(-8, -30), P2(-8 - sw, -2)], 6, mix(P.neel, P.limewhite, 0.25));
    for (const [x] of [[4 + sw], [-8 - sw]]) ps(c, r, RR(c, x - 8, -5, 14, 5, 2), [x - 8, -5, 14, 5], P.neel);
    ps(c, r, E(c, -2, -50, 22, 24), [-24, -74, 44, 48], shell, { from: 'left' });
    // visor facing left
    ps(c, r, RR(c, -24, -62, 26, 12, 6), [-24, -62, 26, 12], dk(P.neel, 0.45));
    dab(c, -17, -56, 2.4, 2.4, 0, P.neonCyan, 1);
    dab(c, -8, -56, 2.4, 2.4, 0, P.neonCyan, 1);
    // arm with a spanner
    stick(c, [P2(-14, -44), P2(-30, -34)], 3, joint);
    stick(c, [P2(-30, -34), P2(-38, -44)], 2.4, mix(P.khondalite, P.limewhite, 0.3));
    dab(c, -39, -46, 3, 2, 0.6, mix(P.khondalite, P.limewhite, 0.3), 1);
    fill(c, RR(c, -6, -40, 14, 4, 1), P.haldi);
    ln(c, [P2(4, -72), P2(8, -84)], 1, P.ink, 0.9);
    dab(c, 8, -85, 2.2, 2.2, 0, P.neonRani, 1);
  },
  over: (c) => { glow(c, -12, -56, 14, P.neonCyan, 0.3); glow(c, 8, -85, 6, P.neonRani, 0.5); },
});

def('buoy', {
  arch: 'small', n: 2, rim: RC,
  body: (c, r, v) => {
    const a = v ? P.haldi : mix(P.neel, P.limewhite, 0.1);
    fill(c, E(c, 0, -2, 22, 6), dk(P.neel, 0.3));
    const body = PL(c, pts([[-16, -2], [-12, -46], [12, -46], [16, -2]]));
    ps(c, r, body, [-16, -46, 32, 44], a, { from: 'left' });
    clipTo(c, body, () => { fill(c, RR(c, -20, -32, 40, 8, 0), P.limewhite); fill(c, RR(c, -20, -16, 40, 6, 0), v ? P.neel : P.limewhite, 0.9); });
    // solar cap + lantern
    fill(c, PL(c, pts([[-14, -48], [14, -48], [10, -54], [-10, -54]])), mix(P.neel, P.ink, 0.35));
    ln(c, [P2(-8, -51), P2(8, -51)], 0.6, P.neonCyan, 0.8);
    stick(c, [P2(0, -54), P2(0, -64)], 2, mix(P.khondalite, P.limewhite, 0.3));
    ps(c, r, RR(c, -4, -72, 8, 9, 3), [-4, -72, 8, 9], mix(P.neonCyan, P.limewhite, 0.4));
  },
  over: (c, r) => { glow(c, 0, -68, 18, P.neonCyan, 0.45); foamLine(c, r, -26, 26, 1, 12, P.limewhite); },
});

def('logBoom', {
  arch: 'wide', n: 2, rim: RC, m: [14, 22, 10],
  body: (c, r, v) => {
    const bark = mix(BARK, P.neel, 0.15);
    const logAt = (x0: number, x1: number, y: number, rad: number) => {
      ps(c, r, RR(c, x0, y - rad * 2, x1 - x0, rad * 2, rad), [x0, y - rad * 2, x1 - x0, rad * 2], bark);
      fill(c, E(c, x0 + 1, y - rad, rad * 0.6, rad), mix(P.chandan, P.haldi, 0.2));
      stroke(c, E(c, x0 + 1, y - rad, rad * 0.32, rad * 0.55), dk(P.chandan, 0.35), 0.6);
    };
    logAt(-54, -6, 2, 8);
    logAt(4, 52, 2, 8);
    logAt(-30 + v * 8, 28 + v * 8, -14, 7);
    // chain ties
    for (const x of [-20, 20]) for (let k = 0; k < 5; k++) stroke(c, E(c, x, -2 - k * 4.6, 1.6, 2.6), mix(P.khondalite, P.neel, 0.3), 1.4);
    // marker float with a reflector
    ps(c, r, RR(c, -6, -34, 12, 14, 4), [-6, -34, 12, 14], P.haldi);
    fill(c, RR(c, -6, -30, 12, 3, 0), P.neonCyan);
  },
  over: (c, r) => { glow(c, 0, -28, 14, P.neonCyan, 0.35); foamLine(c, r, -58, 58, 2, 18, P.limewhite); },
});

def('turbineGust', {
  arch: 'floater', n: 2, rim: RC, m: [16, 16, 16],
  body: (c, r, v) => {
    const air = mix(P.seafoam, P.limewhite, 0.35);
    for (let k = 0; k < 3; k++) {
      const p: Pt[] = [];
      const turns = 1.4 - k * 0.25;
      for (let i = 0; i <= 26; i++) {
        const t = i / 26, a = t * Math.PI * 2 * turns + k * 2.1;
        const rr = 24 - t * 18 - k * 2;
        p.push(P2(Math.cos(a) * rr * 1.4 - k * 4, Math.sin(a) * rr * 0.8));
      }
      taperStroke(c, p, 7 - k * 1.4, k === 1 ? mix(P.seafoam, P.peacock, 0.25) : air, 1, [0.2, 0.9]);
    }
    for (let i = 0; i < 4; i++) leaf(c, r.range(-30, 26), r.range(-16, 14), 9, 3, r.range(-3, 3), r.pick([LEAF, LEAFL]));
    if (v === 1) for (let i = 0; i < 4; i++) taperStroke(c, [P2(-38, -10 + i * 7), P2(-22, -12 + i * 7)], 2, air, 1);
  },
  over: (c, r) => { for (let i = 0; i < 5; i++) dab(c, r.range(-24, 24), r.range(-12, 12), 1.4, 1.4, 0, P.neonCyan, 0.8); },
});

def('dataCube', {
  arch: 'small', n: 2, rim: RC,
  under: (c) => shadow(c, 26),
  body: (c, _r, v) => {
    const cube = (x: number, y: number, s: number) => {
      const face = mix(P.neel, P.ink, 0.15);
      const top = PL(c, pts([[0, -s], [s, -s * 1.5], [0, -s * 2], [-s, -s * 1.5]], 1, 1, x, y));
      const left = PL(c, pts([[-s, -s * 1.5], [0, -s], [0, 0], [-s, -s * 0.5]], 1, 1, x, y));
      const right = PL(c, pts([[s, -s * 1.5], [0, -s], [0, 0], [s, -s * 0.5]], 1, 1, x, y));
      fill(c, top, mix(P.neel, P.limewhite, 0.35));
      fill(c, left, face);
      fill(c, right, mix(face, P.ink, 0.25));
      for (const [p, sx] of [[left, -1], [right, 1]] as const) clipTo(c, p, () => {
        for (let k = 1; k < 4; k++) ln(c, [P2(x + sx * 2, y - s + k * s * 0.24 - 2), P2(x + sx * s * 0.6, y - s * 1.2 + k * s * 0.24), P2(x + sx * s * 0.6, y - s * 1.05 + k * s * 0.24)], 0.8, P.neonCyan, 0.8);
        // talapatra-like loops etched into glass
        for (let k = 0; k < 3; k++) stroke(c, E(c, x + sx * s * 0.45, y - s * 0.45 + k * 0.1, 1.8, 1.4), mix(P.haldi, P.limewhite, 0.3), 0.6, 0.8);
      });
      ln(c, [P2(x - s, y - s * 1.5), P2(x, y - s), P2(x + s, y - s * 1.5)], 1, P.neonCyan, 0.95);
      ln(c, [P2(x, y - s), P2(x, y)], 1, P.neonCyan, 0.95);
    };
    cube(0, 0, 22);
    cube(v ? 6 : -4, -44, 13);
  },
  over: (c) => { glow(c, 0, -30, 30, P.neonCyan, 0.18); glow(c, 0, -60, 12, P.neonRani, 0.25); },
});

def('lightPillar', {
  arch: 'tall', n: 2, rim: RC, m: [18, 14, 10],
  under: (c) => shadow(c, 26),
  body: (c, r, v) => {
    box3(c, r, -20, 0, 36, 16, 6, mix(P.neel, P.ink, 0.25));
    const col = RR(c, -12, -120, 24, 104, 6);
    fill(c, col, mix(P.neel, P.limewhite, 0.2));
    clipTo(c, col, () => {
      const g = c.createLinearGradient(-12, 0, 12, 0);
      g.addColorStop(0, withAlpha(P.neel, 0.9)); g.addColorStop(0.5, withAlpha(mix(P.neonCyan, P.limewhite, 0.4), 1)); g.addColorStop(1, withAlpha(P.neel, 0.9));
      c.fillStyle = g; c.fillRect(-12, -120, 24, 104);
      for (let k = 0; k < 6; k++) fill(c, RR(c, -12, -110 + k * 16, 24, 2, 0), v ? P.neonRani : P.haldi, 0.8);
    });
    box3(c, r, -16, -118, 28, 6, 5, mix(P.neel, P.ink, 0.25));
  },
  over: (c) => { glow(c, 0, -66, 34, P.neonCyan, 0.25); },
});

def('antenna', {
  arch: 'small', n: 2, rim: RC,
  body: (c, r, v) => {
    const metal = mix(P.limewhite, P.neel, 0.15);
    box3(c, r, -18, 0, 32, 12, 5, mix(P.neel, P.khondalite, 0.3));
    stick(c, [P2(-2, -12), P2(-2, -36)], 4, dk(metal, 0.3));
    stick(c, [P2(-14, -12), P2(-2, -30)], 2, dk(metal, 0.3));
    stick(c, [P2(10, -12), P2(-2, -30)], 2, dk(metal, 0.3));
    c.save(); c.translate(-2, -42); c.rotate(-0.5 + v * 0.3);
    const dish = () => { c.beginPath(); c.ellipse(0, 0, 24, 10, 0, 0, Math.PI); c.closePath(); };
    ps(c, r, dish, [-24, 0, 48, 10], metal);
    fill(c, E(c, 0, 0, 24, 3), lt(metal, 0.3));
    stick(c, [P2(0, 0), P2(0, -20)], 1.6, dk(metal, 0.3));
    dab(c, 0, -22, 3, 3, 0, P.neonRani, 1);
    c.restore();
  },
  over: (c, _r, v) => { c.save(); c.translate(-2, -42); c.rotate(-0.5 + v * 0.3); glow(c, 0, -22, 10, P.neonRani, 0.5); c.restore(); },
});

def('panel', {
  arch: 'ceil', n: 2, rim: RC, m: [16, 4, 14],
  body: (c, r, v) => {
    const frame = mix(P.haldi, P.khondalite, 0.35);
    ps(c, r, RR(c, -14, 0, 28, 8, 1), [-14, 0, 28, 8], mix(P.khondalite, P.neel, 0.3));
    stick(c, [P2(0, 6), P2(0, 22)], 4, mix(P.khondalite, P.neel, 0.3));
    c.save(); c.translate(0, 22); c.rotate(v ? 0.12 : -0.08);
    ps(c, r, RR(c, -26, 0, 52, 70, 2), [-26, 0, 52, 70], frame);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      fill(c, RR(c, -23 + i * 16, 3 + j * 16.6, 14.6, 15, 1), mix(P.neel, P.ink, 0.2));
      ln(c, [P2(-23 + i * 16, 3 + j * 16.6 + 7.5), P2(-8.4 + i * 16, 3 + j * 16.6 + 7.5)], 0.5, P.neonCyan, 0.6);
      dab(c, -19 + i * 16, 6 + j * 16.6, 2.6, 1.2, -0.4, P.limewhite, 0.35);
    }
    c.restore();
  },
  over: (c) => glow(c, 0, 56, 30, P.neonCyan, 0.12),
});

def('asteroid', {
  arch: 'air', n: 2, rim: RC, m: [14, 14, 14],
  body: (c, r, v) => {
    const col = mix(P.khondalite, P.neel, 0.25);
    rock(c, r, 0, 0, 36 - v * 4, 27, col, false);
    for (let i = 0; i < 6; i++) {
      const x = r.range(-24, 24), y = r.range(-16, 16), rr = r.range(3, 7);
      fill(c, E(c, x, y, rr, rr * 0.75), dk(col, 0.35));
      stroke(c, () => { c.beginPath(); c.ellipse(x, y, rr, rr * 0.75, 0, Math.PI * 0.1, Math.PI * 0.9); }, lt(col, 0.4), 1, 0.8);
    }
    rock(c, r, 38, -18, 6, 5, col, false);
  },
  over: (c) => { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 30, -10, 26, P.neonRani, 0.18); c.restore(); },
});

def('satellite', {
  arch: 'floater', n: 2, rim: RC, m: [18, 16, 16],
  body: (c, r, v) => {
    const foil = mix(P.haldi, P.khondalite, 0.4);
    for (const sx of [-1, 1]) {
      stick(c, [P2(sx * 10, 0), P2(sx * 16, 0)], 2, mix(P.khondalite, P.limewhite, 0.3));
      c.save(); c.translate(sx * 27, 0); c.rotate(sx * (v ? 0.15 : -0.1));
      ps(c, r, RR(c, -11, -9, 22, 18, 1), [-11, -9, 22, 18], mix(P.neel, P.ink, 0.15));
      for (let k = 1; k < 3; k++) ln(c, [P2(-11 + k * 7.3, -9), P2(-11 + k * 7.3, 9)], 0.6, P.neonCyan, 0.7);
      ln(c, [P2(-11, 0), P2(11, 0)], 0.6, P.neonCyan, 0.7);
      c.restore();
    }
    ps(c, r, RR(c, -10, -10, 20, 20, 2), [-10, -10, 20, 20], foil);
    for (let i = 0; i < 6; i++) ln(c, [P2(r.range(-9, 5), r.range(-9, 9)), P2(r.range(-5, 9), r.range(-9, 9))], 0.5, lt(foil, 0.4), 0.7);
    c.save(); c.translate(0, -12); c.rotate(-0.4);
    fill(c, () => { c.beginPath(); c.ellipse(0, 0, 9, 4, 0, Math.PI, Math.PI * 2); c.closePath(); }, P.limewhite);
    ln(c, [P2(0, 0), P2(0, -7)], 0.8, P.ink, 0.8);
    c.restore();
    dab(c, 6, 6, 1.6, 1.6, 0, P.neonRani, 1);
  },
});

def('meteor', {
  arch: 'air', n: 2, rim: RC, m: [16, 14, 14],
  body: (c, r, v) => {
    // tail streams to the right (it travels left)
    const tails = [[P.neonRani, 22, -6], [P.marigold, 18, 0], [P.haldi, 12, 2]] as const;
    for (const [col, w, dy] of tails) taperStroke(c, curvePts(-20, 4 + dy * 0.3, 14, -6 + dy, 50, -24 + dy - v * 4, 10), w, col, 0.95, [1, 0.05]);
    taperStroke(c, curvePts(-18, 3, 10, -4, 40, -18 - v * 4, 10), 5, mix(P.haldi, P.limewhite, 0.5), 1, [1, 0.05]);
    rock(c, r, -22, 6, 15, 13, mix(P.khondalite, P.neel, 0.2), false);
    dab(c, -26, 2, 5, 3, -0.4, mix(P.marigold, P.haldi, 0.4), 0.6);
  },
  over: (c) => glow(c, -18, 4, 30, P.marigold, 0.3),
});

// ---- generic fallbacks for unknown keys -------------------------------------
def('_ceil', {
  arch: 'ceil', n: 1, m: [16, 4, 14],
  body: (c, r) => {
    stick(c, [P2(0, 0), P2(0, 30)], 2, mix(P.chandan, P.khondalite, 0.3));
    for (let k = 0; k < 5; k++) stick(c, [P2(-12 + k * 6, 26), P2(-14 + k * 7, 90)], 4, k % 2 ? BAMBOO : mix(BAMBOO, P.ink, 0.15));
    rope(c, [P2(-16, 34), P2(16, 34)], 3, mix(P.chandan, P.khondalite, 0.2));
    rope(c, [P2(-16, 70), P2(18, 70)], 3, mix(P.chandan, P.khondalite, 0.2));
    void r;
  },
});
const FALLBACK: Record<Arch, string> = {
  small: 'stone', wide: 'log', tall: 'pole', pit: 'moat', roller: 'boulder', walker: 'cow', floater: 'leaves', air: 'stormcell', ceil: '_ceil',
};

// ---- public API ---------------------------------------------------------------
const PHASE1: Record<string, number> = { reed: 3, mud: 2, stakes: 1 };

/** Number of visual variants for a visual key (1–3). */
export function hazardVariants(vis: string): number {
  if (vis in PHASE1) return PHASE1[vis];
  const d = D[vis];
  return d ? Math.max(1, Math.min(3, d.n ?? 1)) : 1;
}

/** Paint one hazard visual. Unknown vis keys fall back to a generic painting per archetype (never throws). */
export function paintHazard(vis: string, arch: Arch, variant: number): Sprite {
  const v0 = Math.max(0, Math.floor(variant) || 0);
  if (vis === 'reed') { const v = v0 % 3; const o = ORIGIN.reed(v); return { canvas: paintReed(v), ox: o.x, oy: o.y }; }
  if (vis === 'mud') { const v = v0 % 2; const o = ORIGIN.mud(v); return { canvas: paintMud(v), ox: o.x, oy: o.y }; }
  if (vis === 'stakes') { const o = ORIGIN.stakes(); return { canvas: paintStakes(), ox: o.x, oy: o.y }; }
  let key = `${vis}@${arch}`;
  let d = D[key];
  if (!d) { d = D[vis]; key = vis; }
  if (!d || d.arch !== arch) { key = FALLBACK[arch] ?? 'stone'; d = D[key]; }
  const a = d.arch;
  const n = Math.max(1, d.n ?? 1);
  const v = v0 % n;
  const { W, H, ox, oy } = layout(a, d.m);
  try {
    return render(W, H, ox, oy, `hz:${key}:${v}`, v, d.rim ?? RW, d.body, d.under, d.over);
  } catch {
    const [c] = makeCanvas(W * S, H * S);
    return { canvas: c, ox: ox / W, oy: oy / H };
  }
}

/** Every key this module paints on purpose (for previews / tests). */
export function hazardKeys(): string[] {
  return ['reed', 'mud', 'stakes', ...Object.keys(D).filter((k) => !k.startsWith('_'))];
}

// =============================================================================
// Record visuals (collectible look: haldi body + sindoor band, soft glow)
// =============================================================================
const RC_ = FIXED.record;
/** Record visuals other than the palm leaf: 'drum' (a mridanga, r19) and 'oar' (r26). Origin centre. */
export function paintRecordVis(vis: 'drum' | 'oar'): Sprite {
  const W = vis === 'oar' ? 136 : 100, H = vis === 'oar' ? 60 : 76;
  const ox = W / 2, oy = H / 2;
  const body: Paint = (c, r) => {
    if (vis === 'drum') {
      const path = SM(c, pts([[-30, -14], [-14, -19], [8, -20], [30, -16], [30, 16], [8, 20], [-14, 19], [-30, 14]]));
      path(); c.fillStyle = RC_.leaf; c.fill();
      clipTo(c, path, () => {
        const g = c.createLinearGradient(0, -20, 0, 20);
        g.addColorStop(0, withAlpha(P.limewhite, 0.5)); g.addColorStop(0.35, withAlpha(RC_.leaf, 0)); g.addColorStop(1, withAlpha(RC_.leafShade, 0.85));
        c.fillStyle = g; c.fillRect(-32, -22, 64, 44);
        // leather lacing
        for (let k = 0; k < 10; k++) { const x = -26 + k * 5.8; ln(c, [P2(x, -18), P2(x + 3, 18)], 0.8, RC_.script, 0.55); }
      });
      // heads
      for (const [x, ry, rx] of [[-30, 14, 5.4], [30, 16, 6]] as const) {
        fill(c, E(c, x, 0, rx, ry), RC_.script);
        fill(c, E(c, x, 0, rx - 1.6, ry - 1.6), mix(P.limewhite, P.chandan, 0.3));
        fill(c, E(c, x, 0, (rx - 1.6) * 0.5, (ry - 1.6) * 0.5), P.ink);
      }
      // sindoor band + carrying string
      fill(c, RR(c, -4, -20.5, 8, 41, 2), RC_.string);
      for (let k = 0; k < 6; k++) dab(c, 0, -17 + k * 7, 2.6, 1.2, 0.5, mix(RC_.string, P.haldi, 0.3), 1);
      taperStroke(c, curvePts(-24, -15, 0, -34, 24, -15, 12), 2.4, RC_.string, 1, [1, 1]);
    } else {
      const shaft = [P2(-58, 2), P2(18, -1)];
      taperStroke(c, shaft, 6.6, RC_.script, 1, [1, 1]);
      taperStroke(c, shaft, 4.6, RC_.leaf, 1, [1, 1]);
      fill(c, RR(c, -62, -1, 10, 6, 3), RC_.leafShade);
      const blade = SM(c, pts([[14, -2], [26, -11], [52, -13], [60, 0], [52, 12], [26, 10]]));
      blade(); c.fillStyle = RC_.leaf; c.fill();
      c.strokeStyle = RC_.script; c.lineWidth = 1.6; c.stroke();
      clipTo(c, blade, () => {
        const g = c.createLinearGradient(0, -13, 0, 13);
        g.addColorStop(0, withAlpha(P.limewhite, 0.5)); g.addColorStop(0.4, withAlpha(RC_.leaf, 0)); g.addColorStop(1, withAlpha(RC_.leafShade, 0.85));
        c.fillStyle = g; c.fillRect(12, -14, 50, 28);
        ln(c, [P2(20, -0.5), P2(56, 0)], 1, RC_.leafShade, 0.8);
      });
      // sindoor bands and a ribbon tail
      for (const x of [2, 8]) fill(c, RR(c, x, -4.4, 3.4, 9, 1), RC_.string);
      taperStroke(c, curvePts(6, 4, 0, 16, -10, 14, 8), 2.6, RC_.string, 1, [1, 0.4]);
      taperStroke(c, curvePts(9, 4, 10, 16, 2, 20, 8), 2.6, RC_.string, 1, [1, 0.4]);
    }
    void r;
  };
  const under: Paint = (c) => glow(c, 0, 0, vis === 'oar' ? 60 : 42, P.haldi, 0.4, 1.4);
  return render(W, H, ox, oy, `rec:${vis}`, 0, RC_.script, body, under);
}

// =============================================================================
// Friends (never hazards): a kirtan group and olive ridley hatchlings.
// =============================================================================
/** 'kirtan' (r18) or 'turtle' (f2). ~90×80 logical, origin bottom-centre on the lane. */
export function paintFriend(vis: 'kirtan' | 'turtle', variant: number): Sprite {
  const v = Math.max(0, Math.floor(variant) || 0) % 3;
  const W = 120, H = 104, ox = 60, oy = 94;
  if (vis === 'kirtan') {
    const body: Paint = (c, _r, vv) => {
      const cloths = [[P.limewhite, P.haldi], [P.haldi, P.tota], [P.limewhite, P.marigold]];
      const setups: { x: number; pose: 'cymbal' | 'drum' | 'armsUp' | 'wave'; head: 'none' | 'turban' | 'bun' | 'cap'; skin: number; sari?: boolean }[][] = [
        [{ x: -24, pose: 'cymbal', head: 'none', skin: 0.3 }, { x: 4, pose: 'drum', head: 'turban', skin: 0.6 }, { x: 28, pose: 'armsUp', head: 'bun', skin: 0.45, sari: true }],
        [{ x: -18, pose: 'drum', head: 'none', skin: 0.5 }, { x: 16, pose: 'cymbal', head: 'cap', skin: 0.35 }],
        [{ x: -28, pose: 'armsUp', head: 'none', skin: 0.7 }, { x: 0, pose: 'cymbal', head: 'turban', skin: 0.4 }, { x: 26, pose: 'drum', head: 'none', skin: 0.55 }],
      ];
      const s = 1.85;
      setups[vv].forEach((p, i) => {
        const [c1, c2] = cloths[(i + vv) % 3];
        const f = i % 2 ? 1 : -1;
        const pose = p.pose === 'cymbal' ? 'armsUp' : p.pose;
        person(c, p.x, 0, s, { cloth: c1, cloth2: c2, pose, head: p.head, skin: p.skin, facing: f, sari: p.sari, phase: i + vv });
        const sy = -25 * s;
        if (p.pose === 'cymbal') {
          // kartals clashing overhead
          const brass = mix(P.haldi, P.khondalite, 0.35);
          for (const hx of [p.x - 3 * s, p.x + 4 * s]) { dab(c, hx, sy - 9 * s, 4, 1.6, hx < p.x ? 0.5 : -0.5, brass, 1); dab(c, hx, sy - 9 * s - 0.6, 1.2, 0.8, 0, P.limewhite, 0.7); }
        } else if (p.pose === 'drum') {
          // mridanga slung across the waist (wood brown, not the record's haldi)
          const dx = p.x + 4 * s * f, dy = sy + 7 * s;
          const wood = mix(P.laterite, P.chandan, 0.25);
          fill(c, SM(c, pts([[-13, -5], [0, -7.5], [13, -6], [13, 6], [0, 7.5], [-13, 5]], 1, 1, dx, dy)), wood);
          for (let k = -2; k <= 2; k++) ln(c, [P2(dx + k * 5, dy - 7), P2(dx + k * 5 + 1.5, dy + 7)], 0.6, dk(wood, 0.4), 0.8);
          for (const [hx, ry] of [[dx - 13, 5], [dx + 13, 6]] as const) { fill(c, E(c, hx, dy, 2.6, ry), P.limewhite); dab(c, hx, dy, 1.1, ry * 0.45, 0, P.ink, 1); }
          taperStroke(c, curvePts(dx - 8, dy - 6, p.x - 2 * s * f, sy - 4, dx + 8, dy - 6, 8), 1.2, P.tota, 1, [1, 1]);
        }
      });
      // musical notes (no text)
      for (let k = 0; k < 3; k++) {
        const x = -30 + k * 26 + vv * 4, y = -86 + (k % 2) * 6;
        dab(c, x, y, 2.6, 2, -0.4, P.neel, 0.85);
        ln(c, [P2(x + 2.2, y), P2(x + 2.2, y - 9)], 1, P.neel, 0.85);
        taperStroke(c, curvePts(x + 2.2, y - 9, x + 6, y - 7, x + 6, y - 3, 4), 1, P.neel, 0.85);
      }
    };
    return render(W, H, ox, oy, `friend:kirtan:${v}`, v, mix(P.laterite, P.ink, 0.5), body, (c) => softShadow(c, 0, 1, 48, 6, DERIVED.shadowWarm, 0.35));
  }
  const body: Paint = (c, r, vv) => {
    const shell = mix(P.tota, P.khondalite, 0.55);
    const skin = mix(P.khondalite, P.seafoam, 0.25);
    const spots = [[[-30, 0], [0, -3], [30, 1]], [[-22, -2], [18, 0]], [[-40, 1], [-4, -3], [36, 0]]][vv];
    for (const [x, y] of spots) {
      const s = r.range(1.35, 1.55);
      c.save(); c.translate(x, y); c.scale(s, s);
      leaf(c, -4, -2, 9, 3, 2.6, skin);
      leaf(c, 4, -2, 9, 3, 0.5, skin);
      ps(c, r, E(c, 0, -4, 8, 5), [-8, -9, 16, 10], shell, { light: lt(shell, 0.3) });
      for (let k = -1; k <= 1; k++) ln(c, [P2(k * 3.4, -8), P2(k * 3.4, -1)], 0.5, dk(shell, 0.4), 0.6);
      dab(c, -10, -5, 3.4, 2.8, 0, skin, 1);
      dab(c, -11, -6, 0.8, 0.8, 0, P.ink, 1);
      c.restore();
    }
    // the lantern drone keeping watch
    const dy = -70;
    stick(c, [P2(-12, dy - 4), P2(12, dy - 4)], 1.4, mix(P.neel, P.limewhite, 0.3));
    fill(c, E(c, -12, dy - 6, 7, 1.4), P.limewhite, 0.6);
    fill(c, E(c, 12, dy - 6, 7, 1.4), P.limewhite, 0.6);
    ps(c, r, RR(c, -6, dy - 4, 12, 9, 3), [-6, dy - 4, 12, 9], P.neel);
    ps(c, r, RR(c, -4, dy + 5, 8, 8, 3), [-4, dy + 5, 8, 8], mix(P.haldi, P.limewhite, 0.2));
    dab(c, 3, dy, 1.2, 1.2, 0, P.neonCyan, 1);
  };
  const over: Paint = (c, r) => {
    c.save();
    c.beginPath(); c.moveTo(-5, -57); c.lineTo(5, -57); c.lineTo(40, 0); c.lineTo(-40, 0); c.closePath();
    const g = c.createLinearGradient(0, -57, 0, 0);
    g.addColorStop(0, withAlpha(P.haldi, 0.35)); g.addColorStop(1, withAlpha(P.haldi, 0));
    c.fillStyle = g; c.fill();
    c.restore();
    glow(c, 0, -62, 20, P.marigold, 0.5);
    for (let i = 0; i < 14; i++) dab(c, r.range(-48, 48), r.range(0, 3), r.range(3, 7), 1.4, 0, P.limewhite, 0.55);
  };
  return render(W, H, ox, oy, `friend:turtle:${v}`, v, RC, body, undefined, over);
}
