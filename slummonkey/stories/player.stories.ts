// One story per SlumMonkey move, in an empty arena. Scripts are thumbs; play() checks the move.
import type { Meta, StoryObj } from "@storybook/html-vite";
import { expect } from "storybook/test";
import { stage, harnessOf, Script } from "./harness";

const meta: Meta = { title: "Player", render: (args) => stage(args as never) };
export default meta;
type S = StoryObj;
const at = (from: number, to: number, t: number) => t >= from && t < to;
const mv = (script: Script, extra: Record<string, unknown> = {}, play: S["play"]): S => ({ args: { arena: true, god: true, script, ...extra }, play });

export const Run = mv((_, t) => ({ x: at(0, 1, t) ? 1 : 0 }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const x0 = h.world.player.x;
  h.run(0.5);
  await expect(h.world.player.pose).toBe("run");
  h.run(0.5);
  await expect(h.world.player.x - x0).toBeGreaterThan(300);
});

export const AimEightWay = mv(() => ({ y: 1, held: { shoot: true } }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(0.4);
  const mine = h.world.projs.live.filter((p) => !p.hostile);
  await expect(mine.length).toBeGreaterThan(1);
  for (const p of mine) { await expect(p.vy).toBeGreaterThan(0); await expect(Math.abs(p.vx)).toBeLessThan(1); } // straight up
});

export const AimLock = mv(() => ({ x: 1, y: 1, held: { shoot: true, lock: true } }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const x0 = h.world.player.x;
  h.run(0.5);
  await expect(h.world.player.x).toBe(x0); // locked in place
  const p = h.world.projs.live.find((q) => !q.hostile)!;
  await expect(p.vx).toBeGreaterThan(0); await expect(p.vy).toBeGreaterThan(0); // diagonal aim
});

export const Duck = mv(() => ({ y: -1 }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(0.3);
  await expect(h.world.player.pose).toBe("duck");
  await expect(h.world.player.hitH).toBeLessThan(60);
});

export const DoubleJump = mv((_, t) => ({ press: at(0, 0.25, t) || at(0.3, 0.45, t) ? ["jump"] : [] }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  let top = 0, jumps = 0;
  h.run(1.2, (w) => { top = Math.max(top, w.player.y); jumps = Math.max(jumps, w.player.jumps); return false; });
  await expect(jumps).toBe(2);
  await expect(top).toBeGreaterThan(260); // higher than one jump (~200)
});

export const TailGlide = mv((_, t) => ({ press: at(0, 0.05, t) || t >= 0.3 ? ["jump"] : [] }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const ok = h.runUntil((w) => w.player.gliding, 2);
  await expect(ok).toBe(true);
  h.run(0.3);
  await expect(h.world.player.vy).toBeGreaterThanOrEqual(-h.world.player.def["glide-fall"] - 1); // slow glide down
  await expect(h.view.playerPartVisible("rotor")).toBe(true); // visible rotor smear
  await expect(h.view.playerPartVisible("tail")).toBe(false);
  await expect(h.log).toContain("glide:start"); // whirr sound starts
});

export const Parry = mv((_, t) => ({ press: [...(at(0, 0.3, t) ? ["jump" as const] : []), ...(at(0.25, 0.3, t) ? ["parry" as const] : [])] }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const p = h.world.player;
  h.world.spawnProj("marigold", p.x + 140, p.y + 240, -300, 0, { owner: 0 });
  const ok = h.runUntil((w) => w.player.stats.parries > 0, 1.5);
  await expect(ok).toBe(true); // mid-air on a pink-marigold object
  await expect(h.world.player.cards).toBeGreaterThanOrEqual(1); // fills the super meter
  await expect(h.log).toContain("parry"); // triggers hit-stop (the session freezes the clock on this event)
  await expect(h.world.player.vy).toBeGreaterThan(0); // bounce
});

export const Blink = mv((_, t) => ({ x: 1, press: at(0, 0.05, t) ? ["blink"] : at(0.1, 0.15, t) ? ["jump"] : at(0.3, 0.35, t) ? ["blink"] : at(0.9, 0.95, t) ? ["blink"] : [] }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const x0 = h.world.player.x;
  h.run(1 / 60);
  await expect(h.world.player.x - x0).toBeGreaterThan(200); // short cyborg teleport
  await expect(h.world.player.blinkT).toBeGreaterThan(0); // i-frames
  h.run(0.05);
  await expect(h.view.ghostVisible()).toBe(true); // glitchy afterimage
  h.run(1.2);
  await expect(h.world.player.stats.blinks).toBe(2); // in air once per jump: the third press (still airborne) is refused
});

for (const [name, weapon, check] of [
  ["CoinBlaster", "coin", "straight"], ["MirchiSpread", "mirchi", "spread"], ["KabootarSeeker", "kabootar", "homing"], ["LaddooLobber", "laddoo", "arc"],
] as const) {
  (globalThis as Record<string, unknown>)[name] = mv(() => ({ held: { shoot: true } }), { weapons: [weapon] }, async ({ canvasElement }) => {
    const h = await harnessOf(canvasElement);
    h.run(0.35);
    const shots = h.world.projs.live.filter((p) => !p.hostile);
    await expect(shots.length).toBeGreaterThan(0);
    if (check === "straight") for (const p of shots) await expect(Math.abs(p.vy)).toBeLessThan(1);
    if (check === "spread") await expect(new Set(shots.map((p) => Math.round(p.vy))).size).toBeGreaterThanOrEqual(3);
    if (check === "homing") await expect(shots.every((p) => p.homing > 0)).toBe(true);
    if (check === "arc") await expect(shots.every((p) => p.gravity > 0)).toBe(true);
  });
}
const G = globalThis as unknown as Record<string, S>;
export const CoinBlaster = G.CoinBlaster;
export const MirchiSpread = G.MirchiSpread;
export const KabootarSeeker = G.KabootarSeeker;
export const LaddooLobber = G.LaddooLobber;

export const ExShot = mv((_, t) => ({ press: at(0, 0.05, t) ? ["ex"] : [] }), { cards: 2 }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(0.1);
  await expect(h.world.player.cards).toBe(1);
  await expect(h.world.projs.live.some((p) => p.def.id === "ex-coin")).toBe(true);
});

export const SuperToTheMoon = mv((_, t) => ({ press: at(0, 0.05, t) ? ["ex"] : [] }), { cards: 5, super: "to-the-moon" }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(0.2);
  await expect(h.world.projs.live.some((p) => p.def.id === "moon-beam" && p.len > 1000)).toBe(true); // rocket beam
  await expect(h.world.player.superT).toBeGreaterThan(0);
});

export const SuperDiamondHands = mv((_, t) => ({ press: at(0, 0.05, t) ? ["ex"] : [] }), { cards: 5, super: "diamond-hands" }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(0.2);
  await expect(h.world.player.invulnT).toBeGreaterThan(4); // invulnerable
});

export const SuperAirdrop = mv((_, t) => ({ press: at(0, 0.05, t) ? ["ex"] : [] }), { cards: 5, super: "airdrop" }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(0.2);
  await expect(h.world.projs.live.filter((p) => p.def.id === "airdrop-crate").length).toBeGreaterThanOrEqual(10); // bombardment from above
});
