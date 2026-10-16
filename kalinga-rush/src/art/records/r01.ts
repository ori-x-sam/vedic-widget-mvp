// Record 01 · c. 1500 BCE · Golbai Sasan on the Malaguni, north of Chilika.
// Procedural placeholder layers in the Act I palette (peacock lead + seafoam,
// laterite, haldi). Painted /art/r01/<layer>.webp files replace these when present.
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { Rng, periodicFbm } from '../../lib/rng';
import { GAME_W } from '../../config';
import {
  clipTo, curvePts, dab, dabField, glow, halftone, makeCanvas, paintedShape, softShadow, taperStroke, vGradient, wrapped, type Ctx,
} from '../brush';
import { broadTree, cloud, coconutPalm, egret, flamingo, lotusFlower, lotusPad, palmyraPalm, reedTuft, villager } from '../shared/nature';
import { DEPTH, type DecorSpec, type LayerSpec, type SceneArt } from '../layers';

const TW = 2048; // tiling strip width
export const R01_LANE = 598;
const WATER_TOP = 448;
const SUN = { x: 965, y: 118, r: 40 };

// Water colour ramp (peacock lead).
const WATER = {
  sky: mix(P.seafoam, P.skyCream, 0.42),
  light: mix(P.peacock, P.seafoam, 0.5),
  mid: mix(P.peacock, P.seafoam, 0.2),
  deep: mix(P.peacock, P.neel, 0.24),
  dark: mix(P.peacock, P.neel, 0.45),
};

export function paintR01(seed = 1): SceneArt {
  const rng = new Rng(`r01-art:${seed}`);
  const layers: LayerSpec[] = [];
  const add = (l: LayerSpec) => layers.push(l);

  add({ name: 'sky', canvas: paintSky(rng.fork('sky')), y: 0, parallax: 0, depth: DEPTH.sky, tile: false });
  add({ name: 'clouds', canvas: paintClouds(rng.fork('clouds')), y: 60, parallax: 0.04, drift: 6, depth: DEPTH.clouds, tile: true });
  add({ name: 'sun', canvas: paintSun(rng.fork('sun')), y: 0, parallax: 0, depth: DEPTH.sun, tile: false });
  add({ name: 'far', canvas: paintFar(rng.fork('far')), y: 300, parallax: 0.12, depth: DEPTH.far, tile: true });
  add({ name: 'water', canvas: paintWaterBase(rng.fork('water')), y: WATER_TOP, parallax: 0, depth: DEPTH.waterBase, tile: false });
  add({ name: 'glitter', canvas: paintGlitter(rng.fork('glitter')), y: WATER_TOP, parallax: 0, depth: DEPTH.glitter, tile: false, shimmer: 0.25, blend: 'screen' });
  const mid = paintMid(rng.fork('mid'));
  add({ name: 'reflection', canvas: paintReflection(mid.canvas, 246, rng.fork('refl')), y: 456, parallax: 0.3, depth: DEPTH.reflection, tile: true, alpha: 0.6 });
  add({ name: 'ripples-far', canvas: paintRipples(rng.fork('rf'), 80, 520, [5, 20], [0.8, 1.8], 0.6), y: 452, parallax: 0.4, depth: DEPTH.ripplesFar, tile: true });
  add({ name: 'mid', canvas: mid.canvas, y: 210, parallax: 0.3, depth: DEPTH.mid, tile: true });
  add({ name: 'near', canvas: paintNear(rng.fork('near')), y: 470, parallax: 0.55, depth: DEPTH.near, tile: true });
  add({ name: 'ripples-mid', canvas: paintRipples(rng.fork('rm'), 100, 340, [14, 42], [1.4, 3], 0.8), y: 528, parallax: 0.68, depth: DEPTH.ripplesMid, tile: true });
  add({ name: 'ripples-near', canvas: paintRipples(rng.fork('rn'), 132, 230, [28, 78], [2.2, 4.6], 1), y: 592, parallax: 1, depth: DEPTH.ripplesNear, tile: true });
  add({ name: 'lip', canvas: paintLip(rng.fork('lip')), y: R01_LANE - 12, parallax: 1, depth: DEPTH.lip, tile: true });
  add({ name: 'fore', canvas: paintFore(rng.fork('fore')), y: 612, parallax: 1.32, depth: DEPTH.fore, tile: true });

  const decor: DecorSpec[] = [
    ...mid.workers.map((w, i) => ({ kind: 'worker' as const, x: w.x, y: 210 + w.y, parallax: 0.3, period: TW, depth: DEPTH.midDecor, scale: 1.15, phase: i * 0.45 })),
    ...mid.fires.map((f) => ({ kind: 'smoke' as const, x: f.x, y: 210 + f.y, parallax: 0.3, period: TW, depth: DEPTH.midDecor, scale: 1 })),
    { kind: 'sign', x: 1520, y: 549, parallax: 0.55, period: 0, depth: DEPTH.sign, text: { date: 'c. 1500 BCE', title: 'Golbai Sasan' } },
  ];

  return { recordId: 'r01', laneY: R01_LANE, waterTop: WATER_TOP, layers, decor };
}

// ---------------------------------------------------------------------------
function paintSky(rng: Rng): HTMLCanvasElement {
  const W = GAME_W, H = 470;
  const [c, ctx] = makeCanvas(W, H);
  vGradient(ctx, 0, 0, W, H, [
    [0, mix(P.seafoam, P.skyCream, 0.22), 1],
    [0.5, mix(P.skyCream, P.seafoam, 0.12), 1],
    [0.82, P.skyCream, 1],
    [1, mix(P.skyCream, P.haldi, 0.22), 1],
  ]);
  // Warm glow around the sun.
  glow(ctx, SUN.x, SUN.y, 420, P.haldi, 0.22);
  glow(ctx, SUN.x, SUN.y, 170, P.haldi, 0.4);
  // Painted sky: broad, low-alpha horizontal dabs.
  dabField(ctx, rng, -60, -20, W + 120, H, { n: 170, r: [40, 130], colours: [P.limewhite, P.skyCream, mix(P.seafoam, P.skyCream, 0.4)], alpha: [0.04, 0.1], aspect: [0.16, 0.32], rot: 0, rotJitter: 0.06 });
  // Textbook sun rays.
  ctx.save();
  ctx.translate(SUN.x, SUN.y);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.1;
    const len = i % 2 ? 230 : 330;
    ctx.fillStyle = withAlpha(P.haldi, i % 2 ? 0.05 : 0.075);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.05) * 60, Math.sin(a - 0.05) * 60);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.lineTo(Math.cos(a + 0.05) * 60, Math.sin(a + 0.05) * 60);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Printed halftone, strongest at the top of the sky (§4.3 rule 5).
  halftone(ctx, 0, 0, W, H, 7, mix(P.peacock, P.seafoam, 0.55), 0.07, (_x, y) => Math.pow(1 - y / H, 1.6));
  // Distant birds.
  for (let i = 0; i < 7; i++) {
    const bx = rng.range(180, 640), by = rng.range(110, 240), s = rng.range(4, 7);
    ctx.strokeStyle = withAlpha(mix(P.ink, P.skyCream, 0.45), 0.8);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx - s, by - s * 0.4);
    ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by - s * 0.4);
    ctx.stroke();
  }
  return c;
}

/** The sun sits on its own layer above the clouds so it always reads as a disc. */
function paintSun(rng: Rng): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(GAME_W, 260);
  glow(ctx, SUN.x, SUN.y, 110, P.haldi, 0.32);
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
  ctx.fillStyle = P.haldi;
  ctx.fill();
  clipTo(ctx, () => { ctx.beginPath(); ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2); }, () => {
    glow(ctx, SUN.x - 12, SUN.y - 14, 40, P.limewhite, 0.55);
    dabField(ctx, rng, SUN.x - SUN.r, SUN.y - SUN.r, SUN.r * 2, SUN.r * 2, { n: 40, r: [4, 10], colours: [P.marigold, P.limewhite, P.haldi], alpha: [0.08, 0.2] });
    ctx.strokeStyle = withAlpha(P.marigold, 0.45);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(SUN.x + 3, SUN.y + 4, SUN.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  return c;
}

function paintClouds(rng: Rng): HTMLCanvasElement {
  const H = 250;
  const [c, ctx] = makeCanvas(TW, H);
  let x = 120;
  while (x < TW - 60) {
    const w = rng.range(200, 430);
    const h = rng.range(55, 105);
    const y = rng.range(150, 225);
    wrapped(TW, x, w / 2 + h, (xx) => cloud(ctx, rng.fork(x), xx, y, w, h));
    x += w * rng.range(0.9, 1.5);
  }
  // A few thin streaks.
  for (let i = 0; i < 9; i++) {
    const sx = rng.range(0, TW), sy = rng.range(20, 90);
    wrapped(TW, sx, 160, (xx) => taperStroke(ctx, curvePts(xx - 150, sy, xx, sy - 6, xx + 150, sy + 2, 10), rng.range(5, 10), P.limewhite, 0.35, [0.05, 0.05]));
  }
  return c;
}

function paintFar(rng: Rng): HTMLCanvasElement {
  const H = 170;
  const base = 152;
  const [c, ctx] = makeCanvas(TW, H);
  const fA = periodicFbm(rng, TW, 560, 4);
  const fB = periodicFbm(rng, TW, 300, 4);
  const colA = mix(mix(P.peacock, P.seafoam, 0.5), P.skyCream, 0.5);
  const colB = mix(mix(P.tota, P.peacock, 0.5), P.skyCream, 0.32);
  const topA = (x: number) => base - (46 + 64 * (fA(x) * 0.5 + 0.5));
  const topB = (x: number) => base - (12 + 40 * (fB(x) * 0.5 + 0.5)) - Math.abs(Math.sin(x * 0.11)) * 3;
  const fillRange = (top: (x: number) => number, col: string) => {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= TW; x += 4) ctx.lineTo(x, top(x));
    ctx.lineTo(TW, H);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  };
  // Range A (distant blue-green hills).
  fillRange(topA, colA);
  clipTo(ctx, () => { ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= TW; x += 4) ctx.lineTo(x, topA(x)); ctx.lineTo(TW, H); ctx.closePath(); }, () => {
    for (let x = 0; x < TW; x += 3) {
      // sunlit right-facing slopes catch a haldi rim
      const slope = topA(x + 6) - topA(x);
      if (slope > 0.4) dab(ctx, x, topA(x) + 5, 3, 7, 0, mix(P.haldi, P.skyCream, 0.4), 0.18);
    }
    dabField(ctx, rng, 0, 30, TW, H - 30, { n: 900, r: [3, 9], colours: [mix(colA, P.limewhite, 0.2), mix(colA, P.peacock, 0.2)], alpha: [0.08, 0.2], aspect: [0.5, 1.2], rot: Math.PI / 2, rotJitter: 0.2 });
  });
  // Range B (nearer, forested).
  fillRange(topB, colB);
  clipTo(ctx, () => { ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= TW; x += 4) ctx.lineTo(x, topB(x)); ctx.lineTo(TW, H); ctx.closePath(); }, () => {
    for (let i = 0; i < 1600; i++) {
      const x = rng.next() * TW;
      const y = topB(x) + rng.range(-2, 40);
      const lit = rng.chance(0.35);
      dab(ctx, x, y, rng.range(2, 5), rng.range(1.6, 3.6), rng.next(), lit ? mix(colB, P.haldi, 0.3) : mix(colB, P.neel, 0.18), rng.range(0.25, 0.5));
    }
  });
  // Tree bumps along the ridge.
  for (let x = 0; x < TW; x += rng.range(5, 11)) {
    const r = rng.range(3, 6);
    dab(ctx, x, topB(x) + r * 0.4, r, r * 0.8, 0, colB, 1);
  }
  // Haze at the foot of the hills.
  vGradient(ctx, 0, base - 40, TW, 58, [[0, P.skyCream, 0], [1, P.skyCream, 0.55]]);
  return c;
}

function paintWaterBase(rng: Rng): HTMLCanvasElement {
  const W = GAME_W, H = 720 - WATER_TOP;
  const [c, ctx] = makeCanvas(W, H);
  vGradient(ctx, 0, 0, W, H, [
    [0, WATER.sky, 1],
    [0.1, WATER.light, 1],
    [0.42, WATER.mid, 1],
    [0.75, WATER.deep, 1],
    [1, WATER.dark, 1],
  ]);
  // Broad painted swells.
  dabField(ctx, rng, -40, 0, W + 80, H, { n: 320, r: [20, 90], colours: [WATER.light, WATER.mid, WATER.deep], alpha: [0.05, 0.12], aspect: [0.06, 0.16], rot: 0, rotJitter: 0.03 });
  // Sky reflected near the horizon.
  vGradient(ctx, 0, 0, W, 30, [[0, P.skyCream, 0.5], [1, P.skyCream, 0]]);
  return c;
}

function paintGlitter(rng: Rng): HTMLCanvasElement {
  const W = GAME_W, H = 720 - WATER_TOP;
  const [c, ctx] = makeCanvas(W, H);
  glow(ctx, SUN.x, 0, 260, P.haldi, 0.18);
  for (let i = 0; i < 230; i++) {
    const t = Math.pow(rng.next(), 1.3);
    const y = 4 + t * (H - 8);
    const spread = 30 + t * 230;
    const x = SUN.x + rng.gauss() * spread * 0.45;
    const len = 6 + t * 40 * rng.range(0.5, 1.2);
    const a = (1 - t) * 0.75 + 0.15;
    taperStroke(ctx, [{ x: x - len / 2, y }, { x: x + len / 2, y: y + rng.range(-0.5, 0.5) }], 1.4 + t * 2.4, rng.chance(0.55) ? P.haldi : P.limewhite, a, [0.1, 0.1]);
  }
  return c;
}

function paintRipples(rng: Rng, H: number, n: number, len: [number, number], width: [number, number], contrast: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(TW, H);
  const light = [P.limewhite, P.seafoam, mix(P.seafoam, P.limewhite, 0.5)];
  const dark = [mix(P.peacock, P.neel, 0.35), mix(P.peacock, P.neel, 0.15)];
  for (let i = 0; i < n; i++) {
    const t = rng.next();
    const y = 3 + t * (H - 6);
    const k = 0.55 + t * 0.45; // perspective: longer lower down
    const l = rng.range(len[0], len[1]) * k;
    const x = rng.next() * TW;
    const isLight = rng.chance(0.58);
    const col = isLight ? rng.pick(light) : rng.pick(dark);
    const a = (isLight ? rng.range(0.25, 0.6) : rng.range(0.18, 0.4)) * contrast;
    const w = rng.range(width[0], width[1]) * k;
    wrapped(TW, x, l, (xx) => taperStroke(ctx, curvePts(xx - l / 2, y, xx, y - w * 0.6, xx + l / 2, y, 6), w, col, a, [0.08, 0.08]));
  }
  return c;
}

function paintLip(rng: Rng): HTMLCanvasElement {
  const H = 40;
  const [c, ctx] = makeCanvas(TW, H);
  const surf = 12;
  // Water in front of the ride line hides the lower hull (sits *in* the lagoon).
  const g = ctx.createLinearGradient(0, surf, 0, H);
  g.addColorStop(0, withAlpha(WATER.mid, 0.88));
  g.addColorStop(0.5, withAlpha(WATER.deep, 0.55));
  g.addColorStop(1, withAlpha(WATER.deep, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= TW; x += 8) ctx.lineTo(x, surf + Math.sin((x / TW) * Math.PI * 2 * 24) * 1.6);
  ctx.lineTo(TW, H);
  ctx.closePath();
  ctx.fill();
  // Sparkling surface line.
  for (let i = 0; i < 160; i++) {
    const x = rng.next() * TW;
    const l = rng.range(12, 46);
    wrapped(TW, x, l, (xx) => taperStroke(ctx, [{ x: xx - l / 2, y: surf + Math.sin((xx / TW) * Math.PI * 2 * 24) * 1.6 }, { x: xx + l / 2, y: surf + 0.5 }], rng.range(1.4, 2.6), rng.pick([P.limewhite, P.seafoam]), rng.range(0.45, 0.85), [0.1, 0.1]));
  }
  return c;
}

function paintReflection(mid: HTMLCanvasElement, waterline: number, rng: Rng): HTMLCanvasElement {
  const H = 84;
  const [flip, f] = makeCanvas(TW, H);
  f.save();
  f.scale(1, -0.42);
  f.drawImage(mid, 0, -waterline);
  f.restore();
  const [c, ctx] = makeCanvas(TW, H);
  // Ripple the reflection row by row.
  for (let y = 0; y < H; y += 2) {
    const off = Math.sin(y * 0.55 + rng.next() * 0.6) * (1 + y * 0.06);
    ctx.drawImage(flip, 0, y, TW, 2, off, y, TW, 2);
    ctx.drawImage(flip, 0, y, TW, 2, off - TW, y, TW, 2);
    ctx.drawImage(flip, 0, y, TW, 2, off + TW, y, TW, 2);
  }
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = withAlpha(mix(P.peacock, P.seafoam, 0.35), 0.5);
  ctx.fillRect(0, 0, TW, H);
  ctx.globalCompositeOperation = 'destination-out';
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, withAlpha(P.ink, 0));
  g.addColorStop(1, withAlpha(P.ink, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TW, H);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

interface MidOut { canvas: HTMLCanvasElement; workers: { x: number; y: number }[]; fires: { x: number; y: number }[] }

function paintMid(rng: Rng): MidOut {
  const H = 252;
  const water = 246;
  const [c, ctx] = makeCanvas(TW, H);
  const fBank = periodicFbm(rng, TW, 180, 3);
  const bankTop = (x: number) => 226 + fBank(x) * 4;

  // Back tree line (hazed for depth).
  for (let x = 20; x < TW; x += rng.range(48, 90)) {
    const w = rng.range(70, 120), h = rng.range(70, 104);
    wrapped(TW, x, w, (xx) => broadTree(ctx, rng.fork(x), xx, 232, w, h, 0.32));
  }
  // Palms behind the huts.
  const palms = [70, 300, 470, 760, 980, 1180, 1330, 1560, 1760, 1930];
  for (const px of palms) {
    const h = rng.range(118, 172);
    if (rng.chance(0.3)) wrapped(TW, px, h * 0.3, (xx) => palmyraPalm(ctx, rng.fork(px), xx, bankTop(px) + 4, h * 1.05, 0.08));
    else wrapped(TW, px, h * 0.5, (xx) => coconutPalm(ctx, rng.fork(px), xx, bankTop(px) + 4, h, rng.range(-0.14, 0.14), 0.06));
  }

  // The bank: grass on top, laterite earth face, darker wet edge.
  const bankPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= TW; x += 6) ctx.lineTo(x, bankTop(x));
    ctx.lineTo(TW, H);
    ctx.closePath();
  };
  bankPath();
  ctx.fillStyle = mix(P.laterite, P.chandan, 0.25);
  ctx.fill();
  clipTo(ctx, bankPath, () => {
    vGradient(ctx, 0, 222, TW, 30, [[0, P.tota, 0.95], [0.18, mix(P.tota, P.haldi, 0.3), 0.6], [0.32, P.laterite, 0], [0.75, mix(P.laterite, P.ink, 0.3), 0.4], [1, mix(P.peacock, P.ink, 0.4), 0.7]]);
    dabField(ctx, rng, 0, 220, TW, 32, { n: 1300, r: [1.5, 4], colours: [P.laterite, mix(P.laterite, P.haldi, 0.3), mix(P.tota, P.haldi, 0.3), mix(P.laterite, P.ink, 0.3)], alpha: [0.25, 0.55], aspect: [0.4, 0.8], rot: 0, rotJitter: 0.4 });
  });

  // Round wooden huts with rammed-earth floors (§3 Record 01).
  const huts = [
    { x: 175, s: 1.0 }, { x: 255, s: 1.15 }, { x: 345, s: 0.95 },
    { x: 1090, s: 1.1 }, { x: 1178, s: 0.95 }, { x: 1640, s: 1.05 }, { x: 1715, s: 0.9 },
  ];
  for (const h of huts) wrapped(TW, h.x, 50, (xx) => roundHut(ctx, rng.fork(h.x), xx, bankTop(h.x) + 7, h.s));

  // Boat-building yard: a dugout on trestles, wood chips; workers are animated decor.
  const yardX = 625;
  dugoutOnTrestles(ctx, rng.fork('yard'), yardX, bankTop(yardX) + 6);
  const workers = [{ x: yardX - 46, y: bankTop(yardX - 46) + 9 }, { x: yardX + 50, y: bankTop(yardX + 50) + 9 }];
  // A second, finished-looking log being shaped further along.
  dugoutOnTrestles(ctx, rng.fork('yard2'), 1440, bankTop(1440) + 6, 0.85);
  workers.push({ x: 1440 + 44, y: bankTop(1440 + 44) + 9 });

  // Villagers going about the day.
  villager(ctx, 205, bankTop(205) + 9, 1.05, P.haldi, 'carry');
  villager(ctx, 430, bankTop(430) + 9, 1, P.sindoor, 'stand');
  villager(ctx, 1125, bankTop(1125) + 9, 1.05, P.limewhite, 'bend');
  villager(ctx, 1238, bankTop(1238) + 9, 1, P.marigold, 'carry');
  villager(ctx, 1680, bankTop(1680) + 9, 0.95, P.sindoor, 'stand');

  // Hearths (smoke is animated decor).
  const fires = [{ x: 395, y: bankTop(395) + 6 }, { x: 1600, y: bankTop(1600) + 6 }];
  for (const f of fires) {
    softShadow(ctx, f.x, f.y, 12, 3, P.ink, 0.35);
    for (let i = 0; i < 5; i++) taperStroke(ctx, [{ x: f.x - 6 + i * 3, y: f.y }, { x: f.x - 2 + i, y: f.y - 5 }], 2, mix(P.laterite, P.ink, 0.4), 1);
    glow(ctx, f.x, f.y - 4, 12, P.marigold, 0.6);
    dab(ctx, f.x, f.y - 4, 2.6, 4, 0, P.haldi, 1);
  }

  // Nets drying on a frame.
  netFrame(ctx, rng.fork('net'), 870, bankTop(870) + 6);
  netFrame(ctx, rng.fork('net2'), 1880, bankTop(1880) + 6);

  // Beached dugouts at the water's edge.
  for (const bx of [760, 1000, 1500, 1990]) wrapped(TW, bx, 50, (xx) => beachedCanoe(ctx, xx, water - 6, rng.range(0.85, 1.05)));

  // Grass and reed tufts at the front edge of the bank.
  for (let x = 0; x < TW; x += rng.range(14, 40)) {
    const g = { dark: mix(P.tota, P.peacock, 0.4), mid: P.tota, tip: mix(P.haldi, P.tota, 0.35) };
    wrapped(TW, x, 14, (xx) => reedTuft(ctx, rng.fork(x), xx, water - 3, rng.range(10, 18), rng.range(10, 24), g, 7));
  }
  // Wet edge sheen.
  for (let i = 0; i < 140; i++) {
    const x = rng.next() * TW;
    wrapped(TW, x, 20, (xx) => taperStroke(ctx, [{ x: xx - 10, y: water - 1 }, { x: xx + 10, y: water - 1 }], 1.6, P.seafoam, 0.5));
  }
  return { canvas: c, workers, fires };
}

function roundHut(ctx: Ctx, rng: Rng, x: number, y: number, s: number): void {
  const wallW = 50 * s, wallH = 28 * s, roofH = 36 * s;
  const wall = mix(P.laterite, P.chandan, 0.35);
  const wallDark = mix(P.laterite, P.ink, 0.35);
  const thatch = mix(P.haldi, P.laterite, 0.38);
  const thatchLight = mix(P.haldi, P.limewhite, 0.25);
  const thatchDark = mix(P.laterite, P.ink, 0.25);
  // Rammed-earth floor platform.
  softShadow(ctx, x + 6 * s, y + 2 * s, wallW * 0.9, 6 * s, P.ink, 0.35);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.ellipse(x, y, wallW * 0.66, 5.5 * s, 0, 0, Math.PI * 2); }, { x: x - wallW * 0.7, y: y - 6 * s, w: wallW * 1.4, h: 12 * s }, { base: mix(P.laterite, P.chandan, 0.15), light: mix(P.chandan, P.limewhite, 0.3), shade: mix(P.laterite, P.ink, 0.3) });
  // Cylindrical wall of upright wooden posts.
  const wx = x - wallW / 2, wy = y - wallH;
  const wallPath = () => { ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + wallW, wy); ctx.lineTo(wx + wallW, y - 2 * s); ctx.ellipse(x, y - 2 * s, wallW / 2, 4 * s, 0, 0, Math.PI); ctx.closePath(); };
  wallPath();
  ctx.fillStyle = wall;
  ctx.fill();
  clipTo(ctx, wallPath, () => {
    for (let px = wx; px < wx + wallW; px += 3.2 * s) {
      const t = (px - wx) / wallW;
      const shade = t < 0.35 ? 0.5 - t : 0; // left side in shade
      ctx.fillStyle = withAlpha(rng.chance(0.5) ? wallDark : mix(P.chandan, P.limewhite, 0.2), 0.25 + shade * 0.6);
      ctx.fillRect(px, wy, 1.2 * s, wallH);
    }
    const g = ctx.createLinearGradient(wx, 0, wx + wallW, 0);
    g.addColorStop(0, withAlpha(wallDark, 0.55));
    g.addColorStop(0.45, withAlpha(wallDark, 0));
    g.addColorStop(0.85, withAlpha(P.haldi, 0.18));
    g.addColorStop(1, withAlpha(wallDark, 0.2));
    ctx.fillStyle = g;
    ctx.fillRect(wx, wy, wallW, wallH);
  });
  // Doorway.
  ctx.fillStyle = withAlpha(mix(P.ink, P.laterite, 0.2), 0.95);
  ctx.beginPath();
  const dx = x + wallW * 0.12;
  ctx.moveTo(dx - 6 * s, y - 2 * s);
  ctx.lineTo(dx - 6 * s, y - wallH * 0.62);
  ctx.quadraticCurveTo(dx, y - wallH * 0.82, dx + 6 * s, y - wallH * 0.62);
  ctx.lineTo(dx + 6 * s, y - 1 * s);
  ctx.closePath();
  ctx.fill();
  // Conical thatch roof with an overhang.
  const roofPath = () => {
    ctx.beginPath();
    ctx.moveTo(x - wallW * 0.68, wy + 5 * s);
    ctx.quadraticCurveTo(x - wallW * 0.25, wy - roofH * 0.45, x + 1 * s, wy - roofH);
    ctx.quadraticCurveTo(x + wallW * 0.25, wy - roofH * 0.45, x + wallW * 0.68, wy + 5 * s);
    ctx.quadraticCurveTo(x, wy + 9 * s, x - wallW * 0.68, wy + 5 * s);
    ctx.closePath();
  };
  roofPath();
  ctx.fillStyle = thatch;
  ctx.fill();
  clipTo(ctx, roofPath, () => {
    for (let i = 0; i < 70 * s; i++) {
      const t = rng.next();
      const bx = x - wallW * 0.68 + t * wallW * 1.36;
      const top = { x: x + (bx - x) * 0.15, y: wy - roofH * rng.range(0.55, 1) };
      const lit = bx > x;
      taperStroke(ctx, [top, { x: bx, y: wy + 7 * s }], rng.range(1, 2.2) * s, lit ? rng.pick([thatchLight, thatch]) : rng.pick([thatchDark, thatch]), rng.range(0.35, 0.75), [0.4, 0.2]);
    }
    const g = ctx.createLinearGradient(x - wallW * 0.7, 0, x + wallW * 0.7, 0);
    g.addColorStop(0, withAlpha(thatchDark, 0.45));
    g.addColorStop(0.5, withAlpha(thatchDark, 0));
    g.addColorStop(0.8, withAlpha(P.haldi, 0.25));
    ctx.fillStyle = g;
    ctx.fillRect(x - wallW, wy - roofH, wallW * 2, roofH + 10 * s);
  });
  // Ragged eave.
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const ex = x - wallW * 0.66 + t * wallW * 1.32;
    taperStroke(ctx, [{ x: ex, y: wy + 4 * s + Math.sin(t * Math.PI) * 3 * s }, { x: ex + rng.range(-1, 1), y: wy + 8 * s + Math.sin(t * Math.PI) * 3 * s }], 1.6 * s, thatchDark, 0.6);
  }
  // Finial knot.
  dab(ctx, x + 1 * s, wy - roofH + 1 * s, 2.4 * s, 3.2 * s, 0, thatchDark, 1);
}

function dugoutOnTrestles(ctx: Ctx, rng: Rng, x: number, y: number, s = 1): void {
  const wood = mix(P.laterite, P.chandan, 0.3);
  const woodDark = mix(P.laterite, P.ink, 0.4);
  // trestles
  for (const tx of [x - 34 * s, x + 30 * s]) {
    taperStroke(ctx, [{ x: tx - 6 * s, y }, { x: tx, y: y - 12 * s }], 2.2 * s, woodDark, 1, [1, 1]);
    taperStroke(ctx, [{ x: tx + 6 * s, y }, { x: tx, y: y - 12 * s }], 2.2 * s, woodDark, 1, [1, 1]);
  }
  softShadow(ctx, x, y, 52 * s, 4 * s, P.ink, 0.3);
  // log
  const logPath = () => {
    ctx.beginPath();
    ctx.moveTo(x - 50 * s, y - 14 * s);
    ctx.quadraticCurveTo(x, y - 20 * s, x + 52 * s, y - 15 * s);
    ctx.quadraticCurveTo(x + 56 * s, y - 9 * s, x + 46 * s, y - 6 * s);
    ctx.quadraticCurveTo(x, y - 3 * s, x - 46 * s, y - 6 * s);
    ctx.quadraticCurveTo(x - 55 * s, y - 9 * s, x - 50 * s, y - 14 * s);
    ctx.closePath();
  };
  paintedShape(ctx, rng, logPath, { x: x - 56 * s, y: y - 22 * s, w: 112 * s, h: 18 * s }, { base: wood, light: mix(P.chandan, P.haldi, 0.3), shade: woodDark, rim: mix(P.laterite, P.ink, 0.55), rimW: 1.2 });
  // hollow being carved
  ctx.fillStyle = withAlpha(woodDark, 0.85);
  ctx.beginPath();
  ctx.ellipse(x - 2 * s, y - 16 * s, 34 * s, 2.6 * s, -0.02, 0, Math.PI * 2);
  ctx.fill();
  // chips
  dabField(ctx, rng, x - 60 * s, y - 3 * s, 120 * s, 5 * s, { n: 40, r: [0.8, 2], colours: [mix(P.chandan, P.limewhite, 0.3), P.chandan], alpha: [0.7, 1] });
}

function netFrame(ctx: Ctx, rng: Rng, x: number, y: number): void {
  const pole = mix(P.laterite, P.ink, 0.3);
  const net = mix(P.limewhite, P.skyCream, 0.3);
  taperStroke(ctx, [{ x: x - 22, y }, { x: x - 20, y: y - 34 }], 2, pole, 1, [1, 1]);
  taperStroke(ctx, [{ x: x + 22, y }, { x: x + 20, y: y - 32 }], 2, pole, 1, [1, 1]);
  taperStroke(ctx, [{ x: x - 24, y: y - 32 }, { x: x + 24, y: y - 30 }], 1.6, pole, 1, [1, 1]);
  ctx.strokeStyle = withAlpha(net, 0.55);
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    ctx.beginPath();
    ctx.moveTo(x - 20 + t * 40, y - 31);
    ctx.quadraticCurveTo(x - 20 + t * 40 + rng.range(-3, 3), y - 18, x - 18 + t * 36, y - 8 - Math.sin(t * Math.PI) * 4);
    ctx.stroke();
  }
  for (let j = 0; j < 4; j++) {
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 26 + j * 5);
    ctx.quadraticCurveTo(x, y - 20 + j * 6, x + 20, y - 26 + j * 5);
    ctx.stroke();
  }
}

function beachedCanoe(ctx: Ctx, x: number, y: number, s: number): void {
  const wood = mix(P.laterite, P.ink, 0.2);
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(x - 30 * s, y - 5 * s);
  ctx.quadraticCurveTo(x, y - 8 * s, x + 32 * s, y - 6 * s);
  ctx.quadraticCurveTo(x + 26 * s, y + 1 * s, x, y + 1.5 * s);
  ctx.quadraticCurveTo(x - 24 * s, y + 1 * s, x - 30 * s, y - 5 * s);
  ctx.fill();
  taperStroke(ctx, [{ x: x - 26 * s, y: y - 5.5 * s }, { x: x + 28 * s, y: y - 6.5 * s }], 1.6 * s, mix(P.chandan, P.haldi, 0.25), 0.8);
}

function paintNear(rng: Rng): HTMLCanvasElement {
  const H = 112;
  const [c, ctx] = makeCanvas(TW, H);
  const sand = mix(P.skyCream, P.chandan, 0.32);
  const sandWet = mix(sand, P.peacock, 0.3);
  const islands = [
    { x: 150, w: 270 }, { x: 640, w: 190 }, { x: 1010, w: 330 }, { x: 1500, w: 230 }, { x: 1850, w: 210 },
  ];
  const base = 80;
  for (const isl of islands) {
    wrapped(TW, isl.x, isl.w, (xx) => {
      const r2 = rng.fork(isl.x);
      // reflection-ish wet halo
      ctx.fillStyle = withAlpha(P.seafoam, 0.45);
      ctx.beginPath();
      ctx.ellipse(xx, base + 3, isl.w * 0.56, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // sandbar
      const top = (t: number) => base - 9 - Math.sin(t * Math.PI) * 6 - Math.sin(t * 9 + isl.x) * 1.4;
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(xx - isl.w / 2, base + 1);
        for (let i = 0; i <= 24; i++) {
          const t = i / 24;
          ctx.lineTo(xx - isl.w / 2 + t * isl.w, top(t) + (t < 0.08 || t > 0.92 ? 8 : 0));
        }
        ctx.lineTo(xx + isl.w / 2, base + 1);
        ctx.closePath();
      };
      path();
      ctx.fillStyle = sand;
      ctx.fill();
      clipTo(ctx, path, () => {
        vGradient(ctx, xx - isl.w / 2, base - 18, isl.w, 20, [[0, P.limewhite, 0.35], [0.5, sand, 0], [1, sandWet, 0.85]]);
        dabField(ctx, r2, xx - isl.w / 2, base - 18, isl.w, 20, { n: Math.round(isl.w / 2), r: [1, 3], colours: [P.chandan, P.limewhite, sandWet], alpha: [0.2, 0.45] });
      });
      // hazy reeds on the bar
      const reedCols = { dark: mix(mix(P.tota, P.peacock, 0.4), P.seafoam, 0.3), mid: mix(P.tota, P.seafoam, 0.22), tip: mix(P.haldi, P.tota, 0.35) };
      const nTufts = Math.round(isl.w / 50);
      for (let i = 0; i < nTufts; i++) {
        const tx = xx - isl.w * 0.4 + r2.next() * isl.w * 0.8;
        reedTuft(ctx, r2, tx, base - 8, r2.range(16, 30), r2.range(22, 44), reedCols, 12, r2.chance(0.5) ? 2 : 0);
      }
      // birds: flamingos (pink) and egrets
      const nBirds = Math.round(isl.w / 55);
      for (let i = 0; i < nBirds; i++) {
        const bx = xx - isl.w * 0.45 + r2.next() * isl.w * 0.9;
        if (r2.chance(0.72)) flamingo(ctx, r2, bx, base + r2.range(-2, 5), r2.range(0.95, 1.2), r2.chance(0.4), 0.1);
        else egret(ctx, bx, base + r2.range(-3, 3), r2.range(0.85, 1), 0.1);
      }
    });
  }
  // lotus pads between the bars
  for (let i = 0; i < 26; i++) {
    const x = rng.next() * TW;
    const y = rng.range(88, 106);
    wrapped(TW, x, 20, (xx) => {
      lotusPad(ctx, rng.fork(i), xx, y, rng.range(7, 13));
      if (rng.chance(0.25)) lotusFlower(ctx, xx + 3, y - 2, rng.range(5, 7));
    });
  }
  return c;
}

function paintFore(rng: Rng): HTMLCanvasElement {
  const H = 120;
  const [c, ctx] = makeCanvas(TW, H);
  const groups = 7;
  for (let g = 0; g < groups; g++) {
    const gx = (g + rng.range(0.1, 0.9)) * (TW / groups);
    wrapped(TW, gx, 140, (xx) => {
      const r2 = rng.fork(g);
      const n = r2.int(2, 4);
      for (let i = 0; i < n; i++) {
        lotusPad(ctx, r2, xx + r2.range(-80, 80), r2.range(84, 112), r2.range(30, 52), 0.22);
      }
      if (r2.chance(0.6)) lotusFlower(ctx, xx + r2.range(-40, 40), r2.range(80, 96), r2.range(13, 18));
      if (r2.chance(0.5)) {
        reedTuft(ctx, r2, xx + r2.range(-110, 110), H + 4, 30, r2.range(40, 64), { dark: mix(P.tota, P.neel, 0.45), mid: mix(P.tota, P.peacock, 0.3), tip: mix(P.tota, P.haldi, 0.35) }, 10);
      }
    });
  }
  return c;
}

