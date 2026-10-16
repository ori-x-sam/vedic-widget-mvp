// THE single source of colour for Kalinga Rush (brief §4.1–4.4, §4.11).
// No other source file may contain a colour literal — `npm run lint:colours`
// fails the build if one appears. Everything else derives from these tokens.

import { mix } from '../lib/colour';

// §4.1 Frame & UI colours (sampled from the reference — keep them)
export const FRAME = {
  frame: '#4B211A', // page background
  frameEdge: '#34140F', // vignette / deepest edges
  cream: '#F4ECD8', // headlines, first title word, signboard titles
  gold: '#D9BB6C', // date line, URL, small rules
  peach: '#E0B09A', // top label
  peachTitle: '#D89C80', // second title word ("Rush")
} as const;

// §4.2 Scene palette — retro Indian textbook colours
export const SCENE = {
  sindoor: '#E8361F', // vermilion: Taapoi's frock border, flags, chariot canopies
  haldi: '#FFC926', // turmeric: palm-leaf records, sun, lamps
  marigold: '#FF9414', // diya flames, garlands, festivals
  rani: '#E62C7E', // rani pink: festivals, Act VI lead
  tota: '#38A845', // parrot green: paddy, palms, banana leaves
  peacock: '#00909A', // peacock teal: sea, lagoon, Act I lead
  neel: '#26389A', // indigo: night skies, blueprints, Act IV
  seafoam: '#86D5C4', // surf, Chilika shallows, pale skies
  laterite: '#B4502F', // laterite & terracotta: earth, huts, boats, early temples
  khondalite: '#776A60', // temple stone
  limewhite: '#F6EFE0', // lime-white temple, cotton, foam, cowries
  chandan: '#D38B55', // warm skin
  skyCream: '#F1DDB4', // warm old-paper sky
} as const;

// Act VII only. The colour QA fails if these appear before the twist.
export const NEON = {
  neonRani: '#FF3D9A',
  neonCyan: '#29E3E3',
} as const;

// Named in the brief but not in the §4.2 table: the "ink" canopy of
// Darpadalana (Record 18) and Pattachitra lamp-black (§4.5). A warm
// near-black, never neutral.
export const EXTRA = {
  ink: '#2A1913',
} as const;

export type FrameToken = keyof typeof FRAME;
export type SceneToken = keyof typeof SCENE;
export type NeonToken = keyof typeof NEON;
export type AnyToken = FrameToken | SceneToken | NeonToken | keyof typeof EXTRA;

export const TOKENS: Record<AnyToken, string> = { ...FRAME, ...SCENE, ...NEON, ...EXTRA };

// Shorthand used by painters: P.peacock, P.frame, …
export const P = TOKENS;

// §4.4 Chapter palettes (lead first)
export type ActNum = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export interface ChapterPalette {
  act: ActNum;
  name: string;
  lead: SceneToken | 'neel';
  supports: AnyToken[];
  note: string;
}
export const CHAPTERS: Record<ActNum, ChapterPalette> = {
  1: { act: 1, name: 'Kalinga Sagar', lead: 'peacock', supports: ['seafoam', 'laterite', 'haldi'], note: 'sea and sun' },
  2: { act: 2, name: 'Temple Coast', lead: 'laterite', supports: ['marigold', 'khondalite', 'tota'], note: '+ limewhite at Puri; khondalite at Konark' },
  3: { act: 3, name: 'Gajapati', lead: 'sindoor', supports: ['haldi', 'neel', 'tota'], note: 'Pattachitra and Pipili reds and yellows' },
  4: { act: 4, name: 'Company & Resistance', lead: 'neel', supports: ['khondalite', 'skyCream'], note: 'faded indigo + sepia, almost duotone; 22 & 26 near-monochrome; 25 floods back' },
  5: { act: 5, name: 'Naya Odisha', lead: 'marigold', supports: ['peacock', 'sindoor', 'tota'], note: '28 = indigo blueprint; 31 = storm-grey + indigo' },
  6: { act: 6, name: 'Odisha, Now', lead: 'rani', supports: ['peacock', 'haldi', 'tota'], note: 'the brightest scenes' },
  7: { act: 7, name: 'The Future', lead: 'neel', supports: ['haldi', 'neonRani', 'neonCyan'], note: 'F7 returns to the classic palette' },
};

// Derived colours that are still "palette" colours (tints/shades of tokens).
export const DERIVED = {
  sepia: mix(SCENE.khondalite, SCENE.chandan, 0.35),
  stormGrey: mix(SCENE.khondalite, SCENE.neel, 0.3),
  shadowWarm: mix(SCENE.laterite, EXTRA.ink, 0.55),
  shadowCool: mix(SCENE.neel, EXTRA.ink, 0.35),
} as const;

// §4.3 rule 4 — fixed colours so the player and collectibles always pop.
export const FIXED = {
  taapoi: {
    skin: SCENE.chandan,
    skinShade: mix(SCENE.chandan, SCENE.laterite, 0.5),
    frock: SCENE.limewhite,
    frockShade: mix(SCENE.limewhite, SCENE.skyCream, 0.7),
    border: SCENE.sindoor,
    accent: SCENE.haldi,
    hair: EXTRA.ink,
    jasmine: SCENE.limewhite,
    ribbon: SCENE.sindoor,
    cheek: SCENE.rani,
  },
  record: { leaf: SCENE.haldi, leafShade: mix(SCENE.haldi, SCENE.marigold, 0.45), string: SCENE.sindoor, script: mix(SCENE.laterite, EXTRA.ink, 0.35) },
  cowrie: { shell: SCENE.limewhite, shade: mix(SCENE.limewhite, SCENE.chandan, 0.4), mouth: mix(SCENE.laterite, EXTRA.ink, 0.45) },
  diya: { body: SCENE.laterite, rim: mix(SCENE.laterite, EXTRA.ink, 0.35), flame: SCENE.marigold, core: SCENE.haldi },
  // Hazards: a dark rim in a colour distinct from every scene lead (§4.3 rule 7).
  hazardRim: FRAME.frameEdge,
} as const;

// UI colours derived from the frame tokens (used by CSS via custom properties).
export const UI = {
  creamMuted: mix(FRAME.cream, FRAME.frame, 0.3), // teaser text
  line: mix(FRAME.cream, FRAME.frame, 0.55), // thin edge lines around the game window
  card: FRAME.cream, // textbook page
  cardInk: FRAME.frame, // text on the page (11.7:1)
  cardMuted: mix(FRAME.frame, FRAME.cream, 0.28),
  cardTint: mix(SCENE.seafoam, FRAME.cream, 0.55), // "Did you know?" box
  cardRule: mix(SCENE.khondalite, FRAME.cream, 0.45),
  cardDate: mix(SCENE.laterite, FRAME.frame, 0.45),
  stamp: SCENE.sindoor,
  pill: mix(FRAME.frame, FRAME.frameEdge, 0.5),
} as const;

// Every text/background pair the UI uses. The contrast unit test asserts
// WCAG AA (4.5:1, or 3:1 when `large` is true) for each.
export interface TextPair { name: string; fg: string; bg: string; large?: boolean }
export const UI_TEXT_PAIRS: TextPair[] = [
  { name: 'headline cream on frame', fg: FRAME.cream, bg: FRAME.frame },
  { name: 'date gold on frame', fg: FRAME.gold, bg: FRAME.frame },
  { name: 'label peach on frame', fg: FRAME.peach, bg: FRAME.frame },
  { name: 'title "Rush" peachTitle on frame', fg: FRAME.peachTitle, bg: FRAME.frame, large: true },
  { name: 'teaser creamMuted on frame', fg: UI.creamMuted, bg: FRAME.frame },
  { name: 'HUD cream on pill', fg: FRAME.cream, bg: UI.pill },
  { name: 'HUD gold on pill', fg: FRAME.gold, bg: UI.pill },
  { name: 'signboard gold on frame', fg: FRAME.gold, bg: FRAME.frame },
  { name: 'signboard cream on frameEdge', fg: FRAME.cream, bg: FRAME.frameEdge },
  { name: 'lesson text frame on cream', fg: UI.cardInk, bg: UI.card },
  { name: 'lesson muted on cream', fg: UI.cardMuted, bg: UI.card },
  { name: 'lesson date on cream', fg: UI.cardDate, bg: UI.card },
  { name: 'did-you-know text on tint', fg: UI.cardInk, bg: UI.cardTint },
  { name: 'button frame-on-gold', fg: FRAME.frame, bg: FRAME.gold },
  { name: 'button cream on frame', fg: FRAME.cream, bg: FRAME.frame },
];

/** CSS custom properties, injected into index.html at build time by vite.config.ts. */
export function cssTokens(): Record<string, string> {
  const out: Record<string, string> = {};
  const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  for (const [k, v] of Object.entries(TOKENS)) out[`--${kebab(k)}`] = v;
  for (const [k, v] of Object.entries(UI)) out[`--ui-${kebab(k)}`] = v;
  out['--diya-body'] = FIXED.diya.body;
  out['--diya-rim'] = FIXED.diya.rim;
  out['--diya-flame'] = FIXED.diya.flame;
  out['--diya-core'] = FIXED.diya.core;
  out['--cowrie-shell'] = FIXED.cowrie.shell;
  out['--cowrie-shade'] = FIXED.cowrie.shade;
  out['--cowrie-mouth'] = FIXED.cowrie.mouth;
  out['--leaf'] = FIXED.record.leaf;
  out['--leaf-shade'] = FIXED.record.leafShade;
  out['--leaf-string'] = FIXED.record.string;
  out['--leaf-script'] = FIXED.record.script;
  return out;
}

export function cssTokenBlock(): string {
  return `:root{${Object.entries(cssTokens()).map(([k, v]) => `${k}:${v}`).join(';')}}`;
}
