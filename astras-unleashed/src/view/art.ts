// Painted art, when it exists. You drop files into public/art/ and the game picks them up; until a file exists, the
// procedural placeholder draws instead. The convention (ASSETS.md has the prompt for each):
//   public/art/cards/<card id>.png     a god's card art, 5:7, the god breaking over the top edge
//   public/art/units/<card id>.png     a god's full-body arena figure, transparent, facing the camera, feet at the bottom
// preloadArt() runs once at boot (and in the story harness); art() answers synchronously from what loaded.
import { Assets, type Texture } from 'pixi.js';
import { CARD_IDS, TOKENS_ON_FIELD } from '../content';

export type ArtKind = 'cards' | 'units';
const loaded = new Map<string, Texture>();
const path = (kind: ArtKind, id: string) => `art/${kind}/${id}.png`;

/** The loaded texture for a god's art, or undefined (draw the placeholder). */
export const art = (kind: ArtKind, id: string): Texture | undefined => loaded.get(path(kind, id));

/** Try every god's card and unit art once; a missing file is simply absent. Resolves when all attempts settle. */
export async function preloadArt() {
  const ids = [...CARD_IDS, ...Object.keys(TOKENS_ON_FIELD)];
  const tries = ids.flatMap((id) => (['cards', 'units'] as const).map(async (kind) => {
    const p = path(kind, id);
    try {
      const head = await fetch(p, { method: 'HEAD' });
      if (!head.ok || !(head.headers.get('content-type') ?? '').startsWith('image/')) return; // the dev server answers index.html for a missing file
      loaded.set(p, await Assets.load<Texture>(p));
    } catch { /* offline or missing: the placeholder draws */ }
  }));
  await Promise.all(tries);
}
