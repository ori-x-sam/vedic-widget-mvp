// The shared prefabs and the arena, seen on the real canvas: one story each, set up from real content, plus the match
// layout (HUD over the arena over the hand) that puts them together. Each play asserts what is shown.
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import type { Use } from '../decl/engine';
import { bannerScore, card, emote, hud, kathaPage, kshetraToast, longDie, pranaBar, reportCard } from '../screens/shared';
import { layers } from '../stage';
import { box, label, row, showArena, showGallery, spacer, tray, type Walker } from './gallery';
import { descendants, ready, screenText, stage, storyArgs, storyControls, tap, type StoryArgs } from './stage';

export default {
  title: 'Foundation/Prefabs',
  args: storyArgs,
  ...storyControls,
} satisfies Meta<StoryArgs>;
type Story = StoryObj<StoryArgs>;

/** A gallery story: these Uses on the HUD-blue page, the game's screens hidden, no arena. */
const gallery = (items: () => Use[], warmMs = 1500) => stage(() => { showArena(null); showGallery(items()); return { ui: { screen: 'gallery' } }; }, warmMs);
const shows = async (...texts: string[]) => { await ready(); for (const t of texts) await expect(screenText()).toContain(t); };

/** The match screen's arena window, below the 56 px HUD and above the 150 px tray, on a 390 x 844 phone. */
const ARENA_BOX = { x: 0, y: 56, w: 390, h: 844 - 56 - 150 };
/** A few gods of each side, mid-match: walking, striking at the bridge, descending, returning to light. */
const WALKERS: Walker[] = [
  { id: 1, god: 'hanuman', side: 'sun', lane: 0, act: 'walk', from: 4, to: 9 },
  { id: 2, god: 'rama', side: 'sun', lane: 0, act: 'walk', from: 2.5, to: 7, speed: 0.9 },
  { id: 3, god: 'kartikeya', side: 'moon', lane: 0, act: 'walk', from: 16, to: 11.5, speed: 1.6 },
  { id: 4, god: 'durga', side: 'sun', lane: 1, act: 'strike', from: 9 },
  { id: 5, god: 'ganesha', side: 'moon', lane: 1, act: 'strike', from: 11 },
  { id: 6, god: 'saraswati', side: 'sun', lane: 1, act: 'idle', from: 5 },
  { id: 7, god: 'shiva', side: 'moon', lane: 2, act: 'avahana', from: 14.5, loopS: 2 },
  { id: 8, god: 'agni', side: 'sun', lane: 2, act: 'walk', from: 3.5, to: 9, speed: 1.1 },
  { id: 9, god: 'kali', side: 'moon', lane: 2, act: 'visarjana', from: 9.5, loopS: 2.4 },
  { id: 10, god: 'vishnu', side: 'moon', lane: 0, act: 'idle', from: 18.2 },
];
const HAND = ['hanuman', 'agni', 'vayu', 'ganesha'];

/** The whole match screen: HUD, arena (lanes as given), hand and Prana bar; a tapped chip shows its Kshetra's toast. */
function match(lanes: (string | null)[], yuga: string, time: string, grade?: string, sky?: string) {
  return stage(() => {
    const items = (toast: Use[] = []): Use[] => [
      hud(time, yuga, { score: [bannerScore(0, 1)], die: [longDie(3, () => {})] }),
      ...toast,
      spacer('arena', 'arena'),
      tray([row('hand', [...HAND.map((id) => card(id, 'hand')), card('rama', 'next')]), pranaBar(6.4, 10)]),
    ];
    showArena({ box: ARENA_BOX, lanes, walkers: WALKERS, grade, sky }, (lane) => { const k = lanes[lane]; if (k) showGallery(items([row('toast', [kshetraToast(lane + 1, k)])])); });
    showGallery(items());
    return { ui: { screen: 'gallery' } };
  }, 1500);
}

export const Match: Story = {
  render: () => match(['kishkindha', 'samudra-manthan', null], 'TRETA YUGA · ×1.5', '1:42'),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await shows('1:42', 'TRETA YUGA · ×1.5', 'Hanuman', '6');
    const chip = descendants(layers.arena).find((n) => n.label === 'kshetra-chip-1')!;
    await expect(chip).toBeDefined();
    const b = chip.getBounds();
    await tap(b.x + b.width / 2, b.y + b.height / 2);
    await expect(screenText()).toContain('Kishkindha');
    await expect(screenText()).toContain('Units here move 25% faster');
  },
};

export const MatchKaliYuga: Story = {
  render: () => match(['kailash', 'amaravati', 'patala'], 'KALI YUGA · ×3', '0:14', '--yuga-kali', '--yuga-kali-sky'),
  play: async ({ args }) => { if (args.runInteraction) await shows('0:14', 'KALI YUGA · ×3'); },
};

/** All twelve Kshetras, three to an arena. */
const KSHETRA_SETS = [['kailash', 'ksheer-sagar', 'kurukshetra'], ['swarna-lanka', 'kishkindha', 'dandakaranya'], ['samudra-manthan', 'amaravati', 'meru'], ['patala', 'satyaloka', 'himavat']];
const kshetraStory = (i: number): Story => ({
  render: () => stage(() => { showGallery([label(KSHETRA_SETS[i]!.join(' · ').toUpperCase())]); showArena({ box: { x: 0, y: 30, w: 390, h: 814 }, lanes: KSHETRA_SETS[i]!, walkers: WALKERS.slice(0, 6) }); return { ui: { screen: 'gallery' } }; }, 500),
  play: async ({ args }) => { if (args.runInteraction) await shows(KSHETRA_SETS[i]!.join(' · ').toUpperCase()); },
});
export const Kshetras1 = kshetraStory(0);
export const Kshetras2 = kshetraStory(1);
export const Kshetras3 = kshetraStory(2);
export const Kshetras4 = kshetraStory(3);

export const Hud: Story = {
  render: () => gallery(() => [hud('1:42', 'TRETA YUGA · ×1.5', { score: [bannerScore(1, 2)], die: [longDie(3, () => {})] }), label('THE SUN HAS LOST ONE BANNER · THE MOON TWO')]),
  play: async ({ args }) => { if (args.runInteraction) await shows('1:42', 'TRETA YUGA · ×1.5'); },
};

export const KshetraToast: Story = {
  render: () => gallery(() => [label('A LANE IS REVEALED'), row('t', [kshetraToast(2, 'kishkindha')])]),
  play: async ({ args }) => { if (args.runInteraction) await shows('LANE II · KSHETRA REVEALED', 'Kishkindha', 'Units here move 25% faster'); },
};

export const Cards: Story = {
  render: () => gallery(() => [
    label('THE HAND · 72 × 101, AND THE NEXT CARD'), row('hand', [...['agni', 'kartikeya', 'ganesha', 'hanuman'].map((id) => card(id, 'hand')), card('vishnu', 'next')]),
    label('FACE · SAHAYAK, TRIMURTI (GOLD LEAF)'), row('face', [card('krishna', 'face'), card('shiva', 'face')]),
    label('ASTRA DISCOUNTED BY AMARAVATI · DHANURDHARA'), row('face2', [card('indra', 'face', 4), card('surya', 'face')]),
  ]),
  play: async ({ args }) => { if (args.runInteraction) await shows('Krishna', 'कृष्ण', 'Shiva', '4'); },
};

/** Every god's card, so no two look alike even before the painted art arrives. */
export const AllCards: Story = {
  render: () => gallery(() => [label('ALL TWENTY · PLACEHOLDER ART UNTIL public/art/cards/<id>.png EXISTS'),
    ...[0, 1, 2, 3].map((r) => row(`r${r}`, ['ganesha', 'hanuman', 'narasimha', 'vishnu', 'kartikeya', 'kali', 'durga', 'shiva', 'agni', 'yama', 'surya', 'rama', 'vayu', 'ganga', 'parvati', 'indra', 'saraswati', 'lakshmi', 'krishna', 'brahma'].slice(r * 5, r * 5 + 5).map((id) => card(id, 'hand'))))], 500),
  play: async ({ args }) => { if (args.runInteraction) await shows('Ganesha', 'Brahma', 'Saraswati'); },
};

export const CardDetail: Story = {
  render: () => gallery(() => [label('LONG-PRESS DETAIL'), row('d', [card('shiva', 'detail')])]),
  play: async ({ args }) => { if (args.runInteraction) await shows('AVAHANA', 'MAHADEVA · THE GREAT GOD', 'sits still 3 s, taking 50% less damage, then: 420 damage to every enemy god in the lane, never a banner'); },
};

export const PranaBar: Story = {
  render: () => gallery(() => [label('6.4 OF 10: THE SEVENTH SEGMENT IS CHARGING'), pranaBar(6.4, 10), label('EMPTY'), pranaBar(0, 10), label('FULL'), pranaBar(10, 10)]),
  play: async ({ args }) => { if (args.runInteraction) await shows('6', '0', '10'); },
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
  render: () => gallery(() => [label('EVERY SHARED KEYFRAME, LOOPED'), row('k1', [box('toast-in'), box('kshetra-reveal'), box('yuga-turn'), box('misregister')]), row('k2', [box('banner-lower'), box('card-play'), box('prana-glow')])], 0),
  play: async ({ args }) => { if (args.runInteraction) await shows('TOAST-IN', 'CARD-PLAY', 'PRANA-GLOW'); },
};
