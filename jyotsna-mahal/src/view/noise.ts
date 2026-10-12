// A tiny seeded random for the view's procedural paint (textures, the jungle's scatter), so the same palace is painted
// the same way every time and screenshots compare cleanly. The game's own randomness is rng.ts.

/** A mulberry32 generator: 0..1, the same sequence for the same seed. */
export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
