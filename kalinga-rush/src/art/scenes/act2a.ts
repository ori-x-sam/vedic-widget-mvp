// Act II · The Temple Coast, first half (records 06–10). Lead: laterite;
// supports marigold, khondalite, tota. Temples are always background (§7).
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { periodicFbm, type Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, dabField, paintedShape, polyPath, softShadow, taperStroke, wrapped, type Ctx } from '../brush';
import { bank, scatter, treeRow, type SceneDef } from '../engine';
import { buddhaHead, house, khakhara, mukteswara, pidhaHall, rekhaDeula, votiveStupa } from '../kit/buildings';
import { boitaShip, bullockCartBg } from '../kit/craft';
import { crowd, person, type PersonOpts } from '../kit/people';
import { cow, crow, goat, monkey } from '../kit/animals';
import { broadTree, coconutPalm, egret, lotusFlower, lotusPad, palmyraPalm, reedTuft } from '../shared/nature';

type Paint = (ctx: Ctx, rng: Rng, w: number, h: number) => void;

const ACT2_SKY: [number, string][] = [[0, mix(P.seafoam, P.skyCream, 0.45)], [0.55, P.skyCream], [1, mix(P.skyCream, P.marigold, 0.24)]];
const hz = (c: string, h = 0) => (h ? mix(c, P.skyCream, h) : c);
const SANDSTONE = mix(P.laterite, P.chandan, 0.42);
const GRASS = { dark: mix(P.tota, P.neel, 0.4), mid: mix(P.tota, P.peacock, 0.25), tip: mix(P.tota, P.haldi, 0.4) };

// ---- local helpers ---------------------------------------------------------------------

/** Paint a landmark `k` times larger about its base centre (the painter works in a w/k × h/k box). */
function scaled(k: number, paint: Paint): Paint {
  return (ctx, rng, w, h) => {
    ctx.save();
    ctx.translate(w / 2 - (w / k / 2) * k, h - (h / k) * k);
    ctx.scale(k, k);
    paint(ctx, rng, w / k, h / k);
    ctx.restore();
  };
}

/** A person lying on their back, head to the left. (x, y) = feet on the surface. */
function lying(ctx: Ctx, x: number, y: number, s: number, o: PersonOpts): void {
  ctx.save();
  ctx.translate(x, y - 4 * s);
  ctx.rotate(-Math.PI / 2);
  person(ctx, 0, 0, s, { ...o, pose: 'stand', facing: 1 });
  ctx.restore();
}

/** Little curls rising from a sleeper (no letters). */
function snore(ctx: Ctx, x: number, y: number, s: number): void {
  for (let i = 0; i < 3; i++) {
    const r = (2 + i * 1.2) * s;
    const cx = x + i * 5 * s, cy = y - i * 7 * s;
    taperStroke(ctx, curvePts(cx - r, cy, cx, cy - r * 1.4, cx + r, cy, 6), 1.1 * s, P.limewhite, 0.8, [0.3, 0.3]);
  }
}

/** A palm-leaf book held up (overlaid on a 'read' pose). */
function palmLeaf(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.fillStyle = P.haldi;
  ctx.fillRect(x - 6 * s, y - 1.6 * s, 12 * s, 3.2 * s);
  ctx.fillStyle = withAlpha(mix(P.laterite, P.ink, 0.3), 0.7);
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 5 * s, y - 1 * s + i * 0.9 * s, 10 * s, 0.35 * s);
  dab(ctx, x, y, 0.7 * s, 0.7 * s, 0, P.sindoor, 1);
}

function gull(ctx: Ctx, x: number, y: number, s: number, colour: string): void {
  taperStroke(ctx, curvePts(x - 6 * s, y - 1 * s, x - 3 * s, y - 4 * s, x, y, 5), 1.4 * s, colour, 0.9, [0.2, 0.6]);
  taperStroke(ctx, curvePts(x, y, x + 3 * s, y - 4 * s, x + 6 * s, y - 1 * s, 5), 1.4 * s, colour, 0.9, [0.6, 0.2]);
}

/** Tamarind: dark, feathery, wide crown with brown pods. (x, y) = foot. */
function tamarindTree(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze = 0): void {
  const trunk = hz(mix(P.khondalite, P.ink, 0.35), haze);
  taperStroke(ctx, curvePts(x, y, x - w * 0.05, y - h * 0.3, x + w * 0.03, y - h * 0.5, 8), w * 0.1, trunk, 1, [1, 0.6]);
  for (const k of [-1, 1]) taperStroke(ctx, curvePts(x, y - h * 0.45, x + k * w * 0.15, y - h * 0.55, x + k * w * 0.32, y - h * 0.62, 6), w * 0.04, trunk, 1, [1, 0.3]);
  const dark = hz(mix(P.tota, P.neel, 0.45), haze), mid = hz(mix(P.tota, P.peacock, 0.3), haze), light = hz(mix(P.tota, P.haldi, 0.35), haze);
  const n = Math.round(w * 2.4);
  for (let i = 0; i < n; i++) {
    const a = rng.next() * Math.PI * 2, rr = Math.sqrt(rng.next());
    const px = x + Math.cos(a) * rr * w * 0.5, py = y - h * 0.68 + Math.sin(a) * rr * h * 0.3;
    const lit = px > x && py < y - h * 0.68;
    dab(ctx, px, py, rng.range(2.5, 5) * (w / 140 + 0.4), rng.range(1.2, 2.4) * (w / 140 + 0.4), rng.next() * 3, i < n * 0.45 ? dark : lit ? light : mid, rng.range(0.5, 0.9));
  }
  for (let i = 0; i < Math.round(w * 0.12); i++) {
    const px = x + rng.range(-0.4, 0.4) * w, py = y - h * 0.5 + rng.range(-0.06, 0.08) * h;
    taperStroke(ctx, curvePts(px, py, px + 2, py + 4, px + 1, py + 8, 4), 1.6 * (w / 140 + 0.4), hz(mix(P.laterite, P.chandan, 0.35), haze), 1, [0.6, 0.6]);
  }
}

/** Mango tree heavy with fruit. (x, y) = foot. */
function mangoTree(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze = 0, fruit = 1): void {
  broadTree(ctx, rng, x, y, w, h, haze);
  const n = Math.round(w * 0.22 * fruit);
  for (let i = 0; i < n; i++) {
    const px = x + rng.range(-0.42, 0.42) * w, py = y - h * rng.range(0.42, 0.85);
    const ripe = rng.chance(0.55);
    const s = Math.max(1.4, w / 60);
    taperStroke(ctx, [{ x: px, y: py - s * 1.6 }, { x: px, y: py - s * 0.6 }], 0.5 * s, hz(mix(P.tota, P.ink, 0.3), haze), 1, [1, 1]);
    dab(ctx, px, py, s * 0.9, s * 1.25, 0.2, hz(ripe ? mix(P.haldi, P.marigold, 0.4) : mix(P.tota, P.haldi, 0.45), haze), 1);
    dab(ctx, px + s * 0.3, py - s * 0.4, s * 0.3, s * 0.45, 0.2, hz(P.limewhite, haze), 0.4);
  }
}

/** A rose-ringed parrot. (x, y) = feet on a perch. */
function parrot(ctx: Ctx, x: number, y: number, s: number, f: 1 | -1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f * s, s);
  const g = P.tota, gd = mix(P.tota, P.peacock, 0.4);
  taperStroke(ctx, curvePts(-3, -5, -10, 2, -16, 10, 6), 2.4, gd, 1, [1, 0.1]);
  dab(ctx, 0, -7, 4.2, 6, -0.4, g, 1);
  dab(ctx, -1.5, -6, 2.4, 4.4, -0.4, gd, 0.8);
  dab(ctx, 2.6, -13, 3.2, 3, 0, mix(P.tota, P.haldi, 0.25), 1);
  taperStroke(ctx, curvePts(0.4, -11.2, 3, -10, 5.2, -11.5, 5), 0.9, P.rani, 1, [0.6, 0.6]);
  dab(ctx, 5.6, -13, 1.8, 1.6, 0.3, P.sindoor, 1);
  dab(ctx, 3.4, -14, 0.6, 0.6, 0, P.ink, 1);
  ctx.restore();
}

/** A peacock with its train spread. (x, y) = feet. */
function peacockBird(ctx: Ctx, x: number, y: number, s: number, f: 1 | -1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f * s, s);
  for (let i = 0; i < 26; i++) {
    const a = Math.PI + 0.25 + (i / 25) * (Math.PI - 0.5);
    const r = 30 + (i % 2) * 3;
    const ex = -4 + Math.cos(a) * r, ey = -14 + Math.sin(a) * r;
    taperStroke(ctx, [{ x: -4, y: -14 }, { x: ex, y: ey }], 3.6, mix(P.tota, P.peacock, 0.4), 0.8, [0.2, 0.9]);
    dab(ctx, ex, ey, 2.6, 2.2, a, mix(P.haldi, P.tota, 0.4), 1);
    dab(ctx, ex, ey, 1.5, 1.3, a, P.peacock, 1);
    dab(ctx, ex, ey, 0.7, 0.6, a, P.neel, 1);
  }
  taperStroke(ctx, [{ x: -1, y: -2 }, { x: -2, y: 4 }], 1, P.khondalite, 1);
  taperStroke(ctx, [{ x: 2, y: -2 }, { x: 3, y: 4 }], 1, P.khondalite, 1);
  dab(ctx, 0, -8, 5, 6, 0, P.peacock, 1);
  taperStroke(ctx, curvePts(2, -12, 4, -18, 3, -24, 5), 3.4, mix(P.peacock, P.neel, 0.3), 1, [1, 0.8]);
  dab(ctx, 3.5, -25, 2.4, 2, 0, mix(P.peacock, P.neel, 0.3), 1);
  dab(ctx, 4.2, -25.4, 0.5, 0.5, 0, P.limewhite, 1);
  taperStroke(ctx, [{ x: 5.4, y: -25 }, { x: 7.4, y: -24.4 }], 1, P.khondalite, 1, [1, 0.2]);
  for (let i = -1; i <= 1; i++) taperStroke(ctx, [{ x: 3, y: -27 }, { x: 3 + i * 1.6, y: -31 }], 0.5, P.peacock, 1, [1, 1]);
  ctx.restore();
}

/** A bamboo scaffold grid over a rect. */
function scaffold(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, cols: number, rows: number, haze = 0): void {
  const bam = hz(mix(P.haldi, P.laterite, 0.4), haze);
  for (let i = 0; i <= cols; i++) taperStroke(ctx, [{ x: x0 + ((x1 - x0) * i) / cols, y: y1 }, { x: x0 + ((x1 - x0) * i) / cols + (i - cols / 2) * 1.5, y: y0 }], 2.2, bam, 1, [1, 1]);
  for (let j = 1; j <= rows; j++) taperStroke(ctx, [{ x: x0 - 4, y: y1 - ((y1 - y0) * j) / rows }, { x: x1 + 4, y: y1 - ((y1 - y0) * j) / rows }], 1.8, bam, 1, [1, 1]);
  ctx.strokeStyle = withAlpha(bam, 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y0); ctx.stroke();
}

/** A rough-cut khondalite block. (x, y) = bottom centre. */
function block(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, stone = P.khondalite): void {
  softShadow(ctx, x, y, w * 0.6, 3, P.ink, 0.3);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w / 2 + 2, y: y - h }, { x: x + w / 2 - 1, y: y - h + 1 }, { x: x + w / 2, y }]), { x: x - w / 2, y: y - h, w, h }, { base: stone, light: mix(stone, P.limewhite, 0.3), shade: mix(stone, P.ink, 0.35), lightFrom: 'right', rim: mix(stone, P.ink, 0.5), rimW: 1 });
}

/** A lotus tank band (for strips). */
function tank(ctx: Ctx, rng: Rng, W: number, y: number, hgt: number, step = [90, 200]): void {
  const water = mix(P.peacock, P.seafoam, 0.3);
  ctx.fillStyle = water;
  ctx.fillRect(0, y, W, hgt);
  for (let i = 0; i < W / 14; i++) {
    const x = rng.next() * W, l = rng.range(8, 26), yy = y + 2 + rng.next() * (hgt - 4);
    wrapped(W, x, l, (xx) => taperStroke(ctx, [{ x: xx - l / 2, y: yy }, { x: xx + l / 2, y: yy }], 1.1, P.limewhite, 0.4));
  }
  scatter(rng.fork('lotus'), W, [step[0], step[1]], (x) => wrapped(W, x, 12, (xx) => { lotusPad(ctx, rng.fork(x), xx, y + hgt * 0.6, 7, 0.1); if (rng.chance(0.4)) lotusFlower(ctx, xx + 5, y + hgt * 0.55, 4.5); }));
}

// ---- record 06 · Java ------------------------------------------------------------------

const JAVA_WATER = { sky: mix(P.skyCream, P.marigold, 0.15), light: mix(P.peacock, P.seafoam, 0.5), mid: mix(P.peacock, P.seafoam, 0.12), deep: mix(P.peacock, P.neel, 0.3) };

function paintVolcano(plume: boolean): Paint {
  return (ctx, rng, w, h) => {
    const rock = mix(mix(P.laterite, P.khondalite, 0.55), P.skyCream, 0.42);
    const cone = () => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.36, h - 40, w * 0.45, h - h * 0.86);
      ctx.lineTo(w * 0.55, h - h * 0.87);
      ctx.quadraticCurveTo(w * 0.64, h - 40, w, h);
      ctx.closePath();
    };
    paintedShape(ctx, rng, cone, { x: 0, y: h * 0.12, w, h: h * 0.88 }, { base: rock, light: mix(rock, P.marigold, 0.3), shade: mix(rock, P.neel, 0.25), lightFrom: 'right', dabs: 220 });
    clipTo(ctx, cone, () => {
      for (let i = 0; i < 16; i++) {
        const t = (i + 0.5) / 16;
        const tx = w * (0.45 + t * 0.1);
        const bx = w * (t * 1.0);
        taperStroke(ctx, curvePts(tx, h - h * 0.84, (tx + bx) / 2, h - h * 0.4, bx, h, 8), 2, t < 0.5 ? mix(rock, P.neel, 0.3) : mix(rock, P.limewhite, 0.25), 0.4, [0.1, 1]);
      }
      // green lower slopes
      vGradientLocal(ctx, 0, h * 0.55, w, h * 0.45, mix(mix(P.tota, P.peacock, 0.3), P.skyCream, 0.45));
    });
    if (plume) for (let i = 0; i < 26; i++) {
      const t = i / 25;
      dab(ctx, w * 0.5 + t * 90 + rng.range(-10, 10), h - h * 0.9 - t * 70, 10 + t * 26, 7 + t * 14, 0, mix(P.limewhite, P.skyCream, 0.4), 0.22 * (1 - t * 0.6));
    }
  };
}

function vGradientLocal(ctx: Ctx, x: number, y: number, w: number, h: number, col: string): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, withAlpha(col, 0));
  g.addColorStop(1, withAlpha(col, 0.85));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** A Javanese house on stilts with a tall thatched roof. (x, y) = ground. */
function stiltHouse(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0): void {
  const wood = hz(mix(P.laterite, P.ink, 0.3), haze);
  for (const k of [-12, -4, 4, 12]) taperStroke(ctx, [{ x: x + k * s, y }, { x: x + k * s, y: y - 10 * s }], 1.4 * s, wood, 1, [1, 1]);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 14 * s, y: y - 10 * s }, { x: x - 14 * s, y: y - 22 * s }, { x: x + 14 * s, y: y - 22 * s }, { x: x + 14 * s, y: y - 10 * s }]), { x: x - 14 * s, y: y - 22 * s, w: 28 * s, h: 12 * s }, { base: hz(mix(P.chandan, P.haldi, 0.3), haze), light: hz(P.limewhite, haze), shade: hz(mix(P.chandan, P.laterite, 0.4), haze), dabs: 6 });
  const roof = hz(mix(P.haldi, P.laterite, 0.45), haze);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 20 * s, y: y - 20 * s }, { x: x - 4 * s, y: y - 42 * s }, { x: x + 4 * s, y: y - 42 * s }, { x: x + 20 * s, y: y - 20 * s }]), { x: x - 20 * s, y: y - 42 * s, w: 40 * s, h: 22 * s }, { base: roof, light: hz(mix(roof, P.haldi, 0.35), haze), shade: hz(mix(roof, P.ink, 0.3), haze), lightFrom: 'right', dabs: 10 });
  taperStroke(ctx, [{ x: x - 6 * s, y: y - 44 * s }, { x: x + 6 * s, y: y - 44 * s }], 1.6 * s, wood, 1, [1, 1]);
}

function paintJetty(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const deck = h - 46;
  const wood = mix(P.laterite, P.ink, 0.3), plank = mix(P.laterite, P.chandan, 0.3);
  // a pavilion (pendopo) on the beach end
  for (const k of [40, 110]) taperStroke(ctx, [{ x: k, y: deck }, { x: k, y: deck - 60 }], 3, wood, 1, [1, 1]);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 20, y: deck - 56 }, { x: 55, y: deck - 92 }, { x: 95, y: deck - 92 }, { x: 130, y: deck - 56 }]), { x: 20, y: deck - 92, w: 110, h: 36 }, { base: mix(P.laterite, P.sindoor, 0.15), light: mix(P.laterite, P.haldi, 0.35), shade: mix(P.laterite, P.ink, 0.35), lightFrom: 'right' });
  // the pier on stilts
  for (let x = 130; x < w - 40; x += 36) taperStroke(ctx, [{ x, y: deck + 2 }, { x: x + 1, y: h }], 4, wood, 1, [1, 1]);
  ctx.fillStyle = plank;
  ctx.fillRect(0, deck - 3, w - 30, 7);
  ctx.fillStyle = withAlpha(P.ink, 0.3);
  ctx.fillRect(0, deck + 3, w - 30, 2);
  for (let x = 0; x < w - 30; x += 9) ctx.fillRect(x, deck - 3, 0.8, 6);
  // scholars waiting with palm-leaf books; a welcomer with a garland
  const monks = [170, 205, 240, 300];
  monks.forEach((x, i) => {
    person(ctx, x, deck - 3, 1.35, { pose: i === 2 ? 'wave' : 'read', cloth: i % 2 ? P.marigold : mix(P.marigold, P.sindoor, 0.35), cloth2: mix(P.marigold, P.laterite, 0.3), skin: 0.3 + i * 0.15, facing: 1, phase: i });
    if (i !== 2) palmLeaf(ctx, x + 7.5, deck - 3 - 30, 1.2);
  });
  person(ctx, 360, deck - 3, 1.35, { pose: 'serve', cloth: P.haldi, cloth2: P.tota, sari: true, head: 'bun', skin: 0.5 });
  for (let i = 0; i < 6; i++) dab(ctx, 372 + Math.cos(i) * 3, deck - 22 + Math.sin(i) * 2, 1.6, 1.6, 0, i % 2 ? P.limewhite : P.marigold, 1);
  person(ctx, 400, deck - 3, 0.85, { pose: 'point', cloth: P.sindoor, skin: 0.6 });
  // baskets of spice waiting to be traded
  for (let i = 0; i < 3; i++) { dab(ctx, 460 + i * 18, deck - 7, 8, 5, 0, mix(P.haldi, P.laterite, 0.45), 1); dab(ctx, 460 + i * 18, deck - 11, 6, 2, 0, [P.sindoor, P.marigold, P.laterite][i], 1); }
  gull(ctx, 520, deck - 70, 1.3, P.limewhite);
}

function paintArrival(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const x = w / 2, y = h - 10, s = 1.45;
  boitaShip(ctx, rng, x, y, s, { sail: mix(P.limewhite, P.haldi, 0.12), sail2: P.sindoor, cargo: 'bales' });
  person(ctx, x + 50 * s, y - 14 * s, 1.1, { pose: 'wave', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: 0.5 });
  person(ctx, x - 44 * s, y - 14 * s, 1.1, { pose: 'pull', cloth: P.haldi, skin: 0.75, facing: -1 });
  // a mooring rope thrown towards the shore
  taperStroke(ctx, curvePts(x + 56 * s, y - 34 * s, x + 90 * s, y - 70 * s, x + 120 * s, y - 40 * s, 10), 1.4, mix(P.haldi, P.laterite, 0.4), 1, [1, 1]);
  for (let i = 0; i < 3; i++) gull(ctx, x - 30 + i * 34, y - 160 - (i % 2) * 12, 1.2, P.limewhite);
}

function paintLesson(ctx: Ctx, rng: Rng, w: number, h: number): void {
  // a sandy point with a banyan; a teacher and his students — one of them a monkey, studying hard
  const sand = mix(P.chandan, P.skyCream, 0.45);
  ctx.fillStyle = sand;
  ctx.beginPath(); ctx.moveTo(0, h); ctx.quadraticCurveTo(w * 0.2, h - 22, w * 0.5, h - 24); ctx.quadraticCurveTo(w * 0.8, h - 22, w, h); ctx.closePath(); ctx.fill();
  for (let x = 10; x < w; x += rng.range(10, 20)) taperStroke(ctx, [{ x, y: h - 2 }, { x: x + 14, y: h - 1.5 }], 1.6, P.limewhite, 0.7);
  broadTree(ctx, rng.fork('banyan'), w * 0.3, h - 22, 190, 170, 0);
  for (let i = 0; i < 5; i++) taperStroke(ctx, [{ x: w * 0.18 + i * 22, y: h - 120 }, { x: w * 0.18 + i * 22 + 2, y: h - 24 }], 1.2, mix(P.khondalite, P.ink, 0.2), 0.8, [1, 1]);
  const gy = h - 22;
  person(ctx, w * 0.3, gy, 1.6, { pose: 'read', cloth: P.marigold, cloth2: mix(P.marigold, P.sindoor, 0.3), skin: 0.5, facing: 1 });
  palmLeaf(ctx, w * 0.3 + 9, gy - 36, 1.4);
  const xs = [0.48, 0.58, 0.68, 0.78];
  xs.forEach((k, i) => {
    if (i === 2) {
      monkey(ctx, w * k, gy, 1.4, -1, 0);
      palmLeaf(ctx, w * k - 12, gy - 18, 1.1);
    } else {
      person(ctx, w * k, gy, 1.25, { pose: 'sit', cloth: i % 2 ? P.marigold : P.limewhite, cloth2: P.sindoor, skin: 0.3 + i * 0.2, facing: -1 });
      palmLeaf(ctx, w * k - 10, gy - 18, 1.1);
    }
  });
}

function paintOutrigger(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const x = w / 2, y = h - 12;
  const wood = mix(P.laterite, P.ink, 0.2);
  // outrigger float and booms
  taperStroke(ctx, [{ x: x - 40, y: y + 6 }, { x: x + 40, y: y + 6 }], 4, mix(P.khondalite, P.chandan, 0.3), 1, [0.6, 0.6]);
  for (const k of [-20, 20]) taperStroke(ctx, [{ x: x + k, y: y - 8 }, { x: x + k + 4, y: y + 6 }], 1.6, wood, 1, [1, 1]);
  ctx.fillStyle = wood;
  ctx.beginPath(); ctx.moveTo(x - 56, y - 14); ctx.quadraticCurveTo(x, y + 4, x + 58, y - 16); ctx.quadraticCurveTo(x, y - 6, x - 56, y - 14); ctx.fill();
  ctx.fillStyle = mix(P.haldi, P.laterite, 0.2);
  ctx.fillRect(x - 40, y - 10, 80, 2);
  // a triangular sail, furled half-way
  taperStroke(ctx, [{ x: x + 6, y: y - 8 }, { x: x + 8, y: y - 80 }], 2, wood, 1, [1, 1]);
  ctx.fillStyle = mix(P.sindoor, P.limewhite, 0.25);
  ctx.beginPath(); ctx.moveTo(x + 8, y - 78); ctx.lineTo(x + 40, y - 18); ctx.lineTo(x + 8, y - 16); ctx.closePath(); ctx.fill();
  person(ctx, x - 30, y - 8, 1.2, { pose: 'wave', cloth: P.tota, skin: 0.7, facing: -1, phase: 1 });
  person(ctx, x + 30, y - 8, 1.2, { pose: 'pull', cloth: P.marigold, head: 'cap', skin: 0.5 });
  // the catch: a fish leaping clean over the bow
  taperStroke(ctx, curvePts(x - 76, y - 4, x - 70, y - 40, x - 58, y - 30, 8), 5, mix(P.limewhite, P.seafoam, 0.4), 1, [0.6, 0.2]);
  for (let i = 0; i < 4; i++) dab(ctx, x - 82 + i * 4, y - 2 + (i % 2) * 2, 1.4, 1.4, 0, P.limewhite, 0.8);
  void rng;
}

// ---- record 07 · Parasurameswara -------------------------------------------------------

/** A flat-roofed rectangular jagamohana with two low tiers, as at Parasurameswara. */
function flatHall(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, stone: string): void {
  const light = mix(stone, P.limewhite, 0.35), shade = mix(stone, P.ink, 0.4);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w / 2, y: y - h * 0.62 }, { x: x + w / 2, y: y - h * 0.62 }, { x: x + w / 2, y }]), { x: x - w / 2, y: y - h * 0.62, w, h: h * 0.62 }, { base: stone, light, shade, lightFrom: 'right' });
  ctx.fillStyle = withAlpha(shade, 0.8);
  for (let i = 0; i < 4; i++) ctx.fillRect(x - w * 0.36 + i * w * 0.22, y - h * 0.44, w * 0.06, h * 0.3); // latticed windows
  for (let t = 0; t < 2; t++) {
    const ty = y - h * 0.62 - t * h * 0.19, tw = w * (1.06 - t * 0.12);
    paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - tw / 2, y: ty }, { x: x - tw * 0.47, y: ty - h * 0.17 }, { x: x + tw * 0.47, y: ty - h * 0.17 }, { x: x + tw / 2, y: ty }]), { x: x - tw / 2, y: ty - h * 0.17, w: tw, h: h * 0.17 }, { base: stone, light, shade, lightFrom: 'top', dabs: 10 });
    ctx.fillStyle = withAlpha(shade, 0.6);
    ctx.fillRect(x - tw / 2, ty - 2, tw, 2);
  }
}

function paintParasurameswara(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 6;
  for (const k of [0.06, 0.94]) broadTree(ctx, rng.fork(k), w * k, g, 90, 110, 0.15);
  coconutPalm(ctx, rng.fork('p'), w * 0.9, g, 170, -0.1, 0.1);
  // platform
  ctx.fillStyle = mix(SANDSTONE, P.ink, 0.25);
  ctx.fillRect(w * 0.14, g - 6, w * 0.66, 8);
  rekhaDeula(ctx, rng.fork('rekha'), w * 0.58, g - 4, 230, { stone: SANDSTONE });
  flatHall(ctx, rng.fork('hall'), w * 0.33, g - 4, 150, 96, SANDSTONE);
  // still building: bamboo scaffold up the tower, an earth ramp for hauling, workers aloft
  scaffold(ctx, w * 0.58 - 54, g - 210, w * 0.58 + 54, g - 70, 4, 6);
  person(ctx, w * 0.58 - 30, g - 140 + 1, 0.95, { pose: 'adze', cloth: P.limewhite, skin: 0.7, phase: 1 });
  person(ctx, w * 0.58 + 26, g - 186 + 1, 0.95, { pose: 'pull', cloth: P.marigold, skin: 0.4, facing: -1 });
  const earth = mix(P.laterite, P.chandan, 0.2);
  ctx.fillStyle = earth;
  ctx.beginPath(); ctx.moveTo(w * 0.66, g - 70); ctx.lineTo(w, g); ctx.lineTo(w * 0.66, g); ctx.closePath(); ctx.fill();
  dabField(ctx, rng, w * 0.66, g - 70, w * 0.34, 70, { n: 80, r: [1.5, 3.5], colours: [mix(earth, P.ink, 0.25), mix(earth, P.haldi, 0.3)], alpha: [0.3, 0.6] });
  block(ctx, rng.fork('b'), w * 0.8, g - 36, 26, 16, P.khondalite);
  person(ctx, w * 0.75, g - 50, 0.95, { pose: 'pull', cloth: P.haldi, skin: 0.6, facing: -1 });
  person(ctx, w * 0.86, g - 18, 0.95, { pose: 'pull', cloth: P.limewhite, skin: 0.8, facing: -1 });
}

function paintHaulers(ctx: Ctx, rng: Rng, _w: number, h: number): void {
  const g = h - 4;
  // log rollers and the great block
  for (let i = 0; i < 3; i++) { dab(ctx, 60 + i * 26, g - 5, 6, 5, 0, mix(P.laterite, P.ink, 0.3), 1); dab(ctx, 60 + i * 26, g - 5, 3, 2.4, 0, mix(P.chandan, P.haldi, 0.3), 1); }
  block(ctx, rng, 86, g - 10, 96, 52, mix(P.khondalite, P.chandan, 0.15));
  // the rope and the haulers leaning into it
  const ropeY = g - 30;
  taperStroke(ctx, [{ x: 134, y: g - 36 }, { x: 400, y: ropeY + 2 }], 2, mix(P.haldi, P.laterite, 0.4), 1, [1, 1]);
  const cl = [P.limewhite, P.marigold, P.haldi, P.limewhite, P.tota];
  for (let i = 0; i < 5; i++) person(ctx, 180 + i * 46, g, 1.35, { pose: 'pull', cloth: cl[i], skin: (i * 0.29) % 1, head: i % 2 ? 'turban' : 'none', phase: i * 1.3 });
  // a boy with a fresh log roller, the overseer with his plans
  person(ctx, 20, g, 1, { pose: 'carry', cloth: P.sindoor, skin: 0.5 });
  person(ctx, 450, g, 1.45, { pose: 'point', cloth: P.limewhite, cloth2: P.laterite, head: 'turban', skin: 0.4, facing: -1 });
  ctx.fillStyle = P.limewhite;
  ctx.fillRect(468, g - 32, 12, 9);
}

/** A sculptor asleep on his half-carved temple lion, chisel dropped, a crow keeping watch. */
function paintLion(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4, cx = w / 2;
  const st = mix(P.khondalite, P.chandan, 0.25);
  // the block: left half still rough, right half a seated lion
  block(ctx, rng.fork('rough'), cx - 34, g, 70, 50, st);
  const lion = mix(st, P.limewhite, 0.15), lionD = mix(st, P.ink, 0.3);
  dab(ctx, cx + 14, g - 26, 24, 24, 0, lion, 1);
  dab(ctx, cx + 30, g - 52, 18, 18, 0, lionD, 1); // mane
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; dab(ctx, cx + 30 + Math.cos(a) * 15, g - 52 + Math.sin(a) * 15, 5, 4, a, lion, 1); }
  dab(ctx, cx + 33, g - 52, 10, 10, 0, lion, 1);
  dab(ctx, cx + 38, g - 54, 1.6, 1.6, 0, P.ink, 1);
  taperStroke(ctx, [{ x: cx + 34, y: g - 46 }, { x: cx + 42, y: g - 47 }], 1.4, lionD, 1);
  taperStroke(ctx, [{ x: cx + 26, y: g - 30 }, { x: cx + 30, y: g - 2 }], 7, lion, 1, [1, 0.9]);
  taperStroke(ctx, [{ x: cx + 14, y: g - 8 }, { x: cx - 2, y: g - 2 }], 6, lion, 1, [0.8, 0.8]);
  // chips around
  dabField(ctx, rng, cx - 70, g - 6, 140, 6, { n: 30, r: [1, 2.4], colours: [lion, st], alpha: [0.7, 1] });
  // the sculptor, asleep on top
  lying(ctx, cx + 16, g - 50, 1.25, { cloth: P.limewhite, cloth2: P.laterite, skin: 0.6, head: 'turban' });
  snore(ctx, cx - 26, g - 64, 1.2);
  // tools on the ground and a crow on the lion's head
  taperStroke(ctx, [{ x: cx - 80, y: g - 2 }, { x: cx - 64, y: g - 4 }], 2, mix(P.khondalite, P.ink, 0.3), 1, [1, 0.5]);
  dab(ctx, cx - 90, g - 4, 5, 3, 0.3, mix(P.laterite, P.ink, 0.2), 1);
  crow(ctx, cx + 30, g - 68, 1.3, -1);
}

function paintCarvers(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4;
  const wood = mix(P.laterite, P.ink, 0.3);
  for (const k of [20, w - 20]) taperStroke(ctx, [{ x: k, y: g }, { x: k, y: g - 70 }], 2.6, wood, 1, [1, 1]);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 4, y: g - 66 }, { x: w * 0.3, y: g - 90 }, { x: w * 0.7, y: g - 90 }, { x: w - 4, y: g - 66 }]), { x: 4, y: g - 90, w: w - 8, h: 24 }, { base: mix(P.haldi, P.laterite, 0.4), light: P.haldi, shade: mix(P.laterite, P.ink, 0.3) });
  // two carved panels, one finished with a dancer-like relief (abstract), one just begun
  for (const [px, done] of [[w * 0.32, true], [w * 0.7, false]] as const) {
    block(ctx, rng.fork(px), px, g, 40, 54, SANDSTONE);
    if (done) {
      dab(ctx, px, g - 34, 4, 4, 0, mix(SANDSTONE, P.ink, 0.35), 1);
      taperStroke(ctx, curvePts(px, g - 30, px + 4, g - 20, px - 2, g - 10, 5), 5, mix(SANDSTONE, P.ink, 0.3), 1);
      taperStroke(ctx, [{ x: px - 8, y: g - 28 }, { x: px + 8, y: g - 34 }], 2, mix(SANDSTONE, P.ink, 0.3), 1);
    } else for (let i = 0; i < 6; i++) dab(ctx, px + rng.range(-12, 12), g - rng.range(12, 44), 2, 2, 0, mix(SANDSTONE, P.ink, 0.3), 0.7);
  }
  person(ctx, w * 0.32 - 30, g, 1.2, { pose: 'adze', cloth: P.limewhite, skin: 0.5, phase: 0.8 });
  person(ctx, w * 0.7 + 30, g, 1.2, { pose: 'adze', cloth: P.marigold, skin: 0.7, facing: -1, phase: 2 });
}

// ---- record 08 · Vaital Deula ----------------------------------------------------------

/** Vaital Deula with its boat-shaped roof, and beside it a boatman pointing from the roof to his own upturned boat. */
function paintVaital(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 6;
  for (const [k, ww] of [[0.05, 130], [0.97, 120]] as const) tamarindTree(ctx, rng.fork(k), w * k, g, ww, 150, 0.1);
  tamarindTree(ctx, rng.fork('back'), w * 0.47, g - 4, 180, 200, 0.25);
  // the temple: jagamohana and the khakhara sanctum
  ctx.fillStyle = mix(SANDSTONE, P.ink, 0.25);
  ctx.fillRect(w * 0.08, g - 5, w * 0.36, 7);
  pidhaHall(ctx, rng.fork('jag'), w * 0.16, g - 3, 90, 96, { stone: SANDSTONE });
  khakhara(ctx, rng.fork('vaital'), w * 0.32, g - 3, 150, 190, { stone: SANDSTONE });
  // the boatman, turning from the roof to his boat
  const bx = w * 0.68;
  person(ctx, w * 0.5, g, 1.6, { pose: 'point', cloth: P.limewhite, cloth2: P.peacock, head: 'turban', skin: 0.7, facing: -1 });
  person(ctx, w * 0.55, g, 1.05, { pose: 'stand', cloth: P.marigold, skin: 0.4, facing: -1 });
  // his boat, upside down on two trestles: the same long rounded curve
  const wood = mix(P.laterite, P.ink, 0.15);
  for (const k of [-46, 46]) { taperStroke(ctx, [{ x: bx + k - 8, y: g }, { x: bx + k, y: g - 24 }, { x: bx + k + 8, y: g }], 2.4, mix(P.laterite, P.ink, 0.35), 1, [1, 1]); }
  const hull = () => { ctx.beginPath(); ctx.moveTo(bx - 84, g - 22); ctx.bezierCurveTo(bx - 70, g - 70, bx + 70, g - 70, bx + 84, g - 22); ctx.lineTo(bx - 84, g - 22); ctx.closePath(); };
  paintedShape(ctx, rng.fork('hull'), hull, { x: bx - 84, y: g - 70, w: 168, h: 48 }, { base: wood, light: mix(wood, P.chandan, 0.4), shade: mix(wood, P.ink, 0.4), lightFrom: 'top', rim: mix(wood, P.ink, 0.5), rimW: 1.2 });
  clipTo(ctx, hull, () => { for (let i = 1; i < 4; i++) { ctx.strokeStyle = withAlpha(mix(wood, P.ink, 0.4), 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 84, g - 22 - i * 9); ctx.bezierCurveTo(bx - 60, g - 50 - i * 6, bx + 60, g - 50 - i * 6, bx + 84, g - 22 - i * 9); ctx.stroke(); } });
  ctx.fillStyle = P.haldi;
  ctx.fillRect(bx - 76, g - 26, 152, 2);
  // oars leaning and a crow on the keel
  taperStroke(ctx, [{ x: bx + 96, y: g }, { x: bx + 112, y: g - 70 }], 2, mix(P.laterite, P.chandan, 0.3), 1, [1, 1]);
  dab(ctx, bx + 111, g - 66, 3, 8, 0.2, mix(P.laterite, P.chandan, 0.3), 1);
  crow(ctx, bx + 6, g - 58, 1.2, -1);
}

function paintTamarindPole(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4;
  tamarindTree(ctx, rng.fork('t'), w * 0.45, g, 210, 230, 0);
  const kx = w * 0.7;
  person(ctx, kx, g, 1.5, { pose: 'armsUp', cloth: P.haldi, skin: 0.5, facing: -1 });
  taperStroke(ctx, [{ x: kx + 4, y: g - 54 }, { x: w * 0.5, y: g - 170 }], 2, mix(P.haldi, P.laterite, 0.4), 1, [1, 1]);
  // pods falling, a girl gathering them in her lap
  for (let i = 0; i < 6; i++) { const px = w * 0.48 + rng.range(-20, 40), py = g - 140 + i * 18; taperStroke(ctx, curvePts(px, py, px + 3, py + 4, px + 2, py + 9, 4), 2.4, mix(P.laterite, P.chandan, 0.35), 1); }
  person(ctx, w * 0.36, g, 1.3, { pose: 'sit', cloth: P.sindoor, cloth2: P.haldi, sari: true, skin: 0.6, facing: 1 });
  for (let i = 0; i < 5; i++) dab(ctx, w * 0.36 + 6 + i * 2.4, g - 10, 2.2, 1, 0.4, mix(P.laterite, P.chandan, 0.35), 1);
  goat(ctx, w * 0.18, g, 1.2, 1);
}

function paintBasketGoat(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4;
  const cane = mix(P.haldi, P.laterite, 0.35);
  // the weaver, dozing over his work under a parasol of palm leaf
  broadTree(ctx, rng.fork('shade'), w * 0.25, g, 120, 120, 0.05);
  person(ctx, w * 0.3, g, 1.45, { pose: 'sit', cloth: P.limewhite, cloth2: P.tota, head: 'turban', skin: 0.75, facing: 1 });
  snore(ctx, w * 0.3 + 8, g - 50, 1.1);
  // a stack of baskets — and a goat with its head in the top one
  for (let i = 0; i < 3; i++) { dab(ctx, w * 0.56, g - 6 - i * 10, 16 - i * 1.5, 6, 0, cane, 1); ctx.strokeStyle = withAlpha(mix(cane, P.ink, 0.4), 0.6); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(w * 0.56, g - 6 - i * 10, 15 - i * 1.5, 5, 0, 0, Math.PI); ctx.stroke(); }
  goat(ctx, w * 0.72, g, 1.5, -1);
  dab(ctx, w * 0.6, g - 32, 10, 6, -0.3, cane, 1); // the basket on its head
  for (let i = 0; i < 4; i++) dab(ctx, w * 0.82 + i * 10, g - 3, 6, 3, 0, cane, 0.9); // finished baskets lined up
}

// ---- record 09 · Ratnagiri -------------------------------------------------------------

const BRICK = mix(P.laterite, P.sindoor, 0.12);

function paintMonastery(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const hill = () => { ctx.beginPath(); ctx.moveTo(0, h); ctx.bezierCurveTo(w * 0.15, h - 40, w * 0.25, h - 150, w * 0.45, h - 158); ctx.bezierCurveTo(w * 0.7, h - 166, w * 0.85, h - 80, w, h); ctx.closePath(); };
  const green = mix(P.tota, P.khondalite, 0.3);
  paintedShape(ctx, rng, hill, { x: 0, y: h - 166, w, h: 166 }, { base: green, light: mix(green, P.haldi, 0.35), shade: mix(green, P.neel, 0.35), lightFrom: 'right', dabs: 300 });
  for (let i = 0; i < 10; i++) { const x = w * (0.08 + i * 0.09); broadTree(ctx, rng.fork(i), x, h - 10 - Math.max(0, 120 - Math.abs(x - w * 0.47) * 0.4) * 0.5, 50, 50, 0.2); }
  const top = h - 156;
  // the great brick stupa on the summit
  const sx = w * 0.3;
  ctx.fillStyle = mix(BRICK, P.ink, 0.25);
  ctx.fillRect(sx - 70, top - 16, 140, 16);
  paintedShape(ctx, rng.fork('dome'), () => { ctx.beginPath(); ctx.moveTo(sx - 60, top - 14); ctx.bezierCurveTo(sx - 60, top - 96, sx + 60, top - 96, sx + 60, top - 14); ctx.closePath(); }, { x: sx - 60, y: top - 90, w: 120, h: 76 }, { base: BRICK, light: mix(BRICK, P.haldi, 0.35), shade: mix(BRICK, P.ink, 0.35), lightFrom: 'right', dabs: 90 });
  ctx.fillStyle = mix(BRICK, P.ink, 0.2);
  ctx.fillRect(sx - 10, top - 100, 20, 12);
  taperStroke(ctx, [{ x: sx, y: top - 100 }, { x: sx, y: top - 124 }], 2.4, mix(P.khondalite, P.ink, 0.2), 1, [1, 1]);
  for (let i = 0; i < 3; i++) dab(ctx, sx, top - 106 - i * 7, 10 - i * 3, 1.6, 0, mix(P.khondalite, P.ink, 0.2), 1);
  // the monastery quadrangle: brick walls, a row of cells, the carved khondalite doorway
  const mx0 = w * 0.44, mx1 = w * 0.74;
  paintedShape(ctx, rng.fork('wall'), () => polyPath(ctx, [{ x: mx0, y: top + 4 }, { x: mx0, y: top - 50 }, { x: mx1, y: top - 50 }, { x: mx1, y: top + 4 }]), { x: mx0, y: top - 50, w: mx1 - mx0, h: 54 }, { base: BRICK, light: mix(BRICK, P.haldi, 0.3), shade: mix(BRICK, P.ink, 0.35), lightFrom: 'top' });
  ctx.strokeStyle = withAlpha(mix(BRICK, P.ink, 0.4), 0.35);
  ctx.lineWidth = 0.8;
  for (let y = top - 46; y < top; y += 5) { ctx.beginPath(); ctx.moveTo(mx0, y); ctx.lineTo(mx1, y); ctx.stroke(); }
  const dx = (mx0 + mx1) / 2;
  const door = mix(P.khondalite, P.neel, 0.2);
  paintedShape(ctx, rng.fork('door'), () => polyPath(ctx, [{ x: dx - 22, y: top + 4 }, { x: dx - 22, y: top - 46 }, { x: dx + 22, y: top - 46 }, { x: dx + 22, y: top + 4 }]), { x: dx - 22, y: top - 46, w: 44, h: 50 }, { base: door, light: mix(door, P.limewhite, 0.3), shade: mix(door, P.ink, 0.3) });
  for (let i = 0; i < 5; i++) dab(ctx, dx - 17 + (i % 2) * 34, top - 40 + Math.floor(i / 2) * 14, 3, 5, 0, mix(door, P.limewhite, 0.4), 0.8);
  ctx.fillStyle = mix(P.ink, P.laterite, 0.2);
  ctx.fillRect(dx - 11, top - 30, 22, 34);
  for (let i = 0; i < 4; i++) { ctx.fillRect(mx0 + 14 + i * 16, top - 30, 8, 14); ctx.fillRect(dx + 30 + i * 16, top - 30, 8, 14); }
  // small votive stupas on the slope (scenery: hazy and far)
  for (let i = 0; i < 9; i++) votiveStupa(ctx, w * (0.12 + i * 0.075), top + 20 + Math.abs(i - 4) * 12, 0.7, { haze: 0.5 });
  person(ctx, dx - 40, top + 4, 0.9, { pose: 'walk', cloth: P.marigold, skin: 0.4 });
  person(ctx, dx + 50, top + 4, 0.9, { pose: 'read', cloth: mix(P.marigold, P.sindoor, 0.4), skin: 0.6, facing: -1 });
}

function paintBuddha(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4;
  for (let i = 0; i < 5; i++) votiveStupa(ctx, w * (0.08 + i * 0.2), g - 40, 0.8, { haze: 0.55 });
  broadTree(ctx, rng.fork('t'), w * 0.88, g, 110, 150, 0.1);
  ctx.fillStyle = mix(P.khondalite, P.ink, 0.15);
  ctx.fillRect(w * 0.5 - 70, g - 14, 140, 14);
  ctx.fillStyle = mix(P.khondalite, P.limewhite, 0.2);
  ctx.fillRect(w * 0.5 - 70, g - 14, 140, 3);
  buddhaHead(ctx, w * 0.5, g - 14, 2.3, 0);
  // a monk offering a flower; a small child standing on tiptoe to see how big it is
  person(ctx, w * 0.2, g, 1.45, { pose: 'serve', cloth: P.marigold, cloth2: mix(P.marigold, P.sindoor, 0.3), skin: 0.5, facing: 1 });
  lotusFlower(ctx, w * 0.2 + 14, g - 34, 4);
  person(ctx, w * 0.75, g, 0.95, { pose: 'armsUp', cloth: P.haldi, skin: 0.4, facing: -1 });
}

function paintReaders(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4;
  broadTree(ctx, rng.fork('t'), w * 0.5, g, 230, 200, 0);
  const cl = [P.marigold, mix(P.marigold, P.sindoor, 0.4), P.marigold];
  [0.22, 0.38, 0.62].forEach((k, i) => {
    person(ctx, w * k, g, 1.35, { pose: 'read', cloth: cl[i], cloth2: mix(P.marigold, P.laterite, 0.3), skin: 0.3 + i * 0.2, facing: i === 2 ? -1 : 1 });
    palmLeaf(ctx, w * k + (i === 2 ? -9 : 9), g - 31, 1.3);
  });
  // the youngest novice has given up and fallen asleep, his manuscript over his face
  lying(ctx, w * 0.86, g, 1.3, { cloth: P.marigold, skin: 0.55 });
  palmLeaf(ctx, w * 0.86 - 44, g - 12, 1.4);
  snore(ctx, w * 0.86 - 46, g - 22, 1.1);
}

function paintPeacock(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4;
  // a monk sweeps leaves into a pile — and a peacock spreads its train right across his work
  const leaf = [mix(P.haldi, P.laterite, 0.4), mix(P.tota, P.haldi, 0.4), P.marigold];
  for (let i = 0; i < 40; i++) dab(ctx, w * 0.3 + rng.range(-50, 90), g - rng.range(0, 4), 2.6, 1.3, rng.next() * 3, rng.pick(leaf), 0.9);
  person(ctx, w * 0.2, g, 1.45, { pose: 'sweep', cloth: P.marigold, skin: 0.45, facing: 1 });
  peacockBird(ctx, w * 0.62, g, 1.5, -1);
  for (let i = 0; i < 8; i++) dab(ctx, w * 0.62 + rng.range(-40, 40), g - rng.range(30, 70), 2.4, 1.2, rng.next() * 3, rng.pick(leaf), 0.9);
  reedTuft(ctx, rng, w * 0.92, g, 30, 30, GRASS, 9);
}

// ---- record 10 · Mukteswara ------------------------------------------------------------

function paintMukteswara(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 26;
  mangoTree(ctx, rng.fork('m1'), w * 0.08, g, 130, 150, 0.1);
  mangoTree(ctx, rng.fork('m2'), w * 0.93, g, 140, 160, 0.1);
  // Siddheswara rises close behind
  rekhaDeula(ctx, rng.fork('sidd'), w * 0.8, g - 2, 210, { stone: mix(P.laterite, P.chandan, 0.3), haze: 0.2 });
  // the compound wall, low
  ctx.fillStyle = mix(P.laterite, P.chandan, 0.2);
  ctx.fillRect(w * 0.12, g - 12, w * 0.76, 12);
  ctx.fillStyle = withAlpha(P.limewhite, 0.25);
  ctx.fillRect(w * 0.12, g - 12, w * 0.76, 2);
  mukteswara(ctx, rng.fork('mk'), w * 0.52, g, 1.6, 0);
  // the tank in front, with steps
  ctx.fillStyle = mix(SANDSTONE, P.ink, 0.15);
  ctx.fillRect(w * 0.2, g, w * 0.6, 6);
  ctx.fillStyle = mix(P.peacock, P.seafoam, 0.3);
  ctx.fillRect(w * 0.22, g + 6, w * 0.56, h - g - 8);
  for (let i = 0; i < 18; i++) taperStroke(ctx, [{ x: w * 0.24 + rng.next() * w * 0.5, y: g + 9 + rng.next() * 12 }, { x: w * 0.24 + rng.next() * w * 0.5 + 16, y: g + 10 + rng.next() * 10 }], 1, P.limewhite, 0.4);
  lotusPad(ctx, rng, w * 0.3, g + 16, 8, 0.1);
  lotusFlower(ctx, w * 0.33, g + 14, 5);
  person(ctx, w * 0.25, g, 1.1, { pose: 'lamp', cloth: P.sindoor, cloth2: P.haldi, sari: true, head: 'veil', skin: 0.5 });
}

function paintMangoShake(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4;
  const tx = w * 0.42;
  mangoTree(ctx, rng.fork('tree'), tx, g, 230, 230, 0, 1.3);
  // a boy up on a branch shaking it, mangoes in the air
  const by = g - 150;
  person(ctx, tx + 50, by, 1.2, { pose: 'armsUp', cloth: P.haldi, skin: 0.6 });
  for (let i = 0; i < 7; i++) { const px = tx + 20 + rng.range(-30, 80), py = by + 20 + i * 16; dab(ctx, px, py, 3, 4, 0.3, i % 2 ? mix(P.haldi, P.marigold, 0.4) : mix(P.tota, P.haldi, 0.45), 1); }
  // friends below catching them in a cloth
  person(ctx, tx + 60, g, 1.2, { pose: 'armsUp', cloth: P.sindoor, skin: 0.4, facing: -1 });
  person(ctx, tx + 96, g, 1.2, { pose: 'armsUp', cloth: P.tota, cloth2: P.haldi, sari: true, skin: 0.7, facing: -1 });
  taperStroke(ctx, curvePts(tx + 62, g - 40, tx + 80, g - 30, tx + 94, g - 40, 8), 4, P.limewhite, 1, [1, 1]);
  // the temple priest, not amused
  const px = w * 0.86;
  person(ctx, px, g, 1.5, { pose: 'point', cloth: P.limewhite, cloth2: P.haldi, skin: 0.45, facing: -1 });
  taperStroke(ctx, [{ x: px - 2, y: g - 52 }, { x: px + 1, y: g - 53.4 }], 1.4, P.ink, 1, [1, 1]); // a frowning brow
  taperStroke(ctx, [{ x: px - 4, y: g - 45 }, { x: px + 5, y: g - 40 }], 0.9, P.sindoor, 1, [1, 1]); // sandal-paste mark
}

function paintParrots(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const g = h - 4;
  mangoTree(ctx, rng.fork('tree'), w * 0.5, g, 200, 210, 0, 0.8);
  // a long low branch reaching out, two parrots sharing one mango
  const bx0 = w * 0.5, by = g - 96;
  taperStroke(ctx, curvePts(bx0, by + 10, w * 0.72, by - 6, w * 0.96, by + 4, 10), 5, mix(P.laterite, P.ink, 0.4), 1, [1, 0.3]);
  for (let i = 0; i < 5; i++) dab(ctx, w * 0.82 + i * 7, by - 2 + (i % 2) * 6, 7, 3, 0.4, mix(P.tota, P.peacock, 0.25), 1);
  parrot(ctx, w * 0.7, by - 2, 1.7, 1);
  parrot(ctx, w * 0.82, by, 1.7, -1);
  taperStroke(ctx, [{ x: w * 0.76, y: by }, { x: w * 0.76, y: by + 6 }], 1, mix(P.tota, P.ink, 0.3), 1, [1, 1]);
  dab(ctx, w * 0.76, by + 11, 4, 5.4, 0.2, mix(P.haldi, P.marigold, 0.45), 1);
  dab(ctx, w * 0.76 + 2, by + 8, 1.4, 1.6, 0, P.limewhite, 0.5);
  // below, a cow resting in the shade
  cow(ctx, w * 0.3, g, 1.2, { colour: P.limewhite, grazing: true });
}

// ---- scenes ----------------------------------------------------------------------------------

export const SCENES: Record<string, () => SceneDef> = {
  // 06 · 6th–7th century CE · Kalingga, Java — a kingdom that carries Kalinga's name.
  r06: () => ({
    id: 'r06',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.35)], [0.55, mix(P.skyCream, P.marigold, 0.12)], [1, mix(P.skyCream, P.marigold, 0.38)]], sun: { x: 1040, y: 120, r: 32 }, clouds: 'cumulus', cloudTint: mix(P.marigold, P.skyCream, 0.5) },
    far: [{ kind: 'hills', a: mix(mix(P.tota, P.peacock, 0.35), P.skyCream, 0.5), b: P.peacock, height: [16, 52], base: 158, trees: true, haze: 0.45 }],
    ground: { kind: 'sea', water: JAVA_WATER },
    mid: (ctx, rng, W) => {
      // Terraced green hills behind a palm-lined beach; houses on stilts.
      const fb = periodicFbm(rng.fork('t'), W, 520, 3);
      const top = (x: number) => 110 + fb(x) * 50;
      const hill = () => { ctx.beginPath(); ctx.moveTo(0, 236); for (let x = 0; x <= W; x += 6) ctx.lineTo(x, top(x)); ctx.lineTo(W, 236); ctx.closePath(); };
      hill();
      ctx.fillStyle = mix(P.tota, P.skyCream, 0.25);
      ctx.fill();
      clipTo(ctx, hill, () => {
        for (let k = 0; k < 14; k++) {
          const off = 8 + k * 9;
          for (let x = 0; x < W; x += 5) {
            const y = top(x) + off + Math.sin(x * 0.01 + k) * 2;
            dab(ctx, x, y, 4, 1.3, 0, mix(P.tota, P.haldi, 0.45), 0.6);
            dab(ctx, x, y + 3, 4, 1.8, 0, mix(mix(P.tota, P.laterite, 0.3), P.skyCream, 0.15), 0.5);
          }
        }
      });
      scatter(rng.fork('houses'), W, [260, 460], (x) => wrapped(W, x, 30, (xx) => stiltHouse(ctx, rng.fork(x), xx, 228, rng.range(0.9, 1.15), 0.12)));
      scatter(rng.fork('palms'), W, [50, 110], (x) => wrapped(W, x, 50, (xx) => coconutPalm(ctx, rng.fork(x), xx, 230, rng.range(80, 130), rng.range(-0.16, 0.16), 0.12)));
      // beach and surf
      const sand = mix(P.chandan, P.skyCream, 0.45);
      ctx.fillStyle = sand;
      ctx.fillRect(0, 226, W, 10);
      for (let x = 0; x < W; x += rng.range(8, 20)) taperStroke(ctx, [{ x, y: 235 }, { x: x + rng.range(10, 30), y: 235.5 }], rng.range(1.2, 2.4), P.limewhite, rng.range(0.5, 0.9));
    },
    fore: (ctx, rng, W) => {
      scatter(rng.fork('fl'), W, [300, 600], (x) => wrapped(W, x, 10, (xx) => { const y = rng.range(40, 90); for (let i = 0; i < 5; i++) dab(ctx, xx + Math.cos(i * 1.26) * 3, y + Math.sin(i * 1.26) * 1.4, 2.4, 1.2, i * 1.26, P.limewhite, 0.9); dab(ctx, xx, y, 1.2, 1, 0, P.haldi, 1); }));
    },
    sign: { date: '6th–7th century CE', title: 'Kalingga, Java' },
    landmarks: [
      { at: 0.12, plane: 'far', w: 760, h: 260, y: 440, paint: paintVolcano(true) },
      { at: 0.62, plane: 'far', w: 560, h: 200, y: 440, paint: paintVolcano(false) },
      { at: 0.2, plane: 'mid', w: 600, h: 200, y: 452, paint: paintJetty },
      { at: 0.42, plane: 'mid', w: 460, h: 270, y: 494, paint: paintArrival },
      { at: 0.63, plane: 'mid', w: 420, h: 200, y: 448, paint: paintLesson },
      { at: 0.85, plane: 'mid', w: 300, h: 120, y: 490, paint: paintOutrigger },
    ],
  }),

  // 07 · Early 7th century CE · Parasurameswara — an early Kalinga temple, still being built.
  r07: () => ({
    id: 'r07',
    sky: { stops: ACT2_SKY, sun: { x: 1020, y: 110, r: 34 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.khondalite, P.skyCream, 0.5), b: P.tota, height: [20, 60], trees: true, haze: 0.5 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.35), plainDetail: 'grass', path: mix(P.laterite, P.chandan, 0.25), verge: mix(P.tota, P.laterite, 0.25) },
    mid: (ctx, rng, W) => {
      // Old Bhubaneswar: shrines among trees and tiled roofs, the long tank at their feet.
      treeRow(ctx, rng.fork('trees'), W, 200, 0.35, 0.3);
      scatter(rng.fork('shrines'), W, [240, 420], (x) => wrapped(W, x, 30, (xx) => rekhaDeula(ctx, rng.fork(x), xx, 214, rng.range(60, 96), { stone: SANDSTONE, haze: 0.35 })));
      scatter(rng.fork('roofs'), W, [50, 90], (x) => wrapped(W, x, 40, (xx) => house(ctx, rng.fork(x), xx, 226, rng.range(34, 50), rng.range(36, 50), { roof: rng.chance(0.6) ? 'tile' : 'thatch', haze: 0.2 })));
      bank(ctx, rng.fork('bank'), W, 230, mix(P.laterite, P.chandan, 0.35), mix(P.laterite, P.khondalite, 0.3));
      tank(ctx, rng.fork('tank'), W, 242, 18);
    },
    near: (ctx, rng, W) => {
      // Workers' lane: thatched huts, carts, people coming and going (all kept off the lane).
      scatter(rng.fork('huts'), W, [300, 520], (x, i) => wrapped(W, x, 60, (xx) => {
        house(ctx, rng.fork(x), xx, 130, 58, 56, { roof: 'thatch' });
        if (i % 2) broadTree(ctx, rng.fork(x + 1), xx + 70, 130, 90, 104, 0.05);
        else crowd(ctx, rng.fork(x + 2), xx + 40, xx + 90, 132, 1.2, { poses: ['walk', 'carry', 'stand'], density: 2 });
      }));
      wrapped(W, 1200, 60, (xx) => bullockCartBg(ctx, rng.fork('cart'), xx, 132, 1.25));
      wrapped(W, 1700, 30, (xx) => cow(ctx, xx, 132, 1.1, { grazing: true }));
    },
    fore: 'grass',
    sign: { date: 'Early 7th century CE', title: 'Parasurameswara' },
    landmarks: [
      { at: 0.28, plane: 'mid', w: 640, h: 300, y: 460, paint: paintParasurameswara },
      { at: 0.5, plane: 'mid', w: 500, h: 110, y: 462, paint: paintHaulers },
      { at: 0.72, plane: 'mid', w: 300, h: 130, y: 462, paint: scaled(1.25, paintLion) },
      { at: 0.9, plane: 'mid', w: 240, h: 110, y: 460, paint: paintCarvers },
    ],
  }),

  // 08 · 8th century CE · Vaital Deula — a temple roofed like a boat.
  r08: () => ({
    id: 'r08',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.5)], [0.5, P.skyCream], [1, mix(P.skyCream, P.marigold, 0.32)]], sun: { x: 300, y: 130, r: 32 }, clouds: 'cumulus', cloudTint: mix(P.marigold, P.skyCream, 0.6) },
    far: [{ kind: 'hills', a: mix(P.laterite, P.skyCream, 0.6), b: P.khondalite, height: [16, 50], trees: true, haze: 0.5 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.4), plainDetail: 'fields', path: mix(P.laterite, P.chandan, 0.25), verge: mix(P.tota, P.laterite, 0.3) },
    mid: (ctx, rng, W) => {
      // A row of old tamarinds, lime-washed houses with tiled roofs, a shrine or two.
      scatter(rng.fork('tam'), W, [90, 170], (x) => wrapped(W, x, 70, (xx) => tamarindTree(ctx, rng.fork(x), xx, 214, rng.range(90, 140), rng.range(100, 150), 0.3)));
      scatter(rng.fork('shrines'), W, [400, 700], (x) => wrapped(W, x, 30, (xx) => rekhaDeula(ctx, rng.fork(x), xx, 220, rng.range(70, 100), { stone: SANDSTONE, haze: 0.3 })));
      scatter(rng.fork('roofs'), W, [44, 80], (x) => wrapped(W, x, 40, (xx) => house(ctx, rng.fork(x), xx, 236, rng.range(36, 52), rng.range(38, 52), { roof: 'tile', haze: 0.15 })));
      bank(ctx, rng.fork('bank'), W, 240, mix(P.tota, P.haldi, 0.35), mix(P.laterite, P.chandan, 0.15));
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('t'), W, [360, 600], (x) => wrapped(W, x, 70, (xx) => tamarindTree(ctx, rng.fork(x), xx, 130, rng.range(110, 140), rng.range(110, 126), 0.05)));
      for (const x of [200, 760, 1300, 1840]) wrapped(W, x, 50, (xx) => crowd(ctx, rng.fork(x), xx - 30, xx + 30, 132, 1.25, { poses: ['walk', 'carry', 'stand'], density: 2.2 }));
      wrapped(W, 1050, 40, (xx) => { goat(ctx, xx, 132, 1.1, 1); goat(ctx, xx + 30, 132, 0.9, 1); });
    },
    fore: 'flowers',
    sign: { date: '8th century CE', title: 'Vaital Deula' },
    landmarks: [
      { at: 0.32, plane: 'mid', w: 680, h: 240, y: 460, paint: paintVaital },
      { at: 0.58, plane: 'mid', w: 320, h: 240, y: 460, paint: paintTamarindPole },
      { at: 0.82, plane: 'mid', w: 330, h: 140, y: 462, paint: scaled(1.15, paintBasketGoat) },
    ],
  }),

  // 09 · 8th–10th century CE · Ratnagiri — the hill of jewels.
  r09: () => ({
    id: 'r09',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.4)], [0.6, P.skyCream], [1, mix(P.skyCream, P.marigold, 0.2)]], sun: { x: 980, y: 104, r: 32 }, clouds: 'cumulus' },
    far: [
      { kind: 'hills', a: mix(mix(P.tota, P.khondalite, 0.4), P.skyCream, 0.55), b: P.neel, height: [40, 100], base: 166, trees: true, haze: 0.5 },
      { kind: 'hills', a: mix(P.tota, P.khondalite, 0.45), b: P.neel, height: [14, 40], trees: true, haze: 0.3 },
    ],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.3), plainDetail: 'grass', path: mix(P.laterite, P.chandan, 0.3), verge: mix(P.tota, P.laterite, 0.25) },
    mid: (ctx, rng, W) => {
      // The Keluo valley: trees, far ruins of brick, and the river at the foot.
      treeRow(ctx, rng.fork('trees'), W, 214, 0.3, 0.5);
      scatter(rng.fork('ruins'), W, [300, 520], (x) => wrapped(W, x, 40, (xx) => {
        const b = mix(BRICK, P.skyCream, 0.35);
        ctx.fillStyle = b;
        ctx.fillRect(xx - 30, 206, 60, 16);
        ctx.fillRect(xx - 30, 198, 14, 8);
        ctx.fillRect(xx + 6, 202, 10, 4);
        ctx.fillStyle = withAlpha(mix(b, P.ink, 0.3), 0.6);
        ctx.fillRect(xx - 30, 220, 60, 2);
      }));
      bank(ctx, rng.fork('bank'), W, 226, mix(P.tota, P.haldi, 0.3), mix(P.laterite, P.tota, 0.25));
      const water = mix(P.peacock, P.seafoam, 0.3);
      ctx.fillStyle = water;
      ctx.fillRect(0, 238, W, 22);
      for (let i = 0; i < 180; i++) { const x = rng.next() * W, l = rng.range(10, 30), y = 240 + rng.next() * 18; wrapped(W, x, l, (xx) => taperStroke(ctx, [{ x: xx - l / 2, y }, { x: xx + l / 2, y }], 1.1, P.limewhite, 0.4)); }
      scatter(rng.fork('egrets'), W, [300, 600], (x) => wrapped(W, x, 10, (xx) => egret(ctx, xx, 250, 0.8, 0.1)));
    },
    near: (ctx, rng, W) => {
      // Monks walking between the sites, trees, a cowherd. No stupas or carved stones down here.
      scatter(rng.fork('t'), W, [280, 480], (x, i) => wrapped(W, x, 60, (xx) => {
        if (i % 3 === 2) palmyraPalm(ctx, rng.fork(x), xx, 130, rng.range(100, 120), 0.05);
        else broadTree(ctx, rng.fork(x), xx, 130, rng.range(90, 120), rng.range(96, 118), 0.05);
      }));
      for (const x of [300, 1000, 1600]) wrapped(W, x, 50, (xx) => crowd(ctx, rng.fork(x), xx - 30, xx + 30, 132, 1.25, { cloths: [P.marigold, mix(P.marigold, P.sindoor, 0.4)], heads: ['none'], poses: ['walk'], facing: 1, density: 2.4 }));
      wrapped(W, 1350, 40, (xx) => { cow(ctx, xx, 132, 1.1, { colour: mix(P.chandan, P.limewhite, 0.4) }); person(ctx, xx + 34, 132, 1.1, { pose: 'walk', cloth: P.haldi, skin: 0.6 }); });
    },
    fore: 'grass',
    sign: { date: '8th–10th century CE', title: 'Ratnagiri' },
    landmarks: [
      { at: 0.24, plane: 'mid', w: 1000, h: 300, y: 460, paint: paintMonastery },
      { at: 0.47, plane: 'mid', w: 340, h: 210, y: 460, paint: paintBuddha },
      { at: 0.68, plane: 'mid', w: 320, h: 210, y: 460, paint: paintReaders },
      { at: 0.88, plane: 'mid', w: 300, h: 130, y: 462, paint: scaled(1.2, paintPeacock) },
    ],
  }),

  // 10 · c. 950–975 CE · Mukteswara — the gem of Kalinga architecture, in a mango grove.
  r10: () => ({
    id: 'r10',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.55)], [0.5, mix(P.skyCream, P.haldi, 0.12)], [1, mix(P.skyCream, P.marigold, 0.3)]], sun: { x: 1060, y: 100, r: 36 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.laterite, P.skyCream, 0.62), b: P.khondalite, height: [14, 44], trees: true, haze: 0.5 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.38), plainDetail: 'grass', path: mix(P.laterite, P.chandan, 0.22), verge: mix(P.tota, P.laterite, 0.25) },
    mid: (ctx, rng, W) => {
      // The mango grove, shrines peeping through, roofs of the old town.
      scatter(rng.fork('shrines'), W, [320, 600], (x) => wrapped(W, x, 30, (xx) => rekhaDeula(ctx, rng.fork(x), xx, 206, rng.range(80, 120), { stone: SANDSTONE, haze: 0.35 })));
      scatter(rng.fork('mango'), W, [70, 120], (x) => wrapped(W, x, 70, (xx) => mangoTree(ctx, rng.fork(x), xx, 222, rng.range(90, 130), rng.range(90, 120), 0.25)));
      scatter(rng.fork('roofs'), W, [120, 260], (x) => wrapped(W, x, 40, (xx) => house(ctx, rng.fork(x), xx, 238, rng.range(36, 50), rng.range(38, 50), { roof: 'tile', haze: 0.15 })));
      bank(ctx, rng.fork('bank'), W, 240, mix(P.tota, P.haldi, 0.38), mix(P.laterite, P.chandan, 0.2));
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('m'), W, [240, 400], (x) => wrapped(W, x, 70, (xx) => mangoTree(ctx, rng.fork(x), xx, 130, rng.range(110, 140), rng.range(112, 124), 0.05)));
      for (const x of [420, 1150, 1800]) wrapped(W, x, 50, (xx) => crowd(ctx, rng.fork(x), xx - 28, xx + 28, 132, 1.25, { poses: ['walk', 'stand', 'carry'], density: 2.2 }));
      wrapped(W, 820, 30, (xx) => cow(ctx, xx, 132, 1.1, { grazing: true }));
    },
    fore: 'flowers',
    sign: { date: 'c. 950–975 CE', title: 'Mukteswara' },
    landmarks: [
      { at: 0.32, plane: 'mid', w: 660, h: 280, y: 466, paint: paintMukteswara },
      { at: 0.56, plane: 'mid', w: 420, h: 250, y: 460, paint: paintMangoShake },
      { at: 0.8, plane: 'mid', w: 320, h: 230, y: 460, paint: paintParrots },
    ],
  }),
};
