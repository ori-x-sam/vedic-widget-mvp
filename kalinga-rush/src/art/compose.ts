// Static compositor: draws a baked SceneArt to a 2D canvas at a given scroll,
// the same way RecordStage places it. Used by the scene preview page and QA.
import { GAME_H, GAME_W } from '../config';
import { decorAtX, type SceneArt } from './layers';

export function composeFrame(ctx: CanvasRenderingContext2D, art: SceneArt, scroll: number, length: number, t = 0): void {
  ctx.clearRect(0, 0, GAME_W, GAME_H);
  type Item = { depth: number; draw: () => void };
  const items: Item[] = [];
  for (const L of art.layers) {
    if (L.name.endsWith(':toned') === false && art.layers.some((o) => o.name === `${L.name}:toned`)) continue;
    items.push({
      depth: L.depth,
      draw: () => {
        ctx.globalAlpha = L.alpha ?? 1;
        ctx.globalCompositeOperation = L.blend === 'screen' ? 'screen' : L.blend === 'multiply' ? 'multiply' : L.blend === 'add' ? 'lighter' : 'source-over';
        const w = L.canvas.width;
        if (L.tile) {
          const off = -((((scroll * L.parallax + t * (L.drift ?? 0)) % w) + w) % w);
          for (let x = off; x < GAME_W; x += w) ctx.drawImage(L.canvas, x, L.y);
        } else ctx.drawImage(L.canvas, 0, L.y);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      },
    });
  }
  for (const D of art.decor) {
    if (D.kind !== 'landmark' || !D.canvas) continue;
    const c = D.canvas;
    const [ox, oy] = D.origin ?? [0.5, 1];
    const x = decorAtX(D.at ?? 0, length, D.parallax, GAME_W) - scroll * D.parallax;
    items.push({ depth: D.depth, draw: () => ctx.drawImage(c, x - c.width * ox * (D.scale ?? 1), D.y - c.height * oy * (D.scale ?? 1), c.width * (D.scale ?? 1), c.height * (D.scale ?? 1)) });
  }
  items.sort((a, b) => a.depth - b.depth).forEach((i) => i.draw());
}
