// Act V · Naya Odisha (records 27–31). Lead: marigold; supports peacock,
// sindoor, tota — 1950s poster brights. Record 28 is a painted indigo
// blueprint; record 31 (1999) drains to storm-grey and indigo.
import { DERIVED, P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, dabField, glow, makeCanvas, paintedShape, polyPath, taperStroke, vGradient, wrapped, type Ctx } from '../brush';
import { bank, scatter, treeRow, type SceneDef } from '../engine';
import { blastFurnace, crane, house, pandal, pidhaHall, rekhaDeula, stall } from '../kit/buildings';
import { boitaShip, bullockCartBg, planeBg, trainBg } from '../kit/craft';
import { crowd, flag, person, type PersonOpts } from '../kit/people';
import { cow, crow, goat } from '../kit/animals';
import { broadTree, coconutPalm, reedTuft } from '../shared/nature';

const hz = (c: string, h = 0) => (h ? mix(c, P.skyCream, h) : c);

// ---- local painting helpers ------------------------------------------------------

function off(w: number, h: number, fn: (ctx: Ctx) => void): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  fn(ctx);
  return c;
}

function puff(ctx: Ctx, x: number, y: number, r: number, col: string, a: number): void {
  const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(0.68, withAlpha(col, a * 0.85));
  g.addColorStop(1, withAlpha(col, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

interface CloudCols { shade: string; body: string; lit: string }

/** A towering monsoon cumulus with a flat base at (x, y); lit from the right. */
function towerCloud(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, c: CloudCols, anvil = 0): void {
  const pad = w * 0.35;
  const cw = Math.ceil(w + pad * 2), ch = Math.ceil(h + pad * 0.6);
  const bx = cw / 2, by = ch - 2;
  const cv = off(cw, ch, (cx) => {
    const r0 = w * 0.13;
    const n = Math.round(16 + (h / w) * 40);
    const ps: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < n; i++) {
      const v = Math.pow(rng.next(), 0.85);
      let hw = (w / 2) * (1 - 0.5 * v);
      if (anvil && v > 0.78) hw = (w / 2) * (0.5 + anvil * (v - 0.78) * 4);
      const r = r0 * (1 - 0.3 * v) * rng.range(0.75, 1.2);
      ps.push({ x: bx + rng.range(-1, 1) * Math.max(0, hw - r * 0.5), y: by - r * 0.55 - v * (h - r * 1.3), r });
    }
    ps.sort((a, b) => a.y - b.y);
    for (const p of ps) puff(cx, p.x - p.r * 0.14, p.y + p.r * 0.32, p.r * 1.05, c.shade, 0.9);
    for (const p of ps) puff(cx, p.x - p.r * 0.02, p.y - p.r * 0.06, p.r * 0.92, c.body, 0.92);
    for (const p of ps) puff(cx, p.x + p.r * 0.28, p.y - p.r * 0.34, p.r * 0.58, c.lit, 0.85);
    for (const p of ps) for (let i = 0; i < 6; i++) {
      const a = -Math.PI + rng.next() * Math.PI;
      dab(cx, p.x + Math.cos(a) * p.r * 0.82, p.y + Math.sin(a) * p.r * 0.78, p.r * 0.2, p.r * 0.13, a, rng.pick([c.body, c.lit]), 0.3);
    }
    // a soft shaded underside, then the flat base
    vGradient(cx, 0, by - h * 0.22, cw, h * 0.22, [[0, c.shade, 0], [1, c.shade, 0.45]]);
    cx.globalCompositeOperation = 'destination-in';
    vGradient(cx, 0, 0, cw, ch, [[0, P.ink, 1], [(by - 4) / ch, P.ink, 1], [by / ch, P.ink, 0], [1, P.ink, 0]]);
    cx.globalCompositeOperation = 'source-over';
  });
  ctx.drawImage(cv, x - bx, y - by);
}

/** Repaint a canvas's opaque pixels in one colour (for silhouettes and cloud-ships). */
function silhouette(src: HTMLCanvasElement, col: string): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = col;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function line(ctx: Ctx, pts: [number, number][], col: string, w: number, a = 1): void {
  ctx.strokeStyle = withAlpha(col, a);
  ctx.lineWidth = w;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

/** Slanting rain streaks (wind from the right: they fall down and to the left). */
function rain(ctx: Ctx, rng: Rng, x0: number, y0: number, w: number, h: number, n: number, col: string, alpha: number, slant = -0.38): void {
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + rng.next() * w, y = y0 + rng.next() * h;
    const l = rng.range(10, 30);
    ctx.strokeStyle = withAlpha(col, alpha * rng.range(0.5, 1));
    ctx.lineWidth = rng.range(0.7, 1.5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + slant * l, y + l);
    ctx.stroke();
  }
}

/** An electricity pylon (lattice tower) standing on (x, y), ~92·s tall. */
function pylon(ctx: Ctx, x: number, y: number, s: number, col: string): void {
  const top = y - 92 * s;
  const lw = Math.max(0.6, 1.3 * s);
  line(ctx, [[x - 11 * s, y], [x - 2.5 * s, top + 10 * s], [x, top], [x + 2.5 * s, top + 10 * s], [x + 11 * s, y]], col, lw);
  for (let k = 0; k < 5; k++) {
    const t0 = k / 5, t1 = (k + 1) / 5;
    const w0 = 11 * s - t0 * 8.5 * s, w1 = 11 * s - t1 * 8.5 * s;
    const y0 = y - t0 * 82 * s, y1 = y - t1 * 82 * s;
    line(ctx, [[x - w0, y0], [x + w1, y1]], col, lw * 0.6);
    line(ctx, [[x + w0, y0], [x - w1, y1]], col, lw * 0.6);
  }
  for (const [ay, aw] of [[top + 14 * s, 17], [top + 26 * s, 13]] as const) {
    line(ctx, [[x - aw * s, ay], [x + aw * s, ay]], col, lw);
    line(ctx, [[x - aw * s, ay], [x - 3 * s, ay - 6 * s]], col, lw * 0.6);
    line(ctx, [[x + aw * s, ay], [x + 3 * s, ay - 6 * s]], col, lw * 0.6);
  }
}

/** Survey tripod with a brass theodolite on top. */
function theodolite(ctx: Ctx, x: number, y: number, s: number, haze = 0): void {
  const wood = hz(mix(P.laterite, P.chandan, 0.35), haze);
  for (const dx of [-7, 1, 8]) taperStroke(ctx, [{ x, y: y - 22 * s }, { x: x + dx * s, y }], 1.3 * s, wood, 1, [1, 1]);
  ctx.fillStyle = hz(mix(P.haldi, P.laterite, 0.25), haze);
  ctx.fillRect(x - 3 * s, y - 28 * s, 6 * s, 6 * s);
  taperStroke(ctx, [{ x: x - 5 * s, y: y - 29 * s }, { x: x + 6 * s, y: y - 30.5 * s }], 2.4 * s, hz(mix(P.haldi, P.khondalite, 0.3), haze), 1, [1, 1]);
}

/** Striped ranging rod. */
function rangingRod(ctx: Ctx, x: number, y: number, s: number, haze = 0): void {
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = hz(i % 2 ? P.limewhite : P.sindoor, haze);
    ctx.fillRect(x - 0.8 * s, y - (i + 1) * 6 * s, 1.6 * s, 6 * s);
  }
}

/** A measuring chain sagging between two points. */
function chain(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, s: number): void {
  const pts = curvePts(x0, y0, (x0 + x1) / 2, Math.max(y0, y1) + 8 * s, x1, y1, 22);
  for (const p of pts) dab(ctx, p.x, p.y, 1.1 * s, 0.7 * s, 0, mix(P.haldi, P.khondalite, 0.4), 1);
}

/** A cow lying down (the kit cow with its legs tucked away). */
function cowLying(ctx: Ctx, x: number, y: number, s: number, facing: 1 | -1, colour?: string): void {
  const W = 70 * s, H = 50 * s;
  const cv = off(W, H, (c) => cow(c, W / 2, H - 2, s, { facing, colour }));
  const cut = H - 2 - 11 * s;
  ctx.drawImage(cv, 0, 0, W, cut, x - W / 2, y - cut, W, cut);
  const d = mix(colour ?? P.limewhite, P.khondalite, 0.45);
  dab(ctx, x + 8 * s * facing, y - 1.5 * s, 7 * s, 2 * s, 0, d, 1);
  dab(ctx, x - 8 * s * facing, y - 1.5 * s, 6 * s, 2 * s, 0, d, 1);
  dab(ctx, x, y - 0.5 * s, 18 * s, 1.6 * s, 0, P.ink, 0.15);
}

/** Small round head of a person peeping over something. */
function people(ctx: Ctx, list: [number, number, number, PersonOpts][]): void {
  for (const [x, y, s, o] of list) person(ctx, x, y, s, o);
}

/** Ground-plan lines squashed onto the ground plane: roads, unit circles, arrows. */
function planOnGround(ctx: Ctx, rng: Rng, x: number, y: number, w: number, col: string, a: number): void {
  const k = 0.22; // vertical squash of a plan seen from a low eye
  ctx.strokeStyle = withAlpha(col, a);
  ctx.lineWidth = 1.2;
  const blockW = w / 3;
  for (let i = 0; i < 3; i++) {
    const bx = x + i * blockW;
    ctx.strokeRect(bx + 6, y - 60 * k * 4, blockW - 12, 50 * k * 4);
    ctx.beginPath();
    ctx.ellipse(bx + blockW / 2, y - 35 * k * 4, blockW * 0.18, blockW * 0.18 * k, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let j = 0; j < 4; j++) {
      const hx = bx + 14 + j * (blockW - 28) / 4;
      ctx.strokeRect(hx, y - 56 * k * 4, (blockW - 40) / 5, 10 * k * 4);
    }
  }
  // dimension arrow under the plan
  const ay = y + 6;
  line(ctx, [[x + 6, ay], [x + w - 6, ay]], col, 1, a);
  for (const [px, d] of [[x + 6, 1], [x + w - 6, -1]] as const) {
    line(ctx, [[px + d * 7, ay - 3], [px, ay], [px + d * 7, ay + 3]], col, 1, a);
    line(ctx, [[px, ay - 6], [px, ay + 6]], col, 1, a);
  }
  if (rng.chance(0.5)) line(ctx, [[x + w * 0.5, y - 62 * k * 4], [x + w * 0.5, y - 70 * k * 4 - 10]], col, 1, a);
}

/** A building drawn as a blueprint: indigo wash, cream lines, grid, a dimension arrow. */
function ghostBuilding(ctx: Ctx, x: number, y: number, w: number, h: number, kind: 'block' | 'house' | 'tower' | 'dome', a = 1): void {
  const ink = P.limewhite;
  const wash = mix(P.neel, P.peacock, 0.12);
  const body = () => {
    ctx.beginPath();
    if (kind === 'house') {
      ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h * 0.62); ctx.lineTo(x, y - h); ctx.lineTo(x + w / 2, y - h * 0.62); ctx.lineTo(x + w / 2, y);
    } else if (kind === 'dome') {
      ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h * 0.55); ctx.lineTo(x - w * 0.2, y - h * 0.55);
      ctx.arc(x, y - h * 0.55, w * 0.2, Math.PI, 0); ctx.lineTo(x + w / 2, y - h * 0.55); ctx.lineTo(x + w / 2, y);
    } else {
      ctx.rect(x - w / 2, y - h, w, h);
    }
    ctx.closePath();
  };
  body();
  ctx.fillStyle = withAlpha(wash, 0.62 * a);
  ctx.fill();
  clipTo(ctx, body, () => {
    ctx.strokeStyle = withAlpha(ink, 0.14 * a);
    ctx.lineWidth = 0.8;
    for (let gx = x - w / 2; gx < x + w / 2; gx += 8) { ctx.beginPath(); ctx.moveTo(gx, y - h); ctx.lineTo(gx, y); ctx.stroke(); }
    for (let gy = y; gy > y - h; gy -= 8) { ctx.beginPath(); ctx.moveTo(x - w / 2, gy); ctx.lineTo(x + w / 2, gy); ctx.stroke(); }
  });
  body();
  ctx.strokeStyle = withAlpha(ink, 0.92 * a);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // windows / columns
  ctx.lineWidth = 1;
  ctx.strokeStyle = withAlpha(ink, 0.75 * a);
  const top = kind === 'house' ? y - h * 0.55 : kind === 'dome' ? y - h * 0.5 : y - h + 6;
  const rows = Math.max(1, Math.floor((y - top) / 18));
  const cols = Math.max(2, Math.floor(w / 16));
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const wx = x - w / 2 + 5 + i * ((w - 10) / cols);
    const wy = top + 4 + r * ((y - top - 6) / rows);
    ctx.strokeRect(wx + 1.5, wy, (w - 10) / cols - 5, Math.min(10, (y - top) / rows - 6));
  }
  if (kind === 'tower') { line(ctx, [[x, y - h], [x, y - h - 16]], ink, 1.2, a); dab(ctx, x, y - h - 18, 3, 3, 0, ink, 0.8 * a); }
  // dimension arrow above
  const ay = y - h - (kind === 'tower' ? 26 : 10);
  line(ctx, [[x - w / 2, ay], [x + w / 2, ay]], ink, 1, 0.8 * a);
  for (const [px, d] of [[x - w / 2, 1], [x + w / 2, -1]] as const) {
    line(ctx, [[px + d * 6, ay - 3], [px, ay], [px + d * 6, ay + 3]], ink, 1, 0.8 * a);
    line(ctx, [[px, ay - 5], [px, ay + 5]], ink, 1, 0.6 * a);
  }
  // ticks down the side
  line(ctx, [[x + w / 2 + 6, y], [x + w / 2 + 6, y - h]], ink, 0.8, 0.5 * a);
}

/** A garland of marigolds hanging between two points. */
function garland(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, r: number): void {
  const pts = curvePts(x0, y0, (x0 + x1) / 2, Math.max(y0, y1) + sag, x1, y1, Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / (r * 1.4))));
  pts.forEach((p, i) => dab(ctx, p.x, p.y, r, r * 0.9, 0, i % 3 === 2 ? P.haldi : P.marigold, 1));
}

/** Wind-bent coconut palm: trunk bowed to the left, fronds streaming left. */
function stormPalm(ctx: Ctx, rng: Rng, x: number, y: number, h: number, haze = 0, bend = 0.4): void {
  const trunk = hz(mix(DERIVED.stormGrey, P.khondalite, 0.4), haze);
  const trunkD = hz(mix(DERIVED.stormGrey, P.ink, 0.35), haze);
  const leaf = hz(mix(P.tota, DERIVED.stormGrey, 0.55), haze);
  const leafD = hz(mix(mix(P.tota, P.neel, 0.5), DERIVED.stormGrey, 0.55), haze);
  const leafL = hz(mix(mix(P.tota, P.seafoam, 0.45), DERIVED.stormGrey, 0.45), haze);
  const tx = x - h * bend, ty = y - h * 0.9;
  const pts = curvePts(x, y, x + h * 0.06, y - h * 0.6, tx, ty, 14);
  taperStroke(ctx, pts, h * 0.065, trunkD, 1, [1, 0.55]);
  taperStroke(ctx, pts.map((p) => ({ x: p.x + h * 0.01, y: p.y })), h * 0.04, trunk, 0.9, [1, 0.5]);
  const n = 10;
  for (let i = 0; i < n; i++) {
    const ang = Math.PI + rng.range(-0.75, 0.6);
    const len = h * rng.range(0.32, 0.52);
    const ex = tx + Math.cos(ang) * len - len * 0.25, ey = ty + Math.sin(ang) * len * 0.5 + len * 0.18;
    const cx = (tx + ex) / 2 + len * 0.05, cy = (ty + ey) / 2 - len * 0.12;
    const fp = curvePts(tx, ty, cx, cy, ex, ey, 10);
    const col = i % 3 === 0 ? leafD : i % 3 === 1 ? leaf : leafL;
    taperStroke(ctx, fp, h * 0.022, col, 1, [0.6, 0.1]);
    for (let k = 2; k < fp.length; k++) {
      const p = fp[k];
      const l = h * 0.07 * (1 - k / fp.length * 0.5);
      taperStroke(ctx, [{ x: p.x, y: p.y }, { x: p.x - l * 0.9, y: p.y + l * 0.45 }], h * 0.012, col, 0.9, [0.8, 0.1]);
      taperStroke(ctx, [{ x: p.x, y: p.y }, { x: p.x - l * 0.8, y: p.y - l * 0.3 }], h * 0.01, col, 0.75, [0.8, 0.1]);
    }
  }
  dab(ctx, tx, ty + 2, h * 0.025, h * 0.02, 0, trunkD, 1);
}

/** Hockey goal: a cream frame with a net. */
function hockeyGoal(ctx: Ctx, x: number, y: number, s: number, facing: 1 | -1): void {
  const w = 22 * s, h = 13 * s, d = 8 * s * -facing;
  ctx.strokeStyle = withAlpha(P.limewhite, 0.55);
  ctx.lineWidth = 0.7;
  for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + (i * w) / 6, y - h); ctx.lineTo(x - w / 2 + (i * w) / 6 + d, y - h + 3 * s); ctx.lineTo(x - w / 2 + (i * w) / 6 + d, y); ctx.stroke(); }
  for (let j = 0; j <= 4; j++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + d, y - (j * h) / 4); ctx.lineTo(x + w / 2 + d, y - (j * h) / 4); ctx.stroke(); }
  line(ctx, [[x - w / 2, y], [x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y]], P.limewhite, 2 * s);
}

/** Simple rowing / fishing boat. (x, y) = waterline centre. */
function smallBoat(ctx: Ctx, rng: Rng, x: number, y: number, s: number, hull: string, haze = 0): void {
  const c = hz(hull, haze);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.moveTo(x - 34 * s, y - 9 * s); ctx.quadraticCurveTo(x, y + 6 * s, x + 34 * s, y - 9 * s); ctx.lineTo(x + 28 * s, y - 2 * s); ctx.quadraticCurveTo(x, y + 4 * s, x - 28 * s, y - 2 * s); ctx.closePath(); }, { x: x - 34 * s, y: y - 9 * s, w: 68 * s, h: 13 * s }, { base: c, light: hz(mix(hull, P.haldi, 0.35), haze), shade: hz(mix(hull, P.ink, 0.4), haze), dabs: 8 });
  ctx.fillStyle = hz(mix(hull, P.ink, 0.35), haze);
  ctx.beginPath(); ctx.moveTo(x - 34 * s, y - 9 * s); ctx.quadraticCurveTo(x, y + 2 * s, x + 34 * s, y - 9 * s); ctx.quadraticCurveTo(x, y - 3 * s, x - 34 * s, y - 9 * s); ctx.fill();
}

// ---- record 27: the flight to Java ---------------------------------------------

const DUSK_CLOUD: CloudCols = {
  shade: mix(mix(P.peacock, P.skyCream, 0.55), P.rani, 0.08),
  body: mix(P.skyCream, P.limewhite, 0.35),
  lit: mix(P.limewhite, P.marigold, 0.42),
};

function island(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze: number, volcano = false): void {
  const col = hz(mix(P.peacock, P.tota, 0.35), haze);
  const dark = hz(mix(P.peacock, P.neel, 0.35), haze);
  const lit = hz(mix(P.tota, P.marigold, 0.35), haze);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    if (volcano) {
      ctx.quadraticCurveTo(x - w * 0.2, y - h * 0.25, x - w * 0.07, y - h);
      ctx.lineTo(x + w * 0.05, y - h * 0.97);
      ctx.quadraticCurveTo(x + w * 0.22, y - h * 0.25, x + w / 2, y);
    } else {
      ctx.bezierCurveTo(x - w * 0.3, y - h * 0.9, x + w * 0.1, y - h * 1.1, x + w / 2, y);
    }
    ctx.closePath();
  };
  paintedShape(ctx, rng, path, { x: x - w / 2, y: y - h, w, h }, { base: col, light: lit, shade: dark, lightFrom: 'right', dabs: Math.round(w / 3) });
  if (!volcano) for (let i = 0; i < 4; i++) {
    const px = x + rng.range(-0.3, 0.3) * w;
    coconutPalm(ctx, rng.fork(i), px, y - h * 0.45, h * rng.range(0.6, 0.9), rng.range(-0.15, 0.15), haze + 0.15);
  }
  vGradient(ctx, x - w / 2, y - 6, w, 6, [[0, P.limewhite, 0], [1, P.limewhite, 0.35]]);
}

function prau(ctx: Ctx, rng: Rng, x: number, y: number, s: number): void {
  const wood = mix(P.laterite, P.ink, 0.2);
  // outrigger floats and booms
  for (const k of [-1, 1]) line(ctx, [[x + k * 18 * s, y - 6 * s], [x + k * 18 * s, y + 6 * s]], wood, 2 * s);
  dab(ctx, x, y + 6 * s, 36 * s, 2 * s, 0, wood, 1);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.moveTo(x - 40 * s, y - 10 * s); ctx.quadraticCurveTo(x, y + 4 * s, x + 42 * s, y - 12 * s); ctx.lineTo(x + 34 * s, y - 3 * s); ctx.quadraticCurveTo(x, y + 2 * s, x - 33 * s, y - 3 * s); ctx.closePath(); }, { x: x - 40 * s, y: y - 12 * s, w: 82 * s, h: 14 * s }, { base: mix(P.laterite, P.sindoor, 0.2), light: P.marigold, shade: wood, dabs: 10 });
  // mast and a striped tanja sail
  line(ctx, [[x - 4 * s, y - 6 * s], [x - 2 * s, y - 58 * s]], wood, 1.6 * s);
  const sail = () => { ctx.beginPath(); ctx.moveTo(x - 22 * s, y - 14 * s); ctx.lineTo(x - 2 * s, y - 60 * s); ctx.lineTo(x + 24 * s, y - 20 * s); ctx.closePath(); };
  sail();
  ctx.fillStyle = P.haldi;
  ctx.fill();
  clipTo(ctx, sail, () => { for (let i = 0; i < 5; i++) { ctx.fillStyle = withAlpha(P.sindoor, 0.9); ctx.fillRect(x - 30 * s, y - 60 * s + i * 11 * s, 60 * s, 5 * s); } });
  people(ctx, [
    [x - 22 * s, y - 4 * s, 0.9 * s, { pose: 'wave', cloth: P.peacock, head: 'cap', facing: 1, skin: 0.7, phase: 1 }],
    [x + 16 * s, y - 4 * s, 0.85 * s, { pose: 'armsUp', cloth: P.marigold, head: 'none', facing: -1, skin: 0.5 }],
    [x + 28 * s, y - 5 * s, 0.6 * s, { pose: 'point', cloth: P.limewhite, head: 'none', facing: 1, skin: 0.4 }],
  ]);
  for (let i = 0; i < 10; i++) taperStroke(ctx, [{ x: x - 50 * s + i * 11 * s, y: y + 9 * s }, { x: x - 42 * s + i * 11 * s, y: y + 9.5 * s }], 1.4 * s, P.limewhite, 0.55);
}

// ---- record 30: steel city helpers ---------------------------------------------

function plantSkyline(ctx: Ctx, rng: Rng, x: number, y: number, w: number, haze: number): void {
  const steel = hz(mix(P.khondalite, P.neel, 0.3), haze);
  const steelL = hz(mix(P.khondalite, P.marigold, 0.25), haze);
  const rust = hz(mix(P.laterite, P.khondalite, 0.35), haze);
  // sawtooth sheds
  const shed = (sx: number, sw: number, sh: number) => {
    paintedShape(ctx, rng, () => polyPath(ctx, [{ x: sx, y }, { x: sx, y: y - sh }, ...Array.from({ length: Math.floor(sw / 18) }, (_, i) => [{ x: sx + i * 18, y: y - sh - 10 }, { x: sx + i * 18 + 18, y: y - sh }]).flat(), { x: sx + sw, y: y - sh }, { x: sx + sw, y }]), { x: sx, y: y - sh - 10, w: sw, h: sh + 10 }, { base: steel, light: steelL, shade: hz(mix(steel, P.ink, 0.35), haze), lightFrom: 'right', dabs: 10 });
  };
  let cx = x;
  while (cx < x + w) {
    const kind = rng.int(0, 3);
    if (kind === 0) { const sw = rng.range(90, 150); shed(cx, sw, rng.range(28, 44)); cx += sw + rng.range(4, 20); }
    else if (kind === 1) {
      // stacks with smoke
      for (let i = 0; i < rng.int(2, 4); i++) {
        const sx = cx + i * 12, sh = rng.range(90, 150);
        ctx.fillStyle = rust; ctx.fillRect(sx - 3.5, y - sh, 7, sh);
        ctx.fillStyle = hz(P.limewhite, haze); ctx.fillRect(sx - 3.5, y - sh + 6, 7, 3);
        for (let k = 0; k < 6; k++) puff(ctx, sx - 6 - k * 9, y - sh - 8 - k * 7, 8 + k * 3, hz(mix(P.limewhite, P.khondalite, 0.35), haze), 0.4 - k * 0.05);
      }
      cx += 50;
    } else if (kind === 2) {
      // gas holder
      const r = rng.range(20, 30), gh = rng.range(50, 70);
      paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.rect(cx, y - gh, r * 2, gh); }, { x: cx, y: y - gh, w: r * 2, h: gh }, { base: steel, light: steelL, shade: hz(mix(steel, P.ink, 0.35), haze), lightFrom: 'right', dabs: 8 });
      for (let k = 1; k < 4; k++) line(ctx, [[cx, y - (gh * k) / 4], [cx + r * 2, y - (gh * k) / 4]], hz(mix(steel, P.ink, 0.3), haze), 1);
      dab(ctx, cx + r, y - gh, r, 4, 0, steelL, 1);
      cx += r * 2 + 14;
    } else {
      // a conveyor gantry climbing to a tower
      const th = rng.range(60, 90);
      ctx.fillStyle = steel; ctx.fillRect(cx + 60, y - th, 16, th);
      line(ctx, [[cx, y - 6], [cx + 62, y - th + 6]], steel, 5);
      for (let k = 0; k < 6; k++) line(ctx, [[cx + k * 10, y], [cx + k * 10, y - 6 - k * (th - 12) / 6]], steel, 1);
      cx += 90;
    }
  }
}

// ---- the scenes ------------------------------------------------------------------

export const SCENES: Record<string, () => SceneDef> = {
  // 27 · 24 Jul 1947 · A Dakota flies to Java — over the Java Sea at evening.
  r27: () => ({
    id: 'r27',
    sky: {
      stops: [
        [0, mix(P.peacock, P.seafoam, 0.45)],
        [0.26, mix(P.seafoam, P.skyCream, 0.45)],
        [0.48, mix(P.skyCream, P.marigold, 0.22)],
        [0.62, mix(P.marigold, P.skyCream, 0.42)],
        [0.636, mix(P.haldi, P.skyCream, 0.45)],
        [0.642, mix(P.seafoam, P.peacock, 0.35)],
        [0.75, mix(P.peacock, P.seafoam, 0.25)],
        [1, mix(P.peacock, P.neel, 0.25)],
      ],
      sun: { x: 930, y: 236, r: 34, colour: P.marigold },
      clouds: 'cumulus',
      cloudTint: P.marigold,
      halftone: mix(P.marigold, P.skyCream, 0.4),
    },
    far: [{ kind: 'hills', a: mix(P.peacock, P.skyCream, 0.55), b: P.neel, height: [4, 20], base: 186, haze: 0.5 }],
    ground: { kind: 'air', water: { sky: mix(P.seafoam, P.skyCream, 0.3), light: mix(P.peacock, P.seafoam, 0.45), mid: P.peacock, deep: mix(P.peacock, P.neel, 0.35) } },
    mid: (ctx, rng, W) => {
      // Islands of the Java Sea low on the horizon, monsoon towers above them.
      scatter(rng.fork('towers'), W, [520, 760], (x, i) => {
        const w = rng.range(200, 300), h = rng.range(150, 210);
        wrapped(W, x, w * 0.9, (xx) => towerCloud(ctx, rng.fork(`t${i}`), xx, 236, w, h, DUSK_CLOUD, i % 2 ? 0.6 : 0));
      }, 120);
      scatter(rng.fork('isl'), W, [300, 520], (x, i) => {
        const w = rng.range(70, 170), h = rng.range(10, 24);
        wrapped(W, x, w, (xx) => island(ctx, rng.fork(`i${i}`), xx, 258, w, h, 0.42, i % 3 === 1));
      }, 40);
      // a glittering path under the sun is too static on a strip — instead, sparkles on the far sea
      for (let i = 0; i < 160; i++) {
        const x = rng.next() * W, y = 254 + rng.next() * 6;
        taperStroke(ctx, [{ x: x - 6, y }, { x: x + 6, y }], 1, rng.chance(0.5) ? P.limewhite : mix(P.marigold, P.limewhite, 0.4), 0.6);
      }
    },
    sign: { date: '24 Jul 1947', title: 'Java → India' },
    landmarks: [
      // three giant monsoon towers loitering on the horizon all flight long
      { at: 0.02, plane: 'far', w: 900, h: 470, y: 462, paint: (ctx, rng, w, h) => towerCloud(ctx, rng, w / 2, h - 4, 560, 400, DUSK_CLOUD, 0.9) },
      { at: 0.46, plane: 'far', w: 760, h: 420, y: 462, paint: (ctx, rng, w, h) => towerCloud(ctx, rng, w / 2, h - 4, 470, 330, DUSK_CLOUD, 0) },
      { at: 0.9, plane: 'far', w: 900, h: 480, y: 462, paint: (ctx, rng, w, h) => towerCloud(ctx, rng, w / 2, h - 4, 580, 420, DUSK_CLOUD, 1) },
      {
        // Java behind: a volcano trailing a thin plume, terraced green coast at its foot.
        at: 0.12, plane: 'far', w: 620, h: 220, y: 462,
        paint: (ctx, rng, w, h) => {
          island(ctx, rng, w * 0.68, h - 2, 300, 150, 0.45, true);
          island(ctx, rng, w * 0.32, h - 2, 260, 96, 0.5, true);
          island(ctx, rng, w * 0.5, h - 2, 560, 26, 0.38, false);
          for (let k = 0; k < 7; k++) puff(ctx, w * 0.67 - k * 18, h - 160 - k * 9, 12 + k * 4, mix(P.limewhite, P.khondalite, 0.3), 0.38 - k * 0.04);
        },
      },
      {
        // a second Dakota, far off and tiny, heading the same way
        at: 0.32, plane: 'far', w: 140, h: 70, y: 262,
        paint: (ctx, _rng, w, h) => planeBg(ctx, w / 2, h / 2, 0.7, mix(P.limewhite, P.khondalite, 0.25), 0.35),
      },
      {
        // Singapore midway: a low harbour skyline — godowns, a clock tower, ships at anchor (generic).
        at: 0.58, plane: 'far', w: 560, h: 120, y: 462,
        paint: (ctx, rng, w, h) => {
          const sil = mix(mix(P.peacock, P.neel, 0.35), P.skyCream, 0.5);
          const sil2 = mix(sil, P.skyCream, 0.25);
          const y = h - 2;
          ctx.fillStyle = sil2;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(w * 0.3, y - 40, w * 0.55, y - 22); ctx.quadraticCurveTo(w * 0.8, y - 10, w, y); ctx.fill();
          ctx.fillStyle = sil;
          let x = 70;
          while (x < w - 90) {
            const bw = rng.range(14, 34), bh = rng.range(10, 30);
            ctx.fillRect(x, y - bh, bw, bh);
            x += bw + rng.range(0, 6);
          }
          ctx.fillRect(w * 0.42, y - 62, 18, 62); // a tall block
          ctx.fillRect(w * 0.6, y - 48, 8, 48); // clock tower
          ctx.beginPath(); ctx.moveTo(w * 0.6 - 2, y - 48); ctx.lineTo(w * 0.6 + 4, y - 58); ctx.lineTo(w * 0.6 + 10, y - 48); ctx.fill();
          ctx.beginPath(); ctx.arc(w * 0.3, y - 30, 12, Math.PI, 0); ctx.fill();
          ctx.fillRect(w * 0.3 - 16, y - 30, 32, 30);
          for (let i = 0; i < 5; i++) {
            const sx = 40 + i * 110 + rng.range(-10, 10);
            dab(ctx, sx, y + 1, 18, 3, 0, sil, 1);
            line(ctx, [[sx, y], [sx, y - 16]], sil, 1);
          }
          vGradient(ctx, 0, 0, w, h, [[0, P.skyCream, 0], [1, P.skyCream, 0.25]]);
        },
      },
      {
        // A cloud shaped like an old boita — Kalinga reached Indonesia again, this time by air.
        at: 0.8, plane: 'far', w: 360, h: 260, y: 300,
        paint: (ctx, rng, w, h) => {
          const ship = off(w, h, (c) => boitaShip(c, rng, w / 2, h - 30, 1.6, { cargo: 'none' }));
          ctx.globalAlpha = 0.5;
          ctx.drawImage(silhouette(ship, mix(P.limewhite, P.marigold, 0.3)), 0, 0);
          ctx.globalAlpha = 1;
          for (let i = 0; i < 18; i++) puff(ctx, w / 2 + rng.range(-150, 150), h - 34 + rng.range(-12, 10), rng.range(16, 30), mix(P.limewhite, P.marigold, 0.25), 0.35);
        },
      },
      {
        // Fishermen in a prau wave up at the plane.
        at: 0.64, plane: 'near', w: 160, h: 110, y: 650,
        paint: (ctx, rng, w, h) => prau(ctx, rng, w / 2, h - 14, 1),
      },
    ],
  }),

  // 28 · 13 Apr 1948 · A new capital is planned — a painted indigo blueprint beside the temple town.
  r28: () => ({
    id: 'r28',
    sky: { stops: [[0, mix(P.seafoam, P.neel, 0.3)], [0.55, mix(P.skyCream, P.seafoam, 0.3)], [1, P.skyCream]], sun: { x: 1060, y: 104, r: 32 }, clouds: 'cumulus', halftone: mix(P.neel, P.seafoam, 0.4) },
    far: [{ kind: 'hills', a: mix(mix(P.tota, P.khondalite, 0.4), P.skyCream, 0.45), b: P.neel, height: [10, 40], trees: true, haze: 0.5 }],
    ground: { kind: 'land', plain: mix(P.neel, P.peacock, 0.12), plainDetail: 'blueprint', path: mix(P.laterite, P.chandan, 0.25), verge: mix(P.neel, P.tota, 0.35) },
    mid: (ctx, rng, W) => {
      // Old Bhubaneswar's temple town among mango trees, then the new city as a blueprint beside it.
      treeRow(ctx, rng.fork('trees'), W, 236, 0.3, 0.15);
      for (const [x0, x1] of [[60, 900], [1820, 2000]] as const) {
        scatter(rng.fork(`h${x0}`), x1 - x0, [44, 70], (x) => wrapped(W, x0 + x, 40, (xx) => house(ctx, rng.fork(x), xx, 240, rng.range(34, 50), rng.range(34, 48), { roof: rng.chance(0.6) ? 'tile' : 'thatch', haze: 0.2 })));
      }
      for (const [x, h] of [[180, 96], [420, 132], [520, 84], [760, 108]] as const) rekhaDeula(ctx, rng.fork(x), x, 244, h, { haze: 0.18, flagColour: P.sindoor });
      pidhaHall(ctx, rng.fork('ph'), 470, 244, 50, 50, { haze: 0.18 });
      // the planned capital, drawn in cream line on indigo
      const g = rng.fork('ghost');
      ghostBuilding(ctx, 1080, 244, 230, 70, 'block');
      ghostBuilding(ctx, 1260, 244, 60, 120, 'tower');
      ghostBuilding(ctx, 1380, 244, 130, 80, 'dome');
      for (let i = 0; i < 4; i++) ghostBuilding(ctx, 1500 + i * 70, 244, 50, g.range(38, 52), 'house');
      bank(ctx, rng.fork('bank'), W, 242, mix(P.tota, P.haldi, 0.35), mix(P.laterite, P.tota, 0.35));
    },
    near: (ctx, rng, W) => {
      // Survey teams at work across the plan: theodolites, ranging rods, chains — and cream plan lines on the ground.
      scatter(rng.fork('plan'), W, [380, 520], (x) => wrapped(W, x, 160, (xx) => planOnGround(ctx, rng.fork(x), xx - 150, 96, 300, P.limewhite, 0.5)));
      scatter(rng.fork('survey'), W, [300, 460], (x, i) => wrapped(W, x, 80, (xx) => {
        const y = 112;
        if (i % 3 === 0) {
          theodolite(ctx, xx, y, 1.15);
          person(ctx, xx - 9, y, 1.1, { pose: 'bend', cloth: P.limewhite, cloth2: P.khondalite, trousers: true, head: 'topi', facing: 1, skin: 0.5 });
          rangingRod(ctx, xx + 70, y - 4, 1);
          person(ctx, xx + 78, y - 4, 1, { pose: 'wave', cloth: P.marigold, head: 'turban', facing: -1, skin: 0.7 });
        } else if (i % 3 === 1) {
          person(ctx, xx - 30, y, 1.1, { pose: 'pull', cloth: P.peacock, head: 'cap', facing: -1, skin: 0.6 });
          person(ctx, xx + 30, y, 1.1, { pose: 'pull', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', facing: 1, skin: 0.4 });
          chain(ctx, xx - 22, y - 14, xx + 22, y - 14, 1.1);
          for (const px of [-50, 50]) { line(ctx, [[xx + px, y], [xx + px, y - 12]], mix(P.laterite, P.ink, 0.2), 1.6); dab(ctx, xx + px + 3, y - 11, 3, 2, 0, P.sindoor, 1); }
        } else {
          bullockCartBg(ctx, rng.fork(x), xx, y, 1.05);
          for (let k = 0; k < 6; k++) dab(ctx, xx - 20 + (k % 3) * 7, y - 30 - Math.floor(k / 3) * 4, 3.4, 2, 0, P.laterite, 1);
        }
      }), 120);
    },
    fore: 'grass',
    sign: { date: '13 Apr 1948', title: 'New Capital' },
    landmarks: [
      {
        // The great temple of the old town on the horizon (Ekamra) — background, drawn traditionally.
        at: 0.12, plane: 'mid', w: 380, h: 260,
        paint: (ctx, rng, w, h) => {
          broadTree(ctx, rng.fork('t1'), 40, h - 4, 90, 90, 0.15);
          broadTree(ctx, rng.fork('t2'), w - 40, h - 4, 100, 96, 0.15);
          rekhaDeula(ctx, rng.fork('a'), w * 0.3, h - 6, 120, { haze: 0.12, flagColour: P.sindoor });
          pidhaHall(ctx, rng.fork('b'), w * 0.62, h - 6, 70, 80, { haze: 0.1 });
          rekhaDeula(ctx, rng.fork('c'), w * 0.47, h - 6, 230, { haze: 0.08, flagColour: P.sindoor, chakra: true });
          rekhaDeula(ctx, rng.fork('d'), w * 0.76, h - 6, 96, { haze: 0.14 });
          ctx.fillStyle = mix(P.laterite, P.khondalite, 0.3);
          ctx.fillRect(10, h - 22, w - 20, 18);
          for (let x = 14; x < w - 14; x += 12) dab(ctx, x, h - 22, 5, 3, 0, mix(P.laterite, P.limewhite, 0.25), 1);
        },
      },
      {
        // A cow has settled on the town plan. The planner sighs; his assistant tugs a corner.
        at: 0.34, plane: 'near', w: 260, h: 110, y: 566,
        paint: (ctx, _rng, _w, h) => {
          const y = h - 10;
          const sheet = () => polyPath(ctx, [{ x: 40, y }, { x: 70, y: y - 22 }, { x: 214, y: y - 22 }, { x: 196, y }]);
          sheet();
          ctx.fillStyle = mix(P.neel, P.peacock, 0.1);
          ctx.fill();
          clipTo(ctx, sheet, () => {
            ctx.strokeStyle = withAlpha(P.limewhite, 0.6);
            ctx.lineWidth = 1;
            for (let x = 40; x < 220; x += 12) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y - 22); ctx.stroke(); }
            for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(80 + k * 36, y - 11, 12, 4, 0, 0, Math.PI * 2); ctx.stroke(); }
          });
          dab(ctx, 54, y - 3, 6, 3, 0, P.laterite, 1); // brick paperweights
          dab(ctx, 200, y - 4, 6, 3, 0, P.laterite, 1);
          cowLying(ctx, 136, y - 6, 1.5, -1);
          crow(ctx, 128, y - 34, 0.9, -1);
          // the planner: hands on hips, a puff of a sigh
          person(ctx, 232, y, 1.6, { pose: 'stand', cloth: P.limewhite, cloth2: mix(P.khondalite, P.neel, 0.3), trousers: true, head: 'none', facing: -1, skin: 0.35 });
          ctx.fillStyle = P.limewhite;
          ctx.fillRect(238, y - 30, 12, 5);
          for (let k = 0; k < 3; k++) puff(ctx, 216 - k * 7, y - 52 - k * 6, 3 + k * 1.6, P.limewhite, 0.85);
          person(ctx, 30, y, 1.4, { pose: 'pull', cloth: P.marigold, head: 'cap', facing: 1, skin: 0.6 });
        },
      },
      {
        // Foundation-stone day: a garlanded stone under a pandal, a crowd in caps and saris.
        at: 0.6, plane: 'mid', w: 460, h: 190,
        paint: (ctx, rng, w, h) => {
          const y = h - 6;
          pandal(ctx, rng.fork('p'), w * 0.5, y - 6, 300, 130);
          crowd(ctx, rng.fork('c1'), 20, w * 0.33, y, 1.45, { heads: ['topi', 'topi', 'none', 'turban'], density: 0.9, facing: 1 });
          crowd(ctx, rng.fork('c2'), w * 0.66, w - 20, y, 1.45, { heads: ['topi', 'none', 'turban'], density: 0.9, facing: -1 });
          // the stone on a little plinth, with marigold garlands
          ctx.fillStyle = mix(P.khondalite, P.limewhite, 0.25);
          ctx.fillRect(w * 0.5 - 30, y - 10, 60, 10);
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: w * 0.5 - 18, y: y - 10 }, { x: w * 0.5 - 18, y: y - 44 }, { x: w * 0.5 + 18, y: y - 44 }, { x: w * 0.5 + 18, y: y - 10 }]), { x: w * 0.5 - 18, y: y - 44, w: 36, h: 34 }, { base: mix(P.khondalite, P.chandan, 0.3), light: P.limewhite, shade: mix(P.khondalite, P.ink, 0.3) });
          garland(ctx, w * 0.5 - 18, y - 42, w * 0.5 + 18, y - 42, 20, 2.6);
          garland(ctx, w * 0.5 - 16, y - 40, w * 0.5 + 16, y - 40, 12, 2.2);
          dab(ctx, w * 0.5, y - 34, 4, 3, 0, P.sindoor, 1);
          person(ctx, w * 0.5 - 36, y, 1.6, { pose: 'serve', cloth: P.limewhite, cloth2: P.limewhite, head: 'topi', facing: 1, skin: 0.4 });
          person(ctx, w * 0.5 + 38, y, 1.5, { pose: 'conch', cloth: P.marigold, cloth2: P.sindoor, head: 'none', facing: -1, skin: 0.6 });
          for (const fx of [w * 0.5 - 150, w * 0.5 + 150]) flag(ctx, fx, y, 70, P.marigold, 0, 2);
        },
      },
      {
        // The plan becoming real: a house half laterite brick, half still a blueprint drawing.
        at: 0.86, plane: 'mid', w: 300, h: 180,
        paint: (ctx, rng, w, h) => {
          const y = h - 6, x = w * 0.5, bw = 120, bh = 110;
          ghostBuilding(ctx, x, y, bw, bh, 'house');
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - bw / 2, y }, { x: x - bw / 2, y: y - 40 }, { x: x - 20, y: y - 46 }, { x: x + 10, y: y - 38 }, { x: x + bw / 2, y: y - 30 }, { x: x + bw / 2, y }]), { x: x - bw / 2, y: y - 46, w: bw, h: 46 }, { base: P.laterite, light: mix(P.laterite, P.haldi, 0.35), shade: mix(P.laterite, P.ink, 0.35) });
          for (let r = 0; r < 6; r++) line(ctx, [[x - bw / 2, y - r * 7], [x + bw / 2, y - r * 7]], mix(P.laterite, P.ink, 0.35), 0.8, 0.6);
          // bamboo scaffold and a ladder
          for (const sx of [x - bw / 2 - 8, x + bw / 2 + 8]) line(ctx, [[sx, y], [sx, y - 92]], mix(P.haldi, P.laterite, 0.4), 2);
          line(ctx, [[x - bw / 2 - 8, y - 46], [x + bw / 2 + 8, y - 46]], mix(P.haldi, P.laterite, 0.4), 2);
          person(ctx, x - 20, y - 46, 1.3, { pose: 'carry', cloth: P.sindoor, head: 'none', sari: true, facing: 1, skin: 0.6 });
          person(ctx, x + 28, y - 46, 1.3, { pose: 'adze', cloth: P.limewhite, head: 'turban', facing: -1, skin: 0.7 });
          person(ctx, x - bw / 2 - 30, y, 1.4, { pose: 'carry', cloth: P.marigold, head: 'none', facing: 1, skin: 0.5 });
          person(ctx, x + bw / 2 + 34, y, 1.4, { pose: 'point', cloth: P.limewhite, cloth2: P.khondalite, trousers: true, head: 'topi', facing: -1, skin: 0.3 });
        },
      },
    ],
  }),

  // 29 · 13 Jan 1957 · Hirakud Dam opens — riding the crest beside the reservoir.
  r29: () => {
    const lake = { far: mix(P.seafoam, P.skyCream, 0.35), mid: mix(P.peacock, P.seafoam, 0.45), near: mix(P.peacock, P.seafoam, 0.15), deep: mix(P.peacock, P.neel, 0.15) };
    return {
      id: 'r29',
      sky: { stops: [[0, mix(P.peacock, P.seafoam, 0.45)], [0.5, mix(P.seafoam, P.skyCream, 0.45)], [1, P.skyCream]], sun: { x: 300, y: 110, r: 32 }, clouds: 'cumulus' },
      far: [{ kind: 'hills', a: mix(mix(P.tota, P.khondalite, 0.35), P.skyCream, 0.4), b: P.neel, height: [24, 76], base: 150, trees: true, haze: 0.45 }],
      ground: { kind: 'land', plain: lake.near, plainDetail: 'none', path: mix(P.laterite, P.haldi, 0.25), verge: mix(P.tota, P.haldi, 0.25) },
      mid: (ctx, rng, W) => {
        // The reservoir runs to the hills: a dyke with cattle, cyclists and pylons; islands and boats.
        vGradient(ctx, 0, 218, W, 42, [[0, lake.far, 1], [1, lake.mid, 1]]);
        for (let i = 0; i < 300; i++) {
          const x = rng.next() * W, y = 220 + rng.next() * 40;
          taperStroke(ctx, [{ x: x - 7, y }, { x: x + 7, y }], 1, rng.chance(0.6) ? P.limewhite : lake.deep, 0.35);
        }
        // islands
        scatter(rng.fork('isl'), W, [400, 700], (x, i) => wrapped(W, x, 80, (xx) => {
          const w = rng.range(60, 130);
          ctx.fillStyle = mix(mix(P.tota, P.peacock, 0.3), P.skyCream, 0.3);
          ctx.beginPath(); ctx.ellipse(xx, 226, w / 2, 7, 0, Math.PI, 0); ctx.fill();
          for (let k = 0; k < 3; k++) broadTree(ctx, rng.fork(`${i}${k}`), xx + rng.range(-w * 0.3, w * 0.3), 226, 26, 22, 0.35);
        }), 200);
        // the long earthen dyke
        const dy = 246;
        for (const [x0, x1] of [[0, 900], [1300, W]] as const) {
          ctx.fillStyle = mix(P.tota, P.laterite, 0.3);
          ctx.beginPath(); ctx.moveTo(x0, dy + 8); ctx.lineTo(x0 + (x0 ? 30 : 0), dy - 6); ctx.lineTo(x1 - (x1 < W ? 30 : 0), dy - 6); ctx.lineTo(x1, dy + 8); ctx.closePath(); ctx.fill();
          ctx.fillStyle = mix(P.laterite, P.chandan, 0.4);
          ctx.fillRect(x0 + (x0 ? 30 : 0), dy - 8, x1 - x0 - (x0 ? 30 : 0) - (x1 < W ? 30 : 0), 3);
          dabField(ctx, rng, x0, dy - 6, x1 - x0, 14, { n: 120, r: [1.5, 3], colours: [mix(P.tota, P.haldi, 0.3), mix(P.tota, P.ink, 0.2)], alpha: [0.3, 0.6] });
        }
        for (let x = 40; x < 900; x += 150) pylon(ctx, x, dy - 7, 0.55, mix(P.khondalite, P.neel, 0.2));
        for (let x = 1340; x < W; x += 150) pylon(ctx, x, dy - 7, 0.55, mix(P.khondalite, P.neel, 0.2));
        ctx.strokeStyle = withAlpha(mix(P.khondalite, P.neel, 0.2), 0.6);
        ctx.lineWidth = 0.6;
        for (const [a, b] of [[40, 890], [1340, 1940]] as const) for (let x = a; x < b; x += 150) { ctx.beginPath(); ctx.moveTo(x - 9, dy - 50); ctx.quadraticCurveTo(x + 75, dy - 42, x + 141, dy - 50); ctx.stroke(); }
        // life on the dyke road: a herd being driven home, cyclists
        const lr = rng.fork('life');
        for (const x of [160, 560, 1500]) { for (let k = 0; k < 5; k++) cow(ctx, x + k * 15, dy - 8, 0.36, { facing: -1, colour: k % 2 ? P.limewhite : mix(P.khondalite, P.chandan, 0.4), phase: k }); person(ctx, x + 84, dy - 8, 0.5, { pose: 'walk', cloth: P.marigold, head: 'turban', facing: -1 }); }
        for (const x of [380, 760, 1420, 1760]) {
          person(ctx, x, dy - 13, 0.5, { pose: 'sit', cloth: lr.pick([P.limewhite, P.sindoor, P.peacock]), head: 'cap' });
          for (const k of [-6, 6]) { ctx.strokeStyle = mix(P.ink, P.khondalite, 0.3); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x + k, dy - 11, 3.4, 0, Math.PI * 2); ctx.stroke(); }
        }
        // boats
        for (const x of [1000, 1200]) smallBoat(ctx, rng.fork(x), x, 256, 0.4, mix(P.laterite, P.ink, 0.15), 0.2);
      },
      near: (ctx, rng, W) => {
        // Close water under the crest, then the upstream stone pitching and a low kerb.
        vGradient(ctx, 0, 0, W, 122, [[0, lake.mid, 1], [1, lake.deep, 1]]);
        for (let i = 0; i < 520; i++) {
          const t = rng.next();
          const x = rng.next() * W, y = 3 + t * 112;
          const l = 6 + t * 26;
          wrapped(W, x, l, (xx) => taperStroke(ctx, curvePts(xx - l / 2, y, xx, y - 1.5, xx + l / 2, y, 5), 1 + t * 2, rng.chance(0.55) ? P.limewhite : mix(lake.deep, P.neel, 0.3), rng.range(0.2, 0.5)));
        }
        // sun glitter
        for (let i = 0; i < 60; i++) dab(ctx, rng.next() * W, rng.range(10, 100), rng.range(1, 2.4), 0.8, 0, P.haldi, 0.7);
        // stone pitching on the dam face
        ctx.fillStyle = mix(P.khondalite, P.chandan, 0.25);
        ctx.fillRect(0, 116, W, 24);
        dabField(ctx, rng, 0, 116, W, 22, { n: 1200, r: [2.5, 5], colours: [mix(P.khondalite, P.limewhite, 0.3), P.khondalite, mix(P.khondalite, P.laterite, 0.3)], alpha: [0.6, 0.95], aspect: [0.5, 0.8] });
        vGradient(ctx, 0, 112, W, 8, [[0, lake.deep, 0], [1, P.limewhite, 0.5]]);
        ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.25);
        ctx.fillRect(0, 132, W, 8);
        ctx.fillStyle = withAlpha(mix(P.khondalite, P.ink, 0.3), 0.5);
        ctx.fillRect(0, 138, W, 2);
      },
      fore: 'flowers',
      sign: { date: '13 Jan 1957', title: 'Hirakud' },
      landmarks: [
        {
          // A fisherman holds up a fish bigger than himself; his friend can't believe it.
          at: 0.26, plane: 'near', w: 200, h: 120, y: 552,
          paint: (ctx, rng, w, h) => {
            const y = h - 14;
            smallBoat(ctx, rng, w / 2, y, 1.2, mix(P.laterite, P.sindoor, 0.15));
            person(ctx, w / 2 + 6, y - 6, 1.35, { pose: 'armsUp', cloth: P.marigold, head: 'none', facing: -1, skin: 0.7 });
            // the fish (a giant rohu)
            const fx = w / 2 + 6, fy = y - 72;
            dab(ctx, fx, fy, 28, 9, 0.05, mix(P.limewhite, P.khondalite, 0.35), 1);
            dab(ctx, fx, fy - 3, 24, 4, 0.05, mix(P.limewhite, P.peacock, 0.2), 0.8);
            dab(ctx, fx + 2, fy + 3, 22, 3, 0.05, mix(P.limewhite, P.sindoor, 0.2), 0.6);
            ctx.fillStyle = mix(P.khondalite, P.sindoor, 0.3);
            ctx.beginPath(); ctx.moveTo(fx - 26, fy); ctx.lineTo(fx - 40, fy - 10); ctx.lineTo(fx - 38, fy + 11); ctx.closePath(); ctx.fill();
            dab(ctx, fx + 21, fy - 2, 1.6, 1.6, 0, P.ink, 1);
            person(ctx, w / 2 - 40, y - 4, 1.2, { pose: 'armsUp', cloth: P.peacock, head: 'cap', facing: 1, skin: 0.5 });
            taperStroke(ctx, [{ x: w / 2 + 34, y: y - 8 }, { x: w / 2 + 62, y: y + 8 }], 2.4, mix(P.laterite, P.ink, 0.3), 1, [1, 1]);
          },
        },
        {
          // The spillway on opening day: gates open, spray arcs, a rainbow in the mist, bunting.
          at: 0.5, plane: 'mid', w: 820, h: 210, y: 466,
          paint: (ctx, rng, w, h) => {
            const y = h - 6, top = y - 96;
            const con = mix(P.limewhite, P.khondalite, 0.25);
            const conD = mix(P.khondalite, P.neel, 0.2);
            // earthen wings
            for (const [a, b] of [[0, 230], [w - 230, w]] as const) {
              paintedShape(ctx, rng, () => polyPath(ctx, [{ x: a, y }, { x: a + (a ? 0 : 30), y: top + 30 }, { x: b - (a ? 30 : 0), y: top + 30 }, { x: b, y }]), { x: a, y: top + 30, w: b - a, h: y - top - 30 }, { base: mix(P.tota, P.laterite, 0.3), light: mix(P.tota, P.haldi, 0.35), shade: mix(P.tota, P.ink, 0.3) });
            }
            // the concrete spillway block and its piers
            paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 220, y }, { x: 230, y: top }, { x: w - 230, y: top }, { x: w - 220, y }]), { x: 220, y: top, w: w - 440, h: y - top }, { base: con, light: P.limewhite, shade: conD, lightFrom: 'top' });
            const n = 14, gw = (w - 470) / n;
            for (let i = 0; i < n; i++) {
              const gx = 235 + i * gw;
              ctx.fillStyle = mix(P.neel, P.khondalite, 0.45);
              ctx.fillRect(gx + 3, top + 10, gw - 6, 24);
              ctx.fillStyle = con;
              ctx.fillRect(gx - 2, top - 10, 4, 46);
              if (i % 2 === 0) {
                // a spray arc from an open gate
                const sx = gx + gw / 2;
                taperStroke(ctx, curvePts(sx, top + 30, sx + 18, top + 20, sx + 30, y + 4, 12), 9, P.limewhite, 0.85, [0.8, 0.3]);
                taperStroke(ctx, curvePts(sx, top + 30, sx + 12, top + 24, sx + 22, y, 12), 4, mix(P.limewhite, P.seafoam, 0.4), 0.9, [0.8, 0.3]);
              }
            }
            ctx.fillStyle = mix(con, P.ink, 0.15);
            ctx.fillRect(220, top - 14, w - 440, 6);
            // mist and a rainbow
            for (let i = 0; i < 26; i++) puff(ctx, 240 + rng.next() * (w - 480), y - rng.range(0, 30), rng.range(16, 34), P.limewhite, 0.4);
            const bands = [P.sindoor, P.marigold, P.haldi, P.tota, P.peacock, P.neel];
            bands.forEach((b, i) => { ctx.strokeStyle = withAlpha(b, 0.32); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(w * 0.56, y + 30, 120 - i * 4, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); });
            // opening-day bunting and spectators on the crest
            for (let i = 0; i < 30; i++) {
              const bx = 236 + i * ((w - 472) / 30);
              ctx.fillStyle = [P.sindoor, P.haldi, P.tota, P.marigold][i % 4];
              ctx.beginPath(); ctx.moveTo(bx, top - 26); ctx.lineTo(bx + 9, top - 26); ctx.lineTo(bx + 4.5, top - 18); ctx.closePath(); ctx.fill();
            }
            line(ctx, [[230, top - 26], [w - 230, top - 26]], mix(P.ink, P.laterite, 0.3), 0.8);
            crowd(ctx, rng.fork('c'), 250, w - 250, top - 14, 0.9, { density: 1.4 });
            for (const fx of [236, w - 236]) flag(ctx, fx, top - 14, 46, P.marigold, 0, 2);
          },
        },
        {
          // Pylons march away from the powerhouse, carrying the dam's electricity off over the hills.
          at: 0.78, plane: 'mid', w: 760, h: 230, y: 452,
          paint: (ctx, rng, w, h) => {
            const y = h - 4;
            const col = mix(P.khondalite, P.neel, 0.35);
            const pts: [number, number, number][] = [];
            for (let i = 0; i < 7; i++) { const t = i / 6; const s = 2.2 * Math.pow(0.68, i); pts.push([w * 0.12 + (1 - Math.pow(1 - t, 1.6)) * w * 0.82, y - (1 - s / 2.2) * 26, s]); }
            // the powerhouse with a little glow
            paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 0, y }, { x: 0, y: y - 60 }, { x: 110, y: y - 60 }, { x: 110, y }]), { x: 0, y: y - 60, w: 110, h: 60 }, { base: mix(P.marigold, P.limewhite, 0.5), light: P.limewhite, shade: mix(P.marigold, P.laterite, 0.4), lightFrom: 'right' });
            for (let i = 0; i < 5; i++) { ctx.fillStyle = mix(P.neel, P.peacock, 0.3); ctx.fillRect(10 + i * 20, y - 48, 10, 22); }
            ctx.fillStyle = mix(P.marigold, P.laterite, 0.3);
            ctx.fillRect(-2, y - 64, 114, 6);
            for (const [x, by, s] of pts) pylon(ctx, x, by, s, col);
            ctx.strokeStyle = withAlpha(col, 0.7);
            ctx.lineWidth = 0.8;
            for (const ky of [14, 26]) for (const kx of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(108, y - 54);
              for (const [x, by, s] of pts) ctx.lineTo(x + kx * (ky === 14 ? 17 : 13) * s, by - 92 * s + ky * s);
              ctx.stroke();
            }
          },
        },
      ],
    };
  },

  // 30 · 3 Feb 1959 · Rourkela lights its first blast furnace — the steel city at dusk.
  r30: () => ({
    id: 'r30',
    sky: { stops: [[0, mix(P.peacock, P.seafoam, 0.3)], [0.45, mix(P.skyCream, P.marigold, 0.18)], [1, mix(P.marigold, P.skyCream, 0.45)]], sun: { x: 1100, y: 200, r: 30, colour: P.marigold }, clouds: 'cumulus', cloudTint: P.marigold, halftone: mix(P.marigold, P.skyCream, 0.4) },
    far: [{ kind: 'hills', a: mix(mix(P.tota, P.peacock, 0.4), P.skyCream, 0.42), b: P.neel, height: [34, 96], trees: true, haze: 0.45 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.2), plainDetail: 'grass', path: mix(P.khondalite, P.laterite, 0.35), verge: mix(P.khondalite, P.tota, 0.35) },
    mid: (ctx, rng, W) => {
      // The plant along the horizon, township trees in front of it.
      plantSkyline(ctx, rng.fork('plant'), 0, 236, 1300, 0.28);
      treeRow(ctx, rng.fork('trees'), W, 248, 0.25, 0.1);
      for (let x = 1380; x < W - 60; x += rng.range(60, 90)) house(ctx, rng.fork(x), x, 250, rng.range(46, 64), rng.range(36, 46), { roof: 'flat', wall: rng.pick([mix(P.marigold, P.limewhite, 0.55), mix(P.seafoam, P.limewhite, 0.4), P.limewhite]), haze: 0.15 });
      crane(ctx, 300, 236, 0.9, mix(P.marigold, P.khondalite, 0.35), 0.2);
      crane(ctx, 980, 236, 0.75, mix(P.marigold, P.khondalite, 0.35), 0.25);
      bank(ctx, rng.fork('bank'), W, 250, mix(P.tota, P.haldi, 0.3), mix(P.khondalite, P.laterite, 0.3));
    },
    near: (ctx, rng, W) => {
      // Rail yard: ore wagons on a siding, a signal cabin; then the township playing field.
      ctx.fillStyle = mix(P.khondalite, P.ink, 0.2);
      ctx.fillRect(0, 104, 1200, 3);
      ctx.fillRect(0, 110, 1200, 2);
      for (let x = 0; x < 1200; x += 9) ctx.fillRect(x, 104, 3, 8);
      for (let i = 0; i < 9; i++) {
        const wx = 60 + i * 64;
        paintedShape(ctx, rng, () => polyPath(ctx, [{ x: wx - 28, y: 100 }, { x: wx - 30, y: 80 }, { x: wx + 30, y: 80 }, { x: wx + 28, y: 100 }]), { x: wx - 30, y: 80, w: 60, h: 20 }, { base: mix(P.laterite, P.ink, 0.25), light: mix(P.laterite, P.marigold, 0.3), shade: mix(P.laterite, P.ink, 0.5), dabs: 8 });
        dab(ctx, wx, 80, 26, 7, 0, mix(P.laterite, P.sindoor, 0.2), 1); // heaped iron ore
        for (const k of [-18, 18]) dab(ctx, wx + k, 103, 4, 4, 0, P.ink, 1);
      }
      wrapped(W, 800, 40, (xx) => house(ctx, rng.fork('cabin'), xx, 104, 44, 40, { roof: 'tile', wall: mix(P.marigold, P.limewhite, 0.4) }));
      wrapped(W, 1000, 60, (xx) => trainBg(ctx, rng.fork('loco'), xx, 106, 0.8, 3, 0.1));
      // township field strip
      vGradient(ctx, 1260, 96, 760, 24, [[0, mix(P.tota, P.haldi, 0.3), 1], [1, mix(P.tota, P.haldi, 0.15), 1]]);
      for (let x = 1290; x < 2000; x += 110) broadTree(ctx, rng.fork(x), x, 98, 60, 62, 0.05);
      scatter(rng.fork('walkers'), W, [260, 420], (x, i) => wrapped(W, x, 30, (xx) => {
        if (i % 2) person(ctx, xx, 122, 1.1, { pose: 'walk', cloth: P.peacock, cloth2: P.khondalite, trousers: true, head: 'helmet', facing: 1, phase: i });
        else { person(ctx, xx, 122, 1.1, { pose: 'walk', cloth: P.sindoor, sari: true, head: 'veil', facing: -1, phase: i }); person(ctx, xx + 12, 122, 0.8, { pose: 'walk', cloth: P.haldi, head: 'none', facing: -1, phase: i + 1 }); }
      }), 60);
    },
    fore: 'stones',
    sign: { date: '3 Feb 1959', title: 'Rourkela' },
    landmarks: [
      {
        // Tea break at the plant gate: steam from the kettle, helmets off — and a goat reading the paper.
        at: 0.2, plane: 'near', w: 240, h: 110, y: 572,
        paint: (ctx, rng, w, h) => {
          const y = h - 6;
          stall(ctx, w * 0.45, y, 76, 62, [P.marigold, P.limewhite]);
          dab(ctx, w * 0.45 - 16, y - 32, 7, 6, 0, mix(P.khondalite, P.ink, 0.3), 1); // kettle
          glow(ctx, w * 0.45 - 16, y - 24, 12, P.marigold, 0.6);
          for (let k = 0; k < 5; k++) puff(ctx, w * 0.45 - 18 - k * 3, y - 44 - k * 8, 3 + k, P.limewhite, 0.55 - k * 0.08);
          person(ctx, w * 0.45 + 6, y, 1.45, { pose: 'serve', cloth: P.limewhite, cloth2: P.sindoor, head: 'none', facing: -1, skin: 0.6 });
          person(ctx, w * 0.12, y, 1.45, { pose: 'read', cloth: P.peacock, cloth2: P.khondalite, trousers: true, head: 'helmet', facing: 1, skin: 0.5 });
          person(ctx, w * 0.78, y, 1.45, { pose: 'serve', cloth: P.marigold, cloth2: P.khondalite, trousers: true, head: 'helmet', facing: -1, skin: 0.7 });
          goat(ctx, w * 0.95 - 4, y, 1.25, -1, 0, P.limewhite);
          rng.next();
        },
      },
      {
        // 'Parvati' is lit: the first blast furnace glows, garlanded, workers cheering.
        at: 0.44, plane: 'mid', w: 480, h: 330, y: 458,
        paint: (ctx, rng, w, h) => {
          const y = h - 6, x = w * 0.42;
          glow(ctx, x, y - 70, 220, P.marigold, 0.35);
          blastFurnace(ctx, rng, x, y, 1.75, 0, 'Parvati');
          garland(ctx, x - 40, y - 150, x + 40, y - 150, 34, 3.4);
          for (let i = 0; i < 4; i++) glow(ctx, x + rng.range(-20, 20), y - 6, 18, P.haldi, 0.5);
          crowd(ctx, rng.fork('cheer'), 30, w * 0.3, y, 1.5, { poses: ['armsUp', 'wave', 'stand'], heads: ['helmet', 'helmet', 'cap'], cloths: [P.peacock, P.limewhite, P.marigold, P.khondalite], facing: 1, density: 1.1 });
          crowd(ctx, rng.fork('cheer2'), w * 0.62, w - 20, y, 1.5, { poses: ['armsUp', 'wave', 'stand'], heads: ['helmet', 'cap', 'none'], facing: -1, density: 1.1 });
          for (const fx of [x - 80, x + 120]) flag(ctx, fx, y, 80, P.sindoor, 0, 3);
        },
      },
      {
        // Township kids at hockey: two goals, a scramble for the ball, a dog joining in.
        at: 0.7, plane: 'near', w: 360, h: 100, y: 568,
        paint: (ctx, rng, w, h) => {
          const y = h - 8;
          ctx.fillStyle = mix(P.tota, P.haldi, 0.2);
          ctx.beginPath(); ctx.ellipse(w / 2, y - 6, w / 2, 14, 0, 0, Math.PI * 2); ctx.fill();
          line(ctx, [[w / 2, y - 20], [w / 2, y + 8]], P.limewhite, 1, 0.6);
          hockeyGoal(ctx, 26, y - 2, 1.6, 1);
          hockeyGoal(ctx, w - 26, y - 2, 1.6, -1);
          const kids: [number, 1 | -1, string][] = [[80, 1, P.sindoor], [140, 1, P.haldi], [170, -1, P.peacock], [205, -1, P.limewhite], [250, 1, P.sindoor], [300, -1, P.peacock]];
          kids.forEach(([kx, f, c], i) => person(ctx, kx, y - (i % 2) * 4, 1.05, { pose: 'hockey', cloth: c, cloth2: P.limewhite, head: i === 3 ? 'bun' : 'none', facing: f, skin: rng.next(), phase: i }));
          person(ctx, w - 44, y, 1.05, { pose: 'armsUp', cloth: P.tota, head: 'cap', facing: -1, skin: 0.6 });
          dab(ctx, 188, y - 2, 2.2, 2.2, 0, P.limewhite, 1);
          // the dog
          dab(ctx, 222, y - 8, 7, 4, 0, mix(P.chandan, P.laterite, 0.3), 1);
          dab(ctx, 214, y - 12, 3.4, 3, 0, mix(P.chandan, P.laterite, 0.3), 1);
          for (const lx of [-5, 5]) line(ctx, [[222 + lx, y - 6], [222 + lx * 1.4, y]], mix(P.chandan, P.laterite, 0.5), 1.6);
          line(ctx, [[229, y - 9], [234, y - 15]], mix(P.chandan, P.laterite, 0.5), 1.4);
        },
      },
    ],
  }),

  // 31 · 29 Oct 1999 · The Super Cyclone — Paradip coast, storm-grey and indigo, quiet.
  r31: () => {
    const storm = DERIVED.stormGrey;
    const sea = { a: mix(mix(P.peacock, P.neel, 0.45), storm, 0.45), b: mix(P.neel, P.ink, 0.4) };
    return {
      id: 'r31',
      sky: { stops: [[0, mix(P.neel, P.ink, 0.45)], [0.45, mix(storm, P.neel, 0.35)], [1, mix(storm, P.skyCream, 0.3)]], clouds: 'storm', cloudTint: mix(P.neel, P.ink, 0.35), halftone: P.neel },
      far: [{ kind: 'sea', a: sea.a, b: sea.b }],
      ground: { kind: 'land', plain: mix(mix(P.tota, storm, 0.6), P.neel, 0.15), plainDetail: 'grass', path: mix(mix(P.laterite, storm, 0.55), P.ink, 0.1), verge: mix(mix(P.tota, P.neel, 0.4), storm, 0.5) },
      mid: (ctx, rng, W) => {
        // Heaving sea with white crests, a low dune, palms bent hard to the left, rain.
        vGradient(ctx, 0, 200, W, 44, [[0, sea.a, 0], [0.3, sea.a, 1], [1, mix(sea.a, P.seafoam, 0.15), 1]]);
        for (let i = 0; i < 140; i++) {
          const x = rng.next() * W, y = rng.range(214, 240), l = rng.range(20, 60);
          wrapped(W, x, l, (xx) => taperStroke(ctx, curvePts(xx - l / 2, y + 3, xx - l * 0.1, y - 4, xx + l / 2, y + 2, 8), rng.range(2, 4), mix(P.limewhite, storm, 0.25), rng.range(0.4, 0.75), [0.1, 0.4]));
        }
        bank(ctx, rng.fork('dune'), W, 238, mix(mix(P.chandan, storm, 0.55), P.limewhite, 0.1), mix(mix(P.tota, storm, 0.6), P.neel, 0.15));
        scatter(rng.fork('palms'), W, [90, 200], (x, i) => {
          const h = rng.range(110, 170);
          wrapped(W, x, h * 0.6, (xx) => stormPalm(ctx, rng.fork(`p${i}`), xx, 246, h, 0.28, rng.range(0.32, 0.45)));
        });
        scatter(rng.fork('huts'), W, [300, 520], (x) => wrapped(W, x, 30, (xx) => house(ctx, rng.fork(x), xx, 250, 44, 34, { roof: 'tile', wall: mix(P.limewhite, storm, 0.4), door: mix(P.neel, P.ink, 0.3), haze: 0.18 })));
        rain(ctx, rng.fork('rain'), 0, 0, W, 260, 1700, mix(P.limewhite, P.seafoam, 0.3), 0.32);
      },
      near: (ctx, rng, W) => {
        scatter(rng.fork('palms'), W, [260, 460], (x, i) => {
          const h = rng.range(170, 230);
          wrapped(W, x, h * 0.7, (xx) => stormPalm(ctx, rng.fork(`n${i}`), xx, 140, h, 0.08, rng.range(0.34, 0.48)));
        });
        for (let x = 0; x < W; x += rng.range(20, 50)) wrapped(W, x, 20, (xx) => reedTuft(ctx, rng.fork(x), xx, 138, 22, rng.range(10, 20), { dark: mix(P.neel, P.ink, 0.3), mid: mix(mix(P.tota, P.neel, 0.4), storm, 0.4), tip: mix(P.seafoam, storm, 0.5) }, 6));
        rain(ctx, rng.fork('rain'), 0, 0, W, 140, 1100, mix(P.limewhite, P.seafoam, 0.3), 0.38);
      },
      fore: (ctx, rng, W) => {
        for (let x = 0; x < W; x += rng.range(160, 320)) {
          wrapped(W, x, 50, (xx) => {
            for (let i = 0; i < 9; i++) {
              const bx = xx + rng.range(-30, 30), h = rng.range(26, 50);
              taperStroke(ctx, curvePts(bx, 124, bx - h * 0.2, 124 - h * 0.6, bx - h * 0.7, 124 - h * 0.8, 6), 4, rng.pick([mix(P.neel, P.ink, 0.35), mix(mix(P.tota, P.neel, 0.5), storm, 0.4)]), 1, [1, 0.05]);
            }
          });
        }
      },
      sign: { date: '29 Oct 1999', title: 'Paradip' },
      landmarks: [
        {
          // Paradip port across the water: cranes and a lighthouse in the murk, one small red light.
          at: 0.18, plane: 'far', w: 620, h: 190, y: 456,
          paint: (ctx, _rng, w, h) => {
            const y = h - 4;
            const sil = mix(storm, P.neel, 0.45);
            ctx.fillStyle = sil;
            ctx.fillRect(20, y - 10, w - 40, 10);
            for (const [x, s] of [[120, 1], [230, 0.85], [330, 1.1], [470, 0.9]] as const) crane(ctx, x, y - 8, s, sil, 0.12);
            ctx.fillRect(560, y - 120, 12, 112);
            ctx.fillStyle = mix(storm, P.limewhite, 0.2);
            ctx.fillRect(557, y - 128, 18, 10);
            glow(ctx, 566, y - 124, 60, mix(P.haldi, P.limewhite, 0.4), 0.35);
            glow(ctx, 342, y - 138, 10, P.sindoor, 0.8);
            vGradient(ctx, 0, 0, w, h, [[0, storm, 0], [1, storm, 0.2]]);
          },
        },
        {
          // A family, hand in hand, carries a lamp towards higher ground.
          at: 0.42, plane: 'near', w: 200, h: 110, y: 566,
          paint: (ctx, _rng, w, h) => {
            const y = h - 6;
            const fam: [number, number, PersonOpts][] = [
              [w * 0.22, 1.6, { pose: 'walk', cloth: mix(P.limewhite, storm, 0.3), cloth2: mix(P.neel, storm, 0.3), head: 'none', facing: 1, skin: 0.7, phase: 1 }],
              [w * 0.4, 1.0, { pose: 'walk', cloth: mix(P.marigold, storm, 0.35), head: 'none', facing: 1, skin: 0.5, phase: 2 }],
              [w * 0.56, 1.5, { pose: 'walk', cloth: mix(P.sindoor, storm, 0.4), sari: true, head: 'veil', facing: 1, skin: 0.55, phase: 3 }],
              [w * 0.74, 1.6, { pose: 'lamp', cloth: mix(P.limewhite, storm, 0.25), cloth2: mix(P.khondalite, P.neel, 0.2), head: 'cap', facing: 1, skin: 0.6, phase: 0 }],
            ];
            // joined hands
            for (let i = 0; i < fam.length - 1; i++) {
              const [x0, s0] = fam[i], [x1, s1] = fam[i + 1];
              taperStroke(ctx, curvePts(x0 + 3 * s0, y - 22 * s0, (x0 + x1) / 2, y - 14 * Math.min(s0, s1), x1 - 3 * s1, y - 22 * s1, 6), 2.2, mix(P.chandan, P.laterite, 0.5), 1, [1, 1]);
            }
            for (const [x, s, o] of fam) person(ctx, x, y, s, o);
            const lx = w * 0.74 + 11, ly = y - 30;
            glow(ctx, lx, ly, 60, P.haldi, 0.45);
            glow(ctx, lx, ly, 16, P.marigold, 0.9);
          },
        },
        {
          // The sturdy concrete school on the rise, windows lit: people are sheltering inside.
          at: 0.56, plane: 'mid', w: 360, h: 210,
          paint: (ctx, rng, w, h) => {
            const y = h - 6;
            ctx.fillStyle = mix(mix(P.tota, storm, 0.6), P.neel, 0.2);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(w / 2, y - 40, w, y); ctx.fill();
            const x = w / 2, bw = 200, bh = 110, by = y - 26;
            glow(ctx, x, by - bh / 2, 200, P.haldi, 0.18);
            paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - bw / 2, y: by }, { x: x - bw / 2, y: by - bh }, { x: x + bw / 2, y: by - bh }, { x: x + bw / 2, y: by }]), { x: x - bw / 2, y: by - bh, w: bw, h: bh }, { base: mix(P.limewhite, storm, 0.45), light: mix(P.limewhite, storm, 0.2), shade: mix(storm, P.neel, 0.3), lightFrom: 'left' });
            ctx.fillStyle = mix(storm, P.ink, 0.2);
            ctx.fillRect(x - bw / 2 - 6, by - bh - 6, bw + 12, 8);
            ctx.fillRect(x - bw / 2 - 6, by - bh / 2 - 3, bw + 12, 5);
            for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
              const wx = x - bw / 2 + 12 + i * 31, wy = by - bh + 14 + r * 55;
              ctx.fillStyle = (i + r) % 4 === 3 ? mix(P.neel, P.ink, 0.3) : mix(P.haldi, P.marigold, 0.3);
              ctx.fillRect(wx, wy, 18, 26);
              glow(ctx, wx + 9, wy + 13, 22, P.haldi, 0.22);
              ctx.fillStyle = withAlpha(mix(storm, P.ink, 0.3), 0.8);
              ctx.fillRect(wx + 8, wy, 2, 26);
            }
            ctx.fillStyle = mix(P.haldi, P.marigold, 0.4);
            ctx.fillRect(x - 12, by - 36, 24, 36);
            person(ctx, x - 2, by, 1.2, { pose: 'wave', cloth: mix(P.limewhite, storm, 0.3), head: 'none', facing: -1, skin: 0.6 });
            ctx.fillStyle = mix(storm, P.khondalite, 0.3);
            ctx.fillRect(x - 40, by, 80, 8);
            ctx.fillRect(x - 30, by + 8, 60, 8);
            rain(ctx, rng, 0, 0, w, h, 200, mix(P.limewhite, P.seafoam, 0.3), 0.3);
          },
        },
        {
          // Boats hauled far up the beach and lashed to the palms, as fishermen do before a storm.
          at: 0.84, plane: 'mid', w: 300, h: 160,
          paint: (ctx, rng, w, h) => {
            const y = h - 6;
            stormPalm(ctx, rng.fork('p'), w * 0.72, y, 150, 0.15, 0.4);
            for (const [bx, s] of [[w * 0.3, 1.3], [w * 0.52, 1.1]] as const) smallBoat(ctx, rng.fork(bx), bx, y - 2, s, mix(mix(P.laterite, storm, 0.4), P.neel, 0.1));
            line(ctx, [[w * 0.3 + 40, y - 12], [w * 0.72, y - 30]], mix(P.chandan, storm, 0.3), 1.2);
            line(ctx, [[w * 0.52 + 34, y - 10], [w * 0.72, y - 24]], mix(P.chandan, storm, 0.3), 1.2);
            person(ctx, w * 0.86, y, 1.4, { pose: 'pull', cloth: mix(P.peacock, storm, 0.4), head: 'cap', facing: -1, skin: 0.7 });
            rain(ctx, rng, 0, 0, w, h, 140, mix(P.limewhite, P.seafoam, 0.3), 0.3);
          },
        },
      ],
    };
  },
};
