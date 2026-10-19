// The prefab gallery's one Ui: stories hand it a list of shared-prefab Uses and it shows them on the maroon page, with
// the game's screens hidden (ui.screen 'gallery'). Story-only; the game never imports this.
import { use, type Use } from '../decl/engine';
import { screenUi } from '../screens/shared';
import { ui } from '../store';
import galleryKdl from './gallery.kdl?raw';
import galleryCss from './gallery.css?raw';

const galleryUi = screenUi(galleryKdl, galleryCss);
// Any other screen hides the gallery, so a game screen's story never shows a previous gallery behind it.
ui.subscribe((s) => { if (s.screen !== 'gallery') galleryUi.show(null); });

export const label = (text: string) => use('gallery-label', { key: `label-${text}`, text });
export const row = (key: string, items: Use[]) => use('gallery-row', { key }, { items });
export const lane = (n: number, board: Use, revealed: boolean) => use('gallery-lane', { key: `lane-${n}`, state: revealed ? 'revealed' : '' }, { board: [board] });
export const rule = (key: string) => use('gallery-rule', { key });
export const box = (anim: string) => use('gallery-box', { key: anim, anim, text: anim.toUpperCase() });

/** Show these on the gallery page (null clears it). */
export function showGallery(items: Use[] | null) {
  galleryUi.show(items && use('gallery', {}, { items }));
}
