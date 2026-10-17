// Picture-reader animals: elephants (plain or caparisoned), cows and
// bullocks, monkeys, horses, goats, crows, turtles, cats.
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { clipTo, dab, taperStroke, type Ctx } from '../brush';

const Hf = (haze: number) => (c: string) => (haze ? mix(c, P.skyCream, haze) : c);

export interface ElephantOpts { facing?: 1 | -1; haze?: number; caparison?: [string, string]; howdah?: boolean; phase?: number; trunkUp?: boolean }

/** Side-view elephant standing on (x, y), about 60·s px tall. */
export function elephant(ctx: Ctx, x: number, y: number, s: number, o: ElephantOpts = {}): void {
  const f = o.facing ?? 1;
  const H = Hf(o.haze ?? 0);
  const body = H(mix(P.khondalite, P.neel, 0.12));
  const light = H(mix(P.khondalite, P.limewhite, 0.3));
  const dark = H(mix(P.khondalite, P.ink, 0.35));
  const ph = o.phase ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f * s, s);
  // legs (far pair darker)
  const leg = (lx: number, c: string, sw: number) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(lx - 5, -26);
    ctx.lineTo(lx - 5 + sw, -1);
    ctx.lineTo(lx + 5 + sw, -1);
    ctx.lineTo(lx + 5, -26);
    ctx.closePath();
    ctx.fill();
    dab(ctx, lx + sw, -1.5, 6, 2, 0, light, 0.7);
  };
  const sw = Math.sin(ph) * 2;
  leg(-20, dark, -sw);
  leg(14, dark, sw);
  // body
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(-32, -22);
    ctx.bezierCurveTo(-36, -50, -10, -62, 12, -56);
    ctx.bezierCurveTo(28, -52, 34, -40, 32, -24);
    ctx.bezierCurveTo(20, -16, -20, -14, -32, -22);
    ctx.closePath();
  };
  bodyPath();
  ctx.fillStyle = body;
  ctx.fill();
  clipTo(ctx, bodyPath, () => {
    const g = ctx.createLinearGradient(0, -62, 0, -14);
    g.addColorStop(0, withAlpha(light, 0.6));
    g.addColorStop(1, withAlpha(dark, 0.5));
    ctx.fillStyle = g;
    ctx.fillRect(-40, -64, 80, 52);
  });
  leg(-14, body, sw);
  leg(22, body, -sw);
  // tail
  taperStroke(ctx, [{ x: -32, y: -42 }, { x: -38, y: -30 }, { x: -37, y: -20 }], 2, dark, 1, [1, 0.4]);
  // head + ear + trunk
  dab(ctx, 34, -46, 14, 13, 0, body, 1);
  dab(ctx, 26, -44, 9, 12, -0.2, mix(body, P.chandan, 0.15), 1);
  const trunk = o.trunkUp
    ? [{ x: 44, y: -42 }, { x: 54, y: -50 }, { x: 58, y: -64 }]
    : [{ x: 44, y: -42 }, { x: 50, y: -26 }, { x: 48, y: -8 }];
  taperStroke(ctx, trunk, 9, body, 1, [1, 0.55]);
  taperStroke(ctx, [{ x: 44, y: -38 }, { x: 52, y: -36 }], 2.4, H(P.limewhite), 1, [1, 0.3]); // tusk
  dab(ctx, 38, -50, 1.6, 1.8, 0, H(P.ink), 1);
  if (o.caparison) {
    const [a, b] = o.caparison.map(H);
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.moveTo(-26, -54);
    ctx.quadraticCurveTo(0, -62, 22, -55);
    ctx.lineTo(24, -30);
    ctx.quadraticCurveTo(0, -24, -26, -30);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 6; i++) dab(ctx, -22 + i * 9, -30, 3, 3.4, 0, b, 1);
    ctx.fillStyle = b;
    ctx.fillRect(-25, -46, 48, 3);
    // head cloth
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.moveTo(30, -58);
    ctx.lineTo(46, -52);
    ctx.lineTo(46, -36);
    ctx.lineTo(38, -40);
    ctx.closePath();
    ctx.fill();
    dab(ctx, 42, -46, 2, 2, 0, b, 1);
  }
  if (o.howdah) {
    ctx.fillStyle = H(P.haldi);
    ctx.fillRect(-14, -74, 30, 14);
    ctx.fillStyle = H(P.sindoor);
    ctx.fillRect(-14, -66, 30, 3);
    taperStroke(ctx, [{ x: -10, y: -74 }, { x: -10, y: -90 }], 1.4, H(P.laterite), 1, [1, 1]);
    taperStroke(ctx, [{ x: 12, y: -74 }, { x: 12, y: -90 }], 1.4, H(P.laterite), 1, [1, 1]);
    ctx.fillStyle = H(P.sindoor);
    ctx.beginPath();
    ctx.moveTo(-14, -88);
    ctx.quadraticCurveTo(1, -100, 16, -88);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export interface CowOpts { facing?: 1 | -1; haze?: number; colour?: string; humped?: boolean; phase?: number; grazing?: boolean }

/** Cow / bullock standing on (x, y), about 30·s px tall. */
export function cow(ctx: Ctx, x: number, y: number, s: number, o: CowOpts = {}): void {
  const f = o.facing ?? 1;
  const H = Hf(o.haze ?? 0);
  const c = H(o.colour ?? P.limewhite);
  const d = H(mix(o.colour ?? P.limewhite, P.khondalite, 0.45));
  const sw = Math.sin(o.phase ?? 0) * 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f * s, s);
  for (const [lx, sh] of [[-12, -sw], [-7, sw], [9, sw], [14, -sw]] as const) taperStroke(ctx, [{ x: lx, y: -14 }, { x: lx + sh, y: 0 }], 3, d, 1, [1, 0.8]);
  dab(ctx, 0, -18, 17, 8, 0, c, 1);
  dab(ctx, -2, -14, 13, 4, 0, d, 0.35);
  if (o.humped !== false) dab(ctx, 10, -25, 4.5, 4, 0, c, 1);
  const hy = o.grazing ? -8 : -24;
  taperStroke(ctx, [{ x: 13, y: -20 }, { x: 19, y: hy + 2 }], 6, c, 1, [1, 0.9]);
  dab(ctx, 21, hy, 4.6, 3.4, o.grazing ? 0.8 : 0.3, c, 1);
  taperStroke(ctx, [{ x: 19, y: hy - 3 }, { x: 17, y: hy - 8 }], 1.4, d, 1, [1, 0.3]);
  taperStroke(ctx, [{ x: 22, y: hy - 3 }, { x: 24, y: hy - 8 }], 1.4, d, 1, [1, 0.3]);
  dab(ctx, 22, hy - 0.5, 0.8, 0.8, 0, H(P.ink), 1);
  taperStroke(ctx, [{ x: -16, y: -20 }, { x: -20, y: -12 }, { x: -19, y: -5 }], 1.4, d, 1, [1, 0.5]);
  ctx.restore();
}

export function monkey(ctx: Ctx, x: number, y: number, s: number, facing: 1 | -1 = 1, haze = 0, holding?: string): void {
  const H = Hf(haze);
  const fur = H(mix(P.khondalite, P.chandan, 0.45));
  const face = H(mix(P.chandan, P.rani, 0.2));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  taperStroke(ctx, [{ x: -6, y: -8 }, { x: -16, y: -14 }, { x: -18, y: -26 }, { x: -14, y: -30 }], 2, fur, 1, [1, 0.4]);
  dab(ctx, 0, -9, 7, 8, 0, fur, 1);
  taperStroke(ctx, [{ x: -3, y: -3 }, { x: -5, y: 0 }], 2.6, fur, 1);
  taperStroke(ctx, [{ x: 3, y: -3 }, { x: 5, y: 0 }], 2.6, fur, 1);
  dab(ctx, 3, -20, 5.4, 5.2, 0, fur, 1);
  dab(ctx, 5, -19, 3.4, 3.2, 0, face, 1);
  dab(ctx, 6, -20, 0.7, 0.7, 0, H(P.ink), 1);
  taperStroke(ctx, [{ x: 4, y: -10 }, { x: 10, y: -14 }], 2.2, fur, 1);
  if (holding) dab(ctx, 11, -15, 3.4, 1.6, -0.6, H(holding), 1);
  ctx.restore();
}

export function horse(ctx: Ctx, x: number, y: number, s: number, colour: string, facing: 1 | -1 = 1, haze = 0, phase = 0): void {
  const H = Hf(haze);
  const c = H(colour);
  const d = H(mix(colour, P.ink, 0.3));
  const sw = Math.sin(phase) * 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  for (const [lx, sh] of [[-13, sw], [-8, -sw], [9, -sw], [14, sw]] as const) taperStroke(ctx, [{ x: lx, y: -17 }, { x: lx + sh, y: -8 }, { x: lx + sh * 0.6, y: 0 }], 2.6, d, 1, [1, 0.7]);
  dab(ctx, 0, -22, 17, 7.5, 0, c, 1);
  taperStroke(ctx, [{ x: 12, y: -25 }, { x: 18, y: -36 }], 7, c, 1, [1, 0.8]);
  dab(ctx, 22, -37, 6, 3.4, 0.5, c, 1);
  taperStroke(ctx, [{ x: 13, y: -30 }, { x: 16, y: -40 }], 2.4, d, 1);
  taperStroke(ctx, [{ x: -16, y: -24 }, { x: -24, y: -16 }, { x: -22, y: -8 }], 2.4, d, 1, [1, 0.4]);
  dab(ctx, 21, -39, 0.8, 0.8, 0, H(P.ink), 1);
  ctx.restore();
}

export function goat(ctx: Ctx, x: number, y: number, s: number, facing: 1 | -1 = 1, haze = 0, eating?: string): void {
  const H = Hf(haze);
  const c = H(mix(P.limewhite, P.khondalite, 0.15));
  const d = H(P.khondalite);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  for (const lx of [-8, -4, 6, 9]) taperStroke(ctx, [{ x: lx, y: -9 }, { x: lx, y: 0 }], 1.8, d, 1);
  dab(ctx, 0, -12, 11, 5, 0, c, 1);
  taperStroke(ctx, [{ x: 8, y: -14 }, { x: 13, y: -19 }], 4, c, 1);
  dab(ctx, 15, -19, 3.6, 2.6, 0.4, c, 1);
  taperStroke(ctx, [{ x: 13, y: -21 }, { x: 10, y: -26 }], 1.2, d, 1, [1, 0.3]);
  dab(ctx, 17, -15.5, 1, 2, 0, d, 1);
  if (eating) {
    ctx.fillStyle = H(eating);
    ctx.fillRect(18, -20, 9, 6);
  }
  ctx.restore();
}

export function crow(ctx: Ctx, x: number, y: number, s: number, facing: 1 | -1 = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  dab(ctx, 0, -5, 5, 3.4, -0.2, P.ink, 1);
  dab(ctx, 4.5, -8, 2.6, 2.4, 0, P.ink, 1);
  taperStroke(ctx, [{ x: 6.5, y: -8 }, { x: 9.5, y: -7.5 }], 1.4, P.khondalite, 1, [1, 0.2]);
  taperStroke(ctx, [{ x: -4, y: -5 }, { x: -9, y: -3 }], 2.4, P.ink, 1, [1, 0.3]);
  taperStroke(ctx, [{ x: 0, y: -2 }, { x: 0, y: 1 }], 0.8, P.ink, 1);
  ctx.restore();
}

export function cat(ctx: Ctx, x: number, y: number, s: number, colour: string, facing: 1 | -1 = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  taperStroke(ctx, [{ x: -6, y: -3 }, { x: -12, y: -6 }, { x: -12, y: -14 }], 2, colour, 1, [1, 0.5]);
  dab(ctx, 0, -6, 7, 5.6, 0, colour, 1);
  dab(ctx, 5, -13, 4, 3.6, 0, colour, 1);
  ctx.fillStyle = colour;
  ctx.beginPath(); ctx.moveTo(2.4, -15.5); ctx.lineTo(3.4, -19.5); ctx.lineTo(5, -16); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(5.6, -16); ctx.lineTo(7.6, -19.5); ctx.lineTo(8, -15); ctx.closePath(); ctx.fill();
  dab(ctx, 6.4, -13.4, 0.7, 0.9, 0, P.tota, 1);
  ctx.restore();
}

export function turtle(ctx: Ctx, x: number, y: number, s: number, glow = false): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const shell = mix(P.tota, P.khondalite, 0.45);
  for (const [fx, fy] of [[-6, -1], [6, -1]]) dab(ctx, fx, fy, 3, 1.4, fx > 0 ? 0.5 : -0.5, mix(shell, P.limewhite, 0.2), 1);
  dab(ctx, 0, -3, 7, 4, 0, shell, 1);
  dab(ctx, -1, -4, 4, 2, 0, mix(shell, P.haldi, 0.3), 0.6);
  dab(ctx, 8, -2.6, 2.4, 2, 0, mix(shell, P.limewhite, 0.2), 1);
  if (glow) dab(ctx, 0, -14, 2, 2, 0, P.haldi, 1);
  ctx.restore();
}
