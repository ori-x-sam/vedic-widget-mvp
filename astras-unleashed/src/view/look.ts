// Look numbers: the arena's camera tilt, how big the gods stand and how they move, the yuga grade's strength, and the
// finish (grain, cast, halftone, haze, misregister). They live as `--look-*` tokens in screens/shared.css :root beside the palette, so
// the render is tuned in the stylesheet; this is the typed view the shell reads (`--look-misregister-px` is
// `LOOK.MISREGISTER_PX`). Catalog: ## Look.
import { TOKENS } from '../tokens';

const KEYS = ['GRAIN', 'WARM_CAST', 'HALFTONE', 'HALFTONE_DOT_PX', 'DEPTH_HAZE', 'GRADE_MIX', 'VIGNETTE', 'MISREGISTER_PX', 'MISREGISTER_MS',
  'ARENA_TILT', 'UNIT_HEIGHT_PX', 'WALK_BOUNCE_PX', 'WALK_STEPS_PER_S', 'STRIKE_LUNGE_PX'] as const;
export type LookKey = (typeof KEYS)[number];

/** The token a look key reads: `MISREGISTER_PX` is `--look-misregister-px`. */
export const lookToken = (k: string) => `--look-${k.toLowerCase().replaceAll('_', '-')}`;

/** A look token's number; throws naming the token when it's missing or isn't a number. */
function read(k: string): number {
  const raw = TOKENS[lookToken(k)], v = raw === undefined ? NaN : Number(raw);
  if (Number.isNaN(v)) throw new Error(`look: \`${lookToken(k)}\` in shared.css :root is ${raw === undefined ? 'missing' : `"${raw}", not a number`}`);
  return v;
}

export const LOOK = Object.fromEntries(KEYS.map((k) => [k, read(k)])) as Record<LookKey, number>;
/** Every look key the shell reads (the catalog test checks no token goes unread). */
export const LOOK_KEYS: string[] = [...KEYS];
