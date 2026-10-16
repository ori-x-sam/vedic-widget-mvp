// Bakes a record's procedural art into Phaser textures (lazily, per record),
// swapping in painted layers from /public/art/<record>/<layer>.webp when
// they exist (§4.10).
import Phaser from 'phaser';
import painted from 'virtual:painted-art';
import { P } from '../data/palettes';
import { GAME_W, GAME_H } from '../config';
import type { SceneArt } from './layers';
import { paintR01 } from './records/r01';
import { paintTaapoiFrame } from './sprites/taapoi';
import {
  paintCowrie, paintDolphin, paintGrain, paintMud, paintPuff, paintRecordLeaf, paintReed, paintSignboard,
  paintSoftDot, paintSparkle, paintStakes, paintVignette, paintWorker,
} from './sprites/props';

export const PADDLE_FRAMES = 8;
const PAINTERS: Record<string, (seed: number) => SceneArt> = { r01: paintR01 };
const baked = new Map<string, SceneArt>();
let spritesBaked = false;

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

function addCanvas(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function bakeRecord(scene: Phaser.Scene, recordId: string, seed: number, progress: (p: number) => void = () => {}): Promise<SceneArt> {
  const hit = baked.get(recordId);
  if (hit) return hit;
  const painter = PAINTERS[recordId];
  if (!painter) throw new Error(`No art for ${recordId} yet`);
  progress(0.08);
  await frame();
  const art = painter(seed);
  progress(0.55);
  await frame();
  const available = painted[recordId] ?? [];
  for (const layer of art.layers) {
    const key = `${recordId}:${layer.name}`;
    if (available.includes(layer.name)) {
      const img = await loadImage(`art/${recordId}/${layer.name}.webp`);
      if (img) {
        if (scene.textures.exists(key)) scene.textures.remove(key);
        scene.textures.addImage(key, img);
        continue;
      }
    }
    addCanvas(scene, key, layer.canvas);
  }
  for (const d of art.decor) {
    if (d.kind === 'sign' && d.text) addCanvas(scene, `${recordId}:sign`, paintSignboard(d.text.date, d.text.title));
  }
  progress(0.7);
  await frame();
  if (!spritesBaked) {
    bakeSprites(scene);
    spritesBaked = true;
  }
  progress(1);
  baked.set(recordId, art);
  return art;
}

function bakeSprites(scene: Phaser.Scene): void {
  for (let i = 0; i < PADDLE_FRAMES; i++) addCanvas(scene, `taapoi:paddle:${i}`, paintTaapoiFrame({ kind: 'paddle', phase: i / PADDLE_FRAMES }));
  addCanvas(scene, 'taapoi:jump', paintTaapoiFrame({ kind: 'jump' }));
  addCanvas(scene, 'taapoi:hit', paintTaapoiFrame({ kind: 'hit' }));
  for (let v = 0; v < 3; v++) addCanvas(scene, `reed:${v}`, paintReed(v));
  for (let v = 0; v < 2; v++) addCanvas(scene, `mud:${v}`, paintMud(v));
  addCanvas(scene, 'stakes:0', paintStakes());
  addCanvas(scene, 'cowrie', paintCowrie());
  addCanvas(scene, 'leaf', paintRecordLeaf());
  addCanvas(scene, 'dolphin', paintDolphin());
  addCanvas(scene, 'worker:a0', paintWorker(0, P.haldi));
  addCanvas(scene, 'worker:a1', paintWorker(1, P.haldi));
  addCanvas(scene, 'worker:b0', paintWorker(0, P.limewhite));
  addCanvas(scene, 'worker:b1', paintWorker(1, P.limewhite));
  addCanvas(scene, 'fx:glow', paintSoftDot(P.haldi, 64));
  addCanvas(scene, 'fx:drop', paintSoftDot(P.limewhite, 8));
  addCanvas(scene, 'fx:foam', paintSoftDot(P.seafoam, 12));
  addCanvas(scene, 'fx:spark', paintSparkle());
  addCanvas(scene, 'fx:puff', paintPuff());
  addCanvas(scene, 'fx:grain', paintGrain(256));
  addCanvas(scene, 'fx:vignette', paintVignette(GAME_W / 2, GAME_H / 2));
}

export function bakedArt(recordId: string): SceneArt | undefined {
  return baked.get(recordId);
}
