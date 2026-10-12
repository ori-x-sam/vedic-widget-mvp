// Day 1, The Drive In, and every other conversation in the demo: each one played by clicking on through its lines
// and choosing by key or by clicking, as a player does, asserting where it leads and what it changes.
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import * as Game from '../game';
import { T } from '../tuning';
import { advance, key, night1, press, readOn, ready, run, screenText, stage, storyArgs, storyControls, ui, type StoryArgs } from './stage';

export default {
  title: 'Day 1 — The Drive In',
  args: storyArgs,
  ...storyControls,
} satisfies Meta<StoryArgs>;
type Story = StoryObj<StoryArgs>;

/** The day from its first line, or from the start of a named scene. */
const from = (scene?: string, marks?: Partial<Game.GameState['marks']>, flags: string[] = []) => () => {
  let s = Game.newGame();
  if (scene) s = Game.enterScene({ ...s, flags: [...s.flags, ...flags] }, scene);
  return { run: { ...s, marks: { ...s.marks, ...marks } } };
};
/** Up to the doe, with the rifle in his hands. */
const atTheDoe = () => {
  let s = Game.newGame();
  while (!(s.talk?.beat === 'doe' && Game.choices(s).length)) s = Game.choices(s).length ? Game.choose(s, 0) : Game.next(s);
  return { run: s };
};

export const TheJeep: Story = {
  render: () => stage(from()),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText().join(' ')).toMatch(/Forty miles of sal jungle/);
    await readOn();
    await expect(run().talk!.beat).toBe('drive-2');
    const before = run().marks.suspicion;
    await key('1');
    await expect(run().marks.suspicion).toBe(before - 1);
    await expect(run().talk!.beat).toBe('drive-flatter');
  },
};

export const TheDoeShot: Story = {
  render: () => stage(atTheDoe),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText().join(' ')).toMatch(/1\.\s+Raise the rifle/);
    await press('1.');
    await expect(run().flags).toContain('shot-doe');
    await expect(run().marks.regard).toBe(T.REGARD_START - 2);
  },
};

export const TheDoeSpared: Story = {
  render: () => stage(atTheDoe),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await key('2');
    await expect(run().flags).toContain('spared-doe');
    await readOn();
    await expect(run().talk!.scene).toBe('drinks');
    await expect(run().marks.regard).toBe(T.REGARD_START + 2);
  },
};

export const TheDoeGoneWhileHeHesitated: Story = {
  render: () => stage(atTheDoe),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    advance(13_000);
    await expect(run().flags).toContain('hesitated');
    await expect(run().talk!.beat).toBe('doe-gone');
  },
};

export const TheVerandahTheMoon: Story = {
  render: () => stage(from('drinks')),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await readOn();
    await expect(run().clues).toContain('sudam-vanished');
    await key('1');
    await expect(run().flags).toContain('told-moon');
    await readOn();
    await expect(run().phase).toBe('night');
    await expect(ui.getState().card?.title).toBe('Night 1');
  },
};

export const TheVerandahTooDirect: Story = {
  render: () => stage(from('drinks', { suspicion: 4 })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await readOn();
    await key('3');
    await expect(run().marks.suspicion).toBe(6);
    await readOn();
    await expect(run().flags).toContain('bolted-twice');
  },
};

export const CaughtTheMoonExcuseWorks: Story = {
  render: () => stage(() => { const s = night1({ open: ['guest-door'] }); return { run: Game.enterScene(s, 'caught-1') }; }),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await readOn();
    const before = run().marks.suspicion;
    await press('1.');
    await expect(run().talk!.beat).toBe('caught-1-moon');
    await expect(run().marks.suspicion).toBe(before);
  },
};

export const CaughtTheMoonExcuseFails: Story = {
  render: () => stage(() => { const s = night1({ open: ['guest-door'] }); return { run: Game.enterScene({ ...s, flags: s.flags.filter((f) => f !== 'told-moon') }, 'caught-1') }; }),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await readOn();
    const before = run().marks.suspicion;
    await press('1.');
    await expect(run().talk!.beat).toBe('caught-1-moon-new');
    await expect(run().marks.suspicion).toBe(before + 2);
  },
};

export const CaughtTheTruth: Story = {
  render: () => stage(() => ({ run: Game.enterScene(night1({ open: ['guest-door'] }), 'caught-1') })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await readOn();
    const regard = run().marks.regard;
    await key('3');
    await expect(run().marks.regard).toBe(regard + 1);
    await readOn();
    await expect(run().talk).toBeNull();
    await expect(run().night!.doors).not.toContain('guest-door');
  },
};

export const TheKnockAndDayTwo: Story = {
  render: () => stage(from('morning-2')),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText()).toContain('Knock.');
    await readOn();
    await expect(run().talk!.beat).toBe('hub-2');
  },
};

export const TheMidnightShikar: Story = {
  render: () => stage(() => {
    let s = Game.newGame();
    s = { ...s, marks: { ...s.marks, suspicion: T.SUSPICION_PEAK } };
    return { run: s };
  }),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    // The first beat to start after the peak is the shikar's.
    for (let i = 0; i < 30 && run().talk?.scene !== Game.PEAK_SCENE; i++) await key(Game.choices(run()).length ? '1' : ' ');
    await expect(run().talk!.scene).toBe(Game.PEAK_SCENE);
    await readOn();
    await expect(run().ending).toBe('shikar-end');
    await expect(ui.getState().card?.title).toBe('The Midnight Shikar');
  },
};
