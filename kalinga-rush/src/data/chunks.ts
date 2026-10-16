// Hand-authored obstacle chunks (brief §5), tagged difficulty 1–10.
// Times are in seconds of travel so a chunk keeps its rhythm at any speed;
// the spawner converts them to world px with the record's speed.
import type { HazardKind } from './records';

export type ChunkItemKind = HazardKind | 'cowrieArc' | 'cowrieRow' | 'dolphin';

export interface ChunkItem {
  k: ChunkItemKind;
  /** Seconds after the chunk start at which this reaches the player. */
  at: number;
  /** Visual variant. */
  v?: number;
  /** Cowries in an arc/row. */
  n?: number;
  /** For cowrieArc: how long the jump that traces the arc is held (s). */
  hold?: number;
}

export interface Chunk {
  id: string;
  difficulty: number;
  /** Terrain the chunk is written for. */
  terrain: 'water' | 'land';
  /** Seconds from the first to the last item. */
  dur: number;
  items: ChunkItem[];
}

// Act I — water. A plain ~60 ms press clears every hazard here; holding only
// earns the higher cowries. The arc over a hazard follows a real jump path.
export const CHUNKS: Chunk[] = [
  { id: 'reed', difficulty: 1, terrain: 'water', dur: 0.2, items: [{ k: 'reed', at: 0 }] },
  {
    id: 'reed-arc', difficulty: 1, terrain: 'water', dur: 0.6,
    items: [{ k: 'cowrieArc', at: 0, hold: 0.08, n: 5 }, { k: 'reed', at: 0.3 }],
  },
  { id: 'cowrie-row', difficulty: 1, terrain: 'water', dur: 0.9, items: [{ k: 'cowrieRow', at: 0, n: 6 }] },
  {
    id: 'dolphin', difficulty: 1, terrain: 'water', dur: 1.2,
    items: [{ k: 'dolphin', at: 0.35 }, { k: 'cowrieArc', at: 0.05, hold: 0.16, n: 5 }],
  },
  { id: 'mud', difficulty: 2, terrain: 'water', dur: 0.5, items: [{ k: 'mud', at: 0 }] },
  {
    id: 'mud-arc', difficulty: 2, terrain: 'water', dur: 0.8,
    items: [{ k: 'cowrieArc', at: 0, hold: 0.12, n: 6 }, { k: 'mud', at: 0.24, v: 1 }],
  },
  { id: 'stakes', difficulty: 2, terrain: 'water', dur: 0.2, items: [{ k: 'stakes', at: 0 }] },
  {
    id: 'stakes-high', difficulty: 2, terrain: 'water', dur: 0.7,
    items: [{ k: 'cowrieArc', at: 0, hold: 0.22, n: 6 }, { k: 'stakes', at: 0.3 }],
  },
  {
    id: 'reed-reed', difficulty: 3, terrain: 'water', dur: 1.15,
    items: [{ k: 'reed', at: 0 }, { k: 'reed', at: 1.15, v: 2 }],
  },
  {
    id: 'reed-stakes', difficulty: 3, terrain: 'water', dur: 1.25,
    items: [{ k: 'reed', at: 0, v: 1 }, { k: 'stakes', at: 1.25 }],
  },
  {
    id: 'mud-reed', difficulty: 3, terrain: 'water', dur: 1.3,
    items: [{ k: 'mud', at: 0 }, { k: 'reed', at: 1.3 }],
  },
];

/** Sprite size and ~70% hitbox for each hazard variant (px at 1280×720). */
export interface HazardDef { w: number; h: number; hitW: number; hitH: number }
export const HAZARDS: Record<HazardKind, HazardDef[]> = {
  reed: [
    { w: 54, h: 80, hitW: 34, hitH: 54 },
    { w: 60, h: 88, hitW: 38, hitH: 58 },
    { w: 64, h: 92, hitW: 40, hitH: 60 },
  ],
  mud: [
    { w: 116, h: 38, hitW: 76, hitH: 24 },
    { w: 120, h: 40, hitW: 78, hitH: 25 },
  ],
  stakes: [{ w: 60, h: 126, hitW: 36, hitH: 88 }],
};
