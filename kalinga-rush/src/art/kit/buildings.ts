// Painted architecture for the scenery: Kalinga temples (rekha, pidha,
// khakhara), Puri and Konark, caves and stupas, city walls, houses, and the
// colonial, industrial and modern buildings of later chapters. Temples and
// shrines are always background, never obstacles (§7).
import { P, FRAME } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, dab, dabField, glow, paintedShape, polyPath, softShadow, taperStroke, type Ctx } from '../brush';
import { flag } from './people';

export interface StoneOpts { stone?: string; haze?: number }
const hz = (c: string, h = 0) => (h ? mix(c, P.skyCream, h) : c);

function stoneSet(o: StoneOpts) {
  const base = hz(o.stone ?? P.laterite, o.haze);
  return { base, light: hz(mix(o.stone ?? P.laterite, P.limewhite, 0.35), o.haze), shade: hz(mix(o.stone ?? P.laterite, P.ink, 0.42), o.haze), rim: hz(mix(o.stone ?? P.laterite, P.ink, 0.6), o.haze) };
}

/** Curvilinear rekha deula tower, base at (x, y), height h. */
export function rekhaDeula(ctx: Ctx, rng: Rng, x: number, y: number, h: number, o: StoneOpts & { chakra?: boolean; flagColour?: string } = {}): void {
  const c = stoneSet(o);
  const w = h * 0.42;
  const top = y - h * 0.86;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2, y - h * 0.22);
    ctx.bezierCurveTo(x - w / 2, y - h * 0.6, x - w * 0.36, y - h * 0.8, x - w * 0.18, top);
    ctx.lineTo(x + w * 0.18, top);
    ctx.bezierCurveTo(x + w * 0.36, y - h * 0.8, x + w / 2, y - h * 0.6, x + w / 2, y - h * 0.22);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
  };
  softShadow(ctx, x + w * 0.1, y, w * 0.7, h * 0.03, P.ink, 0.25);
  paintedShape(ctx, rng, path, { x: x - w / 2, y: top, w, h: y - top }, { base: c.base, light: c.light, shade: c.shade, lightFrom: 'right', dabs: Math.round(h * 1.6) });
  clipTo(ctx, path, () => {
    // vertical pagas (ribs) and horizontal bhumi bands
    for (const k of [-0.32, -0.16, 0, 0.16, 0.32]) {
      taperStroke(ctx, [{ x: x + k * w, y }, { x: x + k * w * 0.55, y: top }], Math.max(1, w * 0.035), k < 0 ? c.shade : c.light, 0.45, [1, 1]);
    }
    for (let i = 1; i < 10; i++) {
      const yy = y - h * 0.22 - (i / 10) * (h * 0.64);
      ctx.fillStyle = withAlpha(c.shade, 0.35);
      ctx.fillRect(x - w, yy, w * 2, Math.max(1, h * 0.008));
    }
    // a carved niche on the front
    dab(ctx, x, y - h * 0.15, w * 0.1, h * 0.06, 0, c.rim, 0.7);
  });
  // amalaka (ribbed disc) and kalasha
  const ay = top - h * 0.03;
  dab(ctx, x, ay, w * 0.3, h * 0.035, 0, c.shade, 1);
  dab(ctx, x, ay - h * 0.005, w * 0.28, h * 0.026, 0, c.base, 1);
  for (let i = -3; i <= 3; i++) taperStroke(ctx, [{ x: x + i * w * 0.04, y: ay - h * 0.02 }, { x: x + i * w * 0.045, y: ay + h * 0.02 }], 1, c.rim, 0.5);
  dab(ctx, x, ay - h * 0.045, w * 0.06, h * 0.025, 0, hz(P.haldi, o.haze), 1);
  if (o.chakra) {
    const cy = ay - h * 0.1;
    ctx.strokeStyle = hz(P.khondalite, o.haze);
    ctx.lineWidth = Math.max(1, h * 0.008);
    ctx.beginPath();
    ctx.arc(x, cy, h * 0.035, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x + Math.cos(a) * h * 0.035, cy + Math.sin(a) * h * 0.035);
      ctx.stroke();
    }
    taperStroke(ctx, [{ x, y: cy }, { x, y: cy - h * 0.12 }], Math.max(1, h * 0.006), hz(P.khondalite, o.haze), 1, [1, 1]);
  }
  if (o.flagColour) flag(ctx, x, ay - (o.chakra ? h * 0.2 : h * 0.06), h * 0.1, o.flagColour, o.haze, 1);
}

/** Pidha deula: the stepped, pyramid-roofed hall (jagamohana). */
export function pidhaHall(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, o: StoneOpts = {}): void {
  const c = stoneSet(o);
  const wallH = h * 0.38;
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w / 2, y: y - wallH }, { x: x + w / 2, y: y - wallH }, { x: x + w / 2, y }]), { x: x - w / 2, y: y - wallH, w, h: wallH }, { base: c.base, light: c.light, shade: c.shade, lightFrom: 'right' });
  ctx.fillStyle = withAlpha(c.rim, 0.8);
  ctx.fillRect(x - w * 0.1, y - wallH * 0.75, w * 0.2, wallH * 0.75); // doorway
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const tw = w * (1.08 - t0 * 0.85);
    const ty = y - wallH - (h - wallH) * t0;
    const th = ((h - wallH) / tiers) * 0.9;
    paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - tw / 2, y: ty }, { x: x - tw * 0.43, y: ty - th }, { x: x + tw * 0.43, y: ty - th }, { x: x + tw / 2, y: ty }]), { x: x - tw / 2, y: ty - th, w: tw, h: th }, { base: c.base, light: c.light, shade: c.shade, lightFrom: 'right', dabs: 8 });
    ctx.fillStyle = withAlpha(c.shade, 0.7);
    ctx.fillRect(x - tw / 2, ty - 1, tw, Math.max(1, th * 0.18));
  }
  dab(ctx, x, y - h - h * 0.02, w * 0.12, h * 0.03, 0, c.shade, 1);
  dab(ctx, x, y - h - h * 0.07, w * 0.04, h * 0.04, 0, hz(P.haldi, o.haze), 1);
}

/** Khakhara temple: a long barrel-vaulted roof, said to look like an upturned boat (Vaital Deula). */
export function khakhara(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, o: StoneOpts = {}): void {
  const c = stoneSet(o);
  const bodyH = h * 0.55;
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w * 0.46, y: y - bodyH }, { x: x + w * 0.46, y: y - bodyH }, { x: x + w / 2, y }]), { x: x - w / 2, y: y - bodyH, w, h: bodyH }, { base: c.base, light: c.light, shade: c.shade, lightFrom: 'right' });
  const roof = () => {
    ctx.beginPath();
    ctx.moveTo(x - w * 0.42, y - bodyH);
    ctx.bezierCurveTo(x - w * 0.42, y - h * 1.02, x + w * 0.42, y - h * 1.02, x + w * 0.42, y - bodyH);
    ctx.closePath();
  };
  paintedShape(ctx, rng, roof, { x: x - w * 0.42, y: y - h, w: w * 0.84, h: h - bodyH }, { base: c.base, light: c.light, shade: c.shade, lightFrom: 'top', rim: c.rim, rimW: 1 });
  for (const k of [-0.28, 0, 0.28]) dab(ctx, x + k * w, y - h * 0.95 + Math.abs(k) * h * 0.12, w * 0.05, h * 0.05, 0, c.light, 1);
  for (let i = 0; i < 4; i++) dab(ctx, x - w * 0.3 + i * w * 0.2, y - bodyH * 0.5, w * 0.05, bodyH * 0.18, 0, c.rim, 0.55);
}

/** Lingaraja's line: offering hall, dance hall, porch and tower, each a different height. */
export function templeLine(ctx: Ctx, rng: Rng, x: number, y: number, s: number, o: StoneOpts = {}): void {
  pidhaHall(ctx, rng, x - 150 * s, y, 56 * s, 70 * s, o);
  pidhaHall(ctx, rng, x - 95 * s, y, 64 * s, 86 * s, o);
  pidhaHall(ctx, rng, x - 30 * s, y, 82 * s, 128 * s, o);
  rekhaDeula(ctx, rng, x + 60 * s, y, 230 * s, { ...o, flagColour: P.sindoor });
}

/** Shree Jagannath temple at Puri: the lime-white tower with Nilachakra and flag. */
export function jagannathTemple(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0): void {
  const o = { stone: P.limewhite, haze };
  pidhaHall(ctx, rng, x - 120 * s, y, 70 * s, 92 * s, o);
  pidhaHall(ctx, rng, x - 55 * s, y, 92 * s, 140 * s, o);
  rekhaDeula(ctx, rng, x + 50 * s, y, 250 * s, { ...o, chakra: true, flagColour: P.sindoor });
}

/** Meghanada Pacheri: the long outer wall, with the Singhadwara and its two lions. */
export function pacheri(ctx: Ctx, rng: Rng, x0: number, x1: number, y: number, h: number, haze = 0): void {
  const wall = hz(mix(P.limewhite, P.khondalite, 0.12), haze);
  const shade = hz(mix(P.limewhite, P.khondalite, 0.4), haze);
  ctx.fillStyle = wall;
  ctx.fillRect(x0, y - h, x1 - x0, h);
  ctx.fillStyle = withAlpha(shade, 0.6);
  ctx.fillRect(x0, y - h * 0.18, x1 - x0, h * 0.18);
  for (let x = x0; x < x1; x += h * 0.5) {
    ctx.fillStyle = wall;
    ctx.fillRect(x, y - h - h * 0.14, h * 0.3, h * 0.14);
  }
  dabField(ctx, rng, x0, y - h, x1 - x0, h, { n: Math.round((x1 - x0) / 6), r: [1.5, 5], colours: [shade, P.limewhite], alpha: [0.1, 0.25] });
}

export function singhadwara(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0): void {
  pidhaHall(ctx, rng, x, y, 70 * s, 110 * s, { stone: P.limewhite, haze });
  for (const k of [-1, 1]) {
    const lx = x + k * 50 * s;
    const lion = hz(mix(P.limewhite, P.chandan, 0.3), haze);
    ctx.fillStyle = hz(mix(P.limewhite, P.khondalite, 0.3), haze);
    ctx.fillRect(lx - 12 * s, y - 14 * s, 24 * s, 14 * s);
    dab(ctx, lx, y - 26 * s, 9 * s, 12 * s, 0, lion, 1);
    dab(ctx, lx + k * 3 * s, y - 38 * s, 7 * s, 7 * s, 0, lion, 1);
    dab(ctx, lx + k * 5 * s, y - 38 * s, 1.4 * s, 1.4 * s, 0, hz(P.ink, haze), 1);
  }
}

/** Konark: the Sun temple as a chariot of dark khondalite, with wheels and horses. */
export function konark(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0): void {
  const o = { stone: mix(P.khondalite, P.ink, 0.25), haze };
  const c = stoneSet(o);
  // platform
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 170 * s, y }, { x: x - 170 * s, y: y - 44 * s }, { x: x + 120 * s, y: y - 44 * s }, { x: x + 120 * s, y }]), { x: x - 170 * s, y: y - 44 * s, w: 290 * s, h: 44 * s }, { base: c.base, light: c.light, shade: c.shade, lightFrom: 'right' });
  // wheels along the platform
  for (let i = 0; i < 6; i++) {
    const wx = x - 150 * s + i * 52 * s;
    const wy = y - 20 * s;
    const r = 19 * s;
    ctx.strokeStyle = c.light;
    ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.2 * s;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * r, wy + Math.sin(a) * r); ctx.stroke();
    }
    dab(ctx, wx, wy, 3 * s, 3 * s, 0, c.light, 1);
  }
  // the great porch (jagamohana) — the tower itself stands ruined
  pidhaHall(ctx, rng, x - 20 * s, y - 44 * s, 150 * s, 200 * s, o);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x + 70 * s, y: y - 44 * s }, { x: x + 72 * s, y: y - 120 * s }, { x: x + 92 * s, y: y - 140 * s }, { x: x + 110 * s, y: y - 104 * s }, { x: x + 118 * s, y: y - 44 * s }]), { x: x + 70 * s, y: y - 140 * s, w: 50 * s, h: 96 * s }, { base: c.base, light: c.light, shade: c.shade, lightFrom: 'right' });
  // seven horses at the front
  for (let i = 0; i < 3; i++) {
    const hx = x - 200 * s - i * 14 * s;
    const hcol = hz(mix(P.khondalite, P.ink, 0.2 + i * 0.08), haze);
    dab(ctx, hx, y - 22 * s, 18 * s, 9 * s, 0, hcol, 1);
    taperStroke(ctx, [{ x: hx - 12 * s, y: y - 26 * s }, { x: hx - 22 * s, y: y - 44 * s }], 8 * s, hcol, 1);
    dab(ctx, hx - 24 * s, y - 46 * s, 6 * s, 4 * s, -0.5, hcol, 1);
    for (const lx of [-10, -4, 8, 13]) taperStroke(ctx, [{ x: hx + lx * s, y: y - 16 * s }, { x: hx + lx * s - 3 * s, y }], 3 * s, hcol, 1);
  }
}

/** Mukteswara: a small, perfect temple behind an arched stone torana. */
export function mukteswara(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0): void {
  const o = { stone: mix(P.laterite, P.chandan, 0.35), haze };
  pidhaHall(ctx, rng, x - 34 * s, y, 50 * s, 66 * s, o);
  rekhaDeula(ctx, rng, x + 24 * s, y, 120 * s, o);
  const c = stoneSet(o);
  const tx = x - 100 * s;
  for (const k of [-1, 1]) {
    paintedShape(ctx, rng, () => polyPath(ctx, [{ x: tx + k * 22 * s - 5 * s, y }, { x: tx + k * 22 * s - 5 * s, y: y - 56 * s }, { x: tx + k * 22 * s + 5 * s, y: y - 56 * s }, { x: tx + k * 22 * s + 5 * s, y }]), { x: tx + k * 22 * s - 5 * s, y: y - 56 * s, w: 10 * s, h: 56 * s }, { base: c.base, light: c.light, shade: c.shade });
  }
  ctx.strokeStyle = c.base;
  ctx.lineWidth = 7 * s;
  ctx.beginPath();
  ctx.moveTo(tx - 22 * s, y - 52 * s);
  ctx.bezierCurveTo(tx - 22 * s, y - 78 * s, tx - 8 * s, y - 70 * s, tx, y - 82 * s);
  ctx.bezierCurveTo(tx + 8 * s, y - 70 * s, tx + 22 * s, y - 78 * s, tx + 22 * s, y - 52 * s);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(c.light, 0.6);
  ctx.lineWidth = 2 * s;
  ctx.stroke();
}

export function votiveStupa(ctx: Ctx, x: number, y: number, s: number, o: StoneOpts = {}): void {
  const c = stoneSet({ stone: o.stone ?? P.khondalite, haze: o.haze });
  ctx.fillStyle = c.shade;
  ctx.fillRect(x - 9 * s, y - 6 * s, 18 * s, 6 * s);
  dab(ctx, x, y - 13 * s, 8 * s, 8 * s, 0, c.base, 1);
  dab(ctx, x + 2 * s, y - 15 * s, 4 * s, 4 * s, 0, c.light, 0.6);
  ctx.fillStyle = c.base;
  ctx.fillRect(x - 2 * s, y - 26 * s, 4 * s, 6 * s);
  for (let i = 0; i < 3; i++) dab(ctx, x, y - 22 * s - i * 3 * s, (4 - i) * s, 1 * s, 0, c.shade, 1);
}

export function buddhaHead(ctx: Ctx, x: number, y: number, s: number, haze = 0): void {
  const st = hz(mix(P.khondalite, P.chandan, 0.25), haze);
  const sh = hz(mix(P.khondalite, P.ink, 0.3), haze);
  dab(ctx, x, y - 30 * s, 22 * s, 28 * s, 0, st, 1);
  dab(ctx, x - 7 * s, y - 28 * s, 10 * s, 22 * s, 0, sh, 0.35);
  for (let i = 0; i < 18; i++) dab(ctx, x - 16 * s + (i % 6) * 6.4 * s, y - 52 * s - Math.floor(i / 6) * 5 * s, 3 * s, 3 * s, 0, sh, 0.8);
  dab(ctx, x, y - 68 * s, 6 * s, 5 * s, 0, st, 1);
  taperStroke(ctx, [{ x: x - 9 * s, y: y - 33 * s }, { x: x - 3 * s, y: y - 32 * s }], 1.4 * s, sh, 1);
  taperStroke(ctx, [{ x: x + 3 * s, y: y - 32 * s }, { x: x + 9 * s, y: y - 33 * s }], 1.4 * s, sh, 1);
  taperStroke(ctx, [{ x: x - 4 * s, y: y - 14 * s }, { x, y: y - 13 * s }, { x: x + 4 * s, y: y - 14 * s }], 1.2 * s, sh, 1);
  dab(ctx, x - 22 * s, y - 30 * s, 3 * s, 12 * s, 0, st, 1);
  dab(ctx, x + 22 * s, y - 30 * s, 3 * s, 12 * s, 0, st, 1);
}

/** A rock hill with carved caves (Udayagiri), base y, width w. */
export function caveHill(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, o: { storeys?: number; haze?: number } = {}): void {
  const rock = hz(mix(P.laterite, P.khondalite, 0.45), o.haze);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.bezierCurveTo(x - w * 0.42, y - h * 0.8, x - w * 0.15, y - h, x + w * 0.05, y - h);
    ctx.bezierCurveTo(x + w * 0.3, y - h * 0.98, x + w * 0.45, y - h * 0.6, x + w / 2, y);
    ctx.closePath();
  };
  paintedShape(ctx, rng, path, { x: x - w / 2, y: y - h, w, h }, { base: rock, light: hz(mix(rock, P.haldi, 0.25), o.haze), shade: hz(mix(rock, P.ink, 0.4), o.haze), lightFrom: 'right', dabs: Math.round(w * h / 60) });
  clipTo(ctx, path, () => {
    for (let i = 0; i < 18; i++) {
      const bx = x - w * 0.4 + rng.next() * w * 0.8;
      dab(ctx, bx, y - rng.next() * h * 0.5, rng.range(3, 8), rng.range(2, 4), 0, hz(P.tota, o.haze), 0.6);
    }
  });
  const storeys = o.storeys ?? 1;
  for (let st = 0; st < storeys; st++) {
    const cy = y - h * 0.18 - st * h * 0.26;
    const cw = w * (0.5 - st * 0.08);
    ctx.fillStyle = hz(mix(P.ink, P.laterite, 0.25), o.haze);
    ctx.fillRect(x - cw / 2, cy - h * 0.16, cw, h * 0.16);
    for (let i = 0; i <= 6; i++) {
      ctx.fillStyle = rock;
      ctx.fillRect(x - cw / 2 + (i / 6) * cw - 2, cy - h * 0.16, 4, h * 0.16);
    }
    ctx.fillStyle = hz(mix(rock, P.limewhite, 0.2), o.haze);
    ctx.fillRect(x - cw / 2 - 4, cy - h * 0.18, cw + 8, h * 0.025);
  }
}

/** Dhauli: the elephant emerging from the rock, with the edict panel below. */
export function dhauliRock(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0): void {
  const rock = hz(mix(P.khondalite, P.laterite, 0.25), haze);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.moveTo(x - 70 * s, y); ctx.bezierCurveTo(x - 70 * s, y - 70 * s, x + 60 * s, y - 80 * s, x + 75 * s, y); ctx.closePath(); }, { x: x - 70 * s, y: y - 80 * s, w: 145 * s, h: 80 * s }, { base: rock, light: hz(mix(rock, P.limewhite, 0.25), haze), shade: hz(mix(rock, P.ink, 0.35), haze), lightFrom: 'right' });
  // forepart of the elephant
  const el = hz(mix(P.khondalite, P.limewhite, 0.18), haze);
  dab(ctx, x + 20 * s, y - 58 * s, 24 * s, 16 * s, 0, el, 1);
  dab(ctx, x + 40 * s, y - 56 * s, 12 * s, 12 * s, 0, el, 1);
  taperStroke(ctx, [{ x: x + 48 * s, y: y - 52 * s }, { x: x + 52 * s, y: y - 40 * s }, { x: x + 48 * s, y: y - 30 * s }], 8 * s, el, 1, [1, 0.5]);
  taperStroke(ctx, [{ x: x + 26 * s, y: y - 46 * s }, { x: x + 26 * s, y: y - 30 * s }], 7 * s, el, 1);
  taperStroke(ctx, [{ x: x + 38 * s, y: y - 46 * s }, { x: x + 39 * s, y: y - 30 * s }], 7 * s, el, 1);
  // edict panel with rows of incised marks (not real text)
  ctx.fillStyle = hz(mix(rock, P.limewhite, 0.12), haze);
  ctx.fillRect(x - 55 * s, y - 28 * s, 60 * s, 24 * s);
  ctx.fillStyle = withAlpha(hz(P.ink, haze), 0.45);
  for (let r = 0; r < 5; r++) for (let i = 0; i < 14; i++) if (rng.chance(0.85)) ctx.fillRect(x - 52 * s + i * 4 * s, y - 25 * s + r * 4.4 * s, 2.4 * s, 1.4 * s);
}

/** A brick-and-laterite city wall with a gateway (Sisupalgarh). */
export function cityWall(ctx: Ctx, rng: Rng, x0: number, x1: number, y: number, h: number, gates: number[] = [], haze = 0): void {
  const brick = hz(mix(P.laterite, P.chandan, 0.15), haze);
  const dark = hz(mix(P.laterite, P.ink, 0.4), haze);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x0, y }, { x: x0, y: y - h }, { x: x1, y: y - h }, { x: x1, y }]), { x: x0, y: y - h, w: x1 - x0, h }, { base: brick, light: hz(mix(brick, P.haldi, 0.25), haze), shade: dark, lightFrom: 'top', dabs: Math.round((x1 - x0) * h / 50) });
  ctx.strokeStyle = withAlpha(dark, 0.35);
  ctx.lineWidth = 0.8;
  for (let yy = y - h + 5; yy < y; yy += 5) {
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
  }
  for (const gx of gates) {
    // gate towers and a dark opening
    for (const k of [-1, 1]) {
      paintedShape(ctx, rng, () => polyPath(ctx, [{ x: gx + k * 22 - 10, y }, { x: gx + k * 22 - 10, y: y - h * 1.35 }, { x: gx + k * 22 + 10, y: y - h * 1.35 }, { x: gx + k * 22 + 10, y }]), { x: gx + k * 22 - 10, y: y - h * 1.35, w: 20, h: h * 1.35 }, { base: brick, light: hz(mix(brick, P.haldi, 0.3), haze), shade: dark, lightFrom: 'right' });
    }
    ctx.fillStyle = hz(mix(P.ink, P.laterite, 0.2), haze);
    ctx.beginPath();
    ctx.moveTo(gx - 12, y);
    ctx.lineTo(gx - 12, y - h * 0.7);
    ctx.quadraticCurveTo(gx, y - h * 0.95, gx + 12, y - h * 0.7);
    ctx.lineTo(gx + 12, y);
    ctx.closePath();
    ctx.fill();
  }
}

export interface HouseOpts { roof?: 'tile' | 'thatch' | 'flat'; wall?: string; haze?: number; door?: string }

/** A village or town house: mud/lime walls, tiled or thatched roof. */
export function house(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, o: HouseOpts = {}): void {
  const wall = hz(o.wall ?? mix(P.chandan, P.limewhite, 0.45), o.haze);
  const wallD = hz(mix(o.wall ?? P.chandan, P.laterite, 0.35), o.haze);
  const roofCol = hz(o.roof === 'thatch' ? mix(P.haldi, P.laterite, 0.4) : o.roof === 'flat' ? mix(P.limewhite, P.khondalite, 0.25) : mix(P.laterite, P.sindoor, 0.2), o.haze);
  const wh = h * (o.roof === 'flat' ? 0.9 : 0.58);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w / 2, y: y - wh }, { x: x + w / 2, y: y - wh }, { x: x + w / 2, y }]), { x: x - w / 2, y: y - wh, w, h: wh }, { base: wall, light: hz(P.limewhite, o.haze), shade: wallD, lightFrom: 'right', dabs: 12 });
  ctx.fillStyle = hz(o.door ?? mix(P.peacock, P.ink, 0.25), o.haze);
  ctx.fillRect(x - w * 0.12, y - wh * 0.62, w * 0.24, wh * 0.62);
  ctx.fillStyle = hz(mix(P.ink, P.laterite, 0.2), o.haze);
  ctx.fillRect(x + w * 0.22, y - wh * 0.7, w * 0.14, wh * 0.22);
  if (o.roof === 'flat') {
    ctx.fillStyle = roofCol;
    ctx.fillRect(x - w / 2 - 3, y - wh - 5, w + 6, 6);
    return;
  }
  const rp = () => polyPath(ctx, [{ x: x - w / 2 - 6, y: y - wh + 2 }, { x: x - w * 0.15, y: y - h }, { x: x + w * 0.15, y: y - h }, { x: x + w / 2 + 6, y: y - wh + 2 }]);
  paintedShape(ctx, rng, rp, { x: x - w / 2 - 6, y: y - h, w: w + 12, h: h - wh }, { base: roofCol, light: hz(mix(roofCol, P.haldi, 0.3), o.haze), shade: hz(mix(roofCol, P.ink, 0.3), o.haze), lightFrom: 'right', dabs: 14 });
  if (o.roof !== 'thatch') clipTo(ctx, rp, () => {
    for (let xx = x - w / 2; xx < x + w / 2 + 6; xx += 5) taperStroke(ctx, [{ x: xx, y: y - wh }, { x: x + (xx - x) * 0.3, y: y - h }], 1, hz(mix(roofCol, P.ink, 0.35), o.haze), 0.4, [1, 1]);
  });
}

/** Market stall with a striped awning. */
export function stall(ctx: Ctx, x: number, y: number, w: number, h: number, colours: [string, string], haze = 0): void {
  const post = hz(mix(P.laterite, P.ink, 0.3), haze);
  taperStroke(ctx, [{ x: x - w / 2, y }, { x: x - w / 2, y: y - h }], 2, post, 1, [1, 1]);
  taperStroke(ctx, [{ x: x + w / 2, y }, { x: x + w / 2, y: y - h }], 2, post, 1, [1, 1]);
  const n = 6;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = hz(colours[i % 2], haze);
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 4 + (i / n) * (w + 8), y - h);
    ctx.lineTo(x - w / 2 - 4 + ((i + 1) / n) * (w + 8), y - h);
    ctx.lineTo(x - w / 2 - 4 + ((i + 1) / n) * (w + 8), y - h + 12);
    ctx.quadraticCurveTo(x - w / 2 - 4 + ((i + 0.5) / n) * (w + 8), y - h + 17, x - w / 2 - 4 + (i / n) * (w + 8), y - h + 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = hz(mix(P.laterite, P.chandan, 0.3), haze);
  ctx.fillRect(x - w / 2, y - h * 0.42, w, h * 0.12);
  for (let i = 0; i < 5; i++) dab(ctx, x - w * 0.36 + i * w * 0.18, y - h * 0.46, w * 0.07, w * 0.05, 0, hz([P.haldi, P.marigold, P.tota, P.sindoor, P.limewhite][i], haze), 1);
}

/** A fort on a hill (Khurda), drawn small and far. */
export function fortHill(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0): void {
  const hill = hz(mix(P.tota, P.khondalite, 0.45), haze);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.moveTo(x - 120 * s, y); ctx.quadraticCurveTo(x, y - 110 * s, x + 130 * s, y); ctx.closePath(); }, { x: x - 120 * s, y: y - 60 * s, w: 250 * s, h: 60 * s }, { base: hill, light: hz(mix(hill, P.haldi, 0.3), haze), shade: hz(mix(hill, P.ink, 0.3), haze), lightFrom: 'right' });
  const st = hz(mix(P.laterite, P.khondalite, 0.4), haze);
  ctx.fillStyle = st;
  ctx.fillRect(x - 40 * s, y - 70 * s, 80 * s, 22 * s);
  for (let i = 0; i < 9; i++) ctx.fillRect(x - 40 * s + i * 10 * s, y - 75 * s, 5 * s, 5 * s);
  ctx.fillRect(x - 50 * s, y - 84 * s, 16 * s, 36 * s);
  ctx.fillRect(x + 34 * s, y - 84 * s, 16 * s, 36 * s);
}

/** A big pandal tent with bunting (Utkal Sammilani). */
export function pandal(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze = 0): void {
  const cloth = hz(P.limewhite, haze);
  const stripe = hz(P.sindoor, haze);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y: y - h * 0.55 }, { x, y: y - h }, { x: x + w / 2, y: y - h * 0.55 }]), { x: x - w / 2, y: y - h, w, h: h * 0.45 }, { base: cloth, light: hz(P.limewhite, haze), shade: hz(P.skyCream, haze), lightFrom: 'right' });
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    taperStroke(ctx, [{ x, y: y - h }, { x: x - w / 2 + t * w, y: y - h * 0.55 }], 3, i % 2 ? stripe : hz(P.haldi, haze), 0.9, [1, 1]);
  }
  ctx.fillStyle = withAlpha(hz(mix(P.ink, P.laterite, 0.3), haze), 0.75);
  ctx.fillRect(x - w / 2 + 4, y - h * 0.55, w - 8, h * 0.55);
  for (const px of [x - w / 2 + 4, x - w / 6, x + w / 6, x + w / 2 - 6]) taperStroke(ctx, [{ x: px, y }, { x: px, y: y - h * 0.56 }], 3, hz(P.laterite, haze), 1, [1, 1]);
  // bunting
  for (let i = 0; i < 16; i++) {
    const bx = x - w / 2 + (i + 0.5) * (w / 16);
    ctx.fillStyle = hz([P.sindoor, P.haldi, P.tota, P.rani][i % 4], haze);
    ctx.beginPath(); ctx.moveTo(bx - 5, y - h * 0.55); ctx.lineTo(bx + 5, y - h * 0.55); ctx.lineTo(bx, y - h * 0.47); ctx.closePath(); ctx.fill();
  }
}

/** A colonial building with columns (Cuttack college, offices). */
export function colonial(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze = 0, wallColour?: string): void {
  const wall = hz(wallColour ?? mix(P.marigold, P.limewhite, 0.55), haze);
  const shade = hz(mix(wallColour ?? P.marigold, P.laterite, 0.4), haze);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w / 2, y: y - h }, { x: x + w / 2, y: y - h }, { x: x + w / 2, y }]), { x: x - w / 2, y: y - h, w, h }, { base: wall, light: hz(P.limewhite, haze), shade, lightFrom: 'right' });
  ctx.fillStyle = hz(P.limewhite, haze);
  ctx.beginPath(); ctx.moveTo(x - w * 0.22, y - h); ctx.lineTo(x, y - h * 1.22); ctx.lineTo(x + w * 0.22, y - h); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 6; i++) {
    const cx = x - w * 0.2 + i * w * 0.08;
    ctx.fillStyle = hz(P.limewhite, haze);
    ctx.fillRect(cx - 2, y - h * 0.95, 4, h * 0.95);
    ctx.fillStyle = withAlpha(shade, 0.5);
    ctx.fillRect(cx + 1, y - h * 0.95, 1, h * 0.95);
  }
  for (const k of [-1, 1]) for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
    ctx.fillStyle = hz(mix(P.tota, P.ink, 0.35), haze);
    ctx.fillRect(x + k * (w * 0.3 + i * w * 0.06) - 3, y - h * (0.4 + r * 0.38), 6, h * 0.22);
  }
}

/** Hirakud: a long earthen dam with concrete spillway gates. */
export function dam(ctx: Ctx, rng: Rng, x0: number, x1: number, y: number, h: number, gatesAt: number, haze = 0): void {
  const earth = hz(mix(P.tota, P.laterite, 0.35), haze);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x0, y }, { x: x0 + 20, y: y - h }, { x: x1 - 20, y: y - h }, { x: x1, y }]), { x: x0, y: y - h, w: x1 - x0, h }, { base: earth, light: hz(mix(earth, P.haldi, 0.3), haze), shade: hz(mix(earth, P.ink, 0.3), haze), lightFrom: 'top', dabs: Math.round((x1 - x0) / 3) });
  const con = hz(mix(P.limewhite, P.khondalite, 0.3), haze);
  ctx.fillStyle = con;
  ctx.fillRect(gatesAt - 90, y - h - 10, 180, h + 10);
  for (let i = 0; i < 8; i++) {
    const gx = gatesAt - 84 + i * 22;
    ctx.fillStyle = hz(mix(P.neel, P.khondalite, 0.4), haze);
    ctx.fillRect(gx, y - h + 4, 14, h * 0.5);
    // white water from the open gates
    glow(ctx, gx + 7, y - h * 0.3, 14, P.limewhite, 0.7);
    taperStroke(ctx, [{ x: gx + 7, y: y - h * 0.45 }, { x: gx + 7, y }], 10, hz(P.limewhite, haze), 0.7, [1, 0.6]);
  }
}

/** Rourkela: a blast furnace with stacks, stoves and a glow. */
export function blastFurnace(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0, label?: string): void {
  const steel = hz(mix(P.khondalite, P.neel, 0.25), haze);
  const rust = hz(mix(P.laterite, P.khondalite, 0.4), haze);
  for (let i = 0; i < 3; i++) {
    const sx = x + 60 * s + i * 22 * s;
    paintedShape(ctx, rng, () => polyPath(ctx, [{ x: sx - 9 * s, y }, { x: sx - 9 * s, y: y - 120 * s }, { x: sx + 9 * s, y: y - 120 * s }, { x: sx + 9 * s, y }]), { x: sx - 9 * s, y: y - 120 * s, w: 18 * s, h: 120 * s }, { base: rust, light: hz(mix(rust, P.haldi, 0.3), haze), shade: hz(mix(rust, P.ink, 0.4), haze), lightFrom: 'right' });
    dab(ctx, sx, y - 120 * s, 9 * s, 3 * s, 0, hz(mix(rust, P.ink, 0.3), haze), 1);
  }
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 30 * s, y }, { x: x - 22 * s, y: y - 130 * s }, { x: x + 22 * s, y: y - 130 * s }, { x: x + 30 * s, y }]), { x: x - 30 * s, y: y - 130 * s, w: 60 * s, h: 130 * s }, { base: steel, light: hz(mix(steel, P.limewhite, 0.3), haze), shade: hz(mix(steel, P.ink, 0.4), haze), lightFrom: 'right' });
  taperStroke(ctx, [{ x: x - 30 * s, y: y - 100 * s }, { x: x - 90 * s, y: y - 40 * s }], 6 * s, steel, 1, [1, 1]);
  glow(ctx, x, y - 10 * s, 50 * s, P.marigold, 0.55);
  dab(ctx, x, y - 8 * s, 10 * s, 5 * s, 0, P.haldi, 1);
  for (let i = 0; i < 4; i++) glow(ctx, x + 60 * s + rng.range(0, 44) * s, y - 140 * s - i * 18 * s, 20 * s + i * 6 * s, mix(P.limewhite, P.khondalite, 0.3), 0.35);
  if (label) {
    ctx.fillStyle = hz(FRAME.frame, haze);
    ctx.fillRect(x - 26 * s, y - 92 * s, 52 * s, 16 * s);
    ctx.fillStyle = hz(FRAME.cream, haze);
    ctx.font = `800 ${Math.round(10 * s)}px "Inter Tight", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 80 * s);
    ctx.textAlign = 'left';
  }
}

export function crane(ctx: Ctx, x: number, y: number, s: number, colour: string, haze = 0): void {
  const c = hz(colour, haze);
  ctx.strokeStyle = c;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(x - 14 * s, y); ctx.lineTo(x - 6 * s, y - 120 * s); ctx.lineTo(x + 6 * s, y - 120 * s); ctx.lineTo(x + 14 * s, y);
  ctx.moveTo(x - 30 * s, y - 120 * s); ctx.lineTo(x + 90 * s, y - 110 * s);
  ctx.stroke();
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath(); ctx.moveTo(x + 70 * s, y - 112 * s); ctx.lineTo(x + 70 * s, y - 60 * s); ctx.stroke();
  ctx.fillStyle = c;
  ctx.fillRect(x - 10 * s, y - 132 * s, 20 * s, 12 * s);
}

/** Cyclone shelter: a raised concrete block that glows as a safe place. */
export function cycloneShelter(ctx: Ctx, rng: Rng, x: number, y: number, s: number, lit: boolean, haze = 0): void {
  const con = hz(mix(P.limewhite, P.marigold, 0.25), haze);
  if (lit) glow(ctx, x, y - 50 * s, 120 * s, P.haldi, 0.45);
  for (const k of [-1, -0.33, 0.33, 1]) taperStroke(ctx, [{ x: x + k * 40 * s, y }, { x: x + k * 40 * s, y: y - 30 * s }], 5 * s, hz(mix(P.khondalite, P.limewhite, 0.3), haze), 1, [1, 1]);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 48 * s, y: y - 30 * s }, { x: x - 48 * s, y: y - 74 * s }, { x: x + 48 * s, y: y - 74 * s }, { x: x + 48 * s, y: y - 30 * s }]), { x: x - 48 * s, y: y - 74 * s, w: 96 * s, h: 44 * s }, { base: con, light: hz(P.limewhite, haze), shade: hz(mix(con, P.khondalite, 0.4), haze), lightFrom: 'right' });
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = lit ? P.haldi : hz(mix(P.neel, P.ink, 0.3), haze);
    ctx.fillRect(x - 40 * s + i * 17 * s, y - 64 * s, 10 * s, 12 * s);
  }
  ctx.fillStyle = hz(P.sindoor, haze);
  ctx.fillRect(x - 48 * s, y - 78 * s, 96 * s, 5 * s);
}

/** A floodlit stadium bowl with crowd specks (no tournament marks). */
export function stadium(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, haze = 0): void {
  const shell = hz(mix(P.limewhite, P.khondalite, 0.25), haze);
  paintedShape(ctx, rng, () => { ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2 + 20, y - h * 0.7); ctx.quadraticCurveTo(x, y - h, x + w / 2 - 20, y - h * 0.7); ctx.lineTo(x + w / 2, y); ctx.closePath(); }, { x: x - w / 2, y: y - h, w, h }, { base: shell, light: hz(P.limewhite, haze), shade: hz(mix(shell, P.neel, 0.3), haze), lightFrom: 'top' });
  for (let i = 0; i < w * 0.8; i++) {
    dab(ctx, x - w * 0.42 + rng.next() * w * 0.84, y - h * 0.15 - rng.next() * h * 0.45, 1.4, 1.4, 0, hz(rng.pick([P.rani, P.haldi, P.peacock, P.sindoor, P.limewhite, P.tota]), haze), 0.9);
  }
  for (const k of [-0.5, 0.5]) {
    const px = x + k * w * 0.9;
    taperStroke(ctx, [{ x: px, y }, { x: px, y: y - h * 1.7 }], 3, hz(P.khondalite, haze), 1, [1, 1]);
    ctx.fillStyle = hz(P.khondalite, haze);
    ctx.fillRect(px - 12, y - h * 1.78, 24, 10);
    glow(ctx, px, y - h * 1.73, 70, P.limewhite, 0.5);
    glow(ctx, px, y - h * 1.73, 22, P.haldi, 0.8);
  }
}

/** A modern block (offices, apartments, the chip plant) with lit windows. */
export function modernBlock(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number, colour: string, o: { haze?: number; lit?: number; glowColour?: string } = {}): void {
  const c = hz(colour, o.haze);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - w / 2, y }, { x: x - w / 2, y: y - h }, { x: x + w / 2, y: y - h }, { x: x + w / 2, y }]), { x: x - w / 2, y: y - h, w, h }, { base: c, light: hz(mix(colour, P.limewhite, 0.4), o.haze), shade: hz(mix(colour, P.ink, 0.35), o.haze), lightFrom: 'right', dabs: 10 });
  const cols = Math.max(2, Math.floor(w / 12));
  const rows = Math.max(2, Math.floor(h / 14));
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const lit = rng.next() < (o.lit ?? 0.3);
    ctx.fillStyle = lit ? (o.glowColour ?? P.haldi) : hz(mix(colour, P.ink, 0.45), o.haze);
    ctx.fillRect(x - w / 2 + 4 + i * ((w - 8) / cols), y - h + 6 + r * ((h - 10) / rows), (w - 8) / cols - 4, (h - 10) / rows - 5);
  }
}
