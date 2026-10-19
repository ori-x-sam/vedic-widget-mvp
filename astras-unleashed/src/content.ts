// Content kinds: class, card, token, kshetra, yuga, dhvaja, team, deck-rules, deck-limit, deck, bot, katha, emote. Each is
// a zod schema handed to loadKdl, so the schema is the type and the only parser; behaviour words attach through
// `combinators()` with the registry of the module that owns the rule. After loading, the cross-checks at the bottom
// make sure every name one file uses exists in another (a deck's cards, a `with` tag, a Katha page's god).
import { z } from 'zod';
import { combinators, loadKdl } from './content-load';
import { CARD_WORDS } from './cards';
import { KSHETRA_WORDS } from './kshetras';
import { statsOf, type Ability } from './units';
import classesKdl from '../content/classes.kdl?raw';
import cardsKdl from '../content/cards.kdl?raw';
import kshetrasKdl from '../content/kshetras.kdl?raw';
import matchKdl from '../content/match.kdl?raw';
import decksKdl from '../content/decks.kdl?raw';
import botsKdl from '../content/bots.kdl?raw';
import kathaKdl from '../content/katha.kdl?raw';
import emotesKdl from '../content/emotes.kdl?raw';

const token = z.string().regex(/^--[\w-]+$/, 'a palette token like "--peacock"');
/** Space-separated words: `tags="shaiva trimurti"`. */
const words = z.string().transform((s) => s.split(/\s+/).filter(Boolean));
const ids = (what: string) => words.pipe(z.array(z.string().regex(/^[a-z][\w-]*$/, `a ${what} id`)));

// ---------- classes and cards ----------

export const ClassSchema = z.strictObject({
  id: z.string(), name: z.string(), english: z.string(), paint: token,
  sigil: z.enum(['shield', 'sword', 'bow', 'flame', 'lotus']), job: z.string(), weak: z.string(),
  children: z.array(z.never()).default([]),
}).transform(({ children: _, ...c }) => c);
export type ClassDef = z.output<typeof ClassSchema>;

/** Astras have no body; every other class walks onto the field. */
const unit = (abilities: Ability[]) => ({ abilities, stats: statsOf(abilities) });

export const CardSchema = z.strictObject({
  id: z.string(), name: z.string(), deva: z.string(), title: z.string(), regional: z.string().optional(),
  class: z.string(), cost: z.number().int().min(0).max(10), tags: words.default([]),
  skin: token.default('--chandan'), attribute: z.string(), line: z.string(),
  children: combinators(CARD_WORDS, 'word'),
}).transform(({ children, ...c }) => ({ ...c, ...unit(children) }));
export type CardDef = z.output<typeof CardSchema>;

export const TokenSchema = z.strictObject({
  id: z.string(), name: z.string(), deva: z.string(), skin: token.default('--chandan'), attribute: z.string(),
  children: combinators(CARD_WORDS, 'word'),
}).transform(({ children, ...t }) => ({ ...t, ...unit(children) }));
export type TokenDef = z.output<typeof TokenSchema>;

// ---------- Kshetras ----------

export const KshetraSchema = z.strictObject({
  id: z.string(), name: z.string(), deva: z.string(), lead: token, support: words.pipe(z.array(token).min(1).max(3)),
  rule: z.string(), scene: z.string(),
  children: combinators(KSHETRA_WORDS, 'Kshetra word').refine((r) => r.length === 1, 'a Kshetra has exactly one rule word'),
}).transform(({ children, ...k }) => ({ ...k, rules: children }));
export type KshetraDef = z.output<typeof KshetraSchema>;

// ---------- the match ----------

export const YugaSchema = z.strictObject({
  id: z.string(), name: z.string(), deva: z.string(), die: z.number().int().min(1).max(4).optional(),
  seconds: z.number().positive(), prana: z.number().positive(), reveal: z.number().int().min(1).max(3).optional(),
  grade: token, sky: token, line: z.string(), overtime: z.boolean().default(false),
  children: z.array(z.never()).default([]),
}).transform(({ children: _, ...y }) => y);
export type YugaDef = z.output<typeof YugaSchema>;

export const DhvajaSchema = z.strictObject({
  id: z.string(), name: z.string(), deva: z.string(), hp: z.number().positive(), hit: z.number().positive(),
  every: z.number().positive(), range: z.number().positive(), tile: z.number().min(0),
  'deploy-to': z.number().positive().optional(), 'all-lanes': z.boolean().default(false),
  children: z.array(z.never()).default([]),
}).transform(({ children: _, 'deploy-to': deployTo, 'all-lanes': allLanes, ...d }) => ({ ...d, deployTo, allLanes }));
export type DhvajaDef = z.output<typeof DhvajaSchema>;

export const TeamSchema = z.strictObject({
  id: z.string(), name: z.string(), deva: z.string(), emblem: z.enum(['disc', 'crescent']), paint: token, trim: token,
  side: z.enum(['left', 'right']), children: z.array(z.never()).default([]),
}).transform(({ children: _, ...t }) => t);
export type TeamDef = z.output<typeof TeamSchema>;

export const DeckRulesSchema = z.strictObject({
  id: z.string(), cards: z.number().int().positive(), hand: z.number().int().positive(), children: z.array(z.never()).default([]),
}).transform(({ children: _, ...r }) => r);
export const DeckLimitSchema = z.strictObject({
  id: z.string(), tag: z.string(), max: z.number().int().min(0), children: z.array(z.never()).default([]),
}).transform(({ children: _, ...l }) => l);

// ---------- decks, bots, Katha, emotes ----------

export const DeckSchema = z.strictObject({
  id: z.string(), name: z.string(), cards: ids('card'), blurb: z.string(), children: z.array(z.never()).default([]),
}).transform(({ children: _, ...d }) => d);
export type DeckDef = z.output<typeof DeckSchema>;

export const BotSchema = z.strictObject({
  id: z.string(), name: z.string(), level: z.enum(['tutorial', 'shishya', 'guru']), deck: z.string(),
  react: z.number().min(0), lanes: z.enum(['lesson', 'random', 'counter']),
  'saves-for-kali': z.boolean(), 'wastes-at-max': z.boolean(), lessons: words.optional(),
  children: z.array(z.never()).default([]),
}).transform(({ children: _, 'saves-for-kali': savesForKali, 'wastes-at-max': wastesAtMax, react, ...b }) => ({ ...b, reactS: react, savesForKali, wastesAtMax }));
export type BotDef = z.output<typeof BotSchema>;

export const KathaSchema = z.strictObject({
  id: z.string(), god: z.string(), page: z.number().int().positive(), label: z.enum(['legend', 'tradition']),
  source: z.string(), verified: z.boolean(), text: z.string(), know: z.string(), fill: z.string().includes('___', { message: 'needs a ___ blank' }),
  answer: z.string(), children: z.array(z.never()).default([]),
}).transform(({ children: _, ...k }) => k);
export type KathaDef = z.output<typeof KathaSchema>;

export const EmoteSchema = z.strictObject({
  id: z.string(), text: z.string(), deva: z.string().optional(), children: z.array(z.never()).default([]),
}).transform(({ children: _, ...e }) => e);

// ---------- loaded ----------

export const CLASSES = loadKdl(classesKdl, { class: ClassSchema }).class;
const cardsFile = loadKdl(cardsKdl, { card: CardSchema, token: TokenSchema });
export const CARDS = cardsFile.card;
export const TOKENS_ON_FIELD = cardsFile.token;
export const KSHETRAS = loadKdl(kshetrasKdl, { kshetra: KshetraSchema }).kshetra;
const match = loadKdl(matchKdl, { yuga: YugaSchema, dhvaja: DhvajaSchema, team: TeamSchema, 'deck-rules': DeckRulesSchema, 'deck-limit': DeckLimitSchema });
export const YUGAS = Object.values(match.yuga);
export const DHVAJAS = match.dhvaja;
export const TEAMS = match.team;
export const DECK_RULES = Object.values(match['deck-rules'])[0]!;
export const DECK_LIMITS = Object.values(match['deck-limit']);
export const DECKS = loadKdl(decksKdl, { deck: DeckSchema }).deck;
export const BOTS = loadKdl(botsKdl, { bot: BotSchema }).bot;
export const KATHA = loadKdl(kathaKdl, { katha: KathaSchema }).katha;
export const EMOTES = loadKdl(emotesKdl, { emote: EmoteSchema }).emote;
export const CARD_IDS = Object.keys(CARDS);

// ---------- queries ----------

export function cardDef(id: string): CardDef {
  const d = CARDS[id];
  if (!d) throw new Error(`unknown card "${id}" (known: ${CARD_IDS.join(', ')})`);
  return d;
}

/** Why a deck breaks the deck rules, or null when it's legal: its size, unknown or repeated cards, a tag over its limit. */
export function deckProblem(cards: string[]): string | null {
  if (cards.length !== DECK_RULES.cards) return `a deck has ${DECK_RULES.cards} cards, not ${cards.length}`;
  const unknown = cards.find((c) => !CARDS[c]);
  if (unknown) return `no card "${unknown}"`;
  const twice = cards.find((c, i) => cards.indexOf(c) !== i);
  if (twice) return `"${twice}" is in the deck twice`;
  for (const l of DECK_LIMITS) {
    const n = cards.filter((c) => CARDS[c]!.tags.includes(l.tag)).length;
    if (n > l.max) return `at most ${l.max} ${l.tag} card${l.max === 1 ? '' : 's'} per deck`;
  }
  return null;
}

// ---------- cross-checks: every name used is defined ----------

function crossCheck(): string[] {
  const out: string[] = [];
  const tags = new Set(Object.values(CARDS).flatMap((c) => c.tags));
  const walk = (owner: string, as: Ability[]) => as.forEach((a) => {
    if (a.hook === 'with' && !CARDS[a.match] && !tags.has(a.match)) out.push(`${owner}: with "${a.match}" names no card or tag`);
    if (a.hook === 'effect' && a.effect.do === 'create' && !TOKENS_ON_FIELD[a.effect.token]) out.push(`${owner}: create "${a.effect.token}" names no token`);
    if ('abilities' in a) walk(owner, a.abilities);
  });
  for (const c of Object.values(CARDS)) {
    if (!CLASSES[c.class]) out.push(`card "${c.id}": no class "${c.class}" (content/classes.kdl has ${Object.keys(CLASSES).join(', ')})`);
    if (c.abilities.filter((a) => a.hook === 'with').length > 1) out.push(`card "${c.id}": at most one \`with\``);
    walk(`card "${c.id}"`, c.abilities);
  }
  for (const d of Object.values(DECKS)) { const p = deckProblem(d.cards); if (p) out.push(`deck "${d.id}": ${p}`); }
  for (const b of Object.values(BOTS)) if (!DECKS[b.deck]) out.push(`bot "${b.id}": no deck "${b.deck}"`);
  for (const k of Object.values(KATHA)) if (!CARDS[k.god]) out.push(`katha "${k.id}": no card "${k.god}"`);
  for (const l of DECK_LIMITS) if (!tags.has(l.tag)) out.push(`deck-limit "${l.id}": no card has the tag "${l.tag}"`);
  if (Object.keys(match['deck-rules']).length !== 1) out.push('content/match.kdl: exactly one deck-rules');
  if (YUGAS.filter((y) => y.overtime).length !== 1 || !YUGAS.at(-1)!.overtime) out.push('content/match.kdl: exactly one overtime yuga, last');
  return out;
}
const problems = crossCheck();
if (problems.length) throw new Error(problems.join('\n'));
