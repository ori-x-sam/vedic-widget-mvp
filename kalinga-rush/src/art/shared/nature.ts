// Reusable painted props for the coast and lagoon records: palms, trees,
// reeds, clouds, birds, lotus. Colours only from palettes.ts.
import { P, FIXED } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, dabField, glow, smoothPath, taperStroke, wobblyEllipse, type Ctx, type Pt } from '../brush';

/** Coconut palm. (x, y) = foot of the trunk. */
export function coconutPalm(ctx: Ctx, rng: Rng, x: number, y: number, h: number, lean: number, haze = 0): void {
  const trunk = mix(mix(P.khondalite, P.chandan, 0.35), P.skyCream, haze);
  const trunkDark = mix(mix(P.khondalite, P.laterite, 0.3), P.skyCream, haze * 0.8);
  const leaf = mix(P.tota, P.skyCream, haze);
  const leafDark = mix(mix(P.tota, P.peacock, 0.45), P.skyCream, haze * 0.9);
  const leafLight = mix(mix(P.tota, P.haldi, 0.45), P.skyCream, haze);
  const topX = x + lean * h;
  const topY = y - h;
  const trunkPts = curvePts(x, y, x + lean * h * 0.15, y - h * 0.55, topX, topY, 14);
  taperStroke(ctx, trunkPts, h * 0.07, trunkDark, 1, [1, 0.55]);
  taperStroke(ctx, trunkPts.map((p) => ({ x: p.x + h * 0.008, y: p.y })), h * 0.045, trunk, 0.9, [1, 0.5]);
  // trunk rings
  for (let i = 2; i < trunkPts.length - 1; i++) {
    const p = trunkPts[i];
    dab(ctx, p.x, p.y, h * 0.022, h * 0.006, 0.1, trunkDark, 0.45);
  }
  // fronds
  const n = rng.int(9, 12);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + ((i / (n - 1)) - 0.5) * Math.PI * 1.75 + rng.range(-0.12, 0.12);
    const len = h * rng.range(0.32, 0.46);
    const droop = Math.abs(Math.cos(a)) * len * 0.75 + len * 0.15;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.6 + droop;
    const cx = topX + Math.cos(a) * len * 0.5;
    const cy = topY + Math.sin(a) * len * 0.55 - len * 0.12;
    const spine = curvePts(topX, topY, cx, cy, ex, ey, 12);
    const sunSide = Math.cos(a) > 0; // sun is to the right
    const col = sunSide ? leafLight : leafDark;
    // leaflets
    for (let j = 2; j < spine.length; j++) {
      const p = spine[j];
      const q = spine[j - 1];
      const dir = Math.atan2(p.y - q.y, p.x - q.x);
      const ll = len * 0.22 * (1 - j / spine.length * 0.6);
      for (const side of [-1, 1]) {
        const la = dir + side * 1.1 + 0.35;
        taperStroke(ctx, [p, { x: p.x + Math.cos(la) * ll * 0.5, y: p.y + Math.sin(la) * ll * 0.5 + ll * 0.15 }, { x: p.x + Math.cos(la) * ll, y: p.y + Math.sin(la) * ll + ll * 0.45 }], h * 0.016, rng.pick([col, leaf, leafDark]), 0.85, [0.6, 0.05]);
      }
    }
    taperStroke(ctx, spine, h * 0.018, leafDark, 0.9, [0.8, 0.1]);
  }
  // coconuts
  for (let i = 0; i < 4; i++) dab(ctx, topX + rng.range(-h * 0.03, h * 0.03), topY + h * 0.03 + rng.range(0, h * 0.02), h * 0.018, h * 0.018, 0, mix(mix(P.tota, P.laterite, 0.5), P.skyCream, haze), 0.95);
}

/** Palmyra (tala) palm: straight trunk, round fan-leaf crown. */
export function palmyraPalm(ctx: Ctx, rng: Rng, x: number, y: number, h: number, haze = 0): void {
  const trunk = mix(mix(P.khondalite, P.ink, 0.15), P.skyCream, haze);
  const leaf = mix(mix(P.tota, P.peacock, 0.25), P.skyCream, haze);
  const leafLight = mix(mix(P.tota, P.haldi, 0.4), P.skyCream, haze);
  const leafDark = mix(mix(P.tota, P.neel, 0.35), P.skyCream, haze * 0.9);
  const tx = x + rng.range(-0.04, 0.04) * h;
  taperStroke(ctx, curvePts(x, y, (x + tx) / 2, y - h / 2, tx, y - h, 10), h * 0.06, trunk, 1, [1, 0.75]);
  const cy = y - h - h * 0.05;
  const n = rng.int(14, 18);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n - 0.5) * Math.PI * 2 * 0.95;
    const r = h * rng.range(0.13, 0.19);
    const sun = Math.cos(a) > 0.2;
    const col = sun ? leafLight : Math.sin(a) > 0.3 ? leafDark : leaf;
    // fan: a wedge of stiff strokes
    for (let k = -2; k <= 2; k++) {
      const aa = a + k * 0.09;
      const ex = tx + Math.cos(aa) * r, ey = cy + Math.sin(aa) * r * 0.9 + (Math.sin(aa) > 0 ? r * 0.25 : 0);
      taperStroke(ctx, [{ x: tx + Math.cos(a) * r * 0.25, y: cy + Math.sin(a) * r * 0.2 }, { x: ex, y: ey }], h * 0.03, col, 0.8, [0.7, 0.15]);
    }
  }
  dab(ctx, tx, cy + h * 0.02, h * 0.045, h * 0.035, 0, leafDark, 0.7);
}

/** Broadleaf tree canopy (mango / jackfruit-like). (x, y) = foot of trunk. */
export function broadTree(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze = 0): void {
  const trunk = mix(mix(P.laterite, P.ink, 0.4), P.skyCream, haze);
  const dark = mix(mix(P.tota, P.neel, 0.4), P.skyCream, haze);
  const mid = mix(mix(P.tota, P.peacock, 0.2), P.skyCream, haze);
  const light = mix(mix(P.tota, P.haldi, 0.4), P.skyCream, haze);
  taperStroke(ctx, curvePts(x, y, x - w * 0.04, y - h * 0.3, x + w * 0.02, y - h * 0.55, 8), w * 0.09, trunk, 1, [1, 0.6]);
  const blobs: { x: number; y: number; r: number }[] = [];
  const n = rng.int(6, 9);
  for (let i = 0; i < n; i++) {
    blobs.push({ x: x + rng.range(-0.4, 0.4) * w, y: y - h * 0.62 + rng.range(-0.28, 0.2) * h, r: rng.range(0.2, 0.3) * w });
  }
  for (const b of blobs) smoothFill(ctx, wobblyEllipse(rng, b.x, b.y + b.r * 0.12, b.r, b.r * 0.82, 0.12), dark, 1);
  for (const b of blobs) smoothFill(ctx, wobblyEllipse(rng, b.x - b.r * 0.05, b.y - b.r * 0.05, b.r * 0.85, b.r * 0.7, 0.14), mid, 0.95);
  for (const b of blobs) if (b.x > x - w * 0.15) smoothFill(ctx, wobblyEllipse(rng, b.x + b.r * 0.25, b.y - b.r * 0.3, b.r * 0.45, b.r * 0.35, 0.2), light, 0.75);
  // leafy dabs
  for (const b of blobs) {
    for (let i = 0; i < Math.round(b.r * 1.6); i++) {
      const a = rng.next() * Math.PI * 2;
      const rr = Math.sqrt(rng.next()) * b.r;
      const px = b.x + Math.cos(a) * rr, py = b.y + Math.sin(a) * rr * 0.8;
      const lit = px > b.x && py < b.y;
      dab(ctx, px, py, rng.range(1.5, 3.5) * (w / 120 + 0.5), rng.range(1, 2.4) * (w / 120 + 0.5), rng.next() * 3, lit ? light : rng.pick([dark, mid]), rng.range(0.35, 0.7));
    }
  }
}

function smoothFill(ctx: Ctx, pts: Pt[], colour: string, alpha: number): void {
  ctx.fillStyle = withAlpha(colour, alpha);
  smoothPath(ctx, pts, true);
  ctx.fill();
}

/** A soft cumulus bank. (x, y) = centre of its flat base. */
export function cloud(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number): void {
  const shade = mix(mix(P.skyCream, P.chandan, 0.28), P.seafoam, 0.18);
  const body = mix(P.skyCream, P.limewhite, 0.55);
  const top = P.limewhite;
  const puffs: { x: number; y: number; r: number }[] = [];
  const n = Math.max(4, Math.round(w / (h * 0.55)));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const hump = Math.sin(t * Math.PI);
    const r = h * (0.32 + 0.38 * hump) * rng.range(0.8, 1.15);
    puffs.push({ x: x - w / 2 + t * w + rng.range(-0.04, 0.04) * w, y: y - r * 0.55 - hump * h * 0.25, r });
  }
  // undersides
  for (const p of puffs) glowBlob(ctx, p.x, p.y + p.r * 0.25, p.r * 1.05, shade, 0.75);
  // bodies
  for (const p of puffs) glowBlob(ctx, p.x - p.r * 0.05, p.y - p.r * 0.08, p.r * 0.95, body, 0.9);
  // sunlit tops (sun to the right)
  for (const p of puffs) glowBlob(ctx, p.x + p.r * 0.18, p.y - p.r * 0.32, p.r * 0.6, top, 0.85);
  // flat base
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = withAlpha(P.ink, 0.6);
  ctx.fillRect(x - w, y + h * 0.04, w * 2, h);
  ctx.restore();
  // painterly edge dabs
  for (const p of puffs) {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI + rng.next() * Math.PI;
      dab(ctx, p.x + Math.cos(a) * p.r * 0.85, p.y + Math.sin(a) * p.r * 0.8, p.r * 0.22, p.r * 0.14, a, rng.pick([body, top]), 0.35);
    }
  }
}

function glowBlob(ctx: Ctx, x: number, y: number, r: number, colour: string, alpha: number): void {
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, withAlpha(colour, alpha));
  g.addColorStop(0.7, withAlpha(colour, alpha * 0.85));
  g.addColorStop(1, withAlpha(colour, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A clump of reeds/grass blades. (x, y) = base centre. */
export function reedTuft(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, cols: { dark: string; mid: string; tip: string }, n = 14, cattails = 0): void {
  for (let i = 0; i < n; i++) {
    const bx = x + rng.range(-0.5, 0.5) * w * 0.6;
    const lean = rng.range(-0.35, 0.45);
    const hh = h * rng.range(0.55, 1);
    const tx = bx + lean * hh * 0.5;
    const ty = y - hh;
    const col = rng.pick([cols.dark, cols.mid, cols.mid]);
    taperStroke(ctx, curvePts(bx, y, bx + lean * hh * 0.1, y - hh * 0.6, tx, ty, 8), Math.max(1.5, w * 0.07), col, 0.95, [0.9, 0.02]);
    if (rng.chance(0.5)) taperStroke(ctx, curvePts(bx + lean * hh * 0.05, y - hh * 0.5, bx + lean * hh * 0.25, y - hh * 0.8, tx, ty, 6), Math.max(1, w * 0.035), cols.tip, 0.8, [0.2, 0.02]);
  }
  for (let i = 0; i < cattails; i++) {
    const bx = x + rng.range(-0.3, 0.3) * w;
    const hh = h * rng.range(0.85, 1.12);
    taperStroke(ctx, [{ x: bx, y }, { x: bx + 2, y: y - hh }], Math.max(1.2, w * 0.03), cols.dark, 1, [1, 1]);
    dab(ctx, bx + 2, y - hh + h * 0.08, w * 0.045, h * 0.08, 0.05, mix(P.laterite, P.ink, 0.45), 1);
  }
}

export function flamingo(ctx: Ctx, rng: Rng, x: number, y: number, s: number, feeding: boolean, haze = 0): void {
  const pink = mix(mix(P.rani, P.limewhite, 0.55), P.skyCream, haze);
  const deep = mix(mix(P.rani, P.sindoor, 0.3), P.skyCream, haze);
  const leg = mix(mix(P.rani, P.chandan, 0.5), P.skyCream, haze);
  const ink = mix(P.ink, P.skyCream, haze);
  const bodyY = y - 26 * s;
  // legs (one tucked sometimes)
  ctx.strokeStyle = withAlpha(leg, 1);
  ctx.lineWidth = Math.max(1, 1.3 * s);
  ctx.beginPath();
  ctx.moveTo(x - 1 * s, bodyY + 5 * s);
  ctx.lineTo(x - 1.5 * s, y);
  if (rng.chance(0.6)) {
    ctx.moveTo(x + 2 * s, bodyY + 5 * s);
    ctx.lineTo(x + 2.5 * s, y);
  } else {
    ctx.moveTo(x + 1 * s, bodyY + 5 * s);
    ctx.lineTo(x + 5 * s, bodyY + 12 * s);
    ctx.lineTo(x + 1 * s, bodyY + 15 * s);
  }
  ctx.stroke();
  // body
  dab(ctx, x, bodyY, 9 * s, 5.5 * s, -0.12, pink, 1);
  dab(ctx, x - 2 * s, bodyY - 1 * s, 6.5 * s, 3.6 * s, -0.15, deep, 0.75);
  dab(ctx, x - 7 * s, bodyY + 0.5 * s, 3 * s, 1.8 * s, -0.2, ink, 0.9); // wing tips
  // neck & head
  const hx = feeding ? x + 9 * s : x + 6 * s;
  const hy = feeding ? y - 4 * s : bodyY - 20 * s;
  const neck = feeding
    ? curvePts(x + 7 * s, bodyY - 2 * s, x + 16 * s, bodyY - 6 * s, hx, hy, 10)
    : curvePts(x + 7 * s, bodyY - 2 * s, x + 14 * s, bodyY - 12 * s, hx, hy, 10);
  taperStroke(ctx, neck, 3 * s, pink, 1, [0.9, 0.6]);
  dab(ctx, hx, hy, 2.4 * s, 2 * s, 0, pink, 1);
  // bent beak
  const bd = feeding ? 1 : -1;
  taperStroke(ctx, [{ x: hx + 1.5 * s, y: hy }, { x: hx + 4 * s, y: hy + 1.5 * s * -bd * -1 }, { x: hx + 4.5 * s, y: hy + 4 * s * (feeding ? 1 : 1) }], 2 * s, P.limewhite, 1, [1, 0.3]);
  dab(ctx, hx + 4.4 * s, hy + 3.6 * s, 1 * s, 1 * s, 0, ink, 1);
}

export function egret(ctx: Ctx, x: number, y: number, s: number, haze = 0): void {
  const white = mix(P.limewhite, P.skyCream, haze * 0.5);
  const shade = mix(mix(P.limewhite, P.seafoam, 0.4), P.skyCream, haze);
  const legs = mix(P.ink, P.skyCream, haze);
  ctx.strokeStyle = withAlpha(legs, 1);
  ctx.lineWidth = Math.max(0.8, 1 * s);
  ctx.beginPath();
  ctx.moveTo(x, y - 12 * s);
  ctx.lineTo(x - 1 * s, y);
  ctx.moveTo(x + 2 * s, y - 12 * s);
  ctx.lineTo(x + 3 * s, y);
  ctx.stroke();
  dab(ctx, x + 1 * s, y - 15 * s, 6 * s, 3.6 * s, -0.4, white, 1);
  dab(ctx, x - 1 * s, y - 14 * s, 4 * s, 2 * s, -0.4, shade, 0.7);
  taperStroke(ctx, curvePts(x + 5 * s, y - 17 * s, x + 8 * s, y - 24 * s, x + 6 * s, y - 28 * s, 6), 2.2 * s, white, 1, [0.9, 0.7]);
  dab(ctx, x + 6.5 * s, y - 28.5 * s, 1.8 * s, 1.5 * s, 0, white, 1);
  taperStroke(ctx, [{ x: x + 7.5 * s, y: y - 28.5 * s }, { x: x + 12 * s, y: y - 27.5 * s }], 1.4 * s, P.haldi, 1, [1, 0.2]);
}

export function lotusPad(ctx: Ctx, rng: Rng, x: number, y: number, r: number, dark = 0): void {
  const base = mix(mix(P.tota, P.peacock, 0.25), P.neel, dark);
  const light = mix(mix(P.tota, P.haldi, 0.35), P.limewhite, 0.1);
  const pts = wobblyEllipse(rng, x, y, r, r * 0.32, 0.05, 16);
  smoothFill(ctx, pts, mix(base, P.ink, 0.25), 1);
  smoothFill(ctx, wobblyEllipse(rng, x, y - r * 0.04, r * 0.96, r * 0.29, 0.05, 16), base, 1);
  clipTo(ctx, () => smoothPath(ctx, pts, true), () => {
    dabField(ctx, rng, x - r, y - r * 0.35, r * 2, r * 0.5, { n: Math.round(r * 1.2), r: [r * 0.08, r * 0.2], colours: [light, base], alpha: [0.15, 0.35], rot: 0, rotJitter: 0.2, aspect: [0.25, 0.4] });
  });
  // notch
  ctx.fillStyle = withAlpha(mix(P.peacock, P.neel, 0.3), 0.9);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + r * 0.9, y - r * 0.08);
  ctx.lineTo(x + r * 0.9, y + r * 0.12);
  ctx.closePath();
  ctx.fill();
  // rim light
  ctx.strokeStyle = withAlpha(P.limewhite, 0.35);
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.02, r * 0.93, r * 0.27, 0, Math.PI * 1.05, Math.PI * 1.85);
  ctx.stroke();
}

export function lotusFlower(ctx: Ctx, x: number, y: number, r: number): void {
  const petal = mix(P.rani, P.limewhite, 0.45);
  const deep = mix(P.rani, P.sindoor, 0.15);
  const angles = [-1.25, -0.75, -0.3, 0.3, 0.75, 1.25, 0];
  for (const a of angles) {
    const tip = { x: x + Math.sin(a) * r * 0.9, y: y - Math.cos(a) * r * 1.1 };
    taperStroke(ctx, [{ x, y }, { x: (x + tip.x) / 2 + Math.sin(a) * r * 0.2, y: (y + tip.y) / 2 }, tip], r * 0.6, a === 0 ? petal : mix(petal, deep, Math.abs(a) * 0.4), 0.95, [0.3, 0.05]);
  }
  dab(ctx, x, y - r * 0.15, r * 0.22, r * 0.14, 0, P.haldi, 0.95);
  glow(ctx, x, y - r * 0.5, r * 1.4, P.limewhite, 0.12);
}

/** Tiny generic villager for distant scenes. Skin always warm brown (§4.3 rule 8). */
export function villager(ctx: Ctx, x: number, y: number, s: number, cloth: string, pose: 'stand' | 'bend' | 'adzeUp' | 'adzeDown' | 'carry', haze = 0): void {
  const skin = mix(rngSkin(x), P.skyCream, haze);
  const hair = mix(P.ink, P.skyCream, haze);
  const c = mix(cloth, P.skyCream, haze);
  const cShade = mix(mix(cloth, P.khondalite, 0.35), P.skyCream, haze);
  const bend = pose === 'bend' || pose === 'adzeDown' ? 0.55 : pose === 'adzeUp' ? 0.25 : 0;
  const hipY = y - 9 * s;
  // legs
  taperStroke(ctx, [{ x: x - 1.5 * s, y: hipY }, { x: x - 2.5 * s, y }], 2.4 * s, skin, 1, [1, 0.8]);
  taperStroke(ctx, [{ x: x + 1.5 * s, y: hipY }, { x: x + 2.8 * s, y }], 2.4 * s, skin, 1, [1, 0.8]);
  // dhoti / wrap
  dab(ctx, x, hipY - 0.5 * s, 3.8 * s, 3.4 * s, 0, c, 1);
  dab(ctx, x - 1 * s, hipY + 1 * s, 2.6 * s, 2.2 * s, 0, cShade, 0.6);
  // torso
  const sx = x + bend * 6 * s;
  const sy = hipY - (9 - bend * 3) * s;
  taperStroke(ctx, [{ x, y: hipY - 1 * s }, { x: (x + sx) / 2, y: (hipY + sy) / 2 - 0.5 * s }, { x: sx, y: sy }], 4.6 * s, skin, 1, [1, 0.85]);
  // head
  const hx = sx + bend * 2.5 * s;
  const hy = sy - 3.2 * s;
  dab(ctx, hx, hy, 2.6 * s, 2.8 * s, 0, skin, 1);
  dab(ctx, hx - 0.8 * s, hy - 1.3 * s, 2.4 * s, 1.7 * s, -0.3, hair, 1);
  // arms + tool
  if (pose === 'adzeUp' || pose === 'adzeDown') {
    const up = pose === 'adzeUp';
    const hand = up ? { x: sx + 1 * s, y: sy - 7 * s } : { x: sx + 6 * s, y: sy + 5 * s };
    taperStroke(ctx, [{ x: sx, y: sy + 1 * s }, hand], 1.8 * s, skin, 1, [1, 0.8]);
    const head = up ? { x: hand.x + 4 * s, y: hand.y - 3 * s } : { x: hand.x + 4.5 * s, y: hand.y + 3 * s };
    taperStroke(ctx, [hand, head], 1.2 * s, mix(P.laterite, P.chandan, 0.4), 1, [1, 1]);
    // polished stone adze blade
    dab(ctx, head.x, head.y, 1.8 * s, 1.1 * s, up ? -0.6 : 0.6, mix(P.khondalite, P.ink, 0.15), 1);
  } else if (pose === 'carry') {
    taperStroke(ctx, [{ x: sx, y: sy + 1 * s }, { x: hx + 1 * s, y: hy - 4 * s }], 1.8 * s, skin, 1, [1, 0.8]);
    dab(ctx, hx, hy - 5.5 * s, 4 * s, 2.6 * s, 0, P.laterite, 1); // pot on head
    dab(ctx, hx - 1 * s, hy - 6.5 * s, 2 * s, 1 * s, 0, P.chandan, 0.6);
  } else {
    taperStroke(ctx, [{ x: sx, y: sy + 1 * s }, { x: sx + (bend ? 4 : 1) * s, y: sy + 8 * s }], 1.8 * s, skin, 1, [1, 0.8]);
  }
}

// a range of warm browns, chosen deterministically by position
function rngSkin(x: number): string {
  const k = (Math.sin(x * 12.9898) * 43758.5453) % 1;
  return mix(P.chandan, P.laterite, 0.2 + Math.abs(k) * 0.45);
}

export const SKIN_RANGE = [FIXED.taapoi.skin, mix(P.chandan, P.laterite, 0.4), mix(P.chandan, P.laterite, 0.65)];
