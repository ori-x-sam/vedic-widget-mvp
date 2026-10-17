// Odia-letter platforms (Record 34): a school slate plank with a big chalk
// letter from the alphabet chart. Origin: top-centre of the plank's top edge
// sits 10 px (×2) below the canvas top.
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { makeCanvas, softShadow } from '../brush';

export function paintLetterPlatform(glyph: string, width: number): HTMLCanvasElement {
  const S = 2;
  const W = Math.round(width) + 8;
  const H = 70;
  const [c, ctx] = makeCanvas(W * S, H * S);
  ctx.scale(S, S);
  const x0 = 4, top = 5, h = 22;
  softShadow(ctx, W / 2, top + h + 30, width * 0.45, 8, P.ink, 0.25);
  // plank: slate with a wooden rim
  ctx.fillStyle = mix(P.laterite, P.ink, 0.35);
  ctx.beginPath();
  ctx.roundRect(x0 - 2, top - 2, width + 4, h + 4, 6);
  ctx.fill();
  ctx.fillStyle = mix(P.neel, P.ink, 0.55);
  ctx.beginPath();
  ctx.roundRect(x0 + 2, top + 2, width - 4, h - 4, 4);
  ctx.fill();
  ctx.fillStyle = withAlpha(P.limewhite, 0.18);
  ctx.fillRect(x0 + 4, top + 3, width - 8, 2);
  // chalk ruling
  ctx.strokeStyle = withAlpha(P.limewhite, 0.25);
  ctx.lineWidth = 0.8;
  for (let x = x0 + 14; x < x0 + width - 10; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, top + 6); ctx.lineTo(x + 8, top + 6); ctx.stroke();
  }
  // the letter hangs below the plank like a sign, big and chalky
  ctx.fillStyle = mix(P.limewhite, P.haldi, 0.15);
  ctx.font = "700 34px 'Baloo Bhaina 2', serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = mix(P.rani, P.ink, 0.1);
  ctx.fillText(glyph, W / 2 + 1.5, top + h - 3 + 1.5);
  ctx.fillStyle = mix(P.limewhite, P.haldi, 0.2);
  ctx.fillText(glyph, W / 2, top + h - 3);
  return c;
}
