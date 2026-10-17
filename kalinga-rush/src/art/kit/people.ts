// Picture-reader people: round, simple, friendly figures in warm browns,
// painted to sit in the scenery. Every colour comes from palettes.ts.
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { dab, taperStroke, type Ctx, type Pt } from '../brush';

export type Pose =
  | 'stand' | 'walk' | 'bend' | 'carry' | 'pull' | 'armsUp' | 'wave' | 'point' | 'sit'
  | 'drum' | 'cymbal' | 'conch' | 'sweep' | 'shield' | 'paint' | 'read' | 'adze' | 'serve' | 'hockey' | 'lamp';
export type Headwear = 'none' | 'turban' | 'crown' | 'cap' | 'veil' | 'topi' | 'shako' | 'helmet' | 'bun' | 'hood';

export interface PersonOpts {
  cloth?: string;
  cloth2?: string;
  pose?: Pose;
  head?: Headwear;
  facing?: 1 | -1;
  haze?: number;
  /** 0..1 picks a warm brown (§4.3 rule 8). */
  skin?: number;
  /** Adds a long skirt / sari silhouette. */
  sari?: boolean;
  /** Small trouser legs instead of a dhoti. */
  trousers?: boolean;
  phase?: number;
}

export function skinTone(k: number): string {
  return mix(P.chandan, P.laterite, 0.1 + Math.max(0, Math.min(1, k)) * 0.55);
}

/** A full-length person standing on (x, y). About 34·s px tall. */
export function person(ctx: Ctx, x: number, y: number, s: number, o: PersonOpts = {}): void {
  const f = o.facing ?? 1;
  const hz = o.haze ?? 0;
  const H = (c: string) => (hz ? mix(c, P.skyCream, hz) : c);
  const skin = H(skinTone(o.skin ?? 0.4));
  const skinD = H(mix(skinTone(o.skin ?? 0.4), P.laterite, 0.4));
  const cloth = H(o.cloth ?? P.limewhite);
  const cloth2 = H(o.cloth2 ?? mix(o.cloth ?? P.limewhite, P.khondalite, 0.35));
  const hair = H(P.ink);
  const pose = o.pose ?? 'stand';
  const ph = o.phase ?? 0;
  const hipY = y - 14 * s;
  const lean = pose === 'bend' || pose === 'sweep' || pose === 'serve' ? 0.5 : pose === 'pull' ? 0.35 : pose === 'adze' ? 0.3 : 0;
  // legs
  if (pose === 'sit') {
    taperStroke(ctx, [{ x: x - 2 * s * f, y: y - 6 * s }, { x: x + 7 * s * f, y: y - 5 * s }, { x: x + 8 * s * f, y }], 3.2 * s, skin, 1, [1, 0.8]);
  } else {
    const stride = pose === 'walk' || pose === 'pull' ? 3.5 * Math.sin(ph) : 1.6;
    taperStroke(ctx, [{ x: x - 1.5 * s, y: hipY }, { x: x - stride * s * f, y }], 3 * s, o.trousers ? cloth2 : skin, 1, [1, 0.85]);
    taperStroke(ctx, [{ x: x + 1.5 * s, y: hipY }, { x: x + stride * s * f + 1 * s, y }], 3 * s, o.trousers ? cloth2 : skinD, 1, [1, 0.85]);
  }
  // lower garment
  if (o.sari) {
    ctx.fillStyle = cloth;
    ctx.beginPath();
    ctx.moveTo(x - 4.5 * s, hipY - 4 * s);
    ctx.lineTo(x + 4.5 * s, hipY - 4 * s);
    ctx.lineTo(x + 6 * s, y - 1 * s);
    ctx.lineTo(x - 6 * s, y - 1 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cloth2;
    ctx.fillRect(x - 6 * s, y - 3 * s, 12 * s, 2 * s);
  } else if (!o.trousers) {
    dab(ctx, x, hipY + 1 * s, 4.6 * s, 4.6 * s, 0, cloth, 1);
    dab(ctx, x - 1 * s, hipY + 2.5 * s, 3 * s, 2.4 * s, 0, cloth2, 0.55);
  }
  // torso
  const sx = x + lean * 7 * s * f;
  const sy = hipY - (11 - lean * 4) * s;
  const torso: Pt[] = [{ x, y: hipY }, { x: (x + sx) / 2, y: (hipY + sy) / 2 }, { x: sx, y: sy }];
  taperStroke(ctx, torso, 7 * s, o.sari || o.cloth2 ? cloth : skin, 1, [1, 0.9]);
  if (o.sari) taperStroke(ctx, [{ x: x - 3 * s * f, y: hipY - 2 * s }, { x: sx + 3 * s * f, y: sy + 1 * s }], 2.4 * s, cloth2, 1);
  // head
  const hx = sx + lean * 3 * s * f;
  const hy = sy - 4.6 * s;
  dab(ctx, hx, hy, 3.6 * s, 3.9 * s, 0, skin, 1);
  dab(ctx, hx + 1.3 * s * f, hy - 0.2 * s, 0.6 * s, 0.7 * s, 0, hair, 1); // eye
  headwear(ctx, o.head ?? 'none', hx, hy, s, f, H, o.sari);
  // arms + props
  arms(ctx, pose, sx, sy, hx, hy, s, f, skin, H, ph);
}

function headwear(ctx: Ctx, kind: Headwear, hx: number, hy: number, s: number, f: number, H: (c: string) => string, sari?: boolean): void {
  const hair = H(P.ink);
  switch (kind) {
    case 'turban':
      dab(ctx, hx - 0.3 * s * f, hy - 2.6 * s, 4.4 * s, 2.6 * s, 0, H(P.limewhite), 1);
      dab(ctx, hx + 0.5 * s * f, hy - 3.2 * s, 2.6 * s, 1.6 * s, 0.3, H(P.haldi), 0.9);
      break;
    case 'crown':
      dab(ctx, hx - 1 * s * f, hy - 1.5 * s, 3.8 * s, 2.6 * s, 0, hair, 1);
      ctx.fillStyle = H(P.haldi);
      ctx.beginPath();
      ctx.moveTo(hx - 3.6 * s, hy - 2.6 * s);
      ctx.lineTo(hx - 2.6 * s, hy - 8.5 * s);
      ctx.lineTo(hx - 0.8 * s, hy - 5 * s);
      ctx.lineTo(hx, hy - 9.5 * s);
      ctx.lineTo(hx + 0.8 * s, hy - 5 * s);
      ctx.lineTo(hx + 2.6 * s, hy - 8.5 * s);
      ctx.lineTo(hx + 3.6 * s, hy - 2.6 * s);
      ctx.closePath();
      ctx.fill();
      dab(ctx, hx, hy - 4.6 * s, 0.9 * s, 0.9 * s, 0, H(P.sindoor), 1);
      break;
    case 'cap':
      dab(ctx, hx, hy - 2.8 * s, 3.8 * s, 1.8 * s, 0, H(P.limewhite), 1);
      break;
    case 'topi':
      ctx.fillStyle = H(P.limewhite);
      ctx.fillRect(hx - 3.4 * s, hy - 5 * s, 6.8 * s, 2.6 * s);
      break;
    case 'shako':
      ctx.fillStyle = H(P.ink);
      ctx.fillRect(hx - 2.8 * s, hy - 9 * s, 5.6 * s, 6 * s);
      break;
    case 'helmet':
      dab(ctx, hx, hy - 2.6 * s, 4 * s, 2.6 * s, 0, H(P.haldi), 1);
      break;
    case 'hood':
      dab(ctx, hx, hy - 0.5 * s, 4.4 * s, 4.6 * s, 0, H(P.limewhite), 0.95);
      dab(ctx, hx + 1 * s * f, hy, 2.4 * s, 2.2 * s, 0, H(P.peacock), 0.8);
      break;
    case 'veil':
      dab(ctx, hx - 0.8 * s * f, hy - 1 * s, 4.4 * s, 4.2 * s, 0, H(sari ? P.sindoor : P.limewhite), 0.9);
      dab(ctx, hx + 0.6 * s * f, hy + 0.3 * s, 2.6 * s, 3 * s, 0, H(P.chandan), 1);
      break;
    case 'bun':
      dab(ctx, hx - 1 * s * f, hy - 1.6 * s, 3.8 * s, 2.6 * s, 0, hair, 1);
      dab(ctx, hx - 3.4 * s * f, hy - 1.8 * s, 1.9 * s, 1.9 * s, 0, hair, 1);
      dab(ctx, hx - 3.4 * s * f, hy - 1.8 * s, 2.3 * s, 0.6 * s, 0.4, H(P.limewhite), 0.9);
      break;
    default:
      dab(ctx, hx - 1 * s * f, hy - 1.8 * s, 3.8 * s, 2.4 * s, 0, hair, 1);
  }
}

function arms(ctx: Ctx, pose: Pose, sx: number, sy: number, hx: number, hy: number, s: number, f: number, skin: string, H: (c: string) => string, ph: number): void {
  const sh = { x: sx, y: sy + 2 * s };
  const arm = (to: Pt, mid?: Pt) => taperStroke(ctx, mid ? [sh, mid, to] : [sh, to], 2.4 * s, skin, 1, [1, 0.75]);
  const wood = H(mix(P.laterite, P.chandan, 0.4));
  switch (pose) {
    case 'armsUp':
      arm({ x: sx - 3 * s, y: sy - 9 * s });
      arm({ x: sx + 4 * s, y: sy - 9 * s });
      break;
    case 'wave':
      arm({ x: sx + 5 * s * f, y: sy - 8 * s + Math.sin(ph) * 2 * s });
      arm({ x: sx - 1 * s * f, y: sy + 8 * s });
      break;
    case 'point':
      arm({ x: sx + 9 * s * f, y: sy - 1 * s });
      break;
    case 'carry':
      arm({ x: hx + 1 * s * f, y: hy - 5 * s });
      dab(ctx, hx, hy - 6.5 * s, 4.6 * s, 3 * s, 0, H(P.laterite), 1);
      dab(ctx, hx - 1 * s, hy - 7.6 * s, 2.4 * s, 1 * s, 0, H(P.chandan), 0.7);
      break;
    case 'pull': {
      const hand = { x: sx + 8 * s * f, y: sy + 3 * s };
      arm(hand);
      break;
    }
    case 'drum':
      arm({ x: sx + 5 * s * f, y: sy + 6 * s });
      dab(ctx, sx + 5 * s * f, sy + 7 * s, 5 * s, 3 * s, 0, H(P.laterite), 1);
      dab(ctx, sx + 1 * s * f, sy + 7 * s, 1.4 * s, 2.6 * s, 0, H(P.chandan), 1);
      dab(ctx, sx + 9 * s * f, sy + 7 * s, 1.4 * s, 2.6 * s, 0, H(P.chandan), 1);
      break;
    case 'cymbal':
      arm({ x: sx + 4 * s * f, y: sy - 3 * s + Math.sin(ph) * s });
      dab(ctx, sx + 4.5 * s * f, sy - 3.5 * s, 2 * s, 0.8 * s, 0.3, H(P.haldi), 1);
      break;
    case 'conch':
      arm({ x: hx + 3 * s * f, y: hy + 1 * s });
      dab(ctx, hx + 5 * s * f, hy, 3 * s, 1.8 * s, 0.2 * f, H(P.limewhite), 1);
      break;
    case 'sweep': {
      const end = { x: sx + 10 * s * f, y: sy + 13 * s };
      arm(end);
      taperStroke(ctx, [{ x: sx + 3 * s * f, y: sy + 2 * s }, end], 1.4 * s, H(P.haldi), 1, [1, 1]);
      taperStroke(ctx, [end, { x: end.x + 4 * s * f, y: end.y + 2 * s }], 3 * s, H(P.haldi), 1, [0.6, 1]);
      break;
    }
    case 'shield':
      arm({ x: sx + 5 * s * f, y: sy + 4 * s });
      dab(ctx, sx + 6 * s * f, sy + 4 * s, 4.6 * s, 4.6 * s, 0, H(mix(P.laterite, P.ink, 0.3)), 1);
      dab(ctx, sx + 6 * s * f, sy + 4 * s, 1.4 * s, 1.4 * s, 0, H(P.haldi), 1);
      taperStroke(ctx, [{ x: sx - 2 * s * f, y: sy - 12 * s }, { x: sx - 3 * s * f, y: sy + 14 * s }], 1.2 * s, wood, 1, [1, 1]);
      break;
    case 'paint':
      arm({ x: sx + 6 * s * f, y: sy - 6 * s + Math.sin(ph) * 1.5 * s });
      dab(ctx, sx + 7 * s * f, sy - 7 * s, 1.4 * s, 1.4 * s, 0, H(P.haldi), 1);
      break;
    case 'read':
      arm({ x: sx + 5 * s * f, y: sy + 1 * s });
      ctx.fillStyle = H(P.limewhite);
      ctx.fillRect(sx + 3 * s * f - 3 * s, sy - 3 * s, 6 * s, 5 * s);
      break;
    case 'adze':
      arm({ x: sx + 6 * s * f, y: sy - 4 * s + Math.sin(ph) * 5 * s });
      break;
    case 'serve':
      arm({ x: sx + 7 * s * f, y: sy + 9 * s });
      dab(ctx, sx + 8 * s * f, sy + 10 * s, 3.2 * s, 1.2 * s, 0, H(P.laterite), 1);
      break;
    case 'hockey':
      arm({ x: sx + 4 * s * f, y: sy + 8 * s });
      taperStroke(ctx, [{ x: sx + 4 * s * f, y: sy + 6 * s }, { x: sx + 8 * s * f, y: sy + 21 * s }, { x: sx + 11 * s * f, y: sy + 21 * s }], 1.4 * s, H(P.laterite), 1, [1, 1]);
      break;
    case 'lamp':
      arm({ x: sx + 6 * s * f, y: sy + 5 * s });
      dab(ctx, sx + 7 * s * f, sy + 6 * s, 2.4 * s, 1.2 * s, 0, H(P.laterite), 1);
      dab(ctx, sx + 7 * s * f, sy + 4 * s, 0.9 * s, 1.6 * s, 0, H(P.marigold), 1);
      break;
    default:
      arm({ x: sx + 2 * s * f, y: sy + 9 * s }, { x: sx + 2.5 * s * f, y: sy + 4 * s });
  }
}

/** A row of people (a crowd), with varied clothes and heights. */
export function crowd(ctx: Ctx, rng: Rng, x0: number, x1: number, y: number, s: number, o: { cloths?: string[]; poses?: Pose[]; heads?: Headwear[]; facing?: 1 | -1; haze?: number; density?: number } = {}): void {
  const cloths = o.cloths ?? [P.limewhite, P.haldi, P.sindoor, P.marigold, P.rani, P.tota, P.peacock];
  const step = 9 * s * (o.density ?? 1);
  for (let x = x0; x < x1; x += step * rng.range(0.7, 1.2)) {
    const sari = rng.chance(0.4);
    person(ctx, x, y + rng.range(-2, 2) * s, s * rng.range(0.88, 1.08), {
      cloth: rng.pick(cloths), cloth2: rng.pick(cloths), pose: o.poses ? rng.pick(o.poses) : 'stand',
      head: sari ? 'veil' : o.heads ? rng.pick(o.heads) : rng.pick(['none', 'none', 'turban', 'cap'] as Headwear[]),
      facing: o.facing ?? (rng.chance(0.5) ? 1 : -1), haze: o.haze, skin: rng.next(), sari, phase: rng.next() * 6,
    });
  }
}

/** A parasol / chhati in Pipili appliqué: bright cut-cloth panels with stitched edges. */
export function chhati(ctx: Ctx, x: number, y: number, r: number, colours: string[], haze = 0): void {
  const H = (c: string) => (haze ? mix(c, P.skyCream, haze) : c);
  taperStroke(ctx, [{ x, y }, { x, y: y + r * 2.2 }], Math.max(1, r * 0.08), H(P.laterite), 1, [1, 1]);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI, a1 = Math.PI + ((i + 1) / n) * Math.PI;
    ctx.fillStyle = H(colours[i % colours.length]);
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.15);
    ctx.lineTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r * 0.45);
    ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  // scalloped appliqué fringe with stitches
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const fx = x - r + t * 2 * r;
    dab(ctx, fx, y + 1, r * 0.12, r * 0.16, 0, H(colours[(i + 1) % colours.length]), 1);
  }
  ctx.strokeStyle = withAlpha(H(P.limewhite), 0.8);
  ctx.setLineDash([1.5, 1.5]);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.92, r * 0.38, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  dab(ctx, x, y - r * 0.5, r * 0.1, r * 0.1, 0, H(P.haldi), 1);
}

/** A triangular temple/festival flag on a pole. */
export function flag(ctx: Ctx, x: number, y: number, h: number, colour: string, haze = 0, wave = 0): void {
  const H = (c: string) => (haze ? mix(c, P.skyCream, haze) : c);
  taperStroke(ctx, [{ x, y }, { x, y: y - h }], Math.max(1, h * 0.03), H(P.laterite), 1, [1, 1]);
  ctx.fillStyle = H(colour);
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.quadraticCurveTo(x + h * 0.25, y - h + h * 0.06 + wave, x + h * 0.45, y - h + h * 0.12);
  ctx.quadraticCurveTo(x + h * 0.22, y - h + h * 0.16 - wave, x, y - h + h * 0.24);
  ctx.closePath();
  ctx.fill();
}
