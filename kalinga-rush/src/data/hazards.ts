// Hazard archetypes: the mechanical shapes every era's obstacles are built
// from. Each record maps archetypes to its own painted visual (records.ts),
// so a "small" hazard is reeds at Chilika, a stone block in Bhubaneswar, a
// paint bucket in 2011.

export type Arch = 'small' | 'wide' | 'tall' | 'pit' | 'roller' | 'walker' | 'floater' | 'air' | 'ceil';

export interface ArchDef {
  /** Sprite size (logical px). */
  w: number;
  h: number;
  /** Hitbox as a fraction of the sprite at full strictness (forgiveness = 1). */
  hitW: number;
  hitH: number;
  /** Extra leftward speed for moving hazards (px/s). */
  vx?: number;
  /** Gentle vertical bob. */
  bob?: number;
  /** Where y is measured: ground hazards stand on the ride line, others are centred. */
  anchor: 'ground' | 'centre' | 'ceiling';
  /** Floaters sit this far above the ride line (centre). */
  lift?: number;
}

export const ARCH: Record<Arch, ArchDef> = {
  small: { w: 56, h: 84, hitW: 0.66, hitH: 0.68, anchor: 'ground' },
  wide: { w: 118, h: 40, hitW: 0.66, hitH: 0.62, anchor: 'ground' },
  tall: { w: 60, h: 126, hitW: 0.6, hitH: 0.7, anchor: 'ground' },
  pit: { w: 112, h: 26, hitW: 0.66, hitH: 0.45, anchor: 'ground' },
  roller: { w: 52, h: 52, hitW: 0.62, hitH: 0.62, vx: -150, anchor: 'ground' },
  walker: { w: 100, h: 80, hitW: 0.58, hitH: 0.6, vx: -70, anchor: 'ground' },
  floater: { w: 74, h: 48, hitW: 0.62, hitH: 0.6, bob: 9, anchor: 'centre', lift: 150 },
  air: { w: 92, h: 70, hitW: 0.6, hitH: 0.6, bob: 6, anchor: 'centre' },
  ceil: { w: 56, h: 96, hitW: 0.62, hitH: 0.66, anchor: 'ceiling' },
};

/** Size of a hazard sprite as drawn (painters use this canvas size). */
export function archSize(a: Arch): { w: number; h: number } {
  return { w: ARCH[a].w, h: ARCH[a].h };
}
