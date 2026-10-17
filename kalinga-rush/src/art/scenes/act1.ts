// Act I · Kalinga Sagar (records 02–05). Lead: peacock; supports seafoam,
// laterite, haldi. Record 01 has its own hand-built painter (records/r01.ts).
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, dabField, glow, makeCanvas, paintedShape, polyPath, softShadow, taperStroke, wrapped, type Ctx } from '../brush';
import { bank, scatter, treeRow, type SceneDef } from '../engine';
import { caveHill, cityWall, house, stall } from '../kit/buildings';
import { boitaShip, bullockCartBg } from '../kit/craft';
import { chhati, crowd, person } from '../kit/people';
import { cat, cow, crow, elephant, goat, monkey } from '../kit/animals';
import { broadTree, coconutPalm, egret, lotusFlower, lotusPad, palmyraPalm, reedTuft } from '../shared/nature';

const ACT1_SKY: [number, string][] = [[0, mix(P.seafoam, P.skyCream, 0.35)], [0.55, mix(P.skyCream, P.seafoam, 0.25)], [1, P.skyCream]];

const hz = (c: string, h = 0) => (h ? mix(c, P.skyCream, h) : c);

// ---- small local props -------------------------------------------------------------

/** A little banana-bark boat carrying a diya and marigolds (Boita Bandana). (x, y) = waterline centre. */
function lampBoat(ctx: Ctx, x: number, y: number, s: number, haze = 0): void {
  glow(ctx, x, y - 5 * s, 16 * s, P.marigold, 0.42);
  softShadow(ctx, x, y + 1 * s, 11 * s, 2 * s, P.ink, 0.25);
  const bark = hz(mix(P.tota, P.haldi, 0.4), haze);
  const barkD = hz(mix(P.tota, P.laterite, 0.45), haze);
  ctx.fillStyle = barkD;
  ctx.beginPath();
  ctx.moveTo(x - 11 * s, y - 5 * s);
  ctx.quadraticCurveTo(x, y + 3.5 * s, x + 11 * s, y - 5 * s);
  ctx.quadraticCurveTo(x, y - 1 * s, x - 11 * s, y - 5 * s);
  ctx.fill();
  dab(ctx, x, y - 1.6 * s, 8 * s, 1.4 * s, 0, bark, 1);
  dab(ctx, x - 4.5 * s, y - 2.6 * s, 1.6 * s, 1.4 * s, 0, P.marigold, 1);
  dab(ctx, x + 4.8 * s, y - 2.6 * s, 1.5 * s, 1.3 * s, 0, P.haldi, 1);
  dab(ctx, x, y - 2.8 * s, 2.6 * s, 1.2 * s, 0, P.laterite, 1);
  dab(ctx, x, y - 5.2 * s, 0.9 * s, 2.1 * s, 0, P.marigold, 1);
  dab(ctx, x, y - 4.6 * s, 0.45 * s, 1 * s, 0, P.haldi, 1);
}

/** A jute sack of pepper. (x, y) = bottom centre. */
function sack(ctx: Ctx, x: number, y: number, s: number, haze = 0, tint = 0): void {
  const jute = hz(mix(mix(P.chandan, P.khondalite, 0.3), P.haldi, tint), haze);
  dab(ctx, x, y - 6 * s, 6 * s, 6.4 * s, 0, jute, 1);
  dab(ctx, x + 1.5 * s, y - 8 * s, 3 * s, 3 * s, 0, hz(mix(jute, P.limewhite, 0.3), haze), 0.6);
  dab(ctx, x - 1.5 * s, y - 2.5 * s, 4.4 * s, 2 * s, 0, hz(mix(jute, P.ink, 0.3), haze), 0.45);
  taperStroke(ctx, [{ x: x - 2 * s, y: y - 12 * s }, { x: x + 2 * s, y: y - 12.6 * s }], 1.6 * s, hz(mix(jute, P.ink, 0.35), haze), 1, [1, 1]);
  dab(ctx, x, y - 13.6 * s, 1.6 * s, 1.2 * s, 0, jute, 1);
}

/** Only the head of a cat, peeking over something. */
function catHead(ctx: Ctx, x: number, y: number, s: number, colour: string): void {
  dab(ctx, x, y, 4.2 * s, 3.6 * s, 0, colour, 1);
  ctx.fillStyle = colour;
  ctx.beginPath(); ctx.moveTo(x - 3.8 * s, y - 1.5 * s); ctx.lineTo(x - 3 * s, y - 6.4 * s); ctx.lineTo(x - 0.6 * s, y - 3 * s); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 3.8 * s, y - 1.5 * s); ctx.lineTo(x + 3 * s, y - 6.4 * s); ctx.lineTo(x + 0.6 * s, y - 3 * s); ctx.closePath(); ctx.fill();
  dab(ctx, x - 1.5 * s, y - 0.4 * s, 0.8 * s, 1 * s, 0, P.tota, 1);
  dab(ctx, x + 1.5 * s, y - 0.4 * s, 0.8 * s, 1 * s, 0, P.tota, 1);
  dab(ctx, x - 1.5 * s, y - 0.3 * s, 0.3 * s, 0.8 * s, 0, P.ink, 1);
  dab(ctx, x + 1.5 * s, y - 0.3 * s, 0.3 * s, 0.8 * s, 0, P.ink, 1);
  dab(ctx, x, y + 1.2 * s, 0.6 * s, 0.4 * s, 0, P.rani, 1);
  for (const k of [-1, 1]) taperStroke(ctx, [{ x: x + k * 1.5 * s, y: y + 1.4 * s }, { x: x + k * 6 * s, y: y + 0.6 * s }], 0.35 * s, P.limewhite, 0.8, [1, 1]);
}

/** A distant gull: two curved strokes. */
function gull(ctx: Ctx, x: number, y: number, s: number, colour: string): void {
  taperStroke(ctx, curvePts(x - 6 * s, y - 1 * s, x - 3 * s, y - 4 * s, x, y, 5), 1.4 * s, colour, 0.9, [0.2, 0.6]);
  taperStroke(ctx, curvePts(x, y, x + 3 * s, y - 4 * s, x + 6 * s, y - 1 * s, 5), 1.4 * s, colour, 0.9, [0.6, 0.2]);
}

/** A small one-sail fishing boat, far away. (x, y) = waterline. */
function dinghy(ctx: Ctx, x: number, y: number, s: number, haze: number, sail: string): void {
  const wood = hz(mix(P.laterite, P.ink, 0.2), haze);
  ctx.fillStyle = wood;
  ctx.beginPath(); ctx.moveTo(x - 16 * s, y - 5 * s); ctx.quadraticCurveTo(x, y + 3 * s, x + 16 * s, y - 6 * s); ctx.lineTo(x - 16 * s, y - 5 * s); ctx.fill();
  taperStroke(ctx, [{ x, y: y - 4 * s }, { x: x + 1 * s, y: y - 30 * s }], 1.2 * s, wood, 1, [1, 1]);
  ctx.fillStyle = hz(sail, haze);
  ctx.beginPath(); ctx.moveTo(x + 1 * s, y - 29 * s); ctx.quadraticCurveTo(x + 14 * s, y - 18 * s, x + 12 * s, y - 7 * s); ctx.lineTo(x + 1 * s, y - 7 * s); ctx.closePath(); ctx.fill();
  dab(ctx, x - 6 * s, y - 7 * s, 1.8 * s, 2.4 * s, 0, hz(mix(P.chandan, P.laterite, 0.3), haze), 1);
}

/** A simple painted deer (chital), drinking or standing. (x, y) = hooves. */
function deer(ctx: Ctx, x: number, y: number, s: number, f: 1 | -1, drinking: boolean, haze = 0): void {
  const coat = hz(mix(P.chandan, P.laterite, 0.25), haze);
  const dark = hz(mix(P.laterite, P.ink, 0.35), haze);
  const belly = hz(mix(P.limewhite, P.chandan, 0.3), haze);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f * s, s);
  for (const [lx, sh] of [[-11, -1], [-7, 1.5], [8, -1], [12, 1.5]] as const) taperStroke(ctx, [{ x: lx, y: -15 }, { x: lx + sh, y: -7 }, { x: lx + sh * 0.5, y: 0 }], 2, lx < 0 && sh < 0 ? dark : coat, 1, [1, 0.6]);
  dab(ctx, 0, -19, 14, 6.4, 0, coat, 1);
  dab(ctx, 0, -15.5, 10, 2.4, 0, belly, 0.85);
  for (let i = 0; i < 7; i++) dab(ctx, -9 + i * 3, -21 + (i % 2) * 2.4, 0.9, 0.9, 0, P.limewhite, 0.85);
  dab(ctx, -14, -21, 2.6, 2, 0.4, belly, 1);
  if (drinking) {
    taperStroke(ctx, [{ x: 11, y: -21 }, { x: 16, y: -12 }, { x: 18, y: -4 }], 5, coat, 1, [1, 0.7]);
    dab(ctx, 19.5, -3, 3.6, 2.4, 1.1, coat, 1);
    taperStroke(ctx, [{ x: 17, y: -8 }, { x: 13, y: -10 }], 1.6, coat, 1, [1, 0.3]);
  } else {
    taperStroke(ctx, [{ x: 11, y: -22 }, { x: 15, y: -32 }], 5, coat, 1, [1, 0.8]);
    dab(ctx, 18, -33, 4, 2.6, 0.3, coat, 1);
    taperStroke(ctx, [{ x: 14, y: -35 }, { x: 11, y: -38 }], 1.6, coat, 1, [1, 0.3]);
    dab(ctx, 18, -34, 0.7, 0.7, 0, hz(P.ink, haze), 1);
  }
  ctx.restore();
}

/** Ghat steps going down into water. (x0..x1) at top y, `n` steps of height sh. */
function ghatSteps(ctx: Ctx, rng: Rng, x0: number, x1: number, y: number, n: number, sh: number, stone: string): void {
  for (let i = 0; i < n; i++) {
    const yy = y + i * sh;
    const inset = i * sh * 0.6;
    paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x0 - inset, y: yy }, { x: x1 + inset, y: yy }, { x: x1 + inset, y: yy + sh }, { x: x0 - inset, y: yy + sh }]), { x: x0 - inset, y: yy, w: x1 - x0 + inset * 2, h: sh }, { base: stone, light: mix(stone, P.limewhite, 0.35), shade: mix(stone, P.ink, 0.3), dabs: 20 });
    ctx.fillStyle = withAlpha(mix(stone, P.limewhite, 0.5), 0.7);
    ctx.fillRect(x0 - inset, yy, x1 - x0 + inset * 2, 1.2);
  }
}

// ---- record 03 ------------------------------------------------------------------------

const R03_WATER = { sky: mix(P.skyCream, P.marigold, 0.25), light: mix(P.peacock, P.seafoam, 0.55), mid: mix(P.peacock, P.seafoam, 0.18), deep: mix(P.peacock, P.neel, 0.28) };

/** The estuary port on Kartika Purnima: sheds, palms, a docked boita being loaded, the ghat with lamps. */
function paintPort(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const top = h - 70; // land surface
  const edge = h - 44; // waterline of the bank
  const sand = mix(P.chandan, P.skyCream, 0.45);
  const face = mix(P.laterite, P.chandan, 0.3);
  const shore = (x: number) => {
    // land tapers into a sand spit at both ends
    const l = Math.min(1, x / 260), r = Math.min(1, (w - x) / 380);
    return 1 - Math.min(l, r);
  };
  // palms and trees behind the sheds
  for (let x = 120; x < w - 300; x += rng.range(70, 140)) {
    if (rng.chance(0.55)) coconutPalm(ctx, rng.fork(x), x, top + 4, rng.range(120, 170), rng.range(-0.12, 0.12), 0.2);
    else broadTree(ctx, rng.fork(x), x, top + 4, rng.range(80, 120), rng.range(80, 110), 0.25);
  }
  // sheds and houses along the waterfront
  for (const [x, ww, hh, roof] of [[230, 70, 56, 'tile'], [330, 90, 62, 'thatch'], [700, 80, 58, 'tile'], [800, 64, 50, 'thatch'], [1400, 84, 60, 'tile'], [1520, 70, 52, 'thatch'], [1880, 60, 46, 'thatch']] as const) {
    house(ctx, rng.fork(x), x, top + 2, ww, hh, { roof, haze: 0.08 });
  }
  // the land band
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, top + shore(x) * 30 + Math.sin(x * 0.03) * 1.5);
    ctx.lineTo(w, h);
    ctx.closePath();
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, edge + 4);
  ctx.clip();
  path();
  ctx.fillStyle = face;
  ctx.fill();
  clipTo(ctx, path, () => {
    ctx.fillStyle = sand;
    ctx.fillRect(0, top - 2, w, 10);
    dabField(ctx, rng, 0, top - 4, w, edge - top + 8, { n: 900, r: [1.5, 4], colours: [sand, face, mix(face, P.ink, 0.3)], alpha: [0.2, 0.5], aspect: [0.4, 0.8], rot: 0, rotJitter: 0.4 });
  });
  ctx.restore();
  // foam where the bank meets the water
  for (let x = 0; x < w; x += rng.range(8, 20)) {
    const yy = edge + 2 + shore(x) * 8;
    taperStroke(ctx, [{ x, y: yy }, { x: x + rng.range(10, 28), y: yy + 0.5 }], rng.range(1.2, 2.4), P.limewhite, rng.range(0.4, 0.8));
  }

  // -- left: a wooden jetty and a docked boita being loaded with pepper
  const jx = 470;
  const wood = mix(P.laterite, P.ink, 0.3);
  for (let i = 0; i < 6; i++) taperStroke(ctx, [{ x: jx + i * 34, y: top + 6 }, { x: jx + i * 34, y: h - 18 }], 4, wood, 1, [1, 1]);
  ctx.fillStyle = mix(P.laterite, P.chandan, 0.25);
  ctx.fillRect(jx - 10, top + 2, 190, 7);
  ctx.fillStyle = withAlpha(P.ink, 0.25);
  ctx.fillRect(jx - 10, top + 8, 190, 2);
  // stacked sacks and bales on the jetty
  for (let i = 0; i < 5; i++) sack(ctx, jx + 8 + i * 13, top + 3, 1.05, 0, (i % 3) * 0.12);
  for (let i = 0; i < 3; i++) sack(ctx, jx + 14 + i * 13, top - 9, 1, 0, 0.1);
  // the boita, moored alongside
  const bx = jx + 120, by = h - 14;
  boitaShip(ctx, rng.fork('docked'), bx, by, 1.35, { sail: mix(P.limewhite, P.haldi, 0.15), sail2: P.sindoor, cargo: 'bales' });
  // a cat stowaway peeking out between the bales on deck
  dab(ctx, bx - 8, by - 24, 9, 7, 0, mix(P.limewhite, P.chandan, 0.25), 1);
  catHead(ctx, bx - 8, by - 33, 1.5, mix(P.marigold, P.chandan, 0.4));
  // gang-plank and porters carrying sacks on their heads
  taperStroke(ctx, [{ x: jx + 150, y: top + 4 }, { x: bx + 30, y: by - 18 }], 3, mix(P.laterite, P.chandan, 0.35), 1, [1, 1]);
  person(ctx, jx + 166, top + 1, 1.25, { pose: 'carry', cloth: P.limewhite, cloth2: P.haldi, skin: 0.7, facing: 1 });
  person(ctx, jx + 100, top + 4, 1.25, { pose: 'carry', cloth: P.marigold, skin: 0.3, facing: 1 });
  person(ctx, jx + 60, top + 4, 1.2, { pose: 'bend', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: 0.5, facing: -1 });
  // the sadhaba (merchant) with his ledger, counting sacks
  person(ctx, jx - 30, top + 4, 1.35, { pose: 'read', cloth: P.limewhite, cloth2: P.haldi, head: 'turban', skin: 0.45, facing: 1 });
  chhati(ctx, jx - 52, top - 44, 16, [P.sindoor, P.haldi, P.peacock]);

  // -- centre: the ghat, where women float lamp-boats and see the ships off
  const gx0 = 1030, gx1 = 1250;
  ghatSteps(ctx, rng.fork('ghat'), gx0, gx1, top + 2, 4, 7, mix(P.laterite, P.chandan, 0.4));
  const cloths = [P.sindoor, P.rani, P.marigold, P.haldi, P.peacock];
  for (let i = 0; i < 6; i++) {
    const px = gx0 + 12 + i * 38;
    const step = i % 3;
    person(ctx, px, top + 2 + step * 7, 1.2, { pose: i === 2 ? 'conch' : i % 2 ? 'lamp' : 'bend', cloth: cloths[i % cloths.length], cloth2: P.haldi, sari: true, head: 'veil', skin: (i * 0.37) % 1, facing: 1 });
  }
  person(ctx, gx1 + 30, top + 2, 0.85, { pose: 'wave', cloth: P.haldi, skin: 0.6, phase: 1 });
  person(ctx, gx1 + 46, top + 2, 1.15, { pose: 'wave', cloth: P.limewhite, cloth2: P.peacock, head: 'turban', skin: 0.4, phase: 2 });
  // banana plants by the ghat (their bark makes the little boats)
  for (const bxp of [gx0 - 30, gx1 + 90]) {
    taperStroke(ctx, [{ x: bxp, y: top + 2 }, { x: bxp + 1, y: top - 40 }], 6, mix(P.tota, P.haldi, 0.3), 1, [1, 0.7]);
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k - 2.5) * 0.45;
      const ex = bxp + Math.cos(a) * 34, ey = top - 40 + Math.sin(a) * 22 + 10;
      taperStroke(ctx, curvePts(bxp, top - 40, (bxp + ex) / 2, top - 52, ex, ey, 8), 9, k % 2 ? mix(P.tota, P.haldi, 0.25) : mix(P.tota, P.peacock, 0.25), 0.95, [0.3, 0.1]);
    }
  }
  // lamp-boats already drifting out
  for (let i = 0; i < 9; i++) lampBoat(ctx, gx0 - 40 + i * 42 + rng.range(-10, 10), h - 26 + rng.range(-8, 14), rng.range(0.9, 1.2));

  // -- right: the port's end, a drying net and a fisherman mending it
  taperStroke(ctx, [{ x: 1640, y: top + 2 }, { x: 1640, y: top - 34 }], 2.4, wood, 1, [1, 1]);
  taperStroke(ctx, [{ x: 1720, y: top + 2 }, { x: 1720, y: top - 34 }], 2.4, wood, 1, [1, 1]);
  ctx.strokeStyle = withAlpha(mix(P.khondalite, P.limewhite, 0.3), 0.7);
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(1640 + i * 10, top - 32); ctx.quadraticCurveTo(1645 + i * 10, top - 14, 1640 + i * 10, top); ctx.stroke(); }
  for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(1640, top - 30 + j * 8); ctx.quadraticCurveTo(1680, top - 22 + j * 8, 1720, top - 30 + j * 8); ctx.stroke(); }
  person(ctx, 1750, top + 2, 1.15, { pose: 'sit', cloth: P.peacock, skin: 0.8, facing: -1 });
  crow(ctx, 1720, top - 34, 1.1, -1);
  for (const x of [1950, 2080]) reedTuft(ctx, rng.fork(x), x, top + 26, 40, 34, { dark: mix(P.tota, P.neel, 0.4), mid: mix(P.tota, P.peacock, 0.3), tip: mix(P.tota, P.haldi, 0.4) }, 10);
}

/** Two boitas casting off, sailors hauling, a pilot pointing to the open sea. */
function paintCastOff(ctx: Ctx, rng: Rng, w: number, h: number): void {
  boitaShip(ctx, rng.fork('a'), w * 0.3, h - 30, 0.85, { sail: mix(P.limewhite, P.skyCream, 0.2), sail2: P.peacock, cargo: 'bales', haze: 0.25 });
  boitaShip(ctx, rng.fork('b'), w * 0.66, h - 8, 1.3, { sail: P.limewhite, sail2: P.sindoor, cargo: 'bales' });
  // crew on the bigger ship
  const bx = w * 0.66, by = h - 8;
  person(ctx, bx + 52, by - 20, 1.05, { pose: 'point', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: 0.5 });
  person(ctx, bx - 52, by - 22, 1, { pose: 'pull', cloth: P.haldi, skin: 0.8, facing: -1 });
  person(ctx, bx - 64, by - 22, 1, { pose: 'wave', cloth: P.peacock, skin: 0.3, facing: -1, phase: 1 });
  for (let i = 0; i < 4; i++) gull(ctx, bx - 40 + i * 30, by - 150 - (i % 2) * 14, 1.2, mix(P.limewhite, P.khondalite, 0.2));
}

/** The fleet heading out to the golden islands, far on the horizon. */
function paintFleet(ctx: Ctx, rng: Rng, w: number, h: number): void {
  boitaShip(ctx, rng.fork(1), w * 0.2, h - 6, 0.42, { haze: 0.55, sail2: P.sindoor });
  boitaShip(ctx, rng.fork(2), w * 0.5, h - 2, 0.55, { haze: 0.45, sail2: P.haldi });
  boitaShip(ctx, rng.fork(3), w * 0.78, h - 8, 0.36, { haze: 0.6, sail2: P.peacock });
}

/** Out at sea, the port's cat stowaway is found: sunning itself on the sail yard, crew staring up. */
function paintFamilyBoita(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const x = w / 2, y = h - 10, s = 1.35;
  boitaShip(ctx, rng, x, y, s, { sail: mix(P.limewhite, P.haldi, 0.1), sail2: P.sindoor, lamps: true });
  cat(ctx, x + 22 * s, y - 74 * s, 1.5, mix(P.marigold, P.chandan, 0.4), -1);
  person(ctx, x + 6 * s, y - 14 * s, 1.15, { pose: 'armsUp', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: 0.6, facing: 1 });
  person(ctx, x + 40 * s, y - 14 * s, 1.1, { pose: 'point', cloth: P.marigold, skin: 0.7, facing: -1 });
  person(ctx, x - 34 * s, y - 14 * s, 0.8, { pose: 'wave', cloth: P.haldi, skin: 0.35, facing: -1, phase: 2 });
  // a crow perched on the stern, hitching a ride too
  crow(ctx, x - 58 * s, y - 26 * s, 1.1, -1);
  for (let i = 0; i < 3; i++) gull(ctx, x - 90 - i * 26, y - 120 + i * 10, 1.1, P.limewhite);
}

// ---- record 04 ------------------------------------------------------------------------

/** Dhauli hill: a long rocky hill, the elephant emerging from the rock at its foot, edicts below. */
function paintDhauli(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const rock = mix(P.khondalite, P.laterite, 0.3);
  const hill = () => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.bezierCurveTo(w * 0.12, h - 50, w * 0.25, h - 200, w * 0.42, h - 226);
    ctx.bezierCurveTo(w * 0.55, h - 246, w * 0.7, h - 190, w * 0.8, h - 100);
    ctx.bezierCurveTo(w * 0.88, h - 50, w * 0.95, h - 20, w, h);
    ctx.closePath();
  };
  paintedShape(ctx, rng, hill, { x: 0, y: h - 250, w, h: 250 }, { base: mix(rock, P.skyCream, 0.25), light: mix(rock, P.marigold, 0.35), shade: mix(rock, P.neel, 0.35), lightFrom: 'right', dabs: 500 });
  clipTo(ctx, hill, () => {
    for (let i = 0; i < 70; i++) {
      const x = rng.next() * w, y = h - rng.next() * 170;
      dab(ctx, x, y, rng.range(6, 16), rng.range(3, 6), rng.range(-0.3, 0.3), mix(P.tota, P.khondalite, 0.6), rng.range(0.25, 0.5));
    }
    for (let i = 0; i < 14; i++) {
      const x = rng.next() * w, y = h - 20 - rng.next() * 120;
      dab(ctx, x, y, rng.range(10, 22), rng.range(5, 9), 0, mix(rock, P.limewhite, 0.2), 0.5);
    }
  });
  for (let i = 0; i < 7; i++) {
    const x = w * (0.12 + rng.next() * 0.76);
    broadTree(ctx, rng.fork(i), x, h - 60 - rng.next() * 50 + Math.abs(x - w * 0.45) * 0.25, rng.range(34, 50), rng.range(30, 44), 0.5);
  }
  // the rock outcrop at the foot of the hill: the elephant emerging from it, the edicts on its face
  const rx = w * 0.5, ry = h - 2;
  const outcrop = mix(P.khondalite, P.chandan, 0.25);
  const [ec, ectx] = makeCanvas(260, 140);
  elephant(ectx, 110, 132, 1.75, { facing: 1 });
  ectx.globalCompositeOperation = 'source-atop';
  ectx.fillStyle = withAlpha(mix(P.limewhite, P.chandan, 0.35), 0.4);
  ectx.fillRect(0, 0, 260, 140);
  ctx.drawImage(ec, rx - 70, ry - 196);
  const rockPath = () => { ctx.beginPath(); ctx.moveTo(rx - 150, ry); ctx.bezierCurveTo(rx - 150, ry - 90, rx - 80, ry - 150, rx + 10, ry - 132); ctx.lineTo(rx + 20, ry - 66); ctx.bezierCurveTo(rx + 90, ry - 70, rx + 140, ry - 40, rx + 150, ry); ctx.closePath(); };
  paintedShape(ctx, rng.fork('out'), rockPath, { x: rx - 150, y: ry - 150, w: 300, h: 150 }, { base: outcrop, light: mix(outcrop, P.marigold, 0.3), shade: mix(outcrop, P.neel, 0.35), lightFrom: 'right', rim: mix(outcrop, P.ink, 0.5), rimW: 1.5 });
  // the edict panel: rows of incised marks (not real text)
  const px = rx - 120, py = ry - 70;
  ctx.fillStyle = mix(outcrop, P.limewhite, 0.25);
  ctx.fillRect(px, py, 120, 58);
  ctx.strokeStyle = withAlpha(mix(outcrop, P.ink, 0.5), 0.6);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(px, py, 120, 58);
  ctx.fillStyle = withAlpha(P.ink, 0.45);
  for (let r = 0; r < 9; r++) for (let x = px + 4; x < px + 114; x += 3.6) if (rng.chance(0.8)) ctx.fillRect(x, py + 4 + r * 6, 2.2, 1.6);
}

/** A lone figure lays his sword down on a flat rock, beside a lotus pool. */
function paintSword(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const cx = w / 2;
  glow(ctx, cx, h - 60, 140, P.marigold, 0.16);
  // the little pool and its lotus
  ctx.fillStyle = mix(P.peacock, P.neel, 0.35);
  ctx.beginPath(); ctx.ellipse(cx + 70, h - 10, 64, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha(mix(P.skyCream, P.marigold, 0.3), 0.5);
  ctx.beginPath(); ctx.ellipse(cx + 76, h - 12, 40, 4, 0, 0, Math.PI * 2); ctx.fill();
  lotusPad(ctx, rng, cx + 54, h - 8, 14, 0.2);
  lotusPad(ctx, rng, cx + 100, h - 10, 11, 0.3);
  lotusFlower(ctx, cx + 76, h - 12, 11);
  // the flat rock
  const rock = mix(P.khondalite, P.laterite, 0.2);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.moveTo(cx - 70, h - 2); ctx.quadraticCurveTo(cx - 66, h - 30, cx - 20, h - 32); ctx.quadraticCurveTo(cx + 20, h - 34, cx + 30, h - 2); ctx.closePath(); }, { x: cx - 70, y: h - 34, w: 100, h: 32 }, { base: rock, light: mix(rock, P.marigold, 0.3), shade: mix(rock, P.neel, 0.35), lightFrom: 'right' });
  // the sword, laid down on the rock
  taperStroke(ctx, [{ x: cx - 46, y: h - 34 }, { x: cx + 18, y: h - 35 }], 3.6, mix(P.limewhite, P.khondalite, 0.25), 1, [1, 0.1]);
  ctx.fillStyle = mix(P.haldi, P.laterite, 0.3);
  ctx.fillRect(cx - 58, h - 36.5, 12, 4);
  ctx.fillRect(cx - 47, h - 41, 3, 11);
  // the figure, bowed, his hand just leaving the hilt
  const s = 2.3;
  person(ctx, cx - 54 - 5.5 * s, h - 2, s, { pose: 'bend', cloth: P.limewhite, cloth2: mix(P.haldi, P.laterite, 0.3), head: 'turban', skin: 0.45, facing: 1 });
  // a few petals adrift
  for (let i = 0; i < 4; i++) dab(ctx, cx + 30 + i * 18, h - 8 - (i % 2) * 3, 1.8, 1, 0.3, mix(P.rani, P.limewhite, 0.5), 0.9);
}

/** Deer come down to the Daya to drink. */
function paintDeer(ctx: Ctx, rng: Rng, w: number, h: number): void {
  reedTuft(ctx, rng, w * 0.15, h - 2, 40, 40, { dark: mix(P.tota, P.neel, 0.45), mid: mix(P.tota, P.khondalite, 0.4), tip: mix(P.haldi, P.khondalite, 0.3) }, 12);
  deer(ctx, w * 0.42, h - 4, 1.7, 1, true);
  deer(ctx, w * 0.64, h - 6, 1.1, -1, false);
  egret(ctx, w * 0.82, h - 2, 1.2, 0.1);
  reedTuft(ctx, rng, w * 0.9, h - 2, 30, 30, { dark: mix(P.tota, P.neel, 0.45), mid: mix(P.tota, P.khondalite, 0.4), tip: mix(P.haldi, P.khondalite, 0.3) }, 9);
}

/** A cowherd boy walks his cows home at dusk, playing the flute. */
function paintFlute(ctx: Ctx, rng: Rng, w: number, h: number): void {
  cow(ctx, w * 0.3, h - 2, 1.35, { colour: P.limewhite, facing: -1, phase: 1 });
  cow(ctx, w * 0.52, h - 2, 1.2, { colour: mix(P.chandan, P.limewhite, 0.4), facing: -1, phase: 2.5 });
  const bx = w * 0.72, by = h - 2;
  person(ctx, bx, by, 1.4, { pose: 'walk', cloth: P.haldi, skin: 0.6, facing: -1, phase: 1 });
  // flute held across the lips
  taperStroke(ctx, [{ x: bx - 16, y: by - 40 }, { x: bx - 2, y: by - 37 }], 1.6, mix(P.laterite, P.chandan, 0.5), 1, [1, 1]);
  for (let i = 0; i < 3; i++) taperStroke(ctx, curvePts(bx - 22 - i * 9, by - 46 - i * 6, bx - 26 - i * 9, by - 52 - i * 6, bx - 22 - i * 9, by - 56 - i * 6, 5), 1.2, P.limewhite, 0.55);
  // a diya on a stone by the path, already lit
  dab(ctx, w * 0.9, h - 4, 7, 4, 0, mix(P.khondalite, P.ink, 0.2), 1);
  glow(ctx, w * 0.9, h - 12, 18, P.marigold, 0.55);
  dab(ctx, w * 0.9, h - 9, 3.4, 1.6, 0, P.laterite, 1);
  dab(ctx, w * 0.9, h - 12.5, 1.2, 2.6, 0, P.marigold, 1);
  void rng;
}

// ---- record 05 ------------------------------------------------------------------------

/** A hill with rock-cut caves: Udayagiri with the two-storeyed Rani Gumpha. */
function paintUdayagiri(ctx: Ctx, rng: Rng, w: number, h: number): void {
  for (let i = 0; i < 6; i++) broadTree(ctx, rng.fork(i), w * (0.12 + i * 0.15), h - 40 - rng.range(0, 30), rng.range(50, 70), rng.range(50, 66), 0.2);
  caveHill(ctx, rng.fork('back'), w * 0.72, h - 6, w * 0.5, h * 0.62, { storeys: 1, haze: 0.25 });
  caveHill(ctx, rng.fork('rani'), w * 0.42, h, w * 0.66, h * 0.82, { storeys: 2 });
  for (const k of [0.06, 0.13, 0.88, 0.95]) broadTree(ctx, rng.fork(k), w * k, h - rng.range(0, 6), rng.range(44, 64), rng.range(48, 64), 0.1);
  // pilgrims on the cave terraces
  person(ctx, w * 0.36, h - h * 0.18 - 2, 0.95, { pose: 'walk', cloth: P.limewhite, skin: 0.4, phase: 1 });
  person(ctx, w * 0.47, h - h * 0.44 - 2, 0.85, { pose: 'stand', cloth: P.limewhite, skin: 0.6 });
  person(ctx, w * 0.5, h - h * 0.18 - 2, 0.95, { pose: 'read', cloth: P.marigold, skin: 0.3, facing: -1 });
}

/** The Hathigumpha: a mason carves the inscription above the cave while a scribe reads it out. */
function paintInscription(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const rock = mix(P.laterite, P.khondalite, 0.45);
  const cx = w * 0.45;
  const path = () => { ctx.beginPath(); ctx.moveTo(cx - 190, h); ctx.bezierCurveTo(cx - 180, h - 140, cx - 60, h - 190, cx + 40, h - 184); ctx.bezierCurveTo(cx + 140, h - 176, cx + 200, h - 110, cx + 210, h); ctx.closePath(); };
  paintedShape(ctx, rng, path, { x: cx - 190, y: h - 190, w: 400, h: 190 }, { base: rock, light: mix(rock, P.haldi, 0.3), shade: mix(rock, P.ink, 0.4), lightFrom: 'right', dabs: 360 });
  // the natural cavern
  ctx.fillStyle = mix(P.ink, P.laterite, 0.25);
  ctx.beginPath(); ctx.moveTo(cx - 70, h); ctx.quadraticCurveTo(cx - 60, h - 64, cx + 10, h - 66); ctx.quadraticCurveTo(cx + 80, h - 62, cx + 86, h); ctx.closePath(); ctx.fill();
  // the inscription panel on the brow: 17 rows of incised marks (not real text)
  const px = cx - 74, py = h - 150, pw = 150, ph = 70;
  ctx.fillStyle = mix(rock, P.limewhite, 0.18);
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = withAlpha(P.ink, 0.5);
  for (let r = 0; r < 17; r++) {
    const done = r < 13 ? pw - 8 : r === 13 ? pw * 0.45 : 0;
    for (let x = px + 4; x < px + 4 + done; x += 3.4) if (rng.chance(0.82)) ctx.fillRect(x, py + 3 + r * 4, 2, 1.4);
  }
  // bamboo scaffold and the mason with chisel and mallet
  const bam = mix(P.haldi, P.laterite, 0.35);
  taperStroke(ctx, [{ x: px + pw * 0.4, y: h }, { x: px + pw * 0.4, y: py + 20 }], 3, bam, 1, [1, 1]);
  taperStroke(ctx, [{ x: px + pw * 0.75, y: h }, { x: px + pw * 0.75, y: py + 20 }], 3, bam, 1, [1, 1]);
  ctx.fillStyle = bam;
  ctx.fillRect(px + pw * 0.3, py + ph + 4, pw * 0.56, 4);
  person(ctx, px + pw * 0.56, py + ph + 4, 1.05, { pose: 'adze', cloth: P.limewhite, cloth2: P.laterite, head: 'cap', skin: 0.7, phase: 1.2 });
  dabField(ctx, rng, px + pw * 0.45, py + ph - 4, 30, 12, { n: 14, r: [0.6, 1.4], colours: [mix(rock, P.limewhite, 0.4)], alpha: [0.6, 0.9] });
  // below: a scribe reads out from palm leaves, a royal attendant holds the parasol over a patron
  person(ctx, cx + 130, h - 2, 1.5, { pose: 'read', cloth: P.limewhite, cloth2: P.peacock, head: 'turban', skin: 0.35, facing: -1 });
  person(ctx, cx + 176, h - 2, 1.6, { pose: 'point', cloth: P.haldi, cloth2: P.sindoor, head: 'crown', skin: 0.5, facing: -1 });
  person(ctx, cx + 202, h - 2, 1.4, { pose: 'stand', cloth: P.limewhite, cloth2: P.peacock, skin: 0.65, facing: -1 });
  chhati(ctx, cx + 186, h - 80, 22, [P.sindoor, P.haldi, P.peacock, P.limewhite]);
  // a boy copying the marks with a stick in the dust
  person(ctx, cx - 120, h - 2, 1.0, { pose: 'sit', cloth: P.marigold, skin: 0.55, facing: 1 });
  for (let i = 0; i < 5; i++) ctx.fillRect(cx - 104 + i * 4, h - 4, 2, 1);
}

/** A monkey steals a banana from a pilgrim resting on a rock. */
function paintMonkey(ctx: Ctx, rng: Rng, w: number, h: number): void {
  const rock = mix(P.laterite, P.khondalite, 0.4);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.moveTo(w * 0.15, h); ctx.quadraticCurveTo(w * 0.2, h - 44, w * 0.45, h - 48); ctx.quadraticCurveTo(w * 0.75, h - 50, w * 0.85, h); ctx.closePath(); }, { x: w * 0.15, y: h - 50, w: w * 0.7, h: 50 }, { base: rock, light: mix(rock, P.haldi, 0.3), shade: mix(rock, P.ink, 0.4), lightFrom: 'right' });
  broadTree(ctx, rng.fork('t'), w * 0.8, h - 2, 110, 130, 0.05);
  // pilgrim, eyes on the hills, banana bunch in a basket by his side
  const px = w * 0.42, py = h - 46;
  person(ctx, px, py, 2, { pose: 'sit', cloth: P.limewhite, cloth2: P.haldi, head: 'turban', skin: 0.45, facing: 1 });
  dab(ctx, px - 22, py - 5, 11, 6, 0, mix(P.haldi, P.laterite, 0.45), 1);
  for (let i = 0; i < 4; i++) dab(ctx, px - 27 + i * 3.6, py - 11, 2, 5, 0.3, P.haldi, 1);
  // the thief, already making off with one
  monkey(ctx, px - 56, py + 1, 2, -1, 0, P.haldi);
  // another on the branch, watching, with a banana peel draped over it
  monkey(ctx, w * 0.76, h - 108, 1.2, -1, 0.05);
  taperStroke(ctx, curvePts(w * 0.76 - 2, h - 130, w * 0.76 + 2, h - 136, w * 0.76 + 6, h - 128, 5), 2.4, P.haldi, 1);
}

/** Khandagiri, with white-robed monks walking up the path in a line. */
function paintKhandagiri(ctx: Ctx, rng: Rng, w: number, h: number): void {
  for (let i = 0; i < 5; i++) broadTree(ctx, rng.fork(i), w * (0.2 + i * 0.15), h - 50 - rng.range(0, 30), rng.range(50, 70), rng.range(50, 66), 0.2);
  caveHill(ctx, rng.fork('k'), w * 0.52, h, w * 0.72, h * 0.9, { storeys: 1 });
  for (const k of [0.08, 0.86, 0.94]) broadTree(ctx, rng.fork(k), w * k, h - rng.range(0, 6), rng.range(44, 64), rng.range(48, 64), 0.1);
  // rock-cut steps winding up
  const st = mix(P.laterite, P.chandan, 0.35);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = st;
    ctx.fillRect(w * 0.2 + i * 18, h - 6 - i * 9, 22, 4);
    ctx.fillStyle = withAlpha(P.ink, 0.25);
    ctx.fillRect(w * 0.2 + i * 18, h - 2 - i * 9, 22, 1.4);
  }
  for (let i = 0; i < 4; i++) {
    const x = w * 0.2 + 8 + i * 36, y = h - 6 - i * 18;
    person(ctx, x, y, 1.15, { pose: i === 0 ? 'sweep' : 'walk', cloth: P.limewhite, cloth2: mix(P.limewhite, P.khondalite, 0.2), skin: 0.3 + i * 0.15, facing: 1, phase: i });
  }
}

// ---- strips -------------------------------------------------------------------------------

export const SCENES: Record<string, () => SceneDef> = {
  // 02 · c. 300 BCE · Sisupalgarh — a city of eight gates.
  r02: () => ({
    id: 'r02',
    sky: { stops: ACT1_SKY, sun: { x: 1010, y: 112, r: 36 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.peacock, P.skyCream, 0.55), b: P.neel, height: [24, 70], trees: true, haze: 0.5 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.3), plainDetail: 'fields', path: mix(P.laterite, P.chandan, 0.35), verge: mix(P.tota, P.laterite, 0.2) },
    mid: (ctx, rng, W) => {
      // The long city wall, gates two by two, rooftops peeping over it, and the moat at its foot.
      treeRow(ctx, rng.fork('trees'), W, 168, 0.35, 0.2);
      scatter(rng.fork('roofs'), W, [40, 70], (x) => wrapped(W, x, 40, (xx) => house(ctx, rng.fork(x), xx, 176, rng.range(36, 54), rng.range(40, 56), { roof: rng.chance(0.5) ? 'tile' : 'thatch', haze: 0.25 })));
      cityWall(ctx, rng.fork('wall'), 0, W, 236, 56, [260, 1290], 0.05);
      bank(ctx, rng.fork('bank'), W, 238, mix(P.tota, P.haldi, 0.3), mix(P.laterite, P.tota, 0.3));
      ctx.fillStyle = mix(P.peacock, P.seafoam, 0.3);
      ctx.fillRect(0, 246, W, 14);
    },
    near: (ctx, rng, W) => {
      // Market lane outside the wall: stalls, shoppers, a cow who will not move.
      scatter(rng.fork('stalls'), W, [260, 420], (x, i) => wrapped(W, x, 80, (xx) => {
        stall(ctx, xx, 130, 70, 46, i % 2 ? [P.haldi, P.sindoor] : [P.seafoam, P.peacock]);
        crowd(ctx, rng.fork(x), xx - 50, xx + 50, 134, 1.25, { density: 2.2 });
      }));
      wrapped(W, 900, 60, (xx) => { bullockCartBg(ctx, rng.fork('cart'), xx, 134, 1.3); person(ctx, xx + 70, 134, 1.25, { pose: 'walk', cloth: P.haldi, head: 'turban' }); });
      wrapped(W, 1600, 40, (xx) => { cow(ctx, xx, 134, 1.2, { grazing: true }); goat(ctx, xx + 50, 134, 1, -1); });
    },
    fore: 'grass',
    sign: { date: 'c. 300 BCE', title: 'Sisupalgarh' },
    landmarks: [
      {
        // A gatekeeper fast asleep under a parasol while the whole city walks past.
        at: 0.42, plane: 'mid', w: 200, h: 120,
        paint: (ctx, rng, w, h) => {
          person(ctx, w / 2, h - 4, 1.7, { pose: 'sit', cloth: P.limewhite, cloth2: P.sindoor, head: 'turban', skin: 0.6 });
          crowd(ctx, rng, 10, 70, h - 4, 1.5, { poses: ['walk'], facing: 1, density: 1.8 });
        },
      },
    ],
  }),

  // 03 · Kartika Purnima · Boita Bandana — the boitas sail for the golden islands.
  r03: () => ({
    id: 'r03',
    sky: {
      stops: [[0, mix(P.peacock, P.seafoam, 0.55)], [0.4, mix(P.seafoam, P.skyCream, 0.45)], [0.78, mix(P.skyCream, P.marigold, 0.22)], [1, mix(P.skyCream, P.marigold, 0.42)]],
      // dawn: the full moon of Kartika still up, the sun just lifting off the sea
      moon: { x: 250, y: 128, r: 30 },
      sun: { x: 1010, y: 262, r: 30, colour: mix(P.haldi, P.marigold, 0.45) },
      clouds: 'streak',
      cloudTint: mix(P.limewhite, P.marigold, 0.3),
    },
    far: [{ kind: 'hills', a: mix(P.peacock, P.skyCream, 0.55), b: P.neel, height: [12, 46], base: 166, trees: true, haze: 0.55 }],
    ground: { kind: 'sea', water: R03_WATER },
    mid: (ctx, rng, W) => {
      // The wide estuary: distant fishing boats and the odd boita already out, gulls.
      scatter(rng.fork('boats'), W, [380, 620], (x, i) => wrapped(W, x, 40, (xx) => {
        if (i % 3 === 1) boitaShip(ctx, rng.fork(x), xx, 238, 0.3, { haze: 0.55, sail2: rng.pick([P.sindoor, P.haldi, P.peacock]) });
        else dinghy(ctx, xx, 238, 0.8, 0.45, rng.pick([P.limewhite, mix(P.haldi, P.limewhite, 0.4), mix(P.sindoor, P.limewhite, 0.4)]));
      }));
      scatter(rng.fork('gulls'), W, [200, 400], (x) => wrapped(W, x, 20, (xx) => gull(ctx, xx, rng.range(60, 150), rng.range(0.8, 1.2), mix(P.limewhite, P.khondalite, 0.25))));
    },
    fore: (ctx, rng, W) => {
      // lamp-boats that have drifted out from the ghats, and loose marigolds
      scatter(rng.fork('lamps'), W, [420, 700], (x) => wrapped(W, x, 30, (xx) => lampBoat(ctx, xx, rng.range(36, 70), rng.range(1.3, 1.6))));
      scatter(rng.fork('petals'), W, [90, 200], (x) => wrapped(W, x, 6, (xx) => dab(ctx, xx, rng.range(20, 100), 2.4, 1.6, rng.next(), rng.pick([P.marigold, P.haldi]), 0.85)));
    },
    sign: { date: 'Kartika Purnima', title: 'Boita Bandana' },
    landmarks: [
      { at: 0.12, plane: 'mid', w: 2400, h: 300, y: 470, paint: paintPort },
      { at: 0.46, plane: 'mid', w: 520, h: 260, y: 492, paint: paintCastOff },
      { at: 0.7, plane: 'far', w: 520, h: 90, y: 436, paint: paintFleet },
      { at: 0.86, plane: 'mid', w: 400, h: 260, y: 492, paint: paintFamilyBoita },
    ],
  }),

  // 04 · 261 BCE · Dhauli — the Kalinga War. Quiet, sparse, drained toward sepia and indigo.
  r04: () => ({
    id: 'r04',
    sky: {
      stops: [[0, mix(P.neel, P.skyCream, 0.5)], [0.5, mix(P.skyCream, P.sindoor, 0.16)], [1, mix(P.skyCream, P.marigold, 0.32)]],
      sun: { x: 930, y: 372, r: 30, colour: mix(P.marigold, P.sindoor, 0.35) },
      stars: 10,
      clouds: 'streak',
      cloudTint: mix(P.sindoor, P.skyCream, 0.55),
    },
    far: [
      { kind: 'hills', a: mix(P.neel, P.skyCream, 0.62), b: P.neel, height: [50, 120], base: 158, haze: 0.5 },
      { kind: 'hills', a: mix(P.neel, P.khondalite, 0.5), b: P.ink, height: [24, 64], base: 166, trees: true, haze: 0.35 },
    ],
    ground: { kind: 'land', plain: mix(P.tota, P.khondalite, 0.45), plainDetail: 'fields', path: mix(P.laterite, P.chandan, 0.4), verge: mix(P.tota, P.khondalite, 0.5) },
    mid: (ctx, rng, W) => {
      // The Daya river, wide and still, the far bank quiet with trees and palmyra.
      scatter(rng.fork('far'), W, [60, 120], (x) => wrapped(W, x, 60, (xx) => broadTree(ctx, rng.fork(x), xx, 214, rng.range(60, 100), rng.range(50, 80), 0.45)));
      scatter(rng.fork('tala'), W, [160, 340], (x) => wrapped(W, x, 30, (xx) => palmyraPalm(ctx, rng.fork(x), xx, 216, rng.range(90, 130), 0.4)));
      bank(ctx, rng.fork('fb'), W, 212, mix(P.tota, P.khondalite, 0.5), mix(P.laterite, P.khondalite, 0.4));
      const water = mix(P.peacock, P.neel, 0.45);
      ctx.fillStyle = water;
      ctx.fillRect(0, 220, W, 40);
      for (let i = 0; i < 260; i++) {
        const x = rng.next() * W, y = 222 + rng.next() * 30, l = rng.range(10, 40);
        wrapped(W, x, l, (xx) => taperStroke(ctx, [{ x: xx - l / 2, y }, { x: xx + l / 2, y }], 1.2, rng.chance(0.5) ? mix(P.skyCream, P.marigold, 0.3) : mix(water, P.ink, 0.3), 0.45));
      }
      bank(ctx, rng.fork('nb'), W, 246, mix(P.tota, P.khondalite, 0.45), mix(P.laterite, P.khondalite, 0.35));
    },
    near: (ctx, rng, W) => {
      // Sparse: harvested fields with their low bunds, tall grass, a lone tree, egrets. Wide quiet spaces.
      const bund = mix(P.tota, P.khondalite, 0.55);
      for (let k = 0; k < 4; k++) {
        const y = 30 + k * 26;
        for (let x = 0; x < W; x += 6) {
          const yy = y + Math.sin((x / W) * Math.PI * 2 * (2 + k)) * 4;
          dab(ctx, x, yy, 5, 1.6 + k * 0.5, 0, k % 2 ? bund : mix(bund, P.haldi, 0.3), 0.5);
        }
      }
      for (let i = 0; i < 500; i++) {
        const x = rng.next() * W, y = 20 + rng.next() * 110;
        taperStroke(ctx, [{ x, y }, { x: x + rng.range(-1, 1), y: y - 3 - y * 0.03 }], 1.1, rng.pick([mix(P.haldi, P.khondalite, 0.3), mix(P.tota, P.khondalite, 0.4)]), 0.55);
      }
      scatter(rng.fork('grass'), W, [140, 280], (x) => wrapped(W, x, 30, (xx) => reedTuft(ctx, rng.fork(x), xx, 132, 34, rng.range(24, 44), { dark: mix(P.tota, P.neel, 0.5), mid: mix(P.tota, P.khondalite, 0.45), tip: mix(P.haldi, P.khondalite, 0.35) }, 9)));
      wrapped(W, 700, 80, (xx) => broadTree(ctx, rng.fork('t1'), xx, 132, 120, 118, 0.1));
      wrapped(W, 1500, 60, (xx) => broadTree(ctx, rng.fork('t2'), xx, 128, 80, 84, 0.2));
      for (const [x, y] of [[420, 70], [460, 74], [1180, 60], [1900, 90]] as const) wrapped(W, x, 10, (xx) => egret(ctx, xx, y, 0.9, 0.2));
    },
    fore: 'grass',
    tone: { amount: 0.42, dark: mix(P.neel, P.ink, 0.4), light: mix(P.skyCream, P.chandan, 0.18) },
    sign: { date: '261 BCE', title: 'Dhauli' },
    landmarks: [
      { at: 0.2, plane: 'mid', w: 360, h: 110, y: 466, paint: paintDeer },
      { at: 0.42, plane: 'mid', w: 1000, h: 270, y: 460, paint: paintDhauli },
      { at: 0.66, plane: 'mid', w: 360, h: 150, y: 472, paint: paintSword },
      { at: 0.88, plane: 'mid', w: 340, h: 120, y: 464, paint: paintFlute },
    ],
  }),

  // 05 · c. 2nd–1st century BCE · Hathigumpha — Kharavela writes his story in stone.
  r05: () => ({
    id: 'r05',
    sky: { stops: ACT1_SKY, sun: { x: 300, y: 120, r: 34 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.peacock, P.skyCream, 0.5), b: P.neel, height: [30, 80], trees: true, haze: 0.45 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.32), plainDetail: 'grass', path: mix(P.laterite, P.chandan, 0.3), verge: mix(P.tota, P.laterite, 0.2) },
    mid: (ctx, rng, W) => {
      // Scrub forest at the foot of the hills, laterite boulders, and a lotus tank.
      treeRow(ctx, rng.fork('trees'), W, 222, 0.3, 0.35);
      scatter(rng.fork('rocks'), W, [120, 260], (x) => wrapped(W, x, 40, (xx) => {
        const rock = mix(P.laterite, P.khondalite, 0.4);
        dab(ctx, xx, 226, rng.range(18, 34), rng.range(10, 18), 0, mix(rock, P.skyCream, 0.2), 1);
        dab(ctx, xx + 4, 222, rng.range(8, 16), rng.range(4, 8), 0, mix(rock, P.haldi, 0.3), 0.6);
      }));
      bank(ctx, rng.fork('bank'), W, 234, mix(P.tota, P.haldi, 0.3), mix(P.laterite, P.tota, 0.25));
      // a long tank of peacock-blue water with lotus
      const water = mix(P.peacock, P.seafoam, 0.25);
      ctx.fillStyle = water;
      ctx.fillRect(0, 244, W, 16);
      for (let i = 0; i < 120; i++) {
        const x = rng.next() * W, l = rng.range(8, 26);
        wrapped(W, x, l, (xx) => taperStroke(ctx, [{ x: xx - l / 2, y: 246 + rng.next() * 12 }, { x: xx + l / 2, y: 246 + rng.next() * 12 }], 1.2, P.limewhite, 0.4));
      }
      scatter(rng.fork('lotus'), W, [60, 160], (x) => wrapped(W, x, 12, (xx) => { lotusPad(ctx, rng.fork(x), xx, 252, 8, 0.1); if (rng.chance(0.4)) lotusFlower(ctx, xx + 6, 250, 5); }));
    },
    near: (ctx, rng, W) => {
      // The road between the twin hills: pilgrims, a bullock cart, palms; nothing on the lane itself.
      // (kept under 130 px tall: the strip is 140 px high)
      scatter(rng.fork('trees'), W, [260, 460], (x, i) => wrapped(W, x, 60, (xx) => {
        if (i % 2) coconutPalm(ctx, rng.fork(x), xx, 130, rng.range(92, 112), rng.range(-0.08, 0.08), 0.05);
        else broadTree(ctx, rng.fork(x), xx, 130, rng.range(80, 110), rng.range(90, 112), 0.08);
      }));
      wrapped(W, 520, 60, (xx) => bullockCartBg(ctx, rng.fork('cart'), xx, 132, 1.25));
      for (const x of [250, 900, 1350, 1800]) wrapped(W, x, 50, (xx) => crowd(ctx, rng.fork(x), xx - 34, xx + 34, 132, 1.25, { poses: ['walk', 'stand', 'carry'], density: 2.2 }));
      wrapped(W, 1100, 40, (xx) => { goat(ctx, xx, 132, 1.1, 1); goat(ctx, xx + 26, 132, 0.8, -1); });
    },
    fore: 'flowers',
    sign: { date: 'c. 2nd–1st century BCE', title: 'Hathigumpha' },
    landmarks: [
      { at: 0.2, plane: 'mid', w: 640, h: 230, y: 458, paint: paintUdayagiri },
      { at: 0.42, plane: 'mid', w: 560, h: 210, y: 458, paint: paintInscription },
      { at: 0.63, plane: 'mid', w: 340, h: 180, y: 462, paint: paintMonkey },
      { at: 0.84, plane: 'mid', w: 560, h: 220, y: 458, paint: paintKhandagiri },
    ],
  }),
};
