// Taapoi on screen: paddling frames, jump/hit poses, reflection, and the
// sindoor ribbon that trails in the wind.
import Phaser from 'phaser';
import { PLAYER_X } from '../../config';
import { FIXED, P } from '../../data/palettes';
import { hexToNum, mix } from '../../lib/colour';
import { PADDLE_FRAMES } from '../../art/bake';
import { DEPTH } from '../../art/layers';
import { RIBBON_ANCHOR, TAAPOI_FRAME } from '../../art/sprites/taapoi';
import type { RunnerState } from '../../systems/physics';

const RIBBON = hexToNum(FIXED.taapoi.ribbon);
/** Taapoi is drawn a little larger than her ~70% hitbox so she reads on phones. */
export const ACTOR_SCALE = 1.18;
const RIBBON_DARK = hexToNum(mix(FIXED.taapoi.ribbon, P.ink, 0.35));

export class PlayerView {
  readonly sprite: Phaser.GameObjects.Image;
  private reflection: Phaser.GameObjects.Image;
  private ribbon: Phaser.GameObjects.Graphics;
  private laneY: number;
  hitT = 0;

  constructor(scene: Phaser.Scene, laneY: number) {
    this.laneY = laneY;
    const ox = TAAPOI_FRAME.originX / TAAPOI_FRAME.w;
    const oy = TAAPOI_FRAME.originY / TAAPOI_FRAME.h;
    const s = ACTOR_SCALE / TAAPOI_FRAME.scale;
    this.reflection = scene.add.image(PLAYER_X, laneY, 'taapoi:paddle:0').setOrigin(ox, oy).setScale(s, -s * 0.8).setDepth(DEPTH.playerReflection)
      .setAlpha(0.2).setTint(hexToNum(mix(P.peacock, P.seafoam, 0.3)));
    this.ribbon = scene.add.graphics().setDepth(DEPTH.player - 0.5);
    this.sprite = scene.add.image(PLAYER_X, laneY, 'taapoi:paddle:0').setOrigin(ox, oy).setScale(s).setDepth(DEPTH.player);
  }

  update(t: number, dt: number, r: RunnerState, invuln: number, reducedMotion: boolean): void {
    this.hitT = Math.max(0, this.hitT - dt);
    const bob = r.grounded ? Math.sin(t * 3.1) * 1.8 : 0;
    const y = r.y + bob;
    let key: string;
    if (this.hitT > 0) key = 'taapoi:hit';
    else if (!r.grounded) key = 'taapoi:jump';
    else key = `taapoi:paddle:${Math.floor(t * 1.2 * PADDLE_FRAMES) % PADDLE_FRAMES}`;
    const rot = r.grounded ? Math.sin(t * 2.2) * 0.014 : Phaser.Math.Clamp(r.vy * 0.00016, -0.13, 0.13);
    this.sprite.setTexture(key).setPosition(PLAYER_X, y).setRotation(rot);
    this.sprite.setAlpha(invuln > 0 && Math.floor(t * 14) % 2 ? 0.4 : 1);

    const h = this.laneY - r.y;
    this.reflection.setTexture(key).setPosition(PLAYER_X, this.laneY + h * 0.8 + 2).setRotation(-rot);
    this.reflection.setAlpha(Math.max(0, 0.22 * (1 - h / 170)));

    this.drawRibbon(t, y, rot, r, reducedMotion);
  }

  private drawRibbon(t: number, y: number, rot: number, r: RunnerState, reducedMotion: boolean): void {
    const g = this.ribbon;
    g.clear();
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const rx = RIBBON_ANCHOR.x * ACTOR_SCALE, ry = RIBBON_ANCHOR.y * ACTOR_SCALE;
    const ax = PLAYER_X + rx * cos - ry * sin;
    const ay = y + rx * sin + ry * cos;
    const n = 10;
    const lift = r.grounded ? 0 : Phaser.Math.Clamp(r.vy * 0.012, -6, 8);
    const top: { x: number; y: number }[] = [];
    const bot: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const wave = reducedMotion ? 0 : Math.sin(t * 10 - i * 0.85) * (1.5 + i * 0.9);
      const x = ax - i * 6.2 * ACTOR_SCALE;
      const yy = ay + i * 1.4 + wave + lift * k;
      const w = 4.6 * ACTOR_SCALE * (1 - k * 0.6);
      top.push({ x, y: yy - w / 2 });
      bot.push({ x, y: yy + w / 2 });
    }
    const V = (p: { x: number; y: number }, dy = 0) => new Phaser.Math.Vector2(p.x, p.y + dy);
    g.fillStyle(RIBBON_DARK, 1);
    g.fillPoints([...top.map((p) => V(p, 1.2)), ...bot.slice().reverse().map((p) => V(p, 1.2))], true);
    g.fillStyle(RIBBON, 1);
    g.fillPoints([...top.map((p) => V(p)), ...bot.slice().reverse().map((p) => V(p))], true);
    // forked tail
    const end = top[n];
    g.fillTriangle(end.x, end.y, end.x - 7, end.y - 3, end.x - 3, end.y + 4);
    g.fillTriangle(end.x, end.y + 3, end.x - 7, end.y + 7, end.x - 2, end.y);
  }
}
