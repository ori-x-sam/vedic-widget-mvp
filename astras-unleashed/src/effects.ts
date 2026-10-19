// Effect words: what happens to a lane when an Astra is cast or a god's trigger fires (`damage 150 width=4`). Each word
// is a pure function from its arguments to a plain Effect; the match's step rule (Phase 3) carries effects out with the
// pure helpers below. Cards list them in content/cards.kdl, alone (an Astra) or inside a trigger (`every 5 { stun 1.2 }`).
//
// Area: `width=` is tiles of lane centred on the cast point (or on the god); `radius=` is tiles around the god. An effect
// with no area of its own reaches what the effect before it in the same block reached when that was the same side
// (Vayu's knockback moves whoever his gust just hit); a buff with no area reaches the god its `with` matched; otherwise
// the whole lane. Enemies: damage, stun, knockback, pull. Allies: heal, haste.
import { word, type Maker } from './content-load';

export type Pick = 'nearest' | 'highest-hp';
export type Area = { widthTiles?: number; radiusTiles?: number };

export type Effect =
  | ({ do: 'damage'; amount: number; targets?: number; pick: Pick; unitsOnly: boolean } & Area)
  | ({ do: 'heal'; perS: number; dhvajaPerS: number; seconds: number } & Area)
  | ({ do: 'stun'; seconds: number } & Area)
  | { do: 'knockback'; tiles: number }
  | { do: 'pull'; tiles: number; rootS: number; rangeTiles: number }
  | ({ do: 'haste'; factor: number; seconds: number } & Area)
  | { do: 'prana'; amount: number }
  | { do: 'create'; token: string }
  | { do: 'discount-next'; amount: number }
  | { do: 'seconds'; seconds: number };

export const EFFECT_WORDS: Record<string, Maker<Effect>> = {
  /** `damage n width= targets= pick="nearest|highest-hp" units-only`: n to each enemy reached; `targets` caps how many (picked by `pick`); `units-only` spares banners. */
  damage: word({ args: ['n'], opts: { width: 'n?', targets: 'n?', pick: ['nearest', 'highest-hp'] }, flags: ['units-only'] },
    ([amount], o) => ({ do: 'damage', amount, widthTiles: o.width, targets: o.targets, pick: o.pick, unitsOnly: o['units-only'] })),
  /** `heal n dhvaja= width= seconds=`: allies in the area regain n HP a second (your banner `dhvaja` a second) for `seconds`. */
  heal: word({ args: ['n'], opts: { dhvaja: 0, width: 'n?', seconds: 'n' } },
    ([perS], o) => ({ do: 'heal', perS, dhvajaPerS: o.dhvaja, widthTiles: o.width, seconds: o.seconds })),
  /** `stun s radius= width=`: enemies reached can't move or strike for s seconds. */
  stun: word({ args: ['n'], opts: { radius: 'n?', width: 'n?' } }, ([seconds], o) => ({ do: 'stun', seconds, radiusTiles: o.radius, widthTiles: o.width })),
  /** `knockback tiles`: enemies reached are pushed back toward their own end. */
  knockback: (tiles) => ({ do: 'knockback', tiles }),
  /** `pull tiles root= range=`: the farthest enemy within `range` is pulled `tiles` closer and held `root` seconds (Yama's noose). */
  pull: word({ args: ['n'], opts: { root: 'n', range: 'n' } }, ([tiles], o) => ({ do: 'pull', tiles, rootS: o.root, rangeTiles: o.range })),
  /** `haste f width= seconds=`: allies reached move and strike f faster (0.35 = 35%) for `seconds`. */
  haste: word({ args: ['n'], opts: { width: 'n?', seconds: 'n' } }, ([factor], o) => ({ do: 'haste', factor, widthTiles: o.width, seconds: o.seconds })),
  /** `prana n`: its player gains n Prana (never above the diya row's maximum). */
  prana: (amount) => ({ do: 'prana', amount }),
  /** `create "token"`: a token (content/cards.kdl `token`, never a card) appears beside the god, on its side. */
  create: word({ args: ['s'] }, ([token]) => ({ do: 'create', token })),
  /** `discount-next n`: its player's next card costs n less. */
  'discount-next': (amount) => ({ do: 'discount-next', amount }),
  /** `seconds n`: the card's timed effects last n seconds instead (inside `with`: Ganga lasts longer with Shiva). */
  seconds: (seconds) => ({ do: 'seconds', seconds }),
};

// ---------- the helpers the step rule carries effects out with ----------

/** Something an effect can reach: a unit or a banner, where it stands and how much HP it has. */
export type Reachable = { id: number; tile: number; hp: number; isUnit: boolean };

/** Who a `damage` (or any enemy effect) reaches from `atTile`: inside its width, banners only if allowed, then capped by `targets` in `pick` order. */
export function pickTargets(cands: Reachable[], atTile: number, e: { widthTiles?: number; radiusTiles?: number; targets?: number; pick?: Pick; unitsOnly?: boolean }): number[] {
  const half = e.widthTiles !== undefined ? e.widthTiles / 2 : e.radiusTiles ?? Infinity;
  const near = (c: Reachable) => Math.abs(c.tile - atTile);
  const inside = cands.filter((c) => near(c) <= half && (c.isUnit || !e.unitsOnly));
  const order = e.pick === 'highest-hp' ? (a: Reachable, b: Reachable) => b.hp - a.hp || near(a) - near(b) : (a: Reachable, b: Reachable) => near(a) - near(b) || a.id - b.id;
  return inside.sort(order).slice(0, e.targets ?? inside.length).map((c) => c.id);
}

/** Where a unit facing `facing` (+1 walks right, -1 left) ends up after a knockback, kept inside the lane. */
export const knockedTo = (tile: number, tiles: number, facing: 1 | -1, laneTiles: number) => Math.min(laneTiles, Math.max(0, tile - facing * tiles));

/** Where a pulled enemy at `tile` ends up, pulled toward `fromTile` but never past it. */
export const pulledTo = (tile: number, fromTile: number, tiles: number) => (tile > fromTile ? Math.max(fromTile, tile - tiles) : Math.min(fromTile, tile + tiles));

/** Prana after a gain, held to the maximum. */
export const gainPrana = (prana: number, amount: number, max: number) => Math.min(max, prana + amount);
