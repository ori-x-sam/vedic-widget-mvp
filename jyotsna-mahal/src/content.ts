// Content kinds: everything that exists in the palace, as zod schemas handed to loadKdl, so each schema is the type
// and the only parser. The words a designer writes inside a node (`look`, `use`, `line`, `choose`...) and the effect
// props on them (`gives=`, `opens=`, `suspicion=`...) are listed in the catalog (docs/declarative-ui.md); this module
// turns them into plain data the rules in game.ts read. Numbers that move the two hidden marks are behaviour words
// owned by rewards.ts.
import { z } from 'zod';
import { loadKdl } from './content-load';
import { REWARDS, type Reward } from './rewards';
import castKdl from '../content/cast.kdl?raw';
import thingsKdl from '../content/things.kdl?raw';
import soundsKdl from '../content/sounds.kdl?raw';
import modelsKdl from '../content/models.kdl?raw';
import day1Kdl from '../content/day1.kdl?raw';
import night1Kdl from '../content/night1.kdl?raw';
import day2Kdl from '../content/day2.kdl?raw';
import night2Kdl from '../content/night2.kdl?raw';
import day3Kdl from '../content/day3.kdl?raw';
import night3Kdl from '../content/night3.kdl?raw';
import day4Kdl from '../content/day4.kdl?raw';
import night4Kdl from '../content/night4.kdl?raw';
import day5Kdl from '../content/day5.kdl?raw';
import night5Kdl from '../content/night5.kdl?raw';
import day6Kdl from '../content/day6.kdl?raw';
import endingsKdl from '../content/endings.kdl?raw';

// ---------- small value parsers ----------

/** A space-separated list of ids: `gives="hairpin matchbox"`. */
const ids = z.string().transform((s) => s.split(/\s+/).filter(Boolean));
/** A position on the floor, `"x z"` in world units. */
const xz = z.string().regex(/^-?[\d.]+ -?[\d.]+$/, 'a position like "1.5 -2"').transform((s) => s.split(' ').map(Number) as [number, number]);
const token = z.string().regex(/^--[\w-]+$/, 'a palette token like "--teak"');
const wall = z.enum(['north', 'south', 'east', 'west']);

// ---------- conditions: `if="door-open !bolted-twice has:hairpin knows:new-plaque suspicion>=5 slots<2 after:1:30"`,
// every term must hold ----------

type Op = '>=' | '<=' | '>' | '<';
export type Cond =
  | { kind: 'flag'; name: string; not: boolean }
  | { kind: 'has'; item: string; not: boolean }
  | { kind: 'knows'; clue: string; not: boolean }
  | { kind: 'mark'; mark: 'suspicion' | 'regard'; op: Op; n: number }
  | { kind: 'count'; name: string; op: Op; n: number }
  | { kind: 'after'; min: number; not: boolean };

const cond = z.string().transform((src, ctx): Cond[] => src.split(/\s+/).filter(Boolean).flatMap((term): Cond[] => {
  const m = /^([a-z][\w-]*)(>=|<=|>|<)(-?\d+)$/.exec(term);
  if (m && (m[1] === 'suspicion' || m[1] === 'regard')) return [{ kind: 'mark', mark: m[1], op: m[2] as Op, n: Number(m[3]) }];
  if (m) return [{ kind: 'count', name: m[1]!, op: m[2] as Op, n: Number(m[3]) }];
  const not = term.startsWith('!'), bare = not ? term.slice(1) : term;
  // after:1:30 holds once the pocket watch has passed 1:30 a.m. (hours before noon are the small hours of the night).
  const t = /^after:(\d{1,2}):(\d\d)$/.exec(bare);
  if (t) { const h = Number(t[1]); return [{ kind: 'after', min: (h < 12 ? h + 24 : h) * 60 + Number(t[2]), not }]; }
  if (bare.startsWith('has:')) return [{ kind: 'has', item: bare.slice(4), not }];
  if (bare.startsWith('knows:')) return [{ kind: 'knows', clue: bare.slice(6), not }];
  if (/^[\w:.-]+$/.test(bare)) return [{ kind: 'flag', name: bare, not }];
  ctx.issues.push({ code: 'custom', message: `condition "${term}": expected flag, !flag, has:item, knows:clue, after:H:MM, suspicion>=n or counter<n`, input: src });
  return [];
}));

// ---------- effects: the props any beat, choice or line can carry ----------

export type Effects = {
  if: Cond[]; gives: string[]; takes: string[]; sets: string[]; unsets: string[]; clue: string[];
  opens: string[]; closes: string[]; sound?: string; marks: Reward[]; once: boolean; minutes: number;
  adds: string[]; resets: string[];
};

const EFFECT_PROPS = {
  if: cond.optional(),
  gives: ids.optional(), takes: ids.optional(), sets: ids.optional(), unsets: ids.optional(), clue: ids.optional(),
  opens: ids.optional(), closes: ids.optional(), sound: z.string().optional(),
  suspicion: z.number().optional(), regard: z.number().optional(),
  once: z.boolean().optional(), minutes: z.number().optional(),
  adds: ids.optional(), resets: ids.optional(),
};
type EffectIn = { [K in keyof typeof EFFECT_PROPS]?: z.output<(typeof EFFECT_PROPS)[K]> };

/** Effect props to plain data; the mark numbers become behaviour words from rewards.ts. */
function effects(p: EffectIn): Effects {
  const marks = (['suspicion', 'regard'] as const).flatMap((m) => (p[m] === undefined ? [] : [REWARDS[m]!(p[m]!)]));
  return {
    if: p.if ?? [], gives: p.gives ?? [], takes: p.takes ?? [], sets: p.sets ?? [], unsets: p.unsets ?? [], clue: p.clue ?? [],
    opens: p.opens ?? [], closes: p.closes ?? [], sound: p.sound, marks, once: p.once ?? false, minutes: p.minutes ?? 0,
    adds: p.adds ?? [], resets: p.resets ?? [],
  };
}
export const EFFECT_WORDS = Object.keys(EFFECT_PROPS);

// ---------- children: a node's lines as words, each word its own schema over { args, props } ----------

const Child = z.strictObject({ name: z.string(), args: z.array(z.unknown()), props: z.record(z.string(), z.unknown()) });

/** Schema over a node's children: each child is one of `words` (name -> schema of its args and props). */
function words<W extends Record<string, z.ZodType>>(what: string, table: W) {
  type Out = { [K in keyof W]: { word: K } & z.output<W[K]> }[keyof W];
  return z.array(Child).transform((cs, ctx): Out[] => cs.flatMap((c, i): Out[] => {
    const s = Object.hasOwn(table, c.name) ? table[c.name] : undefined;
    if (!s) { ctx.issues.push({ code: 'custom', message: `unknown ${what} "${c.name}" (known: ${Object.keys(table).join(', ')})`, input: c, path: [i] }); return []; }
    const r = s.safeParse({ args: c.args, props: c.props });
    if (!r.success) { for (const iss of r.error.issues) ctx.issues.push({ code: 'custom', message: `${c.name}: ${iss.path.join('.')}: ${iss.message}`, input: c, path: [i] }); return []; }
    return [{ word: c.name, ...(r.data as object) } as Out];
  }));
}

/** A word whose args are `[text]` (or `[key, text]` when `key` is set) and whose props are effects plus `extra`. */
const said = <E extends z.ZodRawShape>(keyed: boolean, extra: E = {} as E) => z.strictObject({
  args: keyed ? z.tuple([z.string(), z.string()]) : z.tuple([z.string()]),
  props: z.strictObject({ ...EFFECT_PROPS, ...extra }),
}).transform(({ args, props }) => {
  const rest = Object.fromEntries(Object.entries(props).filter(([k]) => Object.hasOwn(extra, k))) as { [K in keyof E]: z.output<E[K]> };
  return { key: keyed ? args[0] : undefined, text: keyed ? args[1]! : args[0]!, does: effects(props as EffectIn), ...rest };
});

// ---------- the cast, things and clues ----------

export const PersonSchema = z.strictObject({
  id: z.string(), name: z.string(),
  /** What the dialogue box calls them. */
  short: z.string(),
  /** Their name's colour in dialogue: a palette token. */
  paint: token,
  /** Their signature non-verbal sound (content/sounds.kdl), played with their first line of a beat. */
  sound: z.string().optional(),
  children: z.array(z.never()).length(0),
});

export const ItemSchema = z.strictObject({ id: z.string(), name: z.string(), blurb: z.string(), children: z.array(z.never()).length(0) });

/** Two items in the pockets become a third: `recipe "bend-hairpin" from="hairpin tripod-leg" makes="bolt-hook" says="..."`. */
export const RecipeSchema = z.strictObject({ id: z.string(), makes: z.string(), from: ids.refine((l) => l.length === 2, 'two items'), says: z.string(), sound: z.string().optional(), clue: ids.optional(), children: z.array(z.never()).length(0) });

export const PAGES = ['evidence', 'photograph', 'testimony', 'note'] as const;
export const ClueSchema = z.strictObject({ id: z.string(), page: z.enum(PAGES), title: z.string(), text: z.string(), children: z.array(z.never()).length(0) });

/** Thistlewood's stock lines for the touches that need no script of their own (a wrong item, an empty photograph). */
export const RemarkSchema = z.strictObject({ id: z.string(), text: z.string(), children: z.array(z.never()).length(0) });

// ---------- sound and models: compositions of the synth's instruments and the model files ----------

export const SoundSchema = z.strictObject({
  id: z.string(),
  /** The instrument (src/audio.ts): knock, thud, noise, howl, roar, bell, chime, click, laugh, sniff, puff, flutter, shot, drone. */
  play: z.string(),
  /** Pitch, Hz: the instrument's base note. */
  hz: z.number().positive().default(220),
  /** Loudness, 0..1. */
  gain: z.number().min(0).max(1).default(0.5),
  /** Length of one hit, s. */
  len: z.number().positive().default(0.3),
  /** Hits in a row, and the time from one hit's start to the next, s. */
  times: z.number().int().positive().default(1),
  gap: z.number().nonnegative().default(0.4),
  children: z.array(z.never()).length(0),
});

/** A model file (models/<id>.py -> .glb) and the palette tokens its four materials are tinted with. */
export const ModelSchema = z.strictObject({
  id: z.string(), body: token, trim: token.optional(), cloth: token.optional(), glow: token.optional(),
  /** Uniform scale at placement (models are built in metres, so usually 1). */
  scale: z.number().positive().default(1),
  children: z.array(z.never()).length(0),
});

/** An end card: `ending "id" title= text=`, shown after a scene `ends "ending" ending="id"`. */
export const EndingSchema = z.strictObject({ id: z.string(), title: z.string(), text: z.string(), children: z.array(z.never()).length(0) });

// ---------- the days: scenes made of beats ----------

/** A day scene: where it happens (a `place`) and its first beat. */
export const SceneSchema = z.strictObject({ id: z.string(), day: z.number().int(), place: z.string(), first: z.string(), name: z.string().optional(), children: z.array(z.never()).length(0) });

/** Where a scene happens: a set the view knows how to build, its light, and who is there. */
export const PlaceSchema = z.strictObject({
  id: z.string(),
  /** The view's set builder (src/view/sets.ts): jungle-road, verandah, wing. */
  set: z.string(),
  /** Which light: day (white, close to overexposed), dusk, night. */
  light: z.enum(['day', 'dusk', 'night']),
  /** The scenery rolls past (the jeep under way), except while doe-showing is set. */
  moving: z.boolean().default(false),
  children: words('place word', {
    /** `sits "raja" at="x z" turn=deg y=0.9 model="raja"`: a person placed in the set (their model is their id unless named). */
    sits: z.strictObject({ args: z.tuple([z.string()]), props: z.strictObject({ at: xz, turn: z.number().default(0), y: z.number().default(0), model: z.string().optional() }) }).transform(({ args, props }) => ({ who: args[0]!, ...props, model: props.model ?? args[0]! })),
    /** `prop "jeep" at="x z" turn=deg y=0`: a model placed in the set. */
    prop: z.strictObject({ args: z.tuple([z.string()]), props: z.strictObject({ at: xz, turn: z.number().default(0), y: z.number().default(0), if: cond.optional() }) }).transform(({ args, props }) => ({ model: args[0]!, ...props, if: props.if ?? [] })),
    /** `eye at="x z" y=1.2 turn=deg`: where the player's eye sits (no eye: the view stays where it was). */
    eye: z.strictObject({ args: z.tuple([]), props: z.strictObject({ at: xz, y: z.number(), turn: z.number().default(0) }) }).transform(({ props }) => props),
  }),
});

export const BeatSchema = z.strictObject({
  id: z.string(), scene: z.string(),
  /** A beat with choices and a timer: when it runs out, `timeout` happens (a beat id). */
  'timer-s': z.number().positive().optional(), timeout: z.string().optional(),
  children: words('beat word', {
    /** `line "raja" "text"`: someone speaks (`narrator` is the prose; `thistlewood` is the player). */
    line: said(true),
    /** `choose "text" go="beat"`: a choice for the player, with effects. */
    choose: said(false, { go: z.string().optional(), ends: z.string().optional() }),
    /** `does sets=... sound=...`: effects as the beat starts, no text. */
    does: z.strictObject({ args: z.tuple([]), props: z.strictObject(EFFECT_PROPS) }).transform(({ props }) => ({ does: effects(props) })),
    /** `go "beat"`: after the last line, the next beat (first one whose `if` holds). */
    go: z.strictObject({ args: z.tuple([z.string()]), props: z.strictObject({ if: cond.optional() }) }).transform(({ args, props }) => ({ to: args[0]!, if: props.if ?? [] })),
    /** `ends "night"`: after the last line the scene ends: `night` (tonight's wing), `back-to-room` (caught), `resume`
        (a scene met in the wing: back to walking it), `ending` (the game ends). */
    ends: z.strictObject({ args: z.tuple([z.enum(['night', 'back-to-room', 'morning', 'resume', 'ending'])]), props: z.strictObject({ if: cond.optional(), ending: z.string().optional() }) }).transform(({ args, props }) => ({ how: args[0]!, if: props.if ?? [], ending: props.ending })),
  }),
});

// ---------- the nights: the wing's rooms, doors, spots, the watchman, hints and the deduction ----------

export const NightSchema = z.strictObject({
  id: z.string(), n: z.number().int(), name: z.string(),
  /** The moon: fullness 0..1, height above the horizon and bearing (deg, 0 north, 90 east). */
  moon: z.number().min(0).max(1), 'moon-alt': z.number(), 'moon-az': z.number(),
  /** Where the player wakes: a room, a position, a heading (deg, 0 north, 90 east). */
  start: z.string(), at: xz, turn: z.number().default(0),
  /** The deduction that proves the night, and the scene that follows its bed. */
  proves: z.string(), then: z.string(),
  /** The scene played when Bhima catches the player. */
  caught: z.string(),
  children: words('night word', {
    /** `begins if=... sets=...`: effects when the night starts (a suspicious Raja bolts the door twice). */
    begins: z.strictObject({ args: z.tuple([]), props: z.strictObject(EFFECT_PROPS) }).transform(({ props }) => ({ does: effects(props) })),
    /** `on-caught closes=... unsets=...`: what Bhima puts right when he walks the player back to the start. */
    'on-caught': z.strictObject({ args: z.tuple([]), props: z.strictObject(EFFECT_PROPS) }).transform(({ props }) => ({ does: effects(props) })),
    /** `when if="m1 m2 m3" "text" sets=...`: fires once, by itself, the moment its condition holds (a beam that lands
        once three mirrors are turned, a jaali's shadow at the moon's height). */
    when: said(false),
  }),
});

const ARCH = z.strictObject({ wall, at: z.number().default(0), w: z.number().positive(), h: z.number().positive(), y: z.number().default(0) });
export const RoomSchema = z.strictObject({
  id: z.string(), night: z.number().int(), name: z.string(),
  /** The room's centre and size on the floor plan, world units (about a metre); h is the ceiling height. */
  x: z.number(), z: z.number(), w: z.number().positive(), d: z.number().positive(), h: z.number().positive(),
  /** Surface words (src/view/surfaces.ts): marble, sandstone, plaster, wallpaper, teak, brick. */
  floor: z.string(), walls: z.string(),
  /** How lit the room is without a candle, 0..1 (moonlight through its windows does the rest). */
  dark: z.number().min(0).max(1).default(0.5),
  /** The floor's height, u: a stepwell's landings go down, a roof goes up. */
  y: z.number().default(0),
  /** Open to the sky: no ceiling (a roof, a courtyard). */
  open: z.boolean().default(false),
  children: words('room word', {
    /** `jaali wall="east" at=0 w=1.2 h=1.6 y=0.8`: a pierced stone window the moon shines through. */
    jaali: z.strictObject({ args: z.tuple([]), props: ARCH.extend({ moon: z.boolean().default(true) }) }).transform(({ props }) => props),
    /** `transom wall="north" at=0 w=1.2 h=0.5 y=2.6`: a jaali over a door. */
    transom: z.strictObject({ args: z.tuple([]), props: ARCH }).transform(({ props }) => props),
    /** `prop "charpoy" at="x z" turn=deg y=0 solid=r`: scenery; `solid` blocks walking within r. */
    prop: z.strictObject({ args: z.tuple([z.string()]), props: z.strictObject({ at: xz, turn: z.number().default(0), y: z.number().default(0), solid: z.number().optional(), if: cond.optional() }) }).transform(({ args, props }) => ({ model: args[0]!, ...props, if: props.if ?? [] })),
    /** `lamp at="x z" y=2 kind="diya" if=...`: a flame's amber pool (`bulb`: the dynamo's light), lit while `if` holds. */
    lamp: z.strictObject({ args: z.tuple([]), props: z.strictObject({ at: xz, y: z.number(), kind: z.enum(['diya', 'hanging', 'candle', 'bulb']).default('diya'), if: cond.optional() }) }).transform(({ props }) => ({ ...props, if: props.if ?? [] })),
  }),
});

export const DoorSchema = z.strictObject({
  id: z.string(), name: z.string(),
  /** On which wall of which room, offset along it from the wall's middle; and the room on the other side. */
  from: z.string(), wall, at: z.number().default(0), to: z.string(),
  w: z.number().positive().default(1.1), h: z.number().positive().default(2.4),
  /** Open at the start of the night (an archway is always open). */
  open: z.boolean().default(false),
  /** An archway has no leaf. */
  arch: z.boolean().default(false),
  children: z.array(z.never()).length(0),
});

export const SpotSchema = z.strictObject({
  id: z.string(), room: z.string(), name: z.string(),
  /** Where it stands; y is the height of its middle (what the eye aims at); r how far it reaches around that point. */
  at: xz, y: z.number().default(1), r: z.number().positive().default(0.5),
  /** Its model and heading (deg, 0 north), and a radius that blocks walking. */
  model: z.string().optional(), turn: z.number().default(0), solid: z.number().optional(),
  children: words('spot word', {
    /** `look "text"`: touching it with empty hands. */
    look: said(false),
    /** `use "item" "text"`: touching it with an item in hand. */
    use: said(true),
    /** `photo "text"`: photographing it. */
    photo: said(false),
    /** `code "a b c d" answer="d c b a" learns="spot spot" "text"`: dials with those faces; the right order fires it.
        `learns` names the spots that teach the answer (the solver insists they were seen first); `wrong="text"` is
        what a wrong turn says, instead of the stock line. */
    code: said(true, { answer: ids, learns: ids, dials: z.number().int().positive(), wrong: z.string().optional() }),
    /** `hide "text"`: step into it, out of the watchman's sight until you move. */
    hide: said(false),
    /** `bed "text"`: lie down: the night ends (only once its deduction is proved: use if=). */
    bed: said(false),
    /** `talk "scene" "text"`: touching it begins a scene (someone met in the dark); the scene ends with `resume`. */
    talk: said(true),
    /** `pose if="trunk-at-door" at="x z" turn=deg`: where it stands, or which way it faces, once the condition holds. */
    pose: z.strictObject({ args: z.tuple([]), props: z.strictObject({ if: cond, at: xz.optional(), turn: z.number().optional(), y: z.number().optional() }) }).transform(({ props }) => props),
  }),
});

/** The watchman's round: `stop "room" at="x z" wait=s` in order, looping. */
export const PatrolSchema = z.strictObject({
  id: z.string(), night: z.number().int(), who: z.string(),
  /** Only on the round when this holds at the night's start (a suspicious Raja sends a second lantern). */
  if: cond.optional(),
  /** Walking speed, u/s. */
  speed: z.number().positive(),
  children: words('patrol word', {
    stop: z.strictObject({ args: z.tuple([z.string()]), props: z.strictObject({ at: xz, wait: z.number().nonnegative().default(0) }) }).transform(({ args, props }) => ({ room: args[0]!, ...props })),
  }),
});

/** Thistlewood thinking aloud when stuck: shown after `after-s` without progress while `until` doesn't hold yet. */
export const HintSchema = z.strictObject({ id: z.string(), night: z.number().int(), until: cond, 'after-s': z.number().positive(), text: z.string(), children: z.array(z.never()).length(0) });

/** The casebook page that proves the night: every `ask` answered right at once (never one by one). */
export const DeductionSchema = z.strictObject({
  id: z.string(), night: z.number().int(), title: z.string(),
  /** Shown when proved: what it changes about someone, and the question it leaves. */
  reveal: z.string(), question: z.string(),
  children: words('deduction word', {
    /** `ask "text" options="a | b" answer="b" from="clue clue"`: opens once every `from` clue is in the casebook. */
    ask: z.strictObject({ args: z.tuple([z.string()]), props: z.strictObject({ options: z.string().transform((s) => s.split('|').map((o) => o.trim())), answer: z.string(), from: ids }) })
      .transform(({ args, props }) => ({ text: args[0]!, ...props }))
      .refine((a) => a.options.includes(a.answer), 'answer must be one of the options'),
  }),
});

// ---------- loading ----------

const KINDS = {
  person: PersonSchema, item: ItemSchema, recipe: RecipeSchema, clue: ClueSchema, remark: RemarkSchema,
  sound: SoundSchema, model: ModelSchema, scene: SceneSchema, place: PlaceSchema, beat: BeatSchema,
  night: NightSchema, room: RoomSchema, door: DoorSchema, spot: SpotSchema, patrol: PatrolSchema, hint: HintSchema, deduction: DeductionSchema, ending: EndingSchema,
};
type Kinds = typeof KINDS;
export type Content = { [K in keyof Kinds]: Record<string, z.output<Kinds[K]>> };

/** Every content file, by name (the name is only for error messages). */
export const FILES: Record<string, string> = {
  'cast.kdl': castKdl, 'things.kdl': thingsKdl, 'sounds.kdl': soundsKdl, 'models.kdl': modelsKdl,
  'day1.kdl': day1Kdl, 'night1.kdl': night1Kdl, 'day2.kdl': day2Kdl, 'night2.kdl': night2Kdl, 'day3.kdl': day3Kdl, 'night3.kdl': night3Kdl, 'day4.kdl': day4Kdl, 'night4.kdl': night4Kdl, 'day5.kdl': day5Kdl, 'night5.kdl': night5Kdl, 'day6.kdl': day6Kdl,
  'endings.kdl': endingsKdl,
};

/** Load and merge content files. Within a file ids are unique across kinds (loadKdl); across files, within a kind. */
export function loadContent(files: Record<string, string>): Content {
  const out = Object.fromEntries(Object.keys(KINDS).map((k) => [k, {}])) as Content;
  const seen = new Map<string, string>(); // "kind id" -> file
  for (const [file, src] of Object.entries(files)) {
    let got;
    try { got = loadKdl(src, { person: PersonSchema, item: ItemSchema, recipe: RecipeSchema, clue: ClueSchema, remark: RemarkSchema, sound: SoundSchema, model: ModelSchema, scene: SceneSchema, place: PlaceSchema, beat: BeatSchema, night: NightSchema, room: RoomSchema, door: DoorSchema, spot: SpotSchema, patrol: PatrolSchema, hint: HintSchema, deduction: DeductionSchema, ending: EndingSchema }); }
    catch (e) { throw new Error(`content/${file}: ${(e as Error).message}`); }
    for (const kind of Object.keys(KINDS) as (keyof Kinds)[]) {
      for (const [id, v] of Object.entries(got[kind])) {
        const prev = seen.get(`${kind} ${id}`);
        if (prev) throw new Error(`content/${file}: ${kind} "${id}": duplicate id (also in ${prev})`);
        seen.set(`${kind} ${id}`, `content/${file}`);
        (out[kind] as Record<string, unknown>)[id] = v;
      }
    }
  }
  return out;
}

export const C: Content = loadContent(FILES);

export type Person = z.output<typeof PersonSchema>;
export type Item = z.output<typeof ItemSchema>;
export type Clue = z.output<typeof ClueSchema>;
export type Beat = z.output<typeof BeatSchema>;
export type BeatWord = Beat['children'][number];
export type Night = z.output<typeof NightSchema>;
export type Room = z.output<typeof RoomSchema>;
export type Door = z.output<typeof DoorSchema>;
export type Spot = z.output<typeof SpotSchema>;
export type SpotWord = Spot['children'][number];
export type Patrol = z.output<typeof PatrolSchema>;
export type Deduction = z.output<typeof DeductionSchema>;
export type Place = z.output<typeof PlaceSchema>;
export type Sound = z.output<typeof SoundSchema>;
export type Model = z.output<typeof ModelSchema>;

/** A content record by id, or a thrown error naming what is known. */
export function get<K extends keyof Content>(kind: K, id: string): Content[K][string] {
  const v = C[kind][id] as Content[K][string] | undefined;
  if (!v) throw new Error(`unknown ${kind} "${id}" (known: ${Object.keys(C[kind]).join(', ')})`);
  return v;
}

export const nightOf = (n: number): Night => { const x = Object.values(C.night).find((v) => v.n === n); if (!x) throw new Error(`no night ${n} in content`); return x; };
export const roomsOf = (n: number) => Object.values(C.room).filter((r) => r.night === n);
export const spotsIn = (room: string) => Object.values(C.spot).filter((s) => s.room === room);
export const doorsOf = (n: number) => { const rooms = new Set(roomsOf(n).map((r) => r.id)); return Object.values(C.door).filter((d) => rooms.has(d.from)); };
