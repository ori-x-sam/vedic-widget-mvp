// Taapoi on screen, on whatever she rides this record: the ride's animation
// cycle, jump/hit poses, a reflection on water, the gravity flip in orbit,
// and the sindoor ribbon that trails in the wind.
import Phaser from 'phaser';
import { PLAYER_X } from '../../config';
import { FIXED, P } from '../../data/palettes';
import { hexToNum, mix } from '../../lib/colour';
import { rideInfo, type RideInfo } from '../../art/bake';
import { DEPTH } from '../../art/layers';
import type { RideMode, RunnerState, VehicleId } from '../../systems/physics';

const RIBBON = hexToNum(FIXED.taapoi.ribbon);
/** Taapoi is drawn a little larger than her hitbox so she reads on phones. */
export const ACTOR_SCALE = 1.18;
const RIBBON_DARK = hexToNum(mix(FIXED.taapoi.ribbon, P.ink, 0.35));

export interface PlayerOpts { ride: VehicleId; mode: RideMode; laneY: number; water: boolean; scale?: number }

export class PlayerView {
  readonly sprite: Phaser.GameObjects.Image;
  private reflection: Phaser.GameObjects.Image | null = null;
  private ribbon: Phaser.GameObjects.Graphics;
  private info: RideInfo;
  private o: PlayerOpts;
  private flip = 1;
  private s: number;
  hitT = 0;
  x = PLAYER_X;

  constructor(scene: Phaser.Scene, o: PlayerOpts) {
    this.o = o;
    this.info = rideInfo(o.ride);
    const I = this.info;
    this.s = (ACTOR_SCALE * (o.scale ?? 1)) / I.scale;
    const key = this.key(0, true, false);
    const tex = scene.textures.get(key).getSourceImage() as { width: number; height: number };
    const ox = (I.ox * I.scale) / tex.width;
    const oy = (I.oy * I.scale) / tex.height;
    if (o.water) {
      this.reflection = scene.add.image(PLAYER_X, o.laneY, key).setOrigin(ox, oy).setScale(this.s, -this.s * 0.8).setDepth(DEPTH.playerReflection)
        .setAlpha(0.2).setTint(hexToNum(mix(P.peacock, P.seafoam, 0.3)));
    }
    this.ribbon = scene.add.graphics().setDepth(DEPTH.player - 0.5);
    this.sprite = scene.add.image(PLAYER_X, o.laneY, key).setOrigin(ox, oy).setScale(this.s).setDepth(DEPTH.player);
  }

  private key(t: number, grounded: boolean, hit: boolean): string {
    const id = this.o.ride;
    if (hit) return `ride:${id}:hit`;
    if (!grounded && this.o.mode !== 'flight') return `ride:${id}:jump`;
    if (this.o.mode === 'flight' && !grounded) {
      // flight rides loop their cycle (propellers, sails); climbing shows the jump pose briefly
      return `ride:${id}:${Math.floor(t * this.info.cycleHz * this.info.frames) % this.info.frames}`;
    }
    return `ride:${id}:${Math.floor(t * this.info.cycleHz * this.info.frames) % this.info.frames}`;
  }

  setVisible(v: boolean): void {
    this.sprite.setVisible(v);
    this.ribbon.setVisible(v);
    this.reflection?.setVisible(v);
  }

  update(t: number, dt: number, r: RunnerState, invuln: number, reducedMotion: boolean, dx = 0): void {
    this.hitT = Math.max(0, this.hitT - dt);
    const mode = this.o.mode;
    const grounded = mode === 'flight' ? false : r.grounded;
    const bob = mode === 'flight' ? Math.sin(t * 2.6) * 2 : grounded ? Math.sin(t * 3.1) * 1.8 : 0;
    const y = r.y + bob;
    this.x = PLAYER_X + dx;
    const key = this.key(t, grounded, this.hitT > 0);
    let rot: number;
    if (mode === 'flight') rot = Phaser.Math.Clamp(r.vy * 0.0009, -0.32, 0.36);
    else rot = grounded ? Math.sin(t * 2.2) * 0.014 : Phaser.Math.Clamp(r.vy * 0.00016, -0.13, 0.13);
    // Orbit: ease the flip so standing on the ceiling reads clearly.
    if (mode === 'gravity') {
      const target = r.gsign < 0 ? -1 : 1;
      this.flip += (target - this.flip) * Math.min(1, dt * 14);
    }
    this.sprite.setTexture(key).setPosition(this.x, y).setRotation(rot).setScale(this.s, this.s * this.flip);
    this.sprite.setAlpha(invuln > 0 && Math.floor(t * 14) % 2 ? 0.4 : 1);

    if (this.reflection) {
      const h = this.o.laneY - r.y;
      this.reflection.setTexture(key).setPosition(this.x, this.o.laneY + h * 0.8 + 2).setRotation(-rot);
      this.reflection.setAlpha(Math.max(0, 0.22 * (1 - h / 170)));
    }
    this.drawRibbon(t, y, rot, r, reducedMotion);
  }

  private drawRibbon(t: number, y: number, rot: number, r: RunnerState, reducedMotion: boolean): void {
    const g = this.ribbon;
    g.clear();
    const A = this.info.ribbon;
    const k = ACTOR_SCALE * (this.o.scale ?? 1);
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const rx = A.x * k, ry = A.y * k * this.flip;
    const ax = this.x + rx * cos - ry * sin;
    const ay = y + rx * sin + ry * cos;
    const n = 10;
    const fast = this.o.mode === 'flight' ? 1.5 : 1;
    const lift = this.o.mode === 'flight' ? Phaser.Math.Clamp(r.vy * 0.008, -6, 6) : r.grounded ? 0 : Phaser.Math.Clamp(r.vy * 0.012, -6, 8);
    const top: { x: number; y: number }[] = [];
    const bot: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const q = i / n;
      const wave = reducedMotion ? 0 : Math.sin(t * 10 * fast - i * 0.85) * (1.5 + i * 0.9);
      const x = ax - i * 6.2 * k * fast;
      const yy = ay + (i * 1.4 + wave + lift * q) * this.flip;
      const w = 4.6 * k * (1 - q * 0.6);
      top.push({ x, y: yy - w / 2 });
      bot.push({ x, y: yy + w / 2 });
    }
    const V = (p: { x: number; y: number }, dy = 0) => new Phaser.Math.Vector2(p.x, p.y + dy);
    g.fillStyle(RIBBON_DARK, 1);
    g.fillPoints([...top.map((p) => V(p, 1.2)), ...bot.slice().reverse().map((p) => V(p, 1.2))], true);
    g.fillStyle(RIBBON, 1);
    g.fillPoints([...top.map((p) => V(p)), ...bot.slice().reverse().map((p) => V(p))], true);
    const end = top[n];
    g.fillTriangle(end.x, end.y, end.x - 7, end.y - 3, end.x - 3, end.y + 4);
    g.fillTriangle(end.x, end.y + 3, end.x - 7, end.y + 7, end.x - 2, end.y);
  }
}
