// Shared helpers for vocabulary words. Pure, tiny, no state.
import type { KdlValue } from "../../core/kdl";
import type { Ent, WordCall, WorldApi } from "../types";

export function* wait(w: WorldApi, s: number): Generator<void, void, void> {
  let t = 0;
  while (t < s - 1e-6) { t += w.dt; yield; }
}

export function* until(cond: () => boolean, max = Infinity, dt = 1 / 60): Generator<void, void, void> {
  let t = 0;
  while (!cond() && t < max) { t += dt; yield; }
}

export const num = (c: WordCall, i: number, d: number): number => {
  const v = c.args[i];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return d;
};
export const str = (c: WordCall, i: number, d: string): string => (c.args[i] == null ? d : String(c.args[i]));
export const pnum = (c: WordCall, k: string, d: number): number => (typeof c.props[k] === "number" ? (c.props[k] as number) : d);
export const pstr = (c: WordCall, k: string, d: string): string => (c.props[k] == null ? d : String(c.props[k]));
export const pbool = (c: WordCall, k: string, d: boolean): boolean => (typeof c.props[k] === "boolean" ? (c.props[k] as boolean) : d);

/** Resolve an x coordinate: number (camera-relative), or player/me/left/right/center/random/far. */
export function resolveX(w: WorldApi, v: KdlValue | undefined, me: Ent, d?: number): number {
  if (typeof v === "number") return w.camX + v;
  const margin = me.w * me.scale * 0.5 + 10;
  switch (v) {
    case "player": return w.player.x;
    case "me": return me.x;
    case "left": return w.left + margin;
    case "right": return w.right - margin;
    case "center": return w.camX;
    case "random": return w.range(w.left + margin, w.right - margin);
    case "far": return w.player.x < w.camX ? w.right - margin : w.left + margin;
    case "near": return w.player.x < w.camX ? w.left + margin : w.right - margin;
  }
  return d ?? me.x;
}

export function resolveY(w: WorldApi, v: KdlValue | undefined, me: Ent, d?: number): number {
  if (typeof v === "number") return w.camY + v;
  switch (v) {
    case "player": return w.player.y + w.player.h * 0.5;
    case "floor": return w.floor;
    case "top": return w.ceiling;
    case "me": return me.y;
  }
  return d ?? me.y;
}

/** Muzzle point on an entity: from=mid|top|feet|front|trunk */
export function anchor(me: Ent, from = "front"): [number, number] {
  const s = me.scale, h = me.h * s, w = me.w * s;
  const flip = me.flipY ? -1 : 1;
  switch (from) {
    case "top": return [me.x, me.y + (flip > 0 ? h : 0) + 10];
    case "feet": return [me.x, me.y + 4];
    case "mid": return [me.x, me.y + h * 0.5];
    case "trunk": return [me.x + me.facing * w * 0.55, me.y + h * (flip > 0 ? 0.42 : 0.58)];
    case "hat": return [me.x + me.facing * w * 0.1, me.y + h * 0.98];
    default: return [me.x + me.facing * w * 0.45, me.y + h * (flip > 0 ? 0.62 : 0.38)];
  }
}

export const angleTo = (x: number, y: number, tx: number, ty: number) => Math.atan2(ty - y, tx - x);
export const deg = (d: number) => (d * Math.PI) / 180;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const facePlayer = (w: WorldApi, me: Ent) => { me.facing = w.player.x < me.x ? -1 : 1; };
