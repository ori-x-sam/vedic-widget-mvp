// Act II · The Temple Coast, second half (records 11–15). Lead: laterite;
// supports marigold, khondalite, tota (+ limewhite at Puri, dark khondalite at
// Konark: the "White Pagoda / Black Pagoda" pair). Temples and shrines are
// always background scenery (§7). Small helpers here are also used by act3.ts.
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, dabField, glow, makeCanvas, paintedShape, polyPath, softShadow, taperStroke, vGradient, wrapped, type Ctx } from '../brush';
import { bank, scatter, treeRow, type SceneDef } from '../engine';
import { cow, crow, elephant, goat } from '../kit/animals';
import { house, jagannathTemple, konark, pacheri, pidhaHall, rekhaDeula, singhadwara, stall, templeLine } from '../kit/buildings';
import { boitaShip, bullockCartBg } from '../kit/craft';
import { chhati, crowd, flag, person, type Headwear } from '../kit/people';
import { broadTree, coconutPalm, egret, lotusFlower, lotusPad, palmyraPalm, reedTuft } from '../shared/nature';

// ---- small shared helpers ---------------------------------------------------------

export const hz = (c: string, h = 0): string => (h ? mix(c, P.skyCream, h) : c);

/** Paint into an offscreen canvas. */
export function offscreen(w: number, h: number, paint: (c: Ctx) => void): HTMLCanvasElement {
  const [c, cx] = makeCanvas(w, h);
  paint(cx);
  return c;
}

/** Wash everything already painted on a canvas with a colour (dusk silhouettes, haze). */
export function tint(c: HTMLCanvasElement, colour: string, alpha: number): HTMLCanvasElement {
  const cx = c.getContext('2d')!;
  cx.globalCompositeOperation = 'source-atop';
  cx.fillStyle = withAlpha(colour, alpha);
  cx.fillRect(0, 0, c.width, c.height);
  cx.globalCompositeOperation = 'source-over';
  return c;
}

/** Paint a figure group with a bold lamp-black outline, Pattachitra-style. */
export function outlined(ctx: Ctx, w: number, h: number, paint: (c: Ctx) => void, ink: string = P.ink, width = 1.6): void {
  const fig = offscreen(w, h, paint);
  const sil = offscreen(w, h, (cx) => {
    cx.drawImage(fig, 0, 0);
    cx.globalCompositeOperation = 'source-in';
    cx.fillStyle = ink;
    cx.fillRect(0, 0, w, h);
  });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.drawImage(sil, Math.cos(a) * width, Math.sin(a) * width);
  }
  ctx.drawImage(fig, 0, 0);
}

/** A sagging string of triangular pennants. */
export function bunting(ctx: Ctx, x0: number, x1: number, y: number, sag: number, cols: string[], size = 7, haze = 0): void {
  const pts = curvePts(x0, y, (x0 + x1) / 2, y + sag * 2, x1, y, 24);
  ctx.strokeStyle = hz(mix(P.laterite, P.ink, 0.4), haze);
  ctx.lineWidth = 1;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    ctx.fillStyle = hz(cols[i % cols.length], haze);
    ctx.beginPath();
    ctx.moveTo(p.x - size * 0.5, p.y);
    ctx.lineTo(p.x + size * 0.5, p.y);
    ctx.lineTo(p.x + size * 0.1, p.y + size * 1.2);
    ctx.closePath();
    ctx.fill();
  }
}

/** A tall appliqué banner on a pole: a cloth panel with a stitched motif. */
export function appliqueBanner(ctx: Ctx, x: number, y: number, h: number, a: string, b: string, motif: 'sun' | 'elephant' | 'parrot' | 'fish' = 'sun', haze = 0): void {
  taperStroke(ctx, [{ x, y }, { x, y: y - h }], Math.max(1.2, h * 0.025), hz(mix(P.laterite, P.ink, 0.3), haze), 1, [1, 1]);
  const w = h * 0.28, top = y - h + h * 0.06, ph = h * 0.42;
  ctx.fillStyle = hz(a, haze);
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + w, top);
  ctx.lineTo(x + w, top + ph);
  ctx.lineTo(x + w / 2, top + ph + w * 0.4);
  ctx.lineTo(x, top + ph);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = hz(b, haze);
  ctx.fillRect(x, top + ph * 0.06, w, ph * 0.08);
  ctx.fillRect(x, top + ph * 0.86, w, ph * 0.08);
  const cx = x + w / 2, cy = top + ph * 0.48, r = w * 0.28;
  if (motif === 'sun') {
    for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; dab(ctx, cx + Math.cos(an) * r * 1.3, cy + Math.sin(an) * r * 1.3, r * 0.22, r * 0.22, 0, hz(b, haze), 1); }
    dab(ctx, cx, cy, r, r, 0, hz(b, haze), 1);
  } else if (motif === 'elephant') {
    dab(ctx, cx, cy, r * 1.3, r * 0.8, 0, hz(b, haze), 1);
    taperStroke(ctx, [{ x: cx + r, y: cy - r * 0.2 }, { x: cx + r * 1.6, y: cy + r * 0.9 }], r * 0.5, hz(b, haze), 1, [1, 0.5]);
    for (const k of [-0.7, 0.6]) ctx.fillRect(cx + k * r - r * 0.15, cy + r * 0.4, r * 0.3, r * 0.7);
  } else if (motif === 'parrot') {
    dab(ctx, cx, cy, r * 0.7, r * 1.1, 0.4, hz(P.tota, haze), 1);
    dab(ctx, cx + r * 0.3, cy - r * 0.9, r * 0.45, r * 0.45, 0, hz(P.tota, haze), 1);
    dab(ctx, cx + r * 0.75, cy - r * 0.8, r * 0.2, r * 0.16, 0, hz(P.sindoor, haze), 1);
  } else {
    dab(ctx, cx, cy, r * 1.2, r * 0.55, 0, hz(b, haze), 1);
    ctx.fillStyle = hz(b, haze);
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r * 1.7, cy - r * 0.6); ctx.lineTo(cx - r * 1.7, cy + r * 0.6); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = withAlpha(hz(P.limewhite, haze), 0.85);
  ctx.setLineDash([1.4, 1.6]);
  ctx.lineWidth = 0.7;
  ctx.strokeRect(x + 1.5, top + 1.5, w - 3, ph - 3);
  ctx.setLineDash([]);
}

/** A sagging marigold garland. */
export function garland(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, r = 2.2, haze = 0): void {
  const pts = curvePts(x0, y0, (x0 + x1) / 2, Math.max(y0, y1) + sag, x1, y1, Math.max(6, Math.round(Math.abs(x1 - x0) / (r * 1.6))));
  pts.forEach((p, i) => dab(ctx, p.x, p.y, r, r, 0, hz(i % 3 ? P.marigold : P.haldi, haze), 1));
}

/** A clay diya with its flame and glow. */
export function diya(ctx: Ctx, x: number, y: number, s: number, glowR = 18): void {
  glow(ctx, x, y - 3 * s, glowR * s, P.marigold, 0.55);
  dab(ctx, x, y, 3.2 * s, 1.4 * s, 0, mix(P.laterite, P.ink, 0.2), 1);
  dab(ctx, x, y - 2.6 * s, 1 * s, 2 * s, 0, P.haldi, 1);
  dab(ctx, x, y - 2.2 * s, 0.5 * s, 1 * s, 0, P.limewhite, 1);
}

/** A flat patch of still water with light ripples. */
export function waterPatch(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, c: { light: string; mid: string; deep: string }, ripples = 40): void {
  vGradient(ctx, x, y, w, h, [[0, c.light, 1], [0.45, c.mid, 1], [1, c.deep, 1]]);
  for (let i = 0; i < ripples; i++) {
    const rx = x + rng.next() * w, ry = y + 2 + rng.next() * (h - 4);
    const l = rng.range(6, 22);
    taperStroke(ctx, [{ x: rx - l / 2, y: ry }, { x: rx + l / 2, y: ry }], rng.range(0.8, 1.8), rng.chance(0.6) ? P.limewhite : c.deep, rng.range(0.25, 0.5));
  }
}

/** A small wooden country boat; (x, y) = waterline centre. Optional standing oarsperson at the stern. */
export function countryBoat(ctx: Ctx, rng: Rng, x: number, y: number, s: number, o: {
  facing?: 1 | -1; haze?: number; rower?: { cloth: string; cloth2?: string; sari?: boolean; head?: Headwear; skin?: number }; seated?: string[]; lamp?: boolean; hull?: string;
} = {}): void {
  const f = o.facing ?? 1;
  const wood = hz(o.hull ?? mix(P.laterite, P.ink, 0.2), o.haze);
  const woodL = hz(mix(P.laterite, P.chandan, 0.4), o.haze);
  // seated passengers first (behind the gunwale)
  (o.seated ?? []).forEach((c, i) => person(ctx, x + (-6 + i * 12) * s * f, y - 2 * s, 0.9 * s, { pose: 'sit', cloth: c, facing: f, haze: o.haze, skin: 0.3 + i * 0.2, head: i % 2 ? 'veil' : 'none', sari: i % 2 === 1 }));
  const hull = () => {
    ctx.beginPath();
    ctx.moveTo(x - 44 * s, y - 13 * s);
    ctx.quadraticCurveTo(x - 36 * s, y - 5 * s, x - 26 * s, y - 5 * s);
    ctx.lineTo(x + 26 * s, y - 5 * s);
    ctx.quadraticCurveTo(x + 36 * s, y - 5 * s, x + 44 * s, y - 13 * s);
    ctx.quadraticCurveTo(x + 36 * s, y + 3 * s, x + 22 * s, y + 3 * s);
    ctx.lineTo(x - 22 * s, y + 3 * s);
    ctx.quadraticCurveTo(x - 36 * s, y + 3 * s, x - 44 * s, y - 13 * s);
    ctx.closePath();
  };
  paintedShape(ctx, rng, hull, { x: x - 44 * s, y: y - 13 * s, w: 88 * s, h: 16 * s }, { base: wood, light: woodL, shade: hz(mix(wood, P.ink, 0.4), o.haze), lightFrom: 'top', dabs: 10 });
  ctx.fillStyle = hz(P.haldi, o.haze);
  ctx.fillRect(x - 26 * s, y - 4 * s, 52 * s, 1.2 * s);
  if (o.rower) {
    const px = x - 30 * s * f, py = y - 5 * s, ps = 0.95 * s;
    person(ctx, px, py, ps, { pose: 'pull', cloth: o.rower.cloth, cloth2: o.rower.cloth2, sari: o.rower.sari, head: o.rower.head ?? (o.rower.sari ? 'bun' : 'none'), facing: f, haze: o.haze, skin: o.rower.skin ?? 0.5 });
    // the long steering oar, held at the side and trailing into the water astern
    const hx = px + 10.4 * ps * f, hy = py - 20.6 * ps;
    const ox = px - 26 * s * f, oy = y + 4 * s;
    taperStroke(ctx, [{ x: hx + 5 * ps * f, y: hy - 6 * ps }, { x: ox, y: oy }], 1.6 * s, hz(mix(P.laterite, P.chandan, 0.2), o.haze), 1, [1, 1]);
    dab(ctx, ox - 1 * s * f, oy + 1 * s, 2.4 * s, 4.6 * s, 0.5 * f, hz(mix(P.laterite, P.chandan, 0.2), o.haze), 1);
  }
  if (o.lamp) diya(ctx, x + 24 * s * f, y - 6 * s, s, 24);
  // little wake
  for (let i = 0; i < 4; i++) taperStroke(ctx, [{ x: x - (34 + i * 9) * s * f, y: y + (2 + i) * s }, { x: x - (44 + i * 10) * s * f, y: y + (2 + i) * s }], 1.2 * s, hz(P.limewhite, o.haze), 0.5 - i * 0.1);
}

/** Stone steps of a ghat seen from across the water. */
export function ghatSteps(ctx: Ctx, x0: number, x1: number, yTop: number, yWater: number, steps: number, stone: string, haze = 0): void {
  const hgt = (yWater - yTop) / steps;
  for (let i = 0; i < steps; i++) {
    const yy = yTop + i * hgt;
    ctx.fillStyle = hz(i % 2 ? stone : mix(stone, P.limewhite, 0.18), haze);
    ctx.fillRect(x0, yy, x1 - x0, hgt);
    ctx.fillStyle = withAlpha(hz(mix(stone, P.ink, 0.45), haze), 0.55);
    ctx.fillRect(x0, yy + hgt - 1, x1 - x0, 1);
  }
}

/** A pot-shaped earthen handi. */
export function handi(ctx: Ctx, x: number, y: number, r: number, colour: string = mix(P.laterite, P.chandan, 0.2)): void {
  dab(ctx, x, y - r, r, r * 0.9, 0, colour, 1);
  dab(ctx, x - r * 0.3, y - r * 1.3, r * 0.35, r * 0.25, 0, mix(colour, P.limewhite, 0.4), 0.6);
  ctx.fillStyle = mix(colour, P.ink, 0.35);
  ctx.fillRect(x - r * 0.5, y - r * 1.95, r, r * 0.25);
}

/** Leaping dolphin; (x, y) = water level at the middle of the leap. */
export function dolphin(ctx: Ctx, x: number, y: number, s: number, f: 1 | -1 = 1, haze = 0): void {
  const body = hz(mix(P.khondalite, P.peacock, 0.35), haze);
  const pts = curvePts(x - 16 * s * f, y, x, y - 14 * s, x + 16 * s * f, y - 2 * s, 10);
  taperStroke(ctx, pts, 7 * s, body, 1, [0.35, 0.15]);
  taperStroke(ctx, curvePts(x - 2 * s * f, y - 11 * s, x + 1 * s * f, y - 16 * s, x + 4 * s * f, y - 12 * s, 4), 3 * s, body, 1, [1, 0.2]);
  dab(ctx, x + 10 * s * f, y - 8 * s, 0.8 * s, 0.8 * s, 0, P.ink, 1);
  for (let i = 0; i < 5; i++) dab(ctx, x - 18 * s * f + i * 2.4 * s * f, y + 0.5 * s, 2 * s, 1 * s, 0, hz(P.limewhite, haze), 0.6);
}

// ---- Act II sky ---------------------------------------------------------------------

const ACT2_SKY: [number, string][] = [[0, mix(P.seafoam, P.skyCream, 0.45)], [0.55, mix(P.skyCream, P.marigold, 0.12)], [1, mix(P.skyCream, P.marigold, 0.3)]];
const WARM_HALFTONE = mix(P.laterite, P.skyCream, 0.45);

/** A woman with an oar on a little boat — the Lingaraja carving, in relief. */
function boatRelief(ctx: Ctx, x: number, y: number, w: number, h: number, stone: string): void {
  const lt = mix(stone, P.limewhite, 0.3), dk = mix(stone, P.ink, 0.35);
  ctx.fillStyle = stone;
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.strokeStyle = dk; ctx.lineWidth = 2;
  ctx.strokeRect(x - w / 2 + 2, y - h + 2, w - 4, h - 4);
  // the carved boat and the oarswoman
  taperStroke(ctx, curvePts(x - w * 0.36, y - h * 0.38, x, y - h * 0.12, x + w * 0.36, y - h * 0.38, 8), h * 0.14, lt, 1, [0.4, 0.4]);
  dab(ctx, x - w * 0.12, y - h * 0.62, h * 0.08, h * 0.09, 0, lt, 1);
  taperStroke(ctx, [{ x: x - w * 0.12, y: y - h * 0.54 }, { x: x - w * 0.1, y: y - h * 0.32 }], h * 0.13, lt, 1, [1, 0.8]);
  taperStroke(ctx, [{ x: x - w * 0.02, y: y - h * 0.7 }, { x: x + w * 0.22, y: y - h * 0.16 }], h * 0.035, lt, 1, [1, 1]);
  dab(ctx, x + w * 0.22, y - h * 0.16, h * 0.04, h * 0.08, 0.5, lt, 1);
  for (let i = 0; i < 3; i++) taperStroke(ctx, [{ x: x - w * 0.4 + i * w * 0.3, y: y - h * 0.14 }, { x: x - w * 0.3 + i * w * 0.3, y: y - h * 0.14 }], 1.2, lt, 0.8);
}

/** Giraffe on a boat: the Konark panel, in relief. */
function giraffeRelief(ctx: Ctx, x: number, y: number, w: number, h: number, stone: string, done: number): void {
  const lt = mix(stone, P.limewhite, 0.32), dk = mix(stone, P.ink, 0.4);
  ctx.fillStyle = stone;
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.strokeStyle = dk; ctx.lineWidth = 2;
  ctx.strokeRect(x - w / 2 + 2, y - h + 2, w - 4, h - 4);
  clipTo(ctx, () => polyPath(ctx, [{ x: x - w / 2, y: y - h }, { x: x - w / 2 + w * done, y: y - h }, { x: x - w / 2 + w * done, y }, { x: x - w / 2, y }]), () => {
    taperStroke(ctx, curvePts(x - w * 0.4, y - h * 0.3, x, y - h * 0.08, x + w * 0.4, y - h * 0.3, 8), h * 0.13, lt, 1, [0.4, 0.4]);
    // giraffe: body, long neck, head, legs standing in the boat
    dab(ctx, x - w * 0.02, y - h * 0.44, w * 0.13, h * 0.08, -0.15, lt, 1);
    taperStroke(ctx, [{ x: x + w * 0.08, y: y - h * 0.48 }, { x: x + w * 0.2, y: y - h * 0.85 }], h * 0.06, lt, 1, [1, 0.7]);
    dab(ctx, x + w * 0.23, y - h * 0.86, w * 0.045, h * 0.035, 0.3, lt, 1);
    for (const k of [-0.1, -0.04, 0.05, 0.09]) taperStroke(ctx, [{ x: x + k * w, y: y - h * 0.4 }, { x: x + k * w, y: y - h * 0.3 }], 1.6, lt, 1, [1, 1]);
    for (let i = 0; i < 5; i++) dab(ctx, x - w * 0.08 + i * w * 0.035, y - h * 0.45 + (i % 2) * 2, 1.2, 1.2, 0, dk, 0.8);
  });
  // chip dust at the unfinished edge
  for (let i = 0; i < 6; i++) dab(ctx, x - w / 2 + w * done + (i % 3) * 2, y - h * (0.2 + i * 0.12), 1.2, 1.2, 0, lt, 0.8);
}

export const SCENES: Record<string, () => SceneDef> = {
  // 11 · 11th century CE · Lingaraja rises over Ekamra — the temple-city skyline.
  r11: () => ({
    id: 'r11',
    sky: { stops: ACT2_SKY, sun: { x: 300, y: 110, r: 34 }, clouds: 'cumulus', halftone: WARM_HALFTONE },
    far: [{ kind: 'hills', a: mix(P.khondalite, P.skyCream, 0.5), b: P.laterite, height: [20, 60], trees: true, haze: 0.5 }],
    ground: { kind: 'land', plain: mix(mix(P.tota, P.haldi, 0.45), P.laterite, 0.22), plainDetail: 'fields', path: mix(P.laterite, P.chandan, 0.3), verge: mix(P.tota, P.laterite, 0.25) },
    mid: (ctx, rng, W) => {
      // Ekamra: groves, then a skyline of a hundred little laterite towers.
      treeRow(ctx, rng.fork('trees'), W, 206, 0.4, 0.25);
      scatter(rng.fork('temples'), W, [150, 260], (x, i) => {
        const h = rng.range(70, 135);
        const haze = rng.range(0.12, 0.3);
        wrapped(W, x, 70, (xx) => {
          if (i % 2) pidhaHall(ctx, rng.fork(x), xx - h * 0.32, 244, h * 0.38, h * 0.42, { stone: mix(P.laterite, P.chandan, 0.15), haze });
          rekhaDeula(ctx, rng.fork(x + 1), xx, 244, h, { stone: i % 3 ? P.laterite : mix(P.laterite, P.khondalite, 0.4), haze, flagColour: i % 3 === 0 ? P.sindoor : undefined });
        });
      });
      scatter(rng.fork('roofs'), W, [60, 120], (x) => wrapped(W, x, 40, (xx) => house(ctx, rng.fork(x), xx, 250, rng.range(34, 50), rng.range(34, 46), { roof: rng.chance(0.6) ? 'tile' : 'thatch', haze: 0.12 })));
      // low laterite compound walls
      ctx.fillStyle = mix(P.laterite, P.chandan, 0.15);
      ctx.fillRect(0, 244, W, 10);
      dabField(ctx, rng, 0, 244, W, 10, { n: 500, r: [1, 3], colours: [mix(P.laterite, P.ink, 0.3), mix(P.laterite, P.chandan, 0.4)], alpha: [0.3, 0.6] });
      bank(ctx, rng.fork('bank'), W, 252, mix(P.tota, P.haldi, 0.35), mix(P.laterite, P.tota, 0.25));
    },
    near: (ctx, rng, W) => {
      // A back row: bel trees, little roadside shrines and distant pilgrims.
      scatter(rng.fork('back'), W, [120, 220], (x, i) => wrapped(W, x, 50, (xx) => {
        if (i % 3 === 0) broadTree(ctx, rng.fork(x), xx, 96, rng.range(50, 70), rng.range(44, 58), 0.15);
        else if (i % 3 === 1) rekhaDeula(ctx, rng.fork(x), xx, 96, rng.range(30, 44), { stone: P.laterite, haze: 0.12 });
        else crowd(ctx, rng.fork(x), xx - 20, xx + 20, 96, 0.75, { poses: ['walk', 'carry'], facing: rng.chance(0.5) ? 1 : -1, density: 1.4, haze: 0.12 });
      }));
      // Flower sellers on the temple road: garlands, lotuses, bel leaves.
      scatter(rng.fork('stalls'), W, [300, 460], (x, i) => wrapped(W, x, 90, (xx) => {
        stall(ctx, xx, 128, 66, 46, i % 2 ? [P.marigold, P.laterite] : [P.haldi, P.tota]);
        garland(ctx, xx - 30, 92, xx + 30, 92, 6, 2);
        person(ctx, xx - 44, 130, 1.15, { pose: 'sit', cloth: P.marigold, sari: true, head: 'veil', skin: rng.next() });
        for (let k = 0; k < 3; k++) dab(ctx, xx - 52 + k * 7, 128, 4, 2.6, 0, rng.pick([P.marigold, P.haldi, P.rani]), 1);
        crowd(ctx, rng.fork(x), xx + 40, xx + 84, 132, 1.15, { density: 2.2, poses: ['walk', 'carry', 'stand'] });
      }));
      wrapped(W, 980, 60, (xx) => { bullockCartBg(ctx, rng.fork('cart'), xx, 132, 1.25); person(ctx, xx + 68, 132, 1.2, { pose: 'walk', cloth: P.limewhite, cloth2: P.laterite, head: 'turban' }); });
      wrapped(W, 1700, 40, (xx) => { cow(ctx, xx, 132, 1.1, { grazing: true }); crow(ctx, xx + 4, 112, 0.9); });
    },
    fore: 'flowers',
    sign: { date: '11th century CE', title: 'Lingaraja' },
    landmarks: [
      {
        // Bindu Sagar: bathers on the ghat, the little water pavilion, and a woman
        // steering her boat with an oar — just like the carving on the temple.
        at: 0.24, plane: 'mid', w: 720, h: 190,
        paint: (ctx, rng, w, h) => {
          for (let i = 0; i < 6; i++) broadTree(ctx, rng.fork(i), 40 + i * 128, h - 70, rng.range(80, 110), rng.range(70, 95), 0.25);
          ghatSteps(ctx, 14, w - 14, h - 82, h - 46, 6, mix(P.laterite, P.chandan, 0.25));
          waterPatch(ctx, rng, 10, h - 46, w - 20, 46, { light: mix(P.seafoam, P.skyCream, 0.3), mid: mix(P.peacock, P.seafoam, 0.4), deep: mix(P.peacock, P.neel, 0.25) }, 70);
          // the island pavilion
          ctx.fillStyle = mix(P.laterite, P.ink, 0.2);
          ctx.fillRect(w * 0.55 - 34, h - 38, 68, 10);
          pidhaHall(ctx, rng.fork('pav'), w * 0.55, h - 38, 46, 56, { stone: mix(P.laterite, P.chandan, 0.25) });
          // bathers
          person(ctx, 90, h - 72, 1.05, { pose: 'carry', cloth: P.marigold, sari: true, head: 'veil', skin: 0.4 });
          person(ctx, 140, h - 58, 1.05, { pose: 'armsUp', cloth: P.limewhite, cloth2: P.laterite, skin: 0.6 });
          person(ctx, 520, h - 64, 1.0, { pose: 'bend', cloth: P.rani, sari: true, head: 'bun', skin: 0.3, facing: -1 });
          person(ctx, 640, h - 76, 1.0, { pose: 'stand', cloth: P.haldi, sari: true, head: 'veil', skin: 0.5, facing: -1 });
          for (const [bx, by] of [[200, h - 36], [250, h - 30]] as const) {
            clipTo(ctx, () => polyPath(ctx, [{ x: bx - 20, y: by - 40 }, { x: bx + 20, y: by - 40 }, { x: bx + 20, y: by - 13 }, { x: bx - 20, y: by - 13 }]), () => person(ctx, bx, by, 1, { pose: 'armsUp', cloth: P.limewhite, skin: rng.next() }));
            taperStroke(ctx, [{ x: bx - 10, y: by - 13 }, { x: bx + 10, y: by - 13 }], 2, P.limewhite, 0.7);
          }
          for (let i = 0; i < 7; i++) lotusPad(ctx, rng.fork(`lp${i}`), 300 + i * 50 + rng.range(-10, 10), h - 8 - rng.range(0, 10), rng.range(8, 13), 0.15);
          lotusFlower(ctx, 360, h - 14, 6);
          countryBoat(ctx, rng.fork('boat'), w * 0.32, h - 16, 1.45, { rower: { cloth: P.sindoor, cloth2: P.haldi, sari: true, skin: 0.55 }, seated: [P.limewhite], facing: 1 });
          egret(ctx, w - 70, h - 46, 0.9);
        },
      },
      {
        // Lingaraja: offering hall, dance hall, porch and tower in a line, each a different height.
        at: 0.5, plane: 'mid', w: 640, h: 300,
        paint: (ctx, rng, w, h) => {
          const by = h - 16;
          for (const [dx, sh] of [[-250, 70], [-210, 54], [190, 84], [236, 62], [270, 50]] as const) rekhaDeula(ctx, rng.fork(dx), w / 2 + dx, by - 4, sh, { stone: mix(P.laterite, P.chandan, 0.1), haze: 0.1 });
          templeLine(ctx, rng.fork('line'), w / 2 - 10, by, 0.95);
          // compound wall with the eastern gateway
          const wall = mix(P.laterite, P.chandan, 0.12);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 16, y: h }, { x: 16, y: by - 18 }, { x: w - 16, y: by - 18 }, { x: w - 16, y: h }]), { x: 16, y: by - 18, w: w - 32, h: h - by + 18 }, { base: wall, light: mix(wall, P.limewhite, 0.3), shade: mix(wall, P.ink, 0.35), lightFrom: 'top', dabs: 220 });
          for (let x = 22; x < w - 22; x += 14) dab(ctx, x, by - 19, 5, 3, 0, mix(wall, P.limewhite, 0.25), 1);
          pidhaHall(ctx, rng.fork('gate'), w / 2 - 190, h - 2, 52, 64, { stone: wall });
          crowd(ctx, rng.fork('pilgrims'), w / 2 - 150, w / 2 + 40, h - 1, 0.62, { poses: ['walk', 'carry'], facing: -1, density: 1.6 });
        },
      },
      {
        // A pilgrim's palm-leaf umbrella takes off in the wind.
        at: 0.68, plane: 'near', w: 320, h: 190, y: 572,
        paint: (ctx, rng, _w, h) => {
          softShadow(ctx, 100, h - 2, 90, 6, P.ink, 0.2);
          person(ctx, 96, h - 2, 1.6, { pose: 'armsUp', cloth: P.limewhite, cloth2: P.laterite, head: 'turban', skin: 0.5 });
          person(ctx, 40, h - 2, 1.15, { pose: 'point', cloth: P.marigold, skin: 0.3 });
          person(ctx, 150, h - 2, 1.45, { pose: 'stand', cloth: P.rani, cloth2: P.haldi, sari: true, head: 'veil', facing: -1, skin: 0.7 });
          // the palm-leaf umbrella, turned inside out and tumbling up and away
          ctx.save();
          ctx.translate(236, 60);
          ctx.rotate(2.6);
          const leaf = mix(P.haldi, P.laterite, 0.3);
          ctx.fillStyle = leaf;
          ctx.beginPath(); ctx.ellipse(0, 0, 40, 18, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
          for (let i = 0; i <= 10; i++) {
            const a = Math.PI + (i / 10) * Math.PI;
            taperStroke(ctx, [{ x: 0, y: -1 }, { x: Math.cos(a) * 40, y: Math.sin(a) * 18 }], 1.4, mix(leaf, P.ink, 0.35), 0.8, [1, 1]);
          }
          for (let i = 0; i < 12; i++) dab(ctx, -38 + i * 7, 0, 3.4, 2.4, 0, i % 2 ? mix(leaf, P.haldi, 0.4) : mix(leaf, P.laterite, 0.3), 1);
          taperStroke(ctx, [{ x: 0, y: -4 }, { x: 0, y: 46 }], 2.6, mix(P.laterite, P.ink, 0.3), 1, [1, 1]);
          ctx.restore();
          // wind lines and flying petals
          for (let i = 0; i < 5; i++) taperStroke(ctx, curvePts(110 + i * 14, 100 - i * 12, 170, 74 - i * 12, 236 + i * 10, 84 - i * 10, 8), 2, P.limewhite, 0.65);
          for (let i = 0; i < 12; i++) dab(ctx, 150 + rng.range(0, 160), rng.range(30, 130), 3, 1.8, rng.next() * 3, rng.pick([P.marigold, P.haldi, P.rani]), 1);
        },
      },
      {
        // A sculptor carves the boatwoman panel — while the boatwoman herself looks on.
        at: 0.86, plane: 'mid', w: 280, h: 130,
        paint: (ctx, rng, w, h) => {
          broadTree(ctx, rng, 220, h - 4, 110, 100, 0.1);
          const stone = mix(P.khondalite, P.chandan, 0.25);
          ctx.fillStyle = mix(stone, P.ink, 0.25);
          ctx.fillRect(w / 2 - 48, h - 16, 96, 16);
          boatRelief(ctx, w / 2, h - 16, 86, 56, stone);
          person(ctx, w / 2 - 70, h - 2, 1.15, { pose: 'adze', cloth: P.limewhite, cloth2: P.laterite, head: 'turban', skin: 0.6, phase: 1.2 });
          person(ctx, w / 2 + 78, h - 2, 1.2, { pose: 'stand', cloth: P.sindoor, cloth2: P.haldi, sari: true, head: 'bun', facing: -1, skin: 0.45 });
          taperStroke(ctx, [{ x: w / 2 + 90, y: h - 52 }, { x: w / 2 + 96, y: h - 2 }], 2, mix(P.laterite, P.chandan, 0.2), 1, [1, 1]);
          dab(ctx, w / 2 + 96, h - 6, 2.6, 6, 0.1, mix(P.laterite, P.chandan, 0.2), 1);
          for (let i = 0; i < 10; i++) dab(ctx, w / 2 - 54 + rng.range(-8, 8), h - 2 - rng.range(0, 3), 1.4, 1, 0, mix(stone, P.limewhite, 0.4), 1);
        },
      },
    ],
  }),

  // 12 · 11th century CE · Ships that carried elephants — the open Sea of Kalinga.
  r12: () => ({
    id: 'r12',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.35)], [0.55, mix(P.skyCream, P.marigold, 0.18)], [1, mix(P.marigold, P.laterite, 0.25)]], sun: { x: 980, y: 150, r: 38, colour: P.haldi }, clouds: 'cumulus', cloudTint: P.marigold, halftone: WARM_HALFTONE },
    far: [],
    ground: { kind: 'sea', water: { sky: mix(P.marigold, P.seafoam, 0.55), light: mix(P.seafoam, P.peacock, 0.3), mid: P.peacock, deep: mix(P.peacock, P.neel, 0.45) } },
    mid: (ctx, rng, W) => {
      // A trading fleet strung along the horizon, laterite hulls and tan sails.
      scatter(rng.fork('fleet'), W, [260, 420], (x, i) => wrapped(W, x, 50, (xx) => boitaShip(ctx, rng.fork(x), xx, 236 + (i % 2) * 5, rng.range(0.3, 0.42), {
        haze: 0.35, sail: i % 3 ? mix(P.chandan, P.laterite, 0.25) : P.limewhite, sail2: P.laterite, cargo: i % 2 ? 'elephant' : 'bales',
      })));
      for (let i = 0; i < 26; i++) {
        const x = rng.next() * W, y = rng.range(30, 150);
        wrapped(W, x, 10, (xx) => taperStroke(ctx, curvePts(xx - 6, y, xx - 2, y - 3, xx, y, 4).concat(curvePts(xx, y, xx + 2, y - 3, xx + 6, y, 4)), 1.4, mix(P.khondalite, P.ink, 0.2), 0.7));
      }
    },
    near: (ctx, rng, W) => {
      // flying fish skipping over the swell, and a bobbing coconut or two
      scatter(rng.fork('fish'), W, [380, 640], (x) => wrapped(W, x, 60, (xx) => {
        for (let k = 0; k < 4; k++) {
          const fx = xx + k * 18, fy = 70 - k * 6;
          taperStroke(ctx, curvePts(fx - 30, fy + 22, fx - 16, fy - 4, fx, fy, 6), 1, P.limewhite, 0.45);
          dab(ctx, fx, fy, 4, 1.4, -0.3, mix(P.seafoam, P.limewhite, 0.4), 1);
          ctx.fillStyle = withAlpha(P.limewhite, 0.85);
          ctx.beginPath(); ctx.moveTo(fx - 1, fy); ctx.lineTo(fx - 5, fy - 5); ctx.lineTo(fx + 2, fy - 1); ctx.closePath(); ctx.fill();
        }
      }));
      scatter(rng.fork('nut'), W, [700, 1000], (x) => wrapped(W, x, 10, (xx) => { dab(ctx, xx, 104, 4, 3.4, 0, mix(P.laterite, P.ink, 0.25), 1); taperStroke(ctx, [{ x: xx - 8, y: 107 }, { x: xx + 8, y: 107 }], 1, P.limewhite, 0.6); }));
    },
    fore: 'none',
    sign: { date: '11th century CE', title: 'The Sea of Kalinga' },
    landmarks: [
      {
        // An elephant on deck showers the crew with its trunk.
        at: 0.24, plane: 'mid', w: 300, h: 200, y: 452,
        paint: (ctx, rng, w, h) => {
          const wl = h - 10;
          boitaShip(ctx, rng, w / 2, wl, 1.35, { sail: mix(P.chandan, P.laterite, 0.2), sail2: P.laterite, cargo: 'none' });
          elephant(ctx, w / 2 - 6, wl - 16, 0.55, { trunkUp: true, caparison: [P.sindoor, P.haldi] });
          // a fountain from the trunk
          const tx = w / 2 - 6 + 58 * 0.55, ty = wl - 16 - 64 * 0.55;
          for (let i = 0; i < 16; i++) {
            const t = i / 15;
            const sx = tx + t * 46, sy = ty - Math.sin(t * Math.PI) * 26 + t * 18;
            dab(ctx, sx + rng.range(-2, 2), sy + rng.range(-2, 2), 2.2, 1.6, 0, rng.pick([P.seafoam, P.limewhite]), 0.85);
          }
          person(ctx, tx + 50, wl - 16, 0.85, { pose: 'armsUp', cloth: P.limewhite, cloth2: P.laterite, head: 'turban', facing: -1, skin: 0.6 });
          person(ctx, w / 2 - 66, wl - 16, 0.8, { pose: 'point', cloth: P.marigold, facing: 1, skin: 0.4 });
          for (let i = 0; i < 6; i++) taperStroke(ctx, [{ x: w / 2 + 60 + i * 6, y: wl + 2 + i }, { x: w / 2 + 74 + i * 8, y: wl + 3 + i }], 1.6, P.limewhite, 0.7 - i * 0.08);
        },
      },
      {
        // Dolphins far off, keeping the fleet company.
        at: 0.5, plane: 'mid', w: 260, h: 60, y: 446,
        paint: (ctx, _rng, _w, h) => {
          dolphin(ctx, 60, h - 6, 0.9, 1, 0.2);
          dolphin(ctx, 120, h - 10, 1.1, 1, 0.15);
          dolphin(ctx, 200, h - 4, 0.8, 1, 0.25);
        },
      },
      {
        // Heavy cargo: the elephant's end sits low, so the whole crew crowds the prow,
        // one sailor coaxing it forward with a banana.
        at: 0.78, plane: 'mid', w: 340, h: 220, y: 452,
        paint: (ctx, rng, w, h) => {
          const wl = h - 14;
          ctx.save();
          ctx.translate(w / 2, wl);
          ctx.rotate(-0.07);
          ctx.translate(-w / 2, -wl);
          boitaShip(ctx, rng, w / 2, wl, 1.4, { sail: P.limewhite, sail2: P.laterite, cargo: 'none' });
          elephant(ctx, w / 2 - 40, wl - 16, 0.6, { caparison: [P.haldi, P.sindoor], phase: 1 });
          crowd(ctx, rng.fork('crew'), w / 2 + 34, w / 2 + 78, wl - 16, 0.8, { poses: ['point', 'wave', 'stand'], facing: -1, cloths: [P.limewhite, P.laterite, P.marigold], density: 1.2 });
          person(ctx, w / 2 + 10, wl - 16, 0.82, { pose: 'serve', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', facing: -1, skin: 0.5 });
          dab(ctx, w / 2 + 3, wl - 25, 3.6, 1.4, 0.5, P.haldi, 1);
          ctx.restore();
          for (let i = 0; i < 8; i++) taperStroke(ctx, [{ x: w / 2 - 90 + i * 3, y: wl + 6 }, { x: w / 2 - 110 - i * 6, y: wl + 8 + i * 0.6 }], 1.6, P.limewhite, 0.6);
        },
      },
    ],
  }),

  // 13 · Tradition · Where the goddess dwells — three shrines across one long land.
  r13: () => ({
    id: 'r13',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.5)], [0.6, mix(P.skyCream, P.marigold, 0.2)], [1, mix(P.marigold, P.skyCream, 0.45)]], sun: { x: 860, y: 230, r: 30, colour: P.marigold }, clouds: 'streak', cloudTint: mix(P.limewhite, P.marigold, 0.2), halftone: WARM_HALFTONE },
    far: [
      { kind: 'hills', a: mix(P.khondalite, P.skyCream, 0.55), b: P.neel, height: [40, 104], haze: 0.55 },
      { kind: 'hills', a: mix(P.tota, P.khondalite, 0.45), b: P.laterite, height: [14, 44], trees: true, haze: 0.35 },
    ],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.3), plainDetail: 'fields', path: mix(P.laterite, P.chandan, 0.25), verge: mix(P.tota, P.laterite, 0.2) },
    mid: (ctx, rng, W) => {
      // Paddy and palms by the river; little roadside red flags in the wind.
      scatter(rng.fork('palms'), W, [180, 360], (x) => wrapped(W, x, 70, (xx) => (rng.chance(0.5) ? palmyraPalm(ctx, rng.fork(x), xx, 238, rng.range(110, 150), 0.25) : coconutPalm(ctx, rng.fork(x), xx, 238, rng.range(110, 150), rng.range(-0.1, 0.1), 0.25))));
      scatter(rng.fork('groves'), W, [240, 420], (x) => wrapped(W, x, 70, (xx) => broadTree(ctx, rng.fork(x), xx, 240, rng.range(80, 120), rng.range(60, 86), 0.3)));
      scatter(rng.fork('huts'), W, [380, 620], (x) => wrapped(W, x, 60, (xx) => {
        house(ctx, rng.fork(x), xx, 242, 40, 36, { roof: 'thatch', haze: 0.18 });
        house(ctx, rng.fork(x + 1), xx + 40, 242, 34, 30, { roof: 'thatch', haze: 0.22 });
      }));
      scatter(rng.fork('flags'), W, [220, 400], (x) => wrapped(W, x, 20, (xx) => flag(ctx, xx, 244, 40, P.sindoor, 0.05, rng.range(-2, 2))));
      bank(ctx, rng.fork('bank'), W, 244, mix(P.tota, P.haldi, 0.35), mix(P.laterite, P.tota, 0.3));
      ctx.fillStyle = mix(P.peacock, P.seafoam, 0.45);
      ctx.fillRect(0, 251, W, 9);
      for (let i = 0; i < 160; i++) { const x = rng.next() * W; wrapped(W, x, 10, (xx) => taperStroke(ctx, [{ x: xx - 7, y: 254 + rng.next() * 4 }, { x: xx + 7, y: 254 + rng.next() * 4 }], 1, P.limewhite, 0.5)); }
    },
    near: (ctx, rng, W) => {
      // Sparse: pilgrims walking with offerings, a cart, a red-ribboned tree.
      scatter(rng.fork('pilgrims'), W, [360, 560], (x) => wrapped(W, x, 40, (xx) => crowd(ctx, rng.fork(x), xx - 20, xx + 20, 132, 1.15, { poses: ['walk', 'carry'], facing: 1, density: 1.3, cloths: [P.limewhite, P.sindoor, P.marigold, P.haldi] })));
      wrapped(W, 1180, 60, (xx) => bullockCartBg(ctx, rng.fork('cart'), xx, 132, 1.2));
      wrapped(W, 620, 60, (xx) => {
        broadTree(ctx, rng.fork('tree'), xx, 130, 90, 92, 0.05);
        for (let k = 0; k < 7; k++) taperStroke(ctx, [{ x: xx - 30 + k * 10, y: 70 + (k % 3) * 6 }, { x: xx - 28 + k * 10, y: 88 + (k % 3) * 6 }], 2.4, P.sindoor, 1, [1, 0.4]);
      });
    },
    fore: 'grass',
    sign: { date: 'Tradition', title: 'Shakti Peethas' },
    landmarks: [
      {
        // Biraja at Jajpur, on the Baitarani — a bakul tree hung with red cloth.
        at: 0.18, plane: 'mid', w: 520, h: 270,
        paint: (ctx, rng, w, h) => {
          const by = h - 34;
          pidhaHall(ctx, rng.fork('hall'), w / 2 - 58, by, 70, 84, { stone: P.laterite, haze: 0.06 });
          rekhaDeula(ctx, rng.fork('tower'), w / 2 + 14, by, 170, { stone: P.laterite, haze: 0.06, flagColour: P.sindoor });
          // the bakul tree
          const tx = w / 2 + 150;
          taperStroke(ctx, curvePts(tx, by, tx - 6, by - 50, tx + 4, by - 90, 8), 14, mix(P.laterite, P.ink, 0.35), 1, [1, 0.5]);
          broadTree(ctx, rng.fork('bakul'), tx, by - 46, 150, 130, 0);
          for (let k = 0; k < 12; k++) {
            const cx = tx - 54 + k * 10 + rng.range(-3, 3), cy = by - 70 + rng.range(-16, 18);
            taperStroke(ctx, [{ x: cx, y: cy }, { x: cx + rng.range(-3, 3), y: cy + rng.range(16, 26) }], 2.6, k % 4 ? P.sindoor : P.haldi, 1, [1, 0.4]);
          }
          flag(ctx, w / 2 - 110, by, 56, P.sindoor, 0, 2);
          flag(ctx, w / 2 - 128, by, 44, P.haldi, 0, -1);
          // a woman ties a thread; the river steps below
          person(ctx, tx - 30, by, 1.0, { pose: 'paint', cloth: P.sindoor, cloth2: P.haldi, sari: true, head: 'veil', facing: 1, skin: 0.5 });
          ghatSteps(ctx, 30, w - 30, by, by + 18, 3, mix(P.laterite, P.chandan, 0.3));
          waterPatch(ctx, rng, 20, by + 18, w - 40, 16, { light: mix(P.seafoam, P.skyCream, 0.3), mid: mix(P.peacock, P.seafoam, 0.45), deep: mix(P.peacock, P.neel, 0.2) }, 30);
          person(ctx, 90, by + 12, 0.9, { pose: 'bend', cloth: P.limewhite, cloth2: P.laterite, skin: 0.6 });
        },
      },
      {
        // A long day's walk on: Vimala inside the Puri temple complex, seen from afar.
        at: 0.5, plane: 'mid', w: 480, h: 230,
        paint: (ctx, rng, w, h) => {
          const by = h - 18;
          jagannathTemple(ctx, rng.fork('jt'), w / 2 + 10, by, 0.66, 0.32);
          rekhaDeula(ctx, rng.fork('vimala'), w / 2 - 120, by, 92, { stone: P.limewhite, haze: 0.22, flagColour: P.sindoor });
          pacheri(ctx, rng.fork('wall'), 30, w - 30, h, 26, 0.18);
          flag(ctx, 50, h - 26, 46, P.sindoor, 0.1, 2);
          flag(ctx, w - 50, h - 26, 46, P.sindoor, 0.1, -2);
        },
      },
      {
        // Pilgrims share a meal on banana leaves under a banyan; a crow waits its turn.
        at: 0.36, plane: 'near', w: 300, h: 150, y: 566,
        paint: (ctx, rng, w, h) => {
          broadTree(ctx, rng, w / 2, h - 30, 220, 120, 0);
          taperStroke(ctx, [{ x: w / 2, y: h - 2 }, { x: w / 2 + 2, y: h - 60 }], 16, mix(P.laterite, P.ink, 0.35), 1, [1, 0.6]);
          for (let k = 0; k < 5; k++) taperStroke(ctx, [{ x: w / 2 - 80 + k * 40, y: h - 64 }, { x: w / 2 - 80 + k * 40 + 2, y: h - 8 }], 1.4, mix(P.laterite, P.ink, 0.3), 0.6, [1, 1]);
          person(ctx, 80, h - 4, 1.1, { pose: 'sit', cloth: P.marigold, sari: true, head: 'veil', skin: 0.4 });
          person(ctx, 128, h - 4, 1.1, { pose: 'sit', cloth: P.limewhite, cloth2: P.laterite, head: 'turban', skin: 0.6 });
          person(ctx, 222, h - 4, 1.0, { pose: 'sit', cloth: P.tota, skin: 0.3, facing: -1 });
          for (const lx of [104, 168, 200]) { dab(ctx, lx, h - 3, 13, 3, 0, P.tota, 1); dab(ctx, lx, h - 5, 5, 2.6, 0, P.limewhite, 1); }
          crow(ctx, 258, h - 2, 1.1, -1);
        },
      },
      {
        // Tara Tarini on its hill above the river, flags all the way up the steps.
        at: 0.82, plane: 'mid', w: 600, h: 280,
        paint: (ctx, rng, w, h) => {
          const hill = () => {
            ctx.beginPath();
            ctx.moveTo(10, h - 20);
            ctx.bezierCurveTo(120, h - 120, 210, h - 190, w / 2, h - 200);
            ctx.bezierCurveTo(w / 2 + 110, h - 196, w - 140, h - 100, w - 10, h - 20);
            ctx.closePath();
          };
          paintedShape(ctx, rng, hill, { x: 10, y: h - 200, w: w - 20, h: 180 }, { base: mix(P.tota, P.khondalite, 0.35), light: mix(P.tota, P.haldi, 0.35), shade: mix(P.tota, P.neel, 0.4), lightFrom: 'right', dabs: 400 });
          clipTo(ctx, hill, () => { for (let i = 0; i < 70; i++) dab(ctx, rng.range(20, w - 20), rng.range(h - 190, h - 20), rng.range(6, 12), rng.range(4, 8), 0, mix(P.tota, rng.chance(0.5) ? P.neel : P.haldi, 0.3), 0.8); });
          // the steps winding up, with tiny pilgrims and flags
          const steps = [{ x: 90, y: h - 26 }, { x: 170, y: h - 70 }, { x: 140, y: h - 110 }, { x: 230, y: h - 150 }, { x: w / 2 - 20, y: h - 196 }];
          for (let i = 0; i < steps.length - 1; i++) taperStroke(ctx, [steps[i], steps[i + 1]], 6, mix(P.limewhite, P.chandan, 0.25), 1, [1, 1]);
          steps.forEach((p, i) => { if (i) flag(ctx, p.x + 6, p.y, 22, P.sindoor, 0, (i % 2) * 2 - 1); });
          for (let i = 0; i < 3; i++) person(ctx, 120 + i * 36, h - 46 - i * 36, 0.55, { pose: 'walk', cloth: rng.pick([P.sindoor, P.marigold, P.limewhite]), sari: i === 1, head: i === 1 ? 'veil' : 'none', skin: rng.next() });
          // the shrine on the crown of the hill
          const sx = w / 2 + 10, sy = h - 196;
          pidhaHall(ctx, rng.fork('mand'), sx - 30, sy, 40, 44, { stone: mix(P.limewhite, P.chandan, 0.2) });
          rekhaDeula(ctx, rng.fork('tt'), sx + 12, sy, 70, { stone: mix(P.limewhite, P.chandan, 0.2), flagColour: P.sindoor });
          for (let i = 0; i < 6; i++) flag(ctx, sx - 60 + i * 24, sy + 2, 28 + (i % 2) * 8, P.sindoor, 0, (i % 2) * 3 - 1.5);
          // the river at the foot of the hill
          waterPatch(ctx, rng, 0, h - 22, w, 22, { light: mix(P.seafoam, P.skyCream, 0.35), mid: mix(P.peacock, P.seafoam, 0.4), deep: mix(P.peacock, P.neel, 0.2) }, 40);
          countryBoat(ctx, rng.fork('boat'), w - 140, h - 8, 0.8, { rower: { cloth: P.limewhite, cloth2: P.laterite, skin: 0.6 }, seated: [P.sindoor, P.haldi], facing: -1 });
        },
      },
    ],
  }),

  // 14 · 12th century CE · Puri — the White Pagoda, the daily flag, and the sea beyond.
  r14: () => ({
    id: 'r14',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.3)], [0.6, mix(P.skyCream, P.limewhite, 0.3)], [1, mix(P.skyCream, P.marigold, 0.2)]], sun: { x: 1060, y: 96, r: 34 }, clouds: 'cumulus', halftone: WARM_HALFTONE },
    far: [{ kind: 'sea', a: mix(P.peacock, P.seafoam, 0.45), b: P.peacock }],
    ground: { kind: 'land', plain: mix(P.chandan, P.limewhite, 0.45), plainDetail: 'sand', path: mix(P.laterite, P.chandan, 0.35), verge: mix(P.tota, P.laterite, 0.3) },
    mid: (ctx, rng, W) => {
      // Puri town: palms over lime-washed mathas and laterite houses.
      scatter(rng.fork('palms'), W, [90, 200], (x) => wrapped(W, x, 70, (xx) => coconutPalm(ctx, rng.fork(x), xx, 236, rng.range(110, 160), rng.range(-0.14, 0.14), 0.2)));
      scatter(rng.fork('mathas'), W, [70, 120], (x, i) => wrapped(W, x, 50, (xx) => house(ctx, rng.fork(x), xx, 248, rng.range(44, 66), rng.range(36, 54), {
        roof: i % 3 === 0 ? 'tile' : 'flat', wall: i % 2 ? P.limewhite : mix(P.laterite, P.chandan, 0.3), haze: 0.1, door: i % 2 ? P.laterite : mix(P.peacock, P.ink, 0.2),
      })));
      scatter(rng.fork('flags'), W, [260, 420], (x) => wrapped(W, x, 20, (xx) => flag(ctx, xx, 214, 30, rng.pick([P.sindoor, P.haldi]), 0.1, 1)));
      bank(ctx, rng.fork('bank'), W, 250, mix(P.chandan, P.limewhite, 0.4), mix(P.laterite, P.chandan, 0.35));
    },
    near: (ctx, rng, W) => {
      // Bada Danda: the broad road, pilgrims, umbrellas, sweet-stalls.
      scatter(rng.fork('stalls'), W, [340, 520], (x, i) => wrapped(W, x, 90, (xx) => {
        stall(ctx, xx, 128, 64, 44, i % 2 ? [P.laterite, P.limewhite] : [P.marigold, P.laterite]);
        crowd(ctx, rng.fork(x), xx + 40, xx + 110, 132, 1.15, { poses: ['walk', 'carry', 'stand', 'wave'], density: 1.8 });
        chhati(ctx, xx + 74, 80, 16, [P.sindoor, P.haldi, P.tota, P.limewhite]);
      }));
      wrapped(W, 1500, 60, (xx) => { bullockCartBg(ctx, rng.fork('cart'), xx, 132, 1.2); goat(ctx, xx - 60, 132, 1.1, 1); });
    },
    fore: 'grass',
    sign: { date: '12th century CE', title: 'Puri' },
    landmarks: [
      {
        // Mahaprasad: a cook carries a tower of earthen pots on a shoulder pole.
        at: 0.24, plane: 'mid', w: 240, h: 120,
        paint: (ctx, _rng, w, h) => {
          const x = w / 2, y = h - 2, s = 1.25;
          person(ctx, x, y, s, { pose: 'stand', cloth: P.limewhite, cloth2: P.laterite, skin: 0.6 });
          const sy = y - 28 * s;
          taperStroke(ctx, curvePts(x - 42, sy + 4, x, sy - 4, x + 42, sy + 4, 6), 2.4, mix(P.laterite, P.chandan, 0.2), 1, [1, 1]);
          for (const k of [-1, 1]) {
            const px = x + k * 40;
            taperStroke(ctx, [{ x: px, y: sy + 4 }, { x: px, y: sy + 16 }], 0.8, P.ink, 0.8, [1, 1]);
            for (let i = 0; i < 4; i++) handi(ctx, px, sy + 40 - i * 9, 6 - i * 0.6);
          }
          // the seven-pot stack on its hearth, steam curling from the top
          const hx = 30;
          ctx.fillStyle = mix(P.laterite, P.ink, 0.3);
          ctx.fillRect(hx - 12, h - 12, 24, 10);
          glow(ctx, hx, h - 8, 12, P.marigold, 0.6);
          for (let i = 0; i < 7; i++) handi(ctx, hx, h - 12 - i * 8, 7 - i * 0.5);
          taperStroke(ctx, curvePts(hx, h - 74, hx + 8, h - 86, hx - 2, h - 100, 6), 3, P.limewhite, 0.5);
        },
      },
      {
        // The lime-white temple behind the Meghanada Pacheri, Singhadwara and lions in front —
        // and a tiny flag-changer climbing the tower with the new flag, as every day.
        at: 0.5, plane: 'mid', w: 760, h: 310,
        paint: (ctx, rng, w, h) => {
          const by = h - 24, s = 0.92, tx = w / 2 + 40;
          jagannathTemple(ctx, rng.fork('jt'), tx, by, s);
          // flag-changer near the crown of the tower, a bundle of flags on his back
          const dh = 250 * s, dx = tx + 50 * s, top = by - dh * 0.86;
          const cx = dx + dh * 0.42 * 0.2, cy = top + dh * 0.04;
          person(ctx, cx, cy, 0.42, { pose: 'armsUp', cloth: P.limewhite, cloth2: P.sindoor, facing: -1, skin: 0.7 });
          taperStroke(ctx, curvePts(cx + 2, cy - 10, cx + 12, cy - 4, cx + 18, cy + 8, 5), 3, P.sindoor, 1, [0.5, 0.2]);
          taperStroke(ctx, curvePts(cx + 2, cy - 8, cx + 10, cy, cx + 14, cy + 10, 5), 2, P.haldi, 1, [0.5, 0.2]);
          pacheri(ctx, rng.fork('wall'), 20, w - 20, h, 40);
          singhadwara(ctx, rng.fork('gate'), w / 2 - 170, h, 0.9);
          crowd(ctx, rng.fork('pil'), w / 2 - 250, w / 2 - 100, h, 0.66, { poses: ['walk', 'stand', 'armsUp'], density: 1.4, facing: 1 });
          crowd(ctx, rng.fork('pil2'), w / 2 + 40, w / 2 + 240, h, 0.6, { poses: ['walk', 'carry'], density: 1.6, facing: -1 });
        },
      },
      {
        // A cow lies down in the middle of Bada Danda; everyone walks around her,
        // and a boy brings her a banana leaf.
        at: 0.76, plane: 'near', w: 300, h: 120, y: 568,
        paint: (ctx, rng, w, h) => {
          ctx.save();
          ctx.translate(w / 2, h - 2);
          ctx.scale(1, 0.72);
          cow(ctx, 0, 0, 1.4, { colour: P.limewhite });
          ctx.restore();
          softShadow(ctx, w / 2, h - 2, 34, 4, P.ink, 0.25);
          person(ctx, w / 2 + 46, h - 2, 0.95, { pose: 'serve', cloth: P.marigold, facing: -1, skin: 0.4 });
          dab(ctx, w / 2 + 37, h - 13, 8, 2.4, 0.2, P.tota, 1);
          crowd(ctx, rng, 20, 80, h - 2, 1.1, { poses: ['walk'], facing: 1, density: 1.6 });
          crowd(ctx, rng.fork('b'), w - 70, w - 20, h - 2, 1.1, { poses: ['walk', 'carry'], facing: -1, density: 1.6 });
        },
      },
    ],
  }),

  // 15 · c. 1250 CE · Konark — Surya's chariot in dark stone at sunrise by the sea.
  r15: () => ({
    id: 'r15',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.4)], [0.5, mix(P.skyCream, P.marigold, 0.3)], [1, mix(P.marigold, P.sindoor, 0.15)]], sun: { x: 1000, y: 300, r: 44, colour: P.haldi, rays: true }, clouds: 'streak', cloudTint: mix(P.limewhite, P.marigold, 0.3), halftone: WARM_HALFTONE },
    far: [{ kind: 'sea', a: mix(P.peacock, P.seafoam, 0.35), b: mix(P.peacock, P.neel, 0.15) }],
    ground: { kind: 'land', plain: mix(P.chandan, P.haldi, 0.25), plainDetail: 'sand', path: mix(P.chandan, P.laterite, 0.35), verge: mix(P.chandan, P.tota, 0.35) },
    mid: (ctx, rng, W) => {
      // Dunes and palms along the shore; fishermen's huts and boats drawn up on the sand.
      scatter(rng.fork('palms'), W, [140, 300], (x) => wrapped(W, x, 70, (xx) => coconutPalm(ctx, rng.fork(x), xx, 244, rng.range(100, 150), rng.range(-0.2, 0.05), 0.2)));
      scatter(rng.fork('huts'), W, [300, 520], (x) => wrapped(W, x, 60, (xx) => {
        house(ctx, rng.fork(x), xx, 248, 40, 34, { roof: 'thatch', wall: mix(P.chandan, P.laterite, 0.3), haze: 0.12 });
        countryBoat(ctx, rng.fork(x + 1), xx + 70, 252, 0.7, { haze: 0.1 });
      }));
      for (let i = 0; i < 9; i++) {
        const x = (i + rng.range(0, 0.6)) * (W / 9);
        wrapped(W, x, 140, (xx) => { ctx.fillStyle = mix(P.chandan, P.haldi, 0.3); ctx.beginPath(); ctx.ellipse(xx, 258, 140, 16, 0, Math.PI, Math.PI * 2); ctx.fill(); });
      }
      bank(ctx, rng.fork('bank'), W, 252, mix(P.chandan, P.haldi, 0.3), mix(P.chandan, P.laterite, 0.3));
    },
    near: (ctx, rng, W) => {
      // Fisherfolk at work: mending nets, drying fish, carrying baskets.
      scatter(rng.fork('nets'), W, [360, 560], (x, i) => wrapped(W, x, 80, (xx) => {
        if (i % 2) {
          // drying rack with fish
          taperStroke(ctx, [{ x: xx - 30, y: 132 }, { x: xx - 30, y: 98 }], 2, mix(P.laterite, P.ink, 0.3), 1, [1, 1]);
          taperStroke(ctx, [{ x: xx + 30, y: 132 }, { x: xx + 30, y: 98 }], 2, mix(P.laterite, P.ink, 0.3), 1, [1, 1]);
          taperStroke(ctx, [{ x: xx - 32, y: 100 }, { x: xx + 32, y: 100 }], 1.6, mix(P.laterite, P.ink, 0.3), 1, [1, 1]);
          for (let k = 0; k < 7; k++) dab(ctx, xx - 24 + k * 8, 108, 1.6, 6, 0, mix(P.limewhite, P.khondalite, 0.25), 1);
          person(ctx, xx + 46, 132, 1.15, { pose: 'carry', cloth: P.marigold, sari: true, head: 'veil', skin: rng.next() });
        } else {
          // net spread out and two people mending it
          ctx.strokeStyle = withAlpha(mix(P.laterite, P.ink, 0.25), 0.6);
          ctx.lineWidth = 0.8;
          for (let k = 0; k < 12; k++) { ctx.beginPath(); ctx.moveTo(xx - 40 + k * 7, 128); ctx.lineTo(xx - 30 + k * 7, 134); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xx - 30 + k * 7, 128); ctx.lineTo(xx - 40 + k * 7, 134); ctx.stroke(); }
          person(ctx, xx - 50, 132, 1.15, { pose: 'sit', cloth: P.limewhite, cloth2: P.laterite, skin: 0.7 });
          person(ctx, xx + 46, 132, 1.15, { pose: 'sit', cloth: P.sindoor, sari: true, head: 'bun', facing: -1, skin: 0.4 });
        }
      }));
      scatter(rng.fork('crabs'), W, [500, 800], (x) => wrapped(W, x, 6, (xx) => { dab(ctx, xx, 130, 3, 2, 0, P.sindoor, 1); taperStroke(ctx, [{ x: xx - 5, y: 128 }, { x: xx + 5, y: 128 }], 1, P.sindoor, 1); }));
    },
    fore: (ctx, rng, W) => {
      // sparse dune grass and shells below the lane
      for (let g = 0; g < 8; g++) {
        const gx = (g + rng.range(0.1, 0.9)) * (W / 8);
        wrapped(W, gx, 40, (xx) => {
          reedTuft(ctx, rng.fork(g), xx, 124, 26, rng.range(28, 44), { dark: mix(P.tota, P.neel, 0.4), mid: mix(P.tota, P.haldi, 0.3), tip: mix(P.haldi, P.chandan, 0.3) }, 8);
          for (let k = 0; k < 3; k++) dab(ctx, xx + 30 + k * 8, 110 + k * 3, 3, 2, 0, P.limewhite, 0.9);
        });
      }
    },
    sign: { date: 'c. 1250 CE', title: 'Konark' },
    landmarks: [
      {
        // A carver chisels the giraffe-on-a-boat panel; a boy can't stop staring.
        at: 0.24, plane: 'near', w: 280, h: 140, y: 566,
        paint: (ctx, rng, w, h) => {
          const stone = mix(P.khondalite, P.ink, 0.2);
          ctx.fillStyle = mix(stone, P.ink, 0.2);
          ctx.fillRect(w / 2 - 46, h - 20, 92, 20);
          giraffeRelief(ctx, w / 2, h - 20, 84, 70, stone, 0.78);
          person(ctx, w / 2 + 70, h - 2, 1.2, { pose: 'adze', cloth: P.limewhite, cloth2: P.laterite, head: 'turban', facing: -1, skin: 0.7, phase: 0.5 });
          person(ctx, w / 2 - 74, h - 2, 0.9, { pose: 'point', cloth: P.haldi, facing: 1, skin: 0.3 });
          for (let i = 0; i < 12; i++) dab(ctx, w / 2 + 44 + rng.range(-6, 10), h - 2 - rng.range(0, 3), 1.6, 1.1, 0, mix(stone, P.limewhite, 0.35), 1);
        },
      },
      {
        // The Black Pagoda: the dark stone chariot with its wheels and horses, and the great
        // tower (still standing in 1250) behind the porch.
        at: 0.5, plane: 'mid', w: 640, h: 330,
        paint: (ctx, rng, w, h) => {
          const s = 0.95, x = w / 2 + 60, y = h - 4;
          const stone = mix(P.khondalite, P.ink, 0.25);
          rekhaDeula(ctx, rng.fork('tower'), x + 100 * s, y - 44 * s, 290 * s, { stone, flagColour: P.sindoor });
          konark(ctx, rng.fork('konark'), x, y, s);
          // a crowd of tiny pilgrims and stone-carriers at the platform
          crowd(ctx, rng.fork('c'), x - 150, x + 100, h - 2, 0.55, { poses: ['walk', 'carry', 'stand'], density: 2.2, cloths: [P.limewhite, P.marigold, P.laterite, P.sindoor] });
        },
      },
      {
        // A passing ship's lookout points to the dark tower: their landmark on this coast.
        at: 0.64, plane: 'mid', w: 200, h: 160, y: 440,
        paint: (ctx, rng, w, h) => {
          const wl = h - 8;
          boitaShip(ctx, rng, w / 2, wl, 0.95, { sail: mix(P.chandan, P.laterite, 0.2), sail2: P.laterite, cargo: 'bales', haze: 0.1 });
          person(ctx, w / 2 - 34, wl - 12, 0.62, { pose: 'point', cloth: P.limewhite, cloth2: P.laterite, head: 'turban', facing: -1, skin: 0.6 });
          for (let i = 0; i < 5; i++) taperStroke(ctx, [{ x: w / 2 - 60 - i * 8, y: wl + 2 + i }, { x: w / 2 - 74 - i * 10, y: wl + 2 + i }], 1.4, P.limewhite, 0.6);
        },
      },
      {
        // Hauling in the net at dawn — and a crow making off with the best fish.
        at: 0.84, plane: 'mid', w: 300, h: 110,
        paint: (ctx, rng, w, h) => {
          ctx.strokeStyle = mix(P.laterite, P.ink, 0.3);
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(30, h - 22); ctx.lineTo(w - 40, h - 10); ctx.stroke();
          crowd(ctx, rng, 40, 180, h - 2, 1.0, { poses: ['pull'], facing: -1, density: 1.2, cloths: [P.limewhite, P.laterite, P.marigold] });
          for (let k = 0; k < 8; k++) dab(ctx, w - 70 + rng.range(-20, 20), h - 10 + rng.range(-4, 4), 4, 1.8, rng.next(), mix(P.limewhite, P.khondalite, 0.2), 1);
          crow(ctx, w - 30, h - 52, 1.3, 1);
          dab(ctx, w - 18, h - 59, 4.6, 1.6, 0.2, mix(P.limewhite, P.khondalite, 0.2), 1);
          person(ctx, w - 50, h - 2, 1.0, { pose: 'armsUp', cloth: P.sindoor, sari: true, head: 'bun', facing: 1, skin: 0.5 });
        },
      },
    ],
  }),
};
