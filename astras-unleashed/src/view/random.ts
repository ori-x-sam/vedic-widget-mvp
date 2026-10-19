// A seeded stream of 0..1 numbers for scenery placement, so the arena paints the same way every time (and in stories).
import { rand } from '../rng';

export const mulberry = (seed: number) => { const r = { seed }; return () => rand(r); };
