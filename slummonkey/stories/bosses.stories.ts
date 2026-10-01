// One story per boss phase. Each mounts the real renderer and its play() asserts the phase's
// signature move actually happens (rules state AND what the renderer shows).
import type { Meta, StoryObj } from "@storybook/html-vite";
import { expect } from "storybook/test";
import { stage, harnessOf } from "./harness";

const meta: Meta = { title: "Bosses", render: (args) => stage(args as never) };
export default meta;
type S = StoryObj;
const story = (args: Record<string, unknown>, play: S["play"]): S => ({ args, play });

// ── Gayab Gajraj ──
export const GajrajP1SheetTrick = story({ boss: "gajraj", phase: 0, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  const x0 = h.world.boss!.x;
  let maxWaves = 0, sawHidden = false;
  h.runUntil((w) => {
    maxWaves = Math.max(maxWaves, w.projs.live.filter((p) => p.def.id === "shockwave").length);
    if (w.boss!.hidden) sawHidden = true;
    return w.marked("gajraj", "vanish") > 0 && sawHidden && !w.boss!.hidden;
  }, 30);
  await expect(h.world.marked("gajraj", "stomp")).toBeGreaterThan(0);
  await expect(maxWaves).toBeGreaterThanOrEqual(2); // stomp sends a wave each way
  await expect(h.world.marked("gajraj", "spray")).toBeGreaterThan(0); // trunk coin volleys
  await expect(h.log).toContain("sheet:drop");
  await expect(h.log).toContain("drumroll");
  await expect(sawHidden).toBe(true);
  await expect(Math.abs(h.world.boss!.x - x0) > 1 || h.world.marked("gajraj", "charge") > 0).toBe(true); // reappears elsewhere
  await expect(h.view.entityVisible(h.world.boss!.id)).toBe(true);
  await expect(h.view.stageLayerCount).toBeGreaterThan(5); // the painted stage is there
});

export const GajrajP2InvisibleAct = story({ boss: "gajraj", phase: 1, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  // "footprints appear while body alpha < 0.1"
  const ok = h.runUntil((w) => w.marked("gajraj", "footprint-invisible") >= 3, 20);
  await expect(ok).toBe(true);
  await expect(h.world.boss!.alpha).toBeLessThan(0.1);
  await expect(h.view.decalCount).toBeGreaterThan(0); // the renderer drew powder footprints
  const howdah = h.world.all.find((e) => e.def === "howdah")!;
  await expect(howdah.alpha).toBe(1); // the floating howdah stays visible
  await expect(h.view.entityVisible(howdah.id)).toBe(true);
  await expect(h.log.filter((l) => l === "sfx:step").length).toBeGreaterThan(2); // panned stomps to track by ear
});

export const GajrajP3TrickGoneWrong = story({ boss: "gajraj", phase: 2, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.runUntil((w) => w.marked("gajraj", "zip") > 0, 15);
  await expect(h.world.boss!.scale).toBeLessThan(0.4); // puppy-sized
  const mahout = h.world.all.find((e) => e.def === "mahout")!;
  await expect(mahout.parryable).toBe(true); // ghost-mahout is the parry target
  h.run(1.5);
  await expect(Math.abs(h.world.boss!.y - h.world.boss!.py) + Math.abs(h.world.boss!.x - h.world.boss!.px)).toBeGreaterThan(0);
});

// ── Teen Tigada ──
export const TigadaP1RopeTrick = story({ boss: "teen-tigada", phase: 0, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(2.5);
  const ropes = h.world.all.filter((e) => e.kind === "target" && e.def === "rope" && e.alive);
  await expect(ropes.length).toBeGreaterThanOrEqual(2); // auto-aim goes for ropes first, so one may already be down
  const climber = h.world.ent(ropes[0].parent)!;
  await expect(climber.y).toBeGreaterThan(h.world.floor + 100); // they climbed
  h.world.damage(ropes[0], 999); // shoot the rope down
  h.run(1.2);
  await expect(climber.vars.stunned).toBe(1);
  await expect(climber.y).toBeLessThan(h.world.floor + 2); // fell into a dizzy heap
  await expect(h.log.some((l) => l.startsWith("say:"))).toBe(true); // bickering
});

export const TigadaP2MatkaShuffle = story({ boss: "teen-tigada", phase: 1, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  let bombs = 0;
  const ok = h.runUntil((w) => { bombs = Math.max(bombs, w.projs.live.filter((p) => p.def.id === "bomb").length); return w.marked("teen-tigada", "reveal-bonus") > 0; }, 20);
  await expect(ok).toBe(true);
  await expect(h.world.marked("teen-tigada", "shuffle")).toBeGreaterThan(0);
  await expect(bombs).toBe(2); // two pots hold bombs
  const bonus = h.world.all.find((e) => e.kind === "pickup" && e.parryable)!;
  await expect(bonus).toBeTruthy(); // one holds a parryable bonus
});

export const TigadaP3TallMagician = story({ boss: "teen-tigada", phase: 2, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(0.5);
  await expect(h.world.boss!.puppet).toBe("tigada-stack");
  await expect(h.view.entityPuppet(h.world.boss!.id)).toBe("tigada-stack");
  h.world.damage(h.world.boss!, 5);
  await expect(h.world.boss!.wobble).toBeGreaterThan(0.2); // each hit makes the stack wobble
  h.runUntil((w) => w.all.some((e) => e.def === "rabbit"), 8);
  await expect(h.world.all.some((e) => e.def === "rabbit")).toBe(true); // rabbits out of the hat
});

// ── Do-Tukdi Dolly ──
export const DollyP1Split = story({ boss: "dolly", phase: 0, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(1);
  const legs = h.world.all.find((e) => e.kind === "part" && e.def === "legs")!;
  const torso = h.world.all.find((e) => e.kind === "part" && e.def === "torso")!;
  await expect(legs && torso).toBeTruthy();
  const hp0 = h.world.boss!.hp, t0 = torso.hp, l0 = legs.hp;
  h.world.damage(legs, 20);
  await expect(legs.hp).toBe(l0 - 20); // each half has its own HP
  await expect(torso.hp).toBe(t0);
  await expect(h.world.boss!.hp).toBe(hp0 - 20);
  h.runUntil((w) => w.marked("legs", "charge") > 0 && w.marked("torso", "juggle") > 0, 15);
  await expect(h.world.marked("legs", "charge")).toBeGreaterThan(0); // legs charge
  await expect(h.world.marked("torso", "juggle")).toBeGreaterThan(0); // torso juggles flaming clubs
});

export const DollyP2MirrorMaze = story({ boss: "dolly", phase: 1, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(1.2);
  const decoys = h.world.all.filter((e) => e.kind === "decoy");
  await expect(decoys.length).toBe(3);
  await expect(h.world.boss!.reflect).toBe(true);
  await expect(decoys.every((d) => !d.reflect)).toBe(true); // only the real one has a reflection
  await expect(h.view.reflectionVisible(h.world.boss!.id)).toBe(true);
  await expect(decoys.some((d) => h.view.reflectionVisible(d.id))).toBe(false);
  const hp0 = h.world.boss!.hp;
  h.world.damage(decoys[0], 10);
  await expect(h.world.boss!.hp).toBe(hp0); // shooting a copy does nothing
  h.world.damage(h.world.boss!, 10);
  await expect(h.world.boss!.hp).toBe(hp0 - 10); // shooting the real one counts
});

export const DollyP3WrongReassembly = story({ boss: "dolly", phase: 2, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(0.6);
  await expect(h.world.boss!.flipY).toBe(true); // stuck back together upside down
  const ok = h.runUntil((w) => w.all.some((e) => e.def === "buzzsaw"), 15);
  await expect(ok).toBe(true);
  const saw = h.world.all.find((e) => e.def === "buzzsaw")!;
  await expect(saw.platform && saw.hurts).toBe(true); // a buzzsaw you can ride on top of
  await expect(h.world.marked("dolly", "cartwheel")).toBeGreaterThan(0);
  await expect(h.world.boss!.parent).toBe(saw.id); // she rides it
});

// ── Jadugar Raj ──
export const RajP1Showman = story({ boss: "raj", phase: 0, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.runUntil((w) => w.marked("raj", "juggle") > 0, 15);
  await expect(h.world.marked("raj", "spray")).toBeGreaterThan(0); // card fans
  await expect(h.world.marked("raj", "summon")).toBeGreaterThan(0); // top-hat rabbits
  await expect(h.world.marked("raj", "juggle")).toBeGreaterThan(0); // levitating props
});

export const RajP2IndianRopeTrick = story({ boss: "raj", phase: 1, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(5);
  await expect(h.world.camY).toBeGreaterThan(150); // the fight climbs into the clouds
  const above = h.world.all.filter((e) => e.kind === "platform" && e.y > h.world.camY + 100);
  await expect(above.length).toBeGreaterThanOrEqual(2); // rising platforms
  await expect(h.view.stageId).toBe("raj-climb");
});

export const RajP3LotaFlood = story({ boss: "raj", phase: 2, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.run(6);
  await expect(h.world.water).toBeGreaterThan(h.world.floor + 40); // the stage floods
  const rafts = h.world.all.filter((e) => e.def === "raft");
  await expect(rafts.length).toBe(3);
  for (const r of rafts) await expect(Math.abs(r.y - (h.world.water + 12))).toBeLessThan(8); // floating platforms ride the water
});

export const RajP4TheReveal = story({ boss: "raj", phase: 3, seed: 2, god: true }, async ({ canvasElement }) => {
  const h = await harnessOf(canvasElement);
  h.runUntil((w) => w.marked("raj", "graph-shot") > 0, 10);
  await expect(h.world.boss!.puppet).toBe("raj-giant"); // curtains + candlestick charts
  const greens = h.world.projs.live.filter((p) => p.def.id === "candle-green");
  const reds = h.world.projs.live.filter((p) => p.def.id === "candle-red");
  await expect(greens.length).toBeGreaterThan(4);
  await expect(reds.length).toBeGreaterThan(1);
  // pump then dump: the highest bullet sits between a rising run and a falling run
  const all = [...greens, ...reds].sort((a, b) => a.x - b.x);
  const peak = all.reduce((m, p, i) => (p.y > all[m].y ? i : m), 0);
  await expect(peak).toBeGreaterThan(all.length * 0.4);
  await expect(h.view.stageId).toBe("raj-reveal");
});
