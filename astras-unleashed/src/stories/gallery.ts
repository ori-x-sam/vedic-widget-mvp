// The prefab gallery and the arena stage: stories hand them shared-prefab Uses and an arena state, and they show them
// with the game's screens hidden (ui.screen 'gallery'). Demo gods walk, strike, descend and return on the held game
// clock, so every story is the same run every time. Story-only; the game never imports this.
import { onTick } from '../clock';
import { use, type Use } from '../decl/engine';
import { screenUi } from '../screens/shared';
import { layers } from '../stage';
import { ui } from '../store';
import { createArena, type Arena, type ArenaState, type ArenaUnit, type Box } from '../view/arena';
import galleryKdl from './gallery.kdl?raw';
import galleryCss from './gallery.css?raw';

const galleryUi = screenUi(galleryKdl, galleryCss);
let arena: Arena | null = null;
let demo: { state: ArenaState; walkers: Walker[] } | null = null;
let chipTap: (lane: number) => void = () => {};
// Any other screen hides the gallery and the arena, so a game screen's story never shows a previous one behind it.
ui.subscribe((s) => { if (s.screen !== 'gallery') { galleryUi.show(null); showArena(null); } });

export const label = (text: string) => use('gallery-label', { key: `label-${text}`, text });
export const row = (key: string, items: Use[]) => use('gallery-row', { key }, { items });
export const spacer = (key: string, h: 'hud' | 'arena') => use('gallery-spacer', { key, size: h });
export const tray = (items: Use[]) => use('gallery-tray', {}, { items });
export const box = (anim: string) => use('gallery-box', { key: anim, anim, text: anim.toUpperCase() });

/** Show these on the gallery page (null clears it). */
export function showGallery(items: Use[] | null) {
  galleryUi.show(items && use('gallery', {}, { items }));
}

/** A demo god: walks its lane from `from` to `to` tiles and loops; acts in place when `act` isn't walk. */
export type Walker = Omit<ArenaUnit, 'tile' | 'actT'> & { from: number; to?: number; speed?: number; loopS?: number };

/** Show an arena in `box` with these lanes and demo gods (null clears it). `onChip` hears a Kshetra chip tapped. */
export function showArena(s: { box: Box; lanes: (string | null)[]; walkers: Walker[]; grade?: string; sky?: string } | null, onChip: (lane: number) => void = () => {}) {
  chipTap = onChip;
  if (!s) { if (arena) { layers.arena.removeChild(arena.root); arena.root.destroy({ children: true }); arena = null; } demo = null; return; }
  if (!arena) { arena = createArena((lane) => chipTap(lane)); layers.arena.addChild(arena.root); }
  arena.setBox(s.box);
  demo = { state: { lanes: s.lanes, units: [], grade: s.grade, sky: s.sky }, walkers: s.walkers };
  step(0);
}

let t = 0;
function step(dt: number) {
  if (!arena || !demo) return false;
  t += dt;
  arena.tick(dt);
  demo.state = { ...demo.state, units: demo.walkers.map((w): ArenaUnit => {
    const loop = w.loopS ?? 6, lt = t % loop;
    if (w.act !== 'walk') return { ...w, tile: w.from, actT: lt };
    const span = (w.to ?? w.from) - w.from, k = Math.abs(span) > 0 ? ((lt * (w.speed ?? 1.1)) % Math.abs(span)) * Math.sign(span) : 0;
    return { ...w, tile: w.from + k, actT: lt };
  }) };
  arena.sync(demo.state);
  return false; // idle motion: never holds settle()
}
onTick(step);
