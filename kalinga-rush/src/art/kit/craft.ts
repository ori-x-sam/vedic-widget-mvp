// Background craft and vehicles: boitas, Rath Yatra chariots, carts, buses,
// trains, the Dakota, and the imagined future's pods, turbines and starships.
// All generic: no logos, liveries or registration marks (§7 rule 8).
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import type { Rng } from '../../lib/rng';
import { clipTo, dab, glow, paintedShape, polyPath, taperStroke, type Ctx } from '../brush';
import { cow, elephant } from './animals';

const hz = (c: string, h = 0) => (h ? mix(c, P.skyCream, h) : c);

export interface BoitaOpts { sail?: string; sail2?: string; haze?: number; cargo?: 'bales' | 'elephant' | 'none'; lamps?: boolean; space?: boolean }

/** A boita: Kalinga's sea-going ship with square sails. (x, y) = waterline centre. */
export function boitaShip(ctx: Ctx, rng: Rng, x: number, y: number, s: number, o: BoitaOpts = {}): void {
  const wood = hz(mix(P.laterite, P.ink, 0.15), o.haze);
  const woodL = hz(mix(P.laterite, P.chandan, 0.4), o.haze);
  const sail = hz(o.sail ?? mix(P.limewhite, P.skyCream, 0.3), o.haze);
  const sail2 = hz(o.sail2 ?? P.sindoor, o.haze);
  // masts and sails
  for (const [mx, mh, sw] of [[-18, 96, 46], [22, 80, 38]] as const) {
    taperStroke(ctx, [{ x: x + mx * s, y: y - 12 * s }, { x: x + mx * s, y: y - mh * s }], 3 * s, wood, 1, [1, 1]);
    const top = y - mh * s + 6 * s;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x + (mx - sw / 2) * s, top);
      ctx.lineTo(x + (mx + sw / 2) * s, top);
      ctx.quadraticCurveTo(x + (mx + sw / 2 + 6) * s, top + mh * 0.32 * s, x + (mx + sw / 2) * s, top + mh * 0.62 * s);
      ctx.lineTo(x + (mx - sw / 2) * s, top + mh * 0.62 * s);
      ctx.quadraticCurveTo(x + (mx - sw / 2 + 4) * s, top + mh * 0.32 * s, x + (mx - sw / 2) * s, top);
      ctx.closePath();
    };
    paintedShape(ctx, rng, path, { x: x + (mx - sw / 2) * s, y: top, w: sw * s, h: mh * 0.62 * s }, { base: sail, light: hz(P.limewhite, o.haze), shade: hz(mix(sail, P.khondalite, 0.35), o.haze), lightFrom: 'right', dabs: 10 });
    clipTo(ctx, path, () => {
      ctx.fillStyle = sail2;
      ctx.fillRect(x + (mx - sw / 2) * s, top + mh * 0.25 * s, sw * s, mh * 0.08 * s);
    });
    if (o.space) glow(ctx, x + mx * s, top + mh * 0.3 * s, sw * 0.8 * s, P.neonCyan, 0.25);
  }
  // hull with raised prow and stern
  const hull = () => {
    ctx.beginPath();
    ctx.moveTo(x - 62 * s, y - 24 * s);
    ctx.quadraticCurveTo(x - 55 * s, y - 12 * s, x - 48 * s, y - 12 * s);
    ctx.lineTo(x + 46 * s, y - 12 * s);
    ctx.quadraticCurveTo(x + 58 * s, y - 14 * s, x + 66 * s, y - 30 * s);
    ctx.quadraticCurveTo(x + 58 * s, y + 4 * s, x + 38 * s, y + 6 * s);
    ctx.lineTo(x - 40 * s, y + 6 * s);
    ctx.quadraticCurveTo(x - 58 * s, y, x - 62 * s, y - 24 * s);
    ctx.closePath();
  };
  paintedShape(ctx, rng, hull, { x: x - 62 * s, y: y - 30 * s, w: 128 * s, h: 36 * s }, { base: wood, light: woodL, shade: hz(mix(wood, P.ink, 0.4), o.haze), lightFrom: 'top', rim: hz(mix(wood, P.ink, 0.5), o.haze), rimW: 1.2 });
  ctx.fillStyle = hz(P.haldi, o.haze);
  ctx.fillRect(x - 46 * s, y - 9 * s, 90 * s, 2 * s);
  for (let i = 0; i < 6; i++) dab(ctx, x - 38 * s + i * 15 * s, y - 2 * s, 3 * s, 3 * s, 0, hz(P.haldi, o.haze), 0.9);
  // eye on the prow (painted boats often carry one)
  dab(ctx, x + 54 * s, y - 18 * s, 3 * s, 2 * s, 0, hz(P.limewhite, o.haze), 1);
  dab(ctx, x + 54.5 * s, y - 18 * s, 1.2 * s, 1.2 * s, 0, hz(P.ink, o.haze), 1);
  if (o.cargo === 'bales') for (let i = 0; i < 4; i++) dab(ctx, x - 36 * s + i * 12 * s, y - 16 * s, 6 * s, 4.4 * s, 0, hz(rng.pick([P.haldi, P.marigold, P.limewhite]), o.haze), 1);
  if (o.cargo === 'elephant') elephant(ctx, x - 2 * s, y - 12 * s, 0.42 * s, { haze: o.haze, caparison: [P.sindoor, P.haldi] });
  if (o.lamps) for (let i = 0; i < 3; i++) { glow(ctx, x - 30 * s + i * 30 * s, y - 16 * s, 12 * s, P.marigold, 0.7); dab(ctx, x - 30 * s + i * 30 * s, y - 16 * s, 1.6 * s, 2.4 * s, 0, P.haldi, 1); }
}

/** A Rath Yatra chariot (drawn traditionally, far in the background). */
export function chariot(ctx: Ctx, rng: Rng, x: number, y: number, s: number, canopy: [string, string], haze = 0): void {
  const wood = hz(mix(P.laterite, P.ink, 0.25), haze);
  const woodL = hz(mix(P.laterite, P.haldi, 0.3), haze);
  // wheels
  for (let i = 0; i < 4; i++) {
    const wx = x - 36 * s + i * 24 * s;
    ctx.strokeStyle = wood;
    ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.arc(wx, y - 12 * s, 11 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1 * s;
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(wx, y - 12 * s); ctx.lineTo(wx + Math.cos(a) * 11 * s, y - 12 * s + Math.sin(a) * 11 * s); ctx.stroke(); }
  }
  // platform and body
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 50 * s, y: y - 22 * s }, { x: x - 50 * s, y: y - 50 * s }, { x: x + 50 * s, y: y - 50 * s }, { x: x + 50 * s, y: y - 22 * s }]), { x: x - 50 * s, y: y - 50 * s, w: 100 * s, h: 28 * s }, { base: wood, light: woodL, shade: hz(mix(wood, P.ink, 0.3), haze), lightFrom: 'right' });
  for (let i = 0; i < 9; i++) dab(ctx, x - 44 * s + i * 11 * s, y - 36 * s, 3 * s, 8 * s, 0, hz(rng.pick([P.haldi, P.limewhite, P.tota]), haze), 0.8);
  // the tall conical canopy in its two colours, as Pipili appliqué stripes
  const top = y - 160 * s;
  const cone = () => polyPath(ctx, [{ x: x - 46 * s, y: y - 50 * s }, { x: x - 10 * s, y: top + 10 * s }, { x: x + 10 * s, y: top + 10 * s }, { x: x + 46 * s, y: y - 50 * s }]);
  cone();
  ctx.fillStyle = hz(canopy[0], haze);
  ctx.fill();
  clipTo(ctx, cone, () => {
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = hz(canopy[1], haze);
      ctx.fillRect(x - 50 * s, y - 60 * s - i * 12 * s, 100 * s, 5 * s);
    }
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = withAlpha(hz(P.limewhite, haze), 0.6);
      ctx.fillRect(x - 50 * s, y - 64 * s - i * 24 * s, 100 * s, 0.8 * s);
    }
  });
  dab(ctx, x, top + 4 * s, 7 * s, 8 * s, 0, hz(P.haldi, haze), 1);
  taperStroke(ctx, [{ x, y: top }, { x, y: top - 22 * s }], 1.5 * s, wood, 1, [1, 1]);
  ctx.fillStyle = hz(canopy[0], haze);
  ctx.beginPath(); ctx.moveTo(x, top - 22 * s); ctx.lineTo(x + 14 * s, top - 18 * s); ctx.lineTo(x, top - 13 * s); ctx.closePath(); ctx.fill();
  // wooden horses at the front
  for (let i = 0; i < 2; i++) dab(ctx, x + 56 * s + i * 8 * s, y - 34 * s, 8 * s, 5 * s, 0, hz(i ? P.limewhite : mix(P.khondalite, P.ink, 0.3), haze), 1);
}

export function bullockCartBg(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0, phase = 0): void {
  cow(ctx, x + 34 * s, y, 0.75 * s, { haze, phase });
  const wood = hz(mix(P.laterite, P.chandan, 0.25), haze);
  taperStroke(ctx, [{ x: x - 10 * s, y: y - 18 * s }, { x: x + 30 * s, y: y - 14 * s }], 2 * s, wood, 1, [1, 1]);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 30 * s, y: y - 14 * s }, { x: x - 30 * s, y: y - 26 * s }, { x: x + 4 * s, y: y - 26 * s }, { x: x + 4 * s, y: y - 14 * s }]), { x: x - 30 * s, y: y - 26 * s, w: 34 * s, h: 12 * s }, { base: wood, light: hz(mix(wood, P.haldi, 0.3), haze), shade: hz(mix(wood, P.ink, 0.3), haze) });
  ctx.strokeStyle = hz(mix(P.laterite, P.ink, 0.35), haze);
  ctx.lineWidth = 2.4 * s;
  ctx.beginPath(); ctx.arc(x - 13 * s, y - 9 * s, 9 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = hz(mix(P.haldi, P.laterite, 0.35), haze);
  ctx.beginPath(); ctx.moveTo(x - 32 * s, y - 26 * s); ctx.quadraticCurveTo(x - 13 * s, y - 44 * s, x + 6 * s, y - 26 * s); ctx.closePath(); ctx.fill();
}

export function busBg(ctx: Ctx, rng: Rng, x: number, y: number, s: number, colour: string, haze = 0, electric = false): void {
  const c = hz(colour, haze);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 60 * s, y: y - 8 * s }, { x: x - 60 * s, y: y - 44 * s }, { x: x + 54 * s, y: y - 44 * s }, { x: x + 62 * s, y: y - 30 * s }, { x: x + 62 * s, y: y - 8 * s }]), { x: x - 60 * s, y: y - 44 * s, w: 122 * s, h: 36 * s }, { base: c, light: hz(mix(colour, P.limewhite, 0.4), haze), shade: hz(mix(colour, P.ink, 0.3), haze), lightFrom: 'top' });
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = hz(electric ? mix(P.seafoam, P.limewhite, 0.3) : mix(P.neel, P.seafoam, 0.4), haze);
    ctx.fillRect(x - 54 * s + i * 15 * s, y - 38 * s, 11 * s, 12 * s);
  }
  ctx.fillStyle = hz(P.limewhite, haze);
  ctx.fillRect(x - 60 * s, y - 22 * s, 122 * s, 3 * s);
  for (const wx of [-36, 38]) { dab(ctx, x + wx * s, y - 6 * s, 7 * s, 7 * s, 0, hz(P.ink, haze), 1); dab(ctx, x + wx * s, y - 6 * s, 3 * s, 3 * s, 0, hz(P.khondalite, haze), 1); }
  if (electric) { dab(ctx, x + 58 * s, y - 14 * s, 2 * s, 2 * s, 0, P.haldi, 1); }
}

export function trainBg(ctx: Ctx, rng: Rng, x: number, y: number, s: number, cars: number, haze = 0): void {
  for (let i = 0; i < cars; i++) {
    const cx = x - i * 78 * s;
    const c = hz(i === 0 ? mix(P.neel, P.ink, 0.15) : mix(P.laterite, P.ink, 0.15), haze);
    paintedShape(ctx, rng, () => polyPath(ctx, [{ x: cx - 36 * s, y: y - 8 * s }, { x: cx - 36 * s, y: y - 38 * s }, { x: cx + 36 * s, y: y - 38 * s }, { x: cx + 36 * s, y: y - 8 * s }]), { x: cx - 36 * s, y: y - 38 * s, w: 72 * s, h: 30 * s }, { base: c, light: hz(mix(c, P.limewhite, 0.3), haze), shade: hz(mix(c, P.ink, 0.3), haze), lightFrom: 'top' });
    for (const wx of [-24, 24]) dab(ctx, cx + wx * s, y - 6 * s, 6 * s, 6 * s, 0, hz(P.ink, haze), 1);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = hz(P.haldi, haze); ctx.fillRect(cx - 30 * s + k * 16 * s, y - 32 * s, 10 * s, 9 * s); }
  }
}

/** Generic twin-engine propeller plane (the Dakota era), side view facing right. */
export function planeBg(ctx: Ctx, x: number, y: number, s: number, colour: string, haze = 0): void {
  const c = hz(colour, haze);
  dab(ctx, x, y, 48 * s, 8 * s, 0, c, 1);
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(x - 40 * s, y - 4 * s); ctx.lineTo(x - 52 * s, y - 22 * s); ctx.lineTo(x - 44 * s, y - 22 * s); ctx.lineTo(x - 28 * s, y - 4 * s); ctx.closePath(); ctx.fill();
  dab(ctx, x - 4 * s, y + 2 * s, 30 * s, 3 * s, 0, hz(mix(colour, P.ink, 0.3), haze), 1);
  for (let i = 0; i < 6; i++) dab(ctx, x - 20 * s + i * 8 * s, y - 2 * s, 2 * s, 2 * s, 0, hz(P.seafoam, haze), 1);
}

// ---- The imagined future (Act VII): grows out of earlier chapters -------------

export function maglevGuideway(ctx: Ctx, x0: number, x1: number, y: number, s: number, haze = 0): void {
  const con = hz(mix(P.limewhite, P.neel, 0.25), haze);
  ctx.fillStyle = con;
  ctx.fillRect(x0, y - 10 * s, x1 - x0, 10 * s);
  ctx.fillStyle = withAlpha(P.neonCyan, 0.9);
  ctx.fillRect(x0, y - 11 * s, x1 - x0, 2 * s);
  for (let x = x0; x < x1; x += 90 * s) {
    ctx.fillStyle = hz(mix(P.limewhite, P.neel, 0.4), haze);
    ctx.fillRect(x, y, 8 * s, 80 * s);
  }
}

export function boitaPod(ctx: Ctx, x: number, y: number, s: number, haze = 0): void {
  ctx.fillStyle = hz(P.limewhite, haze);
  ctx.beginPath();
  ctx.moveTo(x - 50 * s, y - 6 * s); ctx.quadraticCurveTo(x - 46 * s, y - 30 * s, x - 10 * s, y - 32 * s);
  ctx.lineTo(x + 30 * s, y - 32 * s); ctx.quadraticCurveTo(x + 58 * s, y - 28 * s, x + 62 * s, y - 8 * s);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = hz(P.neel, haze);
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 32 * s + i * 14 * s, y - 26 * s, 10 * s, 10 * s);
  ctx.fillStyle = P.neonRani;
  ctx.fillRect(x - 46 * s, y - 10 * s, 104 * s, 2 * s);
  dab(ctx, x + 50 * s, y - 20 * s, 2.4 * s, 1.6 * s, 0, P.ink, 1);
}

export function turbine(ctx: Ctx, x: number, y: number, s: number, angle: number, haze = 0): void {
  const c = hz(P.limewhite, haze);
  taperStroke(ctx, [{ x, y }, { x, y: y - 120 * s }], 5 * s, c, 1, [1, 0.6]);
  for (let i = 0; i < 3; i++) {
    const a = angle + (i / 3) * Math.PI * 2;
    taperStroke(ctx, [{ x, y: y - 120 * s }, { x: x + Math.cos(a) * 52 * s, y: y - 120 * s + Math.sin(a) * 52 * s }], 6 * s, c, 1, [1, 0.2]);
  }
  dab(ctx, x, y - 120 * s, 4 * s, 4 * s, 0, P.neonCyan, 1);
}

export function solarRaft(ctx: Ctx, x: number, y: number, s: number): void {
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = mix(P.neel, P.ink, 0.2);
    ctx.beginPath();
    const px = x - 40 * s + i * 22 * s;
    ctx.moveTo(px, y); ctx.lineTo(px + 18 * s, y); ctx.lineTo(px + 24 * s, y - 8 * s); ctx.lineTo(px + 6 * s, y - 8 * s); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = withAlpha(P.neonCyan, 0.7);
    ctx.lineWidth = 0.8 * s;
    ctx.stroke();
  }
}

export function stiltShelter(ctx: Ctx, rng: Rng, x: number, y: number, s: number): void {
  for (const k of [-1, -0.3, 0.3, 1]) taperStroke(ctx, [{ x: x + k * 34 * s, y }, { x: x + k * 34 * s, y: y - 70 * s }], 4 * s, mix(P.limewhite, P.neel, 0.3), 1, [1, 1]);
  paintedShape(ctx, rng, () => polyPath(ctx, [{ x: x - 44 * s, y: y - 70 * s }, { x: x - 44 * s, y: y - 104 * s }, { x: x + 44 * s, y: y - 104 * s }, { x: x + 44 * s, y: y - 70 * s }]), { x: x - 44 * s, y: y - 104 * s, w: 88 * s, h: 34 * s }, { base: P.limewhite, light: P.limewhite, shade: mix(P.limewhite, P.neel, 0.3), lightFrom: 'right' });
  ctx.fillStyle = mix(P.tota, P.neel, 0.2);
  ctx.beginPath(); ctx.moveTo(x - 50 * s, y - 104 * s); ctx.quadraticCurveTo(x, y - 140 * s, x + 50 * s, y - 104 * s); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = P.haldi; ctx.fillRect(x - 34 * s + i * 20 * s, y - 96 * s, 10 * s, 12 * s); }
}

export function mangrove(ctx: Ctx, rng: Rng, x: number, y: number, s: number, haze = 0): void {
  const root = hz(mix(P.laterite, P.khondalite, 0.4), haze);
  for (let i = 0; i < 6; i++) {
    const rx = x + rng.range(-18, 18) * s;
    taperStroke(ctx, [{ x: rx, y }, { x: (rx + x) / 2, y: y - 14 * s }, { x, y: y - 26 * s }], 2 * s, root, 1, [0.6, 1]);
  }
  for (let i = 0; i < 9; i++) dab(ctx, x + rng.range(-22, 22) * s, y - 40 * s + rng.range(-12, 10) * s, rng.range(8, 14) * s, rng.range(6, 10) * s, 0, hz(mix(P.tota, rng.chance(0.5) ? P.neel : P.haldi, 0.25), haze), 0.95);
}

/** A tower of glass data-leaves (talapatra reborn). */
export function glassLeafTower(ctx: Ctx, x: number, y: number, s: number): void {
  for (let i = 0; i < 9; i++) {
    const ly = y - 20 * s - i * 22 * s;
    const w = (70 - i * 4) * s;
    ctx.fillStyle = withAlpha(mix(P.seafoam, P.limewhite, 0.3), 0.6);
    ctx.beginPath();
    ctx.ellipse(x + (i % 2 ? 6 : -6) * s, ly, w / 2, 7 * s, (i % 2 ? 0.08 : -0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withAlpha(P.neonCyan, 0.8);
    ctx.lineWidth = 1 * s;
    ctx.stroke();
    ctx.fillStyle = withAlpha(P.neel, 0.5);
    for (let k = 0; k < 6; k++) ctx.fillRect(x - w / 3 + k * w / 9, ly - 1, w / 14, 1.6 * s);
  }
  taperStroke(ctx, [{ x, y }, { x, y: y - 220 * s }], 3 * s, mix(P.limewhite, P.neel, 0.3), 1, [1, 1]);
}

/** A 24-spoked solar-sail wheel (Konark's wheel in orbit). */
export function solarSailWheel(ctx: Ctx, x: number, y: number, r: number, angle: number): void {
  glow(ctx, x, y, r * 1.4, P.haldi, 0.25);
  ctx.strokeStyle = P.haldi;
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.012);
  for (let i = 0; i < 24; i++) {
    const a = angle + (i / 24) * Math.PI * 2;
    ctx.strokeStyle = i % 3 ? withAlpha(P.limewhite, 0.7) : P.neonCyan;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
  }
  for (let i = 0; i < 24; i += 2) {
    const a0 = angle + (i / 24) * Math.PI * 2, a1 = angle + ((i + 1) / 24) * Math.PI * 2;
    ctx.fillStyle = withAlpha(i % 4 ? P.neel : P.neonRani, 0.35);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r * 0.96, a0, a1); ctx.closePath(); ctx.fill();
  }
  dab(ctx, x, y, r * 0.12, r * 0.12, 0, P.haldi, 1);
}

export function lampDrone(ctx: Ctx, x: number, y: number, s: number): void {
  glow(ctx, x, y, 14 * s, P.marigold, 0.7);
  dab(ctx, x, y, 3 * s, 2 * s, 0, P.haldi, 1);
  ctx.strokeStyle = withAlpha(P.limewhite, 0.8);
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath(); ctx.moveTo(x - 6 * s, y - 4 * s); ctx.lineTo(x + 6 * s, y - 4 * s); ctx.stroke();
}

export function robot(ctx: Ctx, x: number, y: number, s: number, task: 'sweep' | 'wave' = 'sweep'): void {
  dab(ctx, x, y - 4 * s, 7 * s, 4 * s, 0, P.khondalite, 1);
  ctx.fillStyle = P.limewhite;
  ctx.fillRect(x - 6 * s, y - 20 * s, 12 * s, 14 * s);
  dab(ctx, x, y - 25 * s, 6 * s, 5 * s, 0, P.limewhite, 1);
  dab(ctx, x - 2 * s, y - 25 * s, 1.2 * s, 1.2 * s, 0, P.neonCyan, 1);
  dab(ctx, x + 2 * s, y - 25 * s, 1.2 * s, 1.2 * s, 0, P.neonCyan, 1);
  if (task === 'sweep') {
    taperStroke(ctx, [{ x: x + 5 * s, y: y - 14 * s }, { x: x + 14 * s, y: y - 1 * s }], 1.2 * s, P.haldi, 1, [1, 1]);
    taperStroke(ctx, [{ x: x + 14 * s, y: y - 1 * s }, { x: x + 19 * s, y }], 3 * s, P.haldi, 1, [0.6, 1]);
  } else {
    taperStroke(ctx, [{ x: x + 5 * s, y: y - 16 * s }, { x: x + 10 * s, y: y - 26 * s }], 1.6 * s, P.limewhite, 1);
  }
}
