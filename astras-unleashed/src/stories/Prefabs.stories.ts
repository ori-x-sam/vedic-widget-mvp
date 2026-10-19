// The shared prefabs, seen on the real canvas: one story each, set up from real content, plus every keyframe on a box
// and a rough match layout to check the Kalinga Rush composition. Each play asserts what is shown.
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import type { Use } from '../decl/engine';
import { bannerScore, card, emote, kathaPage, longDie, pranaDiyas, reportCard, signboard, titleCard } from '../screens/shared';
import { box, label, lane, row, rule, showGallery } from './gallery';
import { ready, screenText, stage, storyArgs, storyControls, type StoryArgs } from './stage';

export default {
  title: 'Foundation/Prefabs',
  args: storyArgs,
  ...storyControls,
} satisfies Meta<StoryArgs>;
type Story = StoryObj<StoryArgs>;

/** A gallery story: these Uses on the maroon page, the game's screens hidden. */
const gallery = (items: () => Use[], warmMs = 1500) => stage(() => { showGallery(items()); return { ui: { screen: 'gallery' } }; }, warmMs);
const shows = async (...texts: string[]) => { await ready(); for (const t of texts) await expect(screenText()).toContain(t); };

export const TitleCard: Story = {
  render: () => gallery(() => [titleCard('ASTRAS UNLEASHED · LEELA 3 · vs GARGI', 'TRETA YUGA · 1:42 · PRANA ×1.5', 'Hanuman leaps the ocean.', { score: [bannerScore(1, 0)], die: [longDie(3, () => {})] })]),
  play: async ({ args }) => { if (args.runInteraction) await shows('ASTRAS UNLEASHED · LEELA 3 · vs GARGI', 'TRETA YUGA · 1:42 · PRANA ×1.5', 'Hanuman leaps the ocean.'); },
};

export const Signboards: Story = {
  render: () => gallery(() => [label('REVEALED'), row('a', [signboard(1, 'kishkindha'), signboard(2, 'samudra-manthan')]), label('VEILED UNTIL ITS YUGA'), row('b', [signboard(3, null)])]),
  play: async ({ args }) => { if (args.runInteraction) await shows('KSHETRA I', 'KISHKINDHA', 'Units here move 25% faster', 'KSHETRA III · ?'); },
};

export const Cards: Story = {
  render: () => gallery(() => [
    label('IN THE HAND · 72 × 101, AND THE NEXT CARD'), row('hand', [...['agni', 'kartikeya', 'ganesha', 'hanuman'].map((id) => card(id, 'hand')), card('vishnu', 'next')]),
    label('FACE · RAKSHAK, TRIMURTI, ASTRA (DISCOUNTED BY AMARAVATI)'), row('face', [card('hanuman', 'face'), card('shiva', 'face')]),
    row('face2', [card('indra', 'face', 4), card('saraswati', 'face')]),
  ]),
  play: async ({ args }) => { if (args.runInteraction) await shows('Hanuman', 'हनुमान', 'SANKAT MOCHAN · REMOVER OF DISTRESS', 'Shiva', '4'); },
};

export const CardDetail: Story = {
  render: () => gallery(() => [label('LONG-PRESS DETAIL'), row('d', [card('shiva', 'detail')])]),
  play: async ({ args }) => { if (args.runInteraction) await shows('AVAHANA', 'sits still 3 s, taking 50% less damage, then: 420 damage to every enemy god in the lane, never a banner'); },
};

export const PranaDiyas: Story = {
  render: () => gallery(() => [label('6.4 OF 10: THE SEVENTH FLAME IS CHARGING'), pranaDiyas(6.4, 10), label('EMPTY'), pranaDiyas(0, 10), label('FULL'), pranaDiyas(10, 10)]),
  play: async ({ args }) => { if (args.runInteraction) await shows('6 / 10', '0 / 10', '10 / 10'); },
};

export const BannerScore: Story = {
  render: () => gallery(() => [label('THE SUN HAS LOST ONE BANNER · THE MOON TWO'), row('s', [bannerScore(1, 2)])]),
  play: async ({ args }) => { if (args.runInteraction) await shows('THE SUN HAS LOST ONE BANNER · THE MOON TWO'); },
};

export const LongDie: Story = {
  render: () => gallery(() => [label('SATYA 4 · TRETA 3 · DVAPARA 2 · KALI 1'), row('d', [4, 3, 2, 1].map((f) => longDie(f, () => {})))]),
  play: async ({ args }) => { if (args.runInteraction) await shows('SATYA 4 · TRETA 3 · DVAPARA 2 · KALI 1'); },
};

export const KathaPage: Story = {
  render: () => gallery(() => [row('k', [kathaPage('kartikeya', true)])]),
  play: async ({ args }) => { if (args.runInteraction) await shows('KATHA 05', 'Kartikeya', 'कार्तिकेय · Murugan · முருகன்', 'TRADITION', 'Did you know?', '५'); },
};

export const ReportCard: Story = {
  render: () => gallery(() => [row('r', [reportCard({
    kicker: 'ASTRAS UNLEASHED · LEELA 3',
    rows: [['NAME', 'Player'], ['OPPONENT', 'Gargi'], ['KSHETRAS', 'Kishkindha · Meru · Patala'], ['BANNERS', '2 lowered · 1 lost'], ['PRANA SPENT', '104'], ['PRANA WASTED', '6'], ['MVP', 'Hanuman'], ['TIME', '3:20'], ['GRADE', 'A']],
    remark: 'Sādhu! Watch your Prana in Kali Yuga.', stamp: 'vijaya', assisted: true,
  })])]),
  play: async ({ args }) => { if (args.runInteraction) await shows('Leela Report', 'VIJAYA', 'विजय', 'PRANA WASTED', 'ASSISTED'); },
};

export const Emotes: Story = {
  render: () => gallery(() => [label('THE FOUR BLESSINGS · THERE ARE NO OTHERS'), row('e', ['namaskar', 'sadhu', 'shubham', 'lotus'].map(emote))]),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await shows('🙏 Namaskar', 'Sādhu!', 'Shubham', '🪷');
    await expect(() => emote('taunt')).toThrow(/no blessing "taunt"/);
  },
};

export const Keyframes: Story = {
  render: () => gallery(() => [label('EVERY SHARED KEYFRAME, LOOPED'), row('k1', [box('title-card-in'), box('yuga-turn'), box('kshetra-unfurl'), box('misregister')]), row('k2', [box('avahana-descend'), box('visarjana-lotus'), box('banner-lower'), box('gulal-puff')])], 0),
  play: async ({ args }) => { if (args.runInteraction) await shows('TITLE-CARD-IN', 'VISARJANA-LOTUS', 'GULAL-PUFF'); },
};

/** The match screen's composition, roughly: header, three lanes (one revealed) with their boards, diyas, the hand. */
export const Layout: Story = {
  render: () => gallery(() => [
    titleCard('ASTRAS UNLEASHED · LEELA 3 · vs GARGI', 'TRETA YUGA · 1:42 · PRANA ×1.5', 'Hanuman leaps the ocean.', { score: [bannerScore(0, 1)], die: [longDie(3, () => {})] }),
    rule('top'),
    lane(1, signboard(1, 'kishkindha'), true), rule('r1'), lane(2, signboard(2, 'meru'), true), rule('r2'), lane(3, signboard(3, null), false),
    rule('bottom'),
    pranaDiyas(6.4, 10),
    row('hand', [...['hanuman', 'agni', 'vayu', 'ganesha'].map((id) => card(id, 'hand')), card('rama', 'next')]),
  ]),
  play: async ({ args }) => { if (args.runInteraction) await shows('Hanuman leaps the ocean.', 'KISHKINDHA', 'MERU', 'KSHETRA III · ?', '6 / 10'); },
};
