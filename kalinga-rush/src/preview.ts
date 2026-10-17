// Dev-only scene preview: /preview.html?scene=r05&at=0.3 (not part of the build).
import { paintScene } from './art/engine';
import { composeFrame } from './art/compose';
import { SCENE_DEFS } from './art/scenes';
import { GAME_W } from './config';
import { P } from './data/palettes';

const q = new URLSearchParams(location.search);
const id = q.get('scene') ?? 'r02';
const at = Number(q.get('at') ?? '0.1');
const length = Number(q.get('len') ?? '13000');
const ctx = (document.getElementById('c') as HTMLCanvasElement).getContext('2d')!;
const def = SCENE_DEFS[id];
if (!def) {
  document.body.textContent = `No scene ${id}. Have: ${Object.keys(SCENE_DEFS).join(', ')}`;
} else {
  const t0 = performance.now();
  const art = paintScene(def(), 1);
  const ms = performance.now() - t0;
  composeFrame(ctx, art, at * length, length);
  // lane + player marker
  ctx.fillStyle = P.sindoor;
  ctx.fillRect(300 - 25, art.laneY - 70, 50, 70);
  ctx.globalAlpha = 0.6;
  ctx.fillRect(0, art.laneY, GAME_W, 1);
  (window as unknown as { __ready: unknown }).__ready = { ms, layers: art.layers.length, decor: art.decor.length };
}
