// Content loader: turns content/*.kdl text into typed definitions.
// Scripts (phase bodies, level bodies, minion brains) stay as KDL nodes; the rules runtime
// interprets them word by word through the vocabulary registry.
import { KdlNode, parseKdl, propNum, propStr, propBool, argStr, argNum, child, childrenNamed, KdlValue } from "./kdl";

export interface PhaseDef { id: string; name: string; until: number | null; script: KdlNode[]; line: number }
export interface BossDef {
  id: string; name: string; title: string; hp: number; theme: string; stage: string; puppet: string;
  w: number; h: number; x: number; y: number; intro: string; outro: string; reward: number;
  phases: PhaseDef[]; file?: string;
}
export interface MinionDef { id: string; hp: number; puppet: string; w: number; h: number; gravity: number; parryable: boolean; contact: boolean; script: KdlNode[] }
export interface LevelDef {
  id: string; name: string; mode: "run" | "fly" | "boss"; length: number; stage: string; theme: string;
  boss: string; intro: string; reward: number; script: KdlNode[];
}
export interface WeaponDef {
  id: string; name: string; kind: "straight" | "spread" | "homing" | "arc"; rate: number; damage: number;
  speed: number; count: number; spread: number; range: number; projectile: string; ex: string; desc: string;
}
export interface SuperDef { id: string; name: string; kind: "beam" | "invuln" | "airdrop"; dur: number; damage: number; desc: string }
export interface CharmDef { id: string; name: string; desc: string; effect: string; value: number }
export interface ShopItem { id: string; kind: "weapon" | "charm" | "super"; price: number }
export interface ProjDef {
  id: string; sprite: string; r: number; damage: number; gravity: number; spin: number; life: number;
  parryable: boolean; hostile: boolean; pierce: boolean; scale: number;
}
export interface PartDef { id: string; svg: string; x: number; y: number; px: number; py: number; z: number; parent: string; anim: string; size: number; tags: string[] }
export interface PuppetDef { id: string; scale: number; parts: PartDef[] }
export interface Bubble { who: string; text: string; x: number; y: number; tail: string; kind: string }
export interface PanelDef { layout: string; art: { id: string; x: number; y: number; s: number; flip: boolean }[]; bg: string; caption: string; bubbles: Bubble[]; sfx: string }
export interface StoryDef { id: string; panels: PanelDef[] }
export interface ControlButton { id: string; x: number; y: number; r: number; shape: string; icon: string; hit: number }
export interface ControlsDef {
  joystick: { zone: number; dead: number; radius: number };
  buttons: ControlButton[];
  safe: { id: string; x: number; y: number; w: number; h: number }[];
}
export interface TrackDef { inst: string; pattern: string; notes: number[]; gain: number }
export interface ThemeDef { id: string; bpm: number; root: number; scale: number[]; swing: number; tracks: TrackDef[] }
export interface OwNode { id: string; x: number; y: number; level: string; label: string; requires: string; kind: string }
export interface OwNpc { id: string; x: number; y: number; puppet: string; lines: string[] }
export interface OverworldDef { start: [number, number]; nodes: OwNode[]; npcs: OwNpc[]; props: { kind: string; x: number; y: number; s: number }[]; size: [number, number] }
export interface StageLayer { art: string; depth: number; y: number; tile: boolean; scale: number; tint: string }
export interface StageDef { id: string; layers: StageLayer[]; floor: number; ceiling: number; width: number }

export interface Content {
  player: Record<string, number>;
  bosses: Record<string, BossDef>;
  minions: Record<string, MinionDef>;
  levels: Record<string, LevelDef>;
  weapons: Record<string, WeaponDef>;
  supers: Record<string, SuperDef>;
  charms: Record<string, CharmDef>;
  shop: ShopItem[];
  projectiles: Record<string, ProjDef>;
  puppets: Record<string, PuppetDef>;
  stories: Record<string, StoryDef>;
  controls: ControlsDef;
  themes: Record<string, ThemeDef>;
  overworld: OverworldDef;
  stages: Record<string, StageDef>;
  strings: Record<string, string>;
  errors: string[];
}

const pct = (v: KdlValue | undefined): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return v > 1 ? v / 100 : v;
  const s = String(v).trim();
  if (s.endsWith("%")) return parseFloat(s) / 100;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n > 1 ? n / 100 : n;
};

const NOTE_RE = /^([A-G])(#|b)?(-?\d)$/;
export function noteToMidi(v: KdlValue): number {
  if (typeof v === "number") return v;
  const m = NOTE_RE.exec(String(v));
  if (!m) return 60;
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  return 12 * (parseInt(m[3]) + 1) + base[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}

export function emptyContent(): Content {
  return {
    player: {}, bosses: {}, minions: {}, levels: {}, weapons: {}, supers: {}, charms: {}, shop: [], projectiles: {},
    puppets: {}, stories: {}, controls: { joystick: { zone: 0.4, dead: 0.25, radius: 70 }, buttons: [], safe: [] },
    themes: {}, overworld: { start: [0, 0], nodes: [], npcs: [], props: [], size: [10, 10] }, stages: {}, strings: {}, errors: [],
  };
}

/** Parse a set of {path: text} KDL files into Content. Never throws; errors land in content.errors. */
export function loadContent(files: Record<string, string>): Content {
  const c = emptyContent();
  for (const [path, text] of Object.entries(files)) {
    let nodes: KdlNode[];
    try { nodes = parseKdl(text, path); } catch (e) { c.errors.push(String((e as Error).message)); continue; }
    for (const n of nodes) {
      try { loadNode(c, n, path); } catch (e) { c.errors.push(`${path}:${n.line}: ${(e as Error).message}`); }
    }
  }
  return c;
}

function loadNode(c: Content, n: KdlNode, file: string) {
  const id = argStr(n, 0, "");
  switch (n.name) {
    case "player":
      for (const k of n.children) c.player[k.name] = argNum(k, 0, 0);
      return;
    case "boss": {
      const phases: PhaseDef[] = childrenNamed(n, "phase").map((p) => ({
        id: argStr(p, 0, "phase"), name: propStr(p, "name", argStr(p, 0, "")), until: pct(p.props.until), script: p.children, line: p.line,
      }));
      c.bosses[id] = {
        id, name: propStr(n, "name", id), title: propStr(n, "title", ""), hp: propNum(n, "hp", 1000), theme: propStr(n, "theme", id),
        stage: propStr(n, "stage", id), puppet: propStr(n, "puppet", id), w: propNum(n, "w", 200), h: propNum(n, "h", 240),
        x: propNum(n, "x", 420), y: propNum(n, "y", 0), intro: propStr(n, "intro", ""), outro: propStr(n, "outro", ""),
        reward: propNum(n, "reward", 25), phases, file,
      };
      return;
    }
    case "minion":
      c.minions[id] = {
        id, hp: propNum(n, "hp", 10), puppet: propStr(n, "puppet", id), w: propNum(n, "w", 60), h: propNum(n, "h", 60),
        gravity: propNum(n, "gravity", 0), parryable: propBool(n, "parryable", false), contact: propBool(n, "contact", true), script: n.children,
      };
      return;
    case "level":
      c.levels[id] = {
        id, name: propStr(n, "name", id), mode: propStr(n, "mode", "run") as LevelDef["mode"], length: propNum(n, "length", 1280),
        stage: propStr(n, "stage", id), theme: propStr(n, "theme", id), boss: propStr(n, "boss", ""), intro: propStr(n, "intro", ""),
        reward: propNum(n, "reward", 10), script: n.children,
      };
      return;
    case "weapon":
      c.weapons[id] = {
        id, name: propStr(n, "name", id), kind: propStr(n, "kind", "straight") as WeaponDef["kind"], rate: propNum(n, "rate", 8),
        damage: propNum(n, "damage", 4), speed: propNum(n, "speed", 1400), count: propNum(n, "count", 1), spread: propNum(n, "spread", 0),
        range: propNum(n, "range", 2000), projectile: propStr(n, "projectile", id), ex: propStr(n, "ex", ""), desc: propStr(n, "desc", ""),
      };
      return;
    case "super":
      c.supers[id] = { id, name: propStr(n, "name", id), kind: propStr(n, "kind", "beam") as SuperDef["kind"], dur: propNum(n, "dur", 2), damage: propNum(n, "damage", 10), desc: propStr(n, "desc", "") };
      return;
    case "charm":
      c.charms[id] = { id, name: propStr(n, "name", id), desc: propStr(n, "desc", ""), effect: propStr(n, "effect", id), value: propNum(n, "value", 1) };
      return;
    case "shop":
      for (const k of n.children) c.shop.push({ id: argStr(k, 0, ""), kind: k.name as ShopItem["kind"], price: propNum(k, "price", 1) });
      return;
    case "projectile":
      c.projectiles[id] = {
        id, sprite: propStr(n, "sprite", id), r: propNum(n, "r", 12), damage: propNum(n, "damage", 1), gravity: propNum(n, "gravity", 0),
        spin: propNum(n, "spin", 0), life: propNum(n, "life", 6), parryable: propBool(n, "parryable", false), hostile: propBool(n, "hostile", true),
        pierce: propBool(n, "pierce", false), scale: propNum(n, "scale", 1),
      };
      return;
    case "puppet":
      c.puppets[id] = {
        id, scale: propNum(n, "scale", 1),
        parts: childrenNamed(n, "part").map((p, i) => ({
          id: argStr(p, 0, "p" + i), svg: propStr(p, "svg", ""), x: propNum(p, "x", 0), y: propNum(p, "y", 0),
          px: propNum(p, "px", 0.5), py: propNum(p, "py", 0.5), z: propNum(p, "z", i), parent: propStr(p, "parent", ""),
          anim: propStr(p, "anim", ""), size: propNum(p, "size", 128), tags: propStr(p, "tags", "").split(/\s+/).filter(Boolean),
        })),
      };
      return;
    case "story":
      c.stories[id] = {
        id,
        panels: childrenNamed(n, "panel").map((p) => ({
          layout: propStr(p, "layout", "wide"), bg: propStr(p, "bg", "paper"), caption: propStr(p, "caption", ""), sfx: propStr(p, "sfx", ""),
          art: childrenNamed(p, "art").map((a) => ({ id: argStr(a, 0, ""), x: propNum(a, "x", 50), y: propNum(a, "y", 60), s: propNum(a, "s", 1), flip: propBool(a, "flip", false) })),
          bubbles: p.children.filter((b) => b.name === "say" || b.name === "shout" || b.name === "think" || b.name === "sfx").map((b) => ({
            kind: b.name, who: argStr(b, 0, ""), text: argStr(b, 1, ""), x: propNum(b, "x", 50), y: propNum(b, "y", 20), tail: propStr(b, "tail", "down"),
          })),
        })),
      };
      return;
    case "controls": {
      const j = child(n, "joystick");
      c.controls = {
        joystick: { zone: j ? propNum(j, "zone", 0.4) : 0.4, dead: j ? propNum(j, "dead", 0.25) : 0.25, radius: j ? propNum(j, "radius", 70) : 70 },
        buttons: childrenNamed(n, "button").map((b) => ({
          id: argStr(b, 0, ""), x: propNum(b, "x", 0.8), y: propNum(b, "y", 0.8), r: propNum(b, "r", 40), shape: propStr(b, "shape", "circle"),
          icon: propStr(b, "icon", argStr(b, 0, "")), hit: propNum(b, "hit", 1.35),
        })),
        safe: childrenNamed(n, "safe-zone").map((s) => ({ id: argStr(s, 0, ""), x: propNum(s, "x", 0), y: propNum(s, "y", 0), w: propNum(s, "w", 0.2), h: propNum(s, "h", 0.3) })),
      };
      return;
    }
    case "theme":
      c.themes[id] = {
        id, bpm: propNum(n, "bpm", 120), root: noteToMidi(n.props.root ?? 50), swing: propNum(n, "swing", 0),
        scale: (child(n, "scale")?.args ?? [0, 2, 4, 5, 7, 9, 11]).map(Number),
        tracks: n.children.filter((t) => t.name !== "scale").map((t) => ({
          inst: t.name, pattern: argStr(t, 0, ""), notes: t.args.slice(1).map((v) => (typeof v === "number" ? v : noteToMidi(v))), gain: propNum(t, "gain", 1),
        })),
      };
      return;
    case "overworld":
      c.overworld = {
        start: [propNum(n, "x", 0), propNum(n, "y", 0)], size: [propNum(n, "w", 12), propNum(n, "h", 12)],
        nodes: childrenNamed(n, "node").map((k) => ({
          id: argStr(k, 0, ""), x: propNum(k, "x", 0), y: propNum(k, "y", 0), level: propStr(k, "level", ""), label: propStr(k, "label", ""),
          requires: propStr(k, "requires", ""), kind: propStr(k, "kind", "tent"),
        })),
        npcs: childrenNamed(n, "npc").map((k) => ({
          id: argStr(k, 0, ""), x: propNum(k, "x", 0), y: propNum(k, "y", 0), puppet: propStr(k, "puppet", argStr(k, 0, "")),
          lines: childrenNamed(k, "line").map((l) => argStr(l, 0, "")),
        })),
        props: childrenNamed(n, "prop").map((k) => ({ kind: argStr(k, 0, ""), x: propNum(k, "x", 0), y: propNum(k, "y", 0), s: propNum(k, "s", 1) })),
      };
      return;
    case "stage":
      c.stages[id] = {
        id, floor: propNum(n, "floor", -250), ceiling: propNum(n, "ceiling", 360), width: propNum(n, "width", 1280),
        layers: childrenNamed(n, "layer").map((l) => ({
          art: argStr(l, 0, ""), depth: propNum(l, "depth", 1), y: propNum(l, "y", 0), tile: propBool(l, "tile", false),
          scale: propNum(l, "scale", 1), tint: propStr(l, "tint", ""),
        })),
      };
      return;
    case "strings":
      for (const k of n.children) c.strings[k.name] = argStr(k, 0, "");
      return;
    default:
      throw new Error(`unknown top-level node '${n.name}'`);
  }
}
