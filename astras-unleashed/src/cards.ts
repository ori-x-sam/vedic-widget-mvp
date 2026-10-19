// Triggers, and the one registry a card's words are read with. A bare word under a card is Nitya (always on); a trigger
// wraps words that happen at a moment or under a condition, and is itself a word with a block:
//   avahana { leap }                  when it is played
//   visarjana { discount-next 1 }     when it returns to light
//   every 8 first=0 { pull 3 ... }    every 8 s while on the field (first at `first`, default one period in)
//   with "rama" { dmg 0.25 }          while an ally with that id or tag shares its lane; a word it already has takes the new value
import { word, type Maker } from './content-load';
import { EFFECT_WORDS } from './effects';
import { STAT_WORDS, UNIT_WORDS, type Ability } from './units';

export const TRIGGERS: Record<string, Maker<Ability>> = {
  /** `avahana { words }`: when it is played (a god, after it lands; an Astra, after its vision). */
  avahana: word({ block: true }, (_, __, abilities: Ability[]) => ({ hook: 'avahana', abilities })),
  /** `visarjana { words }`: when it returns to light. */
  visarjana: word({ block: true }, (_, __, abilities: Ability[]) => ({ hook: 'visarjana', abilities })),
  /** `every s first= { words }`: every s seconds while it is on the field; the first time at `first` seconds (default s). */
  every: word({ args: ['n'], opts: { first: 'n?' }, block: true }, ([everyS], o, abilities: Ability[]) => ({ hook: 'every', everyS, firstS: o.first ?? everyS, abilities })),
  /** `with "id-or-tag" { words }`: while an ally with that id or tag shares its lane. */
  with: word({ args: ['s'], block: true }, ([match], _, abilities: Ability[]) => ({ hook: 'with', match, abilities })),
};

/** Effect words as abilities, so a card's words (and a trigger's block) are one list. */
const EFFECTS_AS_ABILITIES: Record<string, Maker<Ability>> = Object.fromEntries(Object.entries(EFFECT_WORDS).map(([name, make]) => [name,
  typeof make === 'function'
    ? Object.defineProperty((...args: number[]): Ability => ({ hook: 'effect', effect: make(...args) }), 'length', { value: make.length })
    : { sig: make.sig, make: (a: unknown[], o: Record<string, unknown>, b: never[]): Ability => ({ hook: 'effect', effect: make.make(a, o, b) }) },
]));

/** Every word a card may use: its body, its unit rules, its effects and the triggers. */
export const CARD_WORDS: Record<string, Maker<Ability>> = { ...STAT_WORDS, ...UNIT_WORDS, ...EFFECTS_AS_ABILITIES, ...TRIGGERS };
