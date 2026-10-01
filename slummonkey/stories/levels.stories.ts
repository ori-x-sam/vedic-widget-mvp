import type { Meta, StoryObj } from "@storybook/html-vite";
import { expect } from "storybook/test";
import { stage, harnessOf } from "./harness";

const meta: Meta = { title: "Levels", render: (args) => stage(args as never) };
export default meta;

export const MelaRunAndGun: StoryObj = {
  args: { level: "mela", seed: 2, god: true, script: () => ({ x: 1, held: { shoot: true } }) },
  play: async ({ canvasElement }) => {
    const h = await harnessOf(canvasElement);
    h.runUntil((w) => w.all.some((e) => e.def === "kettle"), 6);
    await expect(h.world.all.some((e) => e.def === "kettle")).toBe(true); // running triggers words by distance
    await expect(h.world.camX).toBeGreaterThan(0); // camera follows
    const won = h.runUntil((w) => w.result === "win", 60);
    await expect(won).toBe(true); // reaching the goal banner wins
  },
};

export const RickshawShmup: StoryObj = {
  args: { level: "rickshaw-sky", seed: 2, god: true, script: () => ({ held: { shoot: true } }) },
  play: async ({ canvasElement }) => {
    const h = await harnessOf(canvasElement);
    h.run(3);
    await expect(h.world.player.flying).toBe(true);
    await expect(h.view.playerPuppetId).toBe("rickshaw");
    await expect(h.world.camX).toBeGreaterThan(300); // auto-scroll
    await expect(h.world.all.some((e) => e.def === "kite")).toBe(true);
  },
};
