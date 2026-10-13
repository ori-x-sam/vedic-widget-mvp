// The music and the fright, rendered offline and measured: the bed is tones (not noise), in tune with its tanpura,
// and quiet; the snap of a sitar string when Bhima sees you is far louder than the music it breaks into.
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import * as Audio from '../audio';
import { storyArgs, storyControls, type StoryArgs } from './stage';

export default { title: 'Sounds', args: storyArgs, ...storyControls } satisfies Meta<StoryArgs>;
type Story = StoryObj<StoryArgs>;

const peak = (b: AudioBuffer) => b.getChannelData(0).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
/** The fundamental (Hz) of a held note, by autocorrelation with a parabolic peak. */
function pitch(b: AudioBuffer): number {
  const x = b.getChannelData(0).slice(4410, 4410 + 8192), ac = (l: number) => { let s = 0; for (let i = 0; i + l < x.length; i++) s += x[i]! * x[i + l]!; return s; };
  let bl = 40, best = -Infinity;
  for (let l = 40; l < 800; l++) { const v = ac(l); if (v > best) { best = v; bl = l; } }
  const a0 = ac(bl - 1), a1 = ac(bl), a2 = ac(bl + 1);
  return b.sampleRate / (bl + (0.5 * (a0 - a2)) / (a0 - 2 * a1 + a2));
}
const cents = (got: number, want: number) => 1200 * Math.log2(got / want);

export const TheMusicAndTheFright: Story = {
  render: () => { const p = document.createElement('p'); p.textContent = 'Rendering the tanpura, the sitar and the snap offline…'; return p; },
  play: async ({ args }) => {
    if (!args.runInteraction) return;
    // Every string in tune: the sitar's Sa and Pa, the tanpura's Sa and Pa, within a few cents.
    for (const [id, hz] of [['bed-sitar', 277.2], ['bed-tanpura', 138.6]] as const) for (const k of [1, 1.5]) {
      const b = await Audio.renderOffline(1, () => Audio.play(id, 1, { pitch: k }));
      await expect(Math.abs(cents(pitch(b), hz * k)), `${id} at ${k}`).toBeLessThan(5);
    }
    const music = await Audio.renderOffline(6, () => { for (let i = 0; i < 4; i++) Audio.play('bed-tanpura', 1, { pitch: [1.5, 2, 2, 1][i], at: i * 1.15 }); Audio.play('bed-sitar', 1, { at: 1 }); });
    const fright = await Audio.renderOffline(4, () => Audio.play('who'));
    await expect(peak(music)).toBeGreaterThan(0.03);
    await expect(peak(music)).toBeLessThan(0.3);
    await expect(peak(fright)).toBeGreaterThan(peak(music) * 3);
    await expect(peak(fright)).toBeLessThan(1);
  },
};
