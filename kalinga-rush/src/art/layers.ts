// Shared types for a record's painted scene.

export type Blend = 'normal' | 'multiply' | 'screen' | 'add';

export interface LayerSpec {
  /** Layer role, also the painted-art file name: /art/<recordId>/<name>.webp */
  name: string;
  canvas: HTMLCanvasElement;
  /** Top of the layer on screen (logical px). */
  y: number;
  /** 0 = fixed to the screen, 1 = moves with the track. */
  parallax: number;
  depth: number;
  /** Repeat horizontally (the canvas is painted seamlessly). */
  tile: boolean;
  alpha?: number;
  blend?: Blend;
  /** Extra autonomous drift in px/s (clouds). */
  drift?: number;
  /** Gentle alpha shimmer (glitter). */
  shimmer?: number;
}

export type DecorKind = 'worker' | 'smoke' | 'sign' | 'landmark';

export interface DecorSpec {
  kind: DecorKind;
  x: number;
  y: number;
  parallax: number;
  /** Repeat period in px (usually the layer width). */
  period: number;
  depth: number;
  scale?: number;
  phase?: number;
  /** Signboards: date and title. */
  text?: { date: string; title: string };
  /** One-off decor: fraction of the record (0–1) at which it is centred on screen (overrides x). */
  at?: number;
  /** Landmarks: the painted canvas (baked as `<record>:lm<i>`). */
  canvas?: HTMLCanvasElement;
  /** Landmarks: origin (0–1) of the canvas, default bottom-centre. */
  origin?: [number, number];
}

/** Screen-space x for one-off decor at fraction `at` of a record `length` px long. */
export function decorAtX(at: number, length: number, parallax: number, screenW: number): number {
  return screenW / 2 + at * length * parallax;
}

export interface SceneArt {
  recordId: string;
  laneY: number;
  waterTop: number;
  layers: LayerSpec[];
  decor: DecorSpec[];
}

// Depth bands shared by all records.
export const DEPTH = {
  sky: 0,
  clouds: 1,
  sun: 2,
  far: 3,
  waterBase: 4,
  glitter: 5,
  reflection: 6,
  ripplesFar: 7,
  mid: 8,
  midDecor: 9,
  near: 10,
  nearDecor: 11,
  ripplesMid: 12,
  sign: 13,
  ripplesNear: 14,
  dolphin: 15,
  prompts: 16,
  entities: 17,
  playerReflection: 18,
  player: 19,
  lip: 20,
  particles: 21,
  fore: 22,
  post: 30,
} as const;
