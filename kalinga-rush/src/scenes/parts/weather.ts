// Mechanic overlays for a record: dark stretches lit only around Taapoi,
// rain, wind streaks over gust zones (telegraphed before you reach them), and
// the glowing cyclone shelters that are also checkpoints.
import Phaser from 'phaser';
import { GAME_W, GAME_H, PLAYER_X } from '../../config';
import { P } from '../../data/palettes';
import { hexToNum } from '../../lib/colour';
import { DEPTH } from '../../art/layers';
import type { Level, Zone } from '../../systems/sim';

const RAMP = 260; // px over which darkness fades in/out at a zone's edges

export class Weather {
  private level: Level;
  private dark: Phaser.GameObjects.Image | null = null;
  private rain: Phaser.GameObjects.TileSprite | null = null;
  private winds: { z: Zone; img: Phaser.GameObjects.TileSprite }[] = [];
  private shelters: { z: Zone; img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }[] = [];
  darkness = 0;

  constructor(scene: Phaser.Scene, level: Level, o: { rain?: boolean; night?: boolean; reduced: boolean }) {
    this.level = level;
    for (const z of level.zones) {
      if (z.kind === 'dark' && !this.dark) {
        this.dark = scene.add.image(PLAYER_X, GAME_H / 2, 'fx:dark').setScale(2).setDepth(DEPTH.entities - 0.6).setAlpha(0);
      } else if (z.kind === 'wind') {
        const boost = (z.lift ?? 0) > 0;
        const img = scene.add.tileSprite(0, 0, 10, GAME_H, boost ? 'fx:windBoost' : 'fx:wind').setOrigin(0, 0).setDepth(DEPTH.particles - 0.5).setAlpha(0);
        this.winds.push({ z, img });
      } else if (z.kind === 'shelter') {
        const glow = scene.add.image(0, level.laneY - 90, 'fx:glow').setScale(5, 2.6).setAlpha(0.5).setDepth(DEPTH.near + 0.6);
        const img = scene.add.image(0, level.laneY - 6, 'fx:shelter').setOrigin(0.5, 1).setScale(0.62).setDepth(DEPTH.near + 0.7);
        this.shelters.push({ z, img, glow });
      }
    }
    if (o.night) scene.add.rectangle(0, 0, GAME_W, GAME_H, hexToNum(P.neel), 0.12).setOrigin(0, 0).setDepth(DEPTH.fore + 0.5).setBlendMode(Phaser.BlendModes.MULTIPLY);
    if (o.rain) this.rain = scene.add.tileSprite(0, 0, GAME_W, GAME_H, 'fx:rain').setOrigin(0, 0).setDepth(DEPTH.fore + 0.6).setAlpha(o.reduced ? 0.25 : 0.55);
  }

  update(scroll: number, t: number, playerX: number, playerY: number, reduced: boolean): void {
    const px = scroll + playerX;
    // darkness: smooth ramp at both ends of each dark zone
    let d = 0;
    for (const z of this.level.zones) {
      if (z.kind !== 'dark') continue;
      const k = Math.min((px - z.x0 + RAMP) / RAMP, (z.x1 + RAMP - px) / RAMP);
      d = Math.max(d, Math.max(0, Math.min(1, k)));
    }
    this.darkness = d;
    if (this.dark) this.dark.setAlpha(d * 0.78).setPosition(playerX, playerY - 40);
    if (this.rain && !reduced) {
      this.rain.tilePositionX = -t * 160;
      this.rain.tilePositionY = -t * 620;
    }
    for (const w of this.winds) {
      const x0 = w.z.x0 - scroll, x1 = w.z.x1 - scroll;
      const vis = x1 > 0 && x0 < GAME_W && x1 > x0;
      w.img.setVisible(vis);
      if (!vis) continue;
      const a = Math.max(0, Math.min(1, (GAME_W + 40 - x0) / 300));
      w.img.setPosition(Math.max(0, x0), 0).setSize(Math.max(1, Math.min(GAME_W, x1) - Math.max(0, x0)), GAME_H).setAlpha(0.75 * a);
      const boost = (w.z.lift ?? 0) > 0;
      w.img.tilePositionX = (boost ? -1 : 1) * (t * 900) + Math.max(0, x0);
      w.img.tilePositionY = boost ? t * 220 : 0;
    }
    for (const s of this.shelters) {
      const cx = (s.z.x0 + s.z.x1) / 2 - scroll;
      s.img.setX(cx);
      s.glow.setX(cx).setAlpha(0.42 + Math.sin(t * 2.5) * 0.08);
    }
  }
}
