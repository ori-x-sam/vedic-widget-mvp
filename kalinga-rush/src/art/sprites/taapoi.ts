// Taapoi in her dugout canoe (Record 01 ride). Drawn at 2× and shown at 0.5×.
// Fixed colours (§4.3 rule 4): sindoor + haldi + chandan, cotton frock with
// a sindoor border, jasmine string; the sindoor ribbon is animated in-game.
import { P, FIXED } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { Rng } from '../../lib/rng';
import { clipTo, dab, dabField, glow, makeCanvas, taperStroke, type Ctx } from '../brush';

export const TAAPOI_FRAME = { w: 200, h: 170, originX: 100, originY: 138, scale: 2 };
/** Where the ribbon is tied, relative to the waterline origin (logical px). */
export const RIBBON_ANCHOR = { x: -17, y: -92 };

export type Pose = { kind: 'paddle'; phase: number } | { kind: 'jump' } | { kind: 'hit' };

const T = FIXED.taapoi;
const wood = mix(P.laterite, P.chandan, 0.18);
const woodLight = mix(P.chandan, P.haldi, 0.3);
const woodDark = mix(P.laterite, P.ink, 0.42);
const outline = mix(P.laterite, P.ink, 0.65);

export function paintTaapoiFrame(pose: Pose): HTMLCanvasElement {
  const F = TAAPOI_FRAME;
  const [c, ctx] = makeCanvas(F.w * F.scale, F.h * F.scale);
  const rng = new Rng(`taapoi:${pose.kind}:${pose.kind === 'paddle' ? pose.phase : 0}`);
  ctx.scale(F.scale, F.scale);
  ctx.translate(F.originX, F.originY);

  const paddle = paddlePose(pose);
  // Far-side paddle bits behind the hull are not visible; paddle is on the near side.
  canoeInterior(ctx);
  girl(ctx, rng, pose, paddle);
  canoeHull(ctx, rng);
  paddleOnTop(ctx, paddle);
  hands(ctx, paddle);
  return c;
}

interface PaddleGeo { gx: number; gy: number; bx: number; by: number }

function paddlePose(pose: Pose): PaddleGeo {
  if (pose.kind === 'jump') return { gx: -14, gy: -78, bx: 46, by: -18 };
  if (pose.kind === 'hit') return { gx: -2, gy: -70, bx: 34, by: -6 };
  const p = pose.phase;
  if (p < 0.55) {
    const t = p / 0.55; // pull: blade travels back through the water
    const e = t * t * (3 - 2 * t);
    return { gx: -2 - 10 * e, gy: -66 + 4 * e, bx: 44 - 80 * e, by: 12 };
  }
  const t = (p - 0.55) / 0.45; // recovery: lift and swing forward
  const e = t * t * (3 - 2 * t);
  return { gx: -12 + 10 * e, gy: -62 - 4 * Math.sin(t * Math.PI), bx: -36 + 80 * e, by: 12 - 26 * Math.sin(t * Math.PI) };
}

function canoeInterior(ctx: Ctx): void {
  // The hollow we see into from slightly above.
  ctx.fillStyle = woodDark;
  ctx.beginPath();
  ctx.moveTo(-76, -18);
  ctx.quadraticCurveTo(0, -27, 74, -24);
  ctx.quadraticCurveTo(0, -12, -76, -18);
  ctx.fill();
  ctx.fillStyle = withAlpha(mix(P.laterite, P.ink, 0.6), 0.8);
  ctx.beginPath();
  ctx.ellipse(-4, -20, 60, 3.2, -0.02, 0, Math.PI * 2);
  ctx.fill();
}

function canoeHull(ctx: Ctx, rng: Rng): void {
  const hull = () => {
    ctx.beginPath();
    ctx.moveTo(-88, -19);
    ctx.quadraticCurveTo(0, -12, 82, -23);
    ctx.quadraticCurveTo(90, -26, 88, -20); // raised prow tip
    ctx.quadraticCurveTo(80, 0, 40, 6);
    ctx.quadraticCurveTo(0, 10, -50, 6);
    ctx.quadraticCurveTo(-84, 2, -90, -12);
    ctx.quadraticCurveTo(-91, -18, -88, -19);
    ctx.closePath();
  };
  // outline
  ctx.save();
  hull();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();
  hull();
  ctx.fillStyle = wood;
  ctx.fill();
  clipTo(ctx, hull, () => {
    const g = ctx.createLinearGradient(0, -24, 0, 10);
    g.addColorStop(0, withAlpha(woodLight, 0.85));
    g.addColorStop(0.25, withAlpha(woodLight, 0.15));
    g.addColorStop(0.6, withAlpha(woodDark, 0.25));
    g.addColorStop(1, withAlpha(woodDark, 0.85));
    ctx.fillStyle = g;
    ctx.fillRect(-95, -30, 190, 45);
    // wood grain
    for (let i = 0; i < 26; i++) {
      const y = rng.range(-16, 4);
      const x0 = rng.range(-86, 40);
      const len = rng.range(18, 60);
      taperStroke(ctx, [{ x: x0, y }, { x: x0 + len * 0.5, y: y - 0.6 }, { x: x0 + len, y: y + 0.2 }], rng.range(0.6, 1.4), rng.chance(0.5) ? woodDark : woodLight, rng.range(0.25, 0.5));
    }
    dabField(ctx, rng, -90, -24, 180, 32, { n: 90, r: [1.5, 4], colours: [woodLight, wood, woodDark], alpha: [0.08, 0.2] });
    // sun catches the prow
    glow(ctx, 70, -18, 26, P.haldi, 0.3);
  });
  // gunwale highlight
  taperStroke(ctx, [{ x: -86, y: -19 }, { x: 0, y: -15.5 }, { x: 80, y: -23 }], 2.2, mix(P.chandan, P.limewhite, 0.35), 0.9, [0.2, 0.3]);
}

function girl(ctx: Ctx, rng: Rng, pose: Pose, pd: PaddleGeo): void {
  const lean = pose.kind === 'paddle' ? Math.sin(pose.phase * Math.PI * 2) * 2.2 : pose.kind === 'jump' ? -2 : 3;
  ctx.save();
  ctx.translate(-6, 0);
  ctx.rotate((lean * Math.PI) / 180);

  // Far arm (behind the body) reaching to the lower hand.
  const lower = lowerHand(pd);
  taperStroke(ctx, [{ x: 4, y: -50 }, { x: (4 + lower.x + 6) / 2, y: (-50 + lower.y) / 2 + 2 }, { x: lower.x + 6, y: lower.y }], 6, T.skinShade, 1, [0.9, 0.7]);

  // Skirt spilling over the seat, with the sindoor border just above the gunwale.
  const skirt = () => {
    ctx.beginPath();
    ctx.moveTo(-22, -14);
    ctx.quadraticCurveTo(-24, -26, -14, -30);
    ctx.lineTo(10, -30);
    ctx.quadraticCurveTo(22, -26, 22, -14);
    ctx.closePath();
  };
  skirt();
  ctx.fillStyle = T.frock;
  ctx.fill();
  clipTo(ctx, skirt, () => {
    ctx.fillStyle = T.border;
    ctx.fillRect(-26, -21, 52, 6);
    ctx.fillStyle = withAlpha(T.accent, 0.95);
    ctx.fillRect(-26, -21.5, 52, 1.4); // haldi pin-stripe on the border
    for (let x = -22; x < 22; x += 5) dab(ctx, x, -18.2, 1.2, 1.2, 0, T.accent, 0.9); // little woven dots
    for (let x = -20; x < 22; x += 6) taperStroke(ctx, [{ x, y: -30 }, { x: x + 2, y: -21 }], 1.1, T.frockShade, 0.6);
  });

  // Bodice.
  const bodice = () => {
    ctx.beginPath();
    ctx.moveTo(-15, -28);
    ctx.quadraticCurveTo(-19, -42, -14, -53);
    ctx.quadraticCurveTo(-2, -58, 10, -53);
    ctx.quadraticCurveTo(15, -42, 12, -28);
    ctx.closePath();
  };
  bodice();
  ctx.fillStyle = T.frock;
  ctx.fill();
  clipTo(ctx, bodice, () => {
    const g = ctx.createLinearGradient(-18, 0, 14, 0);
    g.addColorStop(0, withAlpha(T.frockShade, 0.9));
    g.addColorStop(0.55, withAlpha(T.frock, 0));
    g.addColorStop(1, withAlpha(P.haldi, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(-20, -60, 36, 34);
    dabField(ctx, rng, -18, -58, 32, 30, { n: 26, r: [1.5, 3.5], colours: [T.frockShade, P.limewhite], alpha: [0.1, 0.25] });
  });
  // haldi sash
  taperStroke(ctx, [{ x: -16, y: -30 }, { x: -2, y: -32 }, { x: 13, y: -30 }], 3.4, T.accent, 1, [0.9, 0.9]);
  // neckline trim + haldi bead necklace
  taperStroke(ctx, [{ x: -10, y: -54 }, { x: -1, y: -50 }, { x: 8, y: -54 }], 2, T.border, 1, [0.8, 0.8]);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    dab(ctx, -8 + t * 15, -51 + Math.sin(t * Math.PI) * 3.4, 1.2, 1.2, 0, T.accent, 1);
  }

  // Neck & head.
  taperStroke(ctx, [{ x: 0, y: -54 }, { x: 2, y: -60 }], 7, T.skinShade, 1, [1, 1]);
  head(ctx, rng, pose);

  // Near sleeve (puff) with sindoor border, near arm goes to the upper grip.
  dab(ctx, 6, -48, 7.5, 6.5, 0.3, T.frock, 1);
  dab(ctx, 4, -50, 5, 4, 0.3, T.frockShade, 0.4);
  taperStroke(ctx, [{ x: 1, y: -43 }, { x: 8, y: -42 }, { x: 13, y: -45 }], 2.4, T.border, 1, [0.9, 0.9]);
  const upper = { x: pd.gx + 6, y: pd.gy };
  taperStroke(ctx, [{ x: 9, y: -45 }, { x: (9 + upper.x) / 2 + 4, y: (-45 + upper.y) / 2 + 3 }, upper], 6.2, T.skin, 1, [0.9, 0.7]);
  ctx.restore();
}

function lowerHand(pd: PaddleGeo): { x: number; y: number } {
  return { x: pd.gx + (pd.bx - pd.gx) * 0.42, y: pd.gy + (pd.by - pd.gy) * 0.42 };
}

function head(ctx: Ctx, rng: Rng, pose: Pose): void {
  const hx = 3, hy = -76, r = 18;
  // back hair mass
  dab(ctx, hx - 4, hy - 1, r * 1.02, r * 1.0, 0, T.hair, 1);
  // face
  ctx.fillStyle = T.skin;
  ctx.beginPath();
  ctx.ellipse(hx + 2.5, hy + 1.5, r * 0.88, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  clipTo(ctx, () => { ctx.beginPath(); ctx.ellipse(hx + 2.5, hy + 1.5, r * 0.88, r * 0.92, 0, 0, Math.PI * 2); }, () => {
    const g = ctx.createLinearGradient(hx - r, 0, hx + r, 0);
    g.addColorStop(0, withAlpha(T.skinShade, 0.95));
    g.addColorStop(0.45, withAlpha(T.skinShade, 0));
    g.addColorStop(0.9, withAlpha(P.haldi, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(hx - r, hy - r, r * 2.4, r * 2.4);
    dabField(ctx, rng, hx - r, hy - r, r * 2, r * 2, { n: 18, r: [1.5, 3], colours: [T.skinShade, mix(T.skin, P.haldi, 0.2)], alpha: [0.08, 0.18] });
  });
  // hair cap + fringe over the forehead
  ctx.fillStyle = T.hair;
  ctx.beginPath();
  ctx.moveTo(hx - r * 0.95, hy + 6);
  ctx.quadraticCurveTo(hx - r * 1.05, hy - r * 1.1, hx + 6, hy - r * 0.98);
  ctx.quadraticCurveTo(hx + r * 0.95, hy - r * 0.8, hx + r * 0.9, hy - 6);
  ctx.quadraticCurveTo(hx + 10, hy - 11, hx + 2, hy - 10);
  ctx.quadraticCurveTo(hx - 6, hy - 6, hx - 7, hy + 2);
  ctx.closePath();
  ctx.fill();
  // hair sheen
  taperStroke(ctx, [{ x: hx - 10, y: hy - 13 }, { x: hx, y: hy - 17 }, { x: hx + 9, y: hy - 15 }], 2.2, mix(P.neel, P.limewhite, 0.3), 0.45, [0.2, 0.2]);
  // ear
  dab(ctx, hx - 5, hy + 2, 3, 4, 0, T.skin, 1);
  dab(ctx, hx - 5, hy + 2, 1.6, 2.4, 0, T.skinShade, 0.8);
  dab(ctx, hx - 5, hy + 6.5, 1.2, 1.2, 0, P.haldi, 1); // tiny earring
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
  // bindi
  dab(ctx, hx + 13, hy - 6, 1.4, 1.4, 0, P.sindoor, 1);
  // eyes
  const happy = pose.kind === 'jump';
  if (pose.kind === 'hit') {
    for (const ex of [hx + 7.5, hx + 15.5]) {
      taperStroke(ctx, [{ x: ex - 2.5, y: hy - 2 }, { x: ex + 1.5, y: hy }, { x: ex - 2.5, y: hy + 2 }], 1.6, P.ink, 1, [1, 1]);
    }
    dab(ctx, hx + 13, hy + 9, 2.2, 1.6, 0, mix(P.laterite, P.ink, 0.4), 1);
  } else {
    for (const [ex, rx] of [[hx + 8, 2.9], [hx + 15.8, 2.1]] as const) {
      dab(ctx, ex, hy, rx, happy ? 3.2 : 3.9, 0, P.ink, 1);
      dab(ctx, ex + 0.8, hy - 1.4, rx * 0.42, rx * 0.42, 0, P.limewhite, 1);
    }
    // lashes / kajal flick
    taperStroke(ctx, [{ x: hx + 5, y: hy - 3.4 }, { x: hx + 8, y: hy - 4.6 }, { x: hx + 11, y: hy - 3.6 }], 1.1, P.ink, 0.9, [0.3, 0.6]);
    // brows
    taperStroke(ctx, [{ x: hx + 5, y: hy - 8 }, { x: hx + 8.5, y: hy - 9.2 }, { x: hx + 11, y: hy - 8.4 }], 1, T.hair, 0.8);
    // nose
    taperStroke(ctx, [{ x: hx + 19.2, y: hy + 1 }, { x: hx + 20.4, y: hy + 4.2 }, { x: hx + 18.8, y: hy + 5 }], 1, T.skinShade, 1, [0.4, 0.4]);
    // mouth
    if (happy) {
      ctx.fillStyle = mix(P.laterite, P.ink, 0.35);
      ctx.beginPath();
      ctx.ellipse(hx + 14.5, hy + 9, 2.8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      taperStroke(ctx, [{ x: hx + 11, y: hy + 8.4 }, { x: hx + 14, y: hy + 10.2 }, { x: hx + 17, y: hy + 8.6 }], 1.4, mix(P.laterite, P.ink, 0.35), 1, [0.5, 0.5]);
    }
  }
  // cheeks
  dab(ctx, hx + 7, hy + 6, 3.6, 2.4, 0, T.cheek, 0.28);
}

function paddleOnTop(ctx: Ctx, pd: PaddleGeo): void {
  const shaft = mix(P.chandan, P.laterite, 0.25);
  const shaftDark = mix(P.laterite, P.ink, 0.4);
  const gx = pd.gx, gy = pd.gy, bx = pd.bx, by = pd.by;
  const ang = Math.atan2(by - gy, bx - gx);
  const len = Math.hypot(bx - gx, by - gy);
  // the shaft extends a little beyond the grip
  const sx = gx - Math.cos(ang) * 8, sy = gy - Math.sin(ang) * 8;
  taperStroke(ctx, [{ x: sx, y: sy }, { x: bx, y: by }], 4.6, shaftDark, 1, [1, 1]);
  taperStroke(ctx, [{ x: sx, y: sy }, { x: bx, y: by }], 2.6, shaft, 1, [1, 1]);
  // leaf-shaped blade
  const cx = bx - Math.cos(ang) * 6, cy = by - Math.sin(ang) * 6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.fillStyle = shaftDark;
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.min(16, len * 0.3), 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shaft;
  ctx.beginPath();
  ctx.ellipse(-1, -0.6, Math.min(14, len * 0.28), 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hands(ctx: Ctx, pd: PaddleGeo): void {
  const lower = lowerHand(pd);
  dab(ctx, pd.gx, pd.gy, 3.6, 3.4, 0, T.skin, 1);
  dab(ctx, lower.x, lower.y, 3.6, 3.4, 0, T.skinShade, 1);
}
