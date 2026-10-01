// Rule-side data model. Pure data: no three.js, no DOM. view/ reads these; rules never import view/.
import type { KdlNode, KdlValue } from "../core/kdl";
import type { ProjDef } from "../core/content";

export type EntKind = "boss" | "part" | "minion" | "prop" | "target" | "pot" | "platform" | "decoy" | "rider" | "director" | "pickup" | "hazard";

export interface Ent {
  id: number;
  kind: EntKind;
  def: string; // content id (boss/minion/prop kind)
  puppet: string; // view puppet id
  x: number; y: number; px: number; py: number; // position (feet/center-bottom) and previous step
  vx: number; vy: number;
  w: number; h: number; // hitbox size; box spans x±w/2, y..y+h
  hp: number; maxHp: number;
  alive: boolean; deadT: number; // seconds since death (for KO anims), alive=false removes after
  alpha: number; scale: number; rot: number; flipY: boolean; facing: 1 | -1;
  squash: number; // >0 stretched tall, <0 squashed
  pose: string; poseT: number;
  shootable: boolean; hurts: boolean; parryable: boolean; invuln: boolean; reflect: boolean;
  platform: boolean; gravity: number; grounded: boolean; keepVisible: boolean; hidden: boolean;
  parent: number; offX: number; offY: number; // attached to parent (riders, parts)
  dmgTo: number; // id that receives damage instead (0 = self)
  hitFlash: number; wobble: number; trail: string; trailT: number; stepT: number;
  tag: string; // free label (phase-spawned things are tagged with the phase id)
  vars: Record<string, number>;
  fibers: Fiber[];
  ttl: number; // seconds to live (Infinity = forever)
  removeWithPhase: boolean;
}

export interface Proj {
  id: number;
  def: ProjDef;
  x: number; y: number; px: number; py: number; vx: number; vy: number;
  rot: number; spin: number; t: number; life: number; r: number; scale: number;
  hostile: boolean; parryable: boolean; damage: number; gravity: number; pierce: boolean;
  homing: number; // turn rate rad/s (0 = none)
  target: number; // ent id for player homing, -1 = player for enemy homing
  ground: boolean; // shockwave: hugs floor
  alive: boolean; owner: number; hitIds: number[];
  len: number; // beam length (0 = point)
  angle: number; // beam angle
  ox: number; oy: number; // owner-relative anchor for beams
  spawnT: number;
}

export type WorldEventType =
  | "sfx" | "shake" | "flash" | "banner" | "decal" | "particles" | "hit" | "boss-hit" | "parry" | "drumroll" | "tracking"
  | "sheet" | "theme" | "say" | "warn" | "spotlight" | "phase" | "knockout" | "player-hurt" | "player-dead" | "blink"
  | "jump" | "shoot" | "super" | "ex" | "pickup" | "win" | "topple" | "mirror" | "glide" | "land" | "bg" | "card" | "haptic";

export interface WorldEvent {
  type: WorldEventType;
  x: number; y: number;
  s?: string; // name/kind/text
  n?: number; // amount/duration
  id?: number;
}

/** A running script: a generator advanced once per sim step. */
export interface Fiber {
  gen: Generator<void, void, void>;
  done: boolean;
  owner: number;
  tag: string;
}

/** Word context passed to every vocabulary function. */
export interface WordCall {
  args: KdlValue[];
  props: Record<string, KdlValue>;
  children: KdlNode[];
  line: number;
  file?: string;
}

export type WordFn = (w: WorldApi, me: Ent, c: WordCall) => Generator<void, void, void>;

export type WordKind = "flow" | "move" | "attack" | "telegraph" | "state" | "parry" | "stage";

export interface WordDef {
  name: string;
  kind: WordKind;
  sig: string; // argument signature, e.g. "speed:num dur:s"
  doc: string; // one line
  fn: WordFn;
}

/** The subset of World that words may use. Keeps words small and testable. */
export interface WorldApi {
  readonly t: number;
  readonly dt: number;
  readonly floor: number;
  readonly left: number;
  readonly right: number;
  readonly ceiling: number;
  readonly camX: number;
  readonly camY: number;
  readonly water: number;
  readonly player: { x: number; y: number; w: number; h: number; vx: number; vy: number; dead: boolean };
  rand(): number;
  range(a: number, b: number): number;
  ent(id: number): Ent | undefined;
  ents(): readonly Ent[];
  spawnEnt(kind: EntKind, def: string, x: number, y: number, init?: Partial<Ent>): Ent;
  spawnProj(def: string, x: number, y: number, vx: number, vy: number, init?: Partial<Proj>): Proj | null;
  spawnMinion(def: string, x: number, y: number, init?: Partial<Ent>): Ent | null;
  emit(type: WorldEventType, x: number, y: number, s?: string, n?: number, id?: number): void;
  run(me: Ent, nodes: KdlNode[]): Generator<void, void, void>;
  fork(me: Ent, gen: Generator<void, void, void>, tag?: string): Fiber;
  setScroll(dx: number, dy: number): void;
  setWater(target: number, rate: number): void;
  addPlatform(x: number, y: number, w: number, init?: Partial<Ent>): Ent;
  setTheme(id: string): void;
  mark(me: Ent, key: string): void; // record that a signature behaviour happened (for stories/bot)
  phaseTag: string;
}
