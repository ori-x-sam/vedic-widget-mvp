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
      near: { x: 10 - sN * 15, y: -3 - Math.max(0, -sN) * 9 }, far: { x: 6 + sN * 15, y: -6 - Math.max(0, sN) * 9 },
      nearBend: -1, farBend: -1,
    });
    ctx.restore();
  } else if (st.k === 'jump') {
    ctx.save();
    ctx.translate(0, -RUN_GROUND);
    girl(ctx, rng, {
      lower: 'stand', lean: 0.04, face: 'happy', footN: { x: 13, y: 26 }, footF: { x: -6, y: 33 }, kneeF: -1, hem: -5,
      near: { x: 20, y: -36 }, far: { x: -4, y: -38 }, nearBend: 1, farBend: -1,
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
  const nearH: Pt = jump ? { x: 18, y: -40 } : hit ? { x: 20, y: -2 } : { x: 21, y: -4 + Math.sin(p * TAU) * 0.8 };
  const farH: Pt = hit ? { x: 16, y: -6 } : { x: 18, y: -7 };
  girl(ctx, rng, {
    lower: 'astride', footN: { x: 20, y: 25 + Math.sin(p * TAU) * 1.2 }, footF: { x: 15, y: 24 }, kneeN: -1, kneeF: -1,
    lean: hit ? -0.14 : 0.03, face: jump ? 'happy' : hit ? 'hit' : 'calm',
    near: nearH, far: farH, nearBend: jump ? -1 : 1, farBend: 1,
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
    near: jump ? { x: 18, y: -38 } : hit ? { x: 20, y: -10 } : { x: 17, y: 2 }, far: jump ? { x: 10, y: 0 } : { x: 14, y: 1 },
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
    near: jump ? { x: 18, y: -40 } : hit ? { x: 22, y: -14 } : { x: 24, y: 10 },
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
  taperStroke(ctx, [{ x: -32, y: H.deck }, { x: -30, y: -108 }], 2, mix(P.limewhite, P.neel, 0.3), 1, [1, 1]);
  taperStroke(ctx, [{ x: 28, y: H.deck }, { x: 22, y: -110 }], 2, mix(P.limewhite, P.neel, 0.3), 1, [1, 1]);
  const pan = () => polyPath(ctx, [{ x: -44, y: -108 }, { x: 34, y: -114 }, { x: 38, y: -108 }, { x: -42, y: -102 }]);
  pan();
  ctx.fillStyle = mix(P.neel, P.ink, 0.2);
  ctx.fill();
  clipTo(ctx, pan, () => {
    ctx.strokeStyle = withAlpha(P.haldi, 0.7);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = -40; x < 40; x += 7) { ctx.moveTo(x, -116); ctx.lineTo(x + 1, -100); }
    ctx.stroke();
    glow(ctx, 10, -110, 18, P.limewhite, 0.25);
  });
  ctx.fillStyle = P.neonCyan;
  ctx.fillRect(-42, -102.5, 80, 1);
  // Taapoi at the little wheel
  ctx.save();
  ctx.translate(6, H.deck - 15);
  const wheelAt = { x: 26, y: 2 };
  girl(ctx, rng, {
    lower: 'seat', face: jump ? 'happy' : hit ? 'hit' : 'calm', lean: hit ? -0.14 : 0.06,
    near: jump ? { x: 18, y: -40 } : { x: wheelAt.x - 2, y: wheelAt.y - 6 + Math.sin(p * TAU) }, far: { x: wheelAt.x - 1, y: wheelAt.y + 2 },
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
// Registry
// =============================================================================
const SPECS: Partial<Record<VehicleId, Spec>> = {
  foot: { w: 120, h: 132, ox: 58, oy: 124, n: 8, hz: 1.7, paint: paintFoot },
  cart: { w: 172, h: 128, ox: 84, oy: 120, n: 8, hz: 1.4, paint: paintCart },
  elephant: { w: 150, h: 136, ox: 76, oy: 128, n: 8, hz: 1.1, paint: paintElephant },
  boita: { w: 196, h: 140, ox: 98, oy: 128, n: 6, hz: 0.9, paint: paintBoita },
  boitaElephant: { w: 200, h: 132, ox: 100, oy: 118, n: 6, hz: 0.8, paint: paintBoitaElephant },
  countryBoat: { w: 196, h: 110, ox: 98, oy: 96, n: 8, hz: 1.0, paint: paintCountryBoat },
  eboat: { w: 190, h: 136, ox: 96, oy: 124, n: 6, hz: 1.2, paint: paintEboat },
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
