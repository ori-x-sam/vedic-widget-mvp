// Pooled CPU particles drawn through one SpriteBatch. Generous but readable: short lives,
// ink-outlined sprites, nothing ever uses the --parry color except the parry burst.
import type { Tokens, RGB } from "../core/tokens";
import type { SpriteBatch } from "./batch";

interface P {
  sprite: string; x: number; y: number; vx: number; vy: number; rot: number; vr: number;
  t: number; life: number; size: number; grow: number; g: number; drag: number; tint: RGB; fade: boolean; held: boolean; parry: boolean;
}

type Preset = (x: number, y: number, i: number, rnd: () => number) => Partial<P>;

export class Particles {
  private live: P[] = [];
  private free: P[] = [];
  private presets: Record<string, Preset>;
  max = 900;

  constructor(t: Tokens) {
    const C = (n: string) => t.color(n);
    const confetti: RGB[] = [C("--saffron"), C("--marigold"), C("--teal"), C("--rani"), C("--white"), C("--peacock"), C("--vermilion")];
    this.presets = {
      dust: (x, y, _i, r) => ({ sprite: "puff", x: x + (r() - 0.5) * 40, y: y + r() * 10, vx: (r() - 0.5) * 220, vy: 40 + r() * 80, life: 0.45 + r() * 0.3, size: 26 + r() * 22, grow: 1.4, drag: 3, tint: C("--paper-dark") }),
      smoke: (x, y, _i, r) => ({ sprite: "puff", x: x + (r() - 0.5) * 60, y: y + (r() - 0.5) * 60, vx: (r() - 0.5) * 160, vy: 60 + r() * 120, life: 0.6 + r() * 0.4, size: 40 + r() * 40, grow: 1.6, drag: 2.5, tint: C("--white"), held: true }),
      confetti: (x, y, _i, r) => ({ sprite: r() < 0.5 ? "confetti" : "confetti-b", x, y, vx: (r() - 0.5) * 700, vy: 300 + r() * 600, vr: (r() - 0.5) * 20, life: 1.4 + r(), size: 16 + r() * 10, g: 1100, drag: 1.2, tint: confetti[Math.floor(r() * confetti.length)] }),
      sparkle: (x, y, _i, r) => ({ sprite: "sparkle", x: x + (r() - 0.5) * 50, y: y + (r() - 0.5) * 50, vx: (r() - 0.5) * 120, vy: (r() - 0.5) * 120, vr: 4, life: 0.5 + r() * 0.3, size: 22 + r() * 16, grow: 0.3, tint: C("--marigold") }),
      spark: (x, y, _i, r) => ({ sprite: "spark", x, y, vx: (r() - 0.5) * 500, vy: (r() - 0.3) * 500, vr: 10, life: 0.18 + r() * 0.12, size: 22 + r() * 10, grow: 0.5, tint: C("--white") }),
      coin: (x, y, _i, r) => ({ sprite: "coin-fx", x, y, vx: (r() - 0.5) * 500, vy: 400 + r() * 500, vr: (r() - 0.5) * 15, life: 1.2, size: 26, g: 1600, tint: [1, 1, 1] }),
      glass: (x, y, _i, r) => ({ sprite: "shard", x, y, vx: (r() - 0.5) * 600, vy: 200 + r() * 400, vr: (r() - 0.5) * 20, life: 0.8, size: 18 + r() * 12, g: 1500, tint: C("--sky") }),
      stars: (x, y, i) => ({ sprite: "sparkle", x: x + Math.cos(i * 1.3) * 50, y: y + 20, vx: Math.cos(i * 1.3) * 60, vy: 30, vr: 6, life: 1.2, size: 26, tint: C("--marigold"), held: true }),
      parry: (x, y, i) => ({ sprite: "petal", x, y, vx: Math.cos(i * 0.785) * 520, vy: Math.sin(i * 0.785) * 520, vr: 8, life: 0.45, size: 30, drag: 4, grow: 0.6, tint: [1, 1, 1], parry: true }),
      pop: (x, y, i, r) => ({ sprite: i === 0 ? "pop-ring" : "puff", x: x + (i ? (r() - 0.5) * 60 : 0), y: y + (i ? (r() - 0.5) * 60 : 0), vx: i ? (r() - 0.5) * 300 : 0, vy: i ? r() * 200 : 0, life: i ? 0.5 : 0.25, size: i ? 30 : 90, grow: i ? 1.2 : 2.2, drag: 3, tint: i ? C("--white") : C("--ink") }),
      ink: (x, y, _i, r) => ({ sprite: "puff", x, y, vx: (r() - 0.5) * 300, vy: (r() - 0.5) * 300, life: 0.3, size: 20, tint: C("--ink"), drag: 4 }),
      bubble: (x, y, _i, r) => ({ sprite: "bubble", x: x + (r() - 0.5) * 80, y, vx: (r() - 0.5) * 40, vy: 80 + r() * 100, life: 1 + r(), size: 12 + r() * 14, tint: [1, 1, 1] }),
      cyber: (x, y, _i, r) => ({ sprite: "spark", x: x + (r() - 0.5) * 70, y: y + r() * 100, vx: (r() - 0.5) * 300, vy: (r() - 0.5) * 300, vr: 8, life: 0.25, size: 18, tint: C("--cyber") }),
    };
  }

  emit(kind: string, x: number, y: number, n: number, rnd: () => number = Math.random) {
    const pr = this.presets[kind];
    if (!pr) return;
    for (let i = 0; i < n; i++) {
      if (this.live.length >= this.max) return;
      const p = this.free.pop() ?? ({} as P);
      Object.assign(p, { sprite: "puff", x, y, vx: 0, vy: 0, rot: rnd() * 6.28, vr: 0, t: 0, life: 0.5, size: 20, grow: 1, g: 0, drag: 0, tint: [1, 1, 1], fade: true, held: false, parry: false }, pr(x, y, i, rnd));
      this.live.push(p);
    }
  }

  step(dt: number) {
    const l = this.live;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i];
      p.t += dt;
      if (p.t >= p.life) { this.free.push(p); l[i] = l[l.length - 1]; l.pop(); continue; }
      p.vy -= p.g * dt;
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d; p.vy *= d;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  }

  draw(b: SpriteBatch, t: number) {
    for (const p of this.live) {
      const k = p.t / p.life;
      const size = p.size * (1 + (p.grow - 1) * k);
      const rot = p.held ? Math.floor(p.rot * 2) / 2 : p.rot;
      b.add(p.sprite, p.x, p.y, size, rot + (p.held ? Math.floor(t * 12) * 0.3 : 0), p.fade ? 1 - k * k : 1, p.parry, p.tint);
    }
  }

  get count() { return this.live.length; }
}
