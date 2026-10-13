// A phone, held in landscape: the whole game played with thumbs only (pointer events of type touch), as on a phone.
// The title card and the lines go on with a tap anywhere; the left thumb walks on the thumbstick and the right one
// looks; the pad's round button and small ones touch, photograph, light the candle and open the casebook.
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import * as Game from '../game';
import { look } from '../input';
import { view } from '../stage';
import { night1, press, ready, run, screenText, stage, storyArgs, storyControls, thumb, thumbHold, ui, type StoryArgs } from './stage';

export default {
  title: 'Phone — thumbs only',
  args: storyArgs,
  ...storyControls,
} satisfies Meta<StoryArgs>;
type Story = StoryObj<StoryArgs>;

/** The game as Begin leaves it: Day 1's first line under its title card, played by touch. */
const begun = () => ({ run: Game.newGame(), ui: { touch: true, card: { kind: 'title' as const, title: 'Day 1', sub: 'The Drive In', text: '' } } });
/** Night 1 at the bolt, Bhima away, played by touch. */
const atTheBolt = () => ({ run: night1({ quiet: true }), ui: { touch: true } });

export const ATapGoesOn: Story = {
  render: () => stage(begun),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText()).toContain('tap to go on');
    // The card covers everything and swallows taps: a tap anywhere on it still dismisses it.
    await thumb(view.width / 2, view.height / 2);
    await expect(ui.getState().card).toBeNull();
    await expect(screenText()).toContain('tap');
    const at = run().talk!.at;
    await thumb(view.width / 2, 80);
    await expect(run().talk!.at).toBe(at + 1);
    // On the dialogue box itself too.
    await thumb(view.width / 2, view.height - 40);
    await expect(run().talk!.at).toBe(at + 2);
  },
};

export const TheLeftThumbWalksTheRightLooks: Story = {
  render: () => stage(atTheBolt),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    const before = { ...run().night! };
    // Left thumb down low on the left, pushed up (forward) for a second and a half.
    await thumbHold(120, view.height - 80, 0, -50, 1500);
    const after = run().night!;
    await expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(1);
    await expect(ui.getState().stick).toBeNull();
    // Right thumb dragged left: the eye turns, he doesn't walk.
    const yaw = look.yaw, where = { ...run().night! };
    await thumbHold(view.width * 0.6, view.height / 2, -100, 0, 50, 4);
    await expect(look.yaw).toBeLessThan(yaw - 0.3);
    await expect(run().night!.x).toBeCloseTo(where.x, 5);
  },
};

export const ThePadsButtons: Story = {
  render: () => stage(atTheBolt),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText()).toEqual(expect.arrayContaining(['Touch', 'Photo', 'Candle', 'Book']));
    await press('Candle', 'thumb');
    await expect(run().night!.candle).toBe(true);
    await expect(screenText()).toContain('Snuff');
    await press('Book', 'thumb');
    await expect(ui.getState().casebook).toBe(true);
    await press('Close', 'thumb');
    await expect(ui.getState().casebook).toBe(false);
  },
};

export const TheMenuStartsAnyChapter: Story = {
  render: () => stage(atTheBolt),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await press('Menu', 'thumb');
    await expect(ui.getState().menu).toBe(true);
    await expect(screenText()).toEqual(expect.arrayContaining(['Day 4 — Luncheon and Cards', 'Night 7 — The Full Moon']));
    await press('Night 3', 'thumb');
    await expect(ui.getState().menu).toBe(false);
    await expect(run().phase).toBe('night');
    await expect(run().night!.n).toBe(3);
    // Everything the first two nights found is in the casebook, as the story would have it.
    await expect(run().clues).toEqual(expect.arrayContaining(['pulled-claws', 'malati-met']));
    await thumb(view.width / 2, view.height / 2);
    await press('Menu', 'thumb');
    await press('Day 6', 'thumb');
    await expect(run().talk!.scene).toBe('morning-6');
  },
};
