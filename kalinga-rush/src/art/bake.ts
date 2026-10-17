// Bakes a record's art into Phaser textures lazily, one record at a time:
// its parallax layers (hand-built r01, or composed by the scene engine),
// landmarks and signboard, the hazards it uses, and the ride. Painted layers
// from /public/art/<record>/<layer>.webp replace procedural ones when they
// exist (§4.10). Old records are released to keep memory low on phones.
import Phaser from 'phaser';
import painted from 'virtual:painted-art';
import { P, FIXED } from '../data/palettes';
import { mix } from '../lib/colour';
import { GAME_W, GAME_H } from '../config';
import { RECORDS } from '../data/records';
import type { Arch } from '../data/hazards';
import type { VehicleId } from '../systems/physics';
import type { SceneArt } from './layers';
import { paintScene } from './engine';
import { SCENE_DEFS } from './scenes';
import { paintR01 } from './records/r01';
import { paintRide, RIDE_SCALE } from './sprites/rides';
import { paintFriend, paintHazard, paintRecordVis, hazardVariants } from './sprites/hazards';
import { paintFxDark, paintFxRain, paintFxWind, paintPaperBoat, paintShelter } from './sprites/fx';
import {
  paintCowrie, paintDolphin, paintGrain, paintPuff, paintRecordLeaf, paintSignboard,
  paintSoftDot, paintSparkle, paintVignette, paintWorker, ORIGIN,
} from './sprites/props';

export interface RideInfo { frames: number; ox: number; oy: number; ribbon: { x: number; y: number }; cycleHz: number; scale: number }

const baked = new Map<string, SceneArt>();
const keysOf = new Map<string, string[]>();
const rides = new Map<VehicleId, RideInfo>();
const origins = new Map<string, [number, number]>();
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

function paintArt(recordId: string, seed: number): SceneArt {
  if (recordId === 'r01') return paintR01(seed);
  const def = SCENE_DEFS[recordId];
  if (!def) throw new Error(`No scene for ${recordId}`);
  return paintScene(def(), seed);
}

export function isBaked(recordId: string): boolean {
  return baked.has(recordId);
}

export async function bakeRecord(scene: Phaser.Scene, recordId: string, seed: number, progress: (p: number) => void = () => {}): Promise<SceneArt> {
  const hit = baked.get(recordId);
  if (hit) return hit;
  if (!spritesBaked) {
    bakeSprites(scene);
    spritesBaked = true;
  }
  progress(0.08);
  await frame();
  const art = paintArt(recordId, seed);
  progress(0.55);
  await frame();
  const keys: string[] = [];
  const available = painted[recordId] ?? [];
  for (const layer of art.layers) {
    const key = `${recordId}:${layer.name}`;
    keys.push(key);
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
  art.decor.forEach((d, i) => {
    if (d.kind === 'sign' && d.text) {
      addCanvas(scene, `${recordId}:sign`, paintSignboard(d.text.date, d.text.title));
      keys.push(`${recordId}:sign`);
    } else if (d.kind === 'landmark' && d.canvas) {
      addCanvas(scene, `${recordId}:lm${i}`, d.canvas);
      keys.push(`${recordId}:lm${i}`);
    }
  });
  progress(0.75);
  await frame();
  bakeRecordSprites(scene, recordId);
  progress(1);
  baked.set(recordId, art);
  keysOf.set(recordId, keys);
  return art;
}

/** Drop a record's layer textures (sprites stay; they are small and shared). */
export function releaseRecord(scene: Phaser.Scene, recordId: string): void {
  for (const k of keysOf.get(recordId) ?? []) if (scene.textures.exists(k)) scene.textures.remove(k);
  keysOf.delete(recordId);
  baked.delete(recordId);
}

/** Keep only these records baked. */
export function keepOnly(scene: Phaser.Scene, ids: string[]): void {
  for (const id of [...baked.keys()]) if (!ids.includes(id)) releaseRecord(scene, id);
}

export function hazardKey(vis: string, variant: number): string {
  return `hz:${vis}:${variant % Math.max(1, hazardVariants(vis))}`;
}

export function originOf(key: string): [number, number] {
  return origins.get(key) ?? [0.5, 1];
}

export function rideInfo(id: VehicleId): RideInfo {
  return rides.get(id)!;
}

function bakeRecordSprites(scene: Phaser.Scene, recordId: string): void {
  const rec = RECORDS[recordId];
  for (const [arch, vis] of Object.entries(rec.hazards) as [Arch, string][]) {
    const n = Math.max(1, hazardVariants(vis));
    for (let v = 0; v < n; v++) {
      const key = `hz:${vis}:${v}`;
      if (scene.textures.exists(key)) continue;
      const s = paintHazard(vis, arch, v);
      addCanvas(scene, key, s.canvas);
      origins.set(key, [s.ox, s.oy]);
    }
  }
  if (rec.recordVis && rec.recordVis !== 'leaf') {
    const key = `rec:${rec.recordVis}`;
    if (!scene.textures.exists(key)) {
      const s = paintRecordVis(rec.recordVis);
      addCanvas(scene, key, s.canvas);
      origins.set(key, [s.ox, s.oy]);
    }
  }
  if (rec.friends === 'kirtan' || rec.friends === 'turtle') {
    for (let v = 0; v < 3; v++) {
      const key = `friend:${rec.friends}:${v}`;
      if (scene.textures.exists(key)) continue;
      const s = paintFriend(rec.friends, v);
      addCanvas(scene, key, s.canvas);
      origins.set(key, [s.ox, s.oy]);
    }
  }
  bakeRide(scene, rec.ride);
}

export function bakeRide(scene: Phaser.Scene, id: VehicleId): RideInfo {
  const have = rides.get(id);
  if (have) return have;
  const r = paintRide(id);
  r.frames.forEach((c, i) => addCanvas(scene, `ride:${id}:${i}`, c));
  addCanvas(scene, `ride:${id}:jump`, r.jump);
  addCanvas(scene, `ride:${id}:hit`, r.hit);
  const info: RideInfo = { frames: r.frames.length, ox: r.ox, oy: r.oy, ribbon: r.ribbon, cycleHz: r.cycleHz, scale: RIDE_SCALE };
  rides.set(id, info);
  return info;
}

function bakeSprites(scene: Phaser.Scene): void {
  addCanvas(scene, 'cowrie', paintCowrie());
  addCanvas(scene, 'leaf', paintRecordLeaf());
  origins.set('leaf', [ORIGIN.leaf().x, ORIGIN.leaf().y]);
  addCanvas(scene, 'dolphin', paintDolphin());
  addCanvas(scene, 'worker:a0', paintWorker(0, P.haldi));
  addCanvas(scene, 'worker:a1', paintWorker(1, P.haldi));
  addCanvas(scene, 'worker:b0', paintWorker(0, P.limewhite));
  addCanvas(scene, 'worker:b1', paintWorker(1, P.limewhite));
  addCanvas(scene, 'fx:glow', paintSoftDot(P.haldi, 64));
  addCanvas(scene, 'fx:glowCyan', paintSoftDot(P.neonCyan, 64));
  addCanvas(scene, 'fx:drop', paintSoftDot(P.limewhite, 8));
  addCanvas(scene, 'fx:foam', paintSoftDot(P.seafoam, 12));
  addCanvas(scene, 'fx:dust', paintSoftDot(mix(P.chandan, P.laterite, 0.3), 10));
  addCanvas(scene, 'fx:ember', paintSoftDot(FIXED.diya.flame, 10));
  addCanvas(scene, 'fx:spark', paintSparkle());
  addCanvas(scene, 'fx:puff', paintPuff());
  addCanvas(scene, 'fx:grain', paintGrain(256));
  addCanvas(scene, 'fx:vignette', paintVignette(GAME_W / 2, GAME_H / 2));
  addCanvas(scene, 'fx:dark', paintFxDark());
  addCanvas(scene, 'fx:rain', paintFxRain());
  addCanvas(scene, 'fx:wind', paintFxWind(false));
  addCanvas(scene, 'fx:windBoost', paintFxWind(true));
  addCanvas(scene, 'fx:shelter', paintShelter());
  addCanvas(scene, 'fx:paperBoat', paintPaperBoat());
}

export function bakedArt(recordId: string): SceneArt | undefined {
  return baked.get(recordId);
}
