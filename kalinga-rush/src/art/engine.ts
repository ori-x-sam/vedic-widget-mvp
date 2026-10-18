// Scene engine: turns a compact SceneDef (sky, far ranges, ground, strip
// painters, one-off landmarks and story vignettes) into the baked parallax
// layers of a record. Record 01 keeps its hand-built painter (r01.ts); every
// other record is composed here from the shared kit.
import { GAME_W } from '../config';
import { P } from '../data/palettes';
import { hexToRgb, mix, rgbToHex, withAlpha } from '../lib/colour';
import { Rng, periodicFbm } from '../lib/rng';
import { clipTo, curvePts, dab, dabField, glow, halftone, makeCanvas, taperStroke, vGradient, wrapped, type Ctx } from './brush';
import { DEPTH, type DecorSpec, type LayerSpec, type SceneArt } from './layers';
import { broadTree, cloud, coconutPalm, lotusFlower, lotusPad, palmyraPalm, reedTuft } from './shared/nature';

export const TW = 2048;
export const LANE = 598;

export type Painter = (ctx: Ctx, rng: Rng, W: number) => void;

export interface SkyDef {
  stops: [number, string][];
  sun?: { x: number; y: number; r: number; colour?: string; rays?: boolean };
  moon?: { x: number; y: number; r: number };
  stars?: number;
  halftone?: string;
  clouds?: 'cumulus' | 'storm' | 'streak' | 'night' | 'none';
  cloudTint?: string;
}

export interface FarDef { kind: 'hills' | 'sea' | 'none'; a: string; b?: string; height?: [number, number]; base?: number; trees?: boolean; haze?: number }

export interface GroundDef {
  kind: 'land' | 'water' | 'sea' | 'air' | 'orbit';
  /** land: plain behind the lane, path surface, verge. water/sea: water ramp. */
  plain?: string;
  plainDetail?: 'fields' | 'grass' | 'sand' | 'paving' | 'blueprint' | 'chart' | 'dry' | 'none';
  path?: string;
  verge?: string;
  water?: { sky: string; light: string; mid: string; deep: string };
}

export interface Landmark {
  /** Fraction of the record (0–1) at which it is centred on screen. */
  at: number;
  plane: 'far' | 'mid' | 'near';
  w: number;
  h: number;
  /** Paint with the base centre at (w/2, h). */
  paint: (ctx: Ctx, rng: Rng, w: number, h: number) => void;
  /** Baseline on screen (defaults per plane). */
  y?: number;
}

export interface SceneDef {
  id: string;
  sky: SkyDef;
  far: FarDef[];
  ground: GroundDef;
  mid?: Painter;
  near?: Painter;
  fore?: 'lotus' | 'grass' | 'flowers' | 'stones' | 'none' | Painter;
  landmarks?: Landmark[];
  rain?: boolean;
  /** Bake-time toning: 'faded indigo + sepia' duotone, near-monochrome, etc. */
  tone?: { amount: number; dark: string; light: string };
  /** Act IV → colour: also bake an un-toned copy to fade in. */
  flood?: boolean;
  sign?: { date: string; title: string; at?: number };
}

const PLANE = { far: { p: 0.12, y: 452, depth: DEPTH.far + 0.5 }, mid: { p: 0.3, y: 456, depth: DEPTH.mid + 0.5 }, near: { p: 0.55, y: 560, depth: DEPTH.near + 0.5 } };

// ---- sky ---------------------------------------------------------------------
function paintSky(rng: Rng, s: SkyDef, H: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(GAME_W, H);
  vGradient(ctx, 0, 0, GAME_W, H, s.stops.map(([o, col]) => [o, col, 1] as [number, string, number]));
  if (s.sun) glow(ctx, s.sun.x, s.sun.y, 380, s.sun.colour ?? P.haldi, 0.22);
  dabField(ctx, rng, -60, -20, GAME_W + 120, H, { n: 150, r: [40, 130], colours: s.stops.map((x) => x[1]), alpha: [0.04, 0.1], aspect: [0.16, 0.32], rot: 0, rotJitter: 0.06 });
  if (s.sun?.rays) {
    ctx.save();
    ctx.translate(s.sun.x, s.sun.y);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.1;
      const len = i % 2 ? 230 : 330;
      ctx.fillStyle = withAlpha(s.sun.colour ?? P.haldi, i % 2 ? 0.05 : 0.075);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.05) * 60, Math.sin(a - 0.05) * 60);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.lineTo(Math.cos(a + 0.05) * 60, Math.sin(a + 0.05) * 60);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  if (s.stars) for (let i = 0; i < s.stars; i++) {
    const x = rng.next() * GAME_W, y = rng.next() * H * 0.75;
    const r = rng.range(0.6, 1.8);
    dab(ctx, x, y, r, r, 0, rng.chance(0.7) ? P.haldi : P.limewhite, rng.range(0.5, 1));
    if (r > 1.5) glow(ctx, x, y, 6, P.haldi, 0.3);
  }
  halftone(ctx, 0, 0, GAME_W, H, 7, s.halftone ?? mix(P.peacock, P.seafoam, 0.55), 0.06, (_x, y) => Math.pow(1 - y / H, 1.6));
  return c;
}

function paintSunLayer(s: SkyDef): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(GAME_W, 300);
  if (s.sun) {
    const { x, y, r } = s.sun;
    const col = s.sun.colour ?? P.haldi;
    glow(ctx, x, y, r * 2.6, col, 0.32);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    glow(ctx, x - r * 0.3, y - r * 0.3, r * 0.9, P.limewhite, 0.45);
    ctx.strokeStyle = withAlpha(P.marigold, 0.45);
    ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.arc(x + 2, y + 3, r * 0.95, 0, Math.PI * 2); ctx.stroke();
  }
  if (s.moon) {
    const { x, y, r } = s.moon;
    glow(ctx, x, y, r * 3.2, P.limewhite, 0.22);
    ctx.fillStyle = mix(P.limewhite, P.haldi, 0.15);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 5; i++) dab(ctx, x - r * 0.4 + i * r * 0.2, y - r * 0.2 + (i % 2) * r * 0.4, r * 0.12, r * 0.1, 0, mix(P.limewhite, P.khondalite, 0.25), 0.5);
  }
  return c;
}

function paintClouds(rng: Rng, kind: SkyDef['clouds'], tint?: string): HTMLCanvasElement {
  const H = 330;
  const [c, ctx] = makeCanvas(TW, H);
  if (kind === 'none') return c;
  if (kind === 'streak') {
    for (let i = 0; i < 16; i++) {
      const sx = rng.range(0, TW), sy = rng.range(20, 200);
      wrapped(TW, sx, 200, (xx) => taperStroke(ctx, curvePts(xx - 190, sy, xx, sy - 8, xx + 190, sy + 2, 10), rng.range(5, 12), tint ?? P.limewhite, 0.4, [0.05, 0.05]));
    }
    return c;
  }
  let x = 100;
  while (x < TW - 60) {
    const w = rng.range(200, 430);
    const h = rng.range(55, 105);
    const y = rng.range(150, 225);
    wrapped(TW, x, w / 2 + h, (xx) => cloud(ctx, rng.fork(x), xx, y, w, h));
    x += w * rng.range(0.9, 1.5);
  }
  if (kind === 'storm' || kind === 'night') {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = withAlpha(tint ?? mix(P.neel, P.khondalite, 0.5), kind === 'storm' ? 0.62 : 0.72);
    ctx.fillRect(0, 0, TW, H);
    ctx.globalCompositeOperation = 'source-over';
  } else if (tint) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = withAlpha(tint, 0.25);
    ctx.fillRect(0, 0, TW, H);
    ctx.globalCompositeOperation = 'source-over';
  }
  // Soft fade at the bottom edge so tiles never show a flat cut.
  ctx.globalCompositeOperation = 'destination-out';
  const fade = ctx.createLinearGradient(0, H - 90, 0, H);
  fade.addColorStop(0, withAlpha(P.ink, 0));
  fade.addColorStop(1, withAlpha(P.ink, 1));
  ctx.fillStyle = fade;
  ctx.fillRect(0, H - 90, TW, 90);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function paintFar(rng: Rng, f: FarDef): HTMLCanvasElement {
  const H = 200;
  const base = f.base ?? 182;
  const [c, ctx] = makeCanvas(TW, H);
  if (f.kind === 'sea') {
    vGradient(ctx, 0, base - 30, TW, H - base + 30, [[0, f.a, 0], [0.3, f.a, 1], [1, f.b ?? f.a, 1]]);
    for (let i = 0; i < 260; i++) {
      const x = rng.next() * TW, y = base - 10 + rng.next() * (H - base + 10);
      taperStroke(ctx, [{ x: x - 8, y }, { x: x + 8, y }], 1.2, rng.chance(0.6) ? P.limewhite : mix(f.a, P.neel, 0.3), 0.35);
    }
    return c;
  }
  const [h0, h1] = f.height ?? [40, 110];
  const fn = periodicFbm(rng, TW, 420, 4);
  const top = (x: number) => base - (h0 + (h1 - h0) * (fn(x) * 0.5 + 0.5));
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= TW; x += 4) ctx.lineTo(x, top(x));
    ctx.lineTo(TW, H);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = f.a;
  ctx.fill();
  clipTo(ctx, path, () => {
    dabField(ctx, rng, 0, base - h1, TW, H, { n: 900, r: [3, 8], colours: [mix(f.a, P.limewhite, 0.2), mix(f.a, f.b ?? P.neel, 0.3)], alpha: [0.1, 0.25] });
    if (f.trees) for (let i = 0; i < 1200; i++) {
      const x = rng.next() * TW;
      dab(ctx, x, top(x) + rng.range(-2, 30), rng.range(2, 5), rng.range(1.6, 3.4), rng.next(), rng.chance(0.35) ? mix(f.a, P.haldi, 0.3) : mix(f.a, P.neel, 0.2), 0.45);
    }
  });
  vGradient(ctx, 0, base - 40, TW, 60, [[0, P.skyCream, 0], [1, P.skyCream, (f.haze ?? 0.4)]]);
  return c;
}

// ---- ground ----------------------------------------------------------------------
function paintPlain(rng: Rng, g: GroundDef): HTMLCanvasElement {
  const H = 170;
  const [c, ctx] = makeCanvas(TW, H);
  const col = g.plain ?? mix(P.tota, P.haldi, 0.25);
  vGradient(ctx, 0, 0, TW, H, [[0, mix(col, P.skyCream, 0.35), 1], [0.45, col, 1], [1, mix(col, P.laterite, 0.3), 1]]);
  switch (g.plainDetail) {
    case 'fields':
      for (let y = 10; y < H; y += 9 + y * 0.06) for (let x = 0; x < TW; x += rng.range(30, 70)) {
        wrapped(TW, x, 40, (xx) => taperStroke(ctx, [{ x: xx, y }, { x: xx + rng.range(20, 50), y: y + 0.5 }], 1.2 + y * 0.02, rng.chance(0.5) ? mix(col, P.tota, 0.4) : mix(col, P.haldi, 0.3), 0.6));
      }
      break;
    case 'sand':
      dabField(ctx, rng, 0, 0, TW, H, { n: 1400, r: [1, 3], colours: [P.limewhite, mix(col, P.laterite, 0.3)], alpha: [0.15, 0.4] });
      break;
    case 'paving':
      for (let y = 6; y < H; y += 10 + y * 0.08) {
        ctx.fillStyle = withAlpha(mix(col, P.ink, 0.3), 0.25);
        ctx.fillRect(0, y, TW, 1);
        for (let x = (y * 7) % 40; x < TW; x += 30 + y * 0.4) ctx.fillRect(x, y - 10 - y * 0.08, 1, 10 + y * 0.08);
      }
      break;
    case 'blueprint':
      ctx.strokeStyle = withAlpha(P.limewhite, 0.25);
      ctx.lineWidth = 1;
      for (let x = 0; x < TW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TW, y); ctx.stroke(); }
      break;
    case 'chart':
      for (let y = 8; y < H; y += 18) { ctx.fillStyle = withAlpha(P.neel, 0.12); ctx.fillRect(0, y, TW, 1); }
      break;
    case 'dry':
      for (let i = 0; i < 260; i++) {
        const x = rng.next() * TW, y = rng.next() * H;
        taperStroke(ctx, curvePts(x, y, x + rng.range(-10, 10), y + 4, x + rng.range(-16, 16), y + rng.range(-3, 3), 4), 1, mix(col, P.ink, 0.35), 0.45);
      }
      break;
    case 'grass':
    default:
      for (let i = 0; i < 900; i++) {
        const x = rng.next() * TW, y = rng.next() * H;
        taperStroke(ctx, [{ x, y }, { x: x + rng.range(-2, 2), y: y - 3 - y * 0.05 }], 1 + y * 0.01, rng.chance(0.5) ? mix(col, P.tota, 0.45) : mix(col, P.haldi, 0.35), 0.5);
      }
  }
  return c;
}

function paintTrack(rng: Rng, g: GroundDef): HTMLCanvasElement {
  const H = 150;
  const top = 14; // lane sits at local y = top
  const [c, ctx] = makeCanvas(TW, H);
  const path = g.path ?? mix(P.laterite, P.chandan, 0.3);
  const verge = g.verge ?? mix(P.tota, P.laterite, 0.25);
  vGradient(ctx, 0, 0, TW, top + 2, [[0, path, 0], [1, path, 0.9]]);
  ctx.fillStyle = path;
  ctx.fillRect(0, top, TW, 52);
  vGradient(ctx, 0, top, TW, 52, [[0, P.limewhite, 0.18], [0.3, path, 0], [1, mix(path, P.ink, 0.3), 0.45]]);
  dabField(ctx, rng, 0, top, TW, 52, { n: 1100, r: [1, 3.4], colours: [mix(path, P.limewhite, 0.3), mix(path, P.ink, 0.3), path], alpha: [0.2, 0.5], aspect: [0.3, 0.6], rot: 0, rotJitter: 0.3 });
  // a lit edge line on the lane
  for (let i = 0; i < 120; i++) {
    const x = rng.next() * TW;
    wrapped(TW, x, 30, (xx) => taperStroke(ctx, [{ x: xx - 14, y: top + 1 }, { x: xx + 14, y: top + 1 }], 1.6, mix(path, P.limewhite, 0.5), 0.5));
  }
  ctx.fillStyle = verge;
  ctx.fillRect(0, top + 52, TW, H - top - 52);
  vGradient(ctx, 0, top + 52, TW, H - top - 52, [[0, mix(verge, P.ink, 0.3), 0.5], [1, mix(verge, P.ink, 0.45), 0.6]]);
  for (let x = 0; x < TW; x += rng.range(10, 26)) {
    wrapped(TW, x, 14, (xx) => reedTuft(ctx, rng.fork(x), xx, top + 58 + rng.range(0, 30), rng.range(8, 14), rng.range(8, 18), { dark: mix(verge, P.neel, 0.3), mid: verge, tip: mix(verge, P.haldi, 0.4) }, 5));
  }
  return c;
}

function paintWaterBase(rng: Rng, w: NonNullable<GroundDef['water']>, top: number): HTMLCanvasElement {
  const H = 720 - top;
  const [c, ctx] = makeCanvas(GAME_W, H);
  vGradient(ctx, 0, 0, GAME_W, H, [[0, w.sky, 1], [0.1, w.light, 1], [0.42, w.mid, 1], [0.8, w.deep, 1], [1, mix(w.deep, P.ink, 0.15), 1]]);
  dabField(ctx, rng, -40, 0, GAME_W + 80, H, { n: 320, r: [20, 90], colours: [w.light, w.mid, w.deep], alpha: [0.05, 0.12], aspect: [0.06, 0.16], rot: 0, rotJitter: 0.03 });
  return c;
}

export function paintRipples(rng: Rng, H: number, n: number, len: [number, number], width: [number, number], contrast: number, dark: string): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(TW, H);
  for (let i = 0; i < n; i++) {
    const t = rng.next();
    const y = 3 + t * (H - 6);
    const k = 0.55 + t * 0.45;
    const l = rng.range(len[0], len[1]) * k;
    const x = rng.next() * TW;
    const light = rng.chance(0.58);
    const col = light ? rng.pick([P.limewhite, P.seafoam]) : dark;
    const a = (light ? rng.range(0.25, 0.6) : rng.range(0.18, 0.4)) * contrast;
    const wd = rng.range(width[0], width[1]) * k;
    wrapped(TW, x, l, (xx) => taperStroke(ctx, curvePts(xx - l / 2, y, xx, y - wd * 0.6, xx + l / 2, y, 6), wd, col, a, [0.08, 0.08]));
  }
  return c;
}

function paintLip(rng: Rng, mid: string, deep: string): HTMLCanvasElement {
  const H = 40;
  const surf = 12;
  const [c, ctx] = makeCanvas(TW, H);
  const g = ctx.createLinearGradient(0, surf, 0, H);
  g.addColorStop(0, withAlpha(mid, 0.88));
  g.addColorStop(0.5, withAlpha(deep, 0.55));
  g.addColorStop(1, withAlpha(deep, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= TW; x += 8) ctx.lineTo(x, surf + Math.sin((x / TW) * Math.PI * 2 * 24) * 1.6);
  ctx.lineTo(TW, H);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 160; i++) {
    const x = rng.next() * TW;
    const l = rng.range(12, 46);
    wrapped(TW, x, l, (xx) => taperStroke(ctx, [{ x: xx - l / 2, y: surf }, { x: xx + l / 2, y: surf + 0.5 }], rng.range(1.4, 2.6), rng.pick([P.limewhite, P.seafoam]), rng.range(0.45, 0.85), [0.1, 0.1]));
  }
  return c;
}

function paintReflection(mid: HTMLCanvasElement, waterline: number, rng: Rng, tint: string): HTMLCanvasElement {
  const H = 84;
  const [flip, f] = makeCanvas(TW, H);
  f.save();
  f.scale(1, -0.42);
  f.drawImage(mid, 0, -waterline);
  f.restore();
  const [c, ctx] = makeCanvas(TW, H);
  for (let y = 0; y < H; y += 2) {
    const off = Math.sin(y * 0.55 + rng.next() * 0.6) * (1 + y * 0.06);
    ctx.drawImage(flip, 0, y, TW, 2, off, y, TW, 2);
    ctx.drawImage(flip, 0, y, TW, 2, off - TW, y, TW, 2);
  }
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = withAlpha(tint, 0.5);
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

function paintFore(rng: Rng, kind: SceneDef['fore'], dark: string): HTMLCanvasElement {
  const H = 120;
  const [c, ctx] = makeCanvas(TW, H);
  if (!kind || kind === 'none') return c;
  if (typeof kind === 'function') { kind(ctx, rng, TW); return c; }
  for (let g = 0; g < 7; g++) {
    const gx = (g + rng.range(0.1, 0.9)) * (TW / 7);
    wrapped(TW, gx, 140, (xx) => {
      const r2 = rng.fork(g);
      if (kind === 'lotus') {
        for (let i = 0; i < r2.int(2, 4); i++) lotusPad(ctx, r2, xx + r2.range(-80, 80), r2.range(84, 112), r2.range(30, 52), 0.22);
        if (r2.chance(0.6)) lotusFlower(ctx, xx + r2.range(-40, 40), r2.range(80, 96), r2.range(13, 18));
      } else if (kind === 'flowers') {
        reedTuft(ctx, r2, xx, H + 4, 40, r2.range(30, 50), { dark, mid: mix(P.tota, P.peacock, 0.2), tip: mix(P.tota, P.haldi, 0.35) }, 10);
        for (let i = 0; i < 6; i++) dab(ctx, xx + r2.range(-30, 30), r2.range(78, 104), 5, 5, 0, r2.pick([P.marigold, P.haldi, P.rani, P.sindoor]), 1);
      } else if (kind === 'stones') {
        for (let i = 0; i < 3; i++) dab(ctx, xx + r2.range(-60, 60), r2.range(100, 118), r2.range(18, 34), r2.range(10, 16), 0, mix(P.khondalite, P.ink, 0.35), 1);
      } else {
        reedTuft(ctx, r2, xx + r2.range(-110, 110), H + 4, 30, r2.range(40, 64), { dark, mid: mix(P.tota, P.peacock, 0.3), tip: mix(P.tota, P.haldi, 0.35) }, 10);
      }
    });
  }
  return c;
}

/** Duotone toning at bake time (Act IV's faded indigo + sepia). */
export function toneCanvas(c: HTMLCanvasElement, amount: number, dark: string, light: string): HTMLCanvasElement {
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = hexToRgb(dark), l = hexToRgb(light);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
    const t = Math.min(1, Math.max(0, lum * 1.08));
    px[i] = px[i] + (d[0] + (l[0] - d[0]) * t - px[i]) * amount;
    px[i + 1] = px[i + 1] + (d[1] + (l[1] - d[1]) * t - px[i + 1]) * amount;
    px[i + 2] = px[i + 2] + (d[2] + (l[2] - d[2]) * t - px[i + 2]) * amount;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  return c;
}

/** Strip helper: call fn at positions spaced along the strip (wrapping). */
export function scatter(rng: Rng, W: number, step: [number, number], fn: (x: number, i: number) => void, start = 0): void {
  let i = 0;
  for (let x = start + rng.range(0, step[0]); x < W; x += rng.range(step[0], step[1])) fn(x, i++);
}

/** A bank/ground band along the bottom of a mid strip. */
export function bank(ctx: Ctx, rng: Rng, W: number, y: number, top: string, face: string, waterEdge?: string): void {
  const fb = periodicFbm(rng, W, 180, 3);
  const edge = (x: number) => y + fb(x) * 4;
  const path = () => { ctx.beginPath(); ctx.moveTo(0, 260); for (let x = 0; x <= W; x += 6) ctx.lineTo(x, edge(x)); ctx.lineTo(W, 260); ctx.closePath(); };
  path();
  ctx.fillStyle = face;
  ctx.fill();
  clipTo(ctx, path, () => {
    vGradient(ctx, 0, y - 4, W, 30, [[0, top, 0.95], [0.25, top, 0.4], [0.5, face, 0], [1, waterEdge ?? mix(face, P.ink, 0.35), 0.6]]);
    dabField(ctx, rng, 0, y - 4, W, 30, { n: 1000, r: [1.5, 4], colours: [top, face, mix(face, P.ink, 0.3)], alpha: [0.25, 0.5], aspect: [0.4, 0.8], rot: 0, rotJitter: 0.4 });
  });
}

export function treeRow(ctx: Ctx, rng: Rng, W: number, y: number, haze: number, palms = 0.3): void {
  scatter(rng, W, [50, 90], (x) => {
    const w = rng.range(70, 120), h = rng.range(70, 104);
    wrapped(W, x, w, (xx) => broadTree(ctx, rng.fork(x), xx, y, w, h, haze));
  });
  scatter(rng, W, [150, 300], (x) => {
    const h = rng.range(118, 172);
    if (rng.chance(palms)) wrapped(W, x, h * 0.3, (xx) => palmyraPalm(ctx, rng.fork(x), xx, y, h, haze * 0.6));
    else wrapped(W, x, h * 0.5, (xx) => coconutPalm(ctx, rng.fork(x), xx, y, h, rng.range(-0.14, 0.14), haze * 0.6));
  });
}

// ---- bake --------------------------------------------------------------------------
export function paintScene(def: SceneDef, seed = 1): SceneArt {
  const rng = new Rng(`${def.id}-art:${seed}`);
  const layers: LayerSpec[] = [];
  const decor: DecorSpec[] = [];
  const g = def.ground;
  const skyH = g.kind === 'air' || g.kind === 'orbit' ? 720 : 470;
  layers.push({ name: 'sky', canvas: paintSky(rng.fork('sky'), def.sky, skyH), y: 0, parallax: 0, depth: DEPTH.sky, tile: false });
  if (def.sky.clouds !== 'none') layers.push({ name: 'clouds', canvas: paintClouds(rng.fork('clouds'), def.sky.clouds ?? 'cumulus', def.sky.cloudTint), y: g.kind === 'air' ? 260 : 60, parallax: g.kind === 'air' ? 0.35 : 0.04, drift: 6, depth: DEPTH.clouds, tile: true });
  if (def.sky.sun || def.sky.moon) layers.push({ name: 'sun', canvas: paintSunLayer(def.sky), y: 0, parallax: 0, depth: DEPTH.sun, tile: false });
  def.far.forEach((f, i) => {
    if (f.kind === 'none') return;
    layers.push({ name: `far${i}`, canvas: paintFar(rng.fork(`far${i}`), f), y: 270 + (f.kind === 'sea' ? 0 : i * 12), parallax: 0.08 + i * 0.06, depth: DEPTH.far + i * 0.1, tile: true });
  });

  let midCanvas: HTMLCanvasElement | null = null;
  if (def.mid) {
    const [mc, mctx] = makeCanvas(TW, 260);
    def.mid(mctx, rng.fork('mid'), TW);
    midCanvas = mc;
    layers.push({ name: 'mid', canvas: mc, y: 200, parallax: 0.3, depth: DEPTH.mid, tile: true });
  }

  if (g.kind === 'land') {
    layers.push({ name: 'plain', canvas: paintPlain(rng.fork('plain'), g), y: 450, parallax: 0.45, depth: DEPTH.waterBase, tile: true });
    layers.push({ name: 'track', canvas: paintTrack(rng.fork('track'), g), y: LANE - 14, parallax: 1, depth: DEPTH.ripplesNear, tile: true });
  } else if (g.kind === 'water' || g.kind === 'sea') {
    const w = g.water!;
    const top = g.kind === 'sea' ? 430 : 448;
    layers.push({ name: 'water', canvas: paintWaterBase(rng.fork('water'), w, top), y: top, parallax: 0, depth: DEPTH.waterBase, tile: false });
    const dark = mix(w.deep, P.neel, 0.3);
    if (midCanvas && g.kind === 'water') layers.push({ name: 'reflection', canvas: paintReflection(midCanvas, 250, rng.fork('refl'), w.light), y: 456, parallax: 0.3, depth: DEPTH.reflection, tile: true, alpha: 0.55 });
    layers.push({ name: 'ripples-far', canvas: paintRipples(rng.fork('rf'), 80, 520, [5, 20], [0.8, 1.8], 0.6, dark), y: top + 4, parallax: 0.4, depth: DEPTH.ripplesFar, tile: true });
    layers.push({ name: 'ripples-mid', canvas: paintRipples(rng.fork('rm'), 100, 340, [14, 42], [1.4, 3], g.kind === 'sea' ? 1 : 0.8, dark), y: 528, parallax: 0.68, depth: DEPTH.ripplesMid, tile: true });
    layers.push({ name: 'ripples-near', canvas: paintRipples(rng.fork('rn'), 132, 230, [28, 78], [2.2, 4.6], 1, dark), y: 592, parallax: 1, depth: DEPTH.ripplesNear, tile: true });
    layers.push({ name: 'lip', canvas: paintLip(rng.fork('lip'), w.mid, w.deep), y: LANE - 12, parallax: 1, depth: DEPTH.lip, tile: true });
  } else if (g.kind === 'air') {
    const w = g.water ?? { sky: P.seafoam, light: mix(P.peacock, P.seafoam, 0.5), mid: P.peacock, deep: mix(P.peacock, P.neel, 0.4) };
    layers.push({ name: 'water', canvas: paintWaterBase(rng.fork('water'), w, 640), y: 640, parallax: 0, depth: DEPTH.waterBase, tile: false });
    layers.push({ name: 'ripples-near', canvas: paintRipples(rng.fork('rn'), 80, 200, [20, 50], [1.4, 3], 0.8, mix(w.deep, P.neel, 0.3)), y: 640, parallax: 0.6, depth: DEPTH.ripplesNear, tile: true });
    layers.push({ name: 'cloudfloor', canvas: paintClouds(rng.fork('cf'), 'cumulus', def.sky.cloudTint), y: 470, parallax: 0.9, depth: DEPTH.fore, tile: true, alpha: 0.85 });
  } else if (g.kind === 'orbit') {
    layers.push({ name: 'truss-floor', canvas: paintTruss(rng.fork('tf'), false), y: LANE, parallax: 1, depth: DEPTH.ripplesNear, tile: true });
    layers.push({ name: 'truss-ceil', canvas: paintTruss(rng.fork('tc'), true), y: 0, parallax: 1, depth: DEPTH.ripplesNear, tile: true });
  }

  if (def.near) {
    const [nc, nctx] = makeCanvas(TW, 140);
    def.near(nctx, rng.fork('near'), TW);
    layers.push({ name: 'near', canvas: nc, y: 450, parallax: 0.55, depth: DEPTH.near, tile: true });
  }
  if (def.fore && def.fore !== 'none') layers.push({ name: 'fore', canvas: paintFore(rng.fork('fore'), def.fore, mix(P.tota, P.neel, 0.45)), y: 612, parallax: 1.32, depth: DEPTH.fore, tile: true });

  // One-off landmarks and story vignettes, timed through the record.
  (def.landmarks ?? []).forEach((lm, i) => {
    const [lc, lctx] = makeCanvas(lm.w, lm.h);
    lm.paint(lctx, rng.fork(`lm${i}`), lm.w, lm.h);
    const pl = PLANE[lm.plane];
    decor.push({ kind: 'landmark', x: 0, y: lm.y ?? pl.y, parallax: pl.p, period: 0, depth: pl.depth + i * 0.01, at: lm.at, canvas: lc });
  });
  if (def.sign) decor.push({ kind: 'sign', x: 0, y: g.kind === 'air' ? 470 : 549, parallax: 0.55, period: 0, depth: DEPTH.sign, at: def.sign.at ?? 0.06, text: def.sign });

  if (def.tone) {
    const t = def.tone;
    const toned: LayerSpec[] = [];
    for (const l of layers) {
      if (def.flood) {
        // keep a full-colour copy underneath that the toned layer fades away from
        toned.push({ ...l, canvas: cloneCanvas(l.canvas) });
        toneCanvas(l.canvas, t.amount, t.dark, t.light);
        l.name = `${l.name}:toned`;
        l.depth += 0.001;
      } else {
        toneCanvas(l.canvas, t.amount, t.dark, t.light);
      }
    }
    layers.push(...toned);
    for (const d of decor) if (d.canvas && !def.flood) toneCanvas(d.canvas, t.amount * 0.9, t.dark, t.light);
  }
  return { recordId: def.id, laneY: LANE, waterTop: 448, layers, decor };
}

function paintTruss(rng: Rng, ceiling: boolean): HTMLCanvasElement {
  const H = ceiling ? 172 : 122;
  const [c, ctx] = makeCanvas(TW, H);
  const steel = mix(P.neel, P.limewhite, 0.25);
  const edge = ceiling ? H - 2 : 2;
  ctx.fillStyle = mix(P.neel, P.ink, 0.35);
  ceiling ? ctx.fillRect(0, 0, TW, H) : ctx.fillRect(0, 0, TW, H);
  ctx.strokeStyle = steel;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, edge); ctx.lineTo(TW, edge); ctx.stroke();
  ctx.lineWidth = 1.6;
  for (let x = 0; x < TW; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, edge); ctx.lineTo(x + 24, ceiling ? edge - 40 : edge + 40); ctx.lineTo(x + 48, edge);
    ctx.stroke();
  }
  for (let x = 0; x < TW; x += 96) {
    ctx.fillStyle = P.neonCyan;
    ctx.fillRect(x + 20, ceiling ? edge - 6 : edge + 2, 10, 3);
  }
  dabField(ctx, rng, 0, 0, TW, H, { n: 200, r: [2, 6], colours: [steel, P.neel], alpha: [0.1, 0.2] });
  return c;
}

// small helper exported for scene files
export function hexShift(hex: string, k: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * k, g * k, b * k]);
}
