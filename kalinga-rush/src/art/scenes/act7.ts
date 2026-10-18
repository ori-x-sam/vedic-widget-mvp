// Act VII · ଭବିଷ୍ୟତ · The Future (f1–f8) — Supplementary Reader, not in syllabus.
// Lead: neel; supports haldi + neonRani + neonCyan (the "radium sticker" glow of
// Indian trucks, used sparingly). f7 switches the neon off: classic palette only.
// The future is imagined the way a 1980s Indian science picture-book imagined
// 2100 — hopeful, rooted, and visibly grown out of the earlier lessons.
import { DERIVED, P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, dabField, glow, makeCanvas, paintedShape, polyPath, taperStroke, vGradient, wrapped, type Ctx, type Pt } from '../brush';
import { bank, scatter, type SceneDef } from '../engine';
import { cycloneShelter, house, jagannathTemple, konark, pidhaHall, rekhaDeula, stall, templeLine } from '../kit/buildings';
import { boitaPod, boitaShip, chariot, glassLeafTower, lampDrone, maglevGuideway, mangrove, robot, solarRaft, solarSailWheel, stiltShelter, turbine } from '../kit/craft';
import { chhati, crowd, flag, person } from '../kit/people';
import { cat, cow, goat, turtle } from '../kit/animals';
import { broadTree, coconutPalm, egret } from '../shared/nature';

// ---- local helpers -------------------------------------------------------------

/** Tint everything already painted in a region (night darkening, storm light). */
function tintAtop(ctx: Ctx, colour: string, a: number, x = 0, y = 0, w = ctx.canvas.width, h = ctx.canvas.height): void {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = withAlpha(colour, a);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function starField(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, n: number, big = 0.08): void {
  for (let i = 0; i < n; i++) {
    const sx = x + rng.next() * w, sy = y + rng.next() * h;
    const r = rng.range(0.5, 1.5);
    dab(ctx, sx, sy, r, r, 0, rng.chance(0.65) ? P.haldi : P.limewhite, rng.range(0.4, 0.95));
    if (rng.chance(big)) glow(ctx, sx, sy, 7, P.haldi, 0.35);
  }
}

/** A bright four-pointed star (constellation vertices). */
function twinkle(ctx: Ctx, x: number, y: number, r: number, colour: string = P.haldi): void {
  glow(ctx, x, y, r * 4, colour, 0.4);
  taperStroke(ctx, [{ x: x - r * 2.2, y }, { x: x + r * 2.2, y }], r * 0.7, P.limewhite, 0.9);
  taperStroke(ctx, [{ x, y: y - r * 2.2 }, { x, y: y + r * 2.2 }], r * 0.7, P.limewhite, 0.9);
  dab(ctx, x, y, r * 0.7, r * 0.7, 0, P.limewhite, 1);
}

interface TowerOpts {
  body: string;
  glass?: string;
  crown?: 'deula' | 'saucer' | 'spire' | 'dome' | 'leaf';
  accent?: string;
  haze?: number;
  hazeTo?: string;
  lit?: number;
  litColour?: string;
}

/** A retro-future tower: tapered shaft, glass ribbon, sky gardens, a crown. Base centre (x, y). */
function futureTower(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, o: TowerOpts): void {
  const H = (c: string) => (o.haze ? mix(c, o.hazeTo ?? P.skyCream, o.haze) : c);
  const body = H(o.body);
  const glass = H(o.glass ?? mix(P.neel, P.seafoam, 0.45));
  const tw = w * 0.78;
  const top = y - h;
  const shaft = () => {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - tw / 2, top + 6);
    ctx.quadraticCurveTo(x - tw / 2, top, x - tw / 2 + 6, top);
    ctx.lineTo(x + tw / 2 - 6, top);
    ctx.quadraticCurveTo(x + tw / 2, top, x + tw / 2, top + 6);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
  };
  paintedShape(ctx, rng, shaft, { x: x - w / 2, y: top, w, h }, { base: body, light: H(mix(o.body, P.limewhite, 0.45)), shade: H(mix(o.body, P.ink, 0.3)), lightFrom: 'right', dabs: 10 });
  clipTo(ctx, shaft, () => {
    // glass ribbon down the middle
    ctx.fillStyle = glass;
    ctx.fillRect(x - w * 0.14, top + 4, w * 0.28, h);
    for (let yy = top + 10; yy < y; yy += 9) {
      ctx.fillStyle = withAlpha(H(P.ink), 0.16);
      ctx.fillRect(x - w / 2, yy, w, 1.2);
      if (rng.chance(o.lit ?? 0.35)) {
        ctx.fillStyle = H(o.litColour ?? P.haldi);
        ctx.fillRect(x - w * 0.12 + (rng.chance(0.5) ? 0 : w * 0.13), yy + 2, w * 0.1, 4);
      }
      if (rng.chance((o.lit ?? 0.35) * 0.6)) {
        ctx.fillStyle = H(o.litColour ?? P.haldi);
        ctx.fillRect(x + (rng.chance(0.5) ? -1 : 1) * w * 0.32 - w * 0.05, yy + 2, w * 0.1, 4);
      }
    }
    // sky gardens: green balconies every few floors
    for (let yy = top + 30; yy < y - 20; yy += rng.range(34, 60)) {
      for (let k = 0; k < 5; k++) dab(ctx, x - w / 2 + rng.next() * w, yy, rng.range(2, 4), rng.range(1.6, 3), 0, H(rng.chance(0.6) ? P.tota : mix(P.tota, P.haldi, 0.4)), 0.95);
    }
  });
  const crown = o.crown ?? 'spire';
  if (crown === 'deula') {
    // a curvilinear crown with an amalaka: the temple tower's silhouette, remembered
    const ch = h * 0.24;
    const cp = () => {
      ctx.beginPath();
      ctx.moveTo(x - tw / 2, top + 2);
      ctx.bezierCurveTo(x - tw / 2, top - ch * 0.5, x - tw * 0.3, top - ch * 0.85, x - tw * 0.16, top - ch);
      ctx.lineTo(x + tw * 0.16, top - ch);
      ctx.bezierCurveTo(x + tw * 0.3, top - ch * 0.85, x + tw / 2, top - ch * 0.5, x + tw / 2, top + 2);
      ctx.closePath();
    };
    paintedShape(ctx, rng, cp, { x: x - tw / 2, y: top - ch, w: tw, h: ch }, { base: H(mix(o.body, P.limewhite, 0.25)), light: H(P.limewhite), shade: H(mix(o.body, P.ink, 0.25)), lightFrom: 'right', dabs: 6 });
    dab(ctx, x, top - ch - 2, tw * 0.22, 3, 0, H(mix(o.body, P.ink, 0.2)), 1);
    dab(ctx, x, top - ch - 6, 2.4, 3, 0, H(P.haldi), 1);
  } else if (crown === 'saucer') {
    taperStroke(ctx, [{ x, y: top }, { x, y: top - 12 }], 4, body, 1, [1, 1]);
    dab(ctx, x, top - 14, tw * 0.95, 5, 0, H(mix(o.body, P.limewhite, 0.3)), 1);
    dab(ctx, x, top - 18, tw * 0.4, 5, 0, H(mix(P.seafoam, P.neel, 0.3)), 1);
  } else if (crown === 'dome') {
    ctx.fillStyle = H(mix(P.seafoam, P.limewhite, 0.3));
    ctx.beginPath(); ctx.arc(x, top, tw / 2, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 7; k++) dab(ctx, x + rng.range(-tw * 0.32, tw * 0.32), top - rng.range(2, tw * 0.3), rng.range(2, 4), rng.range(2, 3.5), 0, H(P.tota), 0.9);
  } else if (crown === 'leaf') {
    ctx.fillStyle = H(mix(P.seafoam, P.limewhite, 0.4));
    ctx.beginPath();
    ctx.moveTo(x - tw / 2, top);
    ctx.quadraticCurveTo(x - tw * 0.5, top - h * 0.18, x, top - h * 0.26);
    ctx.quadraticCurveTo(x + tw * 0.5, top - h * 0.18, x + tw / 2, top);
    ctx.closePath();
    ctx.fill();
    taperStroke(ctx, [{ x, y: top }, { x, y: top - h * 0.24 }], 1.4, H(mix(P.neel, P.seafoam, 0.3)), 0.8, [1, 1]);
  } else {
    taperStroke(ctx, [{ x, y: top }, { x, y: top - h * 0.28 }], 2.2, H(mix(o.body, P.ink, 0.15)), 1, [1, 0.3]);
  }
  if (o.accent) {
    ctx.fillStyle = withAlpha(o.accent, 0.85);
    ctx.fillRect(x - tw / 2, top + 3, tw, 1.6);
    const ty = crown === 'spire' ? top - h * 0.28 : top - 6;
    glow(ctx, x, ty, 9, o.accent, 0.5);
    dab(ctx, x, ty, 1.6, 1.6, 0, o.accent, 1);
  }
}

/** A solar tree: a slender trunk holding panel-leaves. Base (x, y). */
function solarTree(ctx: Ctx, rng: Rng, x: number, y: number, s: number, edge: string = P.neonCyan, haze = 0, hazeTo: string = P.skyCream): void {
  const H = (c: string) => (haze ? mix(c, hazeTo, haze) : c);
  const trunk = H(mix(P.limewhite, P.neel, 0.35));
  taperStroke(ctx, [{ x, y }, { x: x + 2 * s, y: y - 40 * s }, { x, y: y - 76 * s }], 4 * s, trunk, 1, [1, 0.5]);
  const leaves: [number, number, number][] = [[-26, -70, -0.5], [24, -66, 0.45], [-18, -50, -0.7], [20, -46, 0.7], [0, -86, 0], [-32, -88, -0.25], [30, -86, 0.25]];
  for (const [lx, ly, a] of leaves) {
    taperStroke(ctx, [{ x, y: y + ly * s * 0.75 }, { x: x + lx * s, y: y + ly * s }], 1.6 * s, trunk, 1, [1, 0.6]);
    ctx.save();
    ctx.translate(x + lx * s, y + ly * s);
    ctx.rotate(a);
    ctx.fillStyle = H(mix(P.neel, P.ink, 0.15));
    ctx.beginPath(); ctx.ellipse(0, 0, 11 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = withAlpha(H(edge), 0.75);
    ctx.lineWidth = Math.max(0.7, 0.9 * s);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10 * s, 0); ctx.lineTo(10 * s, 0); ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 6; i++) dab(ctx, x + rng.range(-10, 10) * s, y - rng.range(0, 6) * s, rng.range(3, 6) * s, rng.range(2, 4) * s, 0, H(rng.chance(0.5) ? P.tota : mix(P.tota, P.neel, 0.3)), 0.9);
}

/** A diamond kite with a tail, its string running to (ax, ay). */
function kite(ctx: Ctx, x: number, y: number, s: number, c1: string, c2: string, ax?: number, ay?: number, tilt = 0.2): void {
  if (ax !== undefined && ay !== undefined) {
    ctx.strokeStyle = withAlpha(P.limewhite, 0.6);
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x, y + 4 * s); ctx.quadraticCurveTo((x + ax) / 2 + 10, (y + ay) / 2 + 20, ax, ay); ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = c1;
  ctx.beginPath(); ctx.moveTo(0, -11 * s); ctx.lineTo(8 * s, 0); ctx.lineTo(0, 12 * s); ctx.lineTo(-8 * s, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c2;
  ctx.beginPath(); ctx.moveTo(0, -11 * s); ctx.lineTo(0, 12 * s); ctx.lineTo(-8 * s, 0); ctx.closePath(); ctx.fill();
  dab(ctx, 0, 0, 2 * s, 2 * s, 0, P.limewhite, 0.9);
  taperStroke(ctx, curvePts(0, 12 * s, -6 * s, 22 * s, 3 * s, 32 * s, 6), 1.6 * s, c2, 0.9, [1, 0.3]);
  for (let i = 0; i < 3; i++) dab(ctx, (i % 2 ? 2 : -3) * s, 17 * s + i * 6 * s, 1.8 * s, 1.1 * s, 0.5, i % 2 ? c1 : P.limewhite, 1);
  ctx.restore();
}

/** A sagging string of marigolds between two points. */
function garland(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, r = 2.2): void {
  const n = Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / (r * 1.7)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
    dab(ctx, x, y, r, r, 0, i % 3 === 2 ? P.haldi : P.marigold, 1);
    if (i % 5 === 0) taperStroke(ctx, [{ x, y }, { x: x + 1, y: y + r * 3 }], r * 1.1, P.tota, 0.9, [1, 0.2]);
  }
}

/** A tiny oil lamp with its glow. */
function diya(ctx: Ctx, x: number, y: number, s: number): void {
  glow(ctx, x, y - 3 * s, 9 * s, P.marigold, 0.55);
  dab(ctx, x, y, 3 * s, 1.4 * s, 0, P.laterite, 1);
  dab(ctx, x, y - 2.4 * s, 0.9 * s, 1.8 * s, 0, P.haldi, 1);
}

/** Irrawaddy dolphin arching out of the water: round head, no beak, small fin. (x, y) = waterline. */
function dolphin(ctx: Ctx, x: number, y: number, s: number, facing: 1 | -1 = 1, colour: string = mix(mix(P.khondalite, P.neel, 0.3), P.limewhite, 0.3)): void {
  const f = facing;
  const back = curvePts(x - 26 * s * f, y + 2 * s, x, y - 26 * s, x + 24 * s * f, y - 2 * s, 12);
  taperStroke(ctx, back, 15 * s, colour, 1, [0.5, 0.95]);
  taperStroke(ctx, curvePts(x - 20 * s * f, y, x, y - 16 * s, x + 20 * s * f, y - 2 * s, 10), 6 * s, mix(colour, P.limewhite, 0.4), 0.7, [0.3, 0.6]);
  // rounded melon head
  dab(ctx, x + 22 * s * f, y - 5 * s, 9 * s, 7.5 * s, 0, colour, 1);
  dab(ctx, x + 25 * s * f, y - 7 * s, 1.2 * s, 1.2 * s, 0, P.ink, 1);
  taperStroke(ctx, [{ x: x + 24 * s * f, y: y - 1 * s }, { x: x + 30 * s * f, y: y - 2 * s }], 1 * s, mix(colour, P.ink, 0.4), 0.7);
  // small dorsal fin, set well back
  ctx.fillStyle = mix(colour, P.ink, 0.15);
  ctx.beginPath(); ctx.moveTo(x - 10 * s * f, y - 17 * s); ctx.lineTo(x - 14 * s * f, y - 24 * s); ctx.lineTo(x - 3 * s * f, y - 19 * s); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 6; i++) dab(ctx, x - 28 * s * f + (i % 3) * 4 * s, y + 1 * s - (i % 2) * 3 * s, 2.4 * s, 1.4 * s, 0, P.limewhite, 0.7);
}

/** A small electric boat: dugout-shaped hull, solar canopy, a lamp. (x, y) = waterline. */
function eBoat(ctx: Ctx, rng: Rng, x: number, y: number, s: number, o: { lamp?: boolean; cloth?: string; pose?: 'sit' | 'wave' | 'stand' | 'armsUp'; cat?: boolean; facing?: 1 | -1 } = {}): void {
  const f = o.facing ?? 1;
  const hull = () => {
    ctx.beginPath();
    ctx.moveTo(x - 36 * s * f, y - 10 * s);
    ctx.quadraticCurveTo(x - 30 * s * f, y + 3 * s, x - 18 * s * f, y + 3 * s);
    ctx.lineTo(x + 22 * s * f, y + 3 * s);
    ctx.quadraticCurveTo(x + 36 * s * f, y + 1 * s, x + 40 * s * f, y - 12 * s);
    ctx.lineTo(x - 36 * s * f, y - 10 * s);
    ctx.closePath();
  };
  const wood = mix(P.laterite, P.ink, 0.2);
  paintedShape(ctx, rng, hull, { x: x - 40 * s, y: y - 12 * s, w: 80 * s, h: 16 * s }, { base: wood, light: mix(P.laterite, P.chandan, 0.4), shade: mix(wood, P.ink, 0.4), dabs: 6 });
  ctx.fillStyle = P.limewhite;
  ctx.fillRect(x - 30 * s, y - 7 * s, 60 * s, 1.6 * s);
  ctx.fillStyle = withAlpha(P.neonCyan, 0.8);
  ctx.fillRect(x - 26 * s, y - 3 * s, 46 * s, 1 * s);
  // solar canopy on two poles
  for (const k of [-14, 14]) taperStroke(ctx, [{ x: x + k * s, y: y - 10 * s }, { x: x + k * s, y: y - 34 * s }], 1.4 * s, P.limewhite, 1, [1, 1]);
  ctx.fillStyle = mix(P.neel, P.ink, 0.2);
  ctx.beginPath(); ctx.moveTo(x - 22 * s, y - 34 * s); ctx.lineTo(x + 22 * s, y - 36 * s); ctx.lineTo(x + 20 * s, y - 31 * s); ctx.lineTo(x - 20 * s, y - 30 * s); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = withAlpha(P.neonCyan, 0.7);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  person(ctx, x - 4 * s * f, y - 8 * s, 0.75 * s, { pose: o.pose ?? 'sit', cloth: o.cloth ?? P.haldi, cloth2: P.sindoor, head: 'turban', facing: f, skin: rng.next() });
  if (o.cat) cat(ctx, x + 22 * s * f, y - 10 * s, 0.7 * s, P.marigold, f);
  if (o.lamp) {
    taperStroke(ctx, [{ x: x - 30 * s * f, y: y - 10 * s }, { x: x - 32 * s * f, y: y - 28 * s }], 1 * s, P.limewhite, 1, [1, 1]);
    glow(ctx, x - 32 * s * f, y - 26 * s, 18 * s, P.marigold, 0.6);
    dab(ctx, x - 32 * s * f, y - 26 * s, 2.4 * s, 3 * s, 0, P.haldi, 1);
  }
}

/** A spacewalker in a lime-white suit; a warm-brown face behind the visor. Feet at (x, y). */
function spacewalker(ctx: Ctx, x: number, y: number, s: number, rot = 0, armUp = true): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const suit = P.limewhite;
  const shade = mix(P.limewhite, P.neel, 0.3);
  dab(ctx, -6 * s, -22 * s, 5 * s, 9 * s, 0, shade, 1); // backpack
  taperStroke(ctx, [{ x: -2 * s, y: -12 * s }, { x: -4 * s, y: 0 }], 4.6 * s, suit, 1, [1, 0.9]);
  taperStroke(ctx, [{ x: 2 * s, y: -12 * s }, { x: 5 * s, y: -1 * s }], 4.6 * s, shade, 1, [1, 0.9]);
  dab(ctx, 0, -20 * s, 6.5 * s, 9 * s, 0, suit, 1);
  ctx.fillStyle = P.sindoor;
  ctx.fillRect(-5 * s, -18 * s, 10 * s, 1.6 * s);
  taperStroke(ctx, armUp ? [{ x: 3 * s, y: -25 * s }, { x: 10 * s, y: -33 * s }] : [{ x: 3 * s, y: -25 * s }, { x: 11 * s, y: -20 * s }], 3.6 * s, suit, 1, [1, 0.8]);
  taperStroke(ctx, [{ x: -3 * s, y: -25 * s }, { x: -9 * s, y: -17 * s }], 3.6 * s, shade, 1, [1, 0.8]);
  dab(ctx, 0, -34 * s, 7 * s, 7 * s, 0, suit, 1);
  dab(ctx, 1.5 * s, -34 * s, 5 * s, 4.6 * s, 0, mix(P.neel, P.peacock, 0.3), 1);
  dab(ctx, 2 * s, -33.5 * s, 3 * s, 3 * s, 0, mix(P.chandan, P.laterite, 0.45), 0.9);
  dab(ctx, 3.5 * s, -36 * s, 1.4 * s, 1 * s, -0.4, P.limewhite, 0.8);
  ctx.restore();
}

/** A boita starship climbing at an angle, with a lamp-flame plume. (x, y) = hull centre. */
function launchingBoita(ctx: Ctx, rng: Rng, x: number, y: number, s: number, angle: number, plume = 1): void {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  // plume trails back along the direction of travel (ship heads right and up)
  const tail = (k: number): Pt => ({ x: x - ca * k * s, y: y - sa * k * s + 4 * s });
  for (let i = 0; i < 26; i++) {
    const k = 50 + i * 10 * plume;
    const p = tail(k);
    dab(ctx, p.x + rng.range(-4, 4) * s, p.y + rng.range(-4, 4) * s, (8 + i * 1.3) * s, (6 + i) * s, 0, mix(P.limewhite, P.neel, 0.2 + i * 0.02), 0.08 + (1 - i / 26) * 0.12);
  }
  const p0 = tail(50), p1 = tail(50 + 120 * plume);
  taperStroke(ctx, [p1, p0], 12 * s, P.marigold, 0.55, [0.05, 1]);
  taperStroke(ctx, [tail(50 + 70 * plume), p0], 6 * s, P.haldi, 0.95, [0.05, 1]);
  glow(ctx, p0.x, p0.y, 34 * s, P.haldi, 0.6);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  boitaShip(ctx, rng, 0, 0, s, { space: true, lamps: true, sail: mix(P.limewhite, P.seafoam, 0.25), sail2: P.neonRani });
  ctx.restore();
}

/** A Pattachitra-style constellation: soft line drawing joined at bright stars. */
function starFigure(ctx: Ctx, strokes: Pt[][], stars: Pt[], line: string = P.haldi, width = 1.6): void {
  for (const st of strokes) taperStroke(ctx, st, width * 2.2, line, 0.16, [1, 1]);
  for (const st of strokes) taperStroke(ctx, st, width, line, 0.7, [0.6, 0.6]);
  for (const p of stars) twinkle(ctx, p.x, p.y, 2.6);
}

/** A broom-wielding helper robot in the classic palette only (f7: no neon). */
function robotClassic(ctx: Ctx, x: number, y: number, s: number, facing: 1 | -1 = 1): void {
  const f = facing;
  dab(ctx, x, y - 4 * s, 7 * s, 4 * s, 0, P.khondalite, 1);
  dab(ctx, x - 4 * s, y - 1 * s, 2.4 * s, 2.4 * s, 0, mix(P.khondalite, P.ink, 0.4), 1);
  dab(ctx, x + 4 * s, y - 1 * s, 2.4 * s, 2.4 * s, 0, mix(P.khondalite, P.ink, 0.4), 1);
  ctx.fillStyle = P.limewhite;
  ctx.fillRect(x - 6 * s, y - 20 * s, 12 * s, 14 * s);
  ctx.fillStyle = P.sindoor;
  ctx.fillRect(x - 6 * s, y - 14 * s, 12 * s, 2 * s);
  dab(ctx, x, y - 25 * s, 6 * s, 5 * s, 0, P.limewhite, 1);
  dab(ctx, x + 2 * s * f, y - 25 * s, 1.3 * s, 1.3 * s, 0, P.peacock, 1);
  dab(ctx, x - 1.5 * s * f, y - 25 * s, 1.3 * s, 1.3 * s, 0, P.peacock, 1);
  taperStroke(ctx, [{ x, y: y - 30 * s }, { x, y: y - 34 * s }], 0.8 * s, P.khondalite, 1, [1, 1]);
  dab(ctx, x, y - 34.5 * s, 1.2 * s, 1.2 * s, 0, P.haldi, 1);
  // a traditional broom: bamboo handle and a fan of grass bristles
  const hand = { x: x + 6 * s * f, y: y - 15 * s };
  const end = { x: x + 15 * s * f, y: y - 1 * s };
  taperStroke(ctx, [hand, end], 1.3 * s, mix(P.laterite, P.chandan, 0.4), 1, [1, 1]);
  for (let i = -2; i <= 2; i++) taperStroke(ctx, [end, { x: end.x + (4 + i * 1.6) * s * f, y: y + 0.5 * s }], 1 * s, mix(P.haldi, P.chandan, 0.4), 1, [1, 0.3]);
}

/** Draw '100' as marigold flowers inside a text mask (the centenary hillside). */
function marigold100(ctx: Ctx, rng: Rng, cx: number, by: number, size: number): void {
  const [tc, t] = makeCanvas(size * 2.1, size * 1.05);
  t.fillStyle = P.ink;
  t.font = `bold ${Math.round(size)}px Georgia, serif`;
  t.textAlign = 'center';
  t.textBaseline = 'alphabetic';
  t.fillText('100', tc.width / 2, size * 0.92);
  const data = t.getImageData(0, 0, tc.width, tc.height).data;
  const step = Math.max(3, Math.round(size / 26));
  for (let yy = 0; yy < tc.height; yy += step) for (let xx = 0; xx < tc.width; xx += step) {
    if (data[(yy * tc.width + xx) * 4 + 3] < 120) continue;
    const px = cx - tc.width / 2 + xx + rng.range(-0.8, 0.8);
    const py = by - tc.height + yy + rng.range(-0.8, 0.8);
    dab(ctx, px, py, step * 0.62, step * 0.62, 0, rng.chance(0.25) ? P.haldi : P.marigold, 1);
    dab(ctx, px + 0.6, py - 0.6, step * 0.22, step * 0.22, 0, mix(P.haldi, P.limewhite, 0.4), 0.8);
  }
}

/** Pattachitra-style border on a frame (sindoor band, haldi dots, ink lines). */
function pattaBorder(ctx: Ctx, x: number, y: number, w: number, h: number, b: number, upTo = 1): void {
  ctx.fillStyle = P.sindoor;
  const per = 2 * (w + h);
  const lim = per * upTo;
  // walk the border clockwise from the top-left and stop at `upTo`
  const segs: [number, number, number, number][] = [[x, y, w, b], [x + w - b, y, b, h], [x, y + h - b, w, b], [x, y, b, h]];
  let done = 0;
  for (const [sx, sy, sw, sh] of segs) {
    const len = Math.max(sw, sh);
    const take = Math.max(0, Math.min(len, lim - done));
    if (take <= 0) break;
    if (sw > sh) ctx.fillRect(sx, sy, take, sh);
    else ctx.fillRect(sx, sy, sw, take);
    const n = Math.floor(take / (b * 1.2));
    for (let i = 0; i < n; i++) {
      const px = sw > sh ? sx + (i + 0.5) * b * 1.2 : sx + b / 2;
      const py = sw > sh ? sy + b / 2 : sy + (i + 0.5) * b * 1.2;
      dab(ctx, px, py, b * 0.3, b * 0.3, 0, P.haldi, 1);
      dab(ctx, px, py, b * 0.1, b * 0.1, 0, P.ink, 1);
    }
    done += len;
  }
}

/** A storm cloud bank with a radium-cyan rim light. (cx, cy) = centre. */
function stormCloud(ctx: Ctx, rng: Rng, cx: number, cy: number, w: number, h: number, storm: string): void {
  const W2 = Math.ceil(w + 60), H2 = Math.ceil(h * 1.6 + 60);
  const [oc, o] = makeCanvas(W2, H2);
  const lx = W2 / 2, ly = H2 / 2 + h * 0.2;
  const body = mix(storm, P.neel, 0.45);
  const puffs: { x: number; y: number; r: number }[] = [];
  const n = Math.max(6, Math.round(w / (h * 0.42)));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const hump = Math.sin(t * Math.PI);
    const r = h * (0.28 + 0.36 * hump) * rng.range(0.85, 1.15);
    puffs.push({ x: lx - w / 2 + r * 0.8 + t * (w - r * 1.6), y: ly - hump * h * 0.35 + rng.range(-5, 5), r });
  }
  o.fillStyle = body;
  for (const p of puffs) { o.beginPath(); o.arc(p.x, p.y, p.r, 0, Math.PI * 2); o.fill(); }
  o.fillRect(lx - w / 2 + h * 0.3, ly - h * 0.1, w - h * 0.6, h * 0.36);
  o.globalCompositeOperation = 'source-atop';
  for (const p of puffs) glow(o, p.x + p.r * 0.2, p.y - p.r * 0.45, p.r * 0.75, mix(storm, P.limewhite, 0.3), 0.45);
  vGradient(o, 0, ly - h * 0.1, W2, h * 0.5, [[0, P.ink, 0], [1, mix(P.neel, P.ink, 0.4), 0.55]]);
  dabField(o, rng, 0, 0, W2, H2, { n: Math.round(w * 0.8), r: [3, 9], colours: [mix(storm, P.limewhite, 0.2), mix(P.neel, P.ink, 0.3), body], alpha: [0.08, 0.2] });
  o.globalCompositeOperation = 'source-over';
  // the rim: the silhouette, recoloured cyan, smeared outward
  const [rc, r2] = makeCanvas(W2, H2);
  r2.drawImage(oc, 0, 0);
  r2.globalCompositeOperation = 'source-in';
  r2.fillStyle = P.neonCyan;
  r2.fillRect(0, 0, W2, H2);
  const ox = cx - lx, oy = cy - ly;
  ctx.save();
  for (const [rad, a] of [[12, 0.06], [7, 0.12], [3.5, 0.22]] as const) {
    ctx.globalAlpha = a;
    for (let k = 0; k < 10; k++) { const ang = (k / 10) * Math.PI * 2; ctx.drawImage(rc, ox + Math.cos(ang) * rad, oy + Math.sin(ang) * rad - rad * 0.4); }
  }
  ctx.restore();
  ctx.drawImage(oc, ox, oy);
}

// ---- shared skies ------------------------------------------------------------------
const NIGHT_INK = mix(P.neel, P.ink, 0.45);

// ---- scenes ------------------------------------------------------------------------
export const SCENES: Record<string, () => SceneDef> = {
  // f1 · 1 Apr 2036 · Odisha turns one hundred — the Boita Line across the tri-city.
  f1: () => {
    const dusk = mix(P.rani, P.skyCream, 0.55);
    return {
      id: 'f1',
      sky: {
        stops: [[0, mix(P.neel, P.ink, 0.12)], [0.38, mix(P.neel, P.rani, 0.32)], [0.7, mix(P.marigold, P.rani, 0.3)], [1, mix(P.haldi, P.skyCream, 0.45)]],
        sun: { x: 1000, y: 360, r: 42, colour: P.marigold },
        stars: 50,
        halftone: P.neel,
        clouds: 'streak',
        cloudTint: mix(P.marigold, P.rani, 0.35),
      },
      far: [{ kind: 'hills', a: mix(P.neel, P.rani, 0.3), b: P.neel, height: [18, 60], trees: true, haze: 0.25 }],
      ground: { kind: 'land', plain: mix(P.tota, P.neel, 0.38), plainDetail: 'grass', path: mix(P.limewhite, P.neel, 0.38), verge: mix(P.tota, P.neel, 0.45) },
      mid: (ctx, rng, W) => {
        // The tri-city skyline: new towers behind, the temple city's spires in front,
        // the Boita Line's guideway running low across it all.
        const bodies = [P.limewhite, mix(P.neel, P.limewhite, 0.45), mix(P.haldi, P.limewhite, 0.45), mix(P.neel, P.seafoam, 0.4)];
        const crowns: TowerOpts['crown'][] = ['deula', 'saucer', 'spire', 'dome', 'leaf'];
        let prev: { x: number; h: number } | null = null;
        scatter(rng.fork('towers'), W, [90, 170], (x, i) => {
          const w = rng.range(26, 46), h = rng.range(110, 200);
          const o: TowerOpts = { body: rng.pick(bodies), crown: rng.pick(crowns), haze: 0.32, hazeTo: dusk, lit: 0.45, accent: i % 3 === 0 ? (i % 2 ? P.neonRani : P.neonCyan) : undefined };
          wrapped(W, x, w, (xx) => futureTower(ctx, rng.fork(x), xx, 232, w, h, o));
          if (prev && x - prev.x < 190 && rng.chance(0.6)) {
            const by = 232 - Math.min(h, prev.h) * 0.62;
            const px = prev.x;
            wrapped(W, (px + x) / 2, (x - px) / 2, (xx) => {
              const dx = xx - (px + x) / 2;
              taperStroke(ctx, [{ x: px + dx, y: by }, { x: x + dx, y: by }], 7, mix(mix(P.limewhite, P.neel, 0.3), dusk, 0.3), 1, [1, 1]);
              for (let k = px + dx + 8; k < x + dx - 6; k += 7) dab(ctx, k, by, 1.6, 1.4, 0, P.haldi, 0.9);
            });
          }
          prev = { x, h };
        });
        scatter(rng.fork('temples'), W, [260, 420], (x) => {
          const h = rng.range(84, 128);
          wrapped(W, x, h * 0.3, (xx) => rekhaDeula(ctx, rng.fork(x), xx, 238, h, { stone: P.laterite, haze: 0.18, flagColour: P.sindoor }));
        }, 60);
        // the guideway with its lit rail, and boita-shaped pods gliding on it
        maglevGuideway(ctx, 0, W, 222, 1, 0.1);
        for (const px of [300, 1180, 1760]) wrapped(W, px, 50, (xx) => boitaPod(ctx, xx, 211, 0.62, 0.05));
        scatter(rng.fork('solar'), W, [150, 260], (x) => wrapped(W, x, 30, (xx) => solarTree(ctx, rng.fork(x), xx, 248, 0.62, P.neonCyan, 0.15, dusk)));
        bank(ctx, rng.fork('bank'), W, 244, mix(P.tota, P.neel, 0.3), mix(P.tota, P.neel, 0.45));
        for (let x = 12; x < W; x += 26) diya(ctx, x, 247, 0.8);
      },
      near: (ctx, rng, W) => {
        // Centenary evening: lamps, kites, sweet stalls and garlands strung between poles.
        scatter(rng.fork('fest'), W, [220, 330], (x, i) => wrapped(W, x, 110, (xx) => {
          const r = rng.fork(x);
          const kind = i % 4;
          if (kind === 0) {
            for (const k of [-60, 60]) taperStroke(ctx, [{ x: xx + k, y: 134 }, { x: xx + k, y: 66 }], 2.2, mix(P.laterite, P.ink, 0.3), 1, [1, 1]);
            garland(ctx, xx - 60, 70, xx + 60, 70, 16, 2.2);
            crowd(ctx, r, xx - 52, xx + 52, 133, 1.15, { poses: ['lamp', 'lamp', 'stand', 'wave'], density: 1.6 });
          } else if (kind === 1) {
            for (let k = 0; k < 3; k++) {
              const kx = xx - 40 + k * 40;
              person(ctx, kx, 133, 0.95, { pose: 'armsUp', cloth: r.pick([P.haldi, P.rani, P.peacock]), head: k === 1 ? 'bun' : 'none', skin: r.next(), facing: 1 });
              kite(ctx, kx + r.range(30, 70), r.range(12, 36), 1, r.pick([P.sindoor, P.neonRani, P.haldi]), r.pick([P.neel, P.marigold, P.tota]), kx + 4, 104, r.range(-0.3, 0.3));
            }
          } else if (kind === 2) {
            stall(ctx, xx, 132, 76, 48, [P.sindoor, P.haldi]);
            crowd(ctx, r, xx - 46, xx + 46, 134, 1.1, { density: 2.2 });
            for (let k = 0; k < 5; k++) diya(ctx, xx - 30 + k * 15, 92, 0.9);
          } else {
            solarTree(ctx, r, xx, 134, 1.15, P.neonCyan);
            person(ctx, xx + 34, 133, 1.1, { pose: 'walk', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: r.next() });
            person(ctx, xx + 48, 133, 0.8, { pose: 'wave', cloth: P.marigold, skin: r.next() });
          }
        }));
      },
      fore: 'flowers',
      sign: { date: '1 Apr 2036', title: 'Boita Line' },
      landmarks: [
        {
          // Lingaraja's line of towers, lamp-lit for the centenary.
          at: 0.16, plane: 'mid', w: 520, h: 280, y: 452,
          paint: (ctx, rng, w, h) => {
            glow(ctx, w / 2, h - 80, 260, P.marigold, 0.25);
            templeLine(ctx, rng, w / 2 - 20, h - 8, 0.95, { stone: P.laterite, haze: 0.08 });
            ctx.fillStyle = mix(P.laterite, P.khondalite, 0.3);
            ctx.fillRect(20, h - 22, w - 40, 14);
            for (let x = 28; x < w - 24; x += 13) diya(ctx, x, h - 22, 1);
          },
        },
        {
          // A hillside with '100' laid out in marigolds — and a goat quietly eating a zero.
          at: 0.36, plane: 'mid', w: 520, h: 270, y: 452,
          paint: (ctx, rng, w, h) => {
            const hill = () => { ctx.beginPath(); ctx.moveTo(0, h); ctx.bezierCurveTo(w * 0.18, h - 150, w * 0.72, h - 170, w, h - 20); ctx.lineTo(w, h); ctx.closePath(); };
            paintedShape(ctx, rng, hill, { x: 0, y: h - 170, w, h: 170 }, { base: mix(P.tota, P.neel, 0.3), light: mix(P.tota, P.haldi, 0.35), shade: mix(P.tota, P.neel, 0.55), lightFrom: 'right', dabs: 160 });
            ctx.save();
            ctx.translate(w / 2, h - 40);
            ctx.rotate(-0.03);
            marigold100(ctx, rng, 0, 0, 104);
            ctx.restore();
            goat(ctx, w / 2 + 118, h - 46, 1.4, -1, 0, P.marigold);
            for (const [kx, ky, c1, c2] of [[w * 0.2, 40, P.sindoor, P.haldi], [w * 0.42, 22, P.neonRani, P.neel], [w * 0.78, 52, P.haldi, P.sindoor]] as const) kite(ctx, kx, ky, 1.2, c1, c2, kx - 40, h - 100, 0.2);
            person(ctx, w * 0.15, h - 70, 1, { pose: 'armsUp', cloth: P.haldi, skin: 0.6 });
            person(ctx, w * 0.34, h - 116, 0.9, { pose: 'armsUp', cloth: P.rani, head: 'bun', skin: 0.3 });
            person(ctx, w * 0.86, h - 50, 0.95, { pose: 'point', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', facing: -1, skin: 0.7 });
          },
        },
        {
          // Cuttack: the Boita Line crosses the Mahanadi on a bridge of silver filigree (tarakasi).
          at: 0.56, plane: 'mid', w: 760, h: 200, y: 458,
          paint: (ctx, rng, w, h) => {
            vGradient(ctx, 0, h - 34, w, 34, [[0, mix(P.peacock, P.neel, 0.3), 0], [0.3, mix(P.peacock, P.neel, 0.3), 1], [1, mix(P.neel, P.ink, 0.2), 1]]);
            for (let i = 0; i < 60; i++) { const x = rng.next() * w, y = h - 24 + rng.next() * 22; taperStroke(ctx, [{ x: x - 9, y }, { x: x + 9, y }], 1.2, rng.chance(0.5) ? P.haldi : P.limewhite, 0.5); }
            const deck = h - 112;
            const silver = mix(P.limewhite, P.neel, 0.18);
            for (let k = 0; k < 3; k++) {
              const ax = 60 + k * 240, aw = 220;
              ctx.strokeStyle = silver;
              ctx.lineWidth = 4;
              ctx.beginPath(); ctx.moveTo(ax, h - 26); ctx.quadraticCurveTo(ax + aw / 2, deck - 40, ax + aw, h - 26); ctx.stroke();
              // filigree curls hanging from the arch
              for (let t = 0.08; t < 0.95; t += 0.07) {
                const x = ax + aw * t;
                const yArch = (1 - t) * (1 - t) * (h - 26) + 2 * (1 - t) * t * (deck - 40) + t * t * (h - 26);
                ctx.lineWidth = 1;
                ctx.strokeStyle = withAlpha(silver, 0.85);
                ctx.beginPath(); ctx.moveTo(x, deck); ctx.lineTo(x, yArch); ctx.stroke();
                ctx.beginPath(); ctx.arc(x + 4, (deck + yArch) / 2, 4, 0, Math.PI * 1.6); ctx.stroke();
              }
              taperStroke(ctx, [{ x: ax + aw, y: h - 26 }, { x: ax + aw, y: h }], 9, silver, 1, [1, 1]);
            }
            maglevGuideway(ctx, 20, w - 20, deck, 1.2);
            boitaPod(ctx, w * 0.62, deck - 13, 0.95);
            boitaPod(ctx, w * 0.62 - 120, deck - 13, 0.95);
            for (let i = 0; i < 10; i++) person(ctx, 40 + i * 66, deck - 14, 0.7, { pose: i % 3 ? 'walk' : 'wave', cloth: rng.pick([P.haldi, P.rani, P.limewhite, P.peacock]), skin: rng.next() });
          },
        },
        {
          // Far along the coast, the tri-city's other ends: Puri's temple and Paradip's cranes.
          at: 0.74, plane: 'far', w: 680, h: 230, y: 452,
          paint: (ctx, rng, w, h) => {
            vGradient(ctx, 0, h - 30, w, 30, [[0, mix(P.peacock, dusk, 0.4), 0], [0.4, mix(P.peacock, dusk, 0.4), 1], [1, mix(P.peacock, P.neel, 0.3), 1]]);
            jagannathTemple(ctx, rng, 180, h - 12, 0.62, 0.35);
            for (let k = 0; k < 4; k++) {
              const cx = 430 + k * 60;
              const c = mix(mix(P.sindoor, P.haldi, k % 2 ? 0.6 : 0.2), dusk, 0.35);
              taperStroke(ctx, [{ x: cx, y: h - 12 }, { x: cx, y: h - 120 }], 4, c, 1, [1, 1]);
              taperStroke(ctx, [{ x: cx - 30, y: h - 118 }, { x: cx + 50, y: h - 112 }], 3, c, 1, [1, 1]);
              dab(ctx, cx + 50, h - 108, 1.6, 1.6, 0, P.neonCyan, 1);
            }
            futureTower(ctx, rng, 330, h - 12, 26, 150, { body: P.limewhite, crown: 'deula', haze: 0.4, hazeTo: dusk });
          },
        },
        {
          // A grandmother born the year Odisha was born lights the hundredth lamp.
          at: 0.88, plane: 'near', w: 300, h: 130, y: 570,
          paint: (ctx, rng, w, h) => {
            const bx = w / 2;
            glow(ctx, bx, h - 50, 90, P.marigold, 0.35);
            // a brass lamp-pillar with tiers of lamps
            ctx.fillStyle = mix(P.haldi, P.laterite, 0.35);
            ctx.fillRect(bx - 3, h - 92, 6, 90);
            for (let t = 0; t < 4; t++) {
              const ty = h - 24 - t * 20, tw = 34 - t * 7;
              dab(ctx, bx, ty, tw, 3, 0, mix(P.haldi, P.laterite, 0.3), 1);
              for (let k = -2; k <= 2; k++) diya(ctx, bx + k * tw * 0.42, ty - 1, 0.9);
            }
            person(ctx, bx - 30, h - 2, 1.5, { pose: 'lamp', cloth: P.limewhite, cloth2: P.sindoor, sari: true, head: 'veil', facing: 1, skin: 0.7 });
            for (const [k, c] of [[50, P.haldi], [70, P.rani], [90, P.peacock]] as const) person(ctx, bx + k, h - 2, 1.05, { pose: 'armsUp', cloth: c, skin: rng.next(), facing: -1 });
            person(ctx, bx - 70, h - 2, 1.4, { pose: 'wave', cloth: P.neel, cloth2: P.haldi, trousers: true, skin: 0.4 });
          },
        },
      ],
    };
  },

  // f2 · 2047 · Chilika restored and humming — a lagoon at night.
  f2: () => ({
    id: 'f2',
    sky: {
      stops: [[0, NIGHT_INK], [0.5, mix(P.neel, P.ink, 0.12)], [0.85, mix(P.neel, P.peacock, 0.35)], [1, mix(P.peacock, P.seafoam, 0.25)]],
      moon: { x: 960, y: 110, r: 32 },
      stars: 170,
      halftone: mix(P.neel, P.limewhite, 0.3),
      clouds: 'streak',
      cloudTint: mix(P.limewhite, P.neel, 0.5),
    },
    far: [{ kind: 'hills', a: mix(P.neel, P.peacock, 0.22), b: NIGHT_INK, height: [20, 72], trees: true, haze: 0.08 }],
    ground: { kind: 'water', water: { sky: mix(P.neel, P.peacock, 0.45), light: mix(P.neel, P.peacock, 0.32), mid: mix(P.neel, P.ink, 0.08), deep: mix(P.neel, P.ink, 0.35) } },
    mid: (ctx, rng, W) => {
      // Low islands of mangrove and palm, a fishing village with lit windows, solar rafts on the water.
      bank(ctx, rng.fork('bank'), W, 238, mix(P.chandan, P.neel, 0.35), mix(P.tota, P.neel, 0.55), mix(P.neel, P.ink, 0.2));
      scatter(rng.fork('palms'), W, [70, 160], (x) => {
        const h = rng.range(90, 140);
        wrapped(W, x, h * 0.5, (xx) => coconutPalm(ctx, rng.fork(x), xx, 240, h, rng.range(-0.15, 0.15), 0));
      });
      scatter(rng.fork('houses'), W, [120, 260], (x) => wrapped(W, x, 30, (xx) => house(ctx, rng.fork(x), xx, 242, rng.range(30, 44), rng.range(30, 42), { roof: rng.chance(0.5) ? 'thatch' : 'tile' })));
      scatter(rng.fork('mangrove'), W, [36, 70], (x) => wrapped(W, x, 30, (xx) => mangrove(ctx, rng.fork(x), xx, 248, rng.range(0.7, 1))));
      tintAtop(ctx, NIGHT_INK, 0.5);
      // lit windows and lamps come after the night tint
      scatter(rng.fork('lights'), W, [40, 110], (x) => wrapped(W, x, 12, (xx) => { glow(ctx, xx, 226, 10, P.haldi, 0.55); dab(ctx, xx, 226, 2.4, 2, 0, P.haldi, 1); }));
      scatter(rng.fork('rafts'), W, [260, 460], (x) => wrapped(W, x, 60, (xx) => { solarRaft(ctx, xx, 256, 0.9); solarRaft(ctx, xx + 90, 257, 0.9); }));
      scatter(rng.fork('drones'), W, [300, 500], (x) => wrapped(W, x, 20, (xx) => lampDrone(ctx, xx, rng.range(150, 200), 0.8)));
    },
    near: (ctx, rng, W) => {
      // Electric boats with lamps, dolphins rolling between them.
      scatter(rng.fork('boats'), W, [380, 560], (x, i) => wrapped(W, x, 60, (xx) => {
        const r = rng.fork(x);
        if (i % 2) eBoat(ctx, r, xx, 126, 1.1, { lamp: true, cloth: r.pick([P.haldi, P.limewhite, P.rani]), pose: 'sit', facing: r.chance(0.5) ? 1 : -1 });
        else { dolphin(ctx, xx, 128, 0.9, r.chance(0.5) ? 1 : -1); solarRaft(ctx, xx + 110, 130, 1.1); }
      }));
    },
    fore: 'none',
    sign: { date: '2047', title: 'Chilika' },
    landmarks: [
      {
        // Lantern-drones lead olive ridley hatchlings down the moonlit beach to the sea.
        at: 0.2, plane: 'mid', w: 620, h: 170, y: 458,
        paint: (ctx, rng, w, h) => {
          const sand = () => { ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h - 30); ctx.bezierCurveTo(w * 0.3, h - 52, w * 0.6, h - 34, w, h - 12); ctx.lineTo(w, h); ctx.closePath(); };
          paintedShape(ctx, rng, sand, { x: 0, y: h - 52, w, h: 52 }, { base: mix(P.chandan, P.neel, 0.35), light: mix(P.limewhite, P.neel, 0.2), shade: mix(P.chandan, P.neel, 0.6), lightFrom: 'top', dabs: 120 });
          taperStroke(ctx, curvePts(0, h - 6, w * 0.5, h - 16, w, h - 4, 12), 3, P.limewhite, 0.55);
          for (let i = 0; i < 26; i++) {
            const t = i / 26;
            const x = 60 + t * (w - 120) + rng.range(-10, 10);
            const y = h - 34 + t * 16 + rng.range(-6, 6);
            glow(ctx, x, y - 3, 9, P.haldi, 0.35);
            turtle(ctx, x, y, 1.7, true);
          }
          for (let i = 0; i < 7; i++) {
            const x = 80 + i * ((w - 140) / 6);
            const y = h - 92 + Math.sin(i * 1.3) * 10;
            glow(ctx, x, y + 26, 30, P.marigold, 0.22);
            lampDrone(ctx, x, y, 1.4);
          }
          person(ctx, 40, h - 30, 1.1, { pose: 'lamp', cloth: P.haldi, head: 'cap', skin: 0.6, facing: 1 });
          person(ctx, 22, h - 30, 0.8, { pose: 'point', cloth: P.rani, head: 'bun', skin: 0.3, facing: 1 });
        },
      },
      {
        // A pod of Irrawaddy dolphins; a girl in a boat claps for them.
        at: 0.46, plane: 'near', w: 400, h: 110, y: 566,
        paint: (ctx, rng, _w, h) => {
          dolphin(ctx, 90, h - 10, 1.15, 1);
          dolphin(ctx, 170, h - 6, 0.9, 1);
          dolphin(ctx, 230, h - 12, 1.05, -1);
          glow(ctx, 230, h - 70, 16, P.limewhite, 0.4);
          for (let i = 0; i < 9; i++) dab(ctx, 228 + rng.range(-8, 8), h - 40 - i * 4, 2, 2, 0, P.limewhite, 0.5);
          eBoat(ctx, rng, 330, h - 6, 1.1, { pose: 'armsUp', cloth: P.rani, lamp: true, facing: -1 });
        },
      },
      {
        // Kalijai's island shrine, lamps along its steps, the lagoon calm around it.
        at: 0.66, plane: 'mid', w: 320, h: 190, y: 458,
        paint: (ctx, rng, w, h) => {
          const isle = () => { ctx.beginPath(); ctx.moveTo(10, h); ctx.bezierCurveTo(60, h - 60, w - 60, h - 64, w - 10, h); ctx.closePath(); };
          paintedShape(ctx, rng, isle, { x: 10, y: h - 64, w: w - 20, h: 64 }, { base: mix(P.khondalite, P.neel, 0.45), light: mix(P.khondalite, P.limewhite, 0.2), shade: mix(P.neel, P.ink, 0.4), dabs: 60 });
          broadTree(ctx, rng, 70, h - 38, 80, 70, 0);
          broadTree(ctx, rng, w - 70, h - 34, 70, 64, 0);
          tintAtop(ctx, NIGHT_INK, 0.45);
          pidhaHall(ctx, rng, w / 2 - 30, h - 44, 44, 58, { stone: mix(P.limewhite, P.neel, 0.25) });
          rekhaDeula(ctx, rng, w / 2 + 16, h - 44, 96, { stone: mix(P.limewhite, P.neel, 0.25), flagColour: P.sindoor });
          for (let i = 0; i < 9; i++) diya(ctx, 70 + i * 22, h - 34 + Math.abs(i - 4) * 2, 1);
          glow(ctx, w / 2, h - 80, 110, P.marigold, 0.16);
        },
      },
      {
        // An egret has claimed a solar raft as its own office.
        at: 0.84, plane: 'mid', w: 300, h: 110, y: 460,
        paint: (ctx, _rng, w, h) => {
          for (let k = 0; k < 3; k++) solarRaft(ctx, 60 + k * 92, h - 6, 1.1);
          egret(ctx, w / 2 + 6, h - 14, 1.2);
          lampDrone(ctx, w / 2 + 40, h - 64, 1.2);
        },
      },
      {
        // The fisherman watches the dolphins; his cat watches the fish.
        at: 0.93, plane: 'near', w: 200, h: 90, y: 566,
        paint: (ctx, rng, _w, h) => {
          eBoat(ctx, rng, 100, h - 6, 1.3, { pose: 'stand', cloth: P.limewhite, lamp: true, cat: true, facing: 1 });
          dab(ctx, 136, h - 26, 5, 2, 0.3, mix(P.limewhite, P.peacock, 0.3), 1);
        },
      },
    ],
  }),

  // f3 · 2061 · The coast cyclones can't break — flight through a harvested storm.
  f3: () => {
    const storm = DERIVED.stormGrey;
    return {
      id: 'f3',
      sky: {
        stops: [[0, mix(P.neel, P.ink, 0.35)], [0.35, mix(storm, P.neel, 0.45)], [0.65, mix(storm, P.peacock, 0.3)], [1, mix(P.neel, P.peacock, 0.4)]],
        halftone: P.neel,
        clouds: 'storm',
        cloudTint: mix(P.neel, P.khondalite, 0.35),
      },
      far: [{ kind: 'hills', a: mix(storm, P.neel, 0.3), b: mix(P.neel, P.ink, 0.3), height: [10, 40], haze: 0.1 }],
      ground: { kind: 'air', water: { sky: mix(storm, P.peacock, 0.3), light: mix(P.peacock, storm, 0.4), mid: mix(P.peacock, P.neel, 0.45), deep: mix(P.neel, P.ink, 0.3) } },
      rain: true,
      mid: (ctx, rng, W) => {
        // Mangrove-walled towns: houses on mounds behind a green wall, turbines turning in the wind.
        scatter(rng.fork('turb'), W, [180, 300], (x) => wrapped(W, x, 60, (xx) => turbine(ctx, xx, 238, rng.range(0.8, 1.1), rng.next() * 6, 0.25)));
        scatter(rng.fork('town'), W, [46, 80], (x) => wrapped(W, x, 30, (xx) => house(ctx, rng.fork(x), xx, 230, rng.range(30, 46), rng.range(34, 48), { roof: 'tile', wall: rng.pick([P.limewhite, mix(P.haldi, P.limewhite, 0.5), mix(P.seafoam, P.limewhite, 0.4)]), haze: 0.15 })));
        scatter(rng.fork('stilts'), W, [380, 600], (x) => wrapped(W, x, 50, (xx) => stiltShelter(ctx, rng.fork(x), xx, 240, 0.8)));
        bank(ctx, rng.fork('bank'), W, 240, mix(P.tota, P.neel, 0.35), mix(P.laterite, P.neel, 0.45));
        scatter(rng.fork('mang'), W, [16, 30], (x) => wrapped(W, x, 30, (xx) => mangrove(ctx, rng.fork(x), xx, 252, rng.range(0.8, 1.15), 0.05)));
        tintAtop(ctx, mix(P.neel, storm, 0.4), 0.3);
        scatter(rng.fork('win'), W, [60, 140], (x) => wrapped(W, x, 6, (xx) => dab(ctx, xx, rng.range(206, 222), 2.2, 2, 0, P.haldi, 0.9)));
      },
      near: (ctx, rng, W) => {
        // Whitecaps on the storm sea, then turbines along the mangrove edge, hubs glowing cyan.
        for (let i = 0; i < 260; i++) {
          const x = rng.next() * W, y = 20 + rng.next() * 118, l = 6 + y * 0.12;
          wrapped(W, x, l, (xx) => taperStroke(ctx, curvePts(xx - l, y, xx, y - 2, xx + l, y, 5), 1 + y * 0.012, rng.chance(0.6) ? mix(P.limewhite, P.seafoam, 0.3) : mix(P.neel, P.ink, 0.2), rng.range(0.2, 0.5)));
        }
        scatter(rng.fork('bigturb'), W, [420, 640], (x) => wrapped(W, x, 90, (xx) => {
          turbine(ctx, xx, 140, 0.8, rng.next() * 6);
          glow(ctx, xx, 140 - 96, 20, P.neonCyan, 0.35);
          for (let k = 0; k < 3; k++) mangrove(ctx, rng.fork(x + k), xx - 40 + k * 40, 142, 1.1);
        }));
      },
      fore: 'none',
      sign: { date: '2061', title: 'Storm coast' },
      landmarks: [
        {
          // A storm bank with radium-cyan edges, its lightning caught by a tall harvester mast.
          at: 0.14, plane: 'far', w: 900, h: 400, y: 446,
          paint: (ctx, rng, w, h) => {
            stormCloud(ctx, rng, w / 2, 150, 720, 120, storm);
            const mx = w * 0.6;
            taperStroke(ctx, [{ x: mx, y: h }, { x: mx, y: h - 150 }], 6, mix(P.limewhite, P.neel, 0.3), 1, [1, 0.5]);
            for (let k = 1; k < 5; k++) taperStroke(ctx, [{ x: mx - 10, y: h - k * 30 }, { x: mx + 10, y: h - k * 30 }], 2, mix(P.limewhite, P.neel, 0.3), 1, [1, 1]);
            dab(ctx, mx, h - 14, 18, 14, 0, mix(P.neel, P.neonCyan, 0.4), 1);
            glow(ctx, mx, h - 14, 46, P.neonCyan, 0.5);
            const bolt: Pt[] = [{ x: mx - 50, y: 200 }, { x: mx - 30, y: 222 }, { x: mx - 40, y: 230 }, { x: mx - 12, y: 252 }, { x: mx - 18, y: 258 }, { x: mx, y: h - 150 }];
            taperStroke(ctx, bolt, 12, P.neonCyan, 0.35, [0.5, 0.5]);
            taperStroke(ctx, bolt, 3, P.limewhite, 1, [0.6, 0.6]);
            glow(ctx, mx, h - 150, 26, P.neonCyan, 0.6);
          },
        },
        {
          // A second squall line further down the coast.
          at: 0.66, plane: 'far', w: 760, h: 300, y: 330,
          paint: (ctx, rng, w, _h) => stormCloud(ctx, rng, w / 2, 160, 600, 100, storm),
        },
        {
          // Children fly kites from a stilt shelter's roof, right into the storm's wind.
          at: 0.36, plane: 'mid', w: 360, h: 290, y: 466,
          paint: (ctx, rng, w, h) => {
            stiltShelter(ctx, rng, w / 2, h - 6, 1.3);
            const roof = h - 6 - 140 * 1.3 + 8;
            const kids: [number, string, string, string][] = [[-26, P.haldi, P.sindoor, P.haldi], [0, P.rani, P.neonRani, P.neel], [26, P.peacock, P.haldi, P.sindoor]];
            kids.forEach(([dx, cloth, k1, k2], i) => {
              const px = w / 2 + dx;
              person(ctx, px, roof + 6, 1, { pose: 'armsUp', cloth, head: i === 1 ? 'bun' : 'none', skin: rng.next(), facing: 1 });
              kite(ctx, px + 70 + i * 40, 30 + i * 22, 1.3, k1, k2, px + 3, roof - 22, 0.5);
            });
            person(ctx, w / 2 - 40, h - 6 - 92 * 1.3 + 16, 1, { pose: 'wave', cloth: P.limewhite, cloth2: P.sindoor, sari: true, head: 'veil', skin: 0.7 });
            for (let i = 0; i < 30; i++) { const x = rng.next() * w, y = rng.next() * h; taperStroke(ctx, [{ x, y }, { x: x - 5, y: y + 14 }], 1, P.limewhite, 0.35); }
          },
        },
        {
          // A whole neighbourhood risen on its stilts — the cows look over the rail, unbothered.
          at: 0.6, plane: 'mid', w: 420, h: 260, y: 470,
          paint: (ctx, rng, w, h) => {
            const deck = h - 140;
            for (let k = 0; k < 6; k++) {
              const px = 40 + k * 68;
              ctx.fillStyle = mix(P.limewhite, P.neel, 0.3);
              ctx.fillRect(px - 4, deck, 8, h - deck);
              ctx.fillStyle = mix(P.limewhite, P.neel, 0.5);
              ctx.fillRect(px - 6, deck + 40, 12, 3);
              ctx.fillRect(px - 6, deck + 80, 12, 3);
              ctx.fillStyle = withAlpha(P.neonCyan, 0.8);
              ctx.fillRect(px - 4, deck + 60, 8, 2);
            }
            ctx.fillStyle = mix(P.limewhite, P.neel, 0.25);
            ctx.fillRect(10, deck - 6, w - 20, 10);
            for (let k = 0; k < 4; k++) house(ctx, rng.fork(k), 70 + k * 90, deck - 6, 54, 56, { roof: 'tile', wall: rng.pick([P.limewhite, mix(P.haldi, P.limewhite, 0.5)]) });
            cow(ctx, w - 50, deck - 6, 1.1, { facing: 1 });
            goat(ctx, 30, deck - 6, 1, -1);
            ctx.strokeStyle = mix(P.limewhite, P.neel, 0.4);
            ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(10, deck - 18); ctx.lineTo(w - 10, deck - 18); ctx.stroke();
            for (let x = 14; x < w - 10; x += 14) { ctx.beginPath(); ctx.moveTo(x, deck - 18); ctx.lineTo(x, deck - 6); ctx.stroke(); }
            for (let k = 0; k < 4; k++) { ctx.fillStyle = P.haldi; ctx.fillRect(62 + k * 90, deck - 30, 6, 7); }
          },
        },
        {
          // The old cyclone shelter, kept as a lit landmark, with mangrove saplings planted all around.
          at: 0.82, plane: 'mid', w: 420, h: 260, y: 466,
          paint: (ctx, rng, w, h) => {
            cycloneShelter(ctx, rng, w / 2, h - 14, 1.3, true);
            flag(ctx, w / 2 + 70, h - 14, 70, P.sindoor, 0, 2);
            for (let k = 0; k < 9; k++) mangrove(ctx, rng.fork(k), 70 + k * 35, h - 4, 0.55);
            person(ctx, 96, h - 6, 1, { pose: 'bend', cloth: P.haldi, skin: 0.5 });
            person(ctx, 320, h - 6, 1, { pose: 'carry', cloth: P.tota, skin: 0.3, facing: -1 });
          },
        },
      ],
    };
  },

  // f4 · 2088 · Talapatra in glass — Raghurajpur paints with light; Naraj has grown into a city.
  f4: () => ({
    id: 'f4',
    sky: {
      stops: [[0, mix(P.neel, P.peacock, 0.15)], [0.45, mix(P.neel, P.seafoam, 0.55)], [0.82, mix(P.seafoam, P.skyCream, 0.55)], [1, P.skyCream]],
      sun: { x: 260, y: 120, r: 34 },
      halftone: P.neel,
      clouds: 'cumulus',
      cloudTint: mix(P.seafoam, P.neel, 0.2),
    },
    far: [{ kind: 'hills', a: mix(P.neel, P.skyCream, 0.42), b: P.neel, height: [40, 120], trees: true, haze: 0.4 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.22), plainDetail: 'fields', path: mix(P.limewhite, P.neel, 0.32), verge: mix(P.tota, P.neel, 0.3) },
    mid: (ctx, rng, W) => {
      // Raghurajpur's street of painted houses under coconut palms; glass-leaf towers rise behind.
      scatter(rng.fork('leaf'), W, [360, 560], (x) => wrapped(W, x, 50, (xx) => glassLeafTower(ctx, xx, 236, rng.range(0.7, 0.95))));
      scatter(rng.fork('palms'), W, [60, 120], (x) => {
        const h = rng.range(110, 160);
        wrapped(W, x, h * 0.5, (xx) => coconutPalm(ctx, rng.fork(x), xx, 238, h, rng.range(-0.15, 0.15), 0.15));
      });
      scatter(rng.fork('houses'), W, [54, 110], (x, i) => wrapped(W, x, 50, (xx) => {
        const r = rng.fork(x);
        if (i % 9 === 4) {
          // the village's little temple in the middle of the street
          rekhaDeula(ctx, r, xx, 244, r.range(70, 90), { stone: mix(P.limewhite, P.chandan, 0.2), flagColour: P.sindoor });
          return;
        }
        const two = r.chance(0.3);
        const w = r.range(40, 72), h = two ? r.range(62, 78) : r.range(40, 60);
        house(ctx, r, xx, 244, w, h, { roof: two ? 'flat' : r.chance(0.75) ? 'tile' : 'thatch', wall: r.pick([P.limewhite, P.limewhite, mix(P.limewhite, P.haldi, 0.25), mix(P.limewhite, P.seafoam, 0.3)]), door: r.pick([P.neel, P.peacock, P.sindoor]) });
        // painted walls: Pattachitra borders and motifs
        const wh = h * (two ? 0.9 : 0.58);
        ctx.fillStyle = P.sindoor;
        ctx.fillRect(xx - w / 2, 244 - wh, w, 3);
        ctx.fillRect(xx - w / 2, 244 - 4, w, 3);
        for (let k = 0; k < 6; k++) dab(ctx, xx - w / 2 + 4 + k * (w - 8) / 5, 244 - wh + 1.5, 1.4, 1.4, 0, P.haldi, 1);
        dab(ctx, xx - w * 0.32, 244 - wh * 0.5, 4, 2.6, 0, i % 2 ? P.peacock : P.sindoor, 0.9);
        if (two) for (let k = 0; k < 3; k++) dab(ctx, xx - w * 0.25 + k * w * 0.25, 244 - wh * 0.78, 3, 2, 0, r.pick([P.sindoor, P.neel, P.tota]), 0.9);
        if (i % 3 === 0) { glow(ctx, xx + w * 0.3, 244 - wh * 0.5, 14, P.neonRani, 0.4); ctx.fillStyle = withAlpha(P.neonRani, 0.8); ctx.fillRect(xx + w * 0.22, 244 - wh * 0.7, w * 0.16, wh * 0.36); }
      }));
      bank(ctx, rng.fork('bank'), W, 246, mix(P.tota, P.haldi, 0.25), mix(P.laterite, P.chandan, 0.3));
    },
    near: (ctx, rng, W) => {
      // Painters at their frames on the verandas — brushes of light, frames that glow —
      // palm-leaf manuscripts drying on a line, children and goats in between.
      scatter(rng.fork('painters'), W, [200, 300], (x, i) => wrapped(W, x, 110, (xx) => {
        const r = rng.fork(x);
        const kind = i % 3;
        if (kind === 0 || kind === 2) {
          const fx = xx + 26;
          const lc = i % 2 ? P.neonCyan : P.neonRani;
          if (kind === 2) stall(ctx, xx + 6, 134, 92, 70, [P.sindoor, P.haldi]);
          glow(ctx, fx, 94, 44, lc, 0.3);
          ctx.fillStyle = mix(P.neel, P.ink, 0.35);
          ctx.fillRect(fx - 21, 72, 42, 46);
          pattaBorder(ctx, fx - 21, 72, 42, 46, 4);
          taperStroke(ctx, curvePts(fx - 12, 104, fx, 82, fx + 12, 102, 8), 2.6, lc, 1);
          dab(ctx, fx, 95, 4, 2.6, 0, P.haldi, 1);
          taperStroke(ctx, [{ x: fx - 13, y: 118 }, { x: fx - 18, y: 134 }], 1.8, mix(P.laterite, P.ink, 0.2), 1, [1, 1]);
          taperStroke(ctx, [{ x: fx + 13, y: 118 }, { x: fx + 18, y: 134 }], 1.8, mix(P.laterite, P.ink, 0.2), 1, [1, 1]);
          person(ctx, xx - 8, 133, 1.35, { pose: 'paint', cloth: r.pick([P.limewhite, P.haldi]), cloth2: P.sindoor, head: r.pick(['turban', 'none', 'bun'] as const), skin: r.next(), facing: 1 });
          person(ctx, xx - 56, 133, 0.95, { pose: 'point', cloth: r.pick([P.rani, P.peacock, P.tota]), skin: r.next(), facing: 1 });
          if (kind === 0) coconutPalm(ctx, r, xx + 96, 136, r.range(110, 130), r.range(-0.1, 0.1), 0);
        } else {
          // talapatra leaves drying on a line
          for (const k of [-60, 60]) taperStroke(ctx, [{ x: xx + k, y: 134 }, { x: xx + k, y: 78 }], 2.2, mix(P.laterite, P.chandan, 0.3), 1, [1, 1]);
          ctx.strokeStyle = withAlpha(P.ink, 0.6); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(xx - 60, 82); ctx.quadraticCurveTo(xx, 90, xx + 60, 82); ctx.stroke();
          for (let k = -52; k <= 52; k += 9) { const ly = 84 + (1 - (k / 60) ** 2) * 6; ctx.fillStyle = mix(P.haldi, P.chandan, 0.3); ctx.fillRect(xx + k - 2, ly, 4, 22); ctx.fillStyle = withAlpha(P.ink, 0.5); for (let q = 0; q < 3; q++) ctx.fillRect(xx + k - 1, ly + 5 + q * 5, 2, 0.8); }
          person(ctx, xx - 20, 133, 1.2, { pose: 'read', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: r.next(), facing: 1 });
          person(ctx, xx + 30, 133, 0.9, { pose: 'wave', cloth: r.pick([P.rani, P.haldi]), skin: r.next(), facing: -1 });
          goat(ctx, xx + 80, 134, 1.1, -1, 0, P.haldi);
        }
      }));
    },
    fore: 'grass',
    sign: { date: '2088', title: 'Glass talapatra' },
    landmarks: [
      {
        // The glass library: every Odia book on leaves of light, a scribe still carving with a stylus.
        at: 0.16, plane: 'mid', w: 380, h: 290, y: 454,
        paint: (ctx, rng, w, h) => {
          glow(ctx, w / 2, h - 120, 170, P.neonCyan, 0.16);
          glassLeafTower(ctx, w / 2 - 90, h - 8, 0.95);
          glassLeafTower(ctx, w / 2 + 90, h - 8, 1.05);
          glassLeafTower(ctx, w / 2, h - 8, 1.25);
          ctx.fillStyle = mix(P.limewhite, P.neel, 0.2);
          ctx.fillRect(20, h - 12, w - 40, 6);
          person(ctx, w / 2 - 40, h - 12, 1.15, { pose: 'sit', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: 0.7 });
          dab(ctx, w / 2 - 28, h - 24, 9, 2.4, -0.1, P.haldi, 1);
          for (let k = 0; k < 4; k++) person(ctx, w / 2 + 20 + k * 22, h - 12, 1, { pose: 'read', cloth: rng.pick([P.rani, P.peacock, P.haldi, P.tota]), skin: rng.next(), facing: k % 2 ? -1 : 1 });
        },
      },
      {
        // A grandmother teaches a robot to paint a Pattachitra border. The robot is still learning.
        at: 0.38, plane: 'near', w: 240, h: 120, y: 556,
        paint: (ctx, rng, w, h) => {
          const fx = w / 2 - 6, fy = h - 82, fw = 70, fh = 56;
          ctx.fillStyle = mix(P.limewhite, P.chandan, 0.25);
          ctx.fillRect(fx, fy, fw, fh);
          pattaBorder(ctx, fx, fy, fw, fh, 6, 0.62);
          // the robot's wobbly attempt at the rest of the border
          taperStroke(ctx, [{ x: fx + 3, y: fy + fh - 4 }, { x: fx + 2, y: fy + 40 }, { x: fx + 5, y: fy + 30 }, { x: fx + 1, y: fy + 18 }], 4, P.sindoor, 0.9, [1, 0.6]);
          dab(ctx, fx + 4, fy + 36, 2.4, 2.4, 0, P.haldi, 1);
          // a fish at the centre, the classic motif
          dab(ctx, fx + fw / 2, fy + fh / 2, 14, 7, 0, P.neel, 1);
          ctx.fillStyle = P.neel;
          ctx.beginPath(); ctx.moveTo(fx + fw / 2 - 12, fy + fh / 2); ctx.lineTo(fx + fw / 2 - 22, fy + fh / 2 - 7); ctx.lineTo(fx + fw / 2 - 22, fy + fh / 2 + 7); ctx.closePath(); ctx.fill();
          dab(ctx, fx + fw / 2 + 8, fy + fh / 2 - 1, 1.6, 1.6, 0, P.limewhite, 1);
          taperStroke(ctx, [{ x: fx + 8, y: h - 26 }, { x: fx + 4, y: h - 2 }], 2, mix(P.laterite, P.ink, 0.2), 1, [1, 1]);
          taperStroke(ctx, [{ x: fx + fw - 8, y: h - 26 }, { x: fx + fw - 4, y: h - 2 }], 2, mix(P.laterite, P.ink, 0.2), 1, [1, 1]);
          person(ctx, fx - 28, h - 2, 1.5, { pose: 'paint', cloth: P.limewhite, cloth2: P.sindoor, sari: true, head: 'veil', skin: 0.75, facing: 1 });
          robot(ctx, fx - 4, h - 2, 1.4, 'wave');
          dab(ctx, fx - 4 + 10 * 1.4, h - 2 - 27 * 1.4, 1.6, 1.6, 0, P.sindoor, 1);
          dab(ctx, fx - 2, h - 2 - 18, 2.4, 2, 0, P.sindoor, 0.9);
          cat(ctx, fx + fw + 26, h - 2, 1.1, P.marigold, -1);
          void rng;
        },
      },
      {
        // The Naraj chip valley, grown into a city where the Mahanadi leaves the hills.
        at: 0.6, plane: 'far', w: 940, h: 250, y: 452,
        paint: (ctx, rng, w, h) => {
          const hz = 0.3;
          for (let k = 0; k < 14; k++) {
            const x = 60 + k * 64 + rng.range(-14, 14);
            const th = 60 + Math.sin(k * 0.7) * 30 + rng.range(20, 90);
            futureTower(ctx, rng.fork(k), x, h - 26, rng.range(24, 40), th, { body: rng.pick([P.limewhite, mix(P.neel, P.limewhite, 0.4), mix(P.seafoam, P.limewhite, 0.3)]), crown: rng.pick(['dome', 'leaf', 'saucer', 'spire', 'deula'] as const), haze: hz, accent: k % 4 === 0 ? P.neonCyan : undefined, lit: 0.25 });
          }
          // the chip-plaza: a square of cyan traces
          ctx.fillStyle = mix(mix(P.neel, P.ink, 0.2), P.skyCream, hz * 0.6);
          ctx.fillRect(w / 2 - 90, h - 28, 180, 14);
          for (let i = 0; i < 18; i++) { ctx.fillStyle = withAlpha(P.neonCyan, 0.8); ctx.fillRect(w / 2 - 86 + i * 10, h - 26, 1.2, 10); }
          vGradient(ctx, 0, h - 16, w, 16, [[0, mix(P.peacock, P.skyCream, 0.3), 1], [1, mix(P.peacock, P.neel, 0.2), 1]]);
          maglevGuideway(ctx, 0, w, h - 40, 0.7, hz);
          boitaPod(ctx, w * 0.3, h - 49, 0.6, hz);
        },
      },
      {
        // Painting with light: an elephant drawn in the air; a cat walks through it and leaves glowing paw prints.
        at: 0.8, plane: 'mid', w: 440, h: 270, y: 456,
        paint: (ctx, rng, w, h) => {
          // scaffold
          for (const k of [w * 0.18, w * 0.32]) taperStroke(ctx, [{ x: k, y: h - 6 }, { x: k, y: h - 150 }], 3, mix(P.laterite, P.chandan, 0.3), 1, [1, 1]);
          for (let yy = h - 40; yy > h - 160; yy -= 40) taperStroke(ctx, [{ x: w * 0.18 - 6, y: yy }, { x: w * 0.32 + 6, y: yy }], 3, mix(P.laterite, P.chandan, 0.3), 1, [1, 1]);
          person(ctx, w * 0.27, h - 120, 1.2, { pose: 'paint', cloth: P.haldi, cloth2: P.sindoor, head: 'turban', skin: 0.55, facing: 1 });
          // the light-elephant, drawn in the air in Pattachitra outline
          const ex = w * 0.64, ey = h - 150;
          const body = () => { ctx.beginPath(); ctx.ellipse(ex, ey, 62, 40, 0, 0, Math.PI * 2); };
          const lines: Pt[][] = [
            curvePts(ex + 50, ey - 26, ex + 92, ey - 30, ex + 96, ey + 6, 10), // head top
            curvePts(ex + 96, ey + 6, ex + 108, ey + 40, ex + 92, ey + 66, 10), // trunk
            curvePts(ex + 92, ey + 66, ex + 86, ey + 74, ex + 100, ey + 74, 4),
            curvePts(ex + 62, ey - 18, ex + 44, ey + 6, ex + 64, ey + 24, 8), // ear
            [{ x: ex - 40, y: ey + 30 }, { x: ex - 40, y: ey + 78 }], [{ x: ex - 16, y: ey + 36 }, { x: ex - 16, y: ey + 80 }],
            [{ x: ex + 22, y: ey + 36 }, { x: ex + 22, y: ey + 80 }], [{ x: ex + 46, y: ey + 28 }, { x: ex + 46, y: ey + 78 }],
            curvePts(ex - 62, ey - 4, ex - 76, ey + 10, ex - 72, ey + 30, 6), // tail
            curvePts(ex + 88, ey + 20, ex + 76, ey + 30, ex + 70, ey + 26, 4), // tusk
          ];
          body(); ctx.fillStyle = withAlpha(P.neonRani, 0.12); ctx.fill();
          ctx.strokeStyle = withAlpha(P.neonRani, 0.3); ctx.lineWidth = 9; body(); ctx.stroke();
          ctx.strokeStyle = P.neonRani; ctx.lineWidth = 2.6; body(); ctx.stroke();
          for (const l of lines) { taperStroke(ctx, l, 9, P.neonRani, 0.25, [1, 1]); taperStroke(ctx, l, 2.6, P.neonRani, 1, [0.7, 0.7]); }
          // a caparison of haldi dots and a sindoor saddle-cloth
          ctx.strokeStyle = P.haldi; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ex - 30, ey - 36); ctx.quadraticCurveTo(ex - 6, ey + 10, ex + 24, ey - 36); ctx.stroke();
          for (let k = 0; k < 7; k++) dab(ctx, ex - 30 + k * 9, ey - 30 + Math.sin((k / 6) * Math.PI) * 34, 2.4, 2.4, 0, P.haldi, 1);
          dab(ctx, ex + 76, ey - 10, 3, 3, 0, P.haldi, 1);
          glow(ctx, ex, ey + 20, 140, P.neonRani, 0.12);
          // the cat, and its light-prints
          cat(ctx, ex + 26, h - 8, 1.2, P.marigold, 1);
          for (let k = 0; k < 6; k++) { glow(ctx, ex - 70 + k * 16, h - 8 - (k % 2) * 3, 6, P.neonCyan, 0.7); dab(ctx, ex - 70 + k * 16, h - 8 - (k % 2) * 3, 1.6, 1.2, 0, P.neonCyan, 1); }
          for (let k = 0; k < 3; k++) person(ctx, w * 0.42 + k * 22, h - 6, 1, { pose: k === 1 ? 'point' : 'armsUp', cloth: rng.pick([P.rani, P.peacock, P.tota, P.haldi]), skin: rng.next(), facing: 1 });
        },
      },
    ],
  }),

  // f5 · 2120 · Konark's wheel, unfurled in orbit — the Surya Array.
  f5: () => ({
    id: 'f5',
    sky: {
      stops: [[0, mix(P.neel, P.ink, 0.6)], [0.4, mix(P.neel, P.ink, 0.35)], [0.75, mix(P.neel, P.ink, 0.1)], [1, P.neel]],
      stars: 300,
      halftone: P.neel,
      clouds: 'none',
    },
    far: [],
    ground: { kind: 'orbit' },
    mid: (ctx, rng, W) => {
      // Far-off members of the array and a few station modules, small against the dark.
      scatter(rng.fork('wheels'), W, [380, 620], (x, i) => wrapped(W, x, 40, (xx) => {
        const y = rng.range(40, 150), r = rng.range(12, 26);
        ctx.save(); ctx.globalAlpha = 0.6; solarSailWheel(ctx, xx, y, r, rng.next()); ctx.restore();
        if (i % 2) {
          ctx.fillStyle = mix(P.limewhite, P.neel, 0.45);
          ctx.fillRect(xx + r + 8, y - 2, 40, 4);
          dab(ctx, xx + r + 52, y, 8, 5, 0, mix(P.limewhite, P.neel, 0.35), 1);
          dab(ctx, xx + r + 52, y, 1.5, 1.5, 0, P.haldi, 1);
        }
      }));
    },
    sign: { date: '2120', title: 'Surya Array' },
    landmarks: [
      {
        // Earth below: the Bay of Bengal, the Odisha coast, Chilika — and, if you look closely, Konark.
        at: 0.5, plane: 'far', w: 3000, h: 300, y: 600,
        paint: (ctx, rng, w, h) => {
          const R = 9000;
          const cx = w / 2, cy = h - 180 + R;
          const limb = (x: number) => cy - Math.sqrt(R * R - (x - cx) * (x - cx));
          const disc = () => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); };
          const rim = ctx.createRadialGradient(cx, cy, R - 40, cx, cy, R + 60);
          rim.addColorStop(0, withAlpha(P.seafoam, 0));
          rim.addColorStop(0.38, withAlpha(P.neonCyan, 0.5));
          rim.addColorStop(0.45, withAlpha(P.seafoam, 0.45));
          rim.addColorStop(0.7, withAlpha(P.peacock, 0.12));
          rim.addColorStop(1, withAlpha(P.neel, 0));
          ctx.fillStyle = rim;
          ctx.fillRect(0, 0, w, h);
          clipTo(ctx, disc, () => {
            vGradient(ctx, 0, h - 190, w, 190, [[0, mix(P.peacock, P.seafoam, 0.5), 1], [0.2, mix(P.peacock, P.neel, 0.35), 1], [1, mix(P.neel, P.ink, 0.25), 1]]);
            // the land: the east coast of India, running away to the horizon
            const coast = (x: number) => limb(x) + Math.max(0, (w * 0.47 - x)) * 0.0 + (x - w * 0.2) * 0.35 + Math.sin(x * 0.02) * 6;
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let x = 0; x <= w * 0.62; x += 10) {
              const y = Math.max(limb(x), Math.min(h, h - (w * 0.62 - x) * 0.32 + Math.sin(x * 0.03) * 5));
              ctx.lineTo(x, y);
            }
            ctx.lineTo(0, h);
            ctx.closePath();
            void coast;
            ctx.fillStyle = mix(P.tota, P.neel, 0.5);
            ctx.fill();
            ctx.save();
            ctx.clip();
            dabField(ctx, rng, 0, h - 200, w * 0.62, 200, { n: 500, r: [8, 26], colours: [mix(P.tota, P.haldi, 0.25), mix(P.laterite, P.tota, 0.5), mix(P.tota, P.neel, 0.6)], alpha: [0.08, 0.2], aspect: [0.25, 0.45], rot: 0, rotJitter: 0.15 });
            vGradient(ctx, 0, h - 200, w, 200, [[0, mix(P.seafoam, P.neel, 0.3), 0.55], [0.5, mix(P.neel, P.tota, 0.3), 0.15], [1, P.neel, 0.25]]);
            for (let k = 0; k < 4; k++) taperStroke(ctx, curvePts(w * 0.62 - 120 - k * 30, h - 6, w * 0.45 - k * 60, h - 60, w * 0.3 - k * 80, h - 110 - k * 10, 14), 2, mix(P.peacock, P.seafoam, 0.4), 0.7);
            ctx.restore();
            // Chilika, a seafoam lagoon on the coast
            dab(ctx, w * 0.5, h - 44, 40, 9, -0.3, mix(P.seafoam, P.peacock, 0.4), 0.95);
            // cloud streets
            for (let i = 0; i < 70; i++) {
              const x = rng.next() * w, y = h - rng.next() * 170;
              if (y < limb(x) + 4) continue;
              dab(ctx, x, y, rng.range(20, 70), rng.range(3, 7), rng.range(-0.1, 0.1), P.limewhite, rng.range(0.15, 0.4));
            }
            vGradient(ctx, 0, h - 200, w, 60, [[0, P.seafoam, 0.45], [1, P.seafoam, 0]]);
          });
          // Konark, a tiny dark chariot on the shore, caught in a glint of sunlight
          const kx = w * 0.555, ky = h - 26;
          glow(ctx, kx, ky - 6, 26, P.haldi, 0.6);
          konark(ctx, rng, kx, ky, 0.09, 0.1);
        },
      },
      {
        // The Surya Array: Konark's 24-spoked wheel, unfurled as a solar sail.
        at: 0.42, plane: 'far', w: 800, h: 800, y: 790,
        paint: (ctx, _rng, w, h) => {
          const cx = w / 2, cy = h / 2, r = 270;
          ctx.save();
          ctx.globalAlpha = 0.62;
          solarSailWheel(ctx, cx, cy, r, 0.13);
          ctx.restore();
          ctx.strokeStyle = withAlpha(P.haldi, 0.6);
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2); ctx.stroke();
          for (let i = 0; i < 24; i++) {
            const a = 0.13 + (i / 24) * Math.PI * 2;
            dab(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4, 4, 0, P.haldi, 1);
          }
        },
      },
      {
        // A spacewalker hangs a marigold garland on a hub — even in orbit, a garland for the sun.
        at: 0.26, plane: 'mid', w: 300, h: 240, y: 500,
        paint: (ctx, _rng, w, h) => {
          const cx = w / 2 + 40, cy = h / 2 - 10;
          solarSailWheel(ctx, cx, cy, 80, 0.4);
          garland(ctx, cx - 30, cy - 4, cx + 30, cy - 4, 30, 3.4);
          ctx.strokeStyle = withAlpha(P.limewhite, 0.7);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx - 60, cy + 60, cx - 96, cy + 40); ctx.stroke();
          spacewalker(ctx, cx - 70, cy + 62, 1.4, -0.4, true);
        },
      },
      {
        // A boita-shaped shuttle docks; through the porthole, a cat floats after a floating fish.
        at: 0.62, plane: 'mid', w: 380, h: 220, y: 480,
        paint: (ctx, rng, _w, h) => {
          const my = h / 2;
          // station module
          paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 30, y: my - 34 }, { x: 220, y: my - 34 }, { x: 236, y: my - 20 }, { x: 236, y: my + 20 }, { x: 220, y: my + 34 }, { x: 30, y: my + 34 }]), { x: 30, y: my - 34, w: 206, h: 68 }, { base: mix(P.limewhite, P.neel, 0.2), light: P.limewhite, shade: mix(P.limewhite, P.neel, 0.5), lightFrom: 'top', dabs: 20 });
          ctx.fillStyle = P.sindoor;
          ctx.fillRect(30, my + 22, 190, 4);
          for (let k = 0; k < 3; k++) { ctx.fillStyle = mix(P.neel, P.ink, 0.2); ctx.fillRect(10, my - 70 + k * 50, 26, 40); ctx.strokeStyle = withAlpha(P.neonCyan, 0.6); ctx.lineWidth = 1; ctx.strokeRect(10, my - 70 + k * 50, 26, 40); }
          // porthole
          const px = 110, py = my - 4;
          dab(ctx, px, py, 24, 24, 0, mix(P.neel, P.ink, 0.1), 1);
          glow(ctx, px, py, 24, P.haldi, 0.4);
          clipTo(ctx, () => { ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); }, () => {
            ctx.save(); ctx.translate(px - 4, py + 2); ctx.rotate(2.4); cat(ctx, 0, 6, 1.2, P.marigold, 1); ctx.restore();
            dab(ctx, px + 12, py - 8, 5, 2.4, 0.4, mix(P.peacock, P.limewhite, 0.3), 1);
          });
          ctx.strokeStyle = P.limewhite; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(px, py, 23, 0, Math.PI * 2); ctx.stroke();
          person(ctx, 180, my + 6, 0.9, { pose: 'wave', cloth: P.haldi, skin: 0.5 });
          // the shuttle, docking
          boitaPod(ctx, 310, my + 14, 1.05);
          for (let k = 0; k < 3; k++) dab(ctx, 360 + k * 10, my - 2, 3 - k * 0.8, 2, 0, P.neonCyan, 0.8 - k * 0.2);
        },
      },
      {
        // An engineer polishes a mirror-panel the way a lamp is polished before a festival.
        at: 0.84, plane: 'mid', w: 260, h: 200, y: 470,
        paint: (ctx, _rng, w, h) => {
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(-0.25);
          ctx.fillStyle = mix(P.neel, P.ink, 0.1);
          ctx.fillRect(-90, -40, 180, 80);
          for (let k = 1; k < 6; k++) { ctx.fillStyle = withAlpha(P.neonCyan, 0.6); ctx.fillRect(-90 + k * 30, -40, 1, 80); }
          ctx.fillStyle = withAlpha(P.limewhite, 0.35);
          ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(-20, -40); ctx.lineTo(-70, 40); ctx.lineTo(-90, 40); ctx.closePath(); ctx.fill();
          ctx.restore();
          spacewalker(ctx, w / 2 + 50, h / 2 + 10, 1.3, 0.3, false);
          dab(ctx, w / 2 + 62, h / 2 - 16, 5, 3, 0, P.haldi, 1);
        },
      },
    ],
  }),

  // f6 · Kartika Purnima 2150 · Bali Jatra beyond the sky.
  f6: () => ({
    id: 'f6',
    sky: {
      stops: [[0, NIGHT_INK], [0.42, mix(P.neel, P.ink, 0.1)], [0.62, mix(P.neel, P.peacock, 0.2)], [0.7, mix(P.neel, P.peacock, 0.35)], [1, mix(P.neel, P.ink, 0.35)]],
      moon: { x: 900, y: 175, r: 74 },
      stars: 220,
      halftone: mix(P.neel, P.limewhite, 0.3),
      clouds: 'none',
      cloudTint: mix(P.neel, P.ink, 0.25),
    },
    far: [{ kind: 'hills', a: mix(P.neel, P.ink, 0.25), b: NIGHT_INK, height: [14, 50], haze: 0.04 }],
    ground: { kind: 'air', water: { sky: mix(P.neel, P.peacock, 0.3), light: mix(P.neel, P.peacock, 0.4), mid: mix(P.neel, P.ink, 0.15), deep: mix(P.neel, P.ink, 0.4) } },
    mid: (ctx, rng, W) => {
      // The Kalinga coast at night: temple spires and palms, lamps everywhere, launch towers.
      scatter(rng.fork('palms'), W, [60, 130], (x) => {
        const h = rng.range(80, 130);
        wrapped(W, x, h * 0.5, (xx) => coconutPalm(ctx, rng.fork(x), xx, 232, h, rng.range(-0.15, 0.15), 0));
      });
      scatter(rng.fork('temples'), W, [420, 700], (x) => wrapped(W, x, 40, (xx) => rekhaDeula(ctx, rng.fork(x), xx, 234, rng.range(80, 110), { stone: P.limewhite, flagColour: P.sindoor })));
      scatter(rng.fork('houses'), W, [50, 90], (x) => wrapped(W, x, 30, (xx) => house(ctx, rng.fork(x), xx, 236, rng.range(28, 40), rng.range(28, 38), { roof: 'tile' })));
      scatter(rng.fork('gantry'), W, [500, 800], (x) => wrapped(W, x, 30, (xx) => {
        ctx.fillStyle = mix(P.limewhite, P.neel, 0.35);
        ctx.fillRect(xx - 3, 110, 6, 126);
        for (let y = 120; y < 230; y += 14) { ctx.fillRect(xx - 10, y, 20, 2); }
      }));
      bank(ctx, rng.fork('bank'), W, 236, mix(P.chandan, P.limewhite, 0.3), mix(P.chandan, P.neel, 0.3));
      tintAtop(ctx, NIGHT_INK, 0.52);
      scatter(rng.fork('lamps'), W, [12, 30], (x) => wrapped(W, x, 8, (xx) => { const y = rng.range(200, 238); glow(ctx, xx, y, 7, P.marigold, 0.6); dab(ctx, xx, y, 1.3, 1.6, 0, P.haldi, 1); }));
      scatter(rng.fork('red'), W, [500, 800], (x) => wrapped(W, x, 8, (xx) => { glow(ctx, xx, 110, 10, P.neonRani, 0.7); dab(ctx, xx, 110, 2, 2, 0, P.neonRani, 1); }), 200);
    },
    near: (ctx, rng, W) => {
      // The sea in front of the coast, a moon-path on it, and children's lamp-boats floating out.
      vGradient(ctx, 0, 28, W, 112, [[0, mix(P.neel, P.peacock, 0.3), 0], [0.12, mix(P.neel, P.peacock, 0.3), 1], [1, mix(P.neel, P.ink, 0.3), 1]]);
      for (let i = 0; i < 340; i++) {
        const x = rng.next() * W, y = 36 + rng.next() * 100;
        const l = 4 + (y - 30) * 0.12;
        wrapped(W, x, l, (xx) => taperStroke(ctx, [{ x: xx - l, y }, { x: xx + l, y }], 1.2, rng.chance(0.7) ? mix(P.peacock, P.limewhite, 0.3) : P.haldi, 0.35));
      }
      scatter(rng.fork('boats'), W, [30, 80], (x) => wrapped(W, x, 10, (xx) => {
        const y = rng.range(46, 134), s = 0.5 + (y - 40) / 140;
        glow(ctx, xx, y - 3 * s, 10 * s, P.marigold, 0.55);
        ctx.fillStyle = mix(P.limewhite, P.chandan, 0.2);
        ctx.beginPath(); ctx.moveTo(xx - 5 * s, y - 2 * s); ctx.lineTo(xx + 5 * s, y - 2 * s); ctx.lineTo(xx + 3 * s, y); ctx.lineTo(xx - 3 * s, y); ctx.closePath(); ctx.fill();
        dab(ctx, xx, y - 4 * s, 0.8 * s, 1.4 * s, 0, P.haldi, 1);
      }));
    },
    fore: 'none',
    sign: { date: 'Kartika Purnima 2150', title: 'Bali Jatra' },
    landmarks: [
      {
        // A star-boita lifts off from the beach as the Bali Jatra crowd raises its lamps.
        at: 0.14, plane: 'mid', w: 780, h: 340, y: 456,
        paint: (ctx, rng, w, h) => {
          launchingBoita(ctx, rng, w * 0.68, h - 180, 1.25, -0.38, 1);
          ctx.fillStyle = mix(mix(P.limewhite, P.neel, 0.4), P.ink, 0.2);
          ctx.fillRect(w * 0.3, h - 26, 90, 8);
          crowd(ctx, rng, 20, w - 20, h - 6, 1.1, { poses: ['lamp', 'lamp', 'armsUp', 'wave'], density: 1.3 });
          tintAtop(ctx, NIGHT_INK, 0.3, 0, h - 50, w, 50);
          for (let i = 0; i < 26; i++) { const x = 30 + rng.next() * (w - 60); glow(ctx, x, h - 22 - rng.next() * 8, 8, P.marigold, 0.55); }
        },
      },
      {
        // The fleet climbs toward the full moon, each ship trailing lamplight.
        at: 0.4, plane: 'far', w: 760, h: 300, y: 380,
        paint: (ctx, rng, _w, _h) => {
          const ships: [number, number, number][] = [[140, 230, 0.5], [300, 170, 0.42], [470, 120, 0.36], [620, 70, 0.3]];
          ships.forEach(([x, y, s], i) => launchingBoita(ctx, rng.fork(i), x, y, s, -0.3, 0.8));
        },
      },
      {
        // On the shore a grandmother and a child float a paper boita with a lamp — as they did in Lesson 3.
        at: 0.62, plane: 'mid', w: 300, h: 180, y: 462,
        paint: (ctx, rng, w, h) => {
          const sand = () => { ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h - 30); ctx.quadraticCurveTo(w * 0.4, h - 40, w * 0.6, h - 14); ctx.lineTo(w * 0.6, h); ctx.closePath(); };
          paintedShape(ctx, rng, sand, { x: 0, y: h - 40, w: w * 0.6, h: 40 }, { base: mix(P.chandan, P.neel, 0.45), light: mix(P.limewhite, P.neel, 0.3), shade: mix(P.chandan, P.neel, 0.65), dabs: 40 });
          person(ctx, 60, h - 32, 1.4, { pose: 'lamp', cloth: P.limewhite, cloth2: P.sindoor, sari: true, head: 'veil', skin: 0.7 });
          person(ctx, 100, h - 26, 1.1, { pose: 'bend', cloth: P.haldi, cloth2: P.sindoor, head: 'bun', skin: 0.4 });
          const bx = w * 0.72, by = h - 10;
          glow(ctx, bx, by - 10, 40, P.marigold, 0.6);
          ctx.fillStyle = P.limewhite;
          ctx.beginPath(); ctx.moveTo(bx - 14, by - 6); ctx.lineTo(bx + 14, by - 6); ctx.lineTo(bx + 9, by); ctx.lineTo(bx - 9, by); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(bx - 2, by - 6); ctx.lineTo(bx - 2, by - 22); ctx.lineTo(bx + 8, by - 8); ctx.closePath(); ctx.fill();
          diya(ctx, bx + 5, by - 6, 1.2);
          for (let i = 0; i < 6; i++) taperStroke(ctx, [{ x: bx - 30 + i * 12, y: by + 2 }, { x: bx - 22 + i * 12, y: by + 2 }], 1.2, P.haldi, 0.5);
        },
      },
      {
        // A boita and a conch traced in the stars, Pattachitra-style.
        at: 0.84, plane: 'far', w: 560, h: 260, y: 330,
        paint: (ctx, _rng, _w, _h) => {
          const b0 = 40;
          starFigure(ctx, [
            curvePts(b0, 160, b0 + 120, 200, b0 + 250, 150, 14),
            [{ x: b0 + 120, y: 182 }, { x: b0 + 120, y: 50 }],
            [{ x: b0 + 70, y: 70 }, { x: b0 + 170, y: 70 }, { x: b0 + 165, y: 140 }, { x: b0 + 75, y: 140 }, { x: b0 + 70, y: 70 }],
            curvePts(b0, 160, b0 + 10, 140, b0 + 4, 124, 6),
          ], [{ x: b0, y: 160 }, { x: b0 + 250, y: 150 }, { x: b0 + 120, y: 50 }, { x: b0 + 70, y: 70 }, { x: b0 + 165, y: 140 }, { x: b0 + 4, y: 124 }]);
          const c0 = 400;
          starFigure(ctx, [
            curvePts(c0, 60, c0 + 70, 70, c0 + 110, 130, 10),
            curvePts(c0 + 110, 130, c0 + 70, 190, c0 + 20, 150, 10),
            curvePts(c0 + 20, 150, c0 + 40, 110, c0, 60, 10),
            curvePts(c0 + 30, 100, c0 + 60, 110, c0 + 70, 140, 6),
          ], [{ x: c0, y: 60 }, { x: c0 + 110, y: 130 }, { x: c0 + 20, y: 150 }, { x: c0 + 70, y: 140 }], P.limewhite);
        },
      },
    ],
  }),

  // f7 · 2200 · Rath Yatra — some things never change. Classic palette, no neon, no hazards.
  f7: () => ({
    id: 'f7',
    sky: { stops: [[0, mix(P.seafoam, P.skyCream, 0.3)], [0.55, mix(P.skyCream, P.seafoam, 0.22)], [1, P.skyCream]], sun: { x: 1060, y: 96, r: 36, rays: true }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.peacock, P.skyCream, 0.6), b: P.peacock, height: [8, 26], haze: 0.6 }],
    ground: { kind: 'land', plain: mix(P.chandan, P.limewhite, 0.35), plainDetail: 'sand', path: mix(P.laterite, P.chandan, 0.4), verge: mix(P.chandan, P.laterite, 0.35) },
    mid: (ctx, rng, W) => {
      // Puri, unrecognisable: hazy towers with hanging gardens behind the old mathas of Bada Danda.
      const bodies = [P.limewhite, mix(P.peacock, P.limewhite, 0.45), mix(P.laterite, P.chandan, 0.4), mix(P.marigold, P.limewhite, 0.5), mix(P.tota, P.limewhite, 0.5)];
      scatter(rng.fork('towers'), W, [70, 130], (x) => {
        const w = rng.range(30, 52), h = rng.range(130, 230);
        wrapped(W, x, w, (xx) => futureTower(ctx, rng.fork(x), xx, 200, w, h, { body: rng.pick(bodies), glass: mix(P.peacock, P.seafoam, 0.5), crown: rng.pick(['dome', 'leaf', 'saucer', 'spire'] as const), haze: 0.55, lit: 0.05 }));
      });
      scatter(rng.fork('mathas'), W, [54, 80], (x, i) => wrapped(W, x, 40, (xx) => {
        const w = rng.range(46, 66), h = rng.range(56, 80);
        house(ctx, rng.fork(x), xx, 236, w, h, { roof: 'flat', wall: rng.pick([P.limewhite, mix(P.limewhite, P.marigold, 0.25), mix(P.limewhite, P.seafoam, 0.3)]), door: rng.pick([P.peacock, P.sindoor]) });
        // people on the rooftops to watch the chariots
        if (i % 2 === 0) crowd(ctx, rng.fork(x + 1), xx - w / 2 + 6, xx + w / 2 - 6, 236 - h * 0.9 - 4, 0.75, { density: 2 });
        if (i % 3 === 0) flag(ctx, xx + w / 2 - 4, 236 - h * 0.9 - 4, 30, P.sindoor, 0, 1);
      }));
      bank(ctx, rng.fork('bank'), W, 238, mix(P.chandan, P.limewhite, 0.3), mix(P.chandan, P.laterite, 0.3));
      crowd(ctx, rng.fork('crowd'), 0, W, 248, 0.85, { density: 0.9 });
    },
    near: (ctx, rng, W) => {
      // The crowd along the road: kirtan drummers, cymbals, conches, Pipili umbrellas, and the helper robots.
      scatter(rng.fork('groups'), W, [200, 300], (x, i) => wrapped(W, x, 100, (xx) => {
        const r = rng.fork(x);
        crowd(ctx, r, xx - 80, xx + 80, 132, 1.15, { poses: ['stand', 'armsUp', 'drum', 'cymbal', 'conch', 'wave'], density: 1.25 });
        if (i % 2 === 0) chhati(ctx, xx + r.range(-40, 40), 74, 18, [P.sindoor, P.haldi, P.tota, P.ink]);
        if (i % 3 === 1) robotClassic(ctx, xx + 96, 134, 1.1, 1);
      }));
    },
    fore: 'flowers',
    sign: { date: '2200', title: 'Rath Yatra' },
    landmarks: [
      {
        // Shree Mandira, lime-white as ever, with the towers of the new city behind.
        at: 0.08, plane: 'mid', w: 520, h: 330, y: 452,
        paint: (ctx, rng, w, h) => {
          jagannathTemple(ctx, rng, w / 2 - 10, h - 30, 1.05, 0.04);
          ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.12);
          ctx.fillRect(10, h - 34, w - 20, 26);
          for (let x = 14; x < w - 10; x += 14) { ctx.fillRect(x, h - 40, 8, 6); }
        },
      },
      {
        // Taladhwaja (Balabhadra): red and green — first in the procession.
        at: 0.3, plane: 'mid', w: 720, h: 370, y: 460,
        paint: (ctx, rng, w, h) => chariotGroup(ctx, rng, w, h, [P.sindoor, P.tota], false),
      },
      {
        // Darpadalana (Subhadra): red and black.
        at: 0.52, plane: 'mid', w: 720, h: 370, y: 460,
        paint: (ctx, rng, w, h) => chariotGroup(ctx, rng, w, h, [P.sindoor, P.ink], false),
      },
      {
        // Nandighosa (Jagannath): red and yellow, its platform swept with a golden broom.
        at: 0.74, plane: 'mid', w: 720, h: 370, y: 460,
        paint: (ctx, rng, w, h) => chariotGroup(ctx, rng, w, h, [P.sindoor, P.haldi], true),
      },
      {
        // Little robots sweep the road ahead; a cow sits in the middle of it and is swept around, politely.
        at: 0.86, plane: 'near', w: 320, h: 90, y: 552,
        paint: (ctx, _rng, w, h) => {
          cow(ctx, w / 2, h - 4, 1.2, { facing: -1, grazing: true });
          robotClassic(ctx, w / 2 - 70, h - 2, 1.1, 1);
          robotClassic(ctx, w / 2 + 70, h - 2, 1.1, -1);
          robotClassic(ctx, w / 2 + 120, h - 2, 1, -1);
          for (let k = 0; k < 8; k++) dab(ctx, w / 2 - 40 + k * 6, h - 4, 1.6, 1, 0, P.marigold, 0.9);
        },
      },
      {
        // The Gundicha temple waiting at the far end of Bada Danda.
        at: 0.97, plane: 'mid', w: 360, h: 240, y: 452,
        paint: (ctx, rng, w, h) => {
          pidhaHall(ctx, rng, w / 2 - 60, h - 10, 80, 104, { stone: P.limewhite });
          rekhaDeula(ctx, rng, w / 2 + 30, h - 10, 190, { stone: P.limewhite, flagColour: P.sindoor });
          ctx.fillStyle = mix(P.limewhite, P.khondalite, 0.15);
          ctx.fillRect(10, h - 26, w - 20, 18);
        },
      },
    ],
  }),

  // f8 · ∞ · The voyage never ended — a sea of stars becoming a sea of water.
  f8: () => ({
    id: 'f8',
    sky: {
      stops: [[0, mix(P.neel, P.ink, 0.55)], [0.38, mix(P.neel, P.ink, 0.2)], [0.6, P.neel], [0.635, mix(P.neel, P.peacock, 0.45)], [0.66, mix(P.neel, P.peacock, 0.2)], [1, mix(P.neel, P.ink, 0.4)]],
      stars: 320,
      halftone: mix(P.neel, P.limewhite, 0.3),
      clouds: 'none',
      cloudTint: mix(P.neel, P.ink, 0.3),
    },
    far: [],
    ground: { kind: 'air', water: { sky: mix(P.neel, P.peacock, 0.3), light: mix(P.neel, P.peacock, 0.35), mid: mix(P.neel, P.ink, 0.2), deep: mix(P.neel, P.ink, 0.45) } },
    mid: (ctx, rng, W) => {
      // The horizon where the stars turn into sea, and the fleet sailing along it.
      vGradient(ctx, 0, 236, W, 24, [[0, mix(P.neel, P.peacock, 0.4), 1], [1, mix(P.neel, P.ink, 0.2), 1]]);
      ctx.fillStyle = withAlpha(P.neonCyan, 0.55);
      ctx.fillRect(0, 235, W, 1.2);
      vGradient(ctx, 0, 200, W, 36, [[0, P.neonCyan, 0], [1, P.neonCyan, 0.12]]);
      starField(ctx, rng.fork('refl'), 0, 238, W, 22, 160, 0);
      scatter(rng.fork('fleet'), W, [230, 380], (x, i) => wrapped(W, x, 60, (xx) => {
        const s = rng.range(0.3, 0.48);
        const y = 228 - (i % 3) * 26 - rng.range(0, 12);
        boitaShip(ctx, rng.fork(x), xx, y, s, { space: true, lamps: true, sail: mix(P.limewhite, P.seafoam, 0.3), sail2: i % 2 ? P.neonRani : P.sindoor });
        taperStroke(ctx, [{ x: xx - 150 * s, y: y - 2 }, { x: xx - 60 * s, y: y - 2 }], 3 * s, P.haldi, 0.35, [0.05, 1]);
      }));
    },
    near: (ctx, rng, W) => {
      // The sea: starlight laid on the water in short strokes.
      vGradient(ctx, 0, 0, W, 140, [[0, mix(P.neel, P.ink, 0.2), 0.0], [0.15, mix(P.neel, P.ink, 0.2), 1], [1, mix(P.neel, P.ink, 0.4), 1]]);
      for (let i = 0; i < 520; i++) {
        const y = 14 + rng.next() * 124, x = rng.next() * W;
        const l = 2 + y * 0.06;
        wrapped(W, x, l, (xx) => taperStroke(ctx, [{ x: xx - l, y }, { x: xx + l, y }], 1 + y * 0.01, rng.chance(0.6) ? P.haldi : P.limewhite, rng.range(0.2, 0.6)));
      }
      for (let i = 0; i < 120; i++) {
        const y = 14 + rng.next() * 124, x = rng.next() * W;
        const l = 8 + y * 0.2;
        wrapped(W, x, l, (xx) => taperStroke(ctx, curvePts(xx - l, y, xx, y - 2, xx + l, y, 5), 1.4, mix(P.peacock, P.neel, 0.3), 0.4));
      }
    },
    fore: 'none',
    sign: { date: '∞', title: 'New seas' },
    landmarks: [
      {
        // A fish traced in stars in the Pattachitra manner.
        at: 0.16, plane: 'mid', w: 360, h: 240, y: 330,
        paint: (ctx, _rng, w, h) => {
          const cx = w / 2, cy = h / 2;
          starFigure(ctx, [
            curvePts(cx - 120, cy, cx - 20, cy - 80, cx + 90, cy, 14),
            curvePts(cx - 120, cy, cx - 20, cy + 80, cx + 90, cy, 14),
            [{ x: cx + 90, y: cy }, { x: cx + 140, y: cy - 40 }, { x: cx + 130, y: cy }, { x: cx + 140, y: cy + 40 }, { x: cx + 90, y: cy }],
            curvePts(cx - 40, cy - 38, cx - 30, cy, cx - 40, cy + 38, 8),
            curvePts(cx, cy - 40, cx + 10, cy, cx, cy + 40, 8),
          ], [{ x: cx - 120, y: cy }, { x: cx + 90, y: cy }, { x: cx + 140, y: cy - 40 }, { x: cx + 140, y: cy + 40 }, { x: cx - 20, y: cy - 40 }, { x: cx - 20, y: cy + 40 }]);
          dab(ctx, cx - 96, cy - 6, 5, 5, 0, P.limewhite, 0.9);
          dab(ctx, cx - 96, cy - 6, 2, 2, 0, P.ink, 1);
        },
      },
      {
        // An elephant in stars, trunk raised in greeting.
        at: 0.34, plane: 'mid', w: 380, h: 250, y: 320,
        paint: (ctx, _rng, w, h) => {
          const cx = w / 2, cy = h / 2 + 10;
          starFigure(ctx, [
            curvePts(cx - 100, cy + 20, cx - 20, cy - 90, cx + 80, cy - 10, 14),
            curvePts(cx + 80, cy - 10, cx + 130, cy - 40, cx + 140, cy - 90, 10),
            curvePts(cx - 100, cy + 20, cx - 10, cy + 40, cx + 80, cy + 20, 10),
            [{ x: cx - 80, y: cy + 28 }, { x: cx - 80, y: cy + 80 }], [{ x: cx - 40, y: cy + 34 }, { x: cx - 40, y: cy + 82 }],
            [{ x: cx + 30, y: cy + 32 }, { x: cx + 30, y: cy + 80 }], [{ x: cx + 66, y: cy + 24 }, { x: cx + 66, y: cy + 78 }],
            curvePts(cx + 30, cy - 30, cx + 10, cy, cx + 40, cy + 10, 6),
          ], [{ x: cx - 100, y: cy + 20 }, { x: cx + 80, y: cy - 10 }, { x: cx + 140, y: cy - 90 }, { x: cx - 80, y: cy + 80 }, { x: cx + 66, y: cy + 78 }, { x: cx - 20, y: cy - 50 }], P.limewhite);
        },
      },
      {
        // The mardala moon: the drum that keeps the rhythm of the whole voyage.
        at: 0.5, plane: 'far', w: 780, h: 600, y: 570,
        paint: (ctx, rng, w, h) => {
          const cx = w / 2 + 110, cy = h / 2 - 10, r = 120;
          for (let k = 1; k <= 4; k++) { ctx.strokeStyle = withAlpha(k % 2 ? P.neonCyan : P.haldi, 0.22 - k * 0.035); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r + k * 34, 0, Math.PI * 2); ctx.stroke(); }
          glow(ctx, cx, cy, r * 2.1, P.haldi, 0.22);
          // the barrel, receding to the left
          const bl = r * 1.7;
          const barrel = () => { ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.bezierCurveTo(cx - bl * 0.4, cy - r * 1.18, cx - bl * 0.75, cy - r * 1.05, cx - bl, cy - r * 0.78); ctx.lineTo(cx - bl, cy + r * 0.78); ctx.bezierCurveTo(cx - bl * 0.75, cy + r * 1.05, cx - bl * 0.4, cy + r * 1.18, cx, cy + r); ctx.closePath(); };
          paintedShape(ctx, rng, barrel, { x: cx - bl, y: cy - r * 1.2, w: bl, h: r * 2.4 }, { base: mix(P.laterite, P.sindoor, 0.25), light: mix(P.marigold, P.haldi, 0.3), shade: mix(P.laterite, P.ink, 0.45), lightFrom: 'right', dabs: 90 });
          clipTo(ctx, barrel, () => {
            for (const t of [0.3, 0.5, 0.7]) { ctx.fillStyle = withAlpha(P.haldi, 0.75); ctx.fillRect(cx - bl * t - 3, cy - r * 1.3, 6, r * 2.6); }
          });
          dab(ctx, cx - bl, cy, r * 0.22, r * 0.78, 0, mix(P.chandan, P.limewhite, 0.3), 1);
          // lacing
          for (let i = 0; i < 16; i++) {
            const a = -Math.PI / 2 + (i / 15) * Math.PI;
            const fy = cy + Math.sin(a) * r * 0.98;
            const by = cy + Math.sin(a + (i % 2 ? 0.12 : -0.12)) * r * 0.76;
            taperStroke(ctx, [{ x: cx - Math.cos(a) * 6, y: fy }, { x: cx - bl + 4, y: by }], 2.4, mix(P.chandan, P.laterite, 0.4), 0.9, [1, 1]);
          }
          // the face: the full moon itself, with the drum's dark tuning spot at its heart
          glow(ctx, cx, cy, r * 1.5, P.limewhite, 0.3);
          dab(ctx, cx, cy, r, r, 0, mix(P.limewhite, P.haldi, 0.25), 1);
          for (let i = 0; i < 8; i++) dab(ctx, cx + rng.range(-0.6, 0.6) * r, cy + rng.range(-0.6, 0.6) * r, rng.range(8, 20), rng.range(6, 14), 0, mix(P.limewhite, P.khondalite, 0.25), 0.35);
          ctx.strokeStyle = mix(P.chandan, P.laterite, 0.45);
          ctx.lineWidth = 7;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          // the drum's tuning spot, faint, like a sea on the moon
          dab(ctx, cx + r * 0.08, cy + r * 0.05, r * 0.24, r * 0.22, 0, mix(P.khondalite, P.neel, 0.3), 0.4);
          // lacing loops around the rim of the face
          for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            dab(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, 3.4, a, mix(P.chandan, P.haldi, 0.3), 1);
            dab(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.6, 1.6, 0, mix(P.laterite, P.ink, 0.3), 1);
          }
        },
      },
      {
        // The first dugout canoe of Lesson 1, its paddler drawn in stars.
        at: 0.8, plane: 'mid', w: 460, h: 260, y: 330,
        paint: (ctx, _rng, w, h) => {
          const cx = w / 2, cy = h / 2 + 40;
          starFigure(ctx, [
            curvePts(cx - 160, cy - 14, cx, cy + 40, cx + 160, cy - 14, 16),
            curvePts(cx - 150, cy - 10, cx, cy + 6, cx + 150, cy - 10, 16),
            [{ x: cx + 10, y: cy }, { x: cx + 14, y: cy - 60 }],
            [{ x: cx + 14, y: cy - 60 }, { x: cx + 14, y: cy - 82 }],
            [{ x: cx + 14, y: cy - 50 }, { x: cx + 54, y: cy - 30 }, { x: cx + 80, y: cy + 30 }],
            [{ x: cx + 76, y: cy + 20 }, { x: cx + 90, y: cy + 56 }],
          ], [{ x: cx - 160, y: cy - 14 }, { x: cx + 160, y: cy - 14 }, { x: cx + 14, y: cy - 86 }, { x: cx + 10, y: cy }, { x: cx + 90, y: cy + 56 }, { x: cx, y: cy + 14 }]);
          dab(ctx, cx + 14, cy - 88, 8, 8, 0, P.haldi, 0.25);
        },
      },
      {
        // The flagship of the fleet passes close, its crew waving.
        at: 0.56, plane: 'mid', w: 320, h: 200, y: 452,
        paint: (ctx, rng, w, h) => {
          boitaShip(ctx, rng, w / 2, h - 30, 1.3, { space: true, lamps: true, sail: mix(P.limewhite, P.seafoam, 0.3), sail2: P.neonRani });
          for (let k = 0; k < 3; k++) person(ctx, w / 2 - 30 + k * 26, h - 46, 0.8, { pose: 'wave', cloth: [P.haldi, P.rani, P.peacock][k], skin: 0.3 + k * 0.2 });
          taperStroke(ctx, [{ x: 0, y: h - 32 }, { x: w / 2 - 80, y: h - 32 }], 6, P.haldi, 0.3, [0.05, 1]);
        },
      },
      {
        // A new shore: a child floats a tiny paper boita with a lamp.
        at: 0.96, plane: 'mid', w: 340, h: 150, y: 462,
        paint: (ctx, rng, w, h) => {
          const sand = () => { ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h - 34); ctx.quadraticCurveTo(w * 0.35, h - 44, w * 0.55, h - 12); ctx.lineTo(w * 0.55, h); ctx.closePath(); };
          paintedShape(ctx, rng, sand, { x: 0, y: h - 44, w: w * 0.55, h: 44 }, { base: mix(P.chandan, P.neel, 0.4), light: mix(P.limewhite, P.seafoam, 0.3), shade: mix(P.chandan, P.neel, 0.65), dabs: 40 });
          coconutPalm(ctx, rng, 40, h - 34, 100, -0.1, 0);
          tintAtop(ctx, NIGHT_INK, 0.35);
          person(ctx, 120, h - 28, 1.3, { pose: 'bend', cloth: P.haldi, cloth2: P.sindoor, head: 'bun', skin: 0.4 });
          const bx = w * 0.68, by = h - 8;
          glow(ctx, bx, by - 10, 46, P.marigold, 0.6);
          ctx.fillStyle = P.limewhite;
          ctx.beginPath(); ctx.moveTo(bx - 14, by - 6); ctx.lineTo(bx + 14, by - 6); ctx.lineTo(bx + 9, by); ctx.lineTo(bx - 9, by); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(bx - 2, by - 6); ctx.lineTo(bx - 2, by - 22); ctx.lineTo(bx + 8, by - 8); ctx.closePath(); ctx.fill();
          diya(ctx, bx + 5, by - 6, 1.2);
        },
      },
    ],
  }),
};

/** One Rath Yatra chariot with its ropes and pullers; `sweeper` adds the golden-broom sweeping on its platform. */
function chariotGroup(ctx: Ctx, rng: Rng, w: number, h: number, canopy: [string, string], sweeper: boolean): void {
  const s = 1.8;
  const cx = w * 0.3, base = h - 6;
  chariot(ctx, rng, cx, base, s, canopy);
  if (sweeper) person(ctx, cx - 20, base - 50 * s, 1.1, { pose: 'sweep', cloth: P.limewhite, cloth2: P.haldi, head: 'turban', skin: 0.55 });
  else for (let k = 0; k < 3; k++) person(ctx, cx - 36 + k * 34, base - 50 * s, 1, { pose: k === 1 ? 'conch' : 'stand', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: 0.4 + k * 0.15 });
  // four thick ropes sweeping forward to the pullers
  const rope = mix(P.chandan, P.laterite, 0.35);
  for (let k = 0; k < 3; k++) {
    const y0 = base - 30 * s + k * 6;
    taperStroke(ctx, curvePts(cx + 60 * s, y0, cx + 180, base - 4 + k * 2, w - 10, base - 20 + k * 4, 12), 3.6, rope, 1, [1, 1]);
  }
  crowd(ctx, rng, cx + 120, w - 10, base, 1.15, { poses: ['pull', 'pull', 'pull', 'armsUp'], facing: 1, density: 1.0 });
}

