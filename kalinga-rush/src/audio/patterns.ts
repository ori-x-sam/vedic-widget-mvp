// Talas, scales and tempi per act (§6). Patterns are 16 steps (sixteenths)
// per bar. Strokes: D = dhin, H = tha, T = ta, k = ki, . = rest.
// Gini: O = open ring, c = choked tick.
import type { ActNum } from '../data/palettes';

export interface ActMusic {
  drum: string[]; // alternating bars
  gini: string;
  scale: number[]; // semitones above Sa
  /** Melody density 0–1. */
  density: number;
  arp?: boolean;
}

export const ACT_MUSIC: Record<ActNum, ActMusic> = {
  1: { drum: ['D..kT...H.kT.k..', 'D..kT.k.H..T.kk.'], gini: 'O.......c.......', scale: [0, 2, 4, 7, 9], density: 0.45 },
  2: { drum: ['D.kTD.k.H.kTD.k.', 'D.kTH.k.D.kTH.kk'], gini: 'O...c...O...c...', scale: [0, 2, 4, 5, 7, 9, 11], density: 0.5 },
  3: { drum: ['D.TkD.TkH.TkD.Tk', 'D.TkH.TkD.TkHTkk'], gini: 'O.c.O.c.O.c.O.cc', scale: [0, 2, 5, 7, 9], density: 0.6 },
  4: { drum: ['D.......H...T...', 'D.....k.H...T.k.'], gini: 'c...............', scale: [0, 2, 3, 7, 8], density: 0.35 },
  5: { drum: ['D.kTH.kTD.kTH.kT', 'D.kTH.kTD.kTHkTk'], gini: 'O...c...O...c.c.', scale: [0, 4, 5, 7, 11], density: 0.55 },
  6: { drum: ['DkTkHkTkDkTkHkTk', 'DkTkHkTkDkTkHTkk'], gini: 'O.c.O.c.O.c.O.c.', scale: [0, 2, 4, 7, 9], density: 0.65 },
  7: { drum: ['D.kTH.kTD.kTH.kT', 'DkkTHkkTDkkTHkTk'], gini: 'c.c.O.c.c.c.O.c.', scale: [0, 3, 5, 7, 10], density: 0.5, arp: true },
};

/** ~84 BPM at Record 01 rising to ~132 BPM at F8 (§6). */
export function tempoFor(num: number): number {
  return 84 + ((Math.min(45, Math.max(1, num)) - 1) / 44) * 48;
}

/** Sa for the drone and flute, by act (keeps the tonic family-related). */
export const SA: Record<ActNum, number> = { 1: 146.83, 2: 146.83, 3: 164.81, 4: 138.59, 5: 155.56, 6: 164.81, 7: 146.83 };

export const semis = (root: number, s: number) => root * Math.pow(2, s / 12);
