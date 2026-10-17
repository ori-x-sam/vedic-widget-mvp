// Hand-authored obstacle chunks (brief §5), tagged difficulty 1–10.
// Times are seconds of travel, so a chunk keeps its rhythm at any speed; the
// spawner turns them into world px with the record's speed. Items name
// archetypes; each record decides what they look like. A chunk is only used
// by records that have every archetype it needs.
import type { Arch } from './hazards';
import type { RideMode } from '../systems/physics';

export type ChunkItemKind = Arch | 'cowrieArc' | 'cowrieRow' | 'dolphin' | 'friend' | 'gate' | 'letter';

export interface ChunkItem {
  k: ChunkItemKind;
  /** Seconds after the chunk start at which this reaches the player. */
  at: number;
  v?: number;
  n?: number;
  /** cowrieArc: how long the traced jump is held. */
  hold?: number;
  /** Flight: height in the band, 0 = top, 1 = bottom. Gates: centre of the gap. */
  y?: number;
  /** Gates: gap size as a fraction of the band. */
  gap?: number;
}

export interface Chunk {
  id: string;
  difficulty: number;
  mode: RideMode;
  dur: number;
  items: ChunkItem[];
}

const c = (id: string, difficulty: number, mode: RideMode, items: ChunkItem[]): Chunk => ({
  id, difficulty, mode, items, dur: Math.max(...items.map((i) => i.at)) + 0.1,
});

export const CHUNKS: Chunk[] = [
  // ---- run ------------------------------------------------------------------
  c('small', 1, 'run', [{ k: 'small', at: 0 }]),
  c('small-arc', 1, 'run', [{ k: 'cowrieArc', at: 0, hold: 0.08, n: 5 }, { k: 'small', at: 0.3 }]),
  c('row', 1, 'run', [{ k: 'cowrieRow', at: 0, n: 6 }]),
  c('dolphin', 1, 'run', [{ k: 'dolphin', at: 0.35 }, { k: 'cowrieArc', at: 0.05, hold: 0.16, n: 5 }]),
  c('friend', 1, 'run', [{ k: 'friend', at: 0.32 }, { k: 'cowrieArc', at: 0.05, hold: 0.14, n: 4 }]),
  c('wide', 1, 'run', [{ k: 'wide', at: 0 }]),
  c('pit', 1, 'run', [{ k: 'pit', at: 0 }]),
  c('tall', 2, 'run', [{ k: 'tall', at: 0 }]),
  c('tall-arc', 2, 'run', [{ k: 'cowrieArc', at: 0, hold: 0.22, n: 6 }, { k: 'tall', at: 0.3 }]),
  c('wide-arc', 2, 'run', [{ k: 'cowrieArc', at: 0, hold: 0.12, n: 6 }, { k: 'wide', at: 0.24, v: 1 }]),
  c('roller', 2, 'run', [{ k: 'roller', at: 0 }]),
  c('walker', 2, 'run', [{ k: 'walker', at: 0 }]),
  c('floater', 2, 'run', [{ k: 'cowrieRow', at: -0.3, n: 4 }, { k: 'floater', at: 0 }]),
  c('letter', 2, 'run', [{ k: 'letter', at: 0 }]),
  c('small-small', 3, 'run', [{ k: 'small', at: 0 }, { k: 'small', at: 1.15, v: 2 }]),
  c('small-tall', 3, 'run', [{ k: 'small', at: 0, v: 1 }, { k: 'tall', at: 1.25 }]),
  c('wide-small', 3, 'run', [{ k: 'wide', at: 0 }, { k: 'small', at: 1.3 }]),
  c('pit-small', 3, 'run', [{ k: 'pit', at: 0 }, { k: 'small', at: 1.2 }]),
  c('roller-small', 3, 'run', [{ k: 'roller', at: 0 }, { k: 'small', at: 1.2 }]),
  c('floater-small', 3, 'run', [{ k: 'floater', at: 0 }, { k: 'small', at: 0.85 }]),
  c('letter-2', 3, 'run', [{ k: 'letter', at: 0 }, { k: 'letter', at: 1.5 }]),
  c('tall-small', 4, 'run', [{ k: 'tall', at: 0 }, { k: 'small', at: 1.05 }]),
  c('small-x3', 4, 'run', [{ k: 'small', at: 0 }, { k: 'small', at: 1.0 }, { k: 'small', at: 2.0 }]),
  c('walker-small', 4, 'run', [{ k: 'walker', at: 0 }, { k: 'small', at: 1.2 }]),
  c('small-floater', 4, 'run', [{ k: 'small', at: 0 }, { k: 'floater', at: 1.0 }]),
  c('roller-roller', 4, 'run', [{ k: 'roller', at: 0 }, { k: 'roller', at: 1.0 }]),
  c('small-small-9', 5, 'run', [{ k: 'small', at: 0 }, { k: 'small', at: 0.92 }]),
  c('wide-tall', 5, 'run', [{ k: 'wide', at: 0 }, { k: 'tall', at: 1.12 }]),
  c('pit-pit', 5, 'run', [{ k: 'pit', at: 0 }, { k: 'pit', at: 0.95 }]),
  c('roller-walker', 5, 'run', [{ k: 'roller', at: 0 }, { k: 'walker', at: 1.12 }]),
  c('floater-small-floater', 5, 'run', [{ k: 'floater', at: 0 }, { k: 'small', at: 0.8 }, { k: 'floater', at: 1.65 }]),
  c('tall-tall', 6, 'run', [{ k: 'tall', at: 0 }, { k: 'tall', at: 0.98 }]),
  c('small-floater-small', 6, 'run', [{ k: 'small', at: 0 }, { k: 'floater', at: 0.92 }, { k: 'small', at: 1.78 }]),
  c('wide-wide-small', 6, 'run', [{ k: 'wide', at: 0 }, { k: 'wide', at: 1.08 }, { k: 'small', at: 2.05 }]),
  c('roller-small-roller', 6, 'run', [{ k: 'roller', at: 0 }, { k: 'small', at: 0.95 }, { k: 'roller', at: 1.88 }]),
  c('small-x3-tight', 7, 'run', [{ k: 'small', at: 0 }, { k: 'small', at: 0.84 }, { k: 'small', at: 1.68 }]),
  c('wide-small-tall', 7, 'run', [{ k: 'wide', at: 0 }, { k: 'small', at: 0.96 }, { k: 'tall', at: 1.88 }]),
  c('tall-pit-tall', 7, 'run', [{ k: 'tall', at: 0 }, { k: 'pit', at: 0.92 }, { k: 'tall', at: 1.84 }]),
  c('small-x4', 8, 'run', [{ k: 'small', at: 0 }, { k: 'small', at: 0.8 }, { k: 'small', at: 1.6 }, { k: 'small', at: 2.4 }]),
  c('tall-small-tall', 8, 'run', [{ k: 'tall', at: 0 }, { k: 'small', at: 0.86 }, { k: 'tall', at: 1.72 }]),
  c('roller-small-roller-8', 8, 'run', [{ k: 'roller', at: 0 }, { k: 'small', at: 0.82 }, { k: 'roller', at: 1.64 }]),
  c('mix-9', 9, 'run', [{ k: 'wide', at: 0 }, { k: 'roller', at: 0.88 }, { k: 'small', at: 1.66 }, { k: 'tall', at: 2.5 }]),
  c('floater-dance', 9, 'run', [{ k: 'floater', at: 0 }, { k: 'small', at: 0.74 }, { k: 'floater', at: 1.46 }, { k: 'small', at: 2.2 }]),
  c('tall-small-x2', 10, 'run', [{ k: 'tall', at: 0 }, { k: 'small', at: 0.76 }, { k: 'tall', at: 1.52 }, { k: 'small', at: 2.28 }]),
  c('small-x5', 10, 'run', [0, 0.76, 1.52, 2.28, 3.04].map((at) => ({ k: 'small' as const, at }))),

  // ---- flight -------------------------------------------------------------
  c('air-high', 1, 'flight', [{ k: 'air', at: 0, y: 0.28 }]),
  c('air-low', 1, 'flight', [{ k: 'air', at: 0, y: 0.72 }]),
  c('air-row', 1, 'flight', [{ k: 'cowrieRow', at: 0, n: 6, y: 0.5 }]),
  c('air-pair', 2, 'flight', [{ k: 'air', at: 0, y: 0.22 }, { k: 'air', at: 0, y: 0.8 }]),
  c('air-step', 2, 'flight', [{ k: 'air', at: 0, y: 0.3 }, { k: 'air', at: 1.0, y: 0.7 }]),
  c('birds', 2, 'flight', [{ k: 'floater', at: 0, y: 0.45 }]),
  c('gate-mid', 3, 'flight', [{ k: 'gate', at: 0, y: 0.5, gap: 0.42 }]),
  c('gate-high', 3, 'flight', [{ k: 'gate', at: 0, y: 0.32, gap: 0.42 }]),
  c('gate-low', 3, 'flight', [{ k: 'gate', at: 0, y: 0.7, gap: 0.42 }]),
  c('slalom', 4, 'flight', [{ k: 'air', at: 0, y: 0.25 }, { k: 'air', at: 0.75, y: 0.75 }, { k: 'air', at: 1.5, y: 0.25 }]),
  c('gates-2', 5, 'flight', [{ k: 'gate', at: 0, y: 0.35, gap: 0.38 }, { k: 'gate', at: 1.05, y: 0.65, gap: 0.38 }]),
  c('birds-gate', 5, 'flight', [{ k: 'floater', at: 0, y: 0.3 }, { k: 'gate', at: 1.0, y: 0.55, gap: 0.4 }]),
  c('gates-tight', 7, 'flight', [{ k: 'gate', at: 0, y: 0.4, gap: 0.34 }, { k: 'gate', at: 0.9, y: 0.66, gap: 0.34 }, { k: 'gate', at: 1.8, y: 0.38, gap: 0.34 }]),
  c('slalom-fast', 8, 'flight', [0, 0.62, 1.24, 1.86].map((at, i) => ({ k: 'air' as const, at, y: i % 2 ? 0.75 : 0.25 }))),
  c('gates-3', 9, 'flight', [{ k: 'gate', at: 0, y: 0.3, gap: 0.32 }, { k: 'gate', at: 0.82, y: 0.6, gap: 0.32 }, { k: 'gate', at: 1.64, y: 0.36, gap: 0.32 }]),
  c('gates-4', 10, 'flight', [0, 0.76, 1.52, 2.28].map((at, i) => ({ k: 'gate' as const, at, y: [0.32, 0.62, 0.38, 0.66][i], gap: 0.3 }))),

  // ---- gravity flip ---------------------------------------------------------
  c('floor', 1, 'gravity', [{ k: 'small', at: 0 }]),
  c('ceil', 1, 'gravity', [{ k: 'ceil', at: 0 }]),
  c('floor-ceil', 2, 'gravity', [{ k: 'small', at: 0 }, { k: 'ceil', at: 1.15 }]),
  c('ceil-floor', 2, 'gravity', [{ k: 'ceil', at: 0 }, { k: 'small', at: 1.15 }]),
  c('fcf', 4, 'gravity', [{ k: 'small', at: 0 }, { k: 'ceil', at: 1.0 }, { k: 'small', at: 2.0 }]),
  c('cfc', 4, 'gravity', [{ k: 'ceil', at: 0 }, { k: 'small', at: 1.0 }, { k: 'ceil', at: 2.0 }]),
  c('flip-run', 6, 'gravity', [0, 0.9, 1.8, 2.7].map((at, i) => ({ k: (i % 2 ? 'ceil' : 'small') as Arch, at }))),
  c('flip-run-fast', 8, 'gravity', [0, 0.8, 1.6, 2.4, 3.2].map((at, i) => ({ k: (i % 2 ? 'ceil' : 'small') as Arch, at }))),
  c('flip-double', 9, 'gravity', [{ k: 'small', at: 0 }, { k: 'small', at: 0.55 }, { k: 'ceil', at: 1.45 }, { k: 'ceil', at: 2.0 }]),
];

/** Phase 1 hazard sprite sizes, kept for the Record 01 painters. */
export interface HazardDef { w: number; h: number; hitW: number; hitH: number }
