// Kshetra words: the one rule a sacred place lays on its lane, equally for both players (`speed-mult 1.25`). Each word is
// a pure function from its arguments to a KshetraRule whose numbers the step rule (Phase 3) applies to that lane only.
// content/kshetras.kdl lists one per Kshetra; the signboard's `rule=` text says the same thing in words.
import { word, type Maker } from './content-load';
import { T } from './tuning';

/** What a card is, for rules that pick cards out: its id, class and tags. */
export type CardKey = { id: string; class: string; tags: string[] };

export type KshetraRule =
  | { rule: 'cost'; cost: (card: CardKey, cost: number) => number }
  | { rule: 'regen'; perS: (maxHp: number) => number }
  | { rule: 'dmg' | 'speed'; mult: number }
  | { rule: 'reach'; reach: (reachTiles: number) => number }
  | { rule: 'dhvaja'; hpMult: number; strikeRateMult: number }
  | { rule: 'amrit'; amount: number; everyS: number }
  | { rule: 'veil'; seconds: number }
  | { rule: 'echo'; frac: number };

/** A card matches a name when it's the card's id, its class or one of its tags. */
export const matches = (card: CardKey, name: string) => card.id === name || card.class === name || card.tags.includes(name);

export const KSHETRA_WORDS: Record<string, Maker<KshetraRule>> = {
  /** `cost-cut "tag" n`: cards with that id, class or tag cost n less played here (never below 0). */
  'cost-cut': word({ args: ['s', 'n'] }, ([name, n]) => ({ rule: 'cost', cost: (card, cost) => (matches(card, name) ? Math.max(0, cost - n) : cost) })),
  /** `regen f`: units here regain f of their maximum HP a second (0.015 = 1.5%). */
  regen: (f) => ({ rule: 'regen', perS: (maxHp) => maxHp * f }),
  /** `dmg-mult m`: all damage dealt here is multiplied by m. */
  'dmg-mult': (mult) => ({ rule: 'dmg', mult }),
  /** `speed-mult m`: units here walk m times as fast. */
  'speed-mult': (mult) => ({ rule: 'speed', mult }),
  /** `reach-cut tiles`: ranged units here reach that much less (never below melee); melee is untouched. */
  'reach-cut': (tiles) => ({ rule: 'reach', reach: (r) => (r > T.MELEE_REACH_TILES ? Math.max(T.MELEE_REACH_TILES, r - tiles) : r) }),
  /** `dhvaja-hp m`: both banners here have m times their HP. */
  'dhvaja-hp': (hpMult) => ({ rule: 'dhvaja', hpMult, strikeRateMult: 1 }),
  /** `dhvaja-haste m`: both banners here strike m times as often. */
  'dhvaja-haste': (strikeRateMult) => ({ rule: 'dhvaja', hpMult: 1, strikeRateMult }),
  /** `amrit n every=s`: every s seconds, each player with a unit here gains n Prana. */
  amrit: word({ args: ['n'], opts: { every: 'n' } }, ([amount], o) => ({ rule: 'amrit', amount, everyS: o.every })),
  /** `veil s`: units placed here can't be targeted by ranged attacks for s seconds. */
  veil: (seconds) => ({ rule: 'veil', seconds }),
  /** `echo f`: the first unit each player places here is echoed once, a copy at f of its HP and damage. */
  echo: (frac) => ({ rule: 'echo', frac }),
};
