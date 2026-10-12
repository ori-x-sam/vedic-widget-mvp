// Night 1, The Bolted Door: its chart, every room, every puzzle in each of its states, the watchman, and the whole
// night solved through real input. Each story sets core state directly, then its play walks, turns, touches,
// photographs and clicks like a player and asserts on the state.
import type { Meta, StoryObj } from '@storybook/html-vite';
import type { Container } from 'pixi.js';
import { expect } from 'storybook/test';
import night1Kdl from '../../content/night1.kdl?raw';
import { get } from '../content';
import * as Game from '../game';
import { layers, view } from '../stage';
import { T } from '../tuning';
import { advance, descendants, game, goTo, key, night1, press, readOn, ready, run, screenText, settle, stage, storyArgs, storyControls, tap, ui, walkTo, type StoryArgs } from './stage';

export default {
  title: 'Night 1 — The Bolted Door',
  args: storyArgs,
  ...storyControls,
} satisfies Meta<StoryArgs>;
type Story = StoryObj<StoryArgs>;

const room = (id: string) => get('room', id);

// ---------- the chart ----------

/** The night's dependency chart, as it heads content/night1.kdl. */
export const Chart: Story = {
  render: () => {
    const pre = document.createElement('pre');
    const lines = night1Kdl.split('\n'), end = lines.findIndex((l) => l.startsWith('// Words'));
    pre.textContent = lines.slice(0, end).map((l) => l.replace(/^\/\/ ?/, '')).join('\n');
    Object.assign(pre.style, { color: '#e9dfc4', background: '#07090f', padding: '16px', margin: '0', font: '13px/1.45 ui-monospace, monospace', minHeight: '100vh' });
    return pre;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toMatch(/GUEST ROOM, bolted from outside/);
    await expect(canvasElement.textContent).toMatch(/CASEBOOK: the deduction/);
  },
};

// ---------- the rooms ----------

export const GuestRoom: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true }), yaw: 0, pitch: -4 }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await expect(Game.roomAt(1, run().night!.x, run().night!.z)).toBe('guest-room');
    await goTo('bolted-door');
    await expect(screenText()).toContain('E  the door');
  },
};

export const Corridor: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, open: ['guest-door'], at: [0, -3.4], candle: true }), yaw: 90 }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('calendar');
    await key('e');
    await expect(ui.getState().toast?.text).toMatch(/still shows September/);
  },
};

export const TrophyGallery: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, open: ['guest-door'], at: [room('gallery').x - 4.5, room('gallery').z + 0.5] }), yaw: 100 }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('man-eater');
    await expect(screenText()).toContain('E  the man-eater');
  },
};

export const Storeroom: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, open: ['guest-door', 'storeroom-door'], at: [room('storeroom').x - 1, room('storeroom').z], candle: true }), yaw: 90 }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('workbench');
    await key('e');
    await expect(run().clues).toContain('pulled-claws');
  },
};

// ---------- the guest room, step by step ----------

export const DoorBolted: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true }) }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('bolted-door');
    await key('e');
    await expect(ui.getState().toast?.text).toMatch(/Bolted from outside/);
    await expect(run().clues).toContain('bolted-in');
  },
};

export const PunkahGivesHairpin: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true }) }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('punkah-rope', 0.9);
    await key('e');
    await expect(run().items).toContain('hairpin');
    await key('e');
    await expect(ui.getState().toast?.text).toMatch(/no cooler/);
  },
};

export const TrunkGivesTripodLeg: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true }) }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('trunk');
    await key('e');
    await expect(run().items).toContain('tripod-leg');
  },
};

export const TrunkWalkedToTheDoor: Story = {
  render: () => stage(() => ({ run: { ...night1({ quiet: true, items: ['tripod-leg'] }), fired: ['trunk#1'] } }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('trunk');
    await key('e');
    await expect(run().flags).toContain('trunk-at-door');
    settle();
    await expect(Game.spotPose(run(), get('spot', 'trunk')).at).toEqual([0.85, -2.05]);
  },
};

export const HookMadeInThePockets: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, items: ['hairpin', 'tripod-leg'] }) }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await key('Tab');
    await press('Pockets');
    await press('A hairpin');
    await press('Put together with');
    await press('A tripod leg');
    await press('Put together with A hairpin');
    await expect(run().items).toContain('bolt-hook');
    await expect(run().items).not.toContain('hairpin');
  },
};

export const HookTooShortWithoutTheTrunk: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, items: ['bolt-hook'] }), ui: { held: 'bolt-hook' } }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('bolted-door');
    await key('e');
    await expect(ui.getState().toast?.text).toMatch(/Something to stand on/);
    await expect(run().night!.doors).not.toContain('guest-door');
  },
};

export const DoorLifted: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, items: ['bolt-hook'], flags: ['trunk-at-door'] }), ui: { held: 'bolt-hook' } }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('bolted-door');
    await key('e');
    await expect(run().night!.doors).toContain('guest-door');
    await walkTo(0, -3.4);
    await expect(Game.roomAt(1, run().night!.x, run().night!.z)).toBe('corridor');
  },
};

export const BoltedTwice: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, items: ['bolt-hook'], flags: ['trunk-at-door', 'bolted-twice'] }), ui: { held: 'bolt-hook' } }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('bolted-door');
    await key('e');
    await expect(run().flags).toContain('first-bolt-up');
    await expect(run().night!.doors).not.toContain('guest-door');
    await key('e');
    await expect(run().night!.doors).toContain('guest-door');
  },
};

// ---------- the gallery ----------

const inGallery = (extra: Parameters<typeof night1>[0] = {}) => night1({ quiet: true, open: ['guest-door'], at: [room('gallery').x - 4.5, room('gallery').z], ...extra });

export const DialsWrongOrder: Story = {
  render: () => stage(() => ({ run: inGallery(), yaw: 90 }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('storeroom-dials');
    await key('e');
    await expect(ui.getState().dials?.spot).toBe('storeroom-dials');
    const before = run().night!.clockS;
    await press('Try the handle');
    await expect(run().night!.doors).not.toContain('storeroom-door');
    await expect(run().night!.clockS).toBeGreaterThan(before);
  },
};

export const DialsInTheOrderOfTheirFalling: Story = {
  render: () => stage(() => ({ run: inGallery(), yaw: 90 }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    // Read the four plaques first, as a player would.
    for (const t of ['trophy-leopard', 'trophy-boar', 'trophy-gaur', 'trophy-bear']) { await goTo(t, 1.3); await key('e'); }
    await goTo('storeroom-dials');
    await key('e');
    // gaur bear leopard boar: dial 1 stays on gaur; dial 2 up once (bear); dial 3 up twice (leopard); dial 4 down once (boar).
    const ups = descendantsOf('▲'), downs = descendantsOf('▼');
    await tapNode(ups[1]!); await tapNode(ups[2]!); await tapNode(ups[2]!); await tapNode(downs[3]!);
    await expect(ui.getState().dials?.faces).toEqual(['gaur', 'bear', 'leopard', 'boar']);
    await press('Try the handle');
    await expect(run().night!.doors).toContain('storeroom-door');
    await expect(ui.getState().dials).toBeNull();
  },
};

export const ManEaterPhotographed: Story = {
  render: () => stage(() => ({ run: inGallery() }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('man-eater', 1.6);
    await key('e');
    await expect(run().clues).toContain('the-man-eater');
    await expect(run().clues).not.toContain('photo-man-eater');
    await key('f');
    await expect(run().clues).toContain('photo-man-eater');
  },
};

export const ShikarPhotographCutOut: Story = {
  render: () => stage(() => ({ run: inGallery() }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('shikar-photos');
    await key('e');
    await expect(run().clues).toContain('cut-photograph');
  },
};

// ---------- the casebook's deduction and the bed ----------

const proven = ['sudam-vanished', 'photo-man-eater', 'taxidermy-book', 'new-plaque', 'pulled-claws', 'the-man-eater'];

export const DeductionWrongThenRight: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, clues: proven }) }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await key('Tab');
    await press('The case');
    await press('on the 16th of September');
    await press('after Sudam vanished');
    await press('claws pulled from a mounted paw');
    await expect(ui.getState().answers).toEqual(['on the 16th of September, as its plaque says', 'after Sudam vanished, for show', 'claws pulled from a mounted paw']);
    const before = run().night!.clockS;
    await press('Lay it down');
    await expect(run().flags).not.toContain('staged-tiger');
    await expect(run().night!.clockS - before).toBeCloseTo(T.WRONG_DEDUCTION_MIN * T.NIGHT_S / (T.DAWN_MIN - T.NIGHT_START_MIN), 1);
    await press('in 1929');
    await press('Lay it down');
    await expect(run().flags).toContain('staged-tiger');
  },
};

export const BedEndsTheNight: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true, clues: proven, flags: ['staged-tiger'] }) }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('guest-bed');
    await key('e');
    await expect(run().phase).toBe('reveal');
    await expect(screenText()).toContain('The man-eater of Chandragarh');
    await key(' ');
    await expect(run().talk?.scene).toBe('morning-2');
  },
};

export const BedRefusesTooSoon: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true }) }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('guest-bed');
    await key('e');
    await expect(run().phase).toBe('night');
    await expect(ui.getState().toast?.text).toMatch(/Not yet/);
  },
};

// ---------- the watchman, the knock, the hints ----------

/** Bhima standing at the corridor's east end, looking west, and Thistlewood out of his room with the candle lit. */
const bhimaWaiting = (candle: boolean) => () => {
  const s = night1({ open: ['guest-door'], at: [0, -3.6], candle });
  const w = { ...s.night!.watch[0]!, x: room('corridor').x + 5, z: room('corridor').z, face: -Math.PI / 2, wait: 999, leg: 1 };
  return { run: { ...s, night: { ...s.night!, watch: [w] } }, yaw: 90 };
};

export const SeenByCandlelight: Story = {
  render: () => stage(bhimaWaiting(true), 0),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    advance(100);
    await expect(run().night!.watch[0]!.mode).not.toBe('patrol');
    await expect(ui.getState().alarm).toBe(true);
  },
};

export const DarkIsSafer: Story = {
  render: () => stage(bhimaWaiting(false), 0),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    advance(500);
    await expect(run().night!.watch[0]!.mode).toBe('patrol');
  },
};

export const CaughtThenWalkedBack: Story = {
  render: () => stage(bhimaWaiting(true), 0),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await walkTo(room('corridor').x + 3.5, room('corridor').z);
    for (let i = 0; i < 40 && !run().talk; i++) advance(250);
    await expect(run().talk?.scene).toBe('caught-1');
    await readOn();
    await press('1.');
    await readOn();
    await expect(Game.roomAt(1, run().night!.x, run().night!.z)).toBe('guest-room');
    await expect(run().night!.doors).not.toContain('guest-door');
  },
};

export const HiddenBehindTheCurtain: Story = {
  render: () => stage(() => {
    const s = night1({ open: ['guest-door'], at: [room('corridor').x - 3, room('corridor').z - 0.3] });
    const w = { ...s.night!.watch[0]!, x: room('corridor').x + 5.5, z: room('corridor').z, face: -Math.PI / 2, wait: 0, leg: 5 };
    return { run: { ...s, night: { ...s.night!, watch: [w] } }, yaw: 0 };
  }, 0),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('corridor-alcove', 0.9);
    await key('e');
    await expect(run().night!.hidden).toBe('corridor-alcove');
    for (let i = 0; i < 30; i++) advance(500);
    await expect(run().night!.watch[0]!.mode).toBe('patrol');
    await expect(run().talk).toBeNull();
  },
};

export const DawnKnocks: Story = {
  render: () => stage(() => { const s = night1({ quiet: true }); return { run: { ...s, night: { ...s.night!, clockS: T.NIGHT_S - 1 } } }; }, 0),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    const before = run().marks.suspicion;
    advance(1500);
    await expect(run().night!.knocks).toBe(1);
    await expect(run().marks.suspicion).toBe(before + T.KNOCK_SUSPICION);
    await expect(screenText()).toContain('5:30 a.m.');
  },
};

export const StuckThenAThought: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true }) }), 0),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    advance(get('hint', 'n1-door-1')['after-s'] * 1000 + 500);
    await expect(run().thoughts[0]).toBe(get('hint', 'n1-door-1').text);
    await expect(ui.getState().toast?.thought).toBe(true);
  },
};

// ---------- the whole night ----------

/** The whole night, from the bolt to the reveal, by walking, turning, touching, photographing and clicking. */
export const SolvedEndToEnd: Story = {
  render: () => stage(() => ({ run: night1({ quiet: true }) }), 300),
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    await ready();
    await goTo('punkah-rope', 0.9); await key('e');
    await goTo('trunk'); await key('e'); await key('e');
    await key('Tab'); await press('Pockets'); await press('A hairpin'); await press('Put together with'); await press('A tripod leg'); await press('Put together with A hairpin');
    await press('A bolt hook'); await press('Hold it');
    await goTo('bolted-door'); await key('e');
    await expect(run().night!.doors).toContain('guest-door');
    await key('r');
    for (const t of ['trophy-leopard', 'trophy-boar', 'trophy-gaur', 'trophy-bear']) { await goTo(t, 1.3); await key('e'); }
    await goTo('man-eater', 1.6); await key('f');
    await goTo('man-eater-plaque', 0.8); await key('e');
    await goTo('storeroom-dials'); await key('e');
    const ups = descendantsOf('▲'), downs = descendantsOf('▼');
    await tapNode(ups[1]!); await tapNode(ups[2]!); await tapNode(ups[2]!); await tapNode(downs[3]!);
    await press('Try the handle');
    await key('q');
    await goTo('workbench'); await key('e');
    await goTo('taxidermy-register'); await key('e');
    await key('Tab'); await press('The case');
    await press('in 1929'); await press('after Sudam vanished'); await press('claws pulled from a mounted paw');
    await press('Lay it down');
    await expect(run().flags).toContain('staged-tiger');
    await key('Escape');
    await goTo('guest-bed'); await key('e');
    await expect(run().phase).toBe('reveal');
    await expect(game.getState().run.clues.length).toBeGreaterThanOrEqual(6);
  },
};

// ---------- small helpers for the dials ----------

function descendantsOf(text: string): Container[] {
  return descendants(layers.ui).filter((n) => (n as Container & { text?: string }).text === text && n.visible).map((n) => { let p: Container | null = n; while (p && p.eventMode !== 'static') p = p.parent; return p!; });
}
async function tapNode(n: Container) { const b = n.getBounds(); await tap((b.x + b.width / 2) / view.scale, (b.y + b.height / 2) / view.scale); }
