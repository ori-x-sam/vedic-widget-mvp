// Weather and mechanic textures: the lamplight mask for dark stretches,
// rain streaks, wind streaks (push = storm grey, boost = radium cyan) and the
// glowing cyclone shelter that doubles as a checkpoint.
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { Rng } from '../../lib/rng';
import { glow, makeCanvas, taperStroke, wrapped } from '../brush';
import { cycloneShelter } from '../kit/buildings';
import { person } from '../kit/people';

/** Darkness with a soft warm hole (displayed ×2, centred on Taapoi). */
export function paintFxDark(): HTMLCanvasElement {
  const W = 1280, H = 720;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = mix(P.neel, P.ink, 0.55);
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-out';
  const g = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 150);
  g.addColorStop(0, withAlpha(P.ink, 1));
  g.addColorStop(0.55, withAlpha(P.ink, 0.85));
  g.addColorStop(1, withAlpha(P.ink, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  // a warm lamplight rim
  const w = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 170);
  w.addColorStop(0, withAlpha(P.marigold, 0));
  w.addColorStop(0.7, withAlpha(P.marigold, 0.08));
  w.addColorStop(1, withAlpha(P.marigold, 0));
  ctx.fillStyle = w;
  ctx.fillRect(0, 0, W, H);
  return c;
}

export function paintFxRain(): HTMLCanvasElement {
  const S = 256;
  const [c, ctx] = makeCanvas(S, S);
  const rng = new Rng('rain');
  for (let i = 0; i < 70; i++) {
    const x = rng.next() * S, y = rng.next() * S, l = rng.range(14, 30);
    wrapped(S, x, 20, (xx) => {
      for (const dy of [0, -S, S]) taperStroke(ctx, [{ x: xx, y: y + dy }, { x: xx - l * 0.28, y: y + dy + l }], rng.range(0.8, 1.6), mix(P.limewhite, P.seafoam, 0.3), rng.range(0.25, 0.55), [0.3, 0.3]);
    });
  }
  return c;
}

export function paintFxWind(boost: boolean): HTMLCanvasElement {
  const W = 512, H = 360;
  const [c, ctx] = makeCanvas(W, H);
  const rng = new Rng(`wind:${boost}`);
  const col = boost ? P.neonCyan : mix(P.limewhite, P.khondalite, 0.25);
  for (let i = 0; i < 46; i++) {
    const y = rng.range(6, H - 6), x = rng.next() * W, l = rng.range(50, 150);
    const lift = boost ? -l * 0.25 : rng.range(-4, 4);
    wrapped(W, x, l, (xx) => taperStroke(ctx, [{ x: xx - l / 2, y: y - lift / 2 }, { x: xx, y: y + rng.range(-3, 3) }, { x: xx + l / 2, y: y + lift / 2 }], rng.range(1.4, 3.2), col, rng.range(0.3, 0.7), [0.6, 0.2]));
  }
  return c;
}

/** A cyclone shelter on stilts, windows lit, a little queue going in. Origin bottom-centre. */
export function paintShelter(): HTMLCanvasElement {
  const W = 420, H = 300;
  const [c, ctx] = makeCanvas(W, H);
  const rng = new Rng('shelter');
  glow(ctx, W / 2, H - 120, 200, P.haldi, 0.35);
  cycloneShelter(ctx, rng, W / 2, H - 4, 1.6, true);
  person(ctx, W / 2 - 120, H - 4, 1.3, { pose: 'walk', cloth: P.rani, sari: true, head: 'veil', facing: 1 });
  person(ctx, W / 2 - 96, H - 4, 1.0, { pose: 'walk', cloth: P.haldi, facing: 1 });
  person(ctx, W / 2 + 112, H - 4, 1.3, { pose: 'wave', cloth: P.peacock, head: 'cap', facing: -1 });
  return c;
}

/** A child's tiny paper boita with a lamp, for the finale (origin centre). */
export function paintPaperBoat(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(160, 120);
  ctx.scale(2, 2);
  const paper = mix(P.limewhite, P.skyCream, 0.3);
  const fold = mix(P.limewhite, P.khondalite, 0.25);
  ctx.fillStyle = fold;
  ctx.beginPath(); ctx.moveTo(8, 34); ctx.lineTo(72, 34); ctx.lineTo(60, 46); ctx.lineTo(20, 46); ctx.closePath(); ctx.fill();
  ctx.fillStyle = paper;
  ctx.beginPath(); ctx.moveTo(18, 34); ctx.lineTo(40, 6); ctx.lineTo(62, 34); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = withAlpha(mix(P.khondalite, P.ink, 0.3), 0.6);
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(40, 6); ctx.lineTo(40, 34); ctx.stroke();
  // the little diya on deck
  ctx.fillStyle = P.laterite;
  ctx.beginPath(); ctx.ellipse(52, 33, 5, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  glow(ctx, 52, 27, 10, P.marigold, 0.6);
  ctx.fillStyle = P.marigold;
  ctx.beginPath(); ctx.moveTo(52, 22); ctx.quadraticCurveTo(55, 28, 52, 31); ctx.quadraticCurveTo(49, 28, 52, 22); ctx.fill();
  return c;
}
