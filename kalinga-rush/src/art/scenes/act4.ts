// Act IV · Company & Resistance (records 20–26). Faded indigo + sepia, almost
// duotone: every scene is painted in ordinary colour and toned at bake time
// (engine `tone`). 22 and 26 are near-monochrome; 25 is painted in full
// festival colour and `flood`s back from the toned copy as the province is born.
// Quiet throughout: no fighting, no villains — Company people are just people.
import { DERIVED, P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, dabField, glow, paintedShape, polyPath, smoothPath, softShadow, taperStroke, vGradient, wrapped, type Ctx, type Pt } from '../brush';
import { bank, scatter, treeRow, type Landmark, type SceneDef } from '../engine';
import { colonial, house, pandal, rekhaDeula, stall } from '../kit/buildings';
import { bullockCartBg } from '../kit/craft';
import { crowd, flag, person, skinTone, type Headwear, type Pose } from '../kit/people';
import { cow, crow, goat, horse } from '../kit/animals';
import { broadTree, coconutPalm, egret, palmyraPalm, reedTuft } from '../shared/nature';

// ---- act look -------------------------------------------------------------------
const TONE_DARK = mix(P.neel, P.ink, 0.4);
const TONE_LIGHT = mix(P.skyCream, DERIVED.sepia, 0.3);
const tone = (amount: number) => ({ amount, dark: TONE_DARK, light: TONE_LIGHT });

const hz = (c: string, h = 0) => (h ? mix(c, P.skyCream, h) : c);
const WOOD = mix(P.laterite, P.ink, 0.35);
const WOOD_L = mix(P.laterite, P.chandan, 0.35);
const ODIA_FONT = "700 40px 'Baloo Bhaina 2', serif";

// ---- local props ------------------------------------------------------------------

/** A black cotton umbrella (chhata); (x, y) = bottom of the handle. */
function umbrella(ctx: Ctx, x: number, y: number, r: number, col: string, haze = 0): void {
  const cy = y - r * 2.1;
  taperStroke(ctx, [{ x, y }, { x, y: cy - r * 0.55 }], Math.max(1, r * 0.08), hz(WOOD, haze), 1, [1, 1]);
  ctx.fillStyle = hz(col, haze);
  ctx.beginPath();
  ctx.ellipse(x, cy, r, r * 0.62, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 6; i++) dab(ctx, x - r + (i + 0.5) * (r / 3), cy, r / 6, r * 0.1, 0, hz(col, haze), 1);
  ctx.strokeStyle = withAlpha(hz(mix(col, P.limewhite, 0.3), haze), 0.5);
  ctx.lineWidth = Math.max(0.6, r * 0.04);
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x, cy - r * 0.62);
    ctx.quadraticCurveTo(x + (i / 6 - 0.5) * r * 1.4, cy - r * 0.45, x - r + (i / 6) * 2 * r, cy);
    ctx.stroke();
  }
  dab(ctx, x, cy - r * 0.66, r * 0.08, r * 0.1, 0, hz(WOOD, haze), 1);
}

/** Bare, leafless tree (famine); (x, y) = foot. */
function bareTree(ctx: Ctx, rng: Rng, x: number, y: number, h: number, col: string): void {
  const branch = (x0: number, y0: number, ang: number, len: number, w: number, d: number) => {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    taperStroke(ctx, curvePts(x0, y0, (x0 + x1) / 2 + rng.range(-0.12, 0.12) * len, (y0 + y1) / 2, x1, y1, 6), w, col, 1, [1, 0.45]);
    if (d >= 5 || len < 5) return;
    const n = rng.int(2, 3);
    for (let i = 0; i < n; i++) branch(x1, y1, ang + (i - (n - 1) / 2) * 0.55 + rng.range(-0.25, 0.25), len * rng.range(0.62, 0.78), w * 0.62, d + 1);
  };
  branch(x, y, -Math.PI / 2 + rng.range(-0.1, 0.1), h * 0.34, h * 0.07, 0);
}

/** A clump of bamboo; (x, y) = foot. */
function bamboo(ctx: Ctx, rng: Rng, x: number, y: number, h: number, haze = 0): void {
  const stem = hz(mix(P.tota, P.haldi, 0.35), haze);
  const leaf = hz(mix(P.tota, P.peacock, 0.25), haze);
  const leafL = hz(mix(P.tota, P.haldi, 0.5), haze);
  for (let i = 0; i < 7; i++) {
    const off = (i - 3) * h * 0.025;
    const lean = off * 3 + rng.range(-0.08, 0.08) * h;
    const hh = h * rng.range(0.75, 1);
    const pts = curvePts(x + off, y, x + off + lean * 0.3, y - hh * 0.6, x + off + lean, y - hh, 10);
    taperStroke(ctx, pts, h * 0.02, stem, 1, [1, 0.5]);
    for (let k = 3; k < pts.length; k++) {
      const p = pts[k];
      for (const side of [-1, 1]) {
        if (!rng.chance(0.6)) continue;
        const l = h * rng.range(0.06, 0.11);
        taperStroke(ctx, [p, { x: p.x + side * l, y: p.y + l * 0.35 }], h * 0.018, rng.chance(0.4) ? leafL : leaf, 0.9, [0.3, 0.05]);
      }
    }
  }
}

/** Peacock perched, its long train hanging down over the edge. (x, y) = feet. */
function peacock(ctx: Ctx, x: number, y: number, s: number, f: 1 | -1 = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f * s, s);
  const tails = [P.tota, mix(P.tota, P.peacock, 0.5), P.peacock, mix(P.peacock, P.neel, 0.3)];
  for (let i = 0; i < 11; i++) {
    const off = (i - 5) * 1.9;
    const end = { x: -10 + off * 1.3, y: 44 + Math.abs(off) * 0.4 };
    taperStroke(ctx, curvePts(-6, -8, -14 + off * 0.4, 12, end.x, end.y, 8), 3.4, tails[i % 4], 0.95, [0.7, 0.9]);
  }
  for (let i = 0; i < 11; i++) {
    const off = (i - 5) * 1.9;
    for (const t of [0.55, 1]) {
      const ex = -10 + off * 1.3 * t + (1 - t) * -4, ey = -8 + (52 + Math.abs(off) * 0.4) * t;
      dab(ctx, ex, ey, 2.2, 2.5, 0, P.haldi, 1);
      dab(ctx, ex, ey, 1.3, 1.5, 0, P.neel, 1);
    }
  }
  taperStroke(ctx, [{ x: -1, y: -6 }, { x: -1, y: 0 }], 1, P.khondalite, 1);
  taperStroke(ctx, [{ x: 2, y: -6 }, { x: 2, y: 0 }], 1, P.khondalite, 1);
  dab(ctx, 0, -11, 8.5, 6, -0.25, P.peacock, 1);
  dab(ctx, -2, -11, 6, 4, -0.2, mix(P.chandan, P.khondalite, 0.3), 1);
  taperStroke(ctx, [{ x: 4, y: -14 }, { x: 8, y: -22 }, { x: 9, y: -29 }], 5, mix(P.neel, P.peacock, 0.35), 1, [1, 0.7]);
  dab(ctx, 10, -30, 3.2, 2.7, 0, mix(P.neel, P.peacock, 0.35), 1);
  taperStroke(ctx, [{ x: 12, y: -30 }, { x: 15.5, y: -29 }], 1.4, P.khondalite, 1, [1, 0.2]);
  dab(ctx, 11, -30.5, 1, 0.8, 0, P.limewhite, 1);
  for (let i = 0; i < 3; i++) {
    const cx = 8.6 + i * 1.3;
    taperStroke(ctx, [{ x: 9.5, y: -32 }, { x: cx, y: -37.5 }], 0.6, P.neel, 1, [1, 1]);
    dab(ctx, cx, -38, 0.9, 0.9, 0, P.peacock, 1);
  }
  ctx.restore();
}

/** Weighing scale: a heap of cowries on one pan, three silver coins on the other — and the beam level. */
function balance(ctx: Ctx, rng: Rng, x: number, y: number, s: number): void {
  const metal = mix(P.khondalite, P.haldi, 0.35);
  ctx.fillStyle = WOOD;
  ctx.fillRect(x - 10 * s, y - 3 * s, 20 * s, 3 * s);
  taperStroke(ctx, [{ x, y }, { x, y: y - 46 * s }], 3 * s, WOOD, 1, [1, 1]);
  taperStroke(ctx, [{ x: x - 31 * s, y: y - 44 * s }, { x: x + 31 * s, y: y - 44 * s }], 2.4 * s, metal, 1, [1, 1]);
  dab(ctx, x, y - 46 * s, 2.4 * s, 2.4 * s, 0, metal, 1);
  taperStroke(ctx, [{ x, y: y - 46 * s }, { x, y: y - 53 * s }], 1.2 * s, metal, 1, [1, 0.4]);
  ctx.strokeStyle = withAlpha(mix(P.khondalite, P.ink, 0.3), 0.8);
  ctx.lineWidth = 0.7 * s;
  for (const side of [-1, 1]) {
    const px = x + side * 30 * s, py = y - 22 * s;
    ctx.beginPath();
    ctx.moveTo(px, y - 44 * s); ctx.lineTo(px - 10 * s, py);
    ctx.moveTo(px, y - 44 * s); ctx.lineTo(px + 10 * s, py);
    ctx.stroke();
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.ellipse(px, py, 12 * s, 4 * s, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    dab(ctx, px, py, 12 * s, 1.4 * s, 0, mix(metal, P.limewhite, 0.4), 1);
  }
  // cowrie mountain on the left pan
  const cx = x - 30 * s, cy = y - 22 * s;
  for (let i = 0; i < 90; i++) {
    const u = rng.range(-1, 1);
    const top = (1 - u * u) * 15 * s;
    const px = cx + u * 11 * s, py = cy - rng.next() * top;
    dab(ctx, px, py, 1.6 * s, 1.1 * s, rng.next() * 3, rng.chance(0.75) ? P.limewhite : mix(P.limewhite, P.chandan, 0.35), 1);
    if (rng.chance(0.3)) dab(ctx, px, py, 0.9 * s, 0.25 * s, 0, mix(P.chandan, P.ink, 0.3), 0.6);
  }
  // three coins on the right
  const silver = mix(P.limewhite, P.khondalite, 0.35);
  for (let i = 0; i < 3; i++) {
    const kx = x + 30 * s + (i - 1) * 4 * s, ky = y - 23 * s - (i === 1 ? 1.6 * s : 0);
    dab(ctx, kx, ky, 3 * s, 1.2 * s, 0, mix(silver, P.ink, 0.25), 1);
    dab(ctx, kx, ky - 0.4 * s, 3 * s, 1.1 * s, 0, silver, 1);
    dab(ctx, kx - 1 * s, ky - 0.6 * s, 1 * s, 0.4 * s, 0, P.limewhite, 1);
  }
}

/** A woven basket; (x, y) = bottom centre, optionally heaped with cowries. */
function basket(ctx: Ctx, rng: Rng, x: number, y: number, r: number, cowries = false): void {
  const cane = mix(P.haldi, P.laterite, 0.45);
  if (cowries) for (let i = 0; i < 26; i++) dab(ctx, x + rng.range(-0.8, 0.8) * r, y - r * 0.9 - rng.next() * r * 0.35, r * 0.13, r * 0.09, rng.next() * 3, P.limewhite, 1);
  ctx.fillStyle = cane;
  ctx.beginPath();
  ctx.moveTo(x - r, y - r * 0.9);
  ctx.quadraticCurveTo(x - r * 0.95, y, x, y);
  ctx.quadraticCurveTo(x + r * 0.95, y, x + r, y - r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha(mix(cane, P.ink, 0.35), 0.6);
  ctx.lineWidth = Math.max(0.6, r * 0.06);
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - r * (1 - i * 0.04), y - r * 0.9 + i * r * 0.2); ctx.lineTo(x + r * (1 - i * 0.04), y - r * 0.9 + i * r * 0.2); ctx.stroke(); }
  dab(ctx, x, y - r * 0.9, r, r * 0.16, 0, mix(cane, P.chandan, 0.3), 1);
}

/** Thatched shed on four posts; (x, y) = ground centre. */
function thatchShed(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze = 0): void {
  const roof = hz(mix(P.haldi, P.laterite, 0.45), haze);
  for (const px of [x - w / 2 + 6, x - w / 6, x + w / 6, x + w / 2 - 6]) taperStroke(ctx, [{ x: px, y }, { x: px, y: y - h * 0.64 }], Math.max(2, w * 0.018), hz(WOOD, haze), 1, [1, 1]);
  const rp = () => polyPath(ctx, [{ x: x - w / 2 - 14, y: y - h * 0.58 }, { x: x - w * 0.3, y: y - h }, { x: x + w * 0.3, y: y - h }, { x: x + w / 2 + 14, y: y - h * 0.58 }]);
  paintedShape(ctx, rng, rp, { x: x - w / 2 - 14, y: y - h, w: w + 28, h: h * 0.42 }, { base: roof, light: hz(mix(roof, P.haldi, 0.4), haze), shade: hz(mix(roof, P.ink, 0.35), haze), lightFrom: 'right', dabs: 30 });
  clipTo(ctx, rp, () => {
    for (let i = 0; i < w / 2.2; i++) {
      const px = x - w / 2 - 14 + rng.next() * (w + 28);
      const py = y - h + rng.next() * h * 0.42;
      taperStroke(ctx, [{ x: px, y: py }, { x: px + rng.range(-1, 1), y: py + rng.range(5, 10) }], 1.2, hz(rng.chance(0.5) ? mix(roof, P.ink, 0.3) : mix(roof, P.limewhite, 0.3), haze), 0.6, [0.6, 0.2]);
    }
  });
  for (let px = x - w / 2 - 12; px < x + w / 2 + 12; px += 4) taperStroke(ctx, [{ x: px, y: y - h * 0.6 }, { x: px + rng.range(-1, 1), y: y - h * 0.55 + rng.range(0, 3) }], 1.6, hz(mix(roof, P.ink, 0.25), haze), 0.9, [1, 0.2]);
}

/** A big cooking pot (handi) on a three-stone hearth with a small fire. (x, y) = ground. */
function cookPot(ctx: Ctx, rng: Rng, x: number, y: number, r: number): void {
  glow(ctx, x, y - r * 0.5, r * 1.5, P.marigold, 0.45);
  for (const k of [-1, 0, 1]) dab(ctx, x + k * r * 0.8, y - r * 0.18, r * 0.32, r * 0.25, 0, mix(P.khondalite, P.ink, 0.3), 1);
  for (let i = 0; i < 6; i++) dab(ctx, x + rng.range(-0.5, 0.5) * r, y - r * rng.range(0.2, 0.5), r * 0.12, r * 0.22, rng.range(-0.3, 0.3), rng.pick([P.marigold, P.haldi, P.sindoor]), 0.9);
  const pot = mix(P.laterite, P.ink, 0.3);
  dab(ctx, x, y - r * 1.25, r, r * 0.82, 0, pot, 1);
  dab(ctx, x + r * 0.35, y - r * 1.45, r * 0.35, r * 0.3, 0, mix(pot, P.chandan, 0.4), 0.6);
  dab(ctx, x, y - r * 1.98, r * 0.62, r * 0.18, 0, mix(pot, P.ink, 0.4), 1);
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * r * 0.3;
    taperStroke(ctx, curvePts(sx, y - r * 2.1, sx + r * 0.5, y - r * 2.8, sx - r * 0.1, y - r * 3.6, 8), r * 0.22, P.limewhite, 0.3, [0.4, 0.1]);
  }
}

/** A brick well with a crossbar and pulley; (x, y) = ground centre. */
function well(ctx: Ctx, rng: Rng, x: number, y: number, s: number): void {
  const brick = mix(P.laterite, P.khondalite, 0.45);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 24 * s, y }, { x: x - 24 * s, y: y - 20 * s }, { x: x + 24 * s, y: y - 20 * s }, { x: x + 24 * s, y }]), { x: x - 24 * s, y: y - 20 * s, w: 48 * s, h: 20 * s }, { base: brick, light: mix(brick, P.limewhite, 0.35), shade: mix(brick, P.ink, 0.4), lightFrom: 'right' });
  ctx.strokeStyle = withAlpha(mix(brick, P.ink, 0.5), 0.45);
  ctx.lineWidth = 0.8;
  for (let yy = y - 16 * s; yy < y; yy += 4 * s) { ctx.beginPath(); ctx.moveTo(x - 24 * s, yy); ctx.lineTo(x + 24 * s, yy); ctx.stroke(); }
  dab(ctx, x, y - 20 * s, 24 * s, 5 * s, 0, mix(brick, P.limewhite, 0.25), 1);
  dab(ctx, x, y - 20 * s, 19 * s, 3.4 * s, 0, mix(P.ink, P.neel, 0.2), 1);
  for (const k of [-1, 1]) taperStroke(ctx, [{ x: x + k * 20 * s, y: y - 21 * s }, { x: x + k * 19 * s, y: y - 54 * s }], 2.6 * s, WOOD, 1, [1, 1]);
  taperStroke(ctx, [{ x: x - 23 * s, y: y - 52 * s }, { x: x + 23 * s, y: y - 52 * s }], 2.4 * s, WOOD, 1, [1, 1]);
  dab(ctx, x, y - 50 * s, 3 * s, 3 * s, 0, mix(WOOD, P.chandan, 0.3), 1);
  taperStroke(ctx, [{ x, y: y - 50 * s }, { x, y: y - 24 * s }], 0.8 * s, mix(P.chandan, P.khondalite, 0.4), 1, [1, 1]);
  // an empty pail on its side
  ctx.fillStyle = mix(P.khondalite, P.haldi, 0.2);
  ctx.beginPath();
  ctx.moveTo(x + 30 * s, y - 1 * s); ctx.lineTo(x + 40 * s, y - 3 * s); ctx.lineTo(x + 40 * s, y - 10 * s); ctx.lineTo(x + 30 * s, y - 9 * s);
  ctx.closePath();
  ctx.fill();
  dab(ctx, x + 40 * s, y - 6.5 * s, 1.6 * s, 3.6 * s, 0, mix(P.ink, P.khondalite, 0.3), 1);
}

/** A small clay diya; glowR > 0 adds a halo. (x, y) = base. */
function diya(ctx: Ctx, x: number, y: number, s: number, glowR = 0): void {
  if (glowR) glow(ctx, x, y - 4 * s, glowR, P.marigold, 0.5);
  dab(ctx, x, y - 1.5 * s, 4 * s, 1.8 * s, 0, P.laterite, 1);
  dab(ctx, x + 0.5 * s, y - 5 * s, 1.3 * s, 2.8 * s, 0.15, P.marigold, 1);
  dab(ctx, x + 0.5 * s, y - 4.4 * s, 0.6 * s, 1.4 * s, 0.15, P.haldi, 1);
}

/** Point on a sagging string between two points. */
function sagPt(x0: number, y0: number, x1: number, y1: number, sag: number, t: number): Pt {
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t + sag * 4 * t * (1 - t) };
}

/** A marigold garland strung between two points. */
function garland(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, s = 1, cols: string[] = [P.marigold, P.haldi]): void {
  const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / (3 * s)));
  for (let i = 0; i <= n; i++) {
    const p = sagPt(x0, y0, x1, y1, sag, i / n);
    dab(ctx, p.x, p.y, 2.3 * s, 2.3 * s, 0, cols[i % cols.length], 1);
    if (i % 9 === 4) for (let k = 1; k <= 3; k++) dab(ctx, p.x, p.y + k * 3.6 * s, 1.9 * s, 1.9 * s, 0, cols[(i + k) % cols.length], 1);
  }
}

/** Bunting: little triangles on a string. */
function bunting(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, size: number, cols: string[], haze = 0): void {
  ctx.strokeStyle = withAlpha(hz(P.khondalite, haze), 0.7);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) { const p = sagPt(x0, y0, x1, y1, sag, i / 20); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
  ctx.stroke();
  const n = Math.max(2, Math.floor(Math.hypot(x1 - x0, y1 - y0) / (size * 1.6)));
  for (let i = 0; i < n; i++) {
    const p = sagPt(x0, y0, x1, y1, sag, (i + 0.5) / n);
    ctx.fillStyle = hz(cols[i % cols.length], haze);
    ctx.beginPath(); ctx.moveTo(p.x - size / 2, p.y); ctx.lineTo(p.x + size / 2, p.y); ctx.lineTo(p.x, p.y + size * 1.1); ctx.closePath(); ctx.fill();
  }
}

/** A roadster bicycle standing on (x, y). */
function bicycle(ctx: Ctx, x: number, y: number, s: number, col: string, haze = 0): void {
  const r = 7 * s;
  const tyre = hz(mix(P.ink, P.khondalite, 0.2), haze);
  const fr = hz(col, haze);
  ctx.lineWidth = 1.4 * s;
  for (const wx of [x - 10 * s, x + 10 * s]) {
    ctx.strokeStyle = tyre;
    ctx.beginPath(); ctx.arc(wx, y - r, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = withAlpha(hz(P.khondalite, haze), 0.5);
    ctx.lineWidth = 0.4 * s;
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI; ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * r, y - r - Math.sin(a) * r); ctx.lineTo(wx + Math.cos(a) * r, y - r + Math.sin(a) * r); ctx.stroke(); }
    ctx.lineWidth = 1.4 * s;
  }
  const rear = { x: x - 10 * s, y: y - r }, front = { x: x + 10 * s, y: y - r };
  const seat = { x: x - 3 * s, y: y - r - 9 * s }, bb = { x: x - 1 * s, y: y - r }, head = { x: x + 6.5 * s, y: y - r - 9 * s };
  ctx.strokeStyle = fr;
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(rear.x, rear.y); ctx.lineTo(seat.x, seat.y); ctx.lineTo(bb.x, bb.y); ctx.lineTo(rear.x, rear.y);
  ctx.moveTo(seat.x, seat.y); ctx.lineTo(head.x, head.y); ctx.lineTo(front.x, front.y);
  ctx.moveTo(bb.x, bb.y); ctx.lineTo(head.x, head.y);
  ctx.stroke();
  dab(ctx, seat.x - 0.5 * s, seat.y - 1 * s, 2.6 * s, 1 * s, 0, hz(mix(P.laterite, P.ink, 0.4), haze), 1);
  taperStroke(ctx, [{ x: head.x, y: head.y }, { x: head.x + 1 * s, y: head.y - 2.5 * s }, { x: head.x - 2.5 * s, y: head.y - 3 * s }], 1.2 * s, tyre, 1, [1, 1]);
}

/** A bentwood chair seen from the side, facing right. */
function chair(ctx: Ctx, x: number, y: number, s: number, col: string): void {
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.3 * s;
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, y); ctx.lineTo(x - 4 * s, y - 16 * s);
  ctx.moveTo(x + 4 * s, y); ctx.lineTo(x + 4 * s, y - 8 * s);
  ctx.moveTo(x - 5 * s, y - 8 * s); ctx.lineTo(x + 5 * s, y - 8 * s);
  ctx.stroke();
}

/** A paper kite with an Odia letter painted on it; the string runs to (sx, sy). */
function kite(ctx: Ctx, x: number, y: number, s: number, col: string, col2: string, letter: string, ang: number, sx: number, sy: number): void {
  ctx.strokeStyle = withAlpha(mix(P.ink, P.khondalite, 0.4), 0.55);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y + 10 * s);
  ctx.quadraticCurveTo((x + sx) / 2 + 20, (y + sy) / 2 + 30, sx, sy);
  ctx.stroke();
  // tail with little bows
  const tail = curvePts(x, y + 20 * s, x - 10 * s, y + 38 * s, x + 4 * s, y + 58 * s, 8);
  taperStroke(ctx, tail, 1.2, col2, 0.9, [1, 0.6]);
  for (let i = 2; i < tail.length; i += 2) {
    dab(ctx, tail[i].x - 2 * s, tail[i].y, 2.2 * s, 1.1 * s, 0.4, col2, 1);
    dab(ctx, tail[i].x + 2 * s, tail[i].y, 2.2 * s, 1.1 * s, -0.4, col2, 1);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(0, -18 * s); ctx.lineTo(14 * s, 0); ctx.lineTo(0, 22 * s); ctx.lineTo(-14 * s, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = withAlpha(col2, 0.85);
  ctx.beginPath(); ctx.moveTo(0, 22 * s); ctx.lineTo(14 * s, 0); ctx.lineTo(7 * s, 11 * s); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 22 * s); ctx.lineTo(-14 * s, 0); ctx.lineTo(-7 * s, 11 * s); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = withAlpha(mix(col, P.ink, 0.45), 0.6);
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, -18 * s); ctx.lineTo(0, 22 * s); ctx.moveTo(-14 * s, 0); ctx.lineTo(14 * s, 0); ctx.stroke();
  ctx.font = ODIA_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.scale(s * 0.5, s * 0.5);
  ctx.fillStyle = mix(P.ink, P.neel, 0.3);
  ctx.fillText(letter, 0, 2);
  ctx.restore();
  ctx.restore();
}

/** A small hand-press: wooden frame, screw, lever, bed. (x, y) = floor centre. */
function handPress(ctx: Ctx, rng: Rng, x: number, y: number, s: number): void {
  const wood = mix(P.laterite, P.ink, 0.3);
  const woodL = mix(P.laterite, P.chandan, 0.3);
  const rect = (rx: number, ry: number, rw: number, rh: number, base = wood) => paintedShape(ctx, rng, () => polyPath(ctx, [{ x: rx, y: ry + rh }, { x: rx, y: ry }, { x: rx + rw, y: ry }, { x: rx + rw, y: ry + rh }]), { x: rx, y: ry, w: rw, h: rh }, { base, light: woodL, shade: mix(base, P.ink, 0.4), lightFrom: 'right', dabs: 8 });
  // bed on legs (runs through the frame)
  for (const lx of [-26, 22]) taperStroke(ctx, [{ x: x + lx * s, y }, { x: x + lx * s, y: y - 30 * s }], 2.4 * s, wood, 1, [1, 1]);
  for (const k of [-1, 1]) rect(x + k * 15 * s - 3 * s, y - 74 * s, 6 * s, 74 * s);
  rect(x - 22 * s, y - 80 * s, 44 * s, 9 * s);
  rect(x - 30 * s, y - 34 * s, 60 * s, 5 * s, mix(wood, P.khondalite, 0.3));
  // sheet and inked forme on the bed
  ctx.fillStyle = P.limewhite;
  ctx.fillRect(x + 6 * s, y - 37 * s, 18 * s, 3 * s);
  ctx.fillStyle = mix(P.ink, P.neel, 0.2);
  ctx.fillRect(x - 12 * s, y - 37 * s, 16 * s, 3 * s);
  // screw, platen, lever
  const metal = mix(P.khondalite, P.ink, 0.25);
  taperStroke(ctx, [{ x, y: y - 72 * s }, { x, y: y - 52 * s }], 4 * s, metal, 1, [1, 1]);
  for (let k = 0; k < 5; k++) taperStroke(ctx, [{ x: x - 2 * s, y: y - 70 * s + k * 4 * s }, { x: x + 2 * s, y: y - 68 * s + k * 4 * s }], 0.8 * s, mix(metal, P.limewhite, 0.4), 1, [1, 1]);
  rect(x - 13 * s, y - 52 * s, 26 * s, 6 * s, mix(wood, P.ink, 0.2));
  taperStroke(ctx, [{ x, y: y - 62 * s }, { x: x + 30 * s, y: y - 68 * s }], 2.2 * s, metal, 1, [1, 0.7]);
  dab(ctx, x + 31 * s, y - 68.5 * s, 2.6 * s, 2.6 * s, 0, woodL, 1);
}

/** Salt pans with drying white heaps; (x, y) = front edge centre. */
function saltPans(ctx: Ctx, rng: Rng, x: number, y: number, w: number, s: number): void {
  const bund = mix(P.chandan, P.khondalite, 0.35);
  ctx.fillStyle = bund;
  ctx.fillRect(x - w / 2, y - 14 * s, w, 14 * s);
  const n = Math.max(2, Math.round(w / (60 * s)));
  for (let i = 0; i < n; i++) {
    const px = x - w / 2 + (i + 0.5) * (w / n);
    const pw = w / n - 8 * s;
    vGradient(ctx, px - pw / 2, y - 12 * s, pw, 9 * s, [[0, mix(P.seafoam, P.limewhite, 0.4), 1], [1, mix(P.seafoam, P.khondalite, 0.25), 1]]);
    for (let k = 0; k < 6; k++) taperStroke(ctx, [{ x: px - pw / 2 + rng.next() * pw * 0.6, y: y - 11 * s + k * 1.5 * s }, { x: px - pw / 2 + pw * (0.4 + rng.next() * 0.6), y: y - 11 * s + k * 1.5 * s }], 0.6 * s, P.limewhite, 0.5);
  }
  // heaps along the back bund
  for (let i = 0; i < n + 1; i++) {
    const hx = x - w / 2 + i * (w / n) + rng.range(-6, 6) * s;
    const hh = rng.range(9, 14) * s;
    ctx.fillStyle = P.limewhite;
    ctx.beginPath(); ctx.moveTo(hx - hh * 1.1, y - 13 * s); ctx.quadraticCurveTo(hx, y - 13 * s - hh * 1.6, hx + hh * 1.1, y - 13 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = withAlpha(mix(P.limewhite, P.khondalite, 0.4), 0.7);
    ctx.beginPath(); ctx.moveTo(hx, y - 13 * s - hh * 0.8); ctx.quadraticCurveTo(hx + hh * 0.6, y - 13 * s - hh * 0.4, hx + hh * 1.1, y - 13 * s); ctx.lineTo(hx, y - 13 * s); ctx.closePath(); ctx.fill();
  }
}

/** A plain country boat (no figures); (x, y) = waterline centre. */
function countryBoat(ctx: Ctx, rng: Rng, x: number, y: number, s: number): void {
  const wood = mix(P.laterite, P.khondalite, 0.45);
  const hull = () => {
    ctx.beginPath();
    ctx.moveTo(x - 46 * s, y - 13 * s);
    ctx.quadraticCurveTo(x, y - 5 * s, x + 46 * s, y - 15 * s);
    ctx.quadraticCurveTo(x + 36 * s, y + 3 * s, x + 18 * s, y + 3 * s);
    ctx.lineTo(x - 20 * s, y + 3 * s);
    ctx.quadraticCurveTo(x - 38 * s, y + 2 * s, x - 46 * s, y - 13 * s);
    ctx.closePath();
  };
  paintedShape(ctx, rng, hull, { x: x - 46 * s, y: y - 15 * s, w: 92 * s, h: 18 * s }, { base: wood, light: mix(wood, P.chandan, 0.4), shade: mix(wood, P.ink, 0.5), lightFrom: 'top' });
  taperStroke(ctx, curvePts(x - 45 * s, y - 12.5 * s, x, y - 5.5 * s, x + 45 * s, y - 14.5 * s, 12), 1.6 * s, mix(wood, P.limewhite, 0.3), 0.8, [1, 1]);
  // a low matting hood at the stern
  ctx.fillStyle = mix(P.haldi, P.khondalite, 0.55);
  ctx.beginPath();
  ctx.moveTo(x - 30 * s, y - 9 * s);
  ctx.quadraticCurveTo(x - 20 * s, y - 26 * s, x - 6 * s, y - 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha(mix(P.haldi, P.ink, 0.5), 0.5);
  ctx.lineWidth = 0.8 * s;
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 27 * s + k * 6 * s, y - 9 * s); ctx.lineTo(x - 24 * s + k * 5 * s, y - 19 * s + Math.abs(k - 1.5) * 2 * s); ctx.stroke(); }
}

/** An extra arm for scratching one's head (person() is ~34·s tall; facing f). */
function scratchHead(ctx: Ctx, x: number, y: number, s: number, f: 1 | -1, skin = 0.45): void {
  taperStroke(ctx, [{ x: x - 1 * s * f, y: y - 23 * s }, { x: x - 5 * s * f, y: y - 27 * s }, { x: x - 2 * s * f, y: y - 33 * s }], 2.4 * s, skinTone(skin), 1, [1, 0.75]);
}

/** A sheet of printed paper with ruled grey lines (no legible text). */
function sheet(ctx: Ctx, x: number, y: number, w: number, h: number, rot = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = P.limewhite;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = withAlpha(mix(P.ink, P.khondalite, 0.4), 0.45);
  for (let yy = -h / 2 + h * 0.14; yy < h / 2 - h * 0.08; yy += Math.max(1.6, h * 0.11)) ctx.fillRect(-w / 2 + w * 0.12, yy, w * 0.76, Math.max(0.5, h * 0.04));
  ctx.fillStyle = withAlpha(mix(P.ink, P.khondalite, 0.3), 0.7);
  ctx.fillRect(-w / 2 + w * 0.12, -h / 2 + h * 0.06, w * 0.76, Math.max(0.8, h * 0.06));
  ctx.restore();
}

/** Ground shadow / patch under a vignette so it sits on the land. */
function groundPatch(ctx: Ctx, rng: Rng, x0: number, x1: number, y: number, col: string): void {
  softShadow(ctx, (x0 + x1) / 2, y - 1, (x1 - x0) / 2, 7, mix(col, P.ink, 0.3), 0.35);
  dabField(ctx, rng, x0, y - 5, x1 - x0, 6, { n: Math.round((x1 - x0) / 3), r: [2, 5], colours: [col, mix(col, P.haldi, 0.2), mix(col, P.ink, 0.2)], alpha: [0.3, 0.6], aspect: [0.3, 0.5], rot: 0, rotJitter: 0.2 });
}

/** A rider sitting on a horse with one arm raised. (x, y) = horse's hooves. */
function rider(ctx: Ctx, x: number, y: number, s: number, f: 1 | -1, coat: string, cloth: string, pose: Pose = 'wave', head: Headwear = 'turban'): void {
  horse(ctx, x, y, s, mix(P.limewhite, P.chandan, 0.25), f, 0, 0.6);
  const hs = s * 0.85;
  person(ctx, x - 2 * s * f, y - 18 * s, hs, { pose, cloth, cloth2: coat, head, facing: f, skin: 0.55 });
  // saddle cloth over the legs, and a dangling leg
  dab(ctx, x - 1 * s * f, y - 24 * s, 9 * s, 4.6 * s, 0, P.sindoor, 1);
  for (let i = 0; i < 5; i++) dab(ctx, x - 8 * s * f + i * 3.6 * s * f, y - 20 * s, 1.3 * s, 1.5 * s, 0, P.haldi, 1);
  taperStroke(ctx, [{ x: x + 1 * s * f, y: y - 26 * s }, { x: x + 3 * s * f, y: y - 18 * s }, { x: x + 1.5 * s * f, y: y - 12 * s }], 2.6 * hs, skinTone(0.55), 1, [1, 0.8]);
}

/** Simple mid-strip village/town row. */
function townRow(ctx: Ctx, rng: Rng, W: number, y: number, haze: number, roofs: ('tile' | 'thatch' | 'flat')[], step: [number, number] = [50, 90]): void {
  scatter(rng, W, step, (x) => wrapped(W, x, 40, (xx) => house(ctx, rng.fork(x), xx, y + rng.range(-3, 3), rng.range(34, 56), rng.range(36, 56), { roof: rng.pick(roofs), haze })));
}

/** Paint a vignette k× larger than authored (canvas grows to match), so small story details read at a glance. */
function big(k: number, lm: Landmark): Landmark {
  return {
    ...lm,
    w: Math.round(lm.w * k),
    h: Math.round(lm.h * k),
    paint: (ctx, rng, w, h) => {
      ctx.save();
      ctx.scale(k, k);
      lm.paint(ctx, rng, w / k, h / k);
      ctx.restore();
    },
  };
}

/** Night: darken everything already painted on this canvas toward indigo (lamps go on afterwards). */
function nightWash(ctx: Ctx, w: number, h: number, alpha = 0.62): void {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = withAlpha(mix(P.neel, P.ink, 0.35), alpha);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ---- scenes -------------------------------------------------------------------------
export const SCENES: Record<string, () => SceneDef> = {
  // 20 · 1803 · Khurda — the Company arrives below Barunei hill.
  r20: () => ({
    id: 'r20',
    sky: { stops: [[0, mix(P.seafoam, P.neel, 0.25)], [0.55, mix(P.skyCream, P.seafoam, 0.3)], [1, P.skyCream]], sun: { x: 1010, y: 120, r: 34 }, clouds: 'cumulus' },
    far: [
      { kind: 'hills', a: mix(mix(P.tota, P.neel, 0.45), P.skyCream, 0.4), b: P.neel, height: [40, 110], trees: true, haze: 0.5 },
      { kind: 'hills', a: mix(P.tota, P.khondalite, 0.35), b: P.neel, height: [16, 50], trees: true, haze: 0.3 },
    ],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.3), plainDetail: 'fields', path: mix(P.laterite, P.chandan, 0.35), verge: mix(P.tota, P.laterite, 0.25) },
    mid: (ctx, rng, W) => {
      treeRow(ctx, rng.fork('trees'), W, 196, 0.3, 0.35);
      townRow(ctx, rng.fork('village'), W, 214, 0.2, ['thatch', 'thatch', 'tile'], [70, 160]);
      scatter(rng.fork('mango'), W, [180, 320], (x) => wrapped(W, x, 70, (xx) => broadTree(ctx, rng.fork(x), xx, 244, rng.range(90, 130), rng.range(90, 120), 0.1)));
      bank(ctx, rng.fork('bank'), W, 240, mix(P.tota, P.haldi, 0.3), mix(P.tota, P.laterite, 0.35));
    },
    near: (ctx, rng, W) => {
      // Travellers on the Jagannath road: headloads, a cart, a man with an umbrella.
      scatter(rng.fork('bush'), W, [120, 220], (x) => wrapped(W, x, 40, (xx) => broadTree(ctx, rng.fork(x), xx, 134, rng.range(36, 54), rng.range(30, 44))));
      scatter(rng.fork('walkers'), W, [300, 520], (x, i) => wrapped(W, x, 40, (xx) => {
        const r2 = rng.fork(x);
        if (i % 3 === 0) { bullockCartBg(ctx, r2, xx, 132, 1.25); person(ctx, xx + 66, 132, 1.2, { pose: 'walk', cloth: P.limewhite, head: 'turban', phase: 1 }); }
        else if (i % 3 === 1) { person(ctx, xx, 132, 1.25, { pose: 'carry', cloth: P.sindoor, sari: true, head: 'veil', facing: 1, phase: 2 }); person(ctx, xx + 22, 132, 0.85, { pose: 'walk', cloth: P.haldi, facing: 1, phase: 0.4 }); }
        else { umbrella(ctx, xx + 6, 106, 11, mix(P.ink, P.neel, 0.3)); person(ctx, xx, 132, 1.25, { pose: 'walk', cloth: P.limewhite, cloth2: P.chandan, head: 'none', facing: -1, phase: 3 }); }
      }), 60);
    },
    fore: 'grass',
    tone: tone(0.68),
    sign: { date: '1803', title: 'Khurda' },
    landmarks: [
      {
        // Barunei hill, its shrine at the foot, and the walls of Khurda fort.
        at: 0.32, plane: 'far', w: 1000, h: 300,
        paint: (ctx, rng, _w, h) => {
          const hz2 = 0.32;
          const hill = hz(mix(P.tota, P.khondalite, 0.5), hz2);
          const pts: Pt[] = [{ x: 30, y: h }, { x: 160, y: h - 70 }, { x: 290, y: h - 160 }, { x: 410, y: h - 250 }, { x: 470, y: h - 262 }, { x: 540, y: h - 236 }, { x: 640, y: h - 170 }, { x: 760, y: h - 120 }, { x: 880, y: h - 50 }, { x: 980, y: h }];
          const path = () => { smoothPath(ctx, pts, false); ctx.closePath(); };
          paintedShape(ctx, rng, path, { x: 30, y: h - 262, w: 950, h: 262 }, { base: hill, light: hz(mix(hill, P.haldi, 0.35), hz2), shade: hz(mix(hill, P.neel, 0.45), hz2), lightFrom: 'right', dabs: 500 });
          clipTo(ctx, path, () => {
            for (let i = 0; i < 26; i++) dab(ctx, rng.range(250, 700), rng.range(h - 240, h - 60), rng.range(10, 26), rng.range(5, 12), rng.range(-0.4, 0.4), hz(mix(P.khondalite, P.limewhite, 0.25), hz2), 0.7);
            for (let i = 0; i < 700; i++) { const x = rng.range(30, 980); dab(ctx, x, rng.range(h - 230, h), rng.range(3, 7), rng.range(2.4, 5), 0, hz(rng.chance(0.4) ? mix(P.tota, P.haldi, 0.3) : mix(P.tota, P.neel, 0.35), hz2), 0.55); }
          });
          rekhaDeula(ctx, rng, 190, h - 30, 70, { stone: P.limewhite, haze: 0.2, flagColour: P.sindoor });
          // fort walls with round bastions along the foot of the hill
          const wall = hz(mix(P.laterite, P.khondalite, 0.3), 0.25);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 330, y: h }, { x: 330, y: h - 40 }, { x: 820, y: h - 40 }, { x: 820, y: h }]), { x: 330, y: h - 40, w: 490, h: 40 }, { base: wall, light: hz(mix(wall, P.haldi, 0.3), 0.2), shade: hz(mix(wall, P.ink, 0.4), 0.2), lightFrom: 'top' });
          ctx.fillStyle = wall;
          for (let x = 334; x < 818; x += 12) ctx.fillRect(x, h - 46, 7, 7);
          for (const bx of [330, 480, 660, 820]) {
            paintedShape(ctx, rng, () => polyPath(ctx, [{ x: bx - 16, y: h }, { x: bx - 14, y: h - 58 }, { x: bx + 14, y: h - 58 }, { x: bx + 16, y: h }]), { x: bx - 16, y: h - 58, w: 32, h: 58 }, { base: wall, light: hz(mix(wall, P.haldi, 0.35), 0.2), shade: hz(mix(wall, P.ink, 0.4), 0.2), lightFrom: 'right' });
            for (let k = -1; k <= 1; k++) ctx.fillRect(bx + k * 9 - 3, h - 64, 6, 7);
          }
          ctx.fillStyle = hz(mix(P.ink, P.laterite, 0.25), 0.2);
          ctx.beginPath(); ctx.moveTo(560, h); ctx.lineTo(560, h - 24); ctx.quadraticCurveTo(572, h - 36, 584, h - 24); ctx.lineTo(584, h); ctx.closePath(); ctx.fill();
        },
      },
      big(1.15, {
        // The toll gate: a clerk under a black umbrella, ledger open; the queue waits.
        at: 0.14, plane: 'mid', w: 560, h: 150,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.laterite, P.chandan, 0.3));
          thatchShed(ctx, rng, 420, g, 110, 96);
          // barrier: posts and a striped pole across the road
          taperStroke(ctx, [{ x: 330, y: g }, { x: 330, y: g - 40 }], 5, WOOD, 1, [1, 1]);
          taperStroke(ctx, [{ x: 220, y: g }, { x: 220, y: g - 30 }], 4, WOOD, 1, [1, 1]);
          for (let i = 0; i < 8; i++) {
            ctx.fillStyle = i % 2 ? P.sindoor : P.limewhite;
            ctx.fillRect(216 + i * 15, g - 36, 15, 5);
          }
          dab(ctx, 330, g - 42, 4, 4, 0, P.ink, 1);
          // the clerk at a little table
          ctx.fillStyle = WOOD;
          ctx.fillRect(372, g - 22, 40, 4);
          taperStroke(ctx, [{ x: 376, y: g - 18 }, { x: 376, y: g }], 2, WOOD, 1, [1, 1]);
          taperStroke(ctx, [{ x: 408, y: g - 18 }, { x: 408, y: g }], 2, WOOD, 1, [1, 1]);
          sheet(ctx, 384, g - 25, 16, 6, 0.04);
          dab(ctx, 401, g - 25, 6, 3, 0, mix(P.laterite, P.ink, 0.45), 1);
          person(ctx, 430, g - 6, 1.75, { pose: 'read', cloth: mix(P.neel, P.limewhite, 0.35), cloth2: mix(P.neel, P.ink, 0.25), head: 'topi', facing: -1, trousers: true, skin: 0.35 });
          ctx.fillStyle = WOOD;
          ctx.fillRect(420, g - 8, 22, 3);
          umbrella(ctx, 448, g - 8, 30, mix(P.ink, P.neel, 0.35));
          // the queue: cart, a woman with a headload, a man with his goat
          bullockCartBg(ctx, rng, 60, g, 1.6, 0, 0.3);
          person(ctx, 150, g, 1.7, { pose: 'carry', cloth: P.sindoor, cloth2: P.haldi, sari: true, head: 'veil', facing: 1 });
          person(ctx, 186, g, 1.7, { pose: 'pull', cloth: P.limewhite, cloth2: P.chandan, head: 'turban', facing: 1, phase: 0.3 });
          goat(ctx, 172, g, 1.4, 1);
          person(ctx, 300, g, 1.7, { pose: 'wave', cloth: P.limewhite, head: 'turban', facing: -1, skin: 0.7 });
        },
      }),
      {
        // Far off on the road, a red-coated column marches — just people, a long way from home.
        at: 0.5, plane: 'mid', w: 460, h: 80,
        paint: (ctx, rng, w, h) => {
          const g = h - 6;
          vGradient(ctx, 0, g - 4, w, 10, [[0, mix(P.laterite, P.chandan, 0.4), 0], [0.5, mix(P.laterite, P.chandan, 0.4), 0.55], [1, mix(P.laterite, P.chandan, 0.4), 0]]);
          dabField(ctx, rng, 10, g - 26, 90, 24, { n: 40, r: [4, 10], colours: [mix(P.chandan, P.skyCream, 0.4)], alpha: [0.08, 0.2] });
          const coat = mix(P.sindoor, P.laterite, 0.25);
          for (let row = 0; row < 2; row++) for (let i = 0; i < 11; i++) {
            const x = 90 + i * 28 + row * 12;
            const pose: Pose = i === 10 && row === 0 ? 'drum' : 'walk';
            person(ctx, x, g - row * 3, 1.05 - row * 0.05, { pose, cloth: coat, cloth2: P.limewhite, head: 'shako', trousers: true, facing: 1, haze: 0.22 + row * 0.08, phase: i * 0.9 + row, skin: 0.3 + (i % 3) * 0.2 });
          }
          flag(ctx, 82, g, 46, mix(P.limewhite, P.neel, 0.2), 0.2, 2);
        },
      },
      big(1.1, {
        // A peacock on the old fort wall, unbothered by the change of rulers.
        at: 0.64, plane: 'mid', w: 440, h: 170,
        paint: (ctx, rng, _w, h) => {
          const g = h - 4;
          broadTree(ctx, rng, 80, g, 120, 130, 0.08);
          const wall = mix(P.laterite, P.khondalite, 0.25);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 30, y: g }, { x: 30, y: g - 72 }, { x: 410, y: g - 72 }, { x: 410, y: g }]), { x: 30, y: g - 72, w: 380, h: 72 }, { base: wall, light: mix(wall, P.haldi, 0.35), shade: mix(wall, P.ink, 0.4), lightFrom: 'top', dabs: 220 });
          ctx.strokeStyle = withAlpha(mix(wall, P.ink, 0.5), 0.35);
          ctx.lineWidth = 0.8;
          for (let yy = g - 66; yy < g; yy += 8) { ctx.beginPath(); ctx.moveTo(30, yy); ctx.lineTo(410, yy); ctx.stroke(); }
          ctx.fillStyle = wall;
          for (let x = 34; x < 404; x += 22) ctx.fillRect(x, g - 82, 12, 11);
          for (let i = 0; i < 6; i++) reedTuft(ctx, rng.fork(i), 50 + i * 66, g - 70, 14, 12, { dark: mix(P.tota, P.neel, 0.4), mid: P.tota, tip: mix(P.tota, P.haldi, 0.4) }, 5);
          groundPatch(ctx, rng, 30, 410, g + 2, mix(P.tota, P.haldi, 0.3));
          peacock(ctx, 240, g - 72, 1.9, -1);
        },
      }),
      big(1.4, {
        // The cowrie or the coin? A clerk weighs a heap of cowries against three silver coins — the beam stays level.
        at: 0.86, plane: 'mid', w: 480, h: 170,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 40, w - 40, g + 2, mix(P.laterite, P.chandan, 0.3));
          // awning on four posts
          for (const px of [150, 350]) taperStroke(ctx, [{ x: px, y: g }, { x: px, y: g - 112 }], 3.2, WOOD, 1, [1, 1]);
          for (let i = 0; i < 8; i++) {
            ctx.fillStyle = i % 2 ? mix(P.neel, P.limewhite, 0.25) : P.limewhite;
            ctx.beginPath();
            ctx.moveTo(140 + i * 27.5, g - 118); ctx.lineTo(167.5 + i * 27.5, g - 118); ctx.lineTo(167.5 + i * 27.5, g - 104);
            ctx.quadraticCurveTo(154 + i * 27.5, g - 98, 140 + i * 27.5, g - 104); ctx.closePath(); ctx.fill();
          }
          // table
          ctx.fillStyle = WOOD_L;
          ctx.fillRect(190, g - 34, 130, 5);
          for (const lx of [196, 314]) taperStroke(ctx, [{ x: lx, y: g - 30 }, { x: lx, y: g }], 2.4, WOOD, 1, [1, 1]);
          balance(ctx, rng, 255, g - 34, 1.25);
          // a ledger with silver coins stacked
          sheet(ctx, 300, g - 37, 18, 5, 0);
          // the puzzled clerk, scratching his head
          person(ctx, 360, g, 1.9, { pose: 'point', cloth: mix(P.neel, P.limewhite, 0.3), cloth2: mix(P.neel, P.ink, 0.25), head: 'topi', facing: -1, trousers: true, skin: 0.35 });
          scratchHead(ctx, 360, g, 1.9, -1, 0.35);
          // a woman who has brought her savings in cowries; her boy peeks at the scale
          person(ctx, 120, g, 1.85, { pose: 'stand', cloth: P.haldi, cloth2: P.sindoor, sari: true, head: 'veil', facing: 1, skin: 0.6 });
          basket(ctx, rng, 92, g, 16, true);
          person(ctx, 168, g, 1.05, { pose: 'point', cloth: P.limewhite, facing: 1, skin: 0.5 });
          crow(ctx, 340, g - 116, 1.4, -1);
        },
      }),
    ],
  }),

  // 21 · Mar 1817 · Paika Bidroha — the Paikas line up at the forest edge before dawn turns to day.
  r21: () => ({
    id: 'r21',
    sky: { stops: [[0, mix(P.neel, P.skyCream, 0.45)], [0.5, mix(P.marigold, P.skyCream, 0.6)], [1, mix(P.haldi, P.skyCream, 0.55)]], sun: { x: 250, y: 300, r: 42, colour: mix(P.marigold, P.haldi, 0.5), rays: true }, clouds: 'streak', cloudTint: mix(P.marigold, P.limewhite, 0.55) },
    far: [
      { kind: 'hills', a: mix(mix(P.neel, P.tota, 0.35), P.skyCream, 0.45), b: P.neel, height: [50, 130], trees: true, haze: 0.45 },
      { kind: 'hills', a: mix(P.tota, P.neel, 0.45), b: P.neel, height: [24, 70], trees: true, haze: 0.25 },
    ],
    ground: { kind: 'land', plain: mix(P.tota, P.khondalite, 0.25), plainDetail: 'grass', path: mix(P.laterite, P.khondalite, 0.3), verge: mix(P.tota, P.neel, 0.25) },
    mid: (ctx, rng, W) => {
      // Khurda forest: sal and mango in deep ranks, bamboo at the edge.
      scatter(rng.fork('back'), W, [36, 60], (x) => wrapped(W, x, 70, (xx) => broadTree(ctx, rng.fork(x), xx, 186, rng.range(90, 130), rng.range(100, 140), 0.32)));
      scatter(rng.fork('palm'), W, [200, 380], (x) => wrapped(W, x, 40, (xx) => palmyraPalm(ctx, rng.fork(x), xx, 200, rng.range(140, 180), 0.25)));
      scatter(rng.fork('front'), W, [60, 110], (x) => wrapped(W, x, 80, (xx) => broadTree(ctx, rng.fork(x), xx, 236, rng.range(100, 150), rng.range(110, 150), 0.1)));
      scatter(rng.fork('bamboo'), W, [140, 260], (x) => wrapped(W, x, 40, (xx) => bamboo(ctx, rng.fork(x), xx, 248, rng.range(90, 130), 0.05)));
      bank(ctx, rng.fork('bank'), W, 242, mix(P.tota, P.haldi, 0.2), mix(P.tota, P.khondalite, 0.35));
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('ferns'), W, [40, 90], (x) => wrapped(W, x, 30, (xx) => reedTuft(ctx, rng.fork(x), xx, 136, rng.range(26, 40), rng.range(24, 40), { dark: mix(P.tota, P.neel, 0.45), mid: mix(P.tota, P.peacock, 0.25), tip: mix(P.tota, P.haldi, 0.4) }, 10)));
      scatter(rng.fork('bush'), W, [160, 300], (x) => wrapped(W, x, 40, (xx) => broadTree(ctx, rng.fork(x), xx, 134, rng.range(44, 64), rng.range(34, 48))));
      scatter(rng.fork('bamboo'), W, [300, 520], (x) => wrapped(W, x, 30, (xx) => bamboo(ctx, rng.fork(x), xx, 136, rng.range(80, 110))), 150);
    },
    fore: 'grass',
    tone: tone(0.62),
    sign: { date: 'Mar 1817', title: 'Paika Bidroha' },
    landmarks: [
      big(1.4, {
        // Farewell at the hut: a tilak for the Paika before he joins the others.
        at: 0.13, plane: 'mid', w: 340, h: 150,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.laterite, P.chandan, 0.25));
          house(ctx, rng, 80, g, 90, 90, { roof: 'thatch' });
          // tulsi planter
          ctx.fillStyle = P.limewhite;
          ctx.fillRect(140, g - 26, 16, 26);
          ctx.fillStyle = P.sindoor;
          ctx.fillRect(140, g - 26, 16, 3);
          reedTuft(ctx, rng, 148, g - 26, 14, 18, { dark: mix(P.tota, P.neel, 0.4), mid: P.tota, tip: mix(P.tota, P.haldi, 0.4) }, 8);
          person(ctx, 196, g, 1.9, { pose: 'point', cloth: P.sindoor, cloth2: P.haldi, sari: true, head: 'veil', facing: 1, skin: 0.55 });
          person(ctx, 230, g, 2, { pose: 'shield', cloth: P.limewhite, cloth2: P.haldi, head: 'turban', facing: -1, skin: 0.65 });
          dab(ctx, 230 - 0.4 * 2, g - 14 * 2 - 11 * 2 - 4.6 * 2 - 1.4 * 2, 0.7, 1.6, 0, P.sindoor, 1);
          person(ctx, 268, g, 1.1, { pose: 'wave', cloth: P.haldi, facing: -1, skin: 0.4 });
          // a hen pecking about
          dab(ctx, 300, g - 5, 6, 4.4, 0, P.limewhite, 1);
          dab(ctx, 305, g - 9, 2.4, 2.2, 0, P.limewhite, 1);
          dab(ctx, 305, g - 12, 1.2, 1.4, 0, P.sindoor, 1);
          taperStroke(ctx, [{ x: 307, y: g - 9 }, { x: 310, y: g - 8 }], 1, P.haldi, 1, [1, 0.3]);
        },
      }),
      {
        // The Paikas line up at the forest edge in the first light; their commander rides along the line.
        at: 0.42, plane: 'mid', w: 1120, h: 190,
        paint: (ctx, rng, w, h) => {
          const g = h - 6;
          groundPatch(ctx, rng, 30, w - 30, g + 3, mix(P.laterite, P.chandan, 0.25));
          // banners on bamboo poles
          for (const [fx, col] of [[250, P.sindoor], [560, P.haldi], [860, P.sindoor]] as [number, string][]) flag(ctx, fx, g - 8, 120, col, 0, 3);
          // a few torches still burning from the night
          for (const tx of [330, 700, 990]) {
            glow(ctx, tx, g - 98, 34, P.marigold, 0.5);
            taperStroke(ctx, [{ x: tx, y: g - 6 }, { x: tx, y: g - 92 }], 3, WOOD, 1, [1, 1]);
            dab(ctx, tx, g - 98, 5, 9, 0, P.marigold, 1);
            dab(ctx, tx, g - 96, 2.4, 4.6, 0, P.haldi, 1);
          }
          // back rank
          for (let i = 0; i < 24; i++) {
            const x = 214 + i * 36 + 18;
            person(ctx, x, g - 10, 1.55, { pose: 'shield', cloth: rng.pick([P.limewhite, P.haldi, mix(P.sindoor, P.laterite, 0.3)]), cloth2: rng.pick([P.haldi, P.sindoor, P.limewhite]), head: 'turban', facing: -1, skin: rng.next(), haze: 0.12 });
          }
          // front rank
          for (let i = 0; i < 24; i++) {
            const x = 214 + i * 36;
            const pose: Pose = i === 23 ? 'conch' : 'shield';
            person(ctx, x, g, 1.75, { pose, cloth: rng.pick([P.limewhite, P.haldi, mix(P.sindoor, P.laterite, 0.3)]), cloth2: rng.pick([P.haldi, P.sindoor, P.limewhite]), head: 'turban', facing: -1, skin: rng.next() });
          }
          person(ctx, 1080, g, 1.75, { pose: 'drum', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', facing: -1, skin: 0.7 });
          // the commander on horseback, arm raised, addressing the line
          rider(ctx, 120, g, 2.1, 1, P.sindoor, P.haldi, 'wave', 'turban');
        },
      },
      big(1.3, {
        // What the quarrel was about: salt pans under new controls, and taxes wanted in silver, not cowries.
        at: 0.74, plane: 'mid', w: 560, h: 150,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.chandan, P.khondalite, 0.25));
          saltPans(ctx, rng, 220, g, 360, 1.3);
          person(ctx, 120, g - 16, 1.6, { pose: 'sweep', cloth: P.limewhite, head: 'cap', facing: 1, skin: 0.7 });
          // the salt-chowki: a little hut, a stool, its peon dozing off
          house(ctx, rng, 470, g, 70, 70, { roof: 'tile' });
          person(ctx, 420, g, 1.6, { pose: 'sit', cloth: mix(P.neel, P.limewhite, 0.3), cloth2: mix(P.neel, P.ink, 0.2), head: 'turban', facing: -1, skin: 0.45 });
          ctx.fillStyle = WOOD;
          ctx.fillRect(408, g - 10, 22, 3);
          // zzz as three little curls (no letters)
          for (let k = 0; k < 3; k++) taperStroke(ctx, curvePts(412 - k * 6, g - 66 - k * 9, 416 - k * 6, g - 70 - k * 9, 410 - k * 6, g - 72 - k * 9, 6), 1.4, P.limewhite, 0.8, [1, 1]);
          // a Paika and a farmer with a basket of cowries, talking it over
          basket(ctx, rng, 330, g, 13, true);
          person(ctx, 300, g, 1.75, { pose: 'point', cloth: P.haldi, cloth2: P.sindoor, head: 'turban', facing: 1, skin: 0.6 });
          person(ctx, 358, g, 1.7, { pose: 'stand', cloth: P.limewhite, head: 'none', facing: -1, skin: 0.4 });
        },
      }),
    ],
  }),

  // 22 · 1866 · Na'anka — quiet, near-monochrome; a relief kitchen in the dry land.
  r22: () => ({
    id: 'r22',
    sky: { stops: [[0, mix(P.skyCream, P.khondalite, 0.25)], [0.6, mix(P.skyCream, P.chandan, 0.2)], [1, mix(P.skyCream, P.limewhite, 0.3)]], sun: { x: 900, y: 110, r: 28, colour: mix(P.haldi, P.limewhite, 0.45) }, clouds: 'streak', cloudTint: mix(P.limewhite, P.chandan, 0.3), halftone: DERIVED.sepia },
    far: [{ kind: 'hills', a: mix(P.khondalite, P.skyCream, 0.5), b: P.khondalite, height: [10, 40], haze: 0.55 }],
    ground: { kind: 'land', plain: mix(P.chandan, P.khondalite, 0.4), plainDetail: 'dry', path: mix(P.laterite, P.khondalite, 0.45), verge: mix(P.khondalite, P.chandan, 0.4) },
    mid: (ctx, rng, W) => {
      const twig = mix(P.khondalite, P.ink, 0.25);
      scatter(rng.fork('bare'), W, [90, 200], (x) => wrapped(W, x, 60, (xx) => bareTree(ctx, rng.fork(x), xx, 230, rng.range(80, 130), mix(twig, P.skyCream, 0.35))));
      scatter(rng.fork('palm'), W, [240, 420], (x) => wrapped(W, x, 40, (xx) => palmyraPalm(ctx, rng.fork(x), xx, 236, rng.range(120, 160), 0.45)));
      townRow(ctx, rng.fork('huts'), W, 236, 0.35, ['thatch'], [220, 420]);
      bank(ctx, rng.fork('bank'), W, 240, mix(P.chandan, P.khondalite, 0.3), mix(P.khondalite, P.chandan, 0.35));
      // cracks in the dry ground
      for (let i = 0; i < 160; i++) {
        const x = rng.next() * W, y = rng.range(244, 258);
        wrapped(W, x, 12, (xx) => taperStroke(ctx, [{ x: xx, y }, { x: xx + rng.range(-8, 8), y: y + rng.range(1, 3) }, { x: xx + rng.range(-12, 12), y: y + rng.range(-1, 2) }], 0.9, mix(P.khondalite, P.ink, 0.35), 0.45));
      }
    },
    near: (ctx, rng, W) => {
      const twig = mix(P.khondalite, P.ink, 0.3);
      scatter(rng.fork('scrub'), W, [180, 340], (x) => wrapped(W, x, 30, (xx) => bareTree(ctx, rng.fork(x), xx, 134, rng.range(40, 60), twig)));
      scatter(rng.fork('grass'), W, [80, 160], (x) => wrapped(W, x, 20, (xx) => reedTuft(ctx, rng.fork(x), xx, 136, 22, rng.range(14, 22), { dark: mix(P.khondalite, P.ink, 0.2), mid: mix(P.khondalite, P.chandan, 0.4), tip: mix(P.chandan, P.haldi, 0.3) }, 7)));
    },
    fore: 'stones',
    tone: tone(0.9),
    sign: { date: '1866', title: "Na'anka" },
    landmarks: [
      big(1.3, {
        // A dry well; a single crow on its rim.
        at: 0.18, plane: 'mid', w: 300, h: 160,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.chandan, P.khondalite, 0.4));
          bareTree(ctx, rng, 70, g, 140, mix(P.khondalite, P.ink, 0.3));
          well(ctx, rng, 170, g, 1.6);
          crow(ctx, 150, g - 32, 1.6, 1);
        },
      }),
      {
        // Anna chhatra: volunteers ladle rice from big pots; people sit in a quiet row with leaf plates.
        at: 0.5, plane: 'mid', w: 660, h: 180,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.chandan, P.khondalite, 0.35));
          thatchShed(ctx, rng, 470, g, 300, 132);
          for (const px of [400, 470, 540]) cookPot(ctx, rng, px, g, 15);
          person(ctx, 375, g, 1.8, { pose: 'serve', cloth: P.limewhite, cloth2: P.haldi, head: 'turban', facing: -1, skin: 0.5 });
          person(ctx, 590, g, 1.8, { pose: 'carry', cloth: P.limewhite, cloth2: P.sindoor, head: 'none', facing: -1, skin: 0.65 });
          person(ctx, 440, g, 1.75, { pose: 'serve', cloth: P.sindoor, cloth2: P.haldi, sari: true, head: 'veil', facing: -1, skin: 0.4 });
          // a row of seated people with leaf plates
          for (let i = 0; i < 7; i++) {
            const x = 60 + i * 40;
            person(ctx, x, g, 1.6, { pose: 'sit', cloth: rng.pick([P.limewhite, mix(P.limewhite, P.chandan, 0.4), P.haldi]), cloth2: P.khondalite, sari: i % 3 === 1, head: i % 3 === 1 ? 'veil' : 'none', facing: 1, skin: rng.next() });
            dab(ctx, x + 15, g - 1.5, 7, 2, 0, mix(P.tota, P.khondalite, 0.3), 1);
            dab(ctx, x + 15, g - 3, 3, 1.4, 0, P.limewhite, 1);
          }
          // a mother and child waiting their turn
          person(ctx, 340, g, 1.75, { pose: 'stand', cloth: mix(P.limewhite, P.chandan, 0.3), cloth2: P.khondalite, sari: true, head: 'veil', facing: 1, skin: 0.6 });
          person(ctx, 322, g, 1.0, { pose: 'stand', cloth: P.limewhite, facing: 1, skin: 0.5 });
          // water pots in a line
          for (let i = 0; i < 4; i++) dab(ctx, 610 + i * 12, g - 7, 5, 6, 0, mix(P.laterite, P.khondalite, 0.3), 1);
        },
      },
      big(1.15, {
        // Relief arrives slowly by cart along a bad road.
        at: 0.82, plane: 'mid', w: 480, h: 130,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.laterite, P.khondalite, 0.4));
          for (const cx of [120, 300]) {
            bullockCartBg(ctx, rng.fork(cx), cx, g, 1.6, 0, cx * 0.01);
            for (let k = 0; k < 3; k++) dab(ctx, cx - 36 + k * 13, g - 46, 7, 5, 0, mix(P.limewhite, P.chandan, 0.4), 1);
          }
          person(ctx, 210, g, 1.75, { pose: 'carry', cloth: P.limewhite, head: 'none', facing: 1, skin: 0.6, phase: 1 });
          person(ctx, 400, g, 1.75, { pose: 'walk', cloth: P.limewhite, cloth2: P.chandan, head: 'turban', facing: 1, skin: 0.45, phase: 2 });
        },
      }),
    ],
  }),

  // 23 · 1866–1868 · Cuttack — Odia finds its printed voice.
  r23: () => ({
    id: 'r23',
    sky: { stops: [[0, mix(P.seafoam, P.neel, 0.2)], [0.55, mix(P.skyCream, P.seafoam, 0.3)], [1, P.skyCream]], sun: { x: 1050, y: 100, r: 32 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(mix(P.tota, P.neel, 0.4), P.skyCream, 0.5), b: P.neel, height: [10, 40], trees: true, haze: 0.55 }],
    ground: { kind: 'land', plain: mix(P.tota, P.chandan, 0.35), plainDetail: 'grass', path: mix(P.laterite, P.chandan, 0.4), verge: mix(P.tota, P.laterite, 0.3) },
    mid: (ctx, rng, W) => {
      // Far bank of the Mahanadi, the wide river with sails, and the near bank of the town.
      scatter(rng.fork('far'), W, [40, 80], (x) => wrapped(W, x, 40, (xx) => broadTree(ctx, rng.fork(x), xx, 150, rng.range(50, 80), rng.range(46, 70), 0.5)));
      scatter(rng.fork('farPalm'), W, [120, 240], (x) => wrapped(W, x, 30, (xx) => coconutPalm(ctx, rng.fork(x), xx, 152, rng.range(80, 110), rng.range(-0.12, 0.12), 0.45)));
      townRow(ctx, rng.fork('farTown'), W, 152, 0.45, ['tile', 'flat'], [60, 140]);
      vGradient(ctx, 0, 150, W, 72, [[0, mix(P.seafoam, P.limewhite, 0.3), 1], [0.5, mix(P.seafoam, P.peacock, 0.4), 1], [1, mix(P.peacock, P.neel, 0.3), 1]]);
      for (let i = 0; i < 260; i++) {
        const x = rng.next() * W, y = rng.range(154, 220);
        wrapped(W, x, 14, (xx) => taperStroke(ctx, [{ x: xx - 8, y }, { x: xx + 8, y }], 1.2, rng.chance(0.6) ? P.limewhite : mix(P.peacock, P.neel, 0.4), 0.4));
      }
      scatter(rng.fork('sails'), W, [260, 520], (x) => wrapped(W, x, 40, (xx) => {
        const y = rng.range(176, 206);
        ctx.fillStyle = mix(P.laterite, P.ink, 0.35);
        ctx.beginPath(); ctx.moveTo(xx - 22, y - 4); ctx.quadraticCurveTo(xx, y + 3, xx + 22, y - 5); ctx.lineTo(xx + 16, y + 1); ctx.lineTo(xx - 16, y + 1); ctx.closePath(); ctx.fill();
        taperStroke(ctx, [{ x: xx, y: y - 2 }, { x: xx, y: y - 40 }], 1.4, WOOD, 1, [1, 1]);
        ctx.fillStyle = mix(P.limewhite, P.chandan, 0.25);
        ctx.beginPath(); ctx.moveTo(xx + 1, y - 38); ctx.quadraticCurveTo(xx + 20, y - 24, xx + 14, y - 6); ctx.lineTo(xx + 1, y - 6); ctx.closePath(); ctx.fill();
      }));
      bank(ctx, rng.fork('bank'), W, 226, mix(P.chandan, P.limewhite, 0.3), mix(P.chandan, P.laterite, 0.3));
      scatter(rng.fork('nearTrees'), W, [220, 400], (x) => wrapped(W, x, 50, (xx) => coconutPalm(ctx, rng.fork(x), xx, 250, rng.range(110, 150), rng.range(-0.12, 0.12), 0.05)));
    },
    near: (ctx, rng, W) => {
      // The town street: shopfronts, readers, a boy with a bundle of papers.
      scatter(rng.fork('shops'), W, [300, 480], (x, i) => wrapped(W, x, 80, (xx) => {
        const r2 = rng.fork(x);
        if (i % 3 === 0) {
          stall(ctx, xx, 130, 64, 46, [P.limewhite, P.neel]);
          for (let k = 0; k < 4; k++) sheet(ctx, xx - 22 + k * 15, 100, 11, 14, r2.range(-0.1, 0.1));
          person(ctx, xx + 46, 132, 1.25, { pose: 'read', cloth: P.limewhite, cloth2: P.haldi, head: 'cap', facing: -1, skin: r2.next() });
        } else if (i % 3 === 1) {
          broadTree(ctx, r2, xx, 134, 70, 64);
          person(ctx, xx + 4, 132, 1.2, { pose: 'sit', cloth: P.limewhite, head: 'none', facing: 1, skin: r2.next() });
          person(ctx, xx + 40, 132, 1.25, { pose: 'read', cloth: P.sindoor, cloth2: P.haldi, sari: true, head: 'veil', facing: -1, skin: r2.next() });
        } else crowd(ctx, r2, xx - 30, xx + 40, 133, 1.2, { density: 2.2, poses: ['walk', 'read', 'stand'] });
      }));
      wrapped(W, 1150, 40, (xx) => { person(ctx, xx, 132, 1.0, { pose: 'carry', cloth: P.haldi, facing: 1 }); goat(ctx, xx + 40, 132, 1.1, -1); });
    },
    fore: 'grass',
    tone: tone(0.66),
    sign: { date: '1866–1868', title: 'Utkal Dipika' },
    landmarks: [
      {
        // Children fly kites painted with Odia letters.
        at: 0.1, plane: 'mid', w: 380, h: 300,
        paint: (ctx, _rng, _w, h) => {
          const g = h - 4;
          person(ctx, 120, g, 1.6, { pose: 'wave', cloth: P.haldi, facing: 1, skin: 0.5 });
          person(ctx, 200, g, 1.5, { pose: 'point', cloth: P.sindoor, cloth2: P.haldi, sari: true, head: 'bun', facing: 1, skin: 0.35 });
          kite(ctx, 250, 70, 1.3, P.haldi, P.sindoor, 'ଓ', 0.12, 128, g - 46);
          kite(ctx, 330, 120, 1.1, P.peacock, P.limewhite, 'ଅ', -0.1, 212, g - 34);
        },
      },
      big(1.1, {
        // The hand-press shop: sheets drying on lines, a printer with ink on his nose holds up the first page.
        at: 0.32, plane: 'mid', w: 680, h: 220,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.chandan, P.laterite, 0.3));
          // the shop: back wall, tiled roof on posts
          const wall = mix(P.chandan, P.limewhite, 0.45);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 170, y: g }, { x: 170, y: g - 130 }, { x: 510, y: g - 130 }, { x: 510, y: g }]), { x: 170, y: g - 130, w: 340, h: 130 }, { base: wall, light: P.limewhite, shade: mix(wall, P.laterite, 0.35), lightFrom: 'right', dabs: 80 });
          ctx.fillStyle = withAlpha(mix(P.ink, P.laterite, 0.3), 0.25);
          ctx.fillRect(176, g - 124, 328, 124);
          const roof = mix(P.laterite, P.sindoor, 0.2);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 150, y: g - 120 }, { x: 200, y: g - 170 }, { x: 480, y: g - 170 }, { x: 530, y: g - 120 }]), { x: 150, y: g - 170, w: 380, h: 50 }, { base: roof, light: mix(roof, P.haldi, 0.3), shade: mix(roof, P.ink, 0.3), lightFrom: 'right' });
          for (let x = 156; x < 526; x += 6) taperStroke(ctx, [{ x, y: g - 121 }, { x: 340 + (x - 340) * 0.8, y: g - 168 }], 1, mix(roof, P.ink, 0.35), 0.35, [1, 1]);
          for (const px of [176, 504]) taperStroke(ctx, [{ x: px, y: g }, { x: px, y: g - 122 }], 4, WOOD, 1, [1, 1]);
          // shelf of type cases and a stack of paper with a cat asleep on it
          ctx.fillStyle = WOOD;
          ctx.fillRect(196, g - 96, 70, 4);
          for (let i = 0; i < 6; i++) { ctx.fillStyle = mix(WOOD_L, P.ink, (i % 2) * 0.2); ctx.fillRect(198 + i * 11, g - 108, 9, 12); }
          for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? P.limewhite : mix(P.limewhite, P.chandan, 0.25); ctx.fillRect(452, g - 4 - i * 4, 36, 4); }
          dab(ctx, 470, g - 38, 9, 5, 0, mix(P.marigold, P.chandan, 0.4), 1);
          dab(ctx, 479, g - 41, 4, 3.5, 0, mix(P.marigold, P.chandan, 0.4), 1);
          taperStroke(ctx, [{ x: 462, y: g - 36 }, { x: 456, y: g - 34 }, { x: 458, y: g - 30 }], 2, mix(P.marigold, P.chandan, 0.4), 1, [1, 0.5]);
          for (let i = 0; i < 4; i++) dab(ctx, 440 - i * 9, g - 1 - (i % 2) * 2, 1.6, 1.2, 0, P.ink, 0.7);
          handPress(ctx, rng, 270, g, 1.55);
          // apprentice inking the forme
          person(ctx, 214, g, 1.7, { pose: 'paint', cloth: P.limewhite, cloth2: P.haldi, head: 'none', facing: 1, skin: 0.45 });
          dab(ctx, 214 + 7 * 1.7, g - 25 * 1.7 - 7 * 1.7, 3, 3, 0, P.ink, 1);
          // the printer, ink-smudged, holding up a fresh sheet
          const s = 1.9, px = 380;
          person(ctx, px, g, s, { pose: 'armsUp', cloth: P.limewhite, cloth2: mix(P.limewhite, P.khondalite, 0.3), head: 'none', facing: -1, skin: 0.55 });
          sheet(ctx, px, g - 25 * s - 13 * s, 22 * s, 14 * s, -0.04);
          dab(ctx, px - 1.6 * s, g - 29.6 * s + 1.8 * s, 1.6 * s, 1.1 * s, 0.3, P.ink, 0.9);
          dab(ctx, px + 1.4 * s, g - 12 * s, 1.6 * s, 1.2 * s, 0, P.ink, 0.7);
          // drying lines, both sides of the shop
          for (const [x0, x1] of [[20, 160], [520, 660]]) {
            taperStroke(ctx, [{ x: x0, y: g }, { x: x0, y: g - 110 }], 3, WOOD, 1, [1, 1]);
            taperStroke(ctx, [{ x: x1, y: g }, { x: x1, y: g - 110 }], 3, WOOD, 1, [1, 1]);
            for (const ly of [g - 104, g - 70]) {
              ctx.strokeStyle = withAlpha(P.khondalite, 0.8);
              ctx.lineWidth = 0.8;
              ctx.beginPath(); ctx.moveTo(x0, ly); ctx.quadraticCurveTo((x0 + x1) / 2, ly + 12, x1, ly); ctx.stroke();
              for (let k = 0; k < 5; k++) {
                const p = sagPt(x0, ly, x1, ly, 6, (k + 0.6) / 5.4);
                sheet(ctx, p.x, p.y + 10, 16, 20, rng.range(-0.08, 0.08));
              }
            }
          }
        },
      }),
      {
        // The College across the river (later Ravenshaw).
        at: 0.55, plane: 'mid', y: 354, w: 420, h: 150,
        paint: (ctx, rng, w, h) => {
          const g = h - 2;
          for (const tx of [40, 380]) broadTree(ctx, rng.fork(tx), tx, g, 70, 70, 0.4);
          colonial(ctx, rng, w / 2, g, 270, 92, 0.32);
          coconutPalm(ctx, rng, 70, g, 110, 0.08, 0.4);
          coconutPalm(ctx, rng, 360, g, 120, -0.06, 0.4);
        },
      },
      big(1.35, {
        // An old scribe with his palm-leaf pothi peers at a printed page through his spectacles.
        at: 0.72, plane: 'mid', w: 380, h: 160,
        paint: (ctx, rng, _w, h) => {
          const g = h - 4;
          // verandah plinth
          const plinth = mix(P.limewhite, P.khondalite, 0.25);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 30, y: g }, { x: 30, y: g - 14 }, { x: 350, y: g - 14 }, { x: 350, y: g }]), { x: 30, y: g - 14, w: 320, h: 14 }, { base: plinth, light: P.limewhite, shade: mix(plinth, P.ink, 0.3), lightFrom: 'top' });
          ctx.fillStyle = mix(P.haldi, P.laterite, 0.35);
          ctx.fillRect(100, g - 16, 90, 3);
          // palm-leaf bundles, stacked
          for (let i = 0; i < 6; i++) {
            const ly = g - 18 - i * 6;
            ctx.fillStyle = mix(P.haldi, P.chandan, 0.35 + (i % 2) * 0.15);
            ctx.fillRect(48, ly - 4, 44, 4);
            ctx.fillStyle = mix(WOOD, P.laterite, 0.2);
            ctx.fillRect(46, ly - 6, 48, 2);
            dab(ctx, 70, ly - 2, 1.2, 3, 0, P.sindoor, 1);
          }
          // the scribe, seated, a leaf and stylus in hand
          const s = 1.9, sx = 130;
          person(ctx, sx, g - 14, s, { pose: 'sit', cloth: P.limewhite, cloth2: P.chandan, head: 'none', facing: 1, skin: 0.7 });
          taperStroke(ctx, [{ x: sx, y: g - 14 - 23 * s }, { x: sx + 6 * s, y: g - 14 - 19 * s }, { x: sx + 9 * s, y: g - 14 - 21 * s }], 2.4 * s, skinTone(0.7), 1, [1, 0.75]);
          ctx.fillStyle = mix(P.haldi, P.chandan, 0.3);
          ctx.fillRect(sx + 8, g - 14 - 22 * s, 26, 3);
          taperStroke(ctx, [{ x: sx + 16, y: g - 14 - 23 * s }, { x: sx + 22, y: g - 14 - 30 * s }], 1, P.khondalite, 1, [1, 0.3]);
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 0.9;
          const hx = sx + 1.3 * s, hy = g - 14 - 29.6 * s;
          ctx.beginPath(); ctx.arc(hx + 1, hy, 2.2, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(hx + 3.2, hy); ctx.lineTo(hx + 5.5, hy); ctx.stroke();
          // white tuft of hair
          dab(ctx, sx - 2, g - 14 - 32 * s, 4, 2.4, 0, P.limewhite, 1);
          // the young printer with a sheet, and a taller pile of paper beside him
          person(ctx, 232, g - 14, 1.9, { pose: 'point', cloth: P.limewhite, cloth2: P.haldi, head: 'none', facing: -1, skin: 0.45 });
          sheet(ctx, 205, g - 14 - 24 * 1.9, 18, 22, 0.08);
          for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? P.limewhite : mix(P.limewhite, P.chandan, 0.3); ctx.fillRect(270, g - 17 - i * 4, 40, 4); }
          ctx.fillStyle = WOOD;
          ctx.fillRect(268, g - 75, 44, 2);
        },
      }),
      {
        // More letter-kites over the river bank.
        at: 0.92, plane: 'mid', w: 380, h: 300,
        paint: (ctx, _rng, _w, h) => {
          const g = h - 4;
          person(ctx, 150, g, 1.6, { pose: 'wave', cloth: P.limewhite, cloth2: P.sindoor, facing: 1, skin: 0.65 });
          person(ctx, 182, g, 1.1, { pose: 'armsUp', cloth: P.haldi, facing: 1, skin: 0.4 });
          kite(ctx, 240, 60, 1.2, P.sindoor, P.haldi, 'ଡ଼', 0.1, 158, g - 46);
          kite(ctx, 320, 130, 1.0, P.tota, P.limewhite, 'କ', -0.15, 186, g - 40);
        },
      },
    ],
  }),

  // 24 · 30 Dec 1903 · Utkal Sammilani, Cuttack — a big tent, bicycles, banners.
  r24: () => ({
    id: 'r24',
    sky: { stops: [[0, mix(P.seafoam, P.neel, 0.15)], [0.55, mix(P.skyCream, P.seafoam, 0.35)], [1, P.skyCream]], sun: { x: 960, y: 110, r: 32 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(mix(P.tota, P.neel, 0.35), P.skyCream, 0.5), b: P.neel, height: [10, 36], trees: true, haze: 0.55 }],
    ground: { kind: 'land', plain: mix(P.tota, P.chandan, 0.35), plainDetail: 'grass', path: mix(P.laterite, P.chandan, 0.4), verge: mix(P.tota, P.laterite, 0.25) },
    mid: (ctx, rng, W) => {
      treeRow(ctx, rng.fork('trees'), W, 196, 0.32, 0.3);
      scatter(rng.fork('colonial'), W, [700, 1000], (x) => wrapped(W, x, 90, (xx) => colonial(ctx, rng.fork(x), xx, 214, 150, 62, 0.3)));
      townRow(ctx, rng.fork('town'), W, 236, 0.12, ['tile', 'tile', 'flat'], [52, 96]);
      // bunting strung over the lanes
      scatter(rng.fork('bunting'), W, [260, 420], (x) => wrapped(W, x, 90, (xx) => bunting(ctx, xx - 80, 168, xx + 80, 172, 16, 8, [P.sindoor, P.haldi, P.limewhite, P.tota], 0.1)));
      // kerosene lamp posts along the road
      scatter(rng.fork('lamps'), W, [260, 420], (x) => wrapped(W, x, 10, (xx) => {
        const post = mix(P.neel, P.ink, 0.35);
        taperStroke(ctx, [{ x: xx, y: 248 }, { x: xx, y: 196 }], 2.2, post, 1, [1, 1]);
        ctx.fillStyle = withAlpha(P.limewhite, 0.85);
        ctx.fillRect(xx - 3.5, 186, 7, 8);
        ctx.fillStyle = post;
        ctx.fillRect(xx - 4.5, 194, 9, 2);
        ctx.beginPath(); ctx.moveTo(xx - 5, 187); ctx.lineTo(xx, 181); ctx.lineTo(xx + 5, 187); ctx.closePath(); ctx.fill();
      }), 60);
      bank(ctx, rng.fork('bank'), W, 242, mix(P.tota, P.haldi, 0.25), mix(P.tota, P.laterite, 0.35));
    },
    near: (ctx, rng, W) => {
      // Delegates walking in, umbrellas and shawls.
      scatter(rng.fork('walkers'), W, [220, 380], (x, i) => wrapped(W, x, 60, (xx) => {
        const r2 = rng.fork(x);
        crowd(ctx, r2, xx - 40, xx + 30, 133, 1.2, { facing: 1, poses: ['walk'], cloths: [P.limewhite, P.limewhite, P.haldi, P.sindoor, P.chandan], density: 2 });
        if (i % 2) umbrella(ctx, xx + 6, 104, 11, mix(P.ink, P.neel, 0.3));
      }));
      wrapped(W, 700, 40, (xx) => { bicycle(ctx, xx, 134, 1.3, mix(P.ink, P.neel, 0.2)); person(ctx, xx + 22, 134, 1.25, { pose: 'walk', cloth: P.limewhite, head: 'cap', facing: 1 }); });
    },
    fore: 'flowers',
    tone: tone(0.62),
    sign: { date: '30 Dec 1903', title: 'Utkal Sammilani' },
    landmarks: [
      big(1.25, {
        // Bicycles parked in a row; a boy minds them.
        at: 0.2, plane: 'mid', w: 440, h: 150,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.chandan, P.laterite, 0.25));
          broadTree(ctx, rng, 90, g, 150, 140, 0.05);
          const cols = [mix(P.ink, P.neel, 0.2), P.neel, mix(P.sindoor, P.laterite, 0.3), mix(P.ink, P.tota, 0.3)];
          for (let i = 0; i < 8; i++) bicycle(ctx, 120 + i * 30, g, 1.5, cols[i % cols.length]);
          person(ctx, 76, g, 1.25, { pose: 'sit', cloth: P.haldi, facing: 1, skin: 0.5 });
          bicycle(ctx, 400, g, 1.5, P.neel);
          person(ctx, 380, g, 1.75, { pose: 'pull', cloth: P.limewhite, cloth2: P.chandan, head: 'turban', facing: 1, phase: 1, skin: 0.4 });
        },
      }),
      {
        // The meeting tent: a speaker at the lectern, the hall full, more chairs being set out.
        at: 0.45, plane: 'mid', w: 700, h: 230,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.chandan, P.laterite, 0.25));
          pandal(ctx, rng, 330, g, 560, 210);
          const iy = g - 210 * 0.55;
          // a plain cloth banner with appliqué suns and flowers (no lettering)
          ctx.fillStyle = P.limewhite;
          ctx.fillRect(180, iy + 6, 300, 22);
          ctx.fillStyle = P.sindoor;
          ctx.fillRect(180, iy + 6, 300, 3);
          ctx.fillRect(180, iy + 25, 300, 3);
          for (let i = 0; i < 7; i++) { dab(ctx, 200 + i * 43, iy + 17, 6, 6, 0, i % 2 ? P.haldi : P.tota, 1); dab(ctx, 200 + i * 43, iy + 17, 2.4, 2.4, 0, P.sindoor, 1); }
          // dais and lectern
          ctx.fillStyle = mix(P.laterite, P.chandan, 0.2);
          ctx.fillRect(270, g - 14, 120, 14);
          person(ctx, 300, g - 14, 1.55, { pose: 'sit', cloth: P.limewhite, head: 'turban', facing: 1, skin: 0.5 });
          person(ctx, 366, g - 14, 1.55, { pose: 'sit', cloth: P.limewhite, cloth2: P.haldi, head: 'none', facing: -1, skin: 0.6 });
          person(ctx, 334, g - 14, 1.75, { pose: 'point', cloth: P.limewhite, cloth2: mix(P.limewhite, P.khondalite, 0.3), head: 'none', facing: 1, skin: 0.45 });
          ctx.fillStyle = WOOD;
          ctx.beginPath(); ctx.moveTo(342, g - 14); ctx.lineTo(346, g - 52); ctx.lineTo(362, g - 56); ctx.lineTo(360, g - 14); ctx.closePath(); ctx.fill();
          // audience seated, facing the dais
          crowd(ctx, rng.fork('l'), 70, 250, g, 1.45, { poses: ['sit'], facing: 1, cloths: [P.limewhite, P.limewhite, P.haldi, P.sindoor, P.chandan], density: 1.6 });
          crowd(ctx, rng.fork('r'), 410, 590, g, 1.45, { poses: ['sit'], facing: -1, cloths: [P.limewhite, P.limewhite, P.haldi, P.sindoor, P.chandan], density: 1.6 });
          // rows of empty chairs outside, and a volunteer carrying one more
          for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) chair(ctx, 618 + i * 14 + r * 6, g - r * 4, 1.4, mix(WOOD, P.ink, 0.2));
          person(ctx, 46, g, 1.7, { pose: 'carry', cloth: P.limewhite, cloth2: P.haldi, head: 'cap', facing: 1, skin: 0.6 });
        },
      },
      big(1.25, {
        // A goat has found the banner — and is eating its corner. A volunteer runs to stop it.
        at: 0.67, plane: 'mid', w: 400, h: 170,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.tota, P.chandan, 0.35));
          for (const px of [90, 290]) taperStroke(ctx, [{ x: px, y: g }, { x: px, y: g - 130 }], 4, mix(P.haldi, P.laterite, 0.4), 1, [1, 1]);
          // banner: hanging cloth, the right lower corner tugged down to the goat
          ctx.fillStyle = mix(P.marigold, P.limewhite, 0.5);
          ctx.beginPath();
          ctx.moveTo(92, g - 124); ctx.lineTo(288, g - 124); ctx.lineTo(288, g - 92);
          ctx.quadraticCurveTo(298, g - 60, 318, g - 36);
          ctx.quadraticCurveTo(250, g - 74, 92, g - 78);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = P.sindoor;
          ctx.lineWidth = 3;
          ctx.stroke();
          for (let i = 0; i < 4; i++) { dab(ctx, 120 + i * 44, g - 101, 8, 8, 0, i % 2 ? P.tota : P.haldi, 1); dab(ctx, 120 + i * 44, g - 101, 3, 3, 0, P.sindoor, 1); }
          softShadow(ctx, 352, g, 30, 5, P.ink, 0.35);
          goat(ctx, 350, g, 2, -1);
          person(ctx, 60, g, 1.8, { pose: 'armsUp', cloth: P.limewhite, cloth2: P.haldi, head: 'cap', facing: 1, phase: 1, skin: 0.5 });
          person(ctx, 200, g, 1.1, { pose: 'point', cloth: P.sindoor, facing: 1, skin: 0.4 });
        },
      }),
      big(1.15, {
        // Delegates from far districts arrive by bullock cart, umbrellas up.
        at: 0.9, plane: 'mid', w: 480, h: 150,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.laterite, P.chandan, 0.35));
          bullockCartBg(ctx, rng.fork(1), 110, g, 1.7, 0, 0.2);
          bullockCartBg(ctx, rng.fork(2), 290, g, 1.6, 0, 1.4);
          person(ctx, 210, g, 1.75, { pose: 'walk', cloth: P.limewhite, cloth2: P.chandan, head: 'turban', facing: 1, phase: 0.7, skin: 0.55 });
          umbrella(ctx, 218, g - 24, 18, mix(P.ink, P.neel, 0.3));
          person(ctx, 420, g, 1.8, { pose: 'wave', cloth: P.limewhite, cloth2: P.haldi, head: 'cap', facing: -1, skin: 0.4 });
        },
      }),
    ],
  }),

  // 25 · 1 Apr 1936 · Utkal Divas — painted in full festival colour; the engine tones a copy that fades away.
  r25: () => ({
    id: 'r25',
    sky: { stops: [[0, mix(P.seafoam, P.peacock, 0.15)], [0.55, mix(P.skyCream, P.haldi, 0.15)], [1, P.skyCream]], sun: { x: 1000, y: 110, r: 38, rays: true }, clouds: 'cumulus', halftone: mix(P.marigold, P.skyCream, 0.4) },
    far: [{ kind: 'hills', a: mix(P.tota, P.skyCream, 0.35), b: P.peacock, height: [10, 40], trees: true, haze: 0.4 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.3), plainDetail: 'grass', path: mix(P.laterite, P.chandan, 0.3), verge: mix(P.tota, P.laterite, 0.15) },
    mid: (ctx, rng, W) => {
      scatter(rng.fork('palms'), W, [160, 320], (x) => wrapped(W, x, 40, (xx) => coconutPalm(ctx, rng.fork(x), xx, 232, rng.range(110, 150), rng.range(-0.12, 0.12), 0.15)));
      scatter(rng.fork('trees'), W, [260, 460], (x) => wrapped(W, x, 50, (xx) => broadTree(ctx, rng.fork(x), xx, 232, rng.range(70, 100), rng.range(60, 80), 0.15)));
      townRow(ctx, rng.fork('town'), W, 236, 0.05, ['tile', 'tile', 'flat'], [70, 130]);
      // marigold garlands and flags between the houses
      scatter(rng.fork('garlands'), W, [180, 280], (x, i) => wrapped(W, x, 110, (xx) => {
        garland(ctx, xx - 100, 176, xx + 100, 178, 22, 1, i % 2 ? [P.marigold, P.haldi] : [P.marigold, P.sindoor]);
        flag(ctx, xx - 100, 236, 70, [P.sindoor, P.haldi, P.rani, P.tota][i % 4], 0, 2);
      }));
      // little lamps along the garden walls
      ctx.fillStyle = mix(P.limewhite, P.chandan, 0.25);
      ctx.fillRect(0, 238, W, 6);
      for (let x = 6; x < W; x += 22) diya(ctx, x, 238, 1, 10);
      bank(ctx, rng.fork('bank'), W, 244, mix(P.tota, P.haldi, 0.3), mix(P.tota, P.laterite, 0.3));
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('crowd'), W, [240, 420], (x, i) => wrapped(W, x, 70, (xx) => {
        const r2 = rng.fork(x);
        crowd(ctx, r2, xx - 50, xx + 40, 133, 1.25, { poses: ['armsUp', 'wave', 'walk', 'cymbal'], density: 2 });
        if (i % 2) stall(ctx, xx + 80, 132, 60, 44, [P.rani, P.haldi]);
      }));
    },
    fore: 'flowers',
    tone: tone(0.75),
    flood: true,
    sign: { date: '1 Apr 1936', title: 'Utkal Divas' },
    landmarks: [
      big(1.6, {
        // Barabati fort beyond its moat, flags on the bastions.
        at: 0.36, plane: 'far', y: 446, w: 900, h: 150,
        paint: (ctx, rng, w, h) => {
          const hz3 = 0.3;
          vGradient(ctx, 40, h - 14, w - 80, 14, [[0, hz(mix(P.peacock, P.seafoam, 0.5), hz3), 1], [1, hz(P.peacock, hz3), 1]]);
          const wall = hz(mix(P.laterite, P.chandan, 0.2), hz3);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 120, y: h - 14 }, { x: 120, y: h - 60 }, { x: 780, y: h - 60 }, { x: 780, y: h - 14 }]), { x: 120, y: h - 60, w: 660, h: 46 }, { base: wall, light: hz(mix(wall, P.haldi, 0.35), hz3), shade: hz(mix(wall, P.ink, 0.35), hz3), lightFrom: 'top', dabs: 200 });
          ctx.fillStyle = wall;
          for (let x = 122; x < 778; x += 14) ctx.fillRect(x, h - 66, 8, 7);
          for (const bx of [120, 300, 600, 780]) {
            paintedShape(ctx, rng, () => polyPath(ctx, [{ x: bx - 18, y: h - 14 }, { x: bx - 16, y: h - 80 }, { x: bx + 16, y: h - 80 }, { x: bx + 18, y: h - 14 }]), { x: bx - 18, y: h - 80, w: 36, h: 66 }, { base: wall, light: hz(mix(wall, P.haldi, 0.4), hz3), shade: hz(mix(wall, P.ink, 0.35), hz3), lightFrom: 'right' });
            flag(ctx, bx, h - 80, 40, [P.sindoor, P.haldi, P.tota, P.rani][(bx / 60) % 4 | 0], hz3, 2);
          }
          // the great gate
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 420, y: h - 14 }, { x: 420, y: h - 96 }, { x: 480, y: h - 96 }, { x: 480, y: h - 14 }]), { x: 420, y: h - 96, w: 60, h: 82 }, { base: wall, light: hz(mix(wall, P.haldi, 0.4), hz3), shade: hz(mix(wall, P.ink, 0.35), hz3), lightFrom: 'right' });
          ctx.fillStyle = hz(mix(P.ink, P.laterite, 0.3), hz3);
          ctx.beginPath(); ctx.moveTo(436, h - 14); ctx.lineTo(436, h - 50); ctx.quadraticCurveTo(450, h - 68, 464, h - 50); ctx.lineTo(464, h - 14); ctx.closePath(); ctx.fill();
          garland(ctx, 420, h - 92, 480, h - 92, 10, 0.8);
          for (const tx of [60, 840]) broadTree(ctx, rng.fork(tx), tx, h - 10, 90, 80, 0.3);
        },
      }),
      big(1.15, {
        // Conch shells, drums and dancing in the lane.
        at: 0.16, plane: 'mid', w: 480, h: 180,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.laterite, P.chandan, 0.3));
          for (const px of [40, 440]) taperStroke(ctx, [{ x: px, y: g }, { x: px, y: g - 150 }], 4, mix(P.haldi, P.laterite, 0.35), 1, [1, 1]);
          garland(ctx, 40, g - 146, 440, g - 146, 30, 1.2, [P.marigold, P.haldi, P.sindoor]);
          garland(ctx, 40, g - 130, 440, g - 130, 44, 1, [P.rani, P.marigold]);
          person(ctx, 90, g, 1.9, { pose: 'conch', cloth: P.limewhite, cloth2: P.sindoor, head: 'none', facing: 1, skin: 0.55 });
          person(ctx, 130, g, 1.85, { pose: 'conch', cloth: P.haldi, cloth2: P.sindoor, sari: true, head: 'veil', facing: 1, skin: 0.4 });
          const dancers: [number, Pose, string, boolean][] = [[190, 'armsUp', P.rani, true], [230, 'wave', P.marigold, false], [270, 'armsUp', P.tota, true], [310, 'wave', P.haldi, false], [350, 'armsUp', P.sindoor, true]];
          dancers.forEach(([x, pose, c, sari], i) => person(ctx, x, g - (i % 2) * 4, 1.85, { pose, cloth: c, cloth2: P.haldi, sari, head: sari ? 'veil' : 'turban', facing: i % 2 ? -1 : 1, phase: i, skin: rng.next() }));
          person(ctx, 400, g, 1.85, { pose: 'drum', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', facing: -1, skin: 0.7 });
          for (let i = 0; i < 18; i++) dab(ctx, 160 + rng.next() * 220, g - 60 - rng.next() * 70, 2, 1.4, rng.next() * 3, rng.pick([P.marigold, P.haldi, P.rani]), 0.9);
        },
      }),
      {
        // On a garlanded stage, two people unfold a new map; the crowd cheers.
        at: 0.48, plane: 'mid', w: 620, h: 220,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.laterite, P.chandan, 0.3));
          // stage
          const stage = mix(P.laterite, P.chandan, 0.15);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 170, y: g }, { x: 170, y: g - 26 }, { x: 450, y: g - 26 }, { x: 450, y: g }]), { x: 170, y: g - 26, w: 280, h: 26 }, { base: stage, light: mix(stage, P.haldi, 0.4), shade: mix(stage, P.ink, 0.35), lightFrom: 'top' });
          for (let x = 180; x < 450; x += 18) diya(ctx, x, g - 26, 1.2, 12);
          for (const px of [180, 440]) taperStroke(ctx, [{ x: px, y: g - 26 }, { x: px, y: g - 200 }], 4, mix(P.haldi, P.laterite, 0.35), 1, [1, 1]);
          garland(ctx, 180, g - 196, 440, g - 196, 26, 1.3, [P.marigold, P.haldi]);
          garland(ctx, 180, g - 184, 440, g - 184, 36, 1.1, [P.sindoor, P.marigold]);
          // the map cloth
          const mx0 = 250, mx1 = 370, my0 = g - 120, my1 = g - 52;
          ctx.fillStyle = P.limewhite;
          ctx.beginPath(); ctx.moveTo(mx0, my0); ctx.quadraticCurveTo((mx0 + mx1) / 2, my0 - 6, mx1, my0); ctx.lineTo(mx1 + 2, my1); ctx.quadraticCurveTo((mx0 + mx1) / 2, my1 + 6, mx0 - 2, my1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = P.sindoor;
          ctx.lineWidth = 2.4;
          ctx.stroke();
          const land: Pt[] = [{ x: 268, y: my0 + 14 }, { x: 300, y: my0 + 8 }, { x: 335, y: my0 + 16 }, { x: 352, y: my0 + 34 }, { x: 340, y: my0 + 56 }, { x: 306, y: my0 + 60 }, { x: 290, y: my0 + 44 }, { x: 266, y: my0 + 36 }];
          ctx.fillStyle = P.tota;
          smoothPath(ctx, land, true);
          ctx.fill();
          ctx.strokeStyle = P.haldi;
          ctx.lineWidth = 2;
          ctx.stroke();
          for (let i = 0; i < 12; i++) taperStroke(ctx, [{ x: 352 - i * 0.6, y: my0 + 34 + i * 2 }, { x: 362, y: my0 + 36 + i * 2 }], 1, P.peacock, 0.8);
          dab(ctx, 312, my0 + 34, 3, 3, 0, P.sindoor, 1);
          person(ctx, 236, g - 26, 1.9, { pose: 'armsUp', cloth: P.limewhite, cloth2: P.haldi, head: 'none', facing: 1, skin: 0.5 });
          person(ctx, 384, g - 26, 1.9, { pose: 'armsUp', cloth: P.marigold, cloth2: P.sindoor, sari: true, head: 'veil', facing: -1, skin: 0.4 });
          // the crowd in front
          crowd(ctx, rng.fork('cl'), 40, 170, g, 1.7, { poses: ['armsUp', 'wave'], facing: 1, density: 1.4 });
          crowd(ctx, rng.fork('cr'), 455, 590, g, 1.7, { poses: ['armsUp', 'wave', 'conch'], facing: -1, density: 1.4 });
          for (const [fx, c] of [[30, P.sindoor], [600, P.haldi]] as [number, string][]) flag(ctx, fx, g, 150, c, 0, 4);
          for (let i = 0; i < 30; i++) dab(ctx, 190 + rng.next() * 240, g - 130 - rng.next() * 60, 2, 1.4, rng.next() * 3, rng.pick([P.marigold, P.haldi, P.rani, P.sindoor]), 0.9);
        },
      },
      big(1.2, {
        // Newspapers! A boy on a crate holds up the day's paper; a cow in a marigold garland wanders through.
        at: 0.8, plane: 'mid', w: 500, h: 170,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          groundPatch(ctx, rng, 20, w - 20, g + 2, mix(P.laterite, P.chandan, 0.3));
          const lw = mix(P.laterite, P.chandan, 0.25);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 30, y: g }, { x: 30, y: g - 22 }, { x: 180, y: g - 22 }, { x: 180, y: g }]), { x: 30, y: g - 22, w: 150, h: 22 }, { base: lw, light: mix(lw, P.haldi, 0.4), shade: mix(lw, P.ink, 0.35), lightFrom: 'top' });
          ctx.fillStyle = P.limewhite;
          ctx.fillRect(28, g - 25, 154, 3);
          for (let x = 38; x < 180; x += 16) diya(ctx, x, g - 25, 1.2, 12);
          // crate and the paper boy
          ctx.fillStyle = WOOD_L;
          ctx.fillRect(222, g - 20, 30, 20);
          ctx.strokeStyle = withAlpha(WOOD, 0.8);
          ctx.lineWidth = 1;
          ctx.strokeRect(222, g - 20, 30, 20);
          const s = 1.5;
          person(ctx, 237, g - 20, s, { pose: 'armsUp', cloth: P.haldi, cloth2: P.sindoor, head: 'cap', facing: 1, skin: 0.5 });
          sheet(ctx, 237, g - 20 - 38 * s, 22 * s, 14 * s, 0.05);
          for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? P.limewhite : mix(P.limewhite, P.chandan, 0.3); ctx.fillRect(258, g - 4 - i * 4, 30, 4); }
          // readers
          person(ctx, 310, g, 1.8, { pose: 'read', cloth: P.limewhite, cloth2: P.peacock, head: 'turban', facing: -1, skin: 0.4 });
          person(ctx, 340, g, 1.75, { pose: 'read', cloth: P.rani, cloth2: P.haldi, sari: true, head: 'veil', facing: -1, skin: 0.6 });
          person(ctx, 196, g, 1.75, { pose: 'wave', cloth: P.limewhite, cloth2: P.tota, head: 'none', facing: 1, skin: 0.7 });
          // the cow
          cow(ctx, 420, g, 1.6, { facing: -1, colour: P.limewhite });
          garland(ctx, 384, g - 38, 404, g - 28, 6, 0.9);
          dab(ctx, 406, g - 46, 2.4, 2.4, 0, P.sindoor, 1);
        },
      }),
    ],
  }),

  // 26 · 11 Oct 1938 · Nilakanthapur ghat — night, rain, an empty boat with a single lamp.
  r26: () => ({
    id: 'r26',
    sky: { stops: [[0, mix(P.neel, P.ink, 0.45)], [0.6, mix(P.neel, P.khondalite, 0.25)], [1, mix(P.neel, P.skyCream, 0.3)]], moon: { x: 930, y: 110, r: 20 }, stars: 24, clouds: 'streak', cloudTint: mix(P.neel, P.limewhite, 0.35), halftone: P.neel },
    far: [
      { kind: 'hills', a: mix(P.neel, P.khondalite, 0.4), b: P.ink, height: [30, 80], trees: true, haze: 0.1 },
      { kind: 'hills', a: mix(P.neel, P.ink, 0.25), b: P.ink, height: [10, 34], trees: true, haze: 0.04 },
    ],
    ground: { kind: 'water', water: { sky: mix(P.neel, P.skyCream, 0.25), light: mix(P.neel, P.seafoam, 0.25), mid: mix(P.neel, P.ink, 0.2), deep: mix(P.neel, P.ink, 0.5) } },
    mid: (ctx, rng, W) => {
      // The far bank at night: dark trees and palms, a village with a few lamps lit, ghat steps.
      const dark = mix(P.neel, P.ink, 0.35);
      scatter(rng.fork('trees'), W, [60, 110], (x) => wrapped(W, x, 60, (xx) => broadTree(ctx, rng.fork(x), xx, 232, rng.range(80, 120), rng.range(70, 100))));
      scatter(rng.fork('palms'), W, [140, 260], (x) => wrapped(W, x, 50, (xx) => coconutPalm(ctx, rng.fork(x), xx, 236, rng.range(120, 170), rng.range(-0.14, 0.14))));
      const lamps: number[] = [];
      scatter(rng.fork('huts'), W, [160, 340], (x) => {
        wrapped(W, x, 40, (xx) => house(ctx, rng.fork(x), xx, 240, 44, 40, { roof: 'thatch' }));
        if (rng.chance(0.6)) lamps.push(x);
      });
      scatter(rng.fork('steps'), W, [500, 800], (x) => wrapped(W, x, 50, (xx) => {
        for (let k = 0; k < 4; k++) { ctx.fillStyle = mix(P.khondalite, P.neel, 0.2 + k * 0.08); ctx.fillRect(xx - 40 + k * 5, 238 + k * 4, 80 - k * 10, 4); }
      }));
      bank(ctx, rng.fork('bank'), W, 246, mix(P.khondalite, P.neel, 0.3), dark, mix(P.neel, P.ink, 0.4));
      nightWash(ctx, W, 260, 0.6);
      for (const x of lamps) wrapped(W, x, 20, (xx) => {
        glow(ctx, xx, 228, 18, P.marigold, 0.6);
        ctx.fillStyle = mix(P.marigold, P.haldi, 0.4);
        ctx.fillRect(xx - 4.5, 224, 9, 16);
      });
    },
    near: (ctx, rng, W) => {
      // Reed clumps and old mooring stakes in the shallows.
      scatter(rng.fork('reeds'), W, [260, 460], (x) => wrapped(W, x, 30, (xx) => reedTuft(ctx, rng.fork(x), xx, 132, rng.range(30, 50), rng.range(30, 50), { dark: mix(P.neel, P.ink, 0.5), mid: mix(P.neel, P.tota, 0.25), tip: mix(P.neel, P.seafoam, 0.3) }, 10, 2)));
      scatter(rng.fork('stakes'), W, [500, 800], (x) => wrapped(W, x, 10, (xx) => taperStroke(ctx, [{ x: xx, y: 134 }, { x: xx + 2, y: 100 }], 4, mix(P.neel, P.ink, 0.5), 1, [1, 0.7])), 200);
    },
    fore: 'none',
    rain: true,
    tone: tone(0.85),
    sign: { date: '11 Oct 1938', title: 'Nilakanthapur ghat' },
    landmarks: [
      big(1.2, {
        // A hut on the bank, its door lit.
        at: 0.16, plane: 'mid', w: 260, h: 170,
        paint: (ctx, rng, w, h) => {
          const g = h - 4;
          coconutPalm(ctx, rng, 60, g, 150, 0.12);
          house(ctx, rng, 150, g, 80, 76, { roof: 'thatch', wall: mix(P.chandan, P.khondalite, 0.4) });
          ctx.fillStyle = mix(P.khondalite, P.neel, 0.3);
          ctx.fillRect(40, g - 2, 200, 4);
          nightWash(ctx, w, h, 0.6);
          glow(ctx, 150, g - 16, 46, P.marigold, 0.5);
          ctx.fillStyle = mix(P.marigold, P.haldi, 0.45);
          ctx.fillRect(150 - 80 * 0.12, g - 76 * 0.58 * 0.62, 80 * 0.24, 76 * 0.58 * 0.62);
        },
      }),
      {
        // Nilakanthapur ghat: stone steps, a mooring post, an empty boat tied up with a single lamp burning.
        at: 0.48, plane: 'mid', y: 486, w: 760, h: 300,
        paint: (ctx, rng, w, h) => {
          const g = h - 24; // waterline (screen ≈ 462)
          const stone = mix(P.khondalite, P.neel, 0.2);
          broadTree(ctx, rng, 110, g - 44, 210, 190);
          for (let k = 0; k < 7; k++) {
            const sy = g - 46 + k * 7, sx0 = 30 + k * 9, sx1 = 330 - k * 5;
            paintedShape(ctx, rng, () => polyPath(ctx, [{ x: sx0, y: sy + 7 }, { x: sx0 + 3, y: sy }, { x: sx1 - 3, y: sy }, { x: sx1, y: sy + 7 }]), { x: sx0, y: sy, w: sx1 - sx0, h: 7 }, { base: mix(stone, P.limewhite, 0.25 - k * 0.03), light: mix(stone, P.limewhite, 0.4), shade: mix(stone, P.ink, 0.4), lightFrom: 'top', dabs: 24 });
          }
          taperStroke(ctx, [{ x: 370, y: g + 6 }, { x: 372, y: g - 52 }], 6, mix(P.khondalite, P.ink, 0.4), 1, [1, 0.8]);
          ctx.strokeStyle = withAlpha(mix(P.chandan, P.khondalite, 0.4), 0.9);
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(372, g - 42); ctx.quadraticCurveTo(398, g - 8, 428, g - 14); ctx.stroke();
          countryBoat(ctx, rng, 470, g, 1.6);
          nightWash(ctx, w, h, 0.64);
          // rain sheen on the wet steps
          for (let k = 0; k < 7; k++) taperStroke(ctx, [{ x: 42 + k * 9, y: g - 45 + k * 7 }, { x: 318 - k * 5, y: g - 45 + k * 7 }], 1.2, P.limewhite, 0.22);
          // the single lamp on the bow, and its long broken reflection
          const lx = 530, ly = g - 20;
          glow(ctx, lx, ly - 6, 150, P.marigold, 0.5);
          glow(ctx, lx, ly - 6, 40, P.haldi, 0.8);
          diya(ctx, lx, ly, 2.6, 0);
          for (let i = 0; i < 9; i++) {
            const yy = g + 3 + i * 2.2, half = 7 - i * 0.5 + (i % 2) * 2;
            taperStroke(ctx, [{ x: lx - half, y: yy }, { x: lx + half, y: yy }], 1.6, i % 2 ? P.haldi : P.marigold, 0.6 - i * 0.05);
          }
        },
      },
      big(1.2, {
        // An egret waits on a stake in the rain.
        at: 0.82, plane: 'mid', w: 200, h: 160,
        paint: (ctx, _rng, w, h) => {
          const g = h - 4;
          taperStroke(ctx, [{ x: 100, y: g }, { x: 102, y: g - 60 }], 6, mix(P.khondalite, P.ink, 0.4), 1, [1, 0.8]);
          egret(ctx, 102, g - 60, 1.6, 0);
          nightWash(ctx, w, h, 0.4);
          for (let i = 0; i < 5; i++) taperStroke(ctx, [{ x: 70 + i * 16, y: g + 1 }, { x: 80 + i * 16, y: g + 1 }], 1, P.limewhite, 0.3);
        },
      }),
    ],
  }),
};
