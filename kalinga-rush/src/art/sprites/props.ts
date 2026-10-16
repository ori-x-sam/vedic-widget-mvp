// Hazards, collectibles, the dolphin, signboards and small FX textures.
// Hazards carry a dark rim and avoid the scene lead colour (§4.3 rule 7);
// collectibles keep their fixed colours and never use hazard colours.
import { P, FIXED, FRAME } from '../../data/palettes';
import { hexToRgb, mix, withAlpha } from '../../lib/colour';
import { Rng } from '../../lib/rng';
import { clipTo, curvePts, dab, glow, makeCanvas, paintedShape, taperStroke, type Ctx } from '../brush';
import { villager } from '../shared/nature';

const S = 2; // paint at 2× for crispness, display at 0.5×

/** Display origins (0–1) matching each frame() call below. */
export const ORIGIN = {
  reed: (v: number) => { const h = [80, 88, 92][v] ?? 80; return { x: 0.5, y: (h + 6) / (h + 14) }; },
  mud: (v: number) => { const h = v ? 40 : 38; return { x: 0.5, y: (h + 12) / (h + 22) }; },
  stakes: () => ({ x: 0.5, y: (126 + 8) / (126 + 26) }),
  cowrie: () => ({ x: 0.5, y: 0.5 }),
  leaf: () => ({ x: 0.5, y: 29 / 76 }),
  dolphin: () => ({ x: 0.5, y: 36 / 70 }),
};
const RIM = FIXED.hazardRim;

function frame(w: number, h: number, ox: number, oy: number): [HTMLCanvasElement, Ctx] {
  const [c, ctx] = makeCanvas(w * S, h * S);
  ctx.scale(S, S);
  ctx.translate(ox, oy);
  return [c, ctx];
}

// ---- Hazards: origin = bottom centre on the ride line ---------------------
export function paintReed(variant: number): HTMLCanvasElement {
  const sizes = [[54, 80], [60, 88], [64, 92]];
  const [w, h] = sizes[variant] ?? sizes[0];
  const [c, ctx] = frame(w + 16, h + 14, (w + 16) / 2, h + 6);
  const rng = new Rng(`reed:${variant}`);
  const blades: { pts: { x: number; y: number }[]; wd: number; col: string }[] = [];
  const cols = [mix(P.tota, P.neel, 0.38), mix(P.tota, P.ink, 0.25), mix(P.tota, P.neel, 0.2), mix(P.tota, P.haldi, 0.18)];
  const n = 17 + variant * 2;
  for (let i = 0; i < n; i++) {
    const bx = rng.range(-w * 0.28, w * 0.28);
    const lean = (bx / w) * 1.4 + rng.range(-0.25, 0.25);
    const hh = h * rng.range(0.62, 1);
    const tip = { x: bx + lean * hh * 0.55, y: -hh };
    blades.push({ pts: curvePts(bx, 2, bx + lean * hh * 0.1, -hh * 0.55, tip.x, tip.y, 9), wd: rng.range(3.4, 5.2), col: rng.pick(cols) });
  }
  // rim pass, then colour pass
  for (const b of blades) taperStroke(ctx, b.pts, b.wd + 3, RIM, 1, [1, 0.25]);
  for (const b of blades) taperStroke(ctx, b.pts, b.wd, b.col, 1, [1, 0.02]);
  // sunlit edges and ochre tips
  for (const b of blades) {
    const k = Math.floor(b.pts.length * 0.45);
    taperStroke(ctx, b.pts.slice(k).map((p) => ({ x: p.x + 0.8, y: p.y })), b.wd * 0.4, mix(P.haldi, P.tota, 0.45), 0.7, [0.3, 0.05]);
  }
  // cattails (laterite brown, rimmed)
  for (let i = 0; i < 2 + variant; i++) {
    const x = rng.range(-w * 0.2, w * 0.2);
    const top = -h * rng.range(0.85, 1.02);
    taperStroke(ctx, [{ x, y: 0 }, { x: x + 2, y: top }], 3.6, RIM, 1, [1, 1]);
    taperStroke(ctx, [{ x, y: 0 }, { x: x + 2, y: top }], 1.8, mix(P.tota, P.ink, 0.3), 1, [1, 1]);
    dab(ctx, x + 2, top + 9, 4.6, 9.6, 0.04, RIM, 1);
    dab(ctx, x + 2, top + 9, 3.2, 8.2, 0.04, mix(P.laterite, P.ink, 0.35), 1);
    dab(ctx, x + 3, top + 6, 1, 4, 0.04, mix(P.laterite, P.chandan, 0.4), 0.8);
  }
  return c;
}

export function paintMud(variant: number): HTMLCanvasElement {
  const w = variant ? 120 : 116, h = variant ? 40 : 38;
  const [c, ctx] = frame(w + 20, h + 22, (w + 20) / 2, h + 12);
  const rng = new Rng(`mud:${variant}`);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 6);
    ctx.bezierCurveTo(-w * 0.42, -h * 0.55, -w * 0.18, -h, 0, -h);
    ctx.bezierCurveTo(w * 0.2, -h, w * 0.42, -h * 0.6, w / 2, 6);
    ctx.closePath();
  };
  paintedShape(ctx, rng, path, { x: -w / 2, y: -h, w, h: h + 6 }, {
    base: mix(P.laterite, P.khondalite, 0.45), light: mix(P.laterite, P.chandan, 0.55), shade: mix(P.khondalite, P.ink, 0.45), rim: RIM, rimW: 3.2, lightFrom: 'top',
  });
  clipTo(ctx, path, () => {
    // wet sheen and cracks
    for (let i = 0; i < 7; i++) {
      const x = rng.range(-w * 0.35, w * 0.3);
      taperStroke(ctx, [{ x, y: -h * rng.range(0.45, 0.8) }, { x: x + rng.range(10, 22), y: -h * rng.range(0.45, 0.8) }], 2, P.limewhite, 0.3);
    }
    for (let i = 0; i < 5; i++) {
      const x = rng.range(-w * 0.3, w * 0.3), y = -h * rng.range(0.2, 0.5);
      taperStroke(ctx, [{ x, y }, { x: x + rng.range(-6, 6), y: y + 6 }, { x: x + rng.range(-8, 8), y: y + 12 }], 1.2, mix(P.khondalite, P.ink, 0.6), 0.6);
    }
  });
  // grass tufts on top
  for (let i = 0; i < 4; i++) {
    const x = rng.range(-w * 0.3, w * 0.28);
    const y = -h * 0.9 + Math.abs(x) * 0.25;
    for (let j = 0; j < 5; j++) {
      const a = -Math.PI / 2 + rng.range(-0.6, 0.6);
      const l = rng.range(6, 12);
      const pts = [{ x, y }, { x: x + Math.cos(a) * l, y: y + Math.sin(a) * l }];
      taperStroke(ctx, pts, 3.4, RIM, 1, [1, 0.3]);
      taperStroke(ctx, pts, 1.8, mix(P.tota, P.haldi, 0.25), 1, [1, 0.1]);
    }
  }
  if (variant === 1) {
    // a little crab
    const cx = w * 0.16, cy = -h * 0.82;
    dab(ctx, cx, cy, 6.4, 4.4, 0, RIM, 1);
    dab(ctx, cx, cy, 5, 3.2, 0, P.sindoor, 1);
    for (const sx of [-1, 1]) {
      taperStroke(ctx, [{ x: cx + sx * 4, y: cy - 1 }, { x: cx + sx * 8, y: cy - 6 }], 2, P.sindoor, 1, [1, 1]);
      dab(ctx, cx + sx * 8.5, cy - 7, 2, 1.6, 0, P.sindoor, 1);
    }
    dab(ctx, cx - 1.6, cy - 3.6, 0.9, 0.9, 0, P.ink, 1);
    dab(ctx, cx + 1.6, cy - 3.6, 0.9, 0.9, 0, P.ink, 1);
  }
  return c;
}

export function paintStakes(): HTMLCanvasElement {
  const w = 60, h = 126;
  const [c, ctx] = frame(w + 30, h + 26, (w + 30) / 2, h + 8);
  const rng = new Rng('stakes');
  const bamboo = mix(P.haldi, P.laterite, 0.42);
  const bambooLight = mix(P.haldi, P.limewhite, 0.25);
  const bambooDark = mix(P.laterite, P.ink, 0.3);
  const poles = [{ x: -19, top: -118, lean: -0.05 }, { x: 1, top: -126, lean: 0.02 }, { x: 20, top: -110, lean: 0.06 }];
  const net = mix(P.limewhite, P.skyCream, 0.2);
  // net hangs behind the front pole
  ctx.strokeStyle = withAlpha(RIM, 0.65);
  ctx.lineWidth = 2.4;
  const meshPaths: { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    meshPaths.push({ x0: -18 + t * 37, y0: -100 + t * 2, cx: -16 + t * 34, cy: -60, x1: -15 + t * 31, y1: -28 - Math.sin(t * Math.PI) * 6 });
  }
  for (let j = 0; j < 5; j++) {
    const y = -94 + j * 14;
    meshPaths.push({ x0: -18, y0: y, cx: 0, cy: y + 7, x1: 20, y1: y + 2 });
  }
  for (const m of meshPaths) { ctx.beginPath(); ctx.moveTo(m.x0, m.y0); ctx.quadraticCurveTo(m.cx, m.cy, m.x1, m.y1); ctx.stroke(); }
  ctx.strokeStyle = withAlpha(net, 0.9);
  ctx.lineWidth = 1.1;
  for (const m of meshPaths) { ctx.beginPath(); ctx.moveTo(m.x0, m.y0); ctx.quadraticCurveTo(m.cx, m.cy, m.x1, m.y1); ctx.stroke(); }
  // poles
  for (const p of poles) {
    const top = { x: p.x + p.lean * -p.top, y: p.top };
    taperStroke(ctx, [{ x: p.x, y: 4 }, top], 9.6, RIM, 1, [1, 1]);
    taperStroke(ctx, [{ x: p.x, y: 4 }, top], 6.2, bamboo, 1, [1, 1]);
    taperStroke(ctx, [{ x: p.x + 1.2, y: 4 }, { x: top.x + 1.2, y: top.y + 2 }], 2, bambooLight, 0.8, [1, 1]);
    // nodes
    for (let y = -14; y > p.top + 6; y -= rng.range(18, 24)) {
      const t = y / p.top;
      const nx = p.x + (top.x - p.x) * t;
      taperStroke(ctx, [{ x: nx - 3.6, y }, { x: nx + 3.6, y: y - 0.6 }], 2, bambooDark, 1, [1, 1]);
    }
    dab(ctx, top.x, top.y, 3.6, 1.6, 0, bambooDark, 1);
  }
  // cross tie
  taperStroke(ctx, [{ x: -22, y: -100 }, { x: 24, y: -97 }], 5.4, RIM, 1, [1, 1]);
  taperStroke(ctx, [{ x: -22, y: -100 }, { x: 24, y: -97 }], 2.8, bamboo, 1, [1, 1]);
  // a sindoor marker rag on the tallest pole
  const fx = 1 + 0.02 * 126, fy = -122;
  ctx.fillStyle = RIM;
  ctx.beginPath(); ctx.moveTo(fx, fy - 2); ctx.lineTo(fx + 19, fy + 3); ctx.lineTo(fx + 15, fy + 8); ctx.lineTo(fx + 20, fy + 13); ctx.lineTo(fx, fy + 13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.sindoor;
  ctx.beginPath(); ctx.moveTo(fx + 1, fy); ctx.lineTo(fx + 16, fy + 4); ctx.lineTo(fx + 12, fy + 7.5); ctx.lineTo(fx + 16, fy + 11); ctx.lineTo(fx + 1, fy + 11); ctx.closePath(); ctx.fill();
  return c;
}

// ---- Collectibles ----------------------------------------------------------
/** Cowrie shell (ventral view: the toothed slit that everyone recognises). Centre origin. */
export function paintCowrie(): HTMLCanvasElement {
  const C = FIXED.cowrie;
  const [c, ctx] = frame(34, 28, 17, 14);
  ctx.fillStyle = withAlpha(mix(C.shade, P.khondalite, 0.4), 1);
  ctx.beginPath();
  ctx.ellipse(0, 0.6, 14.6, 11.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.shell;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13.4, 10.2, 0, 0, Math.PI * 2);
  ctx.fill();
  clipTo(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 13.4, 10.2, 0, 0, Math.PI * 2); }, () => {
    const g = ctx.createLinearGradient(0, -10, 0, 10);
    g.addColorStop(0, withAlpha(P.limewhite, 0));
    g.addColorStop(0.6, withAlpha(C.shade, 0.25));
    g.addColorStop(1, withAlpha(C.shade, 0.9));
    ctx.fillStyle = g;
    ctx.fillRect(-15, -12, 30, 24);
  });
  // the slit with its little teeth
  ctx.strokeStyle = C.mouth;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-10, 0.6);
  ctx.bezierCurveTo(-4, -1.4, 4, 2.4, 10, 0.2);
  ctx.stroke();
  ctx.lineWidth = 1.1;
  for (let i = -4; i <= 4; i++) {
    const x = i * 2.1;
    const y = 0.5 + Math.sin(i * 0.6) * 0.6;
    ctx.beginPath(); ctx.moveTo(x, y - 2.6); ctx.lineTo(x, y + 2.6); ctx.stroke();
  }
  dab(ctx, -5, -5.6, 4.4, 1.8, -0.2, P.limewhite, 0.95);
  dab(ctx, -6, -5.8, 1.6, 0.9, -0.2, P.limewhite, 1);
  return c;
}

/** Palm-leaf record (talapatra page) with a sindoor string. Centre origin. */
export function paintRecordLeaf(): HTMLCanvasElement {
  const R = FIXED.record;
  const w = 104, h = 30;
  const [c, ctx] = frame(w + 40, h + 46, (w + 40) / 2, (h + 20) / 2 + 4);
  const rng = new Rng('leaf');
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2 + 3);
    ctx.quadraticCurveTo(0, -h / 2 - 3, w / 2, -h / 2 + 2);
    ctx.quadraticCurveTo(w / 2 + 5, 0, w / 2, h / 2 - 2);
    ctx.quadraticCurveTo(0, h / 2 + 2, -w / 2, h / 2 - 1);
    ctx.quadraticCurveTo(-w / 2 - 5, 0, -w / 2, -h / 2 + 3);
    ctx.closePath();
  };
  ctx.save();
  path();
  ctx.strokeStyle = R.script;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  path();
  ctx.fillStyle = R.leaf;
  ctx.fill();
  clipTo(ctx, path, () => {
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, withAlpha(P.limewhite, 0.45));
    g.addColorStop(0.35, withAlpha(R.leaf, 0));
    g.addColorStop(1, withAlpha(R.leafShade, 0.75));
    ctx.fillStyle = g;
    ctx.fillRect(-w / 2 - 6, -h / 2 - 4, w + 12, h + 8);
    // fibre lines
    for (let i = 0; i < 9; i++) {
      const y = -h / 2 + 3 + i * 3.1;
      taperStroke(ctx, [{ x: -w / 2, y }, { x: w / 2, y: y + 0.4 }], 0.6, R.leafShade, 0.35, [1, 1]);
    }
    // incised "script" — decorative loops, not real letters
    ctx.strokeStyle = withAlpha(R.script, 0.85);
    ctx.lineWidth = 1.1;
    for (let row = 0; row < 3; row++) {
      const y = -7 + row * 7;
      let x = -w / 2 + 22;
      while (x < w / 2 - 8) {
        const k = rng.int(0, 2);
        ctx.beginPath();
        if (k === 0) { ctx.arc(x + 2, y, 2.2, Math.PI * 0.9, Math.PI * 2.3); }
        else if (k === 1) { ctx.moveTo(x, y + 2); ctx.quadraticCurveTo(x + 2, y - 4, x + 4, y + 2); }
        else { ctx.arc(x + 2, y + 0.5, 1.8, 0, Math.PI * 2); ctx.moveTo(x + 3.8, y - 2.5); ctx.lineTo(x + 5, y - 3.6); }
        ctx.stroke();
        x += rng.range(5, 7.5) + (rng.chance(0.18) ? 4 : 0);
      }
    }
  });
  // string hole + sindoor string tied in a loop that hangs below
  const hx = -w / 2 + 12;
  dab(ctx, hx, 0, 3, 3, 0, R.script, 1);
  dab(ctx, hx, 0, 1.6, 1.6, 0, R.leafShade, 1);
  taperStroke(ctx, curvePts(hx, 0, hx - 12, 18, hx + 6, 24, 10), 4, mix(R.string, P.ink, 0.4), 1, [1, 1]);
  taperStroke(ctx, curvePts(hx, 0, hx - 12, 18, hx + 6, 24, 10), 2.4, R.string, 1, [1, 1]);
  taperStroke(ctx, curvePts(hx, 0, hx + 10, 14, hx + 6, 24, 10), 2.4, R.string, 1, [1, 1]);
  dab(ctx, hx + 6, 25, 2.8, 2.4, 0, R.string, 1);
  return c;
}

/** Irrawaddy dolphin: blunt rounded head, no beak, small dorsal fin. Faces left. Centre origin. */
export function paintDolphin(): HTMLCanvasElement {
  const [c, ctx] = frame(140, 70, 70, 36);
  const rng = new Rng('dolphin');
  const slate = mix(mix(P.khondalite, P.neel, 0.28), P.seafoam, 0.18);
  const belly = mix(P.limewhite, P.seafoam, 0.35);
  const dark = mix(slate, P.ink, 0.35);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-58, 2);
    ctx.bezierCurveTo(-60, -14, -40, -20, -16, -18);
    ctx.bezierCurveTo(12, -16, 34, -10, 50, -3);
    ctx.lineTo(54, -1);
    ctx.bezierCurveTo(36, 6, 10, 14, -20, 14);
    ctx.bezierCurveTo(-44, 14, -57, 10, -58, 2);
    ctx.closePath();
  };
  // flukes
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(48, -2); ctx.quadraticCurveTo(62, -16, 68, -14); ctx.quadraticCurveTo(62, -4, 58, 0); ctx.quadraticCurveTo(64, 6, 68, 14); ctx.quadraticCurveTo(60, 12, 48, 1); ctx.closePath();
  ctx.fill();
  // dorsal fin (small, rounded, set back)
  ctx.beginPath();
  ctx.moveTo(4, -16); ctx.quadraticCurveTo(14, -30, 22, -27); ctx.quadraticCurveTo(18, -20, 22, -13); ctx.closePath();
  ctx.fill();
  paintedShape(ctx, rng, body, { x: -60, y: -20, w: 116, h: 36 }, { base: slate, light: mix(slate, P.limewhite, 0.35), shade: dark, rim: mix(P.neel, P.ink, 0.5), rimW: 1.6 });
  clipTo(ctx, body, () => {
    ctx.fillStyle = withAlpha(belly, 0.85);
    ctx.beginPath();
    ctx.ellipse(-16, 12, 40, 7, -0.05, 0, Math.PI * 2);
    ctx.fill();
  });
  // flipper
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(-30, 6); ctx.quadraticCurveTo(-22, 20, -16, 20); ctx.quadraticCurveTo(-18, 10, -22, 5); ctx.closePath(); ctx.fill();
  // friendly face
  dab(ctx, -44, -4, 2.2, 2.2, 0, P.ink, 1);
  dab(ctx, -44.6, -4.8, 0.7, 0.7, 0, P.limewhite, 1);
  taperStroke(ctx, [{ x: -57, y: 3 }, { x: -50, y: 5 }, { x: -42, y: 3 }], 1.2, dark, 1);
  dab(ctx, -30, -14, 10, 3, -0.1, P.limewhite, 0.3);
  return c;
}

// ---- Signboard --------------------------------------------------------------
const tracked = (ctx: Ctx, text: string, x: number, y: number, tracking: number) => {
  // manual tracking (canvas letterSpacing isn't everywhere yet); centred on x
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (text.length - 1);
  let cx = x - total / 2;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + tracking;
  });
  return total;
};

/** Hanging board on two bamboo posts. Origin = bottom centre (posts' feet). */
export function paintSignboard(date: string, title: string): HTMLCanvasElement {
  const W = 300, H = 190;
  const [c, ctx] = frame(W + 20, H + 16, (W + 20) / 2, H + 6);
  const rng = new Rng(`sign:${title}`);
  const bamboo = mix(P.haldi, P.laterite, 0.5);
  const post = (x: number) => {
    taperStroke(ctx, [{ x, y: 4 }, { x: x + 1, y: -H }], 9, FRAME.frameEdge, 1, [1, 1]);
    taperStroke(ctx, [{ x, y: 4 }, { x: x + 1, y: -H }], 6, bamboo, 1, [1, 1]);
    for (let y = -20; y > -H + 10; y -= 26) taperStroke(ctx, [{ x: x - 3.5, y }, { x: x + 3.5, y }], 1.8, mix(P.laterite, P.ink, 0.35), 1, [1, 1]);
  };
  post(-118);
  post(118);
  taperStroke(ctx, [{ x: -130, y: -H + 6 }, { x: 130, y: -H + 4 }], 8, FRAME.frameEdge, 1, [1, 1]);
  taperStroke(ctx, [{ x: -130, y: -H + 6 }, { x: 130, y: -H + 4 }], 5, bamboo, 1, [1, 1]);
  // ropes
  const bw = 236, bh = 76, by = -H + 34;
  ctx.strokeStyle = mix(P.chandan, P.khondalite, 0.35);
  ctx.lineWidth = 1.8;
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sx * (bw / 2 - 18), -H + 6); ctx.lineTo(sx * (bw / 2 - 22), by); ctx.stroke();
  }
  // board shadow, board
  ctx.fillStyle = withAlpha(P.ink, 0.25);
  ctx.fillRect(-bw / 2 + 4, by + 5, bw, bh);
  ctx.fillStyle = FRAME.frameEdge;
  ctx.fillRect(-bw / 2 - 3, by - 3, bw + 6, bh + 6);
  ctx.fillStyle = FRAME.frame;
  ctx.fillRect(-bw / 2, by, bw, bh);
  // wood grain
  for (let i = 0; i < 18; i++) {
    const y = by + rng.range(3, bh - 3);
    taperStroke(ctx, [{ x: -bw / 2 + rng.range(0, 60), y }, { x: bw / 2 - rng.range(0, 60), y: y + rng.range(-1, 1) }], rng.range(0.6, 1.4), FRAME.frameEdge, 0.35);
  }
  ctx.strokeStyle = withAlpha(FRAME.gold, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeRect(-bw / 2 + 6, by + 6, bw - 12, bh - 12);
  // text: tracked gold date, cream title
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = FRAME.gold;
  ctx.font = '700 13px "Inter Tight", "Arial Narrow", sans-serif';
  tracked(ctx, date.toUpperCase().replace(/^C\. /, 'c. '), 0, by + 28, 3.4);
  ctx.fillStyle = FRAME.cream;
  ctx.font = '900 27px "Inter Tight", "Arial Narrow", sans-serif';
  let size = 27;
  while (size > 16) {
    ctx.font = `900 ${size}px "Inter Tight", "Arial Narrow", sans-serif`;
    const width = [...title.toUpperCase()].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + 0.6 * title.length;
    if (width < bw - 30) break;
    size -= 1;
  }
  tracked(ctx, title.toUpperCase(), 0, by + 60, 0.6);
  return c;
}

// ---- Mid-ground worker (two frames of the adze swing) ----------------------
export function paintWorker(frameIdx: 0 | 1, cloth: string): HTMLCanvasElement {
  const [c, ctx] = frame(40, 40, 20, 36);
  villager(ctx, 0, 0, 1.2, cloth, frameIdx === 0 ? 'adzeUp' : 'adzeDown');
  return c;
}

// ---- FX textures -------------------------------------------------------------
export function paintSoftDot(colour: string, r = 16): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(r * 2, r * 2);
  glow(ctx, r, r, r, colour, 1, 2.2);
  return c;
}

export function paintSparkle(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(48, 48);
  glow(ctx, 24, 24, 22, P.haldi, 0.55);
  ctx.fillStyle = P.limewhite;
  ctx.beginPath();
  ctx.moveTo(24, 4); ctx.quadraticCurveTo(26, 22, 44, 24); ctx.quadraticCurveTo(26, 26, 24, 44); ctx.quadraticCurveTo(22, 26, 4, 24); ctx.quadraticCurveTo(22, 22, 24, 4);
  ctx.fill();
  return c;
}

export function paintPuff(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(64, 64);
  const rng = new Rng('puff');
  for (let i = 0; i < 7; i++) glow(ctx, 32 + rng.range(-10, 10), 32 + rng.range(-10, 10), rng.range(12, 20), mix(P.limewhite, P.khondalite, 0.25), 0.55, 1.6);
  return c;
}

/** Paper/film grain: light and dark specks with a few fibres (§4.3 rule 5). */
export function paintGrain(size = 256): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const rng = new Rng('grain');
  const img = ctx.createImageData(size, size);
  const light = [P.limewhite, P.skyCream].map(hexToRgb);
  const dark = [FRAME.frameEdge, P.ink].map(hexToRgb);
  for (let i = 0; i < size * size; i++) {
    const r = rng.next();
    const o = i * 4;
    if (r < 0.1) {
      const col = rng.pick(dark);
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2];
      img.data[o + 3] = Math.round(rng.range(20, 60));
    } else if (r < 0.2) {
      const col = rng.pick(light);
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2];
      img.data[o + 3] = Math.round(rng.range(18, 50));
    }
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 26; i++) {
    const x = rng.next() * size, y = rng.next() * size, a = rng.next() * Math.PI, l = rng.range(4, 14);
    taperStroke(ctx, [{ x, y }, { x: x + Math.cos(a) * l, y: y + Math.sin(a) * l }], 0.8, rng.chance(0.5) ? P.limewhite : FRAME.frameEdge, 0.18);
  }
  return c;
}

export function paintVignette(w: number, h: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.46, h * 0.32, w / 2, h / 2, Math.hypot(w, h) * 0.56);
  g.addColorStop(0, withAlpha(FRAME.frameEdge, 0));
  g.addColorStop(0.7, withAlpha(FRAME.frameEdge, 0.1));
  g.addColorStop(1, withAlpha(FRAME.frameEdge, 0.42));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return c;
}

