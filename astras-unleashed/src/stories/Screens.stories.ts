// One story per screen and per interesting state. Each sets state directly, then its play function drives the real
// canvas and asserts on what is shown.
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { ready, screenText, stage, storyArgs, storyControls, type StoryArgs } from './stage';

export default {
  title: 'Screens',
  args: storyArgs,
  ...storyControls,
} satisfies Meta<StoryArgs>;
type Story = StoryObj<StoryArgs>;

export const Title: Story = {
  render: () => stage(() => ({ ui: { screen: 'title' } }), 1000),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText()).toContain('Astras');
    await expect(screenText()).toContain('Unleashed');
    await expect(screenText()).toContain('20 GODS · 12 KSHETRAS · 4 AGES');
  },
};
