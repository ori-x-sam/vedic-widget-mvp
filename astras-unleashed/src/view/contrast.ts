// WCAG contrast for the palette's text pairs: every text colour the game sets on every background it sets it on. The
// unit test holds each pair to AA (4.5:1, or 3:1 for large text: 24 px, or 18.7 px bold); the Palette story shows them.
import { token } from '../tokens';

/** A text/background pair from the palette: what it's for, and whether it's only ever large text. */
export type TextPair = { text: string; bg: string; use: string; large?: boolean };

export const TEXT_PAIRS: TextPair[] = [
  { text: '--cream', bg: '--frame', use: 'headline, card names, signboard titles' },
  { text: '--gold', bg: '--frame', use: 'yuga line, Devanagari names on cards, signboard kicker' },
  { text: '--peach', bg: '--frame', use: 'top label, epithets' },
  { text: '--peach-title', bg: '--frame', use: "the title's second word", large: true },
  { text: '--cream', bg: '--frame-edge', use: 'pause button, the scrim behind a dialog' },
  { text: '--gold', bg: '--frame-edge', use: 'the next-card label on the darkest maroon' },
  { text: '--cream', bg: '--frame-rule', use: 'labels inside pill buttons' },
  { text: '--frame', bg: '--cream', use: 'Katha pages, the Leela Report' },
  { text: '--frame', bg: '--seafoam', use: 'the Katha "Did you know?" box' },
  { text: '--frame', bg: '--sky-cream', use: 'the veiled lane: KSHETRA III · ?' },
  { text: '--cream', bg: '--laterite', use: 'the Prana cost numeral on its diya badge', large: true },
];

/** Pairs the brief asks for that fail AA: shown in the Palette story for a decision, never used until one is made. */
export const FAILING_PAIRS: TextPair[] = [
  { text: '--tota', bg: '--laterite', use: 'a discounted cost numeral (brief §4.7): 1.7:1, unreadable', large: true },
];

/** Relative luminance of 0xRRGGBB (WCAG 2). */
function luminance(c: number): number {
  const ch = (s: number) => { const v = ((c >> s) & 255) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(16) + 0.7152 * ch(8) + 0.0722 * ch(0);
}

/** The contrast ratio of two palette tokens, 1..21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** The AA minimum for a pair. */
export const aaMin = (p: TextPair) => (p.large ? 3 : 4.5);
