// Builds a record's parallax scenery and animated decor in a Phaser scene,
// plus the shared nostalgic finish (grain, warm cast, vignette).
import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';
import { P } from '../data/palettes';
import { hexToNum } from '../lib/colour';
import { DEPTH, type DecorSpec, type LayerSpec, type SceneArt } from './layers';

interface LayerView { spec: LayerSpec; imgs: Phaser.GameObjects.Image[]; width: number; baseAlpha: number }
interface DecorView { spec: DecorSpec; obj: Phaser.GameObjects.Image; extra: Phaser.GameObjects.Image[] }

const BLEND: Record<string, number> = {
  normal: Phaser.BlendModes.NORMAL,
  multiply: Phaser.BlendModes.MULTIPLY,
  screen: Phaser.BlendModes.SCREEN,
  add: Phaser.BlendModes.ADD,
};

export class RecordStage {
  readonly art: SceneArt;
  private scene: Phaser.Scene;
  private layers: LayerView[] = [];
  private decor: DecorView[] = [];
  private grain: Phaser.GameObjects.TileSprite | null = null;
  private grainTick = 0;
  reducedMotion = false;

  constructor(scene: Phaser.Scene, art: SceneArt) {
    this.scene = scene;
    this.art = art;
    for (const spec of art.layers) this.addLayer(spec);
    for (const spec of art.decor) this.addDecor(spec);
    this.addFinish();
  }

  private addLayer(spec: LayerSpec): void {
    const key = `${this.art.recordId}:${spec.name}`;
    const src = this.scene.textures.get(key).getSourceImage() as { width: number; height: number };
    // Painted layers may arrive at another resolution: fit them to the procedural height.
    const scale = spec.canvas.height / src.height;
    const width = src.width * scale;
    const count = spec.tile ? Math.ceil(GAME_W / width) + 1 : 1;
    const imgs: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < count; i++) {
      const img = this.scene.add.image(i * width, spec.y, key).setOrigin(0, 0).setScale(scale).setDepth(spec.depth);
      if (spec.blend) img.setBlendMode(BLEND[spec.blend]);
      if (spec.alpha !== undefined) img.setAlpha(spec.alpha);
      imgs.push(img);
    }
    this.layers.push({ spec, imgs, width, baseAlpha: spec.alpha ?? 1 });
  }

  private addDecor(spec: DecorSpec): void {
    let obj: Phaser.GameObjects.Image;
    const extra: Phaser.GameObjects.Image[] = [];
    switch (spec.kind) {
      case 'worker': {
        const k = (spec.phase ?? 0) > 0.3 ? 'b' : 'a';
        obj = this.scene.add.image(spec.x, spec.y, `worker:${k}0`).setOrigin(0.5, 36 / 40).setScale((spec.scale ?? 1) * 0.5).setDepth(spec.depth);
        obj.setData('k', k);
        break;
      }
      case 'smoke': {
        obj = this.scene.add.image(spec.x, spec.y, 'fx:puff').setVisible(false);
        for (let i = 0; i < 7; i++) extra.push(this.scene.add.image(spec.x, spec.y, 'fx:puff').setDepth(spec.depth).setAlpha(0));
        break;
      }
      case 'sign':
      default: {
        obj = this.scene.add.image(spec.x, spec.y, `${this.art.recordId}:sign`).setOrigin(0.5, 196 / 206).setScale(0.5).setDepth(spec.depth);
        break;
      }
    }
    this.decor.push({ spec, obj, extra });
  }

  private addFinish(): void {
    // Warm cast: a whisper of marigold multiplied over the window.
    this.scene.add.rectangle(0, 0, GAME_W, GAME_H, hexToNum(P.marigold), 0.07).setOrigin(0, 0).setDepth(DEPTH.post).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.scene.add.image(0, 0, 'fx:vignette').setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H).setDepth(DEPTH.post + 1);
    this.grain = this.scene.add.tileSprite(0, 0, GAME_W, GAME_H, 'fx:grain').setOrigin(0, 0).setDepth(DEPTH.post + 2).setAlpha(0.55);
  }

  /** Screen x for something at world-ish x on a layer that scrolls at `parallax`, repeating every `period`. */
  static wrapX(x: number, scroll: number, parallax: number, period: number, margin = 120): number {
    let sx = x - scroll * parallax;
    if (period > 0) {
      sx = ((sx % period) + period) % period;
      if (sx > GAME_W + margin) sx -= period;
    }
    return sx;
  }

  update(scroll: number, t: number): void {
    for (const L of this.layers) {
      const s = L.spec;
      if (s.tile) {
        const off = -(((scroll * s.parallax + t * (s.drift ?? 0)) % L.width) + L.width) % L.width;
        L.imgs.forEach((img, i) => img.setX(Math.round((off + i * L.width) * 2) / 2));
      }
      if (s.shimmer) {
        const a = L.baseAlpha * (1 - s.shimmer * 0.5 + s.shimmer * 0.5 * Math.sin(t * 2.3));
        L.imgs.forEach((img) => img.setAlpha(a));
        if (!this.reducedMotion) L.imgs[0].setX(Math.sin(t * 1.7) * 1.5);
      }
    }
    for (const D of this.decor) {
      const s = D.spec;
      const sx = RecordStage.wrapX(s.x, scroll, s.parallax, s.period);
      if (s.kind === 'worker') {
        const swing = Math.floor(t * 2.6 + (s.phase ?? 0) * 2) % 2;
        D.obj.setTexture(`worker:${D.obj.getData('k')}${swing}`).setX(sx);
      } else if (s.kind === 'smoke') {
        D.extra.forEach((p, k) => {
          const age = (t + k * 0.46) % 3.2;
          const life = age / 3.2;
          p.setPosition(sx + age * 7 + Math.sin(age * 2 + k) * 2.5, s.y - age * 19);
          p.setScale(0.22 + life * 0.55);
          p.setAlpha(0.5 * (1 - life) * Math.min(1, age * 4));
        });
      } else {
        D.obj.setX(sx);
      }
    }
    if (this.grain && !this.reducedMotion && ++this.grainTick % 3 === 0) {
      this.grain.tilePositionX = Math.floor(Math.random() * 256);
      this.grain.tilePositionY = Math.floor(Math.random() * 256);
    }
  }

  /** Seeded grain position for QA screenshots. */
  freezeGrain(): void {
    if (this.grain) {
      this.grain.tilePositionX = 37;
      this.grain.tilePositionY = 91;
    }
    this.reducedMotion = true;
  }
}
