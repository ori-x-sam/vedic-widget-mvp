// The screens on their own: the title, the casebook's pages full and empty, the dials, the cards. Each sets state
// directly and its play clicks through it.
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import * as Game from '../game';
import { key, night1, press, ready, run, screenText, stage, storyArgs, storyControls, ui, type StoryArgs } from './stage';

export default {
  title: 'Screens',
  args: storyArgs,
  ...storyControls,
} satisfies Meta<StoryArgs>;
type Story = StoryObj<StoryArgs>;

const full = () => night1({ quiet: true, items: ['hairpin', 'tripod-leg'], clues: ['the-man-eater', 'new-plaque', 'photo-man-eater', 'bolted-in', 'old-plaques'] });

export const Title: Story = {
  render: () => stage(() => ({ run: Game.newGame(), ui: { screen: 'title' } })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText()).toContain('JYOTSNA MAHAL');
    await press('Begin');
    await expect(ui.getState().screen).toBe('play');
    await expect(run().talk!.scene).toBe('drive-in');
    await expect(ui.getState().card?.sub).toBe('The Drive In');
  },
};

export const TitleWithASave: Story = {
  render: () => stage(() => ({ run: Game.newGame(), ui: { screen: 'title' }, save: night1() })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await press('Night 1, again');
    await expect(run().phase).toBe('night');
  },
};

export const CasebookEvidence: Story = {
  render: () => stage(() => ({ run: full(), ui: { casebook: true, tab: 'evidence' } })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await press('The plaque');
    await expect(screenText().join(' ')).toMatch(/bright as a new anna/);
    await press('Plates');
    await expect(screenText()).toContain('Plate 1: the man-eater, close');
    await press('Testimony');
    await expect(screenText()).toContain('The Raja on his brother');
    await key('Tab');
    await expect(ui.getState().casebook).toBe(false);
  },
};

export const CasebookEmpty: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true }), ui: { casebook: true, tab: 'photograph' } })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText().join(' ')).toMatch(/No plates exposed/);
  },
};

export const CasebookPockets: Story = {
  render: () => stage(() => ({ run: full(), ui: { casebook: true, tab: 'pockets' } })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await press('A hairpin');
    await expect(screenText().join(' ')).toMatch(/blue butterfly/);
    await press('Hold it');
    await expect(ui.getState().held).toBe('hairpin');
    await expect(screenText().join(' ')).toMatch(/In hand: A hairpin/);
  },
};

export const CasebookTheCaseNotYet: Story = {
  render: () => stage(() => ({ run: full(), ui: { casebook: true, tab: 'deduction' } })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText().join(' ')).toMatch(/I don't know enough yet/);
    await expect(screenText()).not.toContain('Lay it down');
  },
};

export const Dials: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, open: ['guest-door'], at: [18, -4] }), ui: { dials: { spot: 'storeroom-dials', faces: ['gaur', 'gaur', 'gaur', 'gaur'] } } })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText()).toContain('THE STOREROOM DOOR');
    await press('Step back');
    await expect(ui.getState().dials).toBeNull();
  },
};

export const RevealCard: Story = {
  render: () => stage(() => ({ run: { ...night1({ quiet: true, flags: ['staged-tiger'] }), phase: 'reveal' }, ui: { card: { kind: 'reveal', title: 'The man-eater of Chandragarh', sub: 'There was no man-eater.', text: 'Who pulled two claws?' } } })),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(screenText()).toContain('The man-eater of Chandragarh');
    await key(' ');
    await expect(run().talk!.scene).toBe('dawn-1');
  },
};
