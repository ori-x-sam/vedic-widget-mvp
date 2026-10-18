// Act VI · Odisha, Now (records 32–37). Lead: rani; supports peacock, haldi,
// tota — the brightest scenes in the game. 35 and 37 are lively nights: neel
// skies with haldi stars, lit windows and floodlights, still full of colour.
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, dabField, glow, makeCanvas, paintedShape, polyPath, softShadow, taperStroke, vGradient, wrapped, type Ctx } from '../brush';
import { bank, scatter, treeRow, type SceneDef } from '../engine';
import { broadTree, coconutPalm, lotusFlower, palmyraPalm } from '../shared/nature';
import { chhati, crowd, flag, person, type Headwear, type Pose } from '../kit/people';
import { cat, cow, elephant, goat } from '../kit/animals';
import { blastFurnace, crane, cycloneShelter, house, jagannathTemple, modernBlock, pacheri, rekhaDeula, singhadwara, stadium, templeLine } from '../kit/buildings';
import { busBg } from '../kit/craft';

type F = 1 | -1;
const hz = (c: string, h = 0) => (h ? mix(c, P.skyCream, h) : c);
const CLOTHS = [P.rani, P.rani, P.haldi, P.peacock, P.tota, P.limewhite, P.marigold, P.sindoor];
const NIGHT = mix(P.neel, P.ink, 0.25);

// ---- local helpers -------------------------------------------------------------

/** Tint everything already painted (night or storm light); lights go on afterwards. */
function wash(ctx: Ctx, w: number, h: number, col: string, a: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = withAlpha(col, a);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Paint on a scratch canvas, tint it, then lay it down (so earlier lights stay bright). */
function dimmed(ctx: Ctx, w: number, h: number, col: string, a: number, fn: (c: Ctx) => void): void {
  const [c, cx] = makeCanvas(w, h);
  fn(cx);
  wash(cx, w, h, col, a);
  ctx.drawImage(c, 0, 0);
}

/** Slanting rain blown by the wind from the right (the record's 'push' gusts). */
function rain(ctx: Ctx, rng: Rng, W: number, H: number, n: number, alpha = 0.35): void {
  for (let i = 0; i < n; i++) {
    const x = rng.next() * W, y = rng.next() * H, l = rng.range(10, 24);
    const col = rng.chance(0.7) ? P.limewhite : P.seafoam;
    const w = rng.range(0.7, 1.5), a = rng.range(0.4, 1) * alpha;
    wrapped(W, x, 16, (xx) => taperStroke(ctx, [{ x: xx, y }, { x: xx - l * 0.5, y: y + l }], w, col, a, [0.3, 0.3]));
  }
}

/** A bougainvillea clump: rani bracts over dark leaves. (x, y) = base centre. */
function bougainvillea(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze = 0): void {
  const leaf = [hz(mix(P.tota, P.neel, 0.35), haze), hz(mix(P.tota, P.peacock, 0.3), haze), hz(P.tota, haze)];
  const pink = [hz(P.rani, haze), hz(P.rani, haze), hz(mix(P.rani, P.skyCream, 0.3), haze), hz(mix(P.rani, P.sindoor, 0.25), haze)];
  const n = Math.round((w * h) / 20);
  const pt = () => {
    const u = rng.range(-1, 1);
    return { x: x + (u * w) / 2, y: y - rng.next() * h * Math.sqrt(1 - u * u) };
  };
  for (let i = 0; i < n * 0.6; i++) { const p = pt(); dab(ctx, p.x, p.y, rng.range(2, 4), rng.range(1.4, 2.6), rng.next() * 3, rng.pick(leaf), 0.95); }
  for (let i = 0; i < n; i++) { const p = pt(); dab(ctx, p.x, p.y - 1, rng.range(1.6, 3.4), rng.range(1.4, 2.8), rng.next() * 3, rng.pick(pink), 0.92); }
}

/** Paint a vignette k times larger, keeping its baseline at the canvas bottom. */
function scaled(ctx: Ctx, h: number, k: number, fn: (hh: number) => void): void {
  ctx.save();
  ctx.translate(0, h * (1 - k));
  ctx.scale(k, k);
  fn(h);
  ctx.restore();
}

/** A continuous bougainvillea hedge along a whole strip (tiles seamlessly). */
function hedgeRow(ctx: Ctx, rng: Rng, W: number, y: number, h: number, haze = 0): void {
  for (let x = 0; x < W; x += 24) wrapped(W, x, 30, (xx) => bougainvillea(ctx, rng.fork(x), xx, y, 44, h * rng.range(0.8, 1.15), haze));
}

/** A bed of marigolds and rani flowers. */
function flowerBed(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number): void {
  for (let i = 0; i < (w * h) / 14; i++) dab(ctx, x + rng.range(-w / 2, w / 2), y - rng.next() * h, rng.range(1.6, 3), rng.range(1.2, 2), rng.next() * 3, rng.pick([mix(P.tota, P.neel, 0.3), P.tota]), 0.9);
  for (let i = 0; i < (w * h) / 16; i++) dab(ctx, x + rng.range(-w / 2, w / 2), y - rng.next() * h - 1, rng.range(1.4, 2.6), rng.range(1.4, 2.6), 0, rng.pick([P.marigold, P.haldi, P.rani, P.rani]), 0.95);
}

function streetLamp(ctx: Ctx, x: number, y: number, h: number, lit: boolean, col: string = P.haldi, facing: F = 1): void {
  const pole = mix(P.khondalite, P.neel, 0.3);
  taperStroke(ctx, [{ x, y }, { x, y: y - h }], 2.4, pole, 1, [1, 1]);
  taperStroke(ctx, curvePts(x, y - h, x + 2 * facing, y - h - 6, x + 12 * facing, y - h - 4, 6), 1.8, pole, 1, [1, 1]);
  if (lit) glow(ctx, x + 12 * facing, y - h - 2, 38, col, 0.55);
  dab(ctx, x + 12 * facing, y - h - 2, 4, 2, 0, lit ? mix(col, P.limewhite, 0.5) : P.limewhite, 1);
}

function ladder(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, col: string): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  for (const k of [-1, 1]) taperStroke(ctx, [{ x: x0 + nx * k * w / 2, y: y0 + ny * k * w / 2 }, { x: x1 + nx * k * w * 0.4, y: y1 + ny * k * w * 0.4 }], 3, col, 1, [1, 1]);
  for (let t = 0.06; t < 1; t += 12 / len) {
    const cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
    const hw = (w / 2) * (1 - t * 0.2);
    taperStroke(ctx, [{ x: cx - nx * hw, y: cy - ny * hw }, { x: cx + nx * hw, y: cy + ny * hw }], 2, col, 1, [1, 1]);
  }
}

function bucket(ctx: Ctx, x: number, y: number, s: number, col: string, paint: string): void {
  ctx.fillStyle = col;
  polyPath(ctx, [{ x: x - 5 * s, y: y - 9 * s }, { x: x + 5 * s, y: y - 9 * s }, { x: x + 4 * s, y }, { x: x - 4 * s, y }]);
  ctx.fill();
  dab(ctx, x, y - 9 * s, 5 * s, 1.4 * s, 0, paint, 1);
  taperStroke(ctx, [{ x: x + 4 * s, y: y - 8 * s }, { x: x + 5.5 * s, y: y - 2 * s }], 1.4 * s, paint, 0.9, [1, 0.3]);
  ctx.strokeStyle = withAlpha(P.ink, 0.6);
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath(); ctx.arc(x, y - 9 * s, 5 * s, Math.PI, 0); ctx.stroke();
}

/** A goods truck in hand-painted truck art (flowers, parrots, borders — never lettering). Faces right. */
function truck(ctx: Ctx, rng: Rng, x: number, y: number, s: number, body: string, trim: string, haze = 0): void {
  const H = (c: string) => hz(c, haze);
  const S = (v: number) => v * s;
  softShadow(ctx, x, y, S(62), S(5), P.ink, 0.3);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - S(58), y: y - S(14) }, { x: x - S(58), y: y - S(56) }, { x: x + S(22), y: y - S(56) }, { x: x + S(22), y: y - S(14) }]), { x: x - S(58), y: y - S(56), w: S(80), h: S(42) }, { base: H(body), light: H(mix(body, P.limewhite, 0.4)), shade: H(mix(body, P.ink, 0.3)), lightFrom: 'top', dabs: 18 });
  ctx.fillStyle = H(trim);
  ctx.fillRect(x - S(58), y - S(56), S(80), S(6));
  ctx.fillStyle = H(P.haldi);
  ctx.fillRect(x - S(58), y - S(21), S(80), S(3));
  for (let i = 0; i < 9; i++) dab(ctx, x - S(54) + i * S(9.4), y - S(53), S(1.6), S(1.6), 0, H(i % 2 ? P.limewhite : P.haldi), 1);
  for (let i = 0; i < 3; i++) {
    const cx = x - S(44) + i * S(26), cy = y - S(36);
    dab(ctx, cx, cy, S(8), S(8), 0, H(P.limewhite), 1);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      dab(ctx, cx + Math.cos(a) * S(4.4), cy + Math.sin(a) * S(4.4), S(2.8), S(1.7), a, H(i === 1 ? P.rani : P.marigold), 1);
    }
    dab(ctx, cx, cy, S(2.2), S(2.2), 0, H(i === 1 ? P.haldi : P.tota), 1);
  }
  const cab = H(mix(trim, P.limewhite, 0.1));
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x + S(22), y: y - S(12) }, { x: x + S(22), y: y - S(50) }, { x: x + S(40), y: y - S(50) }, { x: x + S(50), y: y - S(32) }, { x: x + S(53), y: y - S(12) }]), { x: x + S(22), y: y - S(50), w: S(31), h: S(38) }, { base: cab, light: H(mix(trim, P.limewhite, 0.45)), shade: H(mix(trim, P.ink, 0.3)), lightFrom: 'right', dabs: 8 });
  ctx.fillStyle = H(mix(P.seafoam, P.limewhite, 0.3));
  polyPath(ctx, [{ x: x + S(39), y: y - S(47) }, { x: x + S(48), y: y - S(33) }, { x: x + S(39), y: y - S(33) }]);
  ctx.fill();
  ctx.fillRect(x + S(26), y - S(46), S(10), S(11));
  // the painted 'crown' over the cab
  ctx.fillStyle = H(P.haldi);
  ctx.beginPath();
  ctx.moveTo(x + S(21), y - S(50));
  ctx.quadraticCurveTo(x + S(31), y - S(62), x + S(42), y - S(50));
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 4; i++) dab(ctx, x + S(25) + i * S(4.6), y - S(53), S(1.2), S(1.2), 0, H(P.sindoor), 1);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = H(i % 2 ? P.limewhite : P.ink); ctx.fillRect(x + S(40) + i * S(3.4), y - S(17), S(3.4), S(4)); }
  for (const wx of [-42, -26, 38]) { dab(ctx, x + S(wx), y - S(7), S(7), S(7), 0, H(P.ink), 1); dab(ctx, x + S(wx), y - S(7), S(3), S(3), 0, H(P.khondalite), 1); }
  for (let i = 0; i < 4; i++) dab(ctx, x - S(57) + i * S(3), y - S(9), S(1.2), S(2.4), 0, H(rng.pick([P.rani, P.haldi, P.tota])), 1);
}

/** A cow lying down, chewing, in no hurry at all. */
function lyingCow(ctx: Ctx, x: number, y: number, s: number, facing: F = 1, garland = false): void {
  const c = P.limewhite, d = mix(P.limewhite, P.khondalite, 0.45);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  softShadow(ctx, 0, 0, 22, 3, P.ink, 0.3);
  dab(ctx, -9, -1.6, 7, 2.2, 0, d, 1);
  dab(ctx, 9, -1.6, 6, 2, 0, d, 1);
  dab(ctx, 0, -8, 16, 7.5, 0, c, 1);
  dab(ctx, -2, -4, 13, 3, 0, d, 0.35);
  dab(ctx, 9, -14, 4.5, 3.6, 0, c, 1);
  taperStroke(ctx, [{ x: 12, y: -10 }, { x: 19, y: -17 }], 6, c, 1, [1, 0.9]);
  dab(ctx, 21, -18, 4.6, 3.4, 0.3, c, 1);
  taperStroke(ctx, [{ x: 19, y: -21 }, { x: 17, y: -26 }], 1.4, d, 1, [1, 0.3]);
  taperStroke(ctx, [{ x: 22, y: -21 }, { x: 24, y: -26 }], 1.4, d, 1, [1, 0.3]);
  dab(ctx, 22, -18.5, 0.8, 0.8, 0, P.ink, 1);
  taperStroke(ctx, [{ x: -15, y: -6 }, { x: -21, y: -2 }, { x: -15, y: 0 }], 1.4, d, 1, [1, 0.5]);
  if (garland) for (let i = 0; i < 7; i++) dab(ctx, 13 + i * 1.3, -16 + Math.sin((i / 6) * Math.PI) * 5, 1.4, 1.4, 0, i % 2 ? P.marigold : P.haldi, 1);
  ctx.restore();
}

function pigeon(ctx: Ctx, x: number, y: number, s: number, fly: boolean, facing: F = 1, haze = 0): void {
  const body = hz(mix(mix(P.khondalite, P.neel, 0.2), P.limewhite, 0.35), haze);
  const dark = hz(mix(P.khondalite, P.neel, 0.3), haze);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  dab(ctx, 0, -4, 5, 3.2, -0.1, body, 1);
  dab(ctx, 4, -7.5, 2.2, 2.2, 0, body, 1);
  dab(ctx, 3, -5.6, 1.8, 1.4, 0, hz(mix(P.peacock, P.rani, 0.4), haze), 0.9);
  taperStroke(ctx, [{ x: 6, y: -7.5 }, { x: 7.6, y: -7 }], 0.9, hz(P.chandan, haze), 1, [1, 0.3]);
  taperStroke(ctx, [{ x: -4, y: -4 }, { x: -8, y: -3 }], 2.4, dark, 1, [1, 0.6]);
  if (fly) {
    taperStroke(ctx, [{ x: 0, y: -5 }, { x: -5, y: -14 }], 3, body, 1, [1, 0.2]);
    taperStroke(ctx, [{ x: 1, y: -5 }, { x: 5, y: -15 }], 3, dark, 1, [1, 0.2]);
  } else {
    dab(ctx, -1, -4.4, 3, 1.8, -0.2, dark, 0.8);
    taperStroke(ctx, [{ x: 0, y: -1 }, { x: 0, y: 0.5 }], 0.8, hz(P.sindoor, haze), 1);
  }
  ctx.restore();
}

function rooster(ctx: Ctx, x: number, y: number, s: number, facing: F = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  for (const [c, a] of [[P.tota, -2.3], [mix(P.neel, P.ink, 0.3), -2.0], [P.peacock, -2.6]] as const) taperStroke(ctx, curvePts(-4, -8, -9, -16 + a, -12, -8 + a * 2), 2.4, c, 1, [1, 0.2]);
  dab(ctx, 0, -7, 6, 4.6, 0, mix(P.chandan, P.sindoor, 0.4), 1);
  dab(ctx, -1, -6, 4, 2.4, 0.2, mix(P.laterite, P.ink, 0.2), 0.8);
  taperStroke(ctx, [{ x: 4, y: -9 }, { x: 5, y: -13 }], 3, mix(P.haldi, P.marigold, 0.5), 1, [1, 0.8]);
  dab(ctx, 5.4, -13.6, 2.2, 2.2, 0, mix(P.haldi, P.marigold, 0.5), 1);
  dab(ctx, 5, -16, 1.8, 1.1, 0, P.sindoor, 1);
  dab(ctx, 6.2, -11.8, 0.8, 1.2, 0, P.sindoor, 1);
  taperStroke(ctx, [{ x: 7.3, y: -13.6 }, { x: 9, y: -13 }], 1, P.haldi, 1, [1, 0.3]);
  for (const lx of [-1, 1.5]) taperStroke(ctx, [{ x: lx, y: -3 }, { x: lx, y: 0 }], 0.9, P.haldi, 1);
  ctx.restore();
}

/** A rain umbrella. (x, y) = centre of the rim; handle hangs below. */
function brolly(ctx: Ctx, x: number, y: number, r: number, col: string, tilt = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  taperStroke(ctx, [{ x: 0, y: -r * 0.5 }, { x: 0, y: r * 1.3 }], Math.max(1, r * 0.08), P.ink, 1, [1, 1]);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(-r * 0.9, -r * 0.85, 0, -r * 0.82);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.85, r, 0);
  for (let i = 4; i > 0; i--) ctx.quadraticCurveTo(-r + (i - 0.5) * (r / 2), -r * 0.16, -r + (i - 1) * (r / 2), 0);
  ctx.closePath();
  ctx.fill();
  taperStroke(ctx, curvePts(-r * 0.15, -r * 0.8, -r * 0.4, -r * 0.4, -r * 0.5, -r * 0.05), r * 0.08, P.limewhite, 0.45);
  ctx.restore();
}

/** Someone riding a small e-scooter, facing right. (x, y) = road. */
function scooterRider(ctx: Ctx, x: number, y: number, s: number, body: string, o: { cloth: string; head?: Headwear; sari?: boolean; skin?: number; lit?: boolean; pillion?: string }): void {
  softShadow(ctx, x, y, 18 * s, 2.5 * s, P.ink, 0.3);
  for (const wx of [-12, 12]) { dab(ctx, x + wx * s, y - 3.5 * s, 3.6 * s, 3.6 * s, 0, P.ink, 1); dab(ctx, x + wx * s, y - 3.5 * s, 1.4 * s, 1.4 * s, 0, P.khondalite, 1); }
  taperStroke(ctx, [{ x: x - 12 * s, y: y - 6 * s }, { x: x + 8 * s, y: y - 6 * s }], 3 * s, body, 1, [1, 1]);
  dab(ctx, x - 8 * s, y - 10 * s, 7 * s, 4.4 * s, 0, body, 1);
  dab(ctx, x - 9 * s, y - 11.5 * s, 4 * s, 1.4 * s, 0, mix(body, P.limewhite, 0.5), 0.8);
  taperStroke(ctx, [{ x: x + 11 * s, y: y - 5 * s }, { x: x + 8 * s, y: y - 21 * s }], 2.6 * s, body, 1, [1, 1]);
  taperStroke(ctx, [{ x: x + 5 * s, y: y - 21 * s }, { x: x + 11 * s, y: y - 22 * s }], 1.2 * s, P.ink, 1, [1, 1]);
  if (o.lit) glow(ctx, x + 13 * s, y - 15 * s, 22 * s, P.haldi, 0.6);
  dab(ctx, x + 11 * s, y - 15 * s, 1.5 * s, 1.5 * s, 0, P.haldi, 1);
  if (o.pillion) person(ctx, x - 13 * s, y - 6 * s, s * 0.85, { pose: 'sit', cloth: o.pillion, head: 'none', skin: 0.7 });
  person(ctx, x - 5 * s, y - 6 * s, s, { pose: 'sit', cloth: o.cloth, cloth2: mix(o.cloth, P.ink, 0.3), head: o.head ?? 'helmet', sari: o.sari, skin: o.skin ?? 0.4 });
  taperStroke(ctx, [{ x: x - 1 * s, y: y - 24 * s }, { x: x + 6 * s, y: y - 21 * s }], 2.2 * s, mix(P.chandan, P.laterite, 0.3), 1, [1, 0.8]);
}

/** A friendly six-wheeled delivery robot (palette colours only — no neon before Act VII). */
function deliveryBot(ctx: Ctx, x: number, y: number, s: number, lit = true): void {
  softShadow(ctx, x, y, 12 * s, 2 * s, P.ink, 0.35);
  for (const wx of [-7, 0, 7]) dab(ctx, x + wx * s, y - 2.5 * s, 2.6 * s, 2.6 * s, 0, P.ink, 1);
  paintedShape(ctx, null as unknown as Rng, () => polyPath(ctx, [{ x: x - 10 * s, y: y - 4 * s }, { x: x - 10 * s, y: y - 15 * s }, { x: x + 10 * s, y: y - 15 * s }, { x: x + 10 * s, y: y - 4 * s }]), { x: x - 10 * s, y: y - 15 * s, w: 20 * s, h: 11 * s }, { base: P.limewhite, light: P.limewhite, shade: mix(P.limewhite, P.khondalite, 0.4), dabs: 0 });
  ctx.fillStyle = P.peacock;
  ctx.fillRect(x - 10 * s, y - 8 * s, 20 * s, 2.4 * s);
  ctx.fillStyle = mix(P.ink, P.neel, 0.3);
  ctx.fillRect(x + 5 * s, y - 13 * s, 5 * s, 3.4 * s);
  if (lit) glow(ctx, x + 8 * s, y - 11 * s, 7 * s, P.haldi, 0.6);
  dab(ctx, x + 6.6 * s, y - 11.3 * s, 0.8 * s, 0.8 * s, 0, P.haldi, 1);
  dab(ctx, x + 8.8 * s, y - 11.3 * s, 0.8 * s, 0.8 * s, 0, P.haldi, 1);
  taperStroke(ctx, [{ x: x - 7 * s, y: y - 15 * s }, { x: x - 7 * s, y: y - 27 * s }], 0.7 * s, P.khondalite, 1, [1, 1]);
  ctx.fillStyle = P.rani;
  polyPath(ctx, [{ x: x - 7 * s, y: y - 27 * s }, { x: x - 1 * s, y: y - 25.5 * s }, { x: x - 7 * s, y: y - 24 * s }]);
  ctx.fill();
}

/** A silicon wafer: a disc with one flat edge, a grid of dies and a rainbow sheen. */
function wafer(ctx: Ctx, x: number, y: number, r: number): void {
  const path = () => {
    ctx.beginPath();
    const a0 = Math.PI / 2 + 0.28, a1 = Math.PI / 2 - 0.28;
    ctx.arc(x, y, r, a0, a1 + Math.PI * 2);
    ctx.closePath();
  };
  glow(ctx, x, y, r * 1.6, P.limewhite, 0.18);
  path();
  ctx.fillStyle = mix(P.neel, P.khondalite, 0.35);
  ctx.fill();
  clipTo(ctx, path, () => {
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, withAlpha(P.rani, 0.7));
    g.addColorStop(0.35, withAlpha(P.peacock, 0.65));
    g.addColorStop(0.6, withAlpha(P.seafoam, 0.6));
    g.addColorStop(0.85, withAlpha(P.haldi, 0.65));
    g.addColorStop(1, withAlpha(P.rani, 0.6));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    const step = Math.max(3, r / 6);
    ctx.fillStyle = withAlpha(mix(P.neel, P.ink, 0.4), 0.45);
    for (let gx = x - r; gx < x + r; gx += step) ctx.fillRect(gx, y - r, Math.max(0.6, r * 0.018), r * 2);
    for (let gy = y - r; gy < y + r; gy += step) ctx.fillRect(x - r, gy, r * 2, Math.max(0.6, r * 0.018));
    dab(ctx, x - r * 0.35, y - r * 0.4, r * 0.35, r * 0.14, -0.7, P.limewhite, 0.4);
  });
  ctx.strokeStyle = withAlpha(P.limewhite, 0.7);
  ctx.lineWidth = Math.max(1, r * 0.04);
  path();
  ctx.stroke();
}

/** A polished stone adze on its wooden haft (the Golbai Sasan boat-builders' tool). */
function stoneAdze(ctx: Ctx, x: number, y: number, s: number): void {
  taperStroke(ctx, [{ x: x - 10 * s, y: y + 14 * s }, { x: x + 2 * s, y: y - 12 * s }], 3.4 * s, mix(P.laterite, P.chandan, 0.35), 1, [0.8, 1]);
  ctx.fillStyle = mix(P.khondalite, P.ink, 0.25);
  polyPath(ctx, [{ x: x - 2 * s, y: y - 16 * s }, { x: x + 12 * s, y: y - 14 * s }, { x: x + 15 * s, y: y - 6 * s }, { x: x + 1 * s, y: y - 9 * s }]);
  ctx.fill();
  dab(ctx, x + 7 * s, y - 13 * s, 4 * s, 1.2 * s, 0.1, mix(P.khondalite, P.limewhite, 0.5), 0.7);
  taperStroke(ctx, [{ x: x - 2 * s, y: y - 12 * s }, { x: x + 4 * s, y: y - 10 * s }], 1.4 * s, mix(P.haldi, P.chandan, 0.4), 1, [1, 1]);
}

/** A palm-leaf manuscript bundle (pothi) between wooden boards. */
function pothi(ctx: Ctx, x: number, y: number, w: number, open = false): void {
  const leaf = mix(P.haldi, P.chandan, 0.45);
  const board = mix(P.laterite, P.ink, 0.25);
  if (open) {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = mix(leaf, P.limewhite, i * 0.12);
      ctx.fillRect(x - w / 2 + i * 1.5, y - 4 - i * 2.5, w, 3.2);
      for (let k = 0; k < 4; k++) ctx.fillRect(x - w / 2 + 4 + k * (w / 4.4) + i * 1.5, y - 3.4 - i * 2.5, w / 6, 0.5);
    }
    ctx.fillStyle = withAlpha(P.ink, 0.5);
    for (let k = 0; k < 6; k++) ctx.fillRect(x - w / 2 + 3 + k * (w / 6.5), y - 8.6, w / 9, 0.6);
    return;
  }
  ctx.fillStyle = board;
  ctx.fillRect(x - w / 2, y - 3, w, 3);
  ctx.fillStyle = leaf;
  ctx.fillRect(x - w / 2 + 1, y - 9, w - 2, 6);
  ctx.fillStyle = withAlpha(mix(leaf, P.laterite, 0.4), 0.7);
  for (let k = 0; k < 3; k++) ctx.fillRect(x - w / 2 + 1, y - 8 + k * 2, w - 2, 0.6);
  ctx.fillStyle = board;
  ctx.fillRect(x - w / 2, y - 12, w, 3);
  taperStroke(ctx, [{ x: x - w * 0.2, y: y - 12 }, { x: x - w * 0.2, y }], 1.2, P.laterite, 1, [1, 1]);
}

/** A woven mat with stripes. */
function mat(ctx: Ctx, x: number, y: number, w: number, a: string, b: string): void {
  ctx.fillStyle = a;
  polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w / 2 + 6, y: y - 6 }, { x: x + w / 2 + 6, y: y - 6 }, { x: x + w / 2, y }]);
  ctx.fill();
  ctx.fillStyle = b;
  for (let i = 0; i < w; i += 9) ctx.fillRect(x - w / 2 + i + 3, y - 6, 3, 6);
}

function charpai(ctx: Ctx, x: number, y: number, w: number): void {
  const wood = mix(P.laterite, P.ink, 0.2);
  for (const k of [-0.45, 0.45]) taperStroke(ctx, [{ x: x + k * w, y }, { x: x + k * w, y: y - 9 }], 2.4, wood, 1, [1, 1]);
  ctx.fillStyle = wood;
  ctx.fillRect(x - w / 2, y - 11, w, 2.4);
  ctx.strokeStyle = withAlpha(mix(P.haldi, P.chandan, 0.5), 0.9);
  ctx.lineWidth = 0.8;
  for (let i = 2; i < w; i += 4) { ctx.beginPath(); ctx.moveTo(x - w / 2 + i, y - 11); ctx.lineTo(x - w / 2 + i + 3, y - 9); ctx.stroke(); }
}

/** A roadside dhaba: painted walls, striped awning, a blank board with a painted tea glass. */
function dhaba(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, wall: string, awn: [string, string], haze = 0): void {
  const H = (c: string) => hz(c, haze);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w / 2, y: y - h }, { x: x + w / 2, y: y - h }, { x: x + w / 2, y }]), { x: x - w / 2, y: y - h, w, h }, { base: H(wall), light: H(mix(wall, P.limewhite, 0.4)), shade: H(mix(wall, P.ink, 0.3)), lightFrom: 'right', dabs: 14 });
  ctx.fillStyle = H(mix(P.ink, P.laterite, 0.25));
  ctx.fillRect(x - w * 0.3, y - h * 0.62, w * 0.22, h * 0.62);
  ctx.fillRect(x + w * 0.12, y - h * 0.64, w * 0.22, h * 0.26);
  glow(ctx, x - w * 0.19, y - h * 0.3, w * 0.18, P.haldi, 0.3);
  ctx.fillStyle = H(mix(P.limewhite, P.khondalite, 0.2));
  ctx.fillRect(x - w / 2 - 3, y - h - 4, w + 6, 5);
  const n = 8;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = H(awn[i % 2]);
    const ax = x - w / 2 - 6 + (i / n) * (w + 12), aw = (w + 12) / n;
    polyPath(ctx, [{ x: ax, y: y - h * 0.78 }, { x: ax + aw, y: y - h * 0.78 }, { x: ax + aw + 2, y: y - h * 0.6 }, { x: ax + 2, y: y - h * 0.6 }]);
    ctx.fill();
  }
  // signboard: painted tea glass, no lettering
  const bw = w * 0.56, by = y - h - 18;
  ctx.fillStyle = H(awn[0]);
  ctx.fillRect(x - bw / 2, by, bw, 14);
  ctx.fillStyle = H(P.limewhite);
  ctx.fillRect(x - bw / 2 + 2, by + 2, bw - 4, 10);
  ctx.fillStyle = H(P.limewhite);
  polyPath(ctx, [{ x: x - 4, y: by + 3 }, { x: x + 4, y: by + 3 }, { x: x + 3, y: by + 11 }, { x: x - 3, y: by + 11 }]);
  ctx.fill();
  ctx.fillStyle = H(mix(P.chandan, P.laterite, 0.3));
  ctx.fillRect(x - 3.4, by + 5, 6.8, 5.6);
  for (const k of [-1, 1]) dab(ctx, x + k * bw * 0.32, by + 7, 3, 3, 0, H(awn[1]), 1);
  taperStroke(ctx, curvePts(x - 1, by + 2, x - 4, by - 3, x, by - 7), 1, H(P.limewhite), 0.7);
  charpai(ctx, x + w / 2 + 16, y, 22);
}

function milestone(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.fillStyle = P.limewhite;
  ctx.fillRect(x - 5 * s, y - 14 * s, 10 * s, 14 * s);
  ctx.fillStyle = P.haldi;
  ctx.beginPath();
  ctx.moveTo(x - 5 * s, y - 14 * s);
  ctx.quadraticCurveTo(x, y - 24 * s, x + 5 * s, y - 14 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha(P.khondalite, 0.35);
  ctx.fillRect(x + 2 * s, y - 14 * s, 3 * s, 14 * s);
}

function haystack(ctx: Ctx, rng: Rng, x: number, y: number, s: number): void {
  const c = mix(P.haldi, P.chandan, 0.35);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.moveTo(x - 12 * s, y); ctx.quadraticCurveTo(x - 13 * s, y - 20 * s, x, y - 26 * s); ctx.quadraticCurveTo(x + 13 * s, y - 20 * s, x + 12 * s, y); ctx.closePath(); }, { x: x - 13 * s, y: y - 26 * s, w: 26 * s, h: 26 * s }, { base: c, light: mix(c, P.limewhite, 0.4), shade: mix(c, P.laterite, 0.4), lightFrom: 'right', dabs: 10 });
  taperStroke(ctx, [{ x, y: y - 26 * s }, { x, y: y - 31 * s }], 1.4 * s, mix(P.laterite, P.ink, 0.3), 1, [1, 1]);
}

function bunting(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, cols: string[], alpha = 1): void {
  const pts = curvePts(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1, 14);
  ctx.strokeStyle = withAlpha(P.ink, 0.45 * alpha);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  pts.slice(1, -1).forEach((p, i) => {
    ctx.fillStyle = withAlpha(cols[i % cols.length], alpha);
    polyPath(ctx, [{ x: p.x - 3, y: p.y }, { x: p.x + 3, y: p.y }, { x: p.x, y: p.y + 7 }]);
    ctx.fill();
  });
}

function bench(ctx: Ctx, x: number, y: number, w: number, col: string): void {
  for (const k of [-0.4, 0.4]) taperStroke(ctx, [{ x: x + k * w, y }, { x: x + k * w, y: y - 7 }], 1.8, mix(P.khondalite, P.ink, 0.3), 1, [1, 1]);
  ctx.fillStyle = col;
  ctx.fillRect(x - w / 2, y - 9, w, 2.6);
  ctx.fillRect(x - w / 2, y - 15, w, 2.2);
}


// ---- Odia alphabet chart (record 34) -----------------------------------------------
const VOWELS = ['ଅ', 'ଆ', 'ଇ', 'ଈ', 'ଉ', 'ଊ', 'ଋ', 'ଏ', 'ଐ', 'ଓ', 'ଔ'];
const CONSONANTS = ['କ', 'ଖ', 'ଗ', 'ଘ', 'ଙ', 'ଚ', 'ଛ', 'ଜ', 'ଝ', 'ଞ', 'ଟ', 'ଠ', 'ଡ', 'ଢ', 'ଣ', 'ତ', 'ଥ', 'ଦ', 'ଧ', 'ନ', 'ପ', 'ଫ', 'ବ', 'ଭ', 'ମ', 'ଯ', 'ର', 'ଲ', 'ଳ', 'ଶ', 'ଷ', 'ସ', 'ହ'];
const ODIA_FONT = (px: number) => `700 ${px}px 'Baloo Bhaina 2', 'Noto Sans Oriya', serif`;
const LETTER_COLS = [P.rani, P.peacock, P.sindoor, P.tota, P.neel, P.marigold];

/** The little picture beside a letter, as on every school chart (ଆମ୍ବ mango, କଦଳୀ banana, ଖଟ cot, ଗଛ tree…). */
function chartPicture(ctx: Ctx, rng: Rng, ch: string, x: number, y: number): void {
  switch (ch) {
    case 'ଆ': // mango
      dab(ctx, x, y - 8, 6, 7.5, 0.4, P.haldi, 1); dab(ctx, x + 2, y - 10, 3, 4, 0.4, P.marigold, 0.7);
      taperStroke(ctx, [{ x: x - 1, y: y - 15 }, { x: x + 6, y: y - 19 }], 3, P.tota, 1, [0.3, 0.3]);
      break;
    case 'କ': // banana
      for (let i = 0; i < 3; i++) taperStroke(ctx, curvePts(x - 6 + i * 3, y - 18, x - 9 + i * 3, y - 6, x + 1 + i * 3, y - 2), 3, P.haldi, 1, [0.3, 0.4]);
      break;
    case 'ଖ': charpai(ctx, x, y - 2, 20); break; // cot
    case 'ଗ': broadTree(ctx, rng, x, y - 1, 22, 24); break; // tree
    case 'ଘ': house(ctx, rng, x, y - 1, 18, 20, { roof: 'thatch' }); break; // house
    case 'ଚ': // bird
      dab(ctx, x, y - 8, 5, 3.6, -0.2, P.tota, 1); dab(ctx, x + 4.5, y - 11, 2.6, 2.6, 0, P.tota, 1);
      dab(ctx, x + 7, y - 10.5, 1.4, 1, 0, P.sindoor, 1); taperStroke(ctx, [{ x: x - 4, y: y - 8 }, { x: x - 11, y: y - 4 }], 2.4, P.peacock, 1, [1, 0.3]);
      break;
    case 'ଛ': brolly(ctx, x, y - 10, 9, P.rani); break; // umbrella
    case 'ଜ': // moon
      dab(ctx, x, y - 10, 7, 7, 0, P.haldi, 1); dab(ctx, x + 3.6, y - 12, 6, 6, 0, P.limewhite, 1);
      break;
    case 'ତ': palmyraPalm(ctx, rng, x, y - 1, 24); break; // palmyra
    case 'ନ': // coconut
      dab(ctx, x - 3, y - 6, 5, 5, 0, mix(P.laterite, P.tota, 0.4), 1); dab(ctx, x + 4, y - 6, 4.6, 4.6, 0, mix(P.tota, P.laterite, 0.3), 1);
      break;
    case 'ପ': lotusFlower(ctx, x, y - 6, 8); break; // lotus
    case 'ମ': // fish
      dab(ctx, x, y - 8, 8, 3.6, 0, P.peacock, 1);
      polyPath(ctx, [{ x: x - 7, y: y - 8 }, { x: x - 12, y: y - 12 }, { x: x - 12, y: y - 4 }]); ctx.fillStyle = P.peacock; ctx.fill();
      dab(ctx, x + 4.6, y - 8.6, 0.9, 0.9, 0, P.ink, 1);
      break;
    case 'ହ': elephant(ctx, x, y - 1, 0.32, { caparison: [P.rani, P.haldi] }); break; // elephant
    default:
  }
}

function alphabetChart(ctx: Ctx, rng: Rng, W: number, top: number, bottom: number): void {
  const paper = mix(P.limewhite, P.skyCream, 0.25);
  const bandH = 20;
  vGradient(ctx, 0, top, W, bottom - top, [[0, paper, 1], [1, mix(paper, P.chandan, 0.15), 1]]);
  dabField(ctx, rng, 0, top, W, bottom - top, { n: 900, r: [3, 10], colours: [P.limewhite, mix(paper, P.chandan, 0.25)], alpha: [0.08, 0.18] });
  // Pattachitra-style rani borders with haldi flowers and little triangles
  for (const by of [top, bottom - bandH]) {
    ctx.fillStyle = P.rani;
    ctx.fillRect(0, by, W, bandH);
    ctx.fillStyle = mix(P.rani, P.ink, 0.3);
    ctx.fillRect(0, by + (by === top ? bandH - 2 : 0), W, 2);
    for (let x = 8; x < W; x += 32) {
      dab(ctx, x, by + bandH / 2, 3.4, 3.4, 0, P.haldi, 1);
      dab(ctx, x, by + bandH / 2, 1.2, 1.2, 0, P.sindoor, 1);
      ctx.fillStyle = P.limewhite;
      polyPath(ctx, [{ x: x + 12, y: by + 3 }, { x: x + 20, y: by + 3 }, { x: x + 16, y: by + bandH - 3 }]);
      ctx.fill();
    }
  }
  const cells = 22;
  const cw = W / cells;
  const rowTop = top + bandH + 2, rowH = (bottom - bandH - 2 - rowTop) / 2;
  const letters = [...VOWELS, ...CONSONANTS];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (let r = 0; r < 2; r++) for (let i = 0; i < cells; i++) {
    const x0 = i * cw, y0 = rowTop + r * rowH;
    const k = r * cells + i;
    // cell rules
    ctx.fillStyle = withAlpha(P.peacock, 0.35);
    ctx.fillRect(x0, y0, 1.4, rowH);
    if (r === 1) ctx.fillRect(0, y0 - 1, W, 1.6);
    const ch = letters[k];
    ctx.font = ODIA_FONT(Math.round(rowH * 0.62));
    ctx.fillStyle = withAlpha(P.ink, 0.15);
    ctx.fillText(ch, x0 + cw * 0.4 + 2, y0 + rowH * 0.7 + 2);
    ctx.fillStyle = LETTER_COLS[k % LETTER_COLS.length];
    ctx.fillText(ch, x0 + cw * 0.4, y0 + rowH * 0.7);
    chartPicture(ctx, rng.fork(k), ch, x0 + cw * 0.8, y0 + rowH - 4);
  }
}

// ---- scenes -------------------------------------------------------------------------
// Day: the textbook sky, warming to a rani blush behind the treeline.
const DAY_SKY: [number, string][] = [[0, mix(P.seafoam, P.peacock, 0.25)], [0.36, mix(P.seafoam, P.skyCream, 0.45)], [0.58, P.skyCream], [0.78, mix(P.skyCream, P.rani, 0.45)], [1, mix(P.rani, P.skyCream, 0.3)]];
// Night: neel overhead, a broad rani glow of the city on the horizon.
const NIGHT_SKY: [number, string][] = [[0, mix(P.neel, P.ink, 0.4)], [0.28, mix(P.neel, P.ink, 0.1)], [0.48, mix(P.neel, P.rani, 0.5)], [0.66, mix(P.rani, P.neel, 0.3)], [1, mix(P.rani, P.marigold, 0.3)]];
const NIGHT_PLAIN = mix(mix(P.peacock, P.neel, 0.6), P.khondalite, 0.35);

export const SCENES: Record<string, () => SceneDef> = {
  // 32 · 1 Nov 2011 · Orissa becomes Odisha — a highway, dhabas, paddy and a sign-painter.
  r32: () => ({
    id: 'r32',
    sky: { stops: DAY_SKY, sun: { x: 1060, y: 108, r: 34 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.peacock, P.skyCream, 0.5), b: P.neel, height: [18, 60], trees: true, haze: 0.45 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.25), plainDetail: 'fields', path: mix(P.khondalite, P.neel, 0.2), verge: mix(P.tota, P.haldi, 0.15) },
    mid: (ctx, rng, W) => {
      treeRow(ctx, rng.fork('trees'), W, 172, 0.35, 0.35);
      scatter(rng.fork('village'), W, [110, 240], (x) => wrapped(W, x, 30, (xx) => house(ctx, rng.fork(x), xx, 188, rng.range(30, 44), rng.range(32, 44), { roof: rng.chance(0.5) ? 'tile' : 'thatch', haze: 0.3 })));
      bank(ctx, rng.fork('bank'), W, 196, mix(P.tota, P.haldi, 0.4), mix(P.tota, P.haldi, 0.15));
      for (let y = 200; y < 224; y += 5) for (let x = rng.range(0, 30); x < W; x += rng.range(24, 50)) taperStroke(ctx, [{ x, y }, { x: x + rng.range(14, 30), y }], 1.4, mix(P.tota, P.haldi, 0.45), 0.6);
      // the highway
      ctx.fillStyle = mix(P.khondalite, P.neel, 0.2);
      ctx.fillRect(0, 226, W, 16);
      ctx.fillStyle = withAlpha(P.limewhite, 0.8);
      ctx.fillRect(0, 226, W, 1.4);
      ctx.fillRect(0, 240.5, W, 1.4);
      ctx.fillStyle = P.haldi;
      for (let x = 0; x < W; x += 32) ctx.fillRect(x, 233.4, 16, 1.2);
      // electricity poles and sagging wires
      for (let x = 64; x < W; x += 256) {
        taperStroke(ctx, [{ x, y: 226 }, { x, y: 150 }], 2.4, mix(P.khondalite, P.limewhite, 0.25), 1, [1, 1]);
        ctx.fillStyle = mix(P.khondalite, P.ink, 0.2);
        ctx.fillRect(x - 9, 154, 18, 2);
        for (const dy of [0, 4]) {
          ctx.strokeStyle = withAlpha(P.ink, 0.4);
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(x - 8, 155 + dy);
          ctx.quadraticCurveTo(x + 128, 168 + dy, x + 248, 155 + dy);
          ctx.stroke();
        }
      }
      hedgeRow(ctx, rng.fork('roadhedge'), W, 226, 12);
      // roadside dhabas in bright paint, bougainvillea at every door
      const walls = [mix(P.rani, P.skyCream, 0.12), mix(P.peacock, P.limewhite, 0.25), mix(P.rani, P.skyCream, 0.2), mix(P.haldi, P.limewhite, 0.1)];
      scatter(rng.fork('dhaba'), W, [380, 520], (x, i) => wrapped(W, x, 90, (xx) => {
        dhaba(ctx, rng.fork(x), xx, 225, rng.range(70, 90), rng.range(40, 50), walls[i % walls.length], i % 2 ? [P.rani, P.limewhite] : [P.peacock, P.haldi]);
        bougainvillea(ctx, rng.fork(x + 1), xx - 62, 226, 34, 28);
        crowd(ctx, rng.fork(x + 2), xx - 30, xx + 10, 228, 0.7, { density: 1.6 });
      }));
      scatter(rng.fork('traffic'), W, [260, 460], (x, i) => wrapped(W, x, 70, (xx) => {
        if (i % 3 === 1) busBg(ctx, rng.fork(x), xx, 241, 0.5, i % 2 ? P.rani : P.peacock);
        else truck(ctx, rng.fork(x), xx, 241, 0.55, rng.pick([P.marigold, P.haldi, P.rani, P.tota]), rng.pick([P.peacock, P.sindoor, P.rani]));
      }));
    },
    near: (ctx, rng, W) => {
      // paddy bunds behind: farmers bent over the green, haystacks
      scatter(rng.fork('farm'), W, [220, 380], (x, i) => wrapped(W, x, 40, (xx) => {
        if (i % 2) haystack(ctx, rng.fork(x), xx, 42, 1);
        else for (let k = 0; k < 3; k++) person(ctx, xx + k * 16, 40 + k * 2, 0.6, { pose: 'bend', cloth: rng.pick(CLOTHS), sari: k === 1, head: k === 1 ? 'veil' : 'cap', facing: 1 });
      }));
      // the verge: hedges of bougainvillea, milestones, goats, a bus stop painted rani
      hedgeRow(ctx, rng.fork('hedge'), W, 136, 18);
      scatter(rng.fork('stones'), W, [500, 700], (x) => wrapped(W, x, 10, (xx) => milestone(ctx, xx, 130, 1.1)));
      wrapped(W, 700, 70, (xx) => {
        const c = mix(P.rani, P.limewhite, 0.1);
        for (const k of [-1, 1]) taperStroke(ctx, [{ x: xx + k * 30, y: 128 }, { x: xx + k * 30, y: 86 }], 3, mix(P.khondalite, P.limewhite, 0.3), 1, [1, 1]);
        ctx.fillStyle = c;
        polyPath(ctx, [{ x: xx - 38, y: 88 }, { x: xx + 38, y: 88 }, { x: xx + 34, y: 80 }, { x: xx - 34, y: 80 }]);
        ctx.fill();
        ctx.fillStyle = mix(P.rani, P.ink, 0.3);
        ctx.fillRect(xx - 38, 88, 76, 2);
        bench(ctx, xx, 128, 46, P.haldi);
        person(ctx, xx - 12, 126, 1.0, { pose: 'sit', cloth: P.peacock, sari: true, head: 'veil', facing: 1 });
        person(ctx, xx + 8, 128, 1.05, { pose: 'stand', cloth: P.limewhite, cloth2: P.tota, head: 'cap', facing: -1 });
        bucket(ctx, xx + 22, 128, 0.9, P.tota, P.marigold);
      });
      wrapped(W, 1500, 40, (xx) => { goat(ctx, xx, 128, 1, -1); goat(ctx, xx + 26, 129, 0.8, 1); person(ctx, xx + 50, 128, 1, { pose: 'walk', cloth: P.marigold, head: 'turban', facing: -1 }); });
    },
    fore: 'flowers',
    sign: { date: '1 Nov 2011', title: 'Orissa → Odisha' },
    landmarks: [
      {
        // The sign-painter on his ladder: fresh ODISHA above, the old ORISSA vanishing under new paint.
        at: 0.22, plane: 'mid', w: 470, h: 300, y: 428,
        paint: (ctx, rng, _w, h) => {
          const gy = h - 2;
          const green = mix(P.tota, P.neel, 0.45);
          const post = mix(P.khondalite, P.limewhite, 0.35);
          softShadow(ctx, 235, gy, 200, 6, P.ink, 0.25);
          for (const px of [125, 335]) taperStroke(ctx, [{ x: px, y: gy }, { x: px, y: gy - 190 }], 8, post, 1, [1, 1]);
          const bx = 70, by = gy - 262, bw = 320, bh = 116;
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: bx, y: by }, { x: bx + bw, y: by }, { x: bx + bw, y: by + bh }, { x: bx, y: by + bh }]), { x: bx, y: by, w: bw, h: bh }, { base: green, light: mix(green, P.limewhite, 0.25), shade: mix(green, P.ink, 0.3), rim: P.limewhite, rimW: 4, dabs: 40 });
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.font = "800 54px 'Inter Tight', sans-serif";
          ctx.fillStyle = P.limewhite;
          ctx.fillText('ODISHA', bx + bw / 2 - 10, by + 62);
          // wet paint drips under the newest letters
          for (const dx of [62, 88]) taperStroke(ctx, [{ x: bx + bw / 2 + dx, y: by + 60 }, { x: bx + bw / 2 + dx, y: by + 70 }], 2, P.limewhite, 0.9, [1, 0.6]);
          ctx.font = "800 28px 'Inter Tight', sans-serif";
          ctx.fillStyle = withAlpha(P.limewhite, 0.75);
          ctx.fillText('ORISSA', bx + bw / 2 - 10, by + 100);
          // a fresh roller-stripe of green swallowing the old name
          const fresh = mix(green, P.tota, 0.2);
          for (let i = 0; i < 8; i++) taperStroke(ctx, [{ x: bx + bw / 2 - 26 + rng.range(-6, 6), y: by + 76 + i * 3.6 }, { x: bx + bw - 10, y: by + 76 + i * 3.6 + rng.range(-1, 1) }], 6, fresh, 0.95, [0.5, 0.05]);
          // ladder, painter, his bucket; his friend holds the ladder and supervises
          ladder(ctx, 418, gy, 384, by + 6, 20, mix(P.laterite, P.chandan, 0.25));
          person(ctx, 400, by + 128, 1.9, { pose: 'paint', cloth: P.rani, cloth2: mix(P.rani, P.ink, 0.3), head: 'cap', facing: -1, skin: 0.6 });
          bucket(ctx, 412, by + 152, 1.1, P.haldi, P.limewhite);
          person(ctx, 440, gy, 1.7, { pose: 'point', cloth: P.haldi, cloth2: P.peacock, head: 'turban', facing: -1, skin: 0.3 });
          bucket(ctx, 456, gy, 1.3, P.peacock, P.tota);
          bucket(ctx, 30, gy, 1.2, P.rani, P.limewhite);
          person(ctx, 50, gy, 1.5, { pose: 'wave', cloth: P.tota, head: 'none', facing: 1, skin: 0.5 });
        },
      },
      {
        // A cow has chosen the middle of the road for her nap. Everybody waits.
        at: 0.5, plane: 'mid', w: 560, h: 120, y: 442,
        paint: (ctx, rng, _w, h) => {
          const gy = h - 4;
          busBg(ctx, rng, 90, gy, 0.75, P.rani);
          truck(ctx, rng, 240, gy, 0.85, P.marigold, P.peacock);
          // an auto-rickshaw
          ctx.fillStyle = P.haldi;
          ctx.beginPath(); ctx.moveTo(318, gy - 6); ctx.quadraticCurveTo(320, gy - 36, 348, gy - 36); ctx.lineTo(352, gy - 6); ctx.closePath(); ctx.fill();
          ctx.fillStyle = mix(P.ink, P.neel, 0.3);
          ctx.fillRect(316, gy - 34, 34, 4);
          dab(ctx, 322, gy - 4, 4, 4, 0, P.ink, 1); dab(ctx, 348, gy - 4, 4, 4, 0, P.ink, 1);
          person(ctx, 340, gy - 6, 0.9, { pose: 'sit', cloth: P.limewhite, head: 'cap' });
          lyingCow(ctx, 430, gy, 1.5, -1, true);
          person(ctx, 470, gy, 1.2, { pose: 'serve', cloth: P.peacock, head: 'turban', facing: -1, skin: 0.6 });
          taperStroke(ctx, curvePts(457, gy - 18, 452, gy - 22, 448, gy - 17), 3, P.tota, 1);
          person(ctx, 505, gy, 1.1, { pose: 'armsUp', cloth: P.rani, sari: true, head: 'veil', facing: -1 });
          person(ctx, 290, gy, 1.1, { pose: 'stand', cloth: P.limewhite, cloth2: P.marigold, head: 'turban', facing: 1 });
          person(ctx, 160, gy, 1.1, { pose: 'wave', cloth: P.haldi, head: 'none', facing: 1 });
        },
      },
      {
        // Truck art: a painter adds a parrot to a lorry while the chai-wallah pours from a great height.
        at: 0.78, plane: 'mid', w: 430, h: 170, y: 428,
        paint: (ctx, rng, _w, h) => {
          const gy = h - 2;
          truck(ctx, rng, 170, gy, 1.2, P.peacock, P.rani);
          // the new parrot, wet on the side panel
          const px = 120, py = gy - 52;
          dab(ctx, px, py, 9, 6, -0.4, P.tota, 1);
          dab(ctx, px + 7, py - 6, 4.4, 4.4, 0, P.tota, 1);
          dab(ctx, px + 10.5, py - 5, 2, 1.6, 0, P.sindoor, 1);
          taperStroke(ctx, [{ x: px - 7, y: py + 3 }, { x: px - 20, y: py + 12 }], 4, P.haldi, 1, [1, 0.2]);
          person(ctx, 72, gy, 1.6, { pose: 'paint', cloth: P.limewhite, cloth2: P.haldi, head: 'none', facing: 1, skin: 0.7 });
          for (const [i, c] of [P.rani, P.haldi, P.tota, P.sindoor].entries()) bucket(ctx, 30 + i * 11, gy, 0.7, mix(P.limewhite, P.khondalite, 0.2), c);
          goat(ctx, 270, gy, 1.3, -1, 0, P.limewhite);
          // chai poured from on high
          person(ctx, 330, gy, 1.7, { pose: 'wave', cloth: P.marigold, cloth2: P.limewhite, head: 'none', facing: 1 });
          dab(ctx, 340, gy - 64, 4, 3, 0, mix(P.khondalite, P.limewhite, 0.4), 1);
          taperStroke(ctx, curvePts(343, gy - 62, 352, gy - 40, 352, gy - 26), 1.8, mix(P.chandan, P.laterite, 0.2), 0.95, [1, 1]);
          ctx.fillStyle = P.limewhite;
          ctx.fillRect(348, gy - 26, 7, 8);
          charpai(ctx, 392, gy, 48);
          person(ctx, 382, gy - 11, 1.3, { pose: 'sit', cloth: P.peacock, head: 'turban', facing: -1 });
        },
      },
    ],
  }),

  // 33 · 12 Oct 2013 · Phailin — wind and rain, but the shelters glow and everyone gets there.
  r33: () => ({
    id: 'r33',
    sky: {
      stops: [[0, mix(P.neel, P.ink, 0.3)], [0.3, mix(P.neel, P.rani, 0.4)], [0.55, mix(P.rani, P.neel, 0.25)], [0.8, mix(P.rani, P.marigold, 0.25)], [1, mix(P.marigold, P.haldi, 0.4)]],
      clouds: 'storm', cloudTint: mix(P.neel, P.rani, 0.3), halftone: mix(P.neel, P.limewhite, 0.4),
    },
    far: [{ kind: 'sea', a: mix(P.peacock, P.neel, 0.35), b: mix(P.peacock, P.neel, 0.6) }],
    ground: { kind: 'land', plain: mix(P.tota, P.peacock, 0.3), plainDetail: 'grass', path: mix(P.laterite, P.khondalite, 0.35), verge: mix(P.tota, P.neel, 0.25) },
    rain: true,
    mid: (ctx, rng, W) => {
      // palms bent by the wind, a village with its doors shut
      scatter(rng.fork('palms'), W, [60, 130], (x) => {
        const h = rng.range(100, 150);
        wrapped(W, x, h * 0.7, (xx) => coconutPalm(ctx, rng.fork(x), xx, 210, h, rng.range(-0.34, -0.22), 0.3));
      });
      scatter(rng.fork('village'), W, [90, 180], (x) => wrapped(W, x, 30, (xx) => house(ctx, rng.fork(x), xx, 214, rng.range(32, 46), rng.range(34, 44), { roof: 'tile', haze: 0.2 })));
      bank(ctx, rng.fork('bank'), W, 216, mix(P.tota, P.peacock, 0.3), mix(P.tota, P.neel, 0.3));
      wash(ctx, W, 260, mix(P.neel, P.khondalite, 0.3), 0.22);
      for (let i = 0; i < 40; i++) {
        const x = rng.next() * W;
        wrapped(W, x, 30, (xx) => dab(ctx, xx, rng.range(226, 254), rng.range(10, 30), rng.range(1.2, 2.4), 0, rng.pick([P.seafoam, P.limewhite]), 0.3));
      }
      // shelters glow; lines of people walk calmly towards them
      for (const sx0 of [300, 980, 1660]) {
        const sx = sx0 + rng.range(-40, 40);
        wrapped(W, sx, 140, (xx) => {
          cycloneShelter(ctx, rng.fork(sx), xx, 236, 1.05, true);
          flag(ctx, xx + 40, 156, 22, P.rani, 0, -3);
        });
        wrapped(W, sx - 170, 140, (xx) => {
          crowd(ctx, rng.fork(sx + 1), xx - 120, xx + 100, 240, 0.85, { poses: ['walk', 'walk', 'carry'], facing: 1, density: 1.3 });
          brolly(ctx, xx - 60, 200, 11, P.rani, 0.15);
          brolly(ctx, xx + 30, 202, 10, P.haldi, 0.15);
          person(ctx, xx + 120, 240, 0.95, { pose: 'lamp', cloth: P.rani, head: 'hood', facing: -1 });
        });
      }
      scatter(rng.fork('leaves'), W, [40, 90], (x) => dab(ctx, x, rng.range(40, 200), rng.range(2, 4), rng.range(1, 1.8), rng.next() * 3, rng.pick([P.tota, mix(P.tota, P.haldi, 0.4)]), 0.8));
      rain(ctx, rng.fork('rain'), W, 260, 1100, 0.4);
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('puddles'), W, [120, 260], (x) => wrapped(W, x, 50, (xx) => dab(ctx, xx, 132, rng.range(20, 46), 3, 0, P.seafoam, 0.35)));
      // families on the move: bundles, umbrellas, a cow on a rope, volunteers in rani raincoats
      scatter(rng.fork('groups'), W, [330, 480], (x, i) => wrapped(W, x, 90, (xx) => {
        const r2 = rng.fork(x);
        crowd(ctx, r2, xx - 60, xx + 20, 126, 1.05, { poses: ['walk', 'carry', 'walk'], facing: 1, density: 1.4 });
        brolly(ctx, xx - 34, 74, 14, i % 2 ? P.peacock : P.rani, 0.12);
        if (i % 2) {
          cow(ctx, xx + 48, 127, 0.9, { phase: 1 });
          taperStroke(ctx, curvePts(xx + 66, 103, xx + 76, 112, xx + 84, 104), 0.8, P.ink, 0.8);
          person(ctx, xx + 88, 126, 1.05, { pose: 'pull', cloth: P.limewhite, cloth2: P.marigold, head: 'turban', facing: 1 });
        } else {
          person(ctx, xx + 50, 126, 1.1, { pose: 'lamp', cloth: P.rani, head: 'hood', facing: -1 });
          glow(ctx, xx + 43, 96, 18, P.haldi, 0.45);
        }
      }));
      rain(ctx, rng.fork('rain'), W, 140, 500, 0.45);
    },
    fore: 'grass',
    sign: { date: '12 Oct 2013', title: 'Phailin' },
    landmarks: [
      {
        // A big shelter, lit and full: families climbing the ramp, a volunteer holding the door.
        at: 0.14, plane: 'mid', w: 440, h: 260, y: 440,
        paint: (ctx, rng, w, h) => {
          const gy = h - 4, x = w / 2 + 30;
          cycloneShelter(ctx, rng, x, gy, 2, true);
          flag(ctx, x - 80, gy - 156, 34, P.rani, 0, -5);
          flag(ctx, x + 80, gy - 156, 34, P.haldi, 0, -5);
          ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.3);
          polyPath(ctx, [{ x: x - 210, y: gy }, { x: x - 96, y: gy - 60 }, { x: x - 84, y: gy - 60 }, { x: x - 190, y: gy }]);
          ctx.fill();
          for (let i = 0; i < 6; i++) {
            const t = i / 6;
            const px = x - 200 + t * 106, py = gy - t * 58;
            person(ctx, px, py, 1.15, { pose: i % 3 === 1 ? 'carry' : 'walk', cloth: CLOTHS[i % CLOTHS.length], sari: i % 2 === 0, head: i % 2 === 0 ? 'veil' : 'none', facing: 1, phase: i });
          }
          person(ctx, x - 70, gy - 60, 1.25, { pose: 'lamp', cloth: P.rani, head: 'hood', facing: -1 });
          glow(ctx, x - 79, gy - 90, 26, P.haldi, 0.5);
          rain(ctx, rng, w, h, 160, 0.3);
        },
      },
      {
        // A woman carries her goat across her shoulders; her son carries the rooster; grandpa holds the umbrella.
        at: 0.38, plane: 'near', w: 230, h: 110, y: 556,
        paint: (ctx, rng, w, h) => {
          const gy = h - 4;
          person(ctx, 70, gy, 1.5, { pose: 'carry', cloth: P.rani, cloth2: P.haldi, sari: true, head: 'veil', facing: 1, skin: 0.5 });
          goat(ctx, 62, gy - 60, 0.95, 1);
          person(ctx, 118, gy, 1.0, { pose: 'walk', cloth: P.haldi, head: 'none', facing: 1, skin: 0.7, phase: 2 });
          rooster(ctx, 128, gy - 14, 0.9, 1);
          person(ctx, 30, gy, 1.45, { pose: 'stand', cloth: P.limewhite, cloth2: P.peacock, head: 'turban', facing: 1, skin: 0.8 });
          brolly(ctx, 52, gy - 66, 30, P.peacock, 0.12);
          person(ctx, 180, gy, 1.4, { pose: 'wave', cloth: P.rani, head: 'hood', facing: -1 });
          rain(ctx, rng, w, h, 70, 0.35);
        },
      },
      {
        // Buses ferry people inland; a volunteer with a megaphone keeps everyone calm — and the goat gets a roof seat.
        at: 0.62, plane: 'mid', w: 460, h: 170, y: 446,
        paint: (ctx, rng, w, h) => {
          const gy = h - 4;
          busBg(ctx, rng, 220, gy, 1.35, P.rani);
          for (let i = 0; i < 4; i++) dab(ctx, 160 + i * 34, gy - 64, 12, 6, 0, [P.haldi, P.peacock, P.marigold, P.limewhite][i], 1);
          goat(ctx, 250, gy - 64, 0.8, -1);
          crowd(ctx, rng, 330, 420, gy, 1.2, { poses: ['walk', 'carry'], facing: -1, density: 1.2 });
          // volunteer with a megaphone on a crate
          ctx.fillStyle = mix(P.laterite, P.chandan, 0.3);
          ctx.fillRect(40, gy - 14, 26, 14);
          person(ctx, 54, gy - 14, 1.4, { pose: 'point', cloth: P.rani, head: 'hood', facing: 1 });
          ctx.fillStyle = P.haldi;
          polyPath(ctx, [{ x: 62, y: gy - 50 }, { x: 74, y: gy - 55 }, { x: 74, y: gy - 43 }]);
          ctx.fill();
          for (const r of [5, 9]) { ctx.strokeStyle = withAlpha(P.limewhite, 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(76, gy - 49, r, -0.6, 0.6); ctx.stroke(); }
          rain(ctx, rng, w, h, 160, 0.3);
        },
      },
      {
        // Dry under the shelter: a big pot of khichdi, a sleeping child, a cat that got there first.
        at: 0.86, plane: 'mid', w: 380, h: 250, y: 440,
        paint: (ctx, rng, w, h) => {
          const gy = h - 4, x = w / 2;
          cycloneShelter(ctx, rng, x, gy, 2.2, true);
          glow(ctx, x, gy - 26, 90, P.marigold, 0.4);
          ctx.fillStyle = P.laterite;
          ctx.beginPath(); ctx.ellipse(x, gy - 10, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
          glow(ctx, x, gy - 2, 16, P.marigold, 0.8);
          for (let i = 0; i < 3; i++) taperStroke(ctx, curvePts(x - 4 + i * 4, gy - 22, x - 8 + i * 4, gy - 32, x - 2 + i * 4, gy - 44), 1.4, P.limewhite, 0.5);
          person(ctx, x - 26, gy, 1.2, { pose: 'serve', cloth: P.rani, head: 'hood', facing: 1 });
          person(ctx, x - 62, gy, 1.15, { pose: 'sit', cloth: P.haldi, sari: true, head: 'veil', facing: 1 });
          person(ctx, x + 30, gy, 1.1, { pose: 'sit', cloth: P.peacock, head: 'turban', facing: -1 });
          person(ctx, x + 58, gy, 1.0, { pose: 'sit', cloth: P.tota, sari: true, head: 'veil', facing: -1 });
          dab(ctx, x + 68, gy - 14, 7, 3.4, 0, P.marigold, 1);
          cat(ctx, x - 96, gy, 1.1, mix(P.marigold, P.limewhite, 0.3), 1);
          rain(ctx, rng, w, h * 0.55, 90, 0.25);
        },
      },
    ],
  }),

  // 34 · 20 Feb 2014 · Odia becomes a classical language — a world made of the alphabet chart.
  r34: () => ({
    id: 'r34',
    sky: { stops: [[0, mix(P.seafoam, P.peacock, 0.15)], [0.55, mix(P.skyCream, P.haldi, 0.2)], [1, mix(P.skyCream, P.rani, 0.12)]], sun: { x: 1120, y: 96, r: 30 }, clouds: 'cumulus' },
    far: [{ kind: 'none', a: P.tota }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.3), plainDetail: 'grass', path: mix(P.rani, P.chandan, 0.3), verge: mix(P.tota, P.haldi, 0.15) },
    mid: (ctx, rng, W) => {
      // trees peep over the chart; the chart hangs from bamboo poles along the whole school ground
      scatter(rng.fork('trees'), W, [70, 130], (x) => {
        const tw = rng.range(80, 120);
        wrapped(W, x, tw, (xx) => broadTree(ctx, rng.fork(x), xx, 150, tw, rng.range(110, 140), 0.15));
      });
      scatter(rng.fork('palms'), W, [260, 420], (x) => wrapped(W, x, 50, (xx) => coconutPalm(ctx, rng.fork(x), xx, 140, rng.range(120, 140), rng.range(-0.1, 0.1), 0.15)));
      const top = 34, bottom = 230;
      alphabetChart(ctx, rng.fork('chart'), W, top, bottom);
      const bamboo = mix(P.haldi, P.laterite, 0.35);
      taperStroke(ctx, [{ x: -10, y: top - 3 }, { x: W + 10, y: top - 3 }], 5, bamboo, 1, [1, 1]);
      for (let x = 0; x < W; x += W / 8) {
        wrapped(W, x, 6, (xx) => {
          taperStroke(ctx, [{ x: xx, y: 252 }, { x: xx, y: top - 16 }], 5, bamboo, 1, [1, 1]);
          flag(ctx, xx, top - 14, 18, rng.pick([P.rani, P.haldi, P.tota]), 0, 2);
        });
      }
      for (let x = 0; x < W; x += 40) wrapped(W, x, 30, (xx) => flowerBed(ctx, rng.fork(x), xx, 252, 44, 20));
    },
    near: (ctx, rng, W) => {
      // rows of children on mats, reciting with slates and books
      scatter(rng.fork('class'), W, [380, 560], (x, i) => wrapped(W, x, 110, (xx) => {
        const r2 = rng.fork(x);
        mat(ctx, xx, 130, 110, i % 2 ? P.rani : P.haldi, i % 2 ? mix(P.rani, P.skyCream, 0.3) : P.marigold);
        for (let k = 0; k < 5; k++) {
          const pose: Pose = r2.pick(['read', 'read', 'armsUp', 'sit']);
          person(ctx, xx - 44 + k * 22, 126, 0.95, { pose, cloth: r2.pick([P.peacock, P.limewhite, P.rani, P.haldi]), cloth2: P.neel, sari: k % 2 === 1, head: k % 2 ? 'bun' : 'none', facing: 1, skin: r2.next() });
        }
        pothi(ctx, xx + 70, 130, 24);
        if (i % 3 === 0) { bucket(ctx, xx - 72, 130, 0.7, P.ink, P.neel); person(ctx, xx - 90, 130, 1.25, { pose: 'point', cloth: P.peacock, cloth2: P.rani, sari: true, head: 'bun', facing: 1 }); }
      }));
      for (let x = 0; x < W; x += 30) wrapped(W, x, 30, (xx) => flowerBed(ctx, rng.fork(x), xx, 139, 40, 9));
    },
    fore: 'flowers',
    sign: { date: '20 Feb 2014', title: 'Classical Odia' },
    landmarks: [
      {
        // The teacher points at ଅ on the big slate; every hand in the class shoots up.
        at: 0.15, plane: 'mid', w: 320, h: 210, y: 456,
        paint: (ctx, rng, _w, h) => {
          const gy = h - 6;
          const wood = mix(P.laterite, P.ink, 0.2);
          for (const [x0, x1] of [[150, 130], [230, 250]]) taperStroke(ctx, [{ x: x0, y: 40 }, { x: x1, y: gy }], 4, wood, 1, [1, 1]);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 120, y: 30 }, { x: 260, y: 30 }, { x: 260, y: 130 }, { x: 120, y: 130 }]), { x: 120, y: 30, w: 140, h: 100 }, { base: mix(P.ink, P.neel, 0.35), light: mix(P.neel, P.ink, 0.4), shade: P.ink, rim: mix(P.laterite, P.chandan, 0.2), rimW: 6, dabs: 30 });
          ctx.textAlign = 'center';
          ctx.font = ODIA_FONT(72);
          ctx.fillStyle = withAlpha(P.limewhite, 0.92);
          ctx.fillText('ଅ', 190, 110);
          for (let i = 0; i < 6; i++) dab(ctx, 140 + rng.next() * 100, 40 + rng.next() * 80, rng.range(4, 10), 1.4, rng.next(), P.limewhite, 0.08);
          person(ctx, 290, gy, 1.9, { pose: 'point', cloth: P.peacock, cloth2: P.rani, sari: true, head: 'bun', facing: -1, skin: 0.45 });
          taperStroke(ctx, [{ x: 276, y: gy - 50 }, { x: 236, y: gy - 92 }], 2, mix(P.laterite, P.chandan, 0.3), 1, [1, 0.4]);
          for (let k = 0; k < 5; k++) person(ctx, 30 + k * 22, gy, 1.25, { pose: k === 2 ? 'wave' : 'armsUp', cloth: [P.rani, P.limewhite, P.haldi, P.peacock, P.tota][k], sari: k % 2 === 1, head: k % 2 ? 'bun' : 'none', facing: 1, skin: k / 5, phase: k });
        },
      },
      {
        // A poet under the banyan scratches verses onto palm leaf with an iron stylus; a parrot checks the spelling.
        at: 0.42, plane: 'near', w: 320, h: 190, y: 554,
        paint: (ctx, rng, _w, h) => {
          const gy = h - 6;
          broadTree(ctx, rng, 150, gy, 200, 170, 0);
          taperStroke(ctx, curvePts(160, gy - 120, 220, gy - 132, 268, gy - 124), 6, mix(P.laterite, P.ink, 0.4), 1, [1, 0.4]);
          mat(ctx, 170, gy, 90, P.rani, P.haldi);
          person(ctx, 160, gy - 4, 1.7, { pose: 'read', cloth: P.limewhite, cloth2: P.haldi, head: 'none', facing: 1, skin: 0.6 });
          pothi(ctx, 186, gy - 38, 28, true);
          taperStroke(ctx, [{ x: 178, y: gy - 30 }, { x: 186, y: gy - 46 }], 1.2, P.khondalite, 1, [1, 0.2]);
          for (let k = 0; k < 3; k++) pothi(ctx, 216 + k * 4, gy - k * 12, 30);
          // the parrot on the branch, leaning in
          const bx = 236, by = gy - 128;
          dab(ctx, bx, by - 6, 6, 8, 0.5, P.tota, 1);
          dab(ctx, bx - 4, by - 14, 4.4, 4.4, 0, P.tota, 1);
          dab(ctx, bx - 8, by - 13, 2, 1.6, 0, P.sindoor, 1);
          dab(ctx, bx - 5, by - 15, 0.9, 0.9, 0, P.ink, 1);
          taperStroke(ctx, [{ x: bx + 2, y: by }, { x: bx + 10, y: by + 14 }], 3, P.peacock, 1, [1, 0.3]);
          cat(ctx, 90, gy, 1.2, mix(P.marigold, P.limewhite, 0.35), 1);
        },
      },
      {
        // Grandmother shows a palm-leaf book to a girl, who shows her ଓ on a tablet. Old letters, new screens.
        at: 0.68, plane: 'near', w: 220, h: 110, y: 554,
        paint: (ctx, _rng, _w, h) => {
          const gy = h - 4;
          bench(ctx, 110, gy, 120, P.peacock);
          person(ctx, 82, gy - 8, 1.45, { pose: 'sit', cloth: P.limewhite, cloth2: P.rani, sari: true, head: 'veil', facing: 1, skin: 0.7 });
          pothi(ctx, 104, gy - 40, 26, true);
          person(ctx, 140, gy - 8, 1.15, { pose: 'sit', cloth: P.haldi, cloth2: P.tota, head: 'bun', facing: -1, skin: 0.3 });
          ctx.fillStyle = P.ink;
          ctx.fillRect(116, gy - 48, 16, 20);
          ctx.fillStyle = mix(P.seafoam, P.limewhite, 0.4);
          ctx.fillRect(117.5, gy - 46.5, 13, 17);
          ctx.textAlign = 'center';
          ctx.font = ODIA_FONT(14);
          ctx.fillStyle = P.rani;
          ctx.fillText('ଓ', 124, gy - 33);
          glow(ctx, 124, gy - 38, 20, P.seafoam, 0.25);
        },
      },
      {
        // A goat has started eating a letter chart. The class is negotiating.
        at: 0.9, plane: 'mid', w: 330, h: 200, y: 456,
        paint: (ctx, rng, _w, hh) => scaled(ctx, hh, 1.35, (h) => {
          const gy = h - 6;
          const wood = mix(P.laterite, P.ink, 0.2);
          for (const px of [70, 150]) taperStroke(ctx, [{ x: px, y: gy }, { x: px, y: gy - 112 }], 3, wood, 1, [1, 1]);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 60, y: gy - 110 }, { x: 160, y: gy - 110 }, { x: 160, y: gy - 30 }, { x: 146, y: gy - 24 }, { x: 60, y: gy - 34 }]), { x: 60, y: gy - 110, w: 100, h: 86 }, { base: P.limewhite, light: P.limewhite, shade: mix(P.limewhite, P.chandan, 0.4), rim: P.rani, rimW: 4, dabs: 16 });
          ctx.textAlign = 'center';
          ctx.font = ODIA_FONT(52);
          ctx.fillStyle = P.peacock;
          ctx.fillText('କ', 98, gy - 50);
          chartPicture(ctx, rng, 'କ', 138, gy - 40);
          goat(ctx, 186, gy, 1.5, -1, 0, P.limewhite);
          person(ctx, 30, gy, 1.4, { pose: 'pull', cloth: P.rani, head: 'bun', facing: 1, skin: 0.5 });
          person(ctx, 222, gy, 1.3, { pose: 'armsUp', cloth: P.haldi, head: 'none', facing: -1, skin: 0.2 });
        }),
      },
    ],
  }),

  // 35 · 2018 · Hockey comes home — a floodlit night at the stadium.
  r35: () => ({
    id: 'r35',
    sky: { stops: NIGHT_SKY, moon: { x: 210, y: 92, r: 20 }, stars: 140, clouds: 'streak', cloudTint: mix(P.rani, P.skyCream, 0.3), halftone: mix(P.neel, P.peacock, 0.5), sun: { x: 900, y: 470, r: 0, colour: P.rani } },
    far: [{ kind: 'hills', a: mix(P.neel, P.ink, 0.15), b: P.ink, height: [8, 34], haze: 0.05 }],
    ground: { kind: 'land', plain: NIGHT_PLAIN, plainDetail: 'grass', path: mix(P.neel, P.khondalite, 0.45), verge: mix(P.tota, P.neel, 0.45) },
    mid: (ctx, rng, W) => {
      // the city: blocks with lit windows
      scatter(rng.fork('blocks'), W, [50, 110], (x) => {
        const bw = rng.range(46, 84), bh = rng.range(50, 120);
        const body = rng.pick([mix(P.neel, P.peacock, 0.3), mix(P.neel, P.rani, 0.25), mix(P.neel, P.ink, 0.2)]);
        const on = rng.pick([P.haldi, mix(P.haldi, P.limewhite, 0.5), mix(P.rani, P.skyCream, 0.3)]);
        wrapped(W, x, bw / 2, (xx) => modernBlock(ctx, rng.fork(x), xx, 214, bw, bh, body, { lit: 0.5, glowColour: on }));
      });
      dimmed(ctx, W, 260, NIGHT, 0.45, (c) => {
        scatter(rng.fork('trees'), W, [60, 110], (x) => wrapped(W, x, 50, (xx) => broadTree(c, rng.fork(x), xx, 224, rng.range(60, 90), rng.range(56, 80), 0)));
        bank(c, rng.fork('bank'), W, 222, mix(P.tota, P.peacock, 0.3), mix(P.neel, P.tota, 0.4));
      });
      // boulevard: lamps, bunting, fans heading to the match
      ctx.fillStyle = mix(P.neel, P.khondalite, 0.35);
      ctx.fillRect(0, 230, W, 14);
      for (let x = 0; x < W; x += 128) {
        wrapped(W, x, 140, (xx) => bunting(ctx, xx, 168, xx + 128, 168, 10, [P.rani, P.haldi, P.peacock, P.tota, P.limewhite]));
        wrapped(W, x, 30, (xx) => streetLamp(ctx, xx, 232, 64, true));
      }
      dimmed(ctx, W, 260, NIGHT, 0.2, (c) => {
        scatter(rng.fork('fans'), W, [200, 340], (x) => wrapped(W, x, 80, (xx) => {
          crowd(c, rng.fork(x), xx - 60, xx + 60, 236, 0.8, { poses: ['walk', 'wave', 'walk'], facing: 1, density: 1.3 });
          flag(c, xx - 20, 216, 26, rng.pick([P.rani, P.haldi]), 0, 2);
        }));
      });
      // a giant hockey stick and ball on the roundabout
      wrapped(W, 1180, 60, (xx) => {
        glow(ctx, xx, 200, 80, P.haldi, 0.25);
        ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.3);
        ctx.fillRect(xx - 30, 214, 60, 12);
        taperStroke(ctx, [{ x: xx - 6, y: 214 }, { x: xx + 12, y: 110 }], 7, P.rani, 1, [1, 1]);
        taperStroke(ctx, curvePts(xx - 6, 214, xx - 14, 222, xx - 26, 214, 6), 8, P.rani, 1, [1, 0.7]);
        for (let i = 0; i < 5; i++) dab(ctx, xx - 3 + i * 3.4, 196 - i * 19, 4.6, 1.6, -1.4, P.haldi, 1);
        dab(ctx, xx + 22, 206, 9, 9, 0, P.limewhite, 1);
        dab(ctx, xx + 19, 203, 3, 3, 0, mix(P.limewhite, P.khondalite, 0.3), 1);
      });
    },
    near: (ctx, rng, W) => {
      // the e-scooter lane: kerb, railings, food carts and fans with flags
      const kerbY = 132;
      for (let x = 0; x < W; x += 32) { ctx.fillStyle = (x / 32) % 2 ? P.haldi : P.ink; ctx.fillRect(x, kerbY, 32, 6); }
      dimmed(ctx, W, 140, NIGHT, 0.22, (c) => {
        for (let x = 0; x < W; x += 16) taperStroke(c, [{ x, y: kerbY }, { x, y: kerbY - 18 }], 1.6, mix(P.limewhite, P.khondalite, 0.3), 1, [1, 1]);
        c.fillStyle = mix(P.limewhite, P.khondalite, 0.3);
        c.fillRect(0, kerbY - 20, W, 2.4);
        scatter(rng.fork('fans'), W, [260, 400], (x, i) => wrapped(W, x, 70, (xx) => {
          crowd(c, rng.fork(x), xx - 30, xx + 30, kerbY - 6, 1.05, { poses: ['wave', 'armsUp', 'stand'], density: 1.3 });
          flag(c, xx + 36, kerbY - 6, 44, i % 2 ? P.rani : P.haldi, 0, 3);
        }));
      });
      scatter(rng.fork('carts'), W, [600, 800], (x) => wrapped(W, x, 50, (xx) => {
        glow(ctx, xx, kerbY - 40, 46, P.marigold, 0.5);
        ctx.fillStyle = P.peacock;
        ctx.fillRect(xx - 26, kerbY - 30, 52, 20);
        ctx.fillStyle = P.rani;
        ctx.fillRect(xx - 30, kerbY - 56, 60, 6);
        for (const k of [-1, 1]) taperStroke(ctx, [{ x: xx + k * 26, y: kerbY - 10 }, { x: xx + k * 26, y: kerbY - 52 }], 1.6, P.khondalite, 1, [1, 1]);
        for (const k of [-1, 1]) dab(ctx, xx + k * 18, kerbY - 6, 5, 5, 0, P.ink, 1);
        for (let i = 0; i < 4; i++) dab(ctx, xx - 14 + i * 9, kerbY - 33, 3.4, 2, 0, rng.pick([P.haldi, P.marigold, P.chandan]), 1);
        dab(ctx, xx, kerbY - 46, 2, 3, 0, P.haldi, 1);
        person(ctx, xx + 40, kerbY - 6, 1.05, { pose: 'serve', cloth: P.limewhite, cloth2: P.tota, head: 'cap', facing: -1 });
      }));
    },
    fore: 'none',
    sign: { date: '2018', title: 'Hockey' },
    landmarks: [
      {
        // The stadium under its floodlights, crowd specks in every colour, banners in plain rani and haldi.
        at: 0.26, plane: 'mid', w: 640, h: 300, y: 446,
        paint: (ctx, rng, w, h) => {
          const gy = h - 6, x = w / 2;
          for (const k of [-0.5, 0.5]) {
            const px = x + k * 560 * 0.9, py = gy - 130 * 1.73;
            ctx.fillStyle = withAlpha(P.limewhite, 0.07);
            polyPath(ctx, [{ x: px - 6, y: py }, { x: px + 6, y: py }, { x: x - k * 120, y: gy - 50 }, { x: x - k * 300, y: gy - 30 }]);
            ctx.fill();
          }
          stadium(ctx, rng, x, gy, 560, 130);
          for (let i = 0; i < 8; i++) {
            const bx = x - 210 + i * 60;
            ctx.fillStyle = i % 2 ? P.rani : P.haldi;
            polyPath(ctx, [{ x: bx - 8, y: gy - 66 }, { x: bx + 8, y: gy - 66 }, { x: bx + 8, y: gy - 30 }, { x: bx, y: gy - 24 }, { x: bx - 8, y: gy - 30 }]);
            ctx.fill();
          }
          glow(ctx, x, gy - 100, 240, P.haldi, 0.12);
          crowd(ctx, rng, 40, w - 40, gy, 1.1, { poses: ['walk', 'wave', 'armsUp'], cloths: [P.rani, P.haldi, P.peacock, P.limewhite, P.tota], density: 1.3 });
        },
      },
      {
        // Street hockey under the lamp: two bricks for a goal — and the dog has the ball.
        at: 0.5, plane: 'near', w: 260, h: 110, y: 552,
        paint: (ctx, _rng, _w, h) => {
          const gy = h - 6;
          streetLamp(ctx, 40, gy, 80, true, P.haldi);
          glow(ctx, 130, gy - 10, 110, P.haldi, 0.18);
          for (const bx of [60, 84]) { ctx.fillStyle = P.laterite; ctx.fillRect(bx - 5, gy - 6, 10, 6); }
          person(ctx, 120, gy, 1.3, { pose: 'hockey', cloth: P.rani, cloth2: P.limewhite, head: 'none', facing: 1, skin: 0.6 });
          person(ctx, 170, gy, 1.2, { pose: 'hockey', cloth: P.haldi, cloth2: P.neel, head: 'cap', facing: -1, skin: 0.3 });
          person(ctx, 72, gy, 1.15, { pose: 'armsUp', cloth: P.peacock, head: 'bun', facing: 1, skin: 0.5 });
          // the dog, running off with the ball
          const dx = 218, dc = mix(P.chandan, P.limewhite, 0.3);
          for (const [lx, a] of [[-6, -3], [-3, 3], [5, -3], [8, 3]] as const) taperStroke(ctx, [{ x: dx + lx, y: gy - 9 }, { x: dx + lx + a, y: gy }], 2, dc, 1);
          dab(ctx, dx, gy - 11, 10, 5, 0, dc, 1);
          dab(ctx, dx + 11, gy - 16, 4.6, 4, 0, dc, 1);
          dab(ctx, dx + 9, gy - 20, 2, 3, 0.4, mix(P.chandan, P.laterite, 0.4), 1);
          dab(ctx, dx + 16, gy - 14, 2.2, 2.2, 0, P.limewhite, 1);
          taperStroke(ctx, curvePts(dx - 9, gy - 12, dx - 14, gy - 18, dx - 12, gy - 22), 2, dc, 1, [1, 0.3]);
        },
      },
      {
        // The whole family on one scooter, flag flying, off to the match.
        at: 0.72, plane: 'mid', w: 240, h: 130, y: 448,
        paint: (ctx, _rng, _w, h) => {
          const gy = h - 4, x = 120;
          glow(ctx, x, gy - 30, 90, P.haldi, 0.2);
          scooterRider(ctx, x, gy, 2, P.peacock, { cloth: P.limewhite, head: 'helmet', lit: true, pillion: P.rani });
          person(ctx, x + 10, gy - 30, 1.0, { pose: 'wave', cloth: P.haldi, head: 'none', facing: 1, skin: 0.2 });
          person(ctx, x - 40, gy - 14, 1.5, { pose: 'sit', cloth: P.rani, sari: true, head: 'veil', facing: 1, skin: 0.6 });
          flag(ctx, x - 52, gy - 26, 70, P.rani, 0, -4);
          flag(ctx, x - 58, gy - 22, 60, P.haldi, 0, -3);
        },
      },
      {
        // Far away up north, Rourkela's new stadium glows by the steel town.
        at: 0.9, plane: 'far', w: 480, h: 330, y: 452,
        paint: (ctx, rng, w, h) => {
          const top = h - 170;
          blastFurnace(ctx, rng, 110, top + 6, 0.8, 0.0);
          wash(ctx, w, h, NIGHT, 0.45);
          ctx.fillStyle = mix(mix(P.tota, P.neel, 0.6), P.ink, 0.3);
          ctx.beginPath();
          ctx.moveTo(0, h);
          ctx.quadraticCurveTo(40, top + 10, 140, top + 4);
          ctx.lineTo(380, top);
          ctx.quadraticCurveTo(450, top + 20, w, h);
          ctx.closePath();
          ctx.fill();
          stadium(ctx, rng, 290, top + 4, 220, 56, 0.1);
          glow(ctx, 290, top - 30, 140, P.haldi, 0.12);
        },
      },
    ],
  }),

  // 36 · 17 Jan 2024 · The parikrama around Shree Mandira: lawns, shade and pilgrims by the outer wall.
  r36: () => ({
    id: 'r36',
    sky: { stops: DAY_SKY, sun: { x: 250, y: 110, r: 34 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.tota, P.skyCream, 0.55), b: P.peacock, height: [6, 22], trees: true, haze: 0.55 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.2), plainDetail: 'grass', path: mix(P.rani, P.chandan, 0.35), verge: mix(P.tota, P.haldi, 0.15) },
    mid: (ctx, rng, W) => {
      // small shrines of the temple compound peep over the Meghanada Pacheri
      scatter(rng.fork('shrines'), W, [380, 560], (x) => wrapped(W, x, 30, (xx) => rekhaDeula(ctx, rng.fork(x), xx, 178, rng.range(56, 80), { stone: P.limewhite, haze: 0.35, flagColour: rng.pick([P.sindoor, P.haldi]) })));
      scatter(rng.fork('trees'), W, [140, 260], (x) => wrapped(W, x, 50, (xx) => broadTree(ctx, rng.fork(x), xx, 178, rng.range(60, 90), rng.range(50, 70), 0.3)));
      pacheri(ctx, rng.fork('wall'), 0, W, 200, 40.96);
      // the heritage corridor: paving, then lawns
      ctx.fillStyle = mix(P.limewhite, P.chandan, 0.3);
      ctx.fillRect(0, 200, W, 16);
      ctx.fillStyle = withAlpha(mix(P.chandan, P.khondalite, 0.4), 0.5);
      for (let x = 0; x < W; x += 24) ctx.fillRect(x, 200, 1, 16);
      ctx.fillRect(0, 207, W, 1);
      vGradient(ctx, 0, 216, W, 44, [[0, mix(P.tota, P.haldi, 0.3), 1], [1, mix(P.tota, P.peacock, 0.15), 1]]);
      dabField(ctx, rng, 0, 216, W, 44, { n: 700, r: [1.5, 3], colours: [mix(P.tota, P.haldi, 0.45), mix(P.tota, P.neel, 0.2)], alpha: [0.3, 0.5] });
      scatter(rng.fork('hedge'), W, [90, 170], (x) => wrapped(W, x, 30, (xx) => bougainvillea(ctx, rng.fork(x), xx, 232, rng.range(30, 52), rng.range(12, 18))));
      // shade umbrellas, lamps, benches, pilgrims walking clockwise
      scatter(rng.fork('shade'), W, [230, 330], (x, i) => wrapped(W, x, 50, (xx) => {
        if (i % 2) chhati(ctx, xx, 196, 22, [P.rani, P.haldi, P.peacock, P.sindoor]);
        else brolly(ctx, xx, 194, 22, i % 4 ? P.rani : P.peacock);
        bench(ctx, xx + 4, 216, 26, P.laterite);
      }));
      for (let x = 60; x < W; x += 256) wrapped(W, x, 20, (xx) => streetLamp(ctx, xx, 214, 40, false));
      scatter(rng.fork('pilgrims'), W, [180, 300], (x) => wrapped(W, x, 60, (xx) => crowd(ctx, rng.fork(x), xx - 40, xx + 40, 214, 0.8, { poses: ['walk'], facing: 1, density: 1.3, cloths: [P.rani, P.limewhite, P.haldi, P.marigold, P.peacock, P.rani] })));
    },
    near: (ctx, rng, W) => {
      // clipped lawn stripes and two long bougainvillea hedges
      for (let y = 30; y < 120; y += 18) { ctx.fillStyle = withAlpha(mix(P.tota, P.haldi, 0.5), 0.18); ctx.fillRect(0, y, W, 8); }
      hedgeRow(ctx, rng.fork('hedgeBack'), W, 44, 12, 0.15);
      hedgeRow(ctx, rng.fork('hedge'), W, 138, 16);
      scatter(rng.fork('folk'), W, [360, 520], (x, i) => wrapped(W, x, 60, (xx) => {
        const r2 = rng.fork(x);
        if (i % 3 === 0) {
          // flower-seller with a basket of garlands
          person(ctx, xx, 124, 1.1, { pose: 'sit', cloth: P.marigold, sari: true, head: 'veil', facing: 1 });
          dab(ctx, xx + 16, 121, 9, 4, 0, mix(P.laterite, P.chandan, 0.4), 1);
          for (let k = 0; k < 8; k++) dab(ctx, xx + 10 + k * 1.6, 117 - (k % 2) * 2, 1.8, 1.8, 0, k % 3 ? P.marigold : P.rani, 1);
        } else crowd(ctx, r2, xx - 30, xx + 30, 124, 1.05, { poses: ['walk', 'walk', 'stand'], facing: 1, cloths: [P.rani, P.limewhite, P.haldi, P.peacock], density: 1.4 });
        for (let k = 0; k < 3; k++) pigeon(ctx, xx + 50 + k * 9, 126, 0.9, false, k % 2 ? 1 : -1);
      }));
    },
    fore: 'flowers',
    sign: { date: '17 Jan 2024', title: 'Parikrama' },
    landmarks: [
      {
        // Shree Jagannath temple: lime-white, the Nilachakra and the flag above the wall — a backdrop only.
        at: 0.5, plane: 'far', w: 420, h: 380, y: 452,
        paint: (ctx, rng, w, h) => {
          jagannathTemple(ctx, rng, w / 2 + 10, h - 2, 1.22, 0.1);
        },
      },
      {
        // The Lion Gate with the Aruna Stambha before it; pilgrims arriving.
        at: 0.22, plane: 'mid', w: 300, h: 230, y: 418,
        paint: (ctx, rng, w, h) => {
          const gy = h - 18, x = w / 2 + 30;
          singhadwara(ctx, rng, x, gy, 1.5);
          // Aruna Stambha: a slender sixteen-sided pillar with Aruna seated on top
          const ax = x - 110, stone = mix(P.khondalite, P.ink, 0.25);
          ctx.fillStyle = stone;
          ctx.fillRect(ax - 9, gy - 10, 18, 10);
          taperStroke(ctx, [{ x: ax, y: gy - 10 }, { x: ax, y: gy - 120 }], 8, stone, 1, [1, 0.85]);
          for (let i = 0; i < 6; i++) dab(ctx, ax + 1.5, gy - 20 - i * 16, 1, 6, 0, mix(P.khondalite, P.limewhite, 0.4), 0.5);
          dab(ctx, ax, gy - 124, 9, 4, 0, stone, 1);
          dab(ctx, ax, gy - 134, 4.4, 7, 0, stone, 1);
          dab(ctx, ax, gy - 143, 3, 3, 0, stone, 1);
          crowd(ctx, rng, 20, w - 20, h - 2, 1.05, { poses: ['walk', 'stand'], facing: 1, density: 1.3, cloths: [P.rani, P.limewhite, P.haldi, P.marigold, P.peacock] });
        },
      },
      {
        // A boy feeds the pigeons; one has settled on his grandfather's head and will not be moved.
        at: 0.4, plane: 'mid', w: 360, h: 200, y: 448,
        paint: (ctx, rng, _w, hh) => scaled(ctx, hh, 1.5, (h) => {
          const gy = h - 4;
          bench(ctx, 70, gy, 60, P.laterite);
          person(ctx, 64, gy - 8, 1.5, { pose: 'sit', cloth: P.limewhite, cloth2: P.haldi, head: 'none', facing: 1, skin: 0.8 });
          pigeon(ctx, 72, gy - 62, 1.1, false, -1);
          person(ctx, 130, gy, 1.2, { pose: 'wave', cloth: P.rani, head: 'none', facing: 1, skin: 0.4 });
          for (let i = 0; i < 9; i++) dab(ctx, 150 + rng.next() * 50, gy - rng.next() * 3, 1, 0.8, 0, P.haldi, 1);
          for (let i = 0; i < 6; i++) pigeon(ctx, 150 + i * 13 + rng.range(-3, 3), gy, 1.1, false, i % 2 ? 1 : -1);
          for (let i = 0; i < 4; i++) pigeon(ctx, 150 + i * 20, gy - 40 - rng.next() * 30, 1.1, true, i % 2 ? 1 : -1);
        }),
      },
      {
        // The cow has taken the shade umbrella; the pilgrims stand in the sun and don't mind.
        at: 0.72, plane: 'mid', w: 280, h: 140, y: 448,
        paint: (ctx, _rng, _w, h) => {
          const gy = h - 4;
          brolly(ctx, 120, gy - 74, 52, P.rani);
          softShadow(ctx, 120, gy, 60, 6, P.ink, 0.3);
          lyingCow(ctx, 118, gy, 1.7, 1, true);
          person(ctx, 210, gy, 1.3, { pose: 'serve', cloth: P.peacock, head: 'cap', facing: -1 });
          person(ctx, 236, gy, 1.25, { pose: 'stand', cloth: P.rani, sari: true, head: 'veil', facing: -1 });
          person(ctx, 30, gy, 1.3, { pose: 'stand', cloth: P.haldi, cloth2: P.limewhite, head: 'turban', facing: 1 });
        },
      },
      {
        // An e-cart carries elderly pilgrims round the corridor.
        at: 0.9, plane: 'near', w: 200, h: 100, y: 552,
        paint: (ctx, rng, _w, h) => {
          const gy = h - 4, x = 100;
          softShadow(ctx, x, gy, 60, 4, P.ink, 0.3);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 56, y: gy - 8 }, { x: x - 56, y: gy - 24 }, { x: x + 56, y: gy - 24 }, { x: x + 60, y: gy - 8 }]), { x: x - 56, y: gy - 24, w: 116, h: 16 }, { base: P.limewhite, light: P.limewhite, shade: mix(P.limewhite, P.khondalite, 0.3), dabs: 6 });
          ctx.fillStyle = P.rani;
          ctx.fillRect(x - 60, gy - 64, 120, 6);
          for (const k of [-54, 0, 54]) taperStroke(ctx, [{ x: x + k, y: gy - 24 }, { x: x + k, y: gy - 60 }], 2, mix(P.khondalite, P.limewhite, 0.3), 1, [1, 1]);
          for (const k of [-38, 40]) { dab(ctx, x + k, gy - 6, 6, 6, 0, P.ink, 1); dab(ctx, x + k, gy - 6, 2, 2, 0, P.khondalite, 1); }
          person(ctx, x - 34, gy - 22, 1.15, { pose: 'sit', cloth: P.limewhite, cloth2: P.rani, sari: true, head: 'veil', facing: 1, skin: 0.8 });
          person(ctx, x - 6, gy - 22, 1.15, { pose: 'sit', cloth: P.haldi, head: 'turban', facing: 1, skin: 0.6 });
          person(ctx, x + 30, gy - 22, 1.15, { pose: 'sit', cloth: P.peacock, head: 'cap', facing: 1, skin: 0.4 });
        },
      },
    ],
  }),

  // 37 · 2026 · Now · Chips on the coast — Info Valley at dusk, the temple skyline still behind.
  r37: () => ({
    id: 'r37',
    sky: {
      stops: [[0, mix(P.neel, P.ink, 0.35)], [0.3, mix(P.neel, P.ink, 0.05)], [0.5, mix(P.neel, P.rani, 0.5)], [0.68, mix(P.rani, P.neel, 0.25)], [0.88, mix(P.rani, P.marigold, 0.3)], [1, mix(P.marigold, P.haldi, 0.45)]],
      moon: { x: 1080, y: 84, r: 16 }, stars: 110, clouds: 'streak', cloudTint: mix(P.rani, P.skyCream, 0.3), halftone: mix(P.neel, P.peacock, 0.5),
    },
    far: [{ kind: 'hills', a: mix(P.neel, P.rani, 0.2), b: P.ink, height: [10, 40], haze: 0.05 }],
    ground: { kind: 'land', plain: NIGHT_PLAIN, plainDetail: 'grass', path: mix(P.neel, P.khondalite, 0.45), verge: mix(P.tota, P.neel, 0.5) },
    mid: (ctx, rng, W) => {
      // glass blocks of the campus, rani edge-lights, cranes with warning lamps
      scatter(rng.fork('blocks'), W, [70, 150], (x, i) => {
        const bw = rng.range(50, 100), bh = rng.range(50, 110);
        const body = i % 3 === 0 ? mix(P.peacock, P.neel, 0.45) : i % 3 === 1 ? mix(P.neel, P.rani, 0.3) : mix(P.neel, P.seafoam, 0.25);
        wrapped(W, x, bw / 2 + 4, (xx) => {
          modernBlock(ctx, rng.fork(x), xx, 214, bw, bh, body, { lit: 0.55, glowColour: rng.pick([P.haldi, mix(P.seafoam, P.limewhite, 0.5), mix(P.haldi, P.limewhite, 0.5)]) });
          ctx.fillStyle = i % 2 ? P.rani : P.peacock;
          ctx.fillRect(xx - bw / 2, 214 - bh - 3, bw, 3);
          glow(ctx, xx, 214 - bh, bw * 0.6, i % 2 ? P.rani : P.peacock, 0.25);
        });
      });
      scatter(rng.fork('cranes'), W, [600, 900], (x) => wrapped(W, x, 100, (xx) => {
        crane(ctx, xx, 214, 1, mix(P.haldi, P.marigold, 0.3));
        glow(ctx, xx, 214 - 132, 14, P.sindoor, 0.8);
        glow(ctx, xx + 90, 214 - 110, 10, P.sindoor, 0.7);
      }));
      dimmed(ctx, W, 260, NIGHT, 0.45, (c) => {
        scatter(rng.fork('palms'), W, [90, 180], (x) => wrapped(W, x, 50, (xx) => coconutPalm(c, rng.fork(x), xx, 226, rng.range(90, 130), rng.range(-0.08, 0.08), 0)));
        bank(c, rng.fork('bank'), W, 222, mix(P.tota, P.peacock, 0.3), mix(P.neel, P.tota, 0.4));
        scatter(rng.fork('bougain'), W, [120, 220], (x) => wrapped(W, x, 30, (xx) => bougainvillea(c, rng.fork(x), xx, 230, rng.range(30, 50), 16)));
      });
      ctx.fillStyle = mix(P.neel, P.khondalite, 0.35);
      ctx.fillRect(0, 232, W, 14);
      ctx.fillStyle = withAlpha(P.haldi, 0.8);
      for (let x = 0; x < W; x += 30) ctx.fillRect(x, 238.5, 14, 1);
      for (let x = 30; x < W; x += 170) wrapped(W, x, 30, (xx) => streetLamp(ctx, xx, 232, 58, true, mix(P.haldi, P.limewhite, 0.4)));
      scatter(rng.fork('ebus'), W, [700, 1000], (x) => wrapped(W, x, 70, (xx) => {
        busBg(ctx, rng.fork(x), xx, 245, 0.55, mix(P.peacock, P.tota, 0.3), 0, true);
        glow(ctx, xx + 34, 236, 16, P.haldi, 0.6);
      }));
    },
    near: (ctx, rng, W) => {
      const kerbY = 132;
      ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.35);
      ctx.fillRect(0, kerbY, W, 5);
      dimmed(ctx, W, 140, NIGHT, 0.25, (c) => {
        scatter(rng.fork('planters'), W, [180, 300], (x) => wrapped(W, x, 30, (xx) => {
          c.fillStyle = mix(P.limewhite, P.khondalite, 0.3);
          c.fillRect(xx - 14, kerbY - 10, 28, 10);
          bougainvillea(c, rng.fork(x), xx, kerbY - 10, 34, 20);
        }));
        scatter(rng.fork('walkers'), W, [300, 520], (x) => wrapped(W, x, 40, (xx) => crowd(c, rng.fork(x), xx - 20, xx + 20, kerbY - 2, 1.05, { poses: ['walk', 'stand'], density: 1.6 })));
      });
      scatter(rng.fork('glow'), W, [300, 520], (x) => wrapped(W, x, 20, (xx) => glow(ctx, xx, kerbY - 30, 10, P.seafoam, 0.4)));
      scatter(rng.fork('riders'), W, [380, 620], (x, i) => wrapped(W, x, 40, (xx) => scooterRider(ctx, xx, kerbY - 2, 1.05, [P.rani, P.peacock, P.haldi][i % 3], { cloth: rng.pick([P.limewhite, P.haldi, P.rani, P.tota]), head: 'helmet', lit: true, sari: i % 2 === 1 })));
      scatter(rng.fork('bots'), W, [500, 800], (x) => wrapped(W, x, 20, (xx) => deliveryBot(ctx, xx, kerbY + 2, 1.1)));
      for (let x = 100; x < W; x += 512) wrapped(W, x, 30, (xx) => streetLamp(ctx, xx, kerbY, 70, true, mix(P.haldi, P.limewhite, 0.4), -1));
    },
    fore: 'none',
    sign: { date: '2026 · Now', title: 'Info Valley' },
    landmarks: [
      {
        // The temple skyline of the old city, still there behind the new campus.
        at: 0.6, plane: 'far', w: 420, h: 280, y: 452,
        paint: (ctx, rng, w, h) => {
          const stone = mix(P.khondalite, P.neel, 0.35);
          templeLine(ctx, rng, w / 2 - 20, h - 2, 0.95, { stone });
          rekhaDeula(ctx, rng, w / 2 - 170, h - 2, 120, { stone });
          wash(ctx, w, h, mix(P.neel, P.rani, 0.3), 0.35);
        },
      },
      {
        // The chip plant: its cleanroom glows lithography-yellow, a wafer mural on the wall, cranes still building.
        at: 0.2, plane: 'mid', w: 660, h: 250, y: 432,
        paint: (ctx, rng, w, h) => {
          const gy = h - 4;
          crane(ctx, 600, gy, 1.35, mix(P.haldi, P.marigold, 0.3));
          glow(ctx, 600, gy - 178, 16, P.sindoor, 0.9);
          crane(ctx, 70, gy, 1.05, mix(P.haldi, P.marigold, 0.3));
          glow(ctx, 70, gy - 139, 14, P.sindoor, 0.9);
          // scaffold of the next hall
          ctx.strokeStyle = withAlpha(mix(P.haldi, P.limewhite, 0.3), 0.7);
          ctx.lineWidth = 1.4;
          for (let x = 540; x <= 640; x += 20) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - 70); ctx.stroke(); }
          for (let y = gy; y >= gy - 70; y -= 14) { ctx.beginPath(); ctx.moveTo(540, y); ctx.lineTo(640, y); ctx.stroke(); }
          // main hall
          const body = mix(P.limewhite, P.seafoam, 0.25);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 110, y: gy }, { x: 110, y: gy - 100 }, { x: 540, y: gy - 100 }, { x: 540, y: gy }]), { x: 110, y: gy - 100, w: 430, h: 100 }, { base: body, light: P.limewhite, shade: mix(body, P.neel, 0.4), lightFrom: 'top', dabs: 40 });
          wash(ctx, w, h, NIGHT, 0.2);
          for (const [bx, bw] of [[160, 26], [250, 40], [420, 30]] as const) { ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.3); ctx.fillRect(bx, gy - 116, bw, 16); }
          for (const sx of [300, 330]) { taperStroke(ctx, [{ x: sx, y: gy - 100 }, { x: sx, y: gy - 140 }], 6, mix(P.limewhite, P.khondalite, 0.25), 1, [1, 1]); taperStroke(ctx, curvePts(sx, gy - 142, sx - 10, gy - 160, sx - 26, gy - 170), 6, P.limewhite, 0.18); }
          ctx.fillStyle = P.rani;
          ctx.fillRect(110, gy - 103, 430, 3);
          glow(ctx, 325, gy - 100, 220, P.rani, 0.12);
          // the yellow-lit cleanroom band
          glow(ctx, 400, gy - 56, 150, P.haldi, 0.35);
          for (let i = 0; i < 8; i++) { ctx.fillStyle = mix(P.haldi, P.limewhite, 0.2); ctx.fillRect(272 + i * 32, gy - 72, 26, 30); }
          for (let i = 0; i < 8; i++) person(ctx, 285 + i * 32, gy - 43, 0.6, { pose: 'stand', cloth: P.limewhite, head: 'hood', facing: i % 2 ? 1 : -1 });
          // the wafer mural
          wafer(ctx, 190, gy - 52, 38);
          // gate, guard booth, a little queue of scooters
          ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.3);
          ctx.fillRect(110, gy - 14, 430, 3);
          glow(ctx, 560, gy - 20, 30, P.haldi, 0.5);
          ctx.fillStyle = P.peacock;
          ctx.fillRect(548, gy - 30, 22, 30);
          ctx.fillStyle = P.haldi;
          ctx.fillRect(552, gy - 26, 14, 8);
          scooterRider(ctx, 610, gy, 1.25, P.rani, { cloth: P.haldi, head: 'helmet', lit: true });
        },
      },
      {
        // Thought for the road: a museum window with a stone adze from Golbai Sasan beside a silicon wafer.
        at: 0.45, plane: 'near', w: 260, h: 140, y: 556,
        paint: (ctx, _rng, _w, h) => {
          const gy = h - 4;
          ctx.fillStyle = mix(P.neel, P.peacock, 0.35);
          ctx.fillRect(30, gy - 120, 200, 120);
          ctx.fillStyle = P.rani;
          ctx.fillRect(26, gy - 124, 208, 6);
          glow(ctx, 130, gy - 70, 110, P.haldi, 0.35);
          ctx.fillStyle = mix(P.skyCream, P.haldi, 0.25);
          ctx.fillRect(44, gy - 108, 172, 80);
          for (const px of [90, 170]) { ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.3); ctx.fillRect(px - 18, gy - 44, 36, 16); }
          stoneAdze(ctx, 90, gy - 62, 1.4);
          wafer(ctx, 170, gy - 66, 20);
          ctx.fillStyle = withAlpha(P.limewhite, 0.25);
          polyPath(ctx, [{ x: 50, y: gy - 108 }, { x: 70, y: gy - 108 }, { x: 46, y: gy - 30 }, { x: 44, y: gy - 30 }]);
          ctx.fill();
          ctx.fillStyle = P.ink;
          ctx.fillRect(80, gy - 26, 100, 12);
          ctx.textAlign = 'center';
          ctx.font = "800 8px 'Inter Tight', sans-serif";
          ctx.fillStyle = P.haldi;
          ctx.fillText('3,500 YEARS OF BUILDERS', 130, gy - 17);
          person(ctx, 66, gy, 1.5, { pose: 'point', cloth: P.rani, head: 'bun', facing: 1, skin: 0.5 });
          person(ctx, 196, gy, 1.25, { pose: 'stand', cloth: P.haldi, cloth2: P.tota, head: 'none', facing: -1, skin: 0.3 });
        },
      },
      {
        // Chai break: a worker still in his cleanroom suit tries to drink tea through the mask.
        at: 0.7, plane: 'mid', w: 300, h: 150, y: 446,
        paint: (ctx, _rng, _w, h) => {
          const gy = h - 4;
          glow(ctx, 120, gy - 40, 90, P.marigold, 0.45);
          ctx.fillStyle = P.tota;
          ctx.fillRect(70, gy - 34, 90, 26);
          ctx.fillStyle = P.rani;
          for (let i = 0; i < 6; i++) { polyPath(ctx, [{ x: 66 + i * 17, y: gy - 74 }, { x: 83 + i * 17, y: gy - 74 }, { x: 83 + i * 17, y: gy - 64 }, { x: 74 + i * 17, y: gy - 60 }, { x: 66 + i * 17, y: gy - 64 }]); ctx.fillStyle = i % 2 ? P.limewhite : P.rani; ctx.fill(); }
          for (const k of [70, 160]) taperStroke(ctx, [{ x: k, y: gy - 8 }, { x: k, y: gy - 72 }], 2, P.khondalite, 1, [1, 1]);
          dab(ctx, 100, gy - 40, 7, 6, 0, mix(P.khondalite, P.limewhite, 0.3), 1);
          taperStroke(ctx, curvePts(100, gy - 46, 96, gy - 56, 102, gy - 64), 1.2, P.limewhite, 0.5);
          dab(ctx, 130, gy - 36, 4, 3, 0, P.haldi, 1);
          person(ctx, 120, gy - 4, 1.4, { pose: 'serve', cloth: P.limewhite, cloth2: P.haldi, head: 'none', facing: 1, skin: 0.8 });
          person(ctx, 200, gy, 1.5, { pose: 'carry', cloth: P.limewhite, head: 'hood', facing: -1, trousers: true });
          person(ctx, 236, gy, 1.5, { pose: 'wave', cloth: P.limewhite, head: 'hood', facing: -1, trousers: true });
          ctx.fillStyle = P.limewhite;
          ctx.fillRect(187, gy - 70, 6, 7);
        },
      },
      {
        // A cow inspects a delivery robot. The robot waits politely.
        at: 0.9, plane: 'near', w: 160, h: 80, y: 556,
        paint: (ctx, _rng, _w, h) => {
          const gy = h - 4;
          deliveryBot(ctx, 110, gy, 1.5);
          cow(ctx, 60, gy, 1.2, { grazing: true, facing: 1 });
        },
      },
    ],
  }),
};
