// Overworld island rules: walk on a plain-text tile map, find nearby tents/NPCs, gate by bosses beaten.
import type { OverworldDef } from "../core/content";
import type { InputFrame } from "../core/input";

export interface Near { id: string; kind: "node" | "npc"; label: string; locked: boolean }

export class Overworld {
  x: number; y: number; facing = 1; moving = false; t = 0;
  beaten = new Set<string>();
  near: Near | null = null;
  private talks = new Map<string, number>();
  speed = 3.2; // tiles/s

  constructor(public def: OverworldDef) {
    this.x = def.start[0]; this.y = def.start[1];
  }

  walkable(gx: number, gy: number): boolean {
    const row = this.def.map[Math.floor(gy)];
    const ch = row?.[Math.floor(gx)];
    return ch !== undefined && !"~^T".includes(ch);
  }

  isLocked(requires: string) { return requires.split(/\s+/).filter(Boolean).some((r) => !this.beaten.has(r)); }

  talkCount(id: string) { const n = this.talks.get(id) ?? 0; this.talks.set(id, n + 1); return n; }

  step(f: InputFrame, dt: number) {
    this.t += dt;
    // screen-aligned stick -> iso grid directions
    const gx = (f.mx - f.my) / 2, gy = (-f.mx - f.my) / 2;
    const l = Math.hypot(gx, gy);
    this.moving = l > 0;
    if (l > 0) {
      const nx = this.x + (gx / l) * this.speed * dt, ny = this.y + (gy / l) * this.speed * dt;
      if (this.walkable(nx, this.y)) this.x = nx;
      if (this.walkable(this.x, ny)) this.y = ny;
      if (f.mx) this.facing = f.mx > 0 ? 1 : -1;
    }
    this.near = null;
    let best = 1.3;
    for (const n of this.def.nodes) {
      const d = Math.hypot(n.x + 0.5 - this.x, n.y + 0.5 - this.y);
      if (d < best) { best = d; this.near = { id: n.id, kind: "node", label: n.label, locked: this.isLocked(n.requires) }; }
    }
    for (const n of this.def.npcs) {
      const d = Math.hypot(n.x + 0.5 - this.x, n.y + 0.5 - this.y);
      if (d < best) { best = d; this.near = { id: n.id, kind: "npc", label: n.id, locked: false }; }
    }
  }
}
