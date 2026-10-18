// Taapoi's rides: every vehicle she rides through the 45 records, painted at
// 2× and shown at 0.5× (the game then applies its own actor scale).
// Her look is FIXED (§4.3 rule 4) and identical to the canoe sprite in
// taapoi.ts: limewhite cotton frock with a sindoor border, haldi accents,
// chandan skin, ink hair in a bun with a jasmine string. The sindoor ribbon
// is animated by the game from `ribbon`. Everything faces right.
// No liveries, logos or names on any vehicle (§7).
import type { VehicleId } from '../../systems/physics';
import { P, FIXED } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { Rng } from '../../lib/rng';
import { clipTo, dab, dabField, glow, makeCanvas, paintedShape, polyPath, softShadow, taperStroke, type Ctx, type Pt } from '../brush';
import { paintTaapoiFrame, RIBBON_ANCHOR, TAAPOI_FRAME } from './taapoi';

export const RIDE_SCALE = 2; // painted at 2×, displayed at 0.5× (the game then applies its own actor scale ≈1.18)

export interface RideSprite {
  frames: HTMLCanvasElement[]; // looping run/ride cycle (6–8 frames)
  jump: HTMLCanvasElement; // airborne pose (for flight rides: climbing pose)
  hit: HTMLCanvasElement; // flinch pose
  ox: number; oy: number; // origin in LOGICAL px inside the canvas (canvas size = logical × RIDE_SCALE)
  ribbon: { x: number; y: number }; // ribbon tie point (back of Taapoi's head) relative to the origin, logical px
  cycleHz: number; // how fast to loop frames
}

const T = FIXED.taapoi;
const TAU = Math.PI * 2;

type St = { k: 'cycle'; p: number; i: number } | { k: 'jump' } | { k: 'hit' };
interface Spec { w: number; h: number; ox: number; oy: number; n: number; hz: number; paint: (ctx: Ctx, rng: Rng, st: St) => void }

// ---- small maths ------------------------------------------------------------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rot = (p: Pt, a: number): Pt => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const smooth = (t: number) => t * t * (3 - 2 * t);
const phaseOf = (st: St) => (st.k === 'cycle' ? st.p : 0);

/** Two-bone joint (elbow/knee) between a and b. bend ±1 picks the side. */
function joint(a: Pt, b: Pt, l1: number, l2: number, bend: number): Pt {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 0.001;
  if (d >= l1 + l2) return { x: a.x + (dx * l1) / (l1 + l2), y: a.y + (dy * l1) / (l1 + l2) };
  const dd = Math.max(d, Math.abs(l1 - l2) + 0.01);
  const ang = Math.atan2(dy, dx);
  const al = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd))));
  return { x: a.x + Math.cos(ang + bend * al) * l1, y: a.y + Math.sin(ang + bend * al) * l1 };
}

// ---- the ribbon tie point ---------------------------------------------------
// girl() records where her bun is in device px; paintRide converts it.
let ribbonDev: Pt | null = null;
function markRibbon(ctx: Ctx, p: Pt): void {
  const m = ctx.getTransform();
  ribbonDev = { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
}

// =============================================================================
// Taapoi. Coordinates "G": origin at her waist (where frock skirt meets the
// bodice); same shapes and sizes as taapoi.ts (which uses waist ≈ y −29).
// =============================================================================
type Face = 'calm' | 'happy' | 'hit';
interface GirlO {
  face?: Face;
  /** Upper-body lean about the waist, radians (+ = forward). */
  lean?: number;
  /** Extra head tilt, radians. */
  tilt?: number;
  lower?: 'seat' | 'stand' | 'astride' | 'none';
  /** Hand targets (G coords, unrotated). */
  near: Pt; far: Pt;
  nearBend?: number; farBend?: number;
  /** Foot targets for 'stand' / 'astride'. bend −1 = knee forward. */
  footN?: Pt; footF?: Pt; kneeN?: number; kneeF?: number;
  /** Frock hem swing in px (− = blown back). */
  hem?: number;
  /** Space-suit (orbit) version with a fishbowl helmet. */
  suit?: boolean;
  parts?: 'all' | 'body' | 'arm';
  /** Drawn after the body, before the near arm (e.g. handlebars, reins). */
  between?: () => void;
  /** Little open hand (waving) instead of a fist. */
  openHand?: boolean;
}

/** Hand raised in a happy wave (jump poses). */
const CHEER: Pt = { x: 27, y: -33 };
const SH_N: Pt = { x: 8, y: -16 };
const SH_F: Pt = { x: 3, y: -20 };
const HIP_N: Pt = { x: 3, y: 9 };
const HIP_F: Pt = { x: -3, y: 9 };
const UA = 11.5, FA = 12.5, TH = 15, SN = 15.5;
const HEAD: Pt = { x: 3, y: -47 };
const BUN: Pt = { x: -12, y: -60 };
const suitC = mix(P.limewhite, P.seafoam, 0.12);
const suitShade = mix(P.limewhite, P.neel, 0.22);
const sandal = mix(P.laterite, P.ink, 0.35);

function girl(ctx: Ctx, rng: Rng, o: GirlO): void {
  const parts = o.parts ?? 'all';
  const lean = o.lean ?? 0;
  const lower = o.lower ?? 'seat';
  const shN = rot(SH_N, lean), shF = rot(SH_F, lean);
  const skin = o.suit ? suitC : T.skin;
  const skinShade = o.suit ? suitShade : T.skinShade;

  if (parts !== 'arm') {
    // far leg + far arm (behind everything)
    let kneeN: Pt | null = null;
    if ((lower === 'stand' || lower === 'astride') && o.footF) leg(ctx, HIP_F, o.footF, o.kneeF ?? -1, true, o.suit);
    const ef = joint(shF, o.far, UA, FA, o.farBend ?? 1);
    taperStroke(ctx, [shF, ef], 6, skinShade, 1, [0.95, 0.8]);
    taperStroke(ctx, [ef, o.far], 5.4, skinShade, 1, [0.85, 0.7]);
    dab(ctx, o.far.x, o.far.y, 3.4, 3.2, 0, o.suit ? suitShade : mix(T.skinShade, T.skin, 0.3), 1);
    if ((lower === 'stand' || lower === 'astride') && o.footN) kneeN = leg(ctx, HIP_N, o.footN, o.kneeN ?? -1, false, o.suit);

    // skirt
    if (lower === 'seat') seatSkirt(ctx);
    else if (lower === 'stand') standSkirt(ctx, rng, o.hem ?? 0, o.suit ? 14 : 25);
    else if (lower === 'astride' && kneeN) astrideSkirt(ctx, kneeN);

    ctx.save();
    ctx.rotate(lean);
    bodice(ctx, rng, o.suit);
    // neck & head
    taperStroke(ctx, [{ x: 0, y: -25 }, { x: 2, y: -31 }], 7, T.skinShade, 1, [1, 1]);
    ctx.save();
    ctx.translate(2, -31);
    ctx.rotate(o.tilt ?? 0);
    ctx.translate(-2, 31);
    if (o.suit) dab(ctx, -14, -12, 9, 13, 0.1, mix(P.limewhite, P.khondalite, 0.25), 1); // little backpack
    head(ctx, rng, o.face ?? 'calm');
    if (o.suit) helmet(ctx);
    markRibbon(ctx, o.suit ? { x: -19, y: -58 } : { x: BUN.x + 1, y: BUN.y - 2 });
    ctx.restore();
    ctx.restore();
  }
  if (parts === 'body') return;
  o.between?.();
  // near sleeve (puff with sindoor border) + near arm
  ctx.save();
  ctx.rotate(lean);
  dab(ctx, 6, -19, 7.5, 6.5, 0.3, o.suit ? suitC : T.frock, 1);
  dab(ctx, 4, -21, 5, 4, 0.3, o.suit ? suitShade : T.frockShade, 0.4);
  taperStroke(ctx, [{ x: 1, y: -14 }, { x: 8, y: -13 }, { x: 13, y: -16 }], 2.4, T.border, 1, [0.9, 0.9]);
  ctx.restore();
  const en = joint(shN, o.near, UA, FA, o.nearBend ?? 1);
  taperStroke(ctx, [shN, en], 6.4, skin, 1, [0.95, 0.85]);
  taperStroke(ctx, [en, o.near], 5.8, skin, 1, [0.85, 0.7]);
  if (o.suit) {
    const a = Math.atan2(o.near.y - en.y, o.near.x - en.x);
    taperStroke(ctx, [{ x: o.near.x - Math.cos(a) * 4, y: o.near.y - Math.sin(a) * 4 }, { x: o.near.x - Math.cos(a) * 2, y: o.near.y - Math.sin(a) * 2 }], 6, T.border, 1, [1, 1]);
  }
  if (o.openHand) {
    dab(ctx, o.near.x, o.near.y - 1, 3.4, 4.2, 0.2, skin, 1);
    for (let i = 0; i < 4; i++) taperStroke(ctx, [{ x: o.near.x - 2 + i * 1.5, y: o.near.y - 3 }, { x: o.near.x - 3 + i * 2.2, y: o.near.y - 7.5 }], 1.6, skin, 1, [1, 0.6]);
  } else dab(ctx, o.near.x, o.near.y, 3.6, 3.4, 0, o.suit ? mix(P.limewhite, P.khondalite, 0.2) : T.skin, 1);
}

function leg(ctx: Ctx, hip: Pt, foot: Pt, bend: number, far: boolean, suit?: boolean): Pt {
  const k = joint(hip, foot, TH, SN, bend);
  const c = suit ? (far ? suitShade : suitC) : far ? T.skinShade : T.skin;
  taperStroke(ctx, [hip, k], 7.4, c, 1, [1, 0.85]);
  taperStroke(ctx, [k, foot], 6, c, 1, [0.9, 0.75]);
  dab(ctx, k.x, k.y, 3.2, 3.2, 0, c, 1);
  // foot: sandal (or boot) pointing along the travel direction, tilted with the shin
  const a = Math.atan2(foot.y - k.y, foot.x - k.x) - Math.PI / 2;
  const fx = foot.x + Math.cos(a) * 2.6, fy = foot.y + Math.sin(a) * 2.6;
  if (suit) {
    dab(ctx, fx + 1, fy, 5, 3, a * 0.6, far ? mix(P.haldi, P.laterite, 0.4) : P.haldi, 1);
    taperStroke(ctx, [{ x: foot.x - 3, y: foot.y - 3 }, { x: foot.x + 3, y: foot.y - 3 }], 2.4, T.border, 1, [1, 1]);
  } else {
    dab(ctx, fx + 1, fy - 0.4, 4.4, 2.4, a * 0.6, far ? T.skinShade : T.skin, 1);
    dab(ctx, fx + 1.2, fy + 1.4, 4.8, 1.3, a * 0.6, far ? mix(sandal, P.ink, 0.3) : sandal, 1);
    dab(ctx, foot.x - 0.5, foot.y - 1.6, 1, 1, 0, P.haldi, far ? 0.6 : 1); // anklet bead
  }
  return k;
}

/** Skirt spilling over a seat (as in the canoe). */
function seatSkirt(ctx: Ctx): void {
  const skirt = () => {
    ctx.beginPath();
    ctx.moveTo(-22, 15);
    ctx.quadraticCurveTo(-24, 3, -14, -1);
    ctx.lineTo(10, -1);
    ctx.quadraticCurveTo(22, 3, 22, 15);
    ctx.closePath();
  };
  skirt();
  ctx.fillStyle = T.frock;
  ctx.fill();
  clipTo(ctx, skirt, () => {
    ctx.fillStyle = T.border;
    ctx.fillRect(-26, 8, 52, 6);
    ctx.fillStyle = withAlpha(T.accent, 0.95);
    ctx.fillRect(-26, 7.5, 52, 1.4);
    for (let x = -22; x < 22; x += 5) dab(ctx, x, 10.8, 1.2, 1.2, 0, T.accent, 0.9);
    for (let x = -20; x < 22; x += 6) taperStroke(ctx, [{ x, y: -1 }, { x: x + 2, y: 8 }], 1.1, T.frockShade, 0.6);
  });
}

/** Knee-length A-line frock, hem swinging by `hem` px. */
function standSkirt(ctx: Ctx, rng: Rng, hem: number, len: number): void {
  const L = { x: -21 + hem * 1.15, y: len + 1 - Math.abs(hem) * 0.25 };
  const R = { x: 18 + hem * 0.7, y: len - 1 };
  const wv = hem * 0.5;
  const c1 = { x: -9 + hem, y: len + 4 + wv }, c2 = { x: 6 + hem * 0.8, y: len - 2 - wv };
  const hemCurve = (dy: number) => {
    ctx.moveTo(L.x - 2, L.y + dy);
    ctx.bezierCurveTo(c1.x, c1.y + dy, c2.x, c2.y + dy, R.x + 2, R.y + dy);
  };
  const skirt = () => {
    ctx.beginPath();
    ctx.moveTo(-14, -1);
    ctx.lineTo(11, -1);
    ctx.quadraticCurveTo(15 + hem * 0.1, len * 0.4, R.x, R.y);
    ctx.bezierCurveTo(c2.x, c2.y, c1.x, c1.y, L.x, L.y);
    ctx.quadraticCurveTo(-18 + hem * 0.2, len * 0.4, -14, -1);
    ctx.closePath();
  };
  skirt();
  ctx.fillStyle = T.frock;
  ctx.fill();
  clipTo(ctx, skirt, () => {
    const g = ctx.createLinearGradient(-22, 0, 20, 0);
    g.addColorStop(0, withAlpha(T.frockShade, 0.95));
    g.addColorStop(0.5, withAlpha(T.frock, 0));
    g.addColorStop(1, withAlpha(P.haldi, 0.1));
    ctx.fillStyle = g;
    ctx.fillRect(-30, -2, 60, len + 8);
    for (let x = -16; x < 16; x += 6) taperStroke(ctx, [{ x: x * 0.7, y: 1 }, { x: x * 0.9 + hem * 0.5, y: len * 0.55 }, { x: x * 1.15 + hem * 0.9, y: len }], 1.2, T.frockShade, 0.65);
    dabField(ctx, rng, -20, 0, 38, len, { n: 10, r: [1.5, 3], colours: [T.frockShade, P.limewhite], alpha: [0.1, 0.25] });
    ctx.strokeStyle = T.border;
    ctx.lineWidth = 12;
    ctx.beginPath();
    hemCurve(1);
    ctx.stroke();
    ctx.strokeStyle = withAlpha(T.accent, 0.95);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    hemCurve(-5.6);
    ctx.stroke();
  });
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7;
    const u = 1 - t;
    const x = u * u * u * L.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * R.x;
    const y = u * u * u * L.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * R.y;
    dab(ctx, x, y - 2.6, 1.2, 1.2, 0, T.accent, 0.9);
  }
}

/** Seated astride (bicycle, elephant): the frock drapes over the thigh to the knee. */
function astrideSkirt(ctx: Ctx, k: Pt): void {
  const skirt = () => {
    ctx.beginPath();
    ctx.moveTo(-14, -1);
    ctx.lineTo(11, -1);
    ctx.quadraticCurveTo(k.x - 2, k.y - 9, k.x + 3, k.y - 6);
    ctx.quadraticCurveTo(k.x + 7, k.y - 2, k.x + 4, k.y + 5);
    ctx.quadraticCurveTo(k.x - 4, k.y + 9, k.x - 9, k.y + 7);
    ctx.quadraticCurveTo(0, 17, -16, 16);
    ctx.quadraticCurveTo(-22, 10, -19, 4);
    ctx.quadraticCurveTo(-18, 0, -14, -1);
    ctx.closePath();
  };
  skirt();
  ctx.fillStyle = T.frock;
  ctx.fill();
  clipTo(ctx, skirt, () => {
    ctx.fillStyle = withAlpha(T.frockShade, 0.8);
    ctx.fillRect(-24, 8, 60, 12);
    // border runs round the hem: across the knee and along the back
    ctx.strokeStyle = T.border;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(k.x + 6, k.y - 9);
    ctx.quadraticCurveTo(k.x + 9, k.y + 4, k.x - 6, k.y + 10);
    ctx.quadraticCurveTo(0, 20, -20, 19);
    ctx.stroke();
    ctx.strokeStyle = withAlpha(T.accent, 0.95);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(k.x + 0.5, k.y - 9);
    ctx.quadraticCurveTo(k.x + 3, k.y + 1, k.x - 8, k.y + 4.5);
    ctx.quadraticCurveTo(-2, 14, -20, 13.5);
    ctx.stroke();
    for (let i = 0; i < 5; i++) taperStroke(ctx, [{ x: -10 + i * 5, y: 1 }, { x: -6 + i * 6, y: 9 }], 1.1, T.frockShade, 0.6);
  });
}

function bodice(ctx: Ctx, rng: Rng, suit?: boolean): void {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-15, 1);
    ctx.quadraticCurveTo(-19, -13, -14, -24);
    ctx.quadraticCurveTo(-2, -29, 10, -24);
    ctx.quadraticCurveTo(15, -13, 12, 1);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = suit ? suitC : T.frock;
  ctx.fill();
  clipTo(ctx, path, () => {
    const g = ctx.createLinearGradient(-18, 0, 14, 0);
    g.addColorStop(0, withAlpha(suit ? suitShade : T.frockShade, 0.9));
    g.addColorStop(0.55, withAlpha(T.frock, 0));
    g.addColorStop(1, withAlpha(P.haldi, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(-20, -31, 36, 34);
    dabField(ctx, rng, -18, -29, 32, 30, { n: 14, r: [1.5, 3.5], colours: [T.frockShade, P.limewhite], alpha: [0.1, 0.25] });
    if (suit) {
      // chest panel with three tiny lights
      ctx.fillStyle = P.haldi;
      ctx.fillRect(-3, -15, 11, 8);
      dab(ctx, -0.5, -11, 1.3, 1.3, 0, P.neonCyan, 1);
      dab(ctx, 3, -11, 1.3, 1.3, 0, P.neonRani, 1);
      dab(ctx, 6, -11, 1.3, 1.3, 0, P.tota, 1);
    }
  });
  // haldi sash (a sindoor belt on the suit)
  taperStroke(ctx, [{ x: -16, y: -1 }, { x: -2, y: -3 }, { x: 13, y: -1 }], 3.4, suit ? T.border : T.accent, 1, [0.9, 0.9]);
  // neckline trim + haldi bead necklace
  taperStroke(ctx, [{ x: -10, y: -25 }, { x: -1, y: -21 }, { x: 8, y: -25 }], 2, T.border, 1, [0.8, 0.8]);
  if (!suit) for (let i = 0; i < 7; i++) {
    const t = i / 6;
    dab(ctx, -8 + t * 15, -22 + Math.sin(t * Math.PI) * 3.4, 1.2, 1.2, 0, T.accent, 1);
  }
}

function head(ctx: Ctx, rng: Rng, face: Face): void {
  const hx = HEAD.x, hy = HEAD.y, r = 18;
  dab(ctx, hx - 4, hy - 1, r * 1.02, r * 1.0, 0, T.hair, 1);
  const faceP = () => { ctx.beginPath(); ctx.ellipse(hx + 2.5, hy + 1.5, r * 0.88, r * 0.92, 0, 0, Math.PI * 2); };
  faceP();
  ctx.fillStyle = T.skin;
  ctx.fill();
  clipTo(ctx, faceP, () => {
    const g = ctx.createLinearGradient(hx - r, 0, hx + r, 0);
    g.addColorStop(0, withAlpha(T.skinShade, 0.95));
    g.addColorStop(0.45, withAlpha(T.skinShade, 0));
    g.addColorStop(0.9, withAlpha(P.haldi, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(hx - r, hy - r, r * 2.4, r * 2.4);
    dabField(ctx, rng, hx - r, hy - r, r * 2, r * 2, { n: 12, r: [1.5, 3], colours: [T.skinShade, mix(T.skin, P.haldi, 0.2)], alpha: [0.08, 0.18] });
  });
  // hair cap + fringe
  ctx.fillStyle = T.hair;
  ctx.beginPath();
  ctx.moveTo(hx - r * 0.95, hy + 6);
  ctx.quadraticCurveTo(hx - r * 1.05, hy - r * 1.1, hx + 6, hy - r * 0.98);
  ctx.quadraticCurveTo(hx + r * 0.95, hy - r * 0.8, hx + r * 0.9, hy - 6);
  ctx.quadraticCurveTo(hx + 10, hy - 11, hx + 2, hy - 10);
  ctx.quadraticCurveTo(hx - 6, hy - 6, hx - 7, hy + 2);
  ctx.closePath();
  ctx.fill();
  taperStroke(ctx, [{ x: hx - 10, y: hy - 13 }, { x: hx, y: hy - 17 }, { x: hx + 9, y: hy - 15 }], 2.2, mix(P.neel, P.limewhite, 0.3), 0.45, [0.2, 0.2]);
  // ear + earring
  dab(ctx, hx - 5, hy + 2, 3, 4, 0, T.skin, 1);
  dab(ctx, hx - 5, hy + 2, 1.6, 2.4, 0, T.skinShade, 0.8);
  dab(ctx, hx - 5, hy + 6.5, 1.2, 1.2, 0, P.haldi, 1);
  // bun with jasmine string
  const bx = hx - 15, by = hy - 13;
  dab(ctx, bx, by, 8, 7.5, 0, T.hair, 1);
  taperStroke(ctx, [{ x: bx - 5, y: by - 3 }, { x: bx + 2, y: by - 6 }], 1.6, mix(P.neel, P.limewhite, 0.3), 0.4);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * 0.55 + (i / 8) * Math.PI * 1.25;
    const jx = bx + Math.cos(a) * 8.6, jy = by + Math.sin(a) * 8;
    dab(ctx, jx, jy, 1.9, 1.7, a, T.jasmine, 1);
    dab(ctx, jx + 0.4, jy - 0.4, 0.8, 0.8, 0, mix(P.limewhite, P.haldi, 0.4), 1);
  }
  dab(ctx, hx + 13, hy - 6, 1.4, 1.4, 0, P.sindoor, 1); // bindi
  if (face === 'hit') {
    for (const ex of [hx + 7.5, hx + 15.5]) {
      taperStroke(ctx, [{ x: ex - 2.5, y: hy - 2 }, { x: ex + 1.5, y: hy }, { x: ex - 2.5, y: hy + 2 }], 1.6, P.ink, 1, [1, 1]);
    }
    dab(ctx, hx + 13, hy + 9, 2.2, 1.6, 0, mix(P.laterite, P.ink, 0.4), 1);
  } else {
    const happy = face === 'happy';
    for (const [ex, rx] of [[hx + 8, 2.9], [hx + 15.8, 2.1]] as const) {
      dab(ctx, ex, hy, rx, happy ? 3.2 : 3.9, 0, P.ink, 1);
      dab(ctx, ex + 0.8, hy - 1.4, rx * 0.42, rx * 0.42, 0, P.limewhite, 1);
    }
    taperStroke(ctx, [{ x: hx + 5, y: hy - 3.4 }, { x: hx + 8, y: hy - 4.6 }, { x: hx + 11, y: hy - 3.6 }], 1.1, P.ink, 0.9, [0.3, 0.6]);
    taperStroke(ctx, [{ x: hx + 5, y: hy - 8 }, { x: hx + 8.5, y: hy - 9.2 }, { x: hx + 11, y: hy - 8.4 }], 1, T.hair, 0.8);
    taperStroke(ctx, [{ x: hx + 19.2, y: hy + 1 }, { x: hx + 20.4, y: hy + 4.2 }, { x: hx + 18.8, y: hy + 5 }], 1, T.skinShade, 1, [0.4, 0.4]);
    if (happy) {
      ctx.fillStyle = mix(P.laterite, P.ink, 0.35);
      ctx.beginPath();
      ctx.ellipse(hx + 14.5, hy + 9, 2.8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      taperStroke(ctx, [{ x: hx + 11, y: hy + 8.4 }, { x: hx + 14, y: hy + 10.2 }, { x: hx + 17, y: hy + 8.6 }], 1.4, mix(P.laterite, P.ink, 0.35), 1, [0.5, 0.5]);
    }
  }
  dab(ctx, hx + 7, hy + 6, 3.6, 2.4, 0, T.cheek, 0.28);
}

function helmet(ctx: Ctx): void {
  const cx = HEAD.x - 2, cy = HEAD.y - 3, r = 26;
  ctx.fillStyle = withAlpha(mix(P.seafoam, P.neonCyan, 0.3), 0.16);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = withAlpha(P.limewhite, 0.75);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = withAlpha(P.neonCyan, 0.55);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.4, Math.PI * 0.9, Math.PI * 1.6);
  ctx.stroke();
  // glassy highlights
  taperStroke(ctx, [{ x: cx + 8, y: cy - 21 }, { x: cx + 17, y: cy - 15 }, { x: cx + 22, y: cy - 6 }], 3.4, P.limewhite, 0.6, [0.2, 0.2]);
  dab(ctx, cx + 18, cy + 9, 2, 1.4, 0.5, P.limewhite, 0.5);
  // neck ring
  ctx.fillStyle = P.haldi;
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + r - 2, 13, 3.4, 0.05, 0, TAU);
  ctx.fill();
  ctx.fillStyle = mix(P.haldi, P.laterite, 0.4);
  ctx.fillRect(cx - 9, cy + r - 2, 24, 1.4);
  // tie loop for the ribbon at the back of the helmet
  dab(ctx, cx - 17, cy - 10, 2.2, 2.2, 0, T.border, 1);
}

// =============================================================================
// Shared ride parts
// =============================================================================
const ink = P.ink;
const woodC = mix(P.laterite, P.chandan, 0.25);
const woodL = mix(P.chandan, P.haldi, 0.3);
const woodD = mix(P.laterite, P.ink, 0.42);
const woodO = mix(P.laterite, P.ink, 0.65);

interface WheelO { rim: string; spoke: string; hub: string; tyre?: string; spokes: number; rimW?: number; spokeW?: number; tyreW?: number }
function wheel(ctx: Ctx, x: number, y: number, r: number, ang: number, o: WheelO): void {
  if (o.tyre) {
    ctx.strokeStyle = o.tyre;
    ctx.lineWidth = o.tyreW ?? 3;
    ctx.beginPath();
    ctx.arc(x, y, r - (o.tyreW ?? 3) / 2, 0, TAU);
    ctx.stroke();
  }
  const rr = r - (o.tyre ? (o.tyreW ?? 3) : 0);
  ctx.strokeStyle = o.rim;
  ctx.lineWidth = o.rimW ?? 2.6;
  ctx.beginPath();
  ctx.arc(x, y, rr - (o.rimW ?? 2.6) / 2, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = o.spoke;
  ctx.lineWidth = o.spokeW ?? 1.6;
  ctx.beginPath();
  for (let i = 0; i < o.spokes; i++) {
    const a = ang + (i / o.spokes) * TAU;
    ctx.moveTo(x + Math.cos(a) * 2, y + Math.sin(a) * 2);
    ctx.lineTo(x + Math.cos(a) * (rr - 1), y + Math.sin(a) * (rr - 1));
  }
  ctx.stroke();
  dab(ctx, x, y, Math.max(2, r * 0.16), Math.max(2, r * 0.16), 0, o.hub, 1);
}

/** Calm water-line foam at a hull (x0..x1 at y), for boats. */
function foam(ctx: Ctx, rng: Rng, x0: number, x1: number, y: number, phase: number, amt = 1): void {
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const x = lerp(x0, x1, t) + Math.sin(phase * TAU + i) * 2;
    dab(ctx, x, y + rng.range(-0.5, 1.2), rng.range(3, 7) * amt, rng.range(0.9, 1.6), 0, P.limewhite, rng.range(0.35, 0.7));
  }
  // bow wave
  const bx = x1 + 4;
  taperStroke(ctx, [{ x: bx - 14, y: y + 1 }, { x: bx - 4, y: y - 3 - Math.sin(phase * TAU) * 1.2 }, { x: bx + 6, y: y + 1 }], 3 * amt, P.limewhite, 0.75, [0.2, 0.2]);
}

// =============================================================================
// canoe (the existing Record 01 sprite)
// =============================================================================
function canoeRide(): RideSprite {
  const n = 8;
  const frames = Array.from({ length: n }, (_, i) => paintTaapoiFrame({ kind: 'paddle', phase: i / n }));
  return {
    frames, jump: paintTaapoiFrame({ kind: 'jump' }), hit: paintTaapoiFrame({ kind: 'hit' }),
    ox: TAAPOI_FRAME.originX, oy: TAAPOI_FRAME.originY, ribbon: { ...RIBBON_ANCHOR }, cycleHz: 1.2,
  };
}

// =============================================================================
// foot: a proper run cycle
// =============================================================================
const RUN_GROUND = 37.5; // waist height above the feet while running

function runLegs(p: number): { fN: Pt; fF: Pt } {
  const f = (q: number): Pt => {
    const s = Math.sin(q * TAU), c = Math.cos(q * TAU);
    const lift = Math.max(0, -s) * 10 + Math.max(0, -s) * Math.max(0, -c) * 6;
    return { x: 3 + c * 15, y: RUN_GROUND - lift };
  };
  return { fN: f(p), fF: f(p + 0.5) };
}

function paintFoot(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  softShadow(ctx, 0, 0, 24, 4, P.ink, 0.22);
  if (st.k === 'cycle') {
    const bob = -Math.abs(Math.cos(p * TAU)) * 2.2;
    const { fN, fF } = runLegs(p);
    const sN = Math.cos(p * TAU); // near arm swings opposite to near leg
    ctx.save();
    ctx.translate(0, -RUN_GROUND + bob);
    girl(ctx, rng, {
      lower: 'stand', lean: 0.16, footN: fN, footF: fF, hem: -3 - Math.sin(p * TAU * 2) * 1.6,
      near: { x: 6 - sN * 17, y: -2 - Math.max(0, -sN) * 10 }, far: { x: 2 + sN * 17, y: -5 - Math.max(0, sN) * 10 },
      nearBend: -1, farBend: -1,
    });
    ctx.restore();
  } else if (st.k === 'jump') {
    ctx.save();
    ctx.translate(0, -RUN_GROUND);
    girl(ctx, rng, {
      lower: 'stand', lean: 0.04, face: 'happy', footN: { x: 13, y: 26 }, footF: { x: -6, y: 33 }, kneeF: -1, hem: -5,
      near: CHEER, far: { x: -4, y: -38 }, nearBend: 1, farBend: -1, openHand: true,
    });
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(-2, -RUN_GROUND);
    girl(ctx, rng, {
      lower: 'stand', lean: -0.16, face: 'hit', footN: { x: 12, y: RUN_GROUND }, footF: { x: -8, y: RUN_GROUND - 3 }, hem: 3,
      near: { x: 22, y: -22 }, far: { x: 16, y: -28 }, nearBend: 1, farBend: 1,
    });
    ctx.restore();
  }
}

// =============================================================================
// cart: a cozy bullock pulling a small hooded cart, Taapoi holding the reins
// =============================================================================
const bullC = mix(P.limewhite, P.skyCream, 0.45);
const bullL = P.limewhite;
const bullD = mix(P.khondalite, P.skyCream, 0.35);

interface BullO { phase: number; jump?: boolean; startle?: boolean }

function bullockLeg(ctx: Ctx, x: number, q: number, far: boolean, front: boolean, jump?: boolean): void {
  const c = Math.cos(q * TAU), s = Math.sin(q * TAU);
  let dx = c * 5, lift = Math.max(0, -s) * 4.5;
  if (jump) { dx = front ? 5 : -5; lift = 6; }
  const top = { x, y: -24 };
  const foot = { x: x + dx, y: -lift };
  const kn = { x: lerp(top.x, foot.x, 0.5) + (front ? -1 : 1) * (lift * 0.5 + 0.6), y: -11 - lift * 0.5 };
  const col = far ? mix(bullD, P.khondalite, 0.25) : bullC;
  taperStroke(ctx, [top, kn], 7, col, 1, [1, 0.7]);
  taperStroke(ctx, [kn, foot], 4.2, col, 1, [0.9, 0.8]);
  dab(ctx, foot.x + 0.6, foot.y - 1.2, 2.6, 1.8, 0, mix(P.khondalite, P.ink, 0.55), 1);
}

function bullock(ctx: Ctx, rng: Rng, o: BullO): void {
  const p = o.phase;
  // far legs
  bullockLeg(ctx, -23, p + 0.5, true, false, o.jump);
  bullockLeg(ctx, 12, p + 0.75, true, true, o.jump);
  // tail
  const sw = Math.sin(p * TAU) * 3;
  taperStroke(ctx, [{ x: -27, y: -36 }, { x: -32, y: -26 }, { x: -31 + sw, y: -14 }], 2, bullD, 1, [1, 0.6]);
  dab(ctx, -31 + sw, -12, 2, 3.4, 0.2, mix(P.khondalite, P.ink, 0.5), 1);
  // body
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-28, -36);
    ctx.bezierCurveTo(-20, -43, 2, -41, 9, -42);
    ctx.quadraticCurveTo(14, -53, 22, -42);
    ctx.quadraticCurveTo(29, -38, 30, -31);
    ctx.quadraticCurveTo(30, -20, 21, -19);
    ctx.quadraticCurveTo(0, -15, -22, -20);
    ctx.quadraticCurveTo(-31, -25, -28, -36);
    ctx.closePath();
  };
  paintedShape(ctx, rng, body, { x: -31, y: -53, w: 62, h: 38 }, { base: bullC, light: bullL, shade: bullD, rim: mix(P.khondalite, P.ink, 0.2), rimW: 1.2, dabs: 26 });
  // dewlap + bell
  dab(ctx, 26, -22, 4, 6, 0.2, bullC, 1);
  taperStroke(ctx, [{ x: 22, y: -36 }, { x: 25, y: -27 }, { x: 28, y: -24 }], 1.4, T.border, 1, [1, 1]);
  dab(ctx, 28.5, -22, 2.6, 2.8, 0, P.haldi, 1);
  dab(ctx, 28.5, -20.5, 1, 0.8, 0, mix(P.haldi, P.ink, 0.5), 1);
  // near legs
  bullockLeg(ctx, -18, p, false, false, o.jump);
  bullockLeg(ctx, 17, p + 0.25, false, true, o.jump);
  // head (bobs with the step)
  const nod = o.startle ? -4 : Math.sin(p * TAU * 2) * 1.2;
  ctx.save();
  ctx.translate(30, -36 + nod);
  ctx.rotate(o.startle ? -0.25 : 0);
  // horns (painted sindoor with haldi tips, as at festivals)
  taperStroke(ctx, [{ x: 1, y: -6 }, { x: -2, y: -13 }, { x: -6, y: -18 }], 3, mix(T.border, P.ink, 0.25), 1, [1, 0.3]);
  taperStroke(ctx, [{ x: 3, y: -6 }, { x: 2, y: -14 }, { x: -1, y: -20 }], 3.2, T.border, 1, [1, 0.3]);
  dab(ctx, -0.6, -19.2, 1.3, 1.3, 0, P.haldi, 1);
  const headP = () => {
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.quadraticCurveTo(6, -9, 9, -4);
    ctx.lineTo(14, 8);
    ctx.quadraticCurveTo(13, 13, 8, 12);
    ctx.quadraticCurveTo(1, 6, -2, 2);
    ctx.closePath();
  };
  paintedShape(ctx, rng, headP, { x: -2, y: -9, w: 16, h: 22 }, { base: bullC, light: bullL, shade: bullD, rim: mix(P.khondalite, P.ink, 0.2), rimW: 1, dabs: 8, lightFrom: 'top' });
  dab(ctx, 11, 9.5, 3.6, 3, 0.5, mix(P.khondalite, P.chandan, 0.35), 1); // muzzle
  dab(ctx, 12.6, 8.6, 0.8, 0.8, 0, P.ink, 0.8);
  dab(ctx, 5.4, -1.4, 1.4, 1.5, 0, P.ink, 1); // eye
  dab(ctx, 5.8, -1.9, 0.5, 0.5, 0, P.limewhite, 1);
  taperStroke(ctx, [{ x: 3.6, y: -3.2 }, { x: 5.5, y: -3.6 }, { x: 7, y: -3 }], 0.8, P.ink, 0.8); // lash
  taperStroke(ctx, [{ x: 0, y: -3 }, { x: -6, y: -2 }, { x: -9, y: 0 }], 4, bullD, 1, [1, 0.4]); // ear
  dab(ctx, 2, 1, 2.2, 1.4, 0, T.border, 0.9); // painted dot on the cheek strap
  ctx.restore();
  // yoke across the neck
  ctx.fillStyle = woodC;
  ctx.beginPath();
  ctx.ellipse(19, -44, 3, 3.4, 0, 0, TAU);
  ctx.fill();
  taperStroke(ctx, [{ x: 17, y: -47 }, { x: 22, y: -36 }], 2.4, woodD, 1, [1, 1]);
}

function cartWheel(ctx: Ctx, x: number, y: number, r: number, ang: number, far = false): void {
  wheel(ctx, x, y, r, ang, {
    tyre: far ? mix(P.khondalite, P.ink, 0.6) : mix(P.khondalite, P.ink, 0.35), tyreW: 2.4,
    rim: far ? mix(woodD, P.ink, 0.3) : woodC, rimW: 4,
    spoke: far ? mix(woodD, P.ink, 0.3) : woodC, spokeW: 2.2, spokes: 8, hub: far ? woodO : woodD,
  });
  if (!far) {
    ctx.strokeStyle = withAlpha(woodL, 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r - 4.5, Math.PI * 1.05, Math.PI * 1.6);
    ctx.stroke();
    dab(ctx, x, y, 1.4, 1.4, 0, P.haldi, 1);
  }
}

function paintCart(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const ang = st.k === 'cycle' ? (p * TAU) / 8 : 0.2;
  const sway = st.k === 'cycle' ? Math.sin(p * TAU * 2) * 0.6 : 0;
  softShadow(ctx, 0, 0, 74, 5, P.ink, 0.22);
  ctx.save();
  ctx.translate(2, 0);
  cartWheel(ctx, -36, -19, 18, ang + 0.2, true);
  // bullock
  ctx.save();
  ctx.translate(36, 0);
  bullock(ctx, rng, { phase: p, jump, startle: hit });
  ctx.restore();
  // shaft from bed to the yoke
  taperStroke(ctx, [{ x: -16, y: -33 }, { x: 20, y: -38 }, { x: 54, y: -44 }], 3.4, woodD, 1, [1, 1]);
  taperStroke(ctx, [{ x: -16, y: -34 }, { x: 20, y: -39 }, { x: 54, y: -45 }], 1.4, woodL, 0.8, [1, 1]);
  ctx.translate(0, sway);
  // bed
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: -74, y: -38 }, { x: -12, y: -38 }, { x: -10, y: -30 }, { x: -72, y: -29 }]), { x: -74, y: -38, w: 64, h: 9 }, { base: woodC, light: woodL, shade: woodD, rim: woodO, rimW: 1.2, dabs: 12 });
  ctx.fillStyle = P.haldi;
  ctx.fillRect(-70, -35, 56, 1.6);
  for (let x = -66; x < -14; x += 8) dab(ctx, x, -31.6, 1.4, 1.2, 0, T.border, 0.9);
  // hood (chhai): woven, arched
  const hood = () => {
    ctx.beginPath();
    ctx.moveTo(-76, -38);
    ctx.lineTo(-76, -64);
    ctx.quadraticCurveTo(-74, -82, -54, -83);
    ctx.quadraticCurveTo(-36, -82, -34, -64);
    ctx.lineTo(-34, -38);
    ctx.closePath();
  };
  const straw = mix(P.haldi, P.chandan, 0.55);
  paintedShape(ctx, rng, hood, { x: -76, y: -83, w: 42, h: 45 }, { base: straw, light: mix(straw, P.limewhite, 0.4), shade: mix(straw, P.laterite, 0.45), rim: mix(P.laterite, P.ink, 0.45), rimW: 1.2, dabs: 14 });
  clipTo(ctx, hood, () => {
    ctx.strokeStyle = withAlpha(mix(straw, P.laterite, 0.55), 0.55);
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-76 + i * 0.2, -66 + i * 5.5);
      ctx.quadraticCurveTo(-55, -86 + i * 5.5 + i * 1.2, -34, -66 + i * 5.5);
      ctx.stroke();
    }
    for (let x = -72; x < -34; x += 4) taperStroke(ctx, [{ x, y: -80 }, { x, y: -38 }], 0.8, mix(straw, P.limewhite, 0.4), 0.35);
    // dark open front showing the inside
    ctx.fillStyle = withAlpha(mix(P.laterite, P.ink, 0.6), 0.75);
    ctx.beginPath();
    ctx.moveTo(-38, -38);
    ctx.lineTo(-38, -64);
    ctx.quadraticCurveTo(-39, -76, -45, -79);
    ctx.quadraticCurveTo(-35, -78, -34, -64);
    ctx.lineTo(-34, -38);
    ctx.closePath();
    ctx.fill();
  });
  taperStroke(ctx, [{ x: -76, y: -64 }, { x: -74, y: -82 }, { x: -54, y: -83 }, { x: -36, y: -80 }, { x: -34, y: -64 }], 2.4, T.border, 1, [1, 1]);
  ctx.translate(0, -sway);
  // Taapoi on the front of the bed, reins in hand
  ctx.save();
  ctx.translate(-22, -52 + sway);
  const nearH: Pt = jump ? CHEER : hit ? { x: 20, y: -2 } : { x: 21, y: -4 + Math.sin(p * TAU) * 0.8 };
  const farH: Pt = hit ? { x: 16, y: -6 } : { x: 18, y: -7 };
  girl(ctx, rng, {
    lower: 'astride', footN: { x: 20, y: 25 + Math.sin(p * TAU) * 1.2 }, footF: { x: 15, y: 24 }, kneeN: -1, kneeF: -1,
    lean: hit ? -0.14 : 0.03, face: jump ? 'happy' : hit ? 'hit' : 'calm',
    near: nearH, far: farH, nearBend: jump ? -1 : 1, farBend: 1, openHand: jump,
    between: () => {
      // reins from her hands to the bullock's nose
      const nose = { x: 36 + 41 + 22, y: -26.5 + 52 - sway };
      ctx.strokeStyle = mix(P.laterite, P.ink, 0.5);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(farH.x + 1, farH.y);
      ctx.quadraticCurveTo(52, 6, nose.x, nose.y + (hit ? -6 : 0));
      ctx.stroke();
      if (!jump) {
        ctx.beginPath();
        ctx.moveTo(nearH.x + 1, nearH.y);
        ctx.quadraticCurveTo(54, 8, nose.x, nose.y + 1 + (hit ? -6 : 0));
        ctx.stroke();
      }
    },
  });
  ctx.restore();
  cartWheel(ctx, -40, -19, 19, ang);
  ctx.restore();
}

// =============================================================================
// elephant: a gentle caparisoned elephant, Taapoi on its neck
// =============================================================================
const eleC = mix(P.khondalite, P.neel, 0.1);
const eleL = mix(P.khondalite, P.limewhite, 0.35);
const eleD = mix(P.khondalite, P.ink, 0.3);
const earC = mix(eleC, P.chandan, 0.22);

interface EleO { phase: number; jump?: boolean; startle?: boolean; caparison?: boolean; trunkTo?: Pt }

function eleLeg(ctx: Ctx, x: number, q: number, far: boolean, jump?: boolean): void {
  const c = Math.cos(q * TAU), s = Math.sin(q * TAU);
  let dx = c * 4.5, lift = Math.max(0, -s) * 4;
  if (jump) { dx = x > 0 ? 4 : -3; lift = 5; }
  const col = far ? eleD : eleC;
  const top = { x, y: -28 };
  const foot = { x: x + dx, y: -lift };
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(top.x - 7, top.y);
  ctx.quadraticCurveTo(lerp(top.x, foot.x, 0.5) - 7.5, -14 - lift * 0.5, foot.x - 7, foot.y - 1);
  ctx.quadraticCurveTo(foot.x, foot.y + 1, foot.x + 7, foot.y - 1);
  ctx.quadraticCurveTo(lerp(top.x, foot.x, 0.5) + 7.5, -14 - lift * 0.5, top.x + 7, top.y);
  ctx.closePath();
  ctx.fill();
  if (!far) taperStroke(ctx, [{ x: top.x - 4, y: top.y + 2 }, { x: foot.x - 5, y: foot.y - 6 }], 2.2, eleL, 0.35);
  // haldi anklet + toenails
  taperStroke(ctx, [{ x: foot.x - 6.8, y: foot.y - 8 }, { x: foot.x + 6.8, y: foot.y - 8 }], 2.6, far ? mix(P.haldi, P.khondalite, 0.4) : P.haldi, 1, [1, 1]);
  for (let i = 0; i < 3; i++) dab(ctx, foot.x - 3 + i * 3.4, foot.y - 1.8, 1.3, 1.1, 0, far ? eleL : mix(P.limewhite, P.khondalite, 0.15), 1);
}

/** Elephant standing on (0,0), back ≈ −56, head top ≈ −66, trunk tip ≈ +58. */
function elephantBody(ctx: Ctx, rng: Rng, o: EleO): { neck: Pt; drawEar: () => void } {
  const p = o.phase;
  eleLeg(ctx, -34, p + 0.5, true, o.jump);
  eleLeg(ctx, 14, p + 0.75, true, o.jump);
  // tail
  const sw = Math.sin(p * TAU) * 2.5;
  taperStroke(ctx, [{ x: -44, y: -42 }, { x: -50, y: -30 }, { x: -49 + sw, y: -20 }], 2.2, eleD, 1, [1, 0.6]);
  dab(ctx, -49 + sw, -18, 1.8, 3, 0.2, P.ink, 0.8);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-46, -36);
    ctx.bezierCurveTo(-47, -54, -26, -59, -6, -58);
    ctx.bezierCurveTo(12, -58, 24, -56, 30, -48);
    ctx.quadraticCurveTo(34, -30, 26, -22);
    ctx.quadraticCurveTo(-8, -16, -38, -22);
    ctx.quadraticCurveTo(-48, -26, -46, -36);
    ctx.closePath();
  };
  paintedShape(ctx, rng, body, { x: -48, y: -60, w: 82, h: 44 }, { base: eleC, light: eleL, shade: eleD, rim: mix(eleD, P.ink, 0.3), rimW: 1.2, dabs: 34 });
  // head + trunk
  const tr = o.startle ? 1 : Math.sin(p * TAU) * 1;
  const tip = o.trunkTo ?? (o.startle ? { x: 66, y: -66 } : { x: 60 + tr * 2, y: -10 + tr });
  const trunk = o.startle
    ? [{ x: 46, y: -40 }, { x: 58, y: -44 }, { x: 64, y: -56 }, tip]
    : [{ x: 46, y: -40 }, { x: 54, y: -30 }, { x: 55 + tr, y: -18 }, tip];
  taperStroke(ctx, trunk, 13, eleC, 1, [1, 0.45]);
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const a = trunk[Math.min(trunk.length - 1, Math.floor(t * 3))], b = trunk[Math.min(trunk.length - 1, Math.floor(t * 3) + 1)];
    const f = t * 3 - Math.floor(t * 3);
    const x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f);
    taperStroke(ctx, [{ x: x - 3, y: y - 1 }, { x: x + 3, y: y + 1 }], 0.9, eleD, 0.5);
  }
  const headP = () => {
    ctx.beginPath();
    ctx.ellipse(38, -48, 15, 18, 0.15, 0, TAU);
  };
  paintedShape(ctx, rng, headP, { x: 22, y: -66, w: 32, h: 36 }, { base: eleC, light: eleL, shade: eleD, dabs: 14, lightFrom: 'top' });
  // tusk + smile
  taperStroke(ctx, [{ x: 46, y: -36 }, { x: 52, y: -33 }, { x: 55, y: -35 }], 3, P.limewhite, 1, [1, 0.3]);
  taperStroke(ctx, [{ x: 42, y: -35 }, { x: 45, y: -33 }, { x: 47, y: -35 }], 1, eleD, 0.9);
  // eye with lashes
  dab(ctx, 44, -50, 1.8, 2.2, 0, P.ink, 1);
  dab(ctx, 44.6, -50.8, 0.6, 0.6, 0, P.limewhite, 1);
  taperStroke(ctx, [{ x: 41.5, y: -52.6 }, { x: 44, y: -53.6 }, { x: 46.6, y: -52.4 }], 1, P.ink, 0.8);
  if (o.caparison !== false) {
    // head cloth: a sindoor drape with haldi border and a little mirror
    const hc = () => {
      ctx.beginPath();
      ctx.moveTo(30, -62);
      ctx.quadraticCurveTo(40, -68, 50, -60);
      ctx.lineTo(53, -46);
      ctx.quadraticCurveTo(51, -38, 47, -42);
      ctx.lineTo(42, -54);
      ctx.quadraticCurveTo(36, -58, 30, -62);
      ctx.closePath();
    };
    hc();
    ctx.fillStyle = T.border;
    ctx.fill();
    clipTo(ctx, hc, () => {
      ctx.strokeStyle = P.haldi;
      ctx.lineWidth = 2.6;
      hc();
      ctx.stroke();
    });
    dab(ctx, 48.5, -50, 2, 2.4, 0, P.haldi, 1);
    dab(ctx, 48.5, -50, 1, 1.2, 0, P.limewhite, 1);
    dab(ctx, 49, -41, 1.6, 1.6, 0, P.marigold, 1);
    // caparison over the back
    const cp = () => {
      ctx.beginPath();
      ctx.moveTo(-36, -54);
      ctx.bezierCurveTo(-26, -60, -4, -60, 14, -58);
      ctx.lineTo(16, -34);
      for (let i = 0; i <= 8; i++) {
        const x = 16 - i * 6.5;
        ctx.quadraticCurveTo(x - 3.25, -27 + (i % 2) * 0.5, x - 6.5, -32);
      }
      ctx.lineTo(-37, -50);
      ctx.closePath();
    };
    paintedShape(ctx, rng, cp, { x: -38, y: -60, w: 56, h: 34 }, { base: T.border, light: mix(T.border, P.haldi, 0.4), shade: mix(T.border, P.ink, 0.3), dabs: 14 });
    clipTo(ctx, cp, () => {
      ctx.strokeStyle = P.haldi;
      ctx.lineWidth = 5;
      cp();
      ctx.stroke();
      ctx.fillStyle = P.haldi;
      ctx.fillRect(-40, -52, 60, 1.4);
      for (let i = 0; i < 4; i++) {
        const x = -27 + i * 12, y = -43;
        ctx.fillStyle = i % 2 ? P.tota : P.rani;
        ctx.beginPath();
        ctx.moveTo(x, y - 6); ctx.lineTo(x + 4.5, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 4.5, y);
        ctx.closePath();
        ctx.fill();
        dab(ctx, x, y, 1.6, 1.6, 0, P.limewhite, 1);
      }
    });
    for (let i = 0; i < 8; i++) {
      const x = 12.75 - i * 6.5;
      taperStroke(ctx, [{ x, y: -29 }, { x: x + 0.4, y: -24.5 }], 1.6, P.marigold, 1, [1, 0.6]);
      dab(ctx, x + 0.4, -23.5, 1.4, 1.6, 0, P.marigold, 1);
    }
  }
  const flap = Math.sin(p * TAU * 2) * 1.2;
  const drawEar = () => {
    const ear = () => {
      ctx.beginPath();
      ctx.moveTo(30, -60);
      ctx.bezierCurveTo(16 - flap, -64, 12 - flap, -40, 20 - flap * 0.5, -32);
      ctx.quadraticCurveTo(26, -28, 32, -36);
      ctx.quadraticCurveTo(34, -50, 30, -60);
      ctx.closePath();
    };
    paintedShape(ctx, rng, ear, { x: 12, y: -64, w: 22, h: 36 }, { base: earC, light: mix(earC, P.limewhite, 0.3), shade: eleD, rim: mix(eleD, P.ink, 0.3), rimW: 1, dabs: 8, lightFrom: 'left' });
    dab(ctx, 22 - flap * 0.4, -44, 3, 5, 0.3, mix(earC, P.rani, 0.25), 0.35);
  };
  eleLeg(ctx, -28, p, false, o.jump);
  eleLeg(ctx, 20, p + 0.25, false, o.jump);
  return { neck: { x: 18, y: -57 }, drawEar };
}

function paintElephant(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  softShadow(ctx, 0, 0, 58, 5, P.ink, 0.22);
  ctx.save();
  ctx.translate(-6, 0);
  ctx.scale(0.93, 0.93);
  const sway = st.k === 'cycle' ? Math.sin(p * TAU * 2) * 0.8 : 0;
  const e = elephantBody(ctx, rng, { phase: p, jump, startle: hit });
  // cushion on the neck
  dab(ctx, e.neck.x - 2, e.neck.y + 1 + sway, 11, 4, -0.1, P.haldi, 1);
  dab(ctx, e.neck.x - 2, e.neck.y + 3 + sway, 11, 1.6, -0.1, T.border, 1);
  ctx.save();
  ctx.translate(e.neck.x, e.neck.y - 13 + sway);
  girl(ctx, rng, {
    lower: 'astride', footN: { x: 12, y: 26 }, footF: { x: 8, y: 24 }, kneeN: -1, kneeF: -1,
    lean: hit ? -0.16 : 0.04 + sway * 0.01, face: jump ? 'happy' : hit ? 'hit' : 'calm',
    near: jump ? CHEER : hit ? { x: 20, y: -10 } : { x: 17, y: 2 }, far: jump ? { x: 10, y: 0 } : { x: 14, y: 1 },
    nearBend: jump ? -1 : 1, openHand: jump,
    between: () => {
      // a rope of the caparison to hold on to
      ctx.strokeStyle = mix(T.border, P.ink, 0.2);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(4, 14);
      ctx.quadraticCurveTo(14, 4, 22, 10);
      ctx.stroke();
    },
  });
  ctx.restore();
  e.drawEar();
  ctx.restore();
}

// =============================================================================
// Boats: boita, boita with an elephant, country boat, e-boat
// =============================================================================
const hullC = mix(P.laterite, P.ink, 0.12);
const hullL = mix(P.laterite, P.chandan, 0.45);
const hullD = mix(P.laterite, P.ink, 0.5);

interface HullO { x0: number; x1: number; deck: number; keel: number; prow: number; stern: number; base?: string; light?: string; shade?: string }
function boatHullPath(ctx: Ctx, o: HullO): void {
  ctx.beginPath();
  ctx.moveTo(o.x0, o.deck - o.stern);
  ctx.quadraticCurveTo(o.x0 + 8, o.deck, o.x0 + 24, o.deck);
  ctx.lineTo(o.x1 - 26, o.deck);
  ctx.quadraticCurveTo(o.x1 - 8, o.deck - 1, o.x1, o.deck - o.prow);
  ctx.quadraticCurveTo(o.x1 - 4, o.keel - 2, o.x1 - 36, o.keel);
  ctx.lineTo(o.x0 + 32, o.keel);
  ctx.quadraticCurveTo(o.x0 + 6, o.keel - 3, o.x0, o.deck - o.stern);
  ctx.closePath();
}

function boatHull(ctx: Ctx, rng: Rng, o: HullO): void {
  const base = o.base ?? hullC, light = o.light ?? hullL, shade = o.shade ?? hullD;
  paintedShape(ctx, rng, () => boatHullPath(ctx, o), { x: o.x0, y: o.deck - Math.max(o.prow, o.stern), w: o.x1 - o.x0, h: o.keel - o.deck + Math.max(o.prow, o.stern) }, { base, light, shade, rim: mix(shade, P.ink, 0.4), rimW: 1.4, dabs: 40 });
  clipTo(ctx, () => boatHullPath(ctx, o), () => {
    for (let i = 0; i < 3; i++) {
      const y = o.deck + 3 + i * ((o.keel - o.deck - 4) / 3);
      taperStroke(ctx, [{ x: o.x0 + 6, y: y - 2 }, { x: (o.x0 + o.x1) / 2, y: y + 1 }, { x: o.x1 - 6, y: y - 2 }], 0.9, shade, 0.55, [0.3, 0.3]);
    }
  });
  taperStroke(ctx, [{ x: o.x0 + 2, y: o.deck - o.stern + 2 }, { x: o.x0 + 22, y: o.deck + 0.6 }, { x: o.x1 - 24, y: o.deck + 0.6 }, { x: o.x1 - 2, y: o.deck - o.prow + 2 }], 2.2, mix(light, P.limewhite, 0.3), 0.9, [0.3, 0.3]);
}

function boitaDecor(ctx: Ctx, o: HullO): void {
  ctx.fillStyle = P.haldi;
  ctx.fillRect(o.x0 + 22, o.deck + 3, o.x1 - o.x0 - 50, 2);
  for (let x = o.x0 + 28; x < o.x1 - 30; x += 12) {
    dab(ctx, x, o.deck + 8.5, 2.6, 2.6, 0, P.haldi, 0.95);
    dab(ctx, x, o.deck + 8.5, 1.1, 1.1, 0, T.border, 1);
  }
  // painted eye on the prow
  const ex = o.x1 - 14, ey = o.deck - o.prow * 0.35;
  dab(ctx, ex, ey, 4.4, 2.8, -0.2, P.limewhite, 1);
  dab(ctx, ex + 0.6, ey, 1.8, 1.8, 0, P.ink, 1);
  taperStroke(ctx, [{ x: ex - 6, y: ey - 2 }, { x: ex, y: ey - 4.4 }, { x: ex + 6, y: ey - 2.4 }], 1, P.ink, 0.9);
}

function stripedSail(ctx: Ctx, rng: Rng, mx: number, top: number, w: number, h: number, bulge: number, cols: string[]): void {
  const x0 = mx - w / 2, x1 = mx + w / 2;
  const sail = () => {
    ctx.beginPath();
    ctx.moveTo(x0, top);
    ctx.lineTo(x1, top);
    ctx.quadraticCurveTo(x1 + bulge, top + h * 0.5, x1 - 1, top + h);
    ctx.lineTo(x0 + 1, top + h);
    ctx.quadraticCurveTo(x0 + bulge * 0.6, top + h * 0.5, x0, top);
    ctx.closePath();
  };
  sail();
  ctx.fillStyle = cols[0];
  ctx.fill();
  clipTo(ctx, sail, () => {
    const n = 5;
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) continue;
      ctx.fillStyle = cols[1 + (Math.floor(i / 2) % (cols.length - 1))];
      ctx.beginPath();
      const y = top + (h / n) * i;
      ctx.moveTo(x0 - 5, y);
      ctx.quadraticCurveTo(mx, y + bulge * 0.25, x1 + bulge, y);
      ctx.lineTo(x1 + bulge, y + h / n);
      ctx.quadraticCurveTo(mx, y + h / n + bulge * 0.25, x0 - 5, y + h / n);
      ctx.closePath();
      ctx.fill();
    }
    const g = ctx.createLinearGradient(x0, 0, x1 + bulge, 0);
    g.addColorStop(0, withAlpha(mix(P.khondalite, P.laterite, 0.3), 0.35));
    g.addColorStop(0.55, withAlpha(P.limewhite, 0));
    g.addColorStop(0.85, withAlpha(P.limewhite, 0.25));
    g.addColorStop(1, withAlpha(mix(P.khondalite, P.laterite, 0.3), 0.2));
    ctx.fillStyle = g;
    ctx.fillRect(x0 - 2, top, w + bulge + 4, h);
    dabField(ctx, rng, x0, top, w, h, { n: 16, r: [2, 4], colours: [P.limewhite, mix(P.khondalite, P.skyCream, 0.5)], alpha: [0.06, 0.16] });
  });
  ctx.strokeStyle = mix(P.laterite, P.ink, 0.4);
  ctx.lineWidth = 1;
  sail();
  ctx.stroke();
}

function pennant(ctx: Ctx, x: number, y: number, p: number, col: string): void {
  const w = Math.sin(p * TAU) * 2;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 8, y - 2 + w, x - 18, y + 1 - w * 0.5);
  ctx.quadraticCurveTo(x - 9, y + 4 + w * 0.5, x, y + 6);
  ctx.closePath();
  ctx.fill();
}

function boitaShipRide(ctx: Ctx, rng: Rng, st: St, heavy: boolean): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const bob = st.k === 'cycle' ? Math.sin(p * TAU) * 1.4 : 0;
  const roll = st.k === 'cycle' ? Math.sin(p * TAU + 0.8) * 0.014 : jump ? -0.04 : 0.03;
  const H: HullO = heavy
    ? { x0: -96, x1: 94, deck: -12, keel: 12, prow: 30, stern: 22 }
    : { x0: -90, x1: 88, deck: -20, keel: 8, prow: 28, stern: 22 };
  if (st.k !== 'jump') foam(ctx, rng, H.x0 + 18, H.x1 - 30, 1, p, heavy ? 1.2 : 1);
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(roll);
  // mast, rigging and striped sail
  const mx = heavy ? -66 : -24, mTop = heavy ? -116 : -124;
  ctx.strokeStyle = withAlpha(mix(P.laterite, P.ink, 0.6), 0.8);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(mx, mTop + 2); ctx.lineTo(H.x1 - 4, H.deck - H.prow + 4);
  ctx.moveTo(mx, mTop + 2); ctx.lineTo(H.x0 + 4, H.deck - H.stern + 4);
  ctx.stroke();
  taperStroke(ctx, [{ x: mx, y: H.deck }, { x: mx, y: mTop }], 3.4, woodD, 1, [1, 1]);
  const fill = st.k === 'cycle' ? Math.sin(p * TAU) * 1.5 : jump ? 3 : -1;
  const sw = heavy ? 44 : 58, sh = heavy ? 48 : 60;
  taperStroke(ctx, [{ x: mx - sw / 2 - 4, y: mTop + 6 }, { x: mx + sw / 2 + 4, y: mTop + 5 }], 2.4, woodD, 1, [1, 1]);
  stripedSail(ctx, rng, mx, mTop + 6, sw, sh, 9 + fill, [mix(P.limewhite, P.skyCream, 0.4), T.border, P.haldi]);
  pennant(ctx, mx, mTop - 2, p, T.border);
  dab(ctx, mx, mTop, 2, 2, 0, P.haldi, 1);
  // cargo bales at the stern
  if (!heavy) {
    for (let i = 0; i < 3; i++) dab(ctx, -66 + i * 11, H.deck - 5, 6.4, 5, 0, [P.haldi, P.limewhite, P.marigold][i], 1);
    for (let i = 0; i < 3; i++) taperStroke(ctx, [{ x: -66 + i * 11, y: H.deck - 10 }, { x: -66 + i * 11, y: H.deck }], 1, mix(P.laterite, P.ink, 0.4), 0.6);
  }
  if (heavy) {
    // the elephant, swaying gently on deck, reaching for Taapoi with its trunk
    ctx.save();
    ctx.translate(-14, H.deck);
    ctx.scale(0.62, 0.62);
    elephantBody(ctx, rng, { phase: st.k === 'cycle' ? p * 0.5 : 0, jump: false, startle: hit, trunkTo: hit ? undefined : { x: 70, y: -54 } }).drawEar();
    ctx.restore();
    // ropes tying it to the deck
    ctx.strokeStyle = mix(P.chandan, P.laterite, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-40, H.deck); ctx.lineTo(-30, H.deck - 22);
    ctx.moveTo(18, H.deck); ctx.lineTo(4, H.deck - 22);
    ctx.stroke();
  }
  // Taapoi at the prow
  const gx = heavy ? 54 : 46;
  ctx.save();
  ctx.translate(gx, H.deck - 15);
  girl(ctx, rng, {
    lower: 'seat', face: jump ? 'happy' : hit ? 'hit' : 'calm', lean: hit ? -0.14 : 0.04,
    near: jump ? CHEER : hit ? { x: 22, y: -14 } : { x: 24, y: 10 },
    far: jump ? { x: 6, y: -42 } : { x: 18, y: -27 }, nearBend: jump ? -1 : 1, farBend: -1, openHand: jump,
  });
  ctx.restore();
  boatHull(ctx, rng, H);
  boitaDecor(ctx, H);
  ctx.restore();
}

function paintBoita(ctx: Ctx, rng: Rng, st: St): void { boitaShipRide(ctx, rng, st, false); }
function paintBoitaElephant(ctx: Ctx, rng: Rng, st: St): void { boitaShipRide(ctx, rng, st, true); }

// country boat: low, tarred, a woven hood, one long oar; quiet
function paintCountryBoat(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const bob = st.k === 'cycle' ? Math.sin(p * TAU) * 1 : 0;
  const H: HullO = { x0: -92, x1: 88, deck: -14, keel: 6, prow: 16, stern: 12, base: mix(P.khondalite, P.ink, 0.45), light: mix(P.khondalite, P.laterite, 0.35), shade: mix(P.ink, P.neel, 0.15) };
  if (!jump) foam(ctx, rng, H.x0 + 20, H.x1 - 30, 1, p, 0.7);
  ctx.save();
  ctx.translate(0, bob);
  // hood (chhai) over the stern half
  const straw = mix(P.chandan, P.khondalite, 0.3);
  const hood = () => {
    ctx.beginPath();
    ctx.moveTo(-74, H.deck);
    ctx.quadraticCurveTo(-74, -52, -50, -54);
    ctx.quadraticCurveTo(-24, -52, -24, H.deck);
    ctx.closePath();
  };
  paintedShape(ctx, rng, hood, { x: -74, y: -54, w: 50, h: 40 }, { base: straw, light: mix(straw, P.skyCream, 0.4), shade: mix(straw, P.ink, 0.35), rim: mix(straw, P.ink, 0.5), rimW: 1.1, dabs: 14 });
  clipTo(ctx, hood, () => {
    ctx.strokeStyle = withAlpha(mix(straw, P.ink, 0.45), 0.6);
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-76, -40 + i * 6);
      ctx.quadraticCurveTo(-49, -60 + i * 7, -22, -40 + i * 6);
      ctx.stroke();
    }
  });
  // the oar: pivots on the gunwale; she pulls the handle, the blade sweeps the water behind
  const pull = st.k === 'cycle' ? (p < 0.6 ? smooth(p / 0.6) : 1 - smooth((p - 0.6) / 0.4)) : jump ? 0.2 : 0.6;
  const lift = st.k === 'cycle' && p >= 0.6 ? Math.sin(((p - 0.6) / 0.4) * Math.PI) * 5 : 0;
  const gx = 14, gy = H.deck - 15;
  const pivot = { x: 0, y: H.deck - 1 };
  const hand = { x: gx + lerp(26, 8, pull), y: gy + lerp(-4, 0, pull) + lift * 0.4 };
  const dir = { x: pivot.x - hand.x, y: pivot.y - hand.y };
  const dl = Math.hypot(dir.x, dir.y);
  const blade = { x: pivot.x + (dir.x / dl) * 70, y: Math.min(8, pivot.y + (dir.y / dl) * 70 - lift) };
  ctx.save();
  ctx.translate(gx, gy);
  girl(ctx, rng, {
    lower: 'seat', face: jump ? 'happy' : hit ? 'hit' : 'calm', lean: hit ? -0.16 : lerp(0.14, -0.08, pull),
    near: { x: hand.x - gx, y: hand.y - gy }, far: { x: hand.x - gx - 4, y: hand.y - gy - 1 }, nearBend: 1, farBend: 1,
    parts: 'body',
  });
  ctx.restore();
  boatHull(ctx, rng, H);
  // a thin laterite line and painted dots along the old hull
  ctx.fillStyle = mix(P.laterite, P.khondalite, 0.3);
  ctx.fillRect(H.x0 + 20, H.deck + 4, H.x1 - H.x0 - 46, 1.6);
  const oarC = mix(P.chandan, P.khondalite, 0.35);
  taperStroke(ctx, [{ x: hand.x + (hand.x - pivot.x) * 0.08, y: hand.y + (hand.y - pivot.y) * 0.08 }, blade], 3.2, mix(oarC, P.ink, 0.35), 1, [1, 1]);
  taperStroke(ctx, [{ x: hand.x, y: hand.y }, blade], 1.6, oarC, 1, [1, 1]);
  const ba = Math.atan2(blade.y - pivot.y, blade.x - pivot.x);
  ctx.save();
  ctx.translate(blade.x - Math.cos(ba) * 5, blade.y - Math.sin(ba) * 5);
  ctx.rotate(ba);
  dab(ctx, 0, 0, 10, 3.4, 0, mix(oarC, P.ink, 0.3), 1);
  ctx.restore();
  // thole pin
  dab(ctx, pivot.x, pivot.y - 1, 1.6, 3, 0, woodD, 1);
  if (!jump && blade.y > 2) dab(ctx, blade.x, 3, 8, 1.6, 0, P.limewhite, 0.6);
  ctx.save();
  ctx.translate(gx, gy);
  girl(ctx, rng, {
    lower: 'seat', lean: hit ? -0.16 : lerp(0.14, -0.08, pull),
    near: { x: hand.x - gx, y: hand.y - gy }, far: { x: hand.x - gx - 4, y: hand.y - gy - 1 }, nearBend: 1, farBend: 1, parts: 'arm',
  });
  ctx.restore();
  ctx.restore();
}

// e-boat: a sleek dugout's grandchild with a solar canopy and a cyan trim line
function paintEboat(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const bob = st.k === 'cycle' ? Math.sin(p * TAU) * 1.2 : 0;
  const H: HullO = { x0: -86, x1: 86, deck: -18, keel: 6, prow: 18, stern: 8, base: mix(P.limewhite, P.seafoam, 0.25), light: P.limewhite, shade: mix(P.neel, P.seafoam, 0.45) };
  if (!jump) {
    foam(ctx, rng, H.x0 + 10, H.x1 - 30, 1, p, 1);
    glow(ctx, H.x0 + 4, 0, 16, P.neonCyan, 0.35 + Math.sin(p * TAU) * 0.08);
  }
  ctx.save();
  ctx.translate(0, bob);
  // solar canopy on two slim posts
  taperStroke(ctx, [{ x: -40, y: H.deck }, { x: -38, y: -108 }], 2.2, mix(P.limewhite, P.neel, 0.3), 1, [1, 1]);
  taperStroke(ctx, [{ x: 52, y: H.deck }, { x: 46, y: -113 }], 2.2, mix(P.limewhite, P.neel, 0.3), 1, [1, 1]);
  const pan = () => polyPath(ctx, [{ x: -50, y: -108 }, { x: 52, y: -116 }, { x: 58, y: -110 }, { x: -48, y: -102 }]);
  pan();
  ctx.fillStyle = mix(P.neel, P.ink, 0.2);
  ctx.fill();
  clipTo(ctx, pan, () => {
    ctx.strokeStyle = withAlpha(P.haldi, 0.7);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = -46; x < 58; x += 7) { ctx.moveTo(x, -118); ctx.lineTo(x + 1, -100); }
    ctx.stroke();
    glow(ctx, 10, -110, 18, P.limewhite, 0.25);
  });
  ctx.fillStyle = P.neonCyan;
  ctx.fillRect(-48, -102.5, 104, 1);
  // Taapoi at the little wheel
  ctx.save();
  ctx.translate(6, H.deck - 15);
  const wheelAt = { x: 26, y: 2 };
  girl(ctx, rng, {
    lower: 'seat', face: jump ? 'happy' : hit ? 'hit' : 'calm', lean: hit ? -0.14 : 0.06,
    near: jump ? CHEER : { x: wheelAt.x - 2, y: wheelAt.y - 6 + Math.sin(p * TAU) }, far: { x: wheelAt.x - 1, y: wheelAt.y + 2 },
    nearBend: jump ? -1 : 1, farBend: 1, openHand: jump,
    between: () => {
      taperStroke(ctx, [{ x: wheelAt.x + 4, y: 18 }, { x: wheelAt.x + 1, y: wheelAt.y }], 2.4, mix(P.neel, P.ink, 0.3), 1, [1, 1]);
      ctx.strokeStyle = mix(P.neel, P.ink, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(wheelAt.x, wheelAt.y, 2.6, 7, 0.2, 0, TAU);
      ctx.stroke();
    },
  });
  ctx.restore();
  boatHull(ctx, rng, H);
  // dugout heritage: a carved haldi band; future: a neon-cyan trim line
  ctx.fillStyle = P.haldi;
  ctx.fillRect(H.x0 + 20, H.deck + 3, H.x1 - H.x0 - 48, 1.8);
  taperStroke(ctx, [{ x: H.x0 + 18, y: H.deck + 9 }, { x: 0, y: H.deck + 10.5 }, { x: H.x1 - 22, y: H.deck + 8 }], 1.8, P.neonCyan, 0.95, [0.4, 0.4]);
  dab(ctx, H.x1 - 12, H.deck - 6, 3.6, 2.4, -0.2, P.neonCyan, 0.9);
  // the motor pod
  dab(ctx, H.x0 + 6, -4, 6, 4, 0, mix(P.neel, P.ink, 0.3), 1);
  dab(ctx, H.x0 + 2, -4, 2, 2, 0, P.neonCyan, 1);
  ctx.restore();
}

// =============================================================================
// palanquin: two bearers jogging in step, Taapoi seated inside
// =============================================================================
const bearerSkin = mix(P.chandan, P.laterite, 0.32);
const bearerShade = mix(bearerSkin, P.laterite, 0.45);

interface BearerO { phase: number; cloth: string; scarf: string; jump?: boolean; hit?: boolean; poleY: number }

/** An adult bearer standing on (0,0), facing right, shoulder under the pole. */
function bearer(ctx: Ctx, o: BearerO): void {
  const p = o.phase;
  const hip = { x: 0, y: -48 };
  const footAt = (q: number): Pt => {
    if (o.jump) return q < 0.5 ? { x: 10, y: -12 } : { x: -12, y: -6 };
    const c = Math.cos(q * TAU), s = Math.sin(q * TAU);
    return { x: c * 11, y: -Math.max(0, -s) * 8 };
  };
  const legDraw = (q: number, far: boolean) => {
    const f = footAt(q);
    const k = joint(hip, f, 24, 25, -1);
    const col = far ? bearerShade : bearerSkin;
    taperStroke(ctx, [hip, k], 9, col, 1, [1, 0.8]);
    taperStroke(ctx, [k, f], 6.4, col, 1, [0.9, 0.7]);
    dab(ctx, f.x + 2.5, f.y - 1, 4.6, 2.2, 0, col, 1);
  };
  const lean = o.hit ? -0.12 : 0.06;
  const sh = add(hip, rot({ x: 0, y: -38 }, lean));
  // far leg + far arm up to the pole
  legDraw(p + 0.5, true);
  const hf = { x: sh.x - 9, y: o.poleY + 1 };
  taperStroke(ctx, [{ x: sh.x - 2, y: sh.y + 2 }, joint({ x: sh.x - 2, y: sh.y + 2 }, hf, 16, 15, -1), hf], 6, bearerShade, 1, [1, 0.8]);
  legDraw(p, false);
  // dhoti, tucked to the knee, with a haldi border
  ctx.fillStyle = o.cloth;
  ctx.beginPath();
  ctx.moveTo(hip.x - 9, hip.y - 6);
  ctx.lineTo(hip.x + 9, hip.y - 6);
  ctx.quadraticCurveTo(hip.x + 13, hip.y + 8, hip.x + 8, hip.y + 18);
  ctx.lineTo(hip.x - 10, hip.y + 16);
  ctx.quadraticCurveTo(hip.x - 13, hip.y + 4, hip.x - 9, hip.y - 6);
  ctx.closePath();
  ctx.fill();
  taperStroke(ctx, [{ x: hip.x - 10, y: hip.y + 15 }, { x: hip.x + 8, y: hip.y + 17 }], 2.4, P.haldi, 1, [1, 1]);
  taperStroke(ctx, [{ x: hip.x + 2, y: hip.y - 4 }, { x: hip.x + 4, y: hip.y + 15 }], 1.2, mix(o.cloth, P.khondalite, 0.4), 0.8);
  // torso: a simple cotton vest
  ctx.save();
  ctx.translate(hip.x, hip.y);
  ctx.rotate(lean);
  ctx.fillStyle = mix(P.limewhite, P.skyCream, 0.5);
  ctx.beginPath();
  ctx.moveTo(-9, -4);
  ctx.quadraticCurveTo(-12, -24, -8, -38);
  ctx.quadraticCurveTo(2, -42, 9, -37);
  ctx.quadraticCurveTo(12, -20, 9, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha(P.khondalite, 0.25);
  ctx.fillRect(-12, -40, 7, 38);
  // folded scarf (gamchha) on the shoulder as a pad under the pole
  dab(ctx, -1, -39, 9, 3.6, 0.1, o.scarf, 1);
  for (let i = 0; i < 4; i++) taperStroke(ctx, [{ x: -8 + i * 4.5, y: -41 }, { x: -7 + i * 4.5, y: -37 }], 1, P.limewhite, 0.7);
  taperStroke(ctx, [{ x: -6, y: -37 }, { x: -9, y: -26 }], 3.6, o.scarf, 1, [1, 0.6]);
  // neck + head with a limewhite turban
  taperStroke(ctx, [{ x: 1, y: -40 }, { x: 2, y: -45 }], 6, bearerShade, 1, [1, 1]);
  dab(ctx, 3, -51, 8.6, 9.4, 0, bearerSkin, 1);
  dab(ctx, -2, -50, 4, 6, 0, bearerShade, 0.5);
  dab(ctx, 1.5, -57, 9, 5, -0.1, P.limewhite, 1);
  dab(ctx, -4, -56, 4, 4, 0, mix(P.limewhite, P.khondalite, 0.25), 1);
  taperStroke(ctx, [{ x: -5, y: -58 }, { x: 4, y: -61 }, { x: 10, y: -57 }], 1.4, P.haldi, 0.9);
  dab(ctx, 7.6, -51, 1, 1.2, 0, P.ink, 1); // eye
  taperStroke(ctx, [{ x: 5, y: -46 }, { x: 8.5, y: -46.6 }, { x: 11, y: -45.6 }], 1.8, P.ink, 0.9, [0.5, 0.3]); // moustache
  dab(ctx, 11, -49.4, 1.4, 1.8, 0, bearerSkin, 1); // nose
  ctx.restore();
  // near arm up to the pole in front of the shoulder
  const sN = add(sh, { x: 5, y: 4 });
  const hn = { x: sh.x + 10, y: o.poleY + 1 };
  const en = joint(sN, hn, 16, 15, 1);
  taperStroke(ctx, [sN, en], 7, bearerSkin, 1, [1, 0.8]);
  taperStroke(ctx, [en, hn], 6, bearerSkin, 1, [0.9, 0.7]);
}

function paintPalanquin(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const bob = st.k === 'cycle' ? -Math.abs(Math.cos(p * TAU)) * 1.6 : jump ? -4 : 0;
  softShadow(ctx, 0, 0, 86, 5, P.ink, 0.2);
  const poleY = -86 + bob;
  const wood = mix(P.laterite, P.ink, 0.2);
  // the pole, behind the box (it hangs from brackets)
  const pole = () => {
    taperStroke(ctx, [{ x: -92, y: poleY + 1 }, { x: 0, y: poleY - 1.5 }, { x: 92, y: poleY + 1 }], 4.6, mix(P.chandan, P.laterite, 0.45), 1, [1, 1]);
    taperStroke(ctx, [{ x: -90, y: poleY }, { x: 0, y: poleY - 2.4 }, { x: 90, y: poleY }], 1.2, mix(P.chandan, P.haldi, 0.4), 0.8, [1, 1]);
    dab(ctx, 92, poleY + 1, 3, 3, 0, P.haldi, 1);
    dab(ctx, -92, poleY + 1, 3, 3, 0, P.haldi, 1);
  };
  // rear bearer (behind), front bearer
  ctx.save();
  ctx.translate(-64, bob * 0.3);
  bearer(ctx, { phase: p + 0.5, cloth: P.limewhite, scarf: P.haldi, jump, hit, poleY: poleY - bob * 0.3 });
  ctx.restore();
  pole();
  ctx.save();
  ctx.translate(0, bob);
  // brackets
  for (const x of [-26, 26]) taperStroke(ctx, [{ x, y: -100 }, { x, y: -86 }], 3, P.haldi, 1, [1, 1]);
  // box
  const box = () => polyPath(ctx, [{ x: -36, y: -96 }, { x: 36, y: -96 }, { x: 34, y: -30 }, { x: -34, y: -30 }]);
  paintedShape(ctx, rng, box, { x: -36, y: -96, w: 72, h: 66 }, { base: wood, light: mix(wood, P.marigold, 0.35), shade: mix(wood, P.ink, 0.4), rim: mix(wood, P.ink, 0.6), rimW: 1.3, dabs: 20 });
  // window with the dark inside
  const win = () => {
    ctx.beginPath();
    ctx.moveTo(-24, -40);
    ctx.lineTo(-24, -82);
    ctx.quadraticCurveTo(1, -101, 26, -82);
    ctx.lineTo(26, -40);
    ctx.closePath();
  };
  win();
  ctx.fillStyle = mix(P.laterite, P.ink, 0.62);
  ctx.fill();
  clipTo(ctx, win, () => {
    glow(ctx, 6, -60, 30, P.marigold, 0.2);
    ctx.save();
    ctx.translate(2, -45);
    ctx.scale(0.7, 0.7);
    girl(ctx, rng, {
      lower: 'seat', face: jump ? 'happy' : hit ? 'hit' : 'calm', lean: hit ? -0.14 : 0.02, tilt: st.k === 'cycle' ? Math.sin(p * TAU) * 0.03 : 0,
      near: jump ? CHEER : { x: 20, y: 8 }, far: { x: 16, y: 6 }, nearBend: jump ? -1 : 1, openHand: jump,
    });
    ctx.restore();
  });
  // curtains tied back: Pipili appliqué panels
  for (const [x0, x1, s] of [[-24, -18, 1], [26, 21, -1]] as const) {
    const cur = () => {
      ctx.beginPath();
      ctx.moveTo(x0, -82 + (s > 0 ? 0 : 1));
      ctx.quadraticCurveTo(x1 + s * 2, -70, x1, -58);
      ctx.quadraticCurveTo(x1 - s * 1, -50, x0, -42);
      ctx.closePath();
    };
    cur();
    ctx.fillStyle = T.border;
    ctx.fill();
    dab(ctx, (x0 + x1) / 2, -66, 2.2, 2.2, 0, P.haldi, 1);
    dab(ctx, (x0 + x1) / 2, -66, 0.9, 0.9, 0, P.limewhite, 1);
    dab(ctx, (x0 + x1) / 2 + s * 0.5, -52, 1.6, 1.6, 0, P.tota, 1);
    taperStroke(ctx, [{ x: x1 - s, y: -60 }, { x: x1 + s * 2, y: -57 }], 2, P.haldi, 1, [1, 1]);
  }
  // sill, haldi trim, little painted lotuses
  ctx.fillStyle = P.haldi;
  ctx.fillRect(-36, -40, 72, 2.4);
  ctx.fillRect(-36, -96, 72, 2);
  for (const x of [-30, 30]) for (let i = 0; i < 4; i++) dab(ctx, x, -86 + i * 13, 1.6, 1.6, 0, P.haldi, 0.9);
  for (let i = 0; i < 6; i++) dab(ctx, -25 + i * 10, -34.5, 2.6, 1.6, 0, i % 2 ? T.border : P.limewhite, 1);
  // domed roof with scallops and a finial
  const roof = () => {
    ctx.beginPath();
    ctx.moveTo(-42, -94);
    ctx.quadraticCurveTo(-38, -114, 0, -118);
    ctx.quadraticCurveTo(38, -114, 42, -94);
    ctx.closePath();
  };
  paintedShape(ctx, rng, roof, { x: -42, y: -118, w: 84, h: 24 }, { base: T.border, light: mix(T.border, P.haldi, 0.45), shade: mix(T.border, P.ink, 0.3), rim: mix(T.border, P.ink, 0.5), rimW: 1, dabs: 10 });
  for (let i = 0; i < 9; i++) dab(ctx, -38 + i * 9.5, -94, 4.4, 2.6, 0, P.haldi, 1);
  taperStroke(ctx, [{ x: 0, y: -118 }, { x: 0, y: -126 }], 2, P.haldi, 1, [1, 0.6]);
  dab(ctx, 0, -126, 2.6, 2.6, 0, P.haldi, 1);
  ctx.restore();
  ctx.save();
  ctx.translate(64, bob * 0.3);
  bearer(ctx, { phase: p, cloth: P.limewhite, scarf: T.border, jump, hit, poleY: poleY - bob * 0.3 });
  ctx.restore();
}

// =============================================================================
// pressCart: a handcart with a little printing press, Taapoi pushing
// =============================================================================
function paintPressCart(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const ang = st.k === 'cycle' ? (p * TAU) / 6 : 0.3;
  softShadow(ctx, 0, 0, 70, 5, P.ink, 0.2);
  ctx.save();
  ctx.translate(-10, 0);
  const iron = mix(P.khondalite, P.ink, 0.55);
  const ironL = mix(P.khondalite, P.limewhite, 0.2);
  // Taapoi pushing (behind the handles)
  const bob = st.k === 'cycle' ? -Math.abs(Math.cos(p * TAU)) * 2 : 0;
  ctx.save();
  ctx.translate(-30, -RUN_GROUND + bob);
  const legs = st.k === 'cycle' ? runLegs(p) : jump ? { fN: { x: 10, y: 28 }, fF: { x: -10, y: 32 } } : { fN: { x: 8, y: RUN_GROUND }, fF: { x: -10, y: RUN_GROUND - 2 } };
  const grip = { x: 30, y: -6 - bob };
  girl(ctx, rng, {
    lower: 'stand', lean: hit ? -0.1 : 0.24, footN: legs.fN, footF: legs.fF, hem: -2 - (st.k === 'cycle' ? Math.sin(p * TAU * 2) * 1.4 : 2),
    face: jump ? 'happy' : hit ? 'hit' : 'calm', near: grip, far: { x: grip.x - 2, y: grip.y - 2 }, nearBend: 1, farBend: 1, parts: 'body',
  });
  ctx.restore();
  // cart
  const bedY = -30;
  taperStroke(ctx, [{ x: -2, y: -44 }, { x: 10, y: -36 }, { x: 18, y: bedY - 2 }], 3, woodD, 1, [1, 1]); // handle
  dab(ctx, -3, -44.5, 3.4, 2.4, -0.5, mix(woodD, P.ink, 0.3), 1);
  cartWheel(ctx, 54, -13, 13, ang + 0.4, true);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 14, y: bedY - 4 }, { x: 86, y: bedY - 4 }, { x: 84, y: bedY + 4 }, { x: 16, y: bedY + 4 }]), { x: 14, y: bedY - 4, w: 72, h: 8 }, { base: woodC, light: woodL, shade: woodD, rim: woodO, rimW: 1, dabs: 8 });
  // press: two uprights, a head, the screw and its bar
  for (const x of [32, 58]) {
    taperStroke(ctx, [{ x, y: bedY - 4 }, { x, y: -82 }], 4.2, iron, 1, [1, 1]);
    taperStroke(ctx, [{ x: x - 0.8, y: bedY - 6 }, { x: x - 0.8, y: -80 }], 1, ironL, 0.6, [1, 1]);
  }
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: 28, y: -88 }, { x: 62, y: -88 }, { x: 62, y: -79 }, { x: 28, y: -79 }]), { x: 28, y: -88, w: 34, h: 9 }, { base: iron, light: ironL, shade: P.ink, dabs: 6 });
  dab(ctx, 45, -84, 3, 2.2, 0, P.haldi, 0.9); // a little brass boss
  const turn = st.k === 'cycle' ? Math.sin(p * TAU) : 0;
  taperStroke(ctx, [{ x: 45, y: -79 }, { x: 45, y: -60 }], 3.4, ironL, 1, [1, 1]);
  for (let i = 0; i < 5; i++) taperStroke(ctx, [{ x: 43.4, y: -77 + i * 3.6 }, { x: 46.6, y: -75.6 + i * 3.6 }], 0.8, iron, 0.9);
  taperStroke(ctx, [{ x: 45 - 12 * Math.cos(turn * 0.6), y: -68 }, { x: 45 + 14 * Math.cos(turn * 0.6), y: -66 }], 2.2, iron, 1, [1, 1]);
  dab(ctx, 45 + 14 * Math.cos(turn * 0.6), -66, 2.4, 2.4, 0, T.border, 1);
  ctx.fillStyle = iron;
  ctx.fillRect(34, -60, 22, 4); // platen
  ctx.fillStyle = mix(P.khondalite, P.laterite, 0.3);
  ctx.fillRect(30, bedY - 10, 30, 6); // bed of type
  ctx.fillStyle = P.limewhite;
  ctx.fillRect(33, bedY - 12, 24, 2);
  // stack of printed sheets, tied with string
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? mix(P.limewhite, P.skyCream, 0.5) : P.limewhite;
    ctx.fillRect(64 + (i % 2), bedY - 6 - i * 2.4, 20, 2.4);
  }
  ctx.strokeStyle = T.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(73, bedY - 20.5, 0.1, 15);
  for (let i = 0; i < 4; i++) taperStroke(ctx, [{ x: 66, y: bedY - 19.5 + i * 0.1 }, { x: 82, y: bedY - 19.5 }], 0.6, mix(P.laterite, P.ink, 0.4), 0.6);
  // ink pot and roller
  dab(ctx, 22, bedY - 7, 4, 3.4, 0, mix(P.neel, P.ink, 0.4), 1);
  dab(ctx, 22, bedY - 10, 2.2, 1, 0, P.ink, 1);
  // a sheet fluttering off the stack in the wind
  if (st.k !== 'hit') {
    const f = st.k === 'cycle' ? p : 0.3;
    const sx = 70 - f * 30, sy = bedY - 26 - Math.sin(f * Math.PI) * 18;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-0.4 + f * 1.4);
    ctx.fillStyle = P.limewhite;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.quadraticCurveTo(0, -6 + Math.sin(f * TAU * 2) * 2, 6, -4);
    ctx.lineTo(6, 4);
    ctx.quadraticCurveTo(0, 2, -6, 4);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 3; i++) taperStroke(ctx, [{ x: -4, y: -2 + i * 2.2 }, { x: 4, y: -2 + i * 2.2 }], 0.6, mix(P.laterite, P.ink, 0.4), 0.6);
    ctx.restore();
  }
  cartWheel(ctx, 50, -13, 13, ang);
  // her arms over the handles
  ctx.save();
  ctx.translate(-30, -RUN_GROUND + bob);
  girl(ctx, rng, { lower: 'stand', lean: hit ? -0.1 : 0.24, near: grip, far: { x: grip.x - 2, y: grip.y - 2 }, nearBend: 1, farBend: 1, parts: 'arm' });
  ctx.restore();
  ctx.restore();
}

// =============================================================================
// bicycle: an old roadster
// =============================================================================
function paintBicycle(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  softShadow(ctx, 0, 0, 56, 4, P.ink, 0.22);
  const frame = mix(P.ink, P.neel, 0.12);
  const frameL = mix(P.neel, P.limewhite, 0.35);
  const rw = { x: -30, y: -19 }, fw = { x: 32, y: -19 }, bb = { x: 0, y: -15 };
  const seat = { x: -11, y: -40 }, head = { x: 21, y: -42 };
  const ang = st.k === 'cycle' ? (p * TAU) / 6 : 0.4;
  const wheelO: WheelO = { tyre: P.ink, tyreW: 2.6, rim: mix(P.khondalite, P.limewhite, 0.35), rimW: 1.4, spoke: withAlpha(mix(P.khondalite, P.limewhite, 0.4), 0.8), spokeW: 0.6, spokes: 18, hub: mix(P.khondalite, P.limewhite, 0.3) };
  const crank = st.k === 'cycle' ? p * TAU : jump ? 0 : 0.6;
  const pedal = (a: number): Pt => ({ x: bb.x + Math.cos(a) * 8, y: bb.y + Math.sin(a) * 8 });
  const G = { x: -14, y: -50 };
  const toG = (q: Pt): Pt => ({ x: q.x - G.x, y: q.y - G.y });
  const pN = pedal(crank), pF = pedal(crank + Math.PI);
  // far crank + pedal
  taperStroke(ctx, [bb, pF], 2.2, frame, 1, [1, 1]);
  dab(ctx, pF.x, pF.y, 3, 1.2, 0, frame, 1);
  // girl body (far leg is on the far pedal)
  const grips = { x: head.x - 4, y: head.y - 9 };
  const gO: GirlO = {
    lower: 'astride', footN: toG(pN), footF: toG(pF), kneeN: -1, kneeF: -1, lean: hit ? -0.12 : 0.14,
    face: jump ? 'happy' : hit ? 'hit' : 'calm', near: jump ? CHEER : toG(grips), far: toG({ x: grips.x - 1, y: grips.y + 1 }),
    nearBend: jump ? -1 : 1, farBend: 1, openHand: jump, hem: -2,
  };
  wheel(ctx, rw.x, rw.y, 19, ang, wheelO);
  wheel(ctx, fw.x, fw.y, 19, ang, wheelO);
  // frame: double top tube (a roadster), rod brakes, chain guard
  const tube = (a: Pt, b: Pt, w = 2.6) => { taperStroke(ctx, [a, b], w, frame, 1, [1, 1]); taperStroke(ctx, [a, b], 0.7, frameL, 0.5, [1, 1]); };
  tube(rw, seat); tube(rw, bb); tube(seat, bb, 3); tube({ x: seat.x + 1, y: seat.y + 2 }, head, 2.4); tube({ x: seat.x + 2, y: seat.y + 7 }, { x: head.x, y: head.y + 5 }, 2.2); tube(bb, { x: head.x, y: head.y + 6 }, 3);
  tube(head, fw, 2.6);
  taperStroke(ctx, [{ x: head.x, y: head.y }, { x: head.x - 1, y: head.y - 9 }], 2.6, frame, 1, [1, 1]);
  taperStroke(ctx, [{ x: head.x - 1, y: head.y - 9 }, { x: head.x + 4, y: head.y - 11 }, { x: grips.x, y: grips.y }], 2, frame, 1, [1, 1]);
  dab(ctx, grips.x, grips.y, 2.8, 1.8, 0, mix(P.laterite, P.ink, 0.4), 1);
  // chain guard
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.ellipse(-14, -16, 18, 4.4, -0.06, 0, TAU);
  ctx.fill();
  taperStroke(ctx, [{ x: -30, y: -15 }, { x: -14, y: -19 }, { x: 2, y: -17.5 }], 0.8, P.haldi, 0.9, [0.3, 0.3]);
  // mudguards
  ctx.strokeStyle = frame;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(rw.x, rw.y, 21, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(fw.x, fw.y, 21, Math.PI * 1.25, Math.PI * 1.95); ctx.stroke();
  // rear carrier with a cloth bundle, front lamp
  taperStroke(ctx, [{ x: seat.x - 2, y: seat.y + 3 }, { x: rw.x - 8, y: rw.y - 20 }], 1.6, frame, 1, [1, 1]);
  dab(ctx, head.x + 4, head.y - 1, 2.8, 2.6, 0, mix(P.khondalite, P.limewhite, 0.4), 1);
  dab(ctx, head.x + 6, head.y - 1, 1.2, 1.8, 0, P.haldi, 1);
  // saddle + bell
  dab(ctx, seat.x - 1, seat.y - 2, 7, 2.6, -0.08, mix(P.laterite, P.ink, 0.5), 1);
  dab(ctx, grips.x + 6, grips.y + 1, 1.8, 1.4, 0, mix(P.khondalite, P.limewhite, 0.5), 1);
  ctx.save();
  ctx.translate(G.x, G.y);
  girl(ctx, rng, gO);
  ctx.restore();
  // near crank + pedal over the foot
  taperStroke(ctx, [bb, pN], 2.6, frame, 1, [1, 1]);
  dab(ctx, bb.x, bb.y, 3.6, 3.6, 0, frame, 1);
  dab(ctx, bb.x, bb.y, 1.4, 1.4, 0, P.haldi, 1);
  dab(ctx, pN.x, pN.y + 1.6, 3.4, 1.2, 0, mix(P.khondalite, P.ink, 0.3), 1);
}

// =============================================================================
// scooter: a little electric kick-scooter, Taapoi standing
// =============================================================================
function paintScooter(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  softShadow(ctx, 0, 0, 40, 4, P.ink, 0.22);
  const body = P.peacock, bodyL = mix(P.peacock, P.limewhite, 0.45), bodyD = mix(P.peacock, P.ink, 0.4);
  const ang = st.k === 'cycle' ? (p * TAU) / 5 : 0.3;
  const dip = st.k === 'cycle' ? Math.sin(p * TAU * 2) * 1.2 : 0;
  const wO: WheelO = { tyre: P.ink, tyreW: 3, rim: mix(P.khondalite, P.limewhite, 0.3), rimW: 1.4, spoke: bodyD, spokeW: 1.4, spokes: 5, hub: P.rani };
  wheel(ctx, -28, -9, 9, ang, wO);
  // deck
  const deck = () => polyPath(ctx, [{ x: -32, y: -14 }, { x: 22, y: -14 }, { x: 26, y: -9 }, { x: 20, y: -6 }, { x: -30, y: -6 }]);
  paintedShape(ctx, rng, deck, { x: -32, y: -14, w: 58, h: 8 }, { base: body, light: bodyL, shade: bodyD, rim: bodyD, rimW: 1, dabs: 6 });
  ctx.fillStyle = P.haldi;
  ctx.fillRect(-26, -9, 40, 1.4);
  dab(ctx, -33, -12, 2, 1.6, 0, T.border, 1); // tail light
  // Taapoi standing: front foot forward, back foot behind
  const G = { x: -6, y: -50 + dip };
  const H = { x: 22, y: -56 };
  ctx.save();
  ctx.translate(G.x, G.y);
  girl(ctx, rng, {
    lower: 'stand', lean: hit ? -0.12 : 0.08, footN: { x: 8, y: 36 - dip }, footF: { x: -12, y: 36 - dip }, kneeN: -1, kneeF: -1,
    hem: st.k === 'cycle' ? -4 - Math.sin(p * TAU * 2) * 1.5 : -5, face: jump ? 'happy' : hit ? 'hit' : 'calm',
    near: jump ? CHEER : { x: H.x - G.x - 2, y: H.y - G.y + 1 }, far: { x: H.x - G.x - 4, y: H.y - G.y }, nearBend: jump ? -1 : 1, farBend: 1, openHand: jump,
    between: () => {
      // stem and handlebar
      const s0 = { x: 26 - G.x, y: -10 - G.y }, s1 = { x: H.x - G.x, y: H.y - G.y };
      taperStroke(ctx, [s0, s1], 4, body, 1, [1, 1]);
      taperStroke(ctx, [{ x: s0.x - 1, y: s0.y }, { x: s1.x - 1, y: s1.y }], 1, bodyL, 0.7, [1, 1]);
      taperStroke(ctx, [{ x: s1.x - 5, y: s1.y }, { x: s1.x + 3, y: s1.y - 1 }], 2.4, mix(P.khondalite, P.ink, 0.5), 1, [1, 1]);
      dab(ctx, s1.x - 4, s1.y + 0.4, 2.4, 1.8, 0, P.rani, 1);
      dab(ctx, s0.x + 1, s0.y - 20, 3, 2.4, 0, mix(P.khondalite, P.ink, 0.3), 1); // headlamp
      dab(ctx, s0.x + 2.6, s0.y - 20, 1.4, 1.8, 0, P.haldi, 1);
      dab(ctx, s0.x - 0.5, s0.y - 33, 2.6, 4, 0, bodyD, 1); // battery
      dab(ctx, s0.x - 0.5, s0.y - 34, 0.8, 0.8, 0, P.tota, 1);
    },
  });
  ctx.restore();
  wheel(ctx, 27, -9, 9, ang, wO);
  taperStroke(ctx, [{ x: 26, y: -10 }, { x: 27, y: -9 }], 3, body, 1, [1, 1]);
}

// =============================================================================
// Windowed vehicles: bus, train, dakota, maglev
// =============================================================================
interface Rect { x: number; y: number; w: number; h: number; r?: number }
function rrect(ctx: Ctx, R: Rect): void {
  const r = Math.min(R.r ?? 3, R.w / 2, R.h / 2);
  ctx.moveTo(R.x + r, R.y);
  ctx.arcTo(R.x + R.w, R.y, R.x + R.w, R.y + R.h, r);
  ctx.arcTo(R.x + R.w, R.y + R.h, R.x, R.y + R.h, r);
  ctx.arcTo(R.x, R.y + R.h, R.x, R.y, r);
  ctx.arcTo(R.x, R.y, R.x + R.w, R.y, r);
  ctx.closePath();
}

/** Fill a body outline with window holes (evenodd) and shade it. */
function panelWithHoles(ctx: Ctx, rng: Rng, outline: () => void, holes: Rect[], b: Rect, base: string, light: string, shade: string): void {
  const path = () => {
    ctx.beginPath();
    outline();
    for (const h of holes) rrect(ctx, h);
  };
  path();
  ctx.fillStyle = base;
  ctx.fill('evenodd');
  ctx.save();
  path();
  ctx.clip('evenodd');
  const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  g.addColorStop(0, withAlpha(light, 0.5));
  g.addColorStop(0.4, withAlpha(light, 0));
  g.addColorStop(0.7, withAlpha(shade, 0));
  g.addColorStop(1, withAlpha(shade, 0.5));
  ctx.fillStyle = g;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  dabField(ctx, rng, b.x, b.y, b.w, b.h, { n: Math.round((b.w * b.h) / 140), r: [1.5, 4], colours: [light, base, shade], alpha: [0.06, 0.16] });
  ctx.restore();
  ctx.strokeStyle = mix(shade, P.ink, 0.4);
  ctx.lineWidth = 1.1;
  path();
  ctx.stroke();
}

function glassSheen(ctx: Ctx, R: Rect): void {
  ctx.save();
  ctx.beginPath();
  rrect(ctx, R);
  ctx.clip();
  ctx.fillStyle = withAlpha(P.seafoam, 0.16);
  ctx.fillRect(R.x, R.y, R.w, R.h);
  taperStroke(ctx, [{ x: R.x + R.w * 0.55, y: R.y - 2 }, { x: R.x + R.w * 0.2, y: R.y + R.h + 2 }], 3, P.limewhite, 0.35);
  ctx.restore();
}

/** A generic passenger's head and shoulders in a window (warm browns). */
function passenger(ctx: Ctx, x: number, y: number, k: number, cloth: string, head: 'hair' | 'veil' | 'cap'): void {
  const skin = mix(P.chandan, P.laterite, 0.15 + k * 0.4);
  dab(ctx, x, y + 9, 8, 6, 0, cloth, 1);
  dab(ctx, x, y, 5.2, 5.8, 0, skin, 1);
  if (head === 'veil') dab(ctx, x - 1.5, y - 1.5, 5.6, 6, 0, cloth, 1);
  else if (head === 'cap') dab(ctx, x, y - 4.6, 5, 2.4, 0, P.limewhite, 1);
  else dab(ctx, x - 1.4, y - 3, 5, 3.4, 0.2, P.ink, 1);
  if (head === 'veil') dab(ctx, x + 1.5, y + 0.5, 3.6, 4.6, 0, skin, 1);
  dab(ctx, x + 3, y - 0.5, 0.7, 0.8, 0, P.ink, 1);
}

// ---- bus ---------------------------------------------------------------------
function paintBus(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const ang = st.k === 'cycle' ? (p * TAU) / 6 : 0.2;
  const sway = st.k === 'cycle' ? Math.sin(p * TAU * 2) * 0.7 : 0;
  softShadow(ctx, 0, 0, 96, 5, P.ink, 0.24);
  const tyreO: WheelO = { tyre: P.ink, tyreW: 4, rim: mix(P.khondalite, P.limewhite, 0.3), rimW: 2.4, spoke: mix(P.khondalite, P.ink, 0.3), spokeW: 1.6, spokes: 6, hub: T.border };
  // far wheels peek
  ctx.save();
  ctx.translate(0, sway);
  const X0 = -96, X1 = 94, TOP = -94, BOT = -14;
  const wins: Rect[] = [];
  for (let i = 0; i < 6; i++) wins.push({ x: -88 + i * 24, y: -82, w: 19, h: 25, r: 3 });
  const front: Rect = { x: 62, y: -86, w: 24, h: 36, r: 4 };
  // interiors
  ctx.fillStyle = mix(P.neel, P.ink, 0.45);
  for (const w of [...wins, front]) { ctx.beginPath(); rrect(ctx, w); ctx.fill(); }
  const folks: [number, string, 'hair' | 'veil' | 'cap'][] = [[0.2, P.tota, 'veil'], [0.6, P.limewhite, 'cap'], [0.4, P.marigold, 'hair'], [0.7, P.rani, 'veil'], [0.3, P.peacock, 'hair']];
  folks.forEach(([k, c, h], i) => {
    if (i === 2) return; // an empty seat
    ctx.save();
    ctx.beginPath();
    rrect(ctx, wins[i]);
    ctx.clip();
    passenger(ctx, wins[i].x + 10, wins[i].y + 13 + (i % 2) * 2 + (st.k === 'cycle' ? Math.sin(p * TAU * 2 + i) * 0.6 : 0), k, c, h);
    ctx.restore();
  });
  // Taapoi at the front window
  const G = { x: 72, y: -42 };
  const wave = st.k === 'cycle' ? Math.sin(p * TAU * 2) : 0;
  const gO: GirlO = {
    lower: 'seat', face: hit ? 'hit' : jump ? 'happy' : 'happy', lean: hit ? -0.12 : 0.06,
    near: hit ? { x: 18, y: -8 } : { x: 25 + wave * 3, y: -30 - Math.abs(wave) * 2 }, far: { x: 14, y: 6 }, nearBend: hit ? 1 : -1, openHand: !hit,
  };
  ctx.save();
  ctx.beginPath();
  rrect(ctx, front);
  ctx.clip();
  ctx.translate(G.x, G.y);
  ctx.scale(0.72, 0.72);
  girl(ctx, rng, { ...gO, parts: 'body' });
  ctx.restore();
  // body panels
  const outline = () => {
    ctx.moveTo(X0, BOT);
    ctx.lineTo(X0, TOP + 6);
    ctx.quadraticCurveTo(X0, TOP, X0 + 6, TOP);
    ctx.lineTo(X1 - 10, TOP);
    ctx.quadraticCurveTo(X1 - 2, TOP + 1, X1, TOP + 12);
    ctx.lineTo(X1 + 2, BOT);
    ctx.closePath();
  };
  const bodyC = mix(P.limewhite, P.skyCream, 0.35);
  panelWithHoles(ctx, rng, outline, [...wins, front], { x: X0, y: TOP, w: X1 - X0 + 2, h: BOT - TOP }, bodyC, P.limewhite, mix(bodyC, P.khondalite, 0.5));
  // lower half peacock, hand-painted rani wave with haldi dots
  ctx.save();
  ctx.beginPath();
  outline();
  ctx.clip();
  ctx.fillStyle = P.peacock;
  ctx.fillRect(X0, -46, X1 - X0 + 4, 34);
  ctx.fillStyle = withAlpha(mix(P.peacock, P.ink, 0.4), 0.5);
  ctx.fillRect(X0, -22, X1 - X0 + 4, 10);
  ctx.strokeStyle = P.rani;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = X0; x <= X1 + 2; x += 2) {
    const y = -50 + Math.sin((x / 22) * Math.PI) * 2.4;
    if (x === X0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let x = X0 + 6; x < X1; x += 11) dab(ctx, x, -50 + Math.sin((x / 22) * Math.PI) * 2.4, 1.2, 1.2, 0, P.haldi, 1);
  ctx.fillStyle = P.rani;
  ctx.fillRect(X0, TOP + 2, X1 - X0 + 2, 3);
  for (let x = X0 + 8; x < X1 - 6; x += 16) {
    ctx.fillStyle = P.haldi;
    ctx.beginPath();
    ctx.moveTo(x - 3, -40); ctx.lineTo(x, -36); ctx.lineTo(x + 3, -40); ctx.lineTo(x, -44);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  for (const w of [...wins, front]) glassSheen(ctx, w);
  // door seam, headlamp, bumper
  ctx.strokeStyle = withAlpha(mix(P.peacock, P.ink, 0.5), 0.8);
  ctx.lineWidth = 1;
  ctx.strokeRect(44, -82, 14, 66);
  dab(ctx, X1 - 1, -28, 3, 3.4, 0, P.haldi, 1);
  dab(ctx, X1, -28, 1.4, 1.8, 0, P.limewhite, 1);
  ctx.fillStyle = mix(P.khondalite, P.ink, 0.4);
  ctx.fillRect(X1 - 6, -16, 10, 3);
  // roof rack with bundles
  taperStroke(ctx, [{ x: -80, y: TOP - 2 }, { x: 40, y: TOP - 2 }], 1.6, mix(P.khondalite, P.ink, 0.4), 1, [1, 1]);
  const bundles: [number, number, number, string][] = [[-70, 9, 6, P.haldi], [-52, 11, 7, P.limewhite], [-34, 8, 5, T.border], [-18, 10, 6, P.tota]];
  for (const [x, w, h, c] of bundles) {
    dab(ctx, x, TOP - 2 - h, w, h, 0, c, 1);
    taperStroke(ctx, [{ x, y: TOP - 2 - h * 2 }, { x, y: TOP - 2 }], 1, mix(P.laterite, P.ink, 0.4), 0.7);
  }
  // wheel arches + wheels
  for (const wx of [-60, 58]) {
    ctx.fillStyle = mix(P.ink, P.neel, 0.2);
    ctx.beginPath();
    ctx.arc(wx, -13, 16, Math.PI, TAU);
    ctx.fill();
  }
  ctx.restore();
  wheel(ctx, -60, -13, 13, ang, tyreO);
  wheel(ctx, 58, -13, 13, ang, tyreO);
  // her waving arm, out of the window
  ctx.save();
  ctx.translate(G.x, G.y + sway);
  ctx.scale(0.72, 0.72);
  girl(ctx, rng, { ...gO, parts: 'arm' });
  ctx.restore();
}

// ---- train: a small steam loco, Taapoi at the cab window ---------------------
function paintTrain(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const a = st.k === 'cycle' ? p * TAU : 0.5;
  softShadow(ctx, 0, 0, 90, 5, P.ink, 0.24);
  const loco = mix(P.neel, P.ink, 0.45), locoL = mix(P.neel, P.limewhite, 0.25), locoD = mix(P.ink, P.neel, 0.1);
  // smoke puffs drifting back
  if (!hit) for (let i = 0; i < 4; i++) {
    const t = (i + (st.k === 'cycle' ? p : 0.4)) / 4;
    dab(ctx, 52 - t * 70, -102 - t * 16 + Math.sin(i * 2) * 2, 5 + t * 9, 4 + t * 6, 0, mix(P.limewhite, P.khondalite, 0.2 + t * 0.2), 0.75 - t * 0.5);
  }
  // rails/sleepers hint under the wheels is drawn by the scene; keep a soft shadow
  // cab with a big side window
  const win: Rect = { x: -66, y: -86, w: 26, h: 32, r: 5 };
  const G = { x: -52, y: -40 };
  const gO: GirlO = {
    lower: 'seat', face: hit ? 'hit' : 'happy', lean: hit ? -0.12 : 0.1,
    near: hit ? { x: 16, y: -6 } : jump ? CHEER : { x: 22, y: 8 }, far: { x: 18, y: 4 }, nearBend: jump ? -1 : 1, openHand: jump,
  };
  ctx.fillStyle = mix(P.laterite, P.ink, 0.65);
  ctx.beginPath();
  rrect(ctx, win);
  ctx.fill();
  glow(ctx, -52, -62, 18, P.marigold, 0.35); // firebox glow inside the cab
  ctx.save();
  ctx.beginPath();
  rrect(ctx, win);
  ctx.clip();
  ctx.translate(G.x, G.y);
  ctx.scale(0.72, 0.72);
  girl(ctx, rng, { ...gO, parts: 'body' });
  ctx.restore();
  const cab = () => {
    ctx.moveTo(-76, -28);
    ctx.lineTo(-76, -92);
    ctx.lineTo(-28, -92);
    ctx.lineTo(-28, -28);
    ctx.closePath();
  };
  panelWithHoles(ctx, rng, cab, [win], { x: -76, y: -92, w: 48, h: 64 }, loco, locoL, locoD);
  // cab roof
  ctx.fillStyle = locoD;
  ctx.beginPath();
  ctx.moveTo(-80, -90);
  ctx.quadraticCurveTo(-52, -100, -24, -90);
  ctx.lineTo(-24, -88);
  ctx.lineTo(-80, -88);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.haldi;
  ctx.lineWidth = 1;
  ctx.strokeRect(-73, -88, 42, 56);
  glassSheen(ctx, win);
  // boiler
  const boiler = () => { ctx.beginPath(); rrect(ctx, { x: -30, y: -70, w: 92, h: 38, r: 12 }); };
  paintedShape(ctx, rng, boiler, { x: -30, y: -70, w: 92, h: 38 }, { base: loco, light: locoL, shade: locoD, rim: P.ink, rimW: 1, dabs: 20 });
  for (const x of [-6, 22, 46]) taperStroke(ctx, [{ x, y: -70 }, { x, y: -32 }], 1.6, P.haldi, 0.9, [1, 1]); // brass bands
  // smokebox front, chimney, domes, lamp
  dab(ctx, 62, -51, 8, 19, 0, locoD, 1);
  dab(ctx, 66, -51, 3, 6, 0, mix(P.khondalite, P.ink, 0.4), 1);
  ctx.fillStyle = locoD;
  ctx.beginPath();
  ctx.moveTo(48, -70); ctx.lineTo(46, -94); ctx.lineTo(60, -94); ctx.lineTo(57, -70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mix(P.haldi, P.laterite, 0.25);
  ctx.fillRect(45, -97, 16, 4);
  dab(ctx, 26, -72, 7, 6, 0, P.haldi, 1); // steam dome (brass)
  dab(ctx, 24, -74, 3, 2, 0, P.limewhite, 0.5);
  dab(ctx, 2, -72, 6, 5, 0, loco, 1);
  dab(ctx, 66, -74, 4, 4, 0, mix(P.khondalite, P.ink, 0.3), 1);
  dab(ctx, 69, -74, 2, 2.6, 0, P.haldi, 1);
  glow(ctx, 71, -74, 9, P.haldi, 0.4);
  // running board + sindoor buffer beam + cowcatcher
  ctx.fillStyle = locoD;
  ctx.fillRect(-78, -32, 156, 5);
  ctx.fillStyle = P.haldi;
  ctx.fillRect(-78, -32, 156, 1.2);
  ctx.fillStyle = T.border;
  ctx.fillRect(70, -36, 8, 12);
  ctx.fillStyle = mix(P.khondalite, P.ink, 0.4);
  ctx.beginPath();
  ctx.moveTo(70, -22); ctx.lineTo(84, -3); ctx.lineTo(66, -3);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 3; i++) taperStroke(ctx, [{ x: 70 + i * 4, y: -20 + i * 5 }, { x: 68 + i * 2, y: -4 }], 0.8, P.khondalite, 0.8);
  // wheels with sindoor rims + coupling rod
  const wO: WheelO = { tyre: mix(P.khondalite, P.limewhite, 0.2), tyreW: 2, rim: T.border, rimW: 2.6, spoke: T.border, spokeW: 1.6, spokes: 10, hub: P.haldi };
  const drivers = [-50, -24, 2];
  for (const x of drivers) wheel(ctx, x, -12, 12, a, wO);
  wheel(ctx, 40, -8, 8, a * 1.5, { ...wO, spokes: 6 });
  const crank = (x: number): Pt => ({ x: x + Math.cos(a) * 6, y: -12 + Math.sin(a) * 6 });
  taperStroke(ctx, [crank(drivers[0]), crank(drivers[2])], 2.6, mix(P.khondalite, P.limewhite, 0.35), 1, [1, 1]);
  for (const x of drivers) dab(ctx, crank(x).x, crank(x).y, 1.8, 1.8, 0, P.haldi, 1);
  // piston rod to the cylinder
  ctx.fillStyle = locoD;
  ctx.fillRect(16, -26, 22, 12);
  taperStroke(ctx, [crank(drivers[2]), { x: 18, y: -20 }], 2, mix(P.khondalite, P.limewhite, 0.35), 1, [1, 1]);
  // steam wisps at the cylinder
  if (st.k === 'cycle') dab(ctx, 40 - p * 6, -10, 6 + p * 4, 2.4, 0, P.limewhite, 0.5 - p * 0.3);
  // Taapoi's arm, over the window sill
  ctx.save();
  ctx.translate(G.x, G.y);
  ctx.scale(0.72, 0.72);
  girl(ctx, rng, { ...gO, parts: 'arm' });
  ctx.restore();
}

// ---- dakota: a generic 1940s twin-engine propeller plane (no markings) ------
function propeller(ctx: Ctx, x: number, y: number, r: number, a: number): void {
  ctx.fillStyle = withAlpha(P.limewhite, 0.22);
  ctx.beginPath();
  ctx.ellipse(x, y, 2.6, r, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const s = Math.sin(a + (i * TAU) / 3);
    const c = Math.cos(a + (i * TAU) / 3);
    const by = y + s * r * 0.5;
    dab(ctx, x + c * 0.8, by, 1.6, Math.abs(s) * r * 0.48 + 1.2, 0, mix(P.khondalite, P.ink, 0.5), 0.85);
  }
  dab(ctx, x + 1.5, y, 3.2, 3.6, 0, mix(P.khondalite, P.limewhite, 0.35), 1);
}

function paintDakota(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const a = st.k === 'cycle' ? (p * TAU) / 3 + st.i * 0.9 : 0.4;
  const metal = mix(P.limewhite, P.khondalite, 0.32);
  const metalL = P.limewhite;
  const metalD = mix(P.khondalite, P.neel, 0.3);
  ctx.save();
  ctx.rotate(jump ? -0.12 : hit ? 0.1 : 0);
  // far engine above the fuselage line
  dab(ctx, 26, -10, 14, 5, 0, metalD, 1);
  propeller(ctx, 42, -10, 9, a + 1);
  // tail fin + stabiliser
  const fin = () => polyPath(ctx, [{ x: -94, y: -4 }, { x: -86, y: -40 }, { x: -76, y: -42 }, { x: -64, y: -8 }]);
  paintedShape(ctx, rng, fin, { x: -94, y: -42, w: 30, h: 38 }, { base: metal, light: metalL, shade: metalD, rim: mix(metalD, P.ink, 0.3), rimW: 1, dabs: 8, lightFrom: 'left' });
  // fuselage with the cockpit hump
  const fus = () => {
    ctx.beginPath();
    ctx.moveTo(-96, -2);
    ctx.quadraticCurveTo(-60, -14, -10, -14);
    ctx.lineTo(44, -14);
    ctx.quadraticCurveTo(54, -32, 72, -30);
    ctx.quadraticCurveTo(84, -26, 90, -8);
    ctx.quadraticCurveTo(94, 4, 84, 12);
    ctx.quadraticCurveTo(40, 15, -10, 13);
    ctx.quadraticCurveTo(-70, 10, -96, 2);
    ctx.closePath();
  };
  // Taapoi in the cockpit (behind the glazing)
  const G = { x: 63, y: 4 };
  ctx.save();
  ctx.translate(G.x, G.y);
  ctx.scale(0.5, 0.5);
  girl(ctx, rng, {
    lower: 'none', face: hit ? 'hit' : jump ? 'happy' : 'calm', lean: hit ? -0.15 : 0.04,
    near: jump ? CHEER : { x: 24, y: 2 }, far: { x: 20, y: 0 }, nearBend: jump ? -1 : 1, openHand: jump,
  });
  ctx.restore();
  ctx.save();
  fus();
  // cut the canopy glass out of the fuselage fill
  ctx.moveTo(48, -16);
  ctx.quadraticCurveTo(56, -29, 71, -28);
  ctx.quadraticCurveTo(82, -25, 86, -12);
  ctx.lineTo(48, -12);
  ctx.closePath();
  ctx.fillStyle = metal;
  ctx.fill('evenodd');
  ctx.clip('evenodd');
  const g = ctx.createLinearGradient(0, -30, 0, 15);
  g.addColorStop(0, withAlpha(metalL, 0.8));
  g.addColorStop(0.35, withAlpha(metalL, 0.1));
  g.addColorStop(0.75, withAlpha(metalD, 0.3));
  g.addColorStop(1, withAlpha(metalD, 0.8));
  ctx.fillStyle = g;
  ctx.fillRect(-100, -34, 200, 50);
  dabField(ctx, rng, -96, -30, 190, 44, { n: 50, r: [1.5, 4], colours: [metalL, metal, metalD], alpha: [0.05, 0.14] });
  // panel lines and rivets
  ctx.strokeStyle = withAlpha(metalD, 0.6);
  ctx.lineWidth = 0.6;
  for (const x of [-60, -30, 10, 40]) { ctx.beginPath(); ctx.moveTo(x, -16); ctx.lineTo(x, 15); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = mix(metalD, P.ink, 0.4);
  ctx.lineWidth = 1.1;
  fus();
  ctx.stroke();
  // canopy glass + frame
  ctx.fillStyle = withAlpha(P.seafoam, 0.22);
  ctx.beginPath();
  ctx.moveTo(48, -12);
  ctx.quadraticCurveTo(56, -29, 71, -28);
  ctx.quadraticCurveTo(82, -25, 86, -12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = metalD;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  taperStroke(ctx, [{ x: 76, y: -27 }, { x: 80, y: -12 }], 1.6, metalD, 1, [1, 1]);
  taperStroke(ctx, [{ x: 58, y: -25 }, { x: 66, y: -27 }], 2, P.limewhite, 0.6);
  // passenger windows
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = mix(P.neel, P.seafoam, 0.35);
    ctx.beginPath();
    rrect(ctx, { x: -54 + i * 14, y: -9, w: 7, h: 6, r: 2 });
    ctx.fill();
    dab(ctx, -51 + i * 14, -7.5, 1.4, 0.8, 0, P.limewhite, 0.6);
  }
  // near wing (towards us) + engine nacelle + propeller
  const wing = () => polyPath(ctx, [{ x: -16, y: 4 }, { x: 34, y: 2 }, { x: 22, y: 30 }, { x: -2, y: 32 }]);
  paintedShape(ctx, rng, wing, { x: -16, y: 2, w: 50, h: 30 }, { base: mix(metal, P.limewhite, 0.2), light: metalL, shade: metalD, rim: mix(metalD, P.ink, 0.3), rimW: 1, dabs: 10, lightFrom: 'left' });
  const nac = () => { ctx.beginPath(); ctx.ellipse(28, 10, 18, 7, 0.04, 0, TAU); };
  paintedShape(ctx, rng, nac, { x: 10, y: 3, w: 36, h: 14 }, { base: metal, light: metalL, shade: metalD, rim: mix(metalD, P.ink, 0.3), rimW: 1, dabs: 6 });
  dab(ctx, 44, 10, 4, 6, 0, mix(P.khondalite, P.ink, 0.4), 1);
  propeller(ctx, 48, 10, 15, a);
  // tailplane
  dab(ctx, -80, 2, 16, 3, 0.05, metalD, 1);
  if (hit) for (let i = 0; i < 4; i++) dab(ctx, 14 - i * 9, 6 - i * 2, 4 + i * 2, 3 + i * 1.4, 0, mix(P.khondalite, P.limewhite, 0.3), 0.6 - i * 0.1);
  ctx.restore();
}

// ---- maglev: a boita-shaped pod hovering on a neon-cyan glow ----------------
function paintMaglev(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const hover = st.k === 'cycle' ? Math.sin(p * TAU) * 1.2 : 0;
  // soft glow underneath
  const pulse = st.k === 'cycle' ? 0.5 + Math.sin(p * TAU * 2) * 0.12 : 0.45;
  ctx.save();
  ctx.scale(1, 0.22);
  glow(ctx, 0, -10, 84, P.neonCyan, pulse);
  ctx.restore();
  ctx.fillStyle = withAlpha(P.neonCyan, 0.85);
  ctx.fillRect(-70, -2, 140, 1.4);
  ctx.save();
  ctx.translate(0, hover);
  const body = mix(P.limewhite, P.seafoam, 0.12), bodyD = mix(P.neel, P.limewhite, 0.45);
  const G = { x: 0, y: -40 };
  const gO: GirlO = {
    lower: 'seat', face: hit ? 'hit' : jump ? 'happy' : 'calm', lean: hit ? -0.14 : 0.04,
    near: jump ? CHEER : { x: 22, y: 6 }, far: { x: 18, y: 4 }, nearBend: jump ? -1 : 1, openHand: jump,
  };
  ctx.save();
  ctx.translate(G.x, G.y);
  ctx.scale(0.8, 0.8);
  girl(ctx, rng, gO);
  ctx.restore();
  // pod hull: raised prow and stern like a boita
  const hull = () => {
    ctx.beginPath();
    ctx.moveTo(-90, -50);
    ctx.quadraticCurveTo(-84, -36, -66, -36);
    ctx.lineTo(56, -36);
    ctx.quadraticCurveTo(80, -38, 92, -56);
    ctx.quadraticCurveTo(96, -26, 70, -10);
    ctx.lineTo(-62, -10);
    ctx.quadraticCurveTo(-88, -18, -90, -50);
    ctx.closePath();
  };
  paintedShape(ctx, rng, hull, { x: -92, y: -56, w: 188, h: 46 }, { base: body, light: P.limewhite, shade: bodyD, rim: mix(P.neel, P.ink, 0.3), rimW: 1.2, dabs: 24 });
  clipTo(ctx, hull, () => {
    ctx.fillStyle = mix(P.neel, P.ink, 0.15);
    ctx.fillRect(-100, -30, 200, 9);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = withAlpha(P.seafoam, 0.6);
      ctx.fillRect(-64 + i * 18, -28.5, 11, 6);
    }
    ctx.fillStyle = P.neonRani;
    ctx.fillRect(-100, -19, 200, 1.4);
    ctx.fillStyle = P.haldi;
    ctx.fillRect(-100, -33, 200, 1.4);
  });
  // eye on the prow
  dab(ctx, 80, -42, 4, 2.6, -0.4, P.limewhite, 1);
  dab(ctx, 80.6, -42, 1.6, 1.6, 0, P.ink, 1);
  // glass canopy over her
  ctx.fillStyle = withAlpha(mix(P.seafoam, P.neonCyan, 0.3), 0.2);
  ctx.beginPath();
  ctx.moveTo(-40, -36);
  ctx.quadraticCurveTo(-36, -100, 8, -100);
  ctx.quadraticCurveTo(48, -98, 58, -36);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha(P.limewhite, 0.8);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  taperStroke(ctx, [{ x: 18, y: -96 }, { x: 40, y: -84 }, { x: 50, y: -60 }], 3.4, P.limewhite, 0.55, [0.2, 0.2]);
  taperStroke(ctx, [{ x: -32, y: -60 }, { x: -26, y: -82 }], 2, P.limewhite, 0.4);
  // underside skids glowing
  for (const x of [-46, 44]) {
    ctx.fillStyle = mix(P.neel, P.ink, 0.3);
    ctx.fillRect(x - 12, -11, 24, 4);
    dab(ctx, x, -6, 12, 1.6, 0, P.neonCyan, 0.9);
  }
  ctx.restore();
}

// =============================================================================
// Registry
// =============================================================================
// =============================================================================
// Future rides: glider (appliqué wing), lightsail (orbit suit on a sail-board), starBoita
// =============================================================================
function paintGlider(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const flap = st.k === 'cycle' ? Math.sin(p * TAU) * 2 : 0;
  const tilt = jump ? -0.16 : hit ? 0.12 : 0;
  ctx.save();
  ctx.rotate(tilt);
  // Taapoi hangs below the wing, lying forward on a light frame.
  ctx.save();
  ctx.translate(2, 31 + flap * 0.3);
  ctx.scale(0.62, 0.62);
  girl(ctx, rng, {
    lower: 'seat', lean: 0.1, face: hit ? 'hit' : jump ? 'happy' : 'calm',
    near: jump ? CHEER : { x: 22, y: -34 }, far: { x: 18, y: -36 }, nearBend: jump ? -1 : 1, farBend: 1, openHand: jump,
  });
  ctx.restore();
  // control bar + lines
  ctx.strokeStyle = withAlpha(P.limewhite, 0.7);
  ctx.lineWidth = 0.8;
  for (const x of [-26, 0, 26]) { ctx.beginPath(); ctx.moveTo(x, -14 + flap * 0.4); ctx.lineTo(x * 0.25, 12); ctx.stroke(); }
  taperStroke(ctx, [{ x: 8, y: -4 }, { x: 20, y: -4 }], 2, mix(P.neel, P.ink, 0.3), 1, [1, 1]);
  // the wing: indigo field with sindoor/haldi/rani appliqué panels and neon-cyan edge
  const wing = () => {
    ctx.beginPath();
    ctx.moveTo(-86, -6 + flap);
    ctx.quadraticCurveTo(-30, -44 - flap, 60, -20);
    ctx.quadraticCurveTo(84, -12, 92, -2);
    ctx.quadraticCurveTo(10, -22, -86, -6 + flap);
    ctx.closePath();
  };
  paintedShape(ctx, rng, wing, { x: -86, y: -46, w: 180, h: 44 }, { base: mix(P.neel, P.ink, 0.1), light: mix(P.neel, P.limewhite, 0.4), shade: mix(P.neel, P.ink, 0.5), rim: mix(P.neel, P.ink, 0.6), rimW: 1.2, dabs: 12, lightFrom: 'top' });
  clipTo(ctx, wing, () => {
    const cols = [P.sindoor, P.haldi, P.rani, P.tota];
    for (let i = 0; i < 7; i++) {
      const x = -72 + i * 24;
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      ctx.moveTo(x, -18);
      ctx.lineTo(x + 9, -32 + (i % 2) * 4);
      ctx.lineTo(x + 18, -18);
      ctx.closePath();
      ctx.fill();
      dab(ctx, x + 9, -22, 1.6, 1.6, 0, P.limewhite, 0.9);
    }
    ctx.strokeStyle = withAlpha(P.limewhite, 0.75);
    ctx.setLineDash([1.5, 1.5]);
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-84, -9 + flap); ctx.quadraticCurveTo(10, -22, 90, -3); ctx.stroke();
    ctx.setLineDash([]);
  });
  taperStroke(ctx, [{ x: -84, y: -6 + flap }, { x: 4, y: -22 }, { x: 90, y: -3 }], 1.6, P.neonCyan, 0.95, [0.1, 0.1]);
  glow(ctx, 4, -16, 30, P.neonCyan, 0.14);
  ctx.restore();
}

function paintLightsail(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const bob = st.k === 'cycle' ? Math.sin(p * TAU) * 1.4 : 0;
  // the sail-board under her feet
  const board = () => polyPath(ctx, [{ x: -34, y: -4 }, { x: 36, y: -4 }, { x: 28, y: 2 }, { x: -28, y: 2 }]);
  paintedShape(ctx, rng, board, { x: -34, y: -4, w: 70, h: 6 }, { base: mix(P.neel, P.limewhite, 0.2), light: P.limewhite, shade: mix(P.neel, P.ink, 0.4), rim: mix(P.neel, P.ink, 0.6), rimW: 1, dabs: 4 });
  taperStroke(ctx, [{ x: -30, y: 3 }, { x: 28, y: 3 }], 1.4, P.neonCyan, 0.95, [0.3, 0.3]);
  glow(ctx, -34, 0, 14, P.neonRani, 0.4 + Math.sin(p * TAU) * 0.1);
  // a small light-sail on a mast behind her
  taperStroke(ctx, [{ x: -18, y: -4 }, { x: -20, y: -84 }], 2, mix(P.limewhite, P.neel, 0.3), 1, [1, 1]);
  const sail = () => {
    ctx.beginPath();
    ctx.moveTo(-20, -82);
    ctx.quadraticCurveTo(-58 - bob * 3, -52, -22, -18);
    ctx.quadraticCurveTo(-34, -52, -20, -82);
    ctx.closePath();
  };
  ctx.fillStyle = withAlpha(P.neonCyan, 0.35);
  sail(); ctx.fill();
  ctx.strokeStyle = withAlpha(P.limewhite, 0.85);
  ctx.lineWidth = 1;
  sail(); ctx.stroke();
  for (let i = 1; i < 5; i++) taperStroke(ctx, [{ x: -20, y: -82 + i * 13 }, { x: -38 - bob, y: -66 + i * 11 }], 0.7, P.limewhite, 0.5, [0.2, 0.2]);
  // Taapoi in her orbit suit, standing on the board
  ctx.save();
  ctx.translate(2, -44 + bob);
  girl(ctx, rng, {
    suit: true, lower: 'stand', lean: hit ? -0.14 : 0.05, face: jump ? 'happy' : hit ? 'hit' : 'calm',
    footN: { x: 10, y: 38 }, footF: { x: -8, y: 38 }, kneeN: -1, kneeF: -1, hem: 0,
    near: jump ? CHEER : { x: 18, y: -4 }, far: { x: 14, y: -6 }, nearBend: jump ? -1 : 1, farBend: 1, openHand: jump,
  });
  helmet(ctx);
  ctx.restore();
}

function paintStarBoita(ctx: Ctx, rng: Rng, st: St): void {
  const p = phaseOf(st);
  const jump = st.k === 'jump', hit = st.k === 'hit';
  const bob = st.k === 'cycle' ? Math.sin(p * TAU) * 1.6 : 0;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(jump ? -0.12 : hit ? 0.09 : 0);
  // thruster glow behind
  glow(ctx, -92, 4, 30 + Math.sin(p * TAU * 2) * 3, P.neonCyan, 0.55);
  glow(ctx, -92, 4, 14, P.limewhite, 0.7);
  // glowing sails
  const sail = (mx: number, top: number, h: number, col: string) => {
    const s = () => {
      ctx.beginPath();
      ctx.moveTo(mx, top);
      ctx.quadraticCurveTo(mx + 34, top + h * 0.5, mx + 4, top + h);
      ctx.lineTo(mx - 2, top + h);
      ctx.closePath();
    };
    ctx.fillStyle = withAlpha(col, 0.5);
    s(); ctx.fill();
    ctx.strokeStyle = withAlpha(P.limewhite, 0.9);
    ctx.lineWidth = 1.2;
    s(); ctx.stroke();
    glow(ctx, mx + 12, top + h * 0.5, 26, col, 0.25);
  };
  taperStroke(ctx, [{ x: -14, y: -2 }, { x: -14, y: -74 }], 2.4, woodD, 1, [1, 1]);
  taperStroke(ctx, [{ x: 36, y: -4 }, { x: 36, y: -50 }], 2, woodD, 1, [1, 1]);
  sail(-14, -72, 62, P.neonRani);
  sail(36, -48, 42, P.neonCyan);
  // Taapoi at the helm (a bubble canopy over her)
  ctx.save();
  ctx.translate(8, -22);
  ctx.scale(0.6, 0.6);
  girl(ctx, rng, {
    lower: 'seat', lean: 0.06, face: hit ? 'hit' : jump ? 'happy' : 'calm',
    near: jump ? CHEER : { x: 24, y: 0 }, far: { x: 20, y: 2 }, nearBend: jump ? -1 : 1, farBend: 1, openHand: jump,
  });
  ctx.restore();
  ctx.fillStyle = withAlpha(P.seafoam, 0.2);
  ctx.beginPath(); ctx.ellipse(10, -22, 24, 22, 0, Math.PI, TAU); ctx.fill();
  ctx.strokeStyle = withAlpha(P.limewhite, 0.7);
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(10, -22, 24, 22, 0, Math.PI, TAU); ctx.stroke();
  // the hull: a boita turned starship, haldi band + neon trim
  const H: HullO = { x0: -86, x1: 84, deck: -14, keel: 14, prow: 30, stern: 20, base: mix(P.neel, P.limewhite, 0.18), light: mix(P.neel, P.limewhite, 0.55), shade: mix(P.neel, P.ink, 0.5) };
  boatHull(ctx, rng, H);
  ctx.fillStyle = P.haldi;
  ctx.fillRect(H.x0 + 18, H.deck + 4, H.x1 - H.x0 - 44, 1.8);
  taperStroke(ctx, [{ x: H.x0 + 16, y: H.deck + 12 }, { x: 0, y: H.deck + 13 }, { x: H.x1 - 18, y: H.deck + 9 }], 1.8, P.neonCyan, 0.95, [0.4, 0.4]);
  for (let i = 0; i < 5; i++) dab(ctx, H.x0 + 26 + i * 28, H.deck + 8, 2.2, 2.2, 0, P.neonRani, 0.95);
  ctx.restore();
}

const SPECS: Partial<Record<VehicleId, Spec>> = {
  foot: { w: 120, h: 132, ox: 58, oy: 124, n: 8, hz: 1.7, paint: paintFoot },
  cart: { w: 172, h: 128, ox: 84, oy: 120, n: 8, hz: 1.4, paint: paintCart },
  elephant: { w: 150, h: 144, ox: 76, oy: 136, n: 8, hz: 1.1, paint: paintElephant },
  boita: { w: 196, h: 148, ox: 98, oy: 136, n: 6, hz: 0.9, paint: paintBoita },
  boitaElephant: { w: 200, h: 140, ox: 100, oy: 126, n: 6, hz: 0.8, paint: paintBoitaElephant },
  countryBoat: { w: 196, h: 110, ox: 98, oy: 96, n: 8, hz: 1.0, paint: paintCountryBoat },
  palanquin: { w: 196, h: 136, ox: 98, oy: 128, n: 8, hz: 1.5, paint: paintPalanquin },
  pressCart: { w: 160, h: 132, ox: 76, oy: 124, n: 8, hz: 1.6, paint: paintPressCart },
  bicycle: { w: 124, h: 128, ox: 58, oy: 120, n: 8, hz: 1.5, paint: paintBicycle },
  scooter: { w: 104, h: 132, ox: 48, oy: 124, n: 6, hz: 1.6, paint: paintScooter },
  bus: { w: 200, h: 120, ox: 98, oy: 112, n: 6, hz: 1.5, paint: paintBus },
  train: { w: 176, h: 134, ox: 86, oy: 126, n: 8, hz: 1.4, paint: paintTrain },
  dakota: { w: 200, h: 92, ox: 100, oy: 50, n: 6, hz: 3, paint: paintDakota },
  maglev: { w: 196, h: 118, ox: 98, oy: 110, n: 6, hz: 1.2, paint: paintMaglev },
  eboat: { w: 190, h: 136, ox: 96, oy: 124, n: 6, hz: 1.2, paint: paintEboat },
  glider: { w: 200, h: 120, ox: 100, oy: 60, n: 6, hz: 1.2, paint: paintGlider },
  lightsail: { w: 120, h: 130, ox: 60, oy: 122, n: 6, hz: 1.0, paint: paintLightsail },
  starBoita: { w: 220, h: 130, ox: 110, oy: 70, n: 6, hz: 1.3, paint: paintStarBoita },
};

function paintOne(spec: Spec, id: string, st: St): { c: HTMLCanvasElement; ribbon: Pt | null } {
  const [c, ctx] = makeCanvas(spec.w * RIDE_SCALE, spec.h * RIDE_SCALE);
  ctx.scale(RIDE_SCALE, RIDE_SCALE);
  ctx.translate(spec.ox, spec.oy);
  ribbonDev = null;
  const rng = new Rng(`ride:${id}`); // same seed each frame: texture stays put, only the motion changes
  spec.paint(ctx, rng, st);
  const r = ribbonDev as Pt | null;
  return { c, ribbon: r ? { x: r.x / RIDE_SCALE - spec.ox, y: r.y / RIDE_SCALE - spec.oy } : null };
}

export function paintRide(id: VehicleId): RideSprite {
  if (id === 'canoe') return canoeRide();
  const spec = SPECS[id] ?? SPECS.foot!;
  const frames: HTMLCanvasElement[] = [];
  let ribbon: Pt = { x: -14, y: -96 };
  for (let i = 0; i < spec.n; i++) {
    const r = paintOne(spec, id, { k: 'cycle', p: i / spec.n, i });
    frames.push(r.c);
    if (i === 0 && r.ribbon) ribbon = { x: Math.round(r.ribbon.x * 10) / 10, y: Math.round(r.ribbon.y * 10) / 10 };
  }
  const jump = paintOne(spec, id, { k: 'jump' }).c;
  const hit = paintOne(spec, id, { k: 'hit' }).c;
  return { frames, jump, hit, ox: spec.ox, oy: spec.oy, ribbon, cycleHz: spec.hz };
}

// Keep a couple of helpers referenced while rides are being added.
void glow; void smooth; void add; void foam; void ink;
