// Tiny pooled particle system: splashes, sparkles, puffs.
import Phaser from 'phaser';
import { DEPTH } from '../../art/layers';

interface Particle {
  img: Phaser.GameObjects.Image;
  vx: number; vy: number; g: number;
  life: number; age: number;
  s0: number; s1: number; a0: number; spin: number;
}

export class Fx {
  private scene: Phaser.Scene;
  private live: Particle[] = [];
  private pool: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  spawn(key: string, x: number, y: number, o: Partial<Omit<Particle, 'img' | 'age'>> & { depth?: number } = {}): void {
    const img = this.pool.pop() ?? this.scene.add.image(0, 0, key);
    img.setTexture(key).setPosition(x, y).setVisible(true).setDepth(o.depth ?? DEPTH.particles).setRotation(0);
    this.live.push({ img, vx: o.vx ?? 0, vy: o.vy ?? 0, g: o.g ?? 0, life: o.life ?? 0.6, age: 0, s0: o.s0 ?? 0.5, s1: o.s1 ?? o.s0 ?? 0.5, a0: o.a0 ?? 1, spin: o.spin ?? 0 });
  }

  splash(x: number, y: number, n = 10, power = 1): void {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const v = (120 + Math.random() * 160) * power;
      this.spawn(i % 3 ? 'fx:drop' : 'fx:foam', x + (Math.random() - 0.5) * 50, y, { vx: Math.cos(a) * v - 60, vy: Math.sin(a) * v, g: 900, life: 0.45 + Math.random() * 0.3, s0: 0.5 + Math.random() * 0.6, s1: 0.2, a0: 0.9 });
    }
  }

  sparkle(x: number, y: number, n = 1): void {
    for (let i = 0; i < n; i++) {
      this.spawn('fx:spark', x + (Math.random() - 0.5) * 16 * (n > 1 ? 2 : 0), y + (Math.random() - 0.5) * 16 * (n > 1 ? 2 : 0), { life: 0.45, s0: 0.25, s1: 0.85, a0: 1, spin: 3, vy: -20 });
    }
  }

  /** Little kicked-up dust on land rides. */
  dust(x: number, y: number, n = 5): void {
    for (let i = 0; i < n; i++) {
      this.spawn('fx:dust', x + (Math.random() - 0.5) * 40, y - 4, { vx: -80 - Math.random() * 90, vy: -30 - Math.random() * 60, g: 160, life: 0.5 + Math.random() * 0.3, s0: 0.6, s1: 1.6, a0: 0.55 });
    }
  }

  puff(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      this.spawn('fx:puff', x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20, { vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, life: 0.8, s0: 0.5, s1: 1.4, a0: 0.8 });
    }
  }

  update(dt: number): void {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) {
        p.img.setVisible(false);
        this.pool.push(p.img);
        this.live.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.img.x += p.vx * dt;
      p.img.y += p.vy * dt;
      p.img.rotation += p.spin * dt;
      p.img.setScale(p.s0 + (p.s1 - p.s0) * k);
      p.img.setAlpha(p.a0 * (1 - k * k));
    }
  }
}
