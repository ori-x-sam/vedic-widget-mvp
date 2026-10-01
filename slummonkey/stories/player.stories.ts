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
  h.run(0.2);
  await expect(Math.abs(h.world.player.vx)).toBeLessThan(5); // stops crisply when the stick is released
});

export const AutoAim = mv(() => ({}), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const p = h.world.player;
  // a shootable thing up and to the right: no buttons held, the blaster tracks and fires at it
  h.world.spawnEnt("minion", "dummy", p.x + 500, p.y + 260, { hp: 999, maxHp: 999, w: 60, h: 60, shootable: true, hurts: false, gravity: 0 });
  h.run(0.5);
  const mine = h.world.projs.live.filter((q) => !q.hostile);
  await expect(mine.length).toBeGreaterThan(1);
  for (const q of mine) { await expect(q.vx).toBeGreaterThan(0); await expect(q.vy).toBeGreaterThan(0); } // aimed up-right, at the target
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
  await expect(h.view.playerPartVisible("rotor")).toBe(true); // the tail becomes a rotor
  await expect(h.view.playerPartVisible("tail")).toBe(false);
  await expect(h.log).toContain("glide:start"); // whirr sound starts
});

// Parry = press JUMP again in the air next to something pink. No extra button.
export const ParryOnJump = mv((_, t) => ({ press: at(0, 0.22, t) || at(0.25, 0.3, t) ? ["jump"] : [] }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const p = h.world.player;
  h.world.spawnProj("marigold", p.x + 140, p.y + 240, -300, 0, { owner: 0 });
  const ok = h.runUntil((w) => w.player.stats.parries > 0, 1.5);
  await expect(ok).toBe(true); // mid-air on a pink object
  await expect(h.world.player.cards).toBeGreaterThanOrEqual(1); // fills the SPECIAL meter
  await expect(h.log).toContain("parry"); // triggers hit-stop (the session freezes the clock on this event)
  await expect(h.world.player.vy).toBeGreaterThan(0); // bounce
});

export const Dash = mv((_, t) => ({ x: at(0, 0.3, t) ? 1 : 0, press: at(0, 0.05, t) ? ["blink"] : at(0.4, 0.45, t) ? ["jump"] : at(0.55, 0.6, t) ? ["blink"] : at(0.7, 0.75, t) ? ["blink"] : [] }), {}, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const x0 = h.world.player.x;
  h.run(0.05);
  await expect(h.world.player.pose).toBe("dash");
  await expect(h.world.player.blinkT).toBeGreaterThan(0); // i-frames
  await expect(h.view.ghostVisible()).toBe(true); // afterimage
  h.run(0.15);
  await expect(h.world.player.x - x0).toBeGreaterThan(180); // a quick slide, not a teleport
  h.run(0.8);
  await expect(h.world.player.stats.blinks).toBe(2); // once per jump in the air: the second air dash is refused
});

for (const [name, weapon, check] of [
  ["CoinBlaster", "coin", "straight"], ["MirchiSpread", "mirchi", "spread"], ["KabootarSeeker", "kabootar", "homing"], ["LaddooLobber", "laddoo", "arc"],
] as const) {
  (globalThis as Record<string, unknown>)[name] = mv(() => ({ held: { shoot: true } }), { weapons: [weapon] }, async ({ canvasElement }) => {
    const h = await harnessOf(canvasElement);
    h.run(0.35);
    const shots = h.world.projs.live.filter((p) => !p.hostile);
    await expect(shots.length).toBeGreaterThan(0);
    if (check === "straight") await expect(new Set(shots.map((p) => Math.round(Math.atan2(p.vy, p.vx) * 50))).size).toBe(1); // one parallel stream (auto-aimed at the dummy boss)
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
