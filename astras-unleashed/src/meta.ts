// What outlives a match, pure: the Katha pages unlocked, your own decks, the settings and the records. The store saves
// it; zod checks a save on load, because saves are untrusted. Nothing here touches the renderer, the store or storage.
import { z } from 'zod';

export const MetaSchema = z.object({
  /** Katha pages unlocked (card ids): a page opens the first time you play its god. */
  katha: z.array(z.string()).default([]),
  /** Decks you built, by name. */
  decks: z.record(z.string(), z.array(z.string())).default({}),
  settings: z.object({
    music: z.boolean().default(true),
    sfx: z.boolean().default(true),
    /** Assist mode: the bot reacts more slowly and your banners have more HP; the report is stamped "Assisted". */
    assist: z.boolean().default(false),
    reducedMotion: z.boolean().default(false),
  }).default({ music: true, sfx: true, assist: false, reducedMotion: false }),
  matches: z.number().int().nonnegative().default(0),
  wins: z.number().int().nonnegative().default(0),
});
export type Meta = z.infer<typeof MetaSchema>;

export const newMeta = (): Meta => MetaSchema.parse({});

/** A save's meta, or null when it isn't one. */
export const parseMeta = (raw: unknown): Meta | null => { const r = MetaSchema.safeParse(raw ?? undefined); return r.success && raw != null ? r.data : null; };

/** The meta with a Katha page unlocked; the same reference when it already was. */
export const unlockKatha = (m: Meta, god: string): Meta => (m.katha.includes(god) ? m : { ...m, katha: [...m.katha, god] });
