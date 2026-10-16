// Seeded randomness so levels and paintings are reproducible (?seed=123).

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  private f: () => number;
  constructor(seed: number | string) {
    this.f = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
  }
  next(): number {
    return this.f();
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.f();
  }
  int(a: number, b: number): number {
    return Math.floor(this.range(a, b + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.f() * arr.length) % arr.length];
  }
  chance(p: number): boolean {
    return this.f() < p;
  }
  /** Roughly normal, mean 0, sd 1. */
  gauss(): number {
    return (this.f() + this.f() + this.f() + this.f() - 2) * 1.7320508;
  }
  fork(salt: string | number): Rng {
    return new Rng(hashString(`${this.f()}:${salt}`));
  }
}

/**
 * Periodic 1D value noise: f(x) for x in [0, period) wraps seamlessly, so
 * silhouettes on tiling parallax strips join at the seam.
 */
export function periodicNoise(rng: Rng, period: number, cell: number): (x: number) => number {
  const n = Math.max(2, Math.round(period / cell));
  const lattice = Array.from({ length: n }, () => rng.next() * 2 - 1);
  const step = period / n;
  return (x: number) => {
    const u = (((x % period) + period) % period) / step;
    const i = Math.floor(u);
    const f = u - i;
    const s = f * f * (3 - 2 * f);
    return lattice[i % n] * (1 - s) + lattice[(i + 1) % n] * s;
  };
}

/** Fractal sum of periodic noise octaves; result roughly in [-1, 1]. */
export function periodicFbm(rng: Rng, period: number, cell: number, octaves = 4): (x: number) => number {
  const layers = Array.from({ length: octaves }, (_, o) => periodicNoise(rng, period, cell / Math.pow(2, o)));
  return (x: number) => {
    let sum = 0;
    let amp = 1;
    let norm = 0;
    for (const f of layers) {
      sum += f(x) * amp;
      norm += amp;
      amp *= 0.5;
    }
    return sum / norm;
  };
}
